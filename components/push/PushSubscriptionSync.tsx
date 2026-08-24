"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSyncPushSubscription } from "./useSyncPushSubscription";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// AIT-57 (hallazgo de auditoría NO-GO ronda 2, "Mayor" #1 — seguía
// abierto tras la ronda 2): la sincronización de la suscripción de Web
// Push con el usuario autenticado NO puede depender de que alguien visite
// /ajustes — PushNotificationsSection solo vive ahí, así que un cambio de
// sesión normal (A cierra sesión desde donde sea — Ajustes o el pie del
// panel de navegación, AppNav.tsx — y B entra y usa cualquier OTRA
// pantalla) dejaba la fila de `pushSubscriptions` apuntando a A: el cron
// podía mandarle a B, en el dispositivo de A, nombres de clientes/pasos/
// oportunidades de A.
//
// Componente sin UI (`return null`), montado una sola vez en
// app/layout.tsx junto a AppNav (mismo criterio: no depende de qué
// pantalla está activa) — vigila el usuario autenticado actual y, en
// cuanto cambia de verdad (incluido pasar de "alguien" a "alguien
// distinto" tras cualquiera de los dos signOut()), si ya hay una
// suscripción de Web Push activa en este navegador, la reasigna en Convex
// al usuario que hay ahora — sin esperar a que abra Ajustes.
//
// Silencioso a propósito si falla (ver el catch más abajo): esto es una
// vigía en segundo plano en TODA la app, no un flujo con botón — si algo
// falla aquí, /ajustes sigue siendo el sitio con feedback visible donde
// reintentarlo a mano.
export function PushSubscriptionSync() {
  const role = useQuery(api.users.getCurrentUserRole);
  const userInfo = useQuery(
    api.users.getCurrentUserInfo,
    role !== null && role !== undefined ? {} : "skip",
  );
  const syncSubscription = useSyncPushSubscription();
  const email = userInfo?.email;
  // A qué usuario ya se sincronizó la suscripción de este dispositivo —
  // para no repetir el trabajo en cada revalidación reactiva de Convex,
  // solo cuando el usuario autenticado CAMBIA de verdad (incluido pasar a
  // null/undefined, p.ej. al cerrar sesión).
  const lastSyncedEmail = useRef<string | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !VAPID_PUBLIC_KEY
    ) {
      return;
    }
    // Rol todavía sin resolver (primer render) — nada que sincronizar
    // hasta saber quién es el usuario actual.
    if (role === undefined) return;
    if (role === null) {
      lastSyncedEmail.current = null;
      return;
    }
    if (email === undefined) return; // userInfo todavía cargando
    if (lastSyncedEmail.current === email) return;

    let cancelled = false;
    async function sync() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const existing = await registration.pushManager.getSubscription();
        if (!existing || cancelled) return;
        await syncSubscription(existing);
        if (!cancelled) lastSyncedEmail.current = email ?? null;
      } catch {
        // Silencioso — ver comentario de arriba.
      }
    }
    void sync();
    return () => {
      cancelled = true;
    };
  }, [role, email, syncSubscription]);

  return null;
}

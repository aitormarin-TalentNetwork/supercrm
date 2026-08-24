"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSyncPushSubscription } from "./useSyncPushSubscription";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// AIT-57 (hallazgo de auditoría NO-GO ronda 2, "Mayor" #1): la
// sincronización de la suscripción de Web Push con el usuario autenticado
// NO puede depender de que alguien visite /ajustes — PushNotificationsSection
// solo vive ahí, así que un cambio de sesión normal (A cierra sesión desde
// donde sea — Ajustes o el pie del panel de navegación, AppNav.tsx — y B
// entra y usa cualquier OTRA pantalla) dejaba la fila de
// `pushSubscriptions` apuntando a A.
//
// AIT-57 (hallazgo de auditoría NO-GO ronda 3, mismo "Mayor" #1, ángulo
// distinto): reasignar solo cuando aparece un usuario NUEVO no basta —
// deja abierta la ventana entre el cierre de sesión de A y el siguiente
// inicio de sesión (que puede no llegar nunca, o tardar, o fallar la
// resincronización): mientras tanto la fila sigue apuntando a A y el
// cron le sigue mandando SUS datos a un dispositivo ya sin nadie
// logueado, o a quien sea que lo mire después sin haber vuelto a pasar
// por la sincronización. Arreglo: en el propio cierre de sesión (role
// pasa a null) se desvincula la suscripción DE INMEDIATO — no se espera
// a que otra cuenta inicie sesión.
//
// Componente sin UI (`return null`), montado una sola vez en
// app/layout.tsx junto a AppNav (mismo criterio: no depende de qué
// pantalla está activa).
export function PushSubscriptionSync() {
  const role = useQuery(api.users.getCurrentUserRole);
  const userInfo = useQuery(
    api.users.getCurrentUserInfo,
    role !== null && role !== undefined ? {} : "skip",
  );
  const syncSubscription = useSyncPushSubscription();
  const unsubscribeMutation = useMutation(api.pushSubscriptions.unsubscribe);
  const email = userInfo?.email;
  // A qué usuario ya se sincronizó la suscripción de este dispositivo —
  // para no repetir el trabajo en cada revalidación reactiva de Convex,
  // solo cuando el usuario autenticado CAMBIA de verdad.
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
    // Rol todavía sin resolver (primer render) — nada que hacer hasta
    // saber quién es el usuario actual.
    if (role === undefined) return;

    let cancelled = false;

    if (role === null) {
      lastSyncedEmail.current = null;
      // AIT-57 (NO-GO ronda 3): sin sesión — desvincula la suscripción de
      // ESTE dispositivo de inmediato, no se deja "colgada" apuntando a
      // quien cerró sesión. Se intenta primero borrar la fila en Convex
      // (para que el cron deje de verla al instante); si esa llamada
      // falla (sin red, por ejemplo), se desuscribe igualmente a nivel de
      // navegador — el endpoint deja de ser válido para el servicio push,
      // así que el próximo intento del cron recibe 404/410 y borra la
      // fila él solo (convex/webPush.ts:sendToUser) — nunca se queda la
      // asociación sensible activa en silencio, como mucho tarda una
      // pasada del cron en autolimpiarse del todo.
      async function unlink() {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (!subscription || cancelled) return;
          try {
            await unsubscribeMutation({ endpoint: subscription.endpoint });
          } catch {
            // Ver comentario de arriba: el navegador se desuscribe de
            // todas formas más abajo, así que esto no deja nada expuesto
            // para siempre, solo hasta el siguiente cron como mucho.
          }
          if (!cancelled) await subscription.unsubscribe();
        } catch {
          // Silencioso a propósito: vigía en segundo plano, no un flujo
          // con botón — /ajustes sigue siendo el sitio con feedback
          // visible si alguien quiere confirmar el estado a mano.
        }
      }
      void unlink();
      return () => {
        cancelled = true;
      };
    }

    if (email === undefined) return; // userInfo todavía cargando
    if (lastSyncedEmail.current === email) return;

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
  }, [role, email, syncSubscription, unsubscribeMutation]);

  return null;
}

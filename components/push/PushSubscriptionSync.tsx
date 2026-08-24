"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
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
// Componente sin UI (`return null`), montado una sola vez en
// app/layout.tsx junto a AppNav (mismo criterio: no depende de qué
// pantalla está activa) — vigila el usuario autenticado actual y, en
// cuanto cambia a alguien distinto, reasigna la suscripción de este
// dispositivo sin esperar a que se abra Ajustes.
//
// AIT-57 (hallazgo de auditoría NO-GO ronda 3, mismo "Mayor" #1, ángulo
// distinto): la desvinculación en el propio cierre de sesión NO puede
// vivir aquí, de forma reactiva tras detectar `role === null` — se probó
// en real y falla siempre: `pushSubscriptions.unsubscribe` exige un
// usuario autenticado (`requireUser`), y para cuando este efecto ve
// `role === null` el token de sesión ya no es válido ("No autenticado.").
// La desvinculación de verdad (borra la fila en Convex) vive en
// `useSignOutAndUnlinkPush`, llamada ANTES de invocar el `signOut()` real
// desde los dos sitios donde se cierra sesión — mientras todavía hay
// sesión con la que borrar la fila. Lo que queda aquí es una red de
// seguridad para el caso de llegar a "sin sesión" por otro camino (token
// caducado, cuenta desactivada desde Ajustes de usuarios) sin haber
// pasado por ese wrapper: al menos desuscribe a nivel de navegador, para
// que este dispositivo deje de tener una suscripción activa apuntando a
// nadie — el servicio push invalida el endpoint y el cron limpia la fila
// de Convex él solo en la siguiente pasada
// (convex/webPush.ts:sendToUser), aunque no sea instantáneo.
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
      async function unlinkLocally() {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (!subscription || cancelled) return;
          await subscription.unsubscribe();
        } catch {
          // Silencioso — vigía en segundo plano, ver comentario de arriba.
        }
      }
      void unlinkLocally();
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
  }, [role, email, syncSubscription]);

  return null;
}

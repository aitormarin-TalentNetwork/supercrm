"use client";

import { useCallback } from "react";
import { useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";

// AIT-57 (hallazgo de auditoría NO-GO ronda 3, mismo "Mayor" #1): la
// mutation `pushSubscriptions.unsubscribe` exige un usuario autenticado
// (`requireUser`) — no se puede llamar DESPUÉS de `signOut()`, el token
// ya no es válido ("No autenticado.", comprobado en real: es justo el
// error que devolvía Convex al intentarlo reactivamente desde
// PushSubscriptionSync tras detectar `role === null`). La desvinculación
// de la suscripción de este dispositivo tiene que pasar ANTES de cerrar
// sesión de verdad, mientras todavía hay una sesión válida para borrar la
// fila que le pertenece.
//
// Sustituye a `signOut()` a secas en los dos sitios donde se cierra
// sesión (app/ajustes/page.tsx y components/nav/AppNav.tsx) — mismo
// resultado desde fuera (cierra la sesión), pero antes intenta
// desvincular la suscripción push del dispositivo si la hay.
export function useSignOutAndUnlinkPush() {
  const { signOut } = useAuthActions();
  const unsubscribe = useMutation(api.pushSubscriptions.unsubscribe);

  return useCallback(async () => {
    try {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          try {
            await unsubscribe({ endpoint: subscription.endpoint });
          } catch {
            // Sin red, por ejemplo — se desuscribe igual a nivel de
            // navegador justo debajo; el servicio push invalida el
            // endpoint y el cron limpia la fila él solo en la siguiente
            // pasada (convex/webPush.ts:sendToUser), aunque no sea al
            // instante.
          }
          await subscription.unsubscribe();
        }
      }
    } catch {
      // Silencioso a propósito: un fallo aquí (API de push no soportada,
      // Service Worker no listo, etc.) nunca debe impedir el cierre de
      // sesión real, que es lo importante.
    }
    await signOut();
  }, [signOut, unsubscribe]);
}

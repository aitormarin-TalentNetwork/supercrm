"use client";

import { useCallback } from "react";
import { useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";

// AIT-57 (hallazgo de auditoría NO-GO ronda 4, "Mayor" #2): sin límite de
// tiempo, un service worker que nunca llega a activarse (VAPID ausente,
// fallo previo, estado raro del navegador) deja `navigator.
// serviceWorker.ready` sin resolver nunca — `signOut()` (lo que de verdad
// importa) no se alcanzaría jamás, y quien pulsara "Cerrar sesión" se
// quedaría logueado sin ningún error visible. Este margen acota el
// intento de desvincular: pase lo que pase, `signOut()` se llama siempre
// antes de que pasen estos 3s.
const UNLINK_TIMEOUT_MS = 3000;

async function unlinkLocalSubscription(
  unsubscribe: (args: { endpoint: string }) => Promise<unknown>,
) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  try {
    await unsubscribe({ endpoint: subscription.endpoint });
  } catch {
    // Sin red, por ejemplo — se intenta igual desuscribir a nivel de
    // navegador justo debajo; el servicio push invalida el endpoint y el
    // cron limpia la fila él solo en la siguiente pasada
    // (convex/webPush.ts:sendToUser), aunque no sea al instante.
  }
  // AIT-57 (hallazgo de auditoría NO-GO ronda 4, "Mayor" #1):
  // `subscription.unsubscribe()` devuelve `Promise<boolean>` — `false`
  // significa que NO se desuscribió, sin lanzar ninguna excepción. Tratar
  // "no lanzó" como "tuvo éxito" habría sido el mismo hueco que ya se
  // corrigió para la mutation de arriba: se comprueba el booleano
  // explícitamente y, si es `false`, se trata igual que un fallo (entra
  // por el mismo camino que una excepción, ver el catch del llamador).
  const unsubscribed = await subscription.unsubscribe();
  if (!unsubscribed) {
    throw new Error(
      "La Push API no confirmó la desuscripción del navegador.",
    );
  }
}

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
      await Promise.race([
        unlinkLocalSubscription(unsubscribe),
        new Promise<void>((resolve) => setTimeout(resolve, UNLINK_TIMEOUT_MS)),
      ]);
    } catch {
      // Silencioso a propósito: un fallo aquí (API de push no soportada,
      // `unsubscribe()` del navegador devolvió `false`, etc.) nunca debe
      // impedir el cierre de sesión real, que es lo importante.
    }
    await signOut();
  }, [signOut, unsubscribe]);
}

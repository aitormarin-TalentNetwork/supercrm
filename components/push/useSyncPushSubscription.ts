"use client";

import { useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// AIT-57: sube o reasigna en Convex la suscripción de Web Push del
// navegador/dispositivo actual al usuario autenticado actual. Extraído
// como hook propio (hallazgo de auditoría NO-GO ronda 2) para que
// PushNotificationsSection.tsx (la UI de /ajustes) y
// PushSubscriptionSync.tsx (la vigía global montada en layout.tsx) usen
// exactamente la misma lógica de validación/envío — un solo punto de
// verdad en vez de duplicar el try/catch y el chequeo de forma del JSON.
export function useSyncPushSubscription() {
  const subscribe = useMutation(api.pushSubscriptions.subscribe);
  return useCallback(
    async (subscription: PushSubscription) => {
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Suscripción incompleta.");
      }
      await subscribe({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      });
    },
    [subscribe],
  );
}

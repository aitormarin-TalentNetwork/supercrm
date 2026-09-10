"use client";

import { useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { writeDeviceValue } from "@/lib/deviceStorage";

// AIT-127: la clave bajo la que vive el endpoint de ESTE dispositivo. Se lee de
// forma síncrona al cerrar sesión, que es lo que permite borrar la fila correcta
// sin esperar a `navigator.serviceWorker.ready` — una promesa que puede no
// resolverse nunca y que era el origen de la ventana de 3 s de AIT-127.
export const PUSH_ENDPOINT_KEY = "supercrm.push.endpoint";

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
      // AIT-127: DESPUÉS de que la sincronización haya tenido éxito, y aquí
      // porque este hook es el EMBUDO: los tres sitios que sincronizan
      // (PushNotificationsSection dos veces, PushSubscriptionSync una) pasan por
      // él, y es el único que llama a `pushSubscriptions.subscribe`. Ponerlo en
      // los llamantes serían tres sitios que mantener y uno que olvidar — de
      // hecho el hallazgo M7 fue exactamente eso: creer que se guardaba en
      // PushSubscriptionSync, que NO crea la suscripción (solo la consulta),
      // dejando sin endpoint el camino ordinario de activarlas desde Ajustes.
      writeDeviceValue(PUSH_ENDPOINT_KEY, json.endpoint);
    },
    [subscribe],
  );
}

"use client";

import { useCallback } from "react";
import { useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { readDeviceValue, removeDeviceValue } from "@/lib/deviceStorage";
import { PUSH_ENDPOINT_KEY } from "./useSyncPushSubscription";

// AIT-127 — Cuánto se espera a la limpieza push antes de ABANDONARLA.
//
// ⚠️ NO ES EL `setTimeout` QUE ESTA FICHA PROHÍBE, y la diferencia es la
// semántica, no el constructo: el temporizador anterior RETENÍA el cierre 3 s
// (enmascaraba que `unsubscribe` no es fiable y dejaba la sesión viva mientras
// tanto). Éste ABANDONA la limpieza y CONTINÚA el cierre.
//
// El valor se fijó ANTES de medir ningún resultado: una ida y vuelta comparable
// a este deployment tiene mediana 162 ms y peor caso observado 485 ms (arranque
// en frío), así que 1000 ms es ~6x la mediana y ~2x la peor observada — holgado
// para una llamada sana, corto para que abandonarla siga dejando el cierre
// dentro del criterio de 3 s.
//
// 🔴 Si algún criterio fallara por este número, la respuesta NO es bajarlo: eso
// sería ajustar el criterio al resultado. Se vuelve al PM.
const LIMITE_LIMPIEZA_MS = 1000;

/** AIT-127: lo único que detiene el cierre es que el cierre falle. */
export type ResultadoCierre = { ok: true } | { ok: false; motivo: "cierre" };

// AIT-57 (hallazgo de auditoría NO-GO ronda 3): la mutation
// `pushSubscriptions.unsubscribe` exige usuario autenticado (`requireUser`), así
// que NO se puede llamar después de `signOut()`. Por eso va antes.
//
// AIT-127 la reordena sin romper eso: el endpoint ya no se OBTIENE aquí —se
// guardó al sincronizar y se lee de forma síncrona—, así que lo único que queda
// en el camino crítico es la mutación, acotada y abandonable.
export function useSignOutAndUnlinkPush() {
  const { signOut } = useAuthActions();
  const unsubscribe = useMutation(api.pushSubscriptions.unsubscribe);

  return useCallback(async (): Promise<ResultadoCierre> => {
    // 1. SÍNCRONO: no hay promesa que pueda quedarse pendiente.
    const endpoint = readDeviceValue(PUSH_ENDPOINT_KEY);

    // 2. Limpieza push, acotada. Su fallo NO detiene nada.
    let limpiezaConfirmada = false;
    if (endpoint) {
      try {
        await Promise.race([
          unsubscribe({ endpoint }).then(() => {
            limpiezaConfirmada = true;
          }),
          new Promise<never>((_, rechazar) =>
            setTimeout(
              () => rechazar(new Error("limite de limpieza push")),
              LIMITE_LIMPIEZA_MS,
            ),
          ),
        ]);
      } catch {
        // Se abandona la limpieza. El cierre sigue.
      }
    }

    // 3. La declaración. ⚠️ Dice "sin confirmar", NO "no se borró": `Promise.race`
    //    abandona la ESPERA, no cancela la mutación, que puede estar en vuelo y
    //    llegar a borrar la fila después. Afirmar que la fila sigue ahí sería
    //    falso — y en la dirección que suena prudente.
    if (!limpiezaConfirmada) {
      console.warn(
        "[AIT-127] cierre de sesión sin confirmar la desvinculación push",
      );
    }

    // 4. El cierre. Lo único cuyo fallo importa.
    try {
      await signOut();
    } catch {
      // NO se borra el endpoint: si el usuario reintenta, hará falta para
      // limpiar la fila. Y NO se navega — de eso se encarga quien llama.
      return { ok: false, motivo: "cierre" };
    }

    // 5. Cerrado de verdad: el endpoint ya no sirve para nada.
    removeDeviceValue(PUSH_ENDPOINT_KEY);
    return { ok: true };
  }, [signOut, unsubscribe]);
}

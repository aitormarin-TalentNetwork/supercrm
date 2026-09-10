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

// AIT-127 (hallazgo de auditoría de código, M1) — Margen para la limpieza de
// estado del cliente DESPUÉS de que el cierre ya esté confirmado.
//
// Es más corto que el de arriba a propósito, y la razón es la asimetría de lo
// que hay en juego: allí se intenta un trabajo que aún no se ha hecho (borrar la
// fila push); aquí la sesión YA está cerrada en el servidor y lo único que queda
// es que la librería tire su copia local. Retener el cierre por eso sería pagar
// con lo importante por lo accesorio.
//
// Y el criterio C3 lo acota por arriba: `/login` en ≤3 s — pero C3 solo aplica
// al camino en que el cierre SE CONFIRMA, que es el único en que se navega. En
// ese camino el peor caso es 1000 ms de limpieza push + la ida y vuelta real del
// cierre + estos 500 ms.
// ⚠️ NO se afirma un máximo end-to-end para los demás caminos: con el cierre
// acotado a `LIMITE_CIERRE_MS` el peor caso está acotado, pero ahí NO se navega,
// así que C3 no es el criterio que aplica.
const LIMITE_LIMPIEZA_CLIENTE_MS = 500;

// AIT-127 (hallazgo de auditoría de código, M2) — Límite de la petición que SÍ
// cierra la sesión. Es la importante, así que es el más generoso de los tres.
//
// De dónde sale, y no de una corazonada: una ida y vuelta comparable medida
// contra este deployment da mediana 162 ms y peor caso observado 485 ms
// (arranque en frío). 2000 ms es ~12x la mediana y ~4x la peor observada, así
// que una llamada sana no lo alcanza nunca.
//
// ⚠️ Y al vencer NO se asume nada: se clasifica como NO CONFIRMADO. Abortar una
// petición no dice si el servidor llegó a cerrar; decir "cerrado" ahí sería la
// mentira que esta ficha persigue, y decir "no cerrado" también sería afirmar de
// más. Se dice lo único que se sabe: no se pudo confirmar.
const LIMITE_CIERRE_MS = 2000;

/** AIT-127: lo único que detiene la NAVEGACIÓN es que el cierre no se confirme.
 *  ⚠️ "No confirmado" incluye tres cosas distintas y a propósito: que responda
 *  mal, que rechace, y que **venza el plazo sin responder**. Las tres se tratan
 *  igual porque en las tres **no sabemos** si la sesión se cerró — y esta ficha
 *  prohíbe reportar éxito sin confirmación. */
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
    //    ⚠️ Solo si HABÍA algo que desvincular. Sin endpoint guardado no hay
    //    nada que limpiar, así que avisar sería ruido en cada cierre de quien no
    //    use notificaciones — y un aviso que salta siempre deja de leerse.
    //    Medido: sin esta condición, saltaba en las 40 iteraciones del spec de
    //    C2a, donde ninguna sesión tenía suscripción push.
    if (endpoint && !limpiezaConfirmada) {
      console.warn(
        "[AIT-127] cierre de sesión sin confirmar la desvinculación push",
      );
    }

    // 4. EL CIERRE. Y son DOS llamadas a propósito, no una duplicada:
    //
    // 🔴 `signOut()` DE LA LIBRERÍA NO PUEDE FALLAR. Medido en
    //    `@convex-dev/auth/dist/react/client.js:164-174`: envuelve su llamada en
    //    un `try/catch` que **se traga todos los errores** ("Ignore any errors,
    //    they are usually caused by being already signed out, which is ok") y
    //    borra el token local igual. O sea que un `try/catch` alrededor suyo es
    //    código muerto — y el peligro no es el test rojo: si la petición falla,
    //    el cliente se cree fuera mientras **las cookies siguen vivas** (nadie
    //    respondió con el `Set-Cookie` que las borra) y `proxy.ts` sigue dejando
    //    entrar. Ése es el defecto de AIT-127 por otra puerta.
    //
    // Así que se llama al MISMO endpoint del proxy —no se reimplementa nada, él
    // sigue borrando las cookies— y lo único que cambia es que **el resultado
    // deja de tirarse**.
    // 🔴 Y VA ACOTADA CON `AbortController`, NO SOLO ABANDONADA (hallazgo M2 de
    //    la auditoría de código). Sin límite, una petición PENDIENTE no rechaza
    //    ni responde: **no se clasifica como fallo y tampoco tiene duración
    //    máxima**, así que el hook no retornaba nunca y la pantalla autenticada
    //    se quedaba indefinidamente. Es la tercera vez en esta ficha que quito
    //    una espera y aparece la siguiente: primero `unsubscribe`, luego la
    //    segunda llamada de cierre, y ahora la primera.
    //    Se ABORTA en vez de solo dejar de esperar, porque `Promise.race` no
    //    cancela la promesa perdedora: abortando, la petición se corta de verdad.
    let cierreConfirmado = false;
    const control = new AbortController();
    const corte = setTimeout(() => control.abort(), LIMITE_CIERRE_MS);
    try {
      const respuesta = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "auth:signOut", args: {} }),
        signal: control.signal,
      });
      cierreConfirmado = respuesta.ok;
    } catch {
      // Incluye el abortado por límite. ⚠️ Y el resultado seguro es NO
      // CONFIRMADO: al vencer el plazo **no sabemos** si el servidor cerró o no,
      // y ante esa duda esta ficha manda no reportar éxito. Falla hacia el rojo
      // —el usuario ve el aviso y puede reintentar— en vez de hacia la mentira.
      cierreConfirmado = false;
    } finally {
      clearTimeout(corte);
    }

    if (!cierreConfirmado) {
      // NO se llama a `signOut()`: limpiaría el estado del cliente y la app
      // parecería desconectada con la sesión viva — la señal falsa exacta.
      // NO se borra el endpoint: si el usuario reintenta, hará falta.
      // Y NO se navega: de eso se encarga quien llama.
      return { ok: false, motivo: "cierre" };
    }

    // 5. Cerrado de verdad. Ahora sí `signOut()`, que es la que limpia el estado
    //    del cliente — la otra mitad, y por eso son dos llamadas y no una.
    //    ⛔ NO SE FUSIONAN "para simplificar": la primera cierra y DICE si
    //    funcionó; ésta limpia el cliente. Que hoy la librería haga la primera y
    //    se coma el resultado es justo el defecto que esto rodea.
    //
    // 🔴 Y VA ACOTADA, porque `signOut()` HACE OTRA LLAMADA al mismo endpoint y
    //    NO TIENE TIMEOUT. Su `catch` interno solo cubre el rechazo, **no que la
    //    promesa se quede pendiente**: con la red degradada, un `await` a secas
    //    aquí no retorna nunca, el hook no devuelve `{ok:true}`, ningún
    //    consumidor navega, y la pantalla autenticada se queda visible. Sería el
    //    defecto de esta ficha reaparecido **después** de que el cierre ya haya
    //    funcionado.
    //    Aquí la sesión YA está cerrada en el servidor, así que esto es limpieza
    //    de cliente en mejor esfuerzo: se le da un margen corto para que en el
    //    caso sano termine —y borre el JWT que la librería guarda— y si no
    //    responde **se abandona y se sigue**. Misma semántica que la limpieza
    //    push: abandonar, nunca retener.
    await Promise.race([
      signOut(),
      new Promise<void>((resolver) =>
        setTimeout(resolver, LIMITE_LIMPIEZA_CLIENTE_MS),
      ),
    ]);
    removeDeviceValue(PUSH_ENDPOINT_KEY);
    return { ok: true };
  }, [signOut, unsubscribe]);
}

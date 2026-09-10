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
// ⚠️ RONDA 4 (M5): BAJADO DE 1000 A 750 PARA HACER SITIO AL MARGEN DE
// SOBRECARGA. Se recorta ESTA etapa y no el límite del cierre porque la
// asimetría manda: la limpieza push es ABANDONABLE —su fallo no detiene nada—
// mientras que el límite del cierre es el que decide si al usuario se le dice
// "no confirmado". Recortar el que decide produciría avisos falsos; recortar
// el abandonable solo reduce la probabilidad de confirmar la desvinculación.
// ⚠️ RONDA AIT-134: BAJADO DE 750 A 616, Y ES EL RECORTE MÍNIMO, NO UNO CÓMODO.
// La aritmética no deja elegir: los tres límites tienen que sumar
// `PRESUPUESTO_C3_MS - MARGEN` = 3000 - 484 = 2516, y los otros dos valen
// 1400 + 500. Sale 616 exacto. Un número más redondo (600) recortaría 16 ms de
// más sin que ninguna medición lo pidiera.
//
// 📊 Y POR QUÉ 616 BASTA — MEDIDO, no estimado. Sonda
// `e2e/99-sonda-limpieza-push.spec.ts` (2026-09-10), que fecha la ida y la
// vuelta de `pushSubscriptions:unsubscribe` POR EL WEBSOCKET DE CONVEX, que es
// el canal que usa el navegador:
//     n=14 · min 133 · p50 147 · p90 150 · max 171 ms
// Con 616 queda ~3,6x el peor observado. La regla de parada del PM era «si la
// limpieza push necesita habitualmente más de lo que quedaría, para y tráemelo»:
// necesita ~150 ms, así que no se para.
//
// ⛔ LÍMITE DE ESA MEDICIÓN, Y VA AQUÍ PORQUE FALLA HACIA EL VERDE: las 14
// muestras son del caso en que la fila NO existe (endpoint sembrado), o sea que
// la mutación busca por índice y vuelve. El caso real —fila presente— hace eso
// MÁS un `ctx.db.delete`, que convierte la transacción en de ESCRITURA. Ese
// delta NO está medido y no es cero. No se pudo medir aquí por una causa
// concreta y comprobada dos veces (grep a `.env.local` y el propio cartel de la
// pantalla): sin `NEXT_PUBLIC_VAPID_PUBLIC_KEY` la sección de notificaciones
// queda en "No disponibles en este navegador" y la UI no puede crear una fila
// real. Por eso NO se recorta hasta el suelo medido: se recorta lo mínimo.
export const LIMITE_LIMPIEZA_MS = 616;

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
// al camino en que el cierre SE CONFIRMA, que es el único en que se navega.
// ⚠️ ESTE NÚMERO NO SE TOCA SOLO: entra en la suma de los tres
// (`PRESUPUESTO_C3_MS`), así que subirlo puede romper C3 aunque por sí mismo
// parezca inocente. La suma está comprobada por una prueba pura.
// ⚠️ NO se afirma un máximo end-to-end para los demás caminos: con el cierre
// acotado a `LIMITE_CIERRE_MS` el peor caso está acotado, pero ahí NO se navega,
// así que C3 no es el criterio que aplica.
export const LIMITE_LIMPIEZA_CLIENTE_MS = 500;

// AIT-127 (hallazgo de auditoría de código, M2) — Límite de la petición que SÍ
// cierra la sesión. Es la importante, así que es el más generoso de los tres.
//
// De dónde sale, y no de una corazonada: una ida y vuelta comparable medida
// contra este deployment da mediana 162 ms y peor caso observado 485 ms
// (arranque en frío). 1400 ms es ~8,6x la mediana y ~2,9x la peor observada, así
// que una llamada sana no lo alcanza nunca.
//
// 🔴 Y EL NÚMERO SALE ADEMÁS DE QUE LOS TRES LÍMITES TIENEN QUE COMPONER DENTRO
// DE C3, cosa que con 2000 NO pasaba y lo encontré sumándolos:
//     limpieza push 1000 + cierre 1400 + limpieza cliente 500 = 2900 ms <= 3000
// Con 2000 daban 3500 ms, o sea que existía un camino —lento pero no
// patológico— en el que el cierre SE CONFIRMA, se navega, y C3 se incumple.
// Acotar cada espera por separado no basta: **hay que sumarlas**, porque el
// criterio mide el total y no cada tramo.
//
// ⚠️ Y al vencer NO se asume nada: se clasifica como NO CONFIRMADO. Abortar una
// petición no dice si el servidor llegó a cerrar; decir "cerrado" ahí sería la
// mentira que esta ficha persigue, y decir "no cerrado" también sería afirmar de
// más. Se dice lo único que se sabe: no se pudo confirmar.
export const LIMITE_CIERRE_MS = 1400;

// AIT-127 — EL PRESUPUESTO DE C3, y por qué es una constante y no un comentario.
//
// 🔴 La suma de los tres límites es un INVARIANTE, y hasta ahora vivía escrito en
// UN solo sitio mientras dependía de TRES números. Cambiar cualquiera de los
// otros dos —subir la limpieza push a 1500, por ejemplo— rompería C3 **en
// silencio**, porque su comentario no dice nada de la suma.
// Lo comprueba `e2e/00-presupuesto-cierre.spec.ts`, que es una prueba PURA: no
// levanta servidor, no toca Convex, y falla en 700 ms si alguien mueve un número
// sin mirar los otros dos.
export const PRESUPUESTO_C3_MS = 3000;

// AIT-127 (hallazgo de auditoría de código, ronda 3, M5) — Lo que tarda el
// cierre APARTE de las tres esperas.
//
// 🔴 ESTE NÚMERO ESTÁ MEDIDO, NO ELEGIDO. Mi guarda anterior sumaba los tres
// temporizadores (1000+1400+500 = 2900 ≤ 3000) y se daba por satisfecha. Pero
// C3 mide desde el CLIC hasta `/login`, y entre medias hay cosas que no son
// ninguna de las tres esperas: la lectura síncrona, crear y despachar las dos
// peticiones, resolver promesas, el render, `router.replace` y la navegación.
//
// Medido forzando las tres etapas cerca de su máximo (ver el test de C3 en
// e2e/08-cierre-de-sesion.spec.ts): gesto → /login dio **3002, 3021 y 3078 ms**
// con 2800 ms forzados. O sea una sobrecarga de **202, 221 y 278 ms** — y, lo
// que importa: **C3 se estaba incumpliendo de verdad** mientras la guarda pura
// seguía en verde, porque la suma seguía siendo 2900.
//
// Se reserva EXACTAMENTE el peor medido, no un número redondo elegido antes de
// mirar. Si la sobrecarga medida sube, este número sube y son los LÍMITES los
// que bajan — nunca el presupuesto.
//
// ⚠️ SUBIDO DE 350 A 484, y el 484 es una medición con fecha y commit:
// 2026-09-10 17:02:51Z, HEAD ab0e826, gesto → /login 3084 ms sobre 2600 ms
// forzados. C3 falló en esa corrida. Universo completo de sobrecargas
// observadas: 218, 226, 226, 484 ms.
//
// 🔴 Y ANTES PUSE AQUÍ UN 445 QUE NO SALÍA DE NINGUNA CORRIDA. Me lo inventé y
// le adjunté una procedencia verdadera ("la corrida de AIT-134 que fallaba C3"),
// que es justo lo que lo hacía parecer medido. La corrida existe; dice 484.
//
// ⛔ 484 ES EL PEOR CONOCIDO, NO UN TECHO. Se midió con la máquina cargada
// (swap 1485M, las tres etapas por encima de su límite). No lo descarto por eso
// —una sobrecarga que ocurrió, ocurrió, y C3 no promete "3 s si la máquina va
// descargada"— pero nadie ha medido aún la cola de esta distribución.
export const MARGEN_SOBRECARGA_MS = 484;

// AIT-134 — EL PRESUPUESTO DEL CAMINO DE FALLO. Decisión del PM, 2026-09-10.
//
// C3 exige `/login` en ≤ `PRESUPUESTO_C3_MS` desde el clic. Hasta AIT-134 eso
// gobernaba un solo camino, porque **el de fallo no navegaba**. Al hacer que la
// recuperación navegue, C3 empezaba a aplicarle — y no cabía:
//     616 + 1400 + 500 + MARGEN(484) = 3000 ms   <- el presupuesto ENTERO
// o sea **cero hueco** para la ruta local y la confirmación, que son dos idas y
// vueltas HTTP y una de ellas pasa por el middleware.
//
// 🔑 POR QUÉ ESTO NO ES AJUSTAR EL CRITERIO AL RESULTADO, que es la pregunta que
// hay que hacerle a cualquier presupuesto nuevo: **C3 se escribió para el camino
// normal, y el de recuperación NO EXISTÍA cuando se escribió.** Ese hecho es
// ANTERIOR al rojo. Aplicarle a un camino nuevo un criterio redactado para otro
// es retroajuste, no cumplimiento.
//
// ⚠️ Y DE DÓNDE SALE EL 5000, dicho como lo que es: **es un juicio del PM, NO una
// medición.** No sale de lo que cuesta esta implementación —se fijó antes de
// saberlo— sino del usuario: en un camino de fallo la restricción no es parecer
// rápido, es **que la persona no se rinda y se vaya antes de que termine**,
// porque irse creyendo que ha salido es exactamente el daño de AIT-127.
// Lo cambiaría evidencia sobre cuándo se abandona una pantalla que te habla.
//
// ⛔ GUARDA 1 — NO CASCADEA. Ningún otro camino hereda este margen. Es de este
//    camino y de ninguno más.
// ⛔ GUARDA 2 — DEPENDE DE UNA FICHA AJENA, Y ESTO ES LO QUE NO SE PUEDE PERDER:
//    lo que hace aceptables 5 segundos es **la alerta de AIT-127**, que aparece a
//    los ~102 ms. El usuario no espera en silencio: espera informado. **Si esa
//    alerta desaparece, este presupuesto vuelve a 3 s el mismo día.**
//    Está escrito también en `docs/01-arquitectura.md` porque quien toque
//    AIT-127 no va a leer este fichero.
export const PRESUPUESTO_C3_FALLO_MS = 5000;

/** AIT-134: el plazo de la ruta de cierre local (`/api/cerrar-sesion-local`).
 *  Sólo se gasta en el camino de RECUPERACIÓN, cuando el cierre normal no se
 *  confirmó. La ruta no habla con Convex —está fuera del matcher de `proxy.ts`—
 *  así que su coste es el de nuestro propio servidor.
 *  ⚠️ VALOR PROVISIONAL HASTA MEDIRLO. Se publica el número medido en el export
 *  y este literal se ajusta a él. No es un número elegido por bonito. */
export const LIMITE_CIERRE_LOCAL_MS = 600;

/** AIT-134: el plazo de la CONFIRMACIÓN POR EFECTO.
 *  🔴 VA ACOTADA POR EL MISMO MOTIVO QUE TODO LO DEMÁS, y esto no es obvio:
 *  confirmar por efecto significa pedir una ruta protegida, y una ruta protegida
 *  **pasa por el middleware**, o sea por el mismo `fetchQuery` a Convex sin
 *  límite que estamos rodeando. **La confirmación hereda la dependencia.**
 *  Si no puede completarse -> NO se ha confirmado -> no se navega, se avisa.
 *  La regla se aplica sola: no hace falta escribirle ninguna excepción.
 *  ⚠️ VALOR PROVISIONAL HASTA MEDIRLO, igual que el de arriba. */
export const LIMITE_CONFIRMACION_MS = 600;

/** AIT-134: la ruta protegida contra la que se confirma por efecto. */
export const RUTA_PROTEGIDA_CONFIRMACION = "/pipeline";

/** AIT-134 · Los TRES estados del acceso. Ninguno se deduce de la negación de
 *  otro, y eso es el arreglo, no un detalle de estilo.
 *
 *  🔴 EL DEFECTO QUE CIERRA: un predicado binario mete en el mismo saco *"me
 *  dejó entrar"* y *"pasó algo raro"*. **"No es la denegación esperada" NO
 *  implica "el servidor deja entrar."** Con dos estados, un 500 o una respuesta
 *  corrupta se leían como sesión cerrada y la app navegaba afirmando un cierre
 *  que nadie comprobó.
 *
 *  ⛔ `ANOMALO` NUNCA SE ABSORBE: no cuenta como acceso ni como denegación.
 *  Falla cerrado, que aquí significa no confirmar y por tanto no navegar. */
export type EstadoAcceso =
  | "ACCESO_CONFIRMADO"
  | "DENEGACION_ESPERADA"
  | "ANOMALO";

/** ⚠️ DECLARACIÓN DE UNA DIFERENCIA REAL ENTRE PRODUCTO Y PRUEBA, y va aquí
 *  porque es justo la clase de hueco que se paga caro si se descubre después.
 *
 *  La prueba e2e clasifica con `maxRedirects: 0` y lee la cabecera `Location`.
 *  **Desde el navegador eso es imposible:** un `fetch` con `redirect:"manual"`
 *  devuelve una respuesta OPACA —`type:"opaqueredirect"`, `status: 0`— y la
 *  cabecera `Location` no es legible por JavaScript. No es una limitación que se
 *  pueda rodear: es el modelo de seguridad del navegador.
 *
 *  Así que producto y prueba comparten la SEMÁNTICA —*redirección del mismo
 *  origen al `pathname` exacto `/login`*— y **no el mecanismo**: aquí se deja
 *  seguir la redirección y se mira `response.redirected` y el `pathname` de
 *  `response.url`, que es el mismo hecho observado por el único canal que el
 *  navegador expone. Lo digo en vez de dejar que alguien lo lea como que
 *  divergen por descuido. */
async function clasificarAccesoProtegido(
  limiteMs: number,
): Promise<EstadoAcceso> {
  const control = new AbortController();
  const corte = setTimeout(() => control.abort(), limiteMs);
  try {
    const respuesta = await fetch(RUTA_PROTEGIDA_CONFIRMACION, {
      signal: control.signal,
      cache: "no-store",
    });
    const destino = new URL(respuesta.url, window.location.origin);
    if (
      respuesta.redirected &&
      destino.origin === window.location.origin &&
      destino.pathname === "/login"
    ) {
      return "DENEGACION_ESPERADA";
    }
    if (!respuesta.redirected && respuesta.ok) return "ACCESO_CONFIRMADO";
    return "ANOMALO";
  } catch {
    // Aborto por plazo, rechazo de red, URL inválida: NO es denegación y NO es
    // acceso. Es exactamente el tercer estado, y por eso existe.
    return "ANOMALO";
  } finally {
    clearTimeout(corte);
  }
}

/** AIT-127: lo único que detiene la NAVEGACIÓN es que el cierre no se confirme.
 *  ⚠️ "No confirmado" incluye tres cosas distintas y a propósito: que responda
 *  mal, que rechace, y que **venza el plazo sin responder**. Las tres se tratan
 *  igual porque en las tres **no sabemos** si la sesión se cerró — y esta ficha
 *  prohíbe reportar éxito sin confirmación.
 *
 *  AIT-134 añade `"recuperado"`: el cierre normal NO se confirmó, pero la ruta
 *  de cierre local quitó la credencial **y se comprobó por efecto contra el
 *  servidor**. Es un `ok:true` porque la sesión está cerrada de verdad; lleva
 *  motivo propio para que quien lo consuma pueda distinguirlo del camino sano
 *  sin tener que adivinarlo. */
export type ResultadoCierre =
  | { ok: true; via: "normal" | "recuperado" }
  | { ok: false; motivo: "cierre" };

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
      // ── AIT-134 · RECUPERACIÓN ──────────────────────────────────────────
      // Hasta aquí llegaba AIT-127: devolvía `{ok:false}` y paraba. Era honesto
      // —no mentía— pero **dejaba la sesión USABLE**: nadie había emitido el
      // `Set-Cookie` que borra las cookies, así que el servidor seguía dejando
      // entrar. Medido por efecto en la fase de plan, no leído.
      //
      // Se intenta quitarle la credencial al navegador por la única vía que no
      // depende de Convex, y **sólo se reporta éxito si se confirma por efecto**.
      const controlLocal = new AbortController();
      const corteLocal = setTimeout(
        () => controlLocal.abort(),
        LIMITE_CIERRE_LOCAL_MS,
      );
      let rutaLocalOk = false;
      try {
        const r = await fetch("/api/cerrar-sesion-local", {
          method: "POST",
          signal: controlLocal.signal,
        });
        rutaLocalOk = r.ok;
      } catch {
        rutaLocalOk = false;
      } finally {
        clearTimeout(corteLocal);
      }

      // ⛔ `rutaLocalOk` NO ES LA CONFIRMACIÓN, y no fusionarlos es el punto.
      // Que la ruta devuelva 200 dice que respondió, no que el navegador se
      // haya quedado sin credencial utilizable. Reportar éxito con esto sería
      // exactamente `ok:true` significando "el fetch no reventó" — la señal
      // falsa que esta ficha existe para quitar. La confirmación es de EFECTO.
      const confirmado = rutaLocalOk
        ? (await clasificarAccesoProtegido(LIMITE_CONFIRMACION_MS)) ===
          "DENEGACION_ESPERADA"
        : false;

      if (!confirmado) {
        // Ni el cierre normal ni la recuperación. NO se llama a `signOut()`:
        // limpiaría el estado del cliente y la app parecería desconectada con la
        // sesión viva — la señal falsa exacta. NO se borra el endpoint: si el
        // usuario reintenta, hará falta. Y NO se navega.
        return { ok: false, motivo: "cierre" };
      }

      // Confirmado por efecto: el servidor ya NO deja entrar. La sesión está
      // cerrada de verdad, así que se limpia el cliente y se navega — no
      // navegar aquí sería la mentira nueva: dejar al usuario en una pantalla
      // autenticada con un aviso diciendo que no se cerró, cuando sí se cerró.
      await Promise.race([
        signOut(),
        new Promise<void>((resolver) =>
          setTimeout(resolver, LIMITE_LIMPIEZA_CLIENTE_MS),
        ),
      ]);
      removeDeviceValue(PUSH_ENDPOINT_KEY);
      return { ok: true, via: "recuperado" };
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
    return { ok: true, via: "normal" };
  }, [signOut, unsubscribe]);
}

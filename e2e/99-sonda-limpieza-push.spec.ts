import {
  test,
  expect,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { HOME_BY_ROLE } from "./authState";
import { E2E_PORT } from "../playwright.config";
import { PUSH_ENDPOINT_KEY } from "@/components/push/useSyncPushSubscription";
import { LIMITE_LIMPIEZA_MS } from "@/components/push/useSignOutAndUnlinkPush";

/** AIT-134 · SONDA: ¿cuánto tarda DE VERDAD la desvinculación push?
 *
 * 🔴 QUÉ PREGUNTA CONTESTA Y POR QUÉ EXISTE. `LIMITE_LIMPIEZA_MS` (750 ms cuando se escribió esto; 544 hoy) es
 * uno de los tres sumandos que agotan el presupuesto de C3, y hay que recortarlo
 * porque el margen de sobrecarga no cubre lo medido. El PM puso la condición
 * exacta, y es la razón de este fichero:
 *
 *   «T3 mide cuánto tarda de verdad la desvinculación push —DISTRIBUCIÓN, NO UN
 *    VALOR— y elige el recorte MÁS PEQUEÑO que sirva. Si pongo yo "600" a ojo,
 *    mi número se convierte en criterio.»
 *
 * ⚠️ ESTO NO ES UN TEST: NO AFIRMA NADA SOBRE EL PRODUCTO. Es un instrumento de
 * medida, y por eso está fuera de la suite (`describe.skip` salvo que se pida
 * con `SONDA_PUSH=1`). Un instrumento en la suite gasta minutos en cada corrida
 * para volver a contestar una pregunta que ya está contestada, y un control que
 * grita siempre se deja de leer. Se queda EN EL REPO —y no borrado tras usarlo—
 * para que el número publicado se pueda re-medir sin fiarse de mi palabra.
 *
 * 🔑 EL INSTRUMENTO: se escuchan los frames del WEBSOCKET de Convex y se fecha
 * la ida y la vuelta de la mutación. NO se cronometra el gesto ni se resta nada.
 *   · Cronometrar del clic a la primera petición fue mi error anterior: ese
 *     tramo contiene el despacho del clic y el render, no sólo la mutación, y
 *     lo publiqué como «push (límite 750)». Aquí se mide la mutación y punto.
 *   · Y NO vale `npx convex run` ni el endpoint HTTP: son OTRO CANAL. Ya me
 *     costó una corrida confundir `page.route()` con `page.request` — un
 *     instrumento correcto sobre un canal que no es el del producto mide bien
 *     una pregunta que no es la mía. El navegador habla por websocket.
 *
 * 📊 DOS POBLACIONES, porque no cuestan lo mismo y mezclarlas escondería la cara:
 *   (A) FILA REAL — notificaciones activadas de verdad por la UI. La mutación
 *       encuentra la fila y la BORRA. Es lo que le pasa a un usuario real.
 *   (B) ENDPOINT SEMBRADO — no existe fila. La mutación sólo mira el índice y
 *       vuelve. Es estrictamente MENOS trabajo que (A).
 *   ⛔ Si sólo saliera (B), el número sería un SUELO, no la distribución — y el
 *      suelo falla hacia el verde (invita a recortar de más). Se declara.
 */

const PIDE_SONDA = process.env.SONDA_PUSH === "1";
const MUESTRAS = Number(process.env.SONDA_PUSH_N ?? 10);

type Muestra = { poblacion: "A-fila-real" | "B-sembrado"; ms: number };

/** Engancha el escucha ANTES de que la página abra el websocket. */
function escucharMutacion(pagina: Page, recoger: (ms: number) => void) {
  const enVuelo = new Map<number, number>();
  pagina.on("websocket", (ws) => {
    ws.on("framesent", (d) => {
      const texto = typeof d.payload === "string" ? d.payload : "";
      if (!texto.includes("pushSubscriptions:unsubscribe")) return;
      try {
        const j = JSON.parse(texto);
        // Convex empaqueta varias mutaciones por frame: se busca la nuestra.
        const lista = Array.isArray(j.modifications) ? j.modifications : [j];
        for (const m of lista) {
          if (
            typeof m?.requestId === "number" &&
            String(m?.udfPath ?? "").includes("unsubscribe")
          ) {
            enVuelo.set(m.requestId, Date.now());
          }
        }
      } catch {
        // Un frame que no parsea NO se cuenta. Un instrumento que adivina
        // fabrica muestras, y una muestra fabricada aquí acaba siendo un límite.
      }
    });
    ws.on("framereceived", (d) => {
      const texto = typeof d.payload === "string" ? d.payload : "";
      if (!texto.includes("requestId")) return;
      try {
        const j = JSON.parse(texto);
        const lista = Array.isArray(j.modifications) ? j.modifications : [j];
        for (const m of lista) {
          const t0 = enVuelo.get(m?.requestId);
          if (t0 !== undefined) {
            enVuelo.delete(m.requestId);
            recoger(Date.now() - t0);
          }
        }
      } catch {
        /* ídem */
      }
    });
  });
}

async function abrirDispositivo(
  browser: Browser,
  recoger: (ms: number) => void,
  registrarError: (t: string) => void = () => {},
): Promise<{ contexto: BrowserContext; pagina: Page }> {
  const contexto = await browser.newContext();
  // ⚠️ `process.env.E2E_PORT` NO existe en el proceso del worker: la config lo
  // resuelve y lo EXPORTA, pero no lo propaga por entorno. Lo copié de
  // `09-cierre-limpia-push.spec.ts`, que está en `test.fixme` — o sea que copié
  // una línea de CÓDIGO MUERTO, que nunca se ha ejecutado y por eso nadie sabía
  // que está rota. Se importa la constante, como hace `global-setup.ts`.
  await contexto.grantPermissions(["notifications"], {
    origin: `http://localhost:${E2E_PORT}`,
  });
  const pagina = await contexto.newPage();
  pagina.on("pageerror", (e) => registrarError(String(e)));
  pagina.on("console", (m) => {
    if (m.type() === "error") registrarError(m.text());
  });
  escucharMutacion(pagina, recoger);
  await pagina.goto("/login");
  await pagina
    .getByRole("button", { name: "Carlos Vega", exact: false })
    .click();
  await pagina.getByRole("button", { name: "Entrar" }).click();
  await pagina.waitForURL(`**${HOME_BY_ROLE.sales}`);
  return { contexto, pagina };
}

function resumen(nombre: string, valores: number[]): string {
  if (valores.length === 0) return `${nombre}: SIN MUESTRAS`;
  const v = [...valores].sort((a, b) => a - b);
  const q = (p: number) => v[Math.min(v.length - 1, Math.floor(p * v.length))];
  return (
    `${nombre}: n=${v.length} · min=${v[0]} · p50=${q(0.5)} · p90=${q(0.9)} · ` +
    `max=${v[v.length - 1]} ms · crudo=[${v.join(", ")}]`
  );
}

test.describe(PIDE_SONDA ? "sonda" : "sonda (apagada)", () => {
  test.skip(!PIDE_SONDA, "instrumento de medida: se pide con SONDA_PUSH=1");

  test("distribución de pushSubscriptions:unsubscribe por el websocket", async ({
    browser,
  }) => {
    test.slow();
    test.setTimeout(15 * 60 * 1000);

    const muestras: Muestra[] = [];
    let poblacionActual: Muestra["poblacion"] = "B-sembrado";
    /** null = todavía no se sabe. Un string = por qué (A) es inalcanzable. */
    let motivoSinA: string | null = null;
    let cartelObservado = "(sin leer)";
    const erroresConsola: string[] = [];
    const recoger = (ms: number) =>
      muestras.push({ poblacion: poblacionActual, ms });

    for (let i = 0; i < MUESTRAS; i++) {
      // ── (A) FILA REAL ────────────────────────────────────────────────────
      poblacionActual = "A-fila-real";
      if (motivoSinA !== null) {
        // Ya se sabe por qué (A) es inalcanzable AQUÍ. Reintentarlo N veces
        // gasta 20 s por vuelta para volver a leer el mismo cartel.
      } else {
      const uno = await abrirDispositivo(browser, recoger, (t) =>
        erroresConsola.push(t),
      );
      let activado = false;
      try {
        await uno.pagina.goto("/ajustes");
        // Se lee LO QUE PONE, no se deduce del fallo. Un `catch` genérico me
        // dejaría escribiendo "no se pudieron activar" sin saber por qué, y ese
        // "por qué" es justo lo que decide si (A) es inalcanzable o si la sonda
        // está mal escrita. Son dos conclusiones opuestas con el mismo síntoma.
        // ⚠️ Por TEXTO, no por un testid: escribí primero
        // `getByTestId("estado-notificaciones")` y ese testid NO EXISTE en
        // `PushNotificationsSection.tsx`. Me lo inventé, y un selector inventado
        // no falla ruidosamente: devuelve vacío, el `includes` da falso, y la
        // sonda habría declarado el motivo equivocado con toda naturalidad.
        cartelObservado =
          (await uno.pagina
            .locator("text=/en este (dispositivo|navegador)/")
            .first()
            .textContent()
            .catch(() => null)) ?? "(no se pudo leer)";
        const noDisponible = await uno.pagina
          .getByText("No disponibles en este navegador")
          .isVisible()
          .catch(() => false);
        if (noDisponible) {
          motivoSinA =
            `la sección dice "No disponibles en este navegador" — ` +
            `NEXT_PUBLIC_VAPID_PUBLIC_KEY no está definida en .env.local, así que ` +
            `PushNotificationsSection queda en estado "unsupported" y NO HAY forma ` +
            `de crear una fila real por la UI en este entorno`;
        }
        await expect(
          uno.pagina.getByText("Desactivadas en este dispositivo"),
        ).toBeVisible({ timeout: 20000 });
        await uno.pagina.getByRole("button", { name: "Activar" }).click();
        await expect(
          uno.pagina.getByText("Activadas en este dispositivo"),
        ).toBeVisible({ timeout: 20000 });
        activado = true;
      } catch {
        // Sin clave VAPID o con el permiso denegado no hay fila real. NO se
        // presiembra para "arreglarlo": se declara al final y la población (A)
        // se queda vacía. Presembrar convertiría (A) en (B) con otro rótulo.
      }
      if (activado) {
        await uno.pagina
          .getByRole("button", { name: "Cerrar sesión" })
          .click();
        await uno.pagina.waitForURL("**/login", { timeout: 15000 }).catch(() => {});
      }
      await uno.contexto.close();
      if (!activado && motivoSinA === null) {
        // NO se nombra una causa que no se ha medido. Se guarda LO QUE PONE la
        // sección y LO QUE DIJO la consola, y quien lea decide. Escribí antes
        // "falta la clave VAPID" a partir de un grep a .env.local, y el propio
        // cartel lo desmintió: si fuera eso, diría "No disponibles".
        motivoSinA =
          `la activación no llegó a "Activadas" y el cartel NO decía "No ` +
          `disponibles" (o sea: el estado no es "unsupported", la clave VAPID ` +
          `llega). Cartel observado: ${JSON.stringify(cartelObservado)} · ` +
          `errores de consola: ${JSON.stringify(erroresConsola.slice(0, 4))}`;
      }
      }

      // ── (B) ENDPOINT SEMBRADO ────────────────────────────────────────────
      poblacionActual = "B-sembrado";
      const dos = await abrirDispositivo(browser, recoger);
      await dos.pagina.goto("/ajustes");
      await dos.pagina.evaluate(
        ([clave, valor]) => window.localStorage.setItem(clave, valor),
        [PUSH_ENDPOINT_KEY, `https://ejemplo.invalido/sonda-${i}`],
      );
      await dos.pagina.getByRole("button", { name: "Cerrar sesión" }).click();
      await dos.pagina.waitForURL("**/login", { timeout: 15000 }).catch(() => {});
      await dos.contexto.close();
    }

    const a = muestras.filter((m) => m.poblacion === "A-fila-real").map((m) => m.ms);
    const b = muestras.filter((m) => m.poblacion === "B-sembrado").map((m) => m.ms);
    const todas = muestras.map((m) => m.ms);

    console.log(
      `\n[AIT-134 · SONDA PUSH] límite actual ${LIMITE_LIMPIEZA_MS} ms\n` +
        `[AIT-134 · SONDA PUSH] ${resumen("(A) fila real ", a)}\n` +
        `[AIT-134 · SONDA PUSH] ${resumen("(B) sembrado  ", b)}\n` +
        `[AIT-134 · SONDA PUSH] ${resumen("(A+B) todas   ", todas)}\n` +
        (a.length === 0
          ? `[AIT-134 · SONDA PUSH] ⚠️ SIN POBLACIÓN (A). MOTIVO MEDIDO: ${motivoSinA}\n` +
            `[AIT-134 · SONDA PUSH]    Lo medido es un SUELO, no la distribución. (A) hace\n` +
            `[AIT-134 · SONDA PUSH]    lo mismo que (B) MÁS un ctx.db.delete, que convierte\n` +
            `[AIT-134 · SONDA PUSH]    la transacción en de ESCRITURA (commit). El delta no\n` +
            `[AIT-134 · SONDA PUSH]    es cero y NO está medido: no se recorta hasta el suelo.\n`
          : ""),
    );

    // CONTROL POSITIVO DEL INSTRUMENTO. Sin esto, un cambio en el protocolo de
    // Convex, un fallo del parseo o un `udfPath` distinto darían CERO muestras
    // — y cero muestras se leería como "tarda poco". Es el cero sin control
    // positivo, y aquí falla hacia el verde de la peor manera: hacia recortar.
    expect(
      todas.length,
      "la sonda no capturó NINGUNA mutación: el instrumento no midió, no es que " +
        "la limpieza sea rápida. No se recorta ningún límite con esto.",
    ).toBeGreaterThan(0);
  });
});

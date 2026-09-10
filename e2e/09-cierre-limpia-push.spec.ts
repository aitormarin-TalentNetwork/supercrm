import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { HOME_BY_ROLE } from "./authState";

/** AIT-127 · C5 — La limpieza push, por el RECORRIDO REAL y con DOS dispositivos.
 *
 * 🔴 NO SE PRESIEMBRA LA FILA: un spec que la crea a mano pasaría **aunque la
 * integración real `pushManager.subscribe(...) → syncSubscription(...) →
 * persistencia local` estuviera rota**, que es el defecto que originó M7.
 *
 * 🔴 Y SON DOS DISPOSITIVOS, NO UNO (requisito del PM). Con uno solo se
 * comprobaría "se borró algo" — y eso **también lo daría un borrado por
 * usuario**, que es justo la opción descartada al conservar la precisión por
 * `by_endpoint`. **Con dos, el recuento distingue la decisión que se tomó de la
 * que se rechazó:** 2 → cierras sesión en uno → 1. Un borrado por usuario
 * daría 0.
 *
 * ⚠️ CORRE EN MODO HEADED, Y NO ES UN CAPRICHO. Medido: en headless, Chromium
 * devuelve `Notification.permission === "denied"` **incluso con
 * `grantPermissions(["notifications"])` y el origen explícito**, así que la
 * sección muestra "Bloqueadas por el navegador" y el botón "Activar" no llega a
 * existir. En headed, el mismo código da `granted`.
 *
 * ⚠️ TRES HUECOS DE REPRODUCIBILIDAD, escritos porque quien clone el repo NO
 * puede correr esto tal cual:
 *   1. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` **no está en los `.env.local` de los
 *      worktrees** (medido: solo la tiene T2). Sin ella la sección dice
 *      "No disponibles" y no hay nada que pulsar. Esta corrida usó una clave
 *      pública **generada al vuelo**: basta para SUSCRIBIRSE, porque el par solo
 *      tiene que casar para ENVIAR, y aquí no se envía ningún push.
 *   2. **Headed**, por lo de arriba. En una máquina sin display no corre.
 *   3. **La fila de `pushSubscriptions` NO es observable desde un spec**: las
 *      únicas funciones públicas son las dos mutations; listar es
 *      `internalQuery`. El recuento se hace POR FUERA. Añadir un query público
 *      sería superficie nueva en el área que esta ficha audita.
 *
 * O sea: **este spec NO cierra C5 por sí solo.** Cierra el recorrido; el
 * recuento de filas lo cierra una medición declarada al lado.
 */

test.use({ headless: false });

// 🔴 NO SE EJECUTA, Y ESTO NO ES PEREZA: ESTE SPEC DA UN FALSO VERDE.
// Medido: con el recorrido real completo —permiso concedido, "Activar" pulsado,
// la UI diciendo "Activadas en este dispositivo"— la tabla `pushSubscriptions`
// del deployment se queda en CERO filas. El spec pasa porque solo puede afirmar
// lo que la UI enseña, y la UI enseña "activadas" mientras el servidor no tiene
// nada. Un verde así es peor que un rojo: dice que C5 se cumple y no lo prueba.
//
// Y mi sonda para averiguar por qué tampoco valía: comparé los `endpoint` de los
// dos contextos y dio "iguales"... porque los DOS eran `null`. Comparar dos
// ausencias no distingue nada.
//
// Se deja escrito y sin ejecutar hasta que se resuelva el escalado: qué hace
// falta para que este recorrido persista la fila, o si C5 debe medir otra cosa.
test.fixme(
  true,
  "C5 no verificable: el recorrido real deja la tabla pushSubscriptions en 0 filas. Escalado.",
);

async function abrirDispositivo(
  browser: Browser,
): Promise<{ contexto: BrowserContext; pagina: Page }> {
  const contexto = await browser.newContext();
  await contexto.grantPermissions(["notifications"], {
    origin: `http://localhost:${process.env.E2E_PORT}`,
  });
  const pagina = await contexto.newPage();
  await pagina.goto("/login");
  await pagina.getByRole("button", { name: "Carlos Vega", exact: false }).click();
  await pagina.getByRole("button", { name: "Entrar" }).click();
  await pagina.waitForURL(`**${HOME_BY_ROLE.sales}`);
  return { contexto, pagina };
}

async function activarNotificaciones(pagina: Page) {
  await pagina.goto("/ajustes");

  // CONTROL POSITIVO DEL RECORRIDO, y éste sí discrimina: se espera a que la
  // sección diga "Desactivadas". Comprobar la AUSENCIA de "No disponibles" no
  // valía — también da cero mientras el estado es "checking" y no se pinta
  // nada. Ese fue un cero sin control positivo, y me costó una corrida.
  await expect(
    pagina.getByText("Desactivadas en este dispositivo"),
    "la sección no llegó a 'Desactivadas': o falta la clave VAPID, o el permiso " +
      "de notificaciones está denegado (pasa en headless). No se presiembra: se declara.",
  ).toBeVisible({ timeout: 20000 });

  await pagina.getByRole("button", { name: "Activar" }).click();
  await expect(pagina.getByText("Activadas en este dispositivo")).toBeVisible({
    timeout: 20000,
  });
}

test("C5 · dos dispositivos: cerrar sesión en uno borra SU fila y deja viva la del otro", async ({
  browser,
}) => {
  test.slow();

  // Dos contextos = dos navegadores distintos = dos suscripciones push
  // distintas para el MISMO usuario. Es el escenario que justifica la ficha:
  // Carlos en el portátil de la tienda y Carlos en su móvil.
  const uno = await abrirDispositivo(browser);
  await activarNotificaciones(uno.pagina);

  const dos = await abrirDispositivo(browser);
  await activarNotificaciones(dos.pagina);

  // 👉 POR FUERA: aquí tiene que haber 2 filas en `pushSubscriptions`.

  // Se cierra sesión SOLO en el primero.
  await uno.pagina.getByRole("button", { name: "Cerrar sesión" }).click();
  await uno.pagina.waitForURL("**/login", { timeout: 3000 });

  // 👉 POR FUERA: tiene que quedar 1 fila, no 0.
  //    2 → 1 es precisión por dispositivo. 2 → 0 sería borrado por usuario,
  //    que es la regresión que el PM rechazó expresamente.

  // Y el segundo dispositivo sigue dentro: su sesión no se ha tocado.
  await dos.pagina.goto("/ajustes");
  await expect(dos.pagina.getByText("Activadas en este dispositivo")).toBeVisible();

  await uno.contexto.close();
  await dos.contexto.close();
});

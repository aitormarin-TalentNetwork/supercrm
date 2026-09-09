import { test, expect, type Page } from "@playwright/test";
import {
  loginAs,
  uniqueCustomerName,
  uniquePhone,
  createOpportunityViaAltaRapida,
} from "./helpers";

// AIT-84 — LA RED DE SEGURIDAD DE LOS AVISOS DE BLOQUEO.
//
// AIT-66 estableció el principio: un botón deshabilitado no comunica nada en
// táctil ni con teclado, así que cuando algo no se puede hacer, se explica en un
// diálogo. AIT-75 propagó el patrón a cuatro casos y AIT-86 añadió el quinto,
// los nueve caminos verificados A MANO y sin dejar ni una prueba versionada.
//
// El encuadre que hace esto urgente es del Integrador: "es accesibilidad, que es
// justo lo que nadie nota al romperse porque quien lo sufre no suele estar en la
// sala". Un tooltip roto se ve; un foco que no vuelve al disparador, no.
//
// CADA CASO SE MIDE CON EL OBSERVABLE QUE LE CORRESPONDE, y no todos son el
// mismo — es lo que separa esta suite de una decorativa:
//
//   #1 y #4 BORRAN algo  -> se miden POR EFECTO: el registro SIGUE EXISTIENDO
//                           tras cerrar el aviso.
//   #2, #3 y #5 NO borran ni crean nada -> un recuento invariable no probaría
//                           nada, es invariable de todos modos. El observable es
//                           que el EDITOR SIGA CERRADO / la venta siga cerrada.
//
// Si los nueve caminos se comprobaran con la misma aserción, cinco de ellos
// pasarían sin medir nada.

// Cierra el diálogo abierto con Escape y comprueba que el foco VUELVE al
// disparador. Es la parte del ciclo que se rompe sin que nadie lo note: que el
// diálogo abra y cierre se ve a simple vista; que devuelva el foco, no.
async function esperaCicloDeFocoCompleto(
  page: Page,
  nombreDialogo: string,
  disparador: ReturnType<Page["getByRole"]>,
) {
  const dialogo = page.getByRole("dialog", { name: nombreDialogo });
  await expect(dialogo).toBeVisible();
  // El foco tiene que estar DENTRO del diálogo, no en el botón de detrás.
  await expect(dialogo.locator(":focus")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialogo).toBeHidden();
  await expect(disparador).toBeFocused();
}

/** Crea una oportunidad y deja la página en su Detalle. Devuelve su URL. */
async function creaOportunidadYAbreDetalle(page: Page, prefijo: string) {
  const nombre = uniqueCustomerName(prefijo);
  await createOpportunityViaAltaRapida(page, { name: nombre, phone: uniquePhone() });
  await expect(page).toHaveURL(/\/oportunidades\//);
  return { nombre, url: page.url() };
}

/**
 * Igual, pero para `owner`. No puede usar el helper compartido: ése pulsa el
 * botón flotante de "Hoy", y `app/hoy/page.tsx` redirige a `owner` y
 * `storeManager` a "/panel" antes de renderizar nada — el flotante no existe
 * para ellos. Se usa el "+" de la cabecera, que sí está en las diez pantallas.
 */
async function creaOportunidadComoOwner(page: Page, prefijo: string) {
  const nombre = uniqueCustomerName(prefijo);
  await page.getByRole("button", { name: "Alta rápida" }).click();
  const dialog = page.getByRole("dialog", { name: "Alta rápida" });
  await dialog.getByLabel("Nombre del cliente").fill(nombre);
  await dialog.getByLabel("Teléfono").fill(uniquePhone());
  await dialog.getByRole("button", { name: "Crear oportunidad" }).click();
  await expect(page).toHaveURL(/\/oportunidades\//);
  return { nombre, url: page.url() };
}

test.describe("#1 Eliminar oportunidad", () => {
  test("BLOQUEADO con interacciones: avisa, NO abre la confirmación, y la oportunidad sigue existiendo", async ({
    page,
  }) => {
    // `owner`: el botón "Eliminar oportunidad" solo se renderiza para ese rol,
    // porque la mutation es `requireOwner` (AIT-65) y la UI refleja una
    // restricción que existe de verdad en servidor.
    await loginAs(page, "owner");
    const { url } = await creaOportunidadComoOwner(page, "E2E Bloqueo Op");

    // Una interacción es lo que bloquea el borrado.
    await page.getByRole("button", { name: "Registrar interacción" }).first().click();
    const reg = page.getByRole("dialog", { name: "Registrar interacción" });
    await reg.getByRole("tab", { name: "Llamada" }).click();
    await reg.getByLabel("Nota / resultado").fill("Interacción que bloquea el borrado");
    await reg.getByRole("button", { name: "Guardar" }).click();
    await expect(reg).toBeHidden();

    const disparador = page.getByRole("button", { name: "Eliminar oportunidad" });
    await disparador.click();

    // El aviso, no la confirmación: el aviso tiene "Entendido" y la confirmación
    // tiene "Eliminar oportunidad". Comparten título, así que distinguirlos por
    // el título NO valdría.
    const aviso = page.getByRole("dialog", { name: "Eliminar oportunidad" });
    await expect(aviso.getByRole("button", { name: "Entendido" })).toBeVisible();
    await expect(
      aviso.getByRole("button", { name: "Eliminar oportunidad" }),
    ).toHaveCount(0);
    await expect(aviso).toContainText("No se puede eliminar");

    await esperaCicloDeFocoCompleto(page, "Eliminar oportunidad", disparador);

    // POR EFECTO: sigue existiendo. Un aviso que "explica" pero borra igual
    // pasaría cualquier comprobación que solo mirase el diálogo.
    await page.goto(url);
    await expect(page.getByRole("button", { name: "Eliminar oportunidad" })).toBeVisible();
  });

  test("PERMITIDO sin interacciones: abre la confirmación real", async ({ page }) => {
    await loginAs(page, "owner");   // ver la nota de rol en la prueba anterior
    await creaOportunidadComoOwner(page, "E2E Permitido Op");

    await page.getByRole("button", { name: "Eliminar oportunidad" }).click();

    const confirmacion = page.getByRole("dialog", { name: "Eliminar oportunidad" });
    // La confirmación real: tiene el botón destructivo y NO tiene "Entendido".
    await expect(
      confirmacion.getByRole("button", { name: "Eliminar oportunidad" }),
    ).toBeVisible();
    await expect(confirmacion.getByRole("button", { name: "Entendido" })).toHaveCount(0);
  });
});

test.describe("#2 y #3 Presupuesto · comparten un solo diálogo", () => {
  // "Un diálogo por motivo, no por botón": los dos botones se bloquean por la
  // misma razón —la oportunidad está cerrada— así que abren el MISMO aviso. Si
  // esta suite asumiera un diálogo por botón, buscaría uno que no existe.

  test("BLOQUEADO con la venta cerrada: avisa y el editor SIGUE CERRADO", async ({
    page,
  }) => {
    await loginAs(page, "sales");
    await creaOportunidadYAbreDetalle(page, "E2E Bloqueo Presu");

    // Cerrar la oportunidad es lo que bloquea el presupuesto.
    await page.getByRole("button", { name: "Ganada" }).click();
    const ganada = page.getByRole("dialog", { name: "Marcar como ganada" });
    await ganada.getByLabel("Importe final (€)").fill("100");
    await ganada.getByRole("button", { name: "Marcar ganada" }).click();
    await expect(ganada).toBeHidden();

    const disparador = page.getByRole("button", { name: "Crear presupuesto" });
    await disparador.click();

    const aviso = page.getByRole("dialog", { name: "Presupuesto" });
    await expect(aviso).toContainText("La oportunidad está cerrada");

    // EL OBSERVABLE DE ESTE CASO: el editor NO se ha abierto. Aquí un recuento
    // no probaría nada —crear un presupuesto no cambia ningún contador que
    // podamos leer— así que se comprueba por la ausencia de sus campos.
    await expect(aviso.getByLabel("Concepto")).toHaveCount(0);
    await expect(aviso.getByRole("button", { name: "Guardar presupuesto" })).toHaveCount(0);
    await expect(aviso.getByRole("button", { name: "Entendido" })).toBeVisible();

    await esperaCicloDeFocoCompleto(page, "Presupuesto", disparador);
  });

  test("PERMITIDO con la venta abierta: abre el editor real", async ({ page }) => {
    await loginAs(page, "sales");
    await creaOportunidadYAbreDetalle(page, "E2E Permitido Presu");

    await page.getByRole("button", { name: "Crear presupuesto" }).click();

    const editor = page.getByRole("dialog", { name: "Presupuesto" });
    // El editor real: tiene campos. El aviso no tiene ninguno.
    await expect(editor.getByRole("button", { name: "Entendido" })).toHaveCount(0);
    await expect(editor.locator("input")).not.toHaveCount(0);
  });
});

test.describe("#5 Reabrir oportunidad · el caso que añadió AIT-86", () => {
  test("BLOQUEADO si ya está facturada: avisa y la venta sigue cerrada", async ({
    page,
  }) => {
    await loginAs(page, "sales");
    await creaOportunidadYAbreDetalle(page, "E2E Bloqueo Reabrir");

    await page.getByRole("button", { name: "Ganada" }).click();
    const ganada = page.getByRole("dialog", { name: "Marcar como ganada" });
    await ganada.getByLabel("Importe final (€)").fill("250");
    await ganada.getByRole("button", { name: "Marcar ganada" }).click();
    await expect(ganada).toBeHidden();

    // Facturarla es lo que bloquea la reapertura.
    await page.getByRole("button", { name: "Marcar facturado" }).click();
    await expect(page.getByRole("button", { name: "Marcar cobrado" })).toBeVisible();

    const disparador = page.getByRole("button", { name: "Reabrir oportunidad" });
    await disparador.click();

    const aviso = page.getByRole("dialog", { name: "Reabrir oportunidad" });
    await expect(aviso).toContainText("No se puede reabrir");
    await expect(aviso.getByRole("button", { name: "Entendido" })).toBeVisible();

    await esperaCicloDeFocoCompleto(page, "Reabrir oportunidad", disparador);

    // POR EFECTO: sigue cerrada. Si el aviso "explicara" pero reabriera igual,
    // volvería a aparecer el botón de cambiar etapa, que solo existe si está
    // abierta.
    await expect(page.getByRole("button", { name: "Cambiar etapa" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Reabrir oportunidad" })).toBeVisible();
  });

  test("PERMITIDO si está cerrada pero sin facturar: la reabre de verdad", async ({
    page,
  }) => {
    await loginAs(page, "sales");
    await creaOportunidadYAbreDetalle(page, "E2E Permitido Reabrir");

    await page.getByRole("button", { name: "Perdida" }).click();
    const perdida = page.getByRole("dialog", { name: "Marcar como perdida" });
    await perdida
      .getByLabel("Motivo de la pérdida")
      .selectOption("Eligió a la competencia");
    await perdida.getByRole("button", { name: "Marcar perdida" }).click();
    await expect(perdida).toBeHidden();

    await page.getByRole("button", { name: "Reabrir oportunidad" }).click();

    // POR EFECTO: vuelve a estar abierta — reaparece "Cambiar etapa".
    await expect(page.getByRole("button", { name: "Cambiar etapa" })).toBeVisible();
  });
});

test.describe("#4 Eliminar cliente", () => {
  // Solo `owner` ve este botón: la mutation es `requireOwner` (AIT-65) y la UI
  // refleja una restricción que existe de verdad en servidor.

  test("BLOQUEADO con oportunidades: avisa, NO abre la confirmación, y el cliente sigue existiendo", async ({
    page,
  }) => {
    await loginAs(page, "owner");

    // Un cliente con oportunidad: hoy es el único tipo que se puede crear
    // (justamente lo que viene a cambiar AIT-88).
    const { nombre } = await creaOportunidadComoOwner(page, "E2E Bloqueo Cliente");
    await expect(page).toHaveURL(/\/oportunidades\//);
    // El Detalle enlaza a la ficha con el nombre del cliente como texto.
    await page.getByRole("link", { name: nombre }).click();
    await expect(page).toHaveURL(/\/clientes\//);
    const urlFicha = page.url();

    const disparador = page.getByRole("button", { name: "Eliminar cliente" });
    await disparador.click();

    const aviso = page.getByRole("dialog", { name: "Eliminar cliente" });
    await expect(aviso).toContainText("No se puede eliminar");
    await expect(aviso.getByRole("button", { name: "Entendido" })).toBeVisible();
    // La confirmación real tiene un botón "Eliminar cliente" dentro; el aviso no.
    await expect(aviso.getByRole("button", { name: "Eliminar cliente" })).toHaveCount(0);

    await esperaCicloDeFocoCompleto(page, "Eliminar cliente", disparador);

    // POR EFECTO: el cliente sigue ahí.
    await page.goto(urlFicha);
    await expect(page.getByRole("heading", { name: nombre })).toBeVisible();
  });
});

test.describe("Los avisos dicen CUÁNTOS", () => {
  // "Un aviso que no permite decidir está a medio camino de no existir": con 3
  // interacciones te pones a borrarlas ahora, con 30 lo dejas para otro día.
  // Los mensajes del servidor ya llevaban la cifra; los de interfaz no.
  // Se prueba con DOS valores distintos a propósito: con uno solo, un "1"
  // cableado pasaría igual.

  test("el aviso de la oportunidad cuenta las interacciones, y cuenta bien", async ({
    page,
  }) => {
    await loginAs(page, "owner");
    await creaOportunidadComoOwner(page, "E2E Cifra Op");

    async function registraInteraccion(nota: string) {
      await page.getByRole("button", { name: "Registrar interacción" }).first().click();
      const reg = page.getByRole("dialog", { name: "Registrar interacción" });
      await reg.getByRole("tab", { name: "Llamada" }).click();
      await reg.getByLabel("Nota / resultado").fill(nota);
      await reg.getByRole("button", { name: "Guardar" }).click();
      await expect(reg).toBeHidden();
    }

    await registraInteraccion("Primera");
    await page.getByRole("button", { name: "Eliminar oportunidad" }).click();
    const aviso = page.getByRole("dialog", { name: "Eliminar oportunidad" });
    await expect(aviso).toContainText("tiene 1 interacción(es)");
    await page.keyboard.press("Escape");

    await registraInteraccion("Segunda");
    await page.getByRole("button", { name: "Eliminar oportunidad" }).click();
    // La cifra SIGUE al dato: si estuviera cableada, aquí seguiría diciendo 1.
    await expect(aviso).toContainText("tiene 2 interacción(es)");
  });

  test("el aviso del cliente cuenta sus oportunidades", async ({ page }) => {
    await loginAs(page, "owner");
    const { nombre } = await creaOportunidadComoOwner(page, "E2E Cifra Cliente");
    await page.getByRole("link", { name: nombre }).click();
    await expect(page).toHaveURL(/\/clientes\//);

    await page.getByRole("button", { name: "Eliminar cliente" }).click();
    await expect(
      page.getByRole("dialog", { name: "Eliminar cliente" }),
    ).toContainText("tiene 1 oportunidad(es)");
  });
});

test.describe("Guardar etapa y prioridad ya no se quedan grises sin explicar", () => {
  // AIT-84: estaban `disabled` cuando no habías cambiado nada y SIN ningún
  // `title` — dos controles apagados sin forma de saber por qué. El diseño no
  // deshabilita ninguno en esta pantalla, así que se habilitan y, sin cambios,
  // el diálogo simplemente se cierra.

  test("el botón está habilitado sin cambios, y guardar sin cambiar nada NO escribe", async ({
    page,
  }) => {
    await loginAs(page, "sales");
    const { url } = await creaOportunidadYAbreDetalle(page, "E2E Botones");

    // El próximo paso de un alta nueva es el del canal (FIRST_STEP_BY_SOURCE).
    await expect(page.getByText("Llamar para presentar la propuesta")).toBeVisible();

    await page.getByRole("button", { name: "Cambiar etapa" }).click();
    const dialogo = page.getByRole("dialog", { name: "Cambiar etapa" });
    const guardar = dialogo.getByRole("button", { name: "Guardar etapa" });

    // LO QUE ARREGLA LA ISSUE: ya no está gris sin explicación.
    await expect(guardar).toBeEnabled();

    // Y pulsarlo sin cambios cierra, sin error rojo y sin escribir.
    await guardar.click();
    await expect(dialogo).toBeHidden();
    await expect(page.getByText("Introduce")).toHaveCount(0);

    // S2 — EL OBSERVABLE CORRECTO: releer la etapa NO distinguiría "no se llamó"
    // de "se llamó y escribió lo mismo" — saldría la de siempre en los dos
    // casos. Lo que sí los distingue es el EFECTO LATERAL: `changeStage`
    // inserta un próximo paso nuevo (NEXT_STEP_BY_STAGE). Si se hubiera
    // llamado, el próximo paso habría cambiado.
    await page.goto(url);
    await expect(page.getByText("Llamar para presentar la propuesta")).toBeVisible();
    await expect(page.getByText("Enviar el presupuesto")).toHaveCount(0);
  });

  test("y con un cambio real sigue guardando igual que antes", async ({ page }) => {
    await loginAs(page, "sales");
    await creaOportunidadYAbreDetalle(page, "E2E Botones Cambio");

    await page.getByRole("button", { name: "Cambiar etapa" }).click();
    const dialogo = page.getByRole("dialog", { name: "Cambiar etapa" });
    await dialogo.getByLabel("Etapa").selectOption("presupuesto");
    await dialogo.getByRole("button", { name: "Guardar etapa" }).click();
    await expect(dialogo).toBeHidden();

    // Por efecto: el próximo paso que el caso anterior NO debía crear. Es la
    // otra mitad de la prueba — sin ésta, aquélla podría estar pasando porque
    // ese texto no aparece nunca.
    await expect(page.getByText("Enviar el presupuesto")).toBeVisible();
  });
});

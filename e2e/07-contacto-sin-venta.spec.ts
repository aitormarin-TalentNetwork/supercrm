import { test, expect, type Page } from "@playwright/test";
import { loginAs, uniqueCustomerName, uniquePhone } from "./helpers";

// AIT-88 — guardar a una persona SIN inventarle una venta.
//
// Hasta esta issue, el único `insert("customers")` del backend vivía en
// `opportunities.createQuick`, que siempre crea además la oportunidad, su
// próximo paso y su registro de idempotencia. Para guardar el teléfono de
// alguien que pasó por la tienda había que inventarse una venta — y eso
// contamina justo lo que este CRM mide.
//
// EL CRITERIO SE MIDE POR EFECTO Y SOBRE VARIOS CONTADORES, no sobre uno: un
// solo contador no distingue "no creó oportunidad" de "no creó nada".

// AIT-118 — ESTE SPEC YA NO MIDE CONTADORES GLOBALES DEL DEPLOYMENT.
//
// Medía "N clientes" y "N oportunidades abiertas" —los totales que pinta el
// producto— y exigía `total + 1`. Una afirmación sobre un contador global es una
// afirmación sobre el mundo entero, y el mundo no es de quien corre el test: lo
// mueve otra corrida, la semilla del QA, o alguien usando la app a mano.
//
// Y conviene decir qué NO pasó aquí, porque es lo que hace que se reintroduzca:
// quien lo escribió NO fue descuidado. Dejó documentado que leer el DOM tras
// `goto` mide el esqueleto, que el esqueleto da cero, y que un cero por no haber
// cargado no distingue "no creó nada" de "todavía no ha mirado". Hizo el
// razonamiento difícil bien.
//   >> Todo el cuidado fue a medir el número correctamente, y ninguno a si el
//   >> número era suyo.
// No fue falta de rigor: fue rigor puesto en la precisión de la medida en vez de
// en su sujeto. Un defecto que se parece al cuidado es el que más dura.
//
// EL EJE ES EL TELÉFONO, NO EL NOMBRE, y no por gusto: `uniquePhone()` combina
// marca de tiempo Y aleatoriedad (AIT-80), mientras que `uniqueCustomerName()`
// es solo `Date.now()` — dos corridas simultáneas pueden generar el mismo
// nombre. Se elige el identificador por DE DÓNDE VIENE SU UNICIDAD, no por cuál
// se lee mejor. (Que `uniqueCustomerName` lleve solo la hora es un defecto
// aparte, de `e2e/helpers.ts`, y no se toca desde aquí.)

/** Deja el listado de clientes filtrado por el teléfono ÚNICO de esta corrida.
 *
 * BARRERA DE CARGA, y es estructural, no una espera: `app/clientes/page.tsx`
 * devuelve "Cargando…" mientras `customers === undefined` y **el buscador se
 * pinta después**, así que su presencia YA garantiza que la consulta terminó.
 * No se añade un `waitFor` encima: una espera redundante sobre una garantía
 * estructural desplaza a la garantía como explicación, y el siguiente que lea
 * esto creería que la barrera es la espera y no la forma del componente. */
async function abreListadoFiltrado(page: Page, telefono: string) {
  await page.goto("/clientes");
  const buscador = page.getByPlaceholder("Buscar por nombre, teléfono o email…");
  await expect(buscador, "el listado debe haber cargado antes de filtrar").toBeVisible();
  await buscador.fill(telefono);
}

/** Las filas del listado ya filtrado por el teléfono de esta corrida. */
function filasDeLaCorrida(page: Page) {
  return page.locator("tbody tr");
}

/** El NOMBRE de la fila `i`, no el texto de su celda.
 *
 * DOS trampas, las dos medidas y no supuestas:
 *  1. la celda lleva un `Avatar` con las INICIALES delante del nombre
 *     (`app/clientes/page.tsx:86-89`), así que su `innerText` es
 *     "E1E2E Contacto…" y la comparación exacta falla:
 *       Expected: "E2E Contacto 1788954967502"
 *       Received: "E1E2E Contacto 1788954967502"
 *  2. y `span.font-semibold` NO desambigua, porque el Avatar también lo lleva
 *     (`components/ui/Avatar.tsx:36`) — Playwright lo rechaza por strict mode,
 *     que es lo correcto: dos elementos y ninguna razón para preferir uno.
 * Se ancla en `span.truncate`, que solo lo tiene el nombre. */
function nombreDeLaFila(page: Page, i: number) {
  return filasDeLaCorrida(page).nth(i).locator("td").first().locator("span.truncate");
}

/** Comprueba que NINGUNO de los clientes de esta corrida tiene oportunidades.
 *
 * ⚠️ PREMISA DE ENUMERACIÓN — si esto deja de ser cierto, este helper deja de
 * cubrir el contrato SIN AVISAR, y es lo único que sostiene que baste con mirar
 * a los clientes de la corrida en vez de al total del deployment:
 *
 *   · en TODO `convex/` hay DOS escritores de `opportunities`:
 *       convex/opportunities.ts  createQuick        -> el cliente que crea/encuentra por teléfono
 *       convex/opportunities.ts  createForCustomer  -> el cliente que se le pasa, y los ids
 *                                                      salen de findCustomersByPhone
 *                                                      (acotado por storeId + teléfono)
 *   · el diálogo de alta rápida solo alcanza `createQuick`, `createForCustomer`
 *     y `createContact`, y esta última no inserta oportunidades.
 *
 * Es decir: toda oportunidad que esta acción puede crear queda asociada a un
 * cliente de ESTA submission, y todos comparten el teléfono único. Si mañana
 * aparece un tercer `insert("opportunities")`, o el diálogo llama a otra
 * mutation, hay que volver aquí.
 *
 * Y se recorren TODOS, no el primero: en los escenarios de duplicado hay dos
 * clientes en juego y `createForCustomer` colgaría la oportunidad del ORIGINAL.
 * Mirar solo al recién creado dejaría fuera justo el caso que puede fallar. */
async function ningunClienteDeLaCorridaTieneOportunidades(
  page: Page,
  telefono: string,
) {
  await abreListadoFiltrado(page, telefono);
  const cuantos = await filasDeLaCorrida(page).count();
  // Sin esta comprobación, un filtro que no encontrara nada haría que el bucle
  // de abajo no se ejecutara y el test pasara sin mirar nada.
  expect(cuantos, "la corrida debe tener al menos un cliente con su teléfono").toBeGreaterThan(0);
  for (let i = 0; i < cuantos; i += 1) {
    await abreListadoFiltrado(page, telefono);
    await filasDeLaCorrida(page).nth(i).click();
    await expect(page).toHaveURL(/\/clientes\//);
    // "Sin oportunidades todavía." vive en la rama YA CARGADA de la ficha
    // (app/clientes/[id]/page.tsx), así que afirmarlo es en sí mismo barrera.
    await expect(
      page.getByText("Sin oportunidades todavía."),
      `el cliente ${i + 1} de ${cuantos} no debe tener oportunidades`,
    ).toBeVisible();
  }
}

/** Abre el alta rápida desde "Hoy" y elige el modo. */
async function abreAltaRapida(page: Page, conVenta: boolean) {
  await page.goto("/hoy");
  await page.getByTestId("alta-rapida-fab").click();
  const dialog = page.getByRole("dialog", { name: "Alta rápida" });
  await dialog
    .getByLabel("¿Hay una venta en marcha?")
    .selectOption(conVenta ? "si" : "no");
  return dialog;
}

test.describe("Guardar un contacto sin abrirle una venta", () => {
  test("crea el cliente y NINGUNA oportunidad, medido sobre lo suyo", async ({
    page,
  }) => {
    await loginAs(page, "sales");
    const nombre = uniqueCustomerName("E2E Contacto");
    const telefono = uniquePhone();
    const dialog = await abreAltaRapida(page, false);
    await dialog.getByLabel("Nombre del cliente").fill(nombre);
    await dialog.getByLabel("Teléfono").fill(telefono);
    await dialog.getByRole("button", { name: "Guardar contacto" }).click();

    // Al guardarlo lleva a su ficha: la persona ya es un cliente de pleno
    // derecho, no un registro a medias.
    await expect(page).toHaveURL(/\/clientes\//);
    await expect(page.getByRole("heading", { name: nombre })).toBeVisible();
    await expect(page.getByText("Sin oportunidades todavía.")).toBeVisible();

    // El cliente existe, y es EXACTAMENTE uno: coincidencia exacta del nombre,
    // no subcadena — el buscador filtra por `includes`.
    await abreListadoFiltrado(page, telefono);
    await expect(filasDeLaCorrida(page)).toHaveCount(1);
    await expect(nombreDeLaFila(page, 0)).toHaveText(nombre);

    // EL CRITERIO CENTRAL: no se ha creado NINGUNA oportunidad.
    // Cubre el contrato por la PREMISA DE ENUMERACIÓN documentada en
    // `ningunClienteDeLaCorridaTieneOportunidades`: no hay camino por el que
    // esta acción cuelgue una oportunidad de un cliente ajeno a la corrida.
    await ningunClienteDeLaCorridaTieneOportunidades(page, telefono);
  });

  test("y en modo venta sigue creando la oportunidad, como siempre", async ({
    page,
  }) => {
    // Gemela positiva de la anterior: sin ésta, aquélla podría estar pasando
    // porque el formulario no crea nada en absoluto.
    await loginAs(page, "sales");
    const nombre = uniqueCustomerName("E2E Venta");
    const telefono = uniquePhone();

    const dialog = await abreAltaRapida(page, true);
    await dialog.getByLabel("Nombre del cliente").fill(nombre);
    await dialog.getByLabel("Teléfono").fill(telefono);
    await dialog.getByRole("button", { name: "Crear oportunidad" }).click();

    await expect(page).toHaveURL(/\/oportunidades\//);
    // La oportunidad creada es la de ESTE cliente, no "una más en el total".
    await expect(page.getByRole("heading", { name: nombre })).toBeVisible();
    // Y su ficha ya NO dice "Sin oportunidades todavía." — es la gemela
    // positiva: sin ella, el test de arriba podría estar pasando porque el
    // formulario no crea nada en absoluto.
    await abreListadoFiltrado(page, telefono);
    await expect(filasDeLaCorrida(page)).toHaveCount(1);
    await filasDeLaCorrida(page).first().click();
    // ⚠️ BARRERA, y aquí NO sirve la de las aserciones negativas.
    // Allí se afirma la PRESENCIA de "Sin oportunidades todavía.", y su
    // presencia demuestra que la ficha cargó — vive en la rama cargada.
    // Aquí se afirma su AUSENCIA, y la ausencia no demuestra nada: falta
    // igual si la ficha aún muestra "Cargando…" (app/clientes/[id]/page.tsx
    // solo pinta eso mientras `ficha` o `interactions` sean `undefined`).
    // El mismo elemento sirve de barrera en una dirección y no en la otra.
    // Así que primero se espera algo EXCLUSIVO de la rama cargada —el
    // encabezado con el nombre del cliente— y solo después se afirma la
    // ausencia. Sin esto, este control positivo podría dar verde sin haber
    // mirado los datos, o sea el mismo verde vacío que viene a descartar.
    await expect(page.getByRole("heading", { name: nombre })).toBeVisible();
    await expect(page.getByText("Sin oportunidades todavía.")).toHaveCount(0);
  });

  test("al contacto se le puede añadir una oportunidad después (flujo de AIT-74)", async ({
    page,
  }) => {
    await loginAs(page, "sales");
    const nombre = uniqueCustomerName("E2E Contacto Luego");
    const dialog = await abreAltaRapida(page, false);
    await dialog.getByLabel("Nombre del cliente").fill(nombre);
    await dialog.getByLabel("Teléfono").fill(uniquePhone());
    await dialog.getByRole("button", { name: "Guardar contacto" }).click();
    await expect(page).toHaveURL(/\/clientes\//);

    await page
      .getByRole("button", { name: "Nueva oportunidad para este cliente" })
      .click();
    const alta = page.getByRole("dialog", { name: "Nueva oportunidad" });
    await alta.getByLabel("Producto / interés").fill("Venta que llegó después");
    await alta.getByRole("button", { name: "Crear oportunidad" }).click();

    // Por efecto: el contacto deja de estar sin ventas.
    await expect(page).toHaveURL(/\/oportunidades\//);
  });
});

test.describe("El aviso de duplicado en modo contacto NO crea ventas", () => {
  // ESTE ES EL MAJOR de la ronda 2 del plan: el aviso de AIT-80 es específico de
  // oportunidades — "Usar este cliente" ejecuta `createForCustomer` y CREA una.
  // Reutilizarlo tal cual habría hecho que la vía creada para no ensuciar el
  // pipeline lo ensuciara.

  test("«Abrir su ficha» navega y no escribe NADA", async ({ page }) => {
    await loginAs(page, "sales");
    const telefono = uniquePhone();
    const nombre = uniqueCustomerName("E2E Dup Contacto");

    // Primero, el contacto original.
    let dialog = await abreAltaRapida(page, false);
    await dialog.getByLabel("Nombre del cliente").fill(nombre);
    await dialog.getByLabel("Teléfono").fill(telefono);
    await dialog.getByRole("button", { name: "Guardar contacto" }).click();
    await expect(page).toHaveURL(/\/clientes\//);

    const nombreDescartado = uniqueCustomerName("E2E Otro");

    // Ahora el mismo teléfono otra vez: debe avisar.
    dialog = await abreAltaRapida(page, false);
    await dialog.getByLabel("Nombre del cliente").fill(nombreDescartado);
    await dialog.getByLabel("Teléfono").fill(telefono);
    await dialog.getByRole("button", { name: "Guardar contacto" }).click();

    await expect(dialog.getByText("Ya hay un cliente con este teléfono")).toBeVisible();
    // El texto NO promete oportunidades en este modo.
    await expect(dialog.getByText("Esta persona ya está guardada")).toBeVisible();
    await expect(dialog.getByText("añade la oportunidad a su ficha")).toHaveCount(0);

    await dialog.getByRole("button", { name: "Abrir su ficha" }).click();
    await expect(page).toHaveURL(/\/clientes\//);

    // POR EFECTO Y SOBRE LO SUYO: aceptar la coincidencia NO ha creado nada.
    // Sigue habiendo UN solo cliente con este teléfono —el original— y el que se
    // iba a crear no existe. Coincidencia exacta del nombre, no subcadena.
    await abreListadoFiltrado(page, telefono);
    await expect(filasDeLaCorrida(page)).toHaveCount(1);
    await expect(nombreDeLaFila(page, 0)).toHaveText(nombre);
    // No se añade un "y el descartado no está": UNA fila cuyo nombre es
    // exactamente el original ya lo dice. Una aserción redundante encima de una
    // más fuerte desplaza a la fuerte como explicación.

    // Y ninguna oportunidad. En modo venta este mismo botón habría creado una,
    // y la habría colgado del cliente ORIGINAL — por eso se recorren todos.
    // Cubre el contrato por la PREMISA DE ENUMERACIÓN documentada en
    // `ningunClienteDeLaCorridaTieneOportunidades`: no hay camino por el que
    // esta acción cuelgue una oportunidad de un cliente ajeno a la corrida.
    await ningunClienteDeLaCorridaTieneOportunidades(page, telefono);
  });

  test("«Crear uno nuevo igualmente» crea SOLO el cliente", async ({ page }) => {
    await loginAs(page, "sales");
    const telefono = uniquePhone();

    const nombreA = uniqueCustomerName("E2E Dup A");
    const nombreB = uniqueCustomerName("E2E Dup B");

    let dialog = await abreAltaRapida(page, false);
    await dialog.getByLabel("Nombre del cliente").fill(nombreA);
    await dialog.getByLabel("Teléfono").fill(telefono);
    await dialog.getByRole("button", { name: "Guardar contacto" }).click();
    await expect(page).toHaveURL(/\/clientes\//);

    dialog = await abreAltaRapida(page, false);
    await dialog.getByLabel("Nombre del cliente").fill(nombreB);
    await dialog.getByLabel("Teléfono").fill(telefono);
    await dialog.getByRole("button", { name: "Guardar contacto" }).click();
    await expect(dialog.getByText("Ya hay un cliente con este teléfono")).toBeVisible();

    await dialog.getByRole("button", { name: "Crear uno nuevo igualmente" }).click();
    await expect(page).toHaveURL(/\/clientes\//);

    // Ahora hay DOS clientes con este teléfono —el original y el nuevo— y
    // ninguna oportunidad. Si llamara a `createQuick` —que es lo que hace este
    // mismo botón en modo venta— habría además una oportunidad, colgada de uno
    // de los dos: por eso se recorren LOS DOS y no solo el recién creado.
    await abreListadoFiltrado(page, telefono);
    await expect(filasDeLaCorrida(page)).toHaveCount(2);
    const nombres: string[] = [];
    for (let i = 0; i < 2; i += 1) {
      nombres.push((await nombreDeLaFila(page, i).innerText()).trim());
    }
    // Exacta y completa: los DOS nombres, no "hay dos filas" ni "una de ellas".
    expect(nombres.sort()).toEqual([nombreA, nombreB].sort());
    // Cubre el contrato por la PREMISA DE ENUMERACIÓN documentada en
    // `ningunClienteDeLaCorridaTieneOportunidades`: no hay camino por el que
    // esta acción cuelgue una oportunidad de un cliente ajeno a la corrida.
    await ningunClienteDeLaCorridaTieneOportunidades(page, telefono);
  });
});

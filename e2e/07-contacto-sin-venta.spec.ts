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

// Los dos contadores los pinta el propio producto, y ninguno de los dos existe
// hasta que `useQuery` resuelve: hasta entonces la pantalla es "Cargando…"
// (app/clientes/page.tsx:135, app/pipeline/page.tsx:103). Leer el DOM justo
// tras `goto` mide el esqueleto, y el esqueleto siempre da cero — que es
// justamente el número que estos tests esperan ver cuando algo NO se creó.
// Un contador que puede dar cero por no haber cargado no distingue "no creó
// nada" de "todavía no ha mirado", así que aquí se espera al contador, no al
// `goto`.

/** Cuenta los clientes que ve el usuario actual, leyendo el listado. */
async function cuentaClientes(page: Page) {
  await page.goto("/clientes");
  const contador = page.getByText(/^\d+ clientes?$/);
  await expect(contador, "el listado debe mostrar su contador").toBeVisible();
  return Number((await contador.innerText()).match(/\d+/)![0]);
}

/** Cuenta las oportunidades ABIERTAS, con el contador propio de Pipeline. */
async function cuentaOportunidades(page: Page) {
  await page.goto("/pipeline");
  // El contador comparte el <p> con el importe en juego ("… · 1.234 € en
  // juego"), así que la regex NO va anclada: se acota el elemento y se lee el
  // primer número, que es el recuento.
  const contador = page.locator("header p", {
    hasText: /oportunidades? abiertas?/,
  });
  await expect(contador, "el pipeline debe mostrar su contador").toBeVisible();
  return Number((await contador.innerText()).match(/\d+/)![0]);
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
  test("crea el cliente y NINGUNA oportunidad, medido por los dos contadores", async ({
    page,
  }) => {
    await loginAs(page, "sales");
    const clientesAntes = await cuentaClientes(page);
    const oportunidadesAntes = await cuentaOportunidades(page);

    const nombre = uniqueCustomerName("E2E Contacto");
    const dialog = await abreAltaRapida(page, false);
    await dialog.getByLabel("Nombre del cliente").fill(nombre);
    await dialog.getByLabel("Teléfono").fill(uniquePhone());
    await dialog.getByRole("button", { name: "Guardar contacto" }).click();

    // Al guardarlo lleva a su ficha: la persona ya es un cliente de pleno
    // derecho, no un registro a medias.
    await expect(page).toHaveURL(/\/clientes\//);
    await expect(page.getByRole("heading", { name: nombre })).toBeVisible();
    await expect(page.getByText("Sin oportunidades todavía.")).toBeVisible();

    expect(await cuentaClientes(page)).toBe(clientesAntes + 1);
    // EL CRITERIO CENTRAL: el pipeline no se ha movido.
    expect(await cuentaOportunidades(page)).toBe(oportunidadesAntes);
  });

  test("y en modo venta sigue creando la oportunidad, como siempre", async ({
    page,
  }) => {
    // Gemela positiva de la anterior: sin ésta, aquélla podría estar pasando
    // porque el formulario no crea nada en absoluto.
    await loginAs(page, "sales");
    const oportunidadesAntes = await cuentaOportunidades(page);

    const dialog = await abreAltaRapida(page, true);
    await dialog.getByLabel("Nombre del cliente").fill(uniqueCustomerName("E2E Venta"));
    await dialog.getByLabel("Teléfono").fill(uniquePhone());
    await dialog.getByRole("button", { name: "Crear oportunidad" }).click();

    await expect(page).toHaveURL(/\/oportunidades\//);
    expect(await cuentaOportunidades(page)).toBe(oportunidadesAntes + 1);
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

    const clientesAntes = await cuentaClientes(page);
    const oportunidadesAntes = await cuentaOportunidades(page);

    // Ahora el mismo teléfono otra vez: debe avisar.
    dialog = await abreAltaRapida(page, false);
    await dialog.getByLabel("Nombre del cliente").fill(uniqueCustomerName("E2E Otro"));
    await dialog.getByLabel("Teléfono").fill(telefono);
    await dialog.getByRole("button", { name: "Guardar contacto" }).click();

    await expect(dialog.getByText("Ya hay un cliente con este teléfono")).toBeVisible();
    // El texto NO promete oportunidades en este modo.
    await expect(dialog.getByText("Esta persona ya está guardada")).toBeVisible();
    await expect(dialog.getByText("añade la oportunidad a su ficha")).toHaveCount(0);

    await dialog.getByRole("button", { name: "Abrir su ficha" }).click();
    await expect(page).toHaveURL(/\/clientes\//);

    // POR EFECTO, y sobre los dos contadores: aceptar la coincidencia NO ha
    // creado nada. En modo venta, este mismo botón habría creado una oportunidad.
    expect(await cuentaClientes(page)).toBe(clientesAntes);
    expect(await cuentaOportunidades(page)).toBe(oportunidadesAntes);
  });

  test("«Crear uno nuevo igualmente» crea SOLO el cliente", async ({ page }) => {
    await loginAs(page, "sales");
    const telefono = uniquePhone();

    let dialog = await abreAltaRapida(page, false);
    await dialog.getByLabel("Nombre del cliente").fill(uniqueCustomerName("E2E Dup A"));
    await dialog.getByLabel("Teléfono").fill(telefono);
    await dialog.getByRole("button", { name: "Guardar contacto" }).click();
    await expect(page).toHaveURL(/\/clientes\//);

    const clientesAntes = await cuentaClientes(page);
    const oportunidadesAntes = await cuentaOportunidades(page);

    dialog = await abreAltaRapida(page, false);
    await dialog.getByLabel("Nombre del cliente").fill(uniqueCustomerName("E2E Dup B"));
    await dialog.getByLabel("Teléfono").fill(telefono);
    await dialog.getByRole("button", { name: "Guardar contacto" }).click();
    await expect(dialog.getByText("Ya hay un cliente con este teléfono")).toBeVisible();

    await dialog.getByRole("button", { name: "Crear uno nuevo igualmente" }).click();
    await expect(page).toHaveURL(/\/clientes\//);

    // Sube el cliente, NO la oportunidad. Si llamara a `createQuick` —que es lo
    // que hace este mismo botón en modo venta— subirían los dos.
    expect(await cuentaClientes(page)).toBe(clientesAntes + 1);
    expect(await cuentaOportunidades(page)).toBe(oportunidadesAntes);
  });
});

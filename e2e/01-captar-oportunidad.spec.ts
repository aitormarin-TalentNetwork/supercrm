import { test, expect } from "@playwright/test";
import { loginAs, createOpportunityViaAltaRapida, uniqueCustomerName, uniquePhone } from "./helpers";

// PRD §7, Proceso 1 — Captar una oportunidad (Carlos):
// desde "Hoy" → "+ Alta rápida" → al crear, se abre el "Detalle de
// oportunidad" con el primer próximo paso ya generado (AIT-15: toda
// oportunidad abierta tiene siempre un próximo paso).
test("captar oportunidad desde Hoy genera el Detalle con el primer próximo paso", async ({
  page,
}) => {
  await loginAs(page, "sales");

  const customerName = uniqueCustomerName("E2E Captar");
  await createOpportunityViaAltaRapida(page, {
    name: customerName,
    phone: uniquePhone(),
  });

  // Aterriza en el Detalle de la oportunidad recién creada.
  await expect(page.getByRole("heading", { name: customerName })).toBeVisible();

  // Próximo paso generado automáticamente (AIT-15): la sección muestra el
  // badge "Pendiente" (dueDate = ahora, no puede estar vencido) en vez del
  // estado vacío "Sin próximo paso — la oportunidad está cerrada.".
  await expect(page.getByText("Próximo paso")).toBeVisible();
  await expect(page.getByText("Pendiente")).toBeVisible();
});

// AIT-80 — el alta rápida avisa en vez de crear un segundo cliente con el
// mismo teléfono. Éste es el ÚNICO test que repite teléfono a propósito: los
// demás usan uniquePhone() justamente para no toparse con este aviso.
test("dar de alta un teléfono que ya existe avisa y ofrece usar el cliente existente", async ({
  page,
}) => {
  await loginAs(page, "sales");

  // Primera alta: crea el cliente. Se vuelve a Hoy para repetir el flujo.
  const phone = uniquePhone();
  const customerName = uniqueCustomerName("E2E Duplicado");
  await createOpportunityViaAltaRapida(page, { name: customerName, phone });

  await page.goto("/hoy");
  await page.getByRole("button", { name: "Alta rápida" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nombre del cliente").fill(uniqueCustomerName("E2E Otro"));
  // El MISMO teléfono, escrito con separadores: la detección compara la forma
  // canónica, así que "600 12 34 56" y "6001234 56" son el mismo número.
  await dialog.getByLabel("Teléfono").fill(phone.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3"));
  await dialog.getByRole("button", { name: "Crear oportunidad" }).click();

  // Avisa, nombra al cliente que ya existe, y NO ha navegado a ninguna
  // oportunidad: no se ha creado nada todavía.
  await expect(dialog.getByText("Ya hay un cliente con este teléfono")).toBeVisible();
  await expect(dialog.getByText(customerName)).toBeVisible();
  await expect(page).toHaveURL(/\/hoy/);

  // Y el aviso no bloquea: desde aquí se puede colgar la oportunidad del
  // cliente que ya existe.
  await dialog.getByRole("button", { name: "Usar este cliente" }).click();
  await page.waitForURL(/\/oportunidades\/.+/);
  await expect(page.getByRole("heading", { name: customerName })).toBeVisible();
});

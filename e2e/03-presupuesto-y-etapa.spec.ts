import { test, expect } from "@playwright/test";
import { loginAs, createOpportunityViaAltaRapida, uniqueCustomerName } from "./helpers";

// PRD §7, Proceso 3 — Presupuesto y avance de etapa:
// en "Detalle" se registra el presupuesto (importe + estado) y se cambia
// la etapa; la oportunidad se mueve sola en "Pipeline".
//
// El presupuesto (Post-MVP, AIT-29) se construye con líneas de catálogo,
// así que primero nos aseguramos de que existe al menos un producto (como
// Marta) antes de crear el presupuesto (como Carlos).
test("registrar presupuesto y cambiar etapa mueve la oportunidad en Pipeline", async ({
  browser,
}) => {
  const productName = uniqueCustomerName("Producto E2E");

  // --- Marta: garantiza que hay al menos un producto en el catálogo ---
  const ownerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  await loginAs(ownerPage, "owner");
  await ownerPage.goto("/catalogo");
  await ownerPage.getByLabel("Nombre del producto").fill(productName);
  await ownerPage.getByLabel("Precio (€)").fill("50,00");
  await ownerPage.getByRole("button", { name: "Añadir" }).click();
  await expect(ownerPage.getByText(productName)).toBeVisible();
  await ownerContext.close();

  // --- Carlos: crea la oportunidad, registra el presupuesto y avanza etapa ---
  const salesContext = await browser.newContext();
  const page = await salesContext.newPage();
  await loginAs(page, "sales");

  const customerName = uniqueCustomerName("E2E Presupuesto");
  await createOpportunityViaAltaRapida(page, {
    name: customerName,
    phone: "600333444",
  });

  // Registrar el presupuesto: importe (líneas de catálogo) + estado.
  await page.getByRole("button", { name: "Crear presupuesto" }).click();
  const quoteDialog = page.getByRole("dialog", { name: "Presupuesto" });
  await expect(quoteDialog).toBeVisible();
  // El editor arranca sin líneas (QuoteDialog: lines = [] si no hay
  // presupuesto previo) — hay que añadir una antes de poder elegir producto.
  // addLine() no hace nada si la query de productos aún no ha resuelto, así
  // que reintentamos el click hasta que aparezca el selector "Producto".
  await expect(async () => {
    await quoteDialog.getByRole("button", { name: "Añadir línea" }).click();
    await expect(quoteDialog.getByLabel("Producto")).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10_000 });
  const productSelect = quoteDialog.getByLabel("Producto");
  const optionValue = await productSelect
    .locator("option", { hasText: productName })
    .getAttribute("value");
  await productSelect.selectOption(optionValue!);
  await quoteDialog.getByRole("button", { name: "Guardar presupuesto" }).click();
  await expect(quoteDialog).toBeHidden();

  // El importe (subtotal/IVA/total) y el estado por defecto ("Enviado")
  // quedan visibles en el Detalle.
  await expect(page.getByText("Enviado")).toBeVisible();
  // exact:true — "Subtotal" contiene "total" como substring (match
  // insensible a mayúsculas de getByText) y produce un locator ambiguo.
  await expect(page.getByText("Total", { exact: true })).toBeVisible();

  // Cambiar etapa: Contacto → Presupuesto.
  await page.getByRole("button", { name: "Cambiar etapa" }).click();
  const stageDialog = page.getByRole("dialog", { name: "Cambiar etapa" });
  await stageDialog.getByLabel("Etapa").selectOption("presupuesto");
  await stageDialog.getByRole("button", { name: "Guardar etapa" }).click();
  await expect(stageDialog).toBeHidden();

  // La oportunidad se mueve sola en Pipeline: aparece en la columna
  // "Presupuesto" (data-stage="presupuesto"), no en "Contacto".
  await page.goto("/pipeline");
  const presupuestoColumn = page.locator('[data-stage="presupuesto"]');
  const contactoColumn = page.locator('[data-stage="contacto"]');
  await expect(presupuestoColumn.getByText(customerName)).toBeVisible();
  await expect(contactoColumn.getByText(customerName)).toHaveCount(0);

  await salesContext.close();
});

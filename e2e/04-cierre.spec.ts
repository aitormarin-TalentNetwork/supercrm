import { test, expect } from "@playwright/test";
import { loginAs, createOpportunityViaAltaRapida, uniqueCustomerName, uniquePhone } from "./helpers";

// PRD §7, Proceso 4 — Cierre:
// en "Detalle" se marca la oportunidad como ganada (con importe final) o
// perdida (con motivo); con eso queda registrada la venta.
test.describe("Cierre de oportunidad", () => {
  test("marcar como ganada registra el importe final y desactiva las acciones abiertas", async ({
    page,
  }) => {
    await loginAs(page, "sales");
    const customerName = uniqueCustomerName("E2E Ganada");
    await createOpportunityViaAltaRapida(page, {
      name: customerName,
      phone: uniquePhone(),
    });

    await page.getByRole("button", { name: "Ganada" }).click();
    const wonDialog = page.getByRole("dialog", { name: "Marcar como ganada" });
    // Importe por debajo de 1000 a propósito: evita depender de si el
    // entorno formatea el separador de miles ("1.234,56") o no (visto en
    // este Chromium: "1234,56", sin punto de millar) — solo nos importa
    // que el importe final quede registrado y visible.
    await wonDialog.getByLabel("Importe final (€)").fill("500,50");
    await wonDialog.getByRole("button", { name: "Marcar ganada" }).click();
    await expect(wonDialog).toBeHidden();

    await expect(page.getByText(/Oportunidad ganada · 500,50\s?€/)).toBeVisible();
    // Cerrada: ya no se puede cambiar de etapa ni volver a cerrar.
    await expect(page.getByRole("button", { name: "Cambiar etapa" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Ganada", exact: true })).toHaveCount(0);
  });

  test("marcar como perdida exige motivo y lo muestra en el Detalle", async ({ page }) => {
    await loginAs(page, "sales");
    const customerName = uniqueCustomerName("E2E Perdida");
    await createOpportunityViaAltaRapida(page, {
      name: customerName,
      phone: uniquePhone(),
    });

    await page.getByRole("button", { name: "Perdida" }).click();
    const lostDialog = page.getByRole("dialog", { name: "Marcar como perdida" });
    await lostDialog.getByLabel("Motivo de la pérdida").selectOption("Eligió a la competencia");
    await lostDialog.getByRole("button", { name: "Marcar perdida" }).click();
    await expect(lostDialog).toBeHidden();

    await expect(
      page.getByText("Oportunidad perdida · Motivo: Eligió a la competencia"),
    ).toBeVisible();
  });

  // AIT-86: cerrar deja de ser irreversible. La prueba va sobre el camino
  // completo — cerrar y deshacer — porque reabrir solo significa algo si el
  // cierre de verdad ocurrió antes.
  test("reabrir una oportunidad perdida la devuelve al pipeline con próximo paso", async ({
    page,
  }) => {
    await loginAs(page, "sales");
    const customerName = uniqueCustomerName("E2E Reabrir");
    await createOpportunityViaAltaRapida(page, {
      name: customerName,
      phone: uniquePhone(),
    });

    // Se anota la etapa ANTES de cerrar: reabrir es deshacer, así que tiene
    // que volver a ésta y no a "Contacto" por defecto. Con una recién creada
    // las dos coinciden, así que se mueve a Presupuesto primero — si no, la
    // prueba pasaría igual con el comportamiento equivocado.
    await page.getByRole("button", { name: "Cambiar etapa" }).click();
    const stageDialog = page.getByRole("dialog", { name: "Cambiar etapa" });
    await stageDialog.getByLabel("Etapa").selectOption("presupuesto");
    await stageDialog.getByRole("button", { name: "Guardar etapa" }).click();
    await expect(stageDialog).toBeHidden();

    await page.getByRole("button", { name: "Perdida" }).click();
    const lostDialog = page.getByRole("dialog", { name: "Marcar como perdida" });
    await lostDialog
      .getByLabel("Motivo de la pérdida")
      .selectOption("Eligió a la competencia");
    await lostDialog.getByRole("button", { name: "Marcar perdida" }).click();
    await expect(lostDialog).toBeHidden();
    await expect(page.getByText(/Oportunidad perdida/)).toBeVisible();

    await page.getByRole("button", { name: "Reabrir oportunidad" }).click();

    // Vuelve a estar abierta: desaparece la franja de cierre y con ella el
    // motivo de la pérdida, y reaparecen las acciones de una oportunidad viva.
    await expect(page.getByText(/Oportunidad perdida/)).toHaveCount(0);
    await expect(page.getByText("Eligió a la competencia")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Cambiar etapa" })).toBeVisible();

    // Nunca vuelve al pipeline sin seguimiento (criterio de la issue).
    await expect(page.getByText("Retomar el seguimiento")).toBeVisible();

    // Y vuelve a la etapa que tenía al cerrarse, no a la inicial.
    // Se mira el BADGE de etapa, no el texto suelto: "Presupuesto" también es
    // el encabezado de la sección de presupuesto de esta misma pantalla, así
    // que un getByText genérico pasaría igual con la etapa equivocada — la
    // prueba no discriminaría.
    const stageBadge = page.locator("span.rounded-pill");
    await expect(stageBadge.filter({ hasText: /^Presupuesto$/ })).toBeVisible();
    // Y la negativa, que es la que de verdad detecta el fallo: si reabrir
    // devolviera la oportunidad a la etapa inicial, aquí habría un "Contacto".
    await expect(stageBadge.filter({ hasText: /^Contacto$/ })).toHaveCount(0);
  });
});

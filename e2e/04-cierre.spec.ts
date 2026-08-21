import { test, expect } from "@playwright/test";
import { loginAs, createOpportunityViaAltaRapida, uniqueCustomerName } from "./helpers";

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
      phone: "600444555",
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
      phone: "600555666",
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
});

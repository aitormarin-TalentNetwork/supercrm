import { test, expect } from "@playwright/test";
import { loginAs, createOpportunityViaAltaRapida, uniqueCustomerName } from "./helpers";

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
    phone: "600111222",
  });

  // Aterriza en el Detalle de la oportunidad recién creada.
  await expect(page.getByRole("heading", { name: customerName })).toBeVisible();

  // Próximo paso generado automáticamente (AIT-15): la sección muestra el
  // badge "Pendiente" (dueDate = ahora, no puede estar vencido) en vez del
  // estado vacío "Sin próximo paso — la oportunidad está cerrada.".
  await expect(page.getByText("Próximo paso")).toBeVisible();
  await expect(page.getByText("Pendiente")).toBeVisible();
});

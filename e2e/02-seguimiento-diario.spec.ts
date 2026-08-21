import { test, expect } from "@playwright/test";
import { loginAs, createOpportunityViaAltaRapida, uniqueCustomerName, getNextStepCard } from "./helpers";

// PRD §7, Proceso 2 — Seguimiento diario (Carlos):
// "Hoy" muestra los pasos del día → toca un seguimiento → "Detalle de
// oportunidad" → "Registrar interacción" → al guardar, el sistema crea el
// siguiente paso y vuelve a "Hoy" con el paso ya actualizado.
test("registrar interacción desde Hoy actualiza el próximo paso y vuelve a Hoy", async ({
  page,
}) => {
  await loginAs(page, "sales");

  const customerName = uniqueCustomerName("E2E Seguimiento");
  await createOpportunityViaAltaRapida(page, {
    name: customerName,
    phone: "600222333",
  });

  // Vuelve a Hoy — la oportunidad recién creada tiene su próximo paso
  // vencido "ahora" (createQuick fija dueDate = now), así que aparece en
  // la lista de hoy.
  await page.goto("/hoy");
  const card = getNextStepCard(page, customerName);
  await expect(card).toBeVisible();

  const originalAction = await card.locator("p.text-text-secondary").first().innerText();

  await card.getByRole("button", { name: "Registrar" }).click();
  const dialog = page.getByRole("dialog", { name: "Registrar interacción" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("tab", { name: "Llamada" }).click();
  await dialog.getByLabel("Nota / resultado").fill("Cliente interesado, seguimos.");
  // El modal sugiere el próximo paso a 3 días vista por defecto
  // (todayPlusDaysAsDate(3) en RegistrarInteraccionModal) — lo dejamos para
  // hoy para poder comprobar que la tarjeta sigue en "Hoy" con la acción
  // actualizada, en vez de comprobar que desaparece (también correcto, pero
  // menos directo para este test).
  // exact:true — el modal también tiene un campo "Fecha y hora" (occurredAt)
  // cuya etiqueta contendría "Fecha" como substring.
  const today = new Date().toISOString().slice(0, 10);
  await dialog.getByLabel("Fecha", { exact: true }).fill(today);
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog).toBeHidden();

  // Sigue en Hoy, y el próximo paso de esa tarjeta ha cambiado (dejó de ser
  // el genérico de Alta rápida — la interacción sugiere uno propio del tipo
  // "Llamada": "Llamar de seguimiento").
  await expect(page).toHaveURL(/\/hoy$/);
  const updatedCard = getNextStepCard(page, customerName);
  await expect(updatedCard).toBeVisible();
  const updatedAction = await updatedCard.locator("p.text-text-secondary").first().innerText();
  expect(updatedAction).not.toBe(originalAction);
  expect(updatedAction).toContain("Llamar de seguimiento");
});

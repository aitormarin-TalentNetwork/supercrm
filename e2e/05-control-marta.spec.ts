import { test, expect } from "@playwright/test";
import { loginAs, createOpportunityViaAltaRapida, uniqueCustomerName } from "./helpers";

// PRD §7, Proceso 5 — Control de Marta:
// desde "Panel" ve el estado del negocio (KPIs, oportunidades en riesgo);
// desde "Supervisión" ve la actividad por comercial y llega al Detalle de
// cualquiera de sus oportunidades abiertas.
test("Marta filtra Supervisión por comercial y llega al Detalle de una oportunidad de Carlos", async ({
  browser,
}) => {
  // --- Carlos: deja una oportunidad abierta que Marta pueda supervisar ---
  const salesContext = await browser.newContext();
  const salesPage = await salesContext.newPage();
  await loginAs(salesPage, "sales");
  const customerName = uniqueCustomerName("E2E Supervisión");
  await createOpportunityViaAltaRapida(salesPage, {
    name: customerName,
    phone: "600666777",
  });
  await salesContext.close();

  // --- Marta: Panel → Supervisión → filtra por Carlos → abre el Detalle ---
  const ownerContext = await browser.newContext();
  const page = await ownerContext.newPage();
  await loginAs(page, "owner");

  await expect(page.getByRole("heading", { name: "Panel" })).toBeVisible();
  // getByRole("heading", ...) en vez de getByText: "Oportunidades en riesgo"
  // aparece dos veces en la página (el <h2> de la sección y una etiqueta de
  // KPI), y getByText resuelve ambigua.
  await expect(
    page.getByRole("heading", { name: "Oportunidades en riesgo" }),
  ).toBeVisible();

  await page.goto("/supervision");
  await expect(page.getByRole("heading", { name: "Supervisión" })).toBeVisible();

  await expect(page.getByRole("link", { name: customerName })).toBeVisible();

  // Filtra por comercial (comparativa por comercial) — el listado de
  // oportunidades pasa a mostrar solo las suyas. Nota: "Carlos Vega" es solo
  // la etiqueta amigable del autorrelleno de /login — el nombre real del
  // usuario (users.name, el que muestra Supervisión) es "Carlos".
  await page.getByRole("button", { name: /Carlos/ }).click();
  await expect(
    page.getByRole("heading", { name: "Oportunidades · Carlos" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: customerName })).toBeVisible();

  await page.getByRole("link", { name: customerName }).click();
  await expect(page.getByRole("heading", { name: customerName })).toBeVisible();

  await ownerContext.close();
});

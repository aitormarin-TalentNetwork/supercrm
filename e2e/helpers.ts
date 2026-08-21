import { Page, Locator, expect } from "@playwright/test";

/** Nombre visible en el botón de autorrelleno de /login (componente
 * DEMO_ACCOUNTS en app/login/page.tsx) para cada rol. */
const DEMO_ACCOUNT_LABEL = {
  owner: "Marta Ledo",
  sales: "Carlos Vega",
} as const;

/** URL a la que redirige app/page.tsx tras el login, según rol. */
const HOME_BY_ROLE = {
  owner: "/panel",
  sales: "/hoy",
} as const;

/** Login vía el autorrelleno de cuentas de prueba de /login (no hardcodea
 * contraseñas en el test: usa el mismo botón "Usar" que expone la propia
 * UI). Deja al usuario en su pantalla de arranque por rol. */
export async function loginAs(page: Page, role: "owner" | "sales") {
  await page.goto("/login");
  await page
    .getByRole("button", { name: DEMO_ACCOUNT_LABEL[role], exact: false })
    .click();
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(`**${HOME_BY_ROLE[role]}`);
}

/** Nombre de cliente único por ejecución, para no colisionar entre corridas
 * de la suite ni depender de datos previos del deployment. */
export function uniqueCustomerName(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

/** Alta rápida (AIT-10): abre el modal desde el botón flotante "+" de Hoy,
 * rellena lo mínimo y crea. Devuelve el id de la oportunidad creada
 * (capturado de la URL a la que redirige tras crear). Asume que la página
 * actual ya expone el botón flotante "Alta rápida" (Hoy) — llamar tras
 * loginAs(page, "sales") y estar en /hoy. */
export async function createOpportunityViaAltaRapida(
  page: Page,
  { name, phone }: { name: string; phone: string },
): Promise<string> {
  await page.getByRole("button", { name: "Alta rápida" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nombre del cliente").fill(name);
  await dialog.getByLabel("Teléfono").fill(phone);
  await dialog.getByRole("button", { name: "Crear oportunidad" }).click();
  await page.waitForURL(/\/oportunidades\/.+/);
  await expect(dialog).toBeHidden();
  const url = page.url();
  const match = url.match(/\/oportunidades\/([^/?]+)/);
  if (!match) throw new Error(`No se pudo extraer el id de oportunidad de ${url}`);
  return match[1];
}

/** Localiza la tarjeta de un seguimiento en /hoy por el nombre de cliente
 * (NextStepCard en app/hoy/page.tsx). Escopado a las clases propias de la
 * tarjeta (no un <div> genérico) para no capturar contenedores ancestros. */
export function getNextStepCard(page: Page, customerName: string): Locator {
  return page.locator("div.rounded-lg.border.bg-surface.p-4", {
    has: page.getByRole("link", { name: `Ver oportunidad de ${customerName}` }),
  });
}

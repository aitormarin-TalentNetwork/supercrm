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

/** Teléfono único por ejecución, por el mismo motivo que uniqueCustomerName:
 * la suite NO resetea la base y los datos persisten entre corridas. Con la
 * detección de duplicados de AIT-80, un teléfono cableado haría que la
 * segunda corrida recibiera el aviso en vez de crear el cliente, el alta no
 * redirigiría y `createOpportunityViaAltaRapida` moriría en su waitForURL.
 * El nombre ya recibía este trato; al teléfono le faltaba.
 *
 * Timestamp Y aleatoriedad: `playwright.config.ts` fija `workers: 1` y
 * `fullyParallel: false`, así que dos specs no colisionan entre sí — pero dos
 * EJECUCIONES de la suite a la vez contra el deployment compartido sí, y ésas
 * el timestamp solo no las distingue. Nueve dígitos empezando por 6, para
 * pasar la validación de 9-15 dígitos. */
export function uniquePhone(): string {
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `6${`${Date.now()}`.slice(-5)}${random}`;
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
  // AIT-78: por `data-testid` y no por nombre accesible. Desde AIT-78 hay más
  // de un botón "Alta rápida" en Hoy —dos con lista, tres en estado vacío—, así
  // que `getByRole("button", { name: "Alta rápida" })` resolvería a varios y
  // fallaría por modo estricto. Esto ancla al flotante, que es el que el
  // comentario de arriba ya decía que se acciona.
  await page.getByTestId("alta-rapida-fab").click();
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

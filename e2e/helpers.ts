import { Page, Locator, expect } from "@playwright/test";
import { BASE_ORIGIN, HOME_BY_ROLE, readState, type Role } from "./authState";

/** AIT-108 — Siembra la sesión desde la instantánea que escribió
 * `e2e/global-setup.ts` y deja al usuario en su pantalla de arranque por rol.
 *
 * MISMA FIRMA Y MISMA POSTCONDICIÓN que la versión que hacía el login por la
 * UI: los 29 puntos de llamada no cambian. Lo que cambia es que la suite
 * entera hace 2 logins en vez de 29, y ese número ya no crece al añadir specs.
 *
 * SE SIEMBRA EL CONTEXTO, NO EL NAVEGADOR. Cada test recibe un contexto nuevo,
 * y los dos specs que abren dos sesiones a la vez (03 y 05) le dan una a cada
 * rol: `ownerContext` y `salesContext` son contextos distintos, así que sembrar
 * uno no pisa el otro.
 *
 * LO QUE SE COMPARTE ES UNA INSTANTÁNEA, NO UNA SESIÓN VIVA: se escribe una vez
 * en el global setup y a partir de ahí solo se lee.
 *
 * ⚠️ ALCANCE DE ESA AFIRMACIÓN, y conviene leerla entera: la instantánea puede
 * quedarse obsoleta por tres vías —que alguien la MUTE, que un contexto herede
 * el de otro, o que un test provoque un REFRESCO y Convex Auth rote el refresh
 * token—, y esas son las tres vías **alcanzables por los consumidores de hoy**,
 * no una enumeración universal. Convex Auth permite además invalidarla con
 * `signOut` o desactivando el usuario; ningún spec de hoy hace ninguna de las
 * dos. Si mañana alguien añade un test que cierre sesión, esta enumeración deja
 * de ser cierta sin que nada avise — por eso queda escrita como lo que es. */
export async function loginAs(page: Page, role: Role) {
  const estado = readState(role);
  const contexto = page.context();

  await contexto.addCookies(estado.cookies);

  const origen = estado.origins.find((o) => o.origin === BASE_ORIGIN);
  if (!origen) {
    throw new Error(
      `[e2e] la instantánea de "${role}" no tiene localStorage para ${BASE_ORIGIN}. ` +
        `Orígenes: ${estado.origins.map((o) => o.origin).join(", ") || "(ninguno)"}.`,
    );
  }
  // `addInitScript` corre ANTES del JS de la página en cada navegación, que es
  // el único momento en que sirve: Convex Auth lee su sesión de localStorage al
  // arrancar, así que escribirla después de cargar llega tarde.
  await contexto.addInitScript((entradas: Array<{ name: string; value: string }>) => {
    for (const { name, value } of entradas) window.localStorage.setItem(name, value);
  }, origen.localStorage);

  await page.goto(HOME_BY_ROLE[role]);

  // `proxy.ts` decide con la COOKIE, en el servidor: si la instantánea no
  // autentica, esto ya ha rebotado a /login. Sin este corte, el fallo saldría
  // treinta segundos después como un `waitForURL` agotado que no dice por qué.
  if (new URL(page.url()).pathname.startsWith("/login")) {
    throw new Error(
      `[e2e] la instantánea de "${role}" no autentica: ${HOME_BY_ROLE[role]} rebotó a /login. ` +
        `Si el deployment cambió de credenciales, borra e2e/.auth/ y vuelve a correr.`,
    );
  }

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

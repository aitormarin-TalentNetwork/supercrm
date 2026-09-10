import { Page, Locator, expect } from "@playwright/test";
import {
  capturarEstadoRodado,
  COOKIE_JWT,
  COOKIE_REFRESH,
  HOME_BY_ROLE,
  readState,
  refreshTokenOf,
  type Role,
  writeStateAtomically,
} from "./authState";

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
 * ⚠️ LA TERCERA VÍA NO ERA HIPOTÉTICA. De las tres por las que la instantánea
 * puede quedarse obsoleta —que alguien la MUTE, que un contexto herede el de
 * otro, o que un test provoque un REFRESCO y Convex Auth ROTE el token—, la
 * tercera ocurre SIEMPRE, en cada test, y es lo que obliga a que la instantánea
 * ruede. Y siguen siendo las tres vías **alcanzables por los consumidores de
 * hoy**, no una enumeración universal: Convex Auth permite además invalidarla
 * con `signOut` o desactivando el usuario, y ningún spec de hoy hace ninguna de
 * las dos. Si mañana alguien añade un test que cierre sesión, esta enumeración
 * deja de ser cierta sin que nada avise — por eso queda escrita como lo que es.
 *
 * ⚠️ ESTO EXIGE `workers: 1` Y `fullyParallel: false` (playwright.config.ts).
 * Ya estaban por otra razón —los tests escriben datos reales en el mismo
 * deployment—, pero desde AIT-108 no son una elección: son un REQUISITO DE
 * CORRECCIÓN. Con tests en paralelo, dos contextos consumirían el mismo refresh
 * token, el segundo lo reusaría fuera de la ventana de 10 s y la sesión moriría
 * para todos. Si algún día se paraleliza la suite, hay que dar una sesión por
 * worker ANTES de subir `workers`. */
export async function loginAs(page: Page, role: Role) {
  const estado = readState(role);
  const contexto = page.context();

  // Solo cookies, y basta: el servidor lee la COOKIE JWT y le entrega ese token
  // al cliente, que lo escribe en localStorage al hidratarse. Sembrarlo a mano
  // con `addInitScript` además lo reescribiría en CADA navegación del test,
  // pisando lo que el cliente hubiera actualizado.
  //
  // 🔴 CORREGIDO 2026-09-10 (AIT-127). Aquí decía que "el localStorage guarda un
  // marcador («dummy») y una marca de tiempo, no la sesión". ES FALSO: el
  // "dummy" es solo el REFRESH token; el JWT que se guarda al lado es REAL
  // (`@convex-dev/auth/dist/react/client.js:46`). Era una copia casi literal de
  // la misma frase que había en `e2e/authState.ts`, y esa frase se citó esta
  // noche como prueba para DESCARTAR mirar el localStorage — o sea que apagaba
  // activamente la comprobación de quien investigaba justo esta zona.
  // Se corrige aquí y no solo donde se descubrió: una afirmación falsa
  // duplicada NO aparece en ningún diff, porque nadie toca la segunda copia.
  // El detalle completo y cómo verificar la suficiencia, en `authState.ts`.
  await contexto.addCookies(estado.cookies);

  await page.goto(HOME_BY_ROLE[role]);

  // Dos cortes, y hacen falta los dos porque miran cosas distintas.
  //
  // (1) LA URL. `proxy.ts` decide con la COOKIE en el servidor: si la
  //     instantánea no autentica, esto ya ha rebotado a /login.
  if (new URL(page.url()).pathname.startsWith("/login")) {
    throw new Error(
      `[e2e] la instantánea de "${role}" no autentica: ${HOME_BY_ROLE[role]} rebotó a /login. ` +
        `Bórrala (\`rm e2e/.auth/${role}.json\`) y lanza la SUITE ENTERA; no relances un ` +
        `test suelto, que regenera el fichero y esconde el problema.`,
    );
  }

  // (2) *** AIT-119 · LA SESIÓN, que es lo que el corte anterior NO ve. ***
  //     Si el servidor descarta un refresco, `setAuthCookies(response, null)`
  //     BORRA las dos cookies —y hace bien—, pero la navegación ya había
  //     servido la página: la URL se queda en /hoy con la sesión muerta.
  //     Medido: `sana 2 cookies → tras el refresco fallido: 0 · url /hoy`.
  //     El corte (1) mira la URL y el daño está en las cookies, así que lo
  //     dejaba pasar y el fallo aparecía 30 s más tarde hablando de un botón.
  const vivas = (await contexto.cookies()).map((c) => c.name);
  const perdidas = [COOKIE_JWT, COOKIE_REFRESH].filter((n) => !vivas.includes(n));
  if (perdidas.length > 0) {
    throw new Error(
      `[e2e] la sesión de "${role}" se perdió durante la navegación a ${HOME_BY_ROLE[role]}: ` +
        `ya no está ${perdidas.join(" ni ")}. El servidor limpia las cookies cuando un ` +
        `refresco falla. Bórrala (\`rm e2e/.auth/${role}.json\`) y lanza la SUITE ENTERA; ` +
        `no relances un test suelto, que regenera el fichero y esconde el problema.`,
    );
  }

  await page.waitForURL(`**${HOME_BY_ROLE[role]}`);

  // LA INSTANTÁNEA RUEDA (ver `capturarEstadoRodado` en authState.ts): este
  // test acaba de consumir el refresh token y el servidor ya emitió el
  // siguiente. Se guarda para que el test que venga consuma el vigente en vez
  // de reusar uno muerto — que pasados 10 s no da un error de sesión, sino que
  // INVALIDA LA SESIÓN ENTERA. Sin esta línea la suite pasa 3 tests y luego
  // cae en bloque; medido: 22 rojos de 54.
  writeStateAtomically(
    role,
    await capturarEstadoRodado(contexto, refreshTokenOf(estado)),
  );
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

import fs from "node:fs";
import path from "node:path";
import type { BrowserContext } from "@playwright/test";

// AIT-108 · EL CONTRATO DE LA INSTANTÁNEA DE SESIÓN
// ============================================================================
// Antes, cada spec hacía su propio `loginAs` y la suite gastaba 29 logins. Con
// las credenciales del deployment en mal estado (AIT-102), esos 29 logins son
// 29 FALLOS: la suite convierte un problema de credenciales en una cascada de
// rojos que parecen regresiones. Con una instantánea, ese mismo escenario
// produce UN fallo. El problema sigue existiendo; deja de amplificarse.
//
// Este fichero existe para que la definición viva en UN sitio. Lo importan el
// `global-setup.ts` (que escribe) y `helpers.ts` (que lee): dos copias que hoy
// coinciden y mañana divergen no fallan — siembran cosas distintas y cada mitad
// mide otra app, que es la forma de AIT-96 entrando por la puerta de atrás.

export type Role = "owner" | "sales";

/** Nombre visible en el botón de autorrelleno de /login (DEMO_ACCOUNTS en
 *  app/login/page.tsx). Se entra por la UI, igual que antes: la suite nunca
 *  cablea contraseñas. */
export const DEMO_ACCOUNT_LABEL: Record<Role, string> = {
  owner: "Marta Ledo",
  sales: "Carlos Vega",
};

/** URL a la que redirige app/page.tsx tras el login, según rol. Es la
 *  POSTCONDICIÓN de `loginAs`, y no cambia con AIT-108: los 29 puntos de
 *  llamada siguen recibiendo lo mismo. */
export const HOME_BY_ROLE: Record<Role, string> = {
  owner: "/panel",
  sales: "/hoy",
};

export const ROLES: Role[] = ["owner", "sales"];

// AIT-109 · `BASE_ORIGIN` VIVÍA AQUÍ Y SE MUDÓ A `global-setup.ts`.
// No lo devuelvas: era el ÚNICO motivo por el que este fichero importaba
// `playwright.config`, y ese import es eager — cargar el módulo resuelve el
// puerto en su ámbito y ABORTA si `E2E_PORT` no vale. Como
// `00-instantanea-sesion.spec.ts` importa este fichero, la suite pura entera
// moría por una constante que ninguna prueba pura usa: `E2E_PORT=abc` daba
// `Total: 0 tests in 0 files`. La dependencia era TRANSITIVA, así que no se
// veía mirando `playwright.unit.config.ts`, que es donde uno la busca.
// Sigue derivándose del punto único de AIT-96; lo que cambia es DÓNDE, no de
// dónde sale. Su único consumidor era, y sigue siendo, `global-setup.ts`.

/** Ruta determinista por worktree: `e2e/` cuelga del árbol de trabajo, así que
 *  T1, T2 y T3 tienen la suya sin acordar nada. Ignorada por git: el fichero
 *  lleva tokens de sesión REALES. */
const AUTH_DIR = path.join(__dirname, ".auth");

/** El directorio es INYECTABLE, con el real por defecto. No es una comodidad:
 *  mientras la ruta viva dentro de estas funciones, **una prueba que quiera
 *  ejercitarlas no tiene más remedio que escribir en la instantánea de verdad**
 *  — y acabaría produciendo el envenenamiento que AIT-119 viene a impedir, con
 *  el `00-` de su fichero poniéndola por delante de los flujos.
 *  No se le pide a las pruebas que se porten bien: se les quita la posibilidad
 *  de portarse mal. */
export function statePath(role: Role, dir: string = AUTH_DIR): string {
  return path.join(dir, `${role}.json`);
}

/** Lo que Playwright guarda en un `storageState`. Se declara en vez de
 *  importarse como `any` para que un cambio de forma rompa la compilación en
 *  vez de sembrar `undefined` en silencio. */
export type StorageState = {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "Strict" | "Lax" | "None";
  }>;
  origins: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
};

/** Escritura ATÓMICA: temporal en el MISMO directorio (el rename solo es
 *  atómico dentro del mismo sistema de ficheros) y después `rename`. Un lector
 *  ve el fichero entero o no lo ve; nunca un JSON a medias. Modo 0600 porque
 *  dentro hay tokens de sesión válidos. */
/**
 * *** AIT-119 · LA ÚNICA DEFINICIÓN DE "INSTANTÁNEA VÁLIDA". ***
 *
 * Válida = las dos cookies de auth PRESENTES y CON VALOR NO VACÍO.
 *
 * Lo de "no vacío" no es celo: `refreshTokenOf` devuelve `""` tanto si la cookie
 * falta como si está ahí sin valor. Si el que escribe y el que lee
 * interpretaran eso distinto, un fichero con dos cookies vacías pasaría la
 * validación y no autenticaría nada — el mismo defecto una capa más abajo.
 * Por eso hay UNA función y la usan los dos.
 *
 * Devuelve QUÉ ENCONTRÓ, no un booleano: sin eso, el fallo dice "algo va mal" y
 * cuesta cuatro hipótesis en vez de un minuto (fue exactamente lo que pasó).
 *
 * @returns null si es válida; si no, la frase que explica el hallazgo.
 */
export function problemaDeInstantanea(
  state: StorageState | null | undefined,
  role: Role,
): string | null {
  if (!state || !Array.isArray(state.cookies)) {
    return `la instantánea de "${role}" no tiene forma de instantánea (sin \`cookies\`).`;
  }
  const faltan: string[] = [];
  const vacias: string[] = [];
  for (const nombre of [COOKIE_JWT, COOKIE_REFRESH]) {
    const cookie = state.cookies.find((c) => c.name === nombre);
    if (cookie === undefined) faltan.push(nombre);
    else if (cookie.value === "") vacias.push(nombre);
  }
  if (faltan.length === 0 && vacias.length === 0) return null;

  const presentes = state.cookies.map((c) => c.name).join(", ") || "ninguna";
  return (
    `la instantánea de sesión de "${role}" no sirve: ` +
    (faltan.length > 0 ? `falta ${faltan.join(" y ")}. ` : "") +
    (vacias.length > 0 ? `sin valor ${vacias.join(" y ")}. ` : "") +
    `Tiene ${state.cookies.length} cookie(s): [${presentes}].`
  );
}

/** Qué hacer, y lo que NO hay que hacer. Va en los dos mensajes.
 *
 *  NO dice "vuelve a correr": correr UN test suelto REGENERA el fichero y lo
 *  deja sano, así que quien lo intente verá verde y creerá que no había nada.
 *  El gesto de comprobar borra la evidencia. */
const QUE_HACER =
  "Bórrala (`rm e2e/.auth/<rol>.json`) y lanza la SUITE ENTERA. " +
  "No relances un test suelto: eso regenera el fichero y esconde el problema.";

/** Escritura ATÓMICA y VALIDADA.
 *
 *  La validación vive AQUÍ y no en los llamadores a propósito. Antes estaba en
 *  `global-setup.ts` —que escribe 2 veces por corrida— y no en `helpers.ts`
 *  —que escribe 29—, y ese hueco es AIT-119 entero. Con la comprobación dentro
 *  del escritor **no existe ningún camino que escriba sin validar**, y deja de
 *  depender de que el tercer llamador se acuerde.
 *
 *  Y valida ANTES de crear el temporal: un fichero inválido no llega a existir,
 *  y la instantánea buena que hubiera queda intacta byte a byte. */
export function writeStateAtomically(
  role: Role,
  state: StorageState,
  dir: string = AUTH_DIR,
): void {
  const problema = problemaDeInstantanea(state, role);
  if (problema !== null) {
    throw new Error(`[e2e] NO se guarda una instantánea inválida — ${problema} ${QUE_HACER}`);
  }
  fs.mkdirSync(dir, { recursive: true });
  const destino = statePath(role, dir);
  const temporal = `${destino}.${process.pid}.tmp`;
  fs.writeFileSync(temporal, JSON.stringify(state, null, 2), { mode: 0o600 });
  fs.renameSync(temporal, destino);
}

/** Las dos cookies en las que vive la sesión: una lleva el JWT y otra el
 *  refresh token. En este modo (Convex Auth con Next.js) son httpOnly y las
 *  gestiona el servidor, y el refresh REAL existe únicamente aquí — lo dice el
 *  propio paquete: "The server doesn't share the refresh token with the client".
 *
 *  ⚠️ AFIRMACIÓN HEREDADA Y NO RE-VERIFICADA EN ESTE CAMBIO (2026-09-10): que
 *  "sembrar SOLO las cookies autentica igual que sembrar cookies +
 *  localStorage". Venía marcada como "Medido:" y **no consta quién la midió,
 *  cuándo, ni contra qué versión del paquete**. No se borra porque
 *  probablemente sea cierta —el servidor puede rehidratar el JWT desde la
 *  cookie de refresh— y porque el arnés depende de ella. Pero se marca, porque
 *  decía LO MISMO que la frase falsa de abajo con otra redacción, y la razón
 *  por la que se creía puede ser la que acabamos de tumbar.
 *  Para comprobarla hace falta el turno de Convex y una corrida sembrando solo
 *  cookies, con control positivo (sin sembrar nada NO debe autenticar).
 *
 *  ⚠️ CORREGIDO 2026-09-10 (AIT-127). Hasta hoy esta nota decía que "el
 *  localStorage solo guarda un marcador («dummy»)". ESO ERA FALSO, y no a
 *  medias: el marcador es solo el REFRESH token
 *  (`@convex-dev/auth/dist/nextjs/server/index.js:161` →
 *  `_state: { token, refreshToken: "dummy" }`), pero el JWT que se guarda al
 *  lado es REAL — `dist/react/client.js:46` hace
 *  `storageSet(JWT_STORAGE_KEY, value)` con el token de verdad.
 *
 *  Se deja escrito que cambió, y no solo lo que dice ahora, porque esta nota
 *  estuvo dirigiendo lecturas: se citó como prueba de que la sesión vivía solo
 *  en cookies, y con eso se descartó mirar el localStorage.
 *
 *  🔴 Y LO QUE HAY QUE SABER ANTES DE COMPROBAR NADA AQUÍ: una cookie httpOnly
 *  es INVISIBLE para `document.cookie`. Una sonda desde la página devuelve "no
 *  hay cookie" esté la cookie o no esté — es un cero que no discrimina. Las
 *  cookies se comprueban desde el servidor o desde el protocolo, y con control
 *  positivo: con sesión abierta, la sonda TIENE que mostrarlas. */
export const COOKIE_JWT = "__convexAuthJWT";
export const COOKIE_REFRESH = "__convexAuthRefreshToken";

export function refreshTokenOf(state: StorageState): string {
  return state.cookies.find((c) => c.name === COOKIE_REFRESH)?.value ?? "";
}

/** *** EL NÚCLEO DE AIT-108, Y LA PARTE QUE NO ERA OBVIA ***
 *
 *  Convex Auth ROTA el refresh token: cada uso consume el actual y emite otro.
 *  Un token consumido se puede reusar durante una ventana de 10 segundos
 *  (`REFRESH_TOKEN_REUSE_WINDOW_MS` en
 *  @convex-dev/auth/dist/server/implementation/refreshTokens.js) y, pasada esa
 *  ventana, reusarlo INVALIDA EL SUBÁRBOL ENTERO de la sesión
 *  (`invalidateRefreshTokensInSubtree`). No es una caducidad: es detección de
 *  robo, y la víctima es la sesión completa.
 *
 *  Por eso una instantánea FIJA no vale: los tests van a unos 6 s uno de otro,
 *  así que el primero rota, el segundo cae dentro de la ventana y el TERCERO la
 *  mata. Medido exactamente así antes de escribir esto: pasan 2 contextos y
 *  muere el 3.º — que es el mismo sitio donde se rompía la suite completa.
 *
 *  La instantánea RUEDA: cada uso guarda el token que acaba de emitirse, de
 *  modo que el siguiente test consume el vigente y no reusa nada. Es lo que
 *  hace un navegador normal; lo raro era pretender que un token fuese eterno.
 *
 *  La rotación tarda ~850 ms tras la primera navegación (medido, 6 de 6). Se
 *  ESPERA a que ocurra en vez de suponer un tiempo: si no ocurre dentro del
 *  presupuesto, es que el token no se consumió, y entonces guardar el estado
 *  actual es exactamente lo correcto. Por eso esto no falla, converge.
 *
 *  Depende de `workers: 1` y `fullyParallel: false` (playwright.config.ts): con
 *  tests en paralelo, dos contextos consumirían el mismo token y volveríamos al
 *  problema de arriba.
 *
 *  ⚠️ LÍMITE CONOCIDO, Y ES UN FALLO SILENCIOSO. Al agotarse el presupuesto esto
 *  devuelve el estado que haya, AUNQUE EL TOKEN NO HAYA CAMBIADO, y no
 *  distingue dos situaciones que se parecen y no lo son:
 *      · "no hubo consumo"  → guardar el token actual es lo correcto;
 *      · "se esperaba la rotación y no llegó a tiempo" → se guarda un token YA
 *        CONSUMIDO, y el siguiente test lo reusará fuera de la ventana de 10 s,
 *        matando la sesión para toda la corrida.
 *  Hoy no pasa: la rotación tarda ~850 ms contra un presupuesto de 10 s, y dos
 *  suites completas seguidas dieron el mismo número exacto de rotaciones. Pero
 *  si algún día la latencia se va, esto se rompe SIN DECIRLO — que es
 *  exactamente el defecto que esta tarea vino a arreglar, un nivel más abajo.
 *  Para cerrarlo haría falta saber si el token se consumió, no solo si cambió.
 *  Señalado por la auditoría de AIT-108 (S2, no bloqueante). */
export async function capturarEstadoRodado(
  context: BrowserContext,
  tokenPrevio: string,
  presupuestoMs = 10_000,
): Promise<StorageState> {
  const hasta = Date.now() + presupuestoMs;
  let estado = (await context.storageState()) as StorageState;
  while (refreshTokenOf(estado) === tokenPrevio && Date.now() < hasta) {
    await new Promise((r) => setTimeout(r, 200));
    estado = (await context.storageState()) as StorageState;
  }
  return estado;
}

export function readState(role: Role, dir: string = AUTH_DIR): StorageState {
  const ruta = statePath(role, dir);
  if (!fs.existsSync(ruta)) {
    // Fallar en voz alta y nombrando la causa, no devolver un estado vacío que
    // acabaría en un `waitForURL` agotándose a los 30 s sin decir por qué.
    throw new Error(
      `[e2e] no existe la instantánea de sesión de "${role}" (${ruta}). ` +
        `La escribe e2e/global-setup.ts, registrado en playwright.config.ts. ` +
        `Si corres con una config propia, regístralo también allí.`,
    );
  }
  const estado = JSON.parse(fs.readFileSync(ruta, "utf8")) as StorageState;
  // Se valida el CONTENIDO, no solo que el fichero exista. `existsSync` protege
  // de que falte; no de que esté vacío — y el fichero envenenado EXISTE.
  //
  // ⚠️ QUÉ CUBRE ESTO DE VERDAD, medido y no supuesto: `globalSetup` reescribe
  // las dos instantáneas al arrancar, así que **una rota de ayer NO llega viva
  // a los tests de hoy** — se cura sola antes de que nadie la lea. Lo que esta
  // comprobación cubre es el resto: una instantánea rota DENTRO de la corrida
  // en curso, una editada a mano, o un `globalSetup` que no llegara a escribir.
  // Es defensa en profundidad; la que impide el daño es la validación al
  // ESCRIBIR.
  const problema = problemaDeInstantanea(estado, role);
  if (problema !== null) {
    // El mensaje dice QUÉ se ha encontrado y DÓNDE, y nada más. Nada de
    // atribuir causa: aquí no se sabe quién dejó el fichero así, y una causa
    // plausible puesta en un error se lee como diagnóstico. Si dijera de quién
    // NO es la culpa, una regresión real de autenticación se archivaría como
    // problema del arnés —que es exactamente hacia el verde—.
    throw new Error(
      `[e2e] ${problema} Fichero: ${ruta}. Si quieres conservarla para ` +
        `mirarla, cópiala a un sitio fuera del repo antes de tocar nada. ` +
        `${QUE_HACER}`,
    );
  }
  return estado;
}

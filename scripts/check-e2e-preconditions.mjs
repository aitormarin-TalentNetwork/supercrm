// AIT-103 — que el rojo del limitador de login sepa decir su nombre.
//
// Cuando una cuenta agota el cupo de intentos de Convex Auth, todos los tests
// que entran con ella fallan con `TooManyFailedAttempts`. Eso PARECE una
// regresión del producto y no lo es. Nada en la salida de Playwright lo dice: el
// Integrador lo cazó porque contó los fallos y reconoció el nombre del error, y
// sin ese reconocimiento lo razonable era abrir una investigación que no lleva a
// ninguna parte.
//
// Esta comprobación corre ANTES del runner (`package.json` -> `test:e2e`), así
// que todo lo que detecta es "el bloqueo YA EXISTÍA". Cruzar el umbral con la
// suite en marcha es el otro caso, y es AIT-110 — no se cubre aquí, y el mensaje
// lo dice para que nadie espere una hora por el motivo equivocado.
//
// NO gasta cupo: leer el estado es una consulta. `isSignInRateLimited` tampoco
// escribe. Si la comprobación consumiera intentos, la comprobación sería el
// problema.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";
import path from "node:path";

const execFileAsync = promisify(execFile);

// Réplica de `DEFAULT_MAX_SIGN_IN_ATTEMPTS_PER_HOUR` en
// node_modules/@convex-dev/auth/src/server/implementation/rateLimit.ts.
// `convex/auth.ts` NO configura `signIn.maxFailedAttempsPerHour`, así que rige
// el valor por defecto. Si algún día lo configura, hay que leerlo de ahí.
export const MAX_FAILED_ATTEMPTS_PER_HOUR = 10;

// La fórmula de abajo está COPIADA de esa librería. Una copia se desincroniza en
// silencio, así que se fija la versión contra la que se verificó: si cambia, el
// aviso obliga a revisar la réplica en vez de descubrirla fallando.
export const SUPPORTED_AUTH_VERSION = "0.0.94";

const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * Réplica de `getRateLimitState`: el cubo se RELLENA de forma continua, así que
 * el `attemptsLeft` guardado NO es el valor vigente. Leer el campo crudo daría
 * falsas alarmas — una fila con 0.21 de hace 52 minutos tiene hoy 8.88.
 */
export function effectiveAttemptsLeft(row, now) {
  const elapsed = now - row.lastAttemptTime;
  return Math.min(
    MAX_FAILED_ATTEMPTS_PER_HOUR,
    row.attemptsLeft + (elapsed * MAX_FAILED_ATTEMPTS_PER_HOUR) / MS_PER_HOUR,
  );
}

/** El umbral de la librería es `< 1`, no `<= 0`. La diferencia se pierde al replicar. */
export function isExhausted(row, now) {
  return effectiveAttemptsLeft(row, now) < 1;
}

/**
 * QUÉ FILAS IMPORTAN. Hay DOS superficies limitadas y solo una afecta al login
 * por contraseña de la suite:
 *
 *   - `retrieveAccountWithCredentials` -> identificador = `_id` de authAccounts
 *   - `verifyCodeAndSignIn` (OTP/reset) -> identificador = `email ?? phone`
 *
 * Clasificar por la FORMA del identificador no vale, y esto es el Major de la
 * ronda 2: un teléfono no lleva "@", así que `identifier.includes("@")` habría
 * tomado una fila OTP por una cuenta de contraseña y habría abortado una corrida
 * con los logins sanos. La comprobación escrita para que un rojo del entorno
 * deje de parecer un defecto del producto se habría inventado un rojo que no
 * existe.
 *
 * Así que no se adivina: una fila es del camino de credenciales SI Y SOLO SI su
 * identificador está entre las cuentas `password`.
 */
export function selectBlockedPasswordAccounts(rateLimitRows, passwordAccountsById, now) {
  return rateLimitRows
    .filter((row) => isExhausted(row, now))
    .map((row) => ({ row, email: passwordAccountsById.get(row.identifier) }))
    .filter((hit) => hit.email !== undefined);
}

function minutos(ms) {
  return Math.max(1, Math.round(ms / 60000));
}

/**
 * El mensaje NO afirma que fallen todos los tests con login: bloquear una cuenta
 * no bloquea la otra, y hacer abandonar una corrida que en parte habría pasado
 * es el mismo tipo de daño que esta comprobación combate.
 */
export function formatMessage({ deployment, blocked, now }) {
  const cuentas = blocked
    .map(({ row, email }) => {
      const edad = minutos(now - row.lastAttemptTime);
      const falta = 1 - effectiveAttemptsLeft(row, now);
      const restante = minutos((falta * MS_PER_HOUR) / MAX_FAILED_ATTEMPTS_PER_HOUR);
      return `      ${email}   último intento fallido hace ${edad} min; se recupera en ~${restante} min`;
    })
    .join("\n");

  return [
    "",
    "[e2e] PRECONDICIÓN NO CUMPLIDA — límite de intentos de login agotado",
    "",
    `Convex Auth bloquea una CUENTA tras ${MAX_FAILED_ATTEMPTS_PER_HOUR} intentos FALLIDOS en una hora.`,
    `En este deployment (${deployment}) hay ${blocked.length} cuenta(s) de acceso por`,
    "contraseña bloqueada(s):",
    "",
    cuentas,
    "",
    "Esto NO es una regresión del producto. Los tests que entran con ESA cuenta",
    "fallarán con «TooManyFailedAttempts», que parece un fallo de la aplicación sin",
    "serlo. Los que entran con otra cuenta no están afectados por esto.",
    "",
    "Este bloqueo YA EXISTÍA antes de arrancar la suite: esta corrida todavía no ha",
    "hecho ningún intento. (Si la suite arranca bien y los logins empiezan a fallar A",
    "MITAD, es el otro caso y este aviso todavía no lo cubre — ver AIT-110.)",
    "",
    "Ojo: una vez bloqueada, la cuenta NO se desbloquea entrando bien. El límite se",
    "comprueba ANTES de validar la contraseña, así que ningún acierto resetea el",
    "contador. Solo el tiempo, ~1 intento cada 6 minutos.",
    "",
    "Los tests que no hacen login sí pueden correr ahora:",
    "    npx playwright test 00-customerValidation 00-phone 06-aviso-version-nueva",
    "",
  ].join("\n");
}

/**
 * MENSAJE CONSTANTE. Todo fallo imprevisto sale por aquí, y por aquí no pasa
 * ningún dato: ni el error, ni su stack, ni stdout, ni stderr, ni el búfer
 * crudo, ni lo ya parseado.
 */
const AVISO_GENERICO =
  "[e2e] no se ha podido comprobar el límite de intentos de login; se continúa igualmente.";

/**
 * Lectura de una tabla. `execFile` CAPTURA la salida (nunca `stdio: "inherit"`):
 * con `inherit`, si el CLI imprimiera filas al fallar, saldrían por la terminal
 * SIN PASAR POR ESTE CÓDIGO y ninguna regla de aquí las alcanzaría.
 *
 * Y cualquier error —incluido un `spawn` que falla antes de arrancar, o un
 * desbordamiento de búfer— se convierte en un rechazo SIN DATOS: el objeto de
 * error de `execFile` lleva `stdout`/`stderr` colgando, así que se descarta
 * entero en vez de propagarlo.
 */
async function readTable(table) {
  let stdout;
  try {
    ({ stdout } = await execFileAsync(
      "npx",
      ["convex", "data", table, "--format", "json"],
      { cwd: process.cwd(), maxBuffer: 32 * 1024 * 1024 },
    ));
  } catch {
    throw new Error("lectura fallida");
  }
  // Tabla vacía o inexistente: el CLI escribe en stderr y deja stdout VACÍO,
  // con código 0. Medido, no supuesto. `JSON.parse("")` reventaría.
  const texto = stdout.trim();
  return texto === "" ? [] : JSON.parse(texto);
}

export async function readRateLimitsFromConvex() {
  return readTable("authRateLimits");
}

/**
 * De `authAccounts` se retienen SOLO estos dos campos y en el mismo paso en que
 * se parsea. Esa tabla incluye la columna `secret`: el documento completo no
 * sobrevive a esta función, y nada de ella se imprime nunca (incidente real,
 * 2026-08-21).
 */
export async function readPasswordAccountsFromConvex() {
  const filas = await readTable("authAccounts");
  const mapa = new Map();
  for (const fila of filas) {
    if (fila.provider === "password") mapa.set(fila._id, fila.providerAccountId);
  }
  return mapa;
}

export function installedAuthVersion() {
  try {
    const ruta = path.join(process.cwd(), "node_modules", "@convex-dev", "auth", "package.json");
    return JSON.parse(readFileSync(ruta, "utf8")).version;
  } catch {
    return null;
  }
}

/**
 * El nombre del deployment sale del entorno o, si no está, de `.env.local` —
 * que es donde vive de verdad, porque lo lee Next y no Node.
 *
 * SE EXTRAE UNA SOLA CLAVE. Ese fichero tiene además claves de despliegue: se
 * busca `CONVEX_DEPLOYMENT` por línea y no se guarda ni se devuelve nada más, y
 * cualquier fallo de lectura da `null` en silencio.
 */
export function deploymentName(env = process.env, cwd = process.cwd()) {
  if (env.CONVEX_DEPLOYMENT) return env.CONVEX_DEPLOYMENT.split("#")[0].trim();
  try {
    for (const linea of readFileSync(path.join(cwd, ".env.local"), "utf8").split("\n")) {
      const m = /^\s*CONVEX_DEPLOYMENT\s*=\s*(.+)$/.exec(linea);
      if (m) return m[1].split("#")[0].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // sin fichero, sin permisos, lo que sea: no es motivo para fallar
  }
  return null;
}

export async function run({
  readRateLimits = readRateLimitsFromConvex,
  readPasswordAccounts = readPasswordAccountsFromConvex,
  out = (linea) => console.log(linea),
  err = (linea) => console.error(linea),
  now = Date.now(),
  deployment = deploymentName() ?? "este deployment",
  version = installedAuthVersion,
} = {}) {
  try {
    const instalada = version();
    if (instalada !== null && instalada !== SUPPORTED_AUTH_VERSION) {
      err(
        `[e2e] @convex-dev/auth ${instalada} != ${SUPPORTED_AUTH_VERSION}: revisa la réplica ` +
          "de la fórmula del limitador en scripts/check-e2e-preconditions.mjs.",
      );
    }

    const [filas, cuentas] = await Promise.all([
      readRateLimits(),
      readPasswordAccounts(),
    ]);
    const bloqueadas = selectBlockedPasswordAccounts(filas, cuentas, now);
    if (bloqueadas.length === 0) return 0; // el silencio es el caso normal

    out(formatMessage({ deployment, blocked: bloqueadas, now }));
    return 1;
  } catch {
    // Una comprobación que falla no puede convertirse en un fallo de la suite.
    err(AVISO_GENERICO);
    return 0;
  }
}

// Solo se ejecuta al invocarlo directamente; importado desde las pruebas, no.
//
// Este módulo evita `import.meta` y el `await` de nivel superior A PROPÓSITO:
// Playwright lo transforma a CommonJS al importarlo desde un spec, y ahí los dos
// son errores de sintaxis que tumban la recogida de tests ENTERA — no solo este
// fichero. Un módulo que solo se puede ejecutar pero no importar no se puede
// probar, y las pruebas del canario son el motivo de que exista la inyección.
if (process.argv[1]?.endsWith("check-e2e-preconditions.mjs")) {
  run().then((codigo) => {
    process.exitCode = codigo;
  });
}

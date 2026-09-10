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
import { readFileSync, readdirSync } from "node:fs";
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
/**
 * @param {string} table
 * @param {(file: string, args: string[], options: object) => Promise<{ stdout: string }>} [exec]
 */
export async function readTable(table, exec = execFileAsync) {
  let stdout;
  try {
    ({ stdout } = await exec(
      "npx",
      ["convex", "data", table, "--format", "json"],
      { cwd: process.cwd(), maxBuffer: 32 * 1024 * 1024 },
    ));
  } catch {
    // SE DESCARTA EL ERROR ENTERO, no se re-lanza ni se envuelve: el objeto de
    // `execFile` trae `stdout` y `stderr` COLGANDO —también cuando el `spawn`
    // falla antes de arrancar o cuando se desborda `maxBuffer`—, así que
    // propagarlo sería sacar el contenido de la tabla por otra puerta.
    // `exec` es inyectable justo para poder demostrar esto: con el binario real
    // no hay forma de provocar un desbordamiento con datos sensibles dentro.
    throw new Error("lectura fallida");
  }
  // Tabla vacía o inexistente: el CLI escribe en stderr y deja stdout VACÍO,
  // con código 0. Medido, no supuesto. `JSON.parse("")` reventaría.
  const texto = stdout.trim();
  return texto === "" ? [] : JSON.parse(texto);
}

export async function readRateLimitsFromConvex(exec) {
  return readTable("authRateLimits", exec);
}

/**
 * De `authAccounts` se retienen SOLO estos dos campos y en el mismo paso en que
 * se parsea. Esa tabla incluye la columna `secret`: el documento completo no
 * sobrevive a esta función, y nada de ella se imprime nunca (incidente real,
 * 2026-08-21).
 */
export async function readPasswordAccountsFromConvex(exec) {
  const filas = await readTable("authAccounts", exec);
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

// ============================================================================
// AIT-123 — que el arnés no corra contra OTRO backend
// ============================================================================
// Resolver el deployment por URL+admin key (en vez de por nombre) hace que el
// CLI de Convex reescriba el `.env.local` DEL DIRECTORIO EN QUE SE INVOCA: borra
// `CONVEX_DEPLOYMENT` y REPUNTA `NEXT_PUBLIC_CONVEX_URL`/`_SITE_URL` al destino
// del comando. Medido el 2026-09-10 contra el binario real (convex 1.42.1).
//
// *** POR QUÉ ESTO ES UNA PRECONDICIÓN Y NO UN AVISO MÁS. ***
// El CLI SÍ avisa, en la primera línea de su salida. Lo que no avisa es la
// CONSECUENCIA, que llega después y en manos de otro: Next lee
// `NEXT_PUBLIC_CONVEX_URL`, así que el siguiente `npm run dev` de ese worktree
// habla con el backend del comando anterior. No es un fallo silencioso: es un
// aviso que nadie trata como gate. Esta función lo convierte en gate, en el
// instante en que iba a producir resultados e2e falsos.
//
// *** POR QUÉ MIRA EL FICHERO Y NO `process.env`. ***
// `deploymentName()` de arriba lee PRIMERO el entorno y solo cae al fichero si
// no está — contesta a otra pregunta y es correcta para la suya. Aquí el sujeto
// dañado es el FICHERO: con `CONVEX_DEPLOYMENT` exportado en la shell, un
// `.env.local` repuntado daría verde. Por eso esta función no recibe `env`.
//
// *** POR QUÉ IGUALDAD EXACTA Y NO "el nombre aparece en la URL". ***
// Un "contiene" acepta `https://evil.example/third-goldfinch-805`. La igualdad
// se comprobó contra los seis `.env.local` de la fábrica (raíz, QA, T1-T4) el
// 2026-09-10: los seis la cumplen para las DOS urls.

/** Las dos URL públicas se derivan del nombre. Convex Cloud las escribe así. */
export function urlsEsperadas(nombreSinPrefijo) {
  return {
    NEXT_PUBLIC_CONVEX_URL: `https://${nombreSinPrefijo}.convex.cloud`,
    NEXT_PUBLIC_CONVEX_SITE_URL: `https://${nombreSinPrefijo}.convex.site`,
  };
}

/** Valor de una clave en el contenido de un `.env.local`. `null` si no está.
 *  Cadena vacía si la línea existe sin valor — que NO es lo mismo, y es uno de
 *  los dos estados en que puede quedar el fichero tras el daño. */
export function valorDeClave(contenido, clave) {
  const re = new RegExp(`^\\s*${clave}\\s*=(.*)$`, "m");
  const m = re.exec(contenido);
  if (m === null) return null;
  return m[1].split("#")[0].trim().replace(/^["']|["']$/g, "");
}

/**
 * Problemas del `.env.local`, como lista. Vacía = sano.
 *
 * PURA a propósito: recibe el CONTENIDO, no una ruta. Así se puede probar el
 * daño sin fabricarlo en disco, y —más importante— no hay forma de que consulte
 * el entorno por accidente.
 */
export function problemasDelEnvLocal(contenido) {
  // Un self-hosted legítimo no tiene `CONVEX_DEPLOYMENT` y sus URLs no derivan
  // de ningún nombre: el propio CLI prohíbe tener las dos cosas a la vez. Hoy
  // no hay ninguno en la fábrica; si lo hubiera, esta comprobación tiene que
  // saberlo en vez de gritar.
  if (valorDeClave(contenido, "CONVEX_SELF_HOSTED_URL")) return [];

  const crudo = valorDeClave(contenido, "CONVEX_DEPLOYMENT");
  if (crudo === null) {
    return ["falta la línea `CONVEX_DEPLOYMENT`"];
  }
  if (crudo === "") {
    return ["`CONVEX_DEPLOYMENT` está presente pero SIN VALOR"];
  }

  const nombre = crudo.replace(/^[a-z]+:/, "");
  const esperadas = urlsEsperadas(nombre);
  const problemas = [];
  for (const [clave, esperada] of Object.entries(esperadas)) {
    const actual = valorDeClave(contenido, clave);
    if (actual === null) {
      problemas.push(`falta la línea \`${clave}\``);
    } else if (actual !== esperada) {
      // Se enseña la URL, no el fichero: `NEXT_PUBLIC_` es público por
      // definición y el nombre del deployment ya circula por los documentos.
      problemas.push(
        `\`${clave}\` apunta a \`${actual}\` y el deployment configurado es ` +
          `\`${crudo}\` (esperaba \`${esperada}\`)`,
      );
    }
  }
  return problemas;
}

export function formatEnvLocalMessage(problemas) {
  return [
    "",
    "[e2e] PRECONDICIÓN AIT-123 — el `.env.local` de este worktree no es coherente.",
    "",
    ...problemas.map((p) => `  · ${p}`),
    "",
    "  Un comando de `convex` que resuelva el deployment por URL+admin key en vez",
    "  de por nombre reescribe este fichero: borra `CONVEX_DEPLOYMENT` y repunta",
    "  las dos `NEXT_PUBLIC_*` a su propio destino. El CLI lo avisa en su primera",
    "  línea; la consecuencia llega después.",
    "",
    "  No se ejecuta ningún test: la suite mediría contra OTRO backend y los",
    "  resultados no serían atribuibles a este worktree.",
    "",
    "  Recupéralo con `npx convex dev` desde ESTE worktree, con el deployment que",
    "  le corresponda, y comprueba las tres líneas antes de volver a lanzar.",
    "",
  ].join("\n");
}

/** Lee el fichero. Separada de la lógica para poder inyectarla en las pruebas.
 *  Si no existe, devuelve `null`: Railway y CI no tienen `.env.local`, y esa
 *  ausencia no es el daño que esto detecta. */
export function readEnvLocal(cwd = process.cwd()) {
  try {
    return readFileSync(path.join(cwd, ".env.local"), "utf8");
  } catch {
    return null;
  }
}

// ============================================================================
// AIT-95 — que el arnés no corra contra un backend desfasado
// ============================================================================
// `git pull` trae el CÓDIGO de una función de Convex. NO la mete en tu
// deployment: eso solo lo hace `convex dev` / `convex deploy`. Un worktree que
// actualiza `main` y no despliega falla exactamente en los tests que ejercitan
// backend nuevo, y el síntoma no habla de la causa: medido el 2026-09-09, cinco
// tests de 07-contacto-sin-venta caían con `expect(page).toHaveURL(…)` porque
// `customers.js:createContact` (AIT-88) no estaba desplegada. Ni una palabra
// sobre Convex en toda la salida.
//
// *** POR QUÉ ESTA COMPROBACIÓN FALLA CERRADA Y LA DEL LIMITADOR NO. ***
// No es una incoherencia: son preguntas distintas.
//   - el limitador responde "¿hay un bloqueo YA conocido?" -> no saberlo no es
//     motivo para parar la suite, así que `run` lo traga y devuelve 0.
//   - ésta responde "¿está desplegado lo que el código espera?" -> no saberlo
//     significa que los resultados de la suite no son atribuibles, que es
//     EXACTAMENTE el defecto de AIT-95. Callar aquí sería reproducirlo.

/** Constructores de función de Convex. Una `export const X = <esto>(…)` es una
 *  función desplegable llamada X. */
const CONSTRUCTORES = new Set([
  "query", "mutation", "action",
  "internalQuery", "internalMutation", "internalAction",
  "httpAction",
]);

/** Factorías que declaran varias funciones de golpe por destructuring.
 *  Se comparan los nombres por IGUALDAD DE CONJUNTOS: sobra uno o falta uno y
 *  aborta. No es una lista de funciones (eso lo prohíbe la ficha): es el
 *  vocabulario del extractor, y crece solo al aparecer una FORMA nueva. */
export const FACTORIAS = {
  convexAuth: {
    funciones: ["signIn", "signOut", "store", "isAuthenticated"],
    // `auth` NO se despliega como función: medido contra `function-spec`.
    // Extraer los cinco a ciegas daría un falso positivo que abortaría la suite
    // por una función que no existe.
    noFunciones: ["auth"],
  },
};

/** Espacios cuyas llamadas NUNCA producen una función Convex. Hoy: los
 *  validadores (`v.union(...)`). Mismo mecanismo que FACTORIAS. */
export const ESPACIOS_NO_FUNCION = new Set(["v"]);

/** Error de clasificación: lo que el extractor no sabe leer PARA la suite en
 *  vez de omitirlo. Tipo propio para que las pruebas distingan "abortó por esto"
 *  de "abortó por cualquier otra cosa". */
export class DeclaracionNoClasificable extends Error {
  constructor(fichero, linea, texto) {
    super(
      `[e2e] no sé clasificar esta declaración de ${fichero}:${linea}\n` +
        `        ${texto.slice(0, 120)}\n` +
        `      Añádela a scripts/check-e2e-preconditions.mjs (CONSTRUCTORES, ` +
        `FACTORIAS o ESPACIOS_NO_FUNCION) o reescríbela en una forma conocida. ` +
        `No se continúa: una forma sin clasificar puede ser una función sin ` +
        `desplegar, y eso es lo que esta comprobación existe para detectar.`,
    );
    this.name = "DeclaracionNoClasificable";
    this.fichero = fichero;
    this.linea = linea;
  }
}

/** Módulo tal y como lo nombra Convex: ruta relativa a `convex/`, sin
 *  extensión, `/` -> `_`, sufijo `.js`.
 *
 *  ⚠️ LO VERIFICADO Y LO NO VERIFICADO: para ficheros de la raíz de `convex/`
 *  está confirmado contra `function-spec` (p. ej. `customers.js:…`). Para
 *  SUBCARPETAS la regla sale de los alias que genera el codegen en
 *  `_generated/api.d.ts` (`model_customerSource`), porque hoy NINGÚN fichero de
 *  `convex/model/` exporta una función Convex y por tanto no hay ningún
 *  identificador desplegado con el que contrastarla de punta a punta. */
export function moduloDesdeRuta(rutaRelativa) {
  return `${rutaRelativa.replace(/\.ts$/, "").split("/").join("_")}.js`;
}

/** Separa el `=` de nivel superior. Devuelve `null` si no lo hay.
 *  Cuenta paréntesis, corchetes y llaves; ignora `=>`, `==`, `<=`, `>=`, `!=`. */
function partirPorIgual(texto) {
  let prof = 0;
  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];
    if (c === "(" || c === "[" || c === "{") prof += 1;
    else if (c === ")" || c === "]" || c === "}") prof -= 1;
    else if (c === "=" && prof === 0) {
      if (texto[i + 1] === "=" || texto[i + 1] === ">") continue;
      if ("=<>!".includes(texto[i - 1])) continue;
      return [texto.slice(0, i), texto.slice(i + 1)];
    }
  }
  return null;
}

/**
 * Trocea una fuente en declaraciones `export` DE NIVEL SUPERIOR.
 *
 * La unidad es la DECLARACIÓN, no la línea, y no es un detalle: en
 * `convex/model/customerSource.ts:46` el `export const` y su `= true` están a
 * cuatro líneas de distancia por un genérico multilínea. Un extractor por
 * líneas lo habría partido en dos y no habría encontrado inicializador.
 */
export function extraerDeclaraciones(fuente) {
  const lineas = fuente.split("\n");
  const declaraciones = [];
  for (let i = 0; i < lineas.length; i += 1) {
    if (!/^export\b/.test(lineas[i])) continue;
    let texto = lineas[i];
    // Se unen líneas hasta encontrar el `=` de nivel superior o el final de la
    // sentencia. El tope evita quedarse leyendo un fichero entero si algo va mal.
    let j = i;
    while (
      j + 1 < lineas.length &&
      j - i < 40 &&
      partirPorIgual(texto) === null &&
      !/[;{]\s*$/.test(texto) &&
      !/^export\s+(type|interface|enum|default|async\s+function|function)\b/.test(texto)
    ) {
      j += 1;
      texto += ` ${lineas[j].trim()}`;
    }
    declaraciones.push({ linea: i + 1, texto: texto.trim() });
  }
  return declaraciones;
}

/**
 * D1–D6, EN ESTE ORDEN, y el `else` final ABORTA.
 *
 * El fail-closed no es una etiqueta que se le pone al diseño: es qué hace la
 * rama `else`. Enumerar lo que ES función y dejar pasar el resto convierte
 * cualquier forma nueva en un silencio — y una función nueva sin desplegar
 * saldría en verde, que es justo lo que AIT-95 viene a impedir.
 *
 * @returns {string[]} nombres de función que declara (vacío si no declara ninguna)
 */
export function clasificarDeclaracion({ texto, linea }, fichero) {
  const abortar = () => {
    throw new DeclaracionNoClasificable(fichero, linea, texto);
  };

  // Se prepara lo común ANTES de las ramas para poder recorrerlas en el orden
  // del contrato. Si no se puede partir, no se aborta aquí: se deja caer hasta
  // el `else` final, que es quien tiene esa responsabilidad.
  const esConst = /^export\s+const\b/.test(texto);
  let enlace = null;
  let inicializador = null;
  // DOS formas distintas y NUNCA una compartida: `f(` no es lo mismo que `f.`,
  // y una sola variable para las dos arrastra a cada rama un permiso que solo
  // valía en la de al lado. Pasó: al reordenar, D2 reutilizó una expresión
  // ensanchada para D6 y `convexAuth.otraCosa({})` pasó a devolver las cuatro
  // funciones de `convexAuth` sin que `convexAuth(...)` se invocara nunca.
  let llamadaDirecta = null; // `f(` — D1 y D2
  let accesoAEspacio = null; // `f.` — D6
  if (esConst) {
    const partes = partirPorIgual(texto.replace(/^export\s+const\b/, ""));
    if (partes !== null) {
      enlace = partes[0].trim();
      inicializador = partes[1].trim();
      llamadaDirecta = /^([A-Za-z_$][\w$]*)\s*\(/.exec(inicializador);
      accesoAEspacio = /^([A-Za-z_$][\w$]*)\s*\./.exec(inicializador);
    }
  }

  // ── D1 · constructor de función Convex ────────────────────────────────────
  if (
    esConst &&
    enlace !== null &&
    !enlace.startsWith("{") &&
    llamadaDirecta &&
    CONSTRUCTORES.has(llamadaDirecta[1])
  ) {
    const nombre = /^([A-Za-z_$][\w$]*)/.exec(enlace);
    if (!nombre) abortar();
    return [nombre[1]];
  }

  // ── D2 · destructuring de una factoría registrada, por igualdad de conjuntos
  // Sus fallos ABORTAN aquí mismo: un destructuring de una factoría desconocida
  // no puede caer a D6 y salir clasificado como no-función.
  if (esConst && enlace !== null && enlace.startsWith("{")) {
    // LLAMADA DIRECTA, no acceso por propiedad: `convexAuth.algo({})` NO es
    // `convexAuth({})`, y tomarlo por tal clasificaría una forma desconocida
    // como factoría conocida — el falso negativo que este contrato existe para
    // no tener.
    const factoria = llamadaDirecta && FACTORIAS[llamadaDirecta[1]];
    if (!factoria) abortar();
    const nombres = enlace
      .replace(/^\{|\}$/g, "")
      .split(",")
      .map((n) => n.split(":")[0].trim())
      .filter(Boolean);
    const declarados = [...factoria.funciones, ...factoria.noFunciones];
    const sobran = nombres.filter((n) => !declarados.includes(n));
    const faltan = declarados.filter((n) => !nombres.includes(n));
    if (sobran.length > 0 || faltan.length > 0) abortar();
    return factoria.funciones.slice();
  }

  // ── D3 · tipos ────────────────────────────────────────────────────────────
  if (/^export\s+(type|interface|enum)\b/.test(texto)) return [];

  // ── D4 · funciones declaradas ─────────────────────────────────────────────
  if (/^export\s+(async\s+)?function\b/.test(texto)) return [];

  // ── D5 · export default ───────────────────────────────────────────────────
  // Convex nombra las funciones por su export, y `default` es un nombre válido:
  // `export default query({…})` se desplegaría como `modulo.js:default`. Por eso
  // esta rama NO puede devolver [] sin mirar: un `default` construido con un
  // constructor ABORTA, porque clasificarlo como no-función sería el falso
  // negativo que esta comprobación existe para no tener.
  //
  // Medido en este repo: hay cinco `export default` —auth.config, convex.config,
  // crons, http (CUATRO identificadores) y schema, que es una LLAMADA DIRECTA a
  // `defineSchema(...)`— y `function-spec` no devuelve NINGÚN identificador
  // acabado en `:default`.
  //
  // Que `schema.ts` no aborte NO es una exclusión: es que `defineSchema` no está
  // en CONSTRUCTORES. La rama distingue "constructor de FUNCIÓN Convex" de
  // "cualquier llamada", y de ahí que el repo entero pase en verde.
  //
  // RESIDUO DECLARADO: `export default unIdentificador` seguiría clasificándose
  // como no-función aunque ese identificador guardase una función Convex. No se
  // cierra porque cerrarlo obligaría a abortar en los cinco casos reales, y un
  // control que aborta ante lo legítimo se desactiva en una semana (misma razón
  // por la que existe el fixture X8).
  if (/^export\s+default\b/.test(texto)) {
    const llamadaDefecto = /^export\s+default\s+([A-Za-z_$][\w$]*)\s*\(/.exec(texto);
    if (llamadaDefecto && CONSTRUCTORES.has(llamadaDefecto[1])) abortar();
    return [];
  }

  // ── D6 · no-función INEQUÍVOCA ────────────────────────────────────────────
  // Exige además que lo declarado sea UN NOMBRE, opcionalmente con anotación de
  // tipo. Sin esa condición, `export const [a, b] = [query({}), mutation({})]`
  // caía aquí por tener un literal a la derecha y devolvía [] — dos funciones
  // Convex clasificadas como no-función, en silencio. Es la misma forma que el
  // fallo de `convexAuth.otraCosa`: la rama miraba el inicializador y daba por
  // supuesto el enlace. Hoy no existe ningún caso así en `convex/` (medido), así
  // que cerrarlo no cuesta ruido: lo que no sea un nombre simple cae al `else`.
  const enlaceEsNombreSimple =
    enlace !== null && /^[A-Za-z_$][\w$]*\s*(:|$)/.test(enlace);
  if (esConst && inicializador !== null && enlaceEsNombreSimple) {
    if (/^["'`{[]/.test(inicializador)) return [];
    if (/^-?\d/.test(inicializador)) return [];
    if (/^(true|false|null|undefined)\b/.test(inicializador)) return [];
    // Solo el ACCESO (`v.union(…)`). Una llamada directa `v(…)` no está
    // declarada y cae al `else`.
    if (accesoAEspacio && ESPACIOS_NO_FUNCION.has(accesoAEspacio[1])) return [];
  }

  // ── else · lo que no se sabe clasificar PARA la suite ─────────────────────
  // `export const X = miHelper(query({…}))` cae aquí. También `export { … }`,
  // `export * from …` y `export class …`: formas que pueden reexportar o
  // envolver una función y que no se adivinan.
  return abortar();
}

/** Identificadores `modulo.js:nombre` que el CÓDIGO declara.
 *  @param {Array<{ruta: string, fuente: string}>} ficheros */
export function identificadoresDelCodigo(ficheros) {
  const encontrados = [];
  for (const { ruta, fuente } of ficheros) {
    const modulo = moduloDesdeRuta(ruta);
    for (const decl of extraerDeclaraciones(fuente)) {
      for (const nombre of clasificarDeclaracion(decl, ruta)) {
        encontrados.push(`${modulo}:${nombre}`);
      }
    }
  }
  return encontrados;
}

export function selectMissingFunctions(delCodigo, desplegadas) {
  const vivas = new Set(desplegadas);
  return delCodigo.filter((id) => !vivas.has(id)).sort();
}

/** Lee los `.ts` de `convex/`, recursivamente, saltándose `_generated/` (es salida de la herramienta,
 *  no fuente). Se devuelve la ruta RELATIVA a `convex/` porque es de donde sale
 *  el nombre del módulo. */
export function readConvexSources(raiz = path.join(process.cwd(), "convex")) {
  const ficheros = [];
  const recorrer = (dir) => {
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
      const completa = path.join(dir, entrada.name);
      if (entrada.isDirectory()) {
        if (entrada.name !== "_generated") recorrer(completa);
      } else if (entrada.name.endsWith(".ts")) {
        ficheros.push({
          ruta: path.relative(raiz, completa),
          fuente: readFileSync(completa, "utf8"),
        });
      }
    }
  };
  recorrer(raiz);
  return ficheros;
}

/** Funciones DESPLEGADAS, según la propia herramienta.
 *
 *  Falla cerrada, y sin volcar nada: igual que `readTable`, el objeto de error
 *  de `execFile` trae `stdout`/`stderr` colgando y propagarlo sacaría el
 *  contenido por otra puerta. Aquí `function-spec` no lleva datos de la base,
 *  pero la regla se mantiene por la misma razón que allí: no se decide caso por
 *  caso qué salida es inocua. */
/**
 * @param {(file: string, args: string[], options: object) => Promise<{ stdout: string }>} [exec]
 */
export async function readDeployedFunctions(exec = execFileAsync) {
  let stdout;
  try {
    ({ stdout } = await exec("npx", ["convex", "function-spec"], {
      cwd: process.cwd(),
      maxBuffer: 32 * 1024 * 1024,
    }));
  } catch {
    throw new Error("function-spec falló");
  }
  let spec;
  try {
    spec = JSON.parse(stdout);
  } catch {
    throw new Error("function-spec devolvió algo que no es JSON");
  }
  if (!Array.isArray(spec?.functions)) {
    throw new Error("function-spec devolvió JSON sin `functions`");
  }
  // Las rutas HTTP vienen sin `identifier` (llevan `method`/`path`): no son
  // funciones nombradas y no participan en la comparación.
  return spec.functions.map((f) => f.identifier).filter(Boolean);
}

export function formatMissingMessage({ deployment, missing }) {
  return [
    "",
    "[e2e] PRECONDICIÓN NO CUMPLIDA — el backend no tiene lo que el código espera.",
    "",
    `  Deployment: ${deployment}`,
    ...missing.map((id) => `  falta: ${id}`),
    "",
    "  `git pull` trae el código de una función de Convex; NO la despliega.",
    "  Corrígelo con:  npx convex dev",
    "",
    "  No se ejecuta ningún test: los que ejerciten esas funciones fallarían con",
    "  un síntoma que no habla de la causa (una aserción de URL o de texto).",
    "",
  ].join("\n");
}

export async function run({
  readRateLimits = readRateLimitsFromConvex,
  readPasswordAccounts = readPasswordAccountsFromConvex,
  out = (linea) => console.log(linea),
  err = (linea) => console.error(linea),
  now = Date.now(),
  deployment = deploymentName() ?? "este deployment",
  version = installedAuthVersion,
  readSources = readConvexSources,
  readDeployed = readDeployedFunctions,
  leerEnvLocal = readEnvLocal,
} = {}) {
  // ── AIT-123: contra QUÉ backend corremos, antes que si está al día ────────
  // Va la PRIMERA, delante incluso de AIT-95, y el orden no es cosmético: la
  // comprobación de AIT-95 pregunta "¿está desplegado lo que el código espera?"
  // CONTRA UN DEPLOYMENT — si el `.env.local` apunta a otro, esa pregunta se
  // responde sobre el sujeto equivocado y su verde no significa nada.
  const contenidoEnv = leerEnvLocal();
  if (contenidoEnv !== null) {
    const problemas = problemasDelEnvLocal(contenidoEnv);
    if (problemas.length > 0) {
      out(formatEnvLocalMessage(problemas));
      return 1;
    }
  }
  // Sin fichero no se comprueba: Railway y CI no tienen `.env.local` y esa
  // ausencia no es el daño que esto detecta.

  // ── AIT-95: el backend, antes que nada ────────────────────────────────────
  // Va PRIMERO porque es la precondición más barata de corregir y la que más
  // ruido ahorra: sin ella, la suite corre entera para dar rojos que no hablan
  // de la causa.
  try {
    const faltan = selectMissingFunctions(
      identificadoresDelCodigo(readSources()),
      await readDeployed(),
    );
    if (faltan.length > 0) {
      out(formatMissingMessage({ deployment, missing: faltan }));
      return 1;
    }
  } catch (causa) {
    // FALLA CERRADA, al contrario que el bloque del limitador de abajo, y el
    // motivo está en la cabecera de la sección AIT-95: no saber si el backend
    // está desplegado significa que los resultados de la suite no son
    // atribuibles. Se imprime el mensaje de la causa —que es texto nuestro, no
    // salida del CLI— y se para.
    err(`[e2e] PRECONDICIÓN NO COMPROBABLE — ${causa.message}`);
    err("[e2e] no se ejecuta ningún test: no se puede saber si el backend está al día.");
    return 1;
  }

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

import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

// Suite E2E de los 5 procesos clave del PRD §7 (AIT-26). Corre contra el
// servidor de desarrollo local (Next.js) con el deployment de Convex ya
// configurado en .env.local — no levanta un backend propio.

// ============================================================================
// AIT-96 · PUERTO PROPIO, DECLARADO Y FAIL-CLOSED
// ============================================================================
// Antes: `baseURL` cableado al 3000 y `reuseExistingServer: true`. Con varios
// worktrees vivos, si ya había un next-server en el 3000 Playwright NO levantaba
// el tuyo: reutilizaba el que encontrara, y tus specs medían la app y el
// deployment de OTRA persona devolviendo un número con aspecto de bueno.
// No es hipotético: el QA reportó 31/5 sobre `main` y lo retiró él mismo — el
// servidor era de T1. Lo que lo cerró es que su deployment tenía la tabla
// `users` vacía, así que los logins que "pasaron" eran imposibles allí.
//
// Un recurso compartido que RECHAZA cuesta una espera. Uno que ACEPTA Y SIRVE
// OTRA COSA cuesta una decisión equivocada tomada con confianza.

/** Puertos por worktree. Tabla FIJA a propósito, no derivación:
 *  un hash sobre un rango proyecta infinitas rutas sobre pocos puertos y solo
 *  garantiza que NO se mida la app ajena, no que dos suites no coincidan.
 *  Con la tabla, la unicidad es por construcción para el universo declarado,
 *  y se revisa leyéndola. */
const PUERTO_POR_WORKTREE: Record<string, number> = {
  "CRM curso Vibe Coding": 3100, // checkout raíz
  T1: 3101,
  T2: 3102,
  T3: 3103,
};

/** Valor por defecto de AIT-93: la suite necesita que la app sirva un commit
 *  conocido y FIJO, o `lib/version.ts` devuelve `commit: null`, el layout pasa
 *  `loadedCommit={null}` y el aviso de versión queda inerte — su comportamiento
 *  correcto, pero deja a `06-aviso-version-nueva.spec.ts` sin nada que
 *  ejercitar. Se conserva intacto: lo de abajo solo AÑADE la posibilidad de
 *  sobreescribirlo por invocación. */
const MARCADOR_POR_DEFECTO = "e2e00000000000000000000000000000000e2e00";

/** Mismo patrón que `lib/version.ts`, no uno parecido: si el arnés y el
 *  producto discreparan sobre qué es un SHA válido, un marcador podría pasar
 *  aquí y ser descartado allí, dejando `/version` en `commit: null` — y la
 *  identificación por efecto dejaría de atribuir nada, en silencio. */
const PATRON_SHA = /^[0-9a-f]{7,64}$/;

function abortar(mensaje: string): never {
  throw new Error(`[e2e] ${mensaje}`);
}

function resolverPuerto(): number {
  const crudo = process.env.E2E_PORT;
  if (crudo !== undefined) {
    // Nada de `Number(x) || defecto`: eso convierte "abc" en el valor por
    // defecto EN SILENCIO. Una entrada inválida se rechaza, no se ignora.
    const limpio = crudo.trim();
    const n = Number(limpio);
    if (!/^\d+$/.test(limpio) || !Number.isInteger(n) || n < 1 || n > 65535) {
      abortar(
        `E2E_PORT inválida: ${JSON.stringify(crudo)}. ` +
          `Se espera un entero entre 1 y 65535.`,
      );
    }
    return n;
  }

  const carpeta = path.basename(process.cwd());
  const puerto = PUERTO_POR_WORKTREE[carpeta];
  if (puerto !== undefined) return puerto;

  // Fail-closed: NO se inventa un puerto para una ruta desconocida. Elegir uno
  // "probablemente libre" es justo lo que reintroduce el defecto — abortar es
  // aceptable, medir otra cosa no.
  abortar(
    `este worktree ("${carpeta}") no está en la tabla de puertos ` +
      `(${Object.keys(PUERTO_POR_WORKTREE).join(", ")}). ` +
      `Arranca la suite con E2E_PORT=<puerto libre> para declarar el tuyo.`,
  );
}

function resolverMarcador(): string {
  const crudo = process.env.E2E_COMMIT_MARKER;
  if (crudo === undefined) return MARCADOR_POR_DEFECTO;

  // Ojo: la cadena VACÍA es inválida, no "ausente". Tratarla como ausencia
  // activaría el fallback en silencio, que es la diferencia entre un fallback
  // y un agujero.
  const limpio = crudo.trim().toLowerCase();
  if (!PATRON_SHA.test(limpio)) {
    abortar(
      `E2E_COMMIT_MARKER inválido: ${JSON.stringify(crudo)}. ` +
        `Se esperan 7-64 caracteres hexadecimales (mismo patrón que lib/version.ts).`,
    );
  }
  return limpio;
}

/** Punto ÚNICO de resolución. Se exporta para que cualquier `globalSetup`
 *  futuro (AIT-95, AIT-108) lea el mismo valor en vez de recalcularlo: dos
 *  derivaciones que hoy coinciden y mañana divergen no fallan — eligen puertos
 *  distintos y cada mitad mide una app distinta, que es este mismo defecto
 *  entrando por la puerta de atrás. */
export const E2E_PORT = resolverPuerto();
export const E2E_COMMIT_MARKER = resolverMarcador();

// Se imprime para que el acta de cualquier ejecución pueda decir contra qué
// midió, sin tener que deducirlo del proceso.
console.log(
  `[e2e] puerto ${E2E_PORT} · marcador ${E2E_COMMIT_MARKER.slice(0, 7)}…`,
);

const BASE_URL = `http://localhost:${E2E_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // los tests escriben datos reales en el mismo deployment de Convex
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // AIT-96: el puerto va EXPLÍCITO en el comando, y no es un detalle.
    // `next-dev.js` hace `allowRetry = portSource === 'default'`, y con
    // `allowRetry` el servidor se mueve al siguiente puerto libre hasta 10
    // veces (`start-server.js`). Sin `-p`, Next arrancaría en el 3001 al
    // encontrar ocupado el 3000 y Playwright esperaría 60 s en la URL de abajo:
    // el timeout opaco que esta tarea viene a eliminar. Con `-p` la fuente es
    // CLI, no hay reintento, y un puerto ocupado da EADDRINUSE inmediato.
    command: `npm run dev -- -p ${E2E_PORT}`,
    url: `${BASE_URL}/login`,
    // AIT-96: NUNCA reutilizar. Es la línea que impide medir el servidor de
    // otro. Con ella, un puerto ocupado aborta la corrida; sin ella, la corrida
    // devuelve resultados de otra app sin decirlo.
    reuseExistingServer: false,
    timeout: 60_000,
    // AIT-93: PRECONDICIÓN DECLARADA, no heredada del shell de quien corra.
    // Va aquí y no en el `.env.local` de cada uno porque este fichero está
    // versionado: si la suite pasa en un checkout limpio, pasa para cualquiera.
    // Antes estaba fijada solo en el entorno de quien la escribió, y por eso
    // `main` estuvo en rojo sin que ninguna de las tres puertas (suite del
    // desarrollador, auditoría, build) pudiera verlo.
    //
    // AIT-96 lo hace sobreescribible por invocación (`E2E_COMMIT_MARKER`) sin
    // cambiar el defecto: dos suites simultáneas necesitan marcadores distintos
    // para poder identificar cuál sirve cada puerto preguntándole a `/version`,
    // en vez de fiarlo a `cwd` o al título del proceso.
    env: { RAILWAY_GIT_COMMIT_SHA: E2E_COMMIT_MARKER },
  },
});

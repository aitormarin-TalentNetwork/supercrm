// AIT-79: qué commit está sirviendo la app, legible desde el navegador.
//
// La regla que gobierna este fichero: ante la duda, se calla. Nunca adivina.
// Un identificador de versión equivocado es peor que no tenerlo — responde con
// confianza y miente, y quien lo consulta deja de sospechar. Por eso todos los
// caminos de error de aquí devuelven null en vez de "lo que haya".
//
// Se lee en TIEMPO DE PETICIÓN, no en tiempo de build. Es deliberado: en el
// middleware Edge de Next.js, `process.env.X` se sustituye por un literal al
// construir — el código PARECE leer el entorno y no lo lee, y el valor se queda
// congelado en el del build anterior. En Next.js 16 `proxy.ts` corre en runtime
// Node.js, así que la lectura es real contra el entorno del contenedor. Por eso
// esto es una función y no una constante de módulo: una constante se evaluaría
// una sola vez por proceso y volvería a introducir el mismo problema por otra
// puerta.

export type VersionSource = "RAILWAY_GIT_COMMIT_SHA" | "none";

export type DeployedVersion = {
  commit: string | null;
  commitShort: string | null;
  source: VersionSource;
  deploymentId: string | null;
  environment: string | null;
};

// Un SHA de git y nada más. Sirve para dos cosas distintas:
//   1. No publicar un identificador en el que no se puede confiar.
//   2. Evitar que `Headers.set()` reciba un valor con caracteres inválidos y
//      lance DENTRO del proxy — eso tumbaría TODAS las rutas que pasan por él,
//      a cambio de un dato meramente informativo.
const SHA_PATTERN = /^[0-9a-f]{7,64}$/;

function readNonEmpty(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getDeployedVersion(): DeployedVersion {
  // Railway inyecta esta variable en los despliegues originados por GitHub.
  // Fuente ÚNICA a propósito: cualquier alternativa que haya que mantener a
  // mano acaba publicando el commit de hace tres despliegues.
  const raw = readNonEmpty(process.env.RAILWAY_GIT_COMMIT_SHA)?.toLowerCase();
  const commit = raw && SHA_PATTERN.test(raw) ? raw : null;

  return {
    commit,
    commitShort: commit ? commit.slice(0, 7) : null,
    source: commit ? "RAILWAY_GIT_COMMIT_SHA" : "none",
    // Ata cada respuesta al despliegue que la sirvió. Sin esto, comprobar que
    // producción publica el commit correcto dependería de una ventana temporal
    // ("lo medí justo después de desplegar"), y durante un rollout puede
    // contestar todavía el despliegue anterior.
    deploymentId: readNonEmpty(process.env.RAILWAY_DEPLOYMENT_ID),
    environment: readNonEmpty(process.env.RAILWAY_ENVIRONMENT_NAME),
  };
}

// AIT-83: preguntarle a la propia app qué commit está sirviendo AHORA.
//
// Consume `/version` (que dejó AIT-79). NO lo modifica, ni a `lib/version.ts`,
// ni a `proxy.ts`: son los tres ficheros de los que depende el contrato de
// "qué versión está desplegada", y se rompen sin que falle ningún test — la
// ruta seguiría respondiendo 200.

/** Mismo patrón que `lib/version.ts`, para que cliente y servidor no discrepen
 *  sobre qué es un SHA válido. */
const SHA_PATTERN = /^[0-9a-f]{7,64}$/;

/** Ventana del límite de frecuencia. Solo aplica a los disparadores
 *  oportunistas (eventos), NUNCA al preflight — ver `checkVersion`. */
const THROTTLE_MS = 30_000;

const TIMEOUT_MS = 4_000;

export type VersionResult =
  | { kind: "same" }
  | { kind: "changed"; commit: string }
  // "no sé" — NUNCA se interpreta como "no ha cambiado". Cubre `commit: null`
  // del servidor, timeout, respuesta no-2xx y JSON inválido o inesperado.
  | { kind: "unknown" }
  // Suprimida por el límite de frecuencia. Solo puede ocurrir con
  // `mandatory: false`.
  | { kind: "skipped" };

// Estado compartido a nivel de módulo: hay un solo envoltorio de fetch y un
// solo componente montado, así que compartir aquí es lo correcto.
let inFlight: Promise<VersionResult> | null = null;
// NO se inicializa con `Date.now()`: si se inicializara al cargar, la primera
// comprobación elegible quedaría suprimida justo cuando más falta hace.
let lastResolvedAt: number | null = null;

async function fetchVersion(loadedCommit: string): Promise<VersionResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // `no-store` además del `Cache-Control: no-store` que ya manda la ruta: son
    // dos capas distintas, y una respuesta cacheada aquí significa no enterarse
    // nunca de un despliegue.
    const response = await fetch("/version", {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return { kind: "unknown" };

    // El tipado de TypeScript NO valida una respuesta HTTP: lo que llega por la
    // red es `unknown` hasta que se comprueba en ejecución.
    const data: unknown = await response.json();
    if (typeof data !== "object" || data === null) return { kind: "unknown" };

    const commit = (data as { commit?: unknown }).commit;
    if (typeof commit !== "string" || !SHA_PATTERN.test(commit)) {
      // Incluye el caso `commit: null`, que AIT-79 devuelve cuando Railway no
      // entrega el SHA. Tratarlo como "cambió" habría disparado el aviso en
      // todas las pestañas, para siempre, sin que hubiera habido ningún
      // despliegue.
      return { kind: "unknown" };
    }

    return commit === loadedCommit
      ? { kind: "same" }
      : { kind: "changed", commit };
  } catch {
    // Abortos por timeout, red caída, JSON ilegible. Un fallo de red no es un
    // despliegue.
    return { kind: "unknown" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * CONTRATO (el que costó tres rondas de plan):
 *
 *   - `mandatory: true`  — preflight de una server action. **Nunca** queda
 *     suprimido por el límite temporal y **nunca** reutiliza un resultado ya
 *     resuelto. Si hay una consulta en vuelo se espera a ESA (eso es esperar la
 *     misma respuesta, no dar por buena una autorización almacenada); si no la
 *     hay, se lanza una nueva siempre.
 *   - `mandatory: false` — disparadores oportunistas (`visibilitychange`,
 *     `pageshow`). Sí pueden quedar suprimidos.
 *
 * La distinción que lo ordena: **los eventos son oportunistas, el preflight es
 * obligatorio.** Un evento suprimido solo pierde la ocasión de adelantar un
 * aviso que llegará igual en el preflight; un preflight suprimido reintroduce
 * exactamente la carrera que la intercepción venía a cerrar — reutilizaría como
 * permiso una comprobación anterior a un despliegue que ya ha entrado.
 */
export function checkVersion(
  loadedCommit: string,
  opts: { mandatory: boolean },
): Promise<VersionResult> {
  if (inFlight) return inFlight;

  if (
    !opts.mandatory &&
    lastResolvedAt !== null &&
    Date.now() - lastResolvedAt < THROTTLE_MS
  ) {
    return Promise.resolve({ kind: "skipped" });
  }

  const request = fetchVersion(loadedCommit).finally(() => {
    // Liberado SIEMPRE: un fallo transitorio no puede dejar el detector
    // inutilizado para las comprobaciones futuras.
    inFlight = null;
    lastResolvedAt = Date.now();
  });
  inFlight = request;
  return request;
}

/** Solo para pruebas: devuelve el estado del límite a su valor inicial. */
export function resetVersionCheckState() {
  inFlight = null;
  lastResolvedAt = null;
}

export const VERSION_CHECK_THROTTLE_MS = THROTTLE_MS;

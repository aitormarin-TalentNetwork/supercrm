import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import {
  effectiveAttemptsLeft,
  isExhausted,
  MAX_FAILED_ATTEMPTS_PER_HOUR,
  readPasswordAccountsFromConvex,
  readRateLimitsFromConvex,
} from "../scripts/check-e2e-preconditions.mjs";
// Se IMPORTA la fórmula en vez de copiarla: ese fichero avisa de que su cálculo
// es una réplica de la librería y fija la versión verificada, así que una
// TERCERA copia sería justo lo que ese aviso intenta evitar. Y el acoplamiento
// no es ciego: `tsc` comprueba estas firmas (comprobado — un `@ts-expect-error`
// aquí sale como directiva sobrante), así que si AIT-95 las cambia se ve al
// compilar y no en silencio.

// AIT-110 · QUE EL CUPO DE LOGIN TAMBIÉN HABLE DURANTE LA CORRIDA
// ============================================================================
// AIT-103 avisa ANTES de arrancar; AIT-108 quita la causa propia. Falta el caso
// de en medio: el umbral se cruza con la suite ya en marcha, y el aviso calla
// porque ya hizo su trabajo. Un arnés que nombra el problema a medias es peor
// que uno mudo: enseña a confiar en él.
//
// POR QUÉ UN REPORTER Y NO `e2e/global-setup.ts`, que es el sitio declarado
// "preparado para tres usos": los tres son PRECONDICIONES y corren una vez,
// antes. Esto necesita algo que siga vivo durante la corrida. Un globalSetup no
// puede ver lo que pasa después de sí mismo.
//
// EL HECHO QUE LO CONVIERTE EN UNA RESTA Y NO EN UNA CONJETURA: `globalSetup`
// corre ANTES del `onBegin` del reporter (node_modules/playwright/lib/runner/
// index.js:6664-6667, y createRunTestsTasks abre con createReportBeginTask en
// :6011-6017). Así que la foto inicial YA INCLUYE los dos logins de la suite, y
// lo que baje después no es suyo — sea cual sea el número de logins que haga la
// suite el día de mañana.

/** Fila de `authRateLimits`. Solo estos tres campos salen de la tabla. */
export type Fila = {
  identifier: string;
  attemptsLeft: number;
  lastAttemptTime: number;
};

/** Una lectura del cupo. `null` = no se pudo leer (contrato fail-open). */
export type Foto = { filas: Fila[]; ahora: number } | null;

export type Motivo =
  | "sin-fallos"
  | "sin-lectura"
  | "sin-consumo"
  | "consumo-parcial"
  | "no-es-cuenta-password"
  | "cuenta-password-ajena-a-la-suite";

export type Decision =
  | { aviso: null; motivo: Motivo }
  | {
      aviso: string;
      caso:
        | "llego-agotado"
        | "cruce-antes-del-primer-fallo"
        | "cruce-despues-del-primer-fallo";
    };

/** Las cuentas por las que entra la suite. Va cableado, y la dirección del
 *  fallo es deliberada: si mañana cambian las cuentas demo, esto deja de
 *  encontrarlas y el reporter CALLA — nunca inventa una alarma. Un observador
 *  falla hacia el silencio; el contrario sería un aviso falso, que es el daño
 *  que esta tarea combate.
 *
 *  Y no es cosmético acotar: en este deployment hay NUEVE cuentas `password`
 *  (restos de pruebas de AIT-52 y compañía), no dos. Que otra terminal agote
 *  `ait52-test-sales@supercrm.es` no explica ningún fallo de esta suite. */
export const CUENTAS_DE_LA_SUITE = ["marta@supercrm.es", "carlos@supercrm.es"];

const MENSAJE_PREMISA =
  "La suite no hace logins después del arranque (solo e2e/global-setup.ts), " +
  "así que este consumo NO es suyo.";

function horaLegible(ms: number): string {
  return new Date(ms).toTimeString().slice(0, 8);
}

/** Filas de la foto que corresponden a una cuenta password DE LA SUITE.
 *  Devuelve también por qué se descartó el resto, para que el silencio del
 *  reporter sea un silencio CON MOTIVO y no la ausencia de código ejecutado. */
function clasificar(
  foto: NonNullable<Foto>,
  cuentasPassword: Map<string, string>,
  emailsSuite: string[],
) {
  const propias: Array<{ fila: Fila; email: string }> = [];
  let habiaPasswordAjena = false;
  let habiaNoPassword = false;
  for (const fila of foto.filas) {
    const email = cuentasPassword.get(fila.identifier);
    if (email === undefined) {
      // No está entre las cuentas `password`: es del camino OTP/reset, cuyo
      // identificador es `email ?? phone` y no un `_id` de authAccounts.
      // NO se clasifica por la FORMA del identificador — un teléfono no lleva
      // "@", y ese fue el Major de la ronda 2 de AIT-103.
      habiaNoPassword = true;
      continue;
    }
    if (!emailsSuite.includes(email)) {
      habiaPasswordAjena = true;
      continue;
    }
    propias.push({ fila, email });
  }
  return { propias, habiaPasswordAjena, habiaNoPassword };
}

/** LA DECISIÓN, PURA. Sin red, sin reloj propio, sin Playwright: es lo que
 *  permite probar los casos de e2e/00-cupo-reporter.spec.ts sin
 *  deployment — y la MAYORÍA de ellos son el reporter CALLANDO, que es donde un test
 *  mal escrito pasa sin ejercitar nada. Por eso el silencio viaja con `motivo`.
 */
export function decidir(entrada: {
  t0: Foto;
  /** Foto en el PRIMER test que falla. `undefined` = no hubo fallos. */
  tf?: Foto;
  /** Foto en `onEnd`. `undefined` = no hubo fallos. */
  t1?: Foto;
  cuentasPassword: Map<string, string>;
  emailsSuite?: string[];
}): Decision {
  const emailsSuite = entrada.emailsSuite ?? CUENTAS_DE_LA_SUITE;
  if (entrada.tf === undefined && entrada.t1 === undefined) {
    return { aviso: null, motivo: "sin-fallos" };
  }
  // Fail-open: si falta CUALQUIERA de las tres fotos, se calla. No es exceso de
  // celo — es que sin `tf` no se puede saber si el cruce fue ANTES o DESPUÉS del
  // primer fallo, y decir "los fallos anteriores no son suyos" sin esa foto es
  // la atribución retroactiva que este reporter existe para no cometer.
  //
  // La condición anterior era `t0 === null || (tf == null && tf1 == null)`: con
  // UNA sola nula seguía adelante usando la otra. Y el fixture que la vigilaba
  // ponía las dos a null a la vez, o sea que probaba justo la combinación que el
  // código SÍ cubría. Un fixture escrito contra la implementación en vez de
  // contra el contrato comparte su punto ciego, porque sale de la misma cabeza.
  if (entrada.t0 === null || entrada.tf == null || entrada.t1 == null) {
    return { aviso: null, motivo: "sin-lectura" };
  }

  const inicio = clasificar(entrada.t0, entrada.cuentasPassword, emailsSuite);
  const enT0 = new Map(
    inicio.propias.map(({ fila, email }) => [
      email,
      isExhausted(fila, entrada.t0!.ahora),
    ]),
  );

  let ajena = false;
  let noPassword = false;

  // Se mira `tf` primero y `t1` después: el orden ES la distinción entre los
  // dos mensajes, no un detalle de implementación.
  for (const [etiqueta, foto] of [
    ["cruce-antes-del-primer-fallo", entrada.tf],
    ["cruce-despues-del-primer-fallo", entrada.t1],
  ] as const) {
    if (foto == null) continue;
    const c = clasificar(foto, entrada.cuentasPassword, emailsSuite);
    ajena = ajena || c.habiaPasswordAjena;
    noPassword = noPassword || c.habiaNoPassword;
    for (const { fila, email } of c.propias) {
      if (!isExhausted(fila, foto.ahora)) continue;
      // SIN FILA EN `t0` = CUPO INTACTO, no "dato ausente". Y no es un caso
      // raro: es el NORMAL. `resetSignInRateLimit` BORRA la fila al entrar bien
      // (retrieveAccountWithCredentials.ts:59), y `globalSetup` entra bien justo
      // antes del `onBegin` — así que lo habitual es que en `t0` no haya fila.
      // Lo encontró el control real: los fixtures siempre traían fila y el
      // mensaje salió con "quedaban NaN intentos".
      const restantesT0 = inicio.propias.find((p) => p.email === email);
      const quedabanT0 =
        restantesT0 === undefined
          ? MAX_FAILED_ATTEMPTS_PER_HOUR
          : effectiveAttemptsLeft(restantesT0.fila, entrada.t0!.ahora);

      if (enT0.get(email) === true) {
        return {
          aviso:
            `[e2e] el cupo de login de ${email} YA ESTABA AGOTADO al arrancar. ` +
            `Último intento fallido registrado: ${horaLegible(fila.lastAttemptTime)} ` +
            `(hora observada). Ese caso lo avisa scripts/check-e2e-preconditions.mjs ` +
            `antes del runner; si llegaste hasta aquí, esa comprobación no corrió. ` +
            `Mira tus credenciales o restos de tu corrida anterior.`,
          caso: "llego-agotado",
        };
      }

      const cabecera =
        etiqueta === "cruce-antes-del-primer-fallo"
          ? `[e2e] desde el PRIMER fallo, el cupo de login de ${email} ya estaba agotado.`
          : `[e2e] el cupo de login de ${email} se cruzó DESPUÉS del primer fallo: ` +
            `los fallos anteriores NO son suyos; los posteriores pueden serlo.`;

      return {
        aviso:
          `${cabecera} Al arrancar quedaban ${quedabanT0.toFixed(1)} intentos. ` +
          `${MENSAJE_PREMISA} Último intento fallido registrado: ` +
          `${horaLegible(fila.lastAttemptTime)} (hora observada, no la del cruce: ` +
          `el cruce ocurrió en ese instante o antes). ` +
          `Qué hacer: esperar unos minutos o preguntar en el equipo. ` +
          `NO revises tus credenciales: no son la causa.`,
        caso: etiqueta,
      };
    }
  }

  if (noPassword) return { aviso: null, motivo: "no-es-cuenta-password" };
  if (ajena) return { aviso: null, motivo: "cuenta-password-ajena-a-la-suite" };

  // Alguien consumió pero nadie cruzó `< 1`. ESTE es el caso que la ronda 1 de
  // AIT-110 anunciaba como "el cupo se agotó": con 10 intentos, un solo login
  // fallido ajeno lo habría disparado. Consumir no es agotar.
  const huboConsumo = [entrada.tf, entrada.t1].some(
    (foto) =>
      foto != null &&
      clasificar(foto, entrada.cuentasPassword, emailsSuite).propias.some(
        ({ fila, email }) => {
          const antes = inicio.propias.find((p) => p.email === email);
          return (
            antes !== undefined &&
            effectiveAttemptsLeft(fila, foto.ahora) <
              effectiveAttemptsLeft(antes.fila, entrada.t0!.ahora) - 0.001
          );
        },
      ),
  );
  return { aviso: null, motivo: huboConsumo ? "consumo-parcial" : "sin-consumo" };
}

async function leerFoto(): Promise<Foto> {
  const filas = (await readRateLimitsFromConvex()) as Fila[];
  return { filas, ahora: Date.now() };
}

/** Lo que el reporter necesita del mundo. Inyectable por la misma razón que en
 *  `scripts/check-e2e-preconditions.mjs`: sin esto, los casos de "la lectura
 *  rechaza" y "en verde se hace UNA sola lectura" no se pueden ejercitar, y un
 *  test que no puede fallar es un verde que no informa. En producción se usan
 *  los valores por defecto; Playwright construye el reporter sin argumentos. */
export type Dependencias = {
  leer: () => Promise<Foto>;
  leerCuentas: () => Promise<Map<string, string>>;
};

export default class RateLimitReporter implements Reporter {
  private readonly dep: Dependencias;
  /** Cuántas lecturas del cupo se han hecho. Observable a propósito: es lo que
   *  permite afirmar "en una corrida verde se hace UNA sola lectura" en vez de
   *  suponerlo. */
  public lecturas = 0;

  constructor(dep?: Partial<Dependencias>) {
    this.dep = {
      leer: dep?.leer ?? leerFoto,
      leerCuentas: dep?.leerCuentas ?? readPasswordAccountsFromConvex,
    };
  }

  private foto(): Promise<Foto> {
    this.lecturas += 1;
    return this.dep.leer().catch(() => null);
  }

  // Las TRES lecturas llevan el manejador enganchado AL CREAR la promesa, no al
  // consumirla: en una corrida verde nadie espera `t0`, y un rechazo sin
  // manejador rompe las dos promesas de este reporter a la vez ("ni una línea"
  // y "no aborta").
  private t0: Promise<Foto> = Promise.resolve(null);
  private tf: Promise<Foto> | undefined;
  private t1: Promise<Foto> | undefined;
  private cuentas: Promise<Map<string, string>> = Promise.resolve(new Map());

  onBegin(): void {
    this.t0 = this.foto();
    // `authAccounts` no cambia durante la corrida: se lee una sola vez. Se usa
    // el helper del proyecto y no una lectura propia porque esa tabla lleva la
    // columna `secret`: ese helper retiene solo `_id -> email` EN EL MISMO PASO
    // en que parsea (incidente 2026-08-21).
    this.cuentas = this.dep
      .leerCuentas()
      .catch(() => new Map<string, string>());
  }

  onTestEnd(_test: TestCase, result: TestResult): void {
    // ⚠️ NO BORRAR ESTA FOTO POR PARECER INÚTIL. `tf` no sirve para detectar
    // nada: sirve para NO DECIR algo. Es lo único que distingue "el cupo ya
    // estaba cruzado cuando falló el primero" de "se cruzó después", y sin esa
    // distinción el aviso atribuiría al limitador fallos que no son suyos —
    // mandando a quien lo lea al sitio equivocado, que es el defecto que esta
    // tarea existe para evitar.
    if (this.tf !== undefined) return; // solo en el PRIMER fallo
    if (result.status === "passed" || result.status === "skipped") return;
    this.tf = this.foto();
  }

  async onEnd(): Promise<void> {
    if (this.tf === undefined) return; // sin fallos: ni una lectura más, ni una línea
    this.t1 = this.foto();
    const decision = decidir({
      t0: await this.t0,
      tf: await this.tf,
      t1: await this.t1,
      cuentasPassword: await this.cuentas,
    });
    if (decision.aviso !== null) console.log(`\n${decision.aviso}\n`);
  }
}

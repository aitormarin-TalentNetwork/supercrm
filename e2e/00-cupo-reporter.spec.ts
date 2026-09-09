import { test, expect } from "@playwright/test";
import RateLimitReporter, {
  decidir,
  type Fila,
  type Foto,
} from "./rate-limit-reporter";

// AIT-110 — la matriz del reporter del cupo de login.
//
// Son pruebas UNITARIAS de una función pura: no abren navegador, no tocan
// Convex y no consumen cupo. Van aquí, como `00-phone.spec.ts` y
// `00-customerValidation.spec.ts`, porque el proyecto no tiene runner de tests
// unitarios (AIT-109) y el de Playwright las corre igual de bien.
//
// LA MAYORÍA DE LOS CASOS SON EL REPORTER CALLANDO, y ahí está la trampa: un
// test de "no dice nada" pasa sin ejercitar nada. Por eso `decidir` devuelve el
// silencio CON MOTIVO, y estas pruebas afirman el motivo — que solo se puede
// producir ejecutando la rama correcta.

const AHORA = 1_700_000_000_000;
const HORA = 60 * 60 * 1000;

const CUENTA_MARTA = "acc_marta";
const CUENTA_CARLOS = "acc_carlos";
const CUENTA_AJENA = "acc_ait52";

const CUENTAS = new Map([
  [CUENTA_MARTA, "marta@supercrm.es"],
  [CUENTA_CARLOS, "carlos@supercrm.es"],
  [CUENTA_AJENA, "ait52-test-sales@supercrm.es"],
]);

/** `attemptsLeft` se guarda junto a `lastAttemptTime` y el cubo se rellena solo,
 *  así que una fila solo significa algo con su hora. `hace` evita el error de
 *  fabricar filas "de ahora mismo" sin querer. */
function fila(attemptsLeft: number, haceMs = 0, identifier = CUENTA_MARTA): Fila {
  return { identifier, attemptsLeft, lastAttemptTime: AHORA - haceMs };
}
function foto(filas: Fila[], ahora = AHORA): Foto {
  return { filas, ahora };
}

test.describe("AIT-110 · decisión del reporter del cupo", () => {
  test("1 · sin fallos: calla", () => {
    const d = decidir({ t0: foto([fila(10)]), cuentasPassword: CUENTAS });
    expect(d).toEqual({ aviso: null, motivo: "sin-fallos" });
  });

  test("2 · con fallos y sin consumo: calla", () => {
    const f = foto([fila(10)]);
    const d = decidir({ t0: f, tf: f, t1: f, cuentasPassword: CUENTAS });
    expect(d).toEqual({ aviso: null, motivo: "sin-consumo" });
  });

  test("3 · consumo PARCIAL sin cruzar el umbral: calla", () => {
    // El caso que la ronda 1 anunciaba como "el cupo se agotó": bajar de 10 a 9
    // es que alguien consumió, no que nadie pueda entrar.
    const d = decidir({
      t0: foto([fila(10)]),
      tf: foto([fila(9)]),
      t1: foto([fila(9)]),
      cuentasPassword: CUENTAS,
    });
    expect(d).toEqual({ aviso: null, motivo: "consumo-parcial" });
  });

  test("4 · transición ya presente en el primer fallo: avisa, sin culpar a ese fallo", () => {
    const d = decidir({
      t0: foto([fila(10)]),
      tf: foto([fila(0)]),
      t1: foto([fila(0)]),
      cuentasPassword: CUENTAS,
    });
    if (d.aviso === null) throw new Error(`esperaba aviso, motivo=${d.motivo}`);
    expect(d.caso).toBe("cruce-antes-del-primer-fallo");
    expect(d.aviso).toContain("marta@supercrm.es");
    expect(d.aviso).toContain("desde el PRIMER fallo");
    // No debe afirmar que el cupo causara los fallos.
    expect(d.aviso).not.toContain("tumbó");
    // Lleva su premisa dentro, para quien añada un test con login.
    expect(d.aviso).toContain("no hace logins después del arranque");
    expect(d.aviso).toContain("NO revises tus credenciales");
  });

  test("5 · ya agotado al llegar: otro caso y otro remedio", () => {
    const d = decidir({
      t0: foto([fila(0)]),
      tf: foto([fila(0)]),
      t1: foto([fila(0)]),
      cuentasPassword: CUENTAS,
    });
    if (d.aviso === null) throw new Error(`esperaba aviso, motivo=${d.motivo}`);
    expect(d.caso).toBe("llego-agotado");
    expect(d.aviso).toContain("check-e2e-preconditions");
    // El dato observado que sostiene la hora va en LOS TRES avisos, y el que más
    // lo necesita es justo éste: "ya estaba agotado cuando llegaste".
    expect(d.aviso).toContain("Último intento fallido registrado:");
    // Éste SÍ manda a mirar las credenciales; el otro no. Es la distinción.
    expect(d.aviso).toContain("credenciales");
  });

  test("6 · fila agotada del camino OTP/reset: calla", () => {
    // Su identificador es `email ?? phone`, no un `_id` de authAccounts. No se
    // clasifica por la FORMA (un teléfono no lleva "@"): se cruza con la tabla.
    const otp = fila(0, 0, "alguien@supercrm.es");
    const d = decidir({
      t0: foto([fila(10), otp]),
      tf: foto([fila(10), otp]),
      t1: foto([fila(10), otp]),
      cuentasPassword: CUENTAS,
    });
    expect(d).toEqual({ aviso: null, motivo: "no-es-cuenta-password" });
  });

  test("7 · la PRIMERA lectura rechaza: calla y no revienta", () => {
    const d = decidir({
      t0: null,
      tf: foto([fila(0)]),
      t1: foto([fila(0)]),
      cuentasPassword: CUENTAS,
    });
    expect(d).toEqual({ aviso: null, motivo: "sin-lectura" });
  });

  test("8a · las DOS lecturas posteriores rechazan: calla", () => {
    const d = decidir({
      t0: foto([fila(10)]),
      tf: null,
      t1: null,
      cuentasPassword: CUENTAS,
    });
    expect(d).toEqual({ aviso: null, motivo: "sin-lectura" });
  });

  // 8b y 8c son las combinaciones que el caso 8 original NO probaba: ponía las
  // dos fotos a `null` A LA VEZ, que es justo lo que el código sí cubría. Un
  // fixture escrito contra la implementación comparte su punto ciego.
  test("8b · SOLO tf rechaza, y t1 muestra agotado: calla (no se puede situar el cruce)", () => {
    // Sin `tf` no hay forma de saber si el cruce fue antes o después del primer
    // fallo. Decir "los anteriores no son suyos" aquí sería inventarlo.
    const d = decidir({
      t0: foto([fila(10)]),
      tf: null,
      t1: foto([fila(0)]),
      cuentasPassword: CUENTAS,
    });
    expect(d).toEqual({ aviso: null, motivo: "sin-lectura" });
  });

  test("8c · SOLO t1 rechaza, con tf agotado: calla", () => {
    const d = decidir({
      t0: foto([fila(10)]),
      tf: foto([fila(0)]),
      t1: null,
      cuentasPassword: CUENTAS,
    });
    expect(d).toEqual({ aviso: null, motivo: "sin-lectura" });
  });

  test("9 · transición SOLO entre tf y t1: avisa, y NO culpa a los fallos anteriores", () => {
    // Este es el caso que la implementación de la ronda 2 se habría comido: allí
    // la condición solo miraba t0 -> tf, y aquí tf está sano.
    const d = decidir({
      t0: foto([fila(10)]),
      tf: foto([fila(8)]),
      t1: foto([fila(0)]),
      cuentasPassword: CUENTAS,
    });
    if (d.aviso === null) throw new Error(`esperaba aviso, motivo=${d.motivo}`);
    expect(d.caso).toBe("cruce-despues-del-primer-fallo");
    expect(d.aviso).toContain("DESPUÉS del primer fallo");
    expect(d.aviso).toContain("los fallos anteriores NO son suyos");
  });

  test("10 · el relleno cuenta: una fila vieja con 0 ya NO está agotada", () => {
    // 0 intentos hace una hora son 10 hoy. Leer el campo crudo daría una alarma
    // falsa, y ese es el motivo de que la fórmula se importe en vez de copiarse.
    const d = decidir({
      t0: foto([fila(10)]),
      tf: foto([fila(0, HORA)]),
      t1: foto([fila(0, HORA)]),
      cuentasPassword: CUENTAS,
    });
    expect(d.aviso).toBeNull();
  });

  test("11 · cuenta password que NO es de la suite: calla", () => {
    // En este deployment hay NUEVE cuentas password, no dos. Que otra terminal
    // agote una de las de prueba de AIT-52 no explica ningún fallo de esta suite.
    const d = decidir({
      t0: foto([fila(10), fila(10, 0, CUENTA_AJENA)]),
      tf: foto([fila(10), fila(0, 0, CUENTA_AJENA)]),
      t1: foto([fila(10), fila(0, 0, CUENTA_AJENA)]),
      cuentasPassword: CUENTAS,
    });
    expect(d).toEqual({ aviso: null, motivo: "cuenta-password-ajena-a-la-suite" });
  });

  test("14 · sin fila en t0 (el caso NORMAL): cupo intacto, no dato ausente", () => {
    // Lo encontró el control real, no la matriz: `resetSignInRateLimit` BORRA la
    // fila al entrar bien, y `globalSetup` entra bien justo antes del `onBegin`.
    // Así que lo habitual es que en `t0` NO haya fila. Mis fixtures siempre
    // traían una, y el mensaje real salió con "quedaban NaN intentos".
    const d = decidir({
      t0: foto([]),
      tf: foto([fila(0)]),
      t1: foto([fila(0)]),
      cuentasPassword: CUENTAS,
    });
    if (d.aviso === null) throw new Error(`esperaba aviso, motivo=${d.motivo}`);
    expect(d.aviso).toContain("quedaban 10.0 intentos");
    expect(d.aviso).not.toContain("NaN");
  });
});

test.describe("AIT-110 · el reporter como envoltura", () => {
  test("12 · corrida verde: UNA sola lectura y ni una línea", async () => {
    const r = new RateLimitReporter({
      leer: async () => foto([fila(10)]),
      leerCuentas: async () => CUENTAS,
    });
    r.onBegin();
    await r.onEnd();
    expect(r.lecturas).toBe(1); // solo t0: ni tf ni t1
  });

  test("13 · una lectura que rechaza no tumba la corrida", async () => {
    const r = new RateLimitReporter({
      leer: async () => {
        throw new Error("lectura fallida");
      },
      leerCuentas: async () => {
        throw new Error("lectura fallida");
      },
    });
    r.onBegin();
    // @ts-expect-error — se le pasa lo mínimo que usa: el estado del resultado.
    r.onTestEnd({}, { status: "failed" });
    await expect(r.onEnd()).resolves.toBeUndefined();
  });
});

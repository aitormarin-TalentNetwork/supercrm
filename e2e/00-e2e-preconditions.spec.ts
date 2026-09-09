import { test, expect } from "@playwright/test";
import {
  MAX_FAILED_ATTEMPTS_PER_HOUR,
  SUPPORTED_AUTH_VERSION,
  effectiveAttemptsLeft,
  isExhausted,
  selectBlockedPasswordAccounts,
  installedAuthVersion,
  readTable,
  readPasswordAccountsFromConvex,
  run,
} from "../scripts/check-e2e-preconditions.mjs";

// AIT-103 — pruebas de la precondición del límite de intentos de login.
// Sobre funciones puras y con lecturas inyectadas, mismo patrón que
// 00-phone.spec.ts y 00-customerValidation.spec.ts: no tocan el navegador ni el
// deployment. Y tienen que ser así: contra un Convex real no hay forma de
// provocar un JSON malformado ni una excepción posterior a la lectura, que son
// justo los estados donde puede escaparse un secreto.

const AHORA = 1_800_000_000_000;

/** Fila con un valor efectivo EXACTO: sin tiempo transcurrido, no hay recarga. */
function filaCon(efectivo: number, identifier: string) {
  return { identifier, attemptsLeft: efectivo, lastAttemptTime: AHORA };
}

test.describe("El cubo del limitador se rellena con el tiempo", () => {
  test("el valor guardado NO es el vigente: una fila vieja se ha recuperado sola", () => {
    // La fila real del Integrador: 0.21 intentos hace 52 minutos.
    const fila = { identifier: "x", attemptsLeft: 0.21, lastAttemptTime: AHORA - 52 * 60_000 };
    expect(fila.attemptsLeft).toBeLessThan(1); // leído crudo, diría "bloqueada"
    expect(effectiveAttemptsLeft(fila, AHORA)).toBeCloseTo(8.88, 1);
    expect(isExhausted(fila, AHORA)).toBe(false); // y no lo está
  });

  test("nunca supera el máximo por mucho tiempo que pase", () => {
    const fila = { identifier: "x", attemptsLeft: 9, lastAttemptTime: AHORA - 10 * 3_600_000 };
    expect(effectiveAttemptsLeft(fila, AHORA)).toBe(MAX_FAILED_ATTEMPTS_PER_HOUR);
  });

  test("el umbral es `< 1`, no `<= 0` — la frontera que se pierde al replicar", () => {
    expect(isExhausted(filaCon(0, "x"), AHORA)).toBe(true);
    expect(isExhausted(filaCon(0.999, "x"), AHORA)).toBe(true);
    expect(isExhausted(filaCon(1, "x"), AHORA)).toBe(false);
    expect(isExhausted(filaCon(1.001, "x"), AHORA)).toBe(false);
  });

  test("la versión de la librería replicada está fijada", () => {
    expect(
      installedAuthVersion(),
      "si sube la versión, hay que revisar la réplica de la fórmula del limitador",
    ).toBe(SUPPORTED_AUTH_VERSION);
  });
});

test.describe("Solo aborta el camino de credenciales que usa la suite", () => {
  // El identificador del camino OTP es `email ?? phone` (verifyCodeAndSignIn.ts:42).
  // Clasificar por la forma —`includes("@")`— tomaba un TELÉFONO por una cuenta de
  // contraseña y abortaba una corrida sana. Se determina por pertenencia al mapa.
  const ID_CUENTA = "j979b36zgwhwc4h57n73sa5b6n8d7yd2";
  const cuentas = new Map([[ID_CUENTA, "carlos@supercrm.es"]]);

  test("una fila de contraseña agotada SÍ se selecciona (control positivo)", () => {
    const sel = selectBlockedPasswordAccounts([filaCon(0, ID_CUENTA)], cuentas, AHORA);
    expect(sel).toHaveLength(1);
    expect(sel[0].email).toBe("carlos@supercrm.es");
  });

  test("una fila OTP con EMAIL agotada no se selecciona", () => {
    expect(
      selectBlockedPasswordAccounts([filaCon(0, "marta@supercrm.es")], cuentas, AHORA),
    ).toHaveLength(0);
  });

  test("una fila OTP con TELÉFONO agotada no se selecciona (el fallo de la ronda 2)", () => {
    expect(
      selectBlockedPasswordAccounts([filaCon(0, "+34600123456")], cuentas, AHORA),
    ).toHaveLength(0);
  });

  test("un id que no está entre las cuentas de contraseña no se selecciona", () => {
    expect(
      selectBlockedPasswordAccounts([filaCon(0, "otroid0000000000000000000000000")], cuentas, AHORA),
    ).toHaveLength(0);
  });

  test("una cuenta de contraseña NO agotada no se selecciona", () => {
    expect(selectBlockedPasswordAccounts([filaCon(5, ID_CUENTA)], cuentas, AHORA), ).toHaveLength(0);
  });
});

test.describe("El secreto no sale por ninguna salida, ni cuando algo revienta", () => {
  const CANARIO = "CANARIO-NO-DEBE-SALIR-a7f3";

  /** Captura las DOS salidas y las devuelve por separado y juntas. */
  function captura() {
    const out: string[] = [];
    const err: string[] = [];
    return {
      out: (l: string) => out.push(String(l)),
      err: (l: string) => err.push(String(l)),
      get stdout() { return out.join("\n"); },
      get stderr() { return err.join("\n"); },
      get ambas() { return [...out, ...err].join("\n"); },
    };
  }

  const opciones = (extra: Record<string, unknown>) => ({
    now: AHORA,
    deployment: "dev:pruebas",
    version: () => SUPPORTED_AUTH_VERSION,
    readRateLimits: async () => [],
    readPasswordAccounts: async () => new Map(),
    ...extra,
  });

  test("JSON malformado con el canario dentro", async () => {
    const c = captura();
    const code = await run(
      opciones({
        out: c.out,
        err: c.err,
        readPasswordAccounts: async () => {
          // El búfer con el secreto ya está en memoria y el parseo revienta.
          JSON.parse(`[{"secret":"${CANARIO}"`);
          return new Map();
        },
      }),
    );
    expect(code).toBe(0);
    expect(c.stdout).not.toContain(CANARIO);
    expect(c.stderr).not.toContain(CANARIO);
    expect(c.ambas).not.toContain(CANARIO);
  });

  test("el subproceso falla y trae el canario en stdout y en stderr", async () => {
    const c = captura();
    const fallo = Object.assign(new Error(`salió mal: ${CANARIO}`), {
      stdout: `[{"secret":"${CANARIO}"}]`,
      stderr: `error: ${CANARIO}`,
    });
    const code = await run(
      opciones({ out: c.out, err: c.err, readPasswordAccounts: async () => { throw fallo; } }),
    );
    expect(code).toBe(0);
    expect(c.stdout).not.toContain(CANARIO);
    expect(c.stderr).not.toContain(CANARIO);
    expect(c.ambas).not.toContain(CANARIO);
  });

  test("excepción INESPERADA después de leer, con los datos ya en memoria", async () => {
    const c = captura();
    const mapaVenenoso = {
      get() { throw new Error(`fallo tardío con ${CANARIO}`); },
    } as unknown as Map<string, string>;
    const code = await run(
      opciones({
        out: c.out,
        err: c.err,
        readRateLimits: async () => [filaCon(0, "cualquiera")],
        readPasswordAccounts: async () => mapaVenenoso,
      }),
    );
    expect(code).toBe(0);
    expect(c.ambas).not.toContain(CANARIO);
  });

  test("el fallo REAL de execFile: su error trae stdout y stderr, y no sale nada", async () => {
    // LA FRONTERA QUE IMPONE EL SISTEMA, no la que escribí yo. Las otras pruebas
    // inyectan el fallo en `run()` y NO atraviesan `readTable()`, que es
    // justamente donde el objeto rechazado por `execFile` incorpora `stdout` y
    // `stderr` — el caso de un `spawn` que falla antes de arrancar o de un
    // desbordamiento de `maxBuffer`.
    const execQueFalla = async () => {
      throw Object.assign(new Error(`spawn falló: ${CANARIO}`), {
        code: "ENOENT",
        stdout: `[{"secret":"${CANARIO}"}]`,
        stderr: `stderr con ${CANARIO}`,
      });
    };

    // 1) lo que `readTable` deja escapar: nada.
    const error = await readTable("authAccounts", execQueFalla).then(
      () => null,
      (e: unknown) => e as Error & { stdout?: string; stderr?: string },
    );
    expect(error).not.toBeNull();
    expect(JSON.stringify({ m: error!.message, s: error!.stack })).not.toContain(CANARIO);
    expect(error!.stdout).toBeUndefined();
    expect(error!.stderr).toBeUndefined();

    // 2) y el recorrido entero, con el lector REAL enchufado a ese exec.
    const c = captura();
    const code = await run(
      opciones({
        out: c.out,
        err: c.err,
        readPasswordAccounts: () => readPasswordAccountsFromConvex(execQueFalla),
      }),
    );
    expect(code).toBe(0);
    expect(c.stdout).not.toContain(CANARIO);
    expect(c.stderr).not.toContain(CANARIO);
    expect(c.ambas).not.toContain(CANARIO);
  });

  test("y el subproceso falla DE VERDAD: el binario no existe", async () => {
    // Control positivo del mecanismo anterior: demuestra que un fallo auténtico
    // de `execFile` —no uno fabricado— acaba en el mismo `catch`. Sin esto, la
    // prueba de arriba solo demuestra que mi función maneja mi propio doble.
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const real = promisify(execFile);
    const error = await readTable("authAccounts", (_file, args, options) =>
      real("binario-que-no-existe-a7f3", args, options),
    ).then(() => null, (e: unknown) => e as Error);
    expect(error).not.toBeNull();
    expect(error!.message).toBe("lectura fallida");
  });

  test("CONTROL POSITIVO: si el canario llegara a la salida, estas pruebas lo verían", async () => {
    // Sin esto, los tres verdes de arriba no distinguen "no se escapa" de
    // "estoy mirando donde nunca aparecería nada".
    const c = captura();
    const ID = "id00000000000000000000000000000";
    const code = await run(
      opciones({
        out: c.out,
        err: c.err,
        readRateLimits: async () => [filaCon(0, ID)],
        readPasswordAccounts: async () => new Map([[ID, CANARIO]]),
      }),
    );
    expect(code).toBe(1);
    expect(c.stdout).toContain(CANARIO);
    expect(c.ambas).toContain(CANARIO);
  });
});

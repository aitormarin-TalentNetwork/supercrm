import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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
  problemasDelEnvLocal,
  urlsEsperadas,
  valorDeClave,
} from "../scripts/check-e2e-preconditions.mjs";
import { problemasDeLaProhibicion } from "../scripts/check-prohibicion-por-mecanismo.mjs";
import { readEnvLocal } from "../scripts/check-e2e-preconditions.mjs";

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
    // AIT-109 · LA PUERTA AIT-95, NEUTRALIZADA A PROPÓSITO Y SIN SALIR DEL PROCESO.
    // `run()` comprueba lo primero de todo que el backend tenga las funciones que
    // el código espera, y sus valores por defecto son los REALES: `readSources`
    // recorre `convex/` en disco y `readDeployed` lanza `npx convex function-spec`
    // contra el deployment. Estas cinco pruebas no miden esa puerta —miden que el
    // secreto no se escape por ninguna salida— pero tenían que atravesarla, así que
    // consultaban Convex de verdad. Con el deployment inaccesible fallaban las
    // cinco, que es justo el escenario que AIT-109 promete que funciona.
    // Los dos vacíos van EN PAREJA y el orden importa: `selectMissingFunctions`
    // devuelve lo que está en el código y no desplegado, así que vaciar solo
    // `readDeployed` haría faltar las 28 funciones reales y `run()` saldría con 1
    // antes de llegar a lo que se prueba. Vaciando los dos, `faltan` es [] y la
    // puerta pasa sin tocar disco ni red. Cualquier caso que quiera ejercitar la
    // puerta de verdad los sobreescribe: `...extra` va después.
    readSources: () => [],
    readDeployed: async () => [],
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

// ============================================================================
// AIT-123 — las CINCO ejecuciones de C5, y el control adversario de C6
// ============================================================================
// Estas pruebas son PURAS: `problemasDelEnvLocal` recibe el CONTENIDO del
// fichero, no una ruta, así que el daño se fabrica como cadena y no en disco.
// No es comodidad: es que una función que no recibe una ruta tampoco puede
// leer `process.env` por accidente, y esa precedencia es justo la trampa.

const D = "dev:X";
const SANO = [
  `CONVEX_DEPLOYMENT=${D}`,
  `NEXT_PUBLIC_CONVEX_URL=${urlsEsperadas("X").NEXT_PUBLIC_CONVEX_URL}`,
  `NEXT_PUBLIC_CONVEX_SITE_URL=${urlsEsperadas("X").NEXT_PUBLIC_CONVEX_SITE_URL}`,
  "",
].join("\n");

/** El daño VIEJO: la línea desaparece. Es el que describía la ficha original. */
const DANO_VIEJO = SANO.split("\n").filter((l) => !l.startsWith("CONVEX_DEPLOYMENT")).join("\n");

/** El daño NUEVO, rama URL. La variable SIGUE PRESENTE — por eso un comprobador
 *  de presencia lo aprueba, y por eso este caso existe. */
const REPUNTADA_URL = SANO.replace(
  "NEXT_PUBLIC_CONVEX_URL=https://X.convex.cloud",
  "NEXT_PUBLIC_CONVEX_URL=http://otro-destino:39123",
);

/** El daño NUEVO, rama SITE. Se prueba aparte de la rama URL y no "de paso":
 *  el CLI reescribe las DOS, y un caso que las junte puede dejar una sin
 *  ejecutar sin que nadie lo note. */
const REPUNTADA_SITE = SANO.replace(
  "NEXT_PUBLIC_CONVEX_SITE_URL=https://X.convex.site",
  "NEXT_PUBLIC_CONVEX_SITE_URL=http://otro-destino:39123",
);

test.describe("AIT-123 · C5 — el comprobador del .env.local, cinco ejecuciones", () => {
  test("1. fichero sano: no grita", () => {
    expect(problemasDelEnvLocal(SANO)).toHaveLength(0);
  });

  test("2. daño VIEJO (falta la línea): grita una vez", () => {
    const problemas = problemasDelEnvLocal(DANO_VIEJO);
    expect(problemas).toHaveLength(1);
    expect(problemas[0]).toContain("CONVEX_DEPLOYMENT");
  });

  test("2bis. la línea presente pero SIN VALOR también grita", () => {
    // Tercer estado del fichero, distinto de los otros dos: `CONVEX_DEPLOYMENT=`
    // existe y no dice nada. No está medido cuál de los dos deja cada camino, así
    // que el comprobador es ancho A PROPÓSITO — y la anchura no es una medición.
    const vacia = SANO.replace(`CONVEX_DEPLOYMENT=${D}`, "CONVEX_DEPLOYMENT=");
    expect(problemasDelEnvLocal(vacia)).toHaveLength(1);
  });

  test("3a. daño NUEVO, rama URL, CON EL ENTORNO POBLADO: grita igual", () => {
    // El entorno se puebla a propósito: es el estado en el que `deploymentName()`
    // —que lee `process.env` primero— daría VERDE sobre este mismo fichero.
    const previo = process.env.CONVEX_DEPLOYMENT;
    process.env.CONVEX_DEPLOYMENT = "dev:ENTORNO-QUE-NO-DEBE-CONTAR";
    try {
      const problemas = problemasDelEnvLocal(REPUNTADA_URL);
      expect(problemas).toHaveLength(1);
      expect(problemas[0]).toContain("NEXT_PUBLIC_CONVEX_URL");
    } finally {
      if (previo === undefined) delete process.env.CONVEX_DEPLOYMENT;
      else process.env.CONVEX_DEPLOYMENT = previo;
    }
  });

  test("3b. daño NUEVO, rama SITE, CON EL ENTORNO POBLADO: grita igual", () => {
    const previo = process.env.CONVEX_DEPLOYMENT;
    process.env.CONVEX_DEPLOYMENT = "dev:ENTORNO-QUE-NO-DEBE-CONTAR";
    try {
      const problemas = problemasDelEnvLocal(REPUNTADA_SITE);
      expect(problemas).toHaveLength(1);
      expect(problemas[0]).toContain("NEXT_PUBLIC_CONVEX_SITE_URL");
    } finally {
      if (previo === undefined) delete process.env.CONVEX_DEPLOYMENT;
      else process.env.CONVEX_DEPLOYMENT = previo;
    }
  });

  test("4. fichero sano CON EL ENTORNO POBLADO: sigue sin gritar", () => {
    // La otra mitad, y sin ella el criterio no vale: un comprobador que gritara
    // siempre pasaría los casos 2, 3a y 3b.
    const previo = process.env.CONVEX_DEPLOYMENT;
    process.env.CONVEX_DEPLOYMENT = "dev:ENTORNO-QUE-NO-DEBE-CONTAR";
    try {
      expect(problemasDelEnvLocal(SANO)).toHaveLength(0);
    } finally {
      if (previo === undefined) delete process.env.CONVEX_DEPLOYMENT;
      else process.env.CONVEX_DEPLOYMENT = previo;
    }
  });

  test("un self-hosted legítimo no se confunde con un fichero dañado", () => {
    // Límite declarado en el plan (R2). El propio CLI prohíbe tener las dos
    // configuraciones a la vez, así que la presencia de la self-hosted es la
    // señal de que no hay nombre del que derivar URLs.
    const selfHosted = [
      "CONVEX_SELF_HOSTED_URL=https://convex.interno.example",
      "CONVEX_SELF_HOSTED_ADMIN_KEY=loquesea",
      "",
    ].join("\n");
    expect(problemasDelEnvLocal(selfHosted)).toHaveLength(0);
  });

  test("valorDeClave distingue AUSENTE de PRESENTE-SIN-VALOR", () => {
    // Los dos se leen igual con un `grep -c` y son estados distintos del daño.
    expect(valorDeClave("OTRA=1\n", "CONVEX_DEPLOYMENT")).toBeNull();
    expect(valorDeClave("CONVEX_DEPLOYMENT=\n", "CONVEX_DEPLOYMENT")).toBe("");
  });
});

test.describe("AIT-123 · C6 — la prohibición documental, con su control adversario", () => {
  const REAL = readFileSync(path.join(process.cwd(), "docs", "03-setup.md"), "utf8");

  /** Redacción que prohíbe SOLO el flag, identificando bien subcomando y
   *  evidencia — o sea que SATISFACE C4. Es la que engañaría a un criterio que
   *  solo mire si la afirmación está bien documentada. */
  const ADVERSARIA = `
### Prohibido: \`npx convex dev --env-file\` desde un worktree (AIT-123)

**Está prohibido usar \`--env-file\` con \`npx convex dev\` desde un worktree.**
Subcomando afectado: \`convex dev\`. Evidencia: medido el 2026-09-10 contra convex
1.42.1 en un entorno desechable — borra \`CONVEX_DEPLOYMENT\` y repunta las dos
\`NEXT_PUBLIC_*\`. Para \`convex deploy\` no está medido (AIT-130).
`;

  test("la redacción REAL cumple C6", () => {
    expect(problemasDeLaProhibicion(REAL)).toHaveLength(0);
  });

  test("🔑 la redacción adversaria (solo el flag) SUSPENDE C6", () => {
    // Ésta es la prueba que cierra M9. Sin ella, C6 no distingue una prohibición
    // por mecanismo de una por flag — y una prohibición por flag SE PUEDE CUMPLIR
    // CAUSANDO EL DAÑO: medido, `--url` + `--admin-key` sin `--env-file` borra
    // y repunta exactamente igual.
    const problemas = problemasDeLaProhibicion(ADVERSARIA);
    expect(problemas.length).toBeGreaterThan(0);
    expect(problemas.join(" ")).toContain("MECANISMO");
  });

  test("la receta anterior no sobrevive en el documento", () => {
    expect(REAL).not.toContain("única forma de desplegar sin esa confirmación");
    expect(REAL).not.toContain("aísla el comando de la");
  });
});

// ============================================================================
// AIT-123 · los cuatro caminos a falso verde que encontró la auditoría de código
// ============================================================================
// Los cuatro eran lo mismo con cuatro caras: dos estados distintos produciendo el
// mismo valor, siempre hacia el lado tranquilizador. Cada uno tiene aquí el caso
// que lo habría cazado.

test.describe("AIT-123 · B1 — C6 comprueba el ÁMBITO, no la presencia", () => {
  const MECA = "resuelva el deployment **POR URL + ADMIN KEY en vez de POR NOMBRE**";
  const MARCA = "Formas conocidas — son **ejemplos, no la definición**:";

  test("🔑 el adversario MIXTO suspende: conserva mecanismo y marca, y define por flag DESPUÉS", () => {
    // Éste es B1. La primera versión de C6 comprobaba que la frase del mecanismo
    // y la marca ESTUVIERAN, en cualquier sitio — así que un documento podía
    // conservarlas y añadir después una norma por flag. El comprobador que cierra
    // M9 tenía dentro el agujero de M9.
    const mixto = [
      "### Prohibido: resolver por URL+admin key",
      `**Está prohibido cualquier invocación que ${MECA}.**`,
      "",
      MARCA,
      "",
      "- `--env-file` con vars self-hosted",
      "- `--url` + `--admin-key`",
      "",
      "En la práctica: **está prohibido `--env-file`**; `--url` y `--admin-key` están permitidos.",
    ].join("\n");
    const problemas = problemasDeLaProhibicion(mixto);
    expect(problemas.length).toBeGreaterThan(0);
    expect(problemas.join(" ")).toContain("fuera del bloque de ejemplos");
  });

  test("el adversario PURO (solo el flag) sigue suspendiendo", () => {
    const puro = "**Está prohibido usar `--env-file` con `convex dev`.** Evidencia: medido 2026-09-10.";
    expect(problemasDeLaProhibicion(puro).length).toBeGreaterThan(0);
  });

  test("los flags DENTRO del bloque de ejemplos no suspenden (control en la otra dirección)", () => {
    // Sin esta mitad, C6 podría estar rechazando cualquier documento que nombre
    // un flag, y entonces su rojo no significaría nada.
    const bueno = [
      `**Está prohibido cualquier invocación que ${MECA}.**`,
      "",
      MARCA,
      "",
      "- `--env-file` con vars self-hosted",
      "- `--url` + `--admin-key`, sin `--env-file` por ninguna parte",
    ].join("\n");
    expect(problemasDeLaProhibicion(bueno)).toHaveLength(0);
  });
});

test.describe("AIT-123 · B4 — el self-hosted se reconoce por COHERENCIA", () => {
  test("🔑 self-hosted + CONVEX_DEPLOYMENT + URLs repuntadas NO se acepta", () => {
    // Éste es B4. La excepción que cerraba el límite R2 con dos líneas abría un
    // bypass del gate entero: bastaba una clave self-hosted para saltarse toda la
    // validación. Que el CLI no genere normalmente esa combinación no convierte un
    // fichero contradictorio en sano — y contradictorio es justo lo que deja una
    // herramienta a medio camino.
    const bypass = [
      "CONVEX_SELF_HOSTED_URL=https://interno.example",
      "CONVEX_SELF_HOSTED_ADMIN_KEY=k",
      "CONVEX_DEPLOYMENT=dev:X",
      "NEXT_PUBLIC_CONVEX_URL=http://otro-destino",
      "NEXT_PUBLIC_CONVEX_SITE_URL=http://otro-destino",
    ].join("\n");
    expect(problemasDelEnvLocal(bypass).length).toBeGreaterThan(0);
  });

  test("un self-hosted legítimo (sus dos campos, sin config Cloud) sigue sin gritar", () => {
    const legit = "CONVEX_SELF_HOSTED_URL=https://interno.example\nCONVEX_SELF_HOSTED_ADMIN_KEY=k\n";
    expect(problemasDelEnvLocal(legit)).toHaveLength(0);
  });

  test("un self-hosted a medias (falta un campo obligatorio) grita", () => {
    expect(problemasDelEnvLocal("CONVEX_SELF_HOSTED_URL=https://interno.example\n").length).toBeGreaterThan(0);
  });
});

test.describe("AIT-123 · B3 — la lectura falla CERRADA", () => {
  test("un fichero ausente sigue devolviendo null (ENOENT no es el daño)", () => {
    expect(readEnvLocal(path.join(os.tmpdir(), `ait123-no-existe-${Date.now()}`))).toBeNull();
  });

  test("🔑 cualquier OTRO error se propaga en vez de convertirse en «no hay nada que comprobar»", () => {
    // Éste es B3. `catch { return null }` tragaba permisos, EIO y un directorio en
    // lugar de un fichero, y los dos consumidores lo trataban igual que «CI sin
    // fichero»: la suite seguía y medía contra un backend no verificado.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ait123-b3-"));
    fs.mkdirSync(path.join(dir, ".env.local"));
    try {
      expect(() => readEnvLocal(dir)).toThrow(/EISDIR|EACCES|illegal/i);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test("y el consumidor NO continúa: run() devuelve 1 con mensaje propio", async () => {
    const errores: string[] = [];
    const codigo = await run({
      leerEnvLocal: () => {
        const e: NodeJS.ErrnoException = new Error("EIO simulado");
        e.code = "EIO";
        throw e;
      },
      out: () => {},
      err: (l: string) => errores.push(l),
      readSources: () => [],
      readDeployed: async () => new Set(),
      readRateLimits: async () => [],
      readPasswordAccounts: async () => new Map(),
    });
    expect(codigo).toBe(1);
    expect(errores.join(" ")).toContain("NO COMPROBABLE");
  });
});

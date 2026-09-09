import { test, expect } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  COOKIE_JWT,
  COOKIE_REFRESH,
  problemaDeInstantanea,
  readState,
  statePath,
  writeStateAtomically,
  type StorageState,
} from "./authState";

// AIT-119 — la instantánea de sesión se envenenaba sola y el veneno se
// reescribía en cada corrida con varios tests.
//
// *** TODAS ESTAS PRUEBAS ESCRIBEN EN UN DIRECTORIO TEMPORAL. ***
// Nunca en `e2e/.auth/`. No es higiene: la primera versión de este fichero las
// hacía sobre la ruta real, y con el prefijo `00-` se habrían ejecutado ANTES
// que los flujos — o sea que la prueba del arreglo habría producido el defecto
// que el arreglo impide, y a todos. Por eso las tres funciones aceptan
// directorio: no se le pide a la prueba que se porte bien, se le quita la
// posibilidad de portarse mal.

/** Directorio temporal que se retira al acabar la prueba. Lo de retirarlo no es
 *  estética: hoy mismo se han limpiado 17 procesos huérfanos, y la forma es la
 *  misma — algo que se crea y nadie recoge. Un test que deja basura la deja en
 *  cada corrida. */
const temporales: string[] = [];
function dirTemporal() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ait119-"));
  temporales.push(dir);
  return dir;
}
test.afterEach(() => {
  while (temporales.length > 0) {
    fs.rmSync(temporales.pop()!, { recursive: true, force: true });
  }
});

const COOKIE_BASE = {
  domain: "localhost",
  path: "/",
  expires: -1,
  httpOnly: true,
  secure: false,
  sameSite: "Lax" as const,
};

function estado(cookies: Array<{ name: string; value: string }>): StorageState {
  return {
    cookies: cookies.map((c) => ({ ...COOKIE_BASE, ...c })),
    origins: [],
  };
}

const VALIDO = estado([
  { name: COOKIE_JWT, value: "jwt-de-prueba" },
  { name: COOKIE_REFRESH, value: "refresh-de-prueba" },
]);

/** El fichero REAL que T1 capturó de su corrida envenenada, empotrado tal cual.
 *  No lleva secretos: cero cookies y una marca de tiempo. Va aquí y no como
 *  ruta a /tmp para que la prueba no dependa del disco de otra sesión. */
const ENVENENADO_REAL = {
  cookies: [],
  origins: [
    {
      origin: "http://localhost:3101",
      localStorage: [
        {
          name: "__convexAuthServerStateFetchTime_httpsuncommonpuffin303convexcloud",
          value: "1788950116652",
        },
      ],
    },
  ],
} as unknown as StorageState;

// ── Y1–Y4 · lo que NO se escribe ────────────────────────────────────────────

test("Y1 · una instantánea sin cookies no se escribe, y el error dice qué encontró", () => {
  const dir = dirTemporal();
  let mensaje = "";
  try {
    writeStateAtomically("sales", estado([]), dir);
  } catch (e) {
    mensaje = (e as Error).message;
  }
  expect(mensaje).toContain("sales");
  expect(mensaje).toContain("0 cookie(s)");
  expect(fs.existsSync(statePath("sales", dir))).toBe(false);
});

test("Y2 · falta el refresh token → no se escribe", () => {
  const dir = dirTemporal();
  expect(() =>
    writeStateAtomically("sales", estado([{ name: COOKIE_JWT, value: "x" }]), dir),
  ).toThrow(new RegExp(COOKIE_REFRESH));
  expect(fs.existsSync(statePath("sales", dir))).toBe(false);
});

test("Y3 · falta el JWT → no se escribe", () => {
  const dir = dirTemporal();
  expect(() =>
    writeStateAtomically("owner", estado([{ name: COOKIE_REFRESH, value: "x" }]), dir),
  ).toThrow(new RegExp(COOKIE_JWT));
  expect(fs.existsSync(statePath("owner", dir))).toBe(false);
});

test("Y4 · cookies PRESENTES pero con valor vacío → tampoco se escribe", () => {
  // `refreshTokenOf` devuelve "" tanto si la cookie falta como si está vacía.
  // Si escritura y lectura lo interpretaran distinto, un fichero con dos
  // cookies vacías pasaría la validación y no autenticaría nada: el mismo
  // defecto una capa más abajo.
  const dir = dirTemporal();
  const vacias = estado([
    { name: COOKIE_JWT, value: "" },
    { name: COOKIE_REFRESH, value: "" },
  ]);
  expect(() => writeStateAtomically("sales", vacias, dir)).toThrow(/sin valor/);
  expect(fs.existsSync(statePath("sales", dir))).toBe(false);
  // Y la misma definición vale para el lector: una sola función para los dos.
  expect(problemaDeInstantanea(vacias, "sales")).toContain("sin valor");
});

// ── Y5 · control positivo: lo válido SÍ se escribe ──────────────────────────

test("Y5 · una instantánea válida se escribe con normalidad", () => {
  const dir = dirTemporal();
  writeStateAtomically("sales", VALIDO, dir);
  expect(fs.existsSync(statePath("sales", dir))).toBe(true);
  expect(readState("sales", dir).cookies).toHaveLength(2);
  // Sin esta prueba, una validación que rechazara TODO pasaría Y1–Y4 y sería
  // inservible: el fail-closed se compraría con ruido.
});

// ── Y6–Y7 · la lectura ──────────────────────────────────────────────────────

test("Y6 · readState rechaza el fichero envenenado REAL y dice qué encontró", () => {
  const dir = dirTemporal();
  fs.writeFileSync(statePath("sales", dir), JSON.stringify(ENVENENADO_REAL));
  let mensaje = "";
  try {
    readState("sales", dir);
  } catch (e) {
    mensaje = (e as Error).message;
  }
  // EL CONTRATO ES FACTUAL: qué se encontró, qué falta, dónde está y cómo
  // conservarlo. Ni una palabra sobre por qué.
  expect(mensaje).toContain("0 cookie(s)"); // qué se encontró
  expect(mensaje).toContain("ninguna");
  expect(mensaje).toContain(COOKIE_JWT); // qué falta, con nombre
  expect(mensaje).toContain(COOKIE_REFRESH);
  expect(mensaje).toContain(statePath("sales", dir)); // dónde está
  expect(mensaje).toMatch(/c[óo]piala/i); // cómo conservar la evidencia

  // Y LA MITAD QUE IMPORTA, que es la que este test tenía al revés: prohibir la
  // atribución de causa, no exigirla. Antes esto fijaba «no la ha roto el
  // cambio que estés probando» como requisito PERMANENTE, y con eso una
  // regresión real de autenticación se archiva como problema preexistente del
  // arnés. El error no sabe quién escribió el fichero: no puede decirlo.
  expect(mensaje).not.toMatch(
    /no la ha roto|no es culpa|preexistente|corrida anterior|de otra corrida|se guardó rota/i,
  );
});

test("Y7 · readState acepta una instantánea válida", () => {
  const dir = dirTemporal();
  writeStateAtomically("owner", VALIDO, dir);
  expect(readState("owner", dir).cookies.map((c) => c.name).sort()).toEqual(
    [COOKIE_JWT, COOKIE_REFRESH].sort(),
  );
});

// ── Y8 · no basta con «no escribe basura»: no puede destruir lo bueno ───────

test("Y8 · una escritura inválida deja intacta la instantánea buena, byte a byte", () => {
  const dir = dirTemporal();
  writeStateAtomically("sales", VALIDO, dir);
  const antes = fs.readFileSync(statePath("sales", dir));
  expect(() => writeStateAtomically("sales", estado([]), dir)).toThrow();
  const despues = fs.readFileSync(statePath("sales", dir));
  expect(despues.equals(antes)).toBe(true);
  // Y no queda ningún temporal a medias: se valida ANTES de crearlo.
  expect(fs.readdirSync(dir).filter((f) => f.endsWith(".tmp"))).toEqual([]);
});

// ── el mensaje no puede mandar al gesto que oculta el defecto ───────────────

test("ningún mensaje dice «vuelve a correr»: eso repara el fichero y esconde el fallo", () => {
  // Correr UN test suelto regenera la instantánea y la deja sana (medido por
  // T1). Un mensaje que invite a reintentar manda justo al gesto que borra la
  // evidencia, y quien lo siga verá verde y creerá que no había nada.
  const dir = dirTemporal();
  let mensaje = "";
  try {
    writeStateAtomically("sales", estado([]), dir);
  } catch (e) {
    mensaje = (e as Error).message;
  }
  expect(mensaje).not.toMatch(/vuelve a correr|reint[ée]nta|prueba otra vez/i);
  expect(mensaje).toContain("SUITE ENTERA");
  expect(mensaje).toContain("No relances un test suelto");
});

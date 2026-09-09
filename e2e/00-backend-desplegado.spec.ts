import { test, expect } from "@playwright/test";
import {
  DeclaracionNoClasificable,
  FACTORIAS,
  clasificarDeclaracion,
  extraerDeclaraciones,
  identificadoresDelCodigo,
  moduloDesdeRuta,
  readDeployedFunctions,
  selectMissingFunctions,
  run,
} from "../scripts/check-e2e-preconditions.mjs";

// AIT-95 — pruebas del extractor y del fail-closed de la precondición de
// backend desplegado. Mismo patrón que 00-e2e-preconditions.spec.ts: funciones
// puras y lecturas inyectadas, sin navegador y sin deployment.
//
// Van en FICHERO PROPIO y no dentro del spec de AIT-103 para no tocar un
// fichero de otra terminal; el módulo que prueban sí es el mismo.
//
// Y tienen que ser automáticas, no comprobaciones a mano: ocho fixtures
// descritos en un plan y ocho que corren solos dejan de ser lo mismo justo
// cuando alguien añade una forma nueva dentro de seis meses.

/** Envuelve una fuente en el par {ruta, fuente} que espera el extractor. */
function fichero(fuente: string, ruta = "prueba.ts") {
  return [{ ruta, fuente }];
}

function clasificar(fuente: string) {
  const decls = extraerDeclaraciones(fuente);
  expect(decls.length, "la fuente de prueba debe tener UNA declaración").toBe(1);
  return clasificarDeclaracion(decls[0], "prueba.ts");
}

// ── X1 · función presente en los dos lados → no falta nada ──────────────────
test("X1 · una función declarada y desplegada no aparece como ausente", () => {
  const ids = identificadoresDelCodigo(
    fichero(`export const listar = query({ handler: async () => [] });`, "customers.ts"),
  );
  expect(ids).toEqual(["customers.js:listar"]);
  expect(selectMissingFunctions(ids, ["customers.js:listar"])).toEqual([]);
});

// ── X2 · función en el código y no desplegada → se nombra ───────────────────
test("X2 · una función sin desplegar se reporta con su identificador", () => {
  const ids = identificadoresDelCodigo(
    fichero(`export const createContact = mutation({ handler: async () => null });`, "customers.ts"),
  );
  expect(selectMissingFunctions(ids, ["customers.js:otra"])).toEqual([
    "customers.js:createContact",
  ]);
});

// ── X3 · el destructuring REAL de convexAuth ────────────────────────────────
test("X3 · convexAuth aporta sus cuatro funciones y NO aporta `auth`", () => {
  const nombres = clasificar(
    `export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({\n  providers: [],\n});`,
  );
  expect(nombres.sort()).toEqual(["isAuthenticated", "signIn", "signOut", "store"]);
  expect(nombres).not.toContain("auth");
  // `auth` está declarado como no-función a propósito: extraerlo daría un falso
  // positivo, porque NO se despliega (medido contra function-spec).
  expect(FACTORIAS.convexAuth.noFunciones).toContain("auth");
});

// ── X4 · la forma desconocida ABORTA (el major de la ronda 2) ───────────────
test("X4 · una llamada a un destinatario no registrado aborta, no se omite", () => {
  expect(() =>
    clasificar(`export const X = miHelper(query({ handler: async () => null }));`),
  ).toThrow(DeclaracionNoClasificable);
});

// ── X5 / X6 · igualdad EXACTA de conjuntos en el destructuring ──────────────
test("X5 · un nombre de MÁS en una factoría registrada aborta", () => {
  expect(() =>
    clasificar(`export const { auth, signIn, signOut, store, isAuthenticated, nuevo } = convexAuth({});`),
  ).toThrow(DeclaracionNoClasificable);
});

test("X6 · un nombre de MENOS en una factoría registrada aborta", () => {
  expect(() =>
    clasificar(`export const { auth, signIn, signOut, store } = convexAuth({});`),
  ).toThrow(DeclaracionNoClasificable);
});

// ── X7 · factoría desconocida ──────────────────────────────────────────────
test("X7 · un destructuring de una factoría no registrada aborta", () => {
  expect(() => clasificar(`export const { a, b } = otraCosa({});`)).toThrow(
    DeclaracionNoClasificable,
  );
});

// ── X8 · EL CONTROL POSITIVO: lo legítimo NO debe abortar ───────────────────
// Sin esta prueba, un extractor que abortara ante CUALQUIER construcción
// pasaría X4–X7 y sería inservible en una semana. Un juego de pruebas que solo
// prueba fallos no distingue un control de un bloqueo.
test("X8 · una declaración multilínea legítima se clasifica y NO aborta", () => {
  // Caso real: convex/model/customerSource.ts, donde el `= true` está a cuatro
  // líneas del `export const` por un genérico multilínea.
  const nombres = clasificar(
    `export const CUSTOMER_SOURCE_VALIDATOR_MATCHES_CATALOG: Equals<\n` +
      `  Infer<typeof customerSourceValidator>,\n  CustomerSource\n> = true;`,
  );
  expect(nombres).toEqual([]);
});

test("X8b · las otras formas legítimas del repo tampoco abortan", () => {
  expect(clasificar(`export const validador = v.union(v.literal("a"));`)).toEqual([]);
  expect(clasificar(`export const config: EmailConfig = {\n  id: "x",\n};`)).toEqual([]);
  expect(clasificar(`export type Rol = "owner" | "sales";`)).toEqual([]);
  expect(clasificar(`export function ayuda() {\n  return 1;\n}`)).toEqual([]);
});

// ── X9 / X10 · el CLI: fail-closed y sin volcar su salida ───────────────────
test("X9 · salida no-JSON de function-spec aborta sin volcar la salida", async () => {
  const lineas: string[] = [];
  const codigo = await run({
    readSources: () => [],
    readDeployed: async () => {
      const secreto = "SECRETO-QUE-NO-DEBE-SALIR";
      await Promise.resolve();
      return JSON.parse(secreto) as string[]; // revienta con el secreto dentro
    },
    out: (l: string) => lineas.push(l),
    err: (l: string) => lineas.push(l),
  });
  expect(codigo).toBe(1);
  expect(lineas.join("\n")).not.toContain("SECRETO-QUE-NO-DEBE-SALIR");
});

test("X10 · un fallo del CLI aborta y no continúa a los tests", async () => {
  const lineas: string[] = [];
  const codigo = await run({
    readSources: () => [],
    readDeployed: async () => {
      throw new Error("function-spec falló");
    },
    out: (l: string) => lineas.push(l),
    err: (l: string) => lineas.push(l),
  });
  expect(codigo).toBe(1);
  expect(lineas.join("\n")).toContain("NO COMPROBABLE");
});

// ── normalización de nombres de módulo ─────────────────────────────────────
test("la normalización de módulo sigue la forma de function-spec", () => {
  expect(moduloDesdeRuta("customers.ts")).toBe("customers.js");
  expect(moduloDesdeRuta("model/customerSource.ts")).toBe("model_customerSource.js");
});

// ── el lector real: fail-closed ante salida inválida ───────────────────────
test("readDeployedFunctions exige JSON con `functions`", async () => {
  await expect(
    readDeployedFunctions(async () => ({ stdout: '{"url":"x"}' })),
  ).rejects.toThrow(/sin `functions`/);
  await expect(
    readDeployedFunctions(async () => ({ stdout: "no soy json" })),
  ).rejects.toThrow(/no es JSON/);
});

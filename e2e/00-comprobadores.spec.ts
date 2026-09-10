import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { buscarFugas } from "../scripts/check-error-message-leaks.mjs";

// AIT-117 — los comprobadores que entregamos, ejecutándose SOLOS.
//
// Antes de esto, `scripts/check-error-message-leaks.mjs` (AIT-111) dependía de
// que alguien se acordara de invocarlo: cero referencias en `package.json`. Y la
// comprobación de AIT-115 —"ningún .ts del repo lleva espacios en el nombre"—
// ni siquiera existía como fichero: era una medición hecha una vez y escrita en
// un export.
//
// POR QUÉ AQUÍ Y NO ENCADENADOS EN `test:e2e`. Los dos son INVARIANTES del
// repositorio, no PRECONDICIONES de la suite:
//
//   · una PRECONDICIÓN, si es falsa, deja sin sentido todo lo que se mida
//     después (el puerto, el backend desplegado, el cupo de login). Ésas van con
//     `&&` en `test:e2e` y abortan: es lo que hace check-e2e-preconditions.mjs.
//   · un INVARIANTE, si es falso, no impide que el resto de la suite siga
//     midiendo lo que dice medir. Una fuga de `err.message` es un hallazgo sobre
//     el producto; no invalida la medición del pipeline ni del login.
//
// Por eso fallan ABIERTO, y conviene decir qué significa: **la suite CONTINÚA
// ejecutando los demás tests, aunque su resultado final sea ROJO**. No es
// tolerar el incumplimiento — es que el incumplimiento no impide medir lo demás.
// Un `&&` en `test:e2e` haría lo contrario: un hallazgo de estilo impediría
// medir el pipeline, que no tiene nada que ver.

test.describe("Comprobadores del repositorio", () => {
  // EL NOMBRE CARGA EL ALCANCE, y no es cosmético: lo que la gente lee de un
  // test verde es su título, no el comentario de arriba. "ningún err.message se
  // pinta" leído en una lista de 120 verdes se entiende como una garantía; lo
  // medido es mucho menos. Aviso de T3 (autora del comprobador en AIT-111), y
  // tiene razón: si el gate dice más de lo que mide, hereda el fallo que el ADR
  // venía a cerrar.
  test("ningún err.message se pinta al usuario — patrón directo, app+components/*.tsx", () => {
    // OJO CON LEER EL VERDE AL REVÉS: esto es una HEURÍSTICA DECLARADA, no una
    // prueba. Detecta el patrón directo `setAlgoError(... err.message ...)` y NO
    // ve el que pasa por una variable intermedia. Verde significa "no aparece el
    // patrón directo", no "no hay fugas". El alcance completo está en la
    // cabecera de scripts/check-error-message-leaks.mjs y sigue mandando ahí.
    //
    // Y el alcance en números, medido hoy y no heredado: mira los 43 `.tsx` de
    // `app/` y `components/`, y NO mira los 6 `.ts` de esas mismas carpetas ni
    // los 28 de `convex/`. O sea 43 de 77. Un cero aquí no habla de los otros 34.
    const fugas = buscarFugas();
    const detalle = fugas
      .map((f: { fichero: string; linea: number; texto: string }) =>
        `\n  ${f.fichero}:${f.linea}   ${f.texto}`)
      .join("");
    expect(
      fugas.length,
      `Regla: docs/01-arquitectura.md §6 — el mensaje del servidor se puede LEER ` +
        `para clasificar, no DEVOLVER.${detalle}`,
    ).toBe(0);
  });

  test("ningún .ts/.tsx/.mts versionado lleva espacios en el nombre", () => {
    // Por qué importa: el `exclude` del tsconfig (AIT-115) saca de la
    // compilación TODO fichero con un espacio en el nombre, porque así es como
    // iCloud nombra sus copias de conflicto. Ese patrón es seguro mientras
    // ningún fichero legítimo lleve espacios — y eso era una medición hecha una
    // vez. Si alguien añade uno, desaparece del chequeo de tipos EN SILENCIO.
    //
    // Mira lo VERSIONADO y no el árbol de trabajo, a propósito: lo que rompe a
    // los demás es lo que se comitea. Los duplicados locales sin rastrear son
    // otro problema (AIT-116) y no se persiguen desde aquí.
    const salida = execFileSync(
      "git",
      ["ls-files", "*.ts", "*.tsx", "*.mts"],
      { encoding: "utf8" },
    );
    const todos = salida.split("\n").filter((l) => l.length > 0);
    const conEspacios = todos.filter((f) => f.includes(" "));

    // CONTROL POSITIVO, y hace falta: "ningún fichero con espacios" y "no
    // encontré ningún fichero" dan el mismo cero. Sin esto, un `ls-files` mal
    // escrito pasaría el test por no encontrar nada.
    expect(
      todos.length,
      "el listado de ficheros versionados salió vacío: la comprobación no midió nada",
    ).toBeGreaterThan(0);

    expect(
      conEspacios,
      "un fichero con espacios queda fuera del chequeo de tipos sin avisar (AIT-115)",
    ).toEqual([]);
  });
});

import { test, expect } from "@playwright/test";
import { initials } from "../lib/initials";
import {
  CASOS_ACENTOS,
  CASOS_DEFECTO,
  CASOS_FALLBACK,
  CASOS_NORMALES,
  CASOS_SEPARADORES,
  CASOS_TRES_CLASES,
  CASOS_UNA_LETRA,
  TODOS,
} from "./casos-iniciales";

// AIT-129 — pruebas UNITARIAS de lib/initials.ts. No abren navegador ni tocan
// Convex. Van aquí por la misma razón que las de 00-phone.spec.ts, y el prefijo
// `00-` no es cosmético: `PATRON_PRUEBAS_PURAS` lo usa para mandarlas a
// `npm run test:unit` y excluirlas de la suite de navegador.
//
// ⚠️ SE AFIRMAN RESULTADOS EXACTOS, NO RECUENTOS. La primera versión de estas
// pruebas contaba "iniciales con algún carácter que no es letra" y exigía cero,
// excluyendo el fallback "?". Una implementación rota que devolviera "?" para
// todo habría dado cero y PASADO: el propio fallback era la vía de escape. Un
// recuento con una exención es un criterio que se cumple con la cosa rota.

test.describe("initials — nombres que HOY fallan (el defecto de AIT-129)", () => {
  // Los dos valores que reportó el QA sobre `28006d3` eran `[B` y `[0`.
  test("un nombre que empieza por signo no cuela el signo", () => {
    // AIT-142: los pares viven en `casos-iniciales.ts` — una sola fuente. Los
    // valores no han cambiado; lo que cambia es de dónde se leen.
    for (const [entrada, esperado] of CASOS_DEFECTO) {
      expect(initials(entrada), entrada).toBe(esperado);
    }
  });

  // C3 de la ficha: el defecto es "no filtrar lo que no es letra", NO el corchete.
  // Estas tres son de CLASES DISTINTAS a propósito: un arreglo dirigido al `[`
  // (por literal, por código de carácter o por como se escriba) pasa la primera
  // y falla las otras dos. Por eso el criterio se comprueba por comportamiento y
  // no leyendo el diff: el texto del arreglo se puede disfrazar, el resultado no.
  test("las tres clases —corchete, dígito y otro signo— dan iniciales de letras", () => {
    for (const [entrada, esperado] of CASOS_TRES_CLASES) {
      expect(initials(entrada), entrada).toBe(esperado);
    }
  });
});

test.describe("initials — lo que NO puede cambiar", () => {
  // CONTROL NEGATIVO. Una regresión aquí no la reportaría nadie, porque nadie
  // vuelve a mirar lo que ya funcionaba.
  test("los nombres normales dan lo mismo que antes del arreglo", () => {
    for (const [entrada, esperado] of CASOS_NORMALES) {
      expect(initials(entrada), entrada).toBe(esperado);
    }
  });

  test("las letras acentuadas y no ASCII siguen siendo la inicial", () => {
    for (const [entrada, esperado] of CASOS_ACENTOS) {
      expect(initials(entrada), entrada).toBe(esperado);
    }
  });

  test("guion y apóstrofo no parten el nombre", () => {
    for (const [entrada, esperado] of CASOS_SEPARADORES) {
      expect(initials(entrada), entrada).toBe(esperado);
    }
  });
});

test.describe("initials — el fallback, declarado", () => {
  // Cambio de comportamiento deliberado de AIT-129: antes "###" daba "##".
  // Se afirma explícitamente para que sea una decisión y no un efecto colateral.
  test("un nombre sin ninguna letra cae en el fallback que ya existía", () => {
    for (const [entrada, esperado] of CASOS_FALLBACK) {
      expect(initials(entrada), entrada).toBe(esperado);
    }
  });

  test("una sola letra utilizable devuelve esa letra, no el fallback", () => {
    for (const [entrada, esperado] of CASOS_UNA_LETRA) {
      expect(initials(entrada), entrada).toBe(esperado);
    }
  });
});

// AIT-142 · CONTROL DEL REFACTOR. El corpus se movió a `casos-iniciales.ts`; este
// caso existe para que el movimiento no pueda perder pares en silencio. Si alguien
// borra un grupo del módulo, aquí sale rojo aunque los `for` de arriba sigan
// pasando con menos vueltas.
test("el corpus contractual tiene 17 casos y ningún grupo se ha perdido", () => {
  expect(TODOS).toHaveLength(17);
  expect(
    CASOS_DEFECTO.length +
      CASOS_TRES_CLASES.length +
      CASOS_NORMALES.length +
      CASOS_ACENTOS.length +
      CASOS_SEPARADORES.length +
      CASOS_FALLBACK.length +
      CASOS_UNA_LETRA.length,
  ).toBe(TODOS.length);
});

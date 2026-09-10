import { test, expect } from "@playwright/test";
import { initials } from "../lib/initials";

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
    expect(initials("[QA] Tester — no borrar")).toBe("QB");
    expect(initials("[QA] Prueba Tester 03-09")).toBe("QT");
  });

  // C3 de la ficha: el defecto es "no filtrar lo que no es letra", NO el corchete.
  // Estas tres son de CLASES DISTINTAS a propósito: un arreglo dirigido al `[`
  // (por literal, por código de carácter o por como se escriba) pasa la primera
  // y falla las otras dos. Por eso el criterio se comprueba por comportamiento y
  // no leyendo el diff: el texto del arreglo se puede disfrazar, el resultado no.
  test("las tres clases —corchete, dígito y otro signo— dan iniciales de letras", () => {
    expect(initials("[QA] Tester")).toBe("QT"); // corchete
    expect(initials("3M España")).toBe("ME"); // dígito
    expect(initials("& Asociados")).toBe("AS"); // otro signo
  });
});

test.describe("initials — lo que NO puede cambiar", () => {
  // CONTROL NEGATIVO. Una regresión aquí no la reportaría nadie, porque nadie
  // vuelve a mirar lo que ya funcionaba.
  test("los nombres normales dan lo mismo que antes del arreglo", () => {
    expect(initials("María Ríos")).toBe("MR");
    expect(initials("Marta")).toBe("MA");
    expect(initials("Carlos Ruiz Gómez")).toBe("CG");
  });

  test("las letras acentuadas y no ASCII siguen siendo la inicial", () => {
    expect(initials("Ñ. Pérez")).toBe("ÑP");
    expect(initials("Ángel Ruiz")).toBe("ÁR");
  });

  test("guion y apóstrofo no parten el nombre", () => {
    expect(initials("Jean-Luc Picard")).toBe("JP");
    expect(initials("O'Neill")).toBe("ON");
  });
});

test.describe("initials — el fallback, declarado", () => {
  // Cambio de comportamiento deliberado de AIT-129: antes "###" daba "##".
  // Se afirma explícitamente para que sea una decisión y no un efecto colateral.
  test("un nombre sin ninguna letra cae en el fallback que ya existía", () => {
    expect(initials("###")).toBe("?");
    expect(initials("03-09")).toBe("?");
    expect(initials("")).toBe("?");
    expect(initials("   ")).toBe("?");
  });

  test("una sola letra utilizable devuelve esa letra, no el fallback", () => {
    expect(initials("3M")).toBe("M");
  });
});

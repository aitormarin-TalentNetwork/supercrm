import { test, expect } from "@playwright/test";
import { normalizePhone, formatPhone } from "../lib/phone";

// AIT-80 — casos frontera de lib/phone.ts. Son pruebas UNITARIAS de dos
// funciones puras: no abren navegador ni tocan Convex. Van aquí porque el
// proyecto no tiene runner de tests unitarios (package.json solo declara
// `test:e2e`), y montar uno para dos funciones sería añadir una dependencia y
// una configuración que nadie ha pedido. El runner de Playwright las ejecuta
// igual de bien.
//
// Importan porque `normalizePhone` es la MISMA regla en los tres caminos que
// tienen que coincidir: lo que se escribe, lo que se busca y lo que migra el
// backfill. Si se desincronizan, el fallo es silencioso.

test.describe("normalizePhone", () => {
  test("las tres formas de escribir un móvil español dan el mismo canónico", () => {
    expect(normalizePhone("600123456")).toBe("600123456");
    expect(normalizePhone("600 123 456")).toBe("600123456");
    expect(normalizePhone("600-123-456")).toBe("600123456");
    expect(normalizePhone("(600) 123456")).toBe("600123456");
    expect(normalizePhone("  600 123 456  ")).toBe("600123456");
  });

  test("recorta el prefijo de España escrito explícitamente", () => {
    expect(normalizePhone("+34 600 123 456")).toBe("600123456");
    expect(normalizePhone("+34600123456")).toBe("600123456");
    expect(normalizePhone("0034 600 123 456")).toBe("600123456");
  });

  test("conserva un código de país extranjero: es otro número", () => {
    expect(normalizePhone("+49 30 1234567")).toBe("49301234567");
  });

  test("NO adivina el prefijo a partir de los dígitos", () => {
    // Sin "+", un 34 inicial se conserva: recortarlo por parecerse a un
    // prefijo corrompería un número extranjero legítimo que empiece por 34.
    expect(normalizePhone("34600123456")).toBe("34600123456");
  });

  test("una consulta sin dígitos da cadena vacía", () => {
    // De esto depende el buscador: "" está incluido en cualquier cadena, así
    // que app/clientes/page.tsx salta la comparación por teléfono cuando la
    // normalización no deja ningún dígito.
    expect(normalizePhone("Juan")).toBe("");
    expect(normalizePhone("")).toBe("");
  });

  test("es idempotente: normalizar lo ya normalizado no lo cambia", () => {
    // Es la condición de la que depende que el backfill se pueda correr dos
    // veces sin tocar nada la segunda.
    const once = normalizePhone("+34 600 123 456");
    expect(normalizePhone(once)).toBe(once);
  });
});

test.describe("formatPhone", () => {
  test("agrupa un móvil español de 9 dígitos", () => {
    expect(formatPhone("600123456")).toBe("600 123 456");
  });

  test("es conservador con lo que no reconoce", () => {
    // Un número extranjero maquetado como si fuera español parecería un dato
    // correcto sin serlo.
    expect(formatPhone("49301234567")).toBe("49301234567");
    expect(formatPhone("")).toBe("");
    expect(formatPhone("600 123 456")).toBe("600 123 456");
  });
});

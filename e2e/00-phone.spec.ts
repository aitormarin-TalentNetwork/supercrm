import { test, expect } from "@playwright/test";
import { normalizePhone, formatPhone } from "../lib/phone";

// AIT-80 — casos frontera de lib/phone.ts. Son pruebas UNITARIAS de dos
// funciones puras: no abren navegador ni tocan Convex. Las ejecuta
// `npm run test:unit` (Playwright, AIT-109), que es el runner de lo puro.
//
// ⚠️ CORREGIDO EN AIT-92: esta nota decía que «el proyecto no tiene runner de
// tests unitarios (package.json solo declara `test:e2e`)». **Esa premisa dejó de
// ser cierta**: `test:unit` existe desde AIT-109. Lo que NO se cae es su buen
// juicio — montar un runner nuevo PARA DOS FUNCIONES PURAS sigue siendo añadir
// una dependencia que nadie ha pedido, y estas dos siguen aquí por eso.
// (AIT-92 sí añadió un tercer runner, `test:callback`, y no para funciones
// puras: para recorrer un callback de OAuth con cifrado, que ningún runner
// existente podía cargar. Está acotado a un solo fichero.)
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

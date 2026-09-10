import { test, expect } from "@playwright/test";
import {
  CUSTOMER_PHONE_MAX_DIGITS,
  CUSTOMER_PHONE_MIN_DIGITS,
  normalizeCustomerEmail,
  validateCustomerEmail,
  validateCustomerName,
  validateCustomerPhone,
} from "../lib/customerValidation";

// AIT-82 — pruebas UNITARIAS de lib/customerValidation.ts. No abren navegador ni
// tocan Convex. Las ejecuta `npm run test:unit`, igual que las de
// 00-phone.spec.ts.
//
// ⚠️ CORREGIDO EN AIT-92, misma corrección que allí: la premisa «el proyecto no
// tiene runner de tests unitarios» ya no es cierta (`test:unit`, AIT-109). Su
// conclusión —no montar un runner para unas funciones puras— sigue en pie.
//
// Importan porque estas funciones son la MISMA regla en las cuatro puertas de
// escritura a `customers`: las dos mutations y los dos formularios. Antes de
// AIT-82 eran copias, y una copia se desincroniza sin avisar.

// Los tres casos que motivan la tarea. Cada uno CAMBIA DE RESULTADO con el
// arreglo: antes de AIT-82 la longitud se medía sobre los dígitos del valor
// tecleado y se guardaba el canónico, así que el prefijo `+34` hacía de relleno.
// Si alguien revierte la corrección y vuelve a contar el crudo, estos tres
// fallan — que es lo que los hace pruebas y no decoración.
test.describe("validateCustomerPhone · la longitud se mide sobre el canónico", () => {
  test("un +34 no puede hacer de relleno para colar un número corto", () => {
    // Crudo "346001234" = 9 dígitos: ANTES pasaba, y dejaba guardado "6001234"
    // (7 dígitos), que la propia regla prohíbe y que queda fuera del índice
    // by_store_phone, así que su duplicado no se detectaría nunca.
    expect(validateCustomerPhone("+34 6001234")).toBe(
      "Introduce un teléfono válido (9 dígitos).",
    );
  });

  test("lo mismo con el prefijo escrito como 0034", () => {
    // Crudo "003460012345" -> 12 dígitos: ANTES pasaba, guardaba 8.
    expect(validateCustomerPhone("0034 60012345")).toBe(
      "Introduce un teléfono válido (9 dígitos).",
    );
  });

  test("y no se rechaza un número que solo se pasaba de largo por el prefijo", () => {
    // Crudo = 17 dígitos: ANTES daba "demasiado largo". Canónico = 15, que
    // está dentro del límite.
    expect(validateCustomerPhone("+34 600123456789012")).toBeNull();
  });

  test("un número extranjero conserva su código de país y no se ve afectado", () => {
    // normalizePhone solo recorta +34/0034, así que cruda y canónica coinciden.
    expect(validateCustomerPhone("+49 30 1234567")).toBeNull();
  });
});

test.describe("validateCustomerPhone · el resto de la regla", () => {
  test("vacío o solo espacios: obligatorio, y lo dice", () => {
    // AIT-82: antes el servidor respondía "solo puede tener números y
    // separadores" a quien no había escrito nada — describía un problema que esa
    // persona no había tenido.
    expect(validateCustomerPhone("")).toBe("El teléfono es obligatorio.");
    expect(validateCustomerPhone("   ")).toBe("El teléfono es obligatorio.");
  });

  test("caracteres no admitidos", () => {
    expect(validateCustomerPhone("60012a456")).toBe(
      "El teléfono solo puede tener números y separadores.",
    );
  });

  test("separadores admitidos y un móvil español válido", () => {
    expect(validateCustomerPhone("600123456")).toBeNull();
    expect(validateCustomerPhone("600 123 456")).toBeNull();
    expect(validateCustomerPhone("(600) 123-456")).toBeNull();
    expect(validateCustomerPhone("  600 123 456  ")).toBeNull();
  });

  test("demasiado largo, ya medido sobre el canónico", () => {
    expect(validateCustomerPhone("1234567890123456")).toBe(
      "El teléfono es demasiado largo.",
    );
  });

  test("el mensaje del mínimo sale de la constante, no de un literal suelto", () => {
    // Si alguien cambia el mínimo, el texto no puede quedarse diciendo un número
    // que ya no es cierto.
    expect(validateCustomerPhone("6001")).toContain(
      `${CUSTOMER_PHONE_MIN_DIGITS} dígitos`,
    );
    expect(CUSTOMER_PHONE_MIN_DIGITS).toBeLessThan(CUSTOMER_PHONE_MAX_DIGITS);
  });
});

test.describe("validateCustomerName", () => {
  test("vacío o solo espacios", () => {
    expect(validateCustomerName("")).toBe("El nombre es obligatorio.");
    expect(validateCustomerName("   ")).toBe("El nombre es obligatorio.");
  });

  test("un nombre con espacios alrededor es válido", () => {
    expect(validateCustomerName("  Café Aroma  ")).toBeNull();
  });
});

test.describe("validateCustomerEmail · es opcional", () => {
  test("ausente o vacío es válido: el email no es obligatorio", () => {
    expect(validateCustomerEmail(undefined)).toBeNull();
    expect(validateCustomerEmail("")).toBeNull();
    expect(validateCustomerEmail("   ")).toBeNull();
  });

  test("formato inválido", () => {
    expect(validateCustomerEmail("sinarroba")).toBe(
      "El email no tiene un formato válido.",
    );
    expect(validateCustomerEmail("dos@@arrobas.com")).toBe(
      "El email no tiene un formato válido.",
    );
  });

  test("se valida ya normalizado: mayúsculas y espacios no lo invalidan", () => {
    expect(validateCustomerEmail("  Ana@Ejemplo.ES  ")).toBeNull();
  });
});

test.describe("normalizeCustomerEmail · es la forma en la que se guarda", () => {
  test("recorta, pasa a minúsculas, y el vacío se vuelve undefined", () => {
    // Ese `undefined` es lo que permite BORRAR un email al editar: `patch` con
    // undefined elimina el campo en vez de guardar "" (AIT-77).
    expect(normalizeCustomerEmail("  Ana@Ejemplo.ES  ")).toBe("ana@ejemplo.es");
    expect(normalizeCustomerEmail("")).toBeUndefined();
    expect(normalizeCustomerEmail("   ")).toBeUndefined();
    expect(normalizeCustomerEmail(undefined)).toBeUndefined();
  });
});

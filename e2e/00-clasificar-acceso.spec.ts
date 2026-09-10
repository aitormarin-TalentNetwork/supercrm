import { test, expect } from "@playwright/test";
import { clasificarRespuesta } from "./clasificarAcceso";

/** AIT-134 — El control del instrumento del clasificador. PRUEBA PURA.
 *
 * 🔴 POR QUÉ ES PURA Y NO e2e, y es un defecto mío corregido: mi primer control
 * interceptaba con `page.route()` una petición emitida por
 * `page.request.get()`. **Son canales distintos**: `APIRequestContext` no pasa
 * por `page.route()`. El señuelo no se aplicaba nunca, respondía el servidor
 * real, y **el control habría dado verde con el predicado roto**.
 *
 * Aquí el señuelo se construye a mano y no hay nada que interceptar. */

test("los dos señuelos que el predicado VIEJO aceptaba salen ANOMALO", () => {
  // 🔑 ESTOS DOS SON EL ROJO DEL PREDICADO ANTERIOR. `destino.includes("/login")`
  // decía que sí a los dos, y por eso una respuesta así se leía como "sesión
  // cerrada" cuando no lo era.
  expect(
    clasificarRespuesta(302, "https://ejemplo.invalido/login", "http://localhost:3103/pipeline"),
    "un 302 a /login de OTRO ORIGEN no es la denegación de nuestro servidor",
  ).toBe("ANOMALO");
  expect(
    clasificarRespuesta(302, "/panel?redirigido=/login", "http://localhost:3103/pipeline"),
    "un 302 con /login en el QUERY no es una redirección a /login",
  ).toBe("ANOMALO");
});

test("la denegación de verdad sí se reconoce", () => {
  // ⬅ CONTROL POSITIVO. Sin él, un clasificador que devolviera ANOMALO a todo
  // pasaría el test de arriba y no distinguiría nada.
  expect(
    clasificarRespuesta(302, "/login", "http://localhost:3103/pipeline"),
    "una redirección relativa a /login del mismo origen ES la denegación esperada",
  ).toBe("DENEGACION_ESPERADA");
  expect(
    clasificarRespuesta(307, "http://localhost:3103/login", "http://localhost:3103/pipeline"),
    "la misma denegación con Location absoluta del mismo origen",
  ).toBe("DENEGACION_ESPERADA");
});

test("el acceso concedido se reconoce, y sólo con 200", () => {
  expect(clasificarRespuesta(200, "", "http://localhost:3103/pipeline")).toBe(
    "ACCESO_CONFIRMADO",
  );
  // ⛔ Y NINGÚN OTRO CÓDIGO CUENTA COMO ACCESO. Un 500 no es "me dejó entrar" ni
  // "me cerró la sesión": es el tercer estado, que antes no existía y por el que
  // se colaba todo.
  for (const codigo of [204, 400, 401, 403, 404, 500, 502]) {
    expect(
      clasificarRespuesta(codigo, "", "http://localhost:3103/pipeline"),
      `el código ${codigo} no puede clasificarse como acceso ni como denegación`,
    ).toBe("ANOMALO");
  }
});

test("una Location ilegible no se interpreta: es ANOMALO", () => {
  expect(clasificarRespuesta(302, "", "http://localhost:3103/pipeline")).toBe(
    "ANOMALO",
  );
  expect(clasificarRespuesta(302, "::::", "http://localhost:3103/pipeline")).toBe(
    "ANOMALO",
  );
});

import { test, expect } from "@playwright/test";
import { isServerAction } from "../components/version/NewVersionNotice";

// AIT-89 — pruebas UNITARIAS de la detección de acciones de servidor. No abren
// navegador ni tocan Convex, igual que 00-phone.spec.ts y
// 00-customerValidation.spec.ts.
//
// POR QUÉ EXISTEN, que no es obvio: si una de las cuatro formas dejara de
// detectarse, el aviso de versión nueva NO fallaría — simplemente dejaría pasar
// la acción. El síntoma sería el bug que AIT-83 vino a arreglar, reapareciendo
// meses después, sin nada que lo conecte con el cambio que lo causó. La
// protección se apagaría EN SILENCIO, y estas pruebas son el ruido que faltaba.
//
// UNA PRUEBA POR FORMA, cada una construyendo SOLO la suya: un caso genérico que
// las mezclara seguiría en verde con tres de las cuatro ramas rotas, que es
// literalmente el criterio de rechazo de la issue.

const URL_CUALQUIERA = "https://example.test/algo";
const CABECERA = "next-action";
const VALOR = "7f3a9c";

test.describe("Las cuatro formas de traer la cabecera", () => {
  test("1) init.headers como Headers", () => {
    const headers = new Headers();
    headers.set(CABECERA, VALOR);
    expect(isServerAction(URL_CUALQUIERA, { headers })).toBe(true);
  });

  test("2) init.headers como array de pares", () => {
    expect(isServerAction(URL_CUALQUIERA, { headers: [[CABECERA, VALOR]] })).toBe(true);
  });

  test("3) init.headers como objeto plano", () => {
    expect(isServerAction(URL_CUALQUIERA, { headers: { [CABECERA]: VALOR } })).toBe(true);
  });

  test("4) la cabecera dentro de un Request ya construido, sin init", () => {
    const req = new Request(URL_CUALQUIERA, { headers: { [CABECERA]: VALOR } });
    expect(isServerAction(req)).toBe(true);
  });
});

test.describe("Y lo que NO es una acción de servidor", () => {
  // Sin estos, las cuatro de arriba las pasaría una función que devolviera
  // `true` siempre. Son el otro lado de la misma medida.
  test("las mismas cuatro formas, sin la cabecera", () => {
    const headers = new Headers();
    headers.set("content-type", "application/json");
    expect(isServerAction(URL_CUALQUIERA, { headers })).toBe(false);
    expect(isServerAction(URL_CUALQUIERA, { headers: [["content-type", "text/plain"]] })).toBe(false);
    expect(isServerAction(URL_CUALQUIERA, { headers: { accept: "*/*" } })).toBe(false);
    expect(isServerAction(new Request(URL_CUALQUIERA))).toBe(false);
  });

  test("una petición pelada, sin init y sin Request", () => {
    expect(isServerAction(URL_CUALQUIERA)).toBe(false);
  });
});

test.describe("Dos bordes que una reescritura «equivalente» se lleva por delante", () => {
  test("el nombre de la cabecera no distingue mayúsculas", () => {
    // `Headers.has()` ya es insensible por su cuenta; las ramas de array y
    // objeto lo consiguen con `toLowerCase()`. Quitar ese `toLowerCase()`
    // dejaría la rama de Headers EN VERDE y rompería las otras dos — o sea que
    // una prueba que solo cubriera Headers daría por vigilado lo que no lo está.
    expect(isServerAction(URL_CUALQUIERA, { headers: [["Next-Action", VALOR]] })).toBe(true);
    expect(isServerAction(URL_CUALQUIERA, { headers: { "Next-Action": VALOR } })).toBe(true);
  });

  test("se miran las DOS fuentes: cabecera en el Request e init.headers sin ella", () => {
    // Fija el orden de los dos `if`. Una reescritura que devolviera el resultado
    // del primer sitio donde hay cabeceras —en vez de seguir mirando— daría
    // false aquí, y sería indistinguible del código bueno en todos los demás
    // casos.
    const req = new Request(URL_CUALQUIERA, { headers: { [CABECERA]: VALOR } });
    expect(isServerAction(req, { headers: { "content-type": "text/plain" } })).toBe(true);
  });
});

import { test, expect } from "@playwright/test";

// AIT-112 — el aviso del acceso con Google en /login.
//
// Antes de esta tarea, `grep -rn "oauth\|Google" e2e/` no devolvía NADA: el
// aviso de la vuelta rechazada nunca se había probado, en la única pantalla
// donde quien no puede entrar no tiene otro sitio donde enterarse de por qué.
//
// No hace falta Google para probarlo: el aviso se dispara con `?oauth=1` en la
// URL y sin sesión, que es exactamente lo que devuelve Convex Auth cuando
// rechaza (ADR-003: la librería vuelve en silencio, y la pantalla lo deduce por
// descarte). Sin `loginAs`, que es lo que deja el contexto sin autenticar —
// `playwright.config.ts` no declara `storageState`, así que cada test nace
// limpio; mismo patrón que 06-aviso-version-nueva.
//
// LO QUE ESTE FICHERO NO CUBRE, dicho para que nadie lo lea como cobertura
// completa: la otra causa del mismo aviso —que `signIn` falle AL ARRANCAR, sin
// llegar a redirigir— no se prueba aquí. Se podría, instrumentando el código o
// interceptando el transporte, pero el coste no lo justifica en esta ficha; se
// verificó a mano rompiendo `signIn` a propósito (ver el export de AIT-112).
test.describe("Acceso con Google", () => {
  const AVISO_VUELTA = /No se ha podido completar el inicio de sesión con Google/;

  // El aviso se busca por su TEXTO dentro del nodo con rol "alert", nunca por
  // la presencia de un `alert` a secas: en `npm run dev` la página lleva un
  // nodo `alert` del overlay de Next.js que no es nuestro (medido en AIT-94),
  // así que "hay un alert" pasaría sin que exista el aviso.
  const aviso = (page: import("@playwright/test").Page) =>
    page.getByRole("alert").filter({ hasText: AVISO_VUELTA });

  test("volver de Google sin sesión muestra el aviso", async ({ page }) => {
    await page.goto("/login?oauth=1");
    await expect(aviso(page)).toBeVisible();
  });

  // La negativa, que es la que hace que la de arriba signifique algo: sin el
  // parámetro no puede haber aviso. Sin esto, un aviso que se mostrara SIEMPRE
  // pasaría la primera prueba igual de bien.
  test("entrar a /login normal no muestra ningún aviso de Google", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeVisible();
    await expect(aviso(page)).toHaveCount(0);
  });
});

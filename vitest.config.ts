import { defineConfig } from "vitest/config";

// AIT-92 · Vitest existe en este repo SOLO para `tests/gmail-callback.test.ts`.
//
// No sustituye a nada: `npm run test:unit` (Playwright) sigue corriendo las
// pruebas puras y `npm run test:e2e` la suite de navegador. Está aquí porque
// `convex-test` —el arnés que ejercita el callback de OAuth de verdad— asume
// vitest, y sin él la aprobación de `convex-test` no se podría ejecutar.
//
// ⚠️ TRES RUNNERS EN EL REPO ES UN COSTE REAL, y queda declarado: si alguien
// quiere unificarlos, es una decisión de proceso (Factory Architect), no un
// arreglo que deba colarse en una ficha de producto.
//
// `include` es una lista de UN elemento a propósito: que este runner no se
// convierta en el sitio por defecto donde acaban las pruebas nuevas.
export default defineConfig({
  test: {
    include: ["tests/gmail-callback.test.ts"],
    server: { deps: { inline: ["convex-test"] } },
  },
});

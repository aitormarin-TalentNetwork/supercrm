import { defineConfig } from "@playwright/test";
import { PATRON_PRUEBAS_PURAS } from "./e2e/pruebas-puras";

// AIT-109 · Las pruebas de funciones puras no necesitan servidor, y aquí no lo
// tienen. Config SEPARADA, no un `projects[]` dentro de `playwright.config.ts`:
// aquel resuelve el puerto en el ámbito del módulo (`export const E2E_PORT =
// resolverPuerto()`), así que CARGARLO ya valida una precondición y aborta —
// `E2E_PORT=abc npx playwright test --list` muere sin ejecutar una sola prueba.
// Un `project` nuevo ahí dentro heredaría eso entero, que es justo lo que la
// issue prohíbe: estas pruebas no pueden depender de un puerto ni de un
// deployment.
//
// Lo que NO lleva, y cada ausencia es deliberada:
//   webServer    — no hay app que levantar. Es el punto de la tarea.
//   globalSetup  — el de e2e hace dos logins y consume cupo del limitador de
//                  intentos (AIT-108/AIT-103). Aquí no hay sesión que preparar.
//   baseURL      — no se navega a ningún sitio.
//   projects     — no hay navegador que configurar.
//
// «Puro» aquí es una propiedad MEDIDA —no necesita servidor, Convex ni sesión— y
// no una promesa de que no toque el disco: `00-instantanea-sesion` escribe en
// `os.tmpdir()` y `00-comprobadores` lanza subprocesos con `execFileSync`.
export default defineConfig({
  testDir: "./e2e",
  testMatch: PATRON_PRUEBAS_PURAS,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // `list` imprime cada prueba y el recuento final "N passed / N failed". La
  // issue lo pide explícitamente: ya nos costó un falso verde leer la salida con
  // `tail`, que devuelve el código de salida de `tail` y no el de las pruebas.
  reporter: [["list"]],
  timeout: 30_000,
  // Sin navegador no hay traza que recoger; y el proyecto tiene además la regla
  // de dejarlo en "off" porque la pantalla de login imprime la contraseña.
  use: { trace: "off", screenshot: "off", video: "off" },
});

import { defineConfig, devices } from "@playwright/test";

// Suite E2E de los 5 procesos clave del PRD §7 (AIT-26). Corre contra el
// servidor de desarrollo local (Next.js) con el deployment de Convex ya
// configurado en .env.local — no levanta un backend propio.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // los tests escriben datos reales en el mismo deployment de Convex
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});

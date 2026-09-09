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
    // AIT-93: PRECONDICIÓN DECLARADA, no heredada del shell de quien corra.
    //
    // `e2e/06-aviso-version-nueva.spec.ts` necesita que la app sirva un commit
    // conocido: sin esta variable, `lib/version.ts` devuelve `commit: null`, el
    // layout pasa `loadedCommit={null}` y el aviso de versión queda inerte —
    // que es su comportamiento CORRECTO (no hay nada con lo que comparar), pero
    // deja al spec sin nada que ejercitar.
    //
    // Va aquí y no en el `.env.local` de cada uno porque este fichero está
    // versionado: si la suite pasa en un checkout limpio, pasa para cualquiera.
    // Antes estaba fijada solo en el entorno de quien la escribió, y por eso
    // `main` estuvo en rojo sin que ninguna de las tres puertas (suite del
    // desarrollador, auditoría, build) pudiera verlo.
    //
    // El valor es un SHA ficticio pero con la forma que valida
    // `lib/version.ts` (40 hex): así el spec ejercita el camino real y no una
    // rama de validación.
    env: { RAILWAY_GIT_COMMIT_SHA: "e2e00000000000000000000000000000000e2e00" },
  },
});

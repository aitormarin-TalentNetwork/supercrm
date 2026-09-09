import { chromium, type FullConfig } from "@playwright/test";
import {
  BASE_ORIGIN,
  DEMO_ACCOUNT_LABEL,
  HOME_BY_ROLE,
  ROLES,
  type Role,
  type StorageState,
  writeStateAtomically,
} from "./authState";

// AIT-108 · UNA AUTENTICACIÓN POR CORRIDA, NO UNA POR SPEC
// ============================================================================
// Corre DESPUÉS del webServer: en el runner de Playwright, `globalSetup` va
// detrás de los plugins y el webServer es uno de ellos
// (node_modules/playwright/lib/runner/index.js, createGlobalSetupTasks).
// Comprobado en la fuente, no de memoria: si el orden fuera el contrario, este
// login iría contra un puerto muerto.
//
// ---------------------------------------------------------------------------
// EL SITIO, PREPARADO PARA TRES USOS — y solo ocupado el mío
// ---------------------------------------------------------------------------
// Las tres tareas del mismo patrón necesitan declarar una precondición aquí:
//   AIT-95  el BACKEND     — que el deployment esté vivo y con datos.
//   AIT-103 el LIMITADOR   — que el cupo de login no esté agotado.
//   AIT-108 la SESIÓN      — esta.
// Los pasos van separados y nombrados para que las otras dos añadan el suyo sin
// reordenar nada. NO implemento los suyos: preparar el sitio no es ocuparlo, y
// adelantar el trabajo de otra tarea es adelantar también sus decisiones.

async function autenticarRol(role: Role): Promise<StorageState> {
  const navegador = await chromium.launch();
  try {
    const contexto = await navegador.newContext({ baseURL: BASE_ORIGIN });
    const pagina = await contexto.newPage();

    // Mismo camino que hacía `loginAs`: el autorrelleno de cuentas de prueba de
    // /login. La suite sigue sin cablear ninguna contraseña.
    await pagina.goto("/login");
    await pagina
      .getByRole("button", { name: DEMO_ACCOUNT_LABEL[role], exact: false })
      .click();
    await pagina.getByRole("button", { name: "Entrar" }).click();
    await pagina.waitForURL(`**${HOME_BY_ROLE[role]}`);

    const estado = (await contexto.storageState()) as StorageState;

    // Control de que la instantánea sirve para algo ANTES de guardarla. Un
    // storageState sin el origen de la app compila, se escribe y se lee sin
    // error, y lo único que hace es que 26 tests se estrellen contra /login
    // treinta segundos más tarde cada uno.
    const origen = estado.origins.find((o) => o.origin === BASE_ORIGIN);
    if (!origen || origen.localStorage.length === 0) {
      throw new Error(
        `la instantánea de "${role}" no trae el localStorage de ${BASE_ORIGIN}. ` +
          `Orígenes capturados: ${estado.origins.map((o) => o.origin).join(", ") || "(ninguno)"}.`,
      );
    }
    if (estado.cookies.length === 0) {
      throw new Error(`la instantánea de "${role}" no trae ninguna cookie.`);
    }

    await contexto.close();
    return estado;
  } finally {
    await navegador.close();
  }
}

async function globalSetup(_config: FullConfig): Promise<void> {
  // PASO AIT-95 (pendiente): comprobar aquí que el backend está desplegado.
  // PASO AIT-103 (pendiente): comprobar aquí el estado del limitador.

  // PASO AIT-108: una autenticación por rol, y ese número NO crece con el
  // número de specs. Es el criterio entero de la ficha.
  for (const role of ROLES) {
    try {
      writeStateAtomically(role, await autenticarRol(role));
    } catch (causa) {
      // El mensaje nombra el rol y el origen. Sin esto, un fallo aquí se lee
      // como "la suite entera está rota" en vez de "no se pudo entrar como X".
      throw new Error(
        `[e2e] no se pudo autenticar como "${role}" contra ${BASE_ORIGIN}: ` +
          `${causa instanceof Error ? causa.message : String(causa)}`,
      );
    }
  }

  console.log(`[e2e] sesión preparada para ${ROLES.length} roles (${ROLES.join(", ")})`);
}

export default globalSetup;

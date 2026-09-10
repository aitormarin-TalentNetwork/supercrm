import { chromium } from "@playwright/test";
import { E2E_PORT } from "../playwright.config";
import {
  formatEnvLocalMessage,
  problemasDelEnvLocal,
  readEnvLocal,
} from "../scripts/check-e2e-preconditions.mjs";
import {
  capturarEstadoRodado,
  COOKIE_JWT,
  COOKIE_REFRESH,
  DEMO_ACCOUNT_LABEL,
  HOME_BY_ROLE,
  refreshTokenOf,
  ROLES,
  type Role,
  type StorageState,
  writeStateAtomically,
} from "./authState";

/** El origen que sirve la app en ESTA invocación. Se deriva del punto único de
 *  AIT-96, no de un 3000 cableado ni de una segunda tabla de puertos.
 *
 *  AIT-109 · Vive AQUÍ y no en `authState.ts` porque este fichero solo lo carga
 *  el runner e2e, donde un `E2E_PORT` válido ya es obligatorio. En `authState.ts`
 *  arrastraba a `playwright.config` a cualquiera que importara aquel módulo —
 *  incluida una prueba pura que no usa esta constante para nada— y ese import
 *  aborta la recogida entera si el puerto no vale. Es el único consumidor, así
 *  que aquí no hay «segunda tabla»: hay UN sitio, y es el que la necesita. */
const BASE_ORIGIN = `http://localhost:${E2E_PORT}`;

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

    // Capturar AQUÍ MISMO guardaría un token que esta misma página consume
    // ~850 ms después, al forzar su primer refresco. El primer test heredaría
    // un token ya usado: dentro de la ventana de 10 s pasaría, y fuera de ella
    // mataría la sesión. Se espera a la rotación y se guarda el token vigente.
    const inicial = (await contexto.storageState()) as StorageState;
    const estado = await capturarEstadoRodado(contexto, refreshTokenOf(inicial));

    // Control de que la instantánea sirve para algo ANTES de guardarla: sin
    // esto, un storageState vacío se escribe y se lee sin error, y lo único que
    // pasa es que 26 tests se estrellan contra /login treinta segundos más
    // tarde cada uno.
    for (const cookie of [COOKIE_JWT, COOKIE_REFRESH]) {
      if (!estado.cookies.some((c) => c.name === cookie)) {
        throw new Error(
          `la instantánea de "${role}" no trae la cookie ${cookie}. ` +
            `Cookies capturadas: ${estado.cookies.map((c) => c.name).join(", ") || "(ninguna)"}.`,
        );
      }
    }

    await contexto.close();
    return estado;
  } finally {
    await navegador.close();
  }
}

async function globalSetup(): Promise<void> {
  // PASO AIT-123: contra QUÉ backend corremos. Va el PRIMERO de todos, incluso
  // antes que el login, porque si el `.env.local` apunta a otro deployment el
  // resto de la corrida mide otra cosa — incluidas las cookies que capturamos
  // abajo, que serían de otro backend.
  //
  // *** POR QUÉ ESTÁ AQUÍ Y NO SOLO EN `npm run test:e2e`. ***
  // `package.json` encadena el script de precondiciones ANTES del runner, así
  // que por esa vía ya está cubierto. Pero `npx playwright test` a pelo —que es
  // la invocación que sale sola para correr un solo spec— NO pasa por ahí.
  // `globalSetup` sí corre en CUALQUIER invocación del runner e2e, así que es
  // el único sitio que cubre las dos.
  const contenidoEnv = readEnvLocal();
  if (contenidoEnv !== null) {
    const problemas = problemasDelEnvLocal(contenidoEnv);
    if (problemas.length > 0) {
      throw new Error(formatEnvLocalMessage(problemas));
    }
  }

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

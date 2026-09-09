import fs from "node:fs";
import path from "node:path";
import { E2E_PORT } from "../playwright.config";

// AIT-108 · EL CONTRATO DE LA INSTANTÁNEA DE SESIÓN
// ============================================================================
// Antes, cada spec hacía su propio `loginAs` y la suite gastaba 29 logins. Con
// las credenciales del deployment en mal estado (AIT-102), esos 29 logins son
// 29 FALLOS: la suite convierte un problema de credenciales en una cascada de
// rojos que parecen regresiones. Con una instantánea, ese mismo escenario
// produce UN fallo. El problema sigue existiendo; deja de amplificarse.
//
// Este fichero existe para que la definición viva en UN sitio. Lo importan el
// `global-setup.ts` (que escribe) y `helpers.ts` (que lee): dos copias que hoy
// coinciden y mañana divergen no fallan — siembran cosas distintas y cada mitad
// mide otra app, que es la forma de AIT-96 entrando por la puerta de atrás.

export type Role = "owner" | "sales";

/** Nombre visible en el botón de autorrelleno de /login (DEMO_ACCOUNTS en
 *  app/login/page.tsx). Se entra por la UI, igual que antes: la suite nunca
 *  cablea contraseñas. */
export const DEMO_ACCOUNT_LABEL: Record<Role, string> = {
  owner: "Marta Ledo",
  sales: "Carlos Vega",
};

/** URL a la que redirige app/page.tsx tras el login, según rol. Es la
 *  POSTCONDICIÓN de `loginAs`, y no cambia con AIT-108: los 29 puntos de
 *  llamada siguen recibiendo lo mismo. */
export const HOME_BY_ROLE: Record<Role, string> = {
  owner: "/panel",
  sales: "/hoy",
};

export const ROLES: Role[] = ["owner", "sales"];

/** El origen que sirve la app en ESTA invocación. Se deriva del punto único de
 *  AIT-96, no de un 3000 cableado ni de una segunda tabla de puertos. */
export const BASE_ORIGIN = `http://localhost:${E2E_PORT}`;

/** Ruta determinista por worktree: `e2e/` cuelga del árbol de trabajo, así que
 *  T1, T2 y T3 tienen la suya sin acordar nada. Ignorada por git: el fichero
 *  lleva tokens de sesión REALES. */
const AUTH_DIR = path.join(__dirname, ".auth");

export function statePath(role: Role): string {
  return path.join(AUTH_DIR, `${role}.json`);
}

/** Lo que Playwright guarda en un `storageState`. Se declara en vez de
 *  importarse como `any` para que un cambio de forma rompa la compilación en
 *  vez de sembrar `undefined` en silencio. */
export type StorageState = {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "Strict" | "Lax" | "None";
  }>;
  origins: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
};

/** Escritura ATÓMICA: temporal en el MISMO directorio (el rename solo es
 *  atómico dentro del mismo sistema de ficheros) y después `rename`. Un lector
 *  ve el fichero entero o no lo ve; nunca un JSON a medias. Modo 0600 porque
 *  dentro hay tokens de sesión válidos. */
export function writeStateAtomically(role: Role, state: StorageState): void {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  const destino = statePath(role);
  const temporal = `${destino}.${process.pid}.tmp`;
  fs.writeFileSync(temporal, JSON.stringify(state, null, 2), { mode: 0o600 });
  fs.renameSync(temporal, destino);
}

export function readState(role: Role): StorageState {
  const ruta = statePath(role);
  if (!fs.existsSync(ruta)) {
    // Fallar en voz alta y nombrando la causa, no devolver un estado vacío que
    // acabaría en un `waitForURL` agotándose a los 30 s sin decir por qué.
    throw new Error(
      `[e2e] no existe la instantánea de sesión de "${role}" (${ruta}). ` +
        `La escribe e2e/global-setup.ts, registrado en playwright.config.ts. ` +
        `Si corres con una config propia, regístralo también allí.`,
    );
  }
  return JSON.parse(fs.readFileSync(ruta, "utf8")) as StorageState;
}

// AIT-127 — Único punto por el que este proyecto toca `localStorage`.
//
// ⚠️ ANTES DE USARLO, LA FRONTERA (decisión del PM, 2026-09-10):
//   · SÍ: datos NO SENSIBLES, POR DISPOSITIVO, que hagan falta de forma SÍNCRONA.
//   · NO: credenciales ni tokens. Nunca.
// Que la librería de auth guarde el JWT aquí NO es un precedente que nos
// autorice: es una decisión suya que estamos investigando (AIT-133), no
// imitando. La convención está escrita en `docs/01-arquitectura.md`.
//
// 🔴 POR QUÉ ESTE FICHERO EXISTE Y NO SE LLAMA A `localStorage` DIRECTAMENTE:
// `localStorage` **no devuelve `null` donde está bloqueado — LANZA** (modo
// privado de algunos navegadores, cookies de terceros desactivadas, iframes con
// almacenamiento particionado). Si cada llamante tuviera que acordarse del
// `try/catch`, alguien se olvidaría, y en AIT-127 ese olvido tumbaría el CIERRE
// DE SESIÓN. Imposible por la forma es mejor que una puerta que lo comprueba.
//
// Las TRES operaciones lo envuelven, no solo la lectura: lanza en las tres.

/** Devuelve el valor guardado, o `null` si no hay o si el almacenamiento no
 *  está disponible. **Nunca lanza**: para quien llama, "no disponible" y "no
 *  guardado" son el mismo caso, y los dos son manejables. */
export function readDeviceValue(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Guarda el valor. Devuelve `false` si no se pudo (almacenamiento no
 *  disponible, cuota agotada). **Nunca lanza.** El booleano se devuelve para
 *  quien quiera declararlo; ignorarlo es legítimo en un mejor esfuerzo. */
export function writeDeviceValue(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Borra el valor. **Nunca lanza.** */
export function removeDeviceValue(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Sin almacenamiento no hay nada que borrar: el efecto buscado ya se da.
  }
}

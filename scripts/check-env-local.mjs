// AIT-123 — comprobar UN `.env.local` desde fuera de la suite.
//
// *** POR QUÉ EXISTE, y no es un envoltorio de conveniencia. ***
// El gate síncrono (`check-e2e-preconditions.mjs`) y el vigilante de la raíz
// (`Sorfware Factory/_vigilante-env-local.sh`) comparten un concepto —"esto es
// self-hosted", "esto es coherente"— y en la primera versión cada uno tenía SU
// copia de la condición: una en JavaScript y otra en `grep`. Al corregir el
// bypass del self-hosted arreglé la de JavaScript y **la de bash se quedó como
// estaba**, así que bastaba añadir una línea `CONVEX_SELF_HOSTED_URL` a un
// fichero Cloud dañado para saltarse el vigilante entero.
//
// **Una condición duplicada es una condición que se corrige a medias.** Este
// fichero existe para que solo haya UNA, y para que el vigilante la ejecute en
// vez de reimplementarla.
//
// CÓDIGOS DE SALIDA, los mismos tres que el vigilante y por el mismo motivo:
//   0 = coherente
//   1 = incoherente (imprime los problemas)
//   2 = NO SE PUDO COMPROBAR (no hay fichero, no se puede leer, falta un
//       argumento). Distinto de 0 a propósito: "no lo comprobé" y "está bien"
//       son dos estados, y fusionarlos es el defecto que esta tarea persigue.
//
// NO IMPRIME NINGÚN VALOR SECRETO: solo nombres de clave y las URLs públicas
// (`NEXT_PUBLIC_` lo es por definición). Ninguna otra clave se lee.

import { problemasDelEnvLocal, readEnvLocal } from "./check-e2e-preconditions.mjs";
import path from "node:path";

const ruta = process.argv[2];
if (!ruta) {
  console.error("uso: node scripts/check-env-local.mjs <ruta/al/.env.local>");
  process.exit(2);
}

// `readEnvLocal` recibe el DIRECTORIO y le añade `.env.local`, que es como lo
// usa el gate. Aquí se recibe la ruta del fichero, así que se le pasa su padre:
// una sola forma de leer, no dos.
const directorio = path.dirname(path.resolve(ruta));

let contenido;
try {
  contenido = readEnvLocal(directorio);
} catch (causa) {
  console.error(`no se pudo leer ${ruta}: ${causa.code ?? causa.message}`);
  process.exit(2);
}
if (contenido === null) {
  console.error(`no existe ${ruta}`);
  process.exit(2);
}

const problemas = problemasDelEnvLocal(contenido);
for (const p of problemas) console.log(p);
process.exit(problemas.length > 0 ? 1 : 0);

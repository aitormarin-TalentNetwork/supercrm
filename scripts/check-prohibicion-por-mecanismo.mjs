// AIT-123 — que la prohibición de `docs/03-setup.md` siga definida por el
// MECANISMO y no por un flag.
//
// *** POR QUÉ ESTE COMPROBADOR EXISTE, y no basta con haber escrito bien el
// *** documento una vez.
// El defecto que AIT-123 documenta NO lo causa `--env-file`: lo causa resolver
// el deployment por URL+admin key en vez de por nombre. Medido el 2026-09-10:
// `--url` + `--admin-key`, sin `--env-file` por ninguna parte, borra
// `CONVEX_DEPLOYMENT` y repunta las dos `NEXT_PUBLIC_*` exactamente igual.
//
// Una prohibición redactada sobre el flag **se puede cumplir causando el daño**:
// quien la lea, evite `--env-file` y use `--url`/`--admin-key` habrá obedecido la
// norma. Un gate así no es un gate. Este comprobador mide el DOCUMENTO
// RESULTANTE —no la intención de escribirlo— para que esa redacción no vuelva.
//
// *** SU LÍMITE, declarado. ***
// Mide TEXTO, así que mide la redacción y no la conducta. Una prohibición
// perfecta que nadie lea sigue sin proteger a nadie: eso lo cubre el gate
// síncrono de `check-e2e-preconditions.mjs`, que es mecanismo. Este comprobador
// cierra que el rótulo no vuelva a definir el defecto por el flag.

import { readFileSync } from "node:fs";
import path from "node:path";

/** La receta que había antes y que NO puede sobrevivir en ninguna forma. */
export const PATRON_RECETA_VIEJA = [
  /única forma de desplegar sin esa confirmación/i,
  /aísla el comando de la\s+`?CONVEX_DEPLOYMENT`?\s+local/i,
];

/** La prohibición tiene que nombrar la RESOLUCIÓN, no el flag. */
export const PATRON_MECANISMO =
  /POR URL\s*\+\s*ADMIN KEY\s+en vez de\s+POR NOMBRE/i;

/**
 * Los flags pueden aparecer —son ejemplos útiles— pero NO como definición de lo
 * prohibido. La marca de que son ejemplos y no definición es que estén dentro
 * del bloque que los declara como tales.
 */
export const MARCA_DE_EJEMPLOS = /son \*\*ejemplos, no la definición\*\*/i;

/** Los flags NUNCA definen lo prohibido. Solo pueden aparecer como ejemplos. */
export const PATRON_FLAG = /--env-file|--admin-key|--url\b/;

/** Verbos que convierten una mención en NORMA en vez de en ejemplo. */
export const PATRON_NORMATIVO =
  /prohibid|no se (usa|permite|debe)|nunca se usa|est[áa]n? permitid|se permite|puedes usar|es seguro/i;

/**
 * El bloque de ejemplos: desde la marca que los declara como tales hasta el
 * final de la lista que la sigue (primera línea que no es viñeta ni vacía).
 *
 * SE DELIMITA A PROPÓSITO, y ésta es la corrección de B1: la primera versión
 * comprobaba que la marca ESTUVIERA, en cualquier sitio. Un documento que
 * conserve la frase del mecanismo y la marca, y **añada después** «está
 * prohibido `--env-file`; `--url`/`--admin-key` están permitidos», la pasaba
 * entera. O sea que el comprobador que cierra M9 tenía el agujero de M9 dentro.
 */
export function rangoDeEjemplos(lineas) {
  const inicio = lineas.findIndex((l) => MARCA_DE_EJEMPLOS.test(l));
  if (inicio === -1) return null;
  let fin = inicio + 1;
  while (fin < lineas.length && (lineas[fin].trim() === "" || /^\s*[-*·]/.test(lineas[fin]))) fin++;
  return [inicio, fin];
}

/**
 * Problemas del documento, como lista. Vacía = cumple C6.
 *
 * PURA: recibe el CONTENIDO. Así el control adversario puede pasarle una
 * redacción fabricada sin escribirla en el repositorio.
 */
export function problemasDeLaProhibicion(contenido) {
  const problemas = [];

  for (const patron of PATRON_RECETA_VIEJA) {
    if (patron.test(contenido)) {
      problemas.push(`la receta anterior sigue viva: casa ${patron}`);
    }
  }

  if (!PATRON_MECANISMO.test(contenido)) {
    problemas.push(
      "la prohibición no está definida por el MECANISMO: no dice «por URL + admin " +
        "key en vez de por nombre». Definida por un flag, se puede cumplir causando " +
        "el daño (medido: `--url`+`--admin-key` sin `--env-file` hace lo mismo).",
    );
  }

  const lineas = contenido.split("\n");
  const rango = rangoDeEjemplos(lineas);
  if (rango === null) {
    problemas.push(
      "los flags no están marcados como ejemplos, así que funcionan como definición " +
        "de lo prohibido.",
    );
  } else {
    // TERCER RECUENTO, el que faltaba: menciones de un flag que además llevan un
    // verbo normativo y caen FUERA del bloque de ejemplos. Cada una es una norma
    // definida por flag, y una norma así se puede cumplir causando el daño.
    const [ini, fin] = rango;
    lineas.forEach((linea, i) => {
      if (i >= ini && i < fin) return;
      if (PATRON_FLAG.test(linea) && PATRON_NORMATIVO.test(linea)) {
        problemas.push(
          `línea ${i + 1}: define la norma por un FLAG y está fuera del bloque de ` +
            `ejemplos — «${linea.trim().slice(0, 90)}»`,
        );
      }
    });
  }

  return problemas;
}

export function readDoc(ruta = path.join(process.cwd(), "docs", "03-setup.md")) {
  return readFileSync(ruta, "utf8");
}

export function run({ leerDoc = readDoc, out = console.log, err = console.error } = {}) {
  let contenido;
  try {
    contenido = leerDoc();
  } catch (causa) {
    err(`[C6] no se pudo leer el documento: ${causa.message}`);
    return 1;
  }
  const problemas = problemasDeLaProhibicion(contenido);
  if (problemas.length === 0) {
    out("[C6] la prohibición está definida por mecanismo. OK.");
    return 0;
  }
  err("[C6] la prohibición de docs/03-setup.md NO cumple AIT-123:");
  for (const p of problemas) err(`  · ${p}`);
  return 1;
}

if (process.argv[1]?.endsWith("check-prohibicion-por-mecanismo.mjs")) {
  process.exitCode = run();
}

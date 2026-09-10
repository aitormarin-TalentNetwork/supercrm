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

  if (!MARCA_DE_EJEMPLOS.test(contenido)) {
    problemas.push(
      "los flags no están marcados como ejemplos, así que funcionan como definición " +
        "de lo prohibido.",
    );
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

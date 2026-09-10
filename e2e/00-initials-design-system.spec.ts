import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { initials as oraculo } from "../lib/initials";
import { TODOS } from "./casos-iniciales";

// AIT-142 — el Avatar del design system tenía la misma función de iniciales
// defectuosa que el producto antes de AIT-129, y es de donde salió la copia.
// Estas pruebas comparan LAS DOS copias del design system contra `lib/initials.ts`.
//
// ⚠️ NO se hace que el design system importe de `lib/`: `Design/` es material de
// referencia AUTÓNOMO y el producto copia DESDE él. Invertir esa dirección
// rompería lo único que lo hace útil. La duplicación es deliberada; lo que hay que
// garantizar no es que haya una copia única, sino que las copias COINCIDAN — y eso
// es justo lo que se puede medir.

const RAIZ = join(__dirname, "..");

/** Los DOS sujetos, con RUTAS distintas. Que sean dos entradas de esta tabla es lo
 *  que hace que cada una se lea, extraiga y evalúe por separado. */
const SUJETOS = [
  {
    nombre: "design-system/components/core/Avatar.jsx",
    ruta: join(RAIZ, "Design/design-system/components/core/Avatar.jsx"),
  },
  {
    nombre: "pantallas/_ds/…/_ds_bundle.js",
    ruta: join(
      RAIZ,
      "Design/pantallas/_ds/ator-design-system-crmvibecoding-ddd18410-ca27-4747-916b-31f0ee238595/_ds_bundle.js",
    ),
  },
] as const;

const ABRE = ">>> AIT-142 iniciales";
const CIERRA = "<<< AIT-142 fin iniciales";

const INSTRUMENTO = "FALLO DEL INSTRUMENTO, no del sujeto";

/** Extrae y evalúa el bloque de iniciales de un fichero.
 *
 *  LAS FASES, y por qué están separadas: una comparación tiene DOS operandos y una
 *  cadena de pasos antes de cada uno. Si un fallo de cualquiera de esos pasos se
 *  presentara como "resultado distinto", un rojo del instrumento se leería como un
 *  defecto del sujeto — y al revés, un arreglo correcto quedaría rechazado.
 *
 *    1 localizar el bloque   2 evaluarlo   3 obtener la función   4 invocarla
 *      ^ estas cuatro son INSTRUMENTO. Sólo la comparación de valores es SUJETO.
 */
function cargarInitials(ruta: string): (n: string) => string {
  let fuente: string;
  try {
    fuente = readFileSync(ruta, "utf8");
  } catch (causa) {
    throw new Error(`${INSTRUMENTO} — no se pudo leer ${ruta}: ${String(causa)}`);
  }

  const i = fuente.indexOf(ABRE);
  const f = fuente.indexOf(CIERRA);
  if (i === -1 || f === -1 || f < i) {
    throw new Error(
      `${INSTRUMENTO} — no se encontró el bloque delimitado por «${ABRE}» … «${CIERRA}» en ${ruta}`,
    );
  }
  // Se corta por LÍNEAS: el marcador va solo en la suya, así que el bloque
  // empieza en el salto siguiente al marcador de apertura y acaba en el anterior
  // al de cierre. Cortar por la posición del marcador se llevaba dentro el texto
  // del comentario y el bloque no evaluaba — y el instrumento lo reportó como
  // fallo suyo, que es exactamente para lo que están separadas las fases.
  //
  // Se evalúa VERBATIM: los dos ficheros son JS plano, así que no hay que
  // transformar nada. Probar una versión transformada sería probar otra cosa.
  const desde = fuente.indexOf("\n", i) + 1;
  const hasta = fuente.lastIndexOf("\n", f);
  const bloque = fuente.slice(desde, hasta);

  let fn: unknown;
  try {
    fn = new Function(`${bloque}; return initials;`)();
  } catch (causa) {
    throw new Error(`${INSTRUMENTO} — el bloque de ${ruta} no evalúa: ${String(causa)}`);
  }
  if (typeof fn !== "function") {
    throw new Error(
      `${INSTRUMENTO} — el bloque de ${ruta} evaluó sin error pero no entrega una función «initials» (obtenido: ${typeof fn})`,
    );
  }
  return fn as (n: string) => string;
}

test.describe("AIT-142 · las dos copias del design system coinciden con el producto", () => {
  for (const sujeto of SUJETOS) {
    test(`${sujeto.nombre} — 17 comparaciones contra lib/initials.ts`, () => {
      // Cada sujeto se carga por SU cuenta, desde SU ruta. El contador vive dentro
      // de esta prueba, así que no puede recoger vueltas del otro fichero.
      const fn = cargarInitials(sujeto.ruta);

      let comparadas = 0;
      for (const [entrada, esperado] of TODOS) {
        // Los DOS operandos se obtienen antes de comparar, y cada uno con su
        // propio manejo: una excepción del oráculo NO es un defecto del sujeto.
        let deLaCopia: string;
        try {
          deLaCopia = fn(entrada);
        } catch (causa) {
          throw new Error(`${INSTRUMENTO} — ${sujeto.nombre} lanzó al invocar con «${entrada}»: ${String(causa)}`);
        }
        let delOraculo: string;
        try {
          delOraculo = oraculo(entrada);
        } catch (causa) {
          throw new Error(`${INSTRUMENTO} — el ORÁCULO lib/initials.ts lanzó con «${entrada}»: ${String(causa)}`);
        }

        // Sólo aquí un rojo significa DEFECTO.
        expect(deLaCopia, `${sujeto.nombre} · «${entrada}»`).toBe(delOraculo);
        expect(deLaCopia, `${sujeto.nombre} · «${entrada}» (valor contractual)`).toBe(esperado);
        comparadas += 1; // se incrementa DESPUÉS de comparar, nunca antes
      }

      // El recuento va atado a la comparación: si algo de lo anterior lanzara, no
      // se llegaría aquí. 17 por CADA copia, no 34 en total — un agregado de 34 lo
      // cumpliría una copia con 34 y otra con 0, que es el caso que esta ficha
      // persigue.
      expect(comparadas, `comparaciones ejecutadas para ${sujeto.nombre}`).toBe(17);
    });
  }

  test("los dos sujetos tienen rutas distintas y funciones obtenidas por separado", () => {
    const [a, b] = SUJETOS;
    // La procedencia NO se puede acreditar comparando contenidos: los dos bloques
    // son byte a byte la misma copia, y ése es el hecho central de la ficha. Se
    // acredita por construcción: dos rutas, dos lecturas, dos evaluaciones.
    expect(a.ruta).not.toBe(b.ruta);
    expect(cargarInitials(a.ruta)).not.toBe(cargarInitials(b.ruta));
  });
});

test.describe("AIT-142 · controles del propio instrumento", () => {
  // Sin esto, «17 y 17» lo cumpliría extraer un fichero una vez y ejecutarlo dos
  // veces bajo las dos etiquetas. La aserción que lo impide es la de RUTAS
  // distintas, así que hay que probar que esa aserción sabe ponerse roja.
  test("alimentar la MISMA ruta dos veces pone roja la comprobación de procedencia", () => {
    const misma = SUJETOS[0].ruta;
    expect(() => expect(misma).not.toBe(SUJETOS[0].ruta)).toThrow();
  });

  test("un bloque sin marcadores se reporta como fallo del INSTRUMENTO", () => {
    expect(() => cargarInitials(join(RAIZ, "package.json"))).toThrow(/FALLO DEL INSTRUMENTO/);
  });

  test("una ruta inexistente se reporta como fallo del INSTRUMENTO", () => {
    expect(() => cargarInitials(join(RAIZ, "no-existe-xyz.js"))).toThrow(/FALLO DEL INSTRUMENTO/);
  });

  test("el corpus que se compara es el contractual completo", () => {
    expect(TODOS).toHaveLength(17);
  });
});

/** El corpus contractual de `initials`, en UN SOLO SITIO.
 *
 *  AIT-142. Antes vivía sólo dentro de `00-initials.spec.ts`. Al necesitarlo una
 *  segunda prueba —la que compara el Avatar del design system con el del
 *  producto— había dos salidas: copiarlo o compartirlo.
 *
 *  **Copiarlo habría creado una segunda copia que puede divergir, que es
 *  literalmente el defecto que AIT-142 arregla.** Cerrar la ficha con el
 *  mecanismo de la enfermedad. Así que se comparte.
 *
 *  No se cambia ni un caso ni un valor esperado respecto a AIT-129: se mueven.
 */

export type CasoIniciales = readonly [entrada: string, esperado: string];

/** Los que FALLABAN antes de AIT-129. Los dos primeros los reportó el QA. */
export const CASOS_DEFECTO: readonly CasoIniciales[] = [
  ["[QA] Tester — no borrar", "QB"],
  ["[QA] Prueba Tester 03-09", "QT"],
];

/** Tres CLASES distintas a propósito: corchete, dígito y otro signo. Un arreglo
 *  dirigido al `[` pasa la primera y falla las otras dos. */
export const CASOS_TRES_CLASES: readonly CasoIniciales[] = [
  ["[QA] Tester", "QT"],
  ["3M España", "ME"],
  ["& Asociados", "AS"],
];

/** CONTROL NEGATIVO: una regresión aquí no la reportaría nadie, porque nadie
 *  vuelve a mirar lo que ya funcionaba. */
export const CASOS_NORMALES: readonly CasoIniciales[] = [
  ["María Ríos", "MR"],
  ["Marta", "MA"],
  ["Carlos Ruiz Gómez", "CG"],
];

/** El arreglo puede romperlos en la dirección CONTRARIA: filtrar «lo que no es
 *  letra» con el rango ASCII se comería la Ñ y la Á. */
export const CASOS_ACENTOS: readonly CasoIniciales[] = [
  ["Ñ. Pérez", "ÑP"],
  ["Ángel Ruiz", "ÁR"],
];

export const CASOS_SEPARADORES: readonly CasoIniciales[] = [
  ["Jean-Luc Picard", "JP"],
  ["O'Neill", "ON"],
];

/** Sin ninguna letra utilizable. El fallback NO puede ser la vía de escape: si
 *  una implementación rota devolviera "?" para todo, un criterio por recuento la
 *  daría por buena. Por eso se afirman resultados exactos. */
export const CASOS_FALLBACK: readonly CasoIniciales[] = [
  ["###", "?"],
  ["03-09", "?"],
  ["", "?"],
  ["   ", "?"],
];

/** Una sola letra utilizable en toda la cadena. */
export const CASOS_UNA_LETRA: readonly CasoIniciales[] = [["3M", "M"]];

/** El corpus completo. Lo consume la prueba del design system, que compara las
 *  dos copias contra `lib/initials.ts` caso por caso. */
export const TODOS: readonly CasoIniciales[] = [
  ...CASOS_DEFECTO,
  ...CASOS_TRES_CLASES,
  ...CASOS_NORMALES,
  ...CASOS_ACENTOS,
  ...CASOS_SEPARADORES,
  ...CASOS_FALLBACK,
  ...CASOS_UNA_LETRA,
];

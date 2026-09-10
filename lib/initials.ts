/** Iniciales del avatar a partir de un nombre.
 *
 *  AIT-129. Se filtran los caracteres que no son LETRAS antes de elegir nada: el
 *  cálculo anterior tomaba el primer carácter de la primera y de la última palabra
 *  tal cual, así que `[QA] Tester — no borrar` daba `[B` y `3M España` daba `3E`.
 *
 *  `\p{L}` y no `[A-Za-z]`: con el rango ASCII, `Ñ. Pérez` o `Ángel` perderían su
 *  inicial y el arreglo introduciría un defecto nuevo en la dirección contraria.
 *
 *  `Array.from` y no índices: indexar una cadena parte por la mitad los caracteres
 *  fuera del BMP.
 */
const LETRA = /\p{L}/u;

function soloLetras(palabra: string): string {
  return Array.from(palabra)
    .filter((c) => LETRA.test(c))
    .join("");
}

export function initials(name: string): string {
  // Una palabra sin ninguna letra (`—`, `03-09`, `&`) deja de contar como palabra:
  // si no, seguiría pudiendo aportar la inicial.
  const parts = name.trim().split(/\s+/).map(soloLetras).filter(Boolean);
  if (!parts.length) return "?";

  const chars = (p: string) => Array.from(p);
  if (parts.length === 1) return chars(parts[0]).slice(0, 2).join("").toUpperCase();
  return (chars(parts[0])[0] + chars(parts[parts.length - 1])[0]).toUpperCase();
}

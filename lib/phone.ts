/**
 * Teléfonos de cliente: forma canónica de almacenamiento y forma de pintado.
 *
 * CONTRATO (AIT-80). `customers.phone` se guarda SIEMPRE normalizado, no como
 * se teclea. No hay un segundo campo derivado: hay uno solo, ya canónico.
 *
 *   - Quien ESCRIBA en `customers.phone` pasa el valor por `normalizePhone`
 *     primero. Hoy los escritores son `opportunities.createQuick` y la
 *     migración `migrations.backfillPhoneNormalized`; AIT-77 añade el tercero
 *     (editar un cliente existente). Si un escritor se salta esto, el registro
 *     queda en un formato que el índice `by_store_phone` no encuentra: no se
 *     detectará su duplicado y el buscador no lo hallará por teléfono.
 *   - Quien BUSQUE por teléfono compara contra `normalizePhone(consulta)`. La
 *     misma función en escritura, búsqueda y migración es lo que hace que las
 *     tres coincidan; usar reglas distintas las desincroniza en silencio.
 *   - Quien lo MUESTRE a una persona lo pasa por `formatPhone`, en el último
 *     paso antes de pintarlo. El valor canónico es el que viaja por props y
 *     parámetros; el formateado no se propaga (ver `lib/quotePdf.ts`, que se
 *     formatea a sí mismo en vez de recibirlo ya hecho).
 *   - Un `href="tel:"` NO se formatea: los dígitos pelados son válidos y
 *     mejores para marcar.
 */

/**
 * Deja el teléfono en su forma canónica: solo dígitos, sin el prefijo de
 * España cuando se ha escrito explícitamente como prefijo.
 *
 * Solo se recorta un `+34`/`0034` que el usuario haya TECLEADO como tal. No se
 * infiere el prefijo a partir de los dígitos: un `34600123456` sin `+` se
 * conserva entero, porque recortarle un "34" inicial por parecerse a un
 * prefijo corrompería un número extranjero legítimo que empezara por 34. Es
 * preferible no detectar un duplicado (se ve y se arregla) a corromper un
 * teléfono (no se nota hasta que alguien llama y no contesta nadie).
 *
 * Un código de país que no sea el de España se CONSERVA: `+49 30 1234` da
 * `49301234`, porque un número extranjero sí es un número distinto de uno
 * local. Asunción de "MVP = una sola tienda española" (AIT-80 §3.2); si algún
 * día hay multi-país, esto es lo que hay que revisar.
 */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const withoutPrefix = trimmed.startsWith("+34")
    ? trimmed.slice(3)
    : trimmed.startsWith("0034")
      ? trimmed.slice(4)
      : trimmed;
  return withoutPrefix.replace(/\D/g, "");
}

/**
 * Pinta un teléfono ya almacenado (canónico) para que lo lea una persona.
 *
 * CONSERVADOR SIEMPRE: si no reconoce el patrón, devuelve el valor tal cual.
 * Un número extranjero maquetado como si fuera español es peor que uno sin
 * formatear — parece un dato correcto y no lo es.
 */
export function formatPhone(stored: string): string {
  const digits = stored.replace(/\D/g, "");
  if (digits.length !== 9 || digits !== stored) return stored;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

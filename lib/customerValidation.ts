import { normalizePhone } from "./phone";

/**
 * Qué es un cliente válido: las reglas, en un solo sitio.
 *
 * CONTRATO (AIT-82). Toda puerta de escritura a `customers` valida con estas
 * funciones. Hoy son cuatro: las mutations `opportunities.createQuick` y
 * `customers.update`, y sus dos formularios (`AltaRapidaModal` y el diálogo de
 * edición de la ficha).
 *
 * POR QUÉ ESTÁ AQUÍ Y NO EN `convex/`: la mitad de los consumidores son de
 * cliente. Módulo puro, sin dependencias de Convex, igual que `lib/phone.ts` y
 * `lib/customerSource.ts` — el bundle del navegador lo importa sin arrastrar el
 * runtime del servidor.
 *
 * POR QUÉ DEVUELVEN `string | null` Y NO LANZAN: es lo que permite que el mismo
 * módulo sirva a las dos capas. El servidor hace `if (msg) throw new
 * Error(msg)`; la UI hace `setPhoneError(msg ?? "")`. Si lanzaran, cada
 * formulario necesitaría un `try/catch` por campo y la lógica volvería a estar
 * duplicada, solo que disfrazada de manejo de errores.
 *
 * DE DÓNDE VIENE: antes de AIT-82 estas reglas estaban copiadas entre 2 y 4
 * veces cada una. No divergían —las copias eran fieles— y ese era justo el
 * problema: un fallo en la regla se replicaba idéntico, y una revisión que
 * comparase las copias las veía coherentes y daba el visto bueno. Centralizar no
 * solo evita que dos copias se separen; evita que un error se propague con la
 * bendición de una revisión.
 */

export const CUSTOMER_PHONE_MIN_DIGITS = 9;
export const CUSTOMER_PHONE_MAX_DIGITS = 15;

/** Caracteres admitidos al TECLEAR un teléfono (los separadores se descartan al normalizar). */
const PHONE_CHARS_RE = /^[\d\s+()-]+$/;

/**
 * Formato de email de un CLIENTE. No confundir con el de login de un usuario
 * (`components/auth/PasswordResetDialog.tsx`), que es más laxo a propósito y
 * valida otra entidad.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCustomerName(raw: string): string | null {
  if (raw.trim().length === 0) return "El nombre es obligatorio.";
  return null;
}

/**
 * La longitud se mide sobre el valor CANÓNICO, no sobre lo tecleado.
 *
 * Antes de AIT-82 se contaban los dígitos del crudo y se guardaba
 * `normalizePhone`, que recorta un `+34`/`0034` escrito como prefijo: se validaba
 * una cadena y se persistía otra. El prefijo hacía de relleno, así que
 * `"+34 6001234"` pasaba la ventana de 9 y dejaba almacenado un teléfono de 7 —
 * uno que esta misma regla prohíbe, y que además queda fuera del índice
 * `by_store_phone`, así que su duplicado no se detecta nunca. Medir sobre lo que
 * se guarda es lo que cierra las dos cosas a la vez.
 */
export function validateCustomerPhone(raw: string): string | null {
  const phone = raw.trim();
  if (phone.length === 0) return "El teléfono es obligatorio.";
  if (!PHONE_CHARS_RE.test(phone)) {
    return "El teléfono solo puede tener números y separadores.";
  }
  const digits = normalizePhone(phone);
  if (digits.length < CUSTOMER_PHONE_MIN_DIGITS) {
    // El mensaje sale de la constante: si alguien cambia el mínimo, el texto no
    // se queda diciendo un número que ya no es cierto.
    return `Introduce un teléfono válido (${CUSTOMER_PHONE_MIN_DIGITS} dígitos).`;
  }
  if (digits.length > CUSTOMER_PHONE_MAX_DIGITS) {
    return "El teléfono es demasiado largo.";
  }
  return null;
}

/**
 * Forma en la que se guarda el email de un cliente: sin espacios, en minúsculas,
 * y `undefined` si queda vacío.
 *
 * Se exporta —en vez de dejar el `.trim().toLowerCase() || undefined` en cada
 * mutation— porque ese "vacío significa undefined" ES una regla: es lo que
 * permite BORRAR un email al editarlo (`patch` con `undefined` elimina el campo,
 * AIT-77). Repetida en cada puerta, sería otra copia que puede separarse.
 */
export function normalizeCustomerEmail(raw: string | undefined): string | undefined {
  return raw?.trim().toLowerCase() || undefined;
}

/** El email es OPCIONAL: ausente o vacío es válido. Solo se comprueba el formato del que hay. */
export function validateCustomerEmail(raw: string | undefined): string | null {
  const email = normalizeCustomerEmail(raw);
  if (email === undefined) return null;
  if (!EMAIL_RE.test(email)) return "El email no tiene un formato válido.";
  return null;
}

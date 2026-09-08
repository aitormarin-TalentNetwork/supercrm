import { internalMutation } from "./_generated/server";
import { normalizePhone } from "../lib/phone";

/**
 * AIT-80 — deja todos los `customers.phone` en su forma canónica.
 *
 * Sin esto, los clientes dados de alta ANTES del cambio no se detectan como
 * duplicados: el índice `by_store_phone` solo encuentra lo que esté
 * normalizado, y ésos son justo los clientes que originan la issue.
 *
 * ⚠️ REESCRIBE UN CAMPO CON DATOS, no rellena uno vacío. Es menos inocente
 * que una migración de campo nuevo y hay que tratarla como tal.
 *
 * IDEMPOTENTE: solo escribe donde el valor difiere del normalizado, así que
 * una segunda pasada no toca ningún documento. Nunca se sabe con seguridad si
 * una migración terminó, y correrla dos veces tiene que ser inofensivo.
 *
 * Devuelve el recuento CONTADO EN EJECUCIÓN. Nada cableado: el número de
 * clientes se mueve solo (la suite e2e crea 6 por corrida, y el QA también
 * escribe). Una migración que dice "hecho" sin decir sobre cuántos documentos
 * actuó no distingue "las normalicé todas" de "no encontré ninguna".
 *
 * VOLUMEN: recorre la tabla de una pasada. Convex acota cada transacción
 * (documentos escaneados, bytes leídos y escritos, documentos escritos), así
 * que antes de ejecutarla en un deployment hay que MEDIR cuántos clientes
 * tiene ESE deployment — el compartido y producción son cifras distintas y la
 * primera no predice la segunda. Si el volumen se acercara a cualquiera de
 * los límites, esto pasa a paginarse con cursor.
 */
export const backfillPhoneNormalized = internalMutation({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect();

    let actualizados = 0;
    let yaCorrectos = 0;

    for (const customer of customers) {
      const canonical = normalizePhone(customer.phone);
      if (canonical === customer.phone) {
        yaCorrectos += 1;
        continue;
      }
      await ctx.db.patch(customer._id, { phone: canonical });
      actualizados += 1;
    }

    return { total: customers.length, actualizados, yaCorrectos };
  },
});

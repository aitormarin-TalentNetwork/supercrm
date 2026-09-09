import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { isStoreWideRole } from "./access";
import { normalizePhone } from "../../lib/phone";

/**
 * "¿Ya hay un cliente de esta tienda con este teléfono?" — la DETECCIÓN, sin el
 * aviso.
 *
 * AIT-88 la saca de `opportunities.createQuick`, donde nació con AIT-80, porque
 * ahora hay DOS puertas que la necesitan: dar de alta una venta y dar de alta un
 * contacto suelto. La consulta es la misma; **lo que se ofrece hacer después no**.
 *
 * Y ese matiz es justo lo que se pasó por alto al planificar AIT-88: "reutilizar
 * la detección" y "reutilizar el aviso" no son lo mismo. La detección es esta
 * consulta y no sabe qué se va a crear luego; el aviso es una UI cuyos botones
 * ejecutan mutations. Reutilizar el aviso tal cual habría hecho que la vía creada
 * para NO meter ventas en el pipeline creara una al aceptar un duplicado.
 */

export type DuplicateMatch = { customerId: Doc<"customers">["_id"]; name: string };

export type DuplicateCheck = {
  /** Los que ESTE usuario puede ver, del más antiguo al más nuevo. */
  matches: DuplicateMatch[];
  /** Si existe alguno que no puede ver. Booleano a propósito — ver abajo. */
  otherOwnerMatch: boolean;
  /** Si hay alguna coincidencia, accesible o no. */
  hasAny: boolean;
};

export async function findCustomersByPhone(
  ctx: QueryCtx | MutationCtx,
  user: Doc<"users">,
  phone: string,
): Promise<DuplicateCheck> {
  // .collect() y NUNCA .unique(): esta clave admite repetidos. La tabla ya
  // contiene duplicados anteriores a AIT-80 (son el motivo de aquella issue) y
  // el backfill los normaliza al mismo valor, así que varias filas compartiendo
  // `storeId + phone` es el caso ESPERADO, no el raro. .first() tampoco vale:
  // escogería arbitrariamente, pudiendo coger uno ajeno habiendo uno accesible.
  const canonicalPhone = normalizePhone(phone);
  const phoneMatches = await ctx.db
    .query("customers")
    .withIndex("by_store_phone", (q) =>
      q.eq("storeId", user.storeId).eq("phone", canonicalPhone),
    )
    .collect();

  // Mismo criterio de acceso que customers.getFicha y createForCustomer. La
  // consulta ya va acotada por storeId, así que solo queda el segundo término:
  // para owner y storeManager TODO match es accesible y `otherOwnerMatch` no
  // llega a darse nunca.
  const accessible = phoneMatches
    .filter((c) => isStoreWideRole(user) || c.ownerId === user._id)
    // Del más antiguo al más nuevo: el primero es el registro original y los
    // siguientes los duplicados que nacieron después. Es una AYUDA VISUAL, no
    // una selección automática — elige la persona, que es quien sabe cuál es la
    // ficha buena para continuar el historial (auditoría AIT-80 ronda 1).
    .sort((a, b) => a._creationTime - b._creationTime);

  return {
    matches: accessible.map((c) => ({ customerId: c._id, name: c.name })),
    // BOOLEANO A PROPÓSITO, nunca un recuento ni una lista: un `sales` no puede
    // ver los clientes de otro comercial, y de los ajenos no puede salir ni el
    // id, ni el nombre, ni el propietario, NI CUÁNTOS son. Lo único que se le
    // revela es que ese teléfono —que él acaba de teclear, o sea que ya lo
    // conocía— existe en la tienda. Excepción consciente al modelo de permisos
    // (AIT-80 §3.5): sin este aviso, dos comerciales trabajarían al mismo
    // cliente sin saberlo y su historial quedaría partido en dos fichas.
    //
    // AIT-88 añade una consecuencia que hay que conservar: en modo contacto, la
    // UI ofrece NAVEGAR a la ficha de una coincidencia. Esa navegación solo
    // puede ofrecerse sobre `matches` —los accesibles—, nunca sobre una ficha
    // ajena, o el aviso pasaría de "existe alguien" a "aquí lo tienes".
    otherOwnerMatch: accessible.length < phoneMatches.length,
    hasAny: phoneMatches.length > 0,
  };
}

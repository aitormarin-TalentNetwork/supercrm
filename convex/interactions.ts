import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./model/access";

// Historial de interacciones de un cliente para la Ficha de cliente
// (AIT-11). Estará vacío hasta que exista una mutation para crear
// interacciones (AIT-19, Fase 4) — no se rellena con datos de prueba.
// Mismo criterio de acceso que customers.getFicha: misma tienda, y si es
// sales, solo si el cliente es suyo. Se revalida aquí (no basta con que la
// UI ya haya llamado a getFicha) porque es una query pública independiente.
export const listByCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, { customerId }) => {
    const user = await requireUser(ctx);
    const customer = await ctx.db.get(customerId);
    if (customer === null) return null;
    if (customer.storeId !== user.storeId) return null;
    if (user.role !== "owner" && customer.ownerId !== user._id) return null;

    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId))
      .collect();

    return interactions
      .sort((a, b) => b.occurredAt - a.occurredAt)
      .map((i) => ({
        id: i._id,
        type: i.type,
        note: i.note,
        occurredAt: i.occurredAt,
      }));
  },
});

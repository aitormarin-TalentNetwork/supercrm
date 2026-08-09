import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./model/access";

// Datos del cliente y sus oportunidades para la Ficha de cliente (AIT-11).
// El historial de interacciones es una query aparte (convex/interactions.ts),
// un archivo por entidad — ver docs/01-arquitectura.md. Mismo criterio de
// acceso que opportunities.getSummary: misma tienda, y si es sales, solo
// lo suyo.
export const getFicha = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, { customerId }) => {
    const user = await requireUser(ctx);
    const customer = await ctx.db.get(customerId);
    if (customer === null) return null;
    if (customer.storeId !== user.storeId) return null;
    if (user.role !== "owner" && customer.ownerId !== user._id) return null;

    const [owner, store, opportunities] = await Promise.all([
      ctx.db.get(customer.ownerId),
      ctx.db.get(customer.storeId),
      ctx.db
        .query("opportunities")
        .withIndex("by_customer", (q) => q.eq("customerId", customerId))
        .collect(),
    ]);

    return {
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email ?? null,
        source: customer.source,
        ownerName: owner?.name ?? null,
        storeName: store?.name ?? null,
      },
      opportunities: opportunities
        .sort((a, b) => b.lastActivityAt - a.lastActivityAt)
        .map((o) => ({
          id: o._id,
          interest: o.interest ?? null,
          stage: o.stage,
          status: o.status,
          estimatedAmount: o.estimatedAmount ?? null,
        })),
    };
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isStoreWideRole, requireOwner, requireUser } from "./model/access";

// Datos del cliente y sus oportunidades para la Ficha de cliente (AIT-11).
// El historial de interacciones es una query aparte (convex/interactions.ts),
// un archivo por entidad — ver docs/01-arquitectura.md. Mismo criterio de
// acceso que opportunities.getSummary: misma tienda, y si no ve toda la
// tienda (isStoreWideRole), solo lo suyo.
export const getFicha = query({
  // AIT-70: `v.string()` + `normalizeId`, no `v.id("customers")` — ver la
  // nota igual en opportunities.ts:getSummary.
  args: { customerId: v.string() },
  handler: async (ctx, { customerId: rawCustomerId }) => {
    const user = await requireUser(ctx);
    const customerId = ctx.db.normalizeId("customers", rawCustomerId);
    if (customerId === null) return null;
    const customer = await ctx.db.get(customerId);
    if (customer === null) return null;
    if (customer.storeId !== user.storeId) return null;
    if (!isStoreWideRole(user) && customer.ownerId !== user._id) return null;

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

// Listado de clientes para la pantalla "Clientes" (AIT-58, Post-MVP —
// gap encontrado en la auditoría de cierre del MVP: la ficha individual
// existía pero no había forma de listar todos los clientes). Mismo
// criterio de acceso que getFicha: la tienda entera si es un rol
// store-wide, solo los propios si no.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const customers = isStoreWideRole(user)
      ? await ctx.db
          .query("customers")
          .withIndex("by_store", (q) => q.eq("storeId", user.storeId))
          .collect()
      : await ctx.db
          .query("customers")
          .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
          .collect();

    const ownerIds = Array.from(new Set(customers.map((c) => c.ownerId)));
    const owners = await Promise.all(ownerIds.map((id) => ctx.db.get(id)));
    const ownerNameById = new Map(
      owners
        .filter((o): o is NonNullable<typeof o> => o !== null)
        .map((o) => [o._id, o.name ?? null]),
    );

    return customers
      .map((c) => ({
        id: c._id,
        name: c.name,
        phone: c.phone,
        email: c.email ?? null,
        source: c.source,
        ownerName: ownerNameById.get(c.ownerId) ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  },
});

// AIT-65: eliminar un cliente — solo `owner`. Bloquea (no cascada) si
// tiene oportunidades. Sin comprobación adicional de interacciones/
// recordatorios: ambos exigen una oportunidad existente para crearse, así
// que un cliente sin oportunidades no puede tenerlos (ver plan-loop1,
// "investigación previa").
export const remove = mutation({
  args: { customerId: v.id("customers") },
  handler: async (ctx, { customerId }) => {
    const user = await requireOwner(ctx);
    const customer = await ctx.db.get(customerId);
    if (customer === null || customer.storeId !== user.storeId) {
      throw new Error("Cliente no encontrado.");
    }

    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId))
      .collect();
    if (opportunities.length > 0) {
      throw new Error(
        `No se puede eliminar: tiene ${opportunities.length} oportunidad(es) asociada(s). Bórralas o reasígnalas primero.`,
      );
    }

    await ctx.db.delete(customerId);
  },
});

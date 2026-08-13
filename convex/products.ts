import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwner, requireUser } from "./model/access";

// Techo puramente defensivo, mismo criterio que MAX_AMOUNT en
// convex/opportunities.ts y convex/quotes.ts — bloquea envíos directos con
// precios absurdos sin depender de que el formulario valide.
const MAX_PRICE = 100_000_000;

// Catálogo de productos (AIT-29, Post-MVP). Lectura para toda la tienda
// (Carlos lo necesita para construir presupuestos); solo Marta lo
// administra — ver mutations más abajo.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const products = await ctx.db
      .query("products")
      .withIndex("by_store", (q) => q.eq("storeId", user.storeId))
      .collect();
    return products
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
      .map((p) => ({ id: p._id, name: p.name, price: p.price }));
  },
});

function validateProductInput(name: string, price: number) {
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    throw new Error("El nombre del producto es obligatorio.");
  }
  if (!Number.isFinite(price) || price < 0 || price > MAX_PRICE) {
    throw new Error("El precio no es válido.");
  }
  return { name: trimmedName, price: Math.round(price * 100) / 100 };
}

export const create = mutation({
  args: { name: v.string(), price: v.number() },
  handler: async (ctx, args) => {
    const user = await requireOwner(ctx);
    const { name, price } = validateProductInput(args.name, args.price);
    return await ctx.db.insert("products", { name, price, storeId: user.storeId });
  },
});

// "No encontrado" cubre tanto que no exista como que sea de otra tienda —
// mismo criterio que el resto del proyecto (ver convex/opportunities.ts):
// no se distingue el motivo para no filtrar qué IDs existen.
export const update = mutation({
  args: { productId: v.id("products"), name: v.string(), price: v.number() },
  handler: async (ctx, args) => {
    const user = await requireOwner(ctx);
    const product = await ctx.db.get(args.productId);
    if (product === null || product.storeId !== user.storeId) {
      throw new Error("Producto no encontrado.");
    }
    const { name, price } = validateProductInput(args.name, args.price);
    await ctx.db.patch(args.productId, { name, price });
  },
});

// Eliminar un producto del catálogo no afecta a los presupuestos que ya lo
// usaron: cada línea de convex/schema.ts:quotes.lines guarda su propia foto
// de productName/unitPrice en el momento de añadirla, no una referencia
// viva — no hace falta comprobar ni bloquear por presupuestos existentes.
export const remove = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const user = await requireOwner(ctx);
    const product = await ctx.db.get(args.productId);
    if (product === null || product.storeId !== user.storeId) {
      throw new Error("Producto no encontrado.");
    }
    await ctx.db.delete(args.productId);
  },
});

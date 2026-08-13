import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwner, requireStoreAccess } from "./model/access";

export const getStoreInfo = query({
  args: { storeId: v.optional(v.id("stores")) },
  handler: async (ctx, args) => {
    const { storeId } = await requireStoreAccess(ctx, args.storeId);
    const store = await ctx.db.get(storeId);
    if (store === null) throw new Error("Tienda no encontrada.");
    return { name: store.name };
  },
});

// AIT-31 (multi-tienda): contrato mínimo para el selector de tienda del
// frontend — solo `owner` ve el negocio entero, `storeManager` y `sales`
// no necesitan (ni deben) enumerar tiendas ajenas a la suya.
export const listStores = query({
  args: {},
  handler: async (ctx) => {
    await requireOwner(ctx);
    const stores = await ctx.db.query("stores").collect();
    return stores.map((store) => ({ id: store._id, name: store.name }));
  },
});

function validateStoreName(name: string) {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error("El nombre de la tienda es obligatorio.");
  }
  return trimmed;
}

// Alta de tienda (AIT-31): solo `owner` — abrir una tienda nueva es una
// decisión del negocio entero, no algo que le corresponda a quien ya
// gestiona una tienda concreta. No asigna ningún usuario todavía: eso lo
// resuelve por separado el alta de cuentas (fuera de este archivo).
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const name = validateStoreName(args.name);
    return await ctx.db.insert("stores", { name });
  },
});

export const update = mutation({
  args: { storeId: v.id("stores"), name: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const name = validateStoreName(args.name);
    const store = await ctx.db.get(args.storeId);
    if (store === null) throw new Error("Tienda no encontrada.");
    await ctx.db.patch(args.storeId, { name });
  },
});

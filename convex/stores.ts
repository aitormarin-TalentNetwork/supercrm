import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireOwner, requireStoreAccess } from "./model/access";

export const getStoreInfo = query({
  args: { storeId: v.optional(v.id("stores")) },
  handler: async (ctx, args) => {
    const { storeId } = await requireStoreAccess(ctx, args.storeId);
    const store = await ctx.db.get(storeId);
    if (store === null) throw new Error("Tienda no encontrada.");
    return {
      // AIT-61: la UI de Ajustes necesita el storeId para llamar a
      // generateLogoUploadUrl/setLogo/removeLogo con la tienda correcta.
      storeId: store._id,
      name: store.name,
      logoUrl: store.logoStorageId
        ? await ctx.storage.getUrl(store.logoStorageId)
        : null,
    };
  },
});

// AIT-61: URL de subida de un solo uso para el logo — la validación real
// del contenido (¿es de verdad una imagen PNG/JPEG?) ocurre después, en
// la action `storesLogo.setLogo`, no aquí (esta mutation no tiene forma
// de inspeccionar el archivo hasta que el POST a la URL ya lo ha dejado
// en `ctx.storage`).
export const generateLogoUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireOwner(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// AIT-61 (auditoría, plan ronda 4, M1 / ronda 5, M2): la action
// `storesLogo.setLogo` ya validó rol, existencia de tienda y contenido
// real del archivo (decodificándolo de verdad) antes de llamar aquí —
// esta internal mutation solo aplica el cambio. Mantiene la lógica
// idempotente de "no borrar el storageId nuevo si coincide con el
// anterior" (ronda 1, M3) y repite el chequeo de tienda-no-encontrada
// como respaldo ante una tienda borrada en la ventana entre ambas
// llamadas, borrando el objeto recién subido en ese caso para no dejarlo
// huérfano.
export const applyLogo = internalMutation({
  args: { storeId: v.id("stores"), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (store === null) {
      await ctx.storage.delete(args.storageId);
      throw new Error("Tienda no encontrada.");
    }
    const previousStorageId = store.logoStorageId;
    await ctx.db.patch(args.storeId, { logoStorageId: args.storageId });
    if (
      previousStorageId !== undefined &&
      previousStorageId !== args.storageId
    ) {
      await ctx.storage.delete(previousStorageId);
    }
  },
});

export const removeLogo = mutation({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const store = await ctx.db.get(args.storeId);
    if (store === null) throw new Error("Tienda no encontrada.");
    if (store.logoStorageId !== undefined) {
      await ctx.storage.delete(store.logoStorageId);
      await ctx.db.patch(args.storeId, { logoStorageId: undefined });
    }
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

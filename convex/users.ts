import { v } from "convex/values";
import { createAccount, getAuthUserId } from "@convex-dev/auth/server";
import { internalAction, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const ensureDefaultStore = internalMutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const existing = await ctx.db
      .query("appConfig")
      .withIndex("by_key", (q) => q.eq("key", "default_store"))
      .unique();
    if (existing?.storeId !== undefined) {
      console.warn(
        `ensureDefaultStore: ya existe (storeId=${existing.storeId}); no se crea de nuevo.`,
      );
      return existing.storeId;
    }
    const storeId = await ctx.db.insert("stores", { name });
    if (existing) await ctx.db.patch(existing._id, { storeId });
    else await ctx.db.insert("appConfig", { key: "default_store", storeId });
    return storeId;
  },
});

export const bootstrapInitialAccounts = internalAction({
  args: {},
  handler: async (ctx) => {
    const ownerPassword = process.env.SEED_OWNER_PASSWORD;
    const salesPassword = process.env.SEED_SALES_PASSWORD;
    if (!ownerPassword || !salesPassword) {
      throw new Error(
        "Faltan SEED_OWNER_PASSWORD / SEED_SALES_PASSWORD en el deployment de Convex.",
      );
    }
    const storeId = await ctx.runMutation(internal.users.ensureDefaultStore, {
      name: "Tienda principal",
    });

    // Direcciones exactamente como en Design/pantallas/Login.dc.html.
    await createAccount(ctx, {
      provider: "password",
      account: { id: "marta@supercrm.es", secret: ownerPassword },
      profile: {
        email: "marta@supercrm.es",
        name: "Marta",
        role: "owner" as const,
        storeId,
      },
    });
    await createAccount(ctx, {
      provider: "password",
      account: { id: "carlos@supercrm.es", secret: salesPassword },
      profile: {
        email: "carlos@supercrm.es",
        name: "Carlos",
        role: "sales" as const,
        storeId,
      },
    });
  },
});

export const getCurrentUserRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return (await ctx.db.get(userId))?.role ?? null;
  },
});

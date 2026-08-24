import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUser } from "./model/access";

// AIT-57: da de alta (o refresca) la suscripción de Web Push del
// navegador/dispositivo actual. Upsert por `endpoint` (no por usuario):
// un mismo endpoint solo puede pertenecer a un dispositivo/navegador a la
// vez, así que si ya existe se reasigna al usuario que lo está pidiendo
// ahora (p.ej. un móvil de tienda compartido donde ha iniciado sesión
// otra cuenta) en vez de duplicar la fila.
export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: user._id,
        p256dh: args.p256dh,
        auth: args.auth,
      });
      return;
    }
    await ctx.db.insert("pushSubscriptions", {
      userId: user._id,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      createdAt: Date.now(),
    });
  },
});

// AIT-57: da de baja la suscripción del navegador/dispositivo actual.
// No-op silencioso (no error) si el endpoint ya no existe o pertenece a
// otro usuario — desactivar algo que ya no está ahí no debe romper el
// botón "Desactivar" del cliente.
export const unsubscribe = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .unique();
    if (existing && existing.userId === user._id) {
      await ctx.db.delete(existing._id);
    }
  },
});

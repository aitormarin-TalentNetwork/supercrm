import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requireUser } from "./model/access";
import type { Doc, Id } from "./_generated/dataModel";

// Techo puramente defensivo (no una regla de negocio real), mismo criterio
// que MAX_AMOUNT en convex/opportunities.ts — bloquea envíos directos con
// importes absurdos sin depender de que el formulario valide.
const MAX_AMOUNT = 100_000_000;

// Decisión de diseño para "cuál es el presupuesto activo" (docs/02-modelo-
// de-datos.md §1: quotes es "0..n, 1 activa"): AIT-21 pide explícitamente
// "Presupuesto simple (sin catálogo de productos ni PDF)" y la propia
// mutation que pide el brief es "si no existe, créalo; si ya existe,
// actualiza importe y estado" — es decir, en esta versión simple hay como
// mucho UNA fila de quotes por oportunidad, siempre: la primera llamada
// inserta, cualquier llamada posterior actualiza esa misma fila en vez de
// crear un histórico de revisiones. No hace falta ningún criterio de
// desempate entre varias filas porque nunca puede haber más de una para la
// misma oportunidad. Si en el futuro se necesita un histórico real de
// revisiones de presupuesto, esto habrá que revisarlo — hoy no se pide.
async function loadOpportunityOrNull(
  ctx: QueryCtx | MutationCtx,
  user: Doc<"users">,
  opportunityId: Id<"opportunities">,
) {
  const opportunity = await ctx.db.get(opportunityId);
  if (opportunity === null) return null;
  if (opportunity.storeId !== user.storeId) return null;
  if (user.role !== "owner" && opportunity.ownerId !== user._id) return null;
  return opportunity;
}

// Query de solo lectura: si no hay acceso a la oportunidad, o si todavía no
// se ha creado ningún presupuesto para ella, devuelve null en ambos casos
// — mismo patrón que opportunities.getSummary con "nextStep": el llamador
// ya validó el acceso a la oportunidad por su cuenta (getSummary) antes de
// pedir esto, así que aquí no hace falta distinguir el motivo.
export const getForOpportunity = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, { opportunityId }) => {
    const user = await requireUser(ctx);
    const opportunity = await loadOpportunityOrNull(ctx, user, opportunityId);
    if (opportunity === null) return null;

    const quote = await ctx.db
      .query("quotes")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", opportunityId))
      .unique();
    if (quote === null) return null;

    return {
      amount: quote.amount,
      status: quote.status,
      sentAt: quote.sentAt,
    };
  },
});

// Registra o actualiza el presupuesto de una oportunidad (AIT-21). Mismo
// criterio de acceso que el resto de mutations de oportunidades: lanza en
// vez de devolver null, porque aquí sí se va a escribir.
export const upsertForOpportunity = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    amount: v.number(),
    status: v.union(
      v.literal("sent"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
  },
  handler: async (ctx, { opportunityId, amount, status }) => {
    const user = await requireUser(ctx);
    const opportunity = await loadOpportunityOrNull(ctx, user, opportunityId);
    if (opportunity === null) throw new Error("Oportunidad no encontrada.");

    if (!Number.isFinite(amount) || amount < 0 || amount > MAX_AMOUNT) {
      throw new Error("El importe no es válido.");
    }
    const roundedAmount = Math.round(amount * 100) / 100;

    const existing = await ctx.db
      .query("quotes")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", opportunityId))
      .unique();

    if (existing !== null) {
      // sentAt NO se toca aquí a propósito: registra cuándo se creó/envió
      // este presupuesto por primera vez, no la última vez que se editó su
      // importe o estado (p. ej. al marcarlo "aceptado" más tarde).
      await ctx.db.patch(existing._id, { amount: roundedAmount, status });
      return existing._id;
    }

    return await ctx.db.insert("quotes", {
      opportunityId,
      amount: roundedAmount,
      status,
      sentAt: Date.now(),
    });
  },
});

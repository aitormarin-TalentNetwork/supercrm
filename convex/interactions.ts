import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./model/access";
import { closePendingNextSteps, loadOpenOpportunityOrThrow } from "./opportunities";

// Historial de interacciones de un cliente para la Ficha de cliente
// (AIT-11), a través de todas sus oportunidades. Mismo criterio de acceso
// que customers.getFicha: misma tienda, y si es sales, solo si el cliente
// es suyo. Se revalida aquí (no basta con que la UI ya haya llamado a
// getFicha) porque es una query pública independiente.
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

// Historial de interacciones de UNA oportunidad para el Detalle de
// oportunidad (AIT-13) — no confundir con listByCustomer (AIT-11), que es
// el historial completo del cliente a través de todas sus oportunidades.
// Mismo criterio de acceso que opportunities.getSummary: misma tienda, y
// si es sales, solo lo suyo.
export const listByOpportunity = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, { opportunityId }) => {
    const user = await requireUser(ctx);
    const opportunity = await ctx.db.get(opportunityId);
    if (opportunity === null) return null;
    if (opportunity.storeId !== user.storeId) return null;
    if (user.role !== "owner" && opportunity.ownerId !== user._id) return null;

    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", opportunityId))
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

// Regla 2 (docs/02-modelo-de-datos.md §5): registrar una interacción
// actualiza lastActivityAt de la oportunidad y cierra/crea su próximo
// paso — mismo flujo que changeStage (convex/opportunities.ts): valida
// oportunidad abierta, cierra el paso accionable anterior con
// closePendingNextSteps y crea el que sigue. Aquí el paso nuevo lo decide
// quien registra la interacción (acción y fecha editables en el modal, ver
// components/crm/RegistrarInteraccionModal.tsx), no una tabla fija por
// etapa como en changeStage.
//
// Idempotente por clientRequestId (ronda de auditoría 1, mayor #1): a
// diferencia de changeStage/markWon/markLost (un PATCH sobre un doc
// existente, que un reintento simplemente repite sin duplicar), esta
// mutation SÍ inserta filas nuevas (interactions, nextSteps) — si el
// servidor confirma pero la respuesta se pierde, el modal reintenta con
// la MISMA clave y sin esto duplicaría la entrada del historial y
// volvería a sustituir el próximo paso. Mismo mecanismo que
// opportunities.createQuick + opportunityRequests.
export const create = mutation({
  args: {
    clientRequestId: v.string(),
    opportunityId: v.id("opportunities"),
    type: v.union(
      v.literal("llamada"),
      v.literal("whatsapp"),
      v.literal("email"),
      v.literal("visita"),
    ),
    note: v.string(),
    occurredAt: v.number(),
    nextStepAction: v.string(),
    nextStepDueDate: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Antes de validar nada de la oportunidad (ronda de auditoría 2,
    // mayor #1): si esta clave ya se procesó, el trabajo ya está hecho —
    // no importa si la oportunidad ha cambiado de estado DESPUÉS de aquel
    // envío original (p.ej. otra sesión la cerró mientras la respuesta se
    // perdía de camino al cliente). Comprobarlo después de
    // loadOpenOpportunityOrThrow haría que un reintento de un envío ya
    // completado fallara con "La oportunidad ya está cerrada" — un falso
    // fallo de una operación que en realidad ya tuvo éxito.
    const existingRequests = await ctx.db
      .query("interactionRequests")
      .withIndex("by_client_request_id", (q) =>
        q.eq("clientRequestId", args.clientRequestId),
      )
      .collect();
    if (existingRequests.some((r) => r.userId === user._id)) return;

    const opportunity = await loadOpenOpportunityOrThrow(
      ctx,
      user,
      args.opportunityId,
    );

    const nextStepAction = args.nextStepAction.trim();
    if (nextStepAction.length === 0) {
      throw new Error("La acción del próximo paso es obligatoria.");
    }
    if (!Number.isFinite(args.occurredAt)) {
      throw new Error("La fecha de la interacción no es válida.");
    }
    if (!Number.isFinite(args.nextStepDueDate)) {
      throw new Error("La fecha del próximo paso no es válida.");
    }

    const interactionId = await ctx.db.insert("interactions", {
      opportunityId: args.opportunityId,
      customerId: opportunity.customerId,
      type: args.type,
      note: args.note.trim(),
      occurredAt: args.occurredAt,
      authorId: user._id,
    });
    await ctx.db.insert("interactionRequests", {
      clientRequestId: args.clientRequestId,
      userId: user._id,
      interactionId,
    });

    // max(), no siempre Date.now(): occurredAt puede registrarse a
    // posteriori (una llamada de ayer que se anota hoy). Si esa fecha es
    // más antigua que la última actividad ya registrada, no debe
    // retroceder lastActivityAt — regresaría el indicador de riesgo aunque
    // haya habido actividad más reciente después (p.ej. un cambio de
    // etapa posterior a la llamada que se está anotando ahora).
    await ctx.db.patch(args.opportunityId, {
      lastActivityAt: Math.max(opportunity.lastActivityAt, args.occurredAt),
    });
    await closePendingNextSteps(ctx, args.opportunityId);
    await ctx.db.insert("nextSteps", {
      opportunityId: args.opportunityId,
      action: nextStepAction,
      dueDate: args.nextStepDueDate,
      status: "pending",
      assigneeId: opportunity.ownerId,
    });
  },
});

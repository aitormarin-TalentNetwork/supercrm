import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { isStoreWideRole, requireOwner, requireUser } from "./model/access";
import { closePendingNextSteps, loadOpenOpportunityOrThrow } from "./opportunities";
import type { Id } from "./_generated/dataModel";

// AIT-20: nombre del autor de una interacción para el historial. Mismo
// chequeo de tienda cruzada que el resto de relaciones expuestas en
// listados (cliente en opportunities.listOpen, comercial en
// dashboard.getWorkloadByOwner...): en uso normal authorId siempre es
// quien registró la interacción (interactions.create fija authorId =
// usuario autenticado, ya validado contra esta misma tienda en ese
// momento), pero el schema no obliga a que siga siéndolo — se comprueba
// en vez de asumirlo. "Usuario" es el resto de casos sin nombre resoluble
// (borrado, tienda distinta, o sin `name` ni `email`).
async function resolveAuthorName(
  ctx: QueryCtx,
  authorId: Id<"users">,
  storeId: Id<"stores">,
): Promise<string> {
  const author = await ctx.db.get(authorId);
  if (author === null || author.storeId !== storeId) return "Usuario";
  return author.name?.trim() || author.email || "Usuario";
}

// Historial de interacciones de un cliente para la Ficha de cliente
// (AIT-11), a través de todas sus oportunidades. Mismo criterio de acceso
// que customers.getFicha: misma tienda, y si es sales, solo si el cliente
// es suyo. Se revalida aquí (no basta con que la UI ya haya llamado a
// getFicha) porque es una query pública independiente.
export const listByCustomer = query({
  // AIT-70: `v.string()` + `normalizeId` — ver la nota en
  // opportunities.ts:getSummary.
  args: { customerId: v.string() },
  handler: async (ctx, { customerId: rawCustomerId }) => {
    const user = await requireUser(ctx);
    const customerId = ctx.db.normalizeId("customers", rawCustomerId);
    if (customerId === null) return null;
    const customer = await ctx.db.get(customerId);
    if (customer === null) return null;
    if (customer.storeId !== user.storeId) return null;
    if (!isStoreWideRole(user) && customer.ownerId !== user._id) return null;

    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId))
      .collect();

    const sorted = interactions.sort((a, b) => b.occurredAt - a.occurredAt);
    return Promise.all(
      sorted.map(async (i) => ({
        id: i._id,
        type: i.type,
        note: i.note,
        occurredAt: i.occurredAt,
        author: await resolveAuthorName(ctx, i.authorId, user.storeId),
      })),
    );
  },
});

// Historial de interacciones de UNA oportunidad para el Detalle de
// oportunidad (AIT-13) — no confundir con listByCustomer (AIT-11), que es
// el historial completo del cliente a través de todas sus oportunidades.
// Mismo criterio de acceso que opportunities.getSummary: misma tienda, y
// si es sales, solo lo suyo.
export const listByOpportunity = query({
  // AIT-70: `v.string()` + `normalizeId` — ver la nota en
  // opportunities.ts:getSummary.
  args: { opportunityId: v.string() },
  handler: async (ctx, { opportunityId: rawOpportunityId }) => {
    const user = await requireUser(ctx);
    const opportunityId = ctx.db.normalizeId("opportunities", rawOpportunityId);
    if (opportunityId === null) return null;
    const opportunity = await ctx.db.get(opportunityId);
    if (opportunity === null) return null;
    if (opportunity.storeId !== user.storeId) return null;
    if (!isStoreWideRole(user) && opportunity.ownerId !== user._id) return null;

    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", opportunityId))
      .collect();

    const sorted = interactions.sort((a, b) => b.occurredAt - a.occurredAt);
    return Promise.all(
      sorted.map(async (i) => ({
        id: i._id,
        type: i.type,
        note: i.note,
        occurredAt: i.occurredAt,
        author: await resolveAuthorName(ctx, i.authorId, user.storeId),
      })),
    );
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

// AIT-65: eliminar una interacción — solo `owner`. Sin restricción de
// `status` de la oportunidad (a diferencia de `create`, que exige
// `loadOpenOpportunityOrThrow`) — se puede borrar una interacción de una
// oportunidad ya cerrada. Sin hijos que comprobar (la issue lo dice
// literal: "una interacción no tiene hijos").
//
// Hallazgo de auditoría (ronda 1, Major M1): borrar la interacción que
// fijó `lastActivityAt` (el máximo acumulado que actualiza `create`, más
// arriba) sin recalcular dejaba a la oportunidad con una fecha de
// actividad que ya no existe. Se recalcula SOLO si esta interacción era
// exactamente la que fijó el valor actual (`occurredAt === lastActivityAt`)
// — la igualdad prueba que ninguna interacción ni evento de ciclo de vida
// posterior existe (si existiera, `lastActivityAt` ya sería mayor, porque
// nunca retrocede solo). El nuevo valor es el máximo entre la creación de
// la oportunidad, su cierre (si está cerrada) y las interacciones que
// quedan — limitación aceptada: un `changeStage` intermedio no deja
// rastro propio, así que el recálculo puede quedar por debajo del valor
// "verdadero" con historial completo, nunca por encima (error siempre en
// la dirección seguro para el producto: la oportunidad puede parecer en
// riesgo antes, nunca después). `lastRiskPushSentAt` se capa con el mismo
// nuevo valor si lo supera, para no reproducir el bug ya corregido una
// vez en este proyecto (AIT-57, ronda 1, "Mayor" #2): dejarlo por encima
// de un `lastActivityAt` ya corregido bloquearía para siempre la
// elegibilidad de un aviso de riesgo futuro
// (`convex/pushInternal.ts:listAtRiskOpportunities`).
//
// El `nextStep` que esta interacción generó (si sigue "pending") NO se
// toca — decisión explícita, no omisión: sigue siendo una tarea futura
// válida con independencia de que se borre el registro histórico que la
// motivó, y el schema no guarda qué `nextStep` cerró `closePendingNextSteps`
// en su momento como para poder "deshacerlo" con seguridad sin arriesgar
// dejar la oportunidad sin ningún paso pendiente (regla 6).
export const remove = mutation({
  args: { interactionId: v.id("interactions") },
  handler: async (ctx, { interactionId }) => {
    const user = await requireOwner(ctx);
    const interaction = await ctx.db.get(interactionId);
    if (interaction === null) {
      throw new Error("Interacción no encontrada.");
    }
    const opportunity = await ctx.db.get(interaction.opportunityId);
    if (opportunity === null || opportunity.storeId !== user.storeId) {
      throw new Error("Interacción no encontrada.");
    }

    await ctx.db.delete(interactionId);

    if (interaction.occurredAt === opportunity.lastActivityAt) {
      const remaining = await ctx.db
        .query("interactions")
        .withIndex("by_opportunity", (q) =>
          q.eq("opportunityId", interaction.opportunityId),
        )
        .collect();
      const newLastActivityAt = Math.max(
        opportunity._creationTime,
        opportunity.closedAt ?? 0,
        ...remaining.map((i) => i.occurredAt),
      );
      await ctx.db.patch(interaction.opportunityId, {
        lastActivityAt: newLastActivityAt,
        lastRiskPushSentAt:
          opportunity.lastRiskPushSentAt !== undefined
            ? Math.min(opportunity.lastRiskPushSentAt, newLastActivityAt)
            : undefined,
      });
    }
  },
});

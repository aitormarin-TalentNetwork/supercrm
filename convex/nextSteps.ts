import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { requireUser } from "./model/access";
import { startOfBusinessDay, startOfNextBusinessDay } from "../lib/businessTime";
import { isAtRisk } from "../lib/risk";
import type { Id } from "./_generated/dataModel";

// Pending y postponed cuentan igual como "pasos accionables" — "postponed"
// no es un estado terminal como "done", es un pending que el usuario
// empujó un día. Dos consultas indexadas (by_assignee_status ya existe en
// el schema) en vez de una nueva. Extraído como helper (AIT-18) para que
// listForToday y getNotifications no dupliquen esta parte — cada una
// aplica después su propio filtro de fecha sobre el mismo conjunto base.
async function getOwnActionableSteps(ctx: QueryCtx, userId: Id<"users">) {
  const [pending, postponed] = await Promise.all([
    ctx.db
      .query("nextSteps")
      .withIndex("by_assignee_status", (q) =>
        q.eq("assigneeId", userId).eq("status", "pending"),
      )
      .collect(),
    ctx.db
      .query("nextSteps")
      .withIndex("by_assignee_status", (q) =>
        q.eq("assigneeId", userId).eq("status", "postponed"),
      )
      .collect(),
  ]);
  return [...pending, ...postponed];
}

export const listForToday = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const actionableSteps = await getOwnActionableSteps(ctx, user._id);

    const now = Date.now();
    const startOfToday = startOfBusinessDay(now);
    const startOfTomorrow = startOfNextBusinessDay(now);

    const dueTodayOrOverdue = actionableSteps.filter(
      (step) => step.dueDate < startOfTomorrow,
    );

    const items = await Promise.all(
      dueTodayOrOverdue.map(async (step) => {
        const opportunity = await ctx.db.get(step.opportunityId);
        // El paso apunta a una oportunidad cerrada o inexistente: no
        // debería pasar (closePendingNextSteps la cierra al cerrar la
        // oportunidad), pero si pasara, no se muestra en vez de reventar.
        if (opportunity === null || opportunity.status !== "open") return null;

        const customer = await ctx.db.get(opportunity.customerId);
        if (customer === null) return null;

        return {
          nextStepId: step._id,
          opportunityId: opportunity._id,
          customerName: customer.name,
          action: step.action,
          dueDate: step.dueDate,
          stage: opportunity.stage,
          estimatedAmount: opportunity.estimatedAmount ?? null,
          isOverdue: step.dueDate < startOfToday,
          isAtRisk: isAtRisk(opportunity.lastActivityAt, now),
        };
      }),
    );

    return items
      .filter((item) => item !== null)
      .sort((a, b) => a.dueDate - b.dueDate);
  },
});

export const markDone = mutation({
  args: { nextStepId: v.id("nextSteps") },
  handler: async (ctx, { nextStepId }) => {
    const user = await requireUser(ctx);
    const step = await ctx.db.get(nextStepId);
    if (step === null || step.assigneeId !== user._id) {
      throw new Error("Paso no encontrado.");
    }
    if (step.status === "done") return;
    await ctx.db.patch(nextStepId, { status: "done" });
  },
});

// Posponer un día: acción de un clic (igual que en el diseño, sin selector
// de fecha) — nueva dueDate = 24h desde ahora (reloj, no día de negocio).
// Elección deliberada, no una laguna: es la misma unidad de tiempo pase lo
// que pase con el horario de verano/invierno, así que sale de la franja
// "hoy" tal cual la ve quien pospone, en vez de saltar el resto de un día
// de 23h/25h o desviarse a otra hora del día en el de 25h.
export const postpone = mutation({
  args: { nextStepId: v.id("nextSteps") },
  handler: async (ctx, { nextStepId }) => {
    const user = await requireUser(ctx);
    const step = await ctx.db.get(nextStepId);
    if (step === null || step.assigneeId !== user._id) {
      throw new Error("Paso no encontrado.");
    }
    if (step.status === "done") {
      throw new Error("Este paso ya está hecho.");
    }
    await ctx.db.patch(nextStepId, {
      status: "postponed",
      dueDate: Date.now() + 24 * 60 * 60 * 1000,
    });
  },
});

// AIT-18: avisos para la campana de notificaciones de "Hoy" — de cualquier
// usuario, sus propios avisos (no es un dato de Marta/owner como
// convex/dashboard.ts). Dos categorías, igual que pide el criterio de
// aceptación: pasos vencidos (reutiliza getOwnActionableSteps, no reinventa
// la lógica de "vencido") y oportunidades propias en riesgo (lib/risk.ts,
// mismo criterio ya establecido — no solo las que tienen paso para hoy: una
// oportunidad puede llevar más de 7 días sin actividad con su próximo paso
// pospuesto a una fecha futura, y seguiría sin salir en listForToday).
export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const startOfToday = startOfBusinessDay(now);
    const startOfTomorrow = startOfNextBusinessDay(now);

    const [actionableSteps, ownedOpportunities] = await Promise.all([
      getOwnActionableSteps(ctx, user._id),
      ctx.db
        .query("opportunities")
        .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
        .collect(),
    ]);

    // "Pasos pendientes/vencidos del día" (criterio de aceptación): hoy o
    // vencido, no solo vencido — mismo corte que listForToday
    // (dueDate < startOfTomorrow), con isOverdue para poder distinguirlos
    // en el panel. Un paso que vence hoy pero aún no ha vencido también
    // debe avisar: es la razón de ser de la campana.
    const dueSteps = await Promise.all(
      actionableSteps
        .filter((step) => step.dueDate < startOfTomorrow)
        .map(async (step) => {
          const opportunity = await ctx.db.get(step.opportunityId);
          // El filtro por assigneeId ya acota el paso al usuario, pero no
          // garantiza que la oportunidad (ni su cliente) sean de su misma
          // tienda — el schema no lo fuerza. Mismo chequeo cruzado que ya
          // se exige en listOpen/getWorkloadByOwner/getAtRiskList
          // (hallazgo de auditoría): se descarta si cualquiera de las dos
          // relaciones apunta a otra tienda.
          if (
            opportunity === null ||
            opportunity.status !== "open" ||
            opportunity.storeId !== user.storeId
          ) {
            return null;
          }
          const customer = await ctx.db.get(opportunity.customerId);
          if (customer === null || customer.storeId !== user.storeId) {
            return null;
          }
          return {
            nextStepId: step._id,
            opportunityId: opportunity._id,
            customerName: customer.name,
            action: step.action,
            dueDate: step.dueDate,
            isOverdue: step.dueDate < startOfToday,
          };
        }),
    );

    const atRiskOpportunities = await Promise.all(
      ownedOpportunities
        .filter(
          (opportunity) =>
            opportunity.status === "open" &&
            isAtRisk(opportunity.lastActivityAt, now),
        )
        .map(async (opportunity) => {
          // Igual que arriba: by_owner acota por ownerId, no por storeId —
          // el schema no obliga a que coincidan, así que se comprueba
          // explícitamente en vez de asumirlo (hallazgo de auditoría).
          if (opportunity.storeId !== user.storeId) {
            return null;
          }
          const customer = await ctx.db.get(opportunity.customerId);
          if (customer === null || customer.storeId !== user.storeId) {
            return null;
          }
          return {
            opportunityId: opportunity._id,
            customerName: customer.name,
            lastActivityAt: opportunity.lastActivityAt,
          };
        }),
    );

    return {
      dueSteps: dueSteps
        .filter((item) => item !== null)
        .sort((a, b) => a.dueDate - b.dueDate),
      atRiskOpportunities: atRiskOpportunities
        .filter((item) => item !== null)
        .sort((a, b) => a.lastActivityAt - b.lastActivityAt),
    };
  },
});

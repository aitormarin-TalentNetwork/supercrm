import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./model/access";
import { startOfBusinessDay, startOfNextBusinessDay } from "../lib/businessTime";

// Riesgo (docs/02-modelo-de-datos.md §3): "hoy - lastActivityAt > X días
// (X configurable, empezamos con 7)". El sistema completo de alertas es
// AIT-17 (Fase 3, otra issue) — aquí solo se calcula el indicador visual.
const RISK_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

// Pasos accionables para "Hoy": pending y postponed cuentan igual una vez
// llega su fecha — "postponed" no es un estado terminal como "done", es un
// pending que el usuario empujó un día. Dos consultas indexadas
// (by_assignee_status ya existe en el schema) en vez de una nueva, tal y
// como se pidió: no se añade índice nuevo para esto.
export const listForToday = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const [pending, postponed] = await Promise.all([
      ctx.db
        .query("nextSteps")
        .withIndex("by_assignee_status", (q) =>
          q.eq("assigneeId", user._id).eq("status", "pending"),
        )
        .collect(),
      ctx.db
        .query("nextSteps")
        .withIndex("by_assignee_status", (q) =>
          q.eq("assigneeId", user._id).eq("status", "postponed"),
        )
        .collect(),
    ]);

    const now = Date.now();
    const startOfToday = startOfBusinessDay(now);
    const startOfTomorrow = startOfNextBusinessDay(now);

    const dueTodayOrOverdue = [...pending, ...postponed].filter(
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
          isAtRisk: now - opportunity.lastActivityAt > RISK_THRESHOLD_MS,
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

import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { isAtRisk } from "../lib/risk";

// AIT-57: funciones internas que usa convex/webPush.ts (el "use node"
// action que manda los avisos, disparado por convex/crons.ts) — separadas
// en un archivo de runtime normal porque un archivo "use node" solo puede
// exportar actions, no queries/mutations que toquen `ctx.db` directamente.

// Candidatos a "paso vencido" para push, de TODA la tienda/negocio (a
// diferencia de nextSteps.ts:listForToday/getNotifications, que son
// personales del usuario que pregunta) — collect() + filtro en memoria,
// no un índice por `status` a secas: `nextSteps` no tiene ese índice (solo
// by_assignee_status/by_opportunity) y, por el invariante del schema
// ("ninguna oportunidad abierta se queda sin nextStep pendiente"), su
// tamaño sigue de cerca al de las oportunidades abiertas del negocio, no
// crece sin límite — mismo criterio que otros barridos completos ya
// existentes en el proyecto para tablas de este tamaño (p.ej.
// nextSteps.ts:getSalesUsersForStore).
//
// "Vencido" aquí es el cruce real de `dueDate` (dueDate < ahora), no el
// corte por día calendario que usa la vista de "Hoy" — esto es un aviso
// puntual disparado por el cron cuando el paso vence de verdad, no una
// lista que se relee en cada apertura de la app. `lastPushSentAt` evita
// re-avisar en cada pasada del cron: solo entra si nunca se avisó, o si
// se avisó ANTES de la dueDate actual (así, posponer — que cambia
// dueDate — vuelve a hacerlo elegible cuando venza de nuevo).
export const listOverdueSteps = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const allSteps = await ctx.db.query("nextSteps").collect();
    const overdue = allSteps.filter(
      (step) =>
        (step.status === "pending" || step.status === "postponed") &&
        step.dueDate < now &&
        (step.lastPushSentAt === undefined ||
          step.lastPushSentAt < step.dueDate),
    );

    const enriched = await Promise.all(
      overdue.map(async (step) => {
        const opportunity = await ctx.db.get(step.opportunityId);
        if (opportunity === null || opportunity.status !== "open") {
          return null;
        }
        const customer = await ctx.db.get(opportunity.customerId);
        if (customer === null) return null;
        return {
          nextStepId: step._id,
          opportunityId: opportunity._id,
          assigneeId: step.assigneeId,
          customerName: customer.name,
          action: step.action,
          dueDate: step.dueDate,
        };
      }),
    );
    return enriched.filter((item) => item !== null);
  },
});

// Misma idea que listOverdueSteps, para oportunidades abiertas en riesgo
// (lib/risk.ts, mismo umbral de 7 días que el resto de la app). Se marca
// `lastRiskPushSentAt` comparado contra `lastActivityAt` (no contra
// "ahora"): mientras no haya actividad nueva, no se vuelve a avisar en
// cada pasada del cron; una interacción nueva resetea `lastActivityAt` y,
// si la oportunidad vuelve a quedarse en riesgo más adelante, vuelve a
// ser elegible.
export const listAtRiskOpportunities = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const allOpportunities = await ctx.db.query("opportunities").collect();
    const atRisk = allOpportunities.filter(
      (opportunity) =>
        opportunity.status === "open" &&
        isAtRisk(opportunity.lastActivityAt, now) &&
        (opportunity.lastRiskPushSentAt === undefined ||
          opportunity.lastRiskPushSentAt < opportunity.lastActivityAt),
    );

    const enriched = await Promise.all(
      atRisk.map(async (opportunity) => {
        const customer = await ctx.db.get(opportunity.customerId);
        if (customer === null) return null;
        return {
          opportunityId: opportunity._id,
          ownerId: opportunity.ownerId,
          customerName: customer.name,
          lastActivityAt: opportunity.lastActivityAt,
        };
      }),
    );
    return enriched.filter((item) => item !== null);
  },
});

// AIT-57 (hallazgo de auditoría NO-GO ronda 1): marca la `dueDate` que
// realmente se evaluó en listOverdueSteps, NO `Date.now()`. Con
// `Date.now()` había una carrera real: si entre la lectura del cron y
// este patch alguien posponía el paso a una fecha muy próxima (o, más
// sutil, si el propio patch se demoraba), el marcado podía quedar
// "correcto por casualidad" en vez de por diseño — y para el caso
// simétrico de oportunidades (ver markOpportunityPushed) esa misma
// carrera SÍ podía suprimir avisos futuros para siempre. Mismo arreglo en
// los dos por consistencia: guardar el valor observado, no el reloj de
// cuándo se escribió, hace que el marcado sea inmune a qué haya pasado
// con el documento entre medias.
export const markStepPushed = internalMutation({
  args: { nextStepId: v.id("nextSteps"), dueDate: v.number() },
  handler: async (ctx, { nextStepId, dueDate }) => {
    await ctx.db.patch(nextStepId, { lastPushSentAt: dueDate });
  },
});

// AIT-57 (hallazgo de auditoría NO-GO ronda 1, hallazgo "Mayor" #2): con
// `Date.now()` había una carrera real — si entre que listAtRiskOpportunities
// lee la oportunidad y este patch se ejecuta, se registra una interacción
// nueva (`lastActivityAt` avanza a "ahora"), `Date.now()` en el patch caía
// DESPUÉS de esa `lastActivityAt` recién actualizada. Resultado:
// `lastRiskPushSentAt > lastActivityAt` para siempre (mientras no haya
// más interacciones), así que la condición de elegibilidad
// (`lastRiskPushSentAt < lastActivityAt`) nunca se volvía a cumplir — la
// oportunidad quedaba SIN posibilidad de un aviso futuro aunque volviera
// a quedarse en riesgo 7 días después de esa interacción. Arreglo: se
// guarda el `lastActivityAt` que listAtRiskOpportunities observó (pasado
// como argumento, no releído aquí), no el reloj de cuándo se escribe. Si
// hay una interacción nueva a mitad de camino, se guarda el valor VIEJO
// de `lastActivityAt` — menor que el nuevo por definición — así que la
// condición de elegibilidad se mantiene abierta para la siguiente racha,
// en vez de bloquearse por una escritura concurrente que no se pudo ver.
export const markOpportunityPushed = internalMutation({
  args: { opportunityId: v.id("opportunities"), lastActivityAt: v.number() },
  handler: async (ctx, { opportunityId, lastActivityAt }) => {
    await ctx.db.patch(opportunityId, { lastRiskPushSentAt: lastActivityAt });
  },
});

export const listSubscriptionsForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Suscripción muerta (el navegador/SO ya no la reconoce: desinstalada,
// permiso revocado, dispositivo reseteado) — se borra para que el cron no
// siga intentando enviarle en cada pasada.
export const deleteSubscription = internalMutation({
  args: { subscriptionId: v.id("pushSubscriptions") },
  handler: async (ctx, { subscriptionId }) => {
    await ctx.db.delete(subscriptionId);
  },
});

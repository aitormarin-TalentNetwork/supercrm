import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
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
        // Tres motivos distintos con la misma salida (no mostrar el paso).
        // Conviene no confundirlos:
        //
        // - `status !== "open"`: no debería pasar. `closePendingNextSteps`
        //   (convex/opportunities.ts) cierra al cerrar la oportunidad tanto
        //   los `pending` como los `postponed`, así que un paso accionable
        //   de una oportunidad cerrada solo aparece si algún camino de
        //   cierre nuevo se olvida de llamarla.
        // - `opportunity === null`: la oportunidad fue BORRADA. Tampoco
        //   debería pasar: `opportunities.remove` cascadea los pasos por
        //   `by_opportunity` en la misma transacción. Pero la garantía es
        //   esa cascada y nada más — `v.id("opportunities")` es un TIPO, no
        //   una clave ajena, y Convex no impide que la fila apuntada
        //   desaparezca. Lo que rompe el invariante está FUERA de estas
        //   mutations: borrar a mano desde el panel de Convex, un `convex
        //   import` parcial, o un camino de borrado futuro sin cascada.
        // - storeId cruzado (AIT-31, armonizado con getNotifications más
        //   abajo en este mismo archivo): este SÍ es esperable. El filtro
        //   por assigneeId ya acota el paso al usuario, pero no garantiza
        //   que la oportunidad (ni su cliente) sean de su misma tienda — el
        //   schema no lo fuerza.
        //
        // Ocultarlo es lo correcto (AIT-87: un seguimiento de una
        // oportunidad fantasma no ayuda a nadie), pero es silencioso. Para
        // saber cuántos hay: `countOrphans`, al final de este archivo.
        if (
          opportunity === null ||
          opportunity.status !== "open" ||
          opportunity.storeId !== user.storeId
        ) {
          return null;
        }

        const customer = await ctx.db.get(opportunity.customerId);
        if (customer === null || customer.storeId !== user.storeId) return null;

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
          // AIT-36: mismo fallback "media" que getSummary/listOpen, para las
          // oportunidades creadas antes de AIT-35.
          priority: opportunity.priority ?? "media",
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
          // Mismo triple descarte que `listForToday` — ver allí el porqué
          // de cada motivo y cómo se cuentan los huérfanos (AIT-87). El
          // filtro por assigneeId ya acota el paso al usuario, pero no
          // garantiza que la oportunidad (ni su cliente) sean de su misma
          // tienda — el schema no lo fuerza. Mismo chequeo cruzado que ya
          // se exige en listOpen/getAtRiskList
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

// AIT-87: censo de pasos huérfanos — los que apuntan a una oportunidad que
// ya no existe. `listForToday` y `getNotifications` los descartan en
// silencio (ver el comentario largo arriba), que es lo correcto para el
// usuario pero dejaba el CRM sin forma de saber cuántos hay.
//
// Se ejecuta a mano, contra el deployment que se quiera auditar:
//   npx convex run nextSteps:countOrphans '{}'
//
// `internalQuery` y no `query`: no es que el usuario no deba verlo, es que
// desde el cliente NO SE PUEDE llamar — no entra en `api`, solo en
// `internal`, y lo impide el runtime en vez de un chequeo de rol que
// alguien pueda borrar sin darse cuenta. Corolario: ninguna carga de
// pantalla puede dispararlo (criterio de AIT-87).
//
// Dos `collect()` y un Set, no un `ctx.db.get` por paso: con N pasos sobre
// M oportunidades lee N+M documentos en vez de N+N. El escaneo completo de
// `nextSteps` no es un patrón nuevo aquí — `pushInternal.listOverdueSteps`
// ya lo hace, y encima cada hora desde `crons.ts`. Límites de lectura por
// ejecución en Convex: 32.000 documentos escaneados, 16 MiB leídos, 4.096
// rangos de índice. Al superarlos la transacción falla en vez de entregar
// un censo parcial (lo afirma la auditoría de AIT-87 y encaja con que la
// documentación hable de "enforces" sin describir resultados parciales; no
// medido aquí). Y el que llegaría antes al límite es el cron horario, no
// este censo manual.
export const countOrphans = internalQuery({
  args: {},
  handler: async (ctx) => {
    const [steps, opportunities] = await Promise.all([
      ctx.db.query("nextSteps").collect(),
      ctx.db.query("opportunities").collect(),
    ]);
    const existing = new Set(opportunities.map((o) => o._id));
    const orphans = steps.filter((s) => !existing.has(s.opportunityId));

    return {
      totalPasos: steps.length,
      totalOportunidades: opportunities.length,
      huerfanos: orphans.length,
      // Aparte del total porque son cosas distintas: un huérfano `done` ya
      // no le debía nada a nadie; uno `pending`/`postponed` ES el
      // seguimiento perdido del que habla la issue.
      huerfanosAccionables: orphans.filter(
        (s) => s.status === "pending" || s.status === "postponed",
      ).length,
      // Acotada a 50 para que un resultado patológico no devuelva una
      // respuesta enorme; `huerfanos` sigue siendo el total real, no el de
      // la muestra. `action` NO se incluye a propósito: es texto libre del
      // vendedor y puede llevar nombre de cliente o detalles del trato, y
      // esta salida se pega en exports y en mensajes entre terminales.
      muestra: orphans.slice(0, 50).map((s) => ({
        id: s._id,
        opportunityId: s.opportunityId,
        status: s.status,
        dueDate: s.dueDate,
      })),
    };
  },
});

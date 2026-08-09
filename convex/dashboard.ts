import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";
import { requireOwner } from "./model/access";

// Mismo umbral que docs/02-modelo-de-datos.md §3 y convex/opportunities.ts
// (listOpen, AIT-12): 7 días sin actividad. Duplicado a propósito — esta
// tarea (AIT-24) no toca opportunities.ts, así que no hay una constante
// compartida que importar; si el umbral cambia alguna vez, tocar los dos
// sitios.
const RISK_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

// Estos KPIs son financieros/de negocio (PRD: solo la dueña los ve) — todas
// las queries de este archivo usan requireOwner, no requireUser. Ninguno
// guarda nada: se recalculan en cada consulta a partir de `opportunities`
// (docs/02-modelo-de-datos.md §3), así que nunca se desactualizan al
// cambiar etapas o importes.
async function getOpenOpportunitiesForStore(
  ctx: QueryCtx,
  storeId: Id<"stores">,
) {
  const open = await ctx.db
    .query("opportunities")
    .withIndex("by_status_stage", (q) => q.eq("status", "open"))
    .collect();
  return open.filter((opportunity) => opportunity.storeId === storeId);
}

// Valor del pipeline: suma de estimatedAmount de las oportunidades abiertas.
export const getPipelineValue = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireOwner(ctx);
    const open = await getOpenOpportunitiesForStore(ctx, user.storeId);
    return open.reduce((sum, o) => sum + (o.estimatedAmount ?? 0), 0);
  },
});

// Forecast: importe previsto agrupado por mes de cierre esperado
// ("YYYY-MM" del expectedCloseDate). Se elige el mes calendario como
// periodo — granularidad razonable para un forecast comercial de un
// negocio pequeño, ni tan fina que sea ruido día a día ni tan gruesa que
// mezcle trimestres. Las abiertas sin expectedCloseDate no se incluyen en
// ningún periodo (no se les inventa una fecha). Orden cronológico.
//
// getUTC*, no getFullYear/getMonth: expectedCloseDate es un timestamp
// (epoch ms) sin zona horaria propia. Con los métodos en hora local, el
// resultado dependería de en qué huso horario corra el servidor de Convex
// — verificado en real: con TZ America/Sao_Paulo (UTC-3), un
// `new Date("2026-10-01")` (medianoche UTC) cae en "2026-09" en vez de
// "2026-10". Con getUTC* el cálculo es el mismo epoch → el mismo periodo
// sin importar dónde se ejecute.
export const getForecast = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireOwner(ctx);
    const open = await getOpenOpportunitiesForStore(ctx, user.storeId);

    const amountByPeriod = new Map<string, number>();
    for (const opportunity of open) {
      if (opportunity.expectedCloseDate === undefined) continue;
      const date = new Date(opportunity.expectedCloseDate);
      const period = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      amountByPeriod.set(
        period,
        (amountByPeriod.get(period) ?? 0) + (opportunity.estimatedAmount ?? 0),
      );
    }

    return Array.from(amountByPeriod.entries())
      .map(([period, amount]) => ({ period, amount }))
      .sort((a, b) => a.period.localeCompare(b.period));
  },
});

// Nº de oportunidades en riesgo (docs/02-modelo-de-datos.md §3: hoy -
// lastActivityAt > 7 días).
export const getAtRiskCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireOwner(ctx);
    const open = await getOpenOpportunitiesForStore(ctx, user.storeId);
    const now = Date.now();
    return open.filter(
      (opportunity) => now - opportunity.lastActivityAt > RISK_THRESHOLD_MS,
    ).length;
  },
});

// Carga de trabajo por comercial: nº y valor de oportunidades abiertas,
// agrupado por ownerId. Ordenado por importe descendente (el comercial con
// más valor en juego primero, el orden que más le interesa a Marta al
// abrir Supervisión).
export const getWorkloadByOwner = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireOwner(ctx);
    const open = await getOpenOpportunitiesForStore(ctx, user.storeId);

    const statsByOwner = new Map<
      Id<"users">,
      { count: number; totalAmount: number }
    >();
    for (const opportunity of open) {
      const entry = statsByOwner.get(opportunity.ownerId) ?? {
        count: 0,
        totalAmount: 0,
      };
      entry.count += 1;
      entry.totalAmount += opportunity.estimatedAmount ?? 0;
      statsByOwner.set(opportunity.ownerId, entry);
    }

    const workload = await Promise.all(
      Array.from(statsByOwner.entries()).map(async ([ownerId, stats]) => {
        const owner = await ctx.db.get(ownerId);
        // Mismo chequeo que getSummary/listOpen con el cliente: el
        // agregado (count/totalAmount) ya es correcto porque viene de
        // oportunidades filtradas por storeId, pero el nombre del usuario
        // se resuelve por separado — si ownerId apuntara (por una relación
        // cruzada o corrupta) a un usuario de otra tienda, no se filtra su
        // nombre. En uso normal nunca ocurre.
        const ownerName =
          owner !== null && owner.storeId === user.storeId
            ? (owner.name ?? null)
            : null;
        return {
          ownerId,
          ownerName,
          count: stats.count,
          totalAmount: stats.totalAmount,
        };
      }),
    );

    return workload.sort((a, b) => b.totalAmount - a.totalAmount);
  },
});

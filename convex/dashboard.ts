import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";
import { requireOwner } from "./model/access";
import { startOfBusinessDay } from "../lib/businessTime";

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

// AIT-22 (Panel): embudo por etapa — nº y suma de importes de las
// oportunidades abiertas, agrupado por stage. Las 3 etapas reales del MVP
// (docs/02-modelo-de-datos.md §2) — no las 6 de la paleta del prototipo de
// diseño: ganada/perdida son status, no etapa, igual que ya se resolvió en
// el Pipeline (AIT-12).
const STAGES = ["contacto", "presupuesto", "negociacion"] as const;

export const getFunnelByStage = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireOwner(ctx);
    const open = await getOpenOpportunitiesForStore(ctx, user.storeId);

    return STAGES.map((stage) => {
      const inStage = open.filter((opportunity) => opportunity.stage === stage);
      return {
        stage,
        count: inStage.length,
        totalAmount: inStage.reduce(
          (sum, opportunity) => sum + (opportunity.estimatedAmount ?? 0),
          0,
        ),
      };
    });
  },
});

// AIT-22 (Panel): lista de oportunidades en riesgo (cliente, importe, días
// sin actividad, comercial) para la tabla del Panel — getAtRiskCount
// (AIT-24) solo da el número, no estos datos, así que hace falta una query
// nueva. Mismo umbral que getAtRiskCount: no lo reimplementa, pero
// necesariamente repite el cálculo porque ninguna de las dos exporta un
// resultado intermedio reutilizable entre queries de Convex.
export const getAtRiskList = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireOwner(ctx);
    const open = await getOpenOpportunitiesForStore(ctx, user.storeId);
    const now = Date.now();
    const atRisk = open.filter(
      (opportunity) => now - opportunity.lastActivityAt > RISK_THRESHOLD_MS,
    );

    const enriched = await Promise.all(
      atRisk.map(async (opportunity) => {
        const [customer, owner] = await Promise.all([
          ctx.db.get(opportunity.customerId),
          ctx.db.get(opportunity.ownerId),
        ]);
        // Mismo chequeo de storeId cruzado que listOpen/getWorkloadByOwner:
        // sin cliente de la misma tienda no hay fila (se omite, no se
        // inventa un nombre); sin comercial de la misma tienda, el nombre
        // queda null pero la fila se mantiene (mismo criterio que
        // getWorkloadByOwner).
        if (customer === null || customer.storeId !== user.storeId) {
          return null;
        }
        const ownerName =
          owner !== null && owner.storeId === user.storeId
            ? (owner.name ?? null)
            : null;
        return {
          opportunityId: opportunity._id,
          customerName: customer.name,
          estimatedAmount: opportunity.estimatedAmount ?? null,
          daysSinceActivity: Math.floor(
            (now - opportunity.lastActivityAt) / (24 * 60 * 60 * 1000),
          ),
          ownerName,
        };
      }),
    );

    return enriched
      .filter((item) => item !== null)
      .sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);
  },
});

// ---------------------------------------------------------------------
// AIT-23: Supervisión — actividad del equipo (Marta ve a TODOS los
// comerciales de su tienda, nunca filtrado por el usuario actual, al
// revés que el resto de queries de la app).
// ---------------------------------------------------------------------

// No hay índice por storeId en `users` (solo "email" y "phone") — collect
// + filter en memoria, mismo patrón que getOpenOpportunitiesForStore de
// más arriba en este archivo. Un equipo de tienda es pequeño en el MVP.
// Solo "sales": Marta supervisa a su equipo, no se cuenta a sí misma como
// comercial en esta pantalla.
async function getSalesUsersForStore(ctx: QueryCtx, storeId: Id<"stores">) {
  const allUsers = await ctx.db.query("users").collect();
  return allUsers.filter((u) => u.storeId === storeId && u.role === "sales");
}

// "En el periodo" (brief de AIT-23): no se pedía un selector de periodo en
// el criterio de aceptación ("muestra actividad, atrasos y carga de
// trabajo por comercial"), así que se fija un periodo por defecto en vez
// de construir un selector — decisión documentada para el auditor. 30 días
// es una ventana razonable de "actividad reciente" para una supervisión de
// equipo; se puede convertir en argumento de la query el día que se pida
// un selector real (fuera de esta tarea).
const ACTIVITY_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

// Interacciones registradas por comercial en los últimos 30 días.
// Agrupadas por quién las registró (authorId), no por el propietario de
// la oportunidad — son cosas distintas aunque en el MVP casi siempre
// coincidan. No hay índice por fecha en `interactions` — collect + filter,
// igual que el resto de este archivo.
export const getInteractionCountsByOwner = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireOwner(ctx);
    const salesUsers = await getSalesUsersForStore(ctx, user.storeId);
    const salesUserIds = new Set(salesUsers.map((u) => u._id));

    const since = Date.now() - ACTIVITY_PERIOD_MS;
    const allInteractions = await ctx.db.query("interactions").collect();

    const counts = new Map<Id<"users">, number>();
    for (const interaction of allInteractions) {
      if (interaction.occurredAt < since) continue;
      if (!salesUserIds.has(interaction.authorId)) continue;
      counts.set(
        interaction.authorId,
        (counts.get(interaction.authorId) ?? 0) + 1,
      );
    }

    return salesUsers.map((u) => ({
      ownerId: u._id,
      ownerName: u.name ?? null,
      count: counts.get(u._id) ?? 0,
    }));
  },
});

// Seguimientos atrasados por comercial: mismo criterio que "isOverdue" en
// nextSteps.ts:listForToday (pending + postponed con dueDate ya pasado),
// pero recorriendo a TODOS los comerciales de la tienda en vez de solo al
// usuario que hace la consulta — es la adaptación que pedía el brief.
export const getOverdueCountsByOwner = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireOwner(ctx);
    const salesUsers = await getSalesUsersForStore(ctx, user.storeId);

    const startOfToday = startOfBusinessDay(Date.now());

    return Promise.all(
      salesUsers.map(async (salesUser) => {
        const [pending, postponed] = await Promise.all([
          ctx.db
            .query("nextSteps")
            .withIndex("by_assignee_status", (q) =>
              q.eq("assigneeId", salesUser._id).eq("status", "pending"),
            )
            .collect(),
          ctx.db
            .query("nextSteps")
            .withIndex("by_assignee_status", (q) =>
              q.eq("assigneeId", salesUser._id).eq("status", "postponed"),
            )
            .collect(),
        ]);
        const overdueCount = [...pending, ...postponed].filter(
          (step) => step.dueDate < startOfToday,
        ).length;
        return {
          ownerId: salesUser._id,
          ownerName: salesUser.name ?? null,
          count: overdueCount,
        };
      }),
    );
  },
});

// Oportunidades abiertas con el nombre del comercial, para el drill-down y
// el filtro por comercial de Supervisión. Variante de
// opportunities.listOpen (AIT-12) hecha aparte a propósito: aquí NO hay
// restricción por ownerId (Marta ve las de todo el equipo, por diseño de
// esta pantalla) y aquí SÍ hace falta el nombre del comercial, que
// listOpen no devuelve. Duplicar esta consulta pequeña evita tocar
// convex/opportunities.ts, que otra terminal (T3, AIT-19) está editando
// en paralelo ahora mismo — declarado explícitamente al auditor, tal como
// pedía el brief.
// Incluye "isOverdue" por oportunidad (no solo por comercial): a
// diferencia de getOverdueCountsByOwner (que solo cuenta comerciales
// "sales", para la tabla "por comercial" que pedía el brief), esto cubre
// TODAS las oportunidades abiertas de la tienda, incluidas las que
// pudiera tener la propia Marta — verificado en real que existen (2
// oportunidades y 2 seguimientos atrasados suyos en este deployment de
// desarrollo). Los KPIs de cabecera de Supervisión usan este total
// completo en vez de sumar solo la tabla de comerciales, para que no haya
// dos cifras distintas de "abiertas"/"atrasadas" en la misma pantalla.
export const listOpenOpportunitiesForSupervision = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireOwner(ctx);
    const open = await getOpenOpportunitiesForStore(ctx, user.storeId);
    const startOfToday = startOfBusinessDay(Date.now());

    return Promise.all(
      open.map(async (opportunity) => {
        const [customer, owner, nextStep] = await Promise.all([
          ctx.db.get(opportunity.customerId),
          ctx.db.get(opportunity.ownerId),
          ctx.db
            .query("nextSteps")
            .withIndex("by_opportunity", (q) =>
              q.eq("opportunityId", opportunity._id),
            )
            .filter((q) =>
              q.or(
                q.eq(q.field("status"), "pending"),
                q.eq(q.field("status"), "postponed"),
              ),
            )
            .first(),
        ]);
        return {
          id: opportunity._id,
          customerName: customer?.name ?? "—",
          stage: opportunity.stage,
          estimatedAmount: opportunity.estimatedAmount ?? null,
          ownerId: opportunity.ownerId,
          ownerName: owner?.name ?? null,
          isOverdue: nextStep !== null && nextStep.dueDate < startOfToday,
        };
      }),
    );
  },
});

// AIT-33: "pendiente de cobro" para Panel (Marta) — ventas ganadas cuyo
// ciclo de cobro no ha llegado todavía a "cobrado". A diferencia del resto
// de listados de este archivo (getOpenOpportunitiesForStore usa
// by_status_stage, que empieza por `status`, y filtra storeId en memoria
// porque esa tabla es pequeña en el MVP), esta consulta usa el índice
// `by_store_status` (storeId primero) — corregido tras hallazgo de
// auditoría (NO-GO ronda 2): una consulta reactiva de Panel no debe
// escanear las oportunidades "won" de TODAS las tiendas antes de filtrar
// las propias, ni por coste (crece con el negocio entero, no con el de la
// tienda que pregunta) ni por aislamiento multi-tenant (leer de más,
// aunque no se exponga al cliente, sigue siendo una lectura innecesaria
// de datos de otras tiendas). Ordenado por fecha de cierre ascendente:
// las ventas cerradas hace más tiempo y aún sin cobrar son las más
// urgentes. Sin paginación: se valoró, pero ninguna otra lista de este
// archivo pagina todavía (mismo criterio que getAtRiskList) — se deja
// para cuando el volumen real de un negocio lo pida, no antes.
export const listPendingBilling = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireOwner(ctx);
    const ownWon = await ctx.db
      .query("opportunities")
      .withIndex("by_store_status", (q) =>
        q.eq("storeId", user.storeId).eq("status", "won"),
      )
      .collect();
    const pending = ownWon.filter(
      (opportunity) => (opportunity.billingStatus ?? "listo_para_facturar") !== "cobrado",
    );

    const enriched = await Promise.all(
      pending.map(async (opportunity) => {
        // Mismo chequeo cruzado que listOpenOpportunitiesForSupervision:
        // no basta con que la oportunidad ya esté filtrada por storeId.
        const customer = await ctx.db.get(opportunity.customerId);
        if (customer === null || customer.storeId !== user.storeId) {
          return null;
        }
        // Mismo chequeo cruzado que getWorkloadByOwner/getAtRiskList más
        // arriba en este archivo (sugerencia de auditoría, ronda 3): el
        // nombre del comercial se resuelve por separado del filtro de
        // storeId de la oportunidad — si ownerId apuntara a un usuario de
        // otra tienda, no se filtra su nombre.
        const owner = await ctx.db.get(opportunity.ownerId);
        const ownerName =
          owner !== null && owner.storeId === user.storeId
            ? (owner.name ?? null)
            : null;
        return {
          opportunityId: opportunity._id,
          customerName: customer.name,
          ownerName,
          finalAmount: opportunity.finalAmount ?? null,
          closedAt: opportunity.closedAt ?? 0,
          billingStatus: opportunity.billingStatus ?? "listo_para_facturar",
        };
      }),
    );

    return enriched
      .filter((item) => item !== null)
      .sort((a, b) => a.closedAt - b.closedAt);
  },
});

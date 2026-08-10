import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { requireUser } from "./model/access";
import type { Doc, Id } from "./_generated/dataModel";
import { startOfBusinessDay } from "../lib/businessTime";

// Primer próximo paso según el canal de origen (PRD: Alta rápida → "genera
// la oportunidad y su primer próximo paso automático"). Mismos canales que
// el Select de Design/pantallas/Alta rápida.dc.html.
const FIRST_STEP_BY_SOURCE: Record<string, string> = {
  Llamada: "Llamar para presentar la propuesta",
  WhatsApp: "Enviar WhatsApp de presentación",
  Recomendación: "Llamar para agradecer y presentar",
  Web: "Responder la solicitud web",
  Visita: "Agendar visita comercial",
};

// Próximo paso al cambiar de etapa (AIT-15). Distinto del de creación: ya
// no es "primer contacto", depende de a qué fase entra la oportunidad.
const NEXT_STEP_BY_STAGE: Record<
  "contacto" | "presupuesto" | "negociacion",
  string
> = {
  contacto: "Contactar para iniciar el seguimiento",
  presupuesto: "Enviar el presupuesto",
  negociacion: "Llamar para cerrar la negociación",
};

// Techo puramente defensivo (no una regla de negocio real): bloquea
// importes negativos, no numéricos o desproporcionados enviados por una
// llamada directa a la mutation, sin depender de que el formulario valide.
// Se usa tanto para el importe estimado como para el importe final de cierre.
const MAX_AMOUNT = 100_000_000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sin restricción de rol a propósito: tanto owner como sales pueden crear
// oportunidades. No es un descuido — Alta rápida se abre también desde
// Pipeline (Design/pantallas/Pipeline.dc.html), que usan ambos roles, y no
// hay ningún requisito que reserve la captación solo a sales. Confirmado
// explícitamente al construir AIT-10 (ronda de auditoría 3, hallazgo #4).
export const createQuick = mutation({
  args: {
    // Generada por el cliente una vez por apertura del modal. Un reintento
    // de red del mismo envío (Convex ya confirmó pero la respuesta no
    // llegó) manda la misma clave: se devuelve la oportunidad ya creada en
    // vez de duplicar cliente + oportunidad + próximo paso (ronda de
    // auditoría 2, mayor #2).
    clientRequestId: v.string(),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    source: v.union(
      v.literal("Llamada"),
      v.literal("WhatsApp"),
      v.literal("Recomendación"),
      v.literal("Web"),
      v.literal("Visita"),
    ),
    interest: v.optional(v.string()),
    estimatedAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // .collect() en vez de .unique(): si alguna vez colisionara la clave
    // entre dos usuarios (astronómicamente improbable con un UUID real,
    // pero así no revienta si pasara), cada uno solo reconoce la suya.
    const existingRequests = await ctx.db
      .query("opportunityRequests")
      .withIndex("by_client_request_id", (q) =>
        q.eq("clientRequestId", args.clientRequestId),
      )
      .collect();
    const ownRequest = existingRequests.find((r) => r.userId === user._id);
    if (ownRequest) return ownRequest.opportunityId;

    const name = args.name.trim();
    if (name.length === 0) throw new Error("El nombre es obligatorio.");

    const phone = args.phone.trim();
    if (!/^[\d\s+()-]+$/.test(phone)) {
      throw new Error("El teléfono solo puede tener números y separadores.");
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 9) {
      throw new Error("Introduce un teléfono válido (9 dígitos).");
    }
    if (phoneDigits.length > 15) {
      throw new Error("El teléfono es demasiado largo.");
    }

    const email = args.email?.trim().toLowerCase() || undefined;
    if (email !== undefined && !EMAIL_RE.test(email)) {
      throw new Error("El email no tiene un formato válido.");
    }

    // El cliente solo manda 0-2 decimales, pero una llamada directa a la
    // mutation podría enviar cualquier float (12.3456…) — se redondea a
    // céntimo en servidor, no solo se confía en el parser del formulario.
    let estimatedAmount: number | undefined;
    if (args.estimatedAmount !== undefined) {
      if (
        !Number.isFinite(args.estimatedAmount) ||
        args.estimatedAmount < 0 ||
        args.estimatedAmount > MAX_AMOUNT
      ) {
        throw new Error("El importe estimado no es válido.");
      }
      estimatedAmount = Math.round(args.estimatedAmount * 100) / 100;
    }

    const now = Date.now();

    const customerId = await ctx.db.insert("customers", {
      name,
      phone,
      email,
      source: args.source,
      ownerId: user._id,
      storeId: user.storeId,
    });

    const opportunityId = await ctx.db.insert("opportunities", {
      customerId,
      stage: "contacto",
      status: "open",
      interest: args.interest?.trim() || undefined,
      estimatedAmount,
      lastActivityAt: now,
      ownerId: user._id,
      storeId: user.storeId,
    });

    await ctx.db.insert("nextSteps", {
      opportunityId,
      action: FIRST_STEP_BY_SOURCE[args.source],
      dueDate: now,
      status: "pending",
      assigneeId: user._id,
    });

    await ctx.db.insert("opportunityRequests", {
      clientRequestId: args.clientRequestId,
      userId: user._id,
      opportunityId,
    });

    return opportunityId;
  },
});

// Todo lo que pide la cabecera + próximo paso del Detalle de oportunidad
// (AIT-13), además del resumen mínimo que ya usaba la ficha de confirmación
// de Alta rápida (AIT-10). No basta con comprobar la oportunidad: el
// cliente relacionado se valida también contra la misma tienda, para que
// una relación cruzada futura no filtre el nombre de un cliente ajeno.
export const getSummary = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, { opportunityId }) => {
    const user = await requireUser(ctx);
    const opportunity = await ctx.db.get(opportunityId);
    if (opportunity === null) return null;
    if (opportunity.storeId !== user.storeId) return null;
    if (user.role !== "owner" && opportunity.ownerId !== user._id) return null;

    const customer = await ctx.db.get(opportunity.customerId);
    if (customer === null || customer.storeId !== user.storeId) return null;

    const [owner, store, nextStep] = await Promise.all([
      ctx.db.get(opportunity.ownerId),
      ctx.db.get(opportunity.storeId),
      ctx.db
        .query("nextSteps")
        .withIndex("by_opportunity", (q) => q.eq("opportunityId", opportunityId))
        // "pending" y "postponed" (no solo "pending"): un paso pospuesto
        // sigue siendo el próximo paso accionable de la oportunidad, solo
        // con la fecha movida — mismo criterio que closePendingNextSteps
        // más abajo (AIT-16, ronda de auditoría 4, mayor #1). Si solo se
        // mirara "pending", el detalle mostraría "sin próximo paso" en
        // cuanto se pospusiera uno, aunque la oportunidad siga abierta.
        .filter((q) =>
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "postponed"),
          ),
        )
        .first(),
    ]);

    return {
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      interest: opportunity.interest ?? null,
      estimatedAmount: opportunity.estimatedAmount ?? null,
      stage: opportunity.stage,
      status: opportunity.status,
      expectedCloseDate: opportunity.expectedCloseDate ?? null,
      ownerName: owner?.name ?? null,
      storeName: store?.name ?? null,
      closedAt: opportunity.closedAt ?? null,
      finalAmount: opportunity.finalAmount ?? null,
      lostReason: opportunity.lostReason ?? null,
      // Solo el próximo paso accionable, pending o postponed (regla 6:
      // toda oportunidad abierta tiene siempre uno). En una cerrada será
      // null — closePendingNextSteps ya los marcó "done" al cerrar.
      // "overdue" (paso vencido) se calcula aquí, no se guarda —
      // docs/02-modelo-de-datos.md §3 — y va en la query en vez de la UI
      // porque Date.now() no es una función pura y no puede llamarse
      // durante el render de un componente. Frontera del día de negocio
      // (Europe/Madrid), no el instante exacto: mismo criterio que "Hoy"
      // (convex/nextSteps.ts) — si no, un paso de hoy a las 10:00 sería
      // "Hoy" en la agenda todo el día pero "Vencido" en el detalle desde
      // esa misma hora (AIT-16, ronda de auditoría 4, mayor #2).
      nextStep: nextStep
        ? {
            action: nextStep.action,
            dueDate: nextStep.dueDate,
            overdue: nextStep.dueDate < startOfBusinessDay(Date.now()),
          }
        : null,
    };
  },
});

// Mismo criterio de acceso que getSummary, pero lanzando en vez de
// devolviendo null: aquí estamos en una mutation que va a escribir, no en
// una consulta de solo lectura. "No encontrada" cubre tanto que no exista
// como que no sea de la tienda o del comercial — no se distingue el motivo
// para no filtrar qué IDs existen.
export async function loadOpenOpportunityOrThrow(
  ctx: MutationCtx,
  user: Doc<"users">,
  opportunityId: Id<"opportunities">,
): Promise<Doc<"opportunities">> {
  const opportunity = await ctx.db.get(opportunityId);
  if (opportunity === null) throw new Error("Oportunidad no encontrada.");
  if (opportunity.storeId !== user.storeId) {
    throw new Error("Oportunidad no encontrada.");
  }
  if (user.role !== "owner" && opportunity.ownerId !== user._id) {
    throw new Error("Oportunidad no encontrada.");
  }
  if (opportunity.status !== "open") {
    throw new Error("La oportunidad ya está cerrada.");
  }
  return opportunity;
}

// Regla 5 (docs/02-modelo-de-datos.md): al cerrar o cambiar de etapa, el(los)
// nextStep(s) accionables dejan de contar como tal — se marcan "done" en vez
// de dejarlos apuntando a una etapa o cierre que ya no aplica. Incluye
// "postponed" además de "pending" (AIT-16, convex/nextSteps.ts:postpone):
// un paso pospuesto sigue siendo accionable, solo con la fecha movida — si
// solo se cerraran los "pending", uno pospuesto sobreviviría a un cambio de
// etapa o a un cierre y quedaría huérfano junto al paso nuevo que genera
// changeStage, violando la regla de "un solo paso accionable a la vez".
// Exportada: convex/interactions.ts:create (AIT-19) la reutiliza tal cual
// para cerrar el paso anterior antes de crear el que sigue a una
// interacción — mismo patrón que changeStage aquí abajo, no una copia.
export async function closePendingNextSteps(
  ctx: MutationCtx,
  opportunityId: Id<"opportunities">,
) {
  const actionableSteps = await ctx.db
    .query("nextSteps")
    .withIndex("by_opportunity", (q) => q.eq("opportunityId", opportunityId))
    .filter((q) =>
      q.or(
        q.eq(q.field("status"), "pending"),
        q.eq(q.field("status"), "postponed"),
      ),
    )
    .collect();
  for (const step of actionableSteps) {
    await ctx.db.patch(step._id, { status: "done" });
  }
}

// AIT-14 + AIT-15: mover de etapa actualiza lastActivityAt y regenera el
// próximo paso (regla 3). El paso anterior se cierra antes de crear el
// nuevo para que nunca haya dos pendientes a la vez.
export const changeStage = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    stage: v.union(
      v.literal("contacto"),
      v.literal("presupuesto"),
      v.literal("negociacion"),
    ),
  },
  handler: async (ctx, { opportunityId, stage }) => {
    const user = await requireUser(ctx);
    const opportunity = await loadOpenOpportunityOrThrow(
      ctx,
      user,
      opportunityId,
    );

    if (opportunity.stage === stage) {
      throw new Error("La oportunidad ya está en esa etapa.");
    }

    const now = Date.now();
    await ctx.db.patch(opportunityId, { stage, lastActivityAt: now });
    await closePendingNextSteps(ctx, opportunityId);
    await ctx.db.insert("nextSteps", {
      opportunityId,
      action: NEXT_STEP_BY_STAGE[stage],
      dueDate: now,
      status: "pending",
      assigneeId: opportunity.ownerId,
    });
  },
});

// AIT-14: cierre ganado. El importe final es el real de la venta, distinto
// del estimatedAmount que alimentaba el forecast.
export const markWon = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    finalAmount: v.number(),
  },
  handler: async (ctx, { opportunityId, finalAmount }) => {
    const user = await requireUser(ctx);
    await loadOpenOpportunityOrThrow(ctx, user, opportunityId);

    if (
      !Number.isFinite(finalAmount) ||
      finalAmount < 0 ||
      finalAmount > MAX_AMOUNT
    ) {
      throw new Error("El importe final no es válido.");
    }
    const roundedFinalAmount = Math.round(finalAmount * 100) / 100;

    const now = Date.now();
    await ctx.db.patch(opportunityId, {
      status: "won",
      closedAt: now,
      finalAmount: roundedFinalAmount,
      lastActivityAt: now,
    });
    await closePendingNextSteps(ctx, opportunityId);
  },
});

// AIT-14: cierre perdido. lostReason es obligatorio (regla 4).
export const markLost = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    lostReason: v.string(),
  },
  handler: async (ctx, { opportunityId, lostReason }) => {
    const user = await requireUser(ctx);
    await loadOpenOpportunityOrThrow(ctx, user, opportunityId);

    const reason = lostReason.trim();
    if (reason.length === 0) {
      throw new Error("El motivo de la pérdida es obligatorio.");
    }

    const now = Date.now();
    await ctx.db.patch(opportunityId, {
      status: "lost",
      closedAt: now,
      lostReason: reason,
      lastActivityAt: now,
    });
    await closePendingNextSteps(ctx, opportunityId);
  },
});

// docs/02-modelo-de-datos.md §3: el riesgo no se guarda, se calcula al
// leer. 7 días es el valor de partida que fija el documento.
const RISK_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

// AIT-12: listado para el Pipeline (embudo por etapas). Mismo criterio de
// acceso que el resto de este archivo — storeId siempre, y ownerId además
// si el usuario es sales — aplicado en memoria porque el índice
// by_status_stage no incluye ownerId. Función nueva e independiente: no
// reutiliza ni modifica getSummary.
export const listOpen = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const openOpportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_status_stage", (q) => q.eq("status", "open"))
      .collect();

    const visible = openOpportunities.filter((opportunity) => {
      if (opportunity.storeId !== user.storeId) return false;
      if (user.role !== "owner" && opportunity.ownerId !== user._id) {
        return false;
      }
      return true;
    });

    const now = Date.now();
    const enriched = await Promise.all(
      visible.map(async (opportunity) => {
        const [customer, nextStep] = await Promise.all([
          ctx.db.get(opportunity.customerId),
          ctx.db
            .query("nextSteps")
            .withIndex("by_opportunity", (q) =>
              q.eq("opportunityId", opportunity._id),
            )
            // pending y postponed: mismo criterio que getSummary más arriba
            // (AIT-16, ronda de auditoría 4, mayor #1) — si no, el Pipeline
            // pierde nextStepAction en cuanto se pospone el paso.
            .filter((q) =>
              q.or(
                q.eq(q.field("status"), "pending"),
                q.eq(q.field("status"), "postponed"),
              ),
            )
            .first(),
        ]);
        // Mismo chequeo que getSummary: no basta con que la oportunidad ya
        // esté filtrada por storeId — si una relación cruzada o corrupta
        // apuntara a un cliente de otra tienda, este segundo chequeo evita
        // filtrar su nombre. En uso normal nunca ocurre (un cliente nunca
        // falta ni cambia de tienda), pero no se asume.
        if (customer === null || customer.storeId !== user.storeId) {
          return null;
        }
        return {
          id: opportunity._id,
          stage: opportunity.stage,
          customerName: customer.name,
          estimatedAmount: opportunity.estimatedAmount ?? null,
          nextStepAction: nextStep?.action ?? null,
          atRisk: now - opportunity.lastActivityAt > RISK_THRESHOLD_MS,
        };
      }),
    );

    return enriched.filter((item) => item !== null);
  },
});

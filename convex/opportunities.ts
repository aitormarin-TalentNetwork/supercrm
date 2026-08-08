import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./model/access";

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

// Techo puramente defensivo (no una regla de negocio real): bloquea
// importes negativos, no numéricos o desproporcionados enviados por una
// llamada directa a la mutation, sin depender de que el formulario valide.
const MAX_ESTIMATED_AMOUNT = 100_000_000;

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
        args.estimatedAmount > MAX_ESTIMATED_AMOUNT
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

// Consulta mínima para la ficha de confirmación (Detalle de oportunidad
// real = AIT-13, aún no construido). No basta con comprobar la
// oportunidad: el cliente relacionado se valida también contra la misma
// tienda, para que una relación cruzada futura no filtre el nombre de un
// cliente ajeno.
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

    const nextStep = await ctx.db
      .query("nextSteps")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", opportunityId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    return {
      customerName: customer.name,
      interest: opportunity.interest ?? null,
      estimatedAmount: opportunity.estimatedAmount ?? null,
      nextStepAction: nextStep?.action ?? null,
    };
  },
});

import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { isStoreWideRole, requireUser } from "./model/access";
import { loadOpenOpportunityOrThrow } from "./opportunities";
import type { Doc, Id } from "./_generated/dataModel";
import { computeQuoteTotals, roundTaxRate } from "../lib/quoteMath";

// Techo puramente defensivo (no una regla de negocio real), mismo criterio
// que MAX_AMOUNT en convex/opportunities.ts — bloquea envíos directos con
// importes absurdos sin depender de que el formulario valide.
const MAX_AMOUNT = 100_000_000;
const MAX_QUANTITY = 100_000;

// Decisión de diseño para "cuál es el presupuesto activo" (docs/02-modelo-
// de-datos.md §1: quotes es "0..n, 1 activa"): AIT-21 pide explícitamente
// "Presupuesto simple (sin catálogo de productos ni PDF)" y la propia
// mutation que pide el brief es "si no existe, créalo; si ya existe,
// actualiza importe y estado" — es decir, en esta versión simple hay como
// mucho UNA fila de quotes por oportunidad, siempre: la primera llamada
// inserta, cualquier llamada posterior actualiza esa misma fila en vez de
// crear un histórico de revisiones. AIT-29 (Post-MVP, ronda 1) mantiene
// este mismo invariante — varias versiones por oportunidad es la ronda 2,
// junto al PDF. No hace falta ningún criterio de desempate entre varias
// filas porque nunca puede haber más de una para la misma oportunidad.
async function loadOpportunityOrNull(
  ctx: QueryCtx | MutationCtx,
  user: Doc<"users">,
  opportunityId: Id<"opportunities">,
) {
  const opportunity = await ctx.db.get(opportunityId);
  if (opportunity === null) return null;
  if (opportunity.storeId !== user.storeId) return null;
  if (!isStoreWideRole(user) && opportunity.ownerId !== user._id) return null;
  return opportunity;
}

// Query de solo lectura: si no hay acceso a la oportunidad, o si todavía no
// se ha creado ningún presupuesto para ella, devuelve null en ambos casos
// — mismo patrón que opportunities.getSummary con "nextStep": el llamador
// ya validó el acceso a la oportunidad por su cuenta (getSummary) antes de
// pedir esto, así que aquí no hace falta distinguir el motivo.
export const getForOpportunity = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, { opportunityId }) => {
    const user = await requireUser(ctx);
    const opportunity = await loadOpportunityOrNull(ctx, user, opportunityId);
    if (opportunity === null) return null;

    const quote = await ctx.db
      .query("quotes")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", opportunityId))
      .unique();
    if (quote === null) return null;

    return {
      lines: quote.lines.map((line) => ({
        productId: line.productId,
        productName: line.productName,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })),
      taxRate: quote.taxRate,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      status: quote.status,
      sentAt: quote.sentAt,
    };
  },
});

// Registra o actualiza el presupuesto de una oportunidad, por líneas
// (AIT-29, Post-MVP ronda 1 — sustituye el importe suelto de AIT-21).
// Mismo criterio de acceso que el resto de mutations de oportunidades:
// lanza en vez de devolver null, porque aquí sí se va a escribir.
//
// El cliente manda `productId` + `quantity` por línea, NUNCA el nombre ni
// el precio: ambos se leen del catálogo aquí, en servidor, en el momento
// de guardar, y esa foto es lo que se persiste (convex/schema.ts:quotes —
// productName/unitPrice no son una referencia viva al catálogo). Confiar
// en un nombre/precio que mandara el cliente permitiría a una llamada
// directa a la mutation inventar precios — el subtotal/impuestos/total
// tampoco se aceptan del cliente por el mismo motivo, se recalculan aquí
// siempre.
export const upsertForOpportunity = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    lines: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
      }),
    ),
    taxRate: v.number(),
    status: v.union(
      v.literal("sent"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
  },
  handler: async (ctx, { opportunityId, lines, taxRate, status }) => {
    const user = await requireUser(ctx);
    // loadOpenOpportunityOrThrow (no loadOpportunityOrNull) — exige
    // status === "open", igual que el resto de mutations que escriben
    // sobre una oportunidad (changeStage, markWon/Lost,
    // interactions.create). Sin esto, una llamada directa a la mutation
    // podía crear o modificar el presupuesto de una oportunidad ya
    // cerrada aunque la UI lo deshabilitara (ronda de auditoría 1,
    // mayor #1) — loadOpportunityOrNull solo comprobaba tienda y
    // propietario, no si seguía abierta. getForOpportunity (lectura, más
    // arriba) SÍ sigue usando loadOpportunityOrNull a propósito: ver un
    // presupuesto ya cerrado tiene que seguir funcionando.
    await loadOpenOpportunityOrThrow(ctx, user, opportunityId);

    if (lines.length === 0) {
      throw new Error("El presupuesto necesita al menos una línea.");
    }
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1) {
      throw new Error("El tipo de impuesto no es válido.");
    }
    // Redondeado al mismo contrato de precisión que usa la UI para
    // mostrar/precargar el IVA (lib/quoteMath.ts, ronda de auditoría 4) —
    // así ningún taxRate persistido puede tener ya más decimales de los
    // que el editor es capaz de representar sin pérdida.
    const roundedTaxRate = roundTaxRate(taxRate);

    const existing = await ctx.db
      .query("quotes")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", opportunityId))
      .unique();
    // Foto de cada línea ya guardada, indexada por producto — para el caso
    // de un producto borrado del catálogo después de usarse en este mismo
    // presupuesto (ronda de auditoría 2, mayor único). products.remove
    // documenta explícitamente que borrar no debe romper presupuestos ya
    // guardados; sin esto, volver a guardar (aunque solo fuera para
    // cambiar el estado) SIEMPRE re-resuelve todas las líneas contra el
    // catálogo actual y rechazaba la línea entera al no encontrar el
    // producto ya borrado.
    const previousLineByProduct = new Map(
      (existing?.lines ?? []).map((line) => [line.productId, line]),
    );

    const resolvedLines = await Promise.all(
      lines.map(async (line) => {
        if (
          !Number.isFinite(line.quantity) ||
          line.quantity <= 0 ||
          line.quantity > MAX_QUANTITY
        ) {
          throw new Error("Hay una cantidad no válida en las líneas del presupuesto.");
        }
        const product = await ctx.db.get(line.productId);
        if (product !== null && product.storeId === user.storeId) {
          return {
            productId: product._id,
            productName: product.name,
            quantity: line.quantity,
            unitPrice: product.price,
          };
        }
        // El producto ya no existe en el catálogo (o no es de esta
        // tienda): si esta línea ya formaba parte del presupuesto
        // guardado, se conserva su foto original en vez de rechazar toda
        // la operación — el precio no sale del cliente, sale de lo que ya
        // había persistido el servidor en un guardado anterior.
        const previous = previousLineByProduct.get(line.productId);
        if (previous !== undefined) {
          return {
            productId: previous.productId,
            productName: previous.productName,
            quantity: line.quantity,
            unitPrice: previous.unitPrice,
          };
        }
        throw new Error("Uno de los productos del presupuesto no existe.");
      }),
    );

    const { subtotal, tax, total } = computeQuoteTotals(resolvedLines, roundedTaxRate);
    if (subtotal > MAX_AMOUNT) {
      throw new Error("El importe del presupuesto es demasiado alto.");
    }

    const fields = {
      lines: resolvedLines,
      taxRate: roundedTaxRate,
      subtotal,
      tax,
      total,
      status,
    };

    if (existing !== null) {
      // sentAt NO se toca aquí a propósito: registra cuándo se creó/envió
      // este presupuesto por primera vez, no la última vez que se editó su
      // importe o estado (p. ej. al marcarlo "aceptado" más tarde).
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }

    return await ctx.db.insert("quotes", {
      opportunityId,
      ...fields,
      sentAt: Date.now(),
    });
  },
});

// Migración puntual (ronda de auditoría 5, mayor único): el contrato de
// precisión de `taxRate` (roundTaxRate, lib/quoteMath.ts) se introdujo en
// el loop 5 y solo se aplica dentro de `upsertForOpportunity` — cualquier
// `quotes` ya guardado ANTES de ese cambio puede tener un `taxRate` con
// más decimales de los que el contrato permite. Sin esto, el primer
// resave de un presupuesto histórico (aunque fuera solo para cambiar el
// estado) lo normalizaría de forma implícita, sin ningún rastro de que
// ese IVA/total ya mostrado o enviado a un cliente cambió. Se ejecuta una
// única vez contra el deployment compartido (`npx convex run
// quotes:normalizeTaxRates`, con confirmación explícita del usuario) para
// dejar TODOS los `quotes` existentes ya en el contrato antes de que
// nadie vuelva a abrir su editor — así ningún guardado, pasado o futuro,
// puede mover un IVA/total sin que quede reflejado en este mismo cambio
// controlado. Internal (no expuesta a mutation de cliente) porque es una
// operación de mantenimiento, no una acción de producto; idempotente
// (recalcular un documento ya en el contrato es un no-op, por el filtro
// `roundedTaxRate === quote.taxRate`) — repetirla no tiene efecto
// secundario si por lo que sea se ejecuta más de una vez.
export const normalizeTaxRates = internalMutation({
  args: {},
  handler: async (ctx) => {
    const quotes = await ctx.db.query("quotes").collect();
    let normalized = 0;
    for (const quote of quotes) {
      const roundedTaxRate = roundTaxRate(quote.taxRate);
      if (roundedTaxRate === quote.taxRate) continue;
      const { subtotal, tax, total } = computeQuoteTotals(quote.lines, roundedTaxRate);
      await ctx.db.patch(quote._id, {
        taxRate: roundedTaxRate,
        subtotal,
        tax,
        total,
      });
      normalized++;
    }
    return { checked: quotes.length, normalized };
  },
});

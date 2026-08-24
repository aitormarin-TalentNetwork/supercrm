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
// Igual de defensivo que los dos de arriba: nada en el flujo real de venta
// necesita cientos de versiones de un mismo presupuesto — este tope solo
// existe para que una llamada directa repetida a la mutation no pueda
// inflar `quotes` sin límite para una única oportunidad.
const MAX_VERSIONS = 500;

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

function toVersionSummary(quote: Doc<"quotes">) {
  return {
    quoteId: quote._id,
    // Ausente = versión 1 implícita (ver comentario en convex/schema.ts).
    version: quote.version ?? 1,
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
}

// Todas las versiones de presupuesto de una oportunidad, la más reciente
// primero (AIT-54 — sustituye a `getForOpportunity`, que devolvía como
// mucho una). Si no hay acceso a la oportunidad, o si todavía no se ha
// creado ningún presupuesto, devuelve null en ambos casos — mismo patrón
// que opportunities.getSummary con "nextStep": el llamador ya validó el
// acceso a la oportunidad por su cuenta (getSummary) antes de pedir esto,
// así que aquí no hace falta distinguir el motivo. El elemento `[0]` del
// array devuelto es siempre la versión vigente; el resto es histórico.
export const listForOpportunity = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, { opportunityId }) => {
    const user = await requireUser(ctx);
    const opportunity = await loadOpportunityOrNull(ctx, user, opportunityId);
    if (opportunity === null) return null;

    const quotes = await ctx.db
      .query("quotes")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", opportunityId))
      .collect();
    if (quotes.length === 0) return null;

    return quotes
      .map(toVersionSummary)
      .sort((a, b) => b.version - a.version || b.sentAt - a.sentAt);
  },
});

// Crea una NUEVA versión del presupuesto de una oportunidad (AIT-54 —
// sustituye a `upsertForOpportunity`, que sobreescribía la única fila
// existente). Cada guardado inserta una fila nueva con el número de
// versión siguiente: ninguna versión anterior se pierde ni se modifica
// nunca — `sentAt` de cada una queda fijo en el momento en que esa versión
// concreta se creó, sin el caso especial que hacía falta antes para no
// tocarlo en un resave.
//
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
export const createVersion = mutation({
  args: {
    // Idempotencia (ronda de auditoría 1, mayor #2) — una clave por
    // apertura del diálogo, mismo mecanismo que opportunities.createQuick
    // (ver convex/schema.ts:quoteRequests). Un reintento de red del MISMO
    // envío reutiliza la misma clave y devuelve la versión ya creada, en
    // vez de insertar un duplicado con datos idénticos.
    clientRequestId: v.string(),
    opportunityId: v.id("opportunities"),
    // Versión sobre la que el cliente basó su edición: 0 si no existía
    // ningún presupuesto cuando abrió el diálogo, o el número de la
    // versión que estaba viendo/editando. Ronda de auditoría 1, mayor #3
    // — sin esto, dos personas editando a la vez (o una pestaña con el
    // diálogo abierto mucho rato) podían guardar sobre una versión que ya
    // no era la vigente, sin ningún aviso: la segunda en guardar "ganaba"
    // en silencio y la versión intermedia quedaba enterrada en el
    // historial sin que nadie supiera que existió ese conflicto.
    baseVersion: v.number(),
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
  handler: async (ctx, { clientRequestId, opportunityId, baseVersion, lines, taxRate, status }) => {
    const user = await requireUser(ctx);

    // .collect() en vez de .unique() (mismo criterio que createQuick): si
    // alguna vez colisionara la clave entre dos usuarios, cada uno solo
    // reconoce la suya.
    const existingRequests = await ctx.db
      .query("quoteRequests")
      .withIndex("by_client_request_id", (q) =>
        q.eq("clientRequestId", clientRequestId),
      )
      .collect();
    const ownRequest = existingRequests.find((r) => r.userId === user._id);
    if (ownRequest) return ownRequest.quoteId;

    // loadOpenOpportunityOrThrow (no loadOpportunityOrNull) — exige
    // status === "open", igual que el resto de mutations que escriben
    // sobre una oportunidad (changeStage, markWon/Lost,
    // interactions.create). Sin esto, una llamada directa a la mutation
    // podía crear o modificar el presupuesto de una oportunidad ya
    // cerrada aunque la UI lo deshabilitara (ronda de auditoría 1,
    // mayor #1) — loadOpportunityOrNull solo comprobaba tienda y
    // propietario, no si seguía abierta. listForOpportunity (lectura, más
    // arriba) SÍ sigue usando loadOpportunityOrNull a propósito: ver el
    // historial de un presupuesto ya cerrado tiene que seguir funcionando.
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

    const existingQuotes = await ctx.db
      .query("quotes")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", opportunityId))
      .collect();
    if (existingQuotes.length >= MAX_VERSIONS) {
      throw new Error("Este presupuesto ya tiene demasiadas versiones guardadas.");
    }
    // Última versión ya guardada (si hay alguna) — de ahí sale el número
    // de la versión nueva y, para el caso de un producto ya borrado del
    // catálogo, la foto de precio a conservar (mismo criterio que antes de
    // AIT-54, ronda de auditoría 2: products.remove documenta explícitamente
    // que borrar no debe romper presupuestos ya guardados).
    const latest = existingQuotes.reduce<Doc<"quotes"> | null>((best, quote) => {
      const version = quote.version ?? 1;
      if (best === null || version > (best.version ?? 1)) return quote;
      return best;
    }, null);

    const actualLatestVersion = latest ? latest.version ?? 1 : 0;
    if (actualLatestVersion !== baseVersion) {
      throw new Error(
        `Alguien ha guardado una versión más reciente (v${actualLatestVersion}) mientras editabas. Recarga la página para verla antes de guardar.`,
      );
    }

    const previousLineByProduct = new Map(
      (latest?.lines ?? []).map((line) => [line.productId, line]),
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
        // tienda): si esta línea ya formaba parte de la versión anterior,
        // se conserva su foto original en vez de rechazar toda la
        // operación — el precio no sale del cliente, sale de lo que ya
        // había persistido el servidor en la versión previa.
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

    const quoteId = await ctx.db.insert("quotes", {
      opportunityId,
      version: actualLatestVersion + 1,
      lines: resolvedLines,
      taxRate: roundedTaxRate,
      subtotal,
      tax,
      total,
      status,
      sentAt: Date.now(),
    });

    await ctx.db.insert("quoteRequests", {
      clientRequestId,
      userId: user._id,
      quoteId,
    });

    return quoteId;
  },
});

// Migración puntual (ronda de auditoría 5, mayor único): el contrato de
// precisión de `taxRate` (roundTaxRate, lib/quoteMath.ts) se introdujo en
// el loop 5 y solo se aplica dentro de `createVersion` (antes
// `upsertForOpportunity`) — cualquier `quotes` ya guardado ANTES de ese
// cambio puede tener un `taxRate` con más decimales de los que el
// contrato permite. Sin esto, el primer resave de un presupuesto
// histórico (aunque fuera solo para cambiar el estado) lo normalizaría de
// forma implícita, sin ningún rastro de que ese IVA/total ya mostrado o
// enviado a un cliente cambió. Se ejecuta una única vez contra el
// deployment compartido (`npx convex run quotes:normalizeTaxRates`, con
// confirmación explícita del usuario) para dejar TODOS los `quotes`
// existentes ya en el contrato antes de que nadie vuelva a abrir su
// editor — así ningún guardado, pasado o futuro, puede mover un IVA/total
// sin que quede reflejado en este mismo cambio controlado. Internal (no
// expuesta a mutation de cliente) porque es una operación de
// mantenimiento, no una acción de producto; idempotente (recalcular un
// documento ya en el contrato es un no-op, por el filtro
// `roundedTaxRate === quote.taxRate`) — repetirla no tiene efecto
// secundario si por lo que sea se ejecuta más de una vez. Sigue
// funcionando igual tras AIT-54: recorre TODAS las filas de `quotes`
// (ahora puede haber varias por oportunidad), no le afecta el campo
// `version`.
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

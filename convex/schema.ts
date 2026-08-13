import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Sustituye la tabla `users` de authTables: mismos campos de Convex Auth
  // (todos opcionales) + los nuestros (obligatorios). El índice se llama
  // "email" a secas porque el código interno de Convex Auth lo busca así.
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.union(v.literal("owner"), v.literal("sales")),
    storeId: v.id("stores"),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  stores: defineTable({
    name: v.string(),
  }),

  // Invariante explícito de "la tienda por defecto": un documento con
  // clave conocida, no "la primera fila de stores". No se administra a mano.
  appConfig: defineTable({
    key: v.string(),
    storeId: v.optional(v.id("stores")),
  }).index("by_key", ["key"]),

  customers: defineTable({
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    source: v.string(),
    ownerId: v.id("users"),
    storeId: v.id("stores"),
  }).index("by_owner", ["ownerId"]),

  opportunities: defineTable({
    customerId: v.id("customers"),
    stage: v.union(
      v.literal("contacto"),
      v.literal("presupuesto"),
      v.literal("negociacion"),
    ),
    status: v.union(v.literal("open"), v.literal("won"), v.literal("lost")),
    interest: v.optional(v.string()),
    estimatedAmount: v.optional(v.number()),
    expectedCloseDate: v.optional(v.number()),
    lostReason: v.optional(v.string()),
    closedAt: v.optional(v.number()),
    finalAmount: v.optional(v.number()),
    lastActivityAt: v.number(),
    ownerId: v.id("users"),
    storeId: v.id("stores"),
    // Declarado aquí solo por compatibilidad con el deployment compartido
    // (Post-MVP, AIT-35 "prioridad en oportunidades" — otra terminal en
    // marcha en paralelo ya está escribiendo este campo en real). AIT-29
    // no lee ni escribe priority en ningún sitio — opcional a propósito
    // para no forzarlo en documentos que todavía no lo tienen, ni
    // duplicar la lógica/UI de AIT-35, que no es de esta tarea.
    priority: v.optional(
      v.union(v.literal("alta"), v.literal("media"), v.literal("baja")),
    ),
  })
    .index("by_owner", ["ownerId"])
    .index("by_customer", ["customerId"])
    .index("by_status_stage", ["status", "stage"]),

  // AIT-29 (Post-MVP, ronda 1 — catálogo + cálculo): sustituye el `amount`
  // plano de AIT-21 por una colección de líneas. `productName`/`unitPrice`
  // son una FOTO del catálogo en el momento de añadir la línea, no una
  // referencia viva — si el precio de un producto cambia en el catálogo
  // después, los presupuestos ya creados no deben moverse solos. Sigue
  // habiendo como mucho UN presupuesto por oportunidad (upsert, igual que
  // AIT-21) — varias versiones queda para una ronda 2 aparte, junto al PDF.
  quotes: defineTable({
    opportunityId: v.id("opportunities"),
    lines: v.array(
      v.object({
        productId: v.id("products"),
        productName: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
      }),
    ),
    taxRate: v.number(),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    status: v.union(
      v.literal("sent"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
    sentAt: v.number(),
  }).index("by_opportunity", ["opportunityId"]),

  // Catálogo de productos (AIT-29, Post-MVP). Lo administra Marta
  // (owner); Carlos solo lo lee para construir presupuestos.
  products: defineTable({
    name: v.string(),
    price: v.number(),
    storeId: v.id("stores"),
  }).index("by_store", ["storeId"]),

  interactions: defineTable({
    opportunityId: v.id("opportunities"),
    customerId: v.id("customers"),
    type: v.union(
      v.literal("llamada"),
      v.literal("whatsapp"),
      v.literal("email"),
      v.literal("visita"),
    ),
    note: v.string(),
    occurredAt: v.number(),
    authorId: v.id("users"),
  })
    .index("by_opportunity", ["opportunityId"])
    .index("by_customer", ["customerId"]),

  nextSteps: defineTable({
    opportunityId: v.id("opportunities"),
    action: v.string(),
    dueDate: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("done"),
      v.literal("postponed"),
    ),
    assigneeId: v.id("users"),
  })
    .index("by_assignee_status", ["assigneeId", "status"])
    .index("by_opportunity", ["opportunityId"]),

  // Interna (no es una de las 7 entidades del PRD): idempotencia de
  // createQuick. Un reintento de red con la misma clientRequestId debe
  // devolver la oportunidad ya creada, no duplicarla. userId acota la
  // clave a quien la generó: si alguien reutilizara una clave ajena
  // conocida, no recibe el ID de la oportunidad de otro usuario (ronda de
  // auditoría 3, sugerencia #1).
  opportunityRequests: defineTable({
    clientRequestId: v.string(),
    userId: v.id("users"),
    opportunityId: v.id("opportunities"),
  }).index("by_client_request_id", ["clientRequestId"]),

  // Idempotencia de interactions.create (AIT-19), mismo mecanismo que
  // opportunityRequests para createQuick: una clave por apertura del
  // modal, reutilizada en un reintento del MISMO envío — si el servidor ya
  // confirmó pero la respuesta se perdió, un reintento no debe duplicar ni
  // el historial ni el próximo paso (ronda de auditoría 1, mayor #1).
  interactionRequests: defineTable({
    clientRequestId: v.string(),
    userId: v.id("users"),
    interactionId: v.id("interactions"),
  }).index("by_client_request_id", ["clientRequestId"]),
});

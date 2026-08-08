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
  })
    .index("by_owner", ["ownerId"])
    .index("by_customer", ["customerId"])
    .index("by_status_stage", ["status", "stage"]),

  quotes: defineTable({
    opportunityId: v.id("opportunities"),
    amount: v.number(),
    status: v.union(
      v.literal("sent"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
    sentAt: v.number(),
  }).index("by_opportunity", ["opportunityId"]),

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
});

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  stores: defineTable({
    name: v.string(),
  }),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("owner"), v.literal("sales")),
    storeId: v.id("stores"),
  }).index("by_email", ["email"]),

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
});

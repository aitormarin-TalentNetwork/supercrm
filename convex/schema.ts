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
    role: v.union(
      v.literal("owner"),
      v.literal("storeManager"),
      v.literal("sales"),
    ),
    storeId: v.id("stores"),
    // AIT-52 (Post-MVP): desactivar acceso sin borrar historial (sus
    // oportunidades/interacciones quedan intactas, solo deja de poder
    // entrar — comprobado en convex/auth.ts). Opcional en el schema (no
    // obligatorio) porque los usuarios ya existentes en el deployment
    // compartido no lo tienen — se tratan como activos allí donde se lee
    // (`?? true`), igual que otros campos añadidos a esta tabla en
    // rondas anteriores (p.ej. priority en opportunities, AIT-35).
    // createUser sí lo fija explícitamente en todo alta nueva.
    active: v.optional(v.boolean()),
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
  })
    .index("by_owner", ["ownerId"])
    // AIT-58: listado de clientes de la tienda (customers.list) — sin esto,
    // resolver "todos los clientes de mi tienda" para owner/storeManager
    // exigiría un scan completo de la tabla filtrado en memoria, igual que
    // el problema ya corregido en opportunities (ver by_store_status más
    // abajo, AIT-33 ronda 2).
    .index("by_store", ["storeId"]),

  opportunities: defineTable({
    customerId: v.id("customers"),
    stage: v.union(
      v.literal("contacto"),
      v.literal("presupuesto"),
      v.literal("negociacion"),
    ),
    status: v.union(v.literal("open"), v.literal("won"), v.literal("lost")),
    // Post-MVP AIT-35: prioridad manual (importancia), distinta del riesgo
    // automático de lib/risk.ts (urgencia por inactividad). Opcional en el
    // schema — no obligatorio — porque las oportunidades ya existentes en
    // el deployment compartido no tienen este campo y una migración
    // retroactiva está fuera de alcance de esta tarea; se trata como
    // "media" allí donde se lee (ver getSummary/listOpen). createQuick sí
    // fija "media" explícitamente en todo registro nuevo.
    priority: v.optional(
      v.union(v.literal("alta"), v.literal("media"), v.literal("baja")),
    ),
    interest: v.optional(v.string()),
    estimatedAmount: v.optional(v.number()),
    expectedCloseDate: v.optional(v.number()),
    lostReason: v.optional(v.string()),
    closedAt: v.optional(v.number()),
    finalAmount: v.optional(v.number()),
    lastActivityAt: v.number(),
    ownerId: v.id("users"),
    storeId: v.id("stores"),
    // AIT-33 (Post-MVP): ciclo de cobro de una venta ganada, marcado
    // manual — la factura legal se emite fuera del CRM, esto solo hace
    // seguimiento de estado. Campo en `opportunities`, no tabla aparte:
    // es 1:1 con la oportunidad (una venta, un ciclo de cobro), sin
    // historial ni datos propios más allá del estado — una tabla nueva
    // añadiría un join sin aportar nada que este campo no cubra ya.
    // Opcional porque solo aplica a oportunidades ganadas (undefined en
    // abiertas/perdidas, y también en ganadas anteriores a esta tarea —
    // ver el fallback a "listo_para_facturar" en las queries/mutations
    // que lo leen, sin necesidad de migrar datos existentes).
    billingStatus: v.optional(
      v.union(
        v.literal("listo_para_facturar"),
        v.literal("facturado"),
        v.literal("cobrado"),
      ),
    ),
    // AIT-57 (Post-MVP, en curso en T2): notificaciones push reales. No es
    // de esta tarea (AIT-60) — declarado aquí solo para que este schema
    // describa la realidad ya desplegada en el deployment compartido (T2
    // ya lo tiene en producción de datos aunque su rama no esté mergeada
    // a main todavía) y no choque al desplegar. Confirmado con T2 el tipo
    // exacto: v.optional(v.number()), mismo patrón que lastActivityAt.
    lastRiskPushSentAt: v.optional(v.number()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_customer", ["customerId"])
    .index("by_status_stage", ["status", "stage"])
    // AIT-33 (hallazgo de auditoría, NO-GO ronda 2): `by_status_stage`
    // empieza por `status`, así que una consulta que solo fija `status`
    // (como listPendingBilling) trae TODAS las oportunidades de esa
    // condición de TODAS las tiendas antes de filtrar por storeId en
    // memoria — coste que crece con el negocio entero, no con el de la
    // tienda que pregunta, y una lectura más amplia de la necesaria en
    // una query multi-tenant. Este índice, con storeId primero, permite
    // consultar directamente solo lo de la tienda del usuario.
    .index("by_store_status", ["storeId", "status"]),

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
    // AIT-57 (Post-MVP, en curso en T2): mismo motivo que
    // opportunities.lastRiskPushSentAt más arriba — no es de esta tarea,
    // declarado solo para no chocar con datos ya desplegados por T2.
    lastPushSentAt: v.optional(v.number()),
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

  // AIT-30 (Post-MVP): recordatorio de recompra tras una venta ganada.
  // Tabla propia, no `nextSteps` — conceptualmente distinto (fidelización
  // futura de un cliente ya cerrado, no seguimiento de una venta abierta
  // en curso) y con un ciclo de vida a meses vista, no a días. ownerId y
  // storeId se copian de la oportunidad al crearlo (no se derivan cada vez
  // por join) para poder filtrar por comercial/tienda igual que el resto
  // de listados del proyecto.
  repurchaseReminders: defineTable({
    customerId: v.id("customers"),
    opportunityId: v.id("opportunities"),
    ownerId: v.id("users"),
    storeId: v.id("stores"),
    dueDate: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("done"),
      v.literal("dismissed"),
    ),
  })
    .index("by_status", ["status"])
    .index("by_customer", ["customerId"])
    // AIT-30 (hallazgo de auditoría, NO-GO ronda 3): `by_status` empieza
    // por `status`, así que listToReactivate traía TODOS los recordatorios
    // pendientes de TODAS las tiendas antes de filtrar por storeId en
    // memoria — mismo problema que tuvo listPendingBilling en AIT-33,
    // mismo arreglo: índice con storeId primero.
    .index("by_store_status", ["storeId", "status"]),
});

# 02 · Modelo de datos

**Estado:** 🟢 Validado y escrito en `convex/schema.ts` (Fase 1 · Fundamentos, issues AIT-7 y AIT-8).
**Origen:** PRD §8 (Datos), bloque "Resumen — la información principal".

---

## 1. Las 7 entidades

El PRD las nombra así:

| Entidad | Tabla Convex | Una frase |
|---|---|---|
| Tienda | `stores` | El punto de venta. En el MVP **hay una sola**, pero el campo existe desde el día 1 para no rehacer todo en Post-MVP. |
| Usuario | `users` | Quién usa el sistema y qué puede ver (`owner` = Marta, `sales` = Carlos). |
| Cliente | `customers` | La persona o empresa a la que vendemos. |
| Oportunidad | `opportunities` | Una posible venta y su recorrido por las etapas. **Es el centro de todo.** |
| Presupuesto | `quotes` | La oferta económica de una oportunidad (en el MVP: importe + estado, **sin PDF**). |
| Interacción | `interactions` | Cada contacto que se tiene con el cliente (llamada, WhatsApp, email, visita). |
| Próximo paso | `nextSteps` | La siguiente acción a hacer y cuándo. **Es la razón de ser del producto.** |

### Cómo se relacionan

```
stores (1 en el MVP)
  └── users (owner | sales)
        └── customers ──── opportunities ──┬── quotes         (0..n, 1 activa)
                                           ├── interactions   (0..n, historial)
                                           └── nextSteps      (0..n, 1 pendiente)
```

**La regla que sostiene el producto:** *toda oportunidad abierta tiene siempre un próximo paso pendiente.* Cero seguimientos perdidos (PRD §6, criterio de éxito). Se garantiza en las mutations, no en la UI.

---

## 2. Campos

### `stores`
| Campo | Tipo | Notas |
|---|---|---|
| `name` | string | |

### `users`
| Campo | Tipo | Notas |
|---|---|---|
| `name` | string? | Opcional a nivel de Convex Auth; siempre presente en la práctica (lo fija el bootstrap) |
| `email` | string? | Login. Índice `"email"` (no `by_email`): así lo busca internamente Convex Auth |
| `emailVerificationTime`, `phone`, `phoneVerificationTime`, `isAnonymous`, `image` | — | Campos propios de Convex Auth, no usados en el MVP (sin verificación de email, sin login por teléfono) |
| `role` | `"owner"` \| `"sales"` | Marta / Carlos. **Obligatorio** — se asigna en servidor (`convex/auth.ts:createOrUpdateUser`), nunca desde el cliente |
| `storeId` | id(`stores`) | **Obligatorio** — igual, asignado en servidor al crear el usuario |

**Por qué `users` tiene campos opcionales de Convex Auth mezclados con los nuestros obligatorios:** la tabla `users` la crea y gestiona la librería `@convex-dev/auth`, que solo exige campos opcionales (para admitir proveedores sin email, como OAuth). `role` y `storeId` son la extensión propia del proyecto sobre esa tabla, y sí son obligatorios — ver ADR-001 en `docs/01-arquitectura.md`.

Además de `users`, Convex Auth gestiona **6 tablas propias** (`authSessions`, `authAccounts`, `authRefreshTokens`, `authVerificationCodes`, `authVerifiers`, `authRateLimits`), añadidas vía `...authTables` en `convex/schema.ts`. No se tocan a mano ni se documentan campo a campo aquí — son infraestructura de la librería, no entidades de negocio.

### `appConfig` (interna, no es una de las 7 entidades del PRD)
| Campo | Tipo | Notas |
|---|---|---|
| `key` | string | Clave fija, hoy solo `"default_store"` |
| `storeId` | id(`stores`)? | La tienda por defecto del MVP |

Existe para que "la tienda por defecto" tenga un identificador explícito (un documento con clave conocida) en vez de asumir "la primera fila de `stores`". La rellena una sola vez `convex/users.ts:ensureDefaultStore`; no se administra a mano — un alta manual duplicada rompería el `.unique()` que la consulta.

**Por qué los 2 usuarios iniciales (Marta y Carlos) no son "datos mock":** son las credenciales reales con las que se entra a la aplicación. Como el PRD no contempla registro público ("los accesos los crea la dueña de tu empresa"), no hay formulario de alta — se crean una sola vez con `convex/users.ts:bootstrapInitialAccounts`, una acción interna invocable solo desde el CLI/dashboard de Convex, nunca desde el cliente.

### `customers`
| Campo | Tipo | Notas |
|---|---|---|
| `name` | string | |
| `phone` | string | |
| `email` | string? | Opcional (PRD: Alta rápida) |
| `source` | string | Canal de origen: llamada, WhatsApp, recomendación, web… |
| `ownerId` | id(`users`) | Comercial asignado — **se asigna solo** según quién ha iniciado sesión |
| `storeId` | id(`stores`) | Igual: automático |

### `opportunities`
| Campo | Tipo | Notas |
|---|---|---|
| `customerId` | id(`customers`) | |
| `stage` | `"contacto"` \| `"presupuesto"` \| `"negociacion"` | Las 3 etapas del MVP (facturar y recompra son Post-MVP) |
| `status` | `"open"` \| `"won"` \| `"lost"` | Abierta hasta que se cierra |
| `interest` | string? | Producto/servicio o interés |
| `estimatedAmount` | number? | Alimenta el pipeline y el forecast |
| `expectedCloseDate` | number? | Timestamp. Alimenta el forecast |
| `lostReason` | string? | **Obligatorio si `status = "lost"`** |
| `closedAt` | number? | |
| `finalAmount` | number? | Importe real al cerrar |
| `lastActivityAt` | number | **Clave para el riesgo.** Se actualiza en CADA interacción y cambio de etapa |
| `ownerId` | id(`users`) | Comercial |
| `storeId` | id(`stores`) | |

> **Por qué 3 etapas y no 6.** El design system trae una paleta de 6 colores de pipeline (`nuevo`, `contactado`, `propuesta`, `negociacion`, `ganado`, `perdido`) y es fácil confundirla con 6 etapas. No lo son:
> - **`ganado` y `perdido` no son etapas, son `status`.** Van aparte porque de ellos cuelgan `lostReason`, `closedAt` y `finalAmount`.
> - **`nuevo` no lo usa ninguna pantalla.** Es un token de paleta que sobra.
>
> El PRD §7 lo fija: *"Columnas por etapa: Contacto → Presupuesto → Negociación/Cierre (con resultado Ganada/Perdida)"*. Y `Design/pantallas/Pipeline.dc.html` implementa exactamente eso (`const OPEN = ['contactado','propuesta','negociacion']`, más Ganada y Perdida como resultado). **Diseño y PRD ya coinciden: 3 etapas + status.** Añadir una etapa más sería alcance que el PRD no pide.

### `quotes`
| Campo | Tipo | Notas |
|---|---|---|
| `opportunityId` | id(`opportunities`) | |
| `amount` | number | |
| `status` | `"sent"` \| `"accepted"` \| `"rejected"` | Los 3 del PRD §8. La paleta del design system trae además `borrador` y `vencido`: son tokens sobrantes, no estados del MVP |
| `sentAt` | number | |

### `interactions`
| Campo | Tipo | Notas |
|---|---|---|
| `opportunityId` | id(`opportunities`) | |
| `customerId` | id(`customers`) | Duplicado a propósito: la Ficha de cliente muestra el historial completo del cliente, aunque la oportunidad sea otra |
| `type` | `"llamada"` \| `"whatsapp"` \| `"email"` \| `"visita"` | |
| `note` | string | Nota / resultado |
| `occurredAt` | number | Por defecto, ahora |
| `authorId` | id(`users`) | Se asigna solo |

### `nextSteps`
| Campo | Tipo | Notas |
|---|---|---|
| `opportunityId` | id(`opportunities`) | |
| `action` | string | Qué hay que hacer ("Llamar para confirmar el presupuesto") |
| `dueDate` | number | Cuándo |
| `status` | `"pending"` \| `"done"` \| `"postponed"` | |
| `assigneeId` | id(`users`) | |

### `opportunityRequests` (interna, no es una de las 7 entidades del PRD)
| Campo | Tipo | Notas |
|---|---|---|
| `clientRequestId` | string | Generada por el cliente, una por apertura del modal de Alta rápida |
| `userId` | id(`users`) | Quién la generó — acota la clave a su dueño, para que una clave ajena conocida no devuelva el ID de otro usuario |
| `opportunityId` | id(`opportunities`) | La oportunidad que produjo esa petición |

Idempotencia de `opportunities.createQuick`: un reintento de red con la misma `clientRequestId` (Convex confirmó la mutation pero la respuesta no llegó al cliente) debe devolver la oportunidad ya creada, no duplicar cliente + oportunidad + próximo paso. Se apoya en la misma garantía de aislamiento serializable de Convex que `claimBootstrapSlot` (`convex/users.ts`): dos llamadas concurrentes con la misma clave nunca pasan las dos el chequeo de "no existe todavía".

---

## 3. Datos que NO se guardan (se calculan)

Guardarlos sería garantizar que se desfasan. Se calculan en la query:

| Dato | Cómo se calcula | Dónde se ve |
|---|---|---|
| **Riesgo** de una oportunidad | `hoy - lastActivityAt > X días` (X configurable, empezamos con 7) | Hoy, Pipeline, Panel |
| **Paso vencido** | `nextStep.dueDate < hoy` y `status = "pending"` | Hoy, Supervisión |
| **Valor del pipeline** | suma de `estimatedAmount` de las oportunidades abiertas | Panel |
| **Forecast** | suma de `estimatedAmount` con `expectedCloseDate` dentro del periodo | Panel |
| **Carga de trabajo** por comercial | nº y valor de oportunidades abiertas | Supervisión |

---

## 4. Schema de Convex

Esto es **`convex/schema.ts`**, ya escrito. Si tocas uno, toca el otro en el mismo cambio.

```ts
import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables, // authSessions, authAccounts, authRefreshTokens, etc. — gestionadas por la librería

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

  opportunityRequests: defineTable({
    clientRequestId: v.string(),
    userId: v.id("users"),
    opportunityId: v.id("opportunities"),
  }).index("by_client_request_id", ["clientRequestId"]),
});
```

**Por qué esos índices:** "Hoy" pregunta *"pasos pendientes de Carlos"* → `by_assignee_status`. El Pipeline pregunta *"oportunidades abiertas por etapa"* → `by_status_stage`. La Ficha de cliente pregunta *"todo lo de este cliente"* → `by_customer`. Sin índice, Convex recorre la tabla entera.

---

## 5. Reglas de negocio (van en las mutations, no en la UI)

1. **Crear oportunidad** → crea automáticamente su primer `nextStep` (PRD: Alta rápida → "genera la oportunidad y su primer próximo paso automático").
2. **Registrar interacción** → actualiza `lastActivityAt` de la oportunidad **y** cierra/crea el `nextStep` correspondiente.
3. **Cambiar de etapa** → actualiza `lastActivityAt` y **genera el próximo paso** de la nueva etapa.
4. **Marcar como perdida** → `lostReason` es obligatorio.
5. **Cerrar (ganada o perdida)** → los `nextSteps` pendientes de esa oportunidad dejan de contar como pendientes.
6. **Invariante:** ninguna oportunidad con `status = "open"` puede quedarse sin un `nextStep` pendiente.

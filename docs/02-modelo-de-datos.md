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
| Presupuesto | `quotes` | La oferta económica de una oportunidad. En el MVP era importe suelto + estado, sin PDF; AIT-29 (Post-MVP) lo evolucionó a líneas de producto con cálculo en servidor — ver §2. |
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

Índice `by_store` (AIT-58, Post-MVP): permite a `customers.list` (pantalla "Clientes") resolver "todos los clientes de mi tienda" para owner/storeManager sin escanear la tabla entera — mismo criterio que `by_store_status` en `opportunities` (AIT-33).

### `opportunities`
| Campo | Tipo | Notas |
|---|---|---|
| `customerId` | id(`customers`) | |
| `stage` | `"contacto"` \| `"presupuesto"` \| `"negociacion"` | Las 3 etapas del MVP (facturar y recompra son Post-MVP) |
| `status` | `"open"` \| `"won"` \| `"lost"` | Abierta hasta que se cierra |
| `interest` | string? | Producto/servicio o interés |
| `priority` | `"alta"` \| `"media"` \| `"baja"`? | Post-MVP (AIT-35). Opcional a nivel de schema por compatibilidad con datos previos; nunca lo está en la práctica — `createQuick` fija `"media"` explícitamente en toda alta nueva, y se lee con fallback `?? "media"` donde no está fijado. Importancia manual, distinta del riesgo (automático) |
| `estimatedAmount` | number? | Alimenta el pipeline y el forecast |
| `expectedCloseDate` | number? | Timestamp. Alimenta el forecast |
| `lostReason` | string? | **Obligatorio si `status = "lost"`** |
| `closedAt` | number? | |
| `finalAmount` | number? | Importe real al cerrar |
| `billingStatus` | `"listo_para_facturar"` \| `"facturado"` \| `"cobrado"`? | Post-MVP (AIT-33). Solo aplica a oportunidades ganadas (`undefined` en abiertas/perdidas, y también en ganadas anteriores a esta tarea — fallback a `"listo_para_facturar"` en las queries/mutations que lo leen, sin migrar datos existentes) |
| `lastActivityAt` | number | **Clave para el riesgo.** Se actualiza en CADA interacción y cambio de etapa |
| `ownerId` | id(`users`) | Comercial |
| `storeId` | id(`stores`) | |
| `lastRiskPushSentAt` | number? | Post-MVP (AIT-57, Web Push). El `lastActivityAt` para el que ya se envió el push de "en riesgo" — no un timestamp de envío (hallazgo de auditoría NO-GO ronda 1: guardar `Date.now()` en vez del valor observado abría una carrera que podía suprimir avisos futuros para siempre) |

> **Por qué 3 etapas y no 6.** El design system trae una paleta de 6 colores de pipeline (`nuevo`, `contactado`, `propuesta`, `negociacion`, `ganado`, `perdido`) y es fácil confundirla con 6 etapas. No lo son:
> - **`ganado` y `perdido` no son etapas, son `status`.** Van aparte porque de ellos cuelgan `lostReason`, `closedAt` y `finalAmount`.
> - **`nuevo` no lo usa ninguna pantalla.** Es un token de paleta que sobra.
>
> El PRD §7 lo fija: *"Columnas por etapa: Contacto → Presupuesto → Negociación/Cierre (con resultado Ganada/Perdida)"*. Y `Design/pantallas/Pipeline.dc.html` implementa exactamente eso (`const OPEN = ['contactado','propuesta','negociacion']`, más Ganada y Perdida como resultado). **Diseño y PRD ya coinciden: 3 etapas + status.** Añadir una etapa más sería alcance que el PRD no pide.

### `quotes`
**Post-MVP (AIT-29):** ya no es un importe suelto — es una colección de líneas, con subtotal/impuestos/total calculados en el servidor.

| Campo | Tipo | Notas |
|---|---|---|
| `opportunityId` | id(`opportunities`) | Como mucho un presupuesto por oportunidad (upsert) — igual que en el MVP. Varias versiones por oportunidad queda para una ronda 2 de AIT-29 |
| `lines` | array de `{productId, productName, quantity, unitPrice}` | `productName`/`unitPrice` son una FOTO del catálogo al añadir la línea, no una referencia viva — si el precio de un producto cambia después en `products`, los presupuestos ya creados no se mueven solos |
| `taxRate` | number | Ej. `0.21` para 21% de IVA |
| `subtotal` | number | `Σ (quantity × unitPrice)` de las líneas — calculado en servidor, nunca confiado del cliente |
| `tax` | number | `subtotal × taxRate` |
| `total` | number | `subtotal + tax` |
| `status` | `"sent"` \| `"accepted"` \| `"rejected"` | Los 3 del PRD §8 (heredados del MVP). La paleta del design system trae además `borrador` y `vencido`: son tokens sobrantes, no estados usados |
| `sentAt` | number | |

### `products` (Post-MVP, AIT-29 — no es una de las 7 entidades del MVP)
| Campo | Tipo | Notas |
|---|---|---|
| `name` | string | |
| `price` | number | Precio de catálogo actual — la línea de un presupuesto ya creado guarda su propia foto, no lee este campo en vivo |
| `storeId` | id(`stores`) | |

Lo administra Marta (`requireOwner`); Carlos solo lo lee para construir presupuestos — mismo patrón de reparto de permisos que el resto del proyecto (ver `docs/01-arquitectura.md` §4), aplicado aquí por primera vez a una entidad que no es "mis clientes/oportunidades" sino un recurso compartido de toda la tienda.

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
| `lastPushSentAt` | number? | Post-MVP (AIT-57, Web Push). La `dueDate` para la que ya se envió el push de "vencido" — no un timestamp de envío (mismo motivo que `lastRiskPushSentAt` en `opportunities`); posponer cambia `dueDate` y vuelve a hacerlo elegible cuando venza de nuevo |

### `repurchaseReminders` (Post-MVP, AIT-30 — no es una de las 7 entidades del MVP)
| Campo | Tipo | Notas |
|---|---|---|
| `customerId` | id(`customers`) | |
| `opportunityId` | id(`opportunities`) | La venta ganada que originó el recordatorio |
| `ownerId` | id(`users`) | Copiado de la oportunidad al crearlo (no derivado por join en cada lectura) — mismo patrón que el resto de listados del proyecto, para poder filtrar por comercial/tienda |
| `storeId` | id(`stores`) | Igual: copiado, no derivado |
| `dueDate` | number | Cuándo toca reactivar al cliente |
| `status` | `"pending"` \| `"done"` \| `"dismissed"` | |

Lo administra Carlos desde "Clientes a reactivar" (`app/reactivar/`); Marta lo ve igual, sin restricción de rol adicional a la de tienda/comercial habitual. Índice `by_store_status` (con `storeId` primero) añadido en la ronda 3 de auditoría de AIT-30: `by_status` a secas traía recordatorios de todas las tiendas antes de filtrar en memoria — mismo problema, y mismo arreglo, que tuvo `listPendingBilling` en AIT-33.

### `opportunityRequests` (interna, no es una de las 7 entidades del PRD)
| Campo | Tipo | Notas |
|---|---|---|
| `clientRequestId` | string | Generada por el cliente, una por apertura del modal de Alta rápida |
| `userId` | id(`users`) | Quién la generó — acota la clave a su dueño, para que una clave ajena conocida no devuelva el ID de otro usuario |
| `opportunityId` | id(`opportunities`) | La oportunidad que produjo esa petición |

Idempotencia de `opportunities.createQuick`: un reintento de red con la misma `clientRequestId` (Convex confirmó la mutation pero la respuesta no llegó al cliente) debe devolver la oportunidad ya creada, no duplicar cliente + oportunidad + próximo paso. Se apoya en la misma garantía de aislamiento serializable de Convex que `claimBootstrapSlot` (`convex/users.ts`): dos llamadas concurrentes con la misma clave nunca pasan las dos el chequeo de "no existe todavía".

### `interactionRequests` (interna, no es una de las 7 entidades del PRD)
| Campo | Tipo | Notas |
|---|---|---|
| `clientRequestId` | string | Generada por el cliente, una por apertura del modal de Registrar interacción |
| `userId` | id(`users`) | Quién la generó |
| `interactionId` | id(`interactions`) | La interacción que produjo esa petición |

Idempotencia de `interactions.create` (AIT-19): mismo mecanismo que `opportunityRequests`. Un reintento de red con la misma `clientRequestId` no debe duplicar ni la entrada del historial ni el próximo paso que la interacción regenera.

### `pushSubscriptions` (Post-MVP, AIT-57 — no es una de las 7 entidades del PRD)
| Campo | Tipo | Notas |
|---|---|---|
| `userId` | id(`users`) | |
| `endpoint` | string | URL del servicio push del navegador — única por suscripción, la usa Web Push como identidad de la fila |
| `p256dh` | string | Clave de cifrado del payload, la exige el estándar Web Push |
| `auth` | string | Igual |
| `createdAt` | number | |

Una fila por dispositivo/navegador suscrito (un usuario puede tener varias). La escriben `convex/pushSubscriptions.ts:subscribe/unsubscribe`, llamadas desde dos sitios: `/ajustes` → "Notificaciones push" (activar/desactivar a mano) y `components/push/PushSubscriptionSync.tsx` (vigía sin UI, montada una sola vez en `app/layout.tsx` — reasigna la suscripción del dispositivo al usuario autenticado en cualquier cambio de sesión, y la desvincula en cuanto alguien cierra sesión, sin depender de qué pantalla esté abierta). Las lee `convex/webPush.ts` (disparado por `convex/crons.ts`, cada hora) para enviar avisos de pasos vencidos y oportunidades en riesgo con la app cerrada.

---

## 3. Datos que NO se guardan (se calculan)

Guardarlos sería garantizar que se desfasan. Se calculan en la query:

| Dato | Cómo se calcula | Dónde se ve |
|---|---|---|
| **Riesgo** de una oportunidad | `hoy - lastActivityAt > X días` (X configurable, empezamos con 7) | Hoy, Pipeline, Panel |
| **Paso vencido** | `nextStep.dueDate < hoy` y `status` en (`"pending"`, `"postponed"`) — un paso pospuesto sigue siendo accionable, no es un estado terminal como `"done"` | Hoy, Supervisión |
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
  })
    .index("by_owner", ["ownerId"])
    .index("by_store", ["storeId"]),

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

  opportunityRequests: defineTable({
    clientRequestId: v.string(),
    userId: v.id("users"),
    opportunityId: v.id("opportunities"),
  }).index("by_client_request_id", ["clientRequestId"]),

  interactionRequests: defineTable({
    clientRequestId: v.string(),
    userId: v.id("users"),
    interactionId: v.id("interactions"),
  }).index("by_client_request_id", ["clientRequestId"]),
});
```

**Por qué esos índices:** "Hoy" pregunta *"pasos pendientes de Carlos"* → `by_assignee_status`. El Pipeline pregunta *"oportunidades abiertas por etapa"* → `by_status_stage`. La Ficha de cliente pregunta *"todo lo de este cliente"* → `by_customer`. Sin índice, Convex recorre la tabla entera.

---

## 4b. Multi-tienda (AIT-31, Post-MVP — backend completo, loop 2)

**Estado:** 🟢 Backend completo, con las correcciones del NO-GO de la
ronda 1 de auditoría ya aplicadas y verificadas en vivo con una cuenta
`storeManager` real (creada para la prueba, ver evidencias del export).
Cuatro hallazgos de esa ronda, los cuatro corregidos:

1. **`requireOwner` sin `storeManager` en los checks de registro
   individual** (Pipeline y prácticamente todo `convex/*.ts`): existía
   un patrón repetido `user.role !== "owner" && doc.ownerId !== user._id`
   ("owner ve todo, cualquier otro rol solo lo suyo") en
   `opportunities.ts` (4 sitios), `customers.ts`, `interactions.ts` (2),
   `quotes.ts` y `repurchaseReminders.ts` (2) — 10 sitios en 5 archivos,
   más allá del único que señaló el auditor (`opportunities.ts:531`,
   `listOpen`). Con `storeManager` sin añadir ahí, quedaba tratado como
   `sales` (solo lo suyo), contradiciendo el contrato del rol. Fix:
   nuevo helper `isStoreWideRole(user)` en `convex/model/access.ts`
   (`owner` o `storeManager`), sustituye la condición en los 10 sitios.
   Además, un bug propio (no señalado por el auditor, encontrado al
   intentar crear la cuenta de prueba): `convex/auth.ts:createOrUpdateUser`
   todavía validaba `role !== "owner" && role !== "sales"` — sin
   corregirlo, `bootstrapInitialAccounts` no podía crear NINGUNA cuenta
   `storeManager`, pese a que su propio schema de argumentos ya lo
   admitía.
2. **`dashboard.ts` y `opportunities.ts:listOpen` leían con
   `by_status_stage`/sin índice de tienda** (todas las tiendas) y
   filtraban `storeId` después en memoria, en vez de `by_store_status`
   (storeId primero) — mismo patrón que ya se había corregido para
   `listPendingBilling` (AIT-33) y `repurchaseReminders.listToReactivate`
   (AIT-30), pero no se había aplicado aquí. Corregido en ambos.
3. **`listOpenOpportunitiesForSupervision`** resolvía
   `customer.name`/`owner.name` sin comprobar que fueran de la misma
   tienda — único sitio del archivo con ese hueco, cuando el resto
   (`getAtRiskList`, `getWorkloadByOwner`, `listPendingBilling`) ya lo
   hacía. Corregido con el mismo patrón.
4. **Caminos sin probar** (declarados como hueco en el loop 1, ahora
   cerrados): se creó una tienda y cuenta `storeManager` reales en el
   deployment compartido y se verificó en vivo — ver evidencias del
   export para el detalle completo (manager con `storeId` ajeno
   ignorado, manager con el propio, manager viendo oportunidades de
   OTRO comercial de su tienda, sales rechazado a nivel de query (no
   solo de ruta), `stores.create` funcionando como owner y rechazado
   como `storeManager`/`sales`).

### El problema

El MVP asume una sola tienda: `users.storeId` es 1:1 (cada usuario
pertenece a exactamente una) y `requireOwner` (`convex/model/access.ts`)
es literalmente "role === owner", sin más. Con varias tiendas reales, el
control de acceso pasa de ser casi decorativo a ser el aislamiento real
entre tiendas (inventario completo de las ~35 queries/mutations
afectadas, hecho antes de escribir esto: prácticamente todo
`convex/*.ts` compara `doc.storeId !== user.storeId`).

AIT-31 pide un nuevo rol intermedio, **`storeManager`**, con este reparto
de visibilidad:

| Rol | Ve |
|---|---|
| `sales` | Solo lo suyo (`ownerId === user._id`), dentro de su tienda |
| `storeManager` | Toda su tienda (equivalente a lo que hoy hace `owner` en el MVP, pero acotado a una tienda) |
| `owner` | Todas las tiendas del negocio |

Eso significa que **`owner` deja de encajar en el modelo "1 usuario = 1
storeId"** — hace falta decidir cómo se representa a alguien que ve más
de una tienda a la vez (necesario para "comparativa entre tiendas" en el
Panel).

### Dos opciones

**Opción A — owner sin tienda propia.** `users.storeId` pasa a opcional;
para un `owner` se ignora por completo (ve cualquier `storeId`). Riesgo:
cualquiera de las ~35 funciones que compara `doc.storeId === user.storeId`
tiene que revisarse para no comparar accidentalmente contra `undefined`
(fallo silencioso: o bloquea todo, o —peor— si alguna comparación usa
`!==` mal invertida, podría abrir de más).

**Opción B — owner con tienda "de referencia" + argumento explícito
(RECOMENDADA).** `users.storeId` sigue obligatorio para todos, incluido
`owner` (la tienda donde iniciaron sesión / la asignada al crear la
cuenta). Las queries que hoy usan implícitamente `user.storeId` pasan a
aceptar un argumento opcional `storeId`:
- Si `role === "owner"`: se respeta el argumento (o se agrega sobre
  todas las tiendas si se omite / se pide explícitamente "todas").
- Si `role === "storeManager"` o `"sales"`: el argumento se IGNORA
  siempre, se usa `user.storeId` — así ninguno de los dos puede colarse
  a otra tienda mandando el argumento que le dé la gana.

Se prefiere B: no cambia la obligatoriedad de un campo ya usado en 4
tablas (`users`, `customers`, `opportunities`, `products`), y el
aislamiento de `storeManager`/`sales` no depende de que cada función
recuerde comprobar `undefined` correctamente — depende solo de ignorar
un argumento, un patrón mucho más difícil de hacer mal por descuido.

### Qué falta decidir/hacer una vez se confirme la opción

1. 🟢 Hecho — `"storeManager"` añadido a `users.role` en
   `convex/schema.ts` (el bloqueo por AIT-30 tocando el mismo archivo ya
   se resolvió: AIT-30 mergeó a `main` antes de este cambio).
2. 🟢 Hecho — nuevo helper `requireStoreAccess(ctx, requestedStoreId?)`
   en `convex/model/access.ts`, devuelve `{ user, storeId }` ya resuelto
   según la tabla de arriba (falla cerrado a `user.storeId` salvo que
   quien pregunte sea `owner` y mande `requestedStoreId`).
3. 🟢 Hecho — las 10 queries de `convex/dashboard.ts` usan ahora
   `requireStoreAccess` en vez de `requireOwner`, y aceptan el argumento
   opcional `storeId` (compatible con las llamadas actuales del
   frontend, que pasan `{}`). Nota: `convex/stores.ts:getStoreInfo` y las
   3 mutations de `convex/products.ts` siguen en `requireOwner` sin
   tocar — no estaban en el alcance de este paso, quedan para cuando se
   aborden los puntos 4-5.
4. 🟢 Hecho (T1) — `convex/users.ts:bootstrapInitialAccounts`
   generalizada: sigue funcionando igual sin argumentos (compatibilidad
   con el flujo de siempre), y admite opcionalmente una lista de
   `{storeName, accounts}` para crear tiendas y cuentas adicionales
   (incluido `storeManager`), cada contraseña leída de una variable de
   entorno por nombre.
5. 🟢 Hecho (T3) — `convex/stores.ts`: `create` y `update` (mutations,
   solo `owner`), mismo patrón de validación que
   `convex/products.ts` (`create`/`update`/`remove`). No incluye borrar
   tienda: no se ha pedido y reasignar clientes/oportunidades/usuarios de
   una tienda eliminada es una decisión aparte, no forzada aquí.
6. 🟢 Hecho (T1) — precisión importante (aclarada tras una duda real de
   T1 al implementar, ver mensaje a la directora): esto NO era "migrar a
   `requireStoreAccess`" — ese helper es solo para las queries "de
   tienda entera" (Panel/Supervisión) y rechaza a `sales` a propósito;
   `listForToday`/`markDone`/`postpone` son personales (Carlos su "Hoy")
   y siguen con `requireUser` + `assigneeId === user._id`, sin tocar
   eso.
   - **`listForToday`**: armonizada — ahora dereferencia
     `opportunityId`/`customerId` comprobando `storeId`, mismo patrón
     que `getNotifications` (mismo archivo) ya tenía.
   - **`markDone`/`postpone`**: sin cambios, correctamente — no
     dereferencian opportunity/customer, solo comprueban
     `step.assigneeId !== user._id`, ya más estricto que un chequeo de
     storeId.

---

## 5. Reglas de negocio (van en las mutations, no en la UI)

1. **Crear oportunidad** → crea automáticamente su primer `nextStep` (PRD: Alta rápida → "genera la oportunidad y su primer próximo paso automático").
2. **Registrar interacción** → actualiza `lastActivityAt` de la oportunidad **y** cierra/crea el `nextStep` correspondiente.
3. **Cambiar de etapa** → actualiza `lastActivityAt` y **genera el próximo paso** de la nueva etapa.
4. **Marcar como perdida** → `lostReason` es obligatorio.
5. **Cerrar (ganada o perdida)** → los `nextSteps` pendientes de esa oportunidad dejan de contar como pendientes.
6. **Invariante:** ninguna oportunidad con `status = "open"` puede quedarse sin un `nextStep` pendiente.

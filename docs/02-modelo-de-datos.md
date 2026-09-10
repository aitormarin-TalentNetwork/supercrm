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
| Presupuesto | `quotes` | La oferta económica de una oportunidad. En el MVP era importe suelto + estado, sin PDF; AIT-29 (Post-MVP) lo evolucionó a líneas de producto con cálculo en servidor, AIT-53 añadió el PDF y AIT-54 varias versiones históricas por oportunidad — ver §2. |
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
| `logoStorageId` | id(`_storage`)? | AIT-61 (Post-MVP): logo real para la cabecera del PDF del presupuesto — ausente = sin logo, cae al membrete tipográfico (nombre de la tienda). Se sube desde `/ajustes` (owner-only): `stores.generateLogoUploadUrl` (mutation) da la URL de subida, `storesLogo.setLogo` (action — necesita `ctx.storage.get()` para decodificar el archivo de verdad con `pngjs`/`jpeg-js`, solo disponible en actions) valida el contenido y lo asigna, `stores.removeLogo` (mutation) lo quita. `stores.getStoreInfo`/`opportunities.getSummary` resuelven la URL pública (`ctx.storage.getUrl`) para el frontend. |

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

**Alta de usuarios — nunca registro público:** como el PRD no contempla registro público ("los accesos los crea la dueña de tu empresa"), no hay formulario de alta abierto. Dos caminos, según cómo entra cada cuenta (AIT-60, Google en paralelo a Password — ver ADR-003 en [`01-arquitectura.md`](01-arquitectura.md)):
- **Password:** `convex/auth.ts` usa `createAccount` (provider `Password`) — así se crearon las 2 cuentas de prueba originales (AIT-8), `marta@supercrm.es`/`carlos@supercrm.es`, que siguen entrando por contraseña exactamente igual que siempre.
- **Google:** la fila en `users` ES el alta — Google solo verifica identidad, nunca da de alta a nadie por su cuenta. Se crea desde Ajustes (`convex/users.ts:createUser`, solo owner) o con el bootstrap inicial (`convex/users.ts:bootstrapInitialAccounts`, `internalMutation` invocable solo desde el CLI/dashboard de Convex). Así entran `admin@talent-network.org` (owner) y `aitor.marin@talent-network.org` (sales), las 2 cuentas reales del negocio — conviven con Marta/Carlos, no las sustituyen.

### `customers`
| Campo | Tipo | Notas |
|---|---|---|
| `name` | string | |
| `phone` | string | **Se almacena CANÓNICO** (normalizado), no como se teclea — ver abajo |
| `email` | string? | Opcional (PRD: Alta rápida) |
| `source` | union | **Catálogo cerrado de canales** (AIT-81): `Llamada` · `WhatsApp` · `Recomendación` · `Web` · `Visita`. Ver abajo |
| `ownerId` | id(`users`) | Comercial asignado — **se asigna solo** según quién ha iniciado sesión |
| `storeId` | id(`stores`) | Igual: automático |

**Contrato de `source` (AIT-81).** El canal de origen es un **catálogo cerrado**, no un string libre. Antes el schema declaraba `v.string()` mientras el código asumía cinco canales, y el catálogo estaba copiado en cuatro sitios (el `union` de `opportunities.createQuick`, el de `customers.update`, el mapa de primeros pasos, y los desplegables de Alta rápida y de la ficha de cliente) sin nada que obligara a que coincidieran.

Ahora la lista vive **solo** en [`lib/customerSource.ts`](../lib/customerSource.ts) — es una lista de **producto**, no una constante técnica: dice qué vías contempla el CRM para que llegue un cliente. De ahí se derivan el validador de Convex (`convex/model/customerSource.ts`), el schema, los `args` de las tres mutations que escriben `source` (`opportunities.createQuick`, `customers.update` y `customers.createContact`), y los desplegables de la UI.

- **Para añadir un canal** (p. ej. `Email`): se añade a `CUSTOMER_SOURCES` y el compilador exige su primer paso en `FIRST_STEP_BY_SOURCE`. No hay un tercer sitio que tocar.
- **Para quitar uno**: ojo, no es simétrico. Convex valida los documentos **existentes** al desplegar el schema, así que si queda algún cliente guardado con ese canal, el push falla y con él el build. Primero migración, después el catálogo.

Índice `by_store` (AIT-58, Post-MVP): permite a `customers.list` (pantalla "Clientes") resolver "todos los clientes de mi tienda" para owner/storeManager sin escanear la tabla entera — mismo criterio que `by_store_status` en `opportunities` (AIT-33).

Índice `by_store_phone` (AIT-80): responde "¿hay ya un cliente de esta tienda con este teléfono?" en el alta rápida, sin lo cual habría que traerse la tienda entera y filtrar en memoria.

**Contrato de `phone` (AIT-80) — es un cambio de contrato del campo, no solo un índice más.** `phone` se guarda en forma canónica: solo dígitos, y sin el prefijo `+34`/`0034` cuando se ha escrito explícitamente como prefijo. Un código de país extranjero se conserva (`+49 30 1234` → `49301234`), porque un número extranjero sí es un número distinto; y un `34…` sin `+` se conserva entero, porque recortarlo por parecerse a un prefijo corrompería un número legítimo que empezara por 34.

- **Se escribe** siempre pasando por `normalizePhone()` (`lib/phone.ts`). Escritores actuales: `opportunities.createQuick`, la migración `migrations.backfillPhoneNormalized`, `customers.update` (AIT-77, editar cliente) y `customers.createContact` (AIT-88, alta de contacto sin venta). Un escritor que guarde el valor crudo deja al cliente fuera del índice: no se detectará su duplicado y el buscador no lo encontrará por teléfono.
- **Se busca** comparando contra `normalizePhone(consulta)`. La misma función en escritura, búsqueda y migración es lo que hace que las tres coincidan.
- **Se muestra** pasando por `formatPhone()` en el último paso antes de pintarlo. Un `href="tel:"` no se formatea: los dígitos pelados son válidos y mejores para marcar.
- **La clave no es única.** Convex no tiene `UNIQUE`, y esta tabla contiene por definición duplicados anteriores a AIT-80 (son su motivo), que el backfill normaliza al mismo valor. Quien consulte el índice usa `.collect()`: `.unique()` reventaría y `.first()` escogería arbitrariamente.

### `opportunities`
| Campo | Tipo | Notas |
|---|---|---|
| `customerId` | id(`customers`) | |
| `stage` | `"contacto"` \| `"presupuesto"` \| `"negociacion"` | Las 3 etapas del MVP (facturar y recompra son Post-MVP) |
| `status` | `"open"` \| `"won"` \| `"lost"` | Abierta hasta que se cierra — y desde AIT-86 el cierre se puede deshacer (regla 7) |
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
**Post-MVP:** ya no es un importe suelto — es una colección de líneas, con subtotal/impuestos/total calculados en el servidor (AIT-29), generación de PDF en cliente (AIT-53) y varias versiones históricas por oportunidad (AIT-54).

| Campo | Tipo | Notas |
|---|---|---|
| `opportunityId` | id(`opportunities`) | **Varias filas por oportunidad** (0..n) — una por versión. Ya no hay upsert: cada guardado inserta una fila nueva, ninguna versión se pierde ni se modifica después de creada |
| `version` | number, opcional | 1, 2, 3… por oportunidad. Ausente = versión 1 implícita (todo `quotes` creado antes de AIT-54, cuando como mucho podía existir una fila por oportunidad) |
| `lines` | array de `{productId, productName, quantity, unitPrice}` | `productName`/`unitPrice` son una FOTO del catálogo al añadir la línea, no una referencia viva — si el precio de un producto cambia después en `products`, los presupuestos ya creados no se mueven solos |
| `taxRate` | number | Ej. `0.21` para 21% de IVA |
| `subtotal` | number | `Σ (quantity × unitPrice)` de las líneas — calculado en servidor, nunca confiado del cliente |
| `tax` | number | `subtotal × taxRate` |
| `total` | number | `subtotal + tax` |
| `status` | `"sent"` \| `"accepted"` \| `"rejected"` | Los 3 del PRD §8 (heredados del MVP). Es una propiedad de CADA versión, no de la oportunidad — dos versiones pueden tener estados distintos. La paleta del design system trae además `borrador` y `vencido`: son tokens sobrantes, no estados usados |
| `sentAt` | number | Cuándo se creó ESA versión concreta — cada fila tiene la suya, no se toca después de insertarse |

**La versión vigente** es la de `version` más alto para esa oportunidad (desempate por `sentAt` más reciente, aunque en la práctica nunca hace falta desempatar: `version` nunca se repite dentro de la misma oportunidad) — la resuelve `convex/quotes.ts:listForOpportunity`, no hay ningún campo `isCurrent` explícito.

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

### `quoteRequests` (interna, no es una de las 7 entidades del PRD)
| Campo | Tipo | Notas |
|---|---|---|
| `clientRequestId` | string | Generada por el cliente, una por apertura del diálogo de Presupuesto |
| `userId` | id(`users`) | Quién la generó |
| `quoteId` | id(`quotes`) | La versión de presupuesto que produjo esa petición |

Idempotencia de `quotes.createVersion` (AIT-54): mismo mecanismo que `opportunityRequests`/`interactionRequests`. Sin esto, un reintento de red creaba una versión duplicada con datos idénticos, porque `createVersion` siempre inserta (nunca hace upsert).

### `customerRequests` (interna, no es una de las 7 entidades del PRD)
| Campo | Tipo | Notas |
|---|---|---|
| `clientRequestId` | string | Generada por el cliente, una por apertura del modal de Alta rápida **en modo contacto** |
| `userId` | id(`users`) | Quién la generó |
| `customerId` | id(`customers`) | El cliente que produjo esa petición |

Idempotencia de `customers.createContact` (AIT-88): mismo mecanismo que `opportunityRequests`/`interactionRequests`/`quoteRequests`.

**Por qué una tabla propia y no un campo más en `opportunityRequests`.** Un id que apuntara a dos tablas tendría que ser un `v.union(...)` o un string suelto, y se perdería la garantía del compilador de que ahí solo hay ids de una entidad — cambiar una comprobación de tipos por una convención. El proyecto ya se hizo esta pregunta con AIT-19 y AIT-54, y la respondió igual las dos veces.

**Consecuencia que hay que tener presente: son dominios de idempotencia independientes.** Guardar un contacto y dar de alta una venta escriben en tablas distintas, así que una misma `clientRequestId` no cruza de una a otra. Por eso el formulario **regenera la clave al cambiar de modo**: cambiar de intención es otro envío, no un reintento del mismo.

**Y el orden importa:** `createContact` resuelve la idempotencia **antes** de buscar duplicados por teléfono, igual que `createQuick` desde AIT-80. Al revés, un reintento de red encontraría por `by_store_phone` al cliente que ese mismo envío acaba de crear, y el alta acabaría avisando de sí misma.

### `pushSubscriptions` (Post-MVP, AIT-57 — no es una de las 7 entidades del PRD)
| Campo | Tipo | Notas |
|---|---|---|
| `userId` | id(`users`) | |
| `endpoint` | string | URL del servicio push del navegador — única por suscripción, la usa Web Push como identidad de la fila |
| `p256dh` | string | Clave de cifrado del payload, la exige el estándar Web Push |
| `auth` | string | Igual |
| `createdAt` | number | |

Una fila por dispositivo/navegador suscrito (un usuario puede tener varias). La escriben `convex/pushSubscriptions.ts:subscribe/unsubscribe`, llamadas desde tres sitios: `/ajustes` → "Notificaciones push" (activar/desactivar a mano); `components/push/PushSubscriptionSync.tsx` (vigía sin UI, montada una sola vez en `app/layout.tsx` — reasigna la suscripción del dispositivo al usuario autenticado en cualquier cambio de sesión, sin depender de qué pantalla esté abierta); y `components/push/useSignOutAndUnlinkPush.ts` (envuelve `signOut()` en los dos sitios donde se cierra sesión — Ajustes y `AppNav.tsx` — para desvincular la suscripción ANTES de cerrar sesión de verdad, mientras todavía hay una sesión válida con la que borrar la fila; `PushSubscriptionSync` no puede hacer esto reactivamente porque para cuando detecta "sin sesión" el token ya no vale). Las lee `convex/webPush.ts` (disparado por `convex/crons.ts`, cada hora) para enviar avisos de pasos vencidos y oportunidades en riesgo con la app cerrada.

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

Esto es **`convex/schema.ts`** VERBATIM, comentarios incluidos. Si tocas uno, toca el otro en el mismo cambio.

**Y se puede comprobar sin leerlo**, que es el motivo de que vaya literal y no resumido:

```sh
# el bloque de aquí abajo contra el fichero real: sin salida = sincronizados
diff <(sed -n '/^```ts$/,/^```$/p' docs/02-modelo-de-datos.md | sed '1d;$d') convex/schema.ts
```

> Este bloque **prometía ser el schema y no lo era** (auditoría de AIT-88, M1): a
> `users.role` le faltaba `storeManager` y el campo `active`; a `opportunities`,
> `priority`, `billingStatus`, `lastRiskPushSentAt` y el índice `by_store_status`; a
> `nextSteps`, `lastPushSentAt`; y faltaban enteras `repurchaseReminders` y
> `pushSubscriptions`. Un extracto incompleto que se presenta como el original **falla
> hacia el verde**: quien lo lee cree que ya sabe qué hay en la base y no abre
> `schema.ts`. Por eso ahora va literal — y con el `diff` de arriba, la próxima
> divergencia se detecta en un comando en vez de en una auditoría.

```ts
import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { customerSourceValidator } from "./model/customerSource";

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
    // AIT-61 (Post-MVP): logo real para el membrete del PDF de
    // presupuesto (convex/storesLogo.ts::setLogo lo valida y asigna) —
    // ausente = sin logo, el PDF cae al membrete tipográfico de siempre
    // (lib/quotePdf.ts).
    logoStorageId: v.optional(v.id("_storage")),
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
    // AIT-81: era `v.string()` libre mientras el código asumía cinco canales.
    // El catálogo vive en `lib/customerSource.ts` (es una lista de producto) y
    // este validador se deriva de él, así que el schema ya no puede decir una
    // cosa distinta de la que asume el código.
    source: customerSourceValidator,
    ownerId: v.id("users"),
    storeId: v.id("stores"),
  })
    .index("by_owner", ["ownerId"])
    // AIT-58: listado de clientes de la tienda (customers.list) — sin esto,
    // resolver "todos los clientes de mi tienda" para owner/storeManager
    // exigiría un scan completo de la tabla filtrado en memoria, igual que
    // el problema ya corregido en opportunities (ver by_store_status más
    // abajo, AIT-33 ronda 2).
    .index("by_store", ["storeId"])
    // AIT-80: "¿hay ya un cliente de esta tienda con este teléfono?" en el
    // alta rápida. Sin el índice habría que traerse la tienda entera y
    // filtrar en memoria, que es justo el scan que la issue prohíbe.
    //
    // CONTRATO: `phone` se guarda CANÓNICO (normalizado con
    // `lib/phone.ts::normalizePhone`), no como se teclea — ver
    // docs/02-modelo-de-datos.md §customers. El índice solo encuentra lo que
    // esté normalizado; un escritor que guarde el valor crudo deja al cliente
    // invisible para la detección de duplicados y para el buscador.
    //
    // La clave NO es única: Convex no tiene UNIQUE, y esta tabla contiene por
    // definición duplicados previos a AIT-80 (son su motivo). Quien consulte
    // este índice usa `.collect()`; `.unique()` reventaría en cuanto el
    // backfill normalice dos duplicados al mismo valor.
    .index("by_store_phone", ["storeId", "phone"]),

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
    // AIT-57 (Web Push): el `lastActivityAt` para el que ya se envió el
    // push de "en riesgo" — NO el reloj de cuándo se envió (hallazgo de
    // auditoría NO-GO ronda 1, "Mayor" #2: con `Date.now()` había una
    // carrera real — una interacción nueva ENTRE la lectura del cron y
    // este patch dejaba `lastRiskPushSentAt` por delante de la nueva
    // `lastActivityAt` para siempre, suprimiendo cualquier aviso futuro
    // aunque la oportunidad volviera a quedarse en riesgo más adelante).
    // Al guardar el valor de `lastActivityAt` observado (no el actual),
    // una interacción concurrente no puede "adelantarse" al marcado: el
    // valor guardado sigue siendo menor que la `lastActivityAt` nueva, así
    // que la próxima racha de riesgo vuelve a ser elegible. Opcional por
    // el mismo motivo que `lastPushSentAt` en `nextSteps`.
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
  // después, los presupuestos ya creados no deben moverse solos. AIT-54
  // (ronda 2) sustituyó el upsert de una sola fila por varias versiones
  // por oportunidad — ver el campo `version` justo debajo.
  quotes: defineTable({
    opportunityId: v.id("opportunities"),
    // Varias versiones por oportunidad (AIT-54): ausente = versión 1
    // implícita — todo `quotes` creado antes de AIT-54 (cuando como mucho
    // podía existir una fila por oportunidad) no tiene este campo, mismo
    // patrón que `opportunities.priority`/`billingStatus` para datos
    // anteriores a que el campo existiera. No hace falta migración: un
    // campo opcional nuevo no rompe la validación de los documentos ya
    // guardados.
    version: v.optional(v.number()),
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
    // AIT-57 (Web Push): la `dueDate` para la que ya se envió el push de
    // "vencido" — NO el reloj de cuándo se envió (hallazgo de auditoría
    // NO-GO ronda 1: usar `Date.now()` abría una carrera entre la lectura
    // del cron y este patch). Al guardar el valor de `dueDate` observado,
    // el marcado es inmune a qué le pase al documento entre medias:
    // mientras la dueDate no cambie, sigue marcado; si se pospone (dueDate
    // avanza), vuelve a ser elegible cuando venza de nuevo. Opcional: los
    // pasos ya existentes no lo tienen, se tratan como "nunca avisado"
    // (ver convex/pushInternal.ts:listOverdueSteps).
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

  // Idempotencia de quotes.createVersion (AIT-54), mismo mecanismo que
  // opportunityRequests/interactionRequests: una clave por apertura del
  // diálogo de presupuesto, reutilizada en un reintento del MISMO envío —
  // sin esto, un reintento de red (Convex ya confirmó pero la respuesta no
  // llegó) creaba una versión duplicada con datos idénticos, porque
  // createVersion siempre inserta (ronda de auditoría 1, mayor #2).
  quoteRequests: defineTable({
    clientRequestId: v.string(),
    userId: v.id("users"),
    quoteId: v.id("quotes"),
  }).index("by_client_request_id", ["clientRequestId"]),

  // Idempotencia de customers.createContact (AIT-88), mismo mecanismo que
  // opportunityRequests e interactionRequests: una clave por apertura del
  // formulario, reutilizada en un reintento del MISMO envío.
  //
  // TABLA PROPIA Y NO UN CAMPO POLIMÓRFICO EN opportunityRequests, a propósito:
  // el proyecto ya se hizo esta pregunta con AIT-19 y la respondió igual. Un id
  // que apuntara a dos tablas tendría que ser `v.union(...)` o un string suelto,
  // y se perdería la garantía del compilador de que ahí solo hay ids de una
  // entidad. Se cambia una comprobación de tipos por una convención, que es lo
  // contrario de lo que hizo AIT-82.
  //
  // OJO AL CAMBIAR DE INTENCIÓN EN LA UI: contacto y venta escriben en tablas
  // distintas, así que son DOMINIOS DE IDEMPOTENCIA INDEPENDIENTES. La misma
  // clave no cruza de una a otra — por eso el formulario regenera
  // `clientRequestId` al cambiar de modo (cambiar de intención es otro envío,
  // no un reintento del mismo).
  customerRequests: defineTable({
    clientRequestId: v.string(),
    userId: v.id("users"),
    customerId: v.id("customers"),
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

  // AIT-57 (Post-MVP): suscripciones de Web Push — una fila por
  // dispositivo/navegador suscrito (un usuario puede tener varias, una
  // por dispositivo/navegador donde active los avisos). `endpoint` es la
  // URL del servicio push del navegador para ESA suscripción concreta,
  // única por diseño de la Push API — de ahí el índice `by_endpoint`
  // (upsert al re-suscribirse, borrado al desactivar o al detectar una
  // suscripción muerta). `p256dh`/`auth` son las claves de cifrado del
  // payload que exige el estándar Web Push, tal cual las entrega
  // `PushSubscription.toJSON().keys` en el navegador.
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),
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
   (`getAtRiskList`, `listPendingBilling`) ya lo hacía. Corregido con el
   mismo patrón. *(Eran tres: `getWorkloadByOwner` se retiró en AIT-141 al
   quedarse sin consumidor. No se sustituye por un tercero porque las que
   quedan en el archivo con ese chequeo son sólo esas dos —
   `listOpenOpportunitiesForSupervision` es precisamente la que NO lo
   tenía—, y meter un relleno para cuadrar el número diría algo falso.)*
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
7. **Reabrir una oportunidad cerrada (AIT-86)** → `status` vuelve a `"open"` y se limpia lo que escribió el cierre: `closedAt`, `finalAmount`, `lostReason` y `billingStatus`. `estimatedAmount` **no** se toca (es de la oportunidad viva, no del cierre) y **`stage` tampoco**: reabrir es *deshacer*, no empezar de cero, así que vuelve a la etapa que tenía al cerrarse — que sigue guardada porque ni `markWon` ni `markLost` la modifican. Se crea un `nextStep` pendiente ("Retomar el seguimiento"), asignado al dueño de la oportunidad, para no violar la regla 6 por la puerta de atrás. Y se **borran los `repurchaseReminders` de esa oportunidad que sigan `pending`**: los creó `markWon` automáticamente, y si la venta deja de estar ganada pedirían recontactar por una compra que ya no existe — la pantalla Reactivar filtra por el estado del *recordatorio*, no por el de la oportunidad, así que sobrevivirían callados. Los que ya **no** estén `pending` no se tocan: ésos no son efecto del cierre, son trabajo que hizo una persona. **No se reabre** si `billingStatus` es `"facturado"` o `"cobrado"` (hay un documento fiscal de por medio); `"listo_para_facturar"` sí, y a propósito: es el estado donde el error es más probable, o sea el caso principal para el que existe deshacer.
8. **Eliminar (AIT-65)** → bloquea (no cascada) si el registro tiene hijos de historial: un cliente con oportunidades, o una oportunidad con interacciones. Los artefactos de trabajo de una oportunidad borrada (`quotes`, `nextSteps`, `repurchaseReminders`) se eliminan junto con ella — no son historial de contacto, así que no bloquean. Borrar una interacción recalcula `lastActivityAt`/`lastRiskPushSentAt` de su oportunidad si esa interacción era la que fijaba el valor actual, pero no toca el `nextStep` que generó. Solo `owner` puede borrar.

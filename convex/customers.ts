import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isStoreWideRole, requireOwner, requireUser } from "./model/access";
import { normalizePhone } from "../lib/phone";
import { findCustomersByPhone } from "./model/customerDuplicates";
import { customerSourceValidator } from "./model/customerSource";
// AIT-82: qué es un cliente válido, en un solo sitio. Antes esto era una copia
// literal de las reglas de `createQuick`, hecha a mano y a propósito.
import {
  normalizeCustomerEmail,
  validateCustomerEmail,
  validateCustomerName,
  validateCustomerPhone,
} from "../lib/customerValidation";

// Datos del cliente y sus oportunidades para la Ficha de cliente (AIT-11).
// El historial de interacciones es una query aparte (convex/interactions.ts),
// un archivo por entidad — ver docs/01-arquitectura.md. Mismo criterio de
// acceso que opportunities.getSummary: misma tienda, y si no ve toda la
// tienda (isStoreWideRole), solo lo suyo.
export const getFicha = query({
  // AIT-70: `v.string()` + `normalizeId`, no `v.id("customers")` — ver la
  // nota igual en opportunities.ts:getSummary.
  args: { customerId: v.string() },
  handler: async (ctx, { customerId: rawCustomerId }) => {
    const user = await requireUser(ctx);
    const customerId = ctx.db.normalizeId("customers", rawCustomerId);
    if (customerId === null) return null;
    const customer = await ctx.db.get(customerId);
    if (customer === null) return null;
    if (customer.storeId !== user.storeId) return null;
    if (!isStoreWideRole(user) && customer.ownerId !== user._id) return null;

    const [owner, store, opportunities] = await Promise.all([
      ctx.db.get(customer.ownerId),
      ctx.db.get(customer.storeId),
      ctx.db
        .query("opportunities")
        .withIndex("by_customer", (q) => q.eq("customerId", customerId))
        .collect(),
    ]);

    return {
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email ?? null,
        source: customer.source,
        ownerName: owner?.name ?? null,
        storeName: store?.name ?? null,
      },
      opportunities: opportunities
        .sort((a, b) => b.lastActivityAt - a.lastActivityAt)
        .map((o) => ({
          id: o._id,
          interest: o.interest ?? null,
          stage: o.stage,
          status: o.status,
          estimatedAmount: o.estimatedAmount ?? null,
        })),
    };
  },
});

// Listado de clientes para la pantalla "Clientes" (AIT-58, Post-MVP —
// gap encontrado en la auditoría de cierre del MVP: la ficha individual
// existía pero no había forma de listar todos los clientes). Mismo
// criterio de acceso que getFicha: la tienda entera si es un rol
// store-wide, solo los propios si no.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const customers = isStoreWideRole(user)
      ? await ctx.db
          .query("customers")
          .withIndex("by_store", (q) => q.eq("storeId", user.storeId))
          .collect()
      : await ctx.db
          .query("customers")
          .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
          .collect();

    const ownerIds = Array.from(new Set(customers.map((c) => c.ownerId)));
    const owners = await Promise.all(ownerIds.map((id) => ctx.db.get(id)));
    const ownerNameById = new Map(
      owners
        .filter((o): o is NonNullable<typeof o> => o !== null)
        .map((o) => [o._id, o.name ?? null]),
    );

    return customers
      .map((c) => ({
        id: c._id,
        name: c.name,
        phone: c.phone,
        email: c.email ?? null,
        source: c.source,
        ownerName: ownerNameById.get(c.ownerId) ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  },
});

// AIT-77: editar un cliente ya existente. Hasta aquí no había forma de corregir
// un teléfono mal escrito, ni de darle un email a un cliente creado sin él
// (`createQuick` era el único escritor de la tabla).
//
// Guarda de acceso: la de `getFicha`, NO la de `remove`. `requireOwner` es la
// guarda del borrado (AIT-65) y dejaría fuera a `sales`, que es justo quien da
// de alta a sus clientes y quien necesita corregirlos.
//
// `ownerId` y `storeId` no están entre los argumentos a propósito: reasignar un
// cliente a otro comercial, o moverlo de tienda, tiene que ser un acto
// explícito y no un efecto colateral de abrir el formulario de edición
// (criterio de fallo de la issue). Al no existir como entrada, los rechaza el
// validador de Convex — no depende de que el handler se acuerde de ignorarlos.
export const update = mutation({
  args: {
    customerId: v.id("customers"),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    // El union sigue yendo en los args y no en el handler, que es la propiedad
    // que puso aquí AIT-77 y hay que conservar: así lo rechaza el validador de
    // Convex en servidor ANTES de entrar al handler. AIT-81 solo cambia de
    // dónde sale el union — ya no es una copia escrita a mano, sino el mismo
    // validador que usan el schema y `createQuick`, derivado del catálogo de
    // `lib/customerSource.ts`. La razón por la que T1 lo duplicó ("mientras
    // AIT-81 centraliza el catálogo") ya no aplica.
    source: customerSourceValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const customer = await ctx.db.get(args.customerId);
    // Mismo mensaje para "no existe" y "no es tuyo", igual que `remove`: no
    // confirma la existencia de clientes ajenos a quien no puede verlos.
    if (customer === null || customer.storeId !== user.storeId) {
      throw new Error("Cliente no encontrado.");
    }
    if (!isStoreWideRole(user) && customer.ownerId !== user._id) {
      throw new Error("Cliente no encontrado.");
    }

    // AIT-82: mismas funciones que las otras tres puertas. La nota que había
    // aquí explicando por qué la longitud se medía sobre el crudo ya no aplica:
    // era la descripción de la deuda, y esta tarea la paga — ahora se mide sobre
    // el valor canónico, que es el que se guarda.
    const nameError = validateCustomerName(args.name);
    if (nameError) throw new Error(nameError);
    const name = args.name.trim();

    const phone = args.phone.trim();
    const phoneError = validateCustomerPhone(phone);
    if (phoneError) throw new Error(phoneError);

    const emailError = validateCustomerEmail(args.email);
    if (emailError) throw new Error(emailError);
    // Vacío se convierte en `undefined` a propósito: un email equivocado
    // empareja correspondencia ajena con esta ficha, así que tiene que poder
    // quitarse, y `patch` con `undefined` BORRA el campo en vez de guardar ""
    // (AIT-77). La conversión vive en el módulo compartido porque ES una regla.
    const email = normalizeCustomerEmail(args.email);

    // Contrato de `phone` (AIT-80, docs/02-modelo-de-datos.md): se almacena
    // SIEMPRE canónico, nunca como se teclea. Esta mutation es el tercer
    // escritor. Un escritor que guarde el crudo deja al cliente fuera del
    // índice `by_store_phone`: su duplicado no se detecta y el buscador no lo
    // encuentra por teléfono — en silencio, y justo en el cliente que alguien
    // acaba de corregir, que es el que más probabilidad tiene de tenerlo bien.
    // Va en ESTE patch y no en una segunda escritura, que dejaría una ventana
    // con el documento incoherente.
    await ctx.db.patch(args.customerId, {
      name,
      phone: normalizePhone(phone),
      email,
      source: args.source,
    });
  },
});

// AIT-88: dar de alta a una PERSONA sin inventarle una venta.
//
// Hasta aquí, el único `insert("customers")` de todo el backend vivía en
// `opportunities.createQuick`, que SIEMPRE crea además la oportunidad, su
// próximo paso y su registro de idempotencia. O sea que para guardar el teléfono
// de alguien que pasó por la tienda había que inventarse una venta — y eso
// contamina justo lo que este CRM mide: el pipeline, el valor en juego y la
// lista de "en riesgo", que se llenaba de gente que nunca fue una venta.
//
// Guarda: la de `getFicha` y `update`, NO `requireOwner`. Carlos también capta
// contactos. `ownerId` y `storeId` no son argumentos: se asignan del usuario,
// así que no hay puerta para crear un cliente a nombre de otro.
export const createContact = mutation({
  args: {
    // Una clave por apertura del formulario, no por clic. Ver el INVARIANTE DE
    // ORDEN de abajo, que es la razón por la que existe.
    clientRequestId: v.string(),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    source: customerSourceValidator,
    // "Sí, ya sé que hay otro con este teléfono, créalo igualmente". Dos
    // personas pueden compartir teléfono (una pareja, una centralita), así que
    // el duplicado se avisa, no se bloquea — mismo criterio que `createQuick`.
    confirmDuplicate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // .collect() en vez de .unique(): si alguna vez colisionara la clave entre
    // dos usuarios, cada uno solo reconoce la suya.
    const existingRequests = await ctx.db
      .query("customerRequests")
      .withIndex("by_client_request_id", (q) =>
        q.eq("clientRequestId", args.clientRequestId),
      )
      .collect();
    const ownRequest = existingRequests.find((r) => r.userId === user._id);
    // INVARIANTE DE ORDEN (AIT-80, replicado aquí en AIT-88 — no reordenar): la
    // idempotencia se resuelve ANTES que la detección de duplicado semántico.
    // Al revés, un reintento de red encontraría por `by_store_phone` al cliente
    // que ESE MISMO envío acaba de crear y avisaría de que ya existe: el alta
    // avisando de sí misma, por haber pulsado una vez con mala cobertura. Y si
    // quien lo ve confirma —porque cree que es otra persona— crea el duplicado
    // de verdad.
    //
    // Este comentario no está aquí de adorno: el plan de AIT-88 llegó a afirmar
    // que la detección de duplicados "ya cubre el reintento". No lo cubre, lo
    // MALINTERPRETA. Se descubrió leyendo el original en `createQuick`.
    if (ownRequest) {
      return { status: "created" as const, customerId: ownRequest.customerId };
    }

    // Las mismas reglas que las otras tres puertas (AIT-82).
    const nameError = validateCustomerName(args.name);
    if (nameError) throw new Error(nameError);
    const name = args.name.trim();

    const phone = args.phone.trim();
    const phoneError = validateCustomerPhone(phone);
    if (phoneError) throw new Error(phoneError);

    const emailError = validateCustomerEmail(args.email);
    if (emailError) throw new Error(emailError);
    const email = normalizeCustomerEmail(args.email);

    const duplicates = await findCustomersByPhone(ctx, user, phone);
    if (duplicates.hasAny && args.confirmDuplicate !== true) {
      return {
        status: "duplicate" as const,
        matches: duplicates.matches,
        otherOwnerMatch: duplicates.otherOwnerMatch,
      };
    }

    // DOS filas y solo dos: el cliente y su registro de idempotencia. Ni
    // oportunidad, ni `nextSteps`, ni `opportunityRequests` — es el criterio de
    // fallo de la issue y lo que separa esta puerta de `createQuick`.
    const customerId = await ctx.db.insert("customers", {
      name,
      // Canónico, no como se tecleó: contrato de `lib/phone.ts` (AIT-80). Esta
      // es la tercera puerta de escritura de `phone`; si guardara el crudo, el
      // contacto nacería fuera del índice `by_store_phone` y su duplicado no se
      // detectaría nunca.
      phone: normalizePhone(phone),
      email,
      source: args.source,
      ownerId: user._id,
      storeId: user.storeId,
    });

    await ctx.db.insert("customerRequests", {
      clientRequestId: args.clientRequestId,
      userId: user._id,
      customerId,
    });

    return { status: "created" as const, customerId };
  },
});

// AIT-65: eliminar un cliente — solo `owner`. Bloquea (no cascada) si
// tiene oportunidades. Sin comprobación adicional de interacciones/
// recordatorios: ambos exigen una oportunidad existente para crearse, así
// que un cliente sin oportunidades no puede tenerlos (ver plan-loop1,
// "investigación previa").
export const remove = mutation({
  args: { customerId: v.id("customers") },
  handler: async (ctx, { customerId }) => {
    const user = await requireOwner(ctx);
    const customer = await ctx.db.get(customerId);
    if (customer === null || customer.storeId !== user.storeId) {
      throw new Error("Cliente no encontrado.");
    }

    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId))
      .collect();
    if (opportunities.length > 0) {
      throw new Error(
        `No se puede eliminar: tiene ${opportunities.length} oportunidad(es) asociada(s). Bórralas o reasígnalas primero.`,
      );
    }

    await ctx.db.delete(customerId);
  },
});

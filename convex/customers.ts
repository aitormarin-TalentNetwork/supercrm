import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isStoreWideRole, requireOwner, requireUser } from "./model/access";

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

// AIT-77: mismas reglas de validación que `opportunities.ts::createQuick`, la
// otra puerta de escritura a esta tabla. Duplicadas a mano porque allí no están
// exportadas y exportarlas chocaba con AIT-80, en vuelo sobre ese fichero.
// AIT-82 las centraliza y elimina esta copia; hasta entonces, si se cambia una
// regla hay que cambiarla en los dos sitios o un valor que el alta rechaza se
// cuela editando.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s+()-]+$/;

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
    // El union va en los args y no en el handler para que lo rechace el
    // validador de Convex en servidor, que es el mismo mecanismo por el que hoy
    // no hay ningún `source` inválido en la base: `schema.ts` lo declara
    // `v.string()` libre, y es `createQuick` quien lo acota. Esta mutation es el
    // SEGUNDO escritor de `source`; sin esta validación, un canal fuera del
    // catálogo no rompería aquí sino al indexar `FIRST_STEP_BY_SOURCE`
    // (`Record<string, string>`, así que TypeScript no avisa), lejos de la
    // causa. Duplicado mientras AIT-81 centraliza el catálogo.
    source: v.union(
      v.literal("Llamada"),
      v.literal("WhatsApp"),
      v.literal("Recomendación"),
      v.literal("Web"),
      v.literal("Visita"),
    ),
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

    const name = args.name.trim();
    if (name.length === 0) throw new Error("El nombre es obligatorio.");

    const phone = args.phone.trim();
    if (!PHONE_RE.test(phone)) {
      throw new Error("El teléfono solo puede tener números y separadores.");
    }
    // Una sola normalización para todo el handler: cuenta los dígitos aquí y
    // será la que se persista cuando AIT-80 aterrice (ver el patch más abajo).
    // Dos expresiones distintas de "quitar lo que no sea dígito" en la misma
    // función es exactamente la divergencia que AIT-82 viene a cerrar.
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 9) {
      throw new Error("Introduce un teléfono válido (9 dígitos).");
    }
    if (phoneDigits.length > 15) {
      throw new Error("El teléfono es demasiado largo.");
    }

    // `|| undefined` (no `?? undefined`): un email en blanco se vacía a
    // propósito — un email equivocado empareja correspondencia ajena con esta
    // ficha, así que tiene que poder quitarse. `email` es opcional en el
    // schema y `patch` con `undefined` BORRA el campo, no guarda "".
    const email = args.email?.trim().toLowerCase() || undefined;
    if (email !== undefined && !EMAIL_RE.test(email)) {
      throw new Error("El email no tiene un formato válido.");
    }

    // PENDIENTE DEL MERGE DE AIT-80 — esta mutation es el segundo escritor de
    // `phone` y ahora mismo lo guarda SIN normalizar, que es incorrecto.
    //
    // La decisión ya está tomada (PM, 2026-09-08): NO hay campo derivado —
    // `phone` se guarda ya normalizado y se formatea al pintarlo. Así que aquí
    // hay que escribir `phone: normalizePhone(phone)` en ESTE MISMO patch, y
    // `phoneDigits` de arriba es exactamente ese valor. Nunca en una segunda
    // escritura: dejaría una ventana con el documento incoherente.
    //
    // No se hace todavía porque `lib/phone.ts` lo crea AIT-80 y aún no está en
    // esta rama; importarlo hoy no compila. Mientras tanto, un cliente al que se
    // le corrija el teléfono deja de detectarse como duplicado, en silencio — y
    // justo el corregido es el que más probabilidad tiene de tenerlo bien.
    await ctx.db.patch(args.customerId, {
      name,
      phone,
      email,
      source: args.source,
    });
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

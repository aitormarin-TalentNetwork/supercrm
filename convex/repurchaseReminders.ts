import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./model/access";
import { addBusinessMonths, startOfBusinessDay } from "../lib/businessTime";

// Mismo criterio de acceso que loadOpenOpportunityOrThrow
// (convex/opportunities.ts): misma tienda siempre, y si es sales, solo lo
// suyo (ownerId copiado de la oportunidad al crear el recordatorio, ver
// opportunities.markWon). "No encontrado" cubre los tres motivos de
// rechazo sin distinguir cuál, igual que el resto del proyecto.
async function loadOwnReminderOrThrow(
  ctx: QueryCtx | MutationCtx,
  user: Doc<"users">,
  reminderId: Id<"repurchaseReminders">,
): Promise<Doc<"repurchaseReminders">> {
  const reminder = await ctx.db.get(reminderId);
  if (reminder === null) throw new Error("Recordatorio no encontrado.");
  if (reminder.storeId !== user.storeId) {
    throw new Error("Recordatorio no encontrado.");
  }
  if (user.role !== "owner" && reminder.ownerId !== user._id) {
    throw new Error("Recordatorio no encontrado.");
  }
  return reminder;
}

// AIT-30: "clientes a reactivar" — todos los recordatorios de recompra
// pendientes (vencidos o próximos, no solo los ya vencidos: la pantalla
// es una agenda de fidelización, no solo una lista de "vencidos"). Owner
// ve los de toda la tienda, sales solo los suyos. Usa el índice
// `by_store_status` (storeId primero) — corregido tras hallazgo de
// auditoría (NO-GO ronda 3, mismo patrón que listPendingBilling en
// AIT-33): antes usaba `by_status` sin storeId y traía los recordatorios
// pendientes de TODAS las tiendas antes de filtrar los propios en
// memoria. El filtro por ownerId (solo para sales) sí sigue en memoria
// tras el índice — no hay un índice de 3 columnas para eso, mismo patrón
// que el resto del proyecto (p.ej. dashboard.ts:getWorkloadByOwner).
export const listToReactivate = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const ownPending = await ctx.db
      .query("repurchaseReminders")
      .withIndex("by_store_status", (q) =>
        q.eq("storeId", user.storeId).eq("status", "pending"),
      )
      .collect();

    const visible = ownPending.filter((reminder) => {
      if (user.role !== "owner" && reminder.ownerId !== user._id) {
        return false;
      }
      return true;
    });

    const startOfToday = startOfBusinessDay(Date.now());

    const enriched = await Promise.all(
      visible.map(async (reminder) => {
        // Mismo chequeo cruzado que el resto de listados (customer podría
        // apuntar a otra tienda si el schema no lo garantizara): se
        // descarta en vez de asumir que storeId ya lo cubre.
        const customer = await ctx.db.get(reminder.customerId);
        if (customer === null || customer.storeId !== user.storeId) {
          return null;
        }
        return {
          id: reminder._id,
          customerId: customer._id,
          customerName: customer.name,
          customerPhone: customer.phone,
          dueDate: reminder.dueDate,
          isOverdue: reminder.dueDate < startOfToday,
        };
      }),
    );

    return enriched
      .filter((item) => item !== null)
      .sort((a, b) => a.dueDate - b.dueDate);
  },
});

// Contactado con éxito: cierra el recordatorio. No reabre nada ni crea
// una nueva interacción — si el comercial quiere dejar constancia de la
// llamada, lo hace desde la ficha del cliente (RegistrarInteraccionModal
// exige una oportunidad ABIERTA, y la de origen de este recordatorio ya
// está ganada/cerrada — fuera de alcance de esta tarea crear una
// oportunidad nueva solo para poder registrar esa interacción).
export const markContacted = mutation({
  args: { reminderId: v.id("repurchaseReminders") },
  handler: async (ctx, { reminderId }) => {
    const user = await requireUser(ctx);
    const reminder = await loadOwnReminderOrThrow(ctx, user, reminderId);
    if (reminder.status !== "pending") return;
    await ctx.db.patch(reminderId, { status: "done" });
  },
});

// Posponer 1 mes desde AHORA, no desde el dueDate vencido — igual que
// nextSteps.postpone reprograma desde el instante en que se pospone, no
// desde la fecha vencida original. Intervalo corto (1 mes, no los 6 del
// recordatorio inicial en opportunities.markWon) porque posponer aquí es
// "todavía no le he llamado, dame un respiro corto", no un nuevo ciclo de
// recompra completo.
export const postpone = mutation({
  args: { reminderId: v.id("repurchaseReminders") },
  handler: async (ctx, { reminderId }) => {
    const user = await requireUser(ctx);
    const reminder = await loadOwnReminderOrThrow(ctx, user, reminderId);
    if (reminder.status !== "pending") {
      throw new Error("Este recordatorio ya no está pendiente.");
    }
    await ctx.db.patch(reminderId, {
      dueDate: addBusinessMonths(Date.now(), 1),
    });
  },
});

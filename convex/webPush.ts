"use node";

import webpush, { WebPushError } from "web-push";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";

// AIT-57: cliente de Web Push, configurado con las claves VAPID del
// deployment (nunca en `.env.local`: la privada no debe llegar al
// navegador — ver docs/03-setup.md). Se valida una sola vez al arrancar
// sendPendingPushes, no en cada envío individual, para fallar rápido y
// con un mensaje claro si el deployment no tiene las 3 variables puestas.
function getWebPushClient() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "Faltan VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT en el deployment de Convex — necesarios para enviar Web Push (ver docs/03-setup.md).",
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return webpush;
}

type PushPayload = { title: string; body: string; url: string };

// Envía `payload` a todos los dispositivos suscritos de `userId`.
// Devuelve si el aviso se puede dar por "entregado" (se marcará
// lastPushSentAt/lastRiskPushSentAt en el llamador): solo si CADA
// suscripción se resolvió con éxito o quedó confirmada muerta (borrada)
// — NUNCA si basta con que UNA tenga éxito (hallazgo de auditoría NO-GO
// ronda 1, "Mayor" #3: con un solo booleano de éxito global, un
// dispositivo que sí recibe el aviso enmascaraba el fallo del resto, que
// no se volvían a intentar jamás). Con este criterio, si queda alguna
// suscripción con fallo transitorio (red, 5xx del servicio push), NO se
// marca — el siguiente cron reintenta la ronda COMPLETA, incluidas las
// suscripciones que ya recibieron el aviso la vez anterior. Es
// deliberadamente "al menos una vez" (puede duplicar un aviso en un
// dispositivo que ya lo vio), no "como mucho una vez": una cola de
// reintentos por-suscripción sería más precisa pero es una tabla y un
// mecanismo aparte, alcance mayor que esta tarea — duplicar
// ocasionalmente un aviso ya visto es un coste menor que dejar un
// dispositivo sin avisar para siempre por un fallo puntual.
async function sendToUser(
  ctx: ActionCtx,
  userId: Id<"users">,
  payload: PushPayload,
): Promise<boolean> {
  const subscriptions = await ctx.runQuery(
    internal.pushInternal.listSubscriptionsForUser,
    { userId },
  );
  if (subscriptions.length === 0) return true;

  const client = getWebPushClient();
  const results = await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await client.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
        return "sent" as const;
      } catch (err) {
        // 404/410: el navegador/SO ya no reconoce esta suscripción — se
        // borra. Cualquier otro error es transitorio, no se toca la fila.
        if (
          err instanceof WebPushError &&
          (err.statusCode === 404 || err.statusCode === 410)
        ) {
          await ctx.runMutation(internal.pushInternal.deleteSubscription, {
            subscriptionId: sub._id,
          });
          return "gone" as const;
        }
        return "failed" as const;
      }
    }),
  );

  return results.every((r) => r === "sent" || r === "gone");
}

// AIT-57: disparado por convex/crons.ts cada hora. Dos categorías, mismo
// criterio que la campana in-app (convex/nextSteps.ts:getNotifications):
// pasos vencidos (a quien los tiene asignados) y oportunidades propias en
// riesgo (a su comercial).
export const sendPendingPushes = internalAction({
  args: {},
  handler: async (ctx) => {
    getWebPushClient(); // valida configuración antes de gastar ninguna query

    const overdueSteps = await ctx.runQuery(
      internal.pushInternal.listOverdueSteps,
      {},
    );
    for (const step of overdueSteps) {
      const delivered = await sendToUser(ctx, step.assigneeId, {
        title: "Seguimiento vencido",
        body: `${step.customerName}: ${step.action}`,
        url: `/oportunidades/${step.opportunityId}`,
      });
      if (delivered) {
        await ctx.runMutation(internal.pushInternal.markStepPushed, {
          nextStepId: step.nextStepId,
          dueDate: step.dueDate,
        });
      }
    }

    const atRiskOpportunities = await ctx.runQuery(
      internal.pushInternal.listAtRiskOpportunities,
      {},
    );
    for (const opportunity of atRiskOpportunities) {
      const delivered = await sendToUser(ctx, opportunity.ownerId, {
        title: "Oportunidad en riesgo",
        body: `${opportunity.customerName} lleva más de 7 días sin actividad.`,
        url: `/oportunidades/${opportunity.opportunityId}`,
      });
      if (delivered) {
        await ctx.runMutation(internal.pushInternal.markOpportunityPushed, {
          opportunityId: opportunity.opportunityId,
          lastActivityAt: opportunity.lastActivityAt,
        });
      }
    }
  },
});

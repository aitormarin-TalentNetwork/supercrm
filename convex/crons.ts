import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// AIT-57: revisa pasos vencidos y oportunidades en riesgo cada hora y
// envía un push (Web Push) a quien corresponda — ver convex/webPush.ts.
// De hora en hora, no en tiempo real: cubre el criterio de aceptación
// ("un aviso aunque la app esté cerrada") sin disparar una función en
// cada escritura de nextSteps/opportunities de todo el negocio.
crons.interval(
  "avisos push pendientes",
  { hours: 1 },
  internal.webPush.sendPendingPushes,
);

export default crons;

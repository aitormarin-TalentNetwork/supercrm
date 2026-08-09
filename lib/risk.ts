// docs/02-modelo-de-datos.md §3: el riesgo no se guarda, se calcula al
// leer. 7 días es el valor de partida que fija el documento. Antes estaba
// duplicado en convex/opportunities.ts (Pipeline, AIT-12) y
// convex/nextSteps.ts (Hoy, AIT-16) — centralizado aquí en AIT-17.
export const RISK_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export function isAtRisk(lastActivityAt: number, now: number): boolean {
  return now - lastActivityAt > RISK_THRESHOLD_MS;
}

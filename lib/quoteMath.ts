// Única fórmula de subtotal/impuestos/total para presupuestos (AIT-29),
// compartida literalmente entre convex/quotes.ts (autoridad — lo que se
// persiste) y el editor de app/oportunidades/[id]/page.tsx
// (previsualización en vivo). Antes cada lado tenía su propia cuenta: el
// cliente sumaba en punto flotante sin redondear nada, el servidor
// redondeaba el subtotal a céntimos y calculaba el impuesto sobre ESE
// subtotal ya redondeado — con cantidades decimales (p.ej. 0,5 unidades)
// podían divergir en el último céntimo (ronda de auditoría 1, mayor #2).
//
// Todo el cálculo pasa a hacerse en céntimos enteros: se redondea el
// subtotal una sola vez a céntimos, el impuesto se calcula sobre esos
// céntimos ya enteros, y el total es una suma de enteros — no queda
// ninguna operación en punto flotante después del primer redondeo que
// pueda introducir un desajuste.
export type QuoteLineInput = { quantity: number; unitPrice: number };

// Precisión de `taxRate` como contrato explícito entre cliente y servidor
// (ronda de auditoría 4, mayor único): el servidor solo validaba
// `0 <= taxRate <= 1`, sin límite de decimales, así que un IVA como
// 0.21555555 era un valor válido. La UI formateaba ese valor para
// mostrarlo/precargarlo con una precisión fija (para no arrastrar ruido
// de coma flotante como 21.499999999999996) — pero al no existir esa
// misma precisión como límite en servidor, ese formateo era con pérdida:
// un IVA guardado con más decimales de los que la UI podía mostrar se
// corrompía silenciosamente en el primer resave sin tocar el campo.
//
// La precisión que se fija aquí (4 decimales de la fracción 0-1, es
// decir 2 decimales de porcentaje — p.ej. 21,55%) es más que suficiente
// para cualquier tipo de IVA real; al aplicarse TAMBIÉN en servidor
// (convex/quotes.ts redondea con esta misma función antes de persistir),
// ningún `taxRate` guardado puede tener ya más precisión de la que la UI
// necesita mostrar — el formateo deja de tener pérdida posible.
export const TAX_RATE_DECIMALS = 4;

export function roundTaxRate(taxRate: number): number {
  const factor = 10 ** TAX_RATE_DECIMALS;
  return Math.round(taxRate * factor) / factor;
}

export function computeQuoteTotals(lines: QuoteLineInput[], taxRate: number) {
  const rawSubtotal = lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0,
  );
  const subtotalCents = Math.round(rawSubtotal * 100);
  const taxCents = Math.round(subtotalCents * taxRate);
  const totalCents = subtotalCents + taxCents;
  return {
    subtotal: subtotalCents / 100,
    tax: taxCents / 100,
    total: totalCents / 100,
  };
}

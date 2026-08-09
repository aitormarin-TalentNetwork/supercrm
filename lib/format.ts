const CURRENCY_FORMATTER = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  return CURRENCY_FORMATTER.format(amount);
}

export function formatDateTime(timestampMs: number): string {
  const date = new Date(timestampMs);
  const day = date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} · ${time}`;
}

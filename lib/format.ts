// Formatos válidos: es-ES agrupado ("1.234.567,89"), decimal simple con
// coma ("1250,50") o con punto ("1250.50" / "1250"). Cualquier otra cosa
// se rechaza de forma explícita en vez de intentar adivinarla — un
// replace(/\D/g,"") o una heurística de "qué separador va último" pueden
// interpretar mal casos reales como "1250.50" o dejar pasar basura como
// "1,2,3" convertida en un número sin sentido (ronda de auditoría 2, mayor
// #1 de AIT-10). Con patrones cerrados, lo que no encaja da error, no un
// número raro.
const AMOUNT_PATTERNS = [
  /^\d{1,3}(\.\d{3})*(,\d{1,2})?$/, // es-ES agrupado: 1.234.567,89
  /^\d+(,\d{1,2})?$/, // decimal con coma, sin agrupar: 1250,50
  /^\d+(\.\d{1,2})?$/, // decimal con punto, sin agrupar, o entero: 1250.50 / 1250
];

// undefined = campo vacío (sin importe); null = texto no interpretable.
export function parseEuroAmount(raw: string): number | null | undefined {
  const trimmed = raw.trim().replace(/\s/g, "");
  if (!trimmed) return undefined;
  if (!AMOUNT_PATTERNS.some((re) => re.test(trimmed))) return null;

  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  return CURRENCY_FORMATTER.format(amount);
}

export function formatDate(timestampMs: number): string {
  return new Date(timestampMs).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// AIT-69: `text-transform:capitalize` pone en mayúscula CADA palabra
// ("4 De Septiembre"); esto capitaliza solo la primera letra de la cadena
// ("4 de septiembre" -> "4 de septiembre" ya en minúsculas -> se usa sobre
// frases como las que devuelve toLocaleDateString con weekday/month "long",
// que en es-ES vienen enteras en minúsculas).
export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
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

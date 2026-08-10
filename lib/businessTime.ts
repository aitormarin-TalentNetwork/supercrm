// Zona horaria de negocio explícita: la tienda es una sola (MVP), así que
// "hoy" se define por su reloj, no por el del runtime de Convex (UTC) ni
// por el del navegador de quien mire la pantalla — si dependiera de
// cualquiera de los dos, un mismo paso podría contarse como "Hoy" en el
// servidor y como "Vencido" en el cliente (o al revés) cerca de
// medianoche, o en un cambio de horario de verano/invierno.
export const BUSINESS_TIME_ZONE = "Europe/Madrid";

function getTimeZoneOffsetMs(instantMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instantMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - instantMs;
}

function getZonedDateParts(instantMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(instantMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

// Epoch ms de las 00:00:00.000 del día de negocio (en `timeZone`) que
// contiene `instantMs`. Calcula el offset en el propio instante objetivo,
// no en `instantMs`, para que un cambio de DST entre ambos no lo desvíe.
function zonedMidnight(year: number, month: number, day: number, timeZone: string): number {
  const utcGuess = Date.UTC(year, month - 1, day);
  return utcGuess - getTimeZoneOffsetMs(utcGuess, timeZone);
}

export function startOfBusinessDay(
  instantMs: number,
  timeZone: string = BUSINESS_TIME_ZONE,
): number {
  const { year, month, day } = getZonedDateParts(instantMs, timeZone);
  return zonedMidnight(year, month, day, timeZone);
}

// Cota superior exclusiva del día de negocio: inicio del día siguiente.
// `Date.UTC` normaliza `day + 1` aunque desborde el mes, así que sirve
// igual el último día del mes que uno cualquiera.
export function startOfNextBusinessDay(
  instantMs: number,
  timeZone: string = BUSINESS_TIME_ZONE,
): number {
  const { year, month, day } = getZonedDateParts(instantMs, timeZone);
  return zonedMidnight(year, month, day + 1, timeZone);
}

// Nº de días de negocio (calendario, no de 24h) entre dos instantes.
// AIT-18 (sugerencia de auditoría): NO se puede calcular como
// `(startOfBusinessDay(to) - startOfBusinessDay(from)) / 86_400_000` —
// startOfBusinessDay devuelve el epoch real de la medianoche local, y en
// el cambio de horario de Madrid un "día" dura 23h o 25h reales, no 24h
// exactas; esa división podría redondear al día equivocado justo tras el
// cambio. Aquí se comparan las partes de fecha (año/mes/día) construidas
// con Date.UTC, que no tiene DST — la resta siempre es un múltiplo exacto
// de 86_400_000 sin importar qué pase con el huso horario real.
export function businessDaysBetween(
  fromMs: number,
  toMs: number,
  timeZone: string = BUSINESS_TIME_ZONE,
): number {
  const from = getZonedDateParts(fromMs, timeZone);
  const to = getZonedDateParts(toMs, timeZone);
  const fromAsUtc = Date.UTC(from.year, from.month - 1, from.day);
  const toAsUtc = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((toAsUtc - fromAsUtc) / 86_400_000);
}

// Hora del día (0-23) en la zona de negocio. Para UI que depende de "qué
// hora es ahora" (p.ej. el saludo de la pantalla "Hoy") en vez de la fecha
// límite de un paso — no reutiliza startOfBusinessDay porque aquí no
// interesa la medianoche, sino la hora corriente.
export function getBusinessHour(
  instantMs: number,
  timeZone: string = BUSINESS_TIME_ZONE,
): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    hour: "2-digit",
  }).formatToParts(new Date(instantMs));
  return Number(parts.find((p) => p.type === "hour")!.value);
}

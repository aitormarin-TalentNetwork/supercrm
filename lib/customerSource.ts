/**
 * Canales de origen de un cliente: el catálogo, y el primer paso que genera cada
 * uno.
 *
 * ESTO ES UNA LISTA DE PRODUCTO, no una constante técnica. Dice qué vías
 * contempla el CRM para que llegue un cliente, y eso habla del negocio. Por eso
 * vive en un fichero propio cuyo contenido principal ES la lista: añadir o quitar
 * un canal tiene que verse de un vistazo al leer el diff, no quedar enterrado
 * entre helpers.
 *
 * CONTRATO (AIT-81). `customers.source` guarda SIEMPRE uno de estos valores.
 *
 *   - El schema lo impone: `convex/schema.ts` valida contra el union derivado de
 *     esta misma lista (`convex/model/customerSource.ts`). No es una convención
 *     que haya que recordar — Convex rechaza en servidor cualquier otro valor.
 *   - Quien ESCRIBA en `customers.source` valida con ese mismo validador, no con
 *     una copia del union escrita a mano. Antes de AIT-81 el catálogo estaba
 *     duplicado en tres sitios (el union de `createQuick`, este mapa de primeros
 *     pasos, y el desplegable de `AltaRapidaModal`), y nada obligaba a que
 *     coincidieran: la trampa no era un fallo, era que el siguiente escritor la
 *     pisara sin enterarse.
 *   - Quien lo MUESTRE usa el valor tal cual: el catálogo ya está en el idioma
 *     del negocio, así que no hay etiqueta que traducir ni mapa de presentación.
 *
 * PARA AÑADIR UN CANAL (p. ej. "Email", si llega la Ola 2): se añade a
 * `CUSTOMER_SOURCES` y `tsc` obliga a darle su primer paso en
 * `FIRST_STEP_BY_SOURCE`. El validador, el desplegable del alta rápida y el tipo
 * de `customers.source` salen de aquí, así que no hay un tercer sitio que tocar.
 * Ojo: apretar el catálogo QUITANDO un canal es otra cosa — el push del schema
 * fallará si queda algún cliente guardado con ese valor (Convex valida los
 * documentos existentes al desplegar), así que eso pide migración primero.
 */

export const CUSTOMER_SOURCES = [
  "Llamada",
  "WhatsApp",
  "Recomendación",
  "Web",
  "Visita",
] as const;

export type CustomerSource = (typeof CUSTOMER_SOURCES)[number];

/**
 * Primer próximo paso según el canal por el que entró el cliente (PRD: Alta
 * rápida → "genera la oportunidad y su primer próximo paso automático").
 *
 * `Record<CustomerSource, string>` EXACTO, no `Record<string, string>`. Es el
 * cambio que convierte la trampa en un error de compilación: con la firma ancha
 * que había antes, indexar con un canal inexistente devolvía `undefined` sin que
 * `tsc` dijera nada, y el fallo aparecía lejos de la causa — al insertar el
 * `nextStep` con `action: undefined`. Con la firma exacta, añadir un canal sin su
 * primer paso no compila.
 */
export const FIRST_STEP_BY_SOURCE: Record<CustomerSource, string> = {
  Llamada: "Llamar para presentar la propuesta",
  WhatsApp: "Enviar WhatsApp de presentación",
  Recomendación: "Llamar para agradecer y presentar",
  Web: "Responder la solicitud web",
  Visita: "Agendar visita comercial",
};

/** Para validar un `string` de procedencia externa antes de tratarlo como canal. */
export function isCustomerSource(value: string): value is CustomerSource {
  return (CUSTOMER_SOURCES as readonly string[]).includes(value);
}

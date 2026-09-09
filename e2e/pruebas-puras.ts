/** Qué es una prueba pura, definido UNA SOLA VEZ.
 *
 *  AIT-109. Este patrón lo importan los DOS configs: `playwright.unit.config.ts`
 *  lo usa como `testMatch` y `playwright.config.ts` como `testIgnore`. No son dos
 *  literales que haya que acordarse de mantener iguales, porque los dos desenlaces
 *  de que se separen no son igual de graves:
 *
 *    se solapan  -> una prueba corre DOS veces. Ruidoso, se ve.
 *    se separan  -> una prueba corre CERO veces. Silencioso, y da el mismo verde
 *                   que una que pasa.
 *
 *  El segundo es el que hay que hacer imposible, no el que hay que recordar.
 *
 *  Se ancla al separador de ruta a propósito: `00-` tiene que ser el principio del
 *  NOMBRE del fichero, no aparecer en cualquier parte de la ruta absoluta — que
 *  incluye carpetas que no controlamos.
 *
 *  LIMITACIÓN DECLARADA: esto es una convención de nombre. Una prueba pura futura
 *  llamada `08-algo.spec.ts` se irá a la suite e2e y pagará el arranque del
 *  servidor. Falla hacia el lado LENTO, no hacia el verde: sigue ejecutándose.
 */
export const PATRON_PRUEBAS_PURAS = /[\\/]00-[^\\/]*\.spec\.ts$/;

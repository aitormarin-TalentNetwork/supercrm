import { v, type Infer } from "convex/values";
import {
  CUSTOMER_SOURCES,
  type CustomerSource,
} from "../../lib/customerSource";

/**
 * El validador de Convex para `customers.source`, DERIVADO del catálogo.
 *
 * Se construye a partir de `CUSTOMER_SOURCES` en vez de repetir los literales:
 * un union escrito a mano es una copia, y una copia se desincroniza en cuanto
 * alguien toca solo una de las dos. El catálogo vive en `lib/customerSource.ts`
 * porque es una lista de producto y la UI también la necesita; aquí solo se le
 * pone la forma que entiende Convex.
 *
 * Vive en `convex/model/` y no junto al catálogo para que `lib/customerSource.ts`
 * siga siendo un módulo puro: la importa el bundle de cliente (el desplegable del
 * alta rápida), y no tiene por qué arrastrar el runtime de validadores de Convex.
 */
export const customerSourceValidator = v.union(
  ...CUSTOMER_SOURCES.map((source) => v.literal(source)),
);

/**
 * Igualdad exacta de tipos: `A extends B` no serviría, porque `string` extiende
 * a cualquier union de literales de string y dejaría pasar justo el caso que
 * esto vigila.
 */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

/**
 * Aserción en tiempo de compilación de que el validador infiere EXACTAMENTE
 * `CustomerSource`, y no `string`.
 *
 * No es ceremonia: el riesgo real de derivar el union con un `.map()` es que
 * TypeScript pierda los literales por el camino (un `map` devuelve un array, no
 * una tupla) y el tipo inferido se ensanche a `string`. Si eso pasara, el schema
 * seguiría aceptando cualquier cosa, `FIRST_STEP_BY_SOURCE` volvería a ser
 * indexable con basura, y AIT-81 no habría arreglado nada — pero el código
 * *parecería* correcto y ninguna prueba de comportamiento lo notaría.
 * Con esta línea, ese escenario no compila.
 */
export const CUSTOMER_SOURCE_VALIDATOR_MATCHES_CATALOG: Equals<
  Infer<typeof customerSourceValidator>,
  CustomerSource
> = true;

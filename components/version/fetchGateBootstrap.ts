// AIT-83: el envoltorio de `fetch` tiene que instalarse ANTES de que cargue el
// bundle del framework, no en un `useEffect`.
//
// POR QUÉ, y no es teoría — se descubrió verificando (ver evidencias V1):
// instalando el envoltorio al montar el componente, la server action REAL
// pasaba de largo. El POST llevaba `next-action` (comprobado leyendo las
// cabeceras de la petición), o sea que era una server action de verdad, pero no
// entraba por `window.fetch`: Next captura su referencia a `fetch` cuando carga
// su propio módulo, que es antes de la hidratación. Sustituir `window.fetch`
// después ya no cambia la que el router tiene guardada.
//
// El aviso llegaba a mostrarse con una petición marcada a mano, así que el
// componente "parecía" correcto: es exactamente el tipo de fallo que solo
// aparece reproduciendo el escenario real con dos builds distintos.
//
// Este script se inyecta en el <head> del layout, así que corre antes que
// cualquier chunk del framework. Es deliberadamente mínimo: solo captura el
// `fetch` original y delega en un enganche que instala después el componente
// React. Mientras ese enganche no exista (antes de hidratar), todo pasa intacto
// — y antes de hidratar no hay acciones despachadas por el cliente.

export const FETCH_GATE_FLAG = "__supercrmFetchGateInstalled";
export const FETCH_GATE_HOOK = "__supercrmVersionGate";
export const FETCH_GATE_ORIGINAL = "__supercrmOriginalFetch";

/**
 * Se serializa tal cual dentro de un <script> inline. Sin dependencias, sin
 * sintaxis moderna que pueda no estar disponible antes del polyfill del
 * framework, y sin lanzar nunca: si algo va mal aquí, se rompería toda la app.
 */
export const FETCH_GATE_BOOTSTRAP = `
(function () {
  try {
    if (window.${FETCH_GATE_FLAG}) return;
    window.${FETCH_GATE_FLAG} = true;
    var original = window.fetch;
    window.${FETCH_GATE_ORIGINAL} = original;
    window.fetch = function (input, init) {
      try {
        var gate = window.${FETCH_GATE_HOOK};
        if (gate) {
          var taken = gate(input, init);
          if (taken) return taken;
        }
      } catch (e) {}
      return original.apply(this, arguments);
    };
  } catch (e) {}
})();
`.trim();

/** AIT-127 · C2a — El enumerador de controles alcanzables.
 *
 * 🔴 NO ES UNA LISTA DE SELECTORES, Y ESO ES EL CRITERIO. `FALLA si` el spec
 * comprueba una lista fija (corrección del PM, 2026-09-10): una lista se queda
 * vieja el día que alguien añade un control, C2a seguiría en verde y el camino
 * nuevo sería invisible para ella. Aquí la lista **la produce el DOM en el
 * instante de la medición**.
 *
 * ⚠️ RONDA 4 (M3) — Y MI VERSIÓN ANTERIOR **SÍ ERA UNA LISTA CERRADA**, aunque
 * yo la hubiera escrito como enumeración: recorría `a[href]` y un selector del
 * botón del panel, y con eso creí haber cubierto "cualquier navegación". No lo
 * estaba. La app **ya navega con `button` + `router.push`** — medido por el
 * auditor en `app/clientes/page.tsx` y `app/pipeline/page.tsx`. Un botón así
 * añadido a una pantalla habría devuelto `[]`, y mi control positivo habría
 * seguido verde **porque inyectaba otro `<a href>`: el elemento que mi propio
 * enumerador ya sabía ver**. El juez y el instrumento otra vez.
 *
 * ⚠️ Y POR ESO YA NO SE PREGUNTA "¿ESTO NAVEGA?", SINO "¿ESTO ES ALCANZABLE?".
 * Desde el DOM **no se puede saber** si el manejador de un `button` llama a
 * `router.push`: el manejador es una función de JavaScript, no un atributo. La
 * única pregunta contestable con la información que hay es si el control está
 * al alcance de la persona. Así que se cuentan **todos** los controles
 * interactivos alcanzables y se exige CERO.
 *
 * Es deliberadamente más ancho que "capaz de navegar", y falla CERRADO: un
 * control nuevo cuenta hasta que alguien demuestre que no debía contar. Lo
 * contrario —enumerar prohibiciones y presumir inocente lo demás— es lo que
 * dejó pasar el `router.push`.
 *
 * ⚠️ NO HAY LISTA DE PERMITIDOS, y también es deliberado: durante la ventana
 * **no debe quedar ni un control**. Por eso `<AvisoCierreSesion>` no lleva
 * botón de cerrar ni de reintentar. "Cero salvo los míos" no es cero.
 *
 * Se ejecuta DENTRO del navegador (`page.evaluate`), en el instante en que el
 * cierre está en vuelo.
 *
 * QUÉ CUENTA COMO ALCANZABLE: que una persona pueda llegar. Se descarta lo que
 * esté bajo un ancestro `inert` (que es lo que lo saca del orden de tabulación;
 * `aria-hidden` por sí solo no), lo deshabilitado, lo marcado `aria-disabled`
 * y lo que no se ve.
 */
export const ENUMERAR_CONTROLES_ALCANZABLES = `(() => {
  // Clases de control interactivo, no instancias concretas de esta app.
  const INTERACTIVOS = [
    "a[href]",
    "button",
    "input:not([type=hidden])",
    "select",
    "textarea",
    "summary",
    "[contenteditable]:not([contenteditable=false])",
    '[role="button"]',
    '[role="link"]',
    '[role="menuitem"]',
    '[role="tab"]',
    '[role="checkbox"]',
    '[role="switch"]',
    "[onclick]",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  const alcanzable = (el) => {
    if (el.closest("[inert]")) return false;
    if (el.matches(":disabled")) return false;
    if (el.getAttribute("aria-disabled") === "true") return false;
    return el.checkVisibility({
      opacityProperty: true,
      visibilityProperty: true,
      contentVisibilityAuto: true,
    });
  };

  const describir = (el) => {
    const etiqueta = el.tagName.toLowerCase();
    const nombre =
      el.getAttribute("aria-label") ||
      (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 40);
    const destino = el.tagName === "A" && el.href ? " -> " + el.getAttribute("href") : "";
    return etiqueta + destino + " «" + nombre + "»";
  };

  const encontrados = [];
  for (const el of document.querySelectorAll(INTERACTIVOS)) {
    if (!alcanzable(el)) continue;
    encontrados.push(describir(el));
  }
  return encontrados;
})()`;

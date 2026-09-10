/** AIT-127 · C2a — El enumerador de navegación alcanzable.
 *
 * 🔴 NO ES UNA LISTA DE SELECTORES, Y ESO ES EL CRITERIO, NO UN GUSTO.
 * `FALLA si` el spec comprueba una lista fija (corrección del PM,
 * 2026-09-10). Razón: una lista se queda vieja el día que alguien añade un
 * enlace — C2a seguiría en verde y el camino nuevo sería invisible para
 * ella. Aquí la lista **la produce el DOM en el instante de la medición**,
 * así que un enlace añadido dentro de tres semanas entra en el alcance de
 * C2a el día que se añade, sin que nadie tenga que acordarse.
 *
 * Se ejecuta DENTRO del navegador (`page.evaluate`), en el instante en que
 * el cierre está en vuelo.
 *
 * QUÉ CUENTA COMO "capaz de navegar dentro del área autenticada":
 *   - Cualquier `a[href]` del mismo origen que no apunte a /login. Un enlace
 *     a /login no es navegación dentro del área autenticada: es la salida.
 *   - Cualquier control que abra el panel de navegación
 *     (`aria-controls="app-nav-panel"`). ⚠️ Este SÍ es un selector fijo y se
 *     declara como tal: **no es la enumeración**, es una comprobación extra
 *     encima de ella. No enumera destinos de navegación, sino el único
 *     control que los revela. Si mañana hubiera otra vía de abrir el panel
 *     con otro atributo, la enumeración genérica de arriba seguiría viendo
 *     sus enlaces en cuanto dejaran de ser inalcanzables.
 *
 * QUÉ CUENTA COMO "alcanzable": que un humano pueda llegar. Se descarta lo
 * que esté bajo un ancestro `inert` (que es lo que saca del orden de
 * tabulación, no `aria-hidden`), lo deshabilitado, lo marcado
 * `aria-disabled` y lo que no se ve.
 */
export const ENUMERAR_NAVEGADORES_ALCANZABLES = `(() => {
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
  const texto = (el) => (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 40);
  const encontrados = [];
  for (const a of document.querySelectorAll("a[href]")) {
    let url;
    try { url = new URL(a.href, location.href); } catch { continue; }
    if (url.origin !== location.origin) continue;
    if (url.pathname === "/login") continue;
    if (!alcanzable(a)) continue;
    encontrados.push("enlace a " + url.pathname + " «" + texto(a) + "»");
  }
  for (const b of document.querySelectorAll('[aria-controls="app-nav-panel"]')) {
    if (!alcanzable(b)) continue;
    encontrados.push("abre el panel de navegación «" + (b.getAttribute("aria-label") || texto(b)) + "»");
  }
  return encontrados;
})()`;

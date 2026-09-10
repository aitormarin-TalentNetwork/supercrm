/** AIT-127 · C2a — El enumerador de controles alcanzables.
 *
 * 🔴 NO ES UNA LISTA DE SELECTORES, Y ESO ES EL CRITERIO. `FALLA si` el spec
 * comprueba una lista fija (corrección del PM, 2026-09-10).
 *
 * ⚠️ RONDA 5 (M3) — Y MI VERSIÓN ANTERIOR SEGUÍA SIENDO UNA LISTA FIJA, sólo
 * que más larga. Tenía una constante `INTERACTIVOS` con quince selectores
 * (`a[href]`, `button`, `[role="button"]`…) y hacía
 * `document.querySelectorAll(INTERACTIVOS)`. Yo había cambiado la PREGUNTA
 * correctamente —de «¿esto navega?» a «¿esto es alcanzable?»— pero la
 * RESPUESTA seguía saliendo de una taxonomía que escribí yo. Y mi control
 * positivo inyectaba un `<button>`: una clase que mi propia lista ya incluía.
 * El juez y el instrumento otra vez, más fino que las veces anteriores.
 *
 * 🔑 LO QUE CAMBIA: AHORA SE LE PREGUNTA AL NAVEGADOR, NO A UNA LISTA MÍA.
 * No hay ninguna enumeración de clases de control en este fichero. Hay dos
 * sondas, y las dos preguntan por COMPORTAMIENTO:
 *
 *   1. TECLADO — se recorre el documento ENTERO (`*`) y de cada elemento se
 *      comprueba si el navegador le da el foco: `el.focus()` y luego
 *      `document.activeElement === el`. Quien contesta es el navegador. Un
 *      control inventado mañana —un custom element, un `<dialog>`, algo que
 *      todavía no existe— contesta a esta pregunta igual que un `<button>`,
 *      sin que nadie tenga que añadirlo aquí.
 *
 *      Esto absorbe de paso lo que antes eran comprobaciones sueltas:
 *      `:disabled`, `inert`, `display:none`, `visibility:hidden` y
 *      `tabindex="-1"` NO son enfocables, así que el navegador ya los excluye.
 *      No hay que acordarse de ninguna.
 *
 *   2. PUNTERO — lo que no toma foco pero sí recibe clic. Se barre una rejilla
 *      del viewport con `document.elementFromPoint` y se exige que TODO
 *      impacto caiga en un subárbol `inert`, en el propio `<body>`/`<html>`
 *      (o sea: no hay nada encima), o en una región de anuncio. Tampoco aquí
 *      se nombra ninguna clase de control: se comprueba la propiedad
 *      estructural de que el bloqueo cubre la superficie clicable.
 *
 * ⚠️ LA SONDA 1 NO EXIME NADA, NI SIQUIERA EL AVISO DEL PROPIO CIERRE. Recorre
 * todo el documento. Si `<AvisoCierreSesion>` creciera un botón —de cerrar, de
 * reintentar—, esta sonda lo encuentra y C2a se pone roja. Es lo que hace
 * honesta la exención de anuncios de la sonda 2: la 2 exime una región que la
 * 1 sí está mirando. «Cero salvo los míos» no es cero.
 *
 * FALLA CERRADO: un elemento cuenta hasta que el navegador diga que no es
 * alcanzable. Lo contrario —presumir inocente lo que no reconozco— es
 * exactamente lo que dejó pasar el `router.push` en la ronda 3 y el
 * `<NewVersionNotice>` en la 4.
 *
 * Se ejecuta DENTRO del navegador (`page.evaluate`), en el instante en que el
 * cierre está en vuelo.
 */
export const ENUMERAR_CONTROLES_ALCANZABLES = `(() => {
  const encontrados = [];
  const yaVisto = new Set();

  const describir = (el) => {
    const etiqueta = el.tagName.toLowerCase();
    const nombre =
      el.getAttribute("aria-label") ||
      (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 40);
    const destino =
      el.tagName === "A" && el.getAttribute("href")
        ? " -> " + el.getAttribute("href")
        : "";
    return etiqueta + destino + " «" + nombre + "»";
  };

  const anotar = (el, via) => {
    const clave = via + "|" + describir(el);
    if (yaVisto.has(clave)) return;
    yaVisto.add(clave);
    encontrados.push(describir(el) + " [" + via + "]");
  };

  // ── SONDA 1 · TECLADO ──────────────────────────────────────────────────
  // Sin exenciones y sin lista de selectores: todo el documento, y contesta
  // el navegador. Se guarda el foco previo y se restaura al final para no
  // dejar la pagina en otro estado del que tenia.
  const focoPrevio = document.activeElement;
  for (const el of document.querySelectorAll("*")) {
    // <html> y <body> se saltan porque son el documento, no un control: en
    // algunos navegadores <body> acepta el foco como contenedor por defecto.
    if (el === document.documentElement || el === document.body) continue;
    if (typeof el.focus !== "function") continue;
    try {
      el.focus({ preventScroll: true });
    } catch (e) {
      continue;
    }
    if (document.activeElement === el) anotar(el, "foco");
  }
  if (focoPrevio && typeof focoPrevio.focus === "function") {
    try { focoPrevio.focus({ preventScroll: true }); } catch (e) {}
  } else if (document.activeElement && document.activeElement.blur) {
    document.activeElement.blur();
  }

  // ── SONDA 2 · PUNTERO ──────────────────────────────────────────────────
  // Lo clicable que no toma foco. No se pregunta "de que clase es": se exige
  // que el impacto caiga en algo BLOQUEADO. Un anuncio (role=status/alert) se
  // exime aqui porque la sonda 1 ya lo esta mirando entera.
  const PASO = 32;
  const ancho = window.innerWidth;
  const alto = window.innerHeight;
  for (let x = 1; x < ancho; x += PASO) {
    for (let y = 1; y < alto; y += PASO) {
      const el = document.elementFromPoint(x, y);
      if (!el) continue;
      if (el === document.documentElement || el === document.body) continue;
      if (el.closest("[inert]")) continue;
      if (el.closest('[role="status"],[role="alert"]')) continue;
      // ⚠️ UNICA EXENCION POR NOMBRE DE TODO EL INSTRUMENTO, Y SE DECLARA
      // ENTERA. <nextjs-portal> es el overlay de herramientas que el servidor
      // de DESARROLLO de Next inyecta en la pagina; no es UI de SuperCRM y no
      // existe en un build de produccion. Sin esta exencion la rejilla lo
      // encuentra en 10 de 10 activaciones y C2a queda roja para siempre por
      // una pieza que no es del producto.
      //
      // 🔑 Es una lista de permitidos de UN elemento, y esta acotada por dos
      // lados: (a) la sonda de foco NO lo exime, asi que si el overlay tuviera
      // algo enfocable saldria por ahi; (b) al ser una exencion por NOMBRE, un
      // control de producto no puede colarse por ella sin llamarse asi.
      // Si algun dia el nombre cambia, este test se pone rojo — que es la
      // direccion correcta en la que fallar.
      if (el.closest("nextjs-portal")) continue;
      anotar(el, "puntero");
    }
  }

  return encontrados;
})()`;

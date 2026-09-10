// AIT-92 · La página que devuelve el callback de OAuth.
//
// 🔴 POR QUÉ ESTO ES UN MÓDULO APARTE Y NO TRES LÍNEAS DENTRO DEL HANDLER:
// la primera versión concatenaba el parámetro `error` —que viene de una query
// pública— dentro del HTML sin escapar. Eso es un XSS reflejado sobre el origen
// `.convex.site`: contenido activo y phishing bajo un dominio legítimo del
// servicio. Lo demostró el auditor ejecutándolo, no leyéndolo.
//
// 📌 Y la parte que conviene retener: la puerta era **la rama de manejo de
// errores**, la que existe para ser amable cuando algo falla. El camino feliz no
// interpolaba nada del solicitante.
//
// Aquí vive separado para que se pueda ejercitar con entradas hostiles sin
// desplegar nada, y para que el handler no tenga forma de construir HTML por su
// cuenta.

/** Escapa TODO lo que pueda acabar dentro del documento. Incluye comillas
 *  porque un valor escapado solo para texto sigue rompiendo un atributo. */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Los códigos de error de Google que sabemos nombrar. Cualquier otro NO se
 *  refleja: se cuenta como desconocido. Escapar ya bastaría, pero una lista
 *  cerrada no depende de que el escapado sea perfecto — y el valor lo elige
 *  quien construye la URL. */
const ERRORES_CONOCIDOS: Record<string, string> = {
  access_denied:
    "Rechazaste el permiso en Google, así que el CRM no ha guardado nada.",
  admin_policy_enforced:
    "La política del Workspace no permite conceder este permiso. El CRM no ha guardado nada.",
};

export function mensajeDeErrorDeGoogle(codigo: string): string {
  return (
    ERRORES_CONOCIDOS[codigo] ??
    "Google no ha concedido el permiso. No se ha guardado nada."
  );
}

/** Construye la página. `titulo` y `detalle` se escapan SIEMPRE: no hay forma de
 *  pasar HTML a través de esta función, ni por descuido ni a propósito. Si algún
 *  día hace falta énfasis, se añade aquí como marca propia, no dejando pasar
 *  etiquetas. */
export function paginaHtml(
  titulo: string,
  detalle: string,
  volverA: string,
): string {
  return (
    `<!doctype html><meta charset="utf-8"><title>${escaparHtml(titulo)}</title>` +
    `<body style="font-family:system-ui;margin:40px;max-width:32rem">` +
    `<h1 style="font-size:18px">${escaparHtml(titulo)}</h1>` +
    `<p>${escaparHtml(detalle)}</p>` +
    `<p><a href="${escaparHtml(volverA)}">Volver a Ajustes</a></p>`
  );
}

/** A dónde vuelve el usuario. NO puede ser `/ajustes` a secas: el callback vive
 *  en `<deployment>.convex.site` y esa ruta relativa aterrizaría en el host de
 *  Convex, que no sirve la app — el usuario completaría el consentimiento y
 *  caería en una ruta inexistente. Falla en el CAMINO BUENO, que es el que menos
 *  se prueba. */
export function urlDeVuelta(siteUrl: string | undefined): string {
  if (!siteUrl) return "/ajustes";
  return `${siteUrl.replace(/\/+$/, "")}/ajustes`;
}

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { debeEscribirse } from "./model/gmailFlow";
import {
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_TOKEN_ENCRYPTION_KEY,
  cifrarToken,
} from "./model/gmailCrypto";

const http = httpRouter();

auth.addHttpRoutes(http);

// AIT-92 · Vuelta del consentimiento de Google.
//
// Vive en Convex y no en Next a propósito: el canje del código por el token de
// refresco ocurre en el servidor, así que el token NUNCA pasa por el navegador.
//
// FAIL-CLOSED: cualquier validación que falle termina SIN ESCRIBIR NADA. Y el
// orden importa — el `state` se consume antes de hablar con Google, para que un
// reenvío del mismo callback no llegue siquiera a pedir un token.

/** Página mínima de vuelta. No imprime tokens, ni truncados, ni su longitud. */
function pagina(titulo: string, detalle: string, status: number): Response {
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>${titulo}</title>` +
      `<body style="font-family:system-ui;margin:40px;max-width:32rem">` +
      `<h1 style="font-size:18px">${titulo}</h1><p>${detalle}</p>` +
      `<p><a href="/ajustes">Volver a Ajustes</a></p>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

http.route({
  path: "/gmail/oauth/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const params = new URL(request.url).searchParams;

    // Rechazo del usuario en Google: no se guarda nada y se explica.
    const error = params.get("error");
    if (error !== null) {
      return pagina(
        "No se ha conectado tu Gmail",
        error === "access_denied"
          ? "Rechazaste el permiso en Google, así que el CRM no ha guardado nada."
          : `Google devolvió el error «${error}». No se ha guardado nada.`,
        200,
      );
    }

    const code = params.get("code");
    const state = params.get("state");
    if (code === null || state === null) {
      return pagina(
        "Petición incompleta",
        "Faltan datos en la vuelta de Google. No se ha guardado nada.",
        400,
      );
    }

    // El `state` se comprueba Y se consume en la misma transacción.
    const consumo = await ctx.runMutation(internal.gmail.consumirState, { state });
    if (!consumo.ok) {
      return pagina(
        "Ese enlace ya no vale",
        `El identificador de la solicitud es ${consumo.motivo}. Vuelve a Ajustes ` +
          `y pulsa «Conectar mi Gmail» otra vez. No se ha guardado nada.`,
        400,
      );
    }

    const clientId = process.env[GMAIL_CLIENT_ID];
    const clientSecret = process.env[GMAIL_CLIENT_SECRET];
    const claveDeCifrado = process.env[GMAIL_TOKEN_ENCRYPTION_KEY];
    // Esto ya lo comprobó el gate ANTES de mandar a nadie a Google. Si aún así
    // faltara aquí, se rechaza sin escribir: no es el sitio donde se detecta,
    // es el cinturón.
    if (!clientId || !clientSecret || !claveDeCifrado) {
      return pagina(
        "Este deployment no puede guardar la conexión",
        "Falta configuración del servidor. No se ha guardado nada.",
        500,
      );
    }

    const respuesta = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${process.env.CONVEX_SITE_URL}/gmail/oauth/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!respuesta.ok) {
      return pagina(
        "Google no ha aceptado la solicitud",
        "El canje del código ha fallado. No se ha guardado nada.",
        502,
      );
    }
    const tokens = (await respuesta.json()) as {
      access_token?: string;
      refresh_token?: string;
    };

    // ⛔ SIN REFRESH TOKEN NO SE ESCRIBE NADA. Guardar solo el access token
    // sería una conexión que caduca en una hora y que la pantalla enseñaría
    // como conectada: el falso verde de esta ficha.
    const decision = debeEscribirse(tokens);
    if (!decision.escribir) {
      return pagina(
        "Google no ha dado un permiso duradero",
        "No ha llegado el token de refresco, así que la conexión no serviría " +
          "más de una hora. No se ha guardado nada. Vuelve a intentarlo.",
        502,
      );
    }

    // La dirección del buzón sale del propio Gmail con el permiso que acabamos
    // de recibir — no hace falta pedir un scope de perfil aparte.
    const perfil = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/profile",
      { headers: { authorization: `Bearer ${decision.accessToken}` } },
    );
    if (!perfil.ok) {
      return pagina(
        "No se ha podido leer la dirección del buzón",
        "El permiso llegó, pero no se pudo confirmar de qué buzón es. No se ha " +
          "guardado nada.",
        502,
      );
    }
    const { emailAddress } = (await perfil.json()) as { emailAddress?: string };
    if (!emailAddress) {
      return pagina(
        "No se ha podido leer la dirección del buzón",
        "Google no devolvió la dirección. No se ha guardado nada.",
        502,
      );
    }

    const refreshTokenCipher = await cifrarToken(
      decision.refreshToken,
      claveDeCifrado,
    );
    await ctx.runMutation(internal.gmail.guardarConexion, {
      userId: consumo.userId,
      emailAddress,
      refreshTokenCipher,
    });

    return pagina(
      "Gmail conectado",
      `Se ha conectado <strong>${emailAddress}</strong>. El CRM solo puede leer: ` +
        `no puede modificar ni borrar nada de tu buzón.`,
      200,
    );
  }),
});

export default http;

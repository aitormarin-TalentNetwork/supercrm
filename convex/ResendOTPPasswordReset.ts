import type { EmailConfig, GenericActionCtxWithAuthConfig } from "@convex-dev/auth/server";
import { RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

// AIT-62: rate-limit de solicitudes de reseteo de contraseña. Se comprueba
// desde convex/auth.ts (rama `reset` del `authorize` propio), ANTES de que
// Convex Auth genere/persista un código nuevo — comprobado leyendo
// node_modules/@convex-dev/auth@0.0.94: `callCreateVerificationCode` borra
// el código anterior de forma incondicional, y eso ocurre ANTES de que
// `sendVerificationRequest` (más abajo, en este mismo fichero) llegue a
// ejecutarse. Comprobar el límite aquí, dentro de `sendVerificationRequest`,
// llegaría tarde: la 4ª solicitud ya habría invalidado el código válido de
// la 3ª sin haber llegado a enviarlo. Por eso el chequeo vive en
// convex/auth.ts, no aquí — este fichero solo define el límite en sí.
const rateLimiter = new RateLimiter(components.rateLimiter, {
  passwordResetRequest: { kind: "fixed window", rate: 3, period: 15 * 60 * 1000 },
});

export async function checkPasswordResetRateLimit(
  ctx: GenericActionCtxWithAuthConfig<DataModel>,
  email: string,
): Promise<void> {
  const { ok } = await rateLimiter.limit(ctx, "passwordResetRequest", {
    key: email,
  });
  if (!ok) {
    throw new Error(
      "Demasiadas solicitudes de reseteo. Espera unos minutos e inténtalo de nuevo.",
    );
  }
}

// Código numérico de 6 dígitos, para que la persona lo teclee a mano (el
// generador por defecto de la librería produce un token de 32 caracteres
// pensado para un link, no para un formulario). CSPRNG (Web Crypto,
// disponible en el runtime por defecto de las actions de Convex, sin
// necesitar "use node") con muestreo por rechazo para no sesgar el módulo:
// 900000 no divide exacto a 2^32, así que descartamos los valores altos que
// romperían la distribución uniforme.
function generateSixDigitCode(): string {
  const RANGE = 900000; // 100000–999999
  const MAX_UINT32 = 0xffffffff;
  const REJECTION_LIMIT = MAX_UINT32 - (MAX_UINT32 % RANGE);
  let value: number;
  do {
    value = crypto.getRandomValues(new Uint32Array(1))[0];
  } while (value >= REJECTION_LIMIT);
  return String(100000 + (value % RANGE));
}

// EmailConfig pasado a `reset:` en `convex/auth.ts` (Password) y también
// referenciado directamente (misma instancia, no una fábrica) dentro del
// `authorize` propio para llamar a `signInViaProvider`.
export const ResendOTPPasswordReset: EmailConfig = {
  id: "resend-otp-password-reset",
  name: "Resend (reseteo de contraseña)",
  type: "email",
  maxAge: 60 * 15, // 15 minutos (criterio de aceptación #1)
  generateVerificationToken: async () => generateSixDigitCode(),
  async sendVerificationRequest({ identifier, token }) {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY no está configurada en este deployment.");
    }
    if (!fromEmail) {
      throw new Error("RESEND_FROM_EMAIL no está configurada en este deployment.");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: identifier,
        subject: "Código para restablecer tu contraseña — SuperCRM",
        text: `Tu código para restablecer la contraseña es: ${token}\n\nCaduca en 15 minutos. Si no has pedido este cambio, ignora este email.`,
      }),
    });

    if (!response.ok) {
      // El cuerpo completo de la respuesta de Resend puede incluir detalle
      // interno de la API — se registra en el servidor, nunca se propaga al
      // cliente (mismo criterio que describeQuoteError/describeCreateUserError).
      console.error(
        `Resend respondió ${response.status} al enviar el código de reseteo:`,
        await response.text(),
      );
      throw new Error(
        "No se ha podido enviar el código. Inténtalo de nuevo más tarde.",
      );
    }
  },
};

"use client";

import { useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvex } from "convex/react";
import { AlertCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";

interface PasswordResetDialogProps {
  open: boolean;
  onClose: () => void;
  initialEmail?: string;
}

// Mismo formato que ya exige app/login/page.tsx — un solo criterio de
// "email válido" en toda la pantalla de Acceso.
const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Mismo mínimo que Convex Auth exige por defecto
// (validateDefaultPasswordRequirements en Password.js: password.length < 8
// → inválida) — así el usuario nunca llega a golpear el mensaje genérico
// "Invalid password" del servidor, ya lo atajamos antes en cliente.
const MIN_PASSWORD_LENGTH = 8;

// AIT-63: mensajes exactos lanzados por @convex-dev/auth (confirmados
// leyendo node_modules/@convex-dev/auth/dist/providers/Password.js) — si
// cambian en una futura versión de la librería, esto se rompe de forma
// visible (cae al mensaje genérico de abajo), no en silencio.
const RESET_NOT_CONFIGURED_MARKER = "Password reset is not enabled";
const INVALID_CODE_MARKER = "Invalid code";

function describeResetRequestError(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  if (message.includes(RESET_NOT_CONFIGURED_MARKER)) {
    return "La recuperación de contraseña no está disponible todavía. Inténtalo más tarde.";
  }
  return "No se ha podido enviar el código. Comprueba el email e inténtalo de nuevo.";
}

function describeResetVerificationError(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  if (message.includes(INVALID_CODE_MARKER)) {
    return "El código no es válido o ha caducado. Vuelve atrás y pide uno nuevo.";
  }
  return "No se ha podido completar el cambio de contraseña. Inténtalo de nuevo.";
}

type Step = "email" | "code";

// AIT-63: "¿Olvidaste la contraseña?" en Acceso. Todo dentro de este
// diálogo, sin ruta nueva — dos pasos internos (email → código +
// contraseña nueva juntos, porque Convex Auth exige mandar `code` y
// `newPassword` en la misma llamada `reset-verification`, no en dos).
// Solo aplica a cuentas con login por contraseña: el login con Google
// (AIT-60) no tiene contraseña que recuperar.
export function PasswordResetDialog({
  open,
  onClose,
  initialEmail = "",
}: PasswordResetDialogProps) {
  const { signIn } = useAuthActions();
  const convex = useConvex();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // Reinicio de estado al abrir — mismo patrón "ajustar estado durante el
  // render" que ya usa AltaRapidaModal (prevOpen), no un useEffect: cada
  // apertura del diálogo empieza limpia en el paso "email", sin arrastrar
  // código/contraseña de un intento anterior.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setStep("email");
      setEmail(initialEmail);
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setEmailError("");
      setCodeError("");
      setPasswordError("");
      setConfirmError("");
      setFormError("");
      setLoading(false);
    }
  }

  async function handleRequestCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setEmailError("Introduce tu email.");
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setEmailError("El email no tiene un formato válido.");
      return;
    }
    setEmailError("");
    setFormError("");
    setLoading(true);
    try {
      // AIT-62 (T1) expone esta query justo para poder distinguir el
      // método de login ANTES de pedir el reset — así no dependemos de
      // interpretar el error que lanzaría signIn("password", {flow:
      // "reset"}) para una cuenta sin contraseña (esa rama de
      // Convex Auth revienta con un TypeError genérico al desestructurar
      // `null`, no con un mensaje reconocible — ver Password.js).
      const methods = await convex.query(api.users.getLoginMethodsForEmail, {
        email: trimmedEmail,
      });
      if (!methods.hasPassword && methods.hasGoogle) {
        // Divulgación deliberada, no un descuido de anti-enumeración: el
        // propio criterio de aceptación de AIT-63 pide explícitamente
        // este mensaje para cuentas solo-Google. Un email que
        // directamente no existe (ni password ni Google) SÍ cae en el
        // mensaje genérico de abajo, sin distinguirlo de cualquier otro
        // fallo — eso es lo que evita filtrar qué emails están dados de
        // alta en el sistema.
        setFormError(
          "Esta cuenta entra con Google, no tiene contraseña que recuperar.",
        );
        return;
      }
      if (!methods.hasPassword) {
        setFormError(
          "No se ha podido enviar el código. Comprueba el email e inténtalo de nuevo.",
        );
        return;
      }
      await signIn("password", { flow: "reset", email: trimmedEmail });
      setEmail(trimmedEmail);
      setStep("code");
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo pidiendo el código de recuperación:", err);
      }
      setFormError(describeResetRequestError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    let hasError = false;
    if (!code.trim()) {
      setCodeError("Introduce el código recibido por email.");
      hasError = true;
    } else {
      setCodeError("");
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      );
      hasError = true;
    } else {
      setPasswordError("");
    }
    if (newPassword !== confirmPassword) {
      setConfirmError("Las contraseñas no coinciden.");
      hasError = true;
    } else {
      setConfirmError("");
    }
    if (hasError) return;

    setFormError("");
    setLoading(true);
    try {
      await signIn("password", {
        flow: "reset-verification",
        email,
        code: code.trim(),
        newPassword,
      });
      // Éxito: NO ponemos loading en false aquí a propósito (sin
      // `finally`), ni cerramos el diálogo ni redirigimos nosotros — el
      // useEffect que ya existe en app/login/page.tsx
      // (isAuthenticated → router.push("/")) hace la navegación en
      // cuanto Convex confirme la sesión nueva, igual que ya hace el
      // login normal y el de Google. El diálogo se queda "cargando"
      // hasta que ese redirect desmonte la pantalla entera, en vez de
      // parpadear de vuelta a un formulario vacío.
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo confirmando el cambio de contraseña:", err);
      }
      setLoading(false);
      setFormError(describeResetVerificationError(err));
    }
  }

  function handleBackToEmail() {
    if (loading) return;
    setStep("email");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setCodeError("");
    setPasswordError("");
    setConfirmError("");
    setFormError("");
  }

  const footer =
    step === "email" ? (
      <>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          form="password-reset-email-form"
          disabled={loading}
        >
          {loading ? "Enviando…" : "Enviar código"}
        </Button>
      </>
    ) : (
      <>
        <Button
          variant="secondary"
          onClick={handleBackToEmail}
          disabled={loading}
        >
          Volver
        </Button>
        <Button
          type="submit"
          form="password-reset-code-form"
          disabled={loading}
        >
          {loading ? "Guardando…" : "Cambiar contraseña"}
        </Button>
      </>
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Recuperar contraseña"
      description={
        step === "email"
          ? "Introduce tu email y te enviaremos un código para restablecer tu contraseña."
          : `Introduce el código enviado a ${email} y elige una contraseña nueva.`
      }
      width={420}
      footer={footer}
    >
      {formError && (
        <div
          role="alert"
          className="mb-3.5 flex items-start gap-2 rounded-md bg-error-subtle p-3 text-sm text-error"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {step === "email" && (
        <form
          id="password-reset-email-form"
          onSubmit={handleRequestCode}
          className="flex flex-col gap-3.5"
        >
          <Input
            type="email"
            label="Email"
            placeholder="tu@empresa.es"
            autoComplete="username"
            error={emailError}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </form>
      )}

      {step === "code" && (
        <form
          id="password-reset-code-form"
          onSubmit={handleConfirmReset}
          className="flex flex-col gap-3.5"
        >
          <Input
            label="Código"
            placeholder="Código recibido por email"
            autoComplete="one-time-code"
            error={codeError}
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <PasswordInput
            label="Contraseña nueva"
            autoComplete="new-password"
            error={passwordError}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <PasswordInput
            label="Confirmar contraseña nueva"
            autoComplete="new-password"
            error={confirmError}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </form>
      )}
    </Dialog>
  );
}

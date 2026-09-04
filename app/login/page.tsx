"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  AlertCircle,
  Bell,
  Mail,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordResetDialog } from "@/components/auth/PasswordResetDialog";

// Cuentas de prueba visibles siempre, incluida producción — decisión
// explícita del proyecto (es un entorno de pruebas, sin datos reales) para
// no tener que ir a buscar las credenciales cada vez.
const DEMO_ACCOUNTS = [
  {
    label: "Marta Ledo",
    sublabel: "Dueña · entra al Panel",
    email: "marta@supercrm.es",
    password: process.env.NEXT_PUBLIC_DEMO_OWNER_PASSWORD ?? "",
  },
  {
    label: "Carlos Vega",
    sublabel: "Vendedor · entra a Hoy",
    email: "carlos@supercrm.es",
    password: process.env.NEXT_PUBLIC_DEMO_SALES_PASSWORD ?? "",
  },
];

// AIT-60 (cambio de alcance del PM, 2026-08-24): Google se AÑADE en
// paralelo al formulario email/contraseña de AIT-8/AIT-9 — no lo sustituye.
// Quién puede entrar por Google lo decide la dueña, dando de alta el email
// desde Ajustes ANTES de que esa persona inicie sesión
// (convex/auth.ts:createOrUpdateUser rechaza cualquier email sin fila
// previa en `users` — no hay alta automática).
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [credError, setCredError] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Una sola vía de redirección tras autenticarse, para las dos formas de
  // entrar (contraseña y Google) — con Google, la navegación pasa por una
  // recarga completa de página (signIn("google") hace window.location),
  // así que no hay un "submit" al que engancharse como con el formulario.
  useEffect(() => {
    if (isAuthenticated) router.push("/");
  }, [isAuthenticated, router]);

  function fill(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setEmailError("");
    setPasswordError("");
    setCredError("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCredError("");

    let hasError = false;
    if (!email) {
      setEmailError("Introduce tu email.");
      hasError = true;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("El email no tiene un formato válido.");
      hasError = true;
    } else {
      setEmailError("");
    }
    if (!password) {
      setPasswordError("Introduce tu contraseña.");
      hasError = true;
    } else {
      setPasswordError("");
    }
    if (hasError) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("flow", "signIn");
      formData.set("email", email);
      formData.set("password", password);
      await signIn("password", formData);
    } catch (err) {
      // El mensaje al usuario se mantiene genérico a propósito (no revelar
      // si el email existe o no), pero el error real —credenciales
      // incorrectas o un fallo de infraestructura (p. ej. JWT_PRIVATE_KEY
      // sin configurar en el deployment)— queda en consola para poder
      // diagnosticarlo, solo en desarrollo: en producción no debe llegar
      // a la consola del navegador del usuario final.
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo en signIn:", err);
      }
      setCredError(
        "Email o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  }

  // Lectura directa de window.location durante el render (no en estado +
  // efecto): en el primer render de cliente `isLoading` de useConvexAuth
  // todavía es `true` (igual que en servidor, donde `window` ni existe),
  // así que showGoogleBlockedMessage sale `false` en los dos — sin eso
  // habría un desajuste de hidratación entre servidor y cliente. Mismo
  // patrón de lectura que usa el propio cliente de @convex-dev/auth para
  // el "code" de OAuth.
  //
  // Convex Auth redirige de vuelta en silencio tanto si el login con
  // Google tiene éxito como si createOrUpdateUser lo rechaza (cuenta sin
  // alta previa) — no hay forma pública de distinguir el motivo exacto
  // desde el cliente (decisión de la propia librería: evita filtrar si
  // un email concreto existe o no en el sistema). Se detecta el rechazo
  // por descarte: si volvimos aquí con "?oauth=1" y, tras resolver el
  // estado de auth, seguimos sin sesión, es que no se completó.
  const oauthAttempted =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("oauth") === "1";
  const showGoogleBlockedMessage =
    oauthAttempted && !isLoading && !isAuthenticated;

  async function handleGoogleSignIn() {
    setStarting(true);
    try {
      await signIn("google", { redirectTo: "/login?oauth=1" });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo iniciando el flujo de Google:", err);
      }
      setStarting(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 min-[880px]:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca — solo escritorio */}
      <aside className="hidden flex-col justify-between bg-neutral-900 p-14 text-white min-[880px]:flex">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#6366F1]" />
          <span className="text-lg font-bold">SuperCRM</span>
        </div>

        <div className="flex flex-col gap-6">
          <h1 className="text-h1 font-extrabold leading-tight">
            No pierdas ventas por falta de seguimiento.
          </h1>
          <p className="text-body-lg text-neutral-300">
            Tu pipeline, tus contactos y tu próximo paso, en un único lugar.
            Valor desde el primer día.
          </p>
          <ul className="flex flex-col gap-4">
            <li className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <TrendingUp size={16} />
              </span>
              <span className="text-sm text-neutral-200">
                El estado de cada venta, de un vistazo
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <Bell size={16} />
              </span>
              <span className="text-sm text-neutral-200">
                Un próximo paso automático para cada oportunidad
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <ShieldCheck size={16} />
              </span>
              <span className="text-sm text-neutral-200">
                Tu negocio bajo control, desde el móvil o el escritorio
              </span>
            </li>
          </ul>
        </div>

        <p className="text-xs text-neutral-400">
          © 2026 SuperCRM · CRM de ventas para pequeños negocios
        </p>
      </aside>

      {/* Panel de acceso */}
      <main className="flex flex-1 flex-col items-center justify-center p-7">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex items-center gap-3 min-[880px]:hidden">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#6366F1]" />
            <span className="text-base font-bold text-text">SuperCRM</span>
          </div>

          <h2 className="text-h2 font-bold text-text">Inicia sesión</h2>
          <p className="mt-1 mb-6 text-sm text-text-secondary">
            Entra para ver tu pipeline y los seguimientos de hoy.
          </p>

          {showGoogleBlockedMessage && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-md bg-error-subtle p-3 text-sm text-error"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>
                No se ha podido completar el inicio de sesión con Google. Si
                crees que deberías tener acceso, contacta con la dueña de tu
                empresa.
              </span>
            </div>
          )}

          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            disabled={starting}
            leftIcon={<GoogleLogo />}
            onClick={handleGoogleSignIn}
          >
            {starting ? "Redirigiendo…" : "Continuar con Google"}
          </Button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              o
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {credError && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-md bg-error-subtle p-3 text-sm text-error"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{credError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              name="email"
              type="email"
              autoComplete="username"
              label="Email o usuario"
              placeholder="tu@empresa.es"
              leftIcon={<Mail size={16} />}
              error={emailError}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div>
              <PasswordInput
                name="password"
                autoComplete="current-password"
                placeholder="Tu contraseña"
                error={passwordError}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="mt-2 text-right">
                {/* AIT-72: min-h-[44px] (--tap-min), no solo la altura de
                    la línea de texto — mismo patrón ya usado en los
                    enlaces "Ver pipeline"/"Ver supervisión" del Panel. */}
                <button
                  type="button"
                  onClick={() => setResetDialogOpen(true)}
                  className="inline-flex min-h-[44px] items-center text-sm font-semibold text-primary hover:underline"
                >
                  ¿Olvidaste la contraseña?
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" fullWidth disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </form>

          {DEMO_ACCOUNTS.length > 0 && (
            <div className="mt-8 rounded-lg border border-border p-4">
              <p className="mb-3 text-overline font-semibold uppercase tracking-wide text-text-muted">
                Cuentas de prueba
              </p>
              <div className="flex flex-col gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fill(account.email, account.password)}
                    className="flex items-center justify-between rounded-md p-2 text-left hover:bg-neutral-50"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
                        {account.label
                          .split(" ")
                          .map((w) => w[0])
                          .join("")}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-text">
                          {account.label}
                        </span>
                        <span className="block text-xs text-text-muted">
                          {account.sublabel}
                        </span>
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      Usar
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-text-muted">
                Contraseña para ambas:{" "}
                <span className="font-mono">
                  {DEMO_ACCOUNTS[0]?.password || "—"}
                </span>
              </p>
            </div>
          )}

          <p className="mt-8 text-center text-xs text-text-muted">
            Los accesos los crea la dueña de tu empresa.
            <br />
            No hay registro público.
          </p>
        </div>
      </main>

      <PasswordResetDialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        initialEmail={email}
      />
    </div>
  );
}

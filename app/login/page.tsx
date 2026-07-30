"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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

// Cuentas de prueba: solo en desarrollo. La guarda `NODE_ENV !== "production"`
// hace que el minificador de Next.js (webpack y Turbopack, verificado con un
// build real) elimine este array por completo del bundle de producción —
// ninguna contraseña llega a un visitante real.
const DEMO_ACCOUNTS =
  process.env.NODE_ENV !== "production"
    ? [
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
      ]
    : [];

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [credError, setCredError] = useState("");
  const [loading, setLoading] = useState(false);

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
      router.push("/");
    } catch (err) {
      // El mensaje al usuario se mantiene genérico a propósito (no revelar
      // si el email existe o no), pero el error real —credenciales
      // incorrectas o un fallo de infraestructura (p. ej. JWT_PRIVATE_KEY
      // sin configurar en el deployment)— queda en consola para poder
      // diagnosticarlo sin exponerlo al usuario.
      console.error("Fallo en signIn:", err);
      setCredError(
        "Email o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
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

      {/* Panel de formulario */}
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
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "Pide a la dueña de tu empresa que restablezca tu acceso.",
                    )
                  }
                  className="text-sm font-semibold text-primary hover:underline"
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
    </div>
  );
}

"use client";

import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Mail, Store, User, UserCog } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { NavToggleButton } from "@/components/nav/NavToggleButton";
import { ROLE_LABEL } from "@/components/nav/navConfig";

// AIT-50: pantalla nueva, sin mockup de referencia — decisiones de UI
// documentadas en el export para el auditor. Deliberadamente sobria (el
// brief pide explícitamente que no sea una pantalla de foco visual):
// una sola tarjeta de solo lectura + el botón de cerrar sesión que antes
// vivía suelto solo en Hoy. Nada editable — el brief excluye
// explícitamente "preferencias de perfil" de este alcance.
export default function AjustesPage() {
  const role = useQuery(api.users.getCurrentUserRole);
  const userInfo = useQuery(api.users.getCurrentUserInfo);
  const { signOut } = useAuthActions();

  const loading = role === undefined || userInfo === undefined;

  return (
    <div className="flex min-h-screen flex-col bg-bg font-sans text-text">
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
          <NavToggleButton />
          <h1 className="m-0 text-[15px] font-bold">Ajustes</h1>
        </header>

        <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-4 px-4 pb-16 pt-[18px]">
          {loading ? (
            <p className="text-text-secondary">Cargando…</p>
          ) : (
            <>
              <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-e1)]">
                <InfoRow
                  icon={<User size={16} />}
                  label="Nombre"
                  value={userInfo.name || "—"}
                />
                <InfoRow
                  icon={<Mail size={16} />}
                  label="Email"
                  value={userInfo.email || "—"}
                />
                <InfoRow
                  icon={<UserCog size={16} />}
                  label="Rol"
                  value={role ? (ROLE_LABEL[role] ?? role) : "—"}
                />
                <InfoRow
                  icon={<Store size={16} />}
                  label="Tienda"
                  value={userInfo.storeName || "—"}
                  last
                />
              </section>

              <Button variant="secondary" onClick={() => signOut()}>
                Cerrar sesión
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 ${last ? "" : "border-b border-border"}`}
    >
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-neutral-100 text-text-secondary">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
          {label}
        </div>
        <div className="truncate text-sm font-semibold text-text">{value}</div>
      </div>
    </div>
  );
}

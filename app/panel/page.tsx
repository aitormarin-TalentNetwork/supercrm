"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";

// Stub mínimo — la pantalla real es Fase 5. El guard de rol de aquí abajo
// es solo UX: NO es el control de acceso real. Ese vive en proxy.ts
// (enrutado, ya bloquea a Carlos antes de llegar aquí) y en los helpers
// requireUser/requireOwner dentro de cada función de Convex (datos).
export default function PanelPage() {
  const role = useQuery(api.users.getCurrentUserRole);
  const { signOut } = useAuthActions();
  const router = useRouter();

  if (role === "sales") {
    router.replace("/hoy");
    return null;
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 font-sans">
      <h1 className="text-h1 font-bold text-text">Panel</h1>
      <p className="text-text-secondary">
        Sesión iniciada con rol: <strong>{role ?? "…"}</strong>
      </p>
      <p className="text-sm text-text-muted">Pantalla real pendiente (Fase 5).</p>
      <Button variant="secondary" onClick={() => signOut()}>
        Cerrar sesión
      </Button>
    </main>
  );
}

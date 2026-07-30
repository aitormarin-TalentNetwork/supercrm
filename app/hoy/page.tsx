"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";

// Stub mínimo — la pantalla real es Fase 3. El guard de rol de aquí abajo
// es solo UX (evita que Marta vea el shell de Carlos): NO es el control de
// acceso real, que vive en proxy.ts (enrutado) y en los helpers
// requireUser/requireOwner dentro de cada función de Convex (datos).
export default function HoyPage() {
  const role = useQuery(api.users.getCurrentUserRole);
  const { signOut } = useAuthActions();
  const router = useRouter();

  useEffect(() => {
    if (role === "owner") router.replace("/panel");
  }, [role, router]);

  if (role === "owner") {
    return null;
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 font-sans">
      <h1 className="text-h1 font-bold text-text">Hoy</h1>
      <p className="text-text-secondary">
        Sesión iniciada con rol: <strong>{role ?? "…"}</strong>
      </p>
      <p className="text-sm text-text-muted">Pantalla real pendiente (Fase 3).</p>
      <Button variant="secondary" onClick={() => signOut()}>
        Cerrar sesión
      </Button>
    </main>
  );
}

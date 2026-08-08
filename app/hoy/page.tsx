"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { UserPlus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { AltaRapidaModal } from "@/components/crm/AltaRapidaModal";

// Stub mínimo — la pantalla real es Fase 3. El guard de rol de aquí abajo
// es solo UX (evita que Marta vea el shell de Carlos): NO es el control de
// acceso real, que vive en proxy.ts (enrutado) y en los helpers
// requireUser/requireOwner dentro de cada función de Convex (datos).
//
// El botón de Alta rápida (AIT-10) se engancha aquí porque es el punto de
// origen real del flujo (PRD: "Captar"), aunque el resto de la pantalla
// Hoy todavía no exista.
export default function HoyPage() {
  const role = useQuery(api.users.getCurrentUserRole);
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [altaRapidaOpen, setAltaRapidaOpen] = useState(false);

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
      <Button leftIcon={<UserPlus size={16} />} onClick={() => setAltaRapidaOpen(true)}>
        Alta rápida
      </Button>
      <Button variant="secondary" onClick={() => signOut()}>
        Cerrar sesión
      </Button>
      <AltaRapidaModal
        open={altaRapidaOpen}
        onClose={() => setAltaRapidaOpen(false)}
      />
    </main>
  );
}

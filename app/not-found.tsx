import Link from "next/link";
import { Compass } from "lucide-react";

// AIT-76: sin identidad ni idioma propios, Next.js muestra su 404 de
// fábrica en inglés. "/" ya resuelve el destino correcto (login o pantalla
// de inicio según el rol) vía proxy.ts, así que no hace falta conocer aquí
// el estado de sesión.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-8 bg-bg p-8 font-sans text-text">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#6366F1]" />
        <span className="text-lg font-bold">SuperCRM</span>
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-subtle text-primary">
          <Compass size={26} />
        </span>
        <h1 className="text-h2 font-bold">Página no encontrada</h1>
        <p className="max-w-[360px] text-sm text-text-secondary">
          La dirección a la que has intentado acceder no existe o se ha
          movido.
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex h-11 items-center justify-center rounded-md border border-transparent bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover active:bg-primary-active"
      >
        Volver al inicio
      </Link>
    </main>
  );
}

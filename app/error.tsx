"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

// AIT-76: mismo hueco que not-found.tsx pero para errores en tiempo de
// ejecución — Next.js no tiene una pantalla propia para esto, la
// alternativa es la genérica del navegador ("Application error…", en
// inglés). `error.tsx` es cliente por contrato de Next.js (recibe `reset`).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-8 bg-bg p-8 font-sans text-text">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#6366F1]" />
        <span className="text-lg font-bold">SuperCRM</span>
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-error-subtle text-error">
          <AlertTriangle size={26} />
        </span>
        <h1 className="text-h2 font-bold">Algo ha ido mal</h1>
        <p className="max-w-[360px] text-sm text-text-secondary">
          Ha ocurrido un error inesperado. Puedes intentarlo de nuevo o
          volver al inicio.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center justify-center rounded-md border border-border-strong bg-surface px-4 text-sm font-semibold text-text hover:bg-neutral-100 active:bg-neutral-200"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md border border-transparent bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover active:bg-primary-active"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}

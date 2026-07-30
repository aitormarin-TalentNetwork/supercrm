"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Prueba de humo de la Fase 1 (docs/03-setup.md §5): confirma que Next habla con
// Convex. La sustituye el arranque por rol (Carlos → /hoy, Marta → /panel) en AIT-9.
export default function Home() {
  const stores = useQuery(api.stores.list);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 font-sans">
      <h1 className="text-2xl font-bold">SuperCRM</h1>
      {stores === undefined ? (
        <p className="text-zinc-500">Conectando con Convex…</p>
      ) : (
        <p className="text-zinc-700">
          Convex responde: <strong>{stores.length}</strong>{" "}
          {stores.length === 1 ? "tienda" : "tiendas"} en la base de datos.
        </p>
      )}
    </main>
  );
}

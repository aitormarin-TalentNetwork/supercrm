"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { Mail, ShieldCheck } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";

// AIT-92 (Ola 2) · Sección "Correo" de Ajustes. NO es una pantalla nueva: la
// maqueta (producto/ola-2-email/pantallas/ConexionGmail.dc.html) empieza por
// "Ajustes · Tu cuenta y las conexiones del CRM · Correo", así que va dentro de
// Ajustes y no en una ruta propia.
//
// DOS ESTADOS, no cuatro. "Con retraso" y "desconectada por revocación
// externa" necesitan USAR el token —o sea sincronizar— y eso es AIT-98. Están
// anotados en la maqueta, no recortados de ella.
//
// Y no se pinta "última sincronización hace 2 min": no hay sincronización de la
// que sacar esa marca, y mostrarla derivada de otra cosa sería inventarse el
// dato. Se pinta la FECHA DE CONEXIÓN, que sí existe.

function formatearFecha(ms: number): string {
  return new Date(ms).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ConexionGmail() {
  const estado = useQuery(api.gmail.getConnectionState, {});
  const startConnect = useAction(api.gmail.startConnect);
  const disconnect = useMutation(api.gmail.disconnect);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function alConectar() {
    setError("");
    setOcupado(true);
    try {
      const { url } = await startConnect({});
      window.location.href = url;
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo iniciando la conexión de Gmail:", err);
      }
      // AIT-111: mensaje genérico, nunca `err.message` — el mensaje del
      // servidor se puede LEER para clasificar, no DEVOLVER
      // (docs/01-arquitectura.md §6).
      //
      // Y aquí no hace falta clasificarlo: lo que el usuario necesita saber
      // —QUÉ variable falta y en qué deployment— llega como DATO por
      // `estado.faltan`, y se pinta arriba antes de que pueda pulsar. Este
      // catch solo cubre el fallo en vuelo.
      setError("No se ha podido abrir el consentimiento de Google. Inténtalo de nuevo.");
      setOcupado(false);
    }
  }

  async function alDesconectar(accountId: Id<"gmailAccounts">) {
    setError("");
    setOcupado(true);
    try {
      await disconnect({ accountId });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo desconectando Gmail:", err);
      }
      setError("No se ha podido desconectar. Inténtalo de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-[480px] overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-e1)]">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Mail size={16} className="text-neutral-400" />
        <span className="text-sm font-bold text-text">Correo</span>
      </div>

      <div className="p-4">
        <p className="text-sm text-text-secondary">
          Conecta tu Gmail para que los correos con tus clientes aparezcan en sus
          fichas.
        </p>

        {estado === undefined ? (
          <p className="mt-4 text-sm text-text-secondary">Cargando…</p>
        ) : estado.faltan.length > 0 ? (
          // GATE, y se ve ANTES de pulsar: si el CRM no puede guardar el
          // resultado, no se manda a nadie a Google — darías tu permiso para
          // nada. Nombra la variable y el deployment porque un "no se puede
          // conectar" a secas hace buscar en el sitio equivocado.
          <div className="mt-4 rounded-md bg-warning-subtle px-3 py-3 text-[13px] text-warning">
            <p className="font-semibold">
              Este deployment todavía no puede conectar Gmail.
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {estado.faltan.map((f) => (
                <li key={f.variable}>
                  Falta <code className="font-mono">{f.variable}</code> en el
                  deployment <code className="font-mono">{f.deployment}</code>.
                </li>
              ))}
            </ul>
          </div>
        ) : estado.accounts.length === 0 ? (
          <div className="mt-4">
            <Button disabled={ocupado} onClick={() => void alConectar()}>
              {ocupado ? "Abriendo Google…" : "Conectar mi Gmail"}
            </Button>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col">
            {estado.accounts.map((cuenta) => (
              <li
                key={cuenta.id}
                className="flex flex-wrap items-center gap-3 border-t border-border py-4 first:border-t-0 first:pt-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-text">
                    {cuenta.emailAddress}
                  </div>
                  <div className="mt-1 text-[13px] text-text-secondary">
                    Conectada el {formatearFecha(cuenta.connectedAt)}
                  </div>
                </div>
                <span className="inline-flex flex-none items-center gap-1 rounded-pill bg-success-subtle px-2 py-1 text-[11px] font-bold text-success">
                  Conectada
                </span>
                <Button
                  variant="secondary"
                  disabled={ocupado}
                  onClick={() => void alDesconectar(cuenta.id)}
                >
                  Desconectar
                </Button>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 flex items-start gap-2 text-[13px] text-text-muted">
          <ShieldCheck size={15} className="mt-px flex-none" />
          <span>
            Solo lectura. El CRM no puede modificar ni borrar nada de tu buzón.
            Si desconectas, los correos ya guardados se conservan.
          </span>
        </p>

        {error !== "" && (
          <p className="mt-3 rounded-md bg-error-subtle px-3 py-2 text-[13px] text-error">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

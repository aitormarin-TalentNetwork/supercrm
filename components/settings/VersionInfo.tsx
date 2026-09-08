"use client";

import { useEffect, useState } from "react";

// AIT-79: la versión desplegada, para quien no va a leer una cabecera HTTP ni
// abrir /version a mano. La fuente es la misma que la de la cabecera; esto es
// presentación, no un segundo origen del dato.
//
// No sustituye a /version: esta pantalla exige sesión, y el requisito de la
// issue es que el dato se pueda consultar SIN ella. Quien cubre eso es
// /version, que es público.

type VersionResponse = {
  commitShort: string | null;
  environment: string | null;
};

// Tres estados, no dos. "No hay dato" y "no pude preguntar" son cosas
// distintas, y colapsarlas reproduce en pequeño la confusión que originó la
// issue: no poder distinguir un fallo de una ausencia.
type State =
  | { kind: "loading" }
  | { kind: "ready"; commitShort: string | null; environment: string | null }
  | { kind: "unreachable" };

export function VersionInfo() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    // no-store: sin esto, el navegador podría servir una respuesta cacheada y
    // esta pantalla mostraría con confianza el commit de un despliegue
    // anterior — el mismo fallo que la issue prohíbe, colado por la capa de
    // presentación.
    fetch("/version", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<VersionResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        setState({
          kind: "ready",
          commitShort: data.commitShort,
          environment: data.environment,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "unreachable" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-[480px] text-center text-xs text-text-muted">
      {state.kind === "loading" && <span>Comprobando versión…</span>}

      {state.kind === "unreachable" && (
        <span>No se pudo consultar la versión desplegada.</span>
      )}

      {state.kind === "ready" &&
        (state.commitShort ? (
          <span>
            Versión desplegada:{" "}
            <code className="font-mono">{state.commitShort}</code>
            {state.environment ? ` · ${state.environment}` : null}
          </span>
        ) : (
          <span>Versión desplegada: no disponible.</span>
        ))}
    </div>
  );
}

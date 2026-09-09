"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Toast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { checkVersion, type VersionResult } from "./versionCheck";
import { FETCH_GATE_HOOK } from "./fetchGateBootstrap";

// AIT-83: si entra un despliegue con la pestaña abierta, sus server actions
// fallan EN SILENCIO — Next lanza `UnrecognizedActionError` y en pantalla no
// ocurre nada (verificado en
// node_modules/next/dist/.../server-action-reducer.js:76-82: lee la cabecera
// `x-nextjs-action-not-found` y lanza; NO recarga ni navega).
//
// Esto NO arregla ese desajuste: hace que el usuario se entere ANTES de que le
// muerda, y le deja recargar cuando le venga bien. Y no es un problema de
// seguridad — el fallo cae del lado seguro: al recargar, la sesión SÍ estaba
// cerrada. El servidor hizo su trabajo; lo que falló fue el acuse de recibo.

/** Cabecera que Next pone en TODA server action del App Router
 *  (`app-router-headers.js:104`, `ACTION_HEADER`). Es el punto común que
 *  permite interceptar sin tocar ni una acción. */
const ACTION_HEADER = "next-action";

/** El envoltorio de `fetch` ya está instalado por el script del <head>
 *  (`fetchGateBootstrap.ts`). Aquí solo se enchufa el enganche que decide.
 *  Instalación única: es estado global, no puede depender de cuántas veces se
 *  monte un componente. */
let gateInstalled = false;

type FetchGate = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response> | null;

declare global {
  interface Window {
    [FETCH_GATE_HOOK]?: FetchGate;
    __supercrmOriginalFetch?: typeof fetch;
  }
}

function headersHaveAction(headers: HeadersInit): boolean {
  if (headers instanceof Headers) return headers.has(ACTION_HEADER);
  if (Array.isArray(headers)) {
    return headers.some(([key]) => key.toLowerCase() === ACTION_HEADER);
  }
  return Object.keys(headers).some((key) => key.toLowerCase() === ACTION_HEADER);
}

/** La cabecera puede venir en `init.headers` o dentro de un `Request` ya
 *  construido: hay que mirar en los dos sitios. Leer `Request.headers` no
 *  consume su cuerpo. */
function isServerAction(input: RequestInfo | URL, init?: RequestInit): boolean {
  if (init?.headers && headersHaveAction(init.headers)) return true;
  if (typeof Request !== "undefined" && input instanceof Request) {
    return input.headers.has(ACTION_HEADER);
  }
  return false;
}

export function NewVersionNotice({
  loadedCommit,
}: {
  loadedCommit: string | null;
}) {
  const [staleCommit, setStaleCommit] = useState<string | null>(null);
  // No volver a avisar del mismo commit una vez cerrado: insistir enseña al
  // usuario a ignorar el aviso, que es la forma de perder la funcionalidad
  // entera sin que nadie lo note.
  const dismissedRef = useRef<string | null>(null);

  const applyResult = useCallback((result: VersionResult) => {
    if (result.kind !== "changed") return;
    if (dismissedRef.current === result.commit) return;
    setStaleCommit(result.commit);
  }, []);

  useEffect(() => {
    // Sin referencia con la que comparar no hay nada que hacer: ni envoltorio
    // ni listeners. Es el modo degradado de AIT-79 (`commit: null` cuando
    // Railway no entrega el SHA) y tiene que ser inerte, no ruidoso.
    if (loadedCommit === null) return;

    // --- Disparadores OPORTUNISTAS -------------------------------------
    // Adelantan el aviso a un momento cómodo. Pueden quedar suprimidos por el
    // límite de frecuencia sin romper nada: lo que garantiza la cobertura es
    // el preflight de abajo.
    const opportunisticCheck = () => {
      void checkVersion(loadedCommit, { mandatory: false }).then(applyResult);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") opportunisticCheck();
    };
    // `visibilitychange` no identifica por sí solo todas las restauraciones
    // desde bfcache, que son justo el caso de pestaña más vieja posible.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) opportunisticCheck();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);

    // --- Preflight OBLIGATORIO -----------------------------------------
    // El envoltorio vive en el <head> (ver fetchGateBootstrap.ts: Next captura
    // su referencia a `fetch` antes de la hidratación, así que sustituirlo aquí
    // llegaba tarde y la server action real pasaba de largo). Lo único que se
    // hace desde React es enchufar la decisión.
    let removeGate: (() => void) | undefined;
    if (!gateInstalled) {
      const gate: FetchGate = (input, init) => {
        // Devolver null = no me la quedo, que siga su curso normal. Todo lo que
        // no sea una server action pasa intacto.
        if (!isServerAction(input, init)) return null;
        return (async () => {
          // `mandatory: true`: nunca suprimido por el límite temporal y nunca
          // reutiliza un resultado ya resuelto. Puede esperar a una consulta en
          // vuelo — eso es esperar la misma respuesta, no dar por buena una
          // autorización almacenada.
          const result = await checkVersion(loadedCommit, { mandatory: true });
          if (result.kind === "changed") {
            applyResult(result);
            // No se envía: la acción iba a fallar igualmente, y ahora al menos
            // el usuario sabe por qué. Rechazar deja la promesa rechazada igual
            // que hace el propio Next con `UnrecognizedActionError`, sin
            // recargar ni navegar (verificado en server-action-reducer.js).
            throw new Error(
              "SuperCRM: hay una versión nueva desplegada; recarga la página para continuar.",
            );
          }
          // `same` y también `unknown` (timeout, no-2xx, JSON inválido,
          // `commit: null`): la acción SE ENVÍA. Decisión deliberada de
          // fail-open — convertir una caída de /version en la indisponibilidad
          // de todas las escrituras sería un daño mayor y más seguro que el que
          // esta tarea previene.
          const originalFetch = window.__supercrmOriginalFetch ?? fetch;
          return originalFetch(input, init);
        })();
      };

      window[FETCH_GATE_HOOK] = gate;
      gateInstalled = true;
      removeGate = () => {
        // Solo se retira si el enganche SIGUE siendo el nuestro: si otro código
        // lo sustituyó después, borrarlo se llevaría por delante el suyo. Ese
        // fallo no rompería nada nuestro — rompería lo de otro, en silencio.
        if (window[FETCH_GATE_HOOK] === gate) {
          delete window[FETCH_GATE_HOOK];
        }
        gateInstalled = false;
      };
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      removeGate?.();
    };
  }, [loadedCommit, applyResult]);

  if (staleCommit === null) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Toast
        variant="info"
        title="Hay una versión nueva de SuperCRM"
        message="Esta pestaña se abrió con una versión anterior. Recarga para seguir trabajando con normalidad."
        action={
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Recargar
          </Button>
        }
        onClose={() => {
          dismissedRef.current = staleCommit;
          setStaleCommit(null);
        }}
      />
    </div>
  );
}

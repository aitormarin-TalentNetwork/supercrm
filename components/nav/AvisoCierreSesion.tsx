"use client";

import { Toast } from "@/components/ui/Toast";
import { useNav } from "./NavContext";

// AIT-127 (ronda 4, M3 y M6): lo único que el usuario puede leer mientras un
// cierre de sesión está en vuelo, y lo único que sobrevive a su fallo.
//
// POR QUÉ VIVE EN EL LAYOUT Y NO EN LAS PANTALLAS. Durante el cierre, la
// pantalla activa y el panel se sacan de alcance con `inert` — es el criterio
// C2a: cero controles alcanzables. Un aviso pintado dentro de cualquiera de
// los dos quedaría fuera del árbol de accesibilidad justo cuando tiene algo
// que anunciar. Montado aquí, es hermano de lo que se bloquea, no hijo.
// Efecto secundario que buscábamos: los dos avisos duplicados que había en
// AppNav y en /ajustes pasan a ser uno.
//
// ⚠️ NO LLEVA `onClose` NI ACCIÓN, Y ES DELIBERADO. Cualquier botón aquí sería
// un control alcanzable durante la ventana, o sea un rojo de C2a — y con razón:
// el criterio dice CERO, no "cero salvo los míos". El reintento no necesita
// botón propio: al soltarse el bloqueo, "Cerrar sesión" vuelve a estar vivo.
//
// 🔴 EL TEXTO DEL FALLO NO AFIRMA QUE LA SESIÓN SIGA ABIERTA (M6). El cierre
// se abandona con `AbortController` al vencer el límite, y abortar NO informa
// de si el servidor llegó a procesar la petición: puede haberse cerrado y no
// haber llegado la respuesta. Decir "sigue abierta" era afirmar un estado del
// servidor que el código reconoce no conocer — mi propio razonamiento estaba
// escrito y el texto se había quedado una versión por detrás.
export function AvisoCierreSesion() {
  const { cerrandoSesion, errorCierre } = useNav();

  if (cerrandoSesion !== null) {
    return (
      <div className="fixed bottom-4 right-4 z-[80]">
        <Toast variant="info" message="Cerrando sesión…" />
      </div>
    );
  }

  if (!errorCierre) return null;

  return (
    // `role="alert"` y no el `role="status"` que trae Toast: esto es un error
    // que el usuario tiene que notar, no un progreso. Localizable por rol,
    // que es la convención de este proyecto (nada de data-testid).
    <div role="alert" className="fixed bottom-4 right-4 z-[80]">
      <Toast
        variant="error"
        title="No se ha podido confirmar el cierre de sesión"
        message="Puede que se haya cerrado y puede que no. Vuelve a pulsar «Cerrar sesión» para asegurarte."
      />
    </div>
  );
}

// AIT-57: la Push API pide la clave pública VAPID como un `Uint8Array`
// (`applicationServerKey`), no como el string base64url que exponen
// `web-push`/`NEXT_PUBLIC_VAPID_PUBLIC_KEY` — conversión estándar de la
// documentación de la Push API (no hay forma más corta con las APIs del
// navegador).
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  // Tipado explícito con un ArrayBuffer propio (no el genérico
  // ArrayBufferLike que infiere `new Uint8Array(length)` con esta versión
  // de TS): la Push API exige `BufferSource`, que no admite
  // SharedArrayBuffer, uno de los tipos que cubre ArrayBufferLike.
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

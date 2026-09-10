// AIT-92 · Las decisiones del flujo de OAuth, separadas de la maquinaria de
// Convex para que se puedan EJERCITAR sin deployment y sin Google.
//
// Están aquí y no dentro de la mutation/httpAction por una razón concreta: los
// contratos de seguridad de esta ficha (consumo único del `state`, caducidad,
// no escribir sin refresh token, unicidad impuesta por la escritura) tienen que
// tener criterios que puedan FALLAR. Una propiedad descrita y una propiedad
// falsable se parecen mucho en el papel y solo una se puede incumplir.
//
// ⚠️ Y las llama el código real (`convex/gmail.ts`, `convex/http.ts`), no una
// copia: una copia puede divergir del original sin que nada chirríe, y entonces
// el verde sería sobre un código que no se publica.

export type FilaState = {
  userId: string;
  expiresAt: number;
  consumedAt?: number;
};

export type VeredictoState =
  | { ok: true; userId: string }
  | { ok: false; motivo: "desconocido" | "ya usado" | "caducado" };

/** Un `state` vale UNA vez, mientras no caduque. Firmado y no reutilizable son
 *  propiedades distintas: un `state` firmado pero eterno permite vincular un
 *  buzón ajeno reenviando el flujo. */
export function validarState(
  fila: FilaState | null,
  ahora: number,
): VeredictoState {
  if (fila === null) return { ok: false, motivo: "desconocido" };
  if (fila.consumedAt !== undefined) return { ok: false, motivo: "ya usado" };
  if (fila.expiresAt < ahora) return { ok: false, motivo: "caducado" };
  return { ok: true, userId: fila.userId };
}

export type RespuestaDeCanje = {
  access_token?: string;
  refresh_token?: string;
};

/** Sin token de refresco NO se escribe. Guardar solo el access token sería una
 *  conexión que caduca en una hora y que la pantalla presentaría como
 *  conectada. */
export type DecisionDeEscritura =
  | { escribir: true; refreshToken: string; accessToken: string }
  | { escribir: false; motivo: "sin token de refresco" | "sin token de acceso" };

export function debeEscribirse(tokens: RespuestaDeCanje): DecisionDeEscritura {
  if (!tokens.refresh_token)
    return { escribir: false, motivo: "sin token de refresco" };
  if (!tokens.access_token)
    return { escribir: false, motivo: "sin token de acceso" };
  return {
    escribir: true,
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token,
  };
}

/** La unicidad la impone la ESCRITURA, no el índice: Convex admite varias filas
 *  con la misma clave de índice, así que hay que consultar y reutilizar dentro
 *  de la misma transacción. Devuelve el desenlace, que es el observable de que
 *  un segundo flujo llegó a escribir. */
export function resolverUpsert(
  existente: { writeCount: number } | null,
): { desenlace: "creada" | "reutilizada"; writeCount: number } {
  if (existente === null) return { desenlace: "creada", writeCount: 1 };
  return { desenlace: "reutilizada", writeCount: existente.writeCount + 1 };
}

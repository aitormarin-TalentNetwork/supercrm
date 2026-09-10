/** AIT-134 · Los TRES estados del acceso a una ruta protegida.
 *
 * 🔴 QUÉ ARREGLA, Y ERA UN DEFECTO MÍO DE AIT-127: el predicado anterior era
 * `destino.includes("/login")`, que acepta **una URL con `/login` en el query** y
 * **un destino de OTRO ORIGEN terminado en `/login`**. Y era binario, así que
 * metía en el mismo saco *"me dejó entrar"* y *"pasó algo raro"*.
 * **"No es la denegación esperada" NO implica "el servidor deja entrar."**
 *
 * ⚠️ ENDURECERLO NO ES NEUTRO, y la dirección no es propiedad del cambio: es del
 * cambio Y de la expectativa que consume su resultado.
 *
 * ⛔ UNA VERSIÓN ANTERIOR DE ESTE COMENTARIO AFIRMÓ QUE los que CUENTAN entradas
 * "se vuelven más exigentes -> hacia el rojo". **Lo medí después y es al revés.**
 * Lo dejo citado en pasado porque el error estaba dentro del bloque que explica
 * esta misma lección.
 *
 * 🔴 LO CIERTO: LOS CUATRO CONSUMIDORES IBAN HACIA EL VERDE, por DOS mecanismos:
 *   · los que esperaban `true` **pasan más fácil** — un control que pasa más
 *     fácil discrimina menos, y discriminar es su único trabajo;
 *   · los que CUENTAN **pierden el caso**: un `ANOMALO` deja de contar como
 *     entrada y **desaparece del recuento** en vez de contar.
 *
 * 🔑 **Un test que se ablanda no se pone rojo: se queda verde discriminando
 * menos.** Por eso se cierra por PARTICIÓN y no por lista: cada respuesta cae en
 * uno y sólo uno de los tres, sin resto por donde algo desaparezca.
 *
 * ⚠️ VIVE EN SU PROPIO FICHERO Y ES PURA A PROPÓSITO. Mi primer control de este
 * predicado era un test e2e que interceptaba con `page.route()` una llamada de
 * `page.request.get()` — **canales distintos**, así que el señuelo no se aplicaba
 * y el control **habría dado verde con el predicado roto**. Sin servidor no hay
 * dos canales que confundir.
 */
export type EstadoAcceso =
  | "ACCESO_CONFIRMADO"
  | "DENEGACION_ESPERADA"
  | "ANOMALO";

export function clasificarRespuesta(
  codigo: number,
  cabeceraLocation: string,
  urlDeLaRespuesta: string,
): EstadoAcceso {
  if (codigo >= 300 && codigo < 400) {
    let origen: string;
    try {
      origen = new URL(urlDeLaRespuesta).origin;
    } catch {
      return "ANOMALO";
    }
    let destino: URL;
    try {
      destino = new URL(cabeceraLocation, origen);
    } catch {
      return "ANOMALO";
    }
    // `pathname` EXACTO y MISMO ORIGEN. Ni `includes`, ni query, ni fragmento.
    return destino.origin === origen && destino.pathname === "/login"
      ? "DENEGACION_ESPERADA"
      : "ANOMALO";
  }
  if (codigo === 200) return "ACCESO_CONFIRMADO";
  return "ANOMALO";
}

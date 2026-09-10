#!/bin/bash
# Reclamar y liberar un cerrojo de turno, con las DOS mitades comprobando.
#
# USO:
#   ./_cerrojo.sh reclama <convex|raiz> "<quien>" "<que hago>"   -> exit 0 si es tuyo
#   ./_cerrojo.sh libera  <convex|raiz> "<quien>"                -> exit 0 si lo soltaste
#   ./_cerrojo.sh mira    <convex|raiz>                          -> imprime el titular
#
# ============================================================================
# POR QUE EXISTE (2026-09-10 07:0xZ)
# ----------------------------------------------------------------------------
# La disciplina del cerrojo vivia en comandos sueltos que cada rol escribia a
# mano, y ahi tenia un agujero asimetrico que nadie habia mirado:
#
#   RECLAMAR usaba `mkdir`, que **impide**: falla si el directorio ya existe.
#   LIBERAR usaba `rmdir` a secas, que **no comprueba nada**: borra y confia.
#
# 🔴 Y LA MITAD SIN CONTROL ES LA PELIGROSA: **liberar el cerrojo de otro no da
# error — da via libre a un tercero mientras el dueño sigue escribiendo.**
# Falla hacia HACER y en silencio. La de entrada, si falla, solo te hace esperar.
#
# El mismo turno en que se escribio esto, otra sesion empujo a `main` con un
# cerrojo ajeno puesto porque su comprobacion **imprimia el titular y empujaba
# igual**: la comprobacion estaba encadenada a la accion, no a su resultado.
# Su formulacion, que es la razon de este fichero:
#   **"Cruzarte con la evidencia no basta si el paso no PUEDE PARARTE.
#     Un control que informa y uno que impide se parecen mucho en el guion y
#     no se parecen en nada en el efecto."**
# La pregunta que lo distingue, y se contesta en cinco segundos:
#   **¿este paso puede DETENER la accion, o solo puede DESCRIBIRLA?**
#
# ⚠️ POR QUE `if` Y NO `||`: un `rmdir ... || echo "liberado"` imprime el mensaje
# de exito JUSTO CUANDO HA FALLADO. Ya ocurrio en esta fabrica: un comando
# imprimio "verificado por efecto: ya no existe" **porque el borrado habia
# fallado**. Arreglar la liberacion con `||` cambia un agujero por el otro.
# Aqui todo va en `if`, y el resultado se verifica POR EFECTO al final.
# ============================================================================

set -u
RAIZ="${CERROJO_RAIZ:-/Users/aitor/Documents/curro + proyectos/Talent Land/Sistemas/CRM curso Vibe Coding}"
ACCION="${1:-}"; CUAL="${2:-}"; QUIEN="${3:-}"; QUEHAGO="${4:-}"

case "$CUAL" in
  convex) LOCK="$RAIZ/Sorfware Factory/_turno-convex.lock"; LOG="$RAIZ/Sorfware Factory/_turno-convex.log"; ALCANCE="convex" ;;
  raiz)   LOCK="$RAIZ/Sorfware Factory/_turno-raiz.lock";   LOG="$RAIZ/Sorfware Factory/_turno-raiz.log";   ALCANCE="checkout-raiz" ;;
  *) echo "INDETERMINADO: falta el cerrojo (convex|raiz). No se ha hecho nada."; exit 2 ;;
esac

TS=$(date -u '+%Y-%m-%d %H:%M:%SZ')   # medido en esta misma tirada, nunca compuesto

case "$ACCION" in
  mira)
    if [ -d "$LOCK" ]; then echo "TOMADO:"; cat "$LOCK/titular.txt" 2>/dev/null || echo "  (sin titular.txt — reclamacion en vuelo o cerrojo corrupto)"; exit 1
    else echo "LIBRE"; exit 0; fi ;;

  reclama)
    [ -n "$QUIEN" ] || { echo "INDETERMINADO: falta quien reclama."; exit 2; }
    if mkdir "$LOCK" 2>/dev/null; then
      printf '%s | TOMA %s\nAlcance: %s\nQue hago: %s\n' "$QUIEN" "$TS" "$ALCANCE" "$QUEHAGO" > "$LOCK/titular.txt"
      printf '%s | %s | RECLAMA | ALCANCE: %s | %s\n' "$TS" "$QUIEN" "$ALCANCE" "$QUEHAGO" >> "$LOG"
      # VERIFICACION POR EFECTO, no por exit code del mkdir:
      if [ -f "$LOCK/titular.txt" ] && grep -qF "$QUIEN" "$LOCK/titular.txt"; then
        echo "RECLAMADO $TS — es tuyo"; exit 0
      fi
      # Limpio lo que acabo de crear: si me niego a usarlo, no puedo dejarlo bloqueando a todos.
      rm -f "$LOCK/titular.txt"; rmdir "$LOCK" 2>/dev/null
      if [ -d "$LOCK" ]; then echo "🔴 INDETERMINADO Y ADEMAS NO PUDE LIMPIARLO: hay un cerrojo mio colgado. AVISA."; else echo "🔴 INDETERMINADO: el titular no me devuelve mi nombre. NO lo uses. Cerrojo retirado, no queda colgado."; fi
      exit 2
    fi
    echo "OCUPADO — NO es tuyo. Titular:"; cat "$LOCK/titular.txt" 2>/dev/null | sed 's/^/  /'; exit 1 ;;

  libera)
    [ -n "$QUIEN" ] || { echo "INDETERMINADO: falta quien libera."; exit 2; }
    if [ ! -d "$LOCK" ]; then echo "🔴 INDETERMINADO: el cerrojo NO existe. O ya lo soltaste, o lo solto otro. NO cuenta como liberacion tuya."; exit 2; fi
    if [ ! -f "$LOCK/titular.txt" ]; then echo "🔴 NO LIBERO: hay cerrojo sin titular.txt. Puede ser una reclamacion en vuelo de otro. Avisa en vez de borrar."; exit 1; fi
    if ! grep -qF "$QUIEN" "$LOCK/titular.txt"; then
      echo "🔴 NO LIBERO: el cerrojo NO ES TUYO. Titular:"; sed 's/^/  /' "$LOCK/titular.txt"; exit 1
    fi
    rm -f "$LOCK/titular.txt"; rmdir "$LOCK" 2>/dev/null
    # VERIFICACION POR EFECTO — nunca `|| echo liberado`, que imprime exito al fallar:
    if [ -d "$LOCK" ]; then echo "🔴 NO SE LIBERO: el directorio sigue existiendo."; exit 1; fi
    printf '%s | %s | LIBERA | ALCANCE: %s |\n' "$TS" "$QUIEN" "$ALCANCE" >> "$LOG"
    echo "LIBERADO $TS — verificado por efecto: el directorio ya no existe"; exit 0 ;;

  *) echo "INDETERMINADO: accion desconocida ('$ACCION'). Usa reclama|libera|mira."; exit 2 ;;
esac

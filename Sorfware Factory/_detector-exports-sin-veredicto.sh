#!/bin/bash

# --- CENSO DE SECCIONES, EN UN `trap` Y NO EN CADA SALIDA -------------------
# 🔑 POR QUE UN TRAP Y NO UNA COPIA POR SALIDA (2026-09-10, a peticion del
# Factory Architect): el defecto que estamos cerrando es que **un bloque detras
# de un `exit` NO FALLA: NO EXISTE**, y su ausencia se lee igual que "no hay nada
# que reportar". Poner el contador a mano en cada salida repite ese mismo error:
# **la salida que alguien anada manana no lo llevaria**, y volveria a morir en
# silencio. El trap se ejecuta en TODAS, incluidas las que aun no existen.
TOTAL_SECCIONES=3
censo_de_secciones() {
  echo "secciones ejecutadas: ${SECCIONES:-0} de $TOTAL_SECCIONES"
  if [ "${SECCIONES:-0}" -lt "$TOTAL_SECCIONES" ]; then
    echo "  🔴 FALTAN SECCIONES POR EJECUTAR — no han fallado: NO SE HAN EJECUTADO."
    echo "     Ocurrio de verdad: la seccion de NO-GO sin reaccion estuvo 6 h sin correr,"
    echo "     apagada EXACTAMENTE cuando habia huerfanos, que es cuando hacia falta."
  fi
}
trap censo_de_secciones EXIT

# Detector de exports que llevan tiempo esperando un veredicto del auditor.
#
# POR QUE EXISTE (2026-09-10, decision del CEO tras un hallazgo del PM):
# En una sola noche apareceron DOS exports olvidados —el plan-loop3 de AIT-114 (exportado
# 17 h antes) y el loop2 de AIT-109—, y los dos se encontraron POR CASUALIDAD, mirando otra
# cosa. Eso no es mala suerte dos veces: **no hay nada que grite cuando un export lleva
# horas sin veredicto**. El coste lo paga producto: tres rondas de auditoria sobre una
# opcion que el PM ya habia descartado.
#
# EL MODO DE FALLO QUE CUBRE, y es de los que no avisan: un export sin disparar y un export
# en curso se ven EXACTAMENTE IGUAL en un `ls`. El silencio del auditor no distingue "aun no
# ha terminado" de "nadie le pidio nada".
#
# COMO SE USA:
#   ./_detector-exports-sin-veredicto.sh [minutos_umbral]   (por defecto 60)
# Salida: una linea por export sin veredicto, con su antiguedad en minutos.
# Codigos de salida — SON CUATRO, y el 3 existe para no mentir en verde:
#   0 = ninguno pendiente y todos se pudieron juzgar. **El unico verde limpio.**
#   1 = hay export(es) por encima del umbral sin fichero de veredicto.
#   2 = INDETERMINADO total: no se pudo mirar (directorio ausente, cero exports, cero
#       veredictos). NO es "todo bien": es que no se midio.
#   3 = ninguno pendiente **de los que se pudieron juzgar**, pero alguno quedo sin juzgar.
#       Verde parcial: el verde NO cubre esos. Hay que mirarlos a mano.
#
# 🔴 LO QUE ESTE DETECTOR **NO** SABE, y es lo primero que hay que leer:
# **Mide la antiguedad de un FICHERO, y de ahi NO se deduce el estado de su TAREA.**
# Un export viejo sin veredicto es compatible con AL MENOS CUATRO historias distintas, y
# las cuatro se ven EXACTAMENTE IGUAL en un `ls -lt`:
#   1. nadie lo atendio                    -> hay que dispararlo
#   2. esta fuera de alcance               -> no se toca, se marca
#   3. la tarea se cerro por otra via      -> no se toca, ya esta hecha
#   4. **la tarea AVANZA en Linear sin que el export se mueva** -> viva, y el fichero no lo
#      refleja porque su trabajo no es codigo
# **"AL MENOS cuatro" es literal: el CEO enumero tres y el Factory Architect encontro la
# cuarta en diez minutos. No hay razon para creer que sean cuatro.** Un proxy barato no
# sabe cuantas historias compatibles tiene.
#
# INCIDENTE REAL (2026-09-10), y tiene DOS fallos superpuestos, no uno:
#   (a) ESTADO: el CEO escalo "AIT-83, 26 h parada, o la disparas o la declaras abandonada".
#       Las dos salidas eran falsas: AIT-83 estaba **DONE** desde 2026-09-09T00:42:40Z.
#   (b) SUJETO: ademas, **AIT-83 en Linear no es lo que decia el nombre del fichero.** El
#       fichero se llama `T2_AIT-83_fix-arnes-e2e_...`, pero la ficha AIT-83 es "Una pestaña
#       abierta durante un despliegue queda rota sin avisar" (Low, Post-MVP). El export lo
#       dice de si mismo en su cabecera: es la *correccion del arnes* DE AIT-83, con "ficha
#       de Linear propia, pedida al PM". **Lleva en el nombre el numero de OTRA ficha.**
# 🔴 CONSECUENCIA QUE IMPORTA MAS QUE EL INCIDENTE: consultar Linear arregla (a) pero NO
# arregla (b). Si el identificador del fichero no es el de su tarea, la consulta a Linear
# devuelve el estado **de otra cosa** — y devuelve algo, no un error. La comprobacion cruzada
# falla en la direccion tranquilizadora.
# **EL ESTADO DE UNA TAREA SE CONSULTA EN LINEAR, SIEMPRE — y antes hay que comprobar que el
# numero del fichero es de verdad el suyo, leyendo su cabecera.** Este script no hace ni lo
# uno ni lo otro, y no puede: por eso lo dice en su propia salida.
#
# ⚠️ LEE ESTO ANTES DE FIARTE DEL RESULTADO — la primera version de este detector MINTIO.
# Daba 8 huerfanos cuando habia 3: derivaba mal el nombre del veredicto desde el del export
# (un `sed` con grupos que no casaban) y marcaba como huerfanos ficheros cuyo veredicto
# estaba en el mismo directorio. Se cazo porque un `ls` ordenado por mtime, impreso justo
# antes, los mostraba. Por eso este script IMPRIME SIEMPRE el nombre del veredicto que
# buscaba: para que un falso positivo se pueda refutar sin releer el codigo.

set -u

UMBRAL="${1:-60}"
# EXPORTS_DIR permite apuntarlo a otro sitio para PROBARLO. Sin el, mira al de siempre,
# relativo a donde vive el script (que es `Sorfware Factory/`).
DIR="${EXPORTS_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/codigo para auditar}"

if [ ! -d "$DIR" ]; then
  # Nunca "OK" cuando no se pudo mirar: un cero sin haber mirado es un falso verde.
  echo "INDETERMINADO: no existe el directorio '$DIR'. No se ha comprobado nada."
  exit 2
fi

cd "$DIR" || { echo "INDETERMINADO: no se pudo entrar en '$DIR'."; exit 2; }

shopt -s nullglob
EXPORTS=(*para-auditor.txt)

if [ ${#EXPORTS[@]} -eq 0 ]; then
  echo "INDETERMINADO: cero exports encontrados. Revisa el patron o el directorio."
  exit 2
fi

AHORA=$(date +%s)
PENDIENTES=0
COMPROBADOS=0
INDET=0

for f in "${EXPORTS[@]}"; do
  term=$(echo "$f" | grep -oE '^T[0-9]+')
  ait=$(echo "$f"  | grep -oE 'AIT-[0-9]+')
  loop=$(echo "$f" | grep -oE '(plan-)?loop[0-9]+')

  # Si no se puede derivar la clave, se DICE — y va a su PROPIO contador.
  # ⚠️ ANTES esto sumaba a PENDIENTES, y el resumen acababa afirmando "N exports SIN
  # FICHERO DE VEREDICTO" incluyendo ficheros que **si tenian veredicto** y que el script
  # simplemente no supo emparejar. Caso real (2026-09-10 04:23Z):
  # `T3_authstate-comentario-falso_plan-loop1-para-auditor.txt` no lleva numero de ficha
  # (se declara "SIN ISSUE DE LINEAR", cambio suelto), asi que el patron no casaba — pero
  # `VEREDICTO_T3_authstate-comentario-falso_plan-loop1.txt` existia. El detector dijo la
  # verdad linea a linea ("no pude derivar") y **mintio en el total**.
  # LA REGLA: "no pude juzgarlo" y "no tiene veredicto" son estados DISTINTOS y no se
  # suman. Fundirlos convierte una declaracion de ignorancia en una acusacion.
  if [ -z "$term" ] || [ -z "$ait" ] || [ -z "$loop" ]; then
    echo "INDETERMINADO: no pude derivar terminal/issue/loop de '$f'. NO se juzga (puede tener veredicto o no)."
    INDET=$((INDET + 1))
    continue
  fi

  COMPROBADOS=$((COMPROBADOS + 1))
  cand="VEREDICTO_${term}_${ait}_${loop}.txt"
  edad=$(( (AHORA - $(stat -f %m "$f")) / 60 ))

  if [ ! -f "$cand" ] && [ "$edad" -ge "$UMBRAL" ]; then
    echo "SIN VEREDICTO (${edad} min) · $term $ait $loop · export: $f · buscaba: $cand"
    PENDIENTES=$((PENDIENTES + 1))
  fi
done

# CONTROL POSITIVO OBLIGATORIO: el detector tiene que demostrar que sabe encontrar un
# veredicto cuando existe. Sin esto, un "0 pendientes" no distingue "todo auditado" de
# "el patron no casa con nada".

SECCIONES=0   # cuantas secciones han LLEGADO A EJECUTARSE (ver nota de las salidas)
VEREDICTOS=(VEREDICTO_*.txt)
SECCIONES=$((SECCIONES+1))
echo "---"
echo "exports comprobados: $COMPROBADOS · no juzgados (INDETERMINADO): $INDET · veredictos visibles: ${#VEREDICTOS[@]} (control positivo: si esto es 0, el detector NO esta discriminando)"

if [ ${#VEREDICTOS[@]} -eq 0 ]; then
  echo "INDETERMINADO: no veo NINGUN fichero de veredicto. El cero de arriba no es fiable."
  exit 2
fi

# --- LA PREGUNTA SIMETRICA: ¿hay veredicto PRODUCIDO pero NO ENTREGADO? -------
# Diseno del Factory Architect (2026-09-10 12:0xZ), tras un veredicto que estuvo
# 3h12m en disco sin relayar y provoco que se aparcara una ficha que estaba A UN
# HALLAZGO DEL GO.
#
# 🔑 POR QUE ESTO CIERRA UN FALSO VERDE Y NO ES UN CONTROL MAS: hasta hoy lo que se
# medía era la EXISTENCIA del fichero — y existir es exactamente lo que hace un
# veredicto sin relayar. Los dos instrumentos (este detector y el barrido de la
# Directora) lo daban por resuelto PORQUE EL FICHERO ESTABA AHI. Con la marca,
# **"producido" y "entregado" dejan de tener el mismo observable.**
#
# LA MARCA: quien relaya anexa al veredicto una linea `RELAYADO <hora UTC> a <quien>`.
#
# ⚠️ VENTANA DE ARRANQUE, y es mia no del diseno: los 63 veredictos anteriores a esta
# regla NO tienen marca y NO son incumplimientos. Sin este corte, el control gritaria
# 63 rojos en su primera corrida — que es la definicion de un control que se aprende
# a ignorar (la regla del propio Factory Architect: uno que grita con el sistema sano
# no protege, gasta). Solo se juzgan los veredictos POSTERIORES a VIGENTE_DESDE.
# ⚠️ CONDICION DEL FACTORY ARCHITECT PARA QUE EL CORTE NO SE VUELVA PERMANENTE:
# en cuanto exista UN veredicto posterior al corte, este control tiene que
# DISCRIMINAR de verdad y dejar de declarar "aun no puedo". **Si a las 24 h sigue
# diciendo "aun no puedo", es que la marca RELAYADO no se esta poniendo — y eso es
# otro falso verde, no un control joven.** Revisar el 2026-09-11 despues de las 12:10Z.
VIGENTE_DESDE="2026-09-10T12:10:11Z"
VD=$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$VIGENTE_DESDE" +%s 2>/dev/null || echo 0)
SECCIONES=$((SECCIONES+1))
echo "---"
echo "veredictos PRODUCIDOS pero NO RELAYADOS (regla vigente desde $VIGENTE_DESDE):"
SIN_MARCA=0; JUZGADOS=0
for V in VEREDICTO_*.txt; do
  [ -e "$V" ] || continue
  M=$(stat -f %m "$V" 2>/dev/null) || continue
  [ "$M" -le "$VD" ] && continue          # anterior a la regla: no se juzga
  JUZGADOS=$((JUZGADOS+1))
  MIN=$(( ($(date -u +%s) - M) / 60 ))
  [ "$MIN" -lt "$UMBRAL" ] && continue
  if ! /usr/bin/grep -q "^RELAYADO " "$V"; then
    SIN_MARCA=$((SIN_MARCA+1))
    echo "  🔴 SIN RELAYAR ($MIN min) · $V"
  fi
done
if [ "$JUZGADOS" = "0" ]; then
  echo "  (ninguno posterior a la regla todavia — el control aun no puede discriminar)"
elif [ "$SIN_MARCA" = "0" ]; then
  echo "  ok: los $JUZGADOS veredictos posteriores a la regla estan relayados o dentro del umbral"
fi
echo "  🔴 UN VEREDICTO SIN RELAYAR ES INDISTINGUIBLE DE UNO QUE AUN NO HA SALIDO."
echo "     Por eso se marca en el propio fichero: el mensaje se pierde, el disco no."

# ============================================================================
# LA HUERFANA EN LA OTRA DIRECCION: un veredicto ENTREGADO que nadie relayo.
# ----------------------------------------------------------------------------
# POR QUE EXISTE (2026-09-10 06:5xZ): el Integrador estuvo 2h30 reteniendo una
# publicacion esperando un veredicto **que llevaba desde las 04:25 en disco**.
# Llego y no le llego. Lo encontro el mismo comprobando su propio estado.
# 🔴 Y LA PARTE QUE ME TOCA: este detector NO PODIA VERLO, porque su pregunta era
# "¿falta el fichero de veredicto?" — y no faltaba. **La pregunta que faltaba es la
# contraria: ¿hay un veredicto que nadie ha atendido?** Un detector construido
# alrededor de una ausencia es ciego a los fallos de presencia.
# CRITERIO, acotado para no gritar con el sistema sano:
#   - solo el veredicto MAS RECIENTE de cada tarea (los viejos son historia),
#   - solo si es NO-GO (un GO no exige ronda siguiente),
#   - solo si NO hay export posterior a ese veredicto (si lo hay, se atendio),
#   - y solo por encima del umbral.
# Probado al escribirlo: marca 2 de 5 tareas, y las 2 eran reales.
# ⚠️ NO dice "nadie lo relayo": dice "nadie ha reaccionado todavia". Puede ser
# que se relayara y la terminal aun no haya exportado. Es una senal, no un hecho.
echo "---"

SECCIONES=$((SECCIONES+1))
echo "veredictos NO-GO sin reaccion (la huerfana en la otra direccion):"
NOREACC=0
ls VEREDICTO_*.txt 2>/dev/null | grep -oE '(T[0-9]+_)?(AIT-[0-9]+|[a-z-]+-falso)' | sort -u | while read key; do
  [ -z "$key" ] && continue
  V=$(ls -t VEREDICTO_*"${key}"*.txt 2>/dev/null | head -1); [ -z "$V" ] && continue
  VM=$(stat -f %m "$V"); EDAD=$(( (AHORA - VM) / 60 ))
  VER=$(grep -oE "Veredicto del auditor: *(GO|NO-GO)" "$V" | tail -1 | grep -oE "(GO|NO-GO)$")
  NUEVO=$(ls -t *"${key}"*para-auditor.txt 2>/dev/null | head -1)
  if [ -n "$NUEVO" ]; then NM=$(stat -f %m "$NUEVO"); else NM=0; fi
  if [ "$VER" = "NO-GO" ] && [ "$NM" -lt "$VM" ] && [ "$EDAD" -ge "$UMBRAL" ]; then
    echo "  🔴 ${EDAD} min · ${key} · NO-GO sin export posterior · $V"
  fi
done
echo "  (si no hay lineas 🔴 arriba, ninguno pasa el umbral de ${UMBRAL} min)"

if [ "$PENDIENTES" -gt 0 ]; then
  echo "RESULTADO: $PENDIENTES export(s) SIN FICHERO DE VEREDICTO por encima de ${UMBRAL} min."
  echo "🔴 NO SIGNIFICA que esas tareas esten paradas. Este detector mide FICHEROS, no TAREAS."
  echo "   Antes de disparar ninguna auditoria, CONSULTA EL ESTADO EN LINEAR: un export viejo"
  echo "   sin veredicto puede ser (1) olvidado, (2) fuera de alcance, o (3) de una tarea YA"
  echo "   CERRADA por otra via. Las tres se ven identicas aqui. Incidente real: AIT-83 (ver cabecera)."
  exit 1
fi


if [ "$INDET" -gt 0 ]; then
  echo "RESULTADO: ningun export EMPAREJABLE por encima de ${UMBRAL} min sin veredicto,"
  echo "           pero $INDET no se pudieron juzgar. El verde NO los cubre: mirarlos a mano."
  exit 3
fi
echo "RESULTADO: ningun export por encima de ${UMBRAL} min sin veredicto."
exit 0

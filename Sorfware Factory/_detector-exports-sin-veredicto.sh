#!/bin/bash
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
# Codigo de salida: 0 si no hay ninguno por encima del umbral, 1 si hay alguno.
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

for f in "${EXPORTS[@]}"; do
  term=$(echo "$f" | grep -oE '^T[0-9]+')
  ait=$(echo "$f"  | grep -oE 'AIT-[0-9]+')
  loop=$(echo "$f" | grep -oE '(plan-)?loop[0-9]+')

  # Si no se puede derivar la clave, se DICE. No se cuenta como sano.
  if [ -z "$term" ] || [ -z "$ait" ] || [ -z "$loop" ]; then
    echo "INDETERMINADO: no pude derivar terminal/issue/loop de '$f'. NO cuenta como sano."
    PENDIENTES=$((PENDIENTES + 1))
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
VEREDICTOS=(VEREDICTO_*.txt)
echo "---"
echo "exports comprobados: $COMPROBADOS · veredictos visibles en el directorio: ${#VEREDICTOS[@]} (control positivo: si esto es 0, el detector NO esta discriminando)"

if [ ${#VEREDICTOS[@]} -eq 0 ]; then
  echo "INDETERMINADO: no veo NINGUN fichero de veredicto. El cero de arriba no es fiable."
  exit 2
fi

if [ "$PENDIENTES" -gt 0 ]; then
  echo "RESULTADO: $PENDIENTES export(s) SIN FICHERO DE VEREDICTO por encima de ${UMBRAL} min."
  echo "🔴 NO SIGNIFICA que esas tareas esten paradas. Este detector mide FICHEROS, no TAREAS."
  echo "   Antes de disparar ninguna auditoria, CONSULTA EL ESTADO EN LINEAR: un export viejo"
  echo "   sin veredicto puede ser (1) olvidado, (2) fuera de alcance, o (3) de una tarea YA"
  echo "   CERRADA por otra via. Las tres se ven identicas aqui. Incidente real: AIT-83 (ver cabecera)."
  exit 1
fi

echo "RESULTADO: ningun export por encima de ${UMBRAL} min sin veredicto."
exit 0

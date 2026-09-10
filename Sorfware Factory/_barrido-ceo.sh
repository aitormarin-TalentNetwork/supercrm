#!/bin/bash
# Barrido de CEO — el criterio, extraido a disco.
#
# POR QUE EXISTE (2026-09-10, decision del Factory Architect ejecutada por el CEO):
# Este barrido vivia ENTERO como texto dentro de un cron de sesion. Comparados los tres
# vigilantes por lo que se pierde cuando muere su sesion:
#   - vigilante de fabrica quieta -> pierde el ARMADO (su script esta en el repo)
#   - detector de exports         -> pierde el ARMADO (su script esta en el repo)
#   - barrido de CEO              -> perdia el CRITERIO
# Los dos primeros los re-arma cualquiera en cinco minutos leyendo `_vigilantes.md`.
# **El tercero no lo recuperaba nadie, porque nadie sabria que comprobaba.** Era la unica
# perdida irreversible de las tres, y era la que su propio dueño tenia la ultima en la cola.
#
# QUE HACE: las comprobaciones de DISCO y GIT del barrido. Imprime hechos, no conclusiones.
# QUE **NO** HACE, y hay que hacerlo aparte (requiere al agente, no al shell):
#   (a) `ListAgents` y el cruce con `_registro-agentes.txt`
#   (b) medir el ultimo evento `assistant` de cada transcript CON CONTROL POSITIVO
#   (c) **consultar el ESTADO DE LAS TAREAS EN LINEAR** (ver el aviso de AIT-83 abajo)
# Esas tres se listan al final como PENDIENTES-DEL-AGENTE para que no se den por hechas.
#
# NINGUNA COMPROBACION DEVUELVE "OK" CUANDO NO HA PODIDO MIRAR. Si algo no se puede medir,
# se imprime INDETERMINADO. Un cero sin control positivo no es una buena noticia.

set -u

RAIZ="${BARRIDO_RAIZ:-/Users/aitor/Documents/curro + proyectos/Talent Land/Sistemas/CRM curso Vibe Coding}"
UMBRAL_EXPORT="${1:-60}"

# QUE HACER cuando este script NO ha podido medir nada. Se imprime SIEMPRE en esa rama.
# ⚠️ POR QUE EXISTE ESTA FUNCION (2026-09-10, hallazgo del Factory Architect sobre su propio
# vigilante, reproducido aqui): la rama de salida temprana era la UNICA que salia sin decir
# que hacer, porque hace `exit` antes de llegar al bloque de instrucciones. Y es **justo la
# rama donde mas falta hacen**: es la unica en la que NO se ha medido nada, o sea la unica
# en la que el operador esta ciego. **El sitio que se queda sin instrucciones es el que sale
# por la puerta de atras.**
que_hacer_si_no_pude_medir() {
  cat <<'QH'

--- QUE HACER AHORA (este barrido NO ha medido nada) ---
  🔴 ESTO NO ES "TODO TRANQUILO". Es "no se ha mirado". No lo anotes como ciclo sano.
  1. Comprueba la ruta: la raiz se pasa en BARRIDO_RAIZ, y por defecto se deduce de donde
     vive el script. Ojo: el directorio primario de una sesion CAMBIA SOLO (D25), asi que
     un `cd` previo puede haberte movido sin avisar. Usa ruta absoluta.
  2. Mientras no corra, haz A MANO lo minimo: `test -d` sobre los dos cerrojos con control
     positivo, `git ls-remote origin main` contra tu `main`, y `git status --short`.
  3. Dilo en tu renglon de estado como INDETERMINADO, con la hora. Un ciclo que no midio y
     uno que midio y salio limpio se ven igual en un resumen si no lo declaras.
QH
}

if [ ! -d "$RAIZ/.git" ]; then
  echo "INDETERMINADO: '$RAIZ' no parece la raiz del repo (no hay .git). No se ha comprobado NADA."
  que_hacer_si_no_pude_medir
  exit 2
fi
cd "$RAIZ" || { echo "INDETERMINADO: no se pudo entrar en la raiz."; que_hacer_si_no_pude_medir; exit 2; }

echo "===== BARRIDO DE CEO — $(date -u '+%Y-%m-%d %H:%M:%S UTC') ====="
echo "(hora medida con \`date -u\`, nunca deducida)"

# --- 1. CERROJOS -------------------------------------------------------------
# Se comprueba que EXISTEN, no se asume. Incidente real: tres roles negociaron un turno
# durante un rato sobre un cerrojo que ya no estaba en disco.
echo
echo "--- CERROJOS ---"
for L in _turno-convex.lock _turno-raiz.lock; do
  if [ -d "Sorfware Factory/$L" ]; then
    echo "  $L: TOMADO -> $(head -4 "Sorfware Factory/$L/titular.txt" 2>/dev/null | tr '\n' ' ' | cut -c1-160)"
  else
    echo "  $L: libre (no existe el directorio)"
  fi
done
# CONTROL POSITIVO del test -d: si esto falla, los "libre" de arriba no valen nada.
if [ -d "Sorfware Factory/_worktrees" ]; then
  echo "  [control positivo: _worktrees SI se ve -> el test -d discrimina]"
else
  echo "  INDETERMINADO: el control positivo del test -d ha fallado. Los 'libre' de arriba NO son fiables."
fi

# --- 2. main vs origin -------------------------------------------------------
# Se mide el remoto DE VERDAD. La copia local de origin/main envejece sin avisar (D27):
# una sesion leia 28006d3 mientras el remoto iba por 61c8b38.
echo
echo "--- main vs origin (remoto medido, no la copia local) ---"
if git fetch -q origin 2>/dev/null; then
  DELANTE=$(git rev-list --count origin/main..main)
  DETRAS=$(git rev-list --count main..origin/main)
  echo "  origin/main=$(git rev-parse --short origin/main)  main=$(git rev-parse --short main)"
  echo "  delante: $DELANTE · detras: $DETRAS"
  if [ "$DELANTE" -gt 0 ]; then
    echo "  commits sin publicar (ENUMERADOS, que es lo que exige la D27 antes de empujar):"
    git log --format="    %h %an — %s" origin/main..main | cut -c1-110
  fi
else
  echo "  INDETERMINADO: el fetch fallo. NO se puede afirmar nada sobre el remoto."
fi

# --- 3. Working tree de la raiz ---------------------------------------------
# La raiz la comparten seis roles: un fichero ajeno a medias acaba viajando en el commit
# de otro.
echo
echo "--- working tree de la raiz (compartido por seis roles) ---"
SUCIO=$(git status --short | head -15)
if [ -z "$SUCIO" ]; then echo "  limpio"; else echo "$SUCIO" | sed 's/^/  /'; fi

# --- 4. Cerrojos y ficheros de estado: ¿estan ignorados? ---------------------
# Se comprueba con `git check-ignore`, NO leyendo .gitignore a ojo. Incidente real:
# _turno-raiz.lock nacio sin su entrada y cualquier `git add -A` lo habria commiteado.
echo
echo "--- ficheros de estado local: ¿ignorados por git? ---"
for p in "Sorfware Factory/_turno-convex.lock" "Sorfware Factory/_turno-raiz.lock" \
         "Sorfware Factory/_registro-agentes.txt"; do
  if git check-ignore -q "$p" 2>/dev/null; then
    echo "  ok  ignorado: $p"
  else
    echo "  🔴 NO IGNORADO: $p  (un \`git add -A\` lo commitearia)"
  fi
done

# --- 5. Exports sin veredicto ------------------------------------------------
echo
echo "--- exports esperando veredicto (>${UMBRAL_EXPORT} min) ---"
DET="Sorfware Factory/_detector-exports-sin-veredicto.sh"
if [ -x "$DET" ]; then
  "$DET" "$UMBRAL_EXPORT"
elif [ -f "$DET" ]; then
  bash "$DET" "$UMBRAL_EXPORT"
else
  echo "  INDETERMINADO: no encuentro '$DET'. Los exports NO se han comprobado."
fi

# --- 6. Lo que este script NO puede hacer -----------------------------------
cat <<'PEND'

--- PENDIENTES DEL AGENTE (este script NO las cubre; no las des por hechas) ---
  (a) `ListAgents` + cruce con `Sorfware Factory/_registro-agentes.txt`.
      La clave es el TTY (raiz) y el worktree (desarrolladores), NUNCA el nombre ni el
      [ref]: los dos caducan sin relanzamiento.
  (b) Terminales paradas: medir el ultimo evento `assistant` del TRANSCRIPT, con control
      positivo CONSTRUIDO POR OTRA VIA (p.ej. tu propio transcript, del que sabes por fuente
      independiente que esta vivo). NUNCA por ausencia en ListAgents.
      🔴 Y NO LO HAGAS ORDENANDO TODOS LOS TRANSCRIPTS POR mtime. Medido 2026-09-10 05:39Z:
      hay **119 transcripts y 12 sesiones vivas**. Los otros ~107 son fabricas anteriores,
      muertas, con mtimes de horas o semanas. Consecuencias, las dos silenciosas:
        - `sort -n | head` te ensena los mas RECIENTES, no los parados. Buscar ahi una
          terminal atascada es mirar donde el fallo no puede estar.
        - **Una sesion VIVA y parada 90 min es indistinguible por mtime de una MUERTA hace
          90 min.** El numero es identico; lo que cambia es si hay alguien detras.
      EL METODO CORRECTO: parte de `ListAgents` (quien esta vivo), resuelve CADA sesion viva
      a su transcript, y mide SOLO esos. El universo lo define quien esta vivo, no el disco.
  (c) 🔴 ESTADO DE LAS TAREAS EN LINEAR. El punto 5 mide FICHEROS, no TAREAS. Un export
      viejo sin veredicto puede ser (1) olvidado, (2) fuera de alcance, (3) de una tarea YA
      CERRADA, o (4) de una tarea que AVANZA en Linear sin que el export se mueva, porque su
      trabajo no es codigo. Las cuatro se ven identicas en disco.
      **"AL MENOS cuatro" es literal: el CEO enumero tres y el Factory Architect encontro la
      cuarta en diez minutos.** No hay razon para creer que sean cuatro.
      INCIDENTE REAL (2026-09-10), con DOS fallos superpuestos:
        (a) ESTADO — se escalo "AIT-83, 26 h parada, o la disparas o la declaras abandonada".
            Las dos salidas eran falsas: estaba DONE desde 2026-09-09T00:42:40Z.
        (b) SUJETO — y ademas AIT-83 en Linear NO es lo que decia el nombre del fichero. El
            export se llama `T2_AIT-83_fix-arnes-e2e_...` pero la ficha AIT-83 es otra cosa
            ("Una pestaña abierta durante un despliegue queda rota", Low, Post-MVP). El
            propio export lo dice en su cabecera: es la correccion del arnes DE AIT-83, con
            "ficha de Linear propia, pedida al PM". **Lleva en el nombre el numero de OTRA
            ficha.**
      🔴 CONSULTAR LINEAR ARREGLA (a) PERO NO (b): si el identificador del fichero no es el
      de su tarea, la consulta devuelve el estado **de otra cosa** — y devuelve algo, no un
      error. La comprobacion cruzada falla hacia el lado tranquilizador. Antes de fiarte del
      numero del fichero, LEE SU CABECERA.
  (d) 🔴 Y NADA DE ESTO SE COMPRUEBA EJECUTANDO ESTE SCRIPT: hay que LEER su salida.
      Ejecutar un instrumento no es leerlo. Esta misma lista se contradijo con la cabecera
      del detector (tres historias aqui, cuatro alli) y **sobrevivio a una corrida real** sin
      que nadie lo notara, a veinte lineas de distancia y en el mismo directorio.
PEND
echo
echo "===== fin del barrido ====="

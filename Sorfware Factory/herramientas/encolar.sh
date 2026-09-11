#!/bin/bash
# UNICA VIA DE ENCOLAR UN ENCARGO A UNA PLAZA DE AUDITOR.
# Existe porque el 2026-09-10 encole un PROMPT donde iba un SCRIPT: la plaza hace
# `bash "$JOB"`, se lo comio como comandos, fallo en una ventana que nadie ve, y luego
# imprimio "✔ PLAZA libre otra vez" — el mismo mensaje que al terminar bien. 33 minutos.
#
# El control NO es "no tiene errores de sintaxis" (bash -n): una prosa sin parentesis ni
# comillas es sintacticamente valida, son comandos que no existen. Eso lo refuto T3.
# El control es POR PRESENCIA de lo que hace que el fichero SEA un encargo.
# Tampoco vale el shebang: mis scripts empiezan por `cd '...' && codex exec`.
set -u
F="${1:?uso: encolar.sh <script> <n-plaza>}"
N="${2:?uso: encolar.sh <script> <n-plaza>}"
fallo=0
[ -f "$F" ] || { echo "RECHAZADO: '$F' no existe"; exit 5; }
/usr/bin/grep -q "codex exec" "$F" || { echo "RECHAZADO: no contiene 'codex exec' — esto no es un encargo, parece un prompt"; fallo=1; }
/usr/bin/grep -q "| tee " "$F"    || { echo "RECHAZADO: no hay '| tee' — sin el, el veredicto no se escribe en ningun sitio"; fallo=1; }
/usr/bin/grep -q "^cd " "$F"      || { echo "RECHAZADO: no empieza por 'cd' — el auditor correria en el directorio equivocado"; fallo=1; }
bash -n "$F" 2>/dev/null          || { echo "RECHAZADO: error de sintaxis de bash"; fallo=1; }
[ "$fallo" -eq 0 ] || exit 7

# ROTACION DEL DESTINO DEL TEE. ES UNA PRECAUCION, NO UN INCIDENTE: no se ha perdido ningun
# veredicto (2026-09-10; lo crei por comparar `stat -f %SB`, que imprime hora LOCAL, contra
# `date -u -r`, UTC — y la `Z` del formato la habia escrito yo a mano sobre un valor que no
# era UTC. Medido en epoch crudo, el fichero nacio 4 s despues de mi disparo. T3 lo refuto
# ademas por otra via: hay SEIS veredictos para SEIS rondas, ninguna repetida).
# Lo que si es real y por eso se queda: `tee` TRUNCA sin avisar, y el nombre de ronda deja de
# ser unico en cuanto alguien renumera tras partir un alcance. No rechazo —una ronda matada
# y relanzada quiere sobrescribir legitimamente—: ROTO y lo digo fuerte. Cuesta un `mv`.
DEST=$(/usr/bin/grep -o '| tee "[^"]*"' "$F" | head -1 | sed 's/^| tee "//; s/"$//')
test -n "$DEST" || { echo "VACIO: no pude extraer el destino del tee del encargo. Sin el no puedo protegerlo; miralo a mano."; exit 11; }
if [ -f "$DEST" ]; then
  PREV="${DEST%.txt}.PREVIO-$(date -u +%H%M%SZ).txt"
  mv "$DEST" "$PREV" || { echo "RECHAZADO: el destino existe y no pude rotarlo"; exit 12; }
  echo "⚠️  EL DESTINO YA EXISTIA Y LO HE ROTADO (no lo he borrado):"
  echo "    era:   $DEST"
  echo "    ahora: $PREV"
  echo "    Nombre de ronda repetido. COMPRUEBA que no estas auditando dos cosas con el mismo nombre."
else
  echo "destino del tee libre: $(basename "$DEST")"
fi
[ -f "/tmp/auditores/plaza-$N.job" ] && { echo "RECHAZADO: la plaza $N ya tiene encargo"; exit 6; }
if pgrep -f "^codex exec" >/dev/null 2>&1; then
  echo "RECHAZADO: ya hay una auditoria corriendo. LAS AUDITORIAS VAN EN SERIE (cupo de Codex)."; exit 8
fi
# Una auditoria de Codex compite por MEMORIA con una suite E2E. El 2026-09-10 murieron 2 de
# 4 corridas completas por memoria. No es cortesia: una suite matada cuesta 10 min y no
# produce dato, y el que la corre no sabe que fui yo.
# El 2026-09-10 este control decia `pgrep -f "playwright"` y bloqueo la cola 7 minutos
# despues de que el Integrador liberase: matcheaba los SERVIDORES MCP de Playwright, que
# estan vivos SIEMPRE en todas las sesiones. Un guard que nunca deja pasar no protege, para.
# Se mide (a) el cerrojo, que es una DECLARACION de quien corre la suite y sabe lo que hace,
# y (b) el corredor de tests, anclado a la forma real del comando.
REPO="/Users/aitor/Documents/curro + proyectos/Talent Land/Sistemas/CRM curso Vibe Coding"
for d in "$REPO/Sorfware Factory"/_turno*.lock; do
  [ -d "$d" ] || continue
  echo "RECHAZADO: cerrojo tomado -> $(head -1 "$d/titular.txt" 2>/dev/null)"; exit 9
done
# 2026-09-10, TERCERA version de esta linea, y la primera ACREDITADA CONTRA UNA SUITE REAL.
#   manana   pgrep -f "playwright"              -> contaba los 10 SERVIDORES MCP. Bloqueo 8 min.
#   tarde    pgrep -f "playwright test"         -> se contaba a SI MISMO: la linea de comando
#                                                 del propio vigilante lleva esa cadena dentro.
#   18:37Z   pgrep -f "node.*playwright.*test"  -> DETECTA la suite (bien), pero midiendolo
#                                                 contra la corrida real del Integrador salio
#                                                 que TAMBIEN casa mis propias shells: 3 PIDs,
#                                                 y uno era mi bash. Y no siempre: a veces 2 y
#                                                 a veces 3, segun como quede compuesta la
#                                                 linea que lo invoca.
# ⚠️ UN DETECTOR QUE A VECES SE ENCUENTRA A SI MISMO ES PEOR QUE UNO QUE SIEMPRE LO HACE:
#    pasa sus propias pruebas y falla en produccion.
# La raiz no es el patron, es la FORMA de preguntar: cualquier cadena que yo escriba viaja
# dentro del comando que la busca. Asi que el ancla ya no es una cadena que yo elijo, sino
# DOS PROPIEDADES DEL SUJETO que mi shell no puede tener:
#   (a) el proceso vive bajo el node_modules DE ESTE REPO  (los MCP viven en ~/.npm/_npx)
#   (b) su linea NO contiene "shell-snapshots", que es la firma de las shells de Claude Code
# MEDIDO 2026-09-10 18:38:22Z, con la suite del Integrador corriendo de verdad:
#   ruta del repo, excluyendo mis shells .... 3   <- CONTROL POSITIVO: la suite real
#   MCP en ~/.npm/_npx ...................... 10  <- CONTROL NEGATIVO: quedan FUERA
# Refutado por el camino: anclar a "node_modules/.bin/playwright" daba 12, porque el binario
# de los MCP tambien vive en un node_modules. Ensanchar el filtro refuto el candidato antes
# de meterlo. Lo que discrimina no es "playwright": es DE QUE ARBOL cuelga.
# 🔴 CUARTA VERSION, 19:28Z. La tercera estaba CIEGA A LOS WORKTREES, que es donde corren
# los TRES desarrolladores. El ancla era la cadena literal "CRM curso Vibe Coding/node_modules",
# y la ruta real de un worktree es
#   .../CRM curso Vibe Coding/Sorfware Factory/_worktrees/T3/node_modules/...
# o sea que entre las dos mitades hay 40 caracteres y la concatenacion NO casa.
# MEDIDO: los cuatro worktrees (T1 T2 T3 QA) tienen node_modules PROPIO, 347-377 entradas.
# ⚠️ Y MI CONTROL POSITIVO DE LAS 18:38 NO LO CAZO PORQUE LA SUITE QUE MEDI ERA LA DEL
#    INTEGRADOR, QUE CORRE DESDE LA RAIZ — el unico caso que mi ancla veia. Acredite el
#    instrumento dentro de un universo que habia acotado sin declararlo.
#    La suite de T3 de las 19:04-19:14 (10,6 min, desde su worktree) fue INVISIBLE: mi
#    vigilante reporto "suite vista=0" con una corrida real de once minutos delante.
# El ancla ahora pide las dos mitades POR SEPARADO, que es lo que las une de verdad:
#   (a) la ruta cuelga del proyecto   (b) es un node_modules   (c) no es una shell mia
suite_viva=0
for _p in $(pgrep -f "CRM curso Vibe Coding.*node_modules" 2>/dev/null); do
  _c=$(ps -o command= -p "$_p" 2>/dev/null)
  case "$_c" in *shell-snapshots*) continue;; esac
  case "$_c" in *playwright*|*vitest*) suite_viva=1;; esac
done
if [ "$suite_viva" -eq 1 ] || pgrep -f "npm.*test:e2e" >/dev/null 2>&1; then
  echo "RECHAZADO: hay una suite corriendo en el node_modules de ESTE repo. Una auditoria le compite por memoria."; exit 9
fi
# ⚠️ 2026-09-10 19:52Z: este aviso decia "han muerto 2 de 4 corridas POR ESTO". RETIRADA la
# atribucion de causa. T3 arranco una suite al 4,8% de swap libre —POR DEBAJO del ~6,0% con el
# que murieron las dos— y aguanto 10,9 minutos. Con cuatro puntos y el cuarto en contra, "el
# swap explica las muertes" no tiene ninguna medicion que la sostenga sola. El aviso sigue
# valiendo para decir CUANTO QUEDA; ya no dice POR QUE murieron.
# Y la cifra va en FRACCION porque el total ha sido 13312, 14336, 15360, 16384 y 17408 en un
# dia: comparar megas entre momentos con totales distintos es comparar dos unidades.
# SWAP, no "memoria libre". El 2026-09-10 avisaba con `vm_stat free+inactive`, que es un numero
# que CORRELACIONA pero no es el recurso: lo que agota una suite E2E o una auditoria larga es el
# swap. Ese dia estaba al 94% (861M libres de 14336M) con 475 GB de disco y 16 GB fisicos — quien
# leyera "quedan 0,6 GB" como disco habria borrado caches sin cambiar nada. Lo corrigio el
# Integrador. Aqui no se BLOQUEA: se avisa, porque el umbral no esta calibrado y un guard que
# nunca deja pasar no protege, para (ya paso hoy con `pgrep -f playwright`).
SWAP_LIBRE=$(sysctl -n vm.swapusage 2>/dev/null | sed -E 's/.*free = ([0-9.]+)M.*/\1/')
if [ -n "$SWAP_LIBRE" ]; then
  sysctl -n vm.swapusage | awk '{for(i=1;i<=NF;i++){if($i=="total")t=$(i+2); if($i=="used")u=$(i+2); if($i=="free")f=$(i+2)} gsub("M","",t);gsub("M","",u);gsub("M","",f); printf "AVISO: swap total %s used %s free %s -> LIBRE %.1f%%\n",t,u,f,(f/t)*100}'
  echo "       ⛔ EL SWAP ESTA DESCARTADO COMO CAUSA, POR MEDICION: una suite murio con el swap"
  echo "          MEJORANDO (11,1% -> 11,8% libre) y otra sobrevivio 10,9 min al 4,8%."
  echo "          Este numero dice CUANTO QUEDA. No dice por que muere nada."
  # ⚠️ 2026-09-10 20:02Z: el guardian que mato una suite dice literalmente "running low on
  # MEMORY", y llevabamos toda la tarde midiendo SWAP. Son magnitudes distintas, y "memoria
  # libre" tiene AHORA MISMO tres valores que difieren en dos ordenes de magnitud:
  #    swap free ....................... 9,0%
  #    memory_pressure "free percentage" 43%     (cuenta inactive/purgeable como reclamable)
  #    vm_stat Pages free .............. 0,06 GB  (~0,4% de 16 GB)
  # NO SABEMOS CUAL LEE EL GUARDIAN. Asi que el aviso las imprime las TRES y no elige umbral:
  # un umbral sobre una magnitud sin nombre es como nacio el "861 M".
  memory_pressure 2>/dev/null | /usr/bin/grep -i "free percentage" | sed 's/^/       RAM: /'
  vm_stat 2>/dev/null | awk -F: '/page size/{gsub(/[^0-9]/,"",$2); ps=$2} /Pages free/{f=$2} /Pages inactive/{i=$2} END{gsub(/[^0-9]/,"",f);gsub(/[^0-9]/,"",i); printf "       RAM: Pages free %.2f GB · inactive %.2f GB (reclamable, no libre)\n", f*ps/1073741824, i*ps/1073741824}'
  echo "       Las tres magnitudes se llaman memoria y NO son la misma. Ninguna es un umbral."
  echo "       Si alguien va a lanzar la suite completa, DECLARA la hora de tu encolado."
fi
cp "$F" "/tmp/auditores/plaza-$N.job"
echo "ENCOLADO en plaza $N a las $(date -u +%H:%M:%SZ): $(basename "$F")"

#!/bin/bash
# Detector del índice de decisiones — decisión 56 del Factory Architect, 2026-09-08.
# DOS comprobaciones con ALCANCES DISTINTOS. Ninguna sustituye a la otra:
#   (A) CITAS vs ÍNDICE  -> caza una decisión ESCRITA y no indexada.
#   (B) SECUENCIA        -> caza una decisión que NUNCA LLEGÓ AL DISCO (el caso peor,
#                           y el que (A) no puede ver: si no está escrita, nadie la cita).
# Se ejecuta desde el barrido del CEO. Salida: filas para la tabla del censo.
set -uo pipefail
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IDX="$BASE/Sorfware Factory/INSTRUCCIONES PARA LA FABRICA DE SOFTWARE/_indice-de-decisiones.md"
[ -f "$IDX" ] || { echo "❌ no existe el índice: $IDX"; exit 1; }

# Números que el índice declara (primera celda de cada fila de la tabla; "1–6" cuenta como rango)
filas=$(grep -oE '^\| *([0-9]+)(–|-)?([0-9]+)? *\|' "$IDX" | tr -d '| ' | sed 's/–/-/')
indexados=$(for r in $filas; do
    if [[ "$r" == *-* ]]; then seq "${r%-*}" "${r#*-}"; else echo "$r"; fi
  done | sort -un)

# Números citados en los documentos de proceso (sin worktrees ni exports ni el propio índice)
citados=$(grep -rhoE "[Dd]ecisi[oó]n(es)? [0-9]+" \
    --include=*.md --include=*.txt "$BASE/Sorfware Factory" 2>/dev/null \
  | grep -oE '[0-9]+' | sort -un)

echo "--- (A) CITAS vs ÍNDICE: decisión escrita y no indexada ---"
faltanA=$(comm -23 <(echo "$citados") <(echo "$indexados"))
if [ -z "$faltanA" ]; then echo "    ok — toda decisión citada tiene fila"
else for n in $faltanA; do echo "    ⚠️ decisión $n citada y SIN FILA en el índice"; done; fi

echo "--- (B) SECUENCIA: decisión que nunca llegó al disco ---"
max=$(echo "$indexados" | tail -1)
huecos=$(comm -13 <(echo "$indexados") <(seq 1 "$max"))
if [ -n "$huecos" ]; then
  for n in $huecos; do echo "    ⚠️ la $n no tiene NI FILA: nadie la ha escrito ni indexado"; done
fi
# Una fila marcada NO LOCALIZADO es un hueco declarado: TIENE fila, así que la
# comparación de conjuntos no lo ve. Sin esta parte, la (B) daría verde sobre los once
# huecos que la motivaron — la comprobación que no puede fallar (enmienda 9).
declarados=$(grep -E '^\|' "$IDX" | grep -c 'TEXTO NO LOCALIZADO' || true)
if [ "$declarados" -gt 0 ]; then
  echo "    ⚠️ $declarados fila(s) con TEXTO NO LOCALIZADO — huecos abiertos, esos números NO SE CITAN:"
  grep -E '^\|' "$IDX" | grep 'TEXTO NO LOCALIZADO' | sed 's/|//;s/|.*//;s/^/       /'
fi
[ -z "$huecos" ] && [ "$declarados" -eq 0 ] && echo "    ok — secuencia 1..$max completa y sin huecos declarados"

echo "--- estado de verificación de los enunciados (56.3/56.4) ---"
tot=$(echo "$indexados" | wc -l | tr -d ' ')
# Solo dentro de la TABLA: la primera versión contaba también el ✅ de la cabecera que
# explica qué significa la marca, y daba "1 de 56 verificadas" con cero verificadas.
ver=$(grep -E '^\|' "$IDX" | grep -c '✅' || true)
echo "    $ver de $tot filas verificadas leyendo la decisión entera."
echo "    Mientras no lo estén, LAS FILAS SON PUNTEROS, NO ENUNCIADOS: sirven para"
echo "    encontrar el texto, nunca para citar la decisión."

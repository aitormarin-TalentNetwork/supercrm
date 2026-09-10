#!/bin/bash
# Vigilante de "fabrica quieta" (decision 78). NO es un proceso residente:
# lo dispara un cron de sesion del Factory Architect cada ~20 min.
# Regla: la senal que vale es la SIMULTANEIDAD, no la quietud de uno.
#
# 2026-09-10, D28: las terminales NO se enumeran a mano. La lista "T1 T2 T3"
# estaba escrita a pelo aqui y T4 nacio esa misma noche: el vigilante no lo
# habria visto NUNCA, y su silencio se lee igual que "todo va bien".
BASE="${WD_BASE:-$HOME/.claude/projects}"
PAT="${WD_PAT:-*CRM-curso-Vibe-Coding-Sorfware-Factory--worktrees-}"
UMBRAL_MIN="${WD_UMBRAL:-40}"
now=$(date +%s)

# Descubrimiento, no enumeracion. Solo T<digitos> exacto: descarta los
# sub-worktrees viejos tipo "T1-ait-14-15", que no son puestos.
TERMS=$(ls -d $BASE/$PAT* 2>/dev/null | sed "s#.*--worktrees-##" \
        | grep -E '^T[0-9]+$' | sort -V | uniq)

if [ -z "$TERMS" ]; then
  echo "== vigilante fabrica quieta == $(date -u '+%Y-%m-%d %H:%M UTC')"
  echo "VEREDICTO: INDETERMINADO (el descubrimiento no encontro NINGUNA terminal: patron o ruta mal)"
  exit 0
fi

quietos=0; total=0; detalle=""
for d in $TERMS; do
  m=$(find "$BASE" -maxdepth 1 -type d -name "$PAT$d" 2>/dev/null | while read -r p; do
        find "$p" -maxdepth 1 -name '*.jsonl' -exec stat -f '%m' {} \; 2>/dev/null
      done | sort -rn | head -1)
  [ -z "$m" ] && { detalle="$detalle
  $d: SIN TRANSCRIPT"; continue; }
  total=$((total+1)); mins=$(( (now - m) / 60 ))
  if [ "$mins" -ge "$UMBRAL_MIN" ]; then quietos=$((quietos+1)); estado="QUIETO"; else estado="activo"; fi
  detalle="$detalle
  $d: $estado, ultimo evento hace ${mins} min"
done

echo "== vigilante fabrica quieta == $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "terminales DESCUBIERTAS: $(echo $TERMS | tr '\n' ' ')"
echo "con transcript: $total | quietos >=${UMBRAL_MIN}min: $quietos$detalle"
if [ "$total" -eq 0 ]; then
  echo "VEREDICTO: INDETERMINADO (terminales descubiertas pero ninguna con transcript)"
elif [ "$quietos" -eq "$total" ]; then
  echo "VEREDICTO: ALARMA (las $total terminales quietas a la vez)"
else
  echo "VEREDICTO: OK"
fi

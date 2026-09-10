#!/bin/bash
# Vigilante de "fabrica quieta" (decision 78). NO es un proceso residente:
# lo dispara un cron de sesion del Factory Architect cada ~20 min.
# Regla: la senal que vale es la SIMULTANEIDAD, no la quietud de uno.
BASE="${WD_BASE:-$HOME/.claude/projects}"
PAT="${WD_PAT:-*CRM-curso-Vibe-Coding-Sorfware-Factory--worktrees-}"
UMBRAL_MIN="${WD_UMBRAL:-40}"
now=$(date +%s)
quietos=0; total=0; detalle=""
for d in T1 T2 T3; do
  m=$(find "$BASE" -maxdepth 1 -type d -name "$PAT$d*" 2>/dev/null | while read -r p; do
        find "$p" -maxdepth 1 -name '*.jsonl' -exec stat -f '%m' {} \; 2>/dev/null
      done | sort -rn | head -1)
  if [ -z "$m" ]; then
    detalle="$detalle
  $d: SIN TRANSCRIPT (nunca ha existido en esta maquina)"
    continue
  fi
  total=$((total+1))
  mins=$(( (now - m) / 60 ))
  if [ "$mins" -ge "$UMBRAL_MIN" ]; then
    quietos=$((quietos+1)); estado="QUIETO"
  else
    estado="activo"
  fi
  detalle="$detalle
  $d: $estado, ultimo evento hace ${mins} min"
done
echo "== vigilante fabrica quieta == $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "desarrolladores con transcript: $total | quietos >=${UMBRAL_MIN}min: $quietos$detalle"
if [ "$total" -eq 0 ]; then
  echo "VEREDICTO: INDETERMINADO (el instrumento no encontro ningun transcript: patron mal o ruta mal)"
elif [ "$quietos" -eq "$total" ]; then
  echo "VEREDICTO: ALARMA (los $total desarrolladores quietos a la vez)"
else
  echo "VEREDICTO: OK"
fi

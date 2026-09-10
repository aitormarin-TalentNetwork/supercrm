#!/bin/bash
# D30: un comando no se relee, se ejecuta. Este detector mide lo que un comando
# CUBRE (tests y ficheros), no como se llama, y lo compara con una foto commiteada.
# Si el contenido cambia sin que nadie toque el nombre, aqui se ve.
ROOT="${COB_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$ROOT" || { echo "VEREDICTO: INDETERMINADO (no pude entrar en $ROOT)"; exit 0; }
BASE="${COB_BASE:-$ROOT/Sorfware Factory/_cobertura-comandos.txt}"
med(){ # $1 = etiqueta, $2... = argumentos de playwright
  local et="$1"; shift
  local out; out=$(npx playwright test "$@" --list 2>&1 | grep -E '^Total: ' | tail -1)
  if [ -z "$out" ]; then echo "$et = INDETERMINADO (el listado no devolvio ningun Total)"; return; fi
  # un CERO no es una medida: un comando de test que no cubre nada es el
  # instrumento roto o la ruta mal, no una cobertura legitima de cero.
  case "$out" in "Total: 0 tests"*) echo "$et = INDETERMINADO ($out -> cero sin control positivo)"; return;; esac
  echo "$et = $out"
}
actual=$( { med "test:e2e"; med "test:unit" --config playwright.unit.config.ts; } )
echo "== cobertura de los comandos == $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "$actual"
if echo "$actual" | grep -q INDETERMINADO; then
  echo "VEREDICTO: INDETERMINADO (el instrumento no midio; NO es 'sin cambios')"; exit 0
fi
if [ ! -f "$BASE" ]; then
  echo "VEREDICTO: SIN FOTO PREVIA (primera vez). Guardando."; echo "$actual" > "$BASE"; exit 0
fi
if diff -q <(echo "$actual") "$BASE" >/dev/null; then
  echo "VEREDICTO: SIN CAMBIOS respecto a la foto commiteada"
else
  echo "VEREDICTO: 🔴 LA COBERTURA HA CAMBIADO SIN QUE CAMBIE EL NOMBRE DEL COMANDO"
  diff "$BASE" <(echo "$actual") | sed 's/^/  /'
  echo "  -> Si el cambio es intencionado, actualiza la foto EN EL MISMO COMMIT y di por que."
fi

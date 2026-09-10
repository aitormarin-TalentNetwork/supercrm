#!/bin/bash
# Test del pre-commit de la fabrica. Se corre a mano:  bash .githooks/probar-pre-commit.sh
#
# POR QUE EXISTE (decision 52): "un gate que solo se ejecuta una vez es documentacion;
# ejecutable, es una prueba de regresion". El hook se estreno el 2026-09-10 con estos
# mismos 7 casos, pero aquella ejecucion murio con la sesion que la hizo. Esto la
# convierte en reejecutable.
#
# POR QUE 7 Y NO 5 (decision 19 / enmienda 9): los 5 casos que BLOQUEAN no prueban nada
# por si solos — un hook que bloqueara SIEMPRE los pasaria los cinco. Lo que convierte
# esto en prueba son los 2 que PERMITEN, y sobre todo "Fase 2.md" SIN "Fase.md" al lado:
# se parece al peligro y no lo es. Un control que solo ha visto rojo no esta verificado:
# no sabemos si sabe callarse (decision 60.1).
#
# SEGURIDAD: corre entero en un repo desechable bajo $TMPDIR. NUNCA toca el repo real
# (decision 18.1: no se experimenta en la raiz) ni el indice compartido.

set -u
HOOK="$(cd "$(dirname "$0")" && pwd)/pre-commit"
[ -x "$HOOK" ] || { echo "FALLA: no encuentro un pre-commit ejecutable en $HOOK"; exit 1; }

TMP=$(mktemp -d "${TMPDIR:-/tmp}/probar-pre-commit.XXXXXX")
trap 'rm -rf "$TMP"' EXIT
cd "$TMP" || exit 1
git init -q .
git config user.email t@t.local
git config user.name test
mkdir -p .githooks && cp "$HOOK" .githooks/pre-commit
git config core.hooksPath .githooks

pasa=0; falla=0
# caso <nombre> <esperado: BLOQUEA|PERMITE>  — el cuerpo prepara el arbol y hace el add
caso() {
  local nombre="$1" esperado="$2"
  # CONTROL POSITIVO DEL ARNES, EN CADA CASO. No es paranoia: la primera version de este
  # script perdia el hook tras el primer caso y los cuatro siguientes daban PERMITE sobre
  # un hook INEXISTENTE. Sin esta linea, "3 pasan / 4 fallan" se lee como "el hook esta
  # medio roto" cuando lo roto era el arnes. Un test sin control de su propio instrumento
  # mide su arnes y lo llama producto.
  if [ ! -x .githooks/pre-commit ]; then
    falla=$((falla+1)); printf '  FALLA %-46s el ARNES perdio el hook\n' "$nombre"
    git reset -q --hard 2>/dev/null; return
  fi
  if git commit -q -m "caso: $nombre" >/dev/null 2>&1; then real=PERMITE; else real=BLOQUEA; fi
  if [ "$real" = "$esperado" ]; then
    pasa=$((pasa+1)); printf '  ok    %-46s %s\n' "$nombre" "$real"
  else
    falla=$((falla+1)); printf '  FALLA %-46s esperaba %s y dio %s\n' "$nombre" "$esperado" "$real"
  fi
  # `reset --hard` restaura el hook porque esta TRACKEADO (ver el commit base). Eso es lo
  # que lo protege, NO el `-e` del clean: se probo `git clean -qfd -e .githooks` y BORRA
  # el hook igualmente. Medido, no supuesto.
  git reset -q --hard 2>/dev/null; git clean -qfd 2>/dev/null
}

# Commit base. El hook va TRACKEADO a proposito: asi `reset --hard` lo devuelve y
# `git clean` no puede llevarselo por ser untracked, que es lo que rompio la v1.
echo base > base.txt; git add base.txt .githooks/pre-commit; git commit -q -m base

echo "PRUEBAS QUE DEBEN BLOQUEAR (5)"
echo x > "informe.md"; echo x > "informe 2.md"; git add -A >/dev/null
caso "duplicado de macOS con su original al lado" BLOQUEA

mkdir -p e2e/.auth; echo '{"cookies":[]}' > e2e/.auth/user.json; git add -f e2e/.auth >/dev/null
caso "e2e/.auth/ (instantanea de sesion)" BLOQUEA

mkdir -p _copias-congeladas-por-revisar; echo x > _copias-congeladas-por-revisar/a.ts; git add -A >/dev/null
caso "cuarentena dentro del repo" BLOQUEA

printf -- '-----BEGIN RSA PRIVATE KEY-----\nMIIE\n' > clave.txt; git add -A >/dev/null
caso "clave privada en el diff" BLOQUEA

printf 'token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9abcdefghij\n' > t.txt; git add -A >/dev/null
caso "JWT en el diff" BLOQUEA

echo
echo "PRUEBAS QUE DEBEN PERMITIR (2) — son las que hacen que esto sea una prueba"
echo 'hola' > limpio.md; git add -A >/dev/null
caso "commit normal y limpio" PERMITE

echo x > "Fase 2.md"; git add -A >/dev/null
caso "'Fase 2.md' SIN 'Fase.md' al lado (nombre legitimo)" PERMITE

echo
echo "RESULTADO: $pasa pasan / $falla fallan  (de 7)"
[ "$falla" -eq 0 ] || exit 1

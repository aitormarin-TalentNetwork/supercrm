#!/bin/bash
# Vigilante de `.env.local` repuntado (AIT-123). NO es un proceso residente:
# lo dispara un cron de sesion, igual que `_vigilante-fabrica-quieta.sh`.
#
# QUE VIGILA: que el `.env.local` de cada worktree siga apuntando a SU deployment.
# Un comando de `convex` que resuelva el deployment por URL+admin key en vez de por
# nombre borra `CONVEX_DEPLOYMENT` y REPUNTA las dos `NEXT_PUBLIC_*` al destino del
# comando. Medido el 2026-09-10 contra el binario real.
#
# POR QUE HACE FALTA ADEMAS DEL COMPROBADOR DE LA SUITE, que es sincrono y por tanto
# mejor: aquel vive en el repositorio y llega POR MERGE. Un worktree que no haya
# mergeado no lo tiene. Este vive en la raiz y se puede actualizar sin que nadie
# mergee nada, y ve worktrees que todavia no existen.
#
# LO QUE NO HACE, declarado: es PERIODICO. Entre el dano y su siguiente pasada hay
# una ventana igual al periodo del cron, y en esa ventana una medicion por un camino
# que no pase por la suite obtiene un falso verde. Esta declarado en AIT-132 para
# que alguien lo DECIDA; hoy esta declarado y no decidido, que no es lo mismo.
#
# DESCUBRIMIENTO, NO ENUMERACION (D28): las terminales se leen del disco. Una lista
# `T1 T2 T3` escrita a pelo no habria visto a T4, que nacio la noche del 2026-09-09,
# y su silencio se lee igual que "todo va bien".
#
# 🔑 LA CONDICION NO VIVE AQUI, Y ESO ES LA CORRECCION DE B4.
# La primera version reimplementaba en `grep` la misma logica que el gate tiene en
# JavaScript: que es un self-hosted, que es coherente. Al cerrar el bypass del
# self-hosted arregle la copia de JavaScript y ESTA se quedo como estaba, asi que
# bastaba anadir una linea `CONVEX_SELF_HOSTED_URL` a un fichero Cloud danado para
# saltarse el vigilante entero. **Una condicion duplicada es una condicion que se
# corrige a medias.** Ahora este script no decide: EJECUTA `scripts/check-env-local.mjs`,
# que es el mismo codigo que usa el gate.
#
# CODIGOS DE SALIDA, y son tres a proposito:
#   0 = ok            todos los .env.local descubiertos son coherentes
#   1 = ALARMA        al menos uno no apunta a su propio deployment
#   2 = INDETERMINADO no se pudo comprobar: ni un solo fichero descubierto, o el
#                     comprobador no esta disponible. Falla el vigilante, no la
#                     fabrica. Un cero sin sujeto no es un verde.
#
# NO IMPRIME NINGUN VALOR SECRETO: `NEXT_PUBLIC_` es publico por definicion y el
# nombre del deployment ya circula por los documentos de proceso.

RAIZ="${AIT123_RAIZ:-/Users/aitor/Documents/curro + proyectos/Talent Land/Sistemas/CRM curso Vibe Coding}"
AQUI="$(cd "$(dirname "$0")" && pwd)"
COMPROBADOR="${AIT123_COMPROBADOR:-$AQUI/../scripts/check-env-local.mjs}"

echo "== vigilante .env.local (AIT-123) == $(date -u '+%Y-%m-%d %H:%M UTC')"

# FALLA CERRADO si no hay con que comprobar. Sin esto, un comprobador ausente o un
# `node` que no esta se leerian como "no encontre nada malo".
if ! command -v node >/dev/null 2>&1; then
  echo "VEREDICTO: INDETERMINADO (no hay \`node\` para ejecutar el comprobador)"
  exit 2
fi
if [ ! -f "$COMPROBADOR" ]; then
  echo "VEREDICTO: INDETERMINADO (no encuentro el comprobador en $COMPROBADOR)"
  exit 2
fi

# Un `.env.local` por sitio: la raiz y cada worktree descubierto.
FICHEROS=$(
  { [ -f "$RAIZ/.env.local" ] && echo "$RAIZ/.env.local"
    ls -d "$RAIZ/Sorfware Factory/_worktrees/"*/ 2>/dev/null | while read -r d; do
      [ -f "$d.env.local" ] && echo "$d.env.local"
    done
  } 2>/dev/null
)

if [ -z "$FICHEROS" ]; then
  echo "VEREDICTO: INDETERMINADO (el descubrimiento no encontro NINGUN .env.local)"
  exit 2
fi

total=0; malos=0; detalle=""
while read -r f; do
  [ -z "$f" ] && continue
  total=$((total+1))
  n=$(echo "$f" | sed "s#.*_worktrees/##; s#/.env.local##")
  [ "$n" = "$f" ] && n="RAIZ"

  salida=$(node "$COMPROBADOR" "$f" 2>&1); codigo=$?
  case "$codigo" in
    0) detalle="$detalle
  $n: ok" ;;
    1) malos=$((malos+1))
       detalle="$detalle
  $n: 🔴 $(echo "$salida" | tr '\n' ' ' | cut -c1-160)" ;;
    *) # NO SE PUDO COMPROBAR cuenta como malo, no como bueno: es el mismo
       # criterio que el resto del fichero y el que hace que el vigilante no
       # pueda quedarse callado por averiarse.
       malos=$((malos+1))
       detalle="$detalle
  $n: 🔴 NO COMPROBABLE (exit $codigo) $(echo "$salida" | tr '\n' ' ' | cut -c1-100)" ;;
  esac
done <<< "$FICHEROS"

echo "ficheros descubiertos: $total | incoherentes o no comprobables: $malos$detalle"
if [ "$malos" -gt 0 ]; then
  echo "VEREDICTO: ALARMA ($malos .env.local no apuntan a su propio deployment)"
  exit 1
fi
echo "VEREDICTO: ok"
exit 0

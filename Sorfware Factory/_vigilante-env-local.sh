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
# NO IMPRIME NINGUN VALOR SECRETO: `NEXT_PUBLIC_*` es publico por definicion y el
# nombre del deployment ya circula por los documentos de proceso. Ninguna otra clave
# del fichero se lee.

RAIZ="${AIT123_RAIZ:-/Users/aitor/Documents/curro + proyectos/Talent Land/Sistemas/CRM curso Vibe Coding}"

# Un `.env.local` por sitio: la raiz y cada worktree descubierto.
FICHEROS=$(
  { [ -f "$RAIZ/.env.local" ] && echo "$RAIZ/.env.local"
    ls -d "$RAIZ/Sorfware Factory/_worktrees/"*/ 2>/dev/null | while read -r d; do
      [ -f "$d.env.local" ] && echo "$d.env.local"
    done
  } 2>/dev/null
)

echo "== vigilante .env.local (AIT-123) == $(date -u '+%Y-%m-%d %H:%M UTC')"

if [ -z "$FICHEROS" ]; then
  # Un cero sin sujeto no es un verde: si el descubrimiento no encuentra nada, lo
  # que falla es el descubrimiento, no la fabrica.
  echo "VEREDICTO: INDETERMINADO (el descubrimiento no encontro NINGUN .env.local)"
  exit 0
fi

total=0; malos=0; detalle=""
while read -r f; do
  [ -z "$f" ] && continue
  total=$((total+1))
  n=$(echo "$f" | sed "s#.*_worktrees/##; s#/.env.local##")
  [ "$n" = "$f" ] && n="RAIZ"

  # Un self-hosted legitimo no tiene nombre del que derivar URLs, y el propio CLI
  # prohibe tener las dos configuraciones a la vez.
  if grep -q '^CONVEX_SELF_HOSTED_URL=.' "$f" 2>/dev/null; then
    detalle="$detalle
  $n: self-hosted, no aplica"
    continue
  fi

  dep=$(grep '^CONVEX_DEPLOYMENT=' "$f" 2>/dev/null | head -1 | cut -d= -f2- | cut -d'#' -f1 | tr -d ' ')
  if [ -z "$dep" ]; then
    malos=$((malos+1))
    detalle="$detalle
  $n: 🔴 CONVEX_DEPLOYMENT ausente o sin valor"
    continue
  fi
  nombre=${dep#*:}
  url=$(grep '^NEXT_PUBLIC_CONVEX_URL=' "$f" 2>/dev/null | head -1 | cut -d= -f2- | tr -d ' ')
  site=$(grep '^NEXT_PUBLIC_CONVEX_SITE_URL=' "$f" 2>/dev/null | head -1 | cut -d= -f2- | tr -d ' ')

  # IGUALDAD EXACTA, no "contiene": un "contiene" aceptaria
  # https://evil.example/third-goldfinch-805
  problemas=""
  [ "$url"  = "https://$nombre.convex.cloud" ] || problemas="$problemas URL=$url"
  [ "$site" = "https://$nombre.convex.site" ]  || problemas="$problemas SITE=$site"
  if [ -n "$problemas" ]; then
    malos=$((malos+1))
    detalle="$detalle
  $n: 🔴 repuntado — deployment $dep pero$problemas"
  else
    detalle="$detalle
  $n: ok ($dep)"
  fi
done <<< "$FICHEROS"

echo "ficheros descubiertos: $total | incoherentes: $malos$detalle"
if [ "$malos" -gt 0 ]; then
  echo "VEREDICTO: ALARMA ($malos .env.local no apuntan a su propio deployment)"
  exit 1
fi
echo "VEREDICTO: ok"
exit 0

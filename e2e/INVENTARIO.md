# Inventario de la suite e2e

**Este documento no tiene cifras dentro, y es a propósito.**

Un inventario con números se escribe una vez, se lee durante meses y **miente en
silencio desde el primer cambio que nadie anotó**. Lo que aquí hay son las
**preguntas** y **el comando que las contesta**. La respuesta se saca corriéndolo,
no leyéndola.

Cada pregunta lleva la fecha y el commit de la última vez que alguien la corrió.
Eso no es la respuesta: es **cuándo se supo por última vez**.

Y la frescura **también es un comando**, no un juicio: `git merge-base
--is-ancestor <commit> HEAD` falla si esa respuesta se midió sobre otro código.
Va pegado a cada pregunta y no aquí arriba a propósito — **un modificador
separado de lo que modifica no protege a quien no leyó la cabecera**, que es
justo el que se lleva el dato viejo. La fecha se queda para el humano; el commit
es lo comprobable.

> Regla de mantenimiento: **lo actualiza quien lo usa.** Si corres un comando de
> aquí, cambia su línea de "última corrida". No hace falta correrlos todos, ni
> hay ninguna obligación de mantenerlo al día: un inventario que obliga se
> abandona, y uno abandonado con cifras dentro es peor que no tenerlo.

Todos los comandos se ejecutan **desde la raíz del worktree**.

---

## 0. ¿Están las precondiciones que todos los demás dan por supuestas?

**Empieza por aquí si el arnés es nuevo para ti.** Los comandos de abajo suponen
un mundo montado —dependencias, navegador, credenciales, backend vivo— y quien
escribió este documento lo tenía todo puesto, así que **no podía ver lo que
falta**. Esto falla nombrando la precondición ausente, en vez de dejarte un error
que habla de otra cosa.

```bash
[ -f .env.local ] || echo "FALTA: .env.local (CONVEX_DEPLOYMENT y NEXT_PUBLIC_CONVEX_URL)"
[ -x node_modules/.bin/playwright ] || echo "FALTA: npm install (no está node_modules/.bin/playwright)"
P="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/Library/Caches/ms-playwright}"
ls "$P"/chromium-* >/dev/null 2>&1 || echo "FALTA: navegadores (npx playwright install) — no hay chromium en $P"
if [ -f .env.local ] && [ -x node_modules/.bin/convex ]; then
  err=$(node_modules/.bin/convex data authSessions --limit 1 2>&1 >/dev/null) || case "$err" in
    *"No CONVEX_DEPLOYMENT"*) echo "FALTA: CONVEX_DEPLOYMENT dentro de .env.local (es configuración, no el deployment)" ;;
    *) echo "FALTA: el deployment de Convex no responde" ;;
  esac
fi
```

**Nada de `npx` aquí, y no es cosmético.** La versión anterior de estas cuatro
líneas usaba `npx` y la probó T3 en un clon en frío: **`npx playwright --version`
se BAJA Playwright del registro y contesta `Version 1.63.0` con exit 0**, en un
entorno sin un solo navegador instalado. O sea que la línea escrita para detectar
que faltan los navegadores **contestaba a otra pregunta** —*"¿llega npm al
registro?"*—, **tenía efecto** (instalaba un paquete al comprobar una
precondición) y **devolvía una versión que ni siquiera es la del proyecto**
(`package.json` fija `^1.62.1`). Desde un worktree caliente eso es invisible,
porque `npx` resuelve local y todo parece bien.

Por eso ahora: **binarios locales** (`node_modules/.bin/…`), y los navegadores se
comprueban **mirando su caché**, que es donde viven, en vez de preguntándole la
versión a algo que puede aparecer de la nada.

**Y la última línea distingue dos causas que antes confundía.** `No
CONVEX_DEPLOYMENT set` **no** es *"el deployment no responde"*: es el mismo
`.env.local` que ya reportó la primera línea. Atribuirlo a Convex manda a quien lo
lea a mirar el deployment compartido —justo lo que costó tiempo en AIT-102—
cuando lo que falta es un fichero de configuración.

Silencio = todo presente. Cada línea que salga es una pregunta que **todavía no
puedes hacerte**.

⚠️ **Alcance exacto de la última línea**, sondeado: detecta que el *deployment*
no responde o que falta su configuración, y **nada más**. `convex data
unaTablaQueNoExiste` devuelve **exit 0**. Si lo lees como "las tablas están", te
equivocas.

⚠️ **Comprobado en un clon en frío de verdad** (`git clone --local` a un
temporal, sin red y sin `npm install`, T3 el 2026-09-09). Ahí es donde se cazaron
los dos fallos de arriba. Si vuelves a tocar este bloque, **pruébalo así**: desde
un worktree caliente estas líneas pasan en verde estén bien o mal.

🔴 **SI TOCAS ESTE BLOQUE, PRUÉBALO EN UN CLON EN FRÍO. No es una recomendación.**

    git clone --local <ruta-del-repo> /tmp/frio && cd /tmp/frio && <pega el bloque>

Es la única pregunta del inventario que **su autor no puede verificar**, y no por
descuido: **desde un worktree con `node_modules` presente, `npx` resuelve local y
estas líneas pasan en verde estén bien o mal.** El defecto no se te escapa — **no
puedes verlo desde donde estás**. Por eso las dos versiones anteriores de este
bloque pasaron en verde en un entorno sin un solo navegador instalado, y por eso
lo cazó alguien que no era yo. El clon cuesta treinta segundos.

⚠️ **Esta pregunta ya no descarga nada** — antes sí, y por eso conviene decirlo:
la versión con `npx` se bajaba `playwright` y `convex` al caché compartido **como
efecto secundario de comprobar precondiciones**. Con binarios locales es de solo
lectura.

Última corrida: 2026-09-09 · `34647f2` ·
¿vigente? `git merge-base --is-ancestor 34647f2 HEAD` — si falla, se midió sobre otro código

---

## 1. ¿Cuántos tests hay y cómo se reparten por fichero?

```bash
npx playwright test --list
```

⚠️ **El total depende de la rama.** El mismo comando el 2026-09-09 daba 54 en una
rama y 56 en otra, por dos specs sin publicar. No es ruido: es la razón por la que
aquí no hay cifras. Si citas el número, cita también dónde lo mediste.

Última corrida: 2026-09-09 · `34647f2` ·
¿vigente? `git merge-base --is-ancestor 34647f2 HEAD` — si falla, se midió sobre otro código

---

## 2. ¿Cuántos tests dependen de estar autenticado, y de qué rol?

```bash
for f in e2e/*.spec.ts; do
  printf "%-34s tests:%-3s loginAs:%s\n" "$(basename "$f")" \
    "$(grep -cE '^\s*test\(' "$f")" "$(grep -o 'loginAs(' "$f" | wc -l | tr -d ' ')"
done
grep -ho 'loginAs([a-zA-Z0-9_]*, "[a-z]*"' e2e/*.spec.ts | sort | uniq -c
```

⚠️ **Los dos números NO son el mismo, y el comando que había aquí antes lo
ocultaba.** `06-avisos-de-bloqueo` tiene **18 tests y 19 llamadas**: al menos uno
entra dos veces. Y `grep -c` cuenta **líneas**, no llamadas — que aquí coincidan
es casualidad del estilo de escritura, no una propiedad. Si la pregunta es
*"cuántas pruebas necesitan sesión"*, contar llamadas **contesta otra cosa**.

Última corrida: 2026-09-09 · `34647f2` ·
¿vigente? `git merge-base --is-ancestor 34647f2 HEAD` — si falla, se midió sobre otro código

---

## 3. ¿Cuántas sesiones crea una corrida, y crece ese número con el tamaño?

La pregunta **solo se contesta midiendo DOS tallas**. Una sola no distingue
"2 sesiones" de "2 sesiones porque he corrido 2 tests".

```bash
# antes de cada corrida
python3 -c "import time;print(time.time()*1000)"
# ... corre la suite (completa una vez, y un subconjunto otra) ...
npx convex data authSessions --limit 1000 --order desc --format jsonl \
  | python3 -c "import sys,json;t=float(input('t0: '));print(sum(1 for l in sys.stdin if json.loads(l)['_creationTime']>t))"
```

Se cuenta en `authSessions`, el registro del backend, **no** las peticiones a
`/api/auth`: por ahí pasan también las rotaciones de token, y contarlas mezcla
peticiones con sesiones.

Última corrida: 2026-09-09 · `34647f2` ·
¿vigente? `git merge-base --is-ancestor 34647f2 HEAD` — si falla, se midió sobre otro código

---

## 4. ¿Pasa cada test por sí solo?

Aísla el **proceso**, que no es lo mismo que aislar el estado: todos los procesos
siguen corriendo contra el mismo deployment persistente, así que esto **atribuye**
un rojo, no descarta que dos tests estén acoplados por los datos que dejan. Eso
último está abierto en AIT-114.

```bash
npx playwright test --list 2>&1 \
  | grep -oE '[A-Za-z0-9._-]+\.spec\.ts:[0-9]+' | sort -u | sed 's|^|e2e/|' \
  | while read -r sel; do
      npx playwright test "$sel" 2>&1 | grep -qE '^\s*1 passed' \
        && echo "PASS $sel" || echo "FAIL $sel"
    done
```

Selector por `fichero:línea`, nunca por el título: un título se edita y el
comando pasa a hablar de otro test sin avisar.

Dos detalles que costaron una corrección al escribir esto: `--list` imprime las
rutas **sin el prefijo `e2e/`** (de ahí el `sed`), y **leer el código de salida
de `playwright test` no sirve** — hay que buscar la línea `1 passed`. Un
`&& echo PASS` sobre el exit code de una tubería devuelve el del último comando,
no el del test.

Última corrida: 2026-09-09 · `34647f2` ·
¿vigente? `git merge-base --is-ancestor 34647f2 HEAD` — si falla, se midió sobre otro código

---

## 5. ¿Cuánto tarda una corrida completa?

```bash
time npx playwright test
```

Ojo al leerlo: **una corrida con fallos tarda MUCHO más que una limpia**, porque
cada fallo agota su timeout. Un tiempo alto suele ser un síntoma, no un coste.

Última corrida: 2026-09-09 · `34647f2` ·
¿vigente? `git merge-base --is-ancestor 34647f2 HEAD` — si falla, se midió sobre otro código

---

## 6. ¿Contra qué app y qué backend está midiendo esta suite?

```bash
grep -E '^CONVEX_DEPLOYMENT|^NEXT_PUBLIC_CONVEX_URL' .env.local
npx playwright test --list 2>&1 | grep '^\[e2e\]'
```

Desde AIT-96 la suite declara su puerto y su marcador al arrancar. Si el segundo
comando no imprime nada, es que **AIT-96 todavía no está en esta rama** — no que
no haya puerto. Y si el número no es el que esperas, **para**: significa que
estás midiendo otra cosa.

Última corrida: 2026-09-09 · `34647f2` ·
¿vigente? `git merge-base --is-ancestor 34647f2 HEAD` — si falla, se midió sobre otro código

---

## 7. ¿Hay tests que prueben login fallido a propósito?

Importa porque son los únicos que gastan cupo del limitador: un login correcto
borra el contador, solo cuentan los fallos.

```bash
grep -rlE 'getByLabel\(.(Email|Contraseña)' e2e/*.spec.ts
```

⚠️ **Sin coincidencias, `grep` sale con exit 1.** Es la respuesta buena —hoy no
hay ninguno— pero si lo encadenas con `&&`, **el "no hay ninguno" aborta todo lo
que venga detrás** y parece que el resto no hacía falta. Ejecútalo suelto.

Última corrida: 2026-09-09 · `34647f2` ·
¿vigente? `git merge-base --is-ancestor 34647f2 HEAD` — si falla, se midió sobre otro código

---

## 8. ¿Está el limitador de login tocado ahora mismo?

Si está bloqueado, el chequeo ocurre **antes** de verificar la contraseña, así que
**un login correcto no lo desbloquea**. Antes de interpretar cualquier rojo de
autenticación, mira esto.

```bash
npx convex data authRateLimits --format jsonl        # SIN 2>&1. Ver abajo.
```

⚠️ **No le añadas `2>&1`, aunque el dedo lo escriba solo.** Medido: sin
redirección da **0** líneas; con `2>&1` da **3** — dos `ExperimentalWarning` de
node y, la peor, **`There are no documents in this table.`**, una frase en prosa
que Convex manda por **stderr** para decir *vacío*. O sea que **la redirección
convierte un "no hay ninguno" en un "hay 3"**, y el 3 se lee como dato.

Y el control positivo, que es más barato que razonar: correr **un** test con
login aislado. Si pasa, la cuenta no está bloqueada y el rojo es otra cosa.

Última corrida: 2026-09-09 · `34647f2` ·
¿vigente? `git merge-base --is-ancestor 34647f2 HEAD` — si falla, se midió sobre otro código

---

## 9. ¿Cómo sé que esta suite PUEDE fallar?

La pregunta que sostiene a todas las demás. Un verde solo vale si existe un mundo
en el que ese mismo comando sale rojo; si no, no está midiendo nada.

Se rompe el mundo a propósito —apuntando a un backend que no existe— y **la suite
tiene que ponerse ROJA**:

```bash
NEXT_PUBLIC_CONVEX_URL=https://no-existe-0000.convex.cloud \
  npx playwright test e2e/02-seguimiento-diario.spec.ts
```

**Si esto pasa en verde, la suite no está mirando el backend** y cualquier verde
suyo sobre datos no significa nada. No hace falta correrlo a menudo: hace falta
correrlo **antes de fiarte de un verde importante**.

⚠️ Antes de creerte el resultado, mira la pregunta 6: **si AIT-96 todavía no está
publicada en tu rama, la suite apunta al 3000 y reutiliza el servidor que
encuentre allí**. Un rojo daría igual, pero un verde podría ser de la app de otro
y no probaría nada.

*** LO QUE SALE DEPENDE DE TU RAMA, Y ESA ES LA MITAD INTERESANTE. ***
Corrido el 2026-09-09 en dos ramas distintas, el mismo backend roto:

    con AIT-93/96/108 encima → rojo Y NOMBRANDO LA CAUSA:
        [e2e] no se pudo autenticar como "owner" contra http://localhost:3102
    sobre `main` (sin ellas)  → rojo MUDO:
        Test timeout of 30000ms exceeded · page.waitForURL en helpers.ts:25

**Las dos veces la suite detecta que el backend está roto**, que es lo que este
control pregunta. Lo que cambia es si el rojo **dice por qué**. Un timeout de 30 s
apuntando a un `waitForURL` es un síntoma que no señala la causa — y es el mismo
episodio que costó media hora de tres personas en AIT-86: una mutation sin
desplegar, el error tragado, y el test cayéndose dos aserciones más tarde.

Así que léelo así: **el control positivo pasa siempre; que además nombre la causa
es una propiedad que hoy solo tienen las ramas con el arnés arreglado.**

Última corrida: 2026-09-09 · `34647f2` ·
¿vigente? `git merge-base --is-ancestor 34647f2 HEAD` — si falla, se midió sobre otro código

---

## Lo que este inventario NO contesta

- **Si dos tests están acoplados por el estado que dejan en Convex.** La pregunta
  4 no lo cubre, y hoy la suite no puede contestarla: haría falta una línea base
  de servidor por test, que no existe. Está abierto en AIT-114.
- **Si la suite pasa sobre `main`.** Todo esto se corre en un worktree, contra su
  propio deployment. Es otra pregunta y tiene otro dueño.

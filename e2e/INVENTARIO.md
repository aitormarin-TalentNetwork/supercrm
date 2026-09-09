# Inventario de la suite e2e

**Este documento no tiene cifras dentro, y es a propósito.**

Un inventario con números se escribe una vez, se lee durante meses y **miente en
silencio desde el primer cambio que nadie anotó**. Lo que aquí hay son las
**preguntas** y **el comando que las contesta**. La respuesta se saca corriéndolo,
no leyéndola.

Cada pregunta lleva la fecha y el commit de la última vez que alguien la corrió.
Eso no es la respuesta: es **cuándo se supo por última vez**. Si esa fecha es
vieja, la pregunta está sin contestar — que es una información útil y honesta,
al contrario que un número caducado.

> Regla de mantenimiento: **lo actualiza quien lo usa.** Si corres un comando de
> aquí, cambia su línea de "última corrida". No hace falta correrlos todos, ni
> hay ninguna obligación de mantenerlo al día: un inventario que obliga se
> abandona, y uno abandonado con cifras dentro es peor que no tenerlo.

Todos los comandos se ejecutan **desde la raíz del worktree**.

---

## 1. ¿Cuántos tests hay y cómo se reparten por fichero?

```bash
npx playwright test --list
```

Última corrida: 2026-09-09 · `34647f2`

---

## 2. ¿Cuántos tests dependen de estar autenticado, y de qué rol?

```bash
grep -c 'loginAs(' e2e/*.spec.ts
grep -ho 'loginAs([a-zA-Z0-9_]*, "[a-z]*"' e2e/*.spec.ts | sort | uniq -c
```

Última corrida: 2026-09-09 · `34647f2`

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

Última corrida: 2026-09-09 · `34647f2`

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

Última corrida: 2026-09-09 · `34647f2`

---

## 5. ¿Cuánto tarda una corrida completa?

```bash
time npx playwright test
```

Ojo al leerlo: **una corrida con fallos tarda MUCHO más que una limpia**, porque
cada fallo agota su timeout. Un tiempo alto suele ser un síntoma, no un coste.

Última corrida: 2026-09-09 · `34647f2`

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

Última corrida: 2026-09-09 · `34647f2`

---

## 7. ¿Hay tests que prueben login fallido a propósito?

Importa porque son los únicos que gastan cupo del limitador: un login correcto
borra el contador, solo cuentan los fallos.

```bash
grep -rlE 'getByLabel\(.(Email|Contraseña)' e2e/*.spec.ts
```

Última corrida: 2026-09-09 · `34647f2`

---

## 8. ¿Está el limitador de login tocado ahora mismo?

Si está bloqueado, el chequeo ocurre **antes** de verificar la contraseña, así que
**un login correcto no lo desbloquea**. Antes de interpretar cualquier rojo de
autenticación, mira esto.

```bash
npx convex data authRateLimits --format jsonl
```

Y el control positivo, que es más barato que razonar: correr **un** test con
login aislado. Si pasa, la cuenta no está bloqueada y el rojo es otra cosa.

Última corrida: 2026-09-09 · `34647f2`

---

## Lo que este inventario NO contesta

- **Si dos tests están acoplados por el estado que dejan en Convex.** La pregunta
  4 no lo cubre, y hoy la suite no puede contestarla: haría falta una línea base
  de servidor por test, que no existe. Está abierto en AIT-114.
- **Si la suite pasa sobre `main`.** Todo esto se corre en un worktree, contra su
  propio deployment. Es otra pregunta y tiene otro dueño.

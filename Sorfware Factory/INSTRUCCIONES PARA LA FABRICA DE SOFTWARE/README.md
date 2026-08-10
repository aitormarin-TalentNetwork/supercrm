# La fábrica de software de SuperCRM

Esto documenta el montaje para desarrollar SuperCRM con **varias terminales de Claude Code en paralelo** (hasta 3: T1, T2, T3), cada una con su propio auditor externo, coordinadas por una sesión "directora" (otra Claude Code, normalmente la que trabaja contigo en la carpeta raíz del proyecto).

Si la máquina se reinicia, se pierde contexto, o simplemente abres una sesión nueva y no sabes por dónde seguir: **lee este documento entero antes de tocar nada**, y usa el prompt de la última sección para arrancar una sesión directora desde cero.

**Nota de nombre:** toda esta maquinaria vive dentro de la carpeta `Sorfware Factory/` (así, tal cual, con la errata — es el nombre real de la carpeta en disco; si algún día se renombra a `Software Factory` hay que actualizar todas las rutas de este documento y el `.gitignore` a la vez).

---

## 1. Las piezas del sistema

| Pieza | Dónde | Para qué |
|---|---|---|
| **Worktrees** | `Sorfware Factory/_worktrees/T1`, `T2`, `T3` (dentro del proyecto, en `.gitignore`) | Copia de trabajo aislada por terminal — cada una en su propia rama, para que dos terminales puedan editar código a la vez sin pisarse archivos en disco. **Nombre fijo por terminal, no por tarea** (decidido 2026-08-09: renombrar la carpeta con cada tarea sugería que "contenía" esa tarea en concreto; la rama de dentro es la que cambia). |
| **Ramas** | `aitormarin/ait-<n>-...` (una por issue de Linear; el nombre lo genera Linear automáticamente, campo `gitBranchName`) | Historial de cada tarea, limpio y separado del de las demás. |
| **Tablero de tareas** | `Sorfware Factory/codigo para auditar/T<n>_...txt` (en `.gitignore`) | Un fichero por terminal con el brief de la tarea que tiene asignada AHORA MISMO — **el nombre cambia con el estado**, no es fijo: `T1_en-espera.txt` si no tiene tarea, `T2_AIT-11_ficha-cliente.txt` si la tiene (terminal + issue + slug, para identificarlo sin abrirlo). La sesión directora lo escribe/renombra; Aitor copia el contenido y lo pega en la terminal correspondiente. |
| **Intro genérica** | `Sorfware Factory/intro-terminal.txt` | El texto que se pega ANTES del brief en cualquier terminal nueva (T1, T2 o T3): explica el montaje en paralelo, las reglas de no publicar, el turno de Convex, y la convención de nombres de los exports de auditoría (ver fila siguiente). Se pega siempre igual, cambia solo el brief que va después. |
| **Export de auditoría** | `Sorfware Factory/codigo para auditar/T<n>_AIT-<id>_<slug>_loop<N>-para-auditor.txt` (en `.gitignore`) | **UN SOLO fichero activo** por tarea (decidido 2026-08-09: dos ficheros separados —código y evidencias— confundían). Dentro, en secuencia: cabecera, código completo con cada archivo delimitado, y evidencias al final. `<N>` = número de ronda desarrollo↔auditoría (empieza en 1, sube tras cada NO-GO) — al pasar de ronda se borra el fichero del loop anterior y se crea el nuevo, nunca conviven dos loops de la misma tarea a la vez. Instrucción ya incluida en `intro-terminal.txt`. |
| **Cola de tareas** | `Sorfware Factory/codigo para auditar/cola/SIGUIENTE-<seq>_AIT-<id>_<slug>.txt` (en `.gitignore`) | Tareas ya vetadas por la directora (sin conflicto con lo que esté en marcha), en orden de recogida, pero SIN asignar a una terminal concreta todavía. Cuando el usuario le dice a una terminal libre "coge tu siguiente tarea", ella misma coge la de número más bajo y la reclama renombrándola a su propio `T<n>_...`. Así el usuario no tiene que decir "esto es para T1, esto para T2" — cualquier terminal libre coge lo siguiente que haya. |
| **Archivo histórico** | `Sorfware Factory/codigo para auditar/Subido a GitHub/` (en `.gitignore`) | Cuando una tarea se mergea, se archivan aquí sus 3 ficheros (el TXT de tarea + los dos exports de auditoría) antes de renombrar/reescribir el TXT de esa terminal para la siguiente tarea. |
| **Prompt del auditor** | `Sorfware Factory/auditor_prompt.txt` (manual) **y** `AGENTS.md` de la raíz, sección `<!-- BEGIN:auditor-role -->` (automático) | Mismo texto en los dos sitios. `AGENTS.md` es lo que Codex carga solo al arrancar en esta carpeta o en cualquier worktree (confirmado empíricamente: `codex exec "..."` responde `GO` sin que se le pegue nada) — así que **abrir `codex` en la carpeta del worktree ya activa el rol de auditor, sin pegar `auditor_prompt.txt` a mano**. Si se edita uno de los dos textos, editar el otro para que no diverjan. |
| **Linear** | Equipo "VibeCoding Academy" (AIT), proyecto "SuperCRM — MVP", MCP `linear-aitor` | Fuente de verdad de qué está Done / In Progress / Backlog, y el orden de fases (no adelantarse). |
| **Convex** | Deployment `third-goldfinch-805` (dashboard en `README.md` de la raíz) | Backend compartido por TODAS las terminales — un único deployment en la nube, ver riesgo en §3. |
| **GitHub** | `github.com/aitormarin-TalentNetwork/supercrm` (remoto `origin`) | Repo real. La sesión directora mergea a `main` y hace `git push` aquí. |
| **Railway** | Cuenta personal `aitormarin@gmail.com`, proyecto `reasonable-creativity`, servicio `supercrm` → `https://supercrm-production-4518.up.railway.app` | Auto-despliega en cada push a `main`. Ver ADR-002 en `docs/01-arquitectura.md`. **Cuenta en trial limitado (30 días o $5, a fecha 2026-08-08) — revisar que no haya caducado.** |

**Ojo, hay un proyecto de Railway huérfano** ("Mi CRM basic", cuenta `aitor.marin@talent-network.org`) sin relación con el pipeline real. No es este. No se toca.

---

## 2. El flujo de trabajo, de punta a punta

1. La sesión directora mira Linear + el estado real del código, decide qué tarea es segura para la próxima terminal libre (sin conflicto de archivos con lo que ya está en marcha — ver §3), y renombra el TXT de esa terminal a `T<n>_AIT-<id>_<slug>.txt` con el brief completo dentro (si estaba en espera, tenía el nombre `T<n>_en-espera.txt`).
2. Aitor copia el contenido de ese fichero y lo pega en la terminal de Claude Code correspondiente (primero `intro-terminal.txt`, luego el brief), que trabaja dentro de `Sorfware Factory/_worktrees/T<n>-.../`.
3. Esa Claude Code desarrolla y exporta TODO en un único fichero para el auditor, `T<n>_AIT-<id>_<slug>_loop1-para-auditor.txt` (instrucción ya en `intro-terminal.txt`). Aitor le dice al auditor de esa terminal que audite — lo encuentra solo, mismo estándar de nombres. Bucle desarrollo ↔ auditoría hasta que los dos dan el OK — si hay correcciones, se borra el fichero del loop anterior y se crea `..._loop2-para-auditor.txt`, y así sucesivamente; nunca conviven dos loops a la vez.
4. Aitor avisa a la sesión directora. **Antes de publicar, la directora hace una revisión final** (no se salta nunca, aunque el auditor ya haya dado el OK):
   - releer Linear por si algo cambió desde que la tarea arrancó (otro issue cerrado, alcance ajustado);
   - comprobar si `main` se ha movido desde que la rama se creó (`git log origin/main..main` / `main..origin/main`) — si sí, valorar si afecta a esta tarea antes de mergear;
   - comprobar el estado de las otras terminales activas, por si algo que no se solapaba al repartir la tarea ahora sí lo hace;
   - confirmar que lo que hay en el worktree coincide con lo que el auditor revisó (nada añadido de última hora fuera de su alcance).
   Si todo cuadra, la directora:
   - **antes de mergear, se asegura de que `convex/_generated/` está regenerado y coincide con el código fuente de esa rama** (`npx convex codegen` desde el worktree, o verificar que ya está al día) — NO es un fichero de infraestructura a excluir del commit como `AGENTS.md`/`CLAUDE.md`. Incidente real (2026-08-10): se excluyó de varios commits seguidos, Railway estuvo ~4 horas fallando el build en producción sin que se detectara, porque el push a GitHub "parecía" exitoso aunque el build fallara. Tras cualquier merge que toque `convex/*.ts`, comprobar el build de Railway de verdad (no solo que el push llegó) antes de dar la publicación por buena.
   - coge el código de esa rama y lo mergea a `main`,
   - hace `git push` (esto **ya dispara el deploy en Railway solo**, no hace falta nada más),
   - marca el issue de Linear como Done,
   - mueve los 3 ficheros de esa tarea (TXT + los dos exports de auditoría) a `Sorfware Factory/codigo para auditar/Subido a GitHub/`,
   - renombra el TXT de esa terminal a `T<n>_en-espera.txt` (si no hay tarea nueva todavía) o a `T<n>_AIT-<id>_<slug>.txt` con el brief siguiente dentro.
   - **paso fijo, siempre, no solo cuando la cola esté vacía:** revisa `codigo para auditar/cola/` y la rellena hasta tener 2-3 tareas listas (mismo análisis de dependencias/solapes de siempre, contra el `main` recién actualizado). No es algo que Aitor tenga que pedir cada vez — es parte de la propia publicación, el último paso, no uno aparte.
5. Se repite. **El orden en que las tareas de las distintas terminales se publican lo decide y administra la sesión directora** (no es "quien avisa primero, publica primero" automáticamente) — parte de la revisión final del paso 4 es justo eso: decidir si esta publicación concreta debe esperar a otra cosa antes.

---

## 3. Reglas que la sesión directora tiene que respetar

- **No crear nada fuera de la carpeta del proyecto** (`CRM curso Vibe Coding`) sin que Aitor lo pida explícitamente. Ya pasó una vez (worktrees en una carpeta hermana) y hubo que deshacerlo.
- **Mantener la cola (`codigo para auditar/cola/`) con 2-3 tareas listas, siempre — no reactivo, no "cuando se vacíe".** Es un paso fijo tras CADA push a `main` (ver §2, paso 4), sin esperar a que Aitor lo pida. Solo entra en la cola una tarea que YA pasó el mismo análisis de dependencias/solapes de siempre — la cola no es un backlog en bruto, es "lo siguiente listo para coger, en el orden que toca". Si algo deja de ser seguro (main se movió, otra terminal empezó algo que ahora choca), sacarlo o reordenarlo antes de que alguien lo reclame. Si de verdad no hay 2-3 candidatas 100% limpias, está bien quedarse con menos (o cero) — pero solo tras comprobarlo de verdad, nunca por no haberlo revisado.
- **La sesión directora administra el orden de publicación entre terminales — no es "quien avisa primero, publica primero".** Parte de la revisión final antes de cada merge (§2, paso 4) es decidir si esa publicación concreta debe esperar a otra cosa (otra terminal a punto de publicar algo que la afecte, una condición especial del brief, etc.) antes de seguir adelante.
- **No paralelizar tareas que toquen el mismo archivo.** Van juntas, secuenciales, en la misma rama/terminal (ejemplo real: AIT-14 y AIT-15 comparten `convex/opportunities.ts` → se dieron a la misma terminal).
- **Convex es un único deployment compartido.** `npx convex dev` sincroniza TODA la carpeta `convex/` en cada guardado — incluye `convex/_generated/*`, que se regenera a partir de lo que haya en disco de TODAS las terminales activas, aunque cada una solo edite sus propios archivos "de negocio". Cada brief en `T<n>.txt` debe recordar avisar antes de lanzar `npx convex dev`, para no pisar el deployment de otra terminal a medio trabajar.
- **Además del turno: si `main` avanzó mientras una terminal seguía trabajando, esa terminal tiene que traerse `main` (`git merge main` dentro de su worktree) antes de su siguiente `npx convex dev`.** Pasó de verdad (2026-08-09): T2 corrió `convex dev` con una rama desactualizada tras el merge de AIT-14/15 y borró del deployment compartido `changeStage`/`markWon`/`markLost` — seguían a salvo en `main`, pero desaparecieron de lo desplegado hasta hacer `git merge main` y redesplegar. No basta con "que no lo corran dos a la vez"; también hay que estar al día con lo último mergeado.
- **No adelantar fases de Linear** para rellenar huecos de una terminal libre. Si no hay tarea independiente de verdad, esa terminal se queda idle (se anota por qué en su `T<n>_en-espera.txt`).
- **Los merges/push a main los avisa la directora antes de ejecutarlos** (el push ya es el propio acto de publicar, así que es el momento de confirmar con Aitor, no después).
- **Actualizar `docs/` en el mismo cambio** si se toma o se cambia una decisión técnica (arquitectura, despliegue, etc. — ver `docs/01-arquitectura.md`, incluye ADR-001 auth y ADR-002 hosting/Railway).
- **Cada worktree tiene su propia copia de los ficheros de la raíz** (`AGENTS.md`, `CLAUDE.md`, `docs/`, `.gitignore`...) — son archivos trackeados por git, pero cada worktree los tiene en su propio disco, independientes entre sí. Un cambio hecho solo en la raíz (rama `main`) **no aparece solo en los worktrees** de las ramas de tarea. Si se edita algo de esto en la raíz y hace falta que las terminales activas lo vean ya (como pasó con la sección de auditor en `AGENTS.md`), hay que copiarlo a mano a cada worktree activo.

---

## 4. Cómo reinstaurar el entorno (tras un reinicio de máquina o una sesión nueva)

```bash
cd "/Users/aitor/Documents/curro + proyectos/Talent Land/Sistemas/CRM curso Vibe Coding"

# 1. Comprobar qué worktrees siguen existiendo
git worktree list

# 2. Si falta alguno, recrearlo. Las carpetas son NOMBRES FIJOS por terminal —
#    "Sorfware Factory/_worktrees/T1", "T2", "T3" — nunca llevan el nombre de la tarea
#    (decidido 2026-08-09, para no sugerir que la carpeta "es de" una tarea concreta).
#    La rama SÍ cambia con la tarea: mira qué issue tiene asignada esa terminal ahora
#    mismo (en Linear, o en el TXT de esa terminal dentro de codigo para auditar/) y usa
#    el gitBranchName de esa issue. NO uses -b si la rama ya existe.
git branch   # para ver qué ramas aitormarin/ait-... ya existen
git worktree add "Sorfware Factory/_worktrees/T1" <rama-actual-de-T1>
git worktree add "Sorfware Factory/_worktrees/T2" <rama-actual-de-T2>
# (para una tercera terminal, mismo patrón: "Sorfware Factory/_worktrees/T3")

# 3. Copiar el .env.local (no está en git) a cada worktree nuevo
cp ".env.local" "Sorfware Factory/_worktrees/T1/.env.local"
cp ".env.local" "Sorfware Factory/_worktrees/T2/.env.local"

# 4. Instalar dependencias en cada worktree
npm install --prefix "Sorfware Factory/_worktrees/T1"
npm install --prefix "Sorfware Factory/_worktrees/T2"
```

Si un worktree existe pero está en la rama equivocada (la tarea cambió), no se recrea:
dentro de esa carpeta, `git checkout -b <rama-nueva> main` (o `git checkout <rama-existente>`
si ya existía). Así se hizo el 2026-08-09 al pasar T1 de AIT-14/15 a AIT-12, y T2 de AIT-11
a AIT-13 — mismo worktree, mismo `node_modules`, solo cambia la rama activa.

Después:
- Leer los ficheros `T1_...txt`, `T2_...txt`, `T3_...txt` que haya en `Sorfware Factory/codigo para auditar/` (el nombre después de `T<n>_` ya dice si estaba en espera o con qué issue) para saber qué tarea tenía asignada cada terminal en el momento del corte.
- Revisar Linear (proyecto SuperCRM — MVP) para confirmar qué está realmente Done/In Progress — no fiarse de lo que diga un TXT viejo si Linear dice otra cosa.
- Comprobar que `git log origin/main..main` y `git log main..origin/main` no muestran diferencias inesperadas (que no se haya quedado nada a medio subir).
- Comprobar que Railway sigue activo (mirar `https://supercrm-production-4518.up.railway.app`) y que el trial no ha caducado — si caducó, avisar a Aitor, no es algo que se arregle solo.

---

## 4bis. Arranque automático por rol (2026-08-09)

`CLAUDE.md` (raíz y cada worktree) ya trae un selector de rol al principio: al arrancar
una sesión nueva, si el primer mensaje no deja claro el rol, la sesión pregunta
"¿Desarrollador, Director o Auditor?" — y si el usuario ya lo dice, lo asume directo, sin
preguntar. El rol Desarrollador lee `intro-terminal.txt` + su `T<n>_...txt` solo; el rol
Director lee este mismo README. Auditor redirige a abrir `codex` (no lo cubre Claude).

Para que esto funcione sin pedir permiso de lectura fuera del worktree,
`.claude/settings.local.json` tiene `permissions.additionalDirectories` apuntando a
`Sorfware Factory/` — está sincronizado en la raíz y en los 3 worktrees. Verificado
empíricamente dos veces: una sesión nueva en un worktree lee `intro-terminal.txt` sin
prompt y se identifica sola como "T3" (o el que sea) por el nombre de su carpeta.

**Para abrir una terminal nueva ahora, basta con:**
```bash
cd "Sorfware Factory/_worktrees/T<n>" && claude
```
y decirle el rol (o dejar que pregunte). Ya no hace falta pegar `intro-terminal.txt` a
mano — lo lee solo. El texto del brief (`T<n>_AIT-<id>_<slug>.txt`) tampoco hay que
pegarlo si el rol Desarrollador ya sabe buscarlo solo, aunque pegarlo sigue funcionando
igual si se prefiere ser explícito.

## 5. El prompt único para arrancar una sesión directora desde cero

Copia y pega esto en una terminal de Claude Code nueva, abierta en la raíz de `CRM curso Vibe Coding`:

```
Lee por completo "Sorfware Factory/INSTRUCCIONES PARA LA FABRICA DE SOFTWARE/README.md"
en la raíz de este proyecto y ejecuta paso a paso su sección 4 ("Cómo reinstaurar el entorno") para
reconstruir los worktrees que falten. Después comprueba el estado real en Linear
(proyecto SuperCRM — MVP, MCP linear-aitor) y en los ficheros "T1_...txt", "T2_...txt",
"T3_...txt" que haya dentro de "Sorfware Factory/codigo para auditar/" (el nombre de
cada uno ya dice si esa terminal estaba en espera o con qué issue) para saber qué tarea
tenía cada terminal. A partir de ahí, actúa como la sesión directora descrita en ese documento:
reparte la siguiente tarea seguros a la terminal que quede libre, respetando las reglas
de la sección 3 (nada de conflictos de archivo entre tareas paralelas, turno único de
`npx convex dev`, no adelantar fases, avisar antes de mergear/publicar). No hagas nada
más hasta confirmar conmigo el reparto.
```

---

## 6. Estado del reparto (última foto — puede quedar desactualizado, mirar Linear)

- **AIT-14 + AIT-15** → 🟢 Done. Mergeadas y publicadas (commit `ca1ff91`, 2026-08-09).
- **AIT-11** → 🟢 Done. Mergeada y publicada (commit `06f825e`, 2026-08-09).
- **T1** (`Sorfware Factory/_worktrees/T1`, rama `aitormarin/ait-12-...`; TXT: `T1_AIT-12_pipeline.txt`) → AIT-12 (Pipeline), en curso.
- **T2** (`Sorfware Factory/_worktrees/T2`, rama `aitormarin/ait-13-...`; TXT: `T2_AIT-13_detalle-oportunidad.txt`) → AIT-13 (Detalle de oportunidad), en curso.
- Las dos tocan `convex/opportunities.ts` en paralelo (AIT-12 añade una función nueva al final; AIT-13 amplía `getSummary`) — Aitor decidió aceptar este solape de bajo riesgo esta vez, ya validado dos veces antes, en vez de esperar. Con estas dos, la Fase 2 queda completa.
- **T3** (`Sorfware Factory/_worktrees/T3`, rama `aitormarin/ait-16-...`; TXT: `T3_AIT-16_hoy.txt`) → AIT-16 (Pantalla "Hoy"), **Fase 3** — excepción de ritmo explícita y autorizada por Aitor el 2026-08-09: se avanza el DESARROLLO en paralelo con la Fase 2 todavía sin cerrar (AIT-12/13 en curso), pero **no se publica/mergea nada de AIT-16 hasta que Fase 2 cierre del todo**, aunque el auditor dé GO antes. No es una excepción general — solo esta vez, explícita.
- **Política general:** ante un cuello de botella de archivo compartido con una terminal YA EN MARCHA (trabajo sin mergear en curso), por defecto esperar en vez de aceptar solape. Cuando dos tareas arrancan a la vez desde el mismo `main` limpio (sin nadie por delante), el solape de bajo riesgo ya validado es aceptable si Aitor lo confirma explícitamente.

Nota de proceso confirmada en producción: cuando una tarea libera una terminal, su worktree se reutiliza cambiando de rama (`git checkout -b <rama-nueva> main`) en vez de crear un worktree nuevo — más simple, mismo `node_modules`/`.env.local` ya instalados.

Fecha de esta foto: 2026-08-09.

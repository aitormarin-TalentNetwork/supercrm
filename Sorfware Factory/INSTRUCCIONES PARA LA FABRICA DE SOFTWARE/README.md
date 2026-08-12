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
| **Prompt del auditor** | `Sorfware Factory/auditor_prompt.txt` (manual) **y** `AGENTS.md` de la raíz, sección `<!-- BEGIN:auditor-role -->` (automático) | Mismo texto en los dos sitios. `AGENTS.md` es lo que Codex carga solo al arrancar en esta carpeta o en cualquier worktree (confirmado empíricamente: `codex exec "..."` responde `GO`/`NO-GO` sin que se le pegue nada) — así que **abrir `codex` en la carpeta del worktree ya activa el rol de auditor, sin pegar `auditor_prompt.txt` a mano**. Si se edita uno de los dos textos, editar el otro para que no diverjan. Desde 2026-08-12, la propia Directora dispara estas auditorías por su cuenta (`codex exec` vía Bash, ver §2) en cuanto una terminal le avisa de que exportó — ya no hace falta que Aitor abra `codex` a mano ni le pegue nada, salvo que se prefiera hacerlo manualmente alguna vez. |
| **Rol Integrador** | `Sorfware Factory/INSTRUCCIONES PARA LA FABRICA DE SOFTWARE/integrador.md` | Documentado desde 2026-08-12, **no activo todavía**. Cuando se active, recoge de la Directora las tareas con GO y hace ella misma el merge/push/verificación de Railway/Linear Done/archivo — la Directora deja de publicar directamente y su trabajo en una tarea termina en "aviso al Integrador". Ver ese documento para el detalle completo. |
| **Rol CEO** | `Sorfware Factory/INSTRUCCIONES PARA LA FABRICA DE SOFTWARE/ceo.md` | Documentado desde 2026-08-12, **no activo todavía**. Supervisa todo el pipeline (workers, Directora, Integrador); la Directora le escala lo que no sabe resolver por su cuenta (terminal atascada que no responde, fallo de proceso no evidente). Puede inspeccionar visualmente una terminal (`screencapture`) y alterar tanto al worker como al proceso documentado — y siempre aplica lo aprendido al proceso después. Mientras no esté activo, la Directora escala directamente a Aitor. |
| **Mensajería directa entre terminales** | `SendMessage` / `ListAgents` (herramientas de Claude Code, no de este repo) | Desde 2026-08-12: la Directora y las terminales desarrolladoras se hablan directamente por aquí (asignar tarea, avisar de export listo, devolver veredicto, corregir) — Aitor ya no tiene que hacer de mensajero pegando texto entre terminales, salvo que quiera intervenir. Confirmar primero qué nombre de sesión (`ListAgents`) corresponde a qué terminal (T1/T2/T3) — no asumirlo solo por el nombre, que puede venir de una tarea antigua. |
| **Linear** | Equipo "VibeCoding Academy" (AIT), proyecto "SuperCRM — MVP", MCP `linear-aitor` | Fuente de verdad de qué está Done / In Progress / Backlog, y el orden de fases (no adelantarse). |
| **Convex** | Deployment compartido `third-goldfinch-805` (dashboard en `README.md` de la raíz) + un deployment propio por terminal (objetivo, migración pendiente — ver §3bis) | Hoy: backend compartido por TODAS las terminales, ver riesgo en §3. Objetivo: cada terminal desarrolla contra su propio deployment aislado; `third-goldfinch-805` pasa a ser solo el punto de merge/publicación. |
| **GitHub** | `github.com/aitormarin-TalentNetwork/supercrm` (remoto `origin`) | Repo real. La sesión directora mergea a `main` y hace `git push` aquí. |
| **Railway** | Cuenta personal `aitormarin@gmail.com`, proyecto `reasonable-creativity`, servicio `supercrm` → `https://supercrm-production-4518.up.railway.app` | Auto-despliega en cada push a `main`. Ver ADR-002 en `docs/01-arquitectura.md`. **Cuenta en trial limitado (30 días o $5, a fecha 2026-08-08) — revisar que no haya caducado.** |

**Ojo, hay un proyecto de Railway huérfano** ("Mi CRM basic", cuenta `aitor.marin@talent-network.org`) sin relación con el pipeline real. No es este. No se toca.

---

## 2. El flujo de trabajo, de punta a punta

1. La sesión directora mira Linear + el estado real del código, decide qué tarea es segura para la próxima terminal libre (sin conflicto de archivos con lo que ya está en marcha — ver §3 para el algoritmo de selección completo), y renombra el TXT de esa terminal a `T<n>_AIT-<id>_<slug>.txt` con el brief completo dentro (si estaba en espera, tenía el nombre `T<n>_en-espera.txt`).
2. **Desde 2026-08-12, la directora manda el brief directamente a esa terminal por `SendMessage`** (herramienta de Claude Code para hablar entre sesiones — ver `ListAgents`) en vez de que Aitor lo copie y pegue a mano. Sigue funcionando igual si alguna vez se prefiere el copy/paste manual. Esa Claude Code trabaja dentro de `Sorfware Factory/_worktrees/T<n>-.../`.
3. Esa Claude Code desarrolla y exporta TODO en un único fichero para el auditor, `T<n>_AIT-<id>_<slug>_loop1-para-auditor.txt` (instrucción ya en `intro-terminal.txt`), y **avisa a la directora directamente por `SendMessage`** en cuanto lo tiene — ya no hace falta esperar a que Aitor lo relaye ni que abra `codex` a mano. La directora lanza el auditor ella misma (`codex exec "Audita el fichero '<ruta>' siguiendo tu rol de auditor ya cargado desde AGENTS.md..."` vía Bash, desde la raíz del repo) y le devuelve el veredicto a la terminal por el mismo canal. Bucle desarrollo ↔ auditoría hasta que los dos dan el OK, **sin que Aitor tenga que intervenir en cada ronda**: si hay correcciones, la terminal corrige, borra el fichero del loop anterior, crea `..._loop2-para-auditor.txt`, y avisa otra vez a la directora — así sucesivamente; nunca conviven dos loops a la vez. Ojo: si el fichero cambia de loop mientras la auditoría está en curso, apuntar siempre al nombre de fichero vigente en ese momento (Codex se niega correctamente a auditar un loop viejo o a sustituirlo por uno distinto sin que se le diga).
4. La terminal avisa a la directora del GO. **Antes de publicar, la directora (o el rol Integrador, si Aitor ya lo ha activado — ver `integrador.md`) hace una revisión final** (no se salta nunca, aunque el auditor ya haya dado el OK):
   - releer Linear por si algo cambió desde que la tarea arrancó (otro issue cerrado, alcance ajustado);
   - comprobar si `main` se ha movido desde que la rama se creó (`git log origin/main..main` / `main..origin/main`) — si sí, valorar si afecta a esta tarea antes de mergear;
   - comprobar el estado de las otras terminales activas, por si algo que no se solapaba al repartir la tarea ahora sí lo hace;
   - confirmar que lo que hay en el worktree coincide con lo que el auditor revisó (nada añadido de última hora fuera de su alcance).
   Si todo cuadra, la directora:
   - **antes de mergear, se asegura de que `convex/_generated/` está regenerado y coincide con el código fuente de esa rama** (`npx convex codegen` desde el worktree, o verificar que ya está al día) — NO es un fichero de infraestructura a excluir del commit como `AGENTS.md`/`CLAUDE.md`. Incidente real (2026-08-10): se excluyó de varios commits seguidos, Railway estuvo ~4 horas fallando el build en producción sin que se detectara, porque el push a GitHub "parecía" exitoso aunque el build fallara. Tras cualquier merge que toque `convex/*.ts`, comprobar el build de Railway de verdad (no solo que el push llegó) antes de dar la publicación por buena.
   - ⚠️ **`npx convex codegen` NO publica funciones nuevas al backend** — solo regenera tipos/bindings TypeScript (comprobado con `--help`: "Generate backend type definitions"). Incidente real (2026-08-12): varias tareas (AIT-33, AIT-35) se dieron por publicadas tras `codegen` sin que `changePriority`/`advanceBillingStatus` llegaran a desplegarse de verdad — el frontend compilaba bien y hasta parecía funcionar (un fallback de UI enmascaraba la ausencia del dato real), pero la mutation no existía en el backend. **El comando correcto para desplegar a `third-goldfinch-805` (el deployment que usa la app real) es `npx convex dev --once`.** Verificar siempre después con `npx convex function-spec` que las funciones nuevas aparecen listadas. NUNCA usar `npx convex deploy` para este proyecto — apunta a un deployment de "producción" de Convex distinto y sin usar (`stoic-impala-857`), no al que lee la app.
   - coge el código de esa rama y lo mergea a `main`,
   - hace `git push` (esto **ya dispara el deploy en Railway solo**, no hace falta nada más),
   - marca el issue de Linear como Done,
   - mueve los 3 ficheros de esa tarea (TXT + los dos exports de auditoría) a `Sorfware Factory/codigo para auditar/Subido a GitHub/`,
   - renombra el TXT de esa terminal a `T<n>_en-espera.txt` (si no hay tarea nueva todavía) o a `T<n>_AIT-<id>_<slug>.txt` con el brief siguiente dentro.
   - **paso fijo, siempre, no solo cuando la cola esté vacía:** revisa `codigo para auditar/cola/` y la rellena hasta tener 2-3 tareas listas (mismo análisis de dependencias/solapes de siempre, contra el `main` recién actualizado). No es algo que Aitor tenga que pedir cada vez — es parte de la propia publicación, el último paso, no uno aparte.
5. Se repite. **El orden en que las tareas de las distintas terminales se publican lo decide y administra la sesión directora** (no es "quien avisa primero, publica primero" automáticamente) — parte de la revisión final del paso 4 es justo eso: decidir si esta publicación concreta debe esperar a otra cosa antes.

## 2bis. Automatización end-to-end (desde 2026-08-12) y cuándo SÍ hay que parar y preguntarle a Aitor

Los pasos 1-5 de arriba ya no necesitan que Aitor esté pegando mensajes entre terminales
— la directora asigna, coordina el bucle de auditoría, arbitra el turno de Convex, y
publica, todo por su cuenta. Pero "automático" no quiere decir "sin supervisión nunca":
**si la directora encuentra un problema que sabe resolver, lo resuelve ella misma; si no
sabe cómo, escala** — al rol CEO si ya está activo (ver `ceo.md`), o directamente a
Aitor mientras ese rol no lo esté.

**Antes de escalar una terminal por "no responde" o "parece atascada": comprobarlo de
verdad, no asumirlo** (pedido explícito de Aitor, 2026-08-12). Orden de comprobación,
de más a menos informativo:
1. Transcript real de su sesión (`~/.claude/projects/<carpeta-codificada>/<session>.jsonl`,
   ver la memoria de orquestación de terminales) — dice literalmente qué está haciendo.
2. Título de su ventana/pestaña de Terminal.app, sin permisos especiales:
   `osascript -e 'tell application "Terminal" to get name of every window'` — el símbolo
   `✳`/spinner al principio del título de una pestaña de Claude Code significa que sigue
   pensando/procesando; su ausencia sugiere que espera input.
3. Solo si ninguno de los dos aclara nada: mensaje directo preguntando qué pasa.
Escalar directamente sin haber probado esto es tratar un silencio como un fallo sin
comprobarlo — casi siempre hay una explicación visible con estos dos métodos antes de
pedir ayuda.

Casos típicos de escalado además de eso, aunque nada de lo demás requiera confirmación:

- **Decisión de alcance o de producto ambigua** que no está en el PRD, en Linear, ni en
  `docs/` — no se inventa alcance (regla de siempre de `CLAUDE.md`). Ejemplo real:
  AIT-32 necesita saber qué proveedor de WhatsApp/email/telefonía usar antes de construir
  nada — eso lo decide Aitor, no la directora ni el desarrollador.
- **Credenciales o cuentas externas que la directora no tiene** (claves de API, accesos
  de terceros).
- **Un mismo loop lleva muchas rondas de NO-GO sin converger** (indicio de que el
  desarrollador y el auditor están atascados en un desacuerdo de fondo, no de un fix
  puntual) — a partir de, orientativamente, 4-5 rondas sobre el mismo hallazgo, parar y
  preguntar en vez de seguir iterando sola.
- **Algo de infraestructura falla de verdad**: Railway caído o con el trial caducado,
  Convex con problemas que no se resuelven con la coordinación de turno habitual, el MCP
  de Linear u otro servicio necesario desconectado.
- Cualquier cosa que ya obligaba a preguntar antes de esta automatización y sigue
  siendo igual de sensible: publicar/mergear a `main` lo puede hacer la directora sola
  ahora, pero si algo en la revisión final (§2, paso 4) no cuadra, no se publica sin
  avisar.

Fuera de estos casos, la directora seguía adelante sin esperar confirmación de Aitor en
cada paso — y sigue reportándole un resumen de lo que ha hecho (qué se publicó, qué
veredictos llegaron, qué queda pendiente), no por permiso, sino por transparencia.

---

## 3. Reglas que la sesión directora tiene que respetar

- **No crear nada fuera de la carpeta del proyecto** (`CRM curso Vibe Coding`) sin que Aitor lo pida explícitamente. Ya pasó una vez (worktrees en una carpeta hermana) y hubo que deshacerlo.
- **Mantener la cola (`codigo para auditar/cola/`) con 2-3 tareas listas, siempre — no reactivo, no "cuando se vacíe".** Es un paso fijo tras CADA push a `main` (ver §2, paso 4), sin esperar a que Aitor lo pida. Solo entra en la cola una tarea que YA pasó el mismo análisis de dependencias/solapes de siempre — la cola no es un backlog en bruto, es "lo siguiente listo para coger, en el orden que toca". Si algo deja de ser seguro (main se movió, otra terminal empezó algo que ahora choca), sacarlo o reordenarlo antes de que alguien lo reclame. Si de verdad no hay 2-3 candidatas 100% limpias, está bien quedarse con menos (o cero) — pero solo tras comprobarlo de verdad, nunca por no haberlo revisado.
- **La sesión directora administra el orden de publicación entre terminales — no es "quien avisa primero, publica primero".** Parte de la revisión final antes de cada merge (§2, paso 4) es decidir si esa publicación concreta debe esperar a otra cosa (otra terminal a punto de publicar algo que la afecte, una condición especial del brief, etc.) antes de seguir adelante.
- **No paralelizar tareas que toquen el mismo archivo.** Van juntas, secuenciales, en la misma rama/terminal (ejemplo real: AIT-14 y AIT-15 comparten `convex/opportunities.ts` → se dieron a la misma terminal).
- **Mientras una terminal no esté migrada a deployment propio (ver §3bis), sigue
  aplicando el turno único arbitrado por la Directora — sin preguntarle a Aitor cada
  vez** (desde 2026-08-12). Cuando esa terminal pide lanzar `npx convex dev`/`codegen`,
  la directora comprueba si otra terminal sin migrar lo está usando en ese momento
  (`ListAgents` para ver estado, mensaje directo para confirmar si hace falta) y da o
  niega el paso ella misma. Incidente real ya visto más de una vez: una terminal
  despliega desde una rama que no tiene la tabla/campo nuevo de otra terminal en curso, y
  esta última "desaparece" del deployment compartido hasta que su dueña redespliega — si
  pasa, coordinar directamente con esa terminal para que redespliegue, no hace falta
  escalar a Aitor salvo que no se resuelva. Una vez todas las terminales estén migradas
  (§3bis), este bullet queda obsoleto: ya no hay turno que arbitrar para el desarrollo
  día a día.
- **Un deploy puede fallar por datos reales, no solo por código.** Esto sigue aplicando
  siempre, migradas o no, porque es sobre el deployment compartido en el momento del
  merge: si una rama en marcha (sin mergear) ya desplegó su propio schema y creó datos
  con la forma nueva (p. ej. AIT-29 con `quotes.lines` en vez de `quotes.amount`),
  desplegar `main` (con el schema viejo) puede ser **rechazado por Convex** al validar
  esos documentos existentes contra el schema antiguo — no es un problema de código, es
  que el dato real ya no encaja. Incidente real (2026-08-12). Antes de asumir que "ya se
  puede publicar", comprobar si hay otra rama con schema live incompatible. Si pasa:
  esperar a que esa rama mergee (la solución limpia), o borrar el dato de prueba a mano
  desde el dashboard de Convex si es claramente descartable (nunca dato real de negocio)
  — la directora no tiene sesión en el dashboard por defecto, así que esto normalmente
  requiere que Aitor lo haga él mismo.
- **Mientras una terminal no esté migrada, sigue siendo cierto que Convex es, para ella,
  un único deployment compartido.** `npx convex dev` sincroniza TODA la carpeta `convex/`
  en cada guardado — incluye `convex/_generated/*`, que se regenera a partir de lo que
  haya en disco de TODAS las terminales sin migrar activas, aunque cada una solo edite
  sus propios archivos "de negocio". Cada brief en `T<n>.txt` debe recordar avisar antes
  de lanzar `npx convex dev` si esa terminal sigue en el compartido, para no pisar el
  deployment de otra terminal a medio trabajar.
- **Además del turno (terminales sin migrar): si `main` avanzó mientras una terminal
  seguía trabajando, esa terminal tiene que traerse `main` (`git merge main` dentro de su
  worktree) antes de su siguiente `npx convex dev`.** Pasó de verdad (2026-08-09): T2
  corrió `convex dev` con una rama desactualizada tras el merge de AIT-14/15 y borró del
  deployment compartido `changeStage`/`markWon`/`markLost` — seguían a salvo en `main`,
  pero desaparecieron de lo desplegado hasta hacer `git merge main` y redesplegar. No
  basta con "que no lo corran dos a la vez"; también hay que estar al día con lo último
  mergeado. Este es exactamente el incidente que motivó el rediseño de §3bis.

## 3bis. Rediseño del turno de Convex: deployments aislados por terminal (decidido 2026-08-12, MIGRACIÓN PENDIENTE)

⚠️ **Diseño objetivo documentado, no aplicado todavía.** Ninguna terminal tiene hoy su
propio deployment — las tres siguen en el compartido `third-goldfinch-805`, así que los
bullets de §3 sobre turno arbitrado siguen aplicando a las tres. Este apartado existe
para que, cuando se ejecute la migración, cualquier sesión sepa exactamente qué hacer sin
improvisar — y para que, mientras tanto, cada terminal pueda saber en qué régimen está
mirando un solo dato (`CONVEX_DEPLOYMENT` en su `.env.local`).

**Causa raíz que esto resuelve:** con un único deployment compartido y `npx convex dev`
en modo watch, cualquier terminal que itera su feature en el navegador empuja TODO su
`convex/` local a ese deployment — incluido lo que su copia de `main` todavía no tiene de
las otras terminales en curso. Arbitrar turnos (§3) gestiona el síntoma; no evita que,
dentro de su turno, el propio `convex dev` de una terminal sobrescriba funciones ajenas
que su rama no conoce todavía — ya pasó de verdad (T2, 2026-08-09, ver bullet anterior).

**Diseño objetivo:** cada terminal (T1/T2/T3) tiene su **propio Convex dev deployment**,
aislado de las demás, apuntado desde el `.env.local` de su propio worktree
(`CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`). Con esto:

- Cada terminal lanza `npx convex dev` cuando quiera, sin pedir turno a nadie — ya no
  puede pisar lo de otra terminal, porque no comparten deployment.
- El deployment compartido (`third-goldfinch-805`, el que lee Railway/la app real) pasa a
  tocarlo **solo** la Directora (o el Integrador, cuando esté activo) en el momento del
  merge — ya es un punto de un solo actor, no necesita arbitraje.
- **Coste asumido:** se pierde el aviso temprano de choques de schema entre ramas en
  curso (el incidente de "main no se puede desplegar porque otra rama ya metió datos
  incompatibles", 2026-08-12, ver bullet de "un deploy puede fallar por datos reales" en
  §3) — con deployments aislados, ese choque solo se detecta en el merge, no antes. No es
  una mitigación nueva: ya es responsabilidad de la revisión final de §2 paso 4, que no
  cambia.

**Cómo saber si una terminal ya está migrada:** mirar `CONVEX_DEPLOYMENT` en su
`.env.local`. Si sigue siendo `third-goldfinch-805`, esa terminal NO está migrada
todavía y le sigue aplicando el turno arbitrado de §3. Si es otro nombre, ya tiene
deployment propio y puede ignorar esa regla.

**Checklist de migración, por terminal (PENDIENTE de ejecutar — no asumir que ya está
hecho sin comprobar `CONVEX_DEPLOYMENT`):**
1. Crear un proyecto Convex nuevo para esa terminal (dashboard, o `npx convex dev` dentro
   de su worktree eligiendo "crear proyecto nuevo" en vez de reusar
   `third-goldfinch-805`).
2. Copiar al nuevo deployment (dashboard de Convex → Settings → Environment Variables)
   `SEED_OWNER_PASSWORD` y `SEED_SALES_PASSWORD` con los mismos valores que tiene
   `third-goldfinch-805`, para que el login de demo (`/login`) siga funcionando —
   confirmado que no hay script de seed propio, la app depende de estas variables de
   entorno de Convex (ver `convex/auth.ts` y el comentario en `.env.local`).
3. Actualizar el `.env.local` de ese worktree con las tres variables nuevas
   (`CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`).
4. Verificar en el navegador que el login de demo y una pantalla básica (p. ej. "Hoy")
   cargan bien contra el deployment nuevo antes de dar la migración de esa terminal por
   hecha.
5. **No migrar una terminal que tenga trabajo en curso sin avisar primero** — hacerlo
   entre tareas (justo tras publicar una y antes de empezar la siguiente), nunca a medio
   desarrollo.

Hasta que las 3 terminales estén migradas, conviven ambos regímenes: unas ya con
deployment propio (turno libre), otras todavía en el compartido (turno arbitrado, §3).
La Directora es quien sabe en qué estado está cada una — si no está segura, comprobar
`CONVEX_DEPLOYMENT` en el `.env.local` de esa terminal antes de asumirlo.
- **No adelantar fases de Linear** para rellenar huecos de una terminal libre. Si no hay tarea independiente de verdad, esa terminal se queda idle (se anota por qué en su `T<n>_en-espera.txt`).
- **Los merges/push a main los ejecuta la directora sin esperar confirmación previa de Aitor** (desde 2026-08-12, ver §2bis) — pero le reporta un resumen de cada publicación después, y **para y pregunta antes** de publicar si algo de la revisión final (§2, paso 4) no cuadra, o si el caso encaja en alguno de los disparadores de escalado de §2bis.
- **Algoritmo para elegir la siguiente tarea de una terminal libre**, en este orden:
  1. ¿Hay algo en `codigo para auditar/cola/` con nombre `SIGUIENTE-N_...` (no `BLOQUEADA_...`)? Coge el número más bajo.
  2. Si la cola está vacía o solo tiene bloqueadas: mira Linear, proyecto `SuperCRM — MVP`, issues sin empezar de la fase actual (nunca de una fase futura — regla de no adelantarse).
  3. Si el MVP no tiene nada libre de verdad (todo Done, Cancelado, o ya reclamado): ver si hay algo bloqueado que ya se desbloqueó (una `BLOQUEADA_...` cuya condición ya se cumplió — pasarla a `SIGUIENTE-`).
  4. Si tampoco: y solo si Aitor ya autorizó explícitamente tirar de Post-MVP (excepción de alcance, no asumir sin pedirlo — ver `CLAUDE.md`), coger de `SuperCRM — Post-MVP` respetando las dependencias declaradas entre esos issues (empezar por las que no dependen de ninguna otra).
  5. En cualquiera de los casos: antes de asignar, comprobar que no hay conflicto de archivos con lo que las demás terminales tienen en marcha ahora mismo (no con lo que ya publicaron). Si lo hay, esa tarea espera — no se reparte "aceptando el riesgo" salvo que Aitor lo confirme explícitamente para ese caso concreto (ver política de "esperar por defecto" ya documentada más abajo en este mismo §3).
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
# ⚠️ Válido solo mientras esa terminal no esté migrada a deployment propio (§3bis).
# Si ya lo estaba antes del corte, copiar el .env.local de la raíz la desmigra sin
# querer — comprobar primero si tenía su propio CONVEX_DEPLOYMENT y, si es así,
# restaurar ESE .env.local (no el de la raíz).

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

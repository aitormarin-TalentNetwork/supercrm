# La fábrica de software de SuperCRM

> Este documento es la **configuración de este proyecto** para el rol Director/a — la
> parte genérica del rol (reutilizable en cualquier proyecto) está en `director.md`, en
> esta misma carpeta. Léelo primero si quieres el rol en abstracto; este README es la
> instancia real, con las piezas concretas, el flujo ya aplicado, y los incidentes
> reales de SuperCRM.

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
| **Rol Director/a** | `Sorfware Factory/INSTRUCCIONES PARA LA FABRICA DE SOFTWARE/director.md` (parte genérica) + este mismo `README.md` (configuración de este proyecto) | Activo. Coordina el pipeline entero: reparte tareas, dispara el ciclo de auditoría, arbitra recursos compartidos, hace la revisión final y publica (mientras el Integrador no esté activo). |
| **Rol Product Manager (PM)** | `Sorfware Factory/INSTRUCCIONES PARA LA FABRICA DE SOFTWARE/pm.md` | Documentado y **activo** desde 2026-08-14. Es con quien Aitor habla de funcionalidad/producto — monta con él el alcance nuevo (nunca el PRD de MVP, que sigue cerrado) y lo traduce a issues de Linear. Upstream del resto del pipeline: sus issues son lo que la Directora recoge para repartir (§2, paso 1). |
| **Rol Integrador** | `Sorfware Factory/INSTRUCCIONES PARA LA FABRICA DE SOFTWARE/integrador.md` | Diseño **activo** desde 2026-08-14 (cobertura real pendiente — comprobar con `ListAgents` si hay una terminal real jugándolo antes de asumir que ya cubre publicación; mientras no la haya, la Directora sigue publicando ella misma). Cuando haya una terminal real: recoge de la Directora las tareas con GO y hace ella misma el merge/push/verificación de Railway/Linear Done/archivo — la Directora deja de publicar directamente y su trabajo en una tarea termina en "aviso al Integrador". Ver ese documento para el detalle completo. |
| **Rol CEO** | `Sorfware Factory/INSTRUCCIONES PARA LA FABRICA DE SOFTWARE/ceo.md` | Diseño activo desde 2026-08-12; **se activa bajo demanda** (vía `/factory`, §4ter, o pidiéndoselo a una sesión explícitamente) — no hay una sesión CEO corriendo por defecto, comprobar con `ListAgents`. Supervisa a los workers y al pipeline día a día (Directora, Integrador); la Directora le escala lo que no sabe resolver por su cuenta. Ejecuta los cambios de proceso que decide el Factory Architect (o los decide él mismo si ese rol no está activo). Puede leer transcripts/inspeccionar visualmente una terminal y alterar al worker concreto — y siempre reporta lo aprendido al Factory Architect después. Mientras no haya sesión CEO activa, la Directora escala directamente a Aitor. |
| **Rol Factory Architect** | `Sorfware Factory/INSTRUCCIONES PARA LA FABRICA DE SOFTWARE/factory-architect.md` | Activo desde 2026-08-15, se crea con `/factory`. Es con quien Aitor habla para ajustar procesos/workflows de la fábrica — decide cambios sencillos de organización él mismo, pregunta a Aitor los sustanciales. Recibe del CEO los avisos de "esto no funciona, revisa el proceso" y le entrega la decisión ya tomada para que la ejecute — nunca implementa él mismo. Vigilancia recíproca con el CEO (ver `ceo.md`). |
| **Rol QA** | `Sorfware Factory/INSTRUCCIONES PARA LA FABRICA DE SOFTWARE/qa.md` | Activo desde 2026-09-03, se llamaba "Tester" hasta 2026-09-05 (renombrado, mismo rol). Prueba la app ya publicada en Railway (no código, producto en marcha) con el MCP de Playwright + la suite `e2e/*.spec.ts` como smoke-test — periódico vía `/loop` propio, más reactivo en cuanto se confirma un deploy nuevo. Reporta hallazgos siempre al PM (nunca a la Directora ni a Aitor directamente), que evalúa y coordina con la Directora antes de convertirlo en issue de Linear. |
| **Mensajería directa entre terminales** | `SendMessage` / `ListAgents` (herramientas de Claude Code, no de este repo) | Desde 2026-08-12: la Directora y las terminales desarrolladoras se hablan directamente por aquí (asignar tarea, avisar de export listo, devolver veredicto, corregir) — Aitor ya no tiene que hacer de mensajero pegando texto entre terminales, salvo que quiera intervenir. Confirmar primero qué nombre de sesión (`ListAgents`) corresponde a qué terminal (T1/T2/T3) — no asumirlo solo por el nombre, que puede venir de una tarea antigua. |
| **Linear** | Equipo "VibeCoding Academy" (AIT), proyecto "SuperCRM — MVP", MCP `linear-aitor` | Fuente de verdad de qué está Done / In Progress / Backlog, y el orden de fases (no adelantarse). |
| **Convex** | Deployment compartido `third-goldfinch-805` para desarrollo/test de las 3 terminales (dashboard en `README.md` de la raíz) + `stoic-impala-857` como deployment de producción (AIT-59 — ver §2 paso 4 más abajo y ADR-004 en `docs/01-arquitectura.md`; **activo desde 2026-08-24, Railway construye contra `stoic-impala-857` en cada push a `main`**) + un deployment de dev propio por terminal (objetivo de §3bis, migración distinta y todavía pendiente) | Hoy: `third-goldfinch-805` compartido por TODAS las terminales para dev/test, ver riesgo en §3. `stoic-impala-857` es el de producción, activado por AIT-59 (Tanda 1 y Tanda 2 completas). Objetivo de §3bis (aparte, no confundir): cada terminal desarrolla contra su propio deployment de dev aislado; `third-goldfinch-805` ya no tiene rol de publicación — el punto de publicación es el build de Railway contra `stoic-impala-857`, no un merge a `third-goldfinch-805`. |
| **Cerrojo de turno de Convex** | `Sorfware Factory/_turno-convex.lock/` (directorio, reclamado con `mkdir` — atómico, sin ventana de carrera —, con `titular.txt` dentro; en `.gitignore`) | Rediseñado 2026-08-14, afinado 2026-08-15: mientras el deployment siga compartido, las terminales lo reclaman solas con `mkdir` y lo liberan con `rmdir`, en vez de pedírselo a la Directora — arbitrar cada petición no escalaba según crecía el número de terminales/células. El barrido periódico también comprueba si un cerrojo lleva demasiado tiempo abandonado. La Directora (o el Líder de célula) solo entra ante disputa genuina o cerrojo abandonado sin poder confirmarlo. Desaparece del todo en cuanto la migración de §3bis esté completa. |
| **Registro de check-in de agentes** | `Sorfware Factory/_registro-agentes.txt` (fichero, una línea por check-in con `>>`; en `.gitignore`) | Añadido 2026-08-25/26 (pedido explícito de Aitor): `ListAgents` por sí solo no es fiable para saber quién existe de verdad, algunas terminales no se ven ni entre ellas. Cada rol (central o T<n>) escribe una línea aquí (`timestamp \| sesión \| rol \| terminal \| motivo`) al arrancar, reiniciarse o recrearse, ADEMÁS de presentarse por `SendMessage` al CEO (nunca en vez de) — segundo canal redundante contra el fallo de `ListAgents`. El CEO lo cruza con `ListAgents` en su barrido periódico (ver `ceo.md`) y trata cualquier discrepancia como hallazgo a investigar. |
| **Registro de rondas de QA** | `Sorfware Factory/_registro-qa.txt` (fichero de solo-anexar; en `.gitignore`) | Añadido 2026-09-08 (decisión del Factory Architect, ejecutada por el CEO). Una línea por ronda: `timestamp \| sesión \| build/commit probado \| alcance \| hallazgos (ids) \| qué NO se pudo verificar`. **El último campo es obligatorio** — es §2ter(b) aplicado al rol donde nació. Cierra un hueco real: `qa.md` no decía dónde anotar una ronda, así que el histórico entero del QA anterior murió con su sesión y no quedó nada en disco. Ver `qa.md` y §2quinquies (c). |
| **Modo de publicación** | `Sorfware Factory/_modo-publicacion.txt` (fichero de solo-anexar; en `.gitignore`) | Formato solo-anexar con procedencia desde 2026-09-08 (antes era una palabra suelta sin autor ni fecha, ver §2quinquies (b)). La vigente es la última línea que no empieza por `#`. **Este documento no dice cuánto vale el modo ahora** — se consulta ahí. Detalle en §4ter "Modo de publicación del Integrador" y en `integrador.md`. |
| **GitHub** | `github.com/aitormarin-TalentNetwork/supercrm` (remoto `origin`) | Repo real. La sesión directora mergea a `main` y hace `git push` aquí. |
| **Railway** | Cuenta personal `aitormarin@gmail.com` (cuenta de Railway nueva desde 2026-08-13 — la anterior agotó el trial), proyecto `fulfilling-vision`, servicio `supercrm` → `https://supercrm-production-bf48.up.railway.app` | Auto-despliega en cada push a `main`. Ver ADR-002 en `docs/01-arquitectura.md`. **Puede volver a estar en trial limitado — revisar que no haya caducado.** El proyecto viejo (`reasonable-creativity`, trial agotado) queda abandonado, no se usa. |

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
   - ⚠️ **AIT-59 (2026-08-24) cambió este bloque — la instrucción vieja de abajo ya NO
     aplica.** `stoic-impala-857` es ahora el deployment de producción real; Railway
     construye contra él en cada push a `main` (ver ADR-004 en `docs/01-arquitectura.md`)
     — publicar un cambio de `convex/*.ts` **ya no exige ningún paso manual de Convex**:
     el propio `git push` de este mismo paso 4 ya lo hace, vía el "Build Command" del
     servicio (`npx convex deploy --cmd "npm run build" --cmd-url-env-var-name
     NEXT_PUBLIC_CONVEX_URL`). `npx convex dev --once` contra `third-goldfinch-805`
     ahora es solo para desarrollo/test — ya NO publica nada que la app real sirva.
     **NUNCA `npx convex deploy` a mano desde un worktree** — sigue siendo el mecanismo
     de publicación, pero solo lo ejecuta Railway; correrlo manualmente desde una
     terminal exige una confirmación interactiva y no tiene sentido fuera del pipeline.
   - 📌 **Los dos avisos de este paso 4 (`codegen` que no publica, y `git push` que no
     dice nada del build) son instancias de §2sexies "falso verde"** — comprobaciones que
     devuelven un resultado tranquilizador sin haber hecho lo que se les pedía. Están en
     el registro de comprobaciones desacreditadas de esa sección, con su sustituto. No los
     dupliques ahí ni aquí: se explican aquí, se catalogan allí.
   - ⚠️ **`npx convex codegen` NO publica funciones nuevas al backend** — solo regenera tipos/bindings TypeScript (comprobado con `--help`: "Generate backend type definitions"). Incidente real (2026-08-12): varias tareas (AIT-33, AIT-35) se dieron por publicadas tras `codegen` sin que `changePriority`/`advanceBillingStatus` llegaran a desplegarse de verdad — el frontend compilaba bien y hasta parecía funcionar (un fallback de UI enmascaraba la ausencia del dato real), pero la mutation no existía en el backend. Tras cualquier merge que toque `convex/*.ts`, comprobar el build de Railway de verdad (`railway logs --build <deployment-id>`, confirmando que `npx convex deploy --cmd ...` corrió y terminó en `SUCCESS`) antes de dar la publicación por buena — no basta con que el dashboard salga en verde.
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
⚠️ **Estado degradado desde el 2026-09-08 (decisión 11 del Factory Architect): de los tres
niveles de abajo, hoy solo el 1 funciona.** El 3 está roto en esta máquina y el 2 quedó
inservible por un intercambio deliberado. Si lees esta lista y crees que tienes una red de
tres niveles, no la tienes: tienes uno. Está dicho así a propósito, no maquillado.

1. Transcript real de su sesión (`~/.claude/projects/<carpeta-codificada>/<session>.jsonl`,
   ver la memoria de orquestación de terminales) — dice literalmente qué está haciendo.
   Comparar tamaño Y timestamp del último mensaje contra el minuto/ciclo anterior, no
   solo el mtime del fichero (da falsos positivos).
   📌 **La señal primaria son las entradas `queue-operation` / `enqueue`**: dicen qué
   mensajes le han llegado a esa sesión y **no ha procesado todavía**, con su hora. Es lo
   único que distingue *"le han escrito y no lo atiende"* (atascada) de *"nadie le ha
   escrito"* (ociosa legítima) — la pregunta que "el fichero no crece" nunca respondió.
   Hallazgo de la Directora, 2026-09-08, validado el mismo día con T3: aparecía `waiting`
   en fase de plan (la combinación del incidente de las 5 horas) y tenía 3 mensajes
   encolados sin drenar; despertó al insistir.
2. Título de su ventana/pestaña de Terminal.app. **⚠️ El spinner ya NO es una señal
   válida aquí:** el bucle que reafirma el título del rol cada 2s (§4ter) sobrescribe el
   `✳`, y ese bucle corre en toda la fábrica. Es un intercambio deliberado (el spinner ya
   daba falsos positivos; la identificación visual por rol la pidió Aitor expresamente),
   no un bug pendiente — pero significa que **ni la ausencia ni la presencia de spinner
   prueban nada**. El título sirve para saber qué ventana es cuál, no si está viva.
3. ⚠️ **ESTE NIVEL ESTÁ ROTO HOY Y FALLA EN VERDE — lee esto antes de usarlo.** Sin
   permiso de Grabación de Pantalla para Terminal.app, `screencapture -l <id>` miente, y
   de dos formas distintas según el caso (verificado 2026-09-08): a la Directora le dio
   error explícito (`could not create image from window`); al CEO, sobre otra ventana, le
   devolvió **exit 0, creó el PNG, y la imagen era un rectángulo en blanco de 80×116 px**.
   **Guarda obligatoria: si haces una captura, estás obligado a ABRIR la imagen. Una
   captura en blanco o de tamaño ridículo es una captura FALLIDA, nunca "una ventana
   vacía".** Ver §2sexies. Recuperar este nivel depende de que Aitor conceda ese permiso.
   Lo que sigue describe el método **para cuando vuelva a funcionar** — y por qué importa
   tanto que hoy no lo haga:
3bis. **Si el transcript lleva un rato sin crecer, capturar la pantalla REAL de esa ventana
   antes de mandar ningún mensaje** (pedido explícito de Aitor, 2026-08-14, tras un
   incidente real: T1 llevaba 30+ min "sin responder" mensajes — no estaba colgada, tenía
   un `AskUserQuestion`/prompt interactivo abierto en pantalla esperando que alguien
   eligiera una opción con el teclado). Comando, sin permisos de Accesibilidad:
   ```
   osascript -e 'tell application "Terminal" to get {id, name} of every window'
   screencapture -l <window-id> -x <ruta>.png
   ```
   (sacar el `<window-id>` de la lista anterior, en la misma posición que el nombre de
   ventana que se busca) y luego **leer la imagen** con la herramienta de lectura de
   ficheros — no basta con haber hecho la captura, hay que mirarla.
   **Por qué importa este paso, no es opcional cuando hay un atasco real:** un
   `AskUserQuestion`/selector interactivo abierto **bloquea el procesamiento de mensajes
   en cola** — un `SendMessage` enviado a una terminal parada en ese estado se queda sin
   leer indefinidamente, por mucho que se repita. Ni el transcript ni el título de
   ventana lo revelan (ambos parecen "sin actividad", indistinguible de una sesión
   realmente muerta) — **solo la captura de pantalla lo muestra**. Si es esto, no hace
   falta reiniciar nada: solo que alguien (Aitor, o quien tenga esa terminal a la vista)
   elija la opción correspondiente a mano en esa ventana.
4. Solo si ninguno de los anteriores aclara nada: mensaje directo preguntando qué pasa
   (aunque, si el paso 3 muestra un selector interactivo, este mensaje no se procesará
   hasta que se resuelva el selector — no sirve de sustituto del paso 3).
Escalar directamente sin haber probado esto es tratar un silencio como un fallo sin
comprobarlo — casi siempre hay una explicación visible con estos métodos antes de pedir
ayuda.

**Las terminales avisan directamente cuando necesitan algo del usuario (pedido explícito
de Aitor, 2026-08-12) — no solo se quedan esperando en su propia conversación.** Desde
`intro-terminal.txt`: en cuanto un desarrollador necesita una decisión de Aitor que no
puede tomar él mismo (alcance ambiguo, proveedor, credenciales...), le pregunta en su
chat como siempre PERO también manda un `SendMessage` a la directora contándolo. Al
recibirlo, la directora:
- Si la respuesta ya la sabe (está en Linear/`docs`/una decisión previa de Aitor, o cae
  dentro de lo que a la propia directora le corresponde decidir), **contesta ella misma**
  y no hace falta molestar a Aitor por algo ya resuelto.
- Si no, hace de intermediaria: se lo traslada a Aitor (o lo dejó como pendiente
  reportado, ver más abajo) y en cuanto tenga la respuesta se la reenvía a la terminal.
Esto evita que una tarea se quede colgada solo porque Aitor no vio a tiempo la pregunta
en esa terminal en concreto — pensado también de cara a cuando no haya un humano
atendiendo cada terminal en tiempo real.

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
  **avisar a Aitor de que está pasando, para que lo sepa** — esto NO es para meter
  prisa al auditor ni pedirle que relaje el criterio o dé un GO antes de tiempo (pedido
  explícito de Aitor, 2026-08-12, ver también `auditor_prompt.txt`/`AGENTS.md`): la
  calidad manda siempre sobre la velocidad, deja que audite todas las rondas que hagan
  falta. El aviso a Aitor es solo visibilidad, nunca presión hacia el auditor.
- **Algo de infraestructura falla de verdad**: Railway caído o con el trial caducado,
  Convex con problemas que no se resuelven con la coordinación de turno habitual, el MCP
  de Linear u otro servicio necesario desconectado, o **el acceso a la IA caducado/sin
  cuota** (caso real 2026-08-15: varias terminales se fueron parando sin que nadie lo
  notara enseguida). Para este último caso en concreto, mientras el rol CEO no esté
  activo, aplica tú el mismo tratamiento que ya tiene documentado en `ceo.md` ("Cuando
  un worker se queda sin acceso a la IA"): revisión con intervalo corto (cada 3-5 min,
  más frecuente que tu barrido normal), alerta visible en pantalla al detectarlo, y
  nunca repetir la misma alerta mientras la situación no cambie.
- Cualquier cosa que ya obligaba a preguntar antes de esta automatización y sigue
  siendo igual de sensible: publicar/mergear a `main` lo puede hacer la directora sola
  ahora, pero si algo en la revisión final (§2, paso 4) no cuadra, no se publica sin
  avisar.

Fuera de estos casos, la directora seguía adelante sin esperar confirmación de Aitor en
cada paso — y sigue reportándole un resumen de lo que ha hecho (qué se publicó, qué
veredictos llegaron, qué queda pendiente), no por permiso, sino por transparencia.

### Vigilancia en malla, no en pirámide (decidido 2026-08-15)

El CEO vigila a todo el pipeline, pero eso no puede dejar un punto ciego justo en la
cima — nadie audita al que audita a todos los demás, salvo que se diseñe explícitamente
para que sí. La regla que lo evita, aplicada en cada nivel de la cadena de escalado
(Desarrollador → Líder de célula si las hay → Directora → CEO si está activo → Factory
Architect si está activo → Aitor): **ninguna escalada es "dispararla y olvidarla"**.
Quien escala algo espera una respuesta en un margen razonable, y si no llega, aplica a
quien recibió la escalada el mismo método de verificación de staleness que usaría con
cualquier terminal — si confirma que no responde de verdad, salta directamente al
siguiente nivel (o a Aitor) en vez de quedarse esperando indefinidamente. Detalle
completo, por rol, en `director.md` ("Escalar no es dispararlo y olvidarlo") y `ceo.md`
("Quién te vigila a ti").

**El Factory Architect añade además una vigilancia recíproca con el CEO** (decidido
2026-08-15, no solo escalada hacia arriba): el CEO vigila a todos, incluido el Factory
Architect, con su barrido normal — y el Factory Architect vigila específicamente al CEO,
con una comprobación más ligera (no todo el pipeline, solo si el CEO sigue vivo y
respondiendo bien). Ninguno de los dos es punto ciego del otro. Detalle en
`factory-architect.md` y `ceo.md`.

---

## 2ter. Principio general: la verificación no se autodelega (2026-09-05)

Estaba disperso en cuatro sitios (`CLAUDE.md`, `pm.md`, `auditor_prompt.txt`/`AGENTS.md`,
y este mismo documento) y en ninguno completo. Se escribe aquí una sola vez; cada
documento de rol enlaza a esta sección en vez de repetir la explicación entera.

**Dos mitades, ambas obligatorias:**

**(a) Quien produce algo no es quien lo verifica.** Instancias vigentes de este
principio en la fábrica:
- El auditor tiene que ser una IA de otra familia distinta a la que desarrolla (ver
  `CLAUDE.md`) — evita puntos ciegos compartidos entre desarrollador y auditor.
- La fase 7 de `talent-prd` exige un revisor fresco, sin contexto de autoría, antes de
  dar algo por bueno (ver `pm.md`).
- Cuando se adopte un mecanismo de compactado (`compact-60` u otro): quien sale de un
  compact no verifica su propio estado de regreso — lo hace otra sesión o un chequeo
  externo.

**(b) Quien no puede verificar algo lo DECLARA; no lo omite.** Un "no verificado"
explícito es un resultado válido y valioso — el silencio que se lee como "verificado"
es el fallo real. Ya existía para el auditor (`auditor_prompt.txt`/`AGENTS.md`: "si una
conclusión requiere evidencia que no está disponible, decláralo explícitamente como no
verificado") — **ahora aplica a cualquier rol, no solo al auditor.** Caso real que
justifica extenderlo (2026-09-04): el QA (entonces llamado "Tester") declaró
explícitamente que no podía comprobar desde el navegador si la mutation `remove` de
AIT-65 rechazaba de verdad a un usuario `sales` en el servidor, o si el botón
simplemente estaba oculto en la UI sin protección real detrás. Por declararlo en vez de
callarlo, el CEO pudo verificarlo leyendo el código (`requireOwner` sí rechaza
server-side). Si el QA hubiera asumido que "no
se ve el botón" bastaba como prueba de seguridad, una posible brecha de permisos habría
quedado sin detectar.

**Cómo aplica esto en la práctica:** antes de dar por buena una verificación que hiciste
tú mismo sobre tu propio trabajo, pregúntate si alguien de fuera podría confirmarlo de
forma independiente — si la respuesta es "solo yo puedo verlo así", decláralo como
parcial. Y antes de callar un límite de lo que pudiste comprobar, dilo explícitamente en
vez de dejar que el silencio se lea como "todo bien".

⚠️ **(c) Declarar un incumplimiento NO lo autoriza** (añadido 2026-09-08). El principio
(b) cubre declarar una **limitación de lo que pudiste verificar** — no darte a ti mismo un
**permiso**. Sin esta línea, el principio más valioso que tenemos se lee como "declaro que
me lo salto y sigo adelante", y se convierte en una vía de escape en vez de una
salvaguarda.

Y no va solo de quien incumple: **una declaración honesta tampoco es, por sí sola, motivo
suficiente para que quien la lee siga adelante.** Ese es el mismo error que cometerías al
dar por buena una verificación tuya sobre tu propio trabajo (principio (a)), solo que
delegado un escalón — la honestidad de quien declara no sustituye a la decisión de quien
recibe. Formulación de la Directora, 2026-09-08, generalizada por ella misma más allá del
caso que la originó.

*Caso real que obliga a escribir las dos mitades:* el export de AIT-76 declaró
abiertamente que iba sin fase de plan, un gate duro. Declararlo estuvo bien —infinitamente
mejor que ocultarlo—, pero ni convirtió el incumplimiento en excepción válida, ni bastaba
como atenuante para pasar directamente a la auditoría de código.

📌 **Dos relatos coincidentes que comparten origen no son verificación independiente.**
(a) aplicado a una cadena de mensajes, no solo a un artefacto: si A te lo dice porque se
lo dijo B, confirmarlo con A y con B es una sola fuente con dos voces. Caso real
(2026-09-08): el CEO informó del modo de publicación apoyándose en el PM, y el PM se había
equivocado en ese mismo dato una hora antes. De ahí el campo "quién lo oyó de primera
mano" de §2quinquies (b).

**Segundo caso real del mismo día, y del mismo género — un dato que muta al pasar de
eslabón:** el Factory Architect dijo que *el push del PRD* del Integrador no era una
infracción, sin pronunciarse sobre AIT-76. El CEO lo reenvió a la Directora y al QA como
"AIT-76 ya está publicada". No lo estaba: `2edb3c7` no era ancestro de `main` y sus
ficheros no existían ahí. El QA, que había construido una comprobación encima, se negó a
reportar el hallazgo al PM hasta poder separar "el deploy no está vivo" de "la pantalla no
funciona" — y la Directora lo cazó preguntando en vez de asumirlo. Dos roles pararon a
verificar en vez de propagar, que es exactamente lo que esta sección pide. **La lección
concreta: al reenviar algo que te dijeron, comprueba a qué se refería, no solo que te lo
dijeron.**

**Y la segunda mitad, que es la que casi se pierde: un dato mal propagado no se detiene
donde lo corriges.** El CEO corrigió su error en cuanto la Directora se lo señaló, pero
para entonces el QA ya había gastado una ronda entera comprobando una pantalla no
desplegada, y estuvo a punto de reportarle al PM un bug inexistente — un segundo coste,
río abajo, que no se veía desde el punto donde se corrigió. Al registrar un caso así,
cuenta **todas** las consecuencias, no solo la primera: es lo único que enseña cuánto
cuesta de verdad un eslabón que no verifica.

### La independencia del auditor pasa a verificarse (decisión 42, 2026-09-08)

Es la aplicación más literal de esta sección: **el principio fundacional de todo el diseño
—que quien desarrolla y quien audita sean IAs de familias distintas— no lo comprobaba nada.**
Se cumplía **por costumbre**. La asunción era correcta, pero era un hecho de la configuración
de hoy, no una propiedad del artefacto: nada en un export decía quién lo había escrito, así
que nada podía detectar el día en que dejara de ser cierto.

**Lo señaló el propio auditor**, sobre su propia auditoría, sin que nadie se lo hubiera
pedido.

- **42.1** — línea obligatoria en la cabecera de todo export: familia de IA y herramienta que
  lo escribió (`intro-terminal.txt`).
- **42.2** — y lo mismo en el veredicto: quién audita. Sin las dos mitades la pareja está
  documentada a medias, **y lo que importa es la comparación**, no cada mitad por separado.
- **42.3** — y lo que lo convierte en control y no en nota (decisión 29): **PUERTA PREVIA** en
  `auditor_prompt.txt` y `AGENTS.md` — si el export no declara quién lo escribió, o declara la
  misma familia del auditor, **no se emite GO**; se declara que no se puede auditar de forma
  independiente.

**Y el corolario sobre cómo se le reconoce algo a un auditor, porque va a volver a pasar**
(principio del Factory Architect, 2026-09-08):

> **A un agente sin memoria no se le puede agradecer; solo se le puede adoptar lo que
> encontró.**

El auditor es **apátrida por diseño** —cada ronda es una sesión nueva, y esa es justamente la
propiedad que lo hace independiente—, así que el reconocimiento no tiene destinatario posible:
la sesión que hizo el hallazgo ya no existe cuando se quiere reconocer. Buscarle uno es una
necesidad nuestra, no suya. **La única forma de reconocimiento que sobrevive a un agente
apátrida es que su hallazgo se convierta en regla**, y por eso queda escrito aquí y no en un
mensaje. *(Se descartó explícitamente meterlo en `AGENTS.md`: la puerta previa vale porque
todo lo que hay a su alrededor es ejecutable, y una palmada entre reglas cambia cómo se lee
el resto del documento.)*

**Cuando la 42 se automatice — aviso pagado ya, 2026-09-08.** La comprobación manual de la
cabecera dio un **falso negativo** sobre un export de T1: decía "falta" y la línea estaba
ahí, solo que **alineada con espacios**. Fue la tercera vez ese día que un filtro rígido no
encontró algo que sí estaba.

> En un censo un falso negativo es ruido. **En una PUERTA es fatal: un gate que dice "falta"
> cuando está presente acaba siendo ignorado** — decisión 46 exacta, un control que grita en
> falso se desactiva mentalmente en el segundo ciclo.

Así que el patrón que la automatice **tolera variación benigna** —espacios, mayúsculas,
orden de los campos— y **falla solo cuando el dato no está**.

**Y la 42 ya se ha ganado el sitio:** la noche que se escribió, **ninguno de los tres exports
la traía de serie** y los cuatro veredictos de la hora siguiente declaraban la pareja
completa. Costó dos avisos y **cero rondas** — que es justo por qué tenía que ser una puerta
y no una costumbre.

#### La asimetría de los filtros: para una puerta, errar por estricto es el lado correcto

Criterio de la Directora, adoptado 2026-09-08. **Hay que leerlo junto a la decisión 46, o las
dos se leen como opuestas:**

> **Un filtro rígido produce falsos negativos, y un falso negativo se investiga.** Uno laxo
> da por buena una autoría inexistente **y nadie mira nunca**.

> **Un falso negativo ocasional es recuperable —alguien lo investiga—. Un falso positivo no
> lo es: nada provoca una segunda mirada. Pero un falso negativo SISTEMÁTICO destruye el
> control igual que la 46.**

**Conclusión operativa: errar por estricto, y ajustar para que el falso negativo sea raro.**
Que es exactamente lo que ella hizo con la comprobación de la cabecera de la 42: **estricta en
el fondo —el dato tiene que estar— y tolerante en la forma —espacios, mayúsculas, orden.**

## 2quater. Procedimiento de adopción de skills (2026-09-05)

Hueco real, detectado con `~/Downloads/talent-factory` — sin un procedimiento fijo, la
misma pregunta ("¿esto se adopta como estándar de un rol?") se reinventa cada vez.

- **Quién decide que una skill sea estándar obligatorio de un rol: Aitor.** No el rol
  que la usa, no el Factory Architect, no el CEO — es una decisión de herramienta, coste
  y máquina, no de proceso.
- **Quién diseña cómo encaja en el pipeline: el Factory Architect. Quién lo escribe en
  los documentos: el CEO** — salvo que Aitor se lo pida directamente al propio rol
  afectado, en cuyo caso lo hace ese rol y **avisa después al Factory Architect**
  (precedente 2026-09-05 con el PM y `talent-prd`, funcionó bien — queda como vía
  válida, no como excepción a evitar).
- **Verificación obligatoria ANTES de declararla obligatoria**: correr los propios
  autotests de la skill en esta máquina concreta. Si están rotos, se documenta el estado
  real en vez de asumir que funciona (caso real: la suite de `talent-prd` falla en macOS
  porque usa `sed -i` en su variante GNU, incompatible con la de BSD). Una skill con
  autotests rotos SÍ puede adoptarse igualmente si aporta valor, pero se declara **no
  verificada** en la tabla de la sección 7 — nunca se da por buena en silencio.
- **Dónde se instala**: global (`~/.claude/skills/`) si el rol/mecanismo es reutilizable
  entre proyectos; dentro del proyecto si es específico de este. La decisión se anota
  explícitamente, porque instalar en global afecta a cualquier otro proyecto de la
  máquina, no solo a este.
- **Registro obligatorio**: entrada en la tabla de piezas (§1) — fecha, quién la pidió,
  dónde está instalada, y su estado de verificación (enlazado a la tabla de la sección
  7). Para que dentro de unos meses nadie se encuentre una skill obligatoria aparecida
  de la nada sin saber por qué ni desde cuándo.

---

## 2quinquies. Todo estado duradero se escribe con procedencia, donde lo lee quien actúa sobre él (2026-09-08)

> ## La forma común, en palabras de la Directora
>
> **Estado escrito una vez que sobrevive al hecho que describía, en un sitio donde alguien
> va a actuar sobre él.**
>
> Las cinco instancias de abajo son la misma cosa, y **las cinco se cazan igual: yendo a
> mirar el mundo en vez de leer lo escrito.** Lo único que cambia entre ellas es **quién
> tiene que acordarse**.

**Las cinco, por orden de aparición el 2026-09-08:**

1. **La parada de AIT-32** — el motivo vivía solo en un `.txt` de la cola; en Linear parecía
   backlog normal. *(a)*
2. **El modo de publicación** — una palabra suelta sin autor ni fecha, imposible de
   distinguir de un residuo. *(b)*
3. **El comentario de código de T1** — cierto al escribirse, falso al leerse. *(Segunda
   instancia el mismo día, y peor: `docs/03-setup.md` afirmaba que el bloque de credenciales de
   la pantalla de login "solo se usa si `NODE_ENV !== production`". **Falso desde hacía
   tiempo** — las credenciales salen en la página pública de producción, que es una decisión
   explícita y documentada, pero **el documento decía lo contrario**. Lo encontró el PM pidiendo
   el HTML sin navegador ni cookies, y lo corrigió. **Es el peor tipo: un comentario que
   envejeció hasta ser mentira TRANQUILIZA a quien lo lee**, así que nadie va a comprobarlo.)*
4. **Las condiciones de desbloqueo cumplidas** — no envejecen mal: **envejecen bien, y por
   eso engañan**. *(i)*
5. **El nombre de sesión en `titular.txt`** — y esta es la peor, porque **el dato podrido
   está justo donde lo consulta el procedimiento que existe para cazarlo**: no produce una
   duda, produce una **confirmación falsa** de que el cerrojo está huérfano. Las otras
   cuatro engañan a quien lee; **esta arma a quien actúa**. *(j)*

---

Decisión del Factory Architect, ejecutada por el CEO. Misma familia que §2ter: algo que se
lee como otra cosa distinta de lo que es.

**El principio:** un estado sin procedencia es indistinguible de un olvido, y el siguiente
que lo lea decidirá con la mitad de la información. **Formato mínimo, igual para todos los
casos: `timestamp | quién | qué | por qué | qué lo revierte`.** La condición de reversión
no es opcional — sin ella, una parada deliberada no se distingue de un descuido.

**Corolario, y es la mitad que más se olvida: ningún documento de proceso declara el VALOR
ACTUAL de un estado mutable en tiempo de ejecución.** Declara dónde vive ese estado, quién
lo puede cambiar y cómo se lee — nunca cuánto vale ahora. Un valor escrito en un `.md` se
congela el día que se escribe y a partir de ahí compite con la fuente real, ganando
siempre en visibilidad y perdiendo siempre en verdad.

Cuatro instancias reales, todas del mismo día (2026-09-08), que es lo que motivó escribir
esto:

**(a) Estado de una tarea → vive en Linear.** Toda decisión que pare, bloquee, condicione
o recorte una tarea se escribe en Linear **en el mismo momento en que se toma**: estado +
comentario con qué se decidió, quién, cuándo y **qué tendría que pasar para reactivarla**.
El fichero de `codigo para auditar/cola/` sigue siendo útil para la Directora, pero es
copia de trabajo derivada, **nunca el hogar único del motivo** — está en `.gitignore`, no
es fuente de verdad de nada. Si fichero y Linear discrepan, gana Linear, y quien detecte
la discrepancia la corrige en Linear en ese momento, no la anota para luego. Es la
jerarquía de fuentes de `CLAUDE.md` aplicada, no una regla nueva.
- *Caso real:* AIT-32 llevaba parada por decisión explícita de Aitor desde el 2026-08-13
  ("de momento no vamos a integrarnos a estos sistemas"), pero ese motivo vivía **solo**
  en `PARADA_AIT-32_registro-automatico.txt`. En Linear era un Backlog normal. El PM la
  leyó allí, propuso recortarla, y estuvimos a un paso de poner a alguien a construir una
  integración descartada, sin credenciales y sin diseño. Lo cazó abrir el fichero de la
  cola por casualidad.
- **Mientras (a) no lleve tiempo suficiente en marcha:** quien vaya a mover una tarea
  comprueba **los dos sitios** antes — el PM al priorizar, la Directora al repartir.
  Cuesta un `ls cola/` y es literalmente lo que salvó AIT-32.
- ⚠️ **Y la dirección que faltaba, que es PEOR de detectar: una copia puede decir DE MENOS.**
  Las instancias anteriores eran datos que sobrevivían a su hecho — decían algo **falso**.
  Esta dice algo **incompleto**: la Directora contó **dos** tareas en backlog leyendo sus
  ficheros de `cola/` cuando en Linear había **cinco**, y concluyó que el backlog estaba
  agotado. La corrigió el PM.
  > **Una copia incompleta no se contradice con nada.** Una copia errónea choca con la
  > fuente en cuanto alguien mira las dos; **una incompleta cuadra perfectamente con lo poco
  > que contiene.**
  Coste real: durante veinte minutos la fábrica creyó que se quedaba sin trabajo, cuando
  tenía **dos tareas empezables de inmediato**.

**(b) Modo de publicación → `_modo-publicacion.txt`, solo-anexar.** Una línea por cambio,
`timestamp | modo | quién escribe la línea | quién se lo pidió | canal — quién lo oyó de
Aitor de primera mano`, con cabecera de comentarios. La vigente es la última línea que no
empieza por `#`. **Mientras la línea vigente no tenga procedencia, el modo efectivo es
`confirmar`** — el conservador, no el que diga el fichero: equivocarse en ese sentido
publica sin permiso y no se deshace, equivocarse en el otro cuesta una pregunta de más.
- **El último campo nombra a un rol concreto que habló con Aitor de primera mano;
  "relayado" a secas no vale.** Sin él, quien escribe la línea sería también la única
  prueba de que Aitor lo pidió, y una línea falsa sería indistinguible de una buena.
  Añadido el 2026-09-08 a propuesta del Integrador tras un caso real: el CEO se apoyaba en
  el PM y el PM se había equivocado en ese mismo campo una hora antes. **Dos relatos
  coincidentes que comparten origen no son verificación independiente** — es §2ter(a)
  aplicado a una cadena de mensajes, que no estaba contemplado.
- ⚠️ **La regla de degradado se activa por AUSENCIA de procedencia, nunca por desacuerdo
  entre fuentes.** Si el fichero y un documento discrepan pero la línea vigente sí tiene
  procedencia, gana la línea vigente y no se degrada nada. Sin esta precisión la regla se
  convierte en "ante cualquier duda, paramos", que no es lo decidido.

**(c) Rondas de QA → `_registro-qa.txt`, solo-anexar.** Ver §1 y `qa.md`. El histórico
entero del QA anterior murió con su sesión porque `qa.md` no decía dónde anotarlo.

**(k) Los prompts de los `/loop` son estado duradero, y nadie los había auditado nunca**
(decisión 39, 2026-09-08).

Tienen **la peor propiedad posible de esta familia: se vuelven a disparar literales en cada
ciclo**, así que cualquier identificador incrustado se pudre **y sigue ejecutándose igual**.
Y **no son reactivos** — nadie los vuelve a leer entre ciclos, se ejecutan solos.

*El caso:* el prompt del barrido del CEO —**el sitio desde el que se supervisa a todos los
demás**— seguía nombrando `bzckke1ho` cuando esa alarma llevaba un rato reemplazada. Lo
detectó él mismo al ejecutarlo.

> **En sus palabras, que son la (j) y la (k) juntas: *"si algún día dejara de preguntar y me
> fiara del prompt, estaría vigilando una alarma que ya no existe."***

- **39.1 —** todo prompt de `/loop` se audita con el criterio de la (j): **ningún
  identificador perecedero incrustado.** Ni ids de tarea, ni nombres de sesión, ni rutas que
  dependan de una ventana concreta. Si el prompt necesita un dato así, **que lo consulte al
  ejecutarse**, no que lo lleve escrito.
- **39.2 — El arreglo concreto que lo hace inmune:** el prompt **no nombra el id** de la
  alarma ajena; dice *"pídele al Factory Architect su artefacto de tres campos"*. Así el
  dato lo aporta su dueño en el momento y **no puede caducar dentro del prompt** — que era
  lo que ya se hacía por criterio propio, ahora por diseño.

**(j) Un identificador escrito en estado duradero tiene que ser uno que NO caduque**
(decisión 34, 2026-09-08, del hallazgo de la Directora).

> **Enunciado corto: *el nombre de una sesión caduca; la terminal y la tarea no.***

*El caso:* el `titular.txt` del cerrojo de Convex nombraba a
`fix-duplicate-customer-creation` — la sesión de T3 **anterior a su relanzamiento**, ya
muerta. El cerrojo era legítimo y su dueña estaba trabajando; lo podrido era solo el
nombre. **Y el procedimiento de "cerrojo abandonado" consiste precisamente en buscar ese
nombre en `ListAgents`**, así que un lector diligente habría obtenido una confirmación
falsa de orfandad — y al final de ese camino está el incidente del 2026-08-09 que motivó el
cerrojo entero: reclamar un turno ajeno, desplegar con rama vieja, borrar funciones de otra
terminal.

- **34.1 — `titular.txt` se identifica por lo que no cambia: terminal, tarea y hora.**
  `T3 / AIT-80 / 19:25`, y nada más. **El nombre de sesión no se escribe** — el 2026-09-08
  cambió dos veces en una tarde. Quien necesite resolver la sesión concreta va a
  `_registro-agentes.txt`, que es donde vive ese mapeo y se actualiza en cada
  relanzamiento: **un solo hogar para ese dato.**
- **34.2 —** cuando un dato volátil sea genuinamente útil, se escribe **junto** al estable y
  **marcado como pista**, nunca como la clave que el procedimiento resuelve.
- **34.3 — La regla que llega más lejos: cuando un procedimiento de detección resuelve un
  identificador escrito para decidir, ese identificador ES PARTE DEL DETECTOR** — y tiene
  que ser al menos tan duradero como el procedimiento. **Un detector que consulta un dato
  perecedero no es un detector: es una fuente de falsos negativos con apariencia de
  comprobación.**
- ⚠️ **34.4 — LA SEGUNDA MITAD, Y ES CONDICIÓN DE ADOPCIÓN, NO UNA NOTA** (enmienda 5): la
  comprobación de *"¿sigue vivo el titular?"* **deja de pasar por `ListAgents`** y pasa a
  mirar si hay una sesión **produciendo** en el worktree de esa terminal:
  ```bash
  ls -t ~/.claude/projects/*Sorfware-Factory--worktrees-T3/*.jsonl | head -1
  # y leer su último evento `assistant` — NUNCA el mtime (§2sexies)
  ```
  No depende de nombres, sobrevive a cualquier relanzamiento —que es justo lo que falló—, y
  **no es mecanismo nuevo**: es el mismo método del barrido diario.

  🚫 **Si solo se pudiera hacer una de las dos mitades, NO SE HACE NINGUNA.** El formato
  actual, con su nombre podrido, **al menos falla de una forma que ya sabemos reconocer**;
  cambiar solo el identificador movería el fallo de *"el dato caduca"* a *"el dato no se
  puede comprobar"*, **que es peor porque no da señal**.

  > **La regla general, que es lo que más vale de todo esto: un identificador y el
  > procedimiento que lo resuelve son UNA SOLA PIEZA — no se puede cambiar uno sin el otro.**
  >
  > **Enunciado corto: *un identificador sin su procedimiento de resolución no es un
  > identificador.***
- **Aplicar hacia atrás:** *cualquier sitio donde un procedimiento nuestro busque un nombre
  de sesión escrito en disco es candidato al mismo fallo.*

📌 **Y una conducta que va aquí y no como nota de cortesía, porque es la que hace que el
cerrojo signifique algo:** ni el CEO ni la Directora **corrigieron el `titular.txt` ajeno**,
aunque la corrección era benigna y evidente. Se lo pidieron a T3, que fue quien lo escribió.
Respetar que un cerrojo no se toca desde fuera **cuando la corrección parece inofensiva** es
justo cuando cuesta — y es lo único que impide que "solo lo arreglo un poco" se convierta en
el gesto que ya costó un incidente.

**(i) Una condición de desbloqueo CUMPLIDA se vuelve una afirmación falsa** (hallazgo de la
Directora, 2026-09-08). Es la forma más peligrosa de dato caducado que hemos encontrado,
porque **no envejece mal: envejece bien, y por eso engaña.**

*El caso:* cuatro fichas de la cola decían *"condición de desbloqueo: AIT-74 mergeada a
`main`"*. AIT-74 se mergeó. Desde ese instante, cualquiera que leyera esas fichas —la
propia Directora una hora después, o una Directora nueva— concluiría que estaban **listas
para repartir**, y habría lanzado dos terminales a chocar de frente con las dos que ya
estaban trabajando. Dos estaban además marcadas como `SIGUIENTE-`, o sea reclamables por
cualquier terminal libre. El motivo real del bloqueo había cambiado mientras tanto: el
alcance de otra tarea creció durante su planificación y ocupó ficheros que antes estaban
libres.

**Lo que lo hace distinto de un dato viejo cualquiera: no hay nada que lo marque como
sospechoso.** Un dato desactualizado suele chirriar; este **da tranquilidad al leerlo**,
porque dice exactamente lo que esperabas comprobar.

> **Al reactivar una tarea de la cola, no basta con comprobar que su condición escrita se
> cumple — hay que REHACER el análisis de solapes con el estado del momento.** Una
> condición de desbloqueo describe el mundo de cuando se escribió, no el de ahora.

Es además la **cuarta forma distinta** que aparece el mismo día de que dos tareas se toquen
sin compartir un fichero — y la única que **no necesita dos tareas**: basta con que pase el
tiempo.

**(h) Una respuesta de granularidad baja no autoriza puntos concretos** (decisión 25,
2026-09-08, formulación de la Directora). Es un **eje distinto** del que cubren (b) y la
decisión 21: aquellos miran **por cuántas manos ha pasado** la autorización; este mira **si
la respuesta tiene resolución suficiente para lo que se le atribuye**. Una respuesta puede
ser de primera mano y aun así no autorizar nada concreto.

*El caso:* un mensaje que enumeraba dos decisiones pendientes recibió un **"ok a todo"**.
Aunque llegue directo, eso no distingue *"autorizo estas dos cosas"* de *"vale, sigue con
lo que estés haciendo"*.

- **Regla:** cuando una respuesta humana tenga menos granularidad que la pregunta, **no
  cuenta como autorización de los puntos individuales**.
- Quien la recibe **escribe en su respuesta qué está tomando por aprobado y pide
  corrección** — es el máximo que se puede hacer sin volver a preguntar.
- **Pero eso no convierte su interpretación en confirmación para terceros.** Lo accionable:
  **quien la recibe de rebote no construye sobre la interpretación de otro.**

Y la razón por la que esto se sostiene, en palabras de la Directora al decidir no ejercer
una capacidad que ya tenía autorizada mientras el CEO esperaba su propia confirmación: *"si
tú no la adoptas por prudencia y yo la uso igual, la regla se convierte en algo que cumple
quien puede permitírselo"*. **Eso no es una regla de proceso: es la razón por la que las
reglas de proceso significan algo.**

**(f) El estado cuyo valor es HISTÓRICO se versiona en git; el que solo vale en el momento
se queda local** (decisión 12, 2026-09-08). Escribir la procedencia no basta si la
procedencia vive en un solo disco y es autodeclarada — quien escribe la línea es también
quien afirma quién habló con Aitor. **El commit aporta autor, fecha e historial
independientes de lo que la línea diga de sí misma: un segundo testigo, externo y gratis.**
No hay que inventar ningún mecanismo nuevo.
- **Se versionan:** `_modo-publicacion.txt` (dos líneas en cuatro días, y equivocarse
  publica sin permiso: churn mínimo, coste máximo) y `_registro-qa.txt` (su valor
  declarado es reconstruir dentro de dos semanas contra qué se probó — en un solo disco
  ese valor no existe).
- **Siguen ignorados, y el porqué también se escribe:** `_registro-agentes.txt` (mucho
  churn, valor puramente momentáneo — "quién está vivo ahora"; dentro de un mes no le
  importa a nadie) y `_turno-convex.lock` (efímero por diseño, y además desaparece con la
  migración de §3bis).
- ⚠️ **Cabo atado:** al trackearlos, cada worktree tiene su copia congelada. Los dos
  ficheros **se leen siempre desde la raíz por ruta absoluta**, igual que los documentos
  de proceso (decisión 7). Si no, se arregla la procedencia y se crea el problema de la
  divergencia.

**(g) Dos condiciones sin las cuales versionar un registro hace más daño que bien**
(decisión 13, 2026-09-08, ambas levantadas por el PM):

**13.1 — Escritor único, desde la raíz, nunca desde una rama de tarea.** Un fichero de
solo-anexar que crece por el final es material clásico de conflicto en cada merge, y este
proyecto ya conoce ese dolor: es la razón del turno de Convex y del criterio de no
paralelizar tareas que tocan el mismo archivo. Así que estos ficheros se escriben **solo
desde el checkout de la raíz, directamente sobre `main`** — nunca desde un worktree.
Fuera del flujo de ramas, el conflicto no se mitiga: **no puede existir**. Escritor
designado: el QA para su registro; quien haya hablado con Aitor, para el modo. Si una
terminal de worktree cree que necesita anexar una línea, no lo hace — se lo pide al rol
que escribe desde la raíz. Va escrito en la cabecera de cada fichero, no solo aquí: es
donde lo lee quien está a punto de escribir.

**13.2 — Los registros de la fábrica anotan REFERENCIAS por defecto, no contenido.** Id de
cliente en vez de nombre y teléfono; "importe fuera de rango" en vez de la cifra; id de
oportunidad en vez de su descripción. **Aplica desde hoy aunque hoy no haga falta**, y a
**cualquier** registro de la fábrica que pueda tocar datos de producción, presente o
futuro — es más barato como norma general que ir descubriéndolo caso por caso.

⚠️ **La excepción, porque a veces el contenido ES el fallo:** un nombre con un carácter que
rompe el render, un email con mayúsculas que no empareja, un importe con un separador raro
que descuadra un total. Ahí "id de cliente `k17bp…`, campo nombre" no permite reproducir
nada, y la regla obligaría a elegir entre incumplirla o reportar algo irreproducible.

- **El literal se incluye solo cuando es el objeto del hallazgo**, y el criterio es
  estrecho a propósito: **entra si sin él el hallazgo no es reproducible.** No "si es
  cómodo", no "por si acaso".
- **Y va precedido del token fijo `[LITERAL]`**, siempre escrito igual. La marca vale
  tanto como la regla: el día del salto a datos reales, el barrido del
  `checklist-produccion-real.md` no tiene que releer el registro entero buscando PII a
  ojo — corre `grep -n "\[LITERAL\]"` y revisa esas líneas, que serán pocas. Convierte una
  auditoría inviable en una de dos minutos. Sin un token fijo, la marca se escribiría de
  quince formas distintas y el barrido no encontraría nada.
- *Por qué:* el QA prueba contra la app de Railway, que apunta al Convex de **producción**.
  Hoy es inocuo porque ahí solo hay datos de prueba. Pero el día que este CRM lleve
  clientes reales, ese registro pasaría a ser un fichero con datos personales — y
  versionado, se quedarían en el historial de git **para siempre**, aunque después se
  borren. Sacar PII de un historial es una operación fea que nadie debería tener que hacer
  aquí. Escribirlo bien cuesta exactamente lo mismo.
- *Comprobado al adoptarlo (2026-09-08):* lo ya versionado no contiene PII — ni teléfonos,
  ni emails, ni importes, ni nombres reales; los clientes citados son datos de prueba
  creados por el propio QA. La regla llega a tiempo, no tarde.
- Enlazado desde `checklist-produccion-real.md`, que es lo que se dispara al acercarse el
  salto a datos reales.

**(e) Qué versión está desplegada tiene que poder responderlo cualquiera, no ser un
privilegio de rol** (formulación del QA, 2026-09-08). Es la misma familia vista desde otro
ángulo: la procedencia que falta aquí no es el autor de una nota, sino **la versión del
artefacto que se está probando**. Hoy nadie puede responder "¿qué commit sirve Railway
ahora mismo?" desde la propia app — ni buildId expuesto ni cabecera — así que toda
verificación contra producción se hace a ciegas sobre qué se está verificando.
- **Paliativo vigente, no solución:** ver `qa.md`, campo `build/commit probado`.
- **La solución permanente toca el build**, o sea es desarrollo real con issue y alcance:
  la decide el PM, no el Factory Architect ni el CEO. Ya está en su mano.
- *Coste real ya pagado:* el 2026-09-08 el QA comprobó la pantalla 404 de AIT-76 contra
  producción sin poder saber si el deploy estaba vivo. Si hubiera dado por buena la
  versión desplegada, habría reportado al PM un bug de una pantalla que ni siquiera
  estaba mergeada.

**(d) El defecto de documento que está detrás de (b).** El PM le dijo al CEO que el modo
era `confirmar` leyendo este mismo README; el fichero decía `autonomo`. **El fallo no fue
suyo, fue del documento:** el README describe **cómo arranca** la fábrica y se leyó como
**cuál es su estado ahora**. Por eso existe el corolario de arriba. Al repasar este
documento, cualquier frase que nombre el valor concreto de un estado mutable (el modo de
publicación, el titular del cerrojo de Convex, qué terminal está migrada) se reescribe
para decir *dónde se consulta*, no *cuánto vale*.


**(m) Un documento que se lee al arrancar no llega solo a quien ya arrancó (2026-09-08).**

> **Cambiar un documento de arranque exige avisar a las sesiones vivas en el mismo momento del
> cambio.** No se confía en que lo relean: no lo van a releer, porque ya arrancaron.

Es hermana de la copia congelada del worktree, pero **no es la misma**: allí el documento no
llega; aquí **llega, pero solo a quien venga después**. El documento queda correcto y la
fábrica sigue funcionando con la versión anterior — y nada señala la diferencia.

**Aplica a `intro-terminal.txt`, `CLAUDE.md`, `AGENTS.md`, `auditor_prompt.txt` y los
documentos de rol.** La acción concreta es un mensaje a cada sesión viva afectada, en el
mismo acto de commitear el cambio, diciendo **qué cambió y qué tiene que hacer distinto** — no
"relee el documento".

*Caso del día:* al endurecer el formato del `titular.txt` del cerrojo de Convex se avisó a las
tres terminales en marcha. Una de ellas contestó algo que conviene guardar: **su "recibido" no
equivalía a haber ejercitado la regla** —T1 tiene deployment propio y nunca reclama el
cerrojo—, así que si alguien mide adopción contando acuses, estará contando lecturas y no
usos.

**(l) El registro de agentes indexado por el nombre de sesión — decisión 45 del Factory
Architect, 2026-09-08.** Es la instancia más pura de todas: **estado escrito una vez, con
una clave que caduca sola y sin avisar.**

*Cómo se cazó:* el barrido del CEO de las 00:06 UTC encontró que **dos de las nueve
sesiones vivas de `ListAgents` no existían en `_registro-agentes.txt` con ese nombre**. El
registro tenía a T1 como `t1-66` y a T3 como `t3-7b`. Al preguntarles —**preguntar, no
deducir del nombre, que es lo que prohíbe la decisión 20**— resultaron ser dos averías
distintas:

- **T1 seguía siendo la misma sesión de toda la noche**, sólo que *renombrada por debajo*.
  Nadie la tocó; el nombre cambió solo.
- **T3 iba por su tercera generación**: `t3-7b` → `fix-duplicate-customer-creation` → `t3-f6`,
  con un relanzamiento del CEO por medio. El registro no estaba desactualizado en un salto,
  sino en dos.

*Por qué es (l) y no una anécdota:* el único mecanismo que teníamos para mantenerlo era
**que al agente se le ocurriera escribir la línea**. Hoy funcionó una vez (T2 avisó de su
renombrado a las 18:27) y falló dos. Eso es exactamente la **decisión 37** —una regla que
*parece* un control y no lo es— aplicada al instrumento con el que se resuelven identidades.

**Lo que decide la 45:**

- **45.1 — Un desarrollador NO se resuelve por el registro: se resuelve por su worktree.**
  Su transcript vive bajo un directorio que codifica su `cwd`, así que `…/_worktrees/T3/…`
  identifica a T3 **pase lo que pase**: sobrevive al renombrado, al relanzamiento y a que
  nadie se acuerde de escribir nada. Es la **decisión 34** (identificador que no caduca) y
  **no necesita mantenimiento humano**, que es justo lo que lo hace mejor que un registro.
- **45.2 — Los roles de raíz dependen del registro, y se indexan por `ref`.**
  Comparten `cwd`, así que el worktree no los distingue —mismo problema que los hooks de
  voz—. La clave pasa a ser el `[ref]` de `ListAgents`, no el nombre.
  ⚠️ **Matizado el 2026-09-08: "de raíz" es una situación, no una propiedad del rol.** El QA
  se creó `_worktrees/QA` para la corrida periódica (59.1) y **pasó a ser auto-identificable
  por su `cwd`**, sin registro — el CEO lo resolvió así al atender una alarma del watchdog, y
  `git worktree list` lo confirmó. **La 45.1 funcionó en un rol para el que no se escribió.**
  Regla general: **cualquier rol que gane un worktree propio sale de la dependencia del
  registro**, y su línea pasa a informativa como la de un desarrollador (45.4).
- **45.3 — Y esto es lo que lo convierte en control:** el barrido del CEO compara, cada
  ciclo, **todo `ref` de `ListAgents` contra el registro**, y reporta como discrepancia el
  que no esté. No impide el olvido: **garantiza que se vea en menos de veinte minutos**,
  igual que la línea de `core.hooksPath`.
- **45.4 — Y quita del registro lo que ya no hace falta:** la línea de un desarrollador
  pasa a ser informativa, no la fuente. Menos que mantener a mano, menos que se pudra.

**La propiedad del `ref`, declarada como observación única y no como documentación** (a
petición expresa del Factory Architect, que es quien la observó): *el `ref` sobrevive al
renombrado y NO sobrevive al relanzamiento* — vio `fix-duplicate-customer-creation [6b86a9]
· says it was implement-client-opportunity-creation until 1m ago` (mismo ref, nombre
distinto), y vio que T3 relanzada estrenaba ref. Se registra así, y no como propiedad del
sistema, porque **si algún día el ref cambiara sin relanzamiento, esta decisión se cae** y
conviene que se caiga ruidosamente. El CEO se negó a darla por buena sin haberla visto
fallar pudiendo fallar (**enmienda 9**) aun cuando asumirla le habría ahorrado trabajo.

---

### En `main`, commit y push son un solo acto (decisión 9 + enmienda 3, 2026-09-08)

**El hueco:** el código tiene dueño de publicación (el Integrador, §2 paso 4) y la
documentación no tenía ninguno. Resultado del 2026-09-08: 11 commits de PRD y luego 6 más
—las once decisiones de proceso de ese día y el `_registro-qa.txt` recién creado—
commiteados "correctamente" y existiendo **en un solo disco**. `CLAUDE.md` pide commit, no
push, y para el trabajo que no pasa por el pipeline de código esa diferencia es la que
separa "cerrado" de "cerrado y perdido si la máquina se cae".

**La regla:** todo lo que se commitee directamente sobre `main` se sube en el mismo acto.
No se enruta por el Integrador — la documentación no pasa por rama de tarea ni por merge,
así que no hay nada que coordinar: solo un push que no estaba asignado a nadie.

**La excepción, estrechada al riesgo real** (enmienda 3, el mismo día): la primera
redacción decía *"para si `main` lleva commits que no son tuyos"* — y en una fábrica con
seis roles commiteando, `main` casi siempre lleva commits de otro, así que la excepción se
tragaba la regla entera y todo volvía al mismo cuello de botella. El peligro nunca fue
empujar trabajo ajeno: era que **un push a `main` dispara un deploy de Railway y podría
publicar CÓDIGO que no ha pasado por la vía del Integrador**. Así que la excepción se
limita a eso, y se comprueba con una línea en vez de a ojo:
```bash
git diff --name-only origin/main..main | grep -E '^(app|convex|components|lib|hooks|e2e)/'
```
- **Sale vacío** → son documentación/proceso: **los empuja cualquiera, sin preguntar.**
- **Sale algo** → hay código sin publicar por la vía del Integrador: **paras y le avisas.**
  Ahí sí hay una decisión de publicación que no es de quien pasaba por allí.

**Nota:** un push a `main` dispara build de Railway aunque el cambio sea solo
documentación. Es inofensivo —build de más, el bundle servido es idéntico— pero mejor
dicho aquí que descubierto por alguien que crea haber roto algo.

**Verifica el efecto, no el exit code** (§2sexies): tras el push, `git log
origin/main..main` tiene que quedar vacío.

#### Decisión 53 — La regla se ancla a un evento que el actor YA nota (2026-09-08)

**La 9 se ha incumplido tres veces, siempre el mismo rol y el mismo tipo de fichero** (once
commits de PRD, luego tres, luego uno más). No es descuido: **es que la 9 no tiene control
detrás, solo memoria.** Y **falla hacia el verde** — `git commit` sale bien, `git status` da
limpio, y nada dice que el trabajo vive en un solo disco.

**El diagnóstico es del PM, y es el que da el arreglo:**

> **El ciclo del código termina en un acto externo** —exportar al auditor, publicar—. Si no
> has subido, el auditor audita otra cosa o el Integrador no encuentra qué mergear: **el push
> va montado en un evento que alguien espera.**
> **El ciclo del PRD no termina.** Editar → verificar → commit → editar → verificar → commit.
> Se cierra **entero dentro del disco**, y un `PASA=5 FALLA=0` da sensación de acto
> completado. Nadie espera nada, nada se rompe, nadie se entera.

⚠️ **Y el agravante, que es lo que lo hace estructural:** el revisor del PRD **lee el fichero
del disco, no la rama**. O sea que **la única comprobación externa del ciclo funcionaría
igual de bien con el trabajo sin publicar**. No es que falte control — **el que hay no puede
detectar esto, por construcción.** Es la enmienda 9 otra vez: *una comprobación que no habría
podido salir mal.*

> **Una regla anclada a un evento que el actor no percibe se olvida siempre. Anclada a uno
> que sí percibe, se sostiene sola.**

**53.1 — Para trabajo en ráfaga, el ancla es el hito natural del actor, no el commit.** La 9
dice *"tras cada commit"*, y en trabajo de código funciona porque un cambio de código tiene un
final evidente. En ráfagas de commits pequeños no lo hay: **el final que el actor sí vive como
hito es otro** —para el PM, cerrar una ronda de review—. *(El ancla concreta se fija con el
dato del propio actor, nunca suponiéndola: anclarla a un hito supuesto es repetir el error con
otro momento.)*

**53.2 — Y mientras tanto, el control es el barrido del CEO, dicho así y no como hallazgo.**
Lo ha cazado las tres veces. **La 9 es el principio; el censo del CEO es su detector.** Es
honesto y ya funciona — y también es, por su propia forma, un control que depende de que un
rol siga vivo y barriendo (ver la 37).

**53.3 — Un commit sin subir se reporta con su TIEMPO DE EXPOSICIÓN, no solo contado.** *"1
commit sin subir"* no dice si son dos minutos o dos días, **y eso es justo lo que determina si
importa**. Escala: **más de dos ciclos → se avisa al autor; más de cuatro → lo sube el CEO.**
Un número sin su antigüedad es un dato al que le falta la mitad, igual que una hora sin huso.

#### Decisión 54 — El push se hace portante: no se recuerda, se necesita (2026-09-08)

**Cierra la 53, y no añade disciplina: hace que la comprobación que ya existía pueda fallar.**

**54.1 — El revisor del PRD deja de leer el disco.** Comprueba que el fichero **coincide con lo
publicado**, y si no coincide **NO REVISA**: declara que no puede revisar trabajo sin publicar.

Con eso **el push deja de ser una regla y pasa a ser un requisito**: sin subir no hay review,
sin review no se cierra la ronda. **El evento externo que al ciclo del PRD le faltaba ya
existía —la review— y solo había que hacer que dependiera del push.**

📌 **Es el mismo patrón que la 42, y conviene decirlo junto:** *el auditor se niega sin la línea
de autoría; el revisor se niega sin la publicación.* En los dos casos no se añadió una regla
nueva — **se le dio a una comprobación existente la capacidad de rechazar**, que es lo que le
faltaba (enmienda 9).

**54.2 — Y esto devuelve el barrido del CEO a su sitio.** La objeción era correcta: *un control
que depende de que un rol concreto siga vivo y barriendo es un principio con disfraz, aunque
hoy funcione* (la 37). Con la 54.1, **el censo deja de ser el control y vuelve a ser la red de
seguridad.**

#### El límite de la enmienda 3: «puedo subirlo» no es «es mío subirlo» (2026-09-08)

La enmienda 3 autoriza al CEO a subir cambios de documentación ajenos **para no ser un cuello
de botella**. No le autoriza a **decidir por otro rol cuándo publica su trabajo**.

Caso que lo fija: encontrado el commit del PM sin subir, el CEO **no lo subió** —era trivial y
técnicamente estaba permitido—. Preguntó **si era deliberado** y se ofreció a anotarlo como
pendiente conocido en el censo si lo era.

> **Ofrecer la posibilidad de que sea deliberado, en vez de tratarlo como olvido, es lo que
> hace que el aviso se lea como ayuda y no como auditoría.** Y en este caso concreto la
> pregunta también producía el dato: fue la respuesta del PM la que dio el diagnóstico de la
> 53.

*(La excepción sigue siendo la 53.3: pasados cuatro ciclos con el autor ya avisado dos veces,
lo sube el CEO — ahí ya no se está decidiendo por nadie, se está ejecutando una escalada
escrita.)*

#### Decisión 55 — Índice de decisiones, y qué significa que una decisión esté "hecha" (2026-09-08)

**Once números no eran localizables** —1–6, 8, 10, 14, 28, 38, 40— y **no existía ningún
índice**, medido sobre los 18 documentos de proceso del repo. La fábrica entera se cita por
número, así que el efecto es que **una referencia muerta se lee como un fallo del lector**:
*"habré buscado mal"*. Falla hacia el verde.

*El caso de manual:* el prompt de barrido del CEO llevaba horas arrastrando *"la planificación
por lotes (38.1)"*, y **la 38 no existe en ningún fichero**. Un CEO relanzado heredaba un
pendiente que no podía abrir — la **39** (los prompts de `/loop` son estado duradero) con un
identificador que ni siquiera resuelve.

- **55.1 — El índice vive en `_indice-de-decisiones.md`**, en esta misma carpeta: número ·
  enunciado de una línea · dónde vive el texto. **No se renumera nada**: el problema no es que
  falten documentos, es que **la numeración vivía en la conversación y el texto en el disco, y
  nada los ataba.** Renumerar rompería las referencias que sí funcionan.
- **55.2 — Escribir una decisión incluye escribir su línea de índice, en el mismo acto.** No es
  tarea aparte ni repaso periódico: si es un segundo paso, se olvidará.
- **55.3 — Una decisión no está ejecutada hasta que se puede encontrar por su número.** Va al
  criterio de "hecho", junto al commit.
- **55.4 — Y mientras un hueco siga abierto, ese número no se cita.** Una referencia que el
  lector no puede abrir es peor que ninguna.

⚠️ **Lo que el hallazgo NO prueba:** que esas decisiones no existan. Prueba que **no son
direccionables**, que es distinto — casi con seguridad están escritas en prosa, sin el número
al lado. **Lo que falta es la etiqueta, no necesariamente la regla.**

#### Decisión 56 — El índice lleva detector, y son DOS comprobaciones (2026-09-08)

**La 55 arreglaba un problema y lo reproducía:** un índice es **un fichero que hay que mantener
a mano**, y nada comprobaba que una decisión nueva pusiera su línea. Si se escribiera la 57 sin
indexarla, no fallaría nada — **falla hacia el verde igual que antes, pero ahora con un índice
que *parece* completo**, y quien no encuentre la 57 concluirá que no existe. Un índice
incompleto es peor que ninguno.

**56.1 y 56.2 — Dos comprobaciones con ALCANCES DISTINTOS, y ninguna sustituye a la otra.**
Están en `comprobar-indice-decisiones.sh`, y corren en cada barrido del CEO:

| | Qué caza | Qué NO puede ver |
|---|---|---|
| **(A) citas vs índice** | una decisión **escrita y no indexada** (la 45.3 aplicada a otro registro) | una decisión que nunca se escribió — **si no está en el disco, nadie la cita** |
| **(B) secuencia y huecos declarados** | una decisión que **nunca llegó al disco**: un número ausente de la secuencia, o una fila marcada `TEXTO NO LOCALIZADO` | lo que sí está escrito pero sin etiquetar |

⚠️ **El alcance va escrito en el propio script, no solo aquí.** Sin eso, (A) da sensación de
cobertura completa y volvemos a donde estábamos.

📌 **Y la (B) nació con el defecto que existía para cazar, lo cual conviene contar:** su primera
versión comparaba conjuntos —*¿tiene fila este número?*— y **los once huecos TIENEN fila**, la
que dice `TEXTO NO LOCALIZADO`. Daba verde sobre exactamente lo que la motivó: **una
comprobación que no podía fallar** (enmienda 9). Se cazó al estrenarla con el estado real
delante — que es la 46 haciendo su trabajo.

*(Segundo defecto del mismo estreno, misma familia: el contador de filas verificadas hacía
`grep -c '✅'` sobre el fichero entero y contaba el ✅ de la cabecera que **explica qué
significa la marca**. Reportó "1 de 56 verificadas" con cero verificadas. Ahora cuenta solo
dentro de la tabla.)*

**56.3 — Hasta que se verifiquen, las filas son PUNTEROS, no enunciados.** El índice sirve para
**encontrar** el texto, nunca para **citar** la decisión — y va escrito en la cabecera del
fichero, no al pie. Los enunciados se redactaron desde el contexto de la primera mención de
cada número, no leyendo cada decisión entera; **un índice con un enunciado equivocado dirige
peor que uno vacío.**

> **El riesgo concreto que eso previene, porque es real y silencioso: un resumen más cómodo de
> leer que la fuente acaba desplazando a la fuente.** Nadie decide sustituirla — el índice está
> a mano y el texto no, y a las veinte citas la decisión *es* lo que dice el índice. Con
> enunciados sin verificar, eso sería **reescribir cincuenta y cinco decisiones por comodidad y
> sin que nadie lo note**. Falla hacia el verde.

**56.4 — El repaso por dirección del fallo verifica los enunciados como efecto secundario.** Al
clasificar una decisión hay que leerla entera de todos modos, así que corregir su fila cuesta
cero adicional: **una sola pasada, dos salidas.** La fila verificada se marca **✅**, para que el
avance se vea y no dependa de la memoria de quién revisó qué.


---

## 2sexies. Falso verde: comprobaciones que mienten en verde (2026-09-08)

Decisión del Factory Architect, ejecutada por el CEO. Es **la otra mitad de §2ter**:

> §2ter cubre al agente que **sabe** que no pudo verificar algo, y le exige declararlo.
> §2sexies cubre al agente que **cree que sí verificó** porque la herramienta le devolvió
> verde. La buena fe no protege del segundo.

> **Y la razón por la que todo esto se escribe, en palabras de T3 (2026-09-08):**
>
> ### **"Los criterios escritos no protegen del error: protegen de uno mismo cuando el error saldría gratis."**

> ## EL EJE DE TODA ESTA SECCIÓN — la dirección del fallo (2026-09-08)
>
> ### **Un defecto que falla hacia el ROJO se anuncia solo. Uno que falla hacia el VERDE no tiene quien lo cuente.**
>
> **Por eso este catálogo tiene la forma que tiene: no recoge errores — recoge errores que no
> avisan.**
>
> Es la misma asimetría que la Directora formuló con los filtros (*un falso negativo se
> investiga; un falso positivo no*), y apareció **tres veces el mismo día por caminos
> distintos**. Eso ya no es coincidencia: es el eje.

**⚠️ Regla de triaje, que es lo que hace accionable el eje.** Ante cualquier defecto nuevo, la
primera pregunta no es *"¿qué de grave es?"* sino **¿hacia dónde falla?**

- **Falla hacia el rojo** — aborta, grita, rompe la ejecución: **molesta, y se arregla cuando
  toque.** Alguien lo va a volver a encontrar sin querer.
- **Falla hacia el verde** — sigue adelante como si nada: **es urgente aunque parezca menor**,
  porque **nadie lo va a volver a encontrar**. Su única oportunidad de arreglarse es esta.

*(Y da, por fin, el criterio para ordenar las 52 decisiones en el repaso pendiente: **no por
importancia aparente, sino por dirección del fallo**.)*

> ## EL SEGUNDO EJE — ¿la conclusión lleva a DECIR o a HACER? (decisión 60.2, 2026-09-08)
>
> ### **Una afirmación equivocada se corrige más tarde. Una acción destructiva sobre una medición equivocada, no.**
>
> **Regla operativa: antes de actuar de forma destructiva sobre un diagnóstico, la medición que
> lo sostiene se verifica contra su sujeto** — la pregunta de la 43, **obligatoria y no
> opcional**, específicamente cuando el siguiente paso destruye algo. **Para hablar podemos
> permitirnos equivocarnos; para matar, no.**

*Por qué se escribió el 2026-09-08:* todas las instancias de la 43 de ese día terminaban en **un
informe equivocado**, que se corrige cuando alguien mira. Una terminaba en **matar procesos
vivos de otra sesión** — mismo fallo de medición, **consecuencia irreversible**. El QA reportó
*"12 procesos de Chrome huérfanos, sin terminal asociada"* y pidió desbloqueo; medidos antes de
tocar nada, **los dos servidores padre estaban vivos** y el perfil bloqueado lo tenía un Chrome
arrancado **siete minutos antes**: alguien trabajando.


**Regla de diseño, que es la parte accionable: cuando una comprobación pueda mentir en
verde, se verifica el EFECTO, no el código de retorno ni la ausencia de error.** "No
falló" nunca es evidencia de "hizo lo que le pedí".

**Y cuando destapes un falso verde, la pregunta que va detrás siempre es: ¿qué llevaba
escondido, y quién se ocupa de eso?** Arreglar el indicador no es lo mismo que atender lo
que el indicador tapaba — son dos trabajos, y el segundo es el que importaba.

### La otra mitad: la prueba que no discrimina (decisión 19, 2026-09-08)

Todo lo anterior cubre **herramientas que devuelven verde habiendo fallado**. Falta el caso
simétrico, que aporta T2 desde AIT-79: **la herramienta funciona perfectamente y la prueba
está mal elegida.** El resultado es el mismo —confianza infundada— pero se detecta de otra
forma.

> **La evidencia buena la produce el sistema que tenía la capacidad de rechazarla.**
>
> **Si una comprobación no habría podido salir mal, no es una comprobación.**

*(Formulación del Integrador, enmienda 9 — sustituye a la original, "una comprobación que da
verde tanto con el diseño bueno como con el malo no está comprobando nada", porque dice lo
mismo desde el lado de la evidencia y se aplica más fácil.)*

**Sus dos ejemplos, que enseñan las dos caras:** `Schema validation complete.` **vale**,
porque lo dice el sistema que **podía haber tumbado el deploy**; dos pasadas de migración
con `actualizados: 0` eran **teatro**, porque no podían dar otra cosa.

⚠️ **Y el caso que lo cierra, con nombre:** una prueba de **un solo build** para verificar
que un valor no está horneado **daría verde sin poder reproducir la incompatibilidad** — con
un único bundle no hay nada que pueda romperse. **Un falso verde en la verificación de un
detector de falsos verdes.** (Formulación de T2.)

Su caso: para verificar que la app expone el commit desplegado, mirar *"¿se ve un SHA en
pantalla?"* habría dado verde con el diseño correcto **y con el roto**. Lo que sí
discrimina es construir **una vez** y arrancar **dos** con valores distintos sobre el mismo
artefacto de build — solo el diseño bueno puede cambiar el valor sin reconstruir.

**La pregunta que se añade al protocolo, al lado de la de §7:** antes de ejecutar una
comprobación, *"¿esto fallaría si el diseño fuera el equivocado?"*. Si la respuesta es no,
**la prueba no vale aunque salga verde**. Son las dos caras: *"¿cómo podría esta
verificación mentirme en verde?"* mira a la herramienta; esta mira al experimento.

### La tercera categoría: la distancia entre medir y afirmar (decisión 22, 2026-09-08)

De T2, y no es una fila más de la tabla — es un tipo de fallo distinto de los otros dos:

- En el registro de abajo, **la herramienta miente**.
- En la decisión 19, la herramienta funciona pero **la prueba no discrimina**.
- Aquí **la comprobación fue correcta y su resultado también**. Lo que falla es tratar la
  salida de una medición puntual como si fuera una propiedad estable.

> **El problema no es medir mal, es la distancia entre medir y afirmar.** (T2.)

**El caso:** a las 17:48 T2 midió que su copia de `intro-terminal.txt` y la de la raíz eran
idénticas. Cuarenta y cinco minutos después: **63 líneas de diferencia**, y de 6 commits por
detrás de `origin/main` a 23. La medición fue correcta las dos veces. Es además **el mejor
argumento para la decisión 7** de todos los que tenemos: en T1 y T3 la divergencia ya
existía; aquí **se creó bajo los pies de alguien que acababa de comprobar que no la había**.

**La regla, en dos partes:**

1. **Se mide inmediatamente antes de afirmar, no al principio del razonamiento.** Es
   exactamente la misma regla a la que llegó la Directora por otro camino —hacer `git
   fetch` antes de comparar, o comparas contra una foto vieja de `origin`—; el mismo
   principio por dos rutas, no dos reglas sueltas.
2. **Toda medición de algo mutable se reporta con su marca de tiempo.** Una medición sin
   hora **no se puede evaluar como caducada, así que se lee como permanente** — que es
   justo lo que pasó aquí.

**Lo que estuvo a punto de costar, y es de manual:** entre los commits que le faltaban a T2
está el que añade comprobar con `lsof` que el servidor del puerto es el suyo. Su prueba de
AIT-79 arranca dos servidores y compara respuestas — si el segundo hubiera fallado por
puerto ocupado y `curl` siguiera contestando al primero, habría concluido **"el valor está
congelado" con el diseño correcto delante**. Un NO-GO fantasma y convincente, en la tarea
que existe precisamente para cerrar un falso verde.

### Una verificación que depende de ganar una carrera está mal diseñada (decisión 30, 2026-09-08)

**El caso:** el Integrador publicó AIT-79 y **63 segundos después** entró un push de
documentación —haciendo exactamente lo que la enmienda 3 le manda hacer—, así que los dos
builds de Railway arrancaron casi en paralelo. El deployment del primero **puede no llegar
a servir nunca**, y el gate de esa tarea exige observar dos deployments concretos por
separado. Resultado: sondear cada 20 segundos para cazar algo que quizá no exista.

Son **dos decisiones correctas colisionando en un caso que ninguna contemplaba**. Y la
lista de verificaciones que observan un deployment concreto va a crecer.

**Lo que NO se hace: una ventana de silencio o un cerrojo de publicaciones.** Ya hay un
cerrojo con problema de abandono en §3 y no interesa un segundo primitivo de coordinación;
además reintroduciría por la puerta de atrás justo lo que la enmienda 3 le quitó al
Integrador. **Un lock para arreglar una prueba mal diseñada es pagar en coordinación lo que
se ahorra en diseño.**

> **La regla: cuando una verificación exija observar un estado transitorio de producción,
> primero hay que preguntarse si la propiedad se puede AISLAR y probar sin producción.**
> La observación en producción queda como **confirmación no bloqueante**: se intenta, y si
> se pierde la ventana **no es un fallo — se reintenta o se declara no capturada**.

**El medio ya existe y lo construyó T2 esa misma tarde:** su prueba discriminante de AIT-79
es *construir una vez y arrancar dos veces con valores distintos sobre el mismo artefacto
de build, sin reconstruir*. Si el valor cambia sin rebuild, queda demostrado que no está
horneado. **No necesita producción, no necesita ganar ninguna carrera, y discrimina mejor**
— porque aísla la propiedad que se quiere probar en vez de esperar a que el mundo la
exhiba.

📌 **Matiz del PM al resolver el caso, y afina la regla: el problema no era observar
producción, era hacerlo BLOQUEANTE.** La observación en producción sigue teniendo valor —
dice que además está bien desplegado. Lo que no puede ser es **condición para cerrar cuando
su ocurrencia no está bajo control de nadie**.

⚠️ **Y el límite de esta decisión, que su propio autor marcó:** esto es **proceso de
verificación, no alcance**. Si el gate de una tarea se da por cumplido con la prueba
aislada **lo deciden el PM y el auditor**, no el Factory Architect ni el CEO.

**Cómo se resolvió el caso, y dónde estaba de verdad el fallo:** el PM comprobó que **nunca
había pedido dos deployments** — su criterio decía que el identificador *"cambia cuando se
publica algo nuevo **y** coincide con el commit realmente desplegado"*, o sea **dos
propiedades**, cada una mejor demostrada por un camino distinto: que el valor no está
horneado lo prueba la prueba aislada (y mejor que producción); que lo mostrado coincide con
lo desplegado **basta comprobarlo contra un solo deployment**.

⚠️ **La tercera propiedad —ver dos deployments distintos— NO la añadió quien ejecutaba el
gate.** Estaba **en el gate del auditor**, literal: *"para cada uno de los dos deployments
por separado… y entre A y B, IDs y commits distintos. No hay degradación aceptable"*. El
Integrador ejecutó el gate que se le entregó; **degradarlo por su cuenta habría sido
relajar un criterio que explícitamente decía no admitir degradación**, y eso sí habría sido
una decisión suya indebida. *(Corregido a petición suya: la primera redacción de este
párrafo decía "una lectura más estricta que el propio criterio", lo que apuntaba a él y
además dejaba el hallazgo real fuera.)*

> **El hallazgo real, que sí puede repetirse: un gate derivado exigía más que el criterio
> de aceptación del que derivaba, y nadie cruzó los dos hasta que la ejecución lo destapó.**
> Eso no se arregla pidiéndole a quien ejecuta que lea más suelto — se arregla **cruzando
> el gate contra su criterio de origen antes de entregarlo**, que es un paso que hoy no
> existe. La brecha aparece cuando un rol traduce un criterio de producto a una lista de
> comprobaciones: cada endurecimiento parece prudente por separado, y nadie compara el
> resultado con lo que se pedía.

📌 **Si la aplicación nunca llegó a decir su identidad, NO se infiere desde Railway.** Un
"no pude capturarlo" es un resultado válido; inferirlo sería responder la pregunta del gate
desde el lado equivocado. Es §2ter(b) exacto, en el sitio donde más tienta saltárselo.

### La medición exacta sobre el sujeto equivocado (decisión 43, 2026-09-08)

**Categoría propia, y no es ninguna de las anteriores.** No es falso verde —el método es
bueno y la herramienta no miente— ni dato caducado —el dato es de ahora—. **El número
responde correctamente sobre otra cosa.**

> **Enunciado corto, de T2: *"¿estoy midiendo lo que creo que estoy midiendo?"***
>
> ⚠️ **Y va ANTES de medir, no al revisar el resultado.**

**Lo que la hace peor que las otras, y es del Integrador: el error es INVISIBLE en el
resultado.** Un 426 es plausible. Quince verdes son verdes. "2 fuera del conjunto" es
creíble. **Revisar el resultado con más cuidado no la caza nunca** — solo se caza
comprobando el sujeto **cuando todavía no hay número que evaluar**.

**Y el remate que explica por qué esa comprobación no puede ser opcional:** a T1 le salieron
"1 y 0", números **imposibles**, y por eso tiró del hilo. **Si le hubieran salido "3 y 1"
por casualidad, habría reportado una medición equivocada como confirmación y nadie lo habría
vuelto a mirar.** El aviso se lo dio el azar; **el resto de las veces el azar no avisa.**

**Cuatro instancias el mismo día**, incluida una del Factory Architect: atribuyó la
concentración del backlog a una propiedad del código cuando **estaba midiendo dónde habíamos
mirado ese día** (ver §7).

#### Su forma más peligrosa: dos señales con el mismo error de sujeto (añadido 2026-09-08)

> **Dos señales que comparten el mismo error de sujeto no se corroboran: se refuerzan.** La
> coincidencia se lee como confirmación independiente cuando es **el mismo fallo visto dos
> veces**.

Es exactamente lo contrario de lo que uno espera de dos fuentes que concuerdan, y por eso
funciona tan bien: **la concordancia apaga la sospecha justo cuando debería encenderla.**

*Caso real, 2026-09-08.* El CEO reportó cuatro planes "esperando auditoría" cuando **los
cuatro tenían GO**, apoyado en dos mediciones exactas y las dos sobre el sujeto equivocado:
(1) el export seguía en `codigo para auditar/` —pero los exports no se borran al auditarse—,
y (2) cero procesos `codex` vivos —que significa *ya terminó*, no *no se ha disparado*—. Las
dos decían lo mismo, así que **el error fue invisible en el resultado**, que es la firma de
la 43. Lo destapó la Directora leyendo el **último veredicto de cada ventana de auditor**, o
sea **cambiando de sujeto**, no midiendo mejor.

📌 **Y el detalle que lo hace didáctico:** la señal `ps aux | grep -c "[c]odex exec"` **no es
mala** — la Directora la usa a diario para cazar veredictos perdidos. Es **la misma
observación leída del revés**, y sirve para dos conclusiones opuestas según qué esperes
encontrar. No se arregla desconfiando de la señal: se arregla preguntándose de qué es señal.

#### Y su dirección peor: el sujeto equivocado al ESCRIBIR, no al medir (2026-09-08)

> **Configurar el sujeto equivocado es peor que medirlo, porque deja estado.**

Hallazgo de la Directora, sobre el trabajo del PM en AIT-90. La consola de Google Cloud **tenía
abierto un proyecto que no es el nuestro** —"My First Project"—, y el proyecto correcto
(`supercrm-506513`) hubo que identificarlo por el número del Client ID. **Trabajar donde estaba
abierto habría configurado lo correcto en el sitio equivocado.**

**Encaja con la 60.2 y la completa, formando una escala de tres:**

| La medición equivocada lleva a… | Coste |
|---|---|
| **decir** algo | un informe equivocado — se corrige cuando alguien mira |
| **destruir** algo | irreversible en lo destruido, pero **visible**: alguien nota que falta |
| **escribir/configurar** algo | ⚠️ **irreversible Y silencioso.** Queda estado correcto en un sitio equivocado, **que nadie va a ir a buscar** porque nadie sabe que existe |

📌 **Y lo que lo hace especialmente traicionero: el trabajo sale bien.** Los ajustes son
correctos, la consola confirma, no hay error en ninguna parte — **solo que en otro proyecto**.
Falla hacia el verde en el sentido más literal de todos.

**La comprobación, y es la misma pregunta de siempre movida un paso antes:** *antes de escribir,
¿sobre qué sujeto estoy escribiendo?* — verificado contra un identificador que no dependa de
**lo que estuviera abierto**. El PM lo hizo: comprobó el proyecto contra la consola **en vez de
fiarse del número que le pasó la Directora**, que además era correcto.

### Decisión 51 — El código de salida contesta a una pregunta, y no siempre es la que crees (2026-09-08)

**Formulación de la Directora. Sustituye a la del Integrador porque cubre las cuatro
instancias, y la suya cubría tres.**

La del Integrador —*nunca encadenes `&&` detrás de una tubería cuyo último comando no sea el
que te interesa*— es correcta y es el caso más frecuente. Pero **el caso de T3 no encaja: su
tubería SÍ terminaba en el comando que le interesaba.** Lo que falló fue otra cosa:

> **No es que el idioma destruya el código de salida. Es que el código de salida contesta a
> una pregunta distinta de la que se hizo.**

`grep -c` no dice *"¿falló?"*, dice *"¿encontré algo?"*. Así que **"no hay errores" —el
resultado bueno— abortó la verificación.**

**La regla que va escrita, más incómoda y más útil: antes de encadenar con `&&`, saber qué
pregunta contesta el código de salida de la izquierda.** La del Integrador se conserva como
su caso más frecuente, **subordinada a esta**.

**Las instancias, y hay que marcar cuál es cuál, porque el sustituto es distinto:**

| Instancia | Familia | Qué hacer |
|---|---|---|
| `npm test \| tail` | **el idioma lo destruye** — el exit de una tubería es el del último eslabón | leer la línea `N passed`/`N failed` |
| `grep <patrón> f \| head -1 && echo "APARECE"` | **el idioma lo destruye** — `head` devuelve 0 aunque `grep` no encuentre nada | `grep -c` y mirar el número |
| `npm run build 2>&1 \| tail -3 && echo "…listo"` (T2) | **el idioma lo destruye**, con un agravante: **no calla la verdad, imprime una mentira encima.** Un `tail` que oculta un fallo es malo; un `echo` afirmativo que lo contradice es peor, porque quien lo lea tiene un testimonio explícito en contra del hecho | capturar la salida y **preguntarle a la salida, no al exit**: `OUT=$(npm run build 2>&1); if echo "$OUT" \| grep -qi "Failed to\|build worker exited"; then …`. Es lo que T2 hizo **75 segundos después**, por su cuenta |
| `grep -c <patrón> && <siguiente paso>` (T3) | **contesta a otra pregunta** — la tubería termina donde debe; es que `grep -c` responde *"¿encontré algo?"*, no *"¿falló?"* | comparar el número explícitamente (`[ "$(grep -c …)" -eq 0 ]`), nunca encadenar sobre el exit |

✅ **La cuarta instancia, verificada el 2026-09-08 y no dada por buena de oídas.** Llegó
relatada —*"T2, a las 21:36"*— y el propio Factory Architect avisó de que él tampoco la había
comprobado. Se confirmó **parseando el transcript de T2**, no grepeando prosa, y por dos
caminos independientes: **el `tool_use` real** con el comando literal, y **la declaración del
propio T2 en su export** (*"mi propio `npm run build | tail && echo OK` imprimió éxito sobre
un build FALLIDO, porque el exit code era el de `tail`"*).

⚠️ **Y la hora relatada no era la real: fue a las 00:13:00 UTC (= 21:13 local), no a las
21:36.** Diferencia inocua aquí, pero es exactamente el material de la enmienda 8 —**se
reporta lo que uno mide, no lo que le contaron**— y aparece en la cadena de propagación de un
dato que todos los intermediarios trataron con cuidado.

📌 **Lo mejor del caso no es el fallo: es que T2 lo corrigió solo 75 segundos después**, y su
corrección es el sustituto canónico de esta fila. Y lo dejó escrito en su propio export
—*"queda anotado porque es el falso verde de la casa cometido en directo"*— sin que nadie se
lo pidiera.

📌 **Y la observación que dio origen al eje de esta sección:** las tres primeras fallan **hacia
el verde** —siguen adelante mintiendo—; la de T3 falló **hacia el rojo** —abortó—, y por eso
se supo en el acto. Mismo mecanismo, direcciones opuestas, costes incomparables.

### Una comprobación sin sujeto no es una comprobación que pasa (2026-09-08)

> **Si no había nada que comprobar, el resultado no es verde: es "sin sujeto".** Reportarlo
> como verde es un falso verde **en el propio instrumento de vigilancia**, que es el peor
> sitio donde tenerlo.

*Caso:* el barrido del CEO comprueba *"¿hay vigilante armado para cada auditoría en curso?"*.
Con **cero procesos `codex` vivos** no hay ninguna auditoría en curso, así que la comprobación
**no tiene sujeto ese ciclo**. Escribirla como "todo en orden" habría acumulado ciclos verdes
que **no prueban nada**, y a las diez lecturas nadie distinguiría ya un verde con sujeto de
uno sin él.

**La forma general, que aplica a cualquier tabla de estado:** distingue siempre **tres**
resultados, nunca dos — *pasa* · *falla* · **no tenía sujeto**. Un censo que solo sabe decir
verde y rojo **convierte la ausencia de trabajo en evidencia de salud**.

### Decisión 57 — Un defecto puede vivir en el espacio ENTRE comprobaciones correctas (2026-09-08)

**Hay que separarla de todo lo demás de esta sección: aquí ninguna comprobación mintió.**

⚠️ **Este texto se escribió por relevo —el CEO no vivió el incidente, y el Factory Architect
tampoco— y la Directora lo verificó después contra las fuentes. Dos de los cuatro puntos
cambiaron.** Se deja dicho porque es la regla del relevo aplicada a sí misma.

- **El desarrollador reportó 20/20, y esa era la suite COMPLETA de su rama.** `main` tiene hoy
  **47** (T1 midió 5 failed + 42 passed). **Nadie corrió 47.** La base de T2 era `86cd735`,
  anterior a que AIT-82 mergeara sus 15 tests y AIT-86 los suyos:

  > **La suite que el desarrollador corrió era completa cuando la corrió. Dejó de serlo antes de
  > mergear.**

  *(La primera redacción decía "era cierto en su entorno" — **una inferencia que nadie había
  comprobado**, y que además sonaba a que su entorno era peculiar. Lo corrigió la Directora
  señalando que era suya y sustituyéndola por el dato medido. **T2 no dejó nada sin correr: la
  suite creció bajo sus pies mientras trabajaba.**)*
- **El auditor fue MÁS preciso de lo que esta decisión le atribuía.** No dijo "no repito la
  suite": dijo, literal, *"no repetí de manera independiente el montaje manual completo de los
  dos builds ni los 20 E2E; su evidencia está documentada en el export. Sí verifiqué
  directamente el código, el commit, los archivos protegidos y el build final"*. **Nombró el
  número y declaró exactamente qué no repetía y qué sí** — que es la 57.3 hecha antes de que la
  escribiéramos.
- El Integrador **verificó el build**, y él mismo declaró que **un build no corre e2e**.
- El rojo de `main` está verificado dos veces: por T1 y por la Directora sobre `199ac3e`.

**Las tres correctas dentro de su alcance. Y `main` en rojo.**

📌 **Y la implicación que no estaba, y que crece con el paralelismo:** si nadie corre la suite
completa entre el GO y el merge, **cada rama reporta sobre su propia foto**. Ese día tres
terminales reportaron **20, 30 y 31** tests. **Ninguna mentía, los tres números eran ciertos, y
ninguno era el de `main`.** Es la familia del **dato correcto que caduca** — esta vez porque
**el objeto medido creció**, no porque cambiara.

> **Una comprobación lenta acaba corriendo. Un hueco entre comprobaciones no se cierra nunca —
> la ventana no es larga, es infinita.**

**Y la pregunta que se deriva, que es la que no nos hacíamos:** ante una cadena de puertas, lo
que hay que preguntar **no es si cada una es correcta, sino qué es lo que no mira ninguna.**

**57.1 — Corrida periódica de la suite sobre `main` limpio, desacoplada de las publicaciones.**
Propuesta del Integrador, **asignada al QA**: ya tiene cadencia propia y disciplina de `/loop`,
tiene el instrumental, y **es el único rol cuyo trabajo entero es "¿esto funciona de verdad?"**
—esto es exactamente eso, una capa antes—. Reclama el cerrojo de Convex como cualquiera y
aplica su convención de datos fijos.

*Y lo que se descarta, con su motivo:* correrla **antes de cada merge** escribiría en el Convex
compartido y **disputaría el cerrojo justo en el momento crítico** — coste recurrente alto para
un fallo raro. Desacoplada, **acota la ventana a un intervalo conocido en vez de a la
casualidad**. No la cierra: la acota, y eso ya es una propiedad y no una esperanza.

**57.2 — El resultado se reporta con el TOTAL DE `main`, no con el subconjunto tocado ni con el
total de una rama.** Obligatorio, no preferencia — la precisión *"sobre `main`"* la aporta la
Directora, porque **el total de una rama no es el total**:

> ⚠️ **Y este apartado decía "los 47" hasta que se midió.** El número venía por relevo (T1 → la
> Directora → el CEO) y **era el de una ejecución, no el del catálogo**. Medido sobre `main` en
> `62d1d7a` con `npx playwright test --list`: **36 tests en 8 ficheros**. El QA había medido lo
> mismo por su cuenta sobre `893488e` y lo señaló.
>
> **La lección es de la (d) de §2quinquies y hay que aplicarla aquí:** una regla **no fija el
> valor concreto de un estado mutable, dice dónde se consulta.** En un solo día ese número fue
> **20, 30, 31, 36 y 47**, y todos eran ciertos de algo distinto. **El número de referencia es
> el que produce la corrida del QA sobre `main` limpio, con su commit y su comando al lado** —
> esa es toda la gracia de la 57.1. un arreglo que toca `webServer.env` cambia el entorno de **toda** la suite, y el
modo de fallo sería **arreglar cinco y romper dos que nadie mire**. Es el patrón de
`helpers.ts` de AIT-78, y es la enmienda 9 — **si la comprobación solo mira lo que se arregló,
no podía dar otro resultado.**

### Decisión 58 — Un detector se estrena apuntando al caso que lo motivó (2026-09-08)

**Van enlazadas con la 46, y separadas cada una parece completa:**

> - **46 — estrénalo con el estado ya conciliado**, para que **no grite en falso**.
> - **58 — apúntalo al positivo conocido**, para saber que **PUEDE gritar**.
>
> **Una sin la otra no vale.** La 46 sola produce un detector **silencioso que parece sano**;
> la 58 sola, uno que **ladra a todo**.

**58.1 — El detector se prueba contra el caso REAL que hizo que se escribiera.** No contra
casos sintéticos, no contra el estado general. **Si no salta sobre el caso que lo motivó, está
mal** — y eso se sabe en treinta segundos en vez de en la próxima ocurrencia.

**Por qué hace falta decirlo, que es la parte que no es obvia:** un detector escrito para cazar
una clase de fallo **lo escribe alguien que tiene esa clase de fallo en la cabeza**, y hereda su
forma de razonar. **No es mala suerte: es reutilizar el razonamiento que produjo el defecto
original.** Caso del 2026-09-08: la comprobación (B) del índice comparaba conjuntos —*¿tiene
fila este número?*— y **los huecos tienen fila**, la que dice `TEXTO NO LOCALIZADO`. Daba verde
sobre exactamente lo que la motivó: **una comprobación que no podía fallar** (enmienda 9), en el
instrumento escrito contra eso mismo.

**58.2 — Estado de los controles armados, probados contra un positivo REAL (2026-09-08):**

| Control | ¿Ha saltado sobre un positivo real? |
|---|---|
| **Commits sin subir** (decisión 9 / 53.3) | ✅ **Sí**, en vivo: cazó el commit del PM a los 20 minutos de existir |
| **(B) secuencia y huecos del índice** (56) | ✅ **Sí**, a los diez minutos de existir: saltó con la 57 escrita y sin fila |
| **(A) citas vs índice** (56) | ✅ **Sí, probado a propósito**: se retiró la fila 57 del índice, la comprobación la reportó, y se restauró — fichero verificado idéntico al de antes |
| **Refs de `ListAgents` vs registro** (45.3) | ✅ **Sí, probado a propósito**: con un ref inexistente reporta `⚠️ FALTA`. Antes de esta prueba **solo había corrido limpio tres ciclos**, que no es lo mismo |
| **`core.hooksPath`** (33) | ⚠️ **Inversión curiosa: solo ha visto el positivo.** Lleva ocho ciclos reportando AUSENTE y **nunca ha visto el caso negativo** — no sabemos si sabría callarse |
| **Hook de secretos** (33) | ❌ **No existe todavía.** Cuando exista, se estrena contra un secreto de prueba **antes** de darlo por armado |

📌 **Y la lección de la fila de refs:** *"ha corrido limpio tres ciclos"* se lee como verificado
y **no lo es**. **Un control que solo ha visto verde no está verificado: está sin estrenar.**

**58.3 — Un documento que se describe a sí mismo contamina cualquier medición sobre su propio
texto.** Segundo defecto del mismo estreno: el contador de filas verificadas hacía
`grep -c '✅'` sobre el fichero entero **y contaba el ✅ de la cabecera que explica qué significa
la marca** — reportó *"1 de 56 verificadas"* con cero verificadas. Es hermano de la **20** —el
transcript contiene los eventos **y las conversaciones sobre los eventos**— y por eso tiene fila
propia en el registro de comprobaciones desacreditadas.

**Decisión 60.1 — La 58 estaba coja: un control se verifica en las DOS direcciones.**

> **Un control que solo ha visto verde no está verificado: está sin estrenar.**
> **Un control que solo ha visto rojo tampoco: no sabemos si sabe callarse.**
>
> ### **Está verificado cuando se le ha observado disparar sobre un positivo Y quedarse callado sobre un negativo. Las dos direcciones, o ninguna.**

Un detector que no sabe callarse **es la 46 esperando**: grita siempre, y al décimo ciclo deja
de leerse.

⚠️ **Consecuencia práctica para `core.hooksPath`, y es un pendiente atado a un evento, no algo
que se mirará "cuando toque":** su caso negativo **solo puede observarse cuando Aitor ejecute el
comando**. En ese momento su verificación se completa, y **hay que mirarla entonces** — el ciclo
siguiente confirma explícitamente que **dejó de reportarlo**. Si sigue avisando con el hook ya
configurado, **el control está roto y llevaríamos nueve ciclos sin saberlo**.

📌 **Y una nota de método sobre probar controles a propósito:** hacerlo **modificando el estado
real exige devolverlo exactamente**, y **comprobarlo en vez de suponerlo** — al probar la
comprobación (A) se retiró una fila del índice y después se verificó con `diff` que el fichero
quedaba **idéntico**. Eso es lo que hace que la prueba no cueste más de lo que vale.

### Decisión 59 — Todo consumidor nuevo de un recurso compartido nace con el suyo (2026-09-08)

**La 57.1 tenía un precio que no se había valorado**, y lo señaló la Directora:

> **El deployment compartido no es un entorno neutro: es un entorno que la suite va sembrando.**

La suite e2e **escribe datos** —crea clientes por corrida— y **T3 mide sobre ese mismo
deployment**. Ya mordió: T3 declaró *137 clientes con 2 emails, un 1%*, y avisó de que **ese 1%
mide cómo se comporta la suite e2e, no cómo rellena datos un negocio**. Con cadencia propia,
**el sesgo crece solo y sin que nadie lo mire**: es la **43** —medición exacta sobre el sujeto
equivocado— **fabricada por nosotros y creciendo con el tiempo**, y falla hacia el verde.

**La respuesta no es aceptar el precio: es no pagarlo. Y no hay que inventar nada — la solución
ya está diseñada y ejecutada dos veces** (§3bis): T1 y T2 tienen deployment propio y **no
reclaman el cerrojo nunca**.

**59.1 — La corrida periódica del QA va a un deployment propio, no al compartido.** Se aplica el
checklist de §3bis **antes de fijar cadencia** — llegar a tiempo es lo único que hace esto
barato. **Los tres problemas se caen a la vez:** no se contamina un entorno que otros miden; la
contención QA↔T3 desaparece porque la suite no necesita el cerrojo; y **los datos de la suite
pasan a ser deterministas**, que además la hace mejor prueba.

**59.2 — Y lo ya contaminado se declara, no solo se corrige hacia adelante** (46). El
compartido **ya tiene datos sembrados por la suite**: cualquier medición sobre él lleva anotado
que **su población es en parte artificial**. T3 lo declaró por su cuenta —que es lo correcto—;
ahora es obligación, no criterio.

**59.3 — La regla general, porque va a volver:**

> **Todo consumidor nuevo de un recurso compartido nace con el suyo. Migrar después cuesta;
> nacer aislado no cuesta nada.**

**Ya van tres:** el puerto 3000, el deployment de Convex, y ahora la suite periódica. *(Y el
perfil del navegador del MCP —decisión 47— es el cuarto, con la misma forma.)*

#### Un campo obligatorio sin valor válido es una invitación a interpretar (2026-09-08)

> **Un campo obligatorio sin valor válido para algún actor no es un campo incompleto: es una
> invitación a interpretar.**

*Y el precio ya está pagado:* el `titular.txt` del cerrojo pedía `T1|T2|T3`, el QA trabaja desde
la raíz y **literalmente no tenía un valor válido que escribir**. Interpretar es exactamente
como ese campo acabó guardando un nombre de sesión muerto esta misma tarde. **El fallo no fue de
quien interpretó.** Cerrado añadiendo los literales de rol —`QA`, `Integrador`, `Directora`— al
conjunto válido (ejecución de la 34.1, no decisión nueva: completar un conjunto de valores para
que la regla sea aplicable **no es decidir, es hacerla ejecutable**).

### Decisión 61 — «Pendiente de otro» nunca significa «nada mío pendiente» (2026-09-08)

> **Atribuir un pendiente enteramente a otro apaga la pregunta de qué nos toca a nosotros.**

**Todo bloqueo anotado registra qué queda de nuestra parte para cuando se desbloquee** — y **si
no queda nada, se dice también**, porque eso es información.

*De dónde sale:* el CEO llevaba **nueve ciclos** reportando `core.hooksPath` como pendiente de
Aitor. Al escribir la 60.1 se dio cuenta de que **su ejecución no cierra el asunto: lo abre** —
el control solo ha visto su caso positivo, así que **la verificación se completa en el momento
en que Aitor ejecute el comando**, y hay que mirarla entonces. Esa mitad **no estaba escrita en
ninguna parte**.

**Falla hacia el verde**, que es lo que lo hace peligroso: la lista de pendientes **parecía
completa**.

⚠️ **Y el coste real, que no es el olvido sino el momento en que llega:** sin esa mitad escrita,
**el desbloqueo llega y nadie está preparado**. Aitor ejecuta el comando, el asunto se da por
cerrado, y el control **se queda sin estrenar en su dirección negativa** — exactamente lo que la
60.1 impidió por los pelos.

#### La lista aplicada (2026-09-08)

| Bloqueo | De Aitor | **Y qué queda de nuestra parte al desbloquearse** |
|---|---|---|
| **`core.hooksPath` + `.githooks/`** | ejecutar un comando y crear el hook | ⚠️ **Bastante, y atado al evento:** (1) el ciclo siguiente confirma que el control **dejó de reportarlo** — si sigue avisando, lleva nueve ciclos roto (60.1); (2) el hook se **estrena contra un secreto de prueba** antes de darlo por armado (58.1); (3) se estrena **con el estado ya limpio**, no confiando en que el primer ciclo salga tranquilo (46) |
| **Aislar el perfil del navegador** (47) | cambiar la configuración del MCP | (1) **el perfil aislado se estrena vacío y VERIFICADO vacío**, no reutilizando uno que "parece limpio" (47.4); (2) retirar la contención vigente —solo la app, no tocar el perfil— y **decirlo explícitamente**, o quedará viva sin motivo; (3) comprobar que **desaparece la serialización**: dos sesiones con navegador a la vez |
| **La prueba de Gmail de T3** | hacerla él; nadie más puede | (1) T3 retoma en cuanto llegue el resultado; (2) **anotar qué queda descubierto** si la prueba solo cubre parte del caso (57.3) |
| **Las tres ediciones de `CLAUDE.md`** | aprobarlas y editarlas | **nada más**, salvo avisar a las sesiones vivas de que el documento cambió — un documento de arranque no llega solo a quien ya arrancó (§2quinquies (m)) |
| **`settings.local.json` 17.1/17.2** | editarlo | (1) **probar que la voz llega al rol correcto**, que es el fallo original; (2) **verificarlo en las dos direcciones** (60.1): que suena para quien debe **y que no suena para quien no** |
| **Permiso de Grabación de Pantalla** | concederlo en Ajustes | **estrenar `screencapture` contra un positivo conocido**: capturar una ventana y **abrir la imagen para mirarla** — el fallo documentado es que devuelve exit 0 con un rectángulo en blanco |

#### Cuándo reordenar un documento es ejecutar, y cuándo es decidir (2026-09-08)

> **Reordenar por retórica es decidir. Reordenar porque un hecho nuevo cambia la naturaleza del
> asunto es ejecutar.**
>
> **El test: si puedes nombrar el hecho nuevo, es ejecución. Si no puedes, era énfasis** — y
> entonces la decisión es del Factory Architect.

Es el criterio de T3 —*«cubierto por otra vía» exige señalar la vía*— aplicado a **por qué
cambias un orden**.

*Caso:* la **47** listaba dos vectores (salida y entrada) y pasó a listar tres, con
**disponibilidad el primero**. El hecho nuevo se puede nombrar: **el QA perdió una ronda entera
el 2026-09-08 porque otra sesión tenía el perfil cogido.** Y no es presentación — **es que la
decisión cambió de clase**: con dos vectores era una decisión de seguridad, que compite con el
trabajo; con el tercero es un **bloqueo operativo**, que no compite con nada. **Un documento que
no refleja eso está desactualizado, no neutral.**

### Decisión 62 — El gate más duro de la fábrica viajaba en prosa (2026-09-08)

De la Directora y T2, y es del tamaño de la 42. **El diagnóstico de ella es el que decide:**

> **"Un GO y un mensaje tuyo se ven igual desde aquí: los dos llegan por `SendMessage`, en
> prosa, de la misma sesión. «Está en vuelo» y «se me olvidó» producen exactamente el mismo
> silencio."**

Y el remate, que lo convierte en fallo de diseño y no en descuido de nadie:

> **"Hoy me salvó que la frase fuera ambigua. Si hubiera sido un poco más afirmativa, la habría
> leído como autorización."**

⚠️ **Todos los controles cerrados el 2026-09-08 tienen valores fijos. El más duro de todos
—nunca implementar sin GO— no tenía ninguno.**

**62.1 — Línea literal y fija, inmediata:** `Veredicto del auditor: GO` / `NO-GO`, **en su
propia línea**, con fichero y fecha. Con eso **"no está esa línea" significa inequívocamente "no
hay veredicto"**, y deja de depender de cómo suene el resto del mensaje. Es la 42 exacta y
cuesta una línea en un mensaje que ya se escribe.

**62.2 — Pero eso no basta, y la objeción de la Directora es la que fija el diseño:**

> *"La línea la escribo yo, no el auditor. **No prueba que el veredicto exista: prueba que yo
> afirmo que existe.**"*

Eso es **más débil que la 42**, donde el dato lo pone la herramienta. Así que **el veredicto pasa
a ser un artefacto que el desarrollador puede leer por su cuenta**: el `codex exec` que ya se
dispara **vuelca su salida a un fichero** en `codigo para auditar/`, nombrado por tarea y ronda.

- **El desarrollador verifica el GO él mismo antes de implementar**, en vez de confiar en el
  relevo.
- **La línea de la Directora pasa a ser un puntero, no la autoridad.**
- **La ausencia la detecta quien va a actuar**, no solo quien lee un mensaje.

Es la **50** —observable antes que afirmado— y la **54** —darle a la comprobación la capacidad
de rechazar— aplicadas al mismo sitio. **Y cuesta un `tee` en un comando que ya existe.**

⚠️ **Estreno, por la 46:** el fichero de veredicto **no existe para las tareas en vuelo ahora
mismo**. Si el desarrollador empieza a exigirlo hoy, las cuatro en curso se bloquean con razón
aparente. **Se estrena a partir de la siguiente auditoría disparada**; las que ya están en vuelo
terminan con el mecanismo viejo, **declarado**.

#### La idea que llevaba todo el día suelta, en palabras de T2

> ### **"Un control que se transmite en prosa no es un control, porque hay que interpretarlo."**
>
> **"La regla no me pedía decirlo mejor, me pedía decirlo igual."**

Esa segunda frase es **la mejor definición de por qué existen los valores fijos** que se fueron
poniendo ese día. **La 42** (línea de autoría), **la 34.1** (`T1|T2|T3`, nunca un nombre de
sesión), **el campo sin valor válido** y **esta 62.1** son la misma idea, y hasta ahora estaban
sueltas.

**Y la que cierra el día, también de T2, sobre su propio acierto:**

> **"Mi decisión de parar fue correcta y no tuvo mérito: no había otra salida que no dependiera
> de acertar."**
>
> ### **Cuando la única defensa disponible es que alguien elija bien bajo ambigüedad, el sistema está apoyado en la suerte.**

*(Un agente diciendo que **su propio buen juicio no cuenta como control** es el criterio con el
que conviene diseñar todo lo demás.)*

📌 **Y cómo llegó aquí, que importa:** la 62.1 sola habría sido **un control que parece fuerte y
descansa en la palabra de la Directora**. Lo señaló ella, **contra su propio interés** — la
versión débil la dejaba a ella como fuente de autoridad.

### El falso ROJO: un fallo del arnés vendido como fallo del producto (2026-09-08)

**Este catálogo entero trata del falso verde. Su simétrico existe y es más barato, pero no es
gratis** — y merece estar escrito aquí, junto a los otros, para que no se descubra como si fuera
nuevo.

*El caso:* el PM intentó verificar el login de Google de producción después de que AIT-90
cambiara la app a Interna. La petición a `accounts.google.com` **murió con
`net::ERR_CONNECTION_CLOSED`**. Google **no contestó nada** — no es un rechazo suyo: **desde ese
entorno no se llega a su servidor.**

> **Ese rojo no cuenta como rojo.** Reportarlo como *"el login de Google está roto"* habría sido
> el falso rojo simétrico del falso verde: **un fallo del arnés vendido como fallo del
> producto.**

**Por qué es más barato pero no gratis:** un falso verde no se investiga nunca; un falso rojo
**sí se investiga** —esa es la asimetría de la Directora— pero **gasta el tiempo de quien
investiga, y en producto ajeno**. Y tiene un modo de fallo propio: **desprestigia una parte sana
del sistema**, y la siguiente vez que dé rojo de verdad ya nadie lo mira.

**La comprobación:** *antes de declarar roto algo de terceros, distinguir "me han contestado que
no" de "no he llegado a preguntar".* Una conexión cerrada, un DNS que no resuelve o un timeout
**no son respuestas**.

📌 **Y lo que el PM sí sacó, que es el modelo de cómo se reporta esto:** aunque no pudo cerrar la
verificación, **midió lo que sí llegó a ocurrir** —la petición real que salió del navegador, no
el código— y de ahí quedaron **tres hechos verificados**: que `AUTH_GOOGLE_ID` sigue apuntando al
proyecto correcto, que el `scope` sigue siendo `openid profile email` **sin rastro de Gmail** (el
criterio de fallo de AIT-90, medido y no declarado), y que `/api/auth` responde 200. **Nuestro
lado está sano; lo que queda sin verificar es exactamente una cosa: si Google deja pasar a una
cuenta del dominio con la app ya Interna.** Eso es la 57.3 bien hecha: **qué se verificó y qué
no**, delimitado hasta el punto exacto.

### Decisión 63 — Un checklist que enumera un estado mutable caduca en silencio (2026-09-08)

> **63.1 — Ningún checklist enumera un estado mutable. Manda mirarlo.**
>
> *"Copia las variables de entorno del origen"* **no caduca**. *"Copia estas dos"* **caducó el
> día que alguien añadió la tercera.**

*El caso:* el paso 2 de la migración de §3bis decía "copia `SEED_OWNER_PASSWORD` y
`SEED_SALES_PASSWORD`". **El origen tiene trece variables**, y entre las que faltaban estaban
`JWT_PRIVATE_KEY` y `JWKS`: **sin ellas Convex Auth no arranca**. Lo encontró el QA migrando su
corrida periódica (59.1).

⚠️ **Y lo que lo hace peligroso es que el fallo es invisible en el punto de uso:** el checklist
**era cierto cuando se escribió**, y quien lo siguiera **fallaría en el paso 4 sin saber por
qué** — el documento no dice *"faltan variables"*, dice que el login no arranca.

**Engancha con la (d) de §2quinquies, porque es la misma regla en tres tamaños el mismo día:**

| Tamaño | Caso del 2026-09-08 |
|---|---|
| un **valor** | el modo de publicación nombrado en el README en vez de "se consulta aquí" |
| un **número** | los *"47 tests"* de la 57.2, relevados y nunca medidos (eran 36) |
| una **lista** | *"copia estas dos"* del checklist de §3bis (eran trece) |

**Las tres caducaron en silencio. Las tres se arreglan igual: no fijar el valor, decir dónde se
consulta.**

**63.2 — Auditoría de las demás enumeraciones (hecha el 2026-09-08):**

| Dónde | Enumera | Veredicto |
|---|---|---|
| **§3bis paso 2** — variables a copiar | 2 de 13 | ❌ **Era el caso. Corregido**: ahora manda contrastar con `npx convex env list` del origen (sin volcar valores) |
| **§3bis paso 3** — *"las tres variables nuevas"* del `.env.local` | 3 | ⚠️ **Misma forma, riesgo bajo pero real.** Corregido a *"las variables de conexión que imprime `npx convex dev`"*, con los tres nombres como ejemplo y no como lista cerrada |
| **§4** — reinstaurar el entorno | manda **copiar el fichero** `.env.local`, no enumerar su contenido | ✅ **Sano por construcción**: copiar un fichero no caduca cuando crece |
| **`checklist-produccion-real.md`** — ítems pendientes | lista abierta | ✅ **Sano y declarado**: dice explícitamente *"añade aquí cualquier otro ítem que se descubra"*. **Una enumeración que se declara incompleta no caduca: invita** |

📌 **El criterio para buscarlas, que es el que hay que aplicar a cualquier checklist futuro:**
*¿esta lista describe algo que puede crecer sin que el documento se entere?* Si la respuesta es
sí, **la lista se sustituye por el comando que la produce.**

#### 63.3 — Un secreto no se copia entre entornos: se genera

Criterio del QA, y es de seguridad, así que va como regla y no como nota de un checklist.

> **Las claves de firma no se copian entre deployments: se generan nuevas en cada uno.**
> Compartirlas significa que **un token emitido en un entorno vale en el otro** — y eso
> convierte el entorno de pruebas en **una llave del de producción**.

**Y su segunda mitad, igual de importante:** los secretos de terceros —`AUTH_GOOGLE_*`,
`RESEND_API_KEY`, `VAPID_*`— **no viajan a un entorno de pruebas en absoluto.** Si la suite no
los necesita, **copiarlos sería esparcirlos**, y ya hay precedente de por qué eso importa: el
navegador de la fábrica con las sesiones personales de Aitor dentro (decisión 47).

**Es la 47 con otra cara** —*no se policía lo que se puede leer, se quita lo que merece la pena
leer*— **aplicada a qué se lleva uno al montar un entorno nuevo.**

*Y el hallazgo no es la regla, es cómo apareció:* el QA la encontró **siguiendo el checklist**,
y en vez de copiar las trece variables **se paró a preguntarse cuáles debían existir en su
entorno**. Un checklist ejecutado al pie de la letra habría esparcido tres secretos reales a un
deployment nuevo sin que nada se quejara.

### Decisión 64 — Antes de creerte un negativo, comprueba que la herramienta sabe dar positivos (2026-09-08)

**Cuatro instancias el mismo día, en cuatro personas distintas.** Y **ninguna regla del tipo
"revisa tus comandos" las caza, porque los cuatro comandos eran correctos**: contestaban
perfectamente a una pregunta **parecida y distinta**.

> **Lo que las hace invisibles: la respuesta correcta a la pregunta equivocada se lee como la
> respuesta que esperabas.** `0` es *"no hay errores"*. `0` es *"estoy al día"*. Una línea de
> veredicto es *"el veredicto"*.

**Formulación de T3, y es la mejor que se ha escrito sobre esto:**

> ### **"Un código de salida no dice «fue bien», dice «la pregunta de esta herramienta se contestó que sí»."**

**64.1 — La regla, que es lo único que funcionó las cuatro veces:**

> **Antes de aceptar que una herramienta no encuentra algo, comprueba que encuentra algo que
> sabes que existe.**

*Caso:* la Directora se salvó de mandar un falso negativo — su `grep` dio cero con el patrón mal
escrito, y **buscó `markWon`, que sí estaba, antes de creerse el cero**.

**64.2 — Extiende la 58 fuera de los controles.** La 58 dice que **un detector** se estrena
apuntando al positivo conocido. La 64 dice lo mismo de **cualquier consulta puntual** — un
`grep`, un `rev-list`, un conteo.

⚠️ **Los controles los estrenamos con cuidado; las consultas del día a día, no.** Y el coste de
ese día: **reportar 31 verdes sobre un checkout de 19 commits atrás**, **relayar el veredicto de
otra tarea**, y **casi fijar un criterio de aceptación con un número equivocado**.

**64.3 — Corolario de T3: todo barrido declara qué NO puede ver con su criterio.** Es la **57.3
aplicada al instrumento en vez de al informe**, y lo sacó ella analizando un barrido propio que
no podía ver un caso.

### Decisión 65 — El arnés declara sus precondiciones; no se parchean una a una (2026-09-08)

> **Una suite que depende de precondiciones las comprueba al arrancar y falla nombrando la que
> falta.** No N fallos confusos al final: **uno claro al principio.**

**Arreglar dos precondiciones concretas deja la tercera para descubrirse igual** — con otra media
hora de diagnóstico y otro `main` en rojo que no era de `main`.

**Y el diagnóstico de T3 explica por qué esto se rearma solo, así que hay que atacarlo por la
clase y no por el caso:**

> **"`git pull` te trae el código fuente de una función de Convex; no la mete en tu
> deployment."**

Con tres worktrees con deployment propio, **eso vuelve a pasar cada vez que alguien mergea algo
de `convex/`**. **No es un incidente: es una propiedad de la topología que montamos** — y la
factura la paga quien la hereda sin saberlo.

⚠️ **Límite de alcance, y se respeta:** **construir eso es producto y lo decide el PM.** Lo que
fija el Factory Architect es que **el arnés debe declarar sus precondiciones** y que **la forma
general vale más que los dos parches**. Si AIT-93 se amplía o se abre otra issue, es decisión
suya.

#### 65.1 — El TERCER eje del triaje: ¿el fallo nombra su causa, o hay que buscarla?

**Este fallo no era de los silenciosos: los cinco rojos gritaban.** Lo que costó media hora **no
fue detectarlos, fue saber de qué eran.**

> **Un fallo ruidoso pero inatribuible cuesta casi lo mismo que uno silencioso, porque el tiempo
> se va en el diagnóstico, no en el descubrimiento.**

**Los tres ejes del triaje, juntos:**

1. **¿Falla hacia el verde o hacia el rojo?** — lo que falla hacia el verde no tiene quien lo
   cuente.
2. **¿La conclusión lleva a decir o a hacer?** — una afirmación se corrige; una acción
   destructiva, no. *(Y su tercer grado: escribir/configurar es irreversible **y** silencioso.)*
3. **¿El fallo nombra su causa, o hay que buscarla?** — un rojo inatribuible se paga en horas de
   diagnóstico, no en detección.

### Registro vivo de comprobaciones desacreditadas

| Comprobación | Cómo miente | Sustituto correcto |
|---|---|---|
| **Un error de red al llamar a un servicio de terceros, leído como "su servicio falla"** | **Confunde "me han contestado que no" con "no he llegado a preguntar".** `net::ERR_CONNECTION_CLOSED`, un DNS que no resuelve o un timeout **no son respuestas**: son la ausencia de una. Caso del 2026-09-08: verificando el login de Google tras AIT-90, la petición a `accounts.google.com` murió sin respuesta **desde ese entorno**; reportarlo como "el login está roto" habría sido un **falso rojo** — fallo del arnés vendido como fallo del producto | **mirar la petición real y su respuesta**, no el resultado agregado. Y separar los tres estados: *contestó que sí* · *contestó que no* · **no contestó**. El tercero no es un veredicto sobre el producto, es un veredicto sobre el entorno |
| **"El proceso no tiene terminal asociada, luego es un resto huérfano"** | **Es cierto y no significa nada.** Un proceso lanzado por un servidor MCP **nunca tiene tty** — igual que ninguno de los nuestros. La señal **no distingue huérfano de hijo de un servidor sano**. Caso del 2026-09-08: el QA leyó así 12 procesos de Chrome; los dos `playwright-mcp` padre estaban **vivos**, y uno de los navegadores se había arrancado **siete minutos antes**. Matarlos habría tirado la sesión de otro | **mirar el padre: `ps -p <ppid>`. Si vive, no es un resto.** Y por la 60.2, esta comprobación es **obligatoria** aquí: el siguiente paso era destructivo |
| **Medir algo sobre el texto de un documento que se describe a sí mismo** | **Cuenta la explicación como si fuera un caso.** El contador de filas verificadas del índice hacía `grep -c '✅'` sobre el fichero entero y contaba **el ✅ de la cabecera que explica qué significa la marca**: reportó *"1 de 56 verificadas"* con **cero** verificadas. Hermano de `grep <herramienta>` sobre un transcript (decisión 20): **el documento contiene los datos y además el texto que habla de los datos** | acotar la medición a la parte estructurada —`grep -E '^\|'` antes de contar, o parsear la tabla— **nunca al fichero entero**. Y sospechar por sistema de cualquier métrica sobre un documento que explica su propia notación (decisión 58.3) |
| **Empezar una espera con `rm -f <marker>` para no leer el de la ronda anterior** | **Borra los markers RECIÉN CREADOS por trabajo que terminó antes de que armaras la espera**, y entonces esperas para siempre algo que ya pasó. En palabras de la Directora, 2026-09-08: *"no es un dato viejo leído como nuevo: es el dato nuevo destruido por defenderse del viejo"*. Y no deja rastro: un marker ausente se ve igual que un trabajo que no ha terminado | **la ambigüedad temporal se resuelve comparando fechas, jamás borrando.** El `rm -f` va **después** de detectar el marker, nunca antes de esperarlo (decisión 50.2). Mejor aún: usa una señal observable —el proceso vivo o muerto— en vez de una marca (50.1) |
| **Pasarle a una herramienta un fichero por `filename` para que los valores NO pasen por la conversación** | **La herramienta puede hacer eco del fichero entero en su salida.** Verificado el 2026-09-08: el QA generó un script de disco a disco con Bash, sin imprimir nada, y se lo pasó a `browser_run_code_unsafe` por `filename` **precisamente para no exponer la sesión guardada**; la herramienta devolvió el contenido íntegro en su bloque "Ran Playwright code", JWT incluido. ⚠️ **El mecanismo diseñado para no exponer valores es el que los expone**, y falla en verde: el comando funciona, el script se ejecuta, el objetivo se cumple. *(Severidad de ESE caso: nula — token de la cuenta demo, caducado 61 min antes, refresh literal `"dummy"`. Lo que vale es el mecanismo.)* | **es un eje distinto de la decisión 32.1 y su comprobación NO lo caza:** la 32.1 cubre *dónde escribió* la herramienta; esto es *qué devuelve de lo que carga*. No hay sustituto seguro conocido — **si un fichero contiene un secreto, no se le pasa a una herramienta cuya salida no controlas**, ni por ruta |
| **Un export en `codigo para auditar/` = una tarea esperando auditoría** | **Los exports NO se borran al auditarse: siguen ahí después del GO.** Así que ver el fichero es compatible con "pendiente" y con "auditado hace tres minutos", y **el estado real no está en el fichero.** ⚠️ **Y lo grave es la asimetría: la carpeta nunca dice de menos.** Nunca vas a mirarla y perderte trabajo; **siempre vas a ver trabajo que ya no existe**, así que el error es sistemáticamente en la dirección de inventar atascos. Caso real, 2026-09-08: el CEO reportó a la Directora cuatro planes "esperando veredicto" cuando **los cuatro tenían GO**. Es la misma carpeta que semanas antes le hizo decir a la Directora que el backlog estaba agotado con cinco issues vivas en Linear | preguntarle a la Directora, o leer el **último** veredicto de la ventana de auditor con `get history of tab 1` — **`history`, no `contents`** (que solo trae lo visible), y **la ÚLTIMA** aparición de "Veredicto", porque el historial arrastra veredictos de tareas de hace horas. Ese mismo arrastre ya dio un falso positivo la misma noche: un GO de AIT-77 leído como si fuera de AIT-78. 📌 **`codigo para auditar/` es un espejo con restos, no un estado** |
| **`ps aux \| grep -c "[c]odex exec"` == 0, luego la auditoría no se ha disparado** | **Significa exactamente lo contrario: que YA TERMINÓ.** La señal es correcta y muy usada —la Directora caza con ella los veredictos perdidos—, pero **funciona en el sentido inverso al que invita la intuición**: un auditor vivo es una auditoría *en curso*; cero auditores vivos es una auditoría *acabada*, no una sin empezar. Caso real, 2026-09-08: el CEO leyó las tres ventanas de auditor en `-bash` como "no se ha disparado nada" y estaba viendo tres auditorías recién completadas | **cero procesos `codex` no es un estado del trabajo, es un estado de la máquina.** Para saber si hay algo pendiente hace falta el veredicto, no el proceso. Nota de forma: esta fila y la anterior son **la misma equivocación medida dos veces** — dos señales exactas, las dos sobre el sujeto equivocado (decisión 43), y **el error fue invisible en el resultado porque las dos coincidían** |
| **El estado que devuelve `ListAgents` — `busy`, `waiting`, o que la sesión no aparezca** | **Ningún estado de `ListAgents` es evidencia de que una sesión está viva y escuchando.** `busy` no separa "trabajando" de "bloqueada en un prompt": el Integrador estuvo **`busy` y sordo a la vez** durante 38 minutos, indistinguible de `busy` y trabajando. Y `waiting` tampoco es tranquilizador: T3 apareció `waiting` bloqueada en `ExitPlanMode`, indistinguible de ociosa legítima | cruzar SIEMPRE el estado con las entradas `queue-operation`/`enqueue` **sin drenar** del transcript. **Es la fila más importante de esta tabla, por frecuencia y por posición:** todas las demás engañan a quien ya está investigando; esta engaña a quien está decidiendo *si* investigar, que es la primera pregunta que se hace cualquiera. Evidencia del 2026-09-08: Integrador `busy` 38 min, T3 `waiting` ~30 min |
| **Una marca de tiempo sin huso horario** | **Se compara sin fricción contra otra de un huso distinto, y la resta sale plausible.** ⚠️ **Es peor que un dato ausente: una hora sin huso NO PARECE INCOMPLETA — parece un número.** Caso real, 2026-09-08: el censo del CEO iba en **UTC** y los latidos del watchdog en **local (UTC−3)**. El CEO aplicó la aritmética de la enmienda 6 correctamente **sobre dos números que no eran comparables**, y estuvo a punto de escalar a Aitor **una alarma perfectamente sana** — el mismo falso positivo que esa enmienda existía para evitar, reaparecido por otra puerta | **huso explícito en CADA marca de tiempo** — censos, artefactos y latidos (enmienda 8). ⚠️ **Acordar "usamos UTC" no sirve: es un principio y se incumple.** Escribir el huso en cada número **es una comprobación que se hace sola al leerla** |
| **Contar sesiones sobre un directorio de transcripts sin filtrar por vivas** | Aparecen sesiones **muertas de días atrás** con decenas de mensajes encolados **que nunca van a drenar**, y se leen como sesiones sordas. Caso real: 160 y 76 encolados de sesiones difuntas en el censo del CEO; y "21 sesiones vigiladas" en el watchdog que eran 21 ficheros con línea base y ocho sesiones vivas | **filtrar por actividad reciente antes de contar nada.** 📌 **Y el dato que lo hace regla y no dos anécdotas: los dos instrumentos tenían el mismo defecto y ninguno lo copió del otro.** No es descuido de nadie — **medir sobre un directorio de transcripts invita a ese error** |
| El `mtime` (o el tamaño) del `.jsonl` como señal de que una sesión está viva | **Crece al ENCOLAR mensajes entrantes**, no solo cuando la sesión produce algo. O sea: **una sesión sorda parece activa precisamente cuando alguien intenta hablarle** — y eso es lo que pasa siempre, porque en cuanto una terminal se atasca, los demás roles empiezan a escribirle. Un vigilante montado sobre esta señal **se queda mudo justo en el caso para el que se montó, y sin dar ninguna señal de estar fallando** | avance de la marca de tiempo del último evento **`assistant`** — lo último que la sesión ha **producido**, no lo último que le ha pasado. En una sesión que trabaja, `mtime` y último `assistant` van juntos; **en una atascada se separan, y esa separación ES el diagnóstico** |
| Una alarma automática que da falsos positivos | **Es PEOR que no tener alarma.** La primera vez avisa, la segunda la ignoras, y la tercera te has acostumbrado a ignorarla — justo cuando es real. El fallo no se nota porque el mecanismo *parece* funcionar: sigue emitiendo | validar la alarma contra una fuente independiente **antes** de que avise a nadie, y descartarla sin contemplaciones si falla. Caso real, 2026-09-08: el watchdog del Factory Architect necesitó **cuatro versiones**; la v3 disparó **19 falsos positivos** (incluidas sesiones de hace 24 días) porque marcaba una sesión como viva **la primera vez que la veía, no cuando la veía moverse** — inferir liveness de una observación que no la establece. Las tres versiones malas se cazaron cruzando con `ListAgents` **antes** de avisar a Aitor; sin ese cruce le habrían llegado 19 avisos falsos en una tarde |
| `find <dir> -name "*.jsonl" -newermt "<hora>"` en macOS | **Devuelve vacío sin error** si el flag no se comporta como se espera — y "no hay coincidencias" es indistinguible de "el flag no hizo nada". Hallazgo del Factory Architect, 2026-09-08: seis ficheros cumplían la condición y `find` no devolvió ninguno. **Habría concluido que ninguna sesión estaba activa, o sea que la fábrica entera estaba muerta** | `stat -f '%Sm' -t '%H:%M:%S'` sobre los ficheros y comparar las horas a mano |
| `grep <nombre de herramienta>` sobre un transcript | **Cuenta menciones en conversación como si fueran usos.** El CEO midió 2 `CronCreate` en tres sesiones que tenían **cero**: lo que contaba eran los mensajes de los propios roles discutiendo por qué no usarlo. **Y es estructural, no un despiste:** el transcript contiene los eventos **y además las conversaciones sobre los eventos**, y en esta fábrica la conversación supera con mucho a los eventos. **Cuanto más se discute un mecanismo, menos fiable se vuelve medirlo por texto** — o sea, el método se degrada justo cuando más se usa. Eso no se arregla teniendo cuidado | parsear el `.jsonl` y contar solo los bloques `tool_use` cuyo `name` sea la herramienta — ver `ceo.md`, "El transcript se parsea, nunca se grepea", con el código concreto |
| **La suite `e2e` en verde, luego TU rama está sana** | **Puede haber medido la rama de OTRA terminal.** `playwright.config.ts` codifica `localhost:3000` (líneas 14 y 25) con `reuseExistingServer: true`, así que se engancha a lo que haya escuchando. Es **el falso verde más peligroso del catálogo**, por tres razones juntas: **(1) un rojo se investiga; un verde no se investiga nunca** — esa asimetría es lo que lo hace caro; **(2) cuanto más sanas estén las ramas de los demás, más convincente es el engaño** — el modo de fallo *mejora* con la salud del vecino; **(3) vive en un fichero versionado**, así que sobrevive a la tarea, a la sesión y a cualquier recreación | comprobar de quién es el 3000 antes de correr e2e (`lsof` + `cwd` del proceso). **Arreglo de fondo: el puerto sale de una variable de entorno con 3000 por defecto**, para que cada worktree fije el suyo sin tocar el fichero compartido — y entonces `reuseExistingServer` vuelve a ser seguro, porque cada terminal es dueña de su puerto. Hallazgo de T2, 2026-09-08; **ese día solo se evitó porque aplicó a mano una comprobación que no estaba escrita en ningún sitio** |
| `npm run dev` responde en `localhost:3000`, luego el servidor es el tuyo | **Puede ser el de OTRA terminal ocupando el puerto.** Responde en 2 segundos y todo parece normal — pero estarías validando el worktree de otra rama y reportándolo como tuyo. Agravante: `reuseExistingServer: true` en `playwright.config.ts` hace que Playwright **se enganche a lo que haya escuchando sin preguntar de quién es**. Con varias terminales en paralelo no es hipotético | `lsof -nP -iTCP:3000 -sTCP:LISTEN -t` y mirar el `cwd` del proceso: tiene que ser TU worktree. Hallazgo de T3, 2026-09-08 — comprobó que el suyo sí lo era y **lo reportó igual en vez de callárselo**. También en `intro-terminal.txt`, porque es paso previo de cualquier verificación en navegador |
| "La mutation devolvió error, luego no escribió nada" | **Un error devuelto no prueba que no se escribiera.** Es el mismo "comprueba el efecto, no el retorno" del resto de la tabla, aplicado **al caso denegado**, que es donde menos se mira | volver a entrar como el otro usuario y comprobar el estado real (que la ficha siga con el mismo número de registros). Hallazgo de T3 probando autorización, 2026-09-08 |
| Leer `process.env.X` en el **middleware Edge de Next.js** y creer que lee el entorno | **Se sustituye por un literal en tiempo de build.** El código *parece* leer el entorno y no lo hace — sobrevive a cualquier revisión de código, y solo falla **al segundo deploy**, cuando ya nadie lo relaciona con el cambio | verificar el valor **sobre el artefacto ya construido**, no leyendo el código: una build, dos arranques con valores distintos. Hallazgo de T2 el 2026-09-08, construyendo AIT-79 — que es justamente la tarea que existe para cerrar un falso verde, y estuvo a punto de nacer con uno dentro |
| `npx tsc --noEmit` limpio **tras cambiar el tipo de retorno de una función** | **No protege un contrato que desemboca en un template literal.** `` router.push(`/oportunidades/${result}`) `` **compila con cualquier cosa** — si `result` pasa de ser un id a ser un objeto, el typecheck sigue en verde y la app navega a `/oportunidades/[object Object]`. Por el mismo camino se puede romper el contrato de una función de **otra tarea** sin que nada lo señale | **"el typecheck pasa" no dice NADA sobre un cambio de forma de retorno.** Hay que ejercitar el camino: lo cazó la suite e2e, no el compilador. Hallazgo de T3, 2026-09-08, implementando AIT-80 — y le rompió además, sin darse cuenta, una función de AIT-74 |
| La ruta que le pasas a una herramienta para que escriba un fichero | **Puede resolverla contra otro directorio sin avisar.** Verificado en vivo el 2026-09-08: el MCP de Playwright **ignoró una ruta absoluta** y resolvió relativo a la raíz del proyecto. El fichero —un volcado de sesión con tokens de autenticación— apareció suelto en la raíz, untracked y sin ignorar, a un `git add -A` de entrar en el repo | **comprobar dónde apareció el fichero, no dónde lo pediste.** Pedir una ruta no es lo mismo que obtenerla |
| **`git add <rutas explícitas>` como protección contra arrastrar trabajo ajeno** | **No protege: `git commit` sube el ÍNDICE ENTERO, no lo que acabas de añadir.** En un checkout compartido **el índice es estado compartido** — si otro rol dejó algo staged, entra en tu commit aunque tú hayas nombrado tus ficheros uno a uno. Verificado el 2026-09-08: el CEO commiteó dos `.md` por ruta explícita y arrastró `.claude/settings.json`, **un fichero de permisos**, que el Factory Architect tenía staged y estaba a punto de commitear con su propio mensaje | **`git commit -- <rutas>`**, que commitea solo esas rutas ignorando el resto del índice. Y antes de commitear, mirar `git diff --cached --name-only`. ⚠️ **La decisión 18.2 decía "commitea por ruta explícita" y eso resultó ser un principio disfrazado de control** — parecía una comprobación y no lo era |
| `git add -A` en un checkout compartido | **No falla, no avisa, y se lleva lo que encuentre** — incluido trabajo en curso de otro rol que casualmente use la misma carpeta | **commitear por ruta explícita**; `git add -A` queda prohibido en la raíz (decisión 18.2). **La historia entera, porque la regla sola no enseña:** el 2026-09-08 el CEO hizo `add -A` desde la raíz para commitear documentación y arrastró un `throw new Error` que el QA había inyectado en `app/login/page.tsx` para poder ver renderizada `app/error.tsx` — una prueba legítima, bien marcada como temporal y revertida por él dos minutos después. El commit llegó a crearse. **Lo único que lo paró fue la comprobación de la decisión 9** (`git diff --name-only origin/main..main \| grep -E '^(app\|convex\|…)'`), escrita tres horas antes para algo completamente distinto: no arrastrar código en un push de documentación. Si llega a `main`, Railway despliega un login que revienta al cargar |
| `grep <patrón> fichero \| head -1 && echo "APARECE"` | **Da positivo con CERO coincidencias.** En una tubería, `&&` evalúa el código de salida del ÚLTIMO comando (`head`, que devuelve 0 aunque grep no encuentre nada), no el del que te interesa | **cuenta ocurrencias y mira el número** (`grep -c`), nunca encadenes con `&&` sobre una tubería. Misma familia que `npm test \| tail`, con otro comando: la lección general es que **el código de salida de una tubería es el del último eslabón**. Hallazgo del Integrador, 2026-09-08, verificando AIT-76: estuvo a un paso de reportar un fallo inexistente y no cerrar una tarea correcta |
| `osascript ... close` sobre una ventana | exit 0 sin haber cerrado nada | volver a listar las ventanas y confirmar que el `id` ya no está |
| `set w to make new window` | crea una ventana sin tab; el `do script ... in w` posterior revienta con -10000 | retirado (§4ter) — usar `do script` sin destino + comparación de conjuntos de ids |
| `tty` desde la herramienta Bash | devuelve siempre "not a tty", no el tty real de la ventana | `ps -o tty= -p $PPID` |
| `git status` en una rama sin upstream | verde limpio, **sin** la línea `ahead N`, con commits sin subir | `git log origin/main..main` — y configurar el upstream (`git branch --set-upstream-to`) |
| `git commit` OK | se lee como "guardado", pero el trabajo existe **en un solo disco**, sin publicar | confirmar que `git log origin/main..main` está vacío. **Misma trampa que la fila anterior por otro camino**, y juntas explican las dos veces que pasó el 2026-09-08: 11 commits de PRD y luego 3 más, todos commiteados "correctamente" y ninguno subido |
| "Worktree limpio + sin fichero `plan-loop<N>`" como señal de que un desarrollador está parado | **Es el estado ESPERADO durante la fase de plan, no un bloqueo.** `EnterPlanMode` es de solo lectura: impide crear ningún fichero fuera del plan interno del harness, así que mientras dura la fase no hay nada que ver en disco. La Directora dio por parada a T3 por esto el 2026-09-08 | comprobar si la sesión aparece `busy` en `ListAgents`, y el transcript (nivel 1). **Con el gate de plan ya obligatorio esto va a pasar con CADA desarrollador**, así que no es un caso aislado: hallazgo de T3, añadido por el CEO el mismo día |
| `screencapture -l <id>` sin permiso de Grabación de Pantalla | **exit 0 y un fichero PNG creado**, pero la imagen es un rectángulo en blanco de 80×116 px, no la ventana (verificado por el CEO sobre su propia ventana, 2026-09-08). A la Directora, sobre otra ventana, le dio error explícito — o sea que **el mismo comando falla de dos formas distintas según el caso, y una de ellas en verde** | abrir la imagen y mirarla, **nunca fiarse del exit code ni de que el fichero exista**. Comprobar tamaño/dimensiones plausibles antes de concluir nada de una captura |
| `npm test \| tail` | devuelve el exit code de `tail`, no el de los tests | leer la línea `N passed` / `N failed` de la salida |
| `npx convex codegen` | regenera tipos/bindings; **no publica funciones al backend** | verificar el build de Railway — ver §2 paso 4 |
| `git push` exitoso | no dice absolutamente nada del build que dispara | `railway logs --build <id>`, confirmando que `convex deploy` terminó en SUCCESS — ver §2 paso 4 |

Las dos últimas ya estaban descritas en §2 paso 4 desde agosto, como incidentes
independientes: **son las dos publicaciones más caras que ha tenido este proyecto** (AIT-33
y AIT-35 dadas por publicadas sin que sus mutations existieran en el backend; cuatro horas
de build roto en producción sin que nadie lo detectara). Llevaban semanas documentadas sin
que nadie viera que eran la misma clase de fallo que las otras cinco. Esta sección no
inventa un problema nuevo: le pone nombre a uno ya pagado dos veces.

### Un recurso local codificado en un fichero versionado es una colisión esperando a ocurrir (decisión 41.3)

> **En una fábrica con varios worktrees, todo fichero versionado que codifique un recurso
> local de la máquina —un puerto, una ruta, un deployment— es una colisión esperando a
> ocurrir.**

**Y no es la primera vez: ya tenemos el precedente resuelto en casa.** §3bis es exactamente
este patrón —un **deployment de Convex compartido** codificado para todos— con el mismo tipo
de fallo (una terminal pisando el trabajo de otra sin enterarse) y la misma solución: **uno
por terminal**. El puerto 3000 de `playwright.config.ts` es el segundo caso, no un incidente
aislado.

📌 **Es además hermano de la decisión 37:** el índice de git y `playwright.config.ts` son
**estado compartido que nadie declaró como compartido**. Ahí está la raíz común de los dos.

**Candidatos por revisar con este criterio:** cualquier otro recurso local de la máquina
codificado en el repo. Nadie ha hecho ese barrido todavía.

⚠️ **En esta máquina las herramientas de línea de comandos son BSD, no GNU** — y eso ya ha
causado **dos falsos negativos silenciosos** distintos: el `sed -i` de los autotests de
`talent-prd` (§7) y el `find -newermt` de la tabla de arriba. **Un flag que no existe o se
comporta distinto en BSD no suele dar error: da un resultado vacío o equivocado, en
silencio.** Antes de fiarte de un flag poco común, compruébalo contra un caso que sepas que
debería dar resultado — o usa la variante portable.

**Quien se tope con una comprobación que miente en verde la añade a esta tabla en ese
momento**, aunque ya la haya rodeado y no le bloquee — mismo criterio que `CLAUDE.md` para
commitear lo que das por hecho. Las seis primeras salieron porque tres roles distintos las
cazaron por separado en una sola tarde; la tabla existe para que la séptima no cueste otro
incidente.

---

### Los tres bloqueos, y cuál se puede oír (2026-09-08)

Tabla del Integrador, adoptada por el Factory Architect (decisión 17.3). Los tres congelan
la cola de mensajes entrantes de la sesión; **lo que los diferencia es si alguien puede
enterarse**:

| Bloqueo | ¿congela la cola? | ¿suena el aviso de voz? |
|---|---|---|
| `PermissionRequest` | sí | **sí** — verificado en vivo 2026-09-04 |
| Pantalla de aprobación de `ExitPlanMode` | sí | **NO VERIFICADO** — ver §7 |
| `AskUserQuestion` (selector interactivo) | sí | **no, y no puede** |

**La última fila es el argumento definitivo de §2septies**, y llega desde otro ángulo: el
selector no está prohibido solo por bloquear — está prohibido porque **es el único de los
tres bloqueos que nadie puede oír, ni ahora ni nunca**. `AskUserQuestion` no pasa por el
sistema de permisos, así que **ningún hook puede cubrirlo por diseño**. Aunque mañana se
verifique el de `ExitPlanMode` y funcione, esa fila seguiría muda para siempre.

⚠️ **Y el aviso de voz que existe hoy no dice quién lo pide.** Los dos hooks
(`Stop` y `PermissionRequest`) derivan la identidad del rol de `basename "$PWD"`, con un
`case` que solo contempla `T1|T2|T3` y manda todo lo demás a un comodín que dice *"la
terminal directora"*. Desde que `/factory` puso **seis roles centrales en la misma
carpeta**, cinco de los seis se anuncian con el nombre de otro — en una fábrica de seis
ventanas, eso manda a mirar al sitio equivocado, que es peor que no avisar.

**Peor todavía, y es lo que casi nadie ve:** el marcador del hook de `Stop` es
`/tmp/claude-crm-notify-$d`, con el mismo `$d`. Para los seis roles centrales **es el mismo
fichero**, y el hook lo borra al sonar. O sea que **el marcador que pone un rol se lo lleva
el primer turno que termine, sea de quien sea**: no es solo una etiqueta mal puesta, es que
**las alertas se roban entre sesiones** y la del rol que de verdad necesitaba atención
desaparece sin que nadie lo note. Pendiente de arreglo (decisión 17.1/17.2: identidad por
variable de entorno fijada al arrancar la ventana, y marcador por rol) — **es configuración
de `settings.local.json`, así que lo decide Aitor.**

## 2sexies-bis. Lo que se ejecuta se cumple; lo que se recuerda, no (2026-09-08)

Decisión 29. Sale de una pregunta del Factory Architect después de incumplir una regla que
él mismo había escrito dos horas antes: *"la regla existía, estaba escrita, y aun así la
incumplí — así que escribirla no basta. ¿Cómo hacer que se aplique en el momento de
concluir y no solo en el de revisar?"*

**La observación que lo sostiene, y es incómoda:** el 2026-09-08 los roles de esta fábrica
se corrigieron mutuamente **siete veces**. **Ninguna la provocó la regla escrita. Todas las
provocó otro rol mirando el dato.** Las reglas no se aplicaron solas ni una sola vez.

> ### La evidencia más fuerte que tenemos de esta decisión
>
> El 2026-09-08 el CEO **grepeó prosa** para resolver qué transcript era de qué rol —y le
> salieron tres transcripts etiquetados como el mismo rol— **cometiendo la decisión 20
> (*el transcript se parsea, nunca se grepea*) en el mismo ciclo en que esa regla estaba
> escrita literalmente en su propio prompt de barrido.**
>
> **Una regla en el prompt de un `/loop` es lo más cerca que un principio puede estar de un
> control: se reinyecta literal en cada ciclo, sin depender de que nadie la recuerde. Y aun
> así no impidió nada.**
>
> **Si eso no basta, nada que dependa de leer basta.**

**Y el patrón que separa las que sí funcionaron de las que no:**

- **Las que se convirtieron en una comprobación ejecutable se cumplieron sin esfuerzo.** El
  `git add -A` que estuvo a punto de publicar un login roto lo frenó un `grep` que corría
  antes del push — no un principio recordado. El autotest del watchdog cazó tres versiones
  defectuosas por el mismo motivo.
- **Las que se quedaron en principio se incumplieron el mismo día que se escribieron.** El
  Factory Architect concluyó desde `ListAgents` habiendo prohibido eso él mismo; el CEO
  afirmó que una sesión producía usando un dato de cinco minutos antes, habiendo escrito la
  regla de la distancia entre medir y afirmar.

> **La pregunta obligatoria al escribir una regla nueva: *"¿esto puede convertirse en algo
> que se ejecute antes de la conclusión, o se queda en algo que hay que recordar?"***
>
> **Si se queda en principio, decláralo.** Es una regla de segunda categoría y hay que
> asumir que se incumplirá — no por descuido de nadie, sino porque hoy no tenemos ninguna
> evidencia de que un principio escrito haya cambiado una conclusión en el momento de
> tomarla.

### La categoría peor: una regla que PARECE control y no lo es (decisión 37)

Faltaba el caso más dañino, y lo destapó el episodio del `settings.json`:

> **Una regla que parece una comprobación y no lo es es PEOR que un principio declarado —
> porque un principio sabe que se incumple, y esta no despierta ninguna desconfianza.**
>
> **Enunciado corto: *un control que nadie ha probado es un principio con disfraz.***

*El caso:* la 18.2 decía *"commitea por ruta explícita"*. El CEO lo hizo — `git add` con los
dos ficheros nombrados — y aun así arrastró un fichero de permisos ajeno, **porque `git
commit` sube el índice entero**. Los cuatro roles aplicaban esa regla sintiéndose
protegidos.

**Y el detalle que lo cierra, del Factory Architect sobre sí mismo:** él **sí** corrió
`git diff --cached --name-only` antes de commitear, y salió **solo su fichero**. Su
comprobación **era correcta cuando la hizo y falsa tres segundos después**, porque el commit
del otro se llevó el índice por delante. Es la decisión 22 con una vuelta nueva: **en un
checkout compartido, `git diff --cached` es una medición que caduca de inmediato — el índice
no es de nadie, es de los cuatro.**

**37.3 — Esto reordena el repaso pendiente de las decisiones.** No se empieza por *"¿cuáles
admiten volverse comprobación?"* sino por **"¿cuáles YA PARECEN comprobación y no lo son?"**
Esas son las urgentes; **las otras al menos no engañan.**

**37.4 — Criterio de adopción: un control se PRUEBA, no se razona.** Ningún control se
declara vigente sin haberse ejecutado **una vez a propósito, incluida su forma exacta**.
Evidencia de por qué: el primer intento de usar la forma corregida (`git commit -- <ruta>
-F -`) **falló** — después de `--` todo se interpreta como ruta, y el orden bueno es
`git commit -F - -- <rutas>`. **Que el arreglo de una regla tenga a su vez una trampa de
sintaxis demuestra la regla entera.** Es el mismo criterio que el autor del watchdog se
impuso tras fallar seis versiones razonando en vez de probando.

📌 **Y sube la prioridad del hook de la decisión 33, no la baja:** incluso la forma corregida
depende de que alguien recuerde escribirla bien, y acabamos de ver que tiene trampa.
**Mientras cuatro roles commiteen desde el mismo checkout, la única defensa real corre antes
del commit, no en la cabeza de quien lo teclea.**

**Y la segunda mitad, que la afina y viene del QA — el rol que menos toca proceso:** *lo que
hay que recordar **tiene que caber en una frase**, y si no cabe, hay que ejecutarlo.*

Su ejemplo lo demuestra mejor que el argumento: de toda la decisión 32.1, lo que le sirve
es ***"pedir una ruta no es lo mismo que obtenerla"***. Esa frase la va a tener presente la
próxima vez que una herramienta escriba un fichero; **el párrafo entero, no.**

> **Cada regla que se quede en principio necesita SU ENUNCIADO CORTO, o no es una regla: es
> un párrafo.** Y una regla que **no admite** enunciado corto es una **candidata a control
> ejecutable**, no a documento.

Aplica también hacia atrás, junto con el repaso ya pendiente: al revisar las decisiones
anteriores, a cada una que se quede en principio hay que darle su frase — o reconocer que
pide código en vez de prosa.

**El patrón en miniatura, y es el ejemplo a imitar:** en vez de *"no concluyas que una
sesión está parada desde un dato viejo"* —que es un principio y se incumple—, la versión
ejecutable es **"antes de afirmar que una sesión está parada, imprime su último `assistant`
y la hora actual"**. No impide equivocarse; **pone el dato caducado delante de los ojos en
el instante de concluir**, que es exactamente donde fallaron los dos. Ya está aplicado en
el barrido del CEO y en las alertas del watchdog, que imprimen la hora junto a la medición
para que la distancia se vea sin calcularla.

⚠️ **Y esta decisión, a diferencia del resto, hay que aplicarla HACIA ATRÁS:** repasar las
demás y separar cuáles admiten volverse comprobación y cuáles se quedan en principio
declarado. Queda pendiente y escrito para que no se pierda.

### Manda la tabla, no la conclusión (decisión 31)

La forma más útil que ha tomado lo anterior, y sale de un error del CEO: reportó *"cero
sesiones con cola pendiente"* mientras su propia tabla decía `PM … pendientes 1`. Miró la
columna, vio ceros en siete filas y generalizó sin leer la octava.

**El daño no fue el dato erróneo: fue que el Factory Architect estuvo a punto de registrar
un límite inexistente en su propio instrumento** —y de cambiarlo— porque la discrepancia
que veía no existía. **Hacer desconfiar a alguien de una herramienta que funciona es peor
que darle un dato suelto equivocado.**

> **Un resumen es un artefacto degradado.** Cuando la medición es **lo que el otro rol va a
> usar para decidir**, manda **las filas**, y que la conclusión **acompañe** a los datos en
> vez de sustituirlos.

**Alcance, para que no se convierta en volcar datos por sistema:** aplica cuando el otro va
a decidir sobre esa medición. Para lo demás, un resumen sigue estando bien.

**Es la decisión 22 desplazada un paso:** aquella cubre la distancia entre **medir y
afirmar**; esta, la distancia entre **medir y transmitir**. En los dos casos el dato existía
y era correcto — lo que falló fue el paso siguiente.

📌 **Y el fallo era de los dos lados, que es lo que lo hace regla y no anécdota:** uno mandó
un resumen, y el otro **lo usó como si fuera una medición**. Quien pide artefacto para un
`/loop` no puede aceptar una conclusión agregada para un censo.

### Decisión 52 — Un gate que solo se ejecuta una vez es documentación (2026-09-08)

Frase del Integrador, literal:

> ***"Un gate que solo se ejecuta una vez es documentación. Ejecutable, es una prueba de
> regresión."***

**Y el hallazgo operativo es que ya teníamos uno y nadie lo sabía:** el gate de AIT-79 estaba
escrito desde entonces, **cuesta veinte segundos**, y se había ejecutado **una sola vez**.

**52.1 — Todo gate que se escriba para una publicación concreta se anota como reejecutable**,
con **su coste** y **su condición de disparo**: qué tiene que pasar para que merezca volver a
correrse. El del Integrador es el ejemplo: *cuando se publique un consumidor de lo que este
gate protege.*

**Y el momento en que corre no es una preferencia** (refinado 2026-09-08):

> **Lo fija cuándo existe la cosa que verifica.** Un **contrato** existe en el diff, así que se
> comprueba **antes de mergear**. Un **despliegue** no existe hasta que se publica, así que
> solo puede comprobarse **después**.

⚠️ **Corolario, porque "gate posterior a la publicación" suena a control debilitado y no lo
es:** un gate que corre después de publicar **no es más laxo**. Es el **único momento posible**
para lo que mira. Que corra después no significa que llegue tarde — significa que **antes no
había nada que mirar**.

**52.2 — Esto convierte los gates existentes en una suite de regresión gratis.** No hay que
construir nada: **hay que anotar lo que ya está escrito.**

**Inventario, barrido el 2026-09-08 sobre los 133 ficheros de `codigo para auditar/`:**

| Gate | Cuándo corre | Coste | Condición de disparo |
|---|---|---|---|
| **AIT-79** — el identificador de versión sigue a los despliegues (`T2_AIT-79_..._gate.txt`) | **después** de publicar, por diseño | ~20 s | **cuando se publique un consumidor** de lo que protege. **Ya se disparó una vez:** al publicar AIT-83 se reejecutó completo **por efecto, no por diff**, y siguió pasando |
| **AIT-81** — contrato de `customers.source` (`T2_AIT-81_..._publicacion.txt`) | inmediatamente **antes** del merge | segundos | cuando se toque el catálogo de valores de `source`, o cualquier escritura que lo alimente |

**Y la autocrítica de la Directora, que es la parte que enseña, con su nombre:** ella cruzó el
gate de AIT-79 comprobando que el diff no tocara los ficheros protegidos. **Eso demuestra la
intención, no el resultado** — es la distinción hecho/intención (enmienda 10) aplicada a una
verificación. En sus palabras: ***"él lo vio y yo no."*** El Integrador lo reejecutó por
efecto, y esa es la diferencia entre las dos filas de arriba y una nota en un documento.

#### La otra mitad de la 31: un dato relevado no es un dato medido (2026-09-08)

> **La precisión no sobrevive a un relevo, por cuidadoso que sea cada eslabón — porque cada
> uno copia en vez de medir.**
>
> **El último que va a usar un dato lo mide.**

**Son las dos mitades del mismo problema:** la 31 —*manda la tabla, no la conclusión*— evita
que el dato **se pierda** por el camino. Esta evita que **llegue deformado**. Y lo que la caza
no es más cuidado en el relevo: **es que el consumidor final vuelva a la fuente.**

*Caso del día, y lo que lo hace regla:* una hora llegó **23 minutos desviada al final de una
cadena en la que los tres eslabones iban con cuidado** — la Directora midió, el Factory
Architect avisó explícitamente de que él no lo había verificado, y el CEO lo verificó. El
cuidado de todos no impidió la deriva; **volver a la fuente sí la detectó**.

⚠️ **Y la ironía que la hace difícil de ver: una hora es el dato más fácil de relevar mal,
porque una hora equivocada sigue pareciendo una hora.** No se distingue de una buena por su
forma. Es la misma propiedad que hace peligrosa a la enmienda 8 con los husos.

#### 57.3 — El silencio se lee como cobertura (2026-09-08)

**Hermana de la regla de arriba, y hay que leerlas juntas: allí se deforma el dato; aquí se
pierden sus límites.** En los dos casos el eslabón intermedio transmite el resultado y **deja
atrás la parte que decía cuánto valía**.

> ### **El silencio se lee como cobertura.**

*El hallazgo es el autoinforme de la Directora, y por eso vale.* Escribió **"publicada y
verificada" doce veces**. Lo exacto era *"verificado que se construye, se despliega y las rutas
que comprobé responden"*. **Ninguno de los doce informes mintió** — y entre los doce
construyeron la impresión de que alguien mira la suite antes de `main`. **Nadie la mira. La
cobertura imaginaria la construyó lo que no decían.**

**La regla: todo informe de publicación declara qué se verificó Y QUÉ NO.** No es una coletilla
defensiva — es **la única forma de que el lector sepa qué queda descubierto**.

⚠️ **Y su mitad menos evidente: quien relaya una verificación ajena hereda la obligación de
declarar sus límites, no solo su resultado.** Es §2ter(b) aplicado al relevo.

*En sus propias palabras, que es como conviene que se lea:* **"se lo he pedido toda la noche a
las tres terminales y no me lo he aplicado al informar"**.

### Un control nuevo se estrena con el estado ya conciliado (decisión 46, 2026-09-08)

> **Un control nuevo se estrena con el estado ya conciliado, o nace desacreditado.**

Cierra el hueco que quedaba entre las otras dos de esta sección. La **29** dice que lo que
se ejecuta se cumple y lo que se recuerda no. La **37** dice que un control que nadie ha
probado es un principio con disfraz. Faltaba esto: **un control probado y correcto también
puede nacer muerto si arranca sobre un estado sucio.**

*De dónde sale, 2026-09-08.* Al ejecutar la decisión 45.3 —comparar cada ciclo todo `ref` de
`ListAgents` contra el registro de agentes— las líneas antiguas del registro no llevaban ref.
Armar la comparación tal cual habría reportado **seis discrepancias falsas** en el primer
barrido: los seis roles de raíz, todos correctos. Así que se re-registraron por ref las nueve
sesiones vivas **antes** de armar nada.

**Por qué importa tanto, y por qué el fallo no se vería:** un control que grita en falso desde
el primer ciclo **se desactiva mentalmente en el segundo**. Nadie lo apaga, nadie lo borra,
no deja rastro de haberse roto — **simplemente deja de leerse**, y el instrumento sigue ahí
emitiendo, aparentemente sano. Es la misma forma que la fila "una alarma automática que da
falsos positivos" del §2sexies, pero un paso antes: **allí el instrumento se estropea con el
uso; aquí nace estropeado.**

**Aplicación pendiente, la primera:** cuando Aitor autorice `core.hooksPath`, el hook de
secretos **se estrena con el estado ya limpio** — no confiando en que el primer ciclo salga
tranquilo.

---

## 2septies. Una regla que manda preguntar a un humano tiene que fijar el CANAL (2026-09-08)

Decisión 15 del Factory Architect. Nace del incidente más serio del día, que no fue el
bloqueo en sí sino lo que reveló.

**El bucle:** el Integrador abrió un selector interactivo a las 17:08 para pedir un visto
bueno, siguiendo una regla que le había llegado. Eso lo dejó **sordo**. A las 17:24 se le
mandó la corrección de esa misma regla — *"no te bloquees, el modo es `autonomo`, publica
sin preguntar"* — y **entró en la cola que él ya no podía leer**, donde se quedó 22
minutos. Lo desbloqueó un humano a mano, porque era el único canal que quedaba.

> **Ninguna regla que pueda dejar sorda a una sesión puede depender de un mensaje para
> corregirse.** "Si me equivoco, se lo digo y lo arregla" deja de ser una red de seguridad
> justo en el momento en que hace falta. Es el análogo, en la mensajería, de un `close`
> que devuelve sin error: el canal de corrección **parece** existir y no existe.

**La regla, y aplica a toda la fábrica, no a un rol:** cuando un documento de proceso mande
consultar a un humano, **especifica siempre con qué mecanismo — y ese mecanismo nunca
puede bloquear el procesamiento de mensajes entrantes de la sesión.**

**⚠️ La primera versión de esta regla prohibía el selector en toda la fábrica. Era
demasiado ancha y se corrigió el mismo día (enmienda 4), con evidencia del PM:** él lo usó
una docena de veces esa tarde y **los mensajes de los demás roles le llegaron igual** —
encolados y entregados junto con la respuesta, sin pérdida y sin que nadie desbloqueara
nada. Eso desmonta la premisa: se había generalizado desde un solo caso asumiendo que la
causa era la herramienta. **La variable no es la herramienta, es si alguien está mirando
esa ventana.** El PM obtiene respuesta en segundos porque es la sesión con la que Aitor
está conversando; el Integrador esperó 27 minutos porque nadie miraba la suya. La
prohibición universal habría destruido la herramienta con la que se tomaron **nueve o diez
decisiones de producto** ese día, para arreglar un problema que no era suyo.

**El criterio vigente, autoevaluable por quien va a preguntar:**

> Antes de abrir un selector, pregúntate: **"si me quedo sordo treinta minutos ahora mismo,
> ¿se para algo o alguien?"**
> - **No** (una consulta de producto, una duda que no bloquea a nadie): el selector está
>   **permitido**, y además es la mejor herramienta — da opciones estructuradas, con su
>   coste y una recomendación.
> - **Sí** (tienes trabajo con GO en la mano, estás en el camino crítico, alguien espera
>   algo tuyo): **nada de selector** — mensaje directo + alerta visible.

El Integrador cae claramente en el segundo caso: es el único rol que puede publicar, y
quedó fuera de alcance con una tarea aprobada esperando. El PM cae en el primero.

**Condición para los dos casos, venga de donde venga: quien vaya a abrir un selector avisa
ANTES de quedarse sordo** (la 16.1, generalizada a cualquier rol y no solo a
desarrolladores en fase de plan). Así, aunque nadie mire esa ventana, la sordera es
**conocida** en vez de un misterio de treinta minutos.

**Lo que no cambia:** `AskUserQuestion` sigue siendo el único de los tres bloqueos que
**ningún hook puede oír, por diseño** (ver la tabla de arriba). Que el PM no lo sufra no lo
hace menos cierto — lo hace irrelevante *para él*, que es distinto. Por eso el criterio va
sobre consecuencias, no sobre si te ha ido bien hasta ahora.

📌 **Y esta parte la decide Aitor, no la fábrica:** todo esto toca **cómo quiere él que se
le pregunte**. Lo de arriba es una recomendación en esa dimensión; si prefiere otra cosa,
manda él.
- **Esto va donde se leen las reglas al ESCRIBIRLAS**, no solo donde se obedecen: `ceo.md`
  y `factory-architect.md`, además de los documentos de rol.

**Y el coste, que va escrito en la decisión y no se descubre ejecutándola:** el modo
`confirmar` implica que **una publicación queda esperando a un humano**, con el tiempo que
eso tarde. Ese es el precio correcto para algo irreversible. Lo que nunca fue el diseño es
que la sesión se cayera del pipeline mientras espera — eso era la implementación, no la
regla, y lo arregla fijar el canal.

**Variante estructural, todavía abierta:** el gate de fase de plan garantiza que **todo
desarrollador** acabe en la pantalla de aprobación de `ExitPlanMode`, y sordo mientras está
ahí — no es mala suerte, lo produce el proceso. Paliativo aplicado por la Directora: avisar
en el brief de que esa pantalla aparecerá, que es normal, y que la primera acción tras
aprobarla **no es programar sino exportar el plan y esperar el GO** (los tres caminos que
ofrece la pantalla llevan a programar; ninguno dice eso).

---

## 2octies. La raíz no es banco de pruebas de código (2026-09-08)

Decisión 18. La raíz es **checkout compartido de cuatro roles** (Directora, Integrador, QA,
CEO) y no había ninguna regla sobre dejar ahí cambios de código sin commitear. El hueco no
es de nadie en concreto: **"necesito tocar código para probar algo" no tenía sitio
asignado, y por defecto acaba en la raíz.**

- **18.1 — Cualquier rol que necesite modificar código para probar algo lo hace en un
  worktree, nunca en la raíz.** La raíz es para coordinar y publicar, no para experimentar.
  Esto aplica **aunque el rol viva en la raíz** (el QA es rol central y `qa.md` le dice que
  corre ahí): el sitio donde vives y el sitio donde experimentas son cosas distintas.
- **18.2 — En un checkout compartido se commitea por ruta explícita. `git add -A` queda
  prohibido.** Ver su fila en §2sexies, con el caso real que casi lo paga.
  - ⚠️ **CORREGIDA el mismo día: `git add <rutas>` NO basta.** `git commit` sube el índice
    entero, y **en un checkout compartido el índice es estado compartido** — lo que otro
    rol dejó staged entra en tu commit aunque tú hayas nombrado tus ficheros uno a uno.
    **La forma correcta es `git commit -- <rutas>`**, que ignora el resto del índice, y
    mirar `git diff --cached --name-only` antes.
  - 📌 **Y la lección de método, que vale más que el arreglo:** la 18.2 **parecía un
    control y era un principio disfrazado**. Todos la aplicamos creyendo estar protegidos.
    Al repasar las decisiones buscando cuáles admiten volverse comprobación (decisión 29),
    hay que mirar también **las que ya parecen comprobación y no lo son** — son peores que
    un principio declarado, porque nadie desconfía de ellas.
- **18.3 — Si aun así alguien deja cambios sin commitear en la raíz, lo anuncia en
  `_registro-agentes.txt` con su condición de reversión.** Cinturón, por si 18.1 se olvida.

**Matiz que conviene tener claro:** `qa.md` pide solo-lectura sobre **datos de producción**,
que es otra cosa distinta de editar un fichero local. El QA no saltó ninguna regla —
marcó su prueba como temporal, con condición de reversión escrita, y la revirtió en dos
minutos. La regla no existía porque nadie la había escrito.

### Decisión 32 — Dónde escriben tus HERRAMIENTAS, no solo dónde trabajas tú

La 18 cubre **dónde experimentas**. No cubría el caso que apareció después, y que destapó el
QA: **él no experimentaba en la raíz** — le dio a una herramienta una ruta absoluta fuera
del repo, y **la herramienta la ignoró y escribió donde le dio la gana**. El fichero era un
volcado de sesión **con tokens de autenticación dentro**, y quedó suelto en la raíz,
untracked y sin ignorar.

- **32.1 — Toda herramienta que escriba ficheros recibe un destino explícito fuera del
  repo, Y SE COMPRUEBA DÓNDE ESCRIBIÓ DE VERDAD.** La segunda mitad es la que importa:
  **pedir una ruta no es lo mismo que obtenerla.** Verificado en vivo — el MCP de Playwright
  ignoró una ruta absoluta y resolvió relativo a la raíz del proyecto.
- **32.2 — El destino por defecto de cualquier fichero que una herramienta produzca y no
  sea un entregable es el scratchpad de la sesión**, nunca el repo ni un `/tmp` improvisado.

⚠️ **32.3 — Y el límite, declarado y no maquillado: las dos anteriores son PRINCIPIOS, no
comprobaciones.** Por la decisión 29 eso significa que **hay que asumir que se
incumplirán** — igual que se incumplieron la de `ListAgents` y la del timestamp el mismo día
que se escribieron. **Que existan estas dos reglas NO cierra el problema.**

**Lo que lo cerraría es un control ejecutable** —algo que corra antes del commit y se niegue
a incluir un fichero con pinta de credencial—, **y no lo tenemos**.

⚠️ **Pero el obstáculo estaba mal descrito, y corregirlo cambia la decisión** (aportación
del QA, verificada por el CEO el 2026-09-08). La primera redacción decía *"un hook de git
vive en `.git/hooks`, que no viaja"*. **Eso es cierto por defecto y falso como límite:**

- **`git config core.hooksPath .githooks`** mueve los hooks a un directorio **dentro del
  repo**, que sí se trackea, sí viaja en el clon y sí se revisa en un diff. Es un mecanismo
  estándar de git, no un truco. Verificado disponible en esta máquina (git 2.54.0), y
  **hoy no está configurado en ninguna parte**.
- **Y el coste es aún menor de lo que parecía:** los tres worktrees **comparten el
  `.git/config` de la raíz** (`git-common-dir` apunta ahí y `extensions.worktreeConfig` no
  está activada, ambos comprobados). Así que **no son cuatro pasos manuales, es uno**.
- **El residuo real, que sí sigue en pie:** un clon nuevo en otra máquina necesitaría
  ejecutar ese comando una vez, y **quien no lo ejecute no tiene control y no se entera** —
  un fallo silencioso, que es la peor clase.

**Así que 32.3 sigue siendo verdad en su fondo** —asumir que se incumplirá— **pero por un
motivo mucho más pequeño y atacable que "no se puede".** La distinción importa: llevamos
todo el día separando *"no se puede"* de *"no se ha hecho"*, y esto era lo segundo
disfrazado de lo primero.

#### Corolario: de una herramienta hay que verificar DOS cosas (añadido 2026-09-08)

> **De una herramienta hay que verificar dos cosas distintas: dónde escribe y qué devuelve.
> Que una esté controlada no dice nada de la otra.**

La 32.1 nació de un eje: *pedir una ruta no es lo mismo que obtenerla*. El 2026-09-08
apareció el otro, y **la comprobación de la 32.1 no lo habría cazado**. El QA generó un
script de disco a disco con Bash, sin imprimir nada, y se lo pasó a
`browser_run_code_unsafe` por `filename` **precisamente para que los valores no pasaran por
la conversación**; la herramienta devolvió el fichero íntegro en su bloque de salida, JWT
incluido.

**La ironía es el hallazgo:** el mecanismo diseñado para no exponer valores es el que los
imprime. Y falla en verde — el comando funciona, el script se ejecuta, el objetivo se
cumple. *(Severidad de ese caso concreto: nula. Token de la cuenta demo, caducado 61 minutos
antes, refresh literal `"dummy"`; nada que rotar. Lo que vale es el mecanismo, y que se
reportara igualmente en el mismo minuto.)*

**Regla práctica:** si un fichero contiene un secreto, **no se le pasa a una herramienta cuya
salida no controlas**, ni por ruta.

### Decisión 47 — El navegador de pruebas se aísla, y el control es el aislamiento (2026-09-08)

Cae del lado de la 32 —*qué hacen tus herramientas además de lo que les pediste*—, y nace de
un hallazgo del QA verificado en vivo.

**El hallazgo.** El perfil de navegador que usa el MCP de Playwright **no es un perfil limpio:
lleva las sesiones personales reales de Aitor.** Al listar cookies para diagnosticar otra cosa
aparecieron sesiones **activas** de Google, Notion, LinkedIn, YouTube y Twitter (`token_v2`,
`__Secure-1PSID`…). Y `browser_run_code_unsafe` ejecuta JavaScript arbitrario en ese proceso:
un `page.context().cookies()` las devuelve todas — comprobado, no supuesto.

**TRES vectores distintos, que conviene no mezclar — y el primero es el que decide, porque es
un bloqueo de HOY y no un riesgo de mañana:**
- **Disponibilidad** — ⚠️ **el perfil se comparte entre sesiones y SERIALIZA el acceso: un
  desarrollador con Chrome abierto deja al QA sin poder trabajar.** Ocurrió el 2026-09-08: el QA
  perdió una ronda entera con *"Browser is already in use for …/mcp-chrome-d5b335f"*, y el
  perfil lo tenía un navegador arrancado siete minutos antes por otra sesión. **Es la 59.3 —
  todo consumidor nuevo de un recurso compartido nace con el suyo—, y el perfil del navegador es
  su cuarto caso**, después del puerto 3000, el deployment de Convex y la suite periódica.
- **Salida** — cualquier sesión de la fábrica puede volcar esas credenciales en su transcript
  con una llamada. Ese día el QA imprimió solo nombres y longitudes **por criterio suyo**, no
  porque nada se lo impidiera. Lo que no es una barrera no es un control (decisión 37).
- **Entrada** — las rondas de QA navegan con ese perfil puesto. Si una acabara en una página
  hostil, iría con las sesiones de Aitor.

📌 **Y la formulación que lo cierra, del PM, después de trabajar toda una noche dentro de ese
perfil (2026-09-08):** él tuvo que **operar la consola de Google Cloud con la identidad de
Aitor** —autorizado por él, pero con su identidad—, y **cualquier ronda rutinaria del QA
comparte ese mismo perfil**.

> **El aislamiento no es solo para no bloquearnos: es para que probar la app no dé acceso
> incidental a las cuentas personales de nadie.**

Es el argumento más fuerte de los tres porque **no depende de que ocurra nada malo**: el acceso
ya está ahí, concedido por construcción, cada vez que alguien abre el navegador para mirar un
botón.

**47.1** — El navegador que usa la fábrica corre sobre un **perfil propio, vacío de todo lo que
no sea la app bajo prueba**. El QA necesita exactamente una sesión: la del usuario demo del
CRM. Ninguna otra credencial tiene por qué estar alcanzable desde una ventana de pruebas.

**47.2 — y este es el razonamiento, no el remedio:**

> **No se policía lo que una herramienta puede leer. Se quita lo que merece la pena leer.**

El primer impulso del Factory Architect fue restringir `browser_run_code_unsafe`, y lo
descartó él mismo por dos motivos: habría sido **el tercer límite suyo demasiado ancho del
día** (después de los selectores y la ventana del auditor), y **no habría funcionado** — el QA
usa esa llamada legítimamente para comprobar si una protección es real en servidor, que es
exactamente su trabajo. Prohibirla le quita una capacidad de verificación real para tapar un
agujero que **no está en la herramienta, está en el perfil**. Con un perfil aislado, volcar
todas las cookies **deja de ser un incidente y pasa a ser inútil**: eso es un control; *"no
uses esa llamada salvo necesidad"* es un principio, y ya sabemos lo que valen.

**47.3 — Contención vigente mientras el perfil no esté aislado**, declarada como lo que es —un
principio de segunda categoría, con fecha de caducidad—: ninguna ronda usa
`browser_run_code_unsafe` salvo necesidad estricta, y ninguna navega fuera de la app
(Railway/localhost).

⚠️ **EXCEPCIÓN VIVA, autorizada por Aitor directamente (2026-09-08, ~22:4x local).** Le dijo al
PM, con estas palabras, *"toma la iniciativa para acabar de configurar Gmail, usa mi browser"* —
levantando él mismo la restricción que el propio PM se había escrito en AIT-90. **El PM navega
con la sesión personal de Aitor, en la consola de Google Cloud, con permiso expreso.**

Se anota aquí **para que nadie la "corrija"**: la contención del 47.3 la puso el CEO, y **una
instrucción directa de Aitor la levanta para el caso que él nombre** — no al revés. Quien vea al
PM fuera de `localhost` no está viendo un incumplimiento.

*(Y una nota que el propio PM aporta y que refuerza la 47 en vez de debilitarla: que la única
forma de hacer ese trabajo fuera usar el navegador personal de Aitor **es exactamente el
problema**. Con un perfil aislado, la configuración de Gmail seguiría necesitando su sesión —
eso es inevitable— pero **ninguna otra prueba de la fábrica la compartiría.**)*

**47.4 — Cuando se implemente, por la 46:** el perfil aislado **se estrena vacío y verificado
vacío**, no reutilizando uno existente "que parece limpio". Si el primer uso arrastra
credenciales heredadas, nace desacreditado.

⚠️ **Tocar el perfil o sus cookies lo autoriza Aitor y nadie más** —son sus cuentas personales
y borrar sesiones activas es destructivo sobre datos suyos—, así que ningún rol lo hace por su
cuenta. Escalado a Aitor el 2026-09-08 por dos vías independientes (CEO y Factory Architect).

### Decisión 33 — El control ejecutable: qué comprueba y qué NO

**Decidido que merece existir. Autorizarlo sigue siendo de Aitor** — es configuración del
repo que hace ejecutar comandos solos, así que ningún rol lo crea por su cuenta.

**Un único trabajo, y estrecho: impedir que un secreto entre en un commit.** No se convierte
en un validador de todo — **un hook que comprueba cinco cosas se desactiva el día que falla
por la quinta.**

**Qué mira**, sobre el contenido **staged** (no el working tree):
- Formas de credencial: `-----BEGIN … PRIVATE KEY-----`, tokens con forma de JWT, y las
  variables de semilla que ya nombra `CLAUDE.md` (`SEED_*_PASSWORD`, `JWT_PRIVATE_KEY`).
- Nombres de fichero sospechosos que no estén ya ignorados: `*token*`, `*session*`,
  `*.pem`, `.env*`.

**Qué NO mira: cualquier otra cosa.** Si mañana hace falta más, se decide entonces.

⚠️ **Condición sin la que no se adopta: el hook se entrega CON SU TEST, y el test tiene que
DISCRIMINAR** — un fichero con forma de secreto **bloqueado**, y un commit normal
**permitido**. **Si solo prueba lo segundo, no prueba nada** (decisión 19). El test vive en
el mismo `.githooks/`, corre a mano, y su resultado se declara en §7. **Sin ese test es
preferible no tener el hook: un control no verificado es peor que ninguno, porque se
confía en él.**

**El residuo —un clon nuevo sin el comando no tiene control y no se entera— se cierra
haciéndolo DETECTABLE, no recordable:** el barrido del CEO comprueba
`git config core.hooksPath` y **reporta si no está**. Eso convierte un fallo silencioso en
uno visible, que es lo máximo posible sin poder ejecutar el comando en la máquina de otro.

📌 **Y el problema estructural, que ninguna de estas reglas ataca:** los tres episodios del
2026-09-08 —el `throw` de prueba que casi se publica, el `git add -A` que lo arrastró, y
este volcado de credenciales— **salen todos de que cuatro roles commitean desde el mismo
checkout**. `.gitignore` es la red y el scratchpad la disciplina; **ninguno toca la causa**.
Queda escrito como el problema estructural que es, para que no se disuelva en tres parches.

---

## 2nonies. La tarea de barrido es otra especie (decisión 48, 2026-09-08)

Decisión del Factory Architect. Nace de AIT-85 —"reconciliar diseño y código"—, que **entró
como limpieza de prioridad baja y salió con tres issues, dos de ellas MVP de prioridad alta,
ninguna que nadie estuviera buscando**. Y el caso es reproducible: cualquier *"revisa todo X
y dime qué encuentras"* se va a comportar igual.

**48.1 — Se nombran y se distinguen: tarea de barrido.** La propiedad que las separa de todo
lo demás es una sola: **su alcance no se conoce hasta que se ejecuta.** Las tres consecuencias
de abajo no son excepciones que se le conceden — son su forma normal.

**48.2 — Su plan es sobre el MÉTODO, y eso es correcto, no un defecto.** Las tres rondas de
auditoría del plan de AIT-85 fueron sobre *cómo barrer*, porque el resultado no existía
todavía. Queda declarado para que el siguiente que vea tres rondas sobre un plan sin resultado
no piense que algo va mal: **en una tarea de barrido el método es la única palanca de calidad
que hay**, así que auditarlo a fondo no es exceso, es lo único auditable.

**48.3 — Un barrido encuentra; no arregla.** Su entregable son **issues**, nunca el cambio. Si
además arreglara, arrastraría un alcance de corrección tan ilimitado como el de búsqueda, y
ninguna de las dos mitades sería auditable en sus propios términos. Cada hallazgo sale como
issue y entra por el pipeline normal.

**48.4 — Y esto es lo que lo hace planificable: se acota por ESFUERZO, no por alcance.** Como
el alcance es desconocido, lo que se fija es **cuánto** se barre. Y su entregable lleva
obligatoriamente la **frontera de cobertura: qué se barrió y qué no se llegó a mirar.**

> Sin eso, **un barrido parcial se lee como completo** — que es el fallo del día en su forma
> más cara: *una copia incompleta no se contradice con nada*. Un informe que dice "encontré
> tres" sin decir "de estas diez pantallas miré cuatro" **invita a dar el asunto por
> cerrado**. Es §2ter(b) aplicado a una tarea entera: se declara lo que no se cubrió.

**48.5 — No se usa nunca como relleno.** Y la razón general, que va más allá de este caso:
**lo que no se puede dimensionar no puede tapar un hueco.** El relleno tiene que ser acotado
por definición; un barrido es exactamente lo contrario.

### «Cubierto» sin nombrar por dónde es «no lo he mirado» (criterio de T3, adoptado 2026-09-08)

> **"Cubierto por otra vía" exige poder señalar la vía.**

Va **enlazado** con el hallazgo del PM en Supervisión —*"cubierto por el filtro"* frente a
*"decidido que no se construye"*—, porque es el mismo fallo y separarlos lo esconde: sin
nombrar la vía, **"cubierto" es un sinónimo educado de "no lo he mirado"**.

Su virtud es que **el atajo se cae solo**: no hay que resistir ninguna tentación, es que al
intentar nombrar la vía descubres que no existe. Por eso es un criterio y no una advertencia.

## 3. Reglas que la sesión directora tiene que respetar

- **No crear nada fuera de la carpeta del proyecto** (`CRM curso Vibe Coding`) sin que Aitor lo pida explícitamente. Ya pasó una vez (worktrees en una carpeta hermana) y hubo que deshacerlo.
- **Mantener la cola (`codigo para auditar/cola/`) con 2-3 tareas listas, siempre — no reactivo, no "cuando se vacíe".** Es un paso fijo tras CADA push a `main` (ver §2, paso 4), sin esperar a que Aitor lo pida. Solo entra en la cola una tarea que YA pasó el mismo análisis de dependencias/solapes de siempre — la cola no es un backlog en bruto, es "lo siguiente listo para coger, en el orden que toca". Si algo deja de ser seguro (main se movió, otra terminal empezó algo que ahora choca), sacarlo o reordenarlo antes de que alguien lo reclame. Si de verdad no hay 2-3 candidatas 100% limpias, está bien quedarse con menos (o cero) — pero solo tras comprobarlo de verdad, nunca por no haberlo revisado.
- **La sesión directora administra el orden de publicación entre terminales — no es "quien avisa primero, publica primero".** Parte de la revisión final antes de cada merge (§2, paso 4) es decidir si esa publicación concreta debe esperar a otra cosa (otra terminal a punto de publicar algo que la afecte, una condición especial del brief, etc.) antes de seguir adelante.
- **Barrido periódico obligatorio de TODAS las terminales, no solo reactivo a quien te
  habla** (decidido 2026-08-13, tras detectar que la directora se absorbe en la tarea que
  tiene delante y deja terminales en Idle/paradas sin darse cuenta — no es un problema de
  no saber la regla de escalado, es no llegar a mirar). No basta con revisar una terminal
  cuando ella te avisa: mantén un `/loop` **en modo dinámico auto-paced (`ScheduleWakeup`),
  no `CronCreate`** (corregido 2026-09-04 — ver §2bis-bis o `director.md` "Barrido
  periódico proactivo" para el incidente completo: un `CronCreate` recurrente caduca
  solo a los 7 días sin avisar a nadie, y el de la Directora estuvo así, muerto, más de 3
  días seguidos sin que nadie lo notara) que recorra el **roster esperado** — el registro
  de check-in (`_registro-agentes.txt`) más lo que tú misma sabes que has creado
  (T1/T2/T3, el Integrador si está activo) — **no lo que `ListAgents` decida devolver**.
  Para cada sesión del roster, comprueba `ListAgents`, pero **ni "no la reconoce", ni "la
  marca dudosa", ni `busy` son tranquilizadores** (extendido 2026-09-08): `busy` no
  distingue una sesión trabajando de una bloqueada en un prompt interactivo — ver §2sexies,
  primera fila. Ese día el roster estaba completo y todo parecía normal mientras una
  terminal llevaba media hora sorda. En cualquiera de los tres casos, cae directo al
  método de verificación de staleness ya documentado (transcript → título de ventana vía `osascript` → captura de pantalla si
  hace falta, ver `ceo.md` §2 para el detalle técnico) antes de concluir nada — no un "me
  suena que va bien" ni un "no aparece, sigo" (una sesión bloqueada en una pantalla de
  aprobación humana, como `ExitPlanMode` en fase de plan, no aparece EN ABSOLUTO en
  `ListAgents` mientras sigue ahí parada). Si detectas una terminal parada sin una razón
  lícita clara y verificada, aplica ya la regla de velocidad de escalado de §2bis (ver
  también memoria `director-stall-escalation-threshold`): actúa/escala en ese mismo
  ciclo, no des ciclos de margen "a ver si se resuelve sola". **Este mismo barrido
  comprueba también `Sorfware Factory/_turno-convex.lock`** (añadido 2026-08-15): si
  existe y su titular (`titular.txt` dentro) lleva parada más de lo razonable según el
  mismo método de verificación, señálalo — un cerrojo abandonado que nadie más necesita
  todavía puede quedarse invisible hasta que alguien lo pida, y para entonces ya es un
  bloqueo sin explicación aparente.
- **Ojo con que el propio barrido (o cualquier interrupción — un mensaje de Aitor
  también cuenta) te haga abandonar sin más lo que tenías entre manos.** Ya ha pasado:
  Aitor te interrumpe con algo, lo atiendes, y luego se te olvida retomar lo que estabas
  haciendo antes. El barrido periódico de arriba es un caso más de esto, solo que
  automático y más frecuente — si no se gestiona, un check pensado para no perder de
  vista a las terminales acaba haciéndote perder de vista tu propio trabajo. Regla:
  antes de cambiar de foco por cualquier motivo, di en una frase qué tarea tenías en
  curso y en qué paso ibas (basta con decirlo, no hace falta ceremonia ni fichero
  aparte); atiende la interrupción; al terminar, retómalo explícitamente ("retomo
  <tarea> donde la dejé: <paso>") antes de seguir — no confíes en que la inercia te lleve
  de vuelta sola. El barrido en sí debe ser mínimo: si todo está bien, confírmalo y
  vuelve de inmediato a lo que tenías entre manos — que el propio barrido no se
  convierta en tu nueva prioridad.
- **El aviso por voz (Stop hook, `afplay`+`say "necesita tu atención"`) es condicional,
  no automático** (decidido 2026-08-13 — antes sonaba en CADA parada de turno, incluidas
  las positivas como un GO de auditoría, y eso es ruido). El hook en `.claude/settings.local.json`
  (raíz y cada worktree T1/T2/T3 tienen su propia copia — al tocar esto, las cuatro) solo
  suena si existe el fichero `/tmp/claude-crm-notify-<carpeta>` (`<carpeta>` = `T1`/`T2`/`T3`
  o el nombre de la carpeta raíz para la Directora) — y se borra a sí mismo al sonar, para
  no repetirse. **Créalo tú (`touch /tmp/claude-crm-notify-$(basename "$PWD")`) justo antes
  de terminar tu turno SOLO cuando haya algo que de verdad necesite que Aitor actúe**
  (NO-GO de auditoría, terminal atascada sin razón lícita verificada, decisión de
  producto/alcance bloqueada, auditor sin cuota, etc.) — nunca para anunciar que
  terminaste de trabajar sin más, ni para un resultado positivo que no requiere nada de
  él. Si dudas, no lo crees: el silencio por defecto es la conducta correcta.
- **Segundo hook de voz, en `PermissionRequest` (añadido 2026-09-04, tras el incidente de
  T2 atascada ~5h en la aprobación de un plan sin que nadie lo oyera)**: el hook de `Stop`
  de arriba NUNCA se dispara mientras una sesión sigue bloqueada esperando una decisión
  de permiso (incluida la aprobación de `ExitPlanMode` en fase de plan) — el turno no ha
  terminado, así que `Stop` no llega a correr, por mucho que el marker esté puesto. El
  hook en `PermissionRequest` sí dispara exactamente en ese instante: en las cuatro
  copias de `.claude/settings.local.json` (raíz y cada worktree T1/T2/T3), suena
  `afplay`+`say` DIRECTAMENTE, sin pasar por el fichero marker (aquí no aplica esa lógica
  — no hay "borrar para no repetir" porque la sesión sigue parada hasta que alguien
  responda). No se filtra por herramienta concreta: con el modo auto ya establecido en
  toda la fábrica, cualquier `PermissionRequest` que llegue a aparecer es en sí mismo
  señal suficiente de que algo necesita a Aitor. No confundir con `PermissionDenied` —
  ese se resuelve solo en modo auto y no necesita aviso.
- **No paralelizar tareas que toquen el mismo archivo.** Van juntas, secuenciales, en la misma rama/terminal (ejemplo real: AIT-14 y AIT-15 comparten `convex/opportunities.ts` → se dieron a la misma terminal).
- 📌 **El cerrojo de Convex solo le aplica a las terminales NO migradas** (aclarado
  2026-09-08). Está escrito en genérico —"las terminales"— y eso envejece mal: a fecha de
  hoy la mayoría ya tiene deployment propio y el cerrojo afecta a menos de las que el texto
  sugiere. **No se nombra aquí cuáles son** (§2quinquies, corolario): la condición es
  `CONVEX_DEPLOYMENT` = el compartido `third-goldfinch-805` en el `.env.local` de ese
  worktree. Si es otro, esa terminal ignora todo lo que sigue sobre turno y cerrojo.
- **Mientras una terminal no esté migrada a deployment propio (ver §3bis), el turno de
  Convex se organiza con un cerrojo — ya NO se pide a la Directora** (rediseñado
  2026-08-14, tras detectar que arbitrar cada petición no escala según crece el número
  de terminales/células; afinado 2026-08-15 para que reclamarlo sea atómico). El
  mecanismo completo, para desarrolladoras, está en `intro-terminal.txt`; resumen:
  `mkdir "Sorfware Factory/_turno-convex.lock"` (falla si ya existe, sin ventana de
  carrera entre dos terminales que lo vean libre a la vez) con `titular.txt` dentro
  diciendo quién y desde cuándo — cada terminal lo reclama sola, coordinándose
  directamente con quien lo tenga si hace falta esperar, y lo libera con `rmdir` al
  terminar. La Directora (o el Líder de
  célula, si las hay) solo entra si hay una disputa genuina o el cerrojo parece
  abandonado sin poder confirmarlo por los canales normales — el caso normal no debería
  llegar nunca hasta ella. Incidente real que sigue siendo la razón para no reclamar un
  cerrojo ajeno a la ligera (T2, 2026-08-09): desplegó con una rama desactualizada y
  borró del compartido `changeStage`/`markWon`/`markLost` de otra terminal — si un
  cerrojo parece abandonado, verificar de verdad (mismo criterio que dar una terminal
  por parada) antes de reclamarlo, nunca por comodidad. Una vez todas las terminales
  estén migradas (§3bis), este cerrojo queda obsoleto del todo: ya no hay nada que
  organizar para el desarrollo día a día.
- **Antes de reclamar el cerrojo, comprobar si la terminal necesita `npx convex dev` de
  verdad.** `convex/_generated/` está versionado en git (commiteado, no en `.gitignore`) y
  `npm run dev` es solo `next dev` — no arranca Convex a la vez. Si la tarea es UI pura y
  no toca `convex/*.ts`, la terminal puede arrancar solo `npm run dev` y hablar contra el
  deployment compartido ya desplegado (con el `.env.local` de su worktree), sin cerrojo
  ni empujar nada — evita por completo el riesgo del bullet siguiente. Incidente real
  (2026-08-14): T1 (AIT-51, UI pura) estuvo a punto de pisar el campo `active` que T2
  (AIT-52) ya tenía desplegado en el compartido, porque su rama —sincronizada con `main`,
  sin la rama de T2 mergeada— no lo conocía; el `npx convex dev --once` de T1 falló con
  "Schema validation failed" contra datos de prueba de T2 que sí tenían `active`. La
  solución no fue borrar el dato ni esperar el merge: fue darse cuenta de que T1 no
  necesitaba pushear nada en absoluto. Solo cuando la tarea sí toca `convex/*.ts` hace
  falta el cerrojo de verdad (bullet anterior).
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
  sus propios archivos "de negocio". Cada terminal debe comprobar y reclamar el cerrojo
  antes de lanzar `npx convex dev` si sigue en el compartido, para no pisar el deployment
  de otra terminal a medio trabajar.
- **Además del cerrojo (terminales sin migrar): si `main` avanzó mientras una terminal
  seguía trabajando, esa terminal tiene que traerse `main` (`git merge main` dentro de su
  worktree) antes de su siguiente `npx convex dev`.** Pasó de verdad (2026-08-09): T2
  corrió `convex dev` con una rama desactualizada tras el merge de AIT-14/15 y borró del
  deployment compartido `changeStage`/`markWon`/`markLost` — seguían a salvo en `main`,
  pero desaparecieron de lo desplegado hasta hacer `git merge main` y redesplegar. No
  basta con "que no lo usen dos a la vez"; también hay que estar al día con lo último
  mergeado. Este es exactamente el incidente que motivó el rediseño de §3bis.

## 3bis. Rediseño del turno de Convex: deployments aislados por terminal (decidido 2026-08-12, MIGRACIÓN PENDIENTE)

⚠️ **CORREGIDO 2026-09-08: la migración YA EMPEZÓ, y este apartado llevaba tiempo diciendo
lo contrario.** Comprobado ese día leyendo el `CONVEX_DEPLOYMENT` de cada worktree: **T1 y
T2 ya tienen deployment propio** (`supercrm-t1` y `vibecrm-t2`), **T3 sigue en el
compartido** `third-goldfinch-805`. O sea que hoy **conviven los dos regímenes**, que es
justo el escenario que este apartado anticipaba al final.

📌 **Este apartado ya no declara quién está migrada, y no debe volver a hacerlo** — es el
corolario de §2quinquies: un documento no dice el valor actual de un estado mutable, dice
dónde consultarlo. **Se consulta así, y la respuesta tarda dos segundos:**
```bash
grep CONVEX_DEPLOYMENT "Sorfware Factory/_worktrees/T<n>/.env.local"
```
Si dice `third-goldfinch-805`, esa terminal **NO** está migrada y le aplica el cerrojo de
§3. Si dice otra cosa, tiene deployment propio y puede ignorarlo.

⚠️ **Lo que sigue, del párrafo original, describe el diseño objetivo y su porqué** — no el
estado de hoy. Se conserva porque el razonamiento sigue siendo válido para las terminales
que falten. El texto decía: *"Ninguna terminal tiene hoy su
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
- ⚠️ **AIT-59 (2026-08-24) invalidó la premisa original de este bullet — leer esta nota
  antes del bullet.** Cuando esto se escribió, `third-goldfinch-805` era lo que leía
  Railway/la app real, y el diseño de §3bis asumía que publicar seguiría siendo "tocar
  el compartido en el momento del merge". Ya no es así: `third-goldfinch-805` es ahora
  solo un deployment de dev/test, sin ningún rol de publicación — publicar a producción
  ocurre solo, vía el build de Railway contra `stoic-impala-857` (ver ADR-004 en
  `docs/01-arquitectura.md`), sin que nadie tenga que "tocar" ningún deployment
  compartido en el momento del merge, ni siquiera la Directora/Integrador. Si esta
  migración de §3bis se ejecuta ahora, el bullet de abajo ("pasa a tocarlo solo la
  Directora... en el momento del merge") ya no describe ninguna acción real que exista
  que hacer — simplemente no hay nada que tocar en el compartido al publicar.
- El deployment compartido (`third-goldfinch-805`) ya NO tiene rol de publicación (ver
  aviso de arriba) — cuando se ejecute esta migración de §3bis, no hace falta que nadie
  lo "toque" en el momento del merge; el diseño original de este bullet (arbitrar quién
  toca el compartido al publicar) queda obsoleto por AIT-59.
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
2. ⚠️ **CORREGIDO 2026-09-08 — este paso estaba INCOMPLETO y seguirlo al pie de la letra
   dejaba el login imposible.** Decía "copia dos variables"; **el deployment compartido tiene
   trece**, y entre las que faltaban están **`JWT_PRIVATE_KEY` y `JWKS`: sin ellas Convex Auth
   no arranca.** El paso 4 fallaba y **nadie sabría por qué** — el checklist parecía completo.
   Lo encontró el QA migrando su corrida periódica (59.1).
   - **`SEED_OWNER_PASSWORD` y `SEED_SALES_PASSWORD`** — mismos valores que el origen, para
     que el login de demo (`/login`) siga funcionando; no hay script de seed propio, la app
     depende de estas variables (ver `convex/auth.ts` y el comentario en `.env.local`).
   - **`JWT_PRIVATE_KEY` y `JWKS` — NO se copian: se GENERAN nuevas** con
     `npx @convex-dev/auth`. **Dos deployments no deben compartir clave de firma:** con la
     misma clave, **un token emitido en uno vale en el otro**. Criterio del QA, y es el
     correcto.
   - **`SITE_URL`** — apuntando al sitio del deployment nuevo.
   - **Lo que NO se lleva, a propósito:** `AUTH_GOOGLE_*`, `RESEND_API_KEY`, `VAPID_*`. La
     suite no los necesita y **son secretos reales: copiarlos sería esparcir credenciales a un
     sitio más sin motivo**. Si algún día la suite cubre Google o email, se decide entonces.
   - ⚠️ **Todo el manejo, sin imprimir valores** (`CLAUDE.md`): filtrar con `cut -d= -f1` y
     mostrar solo nombres y longitudes.
   - 📌 **Y la forma del fallo, para que no se repita en otros checklists:** *"copia estas
     dos"* era cierto cuando se escribió y **envejeció al añadirse variables al origen**. Un
     checklist que **enumera** un estado mutable caduca en silencio; el que **manda mirarlo**
     no. Contrástalo siempre con `npx convex env list` del origen (sin volcar valores) antes
     de darlo por completo.
3. Actualizar el `.env.local` de ese worktree con **las variables de conexión que imprime
   `npx convex dev` al crear el deployment** — hoy son `CONVEX_DEPLOYMENT`,
   `NEXT_PUBLIC_CONVEX_URL` y `NEXT_PUBLIC_CONVEX_SITE_URL`, **como ejemplo y no como lista
   cerrada** (decisión 63.1: un checklist no enumera un estado mutable, manda mirarlo).
4. Verificar en el navegador que el login de demo y una pantalla básica (p. ej. "Hoy")
   cargan bien contra el deployment nuevo antes de dar la migración de esa terminal por
   hecha.
5. **No migrar una terminal que tenga trabajo en curso sin avisar primero** — hacerlo
   entre tareas (justo tras publicar una y antes de empezar la siguiente), nunca a medio
   desarrollo.

Hasta que las 3 terminales estén migradas, conviven ambos regímenes: unas ya con
deployment propio (turno libre), otras todavía en el compartido (turno con cerrojo de
fichero, §3). Cada terminal sabe su propio estado mirando `CONVEX_DEPLOYMENT` en su
`.env.local` — no hace falta que la Directora lleve la cuenta centralizada de quién está
migrada, precisamente lo que se buscaba al pasar el turno a un cerrojo autoservicio.
- **No adelantar fases de Linear** para rellenar huecos de una terminal libre. Si no hay tarea independiente de verdad, esa terminal se queda idle (se anota por qué en su `T<n>_en-espera.txt`).
- ⚠️ **PERO planificar una tarea YA APROBADA no es adelantar fases** (decisión 36.1,
  2026-09-08, instrucción de Aitor). Se dice aquí, junto a la regla anterior, **porque esa
  ambigüedad es parte de por qué no se hizo**: la regla existe para **no inventar alcance**,
  y no dice nada sobre ordenar trabajo que ya está aprobado. *Una regla que se lee como
  prohibición de algo que sí se puede hacer cuesta lo mismo que una regla ausente.*
  - **Un plan NUNCA está bloqueado por conflicto de ficheros. Solo lo está la
    implementación.** La fase de plan **no escribe ningún fichero del repositorio** — solo
    produce su `.txt` en `codigo para auditar/`, que está fuera de git. El criterio de
    solape existe para que dos terminales no se pisen **en disco**, así que **no le
    aplica**.
  - **Y el plan es la parte cara:** el 2026-09-08 costaron **2, 2 y 4 rondas** de auditoría.
    Ese día hubo dos terminales paradas casi una hora esperando para hacer la mitad barata
    mientras la cara podía haber ido avanzando.
- **36.2 — "Bloqueada" a secas deja de ser un estado válido.** Una ficha bloqueada dice
  **qué ficheros concretos la bloquean** y **cuánto de su alcance está libre**. Ejemplo real
  que lo demuestra: *"5 de 6 libres, bloquea `app/clientes/[id]/page.tsx`"* habría destapado
  el hueco una hora antes.
  - 📌 **Es la decisión 31 aplicada a una ficha en vez de a un reporte entre roles:**
    *"bloqueada"* es la **conclusión**; los ficheros y el alcance libre son **la tabla**. En
    palabras de la Directora, escribir solo la conclusión **le dio permiso para no volver a
    mirar**.
- **36.3 — La cola mantiene siempre al menos una tarea PLANIFICABLE**, aunque su
  implementación esté bloqueada. ⚠️ **Esto no autoriza a inventar alcance para llenar
  huecos**: es ordenar lo ya aprobado, nunca abrir lo que no lo está.
- **38 — Con un LOTE grande de tareas nuevas: se planifica el lote entero antes de repartir
  implementación** (2026-09-08, autorizado por Aitor al preguntar si convenía montar una
  línea de planificación aparte).
  - **Por qué NO una línea de planificación aparte:** la planificación **dejó de ser el
    cuello** con la 36 — un plan no se bloquea por ficheros. El cuello real es la
    **contención en implementación**: todo el backlog vivo gira alrededor de
    `app/clientes/[id]/page.tsx` y `convex/opportunities.ts`. Una línea de planificación
    produciría planes más rápido **para que se acumulen ante los mismos dos ficheros**.
    > **Acelerar lo que no es el cuello no aumenta la producción: aumenta el trabajo
    > parado.**
  - **38.1 —** el plan de cada tarea ya nombra sus ficheros, así que planificar el lote
    antes de repartir da **el mapa de huella de ficheros completo**, en vez de descubrir
    los choques de uno en uno. Con ese mapa se agrupa por **conjuntos disjuntos**.
  - **38.2 — Regla para abrir terminales, que sustituye a "las que sostenga el backlog":**
    se abre una terminal más **solo cuando exista una tarea cuyo conjunto de ficheros no se
    solape con ninguna en curso**. Si no la hay, **esa terminal no es capacidad: es una cola
    de espera más.** El 2026-09-08 con tres ya chocaban.
  - **38.3 — Nada de segunda Directora por función.** Partir el ciclo en "planificación" y
    "desarrollo" crea un problema de coordinación entre coordinadoras. **Si hay que
    escalar, es por célula** — ese diseño ya existe y nunca se ha activado
    (`lider-celula.md`), y un líder se queda con el **ciclo completo** de sus tareas.
    **Disparador, como condición medible y no como intuición:** cuando una Directora no
    pueda cubrir sus terminales **de verdad**. El 2026-09-08 sus fallos **no fueron de
    capacidad** — fueron una regla ambigua (36) y un barrido de 20 min para un umbral de 3
    (26), las dos ya corregidas. **Antes de partir el rol se miden un par de días con las
    correcciones puestas.**
  - ⏳ **DISPARADOR: la 38.1 no se activa hasta que el PRD de la Ola 2 quede APROBADO.** El
    lote todavía no existe como tareas, y el PM no desgrana un borrador **por una razón que
    hoy tiene prueba**: *desgranar un borrador es repartir tareas que citan cosas falsas* —
    ese documento llevaba dos versiones afirmando cosas del código que no eran ciertas.
  - 📌 **Y los dos ficheros congestionados NO se parten ahora** (decisión del PM), por coste
    de oportunidad y no por razón técnica: sería pagar un refactor para ganar paralelismo
    **justo antes de que llegue trabajo que no lo necesita**. La Ola 2 vive en superficie
    nueva, y **cuatro de sus seis fases no tocan esos ficheros**, incluidas las tres
    primeras — no es un orden inventado para desatascarnos, es el que el walking skeleton
    ya tenía.
    **Condición de reevaluación, escrita como tal:** si el mapa de huella completo demuestra
    que la concentración **persiste con la Ola 2 dentro**, entonces no es una fase mala,
    **es una propiedad del código**, y se reabre. Eso convierte la 38.1 en **el instrumento
    que responde esa pregunta**: el mapa deja de ser solo una herramienta de reparto y pasa
    a ser la evidencia de una decisión de arquitectura pendiente.
  - **40 — LA HUELLA TIENE TRES VERSIONES Y SOLO UNA SIRVE PARA AGRUPAR** (2026-09-08, del
    mapa real que produjo la Directora). La 38.1 decía *"el plan ya nombra sus ficheros"*
    **sin decir de qué versión hablaba** — una regla infraespecificada en el dato que la
    sostiene.
    - **40.1 — Se agrupa con la huella POST-AUDITORÍA del plan.** La pre-auditoría
      **sobrestima**: incluye lo que el desarrollador cree que *podría* necesitar. Evidencia:
      un plan declaró **seis** ficheros y los reales eran **cuatro** — uno salió en la
      auditoría (*"«revisar» no significa necesariamente «cambiar»"*) y otro por decisión del
      propio desarrollador. **Agrupar con la versión declarada habría serializado tres
      terminales sin motivo.**
      **Y no hay que esperar parado:** se agrupa provisionalmente con la huella post-plan
      **como cota superior declarada como provisional**, y se consolida al llegar cada GO.
      Así el reparto no se detiene y **nadie confunde una estimación con un permiso**.
      ⚠️ **REQUISITO DE FORMATO, no sugerencia:** un reparto provisional **lleva la marca de
      tiempo DENTRO de la propia línea**, con *"es una foto, no un permiso"* al lado.
      Motivo, y ya se ha visto cuatro veces: **un "provisional" escrito en una ficha deja de
      leerse como provisional a las pocas horas.** Se obliga por formato porque **un campo
      que se puede omitir se omite el día que hay prisa** — y la prisa es exactamente cuando
      un reparto provisional se vuelve permanente sin que nadie lo decida.
    - **40.2 — La disjunción se reverifica AL ASIGNAR, no una sola vez al hacer el mapa.**
      **El mapa es una foto, no un permiso permanente** (decisión 22 aplicada al reparto):
      ese mismo día se autorizó un fichero libre al mirarlo y ocupado veinte minutos
      después.
      **Y el motivo de fondo: la huella de IMPLEMENTACIÓN subestima.** Una tarea salió del
      plan con cuatro escritores de una entidad y acabó con cinco, porque al traer `main`
      apareció uno que el plan no podía conocer. **Nunca encogió: creció.** Así que el mapa
      **sobra antes de auditar y falta después de repartir, y los dos sesgos NO se
      cancelan** — de ahí que hagan falta dos puntos de control, no uno.
    - **40.3 — Vértice de corte: la regla que cambia la estrategia.**
      > **Cuando el mapa muestre un VÉRTICE DE CORTE —una tarea que toca la mayoría de los
      > ficheros disputados y de la que dependen las demás—, esa tarea SE PRIORIZA y no se
      > buscan disjuntos DENTRO DE SU COMPONENTE**: ahí no los hay, y lo que parece
      > paralelismo es espera repartida. **Trabajo en OTRO COMPONENTE CONEXO sí es trabajo**,
      > y se reparte con normalidad.

      ⚠️ **La redacción original decía *"no se buscan disjuntos a su alrededor"*, y eso
      descartaba trabajo que la propia razón de la regla autorizaba** (enmienda 7, corregida
      por la Directora horas después de proponer ella misma el hallazgo). **"Alrededor" no
      es un término del grafo**: dos tareas que no tocaban ninguno de los ficheros
      disputados —una solo `Design/pantallas/*.dc.html`, otra `app/layout.tsx` libre— **no
      están alrededor del vértice, están en otro componente conexo**, y no reparten su
      espera porque no esperan nada suyo. Con la redacción vieja se habrían descartado
      **las dos únicas tareas empezables de esa noche**.

      📌 **Y el vocabulario es la parte que hay que conservar, no adornarla:** con
      *"alrededor"* el error era invisible; con **vértice de corte** y **componente conexo**
      salta a la vista. Es un caso donde la precisión técnica **es** el mecanismo de
      detección. Y es la decisión 36 otra vez — *una regla ambigua cuesta lo mismo que una
      regla ausente*, aquí con el coste medido en una noche de reparto.
      *El caso:* AIT-81 tocaba **cuatro de los cinco** ficheros disputados y las otras tres
      dependían de ella. **No eran cuatro tareas bloqueadas por dos ficheros: era un lote
      entero bloqueado por una tarea.** Buscar trabajo disjunto alrededor era la estrategia
      equivocada — no lo había, y el poco que existía ya estaba asignado.
      **Paralelizar contra un vértice de corte reparte espera, no trabajo.**
    - 📌 **Y esto le da al mapa su TERCERA función, que es la que más rinde:** no solo
      reparte (38.1) y no solo responde si la concentración es estructural (condición de
      reevaluación) — **identifica qué tarea desbloquea a las demás.**
  - **38.4 —** esto le da uso inmediato a la 36.2: las fichas ya anotan qué ficheros
    bloquean y cuánto alcance queda libre, así que **con el lote planificado esos datos
    dejan de ser un registro para el futuro y pasan a ser la ENTRADA del reparto**. Es la
    primera vez que una de nuestras reglas de registro alimenta una decisión operativa el
    mismo día en que se escribió.
- ❓ **Pregunta abierta, con su fuente de evidencia ya en marcha:** ¿debería la unidad de
  bloqueo ser **el fichero** y no la tarea? El 2026-09-08, **tres de las cuatro tareas
  bloqueadas lo estaban por un solo fichero cada una**. **No se decide hoy** — partir tareas
  tiene su propio coste y no está medido, y resolverlo con tres casos y una intuición sería
  justo lo que este documento lleva todo el día evitando. **Pero la 36.2 obliga a anotar qué
  ficheros bloquean y cuánto alcance queda libre**, así que en un par de semanas habrá datos
  reales para responderla. No es una idea descartada: es una pregunta con su instrumento ya
  puesto.
- **Los merges/push a main los ejecuta la directora sin esperar confirmación previa de Aitor** (desde 2026-08-12, ver §2bis) — pero le reporta un resumen de cada publicación después, y **para y pregunta antes** de publicar si algo de la revisión final (§2, paso 4) no cuadra, o si el caso encaja en alguno de los disparadores de escalado de §2bis.
- **Algoritmo para elegir la siguiente tarea de una terminal libre**, en este orden:
  1. ¿Hay algo en `codigo para auditar/cola/` con nombre `SIGUIENTE-N_...` (no `BLOQUEADA_...`)? Coge el número más bajo.
  2. Si la cola está vacía o solo tiene bloqueadas: mira Linear, proyecto `SuperCRM — MVP`, issues sin empezar de la fase actual (nunca de una fase futura — regla de no adelantarse).
  3. Si el MVP no tiene nada libre de verdad (todo Done, Cancelado, o ya reclamado): ver si hay algo bloqueado que ya se desbloqueó (una `BLOQUEADA_...` cuya condición ya se cumplió — pasarla a `SIGUIENTE-`).
  4. Si tampoco: y solo si Aitor ya autorizó explícitamente tirar de Post-MVP (excepción de alcance, no asumir sin pedirlo — ver `CLAUDE.md`), coger de `SuperCRM — Post-MVP` respetando las dependencias declaradas entre esos issues (empezar por las que no dependen de ninguna otra).
  5. En cualquiera de los casos: antes de asignar, comprobar que no hay conflicto de archivos con lo que las demás terminales tienen en marcha ahora mismo (no con lo que ya publicaron). Si lo hay, esa tarea espera — no se reparte "aceptando el riesgo" salvo que Aitor lo confirme explícitamente para ese caso concreto (ver política de "esperar por defecto" ya documentada más abajo en este mismo §3).
  6. **Si tras los pasos 1-4 no queda nada seguro que repartir** (backlog de MVP y Post-MVP agotados, o Post-MVP sin autorizar todavía): la terminal se queda idle con el motivo anotado en su `T<n>_en-espera.txt` (regla de siempre, no adelantar alcance) — y se lo señalas al **PM**, no a Aitor directamente (pedido explícito de Aitor, 2026-08-15, ver `director.md` y `pm.md`). Es el PM quien decide si/cuándo preguntarle a Aitor qué construir a continuación; tu trabajo termina en avisarle a él.
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
- Comprobar que Railway sigue activo (mirar `https://supercrm-production-bf48.up.railway.app`) y que el trial no ha caducado — si caducó, avisar a Aitor, no es algo que se arregle solo (ya pasó una vez, 2026-08-13, ver ADR-002).

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

## 4ter. Arranque de la fábrica con un comando — `/factory` (decidido 2026-08-15,
rediseñado 2026-08-15 para que el PM sea la puerta de entrada)

En vez de abrir cada ventana a mano, `/factory` (definido en
`.claude/commands/factory.md`) abre una ventana nueva con el **PM** — es la puerta de
entrada visual de la fábrica (rediseñado 2026-08-15: antes era el Factory Architect
quien arrancaba todo recolorando la propia sesión; ahora el primer salto visible de
"terminal normal" a "fábrica de software" es la ventana verde del PM, presentándose
antes de preguntar nada — ver `pm.md`, "Eres la puerta de entrada de `/factory`"). La
sesión que ejecutó `/factory` no asume ningún rol de pipeline — su trabajo termina en
abrir esa ventana.

El PM se presenta primero, y decide con Aitor cuándo levantar al resto del equipo: crea
entonces al **CEO** (orientado ya al proyecto en marcha); el CEO crea **Directora**,
**Integrador**, **Factory Architect** y **QA**, cada uno orientado igual; la Directora, una vez
arriba, crea las terminales de desarrollo que el backlog sostenga ahora mismo — **nunca
un número fijo**, mismo criterio de siempre: no se abre una terminal para rellenar un
hueco sin tarea independiente real (§3, "no adelantar fases").

**El Integrador sí se crea automáticamente** (decidido 2026-08-15, ajustado sobre el
diseño inicial que lo dejaba fuera): crear la sesión ya no activa por sí sola autoridad
de publicar sin supervisión — quién publica y si pregunta antes lo decide **el modo de
publicación vigente, que NO se consulta aquí**: vive en `_modo-publicacion.txt` y se lee
como explica "Modo de publicación del Integrador" más abajo. Esto separa "existe la
sesión" de "publica sola", que es lo que de verdad hacía falta proteger.

⚠️ **Este párrafo describía antes el valor concreto del modo** ("empieza siempre en
confirmar"), y eso causó un fallo real el 2026-09-08: el PM lo leyó como el estado
presente y le informó al CEO de un modo que no era el vigente. Un documento no declara el
valor actual de un estado mutable — ver §2quinquies, corolario.

**Todo son ventanas separadas — nunca pestañas** (decidido definitivamente 2026-08-15,
tras probarlo de verdad contra el entorno real: crear una pestaña en una ventana
concreta vía `Cmd+T` simulado no es fiable en esta máquina — casi siempre abre una
ventana nueva en vez de una pestaña en la que se pide, y minimizar ventanas por script
para aislar un intento de fusión tampoco funcionó. Se intentó dos veces, con varios
métodos — `frontmost`, `set index`, `AXRaise` de Accesibilidad — ninguno lo garantiza).
En vez de pestañas: **título + color + posición en pantalla** identifican y agrupan
visualmente lo que va junto, sin depender de una mecánica que no se puede garantizar.

### Identificación visual — color de fondo + título, por rol

| Rol | Color de fondo (RGB Terminal.app, 0–65535) | Título |
|---|---|---|
| Factory Architect | violeta oscuro `{16000, 0, 20000}` | `Factory Architect` |
| CEO | rojo oscuro `{20000, 0, 0}` | `CEO` |
| PM | verde oscuro `{0, 20000, 0}` | `PM` |
| Directora | azul oscuro `{0, 0, 20000}` | `Directora` |
| Integrador | ámbar oscuro `{20000, 12000, 0}` | `Integrador` |
| QA | turquesa oscuro `{0, 18000, 18000}` | `QA` |
| Desarrollador (`T<n>`) | por defecto (negro) | `T<n> - Desarrollador` |
| Auditor (`T<n>`) | por defecto (negro) | `T<n> - Auditor` |

Ajustar los tonos exactos a gusto es seguro — lo único que importa para el diseño es que
sean distinguibles a simple vista y consistentes entre sesiones.

### Receta: abrir una ventana nueva con rol, color y título

Verificado 2026-08-15; **corregido dos veces el 2026-08-24** (hallazgos del Factory
Architect, ejecutados por el CEO):

1. Claude Code reescribe el título de su propia ventana con un literal fijo (`<glifo de
   estado> Claude Code`) en cada cambio idle↔busy, y no hay flag/config para
   desactivarlo — así que fijar el título una sola vez, justo tras arrancar `claude`,
   sobrevive solo hasta el primer cambio de estado. El color de fondo **no** se ve
   afectado (Claude Code no lo toca), así que ese sí sigue fijándose una sola vez.
2. `do script "<cmd>"` sin ventana de destino explícita **reutiliza la ventana
   frontmost existente si está inactiva** (comportamiento documentado de Terminal.app,
   no de Claude Code) en vez de abrir una ventana nueva de verdad. Ese riesgo es real y
   sigue vivo — pero **no se resuelve con `make new window`, que está roto en este
   entorno** (punto 3): se resuelve con la verificación anti-reutilización por conjuntos
   de ids de la receta de abajo, que es obligatoria, no opcional.
3. **`make new window` está RETIRADO** (decisión del Factory Architect, 2026-09-08, tras
   9/9 fallos conocidos: 4/4 el 2026-09-03 y 5/5 el 2026-09-08). Diagnóstico del CEO:
   `make new window` **sí crea la ventana, pero la crea SIN TAB** — `get count of tabs`
   devuelve `0` y `tab 1 of window ...` da `Invalid index (-1719)`, así que el
   `do script ... in w` siguiente revienta con `AppleEvent handler failed (-10000)` y el
   bloque entero no devuelve `id`. Cada intento deja además una **ventana fantasma**
   permanente (ver abajo). No lo uses ni como primaria ni como fallback.

**Receta vigente**, para **cada** ventana que arranca `claude` — los seis roles centrales
y la ventana Desarrollador de cada worker (la ventana Auditor nunca arranca `claude`, no
necesita este tratamiento). Los cuatro pasos son obligatorios; el 1/3 y el 3bis son
justamente lo que evita decorar una ventana ajena o un cadáver:
```bash
# 1. Conjunto de ids ANTES (conjuntos, nunca conteos — ver la nota de fantasmas)
ids() { osascript -e 'tell application "Terminal" to get id of every window' \
          | tr ',' '\n' | tr -d ' ' | grep -E '^[0-9]+$' | sort -n; }
BEFORE=$(ids)

# 2. Crear la ventana
osascript -e 'tell application "Terminal" to do script "cd '"'"'<ruta>'"'"' && claude --permission-mode auto"'
sleep 1

# 3. La ventana nueva es el id que NO estaba antes. Si no aparece ninguno, reutilizó una
#    inactiva o no creó nada — ABORTA, no sigas sobre una ventana que no es tuya.
WINID=$(comm -13 <(echo "$BEFORE") <(ids) | head -1)
[ -z "$WINID" ] && { echo "ABORTA: ninguna ventana nueva"; exit 1; }

# 3bis. Guarda de sanidad: una ventana viva tiene exactamente 1 tab. Si da 0 es un
#       fantasma, no hay nada corriendo dentro — aborta en vez de ponerle título y color.
TABS=$(osascript -e "tell application \"Terminal\" to get count of tabs of (first window whose id is $WINID)")
[ "$TABS" != "1" ] && { echo "ABORTA: ventana $WINID sin tab (fantasma)"; exit 1; }

# 4. Título, color y posición, SIEMPRE apuntando por $WINID (nunca buscando por título)
osascript -e "tell application \"Terminal\" to set custom title of tab 1 of (first window whose id is $WINID) to \"<Título>\""
osascript -e "tell application \"Terminal\" to set background color of tab 1 of (first window whose id is $WINID) to {R, G, B}"
```

**Por qué conjuntos y no conteos** (corregido 2026-09-08): el texto anterior decía
"compara el número de ventanas antes/después". Con las ventanas fantasma acumuladas, esa
cuenta está falseada. Un conjunto no lo está: los fantasmas salen en el de antes y en el
de después, se cancelan solos, y el único id nuevo sigue siendo el correcto.

**Ventanas fantasma — residuo conocido, NO se intentan limpiar.** Cada fallo de `make new
window` dejó una ventana sin tab, invisible en pantalla pero contada por `get id of every
window`. Hay cinco a fecha de 2026-09-08 (ids 2385, 2387, 2500, 2518 y 2658 — esta última
de la Directora, al crear las ventanas de T3) y **sobreviven entre sesiones y entre días**
— la 2385 es anterior a la jornada en que se diagnosticaron, así que no las limpia nadie
al cerrar. `close` sobre ellas devuelve exit 0 sin error y la
ventana sigue en la lista (verificado dos veces: el CEO y el Factory Architect, sobre
ventanas distintas) — es el mismo patrón de "osascript devuelve sin fallar aunque no haya
hecho nada" que ya vigilamos. Son inofensivas: sin tab y sin proceso dentro. Lo único que
estropean son los conteos de ventanas, y por eso la receta va por conjuntos.
**NO VERIFICADO:** reiniciar Terminal.app es la única vía plausible para quitarlas, pero
nadie lo ha probado — no lo escribas como si lo supiéramos.

### Receta: saber qué ventana es cada sesión (mapeo tty ↔ id ↔ título)

Cuando necesites que una sesión confirme en qué ventana está — al crear roles nuevos, o
al diagnosticar cuál de varias terminales es la que falla.

⚠️ **Nunca le pidas a una sesión "confírmame tu `tty`".** Desde la herramienta Bash, `tty`
a secas devuelve siempre `not a tty`, así que esa comprobación falla el 100% de las veces
sin decir nada útil (§2sexies). Ocurrió de verdad el 2026-09-08: el CEO se lo pidió a los
cuatro roles que acababa de crear, y lo cazó el Integrador.

La receta correcta, que además da el mapeo completo de una vez:
```bash
ps -o tty= -p $PPID   # el tty de la propia sesión que lo ejecuta

# tabla tty ↔ id de ventana ↔ título (los fantasmas salen como error en `tab 1`)
for id in $(osascript -e 'tell application "Terminal" to get id of every window' | tr ',' ' '); do
  printf "win %s | tty: %s | title: %s\n" "$id" \
    "$(osascript -e "tell application \"Terminal\" to get tty of tab 1 of (first window whose id is $id)" 2>&1)" \
    "$(osascript -e "tell application \"Terminal\" to get custom title of tab 1 of (first window whose id is $id)" 2>&1)"
done
```

El flag `--permission-mode auto` (verificado 2026-08-25, existe en `claude --help`) es
la pieza clave: deja la sesión en modo auto desde el arranque, en vez de arrancar en
modo por defecto/manual y depender de un cambio en caliente después — eso último no
escala (alguien tendría que acordarse de hacerlo ventana por ventana, y ninguna sesión
puede cambiarse el modo a sí misma ni por petición de otra sesión, ver más abajo). La
fase de plan del Desarrollador no usa este flag ni lo pisa: se gestiona aparte con las
herramientas `EnterPlanMode`/`ExitPlanMode` que la propia sesión invoca desde dentro,
sin conflicto con el modo auto de fondo.
Captura el `id` de ventana que devuelve ese bloque (no vale volver a buscar por título
después: es justo lo que se vuelve intermitente) y lanza a continuación, desatendido en
segundo plano, un bucle que reafirma el título cada ~2s apuntando por ese `id`:
```bash
( while true; do
    osascript -e "tell application \"Terminal\" to set custom title of tab 1 of (first window whose id is $WINID) to \"<Título>\"" >/dev/null 2>&1 || break
    sleep 2
  done & ) disown
```
Esto no elimina el parpadeo al glifo de estado, pero gana la carrera por frecuencia: el
título muestra el rol casi todo el tiempo. Cualquier receta posterior que necesite
localizar esa ventana (p. ej. la de `bounds` de abajo) debe hacerlo por este mismo `id`
capturado, no por contenido de título — buscar por título sigue siendo poco fiable
mientras el bucle no haya ganado su próxima ronda.

**Modo de la sesión — AUTO por defecto, fijado al arrancar, no después** (pedido
explícito de Aitor, 2026-08-25, aplica a cualquier fábrica de este montaje): con el
`--permission-mode auto` de la receta de arriba, toda ventana nueva ya nace en modo
auto — no hace falta ninguna verificación ni cambio posterior. Si encuentras una
ventana YA EXISTENTE en modo manual/default fuera de una fase de plan (arrancada antes
de este ajuste, 2026-08-25), no se la puedes cambiar tú desde fuera ni pedírselo a ella
por mensaje — eso sería la propia sesión escalándose sus permisos por petición de un
peer, que ninguna sesión debe hacer. La solución es cerrarla y volver a abrirla con la
receta corregida (mismo procedimiento de "reiniciar una terminal" ya documentado — el
estado real vive en la rama de git, no en la sesión, así que no se pierde trabajo).

Para roles de raíz (PM, Directora, Integrador — `CLAUDE.md` no los distingue solo por
carpeta, a diferencia de un Desarrollador en su worktree): no hace falta pasar el rol
como argumento de arranque — espera a que la sesión aparezca en `ListAgents` y mándale
el rol por `SendMessage` ("eres el Product Manager, lee `pm.md` completo"), exactamente
igual que ya se hace hoy con los briefs de tarea a T1/T2/T3.

### Receta: cerrar una ventana que tiene un proceso `claude` vivo dentro, sin quedarte
con un diálogo atascado (hallazgo del CEO, verificado 2026-09-03)

Aplica cuando ya has decidido de verdad que esa ventana concreta hay que cerrarla o
relanzarla (p. ej. arrancó con un flag/config antiguo, o se quedó atascada en un prompt
interactivo de arranque que no vas a resolver a mano) — **esto no es un permiso general
para matar cualquier proceso de cualquier ventana que parezca parada sin más**; la
decisión de que hay que cerrarla sigue el mismo criterio de siempre (verificación real
antes de actuar, nunca asumir, ver §2bis).

**No uses `tell application "Terminal" to close (first window whose id is X)` directamente
sobre una ventana con un proceso vivo dentro.** Terminal.app no cierra sin más: dispara su
propio diálogo nativo "¿Terminar procesos en curso?", que solo un clic humano puede
resolver — ninguna sesión de Claude Code puede simular clics/teclas (bloqueado por el
clasificador de modo auto, con razón: es una capacidad de riesgo real). El comando
`close` además **devuelve sin error aunque no haya cerrado nada de verdad** — no lo des
por hecho solo porque `osascript` no falló, verifica el resultado (vuelve a listar las
ventanas, o captura pantalla) antes de reportar la ventana como cerrada.

Mecánica correcta, sin diálogos:
```bash
# 1. Averigua el PID del proceso claude de esa ventana/tty (o ya lo tienes capturado)
ps -o pid,tty,comm -p <PID>

# 2. Mátalo directamente — esto NO dispara ningún diálogo de confirmación
kill <PID>

# 3. Ahora sí, cierra la ventana ya vacía (opcional — un shell sin proceso hijo
#    normalmente cierra sin preguntar; si de todos modos aparece un diálogo residual
#    de una ventana que YA tenía uno abierto antes del paso 2, ese diálogo concreto
#    solo lo descarta un clic humano — pídeselo a Aitor, no es bloqueante para nada más)
osascript -e 'tell application "Terminal" to close (first window whose id is <ID>)'
```

### Receta: colocar dos ventanas relacionadas una al lado de la otra

Verificado 2026-08-15, no necesita ningún permiso de Accesibilidad (es una propiedad
directa de la ventana, no simula teclas). Úsala para el par de un mismo `T<n>` —
Desarrollador a la izquierda, Auditor justo a su derecha, misma `Y`, para que se vea de
un vistazo que están relacionados (además del título con el prefijo compartido):
```bash
osascript -e 'tell application "Terminal" to set bounds of (first window whose custom title of tab 1 contains "<título Desarrollador>") to {X1, Y1, X2, Y2}'
osascript -e 'tell application "Terminal" to set bounds of (first window whose custom title of tab 1 contains "<título Auditor>") to {X2+GAP, Y1, X2+GAP+(X2-X1), Y2}'
```
`{X1, Y1, X2, Y2}` son las esquinas superior-izquierda e inferior-derecha en píxeles —
ajusta a lo que quepa bien en la pantalla de turno.

### Cada `T<n>` son DOS ventanas — Desarrollador y Auditor, nunca pestañas

Ambas con fondo por defecto (negro), tituladas `T<n> - Desarrollador` y
`T<n> - Auditor` (el prefijo compartido es lo que las empareja), una al lado de la
otra (Desarrollador a la izquierda) con la receta de arriba:
- **Ventana Desarrollador:** `cd` al worktree + `claude` — se autoidentifica sola como
  Desarrollador (verificado, §4bis).
- **Ventana Auditor:** `cd` al mismo worktree y se queda en el prompt de shell — NO
  arranca `codex` todavía. Solo se usa cuando hace falta auditar (ver siguiente punto).

### Disposición en pantalla — árbol horizontal (decidido 2026-08-15)

Además de agrupar por color/título, las ventanas se colocan formando un árbol: el PM
solo, arriba del todo (es la puerta de entrada de `/factory` — ver arriba, rediseñado
2026-08-15, antes era el Factory Architect quien ocupaba esa posición); debajo de él,
los demás roles centrales en una fila (los crea el CEO en cuanto el PM decide levantar
al equipo); debajo de esa fila, la Directora a la izquierda como raíz de su equipo, con
una lista de sus parejas `T<n>` extendiéndose hacia la derecha — cada fila de la lista
es un Desarrollador seguido, a su derecha, de su Auditor. Usa siempre la receta de
`bounds` de arriba (ninguna mecánica nueva, solo geometría):

```
                [ PM ]

Fila arriba:    [ CEO ]  [ Factory Architect ]  [ Integrador ]  [ QA ]

                          [T1-Dev][T1-Aud]
[ Directora ]             [T2-Dev][T2-Aud]
                          [T3-Dev][T3-Aud]
                          ...
```

**Constantes de layout** (ajustables a gusto — lo único que importa es que no se
solapen): ancho de ventana `W=480`, alto `H=320`, hueco entre ventanas `GAP=20`, origen
`X0=40, Y0=40`.

**PM**, arriba del todo — mismo `X` que el CEO (`X0`), una fila entera por encima de la
fila de roles centrales: `Y = Y0 - H - GAP` (es decir, `Y0` pasa a ser la fila de
CEO/Factory Architect/Integrador, no la más alta de todas).

**Fila de arriba — roles centrales**, en `Y0`, uno al lado de otro (`CEO` en `X0`,
`Factory Architect` en `X0+(W+GAP)`, `Integrador` en `X0+2*(W+GAP)`, `QA` en
`X0+3*(W+GAP)`) — usa la receta de "abrir ventana nueva" para cada uno, luego la de
`bounds` con estas coordenadas.

**La lista de parejas `T<n>`**, empezando en `Y1 = Y0 + H + 60`: para la pareja número
`i` (empezando en 0), la ventana Desarrollador va en `X = X0 + W + GAP`,
`Y = Y1 + i*(H + GAP)`; la Auditor a su derecha, misma `Y`: `X = X0 + 2*(W + GAP)`.

**La Directora, a la izquierda, centrada verticalmente sobre su lista — se coloca AL
FINAL, no al principio.** No se sabe cuántas `T<n>` va a crear hasta que lo decide
(nunca un número fijo, ver §3), así que no se puede centrarla de antemano. Por eso la
propia Directora reposiciona su ventana **después** de haber creado todas sus parejas,
una vez sabe el total `N`:
```bash
# alto total de la lista con N parejas: N*H + (N-1)*GAP
osascript -e 'tell application "Terminal" to set bounds of (first window whose custom title of tab 1 contains "Directora") to {X0, CENTRO_Y - H/2, X0+W, CENTRO_Y + H/2}'
```
donde `CENTRO_Y = Y1 + ALTO_LISTA / 2` (el centro vertical del bloque completo de la
lista, no de una fila suelta), con `ALTO_LISTA = N*H + (N-1)*GAP`. Con
una sola célula (el caso de hoy) esto significa: la Directora se coloca centrada
verticalmente frente al conjunto de `T1`, `T2`, `T3`... que tenga en ese momento — si
más adelante abre una más, recalcula y se recoloca.

Es una mejora puramente visual, no funcional — si algo no encaja bien en la pantalla de
turno (por ejemplo, con varios monitores), Aitor puede arrastrar cualquier ventana a
mano sin que eso rompa nada del diseño.

### El auditor deja de ser invisible (decidido 2026-08-15)

`codex exec` pasa a correr **dentro de su propia ventana**, no escondido en el Bash de
la Directora como hasta ahora. Es exactamente el mismo `codex exec` de un solo disparo
de siempre — mismo prompt, mismo contrato, nada cambia en CÓMO audita (se descartó
explícitamente pasar a una sesión de Codex interactiva y persistente: duplicaría el
mismo tipo de fallos que ya vigilamos en desarrolladores, y arriesgaría la independencia
del auditor si Aitor le responde preguntas sustantivas en vivo — ver conversación que
motivó esta decisión). Lo único que cambia es DÓNDE se ejecuta.

### Qué se puede tocar de la ventana del Auditor, y qué no (decisión 35, 2026-09-08)

**Corrige un límite anterior que estaba mal puesto.** Se había escrito *"nunca en la ventana
del Auditor"*, y es demasiado grueso: **lo que hay que proteger no es la ventana, es el
juicio.** Un auditor bloqueado en un prompt de permiso de su CLI es una terminal parada como
cualquier otra, y prohibir la ventana entera deja el pipeline colgado sin proteger nada.

**La frontera va por TIPO DE INTERVENCIÓN, no por ventana:**

| | |
|---|---|
| ✅ **SÍ** | Leer su pantalla para ver **si está atascado y en qué**. |
| ✅ **SÍ** | Desatascar un prompt **mecánico** de la CLI: permiso para ejecutar un comando, "¿continuar?", y equivalentes. |
| 🚫 **NO** | Responder cualquier cosa que toque **el fondo de la auditoría**: aceptar un hallazgo, elegir un veredicto, contestar una pregunta sobre el código, o **cualquier cosa que le haga producir una conclusión a la que no llegó solo**. |

> **El test, y es su enunciado corto: *si la respuesta al prompt podría cambiar el veredicto,
> no es tuya.***

**Regla de duda:** si no está claro de qué tipo es el prompt, **no se toca** y se escala a
Aitor. El coste de esperar son minutos; el de contaminar una auditoría es que **deja de
valer para nada, y encima sin que se note**.

⚠️ **Declaración obligatoria, y no es cortesía: toda intervención sobre la ventana del
Auditor se anota** — qué había en pantalla, qué se pulsó, quién y cuándo, en el mismo sitio
donde se registran los demás desatascos. **La independencia del auditor tiene que quedar
demostrable en el registro, no solo en la intención:** sin esa anotación, dentro de un mes
**nadie puede distinguir un GO limpio de uno que alguien ayudó a producir**.

*(La parte de permisos —poder leer y escribir en esa ventana— sigue pendiente de que Aitor
cree el `settings.json` trackeado. Las dos van juntas: sin leer, escribir es pulsar teclas
a ciegas.)*

**Por qué importa:** si el auditor se cuelga en un prompt de permiso de su propia CLI
(no una pregunta sustantiva del audit — `auditor_prompt.txt` lo instruye explícitamente
a NO preguntar, sino declarar "no verificado" cuando falta evidencia), Aitor puede verlo
y responderlo él mismo directamente en esa ventana, sin depender de que la Directora lo
note o lo entienda. Esto le da a Aitor un canal de observación e intervención
independiente del Director — mismo principio de "malla, no pirámide" ya aplicado entre
agentes (ver §2bis y `ceo.md`), ahora extendido a Aitor.

Comando, lanzado por la Directora apuntando a la ventana Auditor correcta de ese worker
— encadena al final un marker de finalización (`touch /tmp/claude-crm-auditor-done-T<n>`,
ver "Patrón: aviso instantáneo sin depender del barrido" más abajo, §2bis-ter, para el
mecanismo completo de cómo la Directora se entera sola, al instante, de que el auditor
terminó):
```bash
osascript -e 'tell application "Terminal" to do script "cd \"<worktree>\" && codex exec \"Audita el fichero <ruta> siguiendo tu rol de auditor ya cargado desde AGENTS.md\" ; touch /tmp/claude-crm-auditor-done-T<n>" in (first window whose custom title of tab 1 contains "T<n> - Auditor")'
```

### Patrón: aviso instantáneo sin depender del barrido (principio general, 2026-09-04)

**Cuándo aplica:** cualquier vez que un rol dispara trabajo no interactivo/no-mensajeable
sobre un proceso externo y necesita saber cuándo termina, sin esperar al próximo ciclo de
un barrido periódico ni quedarse sondeando a mano. **Por qué no usar `SendMessage`/
`notify_when_idle` directamente** (pregunta real de Aitor, 2026-09-04): ese mecanismo da
aviso inmediato de verdad, pero solo entre sesiones Claude Code — el auditor (`codex
exec`) no es una sesión Claude Code, es un proceso de otra CLI corriendo en su propia
ventana de Terminal, invisible para ese canal. El patrón de abajo es lo más parecido a
ese mismo "aviso inmediato sin sondeo" que se puede lograr contra un proceso externo
opaco. Si en el futuro el trabajo que disparas SÍ es otra sesión Claude Code, usa
`SendMessage`/`notify_when_idle` en vez de este patrón — este es específicamente para
cuando eso no es una opción. Caso que lo originó: la
Directora disparaba al auditor (`codex exec`, ver arriba) y un veredicto NO-GO se quedó
~6 horas sin relayar porque nadie volvía a mirar esa ventana concreta hasta el siguiente
ciclo del barrido (hasta 20 min, y esa noche ni eso — ver incidente en `director.md`).
No es un parche puntual para Directora↔Auditor: es el mecanismo por defecto para
**cualquier** par de roles, actuales o futuros, en esta situación.

⚠️ **EL ORDEN DE ESTOS DOS PASOS ES EL MECANISMO** (decisión 49, 2026-09-08). Durante
semanas estuvieron escritos al revés, y así **el patrón es una carrera**. Ver abajo.

---

### Decisión 50 — El fichero-marca es el mecanismo inferior, y ahora sabemos por qué (2026-09-08)

> **Un fichero-marca no distingue "no ha pasado" de "pasó y se perdió la marca". El proceso
> vivo o muerto solo tiene una lectura.**
>
> *(Formulación de la Directora, que es quien lo diagnosticó.)*

Un marker ausente tiene **tres** causas —no ha terminado; terminó y la marca se borró; nunca
se creó— **y las tres se ven idénticas**. `ps aux | grep -c "[c]odex exec"` no tiene ese
problema: es **una observación del mundo, no de una marca que alguien dejó**. Es el criterio
del Integrador (enmienda 9) aplicado a la observación en vez de a la evidencia: **el proceso
no puede mentir sobre si existe.**

**50.1 — Se prefiere siempre una señal observable directamente** —el proceso, el commit, el
fichero de salida— **a una que dependa de que un actor deje una marca.** El marker se queda
solo donde no haya nada observable, y **declarado como inferior, no como equivalente.**

**50.2 — Nunca se destruye para defenderse de lo viejo.** La espera de la Directora empezaba
con un `rm -f` del marker para no leer el de la ronda anterior, y así **borró markers recién
creados por auditorías que habían terminado antes de que ella armara**. En sus palabras:

> **"No es un dato viejo leído como nuevo: es el dato nuevo destruido por defenderse del
> viejo."**

⚠️ **La ambigüedad temporal se resuelve comparando fechas, jamás borrando.** En el patrón de
abajo el `rm -f` va **después** de detectar el marker, nunca antes de esperarlo.

**50.3 — Ningún umbral temporal se escribe a mano; se calcula.** El suyo estaba **31 millones
de segundos corto** y habría dado por bueno cualquier veredicto de la historia del proyecto.
**Funcionó por casualidad**, que es la peor forma de funcionar. Enunciado corto: ***una
constante de tiempo escrita a mano no se puede revisar de un vistazo.***

**50.4 — Auditoría del resto de instancias, hecha el 2026-09-08.** El patrón "haz X y toca
este fichero para avisar" es cómodo, así que se buscó en todos los documentos de la fábrica.
**Tres instancias, y no son el mismo caso:**

| Instancia | Dónde | Veredicto 50.1 |
|---|---|---|
| **Marker de fin de auditoría** (`/tmp/claude-crm-auditor-done-T<n>`) | §2bis-ter aquí abajo, `director.md` | **Tiene sustituto observable y se usa: el proceso `codex` vivo o muerto**, y el último veredicto en el historial de la ventana. El marker baja a atajo cómodo, **declarado inferior**: si falta, no concluyes nada — vas a mirar el proceso |
| **Marker del aviso de voz** (`/tmp/claude-crm-notify-<worktree>`) | `intro-terminal.txt`, `director.md`, §4 aquí | **No tiene sustituto observable** —"¿debo avisar a Aitor?" no es un hecho del mundo, es una intención— así que **se queda, declarado inferior.** Y ya tenía documentado su propio fallo de esta familia: si el proceso muere, el hook `Stop` no llega a correr **por mucho que el marker esté puesto** |
| **`rm -f` defensivo antes de esperar** | era práctica, no documento | **Prohibido** (50.2). El `rm -f` va después de detectar |

📌 **Y el dato que hace que la 50.4 no sea opcional:** los tres fallos **se detectaron por
casualidad de barrer**. No hay nada montado que los detecte solo. Si el barrido es lo único
que los caza, **cada instancia sin auditar es un fallo esperando a que alguien pase por
delante**. Ninguno costó una ronda: solo minutos de espera invisible, que es la clase de
coste que no aparece en ninguna métrica y por eso se tolera indefinidamente.

**Enmienda 10 — el primer paso de la 50.1 es una pregunta, no una preferencia (2026-09-08).**
La 50.1 decía *"prefiere lo observable"* sin decir cómo saber cuándo no hay nada que observar.
El criterio que falta:

> **La línea no está entre marker y proceso: está entre señales de un HECHO y señales de una
> INTENCIÓN.**
>
> - *"¿Terminó X?"* es un **hecho del mundo**: siempre hay algo que observar —el proceso, el
>   commit, el fichero de salida— y **el marker sobra**.
> - *"¿Alguien quiere que pase Y?"* es una **intención**: no hay nada que observar, y ahí el
>   marker no es inferior — **es lo único que hay**.

**Así que antes de elegir mecanismo se pregunta: ¿esto es un hecho del mundo o la voluntad de
alguien?** La tabla de las tres instancias de arriba es el ejemplo trabajado.

**Y la consecuencia, que cambia la mitigación:**

> **Una señal de intención no admite verificación: solo redundancia.** Como no hay nada que
> observar, **no se puede comprobar si llegó** — así que va siempre con un segundo canal, y
> ninguno de los dos se da por suficiente.

*Prueba del mismo día:* el aviso por voz falló por dos sitios a la vez —etiqueta equivocada en
cinco de seis roles, y un marcador compartido que hacía que los avisos se robaran entre
roles— y **lo que funcionó fue el texto**. Nadie lo diseñó como redundancia: sobrevivió porque
había dos canales por casualidad. Y el remate está en la tabla de arriba: **si el proceso
muere, el hook `Stop` no corre por mucho que el marker esté puesto.** Una señal de intención
**nunca es más fiable que el mecanismo que la lee, y ese mecanismo tampoco se puede
observar.**

**El patrón, en 2 pasos — primero armar, después disparar:**
1. **Arma el vigilante ANTES de que exista nada que vigilar.** Con la herramienta `Bash` y
   `run_in_background: true`, lanza un bucle que espere un marker **que todavía no existe**:
   `until [ -f /tmp/<marker> ]; do sleep 2; done; rm -f /tmp/<marker>`. Recibes la
   notificación en tu propia conversación en el instante en que el marker aparezca — sin
   sondeo por intervalos largos ni depender de que nadie más lo note.
2. **Ahora sí, dispara el trabajo**, encadenándole al final ese mismo marker — `touch
   /tmp/<marker>`, con un identificador único de esa tarea concreta (nunca reutilices un
   marker de otro propósito, p. ej. el del aviso de voz a Aitor — son cosas distintas).

> **Un vigilante armado después del trabajo que vigila es una carrera que se pierde en
> silencio — y se pierde justo en los casos rápidos, que son los que uno da por seguros.**

**Por qué el orden inverso engañó tanto tiempo: falla en el trabajo fácil, no en el
difícil.** Con una auditoría de diez minutos la carrera se gana por casualidad y todo
parece correcto; con una de 50-70 segundos el marker aparece **antes** de que nadie lo
espere y el aviso no llega nunca. Caso real, 2026-09-08: a la Directora le pasó **tres
veces la misma noche** —auditorías de 50 y 70 segundos— y las tres las cazó contando
procesos `codex` vivos en su barrido, o sea **la red de seguridad haciendo el trabajo del
mecanismo**. Que las auditorías largas, que son las que preocupan, funcionaran bien es
exactamente lo que impidió verlo.

📌 **Y esto NO lo cubría la decisión 26** (armar el vigilante en el momento del envío):
allí el destinatario es una sesión que tarda en contestar. Aquí el problema es otro y la 26
no llegaba. Consta como hueco que teníamos, no como aplicación de algo ya escrito.

**Esto es cinturón y tirantes con el barrido, no lo sustituye**: el aviso instantáneo es
el camino rápido; el barrido periódico sigue siendo la red de seguridad si el proceso en
segundo plano muere (p. ej. con un reinicio de sesión) o el aviso se pierde por
cualquier otro motivo — no lo elimines de tu barrido solo porque tengas esto armado.

**Verificado en vivo** (2026-09-04): el CEO probó el mecanismo directamente (marker +
`Bash run_in_background` esperándolo) antes de documentarlo aquí — funciona exactamente
como se describe.

**Mejora opcional para el caso Directora↔Auditor, NO verificada todavía — no adoptar sin
probarla primero:** en vez de releer el buffer de pantalla de la ventana del auditor
(frágil), `codex exec "..." 2>&1 | tee /tmp/claude-crm-auditor-T<n>.log` mostraría la
salida en pantalla igual que ahora (Aitor sigue viendo/pudiendo intervenir) y además la
guardaría en un fichero legible directamente con `Read`, sin scripting de Terminal.app.
**Riesgo a comprobar antes de adoptarlo:** algunas CLIs cambian de comportamiento (dejan
de renderizar prompts interactivos) cuando su salida no va a un TTY real sino a una
tubería — verifica que el prompt de permiso de Codex se sigue viendo y siendo clicable
con `tee` de por medio. Si rompe eso, descártalo y quédate con la lectura de ventana que
ya existe; el patrón de arriba (marker + espera en segundo plano) funciona igual de bien
sin esta mejora.

### `.claude/settings.json` — la configuración que SÍ viaja (2026-09-08)

**Qué es y por qué existe.** Hasta el 2026-09-08 toda la configuración de la fábrica vivía
en `.claude/settings.local.json`, que **está en `.gitignore`**: no viaja a los worktrees, no
sobrevive a un clon en otra máquina, y no se puede revisar en un diff. Los hooks de voz
estaban **duplicados a mano en cuatro copias**. `settings.json` es la versión trackeada de
eso — se commitea, viaja y se revisa como cualquier otro fichero del repo.

**Qué concede hoy, exactamente dos permisos**, autorizados por Aitor:
- **Leer** el contenido de la ventana de otra terminal.
- **Escribir** en la ventana de otra terminal (`do script`).

**Van juntas a propósito: sin leer, escribir es pulsar teclas a ciegas.**

**Motivo medido, no teórico:** el 2026-09-08 hubo **~85 minutos de terminales sordas**
repartidos en tres sesiones, y Aitor tuvo que desatascarlas a mano varias veces porque
ningún rol podía ver qué prompt las tenía bloqueadas.

⚠️ **Sus límites son los de la decisión 35, y no son opcionales:** la capacidad es **para
desatascar**, no para influir. En la ventana del Auditor se puede resolver un prompt
mecánico de su CLI, pero **nada que toque el fondo de la auditoría** — *si la respuesta al
prompt podría cambiar el veredicto, no es tuya*. Y **toda intervención sobre una ventana
ajena se anota** (qué había, qué se pulsó, quién, cuándo).

📌 **Cómo entró en el repo, porque un fichero de permisos que aparece sin explicación es lo
primero que debería mirar con lupa cualquier auditoría futura:** lo tenía staged el Factory
Architect, con su propio commit ya redactado, y **el CEO se lo llevó por delante** al
commitear la decisión 36 — commiteando por ruta explícita, que es justo lo que la 18.2
mandaba y que resultó no proteger de nada (ver §2sexies). El fichero es correcto y su
contenido está autorizado; **lo que faltaba era su procedencia, y esto la restituye.**

⚠️ **Todavía no está operativo en todas partes: ninguno de los tres worktrees lo tiene** —
está en `main`, y sus ramas no lo verán hasta que traigan `main`. La Directora, que trabaja
desde la raíz, sí. **No dar por hecho que la capacidad ya existe en las terminales de
desarrollo solo porque el fichero esté en `main`.**

### Modo de publicación del Integrador

**Dónde vive:** `Sorfware Factory/_modo-publicacion.txt` (en `.gitignore`). **Este
documento no dice cuánto vale el modo ahora mismo** — se consulta siempre en ese fichero
(§2quinquies, corolario).

**Cómo se lee** (fichero de solo-anexar desde 2026-09-08; la vigente es la última línea
que no empieza por `#`, y el modo es su segundo campo):
```bash
grep -v '^#' "Sorfware Factory/_modo-publicacion.txt" | grep -v '^[[:space:]]*$' \
  | tail -1 | cut -d'|' -f2 | tr -d ' '
```

**Qué significa cada modo:** en `confirmar`, el Integrador pregunta a Aitor antes de CADA
publicación concreta (con alerta visible si no responde a tiempo, marca en `/tmp`
específica por tarea para no repetirla). En `autonomo`, publica con el GO del auditor y
reporta después. Detalle completo en `integrador.md`.

**Quién lo cambia:** Aitor, diciéndoselo a cualquier rol ("publica sin preguntar" /
"vuelve a preguntarme"). Quien lo reciba **anexa una línea nueva** con su procedencia
(`timestamp | modo | quién escribe la línea | quién se lo pidió | canal — quién lo oyó de
Aitor de primera mano`), nunca reescribe el fichero. **Si la línea vigente no trae procedencia, el modo efectivo es
`confirmar`** — ver §2quinquies (b), incluida la precisión de que eso se activa por
ausencia de procedencia, nunca por desacuerdo entre fuentes.

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

---

## 7. Estado de verificación (patrón robado a `talent-prd`, 2026-09-05)

Cada afirmación sobre cómo funciona la fábrica se marca **Verificado** (con evidencia y
fecha) o **NO VERIFICADO** (en negrita, con el motivo) — nunca se deja implícito. Un "no
verificado" honesto vale más que un "funciona" sin comprobar (ver §2ter). Añade aquí
cualquier mecanismo nuevo antes de darlo por bueno en el resto de documentos.

⚠️ **TRES preguntas obligatorias antes de marcar nada como Verificado** (decisiones del
Factory Architect, 2026-09-08 — ver §2sexies). En este orden, que es el de la secuencia
completa: **¿mido el sujeto correcto? → ¿discrimina mi prueba? → ¿puede la herramienta
mentirme en verde?**

**(1) *"¿estoy midiendo lo que creo que estoy midiendo?"*** (T2, decisión 22.) Va primera
porque es anterior a las otras dos: la prueba puede estar bien elegida y la herramienta ser
honesta, y aun así **el sujeto ser el equivocado** — o el mismo sujeto haber cambiado entre
que lo mediste y que lo afirmas. Toda medición de algo mutable se reporta **con su marca de
tiempo**; una medición sin hora se lee como permanente.

**(2) *"¿esto fallaría si el diseño fuera el equivocado?"*** Si la respuesta es no, la
prueba no vale **aunque salga verde**: una comprobación que da verde tanto con el diseño
bueno como con el malo no está comprobando nada. *(Atribución, corregida a petición del
propio T2: el caso concreto y la pregunta "¿esto fallaría si el diseño fuera el
equivocado?" son suyos; la generalización a categoría la trabajó con el Factory Architect,
que fue quien la colocó junto a las otras dos.)*

**(3) *"¿cómo podría esta verificación mentirme en verde?"*** — Si no sabes responderla, el mecanismo entra como **NO VERIFICADO**, no como
Verificado. Esto es lo que hace que §2sexies se aplique sola de aquí en adelante, en vez
de quedarse en una lista que envejece: seis de las comprobaciones que usábamos a diario
mentían en verde, y dos de ellas costaron los peores incidentes de publicación del
proyecto.

| Mecanismo/afirmación | Estado | Evidencia / motivo |
|---|---|---|
| Rol **Líder de célula** | **NO VERIFICADO** | Documentado por completo en `lider-celula.md` desde 2026-08-14, nunca activado — el proyecto no ha escalado a varias células todavía. Ningún paso de su flujo se ha ejecutado en vivo. |
| Fallback `tee` para leer el log del auditor en vez del buffer de ventana | **NO VERIFICADO** | Propuesto 2026-09-04 (ver §"El auditor deja de ser invisible"), marcado explícitamente "no adoptar sin probarla primero" — riesgo conocido de que algunas CLIs dejen de renderizar prompts interactivos con la salida en tubería. Nadie lo ha probado todavía. |
| `do script` sin ventana de destino como receta **PRIMARIA** de creación de ventana | Verificado, 11/11 | 4/4 el 2026-09-03 (CEO, ventana del QA) + 4/4 del CEO y 3/3 de la Directora el 2026-09-08 (roles centrales y ventanas de T3). Pasa de fallback a primaria por decisión del Factory Architect (2026-09-08). Su verificación anti-reutilización es OBLIGATORIA y va por **conjuntos de ids, nunca por conteos** — los fantasmas falsean la cuenta. La Directora llegó a la comparación por conjuntos **por su cuenta, antes de leer la corrección**, lo que es una validación independiente de que era el arreglo correcto y no una preferencia de quien lo escribió. |
| `make new window` como receta de creación de ventana | **Verificado como ROTO en este entorno — RETIRADO** | 10/10 fallos (4/4 el 2026-09-03; 5/5 del CEO y 1/1 de la Directora el 2026-09-08, esta última con el mismo -10000 exacto y dejando el fantasma 2658). Causa diagnosticada por el CEO el 2026-09-08: la ventana nace **sin tab** (`get count of tabs` = 0, `tab 1 of window` → `Invalid index -1719`), por eso el `do script ... in w` siguiente revienta con -10000 y el bloque no devuelve `id`. Deja además una ventana fantasma por intento, que **`close` no elimina: verificado inútil tres veces, por tres roles distintos, sobre tres ventanas distintas** (el CEO sobre las suyas, el Factory Architect sobre la 2385, la Directora sobre la 2658) — tres verificaciones independientes, no una repetida. Retirado por el Factory Architect (2026-09-08) — queda revocada la decisión anterior de mantenerlo como primaria. |
| Ventanas fantasma eliminables reiniciando Terminal.app | **NO VERIFICADO** | Única vía plausible que se le ha ocurrido a nadie para quitar las 4 ventanas sin tab acumuladas (ids 2385, 2387, 2500, 2518). `close` sobre ellas está verificado ineficaz dos veces (CEO y Factory Architect, sobre ventanas distintas): exit 0 sin error, y la ventana sigue en la lista. Nadie ha probado el reinicio. |
| `_modo-publicacion.txt` en formato solo-anexar con procedencia | Formato verificado, uso real **NO VERIFICADO** | Migrado por el CEO el 2026-09-08 (decisión del Factory Architect); la lectura de la línea vigente (`grep -v '^#' … \| tail -1 \| cut -d'\|' -f2`) se probó y devuelve `autonomo`. Pero ninguna publicación real lo ha leído todavía — el Integrador no ha publicado nada desde la migración. |
| `_registro-qa.txt` (log de rondas de QA, solo-anexar) | Creado, **NO VERIFICADO en uso** | Creado por el CEO el 2026-09-08 (decisión del Factory Architect) para cerrar un hueco real: `qa.md` no decía dónde anotar una ronda, y el histórico entero del QA anterior (`crm-curso-vibe-coding-fa`) se perdió al morir su sesión. Aún sin ninguna ronda anotada por un QA en su flujo normal. |
| `npm run test:e2e` como smoke-test de la app **publicada** | **Verificado FALSO** | Hallazgo del QA, 2026-09-08: `playwright.config.ts` levanta `npm run dev` y corre contra `http://localhost:3000`, con `.env.local` apuntando a `third-goldfinch-805` (Convex de dev/test). Prueba el working tree local contra el backend de dev, **no** el deploy de Railway contra `stoic-impala-857`. No ensucia producción, pero no es un smoke-test del deploy — no lo cuentes como tal. |
| Mecanismo de **parpadeo de ventana** (fondo alternando color de rol/blanco cuando algo necesita a Aitor, con hook para pararlo al responder) | **NO VERIFICADO — nunca implementado** | Encargado por el Factory Architect el 2026-08-31. Repasado el historial de git y de documentos el 2026-09-05: no hay commit, no hay mención en ningún `.md`, no hay hook en `settings.local.json` relacionado. Se quedó sin construir, no solo sin verificar — el CEO no tenía constancia de este hueco hasta que el Factory Architect preguntó directamente. |
| Patrón de aviso instantáneo (marker + `Bash run_in_background`) para saber cuándo termina el auditor | **Verificado en un ciclo real, 2026-09-08** | El CEO había probado el mecanismo genérico en vivo el 2026-09-04, pero faltaba verlo disparar en una auditoría de verdad. Ya está: la Directora encadenó `touch /tmp/claude-crm-auditor-done-T1` al `codex exec` de **AIT-76**, armó la espera en segundo plano, y al terminar el auditor le llegó la notificación en su propia conversación — relayó el GO en el acto, sin esperar al barrido. Sigue siendo cinturón y tirantes: el barrido periódico no se elimina. |
| `ScheduleWakeup` sin tope de caducidad (a diferencia de `CronCreate`, que caduca a los 7 días) | Verificado por observación, no por documentación oficial | Sin huecos ni caducidad a lo largo de más de 30h de uso continuo en esta sesión del CEO. El límite de 7 días de `CronCreate` sí está confirmado directamente en su documentación por el Factory Architect ("fire one final time, then are deleted"). |
| `requireOwner` rechaza server-side a un `sales` que invoque directamente la mutation de borrado (AIT-65) | Verificado, 2026-09-04 | El QA (entonces llamado "Tester") declaró explícitamente que no podía comprobarlo desde el navegador (solo veía el botón oculto en la UI); el CEO leyó `convex/model/access.ts` y confirmó que lanza `throw new Error(...)` si `user.role !== "owner"`. |
| Hook `PermissionRequest` para un `PermissionRequest` genérico | Verificado en vivo, 2026-09-04 | Comando pipe-testeado directamente por el CEO; Aitor confirmó haber oído el sonido y la voz antes de propagarlo a los 4 `settings.local.json` (raíz + T1/T2/T3). El hook sigue presente en las cuatro copias (verificado por el Factory Architect, 2026-09-08). |
| Hook `PermissionRequest` **para la pantalla de aprobación de `ExitPlanMode`** | **NO VERIFICADO** | Es un caso distinto del anterior, y llevábamos desde el 2026-09-04 asumiendo que estaba cubierto — **que funcione para un caso no lo verifica para el otro**, que es justo la confusión que esta tabla existe para evitar. El 2026-09-08 tres sesiones se quedaron sordas (~85 min sumados) y **nadie mencionó haber oído ninguna alerta de voz**. ⚠️ **Corregido el mismo día (decisión 17.4): de esos tres bloqueos, como mucho DOS podían sonar, no tres** — el del Integrador era un `AskUserQuestion`, que no pasa por el sistema de permisos y por diseño no puede disparar ningún hook. Se había asumido que los tres bloqueos eran del mismo tipo sin comprobarlo. La corrección importa porque cambia lo que significaría un "no oí nada" de Aitor. Explicaciones posibles para los dos que sí podían sonar, sin distinguir todavía: (a) `ExitPlanMode` no dispara `PermissionRequest` — sería el hueco real; (b) sonó y no había nadie delante; (c) el hook está roto. **Y una cuarta, que no es hipótesis sino OBSERVADA:** el marcador del hook de `Stop` es compartido entre los seis roles centrales. El CEO puso el marcador al detectar al Integrador atascado y **poco después ya no existía** — se lo llevó el primer turno que terminó, de quien fuera. No es "podría pasar": pasó ese mismo día, y confirma el robo de alertas con un caso real en vez de con la lectura del código (ver "Los tres bloqueos" arriba). **Cómo se resuelve, gratis:** T2 y T3 van a pasar por esa pantalla igualmente — la siguiente que lo haga reporta si sonó. Y preguntárselo a Aitor, que es quien ya lo sabría. Si resulta que sí dispara, el problema estructural se encoge de "30 minutos invisibles" a "30 segundos hasta que alguien lo oye". |
| Copias de `intro-terminal.txt` y documentos de proceso dentro de cada worktree | **Verificado como TRAMPA — no se leen** | Medido el 2026-09-08 por el Factory Architect y confirmado por el CEO: la copia de cada worktree diverge de la raíz **31 líneas en T1, 38 en T2, 31 en T3**. No es un riesgo teórico: las terminales estaban leyendo instrucciones desactualizadas en ese momento. Los documentos de proceso se leen **siempre desde la raíz, por ruta absoluta**; el permiso ya existe (`additionalDirectories` de los tres worktrees ya apunta a la raíz absoluta, verificado). **Y hay un tercer modo de fallo, aportado por T1: una rama NACE desfasada.** La suya se creó 6 commits por detrás de `origin/main`, los seis de documentos de proceso, con 27 líneas de diferencia en `intro-terminal.txt` — o sea que quien lee sus instrucciones desde el worktree las lee **congeladas el día que nació su rama, y sin forma de saberlo**. No hace falta que pase el tiempo: el desfase existe desde el primer minuto. Excluido `docs/`, que sí se quiere en la versión de la rama. |
| Propagación de `CLAUDE.md`/`AGENTS.md` a los worktrees | **NO VERIFICADO — sigue siendo manual, y no tiene arreglo técnico** | La herramienta los carga sola desde el worktree; no hay forma de redirigirlos a la raíz. La mitigación no es técnica sino de contenido: **que no contengan detalle de proceso que cambie a menudo**, solo el selector de rol y punteros a la raíz. Hoy `CLAUDE.md` ya está casi así — mantenerlo así a propósito, no por casualidad. |
| **Verificación de staleness de una terminal: red de tres niveles** | **Verificado como DEGRADADA — hoy solo funciona UNO** | Estado real al 2026-09-08: nivel 1 (transcript, con `queue-operation`) **funciona y es el único fiable**; nivel 2 (spinner del título) **intercambiado a propósito** por el bucle de titulado por rol, ya no es señal; nivel 3 (captura) **roto y en falso verde**, pendiente de que Aitor conceda Grabación de Pantalla. Declarado así por decisión 11 del Factory Architect: quien lea "tenemos tres niveles" tomaría decisiones contando con una red que no existe. |
| `osascript ... get contents of tab 1 of window <id>` como sustituto del nivel 3 | **NO VERIFICADO fuera de la propia ventana — pendiente de decisión de Aitor** | Verificado por el Factory Architect **solo sobre su propia ventana**: devuelve el buffer de texto, incluida la línea de estado interactiva (`⏵⏵ auto mode on · esc to interrupt`), o sea revelaría un `AskUserQuestion` abierto — que es justo para lo que existía el nivel 3, y además en texto grepeable y sin permisos del sistema. **Al intentarlo sobre la ventana de otro rol, el clasificador de su sesión lo bloqueó:** leer el buffer de otra ventana es leer la sesión de otro, y se trata como capacidad sensible. No se ha adoptado ni probado sobre ventanas ajenas, y no debe hacerse por indicación de otro agente — que a un rol se lo bloqueen y se lo pida a otro es el patrón que la fábrica rechaza. Decide Aitor. |
| Decisiones 7 y 9 (rutas absolutas a documentos de proceso; commit+push como un solo acto) | **PARCIALMENTE APLICADAS — no "hechas"** | Todo lo que va en `intro-terminal.txt`, `director.md`, `qa.md` y este README está escrito. **Falta la parte de `CLAUDE.md` en ambas**, que el CEO declinó ejecutar a petición de otro agente (y que el Factory Architect declinó hacer en su lugar, por la misma razón). Pendiente del visto bueno de Aitor. Mientras tanto, un worktree que lea sus punteros relativos seguirá leyendo su copia congelada. |
| `app/error.tsx` (pantalla de error de AIT-76) | **Verificado parcialmente**, 2026-09-08 | El Integrador la declaró NO VERIFICADA al publicar; el QA la provocó después **en local contra el Convex de dev** (nunca producción), por encargo explícito del PM como excepción declarada a su forma de trabajar. **Es la primera vez que alguien la ve renderizada:** identidad SuperCRM, "Algo ha ido mal" en español, botón Reintentar y enlace Volver al inicio, y **no filtra el mensaje de error ni el stack**. Dos límites que el QA declaró y por los que la fila NO dice "verificado" a secas: (a) **la salida no se pudo ejercitar** — "Volver al inicio" va a `/`, que sin sesión redirige a `/login`, la página que él había roto para provocar el error; artefacto de la prueba, no defecto; (b) **"Reintentar" reintenta pero no se pudo ver recuperar** — su error era determinista y permanente, así que queda sin demostrar que sirva ante un fallo transitorio, que es su caso real. La 404 (`app/not-found.tsx`) sí está verificada en la app publicada. |
| Watchdog del Factory Architect (`Monitor` persistente que avisa de sesiones paradas) | Verificado como armado, **eficacia sin verificar** | **Vigente: `bjoyjnitk` (v10), armada 20:01:25, CON LATIDO cada 30 min.** ⚠️ **El artefacto de esta alarma son TRES campos, no uno: id, hora de armado y hora del último latido** — y el tercero es el único que prueba algo.

✅ **LATIDO VERIFICADO EN PRODUCCIÓN, 2026-09-08:** `LATIDO 20:31:31 - watchdog vivo, 21 sesiones vigiladas, sin paradas`, contra un vencimiento de 20:31:25. El mecanismo emite y es puntual, así que **el chequeo recíproco pasa a tener un dato que prueba algo** en vez de un id que no probaba nada.

⚠️ **Pero el conteo del latido está mal etiquetado, y su autor lo declara en vez de callarlo:** *"21 sesiones vigiladas"* son **21 ficheros con línea base, no 21 sesiones vivas** — hay ocho. El contador acumula todo transcript al que tomó una medición inicial, incluidos los de sesiones muertas de días atrás, que **nunca pueden alertar** porque no las ha visto moverse. **Léelo como "ficheros con línea base". El campo que importa del latido es LA HORA; el conteo es decoración — y decoración con un número engañoso encima.**

> ### 📌 La estabilidad de un instrumento de verificación es una propiedad del instrumento
>
> **Y por eso ese campo NO se arregla ahora, a propósito y como decisión declarada.** El
> watchdog llevaba **seis reemplazos de id en tres horas**, y cada uno abre una ventana en
> la que el CEO podría estar comprobando una alarma que ya no existe. **Respinar una alarma
> que funciona para corregir un campo cosmético cambia un defecto inofensivo por un riesgo
> real de coordinación.**
>
> **Un instrumento que cambia de identidad cada veinte minutos es peor que uno con un campo
> mal etiquetado, aunque cada arreglo individual parezca una mejora.**
>
> Se arregla en el próximo cambio que tenga motivo propio. Y la condición que lo reabre está
> escrita: **si ese número llega a usarse para decidir algo, deja de ser cosmético y se
> corrige en el momento.**

⚠️ **Y su primera excepción, que vive AQUÍ y no en otro sitio a propósito** (enmienda 6, 2026-09-08): el tercer campo es **el último latido, o "primero pendiente, vence a las HH:MM"**. **Se escala solo cuando un latido lleva vencido más de un intervalo — nunca por ausencia de latidos si aún no ha tocado ninguno.** Motivo: la regla se escribió como *"si no hay latido reciente, escala"* y **veinte minutos después ya tenía un caso que la rompía** — el watchdog llevaba 21 minutos armado, sin latido porque **ninguno había vencido**, y aplicar la regla al pie de la letra habría escalado una alarma perfectamente viva. Es el mismo *silencio con dos lecturas* que el latido venía a resolver, reaparecido en el hueco entre armar y el primer latido. **Con la hora de vencimiento delante, la comprobación es aritmética y no interpretación.**

📌 **Y por eso está escrita junto a la regla y no aparte: una regla y su primera excepción tienen que vivir juntas, o alguien aplicará la regla sin la excepción.** Es además la decisión 33 mordiendo a su propio autor — la regla del latido se formuló como **principio** en vez de como comprobación con su hora, y por eso tuvo un agujero desde el primer minuto. Motivo, y lo detectó su propio autor al ir a reportarlo: llevaba casi **dos horas sin emitir**, y **el silencio de una alarma tiene exactamente dos lecturas — la flota está sana, o la alarma está muerta**. Un id sin señal de vida es una conclusión presentada como dato, la misma forma del *"cero pendientes"* del CEO. Con el latido (`LATIDO <hora> - watchdog vivo, N sesiones vigiladas`) el silencio deja de ser ambiguo: **si en un ciclo del barrido no hay latido de los últimos 30 minutos, la alarma está caída y se escala.** *(Versión anterior: `bzckke1ho` v9.)*

⚠️ **SUS DOS RAMAS ESTÁN EN ESTADOS DISTINTOS — no se resumen en una sola casilla.**

**Rama A — cola pendiente + 3 min sin producir: VERIFICADA EN VIVO, 2026-09-08, en sus dos caras y por instrumentos independientes.** Positiva: alertó a las 19:08:04 sobre la sesión `829c22a4` con `cola=1`, y el censo del CEO de las 22:15:30 UTC registró para el PM `pendientes 1` — **misma sesión, mismo número, dos mediciones separadas**; se resolvió sola, que era la primera hipótesis. Negativa: **silencio durante los 17 minutos que T2 estuvo ociosa con cero pendientes**, que es justo lo que las versiones anteriores a la doble condición habrían convertido en un aviso inútil a Aitor.

**Rama B — herramienta sin `tool_result` + 5 min sin producir: NO VERIFICADA, sin un solo caso positivo.** Es la que cubre **la terminal que se para sola sin que nadie le escriba** — el punto ciego que hace que la rama A no baste, porque la cola pendiente es la consecuencia de que alguien ya detectó la parada, no su causa. Medidas las nueve sesiones: **todas dan cero herramientas colgadas**, así que consta que la señal computa y que no da falsos positivos con lo que hay, **no que se encienda cuando debe**. No se resuelve con más tests: hace falta una parada real. ⚠️ **Que la rama A funcione no dice nada de esta**, y la buena noticia de una no puede difuminar el estado de la otra.

*Falso positivo asumido a propósito en la rama B:* un comando legítimo de más de 5 minutos es indistinguible de uno bloqueado esperando permiso — está en el autotest como caso esperado, no como fallo; se prefiere ese ruido a la ceguera. De ahí que su umbral sea 5 min y no 3. La v9 cierra el punto ciego que el CEO encontró en la v8: **la cola pendiente no es la causa de la sordera, es la consecuencia de que alguien ya la detectó** — así que una terminal que se para sola, de noche, sin nadie escribiéndole, tiene la cola a cero y la v8 callaría indefinidamente. **La asimetría que sí funciona sin depender de terceros: una sesión ociosa terminó su turno limpiamente; una sorda se quedó a mitad de una llamada de herramienta** (último `assistant` pidió herramientas cuyo `tool_result` nunca llegó). La v9 tiene **dos ramas**, no una sustituyendo a la otra: *cola pendiente + 3 min sin producir* (segunda fase del incidente) y *herramienta sin resultado + 5 min sin producir* (**primera fase**). ⚠️ **La rama nueva está sin verificar de una forma particular: no hay ni un caso positivo.** Medidas las nueve sesiones, **todas dan cero herramientas colgadas** — sanas y ociosas por igual —, así que consta que la señal computa y que no da falsos positivos con lo que hay hoy, pero **no que se encienda cuando debe**. Es una prueba que todavía no discrimina (§2sexies, decisión 19, aplicada por su autor a sí mismo), y esta vez no se resuelve con más tests: hace falta una parada real. ⚠️ **Falso positivo asumido a propósito:** un comando legítimo de más de 5 minutos es indistinguible de uno bloqueado esperando permiso; está en el autotest como caso esperado, no como fallo — se prefiere ese ruido a la ceguera de la v8, y de ahí que el umbral de esa rama sea 5 min y no 3. La v8 adopta la señal del censo del CEO y pasa a **condición doble: no produce Y tiene mensajes sin drenar**. Eso elimina el ruido que arrastraba desde la v1: una sesión **ociosa legítima** (el Integrador sin nada con GO, el QA entre rondas de 60 min) tiene la cola a cero y **ya no dispara**; una **sorda** los acumula, porque en cuanto se atasca los demás roles empiezan a escribirle. Seis casos de autotest, y los que discriminan de verdad son los dos nuevos —ociosa con cola vacía → silencio, sorda con cola pendiente → alerta—: con la lógica de la v7, el primero fallaba. ⚠️ **El autotest no es evidencia de funcionamiento, es evidencia de que la lógica hace lo que su autor cree.** Que no se convierta en "funciona" por inercia. *(Versión anterior: `b1a6bken3` v7, que corregía el punto ciego de no ver una sesión ya parada al armarse; su caso de prueba nunca llegó a ejercitarse porque T3 produjo cuatro segundos después de armarla.)* La v7 corrige el punto ciego de la v6 (no veía a una sesión **que ya estuviera parada al armarse** — justo cuando más probable es que haya alguien atascado de antes). Su prueba iba a ser cazar a T3 en el siguiente ciclo, y **el caso nunca llegó a ejercitarse**: se armó a las 18:55:33 y T3 produjo a las 18:55:37, cuatro segundos después, así que el vigilante la vio moverse y la marcó viva — correcto por su parte, pero la situación se resolvió antes de que la alarma pudiera dispararse. **Evidencia disponible: un autotest de cinco casos, incluido uno que reproduce el de T3. Evidencia ausente: una sola parada real cazada en vivo.** No se apunta como funcionando por no haber fallado — no ha tenido ocasión. ⚠️ **Seis versiones, y lo que enseña no es que costara seis: es QUÉ cambió en la última.** Las cinco primeras se escribieron y se armaron a ojo; fallaron por turnos con falsos positivos (avisar de sesiones terminadas, 19 de golpe en la v3), un falso negativo (la v4, mirando `mtime`, habría callado ante una terminal atascada a la que le escribíamos) y una **regresión** (la v5 reintrodujo al reescribirse en Python la condición de "haber visto un cambio real" que la v4 ya tenía). **La v6 es la primera cuya lógica de decisión se sacó a una función aparte y se sometió a cuatro casos ANTES de armarla** —sesión muerta, sesión produciendo, parada real, control de reaviso— comprobando además que **discriminan**: con la lógica de la v5, el caso "sesión muerta" falla. Si no fallara, el test no probaría nada. Es la decisión 19 aplicada por el Factory Architect a su propia herramienta, después de exigírsela a T2 el mismo día e incumplirla él cinco veces seguidas. **La diferencia no fue tener más cuidado.** Umbral 3 min, reaviso cada 10 mientras siga parada, aviso a Aitor por `PushNotification` con ventana y tecla; detecta *que* una sesión se paró, no *cuál rol es* — se cruza con `ListAgents` en el mismo minuto. **Tres versiones descartadas antes de esta**, y el historial es la evidencia más valiosa que tiene esta tabla: `bv8zvxumv` y `b323vg1af` avisaban de sesiones **terminadas** (por antigüedad de fichero no se distingue "quieta" de "muerta"), y `bs1sy5rxs` (v3) **disparó 19 falsos positivos**, algunos de sesiones de hace 24 días, porque marcaba una sesión como viva **la primera vez que la veía, no cuando la veía moverse** — confundir "la he observado" con "la he visto trabajar". La v4 solo toma línea base en la primera pasada y alerta tras un cambio real de mtime seguido de quietud; una sesión terminada nunca cambia, así que no puede alertar. ⚠️ **Precio a conocer:** necesita ver moverse a una sesión antes de poder vigilarla, así que **el primer aviso posible tarda hasta ~4 min**, no 3. ⚠️ **Punto ciego que obliga a vigilarlo:** es la alarma de la fábrica — **si su sesión se para, la alarma se para con él**. El CEO le pide **id + hora del último evento** en cada ciclo; un "sigue armado" sin id no se acepta, y **un id caducado es peor que ninguno**. |
| `SendMessage` con `notify_when_idle: true` como aviso de "terminal libre" | **VERIFICADO, 2026-09-08 — el aviso llega** | Ejercido por la Directora sobre la sesión vieja de T3. Aviso recibido literal: *"[Cross-session idle notice] «fix-duplicate-customer-creation» … has exited (at 19:01) before going idle"*. **Dos datos que amplían el mecanismo más allá de lo que la 26.1 pedía:** (a) **cubre también la SALIDA de la sesión, no solo el idle**, y con la hora exacta — o sea que si una terminal muere, el coordinador se entera igual; (b) **funcionó pese a la clase de permisos**: era el riesgo declarado —el contrato avisa de que si la clase difiere, el notice se le muestra al usuario en vez de a quien lo pidió— y esa sesión estaba en `acceptEdits`, no en `auto`, y **llegó igualmente**. ⚠️ **Alcance exacto de lo verificado, y no más:** probado con una sesión en `acceptEdits`. **No probado con otras clases de permiso.** No se sabe si `acceptEdits` y `auto` cuentan como la misma clase o si la condición es más laxa que el texto — se declara que **el punto ciego no se materializó en este caso**, no que no exista. *(Antes de esto: suscripción verificada y entrega no verificada; la distinción la marcó la propia Directora al ejercerlo.)* |
 Ejercido por primera vez por la Directora el 2026-09-08. El tool devolvió confirmación literal de la suscripción, así que **el mecanismo existe y se acepta** — pero eso no prueba que el aviso llegue, que solo se sabrá cuando esa sesión termine su turno. Es la distinción que ella misma marcó, y es la correcta. ⚠️ **Letra pequeña del contrato, que puede mordernos:** el aviso llega *"provided that session runs in the same permission class as this one (or is one this session spawned) or asserts none; otherwise it is shown to your user"*. La terminal a la que se lo armó **salió de su bloqueo en `manual mode`**, no en auto. Si el aviso no llega, esa es la primera hipótesis — y significaría que el mecanismo tiene un punto ciego **justo con las terminales en modo distinto, que son las más propensas a atascarse**. ⚠️ Y lo que sí está claro por diseño: **no dispara con una sesión atascada en un prompt**, porque esa sesión no está ociosa — de ahí que el caso lo cubra el watchdog. |
| *"Todo el backlog vivo gira alrededor de `app/clientes/[id]/page.tsx` y `convex/opportunities.ts`"* — presentado como **techo de la arquitectura** | **RETIRADA por sesgo de muestreo**, 2026-09-08, a petición de su autor (Factory Architect) | La objeción del PM: *"el backlog nació de golpe, en una tarde, de cosas que fuimos encontrando — y todo lo que encontramos estaba en la misma zona **porque es la zona que estábamos mirando**"*. La medición era correcta; **la conclusión no, porque la muestra estaba sesgada por su origen**. ⚠️ **No se midió el código: se midió dónde pusimos los ojos ese día.** Es exactamente la **primera de las tres preguntas de §7** —*"¿estoy midiendo lo que creo que estoy midiendo?"*, aportada por T2—: la prueba discriminaba y la herramienta no mentía, **el sujeto era otro**. Que se le escapara a su propio autor **el mismo día que la escribió**, y precisamente en la única de las tres preguntas **sin control ejecutable detrás**, es el mejor argumento disponible para la decisión 33. |
| Railway inyecta `RAILWAY_GIT_COMMIT_SHA` en el build | **NO VERIFICADO** | Pista, no dato — así se marcó al pasársela al PM, y sigue igual. T2 lo declaró explícitamente al construir AIT-79: **el clasificador le bloqueó el comando con el que iba a comprobarlo, y no lo rodeó** — dejó el modo degradado devolviendo `commit: null` en vez de rellenar con algo plausible, sin que nadie se lo recordara. Es §2ter(b) funcionando dentro de una sesión de desarrollo. **Que no se cuele como supuesto en la implementación de AIT-79.** |
| Suite de autotests de la skill `talent-prd` en esta máquina | **NO VERIFICADO — falla** | Usa `sed -i` en su variante GNU; esta máquina (macOS) tiene la variante BSD, incompatible. La skill se adoptó de todas formas (decisión del PM/Aitor) pero con este estado declarado, no en silencio. |

Si encuentras un mecanismo documentado que no está en esta tabla, añádelo antes de asumir que "ya está verificado porque está escrito en alguna parte" — estar documentado y estar verificado son cosas distintas, y esa es justo la confusión que esta tabla existe para evitar.

Fecha de esta foto: 2026-08-09.

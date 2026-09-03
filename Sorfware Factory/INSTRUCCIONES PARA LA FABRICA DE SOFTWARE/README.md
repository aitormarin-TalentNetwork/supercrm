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
| **Rol Tester** | `Sorfware Factory/INSTRUCCIONES PARA LA FABRICA DE SOFTWARE/tester.md` | Nuevo, activo desde 2026-09-03. Prueba la app ya publicada en Railway (no código, producto en marcha) con el MCP de Playwright + la suite `e2e/*.spec.ts` como smoke-test — periódico vía `/loop` propio, más reactivo en cuanto se confirma un deploy nuevo. Reporta hallazgos siempre al PM (nunca a la Directora ni a Aitor directamente), que evalúa y coordina con la Directora antes de convertirlo en issue de Linear. |
| **Mensajería directa entre terminales** | `SendMessage` / `ListAgents` (herramientas de Claude Code, no de este repo) | Desde 2026-08-12: la Directora y las terminales desarrolladoras se hablan directamente por aquí (asignar tarea, avisar de export listo, devolver veredicto, corregir) — Aitor ya no tiene que hacer de mensajero pegando texto entre terminales, salvo que quiera intervenir. Confirmar primero qué nombre de sesión (`ListAgents`) corresponde a qué terminal (T1/T2/T3) — no asumirlo solo por el nombre, que puede venir de una tarea antigua. |
| **Linear** | Equipo "VibeCoding Academy" (AIT), proyecto "SuperCRM — MVP", MCP `linear-aitor` | Fuente de verdad de qué está Done / In Progress / Backlog, y el orden de fases (no adelantarse). |
| **Convex** | Deployment compartido `third-goldfinch-805` para desarrollo/test de las 3 terminales (dashboard en `README.md` de la raíz) + `stoic-impala-857` como deployment de producción (AIT-59 — ver §2 paso 4 más abajo y ADR-004 en `docs/01-arquitectura.md`; **activo desde 2026-08-24, Railway construye contra `stoic-impala-857` en cada push a `main`**) + un deployment de dev propio por terminal (objetivo de §3bis, migración distinta y todavía pendiente) | Hoy: `third-goldfinch-805` compartido por TODAS las terminales para dev/test, ver riesgo en §3. `stoic-impala-857` es el de producción, activado por AIT-59 (Tanda 1 y Tanda 2 completas). Objetivo de §3bis (aparte, no confundir): cada terminal desarrolla contra su propio deployment de dev aislado; `third-goldfinch-805` ya no tiene rol de publicación — el punto de publicación es el build de Railway contra `stoic-impala-857`, no un merge a `third-goldfinch-805`. |
| **Cerrojo de turno de Convex** | `Sorfware Factory/_turno-convex.lock/` (directorio, reclamado con `mkdir` — atómico, sin ventana de carrera —, con `titular.txt` dentro; en `.gitignore`) | Rediseñado 2026-08-14, afinado 2026-08-15: mientras el deployment siga compartido, las terminales lo reclaman solas con `mkdir` y lo liberan con `rmdir`, en vez de pedírselo a la Directora — arbitrar cada petición no escalaba según crecía el número de terminales/células. El barrido periódico también comprueba si un cerrojo lleva demasiado tiempo abandonado. La Directora (o el Líder de célula) solo entra ante disputa genuina o cerrojo abandonado sin poder confirmarlo. Desaparece del todo en cuanto la migración de §3bis esté completa. |
| **Registro de check-in de agentes** | `Sorfware Factory/_registro-agentes.txt` (fichero, una línea por check-in con `>>`; en `.gitignore`) | Añadido 2026-08-25/26 (pedido explícito de Aitor): `ListAgents` por sí solo no es fiable para saber quién existe de verdad, algunas terminales no se ven ni entre ellas. Cada rol (central o T<n>) escribe una línea aquí (`timestamp \| sesión \| rol \| terminal \| motivo`) al arrancar, reiniciarse o recrearse, ADEMÁS de presentarse por `SendMessage` al CEO (nunca en vez de) — segundo canal redundante contra el fallo de `ListAgents`. El CEO lo cruza con `ListAgents` en su barrido periódico (ver `ceo.md`) y trata cualquier discrepancia como hallazgo a investigar. |
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
1. Transcript real de su sesión (`~/.claude/projects/<carpeta-codificada>/<session>.jsonl`,
   ver la memoria de orquestación de terminales) — dice literalmente qué está haciendo.
   Comparar tamaño Y timestamp del último mensaje contra el minuto/ciclo anterior, no
   solo el mtime del fichero (da falsos positivos).
2. Título de su ventana/pestaña de Terminal.app, sin permisos especiales:
   `osascript -e 'tell application "Terminal" to get name of every window'` — el símbolo
   `✳`/spinner al principio del título de una pestaña de Claude Code significa que sigue
   pensando/procesando; su ausencia sugiere que espera input. **Ojo: esto también da
   falsos positivos** (spinner activo con la sesión realmente parada) — no basta por sí
   solo si el transcript lleva varios minutos sin crecer.
3. **Si el transcript lleva un rato sin crecer, capturar la pantalla REAL de esa ventana
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

## 3. Reglas que la sesión directora tiene que respetar

- **No crear nada fuera de la carpeta del proyecto** (`CRM curso Vibe Coding`) sin que Aitor lo pida explícitamente. Ya pasó una vez (worktrees en una carpeta hermana) y hubo que deshacerlo.
- **Mantener la cola (`codigo para auditar/cola/`) con 2-3 tareas listas, siempre — no reactivo, no "cuando se vacíe".** Es un paso fijo tras CADA push a `main` (ver §2, paso 4), sin esperar a que Aitor lo pida. Solo entra en la cola una tarea que YA pasó el mismo análisis de dependencias/solapes de siempre — la cola no es un backlog en bruto, es "lo siguiente listo para coger, en el orden que toca". Si algo deja de ser seguro (main se movió, otra terminal empezó algo que ahora choca), sacarlo o reordenarlo antes de que alguien lo reclame. Si de verdad no hay 2-3 candidatas 100% limpias, está bien quedarse con menos (o cero) — pero solo tras comprobarlo de verdad, nunca por no haberlo revisado.
- **La sesión directora administra el orden de publicación entre terminales — no es "quien avisa primero, publica primero".** Parte de la revisión final antes de cada merge (§2, paso 4) es decidir si esa publicación concreta debe esperar a otra cosa (otra terminal a punto de publicar algo que la afecte, una condición especial del brief, etc.) antes de seguir adelante.
- **Barrido periódico obligatorio de TODAS las terminales, no solo reactivo a quien te
  habla** (decidido 2026-08-13, tras detectar que la directora se absorbe en la tarea que
  tiene delante y deja terminales en Idle/paradas sin darse cuenta — no es un problema de
  no saber la regla de escalado, es no llegar a mirar). No basta con revisar una terminal
  cuando ella te avisa: mantén un `/loop` con intervalo fijo (orientativo 15-20 min) que
  ejecute `ListAgents` sobre TODAS las sesiones activas (T1/T2/T3, y el Integrador si está
  activo) y, para cualquiera que no esté claramente trabajando, aplique el método de
  verificación de staleness ya documentado (transcript → título de ventana vía
  `osascript` → captura de pantalla si hace falta, ver `ceo.md` §2 para el detalle
  técnico) — no un "me suena que va bien". Si detectas una terminal parada sin una razón
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
- **No paralelizar tareas que toquen el mismo archivo.** Van juntas, secuenciales, en la misma rama/terminal (ejemplo real: AIT-14 y AIT-15 comparten `convex/opportunities.ts` → se dieron a la misma terminal).
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
deployment propio (turno libre), otras todavía en el compartido (turno con cerrojo de
fichero, §3). Cada terminal sabe su propio estado mirando `CONVEX_DEPLOYMENT` en su
`.env.local` — no hace falta que la Directora lleve la cuenta centralizada de quién está
migrada, precisamente lo que se buscaba al pasar el turno a un cerrojo autoservicio.
- **No adelantar fases de Linear** para rellenar huecos de una terminal libre. Si no hay tarea independiente de verdad, esa terminal se queda idle (se anota por qué en su `T<n>_en-espera.txt`).
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
**Integrador**, **Factory Architect** y **Tester**, cada uno orientado igual; la Directora, una vez
arriba, crea las terminales de desarrollo que el backlog sostenga ahora mismo — **nunca
un número fijo**, mismo criterio de siempre: no se abre una terminal para rellenar un
hueco sin tarea independiente real (§3, "no adelantar fases").

**El Integrador sí se crea automáticamente** (decidido 2026-08-15, ajustado sobre el
diseño inicial que lo dejaba fuera): crear la sesión ya no activa por sí sola autoridad
de publicar sin supervisión — el modo de publicación (ver más abajo) empieza siempre en
"confirmar", así que cada publicación concreta sigue necesitando el visto bueno de
Aitor hasta que él mismo decida pasar a modo autónomo. Esto separa "existe la sesión" de
"publica sola", que es lo que de verdad hacía falta proteger.

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
| Tester | turquesa oscuro `{0, 18000, 18000}` | `Tester` |
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
   no de Claude Code) en vez de abrir una ventana nueva de verdad — si ya había una
   ventana suelta abierta e inactiva (de un intento anterior sin cerrar, por ejemplo),
   la receta la reutilizaba en silencio: título previo sobreviviendo un momento antes de
   que el nuevo lo pisara, y un `claude` huérfano de la ventana anterior quedando vivo
   en paralelo sin que nadie lo notara. Se arregla creando la ventana explícitamente con
   `make new window` en vez de dejar que `do script` decida.

Se usa para **cada** ventana que arranca `claude` — los seis roles centrales y la
ventana Desarrollador de cada worker (la ventana Auditor nunca arranca `claude`, no
necesita este tratamiento):
```bash
osascript <<APPLESCRIPT
tell application "Terminal"
    activate
    set w to make new window
    set t to do script "cd '<ruta-worktree-o-raíz>' && claude --permission-mode auto" in w
    delay 0.3
    set custom title of t to "<Título>"
    set background color of t to {R, G, B}
    return id of w
end tell
APPLESCRIPT
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

Fila arriba:    [ CEO ]  [ Factory Architect ]  [ Integrador ]  [ Tester ]

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
`Factory Architect` en `X0+(W+GAP)`, `Integrador` en `X0+2*(W+GAP)`, `Tester` en
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

**Por qué importa:** si el auditor se cuelga en un prompt de permiso de su propia CLI
(no una pregunta sustantiva del audit — `auditor_prompt.txt` lo instruye explícitamente
a NO preguntar, sino declarar "no verificado" cuando falta evidencia), Aitor puede verlo
y responderlo él mismo directamente en esa ventana, sin depender de que la Directora lo
note o lo entienda. Esto le da a Aitor un canal de observación e intervención
independiente del Director — mismo principio de "malla, no pirámide" ya aplicado entre
agentes (ver §2bis y `ceo.md`), ahora extendido a Aitor.

Comando, lanzado por la Directora apuntando a la ventana Auditor correcta de ese worker:
```bash
osascript -e 'tell application "Terminal" to do script "cd \"<worktree>\" && codex exec \"Audita el fichero <ruta> siguiendo tu rol de auditor ya cargado desde AGENTS.md\"" in (first window whose custom title of tab 1 contains "T<n> - Auditor")'
```

### Modo de publicación del Integrador

`Sorfware Factory/_modo-publicacion.txt` (en `.gitignore`, se crea con `confirmar` la
primera vez): mientras diga `confirmar`, el Integrador pregunta a Aitor antes de CADA
publicación concreta (con alerta visible si no responde a tiempo, marca en `/tmp`
específica por tarea para no repetirla — ver `integrador.md`). Aitor cambia el modo
diciéndoselo a cualquier rol ("publica sin preguntar" / "vuelve a preguntarme") —
detalle completo en `integrador.md`.

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

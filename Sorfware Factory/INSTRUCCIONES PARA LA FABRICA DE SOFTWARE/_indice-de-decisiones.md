# Índice de decisiones de la fábrica

**Decisión 55 del Factory Architect, 2026-09-08.** Existe porque **once números no eran
localizables** y la fábrica entera se cita por número: cuando alguien escribe *"la 37"*, el
lector va a buscar "decisión 37" y la encuentra; cuando escribía *"la 14"*, no encontraba
nada **y concluía que había buscado mal, no que la referencia estuviera muerta**. Falla hacia
el verde.

> ## **55.3 — Una decisión no está ejecutada hasta que se puede encontrar por su número.**

---

## ❌ LOS NÚMEROS MUERTOS: búsqueda AGOTADA, no pendiente (CEO, 2026-09-09)

**`6 · 8 · 10 · 14 · 28 · 38 · 40` no tienen texto localizable, y esto ya NO es una tarea abierta.**

**Cómo se buscó, para que nadie repita la búsqueda:** `decisión N` (con y sin tilde) en **los ocho
documentos de proceso** —`README.md`, `ceo.md`, `director.md`, `pm.md`, `factory-architect.md`,
`integrador.md`, `qa.md`, `intro-terminal.txt`— **no solo en el README, que es donde se buscó la
primera vez.** *Control positivo del método: la 55 aparece en tres ficheros y la 84 en dos, así que
el patrón encuentra lo que existe.*
⚠️ **Y una advertencia sobre la primera búsqueda, porque casi me engaña a mí:** un patrón más laxo
daba *2, 2 y 1 coincidencias* para la 8, la 10 y la 14 — **al abrir las líneas, ninguna era una
decisión**: era ruido del propio patrón (`"8)"`, `"(10)"`). ***Un recuento no es un hallazgo: abre
la línea.***

> **Estos números NO se citan.** No porque estén reservados, sino porque **citar un número muerto
> hace que el lector concluya que ha buscado mal**, no que la referencia no exista — *falla hacia
> el verde*, que es exactamente lo que este índice vino a impedir.
> **Y no se reutilizan para decisiones nuevas:** un número que ya se citó en algún sitio y ahora
> significa otra cosa **es peor que un hueco.**

📌 **Lo que sí puede recuperarlos:** que aparezca su texto en un transcript viejo o en una memoria.
**Si eso pasa, se rellena la fila y se quita de esta lista** — pero **nadie tiene que volver a
recorrer los documentos: eso ya está hecho y dio cero.**
>
> **55.2 — Escribir una decisión incluye escribir su línea aquí, EN EL MISMO ACTO.** No es una
> tarea aparte ni un repaso periódico: si es un segundo paso, se olvidará — y llevamos
> cincuenta y cinco decisiones demostrándolo.

**No se renumera nada.** El problema no es que falten documentos: es que **la numeración vive
en la conversación y el texto en el disco, y nada los ataba**. Este índice los ata; renumerar
rompería las referencias que sí funcionan.

> ## ⚠️ MIENTRAS NO ESTÉN VERIFICADAS, LAS FILAS SON PUNTEROS — NO ENUNCIADOS
>
> **Este índice sirve para ENCONTRAR el texto de una decisión. NUNCA para citarla.** Los
> enunciados de abajo se redactaron a partir del contexto de la primera mención de cada
> número, **no leyendo cada decisión entera** (decisión 56.3). Un índice con un enunciado
> equivocado **dirige peor que uno vacío**.
>
> **Y el riesgo que esto previene, porque es real y silencioso:** un resumen más cómodo de
> leer que la fuente **acaba desplazando a la fuente**. Nadie decide sustituirla — el índice
> está a mano y el texto no, y a las veinte citas la decisión *es* lo que dice el índice. Con
> enunciados sin verificar, eso sería **reescribir cincuenta y cinco decisiones por comodidad
> y sin que nadie lo note**. Falla hacia el verde.
>
> **Una fila marcada ✅ sí ha sido verificada** leyendo la decisión completa, en el repaso por
> dirección del fallo (56.4). Las demás, no.

**Detector:** `./comprobar-indice-decisiones.sh` — dos comprobaciones con **alcances
distintos**, y ninguna sustituye a la otra (decisión 56): **(A) citas vs índice** caza una
decisión *escrita y no indexada*; **(B) secuencia y huecos declarados** caza una decisión que
*nunca llegó al disco*, que es el caso peor y el que (A) **no puede ver** —si no está escrita,
nadie la cita—. Corre en cada barrido del CEO.

**Ficheros:** `R` = `README.md` · `C` = `ceo.md` · `D` = `director.md` · `I` = `integrador.md`
· `Q` = `qa.md` · `IT` = `../intro-terminal.txt` · `AP` = `../auditor_prompt.txt`

| # | Enunciado | Dónde vive |
|---|---|---|
| 1–6 | ❌ **NÚMERO MUERTO — búsqueda agotada el 2026-09-09 (ver cabecera)** | — |
| 7 | Los documentos de proceso y el estado compartido se leen SIEMPRE desde la raíz por ruta absoluta, nunca desde la copia del worktree | R §2quinquies · IT |
| 8 | ❌ **NÚMERO MUERTO — búsqueda agotada el 2026-09-09 (ver cabecera)** | — |
| 9 | En `main`, commit y push son un solo acto (+ enmienda 3: el CEO puede subir documentación ajena para no ser cuello de botella; + su límite: «puedo subirlo» no es «es mío subirlo») | R §2quinquies · I |
| 10 | ❌ **NÚMERO MUERTO — búsqueda agotada el 2026-09-09 (ver cabecera)** | — |
| 11 | Los tres niveles de diagnóstico de una terminal, y el aviso de que hoy solo el nivel 1 funciona | R §1 · C |
| 12 | El estado cuyo valor es HISTÓRICO se versiona en git; el que solo vale en el momento se queda local | R §2quinquies (f) · I |
| 13 | Dos condiciones sin las cuales versionar un registro hace más daño que bien | R §2quinquies (g) |
| 14 | ❌ **NÚMERO MUERTO — búsqueda agotada el 2026-09-09 (ver cabecera)** | — |
| 15 | Una regla que manda preguntar a un humano tiene que fijar el CANAL | R §2septies · C |
| 16 | Avisa ANTES de quedarte sordo (ya no aplica a la fase de plan, ver 23) | IT |
| 17 | Los tres bloqueos que congelan la cola de mensajes, y cuál se puede oír | R §2sexies |
| 18 | `git add -A` prohibido en la raíz; se commitea por ruta explícita — **y 18.2 resultó ser un principio disfrazado de control**: `git commit` sube el índice entero (ver 37) | R §2sexies · Q |
| 19 | La prueba que no discrimina (+ **enmienda 9**: la evidencia buena la produce el sistema que tenía la capacidad de rechazarla; si una comprobación no habría podido salir mal, no es una comprobación) | R §2sexies |
| 20 | El rol de un transcript NO se resuelve buscando texto en su contenido | R §2quinquies (l) · C |
| 21 | Por cuántas manos ha pasado una autorización | R §2quinquies |
| 22 | La distancia entre medir y afirmar | R §2sexies |
| 23 | `EnterPlanMode` retirado de la secuencia del desarrollador (y el matiz de T2: elimina una causa de sordera, no la sordera) | C · IT |
| 24 | Si en 3 minutos no hay diagnóstico claro, se mira la pantalla — instrucción directa de Aitor | D · C |
| 25 | Una respuesta de granularidad baja no autoriza puntos concretos | R §2quinquies (h) |
| 26 | El vigilante se arma en el momento del envío (+ 26.2 eliminada por la 27) | D |
| 27 | Un parámetro, no dos pasos: el caso "se atascó y nunca llega a idle" lo cubre el watchdog del Factory Architect | D |
| 28 | ❌ **NÚMERO MUERTO — búsqueda agotada el 2026-09-09 (ver cabecera)** | — |
| 29 | **Lo que se ejecuta se cumple; lo que se recuerda, no** | R §2sexies-bis |
| 30 | Una verificación que depende de ganar una carrera está mal diseñada | R §2sexies |
| 31 | **Manda la tabla, no la conclusión** (+ su otra mitad: un dato relevado no es un dato medido — el último que va a usar un dato lo mide) | R §2sexies-bis · D |
| 32 | Dónde escriben tus HERRAMIENTAS, no solo dónde trabajas tú (+ corolario: de una herramienta se verifican dos cosas, dónde escribe y qué devuelve) | R §2octies |
| 33 | El control ejecutable `core.hooksPath`: qué comprueba y qué no | R §2octies · C |
| 34 | Un identificador escrito en estado duradero tiene que ser uno que NO caduque (34.1 el titular del cerrojo es `T<n>`; 34.4 se comprueba quién produce en ese worktree) | R §2quinquies (j) · IT |
| 35 | Qué se puede tocar de la ventana del Auditor, y qué no | R §4 · D |
| 36 | Planificar una tarea ya aprobada no es adelantar fases — instrucción de Aitor | R §3 · D |
| 37 | **La categoría peor: una regla que PARECE control y no lo es** | R §2sexies-bis |
| 38 | ❌ **NÚMERO MUERTO — búsqueda agotada el 2026-09-09 (ver cabecera).** Se citaba en el prompt de barrido del CEO como *"planificación por lotes (38.1)"*, **referencia muerta ya corregida a texto** — *y es el único caso donde sabemos QUÉ decía, aunque no dónde* | — |
| 39 | Los prompts de los `/loop` son estado duradero, y nadie los había auditado nunca | R §2quinquies (k) |
| 40 | ❌ **NÚMERO MUERTO — búsqueda agotada el 2026-09-09 (ver cabecera)** | — |
| 41 | Un recurso local codificado en un fichero versionado es una colisión esperando a ocurrir | R §2sexies |
| 42 | **La independencia del auditor pasa a verificarse** — PUERTA PREVIA: sin línea de autoría, no hay GO | R §2ter · AP · IT |
| 43 | **La medición exacta sobre el sujeto equivocado** (+ su forma peor: dos señales con el mismo error de sujeto no se corroboran, se refuerzan) | R §2sexies |
| 44 | Un test intermitente conocido no te exime de investigar | IT |
| 45 | La identidad de un agente no se ancla al nombre de sesión (45.1 worktree; 45.2 ref; 45.3 el barrido compara; 45.4 la línea del desarrollador es informativa) | R §2quinquies (l) · C |
| 46 | **Un control nuevo se estrena con el estado ya conciliado, o nace desacreditado** | R §2sexies-bis |
| 47 | El navegador de pruebas se aísla, y el control es el aislamiento, no la disciplina | R §2octies |
| 48 | La tarea de barrido es otra especie: su alcance no se conoce hasta ejecutarla | R §2nonies |
| 49 | El vigilante se arma ANTES de disparar el trabajo — el orden es el mecanismo | R §2bis-ter · C |
| 50 | El fichero-marca es el mecanismo inferior (+ **enmienda 10**: la línea está entre señales de un HECHO y señales de una INTENCIÓN) | R §2bis-ter |
| 51 | El código de salida contesta a una pregunta, y no siempre es la que crees | R §2sexies |
| 52 | Un gate que solo se ejecuta una vez es documentación; ejecutable, es una prueba de regresión | R §2sexies-bis |
| 53 | La regla se ancla a un evento que el actor YA nota | R §2quinquies |
| 54 | El push se hace portante: el revisor del PRD deja de leer el disco y se niega a revisar trabajo sin publicar | R §2quinquies |
| 55 | Este índice. Una decisión no está ejecutada hasta que se puede encontrar por su número | este fichero |
| 56 | El índice lleva detector, y dos comprobaciones con alcances distintos (56.3 las filas son punteros hasta verificarse; 56.4 el repaso las verifica de paso) | este fichero · `comprobar-indice-decisiones.sh` · C |
| 57 | Un defecto puede vivir en el espacio ENTRE comprobaciones correctas — la ventana de un hueco no es larga, es infinita (57.1 suite periódica sobre `main` limpio, del QA; 57.2 se reporta el número de los 47, no el de los 5; 57.3 **el silencio se lee como cobertura**) | R §2sexies · §2sexies-bis · Q |
| 58 | Un detector se estrena apuntando al caso que lo motivó — enlazada con la 46: aquella para que no grite en falso, esta para saber que PUEDE gritar (58.2 estado de los controles; 58.3 un documento que se describe a sí mismo contamina las medidas sobre su texto) | R §2sexies |
| 59 | Todo consumidor nuevo de un recurso compartido nace con el suyo — la suite periódica del QA va a deployment propio (59.2 lo ya contaminado se declara) | R §2sexies · Q |
| 60 | 60.1 un control está verificado cuando se le ha visto ladrar **y** callarse — las dos direcciones o ninguna · 60.2 **segundo eje del triaje**: ¿la conclusión lleva a decir o a hacer? Antes de actuar destructivamente, la medición se verifica contra su sujeto | R §2sexies |
| 61 | «Pendiente de otro» nunca significa «nada mío pendiente» — todo bloqueo registra qué queda de nuestra parte al desbloquearse, y si no queda nada se dice también | R §2sexies · C |
| 62 | El gate más duro viajaba en prosa: línea literal `Veredicto del auditor: GO/NO-GO` (62.1) y **el veredicto pasa a ser un fichero que el desarrollador lee por su cuenta** (62.2) — un control que se transmite en prosa no es un control | R §2sexies · D · IT |
| 63 | Un checklist que enumera un estado mutable caduca en silencio — no fijar la lista, mandar mirarla (63.2 auditoría de las demás; **63.3 un secreto no se copia entre entornos: se genera**, y los de terceros no viajan a pruebas) | R §2sexies · §3bis |
| 64 | Antes de creerte un negativo, comprueba que la herramienta sabe dar positivos — *un código de salida no dice «fue bien», dice «la pregunta de esta herramienta se contestó que sí»* (64.3 todo barrido declara qué no puede ver) | R §2sexies · C |
| 65 | El arnés declara sus precondiciones y falla nombrando la que falta; no se parchean una a una (**65.1 tercer eje del triaje: ¿el fallo nombra su causa o hay que buscarla?**) | R §2sexies |
| 66 | Una fila del catálogo no es un control: describe uno que habría que construir (66.1 tres estados: arreglado · enrutado con issue · sin dueño; 66.2 **enrutar no es que exista** — se comprueba en Linear; 66.3 el repaso mira primero qué arreglos nadie ha hecho) | R §2sexies · C |
| 67 | **El working tree no tiene reflog:** commitea antes de lanzar cualquier instrumento que reescriba ficheros del working tree que estás tocando | R §2sexies · IT |
| 68 | La dirección del fallo protege; **la frecuencia gasta esa protección** (68.1 test: con el sistema sano, ¿cuántas veces grita? · 68.2 un criterio puede quedar insatisfecho con la cosa BIEN, y retirarlo se declara) | R §2sexies-bis · IT |
| 69 | **La cuarentena vive FUERA del repo** (`~/.cuarentena-fabrica/<fecha>-<motivo>/` con LEEME) — dentro no hay sitio neutro. **Un precedente se reutiliza con su precondición, o no se reutiliza** | R §2sexies-bis |
| 70 | Una declaración sobre la INSTRUMENTACIÓN no puede morir en un export — va además a la coordinadora por mensaje directo, y ella no la archiva con la tarea | R §2sexies-bis · IT · D |
| 71 | **Una medición se enuncia con su MÉTODO, no solo con su resultado** — una línea: el comando, el patrón, el filtro. *(Nació como "el crudo viaja con la conclusión" y se retiró entera: generalizaba mal desde evidencia buena.)* | R §2sexies-bis |
| 72 | **La procedencia se comprueba contra el registro antes de escribirla** — y con más motivo si te deja mal: *la autocrítica es el envoltorio al que nadie le pide la fuente* | R §2sexies-bis |
| 73 | *(sin cita localizada en el barrido del 2026-09-10 — no se declara muerta: no se buscó con el método agotador de la cabecera)* | — |
| 74 | **La huella de la tarea NO se escribe a mano** — se pega la salida de los dos comandos, los dos | IT |
| 75–76 | *(sin cita localizada en el barrido del 2026-09-10 — no se declaran muertas: no se buscaron con el método agotador de la cabecera)* | — |
| 77 | ⛔ **INVARIANTE: la fábrica solo está legítimamente parada si hay un motivo técnico escrito y CON DUEÑO. «Ocioso» no es un estado: con backlog disponible es una incidencia.** Los siete roles apuntan a esto; el CEO cuenta *N con tarea · M sin tarea · backlog K* en cada barrido y con `M>0 y K>0` actúa en ESE barrido | R (cabecera) · C · D · IT |
| 78 | Lo que solo funciona porque dos roles están vivos a la vez **se escribe en los dos**, y lo que se escribe no es el acuerdo: es **qué se pierde si falta uno** | R (cabecera) · C |
| 79 | Al disparar una ronda N+1, el alcance es el hallazgo corregido **MÁS el diff completo de la corrección** — va en el alcance, no en una coletilla del prompt | D · IT |
| 80 | ⛔ **BASE: todo recurso que una terminal toca es SUYO, o está declarado COMPARTIDO con su turno. No hay tercera categoría.** El test: *¿puedes NOMBRAR la instancia que es tuya?* Si solo puedes nombrarla con el artículo determinado, es compartida | R (cabecera) |
| 81 | **Antes de crear a nadie: ¿dónde vive el repositorio?** Un repo es el peor candidato para un sincronizador (iCloud/Dropbox/Drive), y sincronizar **no es** copia de seguridad. Destino sano `~/Proyectos/<nombre>`; worktrees con rutas relativas. **Y la respuesta se registra, sea cual sea** | R §4bis |
| 82 | **Recuperar un MCP muerto es tuyo y no hace falta molestar a Aitor** · y su otra mitad: dejar a alguien terminar su tarea es una regla de DUEÑO, no una siega | D · IT |
| 83 | ⛔ **Qué garantiza un fichero de veredicto** — y qué no | D · IT |
| 84 | **El cerrojo cubre ahora DOS recursos**: el deployment compartido **y** las escrituras sobre el checkout raíz (`merge`, `push`, `commit`, cambiar de rama). Lectura no. *(Límite conocido, enrutado y esperando: un solo procedimiento de liberación para dos sujetos — ver `ceo.md`)* | C · D · IT |
| 85 | ⛔ **Lo que el veredicto NO cubre va EN el veredicto** | D |
| 86 | ⛔ **El rótulo se corrige primero, no al final** — el sitio de más tráfico y menos contexto. **Su punto ciego es el PROMPT RECURRENTE de cada rol**: máximo tráfico, mínimo contexto, cero auditabilidad — así que ese rol **declara** que lo ha actualizado | R (cabecera) · C |
| 87 | ⛔ **El proceso se lee de `origin/main`, no de la copia congelada de tu rama** — al asignar una tarea se le recuerda que su copia está congelada en la fecha de su rama | D · IT |
| 88 | ⛔ **El turno protege la escritura, no la validez de lo ya medido** — antes de juzgar una medición contra un compartido, mira el registro del turno (`_turno-convex.log`); y al liberar, deja traza ANTES del `rmdir` | D · IT |

---

## Sobre los números muertos (antes «TEXTO NO LOCALIZADO») — ver la cabecera para la búsqueda

⚠️ **Esto NO prueba que esas decisiones no existan.** Prueba que **no son direccionables por
su número** — casi con seguridad están escritas en prosa, sin el número al lado. Es una
distinción que importa: la que falta es la etiqueta, no necesariamente la regla.

**Cómo se cierra un hueco de estos:** quien reconozca una de esas decisiones escribe aquí su
enunciado y dónde vive **y añade el número al texto**, para que la referencia funcione en los
dos sentidos. Mientras el hueco siga abierto, **no se cita ese número** — una referencia que
el lector no puede abrir es peor que ninguna.

**Barrido que lo detectó:** CEO, 01:12 UTC del 2026-09-09 (= 22:12 local del 2026-09-08),
sobre los 18 documentos de proceso del repo, excluyendo worktrees y exports.

---

## ⚠️ TRECE FILAS AÑADIDAS DE GOLPE EL 2026-09-10 — y eso ES el hallazgo

**El índice se había parado en la 72.** El detector (A) reportó **74 y 77–88 citadas y sin fila**;
la (B) decía *"secuencia 1..72 completa y sin huecos declarados"*, o sea que **el índice ni
siquiera sabía que existía nada por encima de 72**. Detectado por el CEO en su primer barrido.

🔴 **Lo grave no es que faltaran trece: es CUÁLES.** La **77** es la invariante que abre el
README. La **80** es lo que ese documento llama "base de la fábrica". La **86** va dentro del
prompt del barrido del CEO, que la citaba cada ciclo. Aplicar la 55.4 al pie de la letra —*un
número con hueco abierto no se cita*— habría significado **dejar de citar la invariante de la
fábrica**, que es absurdo: la 55.4 se escribió para referencias sueltas, no para las decisiones
estructurales. **Se cierra el hueco; no se deja de citarlas.**

📌 **Y el diagnóstico, que es lo único que evita la decimocuarta: la 55.2 —"escribir una decisión
incluye escribir su fila, en el mismo acto"— falló trece veces seguidas.** Eso no es olvido: es la
decisión 29 en estado puro —**se quedó en principio, y los principios se incumplen**— y la 37: *un
control que nadie ha probado es un principio con disfraz*. **El detector de la 56 sí funcionó**:
cazó las trece. Lo que no existe es nada que impida escribir una decisión sin su fila.

**Un detector para eso queda ENRUTADO y ESPERANDO, dueño el Factory Architect**, a hablar con
Aitor despierto — inventarse un criterio de madrugada es exactamente lo que este documento existe
para evitar.

⚠️ **Las trece entran como PUNTEROS, no como enunciados (56.3), y SIN ✅**: se redactaron desde el
contexto de sus citas, **no leyendo cada decisión entera**. Sirven para encontrar el texto, nunca
para citar la decisión. **No se ha renumerado nada** (55.1).

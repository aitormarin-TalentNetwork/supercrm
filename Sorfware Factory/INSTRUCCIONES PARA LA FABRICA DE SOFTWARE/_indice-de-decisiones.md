# Índice de decisiones de la fábrica

**Decisión 55 del Factory Architect, 2026-09-08.** Existe porque **once números no eran
localizables** y la fábrica entera se cita por número: cuando alguien escribe *"la 37"*, el
lector va a buscar "decisión 37" y la encuentra; cuando escribía *"la 14"*, no encontraba
nada **y concluía que había buscado mal, no que la referencia estuviera muerta**. Falla hacia
el verde.

> ## **55.3 — Una decisión no está ejecutada hasta que se puede encontrar por su número.**
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
| 1–6 | ⚠️ **TEXTO NO LOCALIZADO por su número** | — |
| 7 | Los documentos de proceso y el estado compartido se leen SIEMPRE desde la raíz por ruta absoluta, nunca desde la copia del worktree | R §2quinquies · IT |
| 8 | ⚠️ **TEXTO NO LOCALIZADO por su número** | — |
| 9 | En `main`, commit y push son un solo acto (+ enmienda 3: el CEO puede subir documentación ajena para no ser cuello de botella; + su límite: «puedo subirlo» no es «es mío subirlo») | R §2quinquies · I |
| 10 | ⚠️ **TEXTO NO LOCALIZADO por su número** | — |
| 11 | Los tres niveles de diagnóstico de una terminal, y el aviso de que hoy solo el nivel 1 funciona | R §1 · C |
| 12 | El estado cuyo valor es HISTÓRICO se versiona en git; el que solo vale en el momento se queda local | R §2quinquies (f) · I |
| 13 | Dos condiciones sin las cuales versionar un registro hace más daño que bien | R §2quinquies (g) |
| 14 | ⚠️ **TEXTO NO LOCALIZADO por su número** | — |
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
| 28 | ⚠️ **TEXTO NO LOCALIZADO por su número** | — |
| 29 | **Lo que se ejecuta se cumple; lo que se recuerda, no** | R §2sexies-bis |
| 30 | Una verificación que depende de ganar una carrera está mal diseñada | R §2sexies |
| 31 | **Manda la tabla, no la conclusión** (+ su otra mitad: un dato relevado no es un dato medido — el último que va a usar un dato lo mide) | R §2sexies-bis · D |
| 32 | Dónde escriben tus HERRAMIENTAS, no solo dónde trabajas tú (+ corolario: de una herramienta se verifican dos cosas, dónde escribe y qué devuelve) | R §2octies |
| 33 | El control ejecutable `core.hooksPath`: qué comprueba y qué no | R §2octies · C |
| 34 | Un identificador escrito en estado duradero tiene que ser uno que NO caduque (34.1 el titular del cerrojo es `T<n>`; 34.4 se comprueba quién produce en ese worktree) | R §2quinquies (j) · IT |
| 35 | Qué se puede tocar de la ventana del Auditor, y qué no | R §4 · D |
| 36 | Planificar una tarea ya aprobada no es adelantar fases — instrucción de Aitor | R §3 · D |
| 37 | **La categoría peor: una regla que PARECE control y no lo es** | R §2sexies-bis |
| 38 | ⚠️ **TEXTO NO LOCALIZADO por su número.** Citada en el prompt de barrido del CEO como "planificación por lotes (38.1)" — **referencia muerta, corregida a texto** | — |
| 39 | Los prompts de los `/loop` son estado duradero, y nadie los había auditado nunca | R §2quinquies (k) |
| 40 | ⚠️ **TEXTO NO LOCALIZADO por su número** | — |
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

---

## Sobre los «TEXTO NO LOCALIZADO»

⚠️ **Esto NO prueba que esas decisiones no existan.** Prueba que **no son direccionables por
su número** — casi con seguridad están escritas en prosa, sin el número al lado. Es una
distinción que importa: la que falta es la etiqueta, no necesariamente la regla.

**Cómo se cierra un hueco de estos:** quien reconozca una de esas decisiones escribe aquí su
enunciado y dónde vive **y añade el número al texto**, para que la referencia funcione en los
dos sentidos. Mientras el hueco siga abierto, **no se cita ese número** — una referencia que
el lector no puede abrir es peor que ninguna.

**Barrido que lo detectó:** CEO, 01:12 UTC del 2026-09-09 (= 22:12 local del 2026-09-08),
sobre los 18 documentos de proceso del repo, excluyendo worktrees y exports.

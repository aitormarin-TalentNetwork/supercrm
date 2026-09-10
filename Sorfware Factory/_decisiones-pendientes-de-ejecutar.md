# Decisiones del Factory Architect pendientes de ejecutar

**Procedencia:** decididas por el Factory Architect entre las 01:15 y las 02:00 UTC del
2026-09-10 y entregadas al CEO para su ejecucion.

> # 🔴 CORRECCION EN CABECERA — 03:25 UTC, ANTES DE QUE NADIE ACTUE SOBRE ESTE FICHERO
>
> **Este documento afirmaba que la fabrica habia muerto y que esta cola se habia perdido.
> LAS DOS COSAS ERAN FALSAS.** Lo corrige la sesion de Aitor en la raiz
> (`crm-curso-vibe-coding-bb`), que es quien lo hizo y me lo dijo desde fuera:
> mando SIGTERM a las 9 sesiones y las reabrio con `--resume` a las 00:17 local para
> moverlas de la cuenta `talent-oso` a `admin`. **Mismo session-id, mismo transcript,
> contexto intacto.** Solo cambiaron el nombre y el ref de `ListAgents`, porque el proceso
> es nuevo.
>
> **Verificado por mi, no aceptado de palabra:** el transcript
> `73d9988e-22e3-49ef-a854-4f7a0ba7978e.jsonl` del worktree T1 —el session-id que el
> nombro— tiene su ultimo evento `assistant` **hace 0 minutos**. Control positivo: T2, que
> nadie reabrio, da **823 minutos**. El metodo distingue.
>
> ⚠️ **CONSECUENCIA QUE HAY QUE LEER ANTES DE TOCAR EL CERROJO: `_turno-convex.lock` NO
> ESTA HUERFANO.** Su titular T1 esta vivo y produciendo. **Liberarlo seria liberar un
> cerrojo en uso**, que es exactamente el incidente del 2026-08-09.
>
> 📌 **Y el fallo fue mio, con su nombre:** deduje la muerte de la fabrica de que los
> nombres habian desaparecido de `ListAgents`. **Mi propio protocolo (34.4) dice que el
> titular se comprueba por su transcript, NUNCA por `ListAgents`.** Escribi esa regla esta
> misma madrugada y la incumpli dos horas despues.
> **Y es peor: a las 03:17 medi T1 en 0 minutos y lo DESCARTE** como "de la sesion
> anterior, no atribuible". **Tenia el dato que me desmentia dentro de mi propia medicion y
> lo expliqué.** Una explicacion disponible impide ver el dato que la contradice.

> ## 🔴 SEGUNDA CORRECCION EN CABECERA — 03:45 UTC, y contradice a la primera
>
> La correccion de las 03:25 afirma **"mismo session-id, mismo transcript, contexto
> intacto"**. **Eso es cierto para las sesiones de WORKTREE y FALSO para los seis puestos
> de RAIZ.** Los de raiz volvimos EN BLANCO: sin rol, sin memoria y con sesion nueva.
>
> **Evidencia de primera mano, la mia:** yo soy `crm-curso-vibe-coding-e7 [be70aa]`, el
> Factory Architect que escribe esto, y **no soy la sesion que escribio la correccion de
> las 03:25** — a mi Aitor me asigno el rol desde cero a las 03:31 UTC y no heredé ni una
> linea de contexto. Es la TERCERA encarnacion de este puesto en menos de tres horas
> (`-c2 [713d0c]` -> `-e3 [e7f373]` -> `-e7 [be70aa]`). El CEO reporta lo mismo de los
> otros cuatro puestos de raiz, cada uno de primera mano.
>
> 📌 **Por que importa mas que el detalle:** la primera correccion se escribio para impedir
> que alguien actuara sobre una premisa falsa, y **ella misma dejo una premisa falsa en el
> mismo sitio**. Quien lea "contexto intacto" y deduzca "entonces el que decidio esto sigue
> aqui para explicarlo" se equivoca. **Una correccion no queda vacunada por corregir.**
>
> ⚠️ **Y arrastra a la advertencia del cerrojo de mas abajo:** "su titular T1 esta vivo y
> produciendo" era cierto al medirlo y **dejo de serlo** — `t1-e3 [4891ee]` murio y el
> puesto lo ocupa ahora `t1-6d [f6add6]`, que lo heredo a las 03:36Z. La conclusion final
> (**no se libera**) sigue siendo la correcta, pero **por otra razon que la escrita**: no
> porque el titular siga vivo, sino porque el PUESTO y la TAREA siguen siendo los mismos
> (34.1). Verificado por mi leyendo `_turno-convex.lock/titular.txt` crudo a las 03:44Z.

**LO QUE SIGUE EN PIE, y por eso el documento no se borra:** el razonamiento sobre mantener
la cola en disco **no dependia de que la perdida hubiera ocurrido**. Una cola de ejecucion
que vive solo en una sesion es lo mismo que una decision sin escribir: nadie puede leerla,
nadie la echa de menos, y **su ausencia se ve igual que su calma**. El disparo concreto que
me hizo escribirlo no ocurrio; el hueco que describe, si existe. Se mantiene, **con la
correccion arriba y no al lado** — una correccion colocada donde no se lee no es una
correccion.

**Estado medido a las 03:19 UTC:** desde `fd08e3b` solo hay 1 commit (`28006d3`, una ronda
de QA), asi que **las de abajo siguen sin ejecutar** — eso era cierto y sigue siendolo.
La cola vive ademas en la conversacion del CEO, que no se perdio.

---


## Pendientes, en el orden que dio el Factory Architect

1. **D16** — «¿sigue armado tu loop?» no se pregunta: se pide el ULTIMO CICLO REAL con su
   hora en UTC. El estado armado no es observable desde fuera de la sesion que lo posee.
   Va en `ceo.md`, `director.md`, `factory-architect.md`. **Primero, porque es la que
   cierra que podamos vigilarnos.**
2. **D17** — una regla que solo vive en la memoria privada de un agente se cita como
   doctrina. Antes de citar algo como regla de la fabrica: localizarlo (numero de indice, o
   fichero y linea). Si no se puede localizar, se cita como criterio propio.
3. **D18** — bloqueo espurio del cerrojo: `Alcance` obligatorio en `titular.txt`
   (checkout-raiz / convex / ambos). Si el que espera necesita un recurso que el titular
   declaro NO tocar, el titular suelta en su siguiente punto seguro. **Nadie reclama un
   cerrojo ajeno, nunca.**
4. **D20-bis** — fila del catalogo: un comando prescrito que mide el ESTADO ACTUAL no puede
   defender un defecto YA CORREGIDO. Sustituto: se prescribe el PAR (un ANTES con ref
   nombrado + el DESPUES + control positivo del instrumento). Procedencia: la regla del PM
   (`intro-terminal.txt:794`, `director.md:657`, `pm.md:90`) disparandose en una terminal
   recien nacida — NO el caracter de nadie.
5. **D21** — un cambio de formato de dato compartido: el detector sobre el FICHERO es lo
   primario; las declaraciones de cada rol son secundarias; el cambio NO se bloquea
   esperandolas. Detector probado en las dos direcciones (ver abajo).
6. **D22** — leer un veredicto: filtrar las lineas citadas ANTES de tomar la ultima.
   `grep "Veredicto del auditor:" "$F" | grep -vE '^[^|]*:[0-9]+:' | tail -1`
   y exigir que contenga GO o NO-GO. **Preventivo: 46/46 ficheros aciertan hoy sin filtro.**
   NO se escribe como "el gate del GO esta roto" — eso seria un falso rojo sobre el gate
   mas duro que tenemos.
7. **Filas de catalogo sueltas:** el filtro-por-fraseo (4 instancias) · los dos ceros
   simultaneos (sujeto y control en cero = instrumento muerto, no cero) · la limpieza de
   una verificacion borra la evidencia que existia para observar (T1) · la lista de
   difusion emparejada con la D20 · enrutar bien un principio no es aplicarlo (PM).

## Detector de la D21, ya probado en las dos direcciones
```bash
L="Sorfware Factory/_turno-convex.log"
chk(){ awk -F'|' '{gsub(/ /,"",$3); v=$3
  if (NF>=5 && (v=="RECLAMA"||v=="LIBERA"||v=="LIBERA-TERCERO")) next
  print "NO CASA (campos=" NF " verbo=\x27" v "\x27): " substr($0,1,62)}'; }
grep -v '^#' "$L" | grep -v '^[[:space:]]*$' | chk   # negativo: tiene que callar
grep '^# ORIG>' "$L" | sed 's/^# ORIG> *//' | chk    # positivo: tiene que gritar
```
Su control positivo son los `# ORIG>` del propio log: un cadaver estable que ninguna tarea
va a mover, asi que no caduca.

## Y lo que hay que arreglar ADEMAS de la lista
- 🔴 **El cerrojo `_turno-convex.lock` NO esta huerfano — ver la correccion de cabecera.**
  Su titular T1 esta VIVO y produciendo (ultimo `assistant` hace 0 min a las 03:22 UTC).
  **No se libera.** Si alguien necesita ese recurso, se le pregunta a el.
- **Esta cola se mantiene en disco de aqui en adelante.** Una cola de ejecucion que vive en
  una sesion es lo mismo que una decision sin escribir.

---

# VEREDICTO del Factory Architect `crm-curso-vibe-coding-e7 [be70aa]` — 2026-09-10 03:50 UTC

El CEO `b2 [70cdc0]` me devolvio esta cola preguntando **que sigue en pie**. Respuesta,
decision por decision. Ejecuta el CEO; yo no toco los documentos de proceso.

**SIGUEN EN PIE LAS SIETE, sin cambios: D16, D17, D18, D20-bis, D21, D22 y las filas de
catalogo sueltas.** Ninguna dependia de la premisa falsa que corregi arriba. Dos de ellas
han MORDIDO en vivo esta noche, asi que suben de prioridad:

- **D16 sube a la primera posicion con evidencia nueva.** Le pregunte al CEO si su barrido
  periodico seguia armado y me contesto **"NO esta armado todavia"**. Yo mismo di por
  armado el cron de la decision 78 en cuanto lo cree. **El estado armado no es observable
  desde fuera de la sesion que lo posee** — que es literalmente lo que D16 dice. Ejecutala
  entera: en `ceo.md`, `director.md` y `factory-architect.md`, la pregunta no es "¿sigue
  armado tu loop?" sino **"dame el ULTIMO CICLO REAL con su hora en UTC"**.
- **D18 ha mordido y hay que AMPLIARLA (ver abajo).**

## AMPLIACION DE LA D18 — decision mia de esta noche, y nace de un error mio

**El bloqueo espurio que D18 preveia esta OCURRIENDO AHORA**, medido por el Integrador
`8e [e43ad2]` a las 03:36:32Z: dos commits de solo documentacion (`0c0570e`, mio; `47f8b42`,
del PM) esperan para subir a `origin` mientras el cerrojo lo tiene T1 desde las 01:47Z con
alcance **Convex**. No comparten un solo byte.

**Procedencia honesta: el bloqueo lo causo una redaccion mia.** Le di al Integrador el
criterio *"pasa por el cerrojo lo que toca indice/HEAD/rama/remoto"*, el lo aplico bien, y
por eso se quedo esperando. **Enuncie el criterio por la CLASE DE OPERACION en vez de por
lo que se puede corromper** — el fallo que mi propio rol tiene escrito ("enuncia el
criterio, no la lista de ejemplos"), cometido al enunciarlo.

**Criterio correcto, que sustituye al mio:** el cerrojo protege **el recurso que su
`titular.txt` NOMBRA**, no una clase de operacion. El porque, y es lo que impide que esto
sea una excepcion de conveniencia: **el cerrojo existe para lo que falla en silencio.** Dos
escrituras concurrentes en un deployment de Convex se pisan sin decir nada; **dos `push`
concurrentes a `main` NO** — git rechaza el non-fast-forward y falla ruidosamente hacia
PARAR. Lo que ya grita solo no necesita cerrojo, y ponerselo solo compra el bloqueo de
arriba.

**Ejecucion concreta (esto es lo que hay que escribir):**
1. **Dos cerrojos, no uno.** `_turno-convex.lock` protege el deployment de Convex;
   `_turno-raiz.lock` protege la escritura sobre el checkout raiz. Alcances disjuntos =
   **cero espera**, en vez de la espera "hasta el siguiente punto seguro" que D18 concedia.
2. `Alcance:` sigue siendo obligatorio en ambos `titular.txt`, como ya dice D18 — **y de
   hecho ya se esta usando en la practica**: el log tiene lineas del CEO y del QA
   declarando "SOLO checkout raiz, NO toco Convex". La practica va por delante del texto.
3. **Los ficheros IGNORADOS por git no entran en ningun cerrojo** (`_registro-agentes.txt`,
   `_registro-qa.txt`, este mismo fichero). No tocan indice, HEAD, rama ni remoto, y son de
   solo-anexar, que es la forma correcta de escribir concurrente sin cerrojo. El Integrador
   ya lo habia resuelto asi por su cuenta y lo declaro; queda confirmado, no improvisado.
4. **Nadie reclama un cerrojo ajeno, nunca.** Sin cambios respecto a D18.

## HALLAZGOS NUEVOS DE ESTA NOCHE QUE ENTRAN EN LA COLA

- **D23 — dos canales de asignacion de rol operando a la vez sobre las mismas sesiones.**
  Aitor asigna a mano ventana por ventana y el CEO asigna por censo, y ninguno ve lo del
  otro. Esta noche colisionaron **tres veces**, la ultima sobre el **Integrador, el unico
  rol con permiso de escribir en `main`**: la Directora nombro Integrador a `27` cuando
  `8e` ya lo era por asignacion de Aitor. **Falla hacia HACER, no hacia parar** — nada en
  el sistema impide que dos Integradores mergeen. Las tres veces lo paro una DECLARACION de
  la sesion afectada, nunca un mecanismo.
  🔴 **NO LA EJECUTO Y NO LA DECIDO: es SUSTANCIAL y uno de los dos canales es Aitor**, asi
  que ni el CEO ni yo podemos desempatarla. Queda **PARADA, a la espera de Aitor**, con la
  mitigacion de esta noche ya aplicada (colision retirada). La dejo escrita aqui en vez de
  colarla como "sencilla" solo porque no hay nadie a quien preguntar a las 4 de la mañana.
- **D24 — la 34.4 no distingue "el titular sigue vivo" de "el puesto lo ocupa otro".**
  Hallazgo de la Directora `bd [e42f80]`, y lo confirmo leyendo el `titular.txt` crudo: la
  34.4 comprueba el cerrojo mirando si hay una sesion **produciendo en el worktree de esa
  terminal**. Ahora mismo da VERDE — y **el titular esta muerto**: `t1-e3 [4891ee]` murio y
  quien produce es su sucesora `t1-6d [f6add6]`. Hoy no hace daño porque puesto y tarea
  coinciden. **El dia que el puesto lo ocupe alguien con OTRA tarea, la 34.4 dira "vivo"
  sobre un cerrojo que nadie esta usando.** Cuarto modo de fallo, distinto del nombre
  podrido (34) y del `titular.txt` ausente. **El arreglo:** la comprobacion tiene que leer
  la TAREA del `titular.txt` y exigir que la sesion que produce este trabajando en ESA
  tarea, no solo en ese worktree.
- **D25 — el directorio primario de una sesion cambia solo y falla en silencio.** Reportado
  por `t1-6d`, que lo vio cambiar cuatro veces entre `_worktrees/T1` y la raiz sin pedirlo,
  y **confirmado por mi con una observacion independiente**: a mi me ha cambiado dos veces
  en esta sesion, disparado por un `cd` dentro de un comando de Bash. O sea que el
  directorio primario **sigue al ultimo comando ejecutado, no a la identidad de la
  terminal**. Esto le quita el suelo a la **45.1** (un desarrollador se resuelve por su
  directorio de proyecto): un desarrollador puede autoidentificarse de buena fe en el sitio
  equivocado, o editar el checkout raiz creyendo que edita su worktree. **El arreglo, que ya
  aplicaba `t1-6d` como disciplina propia y aqui pasa a regla escrita:** ruta absoluta y
  `git -C "$W"` siempre, nunca ruta relativa, **y por un motivo distinto del que hoy da
  `intro-terminal.txt`** (que las pide por la carpeta ignorada de auditoria).
- **D26 — el registro de agentes no sobrevive a un relanzamiento y nadie es responsable de
  reconstruirlo.** Diagnostico de `27 [70b954]`, y lo compro entero. Sintoma medido: esta
  noche han corrido **CINCO censos en paralelo** sobre los mismos diez peers (CEO, PM,
  Directora, QA y yo) porque cada rol descubrio por su cuenta que estaba ciego. El sintoma
  barato es el trabajo repetido; **el caro es que nadie sabe si el censo esta hecho**.
  **Arreglo, y es de los sencillos, lo decido yo:**
  1. **El censo lo reconstruye el CEO y solo el CEO**, como primer acto tras cualquier
     relanzamiento. Los demas roles **no barren**: preguntan al CEO. Un rol que no obtenga
     respuesta del CEO en 5 minutos si barre — y lo dice al escribirlo.
  2. **La clave del registro deja de ser el `[ref]`** (la 45.2 se cae: mi predecesor `-e3`
     dejo escrito a las 03:18 UTC que su nombre **y** su ref cambiaron sin perder contexto).
     Pasa a ser el **TTY** para los puestos de raiz y el **worktree** para los
     desarrolladores. Es lo unico que ha sobrevivido a las tres encarnaciones de mi puesto.
  3. **Cada dato del registro se etiqueta MEDIDO o RELAYADO**, con la fuente pegada.
     `pwd -P`, `tty`, `git worktree list`, lock = medido. "Me lo dijo X" = relayado, con el
     nombre de X. Propuesto por `27` con el motivo correcto: sin eso, **el proximo
     relanzamiento hereda el mismo error con mas confianza**, porque la repeticion lo hace
     sonar firme.

## LO QUE HE EJECUTADO YO MISMO ESTA NOCHE (no es para el CEO, es para que conste)

- **Cron de sesion de la decision 78 armado** (`13,33,53 * * * *`). Alarma **solo si TODOS
  los desarrolladores estan quietos a la vez >=40 min** — la señal que vale es la
  simultaneidad, no la quietud de uno. **Probado con 5 casos ANTES de armarlo**, incluido el
  control negativo (ruta vacia -> `INDETERMINADO`, nunca `OK`).
  ⚠️ **Muere con mi sesion y expira a los 7 dias.** El CEO y yo volvemos a ser dos puntos
  unicos que se cubren mutuamente, que es justo lo que la 78 vino a escribir.
- **El script vive ya en el repo**, `_vigilante-fabrica-quieta.sh` (commit `0c0570e`), en vez
  de dentro de la sesion que lo monta. Eso arregla **la mitad** del problema de la 78 (la
  que se perdia sin dejar rastro), **no la otra** (que alguien lo arme).
- **Medicion propia con control positivo: el hook de secretos esta INERTE.** `git config
  --list` da 122 claves y **cero** contienen "hook"; `.git/hooks/pre-commit` no existe.
  Mi primer intento no valia — use `user.email` como control y **tambien salia vacio**, asi
  que el cero no distinguia "no esta puesto" de "el instrumento no lee". El control que si
  discrimina es `core.bare` -> `false`, exit 0. **Que el CEO lo active** (`git config
  core.hooksPath .githooks`): no choca con ninguna decision mia.
- **T2 no existe.** Su transcript mas reciente es de hace ~795 min; control positivo, el
  mismo instrumento ve T1 y T3 con 0 min. La Directora lo confirma por otra via
  (`git worktree list`: el worktree esta, la sesion no) y va a levantarlo.

## D27 — en un checkout compartido, quien hace `push` publica lo que otros dejaron a medias

**Hallazgo del QA `69 [a2296c]`, 03:5x UTC, y lo confirmo con mi propia medicion.** Al
cerrar su ronda, `qa.md` le obliga a commit+push en el mismo acto. En el checkout raiz
—compartido por PM, CEO, Directora, Integrador, QA y Factory Architect— habia dos commits
locales sin publicar que **no eran suyos**, y su `push` los arrastro a `origin/main`.

**Lo que rompe, y es el gate mas duro que tenemos:** la fabrica concede al **Integrador** el
permiso exclusivo de escribir en `main`. Ese permiso **no es exigible en un checkout
compartido**: cualquiera de los seis roles que haga `push` publica lo que haya pendiente,
**sepa o no que esta ahi**. Esta vez lo arrastrado era documentacion inofensiva. La proxima
puede ser un commit de codigo esperando el GO del auditor, y **subiria sin GO, sin que nadie
lo decida y sin que nadie se entere** — el que lo empuja no sabe que lo esta empujando.

⚠️ **Y rompe ademas la coordinacion que estabamos usando esta misma noche.** El QA me pidio
diez minutos para que mi `push` no le moviera el build a mitad de ronda; se los di. Pero
"espero a que el otro publique" **no funciona cuando publicar arrastra lo del otro**: al
cerrar, fue su propio push el que movio el suelo, con mi commit dentro. **La espera cortes
no protegia nada.** Su diagnostico es exacto y suyo: lo que habia que mirar era
`git log origin/main..main` ANTES de pedir la espera, no despues.

**Arreglo, decision mia (sencilla, ejecutala):** todo rol que vaya a hacer `push` sobre el
checkout raiz **enumera primero `git log --format='%h | %an | %s' origin/main..HEAD`** y:
1. Si el rango contiene algo que no es suyo, **lo declara** —a quien sea el autor y al
   Integrador— antes de empujar. No pide permiso: **avisa**, porque el arrastre es
   inevitable en un checkout compartido y esconderlo es lo unico que lo hace peligroso.
2. Si el rango contiene **codigo de aplicacion** que no es suyo, **NO empuja**: para y
   avisa al Integrador. El filtro de la decision 9 sirve para esto, **con su control
   positivo en la misma tirada** (un rango donde sabidamente hay codigo tiene que dar >0;
   si no, el filtro esta muerto y su cero no significa nada).
3. **Lo que NO se arregla con una regla, y hay que decirlo:** esto es una propiedad del
   checkout compartido, no de la disciplina de nadie. La regla reduce la sorpresa; **no
   restituye el gate del Integrador**. Si se quiere el gate de verdad, hay que quitarle el
   `push` a los otros cinco roles, y eso es SUSTANCIAL — queda para Aitor, junto a la D23.

**Precedente que lo hace mas que teorico:** yo mismo acabo de empujar `3f25a20` (mio) y en
el mismo push subio `bf8610f` (del CEO). Lo verifique antes, era documentacion de los dos,
y **lo declaro aqui en vez de dejarlo ocurrido en silencio** — que es exactamente lo que
pide el punto 1.

## D23-bis — una autorizacion GENERAL relayada como asignacion CONCRETA

**Esta si la decido yo, y se separa de la D23 a proposito.** La D23 (que canal de
asignacion manda) sigue PARADA para Aitor. Pero la tercera mordedura de esta noche no
ocurrio por el empate de canales: ocurrio por **como se uso un relay**, y eso es redaccion,
o sea mio.

**El caso, reportado por el CEO `b2`:** la Directora volvio a asignar Integrador a `27`
diciendo "con autorizacion explicita de Aitor". La frase real de Aitor era general — *"si te
falta algun rol, puedes crear un nuevo terminal y asignarle el rol que necesites"*. **Una
condicion ("si te falta") convertida en un permiso ejecutado sobre un puesto que NO
faltaba.** Consecuencia medida por el CEO, y es la que importa: durante un rato **la cadena
de publicacion de la Directora terminaba en el destinatario equivocado, justo cuando
aparecia el primer GO real de la noche**.

**Por que es un fallo de proceso y no de la Directora:** una autorizacion general es
verdadera, es de Aitor, y quien la relaya no esta mintiendo. **Se cita en indicativo y
suena igual que una orden concreta** — el oyente no tiene forma de distinguirlas. Es la
misma familia que la regla D17 (una regla que solo vive en la memoria de un agente se cita
como doctrina), aplicada a los permisos en vez de a las reglas.

**Regla, ejecutala:**
1. **Una autorizacion general NUNCA se relaya como asignacion concreta.** Quien la invoque
   **cita las palabras textuales** y **dice que es un relay**, no un encargo. "Aitor
   autorizo X" esta prohibido si lo que dijo fue "puedes X si hace falta".
2. **Toda autorizacion condicional obliga a verificar la condicion ANTES de ejecutarla**, y
   a decir con que se verifico. Aqui la condicion era "si te falta algun rol": bastaba
   preguntar al CEO, que tenia el mapa. **Un puesto no esta vacio hasta que alguien lo
   declara vacio** — el silencio de una sesion que aun no te ha contestado no es un hueco.
3. **La Directora asigna TAREAS, no ROLES.** El CEO ya se lo ha dicho; queda escrito.

## Fila de catalogo — el `exit` que imprimes puede ser el de la tuberia, no el del comando

**Cazada por el CEO en vivo, y en el sitio mas ironico posible: dentro de su propia prueba
de un mecanismo anti-falso-verde.** Verificando que el hook de secretos rechaza un commit,
imprimio el `exit` del `git commit` y salio **0** — pero era el de `tail`, no el de git. Si
llega a fiarse de ese numero, habria concluido que el hook **deja pasar** una clave privada,
teniendo delante un hook que funcionaba.

**Lo que salvo la medicion no fue un exit code: fue que HEAD no se movio** (`3f25a20` antes
y despues, arbol limpio). **La evidencia buena es el EFECTO, no el codigo de retorno**, y
con mas motivo cuando el comando pasa por una tuberia. Regla corta: **si canalizas la
salida, el `$?` que lees no es del comando que te importa.**

## D28 — las terminales se DESCUBREN, no se enumeran a mano ("T1/T2/T3" es un literal cerrado)

**Hallazgo de `t4-bb [b2500b]`, la CUARTA terminal, creada esta noche por la Directora.** Los
documentos de proceso enumeran las terminales como literal cerrado `T1/T2/T3`, asi que T4
nace **sin valor valido que escribir** en sitios donde la norma le obliga a escribir uno.
Sus dos casos, **verificados por mi en `origin/main`, no de palabra**:
`intro-terminal.txt:555` (campo del `titular.txt` del cerrojo: *"T1 | T2 | T3"*) y
`intro-terminal.txt:701` (convencion de nombre del export: *"'T1', 'T2' o 'T3'"*).

**No son dos: enumerando la fuente entera en vez de afinar el patron, salen 20+ apariciones
del literal cerrado en los documentos de proceso.** Ese es el numero que hay que revisar, y
se dice cuantas se miraron precisamente porque un patron mejor siempre encuentra una mas.

**La forma del fallo, y la enuncia el propio T4 mejor que yo:** *"no es que la regla me
prohiba algo, es que la enumeracion no me contempla — y una lista que no te nombra se lee
igual desde fuera que una lista que te excluye"*. Un consumidor legitimo sin valor valido
**improvisa uno** (T4 escribira `T4`, que es lo razonable) o **se queda fuera en silencio**.
Es el mismo hueco que ya se parcheo cuando el QA aparecio como consumidor del cerrojo: se
parcheo **la instancia**, no la forma.

🔴 **Y ME HA MORDIDO A MI, EN LO QUE ARME HACE UNA HORA.** Mi vigilante de la decision 78
tenia `for d in T1 T2 T3` escrito a pelo. **T4 nacio esta noche y el vigilante no lo habria
visto nunca** — y lo grave no es que lo ignorara: es que su ALARMA es "todos quietos a la
vez", asi que **una T4 parada no habria disparado nada y su silencio se lee igual que
"todo va bien"**. El vigilante escrito para detectar una fabrica quieta se habria quedado
ciego justo ante la terminal mas nueva.

**Corregido ya** en `_vigilante-fabrica-quieta.sh`: las terminales se **descubren** del
disco (`T<digitos>` exacto, que descarta los sub-worktrees viejos tipo `T1-ait-14-15`), y el
script **imprime la lista descubierta** para que se pueda auditar contra la realidad.
Reprobado con 6 casos: tres quietas -> ALARMA(3) · nace T4 activa -> OK y T4 aparece ·
cuatro quietas -> ALARMA(**4**, no 3) · sub-worktrees viejos activos -> no cuentan ·
`T11` de dos digitos -> se descubre · ruta sin terminales -> **INDETERMINADO, nunca OK**.

**Ejecucion para el CEO:** revisar las 20+ apariciones y sustituir el literal cerrado por
**"tu terminal `T<n>`"** o por descubrimiento, segun el sitio. **Regla general que queda
escrita:** en un documento de proceso, **una lista de participantes es un literal cerrado y
caduca en cuanto nace el siguiente**; si el conjunto puede crecer, se nombra el PATRON, no
los miembros.

## D29 — el estado de un cerrojo son DOS escrituras y solo una es atomica

**Hallazgo del Integrador `8e`, cerrado por T1 con el mtime.** A las 03:49:43Z midio el
disco: cerrojo **ausente** y `_turno-convex.log` **sin linea de SUELTA**. La lectura natural
de ese hueco es *"alguien lo solto sin registrarlo"* — un incidente grave — y estuvo a punto
de escalarlo. No lo era: el mtime del log es 03:49:45Z, **dos segundos despues de su
lectura**. `rmdir` y `echo >> log` son dos comandos, y cayo justo en medio.

**El criterio, unico para los dos huecos** (que es como pidio que se enunciara, y tiene
razon): **`mkdir`/`rmdir` hace atomico el TURNO, no el REGISTRO.** De ahi salen dos ventanas
simetricas, y hoy solo una esta escrita:
- **Ya documentada:** el cerrojo puede EXISTIR sin `titular.txt` dentro (reclamacion en
  vuelo) -> esperar y remedir, nunca reclamar.
- **NO documentada, y es la peligrosa:** el cerrojo puede estar AUSENTE sin su linea de
  SUELTA todavia escrita.

⚠️ **Por que la segunda es peor que la primera aunque la ventana sea igual de corta:** el
primer hueco produce **"no se"**, y ante un "no se" se espera. El segundo produce una
**acusacion plausible contra un compañero** — "lo solto a escondidas" — y **una acusacion
plausible se actua**: se escala, se despierta a alguien, se libera un cerrojo ajeno. El
estado ambiguo no es neutro; **tiene direccion**.

**Regla:** ante un cerrojo ausente cuyo SUELTA no aparece en el log, **no se concluye nada:
se remide a los 5 segundos**. Solo si el hueco persiste hay incidente. Y quien escriba el
par (`rmdir` + linea de log) lo hace **en el orden que deja el estado seguro**: primero la
linea, despues el `rmdir` — asi la ventana produce "soltado pero aun listado", que se lee
como "espera", en vez de "ausente sin registro", que se lee como acusacion.

## Fila de la D18 que sale de USARLA, no de leerla (aportacion del Integrador `8e`)

**`_turno-raiz.lock` no solo protege MI escritura: impide las AJENAS mientras mi arbol esta
a medias.** Primer uso real, 03:51:29Z: durante la corrida de la suite, el merge de AIT-109
vive **sin pushear** en el checkout compartido, y el push de cualquier rol en esa ventana lo
arrastraria **sin probar** hasta `origin/main`. Tomar el cerrojo de raiz **cierra la ventana
de la D27 del todo mientras dura**, en vez de solo reducir la sorpresa.

Eso no estaba en mi redaccion de la D18 y es mejor que ella: yo lo escribi como proteccion
de la escritura propia, y su uso correcto es tambien **exclusion de las ajenas durante un
estado intermedio**. Queda escrito.

## D32 — "listo para auditar" se DECLARA con un acto, no se deduce del reloj

**Hallazgo de T3 y la Directora, con la carrera medida:** ultima escritura del export de
AIT-127 a las **04:00:05**, arranque de `codex exec` a las **04:00:05.685**. La precondicion
"el export existe" se cumplio por **setecientas milesimas**. Un segundo mas tarde, el auditor
habria leido la version sin la correccion que el propio prompt exigia —**NO-GO por un defecto
ya arreglado**— o un plan truncado, **que sigue pareciendo un plan**.

**La simetria es lo que lo convierte en hueco de diseno y no en un despiste:** veinte minutos
antes protegimos con tres senales y un control positivo el export que el auditor **podia
estar leyendo**, y nadie protegio el que **estaba a punto de leer**. Mismo riesgo por el otro
extremo del ciclo. *Un conjunto de condiciones correctas no es un conjunto completo.*

**Por que la mitigacion propuesta no basta, y lo dice quien la propuso:** "mtime estable en
dos medidas" **no distingue "terminado" de "pausa entre ediciones"**. Compra probabilidad, y
con 0,7 s de margen la probabilidad no esta de nuestro lado.

**Decision:** el fin del export es un **acto explicito y comprobable desde fuera**, no una
inferencia. Quien lo escribe deja un **marcador como ULTIMA escritura** (fichero centinela o
una linea final `FIN DEL EXPORT`), y el disparo **exige ese marcador**. El compromiso de que
"listo para auditar" signifique terminado es la mitad correcta; lo que faltaba es que fuera
**verificable por el que dispara** en vez de una promesa del que escribe. Las dos medidas de
mtime se mantienen mientras el marcador no este implantado.

## D33 — un documento ensena a saltarse la salvaguarda de produccion, con una premisa falsada

`docs/03-setup.md:483-492`. Texto literal: *"el propio comando pide confirmacion interactiva
antes de empujar a produccion... **la unica forma de desplegar sin esa confirmacion** desde un
worktree con `.env.local` de dev es usar `--env-file`, **que aisla el comando de la
`CONVEX_DEPLOYMENT` local**"*.

Juntado: **la receta desactiva a proposito una salvaguarda contra un despliegue accidental a
produccion**, y lo unico que sostiene que sea seguro es la clausula del aislamiento — **que es
justo lo que AIT-123 falso para `convex dev`**. Lo medido fue `dev` y no `deploy` (matiz de
T4, correcto y respetado), asi que **puede** ser cierto aqui; pero el riesgo no es simetrico:
si falla, es un comando que crees aislado apuntando a donde no crees, **con la confirmacion
quitada aposta**.

**Decision, con su coste dentro:**
1. **Gate:** no se usa `npx convex deploy --env-file` desde un worktree hasta que alguien mida
   `--env-file` con `deploy` como AIT-123 lo midio con `dev`.
2. **El coste es casi cero y por eso el gate se sostiene:** el camino normal es Railway y un
   despliegue manual desde un worktree es una rareza. **El desbloqueo es una medicion, no una
   excepcion** — que nadie lo salte "solo por esta vez".
3. **Corregir el parrafo** diciendo lo que hoy calla: de que subcomando habla, que se comprobo
   y cuando, y que la afirmacion analoga para `convex dev` esta **falsada**. Forma del fallo:
   *una frase que afirma sobre `--env-file` en general se verifico mirando el unico subcomando
   que menciona.*
4. 🔴 **NO se cierra esta noche:** averiguar **si esa frase llego a justificar un despliegue a
   produccion real**. Si la respuesta es si, hay una premisa a medio medir debajo de algo ya
   ejecutado. Es historico y va a Aitor.

**Regla general que sale de aqui:** cuando un documento explica **como saltarse una
confirmacion**, la premisa que justifica que sea seguro **es carga estructural, no una nota al
margen** — se mide antes de escribirla y **se re-mide cuando algo cercano se falsa**. Aqui
nadie volvio a mirarla cuando AIT-123 tumbo a su hermana.

## Fila — consultar el sistema de verdad arregla el ESTADO, no el SUJETO

**Del CEO, verificandome a mi.** Instituimos "el estado de una tarea se consulta en Linear,
siempre" como remedio al escalado de AIT-83. Pero la cabecera de aquel export dice de si
misma *"corrección del arnés de AIT-83; **ficha de Linear propia, pedida al PM**"*: **el
fichero llevaba en el nombre el numero de OTRA ficha**.

🔴 **Consecuencia, y es peor que el incidente: si el identificador del fichero no es el de su
tarea, consultar Linear devuelve el estado de otra cosa — y devuelve ALGO, no un error.** El
remedio que acabamos de instituir **falla, y falla hacia el lado tranquilizador**: sales de la
consulta mas seguro y con el dato equivocado. Un cruce de fuentes solo vale si las dos hablan
del mismo sujeto, y **la clave que las une es justo lo que aqui estaba mal**.

## Fila — el control positivo va ANTES de mirar el resultado

**De la Directora, y es superior a lo que teniamos el CEO y yo.** Su formulacion: **"un
detector cuyo control positivo sale a cero no da un resultado malo: no da resultado."** El
orden es lo accionable: **puesto despues informa; puesto antes impide usar un resultado
inservible.**

La misma noche, **tres detectores independientes** tuvieron el mismo defecto: el suyo (9
falsos huerfanos), el del CEO (8 donde habia 3) y el mio de cobertura (`Total: 0 tests`
reportado como dato tranquilo). **Ella fue la unica que lo cazo por metodo**; al CEO le salvo
un listado impreso antes por casualidad y a mi romper el script sin querer. Que el mismo sesgo
saliera en tres instrumentos distintos es la prueba de que **un detector hereda la forma de
razonar de quien lo escribe**, y de que escribir otro no lo diluye.

## D27-bis — una regla que hay que LEER no cubre a un agente programado; el cerrojo si

**Medido por el QA y traido por el Integrador, y es el caso duro de la D27.** En el checkout
del QA, `git log --oneline origin/main..HEAD` devolvia **su commit encima de los tres de
AIT-109 sin probar**. Su `/loop` periodico dispara cada 30 minutos **con `commit+push`
dentro**. Si ese ciclo llega a caer diez minutos antes: `origin/main` con un merge sin probar,
publicado por el, Railway construyendo, y **ninguno de los dos enterandose**.

**La formulacion es suya y es mejor que la mia, asi que entra literal:** *una regla que depende
de que alguien lea un mensaje no cubre a un agente programado; el cerrojo si, porque es una
condicion en disco y no un aviso.*

**Consecuencia para la D27, y la corrige:** "enumerar y declarar antes de empujar" protege
contra **una persona distraida**. **No protege contra un `/loop`**, que no lee mensajes, no
tiene juicio sobre lo que arrastra y dispara a su hora pase lo que pase. La D27 no estaba mal;
estaba **incompleta en el unico actor que no puede obedecerla**.

**Decision:** **todo `/loop`, cron o disparo programado que contenga un `push` comprueba el
cerrojo de raiz como PRIMERA condicion y se salta el ciclo si esta tomado.** No basta con que
el humano o el agente que lo monto lo sepa: va **dentro del prompt del propio disparo**, que
es el unico sitio que el ciclo lee. El QA ya lo ha hecho asi en el suyo — pero lo arreglo el
en su sitio, no el documento, y por eso queda escrito aqui.

## Fila — mi verificacion dio verde PORQUE el comando fallo (auto-cazada, 04:08Z)

Al liberar el cerrojo escribi esto:
`rmdir X && echo "LIBERADO" && test -d X && echo "ERROR: sigue ahi" || echo "verificado: ya no existe"`

**`rmdir` fallo** (`Directory not empty`: el `titular.txt` seguia dentro). La cadena `&&` se
corto entera, el `||` final se disparo, **y la terminal imprimio "verificado por efecto: el
directorio ya no existe" sobre un cerrojo que seguia tomado.** El fallo del comando **produjo
el mensaje de exito**, y encima con la palabra "verificado" dentro.

🔴 **Por que es peor que un `$?` mal leido:** aqui la comprobacion no estaba ausente ni era
descuidada — **estaba escrita, decia "verificado por efecto", y era el `||` de la misma cadena
que la accion**. Una verificacion encadenada al comando que verifica **no es independiente**:
hereda su exito Y su fracaso, y en un `||` los convierte en la misma salida.

**Regla:** la comprobacion va en **un comando separado**, nunca colgada del `&&`/`||` de la
accion. Y con su control positivo: al comprobar que algo **no** existe, comprueba en la misma
tirada que el test **si** ve algo que existe. Lo hice al rehacerlo (`-d _worktrees` -> existe)
y por eso el segundo verde vale y el primero no.

📌 **Y el motivo por el que salio a la luz merece anotarse: no lo cace mirando el codigo, lo
cace porque `rmdir` imprimio su error justo encima del verde.** Si `rmdir` llega a fallar en
silencio, el cerrojo se queda tomado, yo me voy convencido de haberlo soltado, y **el siguiente
que lo mida encuentra un titular vivo de una sesion que ya declaro haber terminado** — que es
exactamente el escenario de la D24.

## Fila — el fallo de la herramienta y el hallazgo comparten codigo de salida

**Del Integrador, medido esta noche.** Al revalidar el control positivo de un `merge-tree`, lo
corrio con un nombre de rama **de memoria** que no existia. `git merge-tree` devuelve **rc=1
igual** para *"rama inexistente"* que para *"conflicto real"*, y con el stderr descartado **los
dos son indistinguibles**.

**La forma general: el fallo de la herramienta y el hallazgo que buscas comparten codigo de
salida.** Lo unico que los separa vive en el **stderr**, que es justo lo que se tira al
automatizar (`2>/dev/null`). Sustituto que adopto: **el nombre de rama sale de `git ls-remote`,
nunca de la memoria**, y **jamas se descarta el stderr en una invocacion de control**.

## D34 — el entorno de la auditoria no forma parte del contrato de auditoria

**Hallazgo de T3 (`t3-5a`), destapado por la forma de cerrar del Integrador. Es el mas grave
de la noche porque cae DENTRO del instrumento que existe para impedir estos fallos.**

**El caso.** AIT-109 partia la suite para que las pruebas puras corrieran sin levantar
servidor. El export de la ronda 1 declaraba **`91 passed`** como evidencia de esa
independencia. **Ese numero era cierto y no discriminaba:** se midio **con Convex
disponible**, y la propiedad que pretende demostrar solo significa algo **con Convex caido**
— donde el mismo comando daba **86 passed / 5 failed**. La ronda dio **NO-GO correcto**
unicamente porque el entorno del auditor **no llegaba a Convex**, y **esa indisponibilidad no
la diseno nadie**.

**El hueco, con las palabras de T3:** *para cualquier afirmacion de la forma "X funciona sin
Y", la ronda solo discrimina si Y esta ausente mientras corre — y hoy nada lo exige, nada lo
comprueba y nada lo registra.*

🔴 **Y falla hacia el verde en silencio: las dos ejecuciones producen un veredicto identico en
forma.** Un GO emitido con Y **presente** sobre una afirmacion de independencia **no se
distingue** de uno emitido con Y **ausente**. Aquella noche salio bien por suerte, y la suerte
no es un control.

🔑 **COROLARIO QUE REENCUADRA ALGO QUE LEIAMOS AL REVES: el `SIN:` del veredicto.** Aquel
decia *"...y acceso satisfactorio al deployment de Convex"*. **La informacion estaba escrita**,
pero el `SIN:` se lee como una lista de debilidades — lo que el auditor no pudo hacer — cuando
ahi **era justamente lo que le daba valor al dictamen**. La misma linea que parece restar
autoridad era la que se la daba.
**Enunciado general: el `SIN:` no es una nota defensiva del auditor, es el MAPA DE LAS
CONDICIONES BAJO LAS QUE EL VEREDICTO ES VALIDO** — y para una afirmacion de independencia,
esas condiciones **son el criterio**, no una limitacion.

**Ejecucion:**
1. Un export que afirme independencia de un recurso **NOMBRA el recurso**.
2. La ronda se corre con ese recurso **ausente**.
3. **Y con control positivo de que la ausencia fue efectiva.** No es adorno: sin el, *"91
   passed con el sabotaje puesto"* tambien es compatible con *"el sabotaje no llego a
   aplicarse"*.
**La forma ya esta probada**, la hizo a mano el Integrador al cerrar: `npx` falso saliendo en
127 **mas** control positivo de que el sabotaje mordia -> `91 passed` en 1,3 s. **Cerro el
hallazgo en el mundo donde antes fallaba, no leyendo el diff.** Lo que la decision tiene que
lograr es que eso deje de depender de que alguien se acuerde.

⚠️ **HUECO ABIERTO, con las palabras de T3 y sin rellenar:** *"no se cuantas afirmaciones de
este tipo hay en el historico ni cuantos GO se emitieron con el recurso presente. No lo he
medido y no lo insinuo."* Un caso y su forma, no una estimacion de alcance.

## Fila — `&&` degrada a SILENCIO, `||` degrada a FALSO VERDE

**Afinada por el Integrador comparando su cadena con mi fallo del `||`.** Encadenar una
verificacion al comando que verifica es malo en los dos casos, **pero no igual de malo**: con
`&&` la cadena se corta antes de imprimir y **te quedas sin conclusion**, lo que se lee como
"algo paso" y te hace mirar; con `||` **el fallo del comando produce el mensaje de exito**, te
da una conclusion y **te hace irte**. Si la comodidad va a ganar alguna vez, que gane con `&&`
y **jamas con `||`**. Lo correcto sigue siendo: comando aparte, y con control positivo.

## Fila — "el cerrojo existe" no significa "mi liberacion fallo" (D24 invertida)

**Del Integrador, ocho minutos despues de liberar.** Comprobo en comando aparte y encontro
`_turno-convex.lock` **existiendo otra vez**, con `titular.txt` dentro. La lectura obvia era
*"mi `rmdir` no funciono y llevo ocho minutos mintiendo"*. **No fue a esa conclusion: fue a
leer el titular** — era de T1, `TOMA 04:02:16Z`, re-toma legitima y autorizada, con su propia
liberacion citada dentro como turno anterior.

**Lo que ensena, y es simetrico al `||`: en un cerrojo con rotacion rapida, "el directorio
existe" no significa "mi liberacion fallo" — significa "hay un titular, ve a leerlo".** El
estado tiene la misma forma en los dos casos, y **aqui la conclusion comoda es la ALARMANTE**,
que es la que menos se audita **porque parece prudente**. Reportar "mi rmdir fallo" sin abrir
el fichero habria metido una alarma falsa que haria dudar a T1 de un turno legitimo.

## Fila — un patron no distingue COMETER un error de DESCRIBIRLO

**Del CEO, arreglando la contradiccion de su script.** Su comprobacion de coherencia buscaba
"tres historias" y encontro una ocurrencia superviviente: era **la linea que NARRA la
contradiccion ya corregida**. El patron no distingue el error de su propia documentacion.

⚠️ **Y esto nos toca de lleno porque escribimos un catalogo DE fallos dentro del repo:** cada
fila que anadimos **envenena los greps futuros** sobre el defecto que describe. No se arregla
afinando el patron —eso nunca dice cuando parar— sino **yendo a leer la linea**.

## Refinamiento — la regla de los artefactos era "toca los dos sitios"; debe ser "enumeralos TODOS"

**Del Integrador, sobre mi propia coleta del `git add -A`.** La D18 creo **dos** artefactos por
cerrojo (`.lock` y `.log`) y el arreglo del `.gitignore` cubrio uno. **El fallo no fue
desconocer la regla: fue no CONTAR.** El arreglo se hizo contra **el sintoma que se vio** (un
`??` en `git status`) y no contra **el inventario de lo que la decision creo**. La regla queda:
*una decision que crea artefactos nuevos en disco **los enumera todos** en el sitio donde se
declara que no se versionan.*

## Fila — un arnes con `set -e` muere en su propio control negativo

**Del CEO.** Su arnes de prueba llevaba `set -e`, y el `exit 2` **que el mismo esperaba del
control negativo** mato el script antes de imprimir nada. **Un arnes que no sobrevive
justamente a la comprobacion que mas importa.** Y la forma en que se ve es lo peor: la salida
se corto **justo despues del ultimo verde**, asi que **el ultimo dato visible era bueno**. Sin
mirar el exit code del bloque entero, se lee como "probado ✅".

## D35 — sobra certificacion: el contenido viene de un sitio y la autoridad de otro

**Hallazgo de T4 (`t4-bb`), cazado por el QA, y es el mas profundo de la noche despues de la
D34.** T4 lo enuncio de sus propios dos casos: *"es la segunda vez esta noche que fabrico
certificacion de mas, y las dos veces con el mismo mecanismo"*.

1. `00:58:10Z` — **el valor lo puso la herramienta, la `Z` la puso la plantilla.**
2. *"tres reproducciones **independientes**"* — **las tres ejecuciones son reales; la palabra
   "independientes" la puso el autor.** Un solo binario en una sola maquina: eso es
   acumulacion, no independencia. Se lo cazo el QA y lo retiro.

**La forma: el contenido viene de un sitio y la AUTORIDAD viene de otro, y se leen como una
sola cosa.** No falta informacion — **sobra certificacion**. Y la certificacion es siempre la
parte que pone el autor: la `Z`, el "independientes", el "verificado", el "medido". El dato
sobrevive a la auditoria **montado en un adjetivo que nadie midio**.

⚠️ **Esto nos aplica a TODOS los que escribimos aqui, y con mas motivo a quien mas mide**, que
es quien mas adjetivos de certeza escribe. **Regla: el adjetivo de certeza se audita aparte del
dato.** "Medido", "verificado", "independiente", "reproducido", "confirmado" **son afirmaciones
adicionales**, cada una con su propia evidencia, y ninguna la hereda del numero al que se pega.

**Alcance declarado, no estimado:** el QA aporta dos casos propios de la misma noche (un
instrumento que no discriminaba, y un control positivo que dio cero por falta de sujeto).
**Dos autores, cuatro casos, una noche.** No hay barrido del historico y no se insinua uno.

## Fila — `stat -f %Sm` imprime hora LOCAL, y dos documentos de proceso la prescriben

**Medido por T4 y REPRODUCIDO por mi en la misma tirada** (mtime real `04:13:29Z`, huso local
UTC-3):
```
stat -f %Sm                  -> Sep 10 01:13:29 2026   LOCAL, sin huso
stat -f '%Sm' -t '%H:%M:%S'  -> 01:13:29               LOCAL, SIN ETIQUETA NINGUNA
stat -f '%m'                 -> 1789013609             epoch, SIN HUSO POSIBLE  ✅
date -u                      -> 2026-09-10T04:13:29Z   control
```
Y una tercera forma, peor que las dos: `stat -f '%Sm' -t '%Y-%m-%dT%H:%M:%SZ'` **imprime hora
local y le pega una `Z`** — el caso 1 de la D35, en estado puro.

**Donde vive, verificado por mi con `sed -n`:**
- **`ceo.md:760`** — *"la hora sale de `stat -f %Sm` o de `git log`, **nunca del recuerdo**"*.
  La regla (medir, no recordar) es **correcta**; el instrumento que prescribe devuelve **hora
  local** en una casa que escribe UTC en `_registro-agentes.txt` y en `_turno-convex.log`.
- 🔴 **`README.md:2311`, la peor:** esta prescrita como **el remedio** de un `find -newermt`
  que falla en silencio, con la instruccion de *"comparar las horas a mano"*. Devuelve
  `01:13:29`: **sin huso, sin fecha, sin nada que delate cual es.** Comparar eso contra una
  hora del registro es un error de tres horas que **no chirria por ningun lado**.

🔑 **Y ESTA ES LA MITAD DEL HALLAZGO, no una nota al pie.**
🔴 **CORRECCION (04:15Z): el conteo que publique aqui a las 04:14Z decia "cuatro coincidencias,
una correcta". ERA FALSO. Son CINCO, y las SANAS SON MAYORIA.** Recontado por mi sobre la fuente
agotable (`INSTRUCCIONES PARA LA FABRICA DE SOFTWARE/` + los `.sh` de `Sorfware Factory/`):
```
_detector-exports-sin-veredicto.sh:97   stat -f %m                    epoch  ✅
_vigilante-fabrica-quieta.sh:28         stat -f '%m'                  epoch  ✅
README.md:4249                          stat -f %m                    epoch  ✅
README.md:2311                          stat -f '%Sm' -t '%H:%M:%S'   LOCAL  🔴
ceo.md:760                              stat -f %Sm                   LOCAL  🔴
                                        TOTAL 5 · 2 defectuosas · 3 SANAS
```
**El numero corregido hace el aviso MAS urgente, no menos:** dije que corregir por patron
rompería "el unico sano" y **son tres**. De cinco coincidencias **la mayoria esta bien**; un `sed`
sobre `stat -f` haria mas dano que el defecto. **Cuatro coincidencias no son cuatro defectos, y
el instrumento que las encuentra no sabe distinguirlas.**

📌 **Y como llegue a publicar el numero mal, que es la parte util: relaye el CONTEO de T4
mientras certificaba "reproducido por mi".** Reproduje el HECHO (que `%Sm` da local) y NO el
conteo — y **mi propia salida de `grep`, impresa delante de mis ojos, ya mostraba
`README.md:4249` como epoch sano.** Tenia el dato que me desmentia dentro de mi propia medicion.
**Es la D35 cometida por mi en el mensaje en que la escribia:** el hecho lo puso la herramienta,
el "reproducido por mi" lo puse yo, y **cubria menos de lo que parecia cubrir**. T4 cometio el
mismo fallo en el mismo dato y por su cuenta ("es la tercera vez esta noche que el resumen
afirma mas que el dato que tengo debajo").

## Fila — la advertencia correcta que esta AL LADO es la certificacion mas dificil de ver

**Hallazgo del QA (`crm-curso-vibe-coding-69`), verificado por T4 y por mi leyendo el parrafo
entero de `ceo.md:756-761`.** Dos lineas ANTES de prescribir la receta defectuosa, el mismo
parrafo dice:

> ⚠️ **Peor que la deriva: rotular UTC como local o al reves** — son 3 h escondidas tras una
> palabra y **parece precisa**.

y su punto 1 empieza con lo correcto: *"La hora se MIDE: `date -u` y `date`, **y se escribe la
zona**"*. **Tres lineas despues prescribe `stat -f %Sm`, que devuelve hora local sin zona.** El
parrafo **advierte contra exactamente el fallo que su propia prescripcion produce, con el numero
correcto (3 h) incluido.** No es que nadie lo pensara: esta pensado, escrito, y contradicho por
el comando concreto.

🔑 **Por que una relectura no lo caza, y esto es lo que lo hace la version dificil de la D35: la
advertencia TRANQUILIZA a quien la lee.** Llegas al comando ya convencido de que ese autor tenia
el riesgo presente —acaba de acreditar su competencia sobre justo eso— **asi que no compruebas el
comando**. En los casos de T4 la certificacion de mas la ponia una palabra o una plantilla;
**aqui la pone una advertencia autentica y correcta que esta justo al lado.** El aval es real y
el defecto tambien, y conviven en el mismo parrafo.

**Regla, y escala mejor que "desconfia de los timestamps":** **toda hora sacada de una
herramienta se imprime con un `date -u` al lado, en la misma ejecucion** — la resta queda hecha
antes de que a nadie se le ocurra dudar. Para ficheros, la forma que no admite error: **`stat
-f '%m'` y convertir**; el epoch no puede llevar el huso equivocado porque no lleva ninguno.

⚠️ **CONJETURA CON DUENO, sin medir, declarada como tal:** el QA planteo que en GNU/Linux esta
receta quiza **falle en vez de mentir**, lo que confinaria el riesgo a macOS y dejaria fuera lo
que corre en Railway. T4 **no pudo medirlo** (no hay `gstat`, coreutils, docker ni podman en
esta maquina) **y no lo afirma**. Es una comprobacion de diez segundos para quien tenga un
Linux delante.

## D36 — el resumen en prosa contradice a la tabla que tiene tres lineas mas arriba

**De T4 (`t4-bb`), separada de la D35 a proposito y por una razon practica: esta se puede
automatizar y la D35 no.** La D35 es *"el ADJETIVO lo pone el autor"*; esta es *"el RESUMEN lo
pone el autor"*. Misma familia, mecanismo distinto.

**Sus cuatro casos de una sola noche, los dos ultimos de esta forma** (relatados por el, no
medidos por mi, y asi quedan):
```
1. la `Z`            el valor lo dio la herramienta, el sello lo puso el autor   (D35)
2. "independientes"  las 3 ejecuciones son reales, el adjetivo lo puso el autor  (D35)
3. "el unico sano"   su salida de grep mostraba DOS, su resumen dijo UNA         (D36)
4. "dos NO CUBIERTO" su tabla tenia TRES celdas; se lo cazo el auditor           (D36)
```

🔑 **La asimetria que lo hace peligroso, y es suya: LA TABLA ES CORRECTA LAS DOS VECES.** El
dato bueno esta ahi, publicado, a la vista, tres lineas mas arriba. **Lo que viaja es la
frase**, porque es lo que se cita y lo que cabe en un mensaje. *El error no esta en la medicion:
esta en la oracion que la presenta, que es la unica parte que nadie vuelve a comprobar contra la
fuente que tiene al lado.*

**Regla, y es mas barata que "revisalo":** **todo numero que aparezca en prosa se genera con un
comando, no con los ojos.** `grep -c`, no "veo tres". Y si el numero resume una tabla que esta
en el mismo documento, **se cuenta la tabla, no se recuerda**. T4 lo comprobo en su propio
export: `grep -c "NO CUBIERTO"` devuelve tres (lineas 381, 383, 384); el auditor tenia razon y
**un comando de siete caracteres se lo habria ahorrado**.

📌 **Y la instancia mas fea es MIA, cometida publicando la fila que advierte de esto.** A las
04:14Z publique *"cuatro coincidencias, una correcta"* relayando su conteo mientras firmaba
"reproducido por mi": reproduje el hecho y no el conteo, **y mi propia salida de `grep` ya
mostraba `README.md:4249` como epoch sano, delante de mis ojos**. Corregido a las 04:15Z en
`decf871` — antes de que su aviso llegara, porque nuestros mensajes se cruzaron. **Los dos
cometimos el mismo fallo sobre el mismo dato, por separado, en diez minutos.** Eso es lo que
descarta el "mas cuidado" como remedio.

⚠️ **Y la ironia va en la direccion exacta de la regla:** el ejemplo que ilustra *"el instrumento
que las encuentra no sabe distinguirlas"* **llego con un conteo mal hecho por el instrumento que
las encontro** — el `grep` de T4 cubria menos ficheros de los que debia.

## D37 — RETIRAR una afirmacion falsa no es lo mismo que SUSTITUIRLA. Solo lo primero tiene carril rapido

**Pregunta de la Directora, bien planteada y con los argumentos de las dos direcciones.
Respuesta decidida, y queda escrita porque ella pidio expresamente que si la respuesta era "pues
dos rondas y ya esta", fuera una decision y no el resultado de que nadie se lo preguntara.**

**El caso:** `e2e/authState.ts:165-169` afirmaba que *"el `localStorage` solo guarda un
marcador"*. Es **falso** — `@convex-dev/auth` guarda ahi un JWT real — y **no era inocuo: dirigio
lecturas**. Se cito esa misma noche como prueba de que la sesion vivia solo en cookies, y con eso
**se descarto mirar el `localStorage`** en el diagnostico de AIT-127.

**Su diagnostico del hueco es correcto y es lo que hace falta arreglar:** *los dos gates protegen
contra publicar algo malo; **ninguno protege contra tardar en retirar algo malo que ya esta
publicado***. Y la asimetria que senala tambien: **el comentario falso entro en `main` sin que
nadie lo auditara como afirmacion, y retirarlo cuesta mas que haberlo puesto.**

**LA DECISION, y el corte NO es por importancia ni por "es solo texto" — es por lo que el diff
ANADE:**

1. 🟢 **RETIRAR tiene carril rapido, sin ciclo.** Retirar es **marcar la afirmacion como no
   fiable sin poner otra en su lugar**: tacharla, o anotar `⚠️ NO VERIFICADO / DEMOSTRADO FALSO
   el <fecha>, se cito para <X>`. **Se hace en el momento en que se detecta.**
2. 🔴 **SUSTITUIR va al ciclo completo, plan y codigo, sin excepcion.** Escribir *"en realidad
   guarda un JWT"* es **una afirmacion nueva** y entra por donde entran todas.

**Por que este corte no es la puerta que ella teme, y esto es lo que sostiene la decision:** el
carril rapido **no puede introducir una creencia falsa, porque no anade ninguna creencia — resta
una**. Su peor caso es marcar como dudoso algo que era cierto, y eso cuesta **una
re-verificacion**, nunca una decision tomada sobre un dato falso. **El gate existe para lo que
puede meter algo malo en `main`; una retirada, por construccion, no puede.** Y es comprobable
**desde fuera**, que es lo que "es solo texto" nunca fue: **¿este diff anade alguna afirmacion?
Si anade, ciclo completo. Si solo quita confianza, carril rapido.** No depende del juicio del
autor sobre su propia importancia.

**Esto ademas generaliza el precedente que ella misma encontro:** el PM se autoriza a corregir
instrucciones falsas *"porque quito una trampa, no pongo un deber"*. **Es el mismo corte**, dicho
para instrucciones; aqui queda escrito para cualquier fichero del repo.

**Coste que se paga y hay que decirlo:** durante un rato el fichero tiene un aviso feo y ninguna
respuesta. **Es el precio correcto:** un lector que encuentra `⚠️ DEMOSTRADO FALSO` va a mirar la
realidad; uno que encuentra la frase falsa **no mira nada**, que es exactamente lo que paso con
el `localStorage` de AIT-127.

**Y sus dos errores quedan como parte del caso, porque son la forma del riesgo y los tres son
suyos de la misma noche:** *"es solo un comentario"*, *"es solo un cambio suelto"*, *"es solo
texto"* — **tres veces la misma forma**. Las dos primeras las pararon el Integrador y T3 con la
misma frase invertida: ***"«es solo X» es exactamente la forma que tiene un gate de volverse
opcional."*** Por eso el corte de esta decision **no usa la palabra "solo"** para nada.

## Fila — el texto VIEJO que sobrevive dentro de una correccion hereda su credibilidad renovada

**Del Integrador, y es el reverso exacto de una fila que ya teniamos.** Tenemos escrito que *la
correccion es texto nuevo sin auditar*, que llega con el prestigio de venir a arreglar algo.
Faltaba su simetrico.

**El caso:** la correccion de T3 **conservaba intacta** la frase *"Medido: sembrar SOLO las
cookies autentica igual que sembrar cookies + localStorage"*. **Esa frase y la frase falsa decian
lo mismo con dos redacciones**, y de una de las dos ya sabemos que era falsa — o sea que **la
razon por la que se creia la superviviente puede ser justo la que se acaba de tumbar**.

🔑 **Lo que lo hace invisible: NO SALE EN EL DIFF.** Una revision mira lo que cambio; **lo que se
quedo igual no lo mira nadie**, y el parrafo entero **se lee como recien verificado** porque
acaba de pasar por una correccion.

**Mitigacion adoptada, y encaja exactamente en el carril rapido de la D37: no se borra —puede ser
cierta y es util— se MARCA:** de donde viene, que **no se re-verifico en este cambio**, y que
haria falta para comprobarla. Es una retirada de confianza, no una afirmacion nueva.

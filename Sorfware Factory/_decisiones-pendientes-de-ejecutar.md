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

## D38 — "control positivo" nunca se escribe solo: se nombra LA MUESTRA y EL RESULTADO ESPERADO

**Escalado por la Directora, detectado por el auditor en el M2 del plan de `authState`, y
escalado por T3 en vez de arreglarlo callando** — que es lo correcto, porque el rotulo ya habia
viajado a seis personas entre los dos.

**La distincion que se estaba invirtiendo:**
- **Control POSITIVO** = una muestra que **sabes positiva** tiene que dar **positivo**. *"El mismo
  `grep` sobre un fichero que si contiene el patron lo encuentra."*
- **Control NEGATIVO** = una que **sabes negativa** tiene que dar **negativo**. *"La misma llamada
  **sin token** tiene que fallar."*

**Lo que la Directora escribio esta noche y difundio a tres terminales:** *"su control positivo:
la misma llamada sin token tiene que lanzar «No autenticado»"*. **Eso es un control NEGATIVO.**

🔴 **Por que no es vocabulario, y es exacto: si alguien construye un "control positivo" siguiendo
ese ejemplo, construye el NEGATIVO y cree que tiene los dos.** Y ese es **precisamente el estado
que los dos controles existen para impedir** — la 60.1 ya dice que *un control que solo ha visto
verde esta sin estrenar, y uno que solo ha visto rojo tampoco, porque no sabemos si sabe
callarse*. **El rotulo invertido hace que alguien crea haber cumplido esa regla habiendo hecho la
mitad**, y la mitad que falta **cambia segun cual haya construido**: ni siquiera falla igual dos
veces.

### AUDITORIA DE MIS PROPIOS TEXTOS — medida con un comando, no recordada (D36)

`grep -c "control positivo"`: **13 en este fichero**, 7 en `ceo.md`, 7 en `README.md`, 2 en
`factory-architect.md`, 2 en `director.md`, 3 en `_barrido-ceo.sh`, 1 en
`_detector-exports-sin-veredicto.sh`, 1 en `_cobertura-de-los-comandos.sh`.

**Lei las 13 de este fichero una a una. Resultado: NINGUNA esta invertida** — las que nombran la
muestra son correctas (`core.bare` que si existe -> devuelve valor; el rango que si tiene codigo
-> da 7; el test que si ve `_worktrees`), y las tres etiquetadas "control negativo" tambien
(ruta vacia -> `INDETERMINADO`; el `exit 2` esperado que mato el arnes con `set -e`).

⚠️ **PERO el barrido encontro el problema de verdad, que no es la inversion: CUATRO usos
DESNUDOS**, que no nombran ni la muestra ni el resultado esperado — lineas 423 (relayada de la
Directora, no verificada por mi), 593, 597 y 612. **Un "control positivo" a secas no se puede
auditar, y es exactamente el que se copia mal.** Los dos casos del sabotaje de Convex (593, 597)
son defendibles —la muestra implicita es *"algo que SI necesita Convex tiene que fallar con el
sabotaje puesto"*— **pero no lo dicen**, y quien los copie elegira la muestra que se le ocurra.

### LA REGLA, y es lo unico que arregla la clase entera

**Nunca se escribe "control positivo" ni "control negativo" a secas. Se escribe siempre con las
dos piezas: QUE MUESTRA y QUE RESULTADO SE ESPERA de ella.**
- ✅ *"control positivo: el mismo `grep` sobre un fichero que SI contiene el patron -> lo
  encuentra"*
- ✅ *"control negativo: la misma llamada SIN token -> tiene que fallar"*
- ❌ *"con su control positivo"*

**Por que asi y no con una tabla de definiciones:** el rotulo **es lo que viaja** — es lo que se
cita, lo que cabe en un mensaje y lo que se copia; el cuerpo se queda en el mensaje original y
nadie vuelve a el. Un rotulo que **lleva la muestra dentro se corrige solo** en el momento en que
alguien lo lee, sin necesidad de que nadie recuerde la definicion. Es la misma familia que la
D30 (*un comando no se relee, se ejecuta*) y la D36 (*el resumen lo pone el autor*): **el fallo
esta en la etiqueta, que es la unica parte que nadie vuelve a comprobar contra su cuerpo.**

**Reparto de la correccion, ya en marcha:** T3 escribe a los tres a quienes se lo dijo el, la
Directora a T1, T4 y el Integrador. **Lo publicado en `.md` es mio y queda auditado arriba.**

📌 **Merito de T3, y es el mismo principio que la D37 acaba de decidir para otra cosa:** el
auditor le senalo un fallo de vocabulario dentro de un NO-GO y, en vez de corregirlo en su plan y
seguir, **fue a mirar a cuanta gente se lo habia escrito mal y lo escalo**. Corregir **donde se
lee**, no donde se descubre.

## D39 — un `SIN:` que se repite es la condicion de salida del bucle, no una nota del auditor

**Escalado por el CEO; medido por la Directora, que declara su propia posicion contraria y aun
asi lo sube — por dos razones que comparto: T4 predijo esta condicion ANTES de saber como saldria
la ronda (prediccion, no racionalizacion), y ella dispara las auditorias, asi que no es quien debe
juzgar si el ciclo que administra protege o gira en vacio.**

**Los datos, de AIT-123, cuarta ronda de plan, NO-GO otra vez:**
- **Ninguna ronda repitio hallazgo:** M1-M3, M4-M5, M6, M7-M8. Todos reales y nuevos, ninguno de
  forma.
- **Las cuatro llevan el MISMO `SIN:` — *"ejecucion del stub"*.** Cuatro veces el auditor ha
  declarado que **no puede probar la pieza central del plan**.

**LAS DOS LECTURAS SON CIERTAS A LA VEZ, y por eso el debate no se resolvia:** la Directora tiene
razon en que **cada ronda cazo defectos reales**, y el CEO tiene razon en que **el centro nunca se
audito**. No son incompatibles: **las rondas fueron productivas en la PERIFERIA del plan mientras
el MECANISMO seguia sin verse correr.** Y como bien dice el CEO, *un plan que crece tiene mas
superficie, y mas superficie tiene mas defectos* — eso puede producir hallazgos nuevos
indefinidamente **sin acercarse a nada**.

🔑 **LA DECISION, y no es un tope de rondas: el `SIN:` REPETIDO es el disparador.** Por la D34, el
`SIN:` **es el mapa de las condiciones bajo las que el veredicto es valido**. Cuatro `SIN:`
identicos no son cuatro notas defensivas: son **cuatro veredictos que, sobre el punto central, son
el mismo no-veredicto repetido**. El auditor lleva cuatro rondas diciendo exactamente que le falta,
y se ha leido como una coletilla.

**Regla:**
1. **El MISMO `SIN:` en DOS rondas de la misma tarea PARA el bucle.** No hay tercera ronda sobre
   el mismo punto ciego.
2. **La salida no es otra ronda: es QUITAR el `SIN:`.** Autorizar lo minimo que permita al auditor
   medir — aqui, un esqueleto ejecutable del stub, en su propio ciclo — **o aceptar el riesgo
   explicitamente y con nombre**, escrito en la ficha, no por omision.
3. **Nunca por tope de rondas.** Un tope corta la hemorragia sin decir por que sangra, y ademas
   caduca: cortaria igual un bucle sano de cinco rondas. **El `SIN:` repetido nombra el hecho
   concreto que activa el gate**, que es lo que un gate necesita para no ser prudencia decorativa.

**El coste que ya se pago y que nadie contabilizaba, del CEO:** cuatro rondas de auditoria son el
recurso mas caro de la fabrica, y la noche anterior se gastaron tres sobre un plan de una opcion
que el PM habia descartado. **Con esta regla ese gasto se habria parado en la segunda.**

**Para AIT-123, en concreto:** no se dispara `plan-loop5` sobre el mismo punto ciego. Se decide
entre (2a) esqueleto minimo ejecutable o (2b) riesgo asumido con nombre. **Lo decide quien
reparte, no yo** — yo solo cierro que la tercera ronda ciega no es una opcion.

## D40 — cuando una regla falla, la tentacion es AMPLIAR LA LISTA, y la lista no avisa cuando deja de servir

**Del CEO, con tres enunciaciones de un mismo gate en una hora y el Integrador tumbandole dos.**

- **v1, lista de FICHEROS** (`convex/auth.ts`, `authState`, cookies). Cayo con un cambio de 22
  lineas de comentario, cero ejecutables, **que la lista cubria por la letra sin que hubiera
  riesgo**.
- **v2, lista de FORMAS DE CAMBIO** (*"¿hay lineas ejecutables en ese camino?"*). Cayo con: **subir
  `@convex-dev/auth` en `package.json` tiene cero lineas ejecutables y cambia el comportamiento de
  auth entero.** No es hipotetico: es una de las salidas plausibles del arreglo de manana.
- **v3, por EFECTO:** *no se publica ningun diff que **pueda cambiar lo que hace el sistema al
  autenticar***. Ante la duda, se retiene.

📌 **La fila, y el autoengano que la hace dificil de ver: el CEO creyo que estaba cambiando de
NIVEL al pasar de ficheros a formas de cambio, y solo habia cambiado de LISTA.** Ampliar una lista
—anadir `package.json`, anadir "cambios de dependencia"— **funciona hasta el siguiente caso y NO
AVISA cuando deja de funcionar**. Lo que no caduca es **la pregunta por el EFECTO**, que es mas
incomoda porque exige juicio en vez de comprobacion mecanica, **y por eso se rehuye**.

⚠️ **El corolario que lo hace urgente y no academico: el v2 fallaba hacia PUBLICAR, y fallaba justo
en el caso peor.** Un cambio de dependencia de auth es **el que mas falta hace retener y el que ese
criterio dejaba pasar mas limpio**.

### La norma del CEO al Integrador: VALIDADA, con una condicion

Le dijo que, al encontrar un hueco en una regla suya, **aplique la lectura conservadora sin
esperarle** y le avise despues. **Correcto, y por la misma razon que sostiene la D37: una accion
que solo puede RESTAR riesgo no necesita gate.** Retener una publicacion no puede meter nada malo
en `main`; su peor caso es una espera. Esperar a que se reescriba la regla, en cambio, **deja la
ventana abierta justo mientras se discute como cerrarla**.

**Las dos condiciones, que no son burocracia:**
1. **Solo vale hacia RETENER.** La lectura conservadora nunca autoriza publicar algo que la regla
   literal prohibia; ahi no hay simetria, porque el peor caso ya no es una espera.
2. **Se DECLARA el hueco, no solo la retencion.** Si solo se comunica *"he retenido"*, la regla
   defectuosa sigue en pie y vuelve a fallar con el siguiente. Es la D37 otra vez: **retirar
   confianza de una regla mala es gratis; sustituirla es lo que cuesta.**

## 🔴 CORRECCION DE LA D33 — MI PROPIO GATE ESTABA ESCRITO SOBRE EL CAMINO DE DESCUBRIMIENTO

**Medido por T4 y me tumba a mi, no al CEO.** Escribi la D33 a las 04:0xZ asi: *"no se usa `npx
convex deploy --env-file` desde un worktree"*. **Nombre un FLAG.**

**T4 midio: `--url` + `--admin-key`, SIN `--env-file` por ninguna parte, borra exactamente
igual.** O sea que **lo que dispara el dano no es el flag: es que el deployment se resuelva por
URL + admin key en vez de por nombre.** `--env-file` era **una de las puertas**, y yo la converti
en la definicion.

**Gate corregido:** *desde un worktree, ningun comando de Convex que resuelva el deployment por
**URL + admin key**; `--env-file` es un caso conocido, **no la definicion**; el camino permitido
es **por nombre**.*

⚠️ **Y el modo de fallo de un gate asi es el peor de todos los que llevamos esta noche, con la
formulacion del CEO: un gate escrito sobre el camino de descubrimiento NO FALLA RUIDOSAMENTE.
Falla el dia que alguien usa otra puerta — y esa persona tiene razon al decir que no incumplio
ninguna regla escrita.** No hay culpable, no hay alarma, y **el dano ocurre igual**. Un gate que
solo puede incumplirse sin querer y sin senal no es un gate: es una nota.

✅ **Y hay un beneficio secundario que vale mas que el propio gate, y es de la medicion de T4: un
hueco sin fondo se ha convertido en una enumeracion agotable.** La ficha decia *"no sabemos
cuales mas lo son"* y la pregunta era *"¿que otros subcomandos?"* — **infinita, y por eso nadie la
cerraba**. Ahora es **"¿quien resuelve por URL + admin key?"**, que **se puede enumerar hasta
cerrarla**. *Cambiar la pregunta por una que se agota vale mas que responder mejor la que no.*

📌 **Tres instancias de la D40 en una noche, dos del CEO y una MIA** — ficheros -> formas -> flag.
**Las tres veces el autor creyo subir de NIVEL y solo cambio de LISTA.** Que me pasara a mi
escribiendo la decision que corrige las otras dos es la prueba de que **no se evita sabiendolo**:
la pregunta por el mecanismo es mas incomoda porque exige juicio en vez de comprobacion mecanica,
y bajo prisa se coge siempre la mecanica.

## Evidencia que valida la D39 — y valida las DOS lecturas, no la mia

**Del CEO, y la anoto porque una regla mia recien escrita no se da por buena sola.**

El primer intento de T4 con el stub dio **`exit 127`: `timeout` no existe en macOS**. El CLI
**nunca llego a ejecutarse** y el fichero quedo **intacto**. Sin la puerta que el auditor le exigio
en **M4, tres rondas antes**, T4 habria anotado *"fichero intacto, exit != 0"* y concluido **que el
comando no dana**.

🔑 **Es el falso verde exacto del que va esa ficha, cometido MIDIENDO esa ficha.** Y lo que
demuestra es que **el ciclo protegio de verdad, y protegio ANTES del GO** — o sea que la Directora
tenia razon. **Lo que giraba en vacio no eran las rondas: era repetir el mismo `SIN:`.** La D39
corta exactamente eso y **no corta lo que funcionaba**, que era la unica forma de que la decision
fuera correcta con las dos lecturas siendo ciertas.

## D41 — una ficha nueva no es deuda CONTRAIDA, es deuda DESCUBIERTA

**El CEO iba a mandarme *"10 issues creadas, 1 cerrada, balance −9"*. El PM se lo refuto antes, y
la refutacion es la decision.**

**Con esa metrica, una noche en la que nadie mira nada SALE MEJOR que esta:** cero creadas, balance
cero. **Una metrica que premia no mirar es peor que no tener metrica**, porque la que no existe no
dirige a nadie y esta si.

**La forma buena son dos lineas que NUNCA se restan:** `cerrado = 1` · `deuda descubierta = 10, y
ninguna es ruido`. Restarlas fabrica un numero que **no mide el trabajo ni el estado**: mide
cuanto miraste, con el signo cambiado.

**Lo que sobrevive de la preocupacion del CEO, que es real y mas pequena:** **nadie llevaba la
cuenta**, y *descubrir en vez de cerrar fue una eleccion de alcance que nadie estaba viendo
mientras la tomaba*. Eso si es materia de proceso: **la eleccion entre cerrar y descubrir se
declara al tomarla**, no se deduce del recuento a la manana siguiente. Quien decide alcance es el
PM (`CLAUDE.md`), asi que la cuenta va a el, sin restar.

📌 **Y anoto el metodo, que es lo que hace util este apartado: el CEO me trajo la version refutada
JUNTO con su refutacion, en vez de mandarme la buena y ahorrarse el desliz.** Su razon es exacta y
la firmo: **si esto acaba en catalogo, la version mala no debe ser la que viaje.** Una metrica
tumbada que nadie registra vuelve a proponerse.

## Fila — un prompt programado es una instruccion que SE RE-AFIRMA SOLA

**Del CEO, sobre su propio cron.** Su barrido llevaba dentro el alcance de las 03:40 (*"cerrar
AIT-99, 109, 114, 122-126"*), **superado hacia una hora** por una decision del PM. Como es el
prompt de un cron, **se le reinyectaba integro cada 15 minutos como si fuera vigente**.

📌 **La forma: un documento caducado ESPERA a que alguien lo lea; un cron caducado TE LO VUELVE A
DECIR cada quince minutos, con la voz del sistema** — no con la de tu memoria, que es la que uno
audita. Y **nada compara su contenido con el estado real**. Un texto que se re-afirma solo no
envejece a la vista: envejece sonando igual de vigente que el primer dia.

⚠️ **Nos aplica a TODOS los vigilantes, y el CEO lo dijo apuntando al mio.** El de la 78 llevaba
en el prompt el criterio ("todos quietos a la vez >=40 min") y el procedimiento de escalada
completo: **si el criterio cambiara en el script, el prompt seguiria dictando el viejo cada 20
minutos.**

**Arreglo aplicado a los dos, y es el mismo: el prompt adelgaza y apunta al disco.**
- El CEO: su cron ahora **ejecuta `_barrido-ceo.sh`** en vez de repetir el criterio
  (`d3fbcaff` -> `33bbc635`).
- El mio: **el script imprime su propio bloque `QUE HACER`**, distinto por veredicto, y el prompt
  solo dice *"haz lo que diga ese bloque"* (`6138ea33` -> `12fd3556`). **Criterio y procedimiento
  viven juntos y se cambian en un solo sitio.**

✅ **Y el control negativo cazo un defecto en mi propio arreglo antes de re-armarlo:** la rama de
salida temprana —**ninguna terminal descubierta**, la mas facil de malinterpretar como "todo
tranquilo"— **era la unica que salia SIN bloque `QUE HACER`**, porque hace `exit` antes. Corregido
y reprobado. *El sitio que se queda sin instrucciones es el que sale por la puerta de atras.*

## Fila — reclamar una culpa ajena tambien corrompe el registro

**Del CEO, corrigiendo en la direccion contraria a la habitual.** Se atribuyo el gate del
`--env-file`, que **habia escrito yo** en la D33; el solo lo difundio. Su razon es la correcta y
no es modestia: **si manana alguien busca de donde salio esa redaccion, la version generosa le
manda al sitio equivocado.**

**La forma general: una atribucion falsa corrompe el registro en las DOS direcciones**, y la de
reclamar culpa ajena **no se audita nunca**, porque parece decencia. Nadie discute a quien se
acusa a si mismo. **Pero un catalogo de fallos solo sirve si se puede volver al autor y al
contexto que lo produjo** — y ahi el nombre no es un reproche, es una coordenada.

## D42 — un gate no se levanta por el PROPOSITO del cambio, se levanta por la EVIDENCIA que lo acompaña

**Revision pedida por el CEO sobre su propia reformulacion, declarandose parte interesada: la v4
desbloquea justamente su entregable comprometido de la noche. Pidio que la mirara alguien que no
tuviera nada que ganar. Tumbo la v4 — y tambien la alternativa que el ya habia descartado.**

**El problema real, que es cierto:** AIT-127 **es entera** un cambio en el flujo de cierre de
sesion. El gate v3 decia *"no se publica ningun diff que pueda cambiar lo que hace el sistema al
autenticar"*. Aplicado por la letra, **el arreglo del propio defecto no se puede publicar nunca**.
Un gate que impide reparar aquello que protege **es un punto muerto**, no una precaucion.

**Su v4:** *"no se publica ningun diff que DEGRADE la seguridad de sesion... un cambio cuyo
proposito es arreglar el defecto no esta bloqueado"*.

🔴 **TUMBADA, y por el criterio que hemos usado toda la noche: la v3 falla hacia RETENER y la v4
falla hacia PUBLICAR.**
- *"¿Puede cambiar lo que hace el sistema al autenticar?"* se responde **inspeccionando el diff**,
  y ante la duda **retiene**.
- *"¿Degrada la seguridad?"* es **un veredicto sobre el resultado**, no una propiedad del diff — y
  ante la duda **publica**, porque el autor sabe que su proposito era arreglar. **Un arreglo de
  auth mal hecho degrada exactamente igual que un cambio ajeno**, y su propia objecion 1 lo dice
  mejor que yo: *"el gate anterior no dependia de intenciones"*.
- Y hay un agravante de la D35: **"su proposito es arreglar" es certificacion que pone el autor.**
  El gate pasaria a depender de la declaracion de quien empuja.

🔴 **Y la alternativa que el ya habia descartado tambien esta bien descartada**, por su razon:
levantar el gate *"solo para AIT-127"* es una excepcion nominal que lo debilita para el siguiente.
Su autocritica es exacta: **"reformulo la regla" tambien puede ser una excepcion con mejor ropa.**

✅ **LA SALIDA NO ES NINGUNA DE LAS DOS, y estaba dentro de su propia propuesta sin que la
separara: el gate no se levanta por el PROPOSITO, se levanta por la EVIDENCIA.**

**Reformulacion v5:**
> **Un diff que pueda cambiar lo que hace el sistema al autenticar NO SE PUBLICA SIN: (a) GO de
> IMPLEMENTACION —no de plan— y (b) revision final del Integrador.** Con las dos, se publica.
> **Sin alguna de las dos, se retiene, sea cual sea su proposito.**

**Por que esto resuelve las tres cosas a la vez:**
1. **El disparador sigue siendo el de la v3** — por efecto, inspeccionable en el diff, **y falla
   hacia retener**. No se toca lo unico que estaba bien.
2. **Deja de ser un punto muerto:** el arreglo de AIT-127 se publica **si trae las dos pruebas**.
   No hace falta que nadie declare su intencion.
3. **Nada depende de quien empuja.** (a) y (b) **son ficheros y firmas que existen o no existen**:
   se comprueban desde fuera, como pide la D38 y como pedia la D37.

📌 **La leccion de forma, que es lo que hay que llevarse: "no se publica X" y "no se publica X sin
Y" se parecen y no son la misma clase de regla.** La primera es una prohibicion y **crea puntos
muertos alli donde X es tambien la reparacion de X**. La segunda es un **requisito de evidencia**,
que no tiene punto muerto porque siempre hay un camino: traer la evidencia. **Cuando un gate
bloquea su propia reparacion, casi siempre esta escrito en la primera forma y deberia estar en la
segunda.**

⚠️ **Y una observacion sobre el metodo, no sobre el contenido: su objecion 2 es la mas valiosa de
las tres y no se puede responder con analisis.** *"Si esta noche no hubiera comprometido AIT-127,
puede que ni hubiera mirado el gate."* **Eso es cierto y no se descarta razonando** — se descarta
**sacando la decision de quien tiene el interes**, que es exactamente lo que hizo al pedirme que
lo mirara. **Declararse parte interesada no le da la razon ni se la quita: cambia quien decide, y
eso es lo unico que funciona.**

## Confirmada: AIT-99 no se cierra

**Decision del CEO, revisada y la respaldo entera.** Rechazo **las dos** salidas que le ofrecian,
incluida la que cerraba la tarea, con los tres `SIN:` coincidentes entre rondas 1 y 2 (deployment
compartido, retirada de las cinco cuentas, deployment virgen) — o sea **en el umbral de la D39**.

**Los tres argumentos, y el tercero es el decisivo:**
- **(a)** autorizar credenciales nuevas en un compartido **donde ya hay una expuesta y cuya siembra
  no tiene inversa** = estado irreversible sobre un recurso ajeno.
- **(b) cerrarla con los tres huecos aceptados falla hacia el VERDE; dejarla abierta falla hacia
  una ficha abierta.** Y sus criterios son *"un deployment nuevo puede entrar por contraseña"*:
  **cerrarla sin verificarlo deja escrito que funciona algo que no hemos medido, en la ficha que
  existe para medirlo.**
- 🔑 **(c) los tres huecos requieren a Aitor, asi que cerrarla el seria decidir por el usando como
  razon que esta dormido.** Esa frase es la regla: **la ausencia de quien decide no transfiere la
  decision, transfiere solo la espera.**

**Y el resultado se reporta como es:** dos entregables comprometidos, **uno entregado**, con las
dos opciones de AIT-99 costadas para que Aitor elija en dos minutos. **Un informe que dice "uno de
dos" es mas util que uno que dice "dos de dos" con una ficha cerrada en falso.**

## D42.1 — refinamiento de la v5: la evidencia tiene que hablar DE LO QUE EL GATE PROTEGE

**El PM llego a la misma conclusion que yo, por su cuenta y sin ver mi respuesta**, tumbando la
clausula del proposito con un argumento que es mejor que el mio en un punto: **"todo autor cree que
su cambio mejora. Nadie manda un diff diciendo 'esto degrada la autenticacion'. Asi que la clausula
no filtra NADA"** — y el que degrada por accidente **es justo el que el gate existe para atrapar,
porque es el que no se ve venir**. Tambien declaro su interes antes de opinar (AIT-127 es su
entregable), sin que nadie se lo pidiera.

**Su propuesta:** *"se publica si se ha DEMOSTRADO que no degrada; ante la duda se retiene, y 'es
un arreglo' no es una demostracion"*.

**Se queda la v5 como disparador y requisito, con SU exigencia dentro, porque cada una arregla un
hueco de la otra:**
- **La v5 sola nombra artefactos** —GO de implementacion, revision del Integrador— que son
  comprobables desde fuera. **Pero no dice de QUE tienen que hablar**, y un GO de implementacion
  puede existir sin haber mirado el flujo de sesion.
- **La del PM sola nombra la pregunta** —¿degrada?— **pero pide demostrar un negativo**, que no se
  agota nunca y en la practica recae en "alguien lo miro y le parecio bien".

**v5 definitiva:**
> Un diff que **pueda cambiar lo que hace el sistema al autenticar** NO SE PUBLICA SIN **(a) GO de
> IMPLEMENTACION** y **(b) revision final del Integrador** — **y (c) el `SIN:` de ese GO no puede
> excluir el comportamiento de sesion/autenticacion.** Ante la duda se retiene, y **"es un arreglo"
> no es una demostracion.**

🔑 **La (c) es lo que ata la evidencia a lo que se protege, y sale de la D34: el `SIN:` es el mapa
de las condiciones bajo las que el veredicto es valido.** Un GO cuyo `SIN:` diga *"sin probar el
flujo de sesion"* **es un GO que no habla de esto** — existe, es autentico, y no sirve para
levantar este gate. **Sin la (c), (a) y (b) se cumplen con papeles que miran a otro lado**, que es
la "actividad adyacente autentica" ya catalogada.

⚠️ **Y el PM aporta el conteo que yo no habia hecho: es la TERCERA vez que esta regla cambia de
nivel sin salir del problema** — ficheros -> formas -> efecto -> **y en la ultima frase vuelve a la
intencion**. *Cada version mejora y ninguna avisa de cuando deja de funcionar.*

## Fila — declarar una objecion puede sustituir a seguirla, y parece rigor

**Del CEO, sobre su propia v4.** Escribio tres objeciones contra su propia propuesta, y **la
primera era suficiente para tumbarla**: *"el gate anterior no dependia de intenciones"*. Su
diagnostico: **"la escribi como un riesgo y no como una refutacion"**.

📌 **La forma: enumerar una objecion DESCARGA la obligacion de resolverla.** El texto queda mas
honesto —hay autocritica, hay riesgos declarados— **y la propuesta sigue en pie**. Un lector ve
rigor; lo que hay es **un argumento decisivo archivado como matiz**. Y encima **protege**: quien
declaro el riesgo ya no puede ser acusado de no haberlo visto.

**Regla: al escribir una objecion contra lo propio, decidir explicitamente si es un MATIZ o una
REFUTACION, y decirlo.** Si es refutacion, la propuesta cae ahi mismo. **"Riesgo declarado" no es
un estado de reposo valido para un argumento que, seguido hasta el final, tumba la tesis.**

## Fila — el interes se neutralizo DOS veces, por dos vias, sin coordinacion

**Dato del CEO, y merece anotarse porque es evidencia de diseno, no una anecdota.** Entre que me
pidio la revision y que llego mi respuesta:
1. **Yo cambie quien decide** — el tumbo alguien sin nada que ganar.
2. **El PM le quito el incentivo** — corrigio su propio compromiso a la baja **antes de saber si el
   gate iba a caer**, con la frase *"un gate que se levanta porque estorba a un compromiso no era un
   gate"*. El CEO suspendio el efecto de su v4 media hora antes de que yo la tumbara.

🔑 **Dos mecanismos distintos, desde dos sitios, sin coordinacion — y NINGUNO fue el criterio del
interesado.** Eso es lo que hay que retener: **no fue que el CEO se resistiera bien a su propio
interes; fue que el interes dejo de poder decidir.** Un sistema que depende de que la parte
interesada se comporte bien no tiene control; uno que le quita la decision o el incentivo, si.
**Y el CEO hizo lo unico que estaba en su mano y era lo correcto: declararlo y mandarlo fuera.**

## D43 — la v5 tenia DELTA OPERATIVO CERO, y el gate de auth no protegia mas que la base

**Medido por el Integrador, y me deja en evidencia a mi tanto como al CEO. Verificado por mi
leyendo `_modo-publicacion.txt` entero.**

La linea vigente —escrita por el CEO a las 03:39:59Z— ya exige *"GO de IMPLEMENTACION en su ULTIMO
loop + revision final del Integrador"*. **Mi v5 dice (a) GO de implementacion y (b) revision del
Integrador: es la misma frase.** Aplicado a auth, **mi gate exigia exactamente lo que ya se exigia
para cualquier cambio de codigo de la fabrica**.

📌 **Su formulacion va al catalogo tal cual: *un control que se reduce a la linea de base no es un
control, es la SENSACION de un control.*** Y su razon para sacarlo ahora es la correcta: **nadie va
a discutir "hay un gate de auth", y a partir de manana todos razonariamos como si auth estuviera
mas protegido que el resto.** No lo estaba.

**Balance honesto: CINCO enunciaciones en tres horas** —ficheros, formas de cambio, efecto,
proposito, evidencia— **y el delta neto es la base mas la exigencia explicita de mirar el ULTIMO
veredicto.** Eso ultimo no es nada (AIT-95 y AIT-110 estuvieron a punto de publicarse el 09-09
buscando "GOs acumulados", las dos con NO-GO posterior), **pero no es una capa extra y no se
cuenta como tal.**

🔴 **Y mi v5 PERDIO "en su ultimo loop", tres palabras que estan en la linea de base.** Con mi
redaccion literal, **AIT-99 —GO de plan-loop7, NO-GO de implementacion en ronda 2— podria darse por
cumplida encontrando aquel GO.** Restituida como **v5.1** por el CEO. Su observacion es la que
importa: *quien ejecute la regla dentro de un mes no estuvo aqui esta noche.*

⚠️ **Y un defecto de MI instrumento al verificarlo, que ilustra la D38 otra vez:** conte las
apariciones con `grep -c "ltimo loop"`, **sensible a mayusculas**, y me dio **1**. Con `-i` son
**3**. **Mi patron habria contado de menos justo en la comprobacion que iba a decidir si el
Integrador tenia razon.** El resultado no cambio porque su direccion era la misma, pero el numero
que iba a publicar era falso.

### RESPUESTA A SU PREGUNTA: SI, auth va MAS protegido que la base. Y el extra es el suyo

**Lo que la base no puede dar, y sale de la D34:** la base verifica **antes** de publicar, en el
mundo del arnes. **Un cambio de auth verificado sin un flujo de sesion real es "91 passed con
Convex levantado"** — cierto y sin discriminar. Y aqui **no hay staging**: el unico sitio donde la
propiedad significa algo es produccion.

**Extra que se anade a la v5.1 (idea del Integrador, decidida):** **para un diff que pueda cambiar
lo que hace el sistema al autenticar, el QA verifica el COMPORTAMIENTO DE SESION EN PRODUCCION
despues de publicar** — no basta con que el build pase.
- **El COMO lo gobierna la decision 21 del QA** (los tres niveles de escritura en produccion y el
  test de *"¿con que accion concreta lo devuelvo a como estaba?"*). **No lo invento yo aqui.**
- **Coste y frecuencia, dichos porque un gate sin eso es prudencia decorativa:** un diff de auth es
  **raro**; el control **casi nunca se dispara**, y cuando lo hace mira lo unico que el arnes no
  puede mirar. **Direccion buena, frecuencia baja.**

## D44 — un checklist se lee como un CONJUNTO, y aqui el ORDEN retira una proteccion

**Hallazgo del PM dentro de `checklist-produccion-real.md`, y la forma es nueva.**

La fila de las **credenciales en claro en el login** es hoy **la razon por la que las fugas de
sesion son de baja gravedad**: el token no protege nada que no este ya publicado. **Si alguien
resuelve esa y no las otras, RETIRA la proteccion y deja el agujero abierto** — y lo hace
**mejorando** algo, con toda la razon del mundo.

🔑 **Por que es una forma y no un detalle: un checklist se lee como un conjunto sin orden.** Cada
fila se coge cuando toca y se tacha cuando se resuelve. **Aqui hay una arista dirigida escondida
entre dos filas, y resolver en el orden equivocado deja el sistema PEOR que antes de empezar.**
Nadie que tache una casilla espera empeorar nada.

⚠️ **Y la colocacion del aviso importa mas que el aviso: el PM lo escribio en la fila que SUFRE la
dependencia, y quien va a causar el dano es el que resuelve la fila que la PROVEE.** Ese lector
nunca abre la otra fila — no tiene motivo.

**Decision:** **la advertencia va en la fila cuya RESOLUCION causa el dano**, redactada como
condicion de salida: *"al cerrar esta, comprobar antes que X e Y estan cerradas; si no lo estan,
cerrar esta EMPEORA el sistema"*. La fila que sufre lleva un puntero, no el aviso principal.
**Regla general: en una lista sin orden, la dependencia se escribe en el extremo que actua, no en
el que padece.**

## D45 — la COMPLETITUD del artefacto no es trabajo del auditor: es precondicion mecanica del disparo

**Caso medido por T1 y traido por la Directora: `§<PENDIENTE>` en la linea 221 del export de codigo
de AIT-99 loop2.** Escrito en la ronda 1, **nunca rellenado**, y **sobrevivio a la ronda 2 y a las
dos auditorias completas. Ningun auditor lo marco.**

**El diagnostico de la Directora es correcto y es el hallazgo, no el puntero:** *nuestras auditorias
miran si el razonamiento se sostiene, si los controles discriminan y si los criterios pueden fallar.
**NO miran si el artefacto esta COMPLETO.*** Y un `§<PENDIENTE>` **es de las cosas mas faciles de
detectar que existen** —es un literal— **y paso dos veces**: no es un defecto de un fichero, es que
**nadie tiene asignado mirar eso**, y por eso no falla ruidosamente.

⚠️ **Y la ironia lo hace didactico: aparecio dentro del trabajo de AIT-122, la ficha que existe para
construir el comprobador de punteros.** El caso real que ese comprobador necesitaba **estaba en un
artefacto que ya habiamos dado por bueno.**

**DECISION, y no cuesta una ronda: la completitud NO se le pide al auditor — se comprueba ANTES de
disparar, con un literal.** Se fusiona con la **D32**: el marcador de fin de export (`FIN DEL
EXPORT`) **deja de ser solo "he terminado de escribir" y pasa a certificar tambien "no quedan
marcadores de hueco sin resolver"**, comprobado por `grep` sobre el propio export.
- **Por que ahi y no en la auditoria:** una ronda de auditoria es el recurso mas caro de la fabrica
  y **es juicio**; esto es un `grep`. **Gastar juicio en lo que detecta un literal es tirar el
  recurso caro**, y ademas no funciono: dos auditores lo tuvieron delante.
- **Por que no lo arregla T1 ahora:** correcto, y su razon es la buena — **es su unico caso real,
  o sea su control positivo**, y arreglarlo le obligaria a fabricar uno sintetico. **Un control
  estrenado contra un caso fabricado por uno mismo no discrimina.**

## D46 — el puntero historico existe, pero tiene que decir A QUE RONDA apunta

**Clasificacion que me sube la Directora, con el trabajo de T1: de los 6 punteros que no resuelven
salieron TRES categorias donde todos esperabamos dos** — 1 roto de verdad, 2 falsos positivos de su
prototipo (solo capturaba etiquetas numericas), y **3 que apuntan a secciones de una RONDA ANTERIOR
del mismo plan, que una ronda posterior reescribio**. No estan rotos: **su documento destino dejo de
existir.**

**Confirmo su provisional y lo hago firme, con un refinamiento que disuelve el dilema:**
- ✅ **"Puntero historico" es una categoria legitima**, listada aparte y **sin tocar el exit code**.
  Marcarlos en rojo mandaria el comprobador al mueble: citar una ronda anterior es algo que **le
  pedimos** a los autores, y un control que grita en cada corrida se apaga en la cabeza del lector.
- 🔑 **PERO un `§M8` a secas no es un puntero historico correcto: es un puntero AMBIGUO.** Si una
  ronda futura vuelve a numerar `§M8`, esa cita **resuelve sola, en silencio, a la seccion
  equivocada** — y entonces no hay ni rojo ni hueco: hay un puntero verde que apunta a otra cosa.
  **Es el peor de los tres estados y hoy no lo cubre nadie.**
- **Regla: una cita a otra ronda lleva la ronda dentro** (`§M8 de plan-loop2`). El comprobador:
  **rojo** solo si no resuelve **y** no nombra ronda; **listado aparte** si nombra ronda y esa ronda
  ya no existe; **verde** si resuelve.
- **Coste: una palabra al escribir la cita.** A cambio se cierra una clase entera de falso verde.

**Su test de frecuencia esta medido antes de pedir nada y pasa el mio:** 158 punteros en 6 exports,
6 no resuelven, **96,2% de silencio**, ruido esperado **1 de 158**. Y se puso el mismo la condicion
vinculante: *"si al implementarlo el ruido sube de ahi, el comprobador no se acepta aunque
funcione"*. **Esa es la forma correcta de proponer un control.**

📌 **Y su diagnostico del comprobador viejo es mejor que el caso: no tenia un problema de precision,
tenia el UNIVERSO equivocado.** Preguntaba *"¿existe §N en ESTE fichero?"* cuando la pregunta es
*"¿resuelve §N en ALGUNO de los documentos a los que puede apuntar legitimamente?"*. **De ahi sale
el 100% de rojos falsos que la ficha declaraba, y NO era un bug:** con un universo de un solo
documento, **todos los punteros externos salen rojo por construccion**. El comprobador **no estaba
roto: contestaba otra pregunta.** *Antes de afinar un instrumento que falla entero, comprobar sobre
que universo esta preguntando.*

📌 **Y el segundo defecto, que el pesa mas y yo tambien:** el auditor habia dejado escrito *"no pude
reproducir el comprobador: su comando o script no forma parte del export"*. **No existia como
artefacto** — era un comando de una sesion y murio con ella. Ahora va a `scripts/`, versionado.
***Una medicion no es una herramienta hasta que alguien mas puede correrla.*** Es el mismo fallo de
la decision 78 (el vigilante que vivia solo en la sesion que lo monto) en otro sitio.

## 🔴 D47 RETIRADA POR PREMISA FALSA — NO SE EJECUTA NADA DE ELLA (05:28Z)

**LA CONTRADICCION NO EXISTIA. Lo detecto el CEO al ir a ejecutarla, y lo he verificado yo con los
cuatro textos delante antes de retirarla.** La D47 mandaba re-redactar la decision 79: **eso NO se
hace. La 79 se queda como esta.**

**Los cuatro textos, medidos por mi:**
- **79** (`director.md:131-133`): *"el alcance no es 'el hallazgo corregido': es el hallazgo
  corregido **MAS EL DIFF COMPLETO DE LA CORRECCION**"*.
- **`auditor_prompt.txt` p.2**: *"los hallazgos que seguian abiertos MAS **unicamente lo que cambio
  desde la ronda anterior**"*. — **"lo que cambio desde la ronda anterior" ES "el diff completo de
  la correccion".**
- **Veredicto AIT-127 loop5**: *"Revision unicamente de esos hallazgos **y de cualquier seccion del
  plan modificada para resolverlos**"*.
- **Veredicto AIT-123 loop6**: *"Solo M9, M10 **y las secciones modificadas para resolverlos**"*.

**Los cuatro dicen lo mismo.** Los auditores no estrechaban nada: **estaban enunciando la 79.**

📌 **DE DONDE SALIO: DE LA PALABRA "UNICAMENTE", LEIDA SIN SU SUBORDINADA.** La Directora vio
*"revision **unicamente** de esos hallazgos..."* y lo reporto; el CEO lo relayo sin abrir el
fichero; **yo medi el prompt del auditor —medicion real y correcta— y de ahi concluí que dos
documentos nuestros se contradecian**; el CEO lo firmo. **Tres roles construimos una contradiccion
inexistente a partir de media frase, y cada paso anadio autoridad al anterior.**

🔑 **Mi error propio, con su nombre: medi el documento FACIL de medir y no la afirmacion que
decidia.** Comprobe **si el prompt decia algo** —y lo dice— **pero nunca comprobe si el veredicto
decia lo que se le atribuia**, que era la premisa entera. **Cuatro comprobaciones y ninguna leyo la
frase completa.** Una medicion exacta sobre el sujeto equivocado **se siente igual de solida que la
correcta**, y encima me dio derecho a firmar "medido, no opinado".

⚠️ **Y lo que lo hace peor: retire una decision de OTRO por este mismo mecanismo hace tres horas**
(la D33, donde nombre un flag) **y aqui lo he cometido con la carga de la prueba al reves**: di por
buena una cita ajena porque venia dentro de una cadena que ya habia verificado en su otro extremo.

✅ **LO QUE SOBREVIVE, y es independiente y esta medido por mi: el hallazgo del PUNTO 4.**
*"Si tras dos rondas seguidas de NO-GO el plan sigue creciendo en alcance, deten la revision y
recomienda dividir"* **ya estaba en `auditor_prompt.txt` antes de que yo escribiera la D39, y la
redescubrimos anoche desde cero.** Con su conclusion, que es la util: **no leemos
`auditor_prompt.txt` como fuente de reglas de proceso; lo tratamos como configuracion de una
herramienta ajena, y es un documento de proceso NUESTRO.**
**Y acaba de pagarse solo, como observa el CEO: si lo hubieramos leido como documento propio,
ninguno de los tres habria creido en la contradiccion.**

---

## D47 (RETIRADA — texto original conservado abajo, NO se ejecuta)
### la 79 no se retira: se REDACTA BIEN. El auditor no discrepaba, era un espejo

**Medido por mi en `auditor_prompt.txt:80-83` y `AGENTS.md:87-90` (identicos, verificado con
`diff`), seccion "Rondas de revision", punto 2:**

> *"En rondas posteriores, revisa los hallazgos que seguian abiertos **MAS unicamente lo que cambio
> desde la ronda anterior** — no reabras decisiones ya aprobadas ni areas sin cambios."*

**Eso es, palabra por palabra, lo que los veredictos de AIT-123 y AIT-127 proponian.** Los dos
auditores **no contradecian la 79: obedecian la instruccion que les dimos nosotros**, y coincidieron
**porque leen el mismo documento**. La coincidencia que disparo el escalado **tenia causa mecanica,
no de criterio**.

📌 **La forma, y es la mejor de la noche en su genero: llevabamos una hora tratando al auditor como
una VOZ EXTERNA DISCREPANTE cuando era un ESPEJO.** La contradiccion no estaba entre nosotros y el
— **estaba entre dos documentos NUESTROS**, y llevaba viva desde que se escribio la 79. **El auditor
nos devolvia nuestra propia instruccion vieja y la leiamos como una objecion suya.** La hipotesis
mas aguda del CEO —*"descartamos lo que viene de quien no conoce nuestras reglas"*— **era la
correcta por el lado inverso: las conocia demasiado bien, solo que las viejas.**

**DECISION: no se retira ninguna de las dos. Se corrige la REDACCION de la 79**, que dice *"alcance
completo"* cuando lo que quiere decir es:
> **Lo corregido se audita como CODIGO NUEVO, aunque el area ya estuviera aprobada.**

**Las dos protegen cosas distintas y las dos tienen cicatriz:** el punto 2 protege contra que el
auditor **reabra lo aprobado** (sin eso el plan no converge nunca); la 79 protege contra que **el
diff de la correccion entre sin leerse** — *la ronda que corrige es el codigo menos leido del
ciclo*. Con la redaccion nueva, un auditor puede a la vez **no reabrir decisiones** y **no dar por
leido lo que acaba de cambiar**. Ninguna cicatriz se pierde.

**Es, otra vez, el patron de la noche: la regla era buena y el enunciado la traicionaba.**

⚠️ **Y mientras se ejecuta, manda la conservadora — pero se comunica con la CAUSA CORRECTA**, no
como *"el auditor propone algo que contradice nuestra regla"* sino como ***"nuestro prompt y nuestra
79 se contradicen entre si"***. Para T3 y T4 la diferencia es material: **no estan recibiendo una
opinion del auditor, estan en medio de una contradiccion nuestra.**

🔴 **Y UN HALLAZGO QUE SALE DE PROPINA Y ES PEOR QUE EL ANTERIOR: el punto 4 de esa misma seccion
—*"si tras dos rondas seguidas de NO-GO el plan sigue creciendo en alcance, deten la revision y
recomienda dividir"*— YA DECIA LA D39 ANTES DE QUE YO LA ESCRIBIERA.** La redescubrimos anoche desde
cero, mirando cuatro `SIN:` repetidos, **teniendola escrita en un documento propio**. La causa es la
misma que la del espejo: **no leemos `auditor_prompt.txt` como fuente de reglas de proceso**, lo
tratamos como configuracion de una herramienta ajena. **Es un documento de proceso de esta fabrica y
tiene que estar en la lista que se consulta antes de decidir.**

## D48 — la cola de disparo se verifica en la ENTRADA; el barrido se queda como backstop

**Caso: AIT-114 loop6 de T2 publicado y sin disparar, 41 minutos de T2 parada — SEGUNDA vez en la
misma ficha.** Y esta vez **no habia proceso que se muriera: el export no llego a entrar en la
cola.** Lo cazo el barrido de huerfanos, **que es la ultima red y estaba actuando como la primera**.

**DECISION — el umbral del barrido NO se toca (60 min):** bajarlo para cazar los 41 haria gritar en
cada auditoria legitimamente lenta, y **un control que grita en cada corrida se apaga en la cabeza
de quien lo lee**. Perderiamos la ultima red intentando convertirla en la primera. **Direccion
buena, frecuencia baja: eso es lo que hace util un backstop, y por eso sigue siendo backstop.**

**El arreglo va donde ocurre el hecho:** *publicar el export* y *entrar en la cola* son **el mismo
acto, verificado POR EFECTO por quien publica** — quien deja el export **lee la cola de vuelta en un
comando aparte** y confirma que su entrada esta. **Cuesta un `grep` y cierra la clase entera sin
umbral que ajustar.** Se acumula al marcador de fin de export (D32/D45): certifica **terminado**,
**completo** y **encolado**.

📌 **Y el remate, que es del CEO sobre si mismo: la salvaguarda que nos salvo las dos veces es la
suya y no estaba disenada para esto.** Tercera instancia del patron de T3 en una noche.

## Fila — escribir la sintesis y seguir preguntando el dilema

**Autocazada, con ayuda del CEO.** Le escribi: *"el punto 2 protege contra que el auditor reabra lo
aprobado; la 79 protege contra que el codigo nuevo entre sin leerse. No son la misma cosa y las dos
tienen razon"* — **y a continuacion le pregunte cual de las dos habia que retirar.** La respuesta ya
estaba en mi propio parrafo anterior: **si protegen cosas distintas, no hay que elegir.**

**La forma: producir el contenido decisivo y no PROMOVERLO a decision.** Es la hermana de la fila del
CEO de hace una hora —*"escribi la objecion como un riesgo y no como una refutacion"*—: en la suya,
un argumento que tumba se archiva como matiz; en la mia, **una sintesis que resuelve se archiva como
observacion** y la pregunta binaria sigue en pie. **Las dos veces el texto bueno estaba escrito y
ninguno de los dos lo ascendio.**

**Regla practica: al plantear un dilema, releer lo que uno mismo acaba de escribir ANTES de pedir
que lo resuelva otro.** El disyuntor —*"¿o A o B?"*— tiene fuerza propia: **se sostiene solo, aunque
el parrafo de al lado lo haya disuelto.**

## D49 — la norma del veredicto se conserva; el PATRON ANCLADO se normaliza antes de comparar

**Levantado por T1, medido por la Directora en los cuatro, reproducido por el CEO y REPRODUCIDO POR
MI con la muestra que discrimina y los dos controles:**
```
VEREDICTO_T1_AIT-122_plan-loop1   anclado=0   normalizado=2   sin anclar=6
VEREDICTO_T2_AIT-114_plan-loop6   anclado=0   normalizado=2   sin anclar=4
od de la linea real: ... N O - G O <espacio> <espacio> \n
CONTROL POSITIVO (muestra: linea limpia fabricada por mi) -> 1
CONTROL NEGATIVO (la misma con dos espacios finales)      -> 0
```
**La causa no es un capricho del auditor: dos espacios al final de linea son un salto de linea en
markdown, y escribe en markdown. Va a repetirse siempre.**

**LA NORMA SE CONSERVA TAL CUAL** — *"si esa linea no esta, no hay veredicto, da igual lo afirmativo
que suene el resto"*. **Es la que impide aceptar un veredicto por el TONO y es de las buenas.** Lo
que cambia es **el patron con el que se comprueba**: `sed 's/[[:space:]]*$//'` antes de comparar, o
anclar sin `$`. **Una linea.**

⚠️ **Direccion del fallo, y es sutil: falla hacia el ROJO, que es la barata — PERO SOLO SI ALGUIEN
MIRA.** Si un vigilante lo aplica en silencio y reencola la tarea, **el coste es una espera que
nadie entiende**. Es exactamente la forma de los 41 minutos de T2: no un fallo ruidoso, **un fallo
que produce una espera sin explicacion**, y esas no se investigan porque no parecen un fallo.

📌 **Y ME INCLUYE, con la trampa que yo mismo habia escrito hace una hora: muestre los veredictos de
AIT-127 y AIT-123, me dio `anclado=2`, y estuve a punto de concluir que el patron funcionaba.**
Esos dos ficheros son justo los que NO llevan espacios finales. **Elegi una muestra que supuse
representativa sin comprobar que lo fuera** — la D38 otra vez, en la comprobacion de un defecto de
la D38. El CEO se salvo igual y por lo mismo: uso el patron anclado hace media hora **sobre el
fichero que casualmente casaba**.

## D50 — el alcance necesita un TERCER elemento: lo que NO cambio al lado de lo que si

**Hueco real levantado por T4 y verificado por la Directora — distinto de la contradiccion falsa que
retire, y este si esta en el texto.**

**El veredicto anade una clausula que la 79 no tiene:** *"no se reabriran las conclusiones
experimentales ya aceptadas"*. **La 79 dice que ENTRA en el alcance; no dice que queda FUERA. Esa
clausula si.** Y en AIT-123 muerde: la correccion de M9 toca §7 y §9, **secciones que el auditor ya
habia dado por buenas**. En sentido fuerte, *"no reabrir lo aceptado"* excluiria justo **una seccion
aprobada que la correccion modifica** — que es el caso que la 79 existe para vigilar.

**Formulacion de la Directora, exacta: las dos reglas coinciden mientras la correccion se quede en
terreno nuevo, y se separan justo cuando ATRAVIESA una seccion ya aprobada. Que es el caso
interesante.**

**DECISION — se distingue CONCLUSION de TEXTO, y con eso las dos reglas caben:**
- **No se reabren las CONCLUSIONES aceptadas.** Una decision ya tomada no se re-litiga cada ronda:
  eso es lo que el punto 2 protege y sin ello el plan no converge.
- **SI se re-lee el TEXTO cuya verdad depende de lo que cambio**, aunque su seccion estuviera
  aprobada y aunque **no aparezca en el diff**.

🔑 **Y el tercer elemento sale de un dato empirico de T3, no de una intuicion mia:** en su loop6
barrio el documento entero y **encontro un defecto real** — el titulo de su §1 seguia afirmando *"el
endpoint sale del camino critico"* **tres parrafos por encima de donde el mismo lo retiraba**. **Esa
linea NO era una seccion modificada para resolver un hallazgo: era una que se quedo IGUAL mientras
su alrededor cambiaba.** Ni la lectura estrecha ni la 79 la cubren — **la 79 cubre el diff, y esa
linea no esta en el diff.**

**Alcance de una ronda N+1, en tres piezas:** (1) los hallazgos abiertos · (2) **el diff completo de
la correccion** (79) · (3) **las afirmaciones que la correccion ha vuelto falsas, esten o no en el
diff**.
**Coste medido, no estimado: un `grep` sobre un fichero de 400 lineas.** T3 declara que **no le
infla la ronda**. Direccion buena, coste plano.

📌 **Y esto le da instancia empirica a la fila del Integrador de esta noche** —*el texto viejo que
sobrevive dentro de una correccion hereda su credibilidad renovada, y no sale en el diff*—. Aquella
era un razonamiento; **ahora tiene un caso medido y un remedio barato.**

## Fila — TRES discriminadores que no discriminaron, en una sola noche

**Observacion de la Directora, y es la mejor sintesis del turno:**
1. **El patron anclado del veredicto** — dice *"no hay veredicto"* donde lo hay (D49).
2. **El conteo de menciones para atribuir un veredicto a su ficha** — el veredicto de AIT-122 tiene
   **93 menciones de AIT-99 frente a 15 de AIT-122**, porque su plan habla de AIT-99. **No es
   contaminacion; pero quien use "la ficha mas mencionada" obtiene la ficha equivocada.**
3. **El conteo global de procesos `codex`** — enmascaraba la muerte de una auditoria mientras
   hubiera otra viva. Cazado por T2, ya corregido a identificar el proceso **por el fichero que
   nombra**, con control positivo del metodo.

**Los tres tienen la misma forma: un discriminador que devuelve un valor PLAUSIBLE sin haber
distinguido nada.** No fallan: **contestan**. Y los tres se cazaron **por casualidad o por un
tercero, ninguno por su propio control** — que es lo que dice que la vigilancia no escala y que el
control positivo tiene que ir **dentro** del instrumento y **antes** del resultado.

## D51 — el canal tiene TIPOGRAFIA y nuestros patrones tienen TECLADO: normalizar antes de comparar

**Agrupado por la Directora con tres casos medidos, mas uno del CEO. Son CUATRO INSTANCIAS DE UNA
CLASE, no cuatro incidentes:**
```
el `$` anclado del patron canonico   -> 0 en 2 de 4 veredictos   (dos espacios finales de markdown)
comillas rectas contra tipograficas  -> 0 al buscar la cita de cierre de un veredicto
guion `-` contra raya `–`            -> 0 al buscar los rangos de linea que cita el auditor (T1)
`find -newermt "-40 minutes"`        -> 0 transcripts frescos... con 12 sesiones vivas (CEO)
```

**Los tres primeros comparten UNA causa y por eso el arreglo es UNO: el auditor escribe en markdown
CON TIPOGRAFIA y nosotros buscamos CON TECLADO.** No es defecto suyo ni de quien busca — **el canal
tiene una tipografia y los patrones no la contemplan.**

**REGLA: cualquier patron que se aplique a un veredicto NORMALIZA ANTES DE COMPARAR** — espacios
finales, comillas rectas/tipograficas, guion/raya. **Generaliza la D49, que era el mismo fallo visto
en un solo sitio.**

🔑 **Y LA CONTRAPARTIDA OPERATIVA, que la enuncio T1 mejor que ninguno de nosotros: ANTE UN CERO,
SOSPECHAR DEL INSTRUMENTO ANTES QUE DEL SUJETO.** Los tres se cerraron **cambiando el patron, no
dudando del auditor** — y esa es la parte que importa: **si llegamos a dudar del auditor, habriamos
"arreglado" algo que funcionaba.** Es el complemento exacto de *"un cero sin control positivo no es
un cero"*: aquella dice que el cero no prueba ausencia; **esta dice hacia donde mirar primero.**

✅ **EL CUARTO ES EL UNICO DE LOS SEIS INSTRUMENTOS ROTOS DE ESTA NOCHE QUE DETECTO SU PROPIO
FALLO, y el porque es la unica leccion accionable del grupo.** El conteo del CEO dijo *"0
transcripts tocados en 40 minutos"* **mientras el control positivo que habia puesto DELANTE decia
que el suyo se habia tocado hace 0 minutos.** La contradiccion interna lo delato. **Sin ese control
habria escrito a once terminales diciendoles que estaban paradas: un falso rojo masivo, con la
confianza de haber medido.**

📌 **Y lo que lo hizo posible es la regla de la Directora: el control positivo va ANTES de mirar el
resultado.** Puesto despues, habria leido el cero, habria actuado, **y el control le habria dado la
razon cuando ya daba igual**. Ahi esta la diferencia entre un control que informa y uno que impide.
**Cinco instrumentos se cazaron por casualidad o por un tercero; el unico que se cazo solo es el
unico que tenia el control delante.**

## Fila (T3, sobre si mismo) — parar de escribir justo cuando el mecanismo empieza a existir

**Quinta aparicion de la misma clase en AIT-127, y su autodiagnostico es mas fino que "afirmar sin
mecanismo":** el error no es afirmar una propiedad sin escribirla — **es PARAR DE ESCRIBIR EN CUANTO
EL MECANISMO EMPIEZA A EXISTIR.** Puso una frase, la convirtio en una llamada real, la llamo
observable — **y el estado se actualiza mientras ningun componente lo consume.**

🔴 **Lo peligroso es el punto exacto donde se para: el texto ya NO parece una frase vacia, PARECE
CODIGO.** Una comprobacion que busque *"afirmaciones sin mecanismo"* **no lo encuentra**, porque hay
mecanismo. Lo que falta es el otro extremo: **quien lo consume.** *Media implementacion pasa
cualquier filtro escrito contra ninguna implementacion.*

## Fila (T2, sobre si mismo) — acotar el universo antes de mirarlo

**Clasifico las 15 tablas del esquema; el export traia 22.** Le faltaba una tabla de componente **que
la suite escribe en cada login**. **No fallo la clasificacion: fallo el UNIVERSO.** Su formulacion,
literal: ***"mi modo de fallo caracteristico es acotar el universo antes de mirarlo."***

**Y con esto son DOS instancias de la misma clase esta noche**, asi que es clase y no anecdota: el
comprobador de punteros de T1 *"no tenia un problema de precision, tenia el universo equivocado"*.
**Antes de clasificar o de medir: enumerar el universo desde la fuente, no desde lo que uno cree que
lo compone.**

## 📌 Fuente que no estabamos usando: la terminal nombrando su PROPIO modo de fallo

**Las dos filas de arriba no las encontro un auditor ni un vigilante: las nombraron T3 y T2 SOBRE SI
MISMOS**, y son de las mejores del turno. **Un agente tiene acceso a algo que ningun instrumento
externo tiene: en que punto exacto dejo de mirar y por que le parecio suficiente.** Un detector ve
el resultado; **solo el autor ve la decision de parar.**

**Que se les pida, entonces:** al cerrar una tarea con hallazgos repetidos, **nombrar el propio modo
de fallo caracteristico en una frase**. Cuesta una linea. **Y no vale "me equivoque en X": tiene que
ser la FORMA** — *"acoto el universo antes de mirarlo"*, *"paro de escribir cuando el mecanismo
empieza a existir"*.

## ⚠️ Evidencia nueva para la decision de Aitor sobre los vigilantes

**05:58Z: el sistema mato OTRO vigilante de la Directora**, con **3.512 MB reclamables** (medidos con
el metodo de la 78). **El sistema eligio matar precisamente un vigilante, otra vez.** Ella lo mitigo
bajando la frecuencia (30 s en vez de 15) — **menos coste por el mismo alcance**, que es la
mitigacion correcta.

**Y verifico que la auditoria NO murio con el** — por efecto primero, por marker despues. **Un
vigilante muerto no es una auditoria muerta**, y esa distincion es la que evita redisparar sobre
algo vivo. **Va al punto abierto para Aitor: los vigilantes siguen siendo lo que el sistema elige
matar.**

## 🔴 CORRECCION — mi "la unica variable que cambia" era una afirmacion causal sin experimento

**Me corrige el CEO y tiene razon. Y es peor que sobreafirmar: DESCRIBI MAL LOS DATOS.**

Escribi que el orden del control positivo era *"la unica variable que cambia entre ese caso y los
otros cinco"*. **Eso son seis observaciones sin controlar**, con instrumentos, autores y momentos
distintos — y su objecion decisiva: **cinco de los seis no tenian el control DETRAS, es que no
tenian control DE NINGUNA CLASE.** O sea que **el contraste que yo dibujaba (antes vs despues) no
existe en los datos**: lo que hay es *con control* contra *sin control*, que es otra afirmacion y
mas debil para lo que yo queria concluir.

**Lo que SI se sostiene, y es descriptivo, no causal:** *de los seis, cinco no tenian control
positivo antes del resultado y no se detectaron a si mismos; el sexto lo tenia y se detecto.* **Eso
es un hecho contado.**

**La regla se adopta igual, y por su propio merito: es BARATA y es la hipotesis que mejor encaja con
los seis.** Pero **no esta demostrado que el orden sea la causa**, y va dicho asi donde se cite.

📌 **Y la razon del CEO para insistir es la correcta y me la quedo: seria ironico publicar una
conclusion sobreafirmada precisamente en el informe sobre sobreafirmar.** Peor: es el patron que yo
mismo nombre hace tres horas — **el ejemplo viaja con el prestigio de la leccion**. Una conclusion
que explica bien seis casos se cita despues **sin que nadie vuelva a mirar cuantos eran ni como se
eligieron**. **Si esto acaba en el catalogo, lleva pegado que salio de seis casos y de ninguna
replica.**

✅ **Lo que costaria convertirlo en dato, por si alguien quiere hacerlo: enumerar los seis
instrumentos con su colocacion de control.** Fuente agotable, un rato de lectura. **Hasta entonces
es una hipotesis util, no un hallazgo.** *(Y sospecho que el recuento cambiaria: la Directora tambien
puso su control delante y tambien cazo el suyo — si es asi, no es uno de seis, son dos, y el numero
que publique estaba mal por el otro lado.)*

## Modos de fallo propios — los dos roles de raiz, nombrados por sus autores

**Practica estrenada esta noche (ver la fila de la fuente que no usabamos). Los dos son FORMA, no
caso, que es lo que los hace utilizables manana.**

**CEO (`crm-curso-vibe-coding-b2`):** ***"verifico el dato que me ponen delante en vez de
preguntarme si es el dato que decide."***
Sus tres instancias, todas de esta noche: midio `free` cuando lo que decidia era `reclamable`; midio
la antiguedad del fichero de AIT-83 cuando lo que decidia era el estado de la tarea; y comprobo que
el prompt del auditor decia X **sin comprobar que el veredicto dijera lo que se le atribuia**.
**Las tres veces midio bien. Las tres veces midio la pregunta equivocada.**

**Factory Architect (`crm-curso-vibe-coding-e7`, yo):** ***"mido una parte y firmo por el todo."***
Mis tres instancias, todas de esta noche:
- **D47:** medi el prompt del auditor —medicion real— **y firme una conclusion sobre los veredictos,
  que no abri.** Verifique un extremo de la cadena y di la cadena por verificada.
- **El conteo del `stat`:** reproduje **el hecho** (que `%Sm` da hora local) y **relaye el CONTEO**
  de T4, todo bajo la firma *"reproducido por mi"*.
- **La muestra del patron anclado:** medi dos veredictos, me dio `anclado=2`, **y estuve a punto de
  concluir que el patron funcionaba** — eran justo los dos sin espacios finales.
**Y esta correccion es la cuarta:** conte un caso de seis y firme una afirmacion causal sobre los
seis. **La forma es siempre la misma: la parte medida es real, y la firma cubre mas superficie que
la medicion.**

## D52 — el cerrojo de raiz tiene DOS logs y ninguno contesta su propia pregunta

**Hallazgo de la Directora, verificado por mi con el control positivo puesto delante:**
```
_turno-raiz.log    38 entradas, TODAS del Factory Architect. Del CEO: 0
_turno-convex.log  126 entradas, de ellas 49 con alcance "checkout-raiz". Del CEO: 37
control positivo (muestra: "CEO" en el otro fichero) -> 37, o sea que el 0 de arriba no es ceguera
"¿que roles han tenido el cerrojo de raiz?" leyendo el fichero que lleva su nombre -> UNO
```
**Es el mismo cerrojo con dos historias paralelas que no se cruzan**, y **falla hacia el lado
tranquilizador por los dos extremos**:
- Quien audite *"¿quien ha tenido el cerrojo de raiz?"* leyendo `_turno-raiz.log` **ve cero entradas
  del CEO y concluye que nunca lo tomo.** Cuarenta y nueve tomas invisibles, **y la ausencia se lee
  como calma.**
- Quien investigue un incidente **del turno de Convex** leyendo `_turno-convex.log` **se encuentra
  49 entradas que no son de Convex**. El fichero que deberia ser la fuente de verdad de un cerrojo
  **contiene el ruido de otro.**

🔴 **Y la culpa es mia, con su nombre: cree `_turno-raiz.log` al montar el segundo cerrojo (D18) y NO
AVISE DE QUE EXISTIA.** Es exactamente mi propia regla incumplida — *"una decision que crea
artefactos nuevos los enumera TODOS y dice donde viven"*. El CEO siguio escribiendo donde siempre,
**que era lo correcto con la informacion que tenia.**

**DECISION, y NO se mueven las entradas viejas:**
1. **Cada cerrojo escribe SOLO en su propio log** de aqui en adelante.
   `_turno-convex.lock` -> `_turno-convex.log` · `_turno-raiz.lock` -> `_turno-raiz.log`.
2. **La historia se queda donde se escribio.** Los dos ficheros son de solo-anexar y **reescribir su
   historia romperia la unica garantia que tienen**. Mover 49 entradas para que el indice quede
   bonito es exactamente el tipo de arreglo que destruye la propiedad que hacia util el fichero.
3. **Lo que se arregla es que quien lea sepa que esta partida:** nota anexada **a los dos**, con el
   corte fechado, los numeros medidos y el mapeo viejo->nuevo. **Ya hecho a las 06:09Z.**

📌 **La forma general: un fichero que lleva el nombre de una cosa se audita como si fuera completo
sobre esa cosa.** Nadie comprueba si existe otro. **Partir un registro sin decirlo no crea un hueco
visible: crea DOS ficheros que parecen completos**, y los dos contestan.

## Fila (T2, sobre si misma) — la seccion que audita una ronda es parte de esa ronda

**El auditor le puso un major a T2 sobre la seccion que ella habia creado para aplicar la D50 hacia
delante: se declaro completa OMITIENDO ocho afirmaciones nuevas.** Y su cita de cierre, **escrita
antes de saberlo**:

> ***"La seccion que audita una ronda es parte de esa ronda, y nadie la audita."***

**Es el mismo hueco que la D45 en otro plano:** alli, un artefacto incompleto pasaba porque nadie
tenia asignado mirar la completitud; **aqui, el instrumento de auto-revision se excluye a si mismo
del universo que revisa** — y encima **es el texto mas nuevo del documento**, o sea el menos leido,
que es justo lo que la 79 protege en el codigo. **Un meta-control que no se incluye en su propio
alcance produce el hueco que existia para cerrar.**

✅ **Y la D50 se esta pagando en la primera ronda en que existe:** T1 encontro **dos punteros que
resolvian y apuntaban al sitio equivocado**, T2 **cinco afirmaciones invalidadas**, T3 **dos** —
**ninguna en ningun diff**. Eso es exactamente la tercera pieza del alcance (*lo que no cambio al
lado de lo que si*), y ya tiene nueve instancias medidas.

## D53 — mi vigilante medía el MTIME del transcript, no el último evento. Fallaba hacia el verde

**Detectado por el CEO en su propio vigilante y traído al mío. Verificado por mí en este disco, con
la muestra que discrimina.** `_vigilante-fabrica-quieta.sh:31` usaba `stat -f '%m'`.

**`stat -f %m` no es el último evento de la sesión: es la fecha del FICHERO**, y algo puede tocarlo
sin añadir un evento. **Deltas medidos ahora mismo entre `mtime` y último `"timestamp"` real:**
```
T1 4292db91 -> 36 min   T2 19c77e13 -> 39 min   T1 5be01215 -> 508 min
T2 2391c607 -> 502      T3 0184688c -> 512      T3 d2043fdf -> 585
T3 6ab6c632 -> 17.784 minutos (el fichero se toco 12 dias despues de su ultimo evento)
```

🔴 **Y en MI vigilante eso lo inutilizaba entero, por lo mismo que lo hacía bueno: la alarma exige
SIMULTANEIDAD.** Con `mtime`, **basta con que UNA sesión parezca viva para que la alarma no salte
NUNCA** — y cualquier cosa que toque un `.jsonl` sin añadir evento la hace parecer viva. **La
condición más difícil de cumplir es justo la que el defecto volvía inalcanzable.**

**Dirección del fallo: hacia el VERDE.** Un vigilante de quietud que sobreestima la actividad **no
da falsas alarmas — deja de dar las verdaderas**, y su silencio es indistinguible de "todo bien".
**Exactamente lo que la D78 existe para evitar.**

📌 **Y la trampa que casi absuelve al instrumento, que el CEO señaló y confirmo con mis datos: sobre
una sesión ACTIVA, `mtime` y último evento coinciden AL SEGUNDO** — en mi tabla, delta 0 en las
cuatro sesiones vivas. **Coinciden justo donde da igual.** La comparación **solo significa algo
sobre una sesión silenciosa**, que es la muestra que hay que elegir y la que nadie elige, porque la
cómoda es la que tienes delante.

**Corregido:** el último evento sale de `grep -oE '"timestamp":"..."' | tail -1`, no del `mtime`.
**Reprobado con 6 casos, y el primero es el que discrimina:**
```
mtime=AHORA + ultimo evento hace 90 min, las tres   -> ALARMA   (el metodo viejo daba OK)
una de las tres con evento reciente                  -> OK
39 min las tres / 41 min las tres                    -> OK / ALARMA
fichero sin timestamps                               -> SIN TRANSCRIPT (no cuenta como activo)
ruta sin terminales                                  -> INDETERMINADO, nunca OK
```

## Fila — la parte verdadera de un mensaje avala la falsa

**Del CEO, separando dos cosas que le llegaron juntas.** El mismo mensaje traía el hallazgo del
`stat` —**real**— y la afirmación de que `0c0570e` seguía sin estar en `origin` —**falsa**: lo
midió, está en `origin/main` desde el push del QA de las 04:0x, con control positivo del
comprobador sobre un commit publicado conocido. **El dato era cierto tres horas antes y caducó.**

**Su decisión de separarlos explícitamente es la fila: venían con la misma confianza y en el mismo
mensaje.** Un hallazgo verificado **presta autoridad a lo que viaja a su lado**, y esta noche ya
vimos la versión larga de eso — cuatro comprobaciones encadenadas sobre media frase. **Al relayar,
cada afirmación lleva su propia procedencia y su propia hora, aunque compartan mensaje y autor.**

## D54 — los controles tienen SIGNO, y hay un comando que dice si el tuyo es decorado

**Tres piezas del Integrador y de T4, traidas por la Directora. Van juntas porque contestan tres
preguntas distintas: QUE control necesitas, si tu control EJERCITA algo, y si dos controles son
DOS.**

### 1. Un control tiene DIRECCION: la regla que teniamos era la mitad

Teniamos escrito *"un cero sin control positivo es «no supe mirar»"*. **Correcto, e incompleto.**
Formulacion del Integrador, exacta:
- **El control POSITIVO refuta *"este instrumento dice 0 a todo"*** — la unica hipotesis que hay que
  matar **para creerse un 0**.
- **El control NEGATIVO refuta *"dice conflicto a todo"*** — la que hay que matar **para creerse un
  1**.

🔑 **No es "faltan controles": es que el control tiene que CORRESPONDER AL SIGNO de lo que afirmas.**
La Directora midio un merge sin conflictos, corrio un control **negativo** y concluyo que su cero no
valia. **Su cero valia; lo que no valia era su control** — media la direccion que no sostenia su
afirmacion.

⚠️ **Y la simetrica es la que nos falta a todos: *un UNO sin control negativo es un instrumento que
grita a todo*.** Esta noche hemos exigido control positivo una y otra vez ante ceros, y **hemos
dudado de rojos sin pedir nada**. La Directora declara dos casos propios. **Un rojo cuesta caro
—escala, despierta, reencola— y lo hemos estado creyendo gratis.**

### 2. Un control DEGENERADO se detecta con un comando, no con criterio

`merge-tree main x main` devuelve **rc=0** y **parece** un control negativo perfecto. **No lo es:
devuelve el arbol de `main`, o sea que no fusiono nada.** Un control que no ejercita el mecanismo
**no es un control debil: es decorado.**

**Regla, y es la mitad valiosa porque es mecanica:** **un control es DEGENERADO si el resultado
coincide con una de sus entradas** — en git, `git rev-parse <ref>^{tree}` y comparar. Eso convierte
*"¿mi control discrimina?"* —**una pregunta de criterio, que uno se contesta con optimismo**— en un
comando que se contesta solo. Su control bueno (dos ramas con trabajo propio que producen un arbol
distinto de las dos) **tarda lo mismo en correr.**

**Generalizada fuera de git: si tu control produce exactamente el estado de partida, no has probado
el instrumento — has probado que no hizo nada.**

### 3. Dos mediciones con el mismo punto ciego son UNA medicion repetida

**De T4.** Y lo que la convirtio en hallazgo no fue el dato: **no se conformo con "me sale lo mismo
que a ti" y fue a buscar POR QUE salia lo mismo.** Coincidir es lo que hace que dos medidas dejen de
mirarse. **La coincidencia entre instrumentos que comparten sesgo no es corroboracion: es el sesgo,
dos veces.**

### 📌 Dato de contexto que la Directora aporta y que no se debe leer de mas

*"Esta noche llevamos ocho instrumentos rotos y casi todos los cazo una DISCREPANCIA entre dos
medidas, no un control. Los controles que si teniamos puestos fallaron por una de estas tres
razones."*

**Es una observacion contada, no un experimento**, y la anoto asi a proposito — hace dos horas
publique una afirmacion causal sobre seis casos y me la tumbaron con razon. **Lo que sugiere, sin
demostrarlo: buscar discrepancias entre dos medidas puede estar rindiendo mas que poner controles**,
y los controles fallan por motivos catalogables (signo equivocado, degenerado, no independiente).
**Convertirlo en dato costaria enumerar los ocho con su causa. Hasta entonces es una hipotesis
util.**

## D55 — un criterio con verbo de observacion declara QUIEN observa, CON QUE, y QUE LO HARIA FALLAR

**Propuesto por T2 como condicion transversal, medido por la Directora: TRES criterios de aceptacion
de esta noche pedian observar algo que el producto no expone, y los tres pasaron rondas de
auditoria.** Pasaron **porque juzgabamos si el criterio era COHERENTE, no si era EJECUTABLE.**

**ACEPTADA, y con una casilla mas que la propuesta**, porque la propuesta cubre una de sus dos caras
y no la otra:
- **Cara A — el criterio pide observar lo inobservable:** nunca se ejecuta, **y su no-ejecucion no
  deja rastro**. La lo tapan las dos casillas de T2: **quien observa** y **con que instrumento**.
- **Cara B — el criterio se ejecuta y su verde se produce igual si el control no llego a correr.**
  Caso cerrado por T3 en AIT-127: un verde que **no distingue *"se abandono bien"* de *"nunca hubo
  segunda peticion que colgar"*.** **Nombrar al observador y el instrumento NO arregla esto** — es
  el control degenerado de la D54 §2 dentro de un criterio.
  **Tercera casilla: QUE RESULTADO HARIA FALLAR ESTE CRITERIO.** Un `PASA si` sin mundo en el que
  falle **se cumple con la cosa rota**.

**Las tres casillas son de FORMA: las verifica quien audita sin entender el dominio.** Eso es lo que
la hace barata y lo que la salva de convertirse en criterio.

**Sobre su contrapeso, que agradezco y contesto en vez de esquivar** —*"esto anade friccion a todos
los planes para cazar una clase que aparecio tres veces en una noche"*—: **la acepto igual, y por la
frecuencia, no por la gravedad.** Se paga **una vez por criterio, al escribirlo, por su autor**; no
es un detector que grita en cada corrida ni una espera. **El coste es plano y acotado, y lo paga
quien tiene el contexto para pagarlo barato.** Si fuera un control periodico la habria rechazado.

## D56 — una coordenada de linea es un PUNTERO: se re-deriva, no se copia

**Medido por T2 sobre su propia AIT-114, contra `origin/main`:**
```
su plan dice   authState.ts:164  ->  COOKIE_JWT = "__convexAuthJWT"
en su base 629440f   linea 164  ✔
en origin/main       linea 170  ⚠️
```
**El valor no cambio. La linea si.** Y su analisis sigue siendo valido palabra por palabra.

🔑 **Lo que lo hace peligroso: la coordenada es JUSTO la parte que otro ejecuta.** Quien va a la 164
**no encuentra un error, encuentra otra linea** — y si hay algo plausible ahi, **se lo cree**. Un
diagnostico correcto colando sus coordenadas sin verificar. Causa: **un plan se escribe contra una
base y se implementa contra otra**, y T2 paso de 22 a **113 commits por detras en cuatro horas y
media**.

**REGLA:** *cada cita por linea se re-deriva contra la base sobre la que se construye; nunca se copia
del plan.* **Un hallazgo es un hecho; una coordenada es un puntero, y los punteros se resuelven en el
momento de usarlos.**

**Con la distincion de T2, que es la parte fina y evita el exceso:** **los veredictos cerrados son
documentos historicos y sus coordenadas son validas EN SU FECHA** — lo que no puede es **heredarlas
el export de codigo**.

## D57 — todo runner declara un MINIMO ESPERADO y falla por debajo

**La Directora trae el dato sin propuesta y con dos candidatas. Elijo la segunda: la que mata la
clase, no el caso.**

**El dato:** un `Total: 0 tests in 0 files` de Playwright **es un cero que dice "no supe mirar" y se
lee como "no hay nada roto"**. En AIT-109 la causa estaba a dos saltos: `authState.ts` importaba
`playwright.config` de forma *eager* **solo por una constante**, y con `E2E_PORT` invalido **moria la
suite pura entera por una constante que ninguna prueba pura usa** — **invisible mirando
`playwright.unit.config.ts`, que es donde uno la busca.**

**Por que la regla sobre imports NO, y la del minimo SI:** una regla sobre imports arregla **este
camino**; el proximo cero vendra por otro. **El minimo esperado es una expectativa POSITIVA sobre un
conteo**, y esa es la unica forma de verificar un enunciado negativo: *"no deberia estar roto"* no se
comprueba — **se cuenta y se exige un suelo.**

**Y no hace falta artefacto nuevo: el suelo ya existe.** `_cobertura-comandos.txt` guarda la foto
commiteada (`test:e2e` 38/9, `test:unit` 91/8) y `_cobertura-de-los-comandos.sh` ya trata
`Total: 0 tests` como **INDETERMINADO y nunca como dato**. **Lo que falta es que el RUNNER falle**,
no solo que el detector lo note: **si un comando de test devuelve menos tests de los que su foto
dice, sale distinto de cero.** El coste de mantenimiento es el que ya pagamos — actualizar la foto
en el mismo commit que cambia la cobertura, con su motivo, que es la D30.

## D58 — una prescripcion del auditor es una AFIRMACION sobre la herramienta, y se verifica antes de obedecerla

**Medido por T2 antes de escribir nada, que es lo que lo convierte en hallazgo:**
```
git grep · sin coincidencias    exit 1 · stderr 0 B
git grep · ruta inexistente     exit 1 · stderr 0 B   <- INDISTINGUIBLES
grep -r  · ruta inexistente     exit 2 · stderr 61 B
```
El auditor pidio *"que el escaneo falle ante errores de ruta o lectura"*. **Con `git grep` eso es
incumplible.**

🔴 **Y falla de la peor manera: quien la implemente CREERA HABERLA CUMPLIDO**, porque el criterio se
lee satisfecho y **el cero sigue saliendo**. No hay ningun momento en que alguien descubra que no se
cumplio.

**ACEPTADA COMO DECISION, y contesto su contrapeso** —*"solo muerde cuando la prescripcion cita una
herramienta concreta, quiza sea estrecho"*—: **no es estrecho, y la razon es la asimetria de arriba.**
Una prescripcion imposible que **produce sensacion de cumplimiento** es peor que una prescripcion
dificil, y **llega con la autoridad del veredicto, que es justo lo que impide que nadie la
compruebe**. El `SIN:` nos dice donde el auditor no miro; **esto es otra cosa: donde el auditor
afirmo algo sobre una herramienta sin ejecutarla.**

**Regla:** *toda correccion minima que nombre un comportamiento de una herramienta se VERIFICA contra
esa herramienta antes de aceptarse.* **Y la mitad que mas importa: si no es ejecutable, el
desarrollador lo DECLARA y propone el sustituto** — porque el camino por defecto es **fingir
cumplimiento sin saber que se finge.**
**La solucion de T2 tiene la forma correcta:** la validacion **sale del escaner** (`git cat-file -e`
sobre los objetivos + escaneo con estado), *porque el paso que falta es justo el que el escaner no
puede dar.*

📌 Es *una prescripcion se ejecuta antes de mandarla* — la fila que escribimos contra nosotros —
**aplicada al auditor**. Vale en las dos direcciones.

## D59 — un desarrollador SI puede reabrir un hallazgo que el auditor cerro, DECLARANDOLO

**El caso, medido por la Directora en el veredicto del loop15 de T2:** el auditor cerro **M7.1**
aceptando que *"el cambio de hash de `env.otra` acredita que actuo"* — **el observable de la COSTURA,
no del COMPARADOR**, que es lo que T2 habia refutado media hora antes. Y **en el mismo fichero abrio
M7.2 y M7.3 diciendo esa misma cosa con otras palabras**: *"el sujeto del control puede estar ausente
mientras solo queda acreditado el andamiaje"*.

**O sea: nombra la clase cuando la ve y no la ve cuando la tiene delante con sello de resuelto.**

**DECISION — SI puede, y respaldo lo que hicisteis, con una condicion de forma:**
1. **El desarrollador NO puede cerrar por su cuenta lo que el auditor abrio.** Eso no cambia.
2. **SI puede mantener ABIERTO lo que el auditor cerro, declarandolo explicitamente como
   DESACUERDO**, con el argumento citado y refutado — no en silencio, no como si el auditor no
   hubiera dicho nada. **Asi el auditor lo ve en la ronda siguiente y concede o refuta.**
3. **La razon es de direccion, y es de T2:** *un hallazgo con sello de "resuelto" no lo vuelve a
   mirar nadie.* Sin esta via, **un cierre erroneo es IRREVERSIBLE**, y el error queda protegido por
   el sello. **Mantener abierto cuesta una ronda; cerrar en falso cuesta el defecto.**
4. **No debilita al auditor:** un desacuerdo declarado **le devuelve la decision a el**, no se la
   quita. Lo que se prohibe sigue siendo lo mismo: que el desarrollador se autoabsuelva.

**Y la contramedida directa ya esta escrita: la D55 exige el observable AL SUJETO DEL CONTROL, no a
cualquier actor que participe.** Ese es exactamente el hueco por el que se colo M7.1.

## Fila — un detector que puede fallar en las DOS direcciones necesita DOS controles

**De T4, con falso positivo medido.** Su filtro de muerte por capacidad, corrido sobre un veredicto
de **1,1 MB**, caso con `re.code==="rate_limited"` **dentro de un volcado de HTML minificado que el
auditor estaba grepeando**. Su patron `rate.limit` llevaba un `.` que es comodin. **Estuvo a punto de
declarar muerta una auditoria sana que despues produjo 1.476 lineas mas, con veredicto y cita de
cierre.**

**Dos defensas, y cubren riesgos DISTINTOS:** patron **literal** (inmune al comodin, este donde este)
**y** acotado a la **cola** del fichero (el error de capacidad aparece donde el proceso muere; el
contenido leido aparece en medio). **El limite, nombrado por T4: si un auditor muriera justo despues
de volcar un fichero, el `tail` no salvaria — por eso hacen falta las dos.**

🔑 **La forma general: el filtro se diseño contra TRAGARSE UNA MUERTE; el falso positivo va al reves
y TIRA UNA AUDITORIA BUENA.** Un detector que puede fallar en las dos direcciones **necesita un
control por direccion** — que es la D54 §1 aplicada a un instrumento en vez de a una afirmacion. **Y
el negativo lo encontraron por accidente**, como casi todo esta noche.

⚠️ **Y hay un agravante estructural que conviene nombrar: el log de un proceso que BUSCA X contiene
X.** Un detector que lee el transcript de una auditoria esta leyendo un fichero **lleno de las cosas
que el auditor fue a buscar**. Es la fila de *"un patron no distingue cometer un error de
describirlo"*, en su version mas dificil: aqui **ni siquiera hay descripcion, hay materia prima
citada.**

## Forma recomendada del export — el bloque fechado (de T2)

**Adoptada como forma, sin necesidad de decision nueva:** el dato volatil va en un bloque titulado
**"Estado del arbol al escribir esto"**, **fechado y separado del analisis**. Asi quien lo lea manana
**sabe que parte remedir sin dudar del resto** — hoy la duda contamina el documento entero.

**Justificacion medida, y es la que convence:** `origin/main` ha ido **`b419492` -> `a7c4f48` ->
`55a9d3d` en menos de una hora**. **Un export escrito hace veinte minutos ya cita una punta que no
existe.** Es la D56 llevada a la estructura del documento: **si la coordenada es un puntero, el
documento tiene que decir cuales de sus datos lo son.**

## 🔴 D57.1 — CORRIJO EL VERBO DE MI PROPIA D57: "declara" se lee como "escribe"

**Dos terminales, la misma ronda, el mismo malentendido — o sea que el defecto es de mi redaccion,
no de ellas:**
```
T4:  ">= 111 tests"      escrito en el criterio, nada lo evalua
T2:  "FALLA si N < 38"   escrito en el criterio, nada lo extrae ni lo compara
```
**Los dos anadieron el numero que la D57 pedia y ninguno anadio algo que ABORTARA.**

**El diagnostico es de T2 y es exacto:** *"la decision dice «declara un minimo» y «declarar» se lee
como «escribir». Lo que me habria parado es «**ejecuta un control que aborte** por debajo del
minimo». **El verbo es el que engana, no la cifra.**"*

**D57 corregida:** *todo runner **EJECUTA UN CONTROL QUE ABORTA** por debajo de su minimo esperado.*
No "declara". No "documenta". **Aborta.**

📌 **Fila general, y es de las que sirven fuera de aqui: el VERBO de una regla decide si cumplirla
produce un ARTEFACTO o un EFECTO.** *Declarar, documentar, indicar, especificar* → **se cumplen
escribiendo**, y **se sienten cumplidos**. *Ejecutar, abortar, fallar, rechazar* → **se cumplen
haciendo**. **La lectura facil de un verbo debil produce un criterio inerte que pasa auditoria**, y
el autor no esta incumpliendo nada: **esta obedeciendo lo que puse.**

## D60 — un control de NO-REGRESION es inmune a "el estado anterior" como mundo de fallo

**Medido por T4.** Monto un runner con tres gates y lo declaro no-vacio ejecutandolo contra la base:
```
gate C2 contra la base -> FALLA
gate C4 contra la base -> FALLA
gate C5 contra la base -> 🔴 PASA
```
**La causa no es un descuido: C5 mide el vigilante, y el arreglo no lo toca** — el fichero es byte a
byte identico en las dos puntas, **y el criterio existe precisamente para que siga siendolo**.

> **Ejecutar un control contra un estado anterior solo lo hace no-vacio si su SUJETO DIFIERE entre
> los dos estados.**

⚠️ **Y lo peligroso es que la ejecucion conjunta sale ROJA igual**, asi que **el gate mudo queda
tapado por los que si fallan**. La afirmacion *"una sola ejecucion hace no-vacios los tres"* era
falsa **y nadie la habria comprobado**.

📌 **Afecta a una CLASE entera: los controles de NO-REGRESION.** Todo criterio cuyo proposito sea
*"esto debe seguir igual"* **es inmune por definicion a un mundo de fallo construido como «el estado
anterior»**. Necesitan un **adversario FABRICADO** — T4 usara un vigilante deliberadamente roto que
devuelva 0 para todo, y exigira que el gate lo suspenda. *(Es lo mismo que tuve que hacer yo con el
vigilante de la D53: el caso que discrimina hubo que construirlo, el disco no lo daba.)*

**Y la segunda mitad, tambien suya: el runner NO PUEDE CORTOCIRCUITAR.** Contra la base el resultado
esperado **no es "no-cero": es `C2=FALLA · C4=FALLA · C5=PASA`, los tres nombrados** — asi **un runner
que evalua mal no se esconde tras un exit agregado.**

## D61 — sobre exports y veredictos, filtrar por longitud de linea ANTES de contar

**Regla operativa. La pide el PM y me la traslada la Directora porque es proceso de fabrica.**
> **Sobre exports y veredictos de este proyecto: `length < 300` ANTES de contar nada.**

**Dos instrumentos independientes, el mismo fallo, la misma carpeta, cinco minutos de diferencia:**
el `grep` del PM devolvio **507 KB de base64**; el enumerador de la Directora **conto dos etiquetas
que nadie escribio** (`C6` y `C8`), sacadas de tres lineas de **24.607, 387.281 y 78.977
caracteres** — JS minificado y fuentes incrustadas **dentro de un veredicto**. **Es una propiedad de
esos ficheros, no mala suerte.**

🔴 **Y EL HALLAZGO DE VERDAD ES OTRO: `C6` resultaba EXISTIR. O sea que el instrumento roto ACERTO.**
Si el PM no llega a ir a la fuente, **ese acierto habria sido la prueba de que el metodo funcionaba**
y `C8` se habria leido como un despiste suelto.

> ***Un instrumento roto que acierta se valida solo. El acierto por accidente es mas peligroso que el
> error, porque APAGA LA PREGUNTA.***

✅ **Contramedida concreta, y refina la D54: el control positivo tiene que comprobar que lo devuelto
es DEL TIPO BUSCADO, no solo que devuelve algo.** Contar etiquetas **y comprobar que sean etiquetas**.
Un control de presencia dice *"el instrumento encuentra"*; **hace falta uno de tipo, que diga
"encuentra LO QUE BUSCA"**.

## D62 — una reescritura de ficha exige un diff contra la fuente, y la pregunta es QUE FALTA

**Caso:** el PM reescribio AIT-127 entera de memoria y **se cayeron cuatro criterios de aceptacion,
dos de ellos del alcance auditado.** Se restauraron desde el veredicto del auditor.

**SI, hace falta el paso, y lo que lo hace replicable es COMO lo pidio el, no que lo pidiera:** pidio
que alguien mirara **QUE HABIA DESAPARECIDO**, no que estaba mal. Su razon: ***mirar lo que escribio
es mirar donde el fallo no puede estar.***

**Regla:** *toda reescritura de una ficha o documento hecha de memoria se compara contra la fuente
antes de publicarse, y la pregunta del comparador es **"¿que falta?"**, nunca "¿que esta mal?".*
**Una omision no se ve leyendo lo escrito: solo se ve enumerando la fuente.**

## Fila — el rigor se concentra donde ya dolio y el hueco se muda al eje de al lado

**Tres roles, cuatro horas, mismo mecanismo. La Directora no trae propuesta y pide que, si se nombra,
se nombre con las instancias. Van las tres:**
- **T4** persigue *"verde sin mirar"* en un comprobador **y su plan trae cinco criterios que dan verde
  sin ejecutar**.
- **T2** descubre que un positivo por otro recorrido no vale, rehace el positivo **y lo rehace por el
  recorrido viejo**.
- **La Directora** le pone el filtro de longitud a su vigilante de auditorias por el aviso de T4 **y
  no se lo pone al enumerador que corria sobre los mismos ficheros media hora despues**.

**Lo unico accionable que le veo, y es barato — no es "mas cuidado":** **cuando arregles un
instrumento por un defecto D, ENUMERA en ese mismo acto los otros instrumentos que comparten su
ENTRADA, y aplicaselo.** No los que se parecen: **los que leen lo mismo.** El caso de la Directora es
exactamente eso — dos instrumentos suyos sobre los mismos ficheros, arreglado uno. **La enumeracion
es corta y se hace mientras tienes el defecto en la cabeza**, que es el unico momento en que es
gratis.

## D63 — convenio de codigos de salida de la fabrica (adoptado, no inventado aqui)

**Lo piden T2 y T4 a la vez, con el mapeo ya probado por los dos en dos fichas distintas.** T2 los
invento, T4 se los pidio y los adopto **declarando en su export**: *"mapeo tomado de T2 (AIT-114).
**NO es un convenio de la fabrica**"*.

🔑 **El hallazgo no es que se los inventara: es que DOS TERMINALES ACABARON USANDO LOS MISMOS NUMEROS
POR UNA CONVERSACION PRIVADA.** Un convenio se estaba formando **sin que nadie lo decidiera**, y
hasta que T4 pregunto **nadie mas los habia visto**. Si cada terminal inventa la suya, **quien lea un
`exit 5` manana tendra que adivinar de quien es** — y **un codigo de salida no es una etiqueta: es
una instruccion sobre donde mirar.**

**ADOPTADO tal cual, y va donde se lea sin buscarlo (`intro-terminal.txt`):**
```
exit 4  SIN CONTENEDOR   la salida del runner no existe o no se lee   <- "no pude mirar"
exit 5  AUSENTE          ninguna linea con el sujeto buscado          <- "mire y no habia"
exit 6  MALFORMADA       la hay y su valor no vale (incluye NaN)
exit 7  BAJO MINIMO      N < minimo
```
📌 **Y no es arbitrario, que es lo que lo hace defendible: la distincion 4/5 es exactamente la que
esta fabrica lleva toda la noche exigiendo** — *un cero sin control positivo no distingue "no hay" de
"no supe mirar"*. **Este convenio la vuelve legible por una maquina**, que es mas de lo que teniamos.

**Y el `exit 4` salio de un accidente que merece constar:** a T2 se le rompio el arnes mientras
contestaba a T4, y su gate respondio **AUSENTE sobre un fichero inexistente** — *"no pude mirar"
colapsado dentro de "mire y no habia"*. **Un error que falla hacia el lado seguro y nombra la causa
equivocada manda a cavar al sitio que no es, y es peor que uno vago.**

## D64 — la COMPARACION no puede ser la guarda: `NaN < minimo` es FALSO y el gate aprueba

**Medida en dos fichas a la vez (M4b de T4, M1 de T2).** Si un total malformado se convierte en
`NaN`, **`NaN < minimo` es `false` y el gate PASA**. La guarda que existe para exigir un suelo
**aprueba precisamente cuando no hay numero**.

> **Hay que AFIRMAR EN POSITIVO que existe un entero ANTES de comparar.**

**Entra en la misma pasada que la D57.1**, y es su forma numerica: *"no deberia estar por debajo" no
se comprueba — se cuenta, se valida el tipo, y se exige un suelo.* **Afecta a cualquier gate de la
D57 que compare sin validar primero**, o sea a todos los que se escribieron esta noche.

## D65 — SELECCION, EXISTENCIA y VALIDEZ son TRES pasos, y el primero se olvida

**De T2, y es la mas fina de la tanda.** El ya separaba **existencia** (pregunta laxa) de **validez**
(pregunta estricta). Lo que faltaba:

> **Si la SELECCION se hace con el patron estricto, lo invalido desaparece del universo antes de que
> nadie lo juzgue.**

**Su caso:** dos lineas `Total:`, **la ultima malformada**. Un selector por patron numerico **coge la
penultima —valida—, ignora la mala y APRUEBA**. **La seleccion tiene que ser POSICIONAL, no por
patron.**

**Su formulacion general, adoptada tal cual:** *la pregunta de EXISTENCIA tiene que ser mas LAXA que
la de VALIDEZ; con el mismo patron para las dos, **lo invalido es indistinguible de lo inexistente
por construccion**.*

📌 **Y es la misma clase que el autodiagnostico del propio T2 de hace tres horas** —*"acoto el
universo antes de mirarlo"*— **pero un nivel mas abajo: aqui el universo lo acota el PATRON, no el
autor.** Generalizada: **todo filtro aplicado ANTES de una comprobacion retira del universo
exactamente los casos que la comprobacion existia para cazar.**

## D66 — la huella de ronda se degrada POR SU PROPIO EXITO

**Medido por T4: la cita de cierre del loop16 de T2 aparecio en el veredicto de OTRA tarea**, porque
el auditor **la habia recogido por util**.

> **Una cita de cierre deja de discriminar exactamente cuando la leccion funciona.**

**La solucion de T2, adoptada, y lo valioso es que separa dos cosas que estaban pegadas: LA HUELLA NO
PUEDE SER LO QUE QUIERES QUE SE PROPAGUE.**
```
RONDA 18 · base 629440f · «38 -> abc» = exit 6 · «abc -> 38» = exit 0
```
**Un par asimetrico de RESULTADOS MEDIDOS no lo cita nadie en otro veredicto.** Y **la leccion se
escribe aparte**, para que pueda viajar **sin llevarse la huella con ella**.

**Regla general: un identificador se elige entre lo que nadie querria copiar.** Si es memorable,
citable o util, **su exito lo destruye como identificador** — y el fallo es silencioso, porque
aparece igual de legitimo en los dos sitios.

## Nota operativa — el vigilante es el EJECUTOR, el criterio va escrito FUERA

**De la Directora, tras matarle el sistema otro vigilante** (swap al 83%, ~2,4 GB reclamables).
**No costo nada, y la razon no es la memoria:** *"el criterio de verificacion estaba escrito, no en
mi cabeza"* —linea del veredicto, posicion respecto al prompt, cita de cierre, `at capacity`,
marker— **y lo midio a mano en dos comandos.**

> **Lo que se automatiza es la EJECUCION; el criterio va escrito FUERA del ejecutor.**

**Si el criterio hubiera vivido dentro del script, su muerte se habria llevado la ronda.** Es la misma
leccion que la D78 con mi vigilante y la que aplique al adelgazar el cron — **pero un paso mas alla:
no basta con que el criterio este en disco, tiene que poder ejecutarlo un humano a mano.**

## 🔴 CORRECCION — mi prueba de que el tercer cerrojo fantasma estaba cerrado no discriminaba

**Me corrige la Directora y tiene razon.** Escribi *"el working tree ya esta limpio: alguien ha
ignorado `_turno-convex/`"*. **La conclusion era correcta; la evidencia no la sostenia.**
```
git status --porcelain           -> vacio
HIPOTESIS A (esta ignorado)      -> .gitignore:87  ✅ cierta
HIPOTESIS B (ya no existe)       -> T3 lo retiro   ✅ tambien cierta
```
**Las dos son ciertas a la vez, asi que el arbol habria estado limpio IGUAL sin el `.gitignore`.**

⚠️ **Y la direccion es la mala: si la proteccion NO estuviera, mi comprobacion habria dado el mismo
verde.** Declare cerrada una clase de fallo con una prueba que no distingue *"protegido"* de
*"desaparecido"*.

📌 **Forma nueva, y es la unica que se me ha colado hoy sin que nadie mas la nombrara antes: un
sintoma que desaparece por DOS causas, y una conclusion que nombra UNA.** El sintoma se fue de
verdad; **lo que no se puede deducir es por que.** Es primo del control degenerado (D54) — alli el
control no ejercitaba nada, aqui **el observable es compartido por dos mundos** y elegi el que me
convenia narrar. *Cuando un sintoma tiene dos causas suficientes, verificar la causa exige mirar la
causa, no el sintoma.*

## D63.1 — el convenio de exits reserva una BANDA, y el `exit 3` de T1 entra en el

**Colision detectada por la Directora antes de publicar el convenio:** T1 ya tiene contrato de salida
implementado en AIT-122 y **usa los mismos numeros para otra cosa**.
```
CONVENIO (T2/T4)                 T1 · AIT-122 (ya implementado)
exit 4  SIN CONTENEDOR           exit 4  el GATE de exports ajenos
exit 5  AUSENTE                  exit 3  CRASH del comprobador
exit 6  MALFORMADA
exit 7  BAJO MINIMO
```

**Descarto la opcion barata —"que el convenio cubra solo los gates de conteo y T1 quede fuera"— y
digo por que: un convenio NO UNIVERSAL es peor que ninguno.** Si `exit 4` significa dos cosas segun
el programa, **el lector sigue teniendo que saber de que programa viene**, que es exactamente lo que
el convenio venia a evitar — **pero ahora con la apariencia de que existe un significado compartido.**
Es la "sensacion de un control" aplicada a una convencion.

**DECISION — el convenio reserva una BANDA para el estado del INSTRUMENTO, y deja otra para los
resultados de DOMINIO:**
```
BANDA DEL INSTRUMENTO (universal, cualquier programa de la fabrica)
  exit 3  CRASH DEL PROPIO INSTRUMENTO   <- de T1, adoptado tal cual
  exit 4  SIN CONTENEDOR   la salida del runner no existe o no se lee
  exit 5  AUSENTE          ninguna linea con el sujeto buscado
  exit 6  MALFORMADA       la hay y su valor no vale (incluye NaN)
  exit 7  BAJO MINIMO      N < minimo
BANDA DE DOMINIO (>= 10)  resultados propios de cada comprobador
  ej. el gate de exports ajenos de T1 pasa de `exit 4` a la banda >= 10
```
**Coste real: cambia UN codigo en UN programa.** No renumero a T2 ni a T4 (dos terminales, dos
fichas) ni dejo a T1 fuera.

✅ **Y el `exit 3` de T1 entra en el convenio POR MERITO, no por antiguedad: lo separo porque *"un
crash y un resultado legitimo daban el mismo observable"*.** Es la misma familia que el 4/5 y **mas
fundamental que ella** — un crash es el caso extremo de *"no pude mirar"*. **Que se hubiera quedado
fuera por llegar tarde a una conversacion privada es justamente el defecto que la D63 denuncia**, en
su segunda vuelta.

⚠️ **Y la peticion de la Directora es la correcta y va con la decision: T1 no puede enterarse del
convenio por un veredicto.** Es **el unico de los cuatro que ya tenia codigos escritos y no estuvo en
la conversacion donde se formaron.** Se le traslada directamente, **con su `exit 3` acreditado como
suyo.**

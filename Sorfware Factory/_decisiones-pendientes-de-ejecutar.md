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

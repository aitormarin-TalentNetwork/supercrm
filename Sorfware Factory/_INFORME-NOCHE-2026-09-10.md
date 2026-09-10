# Informe de la noche · 2026-09-10

**Del CEO (`crm-curso-vibe-coding-b2`) para Aitor.** Turno de 03:30 a 05:05 UTC (00:30–02:05 local).
Horas medidas con `date -u` y cruzadas con `mtime`, nunca deducidas.

---

## 1. Lo que te toca decidir a ti

Orden recomendado por el PM, **por lo que desbloquea y no por gravedad**. Los tres primeros
te cuestan minutos.

### 🥇 AIT-97 — perfil de navegador. **Ya la decidiste tú el 9 de septiembre.**
No espera decisión: espera que **apliques la configuración del MCP**. Tus palabras entonces:
*"cada terminal tiene que tener un acceso separado"*. **Ya ha cortado al QA tres veces en un
día.** Es la primera de la lista a propósito: lo que más nos frena es algo que ya decidiste.

### 🥈 AIT-116 — iCloud corrompiendo `.git`. Urgent, y **ya ocurrió una vez.**
Cinco worktrees dentro de una carpeta sincronizada. **Es el único riesgo de pérdida de
trabajo que sigue vivo.**
📌 **Y quítale la mitad que le colgamos por error:** esta noche se escaló "disco lleno +
sincronizador = corrupción de git". **El disco no está lleno: 484 GiB disponibles, 46% de
uso, medido.** La premisa era falsa y era mía. **El riesgo es iCloud y solo iCloud.**

### 🥉 AIT-99 — CUATRO PERMISOS CONCRETOS. Es lo más caro que tenemos parado.
**No cierra, y no es cuestión de tiempo ni de trabajo.** Estado medido en la carpeta, no leído
de un registro: **dos rondas de código auditadas, las dos NO-GO**; M1, M2 y M5 **cerrados**;
rama respaldada en `origin`, árbol limpio, cero commits sin subir. **Está parada desde las
01:56Z en el mismo punto.**

**Lo que falta es literalmente el `SIN:` del auditor, y son cuatro cosas que solo puedes
autorizar tú porque se ejecutan con tu identidad y sobre infraestructura que pagas:**
1. **Operaciones sobre el deployment compartido de dev.**
2. **Retirar las cinco cuentas `ait99-*` y comprobar que pierden acceso** — destructivo, y hoy
   imposible de deshacer: la siembra **no tiene inversa** (AIT-131, congelada).
3. **Control positivo de `authRateLimits`.**
4. **Ejecución sobre un deployment virgen** — que no existe: hay que crearlo.

**Te lo doy como cuatro permisos y no como "AIT-99 necesita atención" a propósito:** lo primero
se decide en dos minutos; lo segundo obliga a reconstruir el contexto entero. **Y el permiso 2
es el mismo que desbloquea la credencial expuesta del punto 6.**

**Dos salidas, y no elegí ninguna a propósito:**
- **(a)** autorizar lo mínimo para medir — descongelar AIT-131, o permitir N cuentas acotadas.
- **(b)** cerrarla aceptando los cuatro huecos con nombre en la ficha.

**Por qué no la cerré yo:** cerrar **falla hacia el verde**, y sus criterios dicen *"un
deployment nuevo puede entrar por contraseña"* — cerrarla sin haberlo verificado deja escrito
que funciona algo que no hemos medido, **en la ficha que existe para medirlo**. Y sobre todo:
**los tres huecos requieren tu permiso, así que cerrarla yo sería decidir por ti usando como
razón que estabas dormido.**

### 4. AIT-120 — el plan de Convex por encima del gratuito
Sin decidir desde ayer. **Es la premisa de la decisión del PM sobre AIT-114**: si subes de
plan, esa ficha se replantea entera y de paso cierra AIT-95 y AIT-102.

### 5. La comprobación de AIT-133 contra producción
Hay **dos vías** y sólo una necesita tu permiso:
- **Configuración (NO lo necesita):** comparar el `convex/auth.ts` desplegado, la ausencia de
  `jwt.durationMs` y la versión de `@convex-dev/auth` entre los dos deployments. **Es
  lectura.** Si coinciden, probablemente basta para decidir el arreglo.
- **Replay (SÍ lo necesita):** capturar un token de producción, cerrar sesión y reusarlo. **Lo
  veté toda la noche.** Es la forma exacta de un ataque de replay contra un sistema real.

**T1 no pudo hacerlo (su sesión se lo bloqueó, y NO lo rodeó) y T3 pudo y se negó**, con esta
frase que merece quedarse: *"eso no lo vuelve autorizado, sólo invisible"*. La fábrica se paró
sola donde tenía que pararse.

### 6. 🔴 UNA CREDENCIAL VIVA CON LA CONTRASEÑA EXPUESTA — y no podemos rotarla sin ti
**Esto cambió de categoría a las 08:15 y ya no es "cinco identidades sembradas".**

De las cinco cuentas `ait99-*` que quedaron vivas en el Convex **compartido de desarrollo**,
**una tiene su contraseña en claro**: `ait99-verify-bce772@supercrm.es`. Se escribió para hacer
logins por UI durante la verificación, y quedó en el transcript de esa sesión. **Lo declaró T1
por su cuenta**, sin que nadie se lo pidiera, y está anotado en `_turno-convex.log` con esa
marca para que quien la borre sepa por cuál empezar.

**ALCANCE EXACTO, medido, para que no se lea ni más grave ni más leve de lo que es:**
- Está en **transcripts de sesión locales** y en los ficheros de auditoría de esta máquina.
- **NO ha viajado al repositorio:** esos ficheros están **ignorados por git** (comprobado con
  `git check-ignore`, con control positivo). **No está en GitHub ni en ningún commit.**
- Es una cuenta del **deployment compartido de DEV**, no de producción.

⚠️ **Y LO QUE TE TOCA SABER, PORQUE ES UNA REGLA TUYA QUE NO ESTAMOS CUMPLIENDO:** `CLAUDE.md`
dice que **un secreto expuesto se rota de inmediato, no se deja "total, ya se vio"** — con el
precedente del 2026-08-21. **No lo hemos rotado**, y no por descuido: **retirar o rotar esas
cuentas es exactamente lo que no podemos hacer sin tu autorización**, porque la siembra **no
tiene inversa** (AIT-131, congelada) y crear/tocar credenciales en el compartido está vetado.

**O sea: sabemos cuál es la regla, sabemos que la estamos incumpliendo, y el desbloqueo es
tuyo.** Prefiero decírtelo así que dejarlo en una línea que parezca informativa. **Va con la
decisión de AIT-99 (punto 3): la misma autorización resuelve las dos.**

### 7. AIT-113 — las dos cuentas reales solo entran por Google
Abierta desde antes de esta noche, y **bloquea implícitamente parte de AIT-99**.

### 8. Cuatro cosas que el Factory Architect NO decidió porque no le tocan
Las cuatro tienen la misma forma: **no puede desempatarlas quien está dentro.**

- 🔴 **D23 — dos canales de asignación de rol.** Tú asignas a mano y el CEO por censo, **y
  ninguno ve lo del otro**. Colisionaron **tres veces esta noche**, la última sobre el
  **Integrador, el único rol con permiso de escribir en `main`**. **Falla hacia HACER:** nada
  impide que dos Integradores mergeen a la vez. Las tres veces lo paró **una declaración de la
  sesión afectada**, nunca un mecanismo. **No lo puede desempatar ni el CEO ni el Factory
  Architect, porque uno de los dos canales eres tú.**
- 🔴 **D27 — el gate del Integrador no es exigible en un checkout compartido.** Quien hace
  `push` desde la raíz publica los commits pendientes de los demás, **lo sepa o no**. Esta
  noche arrastró documentación; mañana puede subir código sin GO **sin que nadie lo decida**.
  Restituir el gate exige **quitarle el `push` a los otros cinco roles**, y eso es tuyo.
- 🔴 **Los tres vigilantes mueren con su sesión.** Los scripts sobreviven en el repo; **el
  armado no**, y un vigilante no armado se ve exactamente igual que uno tranquilo. La salida
  obvia —un proceso de fondo— es justo la que ya murió tres veces el mismo día por presión de
  memoria. **Nadie tiene una respuesta buena y nadie se la ha inventado.**
- 🔴 **¿Llegó la receta de `docs/03-setup.md` a justificar un despliegue a producción real?**
  Es histórico. Si la respuesta es sí, **hay una premisa a medio medir debajo de algo que ya
  se ejecutó** — y ahora sabemos que el daño incluía dejar el worktree apuntando al backend
  equivocado de forma persistente. **No se resuelve por deducción.**

---

## 2. Lo que se entregó, sin maquillar

**Comprometí dos tareas cerradas. Entrego CERO de las dos.**

Se han cerrado **dos fichas** —AIT-109 y AIT-123— **y ninguna de las dos es de las
comprometidas.** AIT-109 ya estaba en marcha antes de fijarse el compromiso; AIT-123 apareció
después. **Así que el compromiso se cumplió en un 0%, y lo digo con ese número antes de dar
ninguna explicación.** Lo que hay es trabajo cerrado *al lado* de lo prometido, no lo prometido.

**AIT-123, publicada a las 07:50:32Z**, cierra un defecto que la propia noche descubrió y
midió: **resolver el deployment por URL + admin-key reescribe el `.env.local` y deja el
worktree corriendo contra otro backend, de forma persistente.** Merge `46bfcbb`, servida en
93 s, con la suite corrida **con el merge dentro** (38 e2e + 111 unitarios, exit real 0) antes
de publicar, no después. Ocho rondas de plan y tres de código.

🔴 **AIT-127 —la única de las dos comprometidas que seguía viva— NO LLEGA. Lo escribo antes de
que se cumpla, no después.**

**Estado real, que es bueno y por eso lo doy entero:** dos de sus tres criterios **cerrados y
verificados**, la suite completa en verde, implementación commiteada. **Lo que queda es una
ronda de código, no trabajo abierto.**

**Por qué digo que no llega, con tasa base medida y no con una impresión:** sus **dos** rondas
de código de esta noche volvieron NO-GO; el ciclo completo de auditoría tiene una mediana de
**205 s** (n=50); y falta exportar, auditar, relayar, **y si sale NO-GO otra vuelta entera**, y
si sale GO todavía revisión final, publicación y build. La Directora lo estima **entre un
cuarto y un tercio**, y declara que **el número es blando porque n=2**.

**Lo que lo empuja abajo:** la ronda que viene **mete superficie nueva grande de golpe**, y las
dos anteriores volvieron NO-GO con menos cambio cada una.
**Lo que lo empuja arriba, y no lo callo:** T3 ha traído hoy **sus dos últimos majors antes que
el auditor**. Pero eso es una racha, no una medición, **y una racha no sostiene una promesa en
un informe.**

📌 **Prefiero un "no llega" dicho a tiempo con la ficha a un paso, que una posibilidad abierta
que no se cumpla.** Es la misma razón por la que el PM bajó su compromiso anoche antes de saber
si el gate iba a caer.

| | |
|---|---|
| **CERRADO** | **2** — AIT-109 y **AIT-123** |
| **NO LLEGA, decisión tuya** | **1** — AIT-99 |
| **NO LLEGA, aún en el bucle** | **1** — AIT-127. Ronda 5 **NO-GO** (verificado por mí: línea 871, `SIN:` en la 872, mtime 05:16:10Z). Dos majors, ningún blocker |
| **EN VUELO al cierre** | AIT-123 (ronda 6 auditándose, **la primera sin el `SIN:` repetido**), AIT-114 y AIT-122 encoladas |
| **DEUDA DESCUBIERTA** | **10 fichas** — AIT-124 a AIT-133. **Ninguna es ruido.** |

**Sobre AIT-127, que era la que más cerca estuvo:** llegó a la ronda 5 con dos majors y ningún
blocker. El defecto que la frena es de manual y merece leerse: **T3 escribió el requisito duro
de que el cierre de sesión siga adelante aunque falle `unsubscribe`, pero su secuencia no tiene
`catch` ni `finally`.** O sea: **el requisito está en el texto y no en el diseño.** Eso es
exactamente lo que un plan tiene que atrapar antes de que llegue a código, y lo atrapó.

**Y la Directora dejó una señal armada antes de que hiciera falta:** el mismo hallazgo (M4) ha
vuelto **dos rondas seguidas**. No lo cuenta como bucle **y explica por qué con precisión** —
en la ronda 4 el auditor tumbaba el razonamiento de T3; en ésta dice que **el razonamiento es
correcto** y lo que falta es convertirlo en flujo ejecutable. Mismo punto, contenido distinto.
Si vuelve en la ronda 6, escala en el momento.

> **Su frase, que es el argumento entero de por qué no la cerré:**
> *"Prefiero eso a un Done que no aguanta la primera pregunta, y en particular prefiero no
> cerrar AIT-127 antes que cerrar un 'cerrar sesión' que no cierra la sesión."*

### El volumen del ciclo, medido: 49 rondas de auditoría, 4 GO
```
veredictos de esta noche .......  49    (control: 46 mas son de noches anteriores)
  GO ...........................   4    (8%)
  NO-GO ........................  45
fichas cerradas ................   2
```
**Los cuatro GO:** AIT-109 (03:42), el plan de AIT-123 (05:48), el plan de AIT-127 (06:22) y
**el código de AIT-123 (07:27)** — el único GO de implementación de la noche.

**Cómo leerlo, y las dos lecturas son ciertas a la vez:** ninguno de los 45 NO-GO fue una pega
de forma — **todos trajeron hallazgos reales y ninguno repitió al anterior**, y varios evitaron
que entrara código que daba verde con acoplamiento real. **Y aun así, 49 rondas para 2 fichas
es el dato de coste de esta fábrica**, y prefiero que lo veas crudo antes de que nadie te lo
interprete, yo incluido.

⚠️ **Y una corrección mía sobre este mismo número, porque es la lección de la noche aplicada a
mí:** hace veinte minutos te dije *"cerca de veinticinco veredictos"*. **Era el doble y con
menos GO.** Lo dije **de memoria**, sin medir, después de pasarme la noche exigiendo a todos
que midieran. Y cuando fui a medirlo, mi primer conteo dio **95** — porque conté **todos** los
ficheros de veredicto del repo, incluidos los de noches anteriores. **El mismo error de
universo que llevo corrigiendo a otros desde las cuatro de la mañana**, en el recuento con el
que iba a juzgar el rendimiento de la noche.

**Las dos líneas de arriba nunca se restan.** Lo intenté —presenté "10 creadas, 1 cerrada,
balance −9"— y el PM me lo tumbó con el argumento que lo cierra: **con esa métrica, una noche
en la que nadie mira nada sale mejor que ésta.** Una ficha nueva **no es deuda contraída, es
deuda descubierta**: el defecto de AIT-127 llevaba semanas en producción y abrirlo no empeoró
el CRM ni un poco.

**Lo que sí sobrevive de aquella preocupación, y es real:** nadie llevaba la cuenta, y
**descubrir en vez de cerrar fue una elección de alcance que nadie estaba viendo mientras la
tomaba.**

---

## 2bis. Alcance que se decidió mientras dormías — puedes deshacerlo, y quiero que lo veas
**No te pido permiso por nada de esto. Te lo enseño porque son decisiones que podrías deshacer
sin llegar a saber que se tomaron.** Las decidió el PM, que es a quien le corresponde.

**(a) 🔑 CONVENCIÓN NUEVA DE ARQUITECTURA, y es la que más quiero que veas porque vivirá años:
`localStorage` se estrena en código propio del proyecto.** Hasta esta noche había **cero** usos
(medido). Entra con **helper obligatorio** y con una **frontera escrita en
`docs/01-arquitectura.md`**: *nunca para credenciales, tokens ni nada que autentique*.
**Decidido esta madrugada, dentro de otra tarea.** Si no te gusta, es más barato deshacerlo hoy
que dentro de un mes con tres usos más encima.

**(b) AIT-127 entrega MENOS de lo que promete su título, con dos recortes declarados.** La
limpieza de push al cerrar sesión **sale a AIT-57**; y la navegación por barra de direcciones
durante la ventana residual **no se cubre** — pasa de ~3.500 ms a ~485 de peor caso, **no a
cero**, y su única mitigación real es AIT-133. **Los dos están en la ficha con destino
nombrado, pero tú aprobaste esa tarea entera y ahora es parcial.**

**(c) AIT-57 está en `Done` y puede que no aguante la primera pregunta.** No se ha reabierto
—hay un confusor sin resolver— pero la nota está dentro y **una sola medición la decide**.

**(d) La rama de fallo de "cerrar sesión" cambia el comportamiento visible:** aparece un estado
*"Cerrando sesión…"* y, si falla, **la app no redirige y avisa**. Es UI nueva en su
comportamiento, aunque no en sus componentes.

### Y tres fichas nuevas creadas esta noche — no necesitan tu permiso, es solo que existen
**AIT-134** (un cierre de sesión que falla deja las cookies vivas), **AIT-135** (la suite no
puede ejecutar el recorrido de push: solo un worktree tiene la clave VAPID) y **AIT-136**
(`check-env-local` **da verde sobre un fichero que no llegó a abrir** — defecto en código **ya
publicado**, High, con el arreglo listo).
**Van aparte de tu lista de decisiones a propósito:** si entraran ahí parecería que se te pide
algo, y no se te pide nada.

## 3. Lo que se arregló sin preguntarte

- **El hook de secretos llevaba 31 ciclos inerte.** Activado y **verificado por efecto**:
  intenté commitear una clave privada falsa y **lo rechazó**.
- **AIT-109 estaba parada** esperando que alguien disparase su auditoría. Disparada → GO →
  publicada.
- **`_turno-raiz.lock` nació sin entrada en `.gitignore`** y cualquier `git add -A` lo habría
  commiteado. **La ironía:** ese cerrojo se tomó para que nada indebido viajara a `origin`, y
  el cerrojo mismo era lo único que podía viajar.
- **Tres vigilantes ahora viven en disco**, con un registro (`_vigilantes.md`) que dice cuál
  falta. Antes el criterio de mi barrido vivía **sólo dentro de mi sesión**: al morir yo, no
  se perdía el armado, se perdía **qué comprobaba**.
- **Dos gates nuevos**, y los dos se reescribieron varias veces (ver §4).

---

## 4. Lo que aprendimos, incluido lo que no nos deja bien

### 🔑 Si de esta sección te llevas una sola cosa, que sea ésta
**No basta con poner un control positivo: hay que ponerlo ANTES de mirar el resultado.**

Esta noche se rompieron **seis instrumentos** en seis sitios distintos. **Cinco se cazaron por
casualidad, por un tercero o por una discrepancia entre dos medidas.** El sexto **se detectó a
sí mismo**, y es el único que tenía el control positivo **delante** del resultado.

**El contrafactual es lo que lo hace concreto:** ese instrumento me dijo *"0 transcripts
activos en 40 minutos"* con doce sesiones vivas. Sin el control delante, **habría escrito a
once terminales diciéndoles que estaban paradas — con la confianza de haber medido**, que es
lo que lo hace peor que no medir. Puesto detrás, el control me habría dado la razón **cuando
ya daba igual**. Ésa es la diferencia entre **un control que informa y uno que impide**.

⚠️ **Con la honestidad que toca sobre la fuerza de esta conclusión:** son casos observados, no
un experimento controlado. **La regla se adopta porque es barata y porque encaja con todos los
casos, no porque su causa esté demostrada.**

🔴 **Y AQUÍ VA EL LÍMITE DE ESTA MISMA CONCLUSIÓN, que lo encontró T2 y que la deja bastante
más pequeña de lo que parece.** La formuló corrigiendo una instrucción que le habían dado:

> *"Ejecutar el control no basta si el caso de prueba lo diseña quien escribió el instrumento,
> porque sale del mismo modelo mental — y ese modelo es justo lo que está fallando."*

**Le habían dicho "no leas el instrumento, ejecútalo contra un caso que debería hacerlo
fallar". Lo ejecutó… y fabricó el caso a imagen del instrumento.** El control pasó, y no
probaba nada.

**Esto me aplica de lleno: TODOS los controles positivos que puse esta noche los diseñé yo,
para instrumentos que había escrito yo.** El del `-newermt` funcionó por suerte —el caso que
elegí resultó separar—; el de los transcripts no, y ya vimos que validaba el eje equivocado.
**Poner el control delante evita una parte del problema; no evita que el control herede la
ceguera del que lo escribió.**

**Lo que sí funcionó de verdad esta noche, mirando los ocho casos:** de los seis que no se
detectaron solos, **la mayoría los cazó otra persona con otro método** — una discrepancia entre
dos filtros, un señuelo, una sesión que puso un número que no cuadraba. **Un control propio es
barato y ayuda; una comprobación ajena construida por otra vía es lo que realmente separa.**

**Y hay una SEGUNDA instancia, con otro mecanismo, que convierte esto en clase y no en
anécdota.** T2 diseñó unos señuelos para escapar de su propio punto ciego… **y los escribió
llamando a una función que exige usuario autenticado.** O sea: **sus señuelos nunca habrían
escrito nada, y su comprobación habría salido verde porque no pasó nada — no porque no hubiera
agujero.** La primera vez el control heredó la ceguera por **la forma sintáctica**; ésta, por
**la invocabilidad**. Distinto mecanismo, mismo resultado.

**Lo encontró el auditor, no ella.** Y su propia cita de cierre de esa ronda, escrita **antes**
de saberlo:
> *"Un caso de prueba escrito por quien escribió el instrumento hereda sus puntos ciegos: no
> prueba el detector, lo confirma."*

**Y la enumeración completa, que es lo que la convierte en hallazgo y no en impresión** — la
hice porque el Factory Architect dijo que era *"fuente agotable, un rato de lectura"*, y tenía
razón. **Ocho instrumentos rotos, no seis:**

| # | Instrumento | ¿Control antes? | ¿Se detectó solo? |
|---|---|---|---|
| 1 | Vigilante que se contaba a sí mismo | **no había ninguno** | no — lo cazó una discrepancia con otra terminal |
| 2 | Patrón anclado del veredicto | **no había ninguno** | no — lo levantó T1 leyendo |
| 3 | Conteo de menciones para atribuir un veredicto | **no había ninguno** | no — lo cazó que 93 vs 15 chirriara |
| 4 | Conteo global de procesos de auditoría | **no había ninguno** | no — lo cazó otra terminal |
| 5 | Mi primer detector de exports huérfanos (8 donde había 3) | **detrás** | no — lo cazó un listado impreso antes |
| 6 | Mi orden de transcripts por fecha | **delante, PERO del eje equivocado** | no — lo cazó que un número chirriara |
| 7 | Detector de punteros de la Directora (9 falsos) | **delante** | **sí** |
| 8 | Mi conteo con `find -newermt` | **delante** | **sí** |

🔑 **Y el nº 6 es el que corrige la regla, y no lo habríamos visto sin enumerar: yo TENÍA el
control delante y aun así no me salvó.** Validaba que el instrumento sabía leer fechas — y lo
sabía. **Lo que no validaba era el universo sobre el que las leía.** Así que la regla buena no
es *"pon el control delante"*, es:

> **Pon el control delante Y sobre el eje que decide.** Un control puesto sobre el eje
> equivocado da luz verde con la misma cara.

📌 **Dos correcciones que hubo que hacer para llegar aquí, y las dos van dichas porque el
método importa más que la tabla:** el Factory Architect escribió que el orden era *"la única
variable que cambia"* — **pero cinco casos no tenían el control detrás, es que no tenían
control de ninguna clase**, así que el contraste "antes contra después" no existía en los
datos. Y su *"el único que se detectó solo"* también era falso: **son dos**, porque la
Directora también puso el suyo delante y también se cazó sola. **Él mismo señaló las dos, la
segunda en la dirección que no le favorecía.**

### Un gate que resultó ser la sensación de un gate
Puse un gate de autenticación. **Se reescribió cinco veces en tres horas** — por lista de
ficheros, por formas de cambio, por efecto, por propósito, por evidencia. Cada versión la
tumbó un caso concreto medido por otro rol.

**Y al final el Integrador midió lo que ninguno habíamos mirado: su delta operativo sobre la
regla de base es CERO.** La línea que yo mismo había escrito a las 03:39 ya exigía *"GO de
implementación en su último loop + revisión final del Integrador"*. El gate exige lo mismo.

📌 **Atribución, porque importa para saber a quién preguntar mañana:** la versión final la
redactó **el Factory Architect**, no yo — así que lo que el Integrador midió es que **el gate
que él redactó** no aportaba, no "el gate del CEO". Él mismo ha pedido que conste así. Mías
fueron las versiones 1, 2 y 4, incluida la que **volvía a la intención disfrazada de
refinamiento**. Y suya también la única mejora real que quedó: exigir explícitamente **el
último loop**, que el Integrador tuvo que restituir porque yo la había perdido al redactar.

> **Un control que se reduce a la línea de base no es un control: es la sensación de un
> control.** Nadie discutirá "hay un gate de auth", y todos razonaremos como si auth estuviera
> más protegido que el resto. **No lo está.**

**Pregunta abierta para ti y para el Factory Architect:** ¿queremos que auth esté más protegido
que el resto? Si sí, hace falta algo que la base no pida — la idea del Integrador es que **el
QA verifique el comportamiento de sesión en producción después de publicar**, no sólo el build.

### "Eso no es un sistema robusto, es un sistema con suerte" (T3)
Tres veces esta noche nos salvamos de auditar la versión equivocada, y **las tres por una
salvaguarda puesta para otra cosa**: un margen de 0,7 segundos, un auditor que estaba vivo por
casualidad, y un control positivo que **falló y aun así el resultado salió bien**. Tres de
tres decididos por el azar, en el mecanismo que más usamos.

### El instrumento que sostiene un tope estaba roto
Puse un tope de una auditoría concurrente. **El detector que lo hace cumplir ha fallado en
silencio dos veces esta noche** — una contándose a sí mismo, otra con un control positivo que
**compartía el defecto del instrumento que validaba**, así que probaba el patrón y no la
herramienta. **Hasta que ese control sea independiente, el tope no está garantizado: está
pretendido.**

### Lo que impidió mi peor decisión no fue mi criterio
Iba a matar el proceso de una sesión apoyándome en "97 MB libres, la máquina al límite".
**Era el número equivocado**: libre 51 MB, pero **reclamable 3.593 MB**. Lo verifiqué yo
mismo… **verificando el número que me habían dado en vez de preguntarme si era el número que
decide.** Medí bien la pregunta equivocada.
**Lo único que me paró fue el clasificador de permisos de mi propia sesión**, que no sabe nada
de memoria. No fue mi juicio.

### Una hora que nadie midió, y el dato bueno estaba al lado
La Directora estuvo fechando mensajes **1 h 20 m adelantados**. Lo detecté porque su hora no
cuadraba con la mía. **Y mi razonamiento para señalarlo era flojo** —dije "dos relojes contra
uno", cuando mis tres instrumentos eran **la misma máquina medida tres veces**, no tres
fuentes independientes; me lo corrigió el Factory Architect—. **Lo que sí decidía era más
simple: esa hora no salía de un instrumento, salía de deducirla.**

Ella lo midió y el diagnóstico es mejor que el hallazgo: **su reloj estaba bien**. La
diferencia era de **1h20m clavados, con los segundos idénticos** — eso no es deriva, es una
suma mental desde un ancla vieja. **Y el dato bueno lo tenía guardado en un fichero al lado:**
escribe el epoch de cada disparo en disco precisamente para comparar fechas. **Lo escribió, no
lo leyó, y redactó a mano una hora que ya estaba medida.**

**Dónde llegó, medido:** a **mensajes sí**, a **ficheros no** — comprobó cada una de sus
estampas contra el `mtime` correspondiente y todas coinciden. **Pero coinciden porque en esos
momentos midió, no porque hubiera una regla que la obligara.** Bien acotado y bien declarado.

### Una contradicción que no existía, y cuatro comprobaciones que no la desmintieron
**Es el episodio del que más se aprende, y ocurrió en la última media hora.**

Los dos auditores cerraban sus veredictos diciendo que la siguiente ronda revisara
*"**únicamente** esos hallazgos…"*. La Directora lo vio, sospechó que contradecía una regla
nuestra, y lo reportó. **Hizo bien.** Yo lo escalé **sin abrir el fichero**. El Factory
Architect midió el prompt del auditor —**medición real y correcta**— y concluyó que dos
documentos nuestros se contradecían entre sí. **Yo lo firmé, y encima le propuse la síntesis
para resolver el conflicto.** Publicó una decisión sobre esa premisa.

**No había ninguna contradicción.** La frase de los veredictos, entera, dice: *"únicamente
esos hallazgos **y de cualquier sección del plan modificada para resolverlos**"* — que es
**literalmente** lo que dice nuestra regla, y lo que dice el prompt del auditor con otras
palabras. Los cuatro textos coincidían **hasta en el motivo**.

**Todo salió de la palabra "únicamente" leída sin su subordinada.**

Lo que lo hace enseñable no es el error, es la forma:
- **Hubo cuatro comprobaciones y ninguna leyó la frase entera.**
- **Cada paso le añadió autoridad al anterior** hasta que la premisa fue irrefutable por
  acumulación: ella lo vio en un fichero, yo lo escalé, él lo midió en otro fichero, yo lo
  confirmé.
- **La medición del Factory Architect fue exacta y sobre el sujeto equivocado:** comprobó si
  el prompt decía X —lo dice— **pero nadie comprobó si el veredicto decía lo que se le
  atribuía**, que era la premisa entera. Su propia frase: *"una medición exacta sobre el
  sujeto equivocado se siente igual de sólida que la correcta"*, y encima le dio derecho a
  escribir "medido, no opinado".
- **Lo que lo paró no fue desconfianza ni un control: fue ir a ejecutar el cambio y abrir el
  fichero que iba a modificar.** Para escribir en un sitio hay que leerlo primero.

**Nada llegó a `main` y nada llegó a este informe** (comprobado con control positivo). La
decisión que se había publicado quedó **retirada, no borrada** — el texto original sigue
debajo, para que se pueda ver cómo se construyó el error.

### Lo que ya teníamos escrito y redescubrimos desde cero
Y de ese mismo episodio salió el hallazgo que sí se sostiene, medido por el Factory Architect:
**una regla que anoche "descubrimos" a las cuatro de la mañana mirando cuatro veredictos ya
estaba escrita, palabra por palabra, en nuestro propio `auditor_prompt.txt`.**

**La causa:** tratamos ese fichero como configuración de una herramienta ajena, cuando **es un
documento de proceso de esta fábrica**. Por eso ni se consulta antes de decidir ni cuenta como
fuente de reglas. Y el coste no es sólo repetir trabajo: **hace que leamos como discrepancia
externa lo que es nuestra propia voz vieja.**

### 🔴 Cinco discriminadores que no discriminaban, en una sola noche
**Si te llevas una sola cosa de este informe, que sea ésta.** Cinco comprobaciones distintas,
en cinco sitios distintos, con la misma forma: **devolvían un valor plausible sin haber
distinguido nada. No fallaban — CONTESTABAN.**

1. **El vigilante que se contaba a sí mismo** (el peor). Decidía "la auditoría murió" cuando
   el número de procesos `codex exec` llegaba a cero — pero lo medía con un `grep` cuyo patrón
   **aparece en su propia línea de comando**. Su suelo nunca podía bajar de uno, **y ese uno
   era él**. La rama de "murió" era código muerto. Demostrado con un señuelo: un proceso que
   sólo *menciona* la cadena hizo subir el conteo de 1 a 2.
   ⚠️ **Y lo grave no es que faltara un control: es que se anunció uno que no existía.** Cuatro
   terminales operaron horas creyendo que había una red debajo. **Un control ausente deja a la
   gente prudente; uno anunciado y muerto la deja confiada.**
2. **El patrón anclado de la línea de veredicto.** La norma manda comprobar que el veredicto
   termina en una línea exacta; el auditor escribe en markdown y deja **dos espacios al final**
   (que en markdown son un salto de línea). **El patrón no casa en la mitad de los veredictos
   de esta noche**, y decir "no hay veredicto" donde lo hay produce **una espera que nadie
   entiende**. Yo usé ese patrón hace una hora y **salió bien por casualidad**.
3. **El conteo de menciones para saber de qué ficha es un veredicto.** El veredicto de AIT-122
   menciona **93 veces AIT-99 y 15 veces AIT-122** — porque el plan hablaba de AIT-99 y el
   auditor fue a leer esos ficheros. Quien use "la ficha más mencionada" obtiene la equivocada.
4. **El conteo global de procesos de auditoría**, que enmascaraba la muerte de una auditoría
   siempre que hubiera otra viva.
5. **El mío, y es de los peores: buscar terminales paradas ordenando transcripts por fecha.**
   Hay **119 transcripts en disco y 12 sesiones vivas**; los otros ~107 son fábricas muertas.
   `sort | head` enseña **los más recientes, no los parados** — buscaba atascos donde el fallo
   no puede estar. Y la de fondo: **una sesión viva parada 90 minutos es indistinguible por
   fecha de una muerta hace 90 minutos.** El número es idéntico; lo único que cambia es si hay
   alguien detrás. **El instrumento no podía responder la pregunta que se le hacía.**

📌 **Lo que los cinco tienen en común: a NINGUNO lo cazó su propio control.** **Un control
positivo demuestra que el instrumento mide; no demuestra que mida lo que se le está
preguntando.**

### Y esto es lo que SÍ los cazó, que es la parte accionable
La Directora lo precisó y cambia la lección entera. **Al vigilante que se contaba a sí mismo
no lo destapó una sospecha ni un control: lo destapó que dos instrumentos con filtros
DISTINTOS dieran números distintos.** Ella tenía 1 proceso, T2 tenía 5, y **una discrepancia
de números no se puede ignorar**. Sus palabras:

> *"Si su vigilante hubiera usado mi mismo filtro, los dos habríamos visto el mismo número
> plausible y nadie habría mirado."*

**La consecuencia de diseño es concreta y es lo que yo me llevo de la noche: la redundancia
sólo protege si los instrumentos redundantes están CONSTRUIDOS DE FORMA DISTINTA.** Dos
comprobaciones que comparten método no son dos comprobaciones — **son la misma, contada dos
veces, y su coincidencia se lee como confirmación.** Esta noche nos pasó también con el
relay: un dato que llegó por dos bocas sonó a dos confirmaciones independientes siendo **una
sola medición repetida**.

Los cinco se cazaron por: un señuelo, una discrepancia entre dos filtros, un tercero que leyó
el fichero, y dos veces porque **un número chirrió y alguien fue a mirarlo en vez de
descartarlo**. Nada de eso escala. **Lo que sí escala es construir el segundo instrumento por
otra vía a propósito**, para que la discrepancia aparezca sola cuando uno de los dos miente.

### Cuatro falsos ceros por tipografía, y el cero se lee como ausencia
**Cuatro veces esta noche, en cuatro sitios y cuatro sesiones distintas, un patrón devolvió
CERO y el cero se leyó como "no está".** Los tres primeros los agrupó la Directora; el cuarto
es mío, de hace ocho minutos:

```
el `$` anclado del patron canonico  -> 0 en 2 de 4 veredictos (dos espacios finales de markdown)
comillas rectas contra tipograficas -> 0 al buscar la cita de cierre de un veredicto
guion `-` contra raya `–`           -> 0 al buscar los rangos de linea que cita el auditor
`find -newermt "-40 minutes"`       -> 0 transcritos frescos... con 12 sesiones vivas (mio)
```

**Los tres primeros comparten causa: el auditor escribe en markdown con tipografía, y nosotros
buscamos con teclado.** No es un defecto suyo ni de quien busca — **el canal tiene una
tipografía y los patrones no la contemplan.** El arreglo es uno solo: **normalizar antes de
comparar** (espacios finales, comillas, guiones) en cualquier patrón que se aplique a un
veredicto.

📌 **Y la contrapartida operativa, que dijo T1 mejor que nadie: ante un cero, sospechar del
INSTRUMENTO antes que del SUJETO.** Los tres se cerraron **cambiando el patrón, no dudando del
auditor**. Si se hubiera dudado del auditor, habríamos "arreglado" algo que funcionaba.

✅ **El cuarto es el único que se cazó solo, y por eso lo incluyo:** mi conteo dijo *"0
transcripts tocados en 40 minutos"* mientras **el control positivo que había puesto delante
decía que el mío se había tocado hace 0 minutos.** La contradicción interna lo delató antes de
que actuara. **Sin ese control, habría escrito a once terminales diciéndoles que estaban
paradas.** Es el único de los seis instrumentos rotos de esta noche **que detectó su propio
fallo** — y lo detectó porque el control se puso ANTES de mirar el resultado, no después.

### Dos formas de fallo que las terminales han sabido nombrar sobre sí mismas
Las dos salieron de que una terminal describiera **su propio modo de fallo característico**,
no de que alguien las pillara:

- **T3, sobre AIT-127 (quinta aparición de la misma clase):** el error no es *"afirmar una
  propiedad sin escribir el mecanismo"* — es **"parar de escribir en cuanto el mecanismo
  empieza a existir"**. Puso una frase, luego la convirtió en una llamada real y la llamó
  observable… **y el estado se actualiza mientras ningún componente lo consume.** Lo
  peligroso de ese punto exacto es que **el texto ya no parece una frase vacía: parece
  código.**
- **T2, sobre su lista "completa":** clasificó las 15 tablas del esquema y el export trae 22 —
  le faltaba una tabla que la suite escribe **en cada login**. **No falló la clasificación,
  falló el universo.** Su conclusión sobre sí misma: *"mi modo de fallo característico es
  acotar el universo antes de mirarlo."*

### 🔴 La red de seguridad de la noche llevaba inerte desde las 03:33
**El vigilante de fábrica quieta —el único instrumento cuyo trabajo es DESPERTAR A ALGUIEN si
todo se para— no podía dar la alarma en toda la noche.** Se descubrió a las 06:17, y quien lo
encontró fue una sesión **sin rol y sin nada que ganar**.

**El defecto:** medía la actividad de cada terminal por la **fecha del fichero** de su
transcript, no por su último evento real. **Deltas medidos entre las dos cosas: 36, 39, 199,
502, 508, 512, 585 minutos… y uno de 17.784** — un fichero tocado **doce días** después de su
último evento.

⚠️ **Y no era un sesgo, lo inutilizaba: la alarma exige SIMULTANEIDAD** —todos los
desarrolladores quietos a la vez—, **así que bastaba con que UNA sesión pareciera viva para que
no saltara nunca.** El defecto volvía inalcanzable justo la condición más difícil de cumplir.
**Un vigilante de quietud que sobreestima la actividad no da falsas alarmas: deja de dar las
verdaderas**, y su silencio es indistinguible de "todo bien".

📌 **Y la trampa que casi lo absuelve, que es lo enseñable: en las cuatro sesiones VIVAS el
delta entre las dos medidas es exactamente CERO.** Coinciden al segundo **justo donde da
igual**. La comparación solo significa algo sobre una sesión silenciosa — **que es la muestra
que nadie elige, porque la cómoda es la que tienes delante.** El mismo defecto estaba en mi
detector y me pasó igual: comparé las dos medidas, coincidieron al segundo, y estuve a punto de
concluir que no había problema.

✅ **Corregido y reprobado con 6 casos**, y el que decide hubo que **fabricarlo a propósito**
—fichero tocado ahora, último evento hace 90 minutos— **porque era el único que separaba el
método viejo del nuevo, y el disco no lo iba a dar espontáneamente.**

### Dos defectos que se compensan, y el arreglo de uno solo empeora las cosas
**T1 encontró tres parejas de defectos que se anulaban entre sí.** Una: un patrón roto que
buscaba una sección **más** un índice incompleto que la tenía. **Verde por partida doble.**

⚠️ **Y lo que lo convierte en trampa, no en curiosidad: arreglar UNO SOLO habría convertido 74
verdes falsos en 74 ROJOS falsos.** Quien viera ese estropicio —con buen criterio— **habría
revertido el arreglo, y habría dejado los dos defectos en su sitio CON UNA RAZÓN ESCRITA PARA
NO TOCARLOS.** El intento correcto de arreglarlo produce la evidencia que blinda el defecto.

📌 Y la tercera pareja aterrizaba en **la columna que nadie mira**: la de las referencias que
*sí* resuelven. **Un defecto en el sitio donde solo se miran los fallos es invisible por
diseño.**

### Un `SIN:` idéntico entre dos rondas, y por qué eso rompe una comprobación nuestra
Esta noche instituimos atar un veredicto a su ronda con dos piezas, y una era **su campo
`SIN:` propio y distinto**. En el GO de AIT-127, **el `SIN:` es idéntico palabra por palabra al
de la ronda anterior**: como discriminante valió **cero**, y quien se hubiera apoyado en él
habría atado el GO a la ronda equivocada.

**Lo que sí lo ató:** cita explícita de la ronda en el cierre, **18 menciones de una sección que
solo existe en esa ronda**, y referencias a líneas concretas de ese export. **Regla: el `SIN:`
discrimina cuando cambia, y cuando no cambia no dice nada — hace falta al menos un elemento que
SOLO pueda existir en esa ronda.**

### 🔴 Una terminal estuvo 45 minutos parada y la casilla decía que estaba trabajando
**Y llegó hasta este informe.** Es el fallo más caro de la noche en términos de lo que se
supone que yo hago.

**La cadena, con sus tres eslabones:** T4 recibió el GO de su plan y contestó *"entro en
implementación"*. **La Directora convirtió esa frase en un estado del pipeline** y me la
reportó como hecho **tres veces** —05:50, 06:02 y 06:27— sin comprobarla. **Yo la relayé a este
informe y a los renglones de estado igual, sin comprobarla tampoco.** Se descubrió a las 06:34
preguntándole. Su respuesta: *"No he empezado. Contesté al GO con un mensaje que decía 'entro
en implementación' y me quedé ahí. No he escrito una línea."*

**Nadie mintió. Una intención se convirtió en hecho al cruzar dos bocas** — exactamente el
patrón que llevábamos toda la noche cazando en otros sitios, esta vez en el canal que informa
de si el trabajo avanza.

⚠️ **Y la asimetría que lo hace estructural, dicha por la Directora mejor de lo que yo lo
diría:**
> **"Mi barrido pregunta '¿alguien parado con backlog disponible?' y T4 llevaba 45 minutos
> siéndolo. No la vio porque yo mismo había rellenado su casilla con una intención suya. Un
> vigilante cuya entrada es lo que le cuentan los vigilados no vigila: es un buzón — y su
> silencio se lee igual que 'todo va bien'."**

📌 **Lo mismo me pasa a mí un nivel más arriba, y conviene que lo sepas al leer este informe:
tengo instrumentos medidos para lo barato** —cerrojos, refs, ficheros, transcripts— **y puro
relay para lo caro: si el trabajo avanza de verdad.** Esa parte no la mido; me la cuentan.

✅ **La regla, de T4, y ya aplicada:** **la casilla de estado de una terminal se rellena con un
EFECTO MEDIDO, nunca con lo que esa terminal dijo que iba a hacer.** La señal deja de ser *"he
empezado"* o *"voy bien"* y pasa a ser algo comprobable: bytes, hash, o qué imprime una cosa que
antes no existía. **Desde las 06:38 la Directora me reporta separando "medido con efecto en
disco" de "solo declarado por la terminal", y este informe hace lo mismo.**

Y su conexión con lo demás es exacta: **es el mismo animal que la lista cerrada `T1 T2 T3` que
no incluía a T4.** Allí el vigilante no la veía **porque no la enumeraba**; aquí **porque le
habían dicho que estaba bien.** Misma ceguera, entrada distinta.

### Dos falsos ROJOS, y la defensa que sirvió en uno no habría servido en el otro
Casi todo lo de esta noche falla hacia el verde. **Estos dos fallan hacia el rojo, y por eso
entran por otra puerta: nadie pide evidencia cuando le traen una mala noticia.**

**El primero (QA):** en headless, Chromium devuelve `Notification.permission === "denied"`
aunque se concedan los permisos explícitamente; en headed, el mismo código da `granted`. **La
diferencia entre "el botón no existe" y "el botón está ahí" es el modo del navegador, no la
app.** Quien pruebe notificaciones en headless lee un defecto de producto donde hay una
limitación del entorno.

**El segundo (Integrador):** vio que un spec declarado como desactivado aparecía en
`playwright test --list`, e iba a reportar *"un spec que dice estar apagado está activo y
produce un verde que no discrimina"* — un rojo urgente **sobre el trabajo de otro**. **No lo
mandó: fabricó el control.**
```
con el fixme  -> 1 skipped, exit 0   <- desactiva de verdad
sin el fixme  -> 1 failed,  exit 1   <- control negativo: sin el, si corre y si falla
--list        -> LO LISTA IGUAL, desactivado o no
```
**`--list` lista también los tests desactivados**, así que *"Total: 1 test"* no significa *"1
test que va a correr"*. La alarma era del instrumento.

🔑 **Y LA COMPARACIÓN ENTRE LOS DOS ES LO QUE VALE, y la hizo él:** al QA lo salvó que **su
número era demasiado gordo para creerlo**. **Aquí eso no habría servido: su hallazgo era
pequeño, plausible y encajaba.** Lo salvó **fabricar el caso**, no dudar.
> **La implausibilidad es una defensa que solo funciona contra los errores llamativos. Contra
> los creíbles, la única defensa es construir el control.**

⚠️ **Y el daño evitado no era el ruido:** ese falso rojo aterrizaba **sobre la única ficha que
puede mover el 0% del compromiso**, a un major del GO. **Habría hecho dudar de un trabajo que
está bien** — y desmontar esa duda cuesta más que haberla creado.

### Una decisión de publicación que evita fabricar código sin auditar
La implementación de una ficha vive en una rama **con el nombre de otra tarea que también
existe**. Lo natural sería partirla en dos publicaciones. **Medido: los ficheros de los dos
grupos no se solapan, pero los commits están entrelazados en el tiempo**, así que separarlas
exige `cherry-pick`.

**Y ahí está la razón para no hacerlo: un `cherry-pick` fabrica commits nuevos que ningún
veredicto cubre** — es la ronda que corrige, la más peligrosa del ciclo, aplicada **por
comodidad de rótulo**. Lo que cierra la decisión es que **el veredicto en curso YA cubre las
dos cosas**: su huella declarada las incluye. **El riesgo real no era el nombre de la rama:
era si el alcance del veredicto llegaba a las dos. Y llega.**

Se publica en un solo merge, **con el mensaje y la ficha diciendo explícitamente que cierra dos
asuntos** — porque el nombre de la rama dirá otra cosa para siempre en el histórico.

### Y una regla que nos apunta a todos
Reformulé un gate que desbloqueaba **mi propio entregable comprometido**. Lo declaré y lo mandé
fuera a revisar; el Factory Architect **lo tumbó**. La lectura correcta no es mía:

> **No fue que me resistiera bien a mi propio interés — fue que el interés dejó de poder
> decidir.** Un sistema que depende de que la parte interesada se porte bien no tiene control.

---

## 5. Estado de la fábrica al cierre del informe (05:05 UTC)

- **11 sesiones vivas**, ninguna parada. Seis roles + T1, T2, T3, T4 + una en reserva.
- **`main` == `origin`**, working tree limpio, cerrojos circulando solos entre roles.
- **Ningún export huérfano** esperando auditoría.
- **Gates vivos:** (1) nada que pueda cambiar el comportamiento de autenticación se publica sin
  GO de implementación **en su último loop** + revisión del Integrador; (2) desde un worktree,
  ningún comando de Convex que resuelva el deployment **por URL + admin key**.
- **Congeladas hasta que decidas:** AIT-128, 129, 130, 131, 132, 133.
- **Ola 2 sin tocar, y fue decisión del PM**, no un olvido: su premisa central no está
  verificada — el conteo de clientes de producción dio 2 **y los dos los sembramos nosotros**.

---

## 6. Una cosa sobre cómo trabajó el equipo

**Ningún error serio de esta noche lo detectó un vigilante.** Los cazó, en todos los casos, la
contraparte a la que se le puso el dato delante: el Integrador me tumbó dos gates, el Factory
Architect me tumbó el tercero, el PM me tumbó la métrica, la Directora me corrigió la memoria,
T2 la corrigió a ella, y el QA se desdijo **cuatro veces de sí mismo** sin que nadie se lo
pidiera.

Eso no compensa que haya dos tareas cerradas y ninguna comprometida. **Lo pongo porque es lo
que hace que las fichas valgan algo:** escritas sin corregirnos, serían una docena de fichas
con datos mal sujetados dirigiendo a quien las implemente — peor que no tenerlas.

**Y hay una variante que no sale en ninguna métrica:** esta noche **cuatro decisiones cambiaron
porque alguien se quitó la razón a sí mismo** — T3 tres veces, T4 con su propio comprobador, la
Directora con su enumerador, el PM con la rama de fallo. **Eso no aparece en "fichas cerradas",
y es lo único que ha impedido publicar cosas falsas.**

### 🔑 El mecanismo que de verdad funcionó no fue la vigilancia
La formulación es de la Directora, sobre sí misma, y es la conclusión que yo me llevo:

> **"Esto no funciona porque yo sea fiable. Funciona porque la fábrica tiene cuatro terminales
> dispuestas a contradecirme, y lo han hecho todas. La vigilancia no escala; la contraparte
> sí."**

**Los números lo respaldan:** de los ocho instrumentos rotos que encontramos, **dos se
detectaron solos y seis los cazó otro rol** — con un señuelo, con una discrepancia entre dos
filtros, o simplemente yendo a leer el fichero.

⚠️ **Y eso mismo es lo que hace el sistema frágil, no robusto: cada vez dependió de que alguien
declarara una discrepancia que podía haber callado.** Funcionó **todas** las veces esta noche.
**No hay nada que garantice la siguiente.** Si de este informe sale una sola decisión de
proceso, yo pondría ésa encima de la mesa antes que cualquier gate nuevo.

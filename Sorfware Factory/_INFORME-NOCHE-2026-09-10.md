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

### 🥉 AIT-99 — dos autorizaciones. Es lo más caro que tenemos parado.
**No cierra, y no es cuestión de tiempo.** Ronda 2 de código NO-GO, y sus `SIN:` de las
rondas 1 y 2 **coinciden en tres de cuatro**. Los tres huecos solo los quitas tú:
- crear cuentas en el Convex compartido está **vetado** (ya hay una credencial expuesta),
- retirar las cinco cuentas sembradas es **AIT-131**, y la siembra **no tiene inversa**,
- falta un **deployment virgen**.

**Dos salidas, y no elegí ninguna a propósito:**
- **(a)** autorizar lo mínimo para medir — descongelar AIT-131, o permitir N cuentas acotadas.
- **(b)** cerrarla aceptando los tres huecos con nombre en la ficha.

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

### 6. Cinco identidades `ait99-*` en el Convex compartido
Declaradas, inertes (T1 borró su credencial) y **sin forma de retirarlas hasta AIT-131**. No
urge: es para que las veas en el dashboard sin sorprenderte.

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

La única ficha que se cerró esta noche —AIT-109— ya estaba en marcha antes de que se fijara el
compromiso. **Así que el compromiso de la noche se cumplió en un 0%, y lo digo con ese número
antes de dar ninguna explicación.**

| | |
|---|---|
| **CERRADO** | **1** — AIT-109 (publicada, servida en 99 s, suites en verde, `npm run build` verificado) |
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

**Las dos líneas de arriba nunca se restan.** Lo intenté —presenté "10 creadas, 1 cerrada,
balance −9"— y el PM me lo tumbó con el argumento que lo cierra: **con esa métrica, una noche
en la que nadie mira nada sale mejor que ésta.** Una ficha nueva **no es deuda contraída, es
deuda descubierta**: el defecto de AIT-127 llevaba semanas en producción y abrirlo no empeoró
el CRM ni un poco.

**Lo que sí sobrevive de aquella preocupación, y es real:** nadie llevaba la cuenta, y
**descubrir en vez de cerrar fue una elección de alcance que nadie estaba viendo mientras la
tomaba.**

---

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

Eso no compensa que haya una sola tarea cerrada. **Lo pongo porque es lo que hace que las diez
fichas valgan algo:** escritas sin corregirnos, serían diez fichas con datos mal sujetados
dirigiendo a quien las implemente — peor que no tenerlas.

# Gates vigentes de la fábrica

**Este fichero recoge los gates TRANSVERSALES, los que se pusieron sobre la marcha y no viven
en ningún documento de rol.** Si un prompt, un cron o un mensaje contradice uno de estos,
**manda este fichero**.

> 🔴 **LO QUE ESTE FICHERO NO ES, Y HAY QUE LEERLO ANTES DE FIARSE: NO ES LA LISTA COMPLETA DE
> LO QUE TE PUEDE FRENAR.** Nació diciendo *"la fuente de verdad de qué gates están vivos"*, y
> **eso era falso por completitud**: omitía la **57.1** (`integrador.md`), que obliga al
> Integrador a correr la suite antes de publicar un cambio que toque un fichero compartido.
> **Lo cazó el Integrador negándose a publicar por una regla que este fichero no mencionaba**,
> después de que el CEO le dijera —mirando solo este fichero— que no había nada que le frenara.
> **CADA DOCUMENTO DE ROL LLEVA SUS PROPIAS OBLIGACIONES.** Este fichero no las sustituye: las
> complementa. **Antes de concluir "no hay gate que aplique", lee también tu documento de rol.**
> 📌 La forma, que es la de toda esta noche: **una lista que se presenta como completa no deja
> el hueco donde estaba — lo tapa con una absolución.** Quien lea "aquí están todos los gates"
> y no vea el suyo, concluye que no lo tiene.

## Gate 0 — el que no estaba aquí: la suite antes de publicar (57.1, `integrador.md`)

> **Antes de publicar un cambio que toque un fichero COMPARTIDO por varios specs, el Integrador
> corre la suite con `--workers=1`.** Si no cabe en memoria o no se puede correr, **publica
> diciéndolo — y va en la FICHA DE PUBLICACIÓN, no solo en un mensaje.**

**Por qué el matiz de dónde se declara:** *una suite saltada que solo consta en un chat
desaparece con el chat.* La ficha sobrevive; el mensaje no.

**Y "compartido" no es una lista de ficheros, es una propiedad:** el caso que lo destapó tocaba
`e2e/global-setup.ts`, que es el `globalSetup` de **toda** la suite — **más compartido que el
ejemplo que la propia regla nombra**. Si rompe algo, lo rompe en los 38 specs a la vez.
⚠️ Ojo a la dependencia cruzada: **la suite necesita el deployment de Convex**, así que este
gate puede quedar en espera detrás del **cerrojo de Convex** (gate 3). Esperar es correcto.

> ⚠️ **POR QUÉ EXISTE (2026-09-10, dos veces la misma noche).** Los gates vivían dentro del
> prompt de un cron. Un gate se reescribió **cinco veces en tres horas** y el prompt siguió
> repitiendo la versión vieja **cada quince minutos, con la voz del sistema** — que es la que
> nadie audita. Un documento caducado espera a que alguien lo lea; **un cron caducado te lo
> vuelve a decir solo, sonando igual de vigente que el primer día.**
> **Regla que sale de ahí: un prompt programado NO enuncia reglas, apunta a dónde viven.**

---

## Gate 1 — autenticación y sesión (v5.1)

> **Un diff que pueda cambiar lo que hace el sistema al autenticar NO SE PUBLICA SIN:**
> **(a) GO de IMPLEMENTACIÓN EN SU ÚLTIMO LOOP** — no de plan, y no un GO suelto encontrado
>     en cualquier fichero de veredicto;
> **(b) revisión final del Integrador.**
> **Con las dos, se publica. Sin alguna, se retiene, SEA CUAL SEA SU PROPÓSITO.**

**Vigente desde 2026-09-10 05:0xZ.** Redacción del Factory Architect; *"en su último loop"*
restituido por el Integrador.

### Lo que este gate NO es, y hay que decirlo cada vez que se cite
🔴 **Su delta operativo sobre la regla de base es CERO.** `_modo-publicacion.txt` ya exigía
*"GO de implementación en su último loop + revisión final del Integrador"* para **cualquier**
cambio de código. **Aplicado a auth, este gate pide exactamente lo mismo.**
**Un control que se reduce a la línea de base no es un control: es la sensación de un
control.** Nadie discutirá "hay un gate de auth", y todos razonaremos como si auth estuviera
más protegido que el resto. **No lo está.** Medido por el Integrador, 2026-09-10.
📌 **Pendiente de Aitor:** si queremos que auth SÍ esté más protegido, hace falta algo que la
base no pida. Propuesta del Factory Architect, ya decidida por él en el "qué": **el QA
verifica el comportamiento de sesión EN PRODUCCIÓN después de publicar**, no sólo el build.
Lo que queda para Aitor **no es si hace falta, es si acepta el coste de que QA toque
producción para eso.**

### Las cuatro versiones que cayeron, y por qué (no las repitas)
1. **Lista de FICHEROS.** Cayó: cubría por la letra un cambio de 22 líneas de comentario, sin
   riesgo. Una lista de ficheros caduca en el commit siguiente.
2. **Lista de FORMAS DE CAMBIO** (*"¿hay líneas ejecutables?"*). Cayó: **subir
   `@convex-dev/auth` tiene cero líneas ejecutables y cambia auth entero.** Fallaba hacia
   PUBLICAR, y justo en el caso peor.
3. **Por EFECTO** (*"¿puede cambiar lo que hace al autenticar?"*). **Buen disparador
   —inspeccionable, falla hacia retener— pero era una PROHIBICIÓN**, así que bloqueaba
   AIT-127, que es entera **la reparación del defecto que el gate protege**. Punto muerto.
4. **Por PROPÓSITO** (*"nada que degrade"*). Cayó: *"degrada"* es un veredicto sobre el
   resultado, no una propiedad del diff, y **ante la duda publica**. Peor: *"su propósito es
   arreglar"* **es certificación que pone el autor** — el gate acabaría dependiendo de quien
   empuja.

📌 **La distinción que lo resolvió, y sirve para cualquier gate:** *"no se publica X"* y *"no
se publica X **sin** Y"* se parecen y **no son la misma clase de regla**. La primera es una
prohibición y **crea puntos muertos allí donde X es también la reparación de X**. La segunda
es un **requisito de evidencia** y nunca tiene punto muerto, porque siempre hay camino: traer
la evidencia. **Cuando un gate bloquea su propia reparación, está escrito en la primera forma
y debería estar en la segunda.**

---

## Gate 2 — resolución de deployment desde un worktree

> **Desde un worktree, NO se ejecuta ningún comando de Convex que resuelva el deployment por
> URL + admin key** (`--url` + `--admin-key`, `--env-file` apuntando fuera, o cualquier otra
> forma de llegar ahí). **El camino permitido es por NOMBRE de deployment.**
> **`--env-file` es un CASO CONOCIDO, no la definición.**
> **Desbloqueo: una medición, no una excepción.**

**Por qué por mecanismo y no por flag:** la primera versión nombraba `--env-file`. T4 midió
con el binario real que **`--url` + `--admin-key`, sin ese flag por ninguna parte, borra
exactamente igual.** Un gate escrito sobre **el camino por el que se descubrió el defecto** en
vez de sobre **el mecanismo que lo produce** deja abiertas las demás puertas — **y no falla
ruidosamente: falla el día que alguien usa otra, y esa persona tiene razón al decir que no
incumplió ninguna regla escrita.**
🔑 **Un gate que sólo puede incumplirse sin querer y sin señal no es un gate, es una nota.**

**El daño que evita, medido y peor de lo que decía su ficha:** además de borrar
`CONVEX_DEPLOYMENT`, **reescribe `NEXT_PUBLIC_CONVEX_URL` y `NEXT_PUBLIC_CONVEX_SITE_URL`
apuntándolas al destino del comando.** El worktree no queda *"sin saber contra qué backend
corre"*: queda **sabiendo el equivocado, de forma persistente**, y quien haga `npm run dev`
ahí después se conecta al destino ajeno sin enterarse.

---

## Gate 3 — turno de auditoría

> **Una sola auditoría concurrente.** El resto se encola.

**Razón: CORRECCIÓN DEL VEREDICTO, no memoria.** Dos auditorías solapadas sobre el mismo
fichero producen un veredicto con dos transcripts indistinguibles. (La razón original que di
—presión de memoria— se cayó al remedir: había 3,6 GB reclamables, no 97 MB. **Un límite
justificado con un número se cae cuando el número cambia; uno justificado con la forma del
daño, no.**)

⚠️ **Y este gate NO está garantizado, está pretendido:** el detector de hueco que lo hace
cumplir **ha fallado en silencio dos veces** — una contándose a sí mismo, otra con un control
positivo que **compartía el patrón del detector**, así que probaba el ancla y no la
herramienta. **Un control positivo que comparte el defecto del instrumento que valida no
valida nada, y falla hacia el ruido — así que quien lo escribe aprende a ignorarlo.**

---

## Lo que sigue necesitando el sí de Aitor, pase lo que pase con estos gates

- Nada que use **sus cuentas, su navegador o su identidad**.
- Nada **destructivo sobre datos reales**.
- **Alcance de producto nuevo** — lo decide el PM con él.
- **Cerrar una ventana que tenga a Aitor delante.** Su autorización general para "abrir y
  cerrar terminales" **no es una orden concreta sobre una sesión con alguien detrás**.

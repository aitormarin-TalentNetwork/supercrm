REVIEW SuperCRM Ola 2 — ciclo 2, ronda 1 — 2026-09-08
Claridad:       7/10 — §5/§6: la letra "H" significa tres cosas a la vez (historia H1-H8, criterio sin historia H9-H13, hallazgo de review "H8 de la ronda 3") dentro de la misma seccion; §19 numera CU6 antes que CU5. Fuera de eso se lee del tiron, con glosario y decisiones trazadas.
Completitud:    7/10 — §21 deja sin decidir sobre que campo va el indice nuevo (¿`email` canonico o `emailNormalized`?) y por tanto si hace falta migracion; §15 fija el NFR en "200 emails" para un historico que §4 declara sin tope, sin decision de paginacion.
Verificabilidad:6/10 — §6 (Permisos) exige "un error y ningun dato" donde §24 promete lo contrario y donde el patron real devuelve `null`; §6 (H13) declara FALLA lo que su propia nota de implementacion describe como correcto ("sigue pendiente mas de 30 minutos" frente a "la caducidad se evalua al leer").
Realismo:       6/10 — tres afirmaciones sobre el codigo son falsas contra `main` de hoy (§21 x3 por AIT-80/AIT-77, §24 cita `opportunities.ts:203-204` que hoy es un `insert`); §18 pone el unico freno de coste "antes del segundo vendedor" cuando la descarga sin tope del primero ocurre antes y sin puerta.
Cohesion:       5/10 — la regla nueva de §24 ("un vendedor ve SIEMPRE los emails de su propio buzon") no es representable con el modelo de §21 (un solo `userId` por email, con desempate winner-takes-all) y no llego a §17, §19-CU3 ni §20; el piloto de §4 no llego a §13.
Media: 6.2 -> DEVUELVE

Hallazgos:
  H1 [Cohesion] §24 §21 — "Un vendedor ve SIEMPRE los emails de su propio buzon" no se puede construir con la entidad de §21: `emails` guarda UN `userId` y la regla de desempate descarta el otro buzon. O `emails` guarda el conjunto de buzones que trajeron el mensaje y el permiso lee sobre ese conjunto, o §24 deja de decir "siempre" y escribe la excepcion.
  H2 [Verificabilidad] §6 (Permisos) §24 — El criterio ("recibe un error y ningun dato" al pedir un cliente que no le pertenece) contradice la regla nueva de §24 y ademas el patron que §24 manda replicar devuelve `null`, no lanza. Reescribir con las dos ramas y con "sin datos", no "error".
  H3 [Verificabilidad] §6 (H13) — El FALLA "si sigue `pendiente` mas de 30 minutos despues de su clic" reprueba la implementacion que el mismo bloque declara correcta (caducidad evaluada al leer, cron horario de higiene). Reformular sobre el efecto observable, no sobre el campo de estado.
  H4 [Realismo] §21 — Tres afirmaciones sobre el codigo ya no son ciertas: `createQuick` NO inserta incondicionalmente (AIT-80), SI hay forma de editar una ficha (`customers.update`, AIT-77, mergeado hoy), y `customers` tiene un tercer indice (`by_store_phone`). Reescribir el parrafo de duplicados con el as-is de hoy.
  H5 [Realismo] §24 — La cita `opportunities.ts:203-204` es falsa contra `main`: esas lineas son el `insert("customers")` de AIT-80; la guarda que devuelve `null` esta en 391-392. Citar por funcion, no por numero de linea.
  H6 [Cohesion] §4 §9 §13 §2 — El piloto excluye `carlos@supercrm.es`, que es la persona del PRD y una cuenta `sales` activa; las metricas 1 y 3 son inalcanzables por construccion. Acotar el denominador a "vendedores del Workspace" y nombrar a los participantes reales del piloto.
  H7 [Cohesion] §17 §19-CU3 §20 — La decision de v0.6 solo llego a §24: §17 sigue afirmando "un `sales` ve solo los emails de SUS clientes", CU3 y el diagrama tambien (y el diagrama sigue sin `storeManager`). Propagar o revocar.
  H8 [Completitud] §21 — Decir si el indice nuevo va sobre `email` normalizado en sitio (contrato canonico, como `phone` en AIT-80) o sobre un campo nuevo, si hace falta migracion (el propio §21 se contradice) y que los escritores a mantener ya son DOS, no uno.
  H9 [Realismo] §18 §8 §15 §26 — Mover la puerta de coste a antes del backfill completo del PRIMER buzon (hoy solo actua "antes del segundo vendedor", que en un piloto de 1-2 personas casi no llega a existir) y decir cual es el limite del plan de Convex vigente sobre el que se calcula el 25%.
  H10 [Completitud] §15 §6 (Ficha de cliente) — Con historico sin tope y una sola lista cronologica, el unico NFR habla de 200 emails. Añadir la decision de paginacion/ventana de lectura y su criterio.
  H11 [Claridad] §5 §6 §19 — Renombrar los criterios que no tienen historia detras (hoy H9-H13, con H13 antes que H12) o crear esas historias en §5, y separar la nomenclatura de hallazgos de review. Ordenar CU5/CU6 en §19.
  H12 [Claridad] wayfinder — El indice declara "cero decisiones abiertas" con 6 fichas, pero las dos mas nuevas (piloto interno §4/§9; "ve siempre su propio buzon" §24) no tienen ficha. Añadirlas para que el wayfinder siga siendo el registro que el PRD dice que es.

---

## Es un problema de fase?

**No.** Las premisas de §9 aguantan: la premisa madre tiene plan de verificacion y plan B
vivo, la nº2 quedo cerrada por Aitor con una decision de alcance (piloto interno) que es
coherente, y las tres NO VERIFICADO estan etiquetadas como tales con su momento de
comprobacion. El alcance de §4 es construible.

Lo que devuelve este documento es **fase 6 (documento)**, con una sola excepcion: **H1 no
es redaccion**, es una decision de modelo que nadie ha tomado — que pasa con "ve siempre
su propio buzon" cuando el mismo correo llega a dos buzones conectados y la regla de
atribucion de §21 se queda con uno. Eso es una ficha de wayfinder nueva (pequeña), no un
retroceso a premisas ni a alcance.

---

## Detalle

### H1 [Cohesion] §24 §21 — la regla estrella de la v0.6 no cabe en la entidad

§24 dice, como decision de Aitor del 2026-09-08:

> un vendedor ve **SIEMPRE** los emails de su propio buzon, aunque el cliente sea de otro
> comercial

§21 dice, para el mismo dia y el mismo problema (dos buzones conectados):

> el registro se guarda con el buzon **del remitente** si ese buzon esta conectado
> (`direction: saliente`, `userId` = quien lo envio); si el remitente no es ninguno de los
> buzones conectados, con el del **destinatario** que lo recibio (`direction: entrante`).
> Si dos buzones conectados aparecen como destinatarios y ninguno como remitente, gana el
> del dueño del cliente. La segunda sincronizacion que encuentre el mismo `Message-ID`
> **no reescribe** esos campos.

La entidad `emails` guarda **un** `userId`. Caso concreto que rompe el "siempre": el
cliente de Ana escribe a Ana y pone en copia a Carlos, ambos `sales` con buzon conectado.
Remitente no conectado → se mira a los destinatarios → dos conectados → "gana el del dueño
del cliente" = Ana. El registro queda con `userId` = Ana, y la segunda sincronizacion (la
de Carlos) **no reescribe**. Resultado: Carlos deja de ver en el CRM un correo que tiene
abierto en su Gmail — exactamente el fallo que §24 dice estar corrigiendo.

Dos salidas, las dos baratas, pero hay que elegir una:
- guardar el conjunto de buzones que trajeron el mensaje (array `mailboxUserIds`, o tabla
  puente) y hacer que el permiso "mi propio buzon" lea sobre ese conjunto, dejando
  `userId`/`direction` como la atribucion canonica que ya define §21; o
- rebajar el "SIEMPRE" de §24 a la regla real y declarar el caso perdido.

### H2 [Verificabilidad] §6 (Permisos) §24 — el invariante de seguridad tiene dos textos incompatibles

§6:

> PASA si: un usuario `sales` que invoque directamente la funcion de Convex que lee
> emails, pidiendo los de un cliente de otra tienda O los de un cliente de su tienda que
> no le pertenece, recibe **un error y ningun dato**.

§24: ese mismo `sales` **debe** ver los emails de su propio buzon con ese cliente ajeno. Un
implementador que cumpla §24 falla §6, y al reves. Ademas el criterio pide "un error"
cuando el patron que §24 manda replicar —verificado hoy en `convex/customers.ts::getFicha`
y `convex/interactions.ts::listByCustomer`— **devuelve `null`**, no lanza; el propio §24 lo
dice dos parrafos mas abajo ("devuelve `null` desde la query"). Reescribir el criterio con
las dos ramas (lo que no es suyo y no toco su buzon: sin datos; lo que toco su buzon: solo
ese correo, sin ficha ni oportunidades del cliente ajeno).

### H3 [Verificabilidad] §6 (H13) — el criterio reprueba la implementacion que el propio bloque recomienda

En el mismo bloque conviven:

> FALLA si: ... o si sigue `pendiente` mas de 30 minutos despues de su clic.
> Nota de implementacion ...: la caducidad se **evalua al leer** ... no hace falta un
> proceso que las marque. El cron horario que existe (`convex/crons.ts`) sirve para
> limpiar las viejas, que es higiene, no correccion.

Verificado: `convex/crons.ts` solo tiene `crons.interval("avisos push pendientes", { hours: 1 }, ...)`.
Con caducidad perezosa, el documento **siempre** tendra `estado: "pendiente"` durante hasta
una hora, asi que el FALLA se dispara en toda implementacion correcta. Redactarlo sobre el
efecto: "una intencion con mas de 30 minutos no se consume ni atribuye actividad, aunque su
campo de estado tarde hasta una hora en pasar a `caducada`".

### H4 [Realismo] §21 — el as-is de los duplicados es de ayer

Contra `main` de hoy (`git log`: `15ef755` merge AIT-80; `dfda452` merge AIT-77):

1. > `createQuick` inserta un cliente **incondicionalmente**, sin buscar si ya existe

   Falso. `convex/opportunities.ts` normaliza el telefono (`normalizePhone`), consulta el
   indice `by_store_phone` y, si hay coincidencia y no llega `confirmDuplicate`, devuelve
   `status: "duplicate"` con los candidatos accesibles en vez de insertar.

2. > y no hay forma de editar ni fusionar fichas

   Falso a medias, y es la mitad que importa: `convex/customers.ts::update` (AIT-77,
   mergeado hoy) edita nombre, telefono, **email** y origen, con la guarda de lectura
   (`requireUser` + `storeId` + `isStoreWideRole`/`ownerId`), no con `requireOwner`. Solo
   sigue sin existir la **fusion**.

3. > la tabla solo tiene los indices `by_owner` y `by_store` (seccion 28)

   Falso: `convex/schema.ts` tiene ademas `by_store_phone` (AIT-80). Y la remision a §28 no
   sostiene nada, porque §28 no lista ningun indice de `customers`.

Consecuencias que hay que reescribir, no solo corregir: (a) el parrafo se contradice con
el anterior, que ya usa AIT-80 como "precedente exacto y reciente ... el patron esta
probado en este mismo repositorio"; el "**AIT-80** ataca la causa; esta regla es lo que hace
que la ola no se rompa mientras tanto" habla en futuro de algo publicado; (b) la afirmacion
"el producto **fabrica duplicados de forma natural**" ya no describe el producto de hoy — la
regla de desempate sigue siendo necesaria (por los duplicados historicos y por
`confirmDuplicate`), pero su justificacion cambia; (c) §23 ("el dialogo ... ofrece añadirlo")
y §18 ("conseguir que los contactos tengan email") ya tienen donde apoyarse: la pantalla de
edicion de AIT-77, que conviene citar.

### H5 [Realismo] §24 — cita de linea que apunta a otra cosa

> (a) en el codigo, `opportunities.ts:203-204` devuelve `null` desde la query cuando el
> `storeId` no coincide

Hoy `convex/opportunities.ts:203-204` es `const customerId = await ctx.db.insert("customers", {` /
`name,`. Las guardas reales estan en 391-392:

    if (opportunity.storeId !== user.storeId) return null;
    if (!isStoreWideRole(user) && opportunity.ownerId !== user._id) return null;

La verificacion en si es correcta (la hice de nuevo), lo que no aguanta es la cita. En un
repositorio que mueve cuatro o cinco tareas al dia, citar por numero de linea garantiza que
el PRD envejezca mal: citar `opportunities.ts::getSummary` (o el nombre de la query) y
dejar el numero fuera.

### H6 [Cohesion] §4 §9 §13 §2 — el piloto no llego a las metricas ni a la persona

§4 excluye "las cuentas de prueba `marta@supercrm.es` y `carlos@supercrm.es` tal como
existen hoy". Verificado en `convex/users.ts` y `docs/03-setup.md`: `carlos@supercrm.es` es
`sales` y `aitor.marin@talent-network.org` tambien es `sales` (el owner del dominio es
`admin@talent-network.org`). Entonces:

- §13.1 ("**todos** los vendedores activos tienen su Gmail conectado a los 14 dias") no se
  puede cumplir nunca mientras exista un `sales` activo fuera del dominio. El denominador
  tiene que ser "vendedores del Workspace".
- §13.3 ("**todo cliente** que tenga email relleno y correspondencia real tiene al menos un
  email en el CRM") es inalcanzable para los clientes cuyo `ownerId` es un vendedor que no
  puede conectar buzon.
- §2 presenta a Carlos como la persona y §11.1 confirma que es "quien lo necesita tanto que
  lo usaria aunque estuviera roto" — y es justo la cuenta excluida. El PRD lo reconoce en
  abstracto ("esta ola todavia no sirve al caso de uso del PRD fundacional") pero no dice
  quien pilota de verdad. Nombrarlo: que cuentas conectan, con que clientes se prueba, y
  quien hace de "Carlos" durante el piloto.

### H7 [Cohesion] §17 §19-CU3 §20 — la decision de v0.6 solo entro en §24

- §17 conserva la fila: "Un `sales` ve solo los emails de **sus** clientes | mechanical |
  Es exactamente el modelo de permisos que ya rige hoy ... No inventar un modelo distinto
  para el email". Es justo lo contrario de lo que decidio Aitor en §24 (ver el email propio
  aunque el cliente sea ajeno **si** es un modelo distinto del que rige hoy).
- §19-CU3: "Actor: Carlos (`sales`, solo sus clientes)".
- §20: "Carlos (sales) / ve los emails de SUS clientes", y el diagrama sigue teniendo dos
  roles pese a que la ronda 2 obligo a reconocer tres (`storeManager` no aparece).

### H8 [Completitud] §21 — el indice nuevo sigue sin decidir su forma

Dos frases seguidas se contradicen:

> `convex/opportunities.ts::createQuick` guarda el email con `trim()` + `toLowerCase()` ...
> asi que lo almacenado ya viene en minusculas y sin espacios
>
> Lo que **si** hay que repetir es la migracion: un indice sobre un campo normalizado no
> encuentra las filas antiguas sin normalizar, y esas son justo los clientes veteranos.

Si lo almacenado ya es canonico, no hay filas viejas sin normalizar (verificado: el
`toLowerCase()` esta ahi desde AIT-10, el alta rapida original). La migracion solo hace
falta si la forma canonica nueva incluye algo mas (quitar la etiqueta `+`, por ejemplo) o si
se añade un campo distinto. Decidirlo explicitamente: campo `email` con contrato canonico
—como hizo AIT-80 con `phone`— o campo `emailNormalized` aparte. Y actualizar el numero de
escritores a mantener: ya son **dos** (`opportunities.createQuick` y `customers.update`),
que es exactamente el error que AIT-77 tuvo que corregir con `phone` (`16cb2b5`, "cumplir el
contrato canonico de phone"). El H11(b) de la ronda 3 queda cerrado a medias.

### H9 [Realismo] §18 §8 §15 §26 — el freno de coste llega tarde

§18 fija el umbral ("25% del limite de almacenamiento del plan de Convex vigente") y su
momento: "**Durante la fase 1**: medir el tamaño real ... para saber cuanto cuesta el
historico completo **antes de conectar al segundo vendedor**". Pero el historico completo y
sin tope se descarga en la **fase 2** (§8), para el primer buzon, sin ninguna puerta delante.
Y el piloto tiene 1-2 buzones (§13.1), asi que "antes del segundo vendedor" es casi "nunca".
Poner la puerta antes del backfill completo del primer buzon (medir sobre una ventana corta
y extrapolar, que es lo que §18 ya describe) y dejar escrito el limite del plan vigente sobre
el que se calcula el 25% — hoy §26 lo declara NO VERIFICADO, asi que el umbral no es
computable como esta.

### H10 [Completitud] §15 §6 — el historico sin tope no tiene estrategia de lectura

§4 y §15 quitan el tope ("un vendedor veterano puede arrastrar años de correo"), §6 exige que
la ficha muestre los emails "en orden cronologico **junto a** las interacciones manuales", y
el unico NFR dice "la ficha de un cliente con **200 emails** carga en < 1 s". No hay decision
de paginacion, ventana por defecto ni "cargar mas" en ningun sitio del documento (ni en §8,
ni en las maquetas citadas). Es el hueco directo de la decision del 2026-09-08: añadir la
ventana de lectura por defecto y su criterio, o declarar explicitamente que se carga todo y
que el NFR se mide en el peor caso real medido en la fase 1.

### H11 [Claridad] §5 §6 §19 — la "H" significa tres cosas

§5 define H1-H8. §6 usa "(H2)", "(H8)" para referirse a esas historias, pero tambien titula
"Desconectar la cuenta conserva el historial (**H9**)", "Borrado de un cliente (**H10**)",
"Alcance del historico (**H11**)", "Intencion de escritura ... (**H13**)" y "Emparejamiento de
direcciones (**H12**)" — cinco identificadores que no existen en §5, y ademas fuera de orden.
En el cuerpo de esos mismos criterios aparece "hallazgo **H8** de la ronda 3" y "hallazgo
**H12** de la ronda 2", que son otras dos cosas distintas con los mismos nombres. Un lector
sin las reviews delante no puede resolverlo. Renombrar los criterios sin historia (CR-1,
CR-2...) o crear las historias que faltan, y marcar los hallazgos de review como "R3-H8".
Menor, del mismo tipo: §19 lista CU6 entre CU4 y CU5.

### H12 [Claridad] wayfinder — el registro de decisiones va por detras del PRD

`wayfinder/INDICE.md` declara "**Estado: cero decisiones abiertas** (2026-09-08)" y lista seis
fichas. Faltan las dos decisiones mas nuevas y menos rodadas, ambas del 2026-09-08 y ambas
citadas en el PRD como decisiones de Aitor:

- el **piloto interno** / quien puede conectar (§4 y §9, "premisa madre nº2");
- **un vendedor ve siempre los emails de su propio buzon** (§24), que es la que H1 pone en
  duda.

Sin ficha no hay frontera, ni alternativas descartadas, ni precio aceptado — que es
justamente lo que hace falta para resolver H1 sin volver a preguntar desde cero.

---

## Hallazgos de rondas anteriores que siguen vivos (comprobado despues de puntuar)

- **Ronda 3, H11(b)** (el indice nuevo exige campo persistido + backfill + mantenimiento en
  los escritores) — **medio cerrado**: §21 nombra el indice y la migracion, pero no dice
  sobre que campo ni con que forma canonica, y sigue hablando de un unico escritor. Ver H8.
- **Ronda 3, H10** (correo cruzado entre vendedores) — **cerrado en §24, abierto en §21**: la
  decision existe, pero el modelo de entidades no la soporta. Ver H1.
- **Ronda 3, H2** (no hay via de editar un cliente) — **cerrado por el codigo, no por el PRD**:
  AIT-77 lo construyo hoy; el PRD sigue afirmando lo contrario en §21. Ver H4.
- El resto de hallazgos de las rondas 2 y 3 que revise (roles, `requireOwner`, `Math.max`,
  guarda de `interactions.remove`, `crons.ts`/`http.ts`, bloqueo de borrado de AIT-65,
  `docs/03-setup.md` §6bis, Web Push alimentado por `lib/risk.ts` via
  `convex/pushInternal.ts`) estan **correctamente cerrados**: verifique cada cita contra el
  codigo y todas sostienen lo que el PRD dice de ellas.

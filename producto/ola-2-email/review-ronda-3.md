REVIEW SuperCRM Ola 2 — ronda 3 — 2026-09-08
Claridad:       7/10 — §27 (glosario), §23 y §28 se leen del tiron y el documento define su jerga; pierde puntos porque el bloque de cambios "0.2 → 0.3" de la cabecera sigue anunciando una "excepcion declarada a AIT-65" que §23 revoca 700 lineas despues, porque §14.9 dice que `lastActivityAt` "pasa a la fecha del email" cuando §6 y §21 exigen el maximo, y porque §19 numera CU1-CU2-CU3-CU4-CU6-CU5 con una precondicion ("cuenta conectada") que §6-H4 no pide.
Completitud:    7/10 — las 27 secciones + §28 tienen contenido real y las decisiones de v0.3/v0.4 ya traen criterio y caso de uso; pero §23 promete un dialogo que "ofrece añadir" el email del cliente y §18 planea "conseguir que los contactos tengan email" cuando en el repositorio NO existe ninguna via de editar un cliente (`convex/customers.ts` solo expone `getFicha`, `list` y `remove`; el unico `insert("customers")` vive en `convex/opportunities.ts::createQuick`), y §28 no lo lista entre "lo que NO existe hoy".
Verificabilidad:7/10 — hay criterios excelentes y binarios (§6 filtro "cero", §6 permisos invocando la funcion en servidor, §6-H8 con el maximo y el "ninguna cambio" del historico, §6-H6 "<60 s"); pero la pieza nueva de la v0.4, las reglas de emparejamiento de `emailIntents` de §21 (ventana de 30 min, dos clics, dos emails, caducidad), no tiene ni un solo PASA/FALLA en §6, y §6-H11 no se puede evaluar para un vendedor sin ninguna oportunidad accesible, caso que §4 no define.
Realismo:       6/10 — §10 fechado con enlaces oficiales, §9 con premisas + plan y etiquetas "NO VERIFICADO" honestas, §26 sin maquillar el coste; pero la premisa que decide si la ola sirve de algo —que los buzones de Marta y Carlos sean cuentas del Workspace de `talent-network.org`, unica forma de consentir en una app Interna— solo aparece enterrada como precondicion de §19-CU1, sin plan de verificacion ni riesgo asociado, mientras §13.1 da por hecho que todos los vendedores conectan; ademas §19-CU5 asume que siempre se "reanuda desde la ultima marca" cuando el `historyId` de Gmail caduca y obliga a resincronizacion completa, y §18 mide el coste del historico sin umbral ni regla de decision ("si el numero asusta").
Cohesion:       6/10 — la traza H1-H12 → §6 → §19 → §8 es limpia, pero quedan contradicciones vivas: §17 mantiene dos filas opuestas sobre el bloqueo de borrado (una dice "apartarse a proposito de un patron ya construido", la otra "conserva intacta la decision de AIT-65"), §28 sigue diciendo que hay que tocar `convex/customers.ts` para "permitir el borrado" que §23 ya no levanta, el wayfinder conserva `borrado-de-cliente-con-emails.md` sin marca de superseded contradiciendo a `alcance-del-bloqueo-de-borrado.md`, y §13.2 fija su plazo "a los 14 dias de publicarse la fase 4" cuando el instrumento que mide (`emailIntents` **consumidas**) solo existe con la fase 5 de §8.
Media: 6.6 -> DEVUELVE

**A que fase hay que volver.** Tercera ronda con la misma media: el problema ya no es de
redaccion. La vuelta principal es a la **fase 3 (premisas y landscape)**: la cadena de
premisas tiene un eslabon que nunca se escribio —quien puede consentir en una app
Interna— y dos que se dan por resueltas sin serlo (el `historyId` caducado y el coste
del historico sin tope, medido sin umbral). Sin cerrar eso, cualquier reescritura del
documento repite el mismo resultado. En segundo lugar, una pasada por la **fase 5
(alcance)** para meter dentro de la ola —o dejar fuera con su alternativa— la edicion
del email de un cliente, que hoy no existe en el codigo y de la que dependen §23 y §18.

Hallazgos (si devuelve):
  H1 [Realismo] §9 §19-CU1 §13.1 §16 — Elevar a premisa con plan de verificacion "los buzones de los vendedores son cuentas del Workspace de `talent-network.org`". Hoy solo vive como precondicion de CU1 y como flujo alternativo ("dominio ajeno → Google deniega"). Si es falsa para el Carlos real, H1, H6, H8 y la metrica §13.1 son inalcanzables y la ola no entrega nada, igual que si cayera la premisa madre. Añadir la verificacion (comprobar hoy a que dominio pertenecen las cuentas de correo que usan Marta y Carlos) y la consecuencia si falla (alternativa A).
  H2 [Completitud] §23 §18 §28 §9 — No existe ninguna via de editar un cliente: `convex/customers.ts` expone solo `getFicha`, `list` y `remove`, no hay mutation de actualizacion y el unico `insert("customers")` esta dentro de `convex/opportunities.ts::createQuick` (alta rapida). El dialogo de §23 que "ofrece añadirlo" y el plan de §18 ("conseguir que los contactos tengan email") requieren una capacidad nueva que no esta en §4 "Entra", ni en las fases de §8, ni en el "lo que NO existe hoy" de §28. Meterla en alcance o declararla no-go con su alternativa.
  H3 [Verificabilidad] §21 §6 (un solo registro) §6 (ficha) — La deduplicacion por `Message-ID` deja indefinidos `direction` y `userId` cuando el mismo mensaje llega a dos buzones conectados: para el buzon de Carlos es `saliente` y para el de Marta `entrante`, y gana el que sincronice primero. `direction` es justo lo que decide si el email mueve `lastActivityAt` (§21, regla de H8) y lo que la ficha muestra como "enviado o recibido" (§6). Fijar la regla determinista (p.ej. `saliente` si el remitente normalizado es de un usuario de la tienda, con independencia del buzon que lo trajo) y añadir su criterio.
  H4 [Cohesion] §17 §28 + wayfinder — Purgar los restos de la decision revocada del borrado: §17 conserva la fila "**Permitir borrar** un cliente con emails" cuyo porque ("apartarse a proposito de un patron ya construido", "obliga a tocar codigo publicado") contradice la fila siguiente ("el bloqueo por oportunidades se mantiene... conserva intacta la decision de AIT-65"); el bloque de cabecera "0.2 → 0.3" sigue anunciando la "excepcion declarada a AIT-65"; §28 dice que `convex/customers.ts` es "el fichero que hay que tocar... para permitir el borrado" cuando lo que hay que añadirle es la cascada de emails, no un permiso; y `wayfinder/borrado-de-cliente-con-emails.md` sigue marcado "resuelta" con el texto viejo, sin apuntar a `alcance-del-bloqueo-de-borrado.md`.
  H5 [Verificabilidad] §6 §21 §19-CU4 — Las reglas de emparejamiento email↔intencion no tienen criterio. Añadir PASA/FALLA observables para: ventana de 30 min (un email a los 31 min NO consume la intencion), dos clics seguidos (consume el mas reciente, el otro queda `caducada`), dos emails salientes dentro de la ventana (el segundo se trata sin contexto), y caducidad (una intencion sin consumir pasa a `caducada` y no atribuye actividad). Decir ademas quien ejecuta la caducidad y con que retardo: el unico cron del proyecto es horario (`convex/crons.ts`, AIT-57), asi que "caduca a los 30 minutos" solo es cierto si se evalua al leer, no por barrido.
  H6 [Cohesion] §13.2 §8 — La metrica 2 se cuenta "a los 14 dias de publicarse la fase 4" pero se mide "contando las `emailIntents` **consumidas**", y el consumo (el emparejamiento con el email saliente) llega en la fase 5 segun §8 —la fase 4 solo abre Gmail y registra el contexto—. O el emparejamiento entra en la fase 4, o el plazo de la metrica arranca con la fase 5.
  H7 [Realismo] §19-CU5 §21 §25 §15 — El `historyId` de Gmail caduca (respuesta 404) y obliga a una sincronizacion completa, no a reanudar. CU5 promete "se reanuda desde la ultima marca, sin duplicar" y §25 solo contempla idempotencia; con el historico sin tope de §15, una resincronizacion forzada vuelve a recorrer años de correo. Añadir el caso a CU5, decir que la deduplicacion por `Message-ID` es lo que lo hace seguro, y contarlo en el coste de §26.
  H8 [Verificabilidad] §6-H11 §4 §14.3 — El origen del historico ("la oportunidad mas antigua a la que el vendedor tiene acceso") no esta definido para un vendedor con cero oportunidades accesibles (alta nueva, o `sales` sin cartera): el criterio H11 no se puede marcar PASA ni FALLA. Definir el caso (no sincronizar nada, una fecha por defecto, o la de la tienda) y decir tambien que pasa cuando a un vendedor se le reasigna despues una oportunidad mas antigua que la ventana ya sincronizada.
  H9 [Realismo] §18 §26 §15 §9 — La medicion del coste de Convex de la fase 1 no tiene umbral ni regla de decision: "si el numero asusta, se reabre con Aitor". Con el tope eliminado es la unica red que queda. Fijar el numero (GB o emails por vendedor) a partir del cual la ola se para y se reabre la decision, y quien lo mira.
  H10 [Completitud] §24 §21 — Falta el caso del correo cruzado entre vendedores: un email del buzon de Carlos con un cliente cuyo `ownerId` es otro comercial pasa el filtro de §6 y se guarda, pero por el modelo de §24 (un `sales` ve los de SUS clientes) Carlos deja de ver su propia correspondencia y el otro comercial la ve entera. Decir cual de las dos cosas se quiere, porque §24 es el invariante de seguridad de la ola.
  H11 [Claridad] §21 §28 — Precisar dos descripciones del codigo que hoy inducen a error: (a) `interactions.remove` NO recalcula siempre, solo cuando `interaction.occurredAt === opportunity.lastActivityAt` (y ademas capa `lastRiskPushSentAt`) — quien implemente "que el recalculo pase a incluir los emails" tiene que saberlo para no tocar la guarda; (b) el "indice nuevo por `storeId` + direccion normalizada" de §21 no es solo un indice: Convex indexa campos persistidos, asi que exige un campo normalizado nuevo en `customers`, su backfill y su mantenimiento en `opportunities.createQuick`, que es el unico sitio donde se crean clientes.
  H12 [Completitud] §21 §25 — Los emails que mueven `lastActivityAt` cambian tambien a quien avisa el Web Push de "en riesgo" (`convex/pushInternal.ts::listAtRiskOpportunities` compara `lastRiskPushSentAt` con `lastActivityAt`). §21 solo menciona Hoy, Pipeline y Panel. Decirlo, aunque sea para confirmar que el efecto es el deseado.

---

## Detalle

### H1 — La premisa de quien puede consentir no esta escrita como premisa (§9, §19-CU1, §13.1, §16)

**Que dice el documento.** §7 y §24 eligen declarar la app **Interna** del Workspace de
`talent-network.org` como via para evitar CASA. §9 lo llama "premisa madre" y lo que
verifica es *"declarar la app como Interna [...] pedir `gmail.readonly` con una cuenta
del dominio y comprobar que Google concede el consentimiento sin exigir revision"*.
§19-CU1 pone como precondicion *"la cuenta pertenece al Workspace de la organizacion"* y
como flujo alternativo *"Dominio ajeno al Workspace → Google deniega"*. El precio
declarado en §9 y §12 es siempre el mismo: *"la app deja de ser vendible a terceros"*.

**Por que falla.** El precio real es mayor y no esta escrito. Una app Interna solo admite
consentimiento de cuentas de esa organizacion, asi que la restriccion no es solo comercial
(a quien se le puede vender) sino operativa (**que buzones se pueden conectar**). El
documento describe a Carlos en §2 como vendedor de un pequeño negocio que *"escribe a sus
clientes desde Gmail"*; en ningun punto se afirma que ese buzon sea una cuenta
`@talent-network.org`. `docs/03-setup.md` §6bis, ademas, solo documenta dos cuentas
Google con acceso real hoy (`admin@` y `aitor.marin@` de ese dominio). Si el buzon del
vendedor real esta fuera del Workspace, la verificacion de §9 puede salir verde (con una
cuenta del dominio, como dice literalmente) y aun asi H1, H6, H8 y la metrica §13.1
("todos los vendedores activos tienen su Gmail conectado") son inalcanzables: la ola
entera se construye y no la puede usar su persona.

**Que hacer.** Subir a §9 una premisa propia —"los buzones que hay que conectar
pertenecen al Workspace de la organizacion"— con su verificacion (comprobar hoy el dominio
de las cuentas de correo que usan Marta y Carlos) y su consecuencia si cae (misma salida
que la premisa madre: alternativa A, buzon de reenvio, que no tiene esta restriccion).
Es barata de comprobar y decide si la ola sirve.

### H2 — El CRM no sabe editar un cliente (§23, §18, §28, §9)

**Que dice el documento.** §23, caso "cliente sin email": *"el boton de escribir no se
deshabilita — abre un dialogo informativo explicando que ese cliente no tiene email
registrado y **ofreciendo añadirlo**"*. §18: *"Antes de la fase 2: contar cuantos
`customers` tienen `email` relleno. Si son pocos, la fase siguiente no es sincronizar
mas: es **conseguir que los contactos tengan email**"*. §9 lo repite como premisa.

**Por que falla.** En el repositorio no hay forma de añadir ese email a un cliente que
ya existe. `convex/customers.ts` exporta exactamente tres funciones: `getFicha` (query),
`list` (query) y `remove` (mutation). No hay mutation de actualizacion, y el unico
`insert("customers")` del proyecto esta en `convex/opportunities.ts::createQuick`, es
decir: el email de un cliente solo se puede fijar en el momento del alta rapida y nunca
despues (la UI lo confirma: `app/clientes/[id]/page.tsx` solo usa `customers.getFicha` y
`customers.remove`). El "lo que NO existe hoy" de §28 enumera tablas de email, Gmail,
tokens, Pub/Sub, cron y pantalla — y omite justo esta.

**Por que importa.** No es un detalle de UI: es el unico remedio que el propio PRD se da
si la premisa "los contactos tienen email" sale mal, y es la salida del caso de esquina
mas frecuente de §23. Tal como esta, el plan B de §18 no se puede ejecutar.

**Que hacer.** Decidirlo en alcance (fase 5): o entra en la ola una edicion minima del
cliente (con su criterio en §6 y su fila en §8), o §23 cambia el dialogo por uno que solo
informa y §18 sustituye "conseguir que los contactos tengan email" por algo ejecutable
con lo que hay. En cualquier caso, §28 tiene que decir que hoy no existe.

### H3 — La deduplicacion por `Message-ID` deja `direction` al azar (§21, §6)

**Que dice el documento.** §21: la clave de unicidad es el `Message-ID` de la cabecera
RFC, *"que si es el mismo en ambos buzones"*, y la entidad `emails` guarda `userId`
("de que buzon vino") y `direction` (entrante/saliente). §6, criterio "un solo registro
por email": *"Si el mismo correo llega a dos buzones conectados (Carlos lo envia y Marta
va en copia), el historial del cliente lo sigue mostrando una sola vez"*.

**Por que falla.** El documento resuelve el **recuento** y deja abierto el **contenido**
de la fila superviviente. `direction` no es una propiedad del mensaje sino del buzon: el
mismo `Message-ID` es `saliente` en el buzon de Carlos (Enviados) y `entrante` en el de
Marta (Recibidos). Si se guarda una sola fila, la que gane depende de que sincronizacion
llegue antes — una carrera. Y `direction` es exactamente el campo del que cuelgan dos
cosas del documento: la regla de §21 ("un email **SALIENTE** posterior a la conexion
actualiza `lastActivityAt`... un email **ENTRANTE** no actualiza nada") y el criterio de
ficha de §6 ("cada uno muestra... **si fue enviado o recibido**"). Es decir: que Marta
tenga o no el Gmail conectado puede cambiar si la oportunidad de Carlos sale de la lista
de "en riesgo". Lo mismo con `userId`, del que depende el emparejamiento con
`emailIntents` ("la intencion pendiente mas reciente **del mismo usuario**"): si la fila
se queda con el buzon de Marta, la intencion de Carlos no la consume nadie.

**Que hacer.** Escribir la regla determinista en §21 —lo natural es derivar `direction`
del remitente normalizado (saliente si el `From` es de un usuario de la tienda, entrante
si no), independiente del buzon que trajo el mensaje, y guardar el buzon de origen sin que
decida nada— y añadir a §6 el criterio: el mismo correo con dos buzones conectados se
muestra una sola vez **y como saliente**, y consume la intencion de quien lo escribio.

### H4 — Restos vivos de la decision de borrado que se revoco (§17, §28, wayfinder)

**Que dice el documento.** §23 (v0.4) es inequivoca: *"Lo que si sigue bloqueando,
intacto, es el patron de AIT-65"*. Pero:

- El bloque de cabecera "Cambios de 0.2 → 0.3" sigue diciendo: *"(b) Un cliente con
  emails **se puede borrar**, con dialogo que dice cuantos se lleva (§23, excepcion
  declarada a AIT-65)"*. En v0.4 no hay excepcion a AIT-65.
- §17 conserva la fila *"**Permitir borrar** un cliente con emails"* justificada con
  *"Mantener el bloqueo de AIT-65 haria imborrable en la practica a un cliente con
  cientos de emails. Cuesta apartarse a proposito de un patron ya construido"*, y cuatro
  filas mas abajo la fila *"El bloqueo de borrado por oportunidades se mantiene"*
  justificada con *"Conserva intacta la decision deliberada de AIT-65"*. Las dos con la
  misma fecha y el mismo decisor. La tabla de decisiones es el registro autoritativo del
  PRD: no puede contener las dos.
- §28 cierra la entrada de `convex/customers.ts` con *"Es el fichero que hay que tocar
  para la excepcion declarada en la seccion 23: **permitir el borrado** tras confirmar
  cuantos emails se van con el cliente"*. Lo que hay que añadirle es la **cascada** de
  emails; permiso no hay que dar ninguno, porque los emails nunca han bloqueado nada
  (la tabla no existe).
- `wayfinder/borrado-de-cliente-con-emails.md` sigue "resuelta" con el texto original
  (*"es una excepcion declarada al patron de AIT-65... Se aparta a proposito"*) y el
  `INDICE.md` lo lista al mismo nivel que `alcance-del-bloqueo-de-borrado.md`, que dice
  lo contrario. Quien lea el wayfinder en el orden del indice se lleva la decision
  equivocada.

**Que hacer.** Reescribir el bullet (b) de la cabecera, fundir las dos filas de §17 en
una sola ("los emails no bloquean; se borran en cascada; el bloqueo por oportunidades de
AIT-65 se mantiene"), corregir la frase de §28, y marcar la tarjeta vieja del wayfinder
como superseded apuntando a la nueva.

### H5 — `emailIntents` es la pieza nueva y no tiene criterios (§6, §21, §19-CU4)

**Que dice el documento.** §21 define cuatro reglas de emparejamiento (ventana de 30
minutos, dos clics seguidos, dos emails seguidos, caducidad a los 30 minutos) y las
declara imprescindibles: *"sin esta regla, ni la regla 1 de abajo, ni el criterio H8, ni
la metrica §13.2 son verificables"*.

**Por que falla.** Habiendolo dicho, §6 no las verifica. Sus tres PASA de H8 hablan de
"nacido de un clic que traia una oportunidad en contexto", que es el resultado del
emparejamiento, no el emparejamiento. Ninguna de las cuatro reglas tiene un PASA/FALLA:
se puede construir una implementacion con ventana de 5 minutos, o que consuma la
intencion **mas antigua**, o que no caduque nunca, y pasar §6 entera. Es la parte menos
rodada del documento y la unica sin red.

Ademas, "caduca a los 30 minutos" no dice quien la caduca. El unico mecanismo programado
del proyecto es un cron **horario** (`convex/crons.ts`, AIT-57, `{ hours: 1 }`), asi que
un barrido llegaria hasta 60 minutos tarde; si la caducidad se evalua al leer (fecha del
clic + 30 min), la frase es exacta pero hay que decirlo, porque la postcondicion de CU4
("no queda ninguna intencion pendiente indefinidamente") se comprueba de forma distinta
en cada caso.

**Que hacer.** Cuatro criterios en §6, uno por regla, con numeros; y una frase en §21
diciendo si la caducidad es un estado calculado al leer o un barrido programado.

### H6 — La metrica 2 se mide antes de tener el instrumento (§13.2, §8)

**Que dice el documento.** §13.2: *"a los 14 dias **de publicarse la fase 4** (la que
introduce el boton de salir a Gmail) [...] Se mide contando las `emailIntents`
**consumidas** frente al total de emails salientes"*. §8, fase 4: *"Salir a Gmail: abrir
Gmail con destinatario cargado y en el hilo"*. §8, fase 5: *"el enganche de
`lastActivityAt` de H8 con su atribucion por contexto del clic (**el contexto ya se
registra en la fase 4**)"*.

**Por que falla.** La fase 4 registra intenciones; quien las **consume** es el
emparejamiento con el email saliente, que §8 coloca en la fase 5. Durante los 14 dias
posteriores a la fase 4 el contador de "consumidas" vale cero por construccion, y la
metrica —que es la que refuta la señal de muerte de §11.5— daria un falso negativo
rotundo.

**Que hacer.** Elegir: o el emparejamiento entra en la fase 4 (y §8 lo dice), o el plazo
de §13.2 arranca con la publicacion de la fase 5.

### H7 — El `historyId` caducado no esta contemplado (§19-CU5, §21, §25, §15)

**Que dice el documento.** §27 define la marca incremental como *"referencia que Gmail da
para pedir solo lo que ha cambiado desde la ultima vez. Es lo que evita releer el buzon
entero"*. CU5: *"se reanuda desde la ultima marca, sin duplicar lo ya sincronizado"*, con
postcondicion *"conexion restablecida y sin duplicados"*. §23 dibuja `revocada | error
──reconexion──> conectada (reanuda sin duplicar)`.

**Por que falla.** La marca incremental de Gmail caduca: pasado cierto tiempo `history.list`
responde 404 y la unica salida documentada es una **sincronizacion completa**. Es
exactamente el escenario de CU5 (una cuenta revocada o caida durante dias) y el documento
lo describe como si siempre se pudiera reanudar. Con el historico sin tope de §15, ese
camino no es un detalle: vuelve a recorrer todo el correo del vendedor, con el coste de
Convex y de cuota que eso implica, y apoyandose enteramente en la deduplicacion para no
duplicar nada.

**Que hacer.** Añadir el caso al flujo alternativo de CU5 y al diagrama de §23 ("marca
incremental caducada → sincronizacion completa"), decir que la deduplicacion por
`Message-ID` es lo que la hace segura, y mencionarlo en §26 como coste recurrente
posible, no unico.

### H8 — El origen del historico no esta definido para todos los vendedores (§6-H11, §4)

**Que dice el documento.** §4 y §15: el historico se baja *"desde la fecha de la
oportunidad mas antigua a la que el vendedor tiene acceso, sin tope"*. §6-H11 lo convierte
en criterio: *"el email mas antiguo almacenado no es anterior a la fecha de creacion de la
oportunidad mas antigua a la que ese vendedor tiene acceso"*.

**Por que falla.** Si el vendedor no tiene ninguna oportunidad accesible —un `sales` recien
dado de alta, que es justo cuando se le pide conectar Gmail— no hay fecha, y el criterio no
se puede marcar ni PASA ni FALLA. El caso no es teorico: la metrica §13.1 pide que
**todos** los vendedores conecten a los 14 dias de la fase 1, incluidos los que aun no
tienen cartera. Tampoco se dice que ocurre cuando a un vendedor se le reasigna despues una
oportunidad mas antigua que la ventana ya sincronizada (¿se rebaja el historico o se queda
como estaba?).

**Que hacer.** Definir el valor por defecto en §4 y reflejarlo en H11, y añadir una frase
sobre reasignaciones posteriores.

### H9 — Una medicion sin umbral no es un plan de validacion (§18, §26, §15, §9)

**Que dice el documento.** §9 marca la premisa del volumen como **NO VERIFICADA** y
reconoce que *"desde 2026-09-08 sin red de seguridad: al quitarse el tope del historico ya
no hay limite que bajar si la medicion sale cara"*. §18: *"Si el numero asusta, se reabre
con Aitor la decision del tope"*. §26: *"la fase 1 lo mide para saberlo, no para
limitarlo"*.

**Por que falla.** La honestidad esta, pero el plan no. "Si el numero asusta" no es un
criterio: no dice que numero, ni quien lo mira, ni que pasa con la fase 2 mientras tanto.
Es la unica proteccion que queda tras eliminar el tope, y esta redactada de forma que
nunca se puede dar por incumplida. Lo mismo con el coste de Pub/Sub (§26, "NO VERIFICADO",
"se comprueba antes de la fase 3") pero ahi al menos hay un momento fijado.

**Que hacer.** Fijar el umbral en §18 con un numero (GB almacenados o emails por vendedor,
contra el limite del plan de Convex vigente) y la accion asociada: parar la fase 2 y
reabrir la decision del tope con Aitor. Es lo que convierte una medicion en una
validacion.

### H10 — Correo cruzado entre vendedores (§24, §21)

**Que dice el documento.** §24: *"un `sales` ve los emails de **sus** clientes (los de su
`ownerId`), dentro de su tienda"*. §6, filtro: se guarda todo email cuya direccion
coincida con un cliente *"cuyo `storeId` es el mismo que el del usuario dueño del buzon"*
— por tienda, no por propietario del cliente.

**Por que falla.** Los dos criterios no encajan en el caso obvio: Carlos escribe a un
cliente que pertenece a otro comercial de la misma tienda (una consulta, una sustitucion
por vacaciones). El email pasa el filtro y se guarda; pero por el modelo de §24 Carlos
**deja de ver su propia correspondencia** en el CRM, y el otro comercial la ve entera,
cuerpo incluido. Puede ser lo deseado —el email es del cliente, no del vendedor, que es el
argumento de §24 al desconectar— pero §24 es la seccion que el propio documento declara
invariante de seguridad, y este caso no aparece ni en el criterio de permisos de §6 ni en
CU3.

**Que hacer.** Una frase en §24 que resuelva el caso explicitamente (lo coherente con el
resto del documento es "el email se ve segun el cliente, no segun el buzon", diciendo en
voz alta que eso implica que un vendedor puede no ver un correo que el escribio) y su
correspondiente PASA en §6.

### H11 — Dos descripciones del codigo que inducen a error (§21, §28)

**(a) `interactions.remove`.** §21 dice: *"`interactions.remove` recalcula hoy
`lastActivityAt` como el maximo entre creacion, cierre e interacciones restantes —
ignorando los emails"*, y §28 lo repite. El codigo real solo entra en ese recalculo bajo
una guarda:

> if (interaction.occurredAt === opportunity.lastActivityAt) { ... }

y ademas capa `lastRiskPushSentAt` con el valor nuevo. La guarda sigue siendo correcta
con emails de por medio, asi que el cambio pedido ("que el recalculo pase a incluirlos")
es una linea dentro del `Math.max`, no una reescritura — pero tal como esta redactado,
quien implemente puede tocar la condicion y reintroducir el bug de `lastRiskPushSentAt`
que el proyecto ya arreglo dos veces (AIT-57 ronda 1, AIT-65 ronda 1). Escribir la guarda
tal cual es.

**(b) El "indice nuevo" sobre `customers`.** §21 pide *"Indice nuevo por `storeId` +
direccion normalizada"*. Convex indexa campos persistidos: eso no es un indice, es un
campo nuevo en la tabla `customers` (la direccion ya normalizada), su backfill sobre los
clientes existentes, y su mantenimiento en el unico sitio donde se crean clientes hoy
(`convex/opportunities.ts::createQuick`) — mas en la edicion del cliente si H2 la mete en
alcance. Decirlo, porque cambia una tabla ya publicada y toca una mutation que no aparece
en §28.

### H12 — Los emails tambien cambian los avisos push de riesgo (§21, §25)

§21 explica bien por que el historico no debe mover `lastActivityAt` (*"`lib/risk.ts`
calcula el riesgo al vuelo desde esa marca"*, con efecto en Hoy, Pipeline y Panel). Falta
la cuarta consecuencia: `convex/pushInternal.ts::listAtRiskOpportunities` selecciona a
quien avisar por Web Push comparando `lastRiskPushSentAt` con `lastActivityAt`, asi que
todo email saliente que mueva la marca vuelve a hacer elegible un aviso push de riesgo
para esa oportunidad. Es previsiblemente lo deseado, pero afecta a una funcionalidad
publicada (AIT-57) que nadie ha pedido tocar en esta ola: basta una linea en §21 y una
mencion en el "que monitorizar" de §25.

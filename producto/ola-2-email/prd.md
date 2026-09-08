<!-- prd: estado=DRAFT version=0.8 supersedes=- appetite=completo -->

# PRD — SuperCRM Ola 2: Email de clientes dentro del CRM

| Campo | Valor |
|---|---|
| Estado | DRAFT |
| Version | 0.8 |
| Supersedes | — (sigue en DRAFT; 0.1 a 0.4 corregidas, no superseded) |
| Fase actual | **6 — documento** (premisas cerradas en la 0.5, alcance en la 0.6; listo para una ronda nueva de review) |
| Appetite | completo |
| Espejo en Notion | [CRM — Ola 2 · Email en el CRM (Gmail)](https://app.notion.com/p/3d52e4a27d388105998fd037a7d162a5) |

> **Donde se revisa (decision de Aitor, 2026-09-07).** Aitor lee y **comenta** en la
> pagina de Notion; el PM aplica los comentarios y mantiene los dos sitios iguales.
> Este fichero es la copia verificable (`verificar-prd.sh`, `auditar-gaps.sh`). Nadie
> escribe en el cuerpo de Notion salvo el PM: si eso cambia, se invierte la direccion
> y se anota aqui.

> **Cambios de 0.1 → 0.2.** (a) Corregidos los 16 hallazgos de la review adversarial
> de la ronda 1 (media 6.4, DEVUELVE), incluidos tres errores de hecho sobre el propio
> codigo. (b) **Ya no se construye editor de correo**: escribir y responder abren
> Gmail con el contexto ya cargado (decision de Aitor, 2026-09-07). (c) **Aviso en
> tiempo real** con notificaciones push de Gmail en vez de esperar a la
> sincronizacion (peticion de Aitor). El as-is esta en la seccion 28; conviene leerlo
> antes que el resto.

> **Cambios de 0.2 → 0.3 (2026-09-08).** Se cierran las **cuatro decisiones abiertas**
> con las respuestas de Aitor comentadas en Notion. El wayfinder queda a cero. (a) Al
> desconectar Gmail **los emails se conservan** (§24). (b) Un cliente con emails **se
> puede borrar** si no tiene oportunidades, con dialogo que dice cuantos emails se lleva
> (§23; **ojo**: la "excepcion declarada a AIT-65" que decia esta linea en la v0.3 quedo
> **revocada** en la v0.4 — el bloqueo por oportunidades se mantiene intacto). (c) La actividad se atribuye por **contexto del clic**, con desempate por
> oportunidad unica (§21). (d) El historico se baja **desde la oportunidad mas antigua
> del vendedor, sin tope** (§15) — lo que deja el coste de Convex abierto a proposito
> (§9 y §26).

> **Cambios de 0.3 → 0.4 (2026-09-08).** Corrige los **13 hallazgos de la review
> adversarial de la ronda 2** (media 6.4, DEVUELVE), incluidos **tres errores de hecho
> nuevos sobre el codigo** que la ronda 1 no habia visto: el rol `storeManager` ausente
> del modelo de permisos, `requireOwner` citado como patron de lectura, y la premisa del
> borrado que `convex/customers.ts` desmiente. Ademas, dos consecuencias de la v0.3 que
> el propio Aitor decidio al verlas: **la sincronizacion historica no toca
> `lastActivityAt`** (§21) y **el bloqueo de borrado por oportunidades se mantiene**
> (§23). Y una pieza que faltaba: la entidad `emailIntents`, sin la cual la regla del
> "contexto del clic" no era construible (§21).

> **Cambios de 0.4 → 0.5 (2026-09-08).** El documento **retrocedio a la fase de premisas**
> tras agotar las tres rondas del procedimiento (6.4 → 6.4 → 6.6). Se cerro la premisa que
> nunca se habia escrito como tal: **quien puede consentir**. Esta ola es un **piloto
> interno** — solo cuentas del Workspace de `talent-network.org` (§4, §9).

> **Cambios de 0.5 → 0.6 (2026-09-08).** Cerrados los hallazgos restantes de la ronda 3.
> Un vendedor **ve siempre los emails de su propio buzon** (§24); `direction` y `userId`
> dejan de depender de que buzon sincronice antes (§21); criterios verificables para
> `emailIntents` (§6); y el `historyId` de Gmail caduca y obliga a resincronizar entero
> (§19-CU5), que es el segundo precio del historico sin tope.

> **Cambios de 0.6 → 0.7 (2026-09-08).** Doce hallazgos del ciclo 2. Los dos que eran
> decision: **`mailboxUserIds`** (§21), porque "ve siempre su propio buzon" no cabia en
> una entidad con un solo propietario; y **quienes participan en el piloto, con nombre**
> (§13), porque las cuentas de prueba de otro dominio no pueden consentir y las metricas
> escritas sobre ellas eran inalcanzables por construccion.

> **Cambios de 0.7 → 0.8 (2026-09-08).** Catorce hallazgos de la ronda 2 del ciclo 2. Lo
> que hay que saber: **(a)** la deduplicacion por `Message-ID` **no estaba acotada por
> tienda** — un agujero de privacidad entre tiendas que introdujo la propia v0.7 (§21);
> **(b)** normalizar el email **recortando la etiqueta tras `+` corrompia la direccion
> real** y la dejaba inservible para escribir (§21); **(c)** `mailboxUserIds` se guardaba
> sin que existiera pantalla donde ese acceso sirviera (§24). Y una leccion de metodo: de
> los hallazgos anteriores, **cinco se habian arreglado solo en la seccion citada, sin
> propagar** — se corrigen aqui, y por eso esta version toca mas secciones de las que los
> hallazgos nombran.

## 1. Resumen y pitch

Los vendedores de SuperCRM escriben a sus clientes por email desde Gmail, en otra
ventana, y el CRM no se entera: el historial del cliente queda incompleto o se
rellena a mano. Esta ola mete el email dentro del CRM — los correos con clientes
conocidos se sincronizan y se leen en la ficha del cliente y en sus oportunidades.

Para escribir y responder **no se construye un cliente de correo**: el CRM abre Gmail
con el destinatario o el hilo ya cargados, y se entera en segundos de lo que se ha
enviado gracias a las notificaciones push de Gmail. Asi el vendedor conserva todas las
funciones que ya conoce (adjuntos, copia, formato, firma) sin que el CRM tenga que
reimplementarlas peor.

El objetivo de negocio no cambia (que ninguna venta se pierda por falta de
seguimiento): un seguimiento cuya conversacion real vive fuera del CRM es un
seguimiento a medias. Ademas, esta ola es el cimiento de la ola siguiente, en la que
una IA leera esos emails para analizar la relacion con cada cliente.

## 2. Problema y persona

**Carlos** (vendedor, `sales`) es la persona. Es la misma del PRD fundacional: vive
en el movil, odia el trabajo administrativo y evita cualquier herramienta que le
haga meter datos que no aportan.

**Que hace HOY** (respuesta literal de Aitor, 2026-09-07): escribe a sus clientes
desde Gmail en otra ventana, o desde otro cliente de correo donde tiene configurada
esa misma cuenta de Gmail. El CRM no participa. Si quiere que quede constancia,
abre el CRM y escribe a mano una interaccion de tipo email con una nota — que es
un resumen suyo, no el correo.

**Que le cuesta**: doble trabajo (escribir el email y luego describirlo), y un
historial de cliente que miente por omision. Cuando abre la ficha de un cliente
antes de llamarle, lo que ve no incluye la conversacion real.

**Marta** (dueña, `owner`) es persona secundaria: hoy supervisa la actividad del
equipo y, con esta ola, esa supervision alcanza tambien al email (ver seccion 24).

## 3. Wedge

La cuña minima es **leer**: que los emails que YA existen con un cliente aparezcan
en su ficha sin que Carlos haga nada. Confirmado por Aitor: *"no se si hace falta
bajar todos los emails, pero seguro que hace falta poder leerlos"*.

Escribir y responder entran tambien en esta ola, pero ahora son baratos: se delegan
en Gmail (seccion 12, alternativa B'). La primera muesca sigue siendo la lectura, que
es lo que convierte la ficha del cliente en un sitio donde de verdad esta todo.

**Por que ahora y no hace dos años**: (a) el producto esta terminado — las 46 issues
del MVP y las 21 de Post-MVP estan cerradas, y esta es la primera ola de alcance
genuinamente nuevo; (b) la ola siguiente pone una IA a analizar la relacion con el
cliente, y sin el email no tiene materia prima; (c) ya existe un cliente OAuth de
Google Cloud creado y un flujo de consentimiento probado por personas reales
(AIT-60). **Precision importante**: ese flujo NO es reutilizable tal cual — vive
dentro de la libreria de autenticacion y no pide permisos de Gmail (ver seccion 28).
Lo que esta hecho es el trabajo administrativo de tener un cliente OAuth y saber que
el consentimiento funciona; el consentimiento de Gmail hay que pedirlo aparte.

## 4. Alcance del appetite

Appetite **completo** (decidido por Aitor antes de escribir, 2026-09-07): esta ola
es un proyecto en si mismo. Lo justifican tres cosas que aqui no son ceremonia: leer
correo ajeno obliga a la seccion de seguridad y privacidad (24); una sincronizacion
continua con tokens que caducan y un canal push que caduca obligan a estados y
errores (23) y a operacion (25); y como esta ola es el cimiento de la IA de la
siguiente, el modelo de entidades (21) decide si esa ola se construye o se rehace.

**Entra:**
- Conexion de la cuenta de Gmail de cada usuario, con consentimiento explicito.
- Sincronizacion de emails **solo con direcciones que ya son contactos del CRM de la
  tienda del usuario**.
- Historico desde la fecha de la oportunidad **mas antigua a la que el vendedor tiene
  acceso**, **sin tope superior** (decision de Aitor, 2026-09-08). Ya no es un numero
  de meses: la fecha la fijan los datos de cada vendedor.
- Visualizacion en la ficha del cliente y en cada oportunidad de ese cliente.
- Abrir Gmail desde el CRM con el destinatario cargado (escribir) o en el hilo
  (responder), sin construir editor.
- Aviso en tiempo real de lo enviado o recibido, via notificaciones push de Gmail.
- Marta ve el contenido completo, igual que el vendedor dueño del email.

**Se queda fuera a proposito** (ver seccion 7, con su alternativa cada uno): editor de
correo propio, correo que no sea de un contacto del CRM, creacion automatica de
contactos, adjuntos guardados en el CRM, analisis con IA (es la ola siguiente), y
cualquier proveedor de correo que no sea Gmail.

**Para quien es esta ola — piloto interno** (decision de Aitor, 2026-09-08, al cerrar la
premisa madre nº2 de la seccion 9): la Ola 2 se construye **solo para cuentas del
Workspace de `talent-network.org`**. Es lo que hace viable la via Interna y lo que evita
la auditoria CASA.

**Queda explicitamente fuera**: los vendedores de un negocio cliente, con su propio
dominio de correo — incluidas las cuentas de prueba `marta@supercrm.es` y
`carlos@supercrm.es` tal como existen hoy. **Consecuencia declarada**: esta ola **todavia
no sirve** al caso de uso del PRD fundacional ("CRM para pequeños negocios"); es el
peldaño que prueba el mecanismo con correo real antes de decidir como se abre a terceros.
Cuando se abra, la via Interna deja de valer y se reabre la decision (seccion 12,
alternativa A).

**Modo de alcance elegido**: alternativa B' (ver seccion 12).

## 5. Historias de usuario

- **H1** — Como Carlos, quiero conectar mi cuenta de Gmail al CRM una sola vez, para
  que a partir de ahi el CRM vea mis correos con clientes sin que yo haga nada mas.
- **H2** — Como Carlos, quiero abrir la ficha de un cliente y ver ahi los emails que
  he intercambiado con el, para saber por donde va la conversacion antes de llamarle.
- **H3** — Como Carlos, quiero ver en una oportunidad los emails de su cliente, para
  no tener que salir al cliente y volver mientras trabajo esa venta.
- **H4** — Como Carlos, quiero escribir a un cliente desde el CRM sin teclear su
  direccion ni cambiar de contexto, para no perder tiempo ni equivocarme de
  destinatario.
- **H5** — Como Carlos, quiero responder a un email desde el CRM y que mi respuesta
  quede en la misma conversacion, para que el cliente vea un hilo y no correos
  sueltos.
- **H6** — Como Carlos, quiero que lo que envio aparezca en el CRM en segundos, para
  no dudar de si el CRM se ha enterado y acabar apuntandolo a mano por si acaso.
- **H7** — Como Marta, quiero ver los emails de las conversaciones de mi equipo con
  clientes, para supervisar el seguimiento sin preguntar caso por caso.
- **H8** — Como Carlos, quiero que un email que envio a un cliente cuente como
  actividad de su oportunidad, para que el CRM no me la marque como parada cuando
  acabo de escribirle.

H8 es la que impide que la ola rompa la promesa central del producto; su alcance
exacto esta acotado en la seccion 21 tras el hallazgo H4 de la review.

## 6. Criterios de aceptacion

**Sobre los nombres que aparecen en estos criterios.** Se sigue diciendo "Carlos" y
"Marta" porque son las personas del PRD y hacen los criterios legibles. Pero en el
**piloto interno** (seccion 4) quien los ejercita son las cuentas del Workspace: `Carlos`
se lee como *"la cuenta con rol `sales` del piloto"* y `Marta` como *"la cuenta `owner`"*.
Verificar un criterio con `carlos@supercrm.es` **no demuestra nada**, porque esa cuenta no
puede conectar Gmail (hallazgo H9 de la ronda 2 del ciclo 2).

**Como se leen los codigos de esta seccion**, porque hasta la v0.6 la letra "H"
significaba tres cosas distintas y se confundian (hallazgo H11 del ciclo 2):
- **H1–H8** son las **historias de usuario** de la seccion 5. Un criterio marcado "(H4)"
  verifica esa historia.
- **C1–C5** son criterios que **no tienen historia detras**: nacieron de decisiones o de
  hallazgos de review y verifican una regla, no un deseo del usuario.
- Los "hallazgo H<n> de la ronda <n>" que aparecen en el texto son **de las reviews**, y
  no tienen nada que ver con los dos anteriores. Se citan para dejar rastro de por que
  algo esta escrito como esta.

**Conexion de la cuenta (H1)**
- PASA si: un usuario `sales` completa el consentimiento de Google y, al volver al
  CRM, ve su cuenta de Gmail listada como conectada con la fecha de conexion, en la
  pantalla que entrega la fase 1 (ver seccion 8).
- FALLA si: tras completar el consentimiento, el CRM no muestra la cuenta conectada,
  o la muestra conectada sin haber obtenido un token de refresco utilizable.

**Filtro de contactos (H2) — es el criterio de privacidad**
- PASA si: tras una sincronizacion, todo email almacenado tiene al menos una direccion
  (remitente o destinatario) que coincide con el campo `email` de un documento de
  `customers` **cuyo `storeId` es el mismo que el del usuario dueño del buzon**, y el
  numero de emails almacenados que no cumplen eso es **cero**.
- FALLA si: existe en la base de datos al menos un email que no cumpla lo anterior,
  incluido un email emparejado con un contacto de otra tienda.

**Ficha de cliente (H2)**
- PASA si: al abrir la ficha de un cliente con emails sincronizados, se ven en orden
  cronologico junto a las interacciones manuales, y cada uno muestra remitente, fecha,
  asunto y si fue enviado o recibido, sin abrirlo.
- FALLA si: los emails aparecen en una lista separada del historial de interacciones,
  o alguno de esos cuatro datos exige abrir el email para verse.

**Oportunidades (H3)**
- PASA si: una oportunidad de un cliente con emails muestra esos mismos emails, sin
  que nadie los haya asignado a mano a esa oportunidad.
- FALLA si: un cliente con dos oportunidades abiertas obliga a elegir a cual
  pertenece cada email, o los muestra en una sola de ellas.

**Escribir (H4)**
- PASA si: pulsar "Escribir email" en la ficha de un cliente con email abre Gmail con
  ese cliente ya puesto como destinatario, sin que el usuario teclee la direccion.
- FALLA si: abre Gmail en blanco, o abre un editor propio del CRM.

**Responder en el hilo (H5)**
- PASA si: pulsar sobre un email recibido abre en Gmail **ese mismo hilo**, y la
  respuesta enviada desde ahi llega al cliente con el mismo `threadId` que el original.
- FALLA si: abre un mensaje nuevo en vez del hilo, o la respuesta llega fuera del hilo.

**Aviso en tiempo real (H6)**
- PASA si: un email enviado desde Gmail a un contacto del CRM aparece en el historial
  de ese cliente en **menos de 60 segundos**, sin que el usuario recargue la pagina.
- FALLA si: hace falta recargar, o tarda mas de 60 segundos con el canal push activo.

**Supervision (H7)**
- PASA si: Marta abre la ficha de un cliente de su tienda y ve los mismos emails, con
  el mismo cuerpo, que ve el vendedor dueño de ese cliente.
- FALLA si: Marta ve menos emails o el cuerpo recortado. (Excepcion declarada: los
  adjuntos no se guardan en esta ola y su enlace solo funciona en el buzon de quien lo
  recibio — ver seccion 7.)

**Actividad de la oportunidad (H8)**
- PASA si: al registrarse un email **saliente posterior a la conexion de la cuenta**,
  nacido de un clic que traia una oportunidad en contexto, el `lastActivityAt` de
  **esa** oportunidad pasa a ser **el maximo entre su valor actual y la fecha del
  email**, y la oportunidad deja de figurar en la lista de "en riesgo" si solo estaba
  ahi por inactividad.
- PASA si: al registrarse un email **saliente posterior a la conexion** sin oportunidad
  en contexto, a un cliente con **exactamente una** oportunidad abierta, se actualiza
  esa con ese mismo maximo.
- PASA si: terminada la sincronizacion **historica** de un vendedor (todo lo anterior a
  su conexion), el `lastActivityAt` de **ninguna** oportunidad ha cambiado respecto al
  valor que tenia antes de conectar.
- FALLA si: algun `lastActivityAt` **retrocede**; si cambia el de una oportunidad
  distinta de la que traia el clic en contexto; si cambia alguna cuando no hay contexto
  y el cliente tiene dos o mas abiertas; si lo cambia un email **entrante** o un email
  del historico; o si se crea algun documento en `nextSteps` a raiz de un email.

**Vias de registro que no se solapan**
- PASA si: `interactions.create` **rechaza en el servidor** una interaccion de tipo
  `email` cuando quien la envia tiene una cuenta de Gmail conectada, **y** ademas la
  interfaz no ofrece esa opcion; un usuario sin cuenta conectada la ve y puede usarla.
- FALLA si: la restriccion vive **solo** en la interfaz y la mutation acepta la
  interaccion al invocarla directamente; o si un usuario sin cuenta conectada deja de
  poder registrarla.

**Un solo registro por email**
- PASA si: tras enviar un email a un cliente, el historial lo muestra **una sola vez**
  y la tabla `interactions` no ha ganado ninguna fila. Si **el mismo correo llega a dos
  buzones conectados** (Carlos lo envia y Marta va en copia), el historial del cliente
  lo sigue mostrando **una sola vez**.
- FALLA si: el mismo envio aparece dos veces —incluido el caso de los dos buzones
  conectados—, o se crea una interaccion ademas del registro del email.

**Permisos (transversal) — es el invariante de seguridad**
- PASA si: un usuario `sales` que invoque directamente la funcion de Convex que lee
  emails, pidiendo los de un cliente de otra tienda O los de un cliente de su tienda que
  no le pertenece **y en cuyos correos no aparece su propio buzon**, no recibe **ningun
  dato** — con el mismo tratamiento que ya usan las lecturas existentes, que devuelven
  `null` en vez de lanzar, para no distinguir "no existe" de "no es tuyo".
- PASA si: ese mismo `sales` **si** recibe los emails de un cliente ajeno **en los que su
  propio buzon aparece** (seccion 24), y **solo esos** — no el resto del historial de ese
  cliente, ni su ficha, ni sus oportunidades.
- PASA si: un usuario `storeManager` lee los emails de **cualquier** cliente de su
  tienda —igual que `owner`— y ninguno de otra tienda. Son los **tres** roles reales
  del sistema (`convex/schema.ts`), no dos.
- FALLA si: la restriccion vive solo en la interfaz y la funcion responde con datos; o
  si `storeManager` queda sin acceso a los emails de su tienda por haberse replicado un
  modelo de dos roles que no existe.

**Desconectar la cuenta conserva el historial (C1)**
- PASA si: tras desconectar la cuenta de Gmail de un vendedor, el numero de emails de
  sus clientes en la base de datos es **el mismo** que antes de desconectar, siguen
  visibles en la ficha del cliente, y no queda ni token ni canal push vivo de esa
  cuenta.
- FALLA si: desconectar borra algun email, o deja el token o el canal push activos.

**Borrado de un cliente (C2)**
- PASA si: al borrar un cliente **sin oportunidades** que tiene emails, el CRM muestra
  antes un dialogo con el **numero real** de emails que se van con el, y al confirmar
  desaparecen el cliente y esos emails.
- PASA si: al intentar borrar un cliente **con** oportunidades, sigue bloqueandose con
  el mensaje de AIT-65, tenga emails o no — los emails **nunca** son un motivo de
  bloqueo adicional.
- FALLA si: los emails bloquean el borrado; si el dialogo no dice el numero o dice uno
  generico; o si tras confirmar quedan en la base de datos emails del cliente borrado.

**Alcance del historico (C3)**
- PASA si: tras la primera sincronizacion de un vendedor, el email mas antiguo
  almacenado **no es anterior** a la fecha de creacion de la oportunidad mas antigua a
  la que ese vendedor tiene acceso, y **no falta** ningun email posterior a esa fecha
  que cumpla el filtro de contacto y tienda.
- PASA si: un vendedor **sin ninguna oportunidad accesible** conecta su cuenta y el CRM
  sincroniza solo el correo **posterior a la conexion**, sin historico y sin error
  (hallazgo H8 de la ronda 3: sin oportunidades no hay fecha de la que partir). Un
  vendedor recien incorporado esta exactamente en ese caso, asi que no es un borde
  teorico.
- FALLA si: el historico se corta en una fecha posterior teniendo el buzon correo
  valido antes de ella; si se baja correo anterior a esa oportunidad; o si conectar una
  cuenta sin oportunidades accesibles da un error en vez de sincronizar solo lo nuevo.

**Intencion de escritura y su emparejamiento (C4)** — hace verificable la regla de §21
- PASA si: pulsar "Escribir" desde una oportunidad y enviar el correo **dentro de 30
  minutos** atribuye la actividad a **esa** oportunidad.
- PASA si: **dos clics seguidos** al mismo cliente y un solo envio dejan **una** intencion
  consumida (la mas reciente que cumple la ventana) y la otra **caducada**; ninguna
  atribuye actividad dos veces.
- PASA si: **dos envios** al mismo cliente dentro de la ventana consumen **una sola**
  intencion; el segundo se trata como email sin contexto.
- PASA si: pulsar "Escribir" y **no enviar** deja la intencion en `caducada` pasados 30
  minutos, y **ninguna** oportunidad cambia su `lastActivityAt`.
- FALLA si: una intencion se consume mas de una vez; si una sin consumir atribuye
  actividad; o si **un email posterior a la ventana de 30 minutos consume** una intencion
  vieja. (No falla que el documento siga con el valor `pendiente` pasada la ventana: la
  caducidad se evalua **al leer**, asi que lo que importa es que no se use, no como este
  etiquetada mientras espera a que la limpien.)
- Nota de implementacion, porque decide si hace falta trabajo nuevo: la caducidad se
  **evalua al leer** (una intencion con mas de 30 minutos ya no es candidata), no hace
  falta un proceso que las marque. El cron horario que existe (`convex/crons.ts`) sirve
  para limpiar las viejas, que es higiene, no correccion.

**Emparejamiento de direcciones (C5)**
- PASA si: un email dirigido a `Nombre Apellido <CLIENTE@Ejemplo.COM>` se empareja con
  el cliente cuyo `email` es `cliente@ejemplo.com`, y uno dirigido a
  `cliente+loquesea@ejemplo.com` tambien.
- FALLA si: la comparacion distingue mayusculas, no descarta el nombre de la cabecera,
  o si dos clientes de la misma tienda que comparten direccion provocan que el mismo
  email se guarde dos veces.

## 7. No-gos

- **NO** construiremos un editor de correo (adjuntos, copia, copia oculta, formato,
  firma, borradores); **en su lugar**, el CRM abre Gmail con el destinatario o el hilo
  ya cargados, y el vendedor usa las funciones que ya conoce.
- **NO** sincronizaremos correo que no sea de contactos del CRM de la tienda del
  usuario; **en su lugar**, el filtro se aplica ANTES de guardar nada y lo que no
  coincide se descarta sin persistirse.
- **NO** crearemos contactos automaticamente al recibir un email de un desconocido;
  **en su lugar**, el alta de clientes sigue siendo un acto explicito, como hoy.
- **NO** guardaremos adjuntos en el CRM; **en su lugar**, el email indica que los
  tenia y ofrece abrirlo en Gmail. Consecuencia asumida: quien no tenga ese correo en
  su buzon (por ejemplo Marta supervisando) no podra abrir el adjunto — excepcion ya
  declarada en el criterio de H7.
- **NO** soportaremos proveedores de correo distintos de Gmail; **en su lugar**, el
  CRM sigue permitiendo registrar una interaccion de tipo email a mano, como hoy, para
  quien no use Gmail.
- **NO** analizaremos el contenido con IA en esta ola; **en su lugar**, el modelo de
  datos (seccion 21) se diseña para que la ola siguiente pueda hacerlo sin migracion.
- **NO** publicaremos esta app como producto para otros negocios mientras el email
  este dentro; **en su lugar**, la app se declara Interna del Workspace de
  `talent-network.org`, que es lo que evita la auditoria CASA (ver seccion 24).

## 8. Fases walking-skeleton

1. **Esqueleto (el recorrido entero, feo pero completo)**: Carlos conecta su Gmail
   desde una pantalla minima que ya muestra el estado de la conexion; el CRM baja los
   emails de **un solo contacto conocido**, de los ultimos dias; se ven en la ficha de
   ese cliente. Punta a punta: consentimiento → token → llamada a Gmail → filtro por
   contacto y tienda → guardado → pantalla.
2. **Ensanchar la lectura**: todos los contactos de la tienda, el historico completo
   (desde la oportunidad mas antigua a la que el vendedor tiene acceso, sin tope — ver
   seccion 4), y sincronizacion incremental. Este historico **no toca `lastActivityAt`**
   (seccion 21).
3. **Tiempo real**: canal push de Gmail (`users.watch` + Pub/Sub) y su renovacion, para
   que lo enviado o recibido aparezca en segundos.
4. **Salir a Gmail**: abrir Gmail con destinatario cargado (escribir) y en el hilo
   (responder), desde ficha de cliente y desde oportunidad.
5. **Ensanchar la vista y la actividad**: emails en las oportunidades del cliente
   (vista derivada), integrados en el historial cronologico, y el enganche de
   `lastActivityAt` de H8 con su atribucion por contexto del clic (el contexto ya se
   registra en la fase 4).
6. **Operacion**: estados de error visibles (token revocado, canal push caducado,
   sincronizacion caida), reconexion, y la pantalla de estado completa.

Ninguna fase es "el modulo X entero": la 1 ya cruza todas las capas. La pantalla de
estado de la conexion aparece minima en la fase 1 y se completa en la 6, porque el
criterio de H1 la necesita desde el principio.

**Como se ven estas pantallas**: las seis maquetas de alta fidelidad viven en
`producto/ola-2-email/pantallas/` — `Main.dc.html` (ficha de cliente con historial
unificado), `DetalleOportunidad.dc.html` (vista derivada), `ConexionGmail.dc.html`
(cuatro estados, fases 1 y 6), `EmailAbierto.dc.html` (fase 4),
`GmailDesconectado.dc.html` (seccion 23) y `DialogoSinEmail.dc.html` (patron AIT-66,
seccion 23). Quien implemente una fase parte de su maqueta, no de la descripcion.

## 9. Riesgos y premisas

- **Premisa madre**: la exencion de app Interna evita la auditoria CASA para permisos
  restringidos. · **Como se verifica**: declarar la app como Interna en el proyecto de
  Google Cloud propiedad del Workspace, pedir `gmail.readonly` con una cuenta del
  dominio y comprobar que Google concede el consentimiento sin exigir revision.
  **Sostiene la ola entera**: si cae, se detiene y se reabre la decision pasando a la
  **alternativa A** (buzon de reenvio con Resend Inbound, seccion 12) — que es el plan
  B vivo. La alternativa C (CASA) esta descartada por Aitor y no vuelve.
- **Premisa madre nº2, la que faltaba** (hallazgo H1 de la ronda 3): **quien conecta su
  Gmail tiene una cuenta del Workspace de `talent-network.org`**. Una app **Interna**
  solo permite consentir a cuentas de la organizacion propietaria, asi que esta premisa
  no es un detalle de configuracion: decide **para quien existe la ola**. · **Como se
  verifica**: listar los usuarios reales de `users` y comprobar el dominio de cada uno.
  **Hoy conviven dos dominios** (`convex/users.ts`, `docs/03-setup.md`): las cuentas de
  contraseña `marta@supercrm.es` / `carlos@supercrm.es`, que **NO podrian consentir**, y
  las cuentas Google `admin@talent-network.org` / `aitor.marin@talent-network.org`, que
  si. · **Resuelto por Aitor, 2026-09-08**: esta ola es un **piloto interno** — ver
  seccion 4. Los vendedores de un negocio cliente, con su propio dominio, quedan
  explicitamente fuera de esta ola; el dia que entren, la via Interna deja de valer y se
  pasa a la **alternativa A** (buzon de reenvio con Resend Inbound, seccion 12).
- **Premisa**: los contactos del CRM tienen email. · **Como se verifica**: contar
  cuantos documentos de `customers` tienen el campo `email` relleno. Hoy es opcional
  (seccion 28) y la base de produccion esta practicamente vacia. Si la mayoria no
  tiene email, no hay con que emparejar y el valor de la ola cae.
- **Premisa**: se puede abrir Gmail directamente en un hilo concreto desde una URL,
  usando el identificador de hilo que da la sincronizacion. · **Como se verifica**:
  probarlo a mano en la fase 1 con un hilo real, antes de diseñar la fase 4. **NO
  VERIFICADO**: la URL de redaccion esta documentada, pero la de apertura de hilo no
  lo esta oficialmente. Si falla, H5 se degrada a abrir Gmail buscando por asunto.
- **Premisa**: el volumen de correo por vendedor cabe en el plan de Convex sin
  disparar el coste. · **Como se verifica**: medir el tamaño medio de un email real y
  extrapolarlo al historico completo de cada vendedor, en la fase 1. **NO VERIFICADO**,
  y desde 2026-09-08 sin red de seguridad: al quitarse el tope del historico
  (seccion 15) ya no hay limite que bajar si la medicion sale cara — habria que
  reabrir la decision con Aitor.
- **Riesgo aceptado**: el historico sin tope deja el coste de Convex **abierto** hasta
  que se mida. Aitor lo acepto explicitamente el 2026-09-08, con la consecuencia
  delante, prefiriendo el historial completo a un limite arbitrario.
- **Riesgo aceptado**: la app deja de ser vendible a terceros mientras el email este
  dentro. Aitor lo acepto explicitamente al elegir la via Interna.
- **Riesgo aceptado**: si un vendedor revoca el permiso, el CRM deja de sincronizar
  hasta que reconecte. Se cubre mostrandolo (seccion 23), no evitandolo.
- **Riesgo aceptado**: al delegar la redaccion en Gmail, el CRM no sabe si el vendedor
  llego a enviar o cerro la ventana. Se asume: el CRM registra lo que Gmail confirma
  que salio, nunca la intencion.

## 10. Landscape

Busqueda hecha el **2026-09-07** con herramientas propias (la memoria del asistente
esta caducada por definicion; esto es un snapshot con fecha).

**Politica de Google — el condicionante principal:**
- Los permisos de lectura de Gmail son **restringidos**: `gmail.readonly`,
  `gmail.metadata`, `gmail.modify`, `gmail.compose`, `gmail.insert`,
  `gmail.settings.*` y `https://mail.google.com/`
  ([lista oficial](https://support.google.com/cloud/answer/13464325)).
  Pedir cualquiera obliga a una evaluacion de seguridad CASA por un asesor homologado,
  **con revalidacion anual**
  ([verificacion de scopes restringidos](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification)),
  de cientos a miles de dolares al año y 6-12 semanas el primer ciclo.
- **`gmail.send` NO figura como restringido**, pero esta ola **ya no lo necesita**: al
  delegar el envio en Gmail, el unico permiso que se pide es `gmail.readonly`.
- **Exencion aplicable**: para apps **Internas** de una organizacion de Google
  Workspace, el uso de permisos restringidos o sensibles no requiere revision
  adicional
  ([consideraciones para Workspace](https://developers.google.com/identity/protocols/oauth2/production-readiness/google-workspace)).
  Es la via elegida.

**Mecanismos que hacen viable el diseño de esta ola:**
- **URL de redaccion de Gmail**: `mail.google.com/mail/?view=cm&fs=1&to=…&su=…&body=…`,
  con copia y copia oculta ([referencia](https://til.simonwillison.net/google/gmail-compose-url)).
  Limite practico de unos 2000 caracteres de URL.
- **Notificaciones push de Gmail**: `users.watch` publica en un tema de Cloud Pub/Sub
  cada cambio del buzon, y Pub/Sub lo entrega a un webhook en segundos
  ([guia oficial](https://developers.google.com/workspace/gmail/api/guides/push)).
  Es lo que permite enterarse de un envio sin sondear.

**Como resuelven esto otros CRM** (Salesforce, HubSpot, Pipedrive): conexion directa
del buzon por OAuth, y ademas un **buzon de reenvio** que no requiere permisos del
proveedor. El segundo se evaluo (alternativa A) y queda como plan B.

**Infraestructura ya disponible**: Resend, integrado para el envio de codigos de
recuperacion, soporta correo **entrante** por webhook
([Resend Inbound](https://resend.com/features/inbound)). No se usa en esta ola, pero
es lo que hace realista la alternativa A si cae la premisa madre.

## 11. Interrogatorio sellado

1. **¿Quien lo necesita tanto que lo usaria aunque estuviera roto?** Carlos, el
   vendedor. Confirmado contra el PRD fundacional, no preguntado.
2. **¿Que hace HOY sin el producto?** Escribe desde Gmail en otra ventana, o desde
   otro cliente con esa misma cuenta configurada. El CRM no se entera.
3. **¿Por que ahora y no hace dos años?** El producto esta terminado (67 issues
   cerradas, cero backlog); la ola siguiente pone una IA que necesita el email como
   materia prima; y ya hay un cliente OAuth creado y un consentimiento probado con
   personas reales (con el matiz de la seccion 3).
4. **¿Cual es el wedge?** Leer: que los emails que ya existen aparezcan solos en la
   ficha del cliente.
5. **¿Como sabras en 2 semanas que NO funciona?** Si Carlos sigue yendo a Gmail **por
   su cuenta**, sin pasar por el CRM, para escribir a un cliente. Ojo al matiz que
   introduce el diseño nuevo: ahora se acaba SIEMPRE en Gmail; lo que se mide es si se
   llega ahi **desde** el CRM.
6. **¿Que tendria que ser cierto para matar la idea?** Que leer Gmail exigiera una
   auditoria inasumible. **Se demostro cierto para el caso general** y la idea estuvo
   a punto de morir: se salvo por la exencion de app Interna, al precio de renunciar a
   vender el producto a terceros. La licencia para matar se activo de verdad.

## 12. Alternativas A B C

- **A (minimo defendible) — Buzon de reenvio**: el CRM da una direccion propia; el
  vendedor reenvia o pone en copia oculta; se ingiere con Resend Inbound. Cero
  permisos de Google, cero auditoria, funciona con cualquier proveedor y mantiene
  SuperCRM vendible. **Descartada como via principal** porque no trae historico y
  depende de que el vendedor configure y recuerde una regla. **Es el plan B vivo** si
  cae la premisa madre (seccion 9).
- **B (equilibrio) — Gmail API con app Interna y envio por API**: `gmail.readonly` +
  `gmail.send`, con editor de correo propio en el CRM. **Descartada durante la ronda
  2**: obligaba a construir adjuntos, copia, formato y firma, y el resultado seria
  peor que Gmail.
- **B' (equilibrio, ELEGIDA) — Gmail API para leer, Gmail para escribir**:
  `gmail.readonly` unicamente; escribir y responder abren Gmail con el contexto ya
  cargado; el aviso push devuelve el resultado en segundos. Gana porque entrega el
  mismo valor que B eliminando el componente mas caro de la ola y un permiso.
- **C (ambicioso) — app Externa con CASA**: mantendria SuperCRM como producto para
  muchos negocios. **Descartada por Aitor** ("eso de la auditoria es inviable").

Una quinta via —automatizar Gmail por navegador— se descarta explicitamente: viola
los terminos de servicio, es fragil, y obligaria a guardar la sesion completa del
usuario, que da acceso a TODO el buzon sin limite de permisos. Seria peor para la
privacidad que la API, no mejor.

## 13. Metricas de exito

**Quien participa en el piloto, con nombre** (hallazgo H6 del ciclo 2, y es la
consecuencia menos obvia del piloto interno de la seccion 4). La via de app Interna solo
deja consentir a cuentas del Workspace de `talent-network.org`, y hoy esas son
`admin@talent-network.org` (rol `owner`) y `aitor.marin@talent-network.org` (rol
`sales`). **Las cuentas de prueba `marta@supercrm.es` y `carlos@supercrm.es` NO pueden
participar**: son cuentas de contraseña de otro dominio.

Eso obliga a decir algo incomodo y a decirlo aqui: **las metricas de esta ola se miden
sobre las cuentas del Workspace, no sobre Marta y Carlos.** Carlos es la persona del
PRD y el `sales` de todos los ejemplos, pero en el piloto su papel lo hace la cuenta
`sales` del Workspace. Redactar metricas sobre "todos los vendedores activos" incluyendo
a Carlos las haria **inalcanzables por construccion**, no dificiles.

Se expresan en **absolutos**, no en porcentajes: en el piloto hay una sola cuenta `sales`
participante, asi que cualquier porcentaje solo podria dar 0% o 100% (hallazgo H10 de la
ronda 1). **Cada metrica dice desde cuando se cuenta su plazo**, porque no todas
arrancan a la vez: las de adopcion y sustitucion dependen de que exista la fase 4, y
las de historial y frescura dependen solo de la primera sincronizacion (hallazgo H12
de la ronda 2).

1. **Adopcion**: **todas las cuentas del Workspace dadas de alta en el piloto** tienen
   su Gmail conectado a los 14 dias **de publicarse la fase 1** (que es la que ya permite
   conectar). Hoy son **dos**: `admin@` y `aitor.marin@`. Las cuentas de prueba de otro
   dominio no cuentan, porque no pueden consentir. El numero se revisa cuando el piloto
   se abra.
2. **Sustitucion real** (refuta la señal de muerte de §11.5): a los 14 dias **de
   publicarse la fase 5** — no la 4 (hallazgo H6 de la ronda 3): la fase 4 crea las
   `emailIntents` pero es la 5 la que las **consume**, y sin consumo no hay nada que
   contar. Contar desde la 4 medirian catorce dias de los cuales varios no producen
   dato. A partir de ese momento, **se cuentan dos numeros y se comparan**: emails salientes
a contactos del CRM **iniciados desde el CRM** (intenciones consumidas) frente a los
**iniciados fuera**. La señal buena es que el primero supere al segundo. Son dos conteos,
no un porcentaje — coherente con lo que declara esta seccion. La formulacion anterior era
**la mayoria de
   los emails salientes a contactos del CRM se han iniciado desde el CRM**. Se mide
   contando las `emailIntents` **consumidas** (seccion 21) frente al total de emails
   salientes que devuelve la sincronizacion en esa misma ventana. Se declara la
   limitacion: una intencion que caduca sin consumir no se distingue de un envio
   iniciado fuera; el numero es indicativo, no exacto. Plazo alineado con los 14 dias
   de la señal de muerte.
3. **Completitud del historial**: a los 7 dias de la primera sincronizacion, **todo
   cliente que tenga email relleno y correspondencia real** tiene al menos un email
   en el CRM. Se comprueba cliente a cliente, no por muestreo — con el volumen actual
   es viable.
4. **Higiene del filtro**: exactamente **0** emails almacenados fuera del filtro de
   contacto y tienda, medido en cualquier momento. No es un objetivo: es una condicion
   de la seccion 24.
5. **Latencia percibida**: ningun email tarda mas de 60 segundos en aparecer con el
   canal push activo (mismo umbral que el criterio de H6). Se mide **de forma continua
   desde que la fase 3 esta publicada**, que es la que trae el canal push.

## 14. Flujo principal

1. Carlos entra en la pantalla de conexion y pulsa "Conectar mi Gmail". Estado: sin
   token, sin emails.
2. Google le pide consentimiento de solo lectura. Al aceptar, el CRM guarda un token
   de refresco cifrado. Estado: conectado, sin sincronizar.
3. Primera sincronizacion: el CRM pide a Gmail los mensajes **desde la fecha de la
   oportunidad mas antigua a la que Carlos tiene acceso** (sin tope, seccion 4) y, por
   cada uno, comprueba si alguna direccion implicada coincide —ya normalizada, seccion
   21— con el `email` de un contacto **de su tienda**. Lo que coincide se guarda; lo que
   no, se descarta sin escribirse. **Nada de este historico mueve la actividad de
   ninguna oportunidad** (seccion 21). Estado: sincronizando, con progreso visible.
4. El CRM abre un canal push sobre ese buzon. Estado: escuchando cambios.
5. Carlos abre la ficha de un cliente. Ve un historial cronologico unico: sus
   interacciones manuales de siempre y, entremezclados por fecha, los emails, cada uno
   con remitente, asunto, fecha y si fue enviado o recibido.
6. Carlos abre una oportunidad de ese cliente y ve los mismos emails, sin haber
   asignado nada.
7. Carlos pulsa sobre un email recibido. El CRM abre Gmail **en ese hilo**. Carlos
   responde ahi, con las funciones de Gmail. Estado: el CRM no sabe aun nada.
8. Gmail publica el cambio; el webhook lo recibe en segundos; el CRM pide solo lo que
   cambio y guarda el email saliente. Estado: email registrado, historial actualizado
   sin recargar.
9. Como Carlos respondio **desde una oportunidad concreta**, el CRM sabe a cual
   atribuir el email: su `lastActivityAt` pasa a la fecha del email y deja de figurar
   como parada. Si hubiera escrito desde la ficha del cliente y ese cliente tuviera
   dos oportunidades abiertas, no se tocaria ninguna (seccion 21).
10. A partir de ahi todo llega solo, sin que Carlos vuelva a hacer nada.

## 15. Requisitos no funcionales

- **Volumen por pantalla y paginacion**: con el historico sin tope (seccion 4) un cliente
  veterano puede tener miles de emails, asi que **la ficha no los carga todos**: muestra
  los mas recientes y carga el resto bajo demanda al desplazarse. El umbral de 200 de
  abajo es el objetivo de rendimiento de **lo que se pinta**, no un limite de lo que se
  guarda (hallazgo H10 del ciclo 2).
- **Latencia de lectura**: la ficha de un cliente con 200 emails carga en < 1 s.
  **Umbral NUEVO de esta ola** — no existe un umbral de rendimiento documentado en
  `docs/01-arquitectura.md` al que remitirse (hallazgo H12 de la review).
- **Frescura**: con el canal push activo, un email aparece en < 60 s sin recargar. Si
  el canal cae, la sincronizacion periodica garantiza < 15 min como suelo degradado.
- **Volumen**: soportar el historico completo desde la oportunidad mas antigua a la
  que el vendedor tiene acceso, **sin tope**, sin degradar el resto de la aplicacion
  (decision de Aitor 2026-09-08; cierra el hallazgo H16 de la review). **El volumen no
  esta acotado por diseño**: un vendedor veterano puede arrastrar años de correo, y ese
  es el riesgo aceptado de la seccion 9. La medicion de la fase 1 ya no fija un limite
  — sirve para conocer el coste, no para recortarlo.
- **Almacenamiento**: se guarda el cuerpo en texto plano, no el HTML del correo —
  suficiente para leerlo y para que la IA de la ola siguiente lo analice, y varias
  veces mas barato.
- **Cuotas de Gmail**: la sincronizacion respeta los limites con reintentos con espera
  creciente; agotar la cuota degrada la frescura, nunca pierde correos.
- **Idioma**: interfaz en español, como el resto del CRM.
- **Movil**: la vista de email cumple el minimo de 44px de objetivo tactil (AIT-68 a
  AIT-72). Nota de diseño: en movil, "abrir Gmail" no es una ventana emergente sino
  salir a la aplicacion de Gmail y volver.

## 16. Dependencias y limites

- **Google Workspace de `talent-network.org`**: la exencion de app Interna depende de
  que el proyecto de Google Cloud pertenezca a esa organizacion.
- **El proyecto de Google Cloud que hoy sirve el login de AIT-60**: sus credenciales
  **si estan documentadas** — `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET` en
  `docs/03-setup.md` §6bis (corrige el hallazgo H14 de la ronda 1, que las daba por no
  registradas). Lo que falta es comprobar si ese proyecto pertenece al Workspace de la
  organizacion o hay que moverlo o recrearlo, antes de la fase 1.
- **Cliente OAuth propio para Gmail, separado del login** (decision *mechanical*, ver
  seccion 17): el consentimiento de Gmail NO reutiliza el cliente OAuth de AIT-60.
  Añadir los permisos de Gmail a ese cliente cambiaria la pantalla de consentimiento
  **del login para todos los usuarios**, pidiendo acceso al correo a quien solo quiere
  entrar en la aplicacion — lo contrario del "consentimiento explicito" que exige la
  seccion 24.
- **API de Gmail**: cuotas por usuario y por proyecto; los tokens de refresco pueden
  ser revocados por el usuario o por el administrador del Workspace.
- **Google Cloud Pub/Sub**: dependencia NUEVA que esta ola introduce. El canal
  `users.watch` **caduca y hay que renovarlo periodicamente**; si no se renueva, se
  dejan de recibir avisos en silencio.
- **Convex**: almacenamiento y limites del plan actual. Las variables de entorno
  nuevas van en **todos los deployments de desarrollo y en el de produccion**
  (`stoic-impala-857`). **Aviso**: hay que **confirmar el conjunto real de deployments
  antes de desplegar**. `docs/01-arquitectura.md` (ADR-004) ya anota como pendiente la
  migracion a deployments aislados por terminal, y ADR-005 menciona uno real
  (`uncommon-puffin-303`); el documento no es incorrecto, es que el conjunto vivo
  cambia. Leccion de la ola anterior: con Resend se descubrio deployment a deployment
  en vez de a la vez.
- **El campo `email` de `customers`**: es opcional hoy. Sin el relleno no hay
  emparejamiento posible — es el limite mas duro y el mas barato de comprobar.
- **Lo que puede pararlo**: que Google deniegue la exencion; que el administrador del
  Workspace bloquee la app; que el volumen dispare el coste de Convex.

## 17. Decisiones clasificadas

| Decision | Clase | Porque | Quien |
|---|---|---|---|
| App **Interna** del Workspace en vez de externa con CASA | challenge | Cuestiona una premisa del PRD fundacional ("CRM para pequeños negocios" = producto para muchos). Se escalo con la evidencia de coste y plazo en vez de decidirla en silencio | Aitor, 2026-09-07 |
| **No construir editor de correo**: escribir y responder abren Gmail | taste | Elimina el componente mas caro de la ola (adjuntos, copia, formato, firma) y el resultado seria peor que Gmail. Cuesta una metrica mas debil (§13.2) y un clic mas al responder | Aitor lo propuso, PM lo evaluo, 2026-09-07 |
| **Avisos push** (`users.watch` + Pub/Sub) en vez de solo sondeo | taste | Sin ellos, delegar el envio en Gmail dejaria al CRM sin saber que se envio hasta 15 min despues. Con ellos, segundos. Cuesta una dependencia nueva que caduca y hay que renovar | Aitor lo pidio, 2026-09-07 |
| Persistir los emails en el CRM en vez de leerlos en vivo | taste | La ola siguiente pone una IA a analizar la relacion; leer en vivo obligaria a rehacerlo. Es la unica decision que se toma mirando a la ola siguiente, y se declara como tal | PM, 2026-09-07 |
| Historico **sin tope**, desde la oportunidad mas antigua del vendedor | taste | Supera la decision del 2026-09-07 ("acotado, 6-12 meses"): el limite deja de ser un numero arbitrario y lo fijan los datos de cada vendedor. Cuesta que el coste de Convex quede abierto hasta medirlo — aceptado con la consecuencia delante | Aitor, 2026-09-08 |
| **Conservar** los emails cuando el vendedor desconecta su Gmail | taste | Los emails son historial de la **oportunidad**, no del vendedor: el historial del cliente tiene que sobrevivir a la rotacion. Cuesta guardar correo de una cuenta que retiro el consentimiento | Aitor, 2026-09-08 |
| ~~**Permitir borrar** un cliente con emails apartandose de AIT-65~~ **REVOCADA el mismo dia** | taste | Se tomo con la premisa de que los emails harian imborrable a un cliente. La review de la ronda 2 demostro que `convex/customers.ts` ya bloqueaba por oportunidades, asi que la premisa era falsa. **La sustituye la fila siguiente** | Aitor, 2026-09-08 (revocada 2026-09-08) |
| Atribuir la actividad por **contexto del clic**, con desempate por oportunidad unica | taste | Es la unica via que usa lo que el CRM ya sabe sin inventar una asignacion; el desempate conserva la regla vigente. Cuesta que los emails escritos directamente en Gmail sigan sin atribuirse | Aitor, 2026-09-08 |
| Marta ve el contenido completo de los emails de su tienda | taste | Es correspondencia comercial de la empresa, el filtro ya excluye lo personal, y es coherente con la supervision que ya tiene sobre el resto de interacciones | Aitor, 2026-09-07 |
| Un `sales` ve los emails de **sus** clientes **y los de su propio buzon** | taste | La primera mitad replica el modelo que ya rige hoy. La segunda se añadio el 2026-09-08 al ver que sin ella un vendedor que escribe a un cliente ajeno **pierde de vista su propia correspondencia** — un correo que tiene abierto en su Gmail. Ve su conversacion, no su cliente | PM 2026-09-07; ampliada por Aitor 2026-09-08 |
| El sistema tiene **tres** roles, no dos: `owner`, `storeManager` y `sales` | mechanical | `convex/schema.ts` los declara y `app/ajustes` permite asignar `storeManager` hoy. Un modelo de dos roles dejaria a ese rol sin acceso a los emails de su tienda | PM tras review ronda 2, 2026-09-08 |
| El email pertenece al **cliente**; las oportunidades lo muestran como vista derivada | mechanical | Unica respuesta que resuelve un cliente con varias oportunidades sin inventar una asignacion, y es lo que Aitor describio literalmente | PM, 2026-09-07 |
| Entidad `emails` propia en vez de reutilizar `interactions` | mechanical | `interactions` exige oportunidad obligatoria, autor que sea usuario del CRM y una nota de texto plano: un email recibido no cumple ninguna de las tres (seccion 28) | PM, 2026-09-07 |
| Un solo registro por email: no se crea interaccion espejo | mechanical | Dos registros del mismo hecho lo mostrarian dos veces en el historial | PM, 2026-09-07 |
| La interaccion manual de tipo email se oculta con Gmail conectado | taste | Con cuenta conectada es redundante y ofrecer las dos vias invita a duplicar. Se conserva para quien no tenga cuenta conectada | Aitor lo detecto, PM lo resolvio, 2026-09-07 |
| **Un email NUNCA crea un `nextStep`; solo un saliente puede tocar `lastActivityAt`** | mechanical | El codigo real exige accion y fecha escritas por el usuario para crear un proximo paso (seccion 28); un email no las aporta. Corrige el error H4 de la review | PM tras review, 2026-09-07 |
| Cliente OAuth **propio** para Gmail, separado del login de AIT-60 | mechanical | Añadir permisos de Gmail al cliente existente cambiaria la pantalla de consentimiento del login **para todos**, pidiendo acceso al correo a quien solo quiere entrar. Contradice el "consentimiento explicito" de la seccion 24 | PM tras review ronda 2, 2026-09-08 |
| La sincronizacion **historica** no toca `lastActivityAt` | taste | Dejar que el historico moviera la marca reescribiria de golpe el estado de riesgo de todo el pipeline (`lib/risk.ts`) el dia de la conexion. Cuesta que el CRM siga marcando como paradas oportunidades que se atendieron por email antes de conectar | Aitor, 2026-09-08, tras verlo en la review |
| El bloqueo de borrado **por oportunidades se mantiene**; los emails no bloquean | taste | Conserva intacta la decision deliberada de AIT-65 y cumple lo pedido (que los emails no hagan imborrable a un cliente) sin ampliar el alcance a borrar ventas reales. Cuesta que el dialogo del recuento de emails sea un caso de esquina | Aitor, 2026-09-08, tras verlo en la review |
| Deduplicar por `Message-ID` de la cabecera, no por el id de Gmail | mechanical | El id de Gmail es unico por buzon: el mismo correo en dos cuentas conectadas se guardaria dos veces y rompe el criterio "un solo registro por email" | PM tras review ronda 2, 2026-09-08 |
| No automatizar Gmail por navegador | mechanical | Viola los terminos de servicio, es fragil y da acceso a todo el buzon sin limite: peor para la privacidad que la API | PM, 2026-09-07 |

## 18. Plan de validacion

- **Antes de escribir una linea de codigo**: declarar la app como Interna y completar
  un consentimiento real con `gmail.readonly` desde una cuenta del dominio. Valida o
  tumba la premisa madre. **Bloquea todo lo demas.**
- **Tambien antes de la fase 1**: probar a mano que se puede abrir Gmail en un hilo
  concreto por URL. Si no se puede, H5 cambia de forma antes de diseñarse.
- **Antes de la fase 2**: contar cuantos `customers` tienen `email` relleno. Si son
  pocos, la fase siguiente no es sincronizar mas: es conseguir que los contactos
  tengan email.
- **Durante la fase 1**: medir el tamaño real de los emails de un vendedor y
  extrapolar. Ya no sirve para fijar un limite (no lo hay), sino para saber cuanto cuesta
  el historico completo. **El umbral es observable, no una impresion** (hallazgo H9 de la
  ronda 3): si la extrapolacion del historico completo de todos los vendedores previstos
  supera **el 25% del limite de almacenamiento del plan de Convex vigente**, se para y se
  reabre con Aitor la decision del tope. Se elige un cuarto y no la mitad porque el correo
  crece solo, sin que nadie decida ampliarlo: cuando se note ya seria tarde.
  **La puerta va ANTES de la primera descarga completa, no antes del segundo vendedor**
  (hallazgo H9 del ciclo 2): sin tope, el primer vendedor puede llenar el plan el solo,
  asi que poner el freno tras la primera bajada seria ponerlo detras del precipicio. La
  medida se toma en la **fase 1**, pero **su muestra no basta para extrapolar** (hallazgo
  H3 de la ronda 2 del ciclo 2): un contacto y unos dias no dicen cuanto pesa el historico
  completo de un vendedor. Lo que si da la fase 1, y es lo que hace falta, es el **tamaño
  medio de un email de este proyecto en bytes**. El otro factor —**cuantos correos hay**—
  no se estima, **se pregunta a Gmail**: su API responde cuantos mensajes coinciden con un
  criterio sin descargarlos. Multiplicando los dos se obtiene la proyeccion, y **entonces**
  se aplica el 25% antes de ensanchar en la fase 2. Sin ese conteo previo el umbral no es
  calculable, y un umbral que no se puede calcular no frena nada.
  **NO VERIFICADO**: el limite de almacenamiento del plan de Convex vigente no se ha
  consultado. Sin ese numero el 25% no se puede aplicar, asi que mirarlo es parte de la
  fase 1, no un detalle posterior.
- **Antes de la fase 5**: probar con correos automaticos reales (respuestas de
  ausencia, acuses de recibo) que el enganche de `lastActivityAt` no marca como activa
  una oportunidad que nadie ha atendido.

## 19. Casos de uso formales

**CU1 — Conectar la cuenta de Gmail** (formaliza H1)
- Actor: Carlos (`sales`); tambien Marta (`owner`).
- Precondicion: sesion iniciada; la cuenta pertenece al Workspace de la organizacion.
- Disparador: pulsa "Conectar mi Gmail".
- Flujo principal: redireccion al consentimiento → acepta → el CRM canjea el codigo →
  guarda el token de refresco cifrado → marca la cuenta conectada → lanza la primera
  sincronizacion → abre el canal push.
- Alternativos: rechaza el consentimiento → no se guarda nada y se explica. Dominio
  ajeno al Workspace → Google deniega y el CRM lo explica.
- Postcondicion: existe un token de refresco valido y un canal push activo.

**CU2 — Sincronizar emails de contactos** (formaliza H2)
- Actor: el sistema.
- Disparador: primera conexion, aviso push, o ciclo periodico de respaldo.
- Flujo principal: pedir los mensajes (completos la primera vez; solo los cambios
  cuando llega un aviso push) → extraer direcciones → buscar coincidencia en
  `customers` de la tienda del usuario → guardar lo que coincide, descartar el resto
  sin persistir → actualizar la marca incremental.
- Alternativos: token caducado → refrescar; si falla, marcar conexion caida (CU5).
  Canal push caducado → renovar. Cuota agotada → reintentar con espera creciente.
- Postcondicion: los emails con contactos conocidos de esa tienda estan en el CRM;
  ninguno mas.

**CU3 — Leer la conversacion** (formaliza H2, H3 y H7)
- Actor: un `sales` (sus clientes, **mas cualquier email de su propio buzon**, aunque el
  cliente sea de otro comercial — seccion 24); un `owner` o `storeManager` (todos los de
  su tienda). Son los tres roles reales.
- Disparador: abre la ficha del cliente o una de sus oportunidades.
- Flujo principal: el CRM muestra un historial cronologico unico que entremezcla
  interacciones manuales y emails.
- Postcondicion: ninguna (es lectura).

**CU4 — Escribir o responder saliendo a Gmail** (formaliza H4, H5, H6 y H8)
- Actor: Carlos.
- Precondicion: cuenta conectada; el cliente tiene email.
- Disparador: pulsa "Escribir email", o pulsa sobre un email recibido.
- Flujo principal: el CRM crea una **`emailIntent` pendiente** (usuario, cliente,
  oportunidad si el clic salio de una, direccion de destino normalizada, fecha) y abre
  Gmail —con destinatario cargado, o en el hilo— → Carlos escribe y envia en Gmail →
  Gmail avisa por push → el CRM guarda el email saliente y busca que intencion consume
  (misma direccion, dentro de 30 min, la mas reciente; seccion 21) → si la intencion
  consumida traia oportunidad, actualiza el `lastActivityAt` de esa; si no traia, solo
  lo actualiza cuando el cliente tiene exactamente una oportunidad abierta.
- Alternativos: Carlos cierra Gmail sin enviar → no llega aviso, **no se registra nada**
  y la intencion **caduca a los 30 minutos** sin atribuir actividad. Dos clics seguidos
  → el email consume el mas reciente y el otro caduca. El canal push esta caido → el
  email aparece en la siguiente sincronizacion periodica y consume la intencion si aun
  esta dentro de la ventana; si no, se trata como email sin contexto.
- Postcondicion: si se envio, el email esta registrado; si no, el CRM no miente y no
  queda ninguna intencion pendiente indefinidamente.

**CU5 — Reconectar tras una caida** (formaliza la operacion, seccion 23)
- Actor: Carlos.
- Precondicion: el token fue revocado o caduco, o el canal push expiro sin renovarse.
- Disparador: el CRM detecta el fallo.
- Flujo principal: marca la conexion como caida y lo muestra → Carlos reconecta → se
  reanuda desde la ultima marca, sin duplicar lo ya sincronizado.
- **Alternativo, y no es raro: la marca incremental ha caducado.** Gmail descarta los
  `historyId` viejos y responde con un error de "no encontrado"; entonces **no se puede
  reanudar** y hay que rehacer una sincronizacion completa (hallazgo H7 de la ronda 3).
  Con el historico sin tope (seccion 4), eso significa **recorrer otra vez todo el
  correo desde la oportunidad mas antigua del vendedor**. No duplica nada —la
  deduplicacion por `Message-ID` lo impide— pero cuesta tiempo y cuota, y el usuario
  tiene que verlo: la pantalla de conexion muestra "resincronizando desde el principio"
  en vez de un progreso silencioso. Es el segundo precio del historico sin tope, junto
  al coste de la seccion 26.
- Postcondicion: conexion restablecida y sin duplicados.

**CU6 — Desconectar la cuenta de Gmail** (formaliza la decision de §24)
- Actor: Carlos, sobre su propia cuenta; Marta o un `storeManager` no desconectan la de
  otro.
- Precondicion: cuenta conectada.
- Disparador: pulsa "Desconectar" en la pantalla de conexion.
- Flujo principal: el CRM avisa de que **los emails ya guardados se conservan** y de que
  dejara de recibir correo nuevo → Carlos confirma → se cierra el canal push, se borra
  el token de refresco cifrado y la cuenta pasa a "sin conectar" → **ningun email se
  borra**.
- Alternativos: el cierre del canal push falla en Google → se borra el token igualmente
  y el canal se deja expirar solo; se registra para operacion (seccion 25).
- Postcondicion: no queda token ni canal activo; el numero de emails del cliente es
  exactamente el mismo que antes (criterio C1 de la seccion 6).

## 20. Diagrama actores-modulos

```text
   sales                               owner · storeManager
   ve los emails de SUS clientes,      ven los de toda su tienda
   MAS los de su propio buzon
   aunque el cliente sea de otro
        │                                   │
        ▼                                   ▼
   ┌──────────────────────────────────────────────┐
   │  UI: Conexion · Ficha cliente · Detalle de   │
   │      oportunidad · botones "Escribir/Abrir"  │
   └───────┬──────────────────────────┬───────────┘
           │ useQuery/useMutation     │ abre pestaña
           ▼                          ▼
   ┌──────────────────────────┐   ┌──────────────────┐
   │  Convex                  │   │  Gmail (web/app) │
   │   gmail.ts  conexion     │   │  el vendedor     │
   │   emails.ts lectura      │   │  escribe y envia │
   │   sync      incremental  │   └────────┬─────────┘
   │   webhook   push         │            │ cambia el buzon
   │   access.ts permisos     │            ▼
   └───┬──────────────────┬───┘   ┌──────────────────┐
       │ guarda           │◄──────┤ Gmail API        │
       ▼                  │ aviso │  users.watch     │
   ┌───────────────┐      └───────┤  history.list    │
   │ emails        │              │  readonly        │
   │ gmailAccounts │              └────────┬─────────┘
   │ customers ────┼──filtro               │ publica
   │ opportunities │              ┌────────▼─────────┐
   │ interactions  │              │ Cloud Pub/Sub    │
   └───────────────┘              └──────────────────┘
```

## 21. Modelo de entidades

**Por que una entidad nueva y no `interactions`.** El as-is (seccion 28) demuestra
que un email no cabe en la tabla actual: exige identificador de oportunidad
obligatorio (un email llega a una persona, no a una venta), exige un autor que sea
usuario del CRM (un email recibido lo escribe el cliente), y solo tiene una nota de
texto plano (un email tiene asunto, cuerpo, direccion e hilo). Forzarlo alli
significaria inventar valores falsos en tres campos.

**Entidad `emails`** (nueva): `customerId` (relacion principal — el email pertenece al
cliente), `userId` (buzon que lo aporto), **`mailboxUserIds`** (lista de TODOS los
buzones conectados en los que aparece ese correo), `storeId`, `direction`
(entrante/saliente),
identificador de mensaje de Gmail, **`messageId` de la cabecera RFC**, identificador de
hilo, remitente, destinatarios, copia, asunto, cuerpo en texto plano, extracto, fecha e
indicador de adjuntos. Indices por cliente y por `messageId`.

**Clave de deduplicacion: la cabecera, no el id de Gmail.** El identificador que da
Gmail es unico **por buzon**, no por mensaje: el mismo correo que Carlos envia con Marta
en copia llega con **dos identificadores distintos** si las dos cuentas estan conectadas,
y guardarlo por ese id lo duplicaria en el historial del cliente. La unicidad se
comprueba por el `Message-ID` de la cabecera RFC, que si es el mismo en ambos buzones —
**pero acotada SIEMPRE por `storeId`**, nunca global.

**Ese acotamiento no es una optimizacion, es la frontera de privacidad** (hallazgo H4 de
la ronda 2 del ciclo 2, y lo introdujo la propia v0.7). Sin el, dos tiendas distintas que
reciban el mismo correo —un proveedor comun, alguien que trabaja con las dos— compartirian
**un solo registro**: la segunda no lo guardaria por considerarlo duplicado y **veria el
de la otra**, con su `mailboxUserIds` dentro. La seccion 24 promete que "ningun usuario ve
nada de otra tienda", y una deduplicacion global la rompe **en silencio**, sin que ninguna
guarda de permisos se entere: el dato ya estaria compartido antes de que nadie pregunte
por el. La clave de unicidad es **(`storeId`, `Message-ID`)**, y dos tiendas pueden tener
cada una su copia del mismo correo — es lo correcto.
Si un correo llegara sin esa cabecera, se cae al identificador de Gmail y se acepta el
duplicado como caso degradado, en vez de descartar el email.

**Por que hace falta `mailboxUserIds` y no basta `userId`** (hallazgo H1 del ciclo 2).
La seccion 24 promete que **un vendedor ve siempre los emails de su propio buzon**. Con
un solo `userId` esa promesa se rompe en cuanto el mismo correo llega a dos buzones
conectados: el registro se guarda una vez, con **un** propietario, y el otro vendedor
—que tiene ese correo en su Gmail— deja de verlo en el CRM. Justo lo que la regla venia
a evitar.

Por eso el acceso **no cuelga de `userId`**, sino de la lista: ves un email si el cliente
es tuyo, si tienes rol de tienda entera, **o si tu buzon esta en `mailboxUserIds`**. La
lista crece cuando una segunda sincronizacion encuentra el mismo `Message-ID`: no
reescribe nada, **añade**. `userId` se queda solo como dato de procedencia — quien lo
aporto primero—, sin ningun poder sobre quien lo ve.

**Que pasa con `direction` y `userId` cuando el mismo correo llega a dos buzones**
(hallazgo H3 de la ronda 3): si se guardara el primero que llegue, esos dos campos
quedarian a merced de cual sincronice antes — y `direction` decide si el email cuenta
como actividad (seccion 21) y si la ficha lo pinta como enviado o recibido. **No puede
depender de una carrera.** La regla: el registro se guarda con el buzon **del remitente**
si ese buzon esta conectado (`direction: saliente`, `userId` = quien lo envio); si el
remitente no es ninguno de los buzones conectados, con el del **destinatario** que lo
recibio (`direction: entrante`). Si dos buzones conectados aparecen como destinatarios y
ninguno como remitente, gana el del dueño del cliente. La segunda sincronizacion que
encuentre el mismo `Message-ID` **no reescribe** esos campos — pero **si añade su buzon a
`mailboxUserIds`**, que es lo que hace que ese vendedor siga viendo su correo aunque no
haya ganado el desempate.

**Emparejamiento direccion ↔ contacto.** `customers.email` es `v.optional(v.string())`,
texto libre, y **no tiene indice**: la tabla tiene `by_owner`, `by_store` y —desde
AIT-80— `by_store_phone`, ninguno sobre el email. Buscar por direccion escanearia la
tabla entera en cada mensaje. Por tanto:
- **Indice nuevo `by_store_email`** por `storeId` + el propio campo `email`, **guardado
  ya en forma canonica** — no un campo derivado aparte (misma decision y por el mismo
  motivo que se tomo para el telefono: dos campos que hay que mantener a la par se
  desincronizan en silencio). El alta ya guarda el email con `trim` + `toLowerCase`, asi
  que **falta solo extender esa normalizacion** (cabecera `Nombre <a@b>`, etiqueta tras
  `+`) y aplicarla en los **dos** escritores que hoy existen: `createQuick` y
  `customers.update`.
  **Y hace falta migracion**, sin ambiguedad: un indice sobre un campo canonico no
  encuentra las filas que se guardaron antes de que existiera la normalizacion completa.
  **Hay precedente exacto y reciente**: AIT-80
  hizo justo esto para el telefono —campo guardado ya en forma canonica, indice
  `by_store_phone`, y una migracion de una pasada para las filas anteriores—, asi que el
  patron esta probado en este mismo repositorio y no hay que inventarlo. Lo que **si**
  hay que repetir es la migracion: un indice sobre un campo normalizado no encuentra las
  filas antiguas sin normalizar, y esas son justo los clientes veteranos.
- **Normalizacion antes de comparar — y "comparar" es la palabra que importa.** Lo que se
  normaliza es **la clave de busqueda**, nunca la direccion que se guarda (hallazgo H2 de
  la ronda 2 del ciclo 2; es un error que introdujo la v0.7 y que habria roto la mitad de
  la ola). Recortar la etiqueta posterior a `+` **corrompe la direccion real**:
  `cliente+crm@ejemplo.com` es valida, distinta, y guardarla mutilada la deja
  **inservible para escribir** — que es justo lo que promete la seccion 4.
  Por tanto: `customers.email` guarda **la direccion tal cual**, con `trim()` +
  `toLowerCase()`, que es lo que ya hace `createQuick` hoy (corrige lo que decian las
  versiones anteriores de este PRD, que daban esa normalizacion por inexistente). El
  emparejamiento compara **formas canonicas calculadas al vuelo en los dos lados**:
  quitando el nombre de la cabecera (`Nombre <a@b.com>` → `a@b.com`) y descartando la
  etiqueta tras `+`. El dominio no se normaliza mas alla de minusculas.
  **Consecuencia para el indice, y es la diferencia con el telefono**: no se puede indexar
  por una forma que no se guarda, asi que `by_store_email` va sobre el campo tal cual y el
  emparejamiento busca **tambien** la forma sin etiqueta. En el telefono el valor canonico
  SI es el que se guarda, porque normalizarlo no pierde nada; en el email si pierde.
- **Dos clientes de la misma tienda con la misma direccion**: el email se guarda **una
  sola vez**, asociado al cliente cuyo `ownerId` sea el dueño del buzon; si ninguno lo
  es o lo son varios, al de creacion mas antigua. La colision se registra para operacion
  (seccion 25).
  **Cuanto de esperable es, actualizado al 2026-09-08 por la tarde.** Cuando se escribio
  esta regla, `createQuick` insertaba **incondicionalmente** y no habia forma de editar
  un cliente, asi que el producto fabricaba duplicados solo. **Las dos cosas se
  arreglaron el mismo dia**: AIT-80 hace que el alta detecte por `by_store_phone` y avise
  antes de crear (devolviendo `status: "duplicate"`), y AIT-77 añadio `customers.update`.
  Ya no se fabrican duplicados nuevos por descuido.
  **La regla se queda igual**, y no por prudencia: el aviso de AIT-80 **es un aviso, no un
  bloqueo** —quien insiste puede crear el duplicado, porque dos personas pueden compartir
  telefono—, empareja por telefono y no por email, y las fichas duplicadas anteriores a
  hoy siguen ahi. Lo que cambia es la frecuencia esperada, no el caso.

**Entidad `gmailAccounts`** (nueva): usuario, **la direccion del buzon conectado** —sin
ella la regla de desempate de mas abajo no se puede evaluar: para saber si el remitente
de un correo es un buzon conectado hay que poder comparar su direccion con algo—, token
de refresco **cifrado**, fecha de conexion, marca de ultima sincronizacion, marca incremental de Gmail, datos del canal
push (identificador y **fecha de caducidad, para renovarlo**) y estado.

**Entidad `emailIntents`** (nueva) — **es la que hace construible la regla del contexto
del clic**. Sin ella, "la oportunidad que traia el clic" no tiene donde vivir: `emails`
se escribe cuando llega el aviso push, minutos despues del clic, y no puede guardar algo
que aun no habia pasado. Campos: `userId`, `customerId`, `opportunityId` **opcional**
(solo si el clic salio de una oportunidad), direccion de destino ya normalizada, fecha
del clic y estado (`pendiente` / `consumida` / `caducada`).

**Como se casa un email con una intencion** (sin esta regla, ni la regla 1 de abajo, ni
el criterio H8, ni la metrica §13.2 son verificables):
- Un email **saliente** consume la intencion `pendiente` **mas reciente** del mismo
  usuario cuya direccion de destino normalizada coincida con algun destinatario del
  email, y cuya fecha de clic sea **anterior** a la del email y esté dentro de una
  **ventana de 30 minutos**.
- **Dos clics seguidos al mismo cliente**: el email consume el mas reciente que cumpla
  lo anterior; el otro queda pendiente y caduca por su cuenta. Se elige el mas reciente
  porque es el que refleja la ultima intencion del vendedor.
- **Dos emails salientes al mismo cliente dentro de la ventana**: el primero consume la
  intencion; el segundo no encuentra ninguna pendiente y se trata como email sin
  contexto (regla 2 o 3).
- **Una intencion sin consumir caduca a los 30 minutos** y pasa a `caducada`. Nunca
  atribuye actividad por si sola: un clic no es un envio (seccion 23, "clic sin envio").

**Relacion con lo existente**: los emails cuelgan de `customers`; las oportunidades no
guardan referencia a emails — los resuelven por su cliente (vista derivada). La **tabla**
`interactions` no cambia de forma, pero **si cambian dos de sus mutations**, y hay que
decirlo:
- `interactions.create` **rechaza en servidor** el tipo `email` si quien la invoca tiene
  una cuenta de Gmail conectada. **Ojo al efecto que se pierde con ello** (hallazgo H10 de
  la ronda 2 del ciclo 2): esa mutation no solo registra la interaccion, tambien **cierra
  el proximo paso pendiente y crea el siguiente** con la accion y la fecha que escribe el
  usuario. Al bloquear esa via, el vendedor con Gmail conectado **pierde la forma de
  cerrar un proximo paso desde un email** — y los emails, por decision de la seccion 21,
  nunca crean `nextStep`. Hay que decidirlo explicitamente al planificar: o el registro
  manual sigue disponible **solo** para cerrar el proximo paso, o se acepta que eso se
  haga desde la propia oportunidad. Lo que no vale es que el hueco aparezca en uso (criterio "vias de registro que no se solapan",
  seccion 6). Ocultarlo solo en la interfaz contradiria la regla de la seccion 24 de
  aplicar las restricciones en el servidor.
- `interactions.remove` recalcula hoy `lastActivityAt` como el maximo entre creacion,
  cierre e interacciones restantes — **ignorando los emails**. Al existir emails que
  mueven esa marca, ese recalculo **pasa a incluirlos**; si no, borrar una interaccion
  podria devolver la marca por debajo de la fecha de un email ya registrado.
  **Ojo al detalle que decide cuanto trabajo es** (hallazgo H11 de la ronda 3): ese
  recalculo solo se dispara bajo la guarda `occurredAt === lastActivityAt`, o sea cuando
  se borra justo la interaccion que fijaba la marca. Con emails en juego esa guarda deja
  de ser suficiente, porque la marca puede venir de un email y no de una interaccion.

**Que hace y que NO hace un email con el seguimiento** (corrige el hallazgo H4 de la
review, que demostro que la version 0.1 describia una logica inexistente):

- **NUNCA crea un `nextStep`.** El codigo real exige que el usuario escriba la accion
  y la fecha del proximo paso; un email no aporta ninguna de las dos. Inventarlas
  seria meter basura en la lista de "Hoy" de Carlos.
- **Que pasa si a un vendedor le reasignan un cliente antiguo** (hallazgo H14 de la ronda
  2 del ciclo 2): su historico se bajo desde la oportunidad mas antigua a la que tenia
  acceso **en el momento de conectar**, asi que un cliente que le llega despues puede
  tener correspondencia anterior a esa fecha, y esos correos **no estan**. No se
  resincroniza el buzon entero por una reasignacion: se declara que **el historial de un
  cliente reasignado puede empezar mas tarde de lo que empezo la relacion**, y se muestra
  en la ficha ("el historial de correo empieza el <fecha>") en vez de dar a entender que
  esta completo. Reconstruirlo del todo es alcance de otra ola.
- **Solo cuentan los emails posteriores a la conexion de la cuenta.** La sincronizacion
  **historica** guarda el correo y lo muestra en el historial, pero **no toca el
  `lastActivityAt` de ninguna oportunidad** (decision de Aitor, 2026-09-08). El motivo
  es concreto: `lib/risk.ts` calcula el riesgo al vuelo desde esa marca, asi que dejar
  que el historico la moviera reescribiria de golpe —el mismo dia de la conexion— que
  oportunidades figuran como paradas en Hoy, Pipeline y Panel, sin que nadie lo haya
  pedido. El historial se enriquece; el estado de riesgo no se toca.
- **Un email SALIENTE posterior a la conexion actualiza `lastActivityAt`** de **una
  sola** oportunidad, elegida en este orden (decision de Aitor, 2026-09-08):
  1. **La oportunidad de la `emailIntent` que ese email consume**: si Carlos pulso
     "Escribir" o "Responder" estando dentro de una oportunidad, esa es. El CRM no
     adivina — usa lo que el vendedor ya le dijo al pulsar, persistido en `emailIntents`
     y casado con el email por la regla de arriba.
  2. **Si no hubo contexto** (el clic salio de la ficha del cliente) y el cliente tiene
     **exactamente una** oportunidad abierta, esa.
  3. **En cualquier otro caso, ninguna**: varias abiertas sin contexto, o un email
     escrito directamente en Gmail sin pasar por el CRM. No hay forma honesta de saber
     a cual pertenece, y la vista derivada existe justamente para no inventarlo.
  **Limite conocido y aceptado**: los emails que nacen fuera del CRM no llevan contexto,
  asi que con varias oportunidades abiertas siguen sin actualizar ninguna. Es el precio
  de no inventar atribuciones.
  **La marca nunca retrocede**: el valor que se escribe es el **maximo** entre el
  actual y la fecha del email, igual que hace hoy `convex/interactions.ts` a proposito
  (seccion 28). Sustituirlo sin mas devolveria el indicador de riesgo, que es
  precisamente el fallo que el proyecto ya corrigio dos veces.
- **Efecto colateral declarado: los avisos push de riesgo.** Mover `lastActivityAt`
  no solo cambia lo que se ve en Hoy, Pipeline y Panel: `lib/risk.ts` alimenta tambien
  las notificaciones Web Push de oportunidades en riesgo. Un email saliente puede, por
  tanto, **sacar una oportunidad de la lista de avisos** — que es el comportamiento
  correcto y buscado, pero conviene decirlo porque significa que esta ola toca un canal
  que ya llega al movil del vendedor, no solo pantallas (hallazgo H12 de la ronda 3).
  **Y hay una segunda marca que tocar, no solo `lastActivityAt`**: el envio de avisos se
  capa con `lastRiskPushSentAt` para no repetir la misma notificacion. Si una oportunidad
  sale de la lista de riesgo por un email y vuelve a entrar semanas despues, esa marca
  vieja puede **silenciar el aviso nuevo**. Al mover `lastActivityAt` por un email hay que
  decidir explicitamente que pasa con ella — lo mas probable es limpiarla, porque el ciclo
  de riesgo ha empezado de cero (hallazgo H13 de la ronda 2 del ciclo 2).
- **Un email ENTRANTE no actualiza nada.** Que el cliente escriba no significa que
  Carlos haya hecho seguimiento; marcar la oportunidad como activa la sacaria de la
  lista de riesgo justo cuando hay algo pendiente de atender. Es lo contrario de lo
  que el producto promete.

**Pensado para la ola siguiente**: cuerpo en texto plano + cliente + fecha + direccion
es exactamente el material que una IA necesita para analizar la relacion con un
cliente, sin migracion posterior.

## 22. Version 10-estrellas

La version absurda: el CRM lee todo el correo de todos los canales (email, WhatsApp,
LinkedIn), reconstruye la relacion completa con cada cliente desde el primer contacto,
redacta solo las respuestas con el tono de cada vendedor, avisa cuando una relacion se
enfria antes de que el vendedor lo note, y prepara el siguiente email antes de que se
lo pidan.

**Que sobrevive al recorte**: que la conversacion real este DENTRO del CRM y ligada al
cliente. Todo lo demas es la ola siguiente o mas alla — y todo depende de que esta ola
guarde bien los emails. Por eso la seccion 21 es la mas importante del documento.

## 23. Estados y errores

Estados de una cuenta conectada:

```text
  sin conectar ──consentimiento──> conectada ──sync ok──> conectada
                                       │
                                       ├─token caducado──> refresco automatico
                                       │                      │ falla
                                       ├─usuario revoca ──────┴──> revocada
                                       ├─canal push caducado ─────> degradada (solo sondeo)
                                       └─error de API repetido ───> error
  revocada | error ──reconexion──> conectada (reanuda sin duplicar)
  degradada ──renovacion del canal──> conectada
```

Errores y que ve el usuario:
- **Token revocado**: se muestra que el Gmail se ha desconectado, con boton de
  reconectar, y se avisa de que puede faltar correo reciente. **Nunca se borra lo ya
  sincronizado.**
- **Canal push caducado sin renovar**: el sistema sigue funcionando por sondeo
  periodico; la frescura baja de 60 s a 15 min. Se registra para operacion porque es
  un fallo silencioso para el usuario.
- **Cuota agotada**: la sincronizacion se pospone; el usuario ve frescura degradada,
  no un error.
- **Cliente sin email**: el boton de escribir **no se deshabilita** — abre un dialogo
  informativo explicando que ese cliente no tiene email registrado y ofreciendo
  añadirlo. Sigue el patron real de AIT-66 documentado en `docs/01-arquitectura.md`
  (*"un boton deshabilitado no comunica nada en tactil/teclado"*). **Corrige el error
  H2 de la review, que describia el patron al reves.**
- **Clic sin envio**: si el vendedor abre Gmail y cierra sin enviar, no llega aviso y
  no se registra nada. El CRM nunca da por enviado lo que no confirmo Gmail.
- **Borrado de un cliente con emails**: **los emails nunca bloquean el borrado**
  (decision de Aitor, 2026-09-08). Lo que si sigue bloqueando, **intacto**, es el
  patron de AIT-65: un cliente con oportunidades no se borra, tenga emails o no
  (`convex/customers.ts` lanza "tiene N oportunidad(es) asociada(s)"). Aitor lo
  confirmo al ver que ese bloqueo ya existia: los emails dejan de ser un motivo mas,
  pero la politica de borrado de ventas reales no se toca en esta ola.
  - Cuando el borrado si procede (cliente **sin** oportunidades), el CRM muestra antes
    un dialogo con el **numero real** de emails que se van con el ("estas a punto de
    borrar este cliente y los 200 emails relacionados"), nunca un texto generico.
  - Al confirmar, **los emails se borran en cascada** con el cliente. No contradice el
    "el historial sobrevive" de la seccion 24: alli lo que sobrevive es la desconexion
    del **buzon**, aqui desaparece el **cliente** entero, que es quien da sentido a esos
    correos. Sin cliente no hay historial que conservar, solo huerfanos.
  - **Consecuencia declarada**: como un cliente con cientos de emails casi siempre tiene
    oportunidades, este dialogo sera un **caso de esquina** en la practica, no el caso
    frecuente. Se deja escrito para que nadie lo lea como si levantara el bloqueo de
    AIT-65 (hallazgo H7 de la ronda 2).

## 24. Seguridad y privacidad

**Es la seccion que justifica el appetite completo.** Esta ola mete correo de personas
reales en la base de datos del CRM.

- **Frontera de datos**: solo se persiste correo cuyo remitente o destinatario
  coincida con el `email` de un contacto del CRM **de la misma tienda que el dueño del
  buzon**. Todo lo demas se descarta **antes** de escribirse. El criterio de la
  seccion 6 lo verifica con un "cero" observable que incluye el alcance por tienda.
- **Quien ve que — son TRES roles, no dos** (corrige el hallazgo H5 de la ronda 2, un
  error de hecho de las versiones anteriores). El sistema tiene `owner`, `storeManager`
  y `sales` (`convex/schema.ts`), y `convex/model/access.ts::isStoreWideRole` agrupa a
  los dos primeros:
  - un `sales` ve los emails de **sus** clientes (los de su `ownerId`), dentro de su
    tienda;
  - `owner` (Marta) y `storeManager` ven los de **todos** los clientes de su tienda, con
    contenido completo. `storeManager` es un rol real y asignable hoy desde Ajustes, no
    una hipotesis;
  - **un vendedor ve SIEMPRE los emails de su propio buzon**, y hay que decir **donde**,
    porque si no la regla no sirve de nada (hallazgo H1 de la ronda 2 del ciclo 2): la
    ficha de un cliente ajeno **sigue estando cerrada** para el, asi que un permiso sobre
    esos correos sin sitio donde ejercerlo es papel mojado.
    **Donde se ven, sin ampliar el alcance de esta ola**: en el **hilo** al que ya puede
    llegar desde Gmail, y en su propia pantalla de conexion, que muestra **cuantos**
    correos suyos hay emparejados con clientes que no son suyos, sin listar cuales ni de
    quien. Una **bandeja "mis correos"** dentro del CRM seria la superficie natural, y
    **queda declarada fuera de esta ola**: es pantalla nueva y alcance nuevo. Lo que esta
    ola garantiza es que **el dato no se pierde ni se le oculta** —`mailboxUserIds` lo
    conserva— para que esa bandeja sea barata el dia que se decida, en vez de exigir
    resincronizar.
    Sin esa aclaracion, el tercer disyuntivo del permiso solo se activaria sobre fichas a
    las que el vendedor no puede entrar, que es tanto como no existir. La regla es de
    **permiso**, no una promesa de pantalla, y asi se declara aqui (decision de Aitor, 2026-09-08, cerrando el hallazgo H10 de la ronda
    3). Sin esta regla, Carlos escribe a un cliente de Marta, el email se guarda —cumple
    el filtro de contacto y tienda— y **Carlos deja de ver su propia correspondencia**.
    El razonamiento es el mismo que el del aviso de duplicados: **ese correo ya es suyo**,
    lo escribio el y lo tiene abierto en su Gmail; ocultarselo en el CRM no protege nada
    y hace que el CRM parezca perder informacion. Lo que **no** gana con eso es acceso al
    cliente: sigue sin poder abrir su ficha, sus oportunidades ni el resto de su
    historial. Ve **su** conversacion, no **su** cliente;
  - ningun usuario ve nada de otra tienda.
  **Se aplica en el servidor**, en cada funcion de Convex, no ocultando en la interfaz.
  **Verificado por los dos lados el 2026-09-08**, y conviene decir como porque es la
  premisa sobre la que descansa toda la privacidad de esta ola: (a) en el codigo, la
  query `opportunities.getSummary` devuelve `null` cuando el `storeId` no coincide o
  cuando un rol no-tienda pide algo que no es suyo (se cita **por funcion y no por
  numero de linea**: este documento ya se quedo desfasado una vez porque el fichero se
  movio bajo una cita); (b) en la app publicada, un
  `sales` que entra **por URL directa** a un registro que demostrablemente existe recibe
  "Esta oportunidad ya no existe" — una pantalla no puede ocultar lo que la query nunca le
  entrego. Ademas `requireUser` corta el acceso de una cuenta desactivada en la siguiente
  llamada, incluidas las queries reactivas ya abiertas (leccion de AIT-52), y
  `requireStoreAccess` **falla cerrado** a la tienda propia si alguien olvida comprobar el
  rol. Es un modelo que ya aguanta peso real: la ola lo replica, no lo reinventa.
  El patron a replicar es el de las **lecturas** ya existentes —`requireUser` + filtro
  por `storeId` + `isStoreWideRole(user)` o `ownerId`, tal como hacen
  `customers.getFicha` e `interactions.listByCustomer`— y **no** `requireOwner`, que es
  la guarda de las mutations de borrado de AIT-65 y dejaria fuera a `sales`. El criterio
  de permisos de la seccion 6 cubre los tres roles.
- **Tokens**: el token de refresco se guarda cifrado y nunca se expone al cliente ni
  se registra en logs. Aplica la regla de `CLAUDE.md` sobre no volcar secretos.
- **Permisos pedidos a Google**: exactamente **uno**, `gmail.readonly`. Al delegar el
  envio en Gmail ya no hace falta `gmail.send`, y nunca se piden permisos de
  modificacion o borrado del buzon.
- **App Interna**: la exencion de CASA depende de que la app siga siendo Interna. Si
  algun dia se abre a terceros, esta seccion y la 12 se reabren ANTES, no despues.
- **Al desconectar la cuenta**: los tokens se borran siempre y el canal push se cierra,
  pero **los emails ya sincronizados se conservan** (decision de Aitor, 2026-09-08).
  El razonamiento es del producto, no tecnico: esos correos son parte del historial de
  la **oportunidad**, no del vendedor, y el historial de un cliente tiene que sobrevivir
  a la rotacion de vendedores. **Precio aceptado y declarado**: el CRM sigue guardando
  correo de una cuenta que retiro su consentimiento. Si algun dia hace falta una via de
  borrado a peticion, se abre esa decision entonces — aqui no se supone resuelta.

## 25. Operacion y despliegue

- **Variables de entorno nuevas** (cliente OAuth con permiso de Gmail, clave de
  cifrado de tokens, y configuracion de Pub/Sub): hay que darlas de alta en **todos
  los deployments de desarrollo y en el de produccion** — ver el aviso sobre
  documentacion desactualizada en la seccion 16. Leccion de la ola anterior: con
  Resend se descubrio deployment a deployment en vez de a la vez.
- **Infraestructura nueva**: un tema de Cloud Pub/Sub y su suscripcion apuntando al
  webhook del CRM. **No es** la primera dependencia externa del proyecto: ya estan
  Convex, Railway, Resend, **Google OAuth** (login de AIT-60) y **Web Push** (corrige el
  hallazgo H10 de la ronda 2).
- **Piezas que ya existen y hay que reutilizar, no crear** (seccion 28): `convex/crons.ts`
  ya tiene un cron horario desde AIT-57 —es donde va la renovacion del canal push— y
  `convex/http.ts` ya monta un `httpRouter`, que es donde entra el webhook de Pub/Sub.
- **Renovacion del canal push**: `users.watch` caduca. La tarea programada va en el cron
  que ya existe, y hace falta una alerta si falla — es un fallo silencioso.
- **Colisiones de direccion**: cuando dos clientes de la misma tienda comparten email
  (seccion 21), se registra el caso; casi siempre significa un cliente duplicado en el
  CRM y conviene revisarlo a mano.
- **Publicacion**: por push a `main`, como el resto del proyecto.
- **Idempotencia de la sincronizacion**: ejecutarla dos veces no puede duplicar
  emails. **Convex no tiene indices unicos ni restricciones de motor**, asi que la
  unicidad se comprueba **en codigo** antes de insertar, con el mismo patron de clave
  de peticion que el repositorio ya usa para oportunidades e interacciones (hallazgo
  H11 de la review).
- **Que monitorizar**: cuentas revocadas o en error, canales push proximos a caducar o
  ya caducados, antiguedad de la ultima sincronizacion por cuenta, y volumen
  almacenado frente al limite del plan.
- **Revertir**: desconectar las cuentas detiene la sincronizacion sin perder lo
  guardado; el resto del CRM sigue funcionando porque ninguna pantalla existente
  depende de los emails.

## 26. Presupuesto y costes

- **Google (Gmail API)**: 0 €. No se cobra por uso, y la via de app Interna evita la
  auditoria CASA — que era el coste real (cientos a miles de dolares anuales).
- **Google Cloud Pub/Sub**: coste nuevo, previsiblemente despreciable a este volumen
  (un puñado de mensajes por vendedor y dia, dentro de la capa gratuita). **NO
  VERIFICADO**: no se ha consultado el precio ni el limite gratuito vigente; se
  comprueba antes de la fase 3.
- **Convex**: el coste variable de la ola, y **el unico que queda abierto a proposito**.
  Depende del volumen de correo por vendedor, y por eso se guarda texto plano y no
  HTML. **NO VERIFICADO**: no hay medicion real del tamaño medio de un email en este
  contexto. Al quitarse el tope del historico (seccion 15, decision de Aitor
  2026-09-08), este coste ya **no tiene techo por diseño**: la fase 1 lo mide para
  saberlo, no para limitarlo.
- **Resend**: sin coste adicional — no se usa en esta ola. Queda como plan B.
- **Ahorro respecto a la version 0.1**: no construir editor de correo elimina el
  trabajo mas caro de la ola (adjuntos con su almacenamiento, copia, formato, firma,
  borradores) y un permiso restringido menos que justificar.
- **Coste de construccion**: no se estima aqui. El PRD define el QUE; el cuanto cuesta
  y cuando lo decide el reparto de la Directora.

## 27. Glosario

- **Scope restringido**: permiso de Google que da acceso a datos sensibles y obliga a
  evaluacion CASA. Los de lectura de Gmail lo son.
- **CASA** (*Cloud Application Security Assessment*): evaluacion de seguridad por un
  asesor homologado por Google, con revalidacion anual, exigida a las apps que piden
  permisos restringidos. Es lo que esta ola evita declarandose Interna.
- **App Interna**: aplicacion cuyo consentimiento solo pueden dar cuentas de la
  organizacion de Google Workspace propietaria del proyecto. Exenta de la revision.
- **Token de refresco**: credencial de larga duracion que permite al CRM pedir acceso
  a Gmail sin que el usuario vuelva a entrar. Es el secreto a proteger.
- **Marca incremental (`historyId`)**: referencia que Gmail da para pedir "solo lo que
  ha cambiado desde la ultima vez". Es lo que evita releer el buzon entero.
- **Canal push (`users.watch`)**: suscripcion que hace que Gmail avise cuando el buzon
  cambia, en vez de que el CRM pregunte. **Caduca y hay que renovarlo.**
- **Pub/Sub**: servicio de mensajeria de Google Cloud por el que viajan esos avisos
  hasta el webhook del CRM.
- **Hilo (`threadId`)**: identificador de conversacion en Gmail. Responder dentro del
  hilo es lo que hace que el cliente vea una conversacion y no correos sueltos.
- **Vista derivada**: mostrar en una oportunidad los emails de su cliente sin
  asignarlos a esa oportunidad. Evita decidir a que venta pertenece cada correo.
- **`lastActivityAt`**: campo de la oportunidad que marca cuando hubo actividad por
  ultima vez; es lo que hace que una oportunidad aparezca o no como parada.
- **Ola**: unidad de alcance de este proyecto. La 1 fue el MVP y el Post-MVP; esta es
  la 2; la 3 sera la IA sobre la relacion con el cliente.

## 28. As-is del codigo

Extraido del repositorio ANTES de la entrevista (regla del modo brownfield), con rutas
verificables. Nota de forma: en esta seccion los backticks se reservan para RUTAS de
fichero; los fragmentos literales de codigo van citados como bloque.

**Lo que ya existe y esta relacionado:**

- `convex/schema.ts` — la tabla de interacciones YA contempla el email como tipo de
  actividad manual:
  > type: v.union(v.literal("llamada"), v.literal("whatsapp"), v.literal("email"), v.literal("visita"))

  Pero es una **nota escrita a mano**, no un correo, y tiene tres restricciones que
  impiden reutilizarla:
  > opportunityId: v.id("opportunities")
  > customerId: v.id("customers")
  > authorId: v.id("users")
  > note: v.string()

  - Los identificadores de oportunidad y cliente son **obligatorios** — un email
    entrante llega a una persona y puede no tener oportunidad, o tener varias.
  - El autor debe ser un usuario del CRM; el de un email recibido es el cliente.
  - La nota es texto plano unico: sin asunto, cuerpo, direccion, hilo ni adjuntos.

- `convex/interactions.ts` — **el proximo paso NO es automatico** (verificado tras el
  hallazgo H4 de la review): la mutation exige como argumentos obligatorios
  > nextStepAction: v.string()
  > nextStepDueDate: v.number()

  escritos por el usuario, valida que no vengan vacios, cierra los pendientes e
  inserta uno nuevo con esos datos. Ademas actualiza por separado la marca de ultima
  actividad de la oportunidad. **Son dos mecanismos distintos**, y un email no puede
  aportar ni accion ni fecha — de ahi la regla acotada de la seccion 21.

- `convex/schema.ts` — el email del cliente es un campo **opcional**:
  > email: v.optional(v.string())

  **El emparejamiento depende de este campo, que hoy puede estar vacio.**

- `convex/auth.ts` — el login con Google existe desde AIT-60, pero el provider se usa
  **sin configuracion de scopes** (linea 234):
  > Google,

  Pide solo identidad (openid, email, profile). **No pide ningun permiso de Gmail y no
  guarda tokens de acceso ni de refresco**, y todo el intercambio vive dentro de la
  libreria de autenticacion. Tener login con Google NO acerca tecnicamente a leer
  Gmail: es un consentimiento distinto, con su propio almacenamiento de tokens, que
  hay que construir y pedir de nuevo a cada usuario.

- `convex/model/access.ts` — hay **dos** guardas distintas y el PRD hasta la v0.3 citaba
  la equivocada (hallazgo H5 de la ronda 2):
  > requireOwner(ctx)

  es la de las **mutations de borrado** de AIT-65, y dejaria fuera a `sales`. El patron
  que replica la seccion 24 para **leer** es el de `customers.getFicha` e
  `interactions.listByCustomer`: `requireUser` + filtro por `storeId` + `isStoreWideRole(user)`
  (que devuelve `owner || storeManager`) o comparacion con `ownerId`.

- `convex/schema.ts` — el sistema tiene **tres** roles, no dos:
  > role: v.union(v.literal("owner"), v.literal("storeManager"), v.literal("sales"))

  y `app/ajustes/page.tsx` permite asignar `storeManager` hoy. Cualquier modelo de
  permisos que solo contemple `owner` y `sales` esta incompleto.

- `convex/interactions.ts` — `lastActivityAt` **nunca retrocede**, y es deliberado:
  > lastActivityAt: Math.max(opportunity.lastActivityAt, args.occurredAt)

  `interactions.remove` recalcula ese mismo maximo sobre creacion, cierre e
  interacciones restantes — **hoy sin conocer los emails**. La seccion 21 dice que ese
  recalculo pasa a incluirlos.

- `convex/crons.ts` y `convex/http.ts` — **ya existen**: un cron horario (AIT-57) y un
  `httpRouter` montado. Son exactamente las dos piezas que esta ola necesita para
  renovar el canal push y para recibir el webhook de Pub/Sub; no hay que crearlas.

- **Lo que cambio el 2026-09-08 y este documento tuvo que corregir dos veces.** Cuatro
  tareas se publicaron mientras se escribia este PRD, y tres afirmaciones suyas sobre el
  codigo quedaron falsas por el camino. El estado a cierre de ese dia:
  - **`convex/customers.ts` ya expone `update`** (AIT-77): se puede editar un cliente,
    incluido su email. Este documento llego a decir lo contrario, y era cierto por la
    mañana.
  - **`createQuick` ya NO inserta incondicionalmente** (AIT-80): busca por
    `by_store_phone` y devuelve `status: "duplicate"` para que la interfaz avise. Sigue
    siendo un aviso y no un bloqueo.
  - **`customers` tiene un tercer indice, `by_store_phone`**, y el telefono se guarda ya
    en forma canonica, con `lib/phone.ts` y una migracion de una pasada. Es el precedente
    exacto del indice de email que pide la seccion 21.
  - **`convex/opportunities.ts` expone `createForCustomer`** (AIT-74): crea una
    oportunidad sobre un cliente existente, sin insertar en `customers`.

  **Leccion de forma, no de contenido:** este documento cita codigo que se mueve varias
  veces al dia. Las citas **por nombre de funcion** sobreviven; las citas **por numero de
  linea** no — ya se rompio una. De aqui en adelante se cita por funcion.

- `convex/customers.ts` — el borrado de un cliente **se bloquea** si tiene
  oportunidades. Su comentario razona que no hacen falta mas comprobaciones porque
  interacciones y recordatorios cuelgan de una oportunidad — **premisa que los emails
  rompen**, porque colgarian del cliente directamente. **El bloqueo por oportunidades se
  queda como esta** (seccion 23): lo unico que cambia es que al borrar un cliente que si
  procede borrar, sus emails se van en cascada con el.

- `docs/01-arquitectura.md` — el patron de la cabecera (AIT-66) establece que
  "+ Registrar interaccion" **nunca queda deshabilitado**, porque un boton
  deshabilitado no comunica nada en tactil ni con teclado: abre un dialogo informativo.
  Es el patron que sigue el caso "cliente sin email" de la seccion 23.

- `convex/ResendOTPPasswordReset.ts` — Resend ya esta integrado para enviar correo
  saliente (codigos de recuperacion), con sus variables de entorno ya dadas de alta.
  Existe infraestructura de envio, aunque esta ola no la use.

**Lo que NO existe hoy**: ninguna tabla de emails, ninguna conexion con la API de
Gmail, ningun almacenamiento de tokens de terceros, ninguna integracion con Pub/Sub,
ninguna tarea programada de renovacion, y ninguna pantalla que muestre correo.

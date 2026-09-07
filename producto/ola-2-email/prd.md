<!-- prd: estado=DRAFT version=0.2 supersedes=- appetite=completo -->

# PRD — SuperCRM Ola 2: Email de clientes dentro del CRM

| Campo | Valor |
|---|---|
| Estado | DRAFT |
| Version | 0.2 |
| Supersedes | — (sigue en DRAFT; 0.1 corregida, no superseded) |
| Appetite | completo |

> **Cambios de 0.1 → 0.2.** (a) Corregidos los 16 hallazgos de la review adversarial
> de la ronda 1 (media 6.4, DEVUELVE), incluidos tres errores de hecho sobre el propio
> codigo. (b) **Ya no se construye editor de correo**: escribir y responder abren
> Gmail con el contexto ya cargado (decision de Aitor, 2026-09-07). (c) **Aviso en
> tiempo real** con notificaciones push de Gmail en vez de esperar a la
> sincronizacion (peticion de Aitor). El as-is esta en la seccion 28; conviene leerlo
> antes que el resto.

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
- Historico acotado en la primera sincronizacion (el limite exacto es decision abierta
  del wayfinder; lo decidido es que HAY limite y esta en el rango de 6-12 meses).
- Visualizacion en la ficha del cliente y en cada oportunidad de ese cliente.
- Abrir Gmail desde el CRM con el destinatario cargado (escribir) o en el hilo
  (responder), sin construir editor.
- Aviso en tiempo real de lo enviado o recibido, via notificaciones push de Gmail.
- Marta ve el contenido completo, igual que el vendedor dueño del email.

**Se queda fuera a proposito** (ver seccion 7, con su alternativa cada uno): editor de
correo propio, correo que no sea de un contacto del CRM, creacion automatica de
contactos, adjuntos guardados en el CRM, analisis con IA (es la ola siguiente), y
cualquier proveedor de correo que no sea Gmail.

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
- PASA si: al registrarse un email **saliente** a un cliente que tiene **exactamente
  una** oportunidad abierta, el campo `lastActivityAt` de esa oportunidad pasa a ser la
  fecha del email, y la oportunidad deja de figurar en la lista de "en riesgo" si solo
  estaba ahi por inactividad.
- FALLA si: cambia `lastActivityAt` de una oportunidad cuando el cliente tiene dos o
  mas abiertas; si lo cambia un email **entrante**; o si se crea algun documento en
  `nextSteps` a raiz de un email.

**Vias de registro que no se solapan**
- PASA si: un usuario con la cuenta de Gmail conectada NO ve la opcion "email" al
  registrar una interaccion a mano; un usuario sin cuenta conectada SI la ve.
- FALLA si: un usuario con cuenta conectada puede registrar a mano una interaccion de
  tipo email, pudiendo asi duplicar un correo que el sistema ya sincroniza.

**Un solo registro por email**
- PASA si: tras enviar un email a un cliente, el historial lo muestra **una sola vez**
  y la tabla `interactions` no ha ganado ninguna fila.
- FALLA si: el mismo envio aparece dos veces, o se crea una interaccion ademas del
  registro del email.

**Permisos (transversal) — es el invariante de seguridad**
- PASA si: un usuario `sales` que invoque directamente la funcion de Convex que lee
  emails, pidiendo los de un cliente de otra tienda O los de un cliente de su tienda
  que no le pertenece, recibe un error y ningun dato.
- FALLA si: la restriccion vive solo en la interfaz y la funcion responde con datos.

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
2. **Ensanchar la lectura**: todos los contactos de la tienda, historico acotado, y
   sincronizacion incremental.
3. **Tiempo real**: canal push de Gmail (`users.watch` + Pub/Sub) y su renovacion, para
   que lo enviado o recibido aparezca en segundos.
4. **Salir a Gmail**: abrir Gmail con destinatario cargado (escribir) y en el hilo
   (responder), desde ficha de cliente y desde oportunidad.
5. **Ensanchar la vista y la actividad**: emails en las oportunidades del cliente
   (vista derivada), integrados en el historial cronologico, y el enganche de
   `lastActivityAt` acotado de H8.
6. **Operacion**: estados de error visibles (token revocado, canal push caducado,
   sincronizacion caida), reconexion, y la pantalla de estado completa.

Ninguna fase es "el modulo X entero": la 1 ya cruza todas las capas. La pantalla de
estado de la conexion aparece minima en la fase 1 y se completa en la 6, porque el
criterio de H1 la necesita desde el principio.

## 9. Riesgos y premisas

- **Premisa madre**: la exencion de app Interna evita la auditoria CASA para permisos
  restringidos. · **Como se verifica**: declarar la app como Interna en el proyecto de
  Google Cloud propiedad del Workspace, pedir `gmail.readonly` con una cuenta del
  dominio y comprobar que Google concede el consentimiento sin exigir revision.
  **Sostiene la ola entera**: si cae, se detiene y se reabre la decision pasando a la
  **alternativa A** (buzon de reenvio con Resend Inbound, seccion 12) — que es el plan
  B vivo. La alternativa C (CASA) esta descartada por Aitor y no vuelve.
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
  extrapolarlo al historico que se decida.
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

Se expresan en **absolutos**, no en porcentajes: hoy existe una sola cuenta `sales`
real, asi que cualquier porcentaje solo podria dar 0% o 100% (hallazgo H10 de la
review). Los plazos se cuentan desde la publicacion de la fase 4.

1. **Adopcion**: **todos** los vendedores activos tienen su Gmail conectado a los 14
   dias. Con la plantilla actual son 1-2 personas; el numero se revisa cuando el
   equipo crezca.
2. **Sustitucion real** (refuta la señal de muerte de §11.5): a los 14 dias, **la
   mayoria de los emails salientes a contactos del CRM se han iniciado desde el CRM**.
   Se mide comparando los clics registrados en "Escribir"/"Responder" con los emails
   salientes que devuelve la sincronizacion en la misma ventana temporal. Se declara
   la limitacion: un clic sin envio posterior no se puede distinguir de un envio
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
   canal push activo (mismo umbral que el criterio de H6).

## 14. Flujo principal

1. Carlos entra en la pantalla de conexion y pulsa "Conectar mi Gmail". Estado: sin
   token, sin emails.
2. Google le pide consentimiento de solo lectura. Al aceptar, el CRM guarda un token
   de refresco cifrado. Estado: conectado, sin sincronizar.
3. Primera sincronizacion: el CRM pide a Gmail los mensajes del periodo acordado y,
   por cada uno, comprueba si alguna direccion implicada coincide con el `email` de un
   contacto **de su tienda**. Lo que coincide se guarda; lo que no, se descarta sin
   escribirse. Estado: sincronizando, con progreso visible.
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
9. Como ese cliente tiene exactamente una oportunidad abierta, su `lastActivityAt`
   pasa a la fecha del email y deja de figurar como parada. Si tuviera dos, no se
   toca ninguna (seccion 21).
10. A partir de ahi todo llega solo, sin que Carlos vuelva a hacer nada.

## 15. Requisitos no funcionales

- **Latencia de lectura**: la ficha de un cliente con 200 emails carga en < 1 s.
  **Umbral NUEVO de esta ola** — no existe un umbral de rendimiento documentado en
  `docs/01-arquitectura.md` al que remitirse (hallazgo H12 de la review).
- **Frescura**: con el canal push activo, un email aparece en < 60 s sin recargar. Si
  el canal cae, la sincronizacion periodica garantiza < 15 min como suelo degradado.
- **Volumen**: soportar el historico que fije la decision abierta del wayfinder (rango
  6-12 meses) por vendedor sin degradar el resto de la aplicacion. **Provisional**: se
  cierra cuando se cierre esa decision (hallazgo H16 de la review).
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
- **El proyecto de Google Cloud que hoy sirve el login de AIT-60**: hay que
  identificarlo formalmente antes de la fase 1 — no esta registrado en `docs/`
  (hallazgo H14 de la review) — y comprobar si pertenece al Workspace o hay que
  moverlo o recrearlo.
- **API de Gmail**: cuotas por usuario y por proyecto; los tokens de refresco pueden
  ser revocados por el usuario o por el administrador del Workspace.
- **Google Cloud Pub/Sub**: dependencia NUEVA que esta ola introduce. El canal
  `users.watch` **caduca y hay que renovarlo periodicamente**; si no se renueva, se
  dejan de recibir avisos en silencio.
- **Convex**: almacenamiento y limites del plan actual. Las variables de entorno
  nuevas van en **todos los deployments de desarrollo y en el de produccion**
  (`stoic-impala-857`). **Aviso**: `docs/01-arquitectura.md` (ADR-004) describe un
  unico deployment de desarrollo compartido, pero en la ola anterior hubo que poner
  las credenciales de Resend tambien en deployments por terminal — la documentacion
  esta desactualizada y hay que confirmar el conjunto real antes de desplegar.
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
| Historico acotado en vez de todo o nada | taste | Sin historico la IA no puede analizar una relacion; con todo, la sincronizacion inicial y el coste son impredecibles | Aitor, 2026-09-07 |
| Marta ve el contenido completo de los emails de su tienda | taste | Es correspondencia comercial de la empresa, el filtro ya excluye lo personal, y es coherente con la supervision que ya tiene sobre el resto de interacciones | Aitor, 2026-09-07 |
| Un `sales` ve solo los emails de **sus** clientes | mechanical | Es exactamente el modelo de permisos que ya rige hoy ("solo sus propias oportunidades y clientes, dentro de su tienda"). No inventar un modelo distinto para el email | PM, 2026-09-07 |
| El email pertenece al **cliente**; las oportunidades lo muestran como vista derivada | mechanical | Unica respuesta que resuelve un cliente con varias oportunidades sin inventar una asignacion, y es lo que Aitor describio literalmente | PM, 2026-09-07 |
| Entidad `emails` propia en vez de reutilizar `interactions` | mechanical | `interactions` exige oportunidad obligatoria, autor que sea usuario del CRM y una nota de texto plano: un email recibido no cumple ninguna de las tres (seccion 28) | PM, 2026-09-07 |
| Un solo registro por email: no se crea interaccion espejo | mechanical | Dos registros del mismo hecho lo mostrarian dos veces en el historial | PM, 2026-09-07 |
| La interaccion manual de tipo email se oculta con Gmail conectado | taste | Con cuenta conectada es redundante y ofrecer las dos vias invita a duplicar. Se conserva para quien no tenga cuenta conectada | Aitor lo detecto, PM lo resolvio, 2026-09-07 |
| **Un email NUNCA crea un `nextStep`; solo un saliente puede tocar `lastActivityAt`** | mechanical | El codigo real exige accion y fecha escritas por el usuario para crear un proximo paso (seccion 28); un email no las aporta. Corrige el error H4 de la review | PM tras review, 2026-09-07 |
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
  extrapolar, para cerrar la decision abierta del historico con un numero.
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
- Actor: Carlos (sus clientes); Marta (todos los de su tienda).
- Disparador: abre la ficha del cliente o una de sus oportunidades.
- Flujo principal: el CRM muestra un historial cronologico unico que entremezcla
  interacciones manuales y emails.
- Postcondicion: ninguna (es lectura).

**CU4 — Escribir o responder saliendo a Gmail** (formaliza H4, H5, H6 y H8)
- Actor: Carlos.
- Precondicion: cuenta conectada; el cliente tiene email.
- Disparador: pulsa "Escribir email", o pulsa sobre un email recibido.
- Flujo principal: el CRM registra el clic (con cliente y, si lo hay, oportunidad en
  contexto) y abre Gmail —con destinatario cargado, o en el hilo— → Carlos escribe y
  envia en Gmail → Gmail avisa por push → el CRM guarda el email saliente → si el
  cliente tiene exactamente una oportunidad abierta, actualiza su `lastActivityAt`.
- Alternativos: Carlos cierra Gmail sin enviar → no llega aviso y **no se registra
  nada**; el clic queda como intento, no como actividad. El canal push esta caido →
  el email aparece en la siguiente sincronizacion periodica.
- Postcondicion: si se envio, el email esta registrado; si no, el CRM no miente.

**CU5 — Reconectar tras una caida** (formaliza la operacion, seccion 23)
- Actor: Carlos.
- Precondicion: el token fue revocado o caduco, o el canal push expiro sin renovarse.
- Disparador: el CRM detecta el fallo.
- Flujo principal: marca la conexion como caida y lo muestra → Carlos reconecta → se
  reanuda desde la ultima marca, sin duplicar lo ya sincronizado.
- Postcondicion: conexion restablecida y sin duplicados.

## 20. Diagrama actores-modulos

```text
   Carlos (sales)                      Marta (owner)
   ve los emails de SUS clientes       ve los de toda su tienda
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
cliente), `userId` (de que buzon vino), `storeId`, `direction` (entrante/saliente),
identificador de mensaje de Gmail (unico), identificador de hilo, remitente,
destinatarios, copia, asunto, cuerpo en texto plano, extracto, fecha e indicador de
adjuntos. Indices por cliente y por identificador de mensaje.

**Entidad `gmailAccounts`** (nueva): usuario, token de refresco **cifrado**, fecha de
conexion, marca de ultima sincronizacion, marca incremental de Gmail, datos del canal
push (identificador y **fecha de caducidad, para renovarlo**) y estado.

**Relacion con lo existente**: los emails cuelgan de `customers`; las oportunidades no
guardan referencia a emails — los resuelven por su cliente (vista derivada). La tabla
`interactions` no se modifica.

**Que hace y que NO hace un email con el seguimiento** (corrige el hallazgo H4 de la
review, que demostro que la version 0.1 describia una logica inexistente):

- **NUNCA crea un `nextStep`.** El codigo real exige que el usuario escriba la accion
  y la fecha del proximo paso; un email no aporta ninguna de las dos. Inventarlas
  seria meter basura en la lista de "Hoy" de Carlos.
- **Un email SALIENTE actualiza `lastActivityAt`** de la oportunidad **solo si el
  cliente tiene exactamente una oportunidad abierta**. Con dos o mas no se toca
  ninguna: no hay forma honesta de saber a cual pertenece, y la vista derivada
  (decision sellada) existe justamente para no inventarlo.
- **Un email ENTRANTE no actualiza nada.** Que el cliente escriba no significa que
  Carlos haya hecho seguimiento; marcar la oportunidad como activa la sacaria de la
  lista de riesgo justo cuando hay algo pendiente de atender. Es lo contrario de lo
  que el producto promete.
- Como atribuir la actividad cuando el cliente tiene varias oportunidades abiertas
  queda como **decision abierta en el wayfinder**, no resuelta aqui.

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
- **Borrado de un cliente con emails**: **decision abierta** en el wayfinder. El
  patron vigente (AIT-65) bloquea el borrado si hay hijos; los emails son hijos que
  esa decision no contemplaba. No se declara resuelto aqui ni en la seccion 24.

## 24. Seguridad y privacidad

**Es la seccion que justifica el appetite completo.** Esta ola mete correo de personas
reales en la base de datos del CRM.

- **Frontera de datos**: solo se persiste correo cuyo remitente o destinatario
  coincida con el `email` de un contacto del CRM **de la misma tienda que el dueño del
  buzon**. Todo lo demas se descarta **antes** de escribirse. El criterio de la
  seccion 6 lo verifica con un "cero" observable que incluye el alcance por tienda.
- **Quien ve que**: un `sales` ve los emails de **sus** clientes — el mismo modelo que
  ya rige hoy para oportunidades y clientes. Marta ve todos los de su tienda, con
  contenido completo. Ningun usuario ve nada de otra tienda. **Se aplica en el
  servidor**, en cada funcion de Convex, no solo ocultando en la interfaz — leccion
  directa de AIT-65, donde el permiso real vivia en `requireOwner(ctx)` y no en el
  boton. El criterio de permisos de la seccion 6 cubre los dos casos.
- **Tokens**: el token de refresco se guarda cifrado y nunca se expone al cliente ni
  se registra en logs. Aplica la regla de `CLAUDE.md` sobre no volcar secretos.
- **Permisos pedidos a Google**: exactamente **uno**, `gmail.readonly`. Al delegar el
  envio en Gmail ya no hace falta `gmail.send`, y nunca se piden permisos de
  modificacion o borrado del buzon.
- **App Interna**: la exencion de CASA depende de que la app siga siendo Interna. Si
  algun dia se abre a terceros, esta seccion y la 12 se reabren ANTES, no despues.
- **Al desconectar la cuenta**: los tokens se borran siempre y el canal push se cierra.
  Si se borran o no los emails ya sincronizados es **decision abierta** del wayfinder,
  no algo decidido aqui.

## 25. Operacion y despliegue

- **Variables de entorno nuevas** (cliente OAuth con permiso de Gmail, clave de
  cifrado de tokens, y configuracion de Pub/Sub): hay que darlas de alta en **todos
  los deployments de desarrollo y en el de produccion** — ver el aviso sobre
  documentacion desactualizada en la seccion 16. Leccion de la ola anterior: con
  Resend se descubrio deployment a deployment en vez de a la vez.
- **Infraestructura nueva**: un tema de Cloud Pub/Sub y su suscripcion apuntando al
  webhook del CRM. Es la primera dependencia de infraestructura externa del proyecto
  ademas de Convex, Railway y Resend.
- **Renovacion del canal push**: `users.watch` caduca. Hace falta una tarea programada
  que lo renueve antes de que expire, y una alerta si falla — es un fallo silencioso.
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
- **Convex**: el coste variable de la ola. Depende del volumen de correo por vendedor,
  y por eso se guarda texto plano y no HTML. **NO VERIFICADO**: no hay medicion real
  del tamaño medio de un email en este contexto; es la premisa que se mide en la fase
  1, antes de ensanchar el historico.
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

- `convex/model/access.ts` — la guarda de rol en **servidor** ya existe y es el patron
  a replicar para los permisos de la seccion 24:
  > requireOwner(ctx)

  Las funciones de borrado de AIT-65 la llaman dentro del handler, antes de tocar la
  base de datos.

- `convex/customers.ts` — el borrado de un cliente **se bloquea** si tiene
  oportunidades. Su comentario razona que no hacen falta mas comprobaciones porque
  interacciones y recordatorios cuelgan de una oportunidad — **premisa que los emails
  rompen**, porque colgarian del cliente directamente. De ahi la decision abierta del
  wayfinder.

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

<!-- prd: estado=DRAFT version=0.1 supersedes=- appetite=completo -->

# PRD — SuperCRM Ola 2: Email de clientes dentro del CRM

| Campo | Valor |
|---|---|
| Estado | DRAFT |
| Version | 0.1 |
| Supersedes | — |
| Appetite | completo |

> Nivel Completo: 27 secciones del superset + `## 28. As-is del codigo` (seccion del
> modo brownfield). Escrito con la skill `talent-prd`, modo brownfield: el as-is se
> extrajo del codigo ANTES de entrevistar, y la entrevista cubrio solo el delta.
> El PRD fundacional de SuperCRM (Notion, "CRM · PRD") sigue CERRADO y no se toca:
> este documento describe una ola nueva sobre el producto ya construido.

## 1. Resumen y pitch

Los vendedores de SuperCRM escriben a sus clientes por email desde Gmail, en otra
ventana, y el CRM no se entera: el historial del cliente queda incompleto o se
rellena a mano. Esta ola mete el email dentro del CRM — los correos con clientes
conocidos se sincronizan y se leen en la ficha del cliente y en sus oportunidades, y
se puede escribir y responder sin salir de la aplicacion.

El objetivo de negocio no cambia (que ninguna venta se pierda por falta de
seguimiento): un seguimiento cuya conversacion real vive fuera del CRM es un
seguimiento a medias. Ademas, esta ola es el cimiento de la ola siguiente, en la que
una IA leera esos emails para analizar la relacion con cada cliente.

El as-is del codigo esta en la seccion 28; conviene leerlo antes que el resto.

## 2. Problema y persona

**Carlos** (vendedor, `sales`) es la persona. Es la misma del PRD fundacional: vive
en el movil, odia el trabajo administrativo y evita cualquier herramienta que le
haga meter datos que no aportan.

**Que hace HOY** (respuesta literal de Aitor, 2026-09-07): escribe a sus clientes
desde Gmail en otra ventana, o desde otro cliente de correo donde tiene configurada
esa misma cuenta de Gmail. El CRM no participa. Si quiere que quede constancia,
abre el CRM y escribe a mano una interaccion de tipo `email` con una nota — que es
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

Escribir y responder desde el CRM entra tambien en esta ola, pero la primera muesca
es la lectura: es lo que convierte la ficha del cliente en un sitio donde de verdad
esta todo, sin pedirle a Carlos que cambie su forma de trabajar.

**Por que ahora y no hace dos años**: (a) el producto esta terminado — las 46 issues
del MVP y las 21 de Post-MVP estan cerradas, y esta es la primera ola de alcance
genuinamente nuevo; (b) la ola siguiente pone una IA a analizar la relacion con el
cliente, y sin el email no tiene materia prima; (c) el CRM ya tiene login con Google
operativo (AIT-60), que aunque NO da acceso a Gmail (ver seccion 28), sí significa
que la infraestructura de OAuth con Google ya esta montada y probada.

## 4. Alcance del appetite

Appetite **completo** (decidido por Aitor antes de escribir, 2026-09-07): esta ola
es un proyecto en si mismo, no una feature mas. Lo justifican tres cosas que aqui no
son ceremonia: leer correo ajeno obliga a la seccion de seguridad y privacidad (24);
una sincronizacion continua con tokens que caducan obliga a estados y errores (23) y
a operacion (25); y como esta ola es el cimiento de la IA de la siguiente, el modelo
de entidades (21) decide si esa ola se construye o se rehace.

**Entra:**
- Conexion de la cuenta de Gmail de cada usuario, con consentimiento explicito.
- Sincronizacion de emails **solo con direcciones que ya son contactos del CRM**.
- Historico acotado en la primera sincronizacion (6-12 meses; el limite exacto es
  decision del wayfinder, lo que esta decidido es que HAY limite).
- Visualizacion en la ficha del cliente y en cada oportunidad de ese cliente.
- Escribir un email nuevo a un contacto desde el CRM.
- Responder a un email recibido desde el CRM.
- Marta ve el contenido completo, igual que el vendedor dueño del email.

**Se queda fuera a proposito** (ver no-gos, seccion 7, con su alternativa cada uno):
todo el correo que no sea de un contacto del CRM, la creacion automatica de
contactos, los adjuntos en la primera fase, el analisis con IA (es la ola siguiente),
y cualquier proveedor de correo que no sea Gmail.

**Modo de alcance elegido**: alternativa B (ver seccion 12).

## 5. Historias de usuario

- **H1** — Como Carlos, quiero conectar mi cuenta de Gmail al CRM una sola vez, para
  que a partir de ahi el CRM vea mis correos con clientes sin que yo haga nada mas.
- **H2** — Como Carlos, quiero abrir la ficha de un cliente y ver ahi los emails que
  he intercambiado con el, para saber por donde va la conversacion antes de llamarle.
- **H3** — Como Carlos, quiero ver en una oportunidad los emails de su cliente, para
  no tener que salir al cliente y volver mientras trabajo esa venta.
- **H4** — Como Carlos, quiero escribir un email a un cliente desde el CRM, para no
  cambiar de ventana ni tener que anotar despues lo que escribi.
- **H5** — Como Carlos, quiero responder desde el CRM a un email que me ha llegado,
  para cerrar el ciclo sin salir de la oportunidad.
- **H6** — Como Marta, quiero ver los emails de las conversaciones de mi equipo con
  clientes, para supervisar el seguimiento sin preguntar caso por caso.
- **H7** — Como Carlos, quiero que un email que envio o recibo dentro de una
  oportunidad actualice su proximo paso igual que lo hace una interaccion manual,
  para que el CRM siga diciendome que tengo que hacer hoy.

H7 no es un extra: sin ella, la ola rompe la promesa central del producto (ver
seccion 21).

## 6. Criterios de aceptacion

**Conexion de la cuenta (H1)**
- PASA si: un usuario `sales` completa el flujo de consentimiento de Google y, al
  volver al CRM, la pantalla de Ajustes muestra su cuenta de Gmail como conectada
  con la fecha de conexion.
- FALLA si: tras completar el consentimiento, el CRM no muestra la cuenta conectada,
  o la muestra conectada sin haber obtenido un token de refresco utilizable.

**Filtro de contactos (H2, y es el criterio de privacidad)**
- PASA si: tras una sincronizacion, la base de datos contiene emails cuyas
  direcciones (remitente o destinatario) coinciden con el campo `email` de algun
  documento de `customers`, y **cero** emails cuyas direcciones no coincidan con
  ninguno.
- FALLA si: existe en la base de datos al menos un email cuyo remitente y
  destinatarios no correspondan a ningun contacto del CRM.

**Ficha de cliente (H2)**
- PASA si: al abrir la ficha de un cliente con emails sincronizados, se ven en orden
  cronologico junto a las interacciones manuales, cada uno con remitente, fecha,
  asunto y direccion (enviado/recibido) visibles sin abrirlo.
- FALLA si: los emails aparecen en una lista separada del historial de
  interacciones, o no se distingue de un vistazo si el email fue enviado o recibido.

**Oportunidades (H3)**
- PASA si: una oportunidad de un cliente con emails muestra esos mismos emails, sin
  que nadie los haya asignado a mano a esa oportunidad.
- FALLA si: un cliente con dos oportunidades abiertas obliga a elegir a cual
  pertenece cada email, o los muestra en una sola de ellas.

**Enviar (H4)**
- PASA si: Carlos escribe un email desde la ficha de un cliente, y el correo aparece
  en la carpeta Enviados de su propia cuenta de Gmail con su direccion como
  remitente.
- FALLA si: el correo sale desde una direccion que no es la de Carlos, o no queda
  registrado en su cuenta de Gmail.

**Responder (H5)**
- PASA si: la respuesta enviada desde el CRM llega al cliente dentro del mismo hilo
  de conversacion del email original (mismo `threadId` en Gmail).
- FALLA si: la respuesta llega como un correo suelto, fuera del hilo.

**Supervision (H6)**
- PASA si: Marta abre la ficha de un cliente de Carlos y ve los mismos emails con el
  mismo contenido que ve Carlos.
- FALLA si: Marta ve menos emails o contenido recortado respecto a lo que ve Carlos.

**Proximo paso (H7)**
- PASA si: enviar o recibir un email asociado a una oportunidad actualiza su proximo
  paso siguiendo exactamente la misma logica que una interaccion manual de tipo
  `email`.
- FALLA si: una oportunidad con emails recientes sigue mostrando un proximo paso
  vencido que la actividad por email deberia haber actualizado.

**Un solo registro por email (no hay dos tipos de email)**
- PASA si: tras enviar un email desde el CRM dentro de una oportunidad, el historial
  de esa oportunidad muestra ese envio **una sola vez**, y la tabla `interactions` no
  ha ganado ninguna fila nueva.
- FALLA si: el mismo envio aparece dos veces en el historial, o se crea una
  interaccion de tipo `email` ademas del registro en `emails`.

**Vias de registro que no se solapan**
- PASA si: un usuario con la cuenta de Gmail conectada NO ve la opcion "email" al
  registrar una interaccion a mano; un usuario sin cuenta conectada SI la ve.
- FALLA si: un usuario con cuenta conectada puede registrar a mano una interaccion de
  tipo `email`, pudiendo asi duplicar un correo que el sistema ya sincroniza.

**Permisos (transversal, y es el invariante de seguridad)**
- PASA si: un usuario `sales` que invoque directamente la funcion de Convex que lee
  los emails de un cliente de OTRA tienda recibe un error, sin datos.
- FALLA si: la restriccion vive solo en la interfaz y la funcion responde con datos.

## 7. No-gos

- **NO** sincronizaremos el correo que no sea de contactos del CRM; **en su lugar**,
  el filtro por direccion se aplica ANTES de guardar nada, y lo que no coincide se
  descarta sin persistirse (verificable con el criterio de la seccion 6).
- **NO** crearemos contactos automaticamente al recibir un email de un desconocido;
  **en su lugar**, el alta de clientes sigue siendo un acto explicito de Carlos o
  Marta, como hoy.
- **NO** guardaremos adjuntos en esta ola; **en su lugar**, se indica en el email que
  tenia adjuntos y se ofrece un enlace para abrirlo en Gmail.
- **NO** soportaremos proveedores de correo distintos de Gmail; **en su lugar**, el
  CRM sigue permitiendo registrar una interaccion de tipo `email` a mano, como hoy,
  para quien no use Gmail.
- **NO** analizaremos el contenido con IA en esta ola; **en su lugar**, el modelo de
  datos (seccion 21) se diseña para que la ola siguiente pueda hacerlo sin migracion.
- **NO** publicaremos esta app como producto para otros negocios mientras el email
  este dentro; **en su lugar**, la app se declara Interna del Workspace de
  `talent-network.org`, que es lo que evita la auditoria CASA (ver seccion 24).

## 8. Fases walking-skeleton

1. **Esqueleto (el recorrido entero, feo pero completo)**: Carlos conecta su Gmail;
   el CRM baja los emails de **un solo contacto conocido**, de los ultimos dias, sin
   interfaz bonita; se ven en la ficha de ese cliente. Punta a punta: consentimiento
   → token → llamada a Gmail → filtro → guardado → pantalla.
2. **Ensanchar la lectura**: todos los contactos del CRM, historico acotado, y
   sincronizacion incremental continua en vez de una sola pasada.
3. **Ensanchar la vista**: los mismos emails en las oportunidades del cliente
   (vista derivada), integrados en el historial cronologico junto a las
   interacciones manuales.
4. **Escribir**: redactar y enviar un email nuevo desde el CRM, con `gmail.send`.
5. **Responder**: responder dentro del hilo, y el enganche con el proximo paso (H7).
6. **Operacion**: estados de error visibles (token caducado, sincronizacion caida),
   reconexion, y la pantalla de Ajustes con el estado de la conexion.

Ninguna fase es "el modulo X entero": la 1 ya cruza todas las capas.

## 9. Riesgos y premisas

- **Premisa**: la exencion de app Interna evita la auditoria CASA para permisos
  restringidos. · **Como se verifica**: declarar la app como Interna en el proyecto
  de Google Cloud propiedad del Workspace, pedir `gmail.readonly` con una cuenta del
  dominio y comprobar que Google concede el consentimiento sin exigir revision.
  **Es la premisa que sostiene la ola entera**: si cae, la ola se detiene y se
  reabre la decision (ver seccion 12, alternativa C).
- **Premisa**: los contactos del CRM tienen email. · **Como se verifica**: contar
  cuantos documentos de `customers` tienen el campo `email` relleno. Hoy es
  `v.optional` (seccion 28) y la base de produccion esta practicamente vacia. Si la
  mayoria no tiene email, no hay con que emparejar y el valor de la ola cae.
- **Premisa**: el volumen de correo por vendedor cabe en el plan de Convex sin
  disparar el coste. · **Como se verifica**: medir el tamaño medio de un email de
  negocio y multiplicarlo por el volumen de 12 meses de un vendedor real.
- **Premisa**: el reenganche del proximo paso (H7) no genera ruido. · **Como se
  verifica**: un email entrante automatico (una respuesta de "fuera de la oficina")
  no deberia reabrir el proximo paso de una oportunidad. Se prueba con casos reales
  antes de activarlo.
- **Riesgo aceptado**: la app deja de ser vendible a terceros mientras el email este
  dentro. Aitor lo acepto explicitamente al elegir la via Interna.
- **Riesgo aceptado**: si un vendedor revoca el permiso desde su cuenta de Google, el
  CRM deja de sincronizar hasta que reconecte. Se cubre mostrandolo (seccion 23), no
  evitandolo.

## 10. Landscape

Busqueda hecha el **2026-09-07** con herramientas propias (la memoria del asistente
esta caducada por definicion; esto es un snapshot con fecha).

**Politica de Google — el condicionante principal:**
- Los permisos de lectura de Gmail son **restringidos**: `gmail.readonly`,
  `gmail.metadata`, `gmail.modify`, `gmail.compose`, `gmail.insert`,
  `gmail.settings.*` y `https://mail.google.com/`
  ([lista oficial de scopes restringidos](https://support.google.com/cloud/answer/13464325)).
  Pedir cualquiera de ellos obliga a una evaluacion de seguridad CASA por un asesor
  homologado por Google, **con revalidacion anual**
  ([verificacion de scopes restringidos](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification)).
  Coste de cientos a miles de dolares al año y 6-12 semanas el primer ciclo.
- **`gmail.send` NO figura en la lista de restringidos**: enviar es sensible, no
  restringido, y no dispara CASA. Es una asimetria decisiva para esta ola.
- **Exencion aplicable**: para apps **Internas** de una organizacion de Google
  Workspace, el uso de permisos restringidos o sensibles no requiere revision
  adicional de Google
  ([consideraciones para Workspace](https://developers.google.com/identity/protocols/oauth2/production-readiness/google-workspace)).
  Esta es la via elegida.

**Como resuelven esto otros CRM** (Salesforce, HubSpot, Pipedrive): ofrecen dos
caminos — conexion directa del buzon por OAuth, y un **buzon de reenvio** (una
direccion propia a la que el vendedor reenvia o pone en copia oculta) que no
requiere ningun permiso del proveedor de correo. El segundo camino se evaluo aqui
(alternativa A, seccion 12) y se descarto por no traer historico y por depender de
que el vendedor configure una regla.

**Infraestructura ya disponible en el proyecto**: Resend, ya integrado para el envio
de codigos de recuperacion, soporta ademas correo **entrante** por webhook
([Resend Inbound](https://resend.com/features/inbound)). No se usa en esta ola por
la decision de arriba, pero queda anotado como alternativa viva si la premisa de la
seccion 9 cae.

## 11. Interrogatorio sellado

1. **¿Quien lo necesita tanto que lo usaria aunque estuviera roto?** Carlos, el
   vendedor. Confirmado contra el PRD fundacional, no preguntado.
2. **¿Que hace HOY sin el producto?** Escribe desde Gmail en otra ventana, o desde
   otro cliente de correo con esa misma cuenta de Gmail configurada. El CRM no se
   entera, y si quiere constancia escribe una nota a mano.
3. **¿Por que ahora y no hace dos años?** El producto esta terminado (67 issues
   cerradas, cero backlog); la ola siguiente pone una IA que necesita el email como
   materia prima; y la infraestructura OAuth con Google ya esta montada (AIT-60).
4. **¿Cual es el wedge?** Leer: que los emails que ya existen aparezcan solos en la
   ficha del cliente. Escribir entra en la ola, pero la primera muesca es leer.
5. **¿Como sabras en 2 semanas que NO funciona?** Si Carlos sigue abriendo Gmail en
   otra pestaña para escribir a un cliente. Propuesto por el PM, no corregido por
   Aitor.
6. **¿Que tendria que ser cierto para matar la idea?** Que leer Gmail exigiera una
   auditoria de seguridad inasumible. **Se demostro cierto para el caso general**
   (CASA, anual y de pago) y la idea estuvo a punto de morir: se salvo por la
   exencion de app Interna, al precio de renunciar a vender el producto a terceros.
   La licencia para matar se activo y se resolvio con un cambio de premisa, no
   ignorandola.

## 12. Alternativas A B C

- **A (minimo defendible) — Buzon de reenvio**: el CRM da una direccion propia; el
  vendedor reenvia o pone en copia oculta; se ingiere con Resend Inbound. Cero
  permisos de Google, cero auditoria, funciona con cualquier proveedor de correo y
  mantiene SuperCRM vendible a terceros. **Descartada** por dos motivos: no trae
  historico (y la ola de IA lo necesita) y depende de que el vendedor configure y
  recuerde una regla — exactamente el tipo de friccion que Carlos abandona.
- **B (equilibrio) — Gmail API con app Interna**: `gmail.readonly` + `gmail.send`
  contra el Workspace de `talent-network.org`. Automatico, con historico, sin
  auditoria. **ELEGIDA.** Gana porque entrega el wedge sin friccion para Carlos y sin
  coste ni plazo de auditoria; se paga con dejar de ser producto para terceros
  mientras el email este dentro, coste que Aitor acepto explicitamente.
- **C (ambicioso) — Gmail API como app Externa con CASA**: mantiene SuperCRM como
  producto para muchos negocios. **Descartada por Aitor** ("eso de la auditoria es
  inviable"): auditoria anual de pago, 6-12 semanas de plazo, y aun asi dejaria
  fuera a los negocios con Gmail personal sin Workspace.

Una cuarta via —automatizar Gmail por navegador— se planteo y se descarta
explicitamente: viola los terminos de servicio de Google, es fragil, y obligaria a
guardar la sesion completa del usuario, lo que da acceso a TODO el buzon sin limite
de permisos. Seria peor para la privacidad que la API, no mejor.

## 13. Metricas de exito

1. **Adopcion**: ≥ 80% de los vendedores activos tienen su Gmail conectado a los 14
   dias de publicar la fase 4. Se mide contando cuentas conectadas sobre usuarios
   `sales` activos.
2. **Sustitucion real** (es la metrica que refuta la señal de muerte): ≥ 50% de los
   emails a clientes salen desde el CRM y no desde Gmail, a los 30 dias. Se mide
   comparando emails enviados por el CRM contra el total de emails salientes a
   contactos del CRM que devuelve la sincronizacion.
3. **Completitud del historial**: ≥ 90% de los clientes con email relleno tienen al
   menos un email sincronizado a los 7 dias de la primera sincronizacion.
4. **Higiene del filtro**: exactamente **0** emails almacenados que no correspondan
   a un contacto del CRM, medido en cualquier momento. No es un objetivo: es una
   condicion de la seccion 24.

## 14. Flujo principal

El recorrido que justifica la ola, punta a punta:

1. Carlos entra en Ajustes y pulsa "Conectar mi Gmail". Estado del sistema: sin
   token, sin emails.
2. Google le pide consentimiento para leer y enviar correo. Al aceptar, el CRM
   guarda un token de refresco cifrado asociado a su usuario. Estado: conectado, sin
   sincronizar.
3. El CRM lanza la primera sincronizacion: pide a Gmail los mensajes del periodo
   acordado, y por cada uno comprueba si alguna direccion implicada coincide con el
   `email` de un contacto de su tienda. Lo que coincide se guarda; lo que no, se
   descarta sin escribirse. Estado: sincronizando, con progreso visible.
4. Carlos abre la ficha de un cliente. Ve el historial cronologico unico: sus
   interacciones manuales de siempre y, entremezclados por fecha, los emails, cada
   uno con remitente, asunto, fecha y si fue enviado o recibido. Estado: sincronizado.
5. Carlos abre una oportunidad de ese cliente. Ve los mismos emails, sin haber
   asignado nada: la oportunidad muestra los emails de su cliente.
6. Carlos pulsa "Responder" sobre un email recibido. Escribe y envia. El CRM manda el
   correo por la cuenta de Gmail de Carlos, dentro del hilo original. Estado: email
   saliente registrado.
7. Ese envio, al estar dentro de una oportunidad, actualiza su proximo paso igual que
   una interaccion manual. Estado: la oportunidad ya no aparece como parada.
8. A partir de ahi, la sincronizacion incremental trae los nuevos correos solos, sin
   que Carlos vuelva a hacer nada.

## 15. Requisitos no funcionales

- **Latencia de lectura**: la ficha de un cliente con 200 emails carga en < 1 s
  (mismo umbral que hoy tienen las pantallas del CRM).
- **Frescura**: un email recibido aparece en el CRM en < 15 minutos sin que el
  usuario recargue. La sincronizacion es incremental, no una recarga completa.
- **Volumen**: soportar 12 meses de correo por vendedor sin degradar el resto de la
  aplicacion.
- **Almacenamiento**: se guarda el cuerpo en texto plano, no el HTML completo del
  correo — suficiente para leerlo y para que la IA de la ola siguiente lo analice, y
  varias veces mas barato.
- **Cuotas de Gmail**: la sincronizacion respeta los limites de la API con reintentos
  con espera creciente; agotar la cuota degrada la frescura, nunca pierde correos.
- **Idioma**: interfaz en español, como el resto del CRM.
- **Movil**: la vista de email cumple el minimo de 44px de objetivo tactil, ya
  auditado en las issues AIT-68 a AIT-72.

## 16. Dependencias y limites

- **Google Workspace de `talent-network.org`**: la exencion de app Interna depende de
  que el proyecto de Google Cloud pertenezca a esa organizacion. Si el proyecto
  `supercrm-506513` no es propiedad del Workspace, hay que moverlo o recrearlo.
- **API de Gmail**: cuotas por usuario y por proyecto; los tokens de refresco pueden
  ser revocados por el usuario o por el administrador del Workspace en cualquier
  momento.
- **Convex**: almacenamiento y limites del plan actual; los tres deployments de
  desarrollo mas produccion necesitan las mismas variables de entorno (leccion de la
  ola anterior con Resend).
- **El campo `email` de `customers`**: es opcional hoy. Sin el relleno no hay
  emparejamiento posible — es el limite mas duro y el mas barato de comprobar.
- **Lo que puede pararlo**: que Google deniegue la exencion de app Interna; que el
  administrador del Workspace bloquee la app; que el volumen de correo dispare el
  coste de Convex por encima de lo aceptable.

## 17. Decisiones clasificadas

| Decision | Clase | Porque | Quien |
|---|---|---|---|
| App **Interna** del Workspace en vez de externa con CASA | challenge | Cuestiona una premisa del PRD fundacional ("CRM para pequeños negocios" = producto para muchos). No se decidio en silencio: se escalo con la evidencia de coste y plazo | Aitor, 2026-09-07 |
| Persistir los emails en el CRM en vez de leerlos en vivo | taste | La ola siguiente pone una IA a analizar la relacion; leer en vivo obligaria a rehacerlo. Es la unica decision de esta ola que se toma mirando a la siguiente, y se declara como tal | PM, 2026-09-07 |
| Historico acotado (6-12 meses) en vez de todo o nada | taste | Sin historico la IA no puede analizar una relacion; con todo el historico la sincronizacion inicial y el coste son impredecibles | Aitor, 2026-09-07 |
| Marta ve el contenido completo de los emails del equipo | taste | Es correspondencia comercial de la empresa, el filtro ya excluye lo personal, y es coherente con la supervision que ya tiene hoy sobre el resto de interacciones | Aitor, 2026-09-07 |
| El email pertenece al **cliente**; las oportunidades lo muestran como vista derivada | mechanical | Es la unica respuesta que resuelve un cliente con varias oportunidades abiertas sin inventar una asignacion. Ademas es lo que Aitor describio literalmente | PM, 2026-09-07 |
| Enviar desde la cuenta de Gmail del propio vendedor | mechanical | Cualquier remitente de sistema rompe el hilo y confunde al cliente; ademas asi el envio queda en su carpeta Enviados | PM, 2026-09-07 |
| Entidad `emails` propia en vez de reutilizar `interactions` | mechanical | `interactions` exige oportunidad obligatoria, autor que sea usuario del CRM y una nota de texto plano: un email recibido no cumple ninguna de las tres (ver seccion 28) | PM, 2026-09-07 |
| No automatizar Gmail por navegador | mechanical | Viola los terminos de servicio, es fragil y da acceso a todo el buzon sin limite de permisos: peor para la privacidad que la API | PM, 2026-09-07 |
| Descartar el buzon de reenvio (alternativa A) | taste | No trae historico y depende de una regla que el vendedor debe configurar y recordar. Queda como plan B vivo si cae la premisa de la seccion 9 | PM, 2026-09-07 |
| **Un solo registro por email: enviar desde el CRM NO crea ademas una interaccion espejo** | mechanical | Dos registros del mismo hecho harian que el historial lo muestre dos veces. Lo que se comparte con `interactions` es la logica del proximo paso, no el registro | PM, 2026-09-07 |
| **La interaccion manual de tipo `email` se oculta cuando el usuario tiene Gmail conectado** | taste | Con cuenta conectada es redundante (lo que escriba dentro o fuera del CRM se registra solo) y ofrecer las dos vias invita a registrar el mismo email dos veces. Se conserva solo para usuarios sin cuenta conectada | Aitor lo detecto, PM lo resolvio, 2026-09-07 |

## 18. Plan de validacion

- **Antes de escribir una linea de codigo**: declarar la app como Interna en Google
  Cloud y completar un consentimiento real con `gmail.readonly` desde una cuenta
  `@talent-network.org`. Es un experimento de horas que valida o tumba la premisa
  que sostiene la ola entera. **Bloquea todo lo demas.**
- **Antes de la fase 2**: contar cuantos `customers` tienen `email` relleno. Si son
  pocos, la fase siguiente no es sincronizar mas: es conseguir que los contactos
  tengan email.
- **Durante la fase 1**: medir el tamaño real de los emails sincronizados de un
  vendedor y extrapolar a 12 meses, para validar la premisa de coste antes de
  ensanchar el historico.
- **Antes de activar H7**: probar con correos automaticos reales (respuestas de
  ausencia, acuses de recibo) que el reenganche del proximo paso no genera ruido.

## 19. Casos de uso formales

**CU1 — Conectar la cuenta de Gmail** (formaliza H1)
- Actor: Carlos (`sales`) · tambien Marta (`owner`)
- Precondicion: sesion iniciada; la cuenta pertenece al Workspace de la organizacion.
- Disparador: pulsa "Conectar mi Gmail" en Ajustes.
- Flujo principal: el CRM redirige al consentimiento de Google → el usuario acepta →
  Google devuelve el codigo → el CRM lo canjea por tokens → guarda el de refresco
  cifrado → marca la cuenta como conectada y lanza la primera sincronizacion.
- Flujos alternativos: el usuario rechaza el consentimiento → no se guarda nada y se
  muestra el motivo. El dominio no es el del Workspace → Google deniega y el CRM lo
  explica.
- Postcondicion: existe un token de refresco valido asociado al usuario.

**CU2 — Sincronizar emails de contactos** (formaliza H2)
- Actor: el sistema (proceso programado)
- Precondicion: existe al menos un usuario con la cuenta conectada.
- Disparador: primera conexion, o el ciclo incremental.
- Flujo principal: pedir a Gmail los mensajes del periodo → por cada mensaje,
  extraer las direcciones implicadas → buscar coincidencia en `customers` de la
  tienda del usuario → si coincide, guardar; si no, descartar sin persistir → anotar
  la marca de sincronizacion para el ciclo siguiente.
- Flujos alternativos: token caducado → intentar refresco; si falla, marcar la
  conexion como caida (CU5). Cuota agotada → reintentar con espera creciente.
- Postcondicion: los emails con contactos conocidos estan en el CRM; ninguno mas.

**CU3 — Leer la conversacion** (formaliza H2 y H3)
- Actor: Carlos, y Marta con el mismo alcance.
- Precondicion: el cliente tiene emails sincronizados.
- Disparador: abre la ficha del cliente o una de sus oportunidades.
- Flujo principal: el CRM muestra un historial cronologico unico que entremezcla
  interacciones manuales y emails.
- Postcondicion: ninguna (es lectura).

**CU4 — Escribir y responder** (formaliza H4, H5 y H7)
- Actor: Carlos.
- Precondicion: cuenta conectada; el cliente tiene email.
- Disparador: pulsa "Escribir email" en la ficha, o "Responder" sobre un email.
- Flujo principal: redacta → el CRM envia por la cuenta del usuario (en el hilo
  original si es respuesta) → guarda el email como saliente → si hay oportunidad en
  contexto, actualiza su proximo paso con la misma logica que una interaccion manual.
- Flujos alternativos: el envio falla → el borrador no se pierde y se muestra el
  error.
- Postcondicion: el email esta enviado, registrado y, si aplica, el proximo paso
  actualizado.

**CU5 — Reconectar tras una caida** (formaliza la operacion, seccion 23)
- Actor: Carlos.
- Precondicion: el token fue revocado o caduco.
- Disparador: el CRM detecta el fallo en una sincronizacion.
- Flujo principal: se marca la conexion como caida y se muestra en Ajustes y en las
  vistas de email → Carlos vuelve a conectar → se reanuda desde la ultima marca, sin
  duplicar lo ya sincronizado.
- Postcondicion: conexion restablecida y sin emails duplicados.

## 20. Diagrama actores-modulos

```text
   Carlos (sales)            Marta (owner)
        │                         │
        │ conecta / escribe       │ supervisa (mismo alcance de lectura)
        ▼                         ▼
   ┌──────────────────────────────────────────┐
   │  UI: Ajustes · Ficha cliente · Detalle   │
   │      de oportunidad · Escribir/Responder │
   └───────────────┬──────────────────────────┘
                   │ useQuery / useMutation
                   ▼
   ┌──────────────────────────────────────────┐
   │  Convex                                  │
   │   convex/gmail.ts    (conectar, tokens)  │
   │   convex/emails.ts   (leer, enviar)      │
   │   sync programado    (incremental)       │
   │   model/access.ts    (requireOwner, etc) │
   └───────┬───────────────────────┬──────────┘
           │ guarda                │ OAuth + API
           ▼                       ▼
   ┌───────────────┐        ┌──────────────────┐
   │ tablas:       │        │  Google          │
   │  emails       │        │   OAuth (interna)│
   │  gmailAccounts│        │   Gmail API      │
   │  customers ───┼─filtro─┤   readonly + send│
   │  opportunities│        └──────────────────┘
   │  interactions │
   └───────────────┘
```

## 21. Modelo de entidades

**Por que una entidad nueva y no `interactions`.** El as-is (seccion 28) demuestra
que un email no cabe en la tabla actual: `interactions` exige `opportunityId`
obligatorio (un email llega a una persona, no a una venta), exige `authorId` que sea
un `users` del CRM (un email recibido lo escribe el cliente), y solo tiene `note`
como texto plano (un email tiene asunto, cuerpo, direccion e hilo). Forzarlo alli
significaria inventar valores falsos en tres campos.

**Entidad `emails`** (nueva):
- `customerId` → el contacto con el que es la conversacion. **Es la relacion
  principal**: el email pertenece al cliente, no a la oportunidad.
- `userId` → de que buzon salio o entro. Es lo que permite a Marta ver los del
  equipo y a Carlos los suyos.
- `storeId` → coherencia multi-tienda con el resto del modelo.
- `direction` → `inbound` | `outbound`.
- `gmailMessageId` (unico) → evita duplicados entre sincronizaciones.
- `gmailThreadId` → agrupa la conversacion y permite responder dentro del hilo.
- `from`, `to[]`, `cc[]`, `subject`, `bodyText`, `snippet`, `sentAt`,
  `hasAttachments`.
- Indices por `customerId` y por `gmailMessageId`.

**Entidad `gmailAccounts`** (nueva): `userId`, token de refresco **cifrado**,
`connectedAt`, `lastSyncAt`, `historyId` (marca incremental de Gmail), `status`
(`connected` | `revoked` | `error`).

**Relacion con lo existente**: `emails.customerId` apunta a `customers`; las
oportunidades NO guardan referencia a emails — los muestran resolviendo por su
`customerId` (vista derivada, decision sellada en la seccion 17). `interactions` no
se modifica; el historial de la ficha se construye mezclando ambas tablas por fecha.

**Enganche con el proximo paso (H7)**: un email asociado a una oportunidad dispara la
misma logica de `nextSteps` que hoy dispara una interaccion manual. Esto es lo que
impide que la ola rompa la promesa central del producto.

**Un solo registro por email — no hay dos tipos de email en el CRM.** Enviar desde el
CRM escribe **unicamente** una fila en `emails`; NO se crea ademas una interaccion
espejo de tipo `email`. Lo que se comparte con `interactions` es la logica del
proximo paso, no el registro — dos registros del mismo hecho harian que el historial
lo mostrase dos veces.

La interaccion manual de tipo `email` que ya existe (seccion 28) **sigue viva solo
para quien no tenga cuenta de Gmail conectada**: es la via de registro de quien usa
otro proveedor de correo (ver no-gos, seccion 7). En cuanto un usuario conecta su
cuenta, esa opcion **se oculta** en el formulario de registrar interaccion, porque
pasa a ser redundante: lo que escriba dentro o fuera del CRM queda registrado solo.
Asi las dos cosas nunca coexisten para el mismo usuario.

**Pensado para la ola siguiente**: `bodyText` + `customerId` + `sentAt` +
`direction` es exactamente el material que una IA necesita para analizar la relacion
con un cliente, sin migracion posterior.

## 22. Version 10-estrellas

La version absurda: el CRM lee todo el correo de todos los canales (email, WhatsApp,
LinkedIn), reconstruye la relacion completa con cada cliente desde el primer
contacto, redacta solo las respuestas con el tono de cada vendedor, avisa cuando una
relacion se esta enfriando antes de que el vendedor lo note, y prepara el siguiente
email antes de que se lo pidan.

**Que sobrevive al recorte**: que la conversacion real este DENTRO del CRM y ligada
al cliente. Todo lo demas (multicanal, redaccion automatica, deteccion de
enfriamiento) es la ola siguiente o mas alla — y todo depende de que esta ola guarde
bien los emails. Por eso la seccion 21 es la mas importante del documento.

## 23. Estados y errores

Estados de una **cuenta conectada** (`gmailAccounts.status`):

```text
  sin conectar ──consentimiento──> connected ──sync ok──> connected
                                       │
                                       ├─token caducado──> refresco automatico
                                       │                      │ falla
                                       ├─usuario revoca ──────┴──> revoked
                                       └─error de API repetido ──> error
  revoked | error ──reconexion del usuario──> connected (reanuda sin duplicar)
```

Errores y que ve el usuario:
- **Token revocado**: Ajustes muestra "Tu Gmail se ha desconectado" con boton de
  reconectar; las vistas de email avisan de que puede faltar correo reciente. **Nunca
  se borra lo ya sincronizado.**
- **Cuota de Gmail agotada**: la sincronizacion se pospone; el usuario no ve error,
  solo frescura degradada. Se registra para operacion.
- **Fallo al enviar**: el borrador se conserva y se muestra el motivo. Jamas se marca
  como enviado algo que no salio.
- **Cliente sin email**: el boton de escribir aparece deshabilitado con el motivo,
  siguiendo el patron ya establecido en AIT-66.
- **Email de un contacto que se borra despues** (AIT-65 permite borrar clientes): sus
  emails se borran con el, y el borrado se bloquea igual que hoy si tiene hijos —
  decision a confirmar en el wayfinder.

## 24. Seguridad y privacidad

**Es la seccion que justifica el appetite completo.** Esta ola mete correo de
personas reales en la base de datos del CRM.

- **Frontera de datos**: solo se persiste correo cuyo remitente o destinatario
  coincida con el `email` de un contacto del CRM de la misma tienda. Todo lo demas se
  descarta **antes** de escribirse — no se guarda y luego se filtra. El criterio de
  la seccion 6 lo verifica con un "cero" observable.
- **Quien ve que**: Carlos ve los emails de sus clientes; Marta ve los de todo su
  equipo, con contenido completo (decision sellada, seccion 17). Ningun usuario ve
  emails de otra tienda. **Se aplica en el servidor**, en cada funcion de Convex, no
  solo ocultando en la interfaz — leccion directa de AIT-65, donde el permiso real
  vivia en `requireOwner(ctx)` y no en el boton.
- **Tokens**: el token de refresco se guarda cifrado y nunca se expone al cliente ni
  se registra en logs. Aplica la regla de `CLAUDE.md` sobre no volcar secretos en
  salidas visibles.
- **Permisos pedidos a Google**: exactamente `gmail.readonly` y `gmail.send`. No se
  piden `gmail.modify` ni `mail.google.com` (que darian permiso de borrado) aunque
  sean tecnicamente comodos: el CRM no necesita modificar el buzon de nadie.
- **App Interna**: la exencion de CASA depende de que la app siga siendo Interna del
  Workspace. Si algun dia se abre a terceros, esta seccion y la 12 se reabren
  ANTES de hacerlo — no despues.
- **Derecho al olvido**: borrar un cliente borra sus emails. Desconectar la cuenta de
  Gmail borra los tokens; que borre o no los emails ya sincronizados es decision
  abierta del wayfinder.

## 25. Operacion y despliegue

- **Variables de entorno nuevas** (Client ID/Secret del cliente OAuth con permisos de
  Gmail, y la clave de cifrado de tokens): hay que darlas de alta en **los tres
  deployments de desarrollo y en produccion**. Leccion de la ola anterior: con Resend
  se descubrio deployment a deployment en vez de a la vez.
- **Publicacion**: como el resto del proyecto, por push a `main`; Railway construye
  contra el Convex de produccion (ADR-004).
- **El proceso de sincronizacion** corre programado en Convex. Debe ser idempotente:
  ejecutarlo dos veces no puede duplicar emails (lo garantiza la unicidad de
  `gmailMessageId`).
- **Que monitorizar**: cuentas en estado `revoked`/`error` (indican usuarios que han
  dejado de sincronizar sin darse cuenta), antiguedad de la ultima sincronizacion por
  cuenta, y volumen almacenado frente al limite del plan de Convex.
- **Revertir**: si la ola falla en produccion, desconectar las cuentas detiene la
  sincronizacion sin perder lo ya guardado; el resto del CRM sigue funcionando
  porque ninguna pantalla existente depende de los emails.
- **Primera sincronizacion**: es la operacion mas pesada de la ola. Se ejecuta por
  lotes y con progreso visible, nunca como una sola llamada bloqueante.

## 26. Presupuesto y costes

- **Google**: 0 €. La API de Gmail no se cobra por uso, y la via de app Interna
  evita la auditoria CASA (que era el coste real: de cientos a miles de dolares
  anuales, ver seccion 10).
- **Convex**: el coste variable de la ola. Depende del volumen de correo por vendedor
  y por eso guardamos texto plano y no HTML. **NO VERIFICADO**: no hay medicion real
  del tamaño medio de un email de negocio en este contexto; es la premisa de la
  seccion 9 que se mide en la fase 1, antes de ensanchar el historico.
- **Resend**: sin coste adicional en esta ola — no se usa. Queda como plan B.
- **Coste de construccion**: no se estima aqui. El PRD define el QUE; el cuanto
  cuesta y cuando es otra disciplina, y en este proyecto lo decide el reparto de la
  Directora.

## 27. Glosario

- **Scope restringido**: permiso de Google que da acceso a datos sensibles del
  usuario y obliga a evaluacion de seguridad CASA. Los de lectura de Gmail lo son;
  `gmail.send` no.
- **CASA** (*Cloud Application Security Assessment*): evaluacion de seguridad por un
  asesor homologado por Google, con revalidacion anual, exigida a las apps que piden
  scopes restringidos. Es lo que esta ola evita declarandose Interna.
- **App Interna**: aplicacion cuyo consentimiento solo pueden dar cuentas de la
  organizacion de Google Workspace propietaria del proyecto. Exenta de la revision.
- **Token de refresco**: credencial de larga duracion que permite al CRM pedir
  acceso a Gmail sin que el usuario vuelva a entrar. Es el secreto a proteger.
- **`historyId`**: marca que Gmail da para pedir "solo lo que ha cambiado desde la
  ultima vez". Es lo que hace la sincronizacion incremental en vez de completa.
- **Hilo (`threadId`)**: identificador de conversacion en Gmail. Responder dentro del
  hilo es lo que hace que el cliente vea una conversacion y no correos sueltos.
- **Vista derivada**: mostrar en una oportunidad los emails de su cliente sin
  asignarlos a esa oportunidad. Evita decidir a que venta pertenece cada correo.
- **Ola**: unidad de alcance de este proyecto. La 1 fue el MVP y el Post-MVP; esta es
  la 2; la 3 sera la IA sobre la relacion con el cliente.

## 28. As-is del codigo

Extraido del repositorio ANTES de la entrevista (regla del modo brownfield), con
rutas verificables. Nota de forma: en esta seccion los backticks se reservan para
RUTAS de fichero — los fragmentos literales de codigo van citados como bloque, que
es lo que comprueba el verificador con la opcion de codigo.

**Lo que ya existe y esta relacionado:**

- `convex/schema.ts` — la tabla de interacciones YA contempla el email como tipo de
  actividad manual:
  > type: v.union(v.literal("llamada"), v.literal("whatsapp"), v.literal("email"), v.literal("visita"))

  Pero es una **nota escrita a mano**, no un correo. Y tiene tres restricciones que
  impiden reutilizarla para emails reales:
  > opportunityId: v.id("opportunities")
  > customerId: v.id("customers")
  > authorId: v.id("users")
  > note: v.string()

  - Los dos identificadores de oportunidad y cliente son **obligatorios** — un email
    entrante llega a una persona y puede no tener ninguna oportunidad asociada, o
    tener varias.
  - El autor debe ser un usuario del CRM; el autor de un email recibido es el
    cliente, que no lo es.
  - La nota es texto plano unico: no hay asunto, cuerpo, direccion, hilo ni adjuntos.

- `convex/schema.ts` — el email del cliente es un campo **opcional**:
  > email: v.optional(v.string())

  **El emparejamiento depende de este campo, que hoy puede estar vacio.**

- `convex/auth.ts` — el login con Google existe desde AIT-60, pero el provider se usa
  **sin configuracion de scopes** (linea 234):
  > Google,

  Es decir, pide solo identidad (openid, email, profile). **No pide ningun permiso de
  Gmail y no guarda tokens de acceso ni de refresco.** Tener login con Google NO
  acerca tecnicamente a leer Gmail: es un consentimiento distinto que hay que pedir
  de nuevo a cada usuario.

- `convex/model/access.ts` — la guarda de rol en **servidor** ya existe y es el
  patron a replicar para los permisos de la seccion 24:
  > requireOwner(ctx)

  Las funciones de borrado de AIT-65 la llaman dentro del handler, antes de tocar la
  base de datos.

- `convex/ResendOTPPasswordReset.ts` — Resend ya esta integrado para enviar correo
  saliente (codigos de recuperacion, ola anterior), con sus variables de entorno ya
  dadas de alta en los tres deployments. Existe infraestructura de envio, aunque esta
  ola use la cuenta del propio vendedor via Gmail.

**Lo que NO existe hoy**: ninguna tabla de emails, ninguna conexion con la API de
Gmail, ningun almacenamiento de tokens de terceros, y ninguna pantalla que muestre
correo.

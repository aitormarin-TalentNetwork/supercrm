REVIEW SuperCRM Ola 2 — ciclo 2, ronda 2 — 2026-09-08
Commit verificado: 2a33e6d
Claridad:       7/10 — §27, §23 y §28 se leen del tiron y el §6 nuevo explica su propia nomenclatura (H1-H8 / C1-C5 / hallazgos); pierde puntos porque la cabecera se contradice a si misma (la tabla dice "Fase actual 6 — listo para una ronda nueva de review" y catorce lineas mas abajo un bloque ⚠️ dice "ha RETROCEDIDO A LA FASE 3 ... El documento NO esta listo para desgranar en tareas"), y porque los bloques de cambios se detienen en "0.3 → 0.4": un lector de la v0.7 no tiene ningun resumen de que cambio en 0.5, 0.6 ni 0.7, que son justo las versiones que decidieron el piloto, el alcance y `mailboxUserIds`.
Completitud:    7/10 — las 27 secciones + §28 tienen contenido real, hay 6 maquetas en `pantallas/` y el wayfinder cierra sus 7 fichas; pero la regla estrella de la v0.7 no tiene superficie donde ocurrir (§24 concede al vendedor los emails de su propio buzon en clientes ajenos y a la vez le niega la ficha, la oportunidad y el historial de ese cliente — las unicas dos pantallas donde §8 pinta emails), y `gmailAccounts` (§21) no guarda la direccion del buzon conectado, que es el dato que la regla de desempate de `direction`/`userId` de esa misma seccion necesita para poder ejecutarse.
Verificabilidad:7/10 — §6 es lo mejor del documento: 15 criterios casi todos binarios, el "cero" del filtro, los permisos probados invocando la funcion en servidor, el maximo de H8 y el "ninguna cambio" del historico, y C1-C5 cubren lo que la ronda 3 dejo sin criterio; pero §18 fija un umbral ("25% del limite del plan") que no se puede evaluar en el momento en que la propia seccion lo coloca —una muestra de un contacto y unos dias da el tamaño medio de un email, no cuantos emails tiene el historico— y §13.2 se mide como proporcion ("la mayoria de los emails salientes") justo despues de que §13 declare "se expresan en absolutos, no en porcentajes".
Realismo:       7/10 — ninguna afirmacion del documento sobre el codigo es falsa contra 2a33e6d: verifique una a una ~25 citas de §21, §23, §24, §25 y §28 (schema y los tres roles, args obligatorios y validacion de `interactions.create`, `Math.max` de `lastActivityAt`, la guarda de `remove`, las cuatro guardas de `access.ts`, `getSummary`/`getFicha`/`listByCustomer`, el mensaje literal de `customers.remove`, el cron horario, el `httpRouter`, `Google,` en la linea 234, `update` de AIT-77, `status: "duplicate"` de AIT-80, `by_store_phone` y su migracion, `createForCustomer`, §6bis de `docs/03-setup.md`, ADR-004/ADR-005 con `stoic-impala-857` y `uncommon-puffin-303`, el patron AIT-66, los 44px de AIT-68/71/72 y la ausencia de umbral de rendimiento en `docs/01-arquitectura.md` §5) y todas se sostienen — es la primera ronda de esta historia sin un error de hecho sobre el codigo; pierde puntos porque §21 invoca AIT-80 como "precedente exacto" para justificar exactamente lo contrario de lo que AIT-80 decidio (ver H2) y porque el unico freno del riesgo que el documento declara abierto no es calculable (H3).
Cohesion:       6/10 — la traza historias→criterios→casos de uso→fases sigue siendo buena, pero la v0.7 arreglo sus hallazgos en la seccion donde apuntaba el dedo y no los propago: §17 sigue con la fila "Un `sales` ve solo los emails de **sus** clientes" y §20 con "Carlos (sales) ve los emails de SUS clientes" sin `storeManager` —que es literalmente el H7 de la ronda 1 de este ciclo, sin tocar—, y el renombrado a C1-C5 dejo §19-CU6 apuntando a un "criterio H9 de la seccion 6" que ya no existe. Ademas la deduplicacion por `Message-ID` no esta acotada por tienda, con lo que `mailboxUserIds` puede dar a un usuario un email de otra tienda y romper el invariante de §24.
Media: 6.8 -> DEVUELVE
Hallazgos (si devuelve):
  H1 [Cohesion] §21 §24 §8 §6 — `mailboxUserIds` no llega a ninguna pantalla: el tercer disyuntivo de acceso solo puede activarse sobre clientes que el vendedor no puede abrir. O entra una superficie ("mis emails", o los emails propios visibles en la ficha ajena en modo restringido) en §4/§5/§8 con su maqueta, o §24 declara explicitamente que la regla es de API y no de producto en esta ola.
  H2 [Realismo] §21 §6-C5 §6-H4 — Guardar `customers.email` con la etiqueta posterior a `+` recortada corrompe la direccion real del cliente y hace que "Escribir email" abra Gmail contra un buzon que puede no existir. `lib/phone.ts` decidio lo contrario para el telefono y lo dejo escrito ("es preferible no detectar un duplicado a corromper un telefono"). Separar los dos lados: guardar la direccion tal cual (con `trim`+`toLowerCase`), y aplicar el descarte de `+etiqueta` y de la cabecera `Nombre <a@b>` SOLO al comparar el correo entrante.
  H3 [Realismo] §18 §9 §26 — El freno del 25% no tiene con que calcularse en el momento en que §18 lo situa. Decir de donde sale el numero de mensajes del historico antes de bajarlo (un recuento por `messages.list` acotado por fecha, sin cuerpos, por vendedor) y quien mira el limite de almacenamiento del plan vigente — hoy declarado NO VERIFICADO, y sin el la regla no se puede aplicar.
  H4 [Cohesion] §21 §24 §6 (filtro) — Acotar la deduplicacion por `Message-ID` a la tienda, o filtrar `mailboxUserIds` por `storeId` al leer. Tal como esta, dos buzones conectados de tiendas distintas fusionan un solo registro y el segundo usuario obtiene acceso a un email cuyo `storeId`/`customerId` son de otra tienda, contra "ningun usuario ve nada de otra tienda" (§24) y contra el FALLA del filtro de §6.
  H5 [Completitud] §21 — `gmailAccounts` no guarda la direccion del buzon conectado (usuario, token, fechas, marcas, canal push, estado). La regla de desempate ("se guarda con el buzon del remitente si ese buzon esta conectado") necesita resolver una direccion contra los buzones conectados, y `users.email` es la cuenta de login, no necesariamente la de Gmail. Añadir el campo, o decir que la ola obliga a que coincidan.
  H6 [Cohesion] §17 §20 — Propagar la regla "un vendedor ve siempre los emails de su propio buzon" y los tres roles a la fila de §17 y al diagrama de §20, que siguen redactados con el modelo de dos roles anterior a la v0.6. Es el H7 de la ronda 1 de este ciclo, aplicado solo a §19-CU3 y §24.
  H7 [Cohesion] §19-CU6 — La postcondicion apunta a "criterio H9 de la seccion 6", que el renombrado de la v0.6/0.7 elimino. Es C1. Barrer el resto de punteros del renombrado.
  H8 [Verificabilidad] §13.2 §13 — La metrica 2 es una proporcion en una seccion que declara "absolutos, no porcentajes". O se expresa en absolutos (N intenciones consumidas, con el total de salientes como contexto), o el preambulo acota su regla a las metricas por cuenta.
  H9 [Cohesion] §6-H7 §4 §13 — El criterio de supervision se escribe "Marta abre la ficha...", y §4 excluye a `marta@supercrm.es` del piloto. Reescribir los criterios de §6 por rol (`owner`/`storeManager`/`sales` del Workspace), no por persona; §13 ya lo dice en prosa pero §6 no se actualizo.
  H10 [Completitud] §21 §17 — Bloquear el tipo `email` en `interactions.create` retira, para un vendedor con Gmail conectado, la unica via que cerraba y recreaba el `nextStep` (regla 2 de `docs/02-modelo-de-datos.md` §5), mientras §21 prohibe que un email cree uno. Declarar la consecuencia: tras escribir a un cliente, "Hoy" sigue mostrando el mismo paso vencido.
  H11 [Verificabilidad] §6-C4 — El segundo PASA afirma que la intencion no consumida queda "caducada", y la nota del mismo bloque dice que puede seguir etiquetada `pendiente` porque la caducidad se evalua al leer. Redactar el PASA sobre el efecto (no atribuye actividad, no se vuelve a consumir), no sobre el valor del campo.
  H12 [Claridad] cabecera — Resolver la contradiccion entre la tabla ("Fase actual 6, listo para review") y el bloque ⚠️ ("ha retrocedido a la fase 3, NO esta listo"), y añadir el resumen de cambios de 0.4→0.5→0.6→0.7, que hoy no existe.
  H13 [Completitud] §21 §28 — El recalculo de `interactions.remove` capa tambien `lastRiskPushSentAt` (correccion de AIT-57 ronda 1). §21 recogio la guarda `occurredAt === lastActivityAt` que pidio la ronda 3 pero se dejo esta mitad; quien implemente "que el recalculo incluya los emails" tiene que saber que hay dos campos en juego.
  H14 [Completitud] §6-C3 — Sigue sin respuesta la segunda mitad del H8 de la ronda 3: que pasa cuando a un vendedor se le reasigna una oportunidad mas antigua que la ventana que ya sincronizo. La primera mitad (vendedor sin oportunidades) si se cerro.

---

## ¿Es un problema de fase o de documento?

**De documento.** Las premisas de §9 estan cerradas o etiquetadas honestamente
(`NO VERIFICADO` con su momento de comprobacion y su plan B vivo), la premisa madre nº2
—quien puede consentir— quedo resuelta con una decision de alcance coherente (piloto
interno), y §4 delimita un alcance construible con su consecuencia declarada ("esta ola
todavia no sirve al caso de uso del PRD fundacional"). No hay que volver a fase 3 ni a
fase 5.

Los catorce hallazgos son de redaccion, propagacion y una pieza de modelo que falta
(H5). El unico que roza el alcance es **H1**, y se cierra con una pregunta de una linea a
Aitor: *¿el piloto necesita una pantalla donde un vendedor vea sus propios correos con
clientes que no son suyos, o basta con que el dato exista y la regla sea de API?* Si la
respuesta es "basta con el dato", H1 se resuelve borrando una promesa de §24 y no cuesta
nada. Si es "hace falta la pantalla", es una maqueta mas y una linea en §8.

---

## ¿Se corrigieron de verdad, o se maquillaron?

Lo primero, porque es el dato mas importante de esta ronda y va en la direccion buena:
**no encontre ni un solo error de hecho sobre el codigo.** Las tres rondas anteriores
encontraron tres cada una. Verifique contra `2a33e6d` unas veinticinco citas de §21,
§23, §24, §25 y §28 —incluidas las cuatro que la ronda 1 de este ciclo declaro falsas por
AIT-77/AIT-80— y todas se sostienen, con la redaccion ajustada al as-is real. La leccion
que §28 se escribio a si mismo ("se cita por funcion, no por numero de linea") funciono.

Del resto, la mayoria se corrigio de verdad. Se cerraron con sustancia: el criterio de
permisos que exigia "un error" donde el codigo devuelve `null` (r1-H2), el as-is de
duplicados con AIT-80/AIT-77 (r1-H4), la cita por linea de §24 (r1-H5), el indice sobre
`email` canonico con su migracion y sus dos escritores (r1-H8), la paginacion de §15
(r1-H10), los criterios de `emailIntents` que no existian (r3-H5), el vendedor sin
oportunidades (r3-H8), el `historyId` caducado en CU5 (r3-H7), la premisa del Workspace
(r3-H1), el plazo de la metrica 2 movido a la fase 5 (r3-H6), el efecto colateral sobre
el Web Push (r3-H12) y la purga de la decision revocada del borrado en §17, cabecera y
wayfinder (r3-H4).

**Cinco se maquillaron**, en el mismo patron: se aplico el cambio en la seccion que el
hallazgo citaba y no se propago al resto del documento.

1. **r1-H7 — sin tocar.** El hallazgo pedia propagar "un `sales` ve siempre los emails de
   su propio buzon" a §17, §19-CU3 y §20. CU3 se actualizo; §17 (linea 692) sigue diciendo
   "Un `sales` ve solo los emails de **sus** clientes ... No inventar un modelo distinto
   para el email", y §20 sigue pintando "Carlos (sales) ve los emails de SUS clientes"
   sin `storeManager`. Es la unica seccion que un implementador lee como contrato de
   decisiones, y dice lo contrario que §21 y §24. → H6.
2. **r1-H11 — a medias.** El renombrado a C1-C5 se hizo, y el preambulo de §6 que lo
   explica es de lo mejor del documento. Pero §19-CU6 sigue apuntando a "criterio H9 de
   la seccion 6", que dejo de existir con ese mismo renombrado — y como §6 acaba de
   declarar que "H1-H8 son las historias de usuario", el puntero roto se lee como una
   historia inexistente. → H7.
3. **r1-H1 — resuelto a medias y con hueco nuevo.** `mailboxUserIds` es la respuesta
   correcta al problema de modelo, y el razonamiento de §21 es solido. Pero nadie
   pregunto donde se ve eso: la regla solo puede activarse sobre clientes cuya ficha y
   cuyas oportunidades §24 le niega al vendedor, y §8 no pinta emails en ningun otro
   sitio. Y la deduplicacion que la alimenta no esta acotada por tienda. → H1, H4.
4. **r3-H11(a) — la mitad que faltaba.** El hallazgo decia dos cosas de
   `interactions.remove`: que la guarda es `occurredAt === lastActivityAt`, y que ademas
   capa `lastRiskPushSentAt`. §21 recogio la primera con detalle y dejo caer la segunda.
   → H13.
5. **r3-H8 — la mitad que faltaba.** El caso "vendedor sin oportunidades accesibles"
   entro como segundo PASA de C3, bien resuelto. El caso "se le reasigna despues una
   oportunidad mas antigua que la ventana ya sincronizada", que el mismo hallazgo pedia,
   no aparece. → H14.

Y uno se cerro por arriba sin cerrarse por abajo: **r3-H9/r1-H9**, el freno de coste. La
v0.7 hizo lo que se le pidio —puso un numero (25%) y movio la puerta antes de la primera
descarga completa, con un razonamiento honesto de por que un cuarto y no la mitad—, pero
el resultado sigue sin poder ejecutarse: la muestra que §18 designa (un contacto, unos
dias) da el tamaño medio de un email y no el numero de emails del historico, y el otro
factor del calculo esta declarado NO VERIFICADO en la misma linea. Es la unica red que
protege el unico riesgo que el documento declara abierto a proposito. → H3.

---

## Detalle de los hallazgos nuevos

### H1 [Cohesion] §21 §24 §8 §6 — la regla estrella de la v0.7 no tiene donde ocurrir

§24 concede:

> un vendedor ve SIEMPRE los emails de su propio buzon, aunque el cliente sea de otro
> comercial ... Lo que **no** gana con eso es acceso al cliente: sigue sin poder abrir su
> ficha, sus oportunidades ni el resto de su historial. Ve **su** conversacion, no **su**
> cliente

§21 traduce eso a tres disyuntivos: *ves un email si el cliente es tuyo, si tienes rol de
tienda entera, o si tu buzon esta en `mailboxUserIds`*. Los dos primeros ya cubren todo
lo que un usuario puede alcanzar: si el cliente es suyo, la ficha se abre y el primer
disyuntivo basta; si es `owner` o `storeManager`, el segundo basta. **El tercero solo
puede activarse sobre un cliente cuya ficha §24 le niega explicitamente** — y §8 solo
pinta emails en la ficha del cliente (fase 1/2) y en el detalle de oportunidad (fase 5).
Las seis maquetas de `pantallas/` tampoco traen otra superficie.

Consecuencia: el escenario que motivo el cambio (Carlos escribe a un cliente de Marta y
"deja de ver su propia correspondencia") **sigue igual en la aplicacion**. Lo unico que
cambia es que ahora la funcion de Convex se la devolveria si alguien la invocase — que es
exactamente, y solo, como lo comprueba el segundo PASA del criterio de permisos de §6.

No digo que la decision sea mala; digo que esta a medio construir y que el documento no
lo nota. Salidas, las dos baratas: (a) una superficie minima ("Mis emails", o una seccion
"tus correos con este cliente" dentro de un acceso restringido), con su linea en §4, su
fase en §8 y su maqueta; o (b) declarar en §24 que en esta ola la regla es de modelo de
datos y de API —para que el dato no se pierda y la ola 3 lo tenga—, y que la
visualizacion queda fuera con su alternativa, como manda §7.

### H2 [Realismo] §21 §6-C5 §6-H4 — el precedente de AIT-80 dice lo contrario

§21 decide, y lo hace apoyandose en el telefono:

> **Indice nuevo `by_store_email`** por `storeId` + el propio campo `email`, **guardado ya
> en forma canonica** — no un campo derivado aparte (misma decision y por el mismo motivo
> que se tomo para el telefono ...). El alta ya guarda el email con `trim` + `toLowerCase`,
> asi que **falta solo extender esa normalizacion** (cabecera `Nombre <a@b>`, etiqueta tras
> `+`) y aplicarla en los **dos** escritores que hoy existen

La parte del contrato canonico y del indice es correcta, y los dos escritores son
efectivamente `opportunities.ts::createQuick` y `customers.ts::update` (verificado: son
los dos unicos que escriben `customers.email`, ambos con `trim().toLowerCase()`). El
problema es *que* normalizacion se extiende.

`lib/phone.ts`, que es el precedente que §21 invoca, dejo escrito por que NO normaliza de
mas:

> Solo se recorta un `+34`/`0034` que el usuario haya TECLEADO como tal. No se infiere el
> prefijo a partir de los digitos ... Es preferible no detectar un duplicado (se ve y se
> arregla) a corromper un telefono (no se nota hasta que alguien llama y no contesta
> nadie).

Descartar la etiqueta posterior a `+` **en el valor almacenado** es justo la operacion que
AIT-80 rechazo: es lossy y sobre un dato que no es nuestro. `+etiqueta` es una convencion
de Gmail, no una regla del correo: en un dominio cualquiera `cliente+pedidos@ejemplo.com`
puede ser un buzon distinto de `cliente@ejemplo.com`. Si el CRM reescribe la ficha, el
boton de H4 ("abre Gmail con ese cliente ya puesto como destinatario") escribe a una
direccion que el cliente nunca dio — y, por el aviso de §21, sin que nadie lo note. Peor:
`customers.update` existe precisamente para corregir un email, y con esta regla el
usuario teclea la direccion buena y el servidor se la cambia en silencio.

La asimetria es la salida, y no cuesta nada: **normalizacion de almacenamiento** =
`trim` + `toLowerCase` (lo que ya hay), sobre la que va el indice; **normalizacion de
comparacion** = ademas quitar `Nombre <...>` y la etiqueta `+`, aplicada al correo
entrante y, si se quiere emparejar tambien las fichas con etiqueta, resolviendo la
busqueda en dos pasadas (exacta primero, sin etiqueta despues). C5 sigue siendo
verificable tal como esta escrito.

### H3 [Realismo] §18 §9 §26 — el freno existe pero no se puede accionar

§18 dice:

> si la extrapolacion del historico completo de todos los vendedores previstos supera **el
> 25% del limite de almacenamiento del plan de Convex vigente**, se para ... La medida se
> toma con la muestra de la **fase 1** —un solo contacto conocido y unos pocos dias— y se
> decide **antes de ensanchar en la fase 2**.

Una muestra de un contacto y unos dias da **bytes por email**. La extrapolacion al
historico completo necesita el otro factor —**cuantos emails hay** desde la oportunidad
mas antigua de cada vendedor— y ese numero no lo produce la fase 1 ni lo menciona ninguna
seccion. Sin el, el 25% no es un umbral: es una intencion.

Es barato de arreglar y no cambia el diseño: la API de Gmail permite contar mensajes de
un rango de fechas sin descargar cuerpos, asi que el paso que falta es "por cada vendedor
previsto, contar los mensajes desde la fecha de su oportunidad mas antigua" antes de
bajar nada. Con ese numero y los bytes por email de la fase 1, el 25% se calcula. Falta
tambien el denominador: §18 lo declara `NO VERIFICADO` con honestidad, pero mirarlo son
dos minutos y sin el la regla no existe. Y §26 deberia recoger el segundo precio que CU5
ya identifico (la resincronizacion completa cuando caduca el `historyId`), que hoy solo
vive como un puntero de CU5 hacia §26 sin contrapartida alli.

### H4 [Cohesion] §21 §24 §6 — la deduplicacion no esta acotada por tienda

§21 dice que la unicidad se comprueba por el `Message-ID` de la cabecera y que
`mailboxUserIds` **crece** cuando una segunda sincronizacion encuentra el mismo
`Message-ID`, sin reescribir `userId`, `direction`, `customerId` ni `storeId`. En ningun
sitio se acota esa busqueda a la tienda.

El sistema es multi-tienda por diseño (`requireStoreAccess`, `isStoreWideRole`,
`storeManager` asignable hoy desde Ajustes — verificado en `app/ajustes/page.tsx`). Si
dos buzones conectados pertenecen a tiendas distintas y reciben el mismo correo, cada uno
lo empareja con un cliente **de su tienda**, pero el `Message-ID` es el mismo: el segundo
no inserta, añade su buzon a `mailboxUserIds` de un registro cuyo `storeId` es de la otra
tienda. A partir de ahi el tercer disyuntivo de acceso se lo concede, contra el ultimo
bullet de §24 ("ningun usuario ve nada de otra tienda") y contra el FALLA del filtro de
§6 ("incluido un email emparejado con un contacto de otra tienda").

Hoy, con el piloto de dos cuentas en "Tienda principal", no se puede reproducir. Pero §24
es el invariante de seguridad de la ola y el documento lo escribe en presente para un
sistema que ya tiene el rol y la guarda multi-tienda construidos. Basta con una frase:
la deduplicacion y la lista de buzones se resuelven **dentro de una tienda**; el mismo
correo en dos tiendas es un registro por tienda, y no se considera duplicado.

### H5 [Completitud] §21 — falta la direccion del buzon en `gmailAccounts`

La regla determinista que la ronda 3 pidio (y que §21 escribio bien) es:

> el registro se guarda con el buzon **del remitente** si ese buzon esta conectado
> (`direction: saliente`, `userId` = quien lo envio); si el remitente no es ninguno de los
> buzones conectados, con el del **destinatario** que lo recibio

Para ejecutarla hay que responder "¿esta direccion es un buzon conectado?". Los campos que
§21 declara para `gmailAccounts` son: usuario, token de refresco cifrado, fecha de
conexion, marca de ultima sincronizacion, marca incremental, datos del canal push y
estado. **No hay direccion de correo.** `users.email` no sirve como sustituto: es la
cuenta de login, y aunque la via Interna acota el dominio, nada obliga a que el buzon
conectado sea el mismo buzon con el que se entra al CRM.

Sin ese campo, `direction` vuelve a depender de quien sincronice primero — exactamente lo
que la seccion dice que "no puede depender de una carrera". Un campo mas en la entidad, y
el indice correspondiente para resolver direccion → cuenta.

### H10 [Completitud] §21 §17 — que pasa con el proximo paso

`docs/02-modelo-de-datos.md` §5, regla 2: *registrar interaccion → actualiza
`lastActivityAt` **y** cierra/crea el `nextStep` correspondiente*. Verificado en
`convex/interactions.ts::create`: cierra los pendientes con `closePendingNextSteps` e
inserta el nuevo.

La ola hace dos cosas a la vez: prohibe que un email cree un `nextStep` (§21, bien
razonado) y bloquea en servidor el tipo `email` de `interactions.create` para quien tenga
Gmail conectado (§6, "vias de registro que no se solapan"). El resultado, para el unico
vendedor del piloto, es que escribir a un cliente ya no ofrece ninguna via de cerrar y
replantear el proximo paso: "Hoy" seguira mostrando el mismo paso vencido de un cliente
al que se acaba de atender.

No rompe el invariante 6 (ninguna oportunidad abierta sin paso pendiente) y quiza sea
aceptable — el vendedor puede cambiar de etapa, o registrar otro tipo. Pero es una
consecuencia sobre la promesa central del producto ("que ninguna venta se pierda por
falta de seguimiento") y §21 solo mira la mitad `lastActivityAt` del mecanismo. Declararla
donde estan las demas consecuencias asumidas.

---

## Nota de commit

Empece en **2a33e6d** y todas las comprobaciones de codigo de este documento se refieren a
ese estado. Al terminar, `main` estaba en **829cb0a** (tres commits: "Decisión 39 y
enmienda 6", "Decisión 40", "Decisión 41"). El diff toca unicamente
`Sorfware Factory/README.md` e `intro-terminal.txt` — nada de `convex/`, `lib/`, `app/`,
`docs/` ni del PRD. Las verificaciones siguen siendo validas.

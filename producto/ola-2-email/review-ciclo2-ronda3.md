REVIEW SuperCRM Ola 2 — ciclo 2, ronda 3 — 2026-09-08
Commit verificado: cb025e4
Claridad:       7/10 — el §6 nuevo explica su propia nomenclatura (H1-H8 / C1-C5 / hallazgos de review) y el §27, §23 y §28 se leen del tiron; pierde puntos porque §13.2 quedo con una cicatriz de edicion visible (la sangria se rompe a mitad de vineta y el texto conserva a la vez la formulacion nueva y la vieja: "se cuentan dos numeros y se comparan... La formulacion anterior era **la mayoria de los emails salientes**... Se mide contando las `emailIntents` consumidas frente al total") y porque §21 da al implementador dos instrucciones opuestas en vinetas adyacentes sobre que se guarda en `customers.email` (H1).
Completitud:    7/10 — las 27 secciones + §28 tienen contenido real, 6 maquetas y el wayfinder cerrado a cero; pero el documento nunca dispara el `checklist de salida a produccion real` que `CLAUDE.md` marca como regla dura, siendo esta la ola que —por su propia §24— "mete correo de personas reales en la base de datos del CRM" (H6); el contador de correos propios que §24 promete en la pantalla de conexion no existe en `pantallas/ConexionGmail.dc.html` ni tiene criterio en §6 (H4); y la promesa de UI nueva de §21 ("el historial de correo empieza el <fecha>") tampoco tiene criterio ni maqueta (D7).
Verificabilidad:7/10 — §6 sigue siendo lo mejor del documento: el "cero" del filtro con alcance por tienda, los permisos probados invocando la funcion en servidor con los tres roles, el maximo de H8, el "ninguna cambio" del historico y C1-C5; pero §21 deja abierta una decision de producto ("o el registro manual sigue disponible solo para cerrar el proximo paso, o se acepta que...") que el criterio "Vias de registro que no se solapan" de §6 ya cierra en sentido contrario (H3), y C4 sigue afirmando en su PASA que la intencion no consumida queda "caducada" mientras su propia nota dice que puede seguir en `pendiente` — es el H11 de la ronda pasada, sin tocar (D5).
Realismo:       6/10 — §9 nombra sus premisas con su forma de verificarlas y sus `NO VERIFICADO`, el plan B sigue vivo y el freno del 25% ya es calculable; pero vuelve a haber errores de hecho sobre el codigo: §28 afirma que "el proximo paso NO es automatico" cuando tres de los cuatro escritores de `nextSteps` (`opportunities.createQuick`, `createForCustomer` y `changeStage`) lo crean con accion de catalogo y `dueDate: now`, sin intervencion del usuario, y §21 dice que se "pierde la forma de cerrar un proximo paso" cuando `nextSteps.markDone` ya lo cierra (H2); §21 exige "sin ambiguedad" una migracion que la propia decision de la v0.8 vuelve innecesaria (H1); y §28 sigue diciendo "cuatro tareas se publicaron" cuando hoy se publicaron ocho (D3).
Cohesion:       6/10 — `mailboxUserIds` si se propago bien (§6, §17, §19-CU3, §20, §21, §24) y los tres roles tambien, que eran los dos huecos de la ronda pasada; pero se repite el patron: de los 14 hallazgos, tres se arreglaron anadiendo texto nuevo sin retirar el viejo — la vineta del indice de §21 sigue mandando normalizar la direccion guardada (H1), la lista de indices de la entidad `emails` sigue siendo "por `messageId`" cuando la clave de unicidad paso a ser (`storeId`, `Message-ID`) (H5), y la vineta de `interactions.remove` sigue sin decir que ese mismo patch capa tambien `lastRiskPushSentAt` (D6).
Media: 6.6 -> DEVUELVE
Bloqueantes: 6   Mejoras deseables: 9
Hallazgos:
  H1 [Cohesion] [BLOQUEANTE] §21 — La correccion del `+etiqueta` se anadio como vineta nueva sin retirar la vieja, y las dos se contradicen. La primera sigue diciendo que `by_store_email` va sobre el campo "**guardado ya en forma canonica**", que "falta solo extender esa normalizacion (cabecera `Nombre <a@b>`, etiqueta tras `+`) y aplicarla en los **dos** escritores", y que "**hace falta migracion**, sin ambiguedad"; la siguiente dice lo contrario: `customers.email` guarda "**la direccion tal cual**" con `trim`+`toLowerCase` porque recortar el `+` la corrompe. Con la decision buena, la migracion ademas sobra: los dos unicos escritores de la tabla (`opportunities.ts::createQuick`, desde AIT-10, y `customers.ts::update`, desde AIT-77) ya guardan `args.email?.trim().toLowerCase()`, asi que no puede haber filas sin normalizar que rescatar. Borrar la vineta vieja entera, no matizarla.
  H2 [Realismo] [BLOQUEANTE] §28 §21 §17 — Error de hecho sobre el codigo. §28 afirma "el proximo paso NO es automatico (verificado tras el hallazgo H4 de la review)" y §17 apoya en eso una decision clasificada como *mechanical*. Pero `insert("nextSteps")` aparece cuatro veces en `convex/`: `interactions.ts::create` (accion y fecha del usuario) y tres mas — `opportunities.ts::createQuick`, `createForCustomer` y `changeStage`— que inventan las dos cosas (`FIRST_STEP_BY_SOURCE` / `NEXT_STEP_BY_STAGE` y `dueDate: now`). Ademas §21 dice que el vendedor con Gmail conectado "pierde la forma de **cerrar** un proximo paso desde un email": `nextSteps.ts::markDone` cierra un paso hoy, y `changeStage` cierra los pendientes y crea el siguiente. Lo que de verdad se pierde es **crear el sucesor desde el registro de una interaccion**. Reescribir la premisa, y reclasificar la decision de §17 como *taste* (es una eleccion de producto, no una imposibilidad del codigo).
  H3 [Cohesion] [BLOQUEANTE] §21 §6 — §21 deja una decision de producto abierta ("Hay que decidirlo explicitamente al planificar: o el registro manual sigue disponible **solo** para cerrar el proximo paso, o se acepta que eso se haga desde la propia oportunidad") que §6 ya cerro: su criterio exige que `interactions.create` **rechace en servidor** el tipo `email` a cualquiera con Gmail conectado. Si se elige la primera rama, el criterio de §6 falla por construccion. Cerrarla en el PRD —es alcance, y el alcance lo decide el PM, no quien planifique— y alinear los dos sitios.
  H4 [Cohesion] [BLOQUEANTE] §24 §8 §6 §21 — El "donde se ven" de `mailboxUserIds` se resolvio a medias. §24 declara (bien) que la regla es de permiso y que la bandeja "mis correos" queda fuera de la ola, pero en la misma frase introduce una superficie nueva: la pantalla de conexion "muestra **cuantos** correos suyos hay emparejados con clientes que no son suyos". Ese contador no esta en `pantallas/ConexionGmail.dc.html` (que §8 declara la fuente para implementar: "quien implemente una fase parte de su maqueta, no de la descripcion"), no tiene criterio en §6, no aparece en ninguna fase de §8, y §21 no da indice con el que calcularlo (los indices de `emails` son "por cliente y por `messageId`", y una lista como `mailboxUserIds` no es indexable en Convex). O se retira el contador y §24 se queda con la declaracion de permiso —que basta y es coherente—, o entra con maqueta, fase, criterio e indice.
  H5 [Cohesion] [BLOQUEANTE] §21 — El acotamiento por tienda de la deduplicacion, que es la correccion estrella de la v0.8, no llego a la lista de campos de la entidad: sigue diciendo "Indices por cliente y por `messageId`" tres parrafos antes de establecer que "la clave de unicidad es (`storeId`, `Message-ID`)". Un implementador que monte `by_message_id` y resuelva el duplicado con `.unique()` sobre ese indice encuentra el registro de la otra tienda, no inserta el propio, y reabre exactamente el agujero que el parrafo siguiente cierra. Cambiar la lista a "indices por cliente y por (`storeId`, `messageId`)".
  H6 [Completitud] [BLOQUEANTE] §18 §25 §24 — El documento no dispara el `checklist de salida a produccion real` (`Sorfware Factory/INSTRUCCIONES PARA LA FABRICA DE SOFTWARE/checklist-produccion-real.md`), que `CLAUDE.md` fija como regla dura "antes de que este proyecto maneje datos reales de un negocio" y cuyo disparo asigna al PM. Esta ola persiste correspondencia real de terceros en el deployment de produccion (`stoic-impala-857`), y §24 lo dice con esas palabras. Basta una entrada en §18 ("antes de la fase 2: pasar el checklist") y una linea en §25, pero tiene que estar escrita: si no, nadie la dispara.
  H7 [Claridad] [DESEABLE] §13.2 — Cicatriz de edicion sin cerrar: la vineta pierde la sangria a mitad y conserva la formulacion nueva y la vieja seguidas ("Son dos conteos, no un porcentaje... La formulacion anterior era **la mayoria de los emails salientes**... Se mide contando las `emailIntents` consumidas frente al total de emails salientes"). No se sabe cual manda. Dejar solo la nueva y su limitacion declarada.
  H8 [Realismo] [DESEABLE] §18 §9 §10 — El freno de coste ya es calculable, pero descansa en una premisa nueva que el documento no marca ni cita: "el otro factor —cuantos correos hay— no se estima, **se pregunta a Gmail**: su API responde cuantos mensajes coinciden con un criterio sin descargarlos". No esta en el landscape de §10, no esta en la lista de premisas de §9 y no lleva `NO VERIFICADO`, en un documento que etiqueta escrupulosamente todo lo demas. Gmail devuelve `resultSizeEstimate`, que es una estimacion. Anadirla a §9 con su forma de verificarla, o marcarla.
  H9 [Realismo] [DESEABLE] §28 §6-C2 — §28 sigue diciendo "**Cuatro** tareas se publicaron mientras se escribia este PRD" y enumera AIT-77, AIT-80, `by_store_phone` y AIT-74. Hoy se publicaron ocho: AIT-74, 76, 77, 79, 80, 81, 78 y 75. La que importa es AIT-75, que cambio la UX del caso que §6-C2 verifica: "Eliminar cliente" ya no queda `disabled` — abre un dialogo con el texto "No se puede eliminar: tiene oportunidades asociadas", **sin el numero**. El criterio "sigue bloqueandose con el mensaje de AIT-65" apunta ahora a dos textos distintos (el del servidor, con N; el del dialogo, sin N). Actualizar §28 y precisar C2. Nota buena: AIT-75 refuerza el patron AIT-66 en el que se apoya §23, con cuatro casos ya implementados.
  H10 [Cohesion] [DESEABLE] §28 — §24 y §28 declaran que a partir de ahora se cita "por funcion y no por numero de linea", y §28 mantiene "el provider se usa sin configuracion de scopes (**linea 234**)". Hoy sigue siendo la 234, pero es la cita que la propia leccion prohibe. Quitar el numero.
  H11 [Verificabilidad] [DESEABLE] §6-C4 — Sin tocar desde la ronda pasada (era su H11): el PASA afirma que la intencion no consumida queda "**caducada**" y la nota del mismo bloque dice que puede seguir etiquetada `pendiente` porque la caducidad se evalua al leer. Redactar el PASA sobre el efecto observable (no atribuye actividad, no se vuelve a consumir), no sobre el valor del campo.
  H12 [Completitud] [DESEABLE] §21 — El `lastRiskPushSentAt` de la ronda pasada (su H13) se contesto en otra vineta —la del efecto colateral de mover la marca por un email— y la vineta que lo pedia sigue igual: la de `interactions.remove` habla solo de `lastActivityAt` y de la guarda `occurredAt === lastActivityAt`. En el codigo, ese mismo `patch` escribe los **dos** campos (`lastRiskPushSentAt: Math.min(...)`). Quien implemente "que el recalculo incluya los emails" tiene que leerlo ahi.
  H13 [Completitud] [DESEABLE] §21 §6-C3 — La respuesta al cliente reasignado (H14 de la ronda pasada) introduce una promesa de interfaz nueva —"se muestra en la ficha ('el historial de correo empieza el <fecha>')"— que no tiene criterio en §6, no esta en `pantallas/Main.dc.html` y no aparece en ninguna fase de §8. Ademas vive dentro de la lista "Que hace y que NO hace un email con el seguimiento", que no es su sitio.
  H14 [Verificabilidad] [DESEABLE] §21 — El desempate de `direction`/`userId` tiene un hueco: "si dos buzones conectados aparecen como destinatarios y ninguno como remitente, gana el del **dueno del cliente**" no dice que pasa cuando el dueno del cliente no es ninguno de los dos, que es el caso normal si el cliente es de un tercer comercial. Anadir el ultimo desempate (el mas antiguo, el que sincronice primero, lo que sea) para que la regla sea total.
  H15 [Cohesion] [DESEABLE] §21 — "El emparejamiento compara **formas canonicas calculadas al vuelo en los dos lados**" no es realizable con la decision que se acaba de tomar: el lado del cliente esta en un indice sobre el campo tal cual, y a un valor indexado no se le aplica una funcion al vuelo. Lo que si se puede es lo que dice la frase siguiente (buscar la forma tal cual y la forma sin etiqueta del correo **entrante**), que es lo que C5 exige. Quitar "en los dos lados": lo unico que no se cubre es un cliente dado de alta con `+etiqueta` al que escriben sin ella, y conviene decirlo como limite conocido.

---

## Detalle

### Metodo

Lei el PRD entero y el `wayfinder/` completo antes de abrir ningun `review-*.md`, y
puntue a ciegas. Verifique contra `cb025e4` las afirmaciones de §21, §23, §24, §25 y §28
—schema (14 tablas, tres roles, `email` opcional, `lastRiskPushSentAt`), los tres indices
de `customers`, `createQuick` y `update` con su `trim().toLowerCase()`, `customers.remove`
y su mensaje literal, `interactions.create`/`remove` con su guarda y su `Math.max`,
`nextSteps` (los cuatro `insert`, `markDone`, `postpone`), `lib/risk.ts` (7 dias, al
vuelo), `access.ts` (`requireUser`/`requireOwner`/`requireStoreAccess`/`isStoreWideRole`),
`opportunities.getSummary` devolviendo `null`, `crons.ts` (cron horario de AIT-57),
`http.ts` (`httpRouter`), `auth.ts` (`Google,` sin scopes), `migrations.ts`
(backfill de telefono), `users.ts` y `docs/03-setup.md` §6bis (los dos dominios), y los
ocho merges de hoy. Solo despues lei las reviews anteriores, para responder a la pregunta
sobre maquillaje.

### ¿Problema de fase o de documento?

**De documento, otra vez, y esta vez con menos margen de duda que en las rondas
anteriores.** Las premisas de §9 estan cerradas o marcadas con honestidad, el alcance de
§4 es construible y declara lo que no cubre ("esta ola todavia no sirve al caso de uso del
PRD fundacional"), las alternativas de §12 tienen un plan B vivo, y el wayfinder esta a
cero con las siete decisiones resueltas y una explicitamente superseded. No hay nada que
devolver a premisas ni a alcance.

Lo que falla es **disciplina de propagacion y verificacion de hechos del codigo**, que es
lo mismo que fallo en la ronda pasada, con un matiz nuevo: el metodo de correccion de la
v0.8 fue **anadir** parrafos que explican la decision nueva sin **retirar** los que decian
lo contrario. Eso hace crecer el documento y deja al implementador eligiendo entre dos
instrucciones. H1 es el ejemplo puro: dos vinetas seguidas, una dice "guarda la forma
canonica y migra", la siguiente dice "guarda la direccion tal cual porque recortarla la
corrompe".

### ¿Cuantos bloquean de verdad?

**Seis**, y ninguno cuesta una decision nueva de Aitor salvo H3 (una linea: ¿se conserva
el registro manual solo para cerrar el proximo paso?) y H6 (disparar el checklist, que es
un procedimiento, no una decision de producto). Los otros cuatro son borrar texto viejo
(H1), corregir una premisa falsa sobre el codigo (H2), cambiar una lista de indices (H5) y
decidir si el contador de §24 entra o sale (H4).

Bloquean porque los cuatro producen **codigo equivocado**, no prosa mejorable: H1 hace que
la mitad de las direcciones se guarden mutiladas —el fallo que la v0.8 existia para
corregir—; H5 reabre el agujero de privacidad entre tiendas por la puerta del indice; H2
sostiene una decision *mechanical* sobre una premisa falsa (y quien la verifique contra el
codigo la va a encontrar falsa, como me paso a mi); H3 hace que un criterio de aceptacion
no pueda pasar segun que rama se elija despues; H4 manda construir desde una maqueta que
no tiene el elemento que §24 promete; H6 se salta una regla dura del proyecto justo en la
ola que la activa.

Las nueve deseables se pueden publicar como deuda declarada sin riesgo: son precision de
criterios, cicatrices de edicion y as-is desactualizado. Ninguna cambia lo que se
construye.

### ¿Se corrigieron de verdad los 14 hallazgos, o se maquillaron?

Fui a comprobarlo uno a uno contra la lista de la ronda 2 del ciclo 2.

**Corregidos de verdad (8):**
- **H5** (`gmailAccounts` sin la direccion del buzon) — corregido con la razon escrita al
  lado: "sin ella la regla de desempate de mas abajo no se puede evaluar". Ejemplar.
- **H6** (§17 y §20 con el modelo de dos roles) — propagado: el diagrama de §20 ya pinta
  "owner · storeManager" y "sales... MAS los de su propio buzon", y las filas de §17
  tambien. Era la reincidencia de la ronda anterior; esta vez si se cerro.
- **H7** (puntero muerto a "criterio H9") — barrido: §19-CU6 apunta a C1.
- **H12** (cabecera contradictoria y sin resumenes de cambios) — cerrado: el bloque ⚠️
  desaparecio y estan los resumenes 0.4→0.5→0.6→0.7→0.8.
- **H9** (criterios de §6 escritos por persona) — resuelto por declaracion, que era una de
  las dos salidas: el preambulo nuevo de §6 dice como leer "Carlos" y "Marta" en el piloto
  y remata con "verificar un criterio con `carlos@supercrm.es` no demuestra nada".
- **H3** (freno del 25% no calculable) — cerrado con sustancia: se separan los dos
  factores, el tamano medio sale de la fase 1 y el conteo se le pregunta a Gmail. Deja un
  fleco (H8 de esta ronda: esa premisa no esta marcada ni citada), pero el hallazgo esta
  atendido.
- **H4** (deduplicacion no acotada por tienda) — corregido en el sitio que importa, y bien
  argumentado ("no es una optimizacion, es la frontera de privacidad"). El fleco es que no
  llego a la lista de indices (H5 de esta ronda).
- **H2** (`+etiqueta` corrompiendo la direccion) — la decision nueva es correcta y esta
  bien razonada. El fallo es de metodo, no de criterio (H1 de esta ronda).

**Corregidos en la seccion citada y no propagados (3):** son exactamente el patron que
esta review venia a buscar, y se repitio.
- **H2 → H1 de esta ronda.** La vineta corregida se anadio debajo; la que decia lo
  contrario ("guardado ya en forma canonica", "falta solo extender esa normalizacion...
  y aplicarla en los dos escritores", "hace falta migracion, sin ambiguedad") sigue ahi,
  intacta. Lo comprobe en el diff `b1e9c27..749b069`: esas lineas ni se tocaron.
- **H4 → H5 de esta ronda.** "Indices por cliente y por `messageId`" no se actualizo a la
  clave nueva.
- **H13 → H12 de esta ronda.** El `lastRiskPushSentAt` se conto en otra vineta; la que
  pedia el hallazgo sigue hablando solo de `lastActivityAt`.

**Contestados, pero abriendo un problema nuevo (2):**
- **H1** (superficie de `mailboxUserIds`) → §24 elige bien la salida barata (es una regla
  de permiso, no una pantalla) y a la vez inventa un contador que no tiene maqueta,
  criterio, fase ni indice. Media respuesta buena y media respuesta nueva sin cerrar.
- **H10** (hueco del `nextStep`) → se declara la consecuencia, pero se deja la decision
  "para el que planifique" contra un criterio de §6 que ya la habia cerrado, y se apoya en
  una descripcion del codigo que es falsa (H2 y H3 de esta ronda).

**Sin tocar (1):**
- **H11** (C4: "caducada" en el PASA frente a la nota que admite `pendiente`). El diff
  confirma que ese bloque no se modifico. Es un hallazgo de dos lineas que sobrevivio una
  ronda entera.

**H14** (cliente reasignado) se contesto, y bien de fondo, pero colocado en una lista que
no es la suya y con una promesa de interfaz sin criterio (H13 de esta ronda).

### Lo que hay que reconocer

Tres cosas que estan mejor de lo que la historia de seis rondas haria esperar, y que no
son de forma:

1. **El acotamiento por tienda de la deduplicacion (§21)** es el mejor parrafo del
   documento. No solo corrige: explica por que una deduplicacion global rompe la promesa
   "en silencio, sin que ninguna guarda de permisos se entere". Ese razonamiento vale mas
   que la correccion.
2. **La distincion normalizar-la-clave / no-la-direccion (§21)** es correcta, esta bien
   argumentada y ademas es *verdad* contra el codigo: verifique que los dos unicos
   escritores de `customers` ya guardan `trim().toLowerCase()`, tal como dice el
   documento. Lo unico que falta es borrar lo viejo.
3. **§6 sigue siendo un modelo de criterios binarios.** El "cero" del filtro con alcance
   por tienda, los permisos verificados invocando la funcion en servidor con los tres
   roles, y el tercer PASA de H8 ("el `lastActivityAt` de **ninguna** oportunidad ha
   cambiado") son criterios que se pueden ejecutar tal cual, sin interpretar.

El documento esta a dos horas de trabajo de aprobarse. No hace falta otra ronda de fondo:
hace falta una pasada de **borrado** (no de escritura) sobre §21, una respuesta de una
linea a la pregunta de H3, decidir si el contador de §24 entra o sale, y anadir el
checklist a §18.

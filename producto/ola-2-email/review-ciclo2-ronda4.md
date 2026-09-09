REVIEW SuperCRM Ola 2 — ciclo 2, ronda 4 — 2026-09-08
Commit verificado: 9cfe452
Claridad:       7/10 — el preambulo de §6 (H1-H8 / C1-C5 / hallazgos) y el parrafo del acotamiento por tienda de §21 se leen sin ambiguedad; pierde puntos porque §13.2 conserva intacta la cicatriz de edicion de la v0.8 ("Son dos conteos, no un porcentaje... **La formulacion anterior era** la mayoria de los emails salientes... Se mide contando las `emailIntents` consumidas frente **al total** de emails salientes": dos denominadores distintos, uno declarado superado y usado a continuacion), y porque §21 sigue dando dos instrucciones opuestas sobre como se empareja una direccion (B1).
Completitud:    6/10 — 27 secciones + §28 con contenido real, 6 maquetas, wayfinder a cero y el checklist de produccion real por fin disparado; pero §21 no dice que pasa cuando un mismo correo coincide con **dos clientes distintos** de la misma tienda (B3), §15 manda cargar el historial "bajo demanda" sin decir de que tamaño ni como se pagina una linea de tiempo que mezcla dos fuentes (B4), el disparo del checklist vive solo en §24 y no llega ni a §18 —que tiene su propia viñeta "Antes de la fase 2"— ni a la fase 2 de §8 (D2), y `ConexionGmail.dc.html` no dibuja ni el estado `error` de §23 ni el "resincronizando desde el principio" de §19-CU5 (D12).
Verificabilidad:7/10 — §6 sigue siendo lo mejor del documento: el "cero" del filtro con alcance por tienda, los permisos probados invocando la funcion en servidor con los tres roles, el maximo de H8 y su tercer PASA ("el `lastActivityAt` de **ninguna** oportunidad ha cambiado"), y C1-C3; pero C4 sigue afirmando en su PASA que la intencion queda "caducada" mientras su propia nota admite que puede seguir `pendiente` (D5, tercera ronda sin tocar), C2 remite "al mensaje de AIT-65" cuando desde hoy hay dos textos distintos y la interfaz ya no llega al del servidor (D4), y C5 no cubre el unico caso que la regla de §21 deja fuera (B1).
Realismo:       6/10 — §9 nombra sus premisas con su forma de verificarlas y sus `NO VERIFICADO`, el plan B sigue vivo, y los **tres errores de hecho de la ronda 3 estan corregidos y son ciertos contra el codigo** (verificado: cuatro `insert("nextSteps")`, tres con accion de catalogo; `nextSteps.markDone` existe; los dos escritores de `customers` guardan `trim().toLowerCase()` desde AIT-10, asi que la migracion sobra). Pero la v0.9 introduce un error de hecho **nuevo**: §21 dice que `lastRiskPushSentAt` "puede silenciar el aviso nuevo" y `convex/pushInternal.ts` compara esa marca contra `lastActivityAt`, no contra "ahora" (B2). Ademas §28 sigue diciendo "**Cuatro** tareas se publicaron" cuando hoy se publicaron **diez**, y falta justo AIT-82, que movio a `lib/customerValidation.ts` la normalizacion que §21 cita como "verificado" (D3).
Cohesion:       7/10 — **la pasada de borrado de §21 y §24 fue real**, no cosmetica: el diff `749b069..812096c` son 54 inserciones y **33 borrados**, y desaparecen del fichero las tres viñetas que contradecian a las nuevas (la del campo "guardado ya en forma canonica" con su "hace falta migracion, sin ambiguedad"; la de "hay que decidirlo explicitamente al planificar"; y el contador de la pantalla de conexion). Pero el patron sobrevive **fuera** de §21: §13.2 (D1), "(linea 234)" que la propia §28 prohibe dos viñetas despues (D7), la promesa de interfaz "el historial de correo empieza el <fecha>" sin criterio ni maqueta (D8), y §24 mandando replicar un patron de lectura de dos terminos cuando §6 exige tres (D10) — mas el resto de "en los dos lados" dentro de §21 (B1).
Media: 6.6 -> DEVUELVE
BLOQUEANTES: 4    DESEABLES: 13
¿Se puede desgranar en tareas sin riesgo de construir mal? NO — entero no; las fases 1, 3 y 4 si se pueden cortar hoy, porque los cuatro bloqueantes caen todos sobre la fase 2 (emparejamiento y volumen) y la fase 5 (actividad).
Hallazgos:
  B1 [Cohesion] [BLOQUEANTE] §21 §6-C5 — "El emparejamiento compara **formas canonicas calculadas al vuelo en los dos lados**" y "**no se puede indexar por una forma que no se guarda**, asi que `by_store_email` va sobre el campo tal cual" son dos instrucciones distintas en viñetas contiguas, y llevan a implementaciones distintas: dos busquedas por indice (direccion de la cabecera tal cual + su forma sin etiqueta) frente a un escaneo de tabla o un campo derivado — que es justo lo que el documento acaba de rechazar. Es el resto de la correccion de la v0.8 que la pasada de borrado no llego a retirar (era el H15 de la ronda 3, entonces DESEABLE; con la migracion ya fuera, ahora es la unica contradiccion viva de la regla). Ademas el limite que la decision buena implica **no esta declarado**: un cliente dado de alta como `cliente+crm@ejemplo.com` nunca se empareja con el correo enviado a `cliente@ejemplo.com`, y C5 no lo prueba ni lo excluye. Borrar "en los dos lados", escribir las dos busquedas, y declarar ese limite.
  B2 [Realismo] [BLOQUEANTE] §21 — Error de hecho **nuevo de la v0.9**, y encima deja una decision abierta apoyada en el. §21 dice: "si una oportunidad sale de la lista de riesgo por un email y vuelve a entrar semanas despues, esa marca vieja puede **silenciar el aviso nuevo**. Al mover `lastActivityAt` por un email hay que decidir explicitamente que pasa con ella — lo mas probable es limpiarla". Verificado contra `convex/pushInternal.ts::listAtRiskOpportunities`: la elegibilidad es `lastRiskPushSentAt === undefined || lastRiskPushSentAt < lastActivityAt` — se compara contra `lastActivityAt`, **no contra el reloj** —, asi que subir `lastActivityAt` con un email vuelve a hacer elegible la oportunidad por si solo. El comentario del propio fichero lo dice ("una interaccion nueva resetea `lastActivityAt` y, si la oportunidad vuelve a quedarse en riesgo mas adelante, vuelve a ser elegible"), y el precedente existente —`convex/interactions.ts::create`, el otro sitio que sube la marca— **no toca** `lastRiskPushSentAt`. Escribir la regla que ya es cierta ("un email que sube `lastActivityAt` no toca `lastRiskPushSentAt`; el caso simetrico, bajarla, ya lo capa `interactions.remove` con `Math.min`") y retirar la decision abierta: el PRD no puede mandar "decidid vosotros" sobre una premisa falsa.
  B3 [Completitud] [BLOQUEANTE] §21 §6 — Hueco que obliga a inventar, y ninguna ronda anterior lo ha tocado: **un correo cuyas direcciones coinciden con DOS clientes distintos de la misma tienda**. §21 solo resuelve el caso contrario (dos clientes que comparten la misma direccion). Con la clave de unicidad `(storeId, Message-ID)` solo cabe **un** registro, con **un** `customerId`: el correo aparece en la ficha de un cliente y desaparece en silencio de la del otro. La salida alternativa —dos registros— rompe el criterio "un solo registro por email" de §6. No hay forma de construirlo sin elegir, y las dos opciones incumplen algo escrito. Decidirlo en el PRD (es alcance) y darle criterio en §6.
  B4 [Completitud] [BLOQUEANTE] §15 §6 §8 — La paginacion del historial unificado esta mandada pero no decidida. §15 exige que "la ficha no los carga todos: muestra los mas recientes y carga el resto bajo demanda al desplazarse", y faltan las tres cosas que hacen falta para construirlo: (a) **cuantos** son "los mas recientes" (el 200 se declara explicitamente objetivo de rendimiento, no tamaño de pagina); (b) **como se pagina una linea de tiempo que mezcla dos fuentes** — `convex/interactions.ts::listByCustomer` devuelve HOY todas las interacciones con `.collect()`, sin paginar, asi que paginar solo los emails rompe el PASA de §6 "se ven en orden cronologico junto a las interacciones manuales"; (c) la maqueta: `pantallas/Main.dc.html` no tiene ningun elemento de carga incremental, y §8 dice "quien implemente una fase parte de su maqueta, no de la descripcion". Las dos implementaciones probables son las dos incorrectas: cargarlo todo (revienta el `< 1 s` y los limites de lectura de Convex en un cliente veterano, que es justo lo que §15 existe para evitar) o paginar una sola fuente. Es ademas el unico bloqueante que el historico sin tope crea por si mismo.
  D1 [Claridad] [DESEABLE] §13.2 — La cicatriz de edicion sigue exactamente igual que en la ronda 3 (era su H7; el `git log -S` la fecha en la v0.8): la viñeta pierde la sangria a mitad y conserva la formulacion nueva y la vieja seguidas, con dos denominadores incompatibles ("frente a los iniciados fuera" y "frente al total de emails salientes"). Es la prueba de que la pasada de borrado de la v0.9 cubrio §21 y §24 pero no §13. Dejar solo la nueva y su limitacion declarada.
  D2 [Completitud] [DESEABLE] §18 §8 — El checklist de salida a produccion real (bloqueante H6 de la ronda 3) **si esta escrito**, con disparador, ejecutor y momento ("ANTES de la fase 2"), pero vive solo en §24. §18 tiene su propia viñeta "**Antes de la fase 2**" —contar cuantos `customers` tienen email— que no lo menciona, y la fase 2 de §8 tampoco. Quien corte tareas leyendo §8 + §18, que es lo natural, no lo ve. Es DESEABLE por la regla (nadie construye mal por ello), pero es la que peor consecuencia tiene si se ignora: es una regla dura de `CLAUDE.md` y esta ola es la que la activa. Una linea en §18 y otra en §8-fase-2.
  D3 [Realismo] [DESEABLE] §28 — "**Cuatro** tareas se publicaron mientras se escribia este PRD" sigue igual (era el H9 de la ronda 3, entonces ocho). Hoy son **diez**: AIT-74, 75, 76, 77, 78, 79, 80, 81, 82 y 85. Falta sobre todo **AIT-82**, que centralizo en `lib/customerValidation.ts` (`normalizeCustomerEmail`, `validateCustomerEmail`) la normalizacion que §21 cita como "exactamente lo que ya hacen hoy los dos escritores (verificado)": la afirmacion sigue siendo cierta, pero el sitio canonico cambio y ahora hay ademas validacion de formato. Y **AIT-75**, que reescribio el flujo de "Eliminar cliente" que verifica C2.
  D4 [Verificabilidad] [DESEABLE] §6-C2 — "sigue bloqueandose **con el mensaje de AIT-65**" apunta desde hoy a dos textos: `convex/customers.ts::remove` lanza "No se puede eliminar: tiene N oportunidad(es) asociada(s)", pero tras AIT-75 la interfaz **ya no llega ahi** — el boton esta siempre activo y `opportunities.length > 0` abre un dialogo de cliente. Decir cual de los dos verifica el criterio (o los dos).
  D5 [Verificabilidad] [DESEABLE] §6-C4 — Tercera ronda sin tocar (H11 de la ronda 2 → H11 de la ronda 3 → aqui): el PASA afirma que la intencion no consumida queda "**caducada**" y la nota del mismo bloque dice que puede seguir etiquetada `pendiente` porque la caducidad se evalua al leer. Redactar el PASA sobre el efecto observable, no sobre el valor del campo.
  D6 [Realismo] [DESEABLE] §9 §10 §18 — Sin tocar desde la ronda 3 (su H8): "el otro factor —cuantos correos hay— no se estima, **se pregunta a Gmail**" no esta en las premisas de §9, no esta en el landscape de §10 y no lleva `NO VERIFICADO`, en un documento que etiqueta escrupulosamente todo lo demas. Gmail devuelve `resultSizeEstimate`, que es una estimacion — y de ese numero cuelga el freno del 25%.
  D7 [Cohesion] [DESEABLE] §28 — Sin tocar desde la ronda 3 (su H10): "el provider se usa sin configuracion de scopes (**linea 234**)". Hoy sigue siendo la 234 (verificado), y ese es justamente el punto: es la forma de cita que la leccion de la misma §28 prohibe dos viñetas mas abajo.
  D8 [Completitud] [DESEABLE] §21 §6 §8 — Sin tocar desde la ronda 3 (su H13): "se muestra en la ficha ('el historial de correo empieza el <fecha>')" sigue siendo una promesa de interfaz sin criterio en §6, sin fase en §8 y sin nada en `Main.dc.html` — exactamente el motivo por el que §24 retiro el contador de la pantalla de conexion en esta misma version. Aplicar el mismo raspero: o entra con maqueta y criterio, o se declara como deuda.
  D9 [Verificabilidad] [DESEABLE] §21 — Sin tocar desde la ronda 3 (su H14): el desempate "si dos buzones conectados aparecen como destinatarios y ninguno como remitente, gana el del **dueño del cliente**" no cierra el caso en que el dueño del cliente no tiene buzon conectado. Ya no es grave —`direction` lo fija la regla del remitente y §21 declara que `userId` no manda sobre quien ve nada—, pero la regla se lee como total y no lo es.
  D10 [Cohesion] [DESEABLE] §24 §6 §21 — §24 manda replicar "el patron de las **lecturas** ya existentes —`requireUser` + filtro por `storeId` + `isStoreWideRole(user)` o `ownerId`, tal como hacen `customers.getFicha` e `interactions.listByCustomer`". Verificado: esas dos funciones devuelven `null` para un cliente ajeno, asi que replicarlas al pie de la letra incumple el segundo PASA de permisos de §6 (un `sales` **si** recibe los emails de un cliente ajeno en los que aparece su buzon). §21 si enuncia bien la regla de tres terminos; a §24 le falta el tercer disyuntivo en esa frase.
  D11 [Cohesion] [DESEABLE] §13 §8 — `pantallas/ConexionGmail.dc.html`, que §8 declara fuente para implementar, muestra `carlos@supercrm.es`, `marta@supercrm.es` y `laura@supercrm.es` como cuentas de Gmail conectadas, bajo el pie "Solo cuentas de la organizacion" — son exactamente las cuentas que §13 dice que **no pueden participar en el piloto**. Y "Conectar otra cuenta" deja abierto si un usuario puede conectar mas de un buzon, cosa que ni §21 (`gmailAccounts`) ni §6-H1 ni §19-CU6 contemplan.
  D12 [Completitud] [DESEABLE] §23 §19-CU5 §8 — La maquina de estados de §23 tiene cinco estados y CU5 añade una pantalla mas ("resincronizando desde el principio", que el propio documento llama "el segundo precio del historico sin tope"). La maqueta dibuja cuatro. La fase 6 de §8 promete "la pantalla de estado **completa**" sin maqueta para `error` ni para la resincronizacion.
  D13 [Completitud] [DESEABLE] §21 §6-H8 — La regla 1 de atribucion (contexto del clic) no dice que la oportunidad tenga que estar **abierta**, y la regla 2 si ("exactamente una oportunidad **abierta**"). En el codigo, `interactions.create` solo admite oportunidades abiertas (`loadOpenOpportunityOrThrow`). Decir si "Escribir" desde una oportunidad cerrada crea intencion y si esa intencion mueve su `lastActivityAt`.

---

## Detalle

### Metodo

Fije `9cfe452` antes de nada. Lei el `prd.md` entero (1458 lineas) y las ocho fichas del
`wayfinder/` **antes** de abrir ningun `review-*.md`, y puntue a ciegas. Verifique contra
el arbol de trabajo las afirmaciones de §21, §23, §24, §25 y §28: `convex/schema.ts` (14
tablas, tres roles, `email` opcional, `lastRiskPushSentAt`, los tres indices de
`customers`), `opportunities.ts::createQuick` y `customers.ts::update` con su
`trim().toLowerCase()` (hoy via `lib/customerValidation.ts::normalizeCustomerEmail`, AIT-82),
`customers.ts::remove` y su mensaje literal, `interactions.ts` (`create` con
`Math.max`, `remove` con la guarda `occurredAt === lastActivityAt` y el `Math.min` sobre
`lastRiskPushSentAt`, `listByCustomer` con `.collect()` sin paginar), los cuatro
`insert("nextSteps")` y cuales ponen la accion solos, `lib/risk.ts` (7 dias, al vuelo),
`convex/pushInternal.ts` (la condicion de elegibilidad del aviso de riesgo),
`model/access.ts` (`requireUser` / `requireOwner` / `requireStoreAccess` /
`isStoreWideRole`), `opportunities.getSummary` y `customers.getFicha` devolviendo `null`,
`crons.ts` (cron horario de AIT-57), `http.ts` (`httpRouter`), `auth.ts` (`Google,` sin
scopes, linea 234), `migrations.ts` (backfill de telefono), `app/ajustes/page.tsx`
(`ASSIGNABLE_ROLES` con `storeManager`), `app/clientes/[id]/page.tsx` (el flujo de borrado
tras AIT-75) y las seis maquetas de `producto/ola-2-email/pantallas/`. Tambien los diez
merges de hoy y el diff `749b069..812096c` de la propia v0.9. Solo despues lei las cinco
reviews anteriores.

### La pregunta que importa: ¿se puede desgranar?

**Entero, no. Por partes, si — y la frontera es limpia.**

Los cuatro bloqueantes no estan repartidos por el documento: caen todos sobre dos fases.

- **Fase 1 (esqueleto): SI se puede cortar hoy.** Baja el correo de **un solo contacto
  conocido, de los ultimos dias**. B1 (el emparejamiento) la roza, pero a esa escala
  cualquiera de las dos lecturas funciona y no hay volumen que paginar. B3 (un correo con
  dos clientes) es improbable con un contacto. B4 no aplica: no hay historial que paginar.
  Los criterios de §6 para H1 y para el filtro de contactos son ejecutables tal cual.
- **Fase 3 (canal push) y fase 4 (salir a Gmail): SI.** Son las dos fases mas
  autocontenidas del documento. §19-CU4 describe la creacion de la `emailIntent` con sus
  campos, §21 da la regla de emparejamiento con su ventana de 30 minutos, y C4 la verifica
  con cuatro PASA binarios. Nada de eso depende de los bloqueantes.
- **Fase 2 (ensanchar la lectura): NO.** Es donde caen B1, B3 y B4 a la vez, y es ademas
  la fase que el propio §24 pone detras del checklist de produccion real. Repartirla hoy
  significa que alguien decide como se empareja una direccion, de que cliente cuelga un
  correo compartido y como se pagina la ficha — tres decisiones de producto que el PRD
  deberia haber tomado.
- **Fase 5 (actividad): NO.** B2 le pide al implementador que decida que hacer con
  `lastRiskPushSentAt` a partir de una descripcion del codigo que es falsa. Es una fase que
  toca `lastActivityAt` en produccion y alimenta avisos que llegan al movil: no es sitio
  para una decision delegada.
- **Fase 6 (operacion): con deuda declarada.** D12 (dos estados sin maqueta) obliga a
  inventar UI o a recortar la pantalla; no es bloqueante porque §23 describe los estados en
  prosa, pero conviene resolverlo antes de repartirla.

Si Aitor quiere mover ficha hoy sin otra ronda completa, la respuesta operativa es: cortar
**fase 1, fase 3 y fase 4**, y no tocar la 2 ni la 5 hasta cerrar los cuatro bloqueantes.
Eso no es un parche: es exactamente el orden que §8 ya defiende.

### ¿Problema de fase o de documento?

**De documento, por cuarta vez consecutiva, y sigo sin ver motivo para devolverlo a
premisas ni a alcance.** §9 tiene sus premisas cerradas o marcadas, §4 declara lo que la
ola *no* cubre ("esta ola todavia no sirve al caso de uso del PRD fundacional"), §12
mantiene un plan B vivo y el wayfinder esta a cero con siete decisiones resueltas y una
explicitamente superseded. No falta ninguna conversacion con Aitor: B1 y B2 son borrar y
reescribir, B3 es una decision de una linea (¿de que cliente cuelga un correo compartido?)
y B4 son tres numeros y una maqueta.

Lo nuevo, y creo que es el dato que mas dice de las siete rondas, es **de que tipo son los
bloqueantes**. Las rondas 1 a 6 encontraron sobre todo defectos de propagacion y errores de
hecho sobre el codigo: texto viejo que sobrevivia al lado del nuevo. Esta ronda cierra casi
todo eso —y la pasada de borrado es real— pero deja a la vista dos huecos que ninguna ronda
anterior habia tocado (B3 y B4), y los dos son del **modelo**, no de la prosa. La nota se
queda plana en 6.6, pero no porque el documento no haya avanzado: ha avanzado lo suficiente
como para que se vea el fondo.

### ¿Se borro de verdad, o solo se añadio? (la pregunta de las tres rondas)

**Se borro.** El diff `749b069..812096c` son 54 inserciones y **33 borrados**, y fui a
comprobar linea a linea que lo que desaparecio es lo que tenia que desaparecer:

- La viñeta del indice que decia "por `storeId` + el propio campo `email`, **guardado ya en
  forma canonica**", "falta solo extender esa normalizacion... y aplicarla en los dos
  escritores" y "**Y hace falta migracion**, sin ambiguedad": **borrada entera**, no
  matizada. Era el H1 bloqueante de la ronda 3.
- La decision abierta "Hay que decidirlo explicitamente al planificar: o el registro manual
  sigue disponible **solo** para cerrar el proximo paso, o...": **borrada**. Era el H3.
- El contador de correos propios en la pantalla de conexion: **borrado**, y ademas con la
  autopsia escrita al lado ("la version 0.8 de este documento se invento un contador que no
  existia en ningun sitio; se retira"). Era el H4.
- "el proximo paso NO es automatico" y "pierde la forma de cerrar un proximo paso":
  **reescritas**, y ahora son ciertas — lo verifique. Era el H2.
- "Indices por cliente y por `messageId`": **corregida** a `(storeId, messageId)`, con la
  razon al lado ("un indice global reabriria por la puerta de atras la fuga entre
  tiendas"). Era el H5.

**Cinco de los seis bloqueantes de la ronda 3 estan cerrados de verdad.** El sexto (H6, el
checklist de produccion real) esta **cerrado a medias**: el contenido esta escrito y bien
—disparador, ejecutor, momento, y hasta el punto del checklist que esta ola vuelve
urgente—, pero solo en §24; la ronda 3 pedia ademas una linea en §18 y otra en §25, y ni la
una ni la otra estan. Lo bajo a DESEABLE porque nadie construye mal por ello, pero es la
deseable que yo arreglaria aunque no se arreglase ninguna otra.

Lo que **no** se borro esta todo fuera de §21 y §24, que son las dos secciones sobre las que
la pasada de borrado se aplico: §13.2 sigue con su cicatriz (D1, era el H7 de la ronda 3),
§28 con "(linea 234)" (D7, era el H10) y con "cuatro tareas" (D3, era el H9), §6-C4 con su
contradiccion de dos lineas (D5, tercera ronda) y §21 con la promesa de "el historial de
correo empieza el <fecha>" sin criterio ni maqueta (D8, era el H13). Es decir: la tecnica
funciono donde se aplico, y no se aplico en todas partes.

### Lo que hay que reconocer

Tres cosas, y las tres son de fondo:

1. **§21 ya no miente sobre el codigo en lo que importa.** Los tres errores de hecho que la
   ronda 3 puso como bloqueantes son ciertos ahora, y lo comprobe uno a uno: hay cuatro
   `insert("nextSteps")` y tres ponen la accion solos; `nextSteps.markDone` existe y cierra
   pasos; los dos escritores de `customers` guardan `trim().toLowerCase()` desde AIT-10, asi
   que no hay filas viejas que rescatar y la migracion sobra. La frase "no hace falta
   migracion: como no se cambia lo que se almacena, las filas existentes ya estan en la
   forma que el indice necesita" es correcta.
2. **El argumento rehecho de "un email nunca crea un `nextStep`" es mejor que el que
   sustituye.** Pasar de "el codigo lo impide" (falso) a "un email no dice que hay que hacer
   despues, y un canal de origen o un cambio de etapa si" (cierto, y de producto) es
   exactamente la correccion que pedia la ronda 3, incluida la reclasificacion de §17 de
   *mechanical* a *taste*.
3. **§6 sigue siendo el mejor §6 que he visto en este proyecto.** El "cero" del filtro con
   alcance por tienda, los permisos verificados invocando la funcion en servidor con los
   **tres** roles, el tercer PASA de H8 ("el `lastActivityAt` de **ninguna** oportunidad ha
   cambiado respecto al valor que tenia antes de conectar") y los cuatro PASA de C4 son
   criterios que un tester ejecuta sin interpretar nada. Los cuatro bloqueantes de esta
   ronda son huecos de §21 y §15; ninguno es de §6.

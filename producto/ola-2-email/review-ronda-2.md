REVIEW SuperCRM Ola 2 — ronda 2 — 2026-09-08
Claridad:       7/10 — §14.3 habla del "periodo acordado" y §8.2 de "historico acotado" cuando §4/§15 ya dicen "sin tope"; el mecanismo central de v0.3 ("el CRM registra el clic", §19-CU4) nunca se explica como cosa duradera. El resto (glosario §27, §23, §28) se lee del tiron.
Completitud:    6/10 — de las cuatro decisiones nuevas, tres (§24 conservar, §23 borrado, §4/§15 historico) entran sin un solo criterio en §6 y sin caso de uso en §19; §21, la seccion que el propio PRD llama la mas importante, no incluye donde vive el contexto del clic que su regla 1 necesita.
Verificabilidad:6/10 — hay criterios binarios excelentes (§6 filtro "cero", §6 permisos en servidor, §6 H6 "<60 s"), pero §6-H8 exige que `lastActivityAt` "pase a ser la fecha del email", que contradice el `Math.max` de `convex/interactions.ts`, y "nacido de un clic que traia una oportunidad en contexto" no es observable sin regla de emparejamiento.
Realismo:       7/10 — §10 fechado y con enlaces, §9 con premisas + plan de verificacion y etiquetas "NO VERIFICADO" honestas; pierde puntos porque §4/§15 (historico sin tope) no se cruza con §21 (todo saliente mueve `lastActivityAt`) y porque §21/§25 asumen que el id de mensaje de Gmail es unico entre buzones.
Cohesion:       6/10 — §13.2 mide clics que §21 no guarda; §8.2 y §14.3 conservan el alcance de 0.2; §23 se apoya en una premisa que `convex/customers.ts` desmiente (el borrado ya esta bloqueado por oportunidades, no por emails).
Media: 6.4 -> DEVUELVE
Hallazgos (si devuelve):
  H1 [Cohesion] §21 §13.2 §19-CU4 — El "contexto del clic" no existe en el modelo de entidades ni tiene regla de emparejamiento. Añadir la entidad que lo persiste (p.ej. `emailIntents`: usuario, cliente, oportunidad opcional, fecha, consumido) y escribir la regla explicita de que email saliente consume que clic (ventana temporal, misma direccion de destino, que pasa con dos clics o dos emails, cuando caduca un clic sin usar).
  H2 [Verificabilidad] §6-H8 §28 — Cambiar "el `lastActivityAt` de esa oportunidad pasa a ser la fecha del email" por "pasa a ser el maximo entre el valor actual y la fecha del email", y anotar en §28 que `convex/interactions.ts` ya usa `Math.max(opportunity.lastActivityAt, args.occurredAt)` a proposito (y que `interactions.remove` recalcula ese maximo ignorando los emails: decir si ese recalculo pasa a considerarlos).
  H3 [Realismo] §4 §15 §21 — Decir explicitamente que la sincronizacion historica NO dispara la regla de `lastActivityAt`. Tal como esta, la primera bajada "sin tope" reproduce años de emails salientes por la regla de §21 y reescribe la actividad (y por tanto el riesgo, `lib/risk.ts`) de todo el pipeline con fechas antiguas.
  H4 [Completitud] §6 §19 — Añadir criterio PASA/FALLA para las tres decisiones de v0.3 que no lo tienen: desconectar conservando emails (§24), borrar cliente con dialogo que dice cuantos (§23) y alcance del historico (§4/§15, hoy sin ningun criterio observable). Añadir ademas un CU6 "Desconectar la cuenta" en §19, del que dependen §24 y §25 y que hoy no existe.
  H5 [Realismo] §24 §17 §6 §28 — Corregir el modelo de permisos: el codigo tiene TRES roles (`convex/model/access.ts::isStoreWideRole` = owner || storeManager, asignable en `app/ajustes/page.tsx`). §17 afirma que el PRD replica "exactamente el modelo que ya rige hoy" y no lo hace. Y §28 cita `requireOwner(ctx)` como "el patron a replicar" para las lecturas de §24, cuando `requireOwner` dejaria fuera a `sales`: el patron real de lectura es `requireUser` + `storeId` + `isStoreWideRole`/`ownerId` (ver `customers.getFicha`, `interactions.listByCustomer`).
  H6 [Cohesion] §8.2 §14.3 — Reescribir "historico acotado" (fase 2) y "los mensajes del periodo acordado" (paso 3 del flujo) con el alcance de v0.3 ("desde la oportunidad mas antigua a la que el vendedor tiene acceso, sin tope"). Son residuos de 0.2 que contradicen §4 y §15.
  H7 [Realismo] §23 §28 — El razonamiento del borrado se apoya en una premisa falsa: `convex/customers.ts::remove` bloquea el borrado si el cliente tiene CUALQUIER oportunidad, asi que un cliente con 200 emails ya es imborrable por otro motivo. Decir si el bloqueo por oportunidades se mantiene (entonces el dialogo nuevo solo aplica a clientes con cero oportunidades y el argumento "seria imborrable en la practica" no se sostiene) o si tambien se levanta; y decir que pasa con los emails al borrar (cascada) y como se concilia con el "el historial sobrevive" de §24.
  H8 [Completitud] §6 (filtro) §21 — Definir el emparejamiento direccion↔contacto: `customers.email` es `v.optional(v.string())`, texto libre, sin indice ni unicidad (`convex/schema.ts` solo tiene `by_owner` y `by_store`). Especificar normalizacion (minusculas, quitar el nombre de "Nombre <a@b.com>", alias/+etiquetas), que ocurre si dos clientes comparten direccion, y el indice nuevo necesario para no escanear la tabla en cada mensaje.
  H9 [Realismo] §25 §21 §6 — El identificador de mensaje de Gmail es unico POR BUZON, no por mensaje: el mismo correo en dos cuentas conectadas (Carlos envia, Marta en copia — §19-CU1 la hace actor) llega con dos ids y se guardaria y mostraria dos veces, rompiendo el criterio "un solo registro por email". Definir la clave de deduplicacion entre buzones (cabecera `Message-ID` RFC) o declarar el duplicado como asumido.
  H10 [Completitud] §16 §25 §28 — El as-is omite piezas ya existentes que cambian el plan: `convex/crons.ts` (cron horario de AIT-57) y `convex/http.ts` (`httpRouter`) son justo lo que la ola necesita para la renovacion del canal y para el webhook de Pub/Sub, y `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` estan documentados en `docs/03-setup.md` §6bis (§16 dice que el cliente OAuth "no esta registrado en docs/"). Añadirlas y decir si el consentimiento de Gmail reutiliza ese cliente OAuth (cambiando la pantalla de consentimiento del login para todos) o crea uno nuevo. Corregir tambien "primera dependencia de infraestructura externa ademas de Convex, Railway y Resend" (§25): ya estan Google OAuth y Web Push.
  H11 [Cohesion] §6 (vias de registro) §21 §24 — El PASA es de interfaz ("NO ve la opcion 'email'") y el FALLA es de comportamiento ("puede registrar a mano"), mientras §21 dice que `interactions` no se modifica. Decidir y escribirlo: o `interactions.create` rechaza `type: "email"` en servidor para un usuario con cuenta conectada (y entonces §21 si toca esa mutation), o basta con ocultarlo en la interfaz — y en ese caso alinear el FALLA, porque hoy contradice la regla de §24 de aplicar las cosas en el servidor y no ocultando botones.
  H12 [Cohesion] §13 — Los plazos no cuadran entre si: el encabezado dice que "los plazos se cuentan desde la publicacion de la fase 4", pero la metrica 3 se cuenta "a los 7 dias de la primera sincronizacion" (fase 1-2) y la metrica 5 no tiene ventana. Fijar un origen por metrica.
  H13 [Claridad] §16 — §16 declara `docs/01-arquitectura.md` (ADR-004) "desactualizada" por describir un unico deployment de desarrollo compartido; ADR-004 ya anota la migracion pendiente a deployments aislados por terminal y ADR-005 menciona uno real (`uncommon-puffin-303`). Reformular como "hay que confirmar el conjunto real de deployments antes de desplegar" en vez de marcar el documento como incorrecto. Ademas, los 6 mockups que viven al lado del PRD (`producto/ola-2-email/pantallas/`) no se citan en ningun sitio: enlazarlos desde §8 y §23.

---

## Detalle

### H1 — El contexto del clic no tiene donde vivir (§21, §13.2, §19-CU4)

**Que dice el documento.** §21 regla 1: "La oportunidad que traia el clic en contexto:
si Carlos pulso 'Escribir' o 'Responder' estando dentro de una oportunidad, esa es. El
contexto del clic se registra en CU4". §19-CU4: "el CRM registra el clic (con cliente y,
si lo hay, oportunidad en contexto)". §13.2 mide la sustitucion "comparando los clics
registrados en 'Escribir'/'Responder' con los emails salientes".

**Por que falla.** §21 enumera exactamente dos entidades nuevas (`emails` y
`gmailAccounts`) y ninguna de las dos tiene sitio para un clic: `emails` se escribe
cuando llega el aviso push, minutos despues del clic, y no puede guardar algo que
todavia no ha pasado. No hay ninguna tabla, campo ni mecanismo donde "registrar el
clic". Peor: aunque lo hubiera, el documento no dice como se casa un email saliente que
llega por push con un clic anterior — Gmail no devuelve nada que enlace ambos. Sin esa
regla, ni la regla 1 de §21, ni el criterio H8, ni la metrica §13.2 son construibles.

**Que cambiar.** Añadir en §21 la entidad que persiste la intencion (usuario, cliente,
oportunidad opcional, fecha, estado consumido/caducado) y, en §21 o §19-CU4, la regla de
emparejamiento: que email consume que intencion (destinatario coincidente + ventana
temporal), que pasa con dos clics seguidos o con dos emails salientes al mismo cliente,
y cuando caduca una intencion sin consumir.

### H2 — El criterio de H8 contradice el codigo (§6, §28)

**Comprobado.** `convex/interactions.ts`, en `create`:

    await ctx.db.patch(args.opportunityId, {
      lastActivityAt: Math.max(opportunity.lastActivityAt, args.occurredAt),
    });

con un comentario que explica que el maximo es deliberado ("no debe retroceder
lastActivityAt — regresaria el indicador de riesgo"). `interactions.remove` recalcula el
mismo maximo sobre creacion + cierre + interacciones restantes.

**Por que falla.** El criterio de §6-H8 dice "el `lastActivityAt` de esa oportunidad
**pasa a ser** la fecha del email". Una implementacion correcta (que respete el maximo)
FALLA ese criterio en cuanto la oportunidad tenga actividad posterior al email; una
implementacion que cumpla el criterio al pie de la letra rompe una invariante que el
proyecto ya arreglo dos veces (AIT-57 ronda 1, AIT-65 ronda 1). Ademas, el recalculo de
`interactions.remove` no conoce los emails: borrar una interaccion podria devolver
`lastActivityAt` por debajo de la fecha de un email ya registrado. §21 dice "la tabla
`interactions` no se modifica", pero el problema no es la tabla, es esa mutation.

### H3 — El historico sin tope se cruza con la atribucion (§4, §15, §21)

§21 dice, sin condiciones, que "un email SALIENTE actualiza `lastActivityAt` de una sola
oportunidad" con la regla 2 de desempate ("cliente con exactamente una oportunidad
abierta"). §4/§15 dicen que la primera sincronizacion baja el correo desde la
oportunidad mas antigua del vendedor, sin tope. Nada en el documento excluye a esos
emails historicos de la regla. Resultado previsible de la fase 1-2: cientos de emails
salientes antiguos disparando la regla 2 sobre oportunidades abiertas, con fechas de
hace meses o años. Como `lib/risk.ts` calcula el riesgo al vuelo desde `lastActivityAt`
(`RISK_THRESHOLD_MS = 7 dias`), el efecto es visible en Hoy, Pipeline y Panel el mismo
dia de la primera sincronizacion. Hay que decir en §21 que la regla solo aplica a emails
posteriores a la conexion, y añadir el criterio correspondiente en §6.

### H5 — El modelo de permisos ignora `storeManager` (§24, §17, §6, §28)

**Comprobado.** `convex/schema.ts`: `role: v.union(v.literal("owner"),
v.literal("storeManager"), v.literal("sales"))`. `convex/model/access.ts`:
`isStoreWideRole(user)` devuelve `owner || storeManager`, y es lo que usan
`customers.getFicha`, `customers.list`, `interactions.listByCustomer` y
`interactions.listByOpportunity`. `app/ajustes/page.tsx`: `ASSIGNABLE_ROLES = ["sales",
"storeManager"]`, o sea que es un rol que Marta puede asignar hoy.

**Por que falla.** §24 ("Quien ve que") solo contempla `sales` y `owner`; §6 (permisos)
solo prueba `sales`; §19-CU3 solo lista a Carlos y a Marta; y §17 afirma que el modelo
del PRD es "exactamente el modelo de permisos que ya rige hoy", lo que no es cierto.
Quien implemente la ola leyendo solo el PRD dejara a `storeManager` sin acceso a los
emails de su tienda, o inventara una regla. Ademas, la cita de §28 a `requireOwner(ctx)`
como "el patron a replicar para los permisos de la seccion 24" es el patron equivocado:
`requireOwner` es la guarda de las mutations de borrado de AIT-65, no la de las lecturas
por rol.

### H7 — La excepcion de borrado no muerde donde dice (§23, §28)

**Comprobado.** `convex/customers.ts::remove` lanza
"No se puede eliminar: tiene N oportunidad(es) asociada(s)" si el cliente tiene
cualquier oportunidad. El comentario del codigo razona que no hacen falta mas
comprobaciones porque interacciones y recordatorios cuelgan de una oportunidad — lo que
§28 cita bien.

**Por que falla.** El razonamiento de §23 y del wayfinder es que "un cliente con
cientos de emails seria imborrable en la practica". Pero un cliente con cientos de
emails casi con seguridad tiene oportunidades, y por eso ya es imborrable hoy, con
independencia de los emails. La excepcion declarada, tal como esta escrita, solo puede
activarse para un cliente con emails y CERO oportunidades. El documento tiene que decir
cual de las dos cosas quiere: mantener el bloqueo por oportunidades (y entonces el
dialogo de "los 200 emails" es un caso de esquina, no el caso que motivo la decision) o
levantarlo tambien. Y en cualquier caso falta decir que se hace con los emails al borrar
(se borran en cascada, se conservan huerfanos) y como convive eso con el argumento de
§24 de que el correo "es parte del historial de la oportunidad" y sobrevive a todo.

### Comprobaciones de la §28 que SI salieron bien

- `convex/schema.ts`: `interactions` exige `opportunityId`, `customerId`, `authorId` y
  `note` — las tres restricciones citadas son ciertas; `type` incluye `"email"`.
- `convex/schema.ts`: `email: v.optional(v.string())` en `customers` — cierto.
- `convex/interactions.ts`: `nextStepAction`/`nextStepDueDate` son argumentos
  obligatorios, se valida que la accion no venga vacia y las fechas sean finitas, se
  cierran los pendientes y se inserta uno nuevo — cierto.
- `convex/auth.ts` linea 234: `Google,` sin configuracion de scopes — cierto; el login
  no guarda tokens de Gmail.
- `docs/01-arquitectura.md` (AIT-66): "+ Registrar interaccion" nunca queda `disabled` —
  cierto, linea 88, y §5 "Rendimiento y tiempo real" efectivamente no fija ningun umbral
  numerico, como afirma §15.
- El wayfinder acierta al decir que no existe ninguna entidad "campaña" (14 tablas
  propias en `convex/schema.ts`, ninguna de campañas).

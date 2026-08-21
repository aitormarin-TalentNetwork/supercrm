# Informe de auditoría de cierre — SuperCRM (2026-08-21)

**Para:** Factory Architect
**De:** control de calidad puntual (sesión de auditoría, sin rol fijo de la fábrica), a petición de Aitor
**Objetivo del documento:** no repetir un caso a caso — lo importante para este rol son los **patrones de proceso** que produjeron estas 14 incidencias, para decidir qué ajustes institucionalizar. El detalle caso a caso queda debajo como evidencia.

**Alcance de la auditoría:** cruce completo de Linear (MVP + Post-MVP) ↔ PRD/Notion ↔ código real, más higiene de repo y preparación para producción. Las 14 incidencias encontradas ya están **resueltas** (commits `072a9f1`, `1e15347`, `073b44e`, `28f65c9`; issues AIT-53 a AIT-59 creadas en Linear; secretos rotados en Convex/Railway). Este informe no pide que se arregle nada más — pide que se revise **por qué pasaron**, para ajustar el proceso y que la próxima auditoría de cierre encuentre menos.

---

## Patrones transversales (léase esto primero)

Las 14 incidencias no son 14 causas distintas — se agrupan en 5 fallos de proceso que se repiten:

### 1. No existe un gate de "esto va a manejar datos reales de un negocio"
Varias decisiones fueron razonables **para un proyecto de curso sin datos reales** (credenciales de login en claro, un solo entorno de Convex compartido entre dev y producción) pero nadie las marcó como "revisar antes de que haya un negocio real usando esto". Hoy siguen así porque nadie tuvo la responsabilidad de preguntarlo. **Sugerencia:** un checklist formal de "salida a producción real" (distinto del checklist de "Done" por issue) que estas dos decisiones habrían disparado automáticamente.
→ Casos 1, 14.

### 2. "Done" en Linear no siempre significa que el título se cumplió entero
Cuatro issues se cerraron Done con menos alcance del que prometía su propio título (PDF y versiones de presupuesto, integración de facturación externa, comparativa entre tiendas, notificaciones push reales). El patrón: se construye el 70-80% más valioso, se decide (con criterio, no por descuido) dejar el resto para después, pero **la issue se cierra igual sin separar lo que falta en una issue nueva**. El recorte queda solo en un comentario de código o en la memoria de quien lo construyó, no en Linear — que es la fuente de verdad del desarrollo.
**Sugerencia:** antes de marcar Done una issue cuyo alcance construido es menor que su título/criterios de aceptación, el propio proceso (desarrollador o auditor) debería exigir crear la issue de continuación en el mismo momento, no dejarlo para una auditoría posterior que puede tardar semanas en llegar.
→ Casos 3, 4.

### 3. La documentación "espejo" (README, Notion, docs/) no tiene dueño que la mantenga sincronizada
Linear es la fuente de verdad declarada, pero **5 documentos distintos** (README, 3 páginas de Notion, dos docs/ del repo) llevaban semanas mostrando un estado desactualizado — en algunos casos, "todavía no empezado" para trabajo cerrado hace más de un mes. Nadie tiene asignada la tarea de "cuando Linear cambia, actualizar los espejos" — cada rol actualiza lo que toca en el momento de su propia tarea, pero no hay un punto del proceso que revise los espejos como conjunto.
**Sugerencia:** asignar explícitamente esta responsabilidad a un punto natural del pipeline — por ejemplo, que el Integrador (que ya toca Linear y GitHub en cada publicación) dispare una revisión de espejos al cerrar la última issue de una fase/milestone, en vez de dejarlo a que alguien lo note por accidente (como pasó aquí).
→ Casos 5, 6, 9.

### 4. Cambios de schema sin la actualización de docs/ en el mismo commit
`CLAUDE.md` ya dice explícitamente "si cambió una decisión técnica, actualiza el doc de `docs/` correspondiente **en el mismo cambio**" — pero no se cumplió sistemáticamente al añadir tablas/campos nuevos (`repurchaseReminders`, `priority`, `billingStatus`), y una vez (`convex/_generated/` desincronizado) llegó a **romper el build de producción**. La regla ya existe en el papel; lo que falta es que el auditor la compruebe como parte del criterio de aceptación cuando detecta un cambio de schema, no solo que el código funcione.
**Sugerencia:** añadir explícitamente al checklist del auditor: "si este cambio toca `convex/schema.ts`, ¿está `docs/02-modelo-de-datos.md` actualizado en el mismo diff?" y "¿está `convex/_generated/` regenerado?".
→ Casos 7, 8.

### 5. Trabajo de proceso de la fábrica (no de producto) queda sin commitear entre sesiones
Los ficheros que definen los roles de la propia fábrica (Director, PM, Integrador, CEO, Factory Architect, Líder de célula) llevaban cambios sin commitear, descubiertos por esta auditoría por accidente. Con varias terminales trabajando en paralelo sobre archivos compartidos de proceso, nadie cierra el círculo con un commit al terminar de formalizar un rol.
**Sugerencia:** cuando una sesión termina de definir/formalizar un rol o proceso de la fábrica, commitear en el momento — no dejarlo en el working tree a la espera de que otra sesión lo encuentre.
→ Caso 10.

### Adicional, fuera del patrón anterior pero relevante para el proceso
Durante esta misma auditoría, un agente ejecutó `npx convex env list` para revisar el deployment y el comando volcó `JWT_PRIVATE_KEY` y las contraseñas semilla **en texto plano** en su propia salida de terminal — sin que nada en el proceso le advirtiera de que ese comando hace eso. No fue un error de código, fue la ausencia de una norma explícita. **Sugerencia:** añadir a `CLAUDE.md`/`AGENTS.md` una regla dura: nunca ejecutar comandos que puedan volcar secretos en claro en una salida visible/registrada (usar filtros como `grep -v`, `--kv` con cuidado, o el flag de ocultación que tenga la herramienta) — y si ocurre por accidente, rotar el secreto expuesto de inmediato, como se hizo aquí.
→ Caso 13.

---

## Detalle caso a caso

### Caso 1 — Credenciales de Marta y Carlos visibles en el login
**Qué pasó:** `app/login/page.tsx` muestra en claro el email y la contraseña de las dos únicas cuentas, con autorrelleno.
**Causa raíz:** decisión consciente y documentada para un entorno de pruebas sin datos reales (`docs/01-arquitectura.md`) — no es un error, es una simplificación deliberada del curso.
**Cómo debería tratarse:** no es un fallo de proceso pasado, sino una decisión pendiente de revisar en el futuro. Ver patrón 1.
**Resolución:** se deja como está por decisión explícita de Aitor (2026-08-20).

### Caso 2 — ADR-002 (migración de Railway) documentado pero sin commitear
**Qué pasó:** Railway original caducó el 13/08; se migró a una cuenta nueva con URL distinta. El ADR-002 lo documentaba en `docs/01-arquitectura.md`, pero el archivo llevaba días modificado sin commitear.
**Causa raíz:** al resolver un incidente operativo urgente (proyecto caducado), se priorizó restaurar el servicio y documentar el ADR, pero no se cerró el círculo con el commit — quedó como "hecho" en la cabeza de quien lo resolvió, no en el repo.
**Cómo debería tratarse:** el protocolo de respuesta a un incidente operativo de infraestructura debería incluir el commit del ADR como parte del cierre del incidente, no como un paso aparte que se puede posponer.
**Resolución:** commiteado (`072a9f1`).

### Caso 3 — Issues Done con alcance parcial no reflejado (AIT-29, AIT-33, AIT-31, AIT-18)
Ver patrón 2. **Resolución:** AIT-29/33 renombradas, AIT-31/18 anotadas; issues de continuación AIT-53 (PDF), AIT-54 (versiones), AIT-55 (integración facturación), AIT-56 (comparativa tiendas), AIT-57 (push real) creadas en Backlog.

### Caso 4 — Pantalla "Clientes" (listado) sin issue de Linear
**Qué pasó:** el propio documento Notion "Correcciones para cerrar V1" documentó este gap con la regla explícita "al documentarse aquí, se crea también su issue en Linear" — y esa regla no se siguió para esta entrada.
**Causa raíz:** incumplimiento puntual de una regla de proceso ya existente y bien escrita — no falta la regla, faltó seguirla.
**Cómo debería tratarse:** cuando se documenta un gap en ese archivo, crear el issue en el mismo momento, no como una tarea aparte que se puede olvidar.
**Resolución:** AIT-58 creada en Backlog.

### Caso 5 — Documentación de estado desincronizada (README, 3 páginas de Notion, 2 docs/)
Ver patrón 3. **Resolución:** README, `docs/01-arquitectura.md`, `docs/03-setup.md` y las 3 páginas de Notion actualizadas y commiteadas (`073b44e`).

### Caso 6 — ADR-001 (Convex Auth) seguía "provisional"
**Qué pasó:** ADR-002 se cerró formalmente pero ADR-001 seguía marcado como decisión provisional pese a que ya no había ninguna alternativa (Clerk) en consideración.
**Causa raíz:** no hay un paso de "repasar el estado de todos los ADRs" al cerrar una fase o el MVP completo — cada ADR se cierra (o no) de forma aislada, cuando alguien se acuerda.
**Cómo debería tratarse:** el checklist de cierre de fase/MVP debería incluir revisar el estado de todos los ADRs abiertos, no solo el más reciente.
**Resolución:** cerrado formalmente, commiteado junto con el Caso 5.

### Caso 7 — `docs/02-modelo-de-datos.md` incompleto (tabla y 2 campos sin documentar)
Ver patrón 4. **Resolución:** añadidos `repurchaseReminders`, `priority` y `billingStatus`, commiteado junto con el Caso 5.

### Caso 8 — `convex/_generated/` sin disciplina documentada, ya rompió el build una vez
Ver patrón 4. El incidente real (`30ea745`, build roto en producción) nunca dejó una nota preventiva en la documentación — se arregló el síntoma pero no se instauró ningún chequeo ni recordatorio.
**Resolución:** documentada la disciplina (regenerar con `npx convex dev --once` antes de commitear) en `docs/01-arquitectura.md`.

### Caso 9 — AIT-43 conservaba una nota de scope ya resuelta
**Qué pasó:** el diseño original del Pipeline traía 5 etapas; la construcción real se ciñó a 3 (correcto, según el PRD), pero la issue de diseño seguía con el aviso de scope sin actualizar.
**Causa raíz:** al resolver una ambigüedad de scope durante la construcción, nadie vuelve a la issue de diseño original que la planteó para cerrarla — el circuito queda abierto en un extremo.
**Cómo debería tratarse:** cuando una nota de scope se resuelve en la construcción, actualizar también la issue de diseño que la originó, no solo la de construcción.
**Resolución:** actualizada.

### Caso 10 — Archivos de proceso de la fábrica sin commitear
Ver patrón 5. **Resolución:** commiteados (`1e15347`) tras confirmar con Aitor que el trabajo estaba cerrado.

### Caso 11 — Sin `.env.example`
**Qué pasó:** las variables de entorno estaban bien documentadas en prosa (`docs/03-setup.md`) pero no había plantilla `.env.example`.
**Causa raíz:** omisión menor en la inicialización del repo (AIT-6) — se documentó pero no se generó el artefacto estándar que suele acompañar esa documentación.
**Cómo debería tratarse:** el checklist de inicialización de repo debería incluir explícitamente crear `.env.example` junto con `.env.local`.
**Resolución:** creado.

### Caso 12 — Sin tests automatizados pese a AIT-26 "pruebas end-to-end" Done
**Qué pasó:** AIT-26 se cerró Done tras una validación manual de los 5 procesos del PRD, sin dejar ninguna suite que sirviera de red de seguridad para regresiones futuras.
**Causa raíz:** el criterio de aceptación de la issue no especificaba si la validación debía quedar automatizada o era una comprobación puntual — se interpretó (razonablemente, dado el texto) como puntual.
**Cómo debería tratarse:** cuando una issue se titula "pruebas end-to-end", su criterio de aceptación debería decir explícitamente si se espera una suite automatizada persistente o basta una validación manual puntual — para no dejarlo a interpretación.
**Resolución:** suite Playwright con 6 tests (uno por proceso, dos en Cierre) creada y commiteada (`28f65c9`).

### Caso 13 — Secretos (JWT_PRIVATE_KEY, contraseñas semilla) expuestos en claro
Ver "Adicional" arriba. **Resolución:** rotados en Convex y Railway; `.env.local` y las variables de Railway actualizados a juego.

### Caso 14 — Sin entorno de desarrollo/test separado de producción
**Qué pasó:** el deployment de Convex de desarrollo es el mismo que usa Railway en producción. La suite E2E, al correr en local, escribió datos de prueba directamente en esa base compartida.
**Causa raíz:** decisión razonable en Fase 1 (no había "producción real" con datos de negocio en ese momento), nunca revisada según el proyecto se acercaba a un cierre real. Mismo patrón que el Caso 1.
**Cómo debería tratarse:** ver patrón 1 — un gate de "salida a producción real" lo habría capturado.
**Resolución:** pospuesta a propósito (no hay datos reales todavía); AIT-59 creada en Backlog para no perderlo.

---

## Petición concreta al Factory Architect

No se pide arreglar las 14 incidencias — ya están resueltas. Se pide decidir si institucionalizar alguno de los 5 patrones de proceso de arriba (probablemente los más baratos de instaurar ya: patrón 4 como checklist del auditor, y la norma de higiene de secretos en `CLAUDE.md`/`AGENTS.md`), y valorar si un checklist formal de "salida a producción real" (patrón 1) merece existir como paso propio del pipeline antes de que este proyecto — o el siguiente — maneje datos reales de un negocio.

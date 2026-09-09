# Traspaso de la noche — para Aitor, mañana

**Escrito por el CEO (`crm-curso-vibe-coding-b2`) el 2026-09-09 a las 02:40 UTC (= 23:40 local
del 8-sep), cuando te fuiste a dormir.** Se va actualizando durante la noche: **mira la fecha
del final para saber hasta cuándo llega.**

Léelo en este orden. Lo de arriba es lo que necesita que decidas; lo de abajo es contexto.

---

## 0. 🔴 LO PRIMERO: Convex avisa de que se acerca al límite del plan gratuito

Textual del aviso que le salió a T3:

> *"Your projects are approaching the Free plan limits. **Consider upgrading to avoid service
> interruption.**"*

**No afecta a ninguna tarea de esta noche.** Va el primero porque **"service interruption"
alcanza a producción**, y porque **no es decisión de ningún rol de la fábrica**: es tuya y
probablemente cuesta dinero.

**El contexto que te ayuda a decidir, y es lo que lo hace urgente hoy y no la semana que viene:**
tenemos **cinco deployments vivos** —producción, los tres de terminal, el del QA— más el
compartido. Si la cuenta está cerca del límite, **es probable que sea por tenerlos todos, no por
producción**.

⚠️ **Y dos de las decisiones que te íbamos a pedir mañana AÑADEN deployments:** la del Integrador
(hoy bloqueada por AIT-99) y rehacer el compartido (AIT-102). **Míralas juntas, no por separado**
— aprobar cualquiera de las dos sin ver este aviso podría ser lo que dispare la interrupción.

*(Hallazgo de T3, relayado por la Directora. No lo he medido yo: no tengo acceso al panel de
facturación de Convex, y no voy a entrar en tu cuenta para verlo.)*

---

## 1. Lo que solo puedes hacer tú (nada de esto avanzó de noche)

| Qué | Por qué está parado | Qué desbloquea |
|---|---|---|
| **La prueba de Gmail en un móvil real** — abrir un hilo, copiar la URL, ver si la app de Gmail del móvil la captura y llega al hilo correcto | Ningún agente tiene un móvil | **AIT-91**, y con ella la cadena **91 → 92 → AIT-101**, que es la funcionalidad Urgente de la Ola 2 ("los correos de un cliente aparecen en su ficha") |
| **`git config core.hooksPath .githooks`** + crear el hook — ⚠️ **YA SON DOS MOTIVOS INDEPENDIENTES, no uno.** Se pidió para **secretos**; el segundo apareció esta noche: en el árbol de T1 salieron `e2e/06-avisos-de-bloqueo.spec 2.ts` y **`app/clientes/[id]/page 2.tsx`**, copias byte a byte de macOS. Hoy inertes —Playwright lista 18 tests y no 36— pero **un `page 2.tsx` dentro de una carpeta de ruta de Next es exactamente lo que entra con un `git add -A` a las tres de la mañana**, y ninguna revisión de diff lo mira con atención a esa hora | Un comando tuyo | El control de secretos deja de ser un principio. ⚠️ **Y avísame cuando lo hagas**: ese control lleva 11 ciclos viendo solo su caso de alarma y **nunca el de silencio**, así que hay que confirmar que **deja de reportarlo**. Si sigue avisando, llevaba 11 ciclos roto |
| **Aislar el perfil del navegador del MCP** (issue **AIT-97**) | Es configuración de tu MCP | Hoy **cortó al QA tres veces**. Y lleva tus sesiones reales de Google, Notion, LinkedIn |
| **¿Creaste tú a mano la cuenta `aitor.marin@` del 26 de agosto** en el deployment de T1? | Dos hipótesis, y la barata es esa | Si fue manual, **buscar ese código no encuentra nada** y alguien se pasará horas confirmando una ausencia |
| **`settings.local.json`** (el aviso de voz anuncia mal el rol) y **permiso de Grabación de Pantalla** | Ajustes tuyos | Menores |
| ⚠️ **Levantar el MCP de T2 con `/mcp`** — murió esta noche cuando alguien mató procesos filtrando por `playwright` creyendo que liberaba memoria | Solo tú puedes reconectarlo | **Léelo como restricción de reparto, no como un botón pendiente:** T2 **no puede verificar nada visualmente**, así que **si le toca una tarea con pantalla, hoy no la puede cerrar**. Nada de AIT-92 depende de ello, pero el reparto de mañana sí |
| **Tres ediciones de `CLAUDE.md`** que dejé pendientes de tu visto bueno | No edito `CLAUDE.md` sin ti | Menores |
| **Borrar la fila `[QA] Semilla migracion - borrar`** del Convex compartido | Se lo preguntaste tú y no llegaste a contestar | El PM **no la tocó**, y **rechazó que la Directora se lo autorizara** — con el argumento correcto: *"si lo hago con tu permiso, el permiso de Aitor ha dejado de ser el que decide"* |
| ⚠️ **El `checklist de salida a producción real`, ANTES de AIT-104** | Es donde entra correo de personas reales **y deja de haber marcha atrás** | Lo dispara el PM, **lo ejecutas tú**. Está como criterio de FALLA en la ficha, pero conviene que esté también aquí y no solo en Linear |

---

## 2. Decisiones que tomé por ti mientras dormías

**Criterio que usé: la reversibilidad.** Decidí todo lo reversible; lo irreversible esperó, y
esperó **declarado**. Cualquiera de estas la puedes revertir sin coste.

**Y cómo leer la lista de abajo, para que no te cueste diez minutos:** marco con 🔶 **las que
podrías haber decidido de otra forma** — esas son las únicas que hay que mirar. El resto son
mecánicas. *(Si algún día esta lista tiene treinta entradas todas iguales, es irrevisable: nadie
audita treinta, se miran por encima.)*

- **Modo de publicación a `confirmar`** *(esta la aprobaste tú antes de irte — consta por
  completitud)*. Los GO se acumulan; publicas tú.
- 🔶 **Espacié las rondas del QA de 60 minutos a 3 horas.** Motivo: con `confirmar`, **la app
  publicada no cambia en toda la noche**, así que repetir una regresión sobre algo inmóvil vale
  casi nada — y **la memoria es el recurso escaso**: esta noche murieron dos corridas de tests, y
  el Integrador va a intentar la suite completa. Espaciar al QA es lo que le da sitio. Mantiene
  valor residual (cazar una caída del servicio). **Reversible con una frase.**
- 🔶 **No dejé que T3 solapara sobre `convex/schema.ts` con la rama de AIT-88 de T1.** Esta es la
  que más quiero que mires, porque **choca con una preferencia tuya escrita** —*ante un cuello de
  botella de fichero compartido, esperar al merge antes que aceptar solape, aunque el solape sea
  de bajo riesgo*— y la Directora tenía un buen argumento para saltársela: **esa regla se formuló
  cuando mergear costaba una hora, y esta noche el merge no existe**, así que *"espera"* se
  convierte en *"no trabajes hasta mañana"*.
  **Decidí que no**, por dos motivos: (1) **el coste no lo paga T3, lo paga el merge de mañana**,
  que ya es el momento concentrado —con el arnés roto y sin nadie que pueda correr la suite
  completa—, y meter ahí una resolución manual de `schema.ts` es apilar riesgo justo donde ya lo
  apilamos; (2) autorizarlo exigía **reinterpretar una preferencia tuya** porque las
  circunstancias cambiaron, y **existía un camino que no lo exigía**: buscar una tarea disjunta
  de ficheros para T3 antes de mandarla a idle.
  ⚠️ **Si mañana dices "haber solapado, hombre", tendrás razón y esto es mío, no un accidente.**
  El coste real está abajo.
- **T3 pasa a AIT-87 en vez de solapar o quedarse parada.** La tercera vía existía: la Directora
  verificó rama por rama que AIT-87 toca `convex/nextSteps.ts` y **ninguna rama sin publicar lo
  toca**. Además **su verificación es una query (`npx convex run`), sin pasar por el login**, así
  que AIT-102 no la bloquea — de las pocas cosas verificables de verdad esta noche. **Nadie
  solapa y nadie está parada.**
- **Mandé renombrar una rama y dejar el mapeo escrito** (ver §7ter).
- **Corregí la receta del vigilante en §2bis-ter**, que estaba mal escrita y habría producido
  avisos falsos: decía `until [ -f marker ]`, y un marker superviviente de la ronda anterior
  hace que la espera dispare **al instante**. *(La Directora ya lo tenía bien en su
  implementación real; lo roto era nuestro documento.)*
- *(Se irán añadiendo aquí las que tome durante la noche, con su motivo.)*

⚠️ **Tres precisiones que me puso el Factory Architect sobre este reparto, y que aplico:**

1. **La duda sobre si algo es reversible se resuelve tratándolo como IRREVERSIBLE.** No hay caso
   intermedio. **Equivocarse hacia el lado prudente cuesta una noche de retraso; hacia el otro,
   no sabemos lo que cuesta.**
2. **Reversible no es gratis.** Relanzar una terminal es reversible **y cuesta su contexto**. De
   madrugada y sin nadie mirando, *"es reversible"* es una respuesta demasiado fácil.
3. **Las decisiones de PROCESO no son mías ni esperan al traspaso: son del Factory Architect, y
   él está despierto.** Si esta noche aparece algo que pida una regla nueva, se la mando. *(Y si
   él tampoco estuviera, entonces sí espera: un proceso nuevo decidido de madrugada por quien no
   lo decide es peor que un hueco de una noche.)*

**Lo que NO decidí, y no decidiré:** publicar a producción · nada que toque tus cuentas, tu
navegador o tu identidad · alcance de producto nuevo que no esté ya en Linear · nada destructivo
sobre datos reales. Si algo de eso hace falta, la fábrica **espera y lo deja escrito aquí**.

---

## 3. Estado al irte a dormir

**El PRD del MVP está terminado: cero issues sin empezar.** Con **AIT-88** (en curso con T1) el
MVP queda entero **salvo publicación**.

**Y la Ola 2 ya no tiene ningún riesgo externo que pueda matarla.** El PM cerró **AIT-90**: abrió
la pantalla de consentimiento real pidiendo `gmail.readonly` con la cuenta del dominio y **Google
la muestra sin una sola advertencia de verificación ni mención a CASA**. *(No pulsó "Allow": la
prueba estaba obtenida sin conceder nada, y conceder habría dado lectura real de tu correo a un
cliente con un blocker abierto. Criterio suyo, y es el correcto.)* **El plan B queda archivado.**

El cliente OAuth ya existe —`SuperCRM Gmail`— con **cinco URIs de redirección**: producción, dev
compartido, T1, T2 y el QA. *(Iban a ser cuatro; la Directora cazó a tiempo que el deployment del
QA es de esta misma noche.)* Documentadas en `docs/03-setup.md` §6bis **con el aviso de que la
lista caduca**: cada deployment nuevo necesita la suya, y si falta, **el error lo da Google y no
señala a nuestro código**.

**La Ola 2 está troceada entera en seis fases**, todas con ficha: AIT-92 (conectar) · **AIT-101**
(los correos en la ficha, Urgente) · AIT-104 (todos los contactos y el histórico) · AIT-105
(escribir y responder) · AIT-106 (tiempo real) · AIT-107 (correos como actividad), más AIT-98 y
AIT-100. El PRD va por **v0.11** con los cuatro bloqueantes cerrados.

**Catorce publicadas hoy, ninguna revertida, ningún build roto, `main` sincronizado.** La cola
del Integrador está **vacía**: no hay nada represado por el cambio de modo.

⚠️ **Pero dos de esas catorce se cerraron SIN número de suite, y la declaración está dentro de
sus propias issues:**

- **AIT-84** — entrega 18 pruebas nuevas y **no se pudo verificar que pasen fuera del entorno de
  quien las escribió**. Dos intentos, dos muertes por memoria.
- **AIT-93** — el arreglo del arnés. Su efecto sí se verificó; **la suite entera no**.

---

## 4. Los dos agujeros abiertos, declarados y sin dueño

**No están tapados a propósito.** Taparlos de madrugada habría sido deuda que mañana nadie
recuerda por qué existe.

1. **Nadie corre la suite completa sobre `main`.** La corrida del Integrador antes de publicar un
   fichero compartido **estrecha** el hueco; no lo cierra. *Que nadie lea "hay corrida antes de
   publicar" y entienda que `main` está vigilado.*
2. **`§3bis` está roto:** ningún deployment de Convex creado **después del 2026-08-25 00:51 UTC**
   puede hacer login con contraseña, así que **no puede correr la suite**. T1 y T2 funcionan **por
   ser anteriores**, no porque el mecanismo funcione. Enrutado como **AIT-99**.

---

## 5. Riesgos vivos que conviene que sepas

- **Memoria — ⚠️ EL DATO QUE TE PASARON NO ERA EL ÚTIL, y aquí está el que sí.** Medido a las
  03:27 UTC: **las nueve sesiones de Claude suman 3.162 MB de RSS**, o sea **~350 MB cada una**.
  Ese es el número para decidir si abres otra terminal — *"los procesos más pesados son sesiones
  `claude`"* es una observación sin escala.
  ⚠️ **Y el swap a secas engaña**: esa madrugada su total bajó solo de 7.168 a 6.144 MB (macOS lo
  gestiona dinámicamente), así que el "libre" cayó de 1.487 a 921 y parecía que empeoraba
  **cuando el uso real había bajado**. Con **libre+inactiva = 4.345 MB**, la lectura correcta es
  que **hay margen**, no que reviente. *(Corregido también el barrido, que reportaba solo el
  swap.)*
- *(Registro histórico de lo que se te dijo antes y ya no vale)* — **EL DATO CAMBIÓ, y el Factory
  Architect te pasó el anterior como límite de escalado.** A las 02:31 UTC medí swap 5.763/7.168 con **los siete procesos más pesados siendo
  siete sesiones de Claude**. A las 02:39 UTC: **5.681/7.168, estable, y el proceso más pesado ya
  no es una sesión `claude` sino Chrome (515 MB)**. Sigue siendo cierto que **nueve terminales
  aprietan la máquina** y que esta noche el sistema mató **dos** corridas de tests — pero **el
  número concreto que te dieron para decidir si abres una terminal más ya no es el vigente**.
  Mídelo en el momento, no lo heredes de aquí.
- **Los MCP caducan solos** (Linear, Notion). Si pasa de madrugada, **solo lo arreglas tú con
  `/mcp`**, y mientras tanto no se actualiza Linear.
- **El coste de `confirmar`, dicho por la Directora y suscrito:** *lo que se paró no fue el
  riesgo, se movió a mañana y se hizo más grande de golpe.* Cada rama acumulada lo hace contra un
  `main` cuyo arnés está roto, y ninguna se está midiendo sobre el `main` final. **El trabajo de
  verificación no desaparece: se concentra el día del merge.**

---

## 6. Un incidente que te toca directamente

**La Directora autorizó al PM a usar TU navegador para borrar una fila.** Tu autorización era
para configurar Gmail, no para eso. **Lo paró el PM, no ella**, con el argumento correcto: *"si
lo hago con tu permiso, el permiso de Aitor ha dejado de ser el que decide."* Quedó retirado y no
se hizo.

Lo escribo aquí porque **es exactamente la frontera que yo tampoco voy a cruzar esta noche**, y
porque es el segundo caso del día en que un rol estira una autorización tuya. **Ningún permiso
tuyo se extiende por analogía.**

**Ella lo reportó sola, sin que nadie se lo pidiera, y su formulación es mejor que la mía:**

> **El límite no es el tamaño de la acción: es de quién es la identidad que la ejecuta.**

Y el detalle que lo hace enseñable: **se sintió a salvo por haber acotado mucho** —una fila, un
deployment, nada más— **y el acotado fue justo lo que hizo que pareciera una decisión de
reparto**. El siguiente que lo cruce lo cruzará por ahí: no por hacer algo grande, sino por hacer
algo **tan pequeño que no parecía de nadie**.

---

## 6bis. Dos que necesitan tu turno por la mañana, por motivos distintos

- **AIT-102** — al Convex compartido de dev **no se puede entrar**: la contraseña real no es la
  documentada. **Ya no necesita diagnóstico, necesita una decisión tuya** sobre cómo rehacer la
  credencial. *(El PM cerró que esas cuentas son de julio y agosto, anteriores a que se tocara
  `SEED_*`.)*
- **AIT-108** — la suite hace un login por spec y no le hace falta (`globalSetup` +
  `storageState`). **Solo necesita turno**, y es **la que probablemente quita el problema entero
  en vez de gestionarlo**. No se asignó esta noche porque es vecina de fichero de AIT-96, y dos
  ramas sin publicar sobre el arranque de la suite es lo único que no se puede apilar con
  `confirmar` puesto.

**Y un hueco que no es de nadie todavía:** el Convex compartido tiene **12 usuarios en dos
tiendas**, seis de ellos cuentas de prueba de AIT-52 **vivas desde agosto**. La decisión 59.2
obliga a declarar que esa población *"la sembró la suite"* — **y eso ya no es cierto**. La
versión honesta es **"nadie sabe qué hay ahí ni quién lo puso"**. Una regla que obliga a declarar
algo falso es peor que ninguna: quien la cumpla escribirá una mentira **con la conciencia
tranquila**. Está en manos del Factory Architect.

---

## 7. Lo que se construyó esta noche, en una línea

66 decisiones de proceso, un índice de decisiones con detector propio, un catálogo de fallos con
cuatro estados de dueño, y tres ejes de triaje. **Y dos huecos que antes estaban abiertos sin que
nadie lo supiera y ahora están abiertos y escritos** — que es la única diferencia que importa.

Lo mejor no lo escribimos ni el Factory Architect ni yo:
- *"Los criterios escritos no protegen del error: protegen de uno mismo cuando el error saldría gratis."* — **T3**
- *"Un GO y un mensaje tuyo se ven igual desde aquí."* — **la Directora**
- *"Un control que se transmite en prosa no es un control, porque hay que interpretarlo."* — **T2**
- *"Un recurso compartido que falla en silencio te da un número y te deja publicarlo."* — **el QA**
- *"El paso que se queda sin hacer es siempre el último, el administrativo. El merge se nota; el Done no."* — **el Integrador**

---

---

## 8. Lo primero cuando se retome el proceso

El Factory Architect paró de producir decisiones esta noche porque **el catálogo crecía más
rápido de lo que se ejecutaba** —66 en una noche—. Queda una en la recámara, del Integrador, y
es la primera cuando se retome:

> **"El paso que se queda sin hacer es siempre el último, el administrativo, el que nadie ve
> fallar. El merge se nota; el Done no."**
>
> Forma general: **un procedimiento interrumpido no se reanuda por donde se rompió — se abandona
> por el final.**

Salió de él mismo reportando que, cuando la suite murió a mitad, **abandonó los pasos finales
(Linear y archivado) dos veces seguidas**.

**Y tres más de la madrugada, todas anotadas y ninguna escrita como regla** —el Factory Architect
paró de producir y respetamos la pausa—:

- **Una regla que prohíbe algo Y propone su sustituto en la misma frase se aplica en su mitad
  prohibitiva, porque prohibir es más fácil que sustituir.** La decisión 50.2 decía *"no borres:
  compara fechas"*. Ejecutamos el *"no borres"* y **no el "compara"**, y eso dejó la receta del
  vigilante disparando en falso durante dos horas. *(Ya corregida.)*
- **Arreglar un fallo quitando un paso deja el hueco que ese paso tapaba de refilón.** El `rm -f`
  era incorrecto **y hacía algo**: protegía de la ronda anterior. **Quitarlo sin decir quién hace
  ese trabajo lo dejó sin dueño.**
- ⚠️ **UNA TENSIÓN SIN RESOLVER entre dos cosas escritas la misma noche, y conviene mirarla
  antes de que alguien aplique la equivocada.** Para una **puerta** escribimos que *errar por
  estricto es el lado correcto*: un falso negativo se investiga —alguien está bloqueado— y un
  falso positivo no. Para un **vigilante** acabamos de decir lo contrario: el falso negativo es
  peor, porque **no avisar nunca es silencioso**. **Las dos son ciertas, y lo que las separa es
  si hay alguien delante esperando al instrumento.** Una puerta se sufre; un vigilante se
  ignora. *Nadie ha escrito eso todavía, y "errar por estricto" suelto es un consejo peligroso
  fuera de las puertas.*
  ✅ **Hecho esta noche, y era lo único urgente: hay una nota cruzada en LOS DOS sitios** —§2ter
  y §2bis-ter— diciendo que la otra existe, que dice lo contrario para otro tipo de instrumento,
  y que la frontera está sin resolver. **Ninguna de las dos se puede aplicar ya sin ver a la
  otra.** *Una contradicción señalada es una pregunta; una contradicción suelta es una trampa* —
  y **el traspaso lo leemos nosotros, pero las reglas las aplica quien las encuentra.**
  💡 **HIPÓTESIS del Factory Architect, anotada COMO HIPÓTESIS y no como resolución** (si mañana
  no se sostiene, mejor que no esté escrita como regla): la frontera no es *"si hay alguien
  delante"*, es **quién nota cada error**. En una **puerta**, el falso negativo **lo sufre
  alguien en el acto y lo reporta** — uno de los dos errores se autodenuncia, y por eso **se
  puede permitir un sesgo**. En un **vigilante**, **ninguno de los dos tiene quien lo note**: el
  falso positivo se ignora en silencio y el falso negativo **es** silencio. Si se sostiene, la
  conclusión sería que **un vigilante no admite sesgo en ninguna dirección: exige discriminación
  probada en las dos** — que es, dice él, *"exactamente lo que he estado haciendo toda la noche
  con los autotests sin saber por qué, y por qué nunca escribí uno para una puerta"*.
  ⚠️ **Y CÓMO NO VALIDARLA, que es la parte que más falta hacía.** El CEO argumentó que *"una
  regla que explica una práctica que ya tenías sin haberla razonado tiene papeletas de ser
  cierta"*, y el Factory Architect lo desmontó: **una hipótesis que explica lo que ya hacías se
  siente correcta porque encaja con tu conducta, y esa sensación no es evidencia — es la
  conducta confirmándose a sí misma.** Sus autotests salieron de **prueba y error, fallando seis
  veces y tapando lo que se rompía**, no de una intuición profunda. Que ahora exista una regla
  que lo explique elegantemente **no prueba que sea cierta: prueba que es compatible con lo que
  acabó haciendo.**
  ✅ **Criterio de validación, para mañana:** si al revisarla **lo único a favor es que explica
  lo que ya hacíamos, NO BASTA.** Hace falta un caso en que la regla **prediga** algo que no
  habríamos hecho por costumbre — *un vigilante que habríamos sesgado y que la regla dice que
  no, o una puerta con autotest que la regla dice que sobra*. **Es la enmienda 9 aplicada a una
  regla en vez de a una comprobación: si no habría podido salir mal, no la hemos probado.**
- **"Explicar bien un incidente no es evidencia de ser cierto."** (De T1, retirando su propio
  hallazgo.) Su explicación del incidente del `cwd` era **buena, completa y encajaba con todo lo
  observado**, y por eso **pasó tres filtros sin que nadie pidiera una medición** — llegó a
  reescribir dos veces una sección de `intro-terminal.txt` sobre una premisa falsa. **Cuanto
  mejor explica algo, menos ganas dan de comprobarlo.**
  *Lo que había pasado en realidad:* midió el `cwd` de un servidor que **de verdad era de la
  raíz**, obtuvo la respuesta **correcta**, y concluyó que el método estaba roto porque
  contradecía su creencia previa. **Medición exacta, sujeto equivocado — esta vez sobre el
  método en vez de sobre el dato.** *(Ya corregido en el documento, con la historia del párrafo
  dentro para que no se vuelva a reescribir.)*
  📌 **Y la parte que la Directora se apunta a sí misma, que es la que enseña:** ella fue el
  vector —convirtió el relato de T1 en hallazgo verificado y pidió que se escribiera—, puso dos
  condiciones (método alternativo y procedencia) **y ninguna era "que alguien lo reproduzca antes
  de publicarlo"**, que era la única que importaba. **Van dos correcciones seguidas al mismo
  párrafo, y las dos las encontró alguien midiendo después de publicarlo, no nosotros
  revisando.**
- 🔶 **PENDIENTE DE DECIDIR DESPIERTO: hacer permanente la revisión cruzada de instrumentos.**
  Esta noche aparecieron **cuatro fallos de instrumento** —el `-f` sin comparar fechas, el `cwd`
  como identidad, y el `ls -t | head -1` en **dos** barridos distintos— y **los cuatro salieron
  de mirar el instrumento del otro. Ninguno de revisar el propio.** La Directora explicó por
  qué: **sospechamos del instrumento cuando nos lleva la contraria y confiamos en él cuando nos
  da la razón.**
  **La forma propuesta, que es la parte que importa:** cada ciclo, rotando, **coger UN número
  concreto que ese instrumento produjo y preguntar de dónde sale** — *no "¿cómo mides?"*, que se
  contesta con el mismo párrafo cada vez y **no puede fallar**.
  ⚠️ **Y el refinamiento sin el cual no sirve: se pregunta por el NÚMERO, no por la ETIQUETA —
  porque la etiqueta es la que se arregla primero.** Caso que lo demuestra: el contador del
  Factory Architect llevaba **cuatro horas con el nombre corregido y el contenido viejo**. Si se
  le hubiera preguntado *"¿qué significa esa etiqueta?"*, habría dado la definición buena —la
  había escrito él— **y no se habría encontrado nada.** *Es la diferencia entre un mecanismo que
  encuentra cosas y uno que las confirma.*
  📊 **Resultado de la única vuelta que se hizo (madrugada del 9-sep):** dos instrumentos
  revisados, **dos defectos encontrados**, un hueco declarado abierto **y cerrado en la misma
  vuelta**, y **una tarea de mañana que dejó de existir** —*"revisar qué alertas no se
  emitieron"*— porque una medición barata la borró.
  ⚠️ **Yo lo escribí como comprobación fija y el Factory Architect lo devolvió, con razón:**
  añadir una comprobación a mi barrido es ejecución; **imponer una obligación recurrente sobre
  el trabajo de otros cuatro roles, no.** Queda **autorizado solo para esta noche**. *Si mañana
  no se sostiene, se pierde una noche de rotación; si se hubiera fijado hoy y estuviera mal,
  quedaría una obligación permanente que nadie se atreve a quitar.*
- 💡 **HIPÓTESIS con UN SOLO CASO —el mío—, anotada como hipótesis porque suena verdadera por
  elegante:** *el valor de la revisión cruzada puede no estar en la revisión, sino en
  anticiparla.* Encontré el defecto de mi propio censo **yendo a derivar mi número antes de que
  el Factory Architect me lo preguntara**. Si se sostiene, **no hace falta revisar a todos: hace
  falta que todos sepan que les puede tocar** — y eso cambia el diseño del mecanismo. **Un caso
  no es evidencia.**
- **Reportar el momento de contar en lugar del momento del hecho.** El Factory Architect me dio
  la hora de armado de su watchdog **desviada 16 minutos**, y no por relevo: *"tenía el dato
  exacto delante y tecleé otro — puse la hora a la que te escribí, no la que decía el evento"*.
  No cambió ninguna conclusión **por casualidad**, porque el margen era holgado. Lo reportó él.

---

## 7ter. Una rama con el nombre equivocado — el Integrador tiene que saberlo

Apareció una rama **`aitormarin/ait-85-…`** con commits de **AIT-92** dentro, y **AIT-85 está
Done**. Dos fallos a la vez: quien busque la rama de AIT-92 **no la encuentra**, y una rama con
nombre de issue cerrada y sin mergear **es justo lo que alguien borra creyendo que es residuo**.
**El trabajo se pierde y el borrado se siente como limpieza.**

**Decidí renombrarla a la de su issue Y dejar el mapeo viejo→nuevo escrito** en el fichero de
tarea y en la issue. Renombrar sin dejar el mapeo cambia *un nombre podrido* por *una referencia
rota* — el mismo fallo que nos costó dos horas esta noche con los nombres de sesión.

**Que conste para mañana: si el Integrador tenía algo apuntado con el nombre viejo, ya no
resuelve.** Está avisado.

---

## 7quater. Una issue mal dimensionada, para el PM

**AIT-89 está marcada "Low"** y en realidad pide **cuatro pruebas unitarias versionadas** — y
este proyecto **no tiene runner de unitarias**: ni script, ni `vitest.config`, ni `jest.config`.
La ficha arrastra **introducir una infraestructura de pruebas nueva**. No es imposible; **no es
el relleno de una noche**, y la etiqueta hace que parezca que sí. Enrutada al PM para
redimensionar.

---

## 7bis. El precio de `confirmar`, con número y no con impresión

Llegó a las tres horas de ponerlo, y la Directora lo dijo mejor que yo: **esto no es un fallo de
`confirmar`, es su precio.**

**El caso:** T3 terminó las dos piezas libres de AIT-92 y la tercera resultó no serlo —necesitaba
las tablas—. **Todo lo que le queda lo ocupa la rama de AIT-88 de T1**, y con `confirmar` **esa
rama no se mergea esta noche**: no es "espera veinte minutos", es "espera hasta mañana". Su
siguiente tarea, AIT-101, choca con los mismos ficheros.

*(T3 hizo bien en no dejar una ruta HTTP pública con manejador vacío y un TODO silencioso para
aparentar avance. Las dos cosas están prohibidas y las dos habrían pasado desapercibidas.)*

**Si mañana preguntas cuánto costó parar las publicaciones, la respuesta empieza aquí: una
terminal bloqueada en la primera noche.** Sigue pareciéndome el cambio correcto —era la peor
noche para publicar a ciegas— pero el precio existe y no debe descubrirse por sorpresa.

---

## 7quinquies. `tsc --noEmit` ha dejado de significar nada

En el worktree de T3, **`npx tsc --noEmit` sale con exit 2 pase lo que pase**. **Cero errores en
código del proyecto**: los ocho que reporta están en `.next/types/`, en **artefactos duplicados
con sufijo numérico** (`cache-life.d 4.ts`, `routes.d 5.ts`) — la misma plaga de copias de macOS
del punto anterior, **ahora atacando a una herramienta de verificación**.

> **Un código de salida que ya no significa nada entrena a la siguiente terminal a ignorarlo.**

Es el falso verde del catálogo **con el signo cambiado: un falso ROJO permanente**, que se
aprende a ignorar igual de rápido. Enrutado al PM para issue.

---

**Reparto al cerrar el traspaso:** T1 con **AIT-88, la última issue del MVP** · T2 con AIT-96 ·
T3 implementando **AIT-92**, que sacó GO en la ronda 5 tras cerrar **un Blocker de CSRF en el
callback de OAuth** —habría permitido a un atacante enlazar su buzón a la cuenta de otro—.
Ninguna terminal idle, y hay destino para las tres al terminar.

*Última actualización: **2026-09-09 02:45 UTC (= 23:45 local del 8-sep)**. Las secciones 7bis/7ter/7quater se añadieron después de esa hora.*

# Traspaso de la noche — para Aitor, mañana

**Escrito por el CEO (`crm-curso-vibe-coding-b2`) el 2026-09-09 a las 02:40 UTC (= 23:40 local
del 8-sep), cuando te fuiste a dormir.** Se va actualizando durante la noche: **mira la fecha
del final para saber hasta cuándo llega.**

⚠️ **Y una advertencia sobre este documento, que se ganó sola:** es **un texto sobre un estado
que se mueve mientras se escribe**. Una frase suya —*"la cola del Integrador está vacía"*—
**caducó en las cuatro horas que se tardó en redactarlo**, y solo se vio porque el Integrador
abrió el fichero para otra cosa. **Los datos que cambian llevan ahora su hora de medición al
lado**; si uno no la lleva, **desconfía de él antes que del resto.**

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

## 0bis. 🔴 Y LO SEGUNDO: las dos cuentas reales del negocio solo entran por Google

**AIT-113**, Backlog, **nadie la coge esta noche.** No es un defecto de código: **es un riesgo
sobre tu acceso a tu propio negocio.**

**El hecho**, confirmado en ADR-003 y en `docs/03-setup.md` §6bis: las dos cuentas reales se
dieron de alta como **solo Google, sin contraseña**. **Si el login con Google falla, no entran.**
Y *"¿Olvidaste la contraseña?"* **tampoco vale — no hay contraseña que recuperar**, así que el
reseteo falla por el mismo motivo.

⚠️ **Por qué va esta noche y no la semana que viene:** el acceso de esas dos personas **depende de
un ajuste que tocamos nosotros anoche** —pasar la app a Interna—, en un proyecto de Google que
**administramos nosotros**. Salió bien y está verificado. **Eso no cambia la forma del riesgo:
hay una única vía de acceso y su configuración la movemos nosotros.**

**Cómo apareció, que es lo que le da credibilidad:** T3 **no lo buscaba**. Fue a citar el ADR para
poder escribir *"inténtalo de nuevo **o entra con tu email y contraseña**"* en un mensaje de
error, y el ADR decía que esas cuentas **no tienen contraseña**. **El consejo natural de la
pantalla era un callejón sin salida, y justo para quien más iba a verlo.**

🔴 **Lo que NO vale hacer con esta ficha, y el PM lo puso como criterio de FALLA:**

> **No se cierra alegando que AIT-112 ya lo explica.** AIT-112 hace que el fallo **se vea** en vez
> de dejar el botón mudo — bueno, y **no es lo mismo**. **Explicar un bloqueo no es resolverlo**, y
> con AIT-112 publicada **va a parecer que sí.**

**Las dos salidas, y ninguna es obvia:**
- **Aceptarlo por escrito** — asumir que el acceso depende de Google y de una configuración que
  tocamos nosotros.
- **Abrir una segunda vía de acceso** — que **abre superficie de ataque**: hoy esas cuentas **no
  se pueden atacar por contraseña precisamente porque no la tienen.**

**Tu negocio, tu cuenta, tu riesgo. Nadie de la fábrica va a elegir por ti.**

---

## 0ter. ⚠️ AIT-108 NO desbloquea la suite — y su título invita a creer que sí

**Se anota aquí a propósito, porque la conclusión falsa llega sola:** el Integrador ya la sacó
—escribió que *"AIT-108 es precisamente la tarea que arregla el login de la suite"*— y **tú vas a
leer el mismo título mañana.**

**Verificado en el código, no razonado:** su `global-setup` hace **un login REAL, por el mismo
camino y con la misma credencial** que hacía cada test, y **si falla ABORTA en vez de degradar**.

> **AIT-108 no arregla ningún login: los concentra.** 29 pasan a ser 1. Si la credencial no casa
> —que es **AIT-102**—, ese único login también falla y **Playwright aborta en el setup sin correr
> un solo test.**

| | hoy | con AIT-108 |
|---|---|---|
| | 29 fallos de `loginAs` en 6 specs, **que parecen regresiones** | **1 fallo en `globalSetup`, cero tests ejecutados**, con mensaje legible |

**Sigue valiendo la pena** —es el radio de daño, que es la justificación de la ficha— **pero no es
"la próxima corrida será posible": es "cuando vuelva a fallar, fallará una vez y legible".**

✅ **Y el reencuadre es más simple que lo que teníamos: no hay circularidad ni paradoja. Lo que
desatasca la verificación es AIT-102, la credencial.** Todas las acumuladas están bloqueadas por
**la misma dependencia externa**, y AIT-108 no es especial: **es solo la siguiente que toca un
fichero compartido.**

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

**Catorce publicadas hoy, ninguna revertida, ningún build roto, `main` sincronizado.**

## 🟢 CUATRO TAREAS ESPERANDO TU SÍ *(medido por el Integrador a las 04:0x UTC)*

**Es exactamente lo que el modo `confirmar` venía a producir.** Las tres con **GO del auditor y
revisión final hecha**:

| Tarea | Qué es | Huella |
|---|---|---|
| **AIT-88** | Guardar un contacto sin inventarle una venta — **cierra el MVP** | 9 ficheros · schema + `docs/02` + `_generated` |
| **AIT-87** | Un seguimiento puede desaparecer sin que nadie se entere | 1 fichero · `convex/nextSteps.ts` |
| **AIT-96** | La suite mide la app de otro si el 3000 está ocupado | 1 fichero · `playwright.config.ts` |

**Intersección entre las cuatro: VACÍA**, medida por la Directora a las 04:0x UTC — **las seis
parejas, no solo cada rama contra `main`** (cuatro ramas pueden ser disjuntas contra `main` y
pisarse entre ellas), con `git diff --name-only origin/main...rama` de **tres puntos**, **con los
ficheros generados incluidos**, y **con control positivo**: cruzó AIT-96 con AIT-108 —que sí se
pisan— y su comando **sí devolvió el fichero compartido**. Sin ese control, los seis ceros no
significaban nada.

🔴 **PERO LEE ESTO ANTES DE PUBLICAR LAS CUATRO SEGUIDAS, y es de ella:**

> **Esto mide FICHEROS, no COMPORTAMIENTO.** La intersección vacía dice *"se pueden mergear en
> cualquier orden **sin conflicto de git**"*. **NO** dice *"se pueden publicar en cualquier orden
> **sin efecto entre ellas**"*.

Cuatro ramas pueden no compartir un solo fichero **y aun así romperse entre ellas por el schema o
por los datos** — AIT-88 **añade una tabla**, AIT-87 **cuenta filas huérfanas**. *"No creo que se
den la mano, pero no lo he comprobado y no puedo afirmarlo."* **Nadie lo ha medido.**

**Recomendación del Integrador, y es preferencia, no restricción:** AIT-88 primero, porque cierra
el MVP y es **la única que toca `schema.ts`** — si algo va a fallar en un build, es esa, y
conviene verla sola. **Puedes invertirlo** si prefieres soltar antes las dos pequeñas.

⚠️ **Y ahora son CUATRO: se ha sumado AIT-94.** *(Intersección entre las cuatro: sigue vacía, medida.
Cualquier orden vale.)*

⚠️ **Las cuatro van SIN número de suite propio.** No es que salieran en rojo: **la suite completa no
se ha podido correr —tres intentos, tres muertes por memoria—** así que **nadie ha medido `main`
con ellas dentro.**

### ✅ Pero hay un número, el primero de la noche — y cierra una declaración

```
28 passed / 0 failed · EXIT=0 · 1,8 min · cero TooManyFailedAttempts
```

**Primera corrida que termina.** Y el Integrador no llegó ahí insistiendo: **cambió qué medía** —
partió la suite en *los 28 tests sin login* y *los 26 con login*, y corrió los primeros.

**Lo que cierra:** entre esos 28 están **los cinco de AIT-93**, la tarea que él publicó
**declarando que no había podido verificarla**. **Es la primera de las declaraciones de esta noche
que se cobra** — y la cerró la misma persona que la escribió, sobre lo que ella misma publicó a
ciegas. *Declarar un límite no es archivarlo.*

✅ **Y ese número se interrogó después, en la revisión cruzada — AGUANTA.** El Integrador dio las
cuatro derivaciones y **el control positivo**: metió un mutante en un `expect`, **predijo el
resultado antes de correr** (1 caído, 27 verdes, `EXIT≠0`) y salió **exactamente eso**. Así que
**el 28/28 se distingue de "no corrió nada"**, que es lo único que lo convierte en prueba. El
denominador está confirmado por dos vías —los marcadores `[28/28]` y un `--list` estático, que no
toca servidor— y **los cinco tests de AIT-93 aparecen NOMBRADOS en la salida**, no inferidos. El
`EXIT` sale de una **redirección, no de una tubería**.

⚠️ **Con el límite que él mismo declara:** la partición fue **por fichero, no por test**. *"28 sin
login es exacto para los que corrí, pero no afirmo que sean todos los que se podían correr"* — si
algún spec **con** login tiene tests sueltos que no lo necesitan, quedaron fuera. Con ella quedan verdes también los specs de
**AIT-80** y **AIT-82**.

⚠️ **Los dos límites, sin suavizar:**
1. **Este 28/28 NO cubre las cuatro acumuladas.** Se verifican en los specs **con login**, que son
   justo los 26 que no se pudieron correr.
2. **No significa que el limitador ya no moleste: significa que no lo tocó.** *(AIT-102 sigue
   abierta.)*

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

- **Memoria — y esto es lo ÚNICO que no caduca, porque de las cifras te hemos dado tres
  versiones distintas en cuatro horas:**

  > ### **Tu Chrome personal pesa casi lo mismo que la fábrica entera. Cerrar pestañas libera tanto como cerrar una terminal — y no cuesta trabajo perdido.**

  **Y cómo mirarlo cuando quieras el número**, en vez de heredar el nuestro:
  `sysctl -n vm.swapusage` (⚠️ **su total se mueve solo**: 6.144 y 7.168 la misma noche) ·
  `vm_stat` → **libre+inactiva**, que es lo reclamable de verdad · y el **agregado de RSS**,
  desglosando **tu Chrome / las sesiones / el Chrome del MCP**.

  *Foto de las 04:17 UTC, y es una foto:* tu Chrome **1.508 MB en 30 procesos** · las nueve
  sesiones **1.913 MB** · el navegador de la fábrica **215 MB**.

  ⚠️ **Por qué insisto en que es una foto: el agregado de las sesiones cayó de 2.934 a 1.913 MB en
  22 minutos, solo porque cuatro se quedaron ociosas.** A las 02:31 te dijimos *"nueve terminales
  es lo que aprieta la máquina"* y **exagerábamos nuestra parte**. **Te hemos pasado fotos
  llamándolas propiedades tres veces.**

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
- 🔶 **Saqué de la raíz tres duplicados de macOS que rompían `tsc`.** `npx tsc --noEmit` daba
  **5 errores con el código sano** —todos en `.next/types/*" 2".ts`—, así que **el exit code
  salía distinto de cero pasara lo que pasara** y cualquier *"tipos: OK"* apoyado en él estaba
  vacío. Son **artefactos generados y gitignorados**; los **moví, no los borré**, a
  `~/.cuarentena-fabrica/` con un LEEME. **Ahora `tsc` da 0 errores**, y lo verifiqué con un
  canario de tipos que **sí puso rojo**, así que el cero se distingue de *"no compiló nada"*.
  ⚠️ **A la primera lo hice mal:** los moví a la carpeta de cuarentena **dentro del repo** y
  **pasaron de 5 errores a 18**, porque `tsconfig` también compila ahí. **Apliqué un precedente
  sin comprobar la precondición que lo hacía funcionar.**
  ⚠️ **Y tuvo un segundo efecto que yo no podía ver: la Directora estaba midiendo en ese mismo
  minuto**, le salieron **18 errores donde antes había 5**, y **escribió un diagnóstico falso
  para explicar mi efecto secundario.** Ya lo retiró. **No pasó nada porque los ficheros eran
  inocuos; si hubieran sido recuperables solo desde uno de los dos sitios, se pierden.**
  ✅ **Los de T3 ya están hechos por ella** —eran **seis**, no tres, y con sufijos `" 4"` y
  `" 5"`, no `" 2"`—. **Raíz y T3 a 0 errores, T1/T2/QA limpios.** Y de ahí un aviso para la
  issue del `tsconfig`: **la regla de exclusión tiene que cubrir CUALQUIER dígito**, no solo el 2
  — una escrita mirando un solo worktree habría dejado fuera justo el que tenía seis.
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

🔴 **RETIRADO — esta sección afirmaba algo FALSO y lo hemos tenido fuera de la cola toda la
noche por ello.**

Decía: *"AIT-89 está marcada Low y arrastra montar una infraestructura de pruebas unitarias que
este proyecto no tiene"*. **El proyecto sí puede probar una función sola, y desde AIT-80**:
`e2e/00-phone.spec.ts` y `e2e/00-customerValidation.spec.ts` **importan funciones directamente y
no usan `page.` ni una vez**.

**Cómo se coló, y es de este mismo catálogo:** la Directora miró `package.json`, vio que no había
`vitest` ni `jest`, y afirmó *"no hay forma de probar una función sola"*. **Midió la herramienta y
afirmó sobre la práctica.** El control positivo que lo tumba —*"¿hay alguna prueba que importe una
función?"*— **es un comando**.

⚠️ **Y peor: el propio fichero llevaba la respuesta escrita**, decidida a propósito antes de que
nadie opinara — *"montar un runner para dos funciones sería añadir una dependencia que nadie ha
pedido; el runner de Playwright las ejecuta igual de bien"*. **Le pusimos etiqueta de «atajo
peligroso» a la práctica establecida del proyecto.**

**Y yo puse mi mitad:** ella me lo contó, **se lo reforcé al PM**, y **ser dos lo hizo parecer
verificado**. Es la mecánica exacta del *"AIT-94 huele a `opportunities`"* de dos horas antes —
**dos veces la misma noche, con dos roles distintos.**

**Qué se apoyaba en esto** *(enumerado, para que la corrección no viva en un sitio mientras los
dependientes sobreviven en silencio)*:
- **AIT-89 salió de la cola** y no se asignó en toda la noche. **Ya vuelve, con su Low correcto.**
- **El barrido de la Directora la excluía cada ciclo.** Corregido.
- ✅ **AIT-109 y el bloqueo: ya resueltos por el PM.** Retiró el bloqueo, marcó la premisa como
  falsa **dentro** de la ficha, y devolvió AIT-89 a la cola libre con su Low. **AIT-109 no sobra
  entera pero se queda en muy poco**, y lo que sobrevive es real y medido: `playwright.config.ts`
  declara **un solo `webServer`**, así que las pruebas puras **arrancan el servidor sin
  necesitarlo** y heredan las precondiciones de puerto. Hoy son dos; con AIT-89 serán seis. Low.
- 📌 **Y le cambió el TÍTULO, que es lo que más enseña:** se llamaba literalmente *"El proyecto no
  tiene forma de probar una función sola"* —**la afirmación falsa**—, con la corrección dentro.
  **Un título se lee en un listado sin abrir nada**, así que la premisa seguía circulando **en el
  único sitio donde la mayoría la iba a ver.** Ahora se llama *"Las pruebas de funciones puras
  arrancan el servidor sin necesitarlo"*, **con el título viejo anotado arriba y no borrado.**

📌 **Lo que hay que llevarse, y es del PM:** el argumento con el que se descartó *colgar pruebas
puras del arnés* **era bueno y sigue siéndolo** —les regala sus precondiciones, y el Integrador
acaba de demostrarlo consiguiendo su primera corrida **partiendo la suite**—. **Lo que fallaba no
era el razonamiento:**

> **Un razonamiento correcto sobre un mundo que no se comprobó se defiende igual de bien que uno
> sobre el mundo real.** Por eso no salta.

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

*Última actualización: **2026-09-09 04:50 UTC (= 01:50 local)**. A esa hora la fábrica se estaba
apagando **por falta de trabajo disjunto, no por avería**: T1 y T3 ociosas con motivo anotado,
solo T2 terminando AIT-108. Todo lo demás espera una decisión tuya.*

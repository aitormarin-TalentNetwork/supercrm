# Estado del pipeline al cerrar las ventanas

Medido por la Directora el 2026-09-10T10:20:18Z. Todo sale de disco, no de memoria.

## Exports vivos y su ultimo veredicto

| terminal | ficha | export en disco | ultimo veredicto | resultado |
|---|---|---|---|---|
| T1 | AIT-122 | `T1_AIT-122_comprobador-punteros-en-exports_plan-loop10-para-auditor.txt` (loop10, 09:27Z) | `VEREDICTO_T1_AIT-122_plan-loop11.txt` | NO-GO |
| T1 | AIT-122 | `T1_AIT-122_comprobador-punteros-en-exports_plan-loop11-para-auditor.txt` (loop11, 10:11Z) | `VEREDICTO_T1_AIT-122_plan-loop11.txt` | NO-GO |
| T1 | AIT-99 | `T1_AIT-99_siembra-de-cuentas-de-contrasena_loop2-para-auditor.txt` (loop2, 04:51Z) | `VEREDICTO_T1_AIT-99_loop2.txt` | NO-GO |
| T1 | AIT-99 | `T1_AIT-99_siembra-de-cuentas-de-contrasena_plan-loop7-para-auditor.txt` (loop7, 13:18Z) | `VEREDICTO_T1_AIT-99_loop2.txt` | NO-GO |
| T2 | AIT-114 | `T2_AIT-114_acoplamiento-por-estado_plan-loop19-para-auditor.txt` (loop19, 09:36Z) | `VEREDICTO_T2_AIT-114_plan-loop19.txt` | NO-GO |
| T3 | AIT-127 | `T3_AIT-127_cerrar-sesion-no-cierra_loop2-para-auditor.txt` (loop2, 08:12Z) | `VEREDICTO_T3_AIT-127_codigo-loop3.txt` | NO-GO |
| T3 | AIT-127 | `T3_AIT-127_cerrar-sesion-no-cierra_loop3-para-auditor.txt` (loop3, 09:39Z) | `VEREDICTO_T3_AIT-127_codigo-loop3.txt` | NO-GO |
| T4 | AIT-136 | `T4_AIT-136_check-env-local-ignora-el-fichero_plan-loop6-para-auditor.txt` (loop6, 10:15Z) | `VEREDICTO_T4_AIT-136_plan-loop5.txt` | NO-GO |

## Ramas en origin (ls-remote, no el exit del push)
```
ee6ae7f9a17cafe8ba3996b2960195949c974b39	aitormarin/ait-102-al-convex-compartido-de-dev-no-se-puede-entrar-la-contrasena
3ede1498f62a864c9e25c0388e596858801f849d	aitormarin/ait-109-las-pruebas-de-funciones-puras-arrancan-el-servidor-sin
026b5f85a64a8bc4a5ffbf38870238453824b5f0	aitormarin/ait-110-el-aviso-del-cupo-de-login-calla-si-el-limite-se-cruza-con
9173644f4807b9ead46d44a487ab0b20924417b0	aitormarin/ait-119-la-instantanea-de-sesion-se-envenena-sola-y-el-veneno
c71caa32dc49ecd1d97f9f55c97e219cfc67996a	aitormarin/ait-123-convex-dev-env-file-borra-convex_deployment-del-envlocal-de
b0f8ed8aea9bcb7b27def28ff0c99b7b15c09914	aitormarin/ait-92-ola-2-conectar-una-cuenta-de-gmail-desde-el-crm
f7ab3bda467535bd8cbc730b0eae53e47ba31fb9	aitormarin/ait-99-un-deployment-de-convex-nuevo-nace-sin-login-por-contrasena
27e9d2428cd6b1c0d414f6b7138e5986acb3e11d	aitormarin/corregir-comentario-falso-authstate
816398d43055c9612a60258e37e5303a4ad26d2e	aitormarin/inventario-de-la-suite-e2e-v2
87402fc841d34b6412919b1f2c4bf35161a24ead	main
```

## Cerrojos (enumerados, no buscados por patron)
```
TOMADO _turno-convex.lock -> T3 (t3-5a) | TOMA 2026-09-10 10:15:49Z
```

## Cola
```
BLOQUEADA_AIT-125_anti-enumeracion-en-el-cliente.txt
PARADA_AIT-32_registro-automatico.txt
SIGUIENTE-A_AIT-126_comprobador-de-test-unit-aislado.txt
SIGUIENTE-C_AIT-128_supervision-se-contradice.txt
SIGUIENTE-D_AIT-129_iniciales-avatar.txt
```

## Ultima auditoria, cerrada a las 10:19:59Z

`VEREDICTO_T1_AIT-122_plan-loop11.txt` -> **NO-GO**, dos majors:
- **M1** — la huella publicada de `reconstruir.sh` no corresponde al codigo embebido.
- **M2** — el convenio universal de salida sigue incumplido.

**NO relayada a T1**: la ventana se cierra antes. Quien retome AIT-122 empieza leyendo este veredicto.

## AVISO sobre la tabla de arriba

La columna "ultimo veredicto" coge el veredicto MAS RECIENTE de la ficha, no el de
esa ronda. Para AIT-122 y AIT-127 aparece repetido en dos filas: el bueno es el de
la ronda mas alta. Lo dejo escrito en vez de arreglar la tabla porque un dato que
parece emparejado y no lo esta es peor que uno que declara su limite.

## Estado real por ficha, para repartir

| ficha | donde esta | siguiente paso |
|---|---|---|
| **AIT-127** | codigo r3 NO-GO, 6 majors. T3 tiene 5 cerrados y verdes, le falta C6 y el export r4 | **la mas cerca de cerrar**: es codigo y puede acabar en el Integrador |
| **AIT-122** | plan loop11 NO-GO, 2 majors | plan, 11 rondas |
| **AIT-114** | plan loop19 NO-GO, 2 majors | plan, 19 rondas |
| **AIT-136** | plan loop5 NO-GO; loop6 exportado SIN auditar | plan, 6 rondas |
| **AIT-99** | codigo r2 NO-GO. M3 y M4 abiertos | 🔴 BLOQUEADA en 4 permisos de Aitor |
| **AIT-138** | ficha nueva, sin empezar | comprobador que exime por region |
| **AIT-139** | ficha nueva, sin empezar | comprobador que colapsa 3 estados en `[]` |

---

## Reparto nuevo, 2026-09-10 10:31Z

| terminal | ficha | estado |
|---|---|---|
| `t1-a3` | **AIT-116** (Urgent) iCloud rompe `.git` | arranca de cero |
| `t2-dc` | **AIT-97** (Urgent) el navegador de pruebas lleva sesiones reales | arranca de cero |
| `t3-55` | **AIT-127** (Urgent) cerrar sesion no cierra | RETOMA en 17870e3, le falta C6 + export r4 |

Auditores: **tres plazas fijas** que esperan encargo en `/tmp/auditores/plaza-N.job`,
lo ejecutan y vuelven a esperar. No se abre una ventana por auditoria.

### 🔴 EXPORT HUERFANO, y es consecuencia de una decision mia

`T4_AIT-136_check-env-local-ignora-el-fichero_plan-loop6-para-auditor.txt` (10:15Z)
esta exportado y **sin auditar**. T4 ya no existe y **AIT-136 no esta asignada a nadie**.

No lo muevo a `_fuera-de-alcance/` a proposito: moverlo daria por tomada una decision
que Aitor no ha tomado — si AIT-136 se para, se retoma o se reinicia. Se queda a la
vista y mi detector lo va a seguir marcando, que es lo correcto mientras no se decida.

### Sin asignar, con la medicion de por que

AIT-122 (Low, 11 rondas), AIT-114 (Medium, 19), AIT-136 (High, 6). **36 rondas
anoche, 0 GO de codigo, tendencia de majors PLANA en las tres.** Pendiente de que
Aitor o el PM decidan: parar, reiniciar con menos alcance, o retomar.

---

## Estado a 2026-09-10 12:15Z (medido, no deducido)

**PUBLICADO HOY: AIT-129**, merge `22c00a5d2bd9f0aafcc91be27b2f53cfe1968d7b`, desplegado
11:53:19Z, Linear en Done. Verificado por el Integrador **por ancestría**
(`merge-base --is-ancestor`) y no por la punta, con control negativo en la misma tirada
(`ait-92` NO es ancestro). La rama sigue viva en el worktree de T2: eso NO contradice el
merge, una rama no se borra al fusionar.

| terminal | ficha | estado a las 12:15Z |
|---|---|---|
| `t1-a3` | **AIT-128** /supervision se contradice | export r3 congelado 12:10:53Z, punta `7f0f94ac`, en `origin`. ENCOLADO para auditar |
| `t2-dc` | **AIT-134** cierre de sesion que falla deja cookies vivas | recien asignada |
| `t3-55` | **AIT-127** cerrar sesion no cierra | r5 EN AUDITORIA desde 12:09:25Z, plaza 1 |

**Las auditorias van EN SERIE** por el cupo de Codex. Plaza 1 ocupada. El encargo de
AIT-128 r3 esta escrito y esperando en `scratchpad/encargo-AIT-128-r3.txt`.

### Lo que hay que saber para no repetir lo de hoy

1. **Un veredicto en disco no avisa a nadie.** Hoy tarde 3h12m en relayar el NO-GO de
   AIT-128 (en disco 08:54:18Z, relayado 12:06Z) y ENTRE MEDIAS moví a T1 a otra ficha
   por no haberlo leido. Es la tercera vez, con tendencia a peor: 11 -> 153 -> 192 min.
   Falla hacia el verde en DOS instrumentos a la vez: el veredicto existe, asi que el
   detector de exports huerfanos lo da por resuelto. En manos del Factory Architect.
   Mitigacion local mientras tanto: vigilante que avisa cuando aparece el veredicto **o
   cuando el proceso del auditor muere sin escribirlo** (vigilar solo el exito hace que
   una caida por cupo sea indistinguible de "sigue trabajando").
2. **Mi detector de huerfanos tenia la clave mal.** El veredicto NO se llama como el
   export: descarta el slug e inserta la clase. Clave correcta = `T<n>` + `AIT-NNN` +
   `plan|codigo` + `loopN`. Con la clave mala daba 12 huerfanos y control positivo 1;
   con la buena, 9 con veredicto y 4 huerfanos, de los que 2 tienen veredicto bajo la
   convencion de nombres ANTIGUA. Huerfanos reales: solo AIT-136 y AIT-140, declarados.
3. **AIT-97 esta bloqueada por una accion de Aitor sobre `~/.claude.json`**, fichero
   personal suyo que NADIE de la fabrica toca. Cualquier reparto que la incluya reparte
   trabajo que no puede terminar. Lo construible sin eso (fijar version y `--isolated`
   en `.mcp.json`, que si es del repo) deja la fabrica comportandose igual.
4. **La suite mata 2 de cada 4 corridas por memoria** (medido por T3 con horas). SIN
   CAUSA ATRIBUIDA. Consecuencia operativa: cualquier criterio que dependa de la suite
   entera tiene hoy ~50% de no producir dato, o sea que el gate cuesta el doble de lo
   que creyo quien lo escribio.
5. **Los conteos contra Convex con `--limit` mienten hacia el numero del limite**:
   `--limit 100` devolvia 100, `--limit 500` devolvia 500, y el real eran 541. Miente en
   verde y con cara de dato exacto. Afecta a TODOS los conteos de anoche.
6. **AIT-143 abierta** (T3, 12:04Z): la instantanea rodada de sesion se muere a mitad de
   la suite. 1 de 4 medido hoy. Es de AIT-119, no del que la sufre.

### Pendiente de Aitor
Los cuatro permisos de **AIT-99** (desbloquean tambien AIT-125) y **`~/.claude.json`**
(sin el, AIT-97 no arregla las seis sesiones de raiz).

### REGLA DE REPARTO: la huella, no el delta. Y falla hacia "libre"

Para repartir, la pregunta NO es *"¿lo ha tocado en esta ronda?"* sino **"¿esta en su
huella?"**, y eso es SIEMPRE `git diff --name-only origin/main...<punta>`. El rango corto
(`base..HEAD`) sirve para *"¿que he cambiado desde el ultimo veredicto?"* y para nada mas.

Medido hoy sobre AIT-127, sobre `components/push/useSignOutAndUnlinkPush.ts`:

    origin/main...fcda1f0  ->  223 inserciones, 60 borrados, en SEIS commits
    aada8f2..fcda1f0       ->  0 ficheros        <- el rango corto: "LIBRE"

Es el embudo unico de los dos botones de cierre, o sea el corazon de la ficha.

**LA DIRECCION DEL FALLO NO ES SIMETRICA, y por eso esta regla vive aqui.** Un reparto que
se equivoca hacia "ocupado" cuesta una espera. Hacia "libre" cuesta DOS ramas reescribiendo
el mismo fichero y un merge a mano. El rango corto falla siempre hacia "libre".

**Y el modo en que se cuela:** lo medi yo con el rango malo y se lo sellé a T3 como
"VERIFICADO POR MI"; el volvio a EJECUTAR el comando y lo etiqueto como "medido por MI, no
relayado". Re-ejecutar el comando de otro verifica SU SALIDA, no SU ELECCION DE SUJETO.
**Dos sellos apilados apagaron la comprobacion mejor que uno**, y T3 tenia el rango bueno
escrito de su puño en el §9 del mismo fichero cuarenta minutos antes.

### Peticion del PM en vigor (12:22Z)

**Cuando T3 cierre AIT-127, AVISAR AL PM ANTES de repartirle nada.** Su motivo textual:
*"no quiero que la siguiente sea otro comprobador"*. El alcance es suyo; el orden que ha
fijado es AIT-128 -> AIT-134 (tras `main`) -> AIT-92 -> AIT-143 recortada -> AIT-142 ->
AIT-141.

### El mismo error en tres formas distintas en una hora (2026-09-10, 11:30-12:20Z)

1. **Directora**: elegí `aada8f2..HEAD` (delta de ronda) creyendo medir la huella de la
   rama, y le puse el sello "VERIFICADO POR MI".
2. **T3**: re-ejecutó ese comando y lo etiquetó "medido por MI, no relayado".
   **Re-ejecutar el comando de otro verifica su SALIDA, no su ELECCION DE SUJETO.**
3. **PM**: dedujo el origen del numero malo de un rotulo de AIT-143 que llevaba seis
   minutos corregido — y su propio recorte acabo escrito ENCIMA del texto ya corregido.
   Leyo una foto de un documento vivo.

**Ninguno de los tres es descuido.** En los tres el dato que corregia estaba disponible y
**nada obligaba a consultarlo**: el rango bueno estaba en el §9 del propio export de T3
cuarenta minutos antes, y el `createdAt` venia en el mismo resultado de herramienta que el
PM estaba leyendo. La respuesta no es "fijarse mas": es que la ruta obligatoria cruce la
evidencia que desmentiria la afirmacion.

**Y el test barato para el tercero:** antes de decir *"viene de aqui"*, preguntar **¿que
existio primero?**. Casi siempre hay una marca de tiempo a mano. Un origen equivocado
manda el arreglo al sitio equivocado y deja el hueco real abierto con sensacion de cerrado.

### PENDIENTE DE AITOR — actualizado 12:26Z, ahora son TRES

1. **Los cuatro permisos de AIT-99** (desbloquean tambien AIT-125).
2. **`~/.claude.json`** — sin el, AIT-97 no arregla las seis sesiones de raiz. Es fichero
   personal suyo y NADIE de la fabrica lo toca.
3. **NUEVO: generar `GMAIL_TOKEN_ENCRYPTION_KEY`** y ponerla en el deployment. Medido por
   T2 con `convex env list --names-only`: **no existe en ningun sitio**, y el plan de
   AIT-92 dice que el refresh token se guarda cifrado con ella. Decidido por el PM que la
   genera Aitor, va a **Bitwarden**, y es **distinta por deployment a proposito** (un
   token cifrado en dev no debe poder leerse en produccion). El motivo no es de gusto:
   una funcion del sistema solo podria guardarla EN LA BASE DE DATOS, que es donde viven
   los tokens que cifra — la clave al lado del dato que protege no protege de nada.
   ⚠️ Consecuencia declarada: si la clave se pierde o se rota, **los usuarios tienen que
   reconectar su Gmail**. No se pierde correo, se pierde la conexion. Va a `docs/`.

**AIT-92 partida** (PM, 12:2xZ): AIT-92 = lo construible sin la identidad de Aitor, cierra
hoy. **AIT-144** = la prueba de consentimiento real, Urgent, solo Aitor — sale aparte
porque NO ES UNA TAREA, ES UNA DECISION: si Google exige verificacion ahi, se para la Ola 2
entera, y un gate que puede matar una ola no puede vivir como ultimo paso de una
implementacion.

### 🔴 TRES NOMBRES DE RAMA PARA AIT-92 — que nadie borre nada

Medido con `git ls-remote --heads origin "*ait-92*"` (la autoridad es ls-remote, no el disco):

    EN ORIGIN, una sola:
      aitormarin/ait-92-ola-2-conectar-una-cuenta-de-gmail-desde-el-crm   (2 commits por delante de main)
    EN LOCAL:
      aitormarin/ait-92-conexion-gmail    <- donde trabaja T2, y NO esta publicada
    LO QUE DICE LINEAR:
      un tercer nombre que NO EXISTE en ningun sitio (derivado al renombrar la ficha)

La de nombre largo **parece huerfana sin serlo**. Y si alguien hace checkout con el nombre
que da Linear, se crea una rama vacia y cree estar donde no esta. Es el defecto de AIT-124.

### Hipotesis escrita para el PROXIMO reparto (CEO + Directora, 12:33Z)

**La suite E2E NO mata la mitad de las corridas.** Con el denominador del Integrador:

    03:53Z  corrida completa del Integrador  -> TERMINO
    07:42Z  corrida completa del Integrador  -> TERMINO
    ------- ventana sin medir ---------------
    11:13Z  T3 corrida 1 -> MATADA (test 42)     11:21Z  corrida 2 -> termino
    11:33Z  T3 corrida 3 -> termino              11:47Z  corrida 4 -> MATADA (test 50)

O sea: **algo se degrado entre las 07:42 y las 11:13**, no es una propiedad de la suite.
El "2 de 4" describia esa ventana, no el gate en general.

⚠️ **SITIO DONDE MIRAR SI SE REPITE, y NO es una causa:** en esa misma ventana arrancaron
las **tres terminales nuevas del reparto de las 10:31Z**. No se afirma que sea eso. Se
escribe ahora para que, **si vuelve a ocurrir tras el proximo reparto**, exista la
hipotesis por adelantado Y una ventana anterior sana con la que comparar — que es
justamente lo que no teniamos esta madrugada.

**Alcance del modo de muerte, medido por T1:** afecta a quien corre la **E2E completa**
(Integrador, y quien mida la suite), NO a los desarrolladores. `test:unit` usa
`playwright.unit.config.ts`, sin `webServer`, sin `globalSetup` y sin navegador, y corre
en menos de un segundo: no es el mismo sujeto. Lo que si queda expuesto en una ficha
normal es `npm run build`.

**Regla en vigor del CEO:** si la suite muere dos veces, no se da por pasada ni se llama
intermitente — se publica declarando que no se pudo correr, EN LA FICHA.

### Como se decide un GO cuyo export lleva evidencia falsa (Integrador, 12:35Z)

Mi enunciado era *"un GO apoyado en una evidencia que sabemos falsa no es un GO"*. El
Integrador le puso la prueba que lo hace aplicable, y es mejor:

> **No decide que la evidencia sea falsa: decide SI LO QUE SOSTIENE EL VEREDICTO PASA POR
> ELLA.** (La misma regla con la que se lee un `SIN:`: no importa cuanto declara el hueco,
> importa si la evidencia central cae dentro.)

Tres casos, y solo uno para la publicacion:

- **(a) El auditor LO DETECTO.** Publica. Y ademas es senal fuerte a favor: la ronda no se
  limito a leer el export, fue a comprobar lo que afirmaba.
- **(b) No lo detecto, pero su GO NO se apoya en esa medicion** (verifico por su cuenta lo
  que la medicion pretendia sostener). **El GO se mantiene.** Publica DECLARANDO en la
  ficha que el export llevaba un error de evidencia y que el veredicto no descansa en el.
  Que la conclusion sea correcta por otra via no es excusa para callarlo.
- **(c) No lo detecto Y su GO se apoya en esa medicion.** **NO se publica.** Vuelve a
  ronda con el dato corregido aunque la conclusion acabe siendo la misma: *"acerto igual"*
  y *"lo comprobo"* son dos cosas, y el segundo es el que compra el GO.

**Como se distingue, y es medible:** buscar en el veredicto si CITA esa medicion y si la
usa como apoyo de alguna afirmacion propia. La cita y la corrige -> (a). No aparece -> (b).
Aparece sosteniendo algo -> (c).

⚠️ **Y por eso el GO se entrega CON la correccion adjunta, nunca limpio:** la ruta de la
revision final no pasa por el export completo, pasa por el veredicto y por la huella. Si
la correccion no viaja pegada, el Integrador no se la cruza.

**Orden al aplicarlo (Integrador):** el Integrador clasifica PRIMERO, con el veredicto
delante y **sin haber leido la lectura de la Directora**; despues abre la de ella y compara.
Si coinciden son **dos clasificaciones independientes**. Al reves, la de la Directora se
convierte en la hipotesis que el va a confirmar — y confirmar lo que ya crees es donde
medir parece mas innecesario y mas rinde. Se manda en el mismo mensaje; el orden lo pone
quien lee.

### 🔴 EL ENCARGO A UNA PLAZA ES UN SCRIPT, NO UN PROMPT (12:44Z, y me costo 33 minutos)

`plaza-N.sh` linea 12 hace **`bash "$JOB.corriendo"`**. Le escribi un prompt en PROSA. Bash
lo ejecuto como comandos, dio errores de sintaxis en una ventana que no veo, borro el
fichero y volvio a esperar imprimiendo **"✔ PLAZA 1 libre otra vez"** — los mismos dos
mensajes que produce una auditoria que sale bien. **La auditoria de AIT-127 r5 no arranco
en 33 minutos y yo la reporte tres veces como "en curso".**

**FORMATO CORRECTO** (copiado de los disparos que si funcionaron):

    cd '<worktree>' && codex exec "$(cat '<scratchpad>/prompt-XXX.txt')" 2>&1 \
      | tee '<...>/codigo para auditar/VEREDICTO_....txt' ; touch '/tmp/claude-crm-auditor-done-XXX'

O sea: el prompt va en un fichero APARTE, y el `.job` es el script que lo invoca.

**GUARD OBLIGATORIO ANTES DE ENCOLAR: `bash -n <fichero>`.** Probado que discrimina: contra
el encargo en prosa **falla en la linea 3** (`syntax error near unexpected token '('`);
contra el script bueno, pasa.

**Y COMO LO ESTUVE CONFIRMANDO MAL DURANTE MEDIA HORA:** `ps | grep -c '[c]odex exec'` me
daba 3, y eran **mi propio vigilante y mis propios comandos**, cuyas lineas contienen esa
cadena. **El instrumento se contaba a si mismo**, asi que la rama "el auditor ha muerto" no
podia dispararse nunca. Se mide con **`pgrep -f "^codex exec"`**, anclado, o por el fichero
de marca `/tmp/claude-crm-auditor-done-*`.

**Y la senal que si discrimina:** el `tee` escribe desde el primer segundo. Un veredicto de
**0 bytes a los cinco minutos significa que NUNCA ARRANCO**, no que aun no ha terminado. Yo
lei ese vacio como el estado comodo de los dos que admitia.

**CORRECCION DE T3 AL CONTROL, y tenia razon: `bash -n` NO discrimina la clase.** Valida
SINTAXIS, no que el fichero sea un script. Una prosa sin parentesis ni comillas es bash
valido — comandos que no existen — y **pasa**. Reproducido:

    prosa CON parentesis .... bash -n exit 2   <- lo caza
    prosa SIN parentesis .... bash -n exit 0   <- PASA. Fallaria igual al ejecutarse

Yo lo habia validado **contra el ejemplar que me mordio** (el encargo de AIT-128, que tenia
parentesis), asi que dio rojo y parecio bueno: **un senuelo disenado por quien escribe el
detector confirma en vez de probar**.

**CONTROL BUENO: por PRESENCIA de lo que hace que el fichero SEA un encargo**, no por
ausencia de fallo. Y **no vale el shebang** —mis scripts empiezan por `cd '...' && codex
exec`, asi que un control por shebang rechazaria los buenos—.

⛔ **UNICA VIA DE ENCOLAR: `scratchpad/encolar.sh <script> <n-plaza>`.** Exige las cuatro:
contiene `codex exec`, contiene `| tee`, empieza por `cd`, y `bash -n`. Y ademas **impone
la regla de serie por mecanismo**: si `pgrep -f "^codex exec"` encuentra algo, rechaza. Eso
deja de depender de que yo me acuerde.

⚠️ **LA MITAD QUE ESTO NO ARREGLA** (T3): la plaza imprime el mismo "✔ libre otra vez" al
terminar bien y cuando el encargo revienta. **Mientras el mensaje de exito este en el camino
del fallo, el control de entrada es la unica defensa — y solo cubre lo que imagino.**

**Y hay un detector EN EL REPO que yo llevo el dia reimplementando a mano:**
`Sorfware Factory/_detector-exports-sin-veredicto.sh`. Usa la clave ANTIGUA
(`VEREDICTO_<term>_<ait>_<loop>.txt`, sin la clase), que es justo la que hoy me dio 12
huerfanos falsos. Antes de volver a escribir el detector a mano: arreglar ese.

**⛔ CORRECCION AL ORDEN: EL LECTOR NO PUEDE PONER EL ORDEN SI EL TEXTO LLEGA JUNTO.**
Fijamos que el Integrador clasificaria primero a ciegas y luego leeria mi lectura — y se la
mande **en el mismo mensaje**, asi que al llegar a ese parrafo ya no habia vuelta atras. Su
clasificacion NO fue independiente y no cuenta como segunda opinion.

**Van en DOS MENSAJES: (1) veredicto + correccion. (2) mi lectura, solo DESPUES de que el
me haya dado la suya.** Es la misma forma que la tabla de valores esperados que el le mando
al QA: un valor esperado a la vista invita a comparar, y no hay disciplina de lectura que lo
deshaga. **La independencia se protege con el canal, no con el proposito del lector.**

### 🔴 UN GUARD QUE NUNCA DEJA PASAR NO PROTEGE: PARA (13:23Z)

Puse en `encolar.sh` un rechazo si `pgrep -f "playwright"` encontraba algo, para no competirle
memoria a una suite. **Matcheaba los SERVIDORES MCP DE PLAYWRIGHT**, que estan vivos SIEMPRE
en las nueve sesiones. Medido: 29 procesos hacen match y **`pgrep -f "playwright test"` da 0**.

**El Integrador libero a las 13:15:26Z y mi gate siguio bloqueando la cola 8 minutos**, con
tres exports congelados esperando. Y era invisible: el rechazo se lee como prudencia
—"hay una suite corriendo"— y **nadie discute una espera que parece responsable**.

**LA SENAL BUENA NO ES OLFATEAR PROCESOS: ES EL CERROJO**, que es una DECLARACION de quien
corre la suite y sabe lo que hace. Ahora `encolar.sh` mide (a) `_turno*.lock` y (b) el
corredor real (`playwright test` / `test:e2e`), anclados a la forma del comando.

⚠️ **Y el limite, declarado:** el (b) esta disenado pero **NO validado contra una corrida
real** — cuando el Integrador vuelva a correr la suite, comprobar que efectivamente rechaza.
Hasta entonces el que protege de verdad es el cerrojo.

**La direccion importa:** este guard falla hacia BLOQUEADO, que es el lado que parece seguro
y cuesta produccion. El anterior (encolar un prompt en vez de un script) fallaba hacia el
verde. Los dos cuestan; solo uno se nota.

### PUNTO DE CORTE DE LAS RONDAS DE PLAN (CEO, 14:43Z) — fijado ANTES de ver el resultado

**La regla de "una ronda de plan como maximo" era SOLO para AIT-128 y AIT-129**, por su tamano.
AIT-92, AIT-134 y AIT-141 nunca estuvieron dentro. (El CEO declara que no acoto el alcance de su
propia regla, y que **es la cuarta vez hoy que una regla nueva sale sin decir a que se aplica**:
su `VIGENTE_DESDE`, la clausula transitoria de la D73, la config de los worktrees, y esta.)

**EL CORTE, y nombra el SUJETO y no el momento:**

> La pasada de los diecisiete criterios es **UNA**. Si la ronda 5 de AIT-92 vuelve con hallazgos
> de la **MISMA CLASE** —control positivo fuera del `FALLA si`— la enumeracion no funciono, y eso
> si es senal de parar y replantear. Si vuelve con hallazgos de **OTRA clase**, es progreso
> normal y sigue.

Un *"si vuelve a fallar"* no sirve: se cumple con cualquier fallo. **La condicion tiene que
nombrar por que falla.**

### POR QUE NO SE PASA A CODIGO CON LOS MAJORS ANOTADOS

Lo ofreci yo y el CEO lo rechazo con mi propio argumento: **los majors abiertos fallan hacia el
verde, y son criterios que NO PUEDEN SUSPENDER.** Un plan asi no protege la implementacion que
viene detras — se pasaria a codigo *con la sensacion* de tener criterios y sin tenerlos. **No es
acelerar: es mover el rojo a mas tarde y mas caro.**

⚠️ **Y la senal que distingue este bucle de un pozo:** el `SIN:` de la ronda 4 de AIT-92 dice
**"nada"**. No hay huecos de ejecucion; lo que falta esta entero dentro del documento y es
acotable. **Un bucle con `SIN: nada` es distinto de uno donde el auditor no puede comprobar.**

### LA CORRECCION QUE ROMPE LA SERIE (y que debi ver dos rondas antes)

    AIT-92 r2  M5    "los contratos estan descritos, no son criterios verificables"
    AIT-92 r3  M5.2  C11, C13, C14, C16: control positivo FUERA del `FALLA si`
    AIT-92 r4  M7    C2 y C5: control positivo FUERA del `FALLA si`

Misma clase, criterios distintos, una tanda por ronda. **Cuando el mismo hallazgo aparece dos
veces en criterios distintos, la instruccion correcta deja de ser "arregla estos" y pasa a ser
"cuentalos todos"** — con el recuento escrito, para que el auditor pueda refutar CONTANDO en vez
de volver a buscar. Un barrido de candidatos no se cierra; una enumeracion del universo si.

---

## 2026-09-10 ~16:00Z — LA D39-BIS Y LA CLASIFICACION DE MAJORS (decision del Factory Architect)

AIT-134 llego a la **ronda 6 de plan** sin converger. Medido, no deducido (grep de los titulares
`### M/m` en los siete veredictos de la ficha):

    loop1  M1 M2 M3 m1      loop4  M5 M6
    loop2  M1 M2 M3 M4 m1   loop5  M5 M6
    loop3  M1 M2 m2         loop5-bis  M1 M2 M6 m2
                            loop6      M1 M2 M6 m2   <- MISMAS etiquetas, titulos distintos

Los titulos son el mecanismo: `M1` paso de *"la independencia no es verificable"* a *"demuestra
planificacion independiente PERO NO que B ejercite su sujeto"*. **El desarrollador contesta la
objecion y el auditor encuentra la capa siguiente de la MISMA objecion. Cada capa es real, y por
eso no hay a quien culpar y por eso no para.**

**D39-bis (nueva).** No hay tope de rondas —un tope corta igual un bucle sano y no dice por que
sangra—. El disparador es la **firma**:

    D39      el mismo `SIN:` en DOS rondas                      -> para el bucle
    D39-bis  la misma ETIQUETA de major en DOS rondas seguidas,
             habiendo respondido el desarrollador               -> para el bucle

**Test de clase, y a donde viaja cada major:**

    ¿Se cierra CON TEXTO?  SI -> objecion de plan, BLOQUEA el plan.
                           NO, solo pegando la salida de un comando
                              -> criterio de CODIGO: viaja al export de codigo
                                 HEREDADO Y VINCULANTE, con su titulo sin reinterpretar.

Esto **no** contradice la D79. La distincion: un major que dice *"tu diseno esta mal"* movido a
codigo construye lo equivocado (D79 entera). Un major que dice *"no has demostrado X"* donde X
solo se demuestra ejecutando **no es riesgo sin resolver: es una pregunta hecha al artefacto
equivocado**. Mantenerlo en plan no protege nada, solo genera rondas.

⛔ **QUIEN CLASIFICA: EL AUDITOR, en el propio veredicto.** Ni el desarrollador ni la Directora.
El prompt le pide marcar cada major `CERRABLE CON TEXTO` o `SOLO CERRABLE EJECUTANDO`. Cuesta cero
rondas porque ya esta juzgando el contenido.

### 🔴 EL FALLO QUE ESTO DESTAPO, Y ES MIO

Escale al FA que **tres de las cuatro** objeciones "solo se cierran ejecutando". Las clasifique
leyendo **los titulares**. No abri ni una correccion minima. Al abrirlas una por una: **una de
cuatro.** `M2(3)` era una frase —y ademas un olvido del desarrollador, el mismo arreglo que ya
habia hecho en (1) y (2)—; `m2` corre sobre el propio plan, que ya existe; `M6` pide un
instrumento externo, y eso es **git** (commit + `rev-parse` + `status --porcelain` + `diff`), no
ejecutar el producto.

**Un titular dice CUAL es el hallazgo; la correccion minima dice QUE HACE FALTA para cerrarlo.**
Clasifique por el campo equivocado y **el FA construyo una regla operativa encima sin medir la
clasificacion**, teniendo las correcciones minimas a un `sed` de distancia. Su formulacion:
*una regla buena aplicada sobre una clasificacion mala da un resultado malo, y la clasificacion es
el eslabon que nadie mide porque llega envuelta en la pregunta.* Tercera vez el mismo dia con la
forma del respaldo en cadena: **el eslabon que anade autoridad es el que menos mide.**

Lo cazo el desarrollador, **contra su propio interes** (le anadia una ronda). Su frase, que es la
que hay que retener: *tu clasificaste desde el titulo, yo desde el cuerpo; no fue mejor criterio,
fue abrir las correcciones minimas una por una, cinco minutos que ninguno de los dos habia hecho
en seis rondas.*

### DERIVAR UNA LISTA NO ACREDITA SU UNIVERSO

Del mismo hilo (`m2`), y sirve para cualquier inventario de la fabrica. Cuentas del **mismo**
universo de constantes en hora y media:

    ^export const [A-Z_]+_MS      -> 4    <- la mia: la clase excluia DIGITOS y faltaba
                                             PRESUPUESTO_C3_MS, que lleva un 3
    ^export const [A-Z0-9_]+_MS   -> 5
    "la lista de seis"            -> 6    <- el desarrollador dijo seis y enumero cinco
    ambito components/ app/ lib/ e2e/ -> 17   (seis de ellas en su propio spec)
    literales con separador de millares -> 0  <- ver abajo

Ninguna de las cinco se sintio insegura al escribirla, y **todas fallan hacia "inventario
completo"**: numero redondo, plausible, sin senal.

Y la ultima es la peor. El desarrollador aviso de que `\b[0-9]+\b` no casa `30_000` *"entero: ve
`30` y `000`"*. Lo ejecute antes de respaldarlo:

    printf 'const X = 30_000;\n' | grep -oE '\b[0-9]+\b'   ->  SIN SALIDA

`_` cuenta como caracter de palabra: `30_000` es **una sola palabra** y el literal **no se parte,
desaparece**. La correccion cambia la direccion y por tanto el control: su version produce ruido
visible (dos numeros de mas), la real produce **una ausencia sin senal**. Un control disenado
contra la version equivocada busca fragmentos raros; contra la real hay que buscar lo que falta.

**REGLA:** todo comando que DERIVE una lista va con (a) su **ambito declarado** y (b) un **testigo
que el ancla mala dejaria fuera** — si el testigo pasa con las dos versiones del comando, no es un
control. Aqui: `PRESUPUESTO_C3_MS` para los digitos, `86_400_000` para el guion bajo.

### ESTADO DE LA COLA AL ESCRIBIR ESTO (16:00Z)

    CORRIENDO  T1 AIT-141 plan-loop5  (arranco 15:56Z, verificado por efecto: tee con 8729 bytes
                                       a los 20s; discriminante `C0` = 0 en todos los demas
                                       veredictos y 9 en el export)
    EN COLA    T2 AIT-92  plan-loop8  (congelado 15:28:44Z)
    EN COLA    T3 AIT-134 plan-loop7  (congelado 15:56:02Z, md5 3567bafc4252357e0577aa2e0296fb2a)

⚠️ **Y el fallo recurrente, quinta vez:** el veredicto de AIT-134 r6 estuvo **18 minutos en disco
sin relayar** (serie 11 -> 153 -> 192 -> 12 -> 18). Causa: dispare **sin armar el vigilante**. Los
dos mecanismos no son alternativos — un vigilante muerto avisa (el harness lo notifica) y un
barrido tardio no avisa de nada. **Se arman LOS DOS, siempre, en el mismo gesto que el disparo.**

---

## 2026-09-10 16:20Z — LA COLA ES UN RECURSO, NO UNA LISTA (y la tasa base de rondas)

**AIT-141 tiene GO de codigo y esta entregada al Integrador.** Punta
`e86e488466545e0181b2e98c8699c9a10c5ec56b`. Cero blockers, cero majors, C0..C7 todos en PASA con
el comando de cada uno. Consumio **6 ranuras: 5 de plan + 1 de codigo**.

**AIT-92 paso su gate de plan en la ronda 8.** T2 en implementacion.

### LA TASA BASE, medida (21 fichas, veredictos en disco)

    1 2 2 3 3 3 4 5 5 6 6 6 6 7 8 8 8 11 11 14 19
    mediana 6 · media 6,6 · 138 ranuras totales
    <=2 rondas: 3 de 21 (14%)   ·   >=8 rondas: 7 de 21 (33%)

⚠️ **Sesgo declarado:** cuenta veredictos EN DISCO. Una ronda cuyo veredicto se borrara al
archivar no aparece, asi que **el real es este o peor, nunca mejor.** Y "ranuras" no es "tiempo":
una ronda de plan tarda 2-3 min y una de codigo bastante mas.

Sirvio para corregir una estimacion del PM ("1 o 2 pases" para una ficha pequena, sacada de UN
vecino que cerro en 2). *Un caso adyacente exitoso no es una tasa base: es el MEJOR caso, y se
recuerda precisamente porque salio bien.*

### EL REPARTO CUANDO EL GATE VA EN SERIE

**Las auditorias van de una en una por cupo de Codex.** Formulacion del PM:

> **La cola no es una lista: es un recurso compartido con un dueno externo.** Mandar trabajo a dos
> celulas no dobla el ritmo: dobla la cola del gate.

Asi que al priorizar la pregunta deja de ser *"¿quien esta libre?"* y pasa a ser **"¿cuantos pases
de gate se come esta ficha?"**. Reparto acordado: **el PM ordena el VALOR, la Directora estima las
RANURAS**, y solo se le avisa si la estimacion invierte su orden.

Y su correccion, que es mas precisa que "recortar rondas":

> **Lo que hay que recortar no son las rondas: es la incertidumbre que se resuelve en el artefacto
> CARO.** Ocho de plan y una de codigo es BARATO para la cola. Tres de codigo, no.

AIT-141 es ese perfil exacto: 5 de plan (barato) + 1 de codigo a la primera.

🔑 **Y el aviso que el propio PM se puso, que hay que respetar al comunicar plazos:**

> **Si el que prioriza dice "esto son dos rondas" y va por la cuarta, alguien se siente atrasado —
> y la salida barata de sentirse atrasado es cerrar antes de tiempo.**

La version que se publica es **"si a la tercera sigue abierta, eso es lo normal"**. Misma
aritmetica; una protege el trabajo y la otra lo aprieta.

### ⚠️ UNA VIA POR LA QUE EL GATE CRECE Y QUE NO ESTABA VIGILADA

La detecto T3, no yo. Yo vigilaba que no crecieran los criterios **del encargo que escribo yo**.
Pero el auditor carga ademas `Sorfware Factory/auditor_prompt.txt`, **un fichero del repositorio
que otros roles editan y que se publica en `main` mientras una ficha esta a mitad de sus rondas**.
Hoy gano 26 lineas. Si hubiera ganado la D55, la ronda 8 se habria juzgado contra una regla que no
existia en las rondas 1-7 — **el criterio que crece durante la revision, sin que nadie lo insertara
a mano.** No fue el caso; que saliera bien no arregla que no estuviera mirando.

**REGLA:** antes de disparar una ronda N>1, mirar si ese fichero cambio desde la ronda 1
(`git log` acotado a la ventana de la ficha) y, si cambio, decirlo en el encargo para que el
veredicto declare contra que version juzga. **Enumerar TODAS las entradas del juicio, no solo la
que escribes tu.**

### MI ERROR DE ESTA TANDA: BASE DE OTRO, PREGUNTA DE ESTE

Le avise a T1 de que dos de sus ficheros estaban "en los dos lados" con `main`. **Falso.** Compare
lo entrado desde `f2f0c51` —la base de la rama de T3— contra la huella de T1, cuya base real es
`b1cdbf2`. Medido bien: **ningun fichero entrado en main desde la base de T1 lo toca su rama.**
Numero exacto, sujeto equivocado, y con la agravante de que llego como aviso operativo: el
desarrollador lo habria tratado como restriccion al publicar.

### COLA AL ESCRIBIR ESTO (16:20Z)

    CORRIENDO  T3 AIT-134 plan-loop8   (arranco 16:19:18Z)
    LIBRE      T1 -> AIT-142 (decidido por el PM; ojo: AIT-129 la hizo T2, NO hay ventaja de terreno)
    IMPLEMENTA T2 AIT-92 (GO de plan en la r8)
    AL INTEGRADOR  AIT-141, con las tres comprobaciones de publicacion a las 16:17:13Z
                   — CADUCAN si `main` se mueve antes del merge; se repiten, no se heredan.

---

## 2026-09-10 16:30Z — D39-bis GANA SU DISCRIMINANTE, Y M1 VIAJA A CODIGO

### EL DISCRIMINANTE QUE LE FALTABA A LA D39-bis

La D39-bis disparo en AIT-134 (`M1` en la r7 y `M1` en la r8, con respuesta del desarrollador en
medio, y el auditor diciendo *"esto es la capa siguiente de la misma objecion"*). Pero disparo por
lo que la regla NO quiere cazar. Lo que faltaba, adoptado por el Factory Architect:

> **Un gate que TRABAJA puede senalar la frase DEL PROPIO ARTEFACTO que la ronda no cumplio.**
> **Un gate que GIRA trae una exigencia que no esta escrita en ninguna parte del artefacto
> anterior.**

**Se comprueba desde fuera y no depende de que nadie declare sus intenciones.** La D39-bis queda:
dispara por repeticion de etiqueta, y **antes de parar se contesta esa pregunta**. Si la exigencia
ya estaba en el artefacto, el gate trabaja y **parar seria cerrar con el hueco dentro**.

### 🔑 EL PATRON NUEVO: EL CUERPO NO LLEGA AL TITULO

Es la INVERSA de lo que llevamos el dia cazando. Literal del export de T3, lineas 46-51:

    QUÉ SEÑAL SÓLO PUEDE PRODUCIRSE AL ALCANZAR EL SUJETO DE B      <- encabezado
        ...no hay camino por el que un `302` con `Location: /login`
        aparezca sin haberse emitido LA PETICIÓN                     <- lo que demuestra debajo

**El titulo promete exclusividad respecto al SUJETO; el cuerpo la demuestra respecto a la
PETICION.** Dos sujetos, el del cuerpo estrictamente mas debil. Consecuencia medida: **una
precarga que alcanzase la ruta daba VERDE con B sin invocar nada.**

> *Normalmente el rotulo sobrevive a un cuerpo corregido. Aqui el rotulo era correcto y el cuerpo
> entrego menos. Nadie lo caza releyendo, porque leidos seguidos suenan a lo mismo.* (T3)

**Como salio:** no releyendo, sino **preguntando al criterio desde el otro lado** — no solo "¿puede
salir verde sin la senal?" sino **"¿puede haber senal sin el sujeto?"**.

### LA DECISION: M1 VIAJA A CODIGO

Criterio heredado y **vinculante**, con su titulo sin reinterpretar. Razon del FA, y la distincion
que la separa de lo que me rechazo por la manana: entonces yo movia **riesgo de diseno sin
resolver**; ahora el diseno esta aprobado y lo que viaja es **la validacion de un INSTRUMENTO**.

> **La discriminacion de un instrumento se demuestra corriendolo contra un caso que deberia
> fallar. Eso NO SE PUEDE HACER EN UN PLAN.**

⛔ **El auditor confirma la reclasificacion en una linea al recibir el export de codigo.** Si dice
que no, vuelve a plan.

### REGLA NUEVA SOBRE MI PROPIO CANAL

Un criterio que entra por un canal que solo controla quien dispara **no es auditable por nadie**.
Desde ahora cada encargo lleva una seccion literal:

    === AÑADIDO POR LA DIRECTORA A ESTE ENCARGO, más allá del prompt publicado ===

Queda en el fichero del veredicto porque el `tee` captura el eco del encargo entero. **Cero coste.**
Nace porque hoy declare voluntariamente que una pregunta la habia metido yo, y esa declaracion fue
**el unico dato que distinguia un gate que giraba de uno que trabajaba** — que no es un mecanismo,
es suerte con buena voluntad.

### EL CHECKOUT COMPARTIDO: TRES REGLAS, Y MI CONCLUSION ERRONEA

El `main` local lo comparten seis roles. Estado peligroso medido hoy: `origin/main..main` con
commits del Integrador **y mios trenzados**, y el cerrojo no lo cubre.

    1. comprobar `origin/main..main` ANTES de empujar            (CEO)
    2. y mirar DE QUIEN es cada commit, no solo si los hay       (mia)
    3. quien commitea en un checkout compartido pone su trabajo
       en la pila de otro aunque no empuje                       (mia)

🔴 **De la 3 saque "entonces no commiteo" y era PEOR que el problema.** Correccion del CEO:

> **La accion irreversible es el `push`, no el `commit`. Un commit sin empujar es un estado
> NOMBRADO y reversible; un fichero sin commitear en un checkout compartido es un estado ANONIMO
> que cualquiera arrastra con un `git add -A` sin enterarse.**

Cambie un riesgo visible por uno invisible. **Es la forma del dia otra vez: un diagnostico correcto
produciendo una contramedida que cuesta mas que el defecto** — la misma que "dejo de depender de
vigilantes de fondo", que era cierta en su premisa y costo 12 minutos de relay.

### PENDIENTE DE RESPUESTA (no de trabajo)

T3 pregunta si la reclasificacion de M1 paso por Aitor. **NO paso.** El texto publicado
(`intro-terminal.txt`, incidente AIT-76) dice *"se le pide a Aitor a traves del Factory Architect;
nadie mas puede concederla"* — y **nombra al FA como la VIA, no como el que concede**. Mi lectura
es que ese parrafo gobierna SALTARSE la fase de plan, y AIT-134 no se la salto (ocho rondas, tres
majors cerrados). **Pero no la resuelvo yo:** esta manana lei una regla a mi favor y concedi un "GO
condicionado" que no era mio. Preguntado al FA: ¿sencillo (suyo) o sustancial (de Aitor)?
T3 implementa pero **no exporta hasta tener respuesta**.

### COLA (16:30Z)

    PLAZA PARADA A PROPOSITO — el Integrador tiene los cerrojos desde 16:20:38Z y hay
    suite viva con 0,6 GB libres. Parar y decirlo no es estar parado.
    CONGELADO SIN DISPARAR  T1 AIT-142 plan-loop1 (md5 081b47cbd3bde2341da4031787a3a867)
    CONGELADO Y YA CADUCO   T2 AIT-92 codigo-loop1 — el PM le anadio trabajo, no se dispara
    IMPLEMENTANDO           T3 AIT-134 · T2 AIT-92
    PUBLICANDOSE            AIT-141

**AIT-145 abierta** (el ataque de fijacion del flujo OAuth que T2 encontro implementando y que
ocho rondas de plan no vieron): ficha propia, High, **no bloquea AIT-92 porque hoy no es
explotable —produccion no tiene credenciales de Gmail—**, pero es **PRECONDICION DURA para activar
Gmail con usuarios reales**, igual que AIT-144. AIT-92 lleva un `FALLA si` para no cerrarse dando
a entender que Gmail es seguro de activar.

---

## 2026-09-10 ~16:55Z — DOS COSAS DE SEGURIDAD QUE OCHO RONDAS DE PLAN NO VIERON

### 🔴 AIT-92 CODIGO r1: NO-GO, y M1 es un XSS REFLEJADO

    convex/http.ts:26,:43,:49 — `pagina()` concatena `detalle` en HTML SIN ESCAPAR
    `error` viene directo de la query publica
    EJECUCION ADVERSARIA del auditor: payload que cierra <p> e introduce <script>
      -> scriptTags: 1 · escapedLt: 0

`/gmail/oauth/callback?error=<payload>` -> el navegador ejecuta contenido activo bajo el origen
`.convex.site`. **La puerta es la rama de manejo de errores** — la que existe para ser amable
cuando algo falla. Direccion: *"la rama parece EXPLICAR el error, pero entrega HTML controlado por
el solicitante"*. `CERRABLE CON TEXTO`.

**Y es la SEGUNDA cosa de seguridad de esta ficha en una hora**, despues del ataque de fijacion
del flujo OAuth (AIT-145). **Las dos aparecieron AL IMPLEMENTAR, no en ocho rondas de plan.**

**M2 contesta la pregunta del arnes en contra de la salida barata:** *"si requiere incorporar
`convex-test`, esa decision debe resolverse DENTRO de esta ficha porque el propio plan hizo
obligatorio el arnes"*. Seis criterios no son atribuibles al codigo. Y su remate:
**"M1 es una demostracion concreta de la clase de defecto que las pruebas puras no observan"** —
el XSS vive exactamente en el encadenamiento que las funciones puras no tocan.

**24 criterios marcados `NO EJECUTADO`.** Se lo pedi explicitamente como resultado legitimo, para
que no lo convirtiera en PASA porque la evidencia del export pareciera suficiente.

### EL RECURSO NO ERA EL QUE YO DECIA

Llevaba el dia avisando con "memoria reclamable" (`vm_stat free+inactive`). **No es el recurso: lo
que agota una corrida es el SWAP**, que estaba al 94%. Corregido por el Integrador — y su
atribucion tambien era inexacta: dijo que mi numero *era* el swap, y son dos magnitudes distintas
que coincidieron un minuto (0,85 vs 0,84 GB a las 16:47; **2,37 vs 0,95 GB un minuto despues**).
**Encontro otro numero que coincidia y lo llamo el mio.**

⚠️ **El daño del rotulo, que es lo que importa:** quien lea *"quedan 0,6 GB"* como DISCO borrara
caches y `node_modules` **y no cambiara nada** — sobran 475 GB. La cifra sobrevive intacta al
relayo y **el sustantivo que la acompaña es el que dirige la accion.**

`encolar.sh` ya avisa con `sysctl vm.swapusage`. **No bloquea**: el umbral no esta calibrado y un
guard que nunca deja pasar no protege, para. Y la cifra **no se relaya nunca sin hora**: 757M
(Integrador), 901M (QA), 1400M y 991M (mias) en media hora.

### 🔑 TRES CATEGORIAS, NO DOS (correccion de T3 a una regla mia de todo el dia)

Llevaba doce horas repitiendo *"al respaldar, di con que lo comprobaste"* como si una afirmacion
sin medir no valiera nada. **Falso, y el contraejemplo fue mio**: avise de que el peligro estaba en
los verdes que discriminan menos —**una corazonada, no medida**— y T3 fue a comprobarlo y encontro
un ablandamiento real que habria publicado un numero falso en una ficha.

    afirmacion DECLARADA sin medir, que dispara una medicion .... vale mucho
    afirmacion PRESENTADA COMO MEDIDA sin serlo ................. miente
    afirmacion RESPALDADA EN CADENA sin que nadie mida .......... miente MAS: suma firmas

> **La primera y la segunda se parecen en el papel y solo se distinguen por si el autor dice de
> que clase es la suya.**

**No reprimir la corazonada: ETIQUETARLA.**

### EL ABLANDAMIENTO QUE T3 ENCONTRO, Y LA FRASE VIVA QUE LO NEGABA

    ANTES: elServidorDejaEntrar = !(denegacion)        -> un ANOMALO CONTABA como entrada
    AHORA: elServidorDejaEntrar = ===ACCESO_CONFIRMADO -> un ANOMALO no cuenta como NADA

Suena mas estricto y **para los conteos es mas flojo**: C2a pasa mas facil y **C2c ACORTA la
ventana residual medida** — un numero mas bonito por un fallo, no por un cierre. **Nada de esto se
pone rojo.** El numero YA PUBLICADO de AIT-127 (162 ms mediana / 485 peor caso) **NO esta
corrompido**: salio del predicado viejo. Lo que se habria corrompido son las mediciones futuras.

⚠️ Y en su propio fichero seguia viva la frase que decia lo contrario (`:118`, *"los que CUENTAN
entradas se vuelven mas exigentes -> hacia el rojo"*), **dentro del bloque que explica esa misma
leccion**. Corregida citandola en pasado y etiquetada como falsa, no sustituida en limpio.

**La leccion buena es mas fuerte que la que habia:** los CUATRO consumidores iban hacia el verde,
por DOS mecanismos distintos — los que esperaban `true` porque pasan mas facil, y los que cuentan
porque **pierden el caso**.

### AIT-142: TRES RONDAS Y EL HUECO SE MUDA A LA FRONTERA NUEVA

    r1 M1: prueba una DERIVADA (quito los tipos para ejecutar)
    r1 M1: verbatim, pero la funcion NO ES AUTONOMA -> no arranca
    r2 M1: arranca, pero puede no entregar una `initials` INVOCABLE -> falla DENTRO de la comparacion

**Cada arreglo mueve la frontera y el hueco se muda a la frontera nueva.** Lo que lo corta no es
afinar otra vez: es lo que pide el auditor ahora, **un RECUENTO POSITIVO de 17 casos ejecutados
POR CADA COPIA** — un numero que tiene que salir, en vez de una lista de fallos que no deben salir.
**Una expectativa negativa cumplida no implica la positiva**, y llevabamos tres rondas
comprobando la negativa.

**M2 RESUELTO:** mover el corpus a `e2e/casos-iniciales.ts` en vez de duplicarlo. El auditor:
*"mantiene una unica fuente contractual y evita que dos copias diverjan. NO recomiendo duplicar."*
Reparto medido antes: **ninguna rama tiene `e2e/00-initials.spec.ts` en su huella
`origin/main...punta`**, con control positivo de que el comando SI ve ficheros de `e2e/`.

### COLA (16:55Z)

    T3   suite completa de AIT-134 — LA PLAZA QUEDA PARADA hasta que termine (11 min, swap al 93%)
    T2   AIT-92: cuatro majors, empezando por el XSS
    T1   AIT-142 r3: la frase del cuarto estado + recuento positivo por copia
    AIT-141 publicada y desplegada · SIN Done: el `PASA si` es de Aitor

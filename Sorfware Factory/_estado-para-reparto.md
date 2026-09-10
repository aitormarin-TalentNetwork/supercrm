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

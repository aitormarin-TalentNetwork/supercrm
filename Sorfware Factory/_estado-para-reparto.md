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
2. **`~/.claude.json`** — PASO CONCRETO: **aplicar la configuracion del MCP de cada
   terminal**, que es lo que desbloquea AIT-97. Fichero personal suyo y NADIE de la fabrica
   lo toca.
   ⚠️ Este punto llevaba TODO EL DIA en mi lista como "`~/.claude.json`" a secas, y aqui
   escrito con su CONSECUENCIA en vez de con su PASO. Lo cazo el criterio del PM aplicado
   por mi a mi propia lista. **Una consecuencia bien escrita se siente como una
   especificacion y no lo es**: dice POR QUE importa, no QUE hay que hacer — y falla hacia
   el silencio, porque nadie pregunta "¿y que hay que hacer?" cuando el texto ya suena
   informado. El dato lo tenia el PM desde hacia media hora, en otra ficha, y ninguno de los
   dos lo conecto.
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
**SE LEVANTA CUANDO:** exista `VEREDICTO_T3_AIT-134_codigo-loop*.txt` con esa linea. Comprobable
por quien lea esto, sin preguntarle a nadie.

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

🟢 **CONDICION LEVANTADA 18:43Z POR EL FA — ver "EL DETECTOR QUE SE ENCUENTRA A SI MISMO" mas
abajo. Lo de este parrafo es el estado de las 16:30Z y NO esta vigente: el FA respondio
SUSTANCIAL (va a Aitor) y que T3 SI EXPORTA, porque la respuesta hace falta ANTES DEL MERGE,
no antes del export. La frase de abajo "T3 implementa pero no exporta hasta tener respuesta"
YA NO RIGE. La lei viva a las 18:40Z y pare a T3 con el export terminado.**

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

---

## 2026-09-10 17:07Z — MIS LIMITES DECLARADOS, SACADOS DEL CHAT (cada uno con su etiqueta)

Un desarrollador me hizo aplicarme su propio test y salio esto: **en este fichero apenas tengo
limites declarados; estan casi todos en MENSAJES.** Y eso no es tranquilizador, es peor:

> **Un limite declarado en un mensaje cumple su funcion tranquilizadora con quien lo lee hoy y
> DESAPARECE antes de que nadie pueda ir a medirlo. Tiene el coste de la declaracion y ninguno de
> sus beneficios.**

Asi que los traigo aqui. Etiqueta obligatoria, como el `auditor_prompt` separa *pared medida* de
*sospechada y no medida*. **Una declaracion sin su estado de medicion se lee siempre en la
direccion tranquilizadora.**

    [MEDIDO]      lo he comprobado, y asi
    [NO MEDIDO]   lo declaro y NADIE lo ha comprobado  <- estos son los que hay que ir a mirar

### Sobre mis propios instrumentos

- **[MEDIDO]** El reparto plan/codigo (104/15) tiene **21 veredictos de la convencion antigua sin
  clasificar**. Si fueran todos de codigo, seria 104/36. **El sesgo va hacia abajo.** No los he
  abierto: el PM decidio que no cambia ninguna accion.
- **[MEDIDO]** Mi detector de huerfanos exigia `plan|codigo` y **el proceso publicado no pide
  `codigo-`**: `T1_AIT-99_..._loop2` es invisible ahora mismo. Acepta las dos formas desde hoy.
- **[MEDIDO]** Mi control de identidad pedia "la ultima linea con contenido" y en algunos exports
  esa linea es una fila de `=` **identica en todos**. Pide la del `FIN DEL EXPORT`.
- **[NO MEDIDO]** El umbral de swap de `encolar.sh` **no esta calibrado**: avisa, no bloquea, y no
  se de que numero para abajo muere una corrida. Solo se que a 861M murieron 2 de 4.
- **[NO MEDIDO]** No se si mis anclas de `grep` cubren lo que creo en NINGUN barrido que haya hecho
  hoy salvo donde puse control positivo o ensanche el filtro. Tres veces me han fallado.

### Sobre lo que entrego

- **[MEDIDO, Y CADUCA]** Las tres comprobaciones de publicacion (`ls-remote`,
  `merge-base --is-ancestor`, `merge-tree` con control de degeneracion) valen **el instante en que
  se hacen**. Protocolo acordado con el Integrador: **no le mando el resultado, le mando la HORA**,
  y las remide el pegado al merge.
- **[NO MEDIDO]** Mis estimaciones de ranuras son **tasa base con intervalo, no prediccion**. La
  de AIT-142 (3-4) cuelga de un mecanismo —universo cerrado desde la r1— que **puede refutarse**:
  si llega a la quinta ronda, la teoria es falsa y hay que decirlo.

### Sobre el estado de la fabrica

- **[MEDIDO]** `origin/main` y `origin/main..main` **caducan entre dos comandos**. Confirmado dos
  veces hoy: el Integrador me dio `0492aa2` y un minuto despues era `939d391`.
- **[NO MEDIDO]** No se cuantos limites declarados vivos hay en los ficheros de la fabrica sin su
  etiqueta. El de T3 —*"este regex no se verifica leyendolo"*— paso ocho rondas y era falso.

**REGLA QUE SALE DE AQUI, y aplica a todos:** un limite se escribe **donde sobreviva a la
conversacion** y **con su etiqueta**. Y al LEER el limite de otro, tratarlo como **un puntero a
donde mirar, no como una casilla ya marcada** — que es exactamente lo contrario de lo que hace el
lector por defecto.


---

## 2026-09-10 17:12Z — LOS SIETE PENDIENTES DE AITOR SON PARADA, NO ESPERA

Regla del PM, que cierra un hueco que yo le habia senalado en la suya:

> **Un paso nombrado y NO PEDIDO no es espera: es PARADA.** La ficha declara **cuando se le
> pidio al ejecutor**, no solo quien es.

**Su motivo, que es el bueno:** *una ficha con dueno nombrado SE SIENTE ATENDIDA, y por eso deja
de mirarse.* La fecha de peticion es lo unico que convierte "tiene dueno" en "esta en marcha".

🔴 **Aplicado a mis siete pendientes de Aitor: a NINGUNO se le ha pedido nada, porque Aitor no ha
estado en toda la sesion.** O sea que **los siete son PARADA y estan en nuestra mano, no en la
suya.** Eso cambia lo que son: no es una lista en la que esperar, es **una lista que hay que
entregarle en cuanto aparezca**, y cada minuto que no aparece no es tiempo de espera de nadie.

Los siete, con su paso nombrado (el test: ¿PASO + QUIEN?):

    1. cuatro permisos de AIT-99 (desbloquean AIT-125)   conceder             Aitor
    2. `~/.claude.json`                                  aplicar config MCP   Aitor
    3. `GMAIL_TOKEN_ENCRYPTION_KEY`                      generar -> Bitwarden Aitor
    4. `getOverdueCountsByOwner` en produccion           mirar                Aitor
    5. la query de AIT-141 en `stoic-impala-857`         mirar                Aitor
       (bloquea marcar AIT-141 Done)
    6. major que sale de un gate de plan sin cerrarse    decidir              Aitor via FA
    7. sentada AIT-144 + AIT-91                          abrir Gmail, gate    Aitor
       (primero el gate; si Google exige verificacion, la premisa 1 deja de importar)
       🔴 ENCLAVAMIENTO, y es lo mas importante de los siete: **el dia que se metan
       `GMAIL_CLIENT_ID` y las credenciales en produccion, AIT-145 se vuelve
       EXPLOTABLE sin que nadie tome una decision de publicacion.** Un atacante
       vincula el buzon de la victima a su propio usuario CRM.
       ⛔ **CONDICION, no estado: NO se ponen credenciales de Gmail en produccion
       MIENTRAS AIT-145 no este cerrada.** Comprueba su estado en Linear antes de
       actuar — este parrafo enuncia la condicion, no el estado.
       (Lo que hoy lo hace inexplotable es que produccion no tenga esas credenciales;
       escribirlo como "hoy no es explotable" seria una afirmacion que **caduca
       exactamente el dia que importa**.)
       ⛔ **Meter una variable de entorno no se siente como publicar una
       vulnerabilidad conocida**, y ahi esta el peligro: el estado peligroso lo crea
       una accion POSTERIOR que nadie conecta con el merge de AIT-92.
       El Integrador lo pone en `docs/03-setup.md`, que es donde mira quien configura
       las variables. **Va tambien AQUI porque si solo esta en el fichero depende de
       que lo abra, y si solo esta en mi lista depende de que yo este delante.**
       Formulacion del Integrador, 2026-09-10.

**Y el hueco que le quedaba a la regla del PM, que el mismo cerro:** su criterio distinguia
abandono de espera, pero **no espera de espera indefinida** — una ficha con dueno nombrado sigue
pasando el test para siempre. La fecha de peticion lo cierra.

---

## 2026-09-10 17:27Z — RESTAURAR UNA ROTURA DELIBERADA: LAS CUATRO FORMAS DE FALLAR

Salio de tres desarrolladores tropezando con el MISMO defecto en dos horas, cada uno por una causa
distinta. **Yo lo aprendi del primero, lo verifique, lo escribi en mi cuaderno y NO lo reparti** —
el segundo lo cazo mirando la salida por casualidad, y el tercero encontro la forma peor. **El
fallo no fue de conocimiento sino de DIFUSION**, y esos no se arreglan acordandose mejor: por eso
esto va aqui y al `intro-terminal.txt`.

### Las cuatro formas

    (1) fichero TRACKEADO, restauras, y el exit se pierde en una TUBERIA
        `git checkout -- X` grita: stderr + exit 1. Pero `$?` detras de `| tee` es el de `tee`.
        -> se restauro mal y el script sigue como si nada.        [T2, con un XSS dentro]

    (2) fichero SIN TRACKEAR: no hay indice del que restaurar
        exit 1 + "pathspec did not match any file(s) known to git", y LA ROTURA SE QUEDA.
        ⚠️ Si el TEST tampoco esta trackeado, se commitea el defecto CON SU TEST EN VERDE AL LADO
        — no un fallo silencioso: una ACREDITACION FABRICADA del fallo.        [T3]

    (3) commiteaste el fichero YA ROTO y restauras -> **exit 0** y el fichero sigue roto
        No es un fallo de git: restauro al indice, que estaba envenenado. **Esta NO GRITA.**
        > El exit dice "restaure al INDICE", NO "el fichero esta BIEN".
        > Son dos afirmaciones distintas y solo la primera esta medida.        [T1]

    (4) el estado de referencia se SUPONE bueno
        Es (3) un paso antes: no basta con "el md5 de antes de romper".        [T3]
        > **La referencia es el md5 de un estado cuyas PRUEBAS ESTAN EN VERDE.**

### El procedimiento que cubre las cuatro

    1. dejar el arbol con las pruebas EN VERDE   <- esto define "bueno", no la intuicion
    2. md5 de cada fichero que se va a romper    <- APUNTARLO
    3. commitear ese estado (si el fichero es nuevo, tambien: si no, no hay a donde volver)
    4. romper
    5. restaurar — y leer el exit del comando EN LA LINEA SIGUIENTE, sin tuberia
    6. md5 otra vez y COMPARAR con el del paso 2   <- lo unico que mide lo que importa

**El paso 5 dice que git hizo algo. El paso 6 dice que el fichero esta bien.** Y para el caso (2)
—fichero sin trackear— **el paso 6 es lo unico que queda**, porque el commit previo no existe.

### Y la regla de export, del Integrador

> **Un export que diga "rompi X y restaure" solo esta acreditado si trae el HASH de antes y el de
> despues y COINCIDEN. Si solo dice "restaurado", NO esta acreditado y se pregunta antes de
> mergear.**

Con su motivo, que es lo que lo hace suyo: **un rojo fabricado y mal restaurado entra en `main`
con aspecto de trabajo normal** — un fichero nuevo con contenido plausible, no un diff que grita.

### Y una del mismo turno, sobre el REVERSO de un criterio

Al estrechar C7 hubo que escribir su negacion como test. T3 le anadio una tercera condicion que
nadie habia pedido, y su motivo es general:

> **Al escribir la negacion de un criterio, la negacion hereda el MUNDO pero no las GARANTIAS.**

Su caso: *navega + no avisa* lo cumplia exactamente **el defecto que C7 existia para impedir**.
Hay que volver a preguntarse **que defecto satisface la negacion**.

---

## EL DETECTOR QUE SE ENCUENTRA A SI MISMO A RATOS (18:40Z, ACREDITADO)

Tercera version en un dia de la misma linea de `encolar.sh`, y las tres fallaron por
una raiz que no vi hasta medirla contra una suite REAL (la del Integrador, 18:36:04Z):

    manana    pgrep -f "playwright"              10 servidores MCP. Bloqueo la cola 8 min.
    tarde     pgrep -f "playwright test"         se contaba a SI MISMO (3, las tres mias)
    18:37:12  pgrep -f "node.*playwright.*test"  = 2   <- detecta la suite
    18:37:36  el MISMO patron                    = 3   <- y uno era MI PROPIO BASH (80668)

⚠️ **Dos y tres, con veinticuatro segundos entre medias y la misma suite corriendo.**

> **Un detector que se encuentra a si mismo INTERMITENTEMENTE es peor que uno que lo hace
> siempre: pasa sus propias pruebas y falla en produccion.**

Y la raiz no es el patron sino la FORMA de preguntar: **cualquier cadena que yo escriba
viaja dentro del comando que la busca.** Por eso el ancla ya no es una cadena elegida por
mi, sino DOS PROPIEDADES DEL SUJETO que mi shell no puede tener:

    (a) el proceso cuelga del node_modules DE ESTE REPO   (los MCP viven en ~/.npm/_npx)
    (b) su linea no contiene "shell-snapshots"             (firma de las shells de Claude Code)

ACREDITADO 18:38:22Z, con la suite viva:  3 procesos de suite · 10 MCP FUERA.
Refutado por el camino un candidato mio: anclar a `node_modules/.bin/playwright` daba **12**,
porque el binario de los MCP tambien vive en *un* node_modules. **Lo que discrimina no es
"playwright": es DE QUE ARBOL cuelga.**

⚠️ **Y casi la doy por probada sin ejercitarla:** al correr el gate entero, **el cerrojo
rechazo antes** y la guarda de suite no llego a evaluarse. **Un criterio tapa a otro.** La
extraje del fichero y la corri sola: rechaza. [MEDIDO 18:39:32Z]. Falta el control negativo
(0 sin suite), que llega solo cuando termine la corrida.

## EL CONTROL POSITIVO CUYO SUJETO NO EXISTIO (18:33Z)

El Integrador me abrio una ventana para acreditar el patron; la suite murio a los SEIS
segundos (gate de precondiciones = 1) y me aviso a tiempo. **Si la hubiera medido, me habria
dado 0 y yo habria escrito "mi patron no detecta" — y habria cambiado un instrumento que
estaba bien, con una medicion respaldandolo.**

> **Un control positivo cuyo sujeto no existio no se calla: MIENTE, y miente en la direccion
> de refutar el instrumento. Es mas caro que no medir.**

## HUECO DE CLASE EN MIS GO DE CODIGO: MERGEABLE NO ES EJECUTABLE

`ls-remote`, `merge-base --is-ancestor` y `merge-tree` responden **"¿entra en main?"**. NO
responden **"¿arranca en la maquina del siguiente?"**, y las dos salen verdes igual.
Medido hoy en AIT-92 por el Integrador, tropezando dos veces:

    vitest: command not found (127)   la ficha trae package.json nuevo; el arbol limpio no lo tiene
    9 funciones Convex sin desplegar  `git pull` trae el codigo de una funcion; NO la despliega

El auditor midio `test:callback` 19/19 — cierto **en su caja**. El Integrador reprodujo esos
mismos 19/19 **despues** de `npm install` + `npx convex dev --once`. **Ninguno de los dos pasos
vive en un arbol de git, y mis tres instrumentos miden arboles de git.**

> **El "SIN: nada" es cierto dentro de la caja del auditor; lo que la caja no incluia era
> "¿puede otro reproducir esto?"**

PROPUESTO AL FA: seccion obligatoria `=== PASOS DE ENTORNO QUE NO ESTAN EN EL DIFF ===`, y
**si va vacia, que lo diga y lo firme** — una seccion ausente y una vacia se leen igual y
solo una es una afirmacion.

## REGLA DE PARADA DEL PM, CON NUMERO (para que no la apruebe quien no sepa que hubo dos)

    PEOR_SOBRECARGA_MEDIDA_MS   484 -> 556   REGISTRO. Sube siempre. No bloquea por si mismo.
    MARGEN_SOBRECARGA_MS        484 -> 556   el presupuesto se ajusta a la realidad medida
    LIMITE_LIMPIEZA_MS          616 -> 544   lo que QUEDA: 3000 - 556 - 1400 - 500
    PRESUPUESTO_C3_MS                 3000   NO SE TOCA

⛔ **Si `LIMITE_LIMPIEZA_MS` tiene que bajar de ~350 ms (2x el peor caso medido), SE PARA y
vuelve al PM.**
**NO SE LEVANTA: es permanente.** Lo que caduca es el numero, no la regla — si cambia el peor
caso medido, cambia el umbral, y eso lo decide el PM.
 Van **750 -> 616 -> 544 en una hora**, y esa progresion es invisible si cada
bajada se justifica sola. Se esta gastando presupuesto de producto para absorber un problema
de entorno.

La distincion que separa las dos guardas: **un numero que sube solo porque el mundo empeoro
no debe parar a nadie; un numero que baja porque alguien lo escribio, si.** Por eso
`MARGEN >= PEOR_REGISTRADO` se conserva como bloqueante.

## AIT-134: EL CAMPO DEL RECLASIFICADOR, SEPARADO EN TRES

    razon tecnica ... del Factory Architect (un instrumento se valida corriendolo contra un
                      caso que deberia fallar, y eso NO SE PUEDE HACER EN UN PLAN)
    decision ........ MIA. Firmo yo.
    confirmacion .... PENDIENTE del auditor, en una linea, al recibir el export de codigo
    por Aitor ....... NO PASO

🔴 **CORREGIDO 18:43Z, 3 minutos despues de escribir lo de arriba. El FA SI habia respondido y yo
lo di por no respondido.** Su respuesta, textual:

    reclasificacion de M1 = SUSTANCIAL -> va a AITOR. La via es el FA.
    T3 EXPORTA con la pregunta declarada en la cabecera.
    ⛔ La respuesta hace falta ANTES DEL MERGE, NO antes del export.

**Asi que T3 exportando a las 18:35:29Z es CORRECTO y AIT-134 SE ENCOLA.** Lo bloqueado es
el merge. Yo habia leido `:704` —*"no exporta hasta tener respuesta"*— como una condicion viva,
y **era un estado congelado de las 16:30Z que la respuesta del FA ya habia superado**.

> **Un fichero que sobrevive a la sesion tambien sobrevive a su propia correccion: una condicion
> escrita ahi sigue leyendose como viva mucho despues de haberse resuelto en otro sitio.**

El fallo de fondo lo asume el FA y es el mismo del dia: **lo respondio en un chat y no quedo
donde sobrevive**. Pero la mitad mia es real: **pare a T3 por una condicion caducada que yo
misma habia escrito**, y mi prudencia (no encolar sin saberlo) fue correcta solo por casualidad.

## AIT-143 LLEGA A LA COLA CON DOS PUERTAS CERRADAS CON LLAVE QUE NO DEBERIAN ESTARLO

El cupo de login (medido en el momento equivocado) y la memoria (descartada con
`free` leido como si fueran dos extremos, con totales distintos: 14336 vs 16384, ni
comparables). **Un descarte mal hecho es peor que no haber mirado: convierte una zona en
tierra prohibida.** La ficha nunca lo afirmo — la afirmacion falsa vivia en nuestros mensajes,
asi que **retire algo del sitio equivocado y el sitio bueno quedo intacto por suerte**.

## EL DETECTOR NO ESTABA ROTO: LA MARCA QUE LEE NO LA ESCRIBE NADIE (CORREGIDO 18:43Z)

`_detector-exports-sin-veredicto.sh` marca 🔴 SIN RELAYAR las NUEVE rondas de plan de AIT-134.
Yo diagnostique **ruido** ("la direccion protege, la frecuencia gasta; con nueve rojos fijos
deja de leerse") y **dije que le faltaba un observable, que yo relayo por SendMessage y no deja
rastro**. Las dos cosas eran falsas. Medido por el FA:

    veredictos en la carpeta ........................ 75
    ficheros con la marca RELAYADO .................. 0    <- CERO. Ninguno, nunca.
    veredictos de AIT-134 ........................... 11   (0 con marca)

**El observable EXISTE**: lo decidio el FA a mediodia y el CEO lo ejecuto a las 12:10:11Z con su
`VIGENTE_DESDE`. **En seis horas y media no lo ha escrito nadie, el FA incluido, que lo decidio.**

🔑 **Asi que los nueve rojos no son ruido: son nueve veces que la marca debia estar y no estaba.**
Las nueve rondas son posteriores al corte.

> **Iba a retirar un detector que funcionaba porque medi su ruido y no su verdad. Un control que
> grita mucho puede estar gritando con razon, y "esto ya no se lee" describe al lector, no al
> instrumento.**

⛔ **DECISION DEL FA, y la parte que ejecuto YO: relayar INCLUYE escribir la marca.** Vive donde
ocurre el relay, o sea en mi paso y en `director.md`. Una linea anexada al veredicto:
`RELAYADO <hora UTC> a <terminal>`.

Y el nivel de abajo, del QA: **un control que nunca se ha ejercitado no esta validado, esta sin
usar** — aqui lo que nunca se ejercito **es el observable**.

## PARA AITOR, LO QUE EMPEORA SOLO (va PRIMERO de su lista)

🔴 Convex avisa: *"Your projects are above the Free plan limits… avoid service interruption."*
**Amenaza `stoic-impala-857`, o sea PRODUCCION.** Es lo unico de su lista que **se degrada con
el tiempo sin que nadie haga nada mal**; las otras ocho estan paradas esperandole y no empeoran.
🟡 `npm install` reporta 10 vulnerabilidades (2 criticas, 6 altas). Solo se ven cuando alguien
instala, y hoy nadie mas iba a hacerlo.

---

## UNA CONDICION BLOQUEANTE NOMBRA QUE LA LEVANTA (regla nueva del FA, 18:45Z)

Hoy pare a T3 con un export terminado leyendo como viva una condicion de las 16:30Z que el FA
habia levantado horas antes en otro sitio.

> **Un fichero que sobrevive a la sesion tambien sobrevive a su propia correccion. La condicion
> queda escrita; su levantamiento ocurre en otro sitio.**

⚠️ **Y la DIRECCION es lo que explica por que no salta sola** (formulacion de T3): una condicion
caducada que **libera** se descubre en cuanto alguien la usa; una que **RETIENE no produce ninguna
senal. Nadie protesta por un trabajo detenido de mas.** Falla hacia la prudencia, y por eso dura
horas sin que nadie note nada.

🔴 **Mi arreglo era malo y el FA lo refuto:** yo propuse *"anotar «levantada el …» junto a cada ⛔"*,
y **eso tiene el mismo fallo que intenta cazar: depende de que alguien VUELVA**, y quien levanta la
condicion esta en otro sitio pensando en otra cosa.

⛔ **LA PIEZA VA EN EL MOMENTO DE ESCRIBIRLA, NO EN EL DE LEVANTARLA:**

> **Una condicion bloqueante NOMBRA QUE LA LEVANTA.**
> *"⛔ T3 no exporta — se levanta cuando el FA responda sencillo/sustancial."*

Con eso el lector no tiene que confiar en la linea: **tiene que COMPROBAR si eso paso.** Convierte
*"¿sigue viva?"* de pregunta de MEMORIA en pregunta VERIFICABLE, y la contesta quien esta delante.
Anotar el levantamiento sigue siendo bueno, **pero es la red, no la viga.**

📊 **MEDIDO EN MI PROPIO FICHERO, 18:46:26Z:**

    condiciones bloqueantes (⛔) ............... 9
    que nombran que las levanta ............... 0    <- nueve de nueve

## EL DETECTOR: LINEA DE CORTE, NI BACKFILL NI SILENCIO (decision del FA)

Ni inventar nueve marcas sacadas de mi recuerdo (*un backfill apaga nueve alarmas con datos que
no medi*), ni dejar nueve rojos indistinguibles del decimo. **Categoria propia:**

    SIN MARCA — ANTERIOR AL CORTE      (los anteriores al VIGENTE_DESDE de las 12:10:11Z)
    SIN RELAYAR                        (los de verdad, a partir de ahora)

**Y se agotan solos:** cada relay marcado nace en el lado bueno, asi que la categoria vieja no crece.

## EL TEXTO QUE DOCUMENTA UNA AUSENCIA SE CUENTA COMO UNA PRESENCIA (de T1, repartir a los cinco)

> **El fichero mejor comentado es el que mas miente a un grep de menciones.**

T1 midio "5 claves puestas" en su `playwright.unit.config.ts` y **eran las cinco lineas de comentario
que explican por que NO estan puestas**. Y antes, "menciones de navegador" en dos specs puros: rutas
`app/.../page.tsx` dentro de comentarios.

**Cuanto mas cuidadoso es el autor explicando una ausencia, mas falsos positivos produce en quien la
busca — y falla hacia "SI esta", que en una comprobacion de precondiciones es la direccion mala.**

## COLA (18:46Z) — el gate lleva cerrado desde las 18:32:32Z

    17:58:12Z -> RECONGELADO 18:45:28Z  T1 AIT-142 codigo-loop1
                 md5 f91ce61b835d0d8486582ed606134cb6 · 35019 bytes · punta e8723bd9
                 (el md5 viejo 29c8c8ec... esta MUERTO; verificado por mi, no relayado)
    18:13:08Z  T2 AIT-145 plan-loop1   md5 56c5225b24621a333273f1d182953d7b
    18:35:29Z  T3 AIT-134 codigo-loop1 (DESBLOQUEADO: bloquea el merge, no la auditoria)

Orden POR HORA DE CONGELACION. T1 cedio el turno por cortesia y NO se acepta:
**si el orden lo decide la cortesia deja de ser un orden y pasa a ser quien insiste menos —
y el que insiste menos siempre es el mismo.**

---

## MI BARRIDO DEL CODEGEN TENIA EL PUNTO DE REFERENCIA EQUIVOCADO (corregido 19:03Z, lo caza T3)

Barri las cuatro puntas cruzando los ficheros fuente de `convex/` contra su `api.d.ts`, y compare
**contra `main`**. T3 lo midio desde su lado:

    su rama esta 68 commits DETRAS de origin/main · base de fusion f2f0c51, de las 10:04
    los 4 ficheros de diferencia NO faltan en su rama: SOBRAN en main (son de AIT-92)

> **Comparar el codegen contra `main` contesta "¿esta tu rama al dia con lo publicado?".
> La pregunta es otra: "¿TU cambio deja el codegen coherente con lo que TU cambio toca?" —
> y esa se contesta contra la BASE DE FUSION.**

Es el error del rango corto en el otro eje: **el rango largo con el punto de referencia
equivocado**. Y falla hacia acusar a ramas que no han hecho nada, porque `main` se mueve debajo.

⚠️ **Y la otra mitad, que es de T3 y no la tenia:** si el auditor corre esa rama, corre **sin**
las funciones que solo existen en main. **Que no herede el estado de despliegue de una maquina
que corrio `main`.** Es el defecto de AIT-92 visto del reves: alli el auditor tenia de MAS en su
caja y su verde valia solo dentro de ella. **La caja del que mide es parte del resultado en las
dos direcciones.**

## TRES CONTROLES DADOS POR ROTOS SIN MEDIRLOS, EN UN DIA (y el tercero fue el AUDITOR)

    mi detector de veredictos ..... nueve rojos -> iba a retirarlo -> eran VERDADEROS
    el comando de docs/02 ......... da salida   -> "esta roto"     -> es CORRECTO (48 lineas
                                                   de desincronizacion REAL: falta gmailAccounts)
    un patron del FA por la manana  ............................... igual

⛔ **El tercero lo dio por roto el AUDITOR, que es nuestra unica voz externa.** Formulacion del
FA: **si el reflejo de "grita, luego esta roto" ha llegado hasta el, no es la costumbre de un rol,
es del sistema entero.** Y la direccion es la mala: retirar un control que grita con razon deja
el hueco **y** la sensacion de haberlo cerrado.

**Diagnostico de clase, de T2:** *el instrumento existia, estaba publicado, y ningun criterio de
la ficha lo invocaba*. **No fallo el comando: fallo que nadie lo ejecuta.**
**Un comprobador publicado sin un criterio que lo invoque es documentacion, no control.**

## LA PREGUNTA BUENA PARA UN CONJUNTO DE CRITERIOS (de T3, auditando a T2)

No *"¿puede fallar cada uno?"* sino **"¿QUE IMPLEMENTACION ROTA LOS PASA TODOS?"**. Los seis
criterios de T2 eran todos "no se navega, avisa, sesion viva" — **un producto que NUNCA navegue
los pasa los seis**. Lo que lo impide es el REVERSO, que fabrica el flujo completo.

## EL ENCLAVAMIENTO DE AIT-145 SUBE DE RANGO (decision del PM)

Ya no se levanta viendo un `Done`: **hay que haber FABRICADO el ataque** (iniciar el flujo con una
sesion, mandar la URL, consentir desde otra) **y ver que el vinculo no se crea.**
**Un estado de Linear no es una prueba; el rojo que se vuelve verde si.**
Restriccion de producto para el rediseno: **la conexion se arranca DESDE DENTRO de la app, ya
identificado — nunca abriendo un enlace que alguien te pasa.**

---

## UN CONJUNTO DE CRITERIOS SE VALIDA CONTRA UN IMPOSTOR (regla de T3, 19:07Z — la mejor del dia)

> **Un criterio se valida contra su MUNDO DE FALLO. Un conjunto se valida contra un IMPOSTOR.**
> **La pregunta no es "¿puede fallar cada uno?" sino "¿QUE IMPLEMENTACION ROTA LOS PASA TODOS?"**
> **Si consigues construir el impostor, tienes el test que falta. Si no lo consigues, esa es la
> prueba de cobertura** — y es la primera del dia que NO DEPENDE DE CONTAR NADA.

⛔ **Lo que la hace de proceso: NINGUN criterio individual era flojo en ninguno de los casos.**
Todos discriminaban uno a uno. **El hueco esta ENTRE los criterios, y por construccion no lo ve
quien los revisa de uno en uno** — ni el autor, ni el auditor, ni yo. **Es la primera cosa de hoy
que "revisar mejor" no habria cazado nunca.**

**CUATRO IMPOSTORES EN CUARENTA MINUTOS, en cuatro conjuntos independientes:**

    T3 · AIT-134   const confirmado = rutaLocalOk        pasa los SEIS criterios
       los 4 tests que tocan /api/cerrar-sesion-local la fuerzan a 500 (932·1017·1129·1366)
       -> el mundo "responde 200 Y la sesion sigue viva" NO EXISTE en ningun test
       DIRECCION: navega a /login afirmando un cierre que nadie comprobo
                  = AIT-127 REINTRODUCIDO por la puerta que AIT-134 abrio, con la suite VERDE

    T2 · AIT-145   una implementacion donde la cookie se consigue reenviando un enlace
       su C1 llamaba al callback SIN cookie: valido su criterio contra su mundo de fallo
       CORRECTAMENTE, y aun asi el conjunto lo pasa el impostor. Es el B1 del auditor.

    T1 · AIT-142   una TABLA con los 17 pares. No calcula nada y pasa los 17.
       fuera del corpus: "Lucia Fernandez"->undefined · "[X] Ana"->undefined · "7Up Cola"->undefined
       Y NO es rebuscado: es lo que produce "hacer que los tests pasen" sin entender la regla,
       o sea EL FALLO QUE EL CORPUS EXISTE PARA IMPEDIR.

    QA         un gate de RUTAS QUE VIVA SOLO EN EL CLIENTE
       todas sus comprobaciones de gating entran por la UI
       -> SU CONJUNTO NO DISTINGUE "el servidor lo impide" de "la pantalla no te lleva"
       Su nota del 2026-09-09 decia "el gating por rol real sigue sin probar". 21 HORAS DESPUES
       sigue sin probarse, y ahora se sabe por que no chirriaba: SU RONDA DABA VERDE IGUAL.
       **Un hueco asi no produce inquietud: produce rondas limpias.**

### EL OLFATO QUE LO ANTICIPA ANTES DE ESCRIBIR TESTS (tambien de T3)

> **Un artefacto que hace DOS TRABAJOS no puede fallar en uno solo, asi que ningun test puede
> distinguirlos.**

Su autodiagnostico: *"van dos veces hoy que junto dos cosas en una y alguien me las separa"* — una
constante que era **registro Y bloqueo**, una variable que era **"respondio" Y "se cerro"**. Y lo
uso EN PROSPECTIVA sobre otra ficha: **el `state` de AIT-145 es identificador del flujo Y decision
de a quien se vincula el buzon**, que es literalmente B1. El QA se lo aplico a si mismo:
**`real === '/hoy'` acredita "me negaron /panel" Y "me llevaron a mi sitio", y la primera no tiene
testigo propio.**

### FORMATO DEL APARTADO (decision del FA, que resuelve mi objecion)

Yo objete: *un apartado que se puede rellenar con una frase se rellena con una frase* — "no se me
ocurre ninguno" pasaria como cumplimiento. **Su solucion no es exigir mas, es hacerlo REFUTABLE:**

    ⛔ Describe una implementacion que pase TODOS los criterios, y di QUE TEST LA TUMBA.
       Si no puedes nombrar el test que la tumba, HAS ENCONTRADO EL HUECO: ese es el test que falta.

> **El auditor lo tumba PROPONIENDO UN IMPOSTOR. "No se me ocurre ninguna" deja de ser una salida
> barata: es la afirmacion de que el conjunto esta completo, y cualquiera la derriba en un renglon.**
> **Un apartado autocertificado se rellena con una frase; uno que invita a que te refuten, no.**

**ALCANCE: OBLIGATORIO en fichas que existen para CERRAR UN DEFECTO** (ahi el conjunto de criterios
ES la garantia: si tiene hueco, el defecto vuelve con la suite en verde). **Recomendado en fichas
de funcionalidad.**

### LA FUENTE UNICA ES TAMBIEN EL MATERIAL CON EL QUE SE FALSIFICA (de T1)

Su corpus vive en `casos-iniciales.ts`, **asi que el impostor se genera IMPORTANDOLO.**

> **Cualquier fuente unica de verdad compartida entre lo verificado y el verificador le da al
> verificado el MAPA EXACTO de lo que se le va a preguntar.**

No es que la fuente unica este mal —evita la divergencia, que era el problema real—: **resuelve la
divergencia y crea la posibilidad del examen filtrado.** El arreglo es comparar contra el oraculo
**FUERA del corpus**, con casos FIJOS elegidos por clase y no aleatorios, *porque un test que falla
distinto cada dia se aprende a reintentar, y entonces no protege: informa*.

## EL PASO QUE FALTA EN EL CHECKLIST DEL INTEGRADOR (aceptado por el FA)

*"Mi checklist tiene suite, merge, push, Railway, Linear, archivar. **No tiene «¿que documento
promete algo sobre lo que acabo de publicar?»**"* — y `docs/02` promete ser el schema literal.
**La regla existe en CLAUDE.md y no esta en su ruta obligatoria.** Va como PASO, no como
recordatorio: *un paso esta en la ruta; un recordatorio no*.

---

## UN DESPLIEGUE APLICA TODAS LAS RETIRADAS ACUMULADAS, NO SOLO LA TUYA (19:25Z)

T3 corrio la suite desde una rama **68 commits detras** y le salio un rojo en `05-control-marta`:
`/supervision` renderiza "Algo ha ido mal". **No era suyo, y tampoco era el azar.**

    18:14      su corrida PASA ese test
    18:35:34Z  el Integrador corre `npx convex dev --once` contra dev:third-goldfinch-805
    19:04      su corrida FALLA, con el mismo proxy.ts

Verificado por mi sobre commits: `422a963` define `getWorkloadByOwner` (10 `export const`),
`825e40a` no (9). **Exactamente una menos**, con el recuento de control.

> **Un `convex dev --once` sincroniza el deployment ENTERO con tu arbol: no solo anade lo tuyo,
> RETIRA lo que tu arbol ya no tiene.**

⛔ **Y LA CORRECCION DEL PROPIO INTEGRADOR, QUE LO HACE MUCHO PEOR:**

    getWorkloadByOwner       retirada en e86e488, 13:04 -03, AIT-141  -> desplegada 16:34Z
    getOverdueCountsByOwner  retirada en 4a6d3fc, 08:06 -03, AIT-128  -> desplegada 13:56Z
    CONTROL POSITIVO del pickaxe: getForecast devuelve su commit de ALTA

> **Un despliegue no aplica TU cambio: aplica todas las retiradas ACUMULADAS en `main` desde el
> ultimo despliegue. El radio de dano no tiene el tamano de tu ficha — tiene el tamano del hueco
> desde que alguien desplego por ultima vez.**

**Es la D27 del checkout compartido en el eje del deployment:** *publicas lo que otros dejaron a
medias*, sin ninguna senal de que lo llevas encima.

**EL PAR DE PASOS, y van juntos o el primero es analgesico:**

    el que CORRE, antes de la suite desde una rama detras de main:
        para cada api.<mod>.<fn> en app/, components/ y lib/ de la punta,
        comprobar `^export const <fn>` en main:convex/<mod>.ts
    el que DESPLIEGA, antes de `convex dev --once`:
        ¿que funciones define EL DEPLOYMENT que mi arbol ya no define? -> avisar a las ramas vivas

**Formulacion del Integrador:** *el que corre pregunta "¿mi rama llama a algo que ya no esta?";
el que despliega pregunta "¿voy a quitar algo que alguien llama?". **La primera la hace la victima
despues; la segunda, el causante antes.*** **El barrido del que corre no evita el dano: lo explica
rapido.**

⚠️ **Y no fue un descuido: el gate de precondiciones le OBLIGABA a desplegar para poder correr la
suite de AIT-92, y el propio gate lo prescribe.** Hizo lo correcto y el efecto lateral se lo comio
otro. **Un procedimiento correcto con un efecto lateral no declarado no se arregla con mas
cuidado: se arregla declarando el efecto.**

⛔ **LIMITE DEL CASO, declarado y no convertido en tarea:** todo lo anterior son **COMMITS**. **Lo
que el deployment tenia a las 18:14 es otro sujeto y YA NO EXISTE: no es medible a posteriori.**
El problema de hoy nace justo de que un commit y un deployment no coinciden, asi que medir uno
para hablar del otro seria el error que estamos investigando. **Causa suficiente, no unica** —
nadie puede enumerar despliegues ajenos.

## MI COMENTARIO CONTADO COMO PRESENCIA, 34 MINUTOS DESPUES DE REPARTIR LA REGLA

Mi primer barrido dijo que **`main` TAMBIEN llamaba a la funcion retirada**. Era la **linea 41: un
COMENTARIO** que explica que se retiro. Estuve a punto de anunciar que `main` estaba roto.

**Es la regla de T1 de las 18:45, que yo misma habia repartido a cinco sesiones, incumplida a los
34 minutos y sobre la ficha del que me la enseno.** Y hacia "si esta", que es el lado malo.

🔑 **Lo que lo cazo no fue el catalogo ni la prudencia: fue que el resultado era ABSURDO.** `main`
no puede llamar a lo que `main` acaba de retirar **y desplegar**. **Fui a mirar la linea por
increible.** Si el defecto hubiera sido PLAUSIBLE, lo habria publicado.
**La implausibilidad filtra por TAMANO del error, no por su existencia.**

**ARREGLO (del FA):** *donde un procedimiento diga "busca X", el procedimiento ENTREGA EL ANCLA, y
el ancla pregunta por el USO y no por el nombre* — `useQuery\(api\.<mod>\.<fn>`, `^export const`.
**Asi la regla deja de recordarse y pasa a consumirse.** ⚠️ Mi limite a ese arreglo: **solo cubre
donde hay procedimiento escrito**; fuera de ahi sigo eligiendo yo el ancla, y la mayoria de mis
mediciones de hoy han sido anclas inventadas sobre la marcha.

## EL VOLUMEN DEL CATALOGO VA A AITOR (decision del FA, y le apoyo)

~70 reglas, y **los fallos de hoy han sido casi todos reglas MAL APLICADAS, no reglas ausentes.**

> **Un catalogo que crece porque sus propias entradas se incumplen no esta aprendiendo: esta
> registrando el mismo fallo con nombres nuevos.**

Mi caso va como evidencia **y tiene que ir entero** —regla escrita, repartida a cinco sesiones,
con su ejemplo, incumplida a los 34 minutos por quien la repartio— porque **sin esos detalles
parece un despiste y con ellos es un dato sobre el mecanismo.** El FA no lo decide el mismo:
**ha escrito casi todas las reglas, y el que las cuenta no puede ser el que decide si sobran.**

---

## EL METODO DEL IMPOSTOR SOBREVIVE A SU SEGUNDA PASADA (19:33Z, AIT-134 codigo-loop1)

**NO-GO, y es el mejor del dia: el auditor aplico el metodo de T3 y encontro un SEGUNDO impostor
donde T3 ya habia cerrado el primero.**

    const confirmado = rutaLocalOk
      ? (await clasificarAccesoProtegido(...)) !== "ACCESO_CONFIRMADO"
      : false;
    -> acepta ANOMALO como cierre confirmado

    lo que los tests fabrican:
       ruta local 200 + ACCESO_CONFIRMADO ....... cubierto
       ruta local real + DENEGACION_ESPERADA .... cubierto
       ruta local 500, sin clasificar ........... cubierto
       ruta local 200 + ANOMALO ................. NADIE lo fabrica   <- el hueco

**Contrato: solo `DENEGACION_ESPERADA` puede producir `ok:true`; `ANOMALO` debe fallar cerrado.**
Impacto: reintroduce la senal falsa que AIT-134 existe para eliminar. Confianza alta.
Blockers: **ninguno**. Un solo major. `useSignOutAndUnlinkPush.ts:412`.

🔑 **T3 tapo el hueco entre "respondio" y "se cerro"; el auditor encontro el hueco entre "no esta
confirmado" y "esta cerrado".** Es el MISMO artefacto haciendo dos trabajos, un nivel mas adentro
— y **el propio olfato de T3 lo predecia sin que el lo aplicara a esa linea.**

🟢 **Y ENUMERO SEIS IMPOSTORES, no dijo "no se me ocurre":** cinco discriminados por criterios
existentes y uno que pasa. **Eso es una prueba de cobertura de verdad.** Su juicio: *"el metodo es
valido y encontro un defecto real de cobertura. **Aplicandolo de nuevo aparecio M1**."*

⛔ **Y LA RECLASIFICACION PROCEDE**, confirmada por quien tenia que confirmarla: *"M1 era cerrable
con texto en el plan, pero su discriminacion solo podia verificarse ejecutando codigo"*. Ademas
leyo bien la distincion de §0: *"la autorizacion pendiente de Aitor debe seguir bloqueando el
merge, NO esta auditoria"*.

> **Que una pasada del impostor no encuentre nada NO cierra la pregunta.** La segunda encontro lo
> que la primera no vio, con el mismo metodo y sobre el mismo codigo.

## UN CONTADOR QUE CUADRA UNA VEZ NO ESTA ACREDITADO: ESTA DE ACUERDO

El Integrador predijo 176 tests, lo retiro y dio 175 **con el contador validado antes de fiarse**
(suma de `test(` en los `00-*` de main = 168 = lo que midio la suite). Y quedo una discrepancia de
1: su prediccion sobre la rama de T1 daba 151 y T1 midio 152.

**Medido por mi, independiente:** main = 168, punta de T1 = **151**. Coincido con el. Y el
candidato al +1: **cinco ficheros `00-*` de esa rama tienen `.each` / `for(` / `forEach` / `.map(`.**

> **El patron mide DECLARACIONES y la suite mide EJECUCIONES. En `main` coincidian por casualidad;
> en la rama de T1, una generacion dinamica las separa.**

📌 **Y la trampa de mundos otra vez:** su 175 es el arbol MERGEADO y mi 151 es la rama. **La rama de
T1 no tiene `00-gmail.spec.ts` (24 tests) porque salio antes de AIT-92.** Los dos numeros son
correctos y son mundos distintos — como el codegen contra main y como el deployment.

🔑 **Su diagnostico, que cierra algo que yo tenia a medias:**
> *"Las dos veces el criterio estaba bien escrito y la premisa mal. **Lo que hay que declarar de
> antemano no es solo el criterio: es DE DONDE SALE CADA NUMERO que lo compone.**"*

Su `176` estaba declarado antes de medir **y era falso**: no por sesgo, sino porque `168 + 8` era
una resta que nadie habia hecho.

---

## AIT-145 plan-loop2: B1 CERRADO, NO-GO por cuatro majors y NINGUNO de diseno (19:37Z)

> *"**B1 queda cerrado.** El vinculo ya no obtiene el propietario del `state`: el callback crea
> solamente un pendiente y `completeLink` debe usar la sesion que reclama. **Reenviar la URL de
> consentimiento ya no permite vincular el buzon al atacante.**"*

**Blockers: ninguno.** El rediseno de T2 —*el dueno lo decide quien TERMINA, no quien empieza*—
aguanta. Y su prueba de cobertura **aguanto SIETE intentos enumerados** del auditor, incluido
"reenviar la URL inicial de la app" (iniciar exige llamada autenticada; una navegacion no la
ejecuta). **Enumerar los intentos es lo que la convierte en cobertura.**

    M1  sigue ausente la regeneracion de convex/_generated/  (C10 cerro solo la mitad de docs/02)
    M2  el consumo unico no cubre reclamaciones CONCURRENTES
    M3  no hay contrato de caducidad ni de borrado del pendiente
    M4  C8 contradice el flujo legitimo y no tiene instrumento contable

📌 **M3 salio de una corazonada MIA declarada como tal en el encargo** —*un codigo de un solo uso
introduce estado nuevo con vida propia: pregunta por su caducidad, por que pasa si se reclama dos
veces, y por quien lo borra si nadie lo reclama*—. **Las tres eran huecos reales.** Es la primera
categoria de la regla 17 funcionando: corazonada declarada que hace medir a otro.

⚠️ **M3 es el que mas me preocupa** y no por gravedad inmediata: *un estado sin politica de borrado
no falla nunca hasta que falla todo a la vez*, y hoy no habria manera de notarlo.

## AIT-134: EL CONTROL AL INSTRUMENTO QUE SALVA EL TEST NUEVO (de T3)

El test que fabrica "ruta local 200 + ANOMALO" tenia una trampa que no se ve:

> **Si la interceptacion de `/pipeline` no casara, la confirmacion saldria `ACCESO_CONFIRMADO`
> —las cookies siguen vivas— y EL CODIGO CORRECTO AVISARIA IGUAL.**

O sea que **habria pasado midiendo el mundo del test ANTERIOR y creyendo medir el suyo**: el
resultado esperado y el accidental son el mismo, **sin ninguna senal**. Se cuenta la interceptacion
y se exige >= 1. Y la sesion se comprueba por `pagina.request`, **otro canal**, para que el
instrumento no contamine lo que mide.

## CORREGIR EN UN SITIO NO CORRIGE EL DE AL LADO (de T3, y vale una regla)

Corrigio su prediccion falsa del impostor **y la misma frase seguia viva TRES LINEAS MAS ABAJO**.
No son dos afirmaciones ajenas que chocan: **es el propio autor corrigiendo en el mismo minuto.**
**El acto de corregir cierra la pregunta, y la sensacion se extiende a lo que no se toco.**

> **Un metodo solo protege donde se vuelve a pasar. Una primera pasada se SIENTE completa.**

Y el argumento mas fuerte a favor de que el apartado del impostor sea OBLIGATORIO Y REFUTABLE:
**el que invento el metodo no lo aplico dos veces seguidas sobre su propio fichero**, y su olfato
—*cuando algo hace dos trabajos, pregunta cual no tiene test propio*— **senalaba una linea que
estaba a cuatro caracteres de la que si miro.**

## EL +1 DEL CONTADOR, CERRADO EN LAS DOS DIRECCIONES

    e2e/00-initials-design-system.spec.ts:92   for (const sujeto of SUJETOS) { test(...) }
    SUJETOS = 2 entradas (VERIFICADO mirando el bloque, no contando cadenas)
    rama de T1:      151 estatico +1 = 152   <- lo que midio T1
    main + AIT-142:  175 estatico +1 = 176   <- lo que medira el Integrador

⚠️ **Mi propio control me dio un susto y por eso lo mire:** `nombre:` daba 2 y `ruta:` daba **3**.
El tercero era `function cargarInitials(ruta: string)` — **un parametro, no una entrada.** Con 3
entradas el numero habria sido 177 y el criterio habria nacido mal.
⚠️ Y descarte **tres falsos positivos mios**: mi barrido marcaba bucles que estan DENTRO del cuerpo
del test, no alrededor. **El instrumento no distingue "bucle que envuelve un test" de "bucle dentro
de un test".**

> **Un contador que cuadra una vez no esta acreditado: esta de acuerdo.** Mide DECLARACIONES; la
> suite mide EJECUCIONES. En `main` coincidian por casualidad.

---

## EL "6,0% DE LAS DOS MUERTES" ES UN SOLO PUNTO, NO DOS (19:56Z, objecion del QA)

**Medido en este mismo fichero, buscando de donde sale el numero:** hay **UNA sola linea** con el
861 —`:865  "Solo se que a 861M murieron 2 de 4"`— y **ninguna cifra por muerte**. O sea:

> **Las dos muertes NO son dos observaciones: son UNA cifra reconstruida aplicada a dos eventos.**
> Nunca se midio el swap de cada una por separado.

**Lo que de verdad hay, con las fracciones y sus totales:**

    ~6,0%  (861/14336)  UNA cifra, ventana donde murieron 2 de 4 corridas   <- reconstruida
     6,3%  (1089/17408) suite del Integrador                     SOBREVIVIO
     4,8%  (639/13312)  suite de T3, arranco aqui, 10,9 min      SOBREVIVIO
    10,3%  (1473/14336) suite del Integrador, AIT-142            en curso al escribir esto

⛔ **Consecuencias, las tres:**
1. **No hay umbral.** Un punto flojo y tres supervivencias, **una de ellas POR DEBAJO del punto.**
2. **"El swap explica las dos muertes" no tiene ninguna medicion que la sostenga sola.** No queda
   refutada: queda **sin apoyo**. La causa de las dos muertes vuelve a estar ABIERTA.
3. **Retirada la atribucion de causa del aviso de `encolar.sh`** (decia *"han muerto 2 de 4 POR
   ESTO"*). Ahora dice cuanto queda, en TRIPLE + FRACCION, y que la causa no esta acreditada.

🔑 **Formulacion del Integrador, con el acotado que hay que conservar:** *"mi 10,3% no esta «por
encima del umbral»: esta por encima de un punto flojo. Lo uso porque es lo unico que hay, y
porque la DIRECCION de las dos muestras (total quieto, used bajando) si es una medicion limpia."*

⚠️ **Y la forma general, que es la que se repite:** el mismo numero citado en dos sitios **se lee
como dos datos**. Nadie miente: **el segundo uso hereda la autoridad del primero sin anadir
informacion.** Es [[la-consistencia-no-es-corroboracion]] con un solo origen en vez de con doce
mediciones del mismo error.

## AIT-142: LA PREMISA LA FIRMA LA HERRAMIENTA (19:55Z)

    playwright --list sobre el arbol MERGEADO:  unit -> 176   ·   e2e -> 59
    prediccion: 176 = 175 declaraciones + 1 generado por el `for` sobre SUJETOS (linea 92)

**Cuadra en los dos mundos: 151+1=152 en la rama de T1 y 175+1=176 en el arbol mergeado.** *La
misma correccion explica el numero ya medido y predice el que faltaba* — eso es lo que la separa
de una coincidencia. Y **la firma el instrumento, no nuestra aritmetica.**

⚠️ **Y el Integrador declara el limite de su propia ventana:** corre desde la RAIZ, asi que
**vuelve a acreditar solo la mitad que mi detector ya tenia.** El caso que me falta —una suite de
**worktree**— no me lo puede dar el.

---

## 21:14Z — AIT-143(A) plan-loop6: NO-GO. Y una unidad que me invente yo

**Veredicto** `VEREDICTO_T3_AIT-143_plan-loop6.txt` (1964 lineas, run 21:06:44Z, fin 21:08:29Z,
marca de identidad en la linea 1863). RELAYADO a t3-55 a las 21:11:18Z, marca escrita dentro.

    M4  CERRADO   C11 mata el interruptor global; el auditor confirma "sin C11 pasaria C1-C10"
    M1  ABIERTO   C4 fabrica la PUERTA 2, no la 3: la guarda de cookies lanza tras `page.goto`
                  y nunca se llega a `capturarEstadoRodado`. La senal se inyecta demasiado pronto.
                  Ademas "Set-Cookie vacios" es ambiguo (omitir != borrar != valor vacio).
    M2  ABIERTO   la tabla no define el desenlace "reautenticacion OK + reintento falla", y C6
                  exige las dos entradas para el mismo ciclo. Pide las TRES terminaciones.
    M3  ABIERTO   recorrio los once: C9 no tiene NINGUNO de los seis campos ("mismos que C8" es
                  prosa) y C11 no tiene `extra`. La gramatica ademas deja fuera cosas que si son
                  criterio, que vuelven por `extra` en prosa.

DIEZ impostores construidos desde cero, sin heredar: 6 abiertos, 4 muertos. T3 va a la r7.

**Y EL FALLO MIO DE ESTA HORA, que no costo nada porque lo cazamos los dos a la vez:** acuse a
mi propio `tee` de haber destruido un veredicto anterior, y se lo confesé a T3 por escrito.
**No habia pasado nada.** Compare `stat -f %SB` (hora LOCAL) contra `date -u -r` (UTC) — esta
maquina va a UTC-3 — y un fichero recien nacido salio como "nace 18:06, mod 21:08".

> **La `Z` la puse yo.** El formato era `-t %H:%M:%SZ`: la Z es un literal de mi cadena, pegado
> a un numero que no era UTC. **Sellé la unidad a mano sobre un valor que no la cumplia**, y
> un numero con la unidad equivocada no da error: da la respuesta de otro.

Y encajaba con el patron que llevo el dia persiguiendo, asi que la acepte con menos evidencia
de la que le habria pedido a una que no encajara. **Para comparar dos tiempos: epoch crudo,
`stat -f %B` contra `stat -f %m`, y la conversion UNA vez al final.**

**Lo de T3, que es la otra mitad:** *"un fallo del que te acabas de dar cuenta se cuenta con el
dano que HABRIA tenido, y ese dano se dimensiona solo"*. Su refutacion fue mejor que mi
confesion: **seis veredictos para seis rondas, ninguna repetida** — nunca hubo dos `plan-loop6`
porque al partir el alcance siguio numerando hacia adelante.

**Dato suyo que vale para el procedimiento:** el **md5 NO viaja al veredicto** (0 apariciones);
lo que ata una ronda a su fichero es **la linea de cierre** (3 apariciones). El hash sirve entre
la Directora y el worker ANTES de disparar, y no vale como ancla dentro de un veredicto.

**`encolar.sh`, guarda nueva (PRECAUCION, no incidente):** extrae el destino del `| tee "..."` y
si existe lo **ROTA** a `.PREVIO-<hora>.txt` en vez de dejar que lo trunque. Positivo: extrajo la
ruta real del encargo disparado. Negativo: un `tee` sin comillas sale VACIO y aborta (exit 11)
en vez de inventarse una ruta. Falla hacia "paro", no hacia "destruyo".

### 21:20Z — lo que devolvieron los ocho, que es mejor que lo que reparti

**T3 · el campo libre.** Su M3 no era "cuatro criterios mal": era que invento la gramatica para
que nadie pudiera afirmar sin contar y **dejo `extra` abierto**.

> **UN CAMPO LIBRE DENTRO DE UNA GRAMATICA ES LA GRAMATICA ENTERA**, porque todo lo incomodo
> acaba ahi.

Vale para cualquier plantilla de la fabrica: un `notas:`, un `observaciones:`, un `extra:` es la
via por la que vuelve todo lo que la plantilla existia para impedir. La r7 lleva OCHO campos
obligatorios y `extra` no existe.

**T1 · la procedencia va antes que la unidad.** Mi regla (epoch crudo, conversion una vez) NO
cubre su caso: escribio `GO 17:48:37Z` en la cabecera de su export cuando su medicion decia
`17:48:22Z`. **Los quince segundos venian de un mensaje MIO**, copiados a un campo que dice
"Verificado por mi".

> **Antes de la unidad, la procedencia. Un numero correcto en la unidad correcta puede seguir
> siendo el de otro. Si va en un campo mio, lo mido yo; si lo relayo, lo digo.**

Y la mitad que me toca: **un dato que emito sin decir como lo medi invita a que se relaye como
propio.** Mis horas salen a partir de ahora con su origen pegado.

**El Integrador · una regla que depende de acordarse no es un control.** Me recordo que **el
mismo fallo de la `Z` ya me lo habia reportado el a las 18:24, y que fue la tercera vez del dia
— la mia de ahora es la CUARTA**, con la regla escrita y el patron fresco.

> **El arreglo no es "recordar que la Z es literal": es no poder escribirla.**
>
>     mal:   stat -f '%Sm' -t '%H:%M:%SZ'      <- la Z la pones tu, sobre hora LOCAL
>     bien:  date -u -r "$(stat -f %m F)" '+%Y-%m-%dT%H:%M:%SZ'
>     mejor: comparar en EPOCH CRUDO, convertir una sola vez al final

Y su detector, que no depende de sospechar: **si una hora descuadra un MULTIPLO EXACTO de una
hora, es un huso, no un retraso.**

**QA · la tercera fuente.** Valido su etiqueta UTC con `date -u`, con `python
utcfromtimestamp` **y con el `servedAt` del servidor** — y lo que dice es lo bueno: *las dos
primeras podrian equivocarse juntas porque comparten la maquina; la tercera viene de fuera.*

**T2 · el control que sabe distinguir.** Comprobo su propia `Z` y ademas comprobo que su
comprobacion discriminaba: sin `TZ=UTC` daba 16:56 y con el 19:56. *Si no hubiera diferido, el
"coinciden" seria vacio.* La diferencia entre su caso y el mio **es una variable de entorno de
tres letras, invisible en el resultado.**

**El FA · el instrumento pasa, pero por coincidencia.** Audito su vigilante: la resta se hace en
epoch y la conversion ocurre una vez al final. *"No la segui por metodo: coincidio."* Y encontro
su control positivo sin haberlo nombrado nunca asi: T3 sale "hace 0 min" y T4 "hace 657" — **un
desfase de zona los moveria a los dos por igual, asi que ese control valida la RESTA, no la
ETIQUETA. La etiqueta no la validaba nadie.**

**El PM · el resumen que se lee en vez del original.**
> *"Cuando un resumen empieza a leerse en vez del original, sus huecos son huecos del contrato."*
Por eso M2 era major y no cosmetica.

**Y LA CONSECUENCIA COMUN, que es la unica mala noticia de la hora:** a T3 le salvo el 0 absurdo
de C4, a T1 le salvo un huso de 103.304, a mi me salvo un desfase de tres horas.

> **La implausibilidad filtra por TAMAÑO del error, no por su existencia.** Si los once
> criterios de T3 hubieran dado 3, se lo cree; si mi desfase hubiera sido de 15 minutos, me lo
> creo. **Ninguno de los tres tiene control contra la version pequeña del mismo fallo.**

### Ocupacion 21:20Z
    T1 ... LIBRE (AIT-142 publicada, origin/main=7596be4; AIT-128/141/142 en main). Pedido alcance al PM.
    T2 ... parado en AIT-145 esperando las URIs del PM.
    T3 ... AIT-143(A) plan-loop7 en auditoria, disparada 21:17:42Z, vigilante armado.

## 21:22Z — AIT-143(A) plan-loop7: NO-GO. La gramatica pierde lo que no encaja

`VEREDICTO_T3_AIT-143_plan-loop7.txt`, 2001 lineas, 100 s. Identidad por POSICION: el cierre de
r7 en 513/1682/1843 y el de r6 CERO veces (sin eco). RELAYADO 21:20:23Z, marca dentro.

**D39-bis: el bucle NO gira en falso.** Medido sobre los dos artefactos, comparando SUJETOS:

    M1  r6 "C4 fabrica la puerta 2"          -> r7 "depende del orden temporal guarda2/refresco"
    M2  r6 "la interfaz es contradictoria"   -> r7 "permite INICIAR OTRO CICLO despues de T3"
    M3  r6 "los once no respetan la gramatica" -> r7 "PIERDE OBSERVABLES y no cumple su dominio"

Los tres cambian de sujeto. M4 cerrado desde la r6.

**M3 · LA LECCION DE LA RONDA, y es de las que se repiten en cualquier plantilla.** T3 quito el
campo libre `extra` y formalizo ocho campos. Resultado del rastreo campo a campo del auditor:

    C1  problemaDeInstantanea(...)=null ....... DESAPARECIO
    C10 "2 errores fabricados" ................ DESAPARECIO
    el resto ................................. paso a campo formal

Dos observables perdidos **sin dar error**. Y ademas:

- `FALLO_RECUP` en los once contra `FALLO_RECUPERACION` en la gramatica. Su impostor 14: *"un
  comprobador que busque los ocho nombres declarados deberia dar `FALLO_RECUPERACION=0/11`;
  aceptar `FALLO_RECUP` demuestra que valida una abreviatura que la gramatica no declara"*.
  **El 8/8 de T3 era cierto contra su comprobador y falso contra su gramatica.**
- `cadenas = NINGUNA | <literal>=<entero>` **no es lista cerrada**: admite cualquier literal.
  **El campo libre no desaparecio: se mudo a `cadenas`.**

> **Una forma que obliga obliga a tirar lo que no encaja, y eso no da error: da un plan mas
> corto.** La pregunta que lo caza no es "¿que queda?" sino **"¿que desaparecio?"** — y no la
> hace nadie porque lo que falta no esta.

**M1 · LA TENAZA, SUBIDA AL PM.** C4 intercepta el refresco (~850 ms). Tres desenlaces medidos
por T3: (a) llega dentro de la ventana -> puerta 3 -> verde; (b) no llega en 10 s -> rojo;
(c) llega antes de la guarda 2 -> rojo nombrando al vecino. **No hay falso verde** y el auditor
lo confirma — pero un caso OBLIGATORIO depende de que llegue un evento, y pide **sincronizacion
causal**. Para borrarlas entre la guarda 2 y la captura haria falta **un enganche de prueba en
el producto**, y T3 se niega, con razon: no es su decision.
> **La puerta que da titulo a la ficha es la unica que no se puede fabricar sin tocar el
> producto.**
Tres salidas en manos del PM: declarar C4 no fabricable (incumple M1), autorizar la costura, o
aceptar el no-determinismo **haciendolo legible** (`intercepciones = 1`, que T3 pone igual).
⚠️ Y T3 argumenta CONTRA si mismo: su premisa "el cliente siempre refresca" se apoya en el
comentario de `authState.ts` que midio OTRO — **el mismo cuyo limite declarado es el defecto de
esta ficha**. *"No me apoyo dos veces en el mismo texto y solo cuando me conviene."*

**M2 · el hueco ya no es la tabla, es el final.** Impostor 6: *"tras T3, registrar
FALLO_RECUPERACION y empezar un ciclo nuevo"* **pasa la seccion leida aislada**. La decision del
PM esta en el plan pero **no dentro de la seccion que leera quien implemente AIT-151**.

**Catorce impostores desde cero. Diez muertos.** Los cuatro abiertos (6, 12, 13, 14) son cosas
que **la r7 introdujo o perdio**: ninguno sobrevive de la r6.

### Ocupacion 21:22Z
    T1 ... AIT-149 primera mitad (enumerar por funcion, SOLO LECTURA, no cierra la ficha).
           Detras: AIT-139 y AIT-146.
    T2 ... AIT-145 r5 contra (B), desbloqueado: las URIs bloquean EJERCITAR, no diseñar.
           Debe darle al PM los origenes locales MEDIDOS.
    T3 ... AIT-143(A) r8, con M1 esperando decision del PM.

## 21:27Z — la r8 en el aire, y la clase que cierra la noche

**Disparada la r8 de AIT-143(A) a las 21:26:34Z** (md5 `d1a29cf…` remedido pegado al disparo,
465 lineas, cierre en la 465, vigilante armado). T3 cerro M2 y M3 y dejo M1 abierto a proposito.

**M1 · EL PM DECIDIO, y la decision va DENTRO del encargo como dato que no esta en el export:**
- RECHAZA el enganche de prueba en el producto, **por donde iba**: *"una bandera de prueba en el
  codigo de sesion es una rama que nadie ejercita en produccion y que decide quien entra"*.
  Mismo patron que el `runId` de AIT-114: *al arnes le sale gratis, lo paga el producto para
  siempre.*
- RECHAZA retirar C4: tiraria la unica cobertura de esa puerta.
- ACEPTA el no-determinismo A CONDICION DE QUE SE DECLARE.

> **Una prueba que mide de vez en cuando y AVISA cuando no, vale mas que ninguna. Una que mide
> de vez en cuando y CALLA, vale menos que ninguna. LA DIFERENCIA ENTERA ES EL CAMPO.**

Con tres exigencias que la r8 puede no llevar: **"cobertura no garantizada" literal en la
ficha**, dos `FALLA si` (no leer un verde de C4 sin mirar `intercepciones`; no decir al cerrar
que la puerta 3 esta verificada) y **el registro de en cuantas corridas C4 llego a medir** —
*"si nunca mide, no es un test: es un adorno"*. Al auditor le pedi la pregunta que las resume:
**¿puede alguien leer un VERDE de C4 sin enterarse de que no midio nada? Si el campo existe pero
ningun criterio obliga a MIRARLO, la declaracion es decorativa.**

**Y el PM decidio con confianza en T3 por una razon concreta: trajo un dato EN CONTRA de su
propia premisa.** Eso es lo que hoy compra credito.

### 🔑 LA CLASE DE LA NOCHE, de T3, y ya somos tres hoy con la misma forma

T3 escribio en su plan *"comprobado con `grep`, no de memoria"* **en el mismo comando que
ejecutaba el `grep`** — la afirmacion se guardo ANTES de ver el resultado, y era falsa. Al
corregirla, **la correccion añadio dos menciones mas y volvio a dejar el recuento mal**. Ahi vio
el problema de verdad:

> **CONTAR EL CONTINENTE EN VEZ DEL SUJETO HACE QUE HABLAR DEL DEFECTO CUENTE COMO COMETERLO.**

El invariante no es *"cuantas veces aparece X en el fichero"* —que crece cada vez que alguien lo
explica— sino ***"ningun criterio usa un nombre no declarado"***. **Sujeto, no continente.** Es
la misma clase que el comentario que casi me hace anunciar que `main` estaba roto.

Y la segunda mitad: **el sello "comprobado con grep" lo puso el autor sobre algo que aun no
habia comprobado.** *La certificacion la pone el autor; no la produce la herramienta.* La forma
mas barata de colarla es **escribir la conclusion y el comando en el mismo gesto** — mi
`echo "(vacio = X)"` pegado al `grep` es exactamente eso.

**VAN TRES HOY CON ESTA FORMA:** mi `Z` literal, el `echo "(sin salida = nunca aparece)"` del QA
—que SI tenia salida, cuatro coincidencias— y el `grep` de T3. **Y el QA ademas eligio mal su
control positivo:** puso `grep -c` de la URL de Railway esperando >0 y dio **0**, porque esa
cadena no esta en su registro. *Un control que da 0 por estar mal elegido es indistinguible de
un grep roto* — le salvo que otra cadena si aparecio, o sea que **el instrumento se valido solo
por accidente.**

### AIT-145 · lo que aporto el QA y no es de la lista
⛔ **`accounts.google.com` tiene cookies en su perfil de Playwright**, del selector de cuentas.
**Si el flujo de Gmail se prueba desde su navegador, no arranca limpio de sesion de Google y
puede enmascarar justo el caso que AIT-145 quiere fabricar.** Es un VERDE POR SESION HEREDADA:
pasaria porque Google ya sabe quien es, no porque el enlace funcione. Al PM para que decida de
quien es la ficha.

**Origenes: el QA no añade ninguno** (solo produccion; `lsof` de 3000/3100-3103 vacio). La lista
queda en seis lineas. **La undecima accion de Aitor pasa a `NO PEDIR HASTA QUE LA r5 FIJE LA
RUTA`**: registrar una URI cuya ruta aun no existe da un error que no menciona ni a SuperCRM ni
a Convex.

## 21:40Z — dos listas correctas de dos mundos, y un universo que se quedo corto en dos

### AIT-143(A) r9 · NO-GO, solo M1. M2, M3 y M4 NO reabiertos
Relayado 21:38:12Z. La receta de C4 la da por **restituida completa**. La separacion
`desenlace` (que hace `loginAs`) / `resultado` (como termina el caso) la verifico EL, con tabla,
doce a doce. **De los cuatro impostores heredados mueren dos** (el detalle no consultado y la
ausencia tratada como fallo ordinario) **y sobreviven dos**, los dos por lo mismo: *declarado
pero no ejecutable*.

    (1) el runner termina en verde tecnico y el aviso va AL LADO
        -> "la salida puede seguir diciendo que toda la suite paso, acompañada de una advertencia"
    (2) `global-setup` TRUNCA el registro cada corrida y encima se exige "N de M" y tres ceros
        -> dos artefactos correctos por separado que juntos NO PUEDEN CUMPLIRSE
    (3) `recuento-c4` declarada como clave y NINGUN criterio la usa -> el comprobador no la ve

⚠️ **Mi corazonada declarada aterrizo:** al pasar de dos valores de resultado a tres,
**`NO_MEDIDO` podia absorber un fallo real**. Correccion del auditor: solo C4 con
`intercepciones=0`; cualquier otro incumplimiento produce `FALLA`.

**Y T3 resolvio (1) sin inventar nada: Playwright tiene TRES estados** —`passed`, `failed`,
**`skipped`**— contados por separado. `test.skip()` en ejecucion hace que **el marcador no pueda
sumarlo**. *La honestidad del test deja de depender de que alguien lea un aviso y pasa a la
aritmetica del runner.*
**El (2) lo subio al PM ANTES de escribir**, porque arreglarlo dentro de (A) es diseñar estado
durable, o sea rehacer la particion por dentro sin decirlo.

### El comentario que iba a la tabla de puertos: TUMBADO, y la clase es nueva
Yo dije "el aviso va pegado al boton", el Integrador escribio el comentario, **y el FA midio que
el boton era otro**: las URIs de Gmail van por **deployment de Convex**
(`<deployment>.convex.site/gmail/oauth/callback`), no por puerto de worktree. Su prueba de que
son dos ejes: *QA tiene deployment y no tiene puerto; T3 tiene puerto y no tiene deployment; un
`T5` nuevo usaria el dev compartido y necesitaria CERO URIs.*

> **Un aviso en la ruta obligatoria se lee con la confianza de que alguien comprobo que el boton
> era ese. UN AVISO FALSO EN EL SITIO BUENO ES PEOR QUE NINGUNO.**

Y el PM se lo apunta entero: *"acerte la ubicacion y me equivoque el sujeto, justo mientras me
felicitaba por la regla de la colocacion. **Colocar bien un aviso es la SEGUNDA pregunta; la
primera es si lo que dice es verdad en ese sitio.**"*

⛔ **Y LA VUELTA DE TUERCA, que el FA encontro al revisar su propia refutacion:** bajo (B) —la
direccion aprobada— el callback SI vuelve al origen de la app, **y entonces el boton si es la
tabla de puertos**. O sea que el comentario no era falso:

> **Un aviso escrito para el mundo que viene, colgado donde se lee el de ahora, es
> indistinguible de uno equivocado — y SE VUELVE CORRECTO SOLO, sin que nadie revise si ya toca.
> Un error se corrige; este CADUCA HACIA EL ACIERTO.**

Condicion para firmarlo: **que el propio comentario diga de que mundo habla y que hecho lo
activa.** Medido por mi: `grep -rn "gmail/oauth/callback" app` VACIO — la ruta de (B) no existe.

**LAS DOS LISTAS SON CORRECTAS, DE DOS MUNDOS.** La del FA (por deployment) es la de hoy; la de
T2 (por origen de la app) es la que (B) creara, y **se AÑADEN, no sustituyen**. Yo se la pase al
PM como "origenes medidos" lista para Aitor **sin preguntarme de que mundo era**. Lo que lo paro
fue el retraso de la undecima, **no que ninguno lo viera: es suerte con forma de procedimiento**.

**El cruce del FA, ejecutado por el Integrador:**

    A \ B  ->  VACIO                    <- la cara CARA esta vacia hoy
    B \ A  ->  stoic-impala-857 (falso huerfano: produccion no vive en un .env.local, LIMITE
                                 DECLARADO por el que lo midio, no contado como hallazgo)
               uncommon-puffin-303      <- el unico real: docs dice T1 y T1 usa third-goldfinch-805

⚠️ **Y el FA se caza a si mismo:** para tumbar el comentario cito `docs/03-setup.md:226-227`
—*"el token de refresco no puede pasar por el navegador"*— **que el PM habia falsificado cuatro
horas antes en esa misma ficha** (*"lo que pasa es el CODIGO de autorizacion"*). Su conclusion
sobre el mundo de hoy la midio con los `.env.local`, no con esa frase, **pero el apoyo que le
puso encima estaba muerto**. Y el doc SIGUE diciendo lo derogado, sin marca: el PM lo corrigio
en Linear y `docs/` no se entero.

### AIT-149 r1 · NO-GO, y el universo NO eran 19
El auditor cerro dos mayores (la clase E SI es decidible leyendo —Convex documenta que la
identidad se propaga—; y D iba al destinatario equivocado porque **la disyuntiva era falsa**:
exigir que `p256dh/auth` coincidan respeta el requisito escrito). **Convergio con la decision
del PM desde dos sitios distintos.**
🔴 **Y en la r2 T1 deriva el universo con filtro reproducible y saca DOS MAS** que la ficha no
enumera (`customers:update`, `opportunities:createForCustomer`) — **el mismo cardinal de 34
publicas por otro camino, y otro reparto**. El auditor habia escrito que su complemento
*"coincide por NOMBRES con el export"*. Uno de los dos esta mal y va dentro del encargo de la r2.

> **Una lista de 19 se verifica contando 19. Si el conjunto real es 21, el recuento sale bien
> igual: cuenta lo que hay dentro, no lo que falta.**

**Y T1 fabrico un hallazgo de clase y lo retiro solo:** seis funciones aceptan `storeId` de fuera
—forma exacta de un hallazgo de clase— y `docs/02-modelo-de-datos.md:785` dice que **owner =
todas las tiendas**. *"Seis instancias se sienten como una clase y una clase se siente como
prueba. Pero «se repite» solo dice que hay una regla detras; **no dice si la regla es el defecto
o el diseño**."* Las dos veces de la ronda —AIT-57 y el doc— **el freno estaba fuera del codigo
que miraba.**

### Ocupacion 21:40Z
    T1 ... AIT-149 lectura-loop2 EN AUDITORIA desde 21:39:53Z
    T2 ... AIT-145 r5 contra (B)
    T3 ... AIT-143(A) r10, con el hueco (2) esperando al PM

## 21:48Z — el md5 dio su primer positivo, y la receta que iba a repartir no corria

### El positivo
T3 declaro congelado `md5 19cb57fd… · 637 lineas`; al ir a disparar medi `b8980d3b… · 665
lineas`. **NO dispare.** Benigno —eran 28 lineas con la decision del PM y su aviso se cruzo con
el mio— pero destapo el agujero. Formulacion de T3, que me corrige:

> **El cierre identifica la RONDA. El md5 identifica la VERSION.** Y cubre la ventana entre
> *"lo declaro congelado"* y *"yo lo leo"*, **que no vigilaba nada mas**.

Yo llevaba el dia repartiendo el md5 como *"sirve entre el worker y yo antes de disparar"*, que
es cierto y no dice nada. Y su remate: **que el positivo saliera benigno no lo invalida — prueba
que el detector distingue.** *Un instrumento que nunca ha dado positivo no esta acreditado.*

### 🔴 Y MI FALLO, que es el de la prescripcion
Propuse `head -n -1 F | md5` como receta para cuatro workers. **El FA la ejecuto: `head: illegal
line count -- -1`** — es extension de GNU y este `head` es BSD. **Iba a repartir un comando que
no habia ejecutado ni una vez, en el mismo mensaje en el que le decia a T3 que su propuesta
tenia un cabo suelto.**
⚠️ Y el agravante: **habria fallado RUIDOSAMENTE**, o sea que me habria absuelto la suerte y no
el metodo. *Un error ruidoso no acredita al que lo cometio.*

### La convencion decidida (FA), medida por mi
    sed '$d' FICHERO | md5
    cambio de CONTENIDO ......  5fbbe293 -> 7c5badce   DETECTA
    cambio SOLO del cierre ...  5fbbe293 -> 5fbbe293   NO se dispara

**Acreditado en los dos sentidos**: detecta lo que debe y **no salta con lo unico que tiene
permiso para moverse**.

⛔ **Y por que el md5 y no "lineas y bytes", que parecia mas legible. Reproducido por mi:**

    'Veredicto: GO' -> 'Veredicto: NO'
       lineas 3 vs 3   bytes 28 vs 28    <- la opcion de contar: VERDE
       md5    a04b9c88 vs f02ca25f       <- DETECTA

> **Lineas y bytes son CIEGOS A LA SUSTITUCION, y la sustitucion es el cambio mas caro que puede
> tener un export: UN DETECTOR CUYO PUNTO CIEGO COINCIDE CON SU PEOR CASO.**

**T3 y yo comparabamos ERGONOMIA; el FA comparo DIRECCION DEL FALLO.** Un hash mal copiado da
desajuste, o sea parada; un recuento mal copiado **puede coincidir por casualidad y falla hacia
el verde**. Y su razon para NO poner las dos juntas, que ninguno de los dos teniamos: **dos datos
en la misma linea crean la pregunta de cual decide, y el que no decide acaba usandose igual.**

⛔ **LA MITAD QUE ARREGLA EL AGUJERO NO ES EL DIGESTO: ES QUE VIAJE.** Al CEO va como DOS
ejecuciones: `intro-terminal.txt` para que el worker lo escriba, **y `AGENTS.md` para que el
auditor copie la linea de cierre ENTERA, con el md5 dentro.** *Si se decide y no viaja, el
control sigue siendo que yo mire.* Con su limite escrito al lado: **ata el veredicto a la
version, NO dice que la version sea la punta de la rama; son dos comprobaciones.**

### AIT-143(A) r10 · NO-GO, y lo que queda de M1 es UNA FILA
> *"Las dos defensas estan juntas en la EXPLICACION, pero no juntas en el CRITERIO EJECUTABLE."*

C4b exige `aviso-no-medido`, `recuento-c4` y `resultado NO_MEDIDO`, **pero ningun campo de la
fila exige `test.skip` ni `status=skipped`**, asi que un test que imprima las dos cadenas y
**retorne normalmente sin saltar** cumple C4b entero y **Playwright lo cuenta como pasado**. De
los dos impostores: *skip sin identidad* muere, *identidad sin skip* **sobrevive**.
**Es el campo libre por tercera vez en la misma ficha:** `extra` -> `cadenas` -> **y ahora el
estado del runner viviendo en la prosa de §2.4.3.1 y no en la fila.**
✅ Todo lo demas resuelto, y el aplazamiento a AIT-151 calificado de **"explicito y honesto"**.
✅ **Y T3 midio la sonda de Playwright DESPUES de congelar y antes de que el auditor preguntara:**
la aritmetica funciona (`1 failed · 1 skipped · 1 passed`, con nombre y guion) **y el motivo NO
viaja: 0 apariciones**. Declaro el alcance el mismo: **midio el reporter `list`, no
`rate-limit-reporter.ts` — uno de los dos.**

### AIT-149 r2 · M1 y M2 CERRADOS, y el auditor confiesa
> *"`customers:update` y `opportunities:createForCustomer` **estaban entre esas 15**. Precisamente
> por restarlas junto con las otras trece **obtuve artificialmente las 19 recibidas**."*

**Universo real 21.** Y la lectura de T1, que es la que se queda: *"dos instrumentos distintos, el
mismo numero, **falso en los dos**. Coincidir no es corroborar cuando lo que coincide es un
cardinal — **un cardinal no tiene sujeto, asi que no puede desmentirte**."*
Audito ademas la retirada de las seis y la dio por correcta **una a una**: *"la absolucion no
descansa unicamente en que el patron se repita"*.

⏸️ **r3 de T1 CONGELADA Y SIN DISPARAR: le pregunte por `34 = 22 + 12`**, que no cuadra con el
`21` del titular ni con el `34 = 13 + 21` acordado. **Tres particiones del mismo 34.** No disparo
hasta que diga que cuenta `22 directas`.
✅ Y arreglo suyo que va a los ocho: pego el detector dentro del export **y lo extrajo de ahi para
ejecutarlo**. *«Esta aqui» es una afirmacion sobre el mundo, no una nota de metodo — y nadie la
comprueba porque quien la lee asume que el que la escribio acaba de venir de ahi.*

### Ocupacion 21:48Z
    T1 ... AIT-149 r3 congelada, ESPERANDO su respuesta sobre el 22 antes de disparar
    T2 ... AIT-145 r5 contra (B)
    T3 ... AIT-143(A) r11: un observable de `skipped` en la fila de C4b
    Plaza LIBRE

## 21:57Z — el primer GO, y la convencion se acredita discriminando

### 🟢 AIT-149 primera mitad: GO. "Blockers: ninguno. Majors: ninguno."
`VEREDICTO_T1_AIT-149_lectura-loop3b.txt`, 1019 lineas. **Universo real 22** (no 19), sin
clasificar 0, reparto 10A+6B+3C+1D+2E. El auditor **derivo el conjunto por su cuenta y coincide
POR NOMBRES**, y reconcilio el desajuste **nombrando la funcion**: `opportunities:reopen` es la
que convierte 13+21 en 12+22.
✅ **T1 la dejo DECLARADA y sin explicar, y por eso se pudo cerrar.** Si le hubiera puesto una
causa plausible, el auditor habria auditado la causa en vez de buscar la funcion.
✅ Y su cautela de no cerrar el universo: *"es HONESTA, no una coartada"* — mi corazonada
declarada contestada a su favor.
⚠️ **La ficha NO se cierra**: la segunda mitad (ejercitar las 22, denegaciones, filtrabilidad) es
alcance del PM. T1 parado hasta que conteste.

> **UN FILTRO TE ENSEÑA EL COMPLEMENTO Y TE ESCONDE EL CONJUNTO. Y lo escondido no parece
> ausente: parece que no existe.** (T1) `reopen` no estaba mal clasificada: estaba BIEN
> clasificada en el lado que el nunca imprimia, y por eso sobrevivio a tres auditorias.

### ⛔ LA CONVENCION SE ACREDITO SOLA, EN SU PRIMER USO REAL (export de T2)

    md5 ENTERO ......  68bce3c6…  contra el declarado b7962714…   ✗ DISTINTO
    md5 SIN LA ULTIMA  fc304e61…  contra el declarado fc304e61…   ✓ IDENTICO
    conteo ..........  215 -> 214 (baja en 1)                      ✓

**Con el hash del fichero entero habria parado la ronda por un cambio LEGITIMO** —T2 escribio la
linea de cierre despues de calcular el hash del cuerpo, que es el orden correcto—. **El hash del
cuerpo dice "intacto" y el conteo confirma que quito una y solo una.**
> **No basta con que un detector salte: tiene que NO saltar con su propia excepcion.** Hace dos
> horas pare una ronda por una discrepancia que resulto benigna; ahora la misma clase de
> discrepancia sale bien clasificada sin preguntar nada.

**Y el fallo de T2 al estrenarlo es la leccion del formato:** calculo el hash del cuerpo ANTES de
añadir el separador `====`, asi que `sed '$d'` devolvia cuerpo+separador. *El hash se calcula
sobre **el fichero exactamente como quedara menos su ultima linea**, no sobre "el cuerpo" en
abstracto.* Lo cazo **verificando por EFECTO con el comando que usara el auditor**, no releyendo
— y el daño habria caido en el auditor, que habria concluido que el fichero cambio.

### AIT-143(A) r11 · NO-GO, y mi corazonada era el M1 palabra por palabra
> **"RENOMBRAR EL JUICIO COMO OBSERVABLE NO GARANTIZA QUE PROCEDA DEL SISTEMA OBSERVADO."**

`estado runner` era un campo que **rellenaba el mismo autor**: la equivalencia ataba dos columnas
de la misma tabla y **la pareja cuadraba consigo misma**. Cuarta mudanza del mismo defecto en
esta ficha: `extra` -> `cadenas` -> el `test.skip` en la prosa -> el valor del campo 13.
✅ T3 lo cierra leyendo `testInfo.status` en un `afterEach` que pone el test en ROJO si no cuadra
con lo declarado, **medido antes de escribirlo** (`afterEach CORRIO` con status skipped/passed/
failed). *La fila sigue declarando una expectativa; lo que se acaba es que se compare consigo
misma.*
✅ Y el rastreo r10->r11 salio **aditivo**: primera ronda de la ficha en la que se formaliza algo
y no se cae nada.

### ⚠️ MI PROPIO METODO DE LEER VEREDICTOS, DECLARADO
El veredicto **incluye el encargo, y el encargo cita el veredicto anterior entero**: hoy hay
cuatro lineas `Veredicto del auditor:` y tres bloques `### M1` en el mismo fichero. Yo leo con
`tail -1` y la ultima posicion, **que es correcto por casualidad**: lo es mientras el veredicto
real siga siendo lo ultimo, **y eso no lo garantiza nada, lo garantiza la costumbre**.
Lo que lo ataria de verdad: **que el auditor escriba SU hash del fichero que leyo** — entonces no
hay que elegir bloque, *el que lleva tu hash es el tuyo*. Ya esta pedido en la convencion.
⚠️ Y a T3 le salvo **el numero absurdo** ("once campos" cuando su r11 tenia trece), no el metodo.
**Tercera vez hoy.**

### Falso positivo de mi propio barrido, declarado
Mi check de "veredictos sin relayar" grito **61 de 79**. Son veredictos **anteriores a la
convencion de la marca, que nacio hoy**: el check no distingue "relayado antes" de "sin relayar".
Acotado por tiempo (`-mmin -60`) da **1 pendiente real**, que era el correcto.
**Un instrumento se juzga por sus aciertos, no por su volumen** — y uno que grita 61 veces se
ignora la 62.

### Ocupacion 21:57Z
    T1 ... AIT-149 primera mitad CERRADA con GO. Parado esperando alcance del PM.
    T2 ... AIT-145 plan-loop5 EN AUDITORIA desde 21:56:13Z
    T3 ... AIT-143(A) plan-loop12 congelada 21:55:45Z (a5950ec0 entero / b33f2fec cuerpo, 815 lineas)

## 22:10Z — la premisa que nadie midio, y el falso verde en el sustituto

### 🔴 AIT-152 · EL ARREGLO NO SERVIA, Y LO MATO UNA MEDICION DE T1
El auditor de AIT-149 y el PM habian coincidido en **exigir que `p256dh`/`auth` coincidan** como
prueba de posesion. Yo lo relaye como **"convergencia independiente desde dos sitios"**.

> **Era una convergencia de dos LECTURAS, y las dos leyeron lo mismo. Dos personas de acuerdo
> sobre una premisa que ninguna midio NO SON DOS FUENTES.**

**Lo midio T1 y la premisa era falsa:** el `endpoint` sale de `subscription.toJSON()` — **es
propiedad del NAVEGADOR, no del usuario** — y `p256dh`/`auth` salen del mismo objeto. Dos
personas en el mismo navegador los comparten **por construccion**.
> **"Defiende la puerta que nadie puede alcanzar y deja abierta la que si."**

**Y lo cerro con la spec del W3C, sin ejercitar nada:** `subscribe()` devuelve LA MISMA
suscripcion si no cambian las opciones; y tras `unsubscribe()` el endpoint **MUST NOT** reusarse
y las claves **MUST** ser distintas. **Endpoint y claves se emiten juntos y rotan juntos: la
plataforma NUNCA produce el estado "tengo el endpoint y no las claves"**, que es el unico contra
el que defendia el arreglo. Mas el dato de codigo: **el cierre de sesion NO llama a
`subscription.unsubscribe()`** (con control positivo que si encuentra los dos que existen).
**AIT-152 queda con EL RASTRO como unico remedio, Low por precondicion medida.**
🔴 Y el PM cruzo algo que no vio nadie: esa rama **solo se recorre si la limpieza del cierre
falla**, y **el ha recortado hoy ese limite dos veces (750 -> 616 -> 544 ms)**. *Decidio las dos
cosas el mismo dia sin ver que la segunda alimenta a la primera.*
📌 Y la mitad de T1: **"un mecanismo descrito con fichero y linea se lee como medido aunque solo
este leido"** — las coordenadas parecen evidencia.

### ⛔ EL FALSO VERDE EN EL SUSTITUTO (T1, y decidio el instrumento del tramo 1)
> **`convex-test` es una REIMPLEMENTACION del runtime. La clase E existe para comprobar una
> premisa SOBRE LA PLATAFORMA. Si sale verde ahi, he demostrado que EL ARNES propaga la
> identidad, no que Convex lo haga. Y el arnes lo escribio alguien que leyo la misma
> documentacion que yo.**

**Verde en el sustituto, en la unica clase que existe porque no nos fiabamos del original.**
Decision del PM: **deployment dev real y camino real**; los dos candados del arnes de vitest se
quedan. **Ventana concedida a T1 sobre el dev compartido** (anuncio de inicio/fin con `date -u`,
captura del estado antes, y medir que quedo restaurado).

### AIT-145 r5 y r6
**r5:** cuatro majors. **M9 no era un defecto del plan sino un HECHO DEL CODIGO**: `proxy.ts:78`
instancia `convexAuthNextjsMiddleware` **sin `shouldHandleCode`**, y los tipos instalados dicen
*"If not provided, Convex Auth will handle ALL code parameters"* — o sea que **el middleware se
queda el `code` de Google y la ruta de Gmail no recibe nada**. Con el remate: *"los tests que
invoquen directamente el handler pueden dar verde mientras produccion falla"*.
Criterio nuevo del PM: **se atraviesa el proxy real o no cuenta; y cada criterio declara su
camino, marcando los directos como NO ACREDITADOS PARA PRODUCCION.** *No prohibe el camino
directo: lo obliga a etiquetarse.*
**r6: M10 CERRADO** (los cuatro impostores muertos; el control del **segundo code valido
distinto** separa "rechazo por state" de "rechazo por code gastado"). Siguen M9 (matriz C1-C15 +
**secuencia y responsable del despliegue**), M11 (**C13 exige un observable IMPOSIBLE**: el
`state` se crea antes de ir a Google y nadie lo consume si Google rechaza) y M12 (**el control
positivo del lector de cookies no prueba que sepa leer las DE GOOGLE**).
✅ Y T2 se ataco a si mismo antes que nadie: *"«los fallos de origen no comparten observable con
el ataque» es FALSO; lo cierto es que el NO REGISTRADO no lo comparte. Escribi la version general
porque sonaba mas limpia."* **El auditor habia llegado a lo mismo.** Y su separacion:
**"era una comodidad de diagnostico, no una defensa: si la tumba, tumba una frase de mas."**

### 🔴 UN FALLO MIO EN EL ENCARGO
Dispare la r6 de T2 con el fichero correcto **y el encargo citando un hash MUERTO** (`cc512a88`,
el que T2 retiro). **Remedi el fichero y no remedi el texto**, porque el texto ya estaba
redactado. *Un campo se contamina en la REDACCION, no en la comprobacion* — de T1, esta mañana,
sobre exactamente esto. **Desde ahora el encargo cita el hash de MI medicion pegada al disparo.**
El fichero y su cierre cuadraban, asi que no mate la ronda.

### AIT-143(A) r13, en auditoria desde 22:09:09Z
M1 cerrado **por estructura**: el `test` sale de `e2e/gate.ts` envuelto con el `afterEach`
dentro, asi que **un spec que no importe el gate no tiene `test`: no compila**. Mas C12 (0
importaciones directas **y N desde el gate, con N = numero de specs** — *sin el segundo numero,
borrar todos los specs daria verde*) y C13 (**el mundo de fallo del propio comprobador**).
> **Un hook ausente no da error, da silencio — y un comprobador que no sabe mirar produce el
> mismo silencio.**

### Ocupacion 22:10Z
    T1 ... AIT-149 tramo 1, ventana concedida sobre dev. AIT-139 aparcada (rama sin commits).
    T2 ... AIT-145 r7: matriz C1-C15, secuencia de despliegue, observable de C13, lector de cookies.
    T3 ... AIT-143(A) r13 EN AUDITORIA desde 22:09:09Z.

## 22:16Z — la premisa de plataforma EJECUTADA, y el quinto sello sin foto

### 🟢 AIT-149 · E1 ACREDITADA POR EJECUCION (T1, en el dev compartido)
La premisa que abrio la ficha —*"Convex propaga la identidad de la action al internal"*— era
**documentacion del proveedor**. Ahora esta **ejecutada**, y el par discrimina:

    sales -> setUserActive  "Solo la duena puede ver esto."      <- mensaje de requireOwner,
                                                                    que vive DENTRO del internal
    owner -> setUserActive  "No se puede desactivar a la duena." <- atraviesa el guard y muere
                                                                    en el paso siguiente
    sin token               "No autenticado."                    <- lo que HABRIA salido si la
                                                                    identidad no se propagara

**Control positivo, negativo y discriminante en la misma tirada.** Y **cero escrituras**: eligio
como sujeto del control positivo a la **propia dueña**, a quien el codigo prohibe desactivar.
*El mundo no se restaura: no se toca.* Verificacion de estado con **control al comparador** (con
dos entradas distintas da exit 1): *un diff que sale limpio sin haber demostrado que puede salir
sucio no dice nada.*
🔴 **E2 (`setLogo`) NO acreditada y bien declarada:** `_storage` vacio, las dos llamadas murieron
en `ArgumentValidationError` **sin llegar al guard** — *el rojo que dio no vale*. Autorizado el
gasto de subir y borrar un fichero, con el `storageId` anotado y medicion de que `_storage`
vuelve a estar vacio. Autorizada tambien la clase C (escribe por definicion), con nombre
inconfundible, recuento por tabla y **crear con LAS DOS identidades**: *crear una vez y ver tu
propio id no descarta que la funcion ignore al llamante y ponga siempre el mismo.*

### 🔴 EL QUINTO SELLO SIN FOTO, y cierra el patron del dia
T1 escribio *"empiezo 19:26:04Z (`date -u`)"* **sin ejecutar `date -u`** — hora local con una Z
detras; la ventana real empezo a las **22:11:20Z**. Lo cazo el y lo corrigio en dos minutos.

> **La etiqueta que dice COMO se midio un dato es mas facil de escribir que la medicion, y viaja
> pegada al dato dandole autoridad. PUSE EL SELLO Y NO HICE LA FOTO.**

**SON CUATRO, NO CINCO, y la correccion es del FA** (ver abajo): mi `%SB` con Z literal; mi
`head -n -1` repartido sin ejecutar; la del Integrador a las 18:24; y esta.

⛔ **YO HABIA CONTADO CINCO metiendo el *"comprobado con grep"* de T3, y no encaja: ALLI EL GREP
SI CORRIO.** Su afirmacion era CIERTA; lo que estaba mal era el orden en que la escribio — otra
familia, la del razonamiento redactado despues de actuar. **Meterla en el monton hacia el patron
mas redondo y menos verdadero.** Palabras del FA: *"cinco casos convencen mas que cuatro, y ese
quinto lo iba a firmar yo sin mirarlo, como firme tus «doce»"*.
> **Contar fuentes es mas rapido que comprobarlas, y EL RECUENTO SE LEE COMO CORROBORACION.**
Es la misma operacion que mi falsa convergencia de AIT-152, el mismo dia: **agrupar cinco casos
que no son cinco y contar dos lecturas como dos fuentes.**
📌 **Y por que no le protegio su propia disciplina** —el ya genera `worktree`/`rama`/`punta` con
comandos—: *"no lo aplique aqui porque un mensaje de chat no parecia un export"*.
> **La regla protege el artefacto con formato y no protege el mismo dato viajando por
> conversacion.**
Y la hermana de T3, media hora despues: corrigio cuatro referencias falsas de cobertura y
**cometio la quinta en la linea que añadio en esa misma ronda**. *La disciplina se aplica a lo
que uno cree estar revisando y se cae en lo que esta escribiendo.*
⚠️ **Hoy hemos exigido control positivo al DATO cuatro veces y ninguna al ROTULO del dato.**

⛔ **Y EL ARREGLO DEL FA NO ES UNA REGLA: ES UNA RESTA.** Su razon para no escribir la numero 71:
*"llevamos ~70 y los fallos de hoy son reglas INCUMPLIDAS, no ausentes"*.
> **El rotulo de procedencia es OPCIONAL; el dato no.** En las cuatro, borrar el parentesis
> —`(date -u)`, la `Z`— no habria quitado nada mas que **autoridad falsa**. Nadie pidio el aval:
> **lo puso el autor solo.**
> **SI VAS A ESCRIBIR COMO LO MEDISTE, PEGA LA SALIDA. SI NO VAS A PEGAR LA SALIDA, NO ESCRIBAS
> COMO LO MEDISTE.** Una de las dos, nunca el rotulo solo.
*No es una regla que aprender: es un gesto que se elimina* — y funciona sin disciplina porque
**pegar dos lineas de salida cuesta menos que acordarse de una norma a las tres de la mañana.**

### AIT-143(A) r13 -> r14 · la ficha CAMBIA DE PREGUNTA
La r13 murio por una evasion que le pedi buscar: **`import type` del gate + re-export** cuenta
para el recuento N **y no carga nada en ejecucion** (TypeScript lo borra). *El comprobador media
la forma del texto, no la carga efectiva* — la clase de T3 cometida DENTRO del comprobador que
escribio para cerrarla. Y su I13 **documentaba mas cobertura de la que tenia**.

> **"Dejo de preguntar «¿como obtuviste `test`?» —una lista de vias que nunca estara completa— y
> pregunto «¿CORRIO EL HOOK PARA ESTE TEST?». Una lista de puertas se queda corta; preguntar por
> el EFECTO no."**

El `afterEach` anota una entrada por test y el reporter exige {ejecutados} − {con entrada} = ∅
**y cardinales iguales** (*sin eso, cero tests daria verde*). **Cuatro rondas bajando de nivel y
esta es la primera que se da la vuelta: mide el efecto en vez de enumerar causas.**

### AIT-145 · r7 en auditoria desde 22:14:22Z
Matriz C1-C15 escrita **fila a fila**, y al escribirla salieron **cinco casos que no cuentan como
verde**: C2/C3/C14/C15 SIN EVALUAR y C9 `HANDLER DIRECTO — NO ACREDITADO PARA PRODUCCION`.
Secuencia con responsable (**Aitor registra -> Integrador publica ruta -> Integrador despliega
retirando**), con los dos ordenes malos y que rompe cada uno.
🔴 **C13 pedia DOS imposibles y T2 solo habia visto uno:** el `state`, y ademas *"el mensaje dice
que origen se uso"* — **mensaje que escribe GOOGLE en su pagina**. Ahora mide lo que si controla.
📌 Y el plan B con su nombre: **de configuracion, no de servicio** — *una URI registrada sin
servicio conserva el permiso, no la capacidad.*

### Regalo para AIT-139, salido sin buscarlo
`npx convex data _storage` -> `exit=0 · stdout=0 · stderr=220` — **el colapso de la ficha en
vivo**. Y el dato nuevo: **en stderr vienen DOS avisos y uno es un `ExperimentalWarning` de
Node**, ajeno a Convex. *Una lista de avisos admisibles escrita mirando solo el proceso que te
interesa se rompe con el ruido del que no te interesa — y ese ruido cambia con la version de
Node, asi que la lista caduca sola.*

## 22:30Z — la premisa que se quita de en medio, y una deuda mia

### ⛔ MI DEUDA, declarada antes que nada
T1 me levanto **hace media hora** que la ficha AIT-139 cita el convenio de codigos `4/5/6`
**anterior a la D63.1**. Le dije "es del CEO/FA" y **escribi que lo subia. No lo subi.** Se quedo
en mi mensaje. **El ha estado esperando una respuesta que nunca llego a pedirse**, y ha tenido
que volver a levantarlo.
> *Una parada que nadie ha pedido no es una parada: es trabajo detenido sin dueño* — y esta la
> cree yo con la frase "ya lo subo". **Ya esta en el CEO, con la deuda declarada delante.**

### AIT-145 r8 · M12 CERRADO. Y DOS CONVERGENCIAS EN LA MISMA FICHA
El auditor listo entre los supervivientes **"atomicidad sin camino alternativo"** y pidio para la
r9 **"rama ejecutable si Convex no es atomico"** — **mientras T2 diseñaba exactamente eso sin
verlo.** Segunda vez hoy en esta ficha (la primera fue el `redirect_uri`).

🔑 **Y LA SALIDA DE T2 ES MEJOR QUE CUALQUIER MEDICION:**
> **"Una premisa incomprobable no se declara con mas cuidado: SE QUITA DE EN MEDIO."**

Midio `convex 1.42.1`: **14 apariciones de "atomic", 0 sobre despliegue** (control del
instrumento: el cero no es que no sepa mirar). Y el razonamiento que casi nadie hace:
> *"La estructura de tres fases SUGIERE un cambio unico al final, pero yo estoy leyendo el
> CLIENTE, y la atomicidad es una propiedad del SERVIDOR."*
**Tenia un dato a su favor y dijo que no acreditaba lo que necesitaba.** Es *verde en el
sustituto* otra vez, en su version de lectura.
⛔ Y lo que de verdad estaba mal, que no habiamos visto ni el auditor ni yo: *"no es «aun no la
he medido»: es que **no puedo medirla desde aqui sin romper una regla**. Dejarlo como «se mide
antes del paso 2» era escribir un paso que nadie puede ejecutar."*
> **UN LIMITE CUYO LEVANTAMIENTO ES IMPOSIBLE NO ES UN LIMITE: ES UN BLOQUEO CON BUENA LETRA.**
**Arreglo: partir el paso 2 en 2a (muere la ruta vieja, SOLA) -> 2b (entra la accion nueva).**
No existe version intermedia con las dos vivas, **sea atomico o no**. *Cambia una propiedad que
no controla por un orden que si.*

### 🔴 DOS CRITERIOS VUELTOS DEL REVES POR EL MISMO CAMBIO DE ALREDEDOR
    C10 · exigia diff de docs/02 VACIO   -> con el campo nuevo, vacio significa "se me olvido"
    C11 · mira api.d.ts uno a uno        -> el tipo vive en dataModel.d.ts: sin regenerar, VERDE
> **"Con el schema quieto era completo; dejo de serlo SIN QUE NADIE LO TOCARA."**
> **"Las dos veces la señal fue la misma: EL CRITERIO SEGUIA SONANDO BIEN."**
**Un criterio roto por un cambio de contexto no tiene diff, ni autor, ni fecha** — nadie lo revisa
porque nadie lo ha tocado. Y **los dos fallaban hacia el verde.**
✅ Y T2 **enumero lo que se apoyaba en la premisa que tumbaba** (huella, C10, C11) y **acoto su
propio barrido**: *"un barrido mio sobre mi propio texto, que es justo el lector peor colocado"*.

**Siguen M9** (el paso 0 *"infiere consumidores desde datos que no acreditan uso ACTUAL"*;
C13bis-B colgado de Google sin declararlo; C14pre con el eje CAMINO mal) **y M11** (los cuatro
eslabones del residuo *enunciados y sin todos sus rojos*; C13bis-A sin **aserción del destino**
del diagnostico). ⚠️ Y una que no esperaba: **C1/C4 se quedaron con el observable de FILA cuando
M10 se cerro con el GLOBAL** — *el cierre viaja, el texto no.*

### AIT-143 r15 en auditoria desde 22:28:29Z
T3 restituyo las cuatro garantias y **corrigio un reparto suyo YA APROBADO POR TODOS**:
> **"Heredar un riesgo no autoriza a heredar el que uno acaba de crear encima."**
Habia mandado a AIT-151 **todo** el riesgo de corridas simultaneas —el auditor lo llamo
"explicito y honesto"— y era falso para el falso verde que **introduce su propio mecanismo**.
Y aprendio cuando enumerar y cuando medir el efecto: *"enumerar vale cuando la enumeracion es
EXHAUSTIVA POR CONSTRUCCION"* (C15, la lista de reporters la hace el framework).

### AIT-149 tramo 1 congelado · y la convencion mordio por tercera vez
T1 declaro un hash y `sed '$d'` daba otro: **calculo el cuerpo y luego añadio una linea en
blanco.** Lo cazo la propia comprobacion.
> **"Un hash del cuerpo no es «el hash de lo que escribi»: es el hash de LO QUE QUEDE AL QUITAR
> LA ULTIMA LINEA."** Y el resultado sigue siendo 32 hex validos.
**Van tres, y las tres son la misma: el hash se calculo y LUEGO el fichero cambio** (T2 con el
separador, T1 con el `\n`, yo citando en un encargo un hash de antes de recongelar). **La
convencion no falla por el algoritmo: falla por el ORDEN.** Arreglo de T1: **definir el sujeto
con el mismo comando que lo verifica.**

### 🔴 UNA CORRECCION EN EL SITIO EQUIVOCADO (T1, sobre la ficha AIT-139)
El PM retiro la exigencia imposible **en un apendice al final**, y el bullet original **sigue
intacto y sin marca en `## Criterios de aceptacion`**.
> **"Una correccion puesta AL LADO del original no lo corrige: lo DUPLICA. Y el que gana es el
> que esta en la seccion que lleva el nombre de la decision."**
> **"Una afirmacion superada que sobrevive no rompe nada — DEJA DE IMPEDIR COSAS."**
⛔ Y no se arregla tachando: **el criterio retirado y el convenio `4/5/6` viven EN LA MISMA
FRASE.** Es una reescritura y **depende de la respuesta del CEO.**

### Ocupacion 22:30Z
    T1 ... tramo 1 congelado (212 lineas, cuerpo c4c00de0), TERCERO en cola. AIT-139 esperando al CEO.
    T2 ... r9 en su scratchpad, FUERA de `codigo para auditar/` a proposito, sin cierre ni hash.
    T3 ... AIT-143 r15 EN AUDITORIA desde 22:28:29Z.

## 22:52Z — AIT-145 a un major del GO, y los duplicados tienen mecanismo vivo

### 🟢 AIT-145 r10 · M9-2, M11-1, M11-2 y M11-3 RESUELTOS. Solo queda M9-1
Y lo que queda es mecanico: **la receta del paso 0 no es ejecutable sin interpretacion** — cuatro
puntos: deployment nombrado, terminacion reproducible de `convex logs`, **separacion entre la
llamada testigo y la ventana de recuento cero**, y derivados.
📌 El tercero es el unico con miga: **la llamada testigo ES una invocacion de la ruta vieja**, asi
que si cae dentro de la ventana, **el propio control positivo contamina el sujeto**. Misma clase
que el testigo de cookies de M12.

**PKCE AUTORIZADO POR EL PM (a), con cuatro limites** — y el argumento que descarta mi lectura:
> *"runId/enganche: beneficio EXCLUSIVO del arnes. **PKCE: propiedad de SEGURIDAD DEL PRODUCTO**,
> gana el usuario real y ganaria igual aunque no existiera ninguna prueba."*
⛔ **Yo le habia llevado "es la tercera vez que el producto paga por el arnes" — un PARECIDO DE
FORMA presentado como PRECEDENTE.** El catalogo como atajo, cometido en el mensaje donde le pedia
que decidiera con cuidado. **El separo por a quien BENEFICIA; yo habia agrupado por a quien
CUESTA.**

🔴 **Y EL LIMITE 2 DEL PM ABRIA UN AGUJERO, lo encontro T2 al escribirlo:**
> *"Si una fila SIN verificador es una fila VALIDA, canjear sin verificador es exactamente el
> mundo de antes de PKCE. **La ligadura se caeria por la puerta que abre su propio requisito de
> compatibilidad.**"*
> **"Sin criterio explicito, gana el de compatibilidad EN SILENCIO — porque de los dos
> requisitos, el de no romper lo viejo es el unico que produce un ERROR si se incumple. El otro
> solo produce un agujero."**
**Cierre en tres piezas: opcional en el SCHEMA · obligatorio en la ESCRITURA · exigido en el
CANJE.** Y el PM **le quito la pata fragil**: *"aunque la caducidad fuera falsa, la decision no
cambia: el peor caso de rechazar una fila vieja es que el usuario VUELVA A PULSAR EL BOTON. Eso
no es romper compatibilidad, es un reintento."* Mas su reformulacion: **"aditivo significa QUE NO
HAY QUE MIGRAR DATOS, no que el sistema deba seguir aceptando lo que el cambio existe para
rechazar."**

### AIT-149 · el recibo que no escribio el autor
Mi corazonada del enmascaramiento (si `opportunities:remove` borra los `nextSteps`, volver a la
base es compatible con "nunca se creo") la resolvio T1 mejor que con el orden del log:
> **"Las filas de idempotencia SOBREVIVIERON y apuntan a lo creado. La limpieza no puede
> enmascarar una creacion que dejo su propio RECIBO — y el recibo no lo escribi yo, lo escribio
> `createQuick`."**
*El orden de un log lo escribe el autor; una fila que liga llamante con oportunidad la escribio
el sistema auditado.* **El mismo residuo que era un inconveniente es hoy la prueba.**
Y su distincion que corrige mi relay: **"las SALIDAS si estaban; lo que faltaba eran los
COMANDOS. Una salida sin su comando se lee pero no se reproduce: es una CITA, no una medicion."**
⚠️ Yo habia relayado *"la evidencia primaria no esta"*, mas ancho de lo que el auditor dijo
(*"no puedo rederivar"*). **Endureci la frase al pasarla.**

### 🔴 LOS DUPLICADOS: 63, NO 35 — Y EL MECANISMO SIGUE ACTIVO
**Mi barrido de las 22:37 conto 35; el de las 22:44, mismo comando y sin silenciar stderr, 63.**
En el primero **T2 salia con CERO** y tiene **18**. Los 28 que faltaban **no son nuevos**: el que
lo destapo nacio el 4 de septiembre. **No se por que el primero fue bajo y no lo invento.**
> **UN BARRIDO QUE SUBESTIMA NO FALLA RUIDOSAMENTE: ENTREGA CALMA.** Y reparti *"35, y solo 4
> importan"* con autoridad de medicion, cerrando el arbitraje. *Reverso del control que grita 61
> veces: al ruidoso alguien acaba mirandolo.*

    12 documentos de PROCESO (intro-terminal 2.txt, director/pm/ceo/integrador 2.md...)
     6 de CODIGO y producto: Avatar 2.tsx (la version ANTES de AIT-129, con el bug de las
       iniciales ya publicado como arreglado), authState 2.ts, check-e2e-preconditions 2.mjs,
       docs/03-setup 2.md, prd 2.md, 00-e2e-preconditions.spec 2.ts

**El FA decide borrar los doce**, medido: los 12 untracked, canonico existe para los 12, **el
canonico es SUPERCONJUNTO en todos**, y abrio las 17 lineas unicas de README una a una. Guarda
por fichero: *se borra solo si el canonico existe; si falta, se renombra y ESO ES UN HALLAZGO.*
⛔ **Y su correccion a mi lectura del riesgo:** *"que alguien lea `director 2.md` exige abrir un
fichero con un 2. **Lo que no exige nada es un `git add -A` desde T2**"* — con antecedente medido
esta noche (`_turno-raiz.log`).
🟢 **`.gitignore` de `* 2.*` condicionado a que un barrido periodico se los quede: LO ASUMO YO**,
con el recuento de la vuelta anterior al lado.
🔴 **Y el mecanismo sigue vivo:** `migracion-fuera-de-icloud.md:3` — *"decidido el 2026-09-09, NO
EJECUTADO TODAVIA"*; once duplicados del dia 9 **y uno de hoy a las 07:31**. *Un aplazamiento que
fabrica trabajo mientras espera deja de ser un aplazamiento gratis.* Va a Aitor.
⚠️ **Y el instrumento fallido del FA es el peor de la noche:** `case "$PWD" in *Mobile\ Documents*`
le dijo "NO esta en iCloud" — **y la sincronizacion de Documentos DEJA LA RUTA EN `~/Documents`**.
> **"Mi comprobacion solo descarta UNA FORMA DE RUTA, no el mecanismo. Habria reportado un «no»
> tranquilizador de un instrumento INCAPAZ DE DAR EL «SI»."**

### 🔴 Y MI SEGUNDA DE LA MISMA FORMA
Le dije a T2 *"los seis duplicados ya estan en el FA"* **y no se los habia mandado.** Lo escribi
como hecho mientras lo pensaba. **Segunda vez esta noche** — la primera fue el convenio `4/5/6`.

### Ocupacion 22:52Z
    T1 ... AIT-149 tramo1 r3 congelada, SEGUNDA en cola
    T2 ... AIT-145 r11: solo M9-1, los cuatro puntos del paso 0
    T3 ... AIT-143 r17 EN AUDITORIA desde 22:50:15Z

## 23:05Z — el hueco de la convención, y un GNU-ismo por cada dirección

### 🔑 EL HASH NO PROTEGE AL MUNDO DEL FICHERO (T2), y ya esta tapado
> **"Es «un veredicto de una version desconocida» POR EL OTRO EXTREMO: no cambio el fichero,
> CAMBIO EL MUNDO CONTRA EL QUE DICE MEDIRSE."** Cierto al escribirlo, falso al usarlo, **y sin
> chirriar: el numero seguia ahi, perfectamente formado.**

**Adoptado en mi disparo:** comparar la punta declarada del cierre con `origin/main`. **Salto en su
primer uso sobre DOS exports** — T2 (35 commits) y T3 (14), y **T3 no sabia que la suya lo estaba.**
⛔ **Y con la SEGUNDA MITAD, que es la que lo hace legible: medir si esos commits tocan la
huella.** En T3, 0 de 14 (control: 13 tocan `Sorfware Factory/`). **Caducada en el NUMERO, no en
el SUJETO.** *La distancia es el disparador; la huella es el veredicto* (formulacion del FA).
📌 Y el FA cierra su propia cuenta: *"cuando firme la convencion escribi «ata la version, no dice
que sea la punta — son dos comprobaciones». **Declare la segunda y no la construi.**"*
> **UN LIMITE DECLARADO NO ES UNA TAREA ASIGNADA.** Quedo escrito, correcto y sin dueño tres
> horas, y **lo cerro que alguien tropezara con el caso, no el catalogo.**

### 🔴 DOS GNU-ISMOS MIOS EN UNA NOCHE, Y LA COMPARACION QUE LOS ORDENA
Mi `sed 's/\(punta\|base\)/'` — **alternacion de GNU en un BSD**, la misma familia que mi
`head -n -1`. Dio VACIO en los dos exports.
✅ **Falló hacia "no puedo comparar" y lo cazo MI PROPIA REGLA de decir en voz alta que significa
un vacio.** La frase *"VACIO: el cierre no declara punta con 40 hex"* es lo que impidio leerlo
como "todo al dia".
🔑 **Y la comparacion de T2, que es la que hay que retener:**
> **Mi `sed \|` fallo hacia "NO PUEDO COMPARAR". Su `timeout` fallo hacia "NO APARECE LA COPIA".
> Misma familia, direcciones opuestas. La mia me obligo a mirar; la suya le habria dejado
> tranquilo.** *Ninguno de los dos lo elegimos: lo eligio el sitio del pipeline donde estaba el
> comando ausente.*
⛔ Y el FA lo usa contra su propia resta: *"una receta que viaja con su salida pegada NO PUEDE
estar sin ejecutar. Tus dos habrian sido imposibles bajo la resta — **y no te alcanzo porque la
resta es TEXTO y no cruza ningun paso obligatorio**."* **Primera instancia medida de que la resta
no basta sola, con dos horas de vida.**

### AIT-143 r18 · M1.1 CERRADO. La cache de modulos rompe la marca de fichero
> **M1.2: "la marca de fichero no identifica necesariamente al FICHERO CONSUMIDOR."**
El modulo del gate **se carga UNA VEZ POR WORKER**: si dos specs comparten worker, el segundo no
produce marca **y la regla lo acusaria de no haber importado**. *El observable SI procede del
sistema, pero mide otra cosa de la que dice medir.* Alcance: **negativo de DOS SPECS EN UN
WORKER.** Mas M1.3, segunda ronda con *el numero declarado no es el numero fabricado*.
✅ Y las quince referencias de impostores, correctas por primera vez.

### AIT-145 r11/r12 · M11 CERRADO, y la ceguera declarada hacia el verde
**M9-1 pedia tres cosas y T2 las cierra con el dato, no con el juicio:**
- *"El orden en que el CLI imprime no es un dato: es una PRESENTACION."* -> frontera por
  `timestamp` del evento crudo; **testigo A SEÑALADO y no supuesto**; ventana estrictamente
  mayor; **y un testigo B al final** que acredita que la captura siguio viva.
- ⛔ **Y DECLARA LA CEGUERA, que va hacia el verde:** `timestamp` tiene resolucion de segundo,
  asi que **una invocacion real en el mismo segundo que A contaria de menos**. Regla: *si algo
  comparte segundo con A, NO CONCLUYENTE y se repite.* **NO SE AJUSTA EL CRITERIO PARA QUE PASE.**
- Y "suficientemente ancha" deja de ser juicio: **umbral escrito ANTES de mirar el dato** (*"uno
  fijado a posteriori acaba justo por debajo de lo que salio"*) **+ suelo calculado del propio
  dato**: mas larga que el mayor hueco entre entradas consecutivas — *"si el deployment se calla
  tramos mas largos que mi ventana, mi cero es indistinguible de ese silencio."*
📌 **Y me corrige una regla que yo citaba como gratis:** tener un solo fichero suyo en la carpeta
me protege de disparar sobre el viejo **y le quita al auditor la comparacion entre rondas**.
> **Una regla que se transmite sin su precio se incumple la primera vez que el precio aparece.**

### AIT-149 tramo 1 · r3 y r4
🔴 **El auditor EJECUTO lo que T1 habia pegado y el contador FALLABA** (`NameError`, exit 1).
Causa suya: *"lo habia limpiado para que se leyera mejor"*.
> **UN COMANDO ABREVIADO ES PEOR QUE NINGUN COMANDO: parece rederivable y no lo es. Sin el, el
> lector sabe que le falta algo; con el, cree tenerlo.**
🔴 **Y su `$?` detras de un pipe**, en la seccion "controles a este propio export": *"un `$?`
despues de un pipe mide el ultimo eslabon, y el ultimo eslabon casi siempre tiene exito."*
Corregido **y escrito dentro del export, no borrado.**
✅ **Y retira el alcance de su propio recibo:** cubre UN TERCIO. *"Lo presente como si cerrara el
punto entero porque me parecio elegante, y lo elegante viaja mas ancho de lo que mide."*
⚠️ **Y yo lo ensanche al relayarlo** — segunda vez esta noche con sus mensajes. **Cuando algo me
parece elegante lo repito mas ancho de lo que es.**

### Ocupacion 23:05Z
    T1 ... tramo1 r4 EN AUDITORIA desde 23:03:47Z
    T2 ... AIT-145 r12 congelada, rebasada a 77838c5, SEGUNDA en cola
    T3 ... AIT-143 r19: marca por spec bajo cache de modulos + aritmetica de C18

## ⛔⛔ 23:09Z — EL CUPO DE CODEX SE HA AGOTADO. LA PUERTA DE AUDITORIA ESTA CERRADA

    ERROR: You've hit your usage limit. ... or try again at Sep 15th, 2026 6:52 AM.

**Medido, no deducido:** la r12 de AIT-145 se disparo a las 23:08:05Z, **murio a los 34 s con 0
lineas de veredicto** y 7.705 bytes, con ese mensaje DOS VECES al final. El proceso ya no corre.
**La ultima ronda buena termino a las 23:06:41Z (T1 tramo1-r4). La siguiente, 84 segundos
despues, ya no tenia cupo.**

⛔ **CONSECUENCIA: no se puede auditar nada hasta que Aitor compre creditos o hasta el 15 de
septiembre.** Las tres fichas estan a mitad de bucle y las tres dependen del gate:

    AIT-145 (T2) · r12 disparada y MUERTA · quedaba UN major (M9-1) y estaba cerrandose
    AIT-143 (T3) · r19 congelada 23:05:18Z, SIN DISPARAR · quedaban dos, ambos cerrados en la r19
    AIT-149 (T1) · tramo1 r5 por escribir · quedaban SOLO los autocontroles, ronda de forma

**Las tres estaban a una o dos rondas del GO.** *El cupo no se agoto por una ronda cara: se agoto
por el volumen del dia — hoy se han disparado del orden de treinta.*

**LO QUE HE HECHO:** parar la cola, avisar a los tres para que NO congelen mas (congelar sin poder
disparar produce artefactos que envejecen), escalar al CEO como bloqueo operativo —es lo que dice
`CLAUDE.md` para un sistema externo caido— y al PM para que decida que hacen los tres mientras
tanto. **Va a la lista de Aitor: es la SEGUNDA de cupo del dia, con AIT-120 (Convex por encima
del plan gratuito).**

⚠️ **Y UN LIMITE MIO, DECLARADO:** no se si el cupo es de la cuenta o de la ventana de facturacion,
ni si comprar creditos lo levanta al instante. **El mensaje dice las dos cosas —"upgrade" y "try
again at Sep 15th"— y no se cual manda.** No lo invento.

### 🔴 Y MI QUINTO `echo` COLGANDO DEL COMANDO, EN EL MINUTO EN QUE DIAGNOSTICABA ESTO
Imprimi *"(vacio = no aparece ninguna de esas palabras: el fallo no se explica por cupo)"*
**justo debajo de cuatro lineas que SI aparecian y que decian exactamente que era el cupo.**
El `echo` colgaba del comando y no del resultado. **Quinta vez esta noche en la fabrica, tercera
mia** — y esta vez el texto afirmaba lo contrario de lo que el comando acababa de imprimir.
> **La regla que llevo doce horas repartiendo no me alcanza a mi porque vive en mi cabeza y no
> dentro del gesto.** Es lo que el FA dijo de su resta: *un texto bien colocado no es un cruce.*

---

## 2026-09-10, ~23:30Z — GATE CAIDO: lo que se ha medido con el cupo agotado

**Estado del gate:** cupo de Codex agotado a las 23:08Z. `pgrep -f "^codex exec"` -> 0.
`/tmp/auditores/` vacio. Ningun cerrojo `_turno*` puesto. **Nada disparable.**
Lo levanta **una decision de Aitor** (comprar creditos), no el reloj. El mensaje dice
"try again at Sep 15th, 2026 6:52 AM" Y "purchase more credits": **no se cual de las dos
gobierna y no lo invento.**

### CERO CODIGO EN LAS CUATRO FICHAS VIVAS (medido por mi y confirmado por el FA)

    git diff --name-only origin/main...<punta>     commits por delante
      ait-139  ->  0 ficheros                        0
      ait-143  ->  0 ficheros                        0
      ait-145  ->  0 ficheros                        0
      ait-149  ->  0 ficheros                        0
    CONTROL POSITIVO, misma tirada (un 0 en todas partes = comando roto):
      ait-92-ola-2 -> 2 ficheros / 2 commits   ait-134 -> 9 / 15   ait-99 -> 4 / 7

**Las cuatro ramas estan EXACTAMENTE en `origin/main`.** No es "sin commitear": es que no
hay nada, ni a medias.
**LIMITE DECLARADO, que va pegado o el dato miente:** tres de las cuatro son fichas de arnes
y diagnostico, donde el plan es legitimamente la mayor parte del trabajo. **No se cuanto del
cero es patologia.** (Matiz del FA que si discrimina algo: una ficha de arnes que estuviera
construyendo tendria commits igualmente.)

### TRES FICHEROS `VEREDICTO_` SIN NINGUN DICTAMEN DENTRO — el tercer estado en el libro de cuentas

    find "codigo para auditar" -name 'VEREDICTO_*' -type f            -> 189
      de esos, con 0 lineas "^Veredicto del auditor: (GO|NO-GO)"      ->   3
    CONTROL POSITIVO del patron anclado: loop11 -> 2

Los tres, ya renombrados con **la causa EN EL NOMBRE** (convencion que ya existia y solo se
habia usado una vez, en el de T4):

    VEREDICTO_T2_AIT-145_plan-loop12_ABORTADA-POR-CUPO-DE-CODEX.txt
    VEREDICTO_T3_AIT-127_codigo-loop1_ABORTADA-POR-MODELO-AT-CAPACITY.txt
    Subido a GitHub/VEREDICTO_T4_AIT-123_plan-loop5_ABORTADA-POR-DECISION-DEL-FACTORY-ARCHITECT.txt

**Renombrar si, tocar dentro no**: el cuerpo del veredicto es del auditor y es el libro de
cuentas de la fabrica; el nombre es nuestro.

**QUE MURIO EN LA ULTIMA RONDA DEL DIA** (`plan-loop12`, mtime 2026-09-10T23:08:17Z):

    Codex ejecuto SU comprobacion de integridad y salio bien:
        956 -> 955 lineas (baja en EXACTAMENTE UNA)  ·  md5 4d6529d8...  recalculado por el
    y escribio, EN FUTURO:  "despues leere las 956 lineas completas"
    y despues:  ERROR: You've hit your usage limit...     tokens used: 7,838

> **La ultima ronda del dia verifico el sello del sobre y murio antes de abrirlo.**

Y las dos lecturas que salieron de ahi, las dos incomodas y las dos de sus autores:
- **T2:** *"lo que apago mi comprobacion no fue un fallo: fue una marca de calidad real de
  OTRO alcance"* — el recuento y el md5 acreditan **el sobre, no la carta**. Y **la frase del
  auditor estaba en FUTURO y se leyo como hecha**: *un anuncio dentro de un fichero de
  resultados se lee en pasado.*
- **El FA:** *"esa comprobacion de integridad la decidi yo hace tres horas. Funciono, y lo
  que no habia detras era la auditoria."* — **Un control puede estar perfectamente sano y ser
  lo unico que quede en pie.**

### EL TECHO DE 5 RONDAS DE PLAN (decidido por el FA, PROVISIONAL mientras dure la escasez)

Al pasar de 5, la ficha **no se cierra ni se aprueba: cambia de foro** y va al PM. Su dato:
**el 64% de las fichas consume el 28% del gate; el 36% consume el 72%. No hay ficha "media".**
Y **17 de 25 fichas nunca han tenido una ronda de codigo.**

**El contador NO lo llevo yo** (el contador y el disparador no pueden ser el mismo): se
**deriva** de los propios veredictos en disco. Tres decisiones suyas, tras medir yo el margen:
1. **cuenta DICTAMENES, no ficheros** (los 3 de arriba no cuentan);
2. **la excepcion va en el nombre**, y asi el conteo se puede derivar por nombre **y** por
   contenido: **si divergen, eso ya es un hallazgo**;
3. **una ronda escrita y no disparada no consume techo** (la r19 de T3) — *el techo raciona al
   auditor, y una ronda que no llego a el no gasto nada.*

**Y el FA retiro su propia frase** *"cuenta de menos, nunca de mas"*: el error va en **las dos
direcciones y se suman** — de menos por el nombre (28 sin `plan`/`codigo`), de mas por el
contenido (3 sin dictamen).

### DOS DISPARADORES QUE YO HABIA LEIDO DE MAS, Y ESTAN CORREGIDOS

⛔ **AIT-145 / la ficha del defecto de `main`.** Yo le dije a T2 que si el cupo duraba abriria
la ficha. **El PM afino el suyo y me desmonta:** *"Aplazada NO significa que el gate este
parado. Significa que AIT-145 deje de ser la pieza que reescribe esos tres sitios: que se
parta, que se recorte, o que su plan deje de borrar `convex/http.ts`. Un cupo caido la
retrasa; no la desposee."* **El disparador es de PROPIEDAD, no de tiempo.** Y su dato desactiva
la urgencia entera: **el campo de diagnostico no tiene consumidor y Gmail no esta en
produccion, asi que esperar cuesta CERO.** *Yo trataba la espera como si acumulara riesgo.*
**RETIRADO mi disparador temporal. Vale el suyo y solo el suyo.**

### AIT-139: EL TERCER ESTADO NO CABE EN NINGUNA CAPA (medido por T1)

    corrida que PASA  -> exit 0        FullResult['status'] = passed|failed|timedout|interrupted
    corrida que FALLA -> exit 1          <- CUATRO valores, ninguno es "no concluyente"

**Tres canales independientes y los tres binarios:** el `&&` de `test:e2e`, la banda de exits
del convenio, y el estado de corrida de Playwright. Si el reporter pone `failed`, el runner
sale con exit 1 y el CI lo ve rojo: **eso es tumbar la suite, que es lo que el criterio del PM
prohibe.** El tercer estado **solo puede vivir en el CONTENIDO del informe.**
⛔ **Pregunta abierta, en la mesa del PM: ¿quien lee "no verde", una persona o el CI?** Si una
persona, basta un marcador en el resumen; **si el CI, el valor no existe en ninguna capa y el
criterio tal como esta escrito es imposible, no dificil.**
📌 **Tercera vez en la MISMA ficha con la misma forma:** un criterio que exige un observable
que el sistema no produce.

**Y el PM retiro su propia regla** ("stderr no vacio => NO CONCLUYENTE": con ella, 10 de 10
corridas no concluyentes; con la forma corregida, 0 de 10). La forma que entra separa lo que
T1 habia metido en un solo saco:

    ExperimentalWarning + su linea acompanante -> RUIDO. No dice nada del sujeto.
    "There are no documents in this table."    -> SENAL. Unica prueba POSITIVA de que el CLI leyo.

> **Con `stdout` vacio, "lei y no hay filas" EXIGE esa linea. Si no esta, es NO CONCLUYENTE.**

Eso convierte el caso vacio **de una AUSENCIA en una PRESENCIA**. Condiciones: casar el ruido
**por linea entera**, y declarar el inventario **con version de Node y maquina**.
⚠️ **Y sobre `authRateLimits`, con las palabras del PM y no con otras:** *hoy la tabla esta de
verdad vacia, asi que "no hay limites de tasa" es la respuesta CORRECTA. El gate no miente
hoy.* **Lo peligroso es que la respuesta VERDADERA de hoy es indistinguible de la falsa de
manana.** Y eso refuerza la ficha: **el estado de colapso es alcanzable HOY, en la rama
peligrosa, sin que nadie se equivoque.**

### COLISION PENDIENTE DE ARBITRAR: `e2e/rate-limit-reporter.ts`

AIT-139 (T1) lo declara **seguro** en su lista; es tambien de AIT-143 (T3). **`git` no puede
arbitrarlo: las cuatro huellas son cero.** Es un choque de **huella FUTURA**, y eso lo dice la
ficha, no el repo. **Pedida a los dos la lista declarada de ficheros que van a MODIFICAR.**
Razon de T1, medida: `execSinFugas` **no lee el stderr del hijo en absoluto**
(`grep -c stderr` -> 0, `stdout` -> 3), asi que **son dos EXEC distintos, no dos llamadores**,
y arreglar `readTable` no cambia nada por la via del reporter. **Y ningun spec ejercita
`execSinFugas`: la mitad silenciosa no tiene hoy prueba que la vigile.**

### LECCIONES NUEVAS DE ESTA VUELTA

- ⛔⛔ **UN ESPACIO EN LA RUTA TIRA UN SUBCONJUNTO ENTERO EN SILENCIO.** El FA perdio la
  subcarpeta `Subido a GitHub` completa con `for f in $(find …)` sin comillas — y **el unico
  fichero que faltaba era justo el que iba a usar para corregirme**. Segunda vez esta noche
  (la primera, un `awk`). **No es un despiste repetido: en esta fabrica el separador de campos
  y el separador de ruta son el mismo caracter** (`Sorfware Factory`, `codigo para auditar`,
  `Subido a GitHub`), **asi que todo lo que se escriba aqui lo pisa.** Forma correcta:
  `find … -print0 | while IFS= read -r -d '' f`, o `find … -exec sh -c '…' _ {} \;`.
  **Y las dos veces el resultado salio limpio y plausible.**
- 🔑 **UNA PROPUESTA ES EL SITIO DONDE ENTRA LO NO MEDIDO CON PERMISO** (T1). Todo el metodo
  vigila **afirmaciones**; una propuesta se escapa entera **porque gramaticalmente no afirma
  nada** — hasta que alguien decide encima y ya es premisa. **Arreglo del FA, que no encarece
  el proponer:** *"una propuesta deja de ser propuesta en el instante en que alguien decide
  encima; ahi hereda la carga entera, y la pregunta la hace QUIEN DECIDE, no quien propuso."*
  En la mesa del PM, **dentro de su gesto de decidir, no en un documento al lado.**
- ⚠️ **CONTAR LA PALABRA EN VEZ DEL ACTO** (T2, dos veces en cinco minutos). `grep` de
  `Veredicto del auditor:` da 1 en la ronda abortada — **y esa aparicion es la linea del
  ENCARGO que manda terminar asi.** El marcador es **la linea suelta anclada**
  (`^Veredicto del auditor: (GO|NO-GO)`), no la mencion. **Lo salvo correr el control a la vez
  que el sujeto, no desconfiar mas.**
- ⚠️ **LO QUE NO SE TRANSMITE NO ESTA ADOPTADO, ESTA OCURRIDO** (T2). La convencion de nombrar
  una ronda muerta existia, funciono una vez, y las otras dos no la recibieron.
- ⚠️ **EL SELLO NO ACREDITA LA CARTA.** Una senal de rigor autentica puede tener **otro
  alcance** que el que apaga tu comprobacion.
- ⚠️ **UN ANUNCIO DENTRO DE UN FICHERO DE RESULTADOS SE LEE EN PASADO.**
- ⚠️ **UN CONTROL POSITIVO QUE SALE IGUAL QUE EL SUJETO NO TE DICE QUE EL SUJETO ESTE BIEN: TE
  DICE QUE EL INSTRUMENTO NO DISCRIMINA** (T1, dos falsos rojos seguidos midiendo exits — y
  **el primero habria publicado el resultado correcto por casualidad**).
- ⚠️ **"EN EL REPO" Y "EN DISCO DENTRO DE LA CARPETA DEL REPO" NO SON LO MISMO** (CEO). Yo lo
  dije como una sola cosa a los tres. **`_borradores/` esta en `.git/info/exclude`: protege del
  `git add -A` ajeno, NO de un borrado.** Si tiene que sobrevivir a mas que al cierre de una
  ventana, **se commitea**.
- ⚠️ **Y UN COMMIT SIN EMPUJAR EN `main` CUELGA DEL SIGUIENTE QUE PUBLIQUE.** Este diario
  estuvo 195 lineas sin commitear; lo commitee **y lo empuje** (`8c155ea`), porque era el unico
  commit por delante de `origin/main` y se lo habria llevado dentro cualquier otro push.

---

## 2026-09-10, ~23:55Z — CASILLA NUEVA EN EL EXPORT, y el numero que la justificaba estaba mal

### LA CASILLA DE LA HUELLA (decidida por el FA, ya en manos del CEO para ejecutar)

Junto a la del backend (`intro-terminal.txt:941`, `director.md:923`):

> **HUELLA: cuantos ficheros obliga a tocar este plan, CON EL COMANDO QUE LOS CONTO Y SU SALIDA.**

**Un export sin ella no se encola.** *Una casilla vacia se ve; un parrafo que no menciona la
huella, no.* Limites declarados por el FA, dentro y no al lado: **informa, no impide** (si la
huella es aceptable lo decide el PM); **un numero mal contado pasa igual** —pero es
refutable—; **y caduca con el plan**, por eso exige el comando.

🔑 **EL PRINCIPIO QUE ORDENA LAS TRES CASILLAS** (formulacion del FA sobre la frase de T3):
> **Las casillas obligatorias del export no son "datos importantes": son EXACTAMENTE las
> preguntas cuya respuesta NO ESTA en el documento que el auditor va a leer.**

    en que backend escribe  -> no esta en el plan. Hay que salir a mirarlo.
    cuando lo mediste       -> no esta en el plan. Hay que salir a mirarlo.
    cuantos ficheros toca   -> no esta en el plan. Hay que salir a contarlos.

**Si se contesta leyendo el plan, no es casilla: es trabajo del auditor. Si hay que salir del
documento, es casilla o no la hace nadie.** ⚠️ Con su freno: **solo lo externo es CANDIDATO**;
para entrar sigue haciendo falta que **su ausencia haya costado algo real**.

### ⛔ Y EL NUMERO CON EL QUE YO JUSTIFIQUE LA CASILLA ESTABA MAL: 24 ERAN 11

    playwright.config.ts:127       testIgnore: PATRON_PRUEBAS_PURAS  -> test:e2e IGNORA los 00-*
    playwright.unit.config.ts:25   testMatch:  PATRON_PRUEBAS_PURAS  -> test:unit corre SOLO los 00-*
      puras (00-*) .... 13      de flujo .... 11      DISJUNTOS, no solapan

Yo medi *"specs que importan de `@playwright/test`"* -> **24**, **con control positivo**
(`authRateLimits` -> 0) **y con el complemento impreso** (los que no lo importan: ninguno).
**Las dos salvaguardas que exigimos, puestas.**

> ⛔ **UN NUMERO BIEN MEDIDO SOBRE EL SUJETO EQUIVOCADO NO LO CAZA UN CONTROL POSITIVO: EL
> INSTRUMENTO FUNCIONABA PERFECTAMENTE.** La pregunta no era *"quien importa `test`"* sino
> *"a quien ALCANZA el gate"*, y esa la contesta **el CONFIG, no el import**.

✅ **Lo que si lo cazo, en veinte minutos: que el numero iba CON SU COMANDO al lado.** Si lo
hubiera escrito como frase —*"toca casi toda la suite"*— seguiria en pie.
📌 **Consecuencia para la casilla, propuesta al FA:** que pida **el comando Y EL SUJETO en la
misma linea** — *no "cuantos ficheros", sino "cuantos ficheros ALCANZA X, contados asi"*.
**El sujeto es donde se cae, y es lo unico que el control positivo no protege.**

### DECISION DE ALCANCE DEL PM SOBRE AIT-143: (A), pero no hoy

**(A) barrer los imports es el destino** — *"un gate que se puede esquivar por olvido no es un
gate: es una costumbre"*. **(B) comprobar por texto queda descartado**: un spec que se salte el
gate produce una corrida que **parece normal** — falla hacia el verde **en silencio**, y un
agujero declarado solo es tolerable si lo que se cuela **hace ruido**.

⛔ **Pero el barrido no se aplica hoy, y la razon no la habia visto nadie:**
> **"El coste de (A) se ha presentado como semanas de colision. Eso no es una propiedad de (A):
> es una propiedad de CUANDO aterriza (A). La colision dura lo que esta ficha tarde en
> publicarse — y con el gate caido, esa duracion NO ESTA ACOTADA."**

**El barrido es lo ULTIMO que se aplica, con todo lo demas construido, pero DENTRO del rango
auditado y nunca despues del veredicto** (*codigo que llega despues del GO hereda un GO que no
lo miro*). **Mientras tanto la suite NO esta en la huella de AIT-143: cualquier otra ficha puede
tocar specs.**
⚠️ Y una correccion del PM que conviene no perder: **el auditor de la r13 no tumbo "comprobar
por texto" — tumbo UN comprobador ESTRECHO**, al que se le escapaba `import type`. Uno que
prohiba la cadena entera, import de tipo incluido, no tiene esa evasion. **No esta mandado
implementar: se mide primero.** Evasion residual dicha: *un spec que importe de un tercer
modulo que reexporte `@playwright/test` no contiene la cadena.*

### ARBITRAJE: `playwright.config.ts:139`

T3 resolvio solo el choque del reporter (*el plan pedia "el reporter del gate", no "ese
reporter"*): crea `e2e/gate-reporter.ts` nuevo y **T1 se queda `e2e/rate-limit-reporter.ts`
entero**. Queda **una linea compartida**, la del array de reporters. **Arbitrado: siguen los dos
sin turno** —los cambios son aditivos y un conflicto ahi **falla ruidosamente**—, ⛔ **con la
condicion de que el segundo que publique compruebe que el array tiene LOS TRES y no dos.**

### LECCIONES DE ESTA VUELTA

- ⛔ **UN CONTROL POSITIVO Y UN COMPLEMENTO IMPRESO NO PROTEGEN DEL SUJETO EQUIVOCADO** (arriba).
  Lo unico que protegio fue **publicar el comando**, que permite a otro llegar a otro numero.
- ⛔ **DECIR "YA VA CAMINO DE X" MIENTRAS LO PIENSAS NO ES IMPRECISION: CIERRA EL ASUNTO**
  (el FA se lo apunta; yo lo hice dos veces hoy). **El coste no lo paga quien lo dice: lo paga
  el que deja de mirar.** ✅ **Y lo cazo una pregunta de LOGISTICA —"¿quien lo edita?"—, no la
  desconfianza.** *Las preguntas rutinarias de reparto cazan lo que el escepticismo no, porque
  se hacen igual cuando no sospechas nada.*
- ⚠️ **PEDIR QUE TE REFUTEN ES UN HABITO BUENO Y NO ES UN CONTROL:** solo se puede pedir cuando
  notas que el resultado te favorece, **y lo que no notas no lo vas a marcar.**
- ⛔ **SEXTA VEZ: UN `echo` COLGADO DEL COMANDO Y NO DEL RESULTADO.** Dos en esta misma vuelta:
  *"(vacio aqui = ningun veredicto tocado)"* impreso debajo de 26 veredictos, y *"(vacio arriba
  = no hay ninguno fuera de e2e/)"* impreso debajo de 110 rutas. **La frase que explica un vacio
  se imprime igual cuando no hay vacio, y se lee como si lo hubiera.** El arreglo no es acordarse:
  es **que el texto salga del resultado** (`test -z "$OUT" && echo ...`), no del guion.

---

## 2026-09-10, ~23:45Z — SONDA 7 y la LINEA BASE de AIT-143 (lo unico que rindio sin cupo)

### LINEA BASE `test:unit` — el ANTES, con sus coordenadas

    2026-09-10T23:40:41Z · rama aitormarin/ait-143-instantanea-rodada-muere
    HEAD 1ad4090 · arbol 0 sucios
      test:unit entero ................... 176 passed (1.2s)
      la 12a aislada (00-instantanea-sesion.spec.ts, config de unitarias)
                                              9 passed (298ms)

**Un antes sin sus coordenadas no es un antes: es un numero.** Esta suite corre **sin gate,
sin navegador y SIN CUPO**, asi que es el unico antes/despues real que AIT-143 podia producir
con el gate caido.

### SONDA 7: LA RAZON DE LA PROHIBICION ES FALSA (medida por T3, cableado verificado por mi)

Salio de una **corazonada mia declarada y sin medir**: *si `globalSetup` corre en cada
invocacion, "suite entera" y "test suelto" regeneran igual, asi que la razon de la prohibicion
estaria tan caducada como el consejo positivo.*

    proyecto de usar y tirar, globalSetup que solo imprime [GLOBAL-SETUP CORRIO]:
      (a) suite entera          [GLOBAL-SETUP CORRIO]   2 passed
      (b) -g UNO (test suelto)  [GLOBAL-SETUP CORRIO]   1 passed
      (c) un fichero por ruta   [GLOBAL-SETUP CORRIO]   2 passed
    ⛔ CONTROL NEGATIVO: misma sonda, config SIN la linea `globalSetup`, modos (a) y (c)
       -> 2 passed y NINGUNA linea impresa

    cableado, verificado por mi sobre 9c2cb67:
      playwright.config.ts:131     globalSetup: "./e2e/global-setup.ts"
      global-setup.ts:117-119      for (const role of ROLES) { writeStateAtomically(...) }
                                     SIN CONDICION: no mira si existe, ni si vale, ni si caduco
      CONTROL del grep: 'testDir' sale en las dos configs -> el patron discrimina

> **En la config de e2e NO hay diferencia entre "relanzar un test suelto" y "lanzar la SUITE
> ENTERA" en lo que a regenerar las instantaneas respecta: las dos regeneran.**
> ⛔ `e2e/authState.ts:136-137` **puede seguir siendo una regla correcta por otras razones,
> pero la razon que ella misma da es falsa hoy.**

⚠️ **LIMITE DECLARADO POR T3, que viaja con el hallazgo:** lo medido es el comportamiento del
**runner** con un `globalSetup` cualquiera, **no** una corrida real de `e2e/global-setup.ts`
haciendo los dos logins (eso consume cupo). **El segundo eslabon esta LEIDO, NO EJECUTADO.**

### ⛔ LA CLASE NUEVA, Y NO LA TENIAMOS: EL TEST Y EL FENOMENO VIVEN EN SUITES DISTINTAS

    playwright.unit.config.ts:15   // globalSetup — el de e2e hace dos logins y consume cupo...
                                      ^ COMENTADO A PROPOSITO: unit NO lo cablea

**El spec que vigila el consejo corre bajo `test:unit`, donde NO hay `globalSetup`** — o sea,
**en un contexto donde el mecanismo del consejo ni siquiera se aplica.**
> **Esa es la razon estructural de que esas aserciones pudieran pasar meses sin que nadie
> notara que el consejo habia caducado: SE COMPRUEBAN DONDE EL FENOMENO NO OCURRE.**
No es que el test estuviera mal escrito. Es que el test y el fenomeno estan en suites distintas.

### Y DOS LECCIONES DE INSTRUMENTO

- ⛔ **CONTROL POSITIVO Y CONTROL NEGATIVO NO SON LO MISMO, Y A MI ME FALTABA EL SEGUNDO.**
  El positivo dice *"el instrumento sabe dar OTRA cosa"*; el negativo dice *"el instrumento
  sabe NO DAR NADA"*. **Un rotulo que aparece siempre y un fenomeno que ocurre siempre son
  indistinguibles hasta que quitas el gancho.** Mi 24 de esta noche tenia el positivo y no el
  negativo. **Al barrido.**
- ⚠️ **EL MERITO ES DE LA MEDICION, NO DE LA CORAZONADA.** *Una advertencia sin medir que hace
  medir a otro vale exactamente lo que el dato que produce* — y el dato es de T3, con su
  control negativo y su limite declarado. **Que la corazonada acertara no acredita corazonar.**

**Decision pendiente, del PM y de nadie mas:** si la prohibicion se **mantiene con otra
justificacion**, se **estrecha** o se **retira**. Ni T3 ni yo hemos tocado el texto ni propuesto
redaccion. *Se ha caido la RAZON, no el enunciado — y una regla que se cumple por una razon
falsa es la que se retira el dia que alguien refuta la razon.*

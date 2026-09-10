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

# Lo que solo puede hacer Aitor — lista del PM

**Mantiene:** el Product Manager.

> ⛔ **LA FRESCURA DE ESTE FICHERO NO SE TECLEA: SE SACA DE `git`.** Las dos horas que
> había aquí escritas a mano —cabecera `21:40 UTC`, cuerpo `23:50 UTC`— **no cuadraban
> entre sí ni con el commit que las contenía** (`e7fbcc9`, 23:30:07Z): el cuerpo se
> fechaba VEINTE MINUTOS DESPUÉS de su propio commit. Retiradas. Para saber de cuándo es
> lo último de esta lista, y sin fiarte de ningún número escrito dentro:
>
> ```
> TZ=UTC git log -1 --date=iso-local --format=%ad -- 'Sorfware Factory/_para-aitor.md'
> ```
>
> **Una línea, sin tubería, y el desfase lo imprime `git`, no tú:** sale
> `2026-09-10 23:54:07 +0000`. **Ese `+0000` es del programa; una `Z` escrita a mano no.**
>
> ⚠️ **Lo que NO vale, y las dos formas se parecen muchísimo:**
>
> ```
> git log --date=format:'…Z'          -> 20:54:07Z   hora LOCAL, y la Z la pusiste tú
> TZ=UTC git log --date=format:'…Z'   -> 20:54:07Z   IGUAL: `format` (sin `-local`) usa el
>                                                    huso GUARDADO EN EL COMMIT (−0300),
>                                                    así que `TZ=UTC` delante no hace nada
> TZ=UTC git log --date=format-local  -> 23:54:07    correcto: con `-local` el TZ SÍ manda
> ```
>
> **`TZ=UTC` funciona — pero sólo con las variantes `-local`.** *No es que el entorno no
> sirva aquí: es que `format` e `iso` lo ignoran y `format-local` e `iso-local` lo respetan.*
>
> ⛔ **Y no lo hagas con `date -r <epoch>`, aunque en esta máquina funcione: es de BSD.**
> En GNU/Linux `date -r` es *el mtime de un fichero* y habría que escribir `date -d @<epoch>`.
> **Falla ruidosamente, que es la dirección buena, pero el comando que documenta la frescura
> de este fichero no debería tener ese borde.** *(Medido: aquí `date -d` responde
> `illegal option -- d`.)*
>
> 🔑 **Y el detector, que es lo único que no depende de saberse las banderas: un descuadre de
> un múltiplo EXACTO de una hora es un huso, no un incidente.** *La Directora cometió el
> error comprobando precisamente esta errata, y lo que lo cazó no fue el cuidado: tenía dos
> comandos distintos dando el mismo número —lo cual se lee como corroboración— y estaban mal
> por la misma causa.* **Dos instrumentos que coinciden porque comparten el defecto no son
> dos fuentes.**

> ⛔ **Nadie de la fábrica ejecuta nada de esta lista.** Todo lo de aquí necesita su
> identidad, su acceso o una decisión suya. Si algo deja de necesitarlo, sale de la lista.

## Cómo se lee la columna `pedido`

**Un paso nombrado y NO PEDIDO no es espera: es parada** — y la parada es responsabilidad
de quien tiene que pedirlo, o sea mía. Por eso cada línea dice **cuándo se le pidió**, no
solo que le toca a él. *Una ficha con dueño nombrado se siente atendida y por eso deja de
mirarse.*

**Estado con la fuente de cada cosa, porque "pedido" es justo el campo que no se puede
rellenar de oídas** (la hora del estado, arriba: sale de `git`, no de aquí)**:**

* **La lista entera se le habría entregado por el canal directo del Integrador** (~20:2xZ).
  ⚠️ **Me lo dice la Directora; yo NO lo he verificado con el Integrador.** *Queda como
  relayado, no como hecho: hoy ya nos ha costado una parada inventada dar por hecho lo que
  otro dijo que había hecho.*
* **AIT-120** lleva además **notificación de terminal a las 20:23Z**, ⚠️ **con Remote Control
  inactivo: NO llegó al móvil.** *O sea que depende de que vuelva a la silla.*
* **El resto siguen sin confirmación de lectura.**

📌 **Y sin ese paréntesis, un `SÍ` se lee como "avisado" y mañana nadie sabría que dependía
de que volviera a sentarse.**

---

## 1 · AIT-120 — pagar o reducir el plan de Convex · `pedido: SÍ (20:23Z, notificación de terminal SIN Remote Control: no llegó al móvil)`

**Es la primera porque su peor caso para las nueve sesiones a la vez y nadie de aquí lo
controla.** Decisión suya: subir de plan o recortar consumo.

📌 Si sube de plan, **AIT-114 vuelve a mí**: la salida del deployment desechable volvería a
estar sobre la mesa y cerraría AIT-95 y AIT-102 de paso.

## 2 · AIT-116 — migrar el repo fuera de iCloud · `pedido: NO`

**La pregunta NO es "¿migramos?" —eso lo decidió él el 09-09— sino:**

> **¿Paramos la fábrica un rato para migrar, o seguimos y aceptamos otro día de duplicados?**

⚠️ **La ventana está abierta HOY y se cierra sola:** la migración exige el repositorio sano
(cero duplicados en `.git/refs/`), y el mecanismo sigue vivo. **Cuanto más se trabaja, más
probable es que deje de estar limpio.** Riesgo acotado y reversible (`mv` en el mismo disco)
contra uno silencioso y sin límite (`fetch` y `push` caídos para todos).

## 3 · AIT-144 — el GATE del consentimiento de Gmail · `pedido: NO`

**Puede matar la Ola 2 entera y cuesta minutos.** Abrir la pantalla de consentimiento de
`gmail.readonly` con una cuenta del dominio y mirar si Google exige verificación.

🔴 **NO poner `GMAIL_CLIENT_ID`/`SECRET` en producción todavía. Y desde las 22:35 UTC esto ya
no es una precaución prudente: es LO ÚNICO que impide el ataque de AIT-145.**

El auditor tumbó el arreglo propuesto (NO-GO, confianza alta): **la URL de inicio fabrica su
propia prueba de posesión**, así que el atacante puede mandársela a la víctima y el vínculo
se crea igual. **Mientras esas variables no estén en producción, el ataque no existe; el día
que estén, existe.**

⛔ **Y no basta con que AIT-145 ponga `Done` para levantarlo:** hay que haber **fabricado el
ataque** —iniciar el flujo con una sesión, mandar la URL, consentir desde otra— y ver que
**el vínculo NO se crea**. *Un estado de Linear no es una prueba.*

✅ El gate del consentimiento **no necesita producción**: se hace contra el deployment de
desarrollo, que tiene las credenciales desde el 09-09.

✅ **En la MISMA sentada y DESPUÉS del gate: la premisa 1 de AIT-91** — abrir Gmail en un
hilo real por URL, en escritorio y en móvil. *Si Google exige verificación, esa premisa deja
de importar ese día.*

## 4 · `GMAIL_TOKEN_ENCRYPTION_KEY` — generarla · `pedido: NO`

Es la clave que cifra el token de refresco de Gmail y **hoy no existe en ningún deployment**.
La genera él, va a Bitwarden, y se da de alta **por deployment** (distinta en cada uno: un
token cifrado en dev no debe poder leerse en producción).

⚠️ **Consecuencia declarada:** si esa clave se pierde o se rota, los usuarios tienen que
**reconectar** su Gmail. No se pierde correo, se pierde la conexión.

## 5 · AIT-99 — los cuatro permisos · `pedido: NO`

Bloquea AIT-99 y **desbloquea además AIT-125**. Sin ellos no se puede avanzar.

## 6 · AIT-141 — confirmar contra producción · `pedido: NO`

Comprobar contra **`stoic-impala-857`** que `getWorkloadByOwner` y `getOverdueCountsByOwner`
**ya no están expuestas**. El código está publicado y verificado por QA; **solo falta esto**.

⛔ Ninguna terminal puede hacerlo: el gate 2 prohíbe resolver el deployment por URL+admin-key.

## 7 · AIT-97 — el navegador de pruebas · `pedido: NO`

**Aplicar la configuración del MCP de cada terminal** (vive en `~/.claude.json`, fichero
personal suyo: **nadie de la fábrica lo toca**). La decisión ya la tomó él el 09-09 —
*"cada terminal tiene que tener un acceso separado"*—; lo que falta es aplicarla.

## 8 · Las 12 fichas de fábrica paradas · `pedido: NO`

`AIT-116, 120, 122, 124, 126, 130, 131, 132, 135, 136, 138, 140`. Paradas a la espera de que
decida cuánto esfuerzo quiere en la fábrica frente a producto.

## 9 · El major que se escapó del gate de plan · `pedido: NO`

Decisión suya o del Factory Architect. Hoy hay **tres hallazgos que aparecieron
IMPLEMENTANDO y ninguno en ocho rondas de plan** (AIT-145, el XSS de `convex/http.ts`, y la
premisa falsa de AIT-134).

## 10 · AIT-134 — autorizar que un `major` se reclasifique de PLAN a CÓDIGO · `pedido: NO`

**Qué hay que autorizar:** el auditor marcó M1 en el **plan** como *cerrable con texto*, lo que
bloqueaba la ficha. El Factory Architect argumentó que **la discriminación de un instrumento
se demuestra corriéndolo contra un caso que debería fallar, y eso no se puede hacer en un
plan**, así que el hallazgo viajó al export de **código**. La decisión de moverlo **la firmó
la Directora**.

**Por qué es sustancial y no un trámite:** `intro-terminal.txt` (incidente AIT-76) dice que
**saltarse una fase se le pide a Aitor a través del Factory Architect y nadie más puede
concederlo**. El FA lo clasificó como **sustancial**, o sea suyo.

⚠️ **Y va con la salvedad que declara la propia Directora:** *"mi lectura de que ese párrafo
gobierna «saltarse la fase» y no «mover un hallazgo dentro de ella» es MÍA"*.

**Estado real:** el hallazgo está **cerrado y verificado en código** — GO del auditor a las
20:13:50Z, con la reclasificación confirmada por segunda vez. **Lo único que falta es el
visto bueno al PROCEDIMIENTO.**

**Qué bloquea:** el **merge** de AIT-134. No la auditoría, que ya está hecha.

🔴 **Y cómo apareció, porque es la lección del día:** esto llevaba horas contado como
*"ya está en su lista"* **y no estaba en ninguna lista suya** — vivía en el fichero de
reparto de la Directora. *Una parada que nadie le ha pedido no es una parada: es trabajo
detenido sin dueño.* Lo cazamos cruzando las dos listas.

## 11 · AIT-145 — AÑADIR las URIs de redirección de la app en la consola de Google
   `pedido: NO — ⛔ NO PEDIR HASTA QUE LA r5 DE AIT-145 FIJE LA RUTA`

**Qué hay que hacer:** en el cliente OAuth `SuperCRM Gmail`, **añadir** las URIs de retorno
que apuntan **a la app** (no a `.convex.site`), una por entorno.

⛔ **AÑADIR, NUNCA SUSTITUIR.** Las cinco de `.convex.site` **se quedan**: así nada de lo que
funciona hoy se rompe, y el plan B sigue disponible entero si esto se cae.

**Por qué:** es lo que cierra el ataque de vinculación **sin cobrarle un clic a cada usuario
en cada conexión**. Con el retorno en el mismo origen que la sesión del CRM, **en una sola
petición se ve quién consintió y quién está identificado**. El token de refresco **sigue sin
tocar el navegador**.

⚠️ **Límite declarado:** el diseño ha sobrevivido a **cinco ataques de su propio autor, dos de
los cuales rompieron y se arreglaron. Eso NO es una auditoría** — es lo que su autor supo
imaginar. **Se pide igualmente porque equivocarse aquí es barato: las URIs se añaden.**

---

## Los dos datos que quiero darle cuando aparezca

### 1 · En qué se ha escrito hoy — y los DOS números, porque uno solo miente

```
POR COMMITS (origin/main, desde 2026-09-10 00:00 UTC)
    total ................................................ 283
    tocan SOLO "Sorfware Factory/" ....................... 226   (80%)
    tocan solo app/components/convex/lib/e2e/scripts .....  33   (12%)
    mixtos ...............................................   3
    otros (docs sueltos, PRD de la ola 2) ................  21

POR LINEAS ANADIDAS (mismo rango, sin merges)
    fabrica .............................................. 8.138 (52%)
    codigo ............................................... 5.313 (34%)
    docs/ .................................................  404  (3%)
    otros ................................................ 1.688 (11%)
    TOTAL ............................................... 15.543
```

⚠️ **LOS DOS ESTÁN SESGADOS, Y EN DIRECCIONES OPUESTAS. Ninguno solo es honesto.**
  · Los **commits** no miden esfuerzo: uno de fábrica puede ser una línea y uno de
    código medio día.
  · Las **líneas** favorecen a la prosa: un documento de proceso son párrafos, y un
    arreglo de código puede ser tres líneas y media jornada.

**El reparto real está entre el 34% y el 80%.**

📌 **Procedencia:** los commits, medidos por el PM clasificando por rutas tocadas, con
control positivo y negativo del filtro. Las líneas, por el Factory Architect — y su
primera corrida daba *"0% fábrica / 72% código"*, la conclusión **contraria**, porque el
separador partía por espacios y la carpeta se llama `Sorfware Factory` **con espacio**.
Lo caza el control positivo, no la revisión.

⚖️ **Un recuento independiente del Integrador** da 221/39/5/18 sobre el **mismo total de
283**. La diferencia es de **criterio de clasificación, no de datos** —candidato suyo sin
medir: en los merges compara contra el primer padre—. **No mueve el titular.**
Y sobre las líneas, un recuento suyo a las 22:36Z da **53% / 33% / 3% / 11%** sobre un
total de 16.012: **los mismos porcentajes**, con 469 líneas más que el del FA, coherente
con que se midieron en momentos distintos de una jornada que seguía escribiendo.

### 2 · En qué se ha gastado el gate

```
138 ranuras de auditoria repartidas entre 21 fichas
  5 fichas llegaron alguna vez a CODIGO
```

⚠️ **Con su agujero:** 21 veredictos son de la convención antigua y no sabemos de qué tipo
son. Si fueran todos de código, el reparto sería 104/36 en vez de 104/15. **El sesgo va
hacia abajo: el reparto real es ése o menos favorable al plan.**

### ⛔ Y quién NO puede leer estos números por ti

Ni el Factory Architect ni el PM. **Él escribió la mayor parte de esa fábrica (42 commits
de proceso hoy) y se recusó él mismo con la razón correcta:** *un juicio suyo sobre si el
catálogo que escribió merece existir no es un juicio, es una defensa o una penitencia.*
**Y yo tampoco soy neutral: he abierto siete fichas hoy y he escrito en otras tantas.**

**Los números van; la lectura la pones tú.**

---

## 12 · UNA COMPROBACION DE TREINTA SEGUNDOS QUE SOLO PUEDES HACER TU (o el QA)

**¿El panel de Railway tiene un build command personalizado que ejecute la suite E2E?**

**Por que importa:** el PM acaba de decidir el diseno entero de AIT-139 sobre la premisa de
que **"no verde" lo lee UNA PERSONA y no una maquina.** Esa premisa la medimos los dos, por
separado, y sale igual:

    .github/workflows · .gitlab-ci.yml · .circleci · railway.json · railway.toml
    nixpacks.toml · Procfile · Dockerfile · .buildpacks .......... NINGUNO existe
    package.json "build" ........................................ "next build"
    quien invoca "test:e2e" ..................................... nadie, solo su definicion
    CONTROL POSITIVO del `test -e`: package.json SI existe (el test discrimina)
    Y ENSANCHANDO EL FILTRO a cualquier *.yml/*.yaml del repo: solo capturas de
    .playwright-mcp/, ningun fichero de CI.

⛔ **Pero los dos hemos mirado EL REPOSITORIO, y un build command escrito a mano en el
dashboard de Railway no se ve desde aqui.** **Ninguno de nosotros tiene acceso a ese panel.**

**Si Railway ejecuta la suite, la decision del PM se reabre entera** — porque entonces el
lector es una maquina, y el estado "no concluyente" **no existe en ninguna capa**: ni en el
`&&` de `test:e2e`, ni en la banda de codigos de salida, ni en el `FullResult['status']` de
Playwright (`passed|failed|timedout|interrupted`, medido). No seria dificil: seria imposible.

**No es urgente y no bloquea nada hoy** (el gate esta caido por cupo de todas formas).
**Va aqui porque es la premisa de la que cuelga todo lo demas, y esta escrita en la ficha
como tal para que nadie la de por buena sin volver a mirarla.**

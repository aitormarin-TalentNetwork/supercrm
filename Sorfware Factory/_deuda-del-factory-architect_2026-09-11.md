# Deuda del Factory Architect — cierre del 2026-09-11 01:55 UTC

**Lo escribo porque el 15 empieza alguien que no estuvo aquí.** Cada línea dice qué
decidí, **si llegó a un texto** y **dónde debería ir si no llegó**. Todo lo de la columna
"estado" está **medido ahora**, con `grep` sobre los ficheros publicados en `origin/main`
(punta `12bd2ca`), no recordado.

> ⚠️ **Un pendiente escrito por quien lo dejó pendiente se lee con su propia versión de
> por qué no se hizo.** Lo que sigue dice qué falta, no por qué se me quedó fuera.

---

## 1 · Decisiones que SÍ llegaron a un texto publicado

| Decisión | Dónde, verificado |
|---|---|
| **Empujar tu rama a `origin` desde tu worktree no es publicar** (publicar es mover `main`) | `intro-terminal.txt`, junto al "NIÉGATE" |
| **Abrir `_estado-para-reparto.md` al reinstaurar el entorno** (la sección apuntaba en contra) | `director.md` §"Cómo reinstaurar el entorno" |
| **Convención del hash**: `sed '$d' F \| md5` en la línea de cierre, viaja al veredicto, y **el auditor lo recalcula** | `intro-terminal.txt` + `AGENTS.md` |
| **Tercera casilla del export: la HUELLA** | `intro-terminal.txt:941`, `director.md:923` (`55ecc8f`) |
| **Universo del vigilante desde los procesos vivos**, no del disco | `_vigilante-fabrica-quieta.sh` (`3a45e48`) |
| **`* 2.*` en `.gitignore`** (los duplicados ya no se pueden commitear) | `.gitignore:163` |

---

## 2 · Decisiones que NO llegaron, y dónde van

### 2.1 · Techo de 5 rondas de plan por ficha — **NO EJECUTADO**
`grep -ic techo` sobre `director.md` e `intro-terminal.txt` → **0 en los dos.**

- **Qué es:** al pasar de 5 rondas de plan, la ficha **deja de ir al auditor y va al PM**.
  No se cierra ni se aprueba: **cambia de foro**.
- **Dónde va:** `director.md`, junto a las reglas de reparto.
- **Cómo se cuenta** (ya decidido): **dictámenes, no ficheros** — un `VEREDICTO_` sin
  `^Veredicto del auditor:` no cuenta; la excepción va **en el nombre del fichero**
  (precedente `_ABORTADA-…`); **una ronda escrita y no disparada no consume techo.**
  El contador **no se escribe en ningún sitio: se deriva** contando los veredictos en disco.
- ⚠️ **Es PROVISIONAL con condición explícita:** rige mientras el cupo esté racionado.
  **Si Aitor repone capacidad, se revisa con la tasa medida otra vez, no se queda por inercia.**
- 📊 **El dato que lo motivó:** 138 rondas de plan sobre 25 fichas, **8 llegaron a auditoría
  de código**; 16 fichas cuestan 38 rondas y **9 fichas cuestan 100**.
- 🔑 **Y lo que hay que leer antes de aplicarlo:** **la casilla de HUELLA vale más que este
  techo.** Si la huella se declara en la ronda 1, la ficha se reparte sabiendo lo que cuesta
  y el techo se queda como red, no como el arreglo.

### 2.2 · Cruce "deployments en uso" ↔ "lista de URIs de OAuth" — **NO CONSTRUIDO**
- **Qué es:** comparar los `CONVEX_DEPLOYMENT` de los `.env.local` contra los deployments
  nombrados en la lista de URIs de `docs/03-setup.md`.
  `A \ B` = deployment en uso **sin URI registrada** (el fallo caro, y lo dice antes).
  `B \ A` = URI de un deployment que ya nadie usa (ruido, se informa).
- 🔴 **Nace en rojo sobre un defecto real y sin arreglar:** el documento dice que T1 usa
  `uncommon-puffin-303` y **el `.env.local` de T1 dice `third-goldfinch-805`**.
- ⚠️ **Límite que va DENTRO cuando se escriba:** **no comprueba que la URI esté registrada
  en la consola de Google.** Comprueba que nuestras dos listas concuerdan. Lo otro sigue sin
  ser comprobable desde aquí.

### 2.3 · Borrado de los duplicados de iCloud — **NO HECHO, y han crecido**
```
duplicados bajo "Sorfware Factory/" ......... 88   (control positivo del mismo filtro)
nuevos desde 2026-09-11T00:00:00Z ............ 0
documentos de proceso duplicados en T2 ...... 20   (eran 12 cuando se decidió)
```
- **Criterio de borrado, y NO es "el canónico es superconjunto"** — esa formulación mía
  vale para documentos que crecen por anexión y **falla con código**:
  > **Se borra si el canónico es el estado PUBLICADO, verificado en `origin/main`.**
  > Y **si falta el canónico, se renombra al nombre canónico: eso es un hallazgo, no una limpieza.**
- ⚠️ **Hay copias de código de fichas vivas** (`gmailRespuesta 2.ts` en T2, `supervision 2.ts`
  en T1). **`Avatar 2.tsx` es la versión anterior a AIT-129, o sea el bug publicado y ya
  corregido, vivo en el árbol.**
- ⛔ **La causa sigue abierta y es de Aitor:** la migración fuera de iCloud está **decidida el
  2026-09-09 y sin ejecutar**. `AIT-115` (ayer) ya parcheó el síntoma en `tsconfig`.
  **Dos parches en dos días sobre el mismo mecanismo.**

### 2.4 · `_para-aitor.md` a Linear — **DEL PM, y pendiente de preguntárselo a Aitor**
Criterio: **un artefacto vive donde está su lector.** El diario de la Directora se queda
(lo citan 14 exports por ruta); `_para-aitor.md` se va (su lector lee Linear a diario y el
repo casi nunca). **Con nota de fecha:** lo citan 3 veredictos de AIT-145 que no se reescriben.
⚠️ **Y no se mueve sin preguntar:** mete contenido de fábrica en la herramienta que Aitor
lee para el producto, y hay 13 issues de fábrica esperando permiso para salir de ahí.

### 2.5 · La resta del rótulo de procedencia — **repartida, en ningún documento**
> **Si vas a escribir CÓMO lo mediste, pega la salida. Si no vas a pegar la salida, no
> escribas cómo lo mediste. Una de las dos, nunca el rótulo solo.**

**No es una regla: es un gesto que se elimina.** Tiene **una** instancia medida de no bastar
(una receta repartida sin ejecutar). **No cruza ningún paso obligatorio, y por eso no alcanzó.**

---

## 3 · Lo que espera a Aitor y no lo levanta nadie más

1. **Cupo de auditoría.** Confirmado: plan Plus, no lo sube ni compra créditos → **cinco días**.
   **La decisión pendiente:** en esos cinco días, ¿no se publica nada, se publica sin auditor, o
   **solo lo que se pueda demostrar ejecutando** (un test que falla antes y pasa después)?
2. **Si el panel de Railway ejecuta la suite** — no se ve desde el repo, y es **la premisa de la
   que cuelga AIT-139 entera**.
3. **Migración fuera de iCloud** (ver 2.3).
4. **Rotar el `CLAUDE_CODE_MESSAGING_TOKEN`** filtrado en un transcript.
5. **Sacar las 13 issues de fábrica** del proyecto de producto.
6. **Dos canales asignan roles** (Aitor a mano y el CEO por censo) y **nadie puede romper el empate**.
7. **El derecho exclusivo del Integrador sobre `main` es inaplicable**: los seis roles de la raíz
   tienen `push`. Hoy lo protege el texto y nada más.
8. **Volumen del catálogo:** ~70 reglas, y los fallos del día fueron reglas **incumplidas**, no
   ausentes. **Me recuso: escribí casi todas.**

---

## 4 · El número que cierra el día

```
origin/main, 2026-09-10:  275 commits  ·  215 solo "Sorfware Factory/"  ·  50 fuera
lineas anadidas:          fabrica 52%  ·  codigo 34%
las cuatro fichas vivas:  0 ficheros y 0 COMMITS por delante de origin/main
   (control positivo: ait-134 -> 9 ficheros / 15 commits)
```
**Los dos porcentajes están sesgados en direcciones opuestas** —las líneas favorecen a la prosa,
los commits al que commitea a menudo—, **así que el reparto real está entre el 34% y el 80% y
ninguno de los dos solo es honesto.**

# Sacar el repositorio de iCloud Drive — procedimiento

**Decidido por Aitor el 2026-09-09** tras AIT-116. **No ejecutado todavía**: espera a
que no haya trabajo en vuelo. Lo ejecuta el PM con Aitor delante.

## Registro de aplazamientos (decisión 81: la respuesta se registra, sea cual sea)

> **Por qué existe esta sección:** la decisión 81 obliga al PM a comprobar dónde vive el
> repositorio **antes de crear a nadie**, y a **anotar qué contestó Aitor**. Sin este
> registro, cada arranque de `/factory` se lo vuelve a preguntar y el silencio se lee como
> "pendiente de decidir" cuando en realidad ya se decidió (decisión 80).

- **2026-09-09 22:02 local (2026-09-10 01:02 UTC) — APLAZADA. Decide Aitor, pregunta el PM
  (`crm-curso-vibe-coding-a8`), al arrancar `/factory` con la fábrica entera apagada.**
  El PM le planteó que ése era el momento de coste más bajo —**ninguna terminal viva, nada
  a medias**— y midió que las precondiciones se cumplían casi todas: `main` = `origin/main`,
  las tres ramas de T1/T2/T3 subidas, `git fetch` exit 0, **`refs/` sin duplicados ese día**,
  y el `detached HEAD` del worktree de QA (`d441549`) alcanzable desde `main` (sin commit
  huérfano). **Único bloqueo medido:** T1 con 2 ficheros sin commitear (`convex/users.ts`
  modificado + `e2e/00-comprobadores.spec.ts` sin trackear), restos de AIT-99.
  **Aitor eligió levantar el equipo y migrar en el siguiente hueco.** La ventana se cerró al
  arrancar la fábrica: a partir de la primera tarea repartida, la precondición 1 deja de
  cumplirse.
  ⚠️ **Esto NO reabre la decisión de migrar** — sigue decidida y sigue pendiente. Lo que se
  aplazó es *cuándo*. El siguiente PM que llegue aquí no tiene que volver a preguntarlo:
  tiene que **buscar el próximo hueco con la fábrica parada** y proponerlo entonces.
  📌 Y que `refs/` estuviera limpio **ese día** no dice nada del siguiente: se midieron
  duplicados activos de iCloud en los worktrees en ese mismo momento (`package 3.json`,
  `framework 4.json`, `sales 2.json`). El daño de AIT-116 es intermitente, no resuelto.

## Por qué

La carpeta vive en `~/Documents`, que iCloud sincroniza por la opción *"Carpetas
Escritorio y Documentos"*. **Cuando iCloud cree que hay un conflicto se queda con las
dos copias** y renombra una a `foo 2.ts`. Con cinco worktrees, sus `node_modules` y sus
`.next` dentro, eso pasa constantemente.

**Ya costó un mes de `tsc --noEmit` en rojo con el código sano** (AIT-115), y las
superficies que quedan expuestas son peores: `.env.local` decide contra qué deployment
corre todo, y un duplicado dentro de `.git` no lo arregla ningún `exclude`.

**iCloud no es la copia de seguridad de esto.** Lo es GitHub, con historial y sin
corromper nada al sincronizar. Lo único que iCloud cubre y git no es `.env.local`, y de
eso el almacén de referencia es **Bitwarden** (`docs/01-arquitectura.md`).

## Destino, y por qué no `.nosync`

```
~/Proyectos/CRM-curso-Vibe-Coding
```

Se descartó renombrar la carpeta a `…​.nosync` **aunque cuesta exactamente lo mismo**
—las dos cambian la ruta y las dos obligan a reparar los worktrees—:

> `.nosync` funciona porque macOS lo respeta, pero **no es una garantía documentada**. Si
> deja de respetarse, **la carpeta vuelve a sincronizarse en silencio** y el síntoma es
> idéntico al de hoy. Sacarla de `~/Documents` **no puede fallar sin avisar**.
>
> Entre dos mecanismos que cuestan igual, **gana el que no puede romperse en silencio**.

De paso el destino **quita los espacios y el `+`** de la ruta actual, que ya han dado
problemas en más de un comando esta semana.

---

## ⛔ Precondiciones — si alguna falla, NO se empieza

1. **Ninguna terminal a mitad de tarea**, ningún plan esperando veredicto. Lo confirma la
   Directora, no se deduce del silencio.
2. **Todas las ramas subidas, no solo `main`.** Comprobar worktree por worktree:
   ```bash
   git log --oneline origin/main..main | wc -l          # tiene que dar 0
   git worktree list --porcelain | grep '^worktree ' | cut -d' ' -f2- | while read w; do
     printf '%s -> ' "$w"; git -C "$w" status --porcelain | wc -l
   done                                                  # todos a 0
   ```
   ⚠️ **Ojo con el worktree del QA: suele estar en `detached HEAD`.** Un commit ahí no
   pertenece a ninguna rama y **la migración se lo lleva sin avisar**. Si lo está,
   comprobar `git -C <ruta> log --oneline -3` y darle rama antes de seguir.
3. 🔴 **CERO duplicados dentro de `refs/`, y `fetch` funcionando.** Añadido el
   2026-09-09 después de un incidente real: **iCloud duplicó ficheros dentro de
   `.git/refs/` y dejó `fetch` y `push` rotos para todos los que comparten ese `.git`.**
   ```bash
   find .git -path '*/refs/*' -name '* [0-9]*'   # tiene que dar VACIO
   git fetch origin && echo "EXIT=$?"            # tiene que dar 0
   ```
   *Por qué:* git trata **cada fichero dentro de `refs/` como una referencia**, se llame
   como se llame. Un `main 2` **es una rama** para git. **Mover el repositorio con
   `refs/` duplicados es exactamente el momento de perder una rama.**

   ⚠️ **Y el mensaje de git engaña**: dice `bad object`, pero el objeto está bien — lo
   inválido es **el nombre de la referencia**, que lleva un espacio. Quien lo lea deprisa
   se irá a buscar corrupción de objetos y no la encontrará.

   *Los duplicados en el RESTO de `.git/` (los `index`) son basura inerte y no bloquean
   la migración.* **Solo los de `refs/` son fallo activo.**

4. **Anotar la lista de worktrees ANTES de tocar nada**, para poder comparar después:
   ```bash
   git worktree list > /tmp/worktrees-antes.txt
   ```

## Pasos

```bash
# 1. Mover (con las terminales cerradas)
mkdir -p ~/Proyectos
mv "/Users/aitor/Documents/curro + proyectos/Talent Land/Sistemas/CRM curso Vibe Coding" \
   ~/Proyectos/CRM-curso-Vibe-Coding

# 2. Reparar los worktrees. --relative-paths los deja INMUNES a futuros movimientos
cd ~/Proyectos/CRM-curso-Vibe-Coding
git worktree repair --relative-paths
git worktree list --porcelain | grep '^worktree ' | cut -d' ' -f2- | while read w; do
  git -C "$w" worktree repair --relative-paths
done

# 2bis. 🔴 COMPROBAR POR EFECTO, NO POR CONFIGURACION. El paso 3 PARECE YA HECHO.
#
#    `git config --get worktree.useRelativePaths` dice **lo que se PIDIO**, no **lo que HAY**.
#    Medido el 2026-09-10 con la config ya en `true`: CUATRO DE LOS CINCO worktrees tenian
#    ruta ABSOLUTA. La config solo aplica a los worktrees creados DESPUES de ponerla, y
#    solo T4 nacio despues.
#
#    🔴 EL RIESGO NO ES EL PASO 2 —esta escrito y es correcto— ES QUE EL 3 PARECE HECHO,
#    Y ESO HACE QUE EL 2 PAREZCA INNECESARIO. Quien ejecute lee el `--get`, ve `true`,
#    concluye que estan protegidos y SE SALTA LA REPARACION. Y esto se corre con la
#    fabrica parada: el fallo aparece cuando ya no hay nadie mirando.
for w in "$PWD" "Sorfware Factory/_worktrees"/*/; do
  f="$w/.git"; [ -f "$f" ] || continue
  case "$(cut -c1-9 "$f")" in
    "gitdir: /") echo "🔴 ABSOLUTA: $w  -> el repair del paso 2 NO se ha aplicado aqui" ;;
    *)           echo "✅ relativa: $w" ;;
  esac
done
#    ⚠️ CONTROL: fabrica un `.git` de cada tipo y pasalos por esa comprobacion antes de
#    fiarte de su verde. Un comprobador que no ha dicho nunca que no, no esta validado.

# 3. Que los worktrees FUTUROS nazcan ya con rutas relativas (Factory Architect, dec. 81)
#    El repair de arriba arregla los que existen; esto evita tener que acordarse nunca mas.
#    ⛔ Y NO PROTEGE A LOS QUE YA EXISTIAN. La config no esta mal puesta: esta bien puesta
#    y su alcance son los FUTUROS. Ver 2bis.
git config worktree.useRelativePaths true

# 4. Borrar cachés que guardan rutas absolutas
find . -maxdepth 4 -name ".next" -type d -not -path "*/node_modules/*" -exec rm -rf {} +
```

## Comprobaciones — las tres, y ninguna vale sola

```bash
git worktree list                    # las 5, con la ruta NUEVA. Comparar con /tmp/worktrees-antes.txt
git status                           # limpio
git worktree list --porcelain | grep '^worktree ' | cut -d' ' -f2- | while read w; do
  printf '%s -> ' "$w"; git -C "$w" status --porcelain | wc -l
done                                 # los 5 a 0
git log --oneline -1                 # el commit de siempre, no uno raro
```

**Control positivo, obligatorio:** hacer un commit vacío en un worktree y comprobar que
el repositorio principal lo ve. **Que `git status` no dé error no prueba que el enlace
funcione** — prueba que no está roto de la forma ruidosa.

## Después, y esto se olvida

- **Apagar la sincronización no hace falta**: al salir de `~/Documents`, iCloud deja de
  verla. Comprobar en Finder que la carpeta **no** tiene el icono de nube.

  ⚠️ **Y NO uses esta comprobación para dar la migración por buena:**
  ```bash
  test -d ~/Library/Mobile\ Documents/com~apple~CloudDocs/Documents && echo "sync ON"
  ```
  Ese comando dice si *"Escritorio y Documentos"* está activo **como función**, y va a
  seguir diciendo `sync ON` **después de migrar** — porque la protección no viene de
  apagar iCloud, viene de que **la carpeta ya no está dentro**. Si alguien lo corre al
  terminar y lo lee como fallo, deshará una migración correcta.
  **Lo que hay que comprobar es la RUTA nueva, no el estado de iCloud.**
- **Rutas absolutas escritas en documentos**: buscar `Documents/curro + proyectos` en
  `CLAUDE.md`, `docs/`, `Sorfware Factory/` y la configuración de MCP.
- **Las terminales arrancan en la ruta nueva.** La vieja no existe: si alguna sesión
  sigue viva apuntando ahí, **hay que cerrarla, no reutilizarla**.
- **`.env.local` NO se mueve solo si está fuera del repo.** Comprobar que sigue donde
  toca antes de arrancar nada; si falta, sale de Bitwarden.

## Lo que este procedimiento NO cubre

**La carpeta `Sorfware Factory/codigo para auditar/` está en `.gitignore`** — 48 ficheros,
10 MB, **todos los exports y veredictos de auditoría**. Se mueve con la carpeta, así que
la migración no la pierde. **Pero sigue sin estar en ningún sitio salvo esa máquina**, y
eso no lo arregla salir de iCloud: es una decisión aparte, pendiente.

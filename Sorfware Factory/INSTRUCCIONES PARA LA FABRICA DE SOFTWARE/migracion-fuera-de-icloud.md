# Sacar el repositorio de iCloud Drive — procedimiento

**Decidido por Aitor el 2026-09-09** tras AIT-116. **No ejecutado todavía**: espera a
que no haya trabajo en vuelo. Lo ejecuta el PM con Aitor delante.

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

# 3. Que los worktrees FUTUROS nazcan ya con rutas relativas (Factory Architect, dec. 81)
#    El repair de arriba arregla los que existen; esto evita tener que acordarse nunca mas.
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

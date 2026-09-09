# Copias congeladas puestas en cuarentena — 2026-09-08, 00:0x

**NO SON BASURA Y NO SE HAN BORRADO.** Se han MOVIDO aquí, enteras y sin tocar un byte.
Si alguna resulta ser importante, se mueve de vuelta y ya.

## Qué son

Ficheros con el sufijo " 2" que macOS anade al resolver un conflicto de nombre.
Eran **copias viejas de documentos de proceso vivos**, con nombre casi identico al
original y **en la misma carpeta que el original**.

| fichero | hora | tamano | el bueno, a la misma hora |
|---|---|---|---|
| `raiz/README 2.md` | 22:27 | 273 KB | `README.md` de las 23:45, **332 KB** |
| `worktree-QA/README 2.md` | 22:29 | 273 KB | idem |
| `worktree-QA/intro-terminal 2.txt` | 22:29 | 34 KB | — |
| `worktree-QA/ceo 2.md` | 22:29 | 62 KB | — |
| `worktree-QA/_indice-de-decisiones 2.md` | 22:39 | 11 KB | — |

Ninguna estaba rastreada en git (`??`), asi que **no hay historial del que recuperarlas**:
por eso se mueven y no se borran.

## Por que molestaban

La regla de la fabrica es leer los documentos de proceso **por ruta absoluta desde la
raiz**, para no leer copias congeladas. Estas estaban **dentro de la ruta correcta**, con
nombre casi identico. La regla fija DONDE mirar y no protege de que en ese sitio haya dos
cosas: el error ya no esta en la ruta, esta en el nombre. Un `grep` o un autocompletado
bastaban.

Dos ejemplos de lo que costaba:
- `README 2.md` iba **58 KB por detras** del real: toda la noche del 8 de septiembre.
- `intro-terminal 2.txt` es **anterior a las dos correcciones sobre el `cwd`**, o sea que
  contiene viva **la instruccion que hizo que una terminal matara su propio proceso**, a un
  directorio de distancia de la correccion.

## De donde salieron — HIPOTESIS, no hecho

T2 observo que el sufijo " 2" es el que genera macOS al resolver conflictos de
sincronizacion, y que el proyecto vive bajo `~/Documents` con iCloud Drive activo.
**Es una hipotesis con una observacion detras, no esta confirmada.** Aparecieron tambien
en directorios de codigo (`e2e/06-avisos-de-bloqueo.spec 2.ts`,
`app/clientes/[id]/page 2.tsx`, byte a byte identicos a sus originales).

Si la causa es iCloud, **no la arregla ningun documento**: la arregla sacar el proyecto de
la carpeta sincronizada, y eso lo decide Aitor.

## Como saber si vuelven a generarse

Si aparecen copias nuevas en las carpetas canonicas mientras estas siguen aqui, la causa
sigue activa. Eso es mas informacion de la que teniamos.

Hallazgo de T2. Decision de cuarentena del Factory Architect. Ejecutado por la Directora.

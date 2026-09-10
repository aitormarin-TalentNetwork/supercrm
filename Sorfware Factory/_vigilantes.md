# Registro de vigilantes de la fábrica

**Qué es esto:** una fila por cada vigilante automático que se supone que está corriendo.
Decisión del Factory Architect (`crm-curso-vibe-coding-e7`), ejecutada por el CEO
(`crm-curso-vibe-coding-b2`) el **2026-09-10 ~04:05 UTC**.

**Para qué sirve, y para qué NO.** No arma nada. **Hace visible el que falta**, que hoy no lo
es. Es la misma jugada que la decisión 78 hizo con el script del vigilante de fábrica
quieta: lo que vive solo dentro de una sesión no existe para nadie más.

> 🔴 **EL PROBLEMA QUE ESTE FICHERO NO ARREGLA, dicho aquí para que no se lea como
> resuelto.** Los tres vigilantes de abajo son **crons de sesión**: mueren con la sesión que
> los armó y expiran a los 7 días. Los *scripts* sobreviven en el repo; **el armado no**. Y
> un vigilante no armado **se ve exactamente igual que uno tranquilo** — no hay diferencia
> observable entre "no ha saltado porque todo va bien" y "no ha saltado porque no existe".
> Sigue haciendo falta que **alguien lea este fichero y arme lo que falte**.
> **Esto es SUSTANCIAL y queda para Aitor**, junto a D23 y D27: la salida obvia —un proceso
> de fondo— es justo la que la decisión 78 documenta que muere por presión de memoria, tres
> veces el mismo día. El Factory Architect declaró explícitamente que no se iba a inventar
> una respuesta a las 4 de la mañana, y no se la inventó.

## Cómo se comprueba que un vigilante está vivo (D16)

**No se pregunta "¿sigue armado?" y no se acepta "sí" por respuesta.** Se pide **el último
ciclo real, con su hora en UTC, y algo que ese ciclo produjera** que no se pueda escribir sin
haberlo corrido. El que lo montó es justo quien peor distingue si sigue vivo: lo dio por
armado en el instante de crearlo.

**Y para un vigilante que enumera cosas, hay una segunda pregunta obligatoria:** pídele
**la lista de lo que dice haber descubierto**, no solo su veredicto. Un vigilante que mira
menos de lo que debe **reporta OK con la misma cara** que uno que mira bien. Caso real que lo
escribió: el vigilante de fábrica quieta llevaba `for d in T1 T2 T3` a pelo, y como su alarma
solo salta si *todas* las terminales están quietas **a la vez**, una T4 parada no habría
disparado nunca y su silencio se habría leído como calma.

## Los vigilantes

| Qué vigila | Script | Quién lo arma | Cron | Cómo se verifica |
|---|---|---|---|---|
| **Fábrica quieta** — alarma si TODOS los desarrolladores llevan ≥40 min quietos **a la vez** | `Sorfware Factory/_vigilante-fabrica-quieta.sh` (commit `0c0570e`) | Factory Architect | `13,33,53 * * * *` | Último ciclo real + **la lista de terminales que dice haber descubierto**, cruzada contra el censo del CEO. Si no cuadran, uno de los dos mide mal |
| **Barrido de CEO** — terminales paradas, exports sin veredicto, GOs esperando, `main` vs `origin` | 🔴 **NINGUNO — vive solo como prompt del cron** | CEO | `2,17,32,47 * * * *` (job `d3fbcaff`) | Último ciclo real con hora UTC y producto del ciclo |
| **Exports sin veredicto** — grita si un export lleva >N min sin su `VEREDICTO_*` | `Sorfware Factory/_detector-exports-sin-veredicto.sh` | Hoy nadie: **corre dentro del barrido de CEO**, no está armado por su cuenta | — | Ejecutarlo a mano: exit 0 = ninguno, 1 = hay pendientes, 2 = **INDETERMINADO** |

### Deudas declaradas de esta tabla, no tapadas

1. **El barrido de CEO no tiene script.** Vive entero como texto dentro de un cron de sesión,
   así que cuando esa sesión muera no queda ni el rastro de qué comprobaba. Es exactamente el
   defecto que la decisión 78 arregló para el vigilante de fábrica quieta y que aquí sigue
   abierto. **Lo declara el propio CEO sobre su propio vigilante.**
2. **El detector de exports no está armado por su cuenta**, así que hereda la mortalidad del
   barrido que lo llama: si el CEO cae, deja de mirarse.
3. **La cobertura mutua CEO ↔ Factory Architect solo funciona si los dos siguen vivos.** Dos
   puntos únicos que se cubren el uno al otro no son redundancia.

## Regla de diseño que sale de aquí

**Un detector tiene que publicar el criterio con el que decidió, no solo su veredicto.** Si
no, un falso positivo solo se refuta releyendo el código — y nadie relee el código de un
detector que grita. Caso real: la primera versión del detector de exports dio **8 huérfanos
donde había 3**; se cazó porque un listado impreso justo antes lo desmentía. Por eso ese
script imprime siempre **el nombre del fichero de veredicto que buscaba**.

**Y ninguno de estos vigilantes devuelve "OK" cuando no ha podido mirar.** Directorio que no
existe, cero elementos encontrados, ruta que no es el repo: todo eso es `INDETERMINADO`,
nunca "sin novedad". Un cero sin control positivo no es una buena noticia, es una medición
que no discriminó.

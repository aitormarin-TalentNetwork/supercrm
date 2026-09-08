---
decision: alcance-del-bloqueo-de-borrado
tipo: grilling
estado: resuelta
bloqueos: []
---

# El bloqueo de borrado por oportunidades, ¿se mantiene o se levanta tambien?

Nacio y se cerro el 2026-09-08, durante la ronda 2 de review. Es el reverso de
[[borrado-de-cliente-con-emails]]: al comprobar el codigo, el revisor fresco (hallazgo
H7) demostro que la decision cerrada esa misma mañana no llegaba donde se pensaba.

## Frontera

- Sabemos: `convex/customers.ts::remove` ya bloquea el borrado si el cliente tiene
  CUALQUIER oportunidad, con el mensaje "tiene N oportunidad(es) asociada(s)". Eso es
  anterior a los emails y deliberado (AIT-65).
- Niebla: el razonamiento de la decision de la mañana era "un cliente con cientos de
  emails seria imborrable en la practica". Pero un cliente asi casi siempre tiene
  oportunidades, y por eso ya era imborrable, con emails o sin ellos. Tal como estaba
  escrita, la excepcion solo podia activarse para clientes con emails y CERO
  oportunidades.

## Como se resuelve

Enseñarle a Aitor el codigo real y preguntarle cual de las dos cosas queria: que los
emails dejen de bloquear (lo que pidio literalmente) o levantar tambien el bloqueo por
oportunidades (lo que haria util el dialogo que imaginaba).

## Resolucion

**Los emails no bloquean; las oportunidades si.** El patron de AIT-65 se queda intacto.

**Quien y cuando**: Aitor, 2026-09-08, al plantearle el hallazgo H7 de la ronda 2.

**Por que**: es lo que pidio literalmente —que los emails no hagan imborrable a un
cliente— sin ampliar el alcance a borrar ventas reales, que es una decision bastante
mayor y no es de esta ola.

**Consecuencia declarada, no disimulada**: el dialogo que dice "y los 200 emails
relacionados" sera un **caso de esquina**, porque solo se ve en clientes sin ninguna
oportunidad. Queda escrito en la §23 para que nadie lo lea como si levantara AIT-65.

**Ademas se cerro lo que faltaba**: al borrar un cliente que si procede borrar, los
emails se van **en cascada** con el. No contradice el "el historial sobrevive" de la
§24, donde lo que sobrevive es la desconexion del buzon, no la desaparicion del cliente.

**Que cambia en el PRD**: §23 (reescrita), §6 (criterio de borrado), y fila nueva en §17.

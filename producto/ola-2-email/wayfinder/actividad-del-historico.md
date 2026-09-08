---
decision: actividad-del-historico
tipo: grilling
estado: resuelta
bloqueos: []
---

# ¿Los emails del historico importado actualizan la actividad de las oportunidades?

Nacio y se cerro el 2026-09-08, durante la ronda 2 de review. No estaba en el PRD: la
descubrio el revisor fresco (hallazgo H3) al cruzar dos decisiones que se habian tomado
por separado el mismo dia.

## Frontera

- Sabemos: la §21 dice que todo email saliente mueve `lastActivityAt`, sin condiciones.
  La §4/§15 dicen que la primera sincronizacion baja correo sin tope, desde la
  oportunidad mas antigua del vendedor. `lib/risk.ts` calcula el riesgo al vuelo desde
  `lastActivityAt`, con un umbral de 7 dias.
- Niebla: nadie habia dicho que pasa cuando esas dos se cruzan. Cientos de emails
  antiguos disparando la regla reescribirian el estado de riesgo de TODO el pipeline el
  mismo dia de la conexion, visible en Hoy, Pipeline y Panel.

## Como se resuelve

Pregunta a Aitor con la consecuencia delante: el backfill toca datos de produccion que
ya existen, y el efecto es inmediato y masivo.

## Resolucion

**El historico NO toca `lastActivityAt`.** Solo cuentan los emails posteriores a la
conexion de la cuenta.

**Quien y cuando**: Aitor, 2026-09-08, al plantearle el hallazgo H3 de la ronda 2.

**Por que**: el historial se enriquece igual —los emails se guardan y se ven—, pero el
estado de riesgo del pipeline no cambia solo de la noche a la mañana sin que nadie lo
haya pedido. La alternativa (que el historico corrigiera el estado real) tenia el
argumento de que hoy el CRM cree paradas oportunidades que si se atendieron por email;
se descarto porque el precio era que media lista de "en riesgo" cambiara de golpe.

**Precio aceptado**: durante un tiempo el CRM seguira marcando como paradas
oportunidades que se atendieron por email antes de conectar la cuenta.

**Que cambia en el PRD**: §21 (regla nueva), §6 (criterio H8, tercer PASA), §8 fase 2,
§14 paso 3, y fila nueva en §17.

---
decision: correo-en-dos-buzones
tipo: grilling
estado: resuelta
bloqueos: []
---

# Si el mismo correo llega a dos buzones conectados, ¿quien lo ve?

Nacio y se cerro el 2026-09-08, en la ronda 1 del ciclo 2 de review (hallazgo H1). La
destapo el revisor al cruzar dos decisiones tomadas el mismo dia que nadie habia puesto
una al lado de la otra.

## Frontera

- Sabemos: la §24 promete que **un vendedor ve siempre los emails de su propio buzon**,
  aunque el cliente sea de otro comercial. Y la §21 guarda **un solo registro** por
  correo, deduplicado por `Message-ID`, con **un** `userId`.
- Niebla: esas dos cosas no caben juntas. Si Carlos y Marta reciben el mismo correo y el
  desempate lo gana uno, el otro **deja de ver un correo que tiene abierto en su Gmail**
  — exactamente lo que la regla de la §24 venia a evitar.

## Como se resuelve

Decidiendo de que cuelga el acceso. Mientras colgara de `userId`, la promesa era
imposible de cumplir sin duplicar el registro, y duplicarlo rompe el criterio "un solo
registro por email".

## Resolucion

**El acceso deja de colgar de `userId` y cuelga de una lista: `mailboxUserIds`.**

**Quien y cuando**: PM, 2026-09-08, al aplicar el hallazgo H1 del ciclo 2.

**La regla**: se ve un email si (a) el cliente es tuyo, (b) tienes rol de tienda entera,
o (c) **tu buzon esta en `mailboxUserIds`**. La lista **crece** cuando una segunda
sincronizacion encuentra el mismo `Message-ID`: no reescribe nada, añade.

**Que sobrevive de lo anterior**: `userId` se queda como dato de **procedencia** —que
buzon lo aporto primero— y `direction` sigue decidiendose por el desempate del remitente.
Lo que cambia es que ninguno de los dos manda ya sobre quien lo ve.

**Por que no duplicar el registro**: seria la otra salida, y rompe el criterio de "un
solo registro por email" de la §6 — el historial del cliente mostraria el mismo correo
dos veces, que es justo lo que ese criterio existe para impedir.

**Que cambia en el PRD**: §21 (entidad `emails` y regla de acceso), §24 (la promesa pasa
a ser cumplible), §6 (criterio de permisos), §19-CU3.

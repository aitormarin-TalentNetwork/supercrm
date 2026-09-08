---
decision: atribucion-con-varias-oportunidades
tipo: grilling
estado: resuelta
bloqueos: []
---

# Si un cliente tiene varias oportunidades abiertas, ¿que actividad registra un email?

La version 0.2 del PRD acota el enganche: un email saliente actualiza la ultima
actividad SOLO si el cliente tiene exactamente una oportunidad abierta. Con dos o mas
no se toca ninguna, para no inventar una atribucion. Eso es correcto pero incompleto:
en ese caso el CRM puede seguir marcando como parada una oportunidad de un cliente al
que se acaba de escribir. Bloquea el cierre de §21.

## Frontera

- Sabemos: el email pertenece al cliente y las oportunidades lo muestran como vista
  derivada (decision sellada, §17); crear un proximo paso es imposible porque el
  codigo exige accion y fecha del usuario (§28); un email entrante no cuenta como
  seguimiento (§21).
- Niebla: si con varias oportunidades abiertas conviene (a) no tocar ninguna y asumir
  el falso "parada", (b) tocarlas todas, (c) preguntar al vendedor en el momento del
  clic, o (d) usar el contexto del clic cuando el email se inicio desde una
  oportunidad concreta.

## Como se resuelve

Pregunta a Aitor con las cuatro opciones y su consecuencia. La (d) es la mas
prometedora —el CRM ya conoce la oportunidad si el vendedor pulso "Escribir" desde
ella— pero solo cubre los emails iniciados desde el CRM, no los que Carlos escriba
directamente en Gmail. Conviene medir antes cuantos clientes reales tienen mas de una
oportunidad abierta a la vez: si son casi ninguno, la respuesta barata (a) basta.

## Resolucion

**(d) El contexto del clic, con (a) de respaldo.**

**Quien y cuando**: Aitor, 2026-09-08. Su comentario en Notion se quedo a medias
(*"esta au"*, *"esta aui"*) sobre la opcion (c); al preguntarle de nuevo con las cuatro
opciones y su precio delante, eligio (d) con (a) de respaldo.

**La regla, en orden**:
1. Si el clic traia una oportunidad en contexto ("Escribir"/"Responder" pulsado dentro
   de una oportunidad), la actividad es de **esa**. El CRM usa lo que el vendedor ya le
   dijo al pulsar; no adivina.
2. Si no hubo contexto y el cliente tiene **exactamente una** oportunidad abierta, esa.
   Es la regla que ya tenia el PRD, conservada como desempate.
3. En cualquier otro caso, **ninguna**.

**Limite conocido y aceptado**: los emails escritos directamente en Gmail no llevan
contexto, asi que con varias oportunidades abiertas siguen sin actualizar ninguna. Es el
precio de no inventar atribuciones, y es preferible a marcar como activa una venta que
nadie ha atendido.

**Que cambia en el PRD**: seccion 21 (modelo de entidades), criterio H8 de la 6, paso 9
de la 14, CU4 de la 19, fase 5 de la 8, y fila nueva en la 17.

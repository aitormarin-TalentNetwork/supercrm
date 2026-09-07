---
decision: atribucion-con-varias-oportunidades
tipo: grilling
estado: abierta
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


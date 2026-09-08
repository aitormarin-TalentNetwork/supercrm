---
decision: emails-al-desconectar
tipo: grilling
estado: resuelta
bloqueos: []
---

# Si un vendedor desconecta su Gmail, ¿que pasa con los emails ya sincronizados?

Al desconectar se borran los tokens (§24, decidido). Lo que NO esta decidido es si se
borran tambien los emails ya guardados. Hay dos respuestas defendibles y opuestas.

## Frontera

- Sabemos: los tokens se borran siempre. Los emails son correspondencia comercial de
  la empresa con sus clientes, no correo personal del vendedor (premisa de §24).
- Niebla: si un vendedor que se va de la empresa puede llevarse —o borrar— el
  historial de conversaciones con clientes de la empresa. Y al reves: si el CRM puede
  conservar correo de alguien que ha retirado su consentimiento.

## Como se resuelve

Pregunta incomoda a Aitor, con las dos consecuencias sobre la mesa: (a) conservar —
el historial del cliente sobrevive a la rotacion de vendedores, pero el CRM guarda
correo de quien retiro el permiso; (b) borrar — se respeta la retirada del
consentimiento, pero la ficha del cliente pierde su historia cuando un vendedor se va.

## Resolucion

**(a) Conservar.** Los emails ya sincronizados **no se borran** al desconectar la
cuenta de Gmail; solo se borran los tokens y se cierra el canal push.

**Quien y cuando**: Aitor, 2026-09-08, comentando en la pagina de Notion.

**Su razonamiento, literal**: *"no se borran los correos historicos. Ni siquiera cuando
se desconecte el usuario de la cuenta Gmail... pues estos emails son parte del historial
de las oportunidades"*. Es decir: el correo pertenece al historial de la **oportunidad**,
no al vendedor que lo envio, y por eso tiene que sobrevivir a la rotacion de vendedores.

**Precio aceptado**: el CRM sigue guardando correo de una cuenta que retiro su
consentimiento. Queda declarado en el PRD, no disimulado. Una via de borrado a peticion
no se descarta, pero se abriria como decision propia.

**Que cambia en el PRD**: seccion 24 (seguridad y privacidad) y fila nueva en la 17.

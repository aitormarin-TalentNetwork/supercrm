---
decision: borrado-de-cliente-con-emails
tipo: research
estado: abierta
bloqueos: []
---

# ¿Un cliente con emails se puede borrar, o los emails lo bloquean?

AIT-65 establecio que el borrado se BLOQUEA si el registro tiene hijos (un cliente con
oportunidades no se borra). Los emails son hijos nuevos que esa decision no
contemplaba. Bloquea §23 (estados y errores) y afecta a codigo ya publicado.

## Frontera

- Sabemos: el patron vigente es bloquear, no cascada, con mensaje explicito del
  motivo (AIT-65). El PRD dice hoy que los emails se borran con el cliente (§24), lo
  que CONTRADICE ese patron — hay que resolverlo antes de construir.
- Niebla: si aplicar el patron de bloqueo a los emails es util o solo molesto. Un
  cliente con 200 emails seria imborrable en la practica, y borrar 200 emails a mano
  no es un trabajo razonable.

## Como se resuelve

Revisar la implementacion real de AIT-65 y decidir con ese contexto: mantener bloqueo
(coherente pero puede hacer imborrable a cualquier cliente con correo), o tratar los
emails como dato dependiente que se borra con el cliente (comodo, pero rompe la
coherencia del patron y hay que decirlo en el mensaje de confirmacion).

## Resolucion


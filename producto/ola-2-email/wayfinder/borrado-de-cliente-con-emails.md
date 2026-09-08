---
decision: borrado-de-cliente-con-emails
tipo: research
estado: resuelta
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

**(b) Los emails se borran con el cliente**, pero **solo tras una confirmacion que dice
cuantos son**.

**Quien y cuando**: Aitor, 2026-09-08, comentando en la pagina de Notion.

**Su razonamiento, literal**: *"Hay que permitir que se borre. pero antes de borrar hay
que mostrar dialogo indicando: esta a punto de borrar el cliente y los 200 emails
relacionados"*. El numero del dialogo es el real, no un texto generico: lo que hace
segura la operacion es que la persona vea el tamaño de lo que se lleva por delante.

**Consecuencia que hay que decir en voz alta**: es una **excepcion declarada al patron
de AIT-65**, que hoy bloquea el borrado cuando el registro tiene hijos. Se aparta a
proposito, porque un cliente con cientos de emails seria imborrable en la practica.
**Afecta a codigo ya publicado**: `convex/customers.ts`.

**Que cambia en el PRD**: seccion 23 (estados y errores), referencia en la 28, y fila
nueva en la 17.

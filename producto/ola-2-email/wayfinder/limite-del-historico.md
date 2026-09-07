---
decision: limite-del-historico
tipo: task
estado: abierta
bloqueos: []
---

# ¿Cuantos meses de historico se bajan en la primera sincronizacion?

Aitor decidio que el historico es ACOTADO (no todo, no nada) y dio un rango de 6-12
meses. El numero exacto queda abierto porque depende de un dato que hoy no tenemos:
cuanto ocupa de verdad el correo de un vendedor. Bloquea la fase 2 del
walking-skeleton (§8), no la fase 1.

## Frontera

- Sabemos: hay limite (decision sellada, §17); guardamos texto plano y no HTML (§15);
  la IA de la ola siguiente necesita historico suficiente para analizar una relacion.
- Niebla: el tamaño medio real de un email de negocio en este contexto, y por tanto
  el coste en Convex de 6 frente a 12 meses por vendedor.

## Como se resuelve

Medir en la fase 1: sincronizar un vendedor real, contar emails y bytes, extrapolar a
6 y a 12 meses, y comparar con el limite del plan de Convex. Con ese numero, la
decision es aritmetica.

## Resolucion


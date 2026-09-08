---
decision: limite-del-historico
tipo: task
estado: resuelta
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

**No hay limite.** El historico se baja **desde la fecha de la oportunidad mas antigua a
la que el vendedor tiene acceso**, sin tope superior.

**Quien y cuando**: Aitor, 2026-09-08, en dos pasos.

**Paso 1 — la fecha.** Comento en Notion: *"digamos que desde la fecha de inicio de la
primera campaña a la que el vendedor tiene acceso"*. En SuperCRM **no existe** ninguna
entidad "campaña" (verificado contra `convex/schema.ts`: 14 tablas, ninguna de
campañas). Al preguntarle, confirmo que era **oportunidad** — coherente con que "tener
acceso" es justo el lenguaje de permisos que ya rige clientes y oportunidades.

**Paso 2 — el tope.** Se le planteo explicitamente que esa respuesta afloja la premisa
de "historico acotado" sobre la que se apoyaban la §15, la §26 y la fase 1, y se le
ofrecio un techo de seguridad. **Eligio no ponerlo**: todo desde la oportunidad mas
antigua, sin tope.

**Precio aceptado, con la consecuencia delante**: el coste de Convex queda **abierto**
hasta que se mida. La medicion de la fase 1 no desaparece, pero cambia de proposito:
sirve para **saber** cuanto cuesta el historico completo, no para recortarlo. Si el
numero asusta, se reabre esta decision con Aitor.

**Que cambia en el PRD**: seccion 4 (alcance), 15 (volumen), 9 (premisa + riesgo
aceptado), 18 (plan de validacion), 26 (coste) y fila nueva en la 17 que **supera** la
decision del 2026-09-07.

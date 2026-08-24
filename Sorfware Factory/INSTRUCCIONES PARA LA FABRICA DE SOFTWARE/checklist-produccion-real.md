# Checklist: salida a producción real

> Plantilla pensada para ser reutilizable en cualquier proyecto que use este montaje de
> "fábrica de software" multi-agente, no solo SuperCRM. La sección "Parte genérica" no
> debería necesitar cambios al adaptarse a otro proyecto; la sección "Configuración de
> este proyecto" es la que se sustituye entera al hacerlo.
>
> Nace de la auditoría de cierre de MVP de SuperCRM (2026-08-21): varias decisiones
> fueron razonables **para un proyecto sin datos reales** (credenciales de login en
> claro, un único entorno compartido entre desarrollo y producción) pero nadie las marcó
> como "revisar antes de que haya un negocio real usando esto" — así que seguían así
> semanas después de que el MVP funcionara. Este checklist existe para que esa pregunta
> se haga explícitamente, una vez, en el momento correcto — no para repetir el checklist
> de "Done" que ya corre por cada issue.

---

## Parte genérica (aplica a cualquier proyecto)

### Qué dispara este checklist (y qué NO)

Se dispara cuando el proyecto va a dejar de ser un curso/demo/prueba sin datos reales y
va a empezar a manejar **datos reales de un negocio** (clientes reales, ventas reales,
dinero real, cualquier dato personal real). No es lo mismo que "cerrar una fase" o "cerrar
el MVP" — puede llegar mucho después del MVP, coincidir con él, o no llegar nunca si el
proyecto se queda como ejercicio. No confundir con la revisión de cierre de fase/milestone
que ya hacen Director/Integrador (esa es documentación e higiene de cada fase; esta es
riesgo de negocio real, una vez, antes del salto).

### Quién lo dispara

El **PM** es quien tiene la visión de negocio más amplia — es quien mejor puede notar que
el salto a datos reales está cerca. Si lo detecta (o Aitor se lo dice directamente), avisa
al Director/CEO de que toca ejecutar este checklist, y lo confirma explícitamente con
Aitor antes de dar el checklist por superado (ver `pm.md`).

### Quién lo ejecuta

El **Director** (o el **CEO** si está activo) recorre la lista de "Configuración de este
proyecto" ítem por ítem. Cada ítem termina en uno de dos estados:
- ✅ **Resuelto** — ya no aplica, o se ha corregido antes de la salida a real.
- 🔴 **Pendiente, con plan explícito** — se documenta qué falta y cuándo se resuelve.

**No se da el checklist por superado con ningún ítem en 🔴 sin que Aitor lo haya visto y
decidido explícitamente aceptar ese riesgo concreto** — igual que cualquier otra decisión
de alcance/producto, no se asume silencio como aprobación.

### Qué comprobar, en genérico

- Cualquier credencial o dato de prueba visible en la UI (autorrelleno, valores
  placeholder, contraseñas en claro) se retira antes de que haya usuarios reales.
- El entorno de desarrollo/test está aislado del de producción — ninguna suite de tests
  automatizados ni ningún flujo de desarrollo escribe contra datos reales.
- Cualquier secreto que alguna vez estuvo expuesto en claro (ver regla dura de
  `CLAUDE.md`) está rotado.
- Cualquier otra decisión que el proyecto haya documentado explícitamente como "válida
  solo mientras no haya datos reales" (buscar ese tipo de nota en `docs/`, ADRs, y
  comentarios de diseño) — se revisa una a una, no se asume que ya no aplica.

---

## Configuración de este proyecto (SuperCRM)

- **Estado: no disparado todavía.** SuperCRM sigue en modo curso, sin datos reales de un
  negocio usándolo.
- **Ítems ya identificados, pendientes de resolver cuando se dispare de verdad**
  (detectados en la auditoría de cierre de MVP, 2026-08-21):
  - **Credenciales de Marta y Carlos en claro en el login** (`app/login/page.tsx`,
    autorrelleno incluido). Aitor confirmó explícitamente dejarlo así por ahora
    (2026-08-20) — pero esta es exactamente la decisión que este checklist tiene que
    volver a poner sobre la mesa antes del salto a real, no una aprobación permanente.
  - **Entorno de Convex compartido entre desarrollo y producción** (mismo deployment que
    usa Railway en producción). AIT-59 creada en Backlog para no perderlo.
    **🟢 Resuelto (2026-08-24, AIT-59):** Railway ahora despliega en cada build contra
    `stoic-impala-857` (deployment de producción propio, separado del compartido
    `third-goldfinch-805` de desarrollo/test) — ver ADR-004 en `docs/01-arquitectura.md`.
    Verificado en vivo: login de las 2 cuentas de prueba funciona contra el nuevo
    backend, rutas protegidas redirigen sin sesión, y `third-goldfinch-805` sigue
    respondiendo con normalidad para las 3 terminales. No cambia la fila de arriba
    (credenciales en claro en el login) — eso sigue pendiente, sin relación con esta.
- Añade aquí cualquier otro ítem que se descubra después, con la misma disciplina —
  este documento es acumulativo, no se sustituye.

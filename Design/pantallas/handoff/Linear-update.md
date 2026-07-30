# Handoff para Claude Code — Actualizar Linear (vía MCP)

> **Objetivo:** registrar en Linear el trabajo final del prototipo **SuperCRM — MVP**: crear (o actualizar) un proyecto, publicar un status update de cierre, y crear **10 issues en estado *Done***, una por pantalla construida.
>
> **Cómo usar este fichero:** pásaselo a Claude Code con el MCP de Linear conectado y pídele *"ejecuta el plan de este fichero contra Linear"*. Todas las llamadas MCP están especificadas abajo con sus parámetros.

---

## 0) Antes de empezar — decisiones que debe confirmar el usuario

1. **Equipo (team):** _<RELLENAR — p.ej. "Talent Engine">_. Es obligatorio para crear el proyecto y las issues.
2. **Proyecto:** crear uno nuevo llamado **`TalentSalesAi`** (o reutilizar si ya existe — buscar primero con `linear__list_projects`).
3. **Lead / assignee:** usar `"me"` salvo que el usuario indique otra persona.
4. **Enlaces a prototipos:** los archivos viven en local (no se publican). En cada issue se referencia el nombre del fichero `*.dc.html`. Si hay una URL de preview compartida, sustituir las rutas locales por esa URL.

> Si el proyecto `TalentSalesAi` ya existe, usar su `id` en `project` en lugar de volver a crearlo.

---

## 1) Crear / actualizar el proyecto

**Tool:** `linear__save_project`

```json
{
  "name": "TalentSalesAi",
  "addTeams": ["<TEAM>"],
  "lead": "me",
  "icon": "Rocket",
  "color": "#2A6FDB",
  "summary": "Prototipo MVP de SuperCRM — CRM móvil para vendedores (Carlos) y panel web para la dueña (Marta).",
  "state": "completed",
  "description": "Prototipo de alta fidelidad del MVP de **SuperCRM**, construido sobre el design system propio (tokens de color, tipografía, espaciado y 23 componentes).\n\n**Dos roles, dos plataformas:**\n- **Carlos (comercial)** → flujo móvil: Hoy, Pipeline, Detalle de oportunidad, Ficha de cliente, altas rápidas y registro de interacciones.\n- **Marta (dueña)** → flujo escritorio: Panel de KPIs y Supervisión del equipo, con guardia de acceso por rol.\n\n**Entregado:** 10 pantallas/flujos + biblioteca de componentes, todo navegable y con estados (vacío, carga, error, validación)."
}
```

---

## 2) Publicar status update de cierre

**Tool:** `linear__save_status_update`

```json
{
  "type": "project",
  "project": "TalentSalesAi",
  "health": "onTrack",
  "body": "**MVP completado ✅**\n\nLas 10 pantallas/flujos del MVP están construidas sobre el design system y navegables de punta a punta.\n\n- **Carlos (móvil):** captar contacto, registrar interacción, gestionar pipeline y cerrar venta — cubierto.\n- **Marta (escritorio):** panel de KPIs y supervisión del equipo con acceso por rol — cubierto.\n\n**Cobertura de tareas imprescindibles:** total. Navegación cruzada cerrada (Hoy ↔ Pipeline ↔ Detalle ↔ Ficha de cliente).\n\n**Siguiente paso sugerido:** revisión con usuarios reales y conexión a datos."
}
```

---

## 3) Crear las 10 issues (todas en `state: "Done"`)

Para **cada** bloque siguiente, llamar a **`linear__save_issue`** con `team: "<TEAM>"`, `project: "TalentSalesAi"`, `assignee: "me"`, `state: "Done"`, `priority: 0`, y el `title` / `description` indicados. Añadir `labels` si existen en el workspace (p.ej. `"Design"`, `"Prototype"`).

> Sustituir `<TEAM>` por el equipo confirmado en el paso 0.

---

### Issue 1 — UI Kit (biblioteca de componentes)
```json
{
  "team": "<TEAM>", "project": "TalentSalesAi", "assignee": "me", "state": "Done", "priority": 0,
  "title": "UI Kit — Biblioteca de componentes del MVP",
  "description": "Galería documentada con los componentes del design system usados en el MVP, organizados en 9 grupos (botones, inputs, tarjetas, badges, modales, navegación, listas, KPI, feedback) con anatomía, variantes y estados.\n\n**Archivo:** `UI Kit.dc.html`"
}
```

### Issue 2 — Login
```json
{
  "team": "<TEAM>", "project": "TalentSalesAi", "assignee": "me", "state": "Done", "priority": 0,
  "title": "Login — Acceso responsive con rol",
  "description": "Pantalla de acceso responsive (mobile-first + escritorio). Auth simulada, mostrar/ocultar contraseña, validación, estado de carga del botón y redirección según rol (vendedor → Hoy, dueña → Panel). La sesión se guarda para las siguientes pantallas.\n\n**Archivo:** `Login.dc.html`"
}
```

### Issue 3 — Hoy (Carlos · móvil)
```json
{
  "team": "<TEAM>", "project": "TalentSalesAi", "assignee": "me", "state": "Done", "priority": 0,
  "title": "Hoy — Agenda diaria del comercial",
  "description": "Pantalla de inicio de Carlos (móvil): saludo según hora, bloque de seguimientos vencidos destacado, lista de seguimientos de hoy, y botón '+' con menú de altas (Oportunidad, Contacto, Actividad). Incluye estados de carga, vacío y acciones Hecho/Posponer.\n\n**Archivo:** `Hoy.dc.html`"
}
```

### Issue 4 — Pipeline (kanban)
```json
{
  "team": "<TEAM>", "project": "TalentSalesAi", "assignee": "me", "state": "Done", "priority": 0,
  "title": "Pipeline — Tablero kanban de oportunidades",
  "description": "Tablero kanban de 5 etapas con arrastrar y soltar entre columnas, total por columna y alta de oportunidad. Consciente del rol: la dueña ve todas las tiendas y asigna responsable; el comercial ve solo las suyas.\n\n**Archivo:** `Pipeline.dc.html`"
}
```

### Issue 5 — Detalle de oportunidad
```json
{
  "team": "<TEAM>", "project": "TalentSalesAi", "assignee": "me", "state": "Done", "priority": 0,
  "title": "Detalle de oportunidad — Ficha operativa de venta",
  "description": "Centro operativo de cada venta: cabecera con cliente/contacto/importe/cierre, cambio de etapa, línea de tiempo de actividad y acciones rápidas. El nombre del cliente enlaza a su Ficha de cliente.\n\n**Archivo:** `Detalle de oportunidad.dc.html`"
}
```

### Issue 6 — Alta rápida (modal)
```json
{
  "team": "<TEAM>", "project": "TalentSalesAi", "assignee": "me", "state": "Done", "priority": 0,
  "title": "Alta rápida — Modal de creación (oportunidad / contacto / actividad)",
  "description": "Modal de creación con validación, lanzable desde Hoy, Pipeline y Ficha de cliente. Selector de cliente con opción de crear cliente nuevo en línea (no es un modo paralelo).\n\n**Archivo:** `Alta rápida.dc.html`"
}
```

### Issue 7 — Registrar interacción (modal)
```json
{
  "team": "<TEAM>", "project": "TalentSalesAi", "assignee": "me", "state": "Done", "priority": 0,
  "title": "Registrar interacción — Modal de actividad",
  "description": "Modal para registrar llamada/visita/email/nota con contexto automático (cliente y oportunidad), próximo seguimiento y validación. Lanzable desde Detalle, Ficha de cliente y Hoy.\n\n**Archivo:** `Registrar interacción.dc.html`"
}
```

### Issue 8 — Ficha de cliente
```json
{
  "team": "<TEAM>", "project": "TalentSalesAi", "assignee": "me", "state": "Done", "priority": 0,
  "title": "Ficha de cliente — Vista 360 del cliente",
  "description": "Ficha del cliente con datos de contacto, oportunidades asociadas e historial de interacciones. Punto de enlace desde el Detalle de oportunidad.\n\n**Archivo:** `Ficha de cliente.dc.html`"
}
```

### Issue 9 — Panel (Marta · escritorio)
```json
{
  "team": "<TEAM>", "project": "TalentSalesAi", "assignee": "me", "state": "Done", "priority": 0,
  "title": "Panel — Dashboard de KPIs de la dueña",
  "description": "Dashboard de escritorio para Marta con KPIs del negocio y guardia de acceso por rol (un comercial ve 'Acceso restringido'). Layout con barra lateral reutilizable.\n\n**Archivo:** `Panel.dc.html` (preview: `?role=duena`)"
}
```

### Issue 10 — Supervisión del equipo
```json
{
  "team": "<TEAM>", "project": "TalentSalesAi", "assignee": "me", "state": "Done", "priority": 0,
  "title": "Supervisión — Vista de equipo de la dueña",
  "description": "Vista de supervisión solo para la dueña: resumen del equipo, comparativa de comerciales (barras proporcionales), y filtro por comercial que actualiza la lista de oportunidades. Permite abrir la ficha de cada comercial con su actividad.\n\n**Archivo:** `Supervisión.dc.html` (preview: `?role=duena`)"
}
```

---

## 4) Verificación final (opcional)

- `linear__list_issues` con `project: "TalentSalesAi"` → confirmar 10 issues, todas en *Done*.
- `linear__get_status_updates` con `type: "project"`, `project: "TalentSalesAi"` → confirmar el update publicado.

---

### Resumen del plan
1. `linear__save_project` → crea **TalentSalesAi**.
2. `linear__save_status_update` → publica cierre.
3. `linear__save_issue` ×10 → una por pantalla, en *Done*.
4. (opcional) verificación.

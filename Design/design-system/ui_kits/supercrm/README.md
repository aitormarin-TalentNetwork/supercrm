# UI Kit — SuperCRM

Recreación interactiva de la vista principal del CRM, compuesta **íntegramente con los componentes del Design System** (no reimplementa primitivas).

## Pantalla
- `index.html` — **Pipeline de ventas**: navegación lateral (`SidebarNav`), barra superior con búsqueda (`Input`) y acción principal (`Button`), fila de KPIs (`Card`), y dos vistas conmutables con `Tabs`:
  - **Tablero** — kanban con una `KanbanColumn` por etapa y tarjetas de trato (`Card` + `Avatar` + `StatusBadge`).
  - **Lista** — `Table` densa con etapa, riesgo y valor (mono).
  - **Nuevo trato** — `Dialog` con formulario (`Input`, select nativo).

## Interacciones
- Cambia de sección en el sidebar.
- Alterna Tablero / Lista en las pestañas.
- "Nuevo trato" abre el modal (cierra con Escape o clic fuera).

## Datos
Mock en memoria (`DEALS`, `STAGES`). Importes formateados en es-ES con `--font-mono`.

## Cómo se monta
Carga `../../styles.css` (tokens) y `../../_ds_bundle.js` (componentes compilados), resuelve el namespace del bundle y compone con Babel en el navegador. Los iconos son **Lucide** vía CDN.

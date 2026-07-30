# Handoff para Claude Code — Actualizar Notion (vía MCP)

> **Objetivo:** documentar en Notion el trabajo final del prototipo **SuperCRM — MVP**: crear una página principal del proyecto y una subpágina por cada pantalla construida (10).
>
> **Cómo usar este fichero:** pásaselo a Claude Code con el MCP de Notion conectado y pídele *"crea estas páginas en Notion"*. Indícale el **espacio / página padre** donde alojarlas.

---

## 0) Antes de empezar — confirmar

1. **Página o workspace padre** donde crear la página del proyecto: _<RELLENAR>_.
2. **Enlaces:** los prototipos viven en local (ficheros `*.dc.html`). Si hay URL de preview, sustituir las rutas por esa URL.

---

## 1) Página principal — "SuperCRM — Prototipo MVP"

**Título:** `SuperCRM — Prototipo MVP`

**Contenido (cuerpo de la página):**

```markdown
# SuperCRM — Prototipo MVP

Prototipo de alta fidelidad del MVP de **SuperCRM**, construido sobre el design system propio (tokens de color, tipografía, espaciado y 23 componentes).

## Dos roles, dos plataformas
- **Carlos (comercial)** → flujo **móvil**: Hoy, Pipeline, Detalle de oportunidad, Ficha de cliente, altas rápidas y registro de interacciones.
- **Marta (dueña)** → flujo **escritorio**: Panel de KPIs y Supervisión del equipo, con guardia de acceso por rol.

## Estado
✅ **MVP completado.** Las 10 pantallas/flujos están construidos y navegables de punta a punta. Cobertura total de las tareas imprescindibles de ambos roles. Navegación cruzada cerrada (Hoy ↔ Pipeline ↔ Detalle ↔ Ficha de cliente).

## Decisiones de diseño clave
- Mobile-first para el comercial; escritorio con barra lateral para la dueña.
- Guardia de acceso por rol en Panel y Supervisión (preview con `?role=duena`).
- Altas de cliente en línea dentro del selector (no modo paralelo).
- Estados cubiertos en cada pantalla: vacío, carga, error y validación.

## Siguiente paso sugerido
Revisión con usuarios reales y conexión a datos.

## Cómo previsualizar
- **Carlos (comercial):** iniciar en `Login.dc.html` con la cuenta de comercial → Hoy.
- **Marta (dueña):** iniciar en `Login.dc.html` con la cuenta de dueña → Panel. Vistas de dueña con `?role=duena`.
```

---

## 2) Subpáginas — una por pantalla (10)

Crear como **subpáginas** de la principal. Para cada una: título + cuerpo.

| # | Título | Archivo | Resumen |
|---|--------|---------|---------|
| 1 | UI Kit — Biblioteca de componentes | `UI Kit.dc.html` | Galería documentada de componentes del design system en 9 grupos, con anatomía, variantes y estados. |
| 2 | Login — Acceso responsive con rol | `Login.dc.html` | Acceso responsive, mostrar/ocultar contraseña, validación, carga y redirección por rol. Guarda sesión. |
| 3 | Hoy — Agenda diaria del comercial | `Hoy.dc.html` | Inicio móvil de Carlos: vencidos destacados, seguimientos de hoy, menú '+' (Oportunidad/Contacto/Actividad). |
| 4 | Pipeline — Tablero kanban | `Pipeline.dc.html` | Kanban de 5 etapas con drag & drop, total por columna y alta. Consciente del rol. |
| 5 | Detalle de oportunidad — Ficha de venta | `Detalle de oportunidad.dc.html` | Cabecera, cambio de etapa, timeline de actividad, acciones rápidas. Enlace a Ficha de cliente. |
| 6 | Alta rápida — Modal de creación | `Alta rápida.dc.html` | Modal con validación (oportunidad/contacto/actividad). Cliente nuevo en línea. |
| 7 | Registrar interacción — Modal de actividad | `Registrar interacción.dc.html` | Llamada/visita/email/nota con contexto automático y próximo seguimiento. |
| 8 | Ficha de cliente — Vista 360 | `Ficha de cliente.dc.html` | Datos de contacto, oportunidades e historial de interacciones. |
| 9 | Panel — Dashboard de KPIs | `Panel.dc.html` | Dashboard de escritorio de Marta con KPIs y guardia de rol. Preview `?role=duena`. |
| 10 | Supervisión — Vista de equipo | `Supervisión.dc.html` | Resumen del equipo, comparativa de comerciales y filtro por comercial. Preview `?role=duena`. |

> Para el cuerpo de cada subpágina, usar el "Resumen" como párrafo y añadir una línea **Archivo:** con el nombre del fichero (o la URL de preview).

---

### Resumen del plan
1. Crear página principal **SuperCRM — Prototipo MVP** con el contenido del paso 1.
2. Crear 10 subpáginas (paso 2), una por pantalla.

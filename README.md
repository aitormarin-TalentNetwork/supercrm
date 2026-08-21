# SuperCRM

CRM de ventas para pequeños negocios. Proyecto del curso **VibeCoding**.

Esta carpeta es **el proyecto entero**: aquí vive la documentación, el diseño y (a partir de ahora) el código de la aplicación Next.js.

> **Regla de oro:** abrir SIEMPRE la terminal desde esta carpeta. Todo lo del proyecto está aquí dentro.

---

## Estado

| Bloque | Estado |
|---|---|
| PRD (Notion) | 🟢 Cerrado — no se modifica |
| Diseño (Fase 0) | 🟢 Hecho — 10 pantallas + design system |
| **MVP (Fases 1–6)** | 🟢 **Hecho** — las 7 fases (AIT-5 a AIT-28) en Done. Desplegado en Railway. |
| Post-MVP | 🟡 En curso — catálogo/presupuestos, recompra, multi-tienda (backend), facturación (ciclo manual), prioridad, navegación/ajustes y gestión de usuarios ya Done. Quedan en Backlog: registro automático WhatsApp/email/teléfono (AIT-32, aparcado a propósito), PDF de presupuesto (AIT-53), varias versiones de presupuesto (AIT-54), integración de facturación externa (AIT-55), comparativa entre tiendas en el Panel (AIT-56), notificaciones push reales (AIT-57) y listado de clientes (AIT-58). |

Leyenda: 🟢 hecho · 🟡 en curso · ⚪ sin empezar · 🔴 atascada (solo si hay un problema).

Fuente de verdad del estado real: Linear (equipo **VibeCoding Academy**, proyectos **SuperCRM — MVP** y **SuperCRM — Post-MVP**). Esta tabla es un resumen, no la referencia — puede ir un paso por detrás.

---

## Dónde está cada cosa

| Qué | Dónde | Para qué |
|---|---|---|
| **PRD** (qué construimos y por qué) | Notion → [CRM · PRD](https://app.notion.com/p/3882e4a27d38805d9548fc1953f31d3a) | Fuente de verdad del **producto**. Cerrado: no se toca. |
| **Mejoras posteriores** | Notion → "CRM — Mejoras del Sistema" | Ideas y mejoras que NO entran en el PRD. |
| **Tareas del desarrollo** | Linear → equipo **VibeCoding Academy (AIT)**, proyecto **SuperCRM — MVP** | Fuente de verdad del **desarrollo**. Qué se hace ahora. |
| **Fuera del MVP** | Linear → proyecto **SuperCRM — Post-MVP** | Lo del PRD que queda para después. |
| **Diseño** | [`Design/`](Design/) | Design system, 10 pantallas en HTML y referencias de estilo. |
| **Documentación técnica** | [`docs/`](docs/) | Arquitectura, modelo de datos y setup. |
| **Código** | raíz de esta carpeta (`app/`, `convex/`, `components/`…) | La app Next.js. Cómo levantarla → [`docs/03-setup.md`](docs/03-setup.md). |
| **Backend** | [Convex · proyecto `vibecrm`](https://dashboard.convex.dev/t/aitor-marin-6a254/vibecrm/third-goldfinch-805/data) | Tablas, datos y logs. Deployment de desarrollo: `third-goldfinch-805`. |

## Documentación

1. [`docs/01-arquitectura.md`](docs/01-arquitectura.md) — stack, estructura de carpetas, roles y permisos.
2. [`docs/02-modelo-de-datos.md`](docs/02-modelo-de-datos.md) — las 7 entidades y el schema de Convex.
3. [`docs/03-setup.md`](docs/03-setup.md) — cómo se levanta el proyecto desde cero.

Y [`CLAUDE.md`](CLAUDE.md): las reglas que sigue la IA al trabajar en este repo. Léelo tú también, es el resumen más corto del proyecto.

---

## El MVP en una frase

Que el negocio organice sus ventas y **no pierda ninguna por falta de seguimiento**, en **web responsive**. El MVP se construyó para **una sola tienda**; Post-MVP (AIT-31) ya añadió soporte multi-tienda en el backend.

Dos usuarios: **Marta** (dueña — quiere visión y control) y **Carlos** (vendedor — quiere saber a quién llamar hoy).

Las 7 fases del MVP están Done en Linear (Fase 0 · Diseño → Fase 6 · Cierre). El curso marcó el ritmo mientras se construía; hoy el desarrollo sigue en Post-MVP.

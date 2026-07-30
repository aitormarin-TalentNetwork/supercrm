# CLAUDE.md — reglas del proyecto SuperCRM

Instrucciones para cualquier IA (Claude Code y compañía) que trabaje en este repositorio.

## Qué es esto

**SuperCRM**: CRM de ventas para pequeños negocios. Proyecto del curso VibeCoding.
**MVP:** web responsive, **una sola tienda**. Objetivo: que ninguna venta se pierda por falta de seguimiento.
**Usuarios:** Marta (dueña, rol `owner`) y Carlos (vendedor, rol `sales`).

## Las tres fuentes de verdad (en este orden)

1. **PRD** (Notion, "CRM · PRD") — el **producto**: qué se construye y por qué. Está **CERRADO: no se modifica nunca**. Si algo lo contradice, gana el PRD.
2. **Linear** (equipo AIT "VibeCoding Academy", proyecto "SuperCRM — MVP") — el **desarrollo**: qué se hace ahora y en qué orden. Las fases 1–6 y sus issues.
3. **`docs/`** — las **decisiones técnicas** derivadas de los dos anteriores (arquitectura, modelo de datos, setup).

Lo que no esté en ninguno de los tres, **se pregunta**. No se inventa alcance.

## Reglas duras

- **El ritmo lo marca Aitor**, siguiendo el curso vídeo a vídeo. **No adelantarse**: no empezar fases futuras, no crear features que nadie ha pedido, no imponer roadmap. Recomendar solo si lo pide.
- **Alcance MVP estricto.** Fuera del MVP (y por tanto fuera del código, aunque el PRD los mencione): catálogo de productos, PDF de presupuesto, facturación y cobros, recompra automática, multi-tienda, app móvil nativa, registro automático desde WhatsApp/email. Están en el proyecto Linear **Post-MVP**.
- **Linear solo con el MCP `linear-aitor`.** NUNCA con el conector compartido de empresa (`mcp__claude_ai_Linear__*` → `talent-engine`, es de Raúl / producción).
- **Notion solo en "Aitor Marin's Space"** (MCP local `notion`).
- **Semáforo de estado** en todo (Notion y Linear): 🟢 hecho · 🟡 en curso · ⚪ sin empezar · 🔴 **atascada** (rojo SOLO si hay un problema; "sin empezar" nunca es rojo).
- **Idioma:** documentación, issues y comentarios **en español**. El **código en inglés** (nombres de variables, funciones, tablas, campos).

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**.
- **Convex** como backend: base de datos, queries/mutations y tiempo real. **No hay API REST propia** ni ORM: los datos se leen con `useQuery` y se escriben con `useMutation`.
- Detalles y estructura de carpetas: [`docs/01-arquitectura.md`](docs/01-arquitectura.md).
- Modelo de datos y schema: [`docs/02-modelo-de-datos.md`](docs/02-modelo-de-datos.md).

## Diseño

El diseño **ya está hecho** (Fase 0 completa). **No inventes UI nueva**: parte de lo que hay en `Design/`.

- `Design/design-system/` — tokens, `styles.css`, componentes React de referencia (Button, Card, StatusBadge, Kanban, Table, Dialog, Input, Toast…), guidelines y `SKILL.md`.
- `Design/pantallas/` — las 10 pantallas del MVP en HTML de alta fidelidad (`Login`, `Hoy`, `Panel`, `Pipeline`, `Detalle de oportunidad`, `Ficha de cliente`, `Alta rápida`, `Registrar interacción`, `Supervisión`, `UI Kit`) + screenshots.
- `Design/referencias/` — análisis de estilo (Figma, Meta, IBM).

Al implementar una pantalla: abre su `.dc.html`, replica estructura y tokens, y usa los componentes del design system. Los tokens mandan sobre cualquier valor suelto (nada de colores o tamaños a ojo).

## Cómo se trabaja una tarea

1. Coge la issue de Linear (proyecto SuperCRM — MVP, fase que toque) y ponla 🟡 In Progress.
2. Lee la pantalla correspondiente en `Design/pantallas/` y la entidad en `docs/02-modelo-de-datos.md`.
3. Implementa: schema/función Convex primero, luego la UI.
4. Comprueba que funciona de verdad en el navegador (no solo que compila).
5. Marca la issue 🟢 Done y, si cambió una decisión técnica, actualiza el doc de `docs/` correspondiente **en el mismo cambio**.

## Convenciones de código

- Componentes en `components/`, uno por archivo, PascalCase.
- Funciones de Convex en `convex/<entidad>.ts` (`convex/opportunities.ts`, `convex/customers.ts`…).
- Server Components por defecto; `"use client"` solo donde haya interacción o hooks de Convex.
- Nada de datos mock ni `TODO` silenciosos: si algo falta, se dice.
- Sin comentarios que expliquen lo obvio; solo los que expliquen una restricción real.

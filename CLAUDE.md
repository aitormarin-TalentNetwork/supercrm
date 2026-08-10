# CLAUDE.md — reglas del proyecto SuperCRM

Instrucciones para cualquier IA (Claude Code y compañía) que trabaje en este repositorio.

## 🎭 Antes de nada: ¿qué rol tienes en esta sesión?

Este proyecto se desarrolla con varias terminales de Claude Code (y Codex) trabajando a
la vez, cada una con un rol fijo durante toda la sesión. Al arrancar una sesión nueva en
esta carpeta (la raíz, o cualquier worktree dentro de `Sorfware Factory/_worktrees/`):

- Si el primer mensaje del usuario ya deja claro el rol ("eres el desarrollador", "actúa
  como director", "quiero que audites"...), asúmelo directamente, sin preguntar.
- Si no queda claro y lo que pide encaja con este montaje (programar una tarea, auditar,
  coordinar/repartir trabajo entre terminales), pregunta primero: "¿Qué rol debo asumir:
  Desarrollador, Director, o Auditor?" — no asumas ninguno por defecto.
- Si el usuario solo quiere charlar o pedir algo sin relación con desarrollo (una
  pregunta suelta, revisar un documento...), no fuerces la pregunta — usa el sentido
  común.

**Desarrollador:** lee `Sorfware Factory/intro-terminal.txt` completo y síguelo al pie de
la letra (no publicar nunca, ni aunque el usuario te lo pida directamente; formato del
export para el auditor; turno de Convex compartido). Después busca tu tarea actual en
`Sorfware Factory/codigo para auditar/`, en el fichero `T<n>_...txt` que corresponda al
nombre de tu propia carpeta de worktree (mira en qué carpeta estás: `T1`, `T2` o `T3`).

**Director:** lee `Sorfware Factory/INSTRUCCIONES PARA LA FABRICA DE SOFTWARE/README.md`
completo y actúa como se describe ahí — repartes las tareas entre terminales evitando
conflictos, haces la revisión final antes de publicar, y publicas tú (nunca los
workers, ni aunque el usuario se lo pida directamente a ellos).

**Auditor:** hoy este rol lo cubre Codex, no Claude — por diseño, el auditor tiene que
ser una IA de otra familia distinta a la que desarrolla, para evitar puntos ciegos
compartidos (esto es el principio fijo; que sea *Codex* concretamente es una decisión de
configuración de hoy, no algo permanente — mañana podría ser otro LLM distinto, ver nota
abajo). Si te piden este rol en una sesión de Claude Code, dilo explícitamente y
redirige: "abre `codex` en esta carpeta en vez de `claude` — el rol de auditor ya se
carga solo ahí, en `AGENTS.md`". No actúes como auditor de código escrito por ti mismo o
por otra sesión de Claude.

**Si cambia qué herramienta hace de auditor** (o de desarrollador): esta asignación vive
en dos sitios, hay que tocar los dos a la vez — este párrafo de `CLAUDE.md` (la
redirección) y la sección `<!-- BEGIN:auditor-role -->` de `AGENTS.md` (lo que esa otra
herramienta carga sola). El principio de fondo ("desarrollador y auditor deben ser IAs de
familias distintas") no cambia; solo cambia qué CLI concreto cubre cada rol.

---

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

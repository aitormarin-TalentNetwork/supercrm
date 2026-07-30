# SuperCRM — Design System

Design system del producto **SuperCRM**, un CRM de ventas simple para pequeños negocios (autónomos, comercios, agencias). Su promesa: **que el negocio no pierda ventas por falta de seguimiento**. Profesional y fiable, pero cercano y fácil; valor desde el primer día, sin formación.

- **Plataforma:** web responsive única (mobile-first + escritorio). **Modo claro.** Accesibilidad **AA**. Objetivos táctiles ≥ 44px.
- **Usuarios:** Marta (dueña/directora, escritorio, busca control y visión) y Carlos (vendedor, móvil, quiere rapidez).
- **Fuentes de este sistema:** decisiones definidas a medida (sin codebase ni Figma de origen). El documento de handoff legible para IA/devs está en `design.md` (raíz). La guía visual navegable es la DC `SuperCRM Fundamentos.dc.html`.

---

## CONTENT FUNDAMENTALS — voz y tono

- **Idioma:** español de España. Tuteo cercano y directo ("No pierdas ventas", "Tu pipeline de hoy").
- **Tono:** claro, útil y tranquilo. Profesional sin tecnicismos; del lado del pequeño negocio.
- **Casing:** Sentence case en títulos, botones y etiquetas ("Nuevo trato", no "Nuevo Trato"). MAYÚSCULAS solo en overlines de sección con `letter-spacing`.
- **Acciones:** verbos en infinitivo concretos ("Guardar trato", "Crear contacto", "Filtrar"). Una acción principal por pantalla.
- **Números:** formato es-ES (`€12.400`, `27/06/2026`, `+18,4%`) y siempre en tipografía monoespaciada.
- **Estados vacíos:** amables y accionables ("Aún no hay contactos — Añade tu primer cliente para empezar a seguir ventas").
- **Emoji:** no se usan en la interfaz.

## VISUAL FOUNDATIONS

- **Color:** neutros *slate* (fríos, no gélidos) como estructura; **azul `#2563EB`** primario (control/confianza) y **teal `#0D9488`** secundario (cercanía). Semánticos verde/ámbar/rojo/azul. Capa propia de CRM para pipeline, riesgo y estados de presupuesto/tarea. Acento de marca con un toque de violeta `#6366F1` en el degradado del logo. Todo cumple contraste AA.
- **Tipografía:** `Plus Jakarta Sans` para UI (geométrica, legible, amable) e `IBM Plex Mono` para importes, IDs y fechas (tabular). Escala display(44/800) → H1(32) → H2(26) → H3(20) → body(16) → sm(14) → caption(13) → overline(12).
- **Espaciado:** base 4 (saltos de 8 desde 16). Ritmo vertical predecible y denso (enterprise).
- **Forma:** radios suaves — `sm 6 / md 8 / lg 12 / xl 16 / pill`. Tarjetas con `radius-lg`, borde `--color-border` y sombra `e1`.
- **Elevación:** 3 niveles — `e1` superficies, `e2` menús/popovers, `e3` modales — más `--focus-ring` azul (foco siempre visible).
- **Fondos:** planos. App sobre `--color-bg` (#F8FAFC), superficies en blanco. Sin texturas ni patrones. Único uso de degradado: el degradado azul→violeta del **logo** y el glow del hero de la guía (decorativo, no en producto).
- **Bordes:** 1px `--color-border` (#E2E8F0); divisores marcados con `--color-border-strong`.
- **Animación:** discreta. Transiciones de 120–180ms en hover/foco/elevación; sin rebotes. Modales aparecen sin desplazamientos llamativos.
- **Hover/press:** botones oscurecen el fondo (hover→active con los tokens `-hover`/`-active`); filas de tabla a `--color-neutral-100`; cards interactivas suben de `e1` a `e2`.
- **Layout:** mobile-first. Rejilla 4/8/12 col (móvil/tablet/escritorio), contenedor máx 1200px. Sidebar fija en escritorio; se colapsa en móvil.
- **Imágenes:** el producto es casi sin imágenes; protagonismo del dato. Los avatares usan iniciales con color estable derivado del nombre.

## ICONOGRAPHY

- **Set:** [Lucide](https://lucide.dev) (open-source, CDN). Sustitución deliberada por falta de set propio — **flag**: si SuperCRM define iconos propios, reemplazar.
- **Estilo:** trazo `1.75px` (1.5px a 16px), esquinas redondeadas, sin relleno, `currentColor`. Tamaños 20px (denso) y 24px (estándar).
- **Uso en código:** `<i data-lucide="nombre"></i>` + `lucide.createIcons()`. En componentes se pasan como `ReactNode` (`leftIcon`, `icon`, children de `IconButton`).
- **Iconos base:** users, phone, mail, calendar, trending-up, search, plus, filter, check-circle-2, bell, file-text, settings, layout-dashboard, columns-3, list, alert-triangle, info, check, euro, more-horizontal, pencil, trash-2, arrow-right.
- **Emoji / unicode como iconos:** no se usan.

---

## ÍNDICE / MANIFIESTO

**Raíz**
- `styles.css` — punto de entrada global (solo `@import`). Los consumidores enlazan este archivo.
- `design.md` — guía + tokens en prosa, lista para handoff a IA/devs.
- `SuperCRM Fundamentos.dc.html` — guía visual navegable de los fundamentos.
- `SKILL.md` — skill descargable (Claude Code / Agent Skills).

**`tokens/`** — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `shape.css`, `layout.css`.

**`components/`** (React, `<Name>.jsx` + `.d.ts` + `.prompt.md`; una card por carpeta)
- `core/` — Button, IconButton, Badge, **StatusBadge** (pipeline/quote/task/risk), Avatar, Card.
- `forms/` — Input, Textarea, Select, Checkbox, Radio, Switch.
- `feedback/` — Dialog, Toast, Tooltip, EmptyState, ProgressBar.
- `data/` — Table, Pagination, KanbanColumn.
- `navigation/` — Tabs, Breadcrumb, SidebarNav.

**`guidelines/`** — specimen cards (Colors, Type, Spacing, Brand) que pueblan la pestaña Design System.

**`ui_kits/supercrm/`** — recreación interactiva del **Pipeline** (sidebar, KPIs, kanban/tabla conmutables, modal de nuevo trato).

---

## Cómo consumir

```html
<link rel="stylesheet" href="styles.css">
```
Luego usa los tokens (`var(--color-primary)`, `var(--space-4)`…) y los componentes del bundle. Regla de oro: **consumir tokens, nunca hex sueltos.**

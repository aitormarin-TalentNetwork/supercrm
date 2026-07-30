# SuperCRM — Design System (Fundamentos v1.0)

> Guía de estilo y tokens para construir el MVP de **SuperCRM**.
> Cualquier persona o IA debe poder construir componentes y pantallas coherentes y profesionales **sin tomar nuevas decisiones de estilo**: consume siempre estos tokens, nunca valores sueltos.

---

## 1. Producto y contexto

**SuperCRM** es un CRM de ventas simple para pequeños negocios (autónomos, comercios, agencias).
**Promesa:** que el negocio no pierda ventas por falta de seguimiento.
**Tono:** profesional y fiable, pero cercano y fácil. Valor desde el primer día, sin formación.

**Usuarios:**
- **Marta** (dueña/directora) — escritorio, ratos cortos, busca control y visión global.
- **Carlos** (vendedor) — móvil, en movimiento, quiere rapidez y pocos toques.

**Plataforma:** web responsive única, **mobile-first** + escritorio. **Modo claro.** Objetivos táctiles grandes. **Accesibilidad AA.**

---

## 2. Dirección creativa

**Principal — "Confianza clara":** azul confianza sobre neutros slate y mucho blanco. Fiabilidad enterprise sin frialdad, jerarquía nítida para vistas densas de datos, con pops de color cálidos/frescos que aportan cercanía y un aire moderno.

*Alternativa — "Cercanía teal":* misma base neutra subiendo el teal a co-protagonista; más humana, recomendada si se busca diferenciarse del "azul CRM" genérico.

---

## 3. Principios de diseño

1. **Claridad primero** — la información manda, no la decoración. Jerarquía, contraste y espacio antes que adornos.
2. **Rapidez sin fricción** — acciones clave a un toque; valor desde el primer día, sin formación.
3. **Confianza tranquila** — consistencia y orden generan seguridad. Nada sorprende, todo se entiende.
4. **Accesible por defecto** — contraste AA, objetivos táctiles de 44px, foco visible.
5. **Cercano, no frío** — humano en color y lenguaje. Profesional, pero del lado del pequeño negocio.

---

## 4. Color

Todos los pares texto/fondo cumplen contraste **AA**. Usa siempre el token, no el hex literal.

### 4.1 Marca y acción

| Token | Hex | Uso |
|---|---|---|
| `--color-primary` | `#2563EB` | Botón principal, enlaces, foco, selección activa |
| `--color-primary-hover` | `#1D4ED8` | Hover del primario |
| `--color-primary-active` | `#1E40AF` | Estado pulsado/activo |
| `--color-primary-subtle` | `#EFF4FF` | Fondos y chips de selección |
| `--color-on-primary` | `#FFFFFF` | Texto/icono sobre primario |
| `--color-secondary` | `#0D9488` | Acción secundaria, acentos, gráficos |
| `--color-secondary-hover` | `#0F766E` | Hover del secundario |
| `--color-secondary-active` | `#115E59` | Estado pulsado/activo |
| `--color-secondary-subtle` | `#ECFDF5` | Fondos sutiles del secundario |
| `--color-on-secondary` | `#FFFFFF` | Texto/icono sobre secundario |

### 4.2 Neutros (slate)

| Token | Hex | Uso |
|---|---|---|
| `--color-bg` / `--color-neutral-50` | `#F8FAFC` | Fondo de la app |
| `--color-surface` | `#FFFFFF` | Tarjetas, paneles, superficies |
| `--color-neutral-100` | `#F1F5F9` | Hover de fila, fondos sutiles |
| `--color-neutral-200` | `#E2E8F0` | Bordes y separadores |
| `--color-neutral-300` | `#CBD5E1` | Borde fuerte, divisores marcados |
| `--color-neutral-400` | `#94A3B8` | Iconos inactivos, placeholders |
| `--color-neutral-500` | `#64748B` | Texto atenuado / metadatos |
| `--color-neutral-600` | `#475569` | Texto secundario |
| `--color-neutral-700` | `#334155` | Texto fuerte sobre claro |
| `--color-neutral-800` | `#1E293B` | Superficies oscuras |
| `--color-neutral-900` | `#0F172A` | Texto principal y títulos |
| `--color-neutral-950` | `#020617` | Máximo contraste |

**Texto y borde:** `--color-text:#0F172A` · `--color-text-secondary:#475569` · `--color-text-muted:#64748B` · `--color-text-inverse:#FFFFFF` · `--color-border:#E2E8F0` · `--color-border-strong:#CBD5E1`.

### 4.3 Semánticos (feedback)

| Token | Hex | Subtle | Uso |
|---|---|---|---|
| `--color-success` | `#16A34A` | `#DCFCE7` | Venta ganada, guardado OK |
| `--color-warning` | `#D97706` | `#FEF3C7` | Vence pronto, requiere atención |
| `--color-error` | `#DC2626` | `#FEE2E2` | Fallo, perdido, dato inválido |
| `--color-info` | `#0284C7` | `#E0F2FE` | Notas, consejos, neutro informativo |

### 4.4 Etapas del pipeline

Secuencia frío → cálido → verde que refuerza el avance del trato; "perdido" en rojo como única salida negativa. Cada etapa: punto de color sólido + chip con su versión *subtle*.

| Etapa | Token | Hex | Chip (bg / texto) |
|---|---|---|---|
| Nuevo | `--pipeline-nuevo` | `#64748B` | `#F1F5F9` / `#475569` |
| Contactado | `--pipeline-contactado` | `#0891B2` | `#ECFEFF` / `#0E7490` |
| Propuesta | `--pipeline-propuesta` | `#6366F1` | `#EEF2FF` / `#4F46E5` |
| Negociación | `--pipeline-negociacion` | `#D97706` | `#FEF3C7` / `#B45309` |
| Ganado | `--pipeline-ganado` | `#16A34A` | `#DCFCE7` / `#15803D` |
| Perdido | `--pipeline-perdido` | `#DC2626` | `#FEE2E2` / `#B91C1C` |

### 4.5 Indicador de riesgo

| Nivel | Token | Hex | Significado |
|---|---|---|---|
| Bajo | `--risk-low` | `#16A34A` | Al día |
| Medio | `--risk-medium` | `#D97706` | Sin seguimiento 3–7 días |
| Alto | `--risk-high` | `#DC2626` | En peligro de perderse |

### 4.6 Estado de presupuesto

| Estado | Token | Hex | Chip (bg / texto) |
|---|---|---|---|
| Borrador | `--quote-borrador` | `#64748B` | `#F1F5F9` / `#475569` |
| Enviado | `--quote-enviado` | `#0284C7` | `#E0F2FE` / `#0369A1` |
| Aceptado | `--quote-aceptado` | `#16A34A` | `#DCFCE7` / `#15803D` |
| Rechazado | `--quote-rechazado` | `#DC2626` | `#FEE2E2` / `#B91C1C` |
| Vencido | `--quote-vencido` | `#D97706` | `#FEF3C7` / `#B45309` |

### 4.7 Estado de tarea

| Estado | Token | Hex | Chip (bg / texto) |
|---|---|---|---|
| Pendiente | `--task-pendiente` | `#64748B` | `#F1F5F9` / `#475569` |
| En curso | `--task-encurso` | `#2563EB` | `#EFF4FF` / `#1D4ED8` |
| Hecha | `--task-hecha` | `#16A34A` | `#DCFCE7` / `#15803D` |
| Vencida | `--task-vencida` | `#DC2626` | `#FEE2E2` / `#B91C1C` |

---

## 5. Tipografía

**UI:** `Plus Jakarta Sans` (Google Font) — geométrica, legible, con un punto amable.
**Datos:** `IBM Plex Mono` para importes, IDs y fechas (alineación tabular evita errores de lectura).

| Rol | Tamaño | Line-height | Peso | Uso |
|---|---|---|---|---|
| Display | 44px / `2.75rem` | 1.1 | 800 | Héroes, pantallas vacías destacadas |
| H1 | 32px / `2rem` | 1.15 | 700 | Título de página |
| H2 | 26px / `1.625rem` | 1.2 | 600 | Sección |
| H3 | 20px / `1.25rem` | 1.3 | 600 | Subsección, título de tarjeta |
| Body LG | 18px / `1.125rem` | 1.5 | 400 | Intro, texto destacado |
| Body | 16px / `1rem` | 1.5 | 400 | Texto base de la interfaz |
| Body SM | 14px / `0.875rem` | 1.45 | 400 | Apoyo, celdas de tabla densas |
| Caption | 13px / `0.8125rem` | 1.4 | 500 | Metadatos, marcas de tiempo |
| Overline | 12px / `0.75rem` | 1.3 | 600 | Etiquetas (UPPERCASE, `letter-spacing:0.08em`) |

> Importes, IDs y fechas siempre en `--font-mono` con `font-variant-numeric: tabular-nums`.

---

## 6. Espaciado y forma

**Escala de espaciado (base 4):**

| Token | px |
|---|---|
| `--space-1` | 4 |
| `--space-2` | 8 |
| `--space-3` | 12 |
| `--space-4` | 16 |
| `--space-5` | 20 |
| `--space-6` | 24 |
| `--space-8` | 32 |
| `--space-10` | 40 |
| `--space-12` | 48 |
| `--space-16` | 64 |
| `--space-20` | 80 |

**Radios:** `--radius-sm:6px` (chips, inputs pequeños) · `--radius-md:8px` (botones, inputs) · `--radius-lg:12px` (tarjetas) · `--radius-xl:16px` (paneles, modales) · `--radius-pill:999px` (badges, avatares).

**Elevación:**
- `--shadow-e1` `0 1px 2px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.10)` — tarjetas y superficies en reposo.
- `--shadow-e2` `0 4px 12px rgba(15,23,42,.10)` — menús, dropdowns, popovers.
- `--shadow-e3` `0 12px 32px rgba(15,23,42,.16)` — modales y diálogos.
- `--focus-ring` `0 0 0 3px rgba(37,99,235,.35)` — anillo de foco visible (obligatorio en todo control interactivo).

---

## 7. Responsive y rejilla

Mobile-first: diseña a una columna y expande.

| Breakpoint | Token | Rango | Rejilla | Gutter | Margen |
|---|---|---|---|---|---|
| Móvil | `--bp-sm` 640px | < 640 | 4 col | 16 | 16 |
| Tablet | `--bp-md` 768px / `--bp-lg` 1024px | 640–1024 | 8 col | 24 | 24 |
| Escritorio | `--bp-xl` 1280px | ≥ 1024 | 12 col | 24 | auto |

- Contenedor máximo: `--container-max: 1200px`.
- Objetivo táctil mínimo: `--tap-min: 44px` (alto/área de todo control accionable).
- Móvil: navegación inferior o acción flotante; escritorio: sidebar fija.

---

## 8. Iconografía

**Set:** [Lucide](https://lucide.dev) (open-source).
**Estilo:** trazo `1.75px` (1.5px a 16px), esquinas redondeadas, sin relleno, `color` heredado del texto (`currentColor`).
**Tamaños:** 20px (denso/tablas) · 24px (estándar).
**Iconos base:** `users, phone, mail, calendar, trending-up, search, plus, filter, check-circle-2, bell, file-text, settings, smartphone, tablet, monitor, zap, eye, shield-check, accessibility, heart-handshake, alert-triangle, info, x, check, clipboard`.

---

## 9. Reglas de uso (para construir componentes)

- **Un solo color de acción primario por vista.** El `--color-primary` se reserva para la acción principal; lo demás es secundario/neutro.
- **Estados:** todo control interactivo define reposo, hover, active, focus (`--focus-ring`) y disabled (`opacity:.5`, sin sombra).
- **Botones:** alto ≥ 44px en móvil; `--radius-md`; primario relleno, secundario `outline` (borde `--color-border-strong`), terciario `ghost` (texto primario, fondo transparente).
- **Inputs:** borde `--color-border`, fondo `--color-surface`, foco con `--focus-ring`, error con `--color-error` + texto de ayuda.
- **Badges/estado:** usa siempre la pareja *color sólido + fondo subtle* definida en §4.4–4.7; nunca inventes combinaciones.
- **Tablas (vistas densas):** fila 44–48px, hover `--color-neutral-100`, cabecera en Overline `--color-neutral-500`, importes alineados a la derecha en `--font-mono`.
- **Tarjetas:** `--color-surface`, `--radius-lg`, `--shadow-e1`, padding `--space-6`.
- **Jerarquía:** títulos `--color-text`, apoyo `--color-text-secondary`, metadatos `--color-text-muted`.
- **Accesibilidad:** contraste AA, foco siempre visible, no comunicar estado solo por color (añade icono/texto).

---

## 10. Tokens — variables CSS

Pega este bloque como fuente única de verdad y referencia los tokens desde todos los componentes.

```css
:root {
  /* ── Marca y acción ── */
  --color-primary:#2563EB;
  --color-primary-hover:#1D4ED8;
  --color-primary-active:#1E40AF;
  --color-primary-subtle:#EFF4FF;
  --color-on-primary:#FFFFFF;
  --color-secondary:#0D9488;
  --color-secondary-hover:#0F766E;
  --color-secondary-active:#115E59;
  --color-secondary-subtle:#ECFDF5;
  --color-on-secondary:#FFFFFF;

  /* ── Neutros (slate) ── */
  --color-bg:#F8FAFC;
  --color-surface:#FFFFFF;
  --color-neutral-50:#F8FAFC;
  --color-neutral-100:#F1F5F9;
  --color-neutral-200:#E2E8F0;
  --color-neutral-300:#CBD5E1;
  --color-neutral-400:#94A3B8;
  --color-neutral-500:#64748B;
  --color-neutral-600:#475569;
  --color-neutral-700:#334155;
  --color-neutral-800:#1E293B;
  --color-neutral-900:#0F172A;
  --color-neutral-950:#020617;

  /* ── Texto y borde ── */
  --color-text:#0F172A;
  --color-text-secondary:#475569;
  --color-text-muted:#64748B;
  --color-text-inverse:#FFFFFF;
  --color-border:#E2E8F0;
  --color-border-strong:#CBD5E1;

  /* ── Semánticos (feedback) ── */
  --color-success:#16A34A;  --color-success-subtle:#DCFCE7;
  --color-warning:#D97706;  --color-warning-subtle:#FEF3C7;
  --color-error:#DC2626;    --color-error-subtle:#FEE2E2;
  --color-info:#0284C7;     --color-info-subtle:#E0F2FE;

  /* ── Pipeline (etapas del trato) ── */
  --pipeline-nuevo:#64748B;
  --pipeline-contactado:#0891B2;
  --pipeline-propuesta:#6366F1;
  --pipeline-negociacion:#D97706;
  --pipeline-ganado:#16A34A;
  --pipeline-perdido:#DC2626;

  /* ── Riesgo ── */
  --risk-low:#16A34A;
  --risk-medium:#D97706;
  --risk-high:#DC2626;

  /* ── Estado de presupuesto ── */
  --quote-borrador:#64748B;
  --quote-enviado:#0284C7;
  --quote-aceptado:#16A34A;
  --quote-rechazado:#DC2626;
  --quote-vencido:#D97706;

  /* ── Estado de tarea ── */
  --task-pendiente:#64748B;
  --task-encurso:#2563EB;
  --task-hecha:#16A34A;
  --task-vencida:#DC2626;

  /* ── Tipografía ── */
  --font-sans:'Plus Jakarta Sans', system-ui, sans-serif;
  --font-mono:'IBM Plex Mono', ui-monospace, monospace;
  --text-display:2.75rem;   /* 44px / 1.1  / 800 */
  --text-h1:2rem;           /* 32px / 1.15 / 700 */
  --text-h2:1.625rem;       /* 26px / 1.2  / 600 */
  --text-h3:1.25rem;        /* 20px / 1.3  / 600 */
  --text-body-lg:1.125rem;  /* 18px / 1.5  / 400 */
  --text-body:1rem;         /* 16px / 1.5  / 400 */
  --text-body-sm:0.875rem;  /* 14px / 1.45 / 400 */
  --text-caption:0.8125rem; /* 13px / 1.4  / 500 */
  --text-overline:0.75rem;  /* 12px / 1.3  / 600 */
  --leading-tight:1.15;  --leading-snug:1.3;  --leading-normal:1.5;
  --weight-regular:400;  --weight-medium:500;
  --weight-semibold:600; --weight-bold:700;  --weight-extrabold:800;

  /* ── Espaciado (base 4) ── */
  --space-1:4px;   --space-2:8px;   --space-3:12px;  --space-4:16px;
  --space-5:20px;  --space-6:24px;  --space-8:32px;  --space-10:40px;
  --space-12:48px; --space-16:64px; --space-20:80px;

  /* ── Forma ── */
  --radius-sm:6px;  --radius-md:8px;  --radius-lg:12px;
  --radius-xl:16px; --radius-pill:999px;

  /* ── Elevación ── */
  --shadow-e1:0 1px 2px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.10);
  --shadow-e2:0 4px 12px rgba(15,23,42,.10);
  --shadow-e3:0 12px 32px rgba(15,23,42,.16);
  --focus-ring:0 0 0 3px rgba(37,99,235,.35);

  /* ── Layout ── */
  --bp-sm:640px;  --bp-md:768px;  --bp-lg:1024px;  --bp-xl:1280px;
  --container-max:1200px;
  --tap-min:44px;
}
```

### Fuentes (HTML `<head>`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<!-- Iconos -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
```

---

## 11. Criterio de éxito

Con este documento, cualquier desarrollador o IA puede construir los componentes (botones, inputs, tablas, badges, pipeline/kanban, ficha de cliente, formularios, filtros) y las pantallas del MVP de forma coherente, profesional y accesible — **consumiendo tokens, sin nuevas decisiones de estilo.**

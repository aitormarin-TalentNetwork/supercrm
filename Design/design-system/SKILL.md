---
name: supercrm-design
description: Use this skill to generate well-branded interfaces and assets for SuperCRM (a simple sales CRM for small businesses), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, tokens, and UI kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files (`design.md` for the full token reference, `tokens/` for the CSS variables, `components/` for the React primitives, `guidelines/` for foundation specimens, and `ui_kits/supercrm/` for a full-screen recreation).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view, linking `styles.css` and using the design tokens. If working on production code, copy assets and read the rules here to become an expert in designing with this brand.

Core rules to honor:
- Consume tokens (`var(--color-primary)`, `var(--space-4)`, …), never raw hex values.
- One primary action per view; primary = `--color-primary` (#2563EB), secondary = teal `--color-secondary` (#0D9488).
- Type: Plus Jakarta Sans (UI) + IBM Plex Mono (importes, IDs, fechas).
- Light mode only, AA contrast, 44px touch targets, mobile-first.
- Spanish (es-ES), tuteo cercano, Sentence case, no emoji in UI.
- CRM state colors come from `StatusBadge` (pipeline / quote / task / risk) — don't invent combinations.

If the user invokes this skill without other guidance, ask what they want to build or design, ask a few questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

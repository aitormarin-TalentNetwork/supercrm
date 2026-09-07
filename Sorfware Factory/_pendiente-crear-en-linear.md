# Pendiente de crear en Linear — bloqueado por MCP caducado

**Estado:** el MCP `linear-aitor` está caducado desde el 2026-09-07, en la terminal del
PM y en la de QA. Solo Aitor puede reconectarlo (`/mcp`). Este fichero existe para que
los hallazgos no se pierdan mientras tanto — **se borra en cuanto las issues estén
creadas**, para no dejar una segunda fuente de verdad viva.

---

## 1. No hay forma de añadir una oportunidad a un cliente existente

**Tipo:** hueco funcional real (no cosmético). **Detectado por:** QA, verificado por PM.

En la Ficha de cliente, el botón "Nueva oportunidad" está `disabled` con
`title="Disponible próximamente"` y el texto "Muy pronto podrás crear oportunidades
desde aquí" (`app/clientes/[id]/page.tsx:159-161` y `:181-183`).

La vía alternativa no sirve, y esto es lo que eleva la gravedad:
- `AltaRapidaModal` (`components/crm/AltaRapidaModal.tsx:14-16`) solo acepta `open` y
  `onClose` — **no admite cliente**; `QuickActions.tsx:73` lo abre en blanco.
- `createQuick` (`convex/opportunities.ts:144`) hace `ctx.db.insert("customers", …)`
  **siempre**: no busca cliente existente por teléfono ni email. Lo único que deduplica
  es `opportunityRequests` por `clientRequestId`, que es idempotencia de doble envío.

**Consecuencia:** hoy, para dar una segunda oportunidad a un cliente que ya existe, el
único camino de la interfaz crearía un cliente duplicado.

El diseño sí lo contemplaba: `Design/pantallas/Ficha de cliente.dc.html:60` tiene el
botón con `on-click="{{ openAlta }}"` y la línea 113 define el diálogo "Para
{{ cliente.nombre }}. Se creará con su primer próximo paso."

**Nota de proceso:** `CLAUDE.md` exige crear la issue de continuación en el momento del
recorte. No hay ninguna referencia a un AIT-XX en el código, mientras otros recortes del
proyecto sí la llevan — indicio, no prueba, porque no se pudo consultar Linear.

**Dato acotado por QA:** barrido exhaustivo de `app/` y `components/` — este es el
**único** recorte anunciado al usuario con texto tipo "próximamente" en toda la UI.

---

## 2. "Eliminar cliente" deshabilitado contradice el patrón de AIT-66

**Tipo:** incoherencia de patrón con impacto real en móvil. **Detectado por:** PM.

En la misma tarjeta, "Eliminar cliente" usa `disabled` + `title="No se puede eliminar:
tiene oportunidades asociadas…"` (`app/clientes/[id]/page.tsx`).

`docs/01-arquitectura.md` establece, como hallazgo de auditoría de AIT-66, que un botón
deshabilitado **no comunica nada en táctil ni con teclado**, y que el patrón correcto es
abrir un diálogo informativo. Un `title` es un tooltip de ratón: en móvil, Marta ve un
botón gris sin ninguna explicación.

Vino de AIT-65. Sugiere que la decisión de AIT-66 no se propagó al resto de la app —
conviene barrer si hay más casos.

---

## 3. Pantalla 404 de fábrica, en inglés y sin salida

**Tipo:** mitad hueco de alcance, mitad defecto. **Detectado por:** QA.

Cualquier ruta inexistente muestra la pantalla por defecto de Next.js: "404 — This page
could not be found.", sin identidad de SuperCRM, sin navegación y sin enlace de vuelta.
No existen `not-found.tsx` ni `error.tsx` en `app/`.

- **Hueco de alcance:** no hay pantalla de error entre las 10 de `Design/pantallas/` ni
  mención alguna a 404 en `Design/`. Nadie se saltó el diseño; el estado nunca entró en
  el MVP.
- **Defecto en sentido estricto:** el texto de interfaz está en inglés, y `CLAUDE.md`
  fija la interfaz en español (el inglés es solo para el código).

**Decisión de producto (PM, 2026-09-07):** sí merece pantalla propia. Es barata y el
estado es alcanzable por el usuario (URL mal escrita, enlace viejo, marcador caducado).
Alcance: mensaje en español, identidad de SuperCRM, navegación intacta y un camino de
vuelta — mismo criterio que ya se aplicó a "Esta oportunidad ya no existe" (AIT-70),
que QA confirma bien resuelto. Gravedad baja: no se llega por ningún flujo normal.

No pertenece a la Ola 2 (no tiene relación con el email): issue propia en Post-MVP.

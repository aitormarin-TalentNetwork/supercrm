# 01 · Arquitectura

**Estado:** 🟡 Vivo — se actualiza conforme avanzamos.
**Alcance:** MVP (web responsive, una sola tienda) — completo. Post-MVP (AIT-31) ya añadió soporte multi-tienda en el backend; este documento describe la arquitectura base del MVP, no repite el detalle de cada mejora Post-MVP.

---

## 1. Stack

| Capa | Elección | Por qué |
|---|---|---|
| Framework | **Next.js** (App Router) + TypeScript | Es lo que pide el curso. Un solo proyecto para UI y servidor. |
| Estilos | **Tailwind CSS** | El design system ya está en tokens CSS → encaja directo. |
| Backend + BBDD | **Convex** | Base de datos, lógica de servidor y **tiempo real** en el mismo sitio. Sin API REST propia, sin ORM, sin migraciones a mano. |
| Autenticación | **Convex Auth** (`@convex-dev/auth`, proveedor `Password`) | El PRD solo pide email/contraseña con rol. **Decisión definitiva** — ver ADR-001 en §6. |
| Despliegue | **Railway** (auto-deploy en cada push a `main`) | Ver ADR-002 en §6. |

### Qué significa "backend = Convex"

No escribimos endpoints. Convex expone tres tipos de función y la app las llama directamente:

- **query** → leer datos. El componente hace `useQuery(api.opportunities.list)` y **se actualiza solo** cuando los datos cambian (esto es lo que hace que el Pipeline y "Hoy" estén siempre al día sin refrescar).
- **mutation** → escribir datos (crear cliente, mover etapa, registrar interacción).
- **action** → hablar con el mundo exterior (envío de emails, push…). En el MVP casi no hará falta.

Las reglas de negocio (generar el próximo paso, calcular el riesgo) viven **dentro de las funciones de Convex**, no en la UI. Así valen igual para móvil que para web y no se pueden saltar desde el cliente.

**Excepción explícita: `convex/http.ts`.** Convex Auth exige registrar sus propias rutas HTTP (`/.well-known/openid-configuration`, `/.well-known/jwks.json`) para funcionar — son infraestructura que exige la propia librería de auth, no endpoints REST propios de la aplicación. Ningún dato del CRM se sirve por ahí; todo lo demás sigue pasando exclusivamente por queries/mutations/actions tipadas de Convex.

**`convex/_generated/` está trackeado en git a propósito** (no va en `.gitignore`) — es el patrón normal en un proyecto Convex de este tamaño. Pero es código generado a partir de `convex/schema.ts` y de las funciones: **tras tocar el schema o añadir/renombrar una función, hay que regenerarlo con `npx convex dev --once` antes de commitear.** No hacerlo ya rompió el build de producción una vez (commit `30ea745`, "Fix: regenerar convex/_generated/api.d.ts (build roto en producción)").

---

## 2. Estructura de carpetas

El proyecto Next.js vive en **la raíz** de esta carpeta, conviviendo con `docs/` y `Design/`.

```
CRM curso Vibe Coding/
├── CLAUDE.md              # Reglas para la IA
├── README.md              # Mapa del proyecto
├── docs/                  # Esta documentación
├── Design/                # Design system + 10 pantallas (ya hecho)
│
├── app/                   # Rutas (App Router)
│   ├── layout.tsx
│   ├── page.tsx           # Redirige según rol: Marta → /panel, Carlos → /hoy
│   ├── login/
│   ├── hoy/               # Vista del vendedor (Carlos)
│   ├── pipeline/          # Embudo por etapas
│   ├── oportunidades/[id]/# Detalle de oportunidad (pantalla central)
│   ├── clientes/[id]/     # Ficha de cliente
│   ├── panel/             # Dashboard (solo Marta)
│   └── supervision/       # Actividad del equipo (solo Marta)
│
├── components/            # Componentes React
│   ├── ui/                # Portados del design system (Button, Card, Dialog…)
│   └── crm/              # De dominio (OpportunityCard, PipelineColumn, NextStepRow…)
│
├── convex/                # Backend
│   ├── schema.ts          # Las 7 tablas + tablas de auth → ver 02-modelo-de-datos.md
│   ├── auth.config.ts     # Configuración de Convex Auth
│   ├── auth.ts            # Proveedor Password, createOrUpdateUser
│   ├── http.ts            # Rutas HTTP que exige Convex Auth (no REST propio)
│   ├── users.ts           # getCurrentUserRole + bootstrap de las 2 cuentas iniciales
│   ├── stores.ts          # getStoreInfo (owner-only)
│   ├── model/
│   │   └── access.ts      # requireUser / requireOwner — helpers de rol reutilizables
│   ├── customers.ts
│   ├── opportunities.ts
│   ├── interactions.ts
│   ├── nextSteps.ts
│   ├── quotes.ts
│   └── dashboard.ts       # KPIs de Marta (pipeline, forecast, riesgo)
│
├── lib/                   # Utilidades puras (formato de fechas, importes, cálculo de riesgo)
├── proxy.ts               # Protección de rutas (Next.js 16 — sustituye a middleware.ts)
└── public/
```

**Regla:** una carpeta de `app/` por pantalla del PRD. Los modales (**Alta rápida** y **Registrar interacción**) **no son rutas**: son componentes que se abren desde varias pantallas y devuelven al punto de origen.

---

## 3. Las 10 pantallas y su ruta

| Pantalla (PRD §7) | Ruta | Quién | Diseño |
|---|---|---|---|
| Acceso (login) | `/login` | ambos | `Design/pantallas/Login.dc.html` |
| Hoy | `/hoy` | Carlos | `Hoy.dc.html` |
| Pipeline | `/pipeline` | ambos | `Pipeline.dc.html` |
| Detalle de oportunidad | `/oportunidades/[id]` | ambos | `Detalle de oportunidad.dc.html` |
| Ficha de cliente | `/clientes/[id]` | ambos | `Ficha de cliente.dc.html` |
| Alta rápida | *modal* | Carlos | `Alta rápida.dc.html` |
| Registrar interacción | *modal* | Carlos | `Registrar interacción.dc.html` |
| Panel | `/panel` | **solo Marta** | `Panel.dc.html` |
| Supervisión | `/supervision` | **solo Marta** | `Supervisión.dc.html` |
| UI Kit | — (referencia) | — | `UI Kit.dc.html` |

**Detalle de oportunidad es el nodo central**: se llega desde Hoy, Pipeline, Ficha de cliente, Panel y Supervisión.

---

## 4. Roles y permisos

Dos roles, definidos en el usuario: `owner` (Marta) y `sales` (Carlos).

| | Marta (`owner`) | Carlos (`sales`) |
|---|---|---|
| Arranque tras login | `/panel` | `/hoy` |
| Sus clientes y oportunidades | ✅ todos | ✅ **solo los suyos** |
| Panel (KPIs, forecast, dinero) | ✅ | ❌ |
| Supervisión (actividad del equipo) | ✅ | ❌ |

**Dónde se aplica:** el filtro por rol se aplica **en las funciones de Convex**, no escondiendo botones en la UI. Una query que devuelve oportunidades filtra por `ownerId` si el usuario es `sales`. Ocultar el enlace al Panel está bien para la experiencia, pero **no es seguridad**.

---

## 5. Rendimiento y tiempo real

- Las listas ("Hoy", Pipeline, Panel) usan `useQuery` → se refrescan solas cuando alguien cambia algo. Nada de recargar a mano.
- Todo lo que se filtra u ordena mucho (oportunidades por etapa, pasos por fecha) necesita **índice en Convex** → ver `02-modelo-de-datos.md`.
- El **riesgo** ("días sin actividad") y el **forecast** se **calculan al vuelo** en la query, no se guardan como campo. Así nunca quedan desfasados.

---

## 6. Decisiones cerradas (ADR)

### ADR-001 · Proveedor de autenticación — 2026-07-30

**Contexto:** el MVP necesita login por email + contraseña con dos roles (`owner`, `sales`) y sin registro público. El backend ya es Convex en su totalidad.

**Decisión:** Convex Auth (`@convex-dev/auth`, proveedor `Password`). Corre en el mismo deployment que el resto de los datos, sin servicio de auth externo de terceros — y `getAuthUserId(ctx)` da acceso directo al usuario autenticado desde cualquier query/mutation, que es justo donde debe vivir el filtro por rol (ver §4). **Sí requiere gestionar un par de claves propio** (`JWT_PRIVATE_KEY`/`JWKS`, con las que Convex Auth firma los tokens de sesión) más `SITE_URL` — se generan una vez con `npx @convex-dev/auth` y viven en el deployment de Convex, no en un servicio externo; ver `docs/03-setup.md` §6 para el detalle. No son "cero claves que gestionar", pero sí son internas al propio proyecto.

**Alternativa descartada:** Clerk. Añade un servicio externo y una integración por webhook con Convex solo para mantener sincronizado el usuario — coste que no se justifica para un MVP de una sola tienda y dos usuarios.

**Consecuencias:**
- No hay recuperación de contraseña real ni verificación de email (el PRD no lo pide; "¿Olvidaste la contraseña?" en el login es solo informativo).
- No hay registro público: los dos usuarios iniciales se crean con una `internalAction` (`convex/users.ts`), no con un formulario.
- **Decisión definitiva** (cerrada en la auditoría de 2026-08-20: el curso ya no va a pedir Clerk ni otra alternativa de auth). Queda igualmente documentado que, si algún día se quisiera cambiar, **no** sería un cambio acotado a un par de archivos — afecta a toda la superficie de autenticación: `convex/auth.ts`, `convex/auth.config.ts` (el dominio del JWT deja de ser el de Convex Auth), `convex/http.ts` (dejaría de tener sentido tal cual — son las rutas que exige `@convex-dev/auth`, no Clerk), `convex/users.ts` (el bootstrap de las 2 cuentas via `createAccount` es específico de Convex Auth; con Clerk las cuentas se gestionan desde su propio dashboard/API), `proxy.ts` (usa `convexAuthNextjsMiddleware`; se sustituiría por el middleware de Clerk), `app/ConvexClientProvider.tsx`/`app/layout.tsx`, y el propio formulario de `app/login/page.tsx` (hoy construido sobre `useAuthActions().signIn`, un hook específico de esta librería) — además de cambiar las dependencias (`@convex-dev/auth`/`@auth/core` → `@clerk/nextjs`). Lo único que probablemente sobreviviría es el concepto de datos (`role`/`storeId` en `users`), no necesariamente su forma exacta. Es una reescritura completa de la capa de auth, no un cambio acotado — pero eso no es una condición para reabrir la decisión, solo el coste que tendría hacerlo si algún día se decidiera cambiar.
- La compatibilidad de `@convex-dev/auth` con la convención `proxy.ts` de Next.js 16 (que sustituye a `middleware.ts`) se verificó por inspección de código — usa únicamente APIs estables de `next/server`/`next/headers`, agnósticas al nombre del archivo — pero el README/changelog de la librería no menciona Next.js 16 explícitamente. Es una inferencia de bajo riesgo, no una confirmación del fabricante; se valida con un build de producción real antes de cerrar AIT-9.

**Estado:** 🟢 Cerrada.

### ADR-002 · Hosting/despliegue — 2026-08-08 (migrado 2026-08-13)

**Contexto:** el plan inicial (§7 antigua) era decidir el hosting en la Fase 6 · Cierre, con Vercel como opción natural para Next.js. En la práctica, Aitor ya tenía Railway configurado y funcionando (cuenta personal, conectado por GitHub al repo `aitormarin-TalentNetwork/supercrm`) antes de llegar a esa fase, para poder ver la app en vivo mientras se desarrolla con varias terminales de Claude Code en paralelo.

**Decisión:** Railway, cuenta personal de Aitor (`aitormarin@gmail.com`, workspace "My Projects", proyecto **`fulfilling-vision`**, servicio `supercrm`). **Auto-deploy en cada push a `main`** vía la integración de GitHub — no hace falta ningún paso manual de despliegue: mergear y hacer `git push` ya publica. URL actual: `https://supercrm-production-bf48.up.railway.app`. Las 4 variables de entorno del frontend puestas en el servicio: `NEXT_PUBLIC_CONVEX_URL`/`NEXT_PUBLIC_CONVEX_SITE_URL` apuntan al deployment de Convex de producción (`stoic-impala-857` desde AIT-59/2026-08-24 — ver ADR-004; antes de esa fecha apuntaban a `third-goldfinch-805`, el compartido de dev/test). `NEXT_PUBLIC_DEMO_OWNER_PASSWORD`/`NEXT_PUBLIC_DEMO_SALES_PASSWORD` no "apuntan" a ningún deployment — son las contraseñas de autorrelleno de `/login`, copiadas de `SEED_OWNER_PASSWORD`/`SEED_SALES_PASSWORD` del deployment que esté sirviendo producción en cada momento (hoy, `stoic-impala-857`).

**Alternativa descartada:** Vercel — no se llegó a evaluar; Railway ya estaba desplegando con éxito cuando se revisó esta decisión, y no hay ningún requisito del MVP que lo justifique.

**Migración 2026-08-13:** el proyecto original de esta decisión (`reasonable-creativity`, misma cuenta) agotó el trial limitado y quedó inaccesible sin pasar a plan de pago — exactamente el riesgo que ya avisaba la consecuencia de abajo. Aitor decidió no pagar por acceso a esa cuenta y creó una cuenta Railway nueva (mismo email, `aitormarin@gmail.com`, cuenta de Railway distinta), donde se recreó el proyecto desde cero: nuevo servicio conectado al mismo repo/rama, mismas 4 variables de entorno copiadas, redeploy disparado a mano una vez puestas las variables (los `NEXT_PUBLIC_*` de Next.js se incrustan en el build, no se leen en caliente — el primer deploy con las variables recién puestas seguía sirviendo el build anterior sin ellas y daba 500 en `/login`). Verificado en vivo tras el redeploy: `/login` 200, `/` y rutas protegidas (`/catalogo`, `/pipeline`) 307 a `/login` sin sesión. `reasonable-creativity` queda abandonado, no se usa ni se paga.

**Consecuencias:**
- ⚠️ **Esta cuenta Railway nueva también puede estar en trial limitado** — revisar el plan/facturación antes de que caduque otra vez, no descubrirlo por una caída en medio de una demo (ya pasó una vez, ver migración de arriba).
- Existen ahora **dos proyectos Railway huérfanos**, ninguno se usa ni se toca: "Mi CRM basic" (cuenta `aitor.marin@talent-network.org`, dominio `supercrm-production.up.railway.app`, sin deployment real) y `reasonable-creativity` (cuenta Railway vieja de `aitormarin@gmail.com`, trial agotado).
- El CLI de Railway en esta máquina ya está autenticado con la cuenta correcta (`aitormarin@gmail.com`) y enlazado (`railway link`) al proyecto `fulfilling-vision` — a diferencia de la vez anterior, si hace falta gestionar el proyecto real por CLI ya funciona sin re-loguear.
- **AIT-59 (2026-08-24, ver ADR-004 más abajo):** el "Build Command" de Railway ejecuta
  ahora `npx convex deploy` en cada build, apuntando a `stoic-impala-857`, en vez de
  servir lo último que una terminal empujara a mano contra el deployment compartido de
  desarrollo/test.

**Estado:** 🟢 Cerrada.

### ADR-004 · Separar Convex de desarrollo/test del de producción — 2026-08-24 (AIT-59)

**Contexto:** Railway (producción real) y el `npx convex dev` que usan las 3 terminales
en local apuntaban **al mismo deployment de Convex** (`third-goldfinch-805`) — sin datos
reales de negocio hoy, pero con la suite E2E de Playwright ya escribiendo datos de
prueba directamente ahí, y sin ningún riesgo aceptable a medio plazo. Investigando el
gap se encontró además que Convex ya había provisionado automáticamente, junto al de
dev, un deployment de producción sin usar (`stoic-impala-857`) — no hacía falta crear
ninguno nuevo.

**Decisión:** `third-goldfinch-805` se queda como el deployment de desarrollo/test
compartido de las 3 terminales, sin ningún cambio (mismo turno/cerrojo de `CLAUDE.md`,
ver también §3bis del README de la fábrica sobre la migración, pendiente y distinta, a
deployments de dev aislados por terminal). `stoic-impala-857` pasa a ser el deployment
de producción real — configurado con `npx convex deploy` (nunca `convex dev`), patrón
oficial de Convex para integrarse con Railway/Vercel, y con **todas** las variables de
entorno que las funciones ya mergeadas en `main` necesitan para no fallar en producción
(Convex Auth, cuentas semilla, y también las 3 claves VAPID de AIT-57 — `convex/crons.ts`
dispara el envío de avisos push cada hora, así que faltarlas habría sido una regresión
silenciosa de una funcionalidad ya en el MVP en cuanto la Tanda 2 conectara Railway).

**Entrega en dos tandas** (AIT-59, ver Linear para el detalle): Tanda 1 — configurar
`stoic-impala-857` (schema, funciones, claves de auth, cuentas semilla, claves VAPID) y
esta misma documentación. Tanda 2 — generar el `CONVEX_DEPLOY_KEY` persistente para CI
(ver nota más abajo — el plan original lo situaba en la Tanda 1; se trasladó durante la
implementación) y conectar Railway de verdad (cambiar su "Build Command" para que
ejecute `npx convex deploy` en cada build, en vez de servir lo último que una terminal
empujara a mano contra el deployment compartido).

**Estado a fecha 2026-08-24: cutover completo.** `stoic-impala-857` tiene el schema, las
funciones, Convex Auth y las claves VAPID de `main` configurados, con las 2 cuentas de
prueba sembradas, y Railway construye contra ese deployment en cada push a `main` desde
que la Tanda 2 se ejecutó — verificado en vivo: `railway logs --build` confirmó
`SUCCESS` con el SHA correcto, `/login` responde 200, las 2 cuentas de prueba inician
sesión correctamente (Marta → `/panel`, Carlos → `/hoy`), las rutas protegidas
redirigen sin sesión, y `third-goldfinch-805` (dev/test) sigue respondiendo con
normalidad para las 3 terminales.

**Consecuencias:**
- Ningún fichero de configuración nuevo en el repo — Railway Config as Code
  (`railway.toml`) está deprecado para servicios que, como este, nunca lo adoptaron; el
  "Build Command" se fija desde su dashboard (Settings → Build), sin versionar. Ver
  `docs/03-setup.md` §8 para el comando exacto y el detalle operativo.
- `NEXT_PUBLIC_CONVEX_URL` la inyecta `npx convex deploy --cmd --cmd-url-env-var-name`
  en cada build de Railway. **`NEXT_PUBLIC_CONVEX_SITE_URL` no se inyecta igual** — sigue
  siendo una variable estática fijada a mano en Railway (verificado contra la
  documentación oficial de Convex: `--cmd-url-env-var-name` solo fija la variable
  nombrada explícitamente, ninguna otra) — no asumir que las dos funcionan igual.
- **Hallazgo de la implementación: el "Build Command" de Railway no respeta comillas
  simples.** El patrón oficial de Convex (`--cmd 'npm run build'`) falló en la práctica
  — Railway no agrupa el valor entre comillas simples al construir el comando, así que
  `--cmd` solo recibía "npm" (sin "run build"), y el build fallaba. Con comillas dobles
  (`--cmd "npm run build"`) funciona correctamente — ver el comando completo en
  `docs/03-setup.md` §8.
- `CONVEX_DEPLOY_KEY` se generó fresco al empezar la Tanda 2 (no en la Tanda 1, pese a
  que el plan original lo situaba ahí — `npx convex deploy` desde un worktree con
  `.env.local` de desarrollo exige una confirmación interactiva imposible de saltarse,
  ver `docs/03-setup.md` §8) y ya está puesta en Railway.
- **Hallazgo de la implementación: las 2 cuentas de prueba sembradas en la Tanda 1
  tenían un hash de contraseña que no verificaba en el login**, pese a que el valor en
  claro de `SEED_OWNER_PASSWORD`/`SEED_SALES_PASSWORD` coincidía (confirmado por hash)
  entre dev, prod y Railway — causa raíz no determinada con certeza. `curl`/HTTP no lo
  detecta (el login solo falla al comprobar la contraseña, no al cargar la página); se
  diagnosticó reproduciendo el hashing de Convex Auth (`Scrypt` de `lucia`) localmente
  contra el hash guardado, y se resolvió borrando las 2 cuentas (`authAccounts` +
  `users`) y sus reservas de bootstrap (`appConfig`, claves `bootstrap_claim:<email>`) y
  volviendo a ejecutar `bootstrapInitialAccounts` — que NO actualiza cuentas ya
  existentes (comprobado en `convex/users.ts`), así que un simple re-lanzamiento no
  basta si esto se repite. Si vuelve a pasar, comprobar primero con `npx convex data
  authAccounts --prod` que solo hay una fila por email (no duplicados) antes de asumir
  que el problema es el mismo.

**Estado:** 🟢 Cerrada. Tanda 1 y Tanda 2 completas — separación dev/test vs producción
en vigor.

## 7. Decisiones abiertas

Ninguna a día de hoy. Las dos que figuraban aquí ya se resolvieron:

| # | Decisión | Resolución |
|---|---|---|
| 1 | Notificaciones push del PRD (Fase 3) | Cerrada para el MVP (AIT-18, Done): solo in-app, sin push real ni email. Push real quedó como mejora Post-MVP separada, ver AIT-57 (Backlog). |
| 2 | Portar el design system a componentes Tailwind reales | Cerrada — completado como parte de la construcción de las pantallas del MVP (AIT-9 y siguientes, todas Done). |

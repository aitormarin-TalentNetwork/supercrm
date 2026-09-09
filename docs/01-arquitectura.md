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
| Autenticación | **Convex Auth** (`@convex-dev/auth`, proveedores `Password` + `Google` en paralelo) | AIT-60 (2026-08-24): Google se AÑADE junto al login por contraseña ya existente, no lo sustituye — decisión de producto que contradice a propósito el PRD cerrado. Ver ADR-001 y ADR-003 en §6. |
| Despliegue | **Railway** (auto-deploy en cada push a `main`) | Ver ADR-002 en §6. |
| Credenciales | **Bitwarden** | Almacén de referencia de las credenciales del proyecto (contraseñas semilla, tokens, claves de servicio). `.env.local` y las variables de entorno de Convex/Railway son copias desplegadas a partir de aquí, no la fuente de verdad. Relevante para el `checklist de salida a producción real` y la rotación de secretos (`CLAUDE.md`). |

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
│   ├── auth.ts            # Proveedores Password + Google (OAuth), createOrUpdateUser
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

**Acciones rápidas globales (AIT-66):** `components/nav/QuickActions.tsx` es el elemento de
cabecera común, montado en el `<header>` de las 10 pantallas, que abre esos dos modales desde
cualquier sitio — mismo criterio que `NavToggleButton`/`AppNav` (AIT-51): un único componente
reutilizado en cada cabecera, en vez de un layout global. "+ Nuevo" siempre abre
`AltaRapidaModal`. "+ Registrar interacción" nunca queda `disabled` (un botón deshabilitado no
comunica nada en táctil/teclado — hallazgo de auditoría de AIT-66): si la pantalla no tiene
ninguna oportunidad en contexto (`registrarInteraccionOpportunityId` sin pasar), abre un
`Dialog` informativo explicando que hace falta una oportunidad abierta, en vez del modal real
— decisión de producto (PM, AIT-66): sin selector de oportunidad, para no introducir un flujo
nuevo.

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
- **Actualizado por AIT-62 (ver ADR-005 más abajo):** desde esta tarea SÍ hay recuperación real de contraseña (Convex Auth + Resend) para las cuentas por contraseña — la limitación descrita aquí originalmente ("es solo informativo") queda obsoleta. La verificación de email en el sentido de Convex Auth (`emailVerificationTime`) sigue sin usarse para las cuentas por contraseña — lo que cambia es solo el flujo de reseteo.
- No hay registro público: los usuarios se crean con `convex/users.ts:createUser` (Ajustes, cuentas Google) o con `bootstrapInitialAccounts` (`internalMutation`, cuentas Google iniciales) — las cuentas por contraseña siguen su propio camino con `createAccount` (ver ADR-003), nunca un formulario de alta abierto.
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

### ADR-003 · Google (OAuth) en paralelo a Password — 2026-08-24 (AIT-60)

**Contexto:** decisión de producto confirmada con Aitor, **contradice a propósito** la sección "Acceso (login)" del PRD cerrado (§7/§8) — documentado en Notion "CRM — Mejoras del Sistema". No reabre ADR-001: Convex Auth sigue siendo la librería (sigue sin servicio de auth externo de terceros, sigue firmando sesiones con el mismo par `JWT_PRIVATE_KEY`/`JWKS`); lo que cambia es que ahora tiene **dos** providers activos a la vez.

> Nota de proceso: el diseño original de esta tarea (ronda 1-2, NO-GO en ambas) planteaba Google como **sustituto** del provider Password — retirarlo, desactivar las cuentas semilla, migrar todo el login. El PM corrigió el alcance a mitad de la tarea (2026-08-24): Google se **añade en paralelo**, Password no se toca. Este documento describe el diseño final; el histórico de las dos rondas NO-GO queda en el propio proceso de auditoría, no aquí.

**Decisión:** provider `Google` de `@auth/core/providers/google` (ya venía como dependencia transitiva de `@convex-dev/auth`, sin instalar nada nuevo) añadido al array `providers` de `convex/auth.ts` **junto a** `Password`, sin tocarlo. `convex/auth.ts:createOrUpdateUser` ahora distingue por `type`:
- `"credentials"` (Password): mismo comportamiento de siempre — solo se alcanza si algo llama a `createAccount` directamente (rechaza registro público, valida `email`/`name`/`role`/`storeId`), defensa en profundidad que en la práctica no dispara hoy (nada del proyecto crea cuentas Password nuevas fuera del bootstrap original de AIT-8).
- `"oauth"` (Google): **enlace contra lista blanca** — busca en `users` por el email que devuelve Google y, si existe una fila activa (dada de alta desde Ajustes o por el bootstrap), enlaza esa cuenta de Google a ella; si no existe, o si está `active: false`, rechaza sin crear ningún enlace. Google nunca da de alta a nadie por su cuenta, solo verifica quién es.

Las cuentas semilla `marta@supercrm.es`/`carlos@supercrm.es` (Password) siguen exactamente igual que antes de esta tarea — **sin tocar, sin desactivar**. Las 2 cuentas reales del negocio, `admin@talent-network.org` (owner) y `aitor.marin@talent-network.org` (sales), se dan de alta desde Ajustes/bootstrap como cuentas **solo Google** (sin contraseña) y conviven con las anteriores.

**Consecuencia técnica:** `convex/users.ts:createUser` (alta desde Ajustes) y `bootstrapInitialAccounts` son `mutation`/`internalMutation` — insertan directamente en `users`, sin `createAccount` ni `ActionCtx`, porque solo dan de alta cuentas Google-only. El camino de `createAccount` + provider Password (usado originalmente para marta/carlos en AIT-8) sigue existiendo en `convex/auth.ts` sin cambios, simplemente hoy nada nuevo lo invoca.

**Limitación conocida:** Convex Auth redirige en silencio al terminar el flujo de OAuth, tanto si el login con Google tiene éxito como si `createOrUpdateUser` lo rechaza — no hay forma pública de distinguir el motivo exacto desde el cliente (comportamiento de la propia librería, no un bug: evita filtrar si un email concreto existe o no en el sistema). `app/login/page.tsx` compensa por descarte (si se volvió con `?oauth=1` tras pedir `redirectTo` explícito y, tras resolver el estado de auth, seguimos sin sesión, se asume rechazo y se muestra un aviso genérico) — funciona, pero es una heurística, no una señal exacta del servidor. Esta limitación es solo del camino Google; el formulario de contraseña sigue devolviendo su propio error inline como siempre.

**Alternativa descartada (para la limitación de arriba):** interceptar la ruta HTTP `/api/auth/callback/google` a mano para añadir un `?error=` explícito. Exige reimplementar infraestructura interna de `@convex-dev/auth` (PKCE, state, verificación de firma) no pensada para sobrescribirse — desproporcionado para una mejora de UX de un mensaje de error.

**Estado:** 🟢 Cerrada. Verificación end-to-end real completada (2026-08-25) — login con `admin@talent-network.org` (owner → `/panel`) y `aitor.marin@talent-network.org` (sales → `/hoy`) funcionan contra Google de verdad; una cuenta de Google sin alta previa se rechaza sin sesión y sin alta automática; el camino Password (`marta@supercrm.es`) sigue sin cambios. Detalle del hallazgo real de esta verificación (secret de Google desincronizado) en `docs/03-setup.md` §6bis.

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

### ADR-005 · Recuperación de contraseña: Resend + `authorize` propio en Password — 2026-08-25 (AIT-62)

**Contexto:** completa un hueco que ya estaba en el PRD original (enlace "¿Olvidaste tu
contraseña?" en Acceso, nunca construido — ver la corrección en ADR-001 de arriba). Solo
afecta al provider `Password` — no toca el login por Google (AIT-60/ADR-003).

**Decisión — envío del código:** Convex Auth expone el flujo de reseteo vía
`Password({reset: EmailConfig})` (`flow: "reset"`/`"reset-verification"`), el mismo
mecanismo que ya usa la propia librería para verificación de email por link/código — no
se construye nada nuevo, se conecta ese `EmailConfig` (`convex/ResendOTPPasswordReset.ts`)
al envío real. El código es numérico de 6 dígitos (el generador por defecto de la
librería produce un token de 32 caracteres pensado para un link, no para que una persona
lo teclee), generado con `crypto.getRandomValues` (CSPRNG del runtime por defecto de las
actions de Convex, sin `"use node"`) con muestreo por rechazo para no sesgar el módulo.
Válido 15 minutos (`maxAge`). El envío usa `fetch` directo a la API REST de Resend
(`https://api.resend.com/emails`) en vez del SDK npm `resend` — mismo patrón que usa
`@auth/core` para su propio provider `Resend` de magic-link, sin añadir una dependencia
nueva solo para esto.

**Alternativa descartada:** el SDK oficial `resend` (mejor tipado de errores de la API) —
se prefirió `fetch` por minimalismo, dado que ya hay un patrón de referencia (`@auth/core`)
que resuelve lo mismo sin él.

**Decisión — distinguir Google-only sin necesitar el schema:** `convex/users.ts:getLoginMethodsForEmail`
(sin sesión previa, criterio de aceptación #2) usa el mismo invariante ya real de este
proyecto (ver ADR-003 y `docs/02-modelo-de-datos.md`): solo hay dos caminos que crean una
fila en `users`, mutuamente excluyentes — Password (`createAccount`) crea su fila de
`authAccounts` en el mismo acto que crea el usuario; Google (`createUser`/
`bootstrapInitialAccounts`) inserta directamente en `users`, y la fila de `authAccounts`
no existe hasta el primer login OAuth real. Una fila `users` con CERO filas en
`authAccounts` solo puede ser una cuenta Google todavía sin su primer login — no hace
falta ningún campo nuevo en el schema para saberlo.

**Decisión — rate-limit del envío, y por qué el `authorize` de `Password` está forkeado:**
`@convex-dev/rate-limiter` (0.3.2, primer componente Convex de este proyecto,
`convex/convex.config.ts`), 3 solicitudes por email cada 15 minutos. El chequeo NO vive
en `sendVerificationRequest` (donde estaría "naturalmente", dentro de `config.reset`) —
hallazgo de auditoría (ronda 2): `authVerificationCodes` tiene como mucho 1 fila por
cuenta (`generateUniqueVerificationCode`, en la propia librería, borra la anterior sin
condición alguna) ANTES de llamar a `sendVerificationRequest` — un rate-limit puesto ahí
llega tarde: la 4ª solicitud ya habría borrado el código válido de la 3ª sin haber llegado
a enviarlo, dejando a cualquiera que conozca un email capaz de inutilizar su recuperación
sin necesitar el código él mismo. Los otros dos puntos de personalización que expone la
librería tampoco sirven: `profile(params, ctx)` sí recibe `ctx`, pero la librería la llama
sin `await`, así que hacerla async rompe el flujo en vez de arreglarlo;
`generateVerificationToken` no recibe ni `ctx` ni el email. La única vía real es
sustituir el `authorize` completo del provider Password (`convex/auth.ts`) — reimplementado
con las mismas funciones públicas que usa la librería internamente
(`createAccount`/`retrieveAccount`/`signInViaProvider`/`modifyAccountCredentials`/
`invalidateSessions`, exportadas explícitamente para este uso), copiando tal cual las
ramas que no cambian de comportamiento (`signUp`/`signIn`/`reset-verification`/
`email-verification`, esta última siempre inerte — `verify` nunca se ha configurado en
este proyecto, pero se preserva con el mismo mensaje exacto de la librería) e
insertando el chequeo solo en `reset`, antes de `retrieveAccount`/`signInViaProvider`.

**Consecuencias:**
- `convex/auth.ts` pasa a controlar el flujo completo de `Password`
  (signUp/signIn/reset/reset-verification/email-verification), no solo la config — es
  un fork documentado
  de `Password.js` de `@convex-dev/auth@0.0.94`. Si se actualiza la librería en el
  futuro, hay que revisar a mano si `Password.js` cambió su `authorize` y si el fork
  sigue reflejándolo fielmente — no se actualiza solo.
- Nuevas variables de entorno: `RESEND_API_KEY` y `RESEND_FROM_EMAIL` (remitente
  configurable, no hardcodeado). **Consecuencia operativa:** con el dominio de prueba de
  Resend (`onboarding@resend.dev`) solo se puede entregar al propio dueño de la cuenta
  Resend — hace falta un dominio propio verificado en el dashboard de Resend antes de
  que el envío funcione para cuentas reales del proyecto. Ver `docs/03-setup.md` §6ter.
  Al mergear a `main`, ambas variables también hacen falta en el deployment de
  producción (`stoic-impala-857`), no solo en desarrollo.
- Nueva dependencia directa `lucia` (antes transitiva, vía `@convex-dev/auth`) — el
  `authorize` propio necesita `Scrypt` para el hash/verificación de contraseñas, mismo
  mecanismo que usaba la librería.

**Estado:** 🟢 Cerrada (AIT-62 y AIT-63, 27/08/2026) — diseño y verificación en vivo
completos. Además de lo ya verificado contra el deployment propio de T1
(`uncommon-puffin-303`): `getLoginMethodsForEmail` (los 3 casos, incluido Google-only
sin primer login), el flujo de reset hasta el punto de envío, el rechazo de código
incorrecto, y que una solicitud rate-limitada NO borra el código válido de una
solicitud anterior (confirmado con `npx convex data authVerificationCodes`: misma
fila, mismo `_id`, mismo hash, antes y después del intento rechazado) — con las
credenciales de Resend puestas se verificó también, de principio a fin: envío real de
un email, reseteo completo con ese código real (contraseña cambiada, sesión emitida),
y rechazo de ese mismo código real una vez caducado. El frontend (AIT-63) se verificó
además clic a clic en el navegador: diálogo → código real → contraseña nueva →
redirect real de `/login` a `/hoy` con sesión iniciada.

### ADR-0xx · La versión desplegada se lee en tiempo de petición, nunca en build

**Contexto:** nadie podía responder "¿qué commit está sirviendo la app?" sin salir del
navegador. El 08/09/2026 eso costó un error real: se propagó que AIT-76 estaba publicada
cuando no lo estaba, y quien fue a probarla vio un 404 sin poder distinguir "el deploy no
está vivo" de "el deploy está vivo y esta pantalla falla".

**Decisión (AIT-79):** el identificador sale de `RAILWAY_GIT_COMMIT_SHA`, leído **en cada
petición** en `lib/version.ts`. Fuente única y automática: nada de `git rev-parse` (diría
el commit de quien construyó, no el que sirve) ni de variables que haya que mantener a
mano (acabarían publicando el commit de hace tres despliegues, que es el fallo que esto
viene a cerrar). Si no hay valor verificable, se devuelve `null` y no se emite nada —
antes callar que mentir.

**Por qué en tiempo de petición y no en build:** en el middleware Edge de Next.js,
`process.env.X` se sustituye por un literal al construir — el código *parece* leer el
entorno y no lo hace, y el valor se congela en el del build anterior. En Next.js 16
`proxy.ts` corre en runtime Node.js, así que la lectura es real contra el entorno del
contenedor.

**Superficies:**
- `/version` — JSON público, sin sesión (`force-dynamic` + `Cache-Control: no-store`).
  Es la vía autoritativa. Publica también `deploymentId`, que permite comprobar que la
  respuesta viene del despliegue que se cree y no de uno anterior que aún sirve tráfico.
- Cabecera `x-supercrm-commit` desde `proxy.ts`, para que el dato viaje en la misma
  respuesta que se está inspeccionando aunque la pantalla esté rota.
  **Cobertura exacta:** se emite en lo que pasa por el handler del proxy (navegación,
  redirects de ruta protegida y páginas de error de la app, 404 incluido). **No** en las
  rutas donde el proxy no corre (`_next`, ficheros con punto) ni en las salidas tempranas
  de Convex Auth (`/api/auth` y su redirect de refresco), que retornan antes.
- `/ajustes` — línea legible para humanos; es presentación de la misma fuente, no un
  segundo origen, y no cubre el requisito de consulta sin sesión (eso lo hace `/version`).

**Estado:** 🟢 hecho (AIT-79) — verificado el 2026-09-08 contra dos despliegues reales
consecutivos. Para cada uno por separado, `/version` devolvió un `deploymentId` no nulo
idéntico al de Railway, el SHA completo de 40 caracteres idéntico a `meta.commitHash`, y
`environment` exactamente `production`; entre ambos, los dos identificadores y los dos
commits resultaron distintos. Los despliegues fueron `5d71567f` (`bafd805`, el merge de
AIT-79) y `e9cc0648` (`c282cc6`), este último un push de documentación ajeno a la tarea —
lo que hace la comprobación independiente por accidente y no por construcción.

**Quién consume este dato (AIT-83).** `/version` dejó de ser solo informativo: el aviso de
versión nueva lo consulta **antes de dejar salir cada server action**. Consecuencia para
quien lo toque: `app/version/route.ts`, `lib/version.ts` y `proxy.ts` son ahora un contrato
con dos clientes, y cambiarles la forma de la respuesta, meterles caché o hacerlos depender
de sesión rompería el aviso **sin que fallara ningún test** — la ruta seguiría devolviendo
200. Se declaran superficie protegida.

### ADR-0xx · Una pestaña abierta durante un despliegue se entera antes de romperse

**Contexto:** si entra un despliegue con la pestaña abierta, sus server actions fallan en
silencio — Next lanza `UnrecognizedActionError` y en pantalla no ocurre nada. **No es un
fallo de seguridad:** al recargar, la sesión sí estaba cerrada; el servidor hizo su trabajo
y lo que falló fue el acuse de recibo. Lo que se rompe es la confianza en que los botones
hacen algo. El logout es el síntoma, no el problema: afecta a cualquier server action.

**Decisión (AIT-83):** la pestaña compara el commit con el que se cargó contra el que sirve
`/version` ahora, y avisa con opción de recargar. **Nunca recarga sola** — nadie quiere
perder lo que estaba escribiendo.

- La referencia la **inyecta el servidor** desde `app/layout.tsx`, no la pide el cliente al
  montar: un despliegue que entrara entre el HTML servido y ese primer fetch dejaría la
  referencia siendo la versión nueva, y la pestaña se creería al día para siempre.
- **El preflight es obligatorio; los eventos son oportunistas.** El límite de frecuencia
  puede suprimir `visibilitychange`/`pageshow`, nunca la comprobación previa a una server
  action: reutilizar un resultado anterior como autorización reintroduce la carrera que
  esto viene a cerrar. Puede *esperar* a una consulta en vuelo, que no es lo mismo.
- **Ante la duda, la acción pasa** (fail-open). `commit: null`, timeout, no-2xx y JSON
  inválido significan "no sé", nunca "no ha cambiado" — pero no bloquean. Convertir una
  caída de `/version` en la indisponibilidad de todas las escrituras sería peor que el
  fallo que se previene. Coste asumido: con `/version` caído, una pestaña vieja vuelve a
  fallar en silencio como antes.
- El envoltorio de `fetch` se instala con un script en el `<head>`
  (`components/version/fetchGateBootstrap.ts`) y **no** desde un efecto de React: Next
  captura su referencia a `fetch` al cargar su módulo, antes de hidratar, así que
  sustituirlo después llega tarde y la server action real pasa de largo.

**Estado:** 🟡 en curso (AIT-83).

### ADR-0xx · Cuándo un fallo tiene que decírselo al usuario — 2026-09-09 (AIT-112)

> **Sin número, como los dos ADR anteriores.** §6 arrastra dos `ADR-0xx` sin numerar;
> inventar aquí un número que luego choque sería peor que dejarlo pendiente con ellos.
> La renumeración de los tres va aparte.

**Contexto:** al inventariar los manejadores de error de la interfaz (AIT-94) aparecieron
dos `catch` deliberadamente silenciosos en `components/push/PushSubscriptionSync.tsx`. El
auditor aceptó excluirlos, pero señaló lo que faltaba: **el criterio de exclusión no
estaba escrito en ninguna parte**, así que el siguiente inventario volvería a discutir los
mismos dos ficheros desde cero. Este ADR existe para que esa discusión no se repita.

**Decisión:**

> Un `catch` que sigue a **una acción que el usuario acaba de iniciar** tiene que avisar.
> Un `catch` en **un proceso de fondo que el usuario no ha pedido**, no.

La frontera no es "es de push" ni "está dentro de un `useEffect`": es **si hay gesto y hay
espera**. Alguien que pulsa un botón y aguarda el resultado tiene derecho a saber que no
salió; avisar de algo que no ha pedido —y que ni sabe que existe— es ruido, y el ruido
entrena a ignorar los avisos que sí importan.

**Consecuencias, con los casos reales que la motivaron:**
- `components/push/PushSubscriptionSync.tsx` (dos `catch`) — **excluidos**. Es un vigía en
  segundo plano: nadie lo lanzó y nadie espera su resultado.
- `components/push/PushNotificationsSection.tsx:handleEnable` — **avisa, y debe**: ahí el
  usuario pulsó un interruptor. Mismo fichero de dominio, lado distinto de la frontera.
- `app/oportunidades/[id]/page.tsx` (AIT-94) y `app/login/page.tsx` (AIT-112) — eran los
  dos incumplimientos reales; los dos arreglados.

🚫 **Lo que este ADR NO autoriza:** resolver un inventario haciendo que los `catch` del
vigía de fondo también avisen. Eso cumple la letra y rompe el motivo.

**Nota de método para el próximo inventario:** clasificar por heurística de nombres falla
en las dos direcciones, medido en AIT-94. `setStarting(false)`/`setLoading(false)` parecen
avisos y solo apagan un spinner; `setStatus("unsupported")` no lo parece y sí avisa (se
renderiza como "No disponibles en este navegador"). Y `catch {` sin binding no lo encuentra
un patrón que busque `catch (`. **El script enumera; la clasificación se adjudica a mano.**

**Estado:** 🟢 Cerrada.

### ADR-0xx · Qué puede decirle al usuario un error del servidor — 2026-09-09 (AIT-111)

> Sin número, como los `ADR-0xx` anteriores de esta sección: inventar aquí uno que luego
> choque es peor que dejarlo pendiente con ellos. La renumeración de todos va aparte.

**Contexto:** el proyecto ya resolvía esto en cuatro sitios sin haberlo escrito nunca.
Cuatro funciones `describe*Error` (dos en `components/auth/PasswordResetDialog.tsx`, una en
`app/ajustes/page.tsx`, una en `app/oportunidades/[id]/page.tsx`) **leen** `err.message` y
ninguna lo **devuelve**. Enfrente, los dos diálogos de borrado de AIT-65 lo pasaban tal
cual — lo que AIT-94 declara como criterio de FALLA. Con la regla sin escribir, quien leía
el código concluía que estaba bien y quien leía AIT-94 concluía que había dos infracciones,
y nadie tenía dónde comprobarlo.

**Decisión:**

> `err.message` se puede **leer** para clasificar; no se puede **devolver**. Lo que se le
> enseña al usuario tiene que estar acotado por algo que declara el cliente.

Tres formas legítimas, las tres ya en uso:

- **constante del cliente** — se compara contra un marcador y se devuelve una frase escrita
  a mano (`describeResetRequestError`);
- **lista blanca del cliente** — `KNOWN_..._ERRORS.find((m) => err.message.includes(m))` y
  se devuelve *la cadena de la lista* (`describeCreateUserError`);
- **trozo acotado por un patrón del cliente** — `err.message.match(RE)` y se devuelve solo
  lo que el regex delimita (`describeQuoteError`).

**Lo que NO autoriza:** devolver `err.message` porque *parezca* escrito para el usuario. No
hay forma de distinguirlo de uno que se escapó, y los que se escapan traen cosas como éstas,
medidas en este proyecto el mismo día: `[CONVEX M(opportunities:reopen)] [Request ID:
8034d31a…]` (nombre interno de la función y un identificador de petición) y `Provider 'x' is
not configured, available providers are 'password', 'google'` (la lista de proveedores de
autenticación configurados).

**Si hace falta que el servidor diga algo concreto que el cliente no puede anticipar**, eso
es `ConvexError` — que hoy **no se usa en ningún sitio del proyecto**. Estrenarlo es una
decisión aparte, no una consecuencia de este ADR.

**Cómo se comprueba** (expectativa negativa, así que se cuenta, no se mira):

```bash
node scripts/check-error-message-leaks.mjs    # 0 = limpio, 1 = hay fugas
```

Ese script declara su propio alcance: detecta el patrón directo `setAlgoError(… err.message
…)` y no el que pasa por una variable intermedia. **Enumera; no decide.**

**Estado:** 🟢 Cerrada.

## 7. Decisiones abiertas

Ninguna a día de hoy. Las dos que figuraban aquí ya se resolvieron:

| # | Decisión | Resolución |
|---|---|---|
| 1 | Notificaciones push del PRD (Fase 3) | Cerrada para el MVP (AIT-18, Done): solo in-app, sin push real ni email. Push real quedó como mejora Post-MVP separada, ver AIT-57 (Backlog). |
| 2 | Portar el design system a componentes Tailwind reales | Cerrada — completado como parte de la construcción de las pantallas del MVP (AIT-9 y siguientes, todas Done). |

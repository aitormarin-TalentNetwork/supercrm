# 03 · Setup — levantar el proyecto desde cero

**Estado:** 🟢 Ejecutado. El proyecto arranca y habla con Convex.
Corresponde a la **Fase 1 · Fundamentos** de Linear (issue AIT-6).

Todos los comandos se lanzan **desde esta carpeta**.

| Paso | Estado |
|---|---|
| 1–2 · Proyecto Next.js en la raíz | 🟢 Hecho (Next 16.2.10, React 19, Tailwind 4) |
| 3 · Git | 🟢 `git init`, rama `main`, historial de commits en marcha |
| 4 · Convex | 🟢 Proyecto `vibecrm`, deployment `third-goldfinch-805` |
| 5 · Conectar Next.js con Convex | 🟢 `app/ConvexClientProvider.tsx` + prueba de humo OK |

**El deployment:** equipo `aitor-marin-6a254`, proyecto **`vibecrm`**.
[Dashboard](https://dashboard.convex.dev/t/aitor-marin-6a254/vibecrm/third-goldfinch-805/data) · `https://third-goldfinch-805.convex.cloud`

Las 7 tablas existen con sus índices y están **vacías**: los datos entran por la app, no por un seed.

---

## 0. Requisitos

- **Node.js 20+** (`node -v`).
- Cuenta en **Convex** (gratis, se crea con GitHub/Google en el primer `npx convex dev`).
- Cuenta en **Railway** para desplegar (ver ADR-002 en [`01-arquitectura.md`](01-arquitectura.md) — auto-deploy en cada push a `main`, no hace falta paso manual).

---

## ⚠️ Las dos trampas: la carpeta no está vacía

`create-next-app` **se niega a instalar en una carpeta que ya tiene archivos suyos**, y aquí ya tenemos `README.md`, `CLAUDE.md`, `Design/` y `docs/`. Y genera **su propio `README.md` y su propio `CLAUDE.md`**, que machacarían los nuestros.

Solución: instalar en una subcarpeta temporal y subir el contenido excluyendo esos dos ficheros. Es lo que hacen los pasos 1 y 2.

> La subcarpeta **no puede llamarse `_init`**: npm rechaza los nombres de paquete que empiezan por guion bajo. Usamos `init-tmp`.

---

## 1. Crear el proyecto Next.js

```bash
npx create-next-app@latest init-tmp \
  --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" \
  --turbopack --use-npm --skip-install --disable-git
```

- `--no-src-dir` → `app/` cuelga de la raíz, como dice [`01-arquitectura.md`](01-arquitectura.md).
- `--skip-install` y `--disable-git`: instalamos y hacemos `git init` luego, ya en la raíz.

## 2. Subir el contenido a la raíz y borrar la temporal

```bash
rsync -a --exclude README.md --exclude CLAUDE.md init-tmp/ ./
rm -rf init-tmp
```

Los dos `--exclude` protegen nuestro mapa del proyecto y nuestras reglas. Comprueba que ahora existen `package.json`, `app/`, `next.config.ts` y `tsconfig.json` en la raíz, y que `README.md` y `CLAUDE.md` **siguen siendo los nuestros**.

> **`AGENTS.md` sí se queda.** Lo genera `create-next-app` y avisa de que esta versión de Next (16) trae cambios de API respecto a lo que las IAs traen aprendido: ante la duda, mirar `node_modules/next/dist/docs/`. El `CLAUDE.md` que genera Next es solo la línea `@AGENTS.md`, por eso lo descartamos: el nuestro manda.

El paquete se llama `init-tmp` al nacer. Renómbralo en `package.json`:

```json
"name": "supercrm",
```

```bash
npm install
npm run dev   # → http://localhost:3000 debe mostrar la página de Next.js
```

> `app/`, `components/` y `lib/` **ya existen vacías** (con un `.gitkeep` dentro). `rsync` **fusiona** el contenido nuevo sobre ellas, no las borra: no hay conflicto. Los `.gitkeep` se pueden eliminar en cuanto la carpeta tenga código real.

## 3. Git

Esta carpeta **todavía no es un repositorio**.

```bash
git init
git add -A
git commit -m "Estructura inicial: docs, diseño y proyecto Next.js"
```

`create-next-app` ya trae un `.gitignore` con `node_modules`, `.next` y `.env*`. Verifica que `.env.local` **no** entra en el commit.

Repo remoto: usar la cuenta de Aitor (`aitormarin-TalentNetwork`). Nunca las orgs de empresa.

## 4. Convex

```bash
npm install convex
```

### ⚠️ La trampa: `npx convex dev` a pelo NO usa tu cuenta

Si no hay sesión previa, `npx convex dev` **no pide login**: monta un deployment **local y anónimo** en `127.0.0.1:3210` y sigue como si nada. Funciona para desarrollar, pero no está en tu cuenta, el dashboard sale como `null` y en la Fase 6 no habría nada que desplegar. La pista está en su propia salida:

```
▌ [Local] Port 3210 • No Convex account (run npx convex login to link to a project)
View the Convex dashboard at null
```

**Login primero, siempre.** Y si ya te pasó, `--configure=new` es obligatorio: sin él, Convex ve el `CONVEX_DEPLOYMENT=anonymous:…` que quedó en `.env.local` y se queda en el local.

```bash
npx convex login
npx convex dev --configure=new     # pregunta equipo y proyecto → llámalo supercrm
```

> **Desde el modo `!` de Claude Code** (terminal no interactiva) los prompts fallan con *"Cannot prompt for input"*. Hay que pasarlo todo por flags:
> ```bash
> npx convex login --device-name "Mac de Aitor" --login-flow poll --no-open
> npx convex dev --configure=new --team <tu-equipo> --project supercrm
> ```
> `npx convex login status` te dice el slug del equipo. El login imprime un enlace `auth.convex.dev/device?user_code=…` que **caduca en 5 minutos**.

Comprueba que `.env.local` apunta a la nube (`https://….convex.cloud`) y **no** a `127.0.0.1`.

**Déjalo corriendo en una terminal aparte mientras desarrollas**: vigila la carpeta `convex/` y sube los cambios de schema y funciones al instante. Son **dos procesos a la vez**: `npm run dev` (Next.js) y `npx convex dev` (Convex).

## 5. Conectar Next.js con Convex

Un provider en cliente que envuelve toda la app:

```tsx
// app/ConvexClientProvider.tsx
"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    "Falta NEXT_PUBLIC_CONVEX_URL. La escribe `npx convex dev` en .env.local: déjalo corriendo en otra terminal.",
  );
}

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```

Y en `app/layout.tsx`, envolver `{children}` con `<ConvexClientProvider>`.

> El `throw` no es paranoia: sin la variable, `ConvexReactClient` fallaría más adelante con un error opaco. Así el mensaje dice exactamente qué falta y cómo arreglarlo. **La app no arranca hasta que `npx convex dev` haya escrito el `.env.local`.**

**Prueba de humo:** crea el `schema.ts` de [`02-modelo-de-datos.md`](02-modelo-de-datos.md), añade una query trivial, píntala en una página y comprueba que se ve. Si eso funciona, la Fase 1 está en marcha.

## 6. Configurar Convex Auth (AIT-8, Google añadido en paralelo desde AIT-60)

**⚠️ La trampa que cuesta más detectar de todas:** sin esto, el login **falla silenciosamente** — el proveedor `Password` valida bien las credenciales (o Convex Auth valida bien el intercambio con Google), pero al generar el token de sesión revienta con `Missing environment variable JWT_PRIVATE_KEY` y el cliente lo confunde con un simple "credenciales incorrectas". No hay pista visual de que sea un problema de configuración, no de contraseña.

```bash
npm install @convex-dev/auth@0.0.94 @auth/core@0.41.3   # versión exacta, la librería está en beta
npx @convex-dev/auth
```

El asistente de `npx @convex-dev/auth` hace, en el deployment de Convex (no en `.env.local`):
- `SITE_URL` — necesario aunque no haya OAuth.
- `JWT_PRIVATE_KEY` / `JWKS` — el par de claves con el que Convex Auth firma los tokens de sesión. **Sin esto, ningún login funciona nunca**, con independencia del provider.

Las 2 cuentas de prueba originales (`marta@supercrm.es`/`carlos@supercrm.es`, AIT-8) ya viven en el deployment desde que se crearon una vez con `createAccount` + estas 2 variables (`convex/users.ts:bootstrapInitialAccounts` sin argumentos ya NO las recrea — desde AIT-60 crea las cuentas Google, ver §6bis; para levantar un deployment nuevo de cero necesitando también cuentas de contraseña haría falta un `createAccount` manual con el mismo patrón). En un deployment ya en marcha (el caso normal) no hace falta volver a ejecutar nada de esto — solo puestas a mano si arrancas de cero:

```bash
npx convex env set SEED_OWNER_PASSWORD <contraseña-owner>
npx convex env set SEED_SALES_PASSWORD <contraseña-sales>
```

Y en `.env.local` (frontend, para el autorrelleno de "cuentas de prueba" en `/login` — solo se usa si `NODE_ENV !== "production"`):

```
NEXT_PUBLIC_DEMO_OWNER_PASSWORD=<mismo valor que SEED_OWNER_PASSWORD>
NEXT_PUBLIC_DEMO_SALES_PASSWORD=<mismo valor que SEED_SALES_PASSWORD>
```

**Verificación (Password):** iniciar sesión en `/login` con `marta@supercrm.es` (owner) o `carlos@supercrm.es` (sales), contraseña la que hayas puesto en `SEED_*_PASSWORD`. Si falla con "Email o contraseña incorrectos" aun con la contraseña correcta, revisa los logs de `npx convex dev` — el mensaje real (`JWT_PRIVATE_KEY`, `InvalidSecret`, etc.) sale ahí, no en el navegador.

### 6bis. Credenciales de Google OAuth (AIT-60 — añadido EN PARALELO al de arriba)

Desde AIT-60, además del login por contraseña, existe un botón "Continuar con Google" en `/login` — ninguno sustituye al otro. Hace falta un proyecto en [Google Cloud Console](https://console.cloud.google.com/apis/credentials) con credenciales OAuth 2.0 tipo "Aplicación web":

- **URI de redirección autorizado:** `https://<CONVEX_SITE_URL>/api/auth/callback/google` (hoy, en dev: `https://third-goldfinch-805.convex.site/api/auth/callback/google` — `CONVEX_SITE_URL` es el dominio `.convex.site`, no el `.convex.cloud` de `NEXT_PUBLIC_CONVEX_URL`).
- Da de alta el Client ID/Secret en el deployment de Convex (nombres exactos que espera `@auth/core`, no elegibles):

```bash
npx convex env set AUTH_GOOGLE_ID <client-id>
npx convex env set AUTH_GOOGLE_SECRET <client-secret>
```

No hace falta nada en `.env.local`: el intercambio OAuth entero (redirect, callback, token) vive en el deployment de Convex, nunca en el navegador ni en el frontend.

**Alta de cuentas Google — lista blanca, no registro público:** una cuenta de Google, por sí sola, nunca entra — `convex/auth.ts:createOrUpdateUser` rechaza cualquier email sin una fila previa en `users` (mensaje: *"La cuenta de Google … no tiene acceso"*). El alta real la hace la dueña desde Ajustes (`convex/users.ts:createUser`, sin contraseña — solo aplica a cuentas Google, ver ADR-003), o el bootstrap inicial de las 2 cuentas reales del negocio:

```bash
npx convex run users:bootstrapInitialAccounts '{}'   # una sola vez; re-ejecutarlo es seguro (idempotente)
```

Sin argumentos, crea (si no existen ya) `admin@talent-network.org` (owner) y `aitor.marin@talent-network.org` (sales) en "Tienda principal" — **conviven** con `marta@supercrm.es`/`carlos@supercrm.es`, no las sustituyen. Con `{stores: [...]}` acepta más tiendas/cuentas Google — ver la propia función en `convex/users.ts` para la forma exacta del argumento.

**Verificación (Google):** entrar en `/login`, pulsar "Continuar con Google" y comprobar que el navegador llega de verdad a la pantalla de consentimiento de Google (no un error `invalid_client` — eso significa que `AUTH_GOOGLE_ID` no está puesto o no coincide con el proyecto de Google Cloud) y que, tras elegir una cuenta con acceso (`admin@talent-network.org` o `aitor.marin@talent-network.org`), vuelve autenticado a la app con el rol correcto. Con una cuenta de Google SIN alta previa en `users`, debe volver a `/login` sin sesión y sin alta automática — comprobar en los logs de `npx convex dev` que se ve el rechazo de `createOrUpdateUser`, ya que el navegador no muestra el motivo exacto (ver ADR-003, limitación conocida).

**✅ Verificado end-to-end en vivo (2026-08-25):** los 3 casos de arriba (owner, sales, cuenta sin acceso) funcionan tal como se describe, más el camino Password (`marta@supercrm.es`) confirmado sin cambios. **Hallazgo real durante esta verificación:** el primer intento falló con un error genérico en el intercambio de token, indistinguible en el navegador/logs de Convex de un problema de nuestro propio `createOrUpdateUser` (el rechazo por lista blanca y el fallo de intercambio de token dan el mismo mensaje al usuario). Causa real: `AUTH_GOOGLE_SECRET` en Convex no coincidía con el secret vigente en Google Cloud Console para ese Client ID (aunque el Client ID sí coincidía — comprobado comparando solo los últimos caracteres de cada lado, nunca el valor completo, per la regla de no volcar secretos). Si esto se repite: comprobar primero que el Client ID coincide (es público, seguro de comparar entero) y, si coincide pero el login sigue fallando en el intercambio de token, sospechar del secret antes que del código — regenerarlo en Google Cloud Console y volver a ponerlo con `npx convex env set AUTH_GOOGLE_SECRET`.

## 7. Web Push (AIT-57, Post-MVP)

Avisos push reales (pasos vencidos y oportunidades en riesgo, con la app cerrada) — ver `convex/webPush.ts` (envío), `convex/pushInternal.ts` (candidatos), `convex/pushSubscriptions.ts` (alta/baja desde el cliente) y `convex/crons.ts` (dispara el envío cada hora).

```bash
npm install web-push   # ya en package.json — solo si partes de cero
npx web-push generate-vapid-keys --json
```

Del resultado:

```bash
npx convex env set VAPID_PUBLIC_KEY <publicKey>
npx convex env set VAPID_PRIVATE_KEY <privateKey>
npx convex env set VAPID_SUBJECT "mailto:<tu-email>"
```

Y en `.env.local` (frontend, la Push API la necesita para suscribirse — es la **pública**, sin secretos):

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<la misma publicKey de arriba>
```

**Verificación:** `/ajustes` → "Notificaciones push" → Activar (el navegador pide permiso — solo lo puede conceder una persona real, no es automatizable). El envío real solo se puede probar en un dominio HTTPS real o `localhost` (la Push API lo exige); Railway ya sirve por HTTPS, así que en producción funciona sin nada más que configurar las 3 variables del deployment.

⚠️ `VAPID_PRIVATE_KEY` nunca va en `.env.local` ni con el prefijo `NEXT_PUBLIC_` — es la clave con la que se firman los envíos, si llega al navegador cualquiera podría enviar avisos suplantando al servidor.

## 8. Producción tiene su propio deployment de Convex (AIT-59)

**Ver ADR-004 en [`01-arquitectura.md`](01-arquitectura.md) para el porqué.** Resumen
operativo: `third-goldfinch-805` sigue siendo el deployment de desarrollo/test
compartido de las 3 terminales (nada cambia ahí). Producción usa uno propio,
`stoic-impala-857` — ya provisionado por Convex junto al de dev, no hubo que crear nada.

**Cómo se despliega a producción:** nunca `npx convex dev` (eso es solo desarrollo).
Railway ejecuta `npx convex deploy` en su propio build, cada vez que hay un push a
`main` — no hace falta ningún paso manual (Tanda 2 de AIT-59 ya activa, ver ADR-004 y
`checklist-produccion-real.md`, en `Sorfware Factory/`). El "Build Command" real,
fijado en el dashboard de Railway (Settings → Build del servicio `supercrm` — no
versionable, ver ADR-004):

```
npx convex deploy --cmd "npm run build" --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL
```

**⚠️ Comillas dobles, no simples — hallazgo real de la implementación.** El patrón
oficial de los docs de Convex usa comillas simples (`--cmd 'npm run build'`), pero el
campo "Build Command" del dashboard de Railway NO respeta el agrupamiento de comillas
simples al construir el comando — el build falló en la práctica (`npx convex deploy`
solo recibió "npm" como valor de `--cmd`, sin "run build", y `npm` sin subcomando
falla). Con comillas dobles, el mismo comando funciona correctamente. Si algún día hay
que tocar este campo de nuevo, usar comillas dobles, y verificar el resultado con
`railway logs --build <deployment-id>` antes de dar el cambio por bueno — no basta con
que el build salga en verde en el dashboard.

Si hace falta desplegar a `stoic-impala-857` a mano (por ejemplo, para verificarlo
antes de un cambio), `npx convex deploy` resuelve el destino solo al deployment de
producción por defecto del proyecto — **no admite el flag `--prod`** (a diferencia de
`env`/`run`/`@convex-dev/auth`, que sí lo admiten); comprueba el nombre del deployment
que el propio comando imprime en su cabecera antes de aceptar el push.

**`CONVEX_DEPLOY_KEY`:** el equivalente a una contraseña de servicio para que Railway (o
cualquier CI) pueda desplegar sin sesión interactiva. Ya está puesta en Railway (variable
del servicio `supercrm`, generada al ejecutar la Tanda 2 de AIT-59, justo antes de
pegarla ahí — no la entregó la Tanda 1 pese a que el plan original la situaba ahí; ver
ADR-004 §Consecuencias para el porqué). Si hiciera falta regenerarla en el futuro (por
ejemplo, tras rotarla), se genera por CLI, no por dashboard:

```bash
npx convex deployment token create <nombre> --deployment prod --save-env <fichero>
```

Con `--save-env` el valor se escribe directamente en un fichero, nunca se imprime en la
terminal — es un secreto, mismo criterio que cualquier otro (`CLAUDE.md`). Genéralo
fresco justo antes de configurarlo donde vaya a usarse (por ejemplo, en Railway) en vez
de guardarlo de antemano — minimiza cuánto tiempo vive un secreto de producción fuera de
donde se usa de verdad. `npx convex deployment token delete <nombre> --prod` lo revoca
si deja de hacer falta.

**Nota sobre `npx convex deploy` desde un worktree local:** si `.env.local` tiene
`CONVEX_DEPLOYMENT` puesto (el caso normal de cualquier terminal de desarrollo), el
propio comando pide confirmación interactiva antes de empujar a producción — no hay
forma de saltarse ese prompt con variables de entorno adicionales (`CI=true`, exportar
`CONVEX_DEPLOY_KEY`, etc. no lo evitan, comprobado en la práctica). La única forma de
desplegar sin esa confirmación desde un worktree con `.env.local` de dev es usar
`--env-file <fichero-con-solo-CONVEX_DEPLOY_KEY>`, que aísla el comando de la
`CONVEX_DEPLOYMENT` local — es justo lo que hace Railway automáticamente, porque su
entorno de build nunca tiene un `.env.local` con `CONVEX_DEPLOYMENT` de por medio.

---

## Variables de entorno

Las escribe Convex solo. **Nunca se commitean.**

| Variable | Dónde | Qué es |
|---|---|---|
| `CONVEX_DEPLOYMENT` | `.env.local` | El deployment de desarrollo. |
| `NEXT_PUBLIC_CONVEX_URL` | `.env.local` | La URL que usa el navegador. `NEXT_PUBLIC_` = pública, no meter secretos con ese prefijo. |
| `NEXT_PUBLIC_DEMO_OWNER_PASSWORD`, `NEXT_PUBLIC_DEMO_SALES_PASSWORD` | `.env.local` | Autorrelleno de "cuentas de prueba" en `/login`, solo fuera de producción (ver AIT-9). |
| `JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL` | Deployment de Convex (`npx convex env`, no `.env.local`) | Firma de tokens de sesión de Convex Auth. Las escribe `npx @convex-dev/auth`. |
| `SEED_OWNER_PASSWORD`, `SEED_SALES_PASSWORD` | Deployment de Convex (`npx convex env`) | Contraseñas de `marta@supercrm.es`/`carlos@supercrm.es` — usadas por el bootstrap original de AIT-8 para crearlas (ya hecho, viven en el deployment desde entonces). Desde AIT-60, `bootstrapInitialAccounts` sin argumentos ya NO recrea estas 2 cuentas (solo crea las de Google, ver más abajo) — para levantar el proyecto de cero necesitando también las cuentas de contraseña, hace falta un `createAccount` manual con estas contraseñas (mismo patrón que el bootstrap original, no automatizado hoy). |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Deployment de Convex (`npx convex env`) | Credenciales OAuth de Google Cloud Console (AIT-60, añadido en paralelo a lo de arriba) — `@auth/core` las lee por convención, nombre fijo. Ver §6bis. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `.env.local` | Clave pública VAPID (AIT-57, Web Push) — pública, sin secretos. |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Deployment de Convex (`npx convex env`) | Firma y envío de Web Push (`convex/webPush.ts`). La privada nunca sale del deployment de Convex — ver §7. |
| `CONVEX_DEPLOY_KEY` | Railway (variable del servicio, **nunca** `.env.local`) | Contraseña de servicio para que `npx convex deploy` publique a `stoic-impala-857` sin sesión interactiva (AIT-59, ver §8 y ADR-004). Se genera fresco por CLI justo antes de usarse. |

## Comandos del día a día

| Comando | Qué hace |
|---|---|
| `npm run dev` | Next.js en `localhost:3000` |
| `npx convex dev` | Convex en modo watch (**en otra terminal, a la vez**) |
| `npx convex dashboard` | Abre el panel de Convex: ver tablas, datos y logs |
| `npm run build` | Comprueba que compila de verdad antes de desplegar |

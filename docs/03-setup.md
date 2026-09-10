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

Las 2 cuentas de prueba originales (`marta@supercrm.es`/`carlos@supercrm.es`, AIT-8) ya viven en el deployment desde que se crearon una vez con `createAccount` + estas 2 variables (`convex/users.ts:bootstrapInitialAccounts` sin argumentos ya NO las recrea — desde AIT-60 crea las cuentas Google, ver §6bis; para levantar un deployment nuevo de cero necesitando también cuentas de contraseña haría falta un `createAccount` manual con el mismo patrón). En un deployment ya en marcha (el caso normal) no hace falta volver a ejecutar nada de esto — solo puestas a mano si arrancas de cero. **Y si la cuenta YA existe pero su contraseña no coincide con la de estas variables** —el login falla con `InvalidSecret`, no con `InvalidAccountId`— eso no se arregla poniéndolas otra vez: ver **§6quater**.

```bash
npx convex env set SEED_OWNER_PASSWORD <contraseña-owner>
npx convex env set SEED_SALES_PASSWORD <contraseña-sales>
```

Y en `.env.local` (frontend, para el autorrelleno de "cuentas de prueba" en `/login`):

⚠️ **Ojo, esto de aquí decía que el bloque "solo se usa si `NODE_ENV !== \"production\"`" y era falso** (comprobado el 2026-09-08 pidiendo el HTML de producción sin sesión: la contraseña sale entera en la página pública). `app/login/page.tsx` lo pinta **siempre**, y es una decisión explícita del proyecto —hoy no hay datos reales y evita ir a buscar credenciales cada vez—, no un descuido. Está recogida en el `checklist de salida a producción real`: cuando lleguen clientes de verdad hay que **rotar** esas contraseñas y **retirar** el bloque, en ese orden.

```
NEXT_PUBLIC_DEMO_OWNER_PASSWORD=<mismo valor que SEED_OWNER_PASSWORD>
NEXT_PUBLIC_DEMO_SALES_PASSWORD=<mismo valor que SEED_SALES_PASSWORD>
```

**Verificación (Password):** iniciar sesión en `/login` con `marta@supercrm.es` (owner) o `carlos@supercrm.es` (sales), contraseña la que hayas puesto en `SEED_*_PASSWORD`. Si falla con "Email o contraseña incorrectos" aun con la contraseña correcta, revisa los logs de `npx convex dev` — el mensaje real (`JWT_PRIVATE_KEY`, `InvalidSecret`, etc.) sale ahí, no en el navegador.

### 6bis. Credenciales de Google OAuth (AIT-60 — añadido EN PARALELO al de arriba)

Desde AIT-60, además del login por contraseña, existe un botón "Continuar con Google" en `/login` — ninguno sustituye al otro. Hace falta un proyecto en [Google Cloud Console](https://console.cloud.google.com/apis/credentials) con credenciales OAuth 2.0 tipo "Aplicación web":

**Qué proyecto de Google Cloud es (verificado en consola el 2026-09-08, AIT-90):**

| | |
|---|---|
| **Proyecto** | `supercrm-506513` (número `164759808809`) |
| **Organización** | `talent-network.org` (el Workspace) |
| **Administrador** | Aitor (`aitor.marin@talent-network.org`) |
| **Tipo de usuario** | **Interno** — solo cuentas del Workspace |
| **Clientes OAuth** | uno solo: **"SuperCRM Web"** (creado 2026-08-24), el del login. `AUTH_GOOGLE_ID` es su Client ID. |

⚠️ **No confundirlo con `model-nexus-506915-n9`** ("My First Project"), que existe en la
misma cuenta y no tiene nada que ver con el CRM. Es el que sale por defecto al abrir la
consola, y ya se ha entrado en él por error una vez.

**La app se pasó de Externa/Testing a INTERNA el 2026-09-08** (AIT-90) para poder pedir
`gmail.readonly` sin auditoría CASA. Efectos colaterales, que alcanzan también al login
porque **la pantalla de consentimiento es del proyecto entero, no de cada cliente**:
desaparecen el modo Testing, el tope de 100 usuarios y la lista de cuentas de prueba, y
**solo pueden entrar cuentas de `talent-network.org`**. Hoy eso no deja fuera a nadie
—`admin@` y `aitor.marin@` son las dos únicas cuentas Google dadas de alta, ambas del
dominio—, pero **si algún día hay que dar acceso por Google a alguien de fuera del
dominio, esto es lo que hay que revertir** (y con ello vuelve la exigencia de auditoría
para Gmail).

**El cliente OAuth de Gmail ya existe** (creado el 2026-09-08, AIT-90). Es un cliente
**aparte** del login: añadirle permisos de Gmail al del login cambiaría la pantalla de
consentimiento de todo el mundo al entrar en la aplicación.

| | |
|---|---|
| **Nombre** | `SuperCRM Gmail` (no confundir con `SuperCRM Web`, que es el del login) |
| **Client ID** | `164759808809-ds444hc2bf8511to729uka15kb13cd88.apps.googleusercontent.com` |
| **Client Secret** | en Bitwarden. **No** está puesto en ningún deployment todavía |
| **Permiso** | `gmail.readonly` y solo ese |
| **Ruta de callback** | `/gmail/oauth/callback`, en `convex/http.ts` (AIT-92) |

**Cinco URIs de redirección registradas**, una por deployment de Convex. Tienen que ser
`.convex.site` (nunca `.convex.cloud`) porque el intercambio de token ocurre en Convex: el
token de refresco no puede pasar por el navegador.

```
https://stoic-impala-857.convex.site/gmail/oauth/callback     produccion
https://third-goldfinch-805.convex.site/gmail/oauth/callback  dev compartido
https://uncommon-puffin-303.convex.site/gmail/oauth/callback  T1
https://healthy-mammoth-850.convex.site/gmail/oauth/callback  T2
https://colorful-crane-322.convex.site/gmail/oauth/callback   QA
```

⚠️ **Esta lista caduca sola: cada deployment de Convex nuevo necesita la suya.** Si creas
uno y el flujo de conexión de Gmail te falla, el error lo da Google y **no señala a
nuestro código** — mira aquí antes de depurar nada. Añadir una URI es gratis y no hace
falta recrear el cliente.

**✅ Premisa validada en vivo (2026-09-08):** se abrió la pantalla de consentimiento real
pidiendo `gmail.readonly` con una cuenta del dominio, y Google la concede **sin ninguna
advertencia de verificación y sin exigir la auditoría CASA** — que era el riesgo que podía
tumbar la Ola 2 entera. Es consecuencia directa de que la app sea **Interna**: si algún día
vuelve a Externa, esto deja de ser cierto.


- **URI de redirección autorizado:** `https://<CONVEX_SITE_URL>/api/auth/callback/google` (hoy, en dev: `https://third-goldfinch-805.convex.site/api/auth/callback/google` — `CONVEX_SITE_URL` es el dominio `.convex.site`, no el `.convex.cloud` de `NEXT_PUBLIC_CONVEX_URL`).
- Da de alta el Client ID/Secret en el deployment de Convex (nombres exactos que espera `@auth/core`, no elegibles):

```bash
npx convex env set AUTH_GOOGLE_ID <client-id>
npx convex env set AUTH_GOOGLE_SECRET <client-secret>
```

No hace falta nada en `.env.local`: el intercambio OAuth entero (redirect, callback, token) vive en el deployment de Convex, nunca en el navegador ni en el frontend.

**Google es la ÚNICA forma de entrar para las cuentas reales del negocio, y es una
decisión tomada** (Aitor, 2026-09-09, AIT-113). `admin@talent-network.org` y
`aitor.marin@talent-network.org` **no tienen contraseña** — su alta se hace sin ella
(ADR-003) — así que:

- **Si el login con Google falla, esas dos cuentas no entran.** No hay segunda vía.
- **"¿Olvidaste la contraseña?" tampoco sirve**: no hay credencial que recuperar, así que
  el reseteo falla por el mismo motivo que el login.
- `marta@supercrm.es` y `carlos@supercrm.es` **sí** tienen contraseña, pero son cuentas
  **de prueba**: que funcionen no da acceso a nadie del negocio.

**Por qué se acepta**: el Workspace lo administra Aitor, una caída de Google es rara y
pasajera, y **la alternativa abre una puerta que hoy no existe** — dar contraseña a la
cuenta `owner` del CRM la vuelve atacable por contraseña, y ese riesgo está encendido
siempre, mientras que el que cubriría solo aparece si Google se cae.

**Esto NO es un descuido pendiente de arreglar.** Si alguien propone dar contraseña a esas
cuentas, esta es la decisión que tiene que reabrir, no un hueco que tapar.

**Alta de cuentas Google — lista blanca, no registro público:** una cuenta de Google, por sí sola, nunca entra — `convex/auth.ts:createOrUpdateUser` rechaza cualquier email sin una fila previa en `users` (mensaje: *"La cuenta de Google … no tiene acceso"*). El alta real la hace la dueña desde Ajustes (`convex/users.ts:createUser`, sin contraseña — solo aplica a cuentas Google, ver ADR-003), o el bootstrap inicial de las 2 cuentas reales del negocio:

```bash
npx convex run users:bootstrapInitialAccounts '{}'   # una sola vez; re-ejecutarlo es seguro (idempotente)
```

Sin argumentos, crea (si no existen ya) `admin@talent-network.org` (owner) y `aitor.marin@talent-network.org` (sales) en "Tienda principal" — **conviven** con `marta@supercrm.es`/`carlos@supercrm.es`, no las sustituyen. Con `{stores: [...]}` acepta más tiendas/cuentas Google — ver la propia función en `convex/users.ts` para la forma exacta del argumento.

**Verificación (Google):** entrar en `/login`, pulsar "Continuar con Google" y comprobar que el navegador llega de verdad a la pantalla de consentimiento de Google (no un error `invalid_client` — eso significa que `AUTH_GOOGLE_ID` no está puesto o no coincide con el proyecto de Google Cloud) y que, tras elegir una cuenta con acceso (`admin@talent-network.org` o `aitor.marin@talent-network.org`), vuelve autenticado a la app con el rol correcto. Con una cuenta de Google SIN alta previa en `users`, debe volver a `/login` sin sesión y sin alta automática — comprobar en los logs de `npx convex dev` que se ve el rechazo de `createOrUpdateUser`, ya que el navegador no muestra el motivo exacto (ver ADR-003, limitación conocida).

**✅ Verificado end-to-end en vivo (2026-08-25):** los 3 casos de arriba (owner, sales, cuenta sin acceso) funcionan tal como se describe, más el camino Password (`marta@supercrm.es`) confirmado sin cambios. **Hallazgo real durante esta verificación:** el primer intento falló con un error genérico en el intercambio de token, indistinguible en el navegador/logs de Convex de un problema de nuestro propio `createOrUpdateUser` (el rechazo por lista blanca y el fallo de intercambio de token dan el mismo mensaje al usuario). Causa real: `AUTH_GOOGLE_SECRET` en Convex no coincidía con el secret vigente en Google Cloud Console para ese Client ID (aunque el Client ID sí coincidía — comprobado comparando solo los últimos caracteres de cada lado, nunca el valor completo, per la regla de no volcar secretos). Si esto se repite: comprobar primero que el Client ID coincide (es público, seguro de comparar entero) y, si coincide pero el login sigue fallando en el intercambio de token, sospechar del secret antes que del código — regenerarlo en Google Cloud Console y volver a ponerlo con `npx convex env set AUTH_GOOGLE_SECRET`.

### 6ter. Recuperación de contraseña vía Resend (AIT-62)

Completa el enlace "¿Olvidaste tu contraseña?" de `/login` (AIT-63, frontend) —
`convex/ResendOTPPasswordReset.ts`/`convex/auth.ts` (ver ADR-005). Solo afecta al
provider `Password`.

- **API key:** [dashboard de Resend](https://resend.com/api-keys) → crear API key →
  `npx convex env set RESEND_API_KEY <api-key>`.
- **Remitente — ⚠️ trampa conocida:** con el dominio de prueba de Resend
  (`onboarding@resend.dev`) solo se puede entregar al email del propio dueño de la
  cuenta Resend — NO sirve para probar el envío contra `marta@supercrm.es` ni ninguna
  otra cuenta real del proyecto. Antes de poder verificar el criterio de aceptación
  "dispara un email real", hace falta verificar un dominio propio en el dashboard de
  Resend y dar de alta un remitente de ese dominio:
  `npx convex env set RESEND_FROM_EMAIL <remitente@dominio-verificado>`.
- Sin `RESEND_API_KEY`/`RESEND_FROM_EMAIL`, el fallo ocurre en el punto esperado (al
  intentar enviar, con un mensaje claro de configuración), no antes — se puede
  desarrollar y probar todo lo demás (la distinción de método de login, el rechazo de
  código incorrecto/caducado, el rate-limit) sin tenerlas puestas.

**Verificación:** pedir un reseteo real desde `/login` (o `npx convex run auth:signIn
'{"provider":"password","params":{"flow":"reset","email":"marta@supercrm.es"}}'`) y
comprobar que llega un email real con un código de 6 dígitos, válido 15 minutos.

**Consecuencia operativa:** al mergear a `main`, `RESEND_API_KEY` y
`RESEND_FROM_EMAIL` hacen falta TAMBIÉN en el deployment de producción
(`stoic-impala-857`), no solo en desarrollo — si no, el reseteo de contraseña
quedaría roto en producción real aunque funcione en dev (mismo patrón que otras
variables de entorno nuevas de este proyecto, ver ADR-004).

### 6quater. Rehacer la contraseña de una cuenta que YA existe (AIT-102)

**A quién aplica, y va primero para que nadie lo lea al revés.** Esto vale para las
**cuentas de prueba** (`marta@supercrm.es`, `carlos@supercrm.es`). Las cuentas reales del
negocio **entran por Google y no tienen contraseña, por decisión de Aitor** (AIT-113, ver
más arriba en este mismo documento). **Esto no es la receta para dárselas:** si alguien lo
propone, lo que tiene que reabrir es esa decisión.

**El problema que resuelve.** La credencial vive en `authAccounts` desde el día en que la
cuenta se creó, y **nada la actualiza después**. Si la contraseña real ya no coincide con
la documentada, el login falla con `InvalidSecret` — no con `InvalidAccountId`: **la cuenta
existe, lo que no casa es la contraseña.**

**Las tres vías que NO sirven**, y conviene saberlo antes de perder media hora:

- **El dashboard de Convex** guarda el *hash*, no la contraseña. No hay campo que editar.
- **Cambiar `SEED_OWNER_PASSWORD`/`SEED_SALES_PASSWORD`** no hace nada: **ya no las lee
  nadie** (ver AIT-99). Cambiar la variable no toca una credencial ya creada.
- **"¿Olvidaste la contraseña?"** manda un código a `marta@supercrm.es`, un dominio
  inventado sin buzón.

**Cómo se hace.** Una función interna **de un solo uso**, que se despliega, se ejecuta y
**se retira en la misma sesión** — una función capaz de reescribir credenciales no se queda
viviendo en un deployment compartido:

1. **Coge el turno de Convex** si el deployment es compartido (`_turno-convex.lock`), y
   **avisa a quien lo comparta antes de tocar nada**: al cambiar la credencial, su
   `.env.local` deja de servir hasta que copie las `NEXT_PUBLIC_DEMO_*` nuevas.
2. **Sincroniza tu deployment con tu código** (`npx convex dev --once`) y **compara las dos
   listas de funciones desplegadas**:
   ```bash
   npx convex function-spec | grep -oE '"identifier": "[^"]+"' | sort -u > /tmp/A
   npx convex function-spec --deployment <destino> | grep -oE '"identifier": "[^"]+"' | sort -u > /tmp/B
   comm -13 /tmp/A /tmp/B     # lo que tu despliegue RETIRARÍA: debe salir VACÍO
   ```
   Si no sale vacío, **para**: hay funciones desplegadas desde otra rama y tu `convex dev`
   se las llevaría. Comparar tu *checkout* con git **no vale**: el riesgo está en el
   deployment, no en el código.
3. **Escribe la función** con `modifyAccountCredentials` (la misma que usa el flujo de
   recuperación en `convex/auth.ts`), leyendo el secreto de `process.env` **dentro del
   deployment** — nunca por argumento — y devolviendo **un recuento**, nunca un valor.
   **Valida las dos cuentas y las dos variables ANTES de la primera escritura**: cambiar
   una y fallar en la otra deja el deployment en un estado que no describe ninguna
   documentación.
4. **Despliega y ejecuta.** `convex dev` **no acepta `--deployment`**: el destino sale de
   `CONVEX_DEPLOYMENT`, así que se sobreescribe **solo para ese proceso**
   (`CONVEX_DEPLOYMENT=dev:<destino> npx convex dev --once`). **Comprueba el destino con un
   comando de LECTURA antes de escribir con él** — un `function-spec` con el override debe
   devolver el número de funciones del destino, no el tuyo.
5. **Retira la función, redespliega, y comprueba la ausencia con control positivo**: que la
   función ya no esté Y que otra que sí debe estar (`users:createUser`) siga apareciendo.
   Un "no aparece" sin control no distingue "se retiró" de "consulté mal".
6. **Solo entonces suelta el turno.** Si la limpieza falla: **para, escala y mantén el
   turno cogido.** Un recurso bloqueado es un problema visible; una función capaz de
   reescribir credenciales viviendo en un deployment compartido, no.

⚠️ **El flag va SIN el prefijo `dev:`**: `--deployment third-goldfinch-805`. Con
`--deployment dev:third-goldfinch-805` el CLI responde **`You don't have access to the
selected project`**, que se lee como un problema de permisos **y es de formato del
argumento**.

⚠️ **Nada de trazas ni capturas mientras verificas.** La pantalla de login **imprime la
contraseña en claro** (bloque "Cuentas de prueba", decisión explícita del proyecto), y
Playwright escribe `trace.zip` y `error-context.md` **automáticamente al fallar un test**,
con el DOM dentro y sin censurar valores. Corre con `--trace off`.

**Y `NEXT_PUBLIC_DEMO_*` tiene que llevar el mismo valor que `SEED_*`.** Son dos parejas de
variables en dos sitios distintos —el deployment y el `.env.local`— y **nada obliga a que
coincidan**. Descuadrarlas produce exactamente este mismo síntoma.

#### Cómo saber que el problema es ÉSTE y no otro

Cuatro causas distintas producen "el login falla" y **ninguna lo dice**. Se distinguen por
**el momento**, no por el mensaje — y eso se comprueba mirando dónde paró la corrida:

| Causa | Firma |
|---|---|
| **Credencial cambiada** (esta sección) | `InvalidSecret`. Muere en `globalSetup`: **la corrida ni empieza** |
| **Cupo de intentos agotado** | `TooManyFailedAttempts`. Deja rastro en `authRateLimits` |
| **Sesión muerta** | Sin rastro. Manda a `/login` con los tests ya corriendo |
| **Instantánea de sesión vacía** | Sin rastro. Manda a `/login`. ~267 bytes en `e2e/.auth/*.json` — y **correr un test suelto la repara**, así que comprobarlo destruye la evidencia |

**La cuenta no existe** es otra cosa distinta: da `InvalidAccountId`, no `InvalidSecret`.
Si es eso, no es esta sección — es la siembra de un deployment nuevo (AIT-99).

### 6quinquies. Cliente OAuth de Gmail y cifrado del token (AIT-92, Ola 2)

**Es un cliente OAuth DISTINTO del de §6bis**, que es el del login. Comparten
proyecto de Google Cloud y pantalla de consentimiento —así que lo de §6bis sobre
la app Interna aplica también aquí— pero **ni las credenciales ni las URIs de
redirección se pueden cruzar**. Si has llegado buscando "las variables de Gmail",
las de §6bis **no** son tuyas.

> ⚠️ **Va como §6quinquies y no como §6quater a propósito.** El §6quater ya
> existe y trata de *rehacer la contraseña de una cuenta que ya existe*, y hay
> **dos remisiones a él** (líneas de `SEED_*` y del bootstrap) que hablan de
> contraseñas. Numerar esto como §6quater mandaría a quien busca cómo rehacer
> una contraseña a leer sobre OAuth — sin romper nada, sin dar error, y sin que
> nadie vuelva a comprobar un número de sección.

**Los tres nombres canónicos, y no hay más:**

| Variable | Dónde | Para qué |
| -- | -- | -- |
| `GMAIL_CLIENT_ID` | Deployment de Convex | Cliente OAuth «SuperCRM Gmail» |
| `GMAIL_CLIENT_SECRET` | Deployment de Convex | idem |
| `GMAIL_TOKEN_ENCRYPTION_KEY` | Deployment de Convex | Cifra el token de refresco guardado en `gmailAccounts` |

> ⛔ **ENCLAVAMIENTO — NO PONGAS ESTAS TRES VARIABLES EN PRODUCCIÓN HASTA QUE
> AIT-145 ESTÉ CERRADA.** (Integrador, 2026-09-10, al publicar AIT-92.)
>
> **AIT-145** — *«el consentimiento de Gmail se puede vincular al usuario
> equivocado: la víctima acepta y su buzón queda en la cuenta del atacante»* —
> **no la cierra esta ficha**. Comprueba su estado en Linear antes de actuar:
> este párrafo enuncia la **condición**, no el estado, para no quedarse falso el
> día que se cierre.
>
> **Mientras no haya credenciales no es explotable, y la razón es esta misma
> sección:** sin el **eje 2**, `convex/gmail.ts` no manda a nadie a Google; sin
> el **eje 3**, el guardado lanza antes de escribir nada. **El código falla
> cerrado.**
>
> **Por eso el peligro no está en ningún merge, está aquí.** El día que alguien
> rellene el eje 2 en `stoic-impala-857`, el ataque pasa a ser alcanzable **sin
> que se tome ninguna decisión de publicación** — porque poner una variable de
> entorno no se siente como activar una vulnerabilidad conocida. **La decisión
> se toma en este párrafo, no en un merge.**
>
> **Qué hacer, que hay dos salidas:** cerrar AIT-145 antes, **o** aceptar el
> riesgo por escrito en AIT-144 diciendo **quién lo acepta y con qué alcance**
> (¿buzones reales?, ¿cuántos usuarios?). Lo que no vale es rellenar las
> variables sin nombrar la decisión.
>
> *Alcance: en dev no aplica igual —los buzones son de prueba—, y la clave de
> cifrado es distinta por deployment justamente para que eso siga siendo verdad.*

⚠️ **`GMAIL_OAUTH_CLIENT_ID` y `GMAIL_OAUTH_CLIENT_SECRET` no existen.** Aparecían
en una rama previa de esta tarea y **estaban equivocados**, no desincronizados:
medido con `npx convex env list --names-only` contra el deployment compartido, los
nombres reales son los de la tabla. Se corrigen aquí y no se deja el nombre viejo
"por contexto" — dos nombres a la vista es cómo el siguiente no sabe cuál vale.

**Se necesitan TRES cosas por deployment, y son independientes entre sí:**

```
EJE 1  la URI de redireccion de ESE deployment, registrada en el cliente OAuth
       https://<deployment>.convex.site/gmail/oauth/callback
EJE 2  GMAIL_CLIENT_ID y GMAIL_CLIENT_SECRET puestas en ESE deployment
EJE 3  GMAIL_TOKEN_ENCRYPTION_KEY puesta en ESE deployment
```

**Los tres se comprueban ANTES de mandar a nadie a Google** (`convex/gmail.ts`),
y el aviso nombra la variable y el deployment. La razón no es comodidad: el eje 3
falla **al guardar**, o sea *después* del consentimiento — en el único punto del
recorrido donde el usuario ya ha hecho su parte. Comprobar antes convierte el
fallo más caro en el más barato.

⚠️ **El eje 1 NO es comprobable desde el servidor**: si esa URI está registrada
vive en la consola de Google. El CRM enseña **cuál va a usar**, y no afirma ni
que falta ni que está. Lo que distingue registrada de no registrada es que la
pantalla de consentimiento aparezca de verdad.
⚠️ **Y la lista de URIs caduca:** cada deployment nuevo añade la suya. Quien cree
un deployment de Convex tiene que registrarla, o verá un error **emitido por
Google** que no menciona ni a SuperCRM ni a Convex.

**La clave de cifrado la genera Aitor, va a Bitwarden, y es DISTINTA por
deployment.** No la genera ninguna función del sistema, y el motivo es la
amenaza, no la comodidad: una función solo podría guardarla **en la base de
datos, que es justo donde viven los tokens que cifra** — la clave al lado del
dato que protege no protege de nada, y cifrar pasaría a ser un adorno con coste.
Que sea distinta por deployment es deliberado: un token cifrado en dev no debe
poder leerse en producción, porque son buzones de personas distintas.

Se genera así (32 bytes en base64, que es lo que espera `AES-256-GCM`):

```bash
openssl rand -base64 32
npx convex env set GMAIL_TOKEN_ENCRYPTION_KEY '<lo anterior>' --deployment <nombre>
```

🔴 **CONSECUENCIA QUE HAY QUE SABER ANTES, NO EL DÍA QUE PASE:** si esa clave se
pierde o se rota, **los tokens ya guardados dejan de poder descifrarse y los
usuarios tienen que reconectar su Gmail**. No se pierde correo — se pierde la
conexión. Es asumible, y por eso está escrito aquí en vez de descubrirse.

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

### 🔴 Prohibido: resolver el deployment por URL+admin key desde un worktree (AIT-123)

**Está prohibido ejecutar, desde un worktree, cualquier invocación de `convex` que
resuelva el deployment POR URL + ADMIN KEY en vez de POR NOMBRE.** Da igual cómo se
llegue a ese estado: **la prohibición es sobre el mecanismo, no sobre ningún flag.**

Formas conocidas de caer en él — son **ejemplos, no la definición**:

- `--env-file <fichero con CONVEX_SELF_HOSTED_URL + CONVEX_SELF_HOSTED_ADMIN_KEY>`
- `--url <…> --admin-key <…>`, **sin `--env-file` por ninguna parte**
- esas mismas variables self-hosted presentes en el entorno *(no medido)*

**Qué hace, medido el 2026-09-10 contra el binario real (convex 1.42.1), en un
entorno desechable y sin tocar ningún deployment.** Son **dos** escrituras sobre el
`.env.local` **del directorio en que se invoca**, no una:

1. **borra la línea `CONVEX_DEPLOYMENT`**;
2. **reescribe `NEXT_PUBLIC_CONVEX_URL` y `NEXT_PUBLIC_CONVEX_SITE_URL`** para que
   apunten al destino del comando.

La segunda es la peor y es la que faltaba en la descripción original del defecto: el
worktree **no queda "sin saber contra qué backend corre"** — queda **corriendo contra
otro**, de forma persistente, porque Next lee `NEXT_PUBLIC_CONVEX_URL`. *No es
ausencia de configuración: es configuración equivocada, que es peor y no se parece.*

**El CLI SÍ lo avisa**, en la primera línea de su salida:

```
Removed the CONVEX_DEPLOYMENT environment variable from .env.local
Saved NEXT_PUBLIC_CONVEX_URL and NEXT_PUBLIC_CONVEX_SITE_URL to .env.local
```

Lo que no avisa es la **consecuencia**, que llega después y en manos de otro. Por eso
`npm run test:e2e` la convierte en un gate: `scripts/check-e2e-preconditions.mjs`
comprueba, antes de ejecutar un solo test, que `CONVEX_DEPLOYMENT` esté y que las dos
`NEXT_PUBLIC_*` sean exactamente las que se derivan de su nombre.

**Sobre `npx convex deploy` desde un worktree local:** si `.env.local` tiene
`CONVEX_DEPLOYMENT` puesto (el caso normal de cualquier terminal de desarrollo), el
comando pide confirmación interactiva antes de empujar a producción — y no hay forma
de saltarse ese prompt con variables de entorno adicionales (`CI=true`, exportar
`CONVEX_DEPLOY_KEY`, etc. no lo evitan, comprobado en la práctica). **Esa
confirmación es una salvaguarda y no se desactiva.** Railway despliega sin ella
porque su entorno de build nunca tiene un `.env.local` de por medio, que es otra
situación.

⚠️ **Lo que `convex deploy` le hace al `.env.local` NO ESTÁ MEDIDO**, ni con
`--env-file` ni sin él: lo medido arriba es `convex dev`, y son caminos de código
distintos (`deploy.js` no llama a la función que borra). **No se afirma ni se
desmiente.** Medirlo es AIT-130, y el desbloqueo de esta prohibición es esa medición,
no una excepción.

---

## Variables de entorno

Las escribe Convex solo. **Nunca se commitean.**

| Variable | Dónde | Qué es |
|---|---|---|
| `CONVEX_DEPLOYMENT` | `.env.local` | El deployment de desarrollo. |
| `NEXT_PUBLIC_CONVEX_URL` | `.env.local` | La URL que usa el navegador. `NEXT_PUBLIC_` = pública, no meter secretos con ese prefijo. |
| `NEXT_PUBLIC_DEMO_OWNER_PASSWORD`, `NEXT_PUBLIC_DEMO_SALES_PASSWORD` | `.env.local` | Autorrelleno de "cuentas de prueba" en `/login`, solo fuera de producción (ver AIT-9). |
| `JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL` | Deployment de Convex (`npx convex env`, no `.env.local`) | Firma de tokens de sesión de Convex Auth. Las escribe `npx @convex-dev/auth`. |
| `SEED_OWNER_PASSWORD`, `SEED_SALES_PASSWORD` | Deployment de Convex (`npx convex env`) | Contraseñas de `marta@supercrm.es`/`carlos@supercrm.es`. **Hoy no las lee ningún código** (AIT-99): sirvieron para crear esas cuentas y la credencial quedó congelada en `authAccounts` desde entonces. **Cambiar estas variables NO cambia la contraseña de una cuenta que ya existe** — para eso, ver §6quater. Y **tienen que llevar el mismo valor que `NEXT_PUBLIC_DEMO_*`**: nada obliga a que coincidan, y descuadrarlas rompe el login. |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Deployment de Convex (`npx convex env`) | Credenciales OAuth de Google Cloud Console (AIT-60, añadido en paralelo a lo de arriba) — `@auth/core` las lee por convención, nombre fijo. Ver §6bis. |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Deployment de Convex (`npx convex env`) | Envío del código de reseteo de contraseña (AIT-62) — `convex/ResendOTPPasswordReset.ts` las lee. `RESEND_FROM_EMAIL` necesita un dominio verificado en Resend para entregar a cuentas reales, no el de prueba. Ver §6ter. |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_TOKEN_ENCRYPTION_KEY` | Deployment de Convex (`npx convex env`) | Conexión de Gmail (AIT-92, Ola 2) — cliente OAuth **distinto** del del login (§6bis), y la clave que cifra el token de refresco. Ver §6quinquies. **`GMAIL_OAUTH_*` no existe**: era un nombre equivocado de una rama previa. |
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
| `npm run test:unit` | Las pruebas que **no necesitan nada levantado** (`e2e/00-*.spec.ts`) |
| `npm run test:e2e` | Las pruebas **de navegador**, que sí levantan la app y usan Convex |

### Las pruebas van en dos comandos, y no son intercambiables (AIT-109)

| | `npm run test:unit` | `npm run test:e2e` |
|---|---|---|
| Qué corre | `e2e/00-*.spec.ts` | el resto de `e2e/` |
| Levanta el servidor | **no** | sí (`webServer` de `playwright.config.ts`) |
| Prepara sesión | **no** | sí (`globalSetup`, y **gasta cupo de login**) |
| Necesita Convex desplegado | **no** | sí |
| Comprueba precondiciones antes | no | sí (`scripts/check-e2e-preconditions.mjs`) |
| Se puede correr con todo caído | **sí** | no |

⚠️ **Las dos filas en negrita de arriba son afirmaciones que hay que MEDIR, y ya fueron
falsas una vez.** En la ronda 1 de AIT-109 esta misma tabla decía «no necesita Convex» y
`npm run test:unit` daba **91 passed** — porque se midió con Convex disponible, que es
justo el escenario en el que la afirmación no significa nada. Con el deployment caído eran
**86 passed y 5 failed**. El verde era cierto y no discriminaba.

Se comprueban con el puerto inválido y el backend inalcanzable **a la vez**:

```sh
# 1. independencia del puerto: tiene que LISTAR, no abortar
E2E_PORT=abc npx playwright test --list --config playwright.unit.config.ts

# 2. independencia de Convex: un `npx` que falla, delante en el PATH, para que
#    `npx convex function-spec` no llegue a salir del proceso. No toca .env.local.
d=$(mktemp -d); printf '#!/bin/sh\nexit 127\n' > "$d/npx"; chmod +x "$d/npx"
PATH="$d:$PATH" E2E_PORT=abc ./node_modules/.bin/playwright test --config playwright.unit.config.ts
```

**Ojo con el segundo:** invoca `./node_modules/.bin/playwright` directamente, **no**
`npx playwright` — si no, el `npx` falso se come también al propio Playwright y el rojo
que obtienes no es el que buscas.

**Y el fallo que estos comandos hacen imposible:** correrlos con Convex disponible **no
puede fallar**, así que no prueba nada. Un `PASA si` sin un mundo en el que falle se cumple
con la cosa rota.

**Por qué están separados y no es una optimización.** `playwright.config.ts` declara un
único `webServer`, así que antes **toda** prueba arrastraba el arranque de la app aunque
solo importara una función. Dos de las pruebas puras son precisamente **las del
comprobador de precondiciones**, y estaban detrás del `&&` que ejecuta ese mismo
comprobador: **solo se podían verificar cuando las precondiciones ya pasaban**, es decir
nunca en el caso para el que existen.

⚠️ **`npm run test:e2e` afirma menos que antes.** Ya no cubre la suite entera, solo las de
navegador — y **el nombre del comando no cambió**, así que esto no se ve en ningún diff.
Si lo usas como puerta antes de publicar, **la puerta son los dos comandos**, no uno.
Un guardián que mira menos no falla: aprueba más.

**Qué es «puro» aquí:** que no necesita servidor, Convex ni sesión. **No** significa que no
toque el disco — `00-instantanea-sesion.spec.ts` escribe en `os.tmpdir()` y
`00-comprobadores.spec.ts` lanza subprocesos.

**Si añades una prueba pura, llámala `00-…`**: el reparto es por ese prefijo
(`e2e/pruebas-puras.ts`, importado por los dos configs). Con otro nombre seguirá
ejecutándose, pero en la suite lenta.

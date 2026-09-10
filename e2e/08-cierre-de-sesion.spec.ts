import { test, expect, type Browser, type Page } from "@playwright/test";
import { HOME_BY_ROLE, type Role } from "./authState";
import { ENUMERAR_CONTROLES_ALCANZABLES } from "./enumerarNavegadores";
import {
  LIMITE_LIMPIEZA_MS,
  LIMITE_CIERRE_MS,
  LIMITE_LIMPIEZA_CLIENTE_MS,
  PRESUPUESTO_C3_MS,
  MARGEN_SOBRECARGA_MS,
} from "@/components/push/useSignOutAndUnlinkPush";
import { PUSH_ENDPOINT_KEY } from "@/components/push/useSyncPushSubscription";

/** AIT-127 — El cierre de sesión, comprobado POR EFECTO CONTRA EL SERVIDOR.
 *
 * 🔴 NO SE MIRA NINGÚN ALMACENAMIENTO PARA CONCLUIR QUE LA SESIÓN ESTÁ CERRADA.
 * Es un `FALLA si` de la ficha, y con tres razones independientes detrás: una
 * sonda ciega devuelve el mismo silencio esté o no esté lo que busca; esta
 * noche se falló con dos sondas distintas seguidas y la segunda parecía mejor
 * que la primera; y con dos credenciales simultáneas, mirar una puede dar verde
 * mientras la otra sigue abriendo la puerta.
 * La única prueba admitida es pedir una ruta protegida y ver si deja entrar.
 *
 * ⚠️ TAMPOCO se usa el cierre de pestaña de Playwright como instrumento:
 * destruye el perfil entero y borra el almacenamiento, cosa que un navegador
 * real no hace. Miente hacia el verde.
 *
 * ⚠️ CADA ITERACIÓN ABRE SU PROPIA SESIÓN, y no es un lujo: `e2e/helpers.ts`
 * avisa de que la instantánea compartida la usan 29 puntos de llamada, y un
 * spec que cierre sesión la invalidaría PARA TODOS sin que nada avise. Aquí se
 * hace login propio y se cierra el propio.
 */

const DEMO_LABEL: Record<Role, string> = {
  owner: "Marta Ledo",
  sales: "Carlos Vega",
};

/** El gesto humano entre pulsar y navegar. FIJADO ANTES DE MEDIR NADA (plan §6,
 *  C2a) y por el extremo ESTRICTO: cuanto más corto, más fácil es que la
 *  navegación pille la sesión todavía viva, o sea más difícil de pasar para el
 *  propio arreglo. Y hace fallar el código de hoy por 6,6x, porque la ventana
 *  más corta medida del defecto era de 3.300 ms.
 *  ⛔ Si algún día este test se pone rojo, NO se sube este número. */
const RETARDO_GESTO_MS = 500;

/** 10 por cada combinación {2 botones} x {2 roles} = 40. Fijado por el PM antes
 *  de que existiera ningún resultado: el defecto se reprodujo 3 de 3, así que
 *  lo que hay que descartar es un arreglo INTERMITENTE — con 40 intentos, un
 *  fallo residual del 10 % aparecería con ~98,5 % de probabilidad.
 *  ⛔ UNA sola entrada entre las 40 significa que NO está arreglado. No se
 *  promedia y no se repite "a ver si esta vez sale". */
const INTENTOS_POR_COMBINACION = 10;

const RUTA_PROTEGIDA = "/pipeline";

async function abrirSesionPropia(browser: Browser, role: Role): Promise<Page> {
  const contexto = await browser.newContext();
  const pagina = await contexto.newPage();
  // Mismo camino que `global-setup`: el autorrelleno de /login. La suite sigue
  // sin cablear ninguna contraseña.
  await pagina.goto("/login");
  await pagina
    .getByRole("button", { name: DEMO_LABEL[role], exact: false })
    .click();
  await pagina.getByRole("button", { name: "Entrar" }).click();
  await pagina.waitForURL(`**${HOME_BY_ROLE[role]}`);
  return pagina;
}

/** Deja al usuario DELANTE del botón de cerrar sesión, ASENTADO y sin pulsarlo.
 *  Devuelve el control, listo para que el siguiente `click()` se despache ya.
 *
 * 🔴 EL `hover()` NO ES DECORACIÓN: es lo que separa "esperar a poder pulsar"
 * de "pulsar". `click()` corre primero las comprobaciones de accionabilidad
 * (visible, estable, sin nada encima) y solo después despacha. Medido en
 * /ajustes: el clic se despachaba **805-841 ms** después de que el test
 * llamara a `click()`, porque la pantalla seguía asentándose con las queries
 * de Convex. `hover()` corre esas MISMAS comprobaciones antes, así que tras
 * él `click()` retorna en 23-35 ms y el gesto ocurre cuando el cronómetro
 * dice que ocurre.
 *
 * ⚠️ Sin esto, CUALQUIER cronómetro alrededor del clic mide otra cosa — y da
 * igual de qué lado se ponga, porque las dos formas obvias fallan en
 * direcciones opuestas y las dos hacia el verde:
 *   · `click(); esperar(500)` sondea a gesto+513 ms.
 *   · `t0 = ahora; click(); esperar hasta t0+500` sondea a gesto **menos**
 *     305 ms — o sea ANTES de que el usuario haya pulsado. Eso daba "10 de
 *     10 entraron", que no es un fallo: es la sesión viva porque el cierre
 *     todavía no había empezado.
 */
async function prepararCierre(pagina: Page, boton: "ajustes" | "menu") {
  if (boton === "ajustes") {
    await pagina.goto("/ajustes");
  } else {
    await pagina.getByRole("button", { name: /abrir men/i }).click();
  }
  const control = pagina.getByRole("button", { name: "Cerrar sesión" });
  await control.hover();
  return control;
}

/** Pulsa "Cerrar sesión" por uno de los dos caminos que tiene la app. */
async function pulsarCerrarSesion(pagina: Page, boton: "ajustes" | "menu") {
  const control = await prepararCierre(pagina, boton);
  await control.click();
}

/** LA COMPROBACIÓN QUE MANDA: una petición NUEVA E INDEPENDIENTE a una ruta
 *  protegida. Devuelve `true` si el servidor deja entrar. */
async function elServidorDejaEntrar(pagina: Page): Promise<boolean> {
  const respuesta = await pagina.request.get(RUTA_PROTEGIDA, {
    maxRedirects: 0,
    failOnStatusCode: false,
  });
  const destino = respuesta.headers()["location"] ?? "";
  return !(
    respuesta.status() >= 300 &&
    respuesta.status() < 400 &&
    destino.includes("/login")
  );
}

/** Deja el cierre EN VUELO y devuelve el control al test en ese instante.
 *
 *  Interceptar `/api/auth` y no soltarlo es lo único que da un instante
 *  estable: la ventana real dura milisegundos y medir "a ojo" con un
 *  `waitForTimeout` daría verde por llegar tarde, no por estar bloqueado.
 *  ⚠️ Solo se retiene el POST de `auth:signOut`. Por esa misma ruta pasa el
 *  refresco de sesión del propio paquete de auth, y retenerlo todo sería
 *  fabricar un bloqueo que la app no tiene.
 */
async function conElCierreEnVuelo(
  pagina: Page,
  pulsar: () => Promise<void>,
): Promise<{ enVuelo: Promise<void>; soltar: () => void }> {
  let marcarEnVuelo!: () => void;
  const enVuelo = new Promise<void>((r) => {
    marcarEnVuelo = r;
  });
  let soltar!: () => void;
  const permiso = new Promise<void>((r) => {
    soltar = r;
  });

  await pagina.route("**/api/auth", async (route) => {
    if (!(route.request().postData() ?? "").includes("auth:signOut")) {
      await route.continue();
      return;
    }
    marcarEnVuelo();
    await permiso;
    await route.continue();
  });

  await pulsar();
  return { enVuelo, soltar };
}

for (const role of ["owner", "sales"] as Role[]) {
  for (const boton of ["ajustes", "menu"] as const) {
    test(`C2a · ${role} · botón de ${boton}: cero controles alcanzables en ${INTENTOS_POR_COMBINACION} activaciones`, async ({
      browser,
    }) => {
      // ⚠️ RONDA 4 (M4): SON DIEZ ACTIVACIONES POR COMBINACIÓN, NO UNA. Antes
      // había un test por combinación y cada uno inspeccionaba el DOM UNA vez
      // — cuatro miradas en total. Un bloqueo intermitente que fallara una de
      // cada diez tenía el 90 % de probabilidades de no aparecer en cada
      // mirada. Los 40 intentos que exige la ficha estaban, pero bajo C2c, que
      // mide otra cosa (la barra de direcciones) y que además no exige cero.
      // O sea: el criterio pedía 40 y ninguna de las dos mitades los daba.
      test.slow();
      let conControles = 0;
      const hallazgos: string[] = [];

      for (let i = 0; i < INTENTOS_POR_COMBINACION; i++) {
        // Sesión propia por iteración, igual que el resto del fichero.
        const pagina = await abrirSesionPropia(browser, role);
        const control = await prepararCierre(pagina, boton);

        // CONTROL POSITIVO DE LA ITERACIÓN, y va ANTES de bloquear nada: con la
        // app en reposo el enumerador TIENE que encontrar controles. Uno que
        // devuelve cero porque no supo mirar da exactamente el mismo verde que
        // uno que enumeró bien y no había nada.
        const enReposo: string[] = await pagina.evaluate(
          ENUMERAR_CONTROLES_ALCANZABLES,
        );
        expect(
          enReposo.length,
          `iteración ${i + 1}: el enumerador no encontró NINGÚN control con la ` +
            "app en reposo; su cero durante el cierre no valdría",
        ).toBeGreaterThan(0);

        const { enVuelo, soltar } = await conElCierreEnVuelo(pagina, () =>
          control.click(),
        );
        await enVuelo;
        const durante: string[] = await pagina.evaluate(
          ENUMERAR_CONTROLES_ALCANZABLES,
        );
        soltar();

        if (durante.length > 0) {
          conControles++;
          hallazgos.push(`iteración ${i + 1}: ${durante.join(" · ")}`);
        }
        await pagina.context().close();
      }

      expect(
        conControles,
        `${conControles} de ${INTENTOS_POR_COMBINACION} activaciones dejaron ` +
          `controles alcanzables durante el cierre:\n${hallazgos.join("\n")}`,
      ).toBe(0);
    });
  }
}

test("C2a · control positivo (teclado): una etiqueta INVENTADA que el enumerador no puede conocer pone C2a en rojo", async ({
  browser,
}) => {
  // 🔴 EL SEGUNDO DIENTE DE C2a, textual del PM: "se añade un enlace de prueba
  // que no pase por el bloqueante y C2a se pone roja. Sin eso no se sabe si la
  // enumeración enumera."
  //
  // ⚠️ HISTORIA DE ESTE ADVERSARIO, PORQUE SE HA EQUIVOCADO DOS VECES SEGUIDAS
  // Y SIEMPRE EN LA MISMA DIRECCIÓN:
  //   ronda 3 -> inyectaba un `<a href>`: justo lo que el enumerador de
  //              entonces (`a[href]` + un selector del panel) ya sabía ver.
  //   ronda 4 -> lo cambié a `<button>` creyendo haberlo arreglado... y
  //              `button` era la SEGUNDA entrada de mi propia lista
  //              `INTERACTIVOS`. Lo señaló el auditor (M3 de la ronda 4).
  // Las dos veces el señuelo estaba DENTRO del conocimiento previo del
  // detector, así que confirmaba en vez de probar.
  //
  // ✅ AHORA EL ADVERSARIO ES UNA ETIQUETA QUE NO EXISTE: `<control-inventado>`.
  // No es HTML estándar, no la conoce el navegador, y sobre todo NO PUEDE estar
  // en ninguna lista mía, ni en la de hoy ni en la que alguien escriba mañana.
  // Es alcanzable por `tabindex="0"` y navega desde su manejador.
  //
  // 🔑 Y ES EL TEST QUE OBLIGA A QUE EL INSTRUMENTO SEA CONDUCTUAL. Con la
  // lista de selectores de la ronda 4 este test sale ROJO — ningún selector
  // casa con una etiqueta inventada. Sólo pasa si el enumerador le pregunta al
  // navegador «¿le das el foco?» en vez de «¿estás en mi lista?».
  const pagina = await abrirSesionPropia(browser, "sales");
  const control = await prepararCierre(pagina, "ajustes");

  const { enVuelo, soltar } = await conElCierreEnVuelo(pagina, () =>
    control.click(),
  );
  await enVuelo;

  await pagina.evaluate(() => {
    const raro = document.createElement("control-inventado");
    raro.setAttribute("tabindex", "0");
    raro.textContent = "control adversario";
    raro.addEventListener("click", () =>
      history.pushState({}, "", "/pipeline"),
    );
    document.body.appendChild(raro);
  });

  const durante: string[] = await pagina.evaluate(
    ENUMERAR_CONTROLES_ALCANZABLES,
  );
  soltar();

  expect(
    durante.join(" · "),
    "el enumerador NO vio un control de etiqueta desconocida puesto delante de " +
      "sus narices durante el cierre: su cero en los otros tests no distingue nada",
  ).toContain("control adversario");
});

test("C2a · control positivo (puntero): un control que NO toma foco pero sí recibe clic pone C2a en rojo", async ({
  browser,
}) => {
  // 🔴 LA OTRA MITAD, Y EXISTE PORQUE LA SONDA DE FOCO NO LA CUBRE. Un `<div>`
  // sin `tabindex` con un manejador de clic NO es enfocable: la sonda de
  // teclado lo da por no alcanzable, y con razón — desde el teclado no lo es.
  // Pero con el ratón sí, y C2a habla de lo que una PERSONA puede alcanzar.
  //
  // Sin este test, la sonda 2 (rejilla de `elementFromPoint`) no estaría
  // validada: devolvería cero en los demás tests y ese cero no distinguiría
  // "el bloqueo cubre la superficie clicable" de "la rejilla no mira nada".
  // Un comprobador que sólo ha dado verde no está validado, está sin usar.
  //
  // ⚠️ El adversario se coloca con posición fija y tamaño grande para que la
  // rejilla (paso de 32 px) lo pise sí o sí. Eso es una propiedad del muestreo,
  // no del criterio: un control real más pequeño que el paso podría escaparse,
  // y lo declaro aquí en vez de fingir que la rejilla es exhaustiva.
  const pagina = await abrirSesionPropia(browser, "sales");
  const control = await prepararCierre(pagina, "ajustes");

  const { enVuelo, soltar } = await conElCierreEnVuelo(pagina, () =>
    control.click(),
  );
  await enVuelo;

  await pagina.evaluate(() => {
    const d = document.createElement("div");
    d.textContent = "control adversario de puntero";
    d.setAttribute(
      "style",
      "position:fixed;top:0;left:0;width:300px;height:300px;z-index:99999;background:#fff",
    );
    // Sin tabindex a propósito: no es enfocable. Sólo se alcanza con el ratón.
    d.addEventListener("click", () => history.pushState({}, "", "/pipeline"));
    document.body.appendChild(d);
  });

  const durante: string[] = await pagina.evaluate(
    ENUMERAR_CONTROLES_ALCANZABLES,
  );
  soltar();

  expect(
    durante.join(" · "),
    "la rejilla de puntero NO vio un control clicable de 300x300 px durante el " +
      "cierre: su cero en los demás tests no distingue nada",
  ).toContain("control adversario de puntero");
});

test("C2a · control positivo con un componente REAL del layout: el aviso de versión nueva no deja controles alcanzables durante el cierre", async ({
  browser,
}) => {
  // 🔴 DEFECTO REAL ENCONTRADO EN LA RONDA 4, revisando mi propio diff como
  // código nuevo (decisión 79). No lo señaló el auditor.
  //
  // <NewVersionNotice> (AIT-83) era HERMANO de <AreaBloqueable> en el layout,
  // así que el `inert` del cierre no lo alcanzaba. Cuando se activa pinta dos
  // controles: «Recargar», que llama a `window.location.reload()`, y el
  // «Cerrar» del Toast. Durante la ventana de cierre quedaban los dos
  // alcanzables — y un recargar ES navegación que la app ofrece, que es
  // literalmente lo que C2a cuenta.
  //
  // ⚠️ Y NO ERA SÓLO DE PRODUCCIÓN: el arnés inyecta `RAILWAY_GIT_COMMIT_SHA`
  // (playwright.config.ts, AIT-93), así que el aviso está vivo también aquí. La
  // suite daba verde porque ningún test hacía coincidir las dos condiciones
  // —aviso visible Y cierre en vuelo—, no porque el hueco no existiera.
  //
  // 🔑 POR QUÉ ESTE TEST Y NO EL DE ARRIBA: aquel inyecta un adversario que
  // escribí yo, con la forma que mi enumerador ya sabía ver. Éste usa un
  // componente REAL de la app, que llegó por otra ficha y cuyo autor no sabía
  // nada de C2a. Es la diferencia entre confirmar y probar.
  test.slow();
  const pagina = await abrirSesionPropia(browser, "sales");
  const control = await prepararCierre(pagina, "ajustes");

  // PRECONDICIÓN DEL ARNÉS, comprobada y no supuesta: si /version no publicara
  // un commit, el layout pasaría `loadedCommit={null}`, el aviso quedaría
  // inerte por diseño y este test daría verde SIN HABER EJERCITADO NADA — un
  // cero sin control positivo.
  const respuesta = await pagina.request.get("/version");
  const cuerpo: unknown = await respuesta.json();
  const commitServido = (cuerpo as { commit?: unknown }).commit;
  expect(
    typeof commitServido,
    "precondición incumplida: /version no publica un commit, así que el aviso " +
      "de versión no puede activarse y este test no probaría nada",
  ).toBe("string");

  // Se suplanta /version con OTRO commit: es lo que hace creer a la pestaña que
  // hay un despliegue nuevo. Mismo camino que 06-aviso-version-nueva.spec.ts.
  await pagina.route("**/version", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ commit: "0".repeat(40) }),
    }),
  );
  await pagina.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );

  // EL ADVERSARIO ESTÁ VIVO ANTES DE BLOQUEAR NADA. Sin esta aserción, un
  // aviso que no llegara a pintarse daría el mismo cero que el bloqueo
  // funcionando.
  const recargar = pagina.getByRole("button", { name: "Recargar" });
  await expect(
    recargar,
    "el aviso de versión nueva no llegó a aparecer: sin él, el cero de abajo " +
      "no distingue 'bloqueado' de 'no había nada que bloquear'",
  ).toBeVisible();

  const { enVuelo, soltar } = await conElCierreEnVuelo(pagina, () =>
    control.click(),
  );
  await enVuelo;

  const durante: string[] = await pagina.evaluate(
    ENUMERAR_CONTROLES_ALCANZABLES,
  );
  soltar();

  expect(
    durante,
    "C2a exige CERO controles alcanzables durante el cierre y quedaron " +
      `estos: ${durante.join(" · ")}`,
  ).toEqual([]);
  // Redundante con el `toEqual([])` de arriba a propósito: si alguien relaja
  // ese cero algún día, este mensaje dice cuál era el control concreto y por
  // qué importaba.
  expect(
    durante.join(" · "),
    "«Recargar» del aviso de versión seguía alcanzable durante el cierre, y " +
      "llama a window.location.reload(): es navegación ofrecida por la app " +
      "dentro de la ventana que C2a cierra",
  ).not.toContain("Recargar");
});

test("C2c · la ventana residual del servidor: se mide y se publica, no se declara cerrada", async ({
  browser,
}) => {
  // ⚠️ ESTE TEST NO AFIRMA QUE LA VENTANA NO EXISTA. Existe: entre que el
  // usuario pulsa y que el servidor invalida la sesión pasa un tiempo real, y
  // durante él la barra de direcciones sigue entrando. C2a cierra lo que la
  // app OFRECE; la barra de direcciones no la ofrece la app, y la única
  // mitigación real es la revocación en servidor (AIT-133, congelada).
  //
  // `FALLA si` el cierre se redacta como si la ventana hubiera desaparecido.
  // Aquí eso se traduce en dos dientes: la ventana tiene que existir de verdad
  // (si midiéramos 0 ms, o el servidor ya cerraba antes o la sonda no
  // discrimina), y tiene que caber en el límite declarado — no en un margen
  // sobrante que nadie fijó.
  test.slow();
  const pagina = await abrirSesionPropia(browser, "sales");
  expect(
    await elServidorDejaEntrar(pagina),
    "la sesión no servía ANTES de cerrar: la medición no vale",
  ).toBe(true);
  const control = await prepararCierre(pagina, "ajustes");

  const t0 = Date.now();
  await control.click();

  const TECHO_MS = LIMITE_LIMPIEZA_MS + LIMITE_CIERRE_MS;
  // ⚠️ CADA SONDEO SE FECHA CUANDO SALE, NO CUANDO VUELVE, y esto me costó
  // publicar un número falso antes de cazarlo. La primera versión medía
  // `Date.now()` al RECIBIR la respuesta y daba "ventana ≈ 985 ms" tres
  // corridas seguidas, con toda la pinta de un dato sólido. Era mentira: el
  // sondeo se encola detrás del POST del cierre y tarda ~980 ms en volver,
  // pero **la respuesta describe el estado de cuando SALIÓ**. Ese 985 no era
  // la ventana; era la hora a la que miré el reloj.
  //
  // Lo delató una contradicción entre dos medidas MÍAS, no una revisión: si
  // la ventana durase 985 ms, las 40 navegaciones a 500 ms del gesto habrían
  // entrado TODAS, y entraron cero. Dos números incompatibles, y el falso era
  // el que parecía más preciso.
  //
  // Y por eso los sondeos van ESPACIADOS y cronometrados desde t0, no en
  // bucle apretado: encadenados se encolan unos detrás de otros y la cola se
  // come la resolución.
  const PASO_MS = 100;
  let ultimoSiEntraMs = -1;
  let primerNoEntraMs = -1;
  let sondeos = 0;
  for (let offset = 0; offset <= TECHO_MS + 1000; offset += PASO_MS) {
    const espera = t0 + offset - Date.now();
    if (espera > 0) await pagina.waitForTimeout(espera);
    const salida = Date.now() - t0;
    sondeos++;
    if (await elServidorDejaEntrar(pagina)) {
      ultimoSiEntraMs = salida;
      continue;
    }
    primerNoEntraMs = salida;
    break;
  }
  const ventanaMs = primerNoEntraMs;

  console.log(
    `[AIT-127 · C2c] ventana residual ACOTADA en (${ultimoSiEntraMs}, ${primerNoEntraMs}] ms ` +
      `— ${sondeos} sondeos espaciados ${PASO_MS} ms y fechados al SALIR. ` +
      `Techo declarado ${TECHO_MS} ms = limpieza ${LIMITE_LIMPIEZA_MS} + cierre ${LIMITE_CIERRE_MS}`,
  );

  expect(
    ventanaMs,
    `el servidor seguía dejando entrar pasados ${TECHO_MS + 1000} ms: ` +
      "la ventana residual es mayor que el techo que declara el código",
  ).toBeGreaterThanOrEqual(0);
  expect(
    ventanaMs,
    "la ventana residual midió 0 ms. O el servidor ya cerraba antes de pulsar " +
      "(y entonces el control positivo de arriba miente), o la sonda no " +
      "distingue. Un cero aquí no es una buena noticia: es una sonda sospechosa.",
  ).toBeGreaterThan(0);
  expect(ventanaMs, `ventana residual ${ventanaMs} ms`).toBeLessThanOrEqual(
    TECHO_MS,
  );
});

for (const role of ["owner", "sales"] as Role[]) {
  for (const boton of ["ajustes", "menu"] as const) {
    test(`C2c · ${role} · botón de ${boton}: cuántas de ${INTENTOS_POR_COMBINACION} entran a ${RETARDO_GESTO_MS} ms del gesto`, async ({
      browser,
    }) => {
      // Esta es la medición que originó la ficha, y se CONSERVA aunque C2a ya
      // no la use como instrumento: C2a cierra lo que la app OFRECE, y esto
      // mide lo que la barra de direcciones sigue consiguiendo durante la
      // ventana residual. Son dos cosas distintas, y borrar la segunda al
      // reformular la primera habría sido recortar la ficha sin decirlo.
      //
      // ⚠️ NO EXIGE CERO, Y NO PUEDE EXIGIRLO. Exigir cero aquí sería redactar
      // el cierre como si la ventana residual hubiera desaparecido, que es
      // literalmente el `FALLA si` de C2c. Se publica el número. La mitigación
      // real es la revocación en servidor (AIT-133, congelada).
      //
      // ⚠️ Y SU SUELO ES DÉBIL, LO DIGO YO ANTES QUE EL AUDITOR: solo se pone
      // rojo si entran TODAS, o sea si el cierre no cierra nada. Los dientes
      // fuertes de C2c están en el test de la ventana medida; esto es el dato
      // de campo que lo acompaña.
      //
      // ⚠️ Y VAN CUATRO TESTS, NO UNO CON LAS 40: medido, las 40 iteraciones
      // en un solo test agotan el timeout de 90 s a mitad de camino. Un rojo
      // por timeout se lee igual que un rojo por defecto, y no lo es.
      test.slow();
      let entradas = 0;

      for (let i = 0; i < INTENTOS_POR_COMBINACION; i++) {
        const pagina = await abrirSesionPropia(browser, role);
        expect(
          await elServidorDejaEntrar(pagina),
          `iteración ${i + 1}: la sesión no servía ANTES de cerrar`,
        ).toBe(true);

        const control = await prepararCierre(pagina, boton);

        // El cronómetro arranca con el control ya asentado, así que t0 es el
        // gesto de verdad. Ver `prepararCierre`: sin eso este número no es
        // 500 ms desde nada que le pase al usuario.
        const t0 = Date.now();
        await control.click();
        const restante = t0 + RETARDO_GESTO_MS - Date.now();
        if (restante > 0) await pagina.waitForTimeout(restante);
        if (await elServidorDejaEntrar(pagina)) entradas++;
        await pagina.context().close();
      }

      console.log(
        `[AIT-127 · C2c] ${role}/${boton}: entraron ${entradas} de ${INTENTOS_POR_COMBINACION} a ${RETARDO_GESTO_MS} ms`,
      );
      expect(
        entradas,
        `entraron las ${INTENTOS_POR_COMBINACION}: el cierre no está cerrando nada`,
      ).toBeLessThan(INTENTOS_POR_COMBINACION);
    });
  }
}

test("C3 · con las TRES etapas cerca de su máximo, del gesto a /login en ≤3 s", async ({
  browser,
}) => {
  // 🔴 ESTE TEST EXISTE PORQUE LA GUARDA PURA NO BASTABA (ronda 3, M5). Aquélla
  // suma constantes; C3 mide TIEMPO, desde el clic hasta `/login`. Medido con
  // los límites de entonces (1000+1400+500 = 2900 "dentro de presupuesto"), el
  // recorrido real daba **3002, 3021 y 3078 ms**: C3 se incumplía y la guarda
  // seguía verde. El camino no era patológico — era el peor camino normal.
  //
  // Las tres etapas se fuerzan de verdad, cada una por su mecanismo:
  //   1) limpieza push: se deja un endpoint en el dispositivo Y se corta la red
  //      del contexto, así que la mutación de Convex no puede resolverse y la
  //      carrera consume su límite entero.
  //   2) el cierre: se retiene la petición hasta 50 ms antes de su límite y
  //      entonces se responde OK. Es el peor caso que aún CONFIRMA — un poco
  //      más y sería el abortado, que ya no navega y no es lo que mide C3.
  //   3) limpieza de cliente: la llamada de `signOut()` no responde nunca.
  //
  // ⚠️ `route.fulfill` no toca la red, así que funciona con el contexto
  // offline. La red se restablece justo antes de responder, para que la
  // navegación a /login sea real y no una simulación.
  test.slow();
  const pagina = await abrirSesionPropia(browser, "sales");
  await pagina.goto("/ajustes");
  await pagina.evaluate(
    ([clave]) =>
      window.localStorage.setItem(
        clave,
        "https://ejemplo.invalido/endpoint-de-prueba",
      ),
    [PUSH_ENDPOINT_KEY],
  );

  const RETARDO_CIERRE_MS = LIMITE_CIERRE_MS - 50;

  /** Holgura para granularidad de temporizadores y para el desfase entre que
   *  el navegador despacha la petición y el manejador de `route` la observa.
   *  Va en la dirección PERMISIVA de cada suelo, así que no puede fabricar un
   *  verde: sólo evita un rojo por 3 ms. */
  const TOLERANCIA_ETAPA_MS = 40;

  let peticiones = 0;
  let tPrimeraPeticion = 0;
  let tRespuesta = 0;
  await pagina.route("**/api/auth", async (route) => {
    if (!(route.request().postData() ?? "").includes("signOut")) {
      return route.fallback();
    }
    peticiones++;
    if (peticiones === 1) {
      tPrimeraPeticion = Date.now();
      await new Promise((r) => setTimeout(r, RETARDO_CIERRE_MS));
      await pagina.context().setOffline(false);
      tRespuesta = Date.now();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ tokens: null }),
      });
    }
    return new Promise(() => {}); // la de signOut() no responde nunca
  });

  const control = pagina.getByRole("button", { name: "Cerrar sesión" });
  await control.hover(); // asentar antes de cronometrar (ver prepararCierre)
  await pagina.context().setOffline(true);
  const t0 = Date.now();
  await control.click();
  await pagina.waitForURL("**/login", { timeout: PRESUPUESTO_C3_MS + 3000 });
  const total = Date.now() - t0;

  const forzado =
    LIMITE_LIMPIEZA_MS + RETARDO_CIERRE_MS + LIMITE_LIMPIEZA_CLIENTE_MS;

  // 🔴 RONDA 5 (M5): ANTES ESTO SÓLO SE IMPRIMÍA. El test calculaba `forzado`,
  // lo sacaba por consola y luego comprobaba únicamente el TECHO
  // (`total <= 3000`). Un número que se imprime y no se compara es una
  // observación, no un control — y el modo de fallo es exactamente el que
  // describe el auditor: si una etapa termina antes de tiempo (una promesa que
  // rechaza, un límite que no llega a consumirse), el total BAJA, las dos
  // peticiones se alcanzan igual, y `total <= 3000` sigue verde SIN haber
  // ejercitado el peor camino que el test dice ejercitar. Falla hacia el verde.
  //
  // Ahora se observa el consumo EFECTIVO de cada etapa por separado, con su
  // propio suelo. Un techo sin suelo mide que no te pasaste; no mide que
  // llegaras.
  const etapaPush = tPrimeraPeticion - t0;
  const etapaCierre = tRespuesta - tPrimeraPeticion;
  const etapaCliente = total - (tRespuesta - t0);

  console.log(
    `[AIT-127 · C3] gesto → /login = ${total} ms · forzado = ${forzado} ms · ` +
      `sobrecarga = ${total - forzado} ms (margen reservado ${MARGEN_SOBRECARGA_MS} ms)\n` +
      `[AIT-127 · C3] etapas medidas: push ${etapaPush} ms (límite ${LIMITE_LIMPIEZA_MS}) · ` +
      `cierre ${etapaCierre} ms (retenido ${RETARDO_CIERRE_MS}) · ` +
      `cliente ${etapaCliente} ms (límite ${LIMITE_LIMPIEZA_CLIENTE_MS})`,
  );

  // CONTROL: las dos peticiones se alcanzaron. Sin esto, un total pequeño no
  // distingue "fue rápido" de "no se forzó nada".
  expect(
    peticiones,
    "no se alcanzaron las dos llamadas de cierre: las etapas no se forzaron",
  ).toBeGreaterThanOrEqual(2);

  // SUELO POR ETAPA — cada una tuvo que consumir su límite de verdad.
  expect(
    etapaPush,
    `la limpieza push consumió ${etapaPush} ms y su límite es ${LIMITE_LIMPIEZA_MS} ms: ` +
      `no se agotó, así que el peor camino NO se ejercitó`,
  ).toBeGreaterThanOrEqual(LIMITE_LIMPIEZA_MS - TOLERANCIA_ETAPA_MS);

  expect(
    etapaCierre,
    `la primera llamada de cierre estuvo retenida ${etapaCierre} ms y se pidieron ` +
      `${RETARDO_CIERRE_MS} ms: no se retuvo lo que este test afirma retener`,
  ).toBeGreaterThanOrEqual(RETARDO_CIERRE_MS - TOLERANCIA_ETAPA_MS);

  expect(
    etapaCliente,
    `la limpieza de cliente consumió ${etapaCliente} ms y su límite es ` +
      `${LIMITE_LIMPIEZA_CLIENTE_MS} ms: no se agotó`,
  ).toBeGreaterThanOrEqual(LIMITE_LIMPIEZA_CLIENTE_MS - TOLERANCIA_ETAPA_MS);

  // SUELO DEL TOTAL, derivado del retardo REALMENTE forzado. Es redundante con
  // los tres de arriba y se conserva a propósito: si mañana alguien añade una
  // cuarta etapa y se olvida de darle suelo, este sigue cazando que el
  // recorrido completo se acortó.
  expect(
    total,
    `del gesto a /login pasaron ${total} ms, por debajo de los ${forzado} ms que ` +
      `este test fuerza: alguna etapa no se consumió y el techo de abajo daría ` +
      `verde sin haber medido el peor camino`,
  ).toBeGreaterThanOrEqual(forzado - TOLERANCIA_ETAPA_MS);

  // TECHO: el criterio C3 propiamente dicho.
  expect(
    total,
    `del gesto a /login pasaron ${total} ms y C3 da ${PRESUPUESTO_C3_MS} ms`,
  ).toBeLessThanOrEqual(PRESUPUESTO_C3_MS);
});

test("C3 y C4 · con el cierre correcto, se llega a /login en ≤3 s y no se queda en la pantalla autenticada", async ({
  browser,
}) => {
  const pagina = await abrirSesionPropia(browser, "sales");
  await pulsarCerrarSesion(pagina, "ajustes");
  await pagina.waitForURL("**/login", { timeout: 3000 });
  expect(pagina.url()).toContain("/login");
  await pagina.context().close();
});

// C7, textual del veredicto de plan (loop5:296-306): "forzado el fallo del
// cierre: alerta visible POR ROL + NO SE NAVEGA + LA SESION SIGUE VIVA,
// comprobada contra el servidor".
//
// ⚠️ "POR ROL" SON LOS ROLES DE USUARIO, y lo leí mal una vez: mi rótulo
// decía "alerta visible ... por su ROL, no por un testid", que es el rol
// ARIA. Las dos lecturas son gramaticalmente válidas, y elegí la que mi
// código YA cumplía — el test corría solo con `sales`. La otra pedía dos
// roles y una de las dos condiciones no estaba medida. Ahora van los dos
// roles y los dos botones: 4 combinaciones, no 1.
for (const role of ["owner", "sales"] as Role[]) {
  for (const boton of ["ajustes", "menu"] as const) {
    test(`C7 · ${role} · botón de ${boton} · con el cierre forzado a fallar: alerta visible, NO se navega, y la sesión sigue viva contra el servidor`, async ({
      browser,
    }) => {
      const pagina = await abrirSesionPropia(browser, role);

      // Se corta la petición de cierre. ⚠️ Lo que falla NO es `signOut()`: esa
      // función NO PUEDE fallar — `@convex-dev/auth/dist/react/client.js:164-174`
      // se traga todos los errores. Lo que falla es la petición al proxy cuyo
      // resultado el código SÍ mira, que es justo el arreglo que esto comprueba.
      // La limpieza push no se toca: su fallo no debe detener nada, y aquí se
      // aísla el otro camino.
      await pagina.route("**/api/auth", async (route) => {
        const cuerpo = route.request().postData() ?? "";
        if (cuerpo.includes("signOut")) return route.abort("failed");
        return route.fallback();
      });

      await pulsarCerrarSesion(pagina, boton);

      // (1) el aviso existe y se localiza por su rol ARIA, no por un testid
      await expect(
        pagina
          .getByRole("alert")
          .filter({ hasText: "No se ha podido confirmar el cierre de sesión" }),
      ).toBeVisible();

      // (2) NO se ha navegado
      expect(pagina.url()).not.toContain("/login");

      // (3) ⚠️ Y AQUÍ LO VERDE ES LO RARO: la sesión SIGUE VIVA, y es lo
      //     correcto. Redirigir a /login sin haber cerrado sería la señal
      //     falsa que esta ficha persigue. Si alguien "arregla" esto,
      //     reintroduce el defecto. Y se comprueba CONTRA EL SERVIDOR: es la
      //     única condición de C7 que no se puede sustituir por leer un
      //     almacenamiento.
      expect(await elServidorDejaEntrar(pagina)).toBe(true);

      await pagina.context().close();
    });
  }
}

test("M1 · la SEGUNDA llamada de cierre se queda colgada: aun así se llega a /login en ≤3 s", async ({
  browser,
}) => {
  const pagina = await abrirSesionPropia(browser, "sales");

  // El camino de EN MEDIO, que no cubría ninguno de los otros dos tests:
  //   · el normal comprueba que todo va bien,
  //   · C7 aborta la PRIMERA petición, así que nunca llega a la segunda.
  // Aquí la primera responde bien —el cierre SÍ ocurre y las cookies se
  // borran— y la segunda, la que hace `signOut()` de la librería, se queda
  // PENDIENTE para siempre. `signOut()` no tiene timeout y su `catch` solo
  // cubre el rechazo, no que la promesa nunca resuelva.
  let peticionesDeCierre = 0;
  await pagina.route("**/api/auth", async (route) => {
    const cuerpo = route.request().postData() ?? "";
    if (!cuerpo.includes("signOut")) return route.fallback();
    peticionesDeCierre++;
    if (peticionesDeCierre === 1) return route.fallback(); // la primera, normal
    return new Promise(() => {}); // la segunda no se resuelve NUNCA
  });

  await pulsarCerrarSesion(pagina, "ajustes");

  // Lo que M1 rompía: el hook no devolvía, nadie navegaba, y la pantalla
  // autenticada se quedaba visible. Con el margen acotado, se abandona la
  // limpieza de cliente y se sigue.
  await pagina.waitForURL("**/login", { timeout: 3000 });
  expect(pagina.url()).toContain("/login");

  // CONTROL: que de verdad se llegó a la segunda llamada. Sin esto, un verde
  // aquí no distingue "se abandonó bien" de "nunca hubo segunda petición que
  // colgar" — y entonces el test no estaría probando nada.
  expect(
    peticionesDeCierre,
    "no se llegó a la segunda llamada de cierre: el test no ejercita M1",
  ).toBeGreaterThanOrEqual(2);

  await pagina.context().close();
});

test("M2 · la PRIMERA llamada de cierre se queda colgada: sigue pendiente hasta el límite, se aborta, y solo entonces avisa", async ({
  browser,
}) => {
  const pagina = await abrirSesionPropia(browser, "sales");

  // El tercer camino. C7 aborta la primera —rechazo INMEDIATO— y el de M1 cuelga
  // la segunda. Aquí la PRIMERA se queda PENDIENTE: no rechaza ni responde, así
  // que sin límite no se clasifica como fallo NI tiene duración máxima, y el
  // hook no retornaba nunca.
  //
  // ⚠️ RONDA 4 (M2): ANTES ESTO SOLO CONTABA QUE LA PETICIÓN SE ALCANZÓ. El
  // control era `peticionesDeCierre >= 1`, y con eso el test quedaba verde
  // aunque la petición hubiera terminado por cualquier otro motivo antes del
  // límite — o aunque una regresión futura la rechazara al instante. Contaba
  // que el sujeto EXISTIÓ, no que le pasara lo que el test dice comprobar.
  // Ahora se observan las dos mitades del sujeto: que sigue PENDIENTE mientras
  // no ha vencido el plazo, y que lo que la termina es un ABORTADO.
  let peticionesDeCierre = 0;
  const fallos: string[] = [];
  pagina.on("requestfailed", (peticion) => {
    if ((peticion.postData() ?? "").includes("signOut")) {
      fallos.push(peticion.failure()?.errorText ?? "(sin errorText)");
    }
  });

  await pagina.route("**/api/auth", async (route) => {
    const cuerpo = route.request().postData() ?? "";
    if (!cuerpo.includes("signOut")) return route.fallback();
    peticionesDeCierre++;
    return new Promise(() => {}); // no se resuelve NUNCA
  });

  const control = await prepararCierre(pagina, "ajustes");
  const t0 = Date.now();
  await control.click();

  // (1) ANTES DEL LÍMITE: la petición se alcanzó, sigue PENDIENTE (no ha
  //     fallado) y NO hay aviso todavía. Sin esta mitad, un rechazo prematuro
  //     produciría el mismo verde que el abortado que se quiere comprobar.
  const ANTES_MS = LIMITE_CIERRE_MS - 400;
  const esperaAntes = t0 + ANTES_MS - Date.now();
  if (esperaAntes > 0) await pagina.waitForTimeout(esperaAntes);
  expect(
    peticionesDeCierre,
    "no se llegó a la primera llamada de cierre: el test no ejercita M2",
  ).toBeGreaterThanOrEqual(1);
  expect(
    fallos,
    `a los ${ANTES_MS} ms la petición ya había terminado (${fallos.join(", ")}): ` +
      "no llegó pendiente hasta el límite, así que lo de abajo no mide el abortado",
  ).toEqual([]);
  // ⚠️ SE FILTRA POR TEXTO, Y NO ES COSMÉTICA: `getByRole("alert")` a secas
  // devolvía DOS elementos aquí y ninguno era mío — Next monta su propio
  // anunciador de ruta con `role="alert"`. Contar "alertas" habría sido contar
  // mobiliario del framework: la sonda no distinguía mi aviso de lo que hay
  // siempre. Es el mismo fallo que un cero sin control positivo, del lado del
  // uno.
  await expect(
    pagina
      .getByRole("alert")
      .filter({ hasText: "No se ha podido confirmar el cierre de sesión" }),
    "el aviso de fallo aparece ANTES de vencer el límite: el cierre no espera " +
      "lo que dice esperar",
  ).toHaveCount(0);

  // (2) DESPUÉS DEL LÍMITE: lo que termina la petición es un ABORTADO, y solo
  //     entonces aparece el aviso. Esto es lo que ata el verde al
  //     `AbortController`, y no a un genérico "algo salió mal".
  await expect(
    pagina
      .getByRole("alert")
      .filter({ hasText: "No se ha podido confirmar el cierre de sesión" }),
  ).toBeVisible({ timeout: 5000 });
  expect(pagina.url()).not.toContain("/login");
  expect(
    fallos.join(" · "),
    "la petición no terminó abortada: el aviso podría venir de otro fallo, " +
      "no del límite que este test comprueba",
  ).toMatch(/abort/i);

  await pagina.context().close();
});

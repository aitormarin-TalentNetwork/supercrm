import { test, expect, type Browser, type Page } from "@playwright/test";
import { HOME_BY_ROLE, type Role } from "./authState";
import { ENUMERAR_CONTROLES_ALCANZABLES } from "./enumerarNavegadores";
import {
  LIMITE_LIMPIEZA_MS,
  LIMITE_CIERRE_MS,
  LIMITE_LIMPIEZA_CLIENTE_MS,
  PRESUPUESTO_C3_MS,
  MARGEN_SOBRECARGA_MS,
  PRESUPUESTO_C3_FALLO_MS,
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

/** AIT-134 · Los TRES estados. Ninguno se deduce de la negación de otro.
 *
 * 🔴 QUÉ ARREGLA, Y ERA UN DEFECTO MÍO DE AIT-127: el predicado anterior era
 * `destino.includes("/login")`, que acepta **una URL con `/login` en el query** y
 * **un destino de OTRO ORIGEN terminado en `/login`**. Y era binario, así que
 * metía en el mismo saco *"me dejó entrar"* y *"pasó algo raro"*.
 * **"No es la denegación esperada" NO implica "el servidor deja entrar."**
 *
 * ⚠️ ENDURECERLO NO ES NEUTRO, y la dirección no es propiedad del cambio: es del
 * cambio Y de la expectativa que consume su resultado.
 *
 * ⛔ ESTE PÁRRAFO AFIRMÓ LO CONTRARIO Y ERA FALSO. Decía: *"los que CUENTAN
 * entradas (C2a, C2c) se vuelven más exigentes -> hacia el rojo"*. **Lo medí
 * después y es al revés.** Lo dejo citado en pasado en vez de sustituirlo en
 * limpio, porque el error estaba **dentro del bloque que explica esta misma
 * lección** y eso es lo que hay que poder ver.
 *
 * 🔴 LO CIERTO: LOS CUATRO CONSUMIDORES IBAN HACIA EL VERDE, por DOS mecanismos
 * distintos — y por eso ninguno se habría puesto rojo:
 *   · los que esperaban `true` (los dos CONTROLES POSITIVOS y C7) **pasan más
 *     fácil**. Un control que pasa más fácil discrimina menos, y discriminar es
 *     su único trabajo.
 *   · los que CUENTAN (C2a, C2c) **pierden el caso**: un `ANOMALO` deja de
 *     contar como entrada y **desaparece del recuento** en vez de contar. El
 *     «cero entradas» de C2a se vuelve más fácil, y el barrido de C2c lee un
 *     anómalo como *"ya no entra"* y **ACORTA la ventana residual medida** — un
 *     número más bonito por un fallo, no por un cierre.
 *
 * 🔑 **Un test que se ablanda no se pone rojo: se queda verde discriminando
 * menos.** Por eso los tres que esperaban `true` pasan a exigir
 * `ACCESO_CONFIRMADO` —observable POSITIVO, no la negación de la denegación— y
 * los dos que cuentan pasan a contar los TRES estados exigiendo cero `ANOMALO`.
 * Se cierra por PARTICIÓN y no por lista de casos: cada sondeo cae en uno y sólo
 * uno, así que no queda resto por donde algo desaparezca.
 */
import {
  clasificarRespuesta,
  type EstadoAcceso,
} from "./clasificarAcceso";

/** Envoltorio: pide la ruta protegida y delega la CLASIFICACIÓN en la función
 *  pura, que es la que tiene su propia prueba (`00-clasificar-acceso.spec.ts`).
 *  Aquí sólo vive el "cómo se pide"; el "qué significa" vive allí. */
/** La evidencia de UNA clasificación concreta. Existe por M1. */
type EvidenciaAcceso = {
  estado: EstadoAcceso;
  codigo: number;
  location: string;
  url: string;
  marca: string;
};

/** 🔴 M1 — POR QUÉ ESTO DEVUELVE EVIDENCIA Y NO SÓLO EL ESTADO.
 *
 * El auditor pidió (plan loop8, M1) «una correlación exclusiva y comprobable
 * entre la invocación del sujeto, la petición contada y la respuesta
 * clasificada». Lo intenté con un contador `pagina.on("request")`, y estaba
 * ROTO DE UNA FORMA QUE NO PODÍA VERSE EN VERDE:
 *
 *   · esta función pide por `pagina.request` -> APIRequestContext
 *   · `pagina.on("request")` sólo emite para peticiones DE LA PÁGINA
 *   · o sea que el contador NO PODÍA VER, por construcción, la petición que se
 *     estaba clasificando.
 *
 * Y hay un número que lo demuestra, que llevaba publicándose todo el rato:
 * `clasificarAcceso` se invoca DOS veces en la fase B y el contador publicaba
 * **1**. Ese 1 era la petición DEL PRODUCTO (el fetch de confirmación por efecto
 * que añadió AIT-134). El `expect(>= 1)` pasaba **gracias a un emisor ajeno al
 * sujeto**, así que habría pasado igual con la prueba retornando antes de
 * clasificar nada. Un UNO sin control positivo, que engaña más que un cero
 * porque tranquiliza.
 *
 * 🔑 EL ARREGLO NO ES ATAR MEJOR EL CONTADOR: es cambiar de observable. Un
 * listener correlaciona por PROXIMIDAD (llegó cerca, luego será la mía); una
 * respuesta correlaciona por IDENTIDAD (esta respuesta ES el resultado de esta
 * petición). Lo segundo no se puede falsear retornando antes.
 *
 * La `marca` cierra el último hueco: viaja en la URL pedida y vuelve en
 * `respuesta.url()`, así que la evidencia acredita **esta invocación** y no una
 * anterior. Es una diferencia declarada entre prueba y producto —el producto no
 * manda ninguna marca— y no afecta al enrutado: `/pipeline(.*)` la captura igual.
 */
async function clasificarAccesoConEvidencia(
  pagina: Page,
): Promise<EvidenciaAcceso> {
  const marca = `sonda-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const respuesta = await pagina.request.get(
    `${RUTA_PROTEGIDA}?marca=${marca}`,
    { maxRedirects: 0, failOnStatusCode: false },
  );
  const location = respuesta.headers()["location"] ?? "";
  return {
    estado: clasificarRespuesta(respuesta.status(), location, respuesta.url()),
    codigo: respuesta.status(),
    location,
    url: respuesta.url(),
    marca,
  };
}

async function clasificarAcceso(pagina: Page): Promise<EstadoAcceso> {
  return (await clasificarAccesoConEvidencia(pagina)).estado;
}

/** 🔴 ESTE HELPER SE RETIRA, Y EL MOTIVO ES UN ABLANDAMIENTO QUE ME HICE YO.
 *
 *  Al endurecer el clasificador, `!(denegación)` pasó a `=== ACCESO_CONFIRMADO`.
 *  Suena más estricto y **para los conteos es más FLOJO**:
 *      antes -> un ANOMALO contaba como entrada
 *      ahora -> un ANOMALO no cuenta como nada, y desaparece
 *  O sea que el «cero entradas» de C2a se volvía **más fácil de pasar**, y por
 *  la peor puerta: **un test que se ablanda no se pone rojo, se queda verde
 *  discriminando menos.** Nadie lo habría visto en la suite.
 *
 *  Se sustituye por un contador de los TRES estados, que no deja hueco: cada
 *  sondeo cae en uno y sólo uno, y el ANÓMALO **se cuenta aparte y se exige
 *  cero** en vez de absorberse. */
type Recuento = { entradas: number; denegaciones: number; anomalos: number };

function contar(recuento: Recuento, estado: EstadoAcceso): Recuento {
  if (estado === "ACCESO_CONFIRMADO") recuento.entradas++;
  else if (estado === "DENEGACION_ESPERADA") recuento.denegaciones++;
  else recuento.anomalos++;
  return recuento;
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
    await clasificarAcceso(pagina),
    "la sesión no servía ANTES de cerrar: la medición no vale",
  ).toBe("ACCESO_CONFIRMADO");
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
  const recuento: Recuento = { entradas: 0, denegaciones: 0, anomalos: 0 };
  for (let offset = 0; offset <= TECHO_MS + 1000; offset += PASO_MS) {
    const espera = t0 + offset - Date.now();
    if (espera > 0) await pagina.waitForTimeout(espera);
    const salida = Date.now() - t0;
    sondeos++;
    const estado = await clasificarAcceso(pagina);
    contar(recuento, estado);
    if (estado === "ACCESO_CONFIRMADO") {
      ultimoSiEntraMs = salida;
      continue;
    }
    // ⛔ Sólo la DENEGACIÓN cierra la ventana. Un ANÓMALO no la cierra y no se
    //    absorbe. Con el predicado binario un anómalo se leía como "ya no
    //    entra" y ACORTABA la ventana medida: un número más bonito por un
    //    fallo, no por un cierre.
    if (estado === "DENEGACION_ESPERADA") {
      primerNoEntraMs = salida;
      break;
    }
    primerNoEntraMs = salida;
    break;
  }
  const ventanaMs = primerNoEntraMs;

  expect(
    recuento.anomalos,
    `hubo ${recuento.anomalos} respuestas ANÓMALAS durante el barrido: no son ` +
      `accesos ni denegaciones, así que la ventana medida no significa lo que dice.`,
  ).toBe(0);

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
      const recuento: Recuento = { entradas: 0, denegaciones: 0, anomalos: 0 };

      for (let i = 0; i < INTENTOS_POR_COMBINACION; i++) {
        const pagina = await abrirSesionPropia(browser, role);
        expect(
          await clasificarAcceso(pagina),
          `iteración ${i + 1}: la sesión no servía ANTES de cerrar`,
        ).toBe("ACCESO_CONFIRMADO");

        const control = await prepararCierre(pagina, boton);

        // El cronómetro arranca con el control ya asentado, así que t0 es el
        // gesto de verdad. Ver `prepararCierre`: sin eso este número no es
        // 500 ms desde nada que le pase al usuario.
        const t0 = Date.now();
        await control.click();
        const restante = t0 + RETARDO_GESTO_MS - Date.now();
        if (restante > 0) await pagina.waitForTimeout(restante);
        contar(recuento, await clasificarAcceso(pagina));
        await pagina.context().close();
      }

      console.log(
        `[AIT-127 · C2c] ${role}/${boton}: entraron ${recuento.entradas} de ` +
          `${INTENTOS_POR_COMBINACION} a ${RETARDO_GESTO_MS} ms · denegaciones ` +
          `${recuento.denegaciones} · anómalos ${recuento.anomalos}`,
      );
      // ⛔ EL ANÓMALO SE EXIGE CERO. Sin esto, endurecer el clasificador ABLANDA
      //    este conteo: un anómalo dejaría de contar como entrada y
      //    desaparecería, y el criterio pasaría más fácil sin ponerse rojo.
      expect(
        recuento.anomalos,
        `${recuento.anomalos} respuestas ANÓMALAS en ${INTENTOS_POR_COMBINACION} intentos`,
      ).toBe(0);
      expect(
        recuento.entradas,
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
  // ⚠️ MISMA FAMILIA QUE EL RESIDUO DE ABAJO, Y LO ENCONTRÉ AUDITANDO ESTE
  // FICHERO DESPUÉS DE QUE EL OTRO NOS ENGAÑARA A DOS. Esto NO es "la etapa de
  // limpieza push": va del GESTO a la primera petición, así que contiene la
  // carrera (acotada a LIMITE_LIMPIEZA_MS) **más el despacho del clic y la
  // lógica síncrona**. Medido: 769 y 782 contra un límite de 750.
  // Se conserva como suelo —tiene que contener la carrera entera— pero se
  // publica con su nombre, no como si se comparara con el límite.
  const restoHastaLaPrimeraPeticion = tPrimeraPeticion - t0;
  const etapaCierre = tRespuesta - tPrimeraPeticion;
  // 🔴 ESTO NO ES "LA ETAPA DE LIMPIEZA", Y SE LLAMABA ASÍ. Es un RESIDUO: todo
  // lo que queda entre la respuesta del cierre y `/login`. Contiene la carrera de
  // limpieza (acotada a LIMITE_LIMPIEZA_CLIENTE_MS) **y además** `router.replace`,
  // el render y la carga de la pantalla.
  //
  // ⛔ LO DELATA LA ARITMÉTICA: las tres "etapas" suman EXACTAMENTE el total
  // (medido: 782+1357+945 = 3084 y 769+1353+696 = 2818). **Un residuo no puede
  // tener límite propio, porque contiene todo lo que los otros dos no midieron.**
  //
  // ⚠️ SE RENOMBRA PORQUE EL NOMBRE YA ENGAÑÓ A DOS PERSONAS: al leer
  // `cliente 945 ms (límite 500)` la conclusión natural es "la limpieza incumple
  // su límite", y es falsa — 500 son la carrera y 445 la cola. **Dos lectores con
  // el mismo malentendido sobre el mismo número no es mala suerte: es el nombre.**
  const restoHastaLogin = total - (tRespuesta - t0);
  // Y ÉSTE es el número que de verdad importa para el presupuesto: lo que la cola
  // añade por encima de la carrera. Es lo que `MARGEN_SOBRECARGA_MS` dice cubrir.
  const sobrecargaDeLaCola = restoHastaLogin - LIMITE_LIMPIEZA_CLIENTE_MS;

  console.log(
    `[AIT-127 · C3] gesto → /login = ${total} ms · forzado = ${forzado} ms · ` +
      `sobrecarga = ${total - forzado} ms (margen reservado ${MARGEN_SOBRECARGA_MS} ms)\n` +
      `[AIT-127 · C3] tramos medidos: gesto→1ª petición ${restoHastaLaPrimeraPeticion} ms ` +
      `(contiene la carrera de ${LIMITE_LIMPIEZA_MS} + el despacho) · ` +
      `cierre ${etapaCierre} ms (retenido ${RETARDO_CIERRE_MS}) · ` +
      `resto hasta /login ${restoHastaLogin} ms = carrera ${LIMITE_LIMPIEZA_CLIENTE_MS} ` +
      `+ cola ${sobrecargaDeLaCola} ms · margen reservado ${MARGEN_SOBRECARGA_MS}`,
  );

  // CONTROL: las dos peticiones se alcanzaron. Sin esto, un total pequeño no
  // distingue "fue rápido" de "no se forzó nada".
  expect(
    peticiones,
    "no se alcanzaron las dos llamadas de cierre: las etapas no se forzaron",
  ).toBeGreaterThanOrEqual(2);

  // SUELO POR ETAPA — cada una tuvo que consumir su límite de verdad.
  expect(
    restoHastaLaPrimeraPeticion,
    `la limpieza push consumió ${restoHastaLaPrimeraPeticion} ms y su límite es ${LIMITE_LIMPIEZA_MS} ms: ` +
      `no se agotó, así que el peor camino NO se ejercitó`,
  ).toBeGreaterThanOrEqual(LIMITE_LIMPIEZA_MS - TOLERANCIA_ETAPA_MS);

  expect(
    etapaCierre,
    `la primera llamada de cierre estuvo retenida ${etapaCierre} ms y se pidieron ` +
      `${RETARDO_CIERRE_MS} ms: no se retuvo lo que este test afirma retener`,
  ).toBeGreaterThanOrEqual(RETARDO_CIERRE_MS - TOLERANCIA_ETAPA_MS);

  // Suelo del RESIDUO: tiene que contener al menos la carrera entera. Es un
  // suelo, no un techo — y no se le pone techo a propósito, porque lo que lo
  // excede no es la limpieza sino la cola, que se vigila con el margen.
  expect(
    restoHastaLogin,
    `el resto hasta /login fue ${restoHastaLogin} ms y sólo la carrera de ` +
      `limpieza ya vale ${LIMITE_LIMPIEZA_CLIENTE_MS} ms: no se agotó`,
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

  // 🔴 LA GUARDA QUE CAMBIA DE PREGUNTA (decisión del PM, 2026-09-10).
  //
  // ANTES la sobrecarga sólo se vigilaba con una prueba PURA que comparaba
  // `MARGEN_SOBRECARGA_MS` contra un literal escrito a mano (`278`). Eso medía
  // **si alguien había bajado el margen**, no **si el margen seguía bastando**:
  // con 445 ms observados hoy, aquella guarda seguía VERDE porque el 278 no se
  // entera solo. Un peor caso guardado como literal deja de ser el peor en
  // cuanto mides otra vez.
  //
  // Ahora la pregunta la contesta la corrida: **si la sobrecarga observada AQUÍ
  // supera el margen, esta corrida falla**, aunque el total todavía quepa.
  //
  // ⚠️ Y falla aunque C3 pase: es a propósito. Un total que cabe con la
  // sobrecarga comiéndose el margen es un verde que descansa en la holgura de
  // otras etapas — o sea **un fallo con margen**, que es lo que esto persigue.
  const sobrecargaObservada = total - forzado;
  expect(
    sobrecargaObservada,
    `la sobrecarga observada en ESTA corrida (${sobrecargaObservada} ms) supera ` +
      `el margen reservado (${MARGEN_SOBRECARGA_MS} ms). No subas el presupuesto ` +
      `ni bajes el margen: el margen se cubre recortando un límite, y cuál se ` +
      `recorta lo decide el PM.`,
  ).toBeLessThanOrEqual(MARGEN_SOBRECARGA_MS);

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
    test(`C7' · ${role} · botón de ${boton} · con el cierre Y LA RECUPERACIÓN forzados a fallar: alerta visible, NO se navega, y la sesión sigue viva`, async ({
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

      // 🔴 AIT-134 ESTRECHA ESTE CRITERIO, Y SIN ESTA SEGUNDA LÍNEA EL TEST YA NO
      // MIDE NADA. C7 exigía "alerta, no se navega, sesión viva" tras un cierre
      // fallido — y AIT-134 mata las tres A PROPÓSITO: ahora el cierre fallido se
      // RECUPERA, la sesión deja de estar viva y se navega.
      //
      // ⚠️ C7 NO ESTABA ROTO: ESTABA SUPERADO. Lo que sigue siendo cierto es el
      // mundo en que NADIE puede cerrar la sesión — ni el cierre normal ni la
      // recuperación. Ése es el que se fabrica aquí, y por eso el criterio se
      // ESTRECHA en vez de retirarse: las tres condiciones son las mismas, cambia
      // el mundo en que se exigen. (Decisión del PM, 2026-09-10.)
      await pagina.route(`**${RUTA_CIERRE_LOCAL}`, (ruta) =>
        ruta.fulfill({ status: 500, body: "" }),
      );

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
      expect(
        await clasificarAcceso(pagina),
        "C7': la sesión tiene que seguir VIVA cuando NADIE ha podido cerrarla, y " +
          "se acredita con el observable POSITIVO (ACCESO_CONFIRMADO), no negando " +
          "la denegación",
      ).toBe("ACCESO_CONFIRMADO");

      await pagina.context().close();
    });
  }
}

// ══ C7'' · EL 5xx, QUE ES LA OTRA MITAD DE LA PARTICIÓN ═════════════════════
//
// 🔴 POR QUÉ EXISTE, Y ES UN HUECO MÍO, NO UNA VARIANTE MÁS. `cierreConfirmado`
// puede ser falso por DOS vías, y son una partición, no una lista de casos:
//     (a) NO HAY RESPUESTA  -> aborto, red caída, vencimiento del plazo
//     (b) HAY RESPUESTA Y DICE QUE NO -> 5xx del servidor o del proxy de delante
// Los cuatro C7' de arriba, M2' y el reverso fuerzan TODOS la vía (a), con
// `route.abort("failed")` o colgando la petición. **La vía (b) no la medía
// nadie.** Lo levantó el PM desde un 502 real que el QA vio en producción.
//
// ⚠️ Y LA DIRECCIÓN ES LA MALA, que es lo que lo hace urgente y no cosmético:
// si el código tratase un 502 como cierre confirmado —`status !== 0`, un
// `try/catch` que sólo mira excepciones, cualquier cosa que confunda "respondió"
// con "cerró"— entonces **nada se pondría rojo**. La app navegaría a /login con
// las cookies vivas, el usuario se iría creyendo que ha salido, y la suite
// entera seguiría verde porque todos sus mundos de fallo son de la vía (a). Ése
// es literalmente el daño que AIT-127 vino a matar, entrando por la otra puerta.
//
// Este test se pone rojo en ese mundo: con un 502, si se navegase a /login
// fallaría (2), y si se reportase éxito no habría alerta y fallaría (1).
//
// ⛔ NO SE CRUZA CON rol × botón a propósito. Los cuatro de arriba cruzan esos
// dos ejes porque el veredicto de plan los exigía y porque la ALERTA se pinta en
// sitios distintos según el botón. El modo de fallo es ortogonal a los dos: vive
// en el hook, antes de que nada sepa qué botón lo invocó. Cruzarlo daría ocho
// corridas de ~8 s para volver a medir el mismo `respuesta.ok` cuatro veces, y
// un control que grita de más se deja de leer.
//
// 📌 La recuperación se fuerza a fallar por lo mismo que en los C7' de arriba:
// sin eso AIT-134 cerraría la sesión de verdad y el test mediría otra cosa.
test("C7'' · el cierre RESPONDE 502 (no se cae): con la recuperación también caída, alerta visible, NO se navega, y la sesión sigue viva", async ({
  browser,
}) => {
  const pagina = await abrirSesionPropia(browser, "sales");

  // La diferencia con C7' cabe en una línea, y es toda la prueba: aquí el
  // servidor CONTESTA. `route.fulfill` en vez de `route.abort`.
  let respondio502 = false;
  await pagina.route("**/api/auth", async (route) => {
    const cuerpo = route.request().postData() ?? "";
    if (cuerpo.includes("signOut")) {
      respondio502 = true;
      return route.fulfill({
        status: 502,
        contentType: "text/html",
        body: "<html><body>502 Bad Gateway</body></html>",
      });
    }
    return route.fallback();
  });

  await pagina.route(`**${RUTA_CIERRE_LOCAL}`, (ruta) =>
    ruta.fulfill({ status: 500, body: "" }),
  );

  await pulsarCerrarSesion(pagina, "ajustes");

  // (0) CONTROL AL INSTRUMENTO, y no sobra: si el patrón de ruta o el filtro por
  // cuerpo dejaran de casar, la petición saldría real, el cierre funcionaría, y
  // este test mediría el camino sano creyendo medir el 502. Sin esta línea eso
  // se vería como un rojo confuso en (1); con ella se ve como lo que es.
  expect(
    respondio502,
    "el 502 no llegó a fabricarse: este test no ha medido la vía (b)",
  ).toBe(true);

  // (1) avisa — o sea: un 5xx SÍ dispara la alerta, no sólo nuestro timeout
  await expect(
    pagina
      .getByRole("alert")
      .filter({ hasText: "No se ha podido confirmar el cierre de sesión" }),
  ).toBeVisible();

  // (2) no navega
  expect(pagina.url()).not.toContain("/login");

  // (3) y la sesión sigue viva, con el observable positivo
  expect(
    await clasificarAcceso(pagina),
    "C7'': con un 502 nadie ha cerrado nada, así que la sesión tiene que seguir " +
      "viva — y se acredita con ACCESO_CONFIRMADO, no negando la denegación",
  ).toBe("ACCESO_CONFIRMADO");

  await pagina.context().close();
});

// ══ EL MUNDO QUE FALTABA: LA RUTA CONTESTA 200 Y LA SESIÓN SIGUE VIVA ═══════
//
// 🔴 POR QUÉ EXISTE, Y NO ES "UN CASO MÁS": SIN ESTE TEST, LA DECISIÓN CENTRAL DE
// AIT-134 NO TENÍA NI UN SOLO CRITERIO QUE LA EJERCITARA.
//
// El código prohíbe expresamente fusionar dos cosas:
//     `rutaLocalOk`  = "la ruta de cierre local respondió 200"
//     `confirmado`   = "el servidor YA NO DEJA ENTRAR"  (comprobado por efecto)
// Y esta implementación las pasa TODAS menos ésta:
//     const confirmado = rutaLocalOk;        // <- el impostor
//
// Se encontró aplicando al CONJUNTO la pregunta que no se le hace a un criterio
// suelto: **no "¿puede fallar cada uno?", sino "¿qué implementación rota los
// pasa todos?"**. La respuesta salió de una línea medida: los CUATRO tests que
// tocaban `/api/cerrar-sesion-local` la forzaban a **500**. Con la ruta siempre
// caída, `rutaLocalOk` es false en los seis criterios de "no navega / avisa /
// sesión viva", y true sólo donde la sesión SÍ se cierra de verdad. **El mundo
// en que la ruta contesta y aun así no hay que fiarse no existía.**
//
// ⚠️ QUÉ HACE EL IMPOSTOR, MEDIDO Y NO DEDUCIDO. Yo escribí primero que
// "navega a /login afirmando un cierre que nadie comprobó". **Es lo que predije,
// no lo que hace.** Ejecutado: el impostor da el cierre por bueno, llama a
// `signOut()` y borra el endpoint — y la pantalla acaba en **"Algo ha ido mal"**,
// la frontera de error. Ni avisa ni navega.
// Lo dejo escrito porque la predicción sonaba mejor que la medición y habría
// viajado igual: el daño de fondo es el mismo —dar por cerrada una sesión que
// sigue viva— pero **el observable es otro**, y quien vaya a reproducir esto
// buscando una navegación a /login no la va a encontrar.
// Lo que NO cambia es que el criterio discrimina: con el código correcto sale
// AVISA; con el impostor, no.
//
// 🔑 CÓMO SE FABRICA EL MUNDO, y es lo bonito: `route.fulfill` **impide que el
// handler real corra**. Así que la respuesta dice 200 pero **nadie ha emitido el
// `Set-Cookie` que borra las cookies**: siguen vivas y el servidor sigue dejando
// entrar. No hay que simular nada — el 200 es de verdad y el cierre no ocurrió.
test("AIT-134 · la ruta local responde 200 pero NO cerró nada: no se fía, avisa y NO navega", async ({
  browser,
}) => {
  const pagina = await abrirSesionPropia(browser, "sales");

  // El cierre normal no confirma, así que entra la recuperación.
  await pagina.route("**/api/auth", async (ruta) => {
    if (!((ruta.request().postData() ?? "").includes("signOut"))) {
      return ruta.fallback();
    }
    return ruta.abort("failed");
  });

  // Y la ruta local dice que sí SIN HACER NADA: `fulfill` no ejecuta el handler,
  // así que no hay Set-Cookie y la credencial sobrevive.
  let respondio200 = false;
  await pagina.route(`**${RUTA_CIERRE_LOCAL}`, (ruta) => {
    respondio200 = true;
    return ruta.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ cerrado: true }),
    });
  });

  await pulsarCerrarSesion(pagina, "ajustes");

  // (0) CONTROL AL INSTRUMENTO: si el 200 no se llega a fabricar, este test mide
  // el camino de la ruta caída y no el suyo — y pasaría por el motivo equivocado.
  expect(
    respondio200,
    "la ruta local no llegó a responder 200: este test no ha medido su mundo",
  ).toBe(true);

  // (1) SE ESPERA AL DESENLACE ANTES DE JUZGARLO, y esto no es cosmético:
  // mirar `pagina.url()` justo después del clic lo lee ANTES de que la
  // navegación ocurra, así que con el impostor —que sí navega— la aserción de
  // la URL pasaba y saltaba la de la alerta. El test se ponía rojo, pero
  // señalando "no hay alerta" cuando el defecto es "navegó afirmando un cierre
  // falso". Un error desplazado hace cavar en el sitio equivocado con confianza.
  const alerta = pagina
    .getByRole("alert")
    .filter({ hasText: "No se ha podido confirmar el cierre de sesión" });
  // ⚠️ CADA RAMA RESUELVE O NO TERMINA NUNCA — NINGUNA RECHAZA, y esto es el
  // arreglo de un defecto que tuvo este mismo test hace cinco minutos.
  // `Promise.race` propaga el primer SETTLEMENT, y un rechazo es un settlement:
  // con el impostor, el `waitFor` de la alerta vencía a los 5 s y su RECHAZO
  // ganaba la carrera **aunque la navegación ya hubiera ocurrido**. El test se
  // ponía rojo (bien) diciendo "NI_UNA_COSA_NI_LA_OTRA" (mal): el veredicto era
  // correcto y el motivo mentía. Un rojo con el motivo equivocado manda a cavar
  // al sitio equivocado con toda la confianza.
  const nuncaTermina = () => new Promise<never>(() => {});
  const desenlace = await Promise.race([
    alerta
      .waitFor({ state: "visible", timeout: PRESUPUESTO_C3_FALLO_MS })
      .then(() => "AVISA" as const)
      .catch(nuncaTermina),
    pagina
      .waitForURL("**/login", { timeout: PRESUPUESTO_C3_FALLO_MS })
      .then(() => "NAVEGA" as const)
      .catch(nuncaTermina),
    // El único que decide por tiempo, y va DESPUÉS de los dos: si llega éste,
    // es que de verdad no pasó ninguna de las dos cosas.
    new Promise<"NI_UNA_COSA_NI_LA_OTRA">((r) =>
      setTimeout(() => r("NI_UNA_COSA_NI_LA_OTRA"), PRESUPUESTO_C3_FALLO_MS + 750),
    ),
  ]);

  expect(
    desenlace,
    "con la ruta local devolviendo 200 SIN haber borrado nada, la app tiene que " +
      "AVISAR, porque nadie ha comprobado que la sesión se cerrara.\n" +
      "· NAVEGA -> se afirma un cierre sin confirmarlo.\n" +
      "· NI_UNA_COSA_NI_LA_OTRA -> es lo que se midió con el impostor " +
      "`confirmado = rutaLocalOk`: da el cierre por bueno, limpia el cliente y " +
      "la pantalla acaba en «Algo ha ido mal».\n" +
      "Las dos salidas significan lo mismo: alguien fusionó «la ruta respondió» " +
      "con «la sesión se cerró», que es el defecto de AIT-127 entrando por la " +
      "puerta que abrió AIT-134.",
  ).toBe("AVISA");

  // (2) y la URL, ya con el desenlace decidido
  expect(pagina.url()).not.toContain("/login");

  // (3) y la prueba de que el 200 era mentira: la sesión sigue sirviendo.
  expect(
    await clasificarAcceso(pagina),
    "si esto no es ACCESO_CONFIRMADO, el mundo que este test dice fabricar no se " +
      "fabricó: la sesión tenía que seguir viva, porque nadie borró la cookie",
  ).toBe("ACCESO_CONFIRMADO");

  await pagina.context().close();
});

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

test("M2' · la PRIMERA llamada se queda colgada y la recuperación TAMPOCO cierra: sigue pendiente hasta el límite, se aborta, y sólo entonces avisa", async ({
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

  // 🔴 AIT-134 ESTRECHA TAMBIÉN ESTE. Su última condición —"y sólo entonces
  // avisa"— presupone que tras el abortado no hay nada más que intentar, y eso
  // dejó de ser cierto: ahora se intenta la recuperación y, si funciona, NO
  // avisa porque no hay nada que avisar. Se fabrica el mundo en que tampoco la
  // recuperación puede cerrar, que es donde el aviso sigue siendo lo correcto.
  await pagina.route(`**${RUTA_CIERRE_LOCAL}`, (ruta) =>
    ruta.fulfill({ status: 500, body: "" }),
  );

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

// ═══════════════════════════════════════════════════════════════════════════
// AIT-134 — Un cierre que FALLA no puede dejar la sesión usable
// ═══════════════════════════════════════════════════════════════════════════

/** La cabecera que `proxy.ts` pone en TODA respuesta que maneja el middleware.
 *  Su AUSENCIA es el observable de que el middleware NO corrió para esa ruta. */
const CABECERA_MIDDLEWARE = "x-supercrm-commit";
const RUTA_CIERRE_LOCAL = "/api/cerrar-sesion-local";

test("AIT-134 · FASE A · la ruta de cierre local NO pasa por el middleware", async ({
  browser,
}) => {
  // 🔑 QUÉ MIDE Y POR QUÉ ASÍ. La ruta existe para el caso en que Convex no
  // responde. Si pasara por el middleware, éste ejecuta `isAuthenticated()` —un
  // `fetchQuery` a Convex SIN LÍMITE— y la ruta heredaría exactamente la
  // dependencia que viene a rodear.
  //
  // ⚠️ NO SE PUEDE INTERCEPTAR ESE `fetchQuery`: ocurre SERVIDOR -> Convex, no
  // desde el navegador, así que `page.route` no lo ve. El observable es otro y
  // es externo: `proxy.ts` pone `x-supercrm-commit` en toda respuesta que
  // maneja. **Si la cabecera no está, el middleware no corrió.**
  //
  // ⛔ ESTE TEST ES EL QUE VIGILA EL REGEX DEL MATCHER, que no se verifica
  // leyéndolo. Si alguien devuelve la ruta al matcher, esto se pone rojo.
  const pagina = await abrirSesionPropia(browser, "sales");

  // CONTROL POSITIVO DEL OBSERVABLE, y va primero: una ruta que SÍ está en el
  // matcher tiene que traer la cabecera. Sin esto, una cabecera ausente en todas
  // partes daría verde sin distinguir nada.
  const enMatcher = await pagina.request.get("/login", {
    maxRedirects: 0,
    failOnStatusCode: false,
  });
  expect(
    enMatcher.headers()[CABECERA_MIDDLEWARE],
    `el observable no discrimina: /login está en el matcher y su respuesta NO ` +
      `trae ${CABECERA_MIDDLEWARE}, así que su ausencia en la ruta local no ` +
      `probaría nada`,
  ).toBeTruthy();

  const excluida = await pagina.request.post(RUTA_CIERRE_LOCAL, {
    failOnStatusCode: false,
  });
  expect(excluida.status(), "la ruta de cierre local no respondió 200").toBe(200);
  expect(
    excluida.headers()[CABECERA_MIDDLEWARE],
    `${RUTA_CIERRE_LOCAL} trae ${CABECERA_MIDDLEWARE}: el middleware SÍ corrió ` +
      `para ella, o sea que la exclusión del matcher no está funcionando y la ` +
      `ruta depende de Convex igual que todo lo demás`,
  ).toBeUndefined();

  await pagina.context().close();
});

test("AIT-134 · FASE B · tras un cierre abortado, el servidor DEJA DE DEJAR ENTRAR", async ({
  browser,
}) => {
  // Independiente de la fase A a propósito: son `test()` separados, así que un
  // rojo de A no impide que ésta corra ni que reporte.
  test.slow();
  const pagina = await abrirSesionPropia(browser, "sales");

  // ── EL CONTADOR, RENOMBRADO A LO QUE DE VERDAD MIDE ─────────────────────
  // ⚠️ ANTES SE LLAMABA `peticionesALaRutaProtegida` Y SE PRESENTABA COMO EL
  // OBSERVABLE DE M1 —"esta prueba alcanzó su sujeto"—, Y ERA FALSO: escucha
  // `pagina.on("request")`, que NO emite para las peticiones de
  // `pagina.request` (APIRequestContext), que es por donde va la clasificación.
  // No es que pudiera contar de más: es que NO PODÍA CONTAR LA CLASIFICACIÓN.
  //
  // No se borra, porque el número es real y sirve: lo que ve son las peticiones
  // DEL PRODUCTO a la ruta protegida, o sea el `fetch` de confirmación por
  // efecto que añadió AIT-134. Eso acredita que el camino de RECUPERACIÓN llegó
  // a ejecutarse. Lo falso era el rótulo, no la medida.
  let peticionesDelProductoALaRutaProtegida = 0;
  pagina.on("request", (peticion) => {
    if (new URL(peticion.url()).pathname === RUTA_PROTEGIDA) {
      peticionesDelProductoALaRutaProtegida++;
    }
  });

  // CONTROL POSITIVO PROPIO DE ESTA FASE: antes de cerrar, el servidor deja
  // entrar. Sin él, un "deniega" al final no distingue "cerró" de "el
  // instrumento dice que no a todo".
  const evidenciaAntes = await clasificarAccesoConEvidencia(pagina);
  expect(
    evidenciaAntes.estado,
    "control positivo de la fase B: la sesión no servía ANTES de cerrar",
  ).toBe("ACCESO_CONFIRMADO");

  // Se aborta el POST de cierre: es el disparador estrecho de la ficha. NO se
  // simula un error de Convex — ése es el camino que HOY YA borra las cookies.
  let abortados = 0;
  await pagina.route("**/api/auth", async (ruta) => {
    if (!(ruta.request().postData() ?? "").includes("auth:signOut")) {
      return ruta.continue();
    }
    abortados++;
    return ruta.abort("failed");
  });

  await pulsarCerrarSesion(pagina, "ajustes");
  await pagina.waitForURL("**/login", {
    timeout: PRESUPUESTO_C3_FALLO_MS + 2000,
  });

  // EL SUJETO DE ESTA PRUEBA, y su evidencia sale de la propia respuesta.
  const evidencia = await clasificarAccesoConEvidencia(pagina);
  const estadoFinal = evidencia.estado;
  console.log(
    `[AIT-134 · FASE B] peticiones DEL PRODUCTO a ${RUTA_PROTEGIDA}: ` +
      `${peticionesDelProductoALaRutaProtegida} · abortados: ${abortados} · ` +
      `estado final: ${estadoFinal} · evidencia: codigo=${evidencia.codigo} ` +
      `location=${JSON.stringify(evidencia.location)} url=${evidencia.url}`,
  );

  expect(
    abortados,
    "no se abortó ningún cierre: esta prueba no midió el caso que dice medir",
  ).toBeGreaterThanOrEqual(1);
  // M1 · LA CORRELACIÓN EXCLUSIVA. La respuesta clasificada tiene que ser la de
  // ESTA invocación: su URL lleva la marca que se generó aquí mismo. Una prueba
  // que retornara antes no puede fabricar esta línea, porque la evidencia no
  // existe hasta que la petición ha ido y vuelto.
  expect(
    evidencia.url,
    "la respuesta clasificada no lleva la marca de esta invocación: no se puede " +
      "acreditar que sea la petición que hizo ESTA prueba, y sin eso el verde " +
      "no distingue 'mi sujeto se ejecutó' de 'alguien pidió esa ruta'",
  ).toContain(evidencia.marca);
  expect(
    new URL(evidencia.url).pathname,
    "la evidencia no es de la ruta protegida que dice medir",
  ).toBe(RUTA_PROTEGIDA);
  // 🔑 Y ESTA ES LA QUE SÍ PUEDE FALLAR EN EJECUCIÓN, que era la crítica justa a
  // la de arriba: la aserción de que la URL lleva la marca no puede fallar hoy
  // —la construimos nosotros—, así que su mundo de fallo era un refactor.
  //
  // Ésta compara las DOS clasificaciones de esta prueba y exige que sean
  // respuestas DISTINTAS. Falla de verdad si algo devuelve la primera respuesta
  // otra vez: una capa de caché sobre `pagina.request`, una memoización, o un
  // `?marca=` que alguien normalice y quite por el camino. Y esa es justo la
  // confusión que hundiría la fase B: el control positivo dice ACCESO_CONFIRMADO
  // y, si la segunda llamada devolviera ESA respuesta, el estado final también
  // — pero al revés (leyendo la vieja como nueva) el verde sería el peligroso.
  expect(
    evidencia.marca,
    "las dos clasificaciones de esta prueba comparten respuesta: la del control " +
      "positivo y la final no pueden ser la misma, o el 'estado final' no es " +
      "final, es la foto de antes de cerrar",
  ).not.toBe(evidenciaAntes.marca);
  // Y el contador del producto, ahora con su nombre: acredita la recuperación.
  expect(
    peticionesDelProductoALaRutaProtegida,
    "el producto no pidió la ruta protegida ni una vez: el camino de " +
      "recuperación de AIT-134 no llegó a confirmar por efecto",
  ).toBeGreaterThanOrEqual(1);
  expect(
    estadoFinal,
    `tras el cierre abortado el servidor devolvió ${estadoFinal}. Sólo ` +
      `DENEGACION_ESPERADA acredita que la sesión dejó de ser usable: ni ` +
      `ACCESO_CONFIRMADO ni ANOMALO valen.`,
  ).toBe("DENEGACION_ESPERADA");

  await pagina.context().close();
});

test("AIT-134 · momento (3) · si la recuperación TAMPOCO se confirma, no se navega", async ({
  browser,
}) => {
  // El caso que cierra el falso verde bilateral: la recuperación falla y la app
  // NO puede reportar éxito. `ok:true` significa confirmado por efecto, nunca
  // "la petición devolvió algo".
  test.slow();
  const pagina = await abrirSesionPropia(browser, "sales");

  await pagina.route("**/api/auth", async (ruta) => {
    if (!(ruta.request().postData() ?? "").includes("auth:signOut")) {
      return ruta.continue();
    }
    return ruta.abort("failed");
  });
  // Y la ruta de recuperación responde 500: completa, pero NO acredita nada.
  await pagina.route(`**${RUTA_CIERRE_LOCAL}`, (ruta) =>
    ruta.fulfill({ status: 500, body: "" }),
  );

  // ⚠️ LA LÍNEA BASE SE TOMA DESPUÉS DE `prepararCierre`, Y ES UN DEFECTO MÍO
  // CORREGIDO: antes la tomaba con `pagina.url()` ANTES de pulsar, pero
  // `prepararCierre(…, "ajustes")` hace un `goto("/ajustes")` — o sea que mi
  // "antes" era `/hoy` y el test fallaba comparando contra una URL anterior a
  // una navegación que causaba YO. La app se había quedado en `/ajustes`, que es
  // lo correcto.
  //
  // 🔑 El "antes" de un criterio de no-navegación tiene que ser el instante
  // inmediatamente anterior AL GESTO, no al principio del test.
  const control = await prepararCierre(pagina, "ajustes");
  const urlAntes = pagina.url();
  await control.click();
  // ⚠️ FILTRADO POR TEXTO A PROPÓSITO: `getByRole("alert")` a secas casa
  // TAMBIÉN con `__next-route-announcer__`, el anunciador de rutas de Next, que
  // también lleva `role="alert"`. Sin el filtro, strict mode falla por
  // ambigüedad — y el aviso SÍ estaba. Era un defecto de mi localizador, no del
  // producto.
  await expect(
    pagina
      .getByRole("alert")
      .filter({ hasText: "No se ha podido confirmar el cierre de sesión" }),
    "con la recuperación fallando, el usuario tiene que ver el aviso",
  ).toBeVisible({ timeout: PRESUPUESTO_C3_FALLO_MS });

  expect(
    pagina.url(),
    "se navegó pese a que NADIE confirmó el cierre: eso es exactamente el " +
      "`ok:true` que significa «el fetch no reventó»",
  ).toBe(urlAntes);

  await pagina.context().close();
});

// 🔴 EL CONTROL DEL INSTRUMENTO NO VIVE AQUÍ, Y ES UN DEFECTO MÍO CORREGIDO.
//
// Escribí un test e2e que interceptaba con `page.route()` la ruta protegida para
// devolver un 302 a otro origen… y `pagina.request.get()` **no pasa por
// `page.route()`**: las peticiones de `APIRequestContext` son OTRO CANAL. El
// señuelo nunca se aplicó, respondió el `/pipeline` real y el test daba
// `ACCESO_CONFIRMADO`.
//
// ⛔ Lo grave no es que fallara: es que **habría dado el mismo resultado con el
// predicado roto**. Un control que no toca lo que dice tocar no discrimina nada.
//
// Se rehace como prueba PURA sobre `clasificarRespuesta` en
// `e2e/00-clasificar-acceso.spec.ts`: sin servidor no hay dos canales que
// confundir, y el señuelo se construye a mano.

test("C7' · el reverso: si la recuperación SÍ cierra, NO se avisa y SÍ se navega", async ({
  browser,
}) => {
  // ⛔ ESTE ES EL `FALLA si` EXPLÍCITO QUE PIDE EL PM, y no es simetría bonita:
  // sin él, C7' se cumpliría con una implementación que **avisa siempre**, y esa
  // implementación pasaría los cuatro C7' sin que nada se pusiera rojo.
  //
  // 🔑 Y la razón de producto, que es más fuerte que la de método: conservar el
  // aviso "por si acaso" **es peor que quitarlo**. Decirle al usuario que no se
  // pudo cerrar cuando SÍ se cerró **le enseña a ignorar el aviso** — y entonces
  // tampoco lo leerá el día que sea cierto. Un aviso que miente a veces vale
  // menos que ninguno.
  test.slow();
  const pagina = await abrirSesionPropia(browser, "sales");

  // El cierre normal falla, la recuperación NO se toca: tiene que funcionar.
  await pagina.route("**/api/auth", async (ruta) => {
    if (!(ruta.request().postData() ?? "").includes("signOut")) {
      return ruta.fallback();
    }
    return ruta.abort("failed");
  });

  await pulsarCerrarSesion(pagina, "ajustes");
  await pagina.waitForURL("**/login", {
    timeout: PRESUPUESTO_C3_FALLO_MS + 2000,
  });

  // (1) SE NAVEGA. No navegar con la sesión cerrada de verdad sería la mentira
  //     nueva: dejar al usuario en una pantalla autenticada diciéndole que no se
  //     cerró, cuando sí se cerró.
  expect(pagina.url()).toContain("/login");

  // (2) NO aparece el aviso de fallo.
  await expect(
    pagina
      .getByRole("alert")
      .filter({ hasText: "No se ha podido confirmar el cierre de sesión" }),
    "se avisó de un fallo que no ocurrió: la recuperación cerró la sesión",
  ).toHaveCount(0);

  // (3) Y la sesión está cerrada DE VERDAD, contra el servidor. Sin esto, (1) y
  //     (2) los cumpliría una implementación que navega sin cerrar nada — que es
  //     exactamente el defecto original de AIT-127.
  expect(
    await clasificarAcceso(pagina),
    "se navegó y no se avisó, pero el servidor sigue dejando entrar: eso es " +
      "navegar afirmando un cierre que no ocurrió",
  ).toBe("DENEGACION_ESPERADA");

  await pagina.context().close();
});

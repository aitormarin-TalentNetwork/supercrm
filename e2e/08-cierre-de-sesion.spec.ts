import { test, expect, type Browser, type Page } from "@playwright/test";
import { HOME_BY_ROLE, type Role } from "./authState";
import { ENUMERAR_NAVEGADORES_ALCANZABLES } from "./enumerarNavegadores";
import {
  LIMITE_LIMPIEZA_MS,
  LIMITE_CIERRE_MS,
} from "@/components/push/useSignOutAndUnlinkPush";

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
    test(`C2a · ${role} · botón de ${boton}: cero navegadores alcanzables mientras el cierre está en vuelo`, async ({
      browser,
    }) => {
      const pagina = await abrirSesionPropia(browser, role);

      // CONTROL POSITIVO DEL INSTRUMENTO, y va ANTES de bloquear nada: con la
      // app en reposo el enumerador TIENE que encontrar navegación. Un
      // enumerador que devuelve cero porque no supo mirar da exactamente el
      // mismo verde que uno que enumeró bien y no había nada.
      if (boton === "menu") {
        await pagina.getByRole("button", { name: /abrir men/i }).click();
      } else {
        await pagina.goto("/ajustes");
      }
      const enReposo: string[] = await pagina.evaluate(
        ENUMERAR_NAVEGADORES_ALCANZABLES,
      );
      expect(
        enReposo.length,
        "el enumerador no encontró NINGÚN navegador con la app en reposo: " +
          "no está midiendo lo que cree medir, y su cero durante el cierre no valdría",
      ).toBeGreaterThan(0);

      const { enVuelo, soltar } = await conElCierreEnVuelo(pagina, async () => {
        await pagina.getByRole("button", { name: "Cerrar sesión" }).click();
      });
      await enVuelo;

      const durante: string[] = await pagina.evaluate(
        ENUMERAR_NAVEGADORES_ALCANZABLES,
      );
      soltar();

      expect(
        durante,
        `con el cierre en vuelo quedan ${durante.length} navegadores alcanzables ` +
          `(en reposo había ${enReposo.length}): ${durante.join(" · ")}`,
      ).toEqual([]);
    });
  }
}

test("C2a · control positivo: un enlace que NO pase por el bloqueante pone C2a en rojo", async ({
  browser,
}) => {
  // 🔴 EL SEGUNDO DIENTE DE C2a, textual del PM: "se añade un enlace de prueba
  // que no pase por el bloqueante y C2a se pone roja. Sin eso no se sabe si la
  // enumeración enumera."
  //
  // El enlace se inyecta en el contenido de /ajustes, y esa elección ES el
  // hallazgo: cuando el cierre se lanza DESDE la pantalla, `AreaBloqueable` no
  // la puede poner `inert` sin silenciar al propio control que dice "Cerrando
  // sesión…". O sea que este enlace no está cubierto por el mecanismo — y por
  // eso sirve de control positivo, y por eso el residuo queda escrito aquí en
  // vez de en un comentario que nadie relee.
  const pagina = await abrirSesionPropia(browser, "sales");
  await pagina.goto("/ajustes");

  const { enVuelo, soltar } = await conElCierreEnVuelo(pagina, async () => {
    await pagina.getByRole("button", { name: "Cerrar sesión" }).click();
  });
  await enVuelo;

  await pagina.evaluate(() => {
    const a = document.createElement("a");
    a.href = "/pipeline";
    a.textContent = "enlace de prueba";
    // Dentro de <main>, o sea dentro del contenido de la pantalla: es donde
    // aterrizaría un enlace de verdad si alguien lo añadiera a /ajustes.
    const destino = document.querySelector("main");
    if (destino === null) throw new Error("no hay <main> en /ajustes");
    destino.appendChild(a);
  });

  const durante: string[] = await pagina.evaluate(
    ENUMERAR_NAVEGADORES_ALCANZABLES,
  );
  soltar();

  expect(
    durante.join(" · "),
    "el enumerador NO vio un enlace puesto delante de sus narices durante el " +
      "cierre: su cero en los otros cuatro tests no distingue nada",
  ).toContain("enlace a /pipeline");
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

test("C3 y C4 · con el cierre correcto, se llega a /login en ≤3 s y no se queda en la pantalla autenticada", async ({
  browser,
}) => {
  const pagina = await abrirSesionPropia(browser, "sales");
  await pulsarCerrarSesion(pagina, "ajustes");
  await pagina.waitForURL("**/login", { timeout: 3000 });
  expect(pagina.url()).toContain("/login");
  await pagina.context().close();
});

test("C7 · si el cierre FALLA: alerta visible, NO se navega, y la sesión sigue viva", async ({
  browser,
}) => {
  const pagina = await abrirSesionPropia(browser, "sales");

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

  await pulsarCerrarSesion(pagina, "ajustes");

  // (1) el aviso existe y se puede afirmar por su ROL, no por un testid
  await expect(
    pagina
      .getByRole("alert")
      .filter({ hasText: "No se ha podido cerrar la sesión" }),
  ).toBeVisible();

  // (2) NO se ha navegado
  expect(pagina.url()).not.toContain("/login");

  // (3) ⚠️ Y AQUÍ LO VERDE ES LO RARO: la sesión SIGUE VIVA, y es lo correcto.
  //     Redirigir a /login sin haber cerrado sería la señal falsa que esta
  //     ficha persigue. Si alguien "arregla" esto, reintroduce el defecto.
  expect(await elServidorDejaEntrar(pagina)).toBe(true);

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

test("M2 · la PRIMERA llamada de cierre se queda colgada: aviso visible, sin navegar y sin mentir", async ({
  browser,
}) => {
  const pagina = await abrirSesionPropia(browser, "sales");

  // El tercer camino. C7 aborta la primera —rechazo INMEDIATO— y el de M1 cuelga
  // la segunda. Aquí la PRIMERA se queda PENDIENTE: no rechaza ni responde, así
  // que sin límite no se clasifica como fallo NI tiene duración máxima, y el
  // hook no retornaba nunca.
  let peticionesDeCierre = 0;
  await pagina.route("**/api/auth", async (route) => {
    const cuerpo = route.request().postData() ?? "";
    if (!cuerpo.includes("signOut")) return route.fallback();
    peticionesDeCierre++;
    return new Promise(() => {}); // no se resuelve NUNCA
  });

  await pulsarCerrarSesion(pagina, "ajustes");

  // Al vencer el plazo se clasifica como NO CONFIRMADO, que es lo único que se
  // sabe: abortar no dice si el servidor llegó a cerrar. Así que se avisa y no
  // se navega — falla hacia el rojo, no hacia la mentira.
  await expect(
    pagina
      .getByRole("alert")
      .filter({ hasText: "No se ha podido cerrar la sesión" }),
  ).toBeVisible({ timeout: 5000 });
  expect(pagina.url()).not.toContain("/login");

  // CONTROL, sin el cual esto no prueba nada: que la primera llamada se alcanzó
  // de verdad. Un verde sin esto no distingue "se abortó y se avisó" de "nunca
  // hubo petición que colgar".
  expect(
    peticionesDeCierre,
    "no se llegó a la primera llamada de cierre: el test no ejercita M2",
  ).toBeGreaterThanOrEqual(1);

  await pagina.context().close();
});

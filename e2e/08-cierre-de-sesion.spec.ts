import { test, expect, type Browser, type Page } from "@playwright/test";
import { HOME_BY_ROLE, type Role } from "./authState";

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

/** Pulsa "Cerrar sesión" por uno de los dos caminos que tiene la app. */
async function pulsarCerrarSesion(pagina: Page, boton: "ajustes" | "menu") {
  if (boton === "ajustes") {
    await pagina.goto("/ajustes");
    await pagina.getByRole("button", { name: "Cerrar sesión" }).click();
    return;
  }
  // El del menú lateral: hay que abrirlo primero.
  await pagina.getByRole("button", { name: /abrir men/i }).click();
  await pagina.getByRole("button", { name: "Cerrar sesión" }).click();
}

/** LA COMPROBACIÓN QUE MANDA: una petición NUEVA E INDEPENDIENTE a una ruta
 *  protegida. Devuelve `true` si el servidor deja entrar. */
async function elServidorDejaEntrar(pagina: Page): Promise<boolean> {
  const respuesta = await pagina.request.get(RUTA_PROTEGIDA, {
    maxRedirects: 0,
    failOnStatusCode: false,
  });
  const destino = respuesta.headers()["location"] ?? "";
  return !(respuesta.status() >= 300 && respuesta.status() < 400 && destino.includes("/login"));
}

for (const role of ["owner", "sales"] as Role[]) {
  for (const boton of ["ajustes", "menu"] as const) {
    test(`C2a · ${role} · botón de ${boton}: cero entradas en ${INTENTOS_POR_COMBINACION} intentos a velocidad humana`, async ({
      browser,
    }) => {
      test.slow();
      let entradas = 0;

      for (let i = 0; i < INTENTOS_POR_COMBINACION; i++) {
        const pagina = await abrirSesionPropia(browser, role);

        // CONTROL POSITIVO de la iteración: antes de pulsar, el servidor TIENE
        // que dejar entrar. Sin esto, un "no entra" después no distingue
        // "se cerró" de "esta sesión nunca sirvió".
        expect(
          await elServidorDejaEntrar(pagina),
          `iteración ${i + 1}: la sesión no servía ANTES de cerrar, la medición no vale`,
        ).toBe(true);

        await pulsarCerrarSesion(pagina, boton);
        await pagina.waitForTimeout(RETARDO_GESTO_MS); // el gesto humano

        if (await elServidorDejaEntrar(pagina)) entradas++;

        await pagina.context().close();
      }

      expect(
        entradas,
        `${entradas} de ${INTENTOS_POR_COMBINACION} navegaciones entraron con la sesión ya cerrada`,
      ).toBe(0);
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
    pagina.getByRole("alert").filter({ hasText: "No se ha podido cerrar la sesión" }),
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
    pagina.getByRole("alert").filter({ hasText: "No se ha podido cerrar la sesión" }),
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

import { test, expect, type Page } from "@playwright/test";

// AIT-83: el aviso de versión nueva. Fichero NUEVO y deliberadamente
// autónomo — no usa `e2e/helpers.ts` (que es de otra terminal) y no lo
// necesita: el aviso se monta en el layout, así que se ejercita en /login,
// que no exige sesión.
//
// El servidor de pruebas arranca con RAILWAY_GIT_COMMIT_SHA fijado, así que
// la referencia que inyecta el layout es conocida. `/version` se intercepta
// para simular qué sirve el servidor "ahora".

const toast = (page: Page) =>
  page.getByText("Hay una versión nueva de SuperCRM");

/**
 * La referencia con la que se cargó la pestaña, LEÍDA del propio servidor.
 *
 * AIT-93: antes esto era una constante `"aaaa1111"` que solo coincidía si
 * alguien fijaba ese mismo valor en otro fichero — una igualdad por
 * coincidencia entre el spec y la configuración. Al leerla, da igual qué SHA
 * se fije: el test sigue siendo correcto.
 *
 * Se llama SIEMPRE antes de instalar el `route` que suplanta `/version`.
 */
async function referenciaDelServidor(page: Page): Promise<string> {
  const res = await page.request.get("/version");
  const body = (await res.json()) as { commit?: unknown; source?: unknown };

  if (typeof body.commit !== "string") {
    // Falla HABLANDO. Antes, esta misma precondición incumplida se manifestaba
    // como un `waitForFunction` agotando 30 s, que no decía nada de la causa y
    // costó media hora de diagnóstico. El síntoma tiene que nombrar el arreglo.
    throw new Error(
      "Precondición del arnés incumplida: /version devuelve commit=" +
        JSON.stringify(body.commit) +
        " (source=" +
        JSON.stringify(body.source) +
        "). El servidor de pruebas debe arrancar con RAILWAY_GIT_COMMIT_SHA: " +
        "ver `webServer.env` en playwright.config.ts. " +
        "NO se salta el test a propósito — un test que se salta solo es un " +
        "verde que no significa nada.",
    );
  }
  return body.commit;
}

/** Dispara un chequeo oportunista sin depender de que el navegador oculte la
 *  pestaña de verdad.
 *
 *  PRIMERO SE ESPERA A QUE EL VIGILANTE ESTÉ ARMADO, y después se dispara.
 *  `page.goto` vuelve cuando carga el documento, pero el listener se instala al
 *  hidratar: disparar antes deja el evento en el vacío y el test falla por una
 *  carrera, no por el producto. Se espera a una señal OBSERVABLE del propio
 *  código (el enganche global instalado), no a un tiempo fijo. */
async function triggerCheck(page: Page) {
  await page.waitForFunction(
    () =>
      typeof (window as unknown as Record<string, unknown>)
        .__supercrmVersionGate === "function",
  );
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
}

test.describe("Aviso de versión nueva (AIT-83)", () => {
  test("avisa cuando el servidor sirve un commit distinto", async ({ page }) => {
    await page.goto("/login");
    await referenciaDelServidor(page);
    await page.route("**/version", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ commit: "bbbb2222" }),
      }),
    );

    await triggerCheck(page);
    await expect(toast(page)).toBeVisible();
    // Ofrece recargar, no recarga sola.
    await expect(page.getByRole("button", { name: "Recargar" })).toBeVisible();
  });

  test("NO avisa cuando el commit coincide", async ({ page }) => {
    await page.goto("/login");
    const loaded = await referenciaDelServidor(page);
    await page.route("**/version", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ commit: loaded }),
      }),
    );

    await triggerCheck(page);
    await page.waitForTimeout(1000);
    await expect(toast(page)).toHaveCount(0);
  });

  test("NO avisa cuando el servidor devuelve commit: null", async ({ page }) => {
    // El falso positivo masivo: `commit: null` significa "no sé", nunca
    // "ha cambiado". Si esto fallara, el aviso saldría en todas las pestañas
    // y para siempre en cuanto Railway dejara de entregar el SHA.
    await page.goto("/login");
    await referenciaDelServidor(page);
    await page.route("**/version", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ commit: null, source: "none" }),
      }),
    );

    await triggerCheck(page);
    await page.waitForTimeout(1000);
    await expect(toast(page)).toHaveCount(0);
  });

  test("NO avisa ante 5xx ni ante JSON inválido, y se recupera después", async ({
    page,
  }) => {
    // AIT-93: este test cruza la ventana del límite de frecuencia (30 s) DOS
    // veces — son >=62 s solo de esperas intencionales, más navegación y
    // aserciones. El `timeout` global de la suite son 30 s y NO se sube: hacerlo
    // haría que los demás tests tarden hasta cuatro veces más en delatar un
    // cuelgue. 120 000 es el valor con el que se verificó en verde; leer
    // "espera 31 s" y poner 45 o 60 dejaría este test agotando el tiempo.
    test.setTimeout(120_000);
    await page.goto("/login");
    await referenciaDelServidor(page);

    let mode: "error" | "invalid" | "changed" = "error";
    await page.route("**/version", (route) => {
      if (mode === "error") return route.fulfill({ status: 503, body: "" });
      if (mode === "invalid")
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "esto no es json",
        });
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ commit: "cccc3333" }),
      });
    });

    await triggerCheck(page);
    await page.waitForTimeout(800);
    await expect(toast(page)).toHaveCount(0);

    mode = "invalid";
    await page.waitForTimeout(31_000); // supera el límite de frecuencia
    await triggerCheck(page);
    await page.waitForTimeout(800);
    await expect(toast(page)).toHaveCount(0);

    // Y lo que de verdad importa: un fallo transitorio NO puede dejar el
    // detector inutilizado. Tras dos fallos seguidos, sigue detectando.
    mode = "changed";
    await page.waitForTimeout(31_000);
    await triggerCheck(page);
    await expect(toast(page)).toBeVisible();
  });

  test("no recarga sola, y al cerrar no vuelve a insistir con el mismo commit", async ({
    page,
  }) => {
    // Cruza la ventana de 30 s UNA vez (más 3 s de comprobación de no-recarga).
    // Mismo motivo que arriba para no tocar el timeout global.
    test.setTimeout(120_000);
    await page.goto("/login");
    await referenciaDelServidor(page);
    await page.route("**/version", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ commit: "bbbb2222" }),
      }),
    );

    await triggerCheck(page);
    await expect(toast(page)).toBeVisible();

    // Marca en la propia página: si se recargara sola, desaparecería.
    await page.evaluate(() => {
      (window as unknown as { __ait83NoRecarga?: boolean }).__ait83NoRecarga =
        true;
    });
    await page.waitForTimeout(3000);
    const sobrevive = await page.evaluate(
      () =>
        (window as unknown as { __ait83NoRecarga?: boolean })
          .__ait83NoRecarga === true,
    );
    expect(sobrevive).toBe(true);

    await page.getByRole("button", { name: "Cerrar" }).click();
    await expect(toast(page)).toHaveCount(0);

    await page.waitForTimeout(31_000);
    await triggerCheck(page);
    await page.waitForTimeout(1000);
    await expect(toast(page)).toHaveCount(0);
  });
});

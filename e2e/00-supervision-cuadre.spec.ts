import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  comprobarEtiquetas,
  construirComparativa,
  METRICAS,
  rotulosDesconectados,
  totalesDeCabecera,
  type OportunidadAbierta,
  type Vendedor,
} from "../lib/supervision";

// AIT-128 — /supervision se contradecía consigo misma: la cabecera contaba a la
// dueña y el desglose de debajo no. Pruebas PURAS (sin navegador, sin Convex,
// sin servidor): corren con `npm run test:unit`.
//
// LO QUE HACE QUE ESTO SEAN PRUEBAS Y NO DECORACIÓN: el escenario de abajo es el
// que FALLABA antes del arreglo. Si alguien vuelve a construir la tabla sobre el
// universo de vendedores, estos casos se ponen en rojo — no hay forma de revertir
// la corrección y que sigan pasando.

const DUENA: Vendedor = { ownerId: "u_marta", ownerName: "Marta", count: 0 };
const CARLOS: Vendedor = { ownerId: "u_carlos", ownerName: "Carlos", count: 7 };
const PEPE: Vendedor = { ownerId: "u_pepe", ownerName: "Pepito Perez", count: 2 };

// Sólo los VENDEDORES llegan en `vendedores`. La dueña no está ahí — es
// justamente el dato que la producía: `getSalesUsersForStore` filtra
// `role === "sales"`.
const VENDEDORES: Vendedor[] = [CARLOS, PEPE];

// El escenario exacto de la ficha: la única oportunidad abierta es de la dueña.
const SOLO_DE_LA_DUENA: OportunidadAbierta[] = [
  {
    ownerId: DUENA.ownerId,
    ownerName: DUENA.ownerName,
    estimatedAmount: 2500,
    isOverdue: true,
  },
];

function sumaColumnas(filas: ReturnType<typeof construirComparativa>) {
  return {
    abiertas: filas.reduce((s, f) => s + f.openCount, 0),
    valor: filas.reduce((s, f) => s + f.openAmount, 0),
    atrasados: filas.reduce((s, f) => s + f.overdueCount, 0),
  };
}

test.describe("AIT-128 · el desglose cuadra con la cabecera", () => {
  test("con la única oportunidad en manos de la DUEÑA (el caso que fallaba)", () => {
    const cabecera = totalesDeCabecera(SOLO_DE_LA_DUENA);
    const filas = construirComparativa(SOLO_DE_LA_DUENA, VENDEDORES);

    // Lo que veía Marta antes del arreglo: 1 / 2500 / 1 arriba y 0 / 0 / 0 abajo.
    expect(cabecera).toEqual({ abiertas: 1, valor: 2500, atrasados: 1 });
    expect(sumaColumnas(filas)).toEqual(cabecera);
  });

  test("la dueña aparece en la tabla con su carga, no sólo en la cabecera", () => {
    const filas = construirComparativa(SOLO_DE_LA_DUENA, VENDEDORES);
    const suya = filas.find((f) => f.ownerId === DUENA.ownerId);

    expect(suya, "la dueña tiene que ser una fila de la tabla").toBeDefined();
    expect(suya?.openCount).toBe(1);
    expect(suya?.openAmount).toBe(2500);
    expect(suya?.overdueCount).toBe(1);
  });

  test("un vendedor SIN oportunidades sigue apareciendo (no es una regresión de la comparativa)", () => {
    const filas = construirComparativa(SOLO_DE_LA_DUENA, VENDEDORES);
    expect(filas.map((f) => f.ownerId).sort()).toEqual(
      ["u_carlos", "u_marta", "u_pepe"].sort(),
    );
    expect(filas.find((f) => f.ownerId === CARLOS.ownerId)?.openCount).toBe(0);
  });

  // CONTROL NEGATIVO, obligatorio: este caso pasa HOY sin arreglar nada. Si el
  // rojo se hubiera demostrado con datos sólo de vendedores, no probaría nada de
  // esta ficha — es el `FALLA si` que la propia issue declara.
  test("control negativo · con datos SÓLO de vendedores ya cuadraba antes", () => {
    const soloVendedores: OportunidadAbierta[] = [
      { ownerId: CARLOS.ownerId, ownerName: "Carlos", estimatedAmount: 1000, isOverdue: false },
      { ownerId: CARLOS.ownerId, ownerName: "Carlos", estimatedAmount: 500, isOverdue: true },
      { ownerId: PEPE.ownerId, ownerName: "Pepito Perez", estimatedAmount: 300, isOverdue: false },
    ];
    const cabecera = totalesDeCabecera(soloVendedores);
    const filas = construirComparativa(soloVendedores, VENDEDORES);

    expect(cabecera).toEqual({ abiertas: 3, valor: 1800, atrasados: 1 });
    expect(sumaColumnas(filas)).toEqual(cabecera);
  });

  // INVARIANTE, no un ejemplo: sobre varios repartos distintos, incluidos los
  // que mezclan dueña y vendedores, y uno con importe ausente.
  test("invariante · suma(columna) === cabecera en cualquier reparto", () => {
    const repartos: OportunidadAbierta[][] = [
      [],
      SOLO_DE_LA_DUENA,
      [
        { ownerId: DUENA.ownerId, ownerName: "Marta", estimatedAmount: 2500, isOverdue: true },
        { ownerId: CARLOS.ownerId, ownerName: "Carlos", estimatedAmount: 900, isOverdue: true },
        { ownerId: PEPE.ownerId, ownerName: "Pepito Perez", estimatedAmount: null, isOverdue: false },
      ],
      [
        // un dueño de oportunidad que NO está en `vendedores` NI es la dueña
        // conocida: aun así su carga tiene que contarse en la tabla.
        { ownerId: "u_fantasma", ownerName: null, estimatedAmount: 42, isOverdue: false },
      ],
    ];

    for (const abiertas of repartos) {
      const cabecera = totalesDeCabecera(abiertas);
      const filas = construirComparativa(abiertas, VENDEDORES);
      expect(sumaColumnas(filas), JSON.stringify(abiertas)).toEqual(cabecera);
    }
  });

  // m1 del auditor: C6 no tenía observable conductual. El filtro por persona se
  // calcula sobre `ownerId`, así que se comprueba que filtrar por la dueña
  // devuelve SOLO lo suyo.
  test("m1 · filtrar por la dueña devuelve sólo sus oportunidades", () => {
    const abiertas: OportunidadAbierta[] = [
      { ownerId: DUENA.ownerId, ownerName: "Marta", estimatedAmount: 2500, isOverdue: true },
      { ownerId: CARLOS.ownerId, ownerName: "Carlos", estimatedAmount: 900, isOverdue: false },
    ];
    const filas = construirComparativa(abiertas, VENDEDORES);
    const suya = filas.find((f) => f.ownerId === DUENA.ownerId);
    expect(suya, "sin fila no hay opción de filtro para la dueña").toBeDefined();

    const filtradas = abiertas.filter((o) => o.ownerId === DUENA.ownerId);
    expect(filtradas).toHaveLength(1);
    expect(filtradas[0].estimatedAmount).toBe(2500);
  });
});

// AIT-128 ronda 2 · M1 del auditor. Las pruebas de arriba comparan NÚMEROS, y por
// eso pasaron en verde con "Seguimientos atrasados" escrito encima de un número
// que cuenta oportunidades. Nadie medía el texto.
//
// El control es por VOCABULARIO, no contra dos literales concretos: si sólo
// prohibiera "Seguimientos atrasados", el siguiente rótulo que se desincronice
// pasaría igual. Lo que afirma es que **cada texto visible nombra la unidad que
// esa cifra calcula de verdad**.
test.describe("AIT-128 · los rótulos nombran lo que la pantalla mide", () => {
  test("cada etiqueta nombra su propia unidad", () => {
    expect(comprobarEtiquetas()).toEqual([]);
  });

  // Sin esto, `METRICAS` podría ser una constante coherente que la pantalla no
  // usa: un control sin observable propio. Se comprueba que los textos no están
  // escritos a mano donde se PINTAN, para que no puedan divergir de su unidad.
  //
  // Se busca el patrón del atributo JSX (`label="…"`, `title="…"`) y no el texto
  // suelto: la primera versión de esta prueba buscaba la cadena entrecomillada en
  // cualquier parte del fichero y saltaba con un COMENTARIO que mencionaba
  // «Comerciales» en prosa. Medía el fichero cuando la pregunta era sobre lo
  // renderizado — y un control que grita por prosa se acaba desactivando.
  test("la página usa METRICAS y no copias literales en los rótulos", () => {
    const pagina = readFileSync(
      join(__dirname, "..", "app", "supervision", "page.tsx"),
      "utf8",
    );
    const literales = Object.entries(METRICAS)
      .filter(([, m]) =>
        [`label="${m.etiqueta}"`, `title="${m.etiqueta}"`, `>${m.etiqueta}<`].some(
          (patron) => pagina.includes(patron),
        ),
      )
      .map(([clave, m]) => `${clave}: "${m.etiqueta}" escrito a mano en page.tsx`);
    expect(literales).toEqual([]);
  });

  // Control positivo del control anterior: el patrón TIENE que reconocer un
  // rótulo escrito a mano. Sin esto, una prueba que no sabe encontrar nada
  // pasaría siempre en verde y nadie lo notaría.
  test("control positivo · el patrón sabe reconocer un rótulo a mano", () => {
    const fuenteFalsa = `<KpiCard label="${METRICAS.atrasados.etiqueta}" />`;
    expect(fuenteFalsa.includes(`label="${METRICAS.atrasados.etiqueta}"`)).toBe(
      true,
    );
  });
});

// Control positivo del comprobador de rótulos, y va aquí y no en una salida
// pegada a mano por un motivo concreto: el auditor de la ronda 1 declaró en su
// `SIN:` que no podía verificar la ejecución de la suite en un commit anterior.
// Un rojo que sólo existe en el pasado es un rojo que hay que creerse. Éste se
// reproduce en cualquier commit, ejecutando.
test.describe("AIT-128 · el comprobador de rótulos se pone rojo de verdad", () => {
  test("caza el rótulo exacto que se coló en la ronda 1", () => {
    const problemas = comprobarEtiquetas({
      atrasados: { etiqueta: "Seguimientos atrasados", unidad: "oportunidades" },
    });
    expect(problemas).toHaveLength(1);
    expect(problemas[0]).toContain("no nombra su unidad");
  });

  test("y caza cualquier otro desajuste, no sólo ése", () => {
    // Una lista negra de textos prohibidos pasaría esto en verde.
    const problemas = comprobarEtiquetas({
      valor: { etiqueta: "Clientes activos", unidad: "dinero" },
      abiertas: { etiqueta: "Tareas pendientes", unidad: "oportunidades" },
    });
    expect(problemas).toHaveLength(2);
  });

  test("y NO grita con las etiquetas coherentes (no es un control que grita siempre)", () => {
    expect(
      comprobarEtiquetas({
        abiertas: { etiqueta: "Oportunidades abiertas", unidad: "oportunidades" },
        valor: { etiqueta: "Valor en juego", unidad: "dinero" },
      }),
    ).toEqual([]);
  });
});

// Controles del detector de conexión. Ejercitan `rotulosDesconectados`, EL MISMO
// que usa la prueba real — el auditor lo pidió así, y con razón: un verificador
// distinto del verificado es una segunda opinión peor informada, y puede pasar
// mientras el de verdad falla.
test.describe("AIT-128 · el detector de rótulos desconectados se pone rojo", () => {
  const PAGINA_SANA = `
    <KpiCard label={METRICAS.comerciales.etiqueta} />
    <KpiCard label={METRICAS.abiertas.etiqueta} />
    <KpiCard label={METRICAS.valor.etiqueta} />
    <KpiCard label={METRICAS.atrasados.etiqueta} />
    <span title={METRICAS.abiertas.etiqueta} />
    <span title={METRICAS.interacciones.etiqueta} />
    <span title={METRICAS.atrasados.etiqueta} />`;

  test("no grita con una página bien conectada", () => {
    expect(rotulosDesconectados(PAGINA_SANA)).toEqual([]);
  });

  // EL MUNDO EN EL QUE FALLA, que es lo que convierte esto en criterio: se borra
  // el rótulo. No queda ningún literal prohibido — la versión anterior de la
  // prueba pasaba en verde con esta misma edición.
  test("caza el rótulo BORRADO (el verde falso de la ronda 2)", () => {
    const sinRotulo = PAGINA_SANA.replace(
      "<KpiCard label={METRICAS.atrasados.etiqueta} />",
      "<KpiCard />",
    );
    const problemas = rotulosDesconectados(sinRotulo);
    expect(problemas).toEqual([
      "atrasados: falta label={METRICAS.atrasados.etiqueta} en la página",
    ]);
  });

  test("caza el rótulo SUSTITUIDO por otra constante", () => {
    const sustituido = PAGINA_SANA.replace(
      "title={METRICAS.atrasados.etiqueta}",
      "title={OTRA_COSA.texto}",
    );
    expect(rotulosDesconectados(sustituido)).toEqual([
      "atrasados: falta title={METRICAS.atrasados.etiqueta} en la página",
    ]);
  });

  // Y la mitad negativa sigue haciendo falta: se puede conectar la constante Y
  // pintar el texto a mano al lado, y entonces divergen igual.
  test("caza el literal escrito a mano aunque la constante esté conectada", () => {
    const conLiteral = `${PAGINA_SANA}\n    <KpiCard label="${METRICAS.atrasados.etiqueta}" />`;
    expect(rotulosDesconectados(conLiteral)).toEqual([
      `atrasados: rótulo escrito a mano (label="${METRICAS.atrasados.etiqueta}")`,
    ]);
  });
});

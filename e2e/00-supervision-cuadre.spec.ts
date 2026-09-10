import { test, expect } from "@playwright/test";
import {
  construirComparativa,
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

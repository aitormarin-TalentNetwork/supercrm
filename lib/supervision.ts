/** AIT-128 — la agregación de /supervision, en un solo sitio y sin Convex.
 *
 *  POR QUÉ EXISTE. La pantalla mostraba dos cifras incompatibles a la vez:
 *  la cabecera decía "1 oportunidad abierta / 2.500 €" y el desglose de justo
 *  debajo sumaba 0 y 0,00 €. Los dos números eran correctos por separado —
 *  hablaban de universos distintos y nada obligaba a que coincidieran.
 *
 *  La cabecera y el desglose se calculan AQUÍ, de la MISMA lista, para que
 *  `suma(columna) === cabecera` se cumpla por construcción. No es una
 *  comprobación que alguien tenga que acordarse de hacer: es que no hay dos
 *  fuentes que puedan discrepar.
 */

// Genérico en el id a propósito: la página trabaja con `Id<"users">` de
// Convex, que es un `string` con marca. Si este módulo lo aplanara a
// `string`, el `setFiltro` de la página dejaría de comprobar tipos y un id
// de otra tabla pasaría desapercibido.
export type OportunidadAbierta<TId extends string = string> = {
  ownerId: TId;
  // `null | undefined` porque el backend distingue dos ausencias: `null` es
  // "el usuario existe pero no es de esta tienda" (el chequeo cruzado de
  // storeId) y `undefined` es "no tiene nombre puesto". Aquí las dos caen en
  // el mismo sitio, pero el tipo no las aplana: si mañana hay que
  // distinguirlas, el dato sigue llegando.
  ownerName: string | null | undefined;
  estimatedAmount: number | null;
  isOverdue: boolean;
};

/** Un usuario con rol `sales`, venga o no con oportunidades. */
export type Vendedor<TId extends string = string> = {
  ownerId: TId;
  ownerName: string | null | undefined;
  count: number;
};

export type FilaComparativa<TId extends string = string> = {
  ownerId: TId;
  ownerName: string;
  openCount: number;
  openAmount: number;
  interactionCount: number;
  overdueCount: number;
};

export type TotalesCabecera = {
  abiertas: number;
  valor: number;
  atrasados: number;
};

const SIN_NOMBRE = "Sin nombre";

export function totalesDeCabecera(
  abiertas: readonly OportunidadAbierta<string>[],
): TotalesCabecera {
  return {
    abiertas: abiertas.length,
    valor: abiertas.reduce((suma, o) => suma + (o.estimatedAmount ?? 0), 0),
    atrasados: abiertas.filter((o) => o.isOverdue).length,
  };
}

export function construirComparativa<TId extends string>(
  abiertas: readonly OportunidadAbierta<TId>[],
  vendedores: readonly Vendedor<TId>[],
): FilaComparativa<TId>[] {
  const interaccionesPorUsuario = new Map(
    vendedores.map((v) => [v.ownerId, v.count]),
  );

  // EL UNIVERSO DE LA TABLA, y es todo el arreglo de AIT-128.
  //
  // Se siembra con los dueños de las oportunidades ABIERTAS —la misma lista que
  // suma la cabecera— y se completa con los vendedores. Ese orden importa:
  //
  //   · sembrar con `abiertas` es lo que hace que `suma(columna) === cabecera`
  //     se cumpla POR CONSTRUCCIÓN. Ninguna oportunidad puede quedarse sin fila,
  //     porque las filas salen de las propias oportunidades.
  //   · añadir los vendedores es lo que impide la regresión contraria: un
  //     comercial con cero oportunidades tiene que seguir apareciendo, que para
  //     eso la sección es una COMPARATIVA.
  //
  // Antes el universo eran sólo los vendedores (`getSalesUsersForStore` filtra
  // `role === "sales"`), así que la dueña no tenía fila y su carga —que sí se
  // calculaba— se descartaba al no encontrarla en esa lista. El dato no faltaba:
  // se producía y se tiraba.
  const universo = new Map<TId, string>();
  for (const o of abiertas) {
    if (!universo.has(o.ownerId)) {
      universo.set(o.ownerId, o.ownerName ?? SIN_NOMBRE);
    }
  }
  for (const v of vendedores) {
    if (!universo.has(v.ownerId)) {
      universo.set(v.ownerId, v.ownerName ?? SIN_NOMBRE);
    }
  }

  const filas: FilaComparativa<TId>[] = [];
  for (const [ownerId, ownerName] of universo) {
    const suyas = abiertas.filter((o) => o.ownerId === ownerId);
    filas.push({
      ownerId,
      ownerName,
      openCount: suyas.length,
      openAmount: suyas.reduce((s, o) => s + (o.estimatedAmount ?? 0), 0),
      interactionCount: interaccionesPorUsuario.get(ownerId) ?? 0,
      overdueCount: suyas.filter((o) => o.isOverdue).length,
    });
  }

  return filas.sort((a, b) => b.openAmount - a.openAmount);
}

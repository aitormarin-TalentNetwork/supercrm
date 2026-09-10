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

export type OportunidadAbierta = {
  ownerId: string;
  ownerName: string | null;
  estimatedAmount: number | null;
  isOverdue: boolean;
};

/** Un usuario con rol `sales`, venga o no con oportunidades. */
export type Vendedor = {
  ownerId: string;
  ownerName: string | null;
  count: number;
};

export type FilaComparativa = {
  ownerId: string;
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
  abiertas: readonly OportunidadAbierta[],
): TotalesCabecera {
  return {
    abiertas: abiertas.length,
    valor: abiertas.reduce((suma, o) => suma + (o.estimatedAmount ?? 0), 0),
    atrasados: abiertas.filter((o) => o.isOverdue).length,
  };
}

export function construirComparativa(
  abiertas: readonly OportunidadAbierta[],
  vendedores: readonly Vendedor[],
): FilaComparativa[] {
  const interaccionesPorUsuario = new Map(
    vendedores.map((v) => [v.ownerId, v.count]),
  );

  // El universo de la tabla. Hoy son SOLO los vendedores, y por eso la dueña
  // —que es quien tiene la única oportunidad abierta— no aparece y la tabla
  // suma 0 mientras la cabecera dice 1.
  const universo = new Map<string, string>(
    vendedores.map((v) => [v.ownerId, v.ownerName ?? SIN_NOMBRE]),
  );

  const filas: FilaComparativa[] = [];
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

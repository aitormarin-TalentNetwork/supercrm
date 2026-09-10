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

/** Cada cifra visible de /supervision, junto a LA UNIDAD QUE MIDE DE VERDAD.
 *
 *  AIT-128 (ronda 2). El rótulo y la unidad viven aquí juntos porque el defecto
 *  de esta ficha se repitió DENTRO de su propio arreglo: se revisaron cinco
 *  rótulos y se quedaron fuera los dos que nombran la métrica reinterpretada.
 *  "Seguimientos atrasados" seguía puesto sobre un número que cuenta
 *  OPORTUNIDADES, no seguimientos.
 *
 *  Las pruebas comparaban números y nadie comparaba textos, así que el rótulo
 *  falso pasaba en verde. `comprobarEtiquetas()` cierra eso: una etiqueta que
 *  no nombra su propia unidad pone la suite en rojo.
 */
// `atributos` declara DÓNDE tiene que estar renderizada cada etiqueta. Sin este
// campo el control sólo podía afirmar una ausencia ("que no haya literales"), y
// una expectativa negativa se cumple con la página entera borrada: bastaba con
// quitar el rótulo para que todo siguiera en verde con el texto ya desaparecido.
export const METRICAS = {
  comerciales: {
    etiqueta: "Comerciales",
    unidad: "personas",
    atributos: ["label"],
  },
  abiertas: {
    etiqueta: "Oportunidades abiertas",
    unidad: "oportunidades",
    atributos: ["label", "title"],
  },
  valor: { etiqueta: "Valor en juego", unidad: "dinero", atributos: ["label"] },
  // El número cuenta OPORTUNIDADES abiertas con seguimiento vencido, no
  // seguimientos: decía "Seguimientos atrasados" sobre una unidad que no es ésa.
  atrasados: {
    etiqueta: "Oportunidades atrasadas",
    unidad: "oportunidades",
    atributos: ["label", "title"],
  },
  interacciones: {
    etiqueta: "Interacciones (30 días)",
    unidad: "interacciones",
    atributos: ["title"],
  },
} as const;

type Metrica = { etiqueta: string; unidad: string; atributos: readonly string[] };

/** Desconexiones entre `METRICAS` y lo que la página RENDERIZA de verdad.
 *  Vacío = cada etiqueta se pinta donde dice que se pinta.
 *
 *  Afirma en POSITIVO —`label={METRICAS.x.etiqueta}` tiene que ESTAR— además de
 *  comprobar que no queda el literal a mano. Las dos mitades hacen falta: sin la
 *  positiva, borrar el rótulo deja el control en verde; sin la negativa, se puede
 *  pintar el texto a mano al lado y divergir igual.
 *
 *  Lo usan la prueba real y su control positivo: un verificador distinto del
 *  verificado sería una segunda opinión peor informada. */
/** Quita comentarios antes de buscar. AIT-128 ronda 4: el detector usaba
 *  `includes` sobre el fuente crudo, así que una referencia COMENTADA contaba
 *  como renderizada — `{/* label={METRICAS.atrasados.etiqueta} *' + '/}` daba verde con
 *  el rótulo sin pintar. Es el mismo verde falso que el detector existe para cerrar.
 *
 *  Cubre las tres formas: bloque, JSX (`{`+bloque+`}`) y línea. El `[^:]` delante
 *  de `//` evita comerse un `https://`.
 *
 *  SESGADO A SOBRE-ELIMINAR A PROPÓSITO: si de más, un rótulo real desaparece y
 *  el detector dice "falta" -> ROJO, ruidoso y visible. Si de menos, un comentario
 *  sobrevive y dice "está" -> VERDE FALSO, que es el fallo que no avisa. */
function sinComentarios(fuente: string): string {
  return fuente
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

export function rotulosDesconectados(
  fuente: string,
  metricas: Record<string, Metrica> = METRICAS,
): string[] {
  const codigo = sinComentarios(fuente);
  const problemas: string[] = [];
  for (const [clave, m] of Object.entries(metricas)) {
    for (const atributo of m.atributos) {
      if (!codigo.includes(`${atributo}={METRICAS.${clave}.etiqueta}`)) {
        problemas.push(
          `${clave}: falta ${atributo}={METRICAS.${clave}.etiqueta} en la página`,
        );
      }
    }
    for (const patron of [
      `label="${m.etiqueta}"`,
      `title="${m.etiqueta}"`,
      `>${m.etiqueta}<`,
    ]) {
      if (codigo.includes(patron)) {
        problemas.push(`${clave}: rótulo escrito a mano (${patron})`);
      }
    }
  }
  return problemas;
}

/** Con qué palabras se nombra cada unidad. Deliberadamente por VOCABULARIO y no
 *  por una lista de textos prohibidos: un rótulo nuevo que se desincronice tiene
 *  que caer igual, y una lista negra sólo caza los errores que ya conocemos. */
const SUSTANTIVOS_POR_UNIDAD: Record<string, readonly string[]> = {
  personas: ["comercial", "comerciales", "persona", "personas", "equipo"],
  oportunidades: ["oportunidad", "oportunidades"],
  dinero: ["valor", "importe", "euros"],
  interacciones: ["interaccion", "interacciones"],
};

function sinTildes(t: string) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Devuelve los desajustes entre lo que una etiqueta NOMBRA y lo que MIDE.
 *  Vacío = coherentes. */
export function comprobarEtiquetas(
  metricas: Record<string, { etiqueta: string; unidad: string }> = METRICAS,
): string[] {
  const problemas: string[] = [];
  for (const [clave, m] of Object.entries(metricas)) {
    const permitidos = SUSTANTIVOS_POR_UNIDAD[m.unidad];
    if (!permitidos) {
      problemas.push(`${clave}: unidad desconocida "${m.unidad}"`);
      continue;
    }
    const palabras = sinTildes(m.etiqueta).split(/[^a-z0-9]+/).filter(Boolean);
    if (!palabras.some((p) => permitidos.includes(p))) {
      problemas.push(
        `${clave}: la etiqueta "${m.etiqueta}" no nombra su unidad (${m.unidad}); ` +
          `se esperaba alguna de: ${permitidos.join(", ")}`,
      );
    }
  }
  return problemas;
}

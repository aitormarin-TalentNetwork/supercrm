import { test, expect } from "@playwright/test";
import {
  LIMITE_LIMPIEZA_MS,
  LIMITE_CIERRE_MS,
  LIMITE_LIMPIEZA_CLIENTE_MS,
  PRESUPUESTO_C3_MS,
  MARGEN_SOBRECARGA_MS,
  PRESUPUESTO_C3_FALLO_MS,
  LIMITE_CIERRE_LOCAL_MS,
  LIMITE_CONFIRMACION_MS,
} from "../components/push/useSignOutAndUnlinkPush";

/** AIT-127 — El criterio C3 mide el TOTAL, no cada tramo.
 *
 * 🔴 POR QUÉ EXISTE ESTA PRUEBA. Los tres límites del cierre estaban acotados
 * individualmente y cada uno era defendible por separado — y su SUMA incumplía
 * C3: 1000 + 2000 + 500 = 3500 ms contra un presupuesto de 3000. Existía un
 * camino **lento pero no patológico** en el que el cierre SE CONFIRMA, se
 * navega, y el criterio se incumple.
 *
 * Acotar cada espera por separado no basta cuando el criterio mide el total.
 *
 * Y el invariante vivía escrito en el comentario de UNA de las tres constantes,
 * mientras dependía de las TRES: subir la limpieza push de 1000 a 1500 rompería
 * C3 sin que nada avisara, porque su comentario no habla de la suma. Aquí sí
 * avisa, en 700 ms y sin levantar nada.
 */

test("C3 · los tres límites MÁS la sobrecarga medida caben en el presupuesto", () => {
  // ⚠️ RONDA 4 (M5): ANTES ESTO SUMABA TEMPORIZADORES, NO TIEMPO. Sumaba las
  // tres esperas y se daba por satisfecha con 2900 ≤ 3000 — pero C3 mide desde
  // el CLIC hasta `/login`, y fuera de las tres esperas quedan la lógica
  // síncrona, las dos peticiones, el render, `router.replace` y la navegación.
  // Medido: con las tres etapas cerca del máximo, gesto → /login daba 3002,
  // 3021 y 3078 ms. **C3 se incumplía de verdad y esta guarda seguía verde.**
  // Es mi propio hallazgo de composición un nivel más arriba: acoté las tres
  // esperas y el criterio medía desde antes de la primera.
  const total =
    LIMITE_LIMPIEZA_MS +
    LIMITE_CIERRE_MS +
    LIMITE_LIMPIEZA_CLIENTE_MS +
    MARGEN_SOBRECARGA_MS;

  expect(
    total,
    `los límites del cierre (${LIMITE_LIMPIEZA_MS}+${LIMITE_CIERRE_MS}+${LIMITE_LIMPIEZA_CLIENTE_MS}) ` +
      `más la sobrecarga medida (${MARGEN_SOBRECARGA_MS}) suman ${total} ms, y C3 da ` +
      `${PRESUPUESTO_C3_MS} ms. No subas el presupuesto ni recortes el margen: ` +
      `baja los límites, o vuelve al PM.`,
  ).toBeLessThanOrEqual(PRESUPUESTO_C3_MS);
});

test("C3 · el margen de sobrecarga no puede quedarse por debajo de lo medido", () => {
  // CONTROL del margen: sin esto, un rojo de la prueba de arriba se "arregla"
  // recortando el margen en vez de los límites, y la sobrecarga real —que no
  // depende de nosotros— se queda fuera del presupuesto otra vez.
  // ⚠️ ACTUALIZADO 278 -> 484 -> 556. Este literal
  // **nunca baja**: sólo sube cuando se mide algo peor.
  //
  // 🔴 Y DE PASO CORRIJO UN NÚMERO MÍO SIN FUENTE: escribí primero 445 y le
  // puse la procedencia "medido el 2026-09-10 en la corrida de AIT-134 que
  // fallaba C3". Esa corrida existe y es real — pero dice **484**, no 445. El
  // 445 no aparece en NINGUNA salida de NINGUNA corrida: me lo inventé y le
  // adjunté un porqué verdadero, que es lo que lo hacía parecer medido.
  //
  // Universo COMPLETO de sobrecargas observadas hasta hoy (grep sobre los logs
  // de corrida y el registro de QA, no de memoria): 218, 226, 226, 484 ms.
  //   484 ms → 2026-09-10 17:02:51Z, HEAD ab0e826, total 3084 ms sobre 2600 ms
  //            forzados. C3 FALLÓ en esa corrida.
  //   556 ms → 2026-09-10 18:14:42Z, HEAD c8fd110, corrida limpia. La que cazó
  //            la guarda POR CORRIDA en su estreno.
  //
  // 🔑 Y AQUÍ ESTE LITERAL YA NO ES EL APAÑO: el PM separó los dos trabajos que
  // yo había juntado en una disyuntiva falsa (a)/(b). Esta prueba es REGISTRO —
  // sube siempre y no bloquea por sí misma—, y quien bloquea es la guarda por
  // corrida. Lo que sí debe bloquear es `MARGEN >= PEOR_REGISTRADO`, porque un
  // margen por debajo del registro es un cambio DELIBERADO de alguien, no la
  // realidad derivando.
  //
  // ⚠️ CONDICIÓN DE ESA MEDICIÓN, declarada porque cambia cómo se lee: la
  // máquina iba cargada (swap 1485M, y las tres etapas por encima de su propio
  // límite — cliente 945 ms contra 500). No la descarto por eso: una sobrecarga
  // que ocurrió, ocurrió, y el presupuesto de C3 no le promete al usuario
  // "3 s si la máquina va descargada". Pero sí significa que 484 es el peor
  // conocido, NO un techo: nadie ha medido aún la cola de esta distribución.
  //
  // ⛔ PERO SUBIR EL NÚMERO Y DEJAR LA GUARDA IGUAL SERÍA REPETIR EL MECANISMO
  // CON OTRO NÚMERO (palabras del PM). Esta prueba pura sigue midiendo **si
  // alguien bajó el margen**, no **si el margen basta** — y no puede saber lo
  // segundo, porque no observa ninguna corrida.
  // Lo que sí contesta esa pregunta vive en el test de C3 de
  // `08-cierre-de-sesion.spec.ts`: la corrida falla si la sobrecarga observada
  // EN ELLA supera el margen. Esta se queda como cinturón contra el recorte
  // silencioso del margen, que es lo único que sí puede medir.
  const PEOR_SOBRECARGA_MEDIDA_MS = 556;
  expect(
    MARGEN_SOBRECARGA_MS,
    `el margen (${MARGEN_SOBRECARGA_MS} ms) es menor que la peor sobrecarga ` +
      `medida (${PEOR_SOBRECARGA_MEDIDA_MS} ms): el presupuesto volvería a ` +
      `ignorar tiempo que existe.`,
  ).toBeGreaterThanOrEqual(PEOR_SOBRECARGA_MEDIDA_MS);
});

test("C3 · el presupuesto no se ha relajado por la puerta de atrás", () => {
  // CONTROL de la prueba de arriba: sin esto, alguien "arregla" un rojo subiendo
  // PRESUPUESTO_C3_MS y las dos pruebas siguen en verde. El 3000 no es un número
  // nuestro: es el criterio de la ficha, y cambiarlo es cambiar el criterio.
  expect(PRESUPUESTO_C3_MS).toBe(3000);
});

// ─────────────────────────────────────────────────────────────────────────────
// AIT-134 — EL CAMINO DE FALLO TIENE SU PROPIO PRESUPUESTO, Y SUS PROPIAS GUARDAS
// ─────────────────────────────────────────────────────────────────────────────

test("C3-fallo · el camino de recuperación cabe en su presupuesto", () => {
  // 🔴 POR QUÉ EXISTE ESTE SEGUNDO PRESUPUESTO. Al hacer que la recuperación
  // navegue (M3), C3 empezó a aplicarle un criterio escrito para otro camino. Y
  // no cabía: las etapas que ya existían suman el presupuesto ENTERO —
  //     544 + 1400 + 500 + 556 = 3000
  // — o sea CERO hueco para la ruta local y la confirmación.
  //
  // ⚠️ Y el número que hay que usar en esa cuenta es el MARGEN DECLARADO (350),
  // no la mejor sobrecarga medida (278). Con la medición quedaban 72 ms y con la
  // constante quedan 0: usar el número favorable inventa margen que no existe.
  const total =
    LIMITE_LIMPIEZA_MS +
    LIMITE_CIERRE_MS +
    LIMITE_CIERRE_LOCAL_MS +
    LIMITE_CONFIRMACION_MS +
    LIMITE_LIMPIEZA_CLIENTE_MS +
    MARGEN_SOBRECARGA_MS;

  expect(
    total,
    `el camino de recuperación suma ${total} ms (push ${LIMITE_LIMPIEZA_MS} + ` +
      `cierre ${LIMITE_CIERRE_MS} + ruta local ${LIMITE_CIERRE_LOCAL_MS} + ` +
      `confirmación ${LIMITE_CONFIRMACION_MS} + limpieza ${LIMITE_LIMPIEZA_CLIENTE_MS} + ` +
      `margen ${MARGEN_SOBRECARGA_MS}) y su presupuesto es ${PRESUPUESTO_C3_FALLO_MS} ms. ` +
      `No subas el presupuesto: baja los límites nuevos, o vuelve al PM.`,
  ).toBeLessThanOrEqual(PRESUPUESTO_C3_FALLO_MS);
});

test("C3-fallo · el presupuesto del camino de fallo no se ha relajado", () => {
  // Mismo control que el de 3000: el 5000 no es un número nuestro, es una
  // decisión del PM. Cambiarlo es cambiar la decisión, no ajustar una constante.
  expect(PRESUPUESTO_C3_FALLO_MS).toBe(5000);
});

test("C3-fallo · el presupuesto del camino NORMAL no ha heredado el margen del de fallo", () => {
  // ⛔ GUARDA 1 DEL PM, EJECUTABLE: "no cascadea". Sin esto, el 5000 se convierte
  // con el tiempo en el presupuesto de todo — que es como un margen concedido a
  // un caso acaba siendo la norma sin que nadie lo decida.
  //
  // 🔑 Y este test tiene mundo en el que falla: si alguien iguala los dos
  // presupuestos "para simplificar", se pone rojo. Un criterio que no puede
  // suspender no es un criterio.
  expect(
    PRESUPUESTO_C3_MS,
    `el presupuesto del camino normal (${PRESUPUESTO_C3_MS}) se ha igualado al ` +
      `del camino de fallo (${PRESUPUESTO_C3_FALLO_MS}). El margen del fallo NO ` +
      `cascadea: es de ese camino y de ninguno más.`,
  ).toBeLessThan(PRESUPUESTO_C3_FALLO_MS);
});

import { test, expect } from "@playwright/test";
import {
  LIMITE_LIMPIEZA_MS,
  LIMITE_CIERRE_MS,
  LIMITE_LIMPIEZA_CLIENTE_MS,
  PRESUPUESTO_C3_MS,
  MARGEN_SOBRECARGA_MS,
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
  // 278 ms es el PEOR de los tres valores medidos, no un redondeo.
  const PEOR_SOBRECARGA_MEDIDA_MS = 278;
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

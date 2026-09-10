import { test, expect } from "@playwright/test";
import {
  LIMITE_LIMPIEZA_MS,
  LIMITE_CIERRE_MS,
  LIMITE_LIMPIEZA_CLIENTE_MS,
  PRESUPUESTO_C3_MS,
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

test("C3 · los tres límites del cierre suman dentro del presupuesto", () => {
  const total =
    LIMITE_LIMPIEZA_MS + LIMITE_CIERRE_MS + LIMITE_LIMPIEZA_CLIENTE_MS;

  expect(
    total,
    `los límites del cierre suman ${total} ms y C3 da ${PRESUPUESTO_C3_MS} ms. ` +
      `No subas el presupuesto: bájalos, o vuelve al PM.`,
  ).toBeLessThanOrEqual(PRESUPUESTO_C3_MS);
});

test("C3 · el presupuesto no se ha relajado por la puerta de atrás", () => {
  // CONTROL de la prueba de arriba: sin esto, alguien "arregla" un rojo subiendo
  // PRESUPUESTO_C3_MS y las dos pruebas siguen en verde. El 3000 no es un número
  // nuestro: es el criterio de la ficha, y cambiarlo es cambiar el criterio.
  expect(PRESUPUESTO_C3_MS).toBe(3000);
});

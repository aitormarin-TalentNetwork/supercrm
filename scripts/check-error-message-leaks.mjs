// AIT-111 — que el mensaje interno de un error no acabe en la cara del usuario.
//
// La regla que comprueba está en docs/01-arquitectura.md §6, ADR "Qué puede
// decirle al usuario un error del servidor": `err.message` se puede LEER para
// clasificar; no se puede DEVOLVER. Lo que se le enseña al usuario tiene que
// estar acotado por algo que declara el cliente — una constante, una lista
// blanca o un patrón.
//
// Por qué existe este fichero y no basta con el ADR: el criterio es una
// expectativa NEGATIVA ("no debe haber ninguno"), y ésas no se miran, se
// cuentan. Un documento que dice "no lo hagas" no distingue entre "nadie lo
// hace" y "nadie ha mirado".
//
// ⚠️ ALCANCE, declarado a propósito (petición del auditor de AIT-111): esto es
// una HEURÍSTICA, no una prueba. Detecta el patrón directo
//     setAlgoError(... err.message ...)
// y NO detecta el mensaje que pasa antes por una variable intermedia, ni el que
// se transforma por otra vía (plantilla, `String(err)`, un helper propio).
// Enumera; NO decide: si algún día devuelve algo, hay que abrir los casos y
// adjudicarlos a mano. Un recuento de 0 significa "no encuentro el patrón
// directo", no "es imposible que se filtre un mensaje".
//
// Comprobado que sabe gritar: al inyectar a propósito un
// `setMoveError(err.message …)` en app/pipeline/page.tsx, el recuento sube y
// nombra el fichero y la línea. Sin ese control positivo, un 0 no distingue
// "no hay ninguno" de "no miro donde debo".
//
//   node scripts/check-error-message-leaks.mjs     → 0 = limpio, 1 = hay fugas

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const RAICES = ["app", "components"];
const MENSAJE = /\b(?:err|error|e)\.message\b/;
// Un setter que pone TEXTO delante del usuario. `setLoading(false)` o
// `setStarting(false)` no lo son: apagan un spinner. Esa confusión es la que
// dejó pasar un fallo real en el inventario de AIT-94.
const SETTER_VISIBLE =
  /set\w*(?:Error|Modal|Message|Aviso)\s*\(\s*$|set\w*(?:Error|Modal|Message|Aviso)\s*\(.*\b(?:err|error|e)\.message\b/;
const ES_COMENTARIO = (linea) => /^\s*(\/\/|\*|\/\*)/.test(linea);

function ficherosTsx(dir) {
  const salida = [];
  for (const entrada of readdirSync(dir)) {
    const completo = path.join(dir, entrada);
    if (statSync(completo).isDirectory()) salida.push(...ficherosTsx(completo));
    else if (entrada.endsWith(".tsx")) salida.push(completo);
  }
  return salida.sort();
}

export function buscarFugas(raices = RAICES) {
  const fugas = [];
  for (const raiz of raices) {
    for (const fichero of ficherosTsx(raiz)) {
      const lineas = readFileSync(fichero, "utf8").split("\n");
      lineas.forEach((linea, i) => {
        // Los comentarios fuera: la frase "no exponer err.message" se contaba
        // como una infracción de esa misma regla (fallo real, AIT-94).
        if (ES_COMENTARIO(linea) || !MENSAJE.test(linea)) return;
        const arriba = lineas
          .slice(Math.max(0, i - 4), i)
          .filter((l) => !ES_COMENTARIO(l));
        if (SETTER_VISIBLE.test(linea) || arriba.some((l) => SETTER_VISIBLE.test(l))) {
          fugas.push({ fichero, linea: i + 1, texto: linea.trim() });
        }
      });
    }
  }
  return fugas;
}

export function run() {
  const fugas = buscarFugas();
  console.log(`Sitios donde el mensaje del servidor puede pintarse: ${fugas.length}`);
  for (const f of fugas) console.log(`  ${f.fichero}:${f.linea}   ${f.texto}`);
  if (fugas.length > 0) {
    console.log("");
    console.log("Regla: docs/01-arquitectura.md §6 — leer para clasificar, no devolver.");
  }
  return fugas.length === 0 ? 0 : 1;
}

// Igual que scripts/check-e2e-preconditions.mjs: solo se ejecuta al invocarlo
// directamente, para que se pueda importar sin efectos.
if (process.argv[1]?.endsWith("check-error-message-leaks.mjs")) {
  process.exitCode = run();
}

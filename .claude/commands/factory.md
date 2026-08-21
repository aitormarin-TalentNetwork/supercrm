---
description: Arranca la fábrica de software abriendo primero al PM (puerta de entrada visual) — el PM se presenta a Aitor y, cuando toca, crea al CEO, que a su vez monta (cada uno en su propia ventana colocada en árbol) Directora/Integrador/Factory Architect, además de las terminales de trabajo que el backlog sostenga.
---

Vas a arrancar la fábrica de software de SuperCRM abriendo, en primer lugar, al
**Product Manager (PM)** — es la puerta de entrada visual de `/factory`: la primera
ventana que ve Aitor con el look&feel de la fábrica (verde, título `PM`), para que quede
claro el salto desde la terminal normal donde se escribió `/factory`. Antes de nada, lee
completo `Sorfware Factory/INSTRUCCIONES PARA LA FABRICA DE SOFTWARE/pm.md` (parte
genérica, incluida "Eres la puerta de entrada de `/factory`", más la configuración de
este proyecto) y `Sorfware Factory/INSTRUCCIONES PARA LA FABRICA DE SOFTWARE/README.md`
§4ter (mecánica concreta: recetas de `osascript`, colores/títulos por rol, disposición
en árbol, dónde vive el auditor, modo de publicación del Integrador). **Todo son
ventanas separadas, nunca pestañas** — probado contra el entorno real, crear pestañas
por script no es fiable aquí.

Secuencia a seguir, en orden, sin saltarte pasos:

1. **Comprueba qué ya existe antes de crear nada.** Usa `ListAgents` — si ya hay una
   sesión PM activa (identifícala por el color de fondo, ver README §4ter — el título se
   sobrescribe al arrancar Claude Code pero el color no), no abras una ventana nueva:
   dile a Aitor que la fábrica ya está en marcha y en qué ventana está el PM, y termina
   aquí.

2. **Si no existe todavía, abre la ventana del PM** (nueva siempre, nunca esta misma
   sesión): título `PM`, fondo verde oscuro, en la raíz del repo, con la receta de
   README §4ter. Espera a que aparezca en `ListAgents` y mándale por `SendMessage`:
   "eres el PM de SuperCRM — lee `pm.md` completo antes de hacer nada, incluida la
   sección 'Eres la puerta de entrada de `/factory`'. Preséntate primero en tu propia
   ventana, antes de preguntar nada."

3. **Esta sesión no asume ningún rol de pipeline.** Su trabajo termina en abrir la
   ventana del PM — a partir de aquí, la conversación de la fábrica continúa ahí, no en
   esta ventana. Repórtale a Aitor, en una frase, que la ventana del PM ya está abierta y
   esperando (o que ya existía y se reutilizó).

A partir de aquí, es el PM quien decide con Aitor cuándo levantar al resto del equipo:
crea entonces al CEO (ventana nueva, orientado ya al proyecto — ver `pm.md`), y es el
CEO quien crea Directora, Integrador y Factory Architect, cada uno orientado igual (ver
`ceo.md`) — y la Directora, a su vez, de las terminales de trabajo que el backlog
sostenga. Ninguno de esos pasos corre en esta sesión — si algo de lo anterior no está
claro, `pm.md` y `README.md` §4ter mandan.

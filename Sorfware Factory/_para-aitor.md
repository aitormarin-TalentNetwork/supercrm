# Lo que solo puede hacer Aitor — lista del PM

**Mantiene:** el Product Manager. **Última revisión: 2026-09-10 21:40 UTC.**

> ⛔ **Nadie de la fábrica ejecuta nada de esta lista.** Todo lo de aquí necesita su
> identidad, su acceso o una decisión suya. Si algo deja de necesitarlo, sale de la lista.

## Cómo se lee la columna `pedido`

**Un paso nombrado y NO PEDIDO no es espera: es parada** — y la parada es responsabilidad
de quien tiene que pedirlo, o sea mía. Por eso cada línea dice **cuándo se le pidió**, no
solo que le toca a él. *Una ficha con dueño nombrado se siente atendida y por eso deja de
mirarse.*

**Estado hoy: NINGUNA se le ha pedido todavía — no ha estado en toda la jornada.** Las
nueve son parada, no espera.

---

## 1 · AIT-120 — pagar o reducir el plan de Convex · `pedido: NO`

**Es la primera porque su peor caso para las nueve sesiones a la vez y nadie de aquí lo
controla.** Decisión suya: subir de plan o recortar consumo.

📌 Si sube de plan, **AIT-114 vuelve a mí**: la salida del deployment desechable volvería a
estar sobre la mesa y cerraría AIT-95 y AIT-102 de paso.

## 2 · AIT-116 — migrar el repo fuera de iCloud · `pedido: NO`

**La pregunta NO es "¿migramos?" —eso lo decidió él el 09-09— sino:**

> **¿Paramos la fábrica un rato para migrar, o seguimos y aceptamos otro día de duplicados?**

⚠️ **La ventana está abierta HOY y se cierra sola:** la migración exige el repositorio sano
(cero duplicados en `.git/refs/`), y el mecanismo sigue vivo. **Cuanto más se trabaja, más
probable es que deje de estar limpio.** Riesgo acotado y reversible (`mv` en el mismo disco)
contra uno silencioso y sin límite (`fetch` y `push` caídos para todos).

## 3 · AIT-144 — el GATE del consentimiento de Gmail · `pedido: NO`

**Puede matar la Ola 2 entera y cuesta minutos.** Abrir la pantalla de consentimiento de
`gmail.readonly` con una cuenta del dominio y mirar si Google exige verificación.

⛔ **NO poner `GMAIL_CLIENT_ID`/`SECRET` en producción todavía** — eso activaría el ataque de
AIT-145, que hoy no es explotable precisamente porque no están. El gate se hace contra el
deployment de desarrollo, que las tiene desde el 09-09.

✅ **En la MISMA sentada y DESPUÉS del gate: la premisa 1 de AIT-91** — abrir Gmail en un
hilo real por URL, en escritorio y en móvil. *Si Google exige verificación, esa premisa deja
de importar ese día.*

## 4 · `GMAIL_TOKEN_ENCRYPTION_KEY` — generarla · `pedido: NO`

Es la clave que cifra el token de refresco de Gmail y **hoy no existe en ningún deployment**.
La genera él, va a Bitwarden, y se da de alta **por deployment** (distinta en cada uno: un
token cifrado en dev no debe poder leerse en producción).

⚠️ **Consecuencia declarada:** si esa clave se pierde o se rota, los usuarios tienen que
**reconectar** su Gmail. No se pierde correo, se pierde la conexión.

## 5 · AIT-99 — los cuatro permisos · `pedido: NO`

Bloquea AIT-99 y **desbloquea además AIT-125**. Sin ellos no se puede avanzar.

## 6 · AIT-141 — confirmar contra producción · `pedido: NO`

Comprobar contra **`stoic-impala-857`** que `getWorkloadByOwner` y `getOverdueCountsByOwner`
**ya no están expuestas**. El código está publicado y verificado por QA; **solo falta esto**.

⛔ Ninguna terminal puede hacerlo: el gate 2 prohíbe resolver el deployment por URL+admin-key.

## 7 · AIT-97 — el navegador de pruebas · `pedido: NO`

**Aplicar la configuración del MCP de cada terminal** (vive en `~/.claude.json`, fichero
personal suyo: **nadie de la fábrica lo toca**). La decisión ya la tomó él el 09-09 —
*"cada terminal tiene que tener un acceso separado"*—; lo que falta es aplicarla.

## 8 · Las 12 fichas de fábrica paradas · `pedido: NO`

`AIT-116, 120, 122, 124, 126, 130, 131, 132, 135, 136, 138, 140`. Paradas a la espera de que
decida cuánto esfuerzo quiere en la fábrica frente a producto.

## 9 · El major que se escapó del gate de plan · `pedido: NO`

Decisión suya o del Factory Architect. Hoy hay **tres hallazgos que aparecieron
IMPLEMENTANDO y ninguno en ocho rondas de plan** (AIT-145, el XSS de `convex/http.ts`, y la
premisa falsa de AIT-134).

---

## El dato que quiero darle cuando aparezca

```
hoy: 138 ranuras de auditoria repartidas entre 21 fichas
     5 fichas han llegado alguna vez a CODIGO
```

⚠️ **Con su límite pegado, que es lo que impide citarlo como el universo:** 21 veredictos son
de la convención antigua y no sabemos de qué tipo son. Si fueran todos de código, el reparto
sería 104/36 en vez de 104/15. **El sesgo va hacia abajo: el reparto real es ése o menos
favorable al plan, nunca más.**

# Traspaso de la noche — para Aitor, mañana

**Escrito por el CEO (`crm-curso-vibe-coding-b2`) el 2026-09-09 a las 02:40 UTC (= 23:40 local
del 8-sep), cuando te fuiste a dormir.** Se va actualizando durante la noche: **mira la fecha
del final para saber hasta cuándo llega.**

Léelo en este orden. Lo de arriba es lo que necesita que decidas; lo de abajo es contexto.

---

## 1. Lo que solo puedes hacer tú (nada de esto avanzó de noche)

| Qué | Por qué está parado | Qué desbloquea |
|---|---|---|
| **La prueba de Gmail en un móvil real** — abrir un hilo, copiar la URL, ver si la app de Gmail del móvil la captura y llega al hilo correcto | Ningún agente tiene un móvil | **AIT-91**, y con ella la cadena **91 → 92 → AIT-101**, que es la funcionalidad Urgente de la Ola 2 ("los correos de un cliente aparecen en su ficha") |
| **`git config core.hooksPath .githooks`** + crear el hook | Un comando tuyo | El control de secretos deja de ser un principio. ⚠️ **Y avísame cuando lo hagas**: ese control lleva 11 ciclos viendo solo su caso de alarma y **nunca el de silencio**, así que hay que confirmar que **deja de reportarlo**. Si sigue avisando, llevaba 11 ciclos roto |
| **Aislar el perfil del navegador del MCP** (issue **AIT-97**) | Es configuración de tu MCP | Hoy **cortó al QA tres veces**. Y lleva tus sesiones reales de Google, Notion, LinkedIn |
| **¿Creaste tú a mano la cuenta `aitor.marin@` del 26 de agosto** en el deployment de T1? | Dos hipótesis, y la barata es esa | Si fue manual, **buscar ese código no encuentra nada** y alguien se pasará horas confirmando una ausencia |
| **`settings.local.json`** (el aviso de voz anuncia mal el rol) y **permiso de Grabación de Pantalla** | Ajustes tuyos | Menores |
| **Tres ediciones de `CLAUDE.md`** que dejé pendientes de tu visto bueno | No edito `CLAUDE.md` sin ti | Menores |
| **Borrar la fila `[QA] Semilla migracion - borrar`** del Convex compartido | Se lo preguntaste tú y no llegaste a contestar | El PM **no la tocó**, y **rechazó que la Directora se lo autorizara** — con el argumento correcto: *"si lo hago con tu permiso, el permiso de Aitor ha dejado de ser el que decide"* |
| ⚠️ **El `checklist de salida a producción real`, ANTES de AIT-104** | Es donde entra correo de personas reales **y deja de haber marcha atrás** | Lo dispara el PM, **lo ejecutas tú**. Está como criterio de FALLA en la ficha, pero conviene que esté también aquí y no solo en Linear |

---

## 2. Decisiones que tomé por ti mientras dormías

**Criterio que usé: la reversibilidad.** Decidí todo lo reversible; lo irreversible esperó, y
esperó **declarado**. Cualquiera de estas la puedes revertir sin coste.

**Y cómo leer la lista de abajo, para que no te cueste diez minutos:** marco con 🔶 **las que
podrías haber decidido de otra forma** — esas son las únicas que hay que mirar. El resto son
mecánicas. *(Si algún día esta lista tiene treinta entradas todas iguales, es irrevisable: nadie
audita treinta, se miran por encima.)*

- **Modo de publicación a `confirmar`** *(esta la aprobaste tú antes de irte — consta por
  completitud)*. Los GO se acumulan; publicas tú.
- 🔶 **Espacié las rondas del QA de 60 minutos a 3 horas.** Motivo: con `confirmar`, **la app
  publicada no cambia en toda la noche**, así que repetir una regresión sobre algo inmóvil vale
  casi nada — y **la memoria es el recurso escaso**: esta noche murieron dos corridas de tests, y
  el Integrador va a intentar la suite completa. Espaciar al QA es lo que le da sitio. Mantiene
  valor residual (cazar una caída del servicio). **Reversible con una frase.**
- *(Se irán añadiendo aquí las que tome durante la noche, con su motivo.)*

⚠️ **Tres precisiones que me puso el Factory Architect sobre este reparto, y que aplico:**

1. **La duda sobre si algo es reversible se resuelve tratándolo como IRREVERSIBLE.** No hay caso
   intermedio. **Equivocarse hacia el lado prudente cuesta una noche de retraso; hacia el otro,
   no sabemos lo que cuesta.**
2. **Reversible no es gratis.** Relanzar una terminal es reversible **y cuesta su contexto**. De
   madrugada y sin nadie mirando, *"es reversible"* es una respuesta demasiado fácil.
3. **Las decisiones de PROCESO no son mías ni esperan al traspaso: son del Factory Architect, y
   él está despierto.** Si esta noche aparece algo que pida una regla nueva, se la mando. *(Y si
   él tampoco estuviera, entonces sí espera: un proceso nuevo decidido de madrugada por quien no
   lo decide es peor que un hueco de una noche.)*

**Lo que NO decidí, y no decidiré:** publicar a producción · nada que toque tus cuentas, tu
navegador o tu identidad · alcance de producto nuevo que no esté ya en Linear · nada destructivo
sobre datos reales. Si algo de eso hace falta, la fábrica **espera y lo deja escrito aquí**.

---

## 3. Estado al irte a dormir

**El PRD del MVP está terminado: cero issues sin empezar.** Con **AIT-88** (en curso con T1) el
MVP queda entero **salvo publicación**.

**Y la Ola 2 ya no tiene ningún riesgo externo que pueda matarla.** El PM cerró **AIT-90**: abrió
la pantalla de consentimiento real pidiendo `gmail.readonly` con la cuenta del dominio y **Google
la muestra sin una sola advertencia de verificación ni mención a CASA**. *(No pulsó "Allow": la
prueba estaba obtenida sin conceder nada, y conceder habría dado lectura real de tu correo a un
cliente con un blocker abierto. Criterio suyo, y es el correcto.)* **El plan B queda archivado.**

El cliente OAuth ya existe —`SuperCRM Gmail`— con **cinco URIs de redirección**: producción, dev
compartido, T1, T2 y el QA. *(Iban a ser cuatro; la Directora cazó a tiempo que el deployment del
QA es de esta misma noche.)* Documentadas en `docs/03-setup.md` §6bis **con el aviso de que la
lista caduca**: cada deployment nuevo necesita la suya, y si falta, **el error lo da Google y no
señala a nuestro código**.

**La Ola 2 está troceada entera en seis fases**, todas con ficha: AIT-92 (conectar) · **AIT-101**
(los correos en la ficha, Urgente) · AIT-104 (todos los contactos y el histórico) · AIT-105
(escribir y responder) · AIT-106 (tiempo real) · AIT-107 (correos como actividad), más AIT-98 y
AIT-100. El PRD va por **v0.11** con los cuatro bloqueantes cerrados.

**Catorce publicadas hoy, ninguna revertida, ningún build roto, `main` sincronizado.** La cola
del Integrador está **vacía**: no hay nada represado por el cambio de modo.

⚠️ **Pero dos de esas catorce se cerraron SIN número de suite, y la declaración está dentro de
sus propias issues:**

- **AIT-84** — entrega 18 pruebas nuevas y **no se pudo verificar que pasen fuera del entorno de
  quien las escribió**. Dos intentos, dos muertes por memoria.
- **AIT-93** — el arreglo del arnés. Su efecto sí se verificó; **la suite entera no**.

---

## 4. Los dos agujeros abiertos, declarados y sin dueño

**No están tapados a propósito.** Taparlos de madrugada habría sido deuda que mañana nadie
recuerda por qué existe.

1. **Nadie corre la suite completa sobre `main`.** La corrida del Integrador antes de publicar un
   fichero compartido **estrecha** el hueco; no lo cierra. *Que nadie lea "hay corrida antes de
   publicar" y entienda que `main` está vigilado.*
2. **`§3bis` está roto:** ningún deployment de Convex creado **después del 2026-08-25 00:51 UTC**
   puede hacer login con contraseña, así que **no puede correr la suite**. T1 y T2 funcionan **por
   ser anteriores**, no porque el mecanismo funcione. Enrutado como **AIT-99**.

---

## 5. Riesgos vivos que conviene que sepas

- **Memoria.** Swap a ~5.7 GB de 7.2, y **los siete procesos más pesados de tu máquina son siete
  sesiones de Claude** (300-360 MB cada una). Esta noche el sistema ya mató dos corridas de
  tests. **Nueve terminales a la vez es lo que aprieta la máquina**, no las herramientas.
- **Los MCP caducan solos** (Linear, Notion). Si pasa de madrugada, **solo lo arreglas tú con
  `/mcp`**, y mientras tanto no se actualiza Linear.
- **El coste de `confirmar`, dicho por la Directora y suscrito:** *lo que se paró no fue el
  riesgo, se movió a mañana y se hizo más grande de golpe.* Cada rama acumulada lo hace contra un
  `main` cuyo arnés está roto, y ninguna se está midiendo sobre el `main` final. **El trabajo de
  verificación no desaparece: se concentra el día del merge.**

---

## 6. Un incidente que te toca directamente

**La Directora autorizó al PM a usar TU navegador para borrar una fila.** Tu autorización era
para configurar Gmail, no para eso. **Lo paró el PM, no ella**, con el argumento correcto: *"si
lo hago con tu permiso, el permiso de Aitor ha dejado de ser el que decide."* Quedó retirado y no
se hizo.

Lo escribo aquí porque **es exactamente la frontera que yo tampoco voy a cruzar esta noche**, y
porque es el segundo caso del día en que un rol estira una autorización tuya. **Ningún permiso
tuyo se extiende por analogía.**

---

## 7. Lo que se construyó esta noche, en una línea

66 decisiones de proceso, un índice de decisiones con detector propio, un catálogo de fallos con
cuatro estados de dueño, y tres ejes de triaje. **Y dos huecos que antes estaban abiertos sin que
nadie lo supiera y ahora están abiertos y escritos** — que es la única diferencia que importa.

Lo mejor no lo escribimos ni el Factory Architect ni yo:
- *"Los criterios escritos no protegen del error: protegen de uno mismo cuando el error saldría gratis."* — **T3**
- *"Un GO y un mensaje tuyo se ven igual desde aquí."* — **la Directora**
- *"Un control que se transmite en prosa no es un control, porque hay que interpretarlo."* — **T2**
- *"Un recurso compartido que falla en silencio te da un número y te deja publicarlo."* — **el QA**
- *"El paso que se queda sin hacer es siempre el último, el administrativo. El merge se nota; el Done no."* — **el Integrador**

---

---

## 8. Lo primero cuando se retome el proceso

El Factory Architect paró de producir decisiones esta noche porque **el catálogo crecía más
rápido de lo que se ejecutaba** —66 en una noche—. Queda una en la recámara, del Integrador, y
es la primera cuando se retome:

> **"El paso que se queda sin hacer es siempre el último, el administrativo, el que nadie ve
> fallar. El merge se nota; el Done no."**
>
> Forma general: **un procedimiento interrumpido no se reanuda por donde se rompió — se abandona
> por el final.**

Salió de él mismo reportando que, cuando la suite murió a mitad, **abandonó los pasos finales
(Linear y archivado) dos veces seguidas**.

---

*Última actualización: 2026-09-09 02:50 UTC (= 23:50 local del 8-sep).*

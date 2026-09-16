---
type: task-spec
id: TASK-004
status: verified
---

# Task: «At risk» crea entradas vacías y llama «expuesto» a lo que no lo está

## Petición, alcance y comportamiento actual

Miguel, al marcar *At risk* en la lista de equipos: «va directo a risk register
pero con lost 0». Investigado en TASK-004/EV-000 —reproducido con los archivos
reales, revisión `eb6883a`— resultan **tres** casos distintos, y solo dos son
defectos:

| Caso | Qué pasa hoy | ¿Correcto? |
|---|---|---|
| Vence dentro del año (fin 30/11/2026, $68.943) | entrada $68.943 al 50 %, descuenta **−$2.873** | **sí** |
| Pasa del año (fin 28/2/2027, $55.824) | entrada $55.824 al 50 %, descuenta **$0** | **sí** — en 2026 no se pierde nada |
| **Sin ingreso** (ni directo ni bundle) | entrada de **$0**, descuenta $0 | **no** |

De los 3.073 equipos: **1.967 no tienen ingreso** —dos de cada tres filas de la
tabla—, 760 tienen el evento fuera del año y **346 descuentan de verdad**.

Dos defectos:

**D-1 · Una entrada de riesgo vacía no es un riesgo.** Marcar un equipo sin
ingreso crea una fila en el registro con $0 expuestos y $0 ponderados. Con 1.967
candidatos, el registro se llena de ruido y el que mira no distingue lo que
importa.

**D-2 · «Gross exposure» miente cuando el evento cae fuera del año.** La cabecera
del registro dice `Gross exposure $57.679 · Weighted $0`, y lo expuesto **en este
BP** también es cero. El formulario sí lo dice bien —«Annual value exposed»—; la
cabecera y la fila («of $57.679 exposed») no.

**D-3 · El aviso al marcar no dice si muerde.** Marcar *Lost* avisa de que el
evento cae fuera del año; marcar *At risk* solo dice «added to the risk register
at 50 %». El silencio es lo que hace pensar que está roto.

## Resultado deseado y aceptación

- **TASK-004/REQ-001:** Un equipo sin ingreso no crea entrada de registro. La
  decisión se conserva en el equipo; lo que no se crea es la fila vacía.
- **TASK-004/REQ-002:** Lo que se llame «expuesto» es lo expuesto **en el año del
  BP**. El valor anual se llama valor anual.
- **TASK-004/REQ-003:** Al marcar *At risk*, el aviso dice cuánto entra en el
  año, o por qué no entra nada.
- **TASK-004/REQ-004:** No cambia ni una cifra del plan.

- **TASK-004/AC-001:** Marcar *At risk* un equipo sin ingreso **no** añade nada
  a `S.risks`, y el aviso lo explica.
- **TASK-004/AC-002:** Marcar *At risk* un equipo con ingreso sigue creando la
  entrada con su valor y su 50 %, como hoy.
- **TASK-004/AC-003:** La cabecera del registro distingue valor anual de lo que
  cae en el año; la fila también.
- **TASK-004/AC-004:** Los tres avisos —muerde, no muerde por fecha, no muerde
  por no haber ingreso— salen con el texto que les toca.
- **TASK-004/AC-005:** Con los archivos reales, las cifras del plan son
  idénticas: 3.073 registros, base $11.024.782, y los tres casos de arriba
  descuentan −$2.873, $0 y $0.

## Anclajes afectados y razón del impacto

`business_plan_tool.html` → `modules/bp-builder.spec.md`. Cambia una regla de
comportamiento —cuándo se crea una entrada automática— y texto de pantalla. No
toca el motor: `engine()`, `eventMonths()` y `recordLoss()` se quedan como están.

## Lo que NO se hace, y por qué

**Hacer que *At risk* descuente siempre**, moviendo la fecha del evento dentro
del año. Sería inventar una pérdida: decirle al plan que un contrato vigente
hasta junio de 2027 se cae en 2026. Quien crea que el cliente se va antes lo
dice cambiando la fecha del evento a mano, que para eso está.

## Evidencia de verificación

| Requisito | Aceptación | Verificación | Resultado real | Evidencia |
|---|---|---|---|---|
| REQ-001 | AC-001 | Marcar un `uncovered` y contar `S.risks` | **pass** — 0 entradas | EV-001 |
| REQ-001 | AC-002 | Marcar un equipo con ingreso | **pass** — entrada con su valor y 50 % | EV-002 |
| REQ-002 | AC-003 | Leer cabecera y fila del registro | **pass** | EV-003 |
| REQ-003 | AC-004 | Los tres avisos | **pass** | EV-004 |
| REQ-004 | AC-005 | Cifras con los archivos reales | **pass** — idénticas | EV-005 |

- **EV-001:** Serial `202310377`, clase `uncovered`. Tras marcarlo,
  `S.risks.length` = **0** y no existe entrada con su clave.
- **EV-002:** Serial `44059012` (fin 30/11/2026, $68.943): entrada de $68.943 al
  50 %, `recordLoss` = **$2.873**. Serial `44055411` (fin 28/2/2027, $55.824):
  entrada de $55.824 al 50 %, evento 3/2027, `recordLoss` = **$0**.
- **EV-003:** Cabecera: `Annual value $124,767 · Exposed in 2026 $5,745 ·
  Weighted $2,873`. Filas: «of $5,745 exposed in 2026 / $68,943 a year» y
  «nothing exposed in 2026 / $55,824 a year». Ya no hay un «expuesto» que
  contradiga un ponderado a cero.
- **EV-004:** Los tres, capturados interceptando `toast()`:
  1. «…marked at risk, but it carries no revenue — no direct contract and
     nothing reclassed — so there is nothing to put in the register.»
  2. «…added to the risk register · $2,873 off 2026 at 50 % — open it to add
     evidence and an owner»
  3. «…added to the risk register at 50 %, but the event falls in Mar 2027 —
     nothing comes off 2026. Move the event month if you expect it sooner.»
- **EV-005:** Con los dos archivos reales: 3.073 registros · base
  **$11.024.782** · directo $7.058.238 · bundle emparejado $5.290.140 · FOC
  $277.400. Con los dos riesgos puestos, esperado $11.021.909 = base − $2.873,
  que es exactamente lo que descuenta el único que cae dentro del año.

## De propina, y dicho

El registro decía «**1 months** in 2026». Arreglado aquí porque era la línea que
se estaba tocando. El mismo fallo queda en otras cuatro líneas de Oportunidades
y T&M, **sin tocar**, en `findings/0002`: ensanchar el diff por cuatro plurales
habría costado más revisión de lo que vale.

## Revisión final

- **Cobertura documental:** PASS
- **Spec → Code:** ALIGNED — C-RISK-001 y 002 describen lo implementado.
- **Code → Spec:** ALIGNED — el motor no se toca: `engine()`, `eventMonths()` y
  `recordLoss()` quedan igual, y las cifras lo confirman.

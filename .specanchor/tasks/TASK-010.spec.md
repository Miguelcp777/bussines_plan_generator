---
type: task-spec
id: TASK-010
status: verified
---

# Task: plataforma y cobertura como desplegables, y la oportunidad sabe de qué corriente es

## Petición, alcance y comportamiento actual

Miguel: «en las oportunidades necesito un dropdown para elegir plataforma y un
dropdown para elegir coverage type, dependiendo del coverage type seleccionado el
posible revenue debe contabilizarse como Direct o bundle en el reporte».

**Hoy:**

- `oPlat` es un campo de texto libre. Se escribe «Catalys» y la flota lo llama
  `PHACO` o `FEMTOLASER`: el informe enseña una plataforma que no existe en los
  datos y no cruza con nada.
- **No hay campo de cobertura.** La oportunidad no sabe qué se está vendiendo.
- El informe trata toda la oportunidad como un bloque. La línea base sí se
  reparte en directo y bundle —son dos corrientes que se comportan distinto,
  `global/datos-y-persistencia.spec.md` C-DAT-002— pero lo que se va a vender no.

Eso importa porque las dos corrientes no son lo mismo: la directa la factura el
cliente y hay que renovarla; la bundle se reclasifica internamente y viaja con
el equipo. Una oportunidad de $40.000 no dice lo mismo según cuál de las dos
engorde.

## Resultado deseado y aceptación

- **TASK-010/REQ-001:** Plataforma es un desplegable con **las plataformas que
  existen en la installed base**.
- **TASK-010/REQ-002:** Hay un desplegable de **tipo de cobertura**, con los
  tipos que existen en la installed base.
- **TASK-010/REQ-003:** Al elegir cobertura, la corriente —Direct o Bundle— se
  deduce **de cómo se paga esa misma cobertura en la flota**, y se enseña con la
  evidencia de por qué.
- **TASK-010/REQ-004:** La deducción se puede corregir a mano. Es un supuesto,
  no un dogma.
- **TASK-010/REQ-005:** El informe reparte la oportunidad en las dos corrientes,
  en la tabla y en el total.
- **TASK-010/REQ-006:** Las oportunidades guardadas antes siguen funcionando.

- **TASK-010/AC-001:** El desplegable de plataforma trae las de la flota
  cargada, sin inventar ninguna.
- **TASK-010/AC-002:** El de cobertura, igual.
- **TASK-010/AC-003:** Elegir una cobertura mayoritariamente bundle en la flota
  pone la corriente en Bundle, y una de contrato directo la pone en Direct, con
  el recuento a la vista.
- **TASK-010/AC-004:** Cambiar la corriente a mano se respeta y se guarda.
- **TASK-010/AC-005:** El informe enseña la corriente por oportunidad y el
  reparto del total.
- **TASK-010/AC-006:** Un plan guardado sin estos campos se abre sin error y sus
  oportunidades cuentan como directas, dicho en pantalla.

## Anclajes afectados

`business_plan_tool.html` → `modules/bp-builder.spec.md` (C-OPP-001).

## Evidencia de verificación

| Requisito | Aceptación | Verificación | Resultado real | Evidencia |
|---|---|---|---|---|
| REQ-001/002 | AC-001/002 | Desplegables contra los datos | **pass** — idénticos | EV-001 |
| REQ-003 | AC-003 | Una cobertura de cada clase | **pass** | EV-002 |
| REQ-004 | AC-004 | Corregir a mano y guardar | **pass** | EV-003 |
| REQ-005 | AC-005 | Tabla y total del informe | **pass** | EV-004 |
| REQ-006 | AC-006 | Entrada sin los campos nuevos | **pass** | EV-005 |

- **EV-001:** Con su plan (412 registros): plataformas del desplegable
  `ABERROMETR, ELITA, FEMTOLASER, LCS, MGD, MPB, PHACO, STARLASER` — las ocho
  que hay en los datos, ni una más. Coberturas: **31**, lista idéntica a
  `uniq(S.rows.map(r=>r.coverage))`.
- **EV-002:** `FEM - TA` → **direct**, «11 of 11 systems on FEM - TA are invoiced
  to the customer». `PHC-DEMO` → **bundle**, «177 of 177 systems on PHC-DEMO are
  funded by the reclass». Una cobertura inventada → direct, diciendo que ningún
  equipo la lleva.
- **EV-003:** Tercera oportunidad con cobertura `FEM - TA` —que deduce direct— y
  la corriente cambiada a mano a bundle: se guarda `stream:'bundle'`.
- **EV-004:** En el informe, columnas **Coverage** y **Stream**; tres filas con
  Bundle / Direct / Bundle; pie: «3 opportunities · **$15,000 direct** ·
  **$30,000 bundle**», total +$45.000. Y el párrafo que explica por qué las dos
  corrientes no son lo mismo.
- **EV-005:** Una entrada sin `cov` ni `stream` sale como **«Direct · assumed»**,
  cuenta como directa en el pie, el informe dice «1 entry predates this split and
  is counted as direct», y al editarla el formulario lo repite.

## Revisión final

- **Cobertura documental:** PASS
- **Spec → Code:** ALIGNED — C-OPP-001 a 003 describen lo implementado.
- **Code → Spec:** ALIGNED — el motor no cambia: la corriente reparte lo que ya
  calculaba `eventMonths`, no altera el total.

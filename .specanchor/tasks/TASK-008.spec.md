---
type: task-spec
id: TASK-008
status: verified
---

# Task: el informe impreso se solapa

## Petición, alcance y comportamiento actual

Miguel: «cuando genera el reporte en pdf se solapa en la vista previa». En su
captura, el *Executive summary* y tres tablas de anexo dibujados unos encima de
otros en la página 2 de 11.

**Causa, medida** con su plan cargado en ciclo 2027:

```css
.rs{margin-bottom:34px;page-break-inside:avoid}
```

Todas las secciones del informe piden no partirse. Y cuatro de las trece **no
caben en una página** (una A4 con márgenes de 14 mm son ~1.017 px a 96 ppp):

| Sección | Altura |
|---|---:|
| Executive summary | **1.431 px** |
| Where the expected revenue comes from | 1.026 px |
| Contracts due for renewal in 2027 (38 filas) | **2.411 px** |
| Data quality and controls (21 filas) | **1.458 px** |

Cuando un bloque que no puede partirse es más alto que la página, el navegador
no tiene dónde ponerlo: lo desborda, y lo que sigue se dibuja encima. Con más
datos —un cluster grande, más contratos que renovar— empeora, porque esas tablas
crecen con la cartera.

`page-break-inside:avoid` es correcto para una tarjeta o un gráfico. Aplicado a
una sección entera con una tabla dentro, es una promesa que el papel no puede
cumplir.

## Resultado deseado y aceptación

- **TASK-008/REQ-001:** Ningún bloque que pida no partirse puede ser más alto
  que una página.
- **TASK-008/REQ-002:** Lo que sí debe mantenerse junto se mantiene: una tarjeta
  de indicador, un gráfico con su título, una cita, una fila de tabla.
- **TASK-008/REQ-003:** Una tabla larga que se parte **repite su cabecera** en
  cada página. Una tabla de 38 filas partida sin cabecera es ilegible.
- **TASK-008/REQ-004:** Un encabezado de sección no se queda solo al final de
  una página.
- **TASK-008/REQ-005:** El informe en pantalla no cambia.

- **TASK-008/AC-001:** Con su plan, **ningún** elemento con `break-inside:avoid`
  en impresión mide más de 1.017 px.
- **TASK-008/AC-002:** Las tarjetas, los gráficos y las filas sí lo piden.
- **TASK-008/AC-003:** `table.rt thead` es `table-header-group`.
- **TASK-008/AC-004:** El informe en pantalla mide lo mismo que antes.

## Anclajes afectados

`business_plan_tool.html` → `modules/bp-builder.spec.md` (C-PRINT-001).

## Evidencia de verificación

| Requisito | Aceptación | Verificación | Resultado real | Evidencia |
|---|---|---|---|---|
| REQ-001 | AC-001 | Medir cada bloque no partible | **pass** — máximo 239 px | EV-001 |
| REQ-002 | AC-002 | Reglas aplicadas en `@media print` | **pass** | EV-002 |
| REQ-003 | AC-003 | `thead` como grupo de cabecera | **pass** | EV-003 |
| REQ-005 | AC-004 | Altura del informe en pantalla | **pass** — idéntica | EV-004 |

- **EV-001:** Recorriendo las hojas de estilo del documento y midiendo todo lo
  que pide `break-inside:avoid` en impresión, con su plan cargado en ciclo 2027:

  | Selector | Elementos | Altura máxima | Pasan de página |
  |---|---:|---:|---:|
  | `.rk .k, .rc .rcw, .rq, .rhero` | 14 | 239 px | **0** |
  | `table.rt tr` | 119 | 124 px | **0** |

  Ninguno de los 133 se acerca a los 1.017 px de una página. Antes, cuatro
  secciones enteras pedían no partirse midiendo 1.026, 1.431, 1.458 y 2.411 px.
- **EV-002:** `.rs` ya no pide no partirse, y no queda ningún
  `break-inside:avoid` fuera de `@media print`.
- **EV-003:** La regla `table.rt thead{display:table-header-group}` está en el
  bloque de impresión: una tabla de 38 filas partida repite su cabecera.
- **EV-004:** Altura del informe en pantalla, con el mismo plan: **11.426 px**
  con la versión commiteada y **11.426 px** con esta. `page-break-inside` no
  pinta nada en pantalla y lo demás va dentro de `@media print`.

## El límite de lo comprobado

Lo verificado es la **invariante**: ningún bloque no partible es más alto que
una página, que es la causa medida del solape. **No he generado un PDF ni lo he
mirado** — desde aquí no puedo abrir el diálogo de impresión del navegador. La
confirmación final es abrir la vista previa.

## Revisión final

- **Cobertura documental:** PASS
- **Spec → Code:** ALIGNED — C-PRINT-001 describe lo implementado.
- **Code → Spec:** PARTIAL — la paginación real no se ha observado, solo la
  condición que la rompía.

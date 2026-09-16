---
type: task-spec
id: TASK-009
status: verified
---

# Task: lo que se imprimía encima del informe era la propia aplicación

## Petición, alcance y comportamiento actual

Miguel, después de TASK-008: **«no, sigue igual»**. Tenía razón, y TASK-008 se
cerró con un diagnóstico que no era el del síntoma.

Esta vez se generó el PDF de verdad —Chrome headless, `--print-to-pdf`, con su
plan— en vez de razonar sobre el CSS. En la página 2 del PDF **anterior** al
arreglo se lee, dibujado encima del informe:

> ✓ Installed base · 412 records loaded · ✓ Service Reclass · 260 bundled
> contracts · **Continue to the plan →** · J&J **BP Builder** · CYCLE · BP —
> Business Plan · CURRENCY USD · **Save plan**

Es la **pantalla de inicio y la barra de la aplicación**. No una sección del
informe desbordada.

**Causa.** `#rptOvl` es `position:fixed` y en pantalla tapa la aplicación. En
`@media print` pasa a `position:static` —correcto, si no, solo se imprimiría lo
que cabe en una pantalla— y entonces **fluye junto al resto del documento**:
`#setup` y `#app` siguen ahí y se imprimen también.

**Segunda causa, encontrada en el mismo PDF.** El pie de página del informe se
dibujaba **arriba**, encima del título de sección:

```css
.prfoot{position:fixed; bottom:-14mm}
```

El `-14mm` pretendía meterlo en el margen inferior. Medido en las doce páginas:
`y = 61 pt` de 792 — arriba del todo, a 6 pt del rótulo «SECTION 1». Con
`bottom:0` cae en `y = 717`, que es donde tiene que estar.

## Resultado deseado y aceptación

- **TASK-009/REQ-001:** Con el informe abierto, se imprime **solo** el informe.
- **TASK-009/REQ-002:** El pie se imprime abajo.
- **TASK-009/REQ-003:** Imprimir sin el informe abierto no cambia.

- **TASK-009/AC-001:** En el PDF no aparece ni una palabra del armazón.
- **TASK-009/AC-002:** El pie está en el tercio inferior de la página.
- **TASK-009/AC-003:** Las páginas se ven limpias.

## Evidencia de verificación

| Requisito | Aceptación | Verificación | Resultado real | Evidencia |
|---|---|---|---|---|
| REQ-001 | AC-001 | Buscar marcas del armazón en el PDF | **pass** — ninguna | EV-001 |
| REQ-002 | AC-002 | Posición del pie en cada página | **pass** — y=717 de 792 | EV-002 |
| REQ-003 | AC-003 | Mirar las páginas renderizadas | **pass** | EV-003 |

- **EV-001:** Buscando «Continue to the plan», «BP Builder», «Save plan» y
  «records loaded» en las doce páginas: **antes** las cuatro en la página 2;
  **después**, ninguna.
- **EV-002:** «Technical Field Service» (el pie) en las doce páginas: antes
  `y=55/61`, después `y=717`. Página de 792 pt.
- **EV-003:** Páginas 2 y 5 renderizadas a imagen y miradas: resumen ejecutivo
  con su hero y sus tarjetas, anexos con sus tablas, pie abajo. Nada montado.

## Un falso positivo mío, dicho para que no confunda

Mi detector de solapes marcó 16 en el PDF nuevo, todos en cabeceras de tabla.
Al renderizar esas páginas **no hay nada montado**: una celda de cabecera a dos
líneas produce cajas de texto cuyos rectángulos se rozan en la capa PDF sin que
se solape un solo píxel. El detector es demasiado burdo para tablas; la imagen
manda.

## Qué pasa con TASK-008

Lo que hizo sigue siendo correcto —una sección de 2.411 px no puede pedir no
partirse, y una tabla larga debe repetir cabecera— pero **no era la causa de lo
que Miguel veía**, y se cerró afirmando que sí. El error de método: verifiqué
una invariante del CSS en vez de generar el PDF. Cuando lo generé, la causa
apareció en la primera página que miré.

## Revisión final

- **Cobertura documental:** PASS
- **Spec → Code:** ALIGNED
- **Code → Spec:** ALIGNED — esta vez contra el artefacto, no contra el CSS.

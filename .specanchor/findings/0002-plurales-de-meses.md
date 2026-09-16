# Hallazgo 0002 · «1 months» en tres registros más

**Encontrado:** 16 de septiembre de 2026, al arreglar el registro de riesgos
(TASK-004) · **Estado:** abierto · fuera de alcance
**Gravedad:** baja — cosmética, pero se ve en pantallas que se enseñan

## Qué pasa

El registro de riesgos decía «**1 months** in 2026» cuando el evento cae en el
último mes del año. Arreglado en TASK-004, porque era la línea que se estaba
tocando.

El mismo patrón se repite en tres sitios más, y **no se han tocado** para no
ensanchar un cambio revisable:

| Línea | Pantalla | Texto |
|---|---|---|
| 4777 | Oportunidades · resumen del formulario | `<b>${m}</b> eligible months in ${S.cy.year}` |
| 4848 | Oportunidades · fila del registro | `<b>${m}</b> eligible months in ${S.cy.year}` |
| 4928 | T&M · resumen del formulario | `<b>${m}</b> of 12 months in ${S.cy.year}` |
| 5074 | T&M · fila del registro | `<b>${m}</b> months in ${S.cy.year}` |

El arreglo es el mismo en los cuatro: `month${m===1?'':'s'}`.

## Por qué no se hizo aquí

TASK-004 iba de dos defectos concretos del registro de riesgos. Meter cuatro
cambios de texto en otras dos pantallas habría hecho el diff más difícil de
revisar por un beneficio que no corre prisa. Es candidato a tarea ligera.

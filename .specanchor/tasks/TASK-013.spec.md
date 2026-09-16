---
type: task-spec
id: TASK-013
status: verified
---

# Task: «1 months» en Oportunidades y T&M

## Petición, alcance y comportamiento actual

Cierra `findings/0002`, abierto en TASK-004 al arreglar la misma frase en el
registro de riesgos: se tocó la línea que estaba delante y se dejaron anotadas
las otras para no ensanchar aquel diff.

Cuatro sitios, dos pantallas:

| Dónde | Texto |
|---|---|
| Oportunidades · resumen del formulario | `<b>${m}</b> eligible months in ${S.cy.year}` |
| Oportunidades · fila del registro | ídem |
| T&M · resumen del formulario | `<b>${m}</b> of 12 months in ${S.cy.year}` |
| T&M · fila del registro | `<b>${m}</b> months in ${S.cy.year}` |

Con `m = 1` salen «1 eligible months» y «1 months». **El tercero no está mal**:
«1 of 12 months» se lee bien en inglés y no se toca — cambiarlo por «1 of 12
month» lo estropearía.

Cambio localizado, sin API, datos, permisos ni arquitectura: **tarea ligera**.

## Resultado deseado y aceptación

- **TASK-013/REQ-001:** Con un mes, singular; con más, plural.
- **TASK-013/REQ-002:** «of 12 months» se queda como está.
- **TASK-013/REQ-003:** No cambia ninguna cifra.

- **TASK-013/AC-001:** Los tres textos dicen «1 month» con `m=1` y «N months»
  con `m>1`.
- **TASK-013/AC-002:** No queda ningún `${m}</b> months` ni
  `${m}</b> eligible months` sin condicional.
- **TASK-013/AC-003:** El diff toca solo texto.

## Anclajes afectados

`business_plan_tool.html` → `modules/bp-builder.spec.md`. **Ningún contrato
cambia**: es la redacción de tres avisos.

## Evidencia de verificación

| Requisito | Aceptación | Verificación | Resultado real | Evidencia |
|---|---|---|---|---|
| REQ-001 | AC-001 | Los tres textos con m=1 y m=9 | **pass** | EV-001 |
| REQ-002 | AC-002 | Buscar el patrón sin condicional | **pass** — ninguno | EV-002 |
| REQ-003 | AC-003 | Revisar el diff | **pass** — 3 líneas | EV-003 |

- **EV-001:** Con el plan real cargado en ciclo 2027:

  | Sitio | Un mes | Nueve meses |
  |---|---|---|
  | Formulario de oportunidad | «1 eligible **month** in 2027» | «9 eligible **months** in 2027» |
  | Fila del registro de oportunidades | «1 eligible **month**» | «9 eligible **months**» |
  | Fila del registro de T&M | «1 **month** in 2027» | «9 **months** in 2027» |

  Y el cuarto, el resumen de T&M, sigue diciendo «1 of 12 months in 2027», que
  es correcto y por eso no se tocó.
- **EV-002:** `grep` de `${m}</b> months in` y `${m}</b> eligible months in`:
  sin resultados.
- **EV-003:** `git diff --stat`: **3 inserciones, 3 borrados**, un archivo.

## Revisión final

- **Cobertura documental:** PASS
- **Spec → Code:** ALIGNED
- **Code → Spec:** ALIGNED — ningún contrato cambia; es la redacción de tres
  avisos.

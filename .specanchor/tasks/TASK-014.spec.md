---
type: task-spec
id: TASK-014
status: verified
---

# Task: el hueco en blanco de la portada

## Petición, alcance y comportamiento actual

Miguel: «en la primera hoja del reporte pdf se ve un hueco muy grande en blanco».

La portada es una banda oscura de unos 260 px que ocupa **el tercio superior** de
la hoja, y `page-break-after:always` deja los dos tercios restantes en blanco. No
es un fallo de paginación: es una portada que no llena su página, y por eso
parece un error de maquetación.

Cambio localizado de presentación, sin datos, permisos ni arquitectura: tarea
ligera.

## Aceptación

- **TASK-014/AC-001:** La portada llena la hoja.
- **TASK-014/AC-002:** El título arriba, la ficha abajo — no los cinco bloques
  desperdigados.
- **TASK-014/AC-003:** No aparece una hoja de más, **ni en A4 ni en Letter**.
- **TASK-014/AC-004:** La página 2 sigue empezando por la sección 1.

## Evidencia de verificación

| Aceptación | Verificación | Resultado real |
|---|---|---|
| AC-001 | Medir hasta dónde llega el bloque oscuro | **pass** — 93 % de la hoja |
| AC-002 | Mirar la portada renderizada | **pass** |
| AC-003 | Generar el PDF en Letter y en A4 | **pass** — 9 páginas en las dos |
| AC-004 | Primer texto de la página 2 | **pass** — «SECTION 1 · Executive summary» |

- **EV-001:** Letter (792 pt): la portada llega a y=733, el 93 %; el resto es el
  margen inferior donde va el pie. A4 (842 pt): y=783, el mismo 93 %.
- **EV-002:** Portada renderizada a imagen y mirada: logotipo, epígrafe, título y
  subtítulo arriba; la ficha de ocho campos abajo, sobre el degradado.

## Dos cosas que costaron una vuelta

**La altura no puede ir en milímetros.** El primer intento puso `min-height:255mm`
calculado sobre A4 — y Chrome imprime en **Letter** por defecto, que es 18 mm más
corta. Una medida fija deja blanco en un papel o empuja a una segunda hoja en el
otro. Va en `vh`, que se resuelve contra la página real.

**`justify-content:space-between` desperdigaba la portada.** Reparte los cinco
hijos por igual, así que quedaban huecos entre el logotipo, el título y el
subtítulo. Lo que hace falta es empujar abajo **solo la ficha**: `margin-top:auto`
sobre ella.

## Revisión final

- **Cobertura documental:** PASS
- **Spec → Code:** ALIGNED
- **Code → Spec:** ALIGNED — presentación; ninguna cifra cambia.

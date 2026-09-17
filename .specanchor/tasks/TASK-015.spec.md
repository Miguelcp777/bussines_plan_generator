---
type: task-spec
id: TASK-015
status: verified
---

# Task: los filtros, todos marcados por defecto, con «Select all»

## Petición, alcance y comportamiento actual

Miguel: «quiero que todos los filtros estén seleccionados por defecto y tengan un
"select all" que al seleccionarlo seleccione todos o ninguno».

**Hoy** el carril nace con **todo desmarcado**, y un grupo vacío significa «sin
restricción». Funciona, pero se lee al revés: parece que no hay nada
seleccionado cuando en realidad se está viendo todo, y para quitar un país hay
que marcar los otros dieciocho.

## El detalle que hace esto más que un cambio de casillas

`S.filt[k].size > 0` es hoy, en nueve sitios, la forma de preguntar «¿hay filtro
puesto?». Con todo marcado por defecto **ese tamaño siempre es mayor que cero**,
así que sin tocar nada más:

- la cabecera del informe listaría los diecinueve países en vez del alcance,
  deshaciendo TASK-011;
- el nombre del archivo guardado saldría con la lista entera;
- el panel y el alcance del ASP, lo mismo.

Así que el cambio de verdad es otro: **un grupo con todo marcado no restringe
nada**, y eso hay que decirlo en un solo sitio y usarlo en los nueve.

## Resultado deseado y aceptación

- **TASK-015/REQ-001:** El carril nace con todos los valores marcados.
- **TASK-015/REQ-002:** Cada grupo tiene un «Select all» que marca todos o
  ninguno, y que refleja el estado intermedio cuando hay parte marcada.
- **TASK-015/REQ-003:** Un grupo con **todo** marcado equivale a uno vacío: no
  restringe y no se nombra como filtro en ninguna pantalla.
- **TASK-015/REQ-004:** «Clear all filters» devuelve al estado neutro, que ahora
  es *todo marcado*.
- **TASK-015/REQ-005:** Ninguna cifra cambia al abrir la herramienta.

- **TASK-015/AC-001:** Al cargar, las casillas están marcadas y los registros en
  alcance son todos.
- **TASK-015/AC-002:** Desmarcar «Select all» de un grupo deja **cero**
  registros; volver a marcarlo los devuelve.
- **TASK-015/AC-003:** Con todo marcado, la cabecera del informe dice el alcance
  —no la lista de países— y el nombre del archivo tampoco la lleva.
- **TASK-015/AC-004:** Desmarcando un país, esa pantalla sí lo nombra.
- **TASK-015/AC-005:** El maestro queda en estado intermedio con parte marcada.
- **TASK-015/AC-006:** La línea base con todo marcado es la misma que antes del
  cambio.

## Anclajes afectados

`business_plan_tool.html` → `modules/bp-builder.spec.md` (C-FILT-001).

## Evidencia de verificación

| Requisito | Aceptación | Verificación | Resultado real | Evidencia |
|---|---|---|---|---|
| REQ-001 | AC-001 | Estado del carril al cargar | **pass** | EV-001 |
| REQ-002 | AC-002 | Maestro: todos y ninguno | **pass** | EV-002 |
| REQ-002 | AC-005 | Estado intermedio | **pass** | EV-003 |
| REQ-003 | AC-003/004 | Cabecera del informe | **pass** | EV-004 |
| REQ-004 | — | «Clear all filters» | **pass** | EV-005 |
| REQ-005 | AC-006 | Línea base | **pass** | EV-001 |

Con su plan (412 registros, ciclo 2027):

- **EV-001:** Al cargar, **58 casillas y las 58 marcadas**, 6 maestros, 412
  registros en alcance y línea base **$2.999.552** — la misma de siempre.
- **EV-002:** Desmarcando el maestro de países: **0 registros**. Volviéndolo a
  marcar: 412 y $2.999.552 otra vez.
- **EV-003:** Quitando solo ES: 95 registros, maestro en **indeterminado** y el
  contador en **«2/3»**.
- **EV-004:** Con todo marcado, la portada del informe dice el alcance —«AD, ES,
  PT»— y no la lista de filtros. Quitando ES, dice «PT, AD».
- **EV-005:** «Clear all filters» deja las 58 marcadas, 412 registros y el
  maestro sin estado intermedio.

## Un fallo mío, encontrado al verificar

La primera versión dejaba **412 registros con cero países marcados**. `scoped()`
seguía con la regla vieja —`if (f.country.size && …)`, o sea «conjunto vacío =
sin filtro»—, que con las casillas marcadas por defecto significa lo contrario
de lo que se ve: desmarcarlo todo tiene que no dejar pasar nada.

Ahora un grupo vacío excluye, con una excepción: antes de construir el carril
—cuando `S._filtVals` todavía no tiene ese grupo— vacío sigue siendo «aún no hay
filtros», o la aplicación arrancaría sin un solo registro.

## Revisión final

- **Cobertura documental:** PASS
- **Spec → Code:** ALIGNED — C-FILT-001 y 002 describen lo implementado.
- **Code → Spec:** ALIGNED — el motor no se toca; la línea base con todo marcado
  es idéntica.

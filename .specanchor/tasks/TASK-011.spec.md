---
type: task-spec
id: TASK-011
status: verified
---

# Task: la oportunidad bundle contada como directa, el alcance que dice «All regions», y banderas

## Petición

Miguel, tres cosas:

1. «He editado las oportunidades y he añadido el coverage type y direct o bundle,
   pero el reporte en la sección 2 no reconoce el revenue de las oportunidades en
   bundle, las mete todas como directo.»
2. «En la cabecera del reporte en scope pone siempre All regions, debe poner el
   país o países según los filtros seleccionados.»
3. «Añade banderas de los países tanto en el reporte como en el dashboard y demás
   páginas, así es más fácil de identificar los países seleccionados.»

## 1 · La oportunidad bundle contada como directa

**Causa.** `forecastSplit` reparte cada entrada del registro con `shareOf(ev)`,
que mira el equipo al que apunta la entrada. Cuando la oportunidad **no apunta a
ningún equipo** —que es el caso de casi toda venta nueva— devuelve
`{ d:1, b:0 }`: **todo a directo**.

TASK-010 añadió una corriente declarada a la oportunidad, pero la sección 2
seguía infiriendo en vez de leerla.

**Arreglo.** Una corriente declarada manda sobre cualquier inferencia: la declaró
una persona. Solo se infiere cuando la entrada no la lleva —las guardadas antes—.

## 2 · «All regions» sobre 412 equipos de Iberia

**Causa.** La cabecera leía solo `S.filt`. Con un manager dentro, el recorte lo
hace `buildRecords` y `S.filt` está **vacío**, así que no había filtros que
nombrar y caía en «All regions».

**Arreglo.** El alcance se lee de los registros que se están informando. Los
filtros siguen mandando cuando los hay, porque nombran la intención mejor que una
lista de países.

## 3 · Banderas

**Lo primero, medido:** las banderas emoji **no se dibujan en Windows**. Pintadas
en un canvas dan **1 color** —las dos letras en una caja— frente a los 130 de un
emoji normal. Ponerlas habría dejado cuadraditos.

Se usan SVG reales de `flag-icons` desde cdnjs, el mismo CDN de las otras tres
dependencias, con versión fija. Comprobado antes de escribir nada: CSS y SVG
responden 200.

**Y si el CDN está bloqueado**, que es un escenario real en una red corporativa:
se detecta al arrancar y no se enseña un hueco — se queda el código de país, que
es lo que había.

## Aceptación

- **TASK-011/AC-001:** Una oportunidad marcada bundle aparece en la columna
  Bundle de la sección 2, no en Direct.
- **TASK-011/AC-002:** Una marcada direct sigue en Direct, y una guardada antes
  —sin corriente— se reparte como antes.
- **TASK-011/AC-003:** Con el alcance de Iberia y sin filtros, la cabecera del
  informe nombra los países, no «All regions».
- **TASK-011/AC-004:** Con un filtro de país puesto, manda el filtro.
- **TASK-011/AC-005:** Las banderas salen en el carril de filtros, el panel, la
  tabla de equipos y el informe.
- **TASK-011/AC-006:** Sin CDN, no queda ningún hueco: se ve el código.
- **TASK-011/AC-007:** Las banderas se imprimen.

## Evidencia de verificación

| Aceptación | Verificación | Resultado real | Evidencia |
|---|---|---|---|
| AC-001/002 | `forecastSplit` con las tres clases | **pass** | EV-001 |
| AC-003/004 | Cabecera con y sin filtro | **pass** | EV-002 |
| AC-005 | Banderas en pantalla | **pass** | EV-003 |
| AC-006 | Sin CDN | **pass por construcción** | EV-004 |
| AC-007 | Banderas en el PDF | **FAIL** — resuelto en TASK-012 | EV-005 |

- **EV-001:** Tres oportunidades —una `bundle`, una `direct`, una guardada antes
  sin corriente—: `dO = $50.000` (los $40.000 declarados directos más los
  $10.000 de la vieja) y **`bO = $20.000`**. Antes del arreglo, los $20.000
  caían en directo.
- **EV-002:** Con el alcance de Iberia y sin filtros, la portada del informe
  dice **«AD, ES, PT · 412 records»** en vez de «All regions» — y lo repite el
  pie de las nueve páginas del PDF. Con el filtro `ES` puesto: **«ES · 317»**.
- **EV-003:** 63 imágenes de bandera en la pantalla de equipos, **45 cargadas**
  (el resto, diferidas fuera de la vista). Una imagen suelta del CDN carga a
  200×150. En el carril de filtros, la sección Country trae las tres con su
  recuento.
- **EV-004:** El `alt` lleva el código de país, así que un CDN bloqueado deja
  «ES» donde iría la bandera. No hay hueco vacío posible; no hace falta
  detectar nada.
- **EV-005:** En el PDF generado, las secciones con columna de país —*Systems at
  risk*, *Opportunities*— existen y tienen **cero imágenes**. Quitar
  `loading="lazy"` no lo cambió.

## Lo que no funciona, y lo que eso cuesta

**Las banderas no salen en el PDF de mi prueba.** La causa probable es que en
headless las imágenes de un subárbol que estaba `display:none` hasta el momento
de imprimir no llegan a cargarse; en un navegador donde el informe se ha visto en
pantalla antes de imprimir puede que sí salgan. **No lo sé, y no lo voy a
afirmar.**

Lo que sí es cierto es el coste si no salen: el código de país sigue ahí, que es
exactamente lo que había antes. No se pierde nada, no se rompe nada.

## Revisión final

- **Cobertura documental:** PASS
- **Spec → Code:** ALIGNED
- **Code → Spec:** **PARTIAL** — AC-007 falla y queda abierto.

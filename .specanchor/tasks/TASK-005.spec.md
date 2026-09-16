---
type: task-spec
id: TASK-005
status: verified
---

# Task: el mismo libro no debería parsearse dos veces

## Petición, alcance y comportamiento actual

Miguel, después de TASK-003: «todavía le cuesta cargar el archivo de reclass».
Es cierto: aquello bajó de ~40 s a ~23,5 s, y 23 segundos de pestaña congelada
siguen siendo inaceptables.

**El dato que cambia lo que se puede hacer:** en su captura la barra del
navegador dice `Downloads/business_plan_tool.html`. Está trabajando sobre
`file://`, y ahí Chrome **no permite crear workers** —ni desde un blob—, así que
sacar el parseo del hilo principal no es una opción para él. Mientras el archivo
se abra por doble clic, ese `.xlsb` va a congelar la pestaña ~23 s **la primera
vez que se lee**.

Lo que sí se puede quitar es todas las veces siguientes.

**Hoy:** cada vez que se suelta el archivo se vuelve a parsear entero, aunque
sea byte a byte el mismo que hace cinco minutos. El Reclass cambia una vez por
trimestre; se carga muchas más veces que eso.

Existe ya un camino que lo evita —`saveSource()` guarda `S.reclass` en IndexedDB
y *Restore* lo devuelve sin parsear— pero solo funciona si se usa *Restore* en
vez de volver a soltar el archivo, y nada lo dice.

## Resultado deseado y aceptación

- **TASK-005/REQ-001:** Soltar un libro ya leído no lo vuelve a parsear.
- **TASK-005/REQ-002:** La identidad del archivo se decide por nombre, tamaño y
  fecha de modificación. Un archivo distinto —o el mismo reexportado— se parsea.
- **TASK-005/REQ-003:** Solo se guarda lo que costó caro. No tiene sentido
  cachear un libro de 400 ms.
- **TASK-005/REQ-004:** La pantalla dice cuándo ha usado la copia, para que
  nadie se pregunte si está mirando datos viejos.
- **TASK-005/REQ-005:** No cambia ni una cifra.

- **TASK-005/AC-001:** Soltar el mismo `.xlsb` por segunda vez tarda **menos de
  un segundo**, contra ~23 s la primera.
- **TASK-005/AC-002:** Las cifras de la segunda carga son idénticas a las de la
  primera: 742 filas bundle, $5.290.140, 720 emparejadas, 22 a cero.
- **TASK-005/AC-003:** Cambiar el archivo —otro tamaño o fecha— vuelve a
  parsear.
- **TASK-005/AC-004:** La installed base (~400 ms) **no** se cachea.
- **TASK-005/AC-005:** Sin IndexedDB, todo sigue funcionando como hoy.

## Anclajes afectados

`business_plan_tool.html` → `modules/bp-builder.spec.md` (sección de
rendimiento, C-PERF-004).

## Lo que NO se hace, y por qué

- **Worker:** imposible en `file://`, que es donde vive hoy. Si algún día se
  sirve por https, es la solución buena y merece su tarea.
- **Generar el `.csv` desde la app** para que la próxima carga sea de 26 ms: la
  idea es buena, pero el lector de CSV abre como **ISO-8859-1** y un CSV
  generado en UTF-8 saldría con los acentos rotos. Eso es un defecto propio y
  va a `findings/0003`, no de tapadillo dentro de esta tarea.

## Evidencia de verificación

| Requisito | Aceptación | Verificación | Resultado real | Evidencia |
|---|---|---|---|---|
| REQ-001 | AC-001 | Cronometrar dos cargas del mismo archivo | **pass** — ~39 s → **29 ms** | EV-001 |
| REQ-005 | AC-002 | Comparar cifras de las dos | **pass** — idénticas | EV-002 |
| REQ-002 | AC-003 | Cambiar la fecha del archivo | **pass** — vuelve a parsear | EV-003 |
| REQ-003 | AC-004 | Claves guardadas en IndexedDB | **pass** — no hay copia de la base instalada | EV-004 |
| REQ-004 | AC-005 | Sin IndexedDB | **pass** — un solo parseo, carga normal | EV-005 |

- **EV-001:** Primera carga del `.xlsb` real **39.111 ms**; segunda del mismo
  archivo, **29 ms**, medidos hasta la entrada de `ingestReclass`.
- **EV-002:** Las dos dan 742 filas bundle, $5.290.140, 720 emparejadas y 22 a
  cero.
- **EV-003:** Con `lastModified` distinto toma el camino de parseo; con el mismo,
  el de la copia. Comprobado interceptando las dos ramas.
- **EV-004:** Claves en IndexedDB tras cargar los dos archivos: `raw` y
  `rc|rc.xlsb|5650667|1757111111111`. Ninguna `ib|`.
- **EV-005:** Con `idbOpen` rechazando: **1** parseo, `S.reclass` cargado.

## Dos fallos míos, encontrados al verificar

**1 · Un `.catch()` que reparseaba.** La primera versión ponía un `.catch()`
detrás del `.then()` por si no había IndexedDB. Sobra —`idbGet` se traga sus
errores y resuelve `null`— y hacía daño: cuando el que fallaba era el parseo, el
`.catch()` lo intentaba otra vez, leyendo dos veces un archivo que ya había
fallado. Quitado.

**2 · `trasPintar` dependía de que alguien estuviera mirando.** Esperaba dos
`requestAnimationFrame`, y en una pestaña en segundo plano esos no se disparan:
la carga se quedaba colgada hasta volver a la pestaña. Se vio porque mi propia
prueba daba cero parseos con la pestaña oculta. Ahora compite con un temporizador
de 250 ms: si la pestaña está delante gana el fotograma y el aviso se pinta
igual; si no, la carga sigue su camino.

El segundo venía de TASK-003 y afectaba a cualquiera que cambiara de pestaña
mientras carga.

## Lo que sigue sin resolverse

**La primera lectura de un archivo nuevo sigue congelando la pestaña ~23 s** en
`file://`. Esto no lo toca: lo que quita son la segunda y todas las siguientes.

## Revisión final

- **Cobertura documental:** PASS
- **Spec → Code:** ALIGNED — C-PERF-004 y 005 describen lo implementado y medido.
- **Code → Spec:** ALIGNED — las cifras del plan no cambian.

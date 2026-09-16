---
type: task-spec
id: TASK-003
status: verified
---

# Task: el Service Reclass tarda 40 segundos y congela la pantalla

## Petición, alcance y comportamiento actual

Miguel: «cuando subo el archivo de reclass tarda mucho tiempo en cargarlo», con
Chrome enseñando **«La página no responde · Esperar / Salir de la página»**.

**Medido** en el navegador, sobre sus archivos reales, revisión `c593c90`:

| Archivo | Formato | Tamaño | Hojas | Lectura |
|---|---|---|---|---|
| Installbase report July 2026 | `.xls` | 7,2 MB | 3 | **387 ms** |
| Service Reclass Q3 2026 | `.xlsb` | 5,6 MB | **24** | **~40.000 ms** |
| …leyendo solo la hoja `DB` | `.xlsb` | " | " | **~21.000 ms** |
| La hoja `DB` guardada como `.csv` | `.csv` | 1,6 MB | 1 | **26 ms** |

No es el tamaño: la installed base es **más grande** y tarda cien veces menos.
Es que el `.xlsb` trae 24 hojas —entre ellas `Cognos_Office_Connection_Cache`,
`data`, `Q2 2024 DB`— y `XLSX.read()` las parsea **todas** para quedarse con
una. Convertir la hoja `DB` a matriz son 61 ms; el resto es trabajo tirado.

Y lo hace en el **hilo principal**, así que la pestaña se queda muerta y Chrome
ofrece cerrarla. La app además no cede el hilo antes de empezar, así que el
aviso «Reading…» puede no llegar a pintarse.

Cinco variantes medidas seguidas, en la misma máquina:

| Variante | Lectura |
|---|---|
| actual: todo + `cellDates` | 39.578 ms |
| sin `cellDates` | 40.923 ms |
| **solo hoja `DB`** | **21.198 ms** |
| solo `DB`, sin `cellDates` | 21.264 ms |
| solo `DB`, denso | 22.185 ms |

`cellDates` no cuesta nada. `dense` no mejora la lectura (sí el paso a matriz:
89 → 9 ms, irrelevante aquí).

## Resultado deseado y aceptación

- **TASK-003/REQ-001:** Leer solo la hoja que se va a usar, en los dos
  cargadores.
- **TASK-003/REQ-002:** La pantalla dice **antes** de bloquearse qué va a pasar
  y cuánto puede tardar, y el aviso llega a pintarse.
- **TASK-003/REQ-003:** La pantalla ofrece la salida que de verdad resuelve el
  problema —guardar la hoja `DB` como `.csv`— con el número medido al lado.
- **TASK-003/REQ-004:** No cambia ni un dato del resultado.

- **TASK-003/AC-001:** Con el `.xlsb` real, la lectura baja de ~40 s a ~21 s.
- **TASK-003/AC-002:** El aviso es visible en el DOM **antes** de que empiece el
  parseo.
- **TASK-003/AC-003:** Tras cargar, las cifras son **idénticas** a las de antes:
  742 filas bundle, $5.290.140, 720 emparejadas, 22 a cero, 0 duplicadas; y la
  installed base, 3.073 registros.
- **TASK-003/AC-004:** El `.csv` y el `.xls` siguen cargando.

## Anclajes afectados y razón del impacto

`business_plan_tool.html` → `modules/bp-builder.spec.md`. Cambio de rendimiento
y de texto en pantalla; **no cambia ningún contrato**: ni el formato de entrada,
ni el mapeo de columnas, ni las cifras. `global/arquitectura.spec.md` gana una
incertidumbre resuelta (el coste real de leer un libro con muchas hojas).

## Lo que NO se hace, y por qué

- **Un Web Worker**, que es lo único que quitaría la congelación de verdad: en
  `file://` —que es como se abre hoy— Chrome no deja crear workers, así que
  haría falta el camino de siempre igual como respaldo. Complejidad doble para
  un caso que el `.csv` resuelve en 26 ms. Si algún día la herramienta se sirve
  por https, merece su propia tarea.
- **Quitar `cellDates`**: medido, no ahorra nada, y la installed base sí
  necesita fechas.

## Evidencia de verificación

| Requisito | Aceptación | Verificación | Resultado real | Evidencia |
|---|---|---|---|---|
| REQ-001 | AC-001 | Cronometrar la lectura del `.xlsb` real | **pass** — ~40 s → **23,5 s** | EV-001, EV-002 |
| REQ-002 | AC-002 | Contar fotogramas entre el lanzamiento y el inicio del parseo | **pass** — aviso en el DOM y **5 fotogramas** de margen | EV-003 |
| REQ-004 | AC-003 | Comparar las cifras con las de antes del cambio | **pass** — las nueve idénticas | EV-004 |
| REQ-003 | AC-004 | Cargar `.xls` y `.csv` | **pass**, con un matiz | EV-005 |

- **EV-001:** Cinco variantes cronometradas seguidas en la misma máquina, antes
  del cambio: todo+cellDates 39.578 ms · sin cellDates 40.923 ms · **solo `DB`
  21.198 ms** · solo `DB` sin cellDates 21.264 ms · solo `DB` denso 22.185 ms.
- **EV-002:** Después del cambio, página recién cargada, camino real
  (`loadReclass` con un `File`): **403 ms** hasta el aviso, **23.481 ms** de
  parseo. La diferencia con los 21.198 ms de EV-001 es ruido de máquina; el
  orden de magnitud de la mejora es el mismo.
- **EV-003:** Contador de `requestAnimationFrame`: fotograma 2 al lanzar,
  fotograma 7 al entrar en `leerHoja`. El texto del aviso estaba en el DOM en
  ese momento — comprobado leyéndolo dentro de la propia función.
- **EV-004:** Con los dos archivos reales cargados por el camino real:
  3.073 registros · 410 con directo · hoja `DB` · 742 filas bundle ·
  $5.290.140 · 720 emparejadas · $5.290.140 emparejado · 22 a cero · 0
  duplicadas · 0 sin emparejar · FOC 28 registros y $277.400 · base
  $11.024.782. **Idénticas a las de antes del cambio.**
- **EV-005:** La hoja `DB` como `.csv` carga en ~20 ms y da 742 filas, 720
  emparejadas y 22 a cero. El total sale **$5.290.139**, un dólar menos:
  redondeo al escribir el CSV, no pérdida de filas. Sobre $5,3 M no es
  material, pero queda dicho.

## Hallazgo lateral

Mi primera medición dio 40.713 ms para la lectura dirigida —**más lenta** que
leer el libro entero—, lo que no tenía sentido. Era ruido: la pestaña llevaba ya
varios libros completos parseados y retenidos. Repetido en serie y en limpio, la
lectura dirigida es la mitad. Queda anotado porque una sola medición de algo que
tarda medio minuto no vale como medición.

## Lo que sigue sin resolverse

**La pestaña se sigue congelando ~23 s** con ese `.xlsb`. Esto lo hace más
rápido y deja de parecer una avería; no lo arregla. Lo que lo arregla de verdad
es el `.csv` —26 ms— o un worker, que `file://` no permite.

## Revisión final

- **Cobertura documental:** PASS
- **Spec → Code:** ALIGNED — C-PERF-001 a 003 describen lo implementado y
  medido.
- **Code → Spec:** ALIGNED — el cambio no toca ningún otro contrato: mismos
  formatos de entrada, mismo mapeo de columnas, mismas cifras.

---
type: module-spec
module: bp-builder
status: draft
source_paths:
  - business_plan_tool.html
last_reviewed: 2026-09-15
---

# Módulo: bp-builder

## Responsabilidad

La aplicación entera. Carga la installed base y el Service Reclass, construye
los registros, aplica el alcance del usuario, deja tomar decisiones equipo a
equipo, calcula la previsión y produce informe, Excel, CSV y plan `.json`.

## Propiedad del código

`business_plan_tool.html` — un archivo, 8.420 líneas, un solo bloque `<script>`.

**La granularidad del guard aquí es el archivo.** En una aplicación de un solo
archivo no se puede mapear un módulo por contrato sin que cada cambio exija
tocar todas las specs a la vez —`anchors(p)` devuelve todos los módulos que
casan con la ruta, y un cambio de contrato exige que **todas** hayan cambiado—.
Por eso los contratos viven en `global/` y este módulo es uno. Es una adaptación
deliberada, no un descuido; está en `bootstrap-report.md`.

## Interfaces públicas

Catorce paneles, que son la superficie con la que trabaja una persona:

| Panel | Id | Qué hace |
|---|---|---|
| Executive dashboard | `p-dash` | El resumen del plan |
| Installed base | `p-base` | La tabla de equipos y sus decisiones |
| Risk register | `p-risk` | Riesgos ponderados |
| Opportunities | `p-opp` | Oportunidades ponderadas |
| T&M revenue | `p-tm` | Ingreso manual, no viene de archivo |
| Movements | `p-move` | Cada línea entre actual y esperado |
| Scenarios | `p-scen` | Base, esperado, pesimista, optimista |
| ASP | `p-asp` | Precio medio, por plataforma y cobertura |
| Insights | `p-ins` | Lecturas derivadas |
| Assumptions | `p-assum` | Supuestos declarados |
| Data quality | `p-dq` | Defectos del origen |
| Versions | `p-ver` | Instantáneas congeladas |
| Consolidation | `p-consol` | Solo quien puede consolidar |
| Settings | `p-set` | Los ajustes de método e identidad |

Entradas de usuario: dos archivos (installed base y Service Reclass), un plan
`.json`, y las decisiones sobre cada registro.

Salidas: `.json` (plan y entrega), `.xlsx`, `.csv`, informe imprimible.

## Contratos

No se repiten aquí. Viven en:

| Contrato | Documento |
|---|---|
| Archivo único, dependencias, límites del entorno | `global/arquitectura.spec.md` |
| Método de previsión, ASP, upgrades | `global/producto.spec.md` |
| Quién ve qué, y qué no impide | `global/alcance-y-usuarios.spec.md` |
| Entregar y consolidar | `global/entrega-y-consolidacion.spec.md` |
| Registros, claves, formatos, guardado | `global/datos-y-persistencia.spec.md` |
| Verificación y secretos | `global/calidad-y-seguridad.spec.md` |

## Dependencias

SheetJS 0.18.5, PapaParse 5.4.1, Chart.js 4.4.1, desde cdnjs. Nada más.

## Integraciones externas

Ninguna. No hay API, ni base de datos, ni servicio. Los archivos los aporta la
persona.

## Semántica de errores

- Un archivo ilegible se dice en la pantalla de carga, no en la consola.
- Una librería que no carga se nombra y se propone la salida: CSV en vez de
  Excel.
- Cancelar un diálogo **no es un error** y no se avisa.
- Lo que bloquea una absorción se dice con nombre y apellidos, país por país.

## Seguridad y permisos

Ver `global/calidad-y-seguridad.spec.md`. En una línea: no hay permisos, hay
comodidad de trabajo, y está dicho en pantalla.

## Rendimiento y límites operativos

Todo corre en el hilo principal del navegador: no hay worker —`file://` no los
permite— así que **leer una hoja de cálculo congela la pestaña** mientras dura.

Medido sobre los archivos reales de Iberia, revisión `c593c90` (TASK-003):

| Archivo | Formato | Tamaño | Hojas | Lectura |
|---|---|---|---|---|
| Installbase report July 2026 | `.xls` | 7,2 MB | 3 | **~400 ms** |
| Service Reclass Q3 2026 | `.xlsb` | 5,6 MB | **24** | **~23,5 s** |
| La hoja `DB` como `.csv` | `.csv` | 1,6 MB | 1 | **~26 ms** |

- **C-PERF-001.** Se lee **solo la hoja que se va a usar**. `bookSheets:true`
  da los nombres en ~320 ms y `sheets:<hoja>` evita parsear las demás. Sobre el
  Reclass, eso es ~40 s → ~23,5 s. No es el tamaño lo que cuesta: la installed
  base es mayor y tarda cien veces menos. Son las hojas.
- **C-PERF-002.** Un libro de más de tres hojas avisa **antes** de bloquear, y
  el aviso se pinta de verdad: el parseo espera dos fotogramas (`trasPintar`).
  Verificado — cinco fotogramas entre el lanzamiento y el inicio del parseo.
- **C-PERF-003.** El aviso ofrece la salida que de verdad resuelve el problema:
  guardar esa hoja como `.csv`. Tres órdenes de magnitud, y el formato ya está
  soportado.

## Pruebas / verificación

- `node --check` sobre el `<script>` extraído. · el único control automatizado
- Verificación en navegador contra el DOM real, con datos sintéticos.
- **No hay suite.** Ver `U-CAL-001`.

## Incertidumbres y deuda conocidas

- **D-BPB-001.** Nada de lo cambiado en septiembre de 2026 se ha ejecutado
  contra la installed base real.
- **D-BPB-002.** `showSaveFilePicker` sobre `file://` sin medir.
- **D-BPB-003.** Comportamiento en SharePoint sin medir.
- **D-BPB-004.** La tabla de usuarios está en el código: cambiar de persona
  exige editar y repartir otra vez.
- **D-BPB-005.** Idioma de los comentarios mezclado.
- **D-BPB-006.** Sin CI.

## Notas de alineación

Este anclaje se escribió **después** de los cambios de la sesión del 14-15 de
septiembre de 2026, no antes. Los contratos describen lo que hay, no lo que se
decidió que hubiera. Es deuda reconocida, no un proceso cumplido: ver
`bootstrap-report.md`.

## Historial de cambios

- 2026-09-15 · Anclaje inicial.

## Evidencia de afirmaciones

| Afirmación | Estado | Fuente / revisión | Resultado |
|---|---|---|---|
| Un archivo, 8.420 líneas, un `<script>` | VERIFIED | `wc -l`, extracción · 34966d3 | 520.422 bytes |
| Catorce paneles | VERIFIED | `grep 'id="p-'` · 34966d3 | 14 |
| Sintaxis correcta | VERIFIED | `node --check` · 34966d3 | PASS |
| Sin pruebas ni CI | VERIFIED | `ls` · 34966d3 | sin `package.json` |
| Recorte, absorción y claves | VERIFIED | navegador, datos sintéticos · 34966d3 | ver specs globales |
| Cifras de negocio | NOT_VERIFIED | — | no ejecutado con datos reales |

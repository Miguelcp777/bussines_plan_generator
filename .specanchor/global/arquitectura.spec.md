---
type: global-spec
status: draft
last_reviewed: 2026-09-15
---

# Arquitectura

## Propósito

Fijar qué es esta aplicación y qué no puede llegar a ser sin una decisión
explícita. Todo lo demás —alcance, entrega, persistencia— se apoya en que esto
es **un archivo que se abre**, no un servicio que se despliega.

## Comportamiento actual, con estado de evidencia

**Un solo archivo, sin build.** `business_plan_tool.html` contiene el HTML, el
CSS y todo el JavaScript en **un único bloque `<script>` en línea** de 393.178
bytes. No hay `package.json`, ni empaquetador, ni paso de compilación. Editar
la aplicación es editar ese archivo. · OBSERVED · `business_plan_tool.html` ·
rev 34966d3

**Tres dependencias externas, y solo tres**, cargadas desde cdnjs con versión
fijada: · OBSERVED

| Librería | Versión | Para qué |
|---|---|---|
| SheetJS (`xlsx.full.min.js`) | 0.18.5 | Leer `.xls/.xlsx/.xlsb` |
| PapaParse | 5.4.1 | Leer CSV |
| Chart.js | 4.4.1 | Los gráficos del panel |

Si la red corporativa bloquea cdnjs, la aplicación arranca y lo dice: la carga
de Excel avisa «Spreadsheet reader did not load — save the sheet as CSV and
retry». · OBSERVED · `loadFile()`

**El `.xlsx` que exporta no lo escribe SheetJS.** Hay un escritor ZIP + OOXML
propio (sección `XLSX writer`, ~300 líneas) porque la edición comunitaria de
SheetJS no incrusta imágenes y el libro lleva el logotipo. · OBSERVED ·
`business_plan_tool.html` §XLSX writer

**No hay servidor.** Ni API, ni base de datos, ni sesión. Todo ocurre en el
navegador de quien abre el archivo. · OBSERVED

**El estado vive en el navegador**, en tres sitios con propósitos distintos.
Ver `datos-y-persistencia.spec.md`.

## Comportamiento previsto

Se mantiene el archivo único mientras el reparto sea por correo o por carpeta
compartida. No es una preferencia estética: es lo que hace que la herramienta
funcione sin permisos de TI, y es también lo que impide que el alcance por
usuario sea un control de acceso real (ver `alcance-y-usuarios.spec.md`).

## Restricciones

- **R-ARQ-001.** El archivo debe seguir abriéndose por doble clic, sobre
  `file://`, sin servidor. Cualquier función que exija contexto seguro se
  detecta y degrada; no se da por disponible. · INTENT
- **R-ARQ-002.** Las dependencias de CDN van con **versión exacta**. Una
  referencia `latest` convertiría una actualización ajena en un fallo nuestro
  sin cambio de código. · OBSERVED (ya se cumple)
- **R-ARQ-003.** Nada de secretos en el archivo. Se publica y se reenvía por
  correo; lo que esté dentro es público. · INTENT
- **R-ARQ-004.** El bloque `<script>` debe pasar `node --check` tras cualquier
  edición. Es la única comprobación automatizada que existe hoy.

## Invariantes

- **I-ARQ-001.** Un solo bloque `<script>` en línea. Dos bloques romperían la
  comprobación de sintaxis tal y como está montada hoy, que extrae el primero.
  · OBSERVED
- **I-ARQ-002.** Ningún dato de cliente sale del navegador. No hay telemetría
  ni llamadas de red salvo la descarga de las tres librerías. · OBSERVED

## No objetivos

- No se convierte en aplicación con servidor para «arreglar» el aislamiento
  entre managers. Eso es una decisión de producto con coste propio, tomada y
  registrada en `docs/decisiones/0001-un-archivo-con-tabla-de-usuarios.md`.
- No se añade empaquetador ni framework. El archivo único es el formato de
  entrega.

## Evidencia y fuentes

| Afirmación | Estado | Fuente / revisión |
|---|---|---|
| Un bloque `<script>`, 393.178 bytes | VERIFIED | extracción + `node --check` PASS · 34966d3 |
| Tres dependencias cdnjs con versión fija | VERIFIED | `grep '<script src'` · 34966d3 |
| Sin `package.json` ni pruebas | VERIFIED | `ls` · 34966d3 |
| md5 del archivo | VERIFIED | `cda3a45f56b8eae5e35e1c439d77a6d7` · 34966d3 |

## Incógnitas

- **U-ARQ-001.** No se ha comprobado si la red corporativa de J&J permite
  cdnjs. Si no lo permite, se pierden Excel, CSV y gráficos a la vez.
- **U-ARQ-002.** No se ha comprobado cómo se comporta el archivo servido desde
  SharePoint: si se descarga en vez de renderizarse, la herramienta no abre.

## Historial de cambios

- 2026-09-15 · Anclaje inicial (bootstrap documental, sin refactorizar).

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

## El registro de riesgos, al marcar desde la lista de equipos

- **C-RISK-001.** Marcar *At risk* un equipo **sin ingreso** —ni contrato
  directo ni valor reclasificado— **no crea entrada**. Una fila de $0 expuestos
  y $0 ponderados no es un riesgo, y hay 1.967 equipos así de 3.073: dos de cada
  tres filas de la tabla. La decisión se conserva en el equipo; lo que no se
  crea es la fila vacía.
- **C-RISK-002.** «Expuesto» significa **expuesto en el año del BP**: el valor
  anual recortado a los meses que caen dentro, sin probabilidad. El valor anual
  se enseña aparte y con su nombre. Antes la cabecera decía «Gross exposure
  $57.679» junto a «Weighted $0» de una entrada fechada en 2027, que se
  contradice.
- **C-RISK-003.** El aviso al marcar dice lo que pasa: cuánto sale del año, o
  por qué no sale nada —fecha fuera del año, o equipo sin ingreso—.
- **C-RISK-004.** Lo que **no** se hace: mover la fecha del evento dentro del
  año para que siempre descuente. Sería inventar una pérdida en un año en que el
  contrato sigue vivo. Quien espere que el cliente se vaya antes cambia la fecha
  a mano.

- **C-PERF-004.** Un libro que costó más de 2 s se guarda parseado en
  IndexedDB, con clave **nombre + tamaño + fecha de modificación**. Soltar el
  mismo archivo otra vez no lo reparsea: medido, **39 s → 29 ms**. Un archivo
  distinto o reexportado cambia la clave y se lee de cero, y la pantalla dice
  cuándo ha usado la copia. La base instalada (~400 ms) no se cachea: no
  compensa.
- **C-PERF-005.** El aplazamiento previo al parseo no puede depender solo de
  `requestAnimationFrame`: en una pestaña en segundo plano no se dispara y la
  carga se queda esperando a que alguien mire. Compite con un temporizador.

- **C-RISK-005.** Una entrada automática sigue al equipo **también cuando la
  probabilidad de pérdida baja a cero**. `e.prob = lossProb || e.prob` trataba
  el 0 como «sin valor» y conservaba el anterior: bajar «Renew %» a 0 hacía
  descontar, y devolverlo a 100 —renueva seguro— dejaba la entrada descontando
  igual, sin forma de bajarla desde el equipo. Las entradas editadas a mano
  (`manual`) siguen intactas.
- **C-RISK-006.** *At risk* con «Renew %» a 100 es una contradicción —riesgo
  cero— y se dice en los dos sitios: en la entrada del registro y al teclearlo.
  El campo se llama «Renew %», así que un 100 ahí se lee fácil como «riesgo al
  100», que es justo lo contrario.

- **C-REG-001.** En los tres registros —riesgos, oportunidades y T&M— un **0**
  en importe o probabilidad es un dato, no un campo vacío. `!val` lo trataba
  como ausencia y no dejaba registrar, por ejemplo, un equipo en garantía que
  todavía no vale nada. El 0 se sigue rechazando donde sí es ausencia: mes
  (1-12), año (2000-2100) y texto.
- **C-REG-002.** Un aviso de validación nombra **los campos que faltan**, no la
  lista entera de obligatorios. Y una entrada que aporta $0 se acepta pero se
  dice, distinguiendo las tres razones: importe 0, probabilidad 0, o fecha fuera
  del año. Mandar a corregir el campo que no es cuesta lo mismo que el fallo.

- **C-PRINT-001.** En papel, **solo pide no partirse lo que cabe en una
  página**: tarjetas, gráficos con su título, citas y filas de tabla — medido,
  ninguno pasa de 239 px contra los ~1.017 de una A4 con estos márgenes. Una
  sección entera **no**: cuatro de las trece miden entre 1.026 y 2.411 px, y un
  bloque no partible que no cabe lo desborda el navegador encima de lo que
  sigue. Eso era el solape del informe.
- **C-PRINT-002.** Una tabla que se parte repite cabecera y pie
  (`table-header-group` / `table-footer-group`), y un encabezado de sección no
  se queda solo al final de una página.

- **C-PRINT-003.** Con el informe abierto (`body.rpt-open`), en papel se oculta
  **todo lo demás**: `#setup`, `#app` y los avisos. `#rptOvl` es `fixed` y tapa
  la aplicación en pantalla, pero al imprimir pasa a `static` y fluye con el
  resto del documento — la pantalla de inicio y la barra se imprimían encima del
  informe. **Esa era la causa del solape**, medida generando el PDF, no la
  paginación de las secciones.
- **C-PRINT-004.** El pie de página va con `bottom:0`. Un `bottom` negativo en
  un elemento fijo de medio paginado lo manda **arriba**: medido, `y=61` de 792
  en las doce páginas, encima del rótulo de sección.
- **C-PRINT-005.** Lo de impresión se verifica **generando el PDF y mirándolo**.
  Comprobar reglas de CSS no vale: TASK-008 dio una invariante por buena y el
  síntoma seguía. Un detector de solapes por rectángulos de texto marca falsos
  positivos en las cabeceras de tabla; la imagen renderizada manda.

- **C-OPP-001.** Plataforma y tipo de cobertura de una oportunidad son
  **desplegables poblados desde la installed base cargada**, no texto libre.
  Escribir «Catalys» donde la flota dice `FEMTOLASER` producía un informe con
  una plataforma que no existe en los datos.
- **C-OPP-002.** La **corriente** —Direct o Bundle— se deduce de cómo se paga
  esa misma cobertura en la flota: cuántos equipos con esa cobertura los factura
  el cliente y cuántos vienen del Reclass. Se enseña con el recuento que la
  justifica y **se puede corregir a mano**; lo que se guarda en la entrada es la
  decisión, no la regla, para que un cambio de datos no reescriba un plan.
- **C-OPP-003.** El informe reparte la oportunidad en las dos corrientes, en la
  tabla y en el pie. Una entrada anterior a esto no tiene corriente: cuenta como
  directa y **se marca «assumed»**, en la fila y en el texto.

- **C-OPP-004.** En el reparto por corrientes de la sección 2, la corriente
  **declarada** en una oportunidad manda sobre la inferida del equipo al que
  apunta. `shareOf` devuelve todo a directo cuando la entrada no apunta a
  ninguno —el caso de casi toda venta nueva—, y así una oportunidad de bundle se
  contaba como directa.
- **C-UI-001.** El alcance que se enseña —informe y panel— se lee de los
  **registros que se están informando**, no solo de `S.filt`: con un manager
  dentro el recorte lo hace `buildRecords` y los filtros están vacíos, así que
  se leía «All regions» sobre 412 equipos de Iberia.
- **C-UI-002.** Las banderas van como **SVG del CDN en un `<img>`**, no como
  emoji: en Windows una bandera emoji se dibuja como dos letras en una caja
  —medido, un solo color contra los 130 de un emoji—. Tampoco se carga la hoja
  de `flag-icons`: su clase `.fi` es la misma que la de las casillas del carril
  de filtros. El `alt` lleva el código de país, así que un CDN bloqueado deja el
  código a la vista.
- **C-UI-003.** Las banderas van **dentro del archivo**, rasterizadas a PNG de
  48×36 (57 KB las 87 de EMEA). Pedidas a un CDN no se imprimían —cero imágenes
  en el PDF— y este archivo viaja por correo y se abre desde el disco: una
  dependencia de red para un icono es una dependencia que un día no está. Los
  SVG oficiales suman 653 KB y ese peso son escudos que a 18 píxeles no se ven;
  la mediana del resto son 302 bytes. Se rasterizan con un motor de PDF, **no se
  dibujan a mano**: un color inventado en la bandera de un país se nota.
- **C-UI-004.** La identidad es el monograma de J&J en `#EB1700`, y vive en dos
  sitios con dos formas distintas porque los dos consumidores lo son: en la
  **pestaña**, SVG en línea sobre transparente —se lee igual en claro y en
  oscuro—; en el **Explorador**, `business_plan_tool.ico` sobre teja roja, que a
  16 px es lo único que se distingue contra el blanco. Ninguno de los dos se
  pide a la red, por C-UI-003.
  Lo que ese `.ico` **no** puede hacer es cambiar el icono del `.html`: Windows
  se lo pone por **tipo de archivo**, desde la asociación del registro, y hoy
  esa asociación es Chrome. Un documento no lleva icono propio. Quien quiera ver
  la marca al abrir la carpeta necesita un acceso directo, que es otro objeto;
  quien la abra desde SharePoint verá Chrome y no hay nada que hacer.

- **C-PRINT-006.** La portada llena su hoja: título arriba y ficha abajo
  (`margin-top:auto` sobre la ficha, no `space-between`, que desperdiga los cinco
  bloques). Su altura va en **`vh`, nunca en milímetros**: el tamaño de papel lo
  elige quien imprime —A4 aquí, Letter por defecto en Chrome, 18 mm menos— y una
  medida fija deja blanco en uno o empuja a una segunda hoja en el otro.
  Verificado en los dos papeles: 9 páginas y portada al 93 %.

- **C-FILT-001.** El carril nace con **todos los valores marcados**, y cada
  grupo tiene un «Select all» con tres estados: todo, nada y a medias. Antes
  nacía vacío, que significaba lo mismo —sin restricción— pero se lee al revés.
- **C-FILT-002.** Un grupo con **todo** marcado no restringe y **no se nombra**
  como filtro en ninguna pantalla; uno **vacío** no deja pasar nada. La pregunta
  «¿hay filtro puesto?» se hace en un solo sitio —`filtActivo(k)`: hay algo y no
  está todo— porque `S.filt[k].size > 0` la respondía en nueve, y con todo
  marcado siempre daría que sí: la cabecera del informe habría listado los
  diecinueve países y el nombre del archivo también.

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

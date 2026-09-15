# Mapa del código

## Entorno y stack

HTML + CSS + JavaScript en **un solo archivo**, sin build ni empaquetador. Se
abre en un navegador. Sin servidor, sin base de datos, sin API.

Tres dependencias, desde cdnjs con versión fija: SheetJS 0.18.5, PapaParse
5.4.1, Chart.js 4.4.1.

## Puntos de entrada

| Entrada | Qué ocurre |
|---|---|
| Abrir `business_plan_tool.html` | Pantalla de inicio: quién eres + cargar archivos |
| `continueToPlan()` | Entra al plan. **Exige identidad** |
| `restoreSession()` | Vuelve donde se dejó. **Exige identidad** |
| `loadFile()` → `ingestMatrix()` | Installed base (xls/xlsx/xlsb/csv) |
| `ingestReclass()` | Service Reclass, la mitad bundle del ingreso |
| `loadPlanFile()` → `applyBlob()` | Abrir un plan `.json` |
| `onConsolPick()` → `absorb()` | El director absorbe entregas |

## Secciones del archivo

El bloque `<script>` está dividido por bandas de comentario. Las que importan:

| Línea aprox. | Sección | Qué hace |
|---|---|---|
| 1807 | QUIÉN ABRE LA HERRAMIENTA | Tabla de usuarios, alcance, identidad |
| 1978 | INDICATOR GLOSSARY | Los textos de ayuda (`TIPS`) |
| 2297 | FILE LOADING | Lectura y mapeo de columnas |
| 2443 | SERVICE RECLASS | La mitad bundle, unida por número de serie |
| 2592 | RECORD BUILD | `buildRecords()`: la unidad de análisis y el recorte |
| 3039 | FORECAST ENGINE | Metodología §5: base, ventana, ponderación |
| 3380 | END OF LIFE | Casos de fin de vida |
| 3461 | WHERE THE FORECAST LANDS | Dónde aterriza cada euro |
| 3539 | APP SHELL | `startApp()`, navegación, paneles |
| 3767 | FILTERS | El carril de filtros |
| 3837 | MASTER RENDER | `renderAll()` |
| 3870 | DASHBOARD | El panel ejecutivo |
| 4169 | INSTALLED BASE TABLE | La tabla y sus decisiones |
| 4547 / 4685 | RISK / OPPORTUNITY REGISTER | Los dos registros ponderados |
| 4828 | T&M REVENUE | Ingreso manual |
| 5003 | MOVEMENTS | Cada línea entre actual y esperado |
| 5268 | SCENARIOS | Los cuatro escenarios |
| 5626 | AVERAGE SALES PRICE | ASP por plataforma × cobertura |
| 6477 | DATA QUALITY | Metodología §10 |
| 6850 | SETTINGS | Ajustes de método e identidad |
| 6975 | PERSISTENCE | Autoguardado en localStorage |
| 7000 | CONTINUIDAD | IndexedDB: los datos de origen |
| 7165 | GUARDAR EL PLAN | Nombre, carpeta, los tres caminos |
| 7235 | CONSOLIDAR | Absorber entregas |
| 7398 | ENTREGAR AL DIRECTOR | Producir una entrega |
| 7501 | XLSX writer | Escritor ZIP + OOXML propio, con logotipo |
| 7801 | EXECUTIVE REPORT | El informe imprimible |

## Almacenes de datos

| Sitio | Clave | Contenido |
|---|---|---|
| localStorage | `scbp_session_v1` | El plan, sin datos de origen |
| localStorage | `scbp_user_v1` | Quién eres |
| IndexedDB | `scbp` / `src` → `raw` | Los datos de origen (2-3 MB) |

## Integraciones externas

Ninguna. Los archivos los aporta la persona; todo el cálculo es local.

## Identificación y permisos

`DEFAULT_USERS` en el código. **Identifica, no autentica ni autoriza** — ver
`global/alcance-y-usuarios.spec.md`.

## Build / pruebas / despliegue

- **Build:** no hay.
- **Pruebas:** no hay suite. `node --check` sobre el `<script>` extraído, y
  verificación manual en el navegador.
- **Despliegue:** se reparte el archivo. El destino previsto es SharePoint, sin
  comprobar.

## Zonas sin anclar o inciertas

- El escritor XLSX (~300 líneas) no tiene contrato propio. Se documentó su
  motivo de existir, no su formato.
- El informe imprimible y sus reglas de paginación: comprobado que el pie sale
  en 8 de 9 páginas y que la portada no lo lleva a propósito, pero sin spec.
- `TIPS`, el glosario de indicadores: texto de producto sin contrato.

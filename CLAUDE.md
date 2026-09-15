# JJV Business Plan Tool — instrucciones de proyecto

> **Antes de nada: este proyecto trabaja con desarrollo dirigido por
> especificación.** Para cualquier cambio material se aplica el protocolo de
> `.specanchor/README.md` — tarea antes de tocar código, contratos actualizados
> antes o a la vez, y cobertura documental informada **por separado** de la
> alineación funcional. Los contratos están en `.specanchor/global/`; las
> decisiones, en `docs/decisiones/`.
>
> `AGENTS.md` dice lo mismo en corto, para Codex.

---

## Qué es

Previsión **de abajo arriba** del ingreso de mantenimiento a partir de la
installed base de J&J Vision: línea base, riesgo, oportunidad y escenarios,
equipo por equipo, para el ciclo de negocio de un año (BP, JU o NU).

La usan **siete personas**: un director de servicio de EMEA y seis managers de
cluster. Cada uno trabaja sus países y entrega su plan; el director los junta.

**Un solo archivo**: `business_plan_tool.html`, 8.420 líneas, con el HTML, el
CSS y todo el JavaScript en **un único bloque `<script>` en línea**. Sin build,
sin empaquetador, sin servidor, sin base de datos, **sin autenticación**. Se
abre en un navegador y funciona.

Tres dependencias, de cdnjs y con versión exacta:

| Librería | Versión | Para qué |
|---|---|---|
| xlsx (SheetJS) | 0.18.5 | leer `.xls/.xlsx/.xlsb` |
| PapaParse | 5.4.1 | leer CSV |
| Chart.js | 4.4.1 | los gráficos |

> **No hay Supabase, ni Flask, ni API.** Eso es
> `business_plan_tool_supabase.html` y `app.py`, que están parados. Ver
> `CLAUDE_supabase.md` y `.specanchor/modules/variantes-y-legado.spec.md`.

---

## Lo que más caro sale suponer

1. **El alcance por usuario NO es un control de acceso.** El archivo lleva la
   installed base de toda EMEA dentro y se ejecuta en el navegador de quien lo
   abre: cualquiera puede elegirse otro nombre y ver otro cluster. Está decidido
   así a sabiendas (`docs/decisiones/0001`) y **no debe describirse como acceso
   restringido ante nadie que dependa de esa afirmación**.
2. **No hay pruebas automatizadas.** Ni suite, ni `package.json`, ni CI. Lo
   único automatizado es `node --check`.
3. **Nada de lo cambiado en septiembre de 2026 se ha ejecutado contra la
   installed base real.** Al hablar de ello, conviene decirlo así.
4. **Ningún secreto en este repositorio.** El archivo se reparte por correo: lo
   que esté dentro es público.

---

## Entrada de datos

Dos archivos, y cualquiera puede llegar primero:

| Archivo | Qué aporta | Función |
|---|---|---|
| **Installed base** | los equipos y sus contratos directos | `loadFile()` → `ingestMatrix()` |
| **Service Reclass** | la mitad *bundle* del ingreso, unida por número de serie | `ingestReclass()` |

Formatos: `.xls`, `.xlsx`, `.xlsb` y `.csv`. El CSV se lee como **ISO-8859-1**
(`readAsText(file,'ISO-8859-1')`), que es como exporta el origen.

Las columnas **no son fijas**: `autoMap(hdr)` las reconoce por alias y `S.map`
guarda campo → índice de columna. `FIELDS` tiene los 24 campos y sus alias; los
obligatorios son cuenta, país y número de serie.

**La unidad de análisis es cliente–equipo–contrato**, no el equipo ni el
contrato.

---

## El objeto `S`

```js
const S = {
  rows: [],          // los registros ya construidos, YA RECORTADOS al alcance del usuario
  raw:  [],          // la matriz del archivo, ENTERA y con sus índices
  hdr: [], sheets: [], file: '', loadedAt: null,
  map: {},           // campo -> índice de columna
  dec: {},           // _key -> { st, prob, evMon, evYr, note, owner, touched }
  risks: [], opps: [], tm: [], assums: [], versions: [], log: [],
  eol: [],           // casos de fin de vida
  filt: { cluster:Set, country:Set, platform:Set, coverage:Set, status:Set, stream:Set, q:'' },
  sort: { col, dir }, page: 1, ps: 50,
  charts: {}, fx: {}, cur: 'USD',
  cy: { type:'BP', year:2026 },        // el ciclo
  reclass: null,     // el Service Reclass, con bySerial
  tog: { risk, opp, eol, tm },         // qué ajustes entran en la previsión
  st: { ... }        // los ajustes de método: basis, expM, inclBundle, asp*, fxOver…
};
```

Y fuera de `S`, lo que no es del plan sino de la persona o de la máquina:

| Constante | Valor | Qué guarda |
|---|---|---|
| `LS_KEY` | `scbp_session_v1` | el plan, en localStorage |
| `LS_USER` | `scbp_user_v1` | quién eres |
| `IDB_NAME`/`IDB_STORE` | `scbp` / `src` | los datos de origen, en IndexedDB |
| `APP_VERSION` | `2026.09.1` | se estampa en el plan y en las entregas |

**`S.rows` está recortada; `S.raw` no.** El recorte se aplica **una sola vez**,
en `buildRecords()`. Cualquier pantalla nueva cuelga de `S.rows`. La única
excepción es `aspFleet()`, y solo en agregado — ver
`.specanchor/global/alcance-y-usuarios.spec.md`.

---

## Funciones que hay que conocer

| Función | Qué hace |
|---|---|
| `buildRecords()` | Construye `S.rows` desde `S.raw`, **y aplica el recorte de alcance** |
| `stableKey()` | La identidad de un registro: `serial\|contract\|coverage` + ordinal. **Nunca el número de fila** |
| `attachBundle()` | Une el Service Reclass a los equipos por número de serie |
| `applyFx()` | Tipos de cambio, con las anulaciones de `S.st.fxOver` |
| `classify(r)` | Marca el registro: activo, vence, vencido, largo vencido |
| `decOf(r)` | La decisión de un registro, o `{st:'renew', prob:100}` |
| `rev()` / `revBundle()` / `revAll()` | Las tres corrientes: directa, bundle, y la suma |
| `baseWindow(r)` | Los meses del año en que el registro aporta línea base |
| `engine(records, scale)` | El motor: metodología §5 |
| `scenarios(records)` | Base, esperado, pesimista, optimista |
| `dashRows()` | La población del panel |
| `recordLoss(r)` | La pérdida efectiva, siguiendo el enlace al registro de riesgos |
| `currentUser()` / `userScope()` / `scopeLabel()` | Quién eres y qué te toca |
| `absorb(blob)` | El director absorbe una entrega |
| `saveJson()` / `planName()` | Guardar eligiendo carpeta, con nombre con ciclo y alcance |

---

## Los catorce paneles

`p-dash` · `p-base` · `p-risk` · `p-opp` · `p-tm` · `p-move` · `p-scen` ·
`p-asp` · `p-ins` · `p-assum` · `p-dq` · `p-ver` · `p-consol` · `p-set`

`renderAll()` es el re-render maestro: llama a `autoSave()`, a los renderizadores
comunes y al del panel activo.

Mapa completo, sección a sección: `.specanchor/codemap.md`.

---

## Lógica de ingreso

Tres corrientes, que no se mezclan:

- **Direct** — la factura el cliente, está en la installed base. `rev()`
- **Bundle** — reclasificado internamente, solo lo trae el Service Reclass,
  se une por número de serie. `revBundle()`, y solo si `S.st.inclBundle`
- **T&M** — a mano, no sale de ningún archivo

**La línea base es proporcional al tiempo**: `valor × meses activos ÷ 12`.

Dos tratamientos para lo que vence dentro del año, y es un ajuste, no una
constante: `continuation` reserva el año entero y recoge la no renovación como
riesgo ponderado (apéndice A de la metodología); `contractual` reconoce solo
hasta la fecha de fin.

Detalle completo: `.specanchor/global/producto.spec.md`.

---

## Salidas

| Salida | Función |
|---|---|
| Informe imprimible | `openReport()` → `#rptOvl` |
| Excel | `exportXlsx()` — **escritor ZIP + OOXML propio**, porque SheetJS comunitario no incrusta imágenes y el libro lleva el logotipo |
| CSV | los `export*()` de cada panel, **con BOM UTF-8** o Excel se come los acentos |
| Plan `.json` | `savePlanFile()` — elige carpeta |
| Entrega `.json` | `exportSubmission()` — decisiones, sin datos: ~3 KB |
| Correo | resumen HTML al portapapeles con `ClipboardItem` |

El favicon es el logotipo de J&J como **SVG en línea** en un `data:` URI.

---

## Cómo se edita este archivo — IMPORTANTE

### Validar la sintaxis después de cada edición

Hay **un** solo bloque `<script>` en línea. Extrae el primero que no tenga
`src=`:

```bash
python -c "import re;s=open('business_plan_tool.html',encoding='utf-8').read();open('_chk_tmp.js','w',encoding='utf-8').write([x for a,x in re.findall(r'<script\b([^>]*)>(.*?)</script>',s,re.S) if 'src=' not in a][0])" && node --check _chk_tmp.js && rm -f _chk_tmp.js
```

### Usa scripts de parche con anclaje exacto — NO la herramienta Write

El archivo tiene 8.420 líneas. Una sustitución ambigua es una edición silenciosa
en el sitio equivocado:

```python
def rep(old, new, tag):
    global s
    assert old in s, 'NOT FOUND: ' + tag
    assert s.count(old) == 1, 'AMBIGUOUS: ' + tag
    assert old != new, 'NOOP: ' + tag
    s = s.replace(old, new)
```

Los `_inject_*.py` del repositorio son ejemplos de este patrón.

### Nada de literales de plantilla dentro de un heredoc de Python

Las comillas invertidas de JS dentro de `<< 'EOF'` rompen el heredoc. Escribe el
script de parche a un archivo con la herramienta Write y ejecútalo.

### Destruye los gráficos antes de recrearlos

```js
if (S.charts.x) S.charts.x.destroy();
S.charts.x = new Chart(ctx, cfg);
```

Al verificar en un navegador sin foco, `requestAnimationFrame` se para: pon
`window.Chart = undefined` antes de forzar un render.

### Nada de `rgba()` en el HTML del correo

Outlook lo descarta. Solo hexadecimal sólido.

### Antes de decir que funciona, ábrelo

Compilar, montar y aparecer en el menú **no es funcionar**. Si no se ha
ejecutado, se dice que no se ha ejecutado.

---

## Navegación

- Protocolo y contratos — `.specanchor/README.md`
- Mapa del archivo — `.specanchor/codemap.md`
- Quién ve qué, y qué no impide — `.specanchor/global/alcance-y-usuarios.spec.md`
- Método de previsión, ASP, upgrades — `.specanchor/global/producto.spec.md`
- Entregar y consolidar — `.specanchor/global/entrega-y-consolidacion.spec.md`
- Registros, claves, guardado — `.specanchor/global/datos-y-persistencia.spec.md`
- Arquitectura y límites — `.specanchor/global/arquitectura.spec.md`
- Verificación y secretos — `.specanchor/global/calidad-y-seguridad.spec.md`
- Decisiones — `docs/decisiones/`
- La variante parada con Supabase — `CLAUDE_supabase.md`

---
type: global-spec
status: draft
last_reviewed: 2026-09-15
---

# Datos y persistencia

## Propósito

Qué es un registro, cómo se identifica, dónde se guarda el trabajo y qué
formato viaja entre máquinas.

## Comportamiento actual, con estado de evidencia

### La unidad de análisis

**C-DAT-001.** Un registro es **cliente–equipo–contrato**, no un equipo ni un
contrato. · OBSERVED · §RECORD BUILD

**C-DAT-002.** Tres corrientes de ingreso, y no se mezclan: · OBSERVED

| Corriente | De dónde | Función |
|---|---|---|
| **Direct** | la installed base, lo factura el cliente | `rev()` |
| **Bundle** | el Service Reclass, reclasificado internamente, se une por número de serie | `revBundle()` |
| **T&M** | a mano, no viene de ningún archivo | registro propio |

`revAll()` es lo que el negocio de servicio gana de verdad. El bundle solo entra
si `S.st.inclBundle`.

### La identidad de un registro

**C-DAT-003.** La clave es `serial|contract|coverage`, con un **ordinal dentro
del triple** cuando se repite: `SN-1|C-1|Total Advantage#1`. · OBSERVED ·
`stableKey()`

**C-DAT-004.** La clave **no puede depender del número de fila**. La anterior
era `serial|contract|coverage|i` con `i` el índice en `S.raw`: funciona por
casualidad mientras todo el mundo tenga el mismo extracto, y el día que alguien
reexporte de SAP en otro orden las decisiones se pegan a equipos distintos, sin
un solo error y con cifras plausibles. Es el peor fallo que puede tener esta
herramienta, porque no parece un fallo. · OBSERVED · commit 2e6611e

**C-DAT-005.** `_keyLegacy` conserva la clave vieja y `migrateKeys()` traduce un
plan `v:1`. La traducción es **exacta, no heurística**: corre contra el mismo
`raw` con el que se construyó. Ocurre antes de `applyDefaults()`, o sembraría
claves nuevas vacías. · OBSERVED

### El formato del plan

**C-DAT-006.** `stateBlob()` produce `v:2` con: `app`, `savedAt`, `file`,
`scope` (sello de `scopeStamp()`), `cy`, `cur`, `st`, `tog`, `map`, `hdr`, `fx`,
`reclass`, `dec`, `risks`, `opps`, `tm`, `assums`, `eol`, `versions` y los
últimos 200 del registro de auditoría. · OBSERVED

**C-DAT-007.** `withRows` añade `raw`. Para un manager, **solo sus filas**, con
`rawIdx` guardando los índices originales para que las claves sigan apuntando a
los mismos equipos. · VERIFIED · 1 de 2 filas para Iberia, 2 de 2 para el
director

### Dónde se guarda

**C-DAT-008.** Tres sitios, con propósitos distintos: · OBSERVED

| Sitio | Clave | Qué guarda | Por qué ahí |
|---|---|---|---|
| localStorage | `scbp_session_v1` | el plan sin los datos de origen | autoguardado, cabe |
| localStorage | `scbp_user_v1` | quién eres | de la persona, no del plan |
| IndexedDB | `scbp` / `src` → `raw` | los datos de origen | 2-3 MB no caben en los ~5 MB de localStorage |

**C-DAT-009.** El autoguardado **nunca guardó `S.raw`**, así que volver al día
siguiente exigía cargar otra vez los dos Excel. Con nueve personas y un ciclo
largo, ese es el paso que se olvida. Por eso existe el almacén de IndexedDB.
· OBSERVED

**C-DAT-010.** `saveSource()` se llama al cargar la installed base y al cargar
el Service Reclass — **en los dos caminos de `afterLoad()`**, no solo en el de
recarga. Estuvo mal enganchado y no guardaba nada en la primera carga, que es la
normal. · VERIFIED · `idbGet('raw')` vacío antes, con datos después

**C-DAT-011.** IndexedDB es **de este navegador y de esta máquina**. El `.json`
sigue siendo el respaldo y lo único que viaja. · OBSERVED

### Guardar el plan

**C-DAT-012.** El nombre lleva ciclo, alcance y fecha en MMDDAAAA:
`BP2027_Iberia_11152026.json`. El alcance sale **del usuario**, no del filtro de
pantalla: el filtro se mueve mientras se trabaja y daría nombres distintos según
dónde estuviera el ratón. · OBSERVED · `planName()`, `planScope()`

**C-DAT-013.** `saveJson()` tiene tres salidas y las distingue: · VERIFIED

| Salida | Cuándo |
|---|---|
| `file` | `showSaveFilePicker` disponible y el usuario elige carpeta |
| `cancelled` | cerró el diálogo — no es un fallo y no se avisa |
| `download` | sin contexto seguro, o cualquier otro error |

**C-DAT-014.** Con `id: 'bpplan_<propósito>'`, el navegador reabre el diálogo en
la última carpeta usada. · OBSERVED

## Invariantes

- **I-DAT-001.** Una decisión se pega a un equipo por `_key`, nunca por índice.
- **I-DAT-002.** Subir la versión del blob obliga a escribir su migración en el
  mismo cambio.
- **I-DAT-003.** Quedarse sin guardar es peor que guardar en el sitio
  equivocado: cualquier fallo de `showSaveFilePicker` cae a la descarga.

## Incógnitas

- **U-DAT-001.** No se ha comprobado si `showSaveFilePicker` existe sobre
  `file://`. Por la especificación no debería, y en Firefox y Safari no existe
  en ningún caso; la aplicación lo detecta y lo dice bajo el botón, pero eso es
  lectura de la norma, **no medición**.
- **U-DAT-002.** No se ha medido el comportamiento de IndexedDB con el volumen
  real (~3.073 registros). Lo probado son 2 a 12 filas sintéticas.
- **U-DAT-003.** No hay límite ni purga del almacén de IndexedDB.

## Historial de cambios

- 2026-09-15 · Anclaje inicial. Contratos de los commits 741e9c8 y 2e6611e.

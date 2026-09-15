---
type: task-spec
id: TASK-002
status: verified
created: 2026-09-15
---

# Task: reescribir `CLAUDE.md` para la aplicación que existe hoy

## Petición, alcance y comportamiento actual

Miguel pidió reescribir `CLAUDE.md` acorde a la aplicación real. Lo dejó
pendiente `findings/0001`, que encontró el problema durante el anclaje
(TASK-001) y lo marcó como merecedor de tarea propia.

**Comportamiento actual.** `CLAUDE.md` es byte a byte idéntico a
`CLAUDE_supabase.md` (md5 `9790b0ad91ed750aeb08095c25e0bc3f`) y describe **dos
generaciones atrás**: la aplicación de ~1.910 líneas con Supabase encima. No
solo se equivoca en el backend; se equivoca en el objeto de estado, en las
pestañas, en las funciones, en la clave de almacenamiento y en cómo validar una
edición.

Comprobado contra `business_plan_tool.html` en rev `9052d54`:

| `CLAUDE.md` dice | La aplicación |
|---|---|
| Supabase + `supabase-js`, auth, RLS | 0 menciones de Supabase, sin autenticación |
| «two inline `<script>` blocks» | 1 |
| «~1910 lines» | 8.420 |
| `S.raw`, `cRev`, `churn`, `assumps` | `S.rows`, `S.dec`, `S.tm`, `S.assums`, `S.eol`, `S.st` |
| `_id`, `_rev`, `_days`, `_cluster` | `_key`, `_i`, `_usd`, `_cls` |
| 5 pestañas (Systems, Risks…) | 14 paneles |
| `isTM`, `isHX`, `getRev`, `calcSummary` | `rev`, `revBundle`, `revAll`, `engine`, `scenarios` |
| `LS_KEY = 'jjv_bp_session'` | `scbp_session_v1` + `scbp_user_v1` + IndexedDB |
| Solo CSV de Alteryx | xls, xlsx, xlsb y csv, con mapeo de columnas |
| Favicon PNG base64 | SVG en línea, el logotipo de J&J |
| Extraer el **segundo** bloque `<script>` para validar | hay que extraer el **primero y único** |

El último punto es el que más caro sale: quien siga esas instrucciones al pie de
la letra valida **el archivo equivocado** y cree que ha comprobado la sintaxis.

## Resultado deseado y aceptación

- **TASK-002/REQ-001:** `CLAUDE.md` describe `business_plan_tool.html` tal como
  está hoy, y toda afirmación técnica sale de leer el código, no de memoria.
- **TASK-002/REQ-002:** Lo que sigue siendo cierto y útil se conserva: cómo se
  edita el archivo, no usar la herramienta de escritura, nada de literales de
  plantilla dentro de heredocs, destruir los gráficos antes de recrearlos.
- **TASK-002/REQ-003:** Lo que describe la variante con Supabase no se pierde:
  se queda en `CLAUDE_supabase.md`, que pasa a ser suyo de verdad.
- **TASK-002/REQ-004:** `CLAUDE.md` apunta al protocolo y a los contratos.
- **TASK-002/REQ-005:** No cambia el comportamiento de la aplicación.

- **TASK-002/AC-001:** Ninguna afirmación técnica de `CLAUDE.md` contradice el
  código. Comprobado dato a dato: bloques `<script>`, líneas, campos de `S`,
  claves de almacenamiento, funciones, paneles, formatos de entrada, favicon.
- **TASK-002/AC-002:** El procedimiento de validación que trae funciona
  copiado y pegado.
- **TASK-002/AC-003:** `CLAUDE.md` y `CLAUDE_supabase.md` dejan de ser el mismo
  archivo, y el segundo dice en su primera línea qué describe.
- **TASK-002/AC-004:** `business_plan_tool.html` no cambia: mismo md5.

## Anclajes afectados y razón del impacto

Ninguna spec cambia. `CLAUDE.md` no es material según `anchor.yaml` —es
instrucción, no código— y lo que se escribe en él sale de los contratos ya
anclados en `.specanchor/global/`, no al revés. Cierra `findings/0001`.

## Evidencia de verificación

| Requisito | Aceptación | Verificación | Resultado real | Evidencia |
|---|---|---|---|---|
| REQ-001 | AC-001 | Comprobación dato a dato contra el código | pass — 12 de 12 afirmaciones contrastadas | EV-001 |
| REQ-002 | AC-002 | Ejecutar el comando de validación del propio documento | pass — `node --check` PASS | EV-002 |
| REQ-003 | AC-003 | `md5sum CLAUDE.md CLAUDE_supabase.md` | pass — md5 distintos | EV-003 |
| REQ-005 | AC-004 | `md5sum business_plan_tool.html` | pass — `cda3a45f…`, sin cambio | EV-004 |

- **EV-001:** `grep`/`sed` sobre `business_plan_tool.html` rev `9052d54`: 1 bloque
  `<script>`, 8.420 líneas, `S` con `rows/dec/tm/assums/eol/st`, `LS_KEY` y
  `LS_USER`, 14 `id="p-*"`, `readAsText(file,'ISO-8859-1')` solo para csv,
  favicon SVG en línea, `openReport()`, `exportXlsx()`.
- **EV-002:** el bloque de validación del nuevo `CLAUDE.md`, ejecutado tal cual.
- **EV-003:** md5 distintos tras el cambio.
- **EV-004:** `cda3a45f56b8eae5e35e1c439d77a6d7`, igual que en TASK-001.

## Revisión final

- **Cobertura documental:** PASS
- **Spec → Código:** ALIGNED — `CLAUDE.md` no afirma nada que los contratos
  anclados no digan ya.
- **Código → Spec:** ALIGNED para el alcance de esta tarea. `CLAUDE.md` no
  cubre el escritor XLSX ni el informe en detalle, igual que los contratos: son
  las mismas zonas sin anclar de `codemap.md`, y se dice.

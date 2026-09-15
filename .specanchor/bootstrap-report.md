# Informe de anclaje

**Fecha:** 15 de septiembre de 2026 · **Revisión de partida:** `34966d3`
**Tarea:** `tasks/TASK-001.spec.md`

## Qué se ha hecho

Bootstrap documental de una aplicación existente, **sin refactorizar**. Se han
escrito contratos para lo que ya hay, se ha activado el protocolo para los dos
agentes y se han registrado dos decisiones que estaban solo en mensajes de
commit.

## La prueba de que documentar no rompió nada

Es lo que la memoria del proyecto pide medir, y es lo único que demuestra que un
bootstrap fue documental de verdad:

| Medida | Antes | Después |
|---|---|---|
| md5 de `business_plan_tool.html` | `cda3a45f56b8eae5e35e1c439d77a6d7` | **idéntico** |
| Líneas | 8.420 | **8.420** |
| Bytes | 520.422 | **520.422** |
| md5 del `<script>` en línea | `1b2b7e7d0444b75ec5bcac355ec6c4e7` | **idéntico** |
| `node --check` | PASS | **PASS** |

No se ha tocado una línea de la aplicación.

## Resultados

- **Cobertura documental: PASS.** `check-spec-sync.py --review`, salida 0,
  contra HEAD `34966d3`.
- **Inventario: 12 archivos materiales, 0 huérfanos.** `--baseline`, salida 0.
- **Alineación funcional: PARTIAL.** Ver abajo. El guard no da veredicto
  semántico y esto no lo es: sale de leer el código contra lo escrito.

### Alineación, en las dos direcciones

**Spec → Código: ALIGNED** para lo marcado OBSERVED y VERIFIED. Lo que está
marcado UNKNOWN queda explícitamente sin verificar.

**Código → Spec: PARTIAL.** Los contratos cubren arquitectura, producto,
alcance, entrega y consolidación, datos y persistencia, calidad y seguridad. No
cubren tres zonas, que están listadas como tales en `codemap.md` en vez de
omitidas en silencio:

- el escritor XLSX propio (~300 líneas),
- el informe imprimible y sus reglas de paginación,
- `TIPS`, el glosario de indicadores.

## Lo que hay que decir sobre el orden de los hechos

**Este anclaje se escribió después de los cambios que documenta.** Entre el 14 y
el 15 de septiembre de 2026 entraron cinco cambios materiales —guardado con
carpeta, capa multi-manager, tabla de usuarios, reparto de clusters, entrar y
salir— sin una sola tarea previa. Los contratos de `global/` describen lo que
hay, no lo que se decidió que hubiera.

Eso es deuda reconocida, no proceso cumplido. No se han reescrito los commits
para que parezca lo contrario: seguirían siendo los mismos cambios con una
historia inventada encima.

De aquí en adelante, la tarea va antes.

## Hallazgo que apareció al anclar

**`CLAUDE.md` describe una aplicación que no es la viva.** Es byte a byte
idéntico a `CLAUDE_supabase.md` (md5 `9790b0ad91ed750aeb08095c25e0bc3f`) y
describe Supabase, autenticación y persistencia en servidor. La aplicación viva
tiene **cero** menciones de Supabase y **un** bloque `<script>`, no dos.

Importa porque es lo primero que lee un agente, y le afirma que hay
autenticación y aislamiento por RLS justo en un proyecto que acaba de decidir a
sabiendas que no aísla nada.

Se ha puesto un aviso al principio de `CLAUDE.md` y se ha registrado en
`findings/0001`. **No se ha reescrito**: reescribir instrucciones de proyecto
merece su propia tarea.

## Decisiones de adaptación

**Un módulo por ruta, contratos en `global/`.** El guard resuelve la propiedad
por ruta y exige que *todas* las specs que casan hayan cambiado. Con seis
módulos sobre un solo archivo, cada cambio obligaría a editar las seis. En una
aplicación de un archivo, todo contrato es global a ese archivo.

**Los ADR van en `docs/decisiones/`**, no dentro de `.specanchor/`, siguiendo la
convención que Miguel ya usa en Prospector.

## Incertidumbres que quedan abiertas

| # | Qué |
|---|---|
| U-ARQ-001 | Si la red corporativa permite cdnjs. Si no, se pierden Excel, CSV y gráficos a la vez |
| U-ARQ-002 | Si SharePoint renderiza el `.html` o lo descarga |
| U-DAT-001 | Si `showSaveFilePicker` existe sobre `file://` |
| U-DAT-002 | IndexedDB con el volumen real (~3.073 registros); lo probado son 12 filas |
| U-PRD-001 | La conciliación con datos reales es anterior a los cambios de esta sesión |
| U-CAL-001 | Sin CI |
| U-CAL-002 | Idioma de los comentarios, mezclado |
| D-BPB-001 | **Nada de lo cambiado en septiembre se ha ejecutado contra la installed base real** |

## Siguientes pasos

1. **Correr una campaña real.** Es lo que cierra D-BPB-001 y U-PRD-001 de una
   vez, y nada de lo demás lo sustituye.
2. La prueba de entorno: SharePoint y `file://` (U-ARQ-002, U-DAT-001).
3. Separar `CLAUDE.md` de `CLAUDE_supabase.md` — su propia tarea.
4. CI que corra el guard y `node --check` (U-CAL-001). Las protecciones de rama
   son un ajuste externo y necesitan autorización aparte.

## Nota sobre `evidence/impact-review.json`

Está atado a HEAD `34966d3`, que era el HEAD **al ejecutarlo**. En cuanto se
commitee este anclaje dejará de casar, y eso es lo normal: un informe de impacto
es un artefacto de tiempo de ejecución —no se puede commitear un documento que
contiene su propio hash—. Se regenera en cada cambio.

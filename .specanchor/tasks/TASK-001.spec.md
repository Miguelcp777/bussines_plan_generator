---
type: task-spec
id: TASK-001
status: verified
created: 2026-09-15
modules: [bp-builder, variantes-y-legado]
behavior_preserving: true
---

# Task: anclar el BP Builder a desarrollo dirigido por especificación

## 1. Problema / cambio pedido

Miguel preguntó si se estaba aplicando la skill `sdd-spec-anchor` en este
proyecto. No se estaba. Existe una memoria suya del 14 de septiembre de 2026
pidiendo aplicarla siempre, y para un proyecto existente, *«bootstrap documental
sin refactorizar»*.

## 2. Comportamiento actual

- Sin `.specanchor/`, sin guard, sin mapa de módulos.
- Sin `AGENTS.md`. `CLAUDE.md` no menciona specs ni tareas.
- Ninguna tarea escrita antes de tocar código en toda la sesión del 14-15 de
  septiembre, en la que entraron cinco cambios materiales (741e9c8, 2e6611e,
  5f8e31c, b8d0df6, 34966d3).
- El porqué de cada decisión vive en el mensaje del commit, que es exactamente
  el modo de fallo que la memoria describe.

## 3. Comportamiento deseado

Contratos anclados y verificables, protocolo activado para los dos agentes, y
la deuda documental reconocida como tal en vez de disimulada.

## 4. Alcance

Documentación y configuración. `.specanchor/` completo, dos ADR, activación en
`CLAUDE.md` y `AGENTS.md`.

## 5. Fuera de alcance

- **Refactorizar.** Ni una línea de `business_plan_tool.html`.
- Reescribir los seis commits para que parezca que salieron de un proceso que no
  existió.
- Reescribir `CLAUDE.md` entero (ver `findings/0001`; merece su propia tarea).
- Montar CI.

## 6. Anclajes afectados

Todos son nuevos: los seis globales, los dos de módulo, el codemap y el índice.

## 7. Requisitos

- **TASK-001/REQ-001:** El bootstrap no cambia el comportamiento de la
  aplicación.
- **TASK-001/REQ-002:** Todo archivo material queda mapeado a un módulo.
- **TASK-001/REQ-003:** Los contratos distinguen lo observado de lo verificado y
  de lo desconocido.
- **TASK-001/REQ-004:** El protocolo queda activado para Claude Code y para
  Codex.
- **TASK-001/REQ-005:** Las dos decisiones tomadas en esta sesión —el archivo
  único con tabla de usuarios, y el reparto de clusters— quedan registradas como
  ADR.

## 8. Criterios de aceptación

- **TASK-001/AC-001:** `business_plan_tool.html` es **byte a byte idéntico**
  antes y después: mismo md5, mismo recuento de líneas, mismo md5 del `<script>`
  en línea, y `node --check` sigue pasando.
- **TASK-001/AC-002:** `check-spec-sync.py --baseline` termina con
  `"unmapped": []` y código de salida 0.
- **TASK-001/AC-003:** Cada spec lleva su tabla de evidencia con estados
  OBSERVED / VERIFIED / INFERRED / UNKNOWN / INTENT y su fuente.
- **TASK-001/AC-004:** `CLAUDE.md` y `AGENTS.md` apuntan al protocolo.
- **TASK-001/AC-005:** Existen `docs/decisiones/0001` y `0002`.

## 9. Enfoque de diseño

La aplicación es un solo archivo, y el guard resuelve la propiedad por ruta: si
varios módulos casan con la misma ruta, un cambio de contrato exige que todas
esas specs hayan cambiado. Con seis módulos sobre un archivo, cada cambio
obligaría a tocar las seis specs — ruido, no trazabilidad.

**Decisión:** un módulo por ruta, y los contratos en `global/`. En una aplicación
de un archivo, todo contrato es global a ese archivo.

## 10. Impacto en API / datos / interfaz

Ninguno. No se ejecuta nada de lo escrito.

## 11. Migración y compatibilidad

No aplica.

## 12. Plan de pruebas

Comparar las medidas de antes y después, y correr el guard.

## 13. Riesgos y vuelta atrás

Riesgo bajo: son archivos nuevos y un aviso en `CLAUDE.md`. Vuelta atrás,
borrar `.specanchor/`, `AGENTS.md`, `docs/` y revertir `CLAUDE.md`.

## 14. Lista de implementación

- [x] Contratos escritos
- [x] Implementación (no hay código)
- [x] Comprobaciones ejecutadas
- [x] Revisión inversa completa
- [x] Guard ejecutado

## 15. Registro de decisiones

- **DEC-001:** Un módulo por ruta y contratos en `global/`. Ver §9.
- **DEC-002:** Los ADR van en `docs/decisiones/`, no en `.specanchor/`, siguiendo
  la convención que Miguel ya usa en Prospector. Duplicarlos crearía dos sitios
  donde mirar y uno se quedaría atrás.
- **DEC-003:** No se reescriben los commits ya hechos. La deuda se reconoce en
  `bootstrap-report.md` y en las notas de alineación de la spec de módulo.
- **DEC-004:** `CLAUDE.md` no se reescribe; solo se le antepone el aviso, porque
  reescribir instrucciones de proyecto merece su propia tarea revisada.

## 16. Registro de evidencia

- **EV-001:** Antes · rev 34966d3 · `md5 business_plan_tool.html` =
  `cda3a45f56b8eae5e35e1c439d77a6d7` · 8.420 líneas · 520.422 bytes · `<script>`
  393.178 bytes, md5 `1b2b7e7d0444b75ec5bcac355ec6c4e7` · `node --check` PASS.
- **EV-002:** Después · **mismos cuatro valores, uno a uno** · `node --check`
  PASS. → AC-001 **pass**.
- **EV-003:** `check-spec-sync.py --baseline` → 12 archivos materiales,
  `"unmapped": []`, salida 0. → AC-002 **pass**.
- **EV-004:** Hallazgo encontrado al anclar: `CLAUDE.md` y `CLAUDE_supabase.md`
  son byte a byte idénticos (md5 `9790b0ad91ed750aeb08095c25e0bc3f`) y describen
  la variante Supabase; la aplicación viva tiene **0** menciones de Supabase y
  **1** bloque `<script>`, no dos. Registrado en `findings/0001`.
- **EV-005:** `CLAUDE.md` con el aviso al principio; `AGENTS.md` creado. →
  AC-004 **pass**.
- **EV-006:** `docs/decisiones/0001` y `0002` escritos. → AC-005 **pass**.
- **EV-007:** Las nueve specs llevan tabla o marcas de evidencia por afirmación.
  → AC-003 **pass**.

## 17. Actualizaciones de spec necesarias

Todas nuevas. Ninguna spec previa que corregir: no había.

## 18. Alineación final

- **Spec → Código:** ALIGNED para lo que las specs afirman como OBSERVED y
  VERIFIED. Lo marcado UNKNOWN queda explícitamente sin verificar —en particular
  el comportamiento con datos reales, `showSaveFilePicker` sobre `file://` y
  SharePoint—.
- **Código → Spec:** PARTIAL. Los contratos cubren alcance, entrega,
  consolidación, datos, guardado, arquitectura, producto y verificación. **No**
  cubren el escritor XLSX, el informe imprimible ni el glosario de indicadores:
  están listados como zonas sin anclar en `codemap.md`, no omitidos en silencio.

## Trazabilidad

| Requisito | Aceptación | Verificación | Resultado real | Evidencia |
|---|---|---|---|---|
| TASK-001/REQ-001 | TASK-001/AC-001 | md5 + wc + `node --check`, antes y después | pass — idéntico | EV-001, EV-002 |
| TASK-001/REQ-002 | TASK-001/AC-002 | `check-spec-sync.py --baseline` | pass — 0 huérfanos | EV-003 |
| TASK-001/REQ-003 | TASK-001/AC-003 | revisión de las nueve specs | pass | EV-007 |
| TASK-001/REQ-004 | TASK-001/AC-004 | inspección de `CLAUDE.md` y `AGENTS.md` | pass | EV-005 |
| TASK-001/REQ-005 | TASK-001/AC-005 | los dos ADR existen | pass | EV-006 |

## Cobertura documental

PASS — ver `evidence/impact-review.json`, ejecutado contra HEAD.

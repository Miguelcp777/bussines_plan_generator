---
type: module-spec
module: variantes-y-legado
status: draft
source_paths:
  - business_plan_tool_supabase.html
  - business_plan_tool_v2.html
  - business_plan_tool_BACKUP.html
  - CLAUDE_supabase.md
  - app.py
  - requirements.txt
  - build_exe.spec
  - _chk.js
  - _inject_*.py
last_reviewed: 2026-09-15
---

# Módulo: variantes-y-legado

## Responsabilidad

Todo lo que está en el repositorio y **no se ejecuta en producción**. Existe
para que el guard no lo dé por huérfano y para que nadie lo confunda con la
aplicación viva.

## Propiedad del código

| Archivo | Qué es | Estado |
|---|---|---|
| `business_plan_tool_supabase.html` | Variante con Supabase: login, tabla `reports` con RLS, planes en la nube | **No en uso.** Otro camino para el problema del multi-usuario |
| `CLAUDE_supabase.md` | Sus instrucciones de proyecto | Acompaña a la anterior |
| `business_plan_tool_v2.html` | Instantánea de mayo de 2026, 205 KB | Histórico |
| `business_plan_tool_BACKUP.html` | Instantánea de mayo de 2026, 172 KB | Histórico |
| `app.py`, `requirements.txt` | Flask + SQLite (`reports.db`) para guardar informes | **Legado.** La aplicación viva no lo usa |
| `build_exe.spec` | Empaquetado con PyInstaller | Legado, del camino Flask |
| `_chk.js` | Copia extraída del `<script>`, de mayo | **Obsoleta**, 81 KB desfasados |
| `_inject_*.py` | Scripts de parche de cambios pasados | Histórico |

## Interfaces públicas

Ninguna. Nada de aquí lo abre un usuario.

## Dependencias

`business_plan_tool_supabase.html` referencia un Supabase autoalojado con clave
`anon` incrustada, que es publicable por diseño (ver
`global/calidad-y-seguridad.spec.md`, C-SEG-005).

## Incertidumbres y deuda conocidas

- **D-VAR-001.** La variante de Supabase resuelve el mismo problema que la
  tabla de usuarios del archivo único, por otro camino y con aislamiento real.
  No está descartada ni adoptada: está parada. Si algún día el alcance tiene
  que ser un control de verdad, se empieza por aquí y no de cero. Ver
  `docs/decisiones/0001-un-archivo-con-tabla-de-usuarios.md`.
- **D-VAR-002.** `_chk.js` desfasa 4 meses y puede hacer perder un rato a quien
  lo lea creyendo que es el código vivo. Borrarlo es un cambio ligero
  pendiente.
- **D-VAR-003.** `reports.db` (8 MB) está en `.gitignore` pero sigue en el
  disco; es del camino Flask.
- **D-VAR-004.** Los `_inject_*.py` están versionados mientras que los
  `_patch_*.py` y `_fix_*.py` están ignorados, siendo la misma clase de
  utilidad. Sin decidir.

## Notas de alineación

Este módulo no tiene contratos que cumplir: es un inventario. Su valor es que un
cambio en cualquiera de estos archivos obligue a mirarlo y preguntarse si sigue
siendo cierto que no se ejecuta.

## Historial de cambios

- 2026-09-15 · Anclaje inicial.

## Evidencia de afirmaciones

| Afirmación | Estado | Fuente / revisión | Resultado |
|---|---|---|---|
| La variante Supabase no es la app viva | OBSERVED | `CLAUDE_supabase.md` · 34966d3 | describe otro despliegue |
| Su JWT es `anon` | VERIFIED | decodificado · 34966d3 | `"role":"anon"` |
| `_chk.js` es de mayo | VERIFIED | `ls -la` · 34966d3 | 8 may 2026 |
| Flask es legado | OBSERVED | `CLAUDE_supabase.md` | «retained only for local dev» |

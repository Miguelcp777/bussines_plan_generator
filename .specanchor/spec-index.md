# Índice de especificaciones

| Módulo | Rutas de origen | Spec | Estado | Última revisión |
|---|---|---|---|---|
| bp-builder | `business_plan_tool.html` | `.specanchor/modules/bp-builder.spec.md` | draft | 2026-09-15 |
| variantes-y-legado | `business_plan_tool_supabase.html`, `business_plan_tool_v2.html`, `business_plan_tool_BACKUP.html`, `CLAUDE_supabase.md`, `app.py`, `requirements.txt`, `build_exe.spec`, `_chk.js`, `_inject_*.py` | `.specanchor/modules/variantes-y-legado.spec.md` | draft | 2026-09-15 |

## Especificaciones globales

Aquí viven los contratos de verdad. La aplicación es un solo archivo, así que
mapear un módulo por contrato obligaría a tocar todas las specs en cada cambio
—ver `modules/bp-builder.spec.md`, «Propiedad del código»—.

- `.specanchor/global/arquitectura.spec.md` — archivo único, dependencias, límites
- `.specanchor/global/producto.spec.md` — método de previsión, ASP, upgrades
- `.specanchor/global/alcance-y-usuarios.spec.md` — quién ve qué, y qué no impide
- `.specanchor/global/entrega-y-consolidacion.spec.md` — entregar y absorber
- `.specanchor/global/datos-y-persistencia.spec.md` — registros, claves, guardado
- `.specanchor/global/calidad-y-seguridad.spec.md` — verificación y secretos

## Decisiones

No están aquí. Viven en `docs/decisiones/`, numeradas desde `0001`. Una nueva
continúa esa serie.

- `docs/decisiones/0001-un-archivo-con-tabla-de-usuarios.md`
- `docs/decisiones/0002-reparto-de-clusters.md`

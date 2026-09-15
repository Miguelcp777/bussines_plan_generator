# Agentes en este repositorio

Miguel trabaja con Claude Code y con Codex sobre los mismos archivos. Esto es lo
que los dos tienen que saber, dicho una vez.

## El protocolo

Para **cualquier cambio material** se aplica el de `.specanchor/README.md`:

1. Antes de tocar código, escribe la tarea en `.specanchor/tasks/`. Ligera si el
   cambio es localizado y no toca datos, permisos, integraciones ni
   arquitectura; completa si toca algo de eso.
2. Carga los contratos afectados: `.specanchor/global/` y el ADR
   correspondiente de `docs/decisiones/` si lo hay.
3. Si el cambio altera un contrato, **actualiza la spec antes o a la vez**.
   Nunca después para justificar lo que salió.
4. Verifica los criterios afectados con evidencia real.
5. Informa **por separado** la cobertura documental (`PASS/FAIL/NOT_RUN`) y la
   alineación funcional (`ALIGNED/PARTIAL/DRIFT/NOT_VERIFIED`).

## La aplicación, en cuatro líneas

`business_plan_tool.html` es **un archivo**: HTML, CSS y todo el JavaScript en un
solo bloque `<script>` de 8.400 líneas. Sin build, sin servidor, sin base de
datos, sin autenticación. Tres dependencias de cdnjs con versión fija.

Previsión de abajo arriba del ingreso de mantenimiento a partir de la installed
base, para siete managers de servicio de EMEA.

## Lo que más caro sale suponer

- **El alcance por usuario no es un control de acceso.** El archivo lleva toda
  EMEA dentro. Está decidido así a sabiendas (`docs/decisiones/0001`) y **no
  debe describirse como acceso restringido**.
- **`CLAUDE.md` describe en parte otra aplicación** — la variante con Supabase,
  que está parada. Ver `.specanchor/findings/0001`.
- **No hay pruebas automatizadas.** Lo único automatizado es `node --check`
  sobre el `<script>` extraído.

## Cómo se edita este archivo

Con scripts de parche que buscan un anclaje exacto y fallan si no lo encuentran
o si aparece dos veces:

```python
assert old in s, 'NOT FOUND: ' + tag
assert s.count(old) == 1, 'AMBIGUOUS: ' + tag
```

En 8.400 líneas, una sustitución ambigua es una edición silenciosa en el sitio
equivocado. **No** reescribas el archivo entero con una herramienta de escritura.

Después de cada edición, `node --check`. Antes de decir que funciona, ábrelo.

## Navegación

- Protocolo y contratos: `.specanchor/README.md`
- Mapa del archivo, sección a sección: `.specanchor/codemap.md`
- Qué ve cada manager y qué no impide: `.specanchor/global/alcance-y-usuarios.spec.md`
- Método de previsión: `.specanchor/global/producto.spec.md`
- Entregar y consolidar: `.specanchor/global/entrega-y-consolidacion.spec.md`
- Decisiones: `docs/decisiones/`

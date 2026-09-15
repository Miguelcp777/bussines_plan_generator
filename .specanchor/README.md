# Spec Anchor del BP Builder

Los contratos de esta herramienta viven aquí. El código tiene que poder
justificarse contra ellos.

## Qué hay

| Ruta | Qué es |
|---|---|
| `global/*.spec.md` | **Los contratos de verdad.** Seis documentos |
| `modules/*.spec.md` | Un contrato por módulo. Aquí son dos, y por qué está explicado abajo |
| `tasks/` | Una tarea por cambio material |
| `findings/` | Hallazgos fuera de alcance, para no perderlos ni colarlos |
| `evidence/` | Línea base e informes de impacto |
| `codemap.md` | El mapa del archivo, sección a sección |
| `anchor.yaml` | Qué es material y qué no |
| `module-map.json` | Qué ruta pertenece a qué módulo |

**Las decisiones no están aquí.** Viven en `docs/decisiones/`, numeradas desde
`0001`. Una nueva continúa esa serie.

## Por qué los contratos están en `global/` y no en `modules/`

La aplicación es **un solo archivo**. El guard resuelve la propiedad por ruta:
`anchors(p)` devuelve todos los módulos que casan, y un cambio de contrato exige
que **todas** esas specs hayan cambiado. Con seis módulos apuntando al mismo
archivo, cualquier cambio obligaría a editar las seis specs a la vez — ruido, no
trazabilidad.

Así que el módulo es uno y los contratos son globales. En una aplicación de un
archivo, todo contrato es global a ese archivo.

## Cómo se trabaja un cambio

1. **Elegir el alcance.** Cambio localizado sin tocar datos, permisos,
   integraciones ni arquitectura → tarea ligera. Lo demás → tarea completa.
2. **Escribir la tarea antes de tocar código**: comportamiento actual, deseado,
   alcance y criterios de aceptación medibles.
3. Si cambia un contrato, **la spec se actualiza antes o a la vez**, nunca
   después para legitimar lo que salió.
4. Implementar y verificar. Identificadores con espacio de nombres:
   `TASK-001/REQ-001`, `TASK-001/AC-001`.
5. **Revisar el diff en las dos direcciones**: código → spec y spec → código.
6. Registrar el informe de impacto y pasar el guard.
7. Cerrar solo cuando los criterios afectados pasan **con evidencia real**.

## Comandos

Cambios locales:

```bash
python .specanchor/scripts/check-spec-sync.py \
  --config .specanchor/anchor.yaml \
  --review .specanchor/evidence/impact-review.json
```

Contra la rama de destino:

```bash
python .specanchor/scripts/check-spec-sync.py \
  --config .specanchor/anchor.yaml \
  --base origin/main \
  --review .specanchor/evidence/impact-review.json
```

Inventario de material y huérfanos:

```bash
python .specanchor/scripts/check-spec-sync.py \
  --config .specanchor/anchor.yaml --baseline
```

Comprobación de sintaxis, que es el único control automatizado del proyecto:

```bash
python -c "import re;s=open('business_plan_tool.html',encoding='utf-8').read();open('_chk_tmp.js','w',encoding='utf-8').write([x for a,x in re.findall(r'<script\b([^>]*)>(.*?)</script>',s,re.S) if 'src=' not in a][0])" && node --check _chk_tmp.js && rm _chk_tmp.js
```

## Lo que el guard NO hace

Comprueba **cobertura documental**: que un archivo material no cambie sin que su
contrato se haya mirado y clasificado. No comprueba que lo que dice la spec sea
verdad, ni que se haya ejecutado nada, ni que la justificación sea honesta. Un
cambio de espacios en una spec con una justificación engañosa pasa igual.

La alineación semántica la establecen **la ejecución y la revisión del diff**, y
se informa por separado. Nunca se mezclan en el mismo veredicto.

## Lo que falta

- **No hay pruebas automatizadas.** Ni suite, ni `package.json`. Lo que hay es
  `node --check` y verificación en el navegador.
- **No hay CI.** Nada ejecuta el guard ni las comprobaciones solo.
- **Este anclaje se escribió después de los cambios que documenta.** Ver
  `bootstrap-report.md`.

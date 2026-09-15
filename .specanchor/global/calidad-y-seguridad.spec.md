---
type: global-spec
status: draft
last_reviewed: 2026-09-15
---

# Calidad, verificación y seguridad

## Propósito

Cómo se comprueba que un cambio funciona, y qué no puede pasar nunca.

## Verificación: lo que hay de verdad

**No hay pruebas automatizadas.** Ni `package.json`, ni suite, ni CI. · VERIFIED
· `ls` · 34966d3

Lo que sí existe: · OBSERVED

| Comprobación | Cómo | Qué demuestra |
|---|---|---|
| Sintaxis | extraer el `<script>` y `node --check` | que el archivo carga |
| Comportamiento | abrirlo servido por HTTP y ejecutar contra el DOM real | que hace lo que dice |
| No regresión de bytes | md5 del archivo antes y después | que un cambio documental no tocó código |

**C-CAL-001.** Un cambio no está verificado hasta que se ha **ejecutado**.
Compilar, montar y aparecer en el menú no es funcionar. La lección viene de un
porte anterior en otro proyecto donde se repuso un selector de temas sin el CSS
detrás: cinco opciones que no cambiaban un solo color.

**C-CAL-002.** Se informa **por separado** la cobertura documental
(`PASS/FAIL/NOT_RUN`) y la alineación funcional
(`ALIGNED/PARTIAL/DRIFT/NOT_VERIFIED`). El guard no da veredicto semántico y
decir que sí lo da convertiría esto en burocracia.

**C-CAL-003.** Los datos sintéticos valen para probar contratos —recorte,
absorción, claves— y **no** valen para dar por buena una cifra de negocio.
Cuando la verificación es sintética, se dice.

## Cómo se edita este archivo

**C-CAL-004.** Los cambios se aplican con **scripts de parche** que buscan un
anclaje exacto y fallan si no lo encuentran o si aparece dos veces:

```python
assert old in s, 'NOT FOUND: ' + tag
assert s.count(old) == 1, 'AMBIGUOUS: ' + tag
```

En un archivo de 8.400 líneas, una sustitución ambigua es una edición silenciosa
en el sitio equivocado. · OBSERVED · `_inject_*.py`, `_patch_*.py`

**C-CAL-005.** Los comentarios del código están en inglés; los de la capa
multi-manager, en español. Es una inconsistencia conocida, **no** una
convención. Ver `U-CAL-002`.

**C-CAL-006.** Todo texto que ve el usuario va en **inglés**, incluido el
registro de auditoría. Lo usan managers de toda EMEA.

## Seguridad

**C-SEG-001.** El alcance por usuario **no es un control de acceso**. Ver
`alcance-y-usuarios.spec.md`. No debe describirse como tal ante nadie que
dependa de esa afirmación.

**C-SEG-002.** Ningún secreto en el repositorio ni en el archivo. El HTML se
reparte por correo: lo que esté dentro es público.

**C-SEG-003.** `.claude/settings.json` está **fuera del repositorio** a
propósito: contiene comandos aprobados que llevan dentro una clave
`service_role` de Supabase y una contraseña en claro. Está en `.gitignore` con
el motivo escrito. Un secreto en el historial no se quita con un commit: hay que
reescribir la historia y rotar la credencial igual. · OBSERVED · `.gitignore`

**C-SEG-004.** Los datos son de clientes de J&J. Nada sale del navegador: sin
telemetría, sin llamadas de red más allá de las tres librerías de cdnjs.
· OBSERVED

**C-SEG-005.** La clave `anon` de Supabase que aparece en
`business_plan_tool_supabase.html` es publicable por diseño —la seguridad la
hace la RLS— y por eso sí está versionada. · VERIFIED · JWT decodificado:
`"role":"anon"`

## Invariantes

- **I-CAL-001.** `node --check` pasa antes de cada commit.
- **I-CAL-002.** Ningún cambio se describe como verificado si no se ha
  ejecutado.
- **I-SEG-001.** Ninguna credencial entra en el repositorio, ni siquiera dentro
  de un comando aprobado.

## Incógnitas

- **U-CAL-001.** Sin CI. Nada ejecuta el guard ni las comprobaciones solo.
- **U-CAL-002.** Idioma de los comentarios: inglés en el código original,
  español en lo añadido en septiembre de 2026. Está sin decidir; unificarlo es
  un cambio de 500 líneas de comentario y no se ha hecho sin preguntar.
- **U-CAL-003.** Las credenciales de `C-SEG-003` siguen en texto plano en el
  disco de Miguel aunque no estén en git. Rotarlas está pendiente.

## Historial de cambios

- 2026-09-15 · Anclaje inicial.

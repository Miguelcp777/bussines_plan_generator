# Hallazgo 0001 · `CLAUDE.md` describe una aplicación que no es la viva

**Encontrado:** 15 de septiembre de 2026, durante el bootstrap documental
**Estado:** **cerrado** el 15 de septiembre de 2026 por `tasks/TASK-002.spec.md`
**Gravedad:** alta — son las instrucciones que lee cualquier agente que abra el
repositorio

## Qué pasa

`CLAUDE.md` y `CLAUDE_supabase.md` son **el mismo archivo**:

```
9790b0ad91ed750aeb08095c25e0bc3f  CLAUDE.md
9790b0ad91ed750aeb08095c25e0bc3f  CLAUDE_supabase.md
```

Y lo que describen es la variante con Supabase, no `business_plan_tool.html`.

| `CLAUDE.md` dice | La aplicación viva |
|---|---|
| «talking directly to **Supabase** (Postgres + Auth) via `supabase-js`» | **0** menciones de Supabase |
| «HTML+CSS+JS in **two** inline `<script>` blocks» | **1** bloque |
| «`SUPABASE_URL` + `SUPABASE_ANON_KEY` constants (~line 1172)» | no existen |
| «Saved reports persist in Supabase Postgres (`public.reports`)» | localStorage + IndexedDB |
| «**Auth:** email/password. Public sign-up disabled» | no hay autenticación |
| «**Deploy:** nginx… Proxmox… Let's Encrypt… port-forward 443» | se reparte el archivo |

· VERIFIED · `grep -c -i supabase business_plan_tool.html` → 0 · rev 34966d3

## Por qué importa

Es lo primero que lee un agente, y lo instruye sobre una arquitectura que no
existe en el archivo que va a editar: le dice que hay autenticación, aislamiento
por RLS y persistencia en servidor. Las tres son falsas para la aplicación viva,
y las tres son justo las que más caro sale suponer — este proyecto acaba de
decidir a sabiendas que **no** aísla nada (`docs/decisiones/0001`).

Parte de lo que sí es correcto y útil —el objeto `S`, las pestañas, la lógica de
ingreso, y sobre todo las reglas de edición: validar con `node --check`, usar
`str.replace` de Python y no la herramienta Write— se aplica igual a los dos
archivos. Por eso no se borra: se separa.

## Cómo pasó, probablemente

`CLAUDE_supabase.md` es una copia de `CLAUDE.md` hecha al abrir la variante, o
al revés, y el original nunca se actualizó al volver a la línea sin servidor.
Ninguno de los dos se tocó al escribir la capa multi-manager.

## Qué se ha hecho ahora

Solo lo mínimo para que no siga engañando: un aviso al principio de `CLAUDE.md`
diciendo qué secciones describen la variante, y la activación del protocolo
apuntando a los contratos reales. **No se ha reescrito**: es un cambio de
contenido de instrucciones que merece su propia tarea y su revisión.

## Cómo se cerró

`TASK-002`, el 15 de septiembre de 2026. `CLAUDE.md` reescrito para la
aplicación que existe, con cada afirmación técnica contrastada contra el código;
`CLAUDE_supabase.md` se queda con lo de la variante y lo dice en su primera
línea. Ya no son el mismo archivo.

Al reescribirlo apareció que el desfase era **de dos generaciones**, no de una:
lo que describía no era solo «la app con Supabase», era la app de ~1.910 líneas
con cinco pestañas y `S.raw`/`cRev`/`churn`. El detalle, en `TASK-002`.

`AGENTS.md` ya se escribió en TASK-001.

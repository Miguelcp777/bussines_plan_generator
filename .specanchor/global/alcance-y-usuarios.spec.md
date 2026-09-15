---
type: global-spec
status: draft
last_reviewed: 2026-09-15
---

# Alcance y usuarios

## Propósito

Quién abre la herramienta, qué ve, y —lo más importante de este documento— **qué
no impide** que vea otra cosa.

## Lo primero, porque todo lo demás depende de ello

> **El alcance por usuario es una comodidad de trabajo, no un control de
> acceso.** El archivo contiene la installed base de toda EMEA y se ejecuta en
> el navegador de quien lo abre. Cualquiera puede elegirse otro nombre de la
> lista y ver otro cluster.

Esto se decidió a sabiendas —ver
`docs/decisiones/0001-un-archivo-con-tabla-de-usuarios.md`— y **no debe
describirse como acceso restringido ante nadie que dependa de esa
afirmación**. Está dicho en la pantalla de Settings, tarjeta *Who you are
working as*. · OBSERVED · `#cardScope`

## Comportamiento actual, con estado de evidencia

### La tabla de usuarios

`DEFAULT_USERS`, siete personas, con el cluster que planifica cada una.
· OBSERVED · `business_plan_tool.html` §QUIÉN ABRE LA HERRAMIENTA

| Correo | Nombre | Rol | Alcance |
|---|---|---|---|
| NPohardy@ITS.JNJ.com | Nicolas Pohardy | director | EMEA · planifica France, Benelux |
| SYanikog@ITS.JNJ.com | Serdar Yanikoglu | manager | CEEMA |
| MDonoho1@ITS.JNJ.com | Micheál Donohoe | manager | UK & Ireland |
| MCasti62@ITS.JNJ.com | Miguel Castillo | manager + `admin:true` | Iberia |
| AKendir@ITS.JNJ.com | Zekai Kendir | manager | DACH |
| TKrody@ITS.JNJ.com | Thomas Krody | manager | Nordics |
| ececchi1@ITS.JNJ.com | Enrico Cecchinato | manager | Italy |

El reparto UK/IE y Francia/Benelux está razonado en
`docs/decisiones/0002-reparto-de-clusters.md`.

### Ver y planificar son cosas distintas

- `clusters:'*'` → **qué ve**. `seesAll(u)` es cierto y no hay recorte.
- `plans:[...]` → **qué planifica**. Solo lo usa el director, para los clusters
  que no son de ningún manager. · OBSERVED · `plansScope()`, `planningScope()`

Si `'*'` contara también como planificar, `scopeAudit()` no encontraría nunca un
hueco y dejaría de servir para lo único que hace. · OBSERVED

### El recorte

- **C-ALC-001.** El recorte se aplica **una sola vez**, en `buildRecords()`,
  sobre `S.rows`. No se filtra pantalla a pantalla. · OBSERVED
- **C-ALC-002.** `S.raw` se conserva **entera y con sus índices**: hace falta
  para cambiar de usuario sin recargar los archivos y para que el director
  consolide. · OBSERVED
- **C-ALC-003.** `S.fleet` guarda el número de registros antes del recorte.
- **C-ALC-004.** El orden importa: primero se construye la flota entera
  —`applyFx()`, `attachBundle()`, `classify()`— y **después** se recorta. Al
  revés, los registros de fuera del alcance quedan sin bundle ni tipo de cambio
  y el comparador del ASP compara contra cifras a medias. · OBSERVED
- **C-ALC-005.** El resumen del Service Reclass se recorta con él
  (`scopeReclass()`), por **país**, no por serie. Una serie del Reclass sin
  equipo en la installed base es un defecto que el manager debe ver, si es de un
  país suyo. · OBSERVED
- **C-ALC-006.** Consolidar levanta el recorte: `S.consol` ⇒ sin filtro. Un
  archivo consolidado es de EMEA lo monte quien lo monte. · OBSERVED

### La excepción: el comparador del ASP

**C-ALC-007.** El ASP compara contra **la flota entera** (`aspFleet()` →
`S._fleetRows`), no contra el alcance. Comparar Iberia consigo misma devuelve
precio ≈ 0 y mezcla ≈ 0, y la pantalla sigue funcionando mientras no dice nada.
· OBSERVED

**C-ALC-008.** Bajo alcance, esa comparación es **solo en agregado**: medias por
plataforma y cobertura. La liga por país y su selector se ocultan
(`aspAggregateOnly()` → `body.asp-agg`), porque enumeran cuentas una a una.
· OBSERVED

### Identificarse, y dejar de estarlo

- **C-ALC-009.** Al plan se entra **con nombre**, por las dos puertas:
  `continueToPlan()` y `restoreSession()`. Poner la comprobación en una sola
  deja la otra abierta. · OBSERVED
- **C-ALC-010.** `setUserByEmail()` acepta la dirección escrita, **sin
  distinguir mayúsculas** y recortando espacios. Una dirección que no está en la
  tabla lo dice y no cambia la identidad actual. · OBSERVED
- **C-ALC-011.** `signOut()` devuelve a la pantalla de inicio y borra la
  identidad. **No borra el trabajo**: sigue en este navegador y vuelve al
  entrar. Borrarlo es *Discard* o *Clear everything*. · OBSERVED
- **C-ALC-012.** Sin identidad no hay alcance, así que quedarse sin nombre
  mostraría **más**, no menos. Por eso C-ALC-009 es una invariante y no una
  comodidad. · OBSERVED

### Consolidar

**C-ALC-013.** `canConsolidate()` es cierto para `role` director o admin, **o**
para `admin:true`. Lo último separa administrar de ver: Miguel consolida sin
perder su recorte de Iberia. · OBSERVED

## Invariantes

- **I-ALC-001.** Ninguna pantalla, exportación ni informe lee de una fuente sin
  recortar salvo `aspFleet()`, y esa solo en agregado.
- **I-ALC-002.** Un plan guardado por un manager lleva **solo sus filas**
  (`stateBlob(true)` con `rawIdx`).
- **I-ALC-003.** Toda pantalla nueva que enumere cuentas debe colgar de
  `S.rows`. Si necesita la flota, tiene que justificar por qué y quedarse en
  agregado.

## No objetivos

- No se pretende impedir que alguien mire otro cluster. Ver el recuadro de
  arriba.
- No se autentica a nadie: no hay contraseña ni servidor que la compruebe.

## Incógnitas

- **U-ALC-001.** La tabla está escrita en el código. Un cambio de persona exige
  editar el archivo y repartirlo otra vez. No hay proceso para eso.
- **U-ALC-002.** `S.st.users` permitiría una tabla guardada en el plan, pero no
  hay pantalla que la escriba. · OBSERVED · `users()`

## Historial de cambios

- 2026-09-15 · Anclaje inicial. Contratos extraídos de los commits 2e6611e,
  5f8e31c, b8d0df6 y 34966d3, escritos después de los cambios: deuda documental
  reconocida en `bootstrap-report.md`.

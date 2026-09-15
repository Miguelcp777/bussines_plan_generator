---
type: global-spec
status: draft
last_reviewed: 2026-09-15
---

# Producto y método de previsión

## Propósito

Para qué sirve la herramienta y cuáles son las reglas de cálculo que no se
pueden cambiar sin cambiar el plan de negocio que produce.

## Qué es

Previsión **de abajo arriba** del ingreso de mantenimiento a partir de la
installed base: línea base, riesgo, oportunidad y escenarios, equipo por equipo,
para el ciclo de negocio (BP / JU / NU) de un año. · OBSERVED

Quien la usa es un supervisor de servicio técnico construyendo el business plan
de sus países. La salida es un informe imprimible, un libro de Excel y un plan
en `.json`. · OBSERVED

## Comportamiento actual, con estado de evidencia

### La línea base es proporcional al tiempo

**C-PRD-001.** El valor de un registro se pondera por los **meses activos**
dentro del año del BP: `valor × meses ÷ 12`. `baseWindow()` devuelve la ventana
`{first, last}` en 1..12, o `null` si el registro no aporta. · OBSERVED

**C-PRD-002.** Un contrato que empieza dentro del año arranca en su mes de
inicio; uno que empieza después, no cuenta. · OBSERVED

**C-PRD-003.** Dos tratamientos para lo que vence dentro del año, y es un ajuste
de Settings, no una constante: · OBSERVED

| Base | Qué hace |
|---|---|
| `continuation` | asume renovación y reserva el año entero; la no renovación se recoge como riesgo ponderado |
| `contractual` | reconoce solo hasta la fecha de fin |

`continuation` es lo que dice el apéndice A de la metodología; `contractual` es
la vista conservadora de finanzas.

**C-PRD-004.** Lo vencido hace más de `stExpM` meses queda **fuera** de la línea
base y se informa aparte como oportunidad de recuperación. · OBSERVED

### Las decisiones llevan fecha

**C-PRD-005.** Cualquier decisión —`lost`, `uninstall`, `risk`, `upgrade`, o una
renovación con probabilidad menor que 100— admite **mes y año del suceso**, y el
motor pondera desde ahí. No es solo para `lost` y `uninstall`. · OBSERVED ·
`eventPoint()`, `datedDecision()`

**C-PRD-006.** Sin fecha explícita hay una derivada: el mes que toque por estado
o el siguiente al fin de contrato. `eventPoint()` marca `set:false` cuando la ha
deducido. · OBSERVED

### El ASP se compara como con como

**C-PRD-007.** El ASP se compara **por plataforma × cobertura**, no en conjunto:
un Total Advantage en un Excimer no vale lo mismo que en un Femtolaser.
· OBSERVED

**C-PRD-008.** El ASP incluye los contratos **bundle**. · OBSERVED

**C-PRD-009.** `aspLikeForLife`/`aspLikeForLike` descompone la diferencia en
**precio** y **mezcla**. Medido sobre datos reales de Iberia: el sobreprecio
bruto de +51,5 % es +3,7 % a mezcla constante. · VERIFIED · sesión anterior,
datos reales

### Subir de cobertura

**C-PRD-010.** El objetivo por defecto de un upgrade es **un peldaño más alto en
la escalera comercial**, no el que salga de ordenar por ASP:

```
T&M → WARR → EXTWARR → PPF → ValueAdvantage → SecureAdvantage → TotalAdvantage
```

Ordenar por ASP ponía SecureAdvantage por encima de TotalAdvantage —artefacto de
mezcla de los femtoláseres— y proponía **bajar** un Secure a EXTWARR.
· OBSERVED · `TIER_LADDER`

**C-PRD-011.** El incremento es la **diferencia entre peldaños**, medida al
mismo alcance y con al menos tres contratos a cada lado. La versión por
proporción ponía 44.525 $ sobre un ValueAdvantage de 2.724 $. · OBSERVED ·
`tierGap()`

### Pérdida por registro

**C-PRD-012.** Un equipo en riesgo **difiere su pérdida a la entrada del
registro de riesgos** que lo enlaza. `recordLoss()` sigue el enlace
(`riskCarrier()`), y por eso las tablas por equipo cuadran con el total del
motor. Sin eso, la sección 4 del informe decía «none this year» teniendo riesgo
registrado. · OBSERVED

## Invariantes

- **I-PRD-001.** Las tablas por equipo deben sumar exactamente el total del
  motor. Si no cuadran, el informe está mal, no la suma.
- **I-PRD-002.** Ningún cambio de cálculo entra sin decir sobre qué población se
  midió.
- **I-PRD-003.** Los exportables (Excel, CSV, informe) salen de la misma
  población que la pantalla.

## No objetivos

- No es una herramienta de facturación ni de conciliación contable. Estima.
- No sustituye la metodología; la implementa.

## Incógnitas

- **U-PRD-001.** La conciliación con los datos reales —7.058.238 $ directos,
  5.290.140 $ bundle sobre 720 equipos emparejados— se hizo en una sesión
  anterior, **antes** de los cambios de esta. No se ha vuelto a comprobar.
- **U-PRD-002.** No hay pruebas automatizadas del motor. Todo lo verificado es
  por inspección en el navegador.

## Historial de cambios

- 2026-09-15 · Anclaje inicial. Contratos del commit 741e9c8 y anteriores.

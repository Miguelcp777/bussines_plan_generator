---
type: global-spec
status: draft
last_reviewed: 2026-09-15
---

# Entrega y consolidación

## Propósito

Cómo cada manager entrega su plan y cómo el director los junta sin que la
entrega de hoy borre la de ayer.

## Comportamiento actual, con estado de evidencia

### Una entrega lleva decisiones, no datos

**C-ENT-001.** `exportSubmission()` llama a `stateBlob(false)`: **sin `raw`**.
Todos parten del mismo archivo con los mismos equipos, así que el director ya
los tiene y absorber es pegar decisiones a equipos que ya están ahí. Medido
sobre datos sintéticos: ~3 KB por entrega. · VERIFIED · navegador, 34966d3

**C-ENT-002.** El sello `b.submission` lleva: `user`, `email`, `role`,
`cluster`, `countries`, `cycle`, `revision`, `submittedAt`, `app`, y los
recuentos de filas, decisiones y registros. · OBSERVED

**C-ENT-003.** Una entrega incrementa `S.st.subRev` y **congela una versión**
(`Submitted rN`), para que lo que se toque después se vea contra lo entregado.
· OBSERVED

**C-ENT-004.** `submissionBlockers()` impide entregar con una entrada de
registro **sin país y sin equipo**: el motor la considera del conjunto completo,
así que al consolidar se aplicaría a EMEA entera. · OBSERVED

### Absorber suma, no sustituye

**C-ENT-005.** Las entregas **no se solapan** —cada manager decide sobre sus
equipos— así que `absorb()` añade en vez de reemplazar. El código anterior
(`applyBlob`) sustituía cada colección entera y la segunda entrega borraba la
primera. · VERIFIED · Iberia + Italia, ambas presentes tras la segunda

**C-ENT-006.** Los ids de registro **chocan entre managers**: todos nacen como
`'R' + Date.now()` y el primero de cada uno suele ser el mismo. Se prefijan por
cluster (`iberia:R1`, `italy:R1`) porque `delRisk` y `editRisk` resuelven por
igualdad de cadena y una colisión borraría la entrada equivocada. · VERIFIED

**C-ENT-007.** Cada absorción anota exactamente qué entró —`decKeys`, `regIds`,
`versionIds`— para poder retirarla sin rehacer la consolidación entera.
· OBSERVED · `S.consol.absorbed[]`

**C-ENT-008.** `absorbRemove(cluster)` deshace **solo** lo de ese cluster.
· VERIFIED · retirar Italia deja Iberia entera

**C-ENT-009.** Una revisión (`replace:true`) retira lo anterior de ese cluster y
mete lo nuevo. · VERIFIED · r2 de Iberia cambia lo suyo y no toca Italia

### Lo que impide absorber

`absorbCheck()` devuelve `stop` (bloquea) y `warn` (avisa). · OBSERVED

| Situación | Resultado |
|---|---|
| No parece un plan de esta herramienta | stop |
| Ciclo distinto del que se consolida | stop |
| Pisa países de un cluster ya absorbido | stop, nombrando los países |
| Columnas remapeadas respecto a las del director | stop |
| Decisiones que ya vinieron de otro cluster | stop |
| Ese cluster ya está absorbido | se ofrece sustituir por la revisión |
| Sin sello de entrega | warn: se absorbe como plan suelto |
| Decisiones que no encajan con ningún equipo | warn: se hizo sobre otro extracto |

· VERIFIED · los cinco `stop` probados en el navegador

**C-ENT-010.** El remapeo de columnas se **rechaza**, no se apaña:
`buildRecords` tiene un solo `S.map` global, así que las filas de ese cluster se
leerían de otra columna. · OBSERVED

### Lo que el director ve

**C-ENT-011.** Tabla de quién ha entregado, con revisión, fechas, equipos y
esperado; y debajo, los clusters que **faltan**. · OBSERVED

**C-ENT-012.** `restateCluster()` recalcula lo de cada cluster **con los ajustes
del director** y lo enseña al lado de lo entregado. Es lo que evita la discusión
de «a mí me salía otra cifra». Salva y restaura `S.st`/`S.tog` alrededor, porque
`engine()` los lee globalmente. · OBSERVED

**C-ENT-013.** Lo que el director planifica en mano (`plans`) entra en el total
con una fila propia, marcada *planned directly — no submission*. Sin ella,
Francia y Benelux se caían del total de EMEA sin avisar. · VERIFIED · 11.000 +
34.000 = 45.000 sobre 4 equipos

## Invariantes

- **I-ENT-001.** Absorber nunca debe reducir lo ya absorbido de otro cluster.
- **I-ENT-002.** Todo id que entre por una entrega va con espacio de nombres del
  cluster.
- **I-ENT-003.** El total consolidado incluye lo absorbido **más** lo que el
  director planifica directamente.

## Incógnitas

- **U-ENT-001.** No hay fecha de corte en el código. El ciclo se comprueba
  (`BP2026` vs `BP2027`), la fecha límite no.
- **U-ENT-002.** Nada valida que la entrega venga de la persona que dice ser. El
  sello es declarativo, como todo lo demás (ver `alcance-y-usuarios.spec.md`).
- **U-ENT-003.** No probado con entregas reales de más de dos clusters.

## Historial de cambios

- 2026-09-15 · Anclaje inicial. Contratos extraídos del commit 2e6611e.

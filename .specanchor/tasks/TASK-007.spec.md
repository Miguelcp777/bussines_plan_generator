---
type: task-spec
id: TASK-007
status: verified
---

# Task: un 0 no es un campo vacío, y el aviso no dice cuál falta

## Petición, alcance y comportamiento actual

Miguel, con el formulario relleno: «¿por qué no me deja añadir la oportunidad?»

La oportunidad era *Ircovision Murcia · Catalys in Warranty · abril 2027 · 25 %*
con **Annual value = 0** —un equipo en garantía, que todavía no genera contrato—
y la aplicación respondía:

> Customer, annual value, start month/year and probability are all required

Con los cinco campos rellenos a la vista. La causa:

```js
if (!cust || !val || !mon || !yr || !p)
```

`val` es `0`, que es *falsy*, así que el código lo trata como no rellenado. Es
el mismo patrón que TASK-006 arregló en la probabilidad de las entradas de
riesgo: **tratar el cero como ausencia**.

Y el mensaje enumera cuatro campos sin decir cuál es el que falla, que es lo que
convierte un fallo de un segundo en cinco minutos de probar a ciegas.

**Está en los tres registros**, no solo en oportunidades:

| Función | Línea | Rechaza 0 en |
|---|---|---|
| `addRisk` | 4709 | valor, probabilidad |
| `addOpp` | 4848 | valor, probabilidad |
| `addTm` | 5001 | importe, confianza |

Las vistas previas (`calcRisk`, `calcOpp`, `calcTm`) hacen lo mismo: con un 0 no
enseñan nada, así que tampoco avisan de que la entrada no va a sumar.

## Resultado deseado y aceptación

- **TASK-007/REQ-001:** Un `0` en valor o probabilidad es un dato, no un campo
  vacío. Se acepta.
- **TASK-007/REQ-002:** El aviso nombra **exactamente** los campos que faltan.
- **TASK-007/REQ-003:** Mes y año se validan como lo que son: mes de 1 a 12, año
  con cuatro cifras. Ahí un 0 sí es ausencia.
- **TASK-007/REQ-004:** Una entrada que va a aportar $0 se acepta, pero se dice
  en la vista previa. Registrarla es un acto de seguimiento; que no suma al plan
  tiene que verse.
- **TASK-007/REQ-005:** Lo que ya se aceptaba se sigue aceptando igual.

- **TASK-007/AC-001:** La oportunidad de Miguel, tal cual —valor 0, 25 %, abril
  2027— entra en el registro.
- **TASK-007/AC-002:** Dejando el cliente vacío, el aviso dice *customer*, y no
  los otros cuatro.
- **TASK-007/AC-003:** Sin mes, el aviso dice *start month*.
- **TASK-007/AC-004:** Con valor 0, la vista previa dice que aportará $0.
- **TASK-007/AC-005:** Una oportunidad normal (valor y probabilidad > 0) entra y
  pondera igual que antes.

## Anclajes afectados

`business_plan_tool.html` → `modules/bp-builder.spec.md` (C-REG-001).

## Evidencia de verificación

| Requisito | Aceptación | Verificación | Resultado real | Evidencia |
|---|---|---|---|---|
| REQ-001 | AC-001 | Su oportunidad exacta | **pass** — entra | EV-001 |
| REQ-002 | AC-002 | Cliente vacío | **pass** — nombra *customer* | EV-002 |
| REQ-003 | AC-003 | Mes vacío | **pass** — nombra *start month* | EV-002 |
| REQ-004 | AC-004 | Vista previa y aviso con 0 | **pass** | EV-003 |
| REQ-005 | AC-005 | Una oportunidad normal | **pass** — $12.000 al 25 % → $2.250 | EV-004 |

- **EV-001:** *Ircovision Murcia · Catalys · abril 2027 · 25 % · valor 0* entra en
  el registro con `usd:0, prob:25, 4/2027`.
- **EV-002:** Sin cliente: «customer is required — fill it in and try again».
  Sin mes: «start month is required». Con dos campos fuera: «Still missing:
  customer, start month».
- **EV-003:** Vista previa: «Logged at $0 — nothing is added to the plan until
  this has an annual value». Aviso al añadir, lo mismo. Con probabilidad 0:
  «Opportunity logged at 0% — it adds nothing to 2027 until it has a
  probability».
- **EV-004:** $12.000 al 25 % desde abril de 2027 → ponderado **$2.250**
  (12.000 × 0,25 × 9/12). Igual que antes del cambio.

## Un tercer fallo, encontrado al verificar

Al aceptar el 0, el aviso de «añadida» decía *«no revenue in 2027, it starts
after year end»* para una oportunidad de abril de 2027 — culpaba a la fecha
cuando el problema era el importe. Un cero puede venir de tres sitios y mandar a
corregir el que no es cuesta el mismo rato que el fallo original. Ahora distingue
los tres.

## Revisión final

- **Cobertura documental:** PASS
- **Spec → Code:** ALIGNED — C-REG-001 y 002 describen lo implementado.
- **Code → Spec:** ALIGNED — el motor no se toca; lo que cambia es qué entra al
  registro y qué se dice al rechazarlo.

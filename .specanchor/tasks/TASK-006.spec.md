---
type: task-spec
id: TASK-006
status: verified
---

# Task: la entrada de riesgo deja de seguir al equipo justo cuando el equipo dice que no hay riesgo

## Petición, alcance y comportamiento actual

Miguel, con su plan `BP2026_Iberia_09162026.json`: «el equipo de andorra con un
riesgo a 100 lo pone como gross revenue at risk, pero no en weighted expected
lost, está a 0».

Reproducido cargando **su archivo**:

| | |
|---|---|
| Equipo | MIRANZA INVERSIONES OFT S.L · serial `1109-70050` · **AD** |
| Contrato | FEM - SA, SecureAdvantage, termina **31/1/2027** |
| Valor | $27.952 al año · clase `secured` |
| Decisión guardada | `{ st:'risk', prob:100, note:'Non-renewal — price' }` |
| Entrada de registro | prob **51 %**, $27.952, evento **2/2027**, `auto`, sin editar |
| Ponderado | **$0** · meses dentro de 2026: **0** |

Hay **dos** causas, no una, y solo la segunda es un defecto.

**Causa 1 · el evento cae en febrero de 2027.** El contrato vive entero durante
2026 y termina el 31 de enero de 2027, así que la no renovación ocurre en 2027.
En el BP2026 no se pierde nada, con cualquier probabilidad. Correcto.

**Causa 2 · la entrada guarda una probabilidad que el equipo ya no sostiene.**
El campo del equipo es **«Renew %»** y está a **100**: renueva seguro, riesgo
cero. La entrada, sin embargo, sigue marcando **51 %** — el valor que tenía
cuando ese campo estaba a 49. El culpable:

```js
e.prob = lossProb || e.prob;     // 0 es falsy: nunca se propaga
```

**Y al revés es peor.** Comprobado sobre el mismo equipo: con el evento movido a
marzo de 2026 y «Renew %» a 0, el registro descuenta $23.294 — correcto. Al
devolver «Renew %» a 100, la entrada **se queda en 100 % y sigue descontando
$23.294**. Es decir: la entrada puede **sobrestimar** la pérdida y no hay forma
de bajarla desde el equipo.

**Causa 3, de nombre.** En una fila marcada *At risk*, un campo llamado
«Renew %» puesto a 100 significa riesgo cero. Se lee como «riesgo al 100».

## Resultado deseado y aceptación

- **TASK-006/REQ-001:** Una entrada automática sigue al equipo **también cuando
  la probabilidad de pérdida baja a cero**.
- **TASK-006/REQ-002:** Un equipo marcado *At risk* con «Renew %» a 100 es una
  contradicción, y se dice: en la entrada y al teclearlo.
- **TASK-006/REQ-003:** Las entradas editadas a mano (`manual`) siguen sin que
  nadie las toque.
- **TASK-006/REQ-004:** El motor no cambia.

- **TASK-006/AC-001:** Con el equipo de Andorra y el evento en marzo de 2026:
  «Renew %» 0 → descuenta $23.294; devolverlo a 100 → **descuenta $0**, no
  $23.294.
- **TASK-006/AC-002:** La entrada de una contradicción así se ve marcada en el
  registro.
- **TASK-006/AC-003:** Una entrada con `manual:true` conserva su probabilidad.
- **TASK-006/AC-004:** Cargando el plan de Miguel tal cual, la base sigue siendo
  la suya y el ponderado sigue siendo $0 — por la causa 1, que es correcta.

## Anclajes afectados

`business_plan_tool.html` → `modules/bp-builder.spec.md`, sección del registro
de riesgos (C-RISK-005).

## Evidencia de verificación

| Requisito | Aceptación | Verificación | Resultado real | Evidencia |
|---|---|---|---|---|
| REQ-001 | AC-001 | Subir y bajar «Renew %» sobre su equipo | **pass** | EV-001 |
| REQ-002 | AC-002 | Leer la entrada en el registro | **pass** | EV-002 |
| REQ-003 | AC-003 | Entrada `manual` y repetir | **pass** — conserva su 77 % | EV-003 |
| REQ-004 | AC-004 | Cargar su plan sin tocar nada | **pass** | EV-004 |

- **EV-001:** Sobre `1109-70050`, con el evento movido a marzo de 2026:

  | Paso | prob de la entrada | ponderado |
  |---|---:|---:|
  | Renew % 100 | **0** | $0 |
  | Renew % 0 | 100 | **$23.294** |
  | Renew % 100 otra vez | **0** | **$0** |
  | Renew % 40 | 60 | $13.976 |

  Antes del cambio, el tercer paso se quedaba en 100 % y seguía descontando
  $23.294. Ahora baja. El cuarto confirma la proporción: 23.294 × 0,6 = 13.976.
- **EV-002:** En el registro, sobre la entrada: «⚠ This system is flagged At risk
  but its Renew % is 100 — the record says it will renew, so nothing is
  weighted. Lower Renew % on the installed base row to make this count.» Y al
  teclear el 100, el aviso equivalente.
- **EV-003:** Con `manual:true` y prob 77, bajar «Renew %» a 0 deja la entrada
  en **77**.
- **EV-004:** Cargando `BP2026_Iberia_09162026.json` tal cual: 412 registros,
  base **$2.920.989**, entrada con evento 2/2027 y ponderado **$0** — por la
  causa 1, que es correcta.

## Lo que sigue siendo cero, y está bien

El equipo de Andorra termina el **31 de enero de 2027**. Durante todo 2026 el
contrato está vivo y cobra, así que la no renovación no le cuesta nada a
BP2026 — con cualquier probabilidad. Es un riesgo de BP2027.

## Revisión final

- **Cobertura documental:** PASS
- **Spec → Code:** ALIGNED — C-RISK-005 describe lo implementado.
- **Code → Spec:** ALIGNED — `engine()`, `eventMonths()` y `recordLoss()` no se
  tocan; lo que cambia es qué probabilidad recibe la entrada.

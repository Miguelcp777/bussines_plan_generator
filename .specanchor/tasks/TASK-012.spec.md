---
type: task-spec
id: TASK-012
status: verified
---

# Task: las banderas dentro del archivo

## Petición, alcance y comportamiento actual

Miguel: «incrusta los svg en el archivo». Viene de TASK-011/AC-007, que quedó en
rojo: pedidas al CDN, las banderas **no se imprimían** —el PDF salía con cero
imágenes en las secciones con columna de país—.

## Por qué no se incrustan los SVG, que es lo que se pedía

Medido antes de decidir: los 87 SVG oficiales de EMEA suman **653 KB**, y no por
igual. La mediana son **302 bytes**; el peso está en los escudos — Serbia 180 KB,
España 89, Montenegro 61, Croacia 40, Turkmenistán 38. Incrustarlos habría
sumado más que la aplicación entera.

Y a **18 píxeles**, que es el tamaño al que se enseña una bandera en una tabla,
el escudo de España ocupa unos tres píxeles.

Así que van **rasterizadas a PNG de 48×36**: **57 KB las ochenta y siete**, el
escudo todavía visible, y la fidelidad de la original porque las rasteriza un
motor de PDF — no están dibujadas a mano. Un color inventado en la bandera de un
país es la clase de detalle que se nota en una reunión.

## Aceptación

- **TASK-012/AC-001:** El archivo no pide ninguna bandera a la red.
- **TASK-012/AC-002:** Las banderas **se imprimen**.
- **TASK-012/AC-003:** El crecimiento del archivo se queda en decenas de KB.
- **TASK-012/AC-004:** Un país fuera del juego no deja hueco: queda su código.

## Evidencia de verificación

| Aceptación | Verificación | Resultado real |
|---|---|---|
| AC-001 | Buscar el CDN de banderas en el archivo | **pass** — 0 apariciones |
| AC-002 | Generar el PDF y mirarlo | **pass** — ver abajo |
| AC-003 | Tamaño antes y después | **pass** — 530 → 604 KB |
| AC-004 | `bandera()` con un código no incluido | **pass** — devuelve cadena vacía y queda el código |

- **EV-001:** Las 87 banderas de los clusters descargadas y rasterizadas con
  PyMuPDF a 48×36. Comprobadas a ojo las tres más difíciles: España con su
  escudo, el Reino Unido con la unión, y Serbia —la más pesada, 180 KB de
  trazados— con su águila.
- **EV-002:** PDF generado con Chrome headless: **2 imágenes incrustadas**, en
  la página de *Systems at risk*. Recortada y mirada: la bandera de Andorra sale
  junto a «AD» en la fila de MIRANZA. Antes, cero.
- **EV-003:** 530 KB → **604 KB**. Las banderas son 57 KB de base64.

## Revisión final

- **Cobertura documental:** PASS
- **Spec → Code:** ALIGNED
- **Code → Spec:** ALIGNED — cierra TASK-011/AC-007, que quedaba en rojo.

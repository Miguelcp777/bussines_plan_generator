---
type: task-spec
id: TASK-016
status: verified
---

# Task: el icono del archivo, J&J y no Chrome

## Petición

Miguel: «quiero que la miniatura del archivo no sea el logo de chrome, quiero el
logo de J&J como miniatura».

## Comportamiento actual, y el límite que hay que decir antes de nada

**La pestaña del navegador ya es J&J** desde TASK-002: el `<link rel="icon">` de
la línea 7 lleva el monograma en SVG dentro del propio archivo, en rojo
`#EB1700`. Comprobado rasterizándolo: se lee a 16, 32 y 64 px.

Lo que se ve con el logotipo de Chrome es **el icono del archivo en el
Explorador**, y ese no se puede cambiar desde dentro del archivo. Windows no
genera miniatura para un `.html`: le pone el icono del **tipo de archivo**, que
sale de la asociación del registro y hoy apunta a Chrome. Es por extensión, no
por archivo — ningún documento en NTFS lleva icono propio.

Así que la petición, tal y como está escrita, **no tiene respuesta para el
`.html`**. Lo que sí la tiene es un acceso directo, que es un objeto distinto y
sí admite icono.

## Qué se entrega

- **`business_plan_tool.ico`** — el mismo monograma, sobre teja roja y en
  blanco, con los siete tamaños que pide Windows (16 a 256). Sobre teja porque
  a 16 px el trazo suelto en rojo casi no se ve contra el blanco del Explorador,
  y porque ese icono compite en una carpeta con otros.
  El archivo **ya estaba referenciado** por `build_exe.spec` (`_ico =
  'business_plan_tool.ico'`) y no existía, así que el ejecutable salía con el
  icono genérico de PyInstaller. Esa referencia colgando queda cerrada.
- **`Business Plan Tool.lnk`** — acceso directo al `.html` con ese icono.
  **No se versiona**: un `.lnk` guarda la ruta absoluta de esta máquina y en
  otra apunta a un sitio que no existe.

## Resultado deseado y aceptación

- **TASK-016/REQ-001:** Existe un `.ico` de marca con los tamaños de Windows.
- **TASK-016/REQ-002:** El acceso directo abre la herramienta y se ve con el
  monograma, no con el logotipo de Chrome.
- **TASK-016/REQ-003:** El `.html` no se toca y ninguna cifra cambia.

- **TASK-016/AC-001:** Los siete subiconos del `.ico` son el monograma, cada uno
  a su tamaño.
- **TASK-016/AC-002:** El icono que el shell asigna al `.lnk` es el monograma, y
  el que asigna al `.html` sigue siendo el de Chrome.
- **TASK-016/AC-003:** El destino del acceso directo existe.

## Evidencia de verificación

| Requisito | Aceptación | Verificación | Resultado real | Evidencia |
|---|---|---|---|---|
| REQ-001 | AC-001 | Subiconos extraídos del `.ico` | **pass** | EV-001 |
| REQ-002 | AC-002 | `ExtractAssociatedIcon` sobre los dos archivos | **pass** | EV-002 |
| REQ-002 | AC-003 | `WScript.Shell`, destino del `.lnk` | **pass** | EV-003 |
| REQ-003 | — | `git diff` del `.html` | **pass** | EV-004 |

- **EV-001:** `IcoFile.sizes()` devuelve 16, 24, 32, 48, 64, 128 y 256, y los
  siete extraídos y mirados son el monograma legible. Al primer intento **no lo
  eran**: ver abajo.
- **EV-002:** `ExtractAssociatedIcon` sobre los dos archivos de la carpeta, uno
  al lado del otro: el `.lnk` sale con la teja roja —con la flecha de acceso
  directo que pone Windows encima—; el `.html`, con el logotipo de Chrome. Esa
  segunda mitad no es un fallo, es la demostración del límite de arriba.
- **EV-003:** `TargetPath` apunta al `.html` de esta carpeta y `Test-Path` da
  cierto.
- **EV-004:** `business_plan_tool.html` no aparece en el diff.

## Un fallo mío, encontrado al verificar

El primer `.ico` llevaba siete recortes de la esquina superior izquierda en vez
de siete reducciones. `chrome --headless --window-size=16,16` sobre un SVG con
`width="512"` fijo **no lo escala: lo recorta**, porque lo que se está eligiendo
es el tamaño de la ventana, no el del dibujo. Se vio extrayendo los subiconos y
mirándolos; la hoja de comparación previa, hecha reduciendo con LANCZOS, salía
bien y habría dado el visto bueno a un archivo malo. Ahora los siete tamaños
salen de reducir el render de 512.

## Lo que sigue sin tener arreglo

- **En SharePoint tampoco.** El icono de una biblioteca de documentos también va
  por tipo de archivo, y un `.lnk` sincronizado apunta a una ruta local que en
  otro equipo no existe. Quien abra el `.html` desde allí seguirá viendo Chrome.
- **La flecha de acceso directo** se quita con un ajuste del registro que vale
  para todo el sistema. Es una decisión de la máquina de Miguel, no de esta
  herramienta, y no se toca desde aquí.
- **El ejecutable sí llevaría el icono**, y ahora tiene el `.ico` que le
  faltaba. Pero `dist/JJV_BusinessPlanTool.exe` es de mayo y envuelve una
  versión de la herramienta anterior a todo lo de estas dieciséis tareas:
  reconstruirlo es otra tarea, no un efecto secundario de esta.

## Revisión final

- **Cobertura documental:** PASS
- **Spec → Code:** ALIGNED — C-UI-004 describe el icono entregado.
- **Code → Spec:** ALIGNED — el motor y el `.html` no se tocan.

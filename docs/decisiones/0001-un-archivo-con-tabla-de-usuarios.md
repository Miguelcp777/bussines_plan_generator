# 0001 · Un archivo con tabla de usuarios, asumiendo que no aísla

**Fecha:** septiembre de 2026 · **Estado:** aceptada

## Contexto

La herramienta pasa de ser de una persona a usarla siete: un director y seis
managers de cluster, cada uno con sus países. La pregunta que hay que responder
antes de escribir nada es **dónde vive el archivo y qué ve cada uno**.

El punto de partida es una aplicación de un solo archivo HTML sin servidor. Esa
es su virtud —se abre y funciona, sin permisos de TI, sin despliegue— y es
también lo que fija el límite: **un archivo que contiene los datos de toda EMEA
no puede esconder ninguna parte de ellos**. Se ejecuta en el navegador de quien
lo abre; lo que el código no enseñe está igualmente dentro.

## Opciones

**A · Un archivo por manager.** Se parte la installed base y cada uno recibe
solo la suya. Aísla de verdad.

Pero obliga a producir y repartir siete archivos cada vez que cambia el
extracto, y el director necesita luego juntarlos. Miguel lo descartó
explícitamente: *«no quiero tener filas separadas»*.

**B · Un archivo con tabla de usuarios.** Todos reciben el mismo archivo; al
abrirlo, cada uno se identifica y la herramienta se acota a sus países.

Es cómodo y es honesto solo si se dice lo que es: cualquiera puede elegirse otro
nombre de la lista.

**C · Aplicación con servidor.** Existe el camino empezado:
`business_plan_tool_supabase.html`, con login y RLS. Aísla de verdad y resuelve
el reparto.

Pero convierte una herramienta que se abre en un servicio que se despliega, se
mantiene y necesita permisos.

## Decisión

**B**, con la limitación dicha en pantalla.

Se le explicó el reparto —que el alcance sería una comodidad de trabajo y no un
control de acceso— y eligió B a sabiendas.

## Consecuencias

- El alcance acota **de verdad** lo que se ve, se exporta y se imprime: el
  recorte está en el origen (`buildRecords`), no pantalla a pantalla. Como
  comodidad funciona.
- **No aísla.** Quien quiera mirar otro cluster puede.
- Por eso hay una regla que no se negocia: **esto no se describe como acceso
  restringido ante nadie que dependa de esa afirmación**. Está escrito en
  Settings, en la tarjeta *Who you are working as*, con esas palabras.
- Si algún día los datos tienen que estar restringidos de verdad, no se empieza
  de cero: se retoma C, que está escrito y parado. Ver
  `.specanchor/modules/variantes-y-legado.spec.md`, D-VAR-001.

## Lo que esta decisión no resuelve

- Dónde se aloja el archivo. La intención es SharePoint, **sin comprobar**: si
  lo descarga en vez de renderizarlo, hay que revisarlo.
- Qué pasa si dos personas editan a la vez. Hoy no hay concurrencia porque cada
  uno trabaja su copia y entrega un `.json`; eso es consecuencia de B, no un
  descuido.

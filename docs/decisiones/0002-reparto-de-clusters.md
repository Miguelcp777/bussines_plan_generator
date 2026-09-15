# 0002 · Quién planifica cada cluster

**Fecha:** 15 de septiembre de 2026 · **Estado:** aceptada
**Depende de:** `0001-un-archivo-con-tabla-de-usuarios.md`

## Contexto

La tabla de usuarios la dio Miguel con siete personas y su puesto. Al pasarla a
alcances aparecieron dos huecos que el puesto no resuelve.

## Problema 1 · UK/IE lo reclamaban dos

- Serdar Yanikoglu — *Field Service Manager, **CEEMA & UK/IE***
- Micheál Donohoe — *Supervisor **UK***

No es un detalle de nombres: **no pueden tenerlo los dos**. Al consolidar,
`absorbCheck()` rechaza una entrega que pise países de otra ya absorbida, así
que el segundo en entregar se queda fuera con un error que parece un fallo de la
herramienta.

### Decisión

**UK & Ireland es de Micheál.** Serdar lleva CEEMA sin UK/IE: CEE, Turquía,
Rusia y CIS, Oriente Medio y África.

Decidido por Miguel el 15 de septiembre de 2026, tras plantearle las tres
opciones —a Micheál, a Serdar, o partir GB e IE entre ambos—.

Cambiarlo es mover `'UK & Ireland'` de una lista de `clusters` a la otra.

## Problema 2 · Francia y Benelux no eran de nadie

Ningún puesto de la lista cubre FR, MC, NL, BE ni LU. Sin dueño, esos equipos no
entran en ningún plan y **desaparecen de la suma de EMEA sin que nadie lo note**
— que es justo la clase de fallo que no se ve hasta que falta dinero.

### Decisión

**Los planifica el director**, Nicolas Pohardy.

Decidido por Miguel el mismo día, sobre cuatro opciones: dejarlo sin dueño y que
la herramienta avise, al director, a Serdar junto con CEEMA, o esperar a un
nombre que faltase en la lista.

### Ver y planificar tuvieron que separarse

Nicolas ya tenía `clusters:'*'`, así que «ya los veía». No bastaba, por dos
motivos:

1. Si ver todo contara como planificarlo todo, `scopeAudit()` **no encontraría
   nunca un hueco** y dejaría de servir para lo único que hace.
2. La consolidación suma entregas, y el director no se manda un archivo a sí
   mismo: Francia y Benelux no llegaban al total.

Por eso hay dos campos distintos: `clusters` es **qué ve**, `plans` es **qué
responde**. Y la tabla de consolidación lleva una fila para lo que el director
planifica en mano, marcada *planned directly — no submission*, sin disfrazarla
de entrega.

## Reparto resultante

| Persona | Rol | Alcance |
|---|---|---|
| Nicolas Pohardy | director | EMEA · planifica France y Benelux |
| Serdar Yanikoglu | manager | CEEMA |
| Micheál Donohoe | manager | UK & Ireland |
| Miguel Castillo | manager + admin | Iberia |
| Zekai Kendir | manager | DACH |
| Thomas Krody | manager | Nordics |
| Enrico Cecchinato | manager | Italy |

## Consecuencias

- `scopeAudit()` avisa en Settings de cualquier país que quede sin dueño. Con la
  tabla actual y datos de nueve países no señala ninguno; con un equipo en China
  lo marca. Comprobado.
- **Miguel administra sin perder Iberia.** Como `role:'admin'` vería toda EMEA
  y perdería el recorte con el que trabaja, así que administrar y ver se
  separaron: `admin:true` da la consolidación y deja el alcance como está.
- La tabla vive en el código. Un cambio de persona exige editar el archivo y
  repartirlo otra vez; no hay proceso para eso, y está anotado como deuda
  (`U-ALC-001`).

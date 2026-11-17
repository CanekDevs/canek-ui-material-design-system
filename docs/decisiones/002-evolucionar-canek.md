# 002. Evolucionar este repo y conservar el nombre Canek

- Estado: Aceptada
- Fecha: 2026-11-17

## Contexto
El repo `@canek-ui/material-design-system` (v0.12.0) ya tiene 47 componentes `Cn*`, Storybook, tests y publicación en npm, pero con colores e Inter propios en lugar de Tabantaj.

## Decisión
Se trabaja sobre este repo. Se conservan el nombre del paquete, el prefijo `Cn` y la API pública. El cambio a Tabantaj se hace por tokens y tema, no renombrando.

## Consecuencias
- Quien ya usa el paquete recibe el estilo Tabantaj sin cambiar imports.
- La estructura de un solo paquete se mantiene; un monorepo solo se considerará si hace falta separar tokens en su propio paquete.

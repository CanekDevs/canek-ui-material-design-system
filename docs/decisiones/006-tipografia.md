# 006. Tipografía: roles M3 con valores y alias Tabantaj

- Estado: Aceptada
- Fecha: 2026-11-17

## Contexto
Tabantaj tiene unos 30 estilos con nombres propios (h1, page-title, card-title, body1, helper-text, table-head…) sobre Roboto. Canek usa Inter.

## Decisión
- Familia: Roboto, pesos 300/400/500/700 únicamente.
- Base de 15 roles M3 (displayLarge … labelSmall) con tamaños, pesos e interlineados tomados de Tabantaj.
- Los nombres Tabantaj quedan como alias que apuntan a un rol (por ejemplo card-title → un rol title).
- El mapeo exacto rol ↔ estilo Tabantaj se define al construir la capa sys y se documenta en el sitio.

## Consecuencias
- Se reemplaza Inter por Roboto en todo el paquete.
- `MuiTypography` expone las variantes por rol y los alias.

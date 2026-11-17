# 005. Color primary y rol brand

- Estado: Aceptada
- Fecha: 2026-11-17

## Contexto
Tabantaj usa dos azules: `color-action` (índigo `#3D5AFE`) en el botón Primary, y `color-brand-primary` (`#4870B2`) en navbar, marca y estado por defecto. MUI necesita un único `primary`.

## Decisión
- `primary` = `#3D5AFE` (action). Hover = `#304FFE`.
- Nuevo rol `brand` = `#4870B2`, `brand-dark` = `#3B5391`, `brand-light` = `#61A2E5`, para navbar, encabezados y elementos de marca.
- Estados: success `#4CAF50`, warning `#FFA000`, error `#F44336`, info `#039BE5` (valores Tabantaj).

## Consecuencias
- El `accent` actual de Canek (`#3D5AFE`) se vuelve `primary`; `accent` queda como alias deprecado.
- Se verifica el contraste de texto sobre cada rol al generar la capa sys.

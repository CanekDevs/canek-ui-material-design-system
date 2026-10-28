# @canek-ui/design-system

Design system de Canek. Componentes React sobre MUI 7 con tokens de diseño, theming unificado y API consistente.

## Instalación

npm install @canek-ui/design-system @mui/material @emotion/react @emotion/styled

React 18 y MUI 7 son peer dependencies.

## Uso

import { CanekThemeProvider, CnButton } from "@canek-ui/design-system";
import "@canek-ui/design-system/styles.css";

export function App() {
  return (
    <CanekThemeProvider mode="light">
      <CnButton variant="contained" color="primary">
        Guardar cambios
      </CnButton>
    </CanekThemeProvider>
  );
}

El import del CSS es obligatorio. Los tokens de diseño se exponen como CSS variables con prefijo `--cn-*` y los componentes los consumen.

## Componentes

| Componente | Estado | Desde |
| --- | --- | --- |
| CnButton | Estable | v0.1.0 |

## Temas

`CanekThemeProvider` acepta `mode`:

- `"light"` — tema claro (default)
- `"dark"` — tema oscuro

Los tokens de color están en `src/styles/tokens.css` y se pueden sobreescribir por proyecto:

```css
:root {
  --cn-color-brand-600: #3d5afe;
  --cn-radius-md: 6px;
}

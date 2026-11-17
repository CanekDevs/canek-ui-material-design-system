# 004. Fuente de verdad de los tokens

- Estado: Aceptada
- Fecha: 2026-11-17

## Contexto
Los valores de Tabantaj existen en tres lugares: el código de S4BTabantaj-frontend, el Figma Tabantaj DS y un `tokens.json` extraído de ambos el 4 nov 2026 (`develop@b7fe93e`).

## Decisión
La fuente de verdad es un JSON versionado en este repo (`tokens/tabantaj.tokens.json`), copiado de esa extracción. De él se generan las variables CSS y los objetos TS. Figma se sincroniza a partir del JSON, no al revés.

## Consecuencias
- Cambiar un color = cambiar el JSON + regenerar + PR.
- `src/styles/tokens.css` y `src/tokens/index.ts` pasan a ser archivos generados.

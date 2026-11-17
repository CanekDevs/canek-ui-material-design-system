# 003. MUI 7 + React 18 + TypeScript

- Estado: Aceptada
- Fecha: 2026-11-17

## Contexto

Los productos de S4B usan React + MUI 5 + TypeScript. El repo ya está en MUI 7 y las gráficas dependen de MUI X 9, que pide MUI 7.

## Decisión

El framework se queda en MUI 7. Los productos migran de MUI 5 a 7 al adoptarlo, con la guía y codemods oficiales de MUI.

## Consecuencias

- No se mantiene compatibilidad con MUI 5.
- La documentación incluirá una guía de migración de MUI 5 a Canek UI.

# 001. Tabantaj gobierna el estilo; M3 es estructura

- Estado: Aceptada
- Fecha: 2026-11-17

## Contexto
La investigación inicial planteaba un framework con reglas de Material Design 3 sobre MUI. S4B ya tiene un lenguaje visual propio y usado en producción: Tabantaj (guía de 158 colores, tipografía Roboto, componentes Tb*).

## Decisión
El estilo visual lo define Tabantaj. De M3 se toma solo la estructura: roles de color (`primary`, `on-primary`, `surface`…), nomenclatura de tokens en capas, modelo de estados, escala tipográfica por roles y criterios de accesibilidad. En cualquier choque de valores (forma, mayúsculas, tamaños, alturas, colores) gana Tabantaj.
Los componentes que existen en MUI y no en Tabantaj se diseñan con el lenguaje de Tabantaj.

## Consecuencias
- Los botones conservan 14 Medium en MAYÚSCULAS y radio 8 aunque M3 diga otra cosa.
- Cada excepción a M3 no necesita ADR propio: basta con que el valor venga de Tabantaj.
- Un valor que no exista en Tabantaj se deriva de su paleta y escalas, y se documenta en la ficha del componente.

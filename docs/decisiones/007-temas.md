# 007. Temas claro y oscuro

- Estado: Aceptada
- Fecha: 2026-11-17

## Contexto

Tabantaj solo tiene modo claro. Canek tiene un modo oscuro con sus propios colores.

## Decisión

Se soportan dos temas: claro (Tabantaj) y oscuro derivado de la paleta Tabantaj, que reemplaza al oscuro actual. No se incluyen por ahora contraste alto ni otras marcas.

## Consecuencias

- Cada token sys tiene valor claro y oscuro.
- Todo componente debe verse correcto en ambos temas sin cambiar código.

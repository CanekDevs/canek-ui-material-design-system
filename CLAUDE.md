# Canek UI — framework UI de S4B

Contexto para Claude Code y para el equipo. Responder siempre en español.
Las decisiones completas viven en `docs/decisiones/` (una por archivo). No volver a discutir lo decidido ahí; si algo debe cambiar, se escribe un ADR nuevo que reemplace al anterior.

## Qué es

`@canek-ui/material-design-system`: componentes React sobre **MUI 7** con tokens de diseño y tema unificado, para todos los productos de Silent4Business.

## Principio rector

**Tabantaj (S4B) gobierna el estilo.** Material Design 3 aporta solo la estructura: roles de color, estados, nomenclatura de tokens, escala tipográfica por roles y accesibilidad. Si Tabantaj y M3 chocan, gana Tabantaj (ADR 001).
Los componentes que MUI tiene y Tabantaj no se diseñan con el lenguaje visual de Tabantaj.

## Decisiones vigentes (resumen)

| # | Decisión |
|---|---|
| 001 | Tabantaj gobierna el estilo; M3 es estructura |
| 002 | Se evoluciona este repo (no se crea otro); se conservan nombre, paquete y prefijo `Cn` |
| 003 | MUI 7 + React 18 + TypeScript; los productos en MUI 5 migran al adoptarlo |
| 004 | Fuente de verdad de color/tipografía: `tokens/tabantaj.tokens.json` (extraído de S4BTabantaj-frontend `develop@b7fe93e` + Figma Tabantaj DS) |
| 005 | `primary` = action `#3D5AFE`; rol `brand` = `#4870B2` (navbar, títulos de marca), `brand-dark` = `#3B5391` |
| 006 | Tipografía Roboto 300/400/500/700; 15 roles M3 con valores Tabantaj y nombres Tabantaj como alias |
| 007 | Temas: claro (Tabantaj) y oscuro derivado de Tabantaj |
| 008 | Documentación: sitio propio generado desde el repo + Storybook como laboratorio |

## Arquitectura de tokens (objetivo)

Tres capas, cada una solo puede apuntar a la anterior:

1. **ref** — primitivos Tabantaj (rampas de color, tamaños, radios). Generados desde el JSON fuente.
2. **sys** — roles: `primary`, `on-primary`, `brand`, `surface*`, `on-surface*`, `outline*`, `success`, `warning`, `error`, `info`, tipografía por rol, forma, elevación, movimiento. Tienen valor para claro y oscuro.
3. **comp** — `--cn-comp-<componente>-<parte>-<estado>-<propiedad>`. Solo apuntan a `sys` o a dimensiones.

Se publican como variables CSS (`--cn-*`) y objetos TS tipados.

## Reglas no negociables

- Ningún componente usa hex, `rgb()` ni valores de color crudos: solo variables `sys`/`comp`. (Deuda actual: ~1,160 hex en 115 archivos; se eliminan componente por componente.)
- Todo componente interactivo define estados: enabled, hover, focused, pressed, selected, error, disabled (y dragged si aplica).
- Foco visible solo con `:focus-visible`.
- Tipografía: solo pesos 300/400/500/700 (regla Tabantaj). Botones 14 Medium en MAYÚSCULAS (regla Tabantaj).
- Un componente está terminado cuando: cambia claro→oscuro sin tocar código, no tiene hex, pasa axe y teclado en Storybook, tiene test y su ficha en la documentación.

## Convenciones del repo

Ver README → Convenciones (commits `tipo(scope): descripción - por: Nombre`, ramas `feature/…`, `type` sobre `interface`, funciones flecha, cero comentarios, cero emojis, alias `@/`, estructura `CnNombre/{CnNombre.tsx, .stories.tsx, .test.tsx, index.ts}`).

## Estado

Fase 0 — fundamentos (rama `feature/tabantaj-foundations`). Orden:
1. Copiar el JSON fuente de Tabantaj y generar la capa ref.
2. Definir la capa sys (claro + oscuro) y conectar `createCanekTheme()`.
3. Regla ESLint que prohíba color crudo en `src/components`.
4. Re-tematizar componentes uno por uno (piloto: CnButton y CnTextField).
5. Sitio de documentación.

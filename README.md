# @canek-ui/material-design-system

Design system de [Canek](https://canek.mx). Componentes React construidos sobre MUI 7, con tokens de diseño como CSS variables, theming unificado y API consistente. Consumido por todos los productos de Canek: `phobos-admin`, `phobos-storefront`, `kairos-admin`, `phobos-landlord`, entre otros.

[![npm version](https://img.shields.io/npm/v/@canek-ui/material-design-system.svg)](https://www.npmjs.com/package/@canek-ui/material-design-system)
[![CI](https://github.com/CanekDevs/canek-ui-design-system/actions/workflows/ci.yml/badge.svg)](https://github.com/CanekDevs/canek-ui-design-system/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

---

## Tabla de contenido

- [Instalación](#instalación)
- [Uso](#uso)
- [Componentes](#componentes)
- [Temas](#temas)
- [Tokens de diseño](#tokens-de-diseño)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Desarrollo](#desarrollo)
- [Convenciones](#convenciones)
- [Flujo de trabajo](#flujo-de-trabajo)
- [Publicación](#publicación)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## Instalación

```bash
npm install @canek-ui/material-design-system @mui/material @mui/icons-material @emotion/react @emotion/styled
```

React 18, MUI 7, `@mui/icons-material` y `@emotion/*` son **peer dependencies**. No se incluyen en el bundle del paquete, el consumidor debe instalarlas explícitamente.

Si usas pnpm:

```bash
pnpm add @canek-ui/material-design-system @mui/material @mui/icons-material @emotion/react @emotion/styled
```

Si usas yarn:

```bash
yarn add @canek-ui/material-design-system @mui/material @mui/icons-material @emotion/react @emotion/styled
```

---

## Uso

### Componente suelto

```tsx
import { CnButton } from "@canek-ui/material-design-system";
import "@canek-ui/material-design-system/styles.css";

export function SaveButton() {
  return (
    <CnButton variant="contained" color="primary">
      Guardar cambios
    </CnButton>
  );
}
```

### Aplicación completa con tema

```tsx
import { CanekThemeProvider, CnButton } from "@canek-ui/material-design-system";
import "@canek-ui/material-design-system/styles.css";

export function App() {
  return (
    <CanekThemeProvider mode="light">
      <CnButton variant="contained" color="primary">
        Guardar cambios
      </CnButton>
    </CanekThemeProvider>
  );
}
```

El import del CSS es **obligatorio**. Los tokens de diseño se exponen como CSS variables con prefijo `--cn-*` y los componentes los consumen. Sin ese import, los componentes usan fallbacks pero el theming no funciona.

---

## Componentes

| Componente   | Estado   | Desde   | Descripción                                                        |
| ------------ | -------- | ------- | ------------------------------------------------------------------ |
| `CnButton`   | Estable  | v0.1.0  | Botón con variantes, colores, tamaños, shapes, loading y soporte de links. |
| `CnIcon`     | Estable  | v0.2.0  | Ícono con registry, tamaños, colores semánticos, spin, pulse y rotate. |

Próximos: `CnChip`, `CnAlert`, `CnAvatar`, `CnInput`, `CnForm`, `CnDataTable`.

### `CnButton`

```tsx
<CnButton
  variant="contained"        // "contained" | "outlined" | "text"
  color="primary"            // primary | secondary | success | warning | info | error | accent | neutral
  size="medium"              // "small" | "medium" | "large"
  shape="rounded"            // "rounded" | "pill" | "square"
  startIcon="add"            // string (usa CnIcon) o ReactNode
  endIcon="arrow_forward"
  loading={false}
  fullWidth={false}
  href="https://canek.mx"    // renderiza <a> en lugar de <button>
  target="_blank"
  onClick={() => {}}
>
  Guardar cambios
</CnButton>
```

### `CnIcon`

```tsx
<CnIcon
  name="check"               // string del registry
  size="md"                  // "xs" | "sm" | "md" | "lg" | "xl" | "2xl" o número
  color="success"            // primary | secondary | success | warning | error | info | accent | muted | subtle | inherit
  spin={false}
  pulse={false}
  rotate={0}
  label="Éxito"              // opcional, agrega role="img" y aria-label
/>
```

El registry incluye ~80 íconos comunes. Se puede extender con `registerIcons`:

```tsx
import { registerIcons } from "@canek-ui/material-design-system";
import CustomIcon from "@mui/icons-material/CustomIcon";

registerIcons({
  custom_thing: CustomIcon,
});
```

---

## Temas

`CanekThemeProvider` acepta `mode`:

- `"light"` — tema claro (default)
- `"dark"` — tema oscuro

```tsx
<CanekThemeProvider mode="dark">
  <App />
</CanekThemeProvider>
```

El `mode` establece `data-cn-theme="dark"` en `<html>`, lo cual activa las variantes oscuras de los tokens CSS.

---

## Tokens de diseño

Los tokens se dividen en dos formatos complementarios:

- **CSS variables** en `src/styles/tokens.css` — consumidas por los componentes.
- **Objetos TypeScript** en `src/tokens/` — para lógica de aplicación.

### Sobreescribir tokens por proyecto

```css
/* src/styles/app-tokens.css, importado después de @canek-ui/material-design-system/styles.css */
:root {
  --cn-color-brand-600: #3d5afe;
  --cn-radius-md: 6px;
  --cn-font-sans: "Inter", system-ui, sans-serif;
}
```

### Tokens disponibles

| Grupo        | Prefijo                | Ejemplo                          |
| ------------ | ---------------------- | -------------------------------- |
| Colores      | `--cn-color-*`         | `--cn-color-brand-600`           |
| RGB (rgba)   | `--cn-color-rgb-*`     | `--cn-color-rgb-brand-600`       |
| Spacing      | `--cn-space-*`         | `--cn-space-4` (16px)            |
| Radii        | `--cn-radius-*`        | `--cn-radius-md` (8px)           |
| Shadows      | `--cn-shadow-*`        | `--cn-shadow-md`                 |
| Tipografía   | `--cn-font-*`          | `--cn-font-sans`, `--cn-font-size-md` |
| Motion       | `--cn-duration-*`, `--cn-ease-*` | `--cn-duration-base` (200ms) |
| Z-index      | `--cn-z-*`             | `--cn-z-modal`                   |

---

## Estructura del proyecto

```
canek-ui-design-system/
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI: lint + typecheck + test + build
├── .storybook/
│   ├── main.ts                    # configuración del Storybook
│   └── preview.tsx                # decorators globales (theme, tokens)
├── scripts/
│   └── copy-css.mjs               # copia tokens.css a dist/ después del build
├── src/
│   ├── components/
│   │   ├── CnButton/
│   │   │   ├── CnButton.tsx
│   │   │   ├── CnButton.stories.tsx
│   │   │   ├── CnButton.test.tsx
│   │   │   └── index.ts
│   │   └── CnIcon/
│   │       ├── CnIcon.tsx
│   │       ├── icons.ts           # registry nombre → componente
│   │       ├── CnIcon.stories.tsx
│   │       ├── CnIcon.test.tsx
│   │       └── index.ts
│   ├── styles/
│   │   └── tokens.css             # CSS variables (light + dark)
│   ├── theme/
│   │   ├── CanekThemeProvider.tsx
│   │   └── index.ts
│   ├── tokens/
│   │   └── index.ts               # tokens como objetos TS
│   └── index.ts                   # barrel público del paquete
├── .editorconfig
├── .gitignore
├── .npmignore
├── .nvmrc                         # Node 22
├── .prettierrc
├── LICENSE
├── README.md
├── eslint.config.js
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── vitest.setup.ts
```

---

## Desarrollo

### Requisitos

- **Node.js** `>=20.0.0` (probado con Node 22 y 26).
- **npm** `>=10.0.0`.
- **Git** (cualquier versión reciente).
- **VSCode** recomendado. El repo incluye `.editorconfig` y configs de Prettier/ESLint que se aplican automáticamente.

Verificar versiones:

```bash
node --version
npm --version
git --version
```

### Setup inicial

```bash
git clone git@github.com:CanekDevs/canek-ui-design-system.git
cd canek-ui-design-system
npm install
```

En Windows, si `npm install` muestra warnings de `install-scripts` (npm 11+), aprueba los scripts de esbuild:

```bash
npm install-scripts approve esbuild
npm rebuild esbuild
```

### Scripts disponibles

| Comando                  | Qué hace                                                         |
| ------------------------ | ---------------------------------------------------------------- |
| `npm run storybook`      | Levanta Storybook en `http://localhost:6006` (desarrollo visual). |
| `npm run dev`            | Alias de `storybook`.                                            |
| `npm run build`          | Genera `dist/` (JS, CJS, tipos, tokens.css).                     |
| `npm run build-storybook`| Genera el Storybook estático en `storybook-static/`.             |
| `npm run test`           | Ejecuta la suite con Vitest (una vez).                           |
| `npm run test:watch`     | Ejecuta Vitest en modo watch (recomendado al iterar).            |
| `npm run lint`           | Ejecuta ESLint sobre todo el proyecto.                           |
| `npm run format`         | Formatea con Prettier.                                           |
| `npm run format:check`   | Verifica formato sin modificar archivos.                         |
| `npm run typecheck`      | Ejecuta `tsc --noEmit`.                                          |

### Storybook

Storybook es la fuente de verdad visual del design system. Cada componente vive con sus stories al lado:

```bash
npm run storybook
```

Abre `http://localhost:6006`. Cada componente tiene al menos una story `Default` más stories de variantes, tamaños, colores y estados.

### Verificación antes de commitear

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Los cuatro deben pasar. Si alguno falla, no se commitea.

---

## Convenciones

### Commits

Formato:

```
<tipo>(<scope>): <descripción corta> - por: <Nombre Apellido>
```

Tipos válidos: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `test`, `ci`, `perf`.

Scopes válidos: el nombre del componente en kebab-case (`button`, `icon`, `chip`, `theme`, `tokens`) o `repo` para cambios globales.

Ejemplos:

```
feat(icon): add CnIcon with registry and semantic tokens - por: Angel Rodriguez
fix(button): respect loadingPosition for center spinner - por: Angel Rodriguez
docs: expand README with developer setup - por: Angel Rodriguez
chore(deps): bump mui to 7.3.11 - por: Angel Rodriguez
```

### Branches

| Rama                 | Propósito                                    |
| -------------------- | -------------------------------------------- |
| `main`               | Producción. Solo mergea desde PRs aprobados. |
| `feature/<nombre>`   | Nueva funcionalidad.                         |
| `fix/<nombre>`       | Corrección de bug.                           |
| `chore/<nombre>`     | Mantenimiento, dependencias, configs.        |
| `docs/<nombre>`      | Solo documentación.                          |

Ejemplo: `feature/cn-chip`, `fix/icon-spin-direction`, `chore/upgrade-storybook`.

### Estilo de código

- **Cero comentarios** en código (excepto el return de VMs, no aplica a este repo). Si un bloque necesita comentario, refactorízalo.
- **`type` en lugar de `interface`** en TypeScript.
- **Funciones flecha** en lugar de `function` (excepto `forwardRef` que lo requiere).
- **`const`** sobre `let`.
- **Desestructuración** de props.
- **Alias `@/`** para imports absolutos dentro de `src/`.
- **Cero emojis** en código, commits o docs.

### Componentes

Cada componente nuevo sigue esta estructura:

```
src/components/CnNombre/
├── CnNombre.tsx
├── CnNombre.stories.tsx
├── CnNombre.test.tsx
└── index.ts
```

Y se exporta desde `src/index.ts`:

```typescript
export { CnNombre } from "./components/CnNombre";
export type { CnNombreProps } from "./components/CnNombre";
```

---

## Flujo de trabajo

### 1. Crear rama desde `main`

```bash
git checkout main
git pull
git checkout -b feature/cn-chip
```

### 2. Desarrollar

```bash
# Iterar en Storybook
npm run storybook

# Correr tests mientras trabajas
npm run test:watch
```

### 3. Verificar todo

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

### 4. Commitear

```bash
git add src/components/CnChip
git add src/index.ts
git commit -m "feat(chip): add CnChip with color variants - por: Angel Rodriguez"
```

Nunca `git add .` si hay archivos que no quieres commitear. Siempre archivos específicos por ruta.

### 5. Push y PR

```bash
git push -u origin feature/cn-chip
```

Abre un Pull Request en GitHub hacia `main`:

- **Título:** igual al commit principal (`feat(chip): add CnChip`).
- **Descripción:** qué hace el componente, qué variantes añade, screenshots del Storybook.
- **Reviewer:** al menos uno del equipo.

### 6. Merge

Una vez aprobado y CI en verde:

- **Squash and merge** (recomendado) o **Merge commit**. Nunca **Rebase and merge** porque reescribe SHA.
- Borra la rama después del merge.

### 7. Actualizar local

```bash
git checkout main
git pull
git branch -d feature/cn-chip
```

---

## Publicación

### Checklist antes de publicar

- [ ] CI en verde en `main`.
- [ ] Todos los tests pasan (`npm run test`).
- [ ] El build genera `dist/` sin warnings.
- [ ] El CHANGELOG o el commit describen los cambios.
- [ ] La versión se decidió correctamente (ver abajo).

### Semantic versioning

| Cambio                                    | Versión a bumpear |
| ----------------------------------------- | ----------------- |
| Breaking change (API incompatible)        | `major` (0.x → 1.0) |
| Nuevo componente o nueva prop no breaking | `minor` (0.2 → 0.3) |
| Bug fix, corrección interna               | `patch` (0.2.0 → 0.2.1) |

Mientras la versión sea `0.x.y`, **cada nuevo componente es un minor**. `CnButton` → `v0.1.0`. `CnIcon` → `v0.2.0`. `CnChip` → `v0.3.0`. Cuando cierres la API de los componentes más usados y estés listo para producción, saltas a `v1.0.0`.

### Publicar

```bash
# 1. Actualizar versión (esto crea commit + tag automáticamente)
npm version minor
# o
npm version patch
# o
npm version major

# 2. Push con tags
git push --follow-tags

# 3. Publicar a npm
npm publish --access public
```

`npm publish` requiere 2FA activo en tu cuenta. Te pedirá OTP de 6 dígitos.

### Verificar la publicación

- `https://www.npmjs.com/package/@canek-ui/material-design-system`
- `npm view @canek-ui/material-design-system`

### Si algo sale mal

**No se puede reemplazar una versión ya publicada.** Si publicaste `0.2.0` con un bug:

```bash
# Deprecar la versión (los consumidores nuevos no la verán)
npm deprecate @canek-ui/material-design-system@0.2.0 "Bug en CnIcon. Usar 0.2.1"

# Publicar la versión corregida
npm version patch
git push --follow-tags
npm publish --access public
```

---

## Contribuir

1. Fork del repo (si eres externo) o branch directo (si eres del equipo).
2. Sigue el flujo de trabajo de arriba.
3. Asegúrate de que tu código cumple las convenciones (cero comentarios, `type` no `interface`, funciones flecha, etc.).
4. Abre un PR con:
   - Descripción clara del cambio.
   - Screenshots del Storybook si es un componente nuevo.
   - Link al issue relacionado si aplica.
5. Responde a los reviews.

### Agregar un componente nuevo

Checklist rápida:

- [ ] `src/components/CnNuevo/CnNuevo.tsx` con la implementación.
- [ ] `src/components/CnNuevo/CnNuevo.stories.tsx` con stories de todas las variantes.
- [ ] `src/components/CnNuevo/CnNuevo.test.tsx` con tests de los comportamientos clave.
- [ ] `src/components/CnNuevo/index.ts` con los exports.
- [ ] Exportar en `src/index.ts`.
- [ ] Agregar a la tabla de [Componentes](#componentes) en este README.
- [ ] Verificar que `npm run typecheck && npm run lint && npm run test && npm run build` pasan.
- [ ] Probar en Storybook que todas las stories renderizan sin errores en consola.

---

## Licencia

MIT © [Canek](https://canek.mx). Ver [LICENSE](./LICENSE).

# AGENTS.md — Guía para personas y agentes de IA

Guía operativa de `@canek-ui/material-design-system`: cómo está armado el repo, qué significa
"terminado" para un componente, cómo se crece el catálogo sin duplicar y qué errores ya nos
costaron tiempo. Si eres un agente de IA, lee esto completo antes de tocar código; las reglas de
aquí tienen prioridad sobre tus costumbres por defecto.

## Reglas que no se negocian

1. **Utilidad primero.** Antes de crear un componente, demuestra que ninguno existente lo cubre con
   una prop o variante nueva (ver [Regla de utilidad](#regla-de-utilidad-primero)).
2. **Definición de terminado completa.** Un componente sin entrada de catálogo, skeleton, historia
   `Responsive`, pruebas o export no está terminado (ver [Definición de terminado](#definición-de-terminado-de-un-componente)).
3. **Sin nombres externos.** Nunca menciones sistemas externos de los que se tomen ideas ni prefijos
   de componentes ajenos, en código, docs, historias, commits o PRs.
   `src/__governance__/forbidden-terms.test.ts` lo vigila.
4. **Sin atribución a IA.** Commits y PRs nunca mencionan a asistentes ni agentes de IA.
5. **Interfaz en español.** Textos visibles, `aria-label`, mensajes de error, docs y JSDoc en
   español. Nombres de código (props, tipos) en inglés, como hoy.
6. **Tokens, no colores sueltos.** `var(--cn-color-*)`, `theme.palette.*` o `CN_TONES`; nunca un
   hex sin token (un hex como respaldo `var(--cn-color-border, #dde0e4)` sí se permite).
7. **Sin dependencias nuevas** sin acordarlo antes. Primero se construye con lo que ya hay.

## Mapa del repositorio

| Ruta                                         | Qué es                                                                                                                                                                                             |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                               | Entrada principal del paquete. Barrel de todo lo que no depende de peers opcionales.                                                                                                               |
| `src/charts.ts`                              | Entrada `/charts`: gráficas sobre `@mui/x-charts` (peer opcional).                                                                                                                                 |
| `src/rich-text.tsx`                          | Entrada `/rich-text`: editor sobre tiptap (peer opcional) y `registerRichTextFieldType`.                                                                                                           |
| `src/components/CnX/`                        | Un componente por carpeta: `CnX.tsx`, `CnXSkeleton.tsx`, `CnX.stories.tsx`, `CnX.test.tsx`, `index.ts` y archivos de apoyo.                                                                        |
| `src/catalog/`                               | **Catálogo**: fuente única de "Para qué sirve / Cuándo NO usarlo / Relación con vecinos". `entries/*.ts` por familia, `types.ts`, `catalogDocs()`.                                                 |
| `src/catalog/roadmap.ts`                     | Componentes **planeados** (no existen aún). Genera `docs/ROADMAP.md`.                                                                                                                              |
| `src/__governance__/`                        | Pruebas de gobierno del repo (estructura, exports, colores, catálogo, docs generadas, términos prohibidos).                                                                                        |
| `src/tokens/`                                | Tokens como objetos TS (`colors`, `spacing`, `radii`, `shadows`, `motion`, `zIndex`).                                                                                                              |
| `src/styles/tokens.css`                      | Los mismos tokens como CSS variables `--cn-*` (claro y oscuro). Se publica como `styles.css`.                                                                                                      |
| `src/theme/`                                 | `CanekThemeProvider` y `createCanekTheme`: tema MUI que lee los tokens.                                                                                                                            |
| `src/utils/`                                 | Lógica compartida: control de campos (`field-control`, `field-state`, `field-styles`), fechas, números, máscaras, archivos, listas grandes (virtualización, opciones remotas), tonos (`tones.ts`). |
| `src/components/CnSkeleton/skeleton-kit.tsx` | Kit para skeletons: `CnSkeletonGroup`, `CnFieldSkeleton`, `SkBlock`, `SkText`, `SkLines`, `SkLabeled`, `varyWidth`.                                                                                |
| `docs/`                                      | Generado: `catalog.json`, `ROADMAP.md`, `governance/colores-hardcodeados.md`. No editar a mano.                                                                                                    |
| `scripts/`                                   | `new-component.mjs` (andamiaje), `docs-catalog.mjs` (docs generadas), `copy-css.mjs` (build).                                                                                                      |
| `.storybook/`                                | Storybook 8 (Vite). `preview.tsx` envuelve todo en `CanekThemeProvider`.                                                                                                                           |
| `.github/workflows/`                         | `ci.yml` (`npm run verify:all` en PRs y pushes) y `release.yml` (tag `vX.Y.Z` en `main`).                                                                                                          |

### Entradas del paquete

`vite.config.ts` define tres entradas (`index`, `charts`, `rich-text`) y `package.json#exports`
las publica. Deben coincidir (lo prueba `exports.test.ts`). La entrada principal **no** puede
importar, ni de forma transitiva, `@tiptap/*` ni `@mui/x-charts`: quien no instala esos peers
debe poder usar el paquete. Un componente que necesite uno de ellos va en su entrada aparte.

### Tokens y tema

- Colores, radios, sombras, espaciado y movimiento salen de `tokens.css` (`--cn-*`). En `sx` usa
  `var(--cn-color-text, #222831)`, `var(--cn-radius-md, 8px)`, etc. Respaldos habituales:
  texto `#222831`, texto atenuado `#6e7682`, borde `#dde0e4`, superficie `#ffffff`.
- Tonos semánticos compartidos (tarjetas, carruseles, secciones): `CN_TONES` en `src/utils/tones.ts`.
- El modo oscuro redefine las variables; si usas un literal, el modo oscuro se rompe.

### Catálogo

Cada componente principal tiene una entrada `CnCatalogEntry` en `src/catalog/entries/*.ts` con
`summary`, `purpose` (para qué sirve), `whenNot` (cuándo NO usarlo, nombrando la alternativa entre
backticks) y `neighbors` (relación con vecinos). Las historias toman su descripción con
`catalogDocs("CnX")`; el README, `docs/catalog.json` y `docs/ROADMAP.md` se generan con
`npm run docs:catalog`. Nunca dupliques esos textos en las historias.

## Regla de utilidad primero

Crear un componente es la última opción. Antes, responde por escrito (en el PR o en el issue):

1. **¿Qué problema de producto resuelve?** En una frase, sin nombrar el componente.
2. **¿Qué componente existente se acerca más?** Busca en el catálogo (`docs/catalog.json`, bloque
   del README) y en `docs/ROADMAP.md`.
3. **¿Por qué no basta una prop, variante o composición del existente?** Si la respuesta es "porque
   sería más cómodo", extiende el existente.
4. **¿Qué comparte con sus vecinos?** Reutiliza sus utilidades (`src/utils`), sus partes y su
   skeleton; no copies lógica.

Ejemplos de lo que hicimos bien: `CnInfoCard` se eliminó y su contenido pasó a `CnAlert` y
`CnMetricCard`; `CnFileField` y `CnDocCard` comparten `src/utils/file-utils.ts`; `CnQuantityField`
es un atajo de `CnNumberField`, no un componente nuevo.

## Definición de terminado de un componente

Empieza con el andamiaje, que crea todo con la forma correcta:

```bash
npm run new:component -- CnNombre --category <categoria> [--entry index|charts|rich-text]
```

Categorías: `fundamentos`, `acciones`, `formularios`, `datos`, `graficas`, `retroalimentacion`,
`superposiciones`, `navegacion`, `layout`, `contenido`, `medios`, `ia`. Usa `--dry-run` para ver
qué haría. Después, la lista completa (la misma que la plantilla de PR):

- [ ] **Hueco probado** con la regla de utilidad (en el PR).
- [ ] **Catálogo**: entrada con las tres secciones, dominios reales (`erp`, `crm`, `cms`,
      `ecommerce`, `pos`, `reservas`, `pagos`, `rrhh`, `landing`, `dashboards`, `ia`, `general`),
      `status` y `related` (skeleton, subcomponentes, hooks). Si estaba en `roadmap.ts`, se quita de ahí.
- [ ] **Historias** (`CnX.stories.tsx`): `parameters.docs.description.component = catalogDocs("CnX")`,
      `Default`, variantes y estados (vacío, carga, error, deshabilitado), y una historia
      **`Responsive`** que pinta el componente a **320, 480 y 1200 px** con datos extremos (textos
      de 100+ caracteres, palabras sin espacios, montos enormes, listas vacías y largas). Revísala
      a ojo: nada se sale ni se corta sin elipsis.
- [ ] **Skeleton**: `CnXSkeleton.tsx` con el kit de `CnSkeleton`, mismas medidas que el real, un solo
      `role="status"` (`CnSkeletonGroup`), y prop `skeleton` en el componente que lo muestra.
- [ ] **Pruebas** (`CnX.test.tsx`): comportamiento, accesibilidad (roles, nombres accesibles,
      `aria-*`), teclado (Tab, Enter/Espacio, flechas, Escape), casos límite (vacío, valores
      extremos, controlado/no controlado, errores asíncronos) y el skeleton.
- [ ] **Exports**: todo lo público en `src/components/CnX/index.ts` y re-exportado desde la entrada
      correcta (`src/index.ts`, `src/charts.ts` o `src/rich-text.tsx`), tipos incluidos.
- [ ] **README**: sección de uso con un ejemplo mínimo; **CHANGELOG**: línea en `## [Sin publicar]`.
- [ ] **Sin desbordes**: `minWidth: 0` en hijos flex, `overflowWrap: "anywhere"` o elipsis en textos,
      `maxWidth: "100%"` en medios, sin anchos fijos que rompan a 320 px.
- [ ] **Tokens**, no colores sueltos. **Textos en español.** **Sin nombres externos.**
- [ ] `npm run docs:catalog` y `npm run verify:all` en verde.

## Verificación

| Comando                             | Qué corre                                                                                             |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                 | `tsc --noEmit`                                                                                        |
| `npm run lint`                      | ESLint                                                                                                |
| `npm run test`                      | Vitest (incluye `src/__governance__`)                                                                 |
| `npx vitest run src/__governance__` | Solo las pruebas de gobierno                                                                          |
| `npm run build`                     | Build de la librería (`dist/`)                                                                        |
| `npm run verify`                    | typecheck + lint + test + build                                                                       |
| `npm run verify:all`                | `verify` + build de Storybook (lo mismo que CI)                                                       |
| `npm run docs:catalog`              | Regenera README (bloque del catálogo), `docs/catalog.json`, `docs/ROADMAP.md` y el reporte de colores |
| `npx prettier --check <archivos>`   | Formato de los archivos que tocaste (no formatees archivos ajenos)                                    |

### Pruebas de gobierno (`src/__governance__`)

| Archivo                   | Regla                                                                                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `forbidden-terms.test.ts` | Ningún archivo versionado menciona sistemas externos ni prefijos ajenos.                                                                                         |
| `catalog.test.ts`         | Cada carpeta tiene entrada de catálogo con las tres secciones y cada historia usa `catalogDocs`.                                                                 |
| `structure.test.ts`       | Cada carpeta tiene `index.ts`, `*Skeleton.tsx`, `*.test.tsx`, `*.stories.tsx` y su componente acepta `skeleton` (excepciones justificadas en el archivo).        |
| `exports.test.ts`         | Lo que exporta cada carpeta llega a su entrada pública; `package.json#exports` = entradas de Vite; la entrada principal no arrastra tiptap ni `@mui/x-charts`.   |
| `colors.test.ts`          | Trinquete de hex sin token: ningún archivo puede subir su conteo de `hardcoded-colors.baseline.json`; archivos nuevos, cero.                                     |
| `catalog-docs.test.ts`    | README, `docs/catalog.json` y `docs/ROADMAP.md` al día; la hoja de ruta no repite componentes existentes y sus dependencias existen.                             |
| `typography.test.ts`      | Trinquete de tipografía: tamaños fuera de la escala, pesos que no son 300/400/500/700 y familias literales no pueden subir de `typography.baseline.json`.        |
| `contrast.test.ts`        | Contraste de tokens en claro y oscuro: texto 4.5:1, texto tenue y borde de campo 3:1; un par fuera de `contrast.baseline.json` debe pasar y ninguno puede bajar. |

Si una regla de gobierno estorba, no la apagues: agrega una excepción con su motivo en el mismo
archivo y explícala en el PR.

## Ramas, commits, versiones y releases

- **Ramas**: `develop` es la rama por defecto e integra el trabajo; `main` solo recibe releases
  validados. Cada cambio en su rama desde `develop` actualizado: `feat/*`, `fix/*`, `docs/*`,
  `chore/*`, `refactor/*`, `test/*`, `ci/*`. No reutilices ramas ya fusionadas.
- **Commits**: Conventional Commits con sufijo de autor, en inglés:
  `feat(price-tag): add CnPriceTag with discounts and tax note - por: Nombre Apellido`.
  Tipos: `feat`, `fix`, `refactor`, `perf`, `style`, `docs`, `test`, `chore`, `ci`. Scope = componente
  en kebab-case o `repo`. Nunca atribución a IA. `git add` por ruta, nunca `git add .`.
- **PRs**: hacia `develop`, con la plantilla llena; _Squash and merge_.
- **Versiones** (semver, `0.x`): `feat` → minor, `fix`/`perf`/`refactor` → patch; un cambio
  incompatible es minor mientras sea `0.x` y se marca **Cambios de comportamiento** en el CHANGELOG.
- **Release**: en `develop`, mover `## [Sin publicar]` a `## [X.Y.Z] - fecha`,
  `npm version <minor|patch> --no-git-tag-version`, PR `develop` → `main` (merge commit), publicar
  desde `main` y subir el tag `vX.Y.Z`; `release.yml` valida tag = `package.json`, corre
  `verify` y crea el GitHub Release con las notas del CHANGELOG. Detalle en el README
  (_Flujo de trabajo_ y _Publicación_).

## Errores comunes que ya nos pasaron

**MUI y estilos**

- En `sx`, los **números en props de espaciado se multiplican por `theme.spacing`** (`p: 2` = 16 px,
  `gap: 12` = 96 px). Escribe píxeles como string: `p: "16px"`, `gap: "8px"`, `ml: "4px"`.
- En `sx`, **`width: 1` significa 100 %** (y `width: 0.5` = 50 %). Para 1 px usa `"1px"`.
- `sx` puede ser un arreglo: al combinar con el `sx` del usuario usa
  `sx={[estilos, ...(Array.isArray(sx) ? sx : [sx])]}`; si lo esparces como objeto, se pierde.
- Hijos flex con texto largo necesitan `minWidth: 0`; sin eso, el contenedor se desborda.
- `position: fixed` queda atrapado si un ancestro tiene `transform`, `filter` o `contain`
  (tarjetas animadas, carruseles, Storybook): usa portal (`Popover`, `Modal`, `createPortal`).
- `z-index`: usa los tokens `zIndex` y las capas de MUI; no inventes `9999`.

**Gráficas, canvas y exportación**

- Un `<foreignObject>` dentro de un SVG **contamina el canvas** al rasterizar: la exportación PNG
  falla. Dibuja texto con `<text>` SVG o exporta sin `foreignObject`.
- El canvas no resuelve CSS variables: al exportar, resuelve los colores primero (ver
  `chart-export.ts`).
- Importa `@mui/x-charts` desde la raíz del paquete, no desde subrutas: con subrutas, el
  pre-empaquetado de Vite (optimizeDeps) duplica contextos y las gráficas pierden su estado.

**Pruebas (Vitest + jsdom)**

- jsdom **no calcula layout**: `getBoundingClientRect`, `offsetWidth` y `ResizeObserver` devuelven
  0 o no existen. Prueba el comportamiento con anchos inyectados o mocks; el layout real se valida
  en la historia `Responsive`.
- Pruebas que dependen de la fecha **fijan el tiempo** (`vi.useFakeTimers(); vi.setSystemTime(...)`)
  y lo restauran; si no, fallan otro día o en otra zona horaria.
- Busca por rol y nombre accesible (`getByRole("button", { name: "Guardar" })`), no por clases.
- Los skeletons exponen un solo `role="status"`: verifícalo.

**Arquitectura**

- Nada de la entrada principal puede importar tiptap ni `@mui/x-charts` (ni de forma indirecta).
- Las historias no son documentación de uso: la documentación vive en el catálogo.
- No dupliques lógica entre componentes vecinos: muévela a `src/utils` y compártela.
- Los textos de "Cuándo NO usarlo" y "vecinos" deben nombrar componentes reales entre backticks
  (la prueba del catálogo lo verifica).

## Hoja de ruta

`src/catalog/roadmap.ts` lista los componentes planeados por categoría y dominio (ERP, CRM, CMS,
e-commerce, landing, POS, reservaciones, pagos, RR. HH., tableros e IA), con prioridad, por qué no
basta lo existente y de qué depende. Al implementar uno, sale de la hoja de ruta y entra al
catálogo. Para proponer uno nuevo, agrégalo ahí (con la regla de utilidad) y corre
`npm run docs:catalog`.

## Para agentes de IA

- Trabaja en la rama que te indiquen; no cambies de rama, no hagas commit ni push sin que te lo
  pidan.
- Antes de crear algo, busca en `docs/catalog.json` y `docs/ROADMAP.md`.
- Usa `npm run new:component` en lugar de copiar una carpeta a mano.
- No edites archivos generados (`docs/*`, bloque del catálogo en el README): edita la fuente y corre
  `npm run docs:catalog`.
- Formatea solo los archivos que tocaste (`npx prettier --write <archivos>`).
- Reporta qué verificaste y qué no (por ejemplo, si no revisaste la historia `Responsive` a ojo).

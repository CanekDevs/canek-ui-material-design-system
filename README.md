# @canek-ui/material-design-system

Design system de [Canek](https://canek.mx). Componentes React construidos sobre MUI 7, con tokens de diseño como CSS variables, theming unificado y API consistente.

[![npm version](https://img.shields.io/npm/v/@canek-ui/material-design-system.svg)](https://www.npmjs.com/package/@canek-ui/material-design-system)
[![CI](https://github.com/CanekDevs/canek-ui-design-system/actions/workflows/ci.yml/badge.svg)](https://github.com/CanekDevs/canek-ui-design-system/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

---

## Tabla de contenido

- [Instalación](#instalación)
- [Uso](#uso)
- [Componentes](#componentes)
- [Formularios](#formularios)
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

| Componente            | Categoría   | Descripción                                                                                      |
| --------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `CnButton`            | Acciones    | Botón con variantes, colores, tamaños, shapes, loading, íconos por nombre y soporte de links.    |
| `CnIcon`              | Base        | Ícono con registry, tamaños, colores semánticos, spin, pulse y rotate.                           |
| `CnChip`              | Datos       | Chip con variantes, colores y formas automáticas.                                                |
| `CnAlert`             | Feedback    | Alerta inline, banner o popup (snackbar) con severidades y cierre.                               |
| `CnCard`              | Layout      | Tarjeta con variantes, layouts y primitivas de composición.                                     |
| `CnAvatar`            | Datos       | Avatar y grupo de avatares con estado, badges e iniciales.                                      |
| `CnEmptyState`        | Feedback    | Estado vacío con ilustraciones, variantes y acciones.                                           |
| `CnSkeleton`          | Feedback    | Placeholders de carga con variantes y animaciones.                                              |
| `CnBadge`             | Datos       | Contadores, puntos y etiquetas.                                                                  |
| `CnTabs`              | Navegación  | Pestañas con variantes, íconos, subtítulos, estados de error y carga.                           |
| `CnForm`              | Formularios | Formulario declarativo: simple, secciones (repetibles), pestañas, wizard; inline o modal.       |
| `CnTextField`         | Formularios | Texto, email, url, teléfono, búsqueda, contraseña (con medidor) y textarea.                     |
| `CnNumberField`       | Formularios | `number \| null` con controles apilados/laterales/en línea, mantener para repetir, Shift/Alt, rueda, ajuste al paso. |
| `CnQuantityField`     | Formularios | Selector de cantidad "− 2 +" (atajo de `controls="split"`).                                      |
| `CnCurrencyField`     | Formularios | Montos con formato de moneda y selector de moneda opcional.                                     |
| `CnPhoneField`        | Formularios | Teléfono con selector de país, máscara por país y valor E.164.                                  |
| `CnSelectField`       | Formularios | Select simple o múltiple (chips), grupos, descripciones y botón limpiar.                        |
| `CnAutocompleteField` | Formularios | Búsqueda sin acentos, grupos, múltiple, freeSolo y búsqueda remota.                             |
| `CnCheckboxField`     | Formularios | Checkbox booleano o grupo de opciones con "seleccionar todo".                                   |
| `CnRadioGroupField`   | Formularios | Grupo de radios clásico o en tarjetas.                                                          |
| `CnSwitchField`       | Formularios | Interruptor con descripción.                                                                    |
| `CnDateField`         | Formularios | Fecha, hora, fecha-hora y mes: captura con máscara + selector propio (calendario, mes/año, hora). |
| `CnDateRangeField`    | Formularios | Rango de fechas con dos meses, atajos ("Últimos 7 días"…) y duración máxima.                    |
| `CnCalendar`          | Formularios | Calendario accesible en línea: simple o rango, fechas marcadas, números de semana.              |
| `CnRichTextField`     | Formularios | Editor enriquecido (tiptap) con tablas, imágenes, enlaces seguros y contador. Entrada aparte.   |
| `CnSliderField`       | Formularios | Valor único o rango.                                                                            |
| `CnRatingField`       | Formularios | Calificación con etiquetas por valor.                                                           |
| `CnFileField`         | Formularios | 6 variantes, metadatos, progreso/reintento, visor multimedia, pegar, cámara, reordenar.         |

Próximos: `CnDataTable`.

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

## Formularios

Todos los campos comparten la misma API base (`CnFieldBaseProps`): `label`, `helperText`,
`error`, `required`, `disabled`, `readOnly`, `value`/`defaultValue`/`onChange`, `onBlur`,
`size`, `rules` y `internalValidation`. Funcionan solos (con validación interna por `rules`)
o dentro de `CnForm`, que pasa a ser la única fuente de verdad de los errores.

### `CnForm` básico

```tsx
import { CnForm, type CnFormField } from "@canek-ui/material-design-system";

const fields: CnFormField[] = [
  { name: "name", type: "text", label: "Nombre", required: true, transform: "capitalize" },
  { name: "email", type: "email", label: "Correo", required: true },
  { name: "phone", type: "phone", label: "Teléfono", defaultCountry: "MX" },
  { name: "address.zip", type: "text", label: "CP", rules: [{ type: "postalCode", format: "mx" }] },
  { name: "plan", type: "select", label: "Plan", options: [{ value: 1, label: "Básico" }, { value: 2, label: "Pro" }] },
];

// No controlado: el formulario guarda su propio estado.
<CnForm fields={fields} columns={2} defaultValues={{ plan: 1 }} onSubmit={(values) => api.save(values)} />;

// Controlado: `patch` trae claves de primer nivel completas (sirve con rutas anidadas).
const [value, setValue] = useState({});
<CnForm fields={fields} value={value} onChange={(patch) => setValue((v) => ({ ...v, ...patch }))} onSubmit={save} />;
```

### Variantes y layout

| Prop                         | Uso                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| `fields`                     | Formulario simple.                                                                      |
| `sections`                   | Secciones con título/ícono, colapsables, columnas propias y **repetibles** (`repeatable`, `minItems`, `maxItems`, `canReorder`, `itemTitle`). El valor de una sección repetible es un arreglo en `values[id]`. |
| `tabs`                       | Pestañas con indicador de error; al enviar salta a la pestaña del primer error.        |
| `steps`                      | Wizard: valida el paso antes de avanzar (incluye validación asíncrona), Enter avanza, stepper navegable y barra de progreso en móvil. |
| `mode="modal"`               | Mismo formulario dentro de un diálogo (pantalla completa en móvil).                     |
| `columns`, `xs…xl` por campo | Grid responsivo; textarea, archivos, radios y grupos ocupan el ancho completo.          |

Las pestañas y los pasos aceptan `fields` **y** `sections`.

### Reglas, campos dinámicos y efectos

- `required`, `disabled`, `readOnly`, `label`, `placeholder`, `options`, `rules`, `min`, `max`,
  `currency`, `minDate`, `maxDate` aceptan un valor o una función `(values, ctx) => valor`.
- `visibleWhen(values, ctx)` oculta campos; los ocultos no se validan y con `omitHiddenFields` no se envían.
- En secciones repetibles `ctx` incluye `{ sectionId, index, item }`.
- `onFieldChange(value, values, path)` puede devolver otros valores a actualizar (`{ "address.city": "" }`).
- `validateAsync(value, values, ctx)` para validaciones remotas (se ignoran respuestas viejas).
- Reglas implícitas: `email`, `url`, teléfono por país, rango de fechas, `min`/`max` numéricos, `maxLength`, `maxFiles`.
- `validateOn`: `"blur"` (por defecto), `"change"` o `"submit"`. Tras el primer envío los errores se actualizan en vivo.
- `type: "custom"` con `render({ value, onChange, error, ... })` para controles propios enlazados al formulario.

### Fechas

`CnDateField` no usa el selector nativo del navegador: se puede **escribir** con máscara
(`DD/MM/AAAA`, `HH:mm`, 12 h con `ampm`) o abrir el selector propio (icono o `Alt + ↓`).

- Calendario con vistas de día, mes y año, navegación completa por teclado (flechas, `Re Pág`/`Av Pág`, `Inicio`/`Fin`) y botones "Hoy"/"Limpiar".
- Restricciones: `min`, `max`, `disablePast`, `disableFuture`, `disableWeekends`, `disabledDays`, `disabledDates` (festivos) y `shouldDisableDate`.
- Hora por columnas con `minutesStep`, límites `min`/`max` y `shouldDisableTime`.
- `highlightedDates` marca días con un punto; `showWeekNumbers` muestra la semana ISO.
- El valor sigue siendo ISO local (`YYYY-MM-DD`, `HH:mm`, `YYYY-MM-DDTHH:mm`, `YYYY-MM`); un texto incompleto se emite tal cual para que la validación lo marque.
- `CnDateRangeField` (`type: "daterange"` en `CnForm`) guarda `[desde, hasta]` y valida orden, completitud y `maxDays`.

### Números

`CnNumberField` guarda `number | null` (nunca texto) y admite:

- `controls`: `stacked` (▲▼, por defecto), `split` (− valor +), `inline` o `none`. `CnQuantityField` es el atajo para cantidades.
- Mantener presionado repite con aceleración; ↑/↓ = `step`, Shift = `largeStep` (×10), Alt = `smallStep` (÷10), Re Pág/Av Pág, Inicio/Fin (mín./máx.).
- `allowWheel` (rueda con foco), `snapToStep`, `clampOnBlur`, `allowEmpty`, `clearable`, `decimals`, `thousandSeparator`, `prefix`/`suffix`, `textAlign`.

### Archivos

`CnFileField` cubre desde un adjunto simple hasta una galería de producto:

| Variante   | Uso                                                        |
| ---------- | ---------------------------------------------------------- |
| `dropzone` | Zona de arrastre + lista (por defecto).                    |
| `button`   | Botón + lista.                                             |
| `compact`  | Chips en línea para formularios densos.                    |
| `grid`     | Galería cuadrada, con "Principal" y arrastre en cuadrícula. |
| `card`     | Tarjetas con vista previa grande y metadatos.              |
| `avatar`   | Foto de perfil circular.                                   |

- **Validación:** `accept`, `maxSize`, `maxFiles`, `maxTotalSize`, `imageConstraints` (mín./máx. de px y proporción) y duplicados.
- **Metadatos** sin dependencias: dimensiones, duración de audio/video y páginas de PDF.
- **Subidas directas:** `onFilesAdded` para empezar a subir y `fileStatus` (`uploading` + `progress`, `success`, `error`) con `onRetry`.
- **Visor** de imágenes (zoom), video, audio y PDF, con descarga y navegación por teclado.
- Pegar con Ctrl+V (`allowPaste`), `capture` para la cámara del móvil, `renderFileActions` para acciones propias y `onRemoveExisting` para archivos del servidor.
- En `CnForm`, cualquier opción avanzada se pasa con `componentProps` (p. ej. `{ fileStatus, onFilesAdded }`).

### Texto enriquecido

El editor vive en una entrada aparte para que tiptap sea opcional:

```bash
npm i @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extensions @tiptap/extension-text-align @tiptap/extension-highlight @tiptap/extension-image @tiptap/extension-table
```

```tsx
import { CnRichTextField, registerRichTextFieldType } from "@canek-ui/material-design-system/rich-text";

registerRichTextFieldType(); // una vez al iniciar: habilita type: "richtext" en CnForm

<CnForm
  fields={[
    {
      name: "body",
      type: "richtext",
      label: "Contenido",
      required: true,
      maxLength: 5000,
      componentProps: { toolbar: "full", onUploadImage: (file) => api.upload(file) },
    },
  ]}
  onSubmit={save}
/>;
```

Barra `basic` / `standard` / `full` o lista propia; enlaces solo `http(s)`, `mailto:` y `tel:`
(también al pegar); imágenes por URL https o subida (`onUploadImage`, si no se incrustan con límite
de tamaño); tablas; `Ctrl+K` para enlaces. Un editor vacío emite `""`, así que `required` funciona.
El HTML que guardes debe sanitizarse al **mostrarlo** en otras vistas.

### Tipos de campo propios

`registerFormFieldType(tipo, renderer)` agrega tipos reutilizables a `CnForm` (así se integra `richtext`):

```tsx
registerFormFieldType("color", ({ value, onChange, label, error, helperText }) => (
  <MiSelectorDeColor label={label} value={value} onChange={onChange} error={error} helperText={helperText} />
));
```

### Envío y errores del servidor

```tsx
<CnForm
  fields={fields}
  submitMode="auto"            // "json" | "formdata" | "auto" (FormData si hay archivos)
  buildPayload={(v) => ({ ...v, total: Number(v.total) })}
  excludeFields={["confirmPassword"]}
  onSubmit={async (payload, { helpers }) => {
    await api.save(payload);   // si lanza, sus errores por campo se muestran solos
  }}
  resetAfterSubmit
/>
```

`parseServerErrors` entiende `{ campo: "msg" }`, `{ campo: ["msg"] }`, Laravel `{ message, errors }`,
`{ data: {...} }`, arreglos `[{ path|field, message }]`, rutas `items[0].name` y errores de axios
(`error.response.data`). El mensaje general se muestra arriba del formulario. También puedes pasar
`serverError` como prop.

### Experiencia y accesibilidad

- Resumen de errores accesible (`errorSummary="inline" | "toast" | "none"`) con enlaces que llevan al campo.
- Foco y scroll al primer error (cambia de pestaña / paso / expande la sección si hace falta).
- Prevención de doble envío, `isSubmitting` interno, botones deshabilitados durante el envío.
- `warnOnUnsavedChanges`: confirma antes de cerrar el modal o salir de la página con cambios. `onDirtyChange` informa el estado.
- Skeletons de carga (`isLoading`, `loadingStates` por sección/pestaña/paso).
- Textos personalizables con `labels` (i18n).

### API imperativa

```tsx
const formRef = useRef<CnFormHandle>(null);
<CnForm formRef={formRef} hideActions fields={fields} onSubmit={save} />;

formRef.current?.submit();              // Promise<boolean>
formRef.current?.validate();            // Promise<boolean>
formRef.current?.setFieldValue("name", "Ana");
formRef.current?.setErrors({ email: "Ya existe" });
formRef.current?.reset();
formRef.current?.getValues();
formRef.current?.isDirty();
```

`externalSubmitRef` se mantiene por compatibilidad.

### Seguridad

- `CnFileField` valida tipo (`accept`), tamaño y cantidad antes de aceptar archivos, libera los
  `object URL` de las previews y solo enlaza URLs `http(s)`, `blob:` o relativas (bloquea `javascript:`, `data:` no-imagen y `//host`).
- Los mensajes y nombres de archivo se renderizan como texto (sin `innerHTML`).
- El visor de PDF usa `<object type="application/pdf">` (nunca interpreta HTML).
- Los filtros de entrada (`rules`) recortan caracteres no permitidos sin perder acentos ni `+` en correos.

### Notas de migración (desde v0.12)

- `type: "number"` ahora usa `CnNumberField` y guarda `number | null` (antes string).
- `onChange(patch)` de `CnForm` envía claves de primer nivel completas (antes `"a.b"` literal); se agrega un 2.º argumento con todos los valores.
- `select`/`radio` conservan el tipo original del valor de la opción (antes se convertía a string).
- Los íconos por nombre de `CnButton` (`startIcon="save"`) se renderizan con `CnIcon` (antes aparecía el texto).
- Mensaje por defecto de `equalTo`: "Los valores no coinciden".
- `CnDateField` ya no usa el input nativo; el formato de valor no cambia. `step` (segundos) queda obsoleto: usa `minutesStep`.
- En secciones repetibles y archivos, los botones subir/bajar se reemplazan por un asa para arrastrar (también funciona con flechas del teclado).
- `CnNumberField` muestra por defecto flechas apiladas (`controls="stacked"`); usa `controls="none"` para el aspecto anterior. `showSteppers` queda obsoleto.
- Los PDF en `CnFileField` ahora abren el visor en lugar de un enlace.

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
│   │   ├── CnButton/              # cada componente: Cn*.tsx, .stories.tsx, .test.tsx, index.ts
│   │   ├── CnIcon/                # icons.ts = registry nombre → componente
│   │   ├── CnForm/
│   │   │   ├── CnForm.tsx         # orquestador (variantes, modal, envío, resumen de errores)
│   │   │   ├── CnForm.engine.ts   # resolución de campos, defaults y reglas implícitas (puro)
│   │   │   ├── CnForm.helpers.ts  # rutas anidadas, FormData, errores del servidor
│   │   │   ├── CnForm.validation.ts
│   │   │   ├── CnFormField.tsx    # tipo de campo → componente
│   │   │   ├── CnFormSection.tsx  # secciones y elementos repetibles
│   │   │   └── useCnFormState.ts  # estado: valores, touched, errores, dirty
│   │   ├── CnTextField/ CnNumberField/ CnCurrencyField/ CnPhoneField/
│   │   ├── CnCalendar/ CnRichTextField/   # CnRichTextField se publica en /rich-text
│   │   ├── CnSelectField/ CnAutocompleteField/ CnCheckboxField/
│   │   ├── CnRadioGroupField/ CnSwitchField/ CnDateField/
│   │   ├── CnSliderField/ CnRatingField/ CnFileField/
│   │   └── …                      # CnAlert, CnCard, CnTabs, CnChip, etc.
│   ├── utils/
│   │   ├── field-control.ts       # CnFieldBaseProps, useFieldControl, useControllableValue
│   │   ├── field-styles.ts        # estilos compartidos de campos
│   │   ├── input-utils.ts         # filtros, transformaciones, fortaleza de contraseña
│   │   ├── number-utils.ts        # parseo y formato numérico
│   │   ├── phone-countries.ts     # catálogo de países, máscaras y E.164
│   │   ├── date-utils.ts          # fechas ISO locales, máscaras, matriz del calendario
│   │   └── use-sortable-list.ts   # reordenar arrastrando (puntero + teclado)
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

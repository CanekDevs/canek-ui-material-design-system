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
- [Retroalimentación y layout](#retroalimentación-y-layout)
- [Tabla de datos](#tabla-de-datos)
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
| `CnPasswordField`     | Formularios | Contraseña con checklist de requisitos, medidor y generador seguro.                              |
| `CnOtpField`          | Formularios | Códigos de verificación / 2FA: un recuadro por carácter, pegado y autocompletado de SMS.        |
| `CnMaskedField`       | Formularios | Máscaras con presets: tarjeta (Luhn + marca), vencimiento, CVV, CLABE, NSS, CURP, RFC, CP.      |
| `CnTagsField`         | Formularios | Lista libre de valores como chips (correos, palabras clave) validados uno a uno.               |
| `CnSegmentedField`    | Formularios | Botones segmentados de selección simple o múltiple, con íconos.                                 |
| `CnColorField`        | Formularios | Color hex con paleta sugerida y selector nativo.                                                |
| `CnSignatureField`    | Formularios | Firma dibujada (mouse, dedo, lápiz) o escrita; se guarda como PNG.                              |
| `CnNumberRangeField`  | Formularios | Rango numérico mínimo–máximo.                                                                   |
| `CnCountryField`      | Formularios | Países con bandera, búsqueda por nombre/ISO/lada y destacados.                                  |
| `CnFlagIcon`          | Base        | Banderas SVG integradas (sin CDN externo), con URL propia opcional.                             |
| `CnFormSkeleton`      | Feedback    | Esqueleto de carga para formularios.                                                            |
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
- Reglas implícitas: `email`, `url`, `tel`, teléfono por país, rango de fechas, `min`/`max` numéricos, `maxLength`, `maxFiles`.
- **Reglas condicionales:** cualquier regla acepta `when(values, ctx, value)`, p. ej. `{ type: "required", when: (v) => v.notify }`.
- `equalTo`/`notEqualTo` comparan primero contra el elemento de la sección repetible (`$.campo` fuerza la raíz) y no marcan error si el campo está vacío. `between` acepta solo `min` o solo `max`; `exactLength` acepta `length` como alias.
- `validateOn`: `"blur"` (por defecto), `"change"` o `"submit"`. Tras el primer envío los errores se actualizan en vivo.
- `type: "custom"` con `render({ value, onChange, error, ... })` para controles propios enlazados al formulario. Enter dentro de un control propio no envía el formulario (salvo `submitOnEnter`).

### Opciones remotas y selects en cascada

```tsx
{ name: "state", type: "select", label: "Estado", options: STATES },
{
  name: "city",
  type: "select",
  label: "Ciudad",
  dependsOn: ["state"],                  // se limpia y recarga al cambiar el estado
  loadOptions: ({ formValues, signal }) => api.cities(formValues.state, { signal }),
},
{
  name: "owner",
  type: "autocomplete",
  label: "Responsable",
  loadOptions: ({ input, signal }) => api.users.search(input, { signal }), // debounce + cancelación
  minSearchLength: 2,
  selectedOptions: [{ value: 7, label: "María López" }], // etiqueta del valor al editar
  onCreateOption: async (input) => api.users.create({ name: input }),     // "Crear …"
},
```

- `loadOptions` funciona en `select`, `autocomplete`, `radio`, `checkbox` (grupo), `segmented`, `choicecards`, `transferlist` y `treeselect`; cachea por dependencias y cancela peticiones viejas (`signal`).
- Con `dependsOn` el campo se deshabilita mientras falte un padre y se limpia en cascada (`resetOnDependencyChange: false` lo evita). En secciones repetibles las rutas son relativas al elemento; `$.ruta` apunta a la raíz.
- `renderOption`, `renderValue` (select) y `getOptionLabel` personalizan cómo se ven las opciones.

### Campos calculados, ocultos y de solo lectura

```tsx
{ name: "id", type: "hidden" },                             // se envía, no se pinta
{
  name: "amount",
  type: "display",                                          // valor de solo lectura
  compute: (_values, ctx) => ctx.item.qty * ctx.item.price, // dentro de una partida
  format: (v) => money(v),
},
{ name: "total", type: "display", compute: (v) => sum(v.lines, "amount"), format: money },
```

`compute` funciona en cualquier tipo (el campo queda de solo lectura) y se recalcula en cadena (subtotal → IVA → total).

### Fechas

`CnDateField` no usa el selector nativo del navegador: se puede **escribir** con máscara
(`DD/MM/AAAA`, `HH:mm`, 12 h con `ampm`) o abrir el selector propio (icono o `Alt + ↓`).

- Calendario con vistas de día, mes y año, navegación completa por teclado (flechas, `Re Pág`/`Av Pág`, `Inicio`/`Fin`) y botones "Hoy"/"Limpiar".
- Restricciones: `min`, `max`, `disablePast`, `disableFuture`, `disableWeekends`, `disabledDays`, `disabledDates` (festivos) y `shouldDisableDate`.
- Hora por columnas con `minutesStep`, límites `min`/`max` y `shouldDisableTime`.
- `highlightedDates` marca días con un punto; `showWeekNumbers` muestra la semana ISO.
- El valor sigue siendo ISO local (`YYYY-MM-DD`, `HH:mm`, `YYYY-MM-DDTHH:mm`, `YYYY-MM`); un texto incompleto se emite tal cual para que la validación lo marque.
- `CnDateRangeField` (`type: "daterange"` en `CnForm`) guarda `[desde, hasta]` y valida orden, completitud y `maxDays`.
- `type: "year"` guarda `YYYY` con un selector de solo año (ejercicios fiscales, generaciones).
- `displayFormat` muestra un formato libre mientras el campo no tiene el foco: `"MMMM [de] YYYY"` → "mayo de 2024", `"dddd D [de] MMMM"`, `"hh:mm a"` (`formatIsoDisplay` para usarlo fuera del campo).
- `minTime` / `maxTime` definen una ventana horaria diaria (p. ej. 08:00–18:00) en `time` y `datetime`, con validación.
- `openTo`, `defaultCalendarMonth`, `shouldDisableMonth`, `shouldDisableYear` y `shouldDisableTime` también desde `CnForm`.

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
| `masonry`  | Galería en columnas que respeta la proporción de cada foto. |

- **Validación:** `accept`, `maxSize`, `maxFiles`, `maxTotalSize` (en `sizeUnit`: `KB`, `MB` o `GB`), `imageConstraints` (mín./máx. de px y proporción) y duplicados.
- `gridColumns` fija las columnas de `grid`, `card` y `masonry`. En `CnForm`: `fileSizeUnit`, `gridColumns`, `showPreviews`.
- **Metadatos** sin dependencias: dimensiones, duración de audio/video y páginas de PDF.
- **Subidas directas:** `onFilesAdded` para empezar a subir y `fileStatus` (`uploading` + `progress`, `success`, `error`) con `onRetry`.
- **Visor** de imágenes (zoom), video, audio y PDF, con descarga y navegación por teclado.
- Pegar con Ctrl+V (`allowPaste`), `capture` para la cámara del móvil, `renderFileActions` para acciones propias y `onRemoveExisting` para archivos del servidor.
- En `CnForm`, cualquier opción avanzada se pasa con `componentProps` (p. ej. `{ fileStatus, onFilesAdded }`).

### Más campos

| Tipo en `CnForm` | Componente           | Notas                                                                  |
| ---------------- | -------------------- | ---------------------------------------------------------------------- |
| `password`       | `CnPasswordField`    | `passwordRequirements`, `allowGenerate`, `showPasswordStrength`.       |
| `otp`            | `CnOtpField`         | `otpLength`; valida longitud completa.                                 |
| `masked`         | `CnMaskedField`      | `mask` (`#` dígito, `A` letra, `*` alfanumérico) o `maskPreset`.       |
| `tags`           | `CnTagsField`        | `tagRules` por etiqueta, `maxTags`, `suggestions`; pegar listas.       |
| `segmented`      | `CnSegmentedField`   | `options` con `icon`, `multiple`, `iconOnly`.                          |
| `color`          | `CnColorField`       | `colorPresets`; valida `#RRGGBB`.                                      |
| `signature`      | `CnSignatureField`   | Valor PNG en data URL; alternativa escrita accesible.                  |
| `numberrange`    | `CnNumberRangeField` | `[mín, máx]`, valida el orden.                                         |
| `country`        | `CnCountryField`     | Código ISO; `priorityCountries`, `multiple`.                           |
| `choicecards`    | `CnChoiceCardsField` | Tarjetas con ícono, descripción y `meta`; `multiple`, `optionColumns`. |
| `transferlist`   | `CnTransferListField`| Lista doble con búsqueda (permisos, integrantes); `max`.               |
| `treeselect`     | `CnTreeSelectField`  | Árbol con búsqueda; `multiple` + `cascade`, `treeValueMode`, `leavesOnly`. |
| `keyvalue`       | `CnKeyValueField`    | Pares clave–valor; `valueFormat` `array`/`object`; detecta repetidas.  |
| `hidden`         | —                    | Valor que viaja en el payload sin pintarse.                            |
| `display`        | —                    | Valor de solo lectura con `format`; ideal con `compute`.               |

Las opciones de `select`, `autocomplete` y `segmented` aceptan `icon`, `avatar`, `initials` (o
`true` para calcularlas) y `flag`, útiles para selectores de personas o países.

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

formRef.current?.submit(); // Promise<boolean>
formRef.current?.validate(); // Promise<boolean>
formRef.current?.setFieldValue("name", "Ana");
formRef.current?.setErrors({ email: "Ya existe" });
formRef.current?.reset();
formRef.current?.getValues();
formRef.current?.isDirty();
formRef.current?.setValues({ "address.city": "GDL", total: 10 });
formRef.current?.getFieldValue("address.city");
formRef.current?.setFieldError("rfc", "RFC ya registrado");
formRef.current?.clearErrors("rfc"); // sin argumentos borra todos
formRef.current?.validate(["rfc", "email"]); // solo esas rutas
formRef.current?.getErrors();
formRef.current?.focusField("items.2.qty"); // cambia de pestaña/paso y expande la sección
formRef.current?.markSaved();
```

Los `helpers` de `onSubmit` y `extraActions` incluyen `setValues`, `getFieldValue`, `setFieldError` y
`clearErrors`. `externalSubmitRef` se mantiene por compatibilidad.

### Más opciones del formulario

| Prop                                              | Uso                                                                                                                                       |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `icon`, `dialogTitle`                             | Ícono del encabezado y título del modal distinto al inline.                                                                               |
| `reinitialize`                                    | (por defecto `true`) Si `defaultValues` llega después de montar y no hay cambios, el formulario se reinicia con esos datos.               |
| `resetOnOpen`                                     | (por defecto `true`) Un modal no controlado vuelve a sus valores iniciales cada vez que se abre.                                          |
| `disableActions`                                  | Deshabilita los botones sin deshabilitar los campos. `loadingStates.global` o cualquier sección/pestaña cargando también los deshabilita. |
| `nextButtonProps`, `backButtonProps`              | Personalizan los botones del wizard (`endIcon` disponible en todos los botones).                                                          |
| `showServerErrorAlert`                            | `false` si la página ya muestra el error general del servidor.                                                                            |
| `formDataOptions`                                 | `arrayFormat` (`indices` / `brackets` / `json`), `existingFiles` (`id` / `omit`), `booleanFormat`.                                        |
| `onSuccess(payload, values)`                      | Recibe lo enviado.                                                                                                                        |
| `extraActions[].visibleWhen`, `.loading`, `.size` | Acciones condicionales y con estado de carga.                                                                                             |

Secciones: `appearance` (`card` / `elevated` / `filled` / `plain`), `padding`, `headerRight`, `addIcon`, `removeIcon`, `removeLabel`, `emptyText`, `initialItems`, `minItems: 0` (arranca
vacía), `canRemove(values, { index, item })` por elemento y reordenamiento activo por defecto. Las
pestañas `disabled` no se validan.

Campos: `tel` con `showCountrySelect` (selector de país y validación por país, `phoneValueFormat`); `step`, `decimals`, `precision`, `rows`, `minRows`, `maxRows`, `ampm` y `minutesStep` aceptan funciones `(values, ctx)`; `size` por campo, adornos en `number`/`select`, `currencySelectorMode`, `valueType: "date"` en
fechas (además aceptan `Date`, ISO con zona y `"YYYY-MM-DD HH:mm:ss"` como valor inicial),
`removedFilesName` para acumular los ids de archivos existentes que el usuario quitó y URLs sueltas
como archivos existentes. `componentProps` llega a todos los tipos.

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
- Secciones repetibles: reordenar está activo por defecto (`canReorder: false` para desactivarlo) y `minItems: 0` arranca sin elementos.
- `onSuccess` recibe `(payload, values)`; las pestañas `disabled` ya no se validan.
- Un `defaultValues` que cambia después de montar reinicia el formulario si no hay cambios (`reinitialize={false}` para el comportamiento anterior); los modales no controlados se limpian al reabrir (`resetOnOpen={false}`).

#### Desde `TbForm` (S4BTabantaj)

- La regla `custom` recibe `(value, formValues, ctx)` (en Tb era `(value, ctx, formValues)`).
- `exactLength` usa `value` (o `length`); `required` con predicado se escribe `{ type: "required", when }`.
- `fileAccept`/`fileMultiple`/`fileMaxFiles`/`fileMaxSize` → `accept`/`multiple`/`maxFiles`/`maxSize`; los ids de archivos quitados se obtienen con `removedFilesName`.
- `disablePast` ya no es el valor por defecto en fechas; actívalo donde haga falta.
- Para el FormData de Tb usa `formDataOptions={{ arrayFormat: "json", existingFiles: "omit" }}`.

---

## Retroalimentación y layout

### Confirmaciones: `CnConfirmDialog` y `useConfirm`

```tsx
// Una vez en la raíz de la app
<CnToastProvider>
  <CnConfirmProvider>
    <App />
  </CnConfirmProvider>
</CnToastProvider>;

const confirm = useConfirm();
const ok = await confirm({
  variant: "delete",                 // delete | danger | warning | info | success | update | neutral
  title: "¿Eliminar a ACME Corp?",
  message: "Se eliminarán sus contratos.",
  requireText: "ACME",               // obliga a escribir el texto (acciones irreversibles)
  onConfirm: () => api.clients.delete(id), // async: muestra carga y, si falla, el error del servidor
});
```

`CnConfirmDialog` también se usa controlado (`open`, `onClose`, `onConfirm`). Es un `alertdialog`
accesible con foco en la acción y presets de texto, ícono y color.

### Notificaciones: `CnToastProvider` y `useToast`

```tsx
const toast = useToast();
toast.success("Cliente guardado", { action: { label: "Deshacer", onClick: undo } });
toast.error(error);  // errores de axios/fetch/Laravel: mensaje + detalles por campo
await toast.promise(api.export(), { loading: "Generando…", success: "Reporte listo" });
const id = toast.loading("Subiendo…"); toast.update(id, { severity: "success", message: "Listo" });
```

Pila con `max` avisos, `position`, pausa al pasar el mouse o enfocar, `aria-live` y duración
mayor para errores. Para integrarlo con react-query basta con llamar a `toast.error(error)` en el
`onError` del `MutationCache`.

### `CnPageContainer`

Encabezado de página con breadcrumbs, botón atrás (`back` con ruta, función o `true` para el
breadcrumb anterior), ícono, título, subtítulo, `actions`, `headerExtra` (filtros o pestañas),
`stickyHeader`, `maxWidth`, `paper` y `loading`. Es independiente del router: pasa
`linkComponent` (p. ej. un `Link` de react-router que reciba `href`) y `onNavigate`.

### `CnMetricCard`

Indicadores con `format`, `prefix`/`suffix`, `icon`, `trend` (`upIsGood: false` cuando subir es
malo, p. ej. costos), `progress` hacia una meta, `sparkline` (línea, área o barras; también
disponible como `CnSparkline`), `footer`, variantes `outlined` / `elevated` / `filled`, `loading`
y `onClick`.

## Tabla de datos

`CnDataTable` usa `@tanstack/react-table` como motor (dependencia incluida) y pinta con MUI y los
tokens de Canek.

```tsx
const columns: CnColumn<Contract>[] = [
  { id: "folio", header: "Folio", type: "code", sticky: true },
  { id: "client.name", header: "Cliente", type: "avatar", cellOptions: { subtitle: (r) => r.client.email } },
  { id: "status", header: "Estado", type: "status", cellOptions: { statusMap: { active: { label: "Vigente", color: "success" } } } },
  { id: "amount", header: "Monto", type: "currency", aggregate: "sum" },
  { id: "rfc", header: "RFC", type: "code", hidden: true },
];

<CnDataTable
  title="Contratos"
  data={contracts}
  columns={columns}
  selectable
  bulkActions={[{ id: "cancel", label: "Cancelar", color: "error", onClick: cancel, confirm: { variant: "danger" } }]}
  rowActions={[
    { id: "edit", label: "Editar", icon: "edit", onClick: edit },
    { id: "delete", label: "Eliminar", icon: "delete", color: "error", confirm: { variant: "delete" }, onClick: remove },
  ]}
  renderDetail={(row) => <ContractSummary contract={row} />}
  persistKey="contracts"
/>;
```

- **Celdas tipadas** (`type`): `text`, `number`, `currency`, `percent`, `date`, `datetime`, `time`,
  `boolean`, `status`, `tags`, `avatar`, `email`, `phone`, `link`, `code`, `progress`, `rating`,
  `image`, `duration`. El mismo formato se usa para buscar, ordenar y exportar; `cell` y
  `exportValue` permiten personalizarlo.
- **Datos:** búsqueda global sin acentos, filtros por columna, orden múltiple (Shift + clic),
  paginación, agregados en el pie (`sum`, `avg`, `min`, `max`, `count`) y rutas anidadas (`client.name`).
- **Acciones:** por fila (menú o `inline`, con `visible`, `disabled` y `confirm`), masivas sobre la
  selección, `onRowClick` y detalle expandible (`renderDetail`).
- **Exportación:** Excel (.xls), CSV, TSV y JSON de los registros filtrados o seleccionados, y copiar al
  portapapeles (se pega como tabla). Protege contra inyección de fórmulas.
- **Vista:** densidad, rayado, columnas visibles, encabezado fijo con `maxHeight`, columna fija
  (`sticky`), tono por fila (`getRowTone`) y tarjetas en móvil (`mobileLayout="cards"`).
- **Persistencia:** con `persistKey` guarda columnas visibles, densidad, orden y tamaño de página.
- **Modo servidor:** `serverSide={{ rowCount, query, onQueryChange }}`; la tabla notifica página, orden,
  búsqueda y filtros, y `fetchAllRows` permite exportar todo.
- La búsqueda y la barra siguen visibles cuando no hay resultados.

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

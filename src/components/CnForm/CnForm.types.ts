import type { GridSize, SxProps, Theme } from "@mui/material";
import type { ReactNode, Ref } from "react";

export type CnFormValues = Record<string, unknown>;

export type CnFormFieldType =
  | "text"
  | "email"
  | "password"
  | "tel"
  | "url"
  | "search"
  | "number"
  | "currency"
  | "phone"
  | "textarea"
  | "select"
  | "autocomplete"
  | "checkbox"
  | "switch"
  | "radio"
  | "date"
  | "time"
  | "datetime"
  | "month"
  | "daterange"
  | "slider"
  | "range"
  | "rating"
  | "file"
  | "richtext"
  | "custom";

export type CnFormSectionContext = {
  sectionId: string;
  index: number;
  /** Valores del elemento actual de la sección repetible. */
  item?: CnFormValues;
};

export type CnFormDynamicMessage =
  string | ((formValues: CnFormValues, ctx?: CnFormSectionContext) => string);

export type CnFormDynamicValue<T> =
  T | ((formValues: CnFormValues, ctx?: CnFormSectionContext) => T);

export type CnFormSelectOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
  /** Texto secundario bajo la etiqueta (select, radio, checkbox group, autocomplete). */
  description?: string;
  /** Agrupa opciones en autocomplete / select. */
  group?: string;
  /** Texto extra usado al buscar en autocomplete (sinónimos, claves...). */
  searchText?: string;
};

/** Alias para usar las opciones fuera de `CnForm`. */
export type CnFieldOption = CnFormSelectOption;

export type CnPhoneCountryCode =
  | "MX"
  | "US"
  | "CA"
  | "ES"
  | "AR"
  | "CO"
  | "CL"
  | "BR"
  | "PE"
  | "GT"
  | "CR"
  | "PA"
  | "DO"
  | "EC"
  | "UY"
  | "VE"
  | "SV"
  | "HN"
  | "NI"
  | "BO"
  | "PY"
  | "GB"
  | "FR"
  | "DE"
  | "IT"
  | "PT";

export type CnPostalCodeFormat =
  "mx" | "us" | "es" | "ar" | "co" | "cl" | "br" | "uk" | "ca" | "de" | "fr" | "it" | "pt" | "intl";

export type CnDateStringFormat = "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";

export type CnValidationRule =
  | { type: "required"; message?: CnFormDynamicMessage }
  | { type: "email"; message?: CnFormDynamicMessage }
  | { type: "url"; message?: CnFormDynamicMessage }
  | { type: "minLength"; value: number; message?: CnFormDynamicMessage }
  | { type: "maxLength"; value: number; message?: CnFormDynamicMessage }
  | { type: "exactLength"; value: number; message?: CnFormDynamicMessage }
  | { type: "min"; value: number; message?: CnFormDynamicMessage }
  | { type: "max"; value: number; message?: CnFormDynamicMessage }
  | { type: "between"; min: number; max: number; message?: CnFormDynamicMessage }
  | { type: "numeric"; message?: CnFormDynamicMessage }
  | { type: "integer"; message?: CnFormDynamicMessage }
  | { type: "positive"; message?: CnFormDynamicMessage }
  | { type: "negative"; message?: CnFormDynamicMessage }
  | { type: "pattern"; value: RegExp; filterPattern?: RegExp; message?: CnFormDynamicMessage }
  | { type: "equalTo"; field: string; message?: CnFormDynamicMessage }
  | { type: "notEqualTo"; field: string; message?: CnFormDynamicMessage }
  | {
      type: "passwordStrength";
      level?: "weak" | "medium" | "strong";
      message?: CnFormDynamicMessage;
    }
  | {
      type: "custom";
      message: CnFormDynamicMessage;
      validate: (value: unknown, formValues: CnFormValues, ctx?: CnFormSectionContext) => boolean;
    }
  | { type: "alphanumeric"; message?: CnFormDynamicMessage }
  | { type: "alphabetic"; message?: CnFormDynamicMessage }
  | { type: "uppercase"; message?: CnFormDynamicMessage }
  | { type: "lowercase"; message?: CnFormDynamicMessage }
  | { type: "noSpaces"; message?: CnFormDynamicMessage }
  | {
      type: "tel";
      message?: CnFormDynamicMessage;
      country?: CnFormDynamicValue<CnPhoneCountryCode>;
    }
  | {
      type: "phone";
      message?: CnFormDynamicMessage;
      country?: CnFormDynamicValue<CnPhoneCountryCode>;
    }
  | { type: "whatsapp"; message?: CnFormDynamicMessage }
  | {
      type: "rfc";
      message?: CnFormDynamicMessage;
      personType?: CnFormDynamicValue<"moral" | "fisica">;
    }
  | { type: "curp"; message?: CnFormDynamicMessage }
  | { type: "ine"; message?: CnFormDynamicMessage }
  | { type: "nss"; message?: CnFormDynamicMessage }
  | { type: "nssOrSsn"; message?: CnFormDynamicMessage }
  | { type: "cpf"; message?: CnFormDynamicMessage }
  | { type: "cnpj"; message?: CnFormDynamicMessage }
  | { type: "nif"; message?: CnFormDynamicMessage }
  | { type: "nie"; message?: CnFormDynamicMessage }
  | { type: "ssn"; message?: CnFormDynamicMessage }
  | { type: "ein"; message?: CnFormDynamicMessage }
  | { type: "passport"; message?: CnFormDynamicMessage }
  | {
      type: "licensePlate";
      message?: CnFormDynamicMessage;
      country?: CnFormDynamicValue<"MX" | "US" | "ES" | "AR">;
    }
  | {
      type: "postalCode";
      message?: CnFormDynamicMessage;
      format?: CnFormDynamicValue<CnPostalCodeFormat>;
    }
  | { type: "creditCard"; message?: CnFormDynamicMessage }
  | { type: "creditCardExpiry"; message?: CnFormDynamicMessage }
  | { type: "creditCardCVV"; message?: CnFormDynamicMessage }
  | {
      type: "date";
      message?: CnFormDynamicMessage;
      format?: CnFormDynamicValue<CnDateStringFormat>;
      minDate?: string | ((formValues: CnFormValues) => string);
      maxDate?: string | ((formValues: CnFormValues) => string);
    }
  | { type: "time"; message?: CnFormDynamicMessage; format?: CnFormDynamicValue<"12h" | "24h"> }
  | { type: "datetime"; message?: CnFormDynamicMessage }
  | { type: "decimal"; message?: CnFormDynamicMessage; decimals?: number }
  | { type: "domain"; message?: CnFormDynamicMessage }
  | {
      type: "ip";
      message?: CnFormDynamicMessage;
      version?: "ipv4" | "ipv6" | "both";
    }
  | { type: "minItems"; value: number; message?: CnFormDynamicMessage }
  | { type: "maxItems"; value: number; message?: CnFormDynamicMessage }
  | { type: "maxFiles"; value: number; message?: CnFormDynamicMessage }
  | { type: "minFiles"; value: number; message?: CnFormDynamicMessage }
  | { type: "maxSize"; value: number; message?: CnFormDynamicMessage }
  | { type: "fileType"; types: string[]; message?: CnFormDynamicMessage };

export type CnFormGridProps = {
  xs?: GridSize;
  sm?: GridSize;
  md?: GridSize;
  lg?: GridSize;
  xl?: GridSize;
};

/** Props que recibe `render` en un campo `type: "custom"` enlazado al formulario. */
export type CnFormCustomRenderProps = {
  name: string;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  error: boolean;
  helperText?: string;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  formValues: CnFormValues;
  sectionContext?: CnFormSectionContext;
};

export type CnFormAsyncValidator = (
  value: unknown,
  formValues: CnFormValues,
  ctx?: CnFormSectionContext,
) => Promise<string | null | undefined | void> | string | null | undefined | void;

export type CnFormField = CnFormGridProps & {
  /** Ruta del valor. Acepta rutas anidadas (`address.city`). */
  name: string;
  type: CnFormFieldType;
  label?: CnFormDynamicValue<string>;
  placeholder?: CnFormDynamicValue<string>;
  helperText?: CnFormDynamicMessage;
  required?: CnFormDynamicValue<boolean>;
  disabled?: CnFormDynamicValue<boolean>;
  readOnly?: CnFormDynamicValue<boolean>;
  visibleWhen?: (formValues: CnFormValues, ctx?: CnFormSectionContext) => boolean;
  /** Valor inicial; puede depender de los valores actuales (útil en secciones repetibles). */
  defaultValue?: unknown | ((formValues: CnFormValues) => unknown);
  rules?: CnFormDynamicValue<CnValidationRule[]>;
  /** Validación asíncrona (p. ej. "correo ya registrado"). Se ejecuta en blur y al enviar. */
  validateAsync?: CnFormAsyncValidator;

  options?: CnFormDynamicValue<CnFormSelectOption[]>;
  multiple?: boolean;
  /** Muestra la selección múltiple como chips. */
  chips?: boolean;
  clearable?: boolean;
  /** autocomplete: permite escribir valores que no están en las opciones. */
  freeSolo?: boolean;
  loading?: boolean;
  /** autocomplete: notifica lo que se escribe (búsqueda remota). */
  onInputChange?: (input: string, formValues: CnFormValues) => void;
  direction?: "row" | "column";
  labelPlacement?: "start" | "end" | "top" | "bottom";
  description?: string;

  multiline?: boolean;
  rows?: number;
  minRows?: number;
  maxRows?: number;
  maxLength?: number;
  showCounter?: boolean;
  transform?: "uppercase" | "lowercase" | "capitalize" | "none";
  passwordToggle?: boolean;
  showPasswordStrength?: boolean;

  min?: CnFormDynamicValue<number>;
  max?: CnFormDynamicValue<number>;
  step?: number;
  decimals?: number;
  /** @deprecated Usa `controls`. */
  showSteppers?: boolean;
  /** number/currency: estilo de los controles (`stacked`, `split`, `inline`, `none`). */
  controls?: "stacked" | "split" | "inline" | "none";
  largeStep?: number;
  snapToStep?: boolean;
  allowWheel?: boolean;
  thousandSeparator?: boolean;
  prefix?: string;
  suffix?: string;

  currency?: CnFormDynamicValue<string>;
  currencies?: string[];
  /** Guarda la moneda seleccionada en esta ruta del formulario. */
  currencyName?: string;
  locale?: string;

  defaultCountry?: CnPhoneCountryCode;
  countries?: CnPhoneCountryCode[];

  minDate?: CnFormDynamicValue<string | undefined>;
  maxDate?: CnFormDynamicValue<string | undefined>;
  disablePast?: boolean;
  disableFuture?: boolean;
  disableWeekends?: boolean;
  /** Días de la semana deshabilitados (0 = domingo). */
  disabledDays?: number[];
  /** Fechas puntuales deshabilitadas (`YYYY-MM-DD`). */
  disabledDates?: CnFormDynamicValue<string[]>;
  shouldDisableDate?: (isoDate: string, formValues: CnFormValues) => boolean;
  /** Formato visible de captura de fechas. */
  dateFormat?: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  ampm?: boolean;
  minutesStep?: number;
  views?: ("day" | "month" | "year")[];
  highlightedDates?: CnFormDynamicValue<string[]>;
  /** daterange: duración máxima en días. */
  maxDays?: number;
  /** daterange: atajos ("Últimos 7 días"…). */
  presets?: boolean;

  marks?: boolean | { value: number; label?: string }[];
  precision?: number;

  accept?: string;
  maxFiles?: number;
  /** Tamaño máximo por archivo en MB. */
  maxSize?: number;
  reorderable?: boolean;
  fileVariant?: "dropzone" | "button" | "compact" | "grid" | "card" | "avatar";
  /** Tamaño máximo sumando todos los archivos, en MB. */
  maxTotalSize?: number;
  imageConstraints?: {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    aspectRatio?: number;
  };
  downloadable?: boolean;
  /** Abre la cámara en móviles. */
  capture?: "user" | "environment";
  showPrimary?: boolean;
  /** Visor de imágenes y PDF al hacer clic. */
  enableLightbox?: boolean;

  autoComplete?: string;
  autoFocus?: boolean;
  startAdornment?: ReactNode | ((value: unknown, formValues: CnFormValues) => ReactNode);
  endAdornment?: ReactNode | ((value: unknown, formValues: CnFormValues) => ReactNode);
  startIcon?: string;
  endIcon?: string;

  /**
   * Props adicionales para el componente del campo (number, currency, fechas,
   * file y tipos registrados), p. ej. `{ fileStatus, onFilesAdded }` en `file`
   * o `{ toolbar: "full", onUploadImage }` en `richtext`.
   */
  componentProps?: Record<string, unknown>;

  /** Solo `type: "custom"`: renderiza un control propio enlazado al estado del formulario. */
  render?: (props: CnFormCustomRenderProps) => ReactNode;

  /**
   * Se llama al cambiar el valor. Puede devolver otros valores a actualizar
   * (por ruta, p. ej. `{ "address.city": "" }`).
   */
  onFieldChange?: (
    newValue: unknown,
    formValues: CnFormValues,
    fieldName: string,
  ) => Record<string, unknown> | void;

  sx?: SxProps<Theme>;
  className?: string;
};

export type CnFormCustomElement = CnFormGridProps & {
  type: "custom";
  component: ReactNode;
  visibleWhen?: (formValues: CnFormValues, ctx?: CnFormSectionContext) => boolean;
};

export type CnFormFieldOrCustom = CnFormField | CnFormCustomElement;

export type CnFormSection = {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  icon?: string;
  fields: readonly CnFormFieldOrCustom[];
  columns?: 1 | 2 | 3 | 4;
  visibleWhen?: (formValues: CnFormValues) => boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;

  /** Los valores se guardan como arreglo en `values[id]`. */
  repeatable?: boolean;
  minItems?: number;
  maxItems?: number;
  /** Título de cada elemento; por defecto `${title} ${n}`. */
  itemTitle?: (index: number, item: CnFormValues) => ReactNode;
  addLabel?: string;
  canAdd?: CnFormDynamicValue<boolean>;
  canRemove?: CnFormDynamicValue<boolean>;
  canReorder?: CnFormDynamicValue<boolean>;
  /** Valores iniciales de cada elemento nuevo (se combinan con los `defaultValue` de los campos). */
  newItem?: CnFormValues | ((formValues: CnFormValues) => CnFormValues);
};

export type CnFormGroup = {
  fields?: readonly CnFormFieldOrCustom[];
  sections?: readonly CnFormSection[];
};

export type CnFormTab = CnFormGroup & {
  id: string;
  label: string;
  subtitle?: string;
  icon?: string;
  description?: ReactNode;
  disabled?: boolean;
  visibleWhen?: (formValues: CnFormValues) => boolean;
};

export type CnFormStep = CnFormGroup & {
  id: string;
  title: string;
  description?: ReactNode;
  optional?: boolean;
  visibleWhen?: (formValues: CnFormValues) => boolean;
  /** Validación adicional al avanzar; devuelve errores por ruta. */
  validate?: (formValues: CnFormValues) => Record<string, string> | void;
};

export type CnFormVariant = "simple" | "sectioned" | "tabbed" | "wizard";
export type CnFormMode = "inline" | "modal";
export type CnFormSize = "sm" | "md" | "lg";
export type CnFormDialogWidth = "xs" | "sm" | "md" | "lg" | "xl";
export type CnFormSubmitMode = "json" | "formdata" | "auto";
export type CnFormValidateOn = "blur" | "change" | "submit";
export type CnFormErrorSummary = "inline" | "toast" | "none";
export type CnFormActionsAlign = "start" | "end" | "between" | "stretch";

export type CnFormButtonColor =
  "primary" | "secondary" | "success" | "warning" | "error" | "info" | "accent" | "neutral";

export type CnFormButtonProps = {
  label?: string;
  variant?: "contained" | "outlined" | "text";
  color?: CnFormButtonColor;
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  icon?: string;
  disabled?: boolean;
};

export type CnFormExtraAction = {
  key: string;
  label: string;
  icon?: string;
  variant?: "contained" | "outlined" | "text";
  color?: CnFormButtonColor;
  disabled?: boolean;
  /** Valida el formulario antes de ejecutar la acción. */
  validate?: boolean;
  onClick: (values: CnFormValues, helpers: CnFormHelpers) => void | Promise<void>;
};

export type CnFormLabels = {
  submit: string;
  submitting: string;
  cancel: string;
  next: string;
  back: string;
  add: string;
  remove: string;
  moveUp: string;
  moveDown: string;
  expand: string;
  collapse: string;
  optional: string;
  errorSummaryTitle: string;
  errorSummaryDescription: (count: number) => string;
  discardTitle: string;
  discardMessage: string;
  discardConfirm: string;
  discardCancel: string;
  stepOf: (current: number, total: number) => string;
};

export type CnFormLoadingStates = {
  sections?: Record<string, boolean>;
  tabs?: Record<string, boolean>;
  steps?: Record<string, boolean>;
};

export type CnFormSubmitContext<TValue extends CnFormValues = CnFormValues> = {
  values: TValue;
  helpers: CnFormHelpers;
};

export type CnFormHelpers = {
  reset: (values?: CnFormValues) => void;
  setErrors: (errors: Record<string, string>) => void;
  setFieldValue: (path: string, value: unknown) => void;
};

/** API imperativa expuesta mediante `formRef`. */
export type CnFormHandle = CnFormHelpers & {
  submit: () => Promise<boolean>;
  validate: () => Promise<boolean>;
  getValues: () => CnFormValues;
  isDirty: () => boolean;
};

export type CnFormProps<TValue extends CnFormValues = CnFormValues> = {
  variant?: CnFormVariant;
  fields?: readonly CnFormFieldOrCustom[];
  sections?: readonly CnFormSection[];
  tabs?: readonly CnFormTab[];
  steps?: readonly CnFormStep[];

  /** Modo controlado. Si se omite, el formulario gestiona su propio estado. */
  value?: TValue;
  /** Valores iniciales (modo no controlado) y destino de `reset()`. */
  defaultValues?: Partial<TValue>;
  /**
   * `patch` contiene solo las claves de primer nivel que cambiaron (con sus
   * objetos anidados completos), así que `setValue(v => ({ ...v, ...patch }))`
   * funciona con rutas anidadas y secciones repetibles.
   */
  onChange?: (patch: Partial<TValue>, values: TValue) => void;
  /**
   * Recibe el payload ya construido (JSON o FormData según `submitMode`).
   * Si lanza un error, sus errores de campo se muestran automáticamente.
   */
  onSubmit?: (payload: TValue | FormData, ctx: CnFormSubmitContext<TValue>) => void | Promise<void>;
  onCancel?: () => void;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  onDirtyChange?: (dirty: boolean) => void;

  title?: ReactNode;
  description?: ReactNode;

  size?: CnFormSize;
  columns?: 1 | 2 | 3 | 4;

  submitLabel?: string;
  cancelLabel?: string;
  submitIcon?: string;
  cancelIcon?: string;
  submitButtonProps?: CnFormButtonProps;
  cancelButtonProps?: CnFormButtonProps;
  extraActions?: CnFormExtraAction[];
  actionsAlign?: CnFormActionsAlign;
  stickyActions?: boolean;
  hideActions?: boolean;
  showSubmitButton?: boolean;
  showCancelButton?: boolean;
  labels?: Partial<CnFormLabels>;

  isSubmitting?: boolean;
  isLoading?: boolean;
  loadingStates?: CnFormLoadingStates;
  disabled?: boolean;
  readOnly?: boolean;

  validateOn?: CnFormValidateOn;
  serverError?: unknown;
  error?: ReactNode;
  errorSummary?: CnFormErrorSummary;
  scrollToFirstError?: boolean;
  resetAfterSubmit?: boolean;
  resetOnCancel?: boolean;
  /** Pide confirmación al salir de la página o cerrar el modal con cambios sin guardar. */
  warnOnUnsavedChanges?: boolean;

  submitMode?: CnFormSubmitMode;
  buildPayload?: (values: TValue) => CnFormValues;
  excludeFields?: string[];
  /** Excluye del payload los campos ocultos por `visibleWhen`. */
  omitHiddenFields?: boolean;
  dateFormat?: (date: Date) => string;

  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  tabsOrientation?: "horizontal" | "vertical";

  activeStep?: number;
  onStepChange?: (step: number) => void;
  stepperOrientation?: "horizontal" | "vertical";
  /** Permite saltar a pasos ya visitados desde el stepper. */
  allowStepNavigation?: boolean;

  mode?: CnFormMode;
  open?: boolean;
  onClose?: () => void;
  dialogMaxWidth?: CnFormDialogWidth;
  dialogFullScreen?: boolean;
  dialogHeaderRight?: ReactNode;

  formRef?: Ref<CnFormHandle>;
  externalSubmitRef?: { current: (() => Promise<boolean>) | null };
  /** Campos adicionales a validar que no se renderizan (formularios divididos en varios componentes). */
  allFieldsForValidation?: readonly CnFormFieldOrCustom[];

  id?: string;
  sx?: SxProps<Theme>;
  className?: string;
  fieldSx?: SxProps<Theme>;
};

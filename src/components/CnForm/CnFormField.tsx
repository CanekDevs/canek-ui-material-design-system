import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import type { GridSize } from "@mui/material";
import type { ReactNode } from "react";
import { isValidElement, memo } from "react";
import type { CnFieldSize } from "../../utils/field-styles";
import { CnAutocompleteField } from "../CnAutocompleteField";
import { CnCheckboxField } from "../CnCheckboxField";
import type { CnCheckboxValue } from "../CnCheckboxField";
import { CnCurrencyField } from "../CnCurrencyField";
import { CnDateField, CnDateRangeField } from "../CnDateField";
import type { CnDateRangeValue } from "../CnDateField";
import { CnFileField } from "../CnFileField";
import type { CnFileValue } from "../CnFileField";
import { CnNumberField } from "../CnNumberField";
import { CnPhoneField } from "../CnPhoneField";
import { CnRadioGroupField } from "../CnRadioGroupField";
import type { CnRadioValue } from "../CnRadioGroupField";
import { CnRatingField } from "../CnRatingField";
import { CnSelectField } from "../CnSelectField";
import type { CnSelectValue } from "../CnSelectField";
import { CnSliderField } from "../CnSliderField";
import type { CnSliderValue } from "../CnSliderField";
import { CnSwitchField } from "../CnSwitchField";
import { CnTextField } from "../CnTextField";
import type { CnTextFieldType } from "../CnTextField";
import { evaluate, getDefaultGrid } from "./CnForm.engine";
import { getNestedValue } from "./CnForm.helpers";
import type {
  CnFormCustomRenderProps,
  CnFormDynamicValue,
  CnFormField,
  CnFormSectionContext,
  CnFormValues,
  CnValidationRule,
} from "./CnForm.types";

/** Renderizador para un tipo de campo registrado con `registerFormFieldType`. */
export type CnFormFieldRenderer = (
  props: CnFormCustomRenderProps & {
    field: CnFormField;
    id: string;
    label?: string;
    placeholder?: string;
  },
) => ReactNode;

const fieldRenderers = new Map<string, CnFormFieldRenderer>();
const warnedTypes = new Set<string>();

/**
 * Registra (o reemplaza) el renderizador de un tipo de campo de `CnForm`.
 * Así se integran campos con dependencias opcionales (p. ej. `richtext`) o
 * controles propios reutilizables por toda la aplicación.
 */
export const registerFormFieldType = (type: string, renderer: CnFormFieldRenderer): void => {
  fieldRenderers.set(type, renderer);
};

export type CnFormFieldControlProps = {
  field: CnFormField;
  /** Ruta completa; por defecto `field.name`. */
  path?: string;
  value: unknown;
  error?: string;
  formValues: CnFormValues;
  sectionContext?: CnFormSectionContext;
  disabled?: boolean;
  readOnly?: boolean;
  size?: CnFieldSize;
  columns?: number;
  onChange: (nextValue: unknown) => void;
  onBlur?: () => void;
  /** Escribe en otra ruta del formulario (p. ej. la moneda de un campo `currency`). */
  onSetValue?: (path: string, value: unknown) => void;
};

const TEXT_TYPES: Record<string, CnTextFieldType> = {
  text: "text",
  email: "email",
  password: "password",
  tel: "tel",
  url: "url",
  search: "search",
  textarea: "textarea",
};

const renderAdornment = (
  adornment: CnFormField["startAdornment"],
  value: unknown,
  formValues: CnFormValues,
): ReactNode => (typeof adornment === "function" ? adornment(value, formValues) : adornment);

const FieldContent = ({
  field,
  path,
  value,
  error,
  formValues,
  sectionContext: ctx,
  disabled = false,
  readOnly = false,
  size = "md",
  onChange,
  onBlur,
  onSetValue,
}: Omit<CnFormFieldControlProps, "columns"> & { path: string }) => {
  const label = evaluate(field.label, formValues, ctx);
  const placeholder = evaluate(field.placeholder, formValues, ctx);
  const helper = evaluate(
    field.helperText as CnFormDynamicValue<string> | undefined,
    formValues,
    ctx,
  );
  const required = Boolean(evaluate(field.required, formValues, ctx));
  const isDisabled = disabled || Boolean(evaluate(field.disabled, formValues, ctx));
  const isReadOnly = readOnly || Boolean(evaluate(field.readOnly, formValues, ctx));
  const options = evaluate(field.options, formValues, ctx) ?? [];
  const min = evaluate(field.min, formValues, ctx);
  const max = evaluate(field.max, formValues, ctx);

  // El formulario es la única fuente de verdad de los errores: los campos no
  // se validan solos y solo muestran lo que reciben.
  const common = {
    id: `cn-form-${path.replace(/[^\w-]/g, "-")}`,
    name: path,
    label,
    required,
    disabled: isDisabled,
    readOnly: isReadOnly,
    error: Boolean(error),
    helperText: error || helper || undefined,
    internalValidation: false,
    formValues,
    sectionContext: ctx,
    size,
    onBlur,
    sx: field.sx,
    className: field.className,
  };

  const textType = TEXT_TYPES[field.type];
  if (textType) {
    const rules = evaluate(field.rules, formValues, ctx) as CnValidationRule[] | undefined;
    return (
      <CnTextField
        {...common}
        onBlur={() => onBlur?.()}
        type={field.multiline && textType === "text" ? "textarea" : textType}
        placeholder={placeholder}
        value={value === null || value === undefined ? "" : String(value)}
        onChange={onChange}
        rules={rules}
        maxLength={field.maxLength}
        showCounter={field.showCounter}
        transform={field.transform}
        passwordToggle={field.passwordToggle ?? textType === "password"}
        showPasswordStrength={field.showPasswordStrength}
        clearable={field.clearable}
        autoComplete={field.autoComplete}
        autoFocus={field.autoFocus}
        rows={field.rows}
        minRows={field.minRows}
        maxRows={field.maxRows}
        startIcon={field.startIcon}
        endIcon={field.endIcon}
        startAdornment={renderAdornment(field.startAdornment, value, formValues)}
        endAdornment={renderAdornment(field.endAdornment, value, formValues)}
        reserveHelperSpace
      />
    );
  }

  switch (field.type) {
    case "number":
      return (
        <CnNumberField
          {...common}
          placeholder={placeholder}
          value={
            typeof value === "number" ? value : value === "" || value == null ? null : Number(value)
          }
          onChange={onChange}
          min={min}
          max={max}
          step={field.step}
          decimals={field.decimals}
          controls={field.controls ?? (field.showSteppers ? "inline" : undefined)}
          largeStep={field.largeStep}
          snapToStep={field.snapToStep}
          allowWheel={field.allowWheel}
          clearable={field.clearable}
          thousandSeparator={field.thousandSeparator}
          {...field.componentProps}
          prefix={field.prefix}
          suffix={field.suffix}
          locale={field.locale}
          autoFocus={field.autoFocus}
          reserveHelperSpace
        />
      );
    case "currency": {
      const currencyFromForm = field.currencyName
        ? (getNestedValue(formValues, field.currencyName) as string | undefined)
        : undefined;
      return (
        <CnCurrencyField
          {...common}
          placeholder={placeholder}
          value={
            typeof value === "number" ? value : value === "" || value == null ? null : Number(value)
          }
          onChange={onChange}
          min={min ?? 0}
          max={max}
          step={field.step}
          decimals={field.decimals ?? 2}
          locale={field.locale}
          currency={currencyFromForm || evaluate(field.currency, formValues, ctx) || "MXN"}
          currencies={field.currencies}
          currencySelectorMode={field.currencyName ? "editable" : "hidden"}
          controls={field.controls}
          allowWheel={field.allowWheel}
          {...field.componentProps}
          onCurrencyChange={(next) => field.currencyName && onSetValue?.(field.currencyName, next)}
          autoFocus={field.autoFocus}
          reserveHelperSpace
        />
      );
    }
    case "phone":
      return (
        <CnPhoneField
          {...common}
          placeholder={placeholder}
          value={String(value ?? "")}
          onChange={onChange}
          defaultCountry={field.defaultCountry}
          countries={field.countries}
          autoFocus={field.autoFocus}
          reserveHelperSpace
        />
      );
    case "select":
      return (
        <CnSelectField
          {...common}
          placeholder={placeholder}
          options={options}
          multiple={field.multiple}
          chips={field.chips}
          clearable={field.clearable}
          value={(value ?? (field.multiple ? [] : "")) as CnSelectValue}
          onChange={onChange}
          autoFocus={field.autoFocus}
          reserveHelperSpace
        />
      );
    case "autocomplete":
      return (
        <CnAutocompleteField
          {...common}
          placeholder={placeholder}
          options={options}
          multiple={field.multiple}
          freeSolo={field.freeSolo}
          loading={field.loading}
          onInputChange={
            field.onInputChange ? (input) => field.onInputChange?.(input, formValues) : undefined
          }
          value={
            (value ?? (field.multiple ? [] : null)) as
              string | number | null | Array<string | number>
          }
          onChange={onChange}
          autoFocus={field.autoFocus}
          reserveHelperSpace
        />
      );
    case "checkbox":
      return (
        <CnCheckboxField
          {...common}
          options={field.options ? options : undefined}
          direction={field.direction}
          description={field.description}
          labelPlacement={field.labelPlacement}
          value={(value ?? (field.options ? [] : false)) as CnCheckboxValue}
          onChange={onChange}
        />
      );
    case "switch":
      return (
        <CnSwitchField
          {...common}
          description={field.description}
          labelPlacement={field.labelPlacement}
          value={Boolean(value)}
          onChange={onChange}
        />
      );
    case "radio":
      return (
        <CnRadioGroupField
          {...common}
          options={options}
          direction={field.direction}
          value={(value ?? "") as CnRadioValue}
          onChange={onChange}
        />
      );
    case "date":
    case "time":
    case "datetime":
    case "month":
      return (
        <CnDateField
          {...common}
          type={field.type}
          value={String(value ?? "")}
          onChange={onChange}
          min={evaluate(field.minDate, formValues, ctx)}
          max={evaluate(field.maxDate, formValues, ctx)}
          disablePast={field.disablePast}
          disableFuture={field.disableFuture}
          disableWeekends={field.disableWeekends}
          disabledDays={field.disabledDays}
          disabledDates={evaluate(field.disabledDates, formValues, ctx)}
          shouldDisableDate={
            field.shouldDisableDate
              ? (iso) => Boolean(field.shouldDisableDate?.(iso, formValues))
              : undefined
          }
          highlightedDates={evaluate(field.highlightedDates, formValues, ctx)}
          format={field.dateFormat}
          ampm={field.ampm}
          minutesStep={field.minutesStep}
          step={field.step}
          views={field.views}
          placeholder={placeholder}
          clearable={field.clearable}
          autoFocus={field.autoFocus}
          reserveHelperSpace
          {...field.componentProps}
        />
      );
    case "daterange":
      return (
        <CnDateRangeField
          {...common}
          value={(Array.isArray(value) ? value : ["", ""]) as CnDateRangeValue}
          onChange={onChange}
          min={evaluate(field.minDate, formValues, ctx)}
          max={evaluate(field.maxDate, formValues, ctx)}
          disablePast={field.disablePast}
          disableFuture={field.disableFuture}
          disableWeekends={field.disableWeekends}
          disabledDays={field.disabledDays}
          disabledDates={evaluate(field.disabledDates, formValues, ctx)}
          highlightedDates={evaluate(field.highlightedDates, formValues, ctx)}
          format={field.dateFormat}
          maxDays={field.maxDays}
          presets={field.presets ?? true}
          reserveHelperSpace
        />
      );
    case "slider":
    case "range":
      return (
        <CnSliderField
          {...common}
          range={field.type === "range"}
          min={min}
          max={max}
          step={field.step}
          marks={field.marks}
          value={value as CnSliderValue}
          onChange={onChange}
        />
      );
    case "rating":
      return (
        <CnRatingField
          {...common}
          max={max}
          precision={field.precision}
          value={typeof value === "number" ? value : null}
          onChange={onChange}
        />
      );
    case "file":
      return (
        <CnFileField
          {...common}
          variant={field.fileVariant}
          accept={field.accept}
          multiple={field.multiple}
          maxFiles={field.maxFiles}
          maxSize={field.maxSize}
          reorderable={field.reorderable}
          enableLightbox={field.enableLightbox}
          maxTotalSize={field.maxTotalSize}
          imageConstraints={field.imageConstraints}
          downloadable={field.downloadable}
          capture={field.capture}
          showPrimary={field.showPrimary}
          {...field.componentProps}
          value={(Array.isArray(value) ? value : []) as CnFileValue[]}
          onChange={onChange}
        />
      );
    case "custom":
      if (!field.render && fieldRenderers.has("custom")) break;
      return field.render ? (
        <>
          {field.render({
            name: path,
            value,
            onChange,
            onBlur: () => onBlur?.(),
            error: Boolean(error),
            helperText: error || helper || undefined,
            disabled: isDisabled,
            readOnly: isReadOnly,
            required,
            formValues,
            sectionContext: ctx,
          })}
        </>
      ) : null;
    default:
      break;
  }

  const renderer = fieldRenderers.get(field.type);
  const renderProps = {
    field,
    id: common.id,
    name: path,
    label,
    placeholder,
    value,
    onChange,
    onBlur: () => onBlur?.(),
    error: Boolean(error),
    helperText: error || helper || undefined,
    disabled: isDisabled,
    readOnly: isReadOnly,
    required,
    formValues,
    sectionContext: ctx,
  };
  if (renderer) return <>{renderer(renderProps)}</>;

  if (field.type === "richtext") {
    if (!warnedTypes.has("richtext")) {
      warnedTypes.add("richtext");
      console.warn(
        '[CnForm] El tipo "richtext" requiere registrarse: import { registerRichTextFieldType } from "@canek-ui/material-design-system/rich-text"; registerRichTextFieldType();',
      );
    }
    // Degradación segura: el HTML se edita como texto plano.
    return (
      <CnTextField
        {...common}
        type="textarea"
        placeholder={placeholder}
        value={value === null || value === undefined ? "" : String(value)}
        onChange={onChange}
        minRows={4}
      />
    );
  }
  return null;
};

/** Renderiza un campo declarativo de `CnForm` dentro de su celda del grid. */
export const CnFormFieldControl = memo(function CnFormFieldControl({
  columns = 1,
  ...props
}: CnFormFieldControlProps) {
  const path = props.path ?? props.field.name;
  return (
    <Grid
      size={getDefaultGrid(props.field, columns)}
      data-cn-field-path={path}
      sx={{ minWidth: 0 }}
    >
      <FieldContent {...props} path={path} />
    </Grid>
  );
});

export const renderCustomElement = (
  component: ReactNode,
  grid: { xs?: GridSize; sm?: GridSize; md?: GridSize; lg?: GridSize; xl?: GridSize } = {},
  key?: string,
): ReactNode => {
  const size = { xs: grid.xs ?? 12, sm: grid.sm, md: grid.md ?? 12, lg: grid.lg, xl: grid.xl };
  return (
    <Grid key={key} size={size} sx={{ minWidth: 0 }}>
      {isValidElement(component) ? <Box sx={{ width: "100%" }}>{component}</Box> : component}
    </Grid>
  );
};

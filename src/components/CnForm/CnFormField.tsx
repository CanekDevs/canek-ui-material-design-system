import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import type { GridSize } from "@mui/material";
import type { KeyboardEvent, ReactNode } from "react";
import { isValidElement, memo, useMemo, useRef } from "react";
import { useAsyncOptions } from "../../utils/use-async-options";
import type { CnLoadOptionsContext, CnResolveOptions } from "../../utils/use-async-options";
import type { CnFieldSize } from "../../utils/field-styles";
import { CnAddressField } from "../CnAddressField";
import type { CnAddressValue } from "../CnAddressField";
import { CnCodeField } from "../CnCodeField";
import { CnDurationField } from "../CnDurationField";
import { CnLocationField } from "../CnLocationField";
import type { CnLocationValue } from "../CnLocationField";
import { CnRepeaterField } from "../CnRepeaterField";
import { CnScheduleField } from "../CnScheduleField";
import type { CnScheduleValue } from "../CnScheduleField";
import { CnSearchField } from "../CnSearchField";
import { CnTimeRangeField } from "../CnTimeRangeField";
import type { CnTimeRangeValue } from "../CnTimeRangeField";
import { CnWeekdaysField } from "../CnWeekdaysField";
import { CnChoiceCardsField } from "../CnChoiceCardsField";
import type { CnChoiceCardsValue } from "../CnChoiceCardsField";
import { CnColorField } from "../CnColorField";
import { CnKeyValueField } from "../CnKeyValueField";
import type { CnKeyValueValue } from "../CnKeyValueField";
import { CnTransferListField } from "../CnTransferListField";
import { CnTreeSelectField } from "../CnTreeSelectField";
import type { CnTreeOption, CnTreeSelectValue } from "../CnTreeSelectField";
import { CnCountryField } from "../CnCountryField";
import { CnMaskedField } from "../CnMaskedField";
import { CnNumberRangeField } from "../CnNumberRangeField";
import type { CnNumberRangeValue } from "../CnNumberRangeField";
import { CnOtpField } from "../CnOtpField";
import { CnPasswordField } from "../CnPasswordField";
import { CnSegmentedField } from "../CnSegmentedField";
import type { CnSegmentedValue } from "../CnSegmentedField";
import { CnSignatureField } from "../CnSignatureField";
import { CnTagsField } from "../CnTagsField";
import { CnAutocompleteField } from "../CnAutocompleteField";
import { CnCheckboxField } from "../CnCheckboxField";
import type { CnCheckboxValue } from "../CnCheckboxField";
import { CnCurrencyField } from "../CnCurrencyField";
import { CnDateField, CnDateRangeField } from "../CnDateField";
import type { CnDateRangeValue } from "../CnDateField";
import { CnFileField } from "../CnFileField";
import type { CnExistingFile, CnFileValue } from "../CnFileField";
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
import {
  evaluate,
  getDefaultGrid,
  isoToDate,
  normalizeDateValue,
  resolveDependencyPaths,
} from "./CnForm.engine";
import { isEmptyValue } from "./CnForm.validation";
import { getNestedValue } from "./CnForm.helpers";
import type {
  CnFormCustomRenderProps,
  CnFormDynamicValue,
  CnFormField,
  CnFormSectionContext,
  CnFormSelectOption,
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

const EMPTY_OPTIONS: readonly CnFormSelectOption[] = [];

/**
 * Normaliza el valor de un campo de archivos: acepta arreglos, un solo
 * archivo y URLs sueltas (`"https://…/foto.jpg"` → archivo existente).
 */
const toFileValues = (value: unknown): CnFileValue[] => {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .filter((item) => item !== null && item !== undefined && item !== "")
    .map((item) => {
      if (typeof item !== "string") return item as CnFileValue;
      const name = decodeURIComponent(item.split(/[?#]/)[0].split("/").pop() || "archivo");
      return { id: item, url: item, name };
    });
};

const TEXT_TYPES: Record<string, CnTextFieldType> = {
  text: "text",
  email: "email",
  tel: "tel",
  url: "url",
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
  // ─── Dependencias y opciones remotas ───────────────────────────────
  const depPaths = resolveDependencyPaths(field.dependsOn, ctx);
  const depValues = depPaths.map((dep) => getNestedValue(formValues, dep));
  const depsMissing = depValues.some((dep) => isEmptyValue(dep));
  const formValuesRef = useRef(formValues);
  formValuesRef.current = formValues;
  const loader = field.loadOptions;
  const boundLoader = useMemo(
    () =>
      loader
        ? (args: CnLoadOptionsContext) =>
            loader({ ...args, formValues: formValuesRef.current, sectionContext: ctx })
        : undefined,
    // `ctx` cambia de identidad en cada render; basta con su índice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loader, ctx?.sectionId, ctx?.index],
  );
  const resolver = field.resolveOptions;
  const boundResolve = useMemo<CnResolveOptions | undefined>(
    () =>
      resolver
        ? (values, { signal }) => resolver(values, { signal, formValues: formValuesRef.current })
        : undefined,
    [resolver],
  );
  const optionLabel = field.getOptionLabel;
  const getValueLabel = useMemo(
    () =>
      optionLabel
        ? (item: string | number) => optionLabel({ value: item, label: String(item) })
        : undefined,
    [optionLabel],
  );
  // Listas grandes: select y transferlist buscan y paginan en el servidor
  // cuando se pide (`pageSize`/`resolveOptions`) o cuando el loader devuelve
  // páginas; autocomplete siempre busca por su cuenta.
  const serverSideCapable = field.type === "select" || field.type === "transferlist";
  const forcedServerSide =
    serverSideCapable && (field.pageSize !== undefined || Boolean(field.resolveOptions));
  const isSearchField = field.type === "autocomplete" || forcedServerSide;
  const remote = useAsyncOptions({
    loadOptions: isSearchField ? undefined : boundLoader,
    deps: depValues,
    disabled: depsMissing,
    cacheKey: field.optionsCacheKey,
  });
  const serverSide =
    Boolean(boundLoader) && (forcedServerSide || (serverSideCapable && remote.paginated));
  const serverProps = serverSide
    ? {
        loadOptions: boundLoader,
        loadOptionsDeps: depValues,
        pageSize: field.pageSize,
        minSearchLength: field.minSearchLength,
        searchDebounceMs: field.searchDebounceMs,
        resolveOptions: boundResolve,
        selectedOptions: field.selectedOptions,
        cacheKey: field.optionsCacheKey,
      }
    : {};

  const label = evaluate(field.label, formValues, ctx);
  const placeholder = evaluate(field.placeholder, formValues, ctx);
  const helper = evaluate(
    field.helperText as CnFormDynamicValue<string> | undefined,
    formValues,
    ctx,
  );
  const required = Boolean(evaluate(field.required, formValues, ctx));
  const isDisabled = disabled || Boolean(evaluate(field.disabled, formValues, ctx)) || depsMissing;
  const isReadOnly =
    readOnly || Boolean(field.compute) || Boolean(evaluate(field.readOnly, formValues, ctx));
  const staticOptions = evaluate(field.options, formValues, ctx) ?? EMPTY_OPTIONS;
  const rawOptions = boundLoader && !isSearchField && !serverSide ? remote.options : staticOptions;
  const getOptionLabel = field.getOptionLabel;
  const options = useMemo(
    () =>
      getOptionLabel
        ? rawOptions.map((option) => ({ ...option, label: getOptionLabel(option) }))
        : rawOptions,
    [getOptionLabel, rawOptions],
  );
  const optionsLoading = Boolean(field.loading) || remote.loading;
  const min = evaluate(field.min, formValues, ctx);
  const max = evaluate(field.max, formValues, ctx);
  const fieldSize = field.size ?? size;
  const stepValue = evaluate(field.step, formValues, ctx);
  const decimalsValue = evaluate(field.decimals, formValues, ctx);
  const precisionValue = evaluate(field.precision, formValues, ctx);
  const rowsValue = evaluate(field.rows, formValues, ctx);
  const minRowsValue = evaluate(field.minRows, formValues, ctx);
  const maxRowsValue = evaluate(field.maxRows, formValues, ctx);
  const startAdornmentNode = renderAdornment(field.startAdornment, value, formValues);
  const endAdornmentNode = renderAdornment(field.endAdornment, value, formValues);

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
    size: fieldSize,
    onBlur,
    sx: field.sx,
    className: field.className,
  };

  const stringValue = value === null || value === undefined ? "" : String(value);

  if (field.type === "password") {
    return (
      <CnPasswordField
        {...common}
        placeholder={placeholder}
        value={stringValue}
        onChange={onChange}
        requirements={field.passwordRequirements ?? false}
        showStrength={field.showPasswordStrength ?? false}
        allowGenerate={field.allowGenerate}
        autoComplete={field.autoComplete ?? "new-password"}
        autoFocus={field.autoFocus}
        reserveHelperSpace
        {...field.componentProps}
      />
    );
  }

  const isPhone = field.type === "phone" || (field.type === "tel" && field.showCountrySelect);
  if (isPhone) {
    return (
      <CnPhoneField
        {...common}
        {...field.componentProps}
        placeholder={placeholder}
        value={String(value ?? "")}
        onChange={onChange}
        defaultCountry={field.defaultCountry}
        countries={field.countries}
        showCountrySelect={field.showCountrySelect ?? true}
        valueFormat={field.phoneValueFormat}
        autoFocus={field.autoFocus}
        reserveHelperSpace
      />
    );
  }

  const textType = TEXT_TYPES[field.type];
  if (textType) {
    const rules = evaluate(field.rules, formValues, ctx) as CnValidationRule[] | undefined;
    return (
      <CnTextField
        {...common}
        {...field.componentProps}
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
        rows={rowsValue}
        minRows={minRowsValue}
        maxRows={maxRowsValue}
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
          step={stepValue}
          decimals={decimalsValue}
          controls={field.controls ?? (field.showSteppers ? "inline" : undefined)}
          largeStep={field.largeStep}
          snapToStep={field.snapToStep}
          allowWheel={field.allowWheel}
          clearable={field.clearable}
          thousandSeparator={field.thousandSeparator}
          startAdornment={startAdornmentNode}
          endAdornment={endAdornmentNode}
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
          step={stepValue}
          decimals={decimalsValue ?? 2}
          locale={field.locale}
          currency={currencyFromForm || evaluate(field.currency, formValues, ctx) || "MXN"}
          currencies={field.currencies}
          currencySelectorMode={
            field.currencySelectorMode ?? (field.currencyName ? "editable" : "hidden")
          }
          controls={field.controls}
          allowWheel={field.allowWheel}
          {...field.componentProps}
          onCurrencyChange={(next) => field.currencyName && onSetValue?.(field.currencyName, next)}
          autoFocus={field.autoFocus}
          reserveHelperSpace
        />
      );
    }
    case "select":
      return (
        <CnSelectField
          {...common}
          {...field.componentProps}
          placeholder={placeholder}
          options={options}
          multiple={field.multiple}
          chips={field.chips}
          clearable={field.clearable}
          emptyText={optionsLoading ? "Cargando…" : (remote.error ?? undefined)}
          renderOption={field.renderOption}
          renderValue={field.renderValue}
          virtualize={field.virtualize}
          maxResults={field.maxResults}
          getValueLabel={getValueLabel}
          {...serverProps}
          startAdornment={startAdornmentNode}
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
          {...field.componentProps}
          placeholder={placeholder}
          options={options}
          multiple={field.multiple}
          freeSolo={field.freeSolo}
          loading={field.loading}
          loadOptions={boundLoader}
          loadOptionsDeps={depValues}
          minSearchLength={field.minSearchLength}
          searchDebounceMs={field.searchDebounceMs}
          selectedOptions={field.selectedOptions}
          pageSize={field.pageSize}
          resolveOptions={boundResolve}
          getValueLabel={getValueLabel}
          virtualize={field.virtualize}
          maxResults={field.maxResults}
          cacheKey={field.optionsCacheKey}
          renderOption={field.renderOption}
          onCreateOption={
            field.onCreateOption
              ? (input) => field.onCreateOption?.(input, formValuesRef.current)
              : undefined
          }
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
          {...field.componentProps}
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
          {...field.componentProps}
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
          {...field.componentProps}
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
    case "year":
      return (
        <CnDateField
          {...common}
          type={field.type}
          value={normalizeDateValue(value, field.type)}
          onChange={
            field.valueType === "date"
              ? (iso: string) =>
                  onChange(iso ? (isoToDate(iso, field.type as "date") ?? iso) : null)
              : onChange
          }
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
          shouldDisableMonth={
            field.shouldDisableMonth
              ? (month) => Boolean(field.shouldDisableMonth?.(month, formValues))
              : undefined
          }
          shouldDisableYear={
            field.shouldDisableYear
              ? (year) => Boolean(field.shouldDisableYear?.(year, formValues))
              : undefined
          }
          shouldDisableTime={
            field.shouldDisableTime
              ? (time) => Boolean(field.shouldDisableTime?.(time, formValues))
              : undefined
          }
          highlightedDates={evaluate(field.highlightedDates, formValues, ctx)}
          format={field.dateFormat}
          displayFormat={field.displayFormat}
          ampm={evaluate(field.ampm, formValues, ctx)}
          minutesStep={evaluate(field.minutesStep, formValues, ctx)}
          minTime={evaluate(field.minTime, formValues, ctx)}
          maxTime={evaluate(field.maxTime, formValues, ctx)}
          views={field.views}
          openTo={field.openTo}
          defaultCalendarMonth={evaluate(field.defaultCalendarMonth, formValues, ctx)}
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
          {...field.componentProps}
          value={
            (Array.isArray(value)
              ? value.map((item) => normalizeDateValue(item, "date"))
              : ["", ""]) as CnDateRangeValue
          }
          onChange={
            field.valueType === "date"
              ? (range: CnDateRangeValue) =>
                  onChange(range.map((iso) => (iso ? (isoToDate(iso, "date") ?? iso) : null)))
              : onChange
          }
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
          {...field.componentProps}
          range={field.type === "range"}
          min={min}
          max={max}
          step={stepValue}
          marks={field.marks}
          value={value as CnSliderValue}
          onChange={onChange}
        />
      );
    case "rating":
      return (
        <CnRatingField
          {...common}
          {...field.componentProps}
          max={max}
          precision={precisionValue}
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
          sizeUnit={field.fileSizeUnit}
          gridColumns={field.gridColumns}
          showPreviews={field.showPreviews}
          imageConstraints={field.imageConstraints}
          downloadable={field.downloadable}
          capture={field.capture}
          showPrimary={field.showPrimary}
          {...field.componentProps}
          onRemoveExisting={(file: CnExistingFile) => {
            const external = field.componentProps?.onRemoveExisting as
              ((removed: CnExistingFile) => void) | undefined;
            external?.(file);
            if (field.removedFilesName && file.id !== undefined) {
              const prev = getNestedValue(formValuesRef.current, field.removedFilesName);
              const list = Array.isArray(prev) ? prev : [];
              if (!list.includes(file.id)) {
                onSetValue?.(field.removedFilesName, [...list, file.id]);
              }
            }
          }}
          value={toFileValues(value)}
          onChange={onChange}
        />
      );
    case "otp":
      return (
        <CnOtpField
          {...common}
          value={stringValue}
          onChange={onChange}
          length={field.otpLength}
          autoFocus={field.autoFocus}
          {...field.componentProps}
        />
      );
    case "masked":
      return (
        <CnMaskedField
          {...common}
          placeholder={placeholder}
          value={stringValue}
          onChange={onChange}
          mask={field.mask}
          preset={field.maskPreset}
          valueMode={field.valueMode}
          autoComplete={field.autoComplete}
          autoFocus={field.autoFocus}
          reserveHelperSpace
          {...field.componentProps}
        />
      );
    case "tags":
      return (
        <CnTagsField
          {...common}
          placeholder={placeholder}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
          tagRules={field.tagRules}
          maxTags={field.maxTags}
          suggestions={field.suggestions}
          autoFocus={field.autoFocus}
          {...field.componentProps}
        />
      );
    case "segmented":
      return (
        <CnSegmentedField
          {...common}
          options={options}
          multiple={field.multiple}
          iconOnly={field.iconOnly}
          value={(value ?? (field.multiple ? [] : "")) as CnSegmentedValue}
          onChange={onChange}
          {...field.componentProps}
        />
      );
    case "color":
      return (
        <CnColorField
          {...common}
          placeholder={placeholder}
          value={stringValue}
          onChange={onChange}
          presets={field.colorPresets}
          reserveHelperSpace
          {...field.componentProps}
        />
      );
    case "signature":
      return (
        <CnSignatureField
          {...common}
          value={stringValue}
          onChange={onChange}
          {...field.componentProps}
        />
      );
    case "country":
      return (
        <CnCountryField
          {...common}
          placeholder={placeholder}
          multiple={field.multiple}
          priority={field.priorityCountries}
          virtualize={field.virtualize}
          maxResults={field.maxResults}
          value={(value ?? (field.multiple ? [] : null)) as string | null | string[]}
          onChange={onChange}
          autoFocus={field.autoFocus}
          reserveHelperSpace
          {...field.componentProps}
        />
      );
    case "numberrange":
      return (
        <CnNumberRangeField
          {...common}
          value={(Array.isArray(value) ? value : [null, null]) as CnNumberRangeValue}
          onChange={onChange}
          min={min}
          max={max}
          step={stepValue}
          decimals={decimalsValue}
          prefix={field.prefix}
          suffix={field.suffix}
          controls={field.controls}
          thousandSeparator={field.thousandSeparator}
          reserveHelperSpace
          {...field.componentProps}
        />
      );
    case "choicecards":
      return (
        <CnChoiceCardsField
          {...common}
          {...field.componentProps}
          options={options}
          multiple={field.multiple}
          columns={field.optionColumns}
          value={(value ?? (field.multiple ? [] : "")) as CnChoiceCardsValue}
          onChange={onChange}
        />
      );
    case "transferlist":
      return (
        <CnTransferListField
          {...common}
          {...field.componentProps}
          options={options}
          max={max}
          renderOption={field.renderOption}
          virtualize={field.virtualize}
          getValueLabel={getValueLabel}
          {...serverProps}
          value={Array.isArray(value) ? (value as Array<string | number>) : []}
          onChange={onChange}
        />
      );
    case "treeselect":
      return (
        <CnTreeSelectField
          {...common}
          {...field.componentProps}
          placeholder={placeholder}
          options={options as readonly CnTreeOption[]}
          multiple={field.multiple}
          cascade={field.cascade}
          valueMode={field.treeValueMode}
          leavesOnly={field.leavesOnly}
          clearable={field.clearable}
          virtualize={field.virtualize}
          renderOption={field.renderOption}
          autoFocus={field.autoFocus}
          value={(value ?? (field.multiple ? [] : null)) as CnTreeSelectValue}
          onChange={onChange}
          reserveHelperSpace
        />
      );
    case "keyvalue":
      return (
        <CnKeyValueField
          {...common}
          {...field.componentProps}
          valueFormat={field.valueFormat}
          value={(value ?? (field.valueFormat === "object" ? {} : [])) as CnKeyValueValue}
          onChange={onChange}
        />
      );
    case "address":
      return (
        <CnAddressField
          {...common}
          fields={field.addressFields}
          requiredParts={field.requiredAddressParts}
          onPostalCodeLookup={field.onPostalCodeLookup}
          reserveHelperSpace
          {...field.componentProps}
          value={(value && typeof value === "object" ? value : {}) as CnAddressValue}
          onChange={onChange}
        />
      );
    case "repeater":
      return (
        <CnRepeaterField<unknown>
          {...common}
          placeholder={placeholder}
          minItems={field.minItems}
          maxItems={field.maxItems}
          renderItem={field.renderItem}
          newItem={field.newItem}
          itemLabel={field.itemLabel}
          addLabel={field.addLabel}
          reserveHelperSpace
          {...field.componentProps}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
        />
      );
    case "duration":
      return (
        <CnDurationField
          {...common}
          units={field.durationUnits}
          valueUnit={field.durationValueUnit}
          presets={field.durationPresets}
          min={min}
          max={max}
          reserveHelperSpace
          {...field.componentProps}
          value={typeof value === "number" && Number.isFinite(value) ? value : null}
          onChange={onChange}
        />
      );
    case "search":
      return (
        <CnSearchField
          {...common}
          placeholder={placeholder}
          suggestions={field.suggestions}
          onSearch={field.onSearch}
          recentSearches={field.recentSearches}
          clearable={field.clearable}
          autoFocus={field.autoFocus}
          searchDelay={field.searchDebounceMs}
          minChars={field.minSearchLength}
          maxSuggestions={field.maxResults}
          virtualize={field.virtualize}
          reserveHelperSpace
          {...field.componentProps}
          value={stringValue}
          onChange={onChange}
        />
      );
    case "code":
      return (
        <CnCodeField
          {...common}
          placeholder={placeholder}
          language={field.language}
          minRows={minRowsValue ?? rowsValue}
          maxRows={maxRowsValue}
          autoFocus={field.autoFocus}
          reserveHelperSpace
          {...field.componentProps}
          value={stringValue}
          onChange={onChange}
        />
      );
    case "schedule":
      return (
        <CnScheduleField
          {...common}
          weekStart={field.weekStart}
          days={field.scheduleDays}
          defaultRange={field.scheduleDefaultRange}
          minutesStep={evaluate(field.minutesStep, formValues, ctx)}
          reserveHelperSpace
          {...field.componentProps}
          value={(value && typeof value === "object" ? value : {}) as CnScheduleValue}
          onChange={onChange}
        />
      );
    case "location":
      return (
        <CnLocationField
          {...common}
          showMap={field.showMap}
          showAddress={field.showAddress}
          reserveHelperSpace
          {...field.componentProps}
          value={(value && typeof value === "object" ? value : null) as CnLocationValue | null}
          onChange={onChange}
        />
      );
    case "weekdays":
      return (
        <CnWeekdaysField
          {...common}
          weekStart={field.weekStart}
          disabledDays={field.disabledDays}
          minDays={field.minItems}
          maxDays={field.maxItems}
          presets={field.presets}
          reserveHelperSpace
          {...field.componentProps}
          value={Array.isArray(value) ? (value as number[]) : []}
          onChange={onChange}
        />
      );
    case "timerange":
      return (
        <CnTimeRangeField
          {...common}
          allowOvernight={field.allowOvernight}
          minDuration={field.minDuration}
          maxDuration={field.maxDuration}
          minutesStep={evaluate(field.minutesStep, formValues, ctx)}
          reserveHelperSpace
          {...field.componentProps}
          value={(Array.isArray(value) ? value : ["", ""]) as CnTimeRangeValue}
          onChange={onChange}
        />
      );
    case "hidden":
      return null;
    case "display": {
      const content = field.format
        ? field.format(value, formValues)
        : value === null || value === undefined || value === ""
          ? "—"
          : Array.isArray(value)
            ? value.join(", ")
            : String(value);
      return (
        <Box
          id={common.id}
          data-cn-display-field
          sx={[
            { display: "flex", flexDirection: "column", gap: "2px", minWidth: 0, py: "2px" },
            ...(Array.isArray(field.sx) ? field.sx : field.sx ? [field.sx] : []),
          ]}
          className={field.className}
        >
          {label && (
            <Box
              component="span"
              sx={{
                fontSize: "var(--cn-font-size-xs, 11px)",
                fontWeight: 600,
                color: "var(--cn-color-text-muted, #6e7682)",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              {label}
            </Box>
          )}
          <Box
            component="output"
            aria-live="polite"
            sx={{
              fontSize: "var(--cn-font-size-md, 14px)",
              color: "var(--cn-color-text, #222831)",
              fontWeight: 500,
              minHeight: 22,
              overflowWrap: "anywhere",
            }}
          >
            {content}
          </Box>
          {(error || helper) && (
            <Box
              component="span"
              sx={{
                fontSize: "var(--cn-font-size-xs, 11px)",
                color: error
                  ? "var(--cn-color-error-600, #b52f2f)"
                  : "var(--cn-color-text-muted, #6e7682)",
              }}
            >
              {error || helper}
            </Box>
          )}
        </Box>
      );
    }
    case "custom":
      if (!field.render && fieldRenderers.has("custom")) break;
      return field.render ? (
        <Box
          sx={{ display: "contents" }}
          onKeyDown={field.submitOnEnter ? undefined : blockImplicitSubmit}
        >
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
        </Box>
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

/**
 * Evita que Enter dentro de un control propio envíe el formulario (los
 * textarea y botones conservan su comportamiento).
 */
export const blockImplicitSubmit = (event: KeyboardEvent<HTMLElement>) => {
  if (event.key !== "Enter") return;
  const target = event.target as HTMLElement;
  if (target.tagName === "INPUT") event.preventDefault();
};

export const renderCustomElement = (
  component: ReactNode,
  grid: { xs?: GridSize; sm?: GridSize; md?: GridSize; lg?: GridSize; xl?: GridSize } = {},
  key?: string,
  submitOnEnter = false,
): ReactNode => {
  const size = { xs: grid.xs ?? 12, sm: grid.sm, md: grid.md ?? 12, lg: grid.lg, xl: grid.xl };
  return (
    <Grid
      key={key}
      size={size}
      sx={{ minWidth: 0 }}
      onKeyDown={submitOnEnter ? undefined : blockImplicitSubmit}
    >
      {isValidElement(component) ? <Box sx={{ width: "100%" }}>{component}</Box> : component}
    </Grid>
  );
};

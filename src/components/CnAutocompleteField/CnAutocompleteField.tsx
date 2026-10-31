import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import type { ReactNode } from "react";
import { forwardRef, useMemo } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { getOutlinedFieldSx, mergeSx, MUI_FIELD_SIZE } from "../../utils/field-styles";
import { hasOptionMedia, OptionContent, OptionMedia } from "../../utils/option-media";
import type { CnFieldOption } from "../CnForm/CnForm.types";

export type CnAutocompleteValue = string | number | null | Array<string | number>;

export type CnAutocompleteFieldProps = CnFieldBaseProps<CnAutocompleteValue> & {
  options: readonly CnFieldOption[];
  multiple?: boolean;
  placeholder?: string;
  /** Permite escribir valores que no están en la lista (se emiten como string). */
  freeSolo?: boolean;
  loading?: boolean;
  /** Notifica el texto escrito; útil para búsquedas remotas. */
  onInputChange?: (input: string) => void;
  /** Desactiva el filtrado local (cuando las opciones ya vienen filtradas del servidor). */
  disableFiltering?: boolean;
  limitTags?: number;
  noOptionsText?: string;
  loadingText?: string;
  renderOption?: (option: CnFieldOption) => ReactNode;
  autoFocus?: boolean;
};

/** Normaliza para buscar sin importar acentos ni mayúsculas. */
export const normalizeSearchText = (value: string): string =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const filter = createFilterOptions<CnFieldOption>({
  stringify: (option) => normalizeSearchText(`${option.label} ${option.searchText ?? ""}`),
});

const toOption = (value: string | number, byValue: Map<string, CnFieldOption>): CnFieldOption =>
  byValue.get(`${typeof value}:${value}`) ?? { value, label: String(value) };

export const CnAutocompleteField = forwardRef<HTMLDivElement, CnAutocompleteFieldProps>(
  function CnAutocompleteField(
    {
      id,
      name,
      label,
      helperText,
      error,
      required,
      disabled,
      readOnly,
      value,
      defaultValue,
      onChange,
      onBlur,
      rules,
      formValues,
      sectionContext,
      validateOnChange,
      validateOnBlur,
      debounceMs,
      internalValidation,
      size = "md",
      reserveHelperSpace,
      sx,
      className,
      options,
      multiple = false,
      placeholder,
      freeSolo = false,
      loading = false,
      onInputChange,
      disableFiltering = false,
      limitTags = 3,
      noOptionsText = "Sin resultados",
      loadingText = "Cargando…",
      renderOption,
      autoFocus,
    },
    ref,
  ) {
    const [current, setCurrent] = useControllableValue<CnAutocompleteValue>(
      value,
      defaultValue,
      multiple ? [] : null,
      onChange,
    );
    const control = useFieldControl(current, {
      id,
      rules,
      formValues,
      sectionContext,
      validateOnChange,
      validateOnBlur,
      debounceMs: debounceMs ?? 0,
      internalValidation,
      error,
      helperText,
      reserveHelperSpace,
    });

    const byValue = useMemo(() => {
      const map = new Map<string, CnFieldOption>();
      for (const option of options) map.set(`${typeof option.value}:${option.value}`, option);
      return map;
    }, [options]);

    const selected = useMemo(() => {
      if (multiple) {
        return Array.isArray(current) ? current.map((item) => toOption(item, byValue)) : [];
      }
      if (current === null || current === undefined || current === "" || Array.isArray(current)) {
        return null;
      }
      return toOption(current, byValue);
    }, [byValue, current, multiple]);

    const sortedOptions = useMemo(
      () =>
        options.some((option) => option.group)
          ? [...options].sort((a, b) => (a.group ?? "").localeCompare(b.group ?? ""))
          : options,
      [options],
    );

    const emit = (next: CnFieldOption | string | null | Array<CnFieldOption | string>) => {
      control.markChanged();
      if (Array.isArray(next)) {
        setCurrent(
          next
            .map((item) => (typeof item === "string" ? item.trim() : item.value))
            .filter((item) => item !== ""),
        );
        return;
      }
      if (next === null) {
        setCurrent(null);
        return;
      }
      setCurrent(typeof next === "string" ? next.trim() || null : next.value);
    };

    return (
      <Autocomplete<CnFieldOption, boolean, false, boolean>
        ref={ref}
        id={control.id}
        className={className}
        data-cn-autocomplete-field
        options={sortedOptions}
        multiple={multiple}
        freeSolo={freeSolo}
        value={selected as CnFieldOption | CnFieldOption[] | null}
        onChange={(_, next) =>
          emit(next as CnFieldOption | string | null | Array<CnFieldOption | string>)
        }
        onInputChange={(_, input, reason) => {
          if (reason === "input") onInputChange?.(input);
        }}
        onBlur={() => {
          control.markBlurred();
          onBlur?.();
        }}
        disabled={disabled}
        readOnly={readOnly}
        loading={loading}
        limitTags={limitTags}
        noOptionsText={noOptionsText}
        loadingText={loadingText}
        clearText="Limpiar"
        openText="Abrir"
        closeText="Cerrar"
        getLimitTagsText={(more) => `+${more}`}
        groupBy={
          options.some((option) => option.group) ? (option) => option.group ?? "" : undefined
        }
        filterOptions={
          disableFiltering
            ? (items) => items
            : (items, state) =>
                filter(items, { ...state, inputValue: normalizeSearchText(state.inputValue) })
        }
        getOptionLabel={(option) => (typeof option === "string" ? option : option.label)}
        getOptionDisabled={(option) => Boolean(option.disabled)}
        isOptionEqualToValue={(option, val) => option.value === val.value}
        size={MUI_FIELD_SIZE[size]}
        renderOption={(props, option) => {
          const { key, ...rest } = props as typeof props & { key: string };
          return (
            <Box
              component="li"
              key={key}
              {...rest}
              sx={{
                fontSize: "var(--cn-font-size-base, 13px)",
              }}
            >
              {renderOption ? renderOption(option) : <OptionContent option={option} />}
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            name={name}
            label={label}
            placeholder={
              multiple && Array.isArray(selected) && selected.length > 0 ? undefined : placeholder
            }
            required={required}
            error={control.error}
            helperText={control.helperText}
            autoFocus={autoFocus}
            slotProps={{
              inputLabel: params.InputLabelProps,
              input: {
                ...params.InputProps,
                startAdornment:
                  !multiple && selected && !Array.isArray(selected) && hasOptionMedia(selected) ? (
                    <Box component="span" sx={{ display: "inline-flex", ml: "4px", mr: "2px" }}>
                      <OptionMedia option={selected} size={20} />
                    </Box>
                  ) : (
                    params.InputProps.startAdornment
                  ),
                endAdornment: (
                  <>
                    {loading && <CircularProgress size={16} aria-label="Cargando" />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              },
              htmlInput: { ...params.inputProps, "aria-invalid": control.error || undefined },
            }}
          />
        )}
        sx={mergeSx(getOutlinedFieldSx(size), sx)}
      />
    );
  },
);

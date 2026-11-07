import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import type { ReactNode } from "react";
import { forwardRef, useMemo, useState } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { getOutlinedFieldSx, mergeSx, MUI_FIELD_SIZE } from "../../utils/field-styles";
import { hasOptionMedia, OptionContent, OptionMedia } from "../../utils/option-media";
import type { CnLoadOptions } from "../../utils/use-async-options";
import { useAsyncOptions, useOptionMemory } from "../../utils/use-async-options";
import type { CnFieldOption } from "../CnForm/CnForm.types";

export type CnAutocompleteValue = string | number | null | Array<string | number>;

export type CnAutocompleteFieldProps = CnFieldBaseProps<CnAutocompleteValue> & {
  options?: readonly CnFieldOption[];
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
  /**
   * Búsqueda remota: recibe el texto escrito y una `signal` para cancelar.
   * Las opciones devueltas reemplazan a `options` y no se filtran localmente.
   */
  loadOptions?: CnLoadOptions;
  /** Recarga `loadOptions` cuando cambian estos valores (selects en cascada). */
  loadOptionsDeps?: readonly unknown[];
  /** Espera tras teclear antes de buscar (ms). Por defecto 300. */
  searchDebounceMs?: number;
  /** Caracteres mínimos para buscar. Por defecto 0 (carga al abrir). */
  minSearchLength?: number;
  /** Opciones ya seleccionadas, para mostrar su etiqueta sin buscarlas (edición). */
  selectedOptions?: readonly CnFieldOption[];
  /**
   * Muestra "Crear …" cuando el texto no coincide con ninguna opción. Puede
   * devolver la opción creada (p. ej. con el id que asignó el servidor).
   */
  onCreateOption?: (
    input: string,
  ) => CnFieldOption | string | void | Promise<CnFieldOption | string | void>;
  createOptionLabel?: (input: string) => string;
  /** Texto cuando faltan caracteres para buscar. */
  typeToSearchText?: string;
};

type CreateOption = CnFieldOption & { __create?: string };

/** Normaliza para buscar sin importar acentos ni mayúsculas. */
export const normalizeSearchText = (value: string): string =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const filter = createFilterOptions<CnFieldOption>({
  stringify: (option) => normalizeSearchText(`${option.label} ${option.searchText ?? ""}`),
});

const EMPTY: readonly CnFieldOption[] = [];

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
      options = EMPTY,
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
      loadOptions,
      loadOptionsDeps,
      searchDebounceMs = 300,
      minSearchLength = 0,
      selectedOptions,
      onCreateOption,
      createOptionLabel = (input) => `Crear "${input}"`,
      typeToSearchText,
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

    const [inputText, setInputText] = useState("");
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [created, setCreated] = useState<CnFieldOption[]>([]);

    const remote = useAsyncOptions({
      loadOptions,
      deps: loadOptionsDeps,
      input: inputText,
      debounceMs: searchDebounceMs,
      minSearchLength,
      // Sin búsqueda mínima se carga al abrir; con búsqueda mínima, al escribir.
      disabled: !loadOptions || (!open && inputText === ""),
    });
    const baseOptions = loadOptions ? remote.options : options;
    const remember = useOptionMemory(baseOptions, [
      ...(selectedOptions ?? []),
      ...created,
      ...options,
    ]);
    const isLoading = loading || remote.loading || creating;

    const allOptions = useMemo(() => {
      const extra = created.filter(
        (item) => !baseOptions.some((option) => option.value === item.value),
      );
      const list = [...baseOptions, ...extra];
      return list.some((option) => option.group)
        ? [...list].sort((a, b) => (a.group ?? "").localeCompare(b.group ?? ""))
        : list;
    }, [baseOptions, created]);

    const toOption = (item: string | number): CnFieldOption =>
      allOptions.find((option) => option.value === item) ??
      remember(item) ?? { value: item, label: String(item) };

    const selected = (() => {
      if (multiple) return Array.isArray(current) ? current.map(toOption) : [];
      if (current === null || current === undefined || current === "" || Array.isArray(current)) {
        return null;
      }
      return toOption(current);
    })();

    const handleCreate = async (text: string) => {
      if (!onCreateOption) return;
      setCreating(true);
      try {
        const result = await onCreateOption(text);
        const option: CnFieldOption =
          result && typeof result === "object"
            ? result
            : { value: typeof result === "string" && result ? result : text, label: text };
        setCreated((prev) => [...prev, option]);
        control.markChanged();
        if (multiple) {
          const list = Array.isArray(current) ? current : [];
          setCurrent([...list, option.value]);
        } else {
          setCurrent(option.value);
        }
        setInputText("");
      } finally {
        setCreating(false);
      }
    };

    const emit = (next: CnFieldOption | string | null | Array<CnFieldOption | string>) => {
      const items = Array.isArray(next) ? next : [next];
      const pending = items.find(
        (item): item is CreateOption =>
          Boolean(item) && typeof item === "object" && Boolean((item as CreateOption).__create),
      );
      if (pending?.__create) {
        void handleCreate(pending.__create);
        return;
      }
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

    const needsMoreText =
      Boolean(loadOptions) && minSearchLength > 0 && inputText.trim().length < minSearchLength;

    return (
      <Autocomplete<CnFieldOption, boolean, false, boolean>
        ref={ref}
        id={control.id}
        className={className}
        data-cn-autocomplete-field
        options={allOptions}
        multiple={multiple}
        freeSolo={freeSolo}
        value={selected as CnFieldOption | CnFieldOption[] | null}
        onChange={(_, next) =>
          emit(next as CnFieldOption | string | null | Array<CnFieldOption | string>)
        }
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => {
          setOpen(false);
          if (loadOptions) setInputText("");
        }}
        onInputChange={(_, input, reason) => {
          if (reason === "input") {
            onInputChange?.(input);
            if (loadOptions) setInputText(input);
          } else if (loadOptions && reason === "clear") {
            setInputText("");
          }
        }}
        onBlur={() => {
          control.markBlurred();
          onBlur?.();
        }}
        disabled={disabled}
        readOnly={readOnly}
        loading={isLoading}
        limitTags={limitTags}
        noOptionsText={
          remote.error ??
          (needsMoreText
            ? (typeToSearchText ?? `Escribe al menos ${minSearchLength} caracteres`)
            : noOptionsText)
        }
        loadingText={loadingText}
        clearText="Limpiar"
        openText="Abrir"
        closeText="Cerrar"
        getLimitTagsText={(more) => `+${more}`}
        groupBy={
          allOptions.some((option) => option.group) ? (option) => option.group ?? "" : undefined
        }
        filterOptions={(items, state) => {
          const result =
            disableFiltering || loadOptions
              ? items
              : filter(items, { ...state, inputValue: normalizeSearchText(state.inputValue) });
          const text = state.inputValue.trim();
          if (!onCreateOption || !text || isLoading) return result;
          const norm = normalizeSearchText(text);
          if (items.some((option) => normalizeSearchText(option.label) === norm)) return result;
          const createItem: CreateOption = {
            value: `__create:${text}`,
            label: createOptionLabel(text),
            icon: "add",
            __create: text,
          };
          return [...result, createItem];
        }}
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
                ...((option as CreateOption).__create && {
                  color: "var(--cn-color-brand-600, #254d87)",
                  fontWeight: 600,
                }),
              }}
            >
              {renderOption && !(option as CreateOption).__create ? (
                renderOption(option)
              ) : (
                <OptionContent option={option} />
              )}
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
                    {isLoading && <CircularProgress size={16} aria-label="Cargando" />}
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

import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import type { ReactNode } from "react";
import { forwardRef, useMemo, useRef, useState } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { getOutlinedFieldSx, mergeSx, MUI_FIELD_SIZE } from "../../utils/field-styles";
import type { CnFilterOptions } from "../../utils/option-filter";
import {
  filterOptionsFast,
  normalizeSearchText,
  optionValueKey,
  precomputeOptionSearchText,
} from "../../utils/option-filter";
import { hasOptionMedia, OptionContent, OptionMedia } from "../../utils/option-media";
import type { CnLoadOptions, CnResolveOptions } from "../../utils/use-async-options";
import { useAsyncOptions, useOptionMemory } from "../../utils/use-async-options";
import { useResolvedOptions } from "../../utils/use-resolved-options";
import type { CnVirtualGroupParams, CnVirtualListboxConfig } from "../../utils/virtual-listbox";
import {
  CnListStatus,
  CnVirtualListbox,
  CnVirtualListboxContext,
  shouldVirtualize,
} from "../../utils/virtual-listbox";
import type { CnFieldOption } from "../CnForm/CnForm.types";
import { CnAutocompleteFieldSkeleton } from "./CnAutocompleteFieldSkeleton";

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
   * Búsqueda remota: recibe el texto escrito, la página y una `signal` para
   * cancelar. Puede devolver todas las opciones (arreglo) o una página
   * `{ options, hasMore, total? }` para scroll infinito. Las opciones devueltas
   * reemplazan a `options` y no se filtran localmente.
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
  /** Muestra el skeleton del campo (mismas variantes) en lugar del campo. */
  skeleton?: boolean;
  /**
   * Virtualiza la lista: `true`, `false` o el número de opciones a partir del
   * cual se activa. Por defecto se activa con más de 100 opciones o con un
   * `loadOptions` paginado.
   */
  virtualize?: boolean | number;
  /** Tamaño de página para `loadOptions` paginado. Por defecto 50. */
  pageSize?: number;
  /**
   * Opciones de valores seleccionados que no están en la página cargada (al
   * editar un registro). Se llama una vez por lote de valores desconocidos.
   */
  resolveOptions?: CnResolveOptions;
  /** Etiqueta de respaldo para un valor sin opción conocida (por defecto el valor). */
  getValueLabel?: (value: string | number) => string;
  /** Máximo de coincidencias pintadas con opciones locales ("N más, refina tu búsqueda"). */
  maxResults?: number;
  /** Filtro local propio (reemplaza el filtro sin acentos). */
  filterOptions?: CnFilterOptions;
  /** Comparte la caché de `loadOptions`/`resolveOptions` entre campos con la misma clave. */
  cacheKey?: string;
};

type CreateOption = CnFieldOption & { __create?: string };

export { normalizeSearchText };

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
      skeleton = false,
      virtualize,
      pageSize,
      resolveOptions,
      getValueLabel,
      maxResults,
      filterOptions: filterOptionsProp,
      cacheKey,
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
      pageSize,
      cacheKey,
    });
    const baseOptions = loadOptions ? remote.options : options;
    const remember = useOptionMemory(baseOptions, [
      ...(selectedOptions ?? []),
      ...created,
      ...options,
    ]);

    const allOptions = useMemo(() => {
      const extra = created.filter(
        (item) => !baseOptions.some((option) => option.value === item.value),
      );
      const list = extra.length ? [...baseOptions, ...extra] : baseOptions;
      return list.some((option) => option.group)
        ? [...list].sort((a, b) => (a.group ?? "").localeCompare(b.group ?? ""))
        : list;
    }, [baseOptions, created]);

    // Búsqueda O(1) por valor y texto normalizado listo para filtrar.
    const byKey = useMemo(() => {
      const map = new Map<string, CnFieldOption>();
      for (const option of allOptions) map.set(optionValueKey(option.value), option);
      return map;
    }, [allOptions]);
    useMemo(() => {
      if (!loadOptions && !filterOptionsProp) precomputeOptionSearchText(allOptions);
    }, [allOptions, filterOptionsProp, loadOptions]);

    const currentValues: Array<string | number> = Array.isArray(current)
      ? current
      : current === null || current === undefined || current === ""
        ? []
        : [current];
    const resolver = useResolvedOptions({
      values: currentValues,
      isKnown: (item) => byKey.has(optionValueKey(item)) || Boolean(remember(item)),
      resolveOptions,
      cacheKey,
    });
    const isLoading = loading || remote.loading || creating;

    const toOption = (item: string | number): CnFieldOption =>
      byKey.get(optionValueKey(item)) ??
      remember(item) ??
      resolver.get(item) ?? { value: item, label: getValueLabel?.(item) ?? String(item) };

    const selected = (() => {
      if (multiple) return Array.isArray(current) ? current.map(toOption) : [];
      if (current === null || current === undefined || current === "" || Array.isArray(current)) {
        return null;
      }
      return toOption(current);
    })();

    // Las opciones seleccionadas que no están en la lista se pasan a MUI (así no
    // avisa de un valor inválido) pero se ocultan al filtrar.
    const hiddenKeys = new Set<string>();
    const selectedList = Array.isArray(selected) ? selected : selected ? [selected] : [];
    const missingSelected = selectedList.filter((option) => {
      const key = optionValueKey(option.value);
      if (byKey.has(key)) return false;
      hiddenKeys.add(key);
      return true;
    });
    const muiOptions = missingSelected.length ? [...allOptions, ...missingSelected] : allOptions;

    const virtual =
      remote.paginated || remote.hasMore || shouldVirtualize(virtualize, allOptions.length);
    // Lo escribe `filterOptions` en el mismo render en que se pinta el listbox.
    const truncatedRef = useRef(0);

    const listboxConfig: CnVirtualListboxConfig = {
      scrollToSelected: !multiple,
      setSize: remote.total,
      onEndReached: () => {
        if (remote.hasMore && !remote.loadingMore && !remote.loadMoreError) remote.loadMore();
      },
      renderFooter: () => (
        <CnListStatus
          loadingMore={remote.loadingMore}
          loadMoreError={remote.loadMoreError}
          onRetry={remote.retry}
          truncated={truncatedRef.current}
          shown={baseOptions.length}
          total={remote.total}
        />
      ),
    };

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

    if (skeleton) {
      return (
        <CnAutocompleteFieldSkeleton
          size={size}
          label={Boolean(label)}
          helperText={Boolean(helperText)}
          multiple={multiple}
          selectedCount={
            multiple && Array.isArray(current) && current.length > 0 ? current.length : undefined
          }
          limitTags={limitTags}
          freeSolo={freeSolo}
          optionMedia={allOptions.some(hasOptionMedia)}
          mediaShape={allOptions.some((option) => option.flag) ? "flag" : "circle"}
          sx={sx}
          className={className}
        />
      );
    }

    const autocomplete: ReactNode = (
      <Autocomplete<CnFieldOption, boolean, false, boolean>
        ref={ref}
        id={control.id}
        className={className}
        data-cn-autocomplete-field
        options={muiOptions}
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
        renderGroup={
          virtual ? (params) => params as CnVirtualGroupParams as unknown as ReactNode : undefined
        }
        slotProps={virtual ? { listbox: { component: CnVirtualListbox } } : undefined}
        filterOptions={(items, state) => {
          const visible = hiddenKeys.size
            ? items.filter((option) => !hiddenKeys.has(optionValueKey(option.value)))
            : items;
          let result: CnFieldOption[];
          truncatedRef.current = 0;
          if (disableFiltering || loadOptions) {
            result = visible;
          } else if (filterOptionsProp) {
            result = [...filterOptionsProp(visible, state.inputValue)];
          } else {
            result = filterOptionsFast(visible, state.inputValue).options;
          }
          if (maxResults && maxResults > 0 && result.length > maxResults) {
            truncatedRef.current = result.length - maxResults;
            result = result.slice(0, maxResults);
          }
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
              data-cn-tall={option.description ? true : undefined}
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
                    {(isLoading || resolver.resolving) && (
                      <CircularProgress size={16} aria-label="Cargando" />
                    )}
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

    // El proveedor siempre envuelve: activar la virtualización no remonta el campo.
    return (
      <CnVirtualListboxContext.Provider value={listboxConfig}>
        {autocomplete}
      </CnVirtualListboxContext.Provider>
    );
  },
);

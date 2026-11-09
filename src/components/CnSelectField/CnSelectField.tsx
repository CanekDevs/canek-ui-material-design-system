import ClearIcon from "@mui/icons-material/Clear";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import type { ReactNode } from "react";
import { forwardRef, useCallback, useMemo, useRef, useState } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { getOutlinedFieldSx, mergeSx, MUI_FIELD_SIZE } from "../../utils/field-styles";
import type { CnFilterOptions } from "../../utils/option-filter";
import { filterOptionsFast, optionValueKey } from "../../utils/option-filter";
import { hasOptionMedia, OptionContent, OptionMedia } from "../../utils/option-media";
import type { CnLoadOptions, CnResolveOptions } from "../../utils/use-async-options";
import { useAsyncOptions, useOptionMemory } from "../../utils/use-async-options";
import { useResolvedOptions } from "../../utils/use-resolved-options";
import { CnListStatus, shouldVirtualize } from "../../utils/virtual-listbox";
import type { CnFieldOption } from "../CnForm/CnForm.types";
import { CnSelectFieldMenu } from "./CnSelectFieldMenu";
import { CnSelectFieldSkeleton } from "./CnSelectFieldSkeleton";

export type CnSelectValue = string | number | "" | null | Array<string | number>;

export type CnSelectFieldProps = CnFieldBaseProps<CnSelectValue> & {
  options?: readonly CnFieldOption[];
  multiple?: boolean;
  placeholder?: string;
  /** Muestra la selección múltiple como chips. */
  chips?: boolean;
  /** Botón para limpiar la selección. */
  clearable?: boolean;
  emptyText?: string;
  renderOption?: (option: CnFieldOption) => ReactNode;
  /**
   * Contenido del campo cerrado. Recibe el valor y la(s) opción(es)
   * seleccionada(s); con `multiple`, arreglos.
   */
  renderValue?: (
    value: CnSelectValue,
    selected: CnFieldOption | CnFieldOption[] | undefined,
  ) => ReactNode;
  startAdornment?: ReactNode;
  autoFocus?: boolean;
  /** Muestra el skeleton del campo (mismas variantes) en lugar del campo. */
  skeleton?: boolean;
  /**
   * Menú virtualizado con buscador: `true`, `false` o el número de opciones a
   * partir del cual se activa. Por defecto con más de 100 opciones o con
   * `loadOptions`.
   */
  virtualize?: boolean | number;
  /** Buscador en el menú virtualizado. Por defecto `true`. */
  searchable?: boolean;
  /** Con `multiple`: opción "Seleccionar todo" (o el texto indicado). */
  selectAll?: boolean | string;
  /** Máximo de coincidencias pintadas ("N más, refina tu búsqueda"). */
  maxResults?: number;
  /** Filtro local propio para el buscador (reemplaza el filtro sin acentos). */
  filterOptions?: CnFilterOptions;
  /**
   * Opciones remotas (arreglo o páginas `{ options, hasMore, total? }`). El
   * buscador del menú consulta al servidor y la lista carga más al llegar al
   * final.
   */
  loadOptions?: CnLoadOptions;
  /** Recarga `loadOptions` cuando cambian estos valores. */
  loadOptionsDeps?: readonly unknown[];
  /** Tamaño de página para `loadOptions`. Por defecto 50. */
  pageSize?: number;
  /** Caracteres mínimos para buscar en el servidor. Por defecto 0. */
  minSearchLength?: number;
  /** Espera tras teclear antes de buscar (ms). Por defecto 300. */
  searchDebounceMs?: number;
  /** Opciones de valores que no están en la página cargada (edición). */
  resolveOptions?: CnResolveOptions;
  /** Opciones ya seleccionadas, para mostrar su etiqueta sin buscarlas. */
  selectedOptions?: readonly CnFieldOption[];
  /** Etiqueta de respaldo para un valor sin opción conocida. */
  getValueLabel?: (value: string | number) => string;
  /** Comparte la caché de opciones remotas entre campos con la misma clave. */
  cacheKey?: string;
  /** Indicador de carga externo. */
  loading?: boolean;
};

const ALL_KEY = "__cn_all__";
const EMPTY: readonly CnFieldOption[] = [];

export const CnSelectField = forwardRef<HTMLDivElement, CnSelectFieldProps>(function CnSelectField(
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
    options: staticOptions = EMPTY,
    multiple = false,
    placeholder,
    chips = false,
    clearable = false,
    emptyText = "Sin opciones disponibles",
    renderOption,
    renderValue: renderValueProp,
    startAdornment,
    autoFocus,
    skeleton = false,
    virtualize,
    searchable = true,
    selectAll,
    maxResults,
    filterOptions: filterOptionsProp,
    loadOptions,
    loadOptionsDeps,
    pageSize,
    minSearchLength = 0,
    searchDebounceMs = 300,
    resolveOptions,
    selectedOptions,
    getValueLabel,
    cacheKey,
    loading = false,
  },
  ref,
) {
  const [current, setCurrent] = useControllableValue<CnSelectValue>(
    value,
    defaultValue,
    multiple ? [] : "",
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

  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const remote = useAsyncOptions({
    loadOptions,
    deps: loadOptionsDeps,
    input: query,
    debounceMs: searchDebounceMs,
    minSearchLength,
    // Sin `resolveOptions` se carga al montar para conocer las etiquetas.
    disabled: !loadOptions || (!menuOpen && Boolean(resolveOptions)),
    pageSize,
    cacheKey,
  });
  const options = loadOptions ? remote.options : staticOptions;
  const remember = useOptionMemory(options, selectedOptions);
  const isRemote = Boolean(loadOptions);
  const virtual = isRemote || shouldVirtualize(virtualize, staticOptions.length);

  // MUI compara valores por igualdad estricta; se usa una clave estable para
  // conservar el tipo original (number vs string) al emitir.
  const byKey = useMemo(() => {
    const map = new Map<string, CnFieldOption>();
    for (const option of options) map.set(optionValueKey(option.value), option);
    return map;
  }, [options]);

  const currentValues: Array<string | number> = useMemo(() => {
    if (multiple) return Array.isArray(current) ? current : [];
    if (current === "" || current === null || current === undefined || Array.isArray(current)) {
      return [];
    }
    return [current];
  }, [current, multiple]);

  const resolver = useResolvedOptions({
    values: currentValues,
    isKnown: (item) => byKey.has(optionValueKey(item)) || Boolean(remember(item)),
    resolveOptions,
    cacheKey,
  });
  const withFallback = isRemote || Boolean(resolveOptions || getValueLabel);
  const toOption = (item: string | number): CnFieldOption | undefined =>
    byKey.get(optionValueKey(item)) ??
    remember(item) ??
    resolver.get(item) ??
    (withFallback ? { value: item, label: getValueLabel?.(item) ?? String(item) } : undefined);
  const selectedByKey = new Map<string, CnFieldOption>();
  for (const item of currentValues) {
    const option = toOption(item);
    if (option) selectedByKey.set(optionValueKey(item), option);
  }
  const optionForKey = (key: string) => selectedByKey.get(key) ?? byKey.get(key);

  const selectedKeys = useMemo(() => {
    if (multiple) return currentValues.map(optionValueKey);
    return currentValues.length ? optionValueKey(currentValues[0]) : "";
  }, [currentValues, multiple]);

  const hasValue = Array.isArray(selectedKeys) ? selectedKeys.length > 0 : selectedKeys !== "";

  // ─── Filtrado del menú virtual (opciones locales) ─────────────────
  const filtered = useMemo(() => {
    if (!virtual || isRemote) return { all: options, shown: options, truncated: 0 };
    const all = filterOptionsProp
      ? filterOptionsProp(options, query)
      : filterOptionsFast(options, query).options;
    const limit = maxResults && maxResults > 0 ? maxResults : Infinity;
    const shown = all.length > limit ? all.slice(0, limit) : all;
    return { all, shown, truncated: all.length - shown.length };
  }, [filterOptionsProp, isRemote, maxResults, options, query, virtual]);

  const enabledKeys = (list: readonly CnFieldOption[]) =>
    list.filter((option) => !option.disabled).map((option) => optionValueKey(option.value));

  const emitKeys = (keys: string | string[]) => {
    control.markChanged();
    if (Array.isArray(keys)) {
      if (keys.includes(ALL_KEY)) {
        toggleAll(options);
        return;
      }
      setCurrent(
        keys.map((key) => optionForKey(key)?.value).filter((v) => v !== undefined) as Array<
          string | number
        >,
      );
      return;
    }
    setCurrent(keys === "" ? "" : (optionForKey(keys)?.value ?? ""));
  };

  const toggleAll = (pool: readonly CnFieldOption[]) => {
    const keys = enabledKeys(pool);
    const selectedSet = new Set(Array.isArray(selectedKeys) ? selectedKeys : []);
    const everySelected = keys.length > 0 && keys.every((key) => selectedSet.has(key));
    control.markChanged();
    if (everySelected) {
      const remove = new Set(keys);
      setCurrent(currentValues.filter((item) => !remove.has(optionValueKey(item))));
    } else {
      const next = [...currentValues];
      for (const option of pool) {
        if (option.disabled || selectedSet.has(optionValueKey(option.value))) continue;
        next.push(option.value);
      }
      setCurrent(next);
    }
  };

  const selectAllState = (pool: readonly CnFieldOption[]) => {
    const keys = enabledKeys(pool);
    const selectedSet = new Set(Array.isArray(selectedKeys) ? selectedKeys : []);
    const count = keys.filter((key) => selectedSet.has(key)).length;
    return {
      checked: keys.length > 0 && count === keys.length,
      indeterminate: count > 0 && count < keys.length,
    };
  };
  const selectAllLabel = typeof selectAll === "string" ? selectAll : "Seleccionar todo";
  // En modo remoto solo hay una página cargada: "Seleccionar todo" sería engañoso.
  const withSelectAll = Boolean(selectAll) && multiple && !isRemote;

  const labelFor = (key: string): string => optionForKey(key)?.label ?? "";

  const renderValue = (selected: unknown): ReactNode => {
    if (renderValueProp) {
      const hasSelection = Array.isArray(selected) ? selected.length > 0 : selected !== "";
      if (hasSelection) {
        const found = Array.isArray(selected)
          ? (selected.map((key) => optionForKey(String(key))).filter(Boolean) as CnFieldOption[])
          : optionForKey(String(selected));
        return renderValueProp(current, found);
      }
    }
    if (Array.isArray(selected)) {
      if (selected.length === 0) {
        return (
          <Box component="span" sx={{ color: "var(--cn-color-text-subtle, #9aa1aa)" }}>
            {placeholder}
          </Box>
        );
      }
      if (chips) {
        return (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {selected.map((key) => {
              const option = optionForKey(String(key));
              return (
                <Chip
                  key={String(key)}
                  label={labelFor(String(key))}
                  avatar={
                    option && hasOptionMedia(option) ? (
                      <Box component="span" sx={{ display: "inline-flex", ml: "4px" }}>
                        <OptionMedia option={option} size={16} />
                      </Box>
                    ) : undefined
                  }
                  size="small"
                  onMouseDown={(event) => event.stopPropagation()}
                  onDelete={
                    disabled || readOnly
                      ? undefined
                      : () => emitKeys((selected as string[]).filter((item) => item !== key))
                  }
                  sx={{ height: 22, fontSize: "var(--cn-font-size-xs, 11px)" }}
                />
              );
            })}
          </Box>
        );
      }
      return selected.map((key) => labelFor(String(key))).join(", ");
    }
    if (selected === "" || selected === undefined) {
      return (
        <Box component="span" sx={{ color: "var(--cn-color-text-subtle, #9aa1aa)" }}>
          {placeholder}
        </Box>
      );
    }
    const option = optionForKey(String(selected));
    if (option && hasOptionMedia(option)) {
      return (
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <OptionMedia option={option} size={20} />
          {option.label}
        </Box>
      );
    }
    return labelFor(String(selected));
  };

  // ─── Menú MUI (listas cortas) ─────────────────────────────────────
  const allState = withSelectAll && !virtual ? selectAllState(options) : null;
  const groupedItems = useMemo(() => {
    if (virtual) return null;
    const items: ReactNode[] = [];
    let lastGroup: string | undefined;
    for (const option of options) {
      if (option.group && option.group !== lastGroup) {
        items.push(
          <ListSubheader
            key={`group-${option.group}`}
            sx={{ fontSize: "var(--cn-font-size-xs, 11px)", lineHeight: "28px" }}
          >
            {option.group}
          </ListSubheader>,
        );
        lastGroup = option.group;
      }
      items.push(
        <MenuItem
          key={optionValueKey(option.value)}
          value={optionValueKey(option.value)}
          disabled={option.disabled}
          sx={{
            fontSize: "var(--cn-font-size-base, 13px)",
            alignItems: "center",
          }}
        >
          {renderOption ? renderOption(option) : <OptionContent option={option} />}
        </MenuItem>,
      );
    }
    if (items.length === 0) {
      items.push(
        <MenuItem key="__empty" disabled value="__empty">
          {emptyText}
        </MenuItem>,
      );
    }
    return items;
  }, [emptyText, options, renderOption, virtual]);

  const muiChildren: ReactNode[] = virtual
    ? // El menú propio reemplaza al de MUI; solo se declaran las opciones
      // seleccionadas para que el Select reconozca el valor.
      [...selectedByKey.entries()].map(([key, option]) => (
        <MenuItem key={key} value={key}>
          {option.label}
        </MenuItem>
      ))
    : [
        ...(allState && options.length > 0
          ? [
              <MenuItem
                key={ALL_KEY}
                value={ALL_KEY}
                data-cn-select-all
                sx={{ fontSize: "var(--cn-font-size-base, 13px)", fontWeight: 600 }}
              >
                <Checkbox
                  size="small"
                  tabIndex={-1}
                  checked={allState.checked}
                  indeterminate={allState.indeterminate}
                  sx={{ p: "2px", mr: "6px" }}
                  slotProps={{ input: { "aria-hidden": true } }}
                />
                {selectAllLabel}
              </MenuItem>,
            ]
          : []),
        ...(groupedItems ?? []),
      ];

  const showClear = clearable && hasValue && !disabled && !readOnly;
  const busy = loading || (isRemote && remote.loading && !menuOpen) || resolver.resolving;

  const closeMenu = () => {
    setMenuOpen(false);
    setQuery("");
  };

  const pick = (option: CnFieldOption) => {
    control.markChanged();
    if (!multiple) {
      setCurrent(option.value);
      closeMenu();
      return;
    }
    const key = optionValueKey(option.value);
    const exists = currentValues.some((item) => optionValueKey(item) === key);
    setCurrent(
      exists
        ? currentValues.filter((item) => optionValueKey(item) !== key)
        : [...currentValues, option.value],
    );
  };

  if (skeleton) {
    return (
      <CnSelectFieldSkeleton
        size={size}
        label={Boolean(label)}
        helperText={Boolean(helperText)}
        multiple={multiple}
        chips={chips}
        selectedCount={
          multiple && Array.isArray(selectedKeys) && selectedKeys.length > 0
            ? selectedKeys.length
            : undefined
        }
        clearable={clearable}
        startAdornment={Boolean(startAdornment)}
        optionMedia={options.some(hasOptionMedia)}
        sx={sx}
        className={className}
      />
    );
  }

  const remoteEmpty = remote.error
    ? remote.error
    : remote.belowMinLength
      ? `Escribe al menos ${minSearchLength} caracteres`
      : query
        ? "Sin resultados"
        : emptyText;

  return (
    <>
      <TextField
        ref={setRootRef}
        select
        fullWidth
        id={control.id}
        name={name}
        label={label}
        value={selectedKeys}
        onChange={(event) => emitKeys(event.target.value as string | string[])}
        onBlur={() => {
          if (menuOpen) return;
          control.markBlurred();
          onBlur?.();
        }}
        disabled={disabled}
        required={required}
        error={control.error}
        helperText={control.helperText}
        size={MUI_FIELD_SIZE[size]}
        autoFocus={autoFocus}
        className={className}
        data-cn-select-field
        slotProps={{
          select: {
            multiple,
            displayEmpty: Boolean(placeholder),
            renderValue,
            readOnly,
            ...(virtual && {
              open: false,
              onOpen: () => setMenuOpen(true),
              "aria-controls": menuOpen ? `${control.id}-menu-listbox` : undefined,
              "aria-expanded": menuOpen,
            }),
            MenuProps: { slotProps: { paper: { sx: { maxHeight: 320 } } } },
            endAdornment:
              showClear || busy ? (
                <InputAdornment position="end" sx={{ mr: 3, gap: "2px" }}>
                  {busy && <CircularProgress size={14} aria-label="Cargando" />}
                  {showClear && (
                    <IconButton
                      size="small"
                      aria-label="Limpiar selección"
                      onClick={() => emitKeys(multiple ? [] : "")}
                      sx={{ color: "var(--cn-color-neutral-500, #6e7682)" }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )}
                </InputAdornment>
              ) : undefined,
          },
          input: { startAdornment },
          inputLabel: placeholder ? { shrink: true } : undefined,
          htmlInput: { "aria-invalid": control.error || undefined },
        }}
        sx={mergeSx(getOutlinedFieldSx(size), sx)}
      >
        {muiChildren}
      </TextField>
      {virtual && (
        <CnSelectFieldMenu
          open={menuOpen}
          anchorEl={
            rootRef.current?.querySelector<HTMLElement>(".MuiInputBase-root") ?? rootRef.current
          }
          onClose={() => {
            closeMenu();
            control.markBlurred();
            onBlur?.();
          }}
          id={`${control.id}-menu`}
          label={label}
          options={filtered.shown}
          getKey={(option) => optionValueKey(option.value)}
          multiple={multiple}
          isSelected={(option) => selectedByKey.has(optionValueKey(option.value))}
          onPick={pick}
          selectAll={
            withSelectAll
              ? {
                  label: selectAllLabel,
                  ...selectAllState(filtered.all),
                  onToggle: () => toggleAll(filtered.all),
                }
              : undefined
          }
          searchable={searchable}
          query={query}
          onQueryChange={setQuery}
          renderOption={renderOption}
          loading={isRemote ? remote.loading : loading}
          emptyText={isRemote ? remoteEmpty : query ? "Sin resultados" : emptyText}
          setSize={remote.total}
          virtualize
          onEndReached={() => {
            if (remote.hasMore && !remote.loadingMore && !remote.loadMoreError) remote.loadMore();
          }}
          footer={
            <CnListStatus
              component="div"
              loadingMore={remote.loadingMore}
              loadMoreError={remote.loadMoreError}
              onRetry={remote.retry}
              truncated={filtered.truncated}
              shown={options.length}
              total={remote.total}
            />
          }
        />
      )}
    </>
  );
});

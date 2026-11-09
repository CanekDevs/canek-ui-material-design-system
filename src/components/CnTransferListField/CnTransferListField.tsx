import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Tooltip from "@mui/material/Tooltip";
import type { KeyboardEvent, ReactNode } from "react";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { groupLegendSx, helperTextSx, mergeSx } from "../../utils/field-styles";
import { filterOptionsFast, formatCount, optionValueKey } from "../../utils/option-filter";
import { OptionContent } from "../../utils/option-media";
import type { CnLoadOptions, CnResolveOptions } from "../../utils/use-async-options";
import { useAsyncOptions, useOptionMemory } from "../../utils/use-async-options";
import { useResolvedOptions } from "../../utils/use-resolved-options";
import { getVirtualSlots, useVirtualList } from "../../utils/use-virtual-list";
import { CnListStatus, shouldVirtualize } from "../../utils/virtual-listbox";
import type { CnFieldOption } from "../CnForm/CnForm.types";
import { CnTransferListFieldSkeleton } from "./CnTransferListFieldSkeleton";

export type CnTransferListValue = Array<string | number>;

export type CnTransferListFieldProps = CnFieldBaseProps<CnTransferListValue> & {
  options?: readonly CnFieldOption[];
  /** Títulos de las listas. */
  availableTitle?: string;
  selectedTitle?: string;
  /** Muestra un buscador en cada lista. Por defecto `true`. */
  searchable?: boolean;
  /** Alto de cada lista en px. */
  listHeight?: number;
  /** Máximo de elementos seleccionados. */
  max?: number;
  renderOption?: (option: CnFieldOption) => ReactNode;
  emptyText?: string;
  /** Muestra el skeleton del campo (mismas variantes) en lugar del campo. */
  skeleton?: boolean;
  /**
   * Virtualiza ambas listas: `true`, `false` o el número de elementos a partir
   * del cual se activa. Por defecto con más de 100.
   */
  virtualize?: boolean | number;
  /**
   * Disponibles desde el servidor (arreglo o páginas `{ options, hasMore,
   * total? }`): el buscador de "Disponibles" consulta al servidor y la lista
   * carga más al llegar al final. "Mover todos" mueve solo lo cargado.
   */
  loadOptions?: CnLoadOptions;
  loadOptionsDeps?: readonly unknown[];
  /** Tamaño de página para `loadOptions`. Por defecto 50. */
  pageSize?: number;
  /** Caracteres mínimos para buscar en el servidor. */
  minSearchLength?: number;
  searchDebounceMs?: number;
  /** Opciones de valores seleccionados que no están cargados (edición). */
  resolveOptions?: CnResolveOptions;
  /** Opciones ya seleccionadas, para mostrar su etiqueta sin buscarlas. */
  selectedOptions?: readonly CnFieldOption[];
  /** Etiqueta de respaldo para un valor sin opción conocida. */
  getValueLabel?: (value: string | number) => string;
  /** Comparte la caché de opciones remotas entre campos con la misma clave. */
  cacheKey?: string;
};

const keyOf = optionValueKey;
const ROW_HEIGHT = 34;

type PaneProps = {
  title: string;
  items: readonly CnFieldOption[];
  checked: Set<string>;
  onToggle: (key: string) => void;
  onToggleAll: (keys: string[]) => void;
  onActivate: (key: string) => void;
  searchable: boolean;
  height: number;
  disabled: boolean;
  emptyText: string;
  renderOption?: (option: CnFieldOption) => ReactNode;
  idPrefix: string;
  virtualize?: boolean | number;
  /** Búsqueda controlada (remota): la lista ya llega filtrada. */
  query?: string;
  onQueryChange?: (query: string) => void;
  /** Total a mostrar en el encabezado (p. ej. el del servidor). */
  total?: number;
  loading?: boolean;
  footer?: ReactNode;
  onEndReached?: () => void;
};

const Pane = ({
  title,
  items,
  checked,
  onToggle,
  onToggleAll,
  onActivate,
  searchable,
  height,
  disabled,
  emptyText,
  renderOption,
  idPrefix,
  virtualize,
  query: controlledQuery,
  onQueryChange,
  total,
  loading = false,
  footer,
  onEndReached,
}: PaneProps) => {
  const [localQuery, setLocalQuery] = useState("");
  const remote = onQueryChange !== undefined;
  const query = remote ? (controlledQuery ?? "") : localQuery;
  const visible = useMemo(
    () => (remote || !query.trim() ? items : filterOptionsFast(items, query).options),
    [items, query, remote],
  );
  const selectable = visible.filter((option) => !option.disabled).map((o) => keyOf(o.value));
  const checkedVisible = selectable.filter((key) => checked.has(key));
  const all = selectable.length > 0 && checkedVisible.length === selectable.length;
  const some = checkedVisible.length > 0 && !all;
  const titleId = `${idPrefix}-title`;

  const listRef = useRef<HTMLDivElement | null>(null);
  const virtual = useVirtualList({
    count: visible.length,
    estimateSize: ROW_HEIGHT,
    getItemKey: (index) => (visible[index] ? keyOf(visible[index].value) : index),
    overscan: 8,
    paddingStart: 4,
    defaultViewportHeight: height,
    enabled: shouldVirtualize(virtualize, visible.length),
    onEndReached,
  });

  const { scrollRef } = virtual;
  const setListRef = useCallback(
    (element: HTMLDivElement | null) => {
      listRef.current = element;
      scrollRef(element);
    },
    [scrollRef],
  );

  // Foco "itinerante": solo una fila es tabulable; las flechas mueven el foco.
  const [focusIndex, setFocusIndex] = useState(0);
  const pendingFocusRef = useRef<number | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  useEffect(() => {
    const index = pendingFocusRef.current;
    if (index === null) return;
    const row = listRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`);
    if (row) {
      pendingFocusRef.current = null;
      row.focus();
    }
  });
  const focusRow = (index: number) => {
    if (visible.length === 0) return;
    const target = Math.max(0, Math.min(index, visible.length - 1));
    setFocusIndex(target);
    pendingFocusRef.current = target;
    virtual.scrollToIndex(target);
    setFocusTick(focusTick + 1);
  };
  const tabbable = Math.min(focusIndex, Math.max(0, visible.length - 1));

  const onRowKey = (event: KeyboardEvent<HTMLElement>, key: string, index: number) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusRow(index + 1);
        return;
      case "ArrowUp":
        event.preventDefault();
        focusRow(index - 1);
        return;
      case "PageDown":
        event.preventDefault();
        focusRow(index + 10);
        return;
      case "PageUp":
        event.preventDefault();
        focusRow(index - 10);
        return;
      case "Home":
        event.preventDefault();
        focusRow(0);
        return;
      case "End":
        event.preventDefault();
        focusRow(visible.length - 1);
        return;
      default:
    }
    const option = visible[index];
    if (disabled || option?.disabled) return;
    if (event.key === " ") {
      event.preventDefault();
      onToggle(key);
    } else if (event.key === "Enter") {
      event.preventDefault();
      onActivate(key);
    }
  };

  const count = total ?? items.length;

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        border: "1px solid var(--cn-color-border, #dde0e4)",
        borderRadius: "var(--cn-radius-md, 8px)",
        backgroundColor: "var(--cn-color-surface, #ffffff)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          px: "6px",
          py: "4px",
          borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
          backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
        }}
      >
        <Checkbox
          size="small"
          checked={all}
          indeterminate={some}
          disabled={disabled || selectable.length === 0}
          onChange={() => onToggleAll(all ? [] : selectable)}
          slotProps={{ input: { "aria-label": `Seleccionar todo en ${title}` } }}
        />
        <Box
          id={titleId}
          sx={{ flex: 1, fontSize: "var(--cn-font-size-sm, 12px)", fontWeight: 600 }}
        >
          {title}
        </Box>
        {loading && <CircularProgress size={12} aria-label="Cargando" />}
        <Box
          sx={{
            fontSize: "var(--cn-font-size-xs, 11px)",
            color: "var(--cn-color-text-muted, #6e7682)",
            pr: "6px",
          }}
        >
          {checked.size > 0
            ? `${formatCount(checked.size)}/${formatCount(count)}`
            : formatCount(count)}
        </Box>
      </Box>
      {searchable && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            px: "10px",
            borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
          }}
        >
          <SearchIcon sx={{ fontSize: 16, color: "var(--cn-color-neutral-400, #9aa1aa)" }} />
          <InputBase
            value={query}
            onChange={(event) => {
              if (remote) onQueryChange?.(event.target.value);
              else setLocalQuery(event.target.value);
              setFocusIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                focusRow(0);
              }
            }}
            placeholder="Buscar…"
            disabled={disabled}
            inputProps={{ "aria-label": `Buscar en ${title}` }}
            sx={{ flex: 1, fontSize: "var(--cn-font-size-sm, 12px)", py: "6px" }}
          />
        </Box>
      )}
      <Box
        ref={setListRef}
        role="listbox"
        aria-labelledby={titleId}
        aria-multiselectable
        aria-busy={loading || undefined}
        sx={{ height, overflowY: "auto", py: "4px", position: "relative" }}
      >
        {visible.length === 0 ? (
          <Box
            sx={{
              p: "16px",
              textAlign: "center",
              fontSize: "var(--cn-font-size-sm, 12px)",
              color: "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            {loading ? "Cargando…" : emptyText}
          </Box>
        ) : (
          getVirtualSlots(virtual.items, virtual.totalSize).map((slot) => {
            if (slot.type === "spacer") {
              return <Box key={slot.key} aria-hidden sx={{ height: `${slot.size}px` }} />;
            }
            const index = slot.item.index;
            const option = visible[index];
            const key = keyOf(option.value);
            const isChecked = checked.has(key);
            const isDisabled = disabled || Boolean(option.disabled);
            return (
              <Box
                key={key}
                role="option"
                aria-selected={isChecked}
                aria-disabled={isDisabled || undefined}
                aria-setsize={visible.length}
                aria-posinset={index + 1}
                data-index={index}
                ref={virtual.measureElement}
                tabIndex={index === tabbable ? 0 : -1}
                onFocus={() => focusIndex !== index && setFocusIndex(index)}
                onClick={() => !isDisabled && onToggle(key)}
                onDoubleClick={() => !isDisabled && onActivate(key)}
                onKeyDown={(event) => onRowKey(event, key, index)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  px: "6px",
                  minHeight: ROW_HEIGHT,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  opacity: isDisabled ? 0.5 : 1,
                  fontSize: "var(--cn-font-size-base, 13px)",
                  backgroundColor: isChecked ? "var(--cn-color-brand-50, #eef3fb)" : undefined,
                  outline: "none",
                  "&:hover": { backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)" },
                  "&:focus-visible": {
                    boxShadow: "inset 0 0 0 2px var(--cn-color-brand-400, #5081c4)",
                  },
                }}
              >
                <Checkbox
                  size="small"
                  checked={isChecked}
                  disabled={isDisabled}
                  tabIndex={-1}
                  sx={{ p: "4px" }}
                  slotProps={{ input: { "aria-hidden": true } }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  {renderOption ? renderOption(option) : <OptionContent option={option} />}
                </Box>
              </Box>
            );
          })
        )}
        {visible.length > 0 && footer}
      </Box>
    </Box>
  );
};

const EMPTY: readonly CnFieldOption[] = [];

/**
 * Lista doble para asignar elementos (permisos, usuarios a un grupo,
 * columnas visibles…). El valor es el arreglo de valores seleccionados en el
 * orden de las opciones (con `loadOptions`, en el orden en que se agregan).
 * Doble clic o Enter mueve un elemento.
 */
export const CnTransferListField = forwardRef<HTMLFieldSetElement, CnTransferListFieldProps>(
  function CnTransferListField(
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
      reserveHelperSpace,
      sx,
      className,
      options: staticOptions = EMPTY,
      availableTitle = "Disponibles",
      selectedTitle = "Seleccionados",
      searchable = true,
      listHeight = 240,
      max,
      renderOption,
      emptyText = "Sin elementos",
      skeleton = false,
      virtualize,
      loadOptions,
      loadOptionsDeps,
      pageSize,
      minSearchLength = 0,
      searchDebounceMs = 300,
      resolveOptions,
      selectedOptions,
      getValueLabel,
      cacheKey,
    },
    ref,
  ) {
    const [current, setCurrent] = useControllableValue<CnTransferListValue>(
      value,
      defaultValue,
      [],
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
    const [checked, setChecked] = useState<Set<string>>(new Set());
    const [availableQuery, setAvailableQuery] = useState("");
    const locked = Boolean(disabled || readOnly);
    const isRemote = Boolean(loadOptions);

    const remote = useAsyncOptions({
      loadOptions,
      deps: loadOptionsDeps,
      input: availableQuery,
      debounceMs: searchDebounceMs,
      minSearchLength,
      disabled: !loadOptions,
      pageSize,
      cacheKey,
    });
    const options = isRemote ? remote.options : staticOptions;
    const remember = useOptionMemory(options, selectedOptions);

    const values = useMemo(() => (Array.isArray(current) ? current : []), [current]);
    const selectedSet = useMemo(() => new Set(values.map(keyOf)), [values]);
    const byKey = useMemo(() => {
      const map = new Map<string, CnFieldOption>();
      for (const option of options) map.set(keyOf(option.value), option);
      return map;
    }, [options]);
    const resolver = useResolvedOptions({
      values,
      isKnown: (item) => byKey.has(keyOf(item)) || Boolean(remember(item)),
      resolveOptions,
      cacheKey,
    });

    const left = useMemo(
      () => options.filter((option) => !selectedSet.has(keyOf(option.value))),
      [options, selectedSet],
    );
    const right = isRemote
      ? values.map(
          (item) =>
            byKey.get(keyOf(item)) ??
            remember(item) ??
            resolver.get(item) ?? { value: item, label: getValueLabel?.(item) ?? String(item) },
        )
      : staticOptions.filter((option) => selectedSet.has(keyOf(option.value)));
    const leftChecked = new Set(left.map((o) => keyOf(o.value)).filter((k) => checked.has(k)));
    const rightChecked = new Set(right.map((o) => keyOf(o.value)).filter((k) => checked.has(k)));
    const room = max === undefined ? Infinity : Math.max(0, max - right.length);

    const commit = (nextValues: Array<string | number>) => {
      control.markChanged();
      if (isRemote) {
        setCurrent(nextValues);
      } else {
        const nextSet = new Set(nextValues.map(keyOf));
        setCurrent(staticOptions.filter((o) => nextSet.has(keyOf(o.value))).map((o) => o.value));
      }
      setChecked(new Set());
    };

    const moveRight = (keys: string[]) => {
      const added = keys
        .slice(0, room)
        .map((key) => byKey.get(key)?.value)
        .filter((item): item is string | number => item !== undefined);
      commit([...values, ...added]);
    };
    const moveLeft = (keys: string[]) => {
      const remove = new Set(keys);
      commit(values.filter((item) => !remove.has(keyOf(item))));
    };

    const toggle = (key: string) =>
      setChecked((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    const toggleAll = (pool: readonly CnFieldOption[]) => (keys: string[]) =>
      setChecked((prev) => {
        const next = new Set(prev);
        pool.forEach((o) => next.delete(keyOf(o.value)));
        keys.forEach((k) => next.add(k));
        return next;
      });

    const enabledKeys = (list: readonly CnFieldOption[]) =>
      list.filter((o) => !o.disabled).map((o) => keyOf(o.value));

    const buttons: Array<{
      label: string;
      icon: ReactNode;
      disabled: boolean;
      onClick: () => void;
    }> = [
      {
        label: "Mover todos a seleccionados",
        icon: <KeyboardDoubleArrowRightIcon fontSize="small" />,
        disabled: locked || enabledKeys(left).length === 0 || room === 0,
        onClick: () => moveRight(enabledKeys(left)),
      },
      {
        label: "Mover a seleccionados",
        icon: <ChevronRightIcon fontSize="small" />,
        disabled: locked || leftChecked.size === 0 || room === 0,
        onClick: () => moveRight([...leftChecked]),
      },
      {
        label: "Quitar de seleccionados",
        icon: <ChevronLeftIcon fontSize="small" />,
        disabled: locked || rightChecked.size === 0,
        onClick: () => moveLeft([...rightChecked]),
      },
      {
        label: "Quitar todos",
        icon: <KeyboardDoubleArrowLeftIcon fontSize="small" />,
        disabled: locked || enabledKeys(right).length === 0,
        onClick: () => moveLeft(enabledKeys(right)),
      },
    ];

    if (skeleton) {
      return (
        <CnTransferListFieldSkeleton
          label={Boolean(label)}
          helperText={Boolean(helperText)}
          searchable={searchable}
          listHeight={listHeight}
          availableItems={options.length ? left.length : 5}
          selectedItems={options.length ? right.length : 2}
          withAvatar={options.some((o) => Boolean(o.initials || o.avatar || o.icon))}
          sx={sx}
          className={className}
        />
      );
    }

    const remoteEmpty = remote.error
      ? remote.error
      : remote.belowMinLength
        ? `Escribe al menos ${minSearchLength} caracteres`
        : availableQuery
          ? "Sin resultados"
          : emptyText;

    return (
      <FormControl
        ref={ref}
        component="fieldset"
        error={control.error}
        disabled={disabled}
        required={required}
        fullWidth
        className={className}
        data-cn-transfer-list-field
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            control.markBlurred();
            onBlur?.();
          }
        }}
        sx={mergeSx({ minWidth: 0, border: 0, p: 0, m: 0 }, sx)}
      >
        {label && (
          <FormLabel component="legend" sx={groupLegendSx}>
            {label}
          </FormLabel>
        )}
        <Box
          id={control.id}
          aria-describedby={control.helperText ? control.helperId : undefined}
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "stretch",
            gap: "8px",
          }}
        >
          <Pane
            title={availableTitle}
            items={left}
            checked={leftChecked}
            onToggle={toggle}
            onToggleAll={toggleAll(left)}
            onActivate={(key) => !locked && room > 0 && moveRight([key])}
            searchable={searchable}
            height={listHeight}
            disabled={locked}
            emptyText={isRemote ? remoteEmpty : emptyText}
            renderOption={renderOption}
            idPrefix={`${control.id}-available`}
            virtualize={isRemote ? true : virtualize}
            {...(isRemote && {
              query: availableQuery,
              onQueryChange: setAvailableQuery,
              total:
                remote.total !== undefined
                  ? Math.max(0, remote.total - (options.length - left.length))
                  : undefined,
              loading: remote.loading,
              onEndReached: () => {
                if (remote.hasMore && !remote.loadingMore && !remote.loadMoreError) {
                  remote.loadMore();
                }
              },
              footer: (
                <CnListStatus
                  component="div"
                  loadingMore={remote.loadingMore}
                  loadMoreError={remote.loadMoreError}
                  onRetry={remote.retry}
                  shown={options.length}
                  total={remote.total}
                />
              ),
            })}
          />
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "row", sm: "column" },
              justifyContent: "center",
              gap: "4px",
            }}
          >
            {buttons.map((button) => (
              <Tooltip key={button.label} title={button.label}>
                <span>
                  <IconButton
                    size="small"
                    aria-label={button.label}
                    disabled={button.disabled}
                    onClick={button.onClick}
                    sx={{
                      border: "1px solid var(--cn-color-border, #dde0e4)",
                      borderRadius: "var(--cn-radius-sm, 6px)",
                      transform: { xs: "rotate(90deg)", sm: "none" },
                    }}
                  >
                    {button.icon}
                  </IconButton>
                </span>
              </Tooltip>
            ))}
          </Box>
          <Pane
            title={max === undefined ? selectedTitle : `${selectedTitle} (máx. ${max})`}
            items={right}
            checked={rightChecked}
            onToggle={toggle}
            onToggleAll={toggleAll(right)}
            onActivate={(key) => !locked && moveLeft([key])}
            searchable={searchable}
            height={listHeight}
            disabled={locked}
            emptyText={emptyText}
            renderOption={renderOption}
            idPrefix={`${control.id}-selected`}
            virtualize={virtualize}
            loading={resolver.resolving}
          />
        </Box>
        {name && <input type="hidden" name={name} value={(current ?? []).join(",")} />}
        {control.helperText && (
          <FormHelperText id={control.helperId} sx={helperTextSx}>
            {control.helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  },
);

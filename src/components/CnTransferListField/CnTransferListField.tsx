import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Tooltip from "@mui/material/Tooltip";
import type { ReactNode } from "react";
import { forwardRef, useMemo, useState } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { groupLegendSx, helperTextSx, mergeSx } from "../../utils/field-styles";
import { OptionContent } from "../../utils/option-media";
import { normalizeSearchText } from "../CnAutocompleteField";
import type { CnFieldOption } from "../CnForm/CnForm.types";

export type CnTransferListValue = Array<string | number>;

export type CnTransferListFieldProps = CnFieldBaseProps<CnTransferListValue> & {
  options: readonly CnFieldOption[];
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
};

const keyOf = (value: string | number) => `${typeof value}:${value}`;

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
}: PaneProps) => {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q) return items;
    return items.filter((option) =>
      normalizeSearchText(`${option.label} ${option.searchText ?? ""}`).includes(q),
    );
  }, [items, query]);
  const selectable = visible.filter((option) => !option.disabled).map((o) => keyOf(o.value));
  const checkedVisible = selectable.filter((key) => checked.has(key));
  const all = selectable.length > 0 && checkedVisible.length === selectable.length;
  const some = checkedVisible.length > 0 && !all;
  const titleId = `${idPrefix}-title`;

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
        <Box
          sx={{
            fontSize: "var(--cn-font-size-xs, 11px)",
            color: "var(--cn-color-text-muted, #6e7682)",
            pr: "6px",
          }}
        >
          {checked.size > 0 ? `${checked.size}/${items.length}` : items.length}
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
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar…"
            disabled={disabled}
            inputProps={{ "aria-label": `Buscar en ${title}` }}
            sx={{ flex: 1, fontSize: "var(--cn-font-size-sm, 12px)", py: "6px" }}
          />
        </Box>
      )}
      <Box
        role="listbox"
        aria-labelledby={titleId}
        aria-multiselectable
        sx={{ height, overflowY: "auto", py: "4px" }}
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
            {emptyText}
          </Box>
        ) : (
          visible.map((option) => {
            const key = keyOf(option.value);
            const isChecked = checked.has(key);
            const isDisabled = disabled || Boolean(option.disabled);
            return (
              <Box
                key={key}
                role="option"
                aria-selected={isChecked}
                aria-disabled={isDisabled || undefined}
                tabIndex={isDisabled ? -1 : 0}
                onClick={() => !isDisabled && onToggle(key)}
                onDoubleClick={() => !isDisabled && onActivate(key)}
                onKeyDown={(event) => {
                  if (isDisabled) return;
                  if (event.key === " ") {
                    event.preventDefault();
                    onToggle(key);
                  } else if (event.key === "Enter") {
                    event.preventDefault();
                    onActivate(key);
                  }
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  px: "6px",
                  minHeight: 34,
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
      </Box>
    </Box>
  );
};

/**
 * Lista doble para asignar elementos (permisos, usuarios a un grupo,
 * columnas visibles…). El valor es el arreglo de valores seleccionados en el
 * orden de las opciones. Doble clic o Enter mueve un elemento.
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
      options,
      availableTitle = "Disponibles",
      selectedTitle = "Seleccionados",
      searchable = true,
      listHeight = 240,
      max,
      renderOption,
      emptyText = "Sin elementos",
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
    const locked = Boolean(disabled || readOnly);

    const selectedSet = useMemo(
      () => new Set((Array.isArray(current) ? current : []).map(keyOf)),
      [current],
    );
    const left = options.filter((option) => !selectedSet.has(keyOf(option.value)));
    const right = options.filter((option) => selectedSet.has(keyOf(option.value)));
    const leftChecked = new Set(left.map((o) => keyOf(o.value)).filter((k) => checked.has(k)));
    const rightChecked = new Set(right.map((o) => keyOf(o.value)).filter((k) => checked.has(k)));
    const room = max === undefined ? Infinity : Math.max(0, max - right.length);

    const commit = (nextSelected: Set<string>) => {
      control.markChanged();
      setCurrent(options.filter((o) => nextSelected.has(keyOf(o.value))).map((o) => o.value));
      setChecked(new Set());
    };

    const moveRight = (keys: string[]) => {
      const next = new Set(selectedSet);
      keys.slice(0, room).forEach((key) => next.add(key));
      commit(next);
    };
    const moveLeft = (keys: string[]) => {
      const next = new Set(selectedSet);
      keys.forEach((key) => next.delete(key));
      commit(next);
    };

    const toggle = (key: string) =>
      setChecked((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    const toggleAll = (pool: CnFieldOption[]) => (keys: string[]) =>
      setChecked((prev) => {
        const next = new Set(prev);
        pool.forEach((o) => next.delete(keyOf(o.value)));
        keys.forEach((k) => next.add(k));
        return next;
      });

    const enabledKeys = (list: CnFieldOption[]) =>
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
            emptyText={emptyText}
            renderOption={renderOption}
            idPrefix={`${control.id}-available`}
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

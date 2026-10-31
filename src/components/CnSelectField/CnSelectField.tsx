import ClearIcon from "@mui/icons-material/Clear";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import type { ReactNode } from "react";
import { forwardRef, useMemo } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { getOutlinedFieldSx, mergeSx, MUI_FIELD_SIZE } from "../../utils/field-styles";
import type { CnFieldOption } from "../CnForm/CnForm.types";

export type CnSelectValue = string | number | "" | null | Array<string | number>;

export type CnSelectFieldProps = CnFieldBaseProps<CnSelectValue> & {
  options: readonly CnFieldOption[];
  multiple?: boolean;
  placeholder?: string;
  /** Muestra la selección múltiple como chips. */
  chips?: boolean;
  /** Botón para limpiar la selección. */
  clearable?: boolean;
  emptyText?: string;
  renderOption?: (option: CnFieldOption) => ReactNode;
  startAdornment?: ReactNode;
  autoFocus?: boolean;
};

const optionKey = (value: string | number): string => `${typeof value}:${value}`;

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
    options,
    multiple = false,
    placeholder,
    chips = false,
    clearable = false,
    emptyText = "Sin opciones disponibles",
    renderOption,
    startAdornment,
    autoFocus,
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

  // MUI compara valores por igualdad estricta; se usa una clave estable para
  // conservar el tipo original (number vs string) al emitir.
  const byKey = useMemo(() => {
    const map = new Map<string, CnFieldOption>();
    for (const option of options) map.set(optionKey(option.value), option);
    return map;
  }, [options]);

  const selectedKeys = useMemo(() => {
    if (multiple) {
      return Array.isArray(current) ? current.map(optionKey) : [];
    }
    if (current === "" || current === null || current === undefined || Array.isArray(current)) {
      return "";
    }
    return optionKey(current);
  }, [current, multiple]);

  const hasValue = Array.isArray(selectedKeys) ? selectedKeys.length > 0 : selectedKeys !== "";

  const emitKeys = (keys: string | string[]) => {
    control.markChanged();
    if (Array.isArray(keys)) {
      setCurrent(
        keys.map((key) => byKey.get(key)?.value).filter((v) => v !== undefined) as Array<
          string | number
        >,
      );
      return;
    }
    setCurrent(keys === "" ? "" : (byKey.get(keys)?.value ?? ""));
  };

  const labelFor = (key: string): string => byKey.get(key)?.label ?? "";

  const renderValue = (selected: unknown): ReactNode => {
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
            {selected.map((key) => (
              <Chip
                key={String(key)}
                label={labelFor(String(key))}
                size="small"
                onMouseDown={(event) => event.stopPropagation()}
                onDelete={
                  disabled || readOnly
                    ? undefined
                    : () => emitKeys((selected as string[]).filter((item) => item !== key))
                }
                sx={{ height: 22, fontSize: "var(--cn-font-size-xs, 11px)" }}
              />
            ))}
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
    return labelFor(String(selected));
  };

  const groupedItems = useMemo(() => {
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
          key={optionKey(option.value)}
          value={optionKey(option.value)}
          disabled={option.disabled}
          sx={{
            fontSize: "var(--cn-font-size-base, 13px)",
            alignItems: "flex-start",
            flexDirection: "column",
          }}
        >
          {renderOption ? (
            renderOption(option)
          ) : (
            <>
              <span>{option.label}</span>
              {option.description && (
                <Box
                  component="span"
                  sx={{
                    fontSize: "var(--cn-font-size-xs, 11px)",
                    color: "var(--cn-color-text-muted, #6e7682)",
                  }}
                >
                  {option.description}
                </Box>
              )}
            </>
          )}
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
  }, [emptyText, options, renderOption]);

  const showClear = clearable && hasValue && !disabled && !readOnly;

  return (
    <TextField
      ref={ref}
      select
      fullWidth
      id={control.id}
      name={name}
      label={label}
      value={selectedKeys}
      onChange={(event) => emitKeys(event.target.value as string | string[])}
      onBlur={() => {
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
          MenuProps: { slotProps: { paper: { sx: { maxHeight: 320 } } } },
          endAdornment: showClear ? (
            <InputAdornment position="end" sx={{ mr: 3 }}>
              <IconButton
                size="small"
                aria-label="Limpiar selección"
                onClick={() => emitKeys(multiple ? [] : "")}
                sx={{ color: "var(--cn-color-neutral-500, #6e7682)" }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        },
        input: { startAdornment },
        inputLabel: placeholder ? { shrink: true } : undefined,
        htmlInput: { "aria-invalid": control.error || undefined },
      }}
      sx={mergeSx(getOutlinedFieldSx(size), sx)}
    >
      {groupedItems}
    </TextField>
  );
});

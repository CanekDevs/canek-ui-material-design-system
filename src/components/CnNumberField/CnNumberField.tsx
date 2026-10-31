import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import RemoveIcon from "@mui/icons-material/Remove";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import type { KeyboardEvent, ReactNode } from "react";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useDraftValue, useFieldControl } from "../../utils/field-control";
import { getOutlinedFieldSx, mergeSx, MUI_FIELD_SIZE } from "../../utils/field-styles";
import {
  clampNumber,
  countDecimals,
  formatNumber,
  parseNumericInput,
  roundTo,
  sanitizeNumericInput,
} from "../../utils/number-utils";
import { usePressRepeat } from "../../utils/use-press-repeat";

/**
 * Estilo de los controles:
 * - `stacked`: flechas ▲▼ apiladas a la derecha (por defecto).
 * - `split`: botones − y + a los lados, valor centrado (selector de cantidad).
 * - `inline`: − y + juntos a la derecha.
 * - `none`: sin botones (teclado, rueda y escritura siguen funcionando).
 */
export type CnNumberFieldControls = "stacked" | "split" | "inline" | "none";

export type CnNumberFieldProps = CnFieldBaseProps<number | null> & {
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  /** Paso con Shift / Re Pág / Av Pág. Por defecto `step × 10`. */
  largeStep?: number;
  /** Paso con Alt. Por defecto `step / 10`. */
  smallStep?: number;
  /** Decimales permitidos. `0` = solo enteros. Sin definir = libre. */
  decimals?: number;
  /** Por defecto se permiten negativos salvo que `min >= 0`. */
  allowNegative?: boolean;
  /** Ajusta el valor a `min`/`max` al salir del campo. */
  clampOnBlur?: boolean;
  /** Redondea al múltiplo de `step` más cercano (a partir de `min`) al salir. */
  snapToStep?: boolean;
  /** Si es `false`, un campo vacío vuelve a `min` (o 0) al salir. */
  allowEmpty?: boolean;
  controls?: CnNumberFieldControls;
  /** @deprecated Usa `controls="inline"`. */
  showSteppers?: boolean;
  /** Cambia el valor con la rueda del mouse mientras el campo tiene el foco. */
  allowWheel?: boolean;
  /** Mantener presionado un control repite el paso (con aceleración). */
  holdToRepeat?: boolean;
  /** Botón para vaciar el campo. */
  clearable?: boolean;
  /** Agrupa miles cuando el campo no tiene el foco. */
  thousandSeparator?: boolean;
  locale?: string;
  /** Formato personalizado cuando el campo no tiene el foco. */
  format?: (value: number) => string;
  textAlign?: "left" | "center" | "right";
  prefix?: string;
  suffix?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  autoFocus?: boolean;
  /** Selecciona el contenido al enfocar. */
  autoSelect?: boolean;
};

const stackedButtonSx = {
  width: 24,
  height: "50%",
  minHeight: 14,
  borderRadius: 0,
  color: "var(--cn-color-neutral-500, #6e7682)",
  "&:hover": {
    backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
    color: "var(--cn-color-brand-600, #254d87)",
  },
  "&.Mui-disabled": { color: "var(--cn-color-neutral-300, #c5cad0)" },
  "& svg": { fontSize: 16 },
} as const;

const splitButtonSx = {
  width: 30,
  height: 30,
  borderRadius: "var(--cn-radius-sm, 6px)",
  color: "var(--cn-color-brand-600, #254d87)",
  backgroundColor: "var(--cn-color-brand-50, #eef3fb)",
  "&:hover": { backgroundColor: "var(--cn-color-brand-100, #d4e0f4)" },
  "&.Mui-disabled": {
    color: "var(--cn-color-neutral-300, #c5cad0)",
    backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
  },
} as const;

export const CnNumberField = forwardRef<HTMLDivElement, CnNumberFieldProps>(function CnNumberField(
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
    placeholder,
    min,
    max,
    step = 1,
    largeStep,
    smallStep,
    decimals,
    allowNegative,
    clampOnBlur = true,
    snapToStep = false,
    allowEmpty = true,
    controls: controlsProp,
    showSteppers,
    allowWheel = false,
    holdToRepeat = true,
    clearable = false,
    thousandSeparator = false,
    locale = "es-MX",
    format,
    textAlign,
    prefix,
    suffix,
    startAdornment,
    endAdornment,
    autoFocus,
    autoSelect = false,
  },
  ref,
) {
  const controls: CnNumberFieldControls = controlsProp ?? (showSteppers ? "inline" : "stacked");
  const [focused, setFocused] = useState(false);
  const isControlled = value !== undefined;
  const negativeAllowed = allowNegative ?? (min === undefined || min < 0);
  const big = largeStep ?? step * 10;
  const small = smallStep ?? step / 10;

  const display = useCallback(
    (num: number | null | undefined): string => {
      if (num === null || num === undefined || !Number.isFinite(num)) return "";
      if (format) return format(num);
      if (thousandSeparator) return formatNumber(num, { locale, decimals });
      return String(num);
    },
    [decimals, format, locale, thousandSeparator],
  );

  const [uncontrolled, setUncontrolled] = useState<number | null>(defaultValue ?? null);
  const current = isControlled ? (value ?? null) : uncontrolled;
  const currentRef = useRef(current);
  currentRef.current = current;
  const focusedRef = useRef(focused);
  focusedRef.current = focused;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft, markEmitted] = useDraftValue<number | null>(current, display);

  const control = useFieldControl(current, {
    id,
    rules,
    formValues,
    sectionContext,
    validateOnChange,
    validateOnBlur,
    debounceMs,
    internalValidation,
    error,
    helperText,
    reserveHelperSpace,
  });

  const emit = useCallback(
    (next: number | null) => {
      markEmitted(next);
      currentRef.current = next;
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, markEmitted, onChange],
  );

  const blocked = Boolean(disabled || readOnly);

  const stepBy = useCallback(
    (delta: number) => {
      if (blocked) return;
      const base =
        currentRef.current ??
        (min !== undefined && min > 0 ? min - Math.sign(delta) * Math.abs(delta) : 0);
      const precision = Math.max(
        countDecimals(Math.abs(delta)),
        countDecimals(base),
        decimals ?? 0,
      );
      let next = clampNumber(roundTo(base + delta, precision), min, max);
      if (decimals !== undefined) next = roundTo(next, decimals);
      if (next === currentRef.current) return;
      control.markChanged();
      setDraft(focusedRef.current ? String(next) : display(next));
      emit(next);
    },
    [blocked, control, decimals, display, emit, max, min, setDraft],
  );

  const increment = usePressRepeat(() => stepBy(step), holdToRepeat && !blocked);
  const decrement = usePressRepeat(() => stepBy(-step), holdToRepeat && !blocked);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const amount = event.shiftKey ? big : event.altKey ? small : step;
    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        stepBy(amount);
        break;
      case "ArrowDown":
        event.preventDefault();
        stepBy(-amount);
        break;
      case "PageUp":
        event.preventDefault();
        stepBy(big);
        break;
      case "PageDown":
        event.preventDefault();
        stepBy(-big);
        break;
      case "Home":
        if (min !== undefined) {
          event.preventDefault();
          stepBy(min - (currentRef.current ?? min));
        }
        break;
      case "End":
        if (max !== undefined) {
          event.preventDefault();
          stepBy(max - (currentRef.current ?? max));
        }
        break;
      default:
    }
  };

  // La rueda necesita un listener no pasivo para poder cancelar el scroll.
  useEffect(() => {
    const node = inputRef.current;
    if (!node || !allowWheel) return;
    const onWheel = (event: globalThis.WheelEvent) => {
      if (document.activeElement !== node || event.deltaY === 0) return;
      event.preventDefault();
      const amount = event.shiftKey ? big : event.altKey ? small : step;
      stepBy(event.deltaY < 0 ? amount : -amount);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [allowWheel, big, small, step, stepBy]);

  const canDecrement = !blocked && (min === undefined || current === null || current > min);
  const canIncrement = !blocked && (max === undefined || current === null || current < max);

  const decrementButton = (sxStyle: object, icon: ReactNode) => (
    <IconButton
      size="small"
      aria-label="Disminuir"
      tabIndex={-1}
      disabled={!canDecrement}
      {...decrement}
      sx={sxStyle}
    >
      {icon}
    </IconButton>
  );
  const incrementButton = (sxStyle: object, icon: ReactNode) => (
    <IconButton
      size="small"
      aria-label="Aumentar"
      tabIndex={-1}
      disabled={!canIncrement}
      {...increment}
      sx={sxStyle}
    >
      {icon}
    </IconButton>
  );

  const showClear = clearable && current !== null && !blocked;
  const clearButton = showClear && (
    <IconButton
      size="small"
      aria-label="Limpiar"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        control.markChanged();
        setDraft("");
        emit(null);
      }}
      sx={{ color: "var(--cn-color-neutral-500, #6e7682)" }}
    >
      <ClearIcon fontSize="small" />
    </IconButton>
  );

  const start =
    controls === "split" ? (
      <InputAdornment position="start" sx={{ mr: "4px" }}>
        {decrementButton(splitButtonSx, <RemoveIcon fontSize="small" />)}
        {(startAdornment || prefix) && <Box sx={{ ml: "8px" }}>{startAdornment ?? prefix}</Box>}
      </InputAdornment>
    ) : (
      (startAdornment ??
      (prefix ? <InputAdornment position="start">{prefix}</InputAdornment> : undefined))
    );

  const hasEnd = Boolean(suffix || endAdornment || showClear || controls !== "none");
  const end = hasEnd ? (
    <InputAdornment
      position="end"
      sx={{ gap: "2px", ml: "4px", height: "auto", maxHeight: "none", alignSelf: "stretch" }}
    >
      {suffix && (
        <Box
          component="span"
          sx={{ alignSelf: "center", color: "var(--cn-color-text-muted, #6e7682)" }}
        >
          {suffix}
        </Box>
      )}
      {endAdornment}
      {clearButton && <Box sx={{ alignSelf: "center" }}>{clearButton}</Box>}
      {controls === "inline" && (
        <Box sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
          {decrementButton({}, <RemoveIcon fontSize="small" />)}
          {incrementButton({}, <AddIcon fontSize="small" />)}
        </Box>
      )}
      {controls === "split" && (
        <Box sx={{ alignSelf: "center" }}>
          {incrementButton(splitButtonSx, <AddIcon fontSize="small" />)}
        </Box>
      )}
      {controls === "stacked" && (
        <Box
          data-cn-number-stepper
          sx={{
            display: "flex",
            flexDirection: "column",
            alignSelf: "stretch",
            mr: "-14px",
            ml: "4px",
            borderLeft: "1px solid var(--cn-color-border, #dde0e4)",
            "& > *:first-of-type": { borderBottom: "1px solid var(--cn-color-border, #dde0e4)" },
            opacity: blocked ? 0.5 : 1,
          }}
        >
          {incrementButton(
            { ...stackedButtonSx, borderTopRightRadius: "var(--cn-radius-md, 8px)" },
            <KeyboardArrowUpIcon />,
          )}
          {decrementButton(
            { ...stackedButtonSx, borderBottomRightRadius: "var(--cn-radius-md, 8px)" },
            <KeyboardArrowDownIcon />,
          )}
        </Box>
      )}
    </InputAdornment>
  ) : undefined;

  const resolvedAlign = textAlign ?? (controls === "split" ? "center" : "left");

  return (
    <TextField
      ref={ref}
      id={control.id}
      name={name}
      label={label}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      error={control.error}
      helperText={control.helperText}
      value={draft}
      autoFocus={autoFocus}
      fullWidth
      size={MUI_FIELD_SIZE[size]}
      className={className}
      data-cn-number-field={controls}
      onFocus={(event) => {
        setFocused(true);
        // Al enfocar se muestra el número sin formato para editarlo cómodamente.
        if (current !== null) setDraft(String(current));
        if (autoSelect) event.target.select();
      }}
      onChange={(event) => {
        const sanitized = sanitizeNumericInput(event.target.value, {
          allowNegative: negativeAllowed,
          decimals,
        });
        setDraft(sanitized);
        control.markChanged();
        const parsed = parseNumericInput(sanitized);
        if (parsed !== current) emit(parsed);
      }}
      onBlur={() => {
        setFocused(false);
        let next = parseNumericInput(draft);
        if (next === null && !allowEmpty) next = min ?? 0;
        if (next !== null && snapToStep) {
          const origin = min ?? 0;
          next = origin + Math.round((next - origin) / step) * step;
          next = roundTo(next, Math.max(countDecimals(step), countDecimals(origin)));
        }
        if (next !== null && clampOnBlur) next = clampNumber(next, min, max);
        if (next !== null && decimals !== undefined) next = roundTo(next, decimals);
        if (next !== current) emit(next);
        setDraft(display(next));
        control.markBlurred();
        onBlur?.();
      }}
      slotProps={{
        input: {
          readOnly,
          startAdornment: start,
          endAdornment: end,
        },
        htmlInput: {
          ref: inputRef,
          inputMode:
            decimals === 0 ||
            (decimals === undefined && Number.isInteger(step) && min !== undefined && min >= 0)
              ? "numeric"
              : "decimal",
          onKeyDown: handleKeyDown,
          role: "spinbutton",
          "aria-valuemin": min,
          "aria-valuemax": max,
          "aria-valuenow": current ?? undefined,
          "aria-valuetext": current !== null ? display(current) : undefined,
          "aria-invalid": control.error || undefined,
          autoComplete: "off",
          style: { textAlign: resolvedAlign, fontVariantNumeric: "tabular-nums" },
        },
      }}
      sx={mergeSx(
        {
          ...getOutlinedFieldSx(size),
          "& .MuiOutlinedInput-root": {
            ...(getOutlinedFieldSx(size)["& .MuiOutlinedInput-root"] as object),
            ...(controls === "stacked" && { overflow: "hidden" }),
          },
        },
        sx,
      )}
    />
  );
});

/** Botón grande de cantidad para catálogos ("− 2 +"). Atajo de `controls="split"`. */
export const CnQuantityField = forwardRef<HTMLDivElement, Omit<CnNumberFieldProps, "controls">>(
  function CnQuantityField({ min = 0, step = 1, decimals = 0, ...props }, ref) {
    return (
      <CnNumberField
        ref={ref}
        {...props}
        min={min}
        step={step}
        decimals={decimals}
        controls="split"
        allowEmpty={false}
      />
    );
  },
);

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Popover from "@mui/material/Popover";
import TextField from "@mui/material/TextField";
import type { KeyboardEvent } from "react";
import { forwardRef, useCallback, useMemo, useRef, useState } from "react";
import type { CnDateDisplayFormat, CnWeekday } from "../../utils/date-utils";
import {
  applyDateMask,
  formatIsoForInput,
  getInputPattern,
  isValidIsoValue,
  pad2,
  parseIsoTime,
  parseMaskedInput,
  patternToPlaceholder,
  toIsoDate,
} from "../../utils/date-utils";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useDraftValue, useFieldControl } from "../../utils/field-control";
import { getOutlinedFieldSx, mergeSx, MUI_FIELD_SIZE } from "../../utils/field-styles";
import { CnButton } from "../CnButton";
import type { CnCalendarDisableOptions, CnCalendarView } from "../CnCalendar";
import { CnCalendar, isDateDisabled } from "../CnCalendar";
import type { CnValidationRule } from "../CnForm/CnForm.types";
import { CnTimePanel } from "./CnTimePanel";

export type CnDateFieldType = "date" | "time" | "datetime" | "month";

export type CnDateFieldProps = CnFieldBaseProps<string> &
  Omit<CnCalendarDisableOptions, "min" | "max"> & {
    /**
     * Formato del valor (siempre string ISO local, serializable y sin zona horaria):
     * - `date` → `YYYY-MM-DD`
     * - `time` → `HH:mm`
     * - `datetime` → `YYYY-MM-DDTHH:mm`
     * - `month` → `YYYY-MM`
     *
     * Si el usuario escribe una fecha incompleta o inválida se emite el texto tal
     * cual, para que la validación pueda marcarlo.
     */
    type?: CnDateFieldType;
    /** Mismo formato que el valor; también acepta `Date`. */
    min?: string | Date;
    max?: string | Date;
    /** Formato visible al escribir. Por defecto `DD/MM/YYYY`. */
    format?: CnDateDisplayFormat;
    locale?: string;
    weekStartsOn?: CnWeekday;
    /** Reloj de 12 horas. */
    ampm?: boolean;
    minutesStep?: number;
    /** @deprecated Usa `minutesStep`. Paso en segundos (compatibilidad). */
    step?: number;
    shouldDisableTime?: (time: string) => boolean;
    /** Vistas del calendario (p. ej. `["year", "month", "day"]`). */
    views?: CnCalendarView[];
    openTo?: CnCalendarView;
    highlightedDates?: string[];
    showWeekNumbers?: boolean;
    placeholder?: string;
    clearable?: boolean;
    /** Muestra el botón "Hoy" / "Ahora". */
    showTodayButton?: boolean;
    /** Cierra el selector al elegir una fecha (date / month). */
    closeOnSelect?: boolean;
    autoFocus?: boolean;
  };

const pad = pad2;

const toIsoBound = (
  bound: string | Date | undefined,
  type: CnDateFieldType,
): string | undefined => {
  if (!bound) return undefined;
  if (typeof bound === "string") return bound;
  const ymd = toIsoDate(bound);
  const hm = `${pad(bound.getHours())}:${pad(bound.getMinutes())}`;
  if (type === "time") return hm;
  if (type === "datetime") return `${ymd}T${hm}`;
  if (type === "month") return ymd.slice(0, 7);
  return ymd;
};

export const toLocalIsoValue = (date: Date, type: CnDateFieldType): string =>
  toIsoBound(date, type) as string;

const maxBound = (a?: string, b?: string): string | undefined => (!a ? b : !b ? a : a > b ? a : b);
const minBound = (a?: string, b?: string): string | undefined => (!a ? b : !b ? a : a < b ? a : b);

export type CnDateRangeOptions = {
  type?: CnDateFieldType;
  min?: string | Date;
  max?: string | Date;
  disablePast?: boolean;
  disableFuture?: boolean;
  format?: CnDateDisplayFormat;
  ampm?: boolean;
};

/** Límites efectivos combinando `min`/`max` con `disablePast`/`disableFuture`. */
export const resolveDateBounds = ({
  type = "date",
  min,
  max,
  disablePast,
  disableFuture,
}: CnDateRangeOptions): { minValue?: string; maxValue?: string } => {
  const now = toLocalIsoValue(new Date(), type);
  // En "datetime" el día de hoy completo cuenta como válido.
  const today = now.slice(0, 10);
  return {
    minValue: maxBound(
      toIsoBound(min, type),
      disablePast ? (type === "datetime" ? `${today}T00:00` : now) : undefined,
    ),
    maxValue: minBound(
      toIsoBound(max, type),
      disableFuture ? (type === "datetime" ? `${today}T23:59` : now) : undefined,
    ),
  };
};

/**
 * Reglas de formato y rango reutilizables (también las usa `CnForm`). Las
 * cadenas ISO del mismo tipo se comparan lexicográficamente, sin zonas horarias.
 */
export const buildDateRangeRules = (options: CnDateRangeOptions): CnValidationRule[] => {
  const type = options.type ?? "date";
  const format = options.format ?? "DD/MM/YYYY";
  const ampm = options.ampm ?? false;
  const { minValue, maxValue } = resolveDateBounds(options);
  const placeholder = patternToPlaceholder(getInputPattern(type, format, ampm));
  const valid = (v: unknown) => typeof v === "string" && isValidIsoValue(v, type);
  const describe = (bound: string) => formatIsoForInput(bound, type, format, ampm);
  const list: CnValidationRule[] = [
    {
      type: "custom",
      message: `${type === "time" ? "Hora" : "Fecha"} no válida. Formato: ${placeholder}`,
      validate: (v) => !v || valid(v),
    },
  ];
  if (minValue) {
    list.push({
      type: "custom",
      message: `Debe ser igual o posterior a ${describe(minValue)}`,
      validate: (v) => !v || !valid(v) || String(v) >= minValue,
    });
  }
  if (maxValue) {
    list.push({
      type: "custom",
      message: `Debe ser igual o anterior a ${describe(maxValue)}`,
      validate: (v) => !v || !valid(v) || String(v) <= maxValue,
    });
  }
  return list;
};

const digitsOf = (text: string) => text.replace(/\D/g, "");

/** Aplica la máscara y permite borrar aunque el cursor esté sobre un separador. */
const nextMasked = (previous: string, raw: string, pattern: string): string => {
  const deleting = raw.length < previous.length;
  if (deleting && digitsOf(raw) === digitsOf(previous)) {
    if (pattern.endsWith("aa") && /[ap]\.\s?m\.?$/i.test(previous)) {
      return previous.replace(/\s?[ap]\.\s?m\.?$/i, "");
    }
    return applyDateMask(digitsOf(raw).slice(0, -1), pattern);
  }
  return applyDateMask(raw, pattern);
};

const popoverPaperSx = {
  mt: "4px",
  fontFamily: "var(--cn-font-sans, inherit)",
  "& .MuiButtonBase-root": { fontFamily: "inherit" },
  borderRadius: "var(--cn-radius-lg, 12px)",
  border: "1px solid var(--cn-color-border, #dde0e4)",
  boxShadow: "0 12px 32px rgba(17, 20, 24, 0.12)",
  maxWidth: "calc(100vw - 16px)",
};

/**
 * Campo de fecha/hora con captura enmascarada (se puede escribir) y selector
 * propio: calendario accesible, vistas de mes/año, panel de hora, botón "Hoy",
 * fechas deshabilitadas y validación de formato y rango.
 */
export const CnDateField = forwardRef<HTMLDivElement, CnDateFieldProps>(function CnDateField(
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
    type = "date",
    min,
    max,
    disablePast = false,
    disableFuture = false,
    disableWeekends,
    disabledDays,
    disabledDates,
    shouldDisableDate,
    format = "DD/MM/YYYY",
    locale = "es-MX",
    weekStartsOn = 1,
    ampm = false,
    minutesStep,
    step,
    shouldDisableTime,
    views,
    openTo,
    highlightedDates,
    showWeekNumbers,
    placeholder,
    clearable = false,
    showTodayButton = true,
    closeOnSelect = true,
    autoFocus,
  },
  ref,
) {
  const isControlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const current = (isControlled ? value : uncontrolled) ?? "";
  const pattern = getInputPattern(type, format, ampm);
  const toDraft = useCallback(
    (v: string) => formatIsoForInput(v ?? "", type, format, ampm),
    [ampm, format, type],
  );
  const [draft, setDraft, markEmitted] = useDraftValue<string>(current, toDraft);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const effectiveStep = minutesStep ?? (step ? Math.max(1, Math.round(step / 60)) : 5);

  const { minValue, maxValue } = useMemo(
    () => resolveDateBounds({ type, min, max, disablePast, disableFuture }),
    [disableFuture, disablePast, max, min, type],
  );

  const rangeRules = useMemo(
    () => buildDateRangeRules({ type, min, max, disablePast, disableFuture, format, ampm }),
    [ampm, disableFuture, disablePast, format, max, min, type],
  );

  const disableOptions: CnCalendarDisableOptions = useMemo(
    () => ({
      min:
        minValue && type !== "time"
          ? type === "month"
            ? `${minValue}-01`
            : minValue.slice(0, 10)
          : undefined,
      max:
        maxValue && type !== "time"
          ? type === "month"
            ? `${maxValue}-31`
            : maxValue.slice(0, 10)
          : undefined,
      disableWeekends,
      disabledDays,
      disabledDates,
      shouldDisableDate,
    }),
    [disableWeekends, disabledDates, disabledDays, maxValue, minValue, shouldDisableDate, type],
  );

  const control = useFieldControl(current, {
    id,
    rules: [...(rules ?? []), ...rangeRules],
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

  const emit = useCallback(
    (next: string) => {
      markEmitted(next);
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, markEmitted, onChange],
  );

  /** Emite un valor elegido en el selector y actualiza el texto visible. */
  const pick = (iso: string) => {
    control.markChanged();
    setDraft(toDraft(iso));
    emit(iso);
  };

  const blocked = Boolean(disabled || readOnly);
  const openPicker = () => {
    if (!blocked) setOpen(true);
  };
  const closePicker = () => {
    setOpen(false);
    control.markBlurred();
    onBlur?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "ArrowDown" && event.altKey) {
      event.preventDefault();
      openPicker();
    }
  };

  // ─── Valores derivados para el selector ──────────────────────────────
  const validCurrent = isValidIsoValue(current, type) ? current : "";
  const datePart =
    type === "month" ? (validCurrent ? `${validCurrent}-01` : "") : validCurrent.slice(0, 10);
  const timePart =
    type === "time" ? validCurrent : type === "datetime" ? validCurrent.slice(11, 16) : "";

  const timeBounds = useMemo(() => {
    if (type === "time") return { minTime: minValue, maxTime: maxValue };
    if (type !== "datetime" || !datePart) return {};
    return {
      minTime: minValue && minValue.slice(0, 10) === datePart ? minValue.slice(11, 16) : undefined,
      maxTime: maxValue && maxValue.slice(0, 10) === datePart ? maxValue.slice(11, 16) : undefined,
    };
  }, [datePart, maxValue, minValue, type]);

  const handleCalendarChange = (iso: string) => {
    if (type === "month") {
      pick(iso.slice(0, 7));
      if (closeOnSelect) closePicker();
      return;
    }
    if (type === "datetime") {
      let time = timePart || "09:00";
      if (minValue?.slice(0, 10) === iso && `${iso}T${time}` < minValue)
        time = minValue.slice(11, 16);
      if (maxValue?.slice(0, 10) === iso && `${iso}T${time}` > maxValue)
        time = maxValue.slice(11, 16);
      pick(`${iso}T${time}`);
      return;
    }
    pick(iso);
    if (closeOnSelect) closePicker();
  };

  const handleTimeChange = (time: string) => {
    pick(type === "time" ? time : `${datePart || toIsoDate(new Date())}T${time}`);
  };

  const now = new Date();
  const roundedNow = `${pad(now.getHours())}:${pad(Math.floor(now.getMinutes() / effectiveStep) * effectiveStep)}`;
  const todayDisabled =
    type !== "time" &&
    isDateDisabled(
      type === "month" ? new Date(now.getFullYear(), now.getMonth(), 1) : now,
      disableOptions,
    );
  const handleToday = () => {
    if (type === "datetime") pick(`${toIsoDate(now)}T${roundedNow}`);
    else if (type === "time") pick(roundedNow);
    else pick(toLocalIsoValue(now, type));
    if (type !== "datetime" && type !== "time" && closeOnSelect) closePicker();
  };

  const showClear = clearable && Boolean(draft) && !blocked;
  const PickerIcon = type === "time" ? AccessTimeIcon : CalendarMonthOutlinedIcon;
  const pickerLabel =
    type === "time" ? "Elegir hora" : type === "month" ? "Elegir mes" : "Elegir fecha";
  const parsedTime = parseIsoTime(timePart);

  return (
    <>
      <TextField
        ref={(node: HTMLDivElement | null) => {
          anchorRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        id={control.id}
        name={name}
        label={label}
        placeholder={placeholder ?? patternToPlaceholder(pattern)}
        value={draft}
        onChange={(event) => {
          const masked = nextMasked(draft, event.target.value, pattern);
          setDraft(masked);
          control.markChanged();
          emit(masked ? (parseMaskedInput(masked, type, format, ampm) ?? masked) : "");
        }}
        onBlur={() => {
          // Abrir el selector no cuenta como abandonar el campo.
          if (open) return;
          control.markBlurred();
          onBlur?.();
        }}
        required={required}
        disabled={disabled}
        error={control.error}
        helperText={control.helperText}
        autoFocus={autoFocus}
        fullWidth
        size={MUI_FIELD_SIZE[size]}
        className={className}
        data-cn-date-field={type}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            readOnly,
            endAdornment: (
              <InputAdornment position="end" sx={{ gap: "2px" }}>
                {showClear && (
                  <IconButton
                    size="small"
                    aria-label="Limpiar fecha"
                    onClick={() => {
                      control.markChanged();
                      setDraft("");
                      emit("");
                    }}
                    sx={{ color: "var(--cn-color-neutral-500, #6e7682)" }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  edge="end"
                  aria-label={pickerLabel}
                  aria-haspopup="dialog"
                  aria-expanded={open}
                  disabled={blocked}
                  onClick={openPicker}
                  sx={{
                    color: open
                      ? "var(--cn-color-brand-600, #254d87)"
                      : "var(--cn-color-neutral-500, #6e7682)",
                  }}
                >
                  <PickerIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
          htmlInput: {
            inputMode: "numeric",
            autoComplete: "off",
            onKeyDown: handleKeyDown,
            maxLength: pattern.length + 4,
            "aria-invalid": control.error || undefined,
          },
        }}
        sx={mergeSx(getOutlinedFieldSx(size), sx)}
      />
      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={closePicker}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            role: "dialog",
            "aria-label": label ? `${pickerLabel}: ${label}` : pickerLabel,
            "data-cn-date-picker": type,
            sx: popoverPaperSx,
          } as Record<string, unknown>,
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "stretch" }}>
          {type !== "time" && (
            <CnCalendar
              value={datePart || null}
              onChange={handleCalendarChange}
              views={views ?? (type === "month" ? ["month", "year"] : ["day", "month", "year"])}
              openTo={openTo ?? (type === "month" ? "month" : "day")}
              locale={locale}
              weekStartsOn={weekStartsOn}
              highlightedDates={highlightedDates}
              showWeekNumbers={showWeekNumbers}
              autoFocus
              {...disableOptions}
            />
          )}
          {(type === "time" || type === "datetime") && (
            <>
              {type === "datetime" && <Divider orientation="vertical" flexItem />}
              <Box sx={{ display: "flex", flexDirection: "column", p: "8px" }}>
                <Box
                  aria-live="polite"
                  sx={{
                    textAlign: "center",
                    fontSize: "var(--cn-font-size-md, 14px)",
                    fontWeight: 600,
                    minHeight: 36,
                    lineHeight: "36px",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {parsedTime
                    ? formatIsoForInput(
                        `${pad(parsedTime.hours)}:${pad(parsedTime.minutes)}`,
                        "time",
                        format,
                        ampm,
                      )
                    : "--:--"}
                </Box>
                <CnTimePanel
                  value={timePart}
                  onChange={handleTimeChange}
                  minutesStep={effectiveStep}
                  ampm={ampm}
                  minTime={timeBounds.minTime}
                  maxTime={timeBounds.maxTime}
                  shouldDisableTime={shouldDisableTime}
                />
              </Box>
            </>
          )}
        </Box>
        <Divider />
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: "8px", p: "8px" }}>
          <Box sx={{ display: "flex", gap: "4px" }}>
            {showTodayButton && (
              <CnButton
                size="small"
                variant="text"
                color="primary"
                onClick={handleToday}
                disabled={todayDisabled}
              >
                {type === "time" || type === "datetime"
                  ? "Ahora"
                  : type === "month"
                    ? "Este mes"
                    : "Hoy"}
              </CnButton>
            )}
            {!required && current && (
              <CnButton
                size="small"
                variant="text"
                color="neutral"
                onClick={() => {
                  pick("");
                  closePicker();
                }}
              >
                Limpiar
              </CnButton>
            )}
          </Box>
          <CnButton size="small" variant="contained" color="primary" onClick={closePicker}>
            Listo
          </CnButton>
        </Box>
      </Popover>
    </>
  );
});

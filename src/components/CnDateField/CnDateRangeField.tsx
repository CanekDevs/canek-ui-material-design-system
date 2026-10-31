import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Popover from "@mui/material/Popover";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { Ref } from "react";
import { forwardRef, useMemo, useRef, useState } from "react";
import type { CnDateDisplayFormat, CnWeekday } from "../../utils/date-utils";
import {
  addDays,
  applyDateMask,
  endOfMonth,
  formatIsoForInput,
  getInputPattern,
  isValidIsoValue,
  parseIsoDate,
  parseMaskedInput,
  patternToPlaceholder,
  startOfMonth,
  startOfWeek,
  toIsoDate,
} from "../../utils/date-utils";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useFieldControl } from "../../utils/field-control";
import {
  getOutlinedFieldSx,
  groupLegendSx,
  helperTextSx,
  mergeSx,
  MUI_FIELD_SIZE,
} from "../../utils/field-styles";
import { CnButton } from "../CnButton";
import type { CnCalendarDisableOptions, CnCalendarRange } from "../CnCalendar";
import { CnCalendar } from "../CnCalendar";
import type { CnValidationRule } from "../CnForm/CnForm.types";

/** `[desde, hasta]` en `YYYY-MM-DD`; `""` cuando falta un extremo. */
export type CnDateRangeValue = [string, string];

export type CnDateRangePreset = {
  label: string;
  /** Devuelve el rango a aplicar (se evalúa al hacer clic). */
  getValue: () => CnDateRangeValue;
};

export type CnDateRangeFieldProps = CnFieldBaseProps<CnDateRangeValue> &
  CnCalendarDisableOptions & {
    startLabel?: string;
    endLabel?: string;
    format?: CnDateDisplayFormat;
    locale?: string;
    weekStartsOn?: CnWeekday;
    disablePast?: boolean;
    disableFuture?: boolean;
    /** Duración máxima del rango en días (inclusive). */
    maxDays?: number;
    /** `true` usa los atajos por defecto; o una lista propia; `false` los oculta. */
    presets?: boolean | CnDateRangePreset[];
    highlightedDates?: string[];
  };

const EMPTY: CnDateRangeValue = ["", ""];

export const DEFAULT_DATE_RANGE_PRESETS: CnDateRangePreset[] = [
  { label: "Hoy", getValue: () => [toIsoDate(new Date()), toIsoDate(new Date())] },
  {
    label: "Últimos 7 días",
    getValue: () => [toIsoDate(addDays(new Date(), -6)), toIsoDate(new Date())],
  },
  {
    label: "Últimos 30 días",
    getValue: () => [toIsoDate(addDays(new Date(), -29)), toIsoDate(new Date())],
  },
  {
    label: "Esta semana",
    getValue: () => {
      const start = startOfWeek(new Date(), 1);
      return [toIsoDate(start), toIsoDate(addDays(start, 6))];
    },
  },
  {
    label: "Este mes",
    getValue: () => [toIsoDate(startOfMonth(new Date())), toIsoDate(endOfMonth(new Date()))],
  },
  {
    label: "Mes pasado",
    getValue: () => {
      const now = new Date();
      const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return [toIsoDate(previous), toIsoDate(endOfMonth(previous))];
    },
  },
];

const dayDiff = (start: string, end: string): number => {
  const a = parseIsoDate(start);
  const b = parseIsoDate(end);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
};

/** Reglas del rango (formato, orden, requerido y duración). También las usa `CnForm`. */
export const buildDateRangeValueRules = ({
  required,
  maxDays,
  min,
  max,
}: {
  required?: boolean;
  maxDays?: number;
  min?: string;
  max?: string;
}): CnValidationRule[] => {
  const parts = (v: unknown): CnDateRangeValue =>
    Array.isArray(v) ? [String(v[0] ?? ""), String(v[1] ?? "")] : EMPTY;
  const list: CnValidationRule[] = [
    {
      type: "custom",
      message: "Fecha no válida. Formato: DD/MM/AAAA",
      validate: (v) => parts(v).every((part) => !part || isValidIsoValue(part, "date")),
    },
    {
      type: "custom",
      message: "La fecha final debe ser igual o posterior a la inicial",
      validate: (v) => {
        const [start, end] = parts(v);
        return !start || !end || start <= end;
      },
    },
  ];
  if (required) {
    list.unshift({
      type: "custom",
      message: "Selecciona la fecha inicial y la final",
      validate: (v) => parts(v).every(Boolean),
    });
  }
  if (min) {
    list.push({
      type: "custom",
      message: `Debe iniciar el ${formatIsoForInput(min, "date")} o después`,
      validate: (v) => !parts(v)[0] || parts(v)[0] >= min,
    });
  }
  if (max) {
    list.push({
      type: "custom",
      message: `Debe terminar el ${formatIsoForInput(max, "date")} o antes`,
      validate: (v) => !parts(v)[1] || parts(v)[1] <= max,
    });
  }
  if (maxDays) {
    list.push({
      type: "custom",
      message: `El rango no puede superar ${maxDays} días`,
      validate: (v) => {
        const [start, end] = parts(v);
        return !start || !end || dayDiff(start, end) <= maxDays;
      },
    });
  }
  return list;
};

export const CnDateRangeField = forwardRef<HTMLDivElement, CnDateRangeFieldProps>(
  function CnDateRangeField(
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
      startLabel = "Desde",
      endLabel = "Hasta",
      format = "DD/MM/YYYY",
      locale = "es-MX",
      weekStartsOn = 1,
      min,
      max,
      disablePast,
      disableFuture,
      disableWeekends,
      disabledDays,
      disabledDates,
      shouldDisableDate,
      maxDays,
      presets = true,
      highlightedDates,
    },
    ref,
  ) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isControlled = value !== undefined;
    const [uncontrolled, setUncontrolled] = useState<CnDateRangeValue>(defaultValue ?? EMPTY);
    const current: CnDateRangeValue = (isControlled ? value : uncontrolled) ?? EMPTY;
    const [drafts, setDrafts] = useState<[string | null, string | null]>([null, null]);
    const [open, setOpen] = useState(false);
    const anchorRef = useRef<HTMLDivElement | null>(null);
    const pattern = getInputPattern("date", format);
    const today = toIsoDate(new Date());
    const minBound = [min, disablePast ? today : undefined].filter(Boolean).sort().pop();
    const maxBound = [max, disableFuture ? today : undefined].filter(Boolean).sort()[0];

    const builtInRules = useMemo(
      () => buildDateRangeValueRules({ required, maxDays, min: minBound, max: maxBound }),
      [maxBound, maxDays, minBound, required],
    );

    const control = useFieldControl(current, {
      id,
      rules: [...(rules ?? []), ...builtInRules],
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

    const emit = (next: CnDateRangeValue) => {
      control.markChanged();
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    };

    const blocked = Boolean(disabled || readOnly);
    const closePicker = () => {
      setOpen(false);
      control.markBlurred();
      onBlur?.();
    };

    const presetList = presets === true ? DEFAULT_DATE_RANGE_PRESETS : presets || [];

    const displayFor = (index: 0 | 1) =>
      drafts[index] ?? formatIsoForInput(current[index], "date", format);

    const renderInput = (index: 0 | 1) => (
      <TextField
        id={index === 0 ? control.id : `${control.id}-end`}
        name={name ? `${name}[${index}]` : undefined}
        label={index === 0 ? startLabel : endLabel}
        placeholder={patternToPlaceholder(pattern)}
        value={displayFor(index)}
        disabled={disabled}
        required={required}
        error={control.error}
        size={MUI_FIELD_SIZE[size]}
        fullWidth
        onChange={(event) => {
          const masked = applyDateMask(event.target.value, pattern);
          const nextDrafts: [string | null, string | null] = [...drafts];
          nextDrafts[index] = masked;
          setDrafts(nextDrafts);
          const next: CnDateRangeValue = [...current];
          next[index] = masked ? (parseMaskedInput(masked, "date", format) ?? masked) : "";
          emit(next);
        }}
        onBlur={() => {
          setDrafts([null, null]);
          if (!open) {
            control.markBlurred();
            onBlur?.();
          }
        }}
        slotProps={{
          inputLabel: { shrink: true },
          input: { readOnly },
          htmlInput: {
            inputMode: "numeric",
            autoComplete: "off",
            "aria-describedby": control.helperText ? control.helperId : undefined,
            "aria-invalid": control.error || undefined,
          },
        }}
        sx={getOutlinedFieldSx(size)}
      />
    );

    const calendarValue: CnCalendarRange = [
      isValidIsoValue(current[0], "date") ? current[0] : null,
      isValidIsoValue(current[1], "date") ? current[1] : null,
    ];

    return (
      <FormControl
        ref={ref as Ref<HTMLFieldSetElement>}
        component="fieldset"
        fullWidth
        error={control.error}
        disabled={disabled}
        className={className}
        data-cn-date-range-field
        sx={mergeSx({ minWidth: 0, border: 0, p: 0, m: 0 }, sx)}
      >
        {label && (
          <FormLabel component="legend" sx={groupLegendSx}>
            {label}
          </FormLabel>
        )}
        <Box ref={anchorRef} sx={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          {renderInput(0)}
          <Box
            aria-hidden
            sx={{ alignSelf: "center", color: "var(--cn-color-text-subtle, #9aa1aa)" }}
          >
            –
          </Box>
          {renderInput(1)}
          <InputAdornment position="end" sx={{ alignSelf: "center", ml: 0 }}>
            <IconButton
              aria-label="Elegir rango de fechas"
              aria-haspopup="dialog"
              aria-expanded={open}
              disabled={blocked}
              onClick={() => setOpen(true)}
              sx={{
                color: open
                  ? "var(--cn-color-brand-600, #254d87)"
                  : "var(--cn-color-neutral-500, #6e7682)",
              }}
            >
              <CalendarMonthOutlinedIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        </Box>
        {control.helperText && (
          <FormHelperText id={control.helperId} sx={helperTextSx}>
            {control.helperText}
          </FormHelperText>
        )}
        <Popover
          open={open}
          anchorEl={anchorRef.current}
          onClose={closePicker}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          slotProps={{
            paper: {
              role: "dialog",
              "aria-label": label ? `Elegir rango: ${label}` : "Elegir rango de fechas",
              sx: {
                mt: "4px",
                fontFamily: "var(--cn-font-sans, inherit)",
                "& .MuiButtonBase-root": { fontFamily: "inherit" },
                borderRadius: "var(--cn-radius-lg, 12px)",
                border: "1px solid var(--cn-color-border, #dde0e4)",
                boxShadow: "0 12px 32px rgba(17, 20, 24, 0.12)",
                maxWidth: "calc(100vw - 16px)",
              },
            } as Record<string, unknown>,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: isMobile ? "column" : "row" }}>
            {presetList.length > 0 && (
              <>
                <Box
                  role="group"
                  aria-label="Atajos"
                  sx={{
                    display: "flex",
                    flexDirection: isMobile ? "row" : "column",
                    flexWrap: isMobile ? "wrap" : "nowrap",
                    gap: "2px",
                    p: "8px",
                    minWidth: isMobile ? undefined : 150,
                  }}
                >
                  {presetList.map((preset) => (
                    <ButtonBase
                      key={preset.label}
                      onClick={() => {
                        emit(preset.getValue());
                        closePicker();
                      }}
                      sx={{
                        justifyContent: "flex-start",
                        px: "10px",
                        py: "6px",
                        borderRadius: "var(--cn-radius-sm, 6px)",
                        fontSize: "var(--cn-font-size-sm, 12px)",
                        color: "var(--cn-color-text, #222831)",
                        "&:hover": { backgroundColor: "var(--cn-color-brand-50, #eef3fb)" },
                        "&.Mui-focusVisible": {
                          outline: "2px solid var(--cn-color-brand-400, #5081c4)",
                        },
                      }}
                    >
                      {preset.label}
                    </ButtonBase>
                  ))}
                </Box>
                <Divider orientation={isMobile ? "horizontal" : "vertical"} flexItem />
              </>
            )}
            <CnCalendar
              mode="range"
              value={calendarValue}
              onChange={(next) => emit([next[0] ?? "", next[1] ?? ""])}
              months={isMobile ? 1 : 2}
              locale={locale}
              weekStartsOn={weekStartsOn}
              highlightedDates={highlightedDates}
              min={minBound}
              max={maxBound}
              disableWeekends={disableWeekends}
              disabledDays={disabledDays}
              disabledDates={disabledDates}
              shouldDisableDate={shouldDisableDate}
              autoFocus
            />
          </Box>
          <Divider />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
              p: "8px",
            }}
          >
            <Box
              component="span"
              sx={{
                fontSize: "var(--cn-font-size-xs, 11px)",
                color: "var(--cn-color-text-muted, #6e7682)",
              }}
            >
              {calendarValue[0] && calendarValue[1]
                ? `${dayDiff(calendarValue[0], calendarValue[1])} días`
                : calendarValue[0]
                  ? "Elige la fecha final"
                  : "Elige la fecha inicial"}
            </Box>
            <Box sx={{ display: "flex", gap: "4px" }}>
              {(current[0] || current[1]) && (
                <CnButton
                  size="small"
                  variant="text"
                  color="neutral"
                  onClick={() => emit(["", ""])}
                >
                  Limpiar
                </CnButton>
              )}
              <CnButton size="small" variant="contained" onClick={closePicker}>
                Listo
              </CnButton>
            </Box>
          </Box>
        </Popover>
      </FormControl>
    );
  },
);

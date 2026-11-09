import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import type { KeyboardEvent } from "react";
import { forwardRef, useRef } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import type { CnFieldSize } from "../../utils/field-styles";
import { groupLegendSx, helperTextSx, mergeSx } from "../../utils/field-styles";
import { orderedWeekdays } from "../../utils/time-utils";
import type { CnValidationRule } from "../CnForm/CnForm.types";
import { CnWeekdaysFieldSkeleton } from "./CnWeekdaysFieldSkeleton";

/** Días elegidos: 0 = domingo … 6 = sábado (igual que `Date#getDay`). */
export type CnWeekdaysValue = number[];

export type CnWeekdaysPreset = { label: string; days: number[] };

export type CnWeekdaysFieldProps = CnFieldBaseProps<CnWeekdaysValue> & {
  /** Primer día mostrado: 1 = lunes (por defecto) o 0 = domingo. */
  weekStart?: 0 | 1;
  /** Texto de cada botón: inicial (`L`), abreviatura (`Lun`) o nombre completo. */
  dayFormat?: "initial" | "short" | "long";
  /**
   * Atajos bajo los días. `true` (por defecto) = laborables, fin de semana y
   * todos; `false` los oculta; o una lista propia.
   */
  presets?: boolean | CnWeekdaysPreset[];
  /** Mínimo y máximo de días elegibles. */
  minDays?: number;
  maxDays?: number;
  /** Días que no se pueden elegir. */
  disabledDays?: number[];
  /** Muestra el skeleton del campo (mismas variantes) en lugar del campo. */
  skeleton?: boolean;
};

export const DEFAULT_WEEKDAY_PRESETS: CnWeekdaysPreset[] = [
  { label: "Laborables", days: [1, 2, 3, 4, 5] },
  { label: "Fin de semana", days: [6, 0] },
  { label: "Todos", days: [0, 1, 2, 3, 4, 5, 6] },
];

const DAY_SIZES: Record<CnFieldSize, number> = { sm: 32, md: 38, lg: 46 };

const normalizeDays = (value: unknown): number[] =>
  Array.isArray(value)
    ? [...new Set(value.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort(
        (a, b) => a - b,
      )
    : [];

/** Reglas implícitas: mínimo/máximo de días y requerido. */
export const buildWeekdaysRules = ({
  required,
  minDays,
  maxDays,
}: {
  required?: boolean;
  minDays?: number;
  maxDays?: number;
}): CnValidationRule[] => {
  const rules: CnValidationRule[] = [];
  if (required) {
    rules.push({
      type: "custom",
      message: "Elige al menos un día",
      validate: (v) => normalizeDays(v).length > 0,
    });
  }
  if (minDays !== undefined) {
    rules.push({
      type: "custom",
      message: `Elige al menos ${minDays} ${minDays === 1 ? "día" : "días"}`,
      validate: (v) => normalizeDays(v).length === 0 || normalizeDays(v).length >= minDays,
    });
  }
  if (maxDays !== undefined) {
    rules.push({
      type: "custom",
      message: `Elige como máximo ${maxDays} ${maxDays === 1 ? "día" : "días"}`,
      validate: (v) => normalizeDays(v).length <= maxDays,
    });
  }
  return rules;
};

const sameDays = (a: number[], b: number[]) =>
  a.length === b.length && normalizeDays(a).every((d, i) => d === normalizeDays(b)[i]);

/** Selector de días de la semana (horarios, recurrencias, disponibilidad…). */
export const CnWeekdaysField = forwardRef<HTMLFieldSetElement, CnWeekdaysFieldProps>(
  function CnWeekdaysField(
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
      weekStart = 1,
      dayFormat = "initial",
      presets = true,
      minDays,
      maxDays,
      disabledDays,
      skeleton = false,
    },
    ref,
  ) {
    const [current, setCurrent] = useControllableValue<CnWeekdaysValue>(
      value,
      defaultValue,
      [],
      onChange,
    );
    const days = normalizeDays(current);
    const control = useFieldControl(days, {
      id,
      rules: [...(rules ?? []), ...buildWeekdaysRules({ required, minDays, maxDays })],
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
    const buttonsRef = useRef<HTMLDivElement | null>(null);
    const locked = Boolean(disabled || readOnly);
    const ordered = orderedWeekdays(weekStart);
    const presetList = presets === true ? DEFAULT_WEEKDAY_PRESETS : presets || [];

    if (skeleton) {
      return (
        <CnWeekdaysFieldSkeleton
          size={size}
          label={Boolean(label)}
          helperText={Boolean(control.helperText?.trim())}
          presets={presetList.length}
          dayFormat={dayFormat}
          sx={sx}
          className={className}
        />
      );
    }

    const emit = (next: number[]) => {
      control.markChanged();
      setCurrent(normalizeDays(next));
    };

    const toggle = (day: number) => {
      if (locked || disabledDays?.includes(day)) return;
      if (days.includes(day)) emit(days.filter((d) => d !== day));
      else if (maxDays === undefined || days.length < maxDays) emit([...days, day]);
    };

    const onKeyDown = (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
      const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      const target =
        event.key === "Home" ? 0 : event.key === "End" ? 6 : delta ? (index + delta + 7) % 7 : -1;
      if (target < 0) return;
      event.preventDefault();
      buttonsRef.current?.querySelectorAll<HTMLButtonElement>("[data-cn-weekday]")[target]?.focus();
    };

    const dim = DAY_SIZES[size];

    return (
      <FormControl
        ref={ref}
        component="fieldset"
        error={control.error}
        disabled={disabled}
        required={required}
        fullWidth
        className={className}
        data-cn-weekdays-field
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
          ref={buttonsRef}
          id={control.id}
          role={label ? undefined : "group"}
          aria-label={label ? undefined : "Días de la semana"}
          aria-describedby={control.helperText?.trim() ? control.helperId : undefined}
          sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}
        >
          {ordered.map((day, index) => {
            const selected = days.includes(day.value);
            const dayDisabled = Boolean(disabled || disabledDays?.includes(day.value));
            return (
              <ButtonBase
                key={day.value}
                data-cn-weekday={day.value}
                aria-pressed={selected}
                aria-label={day.label}
                title={day.label}
                disabled={dayDisabled}
                tabIndex={index === 0 ? 0 : -1}
                onClick={() => toggle(day.value)}
                onKeyDown={onKeyDown(index)}
                name={name ? `${name}[]` : undefined}
                value={day.value}
                sx={{
                  minWidth: dim,
                  height: dim,
                  px: dayFormat === "initial" ? 0 : "12px",
                  borderRadius: dayFormat === "initial" ? "50%" : "999px",
                  fontSize: size === "lg" ? 14 : size === "sm" ? 12 : 13,
                  fontWeight: 600,
                  border: "1px solid",
                  borderColor: selected
                    ? "var(--cn-color-brand-600, #254d87)"
                    : control.error
                      ? "var(--cn-color-error-500, #d63c3c)"
                      : "var(--cn-color-border, #dde0e4)",
                  backgroundColor: selected
                    ? "var(--cn-color-brand-600, #254d87)"
                    : "var(--cn-color-surface, #ffffff)",
                  color: selected ? "#ffffff" : "var(--cn-color-text, #222831)",
                  cursor: readOnly ? "default" : "pointer",
                  transition: "background-color 120ms ease, border-color 120ms ease",
                  "&:hover": readOnly
                    ? undefined
                    : { borderColor: "var(--cn-color-brand-500, #3562a6)" },
                  "&.Mui-focusVisible": {
                    outline: "2px solid var(--cn-color-brand-300, #7c9fdc)",
                    outlineOffset: 2,
                  },
                  "&.Mui-disabled": { opacity: 0.45 },
                }}
              >
                {dayFormat === "initial"
                  ? day.initial
                  : dayFormat === "short"
                    ? day.short
                    : day.label}
              </ButtonBase>
            );
          })}
        </Box>
        {presetList.length > 0 && !locked && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px", mt: "8px" }}>
            {presetList.map((preset) => {
              const allowed = preset.days.filter((d) => !disabledDays?.includes(d));
              const active = sameDays(allowed, days);
              return (
                <ButtonBase
                  key={preset.label}
                  aria-pressed={active}
                  onClick={() => emit(active ? [] : allowed)}
                  sx={{
                    px: "10px",
                    height: 24,
                    borderRadius: "999px",
                    fontSize: 12,
                    fontWeight: 500,
                    border: "1px solid var(--cn-color-border, #dde0e4)",
                    backgroundColor: active
                      ? "var(--cn-color-brand-50, #eef3fb)"
                      : "var(--cn-color-surface, #ffffff)",
                    color: active
                      ? "var(--cn-color-brand-700, #1d3d6b)"
                      : "var(--cn-color-text-muted, #6e7682)",
                    "&.Mui-focusVisible": {
                      outline: "2px solid var(--cn-color-brand-300, #7c9fdc)",
                      outlineOffset: 2,
                    },
                  }}
                >
                  {preset.label}
                </ButtonBase>
              );
            })}
          </Box>
        )}
        {control.helperText && (
          <FormHelperText id={control.helperId} sx={helperTextSx}>
            {control.helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  },
);

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { forwardRef, useEffect, useRef, useState } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import {
  getOutlinedFieldSx,
  groupLegendSx,
  helperTextSx,
  mergeSx,
  MUI_FIELD_SIZE,
} from "../../utils/field-styles";
import type { CnValidationRule } from "../CnForm/CnForm.types";
import { CnDurationFieldSkeleton } from "./CnDurationFieldSkeleton";

export type CnDurationUnit = "days" | "hours" | "minutes" | "seconds";

/** Duración total en la unidad de `valueUnit` (`null` = vacío). */
export type CnDurationValue = number | null;

export type CnDurationPreset = { label: string; value: number };

export type CnDurationFieldProps = CnFieldBaseProps<CnDurationValue> & {
  /** Unidades capturables, de mayor a menor. Por defecto horas y minutos. */
  units?: CnDurationUnit[];
  /** Unidad del valor guardado: `minutes` (por defecto) o `seconds`. */
  valueUnit?: "minutes" | "seconds";
  /** Mínimo y máximo, en `valueUnit`. */
  min?: number;
  max?: number;
  /**
   * Atajos rápidos (chips). `true` (por defecto) = 15 min, 30 min, 1 h, 2 h,
   * 4 h, 8 h y 1 día (filtrados por `min`/`max`); `false` los oculta; o una
   * lista propia con valores en `valueUnit`.
   */
  presets?: boolean | CnDurationPreset[];
  /** Muestra el skeleton del campo (mismas variantes) en lugar del campo. */
  skeleton?: boolean;
};

const SECONDS: Record<CnDurationUnit, number> = {
  days: 86400,
  hours: 3600,
  minutes: 60,
  seconds: 1,
};

const UNIT_LABELS: Record<CnDurationUnit, { label: string; suffix: string }> = {
  days: { label: "Días", suffix: "d" },
  hours: { label: "Horas", suffix: "h" },
  minutes: { label: "Minutos", suffix: "min" },
  seconds: { label: "Segundos", suffix: "s" },
};

const ORDER: CnDurationUnit[] = ["days", "hours", "minutes", "seconds"];

const DEFAULT_PRESET_MINUTES = [15, 30, 60, 120, 240, 480, 1440];

/** Texto legible de una duración: `1 d 2 h 30 min`. */
export const formatDuration = (
  value: number | null | undefined,
  valueUnit: "minutes" | "seconds" = "minutes",
): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  let rest = Math.round(Math.abs(value) * (valueUnit === "minutes" ? 60 : 1));
  if (rest === 0) return valueUnit === "minutes" ? "0 min" : "0 s";
  const parts: string[] = [];
  for (const unit of ORDER) {
    const amount = Math.floor(rest / SECONDS[unit]);
    rest -= amount * SECONDS[unit];
    if (amount) parts.push(`${amount} ${UNIT_LABELS[unit].suffix}`);
  }
  return (value < 0 ? "-" : "") + parts.join(" ");
};

/** Reparte un total (en segundos) entre las unidades visibles. */
export const splitDuration = (
  totalSeconds: number,
  units: CnDurationUnit[],
): Partial<Record<CnDurationUnit, number>> => {
  const sorted = ORDER.filter((unit) => units.includes(unit));
  let rest = Math.max(0, Math.round(totalSeconds));
  const parts: Partial<Record<CnDurationUnit, number>> = {};
  sorted.forEach((unit, index) => {
    const isLast = index === sorted.length - 1;
    const amount = isLast ? rest / SECONDS[unit] : Math.floor(rest / SECONDS[unit]);
    parts[unit] = isLast ? Math.round(amount * 100) / 100 : amount;
    rest -= Math.floor(amount) * SECONDS[unit];
  });
  return parts;
};

/** Reglas implícitas: requerido, mínimo y máximo. */
export const buildDurationRules = ({
  required,
  min,
  max,
  valueUnit = "minutes",
}: {
  required?: boolean;
  min?: number;
  max?: number;
  valueUnit?: "minutes" | "seconds";
} = {}): CnValidationRule[] => {
  const rules: CnValidationRule[] = [];
  const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
  if (required) {
    rules.push({
      type: "custom",
      message: "Indica la duración",
      validate: (v) => isNumber(v) && v > 0,
    });
  }
  if (min !== undefined) {
    rules.push({
      type: "custom",
      message: `La duración mínima es ${formatDuration(min, valueUnit)}`,
      validate: (v) => !isNumber(v) || v >= min,
    });
  }
  if (max !== undefined) {
    rules.push({
      type: "custom",
      message: `La duración máxima es ${formatDuration(max, valueUnit)}`,
      validate: (v) => !isNumber(v) || v <= max,
    });
  }
  return rules;
};

type Drafts = Partial<Record<CnDurationUnit, string>>;

const toDrafts = (value: CnDurationValue, units: CnDurationUnit[], factor: number): Drafts => {
  if (value === null || value === undefined || !Number.isFinite(value)) return {};
  const parts = splitDuration(value * factor, units);
  return Object.fromEntries(
    Object.entries(parts).map(([unit, amount]) => [unit, String(amount ?? 0)]),
  ) as Drafts;
};

/** Duración en días / horas / minutos / segundos con atajos rápidos. */
export const CnDurationField = forwardRef<HTMLFieldSetElement, CnDurationFieldProps>(
  function CnDurationField(
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
      units: unitsProp = ["hours", "minutes"],
      valueUnit = "minutes",
      min,
      max,
      presets = true,
      skeleton = false,
    },
    ref,
  ) {
    const [current, setCurrent] = useControllableValue<CnDurationValue>(
      value,
      defaultValue,
      null,
      onChange,
    );
    const total = typeof current === "number" && Number.isFinite(current) ? current : null;
    const units = ORDER.filter((unit) => unitsProp.includes(unit));
    if (units.length === 0) units.push("minutes");
    const unitsKey = units.join(",");
    const factor = valueUnit === "minutes" ? 60 : 1;
    const control = useFieldControl(total, {
      id,
      rules: [...(rules ?? []), ...buildDurationRules({ required, min, max, valueUnit })],
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

    const [drafts, setDrafts] = useState<Drafts>(() => toDrafts(total, units, factor));
    const lastEmitted = useRef<CnDurationValue>(total);
    useEffect(() => {
      if (Object.is(total, lastEmitted.current)) return;
      lastEmitted.current = total;
      setDrafts(toDrafts(total, unitsKey.split(",") as CnDurationUnit[], factor));
    }, [total, unitsKey, factor]);

    const locked = Boolean(disabled || readOnly);
    const presetList: CnDurationPreset[] =
      presets === true
        ? DEFAULT_PRESET_MINUTES.map((minutes) => ({
            label: formatDuration(minutes, "minutes"),
            value: valueUnit === "minutes" ? minutes : minutes * 60,
          })).filter(
            (preset) =>
              (min === undefined || preset.value >= min) &&
              (max === undefined || preset.value <= max),
          )
        : presets || [];

    if (skeleton) {
      return (
        <CnDurationFieldSkeleton
          size={size}
          units={units.length}
          presets={locked ? 0 : presetList.length}
          label={Boolean(label)}
          helperText={Boolean(control.helperText?.trim())}
          sx={sx}
          className={className}
        />
      );
    }

    const emit = (next: CnDurationValue) => {
      lastEmitted.current = next;
      control.markChanged();
      setCurrent(next);
    };

    const updateUnit = (unit: CnDurationUnit, raw: string) => {
      const cleaned = raw.replace(/[^\d.,]/g, "").replace(",", ".");
      const nextDrafts = { ...drafts, [unit]: cleaned };
      setDrafts(nextDrafts);
      const allEmpty = units.every((u) => !nextDrafts[u]);
      if (allEmpty) {
        emit(null);
        return;
      }
      const seconds = units.reduce((sum, u) => {
        const amount = Number(nextDrafts[u] || 0);
        return sum + (Number.isFinite(amount) ? amount * SECONDS[u] : 0);
      }, 0);
      emit(Math.round((seconds / factor) * 100) / 100);
    };

    const applyPreset = (preset: CnDurationPreset) => {
      setDrafts(toDrafts(preset.value, units, factor));
      emit(preset.value);
    };

    const describedBy = control.helperText?.trim() ? control.helperId : undefined;

    return (
      <FormControl
        ref={ref}
        component="fieldset"
        fullWidth
        error={control.error}
        disabled={disabled}
        required={required}
        className={className}
        data-cn-duration-field
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            // Normaliza (90 min → 1 h 30 min) al salir del campo.
            setDrafts(toDrafts(total, units, factor));
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
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", pt: label ? "6px" : 0 }}>
          {units.map((unit, index) => (
            <TextField
              key={unit}
              id={index === 0 ? control.id : `${control.id}-${unit}`}
              label={UNIT_LABELS[unit].label}
              size={MUI_FIELD_SIZE[size]}
              value={drafts[unit] ?? ""}
              disabled={disabled}
              error={control.error}
              placeholder="0"
              onChange={(event) => updateUnit(unit, event.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">{UNIT_LABELS[unit].suffix}</InputAdornment>
                  ),
                },
                htmlInput: {
                  readOnly,
                  inputMode: "decimal",
                  "aria-describedby": describedBy,
                  "data-cn-duration-unit": unit,
                },
              }}
              sx={mergeSx(getOutlinedFieldSx(size), { flex: 1, minWidth: 0 })}
            />
          ))}
        </Box>
        {name && <input type="hidden" name={name} value={total ?? ""} />}
        {presetList.length > 0 && !locked && (
          <Box
            role="group"
            aria-label="Duraciones rápidas"
            sx={{ display: "flex", flexWrap: "wrap", gap: "6px", mt: "8px" }}
          >
            {presetList.map((preset) => {
              const active = total === preset.value;
              return (
                <ButtonBase
                  key={`${preset.label}-${preset.value}`}
                  aria-pressed={active}
                  onClick={() => applyPreset(preset)}
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

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import Slider from "@mui/material/Slider";
import type { Ref } from "react";
import { forwardRef } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { groupLegendSx, helperTextSx, mergeSx } from "../../utils/field-styles";

export type CnSliderValue = number | [number, number];

export type CnSliderFieldProps = CnFieldBaseProps<CnSliderValue> & {
  min?: number;
  max?: number;
  step?: number;
  /** `true` muestra una marca por paso; o lista de marcas con etiqueta. */
  marks?: boolean | { value: number; label?: string }[];
  /** Selección de rango: el valor es `[desde, hasta]`. */
  range?: boolean;
  valueLabelDisplay?: "auto" | "on" | "off";
  formatValue?: (value: number) => string;
  /** Muestra el valor actual junto a la etiqueta. */
  showValue?: boolean;
};

export const CnSliderField = forwardRef<HTMLDivElement, CnSliderFieldProps>(function CnSliderField(
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
    min = 0,
    max = 100,
    step = 1,
    marks = false,
    range = false,
    valueLabelDisplay = "auto",
    formatValue = (v) => String(v),
    showValue = true,
  },
  ref,
) {
  const [current, setCurrent] = useControllableValue<CnSliderValue>(
    value,
    defaultValue,
    range ? [min, max] : min,
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

  const normalized: CnSliderValue = range
    ? Array.isArray(current)
      ? current
      : [min, max]
    : typeof current === "number"
      ? current
      : min;

  const valueText = Array.isArray(normalized)
    ? `${formatValue(normalized[0])} – ${formatValue(normalized[1])}`
    : formatValue(normalized);

  return (
    <FormControl
      ref={ref as Ref<HTMLFieldSetElement>}
      component="fieldset"
      error={control.error}
      disabled={disabled}
      required={required}
      fullWidth
      className={className}
      data-cn-slider-field
      sx={mergeSx({ minWidth: 0 }, sx)}
    >
      {(label || showValue) && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: "8px",
          }}
        >
          {label && (
            <FormLabel component="legend" id={`${control.id}-label`} sx={groupLegendSx}>
              {label}
            </FormLabel>
          )}
          {showValue && (
            <Box
              component="span"
              aria-hidden
              sx={{
                fontSize: "var(--cn-font-size-sm, 12px)",
                fontWeight: 600,
                color: "var(--cn-color-text, #222831)",
              }}
            >
              {valueText}
            </Box>
          )}
        </Box>
      )}
      <Box sx={{ px: "8px" }}>
        <Slider
          id={control.id}
          name={name}
          value={normalized}
          min={min}
          max={max}
          step={step}
          marks={marks}
          disabled={disabled || readOnly}
          size={size === "sm" ? "small" : "medium"}
          valueLabelDisplay={valueLabelDisplay}
          valueLabelFormat={formatValue}
          getAriaValueText={formatValue}
          disableSwap
          onChange={(_, next) => {
            control.markChanged();
            setCurrent(next as CnSliderValue);
          }}
          onBlur={() => {
            control.markBlurred();
            onBlur?.();
          }}
          slotProps={{
            input: {
              "aria-labelledby": label ? `${control.id}-label` : undefined,
              "aria-describedby": control.helperText ? control.helperId : undefined,
            } as Record<string, unknown>,
          }}
          sx={{
            color: control.error
              ? "var(--cn-color-error-500, #d63c3c)"
              : "var(--cn-color-brand-600, #254d87)",
            "& .MuiSlider-markLabel": { fontSize: "var(--cn-font-size-xs, 11px)" },
          }}
        />
      </Box>
      {control.helperText && (
        <FormHelperText id={control.helperId} sx={helperTextSx}>
          {control.helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
});

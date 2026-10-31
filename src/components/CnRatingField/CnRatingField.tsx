import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import Rating from "@mui/material/Rating";
import type { Ref } from "react";
import { forwardRef, useState } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { groupLegendSx, helperTextSx, mergeSx } from "../../utils/field-styles";

export type CnRatingFieldProps = CnFieldBaseProps<number | null> & {
  max?: number;
  /** 1 = estrellas completas, 0.5 = medias estrellas. */
  precision?: number;
  /** Texto descriptivo por valor (p. ej. `{ 1: "Malo", 5: "Excelente" }`). */
  labels?: Record<number, string>;
};

export const CnRatingField = forwardRef<HTMLDivElement, CnRatingFieldProps>(function CnRatingField(
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
    max = 5,
    precision = 1,
    labels,
  },
  ref,
) {
  const [current, setCurrent] = useControllableValue<number | null>(
    value,
    defaultValue,
    null,
    onChange,
  );
  const [hover, setHover] = useState(-1);
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

  const shown = hover !== -1 ? hover : current;
  const caption = shown !== null && labels ? labels[shown] : undefined;

  return (
    <FormControl
      ref={ref as Ref<HTMLFieldSetElement>}
      component="fieldset"
      error={control.error}
      disabled={disabled}
      required={required}
      fullWidth
      className={className}
      data-cn-rating-field
      sx={mergeSx({ minWidth: 0 }, sx)}
    >
      {label && (
        <FormLabel component="legend" id={`${control.id}-label`} sx={groupLegendSx}>
          {label}
        </FormLabel>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Rating
          name={name ?? control.id}
          value={current}
          max={max}
          precision={precision}
          readOnly={readOnly}
          disabled={disabled}
          size={size === "sm" ? "small" : size === "lg" ? "large" : "medium"}
          aria-labelledby={label ? `${control.id}-label` : undefined}
          getLabelText={(v) => labels?.[v] ?? `${v} de ${max}`}
          emptyLabelText="Sin calificación"
          onChange={(_, next) => {
            control.markChanged();
            setCurrent(next);
          }}
          onChangeActive={(_, next) => setHover(next)}
          onBlur={() => {
            control.markBlurred();
            onBlur?.();
          }}
          sx={{ "& .MuiRating-iconFilled": { color: "var(--cn-color-warning-500, #e0a020)" } }}
        />
        {caption && (
          <Box
            component="span"
            sx={{
              fontSize: "var(--cn-font-size-sm, 12px)",
              color: "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            {caption}
          </Box>
        )}
      </Box>
      {control.helperText && (
        <FormHelperText id={control.helperId} sx={helperTextSx}>
          {control.helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
});

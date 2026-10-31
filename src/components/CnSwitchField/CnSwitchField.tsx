import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Switch from "@mui/material/Switch";
import type { ReactNode } from "react";
import { forwardRef } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { choiceLabelSx, helperTextSx, switchControlSx } from "../../utils/field-styles";

export type CnSwitchFieldProps = CnFieldBaseProps<boolean> & {
  description?: ReactNode;
  labelPlacement?: "start" | "end" | "top" | "bottom";
};

export const CnSwitchField = forwardRef<HTMLDivElement, CnSwitchFieldProps>(function CnSwitchField(
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
    description,
    labelPlacement = "end",
  },
  ref,
) {
  const [current, setCurrent] = useControllableValue<boolean>(value, defaultValue, false, onChange);
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

  return (
    <FormControl
      ref={ref}
      error={control.error}
      disabled={disabled}
      required={required}
      fullWidth
      className={className}
      data-cn-switch-field
      sx={sx}
    >
      <FormControlLabel
        labelPlacement={labelPlacement}
        control={
          <Switch
            id={control.id}
            name={name}
            size={size === "sm" ? "small" : "medium"}
            checked={Boolean(current)}
            onChange={(event) => {
              if (readOnly) return;
              control.markChanged();
              setCurrent(event.target.checked);
            }}
            onBlur={onBlur}
            disabled={disabled}
            slotProps={{
              input: {
                role: "switch",
                "aria-describedby": control.helperText ? control.helperId : undefined,
                "aria-invalid": control.error || undefined,
              } as Record<string, unknown>,
            }}
            sx={switchControlSx}
          />
        }
        label={
          <Box component="span" sx={{ display: "flex", flexDirection: "column" }}>
            <span>
              {label}
              {required && (
                <Box
                  component="span"
                  aria-hidden
                  sx={{ color: "var(--cn-color-error-500, #d63c3c)" }}
                >
                  {" *"}
                </Box>
              )}
            </span>
            {description && (
              <Box
                component="span"
                sx={{
                  fontSize: "var(--cn-font-size-xs, 11px)",
                  fontWeight: 400,
                  color: "var(--cn-color-text-muted, #6e7682)",
                }}
              >
                {description}
              </Box>
            )}
          </Box>
        }
        sx={choiceLabelSx}
      />
      {control.helperText && (
        <FormHelperText id={control.helperId} sx={helperTextSx}>
          {control.helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
});

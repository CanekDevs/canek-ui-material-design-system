import type { SxProps, Theme } from "@mui/material/styles";

export type CnFieldSize = "sm" | "md" | "lg";

export const FIELD_SIZE_TOKENS: Record<CnFieldSize, { height: number; fontSize: number }> = {
  sm: { height: 32, fontSize: 12 },
  md: { height: 40, fontSize: 13 },
  lg: { height: 48, fontSize: 15 },
};

export const MUI_FIELD_SIZE: Record<CnFieldSize, "small" | "medium"> = {
  sm: "small",
  md: "small",
  lg: "medium",
};

/**
 * Estilos compartidos por todos los campos basados en `TextField` de MUI
 * (texto, select, autocomplete, número, moneda, teléfono, fecha).
 */
export const getOutlinedFieldSx = (size: CnFieldSize = "md"): Record<string, unknown> => {
  const tokens = FIELD_SIZE_TOKENS[size];
  return {
    "& .MuiOutlinedInput-root": {
      minHeight: tokens.height,
      fontSize: `${tokens.fontSize}px`,
      borderRadius: "var(--cn-radius-md, 8px)",
      backgroundColor: "var(--cn-color-surface, #ffffff)",
      transition: "box-shadow 140ms ease",
      "& fieldset": {
        borderColor: "var(--cn-color-border, #dde0e4)",
        transition: "border-color 140ms ease",
      },
      "&:hover fieldset": {
        borderColor: "var(--cn-color-border-strong, #c5cad0)",
      },
      "&.Mui-focused fieldset": {
        borderColor: "var(--cn-color-brand-500, #3562a6)",
        borderWidth: 1.5,
      },
      "&.Mui-error fieldset": {
        borderColor: "var(--cn-color-error-500, #d63c3c)",
      },
      "&.Mui-disabled": {
        backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
      },
    },
    "& .MuiInputLabel-root": {
      fontSize: "var(--cn-font-size-sm, 12px)",
      fontWeight: 500,
    },
    "& .MuiFormHelperText-root": {
      fontSize: "var(--cn-font-size-xs, 11px)",
      marginLeft: 0,
      marginRight: 0,
      marginTop: "4px",
    },
  };
};

/** Colores de marca para Checkbox / Radio. */
export const choiceControlSx = {
  color: "var(--cn-color-neutral-400, #9aa1aa)",
  "&.Mui-checked, &.MuiCheckbox-indeterminate": {
    color: "var(--cn-color-brand-600, #254d87)",
  },
  "&.Mui-disabled": {
    color: "var(--cn-color-neutral-300, #c5cad0)",
  },
  "&.Mui-focusVisible": {
    outline: "2px solid var(--cn-color-brand-300, #7c9fdc)",
    outlineOffset: 2,
  },
};

export const switchControlSx = {
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: "var(--cn-color-brand-600, #254d87)",
  },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "var(--cn-color-brand-600, #254d87)",
    opacity: 0.5,
  },
};

/** Etiqueta para controles de elección (checkbox, radio, switch). */
export const choiceLabelSx = {
  margin: 0,
  gap: "2px",
  "& .MuiFormControlLabel-label": {
    fontSize: "var(--cn-font-size-base, 13px)",
    fontWeight: 500,
    color: "var(--cn-color-text, #222831)",
  },
  "& .MuiFormControlLabel-label.Mui-disabled": {
    color: "var(--cn-color-text-subtle, #9aa1aa)",
  },
};

/** Leyenda de grupos (radio, checkbox group, slider, rating, file). */
export const groupLegendSx = {
  fontSize: "var(--cn-font-size-sm, 12px)",
  fontWeight: 500,
  color: "var(--cn-color-text-muted, #6e7682)",
  marginBottom: "4px",
  "&.Mui-focused": { color: "var(--cn-color-brand-600, #254d87)" },
  "&.Mui-error": { color: "var(--cn-color-error-600, #b52f2f)" },
  "& .MuiFormLabel-asterisk": { color: "var(--cn-color-error-500, #d63c3c)" },
};

export const helperTextSx = {
  fontSize: "var(--cn-font-size-xs, 11px)",
  marginLeft: 0,
  marginRight: 0,
  marginTop: "4px",
};

export const mergeSx = (
  base: SxProps<Theme> | Record<string, unknown>,
  sx?: SxProps<Theme>,
): SxProps<Theme> => [base, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])] as SxProps<Theme>;

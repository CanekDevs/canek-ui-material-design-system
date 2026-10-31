import type { GridSize } from "@mui/material";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import type { ReactNode } from "react";
import { isValidElement } from "react";
import type { CnTextFieldType } from "../CnTextField";
import { CnTextField } from "../CnTextField";
import type { CnFormField, CnFormFieldType, CnFormSelectOption } from "./CnForm.types";

type CnFormFieldControlProps = {
  field: CnFormField;
  value: unknown;
  error: string | undefined;
  formValues: Record<string, unknown>;
  disabled: boolean;
  readOnly: boolean;
  onChange: (nextValue: unknown) => void;
};

type ResponsiveGridSize = {
  xs?: GridSize;
  sm?: GridSize;
  md?: GridSize;
  lg?: GridSize;
  xl?: GridSize;
};

const DEFAULT_GRID: Record<CnFormField["type"], GridSize> = {
  text: 12,
  email: 12,
  password: 12,
  tel: 12,
  url: 12,
  number: 6,
  textarea: 12,
  select: 6,
  checkbox: 12,
  switch: 12,
  radio: 12,
  custom: 12,
};

const evaluateBoolean = (
  value: boolean | ((fv: Record<string, unknown>) => boolean) | undefined,
  formValues: Record<string, unknown>,
): boolean => {
  if (typeof value === "function") return value(formValues);
  return Boolean(value);
};

const evaluateOptions = (
  options:
    CnFormSelectOption[] | ((fv: Record<string, unknown>) => CnFormSelectOption[]) | undefined,
  formValues: Record<string, unknown>,
): CnFormSelectOption[] => {
  if (!options) return [];
  if (typeof options === "function") return options(formValues);
  return options;
};

const renderAdornment = (
  adornment: ReactNode | ((value: unknown, fv: Record<string, unknown>) => ReactNode) | undefined,
  value: unknown,
  formValues: Record<string, unknown>,
): ReactNode => {
  if (!adornment) return undefined;
  if (typeof adornment === "function") {
    return (adornment as (value: unknown, fv: Record<string, unknown>) => ReactNode)(
      value,
      formValues,
    );
  }
  return adornment;
};

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "var(--cn-radius-md, 8px)",
    fontSize: "var(--cn-font-size-base, 13px)",
    backgroundColor: "var(--cn-color-surface, #ffffff)",
    transition: "border-color 140ms ease, box-shadow 140ms ease",
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

type CnFormTextFieldType = Extract<CnFormFieldType, CnTextFieldType>;

const CN_TEXT_FIELD_TYPES: readonly CnFormTextFieldType[] = [
  "text",
  "email",
  "tel",
  "url",
  "number",
  "password",
  "textarea",
];

const isCnTextFieldType = (type: CnFormField["type"]): type is CnFormTextFieldType =>
  (CN_TEXT_FIELD_TYPES as readonly string[]).includes(type);

export const CnFormFieldControl = ({
  field,
  value,
  error,
  formValues,
  disabled,
  readOnly,
  onChange,
}: CnFormFieldControlProps) => {
  const fieldDisabled = disabled || evaluateBoolean(field.disabled, formValues);
  const fieldReadOnly = readOnly || evaluateBoolean(field.readOnly, formValues);
  const isDisabled = fieldDisabled || fieldReadOnly;
  const isRequired = evaluateBoolean(field.required, formValues);

  const gridSize: ResponsiveGridSize = {
    xs: field.xs ?? 12,
    sm: field.sm,
    md: field.md ?? DEFAULT_GRID[field.type],
    lg: field.lg,
    xl: field.xl,
  };

  const helperTextNode: string | undefined = error
    ? error
    : typeof field.helperText === "string"
      ? field.helperText
      : undefined;

  const renderContent = (): ReactNode => {
    if (isCnTextFieldType(field.type)) {
      const startAdornment = renderAdornment(field.startAdornment, value, formValues);
      const endAdornment = renderAdornment(field.endAdornment, value, formValues);
      const isMultiline = field.type === "textarea" || Boolean(field.multiline);
      return (
        <CnTextField
          name={field.name}
          label={field.label}
          placeholder={field.placeholder}
          helperText={helperTextNode}
          error={Boolean(error)}
          required={isRequired}
          disabled={isDisabled}
          readOnly={fieldReadOnly}
          type={field.type}
          value={String(value ?? "")}
          onChange={(next) => onChange(next)}
          autoComplete={field.autoComplete}
          autoFocus={field.autoFocus}
          multiline={isMultiline}
          rows={field.rows}
          minRows={field.minRows}
          maxRows={field.maxRows}
          startAdornment={startAdornment}
          endAdornment={endAdornment}
          reserveHelperSpace
        />
      );
    }

    if (field.type === "checkbox") {
      return (
        <FormControl error={Boolean(error)} disabled={isDisabled} fullWidth>
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(value)}
                onChange={(e) => onChange(e.target.checked)}
                disabled={isDisabled}
                sx={{
                  color: "var(--cn-color-brand-500, #3562a6)",
                  "&.Mui-checked": { color: "var(--cn-color-brand-600, #254d87)" },
                }}
              />
            }
            label={field.label ?? ""}
            sx={{
              margin: 0,
              "& .MuiFormControlLabel-label": {
                fontSize: "var(--cn-font-size-base, 13px)",
                fontWeight: 500,
                color: "var(--cn-color-text, #222831)",
              },
            }}
          />
          {helperTextNode && <FormHelperText>{helperTextNode}</FormHelperText>}
        </FormControl>
      );
    }

    if (field.type === "switch") {
      return (
        <FormControl error={Boolean(error)} disabled={isDisabled} fullWidth>
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(value)}
                onChange={(e) => onChange(e.target.checked)}
                disabled={isDisabled}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: "var(--cn-color-brand-600, #254d87)",
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "var(--cn-color-brand-600, #254d87)",
                  },
                }}
              />
            }
            label={field.label ?? ""}
            sx={{
              margin: 0,
              "& .MuiFormControlLabel-label": {
                fontSize: "var(--cn-font-size-base, 13px)",
                fontWeight: 500,
                color: "var(--cn-color-text, #222831)",
              },
            }}
          />
          {helperTextNode && <FormHelperText>{helperTextNode}</FormHelperText>}
        </FormControl>
      );
    }

    if (field.type === "radio") {
      const options = evaluateOptions(field.options, formValues);
      return (
        <FormControl error={Boolean(error)} disabled={isDisabled} fullWidth component="fieldset">
          {field.label && (
            <FormLabel
              component="legend"
              sx={{ fontSize: "var(--cn-font-size-sm, 12px)", fontWeight: 500, mb: "4px" }}
            >
              {field.label}
            </FormLabel>
          )}
          <RadioGroup value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} row>
            {options.map((option) => (
              <FormControlLabel
                key={String(option.value)}
                value={String(option.value)}
                control={
                  <Radio
                    disabled={isDisabled || option.disabled}
                    sx={{
                      color: "var(--cn-color-brand-500, #3562a6)",
                      "&.Mui-checked": { color: "var(--cn-color-brand-600, #254d87)" },
                    }}
                  />
                }
                label={option.label}
                sx={{
                  "& .MuiFormControlLabel-label": {
                    fontSize: "var(--cn-font-size-base, 13px)",
                  },
                }}
              />
            ))}
          </RadioGroup>
          {helperTextNode && <FormHelperText>{helperTextNode}</FormHelperText>}
        </FormControl>
      );
    }

    if (field.type === "select") {
      const options = evaluateOptions(field.options, formValues);
      return (
        <TextField
          select
          fullWidth
          label={field.label}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          required={isRequired}
          error={Boolean(error)}
          helperText={helperTextNode}
          placeholder={field.placeholder}
          autoComplete={field.autoComplete}
          autoFocus={field.autoFocus}
          sx={textFieldSx}
        >
          {field.placeholder && (
            <MenuItem value="" disabled>
              {field.placeholder}
            </MenuItem>
          )}
          {options.map((option) => (
            <MenuItem
              key={String(option.value)}
              value={String(option.value)}
              disabled={option.disabled}
            >
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    return null;
  };

  return (
    <Grid size={gridSize}>
      <Box sx={{ width: "100%", marginBlockEnd: "8px" }}>{renderContent()}</Box>
    </Grid>
  );
};

export const renderCustomElement = (
  component: ReactNode,
  xs?: GridSize,
  md?: GridSize,
): ReactNode => {
  if (!isValidElement(component)) return component;
  return (
    <Grid size={{ xs: xs ?? 12, md: md ?? 12 }}>
      <Box sx={{ width: "100%", marginBlockEnd: "8px" }}>{component}</Box>
    </Grid>
  );
};

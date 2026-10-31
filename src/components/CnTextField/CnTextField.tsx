import ClearIcon from "@mui/icons-material/Clear";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import type { SxProps, Theme } from "@mui/material/styles";
import type { TextFieldProps } from "@mui/material/TextField";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { ChangeEvent, FocusEvent, ReactNode } from "react";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveFieldState } from "../../utils/field-state";
import {
  getFilterPattern,
  getInputModeFromRules,
  getMaxLength,
  transformValue,
} from "../../utils/input-utils";
import type { CnFormSectionContext, CnValidationRule } from "../CnForm/CnForm.types";
import { useFieldValidation } from "../CnForm/CnForm.validation";
import { CnIcon } from "../CnIcon";

export type CnTextFieldType =
  "text" | "email" | "tel" | "url" | "number" | "search" | "password" | "textarea";

export type CnTextFieldSize = "sm" | "md" | "lg";
export type CnTextFieldVariant = "outlined" | "filled" | "standard";
export type CnTextFieldTransform =
  "uppercase" | "lowercase" | "capitalize" | "numeric" | "currency" | "none";

export type CnTextFieldSlotProps = {
  input?: TextFieldProps["slotProps"] extends infer S
    ? S extends { input?: infer I }
      ? I
      : never
    : never;
  htmlInput?: TextFieldProps["slotProps"] extends infer S
    ? S extends { htmlInput?: infer I }
      ? I
      : never
    : never;
  inputLabel?: TextFieldProps["slotProps"] extends infer S
    ? S extends { inputLabel?: infer I }
      ? I
      : never
    : never;
  formHelperText?: TextFieldProps["slotProps"] extends infer S
    ? S extends { formHelperText?: infer I }
      ? I
      : never
    : never;
};

export type CnTextFieldProps = {
  name?: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;

  type?: CnTextFieldType;
  variant?: CnTextFieldVariant;
  size?: CnTextFieldSize;

  value?: string | number;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

  multiline?: boolean;
  rows?: number;
  minRows?: number;
  maxRows?: number;

  maxLength?: number;
  showCounter?: boolean;

  clearable?: boolean;
  onClear?: () => void;

  passwordToggle?: boolean;
  passwordVisibleIcon?: ReactNode;
  passwordHiddenIcon?: ReactNode;

  loading?: boolean;

  autoFocus?: boolean;
  autoComplete?: string;
  autoSelect?: boolean;

  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  startIcon?: string;
  endIcon?: string;

  transform?: CnTextFieldTransform;

  rules?: CnValidationRule[];
  formValues?: Record<string, unknown>;
  sectionContext?: CnFormSectionContext;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;

  reserveHelperSpace?: boolean;

  sx?: SxProps<Theme>;
  className?: string;
  slotProps?: CnTextFieldSlotProps;
};

const SIZE_TOKENS: Record<CnTextFieldSize, { height: number; fontSize: number }> = {
  sm: { height: 32, fontSize: 12 },
  md: { height: 40, fontSize: 13 },
  lg: { height: 48, fontSize: 15 },
};

const MUI_SIZE: Record<CnTextFieldSize, "small" | "medium"> = {
  sm: "small",
  md: "small",
  lg: "medium",
};

export const CnTextField = forwardRef<HTMLDivElement, CnTextFieldProps>(function CnTextField(
  {
    name,
    label,
    placeholder,
    helperText: externalHelperText,
    error: externalError,
    required,
    disabled,
    readOnly,
    type = "text",
    variant = "outlined",
    size = "md",
    value: externalValue,
    defaultValue,
    onChange,
    onBlur: externalOnBlur,
    onFocus,
    multiline,
    rows,
    minRows,
    maxRows,
    maxLength: maxLengthProp,
    showCounter = false,
    clearable = false,
    onClear,
    passwordToggle = false,
    passwordVisibleIcon,
    passwordHiddenIcon,
    loading = false,
    autoFocus,
    autoComplete,
    autoSelect = false,
    startAdornment,
    endAdornment,
    startIcon,
    endIcon,
    transform = "none",
    rules,
    formValues = {},
    sectionContext,
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 400,
    reserveHelperSpace = false,
    sx,
    className,
    slotProps,
  },
  ref,
) {
  const isTextarea = type === "textarea";
  const isMultiline = isTextarea || Boolean(multiline);
  const isPassword = type === "password";
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [localValue, setLocalValue] = useState<string>(() => {
    const initial =
      externalValue !== undefined && externalValue !== null
        ? String(externalValue)
        : (defaultValue ?? "");
    return transform !== "none" ? transformValue(initial, transform) : initial;
  });
  const isEditingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isEditingRef.current) {
      const incoming =
        externalValue !== undefined && externalValue !== null ? String(externalValue) : "";
      setLocalValue(transform !== "none" ? transformValue(incoming, transform) : incoming);
    }
  }, [externalValue, transform]);

  const {
    error: validationError,
    hasError,
    hasInteracted,
    handleBlur,
    handleChange,
  } = useFieldValidation(localValue, rules, formValues, {
    sectionContext,
    validateOnChange,
    validateOnBlur,
    debounceMs,
  });

  const { error: finalError, helperText: finalHelperText } = resolveFieldState({
    externalError,
    externalHelperText,
    hasInteracted,
    hasValidationError: hasError,
    validationError,
  });

  const filterPattern = useMemo(() => getFilterPattern(rules), [rules]);
  const inputMode = useMemo(() => getInputModeFromRules(rules), [rules]);
  const maxLengthFromRules = useMemo(() => getMaxLength(rules), [rules]);
  const effectiveMaxLength = maxLengthProp ?? maxLengthFromRules;

  const filterAndLimit = useCallback(
    (raw: string): string => {
      let next = raw;
      if (filterPattern) next = next.replace(filterPattern, "");
      if (effectiveMaxLength && next.length > effectiveMaxLength) {
        next = next.slice(0, effectiveMaxLength);
      }
      return next;
    },
    [filterPattern, effectiveMaxLength],
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      isEditingRef.current = true;
      const filtered = filterAndLimit(event.target.value);
      setLocalValue(filtered);
      handleChange();
      if (transform === "none") {
        onChange?.(filtered);
      }
    },
    [filterAndLimit, handleChange, onChange, transform],
  );

  const handleInputBlur = useCallback(
    (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      let final = localValue;
      if (transform !== "none" && localValue) {
        final = transformValue(localValue, transform);
        setLocalValue(final);
      }
      if (externalValue !== undefined && String(externalValue) !== final) {
        onChange?.(final);
      } else if (externalValue === undefined && final !== localValue) {
        onChange?.(final);
      }
      isEditingRef.current = false;
      handleBlur();
      externalOnBlur?.(event);
    },
    [externalValue, handleBlur, localValue, onChange, externalOnBlur, transform],
  );

  const handleClear = useCallback(() => {
    isEditingRef.current = true;
    setLocalValue("");
    handleChange();
    onChange?.("");
    onClear?.();
    if (autoSelect && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoSelect, handleChange, onChange, onClear]);

  const togglePasswordVisibility = useCallback(() => {
    setPasswordVisible((prev) => !prev);
  }, []);

  const resolvedInputType = isMultiline
    ? "text"
    : isPassword
      ? passwordVisible
        ? "text"
        : "password"
      : type;

  const adornmentStart = useMemo(() => {
    if (startAdornment) return startAdornment;
    if (startIcon) {
      return (
        <InputAdornment position="start">
          <CnIcon name={startIcon} size="sm" />
        </InputAdornment>
      );
    }
    return undefined;
  }, [startAdornment, startIcon]);

  const adornmentEnd = useMemo(() => {
    if (endAdornment) return endAdornment;
    if (loading) {
      return (
        <InputAdornment position="end">
          <CircularProgress size={16} />
        </InputAdornment>
      );
    }
    const trailing: ReactNode[] = [];
    if (endIcon) {
      trailing.push(<CnIcon key="end-icon" name={endIcon} size="sm" />);
    }
    if (isPassword && passwordToggle) {
      trailing.push(
        <IconButton
          key="password-toggle"
          size="small"
          aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
          onClick={togglePasswordVisibility}
          onMouseDown={(e) => e.preventDefault()}
          disabled={disabled}
          edge="end"
          sx={{ color: "var(--cn-color-neutral-500, #6e7682)" }}
        >
          {passwordVisible
            ? (passwordVisibleIcon ?? <VisibilityOutlinedIcon fontSize="small" />)
            : (passwordHiddenIcon ?? <VisibilityOffOutlinedIcon fontSize="small" />)}
        </IconButton>,
      );
    }
    if (clearable && localValue && !disabled && !readOnly) {
      trailing.push(
        <IconButton
          key="clear"
          size="small"
          aria-label="Limpiar"
          onClick={handleClear}
          edge="end"
          sx={{ color: "var(--cn-color-neutral-500, #6e7682)" }}
        >
          <ClearIcon fontSize="small" />
        </IconButton>,
      );
    }
    if (trailing.length === 0) return undefined;
    return <InputAdornment position="end">{trailing}</InputAdornment>;
  }, [
    clearable,
    disabled,
    endAdornment,
    endIcon,
    handleClear,
    isPassword,
    loading,
    localValue,
    passwordToggle,
    passwordHiddenIcon,
    passwordVisible,
    passwordVisibleIcon,
    readOnly,
    togglePasswordVisibility,
  ]);

  const charCount = localValue.length;
  const showCounterRow = showCounter && effectiveMaxLength !== undefined;

  const helperTextResolved = finalHelperText ?? (reserveHelperSpace ? "" : undefined);

  const tokens = SIZE_TOKENS[size];

  return (
    <Box
      data-cn-text-field
      data-cn-text-field-type={type}
      data-cn-text-field-size={size}
      data-cn-text-field-variant={variant}
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        gap: "4px",
        ...(sx as object),
      }}
      className={className}
    >
      <TextField
        ref={ref}
        name={name}
        label={label}
        placeholder={placeholder}
        helperText={helperTextResolved}
        error={finalError}
        required={required}
        disabled={disabled || loading}
        value={localValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={onFocus}
        type={resolvedInputType}
        variant={variant}
        size={MUI_SIZE[size]}
        fullWidth
        multiline={isMultiline}
        rows={isMultiline ? rows : undefined}
        minRows={isMultiline ? (rows ? undefined : (minRows ?? 3)) : undefined}
        maxRows={isMultiline ? (rows ? undefined : maxRows) : undefined}
        autoFocus={autoFocus}
        inputRef={inputRef}
        slotProps={{
          input: {
            readOnly,
            startAdornment: adornmentStart,
            endAdornment: adornmentEnd,
            ...slotProps?.input,
          },
          htmlInput: {
            inputMode,
            maxLength: effectiveMaxLength,
            autoComplete,
            autoFocus,
            name,
            "aria-invalid": finalError || undefined,
            ...slotProps?.htmlInput,
          },
          inputLabel: slotProps?.inputLabel,
          formHelperText: slotProps?.formHelperText,
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            minHeight: tokens.height,
            fontSize: `${tokens.fontSize}px`,
            borderRadius: "var(--cn-radius-md, 8px)",
            backgroundColor: "var(--cn-color-surface, #ffffff)",
            "& fieldset": {
              borderColor: "var(--cn-color-border, #dde0e4)",
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
        }}
      />
      {showCounterRow && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            fontSize: "var(--cn-font-size-xs, 11px)",
            color: "var(--cn-color-text-muted, #6e7682)",
          }}
        >
          <Typography
            component="span"
            sx={{ fontSize: "inherit", color: "inherit" }}
            data-cn-text-field-counter
          >
            {charCount}/{effectiveMaxLength}
          </Typography>
        </Box>
      )}
    </Box>
  );
});

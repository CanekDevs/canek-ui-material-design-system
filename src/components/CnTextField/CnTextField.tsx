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
import type { ChangeEvent, FocusEvent, KeyboardEvent, ReactNode } from "react";
import { forwardRef, useCallback, useMemo, useRef, useState } from "react";
import { useDraftValue, useFieldControl } from "../../utils/field-control";
import { getOutlinedFieldSx, mergeSx, MUI_FIELD_SIZE } from "../../utils/field-styles";
import {
  getFilterPattern,
  getInputModeFromRules,
  getMaxLength,
  getPasswordStrength,
  transformValue,
} from "../../utils/input-utils";
import type { CnFormSectionContext, CnValidationRule } from "../CnForm/CnForm.types";
import { CnIcon } from "../CnIcon";

export type CnTextFieldType =
  "text" | "email" | "tel" | "url" | "number" | "search" | "password" | "textarea";

export type CnTextFieldSize = "sm" | "md" | "lg";
export type CnTextFieldVariant = "outlined" | "filled" | "standard";
/**
 * `numeric` deja solo dígitos, punto y signo. `currency` se conserva por
 * compatibilidad y se comporta igual que `numeric`: para montos usa `CnCurrencyField`.
 */
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
  id?: string;
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
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

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
  /** Muestra un medidor de fortaleza debajo de los campos `password`. */
  showPasswordStrength?: boolean;

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
  /** Desactiva la validación interna; las reglas se siguen usando para filtrar la entrada. */
  internalValidation?: boolean;

  reserveHelperSpace?: boolean;

  sx?: SxProps<Theme>;
  className?: string;
  slotProps?: CnTextFieldSlotProps;
};

const STRENGTH_META = [
  { label: "Muy débil", color: "var(--cn-color-error-500, #d63c3c)" },
  { label: "Débil", color: "var(--cn-color-error-500, #d63c3c)" },
  { label: "Regular", color: "var(--cn-color-warning-500, #e0a020)" },
  { label: "Buena", color: "var(--cn-color-success-500, #2e9e4f)" },
  { label: "Fuerte", color: "var(--cn-color-success-600, #228740)" },
] as const;

const toDraft = (value: string | number | undefined | null): string =>
  value === undefined || value === null ? "" : String(value);

export const CnTextField = forwardRef<HTMLDivElement, CnTextFieldProps>(function CnTextField(
  {
    id,
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
    onKeyDown,
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
    showPasswordStrength = false,
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
    formValues,
    sectionContext,
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 400,
    internalValidation = true,
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
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isControlled = externalValue !== undefined;
  const [localValue, setLocalValue, markEmitted] = useDraftValue<string | number | undefined>(
    isControlled ? externalValue : defaultValue,
    toDraft,
  );

  const control = useFieldControl(localValue, {
    id,
    rules,
    formValues,
    sectionContext,
    validateOnChange,
    validateOnBlur,
    debounceMs,
    internalValidation,
    error: externalError,
    helperText: externalHelperText,
    reserveHelperSpace,
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

  const emit = useCallback(
    (next: string) => {
      markEmitted(next);
      onChange?.(next);
    },
    [markEmitted, onChange],
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const filtered = filterAndLimit(event.target.value);
      setLocalValue(filtered);
      control.markChanged();
      // El valor emitido ya va transformado: si el formulario se envía con Enter
      // (sin blur) recibe el valor final. El borrador visible se normaliza en blur
      // para no mover el cursor mientras se escribe.
      emit(transform === "none" ? filtered : transformValue(filtered, transform));
    },
    [control, emit, filterAndLimit, setLocalValue, transform],
  );

  const handleInputBlur = useCallback(
    (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (transform !== "none" && localValue) {
        const final = transformValue(localValue, transform);
        if (final !== localValue) setLocalValue(final);
      }
      control.markBlurred();
      externalOnBlur?.(event);
    },
    [control, externalOnBlur, localValue, setLocalValue, transform],
  );

  const handleClear = useCallback(() => {
    setLocalValue("");
    control.markChanged();
    emit("");
    onClear?.();
    if (autoSelect && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoSelect, control, emit, onClear, setLocalValue]);

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
          <CircularProgress size={16} aria-label="Cargando" />
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
          aria-pressed={passwordVisible}
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
          onMouseDown={(e) => e.preventDefault()}
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
  const strength =
    isPassword && showPasswordStrength && localValue ? getPasswordStrength(localValue) : null;

  return (
    <Box
      data-cn-text-field
      data-cn-text-field-type={type}
      data-cn-text-field-size={size}
      data-cn-text-field-variant={variant}
      sx={mergeSx({ display: "flex", flexDirection: "column", width: "100%", gap: "4px" }, sx)}
      className={className}
    >
      <TextField
        ref={ref}
        id={control.id}
        name={name}
        label={label}
        placeholder={placeholder}
        helperText={control.helperText}
        error={control.error}
        required={required}
        disabled={disabled || loading}
        value={localValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={(event) => {
          if (autoSelect) event.target.select();
          onFocus?.(event);
        }}
        type={resolvedInputType}
        variant={variant}
        size={MUI_FIELD_SIZE[size]}
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
            onKeyDown,
            maxLength: effectiveMaxLength,
            autoComplete,
            name,
            "aria-invalid": control.error || undefined,
            ...slotProps?.htmlInput,
          },
          inputLabel: slotProps?.inputLabel,
          formHelperText: slotProps?.formHelperText,
        }}
        sx={getOutlinedFieldSx(size)}
      />
      {strength && (
        <Box
          data-cn-password-strength={strength.score}
          sx={{ display: "flex", flexDirection: "column", gap: "4px" }}
        >
          <Box
            role="meter"
            aria-label="Fortaleza de la contraseña"
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={strength.score}
            aria-valuetext={STRENGTH_META[strength.score].label}
            sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px" }}
          >
            {[1, 2, 3, 4].map((step) => (
              <Box
                key={step}
                sx={{
                  height: 4,
                  borderRadius: "var(--cn-radius-xs, 4px)",
                  backgroundColor:
                    strength.score >= step
                      ? STRENGTH_META[strength.score].color
                      : "var(--cn-color-neutral-150, #e9ecef)",
                  transition: "background-color 160ms ease",
                }}
              />
            ))}
          </Box>
          <Typography
            component="span"
            sx={{
              fontSize: "var(--cn-font-size-xs, 11px)",
              color: STRENGTH_META[strength.score].color,
            }}
          >
            {STRENGTH_META[strength.score].label}
            {strength.missing.length > 0 && (
              <Box component="span" sx={{ color: "var(--cn-color-text-muted, #6e7682)" }}>
                {` · Agrega ${strength.missing.join(", ")}`}
              </Box>
            )}
          </Typography>
        </Box>
      )}
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
            aria-live="polite"
          >
            {charCount}/{effectiveMaxLength}
          </Typography>
        </Box>
      )}
    </Box>
  );
});

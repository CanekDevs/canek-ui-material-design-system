import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { FormEvent, MutableRefObject } from "react";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CnAlert } from "../CnAlert";
import { CnButton } from "../CnButton";
import { flattenObject, getNestedValue } from "./CnForm.helpers";
import type {
  CnFormCustomElement,
  CnFormField,
  CnFormFieldOrCustom,
  CnFormProps,
} from "./CnForm.types";
import { combineRules, validateFieldValue } from "./CnForm.validation";
import { CnFormFieldControl, renderCustomElement } from "./CnFormField";

const isCustomElement = (item: CnFormFieldOrCustom): item is CnFormCustomElement =>
  "type" in item && item.type === "custom" && "component" in item;

const evaluateBoolean = (
  value: boolean | ((fv: Record<string, unknown>) => boolean) | undefined,
  formValues: Record<string, unknown>,
): boolean => {
  if (typeof value === "function") return value(formValues);
  return Boolean(value);
};

const getInitialValue = (field: CnFormField): unknown => {
  if (field.defaultValue !== undefined) return field.defaultValue;
  if (field.type === "checkbox" || field.type === "switch") return false;
  if (field.type === "number") return "";
  if (field.type === "radio" || field.type === "select") return "";
  return "";
};

export const CnForm = forwardRef<HTMLFormElement, CnFormProps>(function CnForm(
  {
    fields,
    value,
    onChange,
    onSubmit,
    onCancel,
    title,
    description,
    columns = 1,
    submitLabel = "Guardar",
    cancelLabel = "Cancelar",
    submitIcon = "save",
    cancelIcon,
    submitButtonProps,
    cancelButtonProps,
    showSubmitButton = true,
    showCancelButton = Boolean(onCancel),
    isSubmitting = false,
    isLoading = false,
    disabled = false,
    readOnly = false,
    serverError,
    error,
    resetAfterSubmit = false,
    scrollToFirstError = true,
    externalSubmitRef,
    allFieldsForValidation,
    sx,
    className,
    fieldSx,
  },
  ref,
) {
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const setRefs = useCallback(
    (node: HTMLFormElement | null) => {
      formRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as MutableRefObject<HTMLFormElement | null>).current = node;
      }
    },
    [ref],
  );

  useEffect(() => {
    const flatServerErrors = flattenObject(serverError ?? {});
    const validErrors: Record<string, string> = {};
    for (const [key, val] of Object.entries(flatServerErrors)) {
      if (typeof val === "string" && val.trim() !== "") {
        validErrors[key] = val;
      }
    }
    if (Object.keys(validErrors).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...validErrors }));
    }
  }, [serverError]);

  const visibleFields = useMemo(() => {
    return fields.filter((item) => {
      if (isCustomElement(item)) {
        if (item.visibleWhen && !item.visibleWhen(value)) return false;
        return true;
      }
      if (item.visibleWhen && !item.visibleWhen(value)) return false;
      return true;
    });
  }, [fields, value]);

  const handleFieldChange = useCallback(
    (field: CnFormField, nextValue: unknown) => {
      const path = field.name;

      const updates: Record<string, unknown> = { [path]: nextValue };

      if (field.onFieldChange) {
        const extra = field.onFieldChange(nextValue, value, path);
        if (extra && typeof extra === "object") {
          Object.assign(updates, extra);
        }
      }

      setFormErrors((prev) => {
        if (!prev[path]) return prev;
        const next = { ...prev };
        delete next[path];
        return next;
      });

      onChange(updates as Partial<typeof value>);
    },
    [onChange, value],
  );

  const validateAll = useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {};
    const source = allFieldsForValidation ?? fields;

    for (const item of source) {
      if (isCustomElement(item)) continue;
      const field = item;

      if (field.visibleWhen && !field.visibleWhen(value)) continue;

      const fieldValue = getNestedValue(value, field.name);
      const isRequired = evaluateBoolean(field.required, value);
      const rules = combineRules(isRequired, field.rules);
      const errorMsg = validateFieldValue(fieldValue, rules, value);
      if (errorMsg) errors[field.name] = errorMsg;
    }

    return errors;
  }, [fields, value, allFieldsForValidation]);

  const executeSubmit = useCallback(async (): Promise<boolean> => {
    if (disabled || readOnly || isSubmitting) return false;

    const errors = validateAll();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setShowValidationAlert(true);
      if (scrollToFirstError) {
        const firstKey = Object.keys(errors)[0];
        const el = formRef.current?.querySelector(`[data-field-name="${firstKey}"]`);
        if (el && "scrollIntoView" in el) {
          (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return false;
    }

    setFormErrors({});
    setShowValidationAlert(false);

    try {
      await onSubmit?.(value);
      if (resetAfterSubmit) {
        const resetPatch: Record<string, unknown> = {};
        for (const item of fields) {
          if (isCustomElement(item)) continue;
          resetPatch[item.name] = getInitialValue(item);
        }
        onChange(resetPatch as Partial<typeof value>);
      }
      return true;
    } catch {
      return false;
    }
  }, [
    disabled,
    readOnly,
    isSubmitting,
    validateAll,
    scrollToFirstError,
    onSubmit,
    value,
    resetAfterSubmit,
    fields,
    onChange,
  ]);

  useEffect(() => {
    if (externalSubmitRef) {
      externalSubmitRef.current = executeSubmit;
    }
    return () => {
      if (externalSubmitRef) externalSubmitRef.current = null;
    };
  }, [externalSubmitRef, executeSubmit]);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      await executeSubmit();
    },
    [executeSubmit],
  );

  const isActionsDisabled = disabled || readOnly || isSubmitting || isLoading;

  const gridColumns = Math.max(1, Math.min(4, columns));

  const rootSx: SxProps<Theme> = [
    {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      fontFamily: "var(--cn-font-sans, system-ui, sans-serif)",
      ...(fieldSx as Record<string, unknown>),
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  return (
    <>
      {showValidationAlert && (
        <CnAlert
          mode="popup"
          open
          severity="error"
          title="Errores de validación"
          message="Hay campos con errores. Revisa los campos marcados en rojo."
          closable
          onClose={() => setShowValidationAlert(false)}
          autoHideDuration={5000}
        />
      )}

      <Box
        ref={setRefs}
        component="form"
        onSubmit={handleSubmit}
        noValidate
        className={className}
        sx={rootSx}
      >
        {(title || description) && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {title && (
              <Typography
                component="div"
                sx={{
                  fontSize: "var(--cn-font-size-xl, 18px)",
                  fontWeight: 700,
                  color: "var(--cn-color-text, #222831)",
                  lineHeight: 1.3,
                }}
              >
                {title}
              </Typography>
            )}
            {description && (
              <Typography
                component="div"
                sx={{
                  fontSize: "var(--cn-font-size-sm, 12px)",
                  color: "var(--cn-color-text-muted, #6e7682)",
                  lineHeight: 1.5,
                }}
              >
                {description}
              </Typography>
            )}
          </Box>
        )}

        {error && (
          <CnAlert severity="error" variant="outlined">
            {typeof error === "string" ? error : error}
          </CnAlert>
        )}

        <Grid container rowSpacing={1} columnSpacing={2} sx={{ width: "100%" }}>
          {visibleFields.map((item, index) => {
            if (isCustomElement(item)) {
              return (
                <Box key={`custom-${index}`} sx={{ display: "contents" }}>
                  {renderCustomElement(item.component, item.xs, item.md)}
                </Box>
              );
            }

            const field = item;
            const fieldValue = getNestedValue(value, field.name);

            const finalMd =
              field.md ??
              (gridColumns === 1 ? 12 : gridColumns === 2 ? 6 : gridColumns === 3 ? 4 : 3);

            return (
              <Box key={field.name} data-field-name={field.name} sx={{ display: "contents" }}>
                <CnFormFieldControl
                  field={{ ...field, md: finalMd }}
                  value={fieldValue}
                  error={formErrors[field.name]}
                  formValues={value}
                  disabled={disabled}
                  readOnly={readOnly}
                  onChange={(nextValue) => handleFieldChange(field, nextValue)}
                />
              </Box>
            );
          })}
        </Grid>

        {(showSubmitButton || showCancelButton) && (
          <>
            <Divider sx={{ marginBlock: "8px" }} />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              {showCancelButton && onCancel && (
                <CnButton
                  type="button"
                  variant={cancelButtonProps?.variant ?? "outlined"}
                  color={cancelButtonProps?.color ?? "neutral"}
                  size={cancelButtonProps?.size ?? "medium"}
                  fullWidth={cancelButtonProps?.fullWidth}
                  disabled={isActionsDisabled || cancelButtonProps?.disabled}
                  onClick={onCancel}
                  {...(cancelIcon && { startIcon: cancelIcon })}
                >
                  {cancelLabel}
                </CnButton>
              )}
              {showSubmitButton && onSubmit && (
                <CnButton
                  type="submit"
                  variant={submitButtonProps?.variant ?? "contained"}
                  color={submitButtonProps?.color ?? "primary"}
                  size={submitButtonProps?.size ?? "medium"}
                  fullWidth={submitButtonProps?.fullWidth}
                  loading={isSubmitting}
                  disabled={isActionsDisabled || submitButtonProps?.disabled}
                  {...(submitIcon && { startIcon: submitIcon })}
                >
                  {isSubmitting ? "Guardando..." : submitLabel}
                </CnButton>
              )}
            </Box>
          </>
        )}
      </Box>
    </>
  );
});

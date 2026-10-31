import type { GridSize } from "@mui/material";
import type { ReactNode } from "react";

export type CnFormFieldType =
  | "text"
  | "email"
  | "password"
  | "tel"
  | "url"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "switch"
  | "radio"
  | "custom";

export type CnFormSectionContext = {
  sectionId: string;
  index: number;
};

export type CnFormDynamicMessage =
  | string
  | ((formValues: Record<string, unknown>, ctx?: CnFormSectionContext) => string);

export type CnFormDynamicValue<T> =
  | T
  | ((formValues: Record<string, unknown>, ctx?: CnFormSectionContext) => T);

export type CnFormSelectOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

export type CnValidationRule =
  | { type: "required"; message?: CnFormDynamicMessage }
  | { type: "email"; message?: CnFormDynamicMessage }
  | { type: "url"; message?: CnFormDynamicMessage }
  | { type: "minLength"; value: number; message?: CnFormDynamicMessage }
  | { type: "maxLength"; value: number; message?: CnFormDynamicMessage }
  | { type: "exactLength"; value: number; message?: CnFormDynamicMessage }
  | { type: "min"; value: number; message?: CnFormDynamicMessage }
  | { type: "max"; value: number; message?: CnFormDynamicMessage }
  | { type: "between"; min: number; max: number; message?: CnFormDynamicMessage }
  | { type: "numeric"; message?: CnFormDynamicMessage }
  | { type: "integer"; message?: CnFormDynamicMessage }
  | { type: "positive"; message?: CnFormDynamicMessage }
  | { type: "negative"; message?: CnFormDynamicMessage }
  | { type: "pattern"; value: RegExp; message?: CnFormDynamicMessage }
  | { type: "equalTo"; field: string; message?: CnFormDynamicMessage }
  | { type: "notEqualTo"; field: string; message?: CnFormDynamicMessage }
  | { type: "passwordStrength"; level?: "weak" | "medium" | "strong"; message?: CnFormDynamicMessage }
  | {
      type: "custom";
      message: CnFormDynamicMessage;
      validate: (
        value: unknown,
        formValues: Record<string, unknown>,
        ctx?: CnFormSectionContext,
      ) => boolean;
    };

export type CnFormField = {
  name: string;
  type: CnFormFieldType;
  label?: string;
  placeholder?: string;
  helperText?: CnFormDynamicMessage;
  required?: CnFormDynamicValue<boolean>;
  disabled?: CnFormDynamicValue<boolean>;
  readOnly?: CnFormDynamicValue<boolean>;
  visibleWhen?: (formValues: Record<string, unknown>) => boolean;
  defaultValue?: unknown;
  rules?: CnValidationRule[];
  options?: CnFormSelectOption[] | CnFormDynamicValue<CnFormSelectOption[]>;
  multiline?: boolean;
  rows?: number;
  minRows?: number;
  maxRows?: number;
  min?: number;
  max?: number;
  step?: number;
  autoComplete?: string;
  autoFocus?: boolean;
  startAdornment?: ReactNode | ((value: unknown, formValues: Record<string, unknown>) => ReactNode);
  endAdornment?: ReactNode | ((value: unknown, formValues: Record<string, unknown>) => ReactNode);
  xs?: GridSize;
  sm?: GridSize;
  md?: GridSize;
  lg?: GridSize;
  xl?: GridSize;
  onFieldChange?: (
    newValue: unknown,
    formValues: Record<string, unknown>,
    fieldName: string,
  ) => Record<string, unknown> | void;
};

export type CnFormCustomElement = {
  type: "custom";
  component: ReactNode;
  xs?: GridSize;
  sm?: GridSize;
  md?: GridSize;
  lg?: GridSize;
  xl?: GridSize;
  visibleWhen?: (formValues: Record<string, unknown>) => boolean;
};

export type CnFormFieldOrCustom = CnFormField | CnFormCustomElement;

export type CnFormVariant = "simple";
export type CnFormSize = "sm" | "md" | "lg";
export type CnFormSubmitMode = "json";

export type CnFormButtonProps = {
  label?: string;
  variant?: "contained" | "outlined" | "text";
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info" | "accent" | "neutral";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  icon?: string;
  disabled?: boolean;
};

export type CnFormProps<TValue extends Record<string, unknown> = Record<string, unknown>> = {
  fields: readonly CnFormFieldOrCustom[];
  value: TValue;
  onChange: (patch: Partial<TValue>) => void;
  onSubmit?: (values: TValue) => void | Promise<void>;
  onCancel?: () => void;

  title?: ReactNode;
  description?: ReactNode;

  variant?: CnFormVariant;
  size?: CnFormSize;
  columns?: 1 | 2 | 3 | 4;

  submitLabel?: string;
  cancelLabel?: string;
  submitIcon?: string;
  cancelIcon?: string;
  submitButtonProps?: CnFormButtonProps;
  cancelButtonProps?: CnFormButtonProps;

  showSubmitButton?: boolean;
  showCancelButton?: boolean;

  isSubmitting?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  readOnly?: boolean;

  serverError?: unknown;
  error?: ReactNode;

  resetAfterSubmit?: boolean;
  scrollToFirstError?: boolean;

  externalSubmitRef?: { current: (() => Promise<boolean>) | null };

  allFieldsForValidation?: readonly CnFormFieldOrCustom[];

  sx?: React.ComponentProps<"form">["style"];
  className?: string;
  fieldSx?: React.ComponentProps<"div">["style"];
};

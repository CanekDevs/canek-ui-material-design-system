import type { ReactNode } from "react";

export type FieldStateInput = {
  externalError?: boolean;
  externalHelperText?: ReactNode;
  hasInteracted: boolean;
  hasValidationError: boolean;
  validationError: string;
  customError?: string | null;
};

export type FieldStateOutput = {
  error: boolean;
  helperText: string | undefined;
};

export const resolveFieldState = ({
  externalError,
  externalHelperText,
  hasInteracted,
  hasValidationError,
  validationError,
  customError,
}: FieldStateInput): FieldStateOutput => {
  if (customError) {
    return { error: true, helperText: customError };
  }
  if (externalError) {
    return {
      error: true,
      helperText: typeof externalHelperText === "string" ? externalHelperText : undefined,
    };
  }
  if (hasInteracted && hasValidationError) {
    return { error: true, helperText: validationError };
  }
  if (typeof externalHelperText === "string") {
    return { error: false, helperText: externalHelperText };
  }
  return { error: false, helperText: undefined };
};

import type { SxProps, Theme } from "@mui/material/styles";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { CnFormSectionContext, CnValidationRule } from "../components/CnForm/CnForm.types";
import { useFieldValidation } from "../components/CnForm/CnForm.validation";
import { resolveFieldState } from "./field-state";
import type { CnFieldSize } from "./field-styles";

/**
 * Props comunes a todos los campos de canek. Cada campo agrega las suyas.
 *
 * Validación: si se pasan `rules` el campo se valida solo (al perder el foco y,
 * tras la primera interacción, al cambiar). `error` + `helperText` externos
 * siempre tienen prioridad, lo que permite que `CnForm` (o cualquier otra
 * librería) controle los mensajes con `internalValidation={false}`.
 */
export type CnFieldBaseProps<TValue> = {
  id?: string;
  name?: string;
  label?: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;

  value?: TValue;
  defaultValue?: TValue;
  onChange?: (value: TValue) => void;
  onBlur?: () => void;

  rules?: CnValidationRule[];
  formValues?: Record<string, unknown>;
  sectionContext?: CnFormSectionContext;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  /** Desactiva la validación interna (los mensajes llegan por `error`/`helperText`). */
  internalValidation?: boolean;

  size?: CnFieldSize;
  /** Reserva el alto del helper text para que el layout no salte al aparecer un error. */
  reserveHelperSpace?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};

type UseControllableValueReturn<T> = [T, (next: T) => void];

/** Soporta modo controlado (`value`) y no controlado (`defaultValue`). */
export const useControllableValue = <T>(
  value: T | undefined,
  defaultValue: T | undefined,
  fallback: T,
  onChange?: (next: T) => void,
): UseControllableValueReturn<T> => {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<T>(defaultValue ?? fallback);
  const current = isControlled ? (value as T) : internal;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setValue];
};

export type UseFieldControlOptions = Pick<
  CnFieldBaseProps<unknown>,
  | "id"
  | "rules"
  | "formValues"
  | "sectionContext"
  | "validateOnChange"
  | "validateOnBlur"
  | "debounceMs"
  | "internalValidation"
  | "error"
  | "helperText"
  | "reserveHelperSpace"
>;

export type UseFieldControlReturn = {
  id: string;
  helperId: string;
  error: boolean;
  helperText: string | undefined;
  /** Llamar al perder el foco. */
  markBlurred: () => void;
  /** Llamar en cada cambio del usuario. */
  markChanged: () => void;
  reset: () => void;
};

/**
 * Combina validación interna, estado externo y accesibilidad (ids de label y
 * helper) en un solo hook reutilizado por todos los campos.
 */
export const useFieldControl = (
  value: unknown,
  {
    id: idProp,
    rules,
    formValues,
    sectionContext,
    validateOnChange,
    validateOnBlur,
    debounceMs,
    internalValidation = true,
    error: externalError,
    helperText: externalHelperText,
    reserveHelperSpace,
  }: UseFieldControlOptions,
): UseFieldControlReturn => {
  const autoId = useId();
  const id = idProp ?? `cn-field-${autoId.replace(/:/g, "")}`;

  const validation = useFieldValidation(value, internalValidation ? rules : undefined, formValues, {
    sectionContext,
    validateOnChange,
    validateOnBlur,
    debounceMs,
  });

  const state = resolveFieldState({
    externalError,
    externalHelperText,
    hasInteracted: validation.hasInteracted,
    hasValidationError: validation.hasError,
    validationError: validation.error,
  });

  return {
    id,
    helperId: `${id}-helper`,
    error: state.error,
    helperText: state.helperText ?? (reserveHelperSpace ? " " : undefined),
    markBlurred: validation.handleBlur,
    markChanged: validation.handleChange,
    reset: validation.reset,
  };
};

/**
 * Mantiene un borrador local mientras el usuario escribe y lo sincroniza con el
 * valor externo solo cuando este cambia por una causa ajena al propio campo
 * (reset, carga de datos, `onFieldChange` de otro campo...).
 */
export const useDraftValue = <T>(
  external: T,
  toDraft: (value: T) => string,
): [string, (draft: string) => void, (emitted: T) => void] => {
  const [draft, setDraft] = useState<string>(() => toDraft(external));
  const lastEmittedRef = useRef<T>(external);
  const toDraftRef = useRef(toDraft);
  toDraftRef.current = toDraft;

  useEffect(() => {
    if (Object.is(external, lastEmittedRef.current)) return;
    lastEmittedRef.current = external;
    setDraft(toDraftRef.current(external));
  }, [external]);

  const markEmitted = useCallback((emitted: T) => {
    lastEmittedRef.current = emitted;
  }, []);

  return [draft, setDraft, markEmitted];
};

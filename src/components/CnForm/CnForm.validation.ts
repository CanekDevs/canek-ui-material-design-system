import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CnFormDynamicMessage,
  CnFormSectionContext,
  CnValidationRule,
} from "./CnForm.types";

export type ValidatorFn = (
  value: unknown,
  rule: CnValidationRule,
  formValues: Record<string, unknown>,
  sectionContext?: CnFormSectionContext,
) => string | null;

const resolveMessage = (
  message: CnFormDynamicMessage | undefined,
  formValues: Record<string, unknown>,
  ctx?: CnFormSectionContext,
): string | undefined => {
  if (message === undefined) return undefined;
  if (typeof message === "function") return message(formValues, ctx);
  return message;
};

const isEmpty = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  value === "" ||
  value === false ||
  (Array.isArray(value) && value.length === 0);

const baseValidators: Record<string, ValidatorFn> = {
  required: (value, rule, formValues, ctx) => {
    if (isEmpty(value)) {
      return resolveMessage(rule.message, formValues, ctx) ?? "Campo requerido";
    }
    return null;
  },

  email: (value, rule, formValues) => {
    if (value && typeof value === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return resolveMessage(rule.message, formValues) ?? "Email inválido";
    }
    return null;
  },

  url: (value, rule, formValues) => {
    if (value && typeof value === "string" && !/^https?:\/\/.+/i.test(value)) {
      return resolveMessage(rule.message, formValues) ?? "URL inválida";
    }
    return null;
  },

  minLength: (value, rule, formValues) => {
    if (rule.type !== "minLength") return null;
    if (value && typeof value === "string" && value.length < rule.value) {
      return resolveMessage(rule.message, formValues) ?? `Mínimo ${rule.value} caracteres`;
    }
    return null;
  },

  maxLength: (value, rule, formValues) => {
    if (rule.type !== "maxLength") return null;
    if (value && typeof value === "string" && value.length > rule.value) {
      return resolveMessage(rule.message, formValues) ?? `Máximo ${rule.value} caracteres`;
    }
    return null;
  },

  exactLength: (value, rule, formValues) => {
    if (rule.type !== "exactLength") return null;
    if (value && typeof value === "string" && value.length !== rule.value) {
      return resolveMessage(rule.message, formValues) ??
        `Debe tener exactamente ${rule.value} caracteres`;
    }
    return null;
  },

  min: (value, rule, formValues) => {
    if (rule.type !== "min") return null;
    if (value !== "" && value !== null && value !== undefined && Number(value) < rule.value) {
      return resolveMessage(rule.message, formValues) ?? `Mínimo ${rule.value}`;
    }
    return null;
  },

  max: (value, rule, formValues) => {
    if (rule.type !== "max") return null;
    if (value !== "" && value !== null && value !== undefined && Number(value) > rule.value) {
      return resolveMessage(rule.message, formValues) ?? `Máximo ${rule.value}`;
    }
    return null;
  },

  between: (value, rule, formValues) => {
    if (rule.type !== "between") return null;
    if (value === "" || value === null || value === undefined) return null;
    const num = Number(value);
    if (num < rule.min) {
      return resolveMessage(rule.message, formValues) ?? `Debe ser mayor o igual a ${rule.min}`;
    }
    if (num > rule.max) {
      return resolveMessage(rule.message, formValues) ?? `Debe ser menor o igual a ${rule.max}`;
    }
    return null;
  },

  numeric: (value, rule, formValues) => {
    if (value === "" || value === null || value === undefined) return null;
    if (typeof value === "number") return null;
    if (Number.isNaN(Number(value))) {
      return resolveMessage(rule.message, formValues) ?? "Debe ser numérico";
    }
    return null;
  },

  integer: (value, rule, formValues) => {
    if (value === "" || value === null || value === undefined) return null;
    const num = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(num)) {
      return resolveMessage(rule.message, formValues) ?? "Debe ser un número entero";
    }
    return null;
  },

  positive: (value, rule, formValues) => {
    if (value === "" || value === null || value === undefined) return null;
    if (Number(value) <= 0) {
      return resolveMessage(rule.message, formValues) ?? "Debe ser mayor a 0";
    }
    return null;
  },

  negative: (value, rule, formValues) => {
    if (value === "" || value === null || value === undefined) return null;
    if (Number(value) >= 0) {
      return resolveMessage(rule.message, formValues) ?? "Debe ser menor a 0";
    }
    return null;
  },

  pattern: (value, rule, formValues) => {
    if (rule.type !== "pattern") return null;
    if (value && typeof value === "string" && !rule.value.test(value)) {
      return resolveMessage(rule.message, formValues) ?? "Formato inválido";
    }
    return null;
  },

  equalTo: (value, rule, formValues) => {
    if (rule.type !== "equalTo") return null;
    const other = getNestedFieldValue(formValues, rule.field);
    if (value !== other) {
      return resolveMessage(rule.message, formValues) ?? `No coincide con ${rule.field}`;
    }
    return null;
  },

  notEqualTo: (value, rule, formValues) => {
    if (rule.type !== "notEqualTo") return null;
    const other = getNestedFieldValue(formValues, rule.field);
    if (value === other) {
      return resolveMessage(rule.message, formValues) ?? `No puede ser igual a ${rule.field}`;
    }
    return null;
  },

  passwordStrength: (value, rule, formValues) => {
    if (rule.type !== "passwordStrength") return null;
    if (!value || typeof value !== "string") return null;
    const level = rule.level ?? "medium";
    let score = 0;
    if (/[a-z]/.test(value)) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^a-zA-Z0-9]/.test(value)) score++;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;

    const required = level === "weak" ? 3 : level === "medium" ? 4 : 5;

    if (score < required) {
      const missing: string[] = [];
      if (value.length < 8) missing.push("mínimo 8 caracteres");
      if (!/[A-Z]/.test(value)) missing.push("una mayúscula");
      if (!/[a-z]/.test(value)) missing.push("una minúscula");
      if (!/[0-9]/.test(value)) missing.push("un número");
      if (!/[^a-zA-Z0-9]/.test(value)) missing.push("un carácter especial");
      return resolveMessage(rule.message, formValues) ??
        `Contraseña débil. Requiere: ${missing.join(", ")}`;
    }
    return null;
  },

  custom: (value, rule, formValues, ctx) => {
    if (rule.type !== "custom") return null;
    const isValid = rule.validate(value, formValues, ctx);
    if (!isValid) {
      return resolveMessage(rule.message, formValues, ctx) ?? "Validación fallida";
    }
    return null;
  },
};

const getNestedFieldValue = (obj: Record<string, unknown>, path: string): unknown => {
  if (!path) return undefined;
  if (!path.includes(".")) return obj[path];
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
};

const customValidators: Record<string, ValidatorFn> = {};

export const registerValidator = (type: string, fn: ValidatorFn): void => {
  customValidators[type] = fn;
};

export const validateFieldValue = (
  value: unknown,
  rules: CnValidationRule[] | undefined,
  formValues: Record<string, unknown> = {},
  ctx?: CnFormSectionContext,
): string => {
  if (!rules || rules.length === 0) return "";

  for (const rule of rules) {
    const validator = customValidators[rule.type] ?? baseValidators[rule.type];
    if (!validator) continue;
    const error = validator(value, rule, formValues, ctx);
    if (error) return error;
  }

  return "";
};

export const combineRules = (
  required: boolean | undefined,
  rules: CnValidationRule[] | undefined,
): CnValidationRule[] | undefined => {
  const result: CnValidationRule[] = [];

  if (required) {
    const alreadyRequired = rules?.some((rule) => rule.type === "required") ?? false;
    if (!alreadyRequired) {
      result.push({ type: "required", message: "Campo requerido" });
    }
  }

  if (rules && rules.length > 0) {
    result.push(...rules);
  }

  return result.length > 0 ? result : undefined;
};

export type UseFieldValidationOptions = {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
};

export const useFieldValidation = (
  value: unknown,
  rules: CnValidationRule[] | undefined,
  formValues: Record<string, unknown> = {},
  options: UseFieldValidationOptions = {},
) => {
  const { validateOnChange = true, validateOnBlur = true, debounceMs = 400 } = options;
  const [error, setError] = useState<string>("");
  const [hasInteracted, setHasInteracted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validate = useCallback((): string => {
    const result = validateFieldValue(value, rules, formValues);
    setError(result);
    return result;
  }, [value, rules, formValues]);

  useEffect(() => {
    if (!validateOnChange || !hasInteracted) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      validate();
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, validate, validateOnChange, hasInteracted, debounceMs]);

  const handleBlur = useCallback(() => {
    setHasInteracted(true);
    if (validateOnBlur) validate();
  }, [validate, validateOnBlur]);

  const handleChange = useCallback(() => {
    if (!hasInteracted) setHasInteracted(true);
  }, [hasInteracted]);

  const reset = useCallback(() => {
    setHasInteracted(false);
    setError("");
  }, []);

  return { error, hasInteracted, validate, handleBlur, handleChange, reset };
};

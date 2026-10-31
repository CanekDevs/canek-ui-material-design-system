import type { CnValidationRule } from "../components/CnForm/CnForm.types";

export const capitalizeText = (value: string): string => {
  if (!value) return value;
  const words = value.split(/(\s+)/);
  return words
    .map((word) => {
      if (/^\s+$/.test(word) || word.length === 0) return word;
      let firstLetterIndex = -1;
      for (let i = 0; i < word.length; i++) {
        if (/[\p{L}]/u.test(word[i])) {
          firstLetterIndex = i;
          break;
        }
      }
      if (firstLetterIndex === -1) return word;
      const before = word.slice(0, firstLetterIndex);
      const first = word[firstLetterIndex];
      const after = word.slice(firstLetterIndex + 1);
      return `${before}${first.toLocaleUpperCase()}${after.toLocaleLowerCase()}`;
    })
    .join("");
};

export const transformValue = (value: string, transform: string): string => {
  if (!value) return value;
  switch (transform) {
    case "uppercase":
      return value.toLocaleUpperCase();
    case "lowercase":
      return value.toLocaleLowerCase();
    case "capitalize":
      return capitalizeText(value);
    default:
      return value;
  }
};

export const getFilterPattern = (rules?: CnValidationRule[]): RegExp | null => {
  if (!rules || rules.length === 0) return null;
  for (const rule of rules) {
    switch (rule.type) {
      case "alphanumeric":
        return /[^A-Za-z0-9\s]/g;
      case "numeric":
      case "integer":
      case "positive":
      case "negative":
      case "min":
      case "max":
        return /[^\d.-]/g;
      case "postalCode":
        return /\D/g;
      case "rfc":
      case "curp":
        return /[^A-Za-z0-9Ñ&]/g;
      case "email":
        return /[^a-zA-Z0-9@._-]/g;
      case "passwordStrength":
        return null;
      case "tel":
      case "phone":
        return /[^\d\s+\-()]/g;
      case "creditCard":
        return /\D/g;
      case "url":
        return /[^a-zA-Z0-9:/?#[\]@!$&'()*+,;=%-.]/g;
      case "pattern":
        if (rule.filterPattern) return rule.filterPattern;
        break;
    }
  }
  return null;
};

export const getMaxLength = (rules?: CnValidationRule[]): number | undefined => {
  if (!rules || rules.length === 0) return undefined;
  for (const rule of rules) {
    switch (rule.type) {
      case "postalCode":
        return 10;
      case "rfc":
        return 13;
      case "curp":
        return 18;
      case "creditCard":
        return 19;
      case "ssn":
        return 11;
      case "ine":
        return 18;
      case "passport":
        return 12;
      case "tel":
      case "phone":
        return 15;
      case "maxLength":
        return rule.value;
    }
  }
  return undefined;
};

export const getInputModeFromRules = (
  rules?: CnValidationRule[],
): "numeric" | "decimal" | "tel" | "email" | "url" | "text" => {
  if (!rules || rules.length === 0) return "text";
  for (const rule of rules) {
    switch (rule.type) {
      case "numeric":
      case "integer":
      case "creditCard":
      case "postalCode":
        return "numeric";
      case "tel":
      case "phone":
        return "tel";
      case "email":
        return "email";
      case "url":
        return "url";
      case "min":
      case "max":
      case "positive":
      case "negative":
        return "decimal";
    }
  }
  return "text";
};

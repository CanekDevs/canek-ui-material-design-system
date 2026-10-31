import { describe, expect, it } from "vitest";
import type { CnValidationRule } from "./CnForm.types";
import { combineRules, registerValidator, validateFieldValue } from "./CnForm.validation";

describe("CnForm.validation", () => {
  it("required fails on empty string", () => {
    const rules: CnValidationRule[] = [{ type: "required" }];
    expect(validateFieldValue("", rules)).toBe("Campo requerido");
  });

  it("required fails on null", () => {
    const rules: CnValidationRule[] = [{ type: "required" }];
    expect(validateFieldValue(null, rules)).toBe("Campo requerido");
  });

  it("required passes on non-empty value", () => {
    const rules: CnValidationRule[] = [{ type: "required" }];
    expect(validateFieldValue("hello", rules)).toBe("");
  });

  it("required accepts custom message", () => {
    const rules: CnValidationRule[] = [{ type: "required", message: "Falta" }];
    expect(validateFieldValue("", rules)).toBe("Falta");
  });

  it("email validates format", () => {
    const rules: CnValidationRule[] = [{ type: "email" }];
    expect(validateFieldValue("not-an-email", rules)).toBe("Email inválido");
    expect(validateFieldValue("hello@example.com", rules)).toBe("");
  });

  it("url validates format", () => {
    const rules: CnValidationRule[] = [{ type: "url" }];
    expect(validateFieldValue("not-a-url", rules)).toBe("URL inválida");
    expect(validateFieldValue("https://example.com", rules)).toBe("");
  });

  it("minLength enforces minimum", () => {
    const rules: CnValidationRule[] = [{ type: "minLength", value: 3 }];
    expect(validateFieldValue("ab", rules)).toBe("Mínimo 3 caracteres");
    expect(validateFieldValue("abc", rules)).toBe("");
  });

  it("maxLength enforces maximum", () => {
    const rules: CnValidationRule[] = [{ type: "maxLength", value: 3 }];
    expect(validateFieldValue("abcd", rules)).toBe("Máximo 3 caracteres");
  });

  it("numeric rejects non-numbers", () => {
    const rules: CnValidationRule[] = [{ type: "numeric" }];
    expect(validateFieldValue("abc", rules)).toBe("Debe ser numérico");
    expect(validateFieldValue("42", rules)).toBe("");
  });

  it("integer rejects decimals", () => {
    const rules: CnValidationRule[] = [{ type: "integer" }];
    expect(validateFieldValue("3.14", rules)).toBe("Debe ser un número entero");
    expect(validateFieldValue("42", rules)).toBe("");
  });

  it("min enforces minimum", () => {
    const rules: CnValidationRule[] = [{ type: "min", value: 10 }];
    expect(validateFieldValue(5, rules)).toBe("Mínimo 10");
    expect(validateFieldValue(10, rules)).toBe("");
  });

  it("max enforces maximum", () => {
    const rules: CnValidationRule[] = [{ type: "max", value: 10 }];
    expect(validateFieldValue(15, rules)).toBe("Máximo 10");
  });

  it("pattern validates regex", () => {
    const rules: CnValidationRule[] = [{ type: "pattern", value: /^\d{3}$/ }];
    expect(validateFieldValue("12", rules)).toBe("Formato inválido");
    expect(validateFieldValue("123", rules)).toBe("");
  });

  it("equalTo compares with other field", () => {
    const rules: CnValidationRule[] = [{ type: "equalTo", field: "password" }];
    expect(validateFieldValue("abc", rules, { password: "xyz" })).toBe("No coincide con password");
    expect(validateFieldValue("abc", rules, { password: "abc" })).toBe("");
  });

  it("passwordStrength enforces strong password", () => {
    const rules: CnValidationRule[] = [{ type: "passwordStrength", level: "strong" }];
    expect(validateFieldValue("weak", rules)).not.toBe("");
    expect(validateFieldValue("MyP@ssw0rd123!", rules)).toBe("");
  });

  it("custom validator runs", () => {
    const rules: CnValidationRule[] = [
      {
        type: "custom",
        message: "Debe ser par",
        validate: (v) => Number(v) % 2 === 0,
      },
    ];
    expect(validateFieldValue(3, rules)).toBe("Debe ser par");
    expect(validateFieldValue(4, rules)).toBe("");
  });

  it("registerValidator extends rules", () => {
    registerValidator("alwaysFail", () => "Siempre falla");
    const rules = [{ type: "alwaysFail" }] as unknown as CnValidationRule[];
    expect(validateFieldValue("any", rules)).toBe("Siempre falla");
  });

  it("combineRules merges required with rules", () => {
    const result = combineRules(true, [{ type: "email" }]);
    expect(result).toHaveLength(2);
    expect(result?.[0].type).toBe("required");
    expect(result?.[1].type).toBe("email");
  });

  it("combineRules does not duplicate required", () => {
    const result = combineRules(true, [{ type: "required" }]);
    expect(result).toHaveLength(1);
  });

  it("combineRules returns undefined when empty", () => {
    expect(combineRules(false, [])).toBeUndefined();
  });
});

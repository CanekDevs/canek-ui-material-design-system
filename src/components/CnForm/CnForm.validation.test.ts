import { describe, expect, it } from "vitest";
import type { CnValidationRule } from "./CnForm.types";
import {
  combineRules,
  isEmptyValue,
  parseDateInput,
  registerValidator,
  validateFieldValue,
} from "./CnForm.validation";

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
    expect(validateFieldValue("abc", rules, { password: "xyz" })).toBe("Los valores no coinciden");
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

  it("required treats whitespace-only strings as empty", () => {
    const rules: CnValidationRule[] = [{ type: "required" }];
    expect(validateFieldValue("   ", rules)).toBe("Campo requerido");
    expect(validateFieldValue(0, rules)).toBe("");
  });

  it("date rejects impossible dates and enforces min/max", () => {
    const rules: CnValidationRule[] = [
      { type: "date", minDate: "2024-01-10", maxDate: "2024-12-31" },
    ];
    expect(validateFieldValue("2024-02-30", rules)).toContain("Fecha no válida");
    expect(validateFieldValue("2024-01-05", rules)).toContain("posterior");
    expect(validateFieldValue("2025-01-05", rules)).toContain("anterior");
    expect(validateFieldValue("2024-06-15", rules)).toBe("");
  });

  it("date supports DD/MM/YYYY", () => {
    const rules: CnValidationRule[] = [{ type: "date", format: "DD/MM/YYYY" }];
    expect(validateFieldValue("31/12/2024", rules)).toBe("");
    expect(validateFieldValue("12/31/2024", rules)).not.toBe("");
  });

  it("decimal accepts negatives", () => {
    const rules: CnValidationRule[] = [{ type: "decimal", decimals: 2 }];
    expect(validateFieldValue("-12.5", rules)).toBe("");
    expect(validateFieldValue("1.234", rules)).not.toBe("");
  });

  it("ip validates octet ranges", () => {
    const rules: CnValidationRule[] = [{ type: "ip", version: "ipv4" }];
    expect(validateFieldValue("192.168.0.1", rules)).toBe("");
    expect(validateFieldValue("999.1.1.1", rules)).not.toBe("");
  });

  it("minItems / maxItems validate arrays", () => {
    expect(validateFieldValue(["a"], [{ type: "minItems", value: 2 }])).toContain("al menos 2");
    expect(validateFieldValue(["a", "b", "c"], [{ type: "maxItems", value: 2 }])).toContain(
      "máximo 2",
    );
    expect(validateFieldValue(["a", "b"], [{ type: "minItems", value: 2 }])).toBe("");
  });

  it("phone accepts national and E.164 numbers", () => {
    const rules: CnValidationRule[] = [{ type: "phone", country: "MX" }];
    expect(validateFieldValue("55 1234 5678", rules)).toBe("");
    expect(validateFieldValue("+525512345678", rules)).toBe("");
    expect(validateFieldValue("+52551234", rules)).toContain("México");
  });

  it("isEmptyValue handles common empty shapes", () => {
    expect(isEmptyValue("")).toBe(true);
    expect(isEmptyValue([])).toBe(true);
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue(Number.NaN)).toBe(true);
    expect(isEmptyValue("a")).toBe(false);
  });

  it("parseDateInput is strict", () => {
    expect(parseDateInput("2024-02-29")).not.toBeNull();
    expect(parseDateInput("2023-02-29")).toBeNull();
  });
});

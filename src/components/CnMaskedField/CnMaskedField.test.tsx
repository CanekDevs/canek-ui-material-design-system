import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { applyMask, clabeCheck, detectCardBrand, luhnCheck, unmask } from "../../utils/mask-utils";
import { validateFieldValue } from "../CnForm/CnForm.validation";
import { buildMaskRules, CnMaskedField } from "./CnMaskedField";

describe("mask utils", () => {
  it("applies and removes masks", () => {
    expect(applyMask("4111111111111111", "#### #### #### ####")).toBe("4111 1111 1111 1111");
    expect(applyMask("ab12", "AA-##")).toBe("AB-12");
    expect(unmask("AB-12", "AA-##")).toBe("AB12");
    expect(applyMask("12x3", "###")).toBe("123");
  });

  it("validates Luhn, CLABE and detects brands", () => {
    expect(luhnCheck("4111111111111111")).toBe(true);
    expect(luhnCheck("4111111111111112")).toBe(false);
    expect(clabeCheck("002010077777777771")).toBe(true);
    expect(clabeCheck("002010077777777772")).toBe(false);
    expect(detectCardBrand("5500")).toBe("mastercard");
    expect(detectCardBrand("3782")).toBe("amex");
  });

  it("builds completeness rules", () => {
    const rules = buildMaskRules("#####");
    expect(validateFieldValue("123", rules)).toContain("incompleto");
    expect(validateFieldValue("12345", rules)).toBe("");
  });
});

describe("CnMaskedField", () => {
  it("shows the mask while emitting the raw value", () => {
    const onChange = vi.fn();
    render(<CnMaskedField label="Tarjeta" preset="creditCard" onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "41111111" } });
    expect(input).toHaveValue("4111 1111");
    expect(onChange).toHaveBeenLastCalledWith("41111111");
  });

  it("detects the card brand", () => {
    render(<CnMaskedField label="Tarjeta" preset="creditCard" defaultValue="4111111111111111" />);
    expect(screen.getByLabelText("Tarjeta VISA")).toBeInTheDocument();
  });

  it("can emit the masked value", () => {
    const onChange = vi.fn();
    render(<CnMaskedField label="CP" mask="##-###" valueMode="masked" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "12345" } });
    expect(onChange).toHaveBeenLastCalledWith("12-345");
  });

  it("validates the CLABE check digit on blur", async () => {
    render(<CnMaskedField label="CLABE" preset="clabe" defaultValue="002010077777777772" />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(await screen.findByText(/CLABE no válida/)).toBeInTheDocument();
  });
});

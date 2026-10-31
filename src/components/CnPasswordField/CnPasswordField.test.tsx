import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { validateFieldValue } from "../CnForm/CnForm.validation";
import { buildPasswordRule, CnPasswordField, generatePassword } from "./CnPasswordField";

describe("CnPasswordField", () => {
  it("generates strong passwords with every character type", () => {
    const password = generatePassword(16);
    expect(password).toHaveLength(16);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/\d/);
    expect(password).toMatch(/[^A-Za-z0-9]/);
  });

  it("builds a rule from requirements", () => {
    const rule = buildPasswordRule({ minLength: 8, number: true });
    expect(validateFieldValue("corta", [rule])).not.toBe("");
    expect(validateFieldValue("suficiente1", [rule])).toBe("");
  });

  it("checks requirements as the user types", () => {
    const { container } = render(<CnPasswordField label="Contraseña" />);
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "abc" } });
    expect(screen.getByRole("list", { name: "Requisitos de la contraseña" })).toBeInTheDocument();
    expect(container.querySelectorAll("li[data-met]")).toHaveLength(1);
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "Abcdefg1" } });
    expect(container.querySelectorAll("li[data-met]")).toHaveLength(4);
  });

  it("fills a generated password", () => {
    const onChange = vi.fn();
    render(<CnPasswordField label="Contraseña" allowGenerate onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Generar contraseña segura/ }));
    expect(onChange.mock.calls[0][0]).toHaveLength(16);
  });
});

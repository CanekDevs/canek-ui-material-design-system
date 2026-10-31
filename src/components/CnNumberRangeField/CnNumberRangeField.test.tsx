import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { validateFieldValue } from "../CnForm/CnForm.validation";
import { CnNumberRangeField, NUMBER_RANGE_RULES } from "./CnNumberRangeField";
import { CnCountryField, getCountryOptions } from "../CnCountryField";
import { CnFlagIcon } from "../CnFlagIcon";
import { CnFormSkeleton } from "../CnFormSkeleton";
import { CnSignatureField } from "../CnSignatureField";

describe("CnNumberRangeField", () => {
  it("validates the order", () => {
    expect(validateFieldValue([10, 5], NUMBER_RANGE_RULES)).toContain("mínimo");
    expect(validateFieldValue([5, 10], NUMBER_RANGE_RULES)).toBe("");
  });

  it("emits a tuple", () => {
    const onChange = vi.fn();
    render(<CnNumberRangeField label="Precio" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Mínimo"), { target: { value: "100" } });
    expect(onChange).toHaveBeenLastCalledWith([100, null]);
  });
});

describe("CnCountryField and flags", () => {
  it("builds localized options with priority group", () => {
    const options = getCountryOptions(["MX", "AR", "US"], "es-MX", ["US"]);
    expect(options[0]).toMatchObject({ value: "US", group: "Frecuentes" });
    expect(options.map((o) => o.value)).toEqual(["US", "AR", "MX"]);
    expect(options.find((o) => o.value === "MX")?.searchText).toContain("+52");
  });

  it("selects a country", () => {
    const onChange = vi.fn();
    render(<CnCountryField label="País" countries={["MX", "CO"]} onChange={onChange} />);
    const input = screen.getByRole("combobox");
    act(() => input.focus());
    fireEvent.change(input, { target: { value: "colom" } });
    fireEvent.click(screen.getByText("Colombia"));
    expect(onChange).toHaveBeenCalledWith("CO");
  });

  it("renders built-in flags and a fallback", () => {
    const { container, rerender } = render(<CnFlagIcon code="mx" name="México" />);
    expect(screen.getByRole("img", { name: "México" })).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeNull();
    rerender(<CnFlagIcon code="JP" />);
    expect(screen.getByText("JP")).toBeInTheDocument();
  });
});

describe("CnFormSkeleton and CnSignatureField", () => {
  beforeAll(() => {
    // jsdom no implementa canvas.
    HTMLCanvasElement.prototype.getContext = (() => null) as never;
  });

  it("renders a busy skeleton", () => {
    render(<CnFormSkeleton rows={2} columns={2} showActions />);
    expect(screen.getByRole("status", { name: "Cargando formulario" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("shows an existing signature and clears it", () => {
    const onChange = vi.fn();
    const png = "data:image/png;base64,iVBORw0KGgo=";
    render(<CnSignatureField label="Firma" value={png} onChange={onChange} />);
    expect(screen.getByRole("img", { name: "Firma" })).toHaveAttribute("src", png);
    fireEvent.click(screen.getByRole("button", { name: /Limpiar/ }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("offers a typed alternative", () => {
    render(<CnSignatureField label="Firma" />);
    fireEvent.click(screen.getByRole("button", { name: /Escribir/ }));
    expect(screen.getByLabelText("Escribe tu nombre")).toBeInTheDocument();
  });
});

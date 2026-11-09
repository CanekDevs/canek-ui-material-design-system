import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { validateFieldValue } from "../CnForm/CnForm.validation";
import { buildAddressRules, CnAddressField, getMissingAddressParts } from "./CnAddressField";
import type { CnAddressFieldProps, CnAddressValue } from "./CnAddressField";
import { CnAddressFieldSkeleton } from "./CnAddressFieldSkeleton";

const Controlled = ({
  onChange,
  ...props
}: Omit<CnAddressFieldProps, "value"> & { initial?: CnAddressValue }) => {
  const [value, setValue] = useState<CnAddressValue>(props.initial ?? {});
  return (
    <CnAddressField
      label="Domicilio"
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
};

describe("CnAddressField", () => {
  it("edits parts into a composite value", () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Calle"), { target: { value: "Reforma" } });
    fireEvent.change(screen.getByLabelText("Núm. exterior"), { target: { value: "222" } });
    fireEvent.change(screen.getByLabelText("Código postal"), { target: { value: "06-600x" } });
    expect(onChange).toHaveBeenLastCalledWith({
      street: "Reforma",
      exteriorNumber: "222",
      postalCode: "06600",
    });
  });

  it("autofills from the postal code and turns colonia into a select", async () => {
    const onChange = vi.fn();
    const lookup = vi.fn(async () => ({
      colonias: ["Centro", "Barrio Antiguo"],
      municipio: "Monterrey",
      estado: "Nuevo León",
    }));
    render(<Controlled onChange={onChange} onPostalCodeLookup={lookup} />);
    fireEvent.change(screen.getByLabelText("Código postal"), { target: { value: "64000" } });
    expect(lookup).toHaveBeenCalledWith("64000");
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ municipality: "Monterrey", state: "Nuevo León" }),
      ),
    );
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Colonia" }));
    const listbox = await screen.findByRole("listbox");
    fireEvent.click(within(listbox).getByText("Barrio Antiguo"));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ neighborhood: "Barrio Antiguo", postalCode: "64000" }),
    );
  });

  it("auto-selects a single colonia and reports unknown codes", async () => {
    const onChange = vi.fn();
    const lookup = vi.fn(async (cp: string) =>
      cp === "06700" ? { colonias: ["Roma Norte"], municipio: "Cuauhtémoc" } : null,
    );
    render(<Controlled onChange={onChange} onPostalCodeLookup={lookup} />);
    const cp = screen.getByLabelText("Código postal");
    fireEvent.change(cp, { target: { value: "06700" } });
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ neighborhood: "Roma Norte", municipality: "Cuauhtémoc" }),
      ),
    );
    fireEvent.change(cp, { target: { value: "99999" } });
    expect(await screen.findByText(/No encontramos el código postal/)).toBeInTheDocument();
  });

  it("shows only the chosen parts", () => {
    render(<CnAddressField fields={["street", "country"]} labels={{ country: "Nación" }} />);
    expect(screen.getByLabelText("Calle")).toBeInTheDocument();
    expect(screen.getByLabelText("Nación")).toBeInTheDocument();
    expect(screen.queryByLabelText("Código postal")).not.toBeInTheDocument();
  });

  it("validates required parts and the postal code", () => {
    expect(getMissingAddressParts({ street: "A" }, ["street", "state"])).toEqual(["state"]);
    const rules = buildAddressRules({ required: true });
    expect(validateFieldValue({ street: "A", exteriorNumber: "1" }, rules)).toBe(
      "Completa: Código postal, Colonia, Municipio / alcaldía, Estado",
    );
    expect(validateFieldValue({ postalCode: "123" }, buildAddressRules())).toBe(
      "El código postal debe tener 5 dígitos",
    );
  });

  it("marks missing parts after blur", () => {
    render(<CnAddressField label="Domicilio" required fields={["street", "postalCode"]} />);
    const street = screen.getByLabelText(/Calle/);
    fireEvent.focus(street);
    fireEvent.blur(street);
    expect(screen.getByText("Completa: Calle, Código postal")).toBeInTheDocument();
    expect(street).toHaveAttribute("aria-invalid", "true");
  });

  it("renders its skeleton", () => {
    const { container, rerender } = render(<CnAddressFieldSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "address-field");
    expect(container.querySelectorAll("[data-cn-skeleton-part]")).toHaveLength(8);
    rerender(<CnAddressField fields={["street", "state"]} skeleton />);
    expect(container.querySelectorAll("[data-cn-skeleton-part]")).toHaveLength(2);
  });
});

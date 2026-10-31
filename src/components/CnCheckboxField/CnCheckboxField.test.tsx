import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnCheckboxField } from "./CnCheckboxField";

const options = [
  { value: "a", label: "Alfa" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma", disabled: true },
];

describe("CnCheckboxField", () => {
  it("works as a single boolean checkbox", () => {
    const onChange = vi.fn();
    render(<CnCheckboxField label="Acepto" onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Acepto/ }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("works as a group and keeps option order", () => {
    const onChange = vi.fn();
    render(<CnCheckboxField label="Letras" options={options} value={["b"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Alfa" }));
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
  });

  it("select all skips disabled options", () => {
    const onChange = vi.fn();
    render(<CnCheckboxField label="Letras" options={options} selectAll onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Seleccionar todo" }));
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
  });

  it("validates required true on change", async () => {
    render(
      <CnCheckboxField
        label="Términos"
        rules={[{ type: "required", message: "Debes aceptar" }]}
        defaultValue
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: /Términos/ }));
    expect(await screen.findByText("Debes aceptar")).toBeInTheDocument();
  });

  it("does not toggle when readOnly", () => {
    const onChange = vi.fn();
    render(<CnCheckboxField label="Fijo" readOnly onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Fijo/ }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

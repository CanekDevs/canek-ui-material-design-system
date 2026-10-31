import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnSelectField } from "./CnSelectField";

const options = [
  { value: 1, label: "Uno" },
  { value: 2, label: "Dos", description: "Segundo" },
  { value: "3", label: "Tres", disabled: true },
];

const open = () => fireEvent.mouseDown(screen.getByRole("combobox"));

describe("CnSelectField", () => {
  it("renders label and selected option", () => {
    render(<CnSelectField label="Número" options={options} value={2} onChange={() => {}} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Dos");
  });

  it("emits the original option type (number)", () => {
    const onChange = vi.fn();
    render(<CnSelectField label="Número" options={options} onChange={onChange} />);
    open();
    fireEvent.click(within(screen.getByRole("listbox")).getByText("Uno"));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("supports multiple selection with chips", () => {
    const onChange = vi.fn();
    render(
      <CnSelectField
        label="Varios"
        options={options}
        multiple
        chips
        value={[1]}
        onChange={onChange}
      />,
    );
    open();
    fireEvent.click(within(screen.getByRole("listbox")).getByText("Dos"));
    expect(onChange).toHaveBeenCalledWith([1, 2]);
  });

  it("shows placeholder when empty", () => {
    render(<CnSelectField label="Rol" placeholder="Elige uno" options={options} />);
    expect(screen.getByText("Elige uno")).toBeInTheDocument();
  });

  it("clears the selection", () => {
    const onChange = vi.fn();
    render(<CnSelectField label="Rol" clearable options={options} value={1} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Limpiar selección" }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("validates required internally after blur", async () => {
    render(<CnSelectField label="Rol" options={options} rules={[{ type: "required" }]} />);
    fireEvent.blur(screen.getByRole("combobox"));
    expect(await screen.findByText("Campo requerido")).toBeInTheDocument();
  });

  it("shows external errors", () => {
    render(<CnSelectField label="Rol" options={options} error helperText="Error externo" />);
    expect(screen.getByText("Error externo")).toBeInTheDocument();
  });
});

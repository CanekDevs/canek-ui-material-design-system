import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnSegmentedField } from "./CnSegmentedField";

const options = [
  { value: 1, label: "Baja" },
  { value: 2, label: "Media", icon: "flag" },
  { value: 3, label: "Alta" },
];

describe("CnSegmentedField", () => {
  it("selects a single option keeping its type", () => {
    const onChange = vi.fn();
    render(<CnSegmentedField label="Prioridad" options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Media/ }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("does not deselect by default", () => {
    const onChange = vi.fn();
    render(<CnSegmentedField label="Prioridad" options={options} value={2} onChange={onChange} />);
    expect(screen.getByRole("button", { name: /Media/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /Media/ }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("supports multiple selection in option order", () => {
    const onChange = vi.fn();
    render(
      <CnSegmentedField label="Días" multiple options={options} value={[3]} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Baja/ }));
    expect(onChange).toHaveBeenCalledWith([1, 3]);
  });

  it("uses labels as accessible names in icon-only mode", () => {
    render(
      <CnSegmentedField
        label="Vista"
        iconOnly
        options={[{ value: "list", label: "Lista", icon: "view_list" }]}
      />,
    );
    expect(screen.getByRole("button", { name: "Lista" })).toBeInTheDocument();
  });
});

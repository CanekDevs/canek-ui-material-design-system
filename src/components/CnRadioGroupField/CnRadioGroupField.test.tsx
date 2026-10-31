import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnRadioGroupField } from "./CnRadioGroupField";

const options = [
  { value: 1, label: "Mensual" },
  { value: 12, label: "Anual", description: "2 meses gratis" },
];

describe("CnRadioGroupField", () => {
  it("renders a labelled radiogroup", () => {
    render(<CnRadioGroupField label="Plan" options={options} />);
    expect(screen.getByRole("radiogroup", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByText("2 meses gratis")).toBeInTheDocument();
  });

  it("emits the original value type", () => {
    const onChange = vi.fn();
    render(<CnRadioGroupField label="Plan" options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: /Anual/ }));
    expect(onChange).toHaveBeenCalledWith(12);
  });

  it("reflects controlled value", () => {
    render(<CnRadioGroupField label="Plan" options={options} value={1} onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: /Mensual/ })).toBeChecked();
  });

  it("renders card appearance", () => {
    render(<CnRadioGroupField label="Plan" options={options} appearance="card" />);
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });
});

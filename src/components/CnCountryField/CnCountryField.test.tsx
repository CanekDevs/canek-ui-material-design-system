import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnCountryField } from "./CnCountryField";

const open = () => {
  const input = screen.getByRole("combobox");
  act(() => input.focus());
  fireEvent.keyDown(input, { key: "ArrowDown" });
  return input;
};

describe("CnCountryField", () => {
  it("virtualizes the ~250 countries by default", () => {
    render(<CnCountryField label="País" />);
    open();
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("data-cn-virtual-listbox");
    expect(within(listbox).getAllByRole("option").length).toBeLessThan(50);
  });

  it("searches by name without accents and keeps priority groups", () => {
    const onChange = vi.fn();
    render(<CnCountryField label="País" priority={["MX", "US"]} onChange={onChange} />);
    const input = open();
    expect(screen.getByText("Frecuentes")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "peru" } });
    fireEvent.click(screen.getByText("Perú"));
    expect(onChange).toHaveBeenCalledWith("PE");
  });

  it("can opt out of virtualization", () => {
    render(<CnCountryField label="País" virtualize={false} countries={["MX", "US", "CA"]} />);
    open();
    expect(screen.getByRole("listbox")).not.toHaveAttribute("data-cn-virtual-listbox");
  });
});

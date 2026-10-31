import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnCurrencyField, getCurrencySymbol } from "./CnCurrencyField";

describe("CnCurrencyField", () => {
  it("resolves currency symbols", () => {
    expect(getCurrencySymbol("MXN")).toBe("$");
    expect(getCurrencySymbol("NOT-A-CODE")).toBe("NOT-A-CODE");
  });

  it("formats with two decimals when not focused", () => {
    render(<CnCurrencyField label="Precio" value={1500} onChange={() => {}} />);
    expect(screen.getByRole("spinbutton")).toHaveValue("1,500.00");
  });

  it("emits numeric amounts rounded to decimals", () => {
    const onChange = vi.fn();
    render(<CnCurrencyField label="Precio" onChange={onChange} />);
    const input = screen.getByRole("spinbutton");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "10.456" } });
    expect(onChange).toHaveBeenLastCalledWith(10.45);
  });

  it("lets the user pick the currency in editable mode", () => {
    const onCurrencyChange = vi.fn();
    render(
      <CnCurrencyField
        label="Precio"
        currencySelectorMode="editable"
        currencies={["MXN", "USD"]}
        onCurrencyChange={onCurrencyChange}
      />,
    );
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Moneda" }));
    fireEvent.click(within(screen.getByRole("listbox")).getByText(/USD/));
    expect(onCurrencyChange).toHaveBeenCalledWith("USD");
  });
});

import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnAutocompleteField, normalizeSearchText } from "./CnAutocompleteField";

const options = [
  { value: "mx", label: "México", searchText: "MEX" },
  { value: "pe", label: "Perú" },
  { value: "es", label: "España" },
];

describe("CnAutocompleteField", () => {
  it("normalizes accents and case", () => {
    expect(normalizeSearchText("  MÉXICO ")).toBe("mexico");
  });

  it("filters ignoring accents and by searchText", () => {
    render(<CnAutocompleteField label="País" options={options} />);
    const input = screen.getByRole("combobox");
    act(() => input.focus());
    fireEvent.change(input, { target: { value: "peru" } });
    expect(screen.getByText("Perú")).toBeInTheDocument();
    expect(screen.queryByText("España")).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: "MEX" } });
    expect(screen.getByText("México")).toBeInTheDocument();
  });

  it("emits option value instead of the option object", () => {
    const onChange = vi.fn();
    render(<CnAutocompleteField label="País" options={options} onChange={onChange} />);
    act(() => screen.getByRole("combobox").focus());
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "esp" } });
    fireEvent.click(screen.getByText("España"));
    expect(onChange).toHaveBeenCalledWith("es");
  });

  it("shows the label of a controlled value", () => {
    render(<CnAutocompleteField label="País" options={options} value="pe" onChange={() => {}} />);
    expect(screen.getByRole("combobox")).toHaveValue("Perú");
  });

  it("supports multiple values", () => {
    const onChange = vi.fn();
    render(
      <CnAutocompleteField
        label="Países"
        options={options}
        multiple
        value={["mx"]}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("México")).toBeInTheDocument();
    act(() => screen.getByRole("combobox").focus());
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "per" } });
    fireEvent.click(screen.getByText("Perú"));
    expect(onChange).toHaveBeenCalledWith(["mx", "pe"]);
  });

  it("reports typed text for remote search", () => {
    const onInputChange = vi.fn();
    render(<CnAutocompleteField label="País" options={[]} onInputChange={onInputChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "ar" } });
    expect(onInputChange).toHaveBeenCalledWith("ar");
  });
});

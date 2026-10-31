import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  formatNationalNumber,
  parsePhoneValue,
  PHONE_COUNTRIES,
} from "../../utils/phone-countries";
import { CnPhoneField } from "./CnPhoneField";

describe("phone utils", () => {
  it("formats with the country mask", () => {
    expect(formatNationalNumber("5512345678", PHONE_COUNTRIES.MX)).toBe("55 1234 5678");
    expect(formatNationalNumber("2125551234", PHONE_COUNTRIES.US)).toBe("(212) 555-1234");
  });

  it("parses E.164 preferring the given country for shared prefixes", () => {
    expect(parsePhoneValue("+525512345678", ["MX", "US"], "US")).toEqual({
      country: "MX",
      national: "5512345678",
    });
    expect(parsePhoneValue("+14165551234", ["US", "CA"], "CA").country).toBe("CA");
  });
});

describe("CnPhoneField", () => {
  it("emits E.164 values and shows the formatted number", () => {
    const onChange = vi.fn();
    render(<CnPhoneField label="Teléfono" onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "55-1234-5678" } });
    expect(onChange).toHaveBeenLastCalledWith("+525512345678");
    expect(input).toHaveValue("55 1234 5678");
  });

  it("limits digits to the country maximum", () => {
    const onChange = vi.fn();
    render(<CnPhoneField label="Teléfono" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "551234567899999" } });
    expect(onChange).toHaveBeenLastCalledWith("+525512345678");
  });

  it("loads an existing E.164 value", () => {
    render(<CnPhoneField label="Teléfono" value="+34612345678" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("612 345 678");
    expect(screen.getByRole("combobox", { name: "País" })).toHaveTextContent("ES +34");
  });

  it("re-emits when the country changes", () => {
    const onChange = vi.fn();
    render(
      <CnPhoneField
        label="Teléfono"
        value="+525512345678"
        countries={["MX", "CO"]}
        onChange={onChange}
      />,
    );
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "País" }));
    fireEvent.click(within(screen.getByRole("listbox")).getByText("Colombia"));
    expect(onChange).toHaveBeenLastCalledWith("+575512345678");
  });

  it("validates the national length after blur", async () => {
    render(<CnPhoneField label="Teléfono" />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "5512" } });
    fireEvent.blur(input);
    expect(await screen.findByText(/Número inválido para México/)).toBeInTheDocument();
  });
});

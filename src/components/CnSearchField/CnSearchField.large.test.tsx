import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnSearchField } from "./CnSearchField";

const SUGGESTIONS = Array.from({ length: 10_000 }, (_, index) => `Producto ${index}`);

describe("CnSearchField · listas grandes", () => {
  it("virtualizes many suggestions and reports the truncated rest", () => {
    render(<CnSearchField label="Producto" suggestions={SUGGESTIONS} maxSuggestions={1000} />);
    const input = screen.getByRole("combobox");
    act(() => input.focus());
    fireEvent.change(input, { target: { value: "producto" } });
    const list = screen.getByRole("listbox");
    expect(within(list).getAllByRole("option").length).toBeLessThan(40);
    expect(screen.getByText("9,000 más, refina tu búsqueda")).toBeInTheDocument();
  });

  it("keeps the active suggestion rendered while moving with the keyboard", () => {
    render(<CnSearchField label="Producto" suggestions={SUGGESTIONS} maxSuggestions={500} />);
    const input = screen.getByRole("combobox");
    act(() => input.focus());
    fireEvent.change(input, { target: { value: "producto" } });
    for (let step = 0; step < 120; step += 1) fireEvent.keyDown(input, { key: "ArrowDown" });
    const active = input.getAttribute("aria-activedescendant");
    expect(document.getElementById(active as string)).toHaveTextContent("Producto 119");
  });
});

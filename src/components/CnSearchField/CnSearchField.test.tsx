import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearRecentSearches, CnSearchField, filterSuggestions } from "./CnSearchField";
import { CnSearchFieldSkeleton } from "./CnSearchFieldSkeleton";

const CITIES = ["Mérida", "Monterrey", "México", "Puebla"];

afterEach(() => {
  clearRecentSearches();
  vi.useRealTimers();
});

describe("CnSearchField", () => {
  it("filters static suggestions ignoring accents", () => {
    expect(filterSuggestions(CITIES, "mex").map((s) => s.value)).toEqual(["México"]);
    expect(filterSuggestions(CITIES, "", 2)).toHaveLength(2);
  });

  it("navigates suggestions with the keyboard and selects with Enter", () => {
    const onSelect = vi.fn();
    const onChange = vi.fn();
    render(
      <CnSearchField label="Ciudad" suggestions={CITIES} onSelect={onSelect} onChange={onChange} />,
    );
    const input = screen.getByRole("combobox");
    act(() => input.focus());
    fireEvent.change(input, { target: { value: "m" } });
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(input).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveAttribute("aria-activedescendant", expect.stringContaining("option-1"));
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith({ value: "Monterrey" });
    expect(onChange).toHaveBeenLastCalledWith("Monterrey");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("debounces async searches and shows a spinner", async () => {
    vi.useFakeTimers();
    const onSearch = vi.fn(async (query: string) => [`${query} uno`, `${query} dos`]);
    render(<CnSearchField label="Buscar" onSearch={onSearch} searchDelay={200} />);
    const input = screen.getByRole("combobox");
    act(() => input.focus());
    fireEvent.change(input, { target: { value: "a" } });
    fireEvent.change(input, { target: { value: "ab" } });
    expect(screen.getByLabelText("Buscando")).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith(
      "ab",
      expect.objectContaining({ signal: expect.anything() }),
    );
    expect(screen.getByRole("option", { name: "ab uno" })).toBeInTheDocument();
  });

  it("clears with the button and with Escape", () => {
    const onChange = vi.fn();
    render(<CnSearchField label="Buscar" defaultValue="hola" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    expect(onChange).toHaveBeenLastCalledWith("");
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "x" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveValue("");
  });

  it("remembers recent searches in memory", async () => {
    const onSubmit = vi.fn();
    const { unmount } = render(
      <CnSearchField label="Buscar" recentSearches recentKey="t" onSubmit={onSubmit} />,
    );
    let input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "facturas" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("facturas");
    unmount();
    render(<CnSearchField label="Buscar" recentSearches recentKey="t" />);
    input = screen.getByRole("combobox");
    act(() => input.focus());
    await waitFor(() =>
      expect(screen.getByRole("listbox", { name: "Búsquedas recientes" })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("option", { name: "facturas" }));
    expect(input).toHaveValue("facturas");
  });

  it("renders its skeleton", () => {
    const { rerender } = render(<CnSearchFieldSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "search-field");
    rerender(<CnSearchField label="Buscar" skeleton />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnSliderField } from "./CnSliderField";

describe("CnSliderField", () => {
  it("renders a single slider with the formatted value", () => {
    render(
      <CnSliderField label="Volumen" value={40} formatValue={(v) => `${v}%`} onChange={() => {}} />,
    );
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "40");
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "40%");
  });

  it("renders two thumbs in range mode", () => {
    render(<CnSliderField label="Precio" range min={0} max={1000} defaultValue={[100, 500]} />);
    expect(screen.getAllByRole("slider")).toHaveLength(2);
    expect(screen.getByText("100 – 500")).toBeInTheDocument();
  });

  it("emits changes from keyboard", () => {
    const onChange = vi.fn();
    render(<CnSliderField label="Nivel" value={5} min={0} max={10} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith(6);
  });
});

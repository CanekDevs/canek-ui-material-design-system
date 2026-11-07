import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnSliderField } from "./CnSliderField";
import { CnSliderFieldSkeleton } from "./CnSliderFieldSkeleton";

const countOf = (container: HTMLElement, attr: string) =>
  container.querySelectorAll(`[${attr}]`).length;

describe("CnSliderFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnSliderFieldSkeleton helperText />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "slider-field");
  });

  it("draws one thumb or two for a range", () => {
    const { container, rerender } = render(<CnSliderFieldSkeleton />);
    expect(countOf(container, "data-cn-skeleton-thumb")).toBe(1);
    rerender(<CnSliderFieldSkeleton range />);
    expect(countOf(container, "data-cn-skeleton-thumb")).toBe(2);
  });

  it("draws marks per step or from the list", () => {
    const { container, rerender } = render(
      <CnSliderFieldSkeleton marks min={0} max={50} step={5} />,
    );
    expect(countOf(container, "data-cn-skeleton-mark")).toBe(11);
    rerender(
      <CnSliderFieldSkeleton
        min={1}
        max={3}
        marks={[{ value: 1, label: "A" }, { value: 2 }, { value: 3, label: "C" }]}
      />,
    );
    expect(countOf(container, "data-cn-skeleton-mark")).toBe(3);
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnSliderField label="Descuento" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "slider-field");
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });
});

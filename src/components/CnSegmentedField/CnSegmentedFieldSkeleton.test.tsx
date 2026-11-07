import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnSegmentedField } from "./CnSegmentedField";
import { CnSegmentedFieldSkeleton } from "./CnSegmentedFieldSkeleton";

const segments = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("[data-cn-skeleton-segment]"));

describe("CnSegmentedFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnSegmentedFieldSkeleton helperText />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "segmented-field");
  });

  it("follows segment count and size", () => {
    const { container, rerender } = render(<CnSegmentedFieldSkeleton options={4} />);
    expect(segments(container)).toHaveLength(4);
    expect(getComputedStyle(segments(container)[0]).minHeight).toBe("34px");
    rerender(<CnSegmentedFieldSkeleton options={7} size="lg" />);
    expect(segments(container)).toHaveLength(7);
    expect(getComputedStyle(segments(container)[0]).minHeight).toBe("42px");
  });

  it("renders icons from options and drops text when icon only", () => {
    const { container, rerender } = render(
      <CnSegmentedFieldSkeleton
        options={[
          { value: "a", label: "A", icon: "home" },
          { value: "b", label: "B" },
        ]}
      />,
    );
    const pieces = (i: number) =>
      segments(container)[i].querySelectorAll('[data-cn-skeleton="true"]').length;
    expect(pieces(0)).toBe(2);
    expect(pieces(1)).toBe(1);
    rerender(<CnSegmentedFieldSkeleton options={2} iconOnly />);
    expect(pieces(0)).toBe(1);
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(
      <CnSegmentedField
        label="Periodo"
        options={[
          { value: "d", label: "Día" },
          { value: "w", label: "Semana" },
        ]}
        skeleton
      />,
    );
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "segmented-field");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

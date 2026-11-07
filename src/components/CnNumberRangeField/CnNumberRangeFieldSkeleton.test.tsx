import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CnNumberRangeField } from "./CnNumberRangeField";
import { CnNumberRangeFieldSkeleton } from "./CnNumberRangeFieldSkeleton";

const parts = (container: HTMLElement) =>
  container.querySelectorAll('[data-cn-skeleton="true"]').length;

describe("CnNumberRangeFieldSkeleton", () => {
  it("is a single accessible status with two fields and a separator", () => {
    const { container } = render(<CnNumberRangeFieldSkeleton helperText />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "number-range-field");
    expect(container.querySelector("[data-cn-skeleton-separator]")).toBeInTheDocument();
    expect(container.querySelectorAll('[data-cn-skeleton-controls="none"]')).toHaveLength(2);
  });

  it("adds steppers to both fields with stacked controls", () => {
    const { container, rerender } = render(<CnNumberRangeFieldSkeleton />);
    const none = parts(container);
    rerender(<CnNumberRangeFieldSkeleton controls="stacked" />);
    expect(parts(container)).toBe(none + 4);
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnNumberRangeField label="Precio" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "number-range-field");
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });
});

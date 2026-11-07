import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CnNumberField } from "./CnNumberField";
import { CnNumberFieldSkeleton } from "./CnNumberFieldSkeleton";

const parts = (container: HTMLElement) =>
  container.querySelectorAll('[data-cn-skeleton="true"]').length;

describe("CnNumberFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnNumberFieldSkeleton helperText prefix suffix />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "number-field");
  });

  it("draws each controls style", () => {
    const { container, rerender } = render(<CnNumberFieldSkeleton controls="none" label={false} />);
    const none = parts(container);
    rerender(<CnNumberFieldSkeleton controls="stacked" label={false} />);
    expect(parts(container)).toBe(none + 2);
    rerender(<CnNumberFieldSkeleton controls="split" label={false} />);
    expect(parts(container)).toBe(none + 2);
    expect(container.querySelector('[data-cn-skeleton-controls="split"]')).toBeInTheDocument();
  });

  it("follows the size tokens", () => {
    const { container } = render(<CnNumberFieldSkeleton size="sm" label={false} />);
    const box = container.querySelector(
      '[data-cn-skeleton="number-field"] > div > div',
    ) as HTMLElement;
    expect(getComputedStyle(box).minHeight).toBe("32px");
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnNumberField label="Cantidad" controls="inline" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "number-field");
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });
});

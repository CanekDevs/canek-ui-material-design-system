import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CnSelectField } from "./CnSelectField";
import { CnSelectFieldSkeleton } from "./CnSelectFieldSkeleton";

const parts = (container: HTMLElement) =>
  container.querySelectorAll('[data-cn-skeleton="true"]').length;

describe("CnSelectFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnSelectFieldSkeleton helperText clearable startAdornment />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "select-field");
  });

  it("renders one chip per selected item with multiple + chips", () => {
    const { container, rerender } = render(
      <CnSelectFieldSkeleton multiple chips selectedCount={2} />,
    );
    const two = parts(container);
    rerender(<CnSelectFieldSkeleton multiple chips selectedCount={5} />);
    expect(parts(container)).toBe(two + 3);
  });

  it("follows the size tokens", () => {
    const { container } = render(<CnSelectFieldSkeleton size="lg" label={false} />);
    const box = container.querySelector(
      '[data-cn-skeleton="select-field"] > div > div',
    ) as HTMLElement;
    expect(getComputedStyle(box).minHeight).toBe("48px");
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnSelectField label="País" options={[{ value: "mx", label: "México" }]} skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "select-field");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});

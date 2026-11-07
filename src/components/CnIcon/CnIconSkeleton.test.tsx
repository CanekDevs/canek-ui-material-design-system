import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnIcon } from "./CnIcon";
import { CnIconSkeleton } from "./CnIconSkeleton";

const piece = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-cn-skeleton="true"]') as HTMLElement;

describe("CnIconSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnIconSkeleton />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "icon");
  });

  it("follows the icon size", () => {
    const { container, rerender } = render(<CnIconSkeleton size="sm" />);
    const small = parseInt(getComputedStyle(piece(container)).width, 10);
    rerender(<CnIconSkeleton size="2xl" />);
    expect(parseInt(getComputedStyle(piece(container)).width, 10)).toBeGreaterThan(small);
    rerender(<CnIconSkeleton size={24} circle />);
    expect(getComputedStyle(piece(container)).borderRadius).toBe("50%");
  });

  it("replaces the glyph with its skeleton via the skeleton prop", () => {
    const { container } = render(<CnIcon name="add" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "icon");
    expect(container.querySelector("svg")).toBeNull();
  });
});

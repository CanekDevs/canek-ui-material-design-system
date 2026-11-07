import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnChip } from "./CnChip";
import { CnChipSkeleton } from "./CnChipSkeleton";

const pieces = (container: HTMLElement) =>
  container.querySelectorAll<HTMLElement>('[data-cn-skeleton="true"]');

describe("CnChipSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnChipSkeleton variant="outlined" icon deletable />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "chip");
  });

  it("follows variant, slots and size", () => {
    const { container, rerender } = render(<CnChipSkeleton size="large" />);
    expect(pieces(container)).toHaveLength(1);
    expect(getComputedStyle(pieces(container)[0]).height).toBe("40px");

    rerender(<CnChipSkeleton variant="outlined" icon deletable />);
    expect(pieces(container)).toHaveLength(3);
  });

  it("becomes a circle for short counters", () => {
    const { container } = render(<CnChipSkeleton label="3" size="small" />);
    const block = pieces(container)[0];
    expect(getComputedStyle(block).width).toBe("24px");
    expect(getComputedStyle(block).borderRadius).toBe("50%");
  });

  it("replaces the chip with its skeleton via the skeleton prop", () => {
    render(<CnChip label="Activo" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "chip");
    expect(screen.queryByText("Activo")).not.toBeInTheDocument();
  });
});

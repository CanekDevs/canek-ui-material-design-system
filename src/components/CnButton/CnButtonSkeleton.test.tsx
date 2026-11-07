import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnButton } from "./CnButton";
import { CnButtonSkeleton } from "./CnButtonSkeleton";

const pieces = (container: HTMLElement) =>
  container.querySelectorAll<HTMLElement>('[data-cn-skeleton="true"]');

describe("CnButtonSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnButtonSkeleton variant="outlined" startIcon endIcon />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "button");
  });

  it("follows size, variant and icon-only shape", () => {
    const { container, rerender } = render(<CnButtonSkeleton size="large" />);
    expect(pieces(container)).toHaveLength(1);
    expect(getComputedStyle(pieces(container)[0]).height).toBe("48px");

    rerender(<CnButtonSkeleton variant="outlined" startIcon endIcon />);
    expect(pieces(container)).toHaveLength(3);

    rerender(<CnButtonSkeleton iconOnly shape="pill" size="small" />);
    const block = pieces(container)[0];
    expect(getComputedStyle(block).width).toBe("32px");
    expect(getComputedStyle(block).borderRadius).toBe("50%");
  });

  it("sizes the label from its text", () => {
    const { container, rerender } = render(<CnButtonSkeleton label="OK" />);
    const short = parseInt(getComputedStyle(pieces(container)[0]).width, 10);
    rerender(<CnButtonSkeleton label="Guardar todos los cambios" />);
    expect(parseInt(getComputedStyle(pieces(container)[0]).width, 10)).toBeGreaterThan(short);
  });

  it("replaces the button with its skeleton via the skeleton prop", () => {
    render(<CnButton label="Guardar" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "button");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

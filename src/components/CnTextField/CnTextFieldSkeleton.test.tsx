import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnTextField } from "./CnTextField";
import { CnTextFieldSkeleton } from "./CnTextFieldSkeleton";

describe("CnTextFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnTextFieldSkeleton helperText startIcon endIcon />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "text-field");
  });

  it("follows size and multiline variants", () => {
    const { container, rerender } = render(<CnTextFieldSkeleton size="lg" label={false} />);
    const box = () => container.querySelector('[data-cn-skeleton="text-field"] > div > div') as HTMLElement;
    expect(getComputedStyle(box()).minHeight).toBe("48px");
    rerender(<CnTextFieldSkeleton multiline rows={4} label={false} />);
    expect(parseInt(getComputedStyle(box()).minHeight, 10)).toBeGreaterThan(48);
  });

  it("renders a password strength meter", () => {
    const { container } = render(<CnTextFieldSkeleton type="password" showPasswordStrength />);
    expect(container.querySelectorAll('[data-cn-skeleton="true"]').length).toBeGreaterThan(5);
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnTextField label="Nombre" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "text-field");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});

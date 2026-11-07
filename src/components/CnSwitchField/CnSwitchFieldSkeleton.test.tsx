import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnSwitchField } from "./CnSwitchField";
import { CnSwitchFieldSkeleton } from "./CnSwitchFieldSkeleton";

describe("CnSwitchFieldSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnSwitchFieldSkeleton description helperText />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "switch-field");
  });

  it("follows the size of the switch", () => {
    const { container, rerender } = render(<CnSwitchFieldSkeleton />);
    const track = () => container.querySelector("[data-cn-skeleton-switch]") as HTMLElement;
    expect(getComputedStyle(track()).width).toBe("58px");
    rerender(<CnSwitchFieldSkeleton size="sm" />);
    expect(getComputedStyle(track()).width).toBe("40px");
  });

  it("follows the label placement", () => {
    const { container } = render(<CnSwitchFieldSkeleton labelPlacement="start" />);
    const row = container.querySelector("[data-cn-skeleton-switch]")?.parentElement as HTMLElement;
    expect(getComputedStyle(row).flexDirection).toBe("row-reverse");
  });

  it("replaces the field with its skeleton via the skeleton prop", () => {
    render(<CnSwitchField label="Modo oscuro" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "switch-field");
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});

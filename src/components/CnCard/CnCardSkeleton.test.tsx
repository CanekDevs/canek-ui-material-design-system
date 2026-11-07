import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnCard } from "./CnCard";
import { CnCardSkeleton } from "./CnCardSkeleton";

const pieces = (container: HTMLElement) =>
  container.querySelectorAll('[data-cn-skeleton="true"]').length;

describe("CnCardSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnCardSkeleton icon media headerActions={2} footer />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "card");
  });

  it("follows content and layout variants", () => {
    const { container, rerender } = render(<CnCardSkeleton lines={2} />);
    const base = pieces(container);
    expect(container.querySelector("[data-cn-card-skeleton-media]")).toBeNull();
    rerender(<CnCardSkeleton lines={2} media icon headerActions={2} footer={3} />);
    expect(pieces(container)).toBe(base + 1 + 1 + 2 + 3);
    expect(container.querySelector("[data-cn-card-skeleton-media]")).not.toBeNull();
    rerender(<CnCardSkeleton layout="horizontal" media />);
    expect(getComputedStyle(screen.getByRole("status")).flexDirection).toBe("row");
  });

  it("uses the card padding", () => {
    const { rerender } = render(<CnCardSkeleton padding="lg" />);
    expect(getComputedStyle(screen.getByRole("status")).paddingTop).toBe("24px");
    rerender(<CnCardSkeleton padding="sm" />);
    expect(getComputedStyle(screen.getByRole("status")).paddingTop).toBe("12px");
  });

  it("replaces the card with its skeleton via the skeleton prop", () => {
    render(<CnCard title="Pedido" description="Detalle" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "card");
    expect(screen.queryByText("Pedido")).not.toBeInTheDocument();
  });
});

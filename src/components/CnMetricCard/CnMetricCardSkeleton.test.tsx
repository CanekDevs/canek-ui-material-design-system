import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnMetricCard } from "./CnMetricCard";
import { CnMetricCardSkeleton } from "./CnMetricCardSkeleton";

describe("CnMetricCardSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnMetricCardSkeleton sparkline progress footer description />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "metric-card");
  });

  it("follows size and optional sections", () => {
    const { container, rerender } = render(<CnMetricCardSkeleton size="lg" />);
    expect(getComputedStyle(screen.getByRole("status")).paddingTop).toBe("22px");
    expect(container.querySelector("[data-cn-metric-skeleton-trend]")).not.toBeNull();
    expect(container.querySelector("[data-cn-metric-skeleton-progress]")).toBeNull();
    rerender(<CnMetricCardSkeleton size="sm" trend={false} progress footer />);
    expect(getComputedStyle(screen.getByRole("status")).paddingTop).toBe("12px");
    expect(container.querySelector("[data-cn-metric-skeleton-trend]")).toBeNull();
    expect(container.querySelector("[data-cn-metric-skeleton-progress]")).not.toBeNull();
    expect(container.querySelector("[data-cn-metric-skeleton-footer]")).not.toBeNull();
  });

  it("draws the sparkline type", () => {
    const { container, rerender } = render(<CnMetricCardSkeleton sparkline sparklineType="bar" />);
    const bars = container.querySelector('[data-cn-metric-skeleton-sparkline="bar"]');
    expect(bars?.querySelectorAll('[data-cn-skeleton="true"]')).toHaveLength(7);
    rerender(<CnMetricCardSkeleton sparkline sparklineType="area" />);
    expect(
      container.querySelector('[data-cn-metric-skeleton-sparkline="area"] polygon'),
    ).not.toBeNull();
    rerender(<CnMetricCardSkeleton sparkline sparklineType="line" />);
    expect(
      container.querySelector('[data-cn-metric-skeleton-sparkline="line"] polygon'),
    ).toBeNull();
  });

  it("renders the skeleton via loading and the skeleton alias", () => {
    const { rerender } = render(<CnMetricCard title="Ventas" value={120} loading />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "metric-card");
    expect(screen.queryByText("Ventas")).not.toBeInTheDocument();
    rerender(<CnMetricCard title="Ventas" value={120} skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "metric-card");
    rerender(<CnMetricCard title="Ventas" value={120} />);
    expect(screen.getByText("Ventas")).toBeInTheDocument();
  });
});

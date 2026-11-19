import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnMetricCard } from "./CnMetricCard";

describe("CnMetricCard", () => {
  it("formats numeric values and shows a dash when empty", () => {
    const { rerender } = render(<CnMetricCard title="Ventas" value={1284500} />);
    expect(screen.getByText("1,284,500")).toBeInTheDocument();
    rerender(<CnMetricCard title="Ventas" value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("keeps the stacked KPI heading by default", () => {
    render(<CnMetricCard title="Ventas" value={3} />);
    expect(screen.getByRole("heading", { level: 3, name: "Ventas" })).toBeInTheDocument();
  });

  describe("layout inline (tile de dato, antes CnInfoCard value)", () => {
    it("renders label + value with the icon at the start", () => {
      const { container } = render(
        <CnMetricCard layout="inline" title="RFC" value="ADI920101AB1" icon="verified" />,
      );
      const row = container.querySelector("[data-cn-metric-inline]") as HTMLElement;
      expect(row).not.toBeNull();
      expect(row.firstElementChild).toHaveAttribute("data-cn-metric-icon");
      expect(screen.getByText("ADI920101AB1")).toBeInTheDocument();
      // No es encabezado en el tile compacto.
      expect(screen.queryByRole("heading")).toBeNull();
    });

    it("moves the icon to the end", () => {
      const { container } = render(
        <CnMetricCard layout="inline" iconPosition="end" title="A" value="B" icon="person" />,
      );
      const row = container.querySelector("[data-cn-metric-inline]") as HTMLElement;
      expect(row.lastElementChild).toHaveAttribute("data-cn-metric-icon");
    });

    it("accepts node values and a badge", () => {
      render(
        <CnMetricCard
          layout="inline"
          title="ID"
          value={<span data-testid="id-cell">CLI-1</span>}
          badge={<span>Vigente</span>}
        />,
      );
      expect(screen.getByTestId("id-cell")).toBeInTheDocument();
      expect(screen.getByText("Vigente")).toBeInTheDocument();
    });

    it("wraps long values instead of overflowing", () => {
      const { container } = render(
        <CnMetricCard layout="inline" title="Correo" value={"a".repeat(120) + "@x.com"} />,
      );
      const value = container.querySelector("[data-cn-metric-value]") as HTMLElement;
      expect(getComputedStyle(value).overflowWrap).toBe("anywhere");
    });

    it("applies minHeight and left-accent", () => {
      const { container } = render(
        <CnMetricCard layout="inline" title="A" value="B" variant="left-accent" minHeight={85} />,
      );
      const card = container.firstElementChild as HTMLElement;
      expect(getComputedStyle(card).minHeight).toBe("85px");
      expect(getComputedStyle(card).borderLeftWidth).toBe("4px");
    });
  });

  it("renders as a link with href", () => {
    render(<CnMetricCard title="Responsable" value="María" href="/personas/1" target="_blank" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/personas/1");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("is a button with onClick", () => {
    const onClick = vi.fn();
    render(<CnMetricCard title="Tickets" value={3} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("swaps to the inline skeleton", () => {
    const { container } = render(
      <CnMetricCard layout="inline" title="A" value="B" icon="bolt" badge="x" skeleton />,
    );
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "metric-card");
    expect(container.querySelector("[data-cn-metric-skeleton-inline]")).not.toBeNull();
    expect(container.querySelector("[data-cn-metric-skeleton-badge]")).not.toBeNull();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnBarChart, CnHistogram, CnLineChart } from "./CnCartesianPresets";
import { CnCandlestickChart } from "./CnCandlestickChart";
import { CnChartCard } from "./CnChartCard";
import {
  CnBarChartSkeleton,
  CnChartSkeleton,
  CnGaugeSkeleton,
  CnPieChartSkeleton,
  CnSparklineSkeleton,
} from "./CnChartSkeleton";
import { CnFunnelChart } from "./CnFunnelChart";
import { CnGauge } from "./CnGauge";
import { CnHeatmap } from "./CnHeatmap";
import { CnDonutChart } from "./CnPieChart";
import { CnRadarChart } from "./CnRadarChart";
import { CnRadialBarChart } from "./CnRadialCharts";
import { CnSankeyChart } from "./CnSankeyChart";
import { CnScatterChart } from "./CnScatterChart";
import { CnSparkline } from "./CnSparkline";
import { CnTreemap } from "./CnTreemap";
import { arcPath, niceTicks, squarify } from "./chart-geometry";
import {
  binValues,
  createValueFormatter,
  interpolateScale,
  linearRegression,
  movingAverage,
  percentChange,
} from "./chart-theme";

const DATA = [
  { month: "Ene", ventas: 100, costos: 60 },
  { month: "Feb", ventas: 140, costos: 70 },
  { month: "Mar", ventas: 120, costos: 65 },
];

describe("chart helpers", () => {
  it("formats values in es-MX", () => {
    expect(createValueFormatter("currency")(1234.5)).toBe("$1,234.50");
    expect(createValueFormatter("percent")(12.5)).toMatch(/^12\.5\s?%$/);
    expect(createValueFormatter("percent", { percentScale: 1 })(0.25)).toMatch(/^25\s?%$/);
    expect(createValueFormatter("bytes")(1536)).toBe("1.5 KB");
    expect(createValueFormatter("duration")(3720)).toBe("1 h 2 min");
    expect(createValueFormatter("integer", { suffix: " h" })(12.4)).toBe("12 h");
    expect(createValueFormatter("number")(null)).toBe("—");
  });

  it("computes statistics", () => {
    expect(percentChange(120, 100)).toBe(20);
    expect(percentChange(5, 0)).toBeNull();
    expect(movingAverage([1, 2, 3, 4], 2)).toEqual([null, 1.5, 2.5, 3.5]);
    const fit = linearRegression([
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
    ]);
    expect(fit?.slope).toBeCloseTo(2);
    expect(fit?.intercept).toBeCloseTo(1);
    expect(fit?.r2).toBeCloseTo(1);
    const bins = binValues([1, 2, 2, 3, 10], 3);
    expect(bins).toHaveLength(3);
    expect(bins.reduce((a, b) => a + b.count, 0)).toBe(5);
  });

  it("interpolates colors and builds geometry", () => {
    expect(interpolateScale(["#000000", "#ffffff"], 0.5)).toBe("rgb(128, 128, 128)");
    expect(niceTicks(0, 97, 5)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(arcPath(50, 50, 40, 20, 0, 90)).toMatch(/^M /);
    const rects = squarify(
      [
        { value: 6, item: "a" },
        { value: 3, item: "b" },
        { value: 1, item: "c" },
      ],
      0,
      0,
      100,
      100,
    );
    const area = rects.reduce((a, r) => a + r.width * r.height, 0);
    expect(area).toBeCloseTo(10000);
  });
});

describe("chart skeletons", () => {
  it("renders accessible skeletons for every kind", () => {
    const kinds = [
      "bar",
      "line",
      "area",
      "composed",
      "scatter",
      "pie",
      "donut",
      "gauge",
      "radar",
      "heatmap",
      "funnel",
      "sankey",
      "candlestick",
      "radialBar",
      "radialLine",
      "treemap",
      "histogram",
      "sparkline",
    ] as const;
    for (const kind of kinds) {
      const { unmount } = render(<CnChartSkeleton kind={kind} />);
      expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
      unmount();
    }
  });

  it("adapts to variants", () => {
    const { container, rerender } = render(<CnBarChartSkeleton bars={5} axes={false} />);
    expect(container.querySelectorAll("svg rect")).toHaveLength(5);
    rerender(<CnBarChartSkeleton bars={4} series={2} axes={false} />);
    expect(container.querySelectorAll("svg rect")).toHaveLength(8);
    rerender(<CnPieChartSkeleton slices={6} centerLabel={false} />);
    expect(container.querySelectorAll("svg path")).toHaveLength(6);
    rerender(<CnGaugeSkeleton segments={3} />);
    expect(container.querySelectorAll("svg path")).toHaveLength(3);
  });

  it("shows header and legend placeholders in card frame", () => {
    render(<CnBarChartSkeleton frame="card" header legend legendItems={4} />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("data-cn-skeleton", "chart");
    expect(status.querySelectorAll('[data-cn-skeleton="true"]').length).toBeGreaterThan(4);
    // Las piezas internas son decorativas: un solo "status" para lectores de pantalla.
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("renders a sparkline skeleton", () => {
    render(<CnSparklineSkeleton type="bar" points={6} />);
    expect(screen.getByRole("status").querySelectorAll("rect")).toHaveLength(6);
  });
});

describe("CnChartCard", () => {
  it("shows loading, error and empty states", () => {
    const retry = vi.fn();
    const { rerender } = render(
      <CnChartCard title="Ventas" loading skeleton={<div data-testid="sk" />}>
        <div>chart</div>
      </CnChartCard>,
    );
    expect(screen.getByTestId("sk")).toBeInTheDocument();
    rerender(
      <CnChartCard title="Ventas" error="Falló" onRetry={retry}>
        <div>chart</div>
      </CnChartCard>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Falló");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(retry).toHaveBeenCalled();
    rerender(
      <CnChartCard title="Ventas" empty>
        <div>chart</div>
      </CnChartCard>,
    );
    expect(screen.getByText("Sin datos para mostrar")).toBeInTheDocument();
  });

  it("selects periods and chart types", () => {
    const onPeriod = vi.fn();
    const onType = vi.fn();
    render(
      <CnChartCard
        title="Ventas"
        periods
        onPeriodChange={onPeriod}
        typeOptions={[
          { value: "bar", label: "Barras", icon: "bar_chart" },
          { value: "line", label: "Líneas", icon: "show_chart" },
        ]}
        type="bar"
        onTypeChange={onType}
        summary={{ value: "$1 M", trend: -4.2 }}
      >
        <div>chart</div>
      </CnChartCard>,
    );
    expect(screen.getByText("-4.2%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Periodo/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Este año" }));
    expect(onPeriod).toHaveBeenCalledWith(
      "year",
      expect.objectContaining({ from: expect.any(String) }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Líneas" }));
    expect(onType).toHaveBeenCalledWith("line");
  });

  it("offers data formats only when export data exists", () => {
    const { rerender } = render(
      <CnChartCard title="Ventas">
        <svg />
      </CnChartCard>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Descargar" }));
    expect(screen.getByRole("menuitem", { name: /PNG/ })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /CSV/ })).not.toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    rerender(
      <CnChartCard
        title="Ventas"
        exportData={{ columns: [{ id: "a", header: "A" }], rows: [{ a: 1 }] }}
      >
        <svg />
      </CnChartCard>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Descargar" }));
    expect(screen.getByRole("menuitem", { name: /CSV/ })).toBeInTheDocument();
  });
});

describe("MUI X based charts", () => {
  it("renders bar and line charts with legend and reference line", () => {
    const { container } = render(
      <CnBarChart
        title="Ventas"
        width={500}
        height={300}
        animate={false}
        data={DATA}
        xKey="month"
        series={[
          { key: "ventas", label: "Ventas" },
          { key: "costos", label: "Costos" },
        ]}
        referenceLines={[{ axis: "y", value: 110, label: "Meta" }]}
      />,
    );
    expect(screen.getByText("Ventas", { selector: "h3" })).toBeInTheDocument();
    expect(screen.getByText("Costos")).toBeInTheDocument();
    expect(screen.getByText("Meta")).toBeInTheDocument();
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
  });

  it("shows the empty state and the matching skeleton", () => {
    const { rerender } = render(
      <CnLineChart title="Vacía" data={[]} series={[{ key: "x", label: "X" }]} />,
    );
    expect(screen.getByText("Sin datos para mostrar")).toBeInTheDocument();
    rerender(
      <CnLineChart
        title="Cargando"
        loading
        data={DATA}
        xKey="month"
        series={[{ key: "ventas", label: "Ventas" }]}
      />,
    );
    expect(screen.getByRole("status", { name: "Cargando gráfica" })).toBeInTheDocument();
  });

  it("switches chart type from the card", () => {
    const onType = vi.fn();
    render(
      <CnBarChart
        title="Ventas"
        width={500}
        animate={false}
        data={DATA}
        xKey="month"
        series={[{ key: "ventas", label: "Ventas" }]}
        typeOptions
        onTypeChange={onType}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Área" }));
    expect(onType).toHaveBeenCalledWith("area");
  });

  it("renders histogram bins", () => {
    render(
      <CnHistogram
        width={400}
        animate={false}
        values={[1, 2, 3, 4, 5, 6]}
        bins={3}
        valueFormat="integer"
      />,
    );
    expect(screen.getAllByText(/–/).length).toBeGreaterThan(0);
  });

  it("renders donut with total and percent", () => {
    render(
      <CnDonutChart
        width={400}
        animate={false}
        data={[
          { label: "A", value: 30 },
          { label: "B", value: 70 },
        ]}
      />,
    );
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("renders scatter, radar and gauge", () => {
    render(
      <>
        <CnScatterChart
          width={400}
          animate={false}
          series={[
            {
              label: "P",
              data: [
                { x: 1, y: 2 },
                { x: 2, y: 4 },
                { x: 3, y: 5 },
              ],
              trendLine: true,
            },
          ]}
        />
        <CnRadarChart
          width={400}
          animate={false}
          metrics={["A", "B", "C"]}
          series={[{ label: "S", data: [1, 2, 3] }]}
        />
        <CnGauge
          width={300}
          animate={false}
          value={72}
          valueFormat="percent"
          segments={[
            { to: 50, label: "Baja" },
            { to: 100, label: "Alta" },
          ]}
        />
      </>,
    );
    expect(screen.getByText(/R² /)).toBeInTheDocument();
    expect(screen.getByText(/^72\s?%$/)).toBeInTheDocument();
    expect(screen.getAllByText("Alta").length).toBeGreaterThan(0);
  });

  it("renders sparkline with trend and empty text", () => {
    const { rerender } = render(<CnSparkline width={200} data={[10, 12, 15]} showValue />);
    expect(screen.getByRole("img")).toHaveAccessibleName(/de 10 a 15 \(\+50\.0 %\)/);
    expect(screen.getByText("+50.0 %")).toBeInTheDocument();
    rerender(<CnSparkline data={[]} />);
    expect(screen.getByText("Sin datos")).toBeInTheDocument();
    rerender(<CnSparkline data={[1, 2]} loading />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

describe("custom charts", () => {
  it("renders heatmap cells with labels and tooltip", () => {
    const { container } = render(
      <CnHeatmap
        data={[
          { x: "Lun", y: "Mañana", value: 3 },
          { x: "Mar", y: "Mañana", value: 8 },
          { x: "Lun", y: "Tarde", value: 1 },
          { x: "Mar", y: "Tarde", value: null },
        ]}
      />,
    );
    expect(container.querySelectorAll("rect")).toHaveLength(4);
    fireEvent.mouseMove(container.querySelectorAll("rect")[1]);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Mañana · Mar");
  });

  it("renders calendar heatmap", () => {
    const { container } = render(
      <CnHeatmap
        variant="calendar"
        data={[
          { date: "2026-01-05", value: 2 },
          { date: "2026-01-06", value: 4 },
          { date: "2026-01-20", value: 1 },
        ]}
      />,
    );
    expect(container.querySelectorAll("rect")).toHaveLength(3);
    expect(screen.getByText("Ene")).toBeInTheDocument();
  });

  it("renders funnel conversions", () => {
    const onStep = vi.fn();
    render(
      <CnFunnelChart
        conversion="previous"
        onStepClick={onStep}
        steps={[
          { label: "Visitas", value: 1000 },
          { label: "Leads", value: 250 },
        ]}
      />,
    );
    expect(screen.getByText("25 % del anterior")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Leads"));
    expect(onStep).toHaveBeenCalledWith(expect.objectContaining({ label: "Leads" }), 1);
  });

  it("lays out sankey nodes and links", () => {
    const { container } = render(
      <CnSankeyChart
        nodes={[
          { id: "a", label: "Origen" },
          { id: "b", label: "Medio" },
          { id: "c", label: "Destino" },
        ]}
        links={[
          { source: "a", target: "b", value: 10 },
          { source: "b", target: "c", value: 6 },
        ]}
      />,
    );
    expect(screen.getByText("Origen")).toBeInTheDocument();
    expect(container.querySelectorAll("path")).toHaveLength(2);
    expect(container.querySelectorAll("rect")).toHaveLength(3);
  });

  it("renders candlesticks with OHLC tooltip", () => {
    const { container } = render(
      <CnCandlestickChart
        data={[
          { date: "2026-01-01", open: 10, high: 12, low: 9, close: 11 },
          { date: "2026-01-02", open: 11, high: 13, low: 10, close: 10 },
        ]}
      />,
    );
    const overlay = container.querySelector('rect[fill="transparent"]') as SVGRectElement;
    overlay.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 600,
      height: 300,
      right: 600,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    fireEvent.mouseMove(overlay, { clientX: 10, clientY: 50 });
    expect(screen.getByText("Apertura")).toBeInTheDocument();
  });

  it("toggles radial bars from the legend", () => {
    const { container } = render(
      <CnRadialBarChart
        legend="right"
        data={[
          { label: "Ventas", value: 80 },
          { label: "NPS", value: 40 },
        ]}
      />,
    );
    const before = container.querySelectorAll("svg path").length;
    fireEvent.click(screen.getByRole("button", { name: /NPS/ }));
    expect(container.querySelectorAll("svg path").length).toBeLessThan(before);
  });

  it("drills down in the treemap", () => {
    render(
      <CnTreemap
        data={[
          {
            label: "TI",
            children: [
              { label: "Nube", value: 70 },
              { label: "Licencias", value: 30 },
            ],
          },
          { label: "RH", value: 40 },
        ]}
      />,
    );
    fireEvent.click(screen.getByText("TI"));
    expect(screen.getByRole("button", { name: /Todo/ })).toBeInTheDocument();
    expect(screen.getByText("Nube")).toBeInTheDocument();
  });
});

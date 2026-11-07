import type { Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";
import {
  CnAreaChartSkeleton,
  CnBarChartSkeleton,
  CnCandlestickChartSkeleton,
  CnChartSkeleton,
  CnComposedChartSkeleton,
  CnDonutChartSkeleton,
  CnFunnelChartSkeleton,
  CnGaugeSkeleton,
  CnHeatmapSkeleton,
  CnLineChartSkeleton,
  CnPieChartSkeleton,
  CnRadarChartSkeleton,
  CnRadialBarChartSkeleton,
  CnRadialLineChartSkeleton,
  CnSankeyChartSkeleton,
  CnScatterChartSkeleton,
  CnSparklineSkeleton,
  CnTreemapSkeleton,
} from "./CnChartSkeleton";

const meta: Meta<typeof CnChartSkeleton> = {
  title: "Charts/Skeletons",
  component: CnChartSkeleton,
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj<typeof CnChartSkeleton>;

const Grid = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      display: "grid",
      gap: 20,
      gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    }}
  >
    {children}
  </div>
);

export const Playground: Story = {
  args: { kind: "bar", frame: "card", header: true, legend: true, animation: "wave", height: 260 },
  argTypes: {
    kind: {
      control: "select",
      options: [
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
      ],
    },
    animation: { control: "inline-radio", options: ["wave", "pulse", "none"] },
    frame: { control: "inline-radio", options: ["card", "plain"] },
  },
};

export const Todos: Story = {
  render: () => (
    <Grid>
      <CnBarChartSkeleton frame="card" header legend legendItems={2} series={2} />
      <CnBarChartSkeleton frame="card" header layout="horizontal" stacked series={3} bars={6} />
      <CnLineChartSkeleton frame="card" header legend series={2} markers />
      <CnAreaChartSkeleton frame="card" header stacked series={2} />
      <CnComposedChartSkeleton frame="card" header legend legendItems={3} />
      <CnScatterChartSkeleton frame="card" header bubble trendLine />
      <CnPieChartSkeleton frame="card" header />
      <CnDonutChartSkeleton frame="card" header />
      <CnPieChartSkeleton frame="card" header variant="half" legend="bottom" />
      <CnGaugeSkeleton frame="card" header segments={3} needle />
      <CnGaugeSkeleton frame="card" header variant="arc" />
      <CnRadarChartSkeleton frame="card" header legend series={2} />
      <CnRadialBarChartSkeleton frame="card" header rings={4} />
      <CnRadialLineChartSkeleton frame="card" header series={2} />
      <CnHeatmapSkeleton frame="card" header />
      <CnHeatmapSkeleton frame="card" header variant="calendar" />
      <CnFunnelChartSkeleton frame="card" header />
      <CnFunnelChartSkeleton frame="card" header orientation="horizontal" variant="bars" />
      <CnSankeyChartSkeleton frame="card" header />
      <CnCandlestickChartSkeleton frame="card" header volume />
      <CnTreemapSkeleton frame="card" header />
      <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
        <CnSparklineSkeleton />
        <CnSparklineSkeleton type="area" />
        <CnSparklineSkeleton type="bar" />
      </div>
    </Grid>
  ),
};

export const Animaciones: Story = {
  render: () => (
    <Grid>
      <CnBarChartSkeleton frame="card" header animation="wave" />
      <CnBarChartSkeleton frame="card" header animation="pulse" />
      <CnBarChartSkeleton frame="card" header animation="none" />
    </Grid>
  ),
};

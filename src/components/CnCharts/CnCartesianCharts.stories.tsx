import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  CnAreaChart,
  CnBarChart,
  CnComposedChart,
  CnHistogram,
  CnLineChart,
} from "./CnCartesianPresets";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const SALES = MONTHS.map((month, i) => ({
  month,
  ventas: Math.round(120000 + Math.sin(i / 1.7) * 40000 + i * 9000),
  meta: 150000 + i * 6000,
  costos: Math.round(70000 + Math.cos(i / 2) * 15000 + i * 4000),
  margen: Math.round(22 + Math.sin(i / 2.2) * 8),
  clientes: Math.round(40 + i * 3 + Math.cos(i) * 6),
}));

const TEAMS = [
  { area: "Desarrollo", horas: 1840, extra: 210, ausencias: 64 },
  { area: "Soporte", horas: 1320, extra: 340, ausencias: 40 },
  { area: "Ventas", horas: 980, extra: 90, ausencias: 25 },
  { area: "Recursos humanos", horas: 640, extra: 30, ausencias: 18 },
  { area: "Finanzas", horas: 720, extra: 120, ausencias: 12 },
  { area: "Operaciones", horas: 1510, extra: 260, ausencias: 51 },
];

const meta: Meta = {
  title: "Charts/Cartesianas",
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj;

export const Barras: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gap: 24,
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
      }}
    >
      <CnBarChart
        title="Ventas vs. meta"
        subtitle="Ejercicio 2026"
        icon="bar_chart"
        data={SALES}
        xKey="month"
        valueFormat="compactCurrency"
        series={[
          { key: "ventas", label: "Ventas", tone: "primary" },
          { key: "costos", label: "Costos", tone: "accent" },
        ]}
        referenceLines={[{ axis: "y", value: 150000, label: "Meta mínima", tone: "success" }]}
        summary={{ value: "$2.1 M", label: "Total acumulado", trend: 12.4, trendLabel: "vs. 2025" }}
        periods
        typeOptions
        zoom
      />
      <CnBarChart
        title="Horas por área"
        subtitle="Horizontal, apilada y con etiquetas"
        data={TEAMS}
        xKey="area"
        layout="horizontal"
        stacked
        barLabels
        valueFormat="integer"
        suffix=" h"
        series={[
          { key: "horas", label: "Ordinarias", tone: "primary" },
          { key: "extra", label: "Extra", tone: "warning" },
          { key: "ausencias", label: "Ausencias", tone: "error" },
        ]}
      />
      <CnBarChart
        title="Mezcla de costos (100 %)"
        data={SALES}
        xKey="month"
        stacked="percent"
        gradient
        series={[
          { key: "ventas", label: "Ventas", tone: "teal" },
          { key: "costos", label: "Costos", tone: "violet" },
        ]}
      />
    </div>
  ),
};

export const LineasYAreas: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gap: 24,
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
      }}
    >
      <CnLineChart
        title="Tendencia de ventas"
        data={SALES}
        xKey="month"
        valueFormat="compactCurrency"
        series={[
          { key: "ventas", label: "Ventas", tone: "primary", movingAverage: 3 },
          { key: "meta", label: "Meta", tone: "success", dashed: true, markers: false },
        ]}
        referenceAreas={[{ x: ["Jun", "Ago"], label: "Temporada baja", tone: "warning" }]}
      />
      <CnAreaChart
        title="Ventas y costos"
        subtitle="Área apilada con gradiente"
        data={SALES}
        xKey="month"
        stacked
        valueFormat="compactCurrency"
        series={[
          { key: "ventas", label: "Ventas", tone: "accent" },
          { key: "costos", label: "Costos", tone: "teal" },
        ]}
      />
    </div>
  ),
};

export const Combinada: Story = {
  render: () => (
    <CnComposedChart
      title="Ventas, margen y clientes"
      subtitle="Doble eje: barras en pesos, línea en %"
      data={SALES}
      xKey="month"
      valueFormat="compactCurrency"
      yRightFormat="percent"
      height={340}
      series={[
        { key: "ventas", label: "Ventas", type: "bar", tone: "primary", gradient: true },
        { key: "costos", label: "Costos", type: "bar", tone: "accent" },
        { key: "margen", label: "Margen", type: "line", axis: "right", tone: "warning" },
      ]}
    />
  ),
};

export const Histograma: Story = {
  render: () => {
    const values = Array.from(
      { length: 400 },
      (_, i) => 18000 + Math.sin(i * 12.9898) * 9000 + (i % 37) * 300,
    );
    return (
      <CnHistogram
        title="Distribución de salarios"
        values={values}
        bins={14}
        valueFormat="compactCurrency"
        tone="violet"
      />
    );
  },
};

export const Estados: Story = {
  render: function EstadosStory() {
    const [loading, setLoading] = useState(true);
    return (
      <div
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
        }}
      >
        <CnBarChart
          title="Cargando"
          data={SALES}
          xKey="month"
          series={[{ key: "ventas", label: "Ventas" }]}
          loading={loading}
          onRefresh={() => setLoading((v) => !v)}
        />
        <CnLineChart
          title="Cargando (líneas)"
          data={SALES}
          xKey="month"
          series={[
            { key: "ventas", label: "Ventas" },
            { key: "meta", label: "Meta" },
          ]}
          loading
        />
        <CnBarChart title="Sin datos" data={[]} series={[{ key: "ventas", label: "Ventas" }]} />
        <CnLineChart
          title="Con error"
          data={SALES}
          xKey="month"
          series={[{ key: "ventas", label: "Ventas" }]}
          error="El servicio de reportes no respondió."
          onRetry={() => undefined}
        />
      </div>
    );
  },
};

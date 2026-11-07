import type { Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";
import { CnCandlestickChart } from "./CnCandlestickChart";
import { CnFunnelChart } from "./CnFunnelChart";
import { CnGauge } from "./CnGauge";
import { CnCalendarHeatmap, CnHeatmap } from "./CnHeatmap";
import { CnDonutChart, CnPieChart } from "./CnPieChart";
import { CnRadarChart } from "./CnRadarChart";
import { CnRadialBarChart, CnRadialLineChart } from "./CnRadialCharts";
import { CnSankeyChart } from "./CnSankeyChart";
import { CnScatterChart } from "./CnScatterChart";
import { CnSparkline } from "./CnSparkline";
import { CnTreemap } from "./CnTreemap";

const meta: Meta = { title: "Charts/Gallery", parameters: { layout: "padded" } };
export default meta;
type Story = StoryObj;

const Grid = ({ children, min = 420 }: { children: ReactNode; min?: number }) => (
  <div
    style={{
      display: "grid",
      gap: 24,
      gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`,
    }}
  >
    {children}
  </div>
);

const STATUS = [
  { label: "Aprobadas", value: 128, tone: "success" },
  { label: "En revisión", value: 64, tone: "warning" },
  { label: "Rechazadas", value: 22, tone: "error" },
  { label: "Borrador", value: 41, tone: "neutral" },
];

export const PastelYDona: Story = {
  render: () => (
    <Grid min={360}>
      <CnDonutChart title="Solicitudes por estado" data={STATUS} valueFormat="integer" />
      <CnPieChart
        title="Gasto por categoría"
        variant="pie"
        valueFormat="compactCurrency"
        maxSlices={5}
        data={[
          { label: "Nómina", value: 820000 },
          { label: "Renta", value: 210000 },
          { label: "Software", value: 96000 },
          { label: "Viáticos", value: 54000 },
          { label: "Capacitación", value: 38000 },
          { label: "Papelería", value: 9000 },
          { label: "Otros gastos", value: 12000 },
        ]}
      />
      <CnPieChart
        title="Avance del presupuesto"
        variant="half"
        data={[
          { label: "Ejercido", value: 62, tone: "accent" },
          { label: "Disponible", value: 38, tone: "neutral" },
        ]}
        valueFormat="percent"
        legend="bottom"
      />
      <CnPieChart
        title="Ventas por región y canal"
        subtitle="Anillos anidados"
        variant="donut"
        valueFormat="compactCurrency"
        data={[
          { label: "Norte", value: 420000 },
          { label: "Centro", value: 610000 },
          { label: "Sur", value: 280000 },
        ]}
        rings={[
          {
            data: [
              { label: "Norte · Tienda", value: 300000 },
              { label: "Norte · Web", value: 120000 },
              { label: "Centro · Tienda", value: 350000 },
              { label: "Centro · Web", value: 260000 },
              { label: "Sur · Tienda", value: 200000 },
              { label: "Sur · Web", value: 80000 },
            ],
          },
        ]}
        legend={false}
      />
    </Grid>
  ),
};

export const DispersionYBurbujas: Story = {
  render: () => {
    const employees = Array.from({ length: 60 }, (_, i) => ({
      antiguedad: (i % 15) + Math.sin(i) * 0.8 + 1,
      salario: 18000 + (i % 15) * 2600 + Math.cos(i * 1.7) * 6000,
      nombre: `Empleado ${i + 1}`,
    }));
    const products = Array.from({ length: 18 }, (_, i) => ({
      x: 10 + ((i * 37) % 90),
      y: 5 + ((i * 53) % 60),
      ventas: 20 + ((i * 71) % 400),
      name: `Producto ${String.fromCharCode(65 + i)}`,
    }));
    return (
      <Grid>
        <CnScatterChart
          title="Salario vs. antigüedad"
          xLabel="Años"
          yLabel="Salario"
          yFormat="compactCurrency"
          series={[
            {
              label: "Plantilla",
              data: employees,
              x: "antiguedad",
              y: "salario",
              name: "nombre",
              trendLine: true,
            },
          ]}
        />
        <CnScatterChart
          title="Portafolio de productos"
          subtitle="Burbuja = ventas · cuadrantes en promedios"
          xLabel="Participación %"
          yLabel="Crecimiento %"
          series={[
            { label: "Productos", data: products, size: "ventas", name: "name", tone: "violet" },
          ]}
          quadrants={{ labels: ["Interrogantes", "Estrellas", "Perros", "Vacas"] }}
        />
      </Grid>
    );
  },
};

export const IndicadoresYRadiales: Story = {
  render: () => (
    <Grid min={300}>
      <CnGauge
        title="Satisfacción"
        value={78}
        valueFormat="percent"
        segments={[
          { to: 50, tone: "error", label: "Baja" },
          { to: 75, tone: "warning", label: "Media" },
          { to: 100, tone: "success", label: "Alta" },
        ]}
        target={85}
        targetLabel="Meta"
      />
      <CnGauge title="Uso de CPU" value={64} variant="arc" valueFormat="percent" tone="accent" />
      <CnGauge
        title="Velocidad de atención"
        value={42}
        needle
        valueFormat="integer"
        suffix=" min"
        max={60}
        segments={[
          { to: 20, tone: "success", label: "Rápida" },
          { to: 40, tone: "warning", label: "Normal" },
          { to: 60, tone: "error", label: "Lenta" },
        ]}
      />
      <CnRadialBarChart
        title="Metas trimestrales"
        data={[
          { label: "Ventas", value: 82 },
          { label: "Clientes nuevos", value: 64 },
          { label: "Retención", value: 91 },
          { label: "NPS", value: 47 },
        ]}
        asPercent
      />
      <CnRadialLineChart
        title="Tickets por hora"
        categories={Array.from({ length: 12 }, (_, i) => `${i * 2}h`)}
        series={[
          { label: "Lunes", data: [4, 2, 1, 3, 12, 28, 34, 30, 26, 18, 10, 6] },
          { label: "Viernes", data: [6, 3, 2, 2, 8, 20, 26, 32, 30, 22, 16, 10] },
        ]}
      />
      <CnRadarChart
        title="Evaluación de competencias"
        metrics={[
          "Liderazgo",
          "Comunicación",
          "Técnica",
          "Trabajo en equipo",
          "Innovación",
          "Puntualidad",
        ]}
        max={10}
        series={[
          { label: "Ana", data: [8, 9, 7, 9, 6, 10] },
          { label: "Promedio del equipo", data: [6, 7, 7, 8, 5, 8], tone: "neutral" },
        ]}
      />
    </Grid>
  ),
};

export const Sparklines: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 18, maxWidth: 420 }}>
      <CnSparkline
        data={[12, 14, 13, 18, 21, 19, 24, 27]}
        showValue
        valueFormat="compactCurrency"
        type="area"
      />
      <CnSparkline data={[30, 28, 31, 26, 22, 24, 19, 17]} showValue showExtremes />
      <CnSparkline data={[30, 28, 31, 26, 22, 24, 19, 17]} showValue invertTrend suffix=" min" />
      <CnSparkline data={[5, 8, 6, 9, 12, 7, 10, 14, 11]} type="bar" tone="accent" showAverage />
      <CnSparkline data={[]} />
      <CnSparkline data={[1, 2]} loading type="area" />
    </div>
  ),
};

export const MapasDeCalor: Story = {
  render: () => {
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const hours = ["8h", "10h", "12h", "14h", "16h", "18h", "20h"];
    const grid = days.flatMap((d, di) =>
      hours.map((h, hi) => ({
        x: h,
        y: d,
        value: Math.round(
          Math.max(
            0,
            40 * Math.sin((hi + 1) / 2) - di * (di > 4 ? 8 : 2) + ((di * 7 + hi * 3) % 9),
          ),
        ),
      })),
    );
    const start = new Date(2026, 0, 1);
    const calendar = Array.from({ length: 300 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return { date: d, value: d.getDay() % 6 === 0 ? 0 : (i * 7) % 11 };
    });
    return (
      <Grid min={520}>
        <CnHeatmap
          title="Accesos por día y hora"
          data={grid}
          scale="accent"
          xLabel="Hora"
          yLabel="Día"
        />
        <CnHeatmap
          title="Variación vs. presupuesto"
          subtitle="Escala divergente"
          diverging
          valueFormat="percent"
          data={["Ventas", "Marketing", "TI", "RH"].flatMap((a, ai) =>
            ["T1", "T2", "T3", "T4"].map((q, qi) => ({
              x: q,
              y: a,
              value: ((ai * 13 + qi * 7) % 30) - 15,
            })),
          )}
        />
        <CnCalendarHeatmap title="Registros de asistencia" data={calendar} scale="success" />
      </Grid>
    );
  },
};

export const FlujosYJerarquias: Story = {
  render: () => (
    <Grid min={480}>
      <CnFunnelChart
        title="Embudo de reclutamiento"
        conversion="both"
        steps={[
          { label: "Postulaciones", value: 1240 },
          { label: "Filtro curricular", value: 610 },
          { label: "Entrevista", value: 182 },
          { label: "Prueba técnica", value: 74 },
          { label: "Oferta", value: 21 },
          { label: "Contratados", value: 17 },
        ]}
      />
      <CnFunnelChart
        title="Ventas (horizontal)"
        orientation="horizontal"
        multicolor
        steps={[
          { label: "Visitas", value: 9800 },
          { label: "Leads", value: 2400 },
          { label: "Oportunidades", value: 640 },
          { label: "Cierres", value: 128 },
        ]}
      />
      <CnSankeyChart
        title="Flujo del presupuesto"
        valueFormat="compactCurrency"
        nodes={[
          { id: "ing", label: "Ingresos" },
          { id: "op", label: "Operación" },
          { id: "inv", label: "Inversión" },
          { id: "nom", label: "Nómina" },
          { id: "ren", label: "Renta" },
          { id: "ti", label: "TI" },
          { id: "ahorro", label: "Ahorro" },
        ]}
        links={[
          { source: "ing", target: "op", value: 700000 },
          { source: "ing", target: "inv", value: 250000 },
          { source: "ing", target: "ahorro", value: 50000 },
          { source: "op", target: "nom", value: 480000 },
          { source: "op", target: "ren", value: 220000 },
          { source: "inv", target: "ti", value: 250000 },
        ]}
      />
      <CnTreemap
        title="Gasto por área"
        valueFormat="compactCurrency"
        data={[
          {
            label: "Tecnología",
            children: [
              { label: "Licencias", value: 320000 },
              { label: "Nube", value: 210000 },
              { label: "Equipo", value: 140000 },
            ],
          },
          {
            label: "Operaciones",
            children: [
              { label: "Logística", value: 260000 },
              { label: "Mantenimiento", value: 90000 },
            ],
          },
          {
            label: "Personas",
            children: [
              { label: "Capacitación", value: 120000 },
              { label: "Beneficios", value: 180000 },
            ],
          },
          { label: "Marketing", value: 150000 },
        ]}
      />
    </Grid>
  ),
};

export const Velas: Story = {
  render: () => {
    let close = 100;
    const data = Array.from({ length: 45 }, (_, i) => {
      const open = close;
      close = Math.max(60, open + Math.sin(i * 1.3) * 4 + Math.cos(i * 0.7) * 2);
      const d = new Date(2026, 8, 1 + i);
      return {
        date: d,
        open,
        close,
        high: Math.max(open, close) + 2 + (i % 3),
        low: Math.min(open, close) - 2 - (i % 2),
        volume: 1000 + ((i * 377) % 4000),
      };
    });
    return (
      <CnCandlestickChart
        title="Precio de la acción"
        valueFormat="currency"
        data={data}
        movingAverages={[5, 15]}
      />
    );
  },
};

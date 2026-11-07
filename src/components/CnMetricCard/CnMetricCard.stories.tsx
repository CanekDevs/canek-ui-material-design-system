import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { CnMetricCard, CnSparkline } from "./CnMetricCard";

const meta: Meta<typeof CnMetricCard> = {
  title: "Data Display/CnMetricCard",
  component: CnMetricCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    title: "Ventas del mes",
    value: 1284500,
    format: (v: number) =>
      v.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }),
    icon: "payments",
    trend: { value: 12.4, label: "vs. mes anterior" },
    sparkline: [8, 9, 7, 11, 10, 13, 14],
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["outlined", "elevated", "filled"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    color: {
      control: "select",
      options: ["primary", "success", "warning", "error", "info", "accent", "neutral"],
    },
  },
  decorators: [(Story) => <Box sx={{ maxWidth: 340 }}>{Story()}</Box>],
};

export default meta;
type Story = StoryObj<typeof CnMetricCard>;

export const Default: Story = {};

const grid = {
  display: "grid",
  gap: "16px",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
};

export const Gallery: Story = {
  decorators: [(Story) => <Box sx={{ maxWidth: 1100 }}>{Story()}</Box>],
  render: () => (
    <Box sx={grid}>
      <CnMetricCard
        title="Costos (subir es malo)"
        value={384200}
        prefix="$"
        icon="receipt_long"
        color="warning"
        trend={{ value: 6.1, upIsGood: false, label: "vs. mes anterior" }}
        sparkline={[5, 6, 6, 7, 7, 8, 9]}
        sparklineType="bar"
      />
      <CnMetricCard
        title="Meta trimestral"
        value={68}
        suffix="%"
        icon="flag"
        color="success"
        progress={{ value: 68, label: "6.8 de 10 M" }}
      />
      <CnMetricCard
        title="Tickets abiertos"
        value={23}
        icon="support_agent"
        variant="filled"
        trend={{ value: -18, label: "esta semana" }}
        footer="Actualizado hace 5 min"
        onClick={() => {}}
      />
      <CnMetricCard
        title="Clientes activos"
        value={1532}
        icon="groups"
        variant="elevated"
        description="Con al menos una compra en 90 días"
      />
      <CnMetricCard title="Sin datos" value={null} icon="help" color="neutral" />
      <CnMetricCard title="Cargando" value={0} icon="hourglass_empty" loading />
      <CnMetricCard
        title="Chico"
        value={42}
        size="sm"
        icon="bolt"
        color="accent"
        trend={{ value: 0 }}
      />
      <CnMetricCard
        title="Grande"
        value={9800}
        size="lg"
        icon="trending_up"
        color="info"
        sparkline={[3, 4, 2, 6, 8, 7, 9]}
        sparklineType="line"
      />
    </Box>
  ),
};

export const Sparkline: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "16px", color: "var(--cn-color-brand-600, #254d87)" }}>
      <CnSparkline data={[3, 5, 4, 8, 6, 9, 12]} type="area" />
      <CnSparkline data={[3, 5, 4, 8, 6, 9, 12]} type="line" />
      <CnSparkline data={[3, 5, 4, 8, 6, 9, 12]} type="bar" />
    </Box>
  ),
};

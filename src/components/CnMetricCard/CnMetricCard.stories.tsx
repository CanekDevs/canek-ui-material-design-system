import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import Typography from "@mui/material/Typography";
import { CnChip } from "../CnChip";
import { CnMetricCard, CnSparkline } from "./CnMetricCard";
import { CnMetricCardSkeleton } from "./CnMetricCardSkeleton";

const meta: Meta<typeof CnMetricCard> = {
  title: "Data Display/CnMetricCard",
  component: CnMetricCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          '**Para qué sirve:** mostrar un dato destacado. `layout="stacked"` (por defecto) es el KPI con valor grande, tendencia, mini gráfica y avance; `layout="inline"` es el *tile de dato* "etiqueta + valor" con ícono al lado (el patrón de `TbInfoCard` en Tabantaj), con `badge`, `href`, `minHeight` y variantes `soft`/`left-accent`.',
          "",
          "**Cuándo NO usarlo:** para avisos o mensajes con estado (info, advertencia, error) usa `CnAlert` (incluye `left-accent`, acciones y detalles plegables); para bloques de contenido con encabezado usa `CnSectionCard`; para tarjetas con imagen o contenido libre usa `CnCard`.",
          "",
          '**Relación con vecinos:** recibe el antiguo modo dato de `CnInfoCard` (`label` + `value` → `title` + `value` con `layout="inline"`). Comparte la paleta semántica con `CnAlert` y `CnChip` (útil como `badge`).',
        ].join("\n"),
      },
    },
  },
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
    variant: {
      control: "inline-radio",
      options: ["outlined", "elevated", "filled", "soft", "left-accent"],
    },
    layout: { control: "inline-radio", options: ["stacked", "inline"] },
    iconPosition: { control: "inline-radio", options: ["start", "end"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    color: {
      control: "select",
      options: ["primary", "success", "warning", "error", "info", "accent", "neutral"],
    },
  },
  // Ancho por historia con `parameters.maxWidth` (por defecto, una tarjeta: 340px).
  decorators: [
    (Story, ctx) => (
      <Box sx={{ maxWidth: (ctx.parameters.maxWidth as number | "none" | undefined) ?? 340 }}>
        {Story()}
      </Box>
    ),
  ],
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
  parameters: { maxWidth: 1100 },
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

/** Estado de carga: el skeleton sigue las variantes del indicador (`loading`/`skeleton` o `CnMetricCardSkeleton`). */
export const Skeleton: Story = {
  parameters: { maxWidth: 1100 },
  render: () => (
    <Box sx={grid}>
      <CnMetricCard
        title="Ventas"
        value={0}
        icon="payments"
        trend={{ value: 4 }}
        sparkline={[1, 2, 3]}
        skeleton
      />
      <CnMetricCardSkeleton sparkline sparklineType="line" />
      <CnMetricCardSkeleton variant="elevated" sparkline sparklineType="bar" />
      <CnMetricCardSkeleton variant="filled" trend={false} progress />
      <CnMetricCardSkeleton size="sm" icon={false} description />
      <CnMetricCardSkeleton size="lg" sparkline footer description={2} />
      <CnMetricCardSkeleton variant="soft" badge />
      <CnMetricCardSkeleton layout="inline" trend={false} minHeight={85} />
      <CnMetricCardSkeleton layout="inline" variant="left-accent" trend={false} badge />
      <CnMetricCard title="RFC" value="" icon="verified" layout="inline" skeleton minHeight={85} />
    </Box>
  ),
};

const tileGrid = {
  display: "grid",
  gap: "16px",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
};

/** Tiles de dato "etiqueta + valor" (`layout="inline"`), como la ficha de cliente de Tabantaj. */
export const DataTiles: Story = {
  parameters: { maxWidth: 1100 },
  render: () => (
    <Box sx={tileGrid}>
      <CnMetricCard layout="inline" title="ID" value="CLI-000245" icon="badge" minHeight={85} />
      <CnMetricCard
        layout="inline"
        title="Código"
        value="ACME"
        icon="lock"
        color="neutral"
        minHeight={85}
      />
      <CnMetricCard
        layout="inline"
        title="Nombre comercial"
        value="Acme Distribuciones"
        icon="storefront"
        color="success"
        minHeight={85}
      />
      <CnMetricCard
        layout="inline"
        title="RFC"
        value="ADI920101AB1"
        icon="verified"
        color="error"
        badge={<CnChip size="small" color="success" label="Vigente" />}
        minHeight={85}
      />
      <CnMetricCard
        layout="inline"
        title="Total contratos"
        value={12}
        icon="tag"
        color="info"
        variant="soft"
        minHeight={85}
      />
      <CnMetricCard
        layout="inline"
        title="Monto total"
        value={1284500}
        format={(v) => v.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
        icon="attach_money"
        color="success"
        variant="left-accent"
        minHeight={85}
      />
      <CnMetricCard
        layout="inline"
        iconPosition="end"
        title="Responsable"
        value="María Pérez"
        icon="person"
        color="accent"
        href="#"
        minHeight={85}
      />
      <CnMetricCard
        layout="inline"
        title="Sin dato"
        value={null}
        icon="help"
        color="neutral"
        size="sm"
      />
      <CnMetricCard
        layout="inline"
        title="Horas aprobadas"
        value={248}
        suffix="h"
        icon="schedule"
        variant="filled"
        size="lg"
      />
    </Box>
  ),
};

const LONG =
  "Distribuidora Internacional de Productos Industriales y Comerciales del Sureste SA de CV";
const EMAIL = "facturacion.cuentas.por.cobrar.corporativo@empresa-con-dominio-muy-largo.com.mx";

const StressTiles = () => (
  <Box sx={{ display: "grid", gap: "12px" }}>
    <CnMetricCard
      layout="inline"
      title={`Razón social de ${LONG}`}
      value={LONG}
      icon="business"
      badge={<CnChip size="small" color="warning" label="Revisión pendiente de validar" />}
    />
    <CnMetricCard layout="inline" title="Correo" value={EMAIL} icon="mail" variant="left-accent" />
    <CnMetricCard
      layout="inline"
      iconPosition="end"
      title="Monto"
      value={98765432109876}
      prefix="$"
      suffix="MXN"
      icon="attach_money"
      variant="soft"
    />
    <CnMetricCard
      title={LONG}
      value={98765432109876}
      prefix="$"
      icon="payments"
      badge={<CnChip size="small" color="success" label="Meta superada" />}
      trend={{ value: 12.4, label: "vs. el mismo periodo del ejercicio fiscal anterior" }}
      sparkline={[3, 4, 2, 6, 8, 7, 9]}
      footer={EMAIL}
    />
    <CnMetricCard layout="inline" title="Vacío" value={undefined} />
  </Box>
);

/** Datos extremos (nombres de 60+ caracteres, correos, montos enormes, vacío) a 320, 480 y 1200 px. */
export const Responsive: Story = {
  parameters: { maxWidth: "none" },
  render: () => (
    <Box sx={{ display: "grid", gap: "24px" }}>
      {[320, 480, 1200].map((width) => (
        <Box key={width} data-stress-width={width} sx={{ width }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {width}px
          </Typography>
          <Box sx={{ border: "1px dashed var(--cn-color-border, #dde0e4)", p: "4px" }}>
            <StressTiles />
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

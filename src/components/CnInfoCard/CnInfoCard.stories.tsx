import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnButton } from "../CnButton";
import { CnInfoCard } from "./CnInfoCard";
import { CnInfoCardSkeleton } from "./CnInfoCardSkeleton";

const TONES = ["info", "success", "warning", "error", "neutral", "accent", "primary"] as const;
const VARIANTS = ["soft", "outlined", "filled", "left-accent", "elevated"] as const;

const meta: Meta<typeof CnInfoCard> = {
  title: "Data Display/CnInfoCard",
  component: CnInfoCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    tone: "info",
    variant: "soft",
    title: "Nueva versión disponible",
    description: "La versión 4.2 incluye mejoras en reportes y en la exportación a Excel.",
  },
  argTypes: {
    tone: { control: "select", options: TONES },
    variant: { control: "select", options: VARIANTS },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    layout: { control: "inline-radio", options: ["horizontal", "vertical"] },
  },
  decorators: [(Story) => <Box sx={{ maxWidth: 560 }}>{Story()}</Box>],
};

export default meta;
type Story = StoryObj<typeof CnInfoCard>;

const grid = {
  display: "grid",
  gap: "12px",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
};

export const Default: Story = {};

/** Todos los tonos en cada variante. */
export const TonesAndVariants: Story = {
  decorators: [(Story) => <Box>{Story()}</Box>],
  render: () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {VARIANTS.map((variant) => (
        <Box key={variant} sx={grid}>
          {TONES.map((tone) => (
            <CnInfoCard
              key={tone}
              tone={tone}
              variant={variant}
              title={`${variant} · ${tone}`}
              description="Mensaje informativo breve."
            />
          ))}
        </Box>
      ))}
    </Box>
  ),
};

export const WithActions: Story = {
  args: {
    tone: "warning",
    title: "Tu certificado SAT vence en 5 días",
    description: "Renueva el CSD para seguir timbrando facturas sin interrupciones.",
    actions: [
      { label: "Renovar ahora", icon: "autorenew" },
      { label: "Recordarme mañana" },
      {
        label: "¿Cómo renovarlo?",
        variant: "link",
        href: "https://www.sat.gob.mx",
        target: "_blank",
      },
    ],
  },
};

export const DismissibleAndDetails: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(true);
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <CnInfoCard
          {...args}
          tone="success"
          title="Pago registrado"
          description="El pago de $12,450.00 MXN se aplicó a la factura A-1024."
          dismissible
          open={open}
          onDismiss={() => setOpen(false)}
          details={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Referencia: SPEI 908812</li>
              <li>Banco: BBVA</li>
              <li>Fecha: 19 nov 2026</li>
            </ul>
          }
        />
        {!open && (
          <CnButton size="small" variant="outlined" onClick={() => setOpen(true)}>
            Mostrar de nuevo
          </CnButton>
        )}
        <CnInfoCard
          tone="neutral"
          variant="outlined"
          title="Aviso no controlado"
          description="Se oculta solo al cerrarlo."
          dismissible
        />
      </Box>
    );
  },
};

/** Modo dato (equivalente a TbInfoCard): `label` + `value` + insignia. */
export const DataMode: Story = {
  decorators: [(Story) => <Box>{Story()}</Box>],
  render: () => (
    <Box sx={grid}>
      <CnInfoCard variant="outlined" tone="primary" label="ID" value="CL-000128" icon="tag" />
      <CnInfoCard variant="outlined" tone="neutral" label="Código" value="ACME-MX" icon="lock" />
      <CnInfoCard
        variant="outlined"
        tone="error"
        label="RFC"
        value="ACM010101ABC"
        icon="verified"
        badge={{ label: "Validado", color: "success", icon: "check_circle" }}
      />
      <CnInfoCard
        variant="filled"
        tone="accent"
        label="Plan"
        value="Empresarial"
        icon="workspace_premium"
      />
      <CnInfoCard
        variant="left-accent"
        tone="success"
        label="Estatus"
        value="Activo"
        icon="task_alt"
      />
      <CnInfoCard
        variant="soft"
        tone="info"
        label="Razón social"
        value="Acme Comercializadora del Centro, S.A. de C.V."
        icon="business"
        size="sm"
      />
    </Box>
  ),
};

export const VerticalFeatures: Story = {
  decorators: [(Story) => <Box>{Story()}</Box>],
  render: () => (
    <Box sx={grid}>
      <CnInfoCard
        layout="vertical"
        variant="elevated"
        tone="accent"
        icon="bolt"
        title="Facturación en segundos"
        description="Timbra CFDI 4.0 desde cualquier pantalla."
      />
      <CnInfoCard
        layout="vertical"
        variant="elevated"
        tone="success"
        icon="shield"
        title="Datos protegidos"
        description="Cifrado en tránsito y en reposo."
      />
      <CnInfoCard
        layout="vertical"
        variant="elevated"
        tone="info"
        icon="insights"
        title="Reportes en vivo"
        description="Tableros que se actualizan solos."
        actions={[{ label: "Explorar", variant: "outlined" }]}
      />
    </Box>
  ),
};

export const WithMedia: Story = {
  args: {
    tone: "primary",
    variant: "outlined",
    title: "Capacitación: nuevo módulo de nómina",
    description: "Jueves 27 de noviembre, 10:00 h. Sala virtual.",
    media: (
      <img
        src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=640&h=260&fit=crop"
        alt=""
      />
    ),
    actions: [{ label: "Registrarme", icon: "event_available" }],
  },
};

export const MediaAtStart: Story = {
  args: {
    tone: "neutral",
    variant: "outlined",
    icon: false,
    mediaPosition: "start",
    title: "Guía de bienvenida",
    description: "Todo lo que necesitas en tu primera semana.",
    media: (
      <img
        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=240&h=200&fit=crop"
        alt=""
      />
    ),
    actions: [{ label: "Abrir guía", variant: "link" }],
  },
};

export const Clickable: Story = {
  args: {
    tone: "info",
    variant: "outlined",
    title: "Ver estado de cuenta",
    description: "Abre el detalle de movimientos del mes.",
    icon: "receipt_long",
    onClick: () => alert("Tarjeta clicada"),
  },
};

/** Estado de carga: `skeleton` / `loading` o `CnInfoCardSkeleton` directo. */
export const Skeleton: Story = {
  decorators: [(Story) => <Box>{Story()}</Box>],
  render: () => (
    <Box sx={grid}>
      <CnInfoCard title="x" description="y" actions={[{ label: "a" }]} skeleton />
      <CnInfoCardSkeleton variant="outlined" label value lines={0} />
      <CnInfoCardSkeleton variant="left-accent" dismissible />
      <CnInfoCardSkeleton variant="elevated" layout="vertical" actions={1} />
      <CnInfoCardSkeleton variant="outlined" media actions={1} />
    </Box>
  ),
};

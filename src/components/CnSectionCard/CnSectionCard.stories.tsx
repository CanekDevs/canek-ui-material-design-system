import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { catalogDocs } from "../../catalog";
import { useState } from "react";
import { CnButton } from "../CnButton";
import { CnSectionCard } from "./CnSectionCard";
import { CnSectionCardSkeleton } from "./CnSectionCardSkeleton";

const meta: Meta<typeof CnSectionCard> = {
  title: "Data Display/CnSectionCard",
  component: CnSectionCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: catalogDocs("CnSectionCard") } },
  },
  args: {
    title: "Datos generales",
    subtitle: "Información fiscal y de contacto del cliente",
    icon: "business",
    children: (
      <Typography sx={{ fontSize: 13 }}>
        Contenido de la sección: formularios, tablas, tarjetas…
      </Typography>
    ),
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["outlined", "elevated", "filled", "ghost"] },
    padding: { control: "inline-radio", options: ["none", "sm", "md", "lg"] },
    iconTone: {
      control: "select",
      options: ["primary", "info", "success", "warning", "error", "neutral", "accent"],
    },
  },
  decorators: [(Story) => <Box sx={{ maxWidth: 720 }}>{Story()}</Box>],
};

export default meta;
type Story = StoryObj<typeof CnSectionCard>;

export const Default: Story = {};

export const HeaderAndFooter: Story = {
  args: {
    badge: { label: "Borrador", color: "warning", icon: "edit_note" },
    caption: "Última edición: hace 5 min por Ana López",
    accent: "primary",
    headerActions: (
      <CnButton size="small" variant="text" startIcon="edit">
        Editar
      </CnButton>
    ),
    footer: (
      <>
        <CnButton variant="text" color="neutral">
          Cancelar
        </CnButton>
        <CnButton>Guardar</CnButton>
      </>
    ),
  },
};

export const Variants: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "16px" }}>
      {(["outlined", "elevated", "filled", "ghost"] as const).map((variant) => (
        <CnSectionCard key={variant} variant={variant} title={variant} icon="layers" badge={3}>
          <Typography sx={{ fontSize: 13 }}>Variante {variant}.</Typography>
        </CnSectionCard>
      ))}
    </Box>
  ),
};

export const Collapsible: Story = {
  render: function Render() {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <Box sx={{ display: "grid", gap: "16px" }}>
        <CnSectionCard
          title="Controlada"
          subtitle={collapsed ? "Plegada" : "Expandida"}
          icon="tune"
          collapsible
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          footer={<CnButton size="small">Aplicar</CnButton>}
        >
          <Typography sx={{ fontSize: 13 }}>Haz clic en el encabezado o en la flecha.</Typography>
        </CnSectionCard>
        <CnSectionCard title="Plegada al inicio" icon="history" collapsible defaultCollapsed>
          <Typography sx={{ fontSize: 13 }}>Historial de cambios…</Typography>
        </CnSectionCard>
      </Box>
    );
  },
};

export const States: Story = {
  render: function Render() {
    const [error, setError] = useState(true);
    return (
      <Box sx={{ display: "grid", gap: "16px" }}>
        <CnSectionCard title="Cargando" icon="hourglass_empty" loading loadingLines={4} />
        <CnSectionCard
          title="Vacía"
          icon="inbox"
          empty
          emptyState={{
            title: "Sin documentos",
            description: "Sube el primer archivo para empezar.",
            action: (
              <CnButton size="small" startIcon="upload">
                Subir
              </CnButton>
            ),
          }}
        />
        <CnSectionCard
          title="Con error"
          icon="cloud_off"
          iconTone="error"
          error={error && "No pudimos cargar los movimientos."}
          onRetry={() => setError(false)}
        >
          <Typography sx={{ fontSize: 13 }}>¡Listo! Movimientos cargados.</Typography>
        </CnSectionCard>
      </Box>
    );
  },
};

/** Secciones anidadas: las internas se ven más ligeras y bajan el nivel de encabezado. */
export const Nested: Story = {
  render: () => (
    <CnSectionCard title="Expediente del empleado" icon="badge" subtitle="Juan Martínez">
      <Box sx={{ display: "grid", gap: "12px" }}>
        <CnSectionCard title="Datos personales" icon="person" collapsible>
          <Typography sx={{ fontSize: 12 }}>CURP, RFC, NSS…</Typography>
        </CnSectionCard>
        <CnSectionCard
          title="Contrato"
          icon="description"
          badge="Vigente"
          collapsible
          defaultCollapsed
        >
          <Typography sx={{ fontSize: 12 }}>Indeterminado desde 2021.</Typography>
        </CnSectionCard>
      </Box>
    </CnSectionCard>
  ),
};

/** Secciones repetibles: asa, eliminar y añadir. */
export const Repeatable: Story = {
  render: function Render() {
    const [items, setItems] = useState([1, 2]);
    return (
      <Box sx={{ display: "grid", gap: "12px" }}>
        {items.map((n, i) => (
          <CnSectionCard
            key={n}
            title={`Contacto ${i + 1}`}
            icon="contacts"
            dragHandle
            onRemove={items.length > 1 ? () => setItems(items.filter((x) => x !== n)) : undefined}
            onAdd={
              i === items.length - 1
                ? () => setItems([...items, Math.max(...items) + 1])
                : undefined
            }
            addLabel="Añadir contacto"
          >
            <Typography sx={{ fontSize: 12 }}>Campos del contacto…</Typography>
          </CnSectionCard>
        ))}
      </Box>
    );
  },
};

export const StickyHeader: Story = {
  render: () => (
    <Box sx={{ height: 320, overflow: "auto", p: "4px" }}>
      <CnSectionCard title="Encabezado fijo" icon="push_pin" stickyHeader subtitle="Desplázate">
        {Array.from({ length: 30 }, (_, i) => (
          <Typography key={i} sx={{ fontSize: 13, py: "4px" }}>
            Fila {i + 1}
          </Typography>
        ))}
      </CnSectionCard>
    </Box>
  ),
};

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "16px" }}>
      <CnSectionCard title="x" subtitle="y" footer={<span />} skeleton />
      <CnSectionCardSkeleton variant="elevated" badge content={120} />
      <CnSectionCardSkeleton variant="filled" avatar lines={2} headerActions={0} />
    </Box>
  ),
};

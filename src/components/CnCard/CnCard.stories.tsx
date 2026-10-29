import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { CnButton } from "../CnButton";
import { CnChip } from "../CnChip";
import { CnIcon } from "../CnIcon";
import { CnCard } from "./CnCard";

const meta: Meta<typeof CnCard> = {
  title: "Components/CnCard",
  component: CnCard,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["elevated", "outlined", "filled", "ghost"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    padding: {
      control: "select",
      options: ["none", "sm", "md", "lg"],
    },
    shadow: {
      control: "select",
      options: ["none", "xs", "sm", "md", "lg", "xl"],
    },
    radius: {
      control: "select",
      options: ["none", "sm", "md", "lg", "xl", "full"],
    },
    layout: {
      control: "select",
      options: ["vertical", "horizontal"],
    },
    accentPosition: {
      control: "select",
      options: ["top", "left"],
    },
    interactive: { control: "boolean" },
    disabled: { control: "boolean" },
    glass: { control: "boolean" },
    loading: { control: "boolean" },
    empty: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof CnCard>;

export const Default: Story = {
  args: {
    title: "Título de la tarjeta",
    subtitle: "Subtítulo opcional",
    description: "Una descripción breve que explica el contenido de la tarjeta.",
    padding: "md",
    size: "md",
  },
};

export const Variants: Story = {
  render: () => (
    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
      <Box sx={{ width: 220 }}>
        <CnCard variant="elevated" title="Elevated" description="Con sombra" />
      </Box>
      <Box sx={{ width: 220 }}>
        <CnCard variant="outlined" title="Outlined" description="Con borde" />
      </Box>
      <Box sx={{ width: 220 }}>
        <CnCard variant="filled" title="Filled" description="Con fondo" />
      </Box>
      <Box sx={{ width: 220 }}>
        <CnCard variant="ghost" title="Ghost" description="Sin fondo ni borde" />
      </Box>
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Box sx={{ width: 200 }}>
        <CnCard size="sm" title="Small" description="Card pequeña" icon="bolt" />
      </Box>
      <Box sx={{ width: 220 }}>
        <CnCard size="md" title="Medium" description="Card mediana" icon="bolt" />
      </Box>
      <Box sx={{ width: 240 }}>
        <CnCard size="lg" title="Large" description="Card grande" icon="bolt" />
      </Box>
    </Stack>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
      <Box sx={{ width: 240 }}>
        <CnCard
          title="Con icono"
          subtitle="Icono por nombre"
          description="Usa un string"
          icon="bolt"
        />
      </Box>
      <Box sx={{ width: 240 }}>
        <CnCard
          title="Con color"
          subtitle="Icono con token"
          description="Color semántico"
          icon={{ name: "check_circle", color: "success" }}
        />
      </Box>
      <Box sx={{ width: 240 }}>
        <CnCard
          title="Custom"
          subtitle="Color hex"
          description="Icono personalizado"
          icon={{ name: "star", color: "warning", size: 20 }}
        />
      </Box>
    </Stack>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Box sx={{ width: 320 }}>
      <CnCard
        title="Configuración"
        subtitle="Ajustes de la cuenta"
        description="Administra las preferencias del usuario."
        icon="settings"
        headerActions={
          <CnButton iconOnly icon="more_vert" variant="text" aria-label="Más opciones" />
        }
        footer={
          <>
            <CnButton variant="text" color="neutral">
              Cancelar
            </CnButton>
            <CnButton variant="contained">Guardar</CnButton>
          </>
        }
      />
    </Box>
  ),
};

export const WithMedia: Story = {
  render: () => (
    <Box sx={{ width: 280 }}>
      <CnCard
        title="Producto"
        subtitle="$1,299.00 MXN"
        description="Laptop con procesador de última generación."
        media={
          <img
            src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=240&fit=crop"
            alt="Laptop"
          />
        }
        footer={
          <CnButton variant="contained" fullWidth>
            Añadir al carrito
          </CnButton>
        }
      />
    </Box>
  ),
};

export const HorizontalLayout: Story = {
  render: () => (
    <Box sx={{ width: 480 }}>
      <CnCard
        layout="horizontal"
        title="Laptop Pro"
        subtitle="SKU: LP-2024-001"
        description="Laptop de alto rendimiento con 32GB RAM y 1TB SSD."
        icon="inventory_2"
        media={
          <img
            src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=320&h=240&fit=crop"
            alt="Producto"
          />
        }
        footer={<CnChip label="En stock" color="success" icon="check_circle" size="small" />}
      />
    </Box>
  ),
};

export const AccentBorders: Story = {
  render: () => (
    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
      <Box sx={{ width: 220 }}>
        <CnCard
          variant="outlined"
          title="Primary"
          accentColor="var(--cn-color-brand-500)"
          accentPosition="top"
          padding="md"
        >
          <Typography variant="body2">Con borde superior</Typography>
        </CnCard>
      </Box>
      <Box sx={{ width: 220 }}>
        <CnCard
          variant="outlined"
          title="Success"
          accentColor="var(--cn-color-success-500)"
          accentPosition="left"
          padding="md"
        >
          <Typography variant="body2">Con borde izquierdo</Typography>
        </CnCard>
      </Box>
    </Stack>
  ),
};

export const Glass: Story = {
  render: () => (
    <Box
      sx={{
        p: 4,
        background: "linear-gradient(135deg, #5081c4 0%, #3562a6 100%)",
        borderRadius: 3,
      }}
    >
      <Box sx={{ width: 320 }}>
        <CnCard glass title="Glass Card" description="Efecto glassmorphism con backdrop-filter." />
      </Box>
    </Box>
  ),
};

export const Interactive: Story = {
  render: () => (
    <Box sx={{ width: 280 }}>
      <CnCard
        interactive
        title="Click me"
        subtitle="Tarjeta interactiva"
        description="Haz click en cualquier parte de la tarjeta"
        icon="touch_app"
        onClick={() => alert("Card clicked")}
      />
    </Box>
  ),
};

export const AsLink: Story = {
  render: () => (
    <Box sx={{ width: 280 }}>
      <CnCard
        interactive
        href="https://canek.mx"
        target="_blank"
        title="Ir a Canek"
        description="Esta tarjeta es un enlace externo"
        icon="open_in_new"
      />
    </Box>
  ),
};

export const WithDividers: Story = {
  render: () => (
    <Box sx={{ width: 320 }}>
      <CnCard
        dividers
        title="Con divisores"
        subtitle="Separación entre secciones"
        description="Los divisores separan visualmente el header, body y footer."
        footer={<CnButton variant="outlined">Acción</CnButton>}
      />
    </Box>
  ),
};

export const Loading: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <Box sx={{ width: 240 }}>
        <CnCard loading />
      </Box>
      <Box sx={{ width: 280 }}>
        <CnCard loading size="lg" />
      </Box>
    </Stack>
  ),
};

export const Empty: Story = {
  render: () => (
    <Box sx={{ width: 320 }}>
      <CnCard
        empty
        emptyTitle="Sin productos"
        emptyDescription="Aún no has agregado productos a tu catálogo."
        emptyIcon="inventory_2"
        emptyAction={<CnButton variant="contained">Agregar producto</CnButton>}
      />
    </Box>
  ),
};

export const DashboardGrid: Story = {
  render: () => {
    const metrics: Array<{
      title: string;
      value: string;
      icon: string;
      color: "success" | "info" | "primary" | "accent";
    }> = [
      { title: "Ventas hoy", value: "$12,450", icon: "trending_up", color: "success" },
      { title: "Pedidos", value: "48", icon: "receipt", color: "info" },
      { title: "Clientes", value: "124", icon: "group", color: "primary" },
      { title: "Productos", value: "312", icon: "inventory_2", color: "accent" },
    ];

    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 2,
        }}
      >
        {metrics.map((metric) => (
          <CnCard
            key={metric.title}
            variant="outlined"
            padding="md"
            icon={{ name: metric.icon, color: metric.color }}
            headerActions={<CnIcon name="more_horiz" color="muted" />}
          >
            <Typography sx={{ fontSize: 22, fontWeight: 700 }}>{metric.value}</Typography>
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{metric.title}</Typography>
          </CnCard>
        ))}
      </Box>
    );
  },
};

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { CnChip } from "./CnChip";

const meta: Meta<typeof CnChip> = {
  title: "Components/CnChip",
  component: CnChip,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["filled", "outlined", "soft", "light", "ghost"],
    },
    color: {
      control: "select",
      options: ["primary", "secondary", "success", "warning", "error", "info", "accent", "neutral"],
    },
    size: {
      control: "select",
      options: ["small", "medium", "large"],
    },
    shape: {
      control: "select",
      options: ["pill", "rounded", "circle"],
    },
    textTransform: {
      control: "select",
      options: ["none", "capitalize", "uppercase", "lowercase"],
    },
    multiline: { control: "boolean" },
    compact: { control: "boolean" },
    pulse: { control: "boolean" },
    glow: { control: "boolean" },
    disabled: { control: "boolean" },
    clickable: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof CnChip>;

export const Default: Story = {
  args: {
    label: "Activo",
    variant: "soft",
    color: "primary",
    size: "medium",
  },
};

export const Variants: Story = {
  render: () => (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
      <CnChip label="Filled" variant="filled" color="primary" />
      <CnChip label="Outlined" variant="outlined" color="primary" />
      <CnChip label="Soft" variant="soft" color="primary" />
      <CnChip label="Light" variant="light" color="primary" />
      <CnChip label="Ghost" variant="ghost" color="primary" />
    </Stack>
  ),
};

export const Colors: Story = {
  render: () => (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
      <CnChip label="Primary" color="primary" />
      <CnChip label="Secondary" color="secondary" />
      <CnChip label="Success" color="success" />
      <CnChip label="Warning" color="warning" />
      <CnChip label="Error" color="error" />
      <CnChip label="Info" color="info" />
      <CnChip label="Accent" color="accent" />
      <CnChip label="Neutral" color="neutral" />
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <CnChip label="Small" size="small" />
      <CnChip label="Medium" size="medium" />
      <CnChip label="Large" size="large" />
    </Stack>
  ),
};

export const Shapes: Story = {
  render: () => (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <CnChip label="Pill" shape="pill" />
      <CnChip label="Rounded" shape="rounded" />
      <CnChip label="" icon="star" shape="circle" color="warning" variant="soft" />
    </Stack>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
      <CnChip label="Con ícono" icon="check_circle" color="success" />
      <CnChip label="Warning" icon="warning" color="warning" variant="soft" />
      <CnChip label="Ghost" icon="bolt" color="accent" variant="ghost" />
    </Stack>
  ),
};

export const WithAvatar: Story = {
  render: () => (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
      <CnChip label="Ana López" avatar="https://i.pravatar.cc/64?img=1" />
      <CnChip label="Carlos M." avatar="https://i.pravatar.cc/64?img=3" variant="outlined" />
      <CnChip label="Equipo" avatar="https://i.pravatar.cc/64?img=5" color="success" />
    </Stack>
  ),
};

export const WithDelete: Story = {
  render: () => (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
      <CnChip label="México" onDelete={() => {}} />
      <CnChip label="Guadalajara" onDelete={() => {}} color="accent" variant="outlined" />
      <CnChip label="Monterrey" onDelete={() => {}} color="success" />
    </Stack>
  ),
};

export const WithChevron: Story = {
  render: () => (
    <Stack direction="row" spacing={1.5}>
      <CnChip label="Ordenar" withChevron onClick={() => {}} variant="outlined" />
      <CnChip label="Filtros" withChevron onClick={() => {}} variant="soft" color="accent" />
    </Stack>
  ),
};

export const WithSubtitle: Story = {
  render: () => (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
      <CnChip
        label="Phobos"
        subtitle="Activo"
        subtitleColor="success"
        icon="check_circle"
        withChevron
        onClick={() => {}}
        shape="rounded"
      />
      <CnChip
        label="Kairos"
        subtitle="Beta"
        subtitleColor="warning"
        icon="bolt"
        withChevron
        onClick={() => {}}
        shape="rounded"
        color="accent"
      />
    </Stack>
  ),
};

export const Pulse: Story = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="center">
      <CnChip label="Live" color="error" pulse icon="circle" />
      <CnChip label="Sync" color="success" pulse icon="sync" />
      <CnChip label="Grabando" color="warning" pulse icon="videocam" />
    </Stack>
  ),
};

export const Glow: Story = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="center">
      <CnChip label="Premium" color="accent" glow icon="star" />
      <CnChip label="Nuevo" color="success" glow icon="bolt" variant="light" />
    </Stack>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <CnChip label="" icon="add" onClick={() => {}} color="primary" />
      <CnChip label="" icon="check" color="success" size="small" />
      <CnChip label="" icon="close" color="error" size="large" />
      <CnChip label="" icon="star" color="warning" variant="outlined" />
    </Stack>
  ),
};

export const CounterChips: Story = {
  render: () => (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <CnChip label="3" size="small" color="primary" />
      <CnChip label="12" color="accent" />
      <CnChip label="99+" color="error" size="large" />
    </Stack>
  ),
};

export const Multiline: Story = {
  render: () => (
    <Box sx={{ maxWidth: 240 }}>
      <CnChip
        label="Este es un texto muy largo que necesita hacer wrap dentro del chip"
        multiline
        shape="rounded"
        variant="outlined"
      />
    </Box>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Stack direction="row" spacing={1.5}>
      <CnChip label="Deshabilitado" disabled onClick={() => {}} />
      <CnChip label="Con delete" disabled onDelete={() => {}} />
    </Stack>
  ),
};

export const StatusInTable: Story = {
  render: () => (
    <Stack spacing={1.5} sx={{ maxWidth: 400 }}>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
        Ejemplo real: chips de status en una tabla
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2">Pedido #1024</Typography>
        <CnChip label="Enviado" color="info" icon="local_shipping" size="small" />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2">Pedido #1025</Typography>
        <CnChip label="Entregado" color="success" icon="check_circle" size="small" />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2">Pedido #1026</Typography>
        <CnChip label="Pendiente" color="warning" icon="pending" size="small" />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2">Pedido #1027</Typography>
        <CnChip label="Cancelado" color="error" icon="cancel" size="small" />
      </Box>
    </Stack>
  ),
};

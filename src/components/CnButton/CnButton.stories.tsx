import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteIcon from "@mui/icons-material/Delete";
import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnButton } from "./CnButton";

const meta: Meta<typeof CnButton> = {
  title: "Components/CnButton",
  component: CnButton,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["contained", "outlined", "text"],
    },
    color: {
      control: "select",
      options: ["primary", "secondary", "success", "warning", "info", "error", "accent", "neutral"],
    },
    size: {
      control: "select",
      options: ["small", "medium", "large"],
    },
    shape: {
      control: "select",
      options: ["rounded", "pill", "square"],
    },
    loadingPosition: {
      control: "select",
      options: ["start", "end", "center"],
    },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
    fullWidth: { control: "boolean" },
    iconOnly: { control: "boolean" },
    tooltip: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof CnButton>;

export const Default: Story = {
  args: {
    children: "Guardar cambios",
    variant: "contained",
    color: "primary",
    size: "medium",
    shape: "rounded",
  },
};

export const Variants: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <CnButton variant="contained">Contained</CnButton>
      <CnButton variant="outlined">Outlined</CnButton>
      <CnButton variant="text">Text</CnButton>
    </Stack>
  ),
};

export const Colors: Story = {
  render: () => (
    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
      <CnButton color="primary">Primary</CnButton>
      <CnButton color="secondary">Secondary</CnButton>
      <CnButton color="success">Success</CnButton>
      <CnButton color="warning">Warning</CnButton>
      <CnButton color="info">Info</CnButton>
      <CnButton color="error">Error</CnButton>
      <CnButton color="accent">Accent</CnButton>
      <CnButton color="neutral">Neutral</CnButton>
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="center">
      <CnButton size="small">Small</CnButton>
      <CnButton size="medium">Medium</CnButton>
      <CnButton size="large">Large</CnButton>
    </Stack>
  ),
};

export const Shapes: Story = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="center">
      <CnButton shape="rounded">Rounded</CnButton>
      <CnButton shape="pill">Pill</CnButton>
      <CnButton shape="square">Square</CnButton>
    </Stack>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <CnButton startIcon={<AddIcon />}>Agregar</CnButton>
      <CnButton endIcon={<ArrowForwardIcon />}>Continuar</CnButton>
      <CnButton color="error" startIcon={<DeleteIcon />}>
        Eliminar
      </CnButton>
    </Stack>
  ),
};

export const Loading: Story = {
  args: {
    children: "Guardando",
    loading: true,
  },
};

export const LoadingPositions: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <CnButton loading loadingPosition="start">
        Enviando
      </CnButton>
      <CnButton loading loadingPosition="center">
        Enviando
      </CnButton>
      <CnButton loading loadingPosition="end">
        Enviando
      </CnButton>
    </Stack>
  ),
};

export const Disabled: Story = {
  args: {
    children: "No disponible",
    disabled: true,
  },
};

export const IconOnly: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <CnButton iconOnly icon={<AddIcon />} aria-label="Agregar" />
      <CnButton iconOnly icon={<DeleteIcon />} aria-label="Eliminar" color="error" />
      <CnButton iconOnly icon={<AddIcon />} aria-label="Agregar" variant="outlined" />
      <CnButton iconOnly icon={<AddIcon />} aria-label="Agregar" variant="text" />
    </Stack>
  ),
};

export const AsLink: Story = {
  args: {
    children: "Ir a Google",
    href: "https://google.com",
    target: "_blank",
    rel: "noopener noreferrer",
  },
};

export const WithTooltip: Story = {
  render: () => (
    <CnButton
      iconOnly
      icon={<AddIcon />}
      aria-label="Agregar"
      tooltip
      tooltipProps={{ title: "Agregar elemento" }}
    />
  ),
};

export const FullWidth: Story = {
  args: {
    children: "Botón de ancho completo",
    fullWidth: true,
  },
  parameters: {
    layout: "padded",
  },
};

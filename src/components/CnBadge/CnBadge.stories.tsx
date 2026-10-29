import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { CnAvatar } from "../CnAvatar";
import { CnButton } from "../CnButton";
import { CnIcon } from "../CnIcon";
import { CnBadge } from "./CnBadge";

const meta: Meta<typeof CnBadge> = {
  title: "Components/CnBadge",
  component: CnBadge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["count", "dot", "label"],
    },
    color: {
      control: "select",
      options: ["primary", "secondary", "success", "warning", "error", "info", "accent", "neutral"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    overlap: {
      control: "select",
      options: ["circular", "rectangular"],
    },
    showZero: { control: "boolean" },
    invisible: { control: "boolean" },
    pulse: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof CnBadge>;

export const Default: Story = {
  args: {
    content: 3,
    color: "error",
    variant: "count",
    size: "md",
  },
  render: (args) => (
    <CnBadge {...args}>
      <CnIcon name="notifications" size="lg" />
    </CnBadge>
  ),
};

export const OnIcon: Story = {
  render: () => (
    <Stack direction="row" spacing={4}>
      <CnBadge content={1}>
        <CnIcon name="notifications" size="lg" />
      </CnBadge>
      <CnBadge content={12}>
        <CnIcon name="mail" size="lg" />
      </CnBadge>
      <CnBadge content={150} max={99}>
        <CnIcon name="shopping_cart" size="lg" />
      </CnBadge>
      <CnBadge content={0} showZero>
        <CnIcon name="chat" size="lg" />
      </CnBadge>
    </Stack>
  ),
};

export const OnButton: Story = {
  render: () => (
    <Stack direction="row" spacing={3}>
      <CnBadge content={3}>
        <CnButton iconOnly icon="shopping_cart" variant="outlined" aria-label="Carrito" />
      </CnBadge>
      <CnBadge content={8} color="primary">
        <CnButton iconOnly icon="mail" variant="outlined" aria-label="Correo" />
      </CnBadge>
      <CnBadge content={99} color="accent">
        <CnButton iconOnly icon="notifications" variant="outlined" aria-label="Notificaciones" />
      </CnBadge>
    </Stack>
  ),
};

export const OnAvatar: Story = {
  render: () => (
    <Stack direction="row" spacing={3}>
      <CnBadge content={2} overlap="circular">
        <CnAvatar name="John Doe" size="lg" />
      </CnBadge>
      <CnBadge content={5} color="primary" overlap="circular">
        <CnAvatar name="Jane Smith" size="lg" color="accent" />
      </CnBadge>
      <CnBadge content={12} overlap="circular">
        <CnAvatar src="https://i.pravatar.cc/150?img=5" alt="Ana" size="lg" />
      </CnBadge>
    </Stack>
  ),
};

export const StatusDots: Story = {
  render: () => (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center">
        <CnBadge variant="dot" color="success" />
        <Typography variant="body2">Disponible</Typography>
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        <CnBadge variant="dot" color="warning" />
        <Typography variant="body2">Ocupado</Typography>
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        <CnBadge variant="dot" color="error" />
        <Typography variant="body2">No disponible</Typography>
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        <CnBadge variant="dot" color="neutral" />
        <Typography variant="body2">Desconectado</Typography>
      </Stack>
    </Stack>
  ),
};

export const DotOnAvatar: Story = {
  render: () => (
    <Stack direction="row" spacing={3}>
      <CnBadge
        variant="dot"
        color="success"
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <CnAvatar name="Online" size="lg" />
      </CnBadge>
      <CnBadge
        variant="dot"
        color="warning"
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <CnAvatar name="Away" size="lg" color="accent" />
      </CnBadge>
      <CnBadge
        variant="dot"
        color="error"
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <CnAvatar name="Busy" size="lg" color="warning" />
      </CnBadge>
      <CnBadge
        variant="dot"
        color="neutral"
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <CnAvatar name="Offline" size="lg" color="secondary" />
      </CnBadge>
    </Stack>
  ),
};

export const LabelVariant: Story = {
  render: () => (
    <Stack direction="row" spacing={3}>
      <CnBadge variant="label" content="NEW" color="success">
        <CnButton variant="outlined">Producto A</CnButton>
      </CnBadge>
      <CnBadge variant="label" content="BETA" color="warning">
        <CnButton variant="outlined">Producto B</CnButton>
      </CnBadge>
      <CnBadge variant="label" content="PRO" color="accent">
        <CnButton variant="outlined">Producto C</CnButton>
      </CnBadge>
    </Stack>
  ),
};

export const Colors: Story = {
  render: () => (
    <Stack spacing={2}>
      {(
        [
          "primary",
          "secondary",
          "success",
          "warning",
          "error",
          "info",
          "accent",
          "neutral",
        ] as const
      ).map((color) => (
        <Stack key={color} direction="row" spacing={2} alignItems="center">
          <CnBadge content={3} color={color} />
          <CnBadge variant="dot" color={color} />
          <CnBadge variant="label" content={color.slice(0, 3).toUpperCase()} color={color} />
          <Typography variant="caption">{color}</Typography>
        </Stack>
      ))}
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} alignItems="center">
        <CnBadge content={3} size="sm" />
        <CnBadge content={3} size="md" />
        <CnBadge content={3} size="lg" />
        <Typography variant="caption">Count sizes</Typography>
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        <CnBadge variant="dot" size="sm" color="success" />
        <CnBadge variant="dot" size="md" color="success" />
        <CnBadge variant="dot" size="lg" color="success" />
        <Typography variant="caption">Dot sizes</Typography>
      </Stack>
    </Stack>
  ),
};

export const Pulse: Story = {
  render: () => (
    <Stack direction="row" spacing={4} alignItems="center">
      <CnBadge variant="dot" color="error" pulse />
      <CnBadge variant="dot" color="success" pulse size="lg" />
      <CnBadge content={1} pulse color="error" />
      <CnBadge content={3} pulse color="primary" size="lg" />
    </Stack>
  ),
};

export const MaxOverflow: Story = {
  render: () => (
    <Stack direction="row" spacing={3}>
      <CnBadge content={42}>
        <CnIcon name="mail" size="lg" />
      </CnBadge>
      <CnBadge content={99} max={99}>
        <CnIcon name="mail" size="lg" />
      </CnBadge>
      <CnBadge content={150} max={99}>
        <CnIcon name="mail" size="lg" />
      </CnBadge>
      <CnBadge content={1500} max={999}>
        <CnIcon name="mail" size="lg" />
      </CnBadge>
    </Stack>
  ),
};

export const InContext: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 400 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          border: "1px solid var(--cn-color-border, #dde0e4)",
          borderRadius: "var(--cn-radius-md, 8px)",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CnBadge
            variant="dot"
            color="success"
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          >
            <CnAvatar name="Ana López" size="md" />
          </CnBadge>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Ana López
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              En línea
            </Typography>
          </Box>
        </Stack>
        <CnBadge content={3}>
          <CnIcon name="chat" size="md" />
        </CnBadge>
      </Box>

      <Box sx={{ display: "flex", gap: 2 }}>
        <CnBadge content={2}>
          <CnButton iconOnly icon="notifications" variant="outlined" aria-label="Notificaciones" />
        </CnBadge>
        <CnBadge content={99} color="primary">
          <CnButton iconOnly icon="mail" variant="outlined" aria-label="Mensajes" />
        </CnBadge>
        <CnBadge variant="dot" color="success">
          <CnButton iconOnly icon="cloud_done" variant="outlined" aria-label="Sincronizado" />
        </CnBadge>
      </Box>
    </Stack>
  ),
};

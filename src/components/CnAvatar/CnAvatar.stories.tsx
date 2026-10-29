import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { CnAvatar } from "./CnAvatar";
import { CnAvatarGroup } from "./CnAvatarGroup";

const meta: Meta<typeof CnAvatar> = {
  title: "Components/CnAvatar",
  component: CnAvatar,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl", "2xl"],
    },
    variant: {
      control: "select",
      options: ["circular", "rounded", "square"],
    },
    color: {
      control: "select",
      options: ["primary", "secondary", "success", "warning", "error", "info", "accent", "neutral"],
    },
    status: {
      control: "select",
      options: [undefined, "online", "offline", "busy", "away"],
    },
    clickable: { control: "boolean" },
    disabled: { control: "boolean" },
    bordered: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof CnAvatar>;

export const Default: Story = {
  args: {
    name: "John Doe",
    size: "md",
    variant: "circular",
    color: "primary",
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="center">
      <CnAvatar name="A" size="xs" />
      <CnAvatar name="AB" size="sm" />
      <CnAvatar name="John Doe" size="md" />
      <CnAvatar name="John Doe" size="lg" />
      <CnAvatar name="John Doe" size="xl" />
      <CnAvatar name="John Doe" size="2xl" />
    </Stack>
  ),
};

export const Colors: Story = {
  render: () => (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
      <CnAvatar name="Primary" color="primary" />
      <CnAvatar name="Secondary" color="secondary" />
      <CnAvatar name="Success" color="success" />
      <CnAvatar name="Warning" color="warning" />
      <CnAvatar name="Error" color="error" />
      <CnAvatar name="Info" color="info" />
      <CnAvatar name="Accent" color="accent" />
      <CnAvatar name="Neutral" color="neutral" />
    </Stack>
  ),
};

export const Variants: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <CnAvatar name="John Doe" variant="circular" />
      <CnAvatar name="John Doe" variant="rounded" />
      <CnAvatar name="John Doe" variant="square" />
    </Stack>
  ),
};

export const WithImage: Story = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="center">
      <CnAvatar src="https://i.pravatar.cc/150?img=1" alt="Ana López" size="md" />
      <CnAvatar src="https://i.pravatar.cc/150?img=3" alt="Carlos Martínez" size="lg" />
      <CnAvatar src="https://i.pravatar.cc/150?img=5" alt="Diana Pérez" size="xl" />
    </Stack>
  ),
};

export const WithInitials: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <CnAvatar name="John Doe" color="primary" />
      <CnAvatar name="Ana López" color="accent" />
      <CnAvatar name="Carlos Martínez Rodríguez" color="success" />
      <CnAvatar initials="XY" color="warning" />
    </Stack>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <CnAvatar icon="person" color="neutral" />
      <CnAvatar icon="groups" color="primary" />
      <CnAvatar icon="support_agent" color="success" />
      <CnAvatar icon="engineering" color="warning" />
    </Stack>
  ),
};

export const WithStatus: Story = {
  render: () => (
    <Stack direction="row" spacing={3}>
      <Box sx={{ textAlign: "center" }}>
        <CnAvatar name="Online" status="online" size="lg" />
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Online
        </Typography>
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <CnAvatar name="Offline" status="offline" size="lg" />
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Offline
        </Typography>
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <CnAvatar name="Busy" status="busy" size="lg" color="error" />
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Busy
        </Typography>
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <CnAvatar name="Away" status="away" size="lg" color="warning" />
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Away
        </Typography>
      </Box>
    </Stack>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <Stack direction="row" spacing={3}>
      <CnAvatar name="Notificaciones" size="lg" badge={{ content: 3, color: "error" }} />
      <CnAvatar name="Mensajes" size="lg" badge={{ content: 12, color: "primary" }} />
      <CnAvatar
        name="Solicitudes"
        size="lg"
        color="accent"
        badge={{ content: 99, color: "warning" }}
      />
      <CnAvatar name="Nueva" size="lg" status="online" badge={{ content: "N", color: "success" }} />
    </Stack>
  ),
};

export const Bordered: Story = {
  render: () => (
    <Box
      sx={{
        p: 3,
        backgroundColor: "var(--cn-color-brand-700, #1c3d6d)",
        borderRadius: 2,
        display: "inline-flex",
        gap: 2,
      }}
    >
      <CnAvatar name="John Doe" bordered />
      <CnAvatar name="Jane Smith" bordered borderColor="var(--cn-color-accent-500)" />
      <CnAvatar src="https://i.pravatar.cc/150?img=2" alt="Con borde" bordered size="lg" />
    </Box>
  ),
};

export const Clickable: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <CnAvatar name="John Doe" clickable onClick={() => alert("Clicked")} size="lg" />
      <CnAvatar
        name="Jane Smith"
        clickable
        href="https://example.com"
        target="_blank"
        color="accent"
        size="lg"
      />
    </Stack>
  ),
};

export const AvatarGroups: Story = {
  render: () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="caption" sx={{ color: "text.secondary", mb: 1, display: "block" }}>
          Básico (max 4)
        </Typography>
        <CnAvatarGroup max={4}>
          <CnAvatar src="https://i.pravatar.cc/150?img=1" alt="User 1" />
          <CnAvatar src="https://i.pravatar.cc/150?img=2" alt="User 2" />
          <CnAvatar src="https://i.pravatar.cc/150?img=3" alt="User 3" />
          <CnAvatar src="https://i.pravatar.cc/150?img=4" alt="User 4" />
          <CnAvatar src="https://i.pravatar.cc/150?img=5" alt="User 5" />
          <CnAvatar src="https://i.pravatar.cc/150?img=6" alt="User 6" />
        </CnAvatarGroup>
      </Box>

      <Box>
        <Typography variant="caption" sx={{ color: "text.secondary", mb: 1, display: "block" }}>
          Tamaño grande
        </Typography>
        <CnAvatarGroup max={3} size="lg">
          <CnAvatar name="Ana López" color="accent" />
          <CnAvatar name="Carlos M." color="success" />
          <CnAvatar name="Diana P." color="warning" />
          <CnAvatar name="Eva R." color="info" />
          <CnAvatar name="Fran G." color="error" />
        </CnAvatarGroup>
      </Box>

      <Box>
        <Typography variant="caption" sx={{ color: "text.secondary", mb: 1, display: "block" }}>
          Surplus custom
        </Typography>
        <CnAvatarGroup
          max={2}
          size="md"
          renderSurplus={(surplus) => (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: "var(--cn-color-brand-600)",
                color: "white",
                display: "grid",
                placeItems: "center",
                fontSize: 12,
                fontWeight: 700,
                border: "2px solid white",
              }}
            >
              +{surplus}
            </Box>
          )}
        >
          <CnAvatar name="User One" />
          <CnAvatar name="User Two" />
          <CnAvatar name="User Three" />
          <CnAvatar name="User Four" />
        </CnAvatarGroup>
      </Box>
    </Stack>
  ),
};

export const InContext: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 400 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <CnAvatar name="John Doe" status="online" />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            John Doe
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            En línea
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <CnAvatar
          src="https://i.pravatar.cc/150?img=5"
          alt="Jane"
          badge={{ content: 2, color: "error" }}
        />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Jane Smith
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            2 mensajes sin leer
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <CnAvatarGroup max={3} size="sm">
          <CnAvatar name="A B" />
          <CnAvatar name="C D" />
          <CnAvatar name="E F" />
          <CnAvatar name="G H" />
          <CnAvatar name="I J" />
        </CnAvatarGroup>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Equipo de diseño
        </Typography>
      </Box>
    </Stack>
  ),
};

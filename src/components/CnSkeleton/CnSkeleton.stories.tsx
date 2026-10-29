import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnSkeleton } from "./CnSkeleton";

const meta: Meta<typeof CnSkeleton> = {
  title: "Components/CnSkeleton",
  component: CnSkeleton,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["rectangular", "rounded", "circular", "text"],
    },
    animation: {
      control: "select",
      options: ["pulse", "wave", "none"],
    },
    width: { control: "text" },
    height: { control: "text" },
    radius: { control: "text" },
    lines: { control: "number" },
    lineGap: { control: "number" },
  },
};

export default meta;
type Story = StoryObj<typeof CnSkeleton>;

export const Default: Story = {
  args: {
    width: 240,
    height: 20,
    variant: "rounded",
    animation: "wave",
  },
};

export const Variants: Story = {
  render: () => (
    <Stack spacing={3}>
      <Box>
        <CnSkeleton variant="rectangular" width={200} height={100} />
      </Box>
      <Box>
        <CnSkeleton variant="rounded" width={200} height={100} />
      </Box>
      <Box>
        <CnSkeleton variant="circular" width={60} height={60} />
      </Box>
      <Box>
        <CnSkeleton variant="text" width={200} />
      </Box>
    </Stack>
  ),
};

export const Animations: Story = {
  render: () => (
    <Stack spacing={2}>
      {(["wave", "pulse", "none"] as const).map((anim) => (
        <Box key={anim}>
          <Box sx={{ fontSize: 11, color: "text.secondary", mb: 1 }}>{anim}</Box>
          <CnSkeleton variant="rounded" width={240} height={20} animation={anim} />
        </Box>
      ))}
    </Stack>
  ),
};

export const TextLines: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 400 }}>
      <Box>
        <Box sx={{ fontSize: 11, color: "text.secondary", mb: 1 }}>1 línea</Box>
        <CnSkeleton variant="text" />
      </Box>
      <Box>
        <Box sx={{ fontSize: 11, color: "text.secondary", mb: 1 }}>3 líneas</Box>
        <CnSkeleton variant="text" lines={3} />
      </Box>
      <Box>
        <Box sx={{ fontSize: 11, color: "text.secondary", mb: 1 }}>5 líneas</Box>
        <CnSkeleton variant="text" lines={5} />
      </Box>
      <Box>
        <Box sx={{ fontSize: 11, color: "text.secondary", mb: 1 }}>3 líneas con gap 12px</Box>
        <CnSkeleton variant="text" lines={3} lineGap={12} />
      </Box>
    </Stack>
  ),
};

export const CardSkeleton: Story = {
  render: () => (
    <Box
      sx={{
        p: 2,
        border: "1px solid var(--cn-color-border, #dde0e4)",
        borderRadius: "var(--cn-radius-lg, 12px)",
        maxWidth: 320,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <CnSkeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <CnSkeleton variant="text" width="60%" height={14} sx={{ mb: 1 }} />
          <CnSkeleton variant="text" width="40%" height={12} />
        </Box>
      </Box>
      <CnSkeleton variant="rounded" width="100%" height={140} sx={{ mb: 2 }} />
      <CnSkeleton variant="text" lines={2} />
    </Box>
  ),
};

export const TableSkeleton: Story = {
  render: () => (
    <Box
      sx={{
        border: "1px solid var(--cn-color-border, #dde0e4)",
        borderRadius: "var(--cn-radius-lg, 12px)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr 1fr 1fr",
          gap: 2,
          px: 2,
          py: 1.5,
          backgroundColor: "var(--cn-color-neutral-050, #fafbfc)",
          borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
        }}
      >
        <CnSkeleton variant="text" width="80%" height={12} />
        <CnSkeleton variant="text" width="60%" height={12} />
        <CnSkeleton variant="text" width="70%" height={12} />
        <CnSkeleton variant="text" width="50%" height={12} />
      </Box>
      {[1, 2, 3, 4].map((i) => (
        <Box
          key={i}
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr 1fr 1fr",
            gap: 2,
            px: 2,
            py: 1.5,
            borderBottom: i < 4 ? "1px solid var(--cn-color-border-subtle, #e9ecef)" : "none",
          }}
        >
          <CnSkeleton variant="text" width="60%" />
          <CnSkeleton variant="text" width="80%" />
          <CnSkeleton variant="rounded" width={60} height={20} />
          <CnSkeleton variant="text" width="40%" />
        </Box>
      ))}
    </Box>
  ),
};

export const ListSkeleton: Story = {
  render: () => (
    <Box sx={{ maxWidth: 360 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5 }}>
          <CnSkeleton variant="circular" width={36} height={36} />
          <Box sx={{ flex: 1 }}>
            <CnSkeleton variant="text" width="40%" height={13} sx={{ mb: 0.75 }} />
            <CnSkeleton variant="text" width="70%" height={11} />
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

export const ParagraphSkeleton: Story = {
  render: () => (
    <Box sx={{ maxWidth: 480 }}>
      <CnSkeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
      <CnSkeleton variant="text" lines={4} sx={{ mb: 2 }} />
      <CnSkeleton variant="text" lines={2} />
    </Box>
  ),
};

export const DashboardSkeleton: Story = {
  render: () => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 2,
        maxWidth: 900,
      }}
    >
      {[1, 2, 3, 4].map((i) => (
        <Box
          key={i}
          sx={{
            p: 2,
            border: "1px solid var(--cn-color-border, #dde0e4)",
            borderRadius: "var(--cn-radius-lg, 12px)",
          }}
        >
          <CnSkeleton variant="circular" width={32} height={32} sx={{ mb: 1.5 }} />
          <CnSkeleton variant="text" width="40%" height={24} sx={{ mb: 0.75 }} />
          <CnSkeleton variant="text" width="70%" height={11} />
        </Box>
      ))}
    </Box>
  ),
};

export const ImageSkeleton: Story = {
  render: () => (
    <Box sx={{ maxWidth: 320 }}>
      <CnSkeleton variant="rounded" width="100%" height={220} radius="var(--cn-radius-lg, 12px)" />
    </Box>
  ),
};

export const PulseAnimation: Story = {
  render: () => (
    <Box sx={{ maxWidth: 320 }}>
      <CnSkeleton variant="circular" width={64} height={64} animation="pulse" sx={{ mb: 2 }} />
      <CnSkeleton variant="text" width="60%" height={18} animation="pulse" sx={{ mb: 1 }} />
      <CnSkeleton variant="text" lines={3} animation="pulse" />
    </Box>
  ),
};

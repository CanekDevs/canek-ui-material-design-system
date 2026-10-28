import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { CnIcon } from "./CnIcon";
import { ICON_REGISTRY } from "./icons";

const meta: Meta<typeof CnIcon> = {
  title: "Components/CnIcon",
  component: CnIcon,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl", "2xl"],
    },
    color: {
      control: "select",
      options: [
        "inherit",
        "primary",
        "secondary",
        "success",
        "warning",
        "error",
        "info",
        "accent",
        "muted",
        "subtle",
      ],
    },
    spin: { control: "boolean" },
    pulse: { control: "boolean" },
    rotate: { control: { type: "range", min: 0, max: 360, step: 15 } },
  },
};

export default meta;
type Story = StoryObj<typeof CnIcon>;

export const Default: Story = {
  args: {
    name: "add",
    size: "md",
    color: "inherit",
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={3} alignItems="center">
      <CnIcon name="check" size="xs" />
      <CnIcon name="check" size="sm" />
      <CnIcon name="check" size="md" />
      <CnIcon name="check" size="lg" />
      <CnIcon name="check" size="xl" />
      <CnIcon name="check" size="2xl" />
    </Stack>
  ),
};

export const Colors: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <CnIcon name="check_circle" color="primary" size="xl" />
      <CnIcon name="check_circle" color="success" size="xl" />
      <CnIcon name="warning" color="warning" size="xl" />
      <CnIcon name="error" color="error" size="xl" />
      <CnIcon name="info" color="info" size="xl" />
      <CnIcon name="check_circle" color="accent" size="xl" />
      <CnIcon name="check_circle" color="muted" size="xl" />
      <CnIcon name="check_circle" color="subtle" size="xl" />
    </Stack>
  ),
};

export const Animations: Story = {
  render: () => (
    <Stack direction="row" spacing={3} alignItems="center">
      <CnIcon name="refresh" spin size="xl" />
      <CnIcon name="notifications" pulse size="xl" />
      <CnIcon name="arrow_forward" rotate={90} size="xl" />
    </Stack>
  ),
};

export const Gallery: Story = {
  render: () => {
    const entries = Object.keys(ICON_REGISTRY).sort();
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 2,
        }}
      >
        {entries.map((name) => (
          <Stack
            key={name}
            alignItems="center"
            spacing={1}
            sx={{ p: 1.5, border: "1px solid #e9ecef", borderRadius: 1 }}
          >
            <CnIcon name={name} size="lg" color="primary" />
            <Typography variant="caption" sx={{ fontSize: 10, textAlign: "center" }}>
              {name}
            </Typography>
          </Stack>
        ))}
      </Box>
    );
  },
};

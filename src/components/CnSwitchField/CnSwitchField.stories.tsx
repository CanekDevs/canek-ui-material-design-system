import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnSwitchField } from "./CnSwitchField";
import { CnSwitchFieldSkeleton } from "./CnSwitchFieldSkeleton";

const meta: Meta<typeof CnSwitchField> = {
  title: "Forms/CnSwitchField",
  component: CnSwitchField,
  tags: ["autodocs"],
  args: { label: "Modo oscuro", description: "Se aplica en todos tus dispositivos" },
};

export default meta;
type Story = StoryObj<typeof CnSwitchField>;

export const Default: Story = {};

export const LabelStart: Story = { args: { labelPlacement: "start" } };

export const Disabled: Story = { args: { disabled: true, defaultValue: true } };

/** Estado de carga: el skeleton sigue las variantes del campo (`skeleton` o `CnSwitchFieldSkeleton`). */
export const Skeleton: Story = {
  render: (args) => (
    <Stack spacing={3}>
      <CnSwitchField {...args} skeleton />
      <CnSwitchFieldSkeleton />
      <CnSwitchFieldSkeleton size="sm" helperText />
      <CnSwitchFieldSkeleton labelPlacement="start" description />
      <CnSwitchFieldSkeleton labelPlacement="top" />
    </Stack>
  ),
};

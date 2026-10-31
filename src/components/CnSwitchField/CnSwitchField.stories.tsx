import type { Meta, StoryObj } from "@storybook/react";
import { CnSwitchField } from "./CnSwitchField";

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

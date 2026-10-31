import type { Meta, StoryObj } from "@storybook/react";
import { CnPasswordField } from "./CnPasswordField";

const meta: Meta<typeof CnPasswordField> = {
  title: "Forms/CnPasswordField",
  component: CnPasswordField,
  tags: ["autodocs"],
  args: { label: "Nueva contraseña" },
};

export default meta;
type Story = StoryObj<typeof CnPasswordField>;

export const Default: Story = {};
export const StrictWithGenerator: Story = {
  args: {
    allowGenerate: true,
    requirements: { minLength: 12, uppercase: true, lowercase: true, number: true, symbol: true },
  },
};
export const Login: Story = {
  args: {
    label: "Contraseña",
    requirements: false,
    showStrength: false,
    autoComplete: "current-password",
  },
};

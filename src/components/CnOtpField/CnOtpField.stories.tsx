import type { Meta, StoryObj } from "@storybook/react";
import { CnOtpField } from "./CnOtpField";

const meta: Meta<typeof CnOtpField> = {
  title: "Forms/CnOtpField",
  component: CnOtpField,
  tags: ["autodocs"],
  args: { label: "Código de verificación", helperText: "Te lo enviamos por SMS" },
};

export default meta;
type Story = StoryObj<typeof CnOtpField>;

export const Default: Story = {};
export const Grouped: Story = { args: { length: 6, groupSize: 3 } };
export const Alphanumeric: Story = {
  args: { length: 8, inputType: "alphanumeric", groupSize: 4, label: "Código de invitación" },
};
export const Pin: Story = { args: { length: 4, mask: true, label: "NIP" } };

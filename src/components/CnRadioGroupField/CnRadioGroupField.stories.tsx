import type { Meta, StoryObj } from "@storybook/react";
import { CnRadioGroupField } from "./CnRadioGroupField";

const meta: Meta<typeof CnRadioGroupField> = {
  title: "Forms/CnRadioGroupField",
  component: CnRadioGroupField,
  tags: ["autodocs"],
  args: {
    label: "Frecuencia",
    options: [
      { value: 1, label: "Mensual" },
      { value: 12, label: "Anual", description: "2 meses gratis" },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof CnRadioGroupField>;

export const Default: Story = {};

export const Cards: Story = {
  args: {
    label: "Plan",
    appearance: "card",
    defaultValue: "pro",
    options: [
      { value: "basic", label: "Básico", description: "Para empezar" },
      { value: "pro", label: "Pro", description: "Equipos pequeños" },
      { value: "enterprise", label: "Empresa", description: "Soporte dedicado" },
    ],
  },
};

export const Column: Story = { args: { direction: "column" } };

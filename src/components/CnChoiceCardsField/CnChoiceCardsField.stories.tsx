import type { Meta, StoryObj } from "@storybook/react";
import { CnChoiceCardsField } from "./CnChoiceCardsField";

const meta: Meta<typeof CnChoiceCardsField> = {
  title: "Forms/CnChoiceCardsField",
  component: CnChoiceCardsField,
  tags: ["autodocs"],
  args: {
    label: "Método de envío",
    columns: 3,
    options: [
      {
        value: "std",
        label: "Estándar",
        description: "3 a 5 días hábiles",
        meta: "Gratis",
        icon: "local_shipping",
      },
      {
        value: "exp",
        label: "Exprés",
        description: "1 a 2 días hábiles",
        meta: "$149",
        icon: "bolt",
      },
      {
        value: "pickup",
        label: "Recoger en tienda",
        description: "Disponible hoy",
        meta: "Gratis",
        icon: "store",
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof CnChoiceCardsField>;

export const Default: Story = {};
export const Multiple: Story = { args: { multiple: true, label: "Servicios adicionales" } };
export const WithError: Story = {
  args: { error: true, helperText: "Elige una opción", required: true },
};

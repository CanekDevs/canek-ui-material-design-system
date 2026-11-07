import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnChoiceCardsField } from "./CnChoiceCardsField";
import { CnChoiceCardsFieldSkeleton } from "./CnChoiceCardsFieldSkeleton";

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

/** Estado de carga: el skeleton sigue las variantes del campo (`skeleton` o `CnChoiceCardsFieldSkeleton`). */
export const Skeleton: Story = {
  render: (args) => (
    <Stack spacing={4}>
      <CnChoiceCardsField {...args} skeleton />
      <CnChoiceCardsFieldSkeleton options={4} columns={2} icon meta />
      <CnChoiceCardsFieldSkeleton options={4} columns={4} multiple description={false} />
      <CnChoiceCardsFieldSkeleton options={2} columns={1} helperText />
    </Stack>
  ),
};

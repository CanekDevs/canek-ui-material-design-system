import type { Meta, StoryObj } from "@storybook/react";
import { CnTransferListField } from "./CnTransferListField";

const meta: Meta<typeof CnTransferListField> = {
  title: "Forms/CnTransferListField",
  component: CnTransferListField,
  tags: ["autodocs"],
  args: {
    label: "Integrantes del equipo",
    defaultValue: [2],
    options: [
      "Ana López",
      "Luis Pérez",
      "María Hernández",
      "Jorge Ramírez",
      "Sofía Torres",
      "Diego Morales",
    ].map((label, index) => ({ value: index + 1, label, initials: true as const })),
  },
};

export default meta;
type Story = StoryObj<typeof CnTransferListField>;

export const Default: Story = {};
export const WithMax: Story = { args: { max: 3, helperText: "Máximo 3 integrantes" } };

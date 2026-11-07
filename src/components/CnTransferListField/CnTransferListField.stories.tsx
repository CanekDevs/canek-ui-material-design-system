import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { CnTransferListField } from "./CnTransferListField";
import { CnTransferListFieldSkeleton } from "./CnTransferListFieldSkeleton";

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

/** Estado de carga: el skeleton sigue las variantes del campo (`skeleton` o `CnTransferListFieldSkeleton`). */
export const Skeleton: Story = {
  render: (args) => (
    <Box sx={{ display: "grid", gap: 4 }}>
      <CnTransferListField {...args} helperText="Doble clic para mover" skeleton />
      <CnTransferListFieldSkeleton searchable={false} listHeight={160} availableItems={3} />
      <CnTransferListFieldSkeleton orientation="vertical" listHeight={120} withAvatar />
    </Box>
  ),
};

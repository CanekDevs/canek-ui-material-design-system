import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnKeyValueField } from "./CnKeyValueField";
import { CnKeyValueFieldSkeleton } from "./CnKeyValueFieldSkeleton";

const meta: Meta<typeof CnKeyValueField> = {
  title: "Forms/CnKeyValueField",
  component: CnKeyValueField,
  tags: ["autodocs"],
  args: {
    label: "Atributos del producto",
    defaultValue: [
      { key: "color", value: "Azul" },
      { key: "talla", value: "M" },
    ],
    keySuggestions: ["color", "talla", "material", "peso"],
  },
};

export default meta;
type Story = StoryObj<typeof CnKeyValueField>;

export const Default: Story = {};
export const AsObject: Story = {
  args: {
    label: "Encabezados HTTP",
    valueFormat: "object",
    keyLabel: "Encabezado",
    defaultValue: { "X-Tenant": "acme" },
  },
};

/** Estado de carga: el skeleton sigue las variantes del campo (`skeleton` o `CnKeyValueFieldSkeleton`). */
export const Skeleton: Story = {
  render: (args) => (
    <Stack spacing={4} sx={{ maxWidth: 560 }}>
      <CnKeyValueField {...args} helperText="Se muestran en la ficha del producto" skeleton />
      <CnKeyValueFieldSkeleton size="sm" rows={3} />
      <CnKeyValueFieldSkeleton size="lg" rows={1} maxRows={1} />
      <CnKeyValueFieldSkeleton rows={2} readOnly />
    </Stack>
  ),
};

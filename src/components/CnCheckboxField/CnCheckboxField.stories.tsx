import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnCheckboxField } from "./CnCheckboxField";
import { CnCheckboxFieldSkeleton } from "./CnCheckboxFieldSkeleton";

const options = [
  { value: "email", label: "Correo", description: "Resumen semanal" },
  { value: "sms", label: "SMS" },
  { value: "push", label: "Notificaciones push", disabled: true },
];

const meta: Meta<typeof CnCheckboxField> = {
  title: "Forms/CnCheckboxField",
  component: CnCheckboxField,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CnCheckboxField>;

export const Single: Story = {
  args: {
    label: "Acepto los términos",
    description: "Puedes revocar tu consentimiento en cualquier momento.",
    required: true,
    rules: [{ type: "required", message: "Debes aceptar los términos" }],
  },
};

export const Group: Story = {
  args: { label: "Canales", options, selectAll: true, defaultValue: ["email"] },
};

export const Row: Story = { args: { label: "Canales", options, direction: "row" } };

/** Estado de carga: el skeleton sigue las variantes del campo (`skeleton` o `CnCheckboxFieldSkeleton`). */
export const Skeleton: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 480 }}>
      <CnCheckboxField
        label="Canales"
        options={options}
        selectAll
        helperText="Elige al menos uno"
        skeleton
      />
      <CnCheckboxFieldSkeleton description helperText />
      <CnCheckboxFieldSkeleton size="sm" labelPlacement="start" />
      <CnCheckboxFieldSkeleton options={4} direction="row" />
      <CnCheckboxFieldSkeleton options={3} optionDescriptions />
    </Stack>
  ),
};

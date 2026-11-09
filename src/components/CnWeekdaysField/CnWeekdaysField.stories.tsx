import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnWeekdaysField } from "./CnWeekdaysField";
import { CnWeekdaysFieldSkeleton } from "./CnWeekdaysFieldSkeleton";

const meta: Meta<typeof CnWeekdaysField> = {
  title: "Forms/CnWeekdaysField",
  component: CnWeekdaysField,
  tags: ["autodocs"],
  args: { label: "Días de servicio" },
};

export default meta;
type Story = StoryObj<typeof CnWeekdaysField>;

export const Default: Story = { args: { defaultValue: [1, 2, 3, 4, 5] } };

export const SundayFirst: Story = {
  args: { weekStart: 0, dayFormat: "short", helperText: "La semana inicia en domingo" },
};

export const Sizes: Story = {
  render: () => (
    <Stack spacing={3}>
      <CnWeekdaysField label="Pequeño" size="sm" defaultValue={[1, 3, 5]} />
      <CnWeekdaysField label="Mediano" size="md" defaultValue={[1, 3, 5]} />
      <CnWeekdaysField label="Grande" size="lg" defaultValue={[1, 3, 5]} />
    </Stack>
  ),
};

export const Validation: Story = {
  args: {
    label: "Días de entrenamiento",
    required: true,
    minDays: 2,
    maxDays: 4,
    disabledDays: [0],
    helperText: "Entre 2 y 4 días; los domingos no hay servicio",
  },
};

export const States: Story = {
  render: () => (
    <Stack spacing={3}>
      <CnWeekdaysField label="Solo lectura" readOnly defaultValue={[6, 0]} />
      <CnWeekdaysField label="Deshabilitado" disabled defaultValue={[1, 2]} />
      <CnWeekdaysField label="Con error" error helperText="Selecciona tus días" />
    </Stack>
  ),
};

/** Estado de carga (`skeleton` o `CnWeekdaysFieldSkeleton`). */
export const Skeleton: Story = {
  render: () => (
    <Stack spacing={3}>
      <CnWeekdaysField label="Días" helperText="Ayuda" skeleton />
      <CnWeekdaysFieldSkeleton size="sm" presets={0} />
      <CnWeekdaysFieldSkeleton size="lg" dayFormat="short" />
    </Stack>
  ),
};

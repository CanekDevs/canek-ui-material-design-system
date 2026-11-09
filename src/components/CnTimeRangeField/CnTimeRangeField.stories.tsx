import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnTimeRangeField } from "./CnTimeRangeField";
import { CnTimeRangeFieldSkeleton } from "./CnTimeRangeFieldSkeleton";

const meta: Meta<typeof CnTimeRangeField> = {
  title: "Forms/CnTimeRangeField",
  component: CnTimeRangeField,
  tags: ["autodocs"],
  args: { label: "Horario de atención" },
};

export default meta;
type Story = StoryObj<typeof CnTimeRangeField>;

export const Default: Story = { args: { defaultValue: ["09:00", "18:00"] } };

export const Overnight: Story = {
  args: {
    label: "Turno nocturno",
    allowOvernight: true,
    defaultValue: ["22:00", "06:00"],
    helperText: "El fin puede ser al día siguiente",
  },
};

export const Validation: Story = {
  args: {
    label: "Cita",
    required: true,
    minDuration: 30,
    maxDuration: 120,
    minutesStep: 15,
    helperText: "Entre 30 min y 2 h",
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 480 }}>
      <CnTimeRangeField label="Pequeño" size="sm" defaultValue={["08:00", "12:30"]} />
      <CnTimeRangeField label="Mediano" defaultValue={["08:00", "12:30"]} />
      <CnTimeRangeField label="Grande" size="lg" defaultValue={["08:00", "12:30"]} />
    </Stack>
  ),
};

export const States: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 480 }}>
      <CnTimeRangeField label="Solo lectura" readOnly defaultValue={["10:00", "11:00"]} />
      <CnTimeRangeField label="Deshabilitado" disabled defaultValue={["10:00", "11:00"]} />
      <CnTimeRangeField label="Sin duración" showDuration={false} />
    </Stack>
  ),
};

/** Estado de carga (`skeleton` o `CnTimeRangeFieldSkeleton`). */
export const Skeleton: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 480 }}>
      <CnTimeRangeField label="Horario" helperText="Ayuda" skeleton />
      <CnTimeRangeFieldSkeleton size="sm" showDuration={false} />
      <CnTimeRangeFieldSkeleton size="lg" label={false} />
    </Stack>
  ),
};

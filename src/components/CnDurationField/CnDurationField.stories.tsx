import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnDurationField, formatDuration } from "./CnDurationField";
import type { CnDurationValue } from "./CnDurationField";
import { CnDurationFieldSkeleton } from "./CnDurationFieldSkeleton";

const meta: Meta<typeof CnDurationField> = {
  title: "Forms/CnDurationField",
  component: CnDurationField,
  tags: ["autodocs"],
  args: { label: "Duración estimada" },
};

export default meta;
type Story = StoryObj<typeof CnDurationField>;

const ControlledStory = () => {
  const [value, setValue] = useState<CnDurationValue>(90);
  return (
    <Stack spacing={1} sx={{ maxWidth: 420 }}>
      <CnDurationField label="Duración" value={value} onChange={setValue} />
      <small>
        Valor: {String(value)} minutos ({formatDuration(value)})
      </small>
    </Stack>
  );
};

export const Default: Story = { render: () => <ControlledStory /> };

export const DaysHoursMinutes: Story = {
  args: {
    label: "Tiempo de entrega",
    units: ["days", "hours", "minutes"],
    defaultValue: 1590,
  },
};

export const Seconds: Story = {
  args: {
    label: "Tiempo límite",
    units: ["minutes", "seconds"],
    valueUnit: "seconds",
    presets: [
      { label: "30 s", value: 30 },
      { label: "1 min", value: 60 },
      { label: "5 min", value: 300 },
    ],
  },
};

export const Validation: Story = {
  args: {
    label: "Duración de la cita",
    required: true,
    min: 15,
    max: 240,
    helperText: "Entre 15 min y 4 h",
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 420 }}>
      <CnDurationField label="Pequeño" size="sm" presets={false} defaultValue={45} />
      <CnDurationField label="Mediano" presets={false} defaultValue={45} />
      <CnDurationField label="Grande" size="lg" presets={false} defaultValue={45} />
    </Stack>
  ),
};

export const States: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 420 }}>
      <CnDurationField label="Solo lectura" readOnly defaultValue={150} />
      <CnDurationField label="Deshabilitado" disabled defaultValue={150} />
    </Stack>
  ),
};

/** Estado de carga (`skeleton` o `CnDurationFieldSkeleton`). */
export const Skeleton: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 420 }}>
      <CnDurationField label="Duración" helperText="Ayuda" skeleton />
      <CnDurationFieldSkeleton size="sm" units={3} presets={0} />
      <CnDurationFieldSkeleton size="lg" units={1} />
    </Stack>
  ),
};

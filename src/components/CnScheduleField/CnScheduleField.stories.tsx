import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnScheduleField } from "./CnScheduleField";
import type { CnScheduleValue } from "./CnScheduleField";
import { CnScheduleFieldSkeleton } from "./CnScheduleFieldSkeleton";

const OFFICE: CnScheduleValue = {
  mon: {
    enabled: true,
    ranges: [
      { start: "09:00", end: "14:00" },
      { start: "15:00", end: "18:00" },
    ],
  },
  tue: { enabled: true, ranges: [{ start: "09:00", end: "18:00" }] },
  wed: { enabled: true, ranges: [{ start: "09:00", end: "18:00" }] },
  thu: { enabled: true, ranges: [{ start: "09:00", end: "18:00" }] },
  fri: { enabled: true, ranges: [{ start: "09:00", end: "15:00" }] },
};

const meta: Meta<typeof CnScheduleField> = {
  title: "Forms/CnScheduleField",
  component: CnScheduleField,
  tags: ["autodocs"],
  args: { label: "Horario de atención" },
};

export default meta;
type Story = StoryObj<typeof CnScheduleField>;

const ControlledStory = () => {
  const [value, setValue] = useState<CnScheduleValue>(OFFICE);
  return (
    <Box sx={{ maxWidth: 720 }}>
      <CnScheduleField
        label="Horario de atención"
        value={value}
        onChange={setValue}
        required
        helperText="Usa el botón copiar para replicar un día en toda la semana"
      />
      <Box component="pre" sx={{ fontSize: 11 }}>
        {JSON.stringify(value, null, 2)}
      </Box>
    </Box>
  );
};

export const Default: Story = { render: () => <ControlledStory /> };

export const Empty: Story = { args: { required: true, minutesStep: 15 } };

export const Overlap: Story = {
  args: {
    defaultValue: {
      mon: {
        enabled: true,
        ranges: [
          { start: "09:00", end: "13:00" },
          { start: "12:00", end: "16:00" },
        ],
      },
      tue: { enabled: true, ranges: [{ start: "18:00", end: "10:00" }] },
    },
  },
};

export const WeekdaysOnly: Story = {
  args: { days: ["mon", "tue", "wed", "thu", "fri"], maxRanges: 1, allowCopy: false, size: "sm" },
};

export const States: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <CnScheduleField label="Solo lectura" readOnly defaultValue={OFFICE} />
      <CnScheduleField label="Deshabilitado" disabled defaultValue={OFFICE} days={["mon", "tue"]} />
    </Stack>
  ),
};

/** Estado de carga (`skeleton` o `CnScheduleFieldSkeleton`). */
export const Skeleton: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <CnScheduleField label="Horario" helperText="Ayuda" skeleton />
      <CnScheduleFieldSkeleton size="sm" days={5} openDays={3} />
    </Stack>
  ),
};

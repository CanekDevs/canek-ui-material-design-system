import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnCalendar } from "../CnCalendar";
import type { CnCalendarRange } from "../CnCalendar";
import { CnRatingField } from "../CnRatingField";
import { CnSliderField } from "../CnSliderField";
import { CnDateField } from "./CnDateField";
import type { CnDateRangeValue } from "./CnDateRangeField";
import { CnDateRangeField } from "./CnDateRangeField";

const meta: Meta<typeof CnDateField> = {
  title: "Forms/CnDateField",
  component: CnDateField,
  tags: ["autodocs"],
  args: { label: "Fecha" },
  argTypes: {
    type: { control: "select", options: ["date", "time", "datetime", "month"] },
    format: { control: "select", options: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] },
  },
};

export default meta;
type Story = StoryObj<typeof CnDateField>;

export const Default: Story = {};

const TypesStory = () => {
  const [values, setValues] = useState<Record<string, string>>({
    date: "2024-03-15",
    time: "14:30",
    datetime: "",
    month: "",
  });
  const set = (key: string) => (v: string) => setValues((prev) => ({ ...prev, [key]: v }));
  return (
    <Stack spacing={2} sx={{ maxWidth: 360 }}>
      <CnDateField label="Fecha" type="date" clearable value={values.date} onChange={set("date")} />
      <CnDateField
        label="Hora (12 h)"
        type="time"
        ampm
        minutesStep={15}
        value={values.time}
        onChange={set("time")}
      />
      <CnDateField
        label="Fecha y hora"
        type="datetime"
        value={values.datetime}
        onChange={set("datetime")}
      />
      <CnDateField label="Mes" type="month" value={values.month} onChange={set("month")} />
      <Box component="pre" sx={{ fontSize: 11 }}>
        {JSON.stringify(values, null, 2)}
      </Box>
    </Stack>
  );
};

export const Types: Story = { render: () => <TypesStory /> };

export const Restrictions: Story = {
  args: {
    label: "Cita (días hábiles, próximos 60 días)",
    disablePast: true,
    disableWeekends: true,
    max: new Date(Date.now() + 60 * 86400000),
    disabledDates: ["2026-12-25", "2027-01-01"],
    helperText: "Fines de semana y festivos deshabilitados",
  },
};

export const BirthDate: Story = {
  args: {
    label: "Fecha de nacimiento",
    disableFuture: true,
    openTo: "year",
    helperText: "Abre en la vista de años",
  },
};

const RangeStory = () => {
  const [value, setValue] = useState<CnDateRangeValue>(["", ""]);
  return (
    <Box sx={{ maxWidth: 520 }}>
      <CnDateRangeField
        label="Periodo del reporte"
        value={value}
        onChange={setValue}
        maxDays={90}
        disableFuture
      />
      <Box component="pre" sx={{ fontSize: 11 }}>
        {JSON.stringify(value)}
      </Box>
    </Box>
  );
};

export const DateRange: Story = { render: () => <RangeStory /> };

const CalendarStory = () => {
  const [single, setSingle] = useState<string>("");
  const [range, setRange] = useState<CnCalendarRange>([null, null]);
  return (
    <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
      <CnCalendar
        value={single}
        onChange={setSingle}
        highlightedDates={["2026-11-03", "2026-11-12", "2026-11-20"]}
        showWeekNumbers
      />
      <CnCalendar mode="range" months={2} value={range} onChange={setRange} />
    </Stack>
  );
};

export const InlineCalendar: Story = { render: () => <CalendarStory /> };

export const SliderAndRating: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 420 }}>
      <CnSliderField
        label="Volumen"
        defaultValue={30}
        marks
        step={10}
        formatValue={(v) => `${v}%`}
      />
      <CnSliderField
        label="Precio"
        range
        min={0}
        max={5000}
        step={100}
        defaultValue={[500, 2500]}
        formatValue={(v) => `$${v}`}
      />
      <CnRatingField
        label="Calificación"
        labels={{ 1: "Malo", 2: "Regular", 3: "Bueno", 4: "Muy bueno", 5: "Excelente" }}
      />
    </Stack>
  ),
};

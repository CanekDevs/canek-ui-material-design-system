import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { CnCalendarRange } from "./CnCalendar";
import { CnCalendar } from "./CnCalendar";

const meta: Meta<typeof CnCalendar> = {
  title: "Forms/CnCalendar",
  component: CnCalendar,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CnCalendar>;

const SingleStory = () => {
  const [value, setValue] = useState<string>("2026-11-10");
  return (
    <Stack spacing={1}>
      <CnCalendar
        value={value}
        onChange={setValue}
        disableWeekends
        highlightedDates={["2026-11-12", "2026-11-20"]}
        disabledDates={["2026-11-16"]}
        showWeekNumbers
      />
      <span>Valor: {value}</span>
    </Stack>
  );
};

const RangeStory = () => {
  const [value, setValue] = useState<CnCalendarRange>(["2026-11-03", "2026-11-12"]);
  return (
    <Stack spacing={1}>
      <CnCalendar mode="range" months={2} value={value} onChange={setValue} />
      <span>
        Rango: {value[0] ?? "—"} → {value[1] ?? "—"}
      </span>
    </Stack>
  );
};

export const Single: Story = { render: () => <SingleStory /> };
export const Range: Story = { render: () => <RangeStory /> };
export const MonthPicker: Story = {
  args: {
    views: ["month", "year"],
    openTo: "month",
    shouldDisableMonth: (month: string) => month.endsWith("-12"),
  },
};
export const YearPicker: Story = {
  args: {
    views: ["year"],
    openTo: "year",
    min: "2015-01-01",
    max: "2030-12-31",
    shouldDisableYear: (year: number) => year === 2020,
  },
};

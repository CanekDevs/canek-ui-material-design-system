import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnSegmentedField } from "./CnSegmentedField";
import { CnSegmentedFieldSkeleton } from "./CnSegmentedFieldSkeleton";

const meta: Meta<typeof CnSegmentedField> = {
  title: "Forms/CnSegmentedField",
  component: CnSegmentedField,
  tags: ["autodocs"],
  args: {
    label: "Periodo",
    defaultValue: "month",
    options: [
      { value: "day", label: "Día" },
      { value: "week", label: "Semana" },
      { value: "month", label: "Mes" },
      { value: "year", label: "Año" },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof CnSegmentedField>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 480 }}>
      <CnSegmentedField
        label="Vista"
        iconOnly
        defaultValue="grid"
        options={[
          { value: "list", label: "Lista", icon: "view_list" },
          { value: "grid", label: "Cuadrícula", icon: "grid_view" },
          { value: "board", label: "Tablero", icon: "view_column" },
        ]}
      />
      <CnSegmentedField
        label="Días laborales"
        multiple
        defaultValue={[1, 2, 3, 4, 5]}
        options={["L", "M", "X", "J", "V", "S", "D"].map((label, i) => ({ value: i + 1, label }))}
      />
      <CnSegmentedField
        label="Prioridad"
        fullWidth
        options={[
          { value: "low", label: "Baja", icon: "south_east" },
          { value: "mid", label: "Media", icon: "trending_flat" },
          { value: "high", label: "Alta", icon: "priority_high" },
        ]}
      />
    </Stack>
  ),
};

/** Estado de carga: el skeleton sigue las variantes del campo (`skeleton` o `CnSegmentedFieldSkeleton`). */
export const Skeleton: Story = {
  render: (args) => (
    <Stack spacing={3} sx={{ maxWidth: 480 }}>
      <CnSegmentedField {...args} skeleton />
      <CnSegmentedFieldSkeleton options={3} iconOnly />
      <CnSegmentedFieldSkeleton options={7} size="sm" />
      <CnSegmentedFieldSkeleton options={3} icons fullWidth size="lg" />
      <CnSegmentedFieldSkeleton options={3} orientation="vertical" helperText />
    </Stack>
  ),
};

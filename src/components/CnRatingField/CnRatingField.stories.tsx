import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnRatingField } from "./CnRatingField";
import { CnRatingFieldSkeleton } from "./CnRatingFieldSkeleton";

const meta: Meta<typeof CnRatingField> = {
  title: "Forms/CnRatingField",
  component: CnRatingField,
  tags: ["autodocs"],
  args: {
    label: "Satisfacción",
    defaultValue: 3,
    labels: { 1: "Muy mala", 2: "Mala", 3: "Regular", 4: "Buena", 5: "Excelente" },
  },
};

export default meta;
type Story = StoryObj<typeof CnRatingField>;

export const Default: Story = {};
export const HalfStars: Story = { args: { precision: 0.5, defaultValue: 3.5, labels: undefined } };
export const TenPoints: Story = {
  args: { max: 10, defaultValue: 7, labels: undefined, label: "Calificación" },
};
export const ReadOnly: Story = { args: { readOnly: true } };

/** Estado de carga: el skeleton sigue las variantes del campo (`skeleton` o `CnRatingFieldSkeleton`). */
export const Skeleton: Story = {
  render: (args) => (
    <Stack spacing={3}>
      <CnRatingField {...args} helperText="Tu opinión es anónima" skeleton />
      <CnRatingFieldSkeleton size="sm" />
      <CnRatingFieldSkeleton size="lg" labels />
      <CnRatingFieldSkeleton max={10} label="Calificación" />
    </Stack>
  ),
};

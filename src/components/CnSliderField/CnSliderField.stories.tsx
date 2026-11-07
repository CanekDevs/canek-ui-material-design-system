import type { Meta, StoryObj } from "@storybook/react";
import { CnSliderField } from "./CnSliderField";

const meta: Meta<typeof CnSliderField> = {
  title: "Forms/CnSliderField",
  component: CnSliderField,
  tags: ["autodocs"],
  args: { label: "Descuento", defaultValue: 15, min: 0, max: 50, step: 5, showValue: true },
  decorators: [(Story) => <div style={{ maxWidth: 420 }}>{Story()}</div>],
};

export default meta;
type Story = StoryObj<typeof CnSliderField>;

export const Default: Story = { args: { formatValue: (v: number) => `${v} %` } };
export const Range: Story = {
  args: {
    label: "Rango de precio",
    range: true,
    defaultValue: [2000, 8000],
    min: 0,
    max: 10000,
    step: 500,
    formatValue: (v: number) => `$${v.toLocaleString("es-MX")}`,
  },
};
export const WithMarks: Story = {
  args: {
    label: "Prioridad",
    defaultValue: 2,
    min: 1,
    max: 4,
    step: 1,
    marks: [
      { value: 1, label: "Baja" },
      { value: 2, label: "Media" },
      { value: 3, label: "Alta" },
      { value: 4, label: "Crítica" },
    ],
  },
};

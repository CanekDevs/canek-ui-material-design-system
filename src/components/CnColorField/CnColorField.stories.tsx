import type { Meta, StoryObj } from "@storybook/react";
import { CnColorField } from "./CnColorField";

const meta: Meta<typeof CnColorField> = {
  title: "Forms/CnColorField",
  component: CnColorField,
  tags: ["autodocs"],
  args: { label: "Color de la marca", defaultValue: "#254d87" },
};

export default meta;
type Story = StoryObj<typeof CnColorField>;

export const Default: Story = {};
export const CustomPresets: Story = {
  args: {
    label: "Etiqueta",
    presets: [
      "#ef4444",
      "#f97316",
      "#eab308",
      "#22c55e",
      "#06b6d4",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
    ],
  },
};
export const PaletteOnly: Story = { args: { allowInput: false, label: "Color (solo paleta)" } };

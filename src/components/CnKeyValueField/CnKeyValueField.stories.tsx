import type { Meta, StoryObj } from "@storybook/react";
import { CnKeyValueField } from "./CnKeyValueField";

const meta: Meta<typeof CnKeyValueField> = {
  title: "Forms/CnKeyValueField",
  component: CnKeyValueField,
  tags: ["autodocs"],
  args: {
    label: "Atributos del producto",
    defaultValue: [
      { key: "color", value: "Azul" },
      { key: "talla", value: "M" },
    ],
    keySuggestions: ["color", "talla", "material", "peso"],
  },
};

export default meta;
type Story = StoryObj<typeof CnKeyValueField>;

export const Default: Story = {};
export const AsObject: Story = {
  args: {
    label: "Encabezados HTTP",
    valueFormat: "object",
    keyLabel: "Encabezado",
    defaultValue: { "X-Tenant": "acme" },
  },
};

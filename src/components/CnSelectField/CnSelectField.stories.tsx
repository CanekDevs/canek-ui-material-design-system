import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { CnSelectValue } from "./CnSelectField";
import { CnSelectField } from "./CnSelectField";

const options = [
  { value: "mx", label: "México", group: "América" },
  { value: "co", label: "Colombia", group: "América" },
  { value: "es", label: "España", group: "Europa", description: "Zona euro" },
  { value: "pt", label: "Portugal", group: "Europa", disabled: true },
];

const meta: Meta<typeof CnSelectField> = {
  title: "Forms/CnSelectField",
  component: CnSelectField,
  tags: ["autodocs"],
  args: { label: "País", options, placeholder: "Selecciona un país" },
  argTypes: { size: { control: "select", options: ["sm", "md", "lg"] } },
};

export default meta;
type Story = StoryObj<typeof CnSelectField>;

export const Default: Story = {};

const MultipleStory = () => {
  const [value, setValue] = useState<CnSelectValue>(["mx"]);
  return (
    <Stack spacing={2} sx={{ maxWidth: 360 }}>
      <CnSelectField
        label="Países"
        options={options}
        multiple
        chips
        clearable
        value={value}
        onChange={setValue}
      />
    </Stack>
  );
};

export const MultipleWithChips: Story = { render: () => <MultipleStory /> };

export const Validation: Story = {
  args: { rules: [{ type: "required", message: "Elige un país" }], helperText: "Requerido" },
};

export const States: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 360 }}>
      <CnSelectField label="Deshabilitado" options={options} disabled value="mx" />
      <CnSelectField label="Solo lectura" options={options} readOnly value="co" />
      <CnSelectField label="Con error" options={options} error helperText="Selección inválida" />
    </Stack>
  ),
};

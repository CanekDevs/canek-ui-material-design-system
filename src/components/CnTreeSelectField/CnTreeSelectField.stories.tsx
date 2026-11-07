import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnTreeSelectField } from "./CnTreeSelectField";
import type { CnTreeOption } from "./CnTreeSelectField";

const AREAS: CnTreeOption[] = [
  {
    value: "dir",
    label: "Dirección general",
    icon: "apartment",
    children: [
      {
        value: "ops",
        label: "Operaciones",
        children: [
          { value: "ops-log", label: "Logística" },
          { value: "ops-wh", label: "Almacén" },
        ],
      },
      {
        value: "adm",
        label: "Administración",
        children: [
          { value: "adm-fin", label: "Finanzas" },
          { value: "adm-hr", label: "Recursos humanos" },
          { value: "adm-legal", label: "Jurídico", disabled: true },
        ],
      },
    ],
  },
];

const meta: Meta<typeof CnTreeSelectField> = {
  title: "Forms/CnTreeSelectField",
  component: CnTreeSelectField,
  tags: ["autodocs"],
  args: { label: "Área", options: AREAS, placeholder: "Selecciona un área", showPath: true },
};

export default meta;
type Story = StoryObj<typeof CnTreeSelectField>;

export const Single: Story = {};
export const LeavesOnly: Story = { args: { leavesOnly: true, defaultExpandAll: true } };
export const Multiple: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 420 }}>
      <CnTreeSelectField label="Áreas (todos)" options={AREAS} multiple />
      <CnTreeSelectField label="Áreas (solo hojas)" options={AREAS} multiple valueMode="leaves" />
      <CnTreeSelectField label="Áreas (padres)" options={AREAS} multiple valueMode="parents" />
    </Stack>
  ),
};

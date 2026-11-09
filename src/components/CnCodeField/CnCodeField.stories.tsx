import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnCodeField } from "./CnCodeField";
import { CnCodeFieldSkeleton } from "./CnCodeFieldSkeleton";

const meta: Meta<typeof CnCodeField> = {
  title: "Forms/CnCodeField",
  component: CnCodeField,
  tags: ["autodocs"],
  args: { label: "Configuración" },
};

export default meta;
type Story = StoryObj<typeof CnCodeField>;

export const Json: Story = {
  args: {
    language: "json",
    defaultValue: '{"nombre":"Canek","activo":true,"roles":["admin","ventas"]}',
    helperText: "Tab sangra, Shift+Tab quita sangría y Esc + Tab sale del editor",
  },
};

export const InvalidJson: Story = {
  args: { language: "json", defaultValue: '{\n  "a": 1,\n  "b": \n}', required: true },
};

export const Sql: Story = {
  args: {
    label: "Consulta",
    language: "sql",
    minRows: 4,
    defaultValue: "SELECT id, nombre, correo\nFROM clientes\nWHERE activo = 1\nORDER BY nombre;",
  },
};

export const PlainText: Story = {
  args: {
    label: "Notas",
    language: "text",
    lineWrap: true,
    lineNumbers: false,
    placeholder: "Escribe aquí…",
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack spacing={3}>
      <CnCodeField label="Pequeño" size="sm" language="json" minRows={3} defaultValue="{}" />
      <CnCodeField label="Grande" size="lg" language="json" minRows={3} defaultValue="[]" />
    </Stack>
  ),
};

export const States: Story = {
  render: () => (
    <Stack spacing={3}>
      <CnCodeField
        label="Solo lectura"
        readOnly
        language="json"
        minRows={3}
        defaultValue='{"ok":true}'
      />
      <CnCodeField label="Deshabilitado" disabled minRows={3} defaultValue="texto" />
    </Stack>
  ),
};

/** Estado de carga (`skeleton` o `CnCodeFieldSkeleton`). */
export const Skeleton: Story = {
  render: () => (
    <Stack spacing={3}>
      <CnCodeField label="JSON" language="json" helperText="Ayuda" skeleton />
      <CnCodeFieldSkeleton size="sm" rows={3} lineNumbers={false} />
      <CnCodeFieldSkeleton size="lg" rows={4} toolbar />
    </Stack>
  ),
};

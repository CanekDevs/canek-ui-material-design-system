import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnRepeaterField } from "./CnRepeaterField";
import { CnRepeaterFieldSkeleton } from "./CnRepeaterFieldSkeleton";

const meta: Meta<typeof CnRepeaterField> = {
  title: "Forms/CnRepeaterField",
  component: CnRepeaterField,
  tags: ["autodocs"],
  args: { label: "Pasos a seguir", itemLabel: "Paso", placeholder: "Describe el paso" },
};

export default meta;
type Story = StoryObj<typeof CnRepeaterField>;

export const Default: Story = {
  args: { defaultValue: ["Revisar la solicitud", "Validar documentos", "Aprobar"] },
};

export const MinMax: Story = {
  args: {
    label: "Correos de notificación",
    itemLabel: "Correo",
    placeholder: "nombre@empresa.com",
    minItems: 1,
    maxItems: 4,
    required: true,
    helperText: "Entre 1 y 4 correos",
  },
};

export const Empty: Story = {
  args: { label: "Etiquetas", emptyText: "Aún no agregas etiquetas.", reorderable: false },
};

type Contact = { name: string; phone: string };

const CustomStory = () => {
  const [value, setValue] = useState<Contact[]>([{ name: "Ana", phone: "5512345678" }]);
  return (
    <Box sx={{ maxWidth: 640 }}>
      <CnRepeaterField<Contact>
        label="Contactos de emergencia"
        itemLabel="Contacto"
        value={value}
        onChange={setValue}
        maxItems={3}
        newItem={() => ({ name: "", phone: "" })}
        renderItem={({ value: item, onChange, id, disabled, size }) => (
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              id={id}
              label="Nombre"
              size={size === "lg" ? "medium" : "small"}
              value={item.name}
              disabled={disabled}
              onChange={(event) => onChange({ ...item, name: event.target.value })}
              sx={{ flex: 2 }}
            />
            <TextField
              label="Teléfono"
              size={size === "lg" ? "medium" : "small"}
              value={item.phone}
              disabled={disabled}
              onChange={(event) => onChange({ ...item, phone: event.target.value })}
              sx={{ flex: 1 }}
            />
          </Box>
        )}
      />
      <Box component="pre" sx={{ fontSize: 11 }}>
        {JSON.stringify(value, null, 2)}
      </Box>
    </Box>
  );
};

export const CustomItems: Story = { render: () => <CustomStory /> };

export const States: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 520 }}>
      <CnRepeaterField label="Solo lectura" readOnly defaultValue={["Uno", "Dos"]} />
      <CnRepeaterField label="Deshabilitado" disabled defaultValue={["Uno", "Dos"]} />
      <CnRepeaterField label="Pequeño" size="sm" defaultValue={["Uno"]} />
    </Stack>
  ),
};

/** Estado de carga (`skeleton` o `CnRepeaterFieldSkeleton`). */
export const Skeleton: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 520 }}>
      <CnRepeaterField label="Pasos" defaultValue={["a", "b"]} helperText="Ayuda" skeleton />
      <CnRepeaterFieldSkeleton items={0} counter={false} />
      <CnRepeaterFieldSkeleton size="lg" reorderable={false} />
    </Stack>
  ),
};

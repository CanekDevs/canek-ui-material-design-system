import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnLocationField } from "./CnLocationField";
import { CnLocationFieldSkeleton } from "./CnLocationFieldSkeleton";

const meta: Meta<typeof CnLocationField> = {
  title: "Forms/CnLocationField",
  component: CnLocationField,
  tags: ["autodocs"],
  args: { label: "Ubicación de la sucursal" },
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof CnLocationField>;

export const Default: Story = {
  args: { defaultValue: { lat: 19.432608, lng: -99.133209 } },
};

export const WithAddress: Story = {
  args: {
    showAddress: true,
    required: true,
    helperText: "Usa tu ubicación actual o escribe las coordenadas",
    defaultValue: { lat: 20.676722, lng: -103.347275, address: "Centro, Guadalajara" },
  },
};

export const Empty: Story = { args: { required: true } };

export const WithoutMap: Story = {
  args: { showMap: false, size: "sm", defaultValue: { lat: 25.686614, lng: -100.316113 } },
};

export const States: Story = {
  render: () => (
    <Stack spacing={3}>
      <CnLocationField
        label="Solo lectura"
        readOnly
        mapHeight={160}
        defaultValue={{ lat: 21.161908, lng: -86.851528 }}
      />
      <CnLocationField label="Deshabilitado" disabled showMap={false} />
    </Stack>
  ),
};

/** Estado de carga (`skeleton` o `CnLocationFieldSkeleton`). */
export const Skeleton: Story = {
  render: () => (
    <Stack spacing={3}>
      <CnLocationField label="Ubicación" helperText="Ayuda" showAddress skeleton />
      <CnLocationFieldSkeleton size="sm" showMap={false} geolocation={false} />
    </Stack>
  ),
};

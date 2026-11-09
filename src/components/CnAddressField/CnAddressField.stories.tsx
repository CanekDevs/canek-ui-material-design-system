import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnAddressField } from "./CnAddressField";
import type { CnAddressValue, CnPostalCodeLookupResult } from "./CnAddressField";
import { CnAddressFieldSkeleton } from "./CnAddressFieldSkeleton";

/** Catálogo de ejemplo (en una app real: SEPOMEX, Copomex o la API propia). */
const POSTAL_CODES: Record<string, CnPostalCodeLookupResult> = {
  "06700": {
    colonias: ["Roma Norte"],
    municipio: "Cuauhtémoc",
    estado: "Ciudad de México",
  },
  "44100": {
    colonias: ["Centro", "Zona Centro", "Guadalajara Centro"],
    municipio: "Guadalajara",
    estado: "Jalisco",
  },
  "64000": {
    colonias: ["Monterrey Centro", "Barrio Antiguo"],
    municipio: "Monterrey",
    estado: "Nuevo León",
  },
};

const lookup = async (cp: string) => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return POSTAL_CODES[cp] ?? null;
};

const meta: Meta<typeof CnAddressField> = {
  title: "Forms/CnAddressField",
  component: CnAddressField,
  tags: ["autodocs"],
  args: { label: "Domicilio" },
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof CnAddressField>;

const LookupStory = () => {
  const [value, setValue] = useState<CnAddressValue>({});
  return (
    <Box sx={{ maxWidth: 760 }}>
      <CnAddressField
        label="Domicilio fiscal"
        required
        value={value}
        onChange={setValue}
        onPostalCodeLookup={lookup}
        helperText="Prueba con 06700, 44100 o 64000"
      />
      <Box component="pre" sx={{ fontSize: 11 }}>
        {JSON.stringify(value, null, 2)}
      </Box>
    </Box>
  );
};

export const PostalCodeLookup: Story = { render: () => <LookupStory /> };

export const Default: Story = {
  args: {
    defaultValue: {
      street: "Av. Insurgentes Sur",
      exteriorNumber: "1602",
      interiorNumber: "Piso 4",
      postalCode: "03940",
      neighborhood: "Crédito Constructor",
      municipality: "Benito Juárez",
      state: "Ciudad de México",
    },
  },
};

export const CustomParts: Story = {
  args: {
    label: "Dirección de entrega",
    fields: ["street", "exteriorNumber", "postalCode", "municipality", "state", "country"],
    labels: { municipality: "Ciudad", state: "Estado / provincia" },
    states: false,
    validatePostalCode: false,
    required: true,
    requiredParts: ["street", "postalCode", "country"],
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack spacing={4} sx={{ maxWidth: 760 }}>
      <CnAddressField
        label="Pequeño"
        size="sm"
        fields={["street", "exteriorNumber", "postalCode"]}
      />
      <CnAddressField
        label="Grande"
        size="lg"
        fields={["street", "exteriorNumber", "postalCode"]}
      />
    </Stack>
  ),
};

export const States: Story = {
  render: () => (
    <Stack spacing={4} sx={{ maxWidth: 760 }}>
      <CnAddressField
        label="Solo lectura"
        readOnly
        defaultValue={{ street: "Juárez", exteriorNumber: "10", state: "Puebla" }}
        fields={["street", "exteriorNumber", "state"]}
      />
      <CnAddressField label="Deshabilitado" disabled fields={["street", "postalCode"]} />
    </Stack>
  ),
};

/** Estado de carga (`skeleton` o `CnAddressFieldSkeleton`). */
export const Skeleton: Story = {
  render: () => (
    <Stack spacing={4} sx={{ maxWidth: 760 }}>
      <CnAddressField label="Domicilio" helperText="Ayuda" skeleton />
      <CnAddressFieldSkeleton size="sm" fields={["street", "exteriorNumber", "postalCode"]} />
    </Stack>
  ),
};

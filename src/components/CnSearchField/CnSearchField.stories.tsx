import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnSearchField } from "./CnSearchField";
import type { CnSearchSuggestion } from "./CnSearchField";
import { CnSearchFieldSkeleton } from "./CnSearchFieldSkeleton";

const CITIES = [
  "Ciudad de México",
  "Guadalajara",
  "Monterrey",
  "Puebla",
  "Querétaro",
  "Mérida",
  "Cancún",
  "León",
  "Tijuana",
  "Oaxaca",
];

const PEOPLE: CnSearchSuggestion[] = [
  { value: "ana", label: "Ana López", description: "Ventas · Monterrey" },
  { value: "bruno", label: "Bruno Díaz", description: "Soporte · CDMX" },
  { value: "carla", label: "Carla Méndez", description: "Finanzas · Guadalajara" },
  { value: "david", label: "David Ortega", description: "Sistemas · Puebla" },
];

const meta: Meta<typeof CnSearchField> = {
  title: "Forms/CnSearchField",
  component: CnSearchField,
  tags: ["autodocs"],
  args: { label: "Buscar ciudad" },
};

export default meta;
type Story = StoryObj<typeof CnSearchField>;

export const Default: Story = { args: { suggestions: CITIES } };

const AsyncStory = () => {
  const [selected, setSelected] = useState<string>("");
  return (
    <Stack spacing={1} sx={{ maxWidth: 420 }}>
      <CnSearchField
        label="Buscar persona"
        placeholder="Nombre o área"
        onSearch={async (query, { signal }) => {
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(resolve, 600);
            signal.addEventListener("abort", () => {
              clearTimeout(timer);
              reject(new Error("abort"));
            });
          });
          const needle = query.toLowerCase();
          return PEOPLE.filter((p) => `${p.label} ${p.description}`.toLowerCase().includes(needle));
        }}
        onSelect={(item) => setSelected(item.label ?? item.value)}
        minChars={2}
        recentSearches
        recentKey="people"
      />
      <small>Seleccionado: {selected || "—"}</small>
    </Stack>
  );
};

export const AsyncWithRecent: Story = { render: () => <AsyncStory /> };

export const Sizes: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 420 }}>
      <CnSearchField label="Pequeño" size="sm" suggestions={CITIES} />
      <CnSearchField label="Mediano" suggestions={CITIES} />
      <CnSearchField label="Grande" size="lg" suggestions={CITIES} />
    </Stack>
  ),
};

export const States: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 420 }}>
      <CnSearchField label="Deshabilitado" disabled defaultValue="Mérida" />
      <CnSearchField label="Solo lectura" readOnly defaultValue="León" />
      <CnSearchField
        label="Requerido"
        required
        rules={[{ type: "minLength", value: 3 }]}
        helperText="Mínimo 3 caracteres"
      />
    </Stack>
  ),
};

/** Estado de carga (`skeleton` o `CnSearchFieldSkeleton`). */
export const Skeleton: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 420 }}>
      <CnSearchField label="Buscar" helperText="Ayuda" skeleton />
      <CnSearchFieldSkeleton size="sm" label={false} />
      <CnSearchFieldSkeleton size="lg" />
    </Stack>
  ),
};

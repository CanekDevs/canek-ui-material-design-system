import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import type { CnFieldOption } from "../CnForm/CnForm.types";
import { CnAutocompleteField } from "./CnAutocompleteField";
import Stack from "@mui/material/Stack";
import { CnAutocompleteFieldSkeleton } from "./CnAutocompleteFieldSkeleton";

const cities: CnFieldOption[] = [
  { value: "cdmx", label: "Ciudad de México", group: "México", searchText: "CDMX DF" },
  { value: "mty", label: "Monterrey", group: "México" },
  { value: "gdl", label: "Guadalajara", group: "México" },
  { value: "bog", label: "Bogotá", group: "Colombia" },
  { value: "med", label: "Medellín", group: "Colombia" },
  { value: "mad", label: "Madrid", group: "España" },
];

const meta: Meta<typeof CnAutocompleteField> = {
  title: "Forms/CnAutocompleteField",
  component: CnAutocompleteField,
  tags: ["autodocs"],
  args: { label: "Ciudad", options: cities, placeholder: "Busca sin acentos: bogota, medellin…" },
};

export default meta;
type Story = StoryObj<typeof CnAutocompleteField>;

export const Default: Story = {};

export const Multiple: Story = { args: { multiple: true, label: "Ciudades" } };

export const FreeSolo: Story = {
  args: { freeSolo: true, multiple: true, label: "Etiquetas", options: [] },
};

const RemoteStory = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<CnFieldOption[]>([]);
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setOptions(cities.filter((city) => city.label.toLowerCase().includes(query.toLowerCase())));
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);
  return (
    <CnAutocompleteField
      label="Búsqueda remota"
      options={options}
      loading={loading}
      disableFiltering
      onInputChange={setQuery}
    />
  );
};

export const RemoteSearch: Story = { render: () => <RemoteStory /> };

const PEOPLE: CnFieldOption[] = [
  "Ana López",
  "Luis Pérez",
  "María Hernández",
  "Jorge Ramírez",
  "Sofía Torres",
  "Diego Morales",
].map((label, index) => ({ value: index + 1, label, initials: true }));

const waitMs = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const LoadOptionsAndCreate: Story = {
  args: {
    label: "Responsable",
    helperText: "Busca en el servidor; si no existe, créalo",
    loadOptions: async ({ input }) => {
      await waitMs(400);
      return PEOPLE.filter((person) => person.label.toLowerCase().includes(input.toLowerCase()));
    },
    onCreateOption: async (input) => {
      await waitMs(300);
      return { value: Date.now(), label: input, initials: true };
    },
    selectedOptions: [PEOPLE[2]],
    defaultValue: 3,
    options: undefined,
  },
};

export const MinSearchLength: Story = {
  args: {
    label: "Cliente (mín. 2 letras)",
    minSearchLength: 2,
    multiple: true,
    loadOptions: async ({ input }) => {
      await waitMs(400);
      return PEOPLE.filter((person) => person.label.toLowerCase().includes(input.toLowerCase()));
    },
    options: undefined,
  },
};

/** Estado de carga: el skeleton sigue las variantes del campo (`skeleton` o `CnAutocompleteFieldSkeleton`). */
export const Skeleton: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 360 }}>
      <CnAutocompleteField label="Ciudad" options={cities} helperText="Busca por nombre" skeleton />
      <CnAutocompleteFieldSkeleton size="sm" optionMedia />
      <CnAutocompleteFieldSkeleton size="lg" freeSolo helperText />
      <CnAutocompleteFieldSkeleton multiple selectedCount={2} />
      <CnAutocompleteFieldSkeleton multiple selectedCount={6} limitTags={3} />
      <CnAutocompleteFieldSkeleton variant="filled" />
    </Stack>
  ),
};

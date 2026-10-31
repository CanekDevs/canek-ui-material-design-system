import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import type { CnFieldOption } from "../CnForm/CnForm.types";
import { CnAutocompleteField } from "./CnAutocompleteField";

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

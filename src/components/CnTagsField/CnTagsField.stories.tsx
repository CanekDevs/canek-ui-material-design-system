import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnTagsField } from "./CnTagsField";
import { CnTagsFieldSkeleton } from "./CnTagsFieldSkeleton";

const meta: Meta<typeof CnTagsField> = {
  title: "Forms/CnTagsField",
  component: CnTagsField,
  tags: ["autodocs"],
  args: { label: "Etiquetas" },
};

export default meta;
type Story = StoryObj<typeof CnTagsField>;

export const Default: Story = { args: { defaultValue: ["react", "mui"] } };

export const Emails: Story = {
  args: {
    label: "Invitar por correo",
    tagRules: [{ type: "email" }],
    transform: "lowercase",
    maxTags: 10,
    placeholder: "Pega o escribe correos",
    helperText: "Puedes pegar una lista separada por comas o saltos de línea",
  },
};

export const WithSuggestions: Story = {
  args: {
    label: "Habilidades",
    suggestions: [
      "React",
      "TypeScript",
      "Node.js",
      "GraphQL",
      "Docker",
      "Kubernetes",
      "PostgreSQL",
    ],
  },
};

/** Estado de carga: el skeleton sigue las variantes del campo (`skeleton` o `CnTagsFieldSkeleton`). */
export const Skeleton: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 480 }}>
      <CnTagsField label="Etiquetas" defaultValue={["react", "mui"]} skeleton />
      <CnTagsFieldSkeleton size="sm" tags={0} />
      <CnTagsFieldSkeleton size="lg" tags={6} maxTags={10} helperText />
      <CnTagsFieldSkeleton tags={4} readOnly />
    </Stack>
  ),
};

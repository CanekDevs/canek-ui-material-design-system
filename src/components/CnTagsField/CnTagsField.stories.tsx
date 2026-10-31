import type { Meta, StoryObj } from "@storybook/react";
import { CnTagsField } from "./CnTagsField";

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

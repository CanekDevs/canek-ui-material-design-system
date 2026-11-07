import type { Meta, StoryObj } from "@storybook/react";
import { CnFormSkeleton } from "./CnFormSkeleton";

const meta: Meta<typeof CnFormSkeleton> = {
  title: "Feedback/CnFormSkeleton",
  component: CnFormSkeleton,
  tags: ["autodocs"],
  args: { rows: 4, columns: 2, showHeader: true, showActions: true },
  decorators: [(Story) => <div style={{ maxWidth: 720 }}>{Story()}</div>],
};

export default meta;
type Story = StoryObj<typeof CnFormSkeleton>;

export const Default: Story = {};
export const SingleColumnWithTextarea: Story = { args: { columns: 1, withTextarea: true } };

/** Dinámico: un marcador con la forma de cada tipo de campo y su ancho de columna. */
export const FromFields: Story = {
  args: {
    columns: 2,
    showHeader: true,
    showActions: true,
    fields: [
      { type: "text", label: true },
      { type: "email", label: true },
      { type: "select", label: true },
      { type: "date", label: true },
      { type: "number", label: true },
      { type: "phone", label: true },
      { type: "radio", label: true, options: [1, 2, 3], direction: "row" },
      { type: "checkbox", label: true, options: [1, 2, 3, 4] },
      { type: "switch", label: true },
      { type: "slider", label: true, marks: true },
      { type: "textarea", label: true, rows: 4 },
      { type: "file", label: true },
    ],
  },
};

/** Secciones con título, descripción, columnas propias y spans por campo. */
export const WithSections: Story = {
  args: {
    showHeader: true,
    showActions: true,
    actionsAlign: "between",
    extraActions: 1,
    sections: [
      {
        title: true,
        description: true,
        columns: 3,
        fields: [
          { type: "text", label: true, md: 6 },
          { type: "text", label: true, md: 3 },
          { type: "select", label: true, md: 3 },
          { type: "textarea", label: true },
        ],
      },
      {
        title: true,
        appearance: "filled",
        repeatable: true,
        initialItems: 2,
        columns: 2,
        fields: 2,
      },
    ],
  },
};

export const Tabbed: Story = {
  args: {
    showHeader: true,
    showActions: true,
    tabs: [
      {
        label: "General",
        fields: [
          { type: "text", label: true },
          { type: "select", label: true },
        ],
      },
      { label: "Contacto" },
      { label: "Facturación" },
    ],
    columns: 2,
  },
};

export const Wizard: Story = {
  args: {
    showActions: true,
    steps: [
      {
        title: "Datos",
        fields: [
          { type: "text", label: true },
          { type: "date", label: true },
        ],
      },
      { title: "Dirección" },
      { title: "Confirmar" },
    ],
  },
};

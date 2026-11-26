import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { catalogDocs } from "../../catalog";
import { CnActivityComposer } from "./CnActivityComposer";
import { CnActivityComposerSkeleton } from "./CnActivityComposerSkeleton";
import type { CnMentionable } from "./mentions";

const PEOPLE: CnMentionable[] = [
  { id: "u1", name: "Carlos Méndez", description: "Ejecutivo de cuenta" },
  { id: "u2", name: "Lucía Ramírez", description: "Preventa" },
  { id: "u3", name: "Jorge Salinas", description: "Gerente comercial" },
  { id: "u4", name: "Ana Torres", description: "Cobranza" },
];

const TEMPLATES = [
  {
    id: "t1",
    label: "Seguimiento de propuesta",
    body: "Di seguimiento a la propuesta enviada. Próximo paso: ",
  },
  {
    id: "t2",
    label: "Llamada de descubrimiento",
    body: "Necesidad: \nPresupuesto: \nDecisor: \nTiempos: ",
    type: "call" as const,
  },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const meta: Meta<typeof CnActivityComposer> = {
  title: "Forms/CnActivityComposer",
  component: CnActivityComposer,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: catalogDocs("CnActivityComposer") } } },
  args: {
    mentionables: PEOPLE,
    templates: TEMPLATES,
    recordName: "Mariana López",
    onSubmit: async () => {
      await wait(800);
    },
  },
  render: (args) => (
    <Box sx={{ maxWidth: 640 }}>
      <CnActivityComposer {...args} />
    </Box>
  ),
};

export default meta;
type Story = StoryObj<typeof CnActivityComposer>;

export const Default: Story = {};

export const Call: Story = { args: { defaultType: "call" } };

export const Meeting: Story = { args: { defaultType: "meeting" } };

export const Task: Story = { args: { defaultType: "task", onCancel: () => undefined } };

export const OnlyNotes: Story = { args: { types: ["note"] } };

export const SaveError: Story = {
  args: {
    onSubmit: async () => {
      await wait(600);
      throw new Error("No se pudo guardar: se perdió la conexión con el servidor.");
    },
  },
};

export const Disabled: Story = { args: { disabled: true } };

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "24px", maxWidth: 640 }}>
      <CnActivityComposerSkeleton />
      <CnActivityComposer skeleton types={["note"]} onSubmit={() => undefined} />
    </Box>
  ),
};

const LONG =
  "Comercializadora Internacional de Productos Industriales y Servicios Logísticos del Bajío, S.A.P.I. de C.V.";

/** Datos extremos (nombres de 100+ caracteres, palabras sin espacios) a 320, 480 y 1200 px. */
export const Responsive: Story = {
  parameters: { maxWidth: "none" },
  render: () => (
    <Box sx={{ display: "grid", gap: "24px" }}>
      {[320, 480, 1200].map((width) => (
        <Box key={width} data-stress-width={width} sx={{ width }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {width}px
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: "12px",
              border: "1px dashed var(--cn-color-border, #dde0e4)",
              p: "4px",
            }}
          >
            <CnActivityComposer
              defaultType="call"
              recordName={LONG}
              templates={TEMPLATES}
              mentionables={[
                ...PEOPLE,
                { id: "x", name: "SINESPACIOSSINESPACIOSSINESPACIOSSINESPACIOS" },
              ]}
              onSubmit={() => undefined}
              onCancel={() => undefined}
            />
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

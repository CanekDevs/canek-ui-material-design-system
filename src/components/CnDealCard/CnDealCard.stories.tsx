import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { catalogDocs } from "../../catalog";
import { CnDealCard } from "./CnDealCard";
import { CnDealCardSkeleton } from "./CnDealCardSkeleton";

const meta: Meta<typeof CnDealCard> = {
  title: "Data Display/CnDealCard",
  component: CnDealCard,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: catalogDocs("CnDealCard") } } },
  args: {
    title: "Licencias anuales para planta Monterrey",
    company: "Grupo Altavista",
    amount: 1280000,
    probability: 60,
    owner: { name: "Carlos Méndez" },
    nextActivity: { label: "Demo con TI", due: "Jue 28 nov" },
    closeDate: "15 dic",
    tags: ["Renovación", "Cliente clave"],
  },
  argTypes: {
    status: { control: "inline-radio", options: ["open", "won", "lost"] },
    density: { control: "inline-radio", options: ["comfortable", "compact"] },
    probability: { control: { type: "range", min: 0, max: 100 } },
  },
  render: (args) => (
    <Box sx={{ maxWidth: 300 }}>
      <CnDealCard {...args} />
    </Box>
  ),
};

export default meta;
type Story = StoryObj<typeof CnDealCard>;

export const Default: Story = {};

export const Clickable: Story = { args: { onClick: () => undefined, showWeighted: true } };

export const Selected: Story = { args: { onClick: () => undefined, selected: true } };

export const Compact: Story = { args: { density: "compact" } };

export const Overdue: Story = {
  args: { nextActivity: { label: "Enviar contrato", due: "Ayer", overdue: true }, probability: 25 },
};

export const WonAndLost: Story = {
  render: (args) => (
    <Box sx={{ display: "grid", gap: "12px", maxWidth: 300 }}>
      <CnDealCard {...args} status="won" stage="Cerrada" nextActivity={undefined} />
      <CnDealCard {...args} status="lost" stage="Cerrada" nextActivity={undefined} />
    </Box>
  ),
};

export const WithoutAmount: Story = {
  args: { amount: undefined, probability: undefined, tags: [] },
};

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "12px", maxWidth: 300 }}>
      <CnDealCardSkeleton />
      <CnDealCard skeleton title="" density="compact" />
    </Box>
  ),
};

const LONG =
  "Comercializadora Internacional de Productos Industriales y Servicios Logísticos del Bajío, S.A.P.I. de C.V.";

/** Datos extremos (textos de 100+ caracteres, palabras sin espacios, montos enormes) a 320, 480 y 1200 px. */
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
              gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
              gap: "12px",
              border: "1px dashed var(--cn-color-border, #dde0e4)",
              p: "4px",
            }}
          >
            <CnDealCard
              title={LONG}
              company={LONG}
              amount={1234567890123}
              probability={88}
              showWeighted
              owner={{ name: "Ana" }}
              nextActivity={{ label: LONG, due: "Hoy" }}
              tags={["SINESPACIOSSINESPACIOSSINESPACIOSSINESPACIOS", "Otra"]}
              closeDate="31 dic 2026"
            />
            <CnDealCard title="Sin datos" />
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

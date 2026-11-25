import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { catalogDocs } from "../../catalog";
import { CnDealCard } from "../CnDealCard";
import type { CnKanbanBoardProps } from "./CnKanbanBoard";
import { CnKanbanBoard } from "./CnKanbanBoard";
import { CnKanbanBoardSkeleton } from "./CnKanbanBoardSkeleton";
import { moveKanbanItem } from "./kanban-utils";
import type { SampleDeal } from "./pipeline-sample";
import { SAMPLE_DEALS, SAMPLE_STAGES } from "./pipeline-sample";

type Args = Partial<CnKanbanBoardProps<SampleDeal>>;

const Pipeline = (args: Args) => {
  const [deals, setDeals] = useState(args.items ?? SAMPLE_DEALS);
  return (
    <CnKanbanBoard<SampleDeal>
      columns={SAMPLE_STAGES}
      {...args}
      items={deals}
      renderCard={(item) => <CnDealCard {...item} density="compact" />}
      onMove={(id, column, index) =>
        setDeals((current) => moveKanbanItem(current, id, column, index))
      }
    />
  );
};

const meta: Meta<typeof CnKanbanBoard> = {
  title: "Data Display/CnKanbanBoard",
  component: CnKanbanBoard,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: catalogDocs("CnKanbanBoard") } } },
  render: (args) => <Pipeline {...(args as unknown as Args)} />,
};

export default meta;
type Story = StoryObj<typeof CnKanbanBoard>;

/** Arrastra con el mouse, o enfoca una tarjeta y usa Espacio + flechas. */
export const Default: Story = {};

export const WithAddButton: Story = {
  args: { onAddCard: () => undefined, addCardLabel: "Nueva oportunidad" },
};

/** "Ganada" solo acepta tarjetas que ya están en Negociación. */
export const BlockedStages: Story = {
  args: {
    canDrop: (item, to) =>
      to !== "won" || item.columnId === "negotiation" || item.columnId === "won",
  },
};

export const Empty: Story = { args: { items: [] } };

export const ScrollingColumns: Story = { args: { maxColumnHeight: 320 } };

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "24px" }}>
      <CnKanbanBoardSkeleton columns={5} />
      <CnKanbanBoard
        skeleton
        columns={SAMPLE_STAGES}
        items={[]}
        renderCard={() => null}
        onMove={() => undefined}
      />
    </Box>
  ),
};

const LONG =
  "Comercializadora Internacional de Productos Industriales y Servicios Logísticos del Bajío, S.A.P.I. de C.V.";

/** Datos extremos (textos de 100+ caracteres, montos enormes, columnas vacías) a 320, 480 y 1200 px. */
export const Responsive: Story = {
  parameters: { maxWidth: "none" },
  render: () => (
    <Box sx={{ display: "grid", gap: "24px" }}>
      {[320, 480, 1200].map((width) => (
        <Box key={width} data-stress-width={width} sx={{ width }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {width}px
          </Typography>
          <Box sx={{ border: "1px dashed var(--cn-color-border, #dde0e4)", p: "4px" }}>
            <Pipeline
              columns={[...SAMPLE_STAGES.slice(0, 3), { id: "long", title: LONG, limit: 1 }]}
              items={[
                {
                  ...SAMPLE_DEALS[0],
                  title: LONG,
                  company: LONG,
                  value: 1234567890123,
                  amount: 1234567890123,
                },
                ...SAMPLE_DEALS.slice(1, 4),
              ]}
            />
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

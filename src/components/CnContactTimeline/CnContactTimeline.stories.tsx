import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { catalogDocs } from "../../catalog";
import type { CnActivityDraft } from "../CnActivityComposer";
import type { CnContactActivity } from "./CnContactTimeline";
import { CnContactTimeline } from "./CnContactTimeline";
import { CnContactTimelineSkeleton } from "./CnContactTimelineSkeleton";

const NOW = new Date("2026-11-25T12:00:00");
const at = (days: number, hour: number, minute = 0) => {
  const date = new Date(NOW);
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const PEOPLE = [
  { id: "u1", name: "Carlos Méndez", description: "Ejecutivo de cuenta" },
  { id: "u2", name: "Lucía Ramírez", description: "Preventa" },
];

const ACTIVITIES: CnContactActivity[] = [
  {
    id: "a0",
    channel: "note",
    pinned: true,
    title: "Acuerdo de precios",
    description: "Descuento máximo autorizado: 12 % sobre lista. Pagos a 60 días.",
    actor: "Jorge Salinas",
    time: at(9, 10),
  },
  {
    id: "a1",
    channel: "call",
    title: "Llamada con Mariana López",
    description:
      "Revisamos el alcance de la propuesta. Pide incluir capacitación para 20 personas.",
    actor: "Carlos Méndez",
    time: at(0, 10, 30),
    tags: ["Contestó", "12 min"],
  },
  {
    id: "a2",
    channel: "email",
    title: "Correo enviado: Propuesta comercial v2",
    description: "Se adjunta la propuesta con el ajuste de capacitación.",
    actor: "Carlos Méndez",
    time: at(0, 9, 5),
    attachments: [{ name: "Propuesta-Altavista-v2.pdf", size: "1.2 MB" }],
  },
  {
    id: "a3",
    channel: "meeting",
    title: "Demo del producto",
    description: "Asistieron 4 personas del área de compras y 2 de TI.",
    actor: "Lucía Ramírez",
    time: at(1, 16),
  },
  {
    id: "a4",
    channel: "deal",
    title: "Oportunidad movida a Negociación",
    actor: "Carlos Méndez",
    time: at(1, 17, 40),
    changes: [{ field: "Etapa", before: "Propuesta", after: "Negociación" }],
  },
  {
    id: "a5",
    channel: "task",
    title: "Tarea completada: enviar referencias de clientes",
    actor: "Carlos Méndez",
    time: at(3, 11),
  },
  {
    id: "a6",
    channel: "system",
    title: "Contacto creado desde el formulario del sitio",
    time: at(12, 8),
  },
];

const meta: Meta<typeof CnContactTimeline> = {
  title: "Data Display/CnContactTimeline",
  component: CnContactTimeline,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: catalogDocs("CnContactTimeline") } } },
  args: {
    activities: ACTIVITIES,
    timelineProps: { now: NOW },
  },
  render: (args) => (
    <Box sx={{ maxWidth: 720 }}>
      <CnContactTimeline {...args} />
    </Box>
  ),
};

export default meta;
type Story = StoryObj<typeof CnContactTimeline>;

export const Default: Story = {};

const InteractiveDemo = () => {
  const [items, setItems] = useState(ACTIVITIES);
  const create = async (draft: CnActivityDraft) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setItems((current) => [
      {
        id: `n${current.length}`,
        channel: draft.type,
        title: draft.subject || draft.body.split("\n")[0].slice(0, 80),
        description: draft.body,
        actor: "Tú",
        time: new Date(),
      },
      ...current,
    ]);
  };
  return (
    <Box sx={{ maxWidth: 720 }}>
      <CnContactTimeline
        activities={items}
        onCreate={create}
        composerProps={{ mentionables: PEOPLE, recordName: "Mariana López" }}
        onPinChange={(activity, pinned) =>
          setItems((current) => current.map((a) => (a.id === activity.id ? { ...a, pinned } : a)))
        }
      />
    </Box>
  );
};

/** Compositor en línea, fijar y quitar de fijadas: el estado vive en la historia. */
export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};

export const Empty: Story = {
  args: { activities: [], onCreate: () => undefined },
};

export const LoadError: Story = {
  args: {
    activities: [],
    error: "No se pudo cargar el historial.",
    onRetry: () => undefined,
  },
};

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "24px", maxWidth: 720 }}>
      <CnContactTimelineSkeleton />
      <CnContactTimeline skeleton activities={[]} />
    </Box>
  ),
};

const LONG =
  "Comercializadora Internacional de Productos Industriales y Servicios Logísticos del Bajío, S.A.P.I. de C.V.";

/** Datos extremos (textos de 100+ caracteres, palabras sin espacios, lista vacía) a 320, 480 y 1200 px. */
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
            <CnContactTimeline
              timelineProps={{ now: NOW }}
              onCreate={() => undefined}
              onPinChange={() => undefined}
              activities={[
                { ...ACTIVITIES[0], title: LONG, description: LONG },
                {
                  ...ACTIVITIES[1],
                  title: "SINESPACIOSSINESPACIOSSINESPACIOSSINESPACIOSSINESPACIOSSINESPACIOS",
                },
                ...ACTIVITIES.slice(2),
              ]}
            />
            <CnContactTimeline activities={[]} timelineProps={{ now: NOW }} />
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

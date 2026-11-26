import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { catalogDocs } from "../../catalog";
import { CnChatMessage } from "./CnChatMessage";
import { CnChatMessageSkeleton } from "./CnChatMessageSkeleton";

const LUCIA = { name: "Lucía Méndez" };
const AT = new Date(2026, 10, 26, 10, 42);
const ACTIONS = [
  { id: "responder", label: "Responder", icon: "reply" },
  { id: "copiar", label: "Copiar texto", icon: "content_copy" },
  { id: "borrar", label: "Borrar", icon: "delete_outline", danger: true },
];

const meta: Meta<typeof CnChatMessage> = {
  title: "Components/CnChatMessage",
  component: CnChatMessage,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: catalogDocs("CnChatMessage") } } },
  args: {
    author: LUCIA,
    time: AT,
    children: "¿Me confirmas el precio del lote de 200 piezas?",
    actions: ACTIONS,
  },
};

export default meta;
type Story = StoryObj<typeof CnChatMessage>;

export const Default: Story = {};

export const Conversation: Story = {
  render: () => (
    <Box sx={{ maxWidth: 640, display: "grid" }}>
      <CnChatMessage variant="system" time={AT}>
        Lucía Méndez abrió la conversación
      </CnChatMessage>
      <CnChatMessage author={LUCIA} time={AT} actions={ACTIONS}>
        Hola, ¿me confirmas el precio del lote de 200 piezas?
      </CnChatMessage>
      <CnChatMessage author={LUCIA} time={AT} grouped actions={ACTIONS}>
        Lo necesitamos para el viernes.
      </CnChatMessage>
      <CnChatMessage own time={AT} status="read" actions={ACTIONS}>
        {"Claro. El lote queda en $48,600 con IVA.\nTe mando la cotización."}
      </CnChatMessage>
      <CnChatMessage
        own
        grouped
        time={AT}
        status="delivered"
        attachments={[{ id: "1", name: "Cotización-2026-0142.pdf", size: 248_000, url: "#" }]}
      />
      <CnChatMessage own time={AT} status="sending">
        Enviando…
      </CnChatMessage>
      <CnChatMessage own time={AT} status="error" onRetry={() => undefined}>
        Este mensaje no se pudo enviar.
      </CnChatMessage>
    </Box>
  ),
};

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ maxWidth: 640 }}>
      <CnChatMessageSkeleton />
      <CnChatMessageSkeleton own />
      <CnChatMessage skeleton />
    </Box>
  ),
};

const LONG =
  "Seguimiento de oportunidades comerciales de la región Bajío y Occidente con distribuidores autorizados";

/** Datos extremos (textos de 100+ caracteres, palabras sin espacios, adjunto con nombre enorme) a 320, 480 y 1200 px. */
export const Responsive: Story = {
  parameters: { maxWidth: "none" },
  render: () => (
    <Box sx={{ display: "grid", gap: "24px" }}>
      {[320, 480, 1200].map((width) => (
        <Box key={width} data-stress-width={width} sx={{ width }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {width}px
          </Typography>
          <Box sx={{ border: "1px dashed var(--cn-color-border, #dde0e4)", p: "8px" }}>
            <CnChatMessage author={{ name: LONG }} time={AT} actions={ACTIONS}>
              {LONG} {LONG}
            </CnChatMessage>
            <CnChatMessage own time={AT} status="error" onRetry={() => undefined}>
              SinEspaciosSinEspaciosSinEspaciosSinEspaciosSinEspaciosSinEspaciosSinEspacios
            </CnChatMessage>
            <CnChatMessage
              own
              time={AT}
              attachments={[{ id: "a", name: `${LONG}.pdf`, size: 9_800_000 }]}
            />
            <CnChatMessage variant="system">{LONG}</CnChatMessage>
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

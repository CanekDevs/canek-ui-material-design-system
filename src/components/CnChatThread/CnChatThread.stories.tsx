import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { catalogDocs } from "../../catalog";
import { CnChatThread } from "./CnChatThread";
import type { CnChatThreadMessage, CnChatThreadProps } from "./CnChatThread";
import { CnChatThreadSkeleton } from "./CnChatThreadSkeleton";
import { CHAT_MESSAGES, CHAT_NOW, CHAT_PARTICIPANTS } from "./chat-sample";

const ACTIONS = () => [
  { id: "responder", label: "Responder", icon: "reply" },
  { id: "copiar", label: "Copiar texto", icon: "content_copy" },
];

const Live = (props: Partial<CnChatThreadProps>) => {
  const [messages, setMessages] = useState<CnChatThreadMessage[]>(props.messages ?? CHAT_MESSAGES);
  const [typing, setTyping] = useState<string[]>([]);
  return (
    <Box sx={{ maxWidth: 720 }}>
      <CnChatThread
        participants={CHAT_PARTICIPANTS}
        currentUserId="yo"
        now={CHAT_NOW}
        messageActions={ACTIONS}
        typing={typing}
        onRetry={(m) =>
          setMessages((all) => all.map((x) => (x.id === m.id ? { ...x, status: "sent" } : x)))
        }
        onSend={async (text) => {
          setMessages((all) => [
            ...all,
            {
              id: `n${all.length}`,
              authorId: "yo",
              content: text,
              time: new Date(),
              status: "sent",
            },
          ]);
          setTyping(["Lucía Méndez"]);
          setTimeout(() => {
            setTyping([]);
            setMessages((all) => [
              ...all,
              {
                id: `r${all.length}`,
                authorId: "lucia",
                content: "¡Gracias! Lo reviso.",
                time: new Date(),
              },
            ]);
          }, 1500);
        }}
        {...props}
        messages={messages}
      />
    </Box>
  );
};

const meta: Meta<typeof CnChatThread> = {
  title: "Components/CnChatThread",
  component: CnChatThread,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: catalogDocs("CnChatThread") } } },
};

export default meta;
type Story = StoryObj<typeof CnChatThread>;

/** Escribe y presiona Intro: el hilo baja solo y Lucía «escribe» una respuesta. */
export const Default: Story = { render: () => <Live /> };

export const Empty: Story = { render: () => <Live messages={[]} /> };

/** Mensajes anteriores: el botón de arriba los carga sin mover la lectura. */
export const LoadOlder: Story = {
  render: function Older() {
    const [messages, setMessages] = useState(CHAT_MESSAGES.slice(3));
    const [loading, setLoading] = useState(false);
    return (
      <Live
        messages={messages}
        hasOlder={messages.length < CHAT_MESSAGES.length}
        loadingOlder={loading}
        onLoadOlder={() => {
          setLoading(true);
          setTimeout(() => {
            setMessages(CHAT_MESSAGES);
            setLoading(false);
          }, 800);
        }}
      />
    );
  },
};

export const ReadOnly: Story = {
  render: () => (
    <Box sx={{ maxWidth: 720 }}>
      <CnChatThread
        messages={CHAT_MESSAGES}
        participants={CHAT_PARTICIPANTS}
        currentUserId="yo"
        now={CHAT_NOW}
        height={420}
      />
    </Box>
  ),
};

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "16px", maxWidth: 720 }}>
      <CnChatThreadSkeleton height={360} />
      <CnChatThread skeleton messages={[]} participants={{}} height={360} />
    </Box>
  ),
};

const LONG =
  "Seguimiento de oportunidades comerciales de la región Bajío y Occidente con distribuidores autorizados";

/** Datos extremos (mensajes de 100+ caracteres, palabras sin espacios, 200 mensajes, nombres larguísimos) a 320, 480 y 1200 px. */
export const Responsive: Story = {
  parameters: { maxWidth: "none" },
  render: () => {
    const many: CnChatThreadMessage[] = Array.from({ length: 200 }, (_, i) => ({
      id: `x${i}`,
      authorId: i % 3 === 0 ? "yo" : "largo",
      content:
        i % 5 === 0
          ? `${LONG} ${LONG}`
          : i % 7 === 0
            ? "SinEspaciosSinEspaciosSinEspaciosSinEspaciosSinEspacios"
            : `Mensaje ${i + 1}`,
      time: new Date(2026, 10, 20 + Math.floor(i / 40), 9, i % 60),
    }));
    return (
      <Box sx={{ display: "grid", gap: "24px" }}>
        {[320, 480, 1200].map((width) => (
          <Box key={width} data-stress-width={width} sx={{ width }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {width}px
            </Typography>
            <CnChatThread
              messages={many}
              participants={{ yo: { name: "Yo" }, largo: { name: LONG } }}
              currentUserId="yo"
              now={CHAT_NOW}
              typing={[LONG, "Lucía", "Andrés"]}
              onSend={() => undefined}
              height={420}
            />
          </Box>
        ))}
      </Box>
    );
  },
};

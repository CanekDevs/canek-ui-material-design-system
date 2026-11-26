import type { CnChatAuthor } from "../CnChatMessage";
import type { CnChatThreadMessage } from "./CnChatThread";

/** Conversación de ejemplo de un CRM (historias y pruebas de `CnChatThread`). */
export const CHAT_NOW = new Date(2026, 10, 26, 11, 0);

export const CHAT_PARTICIPANTS: Record<string, CnChatAuthor> = {
  lucia: { name: "Lucía Méndez" },
  yo: { name: "Andrés Núñez" },
  bot: { name: "Asistente de ventas" },
};

const at = (dayOffset: number, h: number, m: number) => new Date(2026, 10, 26 + dayOffset, h, m);

export const CHAT_MESSAGES: CnChatThreadMessage[] = [
  {
    id: "s1",
    content: "Lucía Méndez abrió la conversación desde el portal de clientes",
    time: at(-1, 17, 2),
    variant: "system",
  },
  {
    id: "m1",
    authorId: "lucia",
    content: "Hola, ¿me confirmas el precio del lote de 200 piezas?",
    time: at(-1, 17, 3),
  },
  { id: "m2", authorId: "lucia", content: "Lo necesitamos para el viernes.", time: at(-1, 17, 4) },
  {
    id: "m3",
    authorId: "yo",
    content: "Hola Lucía. Lo reviso con almacén y te confirmo mañana temprano.",
    time: at(-1, 17, 20),
    status: "read",
  },
  {
    id: "m4",
    authorId: "yo",
    content: "El lote queda en $48,600 con IVA. Te mando la cotización.",
    time: at(0, 9, 12),
    status: "read",
  },
  {
    id: "m5",
    authorId: "yo",
    content: "",
    time: at(0, 9, 13),
    status: "delivered",
    attachments: [{ id: "a1", name: "Cotización-2026-0142.pdf", size: 248_000, url: "#" }],
  },
  {
    id: "m6",
    authorId: "lucia",
    content: "Perfecto, la paso a compras. ¿El flete va incluido?",
    time: at(0, 10, 41),
  },
  {
    id: "m7",
    authorId: "yo",
    content: "Sí, a Monterrey va incluido.",
    time: at(0, 10, 44),
    status: "error",
  },
];

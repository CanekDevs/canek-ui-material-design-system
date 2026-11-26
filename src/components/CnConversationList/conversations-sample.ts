import type { CnConversation } from "./CnConversationList";

/** Conversaciones de ejemplo de un CRM (historias y pruebas de `CnConversationList`). */
export const CONVERSATIONS_NOW = new Date(2026, 10, 26, 11, 0);

const at = (dayOffset: number, h: number, m = 0) => new Date(2026, 10, 26 + dayOffset, h, m);

export const CRM_CONVERSATIONS: CnConversation[] = [
  {
    id: "c1",
    title: "Lucía Méndez · Grupo Bajío",
    preview: "Perfecto, la paso a compras. ¿El flete va incluido?",
    avatar: { name: "Lucía Méndez" },
    time: at(0, 10, 41),
    unread: 2,
  },
  {
    id: "c2",
    title: "Ferremex del Norte",
    preview: "Tú: Te mando la cotización actualizada.",
    time: at(0, 9, 5),
    pinned: true,
  },
  {
    id: "c3",
    title: "Equipo de ventas Norte",
    preview: "Mario: ¿Quién toma la visita del jueves?",
    time: at(-1, 18, 30),
    muted: true,
    unread: 14,
  },
  {
    id: "c4",
    title: "Andrés Núñez",
    preview: "Gracias, quedo atento.",
    avatar: { name: "Andrés Núñez" },
    time: at(-1, 12, 10),
  },
  {
    id: "c5",
    title: "Distribuidora Occidente",
    preview: "Tú: ¿Pudieron revisar el contrato?",
    time: at(-3, 16, 0),
  },
  {
    id: "c6",
    title: "Soporte · Pedido 2026-0142",
    preview: "El pedido salió del almacén.",
    time: at(-12, 9, 0),
  },
];

import type { CnCatalogEntry } from "../types";

/** Interfaces de IA: chat, agentes y herramientas. */
export const CATALOG_AI: CnCatalogEntry[] = [
  {
    name: "CnChatMessage",
    category: "ia",
    domains: ["general", "crm", "ia"],
    status: "beta",
    summary:
      "Mensaje de chat: burbuja con autor, hora, estado de envío, adjuntos y acciones, o aviso centrado del sistema.",
    purpose:
      'Mostrar un mensaje de una conversación con un cliente, un equipo o un asistente: burbuja propia a la derecha y ajena a la izquierda con avatar y nombre, hora con la fecha completa al pasar el cursor, estado de envío (enviando, enviado, entregado, leído, con error y «Reintentar»), adjuntos descargables con tamaño, menú de acciones (responder, copiar, borrar), modo `grouped` para mensajes seguidos del mismo autor y `variant="system"` para avisos como «Lucía se unió». Conserva los saltos de línea y parte palabras larguísimas.',
    whenNot:
      "Para el historial de un registro (llamadas, correos, cambios) usa `CnTimeline`; para un aviso fijo en la página usa `CnAlert`; para una conversación completa con días, agrupación y redactor usa `CnChatThread`, que ya lo usa.",
    neighbors:
      "Usa `CnAvatar` e `CnIcon`. `CnChatThread` lo compone y decide `own` y `grouped`; `CnConversationList` lista las conversaciones donde vive.",
    related: ["CnChatMessageSkeleton", "formatChatTime"],
  },
  {
    name: "CnChatThread",
    category: "ia",
    domains: ["general", "crm", "ia"],
    status: "beta",
    summary:
      "Hilo de conversación: mensajes por día, agrupados por autor, anclado al final, con mensajes anteriores, «escribiendo» y redactor.",
    purpose:
      'Mostrar y continuar una conversación (chat con clientes, mensajes internos, soporte o un asistente): separadores «Hoy», «Ayer» o fecha, mensajes seguidos del mismo autor agrupados dentro de `groupWindowMs`, se queda al final cuando llegan mensajes y, si estabas leyendo más arriba, muestra «N mensajes nuevos» en vez de moverte; carga mensajes anteriores conservando la posición, indica quién está escribiendo y trae un redactor (Intro envía, Mayús + Intro hace salto de línea) o acepta uno propio. Es un `role="log"` que anuncia los mensajes nuevos.',
    whenNot:
      "Para el historial de actividades de un registro usa `CnTimeline`; para comentarios con menciones sobre un registro usa `CnTimeline` con su composición de comentarios; para elegir entre conversaciones usa `CnConversationList` junto al hilo.",
    neighbors:
      "Compone `CnChatMessage` (un mensaje por elemento) e `CnIcon`. Va junto a `CnConversationList` en una vista de bandeja.",
    related: ["CnChatThreadSkeleton"],
  },
  {
    name: "CnConversationList",
    category: "ia",
    domains: ["general", "crm", "ia"],
    status: "beta",
    summary:
      "Lista de conversaciones agrupada por fecha, con búsqueda, no leídos, fijar, renombrar y borrar.",
    purpose:
      "Elegir una conversación en una bandeja de chats, tickets o hilos con un asistente: grupos «Fijadas», «Hoy», «Ayer», «Últimos 7 días» y «Anteriores» (o una sola lista), búsqueda sin acentos en título y último mensaje, contador de no leídos que se anuncia, silenciadas, la actual con `aria-current`, menú por conversación para fijar, renombrar en la misma fila (también con F2; Intro guarda y Escape cancela) y borrar, y teclado con flechas, Inicio y Fin.",
    whenNot:
      "Para una lista genérica de elementos seleccionables usa `CnList`; para notificaciones con leído y no leído usa `CnNotificationCenter`; para la navegación de la aplicación usa la navegación lateral del layout.",
    neighbors:
      "Usa `CnAvatar` e `CnIcon` y la normalización de búsqueda de los campos de selección. Se coloca junto a `CnChatThread`, que muestra la conversación elegida.",
    related: ["CnConversationListSkeleton", "conversationBucket"],
  },
];

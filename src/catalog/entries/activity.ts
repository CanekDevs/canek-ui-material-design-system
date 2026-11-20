import type { CnCatalogEntry } from "../types";

/** Actividad: historial y notificaciones. */
export const CATALOG_ACTIVITY: CnCatalogEntry[] = [
  {
    name: "CnTimeline",
    category: "datos",
    domains: ["general", "erp", "crm", "ecommerce", "rrhh", "pagos"],
    status: "beta",
    summary:
      "Línea de tiempo para historiales de actividad, bitácoras de auditoría y seguimiento de procesos.",
    purpose:
      "Mostrar eventos ordenados en el tiempo con marcador (ícono, avatar o punto con tono), autor, descripción plegable, metadatos, etiquetas y acciones. Resuelve la bitácora de auditoría (cambios campo por campo antes → después, búsqueda, filtros por tipo/autor/tono y exportación a CSV o JSON), las conversaciones sobre un registro (comentarios en burbuja con respuesta), el seguimiento de pedidos o trámites (estados `completed`/`current`/`pending`/`error`, barra de avance con porcentaje y fecha estimada) y el enlace profundo a un evento concreto (`highlightId`). Los tiempos relativos se actualizan solos, la agrupación por día admite encabezados fijos, hay navegación con flechas, versión para imprimir, adjuntos como tarjetas de archivo y orientación vertical (izquierda, derecha, alterna) u horizontal que pasa a vertical en contenedores angostos.",
    whenNot:
      "Para una lista sin dimensión temporal, que el usuario selecciona u ordena, usa `CnList`; para registros tabulares con columnas, orden y paginado del servidor usa `CnDataTable`; para avisos con estado leído/no leído usa `CnNotificationCenter`; para eventos sobre un calendario usa `CnEventCalendar`; para los pasos de captura de un formulario usa `CnForm`.",
    neighbors:
      "Comparte el formato de tiempo con `CnList` y sus utilidades de fecha con `CnNotificationCenter`. Los adjuntos en tarjeta son `CnDocCard`. Suele vivir dentro de `CnDrawer` (detalle de un registro) o `CnSectionCard`.",
    related: ["CnTimelineSkeleton"],
  },
  {
    name: "CnNotificationCenter",
    category: "retroalimentacion",
    domains: ["general", "erp", "crm", "ecommerce", "pagos", "rrhh", "reservas"],
    status: "beta",
    summary:
      "Bandeja de notificaciones de la aplicación: campana con contador y panel con pestañas, grupos y acciones.",
    purpose:
      'Reunir los avisos asíncronos de la aplicación (menciones, aprobaciones, procesos terminados, alertas del sistema) con estado leído/no leído. Incluye pestañas, búsqueda, agrupación por día, origen o categoría con urgentes fijas arriba y separador "Nuevas", selección en lote (marcar, descartar), posponer, silenciar orígenes, contenido enriquecido (imagen, barra de avance de procesos y botones de acción con carga), enlaces profundos, carga infinita, tiempo real con anuncio a lectores de pantalla, vista previa flotante, avisos del navegador, "No molestar", sonido y vibración opcionales, estado de conexión, preferencias integradas por categoría y atajo de teclado. Funciona como campana (popover en escritorio, pantalla completa en móvil) o en línea para la página "Ver todas".',
    whenNot:
      "Para confirmar una acción recién hecha usa `CnToast`; para un mensaje fijo dentro de la página usa `CnAlert`; para un historial de auditoría sin estado de lectura usa `CnTimeline`; para una lista genérica de registros usa `CnList`.",
    neighbors:
      "La lista es un `CnList` (no leídas, acciones, grupos con encabezado fijo, selección en lote, carga infinita). Usa `CnTabs`, `CnBadge`, el encabezado de `CnDialog` y `CnDrawer` en móvil; las fechas vienen de las utilidades de `CnTimeline`.",
    related: ["CnNotificationCenterSkeleton", "CnNotificationPreview"],
  },
];

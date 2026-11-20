import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import type { CnTone } from "../../utils/tones";
import type { CnChipColor } from "../CnChip";
import type { CnDateInput } from "./timeline-utils";

export type CnTimelineOrientation = "vertical" | "horizontal";
export type CnTimelineAlign = "left" | "right" | "alternate";
/** Estados de seguimiento (pedidos, trámites, aprobaciones). */
export type CnTimelineStatus = "completed" | "current" | "pending" | "error";
/**
 * - `auto`: relativo ("hace 5 min") en la última semana, absoluto después.
 * - `relative` / `absolute` / `time` (solo hora, útil con `groupByDay`).
 * La fecha completa siempre queda en el `title` y en `<time dateTime>`.
 */
export type CnTimelineTimeFormat = "auto" | "relative" | "absolute" | "time";
export type CnTimelineSize = "sm" | "md";
/** `event`: evento normal; `comment`: el texto va en una burbuja y admite respuesta. */
export type CnTimelineItemKind = "event" | "comment";
export type CnTimelineExportFormat = "csv" | "json";

export type CnTimelineAttachment = {
  id?: string;
  name: string;
  href?: string;
  /** Texto auxiliar ("1.2 MB"). */
  size?: string;
  /** Tamaño en bytes (para la tarjeta de `attachmentsLayout="cards"`). */
  bytes?: number;
  /** Tipo MIME (ícono y miniatura en tarjetas). */
  mime?: string;
  /** Miniatura (imágenes, PDF renderizado). */
  thumbnailUrl?: string;
  icon?: string;
  onClick?: () => void;
};

export type CnTimelineAction = {
  id?: string;
  label: string;
  icon?: string;
  href?: string;
  onClick?: () => void;
};

/** Cambio de un campo en bitácoras de auditoría ("Monto: $120,000 → $135,500"). */
export type CnTimelineChange = {
  field: ReactNode;
  before?: ReactNode;
  after?: ReactNode;
};

export type CnTimelineTag = string | { label: string; color?: CnChipColor; icon?: string };

export type CnTimelineItem = {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Contenido libre bajo la descripción (tarjeta, imagen…). */
  content?: ReactNode;
  time?: CnDateInput;
  /** Texto de tiempo propio (sustituye al formateado). */
  timeLabel?: ReactNode;
  icon?: string;
  /** Avatar en el marcador: datos para `CnAvatar` o un nodo propio. */
  avatar?: { name?: string; src?: string } | ReactNode;
  tone?: CnTone;
  status?: CnTimelineStatus;
  /** Autor del evento ("por Ana López"). */
  actor?: ReactNode;
  /** Categoría del evento ("Pago", "Cambio", "Acceso"): filtros y exportación. */
  type?: string;
  kind?: CnTimelineItemKind;
  tags?: readonly CnTimelineTag[];
  metadata?: readonly { label: ReactNode; value: ReactNode }[];
  /** Cambios campo por campo (antes → después). */
  changes?: readonly CnTimelineChange[];
  attachments?: readonly CnTimelineAttachment[];
  actions?: readonly CnTimelineAction[];
  /** Texto extra para la búsqueda (cuando el contenido es JSX). */
  searchText?: string;
};

/** Filtro de la barra: un chip que se puede activar (varios activos = cualquiera). */
export type CnTimelineFilter = {
  id: string;
  label: string;
  icon?: string;
  color?: CnChipColor;
  match: (item: CnTimelineItem) => boolean;
};

export type CnTimelineProps = {
  items: readonly CnTimelineItem[];
  orientation?: CnTimelineOrientation;
  align?: CnTimelineAlign;
  size?: CnTimelineSize;
  /** Agrupa por día con encabezados "Hoy", "Ayer", fecha (solo vertical). */
  groupByDay?: boolean;
  /** Encabezados de día fijos al desplazar (con `groupByDay`). */
  stickyHeaders?: boolean;
  /** Distancia (px) desde arriba para los encabezados fijos (p. ej. bajo una barra). */
  stickyOffset?: number;
  formatGroupLabel?: (date: Date, now: Date) => string;
  timeFormat?: CnTimelineTimeFormat;
  /** Fecha de referencia para los relativos (pruebas, zonas). Desactiva la actualización. */
  now?: Date;
  /** Cada cuántos ms se refrescan los tiempos relativos (`0` lo desactiva). */
  liveInterval?: number;
  /** Líneas visibles de la descripción antes de "Ver más" (0 = sin límite). */
  descriptionLines?: number;
  /** Muestra N elementos y un botón "Ver más" para el resto (paginado local). */
  initialVisible?: number;
  /** Paginado del servidor: muestra "Ver más" y llama `onLoadMore`. */
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  loadMoreLabel?: string;
  /** Línea discontinua entre elementos pendientes (por defecto) o siempre. */
  connector?: "solid" | "dashed";
  /**
   * Por debajo de este ancho (px) del contenedor, horizontal y alterno pasan a
   * vertical izquierdo. `0` lo desactiva.
   */
  collapseBelow?: number;
  onItemClick?: (item: CnTimelineItem) => void;

  // Barra de herramientas
  /** Caja de búsqueda sobre título, descripción, autor, etiquetas y cambios. */
  searchable?: boolean;
  searchPlaceholder?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /** Chips de filtro (usa `timelineFiltersBy` para generarlos por tipo, autor o tono). */
  filters?: readonly CnTimelineFilter[];
  defaultActiveFilters?: readonly string[];
  onFiltersChange?: (ids: string[]) => void;
  /** Botón "Expandir todo / Contraer todo" para las descripciones largas. */
  expandToggle?: boolean;
  /** Menú de exportación (CSV y/o JSON) de los elementos filtrados. */
  exportable?: boolean | readonly CnTimelineExportFormat[];
  /** Nombre del archivo exportado (sin extensión). */
  exportFileName?: string;
  /** Sustituye la descarga: recibe el formato y los elementos filtrados. */
  onExport?: (format: CnTimelineExportFormat, items: CnTimelineItem[]) => void;
  /** Contenido propio al final de la barra. */
  toolbarExtra?: ReactNode;

  // Seguimiento
  /** Barra de avance (pasos completados / total) para seguimiento con `status`. */
  showProgress?: boolean;
  /** Fecha o texto estimado de término ("Entrega estimada: mañana"). */
  eta?: ReactNode;

  // Enlace profundo
  /** Resalta el elemento y lo desplaza a la vista (p. ej. desde `#evento-12`). */
  highlightId?: string | null;

  // Comentarios
  /** Muestra "Responder" en los elementos `kind: "comment"`. */
  onReply?: (item: CnTimelineItem, text: string) => void | Promise<void>;
  /** Tarjetas de archivo (`CnDocCard`) o chips compactos para los adjuntos. */
  attachmentsLayout?: "chips" | "cards";

  // Estados
  skeleton?: boolean;
  skeletonCount?: number;
  error?: ReactNode;
  onRetry?: () => void;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  emptyIcon?: string;

  ariaLabel?: string;
  /** Nivel de encabezado de los grupos por día. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  sx?: SxProps<Theme>;
  className?: string;
};

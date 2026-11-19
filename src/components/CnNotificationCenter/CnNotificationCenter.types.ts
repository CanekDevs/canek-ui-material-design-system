import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import type { CnTone } from "../../utils/tones";
import type { CnDateInput } from "../CnTimeline/timeline-utils";

/** Acción propia de una notificación (en el menú ⋮ o en línea). */
export type CnNotificationAction = {
  id: string;
  label: string;
  icon?: string;
  /** Botón visible en la fila en lugar del menú. */
  inline?: boolean;
  onClick: (notification: CnNotification) => void;
};

export type CnNotification = {
  id: string;
  title: ReactNode;
  message?: ReactNode;
  /** Fecha de creación (agrupa por día y muestra "hace 5 min"). */
  time?: CnDateInput;
  read?: boolean;
  /** Categoría para pestañas propias (`tabs[].filter`). */
  category?: string;
  /** Te mencionaron (pestaña "Menciones"). */
  mention?: boolean;
  tone?: CnTone;
  /** Ícono del registro de `CnIcon` (con el color del tono). */
  icon?: string;
  /** Avatar de quien la generó (sustituye al ícono). */
  avatar?: { name?: string; src?: string };
  /** Origen o módulo ("Facturación", "Nómina"). */
  source?: ReactNode;
  href?: string;
  actions?: readonly CnNotificationAction[];
};

export type CnNotificationTab = {
  id: string;
  label: string;
  icon?: string;
  /** Sin filtro, la pestaña muestra todas. */
  filter?: (notification: CnNotification) => boolean;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
};

/**
 * - `auto`: popover en escritorio y panel a pantalla completa en móvil.
 * - `popover` / `drawer`: fuerza uno.
 */
export type CnNotificationPanel = "auto" | "popover" | "drawer";

export type CnNotificationCenterProps = {
  notifications: readonly CnNotification[];
  /** Total sin leer del servidor (si la lista está paginada). */
  unreadCount?: number;

  /** `button`: campana con panel; `inline`: el panel dentro de la página. */
  mode?: "button" | "inline";
  panel?: CnNotificationPanel;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  tabs?: readonly CnNotificationTab[] | false;
  activeTab?: string;
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  /** Agrupa por día ("Hoy", "Ayer", fecha). */
  groupByDay?: boolean;

  onNotificationClick?: (notification: CnNotification) => void;
  /** Marca como leída al abrirla. */
  markReadOnClick?: boolean;
  onMarkRead?: (ids: string[], read: boolean) => void;
  onMarkAllRead?: () => void;
  onDismiss?: (notification: CnNotification) => void;
  /** Cierra el panel al abrir una notificación (por defecto en modo `button`). */
  closeOnClick?: boolean;

  // Carga
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  /** Lista en carga (skeleton). */
  loading?: boolean;
  error?: ReactNode;
  onRetry?: () => void;
  /** Skeleton del componente (campana o panel en línea). */
  skeleton?: boolean;

  // Tiempo real
  /** Se llama con las notificaciones nuevas sin leer que llegan por `notifications`. */
  onNewNotifications?: (items: CnNotification[]) => void;
  /** Anuncia las nuevas a lectores de pantalla. */
  announceNew?: boolean;
  /** Muestra una vista previa flotante junto a la campana al llegar nuevas. */
  preview?: boolean;
  /** Milisegundos entre vistas previas (se pausa al pasar el cursor). */
  previewRotateMs?: number;
  /** Avisos del sistema operativo cuando la pestaña está oculta (requiere permiso). */
  browserNotifications?: boolean;

  // Textos y extras
  title?: string;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  onSettingsClick?: () => void;
  settingsHref?: string;
  onViewAll?: () => void;
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Contenido extra al pie del panel (p. ej. activar avisos del navegador). */
  footerExtra?: ReactNode;
  maxBadge?: number;
  bellIcon?: string;
  /** Ancho del popover (px). */
  panelWidth?: number;
  /** Alto máximo de la lista (px). */
  listMaxHeight?: number;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  className?: string;
};

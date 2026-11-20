import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import type { CnTone } from "../../utils/tones";
import type { CnButtonColor } from "../CnButton";
import type { CnDateInput } from "../CnTimeline/timeline-utils";

/** Acción propia de una notificación (en el menú ⋮, como ícono o como botón). */
export type CnNotificationAction = {
  id: string;
  label: string;
  icon?: string;
  /** Botón de ícono visible en la fila en lugar del menú. */
  inline?: boolean;
  /**
   * `button`: botón con texto bajo el mensaje ("Aprobar", "Rechazar"). Si
   * `onClick` devuelve una promesa, el botón muestra carga hasta que termine.
   */
  appearance?: "menu" | "button";
  variant?: "contained" | "outlined" | "text";
  color?: CnButtonColor;
  onClick: (notification: CnNotification) => void | Promise<void>;
};

/** `urgent` se fija arriba mientras no se lea; `high` resalta la fila. */
export type CnNotificationPriority = "urgent" | "high" | "normal" | "low";

/** Avance de un proceso (exportación, importación, timbrado masivo). */
export type CnNotificationProgress = {
  /** 0–100; sin valor la barra es indeterminada. */
  value?: number;
  label?: ReactNode;
  status?: "running" | "done" | "error";
};

export type CnNotification = {
  id: string;
  title: ReactNode;
  message?: ReactNode;
  /** Fecha de creación (agrupa por día y muestra "hace 5 min"). */
  time?: CnDateInput;
  read?: boolean;
  /** Categoría para pestañas propias, agrupación y preferencias. */
  category?: string;
  /** Te mencionaron (pestaña "Menciones"). */
  mention?: boolean;
  priority?: CnNotificationPriority;
  tone?: CnTone;
  /** Ícono del registro de `CnIcon` (con el color del tono). */
  icon?: string;
  /** Avatar de quien la generó (sustituye al ícono). */
  avatar?: { name?: string; src?: string };
  /** Origen o módulo ("Facturación", "Nómina"). */
  source?: ReactNode;
  /** Clave estable del origen (silenciar y agrupar); por defecto, el texto de `source`. */
  sourceId?: string;
  /** Vista previa de imagen bajo el mensaje. */
  image?: { src: string; alt?: string };
  /** Barra de avance para procesos en segundo plano. */
  progress?: number | CnNotificationProgress;
  /** Oculta la notificación hasta esta fecha (posponer). */
  snoozedUntil?: CnDateInput;
  /** Enlace profundo: el título se vuelve un enlace a esta ruta. */
  href?: string;
  actions?: readonly CnNotificationAction[];
};

/** Agrupación de la lista. */
export type CnNotificationGroupBy = "day" | "source" | "category" | "none";

export type CnNotificationConnection = "online" | "offline" | "reconnecting";

export type CnNotificationSnoozeOption = {
  id: string;
  label: string;
  until: (now: Date) => Date;
};

export type CnNotificationCategorySetting = {
  id: string;
  label: string;
  description?: ReactNode;
  enabled: boolean;
};

/**
 * Vista de preferencias integrada (engrane del encabezado): no molestar,
 * sonido, vibración, avisos del escritorio, categorías y orígenes silenciados.
 */
export type CnNotificationSettings = {
  categories?: readonly CnNotificationCategorySetting[];
  onCategoryChange?: (id: string, enabled: boolean) => void;
  /** Muestra el interruptor de sonido (usa `sound` / `onSoundChange` del componente). */
  showSound?: boolean;
  /** Muestra el interruptor de vibración (usa `vibrate` / `onVibrateChange`). */
  showVibrate?: boolean;
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
  /** Agrupa por día ("Hoy", "Ayer", fecha). Equivale a `groupBy="day"`. */
  groupByDay?: boolean;
  /** Agrupación: por día, por origen, por categoría o sin grupos (tiene prioridad sobre `groupByDay`). */
  groupBy?: CnNotificationGroupBy;
  /** Los grupos se pueden plegar. */
  collapsibleGroups?: boolean;
  /** Fija arriba las urgentes sin leer en el grupo "Urgentes". */
  pinUrgent?: boolean;
  /** Última vez que el usuario vio el panel: lo posterior va en el grupo "Nuevas". */
  lastSeenAt?: CnDateInput;
  /** Caja de búsqueda en el panel. */
  searchable?: boolean;
  /** Botón "Seleccionar" con acciones en lote (marcar, descartar). */
  selectable?: boolean;
  /** Descarta varias a la vez (si no, llama `onDismiss` por cada una). */
  onDismissMany?: (notifications: CnNotification[]) => void;

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
  /** Sonido breve al llegar nuevas (opcional; nunca en "No molestar"). */
  sound?: boolean;
  onSoundChange?: (sound: boolean) => void;
  /** Vibración breve en móviles al llegar nuevas (opcional). */
  vibrate?: boolean;
  onVibrateChange?: (vibrate: boolean) => void;
  /** "No molestar": sin vista previa, sonido, vibración ni avisos del navegador. */
  doNotDisturb?: boolean;
  defaultDoNotDisturb?: boolean;
  onDoNotDisturbChange?: (enabled: boolean) => void;
  /** Orígenes silenciados (`sourceId`): siguen en la lista, pero sin alertas. */
  mutedSources?: readonly string[];
  /** Agrega "Silenciar origen" al menú de cada notificación. */
  onMuteSource?: (sourceId: string, muted: boolean) => void;
  /** Agrega "Posponer" al menú de cada notificación. */
  onSnooze?: (notification: CnNotification, until: Date) => void;
  snoozeOptions?: readonly CnNotificationSnoozeOption[];
  /** Estado de la conexión en tiempo real (aviso en el panel y en la campana). */
  connection?: CnNotificationConnection;
  onReconnect?: () => void;
  /** Atajo de teclado para abrir/cerrar el panel (p. ej. `"alt+n"`). */
  hotkey?: string;
  /** Vista de preferencias integrada (el engrane la abre dentro del panel). */
  settings?: CnNotificationSettings;

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

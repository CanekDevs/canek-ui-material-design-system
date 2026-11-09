import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import type { CnAvatarColor, CnAvatarStatus, CnAvatarVariant } from "../CnAvatar";
import type { CnButtonColor } from "../CnButton";
import type { CnChipColor, CnChipVariant } from "../CnChip";

export type CnListVariant = "plain" | "divided" | "card" | "inset";
export type CnListDensity = "compact" | "comfortable" | "spacious";
export type CnListSize = "sm" | "md" | "lg";
export type CnListSurface = "none" | "outlined" | "elevated" | "filled";
export type CnListSelectionMode = "none" | "single" | "multiple";
export type CnListTone =
  "default" | "primary" | "success" | "warning" | "error" | "info" | "accent" | "neutral";
export type CnListColor =
  "primary" | "secondary" | "success" | "warning" | "error" | "info" | "accent" | "neutral";

/** Avatar del elemento: datos para `CnAvatar` o un nodo propio. */
export type CnListAvatar =
  | {
      src?: string;
      name?: string;
      initials?: string;
      icon?: string;
      color?: CnAvatarColor;
      status?: CnAvatarStatus;
      variant?: CnAvatarVariant;
    }
  | ReactNode;

/** Ícono en recuadro (como el de `CnCard`): nombre del registro o configuración. */
export type CnListIcon = string | { name: string; color?: CnListColor | string; bgColor?: string };

/** Estado como chip (`"Pagado"` o `{ label, color }`). */
export type CnListStatus =
  string | { label: ReactNode; color?: CnChipColor; variant?: CnChipVariant; icon?: string };

/** Insignia: número (contador), `"dot"` o configuración. */
export type CnListBadge =
  | number
  | "dot"
  | { content?: ReactNode; color?: CnListColor; variant?: "count" | "dot"; max?: number };

/** Acción de un elemento: en línea (botón de ícono) o en el menú (⋮). */
export type CnListAction<T = CnListItemData> = {
  id: string;
  label: string;
  icon?: string;
  color?: "default" | "primary" | "success" | "warning" | "error";
  /** Botón visible en la fila en lugar de ir al menú. */
  inline?: boolean;
  /** Separador antes de esta acción (solo en el menú). */
  divider?: boolean;
  visible?: (item: T) => boolean;
  disabled?: (item: T) => boolean;
  tooltip?: string;
  onClick: (item: T) => void;
};

/** Acción al deslizar en pantallas táctiles. */
export type CnListSwipeAction<T = CnListItemData> = {
  label: string;
  icon?: string;
  color?: CnListColor;
  onTrigger: (item: T) => void;
};

/** Forma "natural" de un elemento de la lista. */
export type CnListItemData = {
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Tercera línea (se recorta a `descriptionLines`). */
  description?: ReactNode;
  avatar?: CnListAvatar;
  icon?: CnListIcon;
  /** Contenido inicial propio (sustituye a ícono/avatar). */
  leading?: ReactNode;
  /** Texto auxiliar a la derecha (ej. "12 MB"). */
  meta?: ReactNode;
  /** Fecha: se muestra relativa ("hace 5 min"). */
  timestamp?: Date | string | number;
  status?: CnListStatus;
  badge?: CnListBadge;
  /** Contenido final propio (después de meta/estado/insignia). */
  trailing?: ReactNode;
  /** Muestra un chevron al final. */
  chevron?: boolean;
  tone?: CnListTone;
  /** No leído: título en negritas, punto y fondo sutil. */
  unread?: boolean;
  disabled?: boolean;
  href?: string;
  target?: "_blank" | "_self";
  onClick?: () => void;
  actions?: CnListAction<CnListItemData>[];
  children?: CnListItemData[];
  /** Grupo (se usa con `groupBy` por defecto). */
  group?: string;
  /** Texto extra para la búsqueda. */
  searchText?: string;
};

export type CnListSortOption<T = CnListItemData> = {
  id: string;
  label: string;
  icon?: string;
  /** Sin `compare` el orden es del servidor (solo se emite `onSortChange`). */
  compare?: (a: T, b: T) => number;
};

export type CnListBulkAction<T = CnListItemData> = {
  id: string;
  label: string;
  icon?: string;
  color?: CnButtonColor;
  onClick: (items: T[], ids: string[]) => void | Promise<void>;
};

export type CnListSection<T = CnListItemData> = {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  items: readonly T[];
  /** Acción a la derecha del encabezado. */
  action?: ReactNode;
};

/** Accesores para mapear datos arbitrarios a la forma de un elemento. */
export type CnListAccessors<T> = {
  getId?: (item: T, index: number) => string;
  getTitle?: (item: T) => ReactNode;
  getSubtitle?: (item: T) => ReactNode;
  getDescription?: (item: T) => ReactNode;
  getAvatar?: (item: T) => CnListAvatar | undefined;
  getIcon?: (item: T) => CnListIcon | undefined;
  getLeading?: (item: T) => ReactNode;
  getMeta?: (item: T) => ReactNode;
  getTimestamp?: (item: T) => Date | string | number | undefined;
  getStatus?: (item: T) => CnListStatus | undefined;
  getBadge?: (item: T) => CnListBadge | undefined;
  getTrailing?: (item: T) => ReactNode;
  getTone?: (item: T) => CnListTone | undefined;
  getHref?: (item: T) => string | undefined;
  getChildren?: (item: T) => readonly T[] | undefined;
  getSearchText?: (item: T) => string;
  isItemDisabled?: (item: T) => boolean;
  isItemUnread?: (item: T) => boolean;
};

export type CnListRenderItemState = {
  selected: boolean;
  active: boolean;
  disabled: boolean;
  depth: number;
  expanded: boolean;
  hasChildren: boolean;
  index: number;
  query: string;
};

export type CnListProps<T = CnListItemData> = CnListAccessors<T> & {
  items?: readonly T[];
  /** Secciones explícitas (alternativa a `groupBy`). */
  sections?: readonly CnListSection<T>[];
  /** Render completo de un elemento (la lista sigue dando selección, teclado, etc.). */
  renderItem?: (item: T, state: CnListRenderItemState) => ReactNode;

  // Apariencia
  variant?: CnListVariant;
  density?: CnListDensity;
  size?: CnListSize;
  surface?: CnListSurface;
  /** Separadores: `inset` empieza tras el avatar/ícono. Por defecto según la variante. */
  dividers?: boolean | "inset" | "full";
  /** Rejilla de tarjetas (solo `variant="card"` sin virtualizar). */
  columns?: number;
  descriptionLines?: number;
  /** Acciones de fila: siempre visibles o al pasar el cursor/enfocar. */
  actionsVisibility?: "always" | "hover";
  /** Chevron en todos los elementos con `href`/`onClick`. */
  showChevron?: boolean;

  // Encabezado y pie (como TbList)
  title?: ReactNode;
  description?: ReactNode;
  headerAction?: ReactNode;
  footer?: ReactNode;
  showCount?: boolean;
  countText?: (shown: number, total: number) => ReactNode;

  // Barra de herramientas
  searchable?: boolean;
  search?: string;
  defaultSearch?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  /** La búsqueda la hace el servidor: no se filtra localmente. */
  serverSearch?: boolean;
  filterItem?: (item: T, query: string) => boolean;
  /** Resalta lo buscado en títulos y subtítulos de texto. */
  highlightMatches?: boolean;
  sortOptions?: readonly CnListSortOption<T>[];
  sortId?: string | null;
  defaultSortId?: string | null;
  onSortChange?: (sortId: string | null) => void;
  /** Contenido propio en la barra (filtros, botones…). */
  toolbar?: ReactNode;
  hideToolbar?: boolean;
  bulkActions?: readonly CnListBulkAction<T>[];

  // Selección
  selectionMode?: CnListSelectionMode;
  selectedIds?: readonly string[];
  defaultSelectedIds?: readonly string[];
  onSelectionChange?: (ids: string[], items: T[]) => void;
  /** Casillas al inicio (por defecto en `multiple`). */
  showCheckboxes?: boolean;
  /** Casilla "Seleccionar todo" en la barra (por defecto en `multiple`). */
  selectAll?: boolean;
  /** Clic en la fila selecciona (por defecto `true`). */
  selectOnClick?: boolean;
  /** En árboles, seleccionar un padre selecciona a sus hijos. */
  cascadeSelection?: boolean;

  // Interacción
  onItemClick?: (item: T, index: number) => void;
  /** Elemento activo (resaltado, ej. navegación). */
  activeId?: string | null;
  itemActions?: readonly CnListAction<T>[] | ((item: T) => readonly CnListAction<T>[]);
  swipeActions?: { left?: CnListSwipeAction<T>; right?: CnListSwipeAction<T> };
  /** Arrastrar para reordenar (lista plana, sin búsqueda/orden/grupos/virtualización). */
  reorderable?: boolean;
  onReorder?: (items: T[], from: number, to: number) => void;

  // Grupos
  groupBy?: (item: T) => string | null | undefined;
  getGroupLabel?: (groupKey: string, items: readonly T[]) => ReactNode;
  groupOrder?: readonly string[] | ((a: string, b: string) => number);
  stickyHeaders?: boolean;
  collapsibleGroups?: boolean;
  collapsedGroups?: readonly string[];
  defaultCollapsedGroups?: readonly string[];
  onCollapsedGroupsChange?: (keys: string[]) => void;
  showGroupCount?: boolean;

  // Árbol
  expandedIds?: readonly string[];
  defaultExpandedIds?: readonly string[];
  onExpandedChange?: (ids: string[]) => void;
  /** Sangría por nivel (px). */
  indent?: number;

  // Carga incremental
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  /** `auto` al acercarse al final; `button` con "Cargar más". */
  loadMoreMode?: "auto" | "button";
  loadMoreLabel?: string;

  // Virtualización y alto
  /** `auto` virtualiza a partir de `virtualizeThreshold` filas. */
  virtualize?: boolean | "auto";
  virtualizeThreshold?: number;
  /** Alto estimado de una fila (px); por defecto según densidad/tamaño. */
  estimatedItemHeight?: number;
  overscan?: number;
  height?: number | string;
  maxHeight?: number | string;
  minHeight?: number | string;
  /** Alto para mostrar N filas (como TbList). */
  visibleItems?: number;

  // Estados
  loading?: boolean;
  /** Muestra el skeleton de la lista en lugar de la lista. */
  skeleton?: boolean;
  skeletonCount?: number;
  error?: ReactNode;
  onRetry?: () => void;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  emptyIcon?: string;
  emptyAction?: ReactNode;

  ariaLabel?: string;
  ariaLabelledBy?: string;
  className?: string;
  sx?: SxProps<Theme>;
};

import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import LinearProgress from "@mui/material/LinearProgress";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import type { SxProps, Theme } from "@mui/material/styles";
import type { CSSProperties, FocusEvent, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { moveArrayItem, useSortableList } from "../../utils/use-sortable-list";
import { CnButton } from "../CnButton";
import { CnEmptyState } from "../CnEmptyState";
import { CnIcon } from "../CnIcon";
import type {
  CnListAction,
  CnListItemData,
  CnListProps,
  CnListRenderItemState,
  CnListSurface,
  CnListTone,
} from "./CnList.types";
import type { CnListItemAction } from "./CnListItem";
import { CnListItem, CnListSubheader } from "./CnListItem";
import type { CnListSkeletonProps } from "./CnListSkeleton";
import { CnListSkeleton } from "./CnListSkeleton";
import { estimateRowHeight, nodeText, normalizeListText } from "./list-utils";
import { useListVirtualizer } from "./use-list-virtualizer";

// ─── Modelo interno ──────────────────────────────────────────────────────

type Resolved = Omit<CnListItemData, "children" | "actions" | "group">;

type ListNode<T> = {
  id: string;
  raw: T;
  data: Resolved;
  depth: number;
  parentId: string | null;
  children: ListNode<T>[];
  /** Posición en el arreglo original (solo nivel superior). */
  sourceIndex: number;
  group: string | null;
  ownActions?: CnListAction<CnListItemData>[];
};

type HeaderRow = {
  kind: "header";
  key: string;
  groupKey: string;
  label: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  count: number;
  collapsed: boolean;
};
type ItemRow<T> = {
  kind: "item";
  key: string;
  node: ListNode<T>;
  expandable: boolean;
  expanded: boolean;
  posInSet: number;
  setSize: number;
  /** Índice entre los elementos de nivel superior (para reordenar). */
  topIndex: number;
};
type LoadingRow = { kind: "loading"; key: string };
type MoreRow = { kind: "more"; key: string };
type Row<T> = HeaderRow | ItemRow<T> | LoadingRow | MoreRow;

const EMPTY: readonly never[] = [];
const HEADER_HEIGHT = 35;

const useControllable = <V,>(
  controlled: V | undefined,
  initial: V,
  onChange?: (value: V) => void,
): [V, (next: V) => void] => {
  const [inner, setInner] = useState<V>(initial);
  const value = controlled !== undefined ? controlled : inner;
  const set = useCallback(
    (next: V) => {
      if (controlled === undefined) setInner(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );
  return [value, set];
};

const surfaceSx = (surface: CnListSurface) => {
  switch (surface) {
    case "outlined":
      return {
        border: "1px solid var(--cn-color-border, #dde0e4)",
        borderRadius: "var(--cn-radius-lg, 12px)",
        backgroundColor: "var(--cn-color-surface, #ffffff)",
        overflow: "hidden",
      };
    case "elevated":
      return {
        borderRadius: "var(--cn-radius-lg, 12px)",
        backgroundColor: "var(--cn-color-surface, #ffffff)",
        boxShadow: "var(--cn-shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.06))",
        overflow: "hidden",
      };
    case "filled":
      return {
        borderRadius: "var(--cn-radius-lg, 12px)",
        backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
        overflow: "hidden",
      };
    default:
      return {};
  }
};

const toCss = (value: number | string | undefined) =>
  typeof value === "number" ? `${value}px` : value;

const visuallyHidden: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
};

/**
 * Lista de Canek: elementos con avatar/ícono/meta/estado, variantes y
 * densidades, selección (simple o múltiple con teclado), grupos fijos y
 * plegables, árbol, búsqueda sin acentos, orden, acciones (en línea, menú,
 * deslizar), reordenar, carga incremental y virtualización.
 */
export function CnList<T = CnListItemData>(props: CnListProps<T>) {
  const {
    items = EMPTY as readonly T[],
    sections,
    renderItem,

    variant = "plain",
    density = "comfortable",
    size = "md",
    surface = "none",
    dividers,
    columns,
    descriptionLines = 2,
    actionsVisibility = "always",
    showChevron = false,

    title,
    description,
    headerAction,
    footer,
    showCount = false,
    countText,

    searchable = false,
    search: searchProp,
    defaultSearch = "",
    onSearchChange,
    searchPlaceholder = "Buscar…",
    serverSearch = false,
    filterItem,
    highlightMatches = true,
    sortOptions,
    sortId: sortIdProp,
    defaultSortId = null,
    onSortChange,
    toolbar: toolbarSlot,
    hideToolbar = false,
    bulkActions,

    selectionMode = "none",
    selectedIds: selectedIdsProp,
    defaultSelectedIds = EMPTY,
    onSelectionChange,
    showCheckboxes,
    selectAll,
    selectOnClick = true,
    cascadeSelection = false,

    onItemClick,
    activeId,
    itemActions,
    swipeActions,
    reorderable = false,
    onReorder,

    groupBy,
    getGroupLabel,
    groupOrder,
    stickyHeaders = true,
    collapsibleGroups = false,
    collapsedGroups: collapsedGroupsProp,
    defaultCollapsedGroups = EMPTY,
    onCollapsedGroupsChange,
    showGroupCount = true,

    expandedIds: expandedIdsProp,
    defaultExpandedIds = EMPTY,
    onExpandedChange,
    indent = 20,

    hasMore = false,
    onLoadMore,
    loadingMore = false,
    loadMoreMode = "auto",
    loadMoreLabel = "Cargar más",

    virtualize = "auto",
    virtualizeThreshold = 150,
    estimatedItemHeight,
    overscan = 6,
    height,
    maxHeight,
    minHeight,
    visibleItems,

    loading = false,
    skeleton = false,
    skeletonCount,
    error,
    onRetry,
    emptyTitle = "Aún sin contenido",
    emptyDescription = "No hay elementos para mostrar.",
    emptyIcon = "format_list_bulleted",
    emptyAction,

    ariaLabel,
    ariaLabelledBy,
    className,
    sx,

    getId,
    getTitle,
    getSubtitle,
    getDescription,
    getAvatar,
    getIcon,
    getLeading,
    getMeta,
    getTimestamp,
    getStatus,
    getBadge,
    getTrailing,
    getTone,
    getHref,
    getChildren,
    getSearchText,
    isItemDisabled,
    isItemUnread,
  } = props;

  const baseId = useId();
  const multiple = selectionMode === "multiple";
  const selectable = selectionMode !== "none";
  const checkboxes = showCheckboxes ?? multiple;

  // ─── Estado ──────────────────────────────────────────────────────────
  const [itemsState, setItemsState] = useState({ source: items, local: items });
  if (itemsState.source !== items) setItemsState({ source: items, local: items });
  const localItems = itemsState.local;

  const [query, setQuery] = useControllable(searchProp, defaultSearch, onSearchChange);
  const [sortId, setSortId] = useControllable<string | null>(
    sortIdProp,
    defaultSortId,
    onSortChange,
  );
  const [selectedList, setSelectedList] = useState<readonly string[]>(defaultSelectedIds);
  const selectedIds = selectedIdsProp ?? selectedList;
  const [collapsedList, setCollapsedList] = useControllable<readonly string[]>(
    collapsedGroupsProp,
    defaultCollapsedGroups,
    onCollapsedGroupsChange as ((keys: readonly string[]) => void) | undefined,
  );
  const [expandedList, setExpandedList] = useControllable<readonly string[]>(
    expandedIdsProp,
    defaultExpandedIds,
    onExpandedChange as ((ids: readonly string[]) => void) | undefined,
  );
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const collapsedSet = useMemo(() => new Set(collapsedList), [collapsedList]);
  const expandedSet = useMemo(() => new Set(expandedList), [expandedList]);

  // ─── Normalización ──────────────────────────────────────────────────
  const resolve = useCallback(
    (item: T, id: string): Resolved => {
      const d = item as unknown as Partial<CnListItemData>;
      return {
        id,
        title: getTitle ? getTitle(item) : d.title,
        subtitle: getSubtitle ? getSubtitle(item) : d.subtitle,
        description: getDescription ? getDescription(item) : d.description,
        avatar: getAvatar ? getAvatar(item) : d.avatar,
        icon: getIcon ? getIcon(item) : d.icon,
        leading: getLeading ? getLeading(item) : d.leading,
        meta: getMeta ? getMeta(item) : d.meta,
        timestamp: getTimestamp ? getTimestamp(item) : d.timestamp,
        status: getStatus ? getStatus(item) : d.status,
        badge: getBadge ? getBadge(item) : d.badge,
        trailing: getTrailing ? getTrailing(item) : d.trailing,
        tone: (getTone ? getTone(item) : d.tone) as CnListTone | undefined,
        href: getHref ? getHref(item) : d.href,
        target: d.target,
        chevron: d.chevron,
        unread: isItemUnread ? isItemUnread(item) : d.unread,
        disabled: isItemDisabled ? isItemDisabled(item) : d.disabled,
        onClick: d.onClick,
        searchText: getSearchText ? getSearchText(item) : d.searchText,
      };
    },
    [
      getTitle,
      getSubtitle,
      getDescription,
      getAvatar,
      getIcon,
      getLeading,
      getMeta,
      getTimestamp,
      getStatus,
      getBadge,
      getTrailing,
      getTone,
      getHref,
      getSearchText,
      isItemDisabled,
      isItemUnread,
    ],
  );

  const tree = useMemo(() => {
    const build = (
      list: readonly T[],
      depth: number,
      parentId: string | null,
      group: string | null,
    ): ListNode<T>[] =>
      list.map((item, index) => {
        const d = item as unknown as Partial<CnListItemData>;
        const id =
          getId?.(item, index) ??
          (d.id !== undefined ? String(d.id) : parentId ? `${parentId}.${index}` : String(index));
        const childList = (getChildren ? getChildren(item) : (d.children as T[] | undefined)) ?? [];
        const node: ListNode<T> = {
          id,
          raw: item,
          data: resolve(item, id),
          depth,
          parentId,
          children: [],
          sourceIndex: index,
          group: depth === 0 ? (group ?? (groupBy ? (groupBy(item) ?? "") : null)) : null,
          ownActions: d.actions,
        };
        node.children = build(childList, depth + 1, id, null);
        return node;
      });
    if (sections) {
      return sections.flatMap((section) => build(section.items, 0, null, section.id));
    }
    return build(localItems, 0, null, null);
  }, [localItems, sections, getId, getChildren, groupBy, resolve]);

  const nodeById = useMemo(() => {
    const map = new Map<string, ListNode<T>>();
    const walk = (nodes: ListNode<T>[]) =>
      nodes.forEach((node) => {
        map.set(node.id, node);
        walk(node.children);
      });
    walk(tree);
    return map;
  }, [tree]);

  const hasNested = useMemo(() => tree.some((node) => node.children.length > 0), [tree]);
  const grouped = Boolean(sections || groupBy);

  // ─── Búsqueda y orden ──────────────────────────────────────────────
  const needle = normalizeListText(query);
  const searching = Boolean(needle) && !serverSearch;
  const sortOption = sortOptions?.find((option) => option.id === sortId);
  const sorting = Boolean(sortOption?.compare);

  const textOf = useCallback((node: ListNode<T>) => {
    const d = node.data;
    const status = typeof d.status === "string" ? d.status : nodeText(d.status?.label);
    return normalizeListText(
      [
        nodeText(d.title),
        nodeText(d.subtitle),
        nodeText(d.description),
        nodeText(d.meta),
        status,
        d.searchText ?? "",
      ].join(" "),
    );
  }, []);

  const { visibleTree, autoExpanded } = useMemo(() => {
    const auto = new Set<string>();
    const matches = (node: ListNode<T>) =>
      filterItem ? filterItem(node.raw, query) : textOf(node).includes(needle);
    const filter = (nodes: ListNode<T>[]): ListNode<T>[] =>
      nodes.flatMap((node) => {
        if (!searching) return [{ ...node, children: filter(node.children) }];
        if (matches(node)) return [{ ...node, children: sortLevel(node.children) }];
        const children = filter(node.children);
        if (children.length === 0) return [];
        auto.add(node.id);
        return [{ ...node, children }];
      });
    const sortLevel = (nodes: ListNode<T>[]): ListNode<T>[] => {
      const next = nodes.map((node) => ({ ...node, children: sortLevel(node.children) }));
      if (sortOption?.compare) next.sort((a, b) => sortOption.compare!(a.raw, b.raw));
      return next;
    };
    const filtered = filter(tree);
    return { visibleTree: sorting ? sortLevel(filtered) : filtered, autoExpanded: auto };
  }, [tree, searching, needle, query, filterItem, textOf, sortOption, sorting]);

  const isExpanded = useCallback(
    (id: string) => expandedSet.has(id) || autoExpanded.has(id),
    [expandedSet, autoExpanded],
  );

  // ─── Filas ─────────────────────────────────────────────────────────
  const rows = useMemo(() => {
    const result: Row<T>[] = [];
    const pushNodes = (nodes: ListNode<T>[], topOffset: number) => {
      nodes.forEach((node, index) => {
        const expandable = node.children.length > 0;
        const expanded = expandable && isExpanded(node.id);
        result.push({
          kind: "item",
          key: `i:${node.id}`,
          node,
          expandable,
          expanded,
          posInSet: index + 1,
          setSize: nodes.length,
          topIndex: node.depth === 0 ? topOffset + index : -1,
        });
        if (expanded) pushNodes(node.children, 0);
      });
    };

    if (!grouped) {
      pushNodes(visibleTree, 0);
    } else {
      const groups = new Map<string, ListNode<T>[]>();
      visibleTree.forEach((node) => {
        const key = node.group ?? "";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(node);
      });
      let keys = [...groups.keys()];
      if (sections) {
        const order = sections.map((s) => s.id);
        keys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
      } else if (typeof groupOrder === "function") {
        keys.sort(groupOrder);
      } else if (groupOrder) {
        const rank = (k: string) => {
          const i = groupOrder.indexOf(k);
          return i === -1 ? Number.MAX_SAFE_INTEGER : i;
        };
        keys = keys.sort((a, b) => rank(a) - rank(b));
      }
      keys.forEach((groupKey) => {
        const nodes = groups.get(groupKey)!;
        const section = sections?.find((s) => s.id === groupKey);
        const collapsed = collapsibleGroups && collapsedSet.has(groupKey);
        result.push({
          kind: "header",
          key: `g:${groupKey}`,
          groupKey,
          label:
            section?.title ??
            getGroupLabel?.(
              groupKey,
              nodes.map((n) => n.raw),
            ) ??
            (groupKey || "Sin grupo"),
          description: section?.description,
          action: section?.action,
          count: nodes.length,
          collapsed,
        });
        if (!collapsed) pushNodes(nodes, 0);
      });
    }
    if (loadingMore) result.push({ kind: "loading", key: "x:loading" });
    else if (hasMore && loadMoreMode === "button" && onLoadMore)
      result.push({ kind: "more", key: "x:more" });
    return result;
  }, [
    visibleTree,
    grouped,
    sections,
    groupOrder,
    getGroupLabel,
    collapsibleGroups,
    collapsedSet,
    isExpanded,
    loadingMore,
    hasMore,
    loadMoreMode,
    onLoadMore,
  ]);

  const rowIndexByKey = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((row, index) => map.set(row.key, index));
    return map;
  }, [rows]);

  const isNavigable = useCallback(
    (row: Row<T>) =>
      (row.kind === "item" && !row.node.data.disabled) ||
      (row.kind === "header" && collapsibleGroups) ||
      row.kind === "more",
    [collapsibleGroups],
  );

  const tabbableKey = useMemo(() => {
    if (focusKey && rowIndexByKey.has(focusKey) && isNavigable(rows[rowIndexByKey.get(focusKey)!]))
      return focusKey;
    const selectedRow = rows.find(
      (row) => row.kind === "item" && selectedSet.has(row.node.id) && !row.node.data.disabled,
    );
    return (selectedRow ?? rows.find(isNavigable))?.key ?? null;
  }, [focusKey, rowIndexByKey, rows, isNavigable, selectedSet]);

  // ─── Selección ─────────────────────────────────────────────────────
  const { allSelectableIds, shownCount } = useMemo(() => {
    const ids: string[] = [];
    let shown = 0;
    const walk = (nodes: ListNode<T>[]) =>
      nodes.forEach((node) => {
        shown += 1;
        if (!node.data.disabled) ids.push(node.id);
        walk(node.children);
      });
    walk(visibleTree);
    return { allSelectableIds: ids, shownCount: shown };
  }, [visibleTree]);

  const commitSelection = useCallback(
    (next: string[]) => {
      if (selectedIdsProp === undefined) setSelectedList(next);
      onSelectionChange?.(
        next,
        next.map((id) => nodeById.get(id)?.raw).filter((raw): raw is T => raw !== undefined),
      );
    },
    [selectedIdsProp, onSelectionChange, nodeById],
  );

  const subtreeIds = (node: ListNode<T>): string[] => {
    const ids: string[] = [];
    const walk = (n: ListNode<T>) => {
      if (!n.data.disabled) ids.push(n.id);
      n.children.forEach(walk);
    };
    walk(node);
    return ids;
  };

  const anchorRef = useRef<string | null>(null);

  const toggleSelection = (
    node: ListNode<T>,
    options: { range?: boolean; force?: boolean } = {},
  ) => {
    if (!selectable || node.data.disabled) return;
    if (!multiple) {
      if (!selectedSet.has(node.id)) commitSelection([node.id]);
      anchorRef.current = node.id;
      return;
    }
    const next = new Set(selectedSet);
    if (options.range && anchorRef.current) {
      const itemRows = rows.filter((r): r is ItemRow<T> => r.kind === "item");
      const a = itemRows.findIndex((r) => r.node.id === anchorRef.current);
      const b = itemRows.findIndex((r) => r.node.id === node.id);
      if (a !== -1 && b !== -1) {
        itemRows
          .slice(Math.min(a, b), Math.max(a, b) + 1)
          .forEach((r) => !r.node.data.disabled && next.add(r.node.id));
        commitSelection([...next]);
        return;
      }
    }
    const value = options.force ?? !selectedSet.has(node.id);
    const ids = cascadeSelection ? subtreeIds(node) : [node.id];
    ids.forEach((id) => (value ? next.add(id) : next.delete(id)));
    anchorRef.current = node.id;
    commitSelection([...next]);
  };

  const selectedCount = selectedIds.length;
  const visibleSelected = allSelectableIds.filter((id) => selectedSet.has(id)).length;
  const allSelected = allSelectableIds.length > 0 && visibleSelected === allSelectableIds.length;
  const toggleAll = () => {
    const next = new Set(selectedSet);
    allSelectableIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
    commitSelection([...next]);
  };

  // ─── Expandir / plegar ─────────────────────────────────────────────
  const toggleExpanded = (id: string, value?: boolean) => {
    const open = value ?? !expandedSet.has(id);
    if (open === expandedSet.has(id)) return;
    setExpandedList(open ? [...expandedList, id] : expandedList.filter((x) => x !== id));
  };
  const toggleGroup = (key: string, value?: boolean) => {
    const collapse = value ?? !collapsedSet.has(key);
    if (collapse === collapsedSet.has(key)) return;
    setCollapsedList(collapse ? [...collapsedList, key] : collapsedList.filter((x) => x !== key));
  };

  // ─── Reordenar ─────────────────────────────────────────────────────
  const topCount = visibleTree.length;
  const canReorder = reorderable && !grouped && !searching && !sorting && !hasNested && !sections;
  const moveItem = useCallback(
    (from: number, to: number) => {
      if (from === to || to < 0 || to >= localItems.length) return;
      const next = moveArrayItem(localItems, from, to);
      setItemsState((prev) => ({ ...prev, local: next }));
      onReorder?.(next, from, to);
    },
    [localItems, onReorder],
  );
  const sortable = useSortableList({
    count: topCount,
    onMove: moveItem,
    disabled: !canReorder,
    getItemLabel: (index) => nodeText(visibleTree[index]?.data.title) || `Elemento ${index + 1}`,
  });

  // ─── Virtualización ────────────────────────────────────────────────
  const isCard = variant === "card";
  const hasMedia = useMemo(
    () => tree.slice(0, 20).some((n) => n.data.avatar || n.data.icon),
    [tree],
  );
  const baseRowHeight = useMemo(() => {
    if (estimatedItemHeight) return estimatedItemHeight;
    const sample = tree[0]?.data;
    return estimateRowHeight(density, size, {
      media: hasMedia,
      subtitle: Boolean(sample?.subtitle),
      description: Boolean(sample?.description),
      card: isCard,
    });
  }, [estimatedItemHeight, tree, density, size, hasMedia, isCard]);

  const virtualized =
    !canReorder &&
    !(columns && columns > 1) &&
    (virtualize === true || (virtualize === "auto" && rows.length > virtualizeThreshold));
  const cardGap = isCard ? 8 : 0;

  const resolvedMaxHeight =
    maxHeight ??
    (visibleItems ? visibleItems * (baseRowHeight + cardGap) : undefined) ??
    (virtualized && height === undefined ? 480 : undefined);
  const scrollable = height !== undefined || resolvedMaxHeight !== undefined;
  const numericViewport =
    typeof height === "number"
      ? height
      : typeof resolvedMaxHeight === "number"
        ? resolvedMaxHeight
        : 480;

  const scrollRef = useRef<HTMLDivElement>(null);
  const getRowKey = useCallback((index: number) => rows[index]?.key ?? String(index), [rows]);
  const estimateSize = useCallback(
    (index: number) => {
      const row = rows[index];
      if (!row) return baseRowHeight;
      if (row.kind === "header") return HEADER_HEIGHT;
      if (row.kind === "loading") return baseRowHeight * 2;
      if (row.kind === "more") return 52;
      return baseRowHeight;
    },
    [rows, baseRowHeight],
  );
  const virtualizer = useListVirtualizer({
    enabled: virtualized,
    count: rows.length,
    getKey: getRowKey,
    estimateSize,
    scrollRef,
    overscan,
    fallbackViewport: numericViewport,
    gap: cardGap,
  });

  // ─── Foco ──────────────────────────────────────────────────────────
  const rowRefs = useRef(new Map<string, HTMLElement>());
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    const key = pendingFocus.current;
    if (!key) return;
    const node = rowRefs.current.get(key);
    if (node) {
      pendingFocus.current = null;
      node.focus({ preventScroll: virtualized });
    }
  });

  const focusRow = (index: number) => {
    const row = rows[index];
    if (!row) return;
    setFocusKey(row.key);
    pendingFocus.current = row.key;
    if (virtualized) {
      virtualizer.scrollToIndex(index, {
        paddingTop: grouped && stickyHeaders ? HEADER_HEIGHT : 0,
      });
    }
    const node = rowRefs.current.get(row.key);
    if (node) {
      pendingFocus.current = null;
      node.focus({ preventScroll: virtualized });
    }
  };

  const findNavigable = (from: number, step: 1 | -1, limit = rows.length) => {
    let index = from;
    let last = -1;
    for (let moved = 0; moved < limit;) {
      index += step;
      if (index < 0 || index >= rows.length) break;
      if (isNavigable(rows[index])) {
        last = index;
        moved += 1;
      }
    }
    return last;
  };

  // Búsqueda por tecleo (type-ahead).
  const typeahead = useRef({ text: "", time: 0 });

  const activateRow = (row: Row<T>, event?: MouseEvent | KeyboardEvent) => {
    if (row.kind === "header") {
      if (collapsibleGroups) toggleGroup(row.groupKey);
      return;
    }
    if (row.kind === "more") {
      onLoadMore?.();
      return;
    }
    if (row.kind !== "item") return;
    const { node } = row;
    if (node.data.disabled) return;
    const handler = node.data.onClick || onItemClick;
    node.data.onClick?.();
    onItemClick?.(node.raw, node.sourceIndex);
    if (selectable && (selectOnClick || !handler)) {
      toggleSelection(node, { range: Boolean(event?.shiftKey) && multiple });
    } else if (!handler && !node.data.href && row.expandable) {
      toggleExpanded(node.id);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.defaultPrevented) return;
    const target = event.target as HTMLElement;
    if (target.closest("input:not([type=checkbox]), textarea, [contenteditable=true]")) return;
    const targetKey = target.closest<HTMLElement>("[data-cn-list-row]")?.dataset.cnListRow;
    const currentKey = targetKey && rowIndexByKey.has(targetKey) ? targetKey : tabbableKey;
    const index = currentKey ? (rowIndexByKey.get(currentKey) ?? -1) : -1;
    const row = index >= 0 ? rows[index] : undefined;
    const go = (next: number) => {
      if (next < 0) return;
      event.preventDefault();
      focusRow(next);
      const nextRow = rows[next];
      if (event.shiftKey && multiple && nextRow?.kind === "item") {
        toggleSelection(nextRow.node, { force: true });
      }
    };

    // Reordenar con Alt + flechas.
    if (event.altKey && canReorder && row?.kind === "item" && row.topIndex >= 0) {
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        const to = row.topIndex + (event.key === "ArrowUp" ? -1 : 1);
        moveItem(row.topIndex, to);
        pendingFocus.current = row.key;
        return;
      }
    }

    switch (event.key) {
      case "ArrowDown":
        go(findNavigable(index, 1, 1));
        return;
      case "ArrowUp":
        go(findNavigable(index, -1, 1));
        return;
      case "PageDown":
        go(findNavigable(index, 1, 10));
        return;
      case "PageUp":
        go(findNavigable(index, -1, 10));
        return;
      case "Home":
        go(findNavigable(-1, 1, 1));
        return;
      case "End":
        go(findNavigable(rows.length, -1, 1));
        return;
      case "ArrowRight":
        if (row?.kind === "item" && row.expandable) {
          event.preventDefault();
          if (!row.expanded) toggleExpanded(row.node.id, true);
          else go(findNavigable(index, 1, 1));
        } else if (row?.kind === "header" && row.collapsed) {
          event.preventDefault();
          toggleGroup(row.groupKey, false);
        }
        return;
      case "ArrowLeft":
        if (row?.kind === "item") {
          if (row.expandable && row.expanded) {
            event.preventDefault();
            toggleExpanded(row.node.id, false);
          } else if (row.node.parentId) {
            event.preventDefault();
            const parentIndex = rowIndexByKey.get(`i:${row.node.parentId}`);
            if (parentIndex !== undefined) focusRow(parentIndex);
          }
        } else if (row?.kind === "header" && collapsibleGroups && !row.collapsed) {
          event.preventDefault();
          toggleGroup(row.groupKey, true);
        }
        return;
      case "Enter":
        if (!row) return;
        event.preventDefault();
        if (row.kind === "item" && row.node.data.href) {
          rowRefs.current
            .get(row.key)
            ?.querySelector<HTMLAnchorElement>("[data-cn-list-link]")
            ?.click();
          return;
        }
        activateRow(row, event);
        return;
      case " ":
        if (!row) return;
        event.preventDefault();
        if (row.kind === "item" && selectable) {
          toggleSelection(row.node, { range: event.shiftKey && multiple });
        } else activateRow(row, event);
        return;
      default:
        break;
    }

    if (multiple && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
      event.preventDefault();
      toggleAll();
      return;
    }

    // Type-ahead: letras y números.
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      const state = typeahead.current;
      state.text = now - state.time > 600 ? event.key : state.text + event.key;
      state.time = now;
      const prefix = normalizeListText(state.text);
      if (!prefix) return;
      const repeated = [...prefix].every((ch) => ch === prefix[0]);
      const term = repeated ? prefix[0] : prefix;
      const startAt = repeated || state.text.length === 1 ? index + 1 : Math.max(index, 0);
      for (let step = 0; step < rows.length; step += 1) {
        const candidateIndex = (startAt + step) % rows.length;
        const candidate = rows[candidateIndex];
        if (
          candidate.kind === "item" &&
          !candidate.node.data.disabled &&
          normalizeListText(nodeText(candidate.node.data.title)).startsWith(term)
        ) {
          event.preventDefault();
          focusRow(candidateIndex);
          return;
        }
      }
    }
  };

  // ─── Carga incremental ─────────────────────────────────────────────
  const requested = useRef<number | null>(null);
  const itemCount = tree.length;
  useEffect(() => {
    if (!loadingMore) requested.current = null;
  }, [loadingMore, itemCount]);

  const requestMore = useCallback(() => {
    if (!hasMore || loadingMore || !onLoadMore || loadMoreMode !== "auto") return;
    if (requested.current === itemCount) return;
    requested.current = itemCount;
    onLoadMore();
  }, [hasMore, loadingMore, onLoadMore, loadMoreMode, itemCount]);

  const handleScroll = () => {
    const node = scrollRef.current;
    if (!node) return;
    if (node.scrollHeight - node.scrollTop - node.clientHeight < 240) requestMore();
  };

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollable || !hasMore || loadMoreMode !== "auto") return;
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) requestMore();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [scrollable, hasMore, loadMoreMode, requestMore]);

  // ─── Acciones de fila ──────────────────────────────────────────────
  const actionsFor = (node: ListNode<T>): CnListItemAction[] => {
    const shared = typeof itemActions === "function" ? itemActions(node.raw) : (itemActions ?? []);
    const bind = <R,>(list: readonly CnListAction<R>[], raw: R): CnListItemAction[] =>
      list
        .filter((action) => action.visible?.(raw) ?? true)
        .map((action) => ({
          id: action.id,
          label: action.label,
          icon: action.icon,
          color: action.color,
          inline: action.inline,
          divider: action.divider,
          tooltip: action.tooltip,
          disabled: action.disabled?.(raw),
          onClick: () => action.onClick(raw),
        }));
    return [
      ...bind(node.ownActions ?? [], node.raw as unknown as CnListItemData),
      ...bind(shared, node.raw),
    ];
  };

  const swipeFor = (node: ListNode<T>, side: "left" | "right") => {
    const action = swipeActions?.[side];
    if (!action) return undefined;
    return { ...action, onTrigger: () => action.onTrigger(node.raw) };
  };

  // ─── Render de filas ───────────────────────────────────────────────
  const listRole = hasNested ? "tree" : selectable ? "listbox" : "list";
  const itemRole = hasNested ? "treeitem" : selectable ? "option" : "listitem";
  const dividerMode: false | "inset" | "full" =
    dividers === undefined
      ? variant === "divided"
        ? hasMedia
          ? "inset"
          : "full"
        : false
      : dividers === true
        ? "full"
        : dividers || false;
  const anyExpandable = hasNested;
  const highlight = highlightMatches && searching ? query : undefined;

  const setRowRef =
    (key: string, index: number, topIndex: number) => (node: HTMLElement | null) => {
      if (node) rowRefs.current.set(key, node);
      else rowRefs.current.delete(key);
      if (virtualized) virtualizer.measure(index)(node);
      if (canReorder && topIndex >= 0) sortable.getItemProps(topIndex).ref(node);
    };

  const renderRow = (row: Row<T>, index: number, style?: CSSProperties): ReactNode => {
    const focusable = row.key === tabbableKey;
    if (row.kind === "header") {
      return (
        <CnListSubheader
          key={row.key}
          ref={setRowRef(row.key, index, -1)}
          id={`${baseId}-${index}`}
          title={row.label}
          description={row.description}
          action={row.action}
          count={showGroupCount ? row.count : undefined}
          sticky={stickyHeaders && !virtualized}
          collapsible={collapsibleGroups}
          collapsed={row.collapsed}
          onToggle={() => {
            setFocusKey(row.key);
            toggleGroup(row.groupKey);
          }}
          role={collapsibleGroups ? "button" : "presentation"}
          tabIndex={collapsibleGroups ? (focusable ? 0 : -1) : undefined}
          onFocus={() => setFocusKey(row.key)}
          size={size}
          variant={variant}
          data-cn-list-row={row.key}
          style={style}
          sx={{
            gridColumn: "1 / -1",
            ...(surface === "filled" && {
              backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
            }),
          }}
        />
      );
    }
    if (row.kind === "loading") {
      return (
        <Box
          key={row.key}
          ref={setRowRef(row.key, index, -1)}
          role="presentation"
          style={style}
          sx={{ gridColumn: "1 / -1" }}
        >
          <CnListSkeleton
            count={2}
            variant={variant === "card" ? "plain" : variant}
            density={density}
            size={size}
            avatar={hasMedia ? "circle" : false}
            ariaLabel="Cargando más elementos"
          />
        </Box>
      );
    }
    if (row.kind === "more") {
      return (
        <Box
          key={row.key}
          ref={setRowRef(row.key, index, -1)}
          role="presentation"
          style={style}
          sx={{ display: "flex", justifyContent: "center", py: "10px", gridColumn: "1 / -1" }}
        >
          <CnButton
            size="small"
            variant="outlined"
            color="neutral"
            startIcon="expand_more"
            tabIndex={focusable ? 0 : -1}
            data-cn-list-row={row.key}
            onFocus={() => setFocusKey(row.key)}
            onClick={() => onLoadMore?.()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") event.stopPropagation();
            }}
          >
            {loadMoreLabel}
          </CnButton>
        </Box>
      );
    }

    const { node } = row;
    const d = node.data;
    const selected = selectedSet.has(node.id);
    let checked = selected;
    let indeterminate = false;
    if (multiple && cascadeSelection && node.children.length > 0) {
      const ids = subtreeIds(node).filter((id) => id !== node.id);
      const count = ids.filter((id) => selectedSet.has(id)).length;
      checked = selected || (ids.length > 0 && count === ids.length);
      indeterminate = !checked && count > 0;
    }
    const next = rows[index + 1];
    const showDivider = dividerMode && !isCard && next?.kind === "item" ? dividerMode : undefined;
    const sortableProps =
      canReorder && row.topIndex >= 0 ? sortable.getItemProps(row.topIndex) : null;
    const rowStyle: CSSProperties = { ...style, ...(sortableProps?.style ?? {}) };
    const interactive = selectable || Boolean(onItemClick || d.onClick || d.href) || row.expandable;
    const common = {
      ref: setRowRef(row.key, index, row.topIndex),
      id: `${baseId}-${index}`,
      role: itemRole,
      tabIndex: d.disabled ? -1 : focusable ? 0 : -1,
      "aria-selected": selectable ? selected : undefined,
      "aria-level": hasNested ? node.depth + 1 : undefined,
      "aria-expanded": hasNested && row.expandable ? row.expanded : undefined,
      "aria-setsize": row.setSize,
      "aria-posinset": row.posInSet,
      "data-cn-list-row": row.key,
      "data-dragging": sortableProps?.["data-dragging"],
      onFocus: (event: FocusEvent<HTMLElement>) => {
        if (event.target === event.currentTarget) setFocusKey(row.key);
      },
      onClick: (event: MouseEvent<HTMLElement>) => {
        setFocusKey(row.key);
        activateRow(row, event);
      },
      style: rowStyle,
    };

    if (renderItem) {
      const state: CnListRenderItemState = {
        selected,
        active: activeId === node.id,
        disabled: Boolean(d.disabled),
        depth: node.depth,
        expanded: row.expanded,
        hasChildren: row.expandable,
        index,
        query,
      };
      return (
        <Box
          key={row.key}
          {...common}
          aria-disabled={d.disabled || undefined}
          data-selected={selected || undefined}
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            outline: "none",
            pl: node.depth ? `${node.depth * indent}px` : undefined,
            cursor: interactive && !d.disabled ? "pointer" : undefined,
            opacity: d.disabled ? 0.55 : undefined,
            borderRadius: isCard || variant === "inset" ? "var(--cn-radius-md, 8px)" : undefined,
            backgroundColor: selected
              ? "rgba(var(--cn-color-rgb-brand-500, 53, 98, 166), 0.08)"
              : undefined,
            "&:focus-visible": {
              boxShadow: "inset 0 0 0 2px var(--cn-color-brand-500, #3562a6)",
            },
          }}
        >
          {checkboxes && (
            <Checkbox
              size="small"
              checked={checked}
              indeterminate={indeterminate}
              disabled={d.disabled}
              tabIndex={-1}
              onClick={(event) => event.stopPropagation()}
              onChange={() => toggleSelection(node)}
              slotProps={{ input: { "aria-label": `Seleccionar ${nodeText(d.title)}`.trim() } }}
              sx={{ ml: "6px", p: "4px" }}
            />
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>{renderItem(node.raw, state)}</Box>
        </Box>
      );
    }

    return (
      <CnListItem
        key={row.key}
        {...common}
        title={d.title}
        subtitle={d.subtitle}
        description={d.description}
        avatar={d.avatar}
        icon={d.icon}
        leading={d.leading}
        meta={d.meta}
        timestamp={d.timestamp}
        status={d.status}
        badge={d.badge}
        trailing={d.trailing}
        chevron={d.chevron ?? (showChevron && Boolean(d.href || d.onClick || onItemClick))}
        tone={d.tone}
        unread={d.unread}
        disabled={d.disabled}
        href={d.href}
        target={d.target}
        selected={selected}
        active={activeId === node.id}
        selectedIndicator={selectionMode === "single" && !checkboxes}
        variant={variant}
        density={density}
        size={size}
        descriptionLines={descriptionLines}
        divider={showDivider}
        interactive={interactive}
        depth={node.depth}
        indent={indent}
        expandable={row.expandable}
        expanded={row.expanded}
        onToggleExpand={() => {
          setFocusKey(row.key);
          toggleExpanded(node.id);
        }}
        reserveExpander={anyExpandable && !row.expandable}
        checkbox={checkboxes}
        checked={checked}
        indeterminate={indeterminate}
        onCheckedChange={() => {
          setFocusKey(row.key);
          toggleSelection(node);
        }}
        actions={actionsFor(node)}
        actionsVisibility={actionsVisibility}
        swipeLeft={swipeFor(node, "left")}
        swipeRight={swipeFor(node, "right")}
        dragHandleProps={
          canReorder && row.topIndex >= 0
            ? (sortable.getHandleProps(row.topIndex) as unknown as Record<string, unknown>)
            : undefined
        }
        highlight={highlight}
        nestedFocus
      />
    );
  };

  // ─── Estados ───────────────────────────────────────────────────────
  const sample = tree[0]?.data;
  const skeletonProps: CnListSkeletonProps = {
    count: skeletonCount ?? (grouped ? 3 : Math.min(Math.max(tree.length, 5), 8)),
    variant,
    density,
    size,
    surface,
    avatar: sample ? (sample.avatar ? "circle" : sample.icon ? "square" : false) : "circle",
    lines: sample ? (sample.subtitle ? 1 : 0) + (sample.description ? 1 : 0) : 1,
    meta: Boolean(sample?.meta || sample?.timestamp),
    trailing: Boolean(sample?.status || sample?.badge || itemActions),
    checkbox: checkboxes,
    dividers: dividerMode || undefined,
    sections: grouped ? 2 : 0,
    toolbar: !hideToolbar && (searchable || Boolean(sortOptions?.length)),
    title: Boolean(title),
    columns,
    sx,
    className,
  };

  if (skeleton || (loading && tree.length === 0)) {
    return <CnListSkeleton {...skeletonProps} />;
  }

  const totalCount = nodeById.size;
  const isEmpty = rows.every((row) => row.kind !== "item" && row.kind !== "header");
  const showSelectAll = multiple && (selectAll ?? true);
  const hasToolbar =
    !hideToolbar &&
    (searchable ||
      Boolean(sortOptions?.length) ||
      Boolean(toolbarSlot) ||
      showSelectAll ||
      (selectedCount > 0 && Boolean(bulkActions?.length)));

  const errorText = typeof error === "string" ? error : "No se pudo cargar la lista.";

  const retryButton = onRetry && (
    <CnButton size="small" variant="outlined" color="neutral" startIcon="refresh" onClick={onRetry}>
      Reintentar
    </CnButton>
  );

  // ─── Barra ─────────────────────────────────────────────────────────
  const selectAllBox = showSelectAll && (
    <Checkbox
      size="small"
      checked={allSelected}
      indeterminate={!allSelected && visibleSelected > 0}
      disabled={allSelectableIds.length === 0}
      onChange={toggleAll}
      slotProps={{ input: { "aria-label": "Seleccionar todo" } }}
      sx={{ p: "4px", ml: "2px" }}
    />
  );
  const selectAllLabel = showSelectAll && !searchable && selectedCount === 0 && (
    <Box component="span" sx={{ fontSize: "0.8rem", color: "var(--cn-color-text-muted, #6e7682)" }}>
      Seleccionar todo
    </Box>
  );

  const searchBox = searchable && (
    <InputBase
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      placeholder={searchPlaceholder}
      inputProps={{ "aria-label": "Buscar en la lista", type: "search" }}
      startAdornment={
        <CnIcon
          name="search"
          size={18}
          aria-hidden
          sx={{ color: "var(--cn-color-neutral-500, #6e7682)", mr: "6px" }}
        />
      }
      endAdornment={
        query ? (
          <IconButton size="small" aria-label="Limpiar búsqueda" onClick={() => setQuery("")}>
            <CnIcon name="close" size={16} />
          </IconButton>
        ) : undefined
      }
      sx={{
        flex: "1 1 220px",
        maxWidth: 360,
        minWidth: 0,
        height: 34,
        px: "10px",
        fontSize: "0.82rem",
        borderRadius: "999px",
        backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
        border: "1px solid var(--cn-color-border, #dde0e4)",
        transition: "border-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease",
        "&.Mui-focused": {
          backgroundColor: "var(--cn-color-surface, #fff)",
          borderColor: "var(--cn-color-brand-500, #3562a6)",
          boxShadow: "0 0 0 3px rgba(53, 98, 166, 0.15)",
        },
        "& input::-webkit-search-cancel-button": { display: "none" },
      }}
    />
  );

  const sortControl = sortOptions && sortOptions.length > 0 && (
    <>
      <CnButton
        size="small"
        variant="outlined"
        color="neutral"
        startIcon="sort"
        aria-haspopup="menu"
        aria-expanded={Boolean(sortAnchor) || undefined}
        onClick={(event) => setSortAnchor(event.currentTarget as HTMLElement)}
      >
        {sortOption?.label ?? "Ordenar"}
      </CnButton>
      <Menu
        open={Boolean(sortAnchor)}
        anchorEl={sortAnchor}
        onClose={() => setSortAnchor(null)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "12px",
              minWidth: 200,
              boxShadow: "0 10px 30px rgba(17, 20, 24, 0.14)",
              "& .MuiMenuItem-root": { fontSize: "0.82rem", borderRadius: "8px", mx: "6px" },
              "& .MuiListItemIcon-root": { minWidth: 30 },
            },
          },
        }}
      >
        {[{ id: null, label: "Orden original", icon: undefined }, ...sortOptions].map((option) => (
          <MenuItem
            key={option.id ?? "__none"}
            selected={sortId === option.id}
            onClick={() => {
              setSortAnchor(null);
              setSortId(option.id);
            }}
          >
            <ListItemIcon>
              {sortId === option.id ? (
                <CnIcon name="check" size="sm" color="primary" />
              ) : option.icon ? (
                <CnIcon name={option.icon} size="sm" />
              ) : null}
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: "0.82rem" }}>
              {option.label}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );

  const bulkBar = selectedCount > 0 && multiple && (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
      <Box
        component="span"
        data-cn-list-selection-count=""
        sx={{
          px: "10px",
          py: "4px",
          borderRadius: "999px",
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "var(--cn-color-brand-700, #1c3d6d)",
          backgroundColor: "rgba(37, 77, 135, 0.1)",
        }}
      >
        {selectedCount} {selectedCount === 1 ? "seleccionado" : "seleccionados"}
      </Box>
      {bulkActions?.map((action) => (
        <CnButton
          key={action.id}
          size="small"
          variant="outlined"
          color={action.color ?? "primary"}
          startIcon={action.icon}
          onClick={async () => {
            const ids = [...selectedIds];
            await action.onClick(
              ids.map((id) => nodeById.get(id)?.raw).filter((raw): raw is T => raw !== undefined),
              ids,
            );
            commitSelection([]);
          }}
        >
          {action.label}
        </CnButton>
      ))}
      <CnButton size="small" variant="text" color="neutral" onClick={() => commitSelection([])}>
        Quitar selección
      </CnButton>
    </Box>
  );

  const toolbar = hasToolbar && (
    <Box
      data-cn-list-toolbar=""
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "8px",
        px: "12px",
        py: "10px",
        minHeight: 54,
        boxSizing: "border-box",
        borderBottom: "1px solid var(--cn-color-border-subtle, #eceef1)",
      }}
    >
      {selectAllBox}
      {selectAllLabel}
      {bulkBar || (
        <>
          {searchBox}
          <Box sx={{ flex: 1 }} />
          {sortControl}
          {toolbarSlot}
        </>
      )}
    </Box>
  );

  const header = (title || description || headerAction) && (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        px: "16px",
        pt: "14px",
        pb: hasToolbar ? "4px" : "10px",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {title && (
          <Box
            id={`${baseId}-title`}
            sx={{
              fontSize: "var(--cn-font-size-lg, 16px)",
              fontWeight: 700,
              color: "var(--cn-color-text, #222831)",
              lineHeight: 1.35,
            }}
          >
            {title}
          </Box>
        )}
        {description && (
          <Box sx={{ fontSize: "0.8rem", color: "var(--cn-color-text-muted, #6e7682)", mt: "2px" }}>
            {description}
          </Box>
        )}
      </Box>
      {headerAction && <Box sx={{ display: "flex", gap: "6px" }}>{headerAction}</Box>}
    </Box>
  );

  const countNode = showCount && !isEmpty && (
    <Box
      sx={{
        fontSize: "0.75rem",
        color: "var(--cn-color-text-muted, #6e7682)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {countText
        ? countText(shownCount, totalCount)
        : searching
          ? `${shownCount.toLocaleString("es-MX")} de ${totalCount.toLocaleString("es-MX")} elementos`
          : `${totalCount.toLocaleString("es-MX")} ${totalCount === 1 ? "elemento" : "elementos"}`}
    </Box>
  );

  const footerNode = (footer || countNode) && (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        px: "16px",
        py: "10px",
        borderTop: "1px solid var(--cn-color-border-subtle, #eceef1)",
      }}
    >
      {countNode}
      {footer && (
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", ml: "auto" }}>{footer}</Box>
      )}
    </Box>
  );

  // ─── Cuerpo ────────────────────────────────────────────────────────
  let body: ReactNode;
  if (error && tree.length === 0) {
    body = (
      <CnEmptyState
        icon="error_outline"
        color="error"
        size="sm"
        role="alert"
        title="No se pudo cargar la lista"
        description={errorText}
        action={retryButton}
      />
    );
  } else if (isEmpty && !loadingMore) {
    body = searching ? (
      <CnEmptyState
        icon="search_off"
        size="sm"
        title="Sin resultados"
        description={`No hay coincidencias para “${query.trim()}”.`}
        action={
          <CnButton size="small" variant="outlined" color="neutral" onClick={() => setQuery("")}>
            Limpiar búsqueda
          </CnButton>
        }
      />
    ) : (
      <CnEmptyState
        icon={emptyIcon}
        size="sm"
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  } else {
    const listProps = {
      role: listRole,
      "aria-label": ariaLabel ?? (typeof title === "string" ? title : undefined),
      "aria-labelledby":
        ariaLabelledBy ?? (title && typeof title !== "string" ? `${baseId}-title` : undefined),
      "aria-multiselectable": selectable && multiple ? true : undefined,
      "aria-busy": loading || loadingMore || undefined,
      "data-cn-list": variant,
      "data-virtualized": virtualized || undefined,
      onKeyDown: handleKeyDown,
    };
    const grid = Boolean(columns && columns > 1 && isCard);
    const layoutSx = {
      display: grid ? "grid" : "flex",
      flexDirection: "column" as const,
      gap: isCard ? `${cardGap}px` : 0,
      ...(grid && { gridTemplateColumns: { xs: "1fr", sm: `repeat(${columns}, minmax(0, 1fr))` } }),
      ...(isCard && { p: "8px" }),
      ...(variant === "inset" && { py: "4px" }),
    };

    if (virtualized) {
      const { start, end } = virtualizer;
      const firstVisible = virtualizer.indexAt(virtualizer.scrollTop);
      let stickyIndex = -1;
      if (grouped && stickyHeaders && firstVisible >= 0) {
        for (let i = firstVisible; i >= 0; i -= 1) {
          if (rows[i].kind === "header") {
            stickyIndex = i;
            break;
          }
        }
      }
      const stickyRow = stickyIndex >= 0 ? (rows[stickyIndex] as HeaderRow) : null;
      const showOverlay =
        stickyRow !== null && virtualizer.offsetOf(stickyIndex) < virtualizer.scrollTop;
      body = (
        <>
          {showOverlay && stickyRow && (
            <CnListSubheader
              aria-hidden
              data-cn-list-sticky=""
              title={stickyRow.label}
              count={showGroupCount ? stickyRow.count : undefined}
              collapsible={collapsibleGroups}
              collapsed={stickyRow.collapsed}
              onToggle={() => toggleGroup(stickyRow.groupKey)}
              role="presentation"
              tabIndex={-1}
              size={size}
              variant={variant}
              sx={{ height: HEADER_HEIGHT, mb: `-${HEADER_HEIGHT}px`, zIndex: 4 }}
            />
          )}
          <Box
            {...listProps}
            sx={{
              position: "relative",
              height: virtualizer.totalSize,
              ...(isCard && { mx: "8px" }),
            }}
          >
            {rows.slice(start, end).map((row, i) => {
              const index = start + i;
              return renderRow(row, index, {
                position: "absolute",
                top: virtualizer.offsetOf(index) + (isCard ? 8 : 0),
                left: 0,
                right: 0,
              });
            })}
          </Box>
          {isCard && <Box sx={{ height: 16 }} />}
        </>
      );
    } else {
      body = (
        <Box {...listProps} sx={layoutSx}>
          {rows.map((row, index) => renderRow(row, index))}
        </Box>
      );
    }
  }

  const rootSx: SxProps<Theme> = [
    {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      width: "100%",
      boxSizing: "border-box",
      fontFamily: "var(--cn-font-sans, system-ui, sans-serif)",
    },
    surfaceSx(surface),
    ...(Array.isArray(sx) ? sx : [sx]),
  ];

  return (
    <Box className={className} sx={rootSx} data-cn-list-root="">
      {header}
      {toolbar}
      {loading && tree.length > 0 && (
        <LinearProgress
          aria-label="Actualizando lista"
          sx={{ position: "absolute", left: 0, right: 0, top: 0, height: 2, zIndex: 6 }}
        />
      )}
      {error && tree.length > 0 && (
        <Box
          role="alert"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            px: "16px",
            py: "8px",
            color: "var(--cn-color-error-700, #922626)",
            backgroundColor: "rgba(214, 60, 60, 0.07)",
            fontSize: "0.8rem",
            borderBottom: "1px solid rgba(214, 60, 60, 0.2)",
          }}
        >
          <CnIcon name="error_outline" size="sm" />
          <Box sx={{ flex: 1 }}>{errorText}</Box>
          {retryButton}
        </Box>
      )}
      <Box
        ref={scrollRef}
        data-cn-list-scroll=""
        onScroll={scrollable ? handleScroll : undefined}
        sx={{
          position: "relative",
          minHeight: toCss(minHeight),
          ...(scrollable && {
            height: toCss(height),
            maxHeight: toCss(resolvedMaxHeight),
            overflowY: "auto",
            overscrollBehavior: "contain",
          }),
        }}
      >
        {body}
        {!scrollable && hasMore && loadMoreMode === "auto" && (
          <Box ref={sentinelRef} aria-hidden sx={{ height: "1px" }} />
        )}
      </Box>
      {footerNode}
      <Box aria-live="polite" style={visuallyHidden}>
        {sortable.announcement}
      </Box>
    </Box>
  );
}

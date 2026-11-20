import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Popover from "@mui/material/Popover";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { CnBadge } from "../CnBadge";
import { CnButton } from "../CnButton";
import { CnOverlayHeader } from "../CnDialog/overlay-parts";
import { CnDrawer } from "../CnDrawer";
import { CnIcon } from "../CnIcon";
import { CnList } from "../CnList";
import { CnTabs } from "../CnTabs";
import type { CnListAction, CnListBulkAction, CnListItemData } from "../CnList";
import {
  dayKey,
  formatAbsolute,
  formatDayLabel,
  formatRelative,
  matchesText,
  toPlainText,
  toValidDate,
  useLiveNow,
} from "../CnTimeline/timeline-utils";
import type {
  CnNotification,
  CnNotificationCenterProps,
  CnNotificationTab,
} from "./CnNotificationCenter.types";
import { CnNotificationCenterSkeleton } from "./CnNotificationCenterSkeleton";
import { CnNotificationPreview } from "./CnNotificationPreview";
import { NotificationContent, SettingsView, StatusBanner } from "./notification-parts";
import {
  CN_NOTIFICATION_SNOOZE_OPTIONS,
  formatHotkey,
  isSnoozed,
  matchesHotkey,
  notificationSearchText,
  notificationSourceKey,
  playNotificationChime,
  vibrateNotification,
} from "./notification-utils";
import { useBrowserNotifications } from "./useBrowserNotifications";

export const CN_NOTIFICATION_DEFAULT_TABS: readonly CnNotificationTab[] = [
  { id: "all", label: "Todas" },
  {
    id: "unread",
    label: "No leídas",
    filter: (n) => !n.read,
    emptyTitle: "Estás al día",
    emptyDescription: "No tienes notificaciones sin leer.",
  },
  {
    id: "mentions",
    label: "Menciones",
    filter: (n) => Boolean(n.mention),
    emptyTitle: "Sin menciones",
    emptyDescription: "Cuando alguien te mencione aparecerá aquí.",
  },
];

const hiddenSx = {
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;

const URGENT = "__urgent";
const NEW = "__new";
const REST = "__rest";
/** Tiempo que una notificación recién llegada conserva su animación de entrada. */
const FRESH_MS = 4000;

const timeOf = (n: CnNotification) => toValidDate(n.time)?.getTime() ?? null;

/**
 * Centro de notificaciones: campana con contador, panel (popover o pantalla
 * completa en móvil) con pestañas, búsqueda, grupos (día, origen, categoría)
 * con urgentes fijas y separador "Nuevas", selección en lote, posponer,
 * silenciar orígenes, contenido enriquecido (imagen, avance, botones con
 * carga), "No molestar", sonido/vibración opcionales, estado de conexión,
 * preferencias integradas, atajo de teclado, vista previa flotante y avisos
 * del navegador. La lista es un `CnList`.
 */
export const CnNotificationCenter = ({
  notifications,
  unreadCount,
  mode = "button",
  panel = "auto",
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  tabs,
  activeTab,
  defaultTab,
  onTabChange,
  groupByDay = true,
  groupBy,
  collapsibleGroups = false,
  pinUrgent = true,
  lastSeenAt,
  searchable = false,
  selectable = false,
  onDismissMany,
  onNotificationClick,
  markReadOnClick = true,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  closeOnClick,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  loading = false,
  error,
  onRetry,
  skeleton = false,
  onNewNotifications,
  announceNew = true,
  preview = false,
  previewRotateMs,
  browserNotifications = false,
  sound = false,
  onSoundChange,
  vibrate = false,
  onVibrateChange,
  doNotDisturb,
  defaultDoNotDisturb = false,
  onDoNotDisturbChange,
  mutedSources,
  onMuteSource,
  onSnooze,
  snoozeOptions = CN_NOTIFICATION_SNOOZE_OPTIONS,
  connection = "online",
  onReconnect,
  hotkey,
  settings,
  title = "Notificaciones",
  emptyTitle = "Sin notificaciones",
  emptyDescription = "Aquí verás avisos, menciones y actividad.",
  onSettingsClick,
  settingsHref,
  onViewAll,
  viewAllHref,
  viewAllLabel = "Ver todas",
  footerExtra,
  maxBadge = 99,
  bellIcon = "notifications",
  panelWidth = 400,
  listMaxHeight = 440,
  ariaLabel,
  sx,
  className,
}: CnNotificationCenterProps) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const isTouch = useMediaQuery("(hover: none)");
  const inline = mode === "inline";
  const useDrawer = !inline && (panel === "drawer" || (panel === "auto" && isSmall));
  const now = useLiveNow(undefined, 60000);

  const baseId = useId().replace(/:/g, "");
  const titleId = `${baseId}-title`;
  const panelId = `${baseId}-panel`;
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  // El ancla en estado evita abrir el popover sin elemento (p. ej. con `defaultOpen`).
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const setAnchor = useCallback((el: HTMLButtonElement | null) => {
    anchorRef.current = el;
    setAnchorEl(el);
  }, []);

  // ─── Apertura ──────────────────────────────────────────────────────
  const [openState, setOpenState] = useState(defaultOpen);
  const open = inline || (openProp ?? openState);
  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOpenState(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  // ─── Vista, selección y búsqueda ───────────────────────────────────
  const [view, setView] = useState<"list" | "settings">("list");
  const [selecting, setSelecting] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (open) return;
    setView("list");
    setSelecting(false);
  }, [open]);

  // ─── No molestar y silenciados ─────────────────────────────────────
  const [dndState, setDndState] = useState(defaultDoNotDisturb);
  const dnd = doNotDisturb ?? dndState;
  const setDnd = (value: boolean) => {
    if (doNotDisturb === undefined) setDndState(value);
    onDoNotDisturbChange?.(value);
  };
  const mutedSet = useMemo(() => new Set(mutedSources ?? []), [mutedSources]);

  // ─── Pestañas ──────────────────────────────────────────────────────
  const tabList = useMemo(
    () => (tabs === false ? [] : (tabs ?? CN_NOTIFICATION_DEFAULT_TABS)),
    [tabs],
  );
  const [tabState, setTabState] = useState(defaultTab ?? tabList[0]?.id ?? "all");
  const tabId = activeTab ?? tabState;
  const currentTab = tabList.find((t) => t.id === tabId);
  const selectTab = (id: string) => {
    if (activeTab === undefined) setTabState(id);
    onTabChange?.(id);
  };

  // Las pospuestas desaparecen hasta su fecha (se reevalúa cada minuto).
  const active = useMemo(
    () => notifications.filter((n) => !isSnoozed(n, now)),
    [notifications, now],
  );
  const unread = unreadCount ?? active.filter((n) => !n.read).length;
  const filtered = useMemo(() => {
    const byTab = currentTab?.filter ? active.filter(currentTab.filter) : active;
    return query.trim()
      ? byTab.filter((n) => matchesText(notificationSearchText(n), query))
      : byTab;
  }, [active, currentTab, query]);
  const byId = useMemo(() => new Map(notifications.map((n) => [n.id, n])), [notifications]);

  // ─── Tiempo real ───────────────────────────────────────────────────
  const browser = useBrowserNotifications();
  const seenRef = useRef<Set<string> | null>(null);
  const newestRef = useRef<number>(-Infinity);
  const [announcement, setAnnouncement] = useState("");
  const [previewIds, setPreviewIds] = useState<string[]>([]);
  const [freshIds, setFreshIds] = useState<string[]>([]);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    const times = notifications.map(timeOf).filter((t): t is number => t !== null);
    const newest = times.length ? Math.max(...times) : -Infinity;
    if (seenRef.current === null) {
      seenRef.current = new Set(notifications.map((n) => n.id));
      newestRef.current = newest;
      return;
    }
    const seen = seenRef.current;
    const fresh = notifications.filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      const t = timeOf(n);
      // Lo que llega por "cargar más" es más antiguo: no es nuevo.
      return !n.read && !isSnoozed(n) && (t === null || t >= newestRef.current);
    });
    newestRef.current = Math.max(newestRef.current, newest);
    if (fresh.length === 0) return;
    onNewNotifications?.(fresh);
    setFreshIds(fresh.map((n) => n.id));
    // Los orígenes silenciados y "No molestar" no generan alertas.
    const alerting = fresh.filter((n) => !mutedSet.has(notificationSourceKey(n)));
    if (alerting.length === 0) return;
    if (announceNew) {
      setAnnouncement(
        alerting.length === 1
          ? `Nueva notificación: ${toPlainText(alerting[0].title)}`
          : `${alerting.length} notificaciones nuevas`,
      );
    }
    if (dnd) return;
    if (sound) playNotificationChime();
    if (vibrate) vibrateNotification();
    if (preview && !openRef.current && !inline) {
      setPreviewIds((prev) => [...alerting.map((n) => n.id), ...prev.filter((id) => seen.has(id))]);
    }
    if (browserNotifications && typeof document !== "undefined" && document.hidden) {
      alerting.slice(0, 3).forEach((n) =>
        browser.notify(toPlainText(n.title), {
          body: toPlainText(n.message),
          tag: n.id,
          onClick: () => onNotificationClick?.(n),
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  useEffect(() => {
    if (freshIds.length === 0) return;
    const timer = window.setTimeout(() => setFreshIds([]), FRESH_MS);
    return () => window.clearTimeout(timer);
  }, [freshIds]);

  // Al abrir el panel, la vista previa ya no hace falta; "No molestar" también la quita.
  useEffect(() => {
    if (open || dnd) setPreviewIds([]);
  }, [open, dnd]);

  // ─── Atajo de teclado ──────────────────────────────────────────────
  useEffect(() => {
    if (!hotkey || inline) return;
    const onKey = (event: KeyboardEvent) => {
      if (!matchesHotkey(event, hotkey)) return;
      event.preventDefault();
      setOpen(!openRef.current);
      if (openRef.current) anchorRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey, inline, setOpen]);

  const previewItems = previewIds
    .map((id) => byId.get(id))
    .filter((n): n is CnNotification => Boolean(n && !n.read));

  // ─── Acciones ──────────────────────────────────────────────────────
  const shouldClose = closeOnClick ?? !inline;
  const openNotification = (n: CnNotification) => {
    if (markReadOnClick && !n.read) onMarkRead?.([n.id], true);
    onNotificationClick?.(n);
    if (shouldClose && !inline) setOpen(false);
  };

  // ─── Grupos ────────────────────────────────────────────────────────
  const effGroupBy = groupBy ?? (groupByDay ? "day" : "none");
  const lastSeen = toValidDate(lastSeenAt)?.getTime() ?? null;
  const groupKeyOf = useCallback(
    (n: CnNotification): string => {
      if (pinUrgent && n.priority === "urgent" && !n.read) return URGENT;
      const t = timeOf(n);
      if (lastSeen !== null && !n.read && t !== null && t > lastSeen) return NEW;
      if (effGroupBy === "day") {
        const date = toValidDate(n.time);
        return date ? dayKey(date) : "none";
      }
      if (effGroupBy === "source") return `s:${notificationSourceKey(n)}`;
      if (effGroupBy === "category") return `c:${n.category ?? ""}`;
      return REST;
    },
    [pinUrgent, lastSeen, effGroupBy],
  );

  const groupLabels = useMemo(() => {
    const map = new Map<string, string>();
    filtered.forEach((n) => {
      const key = groupKeyOf(n);
      if (map.has(key)) return;
      if (key === URGENT) map.set(key, "Urgentes");
      else if (key === NEW) map.set(key, "Nuevas");
      else if (key === REST) map.set(key, "Anteriores");
      else if (key.startsWith("s:")) map.set(key, toPlainText(n.source) || "Sin origen");
      else if (key.startsWith("c:")) map.set(key, n.category || "Sin categoría");
      else {
        const date = toValidDate(n.time);
        map.set(key, date ? formatDayLabel(date, now) : "Sin fecha");
      }
    });
    return map;
  }, [filtered, groupKeyOf, now]);
  const grouped =
    effGroupBy !== "none" || [...groupLabels.keys()].some((k) => k === URGENT || k === NEW);

  const sourceLabels = useMemo(() => {
    const map = new Map<string, ReactNode>();
    notifications.forEach((n) => {
      const key = notificationSourceKey(n);
      if (key && !map.has(key)) map.set(key, n.source ?? key);
    });
    return map;
  }, [notifications]);

  const listItems = useMemo<CnListItemData[]>(
    () =>
      filtered.map((n) => {
        const date = toValidDate(n.time);
        const sourceKey = notificationSourceKey(n);
        const muted = Boolean(sourceKey) && mutedSet.has(sourceKey);
        const urgent = n.priority === "urgent";
        const actions: CnListAction<CnListItemData>[] = [];
        if (onMarkRead) {
          actions.push({
            id: "toggle-read",
            label: n.read ? "Marcar como no leída" : "Marcar como leída",
            icon: n.read ? "mark_email_unread" : "mark_email_read",
            inline: true,
            onClick: () => onMarkRead([n.id], !n.read),
          });
        }
        (n.actions ?? [])
          .filter((a) => a.appearance !== "button")
          .forEach((a) =>
            actions.push({
              id: `custom-${a.id}`,
              label: a.label,
              icon: a.icon,
              inline: a.inline,
              onClick: () => void a.onClick(n),
            }),
          );
        if (onSnooze) {
          snoozeOptions.forEach((option, i) =>
            actions.push({
              id: `snooze-${option.id}`,
              label: option.label,
              icon: "snooze",
              divider: i === 0 && actions.some((a) => !a.inline),
              onClick: () => onSnooze(n, option.until(new Date())),
            }),
          );
        }
        if (onMuteSource && sourceKey) {
          const name = toPlainText(n.source) || sourceKey;
          actions.push({
            id: "mute",
            label: muted ? `Reactivar «${name}»` : `Silenciar «${name}»`,
            icon: muted ? "volume_up" : "volume_off",
            onClick: () => onMuteSource(sourceKey, !muted),
          });
        }
        if (onDismiss) {
          actions.push({
            id: "dismiss",
            label: "Descartar",
            icon: "delete_outline",
            color: "error",
            divider: actions.some((a) => !a.inline),
            onClick: () => onDismiss(n),
          });
        }
        return {
          id: n.id,
          title: n.title,
          subtitle: n.source,
          description: <NotificationContent notification={n} muted={muted} />,
          avatar: n.avatar ? { name: n.avatar.name, src: n.avatar.src } : undefined,
          icon: n.avatar
            ? undefined
            : {
                name: n.icon ?? (urgent ? "notification_important" : "notifications"),
                color: n.tone ?? (urgent ? "error" : "primary"),
              },
          meta: (
            <>
              {date && (
                <time dateTime={date.toISOString()} title={formatAbsolute(date)}>
                  {formatRelative(date, now)}
                </time>
              )}
              {!n.read && (
                <Box component="span" sx={hiddenSx}>
                  , no leída
                </Box>
              )}
            </>
          ),
          tone: urgent ? "error" : n.priority === "high" ? "warning" : undefined,
          unread: !n.read,
          href: n.href,
          group: groupKeyOf(n),
          actions,
        };
      }),
    [
      filtered,
      onMarkRead,
      onDismiss,
      onSnooze,
      snoozeOptions,
      onMuteSource,
      mutedSet,
      groupKeyOf,
      now,
    ],
  );

  const bulkActions = useMemo<CnListBulkAction<CnListItemData>[]>(() => {
    const pick = (ids: string[]) =>
      ids.map((id) => byId.get(id)).filter((n): n is CnNotification => Boolean(n));
    const list: CnListBulkAction<CnListItemData>[] = [];
    if (onMarkRead) {
      list.push(
        {
          id: "read",
          label: "Marcar leídas",
          icon: "mark_email_read",
          onClick: (_, ids) => onMarkRead(ids, true),
        },
        {
          id: "unread",
          label: "No leídas",
          icon: "mark_email_unread",
          color: "neutral",
          onClick: (_, ids) => onMarkRead(ids, false),
        },
      );
    }
    if (onDismissMany || onDismiss) {
      list.push({
        id: "dismiss",
        label: "Descartar",
        icon: "delete_outline",
        color: "error",
        onClick: (_, ids) => {
          const chosen = pick(ids);
          if (onDismissMany) onDismissMany(chosen);
          else chosen.forEach((n) => onDismiss?.(n));
        },
      });
    }
    return list;
  }, [onMarkRead, onDismiss, onDismissMany, byId]);
  const canSelect = selectable && bulkActions.length > 0;

  // ─── Piezas del panel ──────────────────────────────────────────────
  const settingsButton =
    settings || onSettingsClick || settingsHref ? (
      <CnButton
        iconOnly
        icon="settings"
        size="small"
        variant="text"
        color="neutral"
        aria-label="Configurar notificaciones"
        tooltip
        tooltipProps={{ title: "Configurar notificaciones" }}
        href={settings ? undefined : settingsHref}
        onClick={settings ? () => setView("settings") : onSettingsClick}
        data-cn-notification-settings-button
      />
    ) : null;

  const headerButtons = (
    <>
      {onMarkAllRead && !selecting && (
        <CnButton
          iconOnly
          icon="done_all"
          size="small"
          variant="text"
          color="neutral"
          aria-label="Marcar todas como leídas"
          tooltip
          tooltipProps={{ title: "Marcar todas como leídas" }}
          disabled={unread === 0}
          onClick={onMarkAllRead}
          data-cn-notification-mark-all
        />
      )}
      {canSelect && (
        <CnButton
          iconOnly
          icon={selecting ? "close" : "check_box"}
          size="small"
          variant={selecting ? "outlined" : "text"}
          color={selecting ? "primary" : "neutral"}
          aria-label={selecting ? "Terminar selección" : "Seleccionar notificaciones"}
          aria-pressed={selecting}
          tooltip
          tooltipProps={{ title: selecting ? "Terminar selección" : "Seleccionar" }}
          onClick={() => setSelecting((v) => !v)}
          data-cn-notification-select
        />
      )}
      {settingsButton}
    </>
  );

  const tabsNode =
    tabList.length > 1 ? (
      <CnTabs
        options={tabList.map((t) => {
          const count = t.filter ? active.filter((n) => !n.read && t.filter!(n)).length : unread;
          return { id: t.id, label: t.label, icon: t.icon, badge: count > 0 ? count : undefined };
        })}
        value={tabId}
        onChange={(v) => selectTab(String(v))}
        variant="line"
        size="sm"
        scrollButtons="auto"
        aria-label="Filtrar notificaciones"
      />
    ) : null;

  const subtitle = dnd
    ? `No molestar${unread > 0 ? ` · ${unread} sin leer` : ""}`
    : unread > 0
      ? `${unread} sin leer`
      : "Todo al día";

  const searchNode = searchable && (
    <Box sx={{ px: "12px", pt: "8px", pb: "4px", flexShrink: 0 }}>
      <InputBase
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar notificaciones"
        inputProps={{ "aria-label": "Buscar notificaciones", type: "search" }}
        startAdornment={
          <CnIcon
            name="search"
            size={18}
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
        data-cn-notification-search
        sx={{
          width: "100%",
          height: 34,
          px: "10px",
          fontSize: 13,
          borderRadius: "999px",
          backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
          border: "1px solid var(--cn-color-border, #dde0e4)",
          "&.Mui-focused": {
            backgroundColor: "var(--cn-color-surface, #fff)",
            borderColor: "var(--cn-color-brand-500, #3562a6)",
            boxShadow: "0 0 0 3px rgba(53, 98, 166, 0.15)",
          },
          "& input": { minWidth: 0, textOverflow: "ellipsis" },
          "& input::-webkit-search-cancel-button": { display: "none" },
        }}
      />
    </Box>
  );

  const banners = (
    <StatusBanner
      connection={connection}
      onReconnect={onReconnect}
      doNotDisturb={dnd}
      onDisableDnd={() => setDnd(false)}
    />
  );

  // Animación de entrada de las recién llegadas (sin movimiento si el usuario lo pide).
  const freshSx = Object.fromEntries(
    freshIds.map((id) => [
      `& [data-cn-list-row="i:${id.replace(/"/g, '\\"')}"]`,
      {
        animation: "cn-notification-arrive 1.8s ease-out",
        "@media (prefers-reduced-motion: reduce)": { animation: "cn-notification-flash 1.8s" },
      },
    ]),
  );

  const list = (
    <CnList<CnListItemData>
      items={listItems}
      ariaLabel={currentTab ? `${title}: ${currentTab.label}` : title}
      variant="plain"
      size={useDrawer ? "md" : "sm"}
      dividers="full"
      descriptionLines={6}
      actionsVisibility={isTouch ? "always" : "hover"}
      hideToolbar={!selecting}
      selectionMode={selecting ? "multiple" : "none"}
      bulkActions={selecting ? bulkActions : undefined}
      onItemClick={
        selecting
          ? undefined
          : (item) => {
              const n = byId.get(item.id);
              if (n) openNotification(n);
            }
      }
      groupBy={grouped ? (item) => item.group : undefined}
      getGroupLabel={(key) => groupLabels.get(key) ?? key}
      groupOrder={[URGENT, NEW]}
      collapsibleGroups={collapsibleGroups}
      showGroupCount={collapsibleGroups}
      stickyHeaders
      hasMore={hasMore && !query.trim()}
      onLoadMore={onLoadMore}
      loadingMore={loadingMore}
      skeleton={loading}
      skeletonCount={5}
      error={error}
      onRetry={onRetry}
      emptyIcon={query.trim() ? "search_off" : "notifications_off"}
      emptyTitle={query.trim() ? "Sin resultados" : (currentTab?.emptyTitle ?? emptyTitle)}
      emptyDescription={
        query.trim()
          ? "Ninguna notificación coincide con la búsqueda."
          : (currentTab?.emptyDescription ?? emptyDescription)
      }
      maxHeight={useDrawer ? undefined : listMaxHeight}
      virtualize={useDrawer ? false : "auto"}
      sx={{
        minWidth: 0,
        // El contenido enriquecido recorta su propio mensaje (2 líneas).
        "& [data-cn-list-description]": {
          display: "block",
          WebkitLineClamp: "unset",
          overflow: "visible",
        },
        // En paneles angostos con cursor, las acciones flotan sobre la fila al pasar el
        // cursor en lugar de reservar una columna vacía que estrecha el contenido.
        ...(!isTouch && {
          "@container (max-width: 420px)": {
            "& [data-cn-list-content] > :has(> [data-cn-list-actions])": {
              position: "absolute",
              top: "6px",
              right: "8px",
              zIndex: 2,
            },
            "& [data-cn-list-actions]": {
              borderRadius: "999px",
              backgroundColor: "var(--cn-color-surface, #ffffff)",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.16)",
            },
          },
        }),
        "@keyframes cn-notification-arrive": {
          "0%": {
            opacity: 0,
            transform: "translateY(-6px)",
            backgroundColor: "rgba(53, 98, 166, 0.16)",
          },
          "30%": { opacity: 1, transform: "none" },
          "100%": { backgroundColor: "transparent" },
        },
        "@keyframes cn-notification-flash": {
          "0%": { backgroundColor: "rgba(53, 98, 166, 0.16)" },
          "100%": { backgroundColor: "transparent" },
        },
        ...freshSx,
      }}
    />
  );

  const settingsView = settings && (
    <SettingsView
      settings={settings}
      doNotDisturb={dnd}
      onDoNotDisturbChange={setDnd}
      sound={sound}
      onSoundChange={onSoundChange}
      vibrate={vibrate}
      onVibrateChange={onVibrateChange}
      browser={browser}
      showBrowser={browserNotifications}
      mutedSources={mutedSources ?? []}
      sourceLabels={sourceLabels}
      onMuteSource={onMuteSource}
      moreHref={settingsHref}
      onMore={onSettingsClick}
    />
  );
  const inSettings = view === "settings" && Boolean(settingsView);

  const footerNode =
    !inSettings && (onViewAll || viewAllHref || footerExtra) ? (
      <Box
        data-cn-notification-footer
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          width: "100%",
          minWidth: 0,
        }}
      >
        <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>{footerExtra}</Box>
        {(onViewAll || viewAllHref) && (
          <CnButton
            size="small"
            variant="text"
            color="primary"
            endIcon="arrow_forward"
            href={viewAllHref}
            onClick={() => {
              onViewAll?.();
              if (!inline) setOpen(false);
            }}
          >
            {viewAllLabel}
          </CnButton>
        )}
      </Box>
    ) : null;

  const liveRegion = (
    <Box aria-live="polite" aria-atomic="true" sx={hiddenSx} data-cn-notification-live>
      {announcement}
    </Box>
  );

  const bodyContent = inSettings ? (
    settingsView
  ) : (
    <>
      {banners}
      {searchNode}
      <Box sx={{ flex: "1 1 auto", minHeight: 0, minWidth: 0 }}>{list}</Box>
    </>
  );

  const panelBody = (
    <Box
      data-cn-notification-panel
      data-view={view}
      sx={{
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: 0,
        containerType: "inline-size",
      }}
    >
      <CnOverlayHeader
        titleId={titleId}
        title={inSettings ? "Preferencias" : title}
        subtitle={inSettings ? title : subtitle}
        icon={false}
        headerActions={inSettings ? undefined : headerButtons}
        onBack={inSettings ? () => setView("list") : undefined}
        backLabel="Volver a las notificaciones"
        onClose={inline ? undefined : () => setOpen(false)}
        closeLabel="Cerrar notificaciones"
        padding={16}
        divider={inSettings || !tabsNode}
      >
        {!inSettings && tabsNode && (
          <Box sx={{ mt: "8px", mx: "-16px", minWidth: 0 }}>{tabsNode}</Box>
        )}
      </CnOverlayHeader>
      {bodyContent}
      {footerNode && (
        <Box
          sx={{
            flexShrink: 0,
            px: "12px",
            py: "6px",
            borderTop: "1px solid var(--cn-color-border-subtle, #e9ecef)",
          }}
        >
          {footerNode}
        </Box>
      )}
    </Box>
  );

  // ─── En línea ─────────────────────────────────────────────────────
  if (inline) {
    if (skeleton)
      return (
        <CnNotificationCenterSkeleton
          mode="inline"
          tabs={tabList.length > 1 ? tabList.length : 0}
          search={searchable}
          sx={sx}
          className={className}
        />
      );
    return (
      <Box
        role="region"
        aria-labelledby={titleId}
        className={className}
        data-cn-notification-center="inline"
        sx={[
          {
            minWidth: 0,
            border: "1px solid var(--cn-color-border, #dde0e4)",
            borderRadius: "var(--cn-radius-lg, 12px)",
            backgroundColor: "var(--cn-color-surface, #ffffff)",
            overflow: "hidden",
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {panelBody}
        {liveRegion}
      </Box>
    );
  }

  // ─── Campana ──────────────────────────────────────────────────────
  if (skeleton) return <CnNotificationCenterSkeleton sx={sx} className={className} />;

  const states = [
    dnd ? "no molestar activado" : null,
    connection === "offline" ? "sin conexión" : null,
  ].filter(Boolean);
  const buttonLabel =
    ariaLabel ??
    [
      unread > 0
        ? `${title}, ${unread > maxBadge ? `más de ${maxBadge}` : unread} sin leer`
        : title,
      ...states,
    ].join(", ");

  return (
    <Box
      component="span"
      className={className}
      data-cn-notification-center="button"
      data-dnd={dnd || undefined}
      data-connection={connection}
      sx={[
        { display: "inline-flex", position: "relative", pr: "8px", pt: "4px" },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <CnBadge
        content={unread}
        max={maxBadge}
        color={dnd ? "neutral" : "error"}
        overlap="circular"
        size="sm"
        pulse={freshIds.length > 0 && !dnd}
      >
        <CnButton
          ref={setAnchor}
          iconOnly
          icon={dnd ? "notifications_off" : bellIcon}
          variant="text"
          color="neutral"
          aria-label={buttonLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-keyshortcuts={hotkey ? formatHotkey(hotkey) : undefined}
          tooltip={Boolean(hotkey)}
          tooltipProps={hotkey ? { title: `${title} (${formatHotkey(hotkey)})` } : undefined}
          onClick={() => setOpen(!open)}
          data-cn-notification-bell
        />
      </CnBadge>
      {connection !== "online" && (
        <Box
          aria-hidden
          data-cn-notification-offline-dot
          sx={{
            position: "absolute",
            left: 4,
            bottom: 2,
            width: 8,
            height: 8,
            borderRadius: "50%",
            border: "2px solid var(--cn-color-surface, #ffffff)",
            backgroundColor:
              connection === "offline"
                ? "var(--cn-color-warning-600, #b8831a)"
                : "var(--cn-color-info-600, #2367a8)",
          }}
        />
      )}

      {useDrawer ? (
        <CnDrawer
          open={open}
          onClose={() => setOpen(false)}
          anchor="right"
          size="sm"
          fullScreenOnMobile
          density="compact"
          id={panelId}
          title={inSettings ? "Preferencias" : title}
          subtitle={inSettings ? title : subtitle}
          headerActions={inSettings ? undefined : headerButtons}
          onBack={inSettings ? () => setView("list") : undefined}
          backLabel="Volver a las notificaciones"
          closeLabel="Cerrar notificaciones"
          headerContent={!inSettings && tabsNode && <Box sx={{ mx: "-16px" }}>{tabsNode}</Box>}
          footer={footerNode ?? undefined}
          bodySx={{ px: 0, py: 0, display: "flex", flexDirection: "column" }}
        >
          {bodyContent}
        </CnDrawer>
      ) : (
        <Popover
          open={open && Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              id: panelId,
              role: "dialog",
              "aria-labelledby": titleId,
              sx: {
                mt: "8px",
                width: panelWidth,
                maxWidth: "calc(100vw - 16px)",
                maxHeight: "calc(100vh - 96px)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                borderRadius: "var(--cn-radius-lg, 12px)",
                border: "1px solid var(--cn-color-border, #dde0e4)",
                boxShadow: "var(--cn-shadow-lg, 0 12px 32px rgba(15, 23, 42, 0.18))",
              },
            } as never,
          }}
        >
          {panelBody}
        </Popover>
      )}

      {preview && !open && !dnd && previewItems.length > 0 && (
        <CnNotificationPreview
          anchorEl={anchorEl}
          items={previewItems}
          rotateMs={previewRotateMs}
          onOpen={(n) => {
            setPreviewIds((ids) => ids.filter((id) => id !== n.id));
            openNotification(n);
          }}
          onSkip={(id) => setPreviewIds((ids) => ids.filter((x) => x !== id))}
          onViewAll={() => {
            setPreviewIds([]);
            setOpen(true);
          }}
          onClose={() => setPreviewIds([])}
        />
      )}
      {liveRegion}
    </Box>
  );
};

import Box from "@mui/material/Box";
import Popover from "@mui/material/Popover";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { CnBadge } from "../CnBadge";
import { CnButton } from "../CnButton";
import { CnOverlayHeader } from "../CnDialog/overlay-parts";
import { CnDrawer } from "../CnDrawer";
import { CnList } from "../CnList";
import type { CnListAction, CnListItemData } from "../CnList";
import { nodeText } from "../CnList/list-utils";
import { CnTabs } from "../CnTabs";
import {
  dayKey,
  formatAbsolute,
  formatDayLabel,
  formatRelative,
  toValidDate,
} from "../CnTimeline/timeline-utils";
import type {
  CnNotification,
  CnNotificationCenterProps,
  CnNotificationTab,
} from "./CnNotificationCenter.types";
import { CnNotificationCenterSkeleton } from "./CnNotificationCenterSkeleton";
import { CnNotificationPreview } from "./CnNotificationPreview";
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

const timeOf = (n: CnNotification) => toValidDate(n.time)?.getTime() ?? null;

/**
 * Centro de notificaciones: campana con contador, panel (popover o pantalla
 * completa en móvil) con pestañas, agrupación por día, marcar como
 * leída/no leída, descartar, acciones, carga infinita, tiempo real, vista
 * previa flotante y avisos del navegador. La lista es un `CnList`.
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
  const inline = mode === "inline";
  const useDrawer = !inline && (panel === "drawer" || (panel === "auto" && isSmall));

  const baseId = useId().replace(/:/g, "");
  const titleId = `${baseId}-title`;
  const panelId = `${baseId}-panel`;
  const anchorRef = useRef<HTMLButtonElement | null>(null);

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

  const unread = unreadCount ?? notifications.filter((n) => !n.read).length;
  const filtered = useMemo(
    () => (currentTab?.filter ? notifications.filter(currentTab.filter) : notifications),
    [notifications, currentTab],
  );
  const byId = useMemo(() => new Map(notifications.map((n) => [n.id, n])), [notifications]);

  // ─── Tiempo real ───────────────────────────────────────────────────
  const browser = useBrowserNotifications();
  const seenRef = useRef<Set<string> | null>(null);
  const newestRef = useRef<number>(-Infinity);
  const [announcement, setAnnouncement] = useState("");
  const [previewIds, setPreviewIds] = useState<string[]>([]);
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
      return !n.read && (t === null || t >= newestRef.current);
    });
    newestRef.current = Math.max(newestRef.current, newest);
    if (fresh.length === 0) return;
    onNewNotifications?.(fresh);
    if (announceNew) {
      setAnnouncement(
        fresh.length === 1
          ? `Nueva notificación: ${nodeText(fresh[0].title)}`
          : `${fresh.length} notificaciones nuevas`,
      );
    }
    if (preview && !openRef.current && !inline) {
      setPreviewIds((prev) => [...fresh.map((n) => n.id), ...prev.filter((id) => seen.has(id))]);
    }
    if (browserNotifications && typeof document !== "undefined" && document.hidden) {
      fresh.slice(0, 3).forEach((n) =>
        browser.notify(nodeText(n.title), {
          body: nodeText(n.message),
          tag: n.id,
          onClick: () => onNotificationClick?.(n),
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  // Al abrir el panel, la vista previa ya no hace falta.
  useEffect(() => {
    if (open) setPreviewIds([]);
  }, [open]);

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

  const listItems = useMemo<CnListItemData[]>(
    () =>
      filtered.map((n) => {
        const date = toValidDate(n.time);
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
        (n.actions ?? []).forEach((a) =>
          actions.push({
            id: `custom-${a.id}`,
            label: a.label,
            icon: a.icon,
            inline: a.inline,
            onClick: () => a.onClick(n),
          }),
        );
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
          description: n.message,
          avatar: n.avatar ? { name: n.avatar.name, src: n.avatar.src } : undefined,
          icon: n.avatar
            ? undefined
            : { name: n.icon ?? "notifications", color: n.tone ?? "primary" },
          meta: (
            <>
              {date && (
                <time dateTime={date.toISOString()} title={formatAbsolute(date)}>
                  {formatRelative(date)}
                </time>
              )}
              {!n.read && (
                <Box component="span" sx={hiddenSx}>
                  , no leída
                </Box>
              )}
            </>
          ),
          unread: !n.read,
          group: date ? dayKey(date) : "none",
          actions,
        };
      }),
    [filtered, onMarkRead, onDismiss],
  );

  const groupLabels = useMemo(() => {
    const map = new Map<string, string>();
    filtered.forEach((n) => {
      const date = toValidDate(n.time);
      const key = date ? dayKey(date) : "none";
      if (!map.has(key)) map.set(key, date ? formatDayLabel(date) : "Sin fecha");
    });
    return map;
  }, [filtered]);

  // ─── Piezas del panel ──────────────────────────────────────────────
  const headerButtons = (
    <>
      {onMarkAllRead && (
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
      {(onSettingsClick || settingsHref) && (
        <CnButton
          iconOnly
          icon="settings"
          size="small"
          variant="text"
          color="neutral"
          aria-label="Configurar notificaciones"
          tooltip
          tooltipProps={{ title: "Configurar notificaciones" }}
          href={settingsHref}
          onClick={onSettingsClick}
        />
      )}
    </>
  );

  const tabsNode =
    tabList.length > 1 ? (
      <CnTabs
        options={tabList.map((t) => {
          const count = t.filter
            ? notifications.filter((n) => !n.read && t.filter!(n)).length
            : unread;
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

  const subtitle = unread > 0 ? `${unread} sin leer` : "Todo al día";

  const list = (
    <CnList<CnListItemData>
      items={listItems}
      ariaLabel={currentTab ? `${title}: ${currentTab.label}` : title}
      variant="plain"
      size="sm"
      dividers="full"
      descriptionLines={2}
      actionsVisibility="hover"
      hideToolbar
      onItemClick={(item) => {
        const n = byId.get(item.id);
        if (n) openNotification(n);
      }}
      groupBy={groupByDay ? (item) => item.group : undefined}
      getGroupLabel={(key) => groupLabels.get(key) ?? key}
      showGroupCount={false}
      stickyHeaders
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      loadingMore={loadingMore}
      skeleton={loading}
      skeletonCount={5}
      error={error}
      onRetry={onRetry}
      emptyIcon="notifications_off"
      emptyTitle={currentTab?.emptyTitle ?? emptyTitle}
      emptyDescription={currentTab?.emptyDescription ?? emptyDescription}
      maxHeight={useDrawer ? undefined : listMaxHeight}
      virtualize={useDrawer ? false : "auto"}
      sx={{ minWidth: 0 }}
    />
  );

  const footerNode =
    onViewAll || viewAllHref || footerExtra ? (
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

  const panelBody = (
    <Box
      data-cn-notification-panel
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
        title={title}
        subtitle={subtitle}
        icon={false}
        headerActions={headerButtons}
        onClose={inline ? undefined : () => setOpen(false)}
        closeLabel="Cerrar notificaciones"
        padding={16}
        divider={!tabsNode}
      >
        {tabsNode && <Box sx={{ mt: "8px", mx: "-16px", minWidth: 0 }}>{tabsNode}</Box>}
      </CnOverlayHeader>
      <Box sx={{ flex: "1 1 auto", minHeight: 0, minWidth: 0 }}>{list}</Box>
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
      return <CnNotificationCenterSkeleton mode="inline" sx={sx} className={className} />;
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

  const buttonLabel =
    ariaLabel ??
    (unread > 0
      ? `${title}, ${unread > maxBadge ? `más de ${maxBadge}` : unread} sin leer`
      : title);

  return (
    <Box
      component="span"
      className={className}
      data-cn-notification-center="button"
      sx={[{ display: "inline-flex", pr: "8px", pt: "4px" }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <CnBadge content={unread} max={maxBadge} color="error" overlap="circular" size="sm">
        <CnButton
          ref={anchorRef}
          iconOnly
          icon={bellIcon}
          variant="text"
          color="neutral"
          aria-label={buttonLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => setOpen(!open)}
          data-cn-notification-bell
        />
      </CnBadge>

      {useDrawer ? (
        <CnDrawer
          open={open}
          onClose={() => setOpen(false)}
          anchor="right"
          size="sm"
          fullScreenOnMobile
          density="compact"
          id={panelId}
          title={title}
          subtitle={subtitle}
          headerActions={headerButtons}
          closeLabel="Cerrar notificaciones"
          headerContent={tabsNode && <Box sx={{ mx: "-16px" }}>{tabsNode}</Box>}
          footer={footerNode ?? undefined}
          bodySx={{ px: 0, py: 0 }}
        >
          {list}
        </CnDrawer>
      ) : (
        <Popover
          open={open}
          anchorEl={anchorRef.current}
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

      {preview && !open && previewItems.length > 0 && (
        <CnNotificationPreview
          anchorEl={anchorRef.current}
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

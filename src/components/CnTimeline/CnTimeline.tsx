import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CN_TONES } from "../../utils/tones";
import { CnButton } from "../CnButton";
import { CnEmptyState } from "../CnEmptyState";
import type {
  CnTimelineAlign,
  CnTimelineExportFormat,
  CnTimelineItem,
  CnTimelineOrientation,
  CnTimelineProps,
} from "./CnTimeline.types";
import { CnTimelineSkeleton } from "./CnTimelineSkeleton";
import { downloadTimeline } from "./timeline-export";
import { timelineSearchText } from "./timeline-filters";
import type { ExpandSignal } from "./timeline-parts";
import { hiddenSx, ItemBody, Marker, SIZES, STATUS_DEFAULT_TONE, TimeText } from "./timeline-parts";
import { TimelineToolbar } from "./timeline-toolbar";
import { formatDayLabel, groupByDay, matchesText, useLiveNow } from "./timeline-utils";

export type * from "./CnTimeline.types";

/** A partir de cuántos elementos se delega el pintado fuera de pantalla al navegador. */
const LONG_LIST = 60;

// ─── Ancho del contenedor ─────────────────────────────────────────────────

const useContainerWidth = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      setWidth(w > 0 ? w : null);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─── Avance del seguimiento ──────────────────────────────────────────────

const Progress = ({ items, eta }: { items: readonly CnTimelineItem[]; eta?: ReactNode }) => {
  const steps = items.filter((item) => item.status);
  if (steps.length === 0 && !eta) return null;
  const done = steps.filter((item) => item.status === "completed").length;
  const failed = steps.some((item) => item.status === "error");
  const percent = steps.length ? Math.round((done / steps.length) * 100) : 0;
  const tone = failed ? CN_TONES.error : percent === 100 ? CN_TONES.success : CN_TONES.primary;
  const label = `${done} de ${steps.length} pasos completados`;
  return (
    <Box
      data-cn-timeline-progress
      sx={{ display: "flex", flexDirection: "column", gap: "6px", mb: "16px", minWidth: 0 }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          justifyContent: "space-between",
          columnGap: "12px",
          rowGap: "2px",
          fontSize: 12,
          minWidth: 0,
        }}
      >
        <Box component="span" sx={{ color: "var(--cn-color-text, #222831)", fontWeight: 600 }}>
          {label}
          <Box
            component="span"
            sx={{ ml: "6px", color: tone.main, fontVariantNumeric: "tabular-nums" }}
          >
            {percent}%
          </Box>
        </Box>
        {eta && (
          <Box
            component="span"
            data-cn-timeline-eta
            sx={{
              color: "var(--cn-color-text-muted, #6e7682)",
              overflowWrap: "anywhere",
              minWidth: 0,
            }}
          >
            {eta}
          </Box>
        )}
      </Box>
      {steps.length > 0 && (
        <Box
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          sx={{
            height: 6,
            borderRadius: 3,
            overflow: "hidden",
            backgroundColor:
              "var(--cn-color-tone-neutral-soft, var(--cn-color-neutral-100, #eef0f2))",
            "@media print": { printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" },
          }}
        >
          <Box
            sx={{
              height: "100%",
              width: `${percent}%`,
              borderRadius: 3,
              backgroundColor: tone.main,
              transition: "width 320ms ease",
              "@media (prefers-reduced-motion: reduce)": { transition: "none" },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

// ─── Componente ───────────────────────────────────────────────────────────

/**
 * Historial de actividad, bitácora o seguimiento: vertical (izquierda,
 * derecha, alterno) u horizontal; tiempo relativo que se actualiza solo,
 * agrupación por día con encabezados fijos, búsqueda y filtros, cambios
 * antes → después, comentarios con respuesta, adjuntos como tarjetas,
 * enlace profundo, avance con fecha estimada, exportación y teclado.
 */
export const CnTimeline = ({
  items,
  orientation = "vertical",
  align = "left",
  size = "md",
  groupByDay: groupByDayProp = false,
  stickyHeaders = false,
  stickyOffset = 0,
  formatGroupLabel = formatDayLabel,
  timeFormat = "auto",
  now: nowProp,
  liveInterval = 60000,
  descriptionLines = 3,
  initialVisible,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  loadMoreLabel = "Ver más",
  connector,
  collapseBelow = 560,
  onItemClick,
  searchable = false,
  searchPlaceholder = "Buscar en el historial",
  defaultQuery = "",
  onQueryChange,
  filters = [],
  defaultActiveFilters = [],
  onFiltersChange,
  expandToggle = false,
  exportable = false,
  exportFileName = "historial",
  onExport,
  toolbarExtra,
  showProgress = false,
  eta,
  highlightId,
  onReply,
  attachmentsLayout = "chips",
  skeleton = false,
  skeletonCount = 4,
  error,
  onRetry,
  emptyTitle = "Sin actividad",
  emptyDescription = "Aún no hay eventos para mostrar.",
  emptyIcon = "history",
  ariaLabel = "Línea de tiempo",
  headingLevel = 3,
  sx,
  className,
}: CnTimelineProps) => {
  const baseId = useId().replace(/:/g, "");
  const { ref, width } = useContainerWidth();
  const now = useLiveNow(nowProp, liveInterval);

  // ─── Búsqueda y filtros ──────────────────────────────────────────
  const [query, setQueryState] = useState(defaultQuery);
  const [activeFilters, setActiveFilters] = useState<string[]>([...defaultActiveFilters]);
  const setQuery = (next: string) => {
    setQueryState(next);
    onQueryChange?.(next);
  };
  const commitFilters = (next: string[]) => {
    setActiveFilters(next);
    onFiltersChange?.(next);
  };

  const filtered = useMemo(() => {
    const chosen = filters.filter((f) => activeFilters.includes(f.id));
    if (chosen.length === 0 && !query.trim()) return items;
    return items.filter(
      (item) =>
        (chosen.length === 0 || chosen.some((f) => f.match(item))) &&
        matchesText(timelineSearchText(item), query),
    );
  }, [items, filters, activeFilters, query]);
  const narrowed = filtered.length !== items.length;

  // ─── Paginado local ──────────────────────────────────────────────
  const [limit, setLimit] = useState(initialVisible ?? Infinity);
  useEffect(() => setLimit(initialVisible ?? Infinity), [initialVisible]);
  const highlightIndex = highlightId ? filtered.findIndex((i) => i.id === highlightId) : -1;
  // El enlace profundo amplía el paginado para que el elemento exista.
  const effLimit = highlightIndex >= limit ? highlightIndex + 1 : limit;

  // ─── Expandir todo ───────────────────────────────────────────────
  const [signal, setSignal] = useState<ExpandSignal>({ expanded: false, version: 0 });

  // ─── Teclado (foco itinerante) ───────────────────────────────────
  const [focusId, setFocusId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // ─── Enlace profundo ─────────────────────────────────────────────
  useEffect(() => {
    if (!highlightId) return;
    const el = Array.from(
      ref.current?.querySelectorAll<HTMLElement>("[data-cn-timeline-item]") ?? [],
    ).find((node) => node.dataset.cnTimelineItem === highlightId);
    if (!el || typeof el.scrollIntoView !== "function") return;
    el.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId, highlightIndex >= 0]);

  const narrow = collapseBelow > 0 && width !== null && width < collapseBelow;
  const effOrientation: CnTimelineOrientation = narrow ? "vertical" : orientation;
  const effAlign: CnTimelineAlign =
    effOrientation === "horizontal" ? "left" : narrow && align === "alternate" ? "left" : align;
  const s = SIZES[size];

  const visible = filtered.slice(0, effLimit);
  const hiddenCount = filtered.length - visible.length;
  const showMore = hiddenCount > 0 || (hasMore && Boolean(onLoadMore));
  const longList = filtered.length > LONG_LIST;

  const rootSx = [
    {
      position: "relative",
      minWidth: 0,
      width: "100%",
      boxSizing: "border-box",
      "@media print": { "& [data-cn-timeline-more]": { display: "none" } },
    },
    ...(Array.isArray(sx) ? sx : [sx]),
  ] as SxProps<Theme>;

  if (skeleton) {
    return (
      <Box ref={ref} className={className} sx={rootSx}>
        <CnTimelineSkeleton
          count={skeletonCount}
          orientation={effOrientation}
          align={effAlign}
          size={size}
          groups={groupByDayProp && effOrientation === "vertical"}
          toolbar={searchable || filters.length > 0}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box ref={ref} className={className} sx={rootSx} data-cn-timeline-error>
        <CnEmptyState
          size="sm"
          variant="compact"
          color="error"
          role="alert"
          icon="error_outline"
          title="No se pudo cargar el historial"
          description={error === true ? undefined : error}
          action={
            onRetry && (
              <CnButton
                size="small"
                variant="outlined"
                color="neutral"
                startIcon="refresh"
                onClick={onRetry}
              >
                Reintentar
              </CnButton>
            )
          }
        />
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box ref={ref} className={className} sx={rootSx}>
        <CnEmptyState
          size="sm"
          variant="compact"
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
        />
      </Box>
    );
  }

  const exportFormats: CnTimelineExportFormat[] =
    exportable === true ? ["csv", "json"] : exportable ? [...exportable] : [];
  const hasToolbar =
    searchable ||
    filters.length > 0 ||
    expandToggle ||
    exportFormats.length > 0 ||
    Boolean(toolbarExtra);

  const toolbar = hasToolbar && (
    <TimelineToolbar
      searchable={searchable}
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder={searchPlaceholder}
      filters={filters}
      active={activeFilters}
      onToggleFilter={(id) =>
        commitFilters(
          activeFilters.includes(id)
            ? activeFilters.filter((x) => x !== id)
            : [...activeFilters, id],
        )
      }
      onClearFilters={() => commitFilters([])}
      expandToggle={expandToggle}
      expanded={signal.expanded}
      onToggleExpanded={() => setSignal((p) => ({ expanded: !p.expanded, version: p.version + 1 }))}
      exportFormats={exportFormats}
      onExport={(format) => {
        if (onExport) onExport(format, [...filtered]);
        else downloadTimeline(filtered, format, exportFileName);
      }}
      extra={toolbarExtra}
    />
  );

  const resultsAnnouncement = (searchable || filters.length > 0) && (
    <Box aria-live="polite" sx={hiddenSx} data-cn-timeline-results>
      {narrowed
        ? `${filtered.length} de ${items.length} ${items.length === 1 ? "evento" : "eventos"}`
        : ""}
    </Box>
  );

  const lineFor = (item: CnTimelineItem, next: CnTimelineItem | undefined) => {
    const dashed =
      connector === "dashed" ||
      (connector !== "solid" && (next?.status === "pending" || item.status === "pending"));
    let color = "var(--cn-color-border, #dde0e4)";
    if (item.status === "error") color = CN_TONES.error.border;
    else if (item.status === "completed" && next && next.status !== "pending")
      color = CN_TONES[item.tone ?? (next.status === "error" ? "error" : "success")].border;
    else if (item.status === "completed" && next?.status === "pending")
      color = CN_TONES[item.tone ?? STATUS_DEFAULT_TONE.completed].border;
    return { dashed, color };
  };

  // ─── Teclado ─────────────────────────────────────────────────────
  const tabbableId =
    focusId && visible.some((i) => i.id === focusId) ? focusId : (visible[0]?.id ?? null);
  const onListKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (!target.hasAttribute("data-cn-timeline-item")) return;
    const nodes = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>("[data-cn-timeline-item]") ?? [],
    );
    const index = nodes.indexOf(target);
    const horizontal = effOrientation === "horizontal";
    const nextKey = horizontal ? "ArrowRight" : "ArrowDown";
    const prevKey = horizontal ? "ArrowLeft" : "ArrowUp";
    let next = -1;
    if (event.key === nextKey) next = Math.min(nodes.length - 1, index + 1);
    else if (event.key === prevKey) next = Math.max(0, index - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = nodes.length - 1;
    else if (event.key === "Enter" && onItemClick) {
      const item = visible.find((i) => i.id === target.dataset.cnTimelineItem);
      if (item) {
        event.preventDefault();
        onItemClick(item);
      }
      return;
    }
    if (next < 0 || !nodes[next]) return;
    event.preventDefault();
    nodes[next].focus();
    setFocusId(nodes[next].dataset.cnTimelineItem ?? null);
  };

  const itemProps = (item: CnTimelineItem) => ({
    "data-cn-timeline-item": item.id,
    "data-status": item.status,
    "data-kind": item.kind,
    "data-highlighted": item.id === highlightId || undefined,
    "aria-current": item.status === "current" ? ("step" as const) : undefined,
    tabIndex: item.id === tabbableId ? 0 : -1,
    onFocus: (event: { target: EventTarget; currentTarget: EventTarget }) => {
      if (event.target === event.currentTarget) setFocusId(item.id);
    },
  });

  const itemSx = (item: CnTimelineItem) => ({
    outline: "none",
    borderRadius: "var(--cn-radius-md, 8px)",
    "&:focus-visible": {
      boxShadow: "0 0 0 2px var(--cn-color-field-accent, var(--cn-color-brand-500, #3562a6))",
    },
    "@media print": { breakInside: "avoid" as const },
    ...(longList && { contentVisibility: "auto", containIntrinsicSize: "auto 80px" }),
    ...(item.id === highlightId && {
      backgroundColor: "rgba(53, 98, 166, 0.06)",
      boxShadow: "0 0 0 2px rgba(53, 98, 166, 0.35)",
      animation: "cn-timeline-highlight 1.6s ease-out",
      "@keyframes cn-timeline-highlight": {
        "0%": { backgroundColor: "rgba(53, 98, 166, 0.22)" },
        "100%": { backgroundColor: "rgba(53, 98, 166, 0.06)" },
      },
      "@media (prefers-reduced-motion: reduce)": { animation: "none" },
    }),
  });

  const body = (item: CnTimelineItem, showTime: boolean, textAlign: "left" | "right") => (
    <ItemBody
      item={item}
      baseId={baseId}
      size={size}
      timeFormat={timeFormat}
      now={now}
      descriptionLines={descriptionLines}
      showTime={showTime}
      textAlign={textAlign}
      onItemClick={onItemClick}
      onReply={onReply}
      attachmentsLayout={attachmentsLayout}
      signal={signal}
    />
  );

  const renderVerticalItem = (
    item: CnTimelineItem,
    index: number,
    list: readonly CnTimelineItem[],
    isLastOverall: boolean,
  ) => {
    const next = list[index + 1];
    const last = !next && isLastOverall;
    const line = lineFor(item, next);
    const side: "left" | "right" =
      effAlign === "alternate"
        ? index % 2 === 0
          ? "right"
          : "left"
        : effAlign === "right"
          ? "left"
          : "right";
    const markerCol = (
      <Box
        sx={{
          gridColumn: effAlign === "alternate" ? 2 : effAlign === "right" ? 2 : 1,
          gridRow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: s.marker,
        }}
      >
        <Marker item={item} size={size} />
        {!last && (
          <Box
            aria-hidden
            data-cn-timeline-connector
            sx={{
              flex: 1,
              minHeight: 12,
              mt: "4px",
              borderLeft: `2px ${line.dashed ? "dashed" : "solid"} ${line.color}`,
            }}
          />
        )}
      </Box>
    );
    const content = (
      <Box
        sx={{
          gridColumn:
            effAlign === "alternate" ? (side === "right" ? 3 : 1) : effAlign === "right" ? 1 : 2,
          gridRow: 1,
          minWidth: 0,
          pb: last ? 0 : size === "sm" ? "14px" : "20px",
          pt: `${Math.max(0, (s.marker - s.title * 1.4) / 2)}px`,
        }}
      >
        {body(
          item,
          effAlign !== "alternate",
          effAlign === "right" || (effAlign === "alternate" && side === "left") ? "right" : "left",
        )}
      </Box>
    );
    const opposite = effAlign === "alternate" && (
      <Box
        sx={{
          gridColumn: side === "right" ? 1 : 3,
          gridRow: 1,
          minWidth: 0,
          display: "flex",
          justifyContent: side === "right" ? "flex-end" : "flex-start",
          pt: `${Math.max(0, (s.marker - s.text * 1.4) / 2)}px`,
        }}
      >
        <TimeText item={item} format={timeFormat} now={now} size={s.text} />
      </Box>
    );
    return (
      <Box
        component="li"
        key={item.id}
        {...itemProps(item)}
        sx={{
          display: "grid",
          gridTemplateColumns:
            effAlign === "alternate"
              ? `minmax(0, 1fr) ${s.marker}px minmax(0, 1fr)`
              : effAlign === "right"
                ? `minmax(0, 1fr) ${s.marker}px`
                : `${s.marker}px minmax(0, 1fr)`,
          columnGap: size === "sm" ? "10px" : "14px",
          minWidth: 0,
          ...itemSx(item),
        }}
      >
        {markerCol}
        {content}
        {opposite}
      </Box>
    );
  };

  const listSx = { listStyle: "none", m: 0, p: 0, minWidth: 0 };

  let content: ReactNode;
  if (filtered.length === 0) {
    content = (
      <CnEmptyState
        size="sm"
        variant="compact"
        icon="search_off"
        title="Sin resultados"
        description="Ningún evento coincide con la búsqueda o los filtros."
        action={
          <CnButton
            size="small"
            variant="outlined"
            color="neutral"
            onClick={() => {
              setQuery("");
              commitFilters([]);
            }}
          >
            Limpiar búsqueda y filtros
          </CnButton>
        }
      />
    );
  } else if (effOrientation === "horizontal") {
    content = (
      <Box
        tabIndex={0}
        role="region"
        aria-label={ariaLabel}
        data-cn-timeline-scroller
        sx={{
          overflowX: "auto",
          overflowY: "hidden",
          pb: "6px",
          pt: "2px",
          scrollSnapType: "x proximity",
          outline: "none",
          "&:focus-visible": {
            boxShadow: "0 0 0 2px var(--cn-color-field-accent, var(--cn-color-brand-500, #3562a6))",
          },
          "@media print": { overflow: "visible" },
        }}
      >
        <Box
          component="ol"
          sx={{
            ...listSx,
            display: "flex",
            width: "max-content",
            minWidth: "100%",
            "@media print": { flexWrap: "wrap", width: "auto" },
          }}
        >
          {visible.map((item, index) => {
            const next = visible[index + 1];
            const line = lineFor(item, next);
            const last = !next && !showMore;
            return (
              <Box
                component="li"
                key={item.id}
                {...itemProps(item)}
                sx={{
                  flex: "1 0 auto",
                  width: size === "sm" ? 168 : 208,
                  minWidth: 0,
                  scrollSnapAlign: "start",
                  ...itemSx(item),
                  px: "2px",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: "10px" }}>
                  <Marker item={item} size={size} />
                  {!last && (
                    <Box
                      aria-hidden
                      data-cn-timeline-connector
                      sx={{
                        flex: 1,
                        mx: "6px",
                        borderTop: `2px ${line.dashed ? "dashed" : "solid"} ${line.color}`,
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ pr: "16px", minWidth: 0 }}>{body(item, true, "left")}</Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  } else if (groupByDayProp) {
    const groups = groupByDay(visible, (item) => item.time, now, formatGroupLabel);
    content = (
      <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {groups.map((group, gi) => (
          <Box
            component="section"
            key={group.key}
            aria-labelledby={`${baseId}-g-${group.key}`}
            data-cn-timeline-group={group.key}
          >
            <Box
              id={`${baseId}-g-${group.key}`}
              role="heading"
              aria-level={headingLevel}
              data-cn-timeline-heading
              sx={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "var(--cn-color-text-muted, #6e7682)",
                mb: "10px",
                textAlign:
                  effAlign === "right" ? "right" : effAlign === "alternate" ? "center" : "left",
                overflowWrap: "anywhere",
                ...(stickyHeaders && {
                  position: "sticky",
                  top: stickyOffset,
                  zIndex: 2,
                  py: "6px",
                  // Personalizable cuando el historial vive sobre otro fondo.
                  backgroundColor: "var(--cn-timeline-sticky-bg, var(--cn-color-surface, #ffffff))",
                  "@media print": { position: "static" },
                }),
              }}
            >
              {group.label}
            </Box>
            <Box component="ol" sx={listSx}>
              {group.items.map((item, index) =>
                renderVerticalItem(
                  item,
                  index,
                  group.items,
                  gi === groups.length - 1 ? !showMore : true,
                ),
              )}
            </Box>
          </Box>
        ))}
      </Box>
    );
  } else {
    content = (
      <Box component="ol" aria-label={ariaLabel} sx={listSx}>
        {visible.map((item, index) => renderVerticalItem(item, index, visible, !showMore))}
      </Box>
    );
  }

  return (
    <Box
      ref={ref}
      data-cn-timeline={effOrientation}
      data-align={effAlign}
      role={groupByDayProp && effOrientation === "vertical" ? "region" : undefined}
      aria-label={groupByDayProp && effOrientation === "vertical" ? ariaLabel : undefined}
      aria-busy={loadingMore || undefined}
      className={className}
      sx={rootSx}
    >
      {toolbar}
      {resultsAnnouncement}
      {showProgress && <Progress items={items} eta={eta} />}
      <Box ref={listRef} onKeyDown={onListKeyDown} sx={{ minWidth: 0 }}>
        {content}
      </Box>
      {showMore && filtered.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent:
              effAlign === "alternate"
                ? "center"
                : effAlign === "right"
                  ? "flex-end"
                  : "flex-start",
            mt: "8px",
            pl: effOrientation === "vertical" && effAlign === "left" ? `${s.marker + 14}px` : 0,
          }}
        >
          <CnButton
            size="small"
            variant="outlined"
            color="neutral"
            endIcon="expand_more"
            loading={loadingMore}
            data-cn-timeline-more
            onClick={() => {
              if (hiddenCount > 0) setLimit(effLimit + (initialVisible ?? filtered.length));
              else onLoadMore?.();
            }}
          >
            {hiddenCount > 0 ? `${loadMoreLabel} (${hiddenCount})` : loadMoreLabel}
          </CnButton>
        </Box>
      )}
    </Box>
  );
};

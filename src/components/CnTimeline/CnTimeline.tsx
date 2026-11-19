import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { isValidElement, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CnTone } from "../../utils/tones";
import { CN_TONES } from "../../utils/tones";
import { CnAvatar } from "../CnAvatar";
import { CnButton } from "../CnButton";
import { CnChip } from "../CnChip";
import type { CnChipColor } from "../CnChip";
import { CnEmptyState } from "../CnEmptyState";
import { CnIcon } from "../CnIcon";
import { CnTimelineSkeleton } from "./CnTimelineSkeleton";
import type { CnDateInput } from "./timeline-utils";
import {
  formatAbsolute,
  formatClock,
  formatDayLabel,
  formatRelative,
  groupByDay,
  toValidDate,
} from "./timeline-utils";

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

export type CnTimelineAttachment = {
  id?: string;
  name: string;
  href?: string;
  /** Texto auxiliar ("1.2 MB"). */
  size?: string;
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

export type CnTimelineTag = string | { label: string; color?: CnChipColor; icon?: string };

export type CnTimelineItem = {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Contenido libre bajo la descripción (diff, tarjeta, imagen…). */
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
  tags?: readonly CnTimelineTag[];
  metadata?: readonly { label: ReactNode; value: ReactNode }[];
  attachments?: readonly CnTimelineAttachment[];
  actions?: readonly CnTimelineAction[];
};

export type CnTimelineProps = {
  items: readonly CnTimelineItem[];
  orientation?: CnTimelineOrientation;
  align?: CnTimelineAlign;
  size?: CnTimelineSize;
  /** Agrupa por día con encabezados "Hoy", "Ayer", fecha (solo vertical). */
  groupByDay?: boolean;
  formatGroupLabel?: (date: Date, now: Date) => string;
  timeFormat?: CnTimelineTimeFormat;
  /** Fecha de referencia para los relativos (pruebas, zonas). */
  now?: Date;
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

  skeleton?: boolean;
  skeletonCount?: number;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  emptyIcon?: string;

  ariaLabel?: string;
  /** Nivel de encabezado de los grupos por día. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  sx?: SxProps<Theme>;
  className?: string;
};

const STATUS_DEFAULT_TONE: Record<CnTimelineStatus, CnTone> = {
  completed: "success",
  current: "primary",
  pending: "neutral",
  error: "error",
};
const STATUS_ICON: Record<CnTimelineStatus, string> = {
  completed: "check",
  current: "radio_button_checked",
  pending: "schedule",
  error: "priority_high",
};
const STATUS_LABEL: Record<CnTimelineStatus, string> = {
  completed: "Completado",
  current: "En curso",
  pending: "Pendiente",
  error: "Con error",
};

const SIZES: Record<CnTimelineSize, { marker: number; dot: number; title: number; text: number }> =
  {
    sm: { marker: 24, dot: 10, title: 12, text: 12 },
    md: { marker: 32, dot: 12, title: 13, text: 13 },
  };

const hiddenSx = {
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;

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

// ─── Tiempo ───────────────────────────────────────────────────────────────

const TimeText = ({
  item,
  format,
  now,
  size,
}: {
  item: CnTimelineItem;
  format: CnTimelineTimeFormat;
  now: Date;
  size: number;
}) => {
  const date = toValidDate(item.time);
  if (!date && item.timeLabel == null) return null;
  let text: ReactNode = item.timeLabel;
  if (text == null && date) {
    const recent = Math.abs(now.getTime() - date.getTime()) < 7 * 86400000;
    text =
      format === "relative" || (format === "auto" && recent)
        ? formatRelative(date, now)
        : format === "time"
          ? formatClock(date)
          : formatAbsolute(date);
  }
  return (
    <Box
      component={date ? "time" : "span"}
      dateTime={date ? date.toISOString() : undefined}
      title={date ? formatAbsolute(date) : undefined}
      data-cn-timeline-time
      sx={{
        fontSize: size - 1,
        color: "var(--cn-color-text-muted, #6e7682)",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {text}
    </Box>
  );
};

// ─── Descripción plegable ────────────────────────────────────────────────

const Description = ({
  children,
  lines,
  size,
  id,
}: {
  children: ReactNode;
  lines: number;
  size: number;
  id: string;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || lines <= 0) return;
    const measure = () => {
      if (expanded) return;
      setOverflowing(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [lines, expanded, children]);

  const clamp = lines > 0 && !expanded;
  return (
    <Box>
      <Box
        ref={ref}
        id={id}
        data-cn-timeline-description
        sx={{
          fontSize: size,
          lineHeight: 1.5,
          color: "var(--cn-color-text-secondary, #4e5660)",
          overflowWrap: "anywhere",
          whiteSpace: "pre-line",
          ...(clamp && {
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: lines,
            overflow: "hidden",
          }),
        }}
      >
        {children}
      </Box>
      {(overflowing || expanded) && (
        <ButtonBase
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((v) => !v)}
          data-cn-timeline-toggle
          sx={{
            mt: "2px",
            fontSize: size - 1,
            fontWeight: 600,
            color: "var(--cn-color-brand-600, #254d87)",
            borderRadius: "4px",
            "&:hover": { textDecoration: "underline" },
            "&.Mui-focusVisible": { outline: "2px solid var(--cn-color-brand-500, #3562a6)" },
          }}
        >
          {expanded ? "Ver menos" : "Ver más"}
        </ButtonBase>
      )}
    </Box>
  );
};

// ─── Marcador ─────────────────────────────────────────────────────────────

const Marker = ({ item, size }: { item: CnTimelineItem; size: CnTimelineSize }) => {
  const s = SIZES[size];
  const toneName = item.tone ?? (item.status ? STATUS_DEFAULT_TONE[item.status] : "neutral");
  const tone = CN_TONES[toneName];
  const statusLabel = item.status ? (
    <Box component="span" sx={hiddenSx}>
      {STATUS_LABEL[item.status]}
    </Box>
  ) : null;

  if (item.avatar) {
    const isNode = isValidElement(item.avatar);
    const data = item.avatar as { name?: string; src?: string };
    return (
      <Box data-cn-timeline-marker="avatar" sx={{ display: "flex", position: "relative" }}>
        {isNode ? (
          (item.avatar as ReactNode)
        ) : (
          <CnAvatar name={data.name} src={data.src} size={s.marker} />
        )}
        {statusLabel}
      </Box>
    );
  }

  const icon = item.icon ?? (item.status ? STATUS_ICON[item.status] : undefined);
  if (!icon) {
    return (
      <Box
        data-cn-timeline-marker="dot"
        sx={{
          position: "relative",
          width: s.marker,
          height: s.marker,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: s.dot,
            height: s.dot,
            borderRadius: "50%",
            backgroundColor:
              toneName === "neutral" ? "var(--cn-color-neutral-400, #9aa1aa)" : tone.main,
            boxShadow: `0 0 0 3px ${tone.soft}`,
          }}
        />
        {statusLabel}
      </Box>
    );
  }

  const filled = item.status === "completed" || item.status === "error";
  const pending = item.status === "pending";
  const current = item.status === "current";
  return (
    <Box
      data-cn-timeline-marker={item.status ?? "icon"}
      sx={{
        position: "relative",
        width: s.marker,
        height: s.marker,
        borderRadius: "50%",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: filled ? tone.onSolid : pending ? "var(--cn-color-text-subtle, #9aa1aa)" : tone.main,
        backgroundColor: filled
          ? tone.solid
          : pending
            ? "var(--cn-color-surface, #ffffff)"
            : tone.soft,
        border: pending
          ? "2px dashed var(--cn-color-border-strong, #c5cad0)"
          : current
            ? `2px solid ${tone.main}`
            : "none",
        boxShadow: current ? `0 0 0 4px ${tone.soft}` : "none",
      }}
    >
      <CnIcon name={icon} size={size === "sm" ? 14 : 16} />
      {statusLabel}
    </Box>
  );
};

// ─── Cuerpo del elemento ─────────────────────────────────────────────────

const ItemBody = ({
  item,
  baseId,
  size,
  timeFormat,
  now,
  descriptionLines,
  showTime,
  textAlign,
  onItemClick,
}: {
  item: CnTimelineItem;
  baseId: string;
  size: CnTimelineSize;
  timeFormat: CnTimelineTimeFormat;
  now: Date;
  descriptionLines: number;
  showTime: boolean;
  textAlign: "left" | "right";
  onItemClick?: (item: CnTimelineItem) => void;
}) => {
  const s = SIZES[size];
  const pending = item.status === "pending";
  const justify = textAlign === "right" ? "flex-end" : "flex-start";
  const titleSx = {
    fontSize: s.title,
    fontWeight: item.status === "current" ? 700 : 600,
    lineHeight: 1.4,
    color: pending ? "var(--cn-color-text-muted, #6e7682)" : "var(--cn-color-text, #222831)",
    overflowWrap: "anywhere" as const,
    minWidth: 0,
    textAlign,
  };
  return (
    <Box
      data-cn-timeline-body
      sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "4px", textAlign }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          justifyContent: textAlign === "right" ? "flex-start" : "space-between",
          columnGap: "8px",
          rowGap: "2px",
          minWidth: 0,
          flexDirection: textAlign === "right" ? "row-reverse" : "row",
        }}
      >
        {onItemClick ? (
          <ButtonBase
            onClick={() => onItemClick(item)}
            data-cn-timeline-title
            sx={{
              ...titleSx,
              display: "inline",
              borderRadius: "4px",
              "&:hover": { textDecoration: "underline" },
              "&.Mui-focusVisible": { outline: "2px solid var(--cn-color-brand-500, #3562a6)" },
            }}
          >
            {item.title}
          </ButtonBase>
        ) : (
          <Typography component="div" data-cn-timeline-title sx={titleSx}>
            {item.title}
          </Typography>
        )}
        {showTime && <TimeText item={item} format={timeFormat} now={now} size={s.text} />}
      </Box>
      {item.actor && (
        <Box
          sx={{
            fontSize: s.text - 1,
            color: "var(--cn-color-text-muted, #6e7682)",
            overflowWrap: "anywhere",
          }}
        >
          {typeof item.actor === "string" ? (
            <>
              por <strong>{item.actor}</strong>
            </>
          ) : (
            item.actor
          )}
        </Box>
      )}
      {item.tags && item.tags.length > 0 && (
        <Box
          data-cn-timeline-tags
          sx={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: justify }}
        >
          {item.tags.map((tag, i) => {
            const t = typeof tag === "string" ? { label: tag } : tag;
            return (
              <CnChip
                key={i}
                size="small"
                variant="soft"
                color={t.color ?? "neutral"}
                icon={t.icon}
                label={t.label}
                sx={{ maxWidth: "100%" }}
              />
            );
          })}
        </Box>
      )}
      {item.description != null && (
        <Description id={`${baseId}-${item.id}-desc`} lines={descriptionLines} size={s.text}>
          {item.description}
        </Description>
      )}
      {item.content && <Box sx={{ minWidth: 0, mt: "4px" }}>{item.content}</Box>}
      {item.metadata && item.metadata.length > 0 && (
        <Box
          component="dl"
          data-cn-timeline-metadata
          sx={{
            m: 0,
            mt: "2px",
            display: "grid",
            gridTemplateColumns: "minmax(0, max-content) minmax(0, 1fr)",
            columnGap: "10px",
            rowGap: "2px",
            fontSize: s.text - 1,
            textAlign: "left",
          }}
        >
          {item.metadata.map((entry, i) => (
            <Box key={i} sx={{ display: "contents" }}>
              <Box
                component="dt"
                sx={{ color: "var(--cn-color-text-muted, #6e7682)", overflowWrap: "anywhere" }}
              >
                {entry.label}
              </Box>
              <Box
                component="dd"
                sx={{ m: 0, color: "var(--cn-color-text, #222831)", overflowWrap: "anywhere" }}
              >
                {entry.value}
              </Box>
            </Box>
          ))}
        </Box>
      )}
      {item.attachments && item.attachments.length > 0 && (
        <Box
          component="ul"
          aria-label="Adjuntos"
          data-cn-timeline-attachments
          sx={{
            listStyle: "none",
            m: 0,
            p: 0,
            mt: "2px",
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            justifyContent: justify,
          }}
        >
          {item.attachments.map((file, i) => {
            const inner = (
              <>
                <CnIcon name={file.icon ?? "attach_file"} size={14} />
                <Box
                  component="span"
                  sx={{
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file.name}
                </Box>
                {file.size && (
                  <Box
                    component="span"
                    sx={{ color: "var(--cn-color-text-muted, #6e7682)", flexShrink: 0 }}
                  >
                    {file.size}
                  </Box>
                )}
              </>
            );
            const chipSx = {
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              maxWidth: "100%",
              minWidth: 0,
              px: "8px",
              py: "4px",
              fontSize: s.text - 1,
              borderRadius: "var(--cn-radius-md, 8px)",
              border: "1px solid var(--cn-color-border, #dde0e4)",
              backgroundColor: "var(--cn-color-surface, #ffffff)",
              color: "var(--cn-color-text, #222831)",
              textDecoration: "none",
            };
            return (
              <Box
                component="li"
                key={file.id ?? i}
                sx={{ display: "flex", maxWidth: "100%", minWidth: 0 }}
              >
                {file.href || file.onClick ? (
                  <ButtonBase
                    {...(file.href
                      ? {
                          component: "a",
                          href: file.href,
                          target: "_blank",
                          rel: "noopener noreferrer",
                        }
                      : {})}
                    onClick={file.onClick}
                    title={file.name}
                    sx={{
                      ...chipSx,
                      "&:hover": { backgroundColor: "var(--cn-color-neutral-50, #f8f9fa)" },
                      "&.Mui-focusVisible": {
                        outline: "2px solid var(--cn-color-brand-500, #3562a6)",
                      },
                    }}
                  >
                    {inner}
                  </ButtonBase>
                ) : (
                  <Box title={file.name} sx={chipSx}>
                    {inner}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}
      {item.actions && item.actions.length > 0 && (
        <Box
          data-cn-timeline-actions
          sx={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: justify, mt: "2px" }}
        >
          {item.actions.map((action, i) => (
            <CnButton
              key={action.id ?? i}
              size="small"
              variant="text"
              color="primary"
              startIcon={action.icon}
              href={action.href}
              onClick={action.onClick}
              sx={{ maxWidth: "100%" }}
            >
              {action.label}
            </CnButton>
          ))}
        </Box>
      )}
    </Box>
  );
};

// ─── Componente ───────────────────────────────────────────────────────────

/**
 * Historial de actividad, bitácora o seguimiento: vertical (izquierda,
 * derecha, alterno) u horizontal; tiempo relativo/absoluto, agrupación por
 * día, estados de seguimiento, metadatos, adjuntos, acciones y "Ver más".
 */
export const CnTimeline = ({
  items,
  orientation = "vertical",
  align = "left",
  size = "md",
  groupByDay: groupByDayProp = false,
  formatGroupLabel = formatDayLabel,
  timeFormat = "auto",
  now: nowProp,
  descriptionLines = 3,
  initialVisible,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  loadMoreLabel = "Ver más",
  connector,
  collapseBelow = 560,
  onItemClick,
  skeleton = false,
  skeletonCount = 4,
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
  const [limit, setLimit] = useState(initialVisible ?? Infinity);
  useEffect(() => setLimit(initialVisible ?? Infinity), [initialVisible]);

  const now = nowProp ?? new Date();
  const narrow = collapseBelow > 0 && width !== null && width < collapseBelow;
  const effOrientation: CnTimelineOrientation = narrow ? "vertical" : orientation;
  const effAlign: CnTimelineAlign =
    effOrientation === "horizontal" ? "left" : narrow && align === "alternate" ? "left" : align;
  const s = SIZES[size];

  const visible = items.slice(0, limit);
  const hiddenCount = items.length - visible.length;
  const showMore = hiddenCount > 0 || (hasMore && Boolean(onLoadMore));

  const rootSx = [
    { position: "relative", minWidth: 0, width: "100%", boxSizing: "border-box" },
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

  const lineFor = (item: CnTimelineItem, next: CnTimelineItem | undefined) => {
    const dashed =
      connector === "dashed" ||
      (connector !== "solid" && (next?.status === "pending" || item.status === "pending"));
    const reached = item.status === "completed" && next && next.status !== "pending";
    return {
      dashed,
      color: reached ? CN_TONES[item.tone ?? "success"].border : "var(--cn-color-border, #dde0e4)",
    };
  };

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
    const body = (
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
        <ItemBody
          item={item}
          baseId={baseId}
          size={size}
          timeFormat={timeFormat}
          now={now}
          descriptionLines={descriptionLines}
          showTime={effAlign !== "alternate"}
          textAlign={
            effAlign === "right" || (effAlign === "alternate" && side === "left") ? "right" : "left"
          }
          onItemClick={onItemClick}
        />
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
        data-cn-timeline-item={item.id}
        data-status={item.status}
        aria-current={item.status === "current" ? "step" : undefined}
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
        }}
      >
        {markerCol}
        {body}
        {opposite}
      </Box>
    );
  };

  const listSx = { listStyle: "none", m: 0, p: 0, minWidth: 0 };

  let content: ReactNode;
  if (effOrientation === "horizontal") {
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
          scrollSnapType: "x proximity",
          outline: "none",
          "&:focus-visible": { boxShadow: "0 0 0 2px var(--cn-color-brand-500, #3562a6)" },
        }}
      >
        <Box
          component="ol"
          sx={{ ...listSx, display: "flex", width: "max-content", minWidth: "100%" }}
        >
          {visible.map((item, index) => {
            const next = visible[index + 1];
            const line = lineFor(item, next);
            const last = !next && !showMore;
            return (
              <Box
                component="li"
                key={item.id}
                data-cn-timeline-item={item.id}
                data-status={item.status}
                aria-current={item.status === "current" ? "step" : undefined}
                sx={{
                  flex: "1 0 auto",
                  width: size === "sm" ? 168 : 208,
                  minWidth: 0,
                  scrollSnapAlign: "start",
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
                <Box sx={{ pr: "16px", minWidth: 0 }}>
                  <ItemBody
                    item={item}
                    baseId={baseId}
                    size={size}
                    timeFormat={timeFormat}
                    now={now}
                    descriptionLines={descriptionLines}
                    showTime
                    textAlign="left"
                    onItemClick={onItemClick}
                  />
                </Box>
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
      {content}
      {showMore && (
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
              if (hiddenCount > 0) setLimit((l) => l + (initialVisible ?? items.length));
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

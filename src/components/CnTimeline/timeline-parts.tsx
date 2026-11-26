import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { isValidElement, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CnTone } from "../../utils/tones";
import { CN_TONES } from "../../utils/tones";
import { CnAvatar } from "../CnAvatar";
import { CnButton } from "../CnButton";
import { CnChip } from "../CnChip";
import { CnDocCard } from "../CnDocCard";
import { CnIcon } from "../CnIcon";
import { CnTextField } from "../CnTextField";
import type {
  CnTimelineAttachment,
  CnTimelineChange,
  CnTimelineItem,
  CnTimelineSize,
  CnTimelineStatus,
  CnTimelineTimeFormat,
} from "./CnTimeline.types";
import { formatAbsolute, formatClock, formatRelative, toValidDate } from "./timeline-utils";

/*
 * Piezas de `CnTimeline`: marcador, tiempo, descripción plegable, cambios
 * (antes → después), adjuntos, acciones y respuesta a comentarios.
 */

export const STATUS_DEFAULT_TONE: Record<CnTimelineStatus, CnTone> = {
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
export const STATUS_LABEL: Record<CnTimelineStatus, string> = {
  completed: "Completado",
  current: "En curso",
  pending: "Pendiente",
  error: "Con error",
};

export const SIZES: Record<
  CnTimelineSize,
  { marker: number; dot: number; title: number; text: number }
> = {
  sm: { marker: 24, dot: 10, title: 12, text: 12 },
  md: { marker: 32, dot: 12, title: 13, text: 13 },
};

export const hiddenSx = {
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;

const focusRing = {
  outline: "2px solid var(--cn-color-field-accent, var(--cn-color-brand-500, #3562a6))",
  outlineOffset: 1,
};

/** Señal de "Expandir todo / Contraer todo": cada clic sube `version`. */
export type ExpandSignal = { expanded: boolean; version: number };

// ─── Tiempo ───────────────────────────────────────────────────────────────

export const TimeText = ({
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
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {text}
    </Box>
  );
};

// ─── Descripción plegable ────────────────────────────────────────────────

export const Description = ({
  children,
  lines,
  size,
  id,
  signal,
  bubble = false,
}: {
  children: ReactNode;
  lines: number;
  size: number;
  id: string;
  signal?: ExpandSignal;
  bubble?: boolean;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    if (signal && signal.version > 0) setExpanded(signal.expanded);
  }, [signal]);

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
    <Box
      data-cn-timeline-bubble={bubble || undefined}
      sx={
        bubble
          ? {
              alignSelf: "stretch",
              px: "12px",
              py: "8px",
              borderRadius: "4px 12px 12px 12px",
              backgroundColor: "var(--cn-color-bg, var(--cn-color-neutral-50, #f8f9fa))",
              border: "1px solid var(--cn-color-border-subtle, #e9ecef)",
              minWidth: 0,
            }
          : undefined
      }
    >
      <Box
        ref={ref}
        id={id}
        data-cn-timeline-description
        sx={{
          fontSize: size,
          lineHeight: 1.5,
          color: bubble
            ? "var(--cn-color-text, #222831)"
            : "var(--cn-color-text-secondary, #4e5660)",
          overflowWrap: "anywhere",
          whiteSpace: "pre-line",
          ...(clamp && {
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: lines,
            overflow: "hidden",
          }),
          "@media print": { display: "block", overflow: "visible", WebkitLineClamp: "unset" },
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
            color: "var(--cn-color-control-primary-fg, var(--cn-color-brand-600, #254d87))",
            borderRadius: "4px",
            "&:hover": { textDecoration: "underline" },
            "&.Mui-focusVisible": focusRing,
            "@media print": { display: "none" },
          }}
        >
          {expanded ? "Ver menos" : "Ver más"}
        </ButtonBase>
      )}
    </Box>
  );
};

// ─── Marcador ─────────────────────────────────────────────────────────────

export const Marker = ({ item, size }: { item: CnTimelineItem; size: CnTimelineSize }) => {
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

  const icon =
    item.icon ??
    (item.status ? STATUS_ICON[item.status] : item.kind === "comment" ? "chat" : undefined);
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
              toneName === "neutral"
                ? "var(--cn-color-text-subtle, var(--cn-color-neutral-400, #9aa1aa))"
                : tone.main,
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
        "@media print": { printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" },
      }}
    >
      <CnIcon name={icon} size={size === "sm" ? 14 : 16} />
      {statusLabel}
    </Box>
  );
};

// ─── Cambios (antes → después) ───────────────────────────────────────────

const Changes = ({ changes, size }: { changes: readonly CnTimelineChange[]; size: number }) => {
  const value = (node: ReactNode, kind: "before" | "after") => {
    const empty = node === null || node === undefined || node === "";
    return (
      <Box
        component={empty ? "span" : kind === "before" ? "del" : "ins"}
        data-cn-timeline-change-value={kind}
        sx={{
          minWidth: 0,
          px: "10px",
          py: "1px",
          borderRadius: "4px",
          overflowWrap: "anywhere",
          textDecoration: kind === "before" && !empty ? "line-through" : "none",
          fontStyle: empty ? "italic" : "normal",
          color: empty
            ? "var(--cn-color-text-subtle, #9aa1aa)"
            : kind === "before"
              ? "var(--cn-color-control-error-fg-strong, var(--cn-color-error-700, #8f2424))"
              : "var(--cn-color-control-success-fg-strong, var(--cn-color-success-700, #1b6b33))",
          backgroundColor: empty
            ? "transparent"
            : kind === "before"
              ? CN_TONES.error.soft
              : CN_TONES.success.soft,
        }}
      >
        <Box component="span" sx={hiddenSx}>
          {kind === "before" ? "Antes: " : "Después: "}
        </Box>
        {empty ? "vacío" : node}
      </Box>
    );
  };
  return (
    <Box
      component="ul"
      aria-label="Cambios"
      data-cn-timeline-changes
      sx={{
        listStyle: "none",
        m: 0,
        mt: "2px",
        p: "8px 10px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        fontSize: size - 1,
        textAlign: "left",
        borderRadius: "var(--cn-radius-md, 8px)",
        border: "1px solid var(--cn-color-border-subtle, #e9ecef)",
        backgroundColor: "var(--cn-color-surface, #ffffff)",
        minWidth: 0,
      }}
    >
      {changes.map((change, i) => (
        <Box
          component="li"
          key={i}
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            columnGap: "6px",
            rowGap: "2px",
            minWidth: 0,
          }}
        >
          <Box
            component="span"
            sx={{
              fontWeight: 600,
              color: "var(--cn-color-text, #222831)",
              overflowWrap: "anywhere",
              minWidth: 0,
              mr: "2px",
            }}
          >
            {change.field}
          </Box>
          {value(change.before, "before")}
          <CnIcon
            name="arrow_forward"
            size={12}
            sx={{ color: "var(--cn-color-text-subtle, #9aa1aa)", alignSelf: "center" }}
          />
          {value(change.after, "after")}
        </Box>
      ))}
    </Box>
  );
};

// ─── Adjuntos ─────────────────────────────────────────────────────────────

const Attachments = ({
  files,
  size,
  justify,
  layout,
}: {
  files: readonly CnTimelineAttachment[];
  size: number;
  justify: string;
  layout: "chips" | "cards";
}) => {
  if (layout === "cards") {
    return (
      <Box
        component="ul"
        aria-label="Adjuntos"
        data-cn-timeline-attachments="cards"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          mt: "2px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))",
          gap: "8px",
          minWidth: 0,
          textAlign: "left",
        }}
      >
        {files.map((file, i) => (
          <Box component="li" key={file.id ?? i} sx={{ minWidth: 0 }}>
            <CnDocCard
              layout="compact"
              name={file.name}
              url={file.href}
              mime={file.mime}
              size={file.bytes}
              thumbnailUrl={file.thumbnailUrl}
              meta={file.bytes === undefined ? file.size : undefined}
              onClick={file.onClick}
              downloadable={Boolean(file.href)}
            />
          </Box>
        ))}
      </Box>
    );
  }
  return (
    <Box
      component="ul"
      aria-label="Adjuntos"
      data-cn-timeline-attachments="chips"
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
      {files.map((file, i) => {
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
          boxSizing: "border-box" as const,
          px: "8px",
          py: "4px",
          fontSize: size - 1,
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
                  "&:hover": {
                    backgroundColor: "var(--cn-color-bg, var(--cn-color-neutral-50, #f8f9fa))",
                  },
                  "&.Mui-focusVisible": focusRing,
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
  );
};

// ─── Respuesta ────────────────────────────────────────────────────────────

const ReplyBox = ({
  item,
  onReply,
  justify,
}: {
  item: CnTimelineItem;
  onReply: (item: CnTimelineItem, text: string) => void | Promise<void>;
  justify: string;
}) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const send = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setFailed(false);
    try {
      await onReply(item, value);
      setText("");
      setOpen(false);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <Box sx={{ display: "flex", justifyContent: justify, "@media print": { display: "none" } }}>
        <CnButton
          size="small"
          variant="text"
          color="primary"
          startIcon="reply"
          onClick={() => setOpen(true)}
          data-cn-timeline-reply
        >
          Responder
        </CnButton>
      </Box>
    );
  }
  return (
    <Box
      data-cn-timeline-reply-box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        mt: "4px",
        minWidth: 0,
        textAlign: "left",
        "@media print": { display: "none" },
      }}
    >
      <CnTextField
        label="Respuesta"
        multiline
        minRows={2}
        maxRows={6}
        size="sm"
        autoFocus
        value={text}
        onChange={setText}
        internalValidation={false}
        error={failed}
        helperText={failed ? "No se pudo enviar. Inténtalo de nuevo." : undefined}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            void send();
          } else if (event.key === "Escape") {
            event.stopPropagation();
            setOpen(false);
          }
        }}
      />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "flex-end" }}>
        <CnButton size="small" variant="text" color="neutral" onClick={() => setOpen(false)}>
          Cancelar
        </CnButton>
        <CnButton
          size="small"
          variant="contained"
          color="primary"
          startIcon="send"
          loading={sending}
          disabled={!text.trim()}
          onClick={() => void send()}
        >
          Enviar
        </CnButton>
      </Box>
    </Box>
  );
};

// ─── Cuerpo del elemento ─────────────────────────────────────────────────

export const ItemBody = ({
  item,
  baseId,
  size,
  timeFormat,
  now,
  descriptionLines,
  showTime,
  textAlign,
  onItemClick,
  onReply,
  attachmentsLayout,
  signal,
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
  onReply?: (item: CnTimelineItem, text: string) => void | Promise<void>;
  attachmentsLayout: "chips" | "cards";
  signal?: ExpandSignal;
}) => {
  const s = SIZES[size];
  const pending = item.status === "pending";
  const comment = item.kind === "comment";
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
              "&.Mui-focusVisible": focusRing,
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
        <Description
          id={`${baseId}-${item.id}-desc`}
          lines={descriptionLines}
          size={s.text}
          signal={signal}
          bubble={comment}
        >
          {item.description}
        </Description>
      )}
      {item.changes && item.changes.length > 0 && <Changes changes={item.changes} size={s.text} />}
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
        <Attachments
          files={item.attachments}
          size={s.text}
          justify={justify}
          layout={attachmentsLayout}
        />
      )}
      {item.actions && item.actions.length > 0 && (
        <Box
          data-cn-timeline-actions
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            justifyContent: justify,
            mt: "2px",
            "@media print": { display: "none" },
          }}
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
      {comment && onReply && <ReplyBox item={item} onReply={onReply} justify={justify} />}
    </Box>
  );
};

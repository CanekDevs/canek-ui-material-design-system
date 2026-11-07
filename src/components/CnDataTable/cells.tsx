import Box from "@mui/material/Box";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import type { MouseEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { getInitials } from "../../utils/option-media";
import { getSafeUrl } from "../CnFileField/file-utils";
import { normalizeDateValue } from "../CnForm/CnForm.engine";
import { CnIcon } from "../CnIcon";

// ─── Tipos ──────────────────────────────────────────────────────────────

/** Tipos de celda integrados. */
export type CnCellType =
  | "text"
  | "id"
  | "code"
  | "rfc"
  | "curp"
  | "number"
  | "currency"
  | "percent"
  | "progress"
  | "date"
  | "datetime"
  | "time"
  | "duration"
  | "boolean"
  | "status"
  | "tags"
  | "avatar"
  | "email"
  | "phone"
  | "link"
  | "location"
  | "image"
  | "rating";

export type CnCellTone =
  "primary" | "accent" | "success" | "warning" | "error" | "info" | "neutral";

export type CnStatusOption = {
  label?: ReactNode;
  color?: CnCellTone | "secondary";
  icon?: string;
  description?: string;
};

/** Opciones de formato por tipo de celda. */
export type CnCellOptions = {
  locale?: string;
  /** number / currency / percent: decimales. */
  decimals?: number;
  /** currency: código ISO (MXN, USD…); puede depender de la fila. */
  currency?: string | ((row: unknown) => string | undefined);
  /** percent: el valor viene en 0–100 (por defecto) o en 0–1 (`fraction`). */
  percentScale?: "hundred" | "fraction";
  /** date / datetime: muestra "hace 3 días" bajo la fecha. Por defecto `true`. */
  relative?: boolean;
  /** status / boolean: mapa valor → etiqueta, color, ícono. */
  statusMap?: Record<string, CnStatusOption>;
  trueLabel?: ReactNode;
  falseLabel?: ReactNode;
  /** Subtítulo bajo el valor (avatar, email, text, code…). */
  subtitle?: (row: unknown) => ReactNode;
  /** avatar: imagen. */
  image?: (row: unknown) => string | undefined;
  /** link: URL (por defecto el valor). */
  href?: (row: unknown) => string | undefined;
  /** tags: máximo visible antes de "+N". */
  maxTags?: number;
  /** progress / rating: máximo. */
  max?: number;
  /** number / currency / percent: valor anterior para mostrar tendencia. */
  previous?: (row: unknown) => number | undefined;
  /** text: ícono antes del texto; code: ícono de la píldora. */
  icon?: string;
  /** id: prefijo (`#`, `EMP-`…). */
  prefix?: string;
  /** Color de la píldora (id, code, text con `pill`). */
  tone?: CnCellTone;
  /** text: muestra el texto como píldora. */
  pill?: boolean;
  /** text: líneas antes de truncar. */
  lines?: number;
  /** Texto cuando no hay valor (por defecto según el tipo: "Sin correo"…). */
  emptyText?: string;
  /** Botón para copiar el valor. Por defecto según el tipo. */
  copyable?: boolean;
  /** phone: acceso directo a WhatsApp. */
  whatsapp?: boolean;
};

// ─── Paleta ─────────────────────────────────────────────────────────────

const TONE: Record<CnCellTone | "secondary", { rgb: string; dark: string }> = {
  primary: { rgb: "37, 77, 135", dark: "var(--cn-color-brand-700, #1c3d6d)" },
  accent: { rgb: "61, 90, 254", dark: "var(--cn-color-accent-700, #2a3cb8)" },
  success: { rgb: "34, 135, 64", dark: "var(--cn-color-success-700, #1b6b33)" },
  warning: { rgb: "196, 132, 16", dark: "var(--cn-color-warning-700, #8f6614)" },
  error: { rgb: "214, 60, 60", dark: "var(--cn-color-error-700, #922626)" },
  info: { rgb: "34, 100, 159", dark: "var(--cn-color-info-700, #1b4f7e)" },
  neutral: { rgb: "78, 86, 96", dark: "var(--cn-color-neutral-800, #2d333a)" },
  secondary: { rgb: "78, 86, 96", dark: "var(--cn-color-neutral-800, #2d333a)" },
};

const MONO = "var(--cn-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)";

// ─── Utilidades ─────────────────────────────────────────────────────────

const isEmpty = (value: unknown) =>
  value === null ||
  value === undefined ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const toDate = (value: unknown, kind: "date" | "datetime" | "time"): Date | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const iso = normalizeDateValue(value, kind === "time" ? "time" : "datetime");
  if (!iso) return null;
  if (kind === "time") {
    const [h, m] = iso.split(":").map(Number);
    return Number.isFinite(h) ? new Date(2000, 0, 1, h, m || 0) : null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso);
  if (!match) return null;
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4] ?? 0),
    Number(match[5] ?? 0),
  );
};

const pad = (n: number) => String(n).padStart(2, "0");

/** "hace 3 días", "en 2 meses". */
export const formatRelative = (date: Date, now = new Date()): string => {
  const diff = (date.getTime() - now.getTime()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, seconds] of units) {
    if (abs >= seconds) return rtf.format(Math.trunc(diff / seconds), unit);
  }
  return "justo ahora";
};

const formatPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  const plus = raw.trim().startsWith("+");
  if (digits.length === 10) return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  if (digits.length === 12 && plus) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
  }
  return raw;
};

const RFC_RE = /^([A-ZÑ&]{3,4})(\d{6})([A-Z\d]{3})$/;
const CURP_RE = /^[A-Z][AEIOUX][A-Z]{2}\d{6}[HMX][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/;

/**
 * Texto plano de una celda (búsqueda, orden y exportación). Usa los mismos
 * formatos que la vista.
 */
export const formatCellText = (
  type: CnCellType,
  value: unknown,
  row: unknown,
  options: CnCellOptions = {},
): string => {
  if (isEmpty(value)) return "";
  const locale = options.locale ?? "es-MX";
  switch (type) {
    case "id":
      return `${options.prefix ?? ""}${String(value)}`;
    case "number": {
      const n = toNumber(value);
      return n === null
        ? String(value)
        : n.toLocaleString(locale, {
            minimumFractionDigits: options.decimals,
            maximumFractionDigits: options.decimals ?? 2,
          });
    }
    case "currency": {
      const n = toNumber(value);
      const currency =
        (typeof options.currency === "function" ? options.currency(row) : options.currency) ??
        "MXN";
      return n === null
        ? String(value)
        : n.toLocaleString(locale, {
            style: "currency",
            currency,
            minimumFractionDigits: options.decimals ?? 2,
            maximumFractionDigits: options.decimals ?? 2,
          });
    }
    case "percent":
    case "progress": {
      const n = toNumber(value);
      if (n === null) return String(value);
      if (type === "progress") return `${Math.round((n / (options.max ?? 100)) * 100)}%`;
      const pct = options.percentScale === "fraction" ? n * 100 : n;
      return `${pct.toLocaleString(locale, { maximumFractionDigits: options.decimals ?? 1 })}%`;
    }
    case "date":
    case "datetime":
    case "time": {
      const date = toDate(value, type);
      if (!date) return String(value);
      const day = `${pad(date.getDate())}/${MONTHS[date.getMonth()]}/${date.getFullYear()}`;
      const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
      return type === "date" ? day : type === "time" ? time : `${day} ${time}`;
    }
    case "duration": {
      const n = toNumber(value);
      if (n === null) return String(value);
      const h = Math.floor(n / 60);
      const m = Math.round(n % 60);
      return h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
    }
    case "boolean":
      return value ? String(options.trueLabel ?? "Sí") : String(options.falseLabel ?? "No");
    case "status": {
      const entry = options.statusMap?.[String(value)];
      return typeof entry?.label === "string" ? entry.label : String(value);
    }
    case "phone":
      return formatPhone(String(value));
    case "tags":
      return Array.isArray(value) ? value.map(String).join(", ") : String(value);
    case "rating": {
      const n = toNumber(value);
      return n === null ? String(value) : `${n}/${options.max ?? 5}`;
    }
    case "location":
      if (value && typeof value === "object") {
        const loc = value as Record<string, unknown>;
        return [loc.street, loc.city, loc.state, loc.postalCode, loc.country]
          .filter(Boolean)
          .join(", ");
      }
      return String(value);
    default:
      if (Array.isArray(value)) return value.join(", ");
      if (typeof value === "object") {
        const obj = value as Record<string, unknown>;
        return String(obj.label ?? obj.name ?? obj.value ?? JSON.stringify(value));
      }
      return String(value);
  }
};

// ─── Piezas visuales ────────────────────────────────────────────────────

/** Botón de copiar: tenue, se ilumina al pasar sobre la fila o enfocarlo. */
export const CnCopyButton = ({ text, label = "Copiar" }: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  if (!text) return null;
  const copy = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Tooltip title={copied ? "¡Copiado!" : label} arrow placement="top">
      <Box
        component="button"
        type="button"
        aria-label={`${label}: ${text}`}
        className="cn-cell-copy"
        onClick={copy}
        onMouseDown={(event: MouseEvent) => event.stopPropagation()}
        sx={{
          all: "unset",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          flexShrink: 0,
          borderRadius: "50%",
          cursor: "pointer",
          opacity: copied ? 1 : 0.4,
          color: copied
            ? "var(--cn-color-success-600, #228740)"
            : "var(--cn-color-neutral-600, #4e5660)",
          transition: "opacity 160ms ease, background-color 160ms ease, transform 160ms ease",
          "&:hover, &:focus-visible": {
            opacity: 1,
            backgroundColor: "rgba(110, 118, 130, 0.12)",
          },
          "&:focus-visible": { outline: "2px solid var(--cn-color-brand-400, #5081c4)" },
          "&:active": { transform: "scale(0.92)" },
        }}
      >
        <CnIcon name={copied ? "check" : "content_copy"} size={13} />
      </Box>
    </Tooltip>
  );
};

type PillProps = {
  label: ReactNode;
  subtitle?: ReactNode;
  icon?: string | ReactNode;
  tone?: CnCellTone | "secondary";
  mono?: boolean;
  chevron?: boolean;
  onClick?: (event: MouseEvent) => void;
  href?: string;
  title?: string;
  maxWidth?: number;
  strong?: boolean;
};

/** Píldora de celda: fondo tintado, ícono en recuadro y subtítulo opcional. */
export const CnCellPill = ({
  label,
  subtitle,
  icon,
  tone = "primary",
  mono = false,
  chevron = false,
  onClick,
  href,
  title,
  maxWidth = 260,
  strong = false,
}: PillProps) => {
  const colors = TONE[tone];
  const interactive = Boolean(onClick || href);
  const external = Boolean(href && /^https?:/.test(href));
  return (
    <Box
      component={href ? "a" : onClick ? "button" : "span"}
      type={onClick && !href ? "button" : undefined}
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      title={title}
      onClick={(event: MouseEvent) => {
        if (interactive) event.stopPropagation();
        onClick?.(event);
      }}
      sx={{
        ...(onClick && !href ? { all: "unset" } : {}),
        boxSizing: "border-box",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        minHeight: 28,
        maxWidth,
        minWidth: 0,
        pl: icon ? "5px" : "12px",
        pr: chevron ? "6px" : "12px",
        py: "3px",
        borderRadius: "999px",
        backgroundColor: `rgba(${colors.rgb}, 0.08)`,
        color: colors.dark,
        fontSize: "0.72rem",
        fontWeight: strong ? 700 : 600,
        letterSpacing: "0.2px",
        fontFamily: mono ? MONO : "inherit",
        textDecoration: "none",
        whiteSpace: "nowrap",
        verticalAlign: "middle",
        cursor: interactive ? "pointer" : "default",
        transition: "background-color 160ms ease, transform 160ms ease",
        "&:hover": interactive
          ? { backgroundColor: `rgba(${colors.rgb}, 0.15)`, transform: "translateY(-1px)" }
          : undefined,
        "&:focus-visible": { outline: "2px solid var(--cn-color-brand-400, #5081c4)" },
      }}
    >
      {icon && (
        <Box
          component="span"
          aria-hidden
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            flexShrink: 0,
            borderRadius: "50%",
            backgroundColor: `rgba(${colors.rgb}, 0.12)`,
          }}
        >
          {typeof icon === "string" ? <CnIcon name={icon} size={13} /> : icon}
        </Box>
      )}
      <Box
        component="span"
        sx={{ display: "flex", flexDirection: "column", minWidth: 0, lineHeight: 1.3 }}
      >
        <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </Box>
        {subtitle && (
          <Box
            component="span"
            sx={{
              fontSize: "0.6rem",
              fontWeight: 400,
              opacity: 0.7,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {subtitle}
          </Box>
        )}
      </Box>
      {chevron && <CnIcon name="chevron_right" size={12} sx={{ opacity: 0.45 }} />}
    </Box>
  );
};

const EMPTY_BY_TYPE: Partial<Record<CnCellType, { text: string; icon: string; tone: CnCellTone }>> =
  {
    email: { text: "Sin correo", icon: "unsubscribe", tone: "error" },
    phone: { text: "Sin teléfono", icon: "phone_disabled", tone: "error" },
    link: { text: "Sin enlace", icon: "link_off", tone: "error" },
    date: { text: "Sin fecha", icon: "event_busy", tone: "neutral" },
    datetime: { text: "Sin fecha", icon: "event_busy", tone: "neutral" },
    time: { text: "Sin hora", icon: "schedule", tone: "neutral" },
    image: { text: "Sin imagen", icon: "hide_image", tone: "neutral" },
    location: { text: "Sin dirección", icon: "location_off", tone: "neutral" },
    rfc: { text: "Sin RFC", icon: "badge", tone: "neutral" },
    curp: { text: "Sin CURP", icon: "badge", tone: "neutral" },
    avatar: { text: "Sin asignar", icon: "person_off", tone: "neutral" },
    tags: { text: "Sin etiquetas", icon: "label_off", tone: "neutral" },
  };

/** Celda vacía con contexto ("Sin teléfono", "Sin fecha"…). */
export const CnEmptyCell = ({ type, text }: { type: CnCellType; text?: string }) => {
  const preset = EMPTY_BY_TYPE[type];
  if (!preset && !text) {
    return (
      <Box
        component="span"
        aria-label="Sin dato"
        sx={{ color: "var(--cn-color-text-subtle, #9aa1aa)" }}
      >
        —
      </Box>
    );
  }
  return (
    <CnCellPill
      label={text ?? preset?.text}
      icon={preset?.icon ?? "remove"}
      tone={preset?.tone ?? "neutral"}
    />
  );
};

const withCopy = (node: ReactNode, text: string, enabled: boolean) =>
  enabled && text ? (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        minWidth: 0,
        maxWidth: "100%",
      }}
    >
      {node}
      <CnCopyButton text={text} />
    </Box>
  ) : (
    node
  );

const STATUS_FALLBACK: Record<string, CnStatusOption> = {
  active: { label: "Activo", color: "success", icon: "check_circle" },
  activo: { label: "Activo", color: "success", icon: "check_circle" },
  inactive: { label: "Inactivo", color: "error", icon: "cancel" },
  inactivo: { label: "Inactivo", color: "error", icon: "cancel" },
  approved: { label: "Aprobado", color: "success", icon: "task_alt" },
  aprobado: { label: "Aprobado", color: "success", icon: "task_alt" },
  pending: { label: "Pendiente", color: "warning", icon: "schedule" },
  pendiente: { label: "Pendiente", color: "warning", icon: "schedule" },
  rejected: { label: "Rechazado", color: "error", icon: "block" },
  rechazado: { label: "Rechazado", color: "error", icon: "block" },
  cancelled: { label: "Cancelado", color: "error", icon: "block" },
  cancelado: { label: "Cancelado", color: "error", icon: "block" },
  draft: { label: "Borrador", color: "neutral", icon: "edit_note" },
  borrador: { label: "Borrador", color: "neutral", icon: "edit_note" },
  completed: { label: "Completado", color: "success", icon: "task_alt" },
  completado: { label: "Completado", color: "success", icon: "task_alt" },
  true: { label: "Sí", color: "success", icon: "check_circle" },
  false: { label: "No", color: "error", icon: "cancel" },
};

/** Presets de estados frecuentes para `cellOptions.statusMap`. */
export const CN_STATUS_PRESETS = {
  activeInactive: {
    active: { label: "Activo", color: "success", icon: "check_circle" },
    inactive: { label: "Inactivo", color: "error", icon: "cancel" },
  },
  approval: {
    pending: { label: "Pendiente", color: "warning", icon: "schedule" },
    approved: { label: "Aprobado", color: "success", icon: "task_alt" },
    rejected: { label: "Rechazado", color: "error", icon: "block" },
  },
  payment: {
    pending: { label: "Por pagar", color: "warning", icon: "schedule" },
    paid: { label: "Pagado", color: "success", icon: "paid" },
    overdue: { label: "Vencido", color: "error", icon: "warning" },
    refunded: { label: "Reembolsado", color: "info", icon: "undo" },
  },
  priority: {
    low: { label: "Baja", color: "neutral", icon: "keyboard_arrow_down" },
    medium: { label: "Media", color: "info", icon: "drag_handle" },
    high: { label: "Alta", color: "warning", icon: "keyboard_arrow_up" },
    critical: { label: "Crítica", color: "error", icon: "priority_high" },
  },
  task: {
    todo: { label: "Por hacer", color: "neutral", icon: "radio_button_unchecked" },
    in_progress: { label: "En curso", color: "info", icon: "autorenew" },
    blocked: { label: "Bloqueada", color: "error", icon: "block" },
    done: { label: "Terminada", color: "success", icon: "task_alt" },
  },
} satisfies Record<string, Record<string, CnStatusOption>>;

const TagsCell = ({ tags, max }: { tags: string[]; max: number }) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const visible = tags.slice(0, max);
  const rest = tags.length - visible.length;
  return (
    <Box sx={{ display: "inline-flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
      {visible.map((tag) => (
        <CnCellPill key={tag} label={tag} tone="neutral" icon="sell" />
      ))}
      {rest > 0 && (
        <>
          <CnCellPill
            label={`+${rest}`}
            tone="primary"
            onClick={(event) => setAnchor(event.currentTarget as HTMLElement)}
            title="Ver todas"
          />
          <Popover
            open={Boolean(anchor)}
            anchorEl={anchor}
            onClose={() => setAnchor(null)}
            onClick={(event) => event.stopPropagation()}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            slotProps={{ paper: { sx: { p: "10px", maxWidth: 320, borderRadius: "10px" } } }}
          >
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {tags.map((tag) => (
                <CnCellPill key={tag} label={tag} tone="neutral" icon="sell" />
              ))}
            </Box>
          </Popover>
        </>
      )}
    </Box>
  );
};

const trendOf = (current: number, previous: number | undefined) => {
  if (previous === undefined) return null;
  if (current > previous) return { icon: "trending_up", tone: "success" as const };
  if (current < previous) return { icon: "trending_down", tone: "error" as const };
  return { icon: "trending_flat", tone: "neutral" as const };
};

/** Contenido visual de una celda tipada. */
export const renderTypedCell = (
  type: CnCellType,
  value: unknown,
  row: unknown,
  options: CnCellOptions = {},
): ReactNode => {
  if (isEmpty(value) && type !== "boolean" && type !== "rating") {
    return <CnEmptyCell type={type} text={options.emptyText} />;
  }
  const text = formatCellText(type, value, row, options);
  const subtitle = options.subtitle?.(row);
  const copy = options.copyable;

  switch (type) {
    case "id":
      return withCopy(
        <CnCellPill label={text} icon="tag" tone={options.tone ?? "primary"} mono />,
        text,
        copy ?? true,
      );
    case "code":
      return withCopy(
        <CnCellPill
          label={text}
          icon={options.icon ?? "qr_code_2"}
          tone={options.tone ?? "neutral"}
          mono
          subtitle={subtitle}
        />,
        text,
        copy ?? true,
      );
    case "rfc":
    case "curp": {
      const upper = text.toUpperCase();
      const valid = type === "rfc" ? RFC_RE.test(upper) : CURP_RE.test(upper);
      return withCopy(
        <CnCellPill
          label={upper}
          icon={valid ? "verified" : "error_outline"}
          tone={valid ? (type === "rfc" ? "primary" : "success") : "warning"}
          mono
          title={
            valid
              ? `${type.toUpperCase()} con formato válido`
              : `${type.toUpperCase()} con formato no reconocido`
          }
          subtitle={subtitle}
        />,
        upper,
        copy ?? true,
      );
    }
    case "number":
    case "percent": {
      const n = toNumber(value) ?? 0;
      const trend = trendOf(n, options.previous?.(row));
      const scaled = type === "percent" && options.percentScale === "fraction" ? n * 100 : n;
      const auto =
        type === "percent" && !trend
          ? scaled >= 80
            ? { icon: "trending_up", tone: "success" as const }
            : scaled >= 50
              ? { icon: "trending_flat", tone: "warning" as const }
              : { icon: "trending_down", tone: "error" as const }
          : null;
      const indicator = trend ?? auto;
      if (!indicator) {
        return withCopy(
          <Box
            component="span"
            sx={{
              fontFamily: MONO,
              fontSize: "0.78rem",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {text}
          </Box>,
          text,
          copy ?? false,
        );
      }
      return withCopy(
        <CnCellPill label={text} icon={indicator.icon} tone={indicator.tone} mono strong />,
        text,
        copy ?? true,
      );
    }
    case "currency": {
      const n = toNumber(value) ?? 0;
      const trend = trendOf(n, options.previous?.(row));
      return withCopy(
        <CnCellPill
          label={text}
          icon={trend ? trend.icon : "attach_money"}
          tone={trend ? trend.tone : n < 0 ? "error" : "primary"}
          mono
          strong
          subtitle={subtitle}
        />,
        text,
        copy ?? true,
      );
    }
    case "progress": {
      const n = toNumber(value) ?? 0;
      const pct = Math.max(0, Math.min(100, (n / (options.max ?? 100)) * 100));
      const tone: CnCellTone = pct >= 80 ? "success" : pct >= 50 ? "warning" : "error";
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 120 }}>
          <Box
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            sx={{
              flex: 1,
              height: 6,
              borderRadius: 6,
              backgroundColor: `rgba(${TONE[tone].rgb}, 0.15)`,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${pct}%`,
                height: "100%",
                borderRadius: 6,
                backgroundColor: `rgb(${TONE[tone].rgb})`,
              }}
            />
          </Box>
          <Box
            component="span"
            sx={{
              fontFamily: MONO,
              fontSize: "0.72rem",
              fontWeight: 700,
              color: TONE[tone].dark,
              minWidth: 34,
              textAlign: "right",
            }}
          >
            {Math.round(pct)}%
          </Box>
        </Box>
      );
    }
    case "date":
    case "datetime":
    case "time": {
      const date = toDate(value, type);
      if (!date) return <CnEmptyCell type={type} text={String(value)} />;
      const relative =
        type !== "time" && options.relative !== false ? formatRelative(date) : undefined;
      const full = new Intl.DateTimeFormat("es-MX", {
        dateStyle: type === "time" ? undefined : "full",
        timeStyle: type === "date" ? undefined : "short",
      }).format(date);
      return withCopy(
        <CnCellPill
          label={text}
          subtitle={relative}
          icon={
            type === "time"
              ? "schedule"
              : type === "datetime"
                ? "event_available"
                : "calendar_month"
          }
          tone="primary"
          mono
          chevron={Boolean(relative)}
          title={full.charAt(0).toUpperCase() + full.slice(1)}
        />,
        text,
        copy ?? true,
      );
    }
    case "duration":
      return <CnCellPill label={text} icon="timer" tone="info" mono />;
    case "boolean": {
      const on = Boolean(value);
      const entry = options.statusMap?.[String(on)];
      return (
        <CnCellPill
          label={entry?.label ?? (on ? (options.trueLabel ?? "Sí") : (options.falseLabel ?? "No"))}
          icon={entry?.icon ?? (on ? "check_circle" : "cancel")}
          tone={(entry?.color as CnCellTone) ?? (on ? "success" : "neutral")}
          strong
        />
      );
    }
    case "status": {
      const key = String(value);
      const entry = options.statusMap?.[key] ?? STATUS_FALLBACK[key.toLowerCase()];
      return withCopy(
        <CnCellPill
          label={entry?.label ?? key}
          icon={entry?.icon ?? "help_outline"}
          tone={(entry?.color as CnCellTone) ?? "neutral"}
          strong
          title={entry?.description}
        />,
        typeof entry?.label === "string" ? entry.label : key,
        copy ?? false,
      );
    }
    case "tags": {
      const list = (Array.isArray(value) ? value : String(value).split(","))
        .map((tag) => String(tag).trim())
        .filter(Boolean);
      return <TagsCell tags={list} max={options.maxTags ?? 2} />;
    }
    case "avatar": {
      const src = options.image?.(row);
      const safe = src ? getSafeUrl(src) : undefined;
      return withCopy(
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            minWidth: 0,
            maxWidth: "100%",
          }}
        >
          <Box
            aria-hidden
            sx={{
              width: 32,
              height: 32,
              flexShrink: 0,
              borderRadius: "50%",
              overflow: "hidden",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              backgroundColor: "var(--cn-color-brand-500, #3562a6)",
              boxShadow:
                "0 0 0 2px var(--cn-color-surface, #fff), 0 0 0 3px rgba(37, 77, 135, 0.18)",
            }}
          >
            {safe ? (
              <Box
                component="img"
                src={safe}
                alt=""
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              getInitials(text)
            )}
          </Box>
          <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
            <Box
              component="span"
              sx={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "var(--cn-color-text, #222831)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {text}
            </Box>
            {subtitle && (
              <Box
                component="span"
                sx={{
                  fontSize: "0.68rem",
                  color: "var(--cn-color-text-muted, #6e7682)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {subtitle}
              </Box>
            )}
          </Box>
        </Box>,
        text,
        copy ?? false,
      );
    }
    case "email": {
      const domain = text.split("@")[1] ?? "";
      return withCopy(
        <CnCellPill
          label={text}
          subtitle={subtitle ?? (domain || undefined)}
          icon="mail"
          tone="accent"
          mono
          href={`mailto:${text}`}
          maxWidth={240}
          title={`Escribir a ${text}`}
        />,
        text,
        copy ?? true,
      );
    }
    case "phone": {
      const digits = String(value).replace(/[^\d+]/g, "");
      return (
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <CnCellPill
            label={text}
            icon="call"
            tone="info"
            mono
            href={`tel:${digits}`}
            title={`Llamar a ${text}`}
          />
          {options.whatsapp && (
            <Tooltip title="Abrir WhatsApp">
              <Box
                component="a"
                href={`https://wa.me/${digits.replace(/^\+/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event: MouseEvent) => event.stopPropagation()}
                aria-label={`WhatsApp ${text}`}
                sx={{
                  display: "inline-flex",
                  color: "#25a244",
                  p: "3px",
                  borderRadius: "50%",
                  "&:hover": { backgroundColor: "rgba(37,162,68,0.12)" },
                }}
              >
                <CnIcon name="chat" size={14} />
              </Box>
            </Tooltip>
          )}
          {(copy ?? true) && <CnCopyButton text={digits} />}
        </Box>
      );
    }
    case "link": {
      const raw = options.href?.(row) ?? String(value);
      const safe = getSafeUrl(raw);
      if (!safe) return <CnEmptyCell type="link" />;
      let host = text;
      try {
        host = new URL(safe, "https://x.invalid").hostname.replace(/^www\./, "");
        if (host === "x.invalid") host = text;
      } catch {
        // URL relativa: se muestra tal cual.
      }
      return withCopy(
        <CnCellPill
          label={options.href ? text : host}
          icon="link"
          tone="accent"
          href={safe}
          chevron
          title={safe}
        />,
        safe,
        copy ?? true,
      );
    }
    case "location":
      return withCopy(
        <CnCellPill
          label={text}
          icon="location_on"
          tone="error"
          maxWidth={240}
          title={text}
          subtitle={subtitle}
        />,
        text,
        copy ?? true,
      );
    case "image": {
      const safe = getSafeUrl(String(value));
      return safe ? (
        <Box
          component="img"
          src={safe}
          alt=""
          loading="lazy"
          sx={{
            width: 40,
            height: 40,
            objectFit: "cover",
            borderRadius: "10px",
            border: "1px solid var(--cn-color-border, #dde0e4)",
          }}
        />
      ) : (
        <CnEmptyCell type="image" />
      );
    }
    case "rating": {
      const n = toNumber(value) ?? 0;
      const max = options.max ?? 5;
      const tone: CnCellTone = n / max >= 0.7 ? "success" : n / max >= 0.5 ? "warning" : "error";
      return (
        <CnCellPill
          label={n.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
          subtitle={
            <Box component="span" aria-hidden sx={{ letterSpacing: "1px", fontSize: "0.62rem" }}>
              {"★".repeat(Math.round(n))}
              {"☆".repeat(Math.max(0, max - Math.round(n)))}
            </Box>
          }
          icon="star"
          tone={tone}
          mono
          strong
          title={`${n} de ${max}`}
        />
      );
    }
    default: {
      if (options.pill) {
        return withCopy(
          <CnCellPill
            label={text}
            icon={options.icon}
            tone={options.tone ?? "neutral"}
            subtitle={subtitle}
          />,
          text,
          copy ?? true,
        );
      }
      const lines = options.lines ?? 2;
      return withCopy(
        <Box
          component="span"
          sx={{ display: "inline-flex", alignItems: "center", gap: "6px", minWidth: 0 }}
        >
          {options.icon && (
            <CnIcon
              name={options.icon}
              size={14}
              sx={{ color: "var(--cn-color-brand-500, #3562a6)", flexShrink: 0 }}
            />
          )}
          <Box component="span" sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Box
              component="span"
              title={text.length > 40 ? text : undefined}
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: lines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                overflowWrap: "anywhere",
                fontSize: "0.8rem",
                fontWeight: options.icon ? 600 : 400,
              }}
            >
              {text}
            </Box>
            {subtitle && (
              <Box
                component="span"
                sx={{ fontSize: "0.68rem", color: "var(--cn-color-text-muted, #6e7682)" }}
              >
                {subtitle}
              </Box>
            )}
          </Box>
        </Box>,
        text,
        copy ?? false,
      );
    }
  }
};

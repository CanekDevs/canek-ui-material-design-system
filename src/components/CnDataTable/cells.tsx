import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Rating from "@mui/material/Rating";
import Tooltip from "@mui/material/Tooltip";
import type { ReactNode } from "react";
import { getInitials } from "../../utils/option-media";
import { CnChip } from "../CnChip";
import type { CnChipColor } from "../CnChip";
import { getSafeUrl } from "../CnFileField/file-utils";
import { normalizeDateValue } from "../CnForm/CnForm.engine";

/** Tipos de celda integrados. */
export type CnCellType =
  | "text"
  | "number"
  | "currency"
  | "percent"
  | "date"
  | "datetime"
  | "time"
  | "boolean"
  | "status"
  | "tags"
  | "avatar"
  | "email"
  | "phone"
  | "link"
  | "code"
  | "progress"
  | "rating"
  | "image"
  | "duration";

export type CnStatusOption = {
  label?: ReactNode;
  color?: CnChipColor;
  icon?: string;
};

/** Opciones de formato por tipo de celda. */
export type CnCellOptions = {
  locale?: string;
  /** number / currency / percent: decimales. */
  decimals?: number;
  /** currency: código ISO (MXN, USD…). Puede depender de la fila. */
  currency?: string | ((row: unknown) => string | undefined);
  /** percent: el valor ya viene en 0–100 (por defecto) o en 0–1 (`fraction`). */
  percentScale?: "hundred" | "fraction";
  /** date / datetime: opciones de `Intl.DateTimeFormat`. */
  dateStyle?: "short" | "medium" | "long";
  /** status: mapa valor → etiqueta, color e ícono. */
  statusMap?: Record<string, CnStatusOption>;
  /** boolean: etiquetas. */
  trueLabel?: ReactNode;
  falseLabel?: ReactNode;
  /** avatar: campos de la fila para subtítulo e imagen. */
  subtitle?: (row: unknown) => ReactNode;
  image?: (row: unknown) => string | undefined;
  /** link: URL (por defecto el propio valor). */
  href?: (row: unknown) => string | undefined;
  /** tags: máximo visible antes de "+N". */
  maxTags?: number;
  /** progress / rating: máximo. */
  max?: number;
  /** text: líneas antes de truncar (con tooltip). */
  lines?: number;
  /** Texto para valores vacíos. Por defecto "—". */
  empty?: ReactNode;
};

const EMPTY = "—";

const muted = {
  color: "var(--cn-color-text-subtle, #9aa1aa)",
};

const isEmpty = (value: unknown) =>
  value === null ||
  value === undefined ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

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

/**
 * Texto plano de una celda (para búsqueda, orden y exportación). Usa los
 * mismos formatos que la vista.
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
    case "percent": {
      const n = toNumber(value);
      if (n === null) return String(value);
      const ratio = options.percentScale === "fraction" ? n : n / 100;
      return ratio.toLocaleString(locale, {
        style: "percent",
        maximumFractionDigits: options.decimals ?? 1,
      });
    }
    case "date":
    case "datetime":
    case "time": {
      const date = toDate(value, type);
      if (!date) return String(value);
      const style = options.dateStyle ?? "medium";
      return new Intl.DateTimeFormat(
        locale,
        type === "date"
          ? { dateStyle: style }
          : type === "time"
            ? { timeStyle: "short" }
            : { dateStyle: style, timeStyle: "short" },
      ).format(date);
    }
    case "boolean":
      return value ? String(options.trueLabel ?? "Sí") : String(options.falseLabel ?? "No");
    case "status": {
      const entry = options.statusMap?.[String(value)];
      return typeof entry?.label === "string" ? entry.label : String(value);
    }
    case "tags":
      return Array.isArray(value) ? value.map(String).join(", ") : String(value);
    case "duration": {
      const n = toNumber(value);
      if (n === null) return String(value);
      const h = Math.floor(n / 60);
      const m = Math.round(n % 60);
      return h ? `${h} h ${m ? `${m} min` : ""}`.trim() : `${m} min`;
    }
    case "progress": {
      const n = toNumber(value);
      return n === null ? String(value) : `${Math.round((n / (options.max ?? 100)) * 100)} %`;
    }
    default:
      return Array.isArray(value)
        ? value.join(", ")
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
  }
};

const STATUS_FALLBACK: Record<string, CnChipColor> = {
  active: "success",
  activo: "success",
  approved: "success",
  aprobado: "success",
  completed: "success",
  completado: "success",
  pending: "warning",
  pendiente: "warning",
  draft: "neutral",
  borrador: "neutral",
  inactive: "neutral",
  inactivo: "neutral",
  rejected: "error",
  rechazado: "error",
  cancelled: "error",
  cancelado: "error",
};

/** Contenido visual de una celda tipada. */
export const renderTypedCell = (
  type: CnCellType,
  value: unknown,
  row: unknown,
  options: CnCellOptions = {},
): ReactNode => {
  const empty = options.empty ?? (
    <Box component="span" sx={muted}>
      {EMPTY}
    </Box>
  );
  if (isEmpty(value) && type !== "boolean") return empty;
  const text = formatCellText(type, value, row, options);

  switch (type) {
    case "number":
    case "currency":
    case "percent":
    case "duration":
      return (
        <Box component="span" sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {text}
        </Box>
      );
    case "date":
    case "datetime":
    case "time":
      return (
        <Box component="span" sx={{ whiteSpace: "nowrap" }}>
          {text}
        </Box>
      );
    case "boolean":
      return (
        <CnChip
          size="small"
          variant="soft"
          color={value ? "success" : "neutral"}
          label={value ? (options.trueLabel ?? "Sí") : (options.falseLabel ?? "No")}
        />
      );
    case "status": {
      const key = String(value);
      const entry = options.statusMap?.[key];
      return (
        <CnChip
          size="small"
          variant="soft"
          color={entry?.color ?? STATUS_FALLBACK[key.toLowerCase()] ?? "neutral"}
          icon={entry?.icon}
          label={entry?.label ?? key}
        />
      );
    }
    case "tags": {
      const list = (Array.isArray(value) ? value : [value]).map(String);
      const max = options.maxTags ?? 3;
      return (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {list.slice(0, max).map((tag) => (
            <CnChip key={tag} size="small" variant="outlined" color="neutral" label={tag} />
          ))}
          {list.length > max && (
            <Tooltip title={list.slice(max).join(", ")}>
              <span>
                <CnChip
                  size="small"
                  variant="soft"
                  color="neutral"
                  label={`+${list.length - max}`}
                />
              </span>
            </Tooltip>
          )}
        </Box>
      );
    }
    case "avatar": {
      const src = options.image?.(row);
      const safe = src ? getSafeUrl(src) : undefined;
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
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
              color: "var(--cn-color-brand-700, #1c3d6d)",
              backgroundColor: "var(--cn-color-brand-100, #dbe6f7)",
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
          <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
            <Box
              component="span"
              sx={{
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {text}
            </Box>
            {options.subtitle && (
              <Box
                component="span"
                sx={{
                  fontSize: "var(--cn-font-size-xs, 11px)",
                  color: "var(--cn-color-text-muted, #6e7682)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {options.subtitle(row)}
              </Box>
            )}
          </Box>
        </Box>
      );
    }
    case "email":
    case "phone":
    case "link": {
      const href =
        type === "email"
          ? `mailto:${text}`
          : type === "phone"
            ? `tel:${text.replace(/[^\d+]/g, "")}`
            : getSafeUrl(options.href?.(row) ?? text);
      if (!href) return text;
      return (
        <Box
          component="a"
          href={href}
          target={type === "link" ? "_blank" : undefined}
          rel={type === "link" ? "noopener noreferrer" : undefined}
          onClick={(event: React.MouseEvent) => event.stopPropagation()}
          sx={{
            color: "var(--cn-color-brand-600, #254d87)",
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          {text}
        </Box>
      );
    }
    case "code":
      return (
        <Box
          component="code"
          sx={{
            fontFamily: "var(--cn-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
            fontSize: "0.92em",
            letterSpacing: "0.02em",
            px: "6px",
            py: "1px",
            borderRadius: "var(--cn-radius-xs, 4px)",
            backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
          }}
        >
          {text}
        </Box>
      );
    case "progress": {
      const n = toNumber(value) ?? 0;
      const pct = Math.max(0, Math.min(100, (n / (options.max ?? 100)) * 100));
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 90 }}>
          <LinearProgress
            variant="determinate"
            value={pct}
            aria-label={`${Math.round(pct)} %`}
            sx={{ flex: 1, height: 6, borderRadius: 6 }}
          />
          <Box
            component="span"
            sx={{ fontSize: "var(--cn-font-size-xs, 11px)", fontVariantNumeric: "tabular-nums" }}
          >
            {Math.round(pct)} %
          </Box>
        </Box>
      );
    }
    case "rating":
      return (
        <Rating
          size="small"
          readOnly
          value={toNumber(value) ?? 0}
          max={options.max ?? 5}
          precision={0.5}
        />
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
            borderRadius: "var(--cn-radius-sm, 6px)",
          }}
        />
      ) : (
        empty
      );
    }
    default: {
      const lines = options.lines ?? 2;
      return (
        <Box
          component="span"
          title={text.length > 60 ? text : undefined}
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: lines,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            overflowWrap: "anywhere",
          }}
        >
          {text}
        </Box>
      );
    }
  }
};

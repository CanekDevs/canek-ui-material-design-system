import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { forwardRef } from "react";
import { formatCurrency } from "../../utils/number-utils";
import { CN_TONES } from "../../utils/tones";
import { CnAvatar } from "../CnAvatar";
import { CnIcon } from "../CnIcon";
import { CnDealCardSkeleton } from "./CnDealCardSkeleton";

export type CnDealStatus = "open" | "won" | "lost";

export type CnDealNextActivity = {
  /** Qué sigue ("Demo con TI", "Enviar contrato"). */
  label: string;
  /** Cuándo, ya formateado ("Jue 28 nov", "Hoy 16:00"). */
  due?: string;
  /** Vencida: se marca en rojo. */
  overdue?: boolean;
  icon?: string;
};

export type CnDealCardProps = {
  /** Nombre de la oportunidad. */
  title: ReactNode;
  /** Empresa o contacto. */
  company?: ReactNode;
  /** Monto. */
  amount?: number | null;
  /** Moneda ISO (MXN, USD). */
  currency?: string;
  /** Probabilidad de cierre, 0–100. */
  probability?: number;
  /** Muestra el monto ponderado (monto × probabilidad). */
  showWeighted?: boolean;
  /** Etapa ("Negociación"): útil fuera del tablero. */
  stage?: ReactNode;
  status?: CnDealStatus;
  owner?: { name: string; src?: string };
  nextActivity?: CnDealNextActivity;
  /** Fecha estimada de cierre, ya formateada. */
  closeDate?: string;
  tags?: readonly string[];
  /** `compact` oculta etiquetas y fecha de cierre (tableros densos). */
  density?: "comfortable" | "compact";
  /** Abre la oportunidad: la tarjeta completa se vuelve un botón. */
  onClick?: () => void;
  selected?: boolean;
  /** Muestra el skeleton con las mismas medidas que el componente real. */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};

const STATUS_LABEL: Record<CnDealStatus, string> = {
  open: "Abierta",
  won: "Ganada",
  lost: "Perdida",
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

/** Tarjeta de oportunidad: monto, probabilidad, responsable y próxima actividad. */
export const CnDealCard = forwardRef<HTMLDivElement, CnDealCardProps>(function CnDealCard(
  {
    title,
    company,
    amount,
    currency = "MXN",
    probability,
    showWeighted = false,
    stage,
    status = "open",
    owner,
    nextActivity,
    closeDate,
    tags = [],
    density = "comfortable",
    onClick,
    selected = false,
    skeleton = false,
    sx,
    className,
  },
  ref,
) {
  if (skeleton) {
    return <CnDealCardSkeleton density={density} sx={sx} className={className} />;
  }

  const compact = density === "compact";
  const percent = probability === undefined ? undefined : clampPercent(probability);
  const hasAmount = amount !== undefined && amount !== null && Number.isFinite(amount);
  const tone = status === "won" ? CN_TONES.success : status === "lost" ? CN_TONES.error : null;

  const body = (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: compact ? "8px" : "12px",
        textAlign: "left",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: "8px", minWidth: 0 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            component="h4"
            sx={{
              m: 0,
              fontSize: "14px",
              fontWeight: 500,
              lineHeight: 1.4,
              overflowWrap: "anywhere",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </Box>
          {company && (
            <Box
              sx={{
                mt: "2px",
                fontSize: "12px",
                color: "var(--cn-color-text-muted, #6e7682)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {company}
            </Box>
          )}
        </Box>
        {owner && <CnAvatar name={owner.name} src={owner.src} size="sm" alt={owner.name} />}
      </Box>

      {(hasAmount || stage || tone) && (
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            flexWrap: "wrap",
            gap: "4px 8px",
            minWidth: 0,
          }}
        >
          {hasAmount && (
            <Box
              data-cn-deal-amount
              sx={{ fontSize: "16px", fontWeight: 700, overflowWrap: "anywhere", minWidth: 0 }}
            >
              {formatCurrency(amount, currency, "es-MX", 0)}
            </Box>
          )}
          {showWeighted && hasAmount && percent !== undefined && (
            <Box sx={{ fontSize: "12px", color: "var(--cn-color-text-muted, #6e7682)" }}>
              Ponderado {formatCurrency((amount * percent) / 100, currency, "es-MX", 0)}
            </Box>
          )}
          {stage && (
            <Box sx={{ fontSize: "12px", color: "var(--cn-color-text-muted, #6e7682)" }}>
              {stage}
            </Box>
          )}
          {tone && (
            <Box
              component="span"
              sx={{
                ml: "auto",
                px: "12px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 500,
                lineHeight: "20px",
                color: tone.text,
                backgroundColor: tone.soft,
              }}
            >
              {STATUS_LABEL[status]}
            </Box>
          )}
        </Box>
      )}

      {percent !== undefined && status === "open" && (
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Box
            role="progressbar"
            aria-label="Probabilidad de cierre"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            sx={{
              flex: 1,
              height: "4px",
              borderRadius: "999px",
              backgroundColor: "var(--cn-color-border, #dde0e4)",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${percent}%`,
                height: "100%",
                borderRadius: "inherit",
                backgroundColor:
                  percent >= 70
                    ? CN_TONES.success.main
                    : percent >= 40
                      ? CN_TONES.primary.main
                      : CN_TONES.warning.main,
              }}
            />
          </Box>
          <Box sx={{ fontSize: "12px", fontWeight: 500, minWidth: "32px", textAlign: "right" }}>
            {percent} %
          </Box>
        </Box>
      )}

      {nextActivity && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            minWidth: 0,
            fontSize: "12px",
            color: nextActivity.overdue
              ? "var(--cn-color-error-700, #8f2525)"
              : "var(--cn-color-text-muted, #6e7682)",
          }}
        >
          <CnIcon
            name={nextActivity.overdue ? "warning" : (nextActivity.icon ?? "event")}
            size={16}
          />
          <Box
            sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {nextActivity.overdue && "Vencida · "}
            {nextActivity.label}
            {nextActivity.due && ` · ${nextActivity.due}`}
          </Box>
        </Box>
      )}

      {!compact && (tags.length > 0 || closeDate) && (
        <Box
          sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px", minWidth: 0 }}
        >
          {tags.map((tag) => (
            <Box
              key={tag}
              component="span"
              sx={{
                px: "12px",
                borderRadius: "var(--cn-radius-sm, 4px)",
                fontSize: "12px",
                lineHeight: "20px",
                backgroundColor: "var(--cn-color-surface-sunken, #f4f5f7)",
                color: "var(--cn-color-text, #222831)",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {tag}
            </Box>
          ))}
          {closeDate && (
            <Box
              sx={{ ml: "auto", fontSize: "12px", color: "var(--cn-color-text-muted, #6e7682)" }}
            >
              Cierre {closeDate}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );

  const frame: SxProps<Theme> = {
    display: "flex",
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    boxSizing: "border-box",
    p: compact ? "12px" : "16px",
    border: "1px solid",
    borderColor: selected
      ? "var(--cn-color-brand-600, #254d87)"
      : "var(--cn-color-border, #dde0e4)",
    boxShadow: selected
      ? "0 0 0 1px var(--cn-color-brand-600, #254d87)"
      : "var(--cn-shadow-xs, none)",
    borderRadius: "var(--cn-radius-md, 8px)",
    backgroundColor: "var(--cn-color-surface, #ffffff)",
    color: "var(--cn-color-text, #222831)",
    fontFamily: "inherit",
  };

  return (
    <Box
      ref={ref}
      data-cn-deal-card
      data-status={status}
      className={className}
      sx={[{ minWidth: 0, maxWidth: "100%" }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {onClick ? (
        <ButtonBase
          onClick={onClick}
          aria-pressed={selected || undefined}
          sx={[
            frame,
            {
              "&:hover": { borderColor: "var(--cn-color-border-strong, #b8bec6)" },
              "&.Mui-focusVisible": {
                boxShadow: "var(--cn-shadow-focus, 0 0 0 3px rgba(61, 90, 254, 0.35))",
              },
            },
          ]}
        >
          {body}
        </ButtonBase>
      ) : (
        <Box sx={frame}>{body}</Box>
      )}
    </Box>
  );
});

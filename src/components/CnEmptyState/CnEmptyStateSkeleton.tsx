import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import type { CnEmptyStateSize, CnEmptyStateVariant } from "./CnEmptyState";

export type CnEmptyStateSkeletonProps = CnSkeletonCommonProps & {
  variant?: CnEmptyStateVariant;
  size?: CnEmptyStateSize;
  /** Ícono circular (por defecto, como el ícono "inbox" del estado vacío). */
  icon?: boolean;
  /** Ilustración propia en lugar del ícono (cuadro 4:3 según el tamaño). */
  illustration?: boolean;
  /** Título: con texto, el ancho sigue su longitud. */
  title?: boolean | string;
  /** Descripción: con texto, las líneas se estiman por su longitud. */
  description?: boolean | string;
  /** Líneas de la descripción (prevalece sobre la estimación). */
  lines?: number;
  /** Acciones: `true` = un botón, o el número de botones. */
  action?: boolean | number;
};

type Tokens = {
  iconBox: number;
  padding: number;
  gap: number;
  title: number;
  desc: number;
  illustration: number;
  button: number;
};

/** Medidas reales de `CnEmptyState` por tamaño (y la variante compacta). */
const SIZES: Record<CnEmptyStateSize, Tokens> = {
  sm: { iconBox: 40, padding: 16, gap: 8, title: 12, desc: 11, illustration: 96, button: 32 },
  md: { iconBox: 56, padding: 32, gap: 12, title: 13, desc: 12, illustration: 140, button: 40 },
  lg: { iconBox: 72, padding: 48, gap: 16, title: 14, desc: 13, illustration: 180, button: 40 },
};

const COMPACT: Tokens = {
  iconBox: 32,
  padding: 8,
  gap: 6,
  title: 12,
  desc: 11,
  illustration: 72,
  button: 32,
};

/** Skeleton de `CnEmptyState` con las mismas variantes, tamaños y piezas. */
export const CnEmptyStateSkeleton = ({
  variant = "default",
  size = "md",
  icon = true,
  illustration = false,
  title = true,
  description = true,
  lines,
  action = false,
  animation,
  ariaLabel = "Cargando estado vacío",
  sx,
  className,
}: CnEmptyStateSkeletonProps) => {
  const t = variant === "compact" ? COMPACT : SIZES[size];
  const maxWidth = variant === "compact" ? 280 : 400;
  const descChars = typeof description === "string" ? description.length : 0;
  const descWidth = descChars
    ? Math.min(maxWidth, Math.round(descChars * t.desc * 0.52))
    : Math.round(maxWidth * 0.8);
  const descLines =
    lines ??
    (description
      ? descChars
        ? Math.min(3, Math.max(1, Math.ceil((descChars * t.desc * 0.52) / maxWidth)))
        : 2
      : 0);
  const titleWidth =
    typeof title === "string"
      ? Math.min(maxWidth, Math.max(32, Math.round(title.length * t.title * 0.6)))
      : Math.round(t.title * 9);
  const actions = typeof action === "number" ? action : action ? 1 : 0;

  return (
    <CnSkeletonGroup
      name="empty-state"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[
        {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        },
        variant === "card"
          ? {
              backgroundColor: "var(--cn-color-surface, #ffffff)",
              border: "1px dashed var(--cn-color-border, #dde0e4)",
              borderRadius: "var(--cn-radius-lg, 12px)",
            }
          : {},
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: `${t.gap}px`,
          p: `${t.padding}px`,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {illustration ? (
          <SkBlock
            width={t.illustration}
            height={Math.round(t.illustration * 0.75)}
            radius="var(--cn-radius-md, 8px)"
          />
        ) : (
          icon && <SkBlock circle width={t.iconBox} />
        )}

        {(title || descLines > 0) && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              width: descLines > 0 ? descWidth : undefined,
              maxWidth: "100%",
            }}
          >
            {title && <SkText width={titleWidth} size={t.title} sx={{ maxWidth: "100%" }} />}
            {Array.from({ length: descLines }, (_, i) => (
              <SkText
                key={i}
                size={t.desc}
                width={i === descLines - 1 && descLines > 1 ? "64%" : "100%"}
              />
            ))}
          </Box>
        )}

        {actions > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              flexWrap: "wrap",
              mt: `${Math.round(t.gap / 2)}px`,
            }}
          >
            {Array.from({ length: actions }, (_, i) => (
              <SkBlock
                key={i}
                width={i === 0 ? 120 : 96}
                height={t.button}
                radius="var(--cn-radius-md, 8px)"
              />
            ))}
          </Box>
        )}
      </Box>
    </CnSkeletonGroup>
  );
};

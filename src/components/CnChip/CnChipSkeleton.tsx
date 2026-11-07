import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import type { CnChipShape, CnChipSize, CnChipVariant } from "./CnChip";

export type CnChipSkeletonProps = CnSkeletonCommonProps & {
  variant?: CnChipVariant;
  size?: CnChipSize;
  /** Sin valor sigue la regla del chip: círculo para solo-ícono o contadores cortos. */
  shape?: CnChipShape;
  /** Etiqueta: con texto, el ancho sigue su longitud. */
  label?: boolean | string | number;
  subtitle?: boolean | string;
  icon?: boolean | string;
  avatar?: boolean;
  /** Ícono de quitar (equivale a `onDelete`). */
  deletable?: boolean;
  withChevron?: boolean;
  compact?: boolean;
};

/** Medidas reales de `CnChip` por tamaño. */
const SIZES: Record<
  CnChipSize,
  { height: number; minWidth: number; paddingX: number; icon: number; avatar: number; font: number }
> = {
  small: { height: 24, minWidth: 48, paddingX: 8, icon: 14, avatar: 18, font: 11 },
  medium: { height: 32, minWidth: 56, paddingX: 12, icon: 16, avatar: 22, font: 12 },
  large: { height: 40, minWidth: 64, paddingX: 16, icon: 18, avatar: 28, font: 13 },
};

const RADIUS: Record<CnChipShape, string> = {
  pill: "var(--cn-radius-full, 9999px)",
  rounded: "var(--cn-radius-md, 8px)",
  circle: "50%",
};

const textWidth = (value: boolean | string | number | undefined, font: number, fallback: number) =>
  typeof value === "string" || typeof value === "number"
    ? Math.max(8, Math.round(String(value).length * font * 0.62))
    : Math.round(font * fallback);

/** Skeleton de `CnChip` con las mismas variantes, tamaños, formas y ranuras. */
export const CnChipSkeleton = ({
  variant = "soft",
  size = "medium",
  shape,
  label = true,
  subtitle = false,
  icon = false,
  avatar = false,
  deletable = false,
  withChevron = false,
  compact = false,
  animation,
  ariaLabel = "Cargando chip",
  sx,
  className,
}: CnChipSkeletonProps) => {
  const t = SIZES[size];
  const hasLabel = typeof label === "string" ? label.length > 0 : Boolean(label) || label === 0;
  const hasSlot = Boolean(icon) || avatar;
  const counter = !hasSlot && typeof label === "string" && label.length > 0 && label.length <= 2;
  const resolvedShape: CnChipShape =
    shape ?? ((hasSlot && !hasLabel) || counter ? "circle" : "pill");
  const isCircle = resolvedShape === "circle";
  const pad = compact ? t.paddingX / 2 : t.paddingX;
  const trailing = deletable || withChevron;

  const labelWidth = hasLabel ? textWidth(label, t.font, 4.5) : 0;
  const subtitleWidth = subtitle ? textWidth(subtitle, t.font * 0.7, 5) : 0;
  const slotWidth = avatar ? t.avatar + (compact ? 0 : 4) : icon ? t.icon + pad : 0;
  const naturalWidth = isCircle
    ? t.height
    : Math.max(
        t.minWidth,
        slotWidth +
          (hasLabel ? Math.max(labelWidth, subtitleWidth) + pad * 2 : pad) +
          (trailing ? t.icon + pad : 0),
      );

  // Fondo sólido (relleno o tenue): el chip entero es la pieza.
  const solid = variant === "filled" || variant === "soft";

  const body = solid ? (
    <SkBlock width={naturalWidth} height={t.height} radius={RADIUS[resolvedShape]} />
  ) : (
    <Box
      sx={{
        width: naturalWidth,
        height: t.height,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: isCircle ? "center" : "flex-start",
        borderRadius: RADIUS[resolvedShape],
        ...((variant === "outlined" || variant === "light") && {
          border: "1px solid var(--cn-color-border, #dde0e4)",
        }),
        ...(variant === "light" && { backgroundColor: "var(--cn-color-surface, #ffffff)" }),
      }}
    >
      {isCircle ? (
        avatar ? (
          <SkBlock circle width={t.avatar} />
        ) : icon ? (
          <SkBlock circle width={t.icon} />
        ) : (
          <SkText width={Math.round(t.font * 1.1)} size={t.font} />
        )
      ) : (
        <>
          {avatar && <SkBlock circle width={t.avatar} sx={{ ml: compact ? 0 : "4px" }} />}
          {!avatar && icon && <SkBlock circle width={t.icon} sx={{ ml: `${pad}px` }} />}
          {hasLabel && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                px: `${pad}px`,
                flex: 1,
                minWidth: 0,
              }}
            >
              <SkText width={labelWidth} size={t.font} />
              {subtitle && <SkText width={subtitleWidth} size={Math.round(t.font * 0.7)} />}
            </Box>
          )}
          {trailing && (
            <SkBlock circle width={t.icon} sx={{ mr: `${pad}px`, ml: hasLabel ? 0 : "auto" }} />
          )}
        </>
      )}
    </Box>
  );

  return (
    <CnSkeletonGroup
      name="chip"
      inline
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      {body}
    </CnSkeletonGroup>
  );
};

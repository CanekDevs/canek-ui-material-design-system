import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock } from "../CnSkeleton";
import type { CnBadgeOverlap, CnBadgeSize, CnBadgeVariant } from "./CnBadge";

export type CnBadgeSkeletonProps = CnSkeletonCommonProps & {
  variant?: CnBadgeVariant;
  size?: CnBadgeSize;
  /** Contenido de la insignia: con texto/número, el ancho de la píldora sigue su longitud. */
  content?: boolean | string | number;
  max?: number;
  /** Muestra un marcador del elemento envuelto (avatar, ícono, botón…) bajo la insignia. */
  child?: boolean;
  /** Forma del elemento envuelto y de la superposición (como `overlap`). */
  overlap?: CnBadgeOverlap;
  /** Lado del marcador del elemento envuelto (px). */
  childSize?: number;
  anchorOrigin?: { vertical: "top" | "bottom"; horizontal: "left" | "right" };
};

/** Medidas reales de `CnBadge` por tamaño. */
const SIZES: Record<
  CnBadgeSize,
  { dot: number; height: number; minWidth: number; font: number; paddingX: number }
> = {
  sm: { dot: 6, height: 14, minWidth: 14, font: 9, paddingX: 4 },
  md: { dot: 8, height: 18, minWidth: 18, font: 10, paddingX: 5 },
  lg: { dot: 10, height: 22, minWidth: 22, font: 11, paddingX: 6 },
};

const contentLength = (
  variant: CnBadgeVariant,
  content: CnBadgeSkeletonProps["content"],
  max: number,
) => {
  if (typeof content === "number") {
    return variant === "count" && content > max ? `${max}+`.length : String(content).length;
  }
  if (typeof content === "string") return content.length;
  return variant === "label" ? 4 : 1;
};

/** Skeleton de `CnBadge`: punto, contador o etiqueta, suelto o sobre su elemento. */
export const CnBadgeSkeleton = ({
  variant = "count",
  size = "md",
  content = true,
  max = 99,
  child = false,
  overlap = "rectangular",
  childSize = 40,
  anchorOrigin = { vertical: "top", horizontal: "right" },
  animation,
  ariaLabel = "Cargando insignia",
  sx,
  className,
}: CnBadgeSkeletonProps) => {
  const t = SIZES[size];
  const isDot = variant === "dot";
  const chars = contentLength(variant, content, max);
  const pillWidth = Math.max(
    variant === "count" ? t.minWidth : 0,
    t.paddingX * 2 + Math.round(chars * t.font * (variant === "label" ? 0.72 : 0.62)),
  );

  const badge = (
    <SkBlock
      circle={isDot}
      width={isDot ? t.dot : pillWidth}
      height={isDot ? t.dot : t.height}
      radius={isDot ? undefined : variant === "label" ? "var(--cn-radius-sm, 6px)" : 9999}
    />
  );

  if (!child) {
    return (
      <CnSkeletonGroup
        name="badge"
        inline
        animation={animation}
        ariaLabel={ariaLabel}
        sx={sx}
        className={className}
      >
        {badge}
      </CnSkeletonGroup>
    );
  }

  // Con elemento envuelto: la insignia se ancla a la esquina igual que en MUI.
  const inset = overlap === "circular" ? "14%" : 0;
  const tx = anchorOrigin.horizontal === "right" ? "50%" : "-50%";
  const ty = anchorOrigin.vertical === "top" ? "-50%" : "50%";

  return (
    <CnSkeletonGroup
      name="badge"
      inline
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        <SkBlock
          circle={overlap === "circular"}
          width={childSize}
          radius={overlap === "circular" ? undefined : "var(--cn-radius-md, 8px)"}
        />
        <Box
          data-cn-badge-skeleton-anchor
          sx={{
            position: "absolute",
            display: "flex",
            [anchorOrigin.vertical]: inset,
            [anchorOrigin.horizontal]: inset,
            transform: `translate(${tx}, ${ty})`,
            borderRadius: isDot ? "50%" : variant === "label" ? "var(--cn-radius-sm, 6px)" : 9999,
            boxShadow: "0 0 0 2px var(--cn-color-surface, #ffffff)",
            backgroundColor: "var(--cn-color-surface, #ffffff)",
          }}
        >
          {badge}
        </Box>
      </Box>
    </CnSkeletonGroup>
  );
};

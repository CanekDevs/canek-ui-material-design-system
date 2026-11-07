import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock } from "../CnSkeleton";
import type { CnAvatarSize, CnAvatarVariant } from "./CnAvatar";
import type { CnAvatarGroupSpacing } from "./CnAvatarGroup";

const SIZE_MAP: Record<CnAvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  "2xl": 80,
};

const SPACING_MAP: Record<"tight" | "normal" | "loose", number> = {
  tight: -12,
  normal: -8,
  loose: -4,
};

const RADIUS: Record<CnAvatarVariant, string> = {
  circular: "50%",
  rounded: "var(--cn-radius-md, 8px)",
  square: "0",
};

const resolveSize = (size: CnAvatarSize | number) =>
  typeof size === "number" ? size : SIZE_MAP[size];

// ─── Avatar ──────────────────────────────────────────────────────────

export type CnAvatarSkeletonProps = CnSkeletonCommonProps & {
  size?: CnAvatarSize | number;
  variant?: CnAvatarVariant;
  /** Punto de estado en la esquina inferior derecha. */
  status?: boolean;
  /** Insignia en la esquina (contador). */
  badge?: boolean;
  badgeAnchor?: { vertical: "top" | "bottom"; horizontal: "left" | "right" };
  /** Anillo del color de la superficie, como `bordered`. */
  bordered?: boolean;
};

/** Skeleton de `CnAvatar` con los mismos tamaños, formas, estado e insignia. */
export const CnAvatarSkeleton = ({
  size = "md",
  variant = "circular",
  status = false,
  badge = false,
  badgeAnchor = { vertical: "top", horizontal: "right" },
  bordered = false,
  animation,
  ariaLabel = "Cargando avatar",
  sx,
  className,
}: CnAvatarSkeletonProps) => {
  const px = resolveSize(size);
  const statusSize = Math.max(8, Math.round(px * 0.28));
  const ring = "0 0 0 2px var(--cn-color-surface, #ffffff)";

  return (
    <CnSkeletonGroup
      name="avatar"
      inline
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <Box
        sx={{
          position: "relative",
          display: "inline-flex",
          borderRadius: RADIUS[variant],
          ...(bordered && { boxShadow: ring }),
        }}
      >
        <SkBlock width={px} height={px} radius={RADIUS[variant]} />
        {status && (
          <Box
            data-cn-avatar-skeleton-status
            sx={{
              position: "absolute",
              bottom: 0,
              right: 0,
              display: "flex",
              borderRadius: "50%",
              boxShadow: ring,
              backgroundColor: "var(--cn-color-surface, #ffffff)",
            }}
          >
            <SkBlock circle width={statusSize} />
          </Box>
        )}
        {badge && (
          <Box
            data-cn-avatar-skeleton-badge
            sx={{
              position: "absolute",
              display: "flex",
              [badgeAnchor.vertical]: "14%",
              [badgeAnchor.horizontal]: "14%",
              transform: `translate(${badgeAnchor.horizontal === "right" ? "50%" : "-50%"}, ${
                badgeAnchor.vertical === "top" ? "-50%" : "50%"
              })`,
              borderRadius: 9999,
              boxShadow: ring,
              backgroundColor: "var(--cn-color-surface, #ffffff)",
            }}
          >
            <SkBlock width={statusSize + 4} height={statusSize + 4} radius={9999} />
          </Box>
        )}
      </Box>
    </CnSkeletonGroup>
  );
};

// ─── Grupo de avatares ───────────────────────────────────────────────

export type CnAvatarGroupSkeletonProps = CnSkeletonCommonProps & {
  /** Número de avatares del grupo. */
  count?: number;
  /** Máximo visible (incluye el avatar "+N"), como en `CnAvatarGroup`. */
  max?: number;
  /** Total real si es mayor que `count`. */
  total?: number;
  spacing?: CnAvatarGroupSpacing;
  variant?: CnAvatarVariant;
  size?: CnAvatarSize | number;
};

/** Skeleton de `CnAvatarGroup`: avatares superpuestos y el excedente "+N". */
export const CnAvatarGroupSkeleton = ({
  count = 4,
  max = 4,
  total,
  spacing = "normal",
  variant = "circular",
  size = "md",
  animation,
  ariaLabel = "Cargando avatares",
  sx,
  className,
}: CnAvatarGroupSkeletonProps) => {
  const px = resolveSize(size);
  const overlap = typeof spacing === "number" ? spacing : SPACING_MAP[spacing];
  const clampedMax = Math.max(2, max);
  const all = Math.max(total ?? count, count);
  const overflow = all > clampedMax;
  const visible = overflow ? Math.min(count, clampedMax - 1) : count;
  const items = visible + (overflow ? 1 : 0);

  return (
    <CnSkeletonGroup
      name="avatar-group"
      inline
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      {Array.from({ length: items }, (_, i) => (
        <Box
          key={i}
          data-cn-avatar-group-skeleton-item={i === visible ? "surplus" : "avatar"}
          sx={{
            display: "inline-flex",
            borderRadius: RADIUS[variant],
            border: "2px solid var(--cn-color-surface, #ffffff)",
            backgroundColor: "var(--cn-color-surface, #ffffff)",
            ml: i === 0 ? 0 : `${overlap}px`,
          }}
        >
          <SkBlock width={px} height={px} radius={RADIUS[variant]} />
        </Box>
      ))}
    </CnSkeletonGroup>
  );
};

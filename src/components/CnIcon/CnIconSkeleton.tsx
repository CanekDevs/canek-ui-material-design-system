import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock } from "../CnSkeleton";
import type { CnIconSize } from "./CnIcon";

export type CnIconSkeletonProps = CnSkeletonCommonProps & {
  size?: CnIconSize | number;
  /** Círculo en lugar de cuadro redondeado (íconos circulares). */
  circle?: boolean;
};

/** Medidas reales de `CnIcon` por tamaño. */
const SIZE_MAP: Record<CnIconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  "2xl": 40,
};

/** Skeleton de `CnIcon`: un glifo del mismo tamaño. */
export const CnIconSkeleton = ({
  size = "md",
  circle = false,
  animation,
  ariaLabel = "Cargando ícono",
  sx,
  className,
}: CnIconSkeletonProps) => {
  const px = typeof size === "number" ? size : SIZE_MAP[size];
  return (
    <CnSkeletonGroup
      name="icon"
      inline
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      {/* Los glifos dejan ~10% de margen en su caja de 24px. */}
      <SkBlock
        circle={circle}
        width={Math.round(px * 0.84)}
        radius={circle ? undefined : Math.max(2, Math.round(px * 0.2))}
        sx={{ m: `${Math.round(px * 0.08)}px` }}
      />
    </CnSkeletonGroup>
  );
};

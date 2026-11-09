import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup } from "../CnSkeleton";
import type { CnSearchFieldProps } from "./CnSearchField";

export type CnSearchFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: NonNullable<CnSearchFieldProps["size"]>;
  label?: boolean | string;
  helperText?: boolean | string;
};

/** Skeleton de `CnSearchField`: campo con ícono de lupa. */
export const CnSearchFieldSkeleton = ({
  size = "md",
  label = true,
  helperText = false,
  animation,
  ariaLabel = "Cargando búsqueda",
  sx,
  className,
}: CnSearchFieldSkeletonProps) => (
  <CnSkeletonGroup
    name="search-field"
    animation={animation}
    ariaLabel={ariaLabel}
    sx={sx}
    className={className}
  >
    <CnFieldSkeleton
      size={size}
      label={Boolean(label)}
      helperText={Boolean(helperText)}
      startAdornment="icon"
    />
  </CnSkeletonGroup>
);

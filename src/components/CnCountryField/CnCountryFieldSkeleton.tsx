import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup } from "../CnSkeleton";
import type { CnAutocompleteFieldSkeletonProps } from "../CnAutocompleteField/CnAutocompleteFieldSkeleton";
import { CnAutocompleteFieldSkeleton } from "../CnAutocompleteField/CnAutocompleteFieldSkeleton";
import type { CnCountryFieldProps } from "./CnCountryField";

export type CnCountryFieldSkeletonProps = CnSkeletonCommonProps &
  Pick<
    CnAutocompleteFieldSkeletonProps,
    "variant" | "label" | "helperText" | "selectedCount" | "value" | "fullWidth" | "width"
  > & {
    size?: NonNullable<CnCountryFieldProps["size"]>;
    /** Varios países como chips. */
    multiple?: CnCountryFieldProps["multiple"];
    /** Chips visibles antes del "+N". Por defecto 3. */
    limitTags?: CnCountryFieldProps["limitTags"];
  };

/** Skeleton de `CnCountryField`: bandera + nombre, o chips con selección múltiple. */
export const CnCountryFieldSkeleton = ({
  animation,
  ariaLabel = "Cargando selector de país",
  sx,
  className,
  ...field
}: CnCountryFieldSkeletonProps) => (
  <CnSkeletonGroup
    name="country-field"
    animation={animation}
    ariaLabel={ariaLabel}
    sx={sx}
    className={className}
  >
    <CnAutocompleteFieldSkeleton {...field} optionMedia mediaShape="flag" />
  </CnSkeletonGroup>
);

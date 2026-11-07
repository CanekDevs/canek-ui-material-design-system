import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup } from "../CnSkeleton";
import type { CnNumberFieldSkeletonProps } from "../CnNumberField/CnNumberFieldSkeleton";
import { CnNumberFieldSkeleton } from "../CnNumberField/CnNumberFieldSkeleton";
import type { CnCurrencyFieldProps, CnCurrencySelectorMode } from "./CnCurrencyField";

/** Ancho del prefijo según lo que muestra: símbolo, "$ MXN" o selector "$ MXN ▾". */
const PREFIX_WIDTH: Record<CnCurrencySelectorMode, number> = {
  hidden: 12,
  readonly: 36,
  editable: 50,
};

export type CnCurrencyFieldSkeletonProps = CnSkeletonCommonProps &
  Pick<
    CnNumberFieldSkeletonProps,
    | "variant"
    | "label"
    | "helperText"
    | "suffix"
    | "clearable"
    | "textAlign"
    | "value"
    | "fullWidth"
    | "width"
  > & {
    size?: NonNullable<CnCurrencyFieldProps["size"]>;
    /** Símbolo solo, código de moneda o selector de moneda al inicio. */
    currencySelectorMode?: CnCurrencySelectorMode;
    controls?: CnCurrencyFieldProps["controls"];
  };

/** Skeleton de `CnCurrencyField`: prefijo de moneda (según el modo) y monto. */
export const CnCurrencyFieldSkeleton = ({
  currencySelectorMode = "hidden",
  controls = "none",
  animation,
  ariaLabel = "Cargando campo de moneda",
  sx,
  className,
  ...field
}: CnCurrencyFieldSkeletonProps) => (
  <CnSkeletonGroup
    name="currency-field"
    animation={animation}
    ariaLabel={ariaLabel}
    sx={sx}
    className={className}
  >
    <CnNumberFieldSkeleton
      {...field}
      controls={controls}
      prefix
      prefixWidth={PREFIX_WIDTH[currencySelectorMode]}
    />
  </CnSkeletonGroup>
);

import type { CnFieldSkeletonProps, CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup } from "../CnSkeleton";
import { SkChipRow, SkFieldContent, SkFieldValue } from "../CnSelectField/CnSelectFieldSkeleton";
import type { CnTreeSelectFieldProps } from "./CnTreeSelectField";

/** Chips visibles antes del "+N" (igual que el campo). */
const CHIP_LIMIT = 4;

export type CnTreeSelectFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: NonNullable<CnTreeSelectFieldProps["size"]>;
  variant?: CnFieldSkeletonProps["variant"];
  /** Etiqueta flotante (`true` o el texto, como en el campo). */
  label?: boolean | string;
  helperText?: boolean | string;
  /** Selección múltiple: chips (4 visibles + "+N"). */
  multiple?: CnTreeSelectFieldProps["multiple"];
  /** Elementos seleccionados que se simulan con `multiple`. Por defecto 2. */
  selectedCount?: number;
  clearable?: CnTreeSelectFieldProps["clearable"];
  /** Ruta completa (`Ventas / Norte`): valor más largo. */
  showPath?: CnTreeSelectFieldProps["showPath"];
  /** Muestra el valor; `false` simula el campo vacío (placeholder). */
  value?: boolean;
  fullWidth?: boolean;
  width?: number | string;
};

/** Skeleton de `CnTreeSelectField`: valor o ruta, chips con límite, limpiar y flecha. */
export const CnTreeSelectFieldSkeleton = ({
  size = "md",
  variant = "outlined",
  label = true,
  helperText = false,
  multiple = false,
  selectedCount = 2,
  clearable = true,
  showPath = false,
  value = true,
  fullWidth = true,
  width,
  animation,
  ariaLabel = "Cargando selector jerárquico",
  sx,
  className,
}: CnTreeSelectFieldSkeletonProps) => {
  const count = Math.max(0, selectedCount);
  const hasValue = value && (!multiple || count > 0);
  return (
    <CnSkeletonGroup
      name="tree-select-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <CnFieldSkeleton
        size={size}
        variant={variant}
        label={Boolean(label)}
        helperText={Boolean(helperText)}
        fullWidth={fullWidth}
        width={width}
        endAdornment="chevron"
      >
        <SkFieldContent clear={clearable && hasValue}>
          {!hasValue ? (
            <SkFieldValue size={size} width="30%" />
          ) : multiple ? (
            <SkChipRow count={count} limit={CHIP_LIMIT} />
          ) : (
            <SkFieldValue size={size} width={showPath ? "68%" : "42%"} />
          )}
        </SkFieldContent>
      </CnFieldSkeleton>
    </CnSkeletonGroup>
  );
};

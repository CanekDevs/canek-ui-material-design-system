import type { CnFieldSkeletonProps, CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, useSkeletonGroup } from "../CnSkeleton";
import { SkChipRow, SkFieldContent, SkFieldValue } from "../CnSelectField/CnSelectFieldSkeleton";
import type { CnAutocompleteFieldProps } from "./CnAutocompleteField";

export type CnAutocompleteFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: NonNullable<CnAutocompleteFieldProps["size"]>;
  variant?: CnFieldSkeletonProps["variant"];
  /** Etiqueta flotante (`true` o el texto, como en el campo). */
  label?: boolean | string;
  helperText?: boolean | string;
  /** Selección múltiple: los valores se muestran como chips. */
  multiple?: CnAutocompleteFieldProps["multiple"];
  /** Chips seleccionados que se simulan con `multiple`. Por defecto 2. */
  selectedCount?: number;
  /** Chips visibles antes del "+N" (como en el campo). Por defecto 3. */
  limitTags?: CnAutocompleteFieldProps["limitTags"];
  /** Sin flecha de apertura (texto libre). */
  freeSolo?: CnAutocompleteFieldProps["freeSolo"];
  /** El valor lleva imagen, bandera o ícono (opciones con media). */
  optionMedia?: boolean;
  /** Bandera en lugar de círculo como media (selector de país). */
  mediaShape?: "circle" | "flag";
  /** Muestra el valor; `false` simula el campo vacío (placeholder). */
  value?: boolean;
  fullWidth?: boolean;
  width?: number | string;
};

/** Skeleton de `CnAutocompleteField`: valor o chips con límite, y flecha de apertura. */
export const CnAutocompleteFieldSkeleton = ({
  size = "md",
  variant = "outlined",
  label = true,
  helperText = false,
  multiple = false,
  selectedCount = 2,
  limitTags = 3,
  freeSolo = false,
  optionMedia = false,
  mediaShape = "circle",
  value = true,
  fullWidth = true,
  width,
  animation,
  ariaLabel = "Cargando campo de búsqueda",
  sx,
  className,
}: CnAutocompleteFieldSkeletonProps) => {
  const group = useSkeletonGroup();
  const count = Math.max(0, selectedCount);
  const hasValue = value && (!multiple || count > 0);
  const flag = !multiple && hasValue && optionMedia && mediaShape === "flag";

  const field = (
    <CnFieldSkeleton
      size={size}
      variant={variant}
      label={Boolean(label)}
      helperText={Boolean(helperText)}
      fullWidth={fullWidth}
      width={width}
      startAdornment={flag ? "flag" : false}
      endAdornment={freeSolo ? false : "chevron"}
    >
      <SkFieldContent>
        {!hasValue ? (
          <SkFieldValue size={size} width="30%" />
        ) : multiple ? (
          <SkChipRow count={count} limit={limitTags < 0 ? undefined : limitTags} height={24} />
        ) : (
          <SkFieldValue size={size} media={optionMedia && !flag} />
        )}
      </SkFieldContent>
    </CnFieldSkeleton>
  );

  // Dentro de otro skeleton (p. ej. el de país) se integra como pieza.
  if (group) return field;
  return (
    <CnSkeletonGroup
      name="autocomplete-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      {field}
    </CnSkeletonGroup>
  );
};

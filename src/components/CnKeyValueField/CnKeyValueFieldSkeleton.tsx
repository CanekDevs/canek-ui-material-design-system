import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkBlock, SkLabeled, SkText } from "../CnSkeleton";
import type { CnKeyValueFieldProps } from "./CnKeyValueField";

type Size = NonNullable<CnKeyValueFieldProps["size"]>;

export type CnKeyValueFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: Size;
  /** Número de pares clave–valor (por defecto 2). */
  rows?: number;
  /** Límite de filas: el botón "Agregar" se oculta al alcanzarlo. */
  maxRows?: number;
  /** Bloqueado (deshabilitado o solo lectura): sin botones de eliminar ni agregar. */
  readOnly?: boolean;
  label?: boolean | string;
  helperText?: boolean | string;
};

/** Skeleton de `CnKeyValueField`: filas de dos campos con eliminar y botón para agregar. */
export const CnKeyValueFieldSkeleton = ({
  size = "md",
  rows = 2,
  maxRows,
  readOnly = false,
  label = true,
  helperText = false,
  animation,
  ariaLabel = "Cargando pares clave–valor",
  sx,
  className,
}: CnKeyValueFieldSkeletonProps) => {
  const count = Math.max(0, rows);
  const canAdd = !readOnly && (maxRows === undefined || count < maxRows);

  return (
    <CnSkeletonGroup
      name="key-value-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <SkLabeled label={Boolean(label)} helperText={Boolean(helperText)} fontSize={12}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {count === 0 && <SkText width={84} size={12} />}
          {Array.from({ length: count }, (_, index) => (
            <Box
              key={index}
              data-cn-skeleton-row
              sx={{ display: "flex", alignItems: "flex-start", gap: "8px" }}
            >
              <Box sx={{ flex: 2, minWidth: 0 }}>
                <CnFieldSkeleton size={size} />
              </Box>
              <Box sx={{ flex: 3, minWidth: 0 }}>
                <CnFieldSkeleton size={size} />
              </Box>
              {!readOnly && (
                <Box
                  data-cn-skeleton-remove
                  sx={{
                    width: 34,
                    height: 34,
                    mt: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <SkBlock circle width={20} />
                </Box>
              )}
            </Box>
          ))}
          {canAdd && (
            <Box
              data-cn-skeleton-add
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                height: 30,
                px: "5px",
              }}
            >
              <SkBlock circle width={18} />
              <SkText width={56} size={13} />
            </Box>
          )}
        </Box>
      </SkLabeled>
    </CnSkeletonGroup>
  );
};

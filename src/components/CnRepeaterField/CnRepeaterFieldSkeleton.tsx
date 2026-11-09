import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkBlock, SkLabeled, SkText } from "../CnSkeleton";
import type { CnRepeaterFieldProps } from "./CnRepeaterField";

export type CnRepeaterFieldSkeletonProps = CnSkeletonCommonProps & {
  size?: NonNullable<CnRepeaterFieldProps["size"]>;
  label?: boolean | string;
  helperText?: boolean | string;
  /** Elementos de la lista (0 = estado vacío). Por defecto 3. */
  items?: number;
  /** Asa y botones subir/bajar. */
  reorderable?: boolean;
  /** Botón "Agregar". */
  addButton?: boolean;
  /** Contador de elementos. */
  counter?: boolean;
};

/** Skeleton de `CnRepeaterField`: filas con asa, campo y acciones, y el pie con "Agregar". */
export const CnRepeaterFieldSkeleton = ({
  size = "md",
  label = true,
  helperText = false,
  items = 3,
  reorderable = true,
  addButton = true,
  counter = true,
  animation,
  ariaLabel = "Cargando lista",
  sx,
  className,
}: CnRepeaterFieldSkeletonProps) => (
  <CnSkeletonGroup
    name="repeater-field"
    animation={animation}
    ariaLabel={ariaLabel}
    sx={sx}
    className={className}
  >
    <SkLabeled label={Boolean(label)} helperText={Boolean(helperText)} fontSize={12}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {items === 0 && (
          <Box
            data-cn-skeleton-empty
            sx={{
              p: "14px",
              display: "flex",
              justifyContent: "center",
              borderRadius: "var(--cn-radius-md, 8px)",
              border: "1px dashed var(--cn-color-border-strong, #c5cad0)",
            }}
          >
            <SkText width={90} size={12} />
          </Box>
        )}
        {Array.from({ length: Math.max(0, items) }, (_, i) => (
          <Box
            key={i}
            data-cn-skeleton-item
            sx={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            {reorderable && <SkBlock width={14} height={10} radius={2} />}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <CnFieldSkeleton size={size} label={false} />
            </Box>
            {reorderable && (
              <>
                <SkBlock circle width={18} />
                <SkBlock circle width={18} />
              </>
            )}
            <SkBlock circle width={18} />
          </Box>
        ))}
      </Box>
      {(addButton || counter) && (
        <Box sx={{ display: "flex", alignItems: "center", mt: "10px" }}>
          {addButton && <SkBlock width={84} height={24} radius={6} />}
          <Box sx={{ flex: 1 }} />
          {counter && <SkText width={56} size={11} />}
        </Box>
      )}
    </SkLabeled>
  </CnSkeletonGroup>
);

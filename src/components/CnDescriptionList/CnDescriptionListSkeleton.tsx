import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkText, varyWidth } from "../CnSkeleton";

export type CnDescriptionListSkeletonProps = CnSkeletonCommonProps & {
  /** Pares etiqueta–valor. */
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  minColumnWidth?: number;
  layout?: "stacked" | "inline";
  variant?: "plain" | "card";
  /** Línea de título arriba de la lista. */
  title?: boolean;
};

/** Skeleton de `CnDescriptionList`: mismas columnas, separación y disposición. */
export const CnDescriptionListSkeleton = ({
  count = 4,
  columns = 2,
  minColumnWidth = 200,
  layout = "stacked",
  variant = "plain",
  title = false,
  animation,
  ariaLabel = "Cargando",
  sx,
  className,
}: CnDescriptionListSkeletonProps) => {
  const track = `minmax(max(${minColumnWidth}px, calc((100% - ${columns - 1} * 16px) / ${columns})), 1fr)`;
  return (
    <CnSkeletonGroup
      name="description-list"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[
        variant === "card" && {
          p: "16px",
          border: "1px solid var(--cn-color-border, #dde0e4)",
          borderRadius: "var(--cn-radius-md, 8px)",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {title && <SkText width="35%" size={16} sx={{ mb: "12px" }} />}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill, ${track})`,
          columnGap: "16px",
          rowGap: layout === "inline" ? 0 : "16px",
        }}
      >
        {Array.from({ length: count }, (_, i) =>
          layout === "inline" ? (
            <Box
              key={i}
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(96px, 40%) minmax(0, 1fr)",
                gap: "12px",
                py: "10px",
              }}
            >
              <SkText width="70%" size={12} />
              <SkText width={varyWidth(i)} size={14} />
            </Box>
          ) : (
            <Box key={i} sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <SkText width="40%" size={12} />
              <SkText width={varyWidth(i)} size={14} />
            </Box>
          ),
        )}
      </Box>
    </CnSkeletonGroup>
  );
};

import Box from "@mui/material/Box";
import type { CnCardVariant } from "../CnCard";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import type { CnDocCardLayout } from "./CnDocCard";

export type CnDocCardSkeletonProps = CnSkeletonCommonProps & {
  layout?: CnDocCardLayout;
  variant?: CnCardVariant;
  selectable?: boolean;
  draggable?: boolean;
  status?: boolean;
  /** Número de etiquetas. */
  tags?: number;
  description?: boolean;
  /** Número de botones de acción. */
  actions?: number;
  width?: number | string;
};

const SURFACE: Record<CnCardVariant, Record<string, unknown>> = {
  elevated: {
    backgroundColor: "var(--cn-color-surface, #ffffff)",
    boxShadow: "var(--cn-shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.06))",
  },
  outlined: { border: "1px solid var(--cn-color-border, #dde0e4)" },
  filled: { backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)" },
  ghost: {},
};

/** Skeleton de `CnDocCard` para los tres layouts (lista, cuadrícula y compacto). */
export const CnDocCardSkeleton = ({
  layout = "list",
  variant = "outlined",
  selectable = false,
  draggable = false,
  status = false,
  tags = 0,
  description = false,
  actions = 3,
  width,
  animation,
  ariaLabel = "Cargando documento",
  sx,
  className,
}: CnDocCardSkeletonProps) => {
  const isGrid = layout === "grid";
  const isCompact = layout === "compact";

  const tagRow = tags > 0 && !isCompact && (
    <Box data-cn-doc-skeleton-tags sx={{ display: "flex", gap: "4px", mt: "4px" }}>
      {Array.from({ length: tags }, (_, i) => (
        <SkBlock key={i} width={44 + ((i * 17) % 24)} height={18} radius={9} />
      ))}
    </Box>
  );

  return (
    <CnSkeletonGroup
      name="doc-card"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[
        {
          width: width ?? "100%",
          borderRadius: "var(--cn-radius-lg, 12px)",
          overflow: "hidden",
          ...SURFACE[variant],
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {isGrid ? (
        <>
          <Box data-cn-doc-skeleton-thumb sx={{ position: "relative", aspectRatio: "4 / 3" }}>
            <SkBlock width="100%" height="100%" radius={0} />
            {selectable && (
              <Box sx={{ position: "absolute", top: 10, left: 10 }}>
                <SkBlock width={18} radius={4} />
              </Box>
            )}
            {actions > 0 && (
              <Box sx={{ position: "absolute", top: 8, right: 8 }}>
                <SkBlock circle width={26} />
              </Box>
            )}
          </Box>
          <Box sx={{ p: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <SkText width="80%" size={13} />
            <SkText width="50%" size={11} />
            {description && <SkText width="90%" size={11} />}
            {tagRow}
          </Box>
        </>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: isCompact ? "8px" : "12px",
            px: isCompact ? "8px" : "12px",
            py: isCompact ? "6px" : "10px",
          }}
        >
          {draggable && <SkBlock width={10} height={18} radius={3} />}
          {selectable && <SkBlock width={18} radius={4} />}
          <Box data-cn-doc-skeleton-thumb sx={{ display: "flex" }}>
            <SkBlock width={isCompact ? 28 : 44} radius="var(--cn-radius-md, 8px)" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
            <SkText width="58%" size={isCompact ? 12 : 13} />
            {!isCompact && <SkText width="40%" size={11} />}
            {description && !isCompact && <SkText width="72%" size={11} />}
            {tagRow}
          </Box>
          {status && <SkBlock width={64} height={20} radius={10} />}
          {actions > 0 && (
            <Box data-cn-doc-skeleton-actions sx={{ display: "flex", gap: "6px" }}>
              {Array.from({ length: actions }, (_, i) => (
                <SkBlock key={i} circle width={26} />
              ))}
            </Box>
          )}
        </Box>
      )}
    </CnSkeletonGroup>
  );
};

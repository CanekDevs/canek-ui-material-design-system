import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";

export type CnKanbanBoardSkeletonProps = CnSkeletonCommonProps & {
  columns?: number;
  /** Tarjetas por columna (varía un poco para no verse uniforme). */
  cards?: number;
  columnWidth?: number;
};

/** Skeleton de `CnKanbanBoard`: columnas con encabezado, total y tarjetas. */
export const CnKanbanBoardSkeleton = ({
  columns = 4,
  cards = 3,
  columnWidth = 280,
  animation,
  ariaLabel = "Cargando",
  sx,
  className,
}: CnKanbanBoardSkeletonProps) => (
  <CnSkeletonGroup
    name="kanban-board"
    animation={animation}
    ariaLabel={ariaLabel}
    className={className}
    sx={[{ overflowX: "hidden" }, ...(Array.isArray(sx) ? sx : [sx])]}
  >
    <Box sx={{ display: "flex", gap: "16px" }}>
      {Array.from({ length: columns }, (_, c) => (
        <Box
          key={c}
          sx={{
            flex: `0 0 ${columnWidth}px`,
            maxWidth: "85vw",
            p: "12px 8px",
            borderRadius: "var(--cn-radius-md, 8px)",
            border: "1px solid var(--cn-color-border, #dde0e4)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <Box sx={{ px: "4px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <SkText width="50%" size={14} />
            <SkText width="35%" size={12} />
          </Box>
          {Array.from({ length: Math.max(1, cards - (c % 2)) }, (_, i) => (
            <SkBlock key={i} width="100%" height={112} radius={8} />
          ))}
        </Box>
      ))}
    </Box>
  </CnSkeletonGroup>
);

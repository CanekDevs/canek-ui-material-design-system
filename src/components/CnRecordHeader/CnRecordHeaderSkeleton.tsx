import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";

export type CnRecordHeaderSkeletonProps = CnSkeletonCommonProps & {
  /** Datos clave bajo el título. */
  facts?: number;
  /** Botones de acción. */
  actions?: number;
  variant?: "plain" | "card";
};

/** Skeleton de `CnRecordHeader`: avatar, título, estado, acciones y datos clave. */
export const CnRecordHeaderSkeleton = ({
  facts = 3,
  actions = 2,
  variant = "plain",
  animation,
  ariaLabel = "Cargando",
  sx,
  className,
}: CnRecordHeaderSkeletonProps) => (
  <CnSkeletonGroup
    name="record-header"
    animation={animation}
    ariaLabel={ariaLabel}
    className={className}
    sx={[
      variant === "card" && {
        p: "24px",
        border: "1px solid var(--cn-color-border, #dde0e4)",
        borderRadius: "var(--cn-radius-lg, 12px)",
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: "16px" }}>
        <Box sx={{ display: "flex", gap: "16px", flex: "1 1 280px", minWidth: 0 }}>
          <SkBlock circle width={64} />
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", pt: "4px" }}>
            <SkText width="55%" size={22} />
            <SkText width="40%" size={14} />
            <SkBlock width={88} height={24} radius={12} />
          </Box>
        </Box>
        {actions > 0 && (
          <Box sx={{ display: "flex", gap: "8px", ml: "auto" }}>
            {Array.from({ length: actions }, (_, i) => (
              <SkBlock
                key={i}
                width={i === actions - 1 && actions > 1 ? 40 : 112}
                height={40}
                radius={8}
              />
            ))}
          </Box>
        )}
      </Box>
      {facts > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "12px 24px",
            pt: "16px",
            borderTop: "1px solid var(--cn-color-border-subtle, var(--cn-color-border, #dde0e4))",
          }}
        >
          {Array.from({ length: facts }, (_, i) => (
            <Box key={i} sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <SkText width="50%" size={12} />
              <SkText width="70%" size={14} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  </CnSkeletonGroup>
);

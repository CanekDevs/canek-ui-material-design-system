import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";

export type CnChatThreadSkeletonProps = CnSkeletonCommonProps & {
  height?: string | number;
};

const ROWS: { own: boolean; width: string }[] = [
  { own: false, width: "55%" },
  { own: false, width: "35%" },
  { own: true, width: "45%" },
  { own: false, width: "60%" },
  { own: true, width: "30%" },
];

/** Skeleton de `CnChatThread`: mensajes alternados y redactor al pie. */
export const CnChatThreadSkeleton = ({
  height = 560,
  animation,
  ariaLabel = "Cargando conversación",
  sx,
  className,
}: CnChatThreadSkeletonProps) => (
  <CnSkeletonGroup
    name="chat-thread"
    animation={animation}
    ariaLabel={ariaLabel}
    className={className}
    sx={[
      {
        height,
        display: "flex",
        flexDirection: "column",
        border: "1px solid var(--cn-color-border, #dde0e4)",
        borderRadius: "var(--cn-radius-lg, 12px)",
        overflow: "hidden",
        backgroundColor: "var(--cn-color-bg, #fafbfc)",
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    <Box
      sx={{ flex: 1, minHeight: 0, p: "16px", display: "grid", alignContent: "end", gap: "14px" }}
    >
      <SkText width={60} size={11} sx={{ justifySelf: "center" }} />
      {ROWS.map((row, i) => (
        <Box
          key={i}
          sx={{
            display: "flex",
            flexDirection: row.own ? "row-reverse" : "row",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
          {!row.own && <SkBlock width={32} height={32} circle />}
          <SkBlock width={row.width} height={44} radius={16} />
        </Box>
      ))}
    </Box>
    <Box
      sx={{
        height: 56,
        flex: "none",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        px: "16px",
        borderTop: "1px solid var(--cn-color-border, #dde0e4)",
        backgroundColor: "var(--cn-color-surface, #ffffff)",
      }}
    >
      <SkText width="60%" size={14} />
      <Box sx={{ flex: 1 }} />
      <SkBlock width={32} height={32} circle />
    </Box>
  </CnSkeletonGroup>
);

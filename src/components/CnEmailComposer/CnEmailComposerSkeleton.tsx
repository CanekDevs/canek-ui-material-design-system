import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnFieldSkeleton, CnSkeletonGroup, SkBlock } from "../CnSkeleton";

export type CnEmailComposerSkeletonProps = CnSkeletonCommonProps;

/** Skeleton de `CnEmailComposer`: Para, Asunto, editor, adjuntos y botones en su lugar. */
export const CnEmailComposerSkeleton = ({
  animation,
  ariaLabel = "Cargando redactor de correo",
  sx,
  className,
}: CnEmailComposerSkeletonProps) => (
  <CnSkeletonGroup
    name="email-composer"
    animation={animation}
    ariaLabel={ariaLabel}
    className={className}
    sx={[
      {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        p: "16px",
        border: "1px solid var(--cn-color-border, #dde0e4)",
        borderRadius: "var(--cn-radius-lg, 12px)",
        backgroundColor: "var(--cn-color-surface, #ffffff)",
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    <CnFieldSkeleton size="sm" />
    <CnFieldSkeleton size="sm" />
    <SkBlock width="100%" height={200} radius={8} />
    <SkBlock width="100%" height={44} radius={8} />
    <Box sx={{ display: "flex", gap: "8px" }}>
      <SkBlock width={96} height={36} radius={8} />
      <SkBlock width={150} height={36} radius={8} />
    </Box>
  </CnSkeletonGroup>
);

import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";

export type CnChatMessageSkeletonProps = CnSkeletonCommonProps & {
  /** Mensaje propio (alineado a la derecha, sin avatar). */
  own?: boolean;
};

/** Skeleton de `CnChatMessage`: avatar de 32 px, nombre, burbuja y hora en su lugar. */
export const CnChatMessageSkeleton = ({
  own = false,
  animation,
  ariaLabel = "Cargando mensaje",
  sx,
  className,
}: CnChatMessageSkeletonProps) => (
  <CnSkeletonGroup
    name="chat-message"
    animation={animation}
    ariaLabel={ariaLabel}
    className={className}
    sx={[
      {
        display: "flex",
        flexDirection: own ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: "8px",
        mt: "12px",
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {!own && <SkBlock width={32} height={32} circle />}
    <Box
      sx={{
        display: "grid",
        gap: "4px",
        justifyItems: own ? "end" : "start",
        width: "min(60%, 360px)",
      }}
    >
      {!own && <SkText width={90} size={12} />}
      <SkBlock width="100%" height={52} radius={16} />
      <SkText width={36} size={11} />
    </Box>
  </CnSkeletonGroup>
);

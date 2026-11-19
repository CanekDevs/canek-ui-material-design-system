import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText, useSkeletonGroup } from "../CnSkeleton";
import type { CnProfileCardLayout, CnProfileCardVariant } from "./CnProfileCard";

export type CnProfileCardSkeletonProps = CnSkeletonCommonProps & {
  layout?: CnProfileCardLayout;
  variant?: CnProfileCardVariant;
  cover?: boolean;
  status?: boolean;
  eyebrow?: boolean;
  event?: boolean;
  details?: number;
  tags?: number;
  /** Botones de contacto. */
  contacts?: number;
  quickActions?: number;
  width?: number | string;
};

const SURFACE: Record<CnProfileCardVariant, Record<string, unknown>> = {
  outlined: { border: "1px solid var(--cn-color-border, #dde0e4)" },
  elevated: {
    backgroundColor: "var(--cn-color-surface, #ffffff)",
    boxShadow: "var(--cn-shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.06))",
  },
  tinted: {
    backgroundColor: "var(--cn-color-neutral-50, #f8f9fa)",
    border: "1px solid var(--cn-color-border-subtle, #e9ecef)",
  },
  solid: { backgroundColor: "var(--cn-color-neutral-150, #e9ecef)" },
};

const AVATAR: Record<CnProfileCardLayout, number> = { compact: 40, horizontal: 48, vertical: 64 };

type BodyProps = Omit<CnProfileCardSkeletonProps, keyof CnSkeletonCommonProps | "width">;

/** Piezas de la tarjeta sin raíz accesible (para componer otros skeletons). */
export const ProfileCardSkeletonBody = ({
  layout = "horizontal",
  variant = "outlined",
  cover = false,
  status = false,
  eyebrow = true,
  event = true,
  details = 0,
  tags = 0,
  contacts = 0,
  quickActions = 0,
}: BodyProps) => {
  const isVertical = layout === "vertical";
  const isCompact = layout === "compact";
  const size = AVATAR[layout];

  const avatar = (
    <Box
      data-cn-profile-skeleton-avatar
      sx={{ position: "relative", display: "flex", flexShrink: 0 }}
    >
      <SkBlock circle width={size} />
      {status && (
        <Box sx={{ position: "absolute", right: 0, bottom: 0, display: "flex" }}>
          <SkBlock circle width={Math.round(size * 0.26)} />
        </Box>
      )}
    </Box>
  );

  const textLines = (
    <>
      {eyebrow && !isCompact && <SkText width={isVertical ? "40%" : "30%"} size={10} />}
      <SkText width={isVertical ? "60%" : "55%"} size={14} />
      <SkText width={isVertical ? "50%" : "42%"} size={12} />
      {event && !isCompact && (
        <Box
          sx={{
            display: "flex",
            gap: "6px",
            mt: "4px",
            justifyContent: isVertical ? "center" : "flex-start",
          }}
        >
          <SkText width={72} size={12} />
          <SkBlock width={56} height={18} radius={9} />
        </Box>
      )}
      {details > 0 &&
        !isCompact &&
        Array.from({ length: details }, (_, i) => <SkText key={i} width="70%" size={11} />)}
      {tags > 0 && !isCompact && (
        <Box
          sx={{
            display: "flex",
            gap: "4px",
            mt: "4px",
            justifyContent: isVertical ? "center" : "flex-start",
          }}
        >
          {Array.from({ length: tags }, (_, i) => (
            <SkBlock key={i} width={48 + ((i * 13) % 20)} height={18} radius={9} />
          ))}
        </Box>
      )}
    </>
  );

  const actionRow = (withContacts: boolean) =>
    ((withContacts && contacts > 0) || quickActions > 0) && (
      <Box
        data-cn-profile-skeleton-actions
        sx={{
          display: "flex",
          gap: "6px",
          mt: "10px",
          justifyContent: isVertical ? "center" : "flex-start",
        }}
      >
        {withContacts &&
          Array.from({ length: contacts }, (_, i) => <SkBlock key={`c${i}`} circle width={28} />)}
        {Array.from({ length: quickActions }, (_, i) => (
          <SkBlock key={`q${i}`} width={84} height={30} radius="var(--cn-radius-md, 8px)" />
        ))}
      </Box>
    );

  return (
    <Box
      data-cn-profile-skeleton={layout}
      sx={{
        width: "100%",
        boxSizing: "border-box",
        borderRadius: "var(--cn-radius-lg, 12px)",
        overflow: "hidden",
        ...SURFACE[variant],
      }}
    >
      {isVertical ? (
        <>
          {cover && (
            <Box data-cn-profile-skeleton-cover>
              <SkBlock width="100%" height={64} radius={0} />
            </Box>
          )}
          <Box
            sx={{
              px: "16px",
              pb: "16px",
              pt: cover ? 0 : "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Box sx={{ mt: cover ? "-32px" : 0, mb: "4px" }}>{avatar}</Box>
            {textLines}
            {actionRow(true)}
          </Box>
        </>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: isCompact ? "center" : "flex-start",
            gap: isCompact ? "12px" : "14px",
            p: isCompact ? "8px 12px" : "16px",
          }}
        >
          {avatar}
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
            {textLines}
            {!isCompact && actionRow(false)}
          </Box>
          {isCompact && event && <SkBlock width={60} height={18} radius={9} />}
          {!isCompact && contacts > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {Array.from({ length: contacts }, (_, i) => (
                <SkBlock key={i} circle width={26} />
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

/**
 * Skeleton de `CnProfileCard` en sus tres layouts. Dentro de otro skeleton
 * (`CnSkeletonGroup`) se integra como pieza sin crear otro `role="status"`.
 */
export const CnProfileCardSkeleton = ({
  width,
  animation,
  ariaLabel = "Cargando persona",
  sx,
  className,
  ...body
}: CnProfileCardSkeletonProps) => {
  const group = useSkeletonGroup();
  if (group) {
    return (
      <Box
        className={className}
        sx={[{ width: width ?? "100%" }, ...(Array.isArray(sx) ? sx : [sx])]}
      >
        <ProfileCardSkeletonBody {...body} />
      </Box>
    );
  }
  return (
    <CnSkeletonGroup
      name="profile-card"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[{ width: width ?? "100%" }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <ProfileCardSkeletonBody {...body} />
    </CnSkeletonGroup>
  );
};

import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkLines, SkText } from "../CnSkeleton";
import type { CnInfoCardLayout, CnInfoCardSize, CnInfoCardVariant } from "./CnInfoCard";

export type CnInfoCardSkeletonProps = CnSkeletonCommonProps & {
  variant?: CnInfoCardVariant;
  size?: CnInfoCardSize;
  layout?: CnInfoCardLayout;
  textAlign?: "left" | "center";
  icon?: boolean;
  iconPosition?: "start" | "end";
  label?: boolean;
  title?: boolean;
  /** Valor destacado (modo dato). */
  value?: boolean;
  /** Líneas de descripción. */
  lines?: number;
  /** Número de botones de acción. */
  actions?: number;
  dismissible?: boolean;
  media?: boolean;
  mediaPosition?: "top" | "start" | "end";
  width?: number | string;
};

const PAD: Record<CnInfoCardSize, number> = { sm: 12, md: 16, lg: 24 };
const ICON_BOX: Record<CnInfoCardSize, number> = { sm: 28, md: 34, lg: 42 };
const FONT: Record<CnInfoCardSize, { title: number; text: number; value: number }> = {
  sm: { title: 12, text: 11, value: 14 },
  md: { title: 13, text: 12, value: 16 },
  lg: { title: 16, text: 13, value: 20 },
};

/** Skeleton de `CnInfoCard`: superficie por variante, ícono, textos, acciones y medio. */
export const CnInfoCardSkeleton = ({
  variant = "soft",
  size = "md",
  layout = "horizontal",
  textAlign,
  icon = true,
  iconPosition = "start",
  label = false,
  title = true,
  value = false,
  lines = 2,
  actions = 0,
  dismissible = false,
  media = false,
  mediaPosition = "top",
  width,
  animation,
  ariaLabel = "Cargando tarjeta informativa",
  sx,
  className,
}: CnInfoCardSkeletonProps) => {
  const pad = PAD[size];
  const font = FONT[size];
  const vertical = layout === "vertical";
  const centered = (textAlign ?? (vertical ? "center" : "left")) === "center";
  const mediaOnTop = media && (mediaPosition === "top" || vertical);

  const surface: Record<string, unknown> = {
    soft: {
      backgroundColor: "var(--cn-color-neutral-50, #f8f9fa)",
      border: "1px solid var(--cn-color-border-subtle, #e9ecef)",
    },
    outlined: { border: "1px solid var(--cn-color-border, #dde0e4)" },
    filled: { backgroundColor: "var(--cn-color-neutral-150, #e9ecef)" },
    "left-accent": {
      border: "1px solid var(--cn-color-border, #dde0e4)",
      borderLeft: "4px solid var(--cn-color-border-strong, #c5cad0)",
    },
    elevated: {
      backgroundColor: "var(--cn-color-surface, #ffffff)",
      boxShadow: "var(--cn-shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.06))",
    },
  }[variant];

  const iconBlock = icon && (
    <Box data-cn-info-card-skeleton-icon sx={{ display: "flex", justifyContent: "center" }}>
      <SkBlock width={ICON_BOX[size]} radius="var(--cn-radius-md, 8px)" />
    </Box>
  );

  const sideMedia = media && !mediaOnTop && (
    <Box data-cn-info-card-skeleton-media sx={{ width: 112, flexShrink: 0, display: "flex" }}>
      <SkBlock
        width="100%"
        height="100%"
        radius="var(--cn-radius-md, 8px)"
        sx={{ minHeight: 72 }}
      />
    </Box>
  );

  const text = (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: centered ? "center" : "stretch",
        gap: "6px",
      }}
    >
      {label && <SkText width="30%" size={10} />}
      {title && <SkText width="55%" size={font.title} />}
      {value && <SkText width="45%" size={font.value} />}
      {lines > 0 && (
        <Box sx={{ width: "100%" }}>
          <SkLines lines={lines} size={font.text} lastWidth={centered ? "70%" : "62%"} />
        </Box>
      )}
      {actions > 0 && (
        <Box data-cn-info-card-skeleton-actions sx={{ display: "flex", gap: "8px", mt: "6px" }}>
          {Array.from({ length: actions }, (_, i) => (
            <SkBlock
              key={i}
              width={i === 0 ? 92 : 72}
              height={30}
              radius="var(--cn-radius-md, 8px)"
            />
          ))}
        </Box>
      )}
    </Box>
  );

  return (
    <CnSkeletonGroup
      name="info-card"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[
        {
          position: "relative",
          width: width ?? "100%",
          p: `${pad}px`,
          borderRadius: "var(--cn-radius-lg, 12px)",
          overflow: "hidden",
          ...surface,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {mediaOnTop && (
        <Box data-cn-info-card-skeleton-media sx={{ mb: "12px" }}>
          <SkBlock width="100%" height={120} radius="var(--cn-radius-md, 8px)" />
        </Box>
      )}
      <Box
        sx={{
          display: "flex",
          flexDirection: vertical ? "column" : "row",
          alignItems: vertical && centered ? "center" : "flex-start",
          gap: "12px",
        }}
      >
        {mediaPosition === "start" && sideMedia}
        {(vertical || iconPosition === "start") && iconBlock}
        {text}
        {!vertical && iconPosition === "end" && iconBlock}
        {mediaPosition === "end" && sideMedia}
        {dismissible && (
          <Box
            sx={
              vertical
                ? { position: "absolute", top: 8, right: 8, display: "flex" }
                : { display: "flex" }
            }
          >
            <SkBlock circle width={22} />
          </Box>
        )}
      </Box>
    </CnSkeletonGroup>
  );
};

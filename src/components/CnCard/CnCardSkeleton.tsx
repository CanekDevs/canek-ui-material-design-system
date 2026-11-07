import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkLines, SkText } from "../CnSkeleton";
import type {
  CnCardAccentPosition,
  CnCardLayout,
  CnCardPadding,
  CnCardRadius,
  CnCardShadow,
  CnCardSize,
  CnCardVariant,
} from "./CnCard";

export type CnCardSkeletonProps = CnSkeletonCommonProps & {
  variant?: CnCardVariant;
  size?: CnCardSize;
  padding?: CnCardPadding;
  shadow?: CnCardShadow;
  radius?: CnCardRadius;
  layout?: CnCardLayout;
  /** Franja de acento (como `accentColor`). */
  accent?: boolean;
  accentPosition?: CnCardAccentPosition;
  /** Ícono cuadrado del encabezado. */
  icon?: boolean | string;
  /** Avatar circular en lugar del ícono. */
  avatar?: boolean;
  title?: boolean | string;
  subtitle?: boolean | string;
  /** Número de acciones del encabezado (o `true` = 1). */
  headerActions?: boolean | number;
  /** Medio/portada: `true` o su alto en px. */
  media?: boolean | number;
  /** Líneas de descripción del cuerpo. */
  lines?: number;
  /** Bloque de contenido propio bajo la descripción (alto en px). */
  content?: boolean | number;
  /** Número de acciones del pie (o `true` = 2). */
  footer?: boolean | number;
  dividers?: boolean;
  width?: number | string;
};

const PADDING_PX: Record<CnCardPadding, number> = { none: 0, sm: 12, md: 16, lg: 24 };

const SHADOW_MAP: Record<CnCardShadow, string> = {
  none: "none",
  xs: "var(--cn-shadow-xs, 0 1px 2px rgba(15, 23, 42, 0.04))",
  sm: "var(--cn-shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.06))",
  md: "var(--cn-shadow-md, 0 4px 12px rgba(15, 23, 42, 0.08))",
  lg: "var(--cn-shadow-lg, 0 10px 24px rgba(15, 23, 42, 0.10))",
  xl: "var(--cn-shadow-xl, 0 18px 44px rgba(15, 23, 42, 0.14))",
};

const RADIUS_MAP: Record<CnCardRadius, string> = {
  none: "0",
  sm: "var(--cn-radius-sm, 6px)",
  md: "var(--cn-radius-md, 8px)",
  lg: "var(--cn-radius-lg, 12px)",
  xl: "var(--cn-radius-xl, 16px)",
  full: "var(--cn-radius-full, 9999px)",
};

const SIZE_TOKENS: Record<
  CnCardSize,
  { title: number; subtitle: number; description: number; iconBox: number; action: number }
> = {
  sm: { title: 12, subtitle: 11, description: 11, iconBox: 28, action: 24 },
  md: { title: 13, subtitle: 12, description: 12, iconBox: 32, action: 28 },
  lg: { title: 16, subtitle: 13, description: 13, iconBox: 40, action: 32 },
};

const count = (value: boolean | number | undefined, fallback: number) =>
  typeof value === "number" ? value : value ? fallback : 0;

const Divider = () => (
  <Box sx={{ borderTop: "1px solid var(--cn-color-border-subtle, #e9ecef)", my: "12px" }} />
);

/** Skeleton de `CnCard`: superficie por variante, medio, encabezado, cuerpo y pie. */
export const CnCardSkeleton = ({
  variant = "elevated",
  size = "md",
  padding = "md",
  shadow,
  radius = "lg",
  layout = "vertical",
  accent = false,
  accentPosition = "top",
  icon = false,
  avatar = false,
  title = true,
  subtitle = true,
  headerActions = false,
  media = false,
  lines = 3,
  content = false,
  footer = false,
  dividers = false,
  width,
  animation,
  ariaLabel = "Cargando tarjeta",
  sx,
  className,
}: CnCardSkeletonProps) => {
  const tokens = SIZE_TOKENS[size];
  const pad = PADDING_PX[padding];
  const isHorizontal = layout === "horizontal";
  const resolvedShadow = shadow ?? (variant === "elevated" ? "sm" : "none");
  const actions = count(headerActions, 1);
  const footerActions = count(footer, 2);
  const mediaHeight = typeof media === "number" ? media : isHorizontal ? undefined : 140;
  const hasHeader = Boolean(title || subtitle || icon || avatar || actions);
  const hasBody = lines > 0 || Boolean(content);

  const surface: Record<string, unknown> = {
    elevated: { backgroundColor: "var(--cn-color-surface, #ffffff)" },
    outlined: { border: "1px solid var(--cn-color-border, #dde0e4)" },
    filled: { backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)" },
    ghost: {},
  }[variant];

  const header = hasHeader && (
    <Box
      data-cn-card-skeleton-header
      sx={{ display: "flex", alignItems: "flex-start", gap: "12px", mb: hasBody ? "12px" : 0 }}
    >
      {(icon || avatar) && (
        <SkBlock
          width={tokens.iconBox}
          circle={avatar}
          radius={avatar ? undefined : "var(--cn-radius-md, 8px)"}
        />
      )}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          pt: "2px",
        }}
      >
        {title && <SkText width="58%" size={tokens.title} />}
        {subtitle && <SkText width="38%" size={tokens.subtitle} />}
      </Box>
      {actions > 0 && (
        <Box sx={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          {Array.from({ length: actions }, (_, i) => (
            <SkBlock key={i} circle width={tokens.action} />
          ))}
        </Box>
      )}
    </Box>
  );

  const body = hasBody && (
    <Box data-cn-card-skeleton-body sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {lines > 0 && <SkLines lines={lines} size={tokens.description} />}
      {content && (
        <SkBlock
          height={typeof content === "number" ? content : 64}
          radius="var(--cn-radius-sm, 6px)"
        />
      )}
    </Box>
  );

  const foot = footerActions > 0 && (
    <Box
      data-cn-card-skeleton-footer
      sx={{ display: "flex", alignItems: "center", gap: "8px", mt: dividers ? 0 : "12px" }}
    >
      {Array.from({ length: footerActions }, (_, i) => (
        <SkBlock
          key={i}
          width={i === 0 ? 88 : 72 + ((i * 13) % 20)}
          height={size === "sm" ? 28 : size === "lg" ? 40 : 34}
          radius="var(--cn-radius-md, 8px)"
        />
      ))}
    </Box>
  );

  const mediaBlock = media && (
    <Box
      data-cn-card-skeleton-media
      sx={
        isHorizontal
          ? { flexShrink: 0, width: "40%", minWidth: 120, mr: `${pad}px`, display: "flex" }
          : { mx: `-${pad}px`, mt: hasHeader ? `${pad}px` : `-${pad}px`, mb: `${pad}px` }
      }
    >
      <SkBlock
        width="100%"
        height={mediaHeight ?? "100%"}
        radius={isHorizontal ? "var(--cn-radius-md, 8px)" : 0}
        sx={isHorizontal ? { minHeight: 96 } : undefined}
      />
    </Box>
  );

  const column = (
    <>
      {header}
      {!isHorizontal && mediaBlock}
      {dividers && hasHeader && hasBody && <Divider />}
      {body}
      {dividers && foot && <Divider />}
      {foot}
    </>
  );

  return (
    <CnSkeletonGroup
      name="card"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[
        {
          position: "relative",
          display: "flex",
          flexDirection: isHorizontal ? "row" : "column",
          width: width ?? "100%",
          p: `${pad}px`,
          borderRadius: RADIUS_MAP[radius],
          boxShadow: SHADOW_MAP[resolvedShadow],
          overflow: "hidden",
          ...surface,
          ...(accent &&
            (accentPosition === "top"
              ? { borderTop: "3px solid var(--cn-color-border-strong, #c5cad0)" }
              : { borderLeft: "3px solid var(--cn-color-border-strong, #c5cad0)" })),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {isHorizontal ? (
        <>
          {mediaBlock}
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            {column}
          </Box>
        </>
      ) : (
        column
      )}
    </CnSkeletonGroup>
  );
};

import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkLines, SkText } from "../CnSkeleton";
import type { CnSectionCardPadding, CnSectionCardVariant } from "./CnSectionCard";

export type CnSectionCardSkeletonProps = CnSkeletonCommonProps & {
  variant?: CnSectionCardVariant;
  padding?: CnSectionCardPadding;
  icon?: boolean;
  /** Avatar circular en lugar del ícono. */
  avatar?: boolean;
  subtitle?: boolean;
  badge?: boolean;
  /** Número de acciones del encabezado. */
  headerActions?: number;
  /** Líneas del cuerpo (0 = sin cuerpo, como una sección plegada). */
  lines?: number;
  /** Bloque de contenido bajo las líneas (alto en px). */
  content?: number;
  footer?: boolean;
  hideHeader?: boolean;
  accent?: boolean;
  width?: number | string;
};

const PADDING_PX: Record<CnSectionCardPadding, number> = { none: 0, sm: 12, md: 16, lg: 24 };

/** Skeleton de `CnSectionCard`: encabezado, cuerpo y pie con la misma superficie. */
export const CnSectionCardSkeleton = ({
  variant = "outlined",
  padding = "md",
  icon = true,
  avatar = false,
  subtitle = true,
  badge = false,
  headerActions = 1,
  lines = 3,
  content,
  footer = false,
  hideHeader = false,
  accent = false,
  width,
  animation,
  ariaLabel = "Cargando sección",
  sx,
  className,
}: CnSectionCardSkeletonProps) => {
  const pad = PADDING_PX[padding];
  const surface: Record<string, unknown> = {
    elevated: {
      backgroundColor: "var(--cn-color-surface, #ffffff)",
      boxShadow: "var(--cn-shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.06))",
    },
    outlined: { border: "1px solid var(--cn-color-border, #dde0e4)" },
    filled: { backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)" },
    ghost: {},
  }[variant];
  const hasBody = lines > 0 || Boolean(content);

  return (
    <CnSkeletonGroup
      name="section-card"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[
        {
          width: width ?? "100%",
          borderRadius: "var(--cn-radius-lg, 12px)",
          overflow: "hidden",
          ...surface,
          ...(accent && { borderTop: "3px solid var(--cn-color-border-strong, #c5cad0)" }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {!hideHeader && (
        <Box
          data-cn-section-skeleton-header
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            px: `${pad}px`,
            py: `${Math.max(pad - 2, 8)}px`,
            borderBottom: hasBody ? "1px solid var(--cn-color-border-subtle, #e9ecef)" : undefined,
          }}
        >
          {(icon || avatar) && (
            <SkBlock
              width={34}
              circle={avatar}
              radius={avatar ? undefined : "var(--cn-radius-md, 8px)"}
            />
          )}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <SkText width="36%" size={14} />
              {badge && <SkBlock width={28} height={18} radius={9} />}
            </Box>
            {subtitle && <SkText width="54%" size={12} />}
          </Box>
          {Array.from({ length: headerActions }, (_, i) => (
            <SkBlock key={i} circle width={28} />
          ))}
        </Box>
      )}
      {hasBody && (
        <Box
          data-cn-section-skeleton-body
          sx={{ p: `${pad}px`, display: "flex", flexDirection: "column", gap: "12px" }}
        >
          {lines > 0 && <SkLines lines={lines} size={12} />}
          {content && <SkBlock height={content} radius="var(--cn-radius-sm, 6px)" />}
        </Box>
      )}
      {footer && (
        <Box
          data-cn-section-skeleton-footer
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            px: `${pad}px`,
            py: `${Math.max(pad - 4, 8)}px`,
            borderTop: "1px solid var(--cn-color-border-subtle, #e9ecef)",
          }}
        >
          <SkBlock width={80} height={30} radius="var(--cn-radius-md, 8px)" />
          <SkBlock width={96} height={30} radius="var(--cn-radius-md, 8px)" />
        </Box>
      )}
    </CnSkeletonGroup>
  );
};

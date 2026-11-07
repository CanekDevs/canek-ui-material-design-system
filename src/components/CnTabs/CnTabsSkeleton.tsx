import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkLines, SkText } from "../CnSkeleton";
import type {
  CnTabsIconPosition,
  CnTabsOrientation,
  CnTabsSize,
  CnTabsSubtitlePosition,
  CnTabsVariant,
} from "./CnTabs";

export type CnTabsSkeletonProps = CnSkeletonCommonProps & {
  /** Número de pestañas. */
  tabs?: number;
  variant?: CnTabsVariant;
  size?: CnTabsSize;
  orientation?: CnTabsOrientation;
  fullWidth?: boolean;
  centered?: boolean;
  /** Ícono en cada pestaña. */
  icons?: boolean;
  showIconOnly?: boolean;
  iconPosition?: CnTabsIconPosition;
  /** Subtítulo en cada pestaña. */
  subtitles?: boolean;
  subtitlePosition?: CnTabsSubtitlePosition;
  /** Insignia de conteo en cada pestaña. */
  badges?: boolean;
  showIndicator?: boolean;
  /** Índice de la pestaña seleccionada. */
  selectedIndex?: number;
  verticalWidth?: number | string;
  /** Panel de contenido bajo/junto a las pestañas: `true` o número de líneas. */
  panel?: boolean | number;
};

const SIZE_TOKENS: Record<
  CnTabsSize,
  { minHeight: number; padX: number; font: number; icon: number; subtitle: number; badge: number }
> = {
  sm: { minHeight: 30, padX: 10, font: 12, icon: 14, subtitle: 11, badge: 16 },
  md: { minHeight: 36, padX: 12, font: 13, icon: 16, subtitle: 11, badge: 18 },
  lg: { minHeight: 42, padX: 16, font: 14, icon: 18, subtitle: 12, badge: 20 },
};

/** Skeleton de `CnTabs`: contenedor por variante, pestañas, indicador y panel opcional. */
export const CnTabsSkeleton = ({
  tabs = 3,
  variant = "line",
  size = "md",
  orientation = "horizontal",
  fullWidth = false,
  centered = false,
  icons = false,
  showIconOnly = false,
  iconPosition = "start",
  subtitles = false,
  subtitlePosition = "below",
  badges = false,
  showIndicator = true,
  selectedIndex = 0,
  verticalWidth = 240,
  panel = false,
  animation,
  ariaLabel = "Cargando pestañas",
  sx,
  className,
}: CnTabsSkeletonProps) => {
  const tokens = SIZE_TOKENS[size];
  const isVertical = orientation === "vertical";
  const isLine = variant === "line";
  const isIconOnly = showIconOnly && icons;
  const panelLines = typeof panel === "number" ? panel : panel ? 4 : 0;

  const container: Record<string, unknown> = isLine
    ? isVertical
      ? { borderRight: "1px solid var(--cn-color-border, #dde0e4)" }
      : { borderBottom: "1px solid var(--cn-color-border, #dde0e4)" }
    : {
        p: "4px",
        gap: "4px",
        borderRadius:
          variant === "pill" ? "var(--cn-radius-full, 9999px)" : "var(--cn-radius-lg, 12px)",
        ...(variant === "outlined"
          ? { border: "1px solid var(--cn-color-border, #dde0e4)" }
          : { backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)" }),
      };

  const tabRadius =
    variant === "pill" ? "var(--cn-radius-full, 9999px)" : "var(--cn-radius-md, 8px)";

  const renderTab = (index: number) => {
    const selected = index === selectedIndex;
    const labelWidth = 44 + ((index * 23) % 30);
    const inner = (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: isVertical ? "flex-start" : "center",
          gap: "4px",
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexDirection: iconPosition === "top" ? "column" : "row",
          }}
        >
          {icons && <SkBlock circle width={tokens.icon} />}
          {!isIconOnly && <SkText width={labelWidth} size={tokens.font} />}
          {badges && <SkBlock width={tokens.badge + 4} height={tokens.badge} radius={9999} />}
          {subtitles && !isIconOnly && subtitlePosition === "inline" && !isVertical && (
            <SkText width={36} size={tokens.subtitle} />
          )}
        </Box>
        {subtitles && !isIconOnly && (subtitlePosition === "below" || isVertical) && (
          <SkText width={Math.round(labelWidth * 0.8)} size={tokens.subtitle} />
        )}
      </Box>
    );

    return (
      <Box
        key={index}
        data-cn-tabs-skeleton-tab={selected ? "selected" : "true"}
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: isVertical ? "flex-start" : "center",
          minHeight: tokens.minHeight,
          px: `${tokens.padX}px`,
          py: "6px",
          boxSizing: "border-box",
          flex: fullWidth && !isVertical ? 1 : undefined,
          borderRadius: isLine ? 0 : tabRadius,
          ...(selected &&
            !isLine && {
              backgroundColor: "var(--cn-color-surface, #ffffff)",
              boxShadow: "var(--cn-shadow-xs, 0 1px 2px rgba(15, 23, 42, 0.04))",
            }),
        }}
      >
        {inner}
        {selected && isLine && showIndicator && (
          <SkBlock
            width={isVertical ? 2 : "100%"}
            height={isVertical ? "100%" : 2}
            radius={2}
            sx={{
              position: "absolute",
              ...(isVertical ? { right: -1, top: 0 } : { left: 0, bottom: -1 }),
            }}
          />
        )}
      </Box>
    );
  };

  const strip = (
    <Box
      data-cn-tabs-skeleton-strip
      sx={{
        display: "flex",
        flexDirection: isVertical ? "column" : "row",
        justifyContent: centered && !isVertical ? "center" : "flex-start",
        width: isVertical ? verticalWidth : fullWidth ? "100%" : "fit-content",
        maxWidth: "100%",
        boxSizing: "border-box",
        flexShrink: 0,
        ...(centered && !isVertical && !fullWidth && isLine && { width: "100%" }),
        ...container,
      }}
    >
      {Array.from({ length: Math.max(1, tabs) }, (_, i) => renderTab(i))}
    </Box>
  );

  return (
    <CnSkeletonGroup
      name="tabs"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[
        isVertical && panelLines > 0 ? { display: "flex", gap: "16px" } : {},
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {strip}
      {panelLines > 0 && (
        <Box
          data-cn-tabs-skeleton-panel
          sx={{ flex: 1, minWidth: 0, pt: isVertical ? "4px" : "16px" }}
        >
          <SkText width="34%" size={15} sx={{ mb: "12px" }} />
          <SkLines lines={panelLines} size={13} />
        </Box>
      )}
    </CnSkeletonGroup>
  );
};

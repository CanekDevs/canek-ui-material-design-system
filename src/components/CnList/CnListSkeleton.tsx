import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText, varyWidth } from "../CnSkeleton";
import type { CnListDensity, CnListSize, CnListSurface, CnListVariant } from "./CnList.types";
import { DENSITY_PADDING, SIZE_TOKENS } from "./list-utils";

export type CnListSkeletonProps = CnSkeletonCommonProps & {
  /** Filas simuladas (en total, o por sección si hay `sections`). */
  count?: number;
  variant?: CnListVariant;
  density?: CnListDensity;
  size?: CnListSize;
  surface?: CnListSurface;
  /** Avatar circular, ícono cuadrado o nada. */
  avatar?: "circle" | "square" | false;
  /** Líneas bajo el título (subtítulo, descripción). */
  lines?: number;
  /** Texto auxiliar/fecha a la derecha. */
  meta?: boolean;
  /** Chip/insignia/acción al final. */
  trailing?: boolean;
  checkbox?: boolean;
  dividers?: boolean | "inset" | "full";
  /** Número de secciones con encabezado (`true` = 2). */
  sections?: number | boolean;
  /** Barra con búsqueda arriba. */
  toolbar?: boolean;
  /** Encabezado con título. */
  title?: boolean;
  columns?: number;
};

const surfaceSx = (surface: CnListSurface) => {
  switch (surface) {
    case "outlined":
      return {
        border: "1px solid var(--cn-color-border, #dde0e4)",
        borderRadius: "var(--cn-radius-lg, 12px)",
        backgroundColor: "var(--cn-color-surface, #ffffff)",
        overflow: "hidden",
      };
    case "elevated":
      return {
        borderRadius: "var(--cn-radius-lg, 12px)",
        backgroundColor: "var(--cn-color-surface, #ffffff)",
        boxShadow: "var(--cn-shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.06))",
        overflow: "hidden",
      };
    case "filled":
      return {
        borderRadius: "var(--cn-radius-lg, 12px)",
        backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
        overflow: "hidden",
      };
    default:
      return {};
  }
};

/** Skeleton de `CnList` con las mismas variantes, densidad, avatar, líneas y secciones. */
export const CnListSkeleton = ({
  count = 5,
  variant = "plain",
  density = "comfortable",
  size = "md",
  surface = "none",
  avatar = "circle",
  lines = 1,
  meta = false,
  trailing = false,
  checkbox = false,
  dividers,
  sections = 0,
  toolbar = false,
  title = false,
  columns,
  animation,
  ariaLabel = "Cargando lista",
  sx,
  className,
}: CnListSkeletonProps) => {
  const tokens = SIZE_TOKENS[size];
  const padY = DENSITY_PADDING[density];
  const sectionCount = sections === true ? 2 : sections || 0;
  const isCard = variant === "card";
  const dividerMode =
    dividers === undefined
      ? variant === "divided"
        ? "inset"
        : null
      : dividers === true
        ? "full"
        : dividers || null;
  const mediaWidth =
    avatar === "circle" ? tokens.avatarPx : avatar === "square" ? tokens.iconBox : 0;
  const insetLeft = tokens.padX + (checkbox ? 32 : 0) + (mediaWidth ? mediaWidth + tokens.gap : 0);

  const row = (index: number, last: boolean) => (
    <Box
      key={index}
      data-cn-list-skeleton-row=""
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: `${tokens.gap}px`,
        px: `${tokens.padX}px`,
        py: `${padY}px`,
        boxSizing: "border-box",
        ...(variant === "inset" && { mx: "6px" }),
        ...(isCard && {
          border: "1px solid var(--cn-color-border, #dde0e4)",
          borderRadius: "var(--cn-radius-lg, 12px)",
          backgroundColor: "var(--cn-color-surface, #ffffff)",
        }),
        ...(dividerMode &&
          !last &&
          !isCard && {
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: 0,
              right: 0,
              left: dividerMode === "inset" ? `${insetLeft}px` : 0,
              height: "1px",
              backgroundColor: "var(--cn-color-border-subtle, #e9ecef)",
            },
          }),
      }}
    >
      {checkbox && <SkBlock width={16} height={16} radius={4} />}
      {avatar === "circle" && <SkBlock circle width={tokens.avatarPx} />}
      {avatar === "square" && <SkBlock width={tokens.iconBox} radius={8} />}
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
        <SkText width={varyWidth(index, 38, 30)} size={tokens.title} />
        {Array.from({ length: lines }, (_, line) => (
          <SkText
            key={line}
            width={line === lines - 1 && lines > 1 ? "48%" : varyWidth(index + line + 3, 55, 35)}
            size={tokens.subtitle}
          />
        ))}
      </Box>
      {meta && <SkText width={36} size={tokens.meta} />}
      {trailing && <SkBlock width={44} height={18} radius={9} />}
    </Box>
  );

  const rowsBlock = (n: number, offset = 0): ReactNode => (
    <Box
      sx={{
        display: columns && columns > 1 ? "grid" : "flex",
        flexDirection: "column",
        gap: isCard ? "8px" : 0,
        ...(columns &&
          columns > 1 && { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }),
        ...(isCard && { p: "8px" }),
        ...(variant === "inset" && { py: "4px" }),
      }}
    >
      {Array.from({ length: n }, (_, i) => row(offset + i, i === n - 1))}
    </Box>
  );

  return (
    <CnSkeletonGroup
      name="list"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[surfaceSx(surface), ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {title && (
        <Box sx={{ px: `${tokens.padX}px`, pt: "14px", pb: "8px" }}>
          <SkText width={160} size={15} />
        </Box>
      )}
      {toolbar && (
        <Box
          data-cn-list-skeleton-toolbar=""
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            px: "12px",
            py: "10px",
            borderBottom: "1px solid var(--cn-color-border-subtle, #eceef1)",
          }}
        >
          {checkbox && <SkBlock width={16} height={16} radius={4} />}
          <SkBlock width={240} height={34} radius={17} />
          <Box sx={{ flex: 1 }} />
          <SkBlock width={84} height={30} radius={8} />
        </Box>
      )}
      {sectionCount > 0
        ? Array.from({ length: sectionCount }, (_, s) => (
            <Box key={s} data-cn-list-skeleton-section="">
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  px: `${tokens.padX}px`,
                  py: "10px",
                }}
              >
                <SkText width={varyWidth(s, 18, 14)} size={10} />
                <SkBlock width={22} height={14} radius={7} />
              </Box>
              {rowsBlock(count, s * count)}
            </Box>
          ))
        : rowsBlock(count)}
    </CnSkeletonGroup>
  );
};

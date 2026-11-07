import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText, varyWidth } from "../CnSkeleton";
import type { CnFileFieldVariant } from "./CnFileField";

export type CnFileFieldSkeletonProps = CnSkeletonCommonProps & {
  variant?: CnFileFieldVariant;
  label?: boolean | string;
  helperText?: boolean | string;
  /** Archivos simulados (por defecto según la variante; en `avatar`, 0 o 1). */
  files?: number;
  /** Columnas fijas en `grid`, `card` y `masonry` (como el campo). */
  gridColumns?: number;
  /** Tamaño de miniatura en px (grid, avatar, masonry). */
  thumbnailSize?: number;
  /** Asa de arrastre en cada archivo. */
  reorderable?: boolean;
  /** Insignia "principal" en el primer archivo (grid / card / masonry). */
  showPrimary?: boolean;
  /** Línea de restricciones (tipos, tamaño, dimensiones). */
  constraints?: boolean;
  /** Línea "También puedes pegarlo con Ctrl+V" en la zona de arrastre. */
  allowPaste?: boolean;
  /** Muestra la zona/botón para agregar más archivos. Por defecto `true`. */
  canAdd?: boolean;
  /** Sin controles para agregar (como `readOnly` en el campo). */
  readOnly?: boolean;
};

const DEFAULT_FILES: Record<CnFileFieldVariant, number> = {
  dropzone: 2,
  button: 2,
  compact: 3,
  grid: 4,
  card: 3,
  avatar: 0,
  masonry: 6,
};

/** Proporciones variadas para la galería en columnas. */
const MASONRY_RATIOS = ["4 / 3", "3 / 4", "1 / 1", "16 / 9", "4 / 5", "3 / 2"];

const surface = {
  border: "1px solid var(--cn-color-border, #dde0e4)",
  backgroundColor: "var(--cn-color-surface, #ffffff)",
} as const;

const dashed = {
  border: "1px dashed var(--cn-color-border-strong, #c5cad0)",
  backgroundColor: "var(--cn-color-surface, #ffffff)",
} as const;

/** Botón con ícono y texto (CnButton). */
const ButtonShape = ({ small = false, width = 120 }: { small?: boolean; width?: number }) => (
  <Box
    data-sk-part="button"
    sx={{
      ...surface,
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      px: small ? "10px" : "14px",
      height: small ? 30 : 36,
      boxSizing: "border-box",
      borderRadius: "var(--cn-radius-md, 8px)",
    }}
  >
    <SkBlock circle width={small ? 14 : 16} />
    <SkText width={width} size={small ? 12 : 13} />
  </Box>
);

/** Skeleton de `CnFileField`: zona de arrastre, botón, lista, chips, galerías y avatar. */
export const CnFileFieldSkeleton = ({
  variant = "dropzone",
  label = true,
  helperText = false,
  files,
  gridColumns,
  thumbnailSize = 112,
  reorderable = false,
  showPrimary,
  constraints = false,
  allowPaste = true,
  canAdd = true,
  readOnly = false,
  animation,
  ariaLabel = "Cargando campo de archivos",
  sx,
  className,
}: CnFileFieldSkeletonProps) => {
  const count = Math.max(0, files ?? DEFAULT_FILES[variant]);
  const adding = canAdd && !readOnly;
  const primary = showPrimary ?? false;
  const constraintsLine = constraints ? <SkText width="38%" size={11} /> : null;

  const handle = reorderable ? <SkBlock width={10} height={18} radius={3} /> : null;

  const list = (): ReactNode =>
    count > 0 && (
      <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {Array.from({ length: count }, (_, i) => (
          <Box
            key={i}
            data-sk-part="file"
            sx={{
              ...surface,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 8px",
              borderRadius: "var(--cn-radius-md, 8px)",
            }}
          >
            {handle}
            <SkBlock width={40} height={40} radius={6} />
            <Box
              sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <SkText width={varyWidth(i, 40, 30)} size={13} />
              <SkText width={90} size={11} />
            </Box>
            <SkBlock circle width={22} />
            <SkBlock circle width={22} />
          </Box>
        ))}
      </Box>
    );

  const compact = () => (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
      {Array.from({ length: count }, (_, i) => (
        <Box
          key={i}
          data-sk-part="file"
          sx={{
            ...surface,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            pl: "8px",
            pr: "6px",
            height: 32,
            boxSizing: "border-box",
            borderRadius: "999px",
          }}
        >
          <SkBlock width={16} height={16} radius={3} />
          <SkText width={70 + ((i * 29) % 50)} size={12} />
          <SkText width={34} size={11} />
          <SkBlock circle width={18} />
        </Box>
      ))}
      {adding && <ButtonShape small width={110} />}
    </Box>
  );

  const gallery = (cards: boolean, masonry: boolean) => {
    const tileBadges = (i: number) =>
      (primary && i === 0) || reorderable ? (
        <Box sx={{ position: "absolute", top: 6, left: 6, display: "flex", gap: "4px" }}>
          {primary && i === 0 && <SkBlock width={64} height={20} radius={999} />}
          {reorderable && <SkBlock width={20} height={20} radius={4} />}
        </Box>
      ) : null;

    return (
      <Box
        data-sk-part="gallery"
        sx={
          masonry
            ? {
                display: "block",
                columnGap: "8px",
                ...(gridColumns
                  ? { columnCount: gridColumns }
                  : { columnWidth: `${Math.round(thumbnailSize * 1.6)}px` }),
              }
            : {
                display: "grid",
                gridTemplateColumns: gridColumns
                  ? `repeat(${gridColumns}, minmax(0, 1fr))`
                  : `repeat(auto-fill, minmax(${cards ? 200 : thumbnailSize}px, 1fr))`,
                gap: cards ? "12px" : "8px",
              }
        }
      >
        {Array.from({ length: count }, (_, i) => (
          <Box
            key={i}
            data-sk-part="file"
            sx={{
              ...surface,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              borderRadius: "var(--cn-radius-md, 8px)",
              overflow: "hidden",
              ...(masonry && { width: "100%", breakInside: "avoid", mb: "8px" }),
            }}
          >
            <Box
              sx={{
                position: "relative",
                aspectRatio: masonry
                  ? MASONRY_RATIOS[i % MASONRY_RATIOS.length]
                  : cards
                    ? "4 / 3"
                    : "1 / 1",
                "& > *": { position: "absolute", inset: 0 },
              }}
            >
              <SkBlock width="100%" height="100%" radius={0} />
            </Box>
            {tileBadges(i)}
            {cards && (
              <Box sx={{ display: "flex", alignItems: "center", gap: "6px", p: "8px 10px" }}>
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <SkText width={varyWidth(i, 50, 30)} size={13} />
                  <SkText width={80} size={11} />
                </Box>
                <SkBlock circle width={22} />
              </Box>
            )}
          </Box>
        ))}
        {adding && (
          <Box
            data-sk-part="add"
            sx={{
              ...dashed,
              boxSizing: "border-box",
              borderRadius: "var(--cn-radius-md, 8px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              ...(masonry
                ? { aspectRatio: "4 / 3", breakInside: "avoid", width: "100%" }
                : cards
                  ? { minHeight: 180 }
                  : { aspectRatio: "1 / 1" }),
            }}
          >
            <SkBlock circle width={24} />
            <SkText width={cards ? 100 : 50} size={12} />
          </Box>
        )}
      </Box>
    );
  };

  const avatar = () => (
    <Box sx={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
      <Box
        data-sk-part="avatar"
        sx={{
          ...(count > 0 ? surface : dashed),
          width: thumbnailSize,
          height: thumbnailSize,
          boxSizing: "border-box",
          borderRadius: "50%",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {count > 0 ? (
          <SkBlock circle width="100%" />
        ) : (
          <SkBlock circle width={Math.round(thumbnailSize * 0.45)} />
        )}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
        {!readOnly && (
          <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <ButtonShape small width={count > 0 ? 54 : 110} />
            {count > 0 && <SkBlock width={58} height={30} radius={8} />}
          </Box>
        )}
        {count > 0 && <SkText width={110} size={11} />}
        {constraintsLine}
      </Box>
    </Box>
  );

  const showDropzone = variant === "dropzone" && adding;
  const showButton = variant === "button" && adding;

  return (
    <CnSkeletonGroup
      name="file-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      <Box data-sk-variant={variant} sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {label && <SkText width={130} size={13} />}
        {variant === "avatar" && avatar()}
        {showDropzone && (
          <Box
            data-sk-part="dropzone"
            sx={{
              ...dashed,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "20px 16px",
              borderRadius: "var(--cn-radius-md, 8px)",
            }}
          >
            <SkBlock circle width={28} />
            <SkText width={240} size={13} sx={{ maxWidth: "80%" }} />
            {allowPaste && <SkText width={170} size={11} sx={{ maxWidth: "60%" }} />}
            {constraints && <SkText width={200} size={11} sx={{ maxWidth: "70%" }} />}
          </Box>
        )}
        {showButton && (
          <Box sx={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <ButtonShape width={130} />
            {constraints && <SkText width={180} size={11} />}
          </Box>
        )}
        {(variant === "dropzone" || variant === "button") && list()}
        {variant === "compact" && compact()}
        {variant === "grid" && gallery(false, false)}
        {variant === "card" && gallery(true, false)}
        {variant === "masonry" && gallery(false, true)}
        {variant !== "avatar" && !showDropzone && !showButton && constraintsLine}
        {helperText && <SkText width="42%" size={11} />}
      </Box>
    </CnSkeletonGroup>
  );
};

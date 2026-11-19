import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock } from "../CnSkeleton";
import type { CnCarouselIndicators } from "./CnCarousel";

export type CnCarouselSkeletonProps = CnSkeletonCommonProps & {
  slidesPerView?: number;
  /** Ancho fijo de cada diapositiva (px); se dibujan `slidesPerView` y el resto se recorta. */
  slideWidth?: number;
  gap?: number;
  /** Alto de cada diapositiva (px). Si se omite, se usa `aspectRatio`. */
  height?: number;
  aspectRatio?: string;
  arrows?: boolean;
  arrowsPosition?: "inside" | "outside" | "top";
  indicators?: CnCarouselIndicators;
  /** Número de puntos / miniaturas. */
  count?: number;
  /** Barra superior con título (para `arrowsPosition="top"`). */
  header?: boolean;
  /** Contenido propio de cada diapositiva (sustituye el bloque). */
  renderSlide?: (index: number) => React.ReactNode;
};

/** Skeleton de `CnCarousel`: diapositivas, flechas e indicadores. */
export const CnCarouselSkeleton = ({
  slidesPerView = 1,
  slideWidth,
  gap = 16,
  height,
  aspectRatio = "16 / 9",
  arrows = true,
  arrowsPosition = "inside",
  indicators = "dots",
  count = 5,
  header,
  renderSlide,
  animation,
  ariaLabel = "Cargando carrusel",
  sx,
  className,
}: CnCarouselSkeletonProps) => {
  const visible = Math.max(1, Math.ceil(slidesPerView));
  const isTop = arrowsPosition === "top";
  const showHeader = header ?? isTop;

  return (
    <CnSkeletonGroup
      name="carousel"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[{ width: "100%", position: "relative" }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {showHeader && (
        <Box
          data-cn-carousel-skeleton-toolbar
          sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "12px" }}
        >
          <Box sx={{ flex: 1 }}>
            <SkBlock width={160} height={16} radius={4} />
          </Box>
          {arrows && isTop && (
            <>
              <SkBlock circle width={30} />
              <SkBlock circle width={30} />
            </>
          )}
        </Box>
      )}
      <Box sx={{ position: "relative", px: arrows && arrowsPosition === "outside" ? "44px" : 0 }}>
        <Box sx={{ display: "flex", gap: `${gap}px`, overflow: "hidden" }}>
          {Array.from({ length: visible }, (_, i) => (
            <Box
              key={i}
              data-cn-carousel-skeleton-slide
              sx={{
                flex: slideWidth
                  ? `0 0 ${slideWidth}px`
                  : `0 0 calc((100% - ${gap * (visible - 1)}px) / ${visible})`,
                minWidth: 0,
                ...(height ? { height } : { aspectRatio }),
              }}
            >
              {renderSlide ? (
                renderSlide(i)
              ) : (
                <SkBlock width="100%" height="100%" radius="var(--cn-radius-lg, 12px)" />
              )}
            </Box>
          ))}
        </Box>
        {arrows && !isTop && (
          <>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: arrowsPosition === "outside" ? 0 : 8,
                transform: "translateY(-50%)",
              }}
            >
              <SkBlock circle width={30} />
            </Box>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                right: arrowsPosition === "outside" ? 0 : 8,
                transform: "translateY(-50%)",
              }}
            >
              <SkBlock circle width={30} />
            </Box>
          </>
        )}
      </Box>
      {indicators !== "none" && (
        <Box
          data-cn-carousel-skeleton-indicators={indicators}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "6px",
            mt: "12px",
          }}
        >
          {indicators === "dots" &&
            Array.from({ length: count }, (_, i) => (
              <SkBlock key={i} width={i === 0 ? 22 : 8} height={8} radius={4} />
            ))}
          {indicators === "progress" && <SkBlock width={200} height={4} radius={2} />}
          {indicators === "fraction" && <SkBlock width={36} height={12} radius={3} />}
          {indicators === "thumbnails" &&
            Array.from({ length: count }, (_, i) => (
              <SkBlock key={i} width={64} height={44} radius="var(--cn-radius-md, 8px)" />
            ))}
        </Box>
      )}
    </CnSkeletonGroup>
  );
};

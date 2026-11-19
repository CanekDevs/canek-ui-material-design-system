import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import type { CnCarouselIndicators } from "../CnCarousel";
import { CnCarouselSkeleton } from "../CnCarousel";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { SkBlock, SkText } from "../CnSkeleton";

export type CnContentCarouselSkeletonProps = CnSkeletonCommonProps & {
  variant?: "hero" | "cards";
  aspectRatio?: string;
  /** Ancho de cada tarjeta (preset `cards`). */
  slideWidth?: number;
  /** Tarjetas visibles (preset `cards`). */
  count?: number;
  /** Encabezado con título (preset `cards`). */
  header?: boolean;
  indicators?: CnCarouselIndicators;
  /** Contenido propio de cada tarjeta (p. ej. un `CnProfileCardSkeleton`). */
  renderSlide?: (index: number) => ReactNode;
};

/** Skeleton de `CnContentCarousel`: banner con textos y CTA, o fila de tarjetas. */
export const CnContentCarouselSkeleton = ({
  variant = "hero",
  aspectRatio = "16 / 9",
  slideWidth = 280,
  count,
  header = true,
  indicators,
  renderSlide,
  animation,
  ariaLabel = "Cargando carrusel",
  sx,
  className,
}: CnContentCarouselSkeletonProps) => {
  if (variant === "cards") {
    return (
      <CnCarouselSkeleton
        slidesPerView={count ?? 4}
        slideWidth={slideWidth}
        height={renderSlide ? undefined : 180}
        aspectRatio={renderSlide ? "auto" : undefined}
        arrows
        arrowsPosition="top"
        header={header}
        indicators={indicators ?? "none"}
        renderSlide={renderSlide}
        animation={animation}
        ariaLabel={ariaLabel}
        sx={sx}
        className={className}
      />
    );
  }

  return (
    <CnCarouselSkeleton
      slidesPerView={1}
      aspectRatio={aspectRatio}
      arrows
      indicators={indicators ?? "dots"}
      count={count ?? 4}
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
      renderSlide={() => (
        <Box
          data-cn-hero-skeleton
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: "var(--cn-radius-xl, 16px)",
            overflow: "hidden",
          }}
        >
          <SkBlock width="100%" height="100%" radius={0} />
          <Box
            sx={{
              position: "absolute",
              left: { xs: 16, md: 32 },
              bottom: { xs: 16, md: 32 },
              width: { xs: "70%", md: "45%" },
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              p: "12px",
              borderRadius: "var(--cn-radius-md, 8px)",
              backgroundColor: "var(--cn-color-surface, #ffffff)",
              opacity: 0.85,
            }}
          >
            <SkText width="30%" size={10} />
            <SkText width="85%" size={22} />
            <SkText width="65%" size={13} />
            <Box sx={{ display: "flex", gap: "8px", mt: "4px" }}>
              <SkBlock width={96} height={30} radius="var(--cn-radius-md, 8px)" />
              <SkBlock width={80} height={30} radius="var(--cn-radius-md, 8px)" />
            </Box>
          </Box>
        </Box>
      )}
    />
  );
};

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { Children, isValidElement, useId } from "react";
import { CnButton } from "../CnButton";
import type { CnCarouselProps } from "../CnCarousel";
import { CnCarousel } from "../CnCarousel";
import { CnChip } from "../CnChip";
import { getSafeUrl } from "../CnFileField/file-utils";
import { CnIcon } from "../CnIcon";
import type { CnTone } from "../CnInfoCard/tones";
import { CN_TONES } from "../CnInfoCard/tones";
import { CnContentCarouselSkeleton } from "./CnContentCarouselSkeleton";

type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl";
/** Valor fijo o por breakpoint del viewport (como `sx` de MUI). */
export type CnResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

export type CnContentSlideAction = {
  label: ReactNode;
  onClick?: () => void;
  href?: string;
  target?: "_blank" | "_self";
  variant?: "contained" | "outlined" | "text";
  icon?: string;
};

export type CnContentSlide = {
  id?: string | number;
  image?: string;
  imageAlt?: string;
  /** Video (con controles nativos). */
  video?: string;
  poster?: string;
  /** Fondo CSS (color o degradado) cuando no hay imagen o mientras carga. */
  background?: string;
  eyebrow?: ReactNode;
  /** Insignia (texto o nodo) sobre el título. */
  badge?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: CnContentSlideAction[];
  /** Enlace de toda la diapositiva. */
  href?: string;
  target?: "_blank" | "_self";
  /** Pie de foto (créditos, fecha). */
  caption?: ReactNode;
  align?: "start" | "center" | "end";
  verticalAlign?: "top" | "center" | "bottom";
  overlay?: "gradient" | "solid" | "none";
  /** Color del texto sobre la imagen. */
  textColor?: "light" | "dark";
  imageFit?: "cover" | "contain";
  /** Contenido propio dentro de la diapositiva (sustituye título/descripción). */
  content?: ReactNode;
  /** Nombre accesible de la diapositiva. */
  label?: string;
};

type PassThrough = Pick<
  CnCarouselProps,
  | "autoplay"
  | "interval"
  | "loop"
  | "arrows"
  | "arrowsPosition"
  | "indicators"
  | "pauseOnHover"
  | "autoplayProgress"
  | "showPlayPause"
  | "slidesPerView"
  | "slidesPerMove"
  | "gap"
  | "peek"
  | "draggable"
  | "lazy"
  | "index"
  | "defaultIndex"
  | "onChange"
  | "actionRef"
  | "labels"
  | "emptyState"
>;

export type CnContentCarouselProps = PassThrough & {
  /** `hero`: banners con imagen, texto y CTA. `cards`: fila de tarjetas. */
  variant?: "hero" | "cards";

  // ─── hero ────────────────────────────────────────────────────────────
  slides?: CnContentSlide[];
  /** Relación de aspecto de los banners (por breakpoint del viewport). */
  aspectRatio?: CnResponsiveValue<string>;
  /** Alto fijo (sustituye `aspectRatio`). */
  height?: CnResponsiveValue<number | string>;
  overlay?: "gradient" | "solid" | "none";
  /** Opacidad máxima del velo (0–1). */
  overlayOpacity?: number;
  /** `below`: título y descripción bajo la imagen. */
  captionPosition?: "overlay" | "below";
  contentAlign?: "start" | "center" | "end";
  verticalAlign?: "top" | "center" | "bottom";
  radius?: number | string;
  /** Fondo por defecto de las diapositivas sin imagen. */
  tone?: CnTone;
  /** Botón "Ver más" en cada diapositiva. */
  onViewMore?: (slide: CnContentSlide, index: number) => void;
  viewMoreLabel?: string;
  onSlideClick?: (slide: CnContentSlide, index: number) => void;
  /** Diapositiva personalizada. */
  renderSlide?: (slide: CnContentSlide, index: number) => ReactNode;
  /** Nivel del título de cada diapositiva. */
  titleComponent?: "h2" | "h3" | "h4" | "div";

  // ─── cards ───────────────────────────────────────────────────────────
  /** Tarjetas (preset `cards`). También se aceptan como hijos. */
  items?: ReactNode[];
  children?: ReactNode;
  /** Ancho de cada tarjeta (px). */
  slideWidth?: number;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: string;
  /** Acción del encabezado ("Ver todos"). */
  headerAction?: ReactNode;

  /** Etiqueta accesible del carrusel. */
  label?: string;
  skeleton?: boolean;
  /** Número de tarjetas/diapositivas del skeleton. */
  skeletonCount?: number;
  /** Diapositiva del skeleton (preset `cards`). */
  renderSkeletonSlide?: (index: number) => ReactNode;
  sx?: SxProps<Theme>;
  className?: string;
};

const JUSTIFY = { start: "flex-start", center: "center", end: "flex-end" } as const;
const VERTICAL = { top: "flex-start", center: "center", bottom: "flex-end" } as const;

const overlayBackground = (
  overlay: "gradient" | "solid" | "none",
  vertical: "top" | "center" | "bottom",
  opacity: number,
  dark: boolean,
) => {
  if (overlay === "none") return "none";
  const rgb = dark ? "0, 0, 0" : "255, 255, 255";
  if (overlay === "solid" || vertical === "center") return `rgba(${rgb}, ${opacity * 0.7})`;
  const direction = vertical === "top" ? "to bottom" : "to top";
  return `linear-gradient(${direction}, rgba(${rgb}, ${opacity}) 0%, rgba(${rgb}, ${opacity * 0.45}) 45%, rgba(${rgb}, 0) 80%)`;
};

/**
 * Carrusel de contenido: banners (`hero`) con imagen o fondo, velo, título,
 * descripción, CTA y pies de foto; o una fila de tarjetas (`cards`) con
 * encabezado y flechas. Construido sobre `CnCarousel`.
 */
export const CnContentCarousel = ({
  variant = "hero",
  slides = [],
  aspectRatio = { xs: "4 / 3", sm: "16 / 9", lg: "21 / 9" },
  height,
  overlay = "gradient",
  overlayOpacity = 0.72,
  captionPosition = "overlay",
  contentAlign = "start",
  verticalAlign = "bottom",
  radius = "var(--cn-radius-xl, 16px)",
  tone = "primary",
  onViewMore,
  viewMoreLabel = "Ver más",
  onSlideClick,
  renderSlide,
  titleComponent = "h3",
  items,
  children,
  slideWidth = 280,
  title,
  subtitle,
  icon,
  headerAction,
  label,
  skeleton = false,
  skeletonCount,
  renderSkeletonSlide,
  autoplay,
  interval = 6000,
  loop = true,
  arrows = true,
  arrowsPosition,
  indicators,
  labels,
  sx,
  className,
  ...carouselProps
}: CnContentCarouselProps) => {
  const baseId = useId();
  const isCards = variant === "cards";

  if (skeleton) {
    return (
      <CnContentCarouselSkeleton
        variant={variant}
        aspectRatio={typeof aspectRatio === "string" ? aspectRatio : "16 / 9"}
        slideWidth={slideWidth}
        count={skeletonCount}
        header={Boolean(title || subtitle || icon || headerAction)}
        indicators={indicators ?? (isCards ? "none" : "dots")}
        renderSlide={renderSkeletonSlide}
        sx={sx}
        className={className}
      />
    );
  }

  const header = isCards && (title || subtitle || icon || headerAction) && (
    <Box sx={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
      {icon && (
        <Box
          aria-hidden
          sx={{
            width: 32,
            height: 32,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            borderRadius: "var(--cn-radius-md, 8px)",
            backgroundColor: CN_TONES[tone].soft,
            color: CN_TONES[tone].main,
          }}
        >
          <CnIcon name={icon} size={18} color="inherit" />
        </Box>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {title && (
          <Typography
            component="h2"
            sx={{
              m: 0,
              fontSize: "var(--cn-font-size-base, 14px)",
              fontWeight: "var(--cn-font-weight-bold, 700)",
              color: "var(--cn-color-text, #222831)",
              lineHeight: 1.3,
            }}
          >
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography
            component="div"
            sx={{
              fontSize: "var(--cn-font-size-sm, 12px)",
              color: "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {headerAction}
    </Box>
  );

  if (isCards) {
    const cards = items ?? Children.toArray(children);
    return (
      <CnCarousel
        slideWidth={carouselProps.slidesPerView ? undefined : slideWidth}
        gap={carouselProps.gap ?? 16}
        arrows={arrows}
        arrowsPosition={arrowsPosition ?? "top"}
        indicators={indicators ?? "none"}
        autoplay={autoplay ?? false}
        interval={interval}
        loop={loop}
        slidesPerMove={carouselProps.slidesPerMove ?? "page"}
        header={header || undefined}
        labels={{ region: label ?? (typeof title === "string" ? title : "Carrusel"), ...labels }}
        className={className}
        sx={sx}
        {...carouselProps}
      >
        {cards.map((card, i) => (
          <Box
            key={isValidElement(card) && card.key !== null ? card.key : i}
            sx={{ height: "100%" }}
          >
            {card}
          </Box>
        ))}
      </CnCarousel>
    );
  }

  const ratioSx = height !== undefined ? { height } : { aspectRatio };

  const renderHero = (slide: CnContentSlide, index: number) => {
    if (renderSlide) return renderSlide(slide, index);
    const vAlign = slide.verticalAlign ?? verticalAlign;
    const hAlign = slide.align ?? contentAlign;
    const slideOverlay = slide.overlay ?? overlay;
    const light = (slide.textColor ?? "light") === "light";
    const hasMedia = Boolean(slide.image || slide.video);
    const textOnMedia = captionPosition === "overlay";
    const textColor =
      textOnMedia && (hasMedia || slide.background)
        ? light
          ? "#fff"
          : "#111418"
        : "var(--cn-color-text, #222831)";
    const titleId = `${baseId}-title-${index}`;
    const safeHref = getSafeUrl(slide.href);
    const imageSrc = getSafeUrl(slide.image);
    const videoSrc = getSafeUrl(slide.video);
    const clickable = Boolean(safeHref || onSlideClick);

    const viewMoreAction: CnContentSlideAction | null = onViewMore
      ? {
          label: viewMoreLabel,
          variant: "text",
          icon: undefined,
          onClick: () => onViewMore(slide, index),
        }
      : null;
    const actions = [...(slide.actions ?? []), ...(viewMoreAction ? [viewMoreAction] : [])];

    const textBlock = (slide.content ||
      slide.title ||
      slide.description ||
      slide.eyebrow ||
      slide.badge ||
      actions.length > 0) && (
      <Box
        data-cn-hero-content
        sx={{
          position: "relative",
          zIndex: 2,
          pointerEvents: safeHref ? "none" : undefined,
          "& a, & button": { pointerEvents: "auto" },
          maxWidth: textOnMedia ? { xs: "100%", md: 640 } : "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: JUSTIFY[hAlign],
          textAlign: hAlign === "center" ? "center" : hAlign === "end" ? "right" : "left",
          gap: "8px",
          color: textColor,
        }}
      >
        {slide.content ?? (
          <>
            {(slide.eyebrow || slide.badge) && (
              <Box sx={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                {slide.badge &&
                  (typeof slide.badge === "string" ? (
                    <CnChip
                      label={slide.badge}
                      size="small"
                      color={tone}
                      variant="filled"
                      compact
                    />
                  ) : (
                    slide.badge
                  ))}
                {slide.eyebrow && (
                  <Typography
                    component="div"
                    sx={{
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      opacity: 0.9,
                    }}
                  >
                    {slide.eyebrow}
                  </Typography>
                )}
              </Box>
            )}
            {slide.title && (
              <Typography
                id={titleId}
                component={titleComponent}
                sx={{
                  m: 0,
                  fontSize: textOnMedia
                    ? "clamp(18px, 2.6vw, 32px)"
                    : "var(--cn-font-size-lg, 16px)",
                  fontWeight: "var(--cn-font-weight-bold, 700)",
                  lineHeight: 1.2,
                  color: "inherit",
                  textShadow:
                    textOnMedia && hasMedia && light ? "0 1px 2px rgba(0,0,0,0.35)" : "none",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {safeHref ? (
                  <Box
                    component="a"
                    href={safeHref}
                    target={slide.target}
                    rel={slide.target === "_blank" ? "noopener noreferrer" : undefined}
                    sx={{
                      color: "inherit",
                      textDecoration: "none",
                      "&:hover, &:focus-visible": { textDecoration: "underline" },
                    }}
                  >
                    {slide.title}
                  </Box>
                ) : (
                  slide.title
                )}
              </Typography>
            )}
            {slide.description && (
              <Typography
                component="div"
                sx={{
                  fontSize: textOnMedia
                    ? "clamp(12px, 1.4vw, 15px)"
                    : "var(--cn-font-size-sm, 13px)",
                  lineHeight: 1.5,
                  color: "inherit",
                  opacity: textOnMedia ? 0.92 : 1,
                  display: "-webkit-box",
                  WebkitLineClamp: { xs: 2, md: 3 },
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  ...(!textOnMedia && { color: "var(--cn-color-text-muted, #6e7682)" }),
                }}
              >
                {slide.description}
              </Typography>
            )}
            {actions.length > 0 && (
              <Box
                data-cn-hero-actions
                sx={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  mt: "4px",
                  justifyContent: JUSTIFY[hAlign],
                }}
              >
                {actions.map((action, i) => {
                  const buttonVariant = action.variant ?? (i === 0 ? "contained" : "outlined");
                  const onDark = textOnMedia && hasMedia && light;
                  return (
                    <CnButton
                      key={i}
                      size="small"
                      variant={buttonVariant}
                      color={onDark ? "neutral" : tone}
                      startIcon={action.icon}
                      href={action.href}
                      target={action.target}
                      rel={action.target === "_blank" ? "noopener noreferrer" : undefined}
                      onClick={(event) => {
                        event.stopPropagation();
                        action.onClick?.();
                      }}
                      sx={
                        onDark
                          ? buttonVariant === "contained"
                            ? {
                                backgroundColor: "#fff",
                                color: "#111418",
                                "&:hover": { backgroundColor: "rgba(255,255,255,0.88)" },
                              }
                            : {
                                color: "#fff",
                                borderColor: "rgba(255,255,255,0.75)",
                                "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
                              }
                          : undefined
                      }
                    >
                      {action.label}
                    </CnButton>
                  );
                })}
              </Box>
            )}
          </>
        )}
      </Box>
    );

    return (
      <Box
        data-cn-hero-slide
        component="figure"
        aria-labelledby={slide.title ? titleId : undefined}
        onClick={onSlideClick ? () => onSlideClick(slide, index) : undefined}
        sx={{
          m: 0,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          height: "100%",
          cursor: clickable ? "pointer" : undefined,
        }}
      >
        <Box
          data-cn-hero-media
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: radius,
            background:
              slide.background ??
              `linear-gradient(135deg, ${CN_TONES[tone].solid} 0%, ${CN_TONES[tone].main} 100%)`,
            display: "flex",
            alignItems: VERTICAL[vAlign],
            justifyContent: JUSTIFY[hAlign],
            p: textOnMedia ? { xs: "16px", sm: "24px", md: "32px" } : 0,
            ...ratioSx,
            ...(clickable && {
              "&:hover img": { transform: "scale(1.02)" },
            }),
          }}
        >
          {imageSrc && !videoSrc && (
            <Box
              component="img"
              src={imageSrc}
              alt={slide.imageAlt ?? ""}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              draggable={false}
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: slide.imageFit ?? "cover",
                transition: "transform 600ms ease",
                "@media (prefers-reduced-motion: reduce)": { transition: "none" },
              }}
            />
          )}
          {videoSrc && (
            <Box
              component="video"
              src={videoSrc}
              poster={getSafeUrl(slide.poster)}
              controls
              playsInline
              preload="metadata"
              aria-label={slide.imageAlt ?? slide.label}
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: slide.imageFit ?? "cover",
                backgroundColor: "#000",
              }}
            />
          )}
          {textOnMedia && hasMedia && slideOverlay !== "none" && textBlock && (
            <Box
              aria-hidden
              data-cn-hero-overlay
              sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background: overlayBackground(slideOverlay, vAlign, overlayOpacity, light),
              }}
            />
          )}
          {safeHref && (
            <Box
              component="a"
              href={safeHref}
              target={slide.target}
              rel={slide.target === "_blank" ? "noopener noreferrer" : undefined}
              aria-hidden
              tabIndex={-1}
              data-cn-hero-link
              sx={{ position: "absolute", inset: 0, zIndex: 1 }}
            />
          )}
          {textOnMedia && textBlock}
        </Box>
        {!textOnMedia && textBlock && (
          <Box sx={{ position: "relative", px: "2px" }}>{textBlock}</Box>
        )}
        {slide.caption && (
          <Box
            component="figcaption"
            sx={{
              fontSize: "var(--cn-font-size-xs, 11px)",
              color: "var(--cn-color-text-muted, #6e7682)",
              px: "2px",
            }}
          >
            {slide.caption}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <CnCarousel<CnContentSlide>
      items={slides}
      renderItem={(slide, meta) => renderHero(slide, meta.index)}
      getItemKey={(slide, i) => slide.id ?? i}
      getItemLabel={(slide) =>
        slide.label ?? (typeof slide.title === "string" ? slide.title : undefined)
      }
      renderThumbnail={(slide) => {
        const src = getSafeUrl(slide?.image ?? slide?.poster);
        return src ? (
          <img src={src} alt="" loading="lazy" />
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              background: slide?.background ?? CN_TONES[tone].soft,
            }}
          />
        );
      }}
      autoplay={autoplay ?? true}
      interval={interval}
      loop={loop}
      arrows={arrows}
      arrowsPosition={arrowsPosition ?? "inside"}
      indicators={indicators ?? "dots"}
      labels={{ region: label ?? "Anuncios", ...labels }}
      className={className}
      sx={sx}
      {...carouselProps}
    />
  );
};

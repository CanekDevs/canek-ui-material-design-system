import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { Children, isValidElement, useEffect, useId, useRef, useState } from "react";
import type { CnTone } from "../../utils/tones";
import { CN_TONES } from "../../utils/tones";
import { CnButton } from "../CnButton";
import type { CnCarouselBreakpoint, CnCarouselProps } from "../CnCarousel";
import { CnCarousel, resolveResponsive } from "../CnCarousel";
import { CnChip } from "../CnChip";
import { getSafeUrl } from "../CnFileField/file-utils";
import { CnIcon } from "../CnIcon";
import { CnContentCarouselSkeleton } from "./CnContentCarouselSkeleton";

/** Valor fijo o por breakpoint del **ancho del carrusel** (claves de breakpoint de MUI). */
export type CnResponsiveValue<T> = T | Partial<Record<CnCarouselBreakpoint, T>>;

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
  /** Candidatos responsivos (`"a.jpg 640w, b.jpg 1280w"`). */
  imageSrcSet?: string;
  /** Tamaños para `srcSet` (por defecto, el ancho completo). */
  imageSizes?: string;
  /** Miniatura (URL o data URI) que se muestra desenfocada mientras carga la imagen. */
  placeholder?: string;
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
  | "loopMode"
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
  | "swipeThreshold"
  | "swipeVelocity"
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
  /**
   * Relación de aspecto mínima de los banners, por ancho del carrusel
   * (`{ xs: "4 / 3", sm: "16 / 9", lg: "21 / 9" }`). Si el texto no cabe, el banner crece.
   */
  aspectRatio?: CnResponsiveValue<string>;
  /** Alto mínimo fijo (sustituye `aspectRatio`), por ancho del carrusel. */
  height?: CnResponsiveValue<number | string>;
  overlay?: "gradient" | "solid" | "none";
  /** Opacidad máxima del velo (0–1). En anchos chicos se refuerza para conservar el contraste. */
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
  /** Analítica: la diapositiva entró al área visible. */
  onSlideView?: (slide: CnContentSlide | undefined, index: number) => void;
  /** Diapositiva personalizada. */
  renderSlide?: (slide: CnContentSlide, index: number) => ReactNode;
  /** Nivel del título de cada diapositiva. */
  titleComponent?: "h2" | "h3" | "h4" | "div";

  // ─── cards ───────────────────────────────────────────────────────────
  /** Tarjetas (preset `cards`). También se aceptan como hijos. */
  items?: ReactNode[];
  children?: ReactNode;
  /** Ancho máximo de cada tarjeta (px; nunca más ancho que el carrusel). */
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

/** Contenedores (CSS container queries) para tipografía y CTA por ancho real. */
const HERO_CONTAINER = "cn-hero";
const CAROUSEL_CONTAINER = "cn-content-carousel";
const narrow = (px: number) => `@container ${HERO_CONTAINER} (max-width: ${px}px)`;
const wide = (px: number) => `@container ${HERO_CONTAINER} (min-width: ${px}px)`;

/**
 * Velo sobre la imagen. En anchos chicos el texto ocupa más superficie, así que
 * el velo cubre más área y conserva un mínimo de opacidad en toda la imagen.
 */
export const overlayBackground = (
  overlay: "gradient" | "solid" | "none",
  vertical: "top" | "center" | "bottom",
  opacity: number,
  dark: boolean,
  compact = false,
) => {
  if (overlay === "none") return "none";
  const rgb = dark ? "0, 0, 0" : "255, 255, 255";
  const a = (value: number) => `rgba(${rgb}, ${Math.min(1, value).toFixed(3)})`;
  if (overlay === "solid" || vertical === "center") return a(opacity * (compact ? 0.8 : 0.7));
  const direction = vertical === "top" ? "to bottom" : "to top";
  if (compact) {
    return `linear-gradient(${direction}, ${a(opacity * 1.05)} 0%, ${a(opacity * 0.7)} 55%, ${a(opacity * 0.3)} 100%)`;
  }
  return `linear-gradient(${direction}, ${a(opacity)} 0%, ${a(opacity * 0.45)} 45%, ${a(0)} 80%)`;
};

/** Valida cada candidato de un `srcSet` (descarta URLs inseguras). */
const safeSrcSet = (srcSet?: string) => {
  if (!srcSet) return undefined;
  const parts = srcSet
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [url, ...rest] = part.split(/\s+/);
      const safe = getSafeUrl(url);
      return safe ? [safe, ...rest].join(" ") : null;
    })
    .filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
};

type HeroImageProps = {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  placeholder?: string;
  fit: "cover" | "contain";
  eager: boolean;
};

/** Imagen con `srcSet`/`sizes`, aparición suave y marcador desenfocado (blur-up). */
const HeroImage = ({ src, srcSet, sizes, alt, placeholder, fit, eager }: HeroImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const safePlaceholder = getSafeUrl(placeholder);
  useEffect(() => {
    const img = imgRef.current;
    setLoaded(Boolean(img?.complete && img.naturalWidth > 0));
  }, [src]);
  return (
    <>
      {safePlaceholder && (
        <Box
          aria-hidden
          data-cn-hero-placeholder
          sx={{
            position: "absolute",
            inset: "-24px",
            backgroundImage: `url("${safePlaceholder.replace(/"/g, "%22")}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(18px)",
            transform: "scale(1.05)",
            opacity: loaded ? 0 : 1,
            transition: "opacity 400ms ease",
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          }}
        />
      )}
      <Box
        ref={imgRef}
        component="img"
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? (sizes ?? "100vw") : undefined}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        data-loaded={loaded || undefined}
        onLoad={() => setLoaded(true)}
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: fit,
          opacity: safePlaceholder && !loaded ? 0 : 1,
          transition: "transform 600ms ease, opacity 400ms ease",
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        }}
      />
    </>
  );
};

/**
 * Carrusel de contenido: banners (`hero`) con imagen o fondo, velo adaptable,
 * título, descripción, CTA y pies de foto; o una fila de tarjetas (`cards`)
 * con encabezado y flechas. Construido sobre `CnCarousel`; la tipografía, el
 * número de líneas y la disposición de los CTA dependen del ancho del
 * carrusel (container queries), no de la ventana.
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
  onSlideView,
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
  const theme = useTheme();
  const breakpoints = theme.breakpoints.values as Record<CnCarouselBreakpoint, number>;
  const isCards = variant === "cards";

  if (skeleton) {
    return (
      <CnContentCarouselSkeleton
        variant={variant}
        aspectRatio={resolveResponsive(aspectRatio, 0, breakpoints, "16 / 9")}
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
              overflowWrap: "anywhere",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
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
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {headerAction && <Box sx={{ flexShrink: 0, maxWidth: "45%" }}>{headerAction}</Box>}
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
        onSlideView={onSlideView ? (index) => onSlideView(undefined, index) : undefined}
        className={className}
        sx={sx}
        {...carouselProps}
      >
        {cards.map((card, i) => (
          <Box
            key={isValidElement(card) && card.key !== null ? card.key : i}
            sx={{ height: "100%", minWidth: 0 }}
          >
            {card}
          </Box>
        ))}
      </CnCarousel>
    );
  }

  const arrowsInside = Boolean(arrows) && (arrowsPosition ?? "inside") === "inside";

  const renderHero = (slide: CnContentSlide, index: number, width: number, isClone: boolean) => {
    if (renderSlide) return renderSlide(slide, index);
    const vAlign = slide.verticalAlign ?? verticalAlign;
    const hAlign = slide.align ?? contentAlign;
    const slideOverlay = slide.overlay ?? overlay;
    const light = (slide.textColor ?? "light") === "light";
    const hasMedia = Boolean(slide.image || slide.video);
    const textOnMedia = captionPosition === "overlay";
    const onMedia = textOnMedia && (hasMedia || Boolean(slide.background));
    const textColor = onMedia ? (light ? "#fff" : "#111418") : "var(--cn-color-text, #222831)";
    const titleId = `${baseId}-title-${index}${isClone ? "-clone" : ""}`;
    const safeHref = getSafeUrl(slide.href);
    const imageSrc = getSafeUrl(slide.image);
    const videoSrc = getSafeUrl(slide.video);
    const clickable = Boolean(safeHref || onSlideClick);
    const minSize =
      height !== undefined
        ? { minHeight: resolveResponsive(height, width, breakpoints, undefined) }
        : { aspectRatio: resolveResponsive(aspectRatio, width, breakpoints, "16 / 9") };

    const viewMoreAction: CnContentSlideAction | null = onViewMore
      ? { label: viewMoreLabel, variant: "text", onClick: () => onViewMore(slide, index) }
      : null;
    const actions = [...(slide.actions ?? []), ...(viewMoreAction ? [viewMoreAction] : [])];
    const textShadow = textOnMedia && hasMedia && light ? "0 1px 3px rgba(0,0,0,0.45)" : "none";

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
          width: "100%",
          minWidth: 0,
          maxWidth: "100%",
          ...(textOnMedia && { [wide(900)]: { maxWidth: 640 } }),
          display: "flex",
          flexDirection: "column",
          alignItems: JUSTIFY[hAlign],
          textAlign: hAlign === "center" ? "center" : hAlign === "end" ? "right" : "left",
          gap: "8px",
          color: textColor,
          overflowWrap: "anywhere",
        }}
      >
        {slide.content ?? (
          <>
            {(slide.eyebrow || slide.badge) && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                  maxWidth: "100%",
                  minWidth: 0,
                  justifyContent: JUSTIFY[hAlign],
                }}
              >
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
                      opacity: 0.92,
                      textShadow,
                      minWidth: 0,
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
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
                data-cn-hero-title
                component={titleComponent}
                sx={{
                  m: 0,
                  maxWidth: "100%",
                  fontSize: textOnMedia ? "20px" : "var(--cn-font-size-lg, 16px)",
                  ...(textOnMedia && {
                    "@supports (font-size: 1cqi)": { fontSize: "clamp(17px, 4cqi, 34px)" },
                  }),
                  fontWeight: "var(--cn-font-weight-bold, 700)",
                  lineHeight: 1.2,
                  color: "inherit",
                  textShadow,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  [narrow(359)]: { WebkitLineClamp: 2 },
                }}
              >
                {safeHref && !isClone ? (
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
                data-cn-hero-description
                sx={{
                  maxWidth: "100%",
                  fontSize: textOnMedia ? "14px" : "var(--cn-font-size-sm, 13px)",
                  ...(textOnMedia && {
                    "@supports (font-size: 1cqi)": { fontSize: "clamp(12.5px, 1.9cqi, 16px)" },
                  }),
                  lineHeight: 1.5,
                  color: "inherit",
                  opacity: textOnMedia ? 0.95 : 1,
                  textShadow,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  [narrow(599)]: { WebkitLineClamp: 2 },
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
                  maxWidth: "100%",
                  justifyContent: JUSTIFY[hAlign],
                  "& > *": { minWidth: 0, maxWidth: "100%" },
                  // En anchos chicos los CTA se apilan a lo ancho.
                  [narrow(419)]: {
                    flexDirection: "column",
                    alignItems: "stretch",
                    alignSelf: "stretch",
                    "& > *": { width: "100%" },
                  },
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
                      sx={[
                        {
                          whiteSpace: "normal",
                          textAlign: "center",
                          overflowWrap: "anywhere",
                        },
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
                                textShadow,
                                "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
                              }
                          : {},
                      ]}
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

    const sidePad = arrowsInside ? 56 : 24;

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
          minWidth: 0,
          containerType: "inline-size",
          containerName: HERO_CONTAINER,
          cursor: clickable ? "pointer" : undefined,
        }}
      >
        <Box
          data-cn-hero-media
          sx={{
            position: "relative",
            flex: textOnMedia ? 1 : undefined,
            borderRadius: radius,
            background:
              slide.background ??
              `linear-gradient(135deg, ${CN_TONES[tone].solid} 0%, ${CN_TONES[tone].main} 100%)`,
            display: "flex",
            alignItems: VERTICAL[vAlign],
            justifyContent: JUSTIFY[hAlign],
            minWidth: 0,
            boxSizing: "border-box",
            // El tamaño es mínimo: si el texto no cabe, el banner crece en vez de recortarlo.
            ...minSize,
            ...(textOnMedia && {
              p: "16px",
              pb: "20px",
              [wide(480)]: { px: `${sidePad}px`, py: "24px" },
              [wide(900)]: { px: `${sidePad + 8}px`, py: "32px" },
            }),
            ...(clickable && { "&:hover img": { transform: "scale(1.02)" } }),
          }}
        >
          <Box
            data-cn-hero-backdrop
            sx={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              borderRadius: "inherit",
              pointerEvents: videoSrc ? undefined : "none",
            }}
          >
            {imageSrc && !videoSrc && (
              <HeroImage
                src={imageSrc}
                srcSet={safeSrcSet(slide.imageSrcSet)}
                sizes={slide.imageSizes}
                alt={isClone ? "" : (slide.imageAlt ?? "")}
                placeholder={slide.placeholder}
                fit={slide.imageFit ?? "cover"}
                eager={index === 0}
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
                  [narrow(599)]: {
                    background: overlayBackground(
                      slideOverlay,
                      vAlign,
                      overlayOpacity,
                      light,
                      true,
                    ),
                  },
                }}
              />
            )}
          </Box>
          {safeHref && !isClone && (
            <Box
              component="a"
              href={safeHref}
              target={slide.target}
              rel={slide.target === "_blank" ? "noopener noreferrer" : undefined}
              aria-hidden
              tabIndex={-1}
              data-cn-hero-link
              sx={{ position: "absolute", inset: 0, zIndex: 1, borderRadius: "inherit" }}
            />
          )}
          {textOnMedia && textBlock}
        </Box>
        {!textOnMedia && textBlock && (
          <Box sx={{ position: "relative", px: "2px", minWidth: 0 }}>{textBlock}</Box>
        )}
        {slide.caption && (
          <Box
            component="figcaption"
            sx={{
              fontSize: "var(--cn-font-size-xs, 11px)",
              color: "var(--cn-color-text-muted, #6e7682)",
              px: "2px",
              overflowWrap: "anywhere",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
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
      renderItem={(slide, meta) => renderHero(slide, meta.index, meta.containerWidth, meta.isClone)}
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
      onSlideView={onSlideView ? (index, slide) => onSlideView(slide, index) : undefined}
      autoplay={autoplay ?? true}
      interval={interval}
      loop={loop}
      arrows={arrows}
      arrowsPosition={arrowsPosition ?? "inside"}
      indicators={indicators ?? "dots"}
      labels={{ region: label ?? "Anuncios", ...labels }}
      className={className}
      sx={[
        {
          containerType: "inline-size",
          containerName: CAROUSEL_CONTAINER,
          // En carruseles angostos las flechas internas tapan el texto: se navega
          // deslizando, con los puntos o con el teclado.
          [`@container ${CAROUSEL_CONTAINER} (max-width: 479px)`]: {
            "& [data-cn-carousel-arrow]": arrowsInside ? { display: "none" } : {},
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...carouselProps}
    />
  );
};

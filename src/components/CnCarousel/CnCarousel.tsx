import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { keyframes, useTheme } from "@mui/material/styles";
import type {
  FocusEvent,
  Key,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
  Ref,
} from "react";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CnButton } from "../CnButton";
import { CnEmptyState } from "../CnEmptyState";
import { visuallyHiddenSx } from "../CnInfoCard/tones";
import { CnCarouselSkeleton } from "./CnCarouselSkeleton";

export type CnCarouselBreakpoint = "xs" | "sm" | "md" | "lg" | "xl";
/** Valor fijo o por ancho del contenedor (claves de breakpoint de MUI). */
export type CnCarouselResponsive<T> = T | Partial<Record<CnCarouselBreakpoint, T>>;
export type CnCarouselIndicators = "dots" | "progress" | "fraction" | "thumbnails" | "none";

export type CnCarouselSlideMeta = {
  index: number;
  /** Primera diapositiva visible. */
  isActive: boolean;
  /** Dentro del área visible. */
  isVisible: boolean;
};

export type CnCarouselActions = {
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  play: () => void;
  pause: () => void;
};

export type CnCarouselLabels = {
  region?: string;
  slides?: string;
  prev?: string;
  next?: string;
  play?: string;
  pause?: string;
  goTo?: (index: number, total: number) => string;
  slide?: (index: number, total: number) => string;
};

export type CnCarouselProps<T = unknown> = {
  /** Diapositivas como hijos. */
  children?: ReactNode;
  /** Diapositivas como datos + `renderItem`. */
  items?: T[];
  renderItem?: (item: T, meta: CnCarouselSlideMeta) => ReactNode;
  getItemKey?: (item: T, index: number) => Key;
  /** Nombre accesible de cada diapositiva (se agrega a "x de n"). */
  getItemLabel?: (item: T, index: number) => string | undefined;

  /** Diapositivas visibles (admite fracciones y breakpoints por ancho del contenedor). */
  slidesPerView?: CnCarouselResponsive<number>;
  /** Ancho fijo de cada diapositiva en px (la cantidad visible se calcula sola). */
  slideWidth?: number;
  /** Diapositivas que avanza cada flecha (`page` = las visibles). */
  slidesPerMove?: number | "page";
  /** Separación entre diapositivas (px). */
  gap?: CnCarouselResponsive<number>;
  /** Porción visible de la siguiente diapositiva (px). */
  peek?: number;
  /** Al llegar al final vuelve al inicio (y viceversa). */
  loop?: boolean;

  autoplay?: boolean;
  /** Intervalo del autoplay (ms). */
  interval?: number;
  pauseOnHover?: boolean;
  pauseOnFocus?: boolean;
  /** Con `prefers-reduced-motion` el autoplay arranca en pausa y no hay animación. */
  respectReducedMotion?: boolean;
  /** Barra de tiempo del autoplay. */
  autoplayProgress?: boolean;
  /** Botón reproducir/pausar (por defecto, cuando hay autoplay). */
  showPlayPause?: boolean;

  /** `hover` = solo visibles al pasar el cursor o con foco. */
  arrows?: boolean | "hover";
  arrowsPosition?: "inside" | "outside" | "top";
  indicators?: CnCarouselIndicators;
  /** Miniatura de cada diapositiva (indicador `thumbnails`). */
  renderThumbnail?: (item: T | undefined, index: number) => ReactNode;
  thumbnailSize?: { width: number; height: number };
  /** Arrastre con el ratón (el táctil usa el desplazamiento nativo). */
  draggable?: boolean;
  keyboard?: boolean;
  /** Monta solo las diapositivas cercanas (número = cuántas precargar a cada lado). */
  lazy?: boolean | number;

  index?: number;
  defaultIndex?: number;
  onChange?: (index: number) => void;
  actionRef?: Ref<CnCarouselActions>;

  /** Contenido a la izquierda de la barra superior (`arrowsPosition="top"`). */
  header?: ReactNode;
  emptyState?: { title?: ReactNode; description?: ReactNode; icon?: string; action?: ReactNode };
  labels?: CnCarouselLabels;
  /** Muestra el skeleton del carrusel. */
  skeleton?: boolean;
  /** Alto del skeleton (o relación de aspecto de sus diapositivas). */
  skeletonHeight?: number;
  skeletonAspectRatio?: string;

  sx?: SxProps<Theme>;
  trackSx?: SxProps<Theme>;
  slideSx?: SxProps<Theme>;
  className?: string;
};

const DEFAULT_LABELS: Required<CnCarouselLabels> = {
  region: "Carrusel",
  slides: "Diapositivas",
  prev: "Anterior",
  next: "Siguiente",
  play: "Reproducir carrusel",
  pause: "Pausar carrusel",
  goTo: (index) => `Ir a la diapositiva ${index}`,
  slide: (index, total) => `${index} de ${total}`,
};

const BREAKPOINT_ORDER: CnCarouselBreakpoint[] = ["xs", "sm", "md", "lg", "xl"];

const timerFill = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Valor responsivo según el ancho del contenedor. */
export const resolveResponsive = <T,>(
  value: CnCarouselResponsive<T> | undefined,
  width: number,
  breakpoints: Record<CnCarouselBreakpoint, number>,
  fallback: T,
): T => {
  if (value === undefined) return fallback;
  if (typeof value !== "object" || value === null) return value as T;
  const map = value as Partial<Record<CnCarouselBreakpoint, T>>;
  let result: T | undefined;
  for (const key of BREAKPOINT_ORDER) {
    if (map[key] === undefined) continue;
    if (result === undefined || width >= breakpoints[key]) result = map[key];
  }
  return result ?? fallback;
};

const usePrefersReducedMotion = () => {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia(query).matches,
  );
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(query);
    const update = () => setReduced(mql.matches);
    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, []);
  return reduced;
};

/**
 * Carrusel genérico con desplazamiento nativo (CSS scroll-snap) y un índice
 * controlado o no controlado: diapositivas por vista responsivas, separación,
 * vistazo de la siguiente, bucle, autoplay accesible, flechas, puntos,
 * progreso o miniaturas, arrastre, teclado y carga diferida.
 */
export function CnCarousel<T = unknown>({
  children,
  items,
  renderItem,
  getItemKey,
  getItemLabel,
  slidesPerView = 1,
  slideWidth,
  slidesPerMove = 1,
  gap: gapProp = 16,
  peek = 0,
  loop = false,
  autoplay = false,
  interval = 5000,
  pauseOnHover = true,
  pauseOnFocus = true,
  respectReducedMotion = true,
  autoplayProgress = false,
  showPlayPause,
  arrows = true,
  arrowsPosition = "inside",
  indicators = "dots",
  renderThumbnail,
  thumbnailSize = { width: 64, height: 44 },
  draggable = true,
  keyboard = true,
  lazy = false,
  index: indexProp,
  defaultIndex = 0,
  onChange,
  actionRef,
  header,
  emptyState,
  labels: labelsProp,
  skeleton = false,
  skeletonHeight,
  skeletonAspectRatio,
  sx,
  trackSx,
  slideSx,
  className,
}: CnCarouselProps<T>) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const theme = useTheme();
  const breakpoints = theme.breakpoints.values as Record<CnCarouselBreakpoint, number>;
  const trackId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const reduced = respectReducedMotion && reducedMotion;

  // ─── Diapositivas ───────────────────────────────────────────────────
  type SlideEntry = { key: Key; item: T | undefined; node?: ReactNode; label?: string };
  const slides = useMemo<SlideEntry[]>(() => {
    if (items) {
      return items.map((item, i) => ({
        key: getItemKey ? getItemKey(item, i) : i,
        item,
        label: getItemLabel?.(item, i),
      }));
    }
    return Children.toArray(children).map((child, i) => ({
      key: isValidElement(child) && child.key !== null ? child.key : i,
      item: undefined,
      node: child,
    }));
  }, [items, children, getItemKey, getItemLabel]);
  const count = slides.length;

  // ─── Medidas ───────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setWidth(track.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [skeleton, count]);

  const gap = resolveResponsive(gapProp, width, breakpoints, 16);
  const perView = slideWidth
    ? width > 0
      ? Math.max(1, Math.floor((width - peek + gap) / (slideWidth + gap)))
      : 1
    : Math.max(1, resolveResponsive(slidesPerView, width, breakpoints, 1));
  const fullPerView = Math.max(1, Math.floor(perView + 0.001));
  const maxIndex = Math.max(0, count - fullPerView);
  const move = slidesPerMove === "page" ? fullPerView : Math.max(1, slidesPerMove);
  const canScroll = count > fullPerView;

  // ─── Índice ────────────────────────────────────────────────────────
  const [indexState, setIndexState] = useState(defaultIndex);
  const current = clamp(indexProp ?? indexState, 0, maxIndex);
  const currentRef = useRef(current);
  currentRef.current = current;
  const fromScrollRef = useRef(false);
  const programmaticRef = useRef<number | null>(null);
  const programmaticTimer = useRef<ReturnType<typeof setTimeout>>();

  const commit = useCallback(
    (next: number) => {
      const target = clamp(next, 0, maxIndex);
      if (indexProp === undefined) setIndexState(target);
      if (target !== currentRef.current) onChange?.(target);
    },
    [indexProp, maxIndex, onChange],
  );

  const scrollToIndex = useCallback(
    (target: number, behavior: ScrollBehavior) => {
      const track = trackRef.current;
      const slide = track?.children[target] as HTMLElement | undefined;
      if (!track || !slide) return;
      const atEnd = target >= maxIndex && maxIndex > 0;
      const left = atEnd ? track.scrollWidth - track.clientWidth : slide.offsetLeft;
      programmaticRef.current = target;
      clearTimeout(programmaticTimer.current);
      programmaticTimer.current = setTimeout(() => {
        programmaticRef.current = null;
      }, 900);
      if (typeof track.scrollTo === "function") track.scrollTo({ left, behavior });
      else track.scrollLeft = left;
    },
    [maxIndex],
  );

  // Sincroniza el desplazamiento con el índice (salvo si el cambio vino del propio scroll).
  const lastWidthRef = useRef(width);
  useEffect(() => {
    const resized = lastWidthRef.current !== width;
    lastWidthRef.current = width;
    if (fromScrollRef.current && !resized) {
      fromScrollRef.current = false;
      return;
    }
    fromScrollRef.current = false;
    scrollToIndex(current, reduced || resized ? "auto" : "smooth");
  }, [current, width, perView, scrollToIndex, reduced]);

  useEffect(() => () => clearTimeout(programmaticTimer.current), []);

  const goTo = useCallback(
    (target: number) => {
      if (count === 0) return;
      let next = target;
      if (next > maxIndex) next = loop ? 0 : maxIndex;
      if (next < 0) next = loop ? maxIndex : 0;
      commit(next);
    },
    [commit, count, loop, maxIndex],
  );

  const next = useCallback(() => {
    const cur = currentRef.current;
    if (cur >= maxIndex) goTo(loop ? 0 : maxIndex);
    else goTo(Math.min(cur + move, maxIndex));
  }, [goTo, loop, maxIndex, move]);

  const prev = useCallback(() => {
    const cur = currentRef.current;
    if (cur <= 0) goTo(loop ? maxIndex : 0);
    else goTo(Math.max(cur - move, 0));
  }, [goTo, loop, maxIndex, move]);

  // ─── Scroll nativo (táctil, rueda, trackpad) ────────────────────────
  const rafRef = useRef<number>();
  const handleScroll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const track = trackRef.current;
      const first = track?.children[0] as HTMLElement | undefined;
      if (!track || !first || draggingRef.current) return;
      const step = first.offsetWidth + gap;
      if (step <= 0) return;
      let idx = Math.round(track.scrollLeft / step);
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 2) idx = maxIndex;
      idx = clamp(idx, 0, maxIndex);
      if (programmaticRef.current !== null) {
        if (idx === programmaticRef.current) programmaticRef.current = null;
        return;
      }
      if (idx !== currentRef.current) {
        fromScrollRef.current = true;
        commit(idx);
      }
    });
  };
  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  // ─── Arrastre con ratón ────────────────────────────────────────────
  const dragRef = useRef<{ x: number; left: number; start: number; moved: boolean } | null>(null);
  const draggingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggable || !canScroll || event.pointerType !== "mouse" || event.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    dragRef.current = {
      x: event.clientX,
      left: track.scrollLeft,
      start: currentRef.current,
      moved: false,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const track = trackRef.current;
    if (!drag || !track) return;
    const dx = event.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 5) {
      drag.moved = true;
      draggingRef.current = true;
      setDragging(true);
      track.setPointerCapture?.(event.pointerId);
    }
    if (drag.moved) track.scrollLeft = drag.left - dx;
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag?.moved) return;
    const track = trackRef.current;
    track?.releasePointerCapture?.(event.pointerId);
    draggingRef.current = false;
    setDragging(false);
    suppressClickRef.current = true;
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
    const dx = event.clientX - drag.x;
    const threshold = Math.min(80, width * 0.15 || 50);
    let target = drag.start;
    if (dx < -threshold) target = drag.start + move;
    else if (dx > threshold) target = drag.start - move;
    target = clamp(target, 0, maxIndex);
    if (target === currentRef.current) scrollToIndex(target, reduced ? "auto" : "smooth");
    else commit(target);
  };

  const onClickCapture = (event: MouseEvent) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  // ─── Teclado ───────────────────────────────────────────────────────
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!keyboard || event.target !== event.currentTarget) return;
    const map: Record<string, () => void> = {
      ArrowRight: next,
      ArrowLeft: prev,
      Home: () => goTo(0),
      End: () => goTo(maxIndex),
    };
    const action = map[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  };

  // ─── Autoplay ──────────────────────────────────────────────────────
  const [playing, setPlaying] = useState(autoplay && !reduced);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  useEffect(() => {
    setPlaying(autoplay && !reduced);
  }, [autoplay, reduced]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const update = () => setPageHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const running =
    autoplay &&
    playing &&
    canScroll &&
    !pageHidden &&
    !dragging &&
    !(pauseOnHover && hovered) &&
    !(pauseOnFocus && focused);

  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => {
      const cur = currentRef.current;
      // El autoplay siempre vuelve al inicio al terminar.
      goTo(cur >= maxIndex ? 0 : Math.min(cur + move, maxIndex));
    }, interval);
    return () => clearTimeout(timer);
  }, [running, current, interval, goTo, maxIndex, move]);

  useImperativeHandle(
    actionRef,
    () => ({ next, prev, goTo, play: () => setPlaying(true), pause: () => setPlaying(false) }),
    [next, prev, goTo],
  );

  // ─── Carga diferida ────────────────────────────────────────────────
  const preload = typeof lazy === "number" ? lazy : 1;
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set());
  const nearStart = current - preload;
  const nearEnd = current + Math.ceil(perView) - 1 + preload;
  useEffect(() => {
    if (!lazy) return;
    setLoaded((prevSet) => {
      let changed = false;
      const nextSet = new Set(prevSet);
      for (let i = Math.max(0, nearStart); i <= Math.min(count - 1, nearEnd); i++) {
        if (!nextSet.has(i)) {
          nextSet.add(i);
          changed = true;
        }
      }
      return changed ? nextSet : prevSet;
    });
  }, [lazy, nearStart, nearEnd, count]);

  if (skeleton) {
    return (
      <CnCarouselSkeleton
        slidesPerView={Math.ceil(perView)}
        gap={gap}
        height={skeletonHeight}
        aspectRatio={skeletonAspectRatio}
        arrows={Boolean(arrows)}
        arrowsPosition={arrowsPosition}
        indicators={indicators}
        sx={sx}
        className={className}
      />
    );
  }

  if (count === 0) {
    return (
      <Box className={className} sx={sx}>
        <CnEmptyState
          variant="compact"
          size="sm"
          icon={emptyState?.icon ?? "view_carousel"}
          title={emptyState?.title ?? "Sin elementos"}
          description={emptyState?.description}
          action={emptyState?.action}
        />
      </Box>
    );
  }

  const visibleCount = Math.max(1, Math.floor(perView + 0.001));
  const isVisible = (i: number) => i >= current && i < current + visibleCount;
  const basis = slideWidth
    ? `${slideWidth}px`
    : `calc((100% - ${peek}px - ${gap * (perView - 1)}px) / ${perView})`;
  const arrowsVisible = Boolean(arrows) && canScroll;
  const showPlay = (showPlayPause ?? autoplay) && canScroll;
  const atStart = current <= 0;
  const atEnd = current >= maxIndex;

  const positions: number[] = [];
  for (let i = 0; i < maxIndex; i += move) positions.push(i);
  positions.push(maxIndex);
  const activePosition = positions.reduce(
    (best, pos, i) => (Math.abs(pos - current) < Math.abs(positions[best] - current) ? i : best),
    0,
  );

  const arrowButton = (direction: "prev" | "next") => {
    const disabled = !loop && (direction === "prev" ? atStart : atEnd);
    const inside = arrowsPosition === "inside";
    const outside = arrowsPosition === "outside";
    return (
      <CnButton
        iconOnly
        icon={direction === "prev" ? "chevron_left" : "chevron_right"}
        size="small"
        variant={inside ? "contained" : "outlined"}
        color="neutral"
        shape="pill"
        aria-label={direction === "prev" ? labels.prev : labels.next}
        aria-controls={trackId}
        disabled={disabled}
        onClick={direction === "prev" ? prev : next}
        data-cn-carousel-arrow={direction}
        sx={{
          ...(inside || outside
            ? {
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                [direction === "prev" ? "left" : "right"]: inside ? 8 : 0,
              }
            : {}),
          ...(inside
            ? {
                backgroundColor: "var(--cn-color-surface, #ffffff)",
                color: "var(--cn-color-text, #222831)",
                boxShadow: "var(--cn-shadow-md, 0 4px 12px rgba(15, 23, 42, 0.12))",
                "&:hover": { backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)" },
                "&.Mui-disabled": { opacity: 0, pointerEvents: "none" },
              }
            : {}),
          ...(arrows === "hover" && arrowsPosition !== "top"
            ? {
                opacity: 0,
                transition: "opacity 160ms ease",
                "[data-cn-carousel]:hover &, [data-cn-carousel]:focus-within &": { opacity: 1 },
                "@media (hover: none)": { opacity: 1 },
              }
            : {}),
        }}
      />
    );
  };

  const playPauseButton = showPlay ? (
    <CnButton
      iconOnly
      icon={playing ? "pause" : "play_arrow"}
      size="small"
      variant="text"
      color="neutral"
      aria-label={playing ? labels.pause : labels.play}
      aria-pressed={undefined}
      onClick={() => setPlaying((p) => !p)}
      data-cn-carousel-playpause
    />
  ) : null;

  let indicatorNode: ReactNode = null;
  if (indicators === "dots" && positions.length > 1) {
    indicatorNode = (
      <Box
        data-cn-carousel-dots
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {positions.map((pos, i) => {
          const active = i === activePosition;
          return (
            <ButtonBase
              key={pos}
              aria-label={labels.goTo(pos + 1, count)}
              aria-current={active ? "true" : undefined}
              aria-controls={trackId}
              onClick={() => goTo(pos)}
              sx={{
                width: active ? 22 : 8,
                height: 8,
                borderRadius: "999px",
                backgroundColor: active
                  ? "var(--cn-color-brand-500, #3562a6)"
                  : "var(--cn-color-neutral-300, #c5cad0)",
                transition: reduced ? "none" : "width 200ms ease, background-color 200ms ease",
                "&:hover": {
                  backgroundColor: active ? undefined : "var(--cn-color-neutral-400, #9aa1aa)",
                },
                "&.Mui-focusVisible": {
                  boxShadow: "var(--cn-shadow-focus, 0 0 0 3px rgba(80, 129, 196, 0.35))",
                },
              }}
            />
          );
        })}
      </Box>
    );
  } else if (indicators === "progress" && canScroll) {
    indicatorNode = (
      <Box
        data-cn-carousel-progress
        role="progressbar"
        aria-label={labels.slides}
        aria-valuemin={1}
        aria-valuemax={maxIndex + 1}
        aria-valuenow={current + 1}
        sx={{
          flex: 1,
          maxWidth: 240,
          height: 4,
          borderRadius: 2,
          backgroundColor: "var(--cn-color-neutral-150, #e9ecef)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${((current + visibleCount) / count) * 100}%`,
            backgroundColor: "var(--cn-color-brand-500, #3562a6)",
            borderRadius: 2,
            transition: reduced ? "none" : "width 260ms ease",
          }}
        />
      </Box>
    );
  } else if (indicators === "fraction") {
    indicatorNode = (
      <Typography
        data-cn-carousel-fraction
        component="div"
        aria-hidden
        sx={{
          fontSize: "var(--cn-font-size-sm, 12px)",
          color: "var(--cn-color-text-muted, #6e7682)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {current + 1} / {count}
      </Typography>
    );
  } else if (indicators === "thumbnails" && renderThumbnail) {
    indicatorNode = (
      <Box
        data-cn-carousel-thumbnails
        sx={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          maxWidth: "100%",
          py: "4px",
          px: "2px",
          scrollbarWidth: "thin",
        }}
      >
        {slides.map((slide, i) => {
          const active = isVisible(i);
          return (
            <ButtonBase
              key={slide.key}
              aria-label={labels.goTo(i + 1, count)}
              aria-current={i === current ? "true" : undefined}
              aria-controls={trackId}
              onClick={() => goTo(Math.min(i, maxIndex))}
              sx={{
                flexShrink: 0,
                width: thumbnailSize.width,
                height: thumbnailSize.height,
                borderRadius: "var(--cn-radius-md, 8px)",
                overflow: "hidden",
                opacity: active ? 1 : 0.6,
                outline: active
                  ? "2px solid var(--cn-color-brand-500, #3562a6)"
                  : "1px solid var(--cn-color-border, #dde0e4)",
                outlineOffset: active ? "1px" : "-1px",
                transition: reduced ? "none" : "opacity 160ms ease",
                "&:hover": { opacity: 1 },
                "&.Mui-focusVisible": {
                  boxShadow: "var(--cn-shadow-focus, 0 0 0 3px rgba(80, 129, 196, 0.35))",
                },
                "& img": { width: "100%", height: "100%", objectFit: "cover", display: "block" },
              }}
            >
              {renderThumbnail(slide.item, i)}
            </ButtonBase>
          );
        })}
      </Box>
    );
  }

  const isTop = arrowsPosition === "top";
  const toolbar = isTop && (header || arrowsVisible || showPlay) && (
    <Box
      data-cn-carousel-toolbar
      sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "12px", minWidth: 0 }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>{header}</Box>
      {playPauseButton}
      {arrowsVisible && (
        <>
          {arrowButton("prev")}
          {arrowButton("next")}
        </>
      )}
    </Box>
  );

  const showFooter = Boolean(indicatorNode) || (showPlay && !isTop);

  return (
    <Box
      component="section"
      data-cn-carousel
      aria-roledescription="carrusel"
      aria-label={labels.region}
      className={className}
      onPointerEnter={(event: PointerEvent) => event.pointerType !== "touch" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event: FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      sx={[
        { position: "relative", minWidth: 0, width: "100%" },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {toolbar}
      <Box
        sx={{
          position: "relative",
          px: arrowsPosition === "outside" && arrowsVisible ? "44px" : 0,
        }}
      >
        <Box
          ref={trackRef}
          id={trackId}
          data-cn-carousel-track
          tabIndex={keyboard ? 0 : undefined}
          aria-label={labels.slides}
          onScroll={handleScroll}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
          onDragStart={(event) => dragging && event.preventDefault()}
          sx={[
            {
              position: "relative",
              display: "flex",
              gap: `${gap}px`,
              overflowX: canScroll ? "auto" : "hidden",
              overflowY: "hidden",
              scrollSnapType: dragging ? "none" : "x mandatory",
              overscrollBehaviorX: "contain",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
              cursor: draggable && canScroll ? (dragging ? "grabbing" : "grab") : undefined,
              userSelect: dragging ? "none" : undefined,
              borderRadius: "var(--cn-radius-lg, 12px)",
              outline: "none",
              "&:focus-visible": {
                boxShadow: "var(--cn-shadow-focus, 0 0 0 3px rgba(80, 129, 196, 0.35))",
              },
              "& img": { WebkitUserDrag: "none" },
            },
            ...(Array.isArray(trackSx) ? trackSx : [trackSx]),
          ]}
        >
          {slides.map((slide, i) => {
            const visible = isVisible(i);
            const mounted = !lazy || loaded.has(i) || (i >= nearStart && i <= nearEnd);
            const meta: CnCarouselSlideMeta = {
              index: i,
              isActive: i === current,
              isVisible: visible,
            };
            const label = labels.slide(i + 1, count);
            return (
              <Box
                key={slide.key}
                role="group"
                aria-roledescription="diapositiva"
                aria-label={slide.label ? `${label}: ${slide.label}` : label}
                aria-hidden={visible ? undefined : true}
                data-cn-carousel-slide={i}
                data-active={i === current || undefined}
                {...((visible ? {} : { inert: "" }) as Record<string, unknown>)}
                sx={[
                  {
                    flex: `0 0 ${basis}`,
                    minWidth: 0,
                    scrollSnapAlign: "start",
                    scrollSnapStop: "normal",
                    display: "flex",
                    "& > *": { flex: 1, minWidth: 0 },
                  },
                  ...(Array.isArray(slideSx) ? slideSx : [slideSx]),
                ]}
              >
                {mounted
                  ? items && renderItem
                    ? renderItem(slide.item as T, meta)
                    : (slide.node ?? null)
                  : null}
              </Box>
            );
          })}
        </Box>
        {arrowsVisible && !isTop && (
          <>
            {arrowButton("prev")}
            {arrowButton("next")}
          </>
        )}
      </Box>

      {autoplay && autoplayProgress && canScroll && (
        <Box
          aria-hidden
          data-cn-carousel-timer
          sx={{
            mt: "8px",
            height: 2,
            borderRadius: 1,
            overflow: "hidden",
            backgroundColor: "var(--cn-color-neutral-150, #e9ecef)",
          }}
        >
          <Box
            key={`${current}-${playing}`}
            sx={{
              height: "100%",
              transformOrigin: "left",
              backgroundColor: "var(--cn-color-brand-500, #3562a6)",
              transform: playing ? undefined : "scaleX(0)",
              animation: playing ? `${timerFill} ${interval}ms linear forwards` : "none",
              animationPlayState: running ? "running" : "paused",
            }}
          />
        </Box>
      )}

      {showFooter && (
        <Box
          data-cn-carousel-footer
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            mt: "12px",
            minWidth: 0,
          }}
        >
          {!isTop && playPauseButton}
          {indicatorNode}
        </Box>
      )}

      <Box aria-live={running ? "off" : "polite"} aria-atomic="true" sx={visuallyHiddenSx}>
        {labels.slide(current + 1, count)}
      </Box>
    </Box>
  );
}

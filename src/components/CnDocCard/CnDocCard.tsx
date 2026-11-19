import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import LinearProgress from "@mui/material/LinearProgress";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { HTMLAttributes, MouseEvent, ReactNode, Ref } from "react";
import { forwardRef, useCallback, useEffect, useId, useRef, useState } from "react";
import type { CnFileDisplayKind, CnFileValue } from "../../utils/file-utils";
import {
  downloadFile,
  FILE_KIND_META,
  getFileDisplayKind,
  getSafeUrl,
  isFile,
} from "../../utils/file-utils";
import { formatBytes } from "../../utils/number-utils";
import { CnAvatar } from "../CnAvatar";
import { CnButton } from "../CnButton";
import type { CnCardVariant } from "../CnCard";
import { CnCard } from "../CnCard";
import type { CnChipColor } from "../CnChip";
import { CnChip } from "../CnChip";
import { CnImageViewer } from "../CnDataTable/cells";
import { FileLightbox } from "../CnFileField/FileLightbox";
import { CnIcon } from "../CnIcon";
import { CnDocCardSkeleton } from "./CnDocCardSkeleton";
import { formatDocDate } from "./doc-utils";
import { FileThumb, useObjectUrl } from "./FileThumb";

export type CnDocCardLayout = "list" | "grid" | "compact";

export type CnDocCardStatus = {
  label: ReactNode;
  color?: CnChipColor;
  icon?: string;
};

export type CnDocCardMenuAction = {
  key?: string;
  label: ReactNode;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  /** Acción destructiva (texto en rojo). */
  danger?: boolean;
};

export type CnDocCardAuthor = string | { name: string; avatarUrl?: string };

export type CnDocCardUpload = {
  /** 0–100. Sin valor, la barra es indeterminada. */
  progress?: number;
  label?: ReactNode;
  onCancel?: () => void;
};

export type CnDocCardLabels = {
  preview?: string;
  remove?: string;
  progress?: string;
  download?: string;
  share?: string;
  more?: string;
  select?: (name: string) => string;
  uploading?: string;
  cancelUpload?: string;
  retry?: string;
  error?: string;
  by?: string;
};

export type CnDocCardProps = {
  /**
   * Archivo de origen: el mismo valor que maneja `CnFileField` (`File` local o
   * `CnExistingFile`). De él se toman nombre, URL, MIME, tamaño, miniatura y
   * páginas; las props explícitas tienen prioridad. Los `File` locales generan
   * su propia miniatura (imágenes y, con `videoFrame`, videos).
   */
  file?: CnFileValue;
  /** Nombre visible (obligatorio si no se pasa `file`). */
  name?: string;
  /** URL del archivo (descarga y vista previa por defecto). */
  url?: string;
  mime?: string;
  /** Tamaño en bytes. */
  size?: number;
  /** Miniatura (portada del PDF, póster del video…). Las imágenes usan `url` si no se indica. */
  thumbnailUrl?: string;
  /** Fuerza el tipo (si no, se deduce de `mime` / extensión). */
  kind?: CnFileDisplayKind;
  /** Muestra la miniatura (imagen / video). Con `false`, solo el ícono del tipo. */
  showThumbnail?: boolean;
  /** Videos sin `thumbnailUrl`: muestra su primer cuadro (carga los metadatos del video). */
  videoFrame?: boolean;
  description?: ReactNode;
  updatedAt?: Date | string | number;
  updatedBy?: CnDocCardAuthor;
  /** Formato de la fecha (por defecto relativo en español). */
  formatDate?: (date: Date | string | number) => string;
  status?: string | CnDocCardStatus;
  tags?: string[];
  /** Etiquetas visibles; el resto se resume en "+N". */
  maxTags?: number;
  version?: string | number;
  pages?: number;
  /** Metadatos extra al final de la línea de detalles. */
  meta?: ReactNode;

  layout?: CnDocCardLayout;
  variant?: CnCardVariant;

  /** Acción principal al hacer clic en la tarjeta (por defecto, la vista previa). */
  onClick?: () => void;
  /** Vista previa propia. Sin ella: imágenes en visor, video/audio en reproductor y el resto en pestaña nueva. */
  onPreview?: () => void;
  previewable?: boolean;
  /**
   * Con `true` (por defecto), imágenes, video y audio se abren en el visor
   * integrado. Con `false`, todo se abre en una pestaña nueva y el nombre es un
   * enlace real (clic medio, copiar vínculo).
   */
  viewer?: boolean;
  /** Descarga propia (por defecto descarga `url`). */
  onDownload?: () => void;
  downloadable?: boolean;
  onShare?: () => void;
  /** Acciones adicionales del menú "más". */
  menuActions?: CnDocCardMenuAction[];
  /** Nodos extra en la zona de acciones. */
  extraActions?: ReactNode;
  hideActions?: boolean;
  /** Botón "Quitar" (siempre visible, también durante la subida o con error). */
  onRemove?: () => void;

  selectable?: boolean;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;

  /** Muestra el asa de arrastre. */
  draggable?: boolean;
  dragHandleProps?: HTMLAttributes<HTMLElement>;

  /** Estado de subida (barra de progreso y cancelar). */
  upload?: CnDocCardUpload | boolean;
  /** Error (de subida o de procesamiento). */
  error?: ReactNode | boolean;
  onRetry?: () => void;
  disabled?: boolean;

  labels?: CnDocCardLabels;
  /** Muestra el skeleton de la tarjeta (mismo layout). */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};

const DEFAULT_LABELS: Required<CnDocCardLabels> = {
  preview: "Ver",
  remove: "Quitar",
  progress: "Progreso de subida",
  download: "Descargar",
  share: "Compartir",
  more: "Más acciones de",
  select: (name) => `Seleccionar ${name}`,
  uploading: "Subiendo…",
  cancelUpload: "Cancelar subida",
  retry: "Reintentar",
  error: "No se pudo procesar el archivo",
  by: "por",
};

const authorName = (author: CnDocCardAuthor | undefined) =>
  !author ? undefined : typeof author === "string" ? author : author.name;

/** Ancho (px) por debajo del cual la tarjeta compacta sus acciones y metadatos. */
const NARROW_WIDTH = 520;

/** Observa el ancho de la tarjeta (no del viewport) para adaptar su contenido. */
const useNarrow = (threshold: number) => {
  const [narrow, setNarrow] = useState(false);
  const observer = useRef<ResizeObserver | null>(null);
  const ref = useCallback(
    (node: HTMLElement | null) => {
      observer.current?.disconnect();
      observer.current = null;
      if (!node || typeof ResizeObserver === "undefined") return;
      const check = (width: number) => setNarrow(width > 0 && width < threshold);
      check(node.getBoundingClientRect().width);
      observer.current = new ResizeObserver((entries) => check(entries[0]?.contentRect.width ?? 0));
      observer.current.observe(node);
    },
    [threshold],
  );
  useEffect(() => () => observer.current?.disconnect(), []);
  return [narrow, ref] as const;
};

const assignRef = <T,>(target: Ref<T> | undefined, value: T | null) => {
  if (typeof target === "function") target(value);
  else if (target) (target as { current: T | null }).current = value;
};

/**
 * Tarjeta de documento/archivo: ícono o miniatura por tipo, nombre, tamaño,
 * fecha y autor, estado, etiquetas, versión, acciones (ver, descargar,
 * compartir, más), selección, arrastre y estados de subida y error.
 */
export const CnDocCard = forwardRef<HTMLDivElement, CnDocCardProps>(function CnDocCard(
  {
    file,
    name: nameProp,
    url: urlProp,
    mime: mimeProp,
    size: sizeProp,
    thumbnailUrl: thumbnailProp,
    kind: kindProp,
    showThumbnail = true,
    videoFrame = false,
    description,
    updatedAt,
    updatedBy,
    formatDate,
    status,
    tags,
    maxTags = 3,
    version,
    pages: pagesProp,
    meta,
    layout = "list",
    variant = "outlined",
    onClick,
    onPreview,
    previewable = true,
    viewer = true,
    onDownload,
    downloadable,
    onShare,
    menuActions = [],
    extraActions,
    hideActions = false,
    onRemove,
    selectable = false,
    selected = false,
    onSelectedChange,
    draggable = false,
    dragHandleProps,
    upload,
    error,
    onRetry,
    disabled = false,
    labels: labelsProp,
    skeleton = false,
    sx,
    className,
  },
  ref,
) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const localFile = file && isFile(file) ? file : undefined;
  const existing = file && !isFile(file) ? file : undefined;
  const name = nameProp ?? file?.name ?? "";
  const url = urlProp ?? existing?.url;
  const mime = mimeProp ?? (localFile ? localFile.type || undefined : existing?.mime);
  const size = sizeProp ?? (file?.size || undefined);
  const pages = pagesProp ?? existing?.pages;
  const thumbnailUrl = thumbnailProp ?? existing?.thumbnailUrl;
  const kind = kindProp ?? getFileDisplayKind(name, mime);
  const kindMeta = FILE_KIND_META[kind];
  const nameId = useId();
  const [narrow, narrowRef] = useNarrow(NARROW_WIDTH);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [viewerOpen, setViewer] = useState<"image" | "media" | null>(null);
  const safeUrl = getSafeUrl(url);
  const wantsLocalUrl =
    showThumbnail && !thumbnailProp && (kind === "image" || (kind === "video" && videoFrame));
  const localUrl = useObjectUrl(localFile, wantsLocalUrl);
  const mediaUrl = localUrl ?? safeUrl;
  const thumbSrc = !showThumbnail
    ? undefined
    : (getSafeUrl(thumbnailUrl) ?? (kind === "image" ? mediaUrl : undefined));
  const videoSrc =
    showThumbnail && videoFrame && kind === "video" && !thumbSrc ? mediaUrl : undefined;
  const uploadState = upload === true ? {} : upload || undefined;
  const isUploading = Boolean(uploadState);
  const hasError = Boolean(error);
  const busy = isUploading || hasError;
  const isGrid = layout === "grid";
  const isCompact = layout === "compact";
  // En contenedores angostos, la lista agrupa sus acciones como la compacta.
  const dense = isCompact || (narrow && !isGrid);
  const setRootRef = (node: HTMLDivElement | null) => {
    narrowRef(node);
    assignRef(ref, node);
  };

  if (skeleton) {
    return (
      <CnDocCardSkeleton
        layout={layout}
        variant={variant}
        selectable={selectable}
        draggable={draggable}
        status={Boolean(status)}
        tags={tags?.length ? Math.min(tags.length, maxTags) : 0}
        description={Boolean(description)}
        actions={hideActions ? 0 : isGrid ? 1 : isCompact ? 2 : 3}
        sx={sx}
        className={className}
      />
    );
  }

  const canPreview = previewable && !busy && Boolean(onPreview || safeUrl);
  const canDownload = (downloadable ?? Boolean(onDownload || safeUrl || localFile)) && !busy;
  const usesViewer = viewer && (kind === "image" || kind === "video" || kind === "audio");
  // Sin vista previa propia ni visor, el nombre es un enlace real a la URL.
  const nameHref =
    !onClick && !onPreview && !usesViewer && canPreview && !disabled ? safeUrl : undefined;

  const handlePreview = () => {
    if (onPreview) {
      onPreview();
      return;
    }
    if (!safeUrl) return;
    if (usesViewer) setViewer(kind === "image" ? "image" : "media");
    else window.open(safeUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    if (localFile) downloadFile(localFile);
    else if (safeUrl) downloadFile({ id: name, url: safeUrl, name, mime, size });
  };

  const primary =
    disabled || busy || nameHref
      ? undefined
      : (onClick ?? (canPreview ? handlePreview : undefined));
  const interactive = Boolean(primary || nameHref);

  const statusConfig: CnDocCardStatus | undefined =
    typeof status === "string" ? { label: status, color: "neutral" } : status;

  const formattedDate =
    updatedAt !== undefined ? (formatDate ? formatDate(updatedAt) : formatDocDate(updatedAt)) : "";
  const author = authorName(updatedBy);

  const metaParts: ReactNode[] = [];
  if (!isGrid || !isUploading) {
    if (typeof size === "number") metaParts.push(formatBytes(size));
    if (pages) metaParts.push(`${pages} ${pages === 1 ? "página" : "páginas"}`);
    if (formattedDate) metaParts.push(formattedDate);
    if (author && !dense) metaParts.push(`${labels.by} ${author}`);
  }
  if (meta) metaParts.push(meta);

  // ─── Menú "más" ──────────────────────────────────────────────────────
  type MenuEntry = CnDocCardMenuAction & { key: string };
  const builtIns: MenuEntry[] = [];
  if (isGrid || dense) {
    if (canPreview && !isCompact)
      builtIns.push({
        key: "preview",
        label: labels.preview,
        icon: "visibility",
        onClick: handlePreview,
      });
    if (canDownload && isGrid)
      builtIns.push({
        key: "download",
        label: labels.download,
        icon: "download",
        onClick: handleDownload,
      });
    if (onShare && !busy)
      builtIns.push({ key: "share", label: labels.share, icon: "share", onClick: onShare });
  }
  const menuEntries: MenuEntry[] = [
    ...builtIns,
    ...menuActions.map((action, i) => ({ ...action, key: action.key ?? `action-${i}` })),
  ];

  const openMenu = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const iconAction = (
    key: string,
    icon: string,
    label: string,
    handler: () => void,
    overlay = false,
  ) => (
    <CnButton
      key={key}
      iconOnly
      icon={icon}
      size="small"
      variant="text"
      color="neutral"
      aria-label={`${label} ${name}`}
      tooltip
      tooltipProps={{ title: label }}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        handler();
      }}
      sx={overlay ? { width: 30, height: 30 } : undefined}
    />
  );

  const removeButton = onRemove
    ? iconAction("remove", "close", labels.remove, onRemove, isGrid)
    : null;

  const moreButton =
    menuEntries.length > 0 ? (
      <CnButton
        iconOnly
        icon="more_vert"
        size="small"
        variant="text"
        color="neutral"
        aria-label={`${labels.more} ${name}`}
        aria-haspopup="menu"
        aria-expanded={menuAnchor ? true : undefined}
        disabled={disabled}
        onClick={openMenu}
      />
    ) : null;

  const actionsNode = hideActions ? null : (
    <Box
      data-cn-doc-actions
      onClick={(event) => event.stopPropagation()}
      sx={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        gap: "2px",
        flexShrink: 0,
      }}
    >
      {extraActions}
      {!isGrid &&
        canPreview &&
        !dense &&
        iconAction("preview", "visibility", labels.preview, handlePreview)}
      {!isGrid &&
        canDownload &&
        iconAction("download", "download", labels.download, handleDownload)}
      {!isGrid && !dense && onShare && !busy && iconAction("share", "share", labels.share, onShare)}
      {moreButton}
      {removeButton}
    </Box>
  );

  const checkbox = selectable ? (
    <Checkbox
      size="small"
      checked={selected}
      disabled={disabled}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onSelectedChange?.(event.target.checked)}
      inputProps={{ "aria-label": labels.select(name) }}
      sx={{
        position: "relative",
        zIndex: 2,
        p: "4px",
        ...(isGrid && {
          position: "absolute",
          top: 6,
          left: 6,
          backgroundColor: "rgba(255,255,255,0.92)",
          borderRadius: "var(--cn-radius-sm, 6px)",
          "&:hover": { backgroundColor: "#fff" },
        }),
      }}
    />
  ) : null;

  const dragNode = draggable ? (
    <Box
      data-cn-doc-drag-handle
      aria-label="Arrastrar para reordenar"
      {...dragHandleProps}
      sx={{
        position: "relative",
        zIndex: 1,
        display: "grid",
        placeItems: "center",
        color: "var(--cn-color-text-subtle, #9aa1aa)",
        cursor: "grab",
        "&:active": { cursor: "grabbing" },
        ...(isGrid && { position: "absolute", top: 8, left: selectable ? 40 : 8 }),
      }}
    >
      <CnIcon name="drag_indicator" size={18} color="inherit" />
    </Box>
  ) : null;

  const linkProps = nameHref
    ? { component: "a", href: nameHref, target: "_blank", rel: "noopener noreferrer" }
    : primary
      ? { component: "button", type: "button", onClick: primary }
      : { component: "div" };
  const nameNode = (
    <Typography
      id={nameId}
      {...(linkProps as Record<string, unknown>)}
      title={name}
      sx={{
        all: interactive ? "unset" : undefined,
        display: isGrid ? "-webkit-box" : "block",
        maxWidth: "100%",
        fontFamily: "inherit",
        fontSize: isCompact ? "var(--cn-font-size-sm, 12px)" : "var(--cn-font-size-base, 13px)",
        fontWeight: "var(--cn-font-weight-semibold, 600)",
        color: "var(--cn-color-text, #222831)",
        lineHeight: 1.35,
        overflow: "hidden",
        textOverflow: "ellipsis",
        overflowWrap: isGrid ? "anywhere" : undefined,
        whiteSpace: isGrid ? "normal" : "nowrap",
        ...(isGrid && { WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }),
        ...(interactive && {
          cursor: "pointer",
          // Enlace "estirado": toda la tarjeta responde al clic del nombre.
          "&::after": { content: '""', position: "absolute", inset: 0, zIndex: 0 },
          "&:focus-visible": { outline: "none", textDecoration: "underline" },
        }),
      }}
    >
      {name}
    </Typography>
  );

  const versionNode =
    version !== undefined ? (
      <CnChip
        label={typeof version === "number" ? `v${version}` : version}
        size="small"
        variant="soft"
        color="neutral"
        compact
      />
    ) : null;

  const statusNode = statusConfig ? (
    <CnChip
      label={statusConfig.label}
      color={statusConfig.color ?? "neutral"}
      icon={statusConfig.icon}
      variant="soft"
      size="small"
      title={typeof statusConfig.label === "string" ? statusConfig.label : undefined}
      sx={{ maxWidth: "100%" }}
    />
  ) : null;

  const metaNode =
    metaParts.length > 0 ? (
      <Typography
        component="div"
        data-cn-doc-meta
        sx={{
          fontSize: "var(--cn-font-size-xs, 11px)",
          color: "var(--cn-color-text-muted, #6e7682)",
          lineHeight: 1.45,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {metaParts.map((part, i) => (
          <Box component="span" key={i}>
            {i > 0 && " · "}
            {part}
          </Box>
        ))}
      </Typography>
    ) : null;

  const visibleTags = tags?.slice(0, maxTags) ?? [];
  const hiddenTags = (tags?.length ?? 0) - visibleTags.length;
  const tagsNode =
    visibleTags.length > 0 && !isCompact ? (
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px", mt: "6px" }}>
        {visibleTags.map((tag) => (
          <CnChip key={tag} label={tag} size="small" variant="outlined" color="neutral" compact />
        ))}
        {hiddenTags > 0 && (
          <CnChip
            label={`+${hiddenTags}`}
            size="small"
            variant="soft"
            color="neutral"
            compact
            title={tags?.slice(maxTags).join(", ")}
          />
        )}
      </Box>
    ) : null;

  const progress = uploadState?.progress;
  const uploadNode = uploadState ? (
    <Box data-cn-doc-upload sx={{ mt: isCompact ? "4px" : "8px", position: "relative", zIndex: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <LinearProgress
          variant={typeof progress === "number" ? "determinate" : "indeterminate"}
          value={typeof progress === "number" ? Math.max(0, Math.min(100, progress)) : undefined}
          aria-label={`${labels.progress}: ${name}`}
          sx={{ flex: 1, height: 4, borderRadius: 2 }}
        />
        {uploadState.onCancel && (
          <CnButton
            iconOnly
            icon="close"
            size="small"
            variant="text"
            color="neutral"
            aria-label={`${labels.cancelUpload} ${name}`}
            onClick={(event) => {
              event.stopPropagation();
              uploadState.onCancel?.();
            }}
            sx={{ width: 22, height: 22 }}
          />
        )}
      </Box>
      <Typography
        component="div"
        aria-live="polite"
        sx={{
          fontSize: "var(--cn-font-size-xs, 11px)",
          color: "var(--cn-color-text-muted, #6e7682)",
          mt: "2px",
        }}
      >
        {uploadState.label ?? labels.uploading}
        {typeof progress === "number" && ` ${Math.round(progress)} %`}
      </Typography>
    </Box>
  ) : null;

  const errorNode = hasError ? (
    <Box
      data-cn-doc-error
      role="alert"
      sx={{
        mt: isCompact ? "2px" : "6px",
        position: "relative",
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "6px",
        fontSize: "var(--cn-font-size-xs, 11px)",
        color: "var(--cn-color-error-600, #b52f2f)",
      }}
    >
      <Box component="span" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
        {error === true ? labels.error : error}
      </Box>
      {onRetry && (
        <CnButton
          aria-label={`${labels.retry} ${name}`}
          size="small"
          variant="text"
          color="error"
          startIcon="replay"
          onClick={(event) => {
            event.stopPropagation();
            onRetry();
          }}
          sx={{ minWidth: 0, px: "4px", py: 0 }}
        >
          {labels.retry}
        </CnButton>
      )}
    </Box>
  ) : null;

  const rootSx: SxProps<Theme> = [
    {
      height: isGrid ? "100%" : "auto",
      transition:
        "border-color var(--cn-duration-fast, 140ms) ease, box-shadow var(--cn-duration-fast, 140ms) ease, background-color var(--cn-duration-fast, 140ms) ease",
      ...(interactive && {
        cursor: "pointer",
        "&:hover": {
          borderColor: "var(--cn-color-border-strong, #c5cad0)",
          boxShadow: "var(--cn-shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.06))",
        },
        "&:focus-within:has(button:focus-visible, a:focus-visible)": {
          boxShadow: "var(--cn-shadow-focus, 0 0 0 3px rgba(80, 129, 196, 0.35))",
        },
      }),
      ...(selected && {
        borderColor: "var(--cn-color-brand-500, #3562a6)",
        backgroundColor: "rgba(var(--cn-color-rgb-brand-500, 53, 98, 166), 0.05)",
        boxShadow: "0 0 0 1px var(--cn-color-brand-500, #3562a6)",
      }),
      ...(hasError && {
        borderColor: "rgba(var(--cn-color-rgb-error-500, 214, 60, 60), 0.5)",
      }),
    },
    ...(Array.isArray(sx) ? sx : [sx]),
  ];

  let content: ReactNode;
  if (isGrid) {
    content = (
      <>
        <Box
          sx={{
            position: "relative",
            aspectRatio: "4 / 3",
            borderBottom: "1px solid var(--cn-color-border-subtle, #e9ecef)",
          }}
        >
          <FileThumb
            kind={kind}
            name={name}
            src={thumbSrc}
            videoSrc={videoSrc}
            size="fill"
            error={hasError}
          />
          {checkbox}
          {dragNode}
          {!hideActions && (moreButton || extraActions || removeButton) && (
            <Box
              onClick={(event) => event.stopPropagation()}
              sx={{
                position: "absolute",
                zIndex: 2,
                top: 6,
                right: 6,
                display: "flex",
                gap: "2px",
                borderRadius: "var(--cn-radius-md, 8px)",
                backgroundColor: "rgba(255,255,255,0.92)",
              }}
            >
              {extraActions}
              {moreButton}
              {removeButton}
            </Box>
          )}
          {statusNode && (
            <Box
              sx={{ position: "absolute", left: 8, right: 8, bottom: 8, zIndex: 1, minWidth: 0 }}
            >
              {statusNode}
            </Box>
          )}
        </Box>
        <Box
          sx={{
            p: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            minWidth: 0,
            flex: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: "6px", minWidth: 0 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>{nameNode}</Box>
            {versionNode}
          </Box>
          {metaNode}
          {description && (
            <Typography
              component="div"
              sx={{
                fontSize: "var(--cn-font-size-xs, 11px)",
                color: "var(--cn-color-text-muted, #6e7682)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                mt: "2px",
              }}
            >
              {description}
            </Typography>
          )}
          {tagsNode}
          {uploadNode}
          {errorNode}
          {updatedBy && typeof updatedBy === "object" && !isUploading && (
            <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mt: "8px" }}>
              <CnAvatar size="xs" src={updatedBy.avatarUrl} name={updatedBy.name} />
              <Typography
                sx={{
                  fontSize: "var(--cn-font-size-xs, 11px)",
                  color: "var(--cn-color-text-muted, #6e7682)",
                }}
              >
                {updatedBy.name}
              </Typography>
            </Box>
          )}
        </Box>
      </>
    );
  } else {
    content = (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: dense ? "8px" : "12px",
          px: dense ? "8px" : "12px",
          py: isCompact ? "6px" : "10px",
          minWidth: 0,
        }}
      >
        {dragNode}
        {checkbox}
        <FileThumb
          kind={kind}
          name={name}
          src={thumbSrc}
          videoSrc={videoSrc}
          size={isCompact ? 28 : narrow ? 36 : 44}
          error={hasError}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
            <Box sx={{ minWidth: 0, flex: "0 1 auto" }}>{nameNode}</Box>
            {versionNode}
          </Box>
          {!isCompact && metaNode}
          {!isCompact && narrow && statusNode && <Box sx={{ mt: "4px" }}>{statusNode}</Box>}
          {!isCompact && description && (
            <Typography
              component="div"
              sx={{
                fontSize: "var(--cn-font-size-xs, 11px)",
                color: "var(--cn-color-text-muted, #6e7682)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                mt: "2px",
              }}
            >
              {description}
            </Typography>
          )}
          {tagsNode}
          {uploadNode}
          {errorNode}
        </Box>
        {isCompact && !narrow && metaParts.length > 0 && (
          <Box sx={{ flexShrink: 1, minWidth: 0, maxWidth: "40%" }}>{metaNode}</Box>
        )}
        {statusNode && !narrow && (
          <Box sx={{ flexShrink: 1, minWidth: 0, maxWidth: "30%", display: "flex" }}>
            {statusNode}
          </Box>
        )}
        {actionsNode}
      </Box>
    );
  }

  return (
    <>
      <CnCard
        ref={setRootRef}
        component="article"
        variant={variant}
        padding="none"
        disabled={disabled}
        className={className}
        ariaLabelledBy={nameId}
        cardProps={{ "data-cn-doc-card": layout, "data-kind": kind } as Record<string, unknown>}
        sx={rootSx}
      >
        {content}
      </CnCard>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        onClick={(event) => event.stopPropagation()}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 180 } } }}
      >
        {menuEntries.map((entry) => (
          <MenuItem
            key={entry.key}
            disabled={entry.disabled}
            onClick={() => {
              setMenuAnchor(null);
              entry.onClick();
            }}
            sx={{
              fontSize: "var(--cn-font-size-sm, 13px)",
              ...(entry.danger && { color: "var(--cn-color-error-600, #b52f2f)" }),
            }}
          >
            {entry.icon && (
              <ListItemIcon sx={{ color: "inherit", minWidth: "30px !important" }}>
                <CnIcon name={entry.icon} size={18} color="inherit" />
              </ListItemIcon>
            )}
            <ListItemText primaryTypographyProps={{ fontSize: "inherit" }}>
              {entry.label}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {viewerOpen === "image" && safeUrl && (
        <CnImageViewer images={[safeUrl]} index={0} onClose={() => setViewer(null)} />
      )}
      {viewerOpen === "media" && safeUrl && (
        <FileLightbox
          files={[{ id: name, url: safeUrl, name, mime, size }]}
          index={0}
          previews={new Map()}
          describe={() =>
            [kindMeta.label, typeof size === "number" ? formatBytes(size) : null]
              .filter(Boolean)
              .join(" · ")
          }
          downloadable={canDownload}
          onClose={() => setViewer(null)}
          onNavigate={() => undefined}
        />
      )}
    </>
  );
});

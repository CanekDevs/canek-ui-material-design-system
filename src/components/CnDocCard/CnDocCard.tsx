import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import LinearProgress from "@mui/material/LinearProgress";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { HTMLAttributes, MouseEvent, ReactNode } from "react";
import { forwardRef, useId, useState } from "react";
import { formatBytes } from "../../utils/number-utils";
import { CnAvatar } from "../CnAvatar";
import { CnButton } from "../CnButton";
import type { CnCardVariant } from "../CnCard";
import { CnCard } from "../CnCard";
import type { CnChipColor } from "../CnChip";
import { CnChip } from "../CnChip";
import { CnImageViewer } from "../CnDataTable/cells";
import { downloadFile, FileLightbox } from "../CnFileField/FileLightbox";
import type { CnExistingFile } from "../CnFileField/file-utils";
import { getSafeUrl } from "../CnFileField/file-utils";
import { CnIcon } from "../CnIcon";
import { CnDocCardSkeleton } from "./CnDocCardSkeleton";
import type { CnDocKind } from "./doc-utils";
import { DOC_KIND_META, extensionLabel, formatDocDate, getDocKind } from "./doc-utils";

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
  name: string;
  /** URL del archivo (descarga y vista previa por defecto). */
  url?: string;
  mime?: string;
  /** Tamaño en bytes. */
  size?: number;
  /** Miniatura (portada del PDF, póster del video…). Las imágenes usan `url` si no se indica. */
  thumbnailUrl?: string;
  /** Fuerza el tipo (si no, se deduce de `mime` / extensión). */
  kind?: CnDocKind;
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
  /** Descarga propia (por defecto descarga `url`). */
  onDownload?: () => void;
  downloadable?: boolean;
  onShare?: () => void;
  /** Acciones adicionales del menú "más". */
  menuActions?: CnDocCardMenuAction[];
  /** Nodos extra en la zona de acciones. */
  extraActions?: ReactNode;
  hideActions?: boolean;

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
  download: "Descargar",
  share: "Compartir",
  more: "Más acciones",
  select: (name) => `Seleccionar ${name}`,
  uploading: "Subiendo…",
  cancelUpload: "Cancelar subida",
  retry: "Reintentar",
  error: "No se pudo procesar el archivo",
  by: "por",
};

const authorName = (author: CnDocCardAuthor | undefined) =>
  !author ? undefined : typeof author === "string" ? author : author.name;

/** Miniatura o ícono por tipo. */
const DocThumb = ({
  kind,
  name,
  src,
  size,
  large = false,
  error = false,
}: {
  kind: CnDocKind;
  name: string;
  src?: string;
  size: number;
  large?: boolean;
  error?: boolean;
}) => {
  const [failed, setFailed] = useState(false);
  const meta = DOC_KIND_META[kind];
  const ext = extensionLabel(name);
  const showImage = Boolean(src) && !failed && !error;

  return (
    <Box
      data-cn-doc-thumb={kind}
      aria-hidden
      sx={{
        position: "relative",
        width: large ? "100%" : size,
        height: large ? "100%" : size,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        borderRadius: large ? 0 : "var(--cn-radius-md, 8px)",
        color: error ? "var(--cn-color-error-600, #b52f2f)" : meta.color,
        backgroundColor: error
          ? "rgba(var(--cn-color-rgb-error-500, 214, 60, 60), 0.08)"
          : "var(--cn-color-neutral-100, #f4f5f7)",
        backgroundImage: showImage
          ? undefined
          : `linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.4) 100%)`,
      }}
    >
      {showImage ? (
        <Box
          component="img"
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <CnIcon
            name={error ? "error_outline" : meta.icon}
            size={large ? 44 : Math.round(size * 0.55)}
            color="inherit"
          />
          {large && ext && !error && (
            <Box
              component="span"
              sx={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "inherit",
                opacity: 0.85,
              }}
            >
              {ext}
            </Box>
          )}
        </Box>
      )}
      {showImage && kind === "video" && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "#fff",
            background: "rgba(0,0,0,0.25)",
          }}
        >
          <CnIcon name="play_circle" size={large ? 40 : 18} color="inherit" />
        </Box>
      )}
    </Box>
  );
};

/**
 * Tarjeta de documento/archivo: ícono o miniatura por tipo, nombre, tamaño,
 * fecha y autor, estado, etiquetas, versión, acciones (ver, descargar,
 * compartir, más), selección, arrastre y estados de subida y error.
 */
export const CnDocCard = forwardRef<HTMLDivElement, CnDocCardProps>(function CnDocCard(
  {
    name,
    url,
    mime,
    size,
    thumbnailUrl,
    kind: kindProp,
    description,
    updatedAt,
    updatedBy,
    formatDate,
    status,
    tags,
    maxTags = 3,
    version,
    pages,
    meta,
    layout = "list",
    variant = "outlined",
    onClick,
    onPreview,
    previewable = true,
    onDownload,
    downloadable,
    onShare,
    menuActions = [],
    extraActions,
    hideActions = false,
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
  const kind = kindProp ?? getDocKind(name, mime);
  const kindMeta = DOC_KIND_META[kind];
  const nameId = useId();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [viewer, setViewer] = useState<"image" | "media" | null>(null);
  const safeUrl = getSafeUrl(url);
  const thumbSrc = getSafeUrl(thumbnailUrl) ?? (kind === "image" ? safeUrl : undefined);
  const uploadState = upload === true ? {} : upload || undefined;
  const isUploading = Boolean(uploadState);
  const hasError = Boolean(error);
  const busy = isUploading || hasError;
  const isGrid = layout === "grid";
  const isCompact = layout === "compact";

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
  const canDownload = (downloadable ?? Boolean(onDownload || safeUrl)) && !busy;

  const handlePreview = () => {
    if (onPreview) {
      onPreview();
      return;
    }
    if (!safeUrl) return;
    if (kind === "image") setViewer("image");
    else if (kind === "video" || kind === "audio") setViewer("media");
    else window.open(safeUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    if (safeUrl) downloadFile({ id: name, url: safeUrl, name, mime, size });
  };

  const primary =
    disabled || busy ? undefined : (onClick ?? (canPreview ? handlePreview : undefined));

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
    if (author && !isCompact) metaParts.push(`${labels.by} ${author}`);
  }
  if (meta) metaParts.push(meta);

  // ─── Menú "más" ──────────────────────────────────────────────────────
  type MenuEntry = CnDocCardMenuAction & { key: string };
  const builtIns: MenuEntry[] = [];
  if (isGrid || isCompact) {
    if (canPreview && isGrid)
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

  const iconAction = (key: string, icon: string, label: string, handler: () => void) => (
    <CnButton
      key={key}
      iconOnly
      icon={icon}
      size="small"
      variant="text"
      color="neutral"
      aria-label={label}
      tooltip
      tooltipProps={{ title: label }}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        handler();
      }}
    />
  );

  const moreButton =
    menuEntries.length > 0 ? (
      <CnButton
        iconOnly
        icon="more_vert"
        size="small"
        variant="text"
        color="neutral"
        aria-label={labels.more}
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
        !isCompact &&
        iconAction("preview", "visibility", labels.preview, handlePreview)}
      {!isGrid &&
        canDownload &&
        iconAction("download", "download", labels.download, handleDownload)}
      {!isGrid &&
        !isCompact &&
        onShare &&
        !busy &&
        iconAction("share", "share", labels.share, onShare)}
      {moreButton}
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

  const nameNode = (
    <Typography
      id={nameId}
      component={primary ? "button" : "div"}
      type={primary ? "button" : undefined}
      onClick={primary}
      title={name}
      sx={{
        all: primary ? "unset" : undefined,
        display: isGrid ? "-webkit-box" : "block",
        maxWidth: "100%",
        fontFamily: "inherit",
        fontSize: isCompact ? "var(--cn-font-size-sm, 12px)" : "var(--cn-font-size-base, 13px)",
        fontWeight: "var(--cn-font-weight-semibold, 600)",
        color: "var(--cn-color-text, #222831)",
        lineHeight: 1.35,
        overflow: "hidden",
        textOverflow: "ellipsis",
        wordBreak: isGrid ? "break-word" : undefined,
        whiteSpace: isGrid ? "normal" : "nowrap",
        ...(isGrid && { WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }),
        ...(primary && {
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
            {i > 0 && (
              <Box component="span" aria-hidden sx={{ mx: "5px" }}>
                ·
              </Box>
            )}
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
          aria-label={`${labels.uploading} ${name}`}
          sx={{ flex: 1, height: 4, borderRadius: 2 }}
        />
        {uploadState.onCancel && (
          <CnButton
            iconOnly
            icon="close"
            size="small"
            variant="text"
            color="neutral"
            aria-label={labels.cancelUpload}
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
      <span>{error === true ? labels.error : error}</span>
      {onRetry && (
        <CnButton
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
      ...(primary && {
        cursor: "pointer",
        "&:hover": {
          borderColor: "var(--cn-color-border-strong, #c5cad0)",
          boxShadow: "var(--cn-shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.06))",
        },
        "&:focus-within:has(button:focus-visible)": {
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
          <DocThumb kind={kind} name={name} src={thumbSrc} size={0} large error={hasError} />
          {checkbox}
          {dragNode}
          {!hideActions && (moreButton || extraActions) && (
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
            </Box>
          )}
          {statusNode && (
            <Box sx={{ position: "absolute", left: 8, bottom: 8, zIndex: 1 }}>{statusNode}</Box>
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
          gap: isCompact ? "8px" : "12px",
          px: isCompact ? "8px" : "12px",
          py: isCompact ? "6px" : "10px",
          minWidth: 0,
        }}
      >
        {dragNode}
        {checkbox}
        <DocThumb
          kind={kind}
          name={name}
          src={thumbSrc}
          size={isCompact ? 28 : 44}
          error={hasError}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
            <Box sx={{ minWidth: 0, flex: "0 1 auto" }}>{nameNode}</Box>
            {versionNode}
          </Box>
          {!isCompact && metaNode}
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
        {isCompact && metaParts.length > 0 && (
          <Box sx={{ display: { xs: "none", sm: "block" }, flexShrink: 0, maxWidth: "40%" }}>
            {metaNode}
          </Box>
        )}
        {statusNode && (
          <Box sx={{ flexShrink: 0, display: { xs: "none", sm: "block" } }}>{statusNode}</Box>
        )}
        {actionsNode}
      </Box>
    );
  }

  return (
    <>
      <CnCard
        ref={ref}
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

      {viewer === "image" && safeUrl && (
        <CnImageViewer images={[safeUrl]} index={0} onClose={() => setViewer(null)} />
      )}
      {viewer === "media" && safeUrl && (
        <FileLightbox
          files={[{ id: name, url: safeUrl, name, mime, size } satisfies CnExistingFile]}
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

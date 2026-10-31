import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import AudioFileOutlinedIcon from "@mui/icons-material/AudioFileOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import FolderZipOutlinedIcon from "@mui/icons-material/FolderZipOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import MovieOutlinedIcon from "@mui/icons-material/MovieOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import PlayCircleFilledWhiteOutlinedIcon from "@mui/icons-material/PlayCircleFilledWhiteOutlined";
import ReplayIcon from "@mui/icons-material/Replay";
import SlideshowOutlinedIcon from "@mui/icons-material/SlideshowOutlined";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from "@mui/material/Tooltip";
import type { ClipboardEvent, DragEvent, KeyboardEvent, ReactNode, Ref } from "react";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { groupLegendSx, helperTextSx, mergeSx } from "../../utils/field-styles";
import { formatBytes } from "../../utils/number-utils";
import { moveArrayItem, useSortableList } from "../../utils/use-sortable-list";
import { CnButton } from "../CnButton";
import { downloadFile, FileLightbox, isViewableFile } from "./FileLightbox";
import type {
  CnExistingFile,
  CnFileKind,
  CnFileMetadata,
  CnFileRejection,
  CnFileStatus,
  CnFileValue,
  CnImageConstraints,
} from "./file-utils";
import {
  checkImageConstraints,
  fileKey,
  formatDuration,
  getFileKind,
  getSafeUrl,
  isFile,
  matchesAccept,
  readFileMetadata,
} from "./file-utils";

/**
 * - `dropzone`: zona de arrastre + lista (por defecto).
 * - `button`: botón + lista.
 * - `compact`: chips en línea, para formularios densos.
 * - `grid`: galería de miniaturas cuadradas (fotos).
 * - `card`: tarjetas con vista previa grande y metadatos.
 * - `avatar`: una sola imagen circular (foto de perfil).
 */
export type CnFileFieldVariant = "dropzone" | "button" | "compact" | "grid" | "card" | "avatar";

export type CnFileFieldProps = CnFieldBaseProps<CnFileValue[]> & {
  variant?: CnFileFieldVariant;
  /** Igual que el atributo HTML `accept` (".pdf,image/*"). */
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  /** Tamaño máximo por archivo, en MB. */
  maxSize?: number;
  /** Tamaño máximo sumando todos los archivos, en MB. */
  maxTotalSize?: number;
  /** Restricciones de dimensiones para imágenes (se verifican al agregarlas). */
  imageConstraints?: CnImageConstraints;
  /** Muestra miniaturas de imágenes y videos. */
  showPreviews?: boolean;
  /** Muestra dimensiones, duración o páginas. */
  showMetadata?: boolean;
  /** Permite reordenar (arrastrando el asa o con las flechas del teclado). */
  reorderable?: boolean;
  /** Marca el primer archivo como principal y permite elegir otro (grid / card). */
  showPrimary?: boolean;
  primaryLabel?: string;
  /** Abre un visor al hacer clic en imágenes, video, audio y PDF. */
  enableLightbox?: boolean;
  /** Botón de descarga en cada archivo y en el visor. */
  downloadable?: boolean;
  /** Pegar archivos con Ctrl+V cuando el campo tiene el foco. */
  allowPaste?: boolean;
  /** En móviles abre directamente la cámara (`user` frontal, `environment` trasera). */
  capture?: "user" | "environment";
  /** Tamaño de miniatura en px (grid, avatar). */
  thumbnailSize?: number;
  /** Estado de subida de cada archivo (progreso, éxito o error). */
  fileStatus?: (file: CnFileValue, index: number) => CnFileStatus | undefined;
  onRetry?: (file: CnFileValue, index: number) => void;
  /** Se llama con los archivos recién aceptados (para iniciar su subida). */
  onFilesAdded?: (files: File[]) => void;
  /** Se llama al quitar un archivo existente (para eliminarlo en el servidor). */
  onRemoveExisting?: (file: CnExistingFile) => void;
  onReject?: (rejections: CnFileRejection[]) => void;
  /** Acciones propias por archivo (se agregan junto a las estándar). */
  renderFileActions?: (file: CnFileValue, index: number) => ReactNode;
  dropzoneText?: string;
  buttonLabel?: string;
};

// ─── Utilidades de presentación ─────────────────────────────────────────

const KIND_ICONS: Record<CnFileKind, { icon: typeof InsertDriveFileOutlinedIcon; color: string }> =
  {
    image: { icon: ImageOutlinedIcon, color: "var(--cn-color-info-500, #2f7dc4)" },
    video: { icon: MovieOutlinedIcon, color: "var(--cn-color-accent-500, #3d5afe)" },
    audio: { icon: AudioFileOutlinedIcon, color: "var(--cn-color-warning-600, #b8831a)" },
    pdf: { icon: PictureAsPdfOutlinedIcon, color: "var(--cn-color-error-500, #d63c3c)" },
    document: { icon: DescriptionOutlinedIcon, color: "var(--cn-color-brand-500, #3562a6)" },
    spreadsheet: { icon: TableChartOutlinedIcon, color: "var(--cn-color-success-600, #228740)" },
    presentation: { icon: SlideshowOutlinedIcon, color: "var(--cn-color-warning-600, #b8831a)" },
    archive: { icon: FolderZipOutlinedIcon, color: "var(--cn-color-neutral-600, #4e5660)" },
    text: { icon: ArticleOutlinedIcon, color: "var(--cn-color-neutral-600, #4e5660)" },
    other: { icon: InsertDriveFileOutlinedIcon, color: "var(--cn-color-neutral-500, #6e7682)" },
  };

const KindIcon = ({ file, size = 20 }: { file: CnFileValue; size?: number }) => {
  const { icon: Icon, color } = KIND_ICONS[getFileKind(file)];
  return <Icon sx={{ fontSize: size, color }} />;
};

const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;

const overlayButtonSx = {
  width: 26,
  height: 26,
  color: "#fff",
  backgroundColor: "rgba(17, 20, 24, 0.6)",
  "&:hover": { backgroundColor: "rgba(17, 20, 24, 0.8)" },
} as const;

const ellipsisSx = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;
const mutedTextSx = {
  fontSize: "var(--cn-font-size-xs, 11px)",
  color: "var(--cn-color-text-muted, #6e7682)",
} as const;

/** Object URLs para previsualizar imágenes y videos locales (se liberan solos). */
const usePreviewUrls = (files: CnFileValue[], enabled: boolean): Map<string, string> => {
  const [urls, setUrls] = useState<Map<string, string>>(() => new Map());
  const cacheRef = useRef<Map<File, string>>(new Map());

  useEffect(() => {
    if (!enabled) return;
    const cache = cacheRef.current;
    const next = new Map<string, string>();
    const alive = new Set<File>();
    for (const file of files) {
      const kind = getFileKind(file);
      if (kind !== "image" && kind !== "video") continue;
      if (isFile(file)) {
        alive.add(file);
        let url = cache.get(file);
        if (!url && typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
          url = URL.createObjectURL(file);
          cache.set(file, url);
        }
        if (url) next.set(fileKey(file), url);
      } else {
        const safe = getSafeUrl(kind === "image" ? (file.thumbnailUrl ?? file.url) : file.url);
        if (safe) next.set(fileKey(file), safe);
      }
    }
    for (const [file, url] of cache) {
      if (!alive.has(file)) {
        URL.revokeObjectURL?.(url);
        cache.delete(file);
      }
    }
    setUrls(next);
  }, [enabled, files]);

  useEffect(
    () => () => {
      for (const url of cacheRef.current.values()) URL.revokeObjectURL?.(url);
      cacheRef.current.clear();
    },
    [],
  );

  return urls;
};

/** Metadatos (dimensiones, duración, páginas) leídos en segundo plano. */
const useFileMetadata = (files: CnFileValue[], enabled: boolean) => {
  const [metadata, setMetadata] = useState<Map<string, CnFileMetadata>>(() => new Map());
  const pendingRef = useRef(new Set<string>());
  const doneRef = useRef(new Set<string>());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    for (const file of files) {
      const key = fileKey(file);
      if (!isFile(file) || doneRef.current.has(key) || pendingRef.current.has(key)) continue;
      pendingRef.current.add(key);
      // No se cancela por re-render: la lectura es idempotente y se guarda por clave.
      void readFileMetadata(file).then((info) => {
        pendingRef.current.delete(key);
        doneRef.current.add(key);
        // Sin datos útiles no hace falta volver a renderizar.
        if (
          mountedRef.current &&
          Object.keys(info).some((k) => info[k as keyof CnFileMetadata] !== undefined)
        ) {
          setMetadata((prev) => new Map(prev).set(key, info));
        }
      });
    }
  }, [enabled, files]);

  const remember = (file: File, info: CnFileMetadata) => {
    doneRef.current.add(fileKey(file));
    setMetadata((prev) => new Map(prev).set(fileKey(file), info));
  };

  const get = (file: CnFileValue): CnFileMetadata =>
    isFile(file)
      ? (metadata.get(fileKey(file)) ?? {})
      : { width: file.width, height: file.height, duration: file.duration, pages: file.pages };

  return { get, remember };
};

const EMPTY: CnFileValue[] = [];

// ─── Componente ─────────────────────────────────────────────────────────

export const CnFileField = forwardRef<HTMLDivElement, CnFileFieldProps>(function CnFileField(
  {
    id,
    name,
    label,
    helperText,
    error,
    required,
    disabled,
    readOnly,
    value,
    defaultValue,
    onChange,
    onBlur,
    rules,
    formValues,
    sectionContext,
    validateOnChange,
    validateOnBlur,
    debounceMs,
    internalValidation,
    reserveHelperSpace,
    sx,
    className,
    variant = "dropzone",
    accept,
    multiple: multipleProp = false,
    maxFiles,
    maxSize,
    maxTotalSize,
    imageConstraints,
    showPreviews = true,
    showMetadata = true,
    reorderable = false,
    showPrimary,
    primaryLabel = "Principal",
    enableLightbox = true,
    downloadable = true,
    allowPaste = true,
    capture,
    thumbnailSize = 112,
    fileStatus,
    onRetry,
    onFilesAdded,
    onRemoveExisting,
    onReject,
    renderFileActions,
    dropzoneText,
    buttonLabel = "Seleccionar archivo",
  },
  ref,
) {
  const isAvatar = variant === "avatar";
  const isGallery = variant === "grid" || variant === "card";
  const isList = variant === "dropzone" || variant === "button";
  const multiple = isAvatar ? false : multipleProp;
  const effectiveAccept = accept ?? (isAvatar ? "image/*" : undefined);
  const [current, setCurrent] = useControllableValue<CnFileValue[]>(
    value,
    defaultValue,
    EMPTY,
    onChange,
  );
  const files = Array.isArray(current) ? current : EMPTY;
  const [rejections, setRejections] = useState<CnFileRejection[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previews = usePreviewUrls(files, showPreviews || isAvatar || isGallery);
  const meta = useFileMetadata(files, showMetadata);
  const blocked = Boolean(disabled || readOnly);
  const limit = multiple ? maxFiles : 1;
  const primaryEnabled =
    (showPrimary ?? (reorderable && isGallery)) && multiple && files.length > 1;

  const control = useFieldControl(files, {
    id,
    rules,
    formValues,
    sectionContext,
    validateOnChange,
    validateOnBlur,
    debounceMs: debounceMs ?? 0,
    internalValidation,
    error,
    helperText,
    reserveHelperSpace,
  });

  const commit = (next: CnFileValue[]) => {
    control.markChanged();
    setCurrent(next);
    onBlur?.();
  };

  const sortable = useSortableList({
    count: files.length,
    disabled: blocked || !reorderable,
    axis: isGallery ? "grid" : "y",
    getItemLabel: (index) => files[index]?.name ?? `Archivo ${index + 1}`,
    onMove: (from, to) => commit(moveArrayItem(files, from, to)),
  });

  const sizeOf = (file: CnFileValue) => (isFile(file) ? file.size : (file.size ?? 0));
  const totalSize = files.reduce((sum, file) => sum + sizeOf(file), 0);

  const addFiles = async (incoming: File[]) => {
    if (blocked || incoming.length === 0) return;
    const rejected: CnFileRejection[] = [];
    const accepted: File[] = [];
    setBusy(true);
    try {
      for (const file of incoming) {
        if (!matchesAccept(file, effectiveAccept)) {
          rejected.push({
            name: file.name,
            reason: "type",
            message: `${file.name}: tipo de archivo no permitido`,
          });
          continue;
        }
        if (maxSize !== undefined && file.size > maxSize * 1024 * 1024) {
          rejected.push({
            name: file.name,
            reason: "size",
            message: `${file.name}: supera el máximo de ${maxSize} MB (${formatBytes(file.size)})`,
          });
          continue;
        }
        if (files.some((existing) => fileKey(existing) === fileKey(file))) continue;
        if (imageConstraints && getFileKind(file) === "image") {
          const info = await readFileMetadata(file);
          meta.remember(file, info);
          const problem = checkImageConstraints(info, imageConstraints);
          if (problem) {
            rejected.push({
              name: file.name,
              reason: "dimensions",
              message: `${file.name}: ${problem}`,
            });
            continue;
          }
        }
        accepted.push(file);
      }
    } finally {
      setBusy(false);
    }

    let added: File[] = multiple ? accepted : accepted.slice(0, 1);
    if (multiple && limit !== undefined && files.length + added.length > limit) {
      const room = Math.max(0, limit - files.length);
      rejected.push(
        ...added.slice(room).map((file) => ({
          name: file.name,
          reason: "count" as const,
          message: `${file.name}: se permite un máximo de ${limit} ${limit === 1 ? "archivo" : "archivos"}`,
        })),
      );
      added = added.slice(0, room);
    }
    if (maxTotalSize !== undefined) {
      let running = multiple ? totalSize : 0;
      added = added.filter((file) => {
        if (running + file.size > maxTotalSize * 1024 * 1024) {
          rejected.push({
            name: file.name,
            reason: "totalSize",
            message: `${file.name}: se superaría el total permitido de ${maxTotalSize} MB`,
          });
          return false;
        }
        running += file.size;
        return true;
      });
    }

    setRejections(rejected);
    if (rejected.length > 0) onReject?.(rejected);
    if (added.length === 0) return;
    if (!multiple) {
      // Reemplazar el archivo único: si era uno existente, se notifica.
      const replaced = files[0];
      if (replaced && !isFile(replaced)) onRemoveExisting?.(replaced);
      commit(added);
    } else {
      commit([...files, ...added]);
    }
    onFilesAdded?.(added);
  };

  const removeAt = (index: number) => {
    const target = files[index];
    if (!target || blocked) return;
    if (!isFile(target)) onRemoveExisting?.(target);
    setRejections([]);
    commit(files.filter((_, i) => i !== index));
  };

  const openPicker = () => {
    if (!blocked) inputRef.current?.click();
  };

  const dropHandlers = {
    onDragOver: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      if (!blocked) setDragOver(true);
    },
    onDragLeave: () => setDragOver(false),
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setDragOver(false);
      if (!blocked) void addFiles(Array.from(event.dataTransfer?.files ?? []));
    },
  };

  const handlePaste = (event: ClipboardEvent<HTMLElement>) => {
    if (!allowPaste || blocked) return;
    const pasted = Array.from(event.clipboardData?.files ?? []);
    if (pasted.length === 0) return;
    event.preventDefault();
    void addFiles(pasted);
  };

  const keyOpen = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  const constraints = useMemo(() => {
    const parts: string[] = [];
    if (effectiveAccept)
      parts.push(
        effectiveAccept
          .split(",")
          .map((t) => t.trim())
          .join(", "),
      );
    if (maxSize !== undefined) parts.push(`máx. ${maxSize} MB por archivo`);
    if (imageConstraints?.minWidth || imageConstraints?.minHeight) {
      parts.push(
        `mín. ${imageConstraints.minWidth ?? "?"}×${imageConstraints.minHeight ?? "?"} px`,
      );
    }
    if (multiple && maxFiles !== undefined) parts.push(`${files.length} de ${maxFiles} archivos`);
    if (maxTotalSize !== undefined) parts.push(`${formatBytes(totalSize)} de ${maxTotalSize} MB`);
    return parts.join(" · ");
  }, [
    effectiveAccept,
    files.length,
    imageConstraints,
    maxFiles,
    maxSize,
    maxTotalSize,
    multiple,
    totalSize,
  ]);

  const canAddMore = !multiple || limit === undefined || files.length < limit;
  const canView = (file: CnFileValue) => enableLightbox && isViewableFile(file);
  const constraintsId = `${control.id}-constraints`;
  const canDownload = (file: CnFileValue) =>
    downloadable && (isFile(file) || Boolean(getSafeUrl(file.url)));

  const describe = (file: CnFileValue): string => {
    const info = meta.get(file);
    const parts: string[] = [];
    const size = sizeOf(file);
    if (size) parts.push(formatBytes(size));
    if (showMetadata) {
      if (info.width && info.height) parts.push(`${info.width}×${info.height}`);
      if (info.duration) parts.push(formatDuration(info.duration));
      if (info.pages) parts.push(`${info.pages} ${info.pages === 1 ? "página" : "páginas"}`);
    }
    return parts.join(" · ");
  };

  const statusOf = (file: CnFileValue, index: number) => fileStatus?.(file, index);

  const dropSurfaceSx = {
    cursor: blocked ? "not-allowed" : "pointer",
    border: "1.5px dashed",
    borderColor: control.error
      ? "var(--cn-color-error-500, #d63c3c)"
      : dragOver
        ? "var(--cn-color-brand-500, #3562a6)"
        : "var(--cn-color-border-strong, #c5cad0)",
    backgroundColor: dragOver
      ? "var(--cn-color-brand-50, #eef3fb)"
      : blocked
        ? "var(--cn-color-neutral-100, #f4f5f7)"
        : "var(--cn-color-surface, #ffffff)",
    color: "var(--cn-color-text-muted, #6e7682)",
    transition: "border-color 140ms ease, background-color 140ms ease",
    outline: "none",
    "&:hover": blocked ? undefined : { borderColor: "var(--cn-color-brand-400, #5081c4)" },
    "&:focus-visible, &.Mui-focusVisible": {
      borderColor: "var(--cn-color-brand-500, #3562a6)",
      boxShadow: "0 0 0 3px rgba(var(--cn-color-rgb-brand-500, 53, 98, 166), 0.18)",
    },
  } as const;

  // ─── Piezas compartidas ──────────────────────────────────────────────
  const preview = (
    file: CnFileValue,
    sizePx: number | "100%",
    rounded = "var(--cn-radius-sm, 6px)",
  ) => {
    const url = previews.get(fileKey(file));
    const kind = getFileKind(file);
    const iconSize = typeof sizePx === "number" ? Math.max(18, sizePx * 0.45) : 40;
    return (
      <Box
        sx={{
          width: sizePx,
          height: sizePx,
          flexShrink: 0,
          borderRadius: rounded,
          overflow: "hidden",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
        }}
      >
        {url && kind === "image" ? (
          <Box
            component="img"
            src={url}
            alt=""
            loading="lazy"
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : url && kind === "video" ? (
          <>
            <Box
              component="video"
              src={`${url}#t=0.1`}
              muted
              preload="metadata"
              playsInline
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <PlayCircleFilledWhiteOutlinedIcon
              sx={{
                position: "absolute",
                color: "#fff",
                fontSize: iconSize * 0.8,
                filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))",
              }}
            />
          </>
        ) : (
          <KindIcon file={file} size={iconSize} />
        )}
      </Box>
    );
  };

  const statusBar = (status: CnFileStatus | undefined) =>
    status?.state === "uploading" ? (
      <LinearProgress
        variant={status.progress === undefined ? "indeterminate" : "determinate"}
        value={status.progress ?? 0}
        aria-label="Progreso de subida"
        sx={{
          height: 4,
          borderRadius: 2,
          mt: "4px",
          "& .MuiLinearProgress-bar": { backgroundColor: "var(--cn-color-brand-600, #254d87)" },
        }}
      />
    ) : null;

  const statusText = (status: CnFileStatus | undefined, fallback: string) => (
    <Box
      component="span"
      sx={{
        ...ellipsisSx,
        ...mutedTextSx,
        ...(status?.state === "error" && { color: "var(--cn-color-error-600, #b52f2f)" }),
        ...(status?.state === "success" && { color: "var(--cn-color-success-600, #228740)" }),
      }}
    >
      {status?.state === "error"
        ? (status.message ?? "Error al subir")
        : status?.state === "uploading"
          ? `Subiendo${status.progress !== undefined ? ` ${Math.round(status.progress)} %` : "…"}`
          : status?.state === "success"
            ? (status.message ?? (fallback ? `${fallback} · Subido` : "Subido"))
            : fallback}
    </Box>
  );

  const itemBorder = (status: CnFileStatus | undefined) =>
    status?.state === "error"
      ? "var(--cn-color-error-500, #d63c3c)"
      : "var(--cn-color-border, #dde0e4)";

  const actions = (file: CnFileValue, index: number, overlay = false) => {
    const status = statusOf(file, index);
    const buttonSx = overlay ? overlayButtonSx : undefined;
    const iconSx = { fontSize: overlay ? 16 : 20 };
    return (
      <>
        {status?.state === "error" && onRetry && (
          <Tooltip title="Reintentar">
            <IconButton
              size="small"
              aria-label={`Reintentar ${file.name}`}
              onClick={() => onRetry(file, index)}
              sx={buttonSx}
            >
              <ReplayIcon sx={iconSx} />
            </IconButton>
          </Tooltip>
        )}
        {renderFileActions?.(file, index)}
        {canDownload(file) && !overlay && (
          <Tooltip title="Descargar">
            <IconButton
              size="small"
              aria-label={`Descargar ${file.name}`}
              onClick={() => downloadFile(file)}
            >
              <DownloadIcon sx={iconSx} />
            </IconButton>
          </Tooltip>
        )}
        {!blocked && (
          <Tooltip title="Quitar">
            <IconButton
              size="small"
              aria-label={`Quitar ${file.name}`}
              onClick={(event) => {
                event.stopPropagation();
                removeAt(index);
              }}
              sx={buttonSx}
            >
              <CloseIcon sx={iconSx} />
            </IconButton>
          </Tooltip>
        )}
      </>
    );
  };

  const dragHandle = (index: number, overlay = false) =>
    reorderable && !blocked && files.length > 1 ? (
      <Box
        {...sortable.getHandleProps(index)}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--cn-radius-xs, 4px)",
          ...(overlay
            ? overlayButtonSx
            : {
                color: "var(--cn-color-neutral-400, #9aa1aa)",
                "&:hover": { color: "var(--cn-color-neutral-600, #4e5660)" },
              }),
          "&:focus-visible": { outline: "2px solid var(--cn-color-brand-400, #5081c4)" },
        }}
      >
        <DragIndicatorIcon sx={{ fontSize: overlay ? 16 : 20 }} />
      </Box>
    ) : null;

  const primaryBadge = (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "2px",
        px: "6px",
        height: 20,
        borderRadius: "999px",
        fontSize: 10,
        fontWeight: 700,
        color: "#fff",
        backgroundColor: "var(--cn-color-brand-600, #254d87)",
      }}
    >
      <StarIcon sx={{ fontSize: 12 }} />
      {primaryLabel}
    </Box>
  );

  const makePrimaryButton = (index: number) =>
    blocked ? null : (
      <Tooltip title={`Marcar como ${primaryLabel.toLowerCase()}`}>
        <IconButton
          size="small"
          aria-label={`Marcar ${files[index].name} como ${primaryLabel.toLowerCase()}`}
          onClick={(event) => {
            event.stopPropagation();
            commit(moveArrayItem(files, index, 0));
          }}
          sx={overlayButtonSx}
        >
          <StarBorderIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    );

  const fileName = (file: CnFileValue, index: number) => {
    const safe = !isFile(file) ? getSafeUrl(file.url) : undefined;
    const textSx = { ...ellipsisSx, fontSize: "var(--cn-font-size-base, 13px)" };
    if (canView(file)) {
      return (
        <ButtonBase
          onClick={() => setLightboxIndex(index)}
          sx={{
            ...textSx,
            display: "block",
            textAlign: "left",
            color: "var(--cn-color-brand-600, #254d87)",
            fontFamily: "inherit",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          {file.name}
        </ButtonBase>
      );
    }
    if (safe) {
      return (
        <Box
          component="a"
          href={safe}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ ...textSx, color: "var(--cn-color-brand-600, #254d87)" }}
        >
          {file.name}
        </Box>
      );
    }
    return (
      <Box component="span" sx={{ ...textSx, color: "var(--cn-color-text, #222831)" }}>
        {file.name}
      </Box>
    );
  };

  const addTile = (sxExtra: object, labelText: string) => (
    <ButtonBase
      aria-label={multiple ? "Agregar archivos" : "Agregar archivo"}
      aria-describedby={constraints ? constraintsId : undefined}
      disabled={blocked}
      onClick={openPicker}
      {...dropHandlers}
      sx={{
        ...dropSurfaceSx,
        flexDirection: "column",
        gap: "4px",
        fontSize: "var(--cn-font-size-xs, 11px)",
        fontFamily: "inherit",
        borderRadius: "var(--cn-radius-md, 8px)",
        ...sxExtra,
      }}
    >
      {busy ? (
        <CircularProgress size={20} />
      ) : (
        <CloudUploadOutlinedIcon sx={{ color: "var(--cn-color-brand-500, #3562a6)" }} />
      )}
      {labelText}
    </ButtonBase>
  );

  // ─── Variantes ───────────────────────────────────────────────────────
  const renderList = () =>
    files.length > 0 && (
      <Box
        component="ul"
        aria-label="Archivos seleccionados"
        sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: "6px" }}
      >
        {files.map((file, index) => {
          const status = statusOf(file, index);
          return (
            <Box
              component="li"
              key={fileKey(file)}
              data-cn-file-item
              data-status={status?.state}
              {...sortable.getItemProps(index)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 8px",
                borderRadius: "var(--cn-radius-md, 8px)",
                border: "1px solid",
                borderColor: itemBorder(status),
                backgroundColor: "var(--cn-color-surface, #ffffff)",
                minWidth: 0,
              }}
            >
              {dragHandle(index)}
              {canView(file) ? (
                <ButtonBase
                  aria-label={`Ver ${file.name}`}
                  onClick={() => setLightboxIndex(index)}
                  sx={{ borderRadius: "var(--cn-radius-sm, 6px)", position: "relative" }}
                >
                  {preview(file, 40)}
                  <ZoomInIcon
                    sx={{
                      position: "absolute",
                      fontSize: 16,
                      right: -4,
                      bottom: -4,
                      color: "var(--cn-color-brand-600, #254d87)",
                      backgroundColor: "var(--cn-color-surface, #fff)",
                      borderRadius: "50%",
                    }}
                  />
                </ButtonBase>
              ) : (
                preview(file, 40)
              )}
              <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                {fileName(file, index)}
                {statusText(status, describe(file))}
                {statusBar(status)}
              </Box>
              {actions(file, index)}
            </Box>
          );
        })}
      </Box>
    );

  const renderCompact = () => (
    <Box
      component="ul"
      aria-label="Archivos seleccionados"
      sx={{
        listStyle: "none",
        m: 0,
        p: 0,
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        alignItems: "center",
      }}
    >
      {files.map((file, index) => {
        const status = statusOf(file, index);
        return (
          <Box
            component="li"
            key={fileKey(file)}
            data-cn-file-item
            data-status={status?.state}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              maxWidth: 280,
              pl: "8px",
              pr: "2px",
              height: 32,
              borderRadius: "999px",
              border: "1px solid",
              borderColor: itemBorder(status),
              backgroundColor: "var(--cn-color-surface, #ffffff)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <KindIcon file={file} size={16} />
            <Box sx={{ minWidth: 0 }}>{fileName(file, index)}</Box>
            <Box component="span" sx={{ ...mutedTextSx, flexShrink: 0 }}>
              {status?.state === "uploading" && status.progress !== undefined
                ? `${Math.round(status.progress)} %`
                : formatBytes(sizeOf(file))}
            </Box>
            {actions(file, index)}
            {status?.state === "uploading" && (
              <LinearProgress
                variant={status.progress === undefined ? "indeterminate" : "determinate"}
                value={status.progress ?? 0}
                aria-label="Progreso de subida"
                sx={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2 }}
              />
            )}
          </Box>
        );
      })}
      {canAddMore && !readOnly && (
        <Box component="li">
          <CnButton
            size="small"
            variant="outlined"
            color="neutral"
            startIcon="attach_file"
            onClick={openPicker}
            disabled={blocked}
            loading={busy}
          >
            {buttonLabel}
          </CnButton>
        </Box>
      )}
    </Box>
  );

  const renderGallery = (cards: boolean) => (
    <Box
      component="ul"
      aria-label="Archivos seleccionados"
      sx={{
        listStyle: "none",
        m: 0,
        p: 0,
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(${cards ? 200 : thumbnailSize}px, 1fr))`,
        gap: cards ? "12px" : "8px",
      }}
    >
      {files.map((file, index) => {
        const status = statusOf(file, index);
        const hasPreview = Boolean(previews.get(fileKey(file)));
        return (
          <Box
            component="li"
            key={fileKey(file)}
            data-cn-file-item
            data-status={status?.state}
            {...sortable.getItemProps(index)}
            sx={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              borderRadius: "var(--cn-radius-md, 8px)",
              overflow: "hidden",
              border: "1px solid",
              borderColor: itemBorder(status),
              backgroundColor: "var(--cn-color-surface, #ffffff)",
              "&:hover .cn-file-overlay, &:focus-within .cn-file-overlay": { opacity: 1 },
            }}
          >
            <Box
              sx={{
                position: "relative",
                aspectRatio: cards ? "4 / 3" : "1 / 1",
                overflow: "hidden",
              }}
            >
              <ButtonBase
                aria-label={canView(file) ? `Ver ${file.name}` : file.name}
                disabled={!canView(file)}
                onClick={() => setLightboxIndex(index)}
                sx={{ position: "absolute", inset: 0 }}
              >
                {preview(file, "100%", "0")}
              </ButtonBase>
              {!cards && !hasPreview && (
                <Box
                  component="span"
                  sx={{
                    ...ellipsisSx,
                    ...mutedTextSx,
                    position: "absolute",
                    bottom: 6,
                    left: 6,
                    right: 6,
                    textAlign: "center",
                  }}
                >
                  {file.name}
                </Box>
              )}
              <Box
                sx={{
                  position: "absolute",
                  top: 4,
                  left: 4,
                  display: "flex",
                  gap: "4px",
                  alignItems: "center",
                }}
              >
                {primaryEnabled && index === 0 && primaryBadge}
                <Box
                  className="cn-file-overlay"
                  sx={{
                    display: "flex",
                    gap: "4px",
                    opacity: { xs: 1, md: 0 },
                    transition: "opacity 140ms ease",
                  }}
                >
                  {dragHandle(index, true)}
                  {primaryEnabled && index > 0 && makePrimaryButton(index)}
                </Box>
              </Box>
              <Box
                className="cn-file-overlay"
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  display: "flex",
                  gap: "4px",
                  opacity: { xs: 1, md: 0 },
                  transition: "opacity 140ms ease",
                }}
              >
                {actions(file, index, true)}
              </Box>
              {status?.state === "uploading" && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255,255,255,0.6)",
                  }}
                >
                  <CircularProgress
                    variant={status.progress === undefined ? "indeterminate" : "determinate"}
                    value={status.progress ?? 0}
                    size={32}
                    aria-label="Progreso de subida"
                  />
                </Box>
              )}
            </Box>
            {cards && (
              <Box sx={{ display: "flex", alignItems: "center", gap: "6px", p: "8px 10px" }}>
                <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  {fileName(file, index)}
                  {statusText(status, describe(file))}
                  {statusBar(status)}
                </Box>
                {canDownload(file) && (
                  <Tooltip title="Descargar">
                    <IconButton
                      size="small"
                      aria-label={`Descargar ${file.name}`}
                      onClick={() => downloadFile(file)}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
            {!cards && status?.state === "error" && (
              <Box
                component="span"
                sx={{
                  ...ellipsisSx,
                  px: "6px",
                  py: "2px",
                  fontSize: 10,
                  color: "var(--cn-color-error-600, #b52f2f)",
                }}
              >
                {status.message ?? "Error al subir"}
              </Box>
            )}
          </Box>
        );
      })}
      {canAddMore && !readOnly && (
        <Box component="li" sx={cards ? { minHeight: 180 } : { aspectRatio: "1 / 1" }}>
          {addTile({ width: "100%", height: "100%" }, cards ? "Agregar archivos" : "Agregar")}
        </Box>
      )}
    </Box>
  );

  const renderAvatar = () => {
    const file = files[0];
    const url = file ? previews.get(fileKey(file)) : undefined;
    const status = file ? statusOf(file, 0) : undefined;
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <ButtonBase
          aria-label={file ? `Cambiar imagen (${file.name})` : "Subir imagen"}
          aria-describedby={constraints ? constraintsId : undefined}
          disabled={blocked}
          onClick={openPicker}
          {...dropHandlers}
          sx={{
            ...dropSurfaceSx,
            width: thumbnailSize,
            height: thumbnailSize,
            borderRadius: "50%",
            overflow: "hidden",
            borderStyle: url ? "solid" : "dashed",
            position: "relative",
            "&:hover .cn-avatar-overlay": { opacity: 1 },
          }}
        >
          {url ? (
            <Box
              component="img"
              src={url}
              alt=""
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <PersonOutlineIcon sx={{ fontSize: thumbnailSize * 0.45 }} />
          )}
          {(status?.state === "uploading" || busy) && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.55)",
              }}
            >
              <CircularProgress
                variant={status?.progress === undefined ? "indeterminate" : "determinate"}
                value={status?.progress ?? 0}
                size={32}
                aria-label="Progreso de subida"
              />
            </Box>
          )}
          {!blocked && (
            <Box
              className="cn-avatar-overlay"
              aria-hidden
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(17, 20, 24, 0.45)",
                color: "#fff",
                opacity: 0,
                transition: "opacity 140ms ease",
              }}
            >
              <CloudUploadOutlinedIcon />
            </Box>
          )}
        </ButtonBase>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
          {!readOnly && (
            <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <CnButton
                size="small"
                variant="outlined"
                color="neutral"
                startIcon="upload"
                onClick={openPicker}
                disabled={blocked}
              >
                {file ? "Cambiar" : buttonLabel}
              </CnButton>
              {file && !blocked && (
                <CnButton size="small" variant="text" color="error" onClick={() => removeAt(0)}>
                  Quitar
                </CnButton>
              )}
            </Box>
          )}
          {file && statusText(status, describe(file))}
          {constraints && (
            <Box component="span" id={constraintsId} sx={mutedTextSx}>
              {constraints}
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const constraintsLine = (withId: boolean) =>
    constraints ? (
      <Box component="span" id={withId ? constraintsId : undefined} sx={mutedTextSx}>
        {constraints}
      </Box>
    ) : null;

  const showDropzone = variant === "dropzone" && canAddMore && !readOnly;
  const showButton = variant === "button" && canAddMore && !readOnly;

  return (
    <FormControl
      ref={ref as Ref<HTMLFieldSetElement>}
      component="fieldset"
      error={control.error}
      disabled={disabled}
      required={required}
      fullWidth
      className={className}
      data-cn-file-field={variant}
      aria-busy={busy || undefined}
      onPaste={handlePaste}
      sx={mergeSx({ minWidth: 0, gap: "8px" }, sx)}
    >
      {label && (
        <FormLabel component="legend" id={`${control.id}-label`} sx={groupLegendSx}>
          {label}
        </FormLabel>
      )}

      <input
        ref={inputRef}
        id={control.id}
        name={name}
        type="file"
        hidden
        accept={effectiveAccept}
        multiple={multiple}
        capture={capture}
        disabled={blocked}
        aria-describedby={control.helperText ? control.helperId : undefined}
        onChange={(event) => {
          void addFiles(Array.from(event.target.files ?? []));
          // Permite volver a elegir el mismo archivo tras quitarlo.
          event.target.value = "";
        }}
        data-testid="cn-file-input"
      />

      {isAvatar && renderAvatar()}

      {showDropzone && (
        <Box
          role="button"
          tabIndex={blocked ? -1 : 0}
          aria-disabled={blocked || undefined}
          aria-labelledby={label ? `${control.id}-label` : undefined}
          aria-describedby={constraints ? constraintsId : undefined}
          onClick={openPicker}
          onKeyDown={keyOpen}
          {...dropHandlers}
          data-drag-over={dragOver || undefined}
          sx={{
            ...dropSurfaceSx,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "20px 16px",
            textAlign: "center",
            borderRadius: "var(--cn-radius-md, 8px)",
          }}
        >
          {busy ? (
            <CircularProgress size={26} />
          ) : (
            <CloudUploadOutlinedIcon
              sx={{ fontSize: 28, color: "var(--cn-color-brand-500, #3562a6)" }}
            />
          )}
          <Box
            component="span"
            sx={{
              fontSize: "var(--cn-font-size-base, 13px)",
              color: "var(--cn-color-text, #222831)",
            }}
          >
            {dropzoneText ?? (
              <>
                Arrastra {multiple ? "archivos" : "un archivo"} aquí o{" "}
                <Box
                  component="span"
                  sx={{ color: "var(--cn-color-brand-600, #254d87)", fontWeight: 600 }}
                >
                  selecciónalo
                </Box>
              </>
            )}
          </Box>
          {allowPaste && !dropzoneText && (
            <Box component="span" sx={mutedTextSx}>
              También puedes pegarlo con Ctrl+V
            </Box>
          )}
          {constraintsLine(true)}
        </Box>
      )}

      {showButton && (
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <CnButton
            variant="outlined"
            color="neutral"
            startIcon="upload"
            onClick={openPicker}
            disabled={blocked}
            loading={busy}
          >
            {buttonLabel}
          </CnButton>
          {constraintsLine(true)}
        </Box>
      )}

      {isList && renderList()}
      {variant === "compact" && renderCompact()}
      {variant === "grid" && renderGallery(false)}
      {variant === "card" && renderGallery(true)}
      {!isAvatar && !showDropzone && !showButton && constraintsLine(true)}

      <Box aria-live="polite" sx={visuallyHidden}>
        {sortable.announcement}
      </Box>

      {rejections.length > 0 && (
        <Box
          role="alert"
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            fontSize: "var(--cn-font-size-xs, 11px)",
            color: "var(--cn-color-error-600, #b52f2f)",
          }}
        >
          {rejections.map((rejection) => (
            <span key={`${rejection.name}-${rejection.reason}`}>{rejection.message}</span>
          ))}
        </Box>
      )}

      {control.helperText && (
        <FormHelperText id={control.helperId} sx={helperTextSx}>
          {control.helperText}
        </FormHelperText>
      )}

      {enableLightbox && (
        <FileLightbox
          files={files}
          index={lightboxIndex}
          previews={previews}
          describe={describe}
          downloadable={downloadable}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </FormControl>
  );
});

/** Archivo ya almacenado en el servidor. */
export type CnExistingFile = {
  id: string | number;
  url: string;
  name: string;
  size?: number;
  mime?: string;
  /** Miniatura opcional (si difiere de `url`). */
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  /** Duración en segundos (audio / video). */
  duration?: number;
  pages?: number;
};

export type CnFileValue = File | CnExistingFile;

export type CnFileRejection = {
  name: string;
  reason: "type" | "size" | "count" | "totalSize" | "dimensions";
  message: string;
};

export type CnFileMetadata = {
  width?: number;
  height?: number;
  duration?: number;
  pages?: number;
};

export type CnFileKind =
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "archive"
  | "text"
  | "other";

/** Estado de subida informado por el consumidor (subidas directas, S3, etc.). */
export type CnFileStatus = {
  state: "uploading" | "success" | "error";
  /** 0–100 */
  progress?: number;
  message?: string;
};

export type CnImageConstraints = {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  /** Relación ancho/alto exigida (p. ej. `1` = cuadrada, `16 / 9`). Tolerancia 1 %. */
  aspectRatio?: number;
};

export const isFile = (value: unknown): value is File =>
  typeof File !== "undefined" && value instanceof File;

export const isExistingFile = (value: unknown): value is CnExistingFile =>
  Boolean(value) &&
  typeof value === "object" &&
  !isFile(value) &&
  "url" in (value as object) &&
  "name" in (value as object);

/**
 * Solo permite URLs http(s), blob: y rutas relativas. Evita `javascript:` y
 * `data:` no-imagen en enlaces e imágenes provenientes del servidor.
 */
export const getSafeUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (/^(https?:|blob:)/i.test(trimmed)) return trimmed;
  if (/^data:image\/(png|jpe?g|gif|webp|avif);/i.test(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return undefined;
  if (trimmed.startsWith("//")) return undefined;
  return trimmed;
};

export const extensionOf = (name: string): string => {
  const index = name.lastIndexOf(".");
  return index === -1 ? "" : name.slice(index).toLowerCase();
};

/** Implementa la misma semántica que el atributo HTML `accept`. */
export const matchesAccept = (file: { name: string; type?: string }, accept?: string): boolean => {
  if (!accept) return true;
  const tokens = accept
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const mime = (file.type ?? "").toLowerCase();
  const ext = extensionOf(file.name);
  return tokens.some((token) => {
    if (token.startsWith(".")) return ext === token;
    if (token.endsWith("/*")) return mime.startsWith(token.slice(0, -1));
    return mime === token;
  });
};

const mimeOf = (file: CnFileValue): string =>
  ((isFile(file) ? file.type : file.mime) ?? "").toLowerCase();

const KIND_BY_EXTENSION: Record<string, CnFileKind> = {
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".gif": "image",
  ".webp": "image",
  ".avif": "image",
  ".svg": "image",
  ".mp4": "video",
  ".webm": "video",
  ".mov": "video",
  ".mp3": "audio",
  ".wav": "audio",
  ".ogg": "audio",
  ".m4a": "audio",
  ".pdf": "pdf",
  ".doc": "document",
  ".docx": "document",
  ".odt": "document",
  ".rtf": "document",
  ".xls": "spreadsheet",
  ".xlsx": "spreadsheet",
  ".csv": "spreadsheet",
  ".ods": "spreadsheet",
  ".ppt": "presentation",
  ".pptx": "presentation",
  ".odp": "presentation",
  ".zip": "archive",
  ".rar": "archive",
  ".7z": "archive",
  ".gz": "archive",
  ".txt": "text",
  ".md": "text",
  ".json": "text",
  ".xml": "text",
};

export const getFileKind = (file: CnFileValue): CnFileKind => {
  const mime = mimeOf(file);
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  return KIND_BY_EXTENSION[extensionOf(file.name)] ?? (mime.startsWith("text/") ? "text" : "other");
};

export const isImageFile = (file: CnFileValue): boolean => getFileKind(file) === "image";
export const isVideoFile = (file: CnFileValue): boolean => getFileKind(file) === "video";
export const isAudioFile = (file: CnFileValue): boolean => getFileKind(file) === "audio";
export const isPdfFile = (file: CnFileValue): boolean => getFileKind(file) === "pdf";

export const fileKey = (file: CnFileValue): string =>
  isFile(file) ? `new:${file.name}:${file.size}:${file.lastModified}` : `existing:${file.id}`;

export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
};

const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);

const loadMedia = (url: string, kind: "image" | "video" | "audio"): Promise<CnFileMetadata> =>
  new Promise((resolve) => {
    if (kind === "image") {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => resolve({});
      image.src = url;
      return;
    }
    const media = document.createElement(kind);
    media.preload = "metadata";
    media.onloadedmetadata = () => {
      const video = media as HTMLVideoElement;
      resolve({
        duration: Number.isFinite(media.duration) ? media.duration : undefined,
        ...(kind === "video" ? { width: video.videoWidth, height: video.videoHeight } : {}),
      });
    };
    media.onerror = () => resolve({});
    media.src = url;
  });

/** Cuenta las páginas de un PDF leyendo su estructura (sin dependencias). */
const countPdfPages = async (file: File): Promise<number | undefined> => {
  if (file.size > 30 * 1024 * 1024 || typeof file.text !== "function") return undefined;
  const text = await file.text();
  const matches = text.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
  return matches?.length || undefined;
};

/**
 * Lee dimensiones (imagen/video), duración (audio/video) o páginas (PDF) de un
 * archivo local. Nunca falla: si algo no se puede leer, devuelve `{}`.
 */
export const readFileMetadata = async (file: File): Promise<CnFileMetadata> => {
  const kind = getFileKind(file);
  try {
    if (kind === "pdf") return { pages: await withTimeout(countPdfPages(file), 4000, undefined) };
    if (kind !== "image" && kind !== "video" && kind !== "audio") return {};
    if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return {};
    const url = URL.createObjectURL(file);
    try {
      return await withTimeout(loadMedia(url, kind), 4000, {});
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return {};
  }
};

/** Mensaje de error si la imagen no cumple las restricciones; `null` si cumple. */
export const checkImageConstraints = (
  meta: CnFileMetadata,
  constraints: CnImageConstraints,
): string | null => {
  const { width, height } = meta;
  if (!width || !height) return null;
  const { minWidth, minHeight, maxWidth, maxHeight, aspectRatio } = constraints;
  if (minWidth && width < minWidth) return `mínimo ${minWidth}px de ancho (tiene ${width}px)`;
  if (minHeight && height < minHeight) return `mínimo ${minHeight}px de alto (tiene ${height}px)`;
  if (maxWidth && width > maxWidth) return `máximo ${maxWidth}px de ancho (tiene ${width}px)`;
  if (maxHeight && height > maxHeight) return `máximo ${maxHeight}px de alto (tiene ${height}px)`;
  if (aspectRatio && Math.abs(width / height - aspectRatio) / aspectRatio > 0.01) {
    return `la proporción debe ser ${Number(aspectRatio.toFixed(2))}:1 (tiene ${width}×${height})`;
  }
  return null;
};

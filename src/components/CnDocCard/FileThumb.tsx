import Box from "@mui/material/Box";
import { useEffect, useState } from "react";
import type { CnFileDisplayKind } from "../../utils/file-utils";
import { FILE_KIND_META, fileExtensionLabel } from "../../utils/file-utils";
import { CnIcon } from "../CnIcon";

/**
 * Object URL de un archivo local (se libera al cambiar o desmontar). Devuelve
 * `undefined` si no hay archivo, si está deshabilitado o en entornos sin `URL`.
 */
export const useObjectUrl = (file: File | undefined, enabled = true): string | undefined => {
  const [url, setUrl] = useState<string | undefined>();
  useEffect(() => {
    if (!file || !enabled || typeof URL === "undefined" || !URL.createObjectURL) {
      setUrl(undefined);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL?.(next);
  }, [file, enabled]);
  return url;
};

export type FileThumbProps = {
  kind: CnFileDisplayKind;
  name: string;
  /** Imagen de la miniatura. */
  src?: string;
  /** Video del que se muestra el primer cuadro (si no hay `src`). */
  videoSrc?: string;
  /** Lado en px; `"fill"` ocupa todo el contenedor (tarjetas y galerías). */
  size: number | "fill";
  /** Radio del borde (por defecto 8px; 0 en `fill`). */
  radius?: number | string;
  /** Muestra la extensión bajo el ícono (solo en `fill`). */
  showExtension?: boolean;
  error?: boolean;
};

/**
 * Miniatura de archivo: imagen, primer cuadro de video o ícono por tipo con su
 * color. Es la pieza visual común de `CnDocCard` y las galerías de `CnFileField`.
 */
export const FileThumb = ({
  kind,
  name,
  src,
  videoSrc,
  size,
  radius,
  showExtension = true,
  error = false,
}: FileThumbProps) => {
  const [failed, setFailed] = useState<string | null>(null);
  const meta = FILE_KIND_META[kind];
  const fill = size === "fill";
  const ext = fileExtensionLabel(name);
  const showImage = Boolean(src) && failed !== src && !error;
  const showVideo = !showImage && Boolean(videoSrc) && failed !== videoSrc && !error;
  const iconSize = fill ? 44 : Math.max(16, Math.round(size * 0.55));

  return (
    <Box
      data-cn-file-thumb={kind}
      data-cn-doc-thumb={kind}
      aria-hidden
      sx={{
        position: "relative",
        width: fill ? "100%" : size,
        height: fill ? "100%" : size,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        borderRadius: radius ?? (fill ? 0 : "var(--cn-radius-md, 8px)"),
        color: error ? "var(--cn-color-error-600, #b52f2f)" : meta.color,
        backgroundColor: error
          ? "rgba(var(--cn-color-rgb-error-500, 214, 60, 60), 0.08)"
          : "var(--cn-color-neutral-100, #f4f5f7)",
      }}
    >
      {showImage ? (
        <Box
          component="img"
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(src ?? null)}
          sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : showVideo ? (
        <Box
          component="video"
          src={`${videoSrc}#t=0.1`}
          muted
          preload="metadata"
          playsInline
          onError={() => setFailed(videoSrc ?? null)}
          sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <CnIcon name={error ? "error_outline" : meta.icon} size={iconSize} color="inherit" />
          {fill && showExtension && ext && !error && (
            <Box
              component="span"
              sx={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "inherit",
                opacity: 0.85,
                maxWidth: "90%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {ext}
            </Box>
          )}
        </Box>
      )}
      {(showImage || showVideo) && kind === "video" && (
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
          <CnIcon
            name="play_circle"
            size={fill ? 40 : Math.max(16, iconSize * 0.7)}
            color="inherit"
          />
        </Box>
      )}
    </Box>
  );
};

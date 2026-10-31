import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import type { KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import type { CnFileValue } from "./file-utils";
import { fileKey, getFileKind, getSafeUrl, isFile } from "./file-utils";

export const isViewableFile = (file: CnFileValue): boolean =>
  ["image", "video", "audio", "pdf"].includes(getFileKind(file));

/** Descarga un archivo local o existente sin exponer URLs inseguras. */
export const downloadFile = (file: CnFileValue): void => {
  const link = document.createElement("a");
  link.rel = "noopener noreferrer";
  link.download = file.name;
  if (isFile(file)) {
    if (typeof URL.createObjectURL !== "function") return;
    const url = URL.createObjectURL(file);
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const safe = getSafeUrl(file.url);
  if (!safe) return;
  link.href = safe;
  link.target = "_blank";
  link.click();
};

type FileLightboxProps = {
  files: CnFileValue[];
  index: number | null;
  previews: Map<string, string>;
  describe: (file: CnFileValue) => string;
  downloadable: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

const darkButtonSx = {
  color: "inherit",
  backgroundColor: "rgba(255,255,255,0.08)",
  "&:hover": { backgroundColor: "rgba(255,255,255,0.16)" },
};

/** Visor de imágenes, video, audio y PDF con navegación por teclado. */
export const FileLightbox = ({
  files,
  index,
  previews,
  describe,
  downloadable,
  onClose,
  onNavigate,
}: FileLightboxProps) => {
  const file = index === null ? null : files[index];
  const kind = file ? getFileKind(file) : "other";
  const [mediaUrl, setMediaUrl] = useState<string | undefined>();
  const [zoomed, setZoomed] = useState(false);

  // Video, audio y PDF locales usan un object URL que se libera al cambiar o cerrar.
  useEffect(() => {
    setZoomed(false);
    if (!file || kind === "image" || kind === "other") {
      setMediaUrl(undefined);
      return;
    }
    if (!isFile(file)) {
      setMediaUrl(getSafeUrl(file.url));
      return;
    }
    if (typeof URL.createObjectURL !== "function") return;
    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, kind]);

  if (!file || index === null) return null;
  const viewable = files.map((item, i) => ({ item, i })).filter(({ item }) => isViewableFile(item));
  const position = viewable.findIndex(({ i }) => i === index);
  const go = (delta: number) => {
    const next = viewable[(position + delta + viewable.length) % viewable.length];
    if (next) onNavigate(next.i);
  };
  const image = kind === "image" ? previews.get(fileKey(file)) : undefined;

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      onKeyDown={(event: KeyboardEvent) => {
        if (event.key === "ArrowRight") go(1);
        if (event.key === "ArrowLeft") go(-1);
      }}
      slotProps={{
        paper: {
          "aria-label": `Vista previa: ${file.name}`,
          sx: {
            backgroundColor: "#111418",
            color: "#fff",
            borderRadius: "var(--cn-radius-lg, 12px)",
            fontFamily: "var(--cn-font-sans, inherit)",
          },
        } as Record<string, unknown>,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px", px: "16px", py: "8px" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              fontSize: "var(--cn-font-size-base, 13px)",
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {file.name}
          </Box>
          <Box sx={{ fontSize: "var(--cn-font-size-xs, 11px)", opacity: 0.65 }}>
            {[describe(file), viewable.length > 1 ? `${position + 1} de ${viewable.length}` : ""]
              .filter(Boolean)
              .join(" · ")}
          </Box>
        </Box>
        {kind === "image" && (
          <Tooltip title={zoomed ? "Ajustar a la ventana" : "Tamaño real"}>
            <IconButton
              aria-label={zoomed ? "Ajustar a la ventana" : "Ver en tamaño real"}
              onClick={() => setZoomed((z) => !z)}
              sx={{ color: "inherit" }}
            >
              {zoomed ? <ZoomOutIcon /> : <ZoomInIcon />}
            </IconButton>
          </Tooltip>
        )}
        {downloadable && (
          <Tooltip title="Descargar">
            <IconButton
              aria-label={`Descargar ${file.name}`}
              onClick={() => downloadFile(file)}
              sx={{ color: "inherit" }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        )}
        <IconButton aria-label="Cerrar vista previa" onClick={onClose} sx={{ color: "inherit" }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: zoomed ? "flex-start" : "center",
          justifyContent: zoomed ? "flex-start" : "center",
          minHeight: 320,
          height: "70vh",
          px: "48px",
          pb: "16px",
          overflow: zoomed ? "auto" : "hidden",
        }}
      >
        {image ? (
          <Box
            component="img"
            src={image}
            alt={file.name}
            onClick={() => setZoomed((z) => !z)}
            sx={{
              maxWidth: zoomed ? "none" : "100%",
              maxHeight: zoomed ? "none" : "100%",
              objectFit: "contain",
              borderRadius: "var(--cn-radius-md, 8px)",
              cursor: zoomed ? "zoom-out" : "zoom-in",
            }}
          />
        ) : kind === "video" && mediaUrl ? (
          <Box
            component="video"
            src={mediaUrl}
            controls
            autoPlay={false}
            sx={{ maxWidth: "100%", maxHeight: "100%", borderRadius: "var(--cn-radius-md, 8px)" }}
          />
        ) : kind === "audio" && mediaUrl ? (
          <Box component="audio" src={mediaUrl} controls sx={{ width: "min(100%, 480px)" }} />
        ) : kind === "pdf" && mediaUrl ? (
          // `object` con tipo fijo fuerza el visor de PDF del navegador (nunca HTML).
          <Box
            component="object"
            type="application/pdf"
            data={mediaUrl}
            aria-label={file.name}
            sx={{
              width: "100%",
              height: "100%",
              borderRadius: "var(--cn-radius-md, 8px)",
              backgroundColor: "#fff",
            }}
          >
            <Box
              component="a"
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: "inherit" }}
            >
              Abrir {file.name}
            </Box>
          </Box>
        ) : (
          <InsertDriveFileOutlinedIcon sx={{ fontSize: 64, opacity: 0.6 }} />
        )}
        {viewable.length > 1 && (
          <>
            <IconButton
              aria-label="Anterior"
              onClick={() => go(-1)}
              sx={{ ...darkButtonSx, position: "absolute", left: 8, top: "50%" }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              aria-label="Siguiente"
              onClick={() => go(1)}
              sx={{ ...darkButtonSx, position: "absolute", right: 8, top: "50%" }}
            >
              <ChevronRightIcon />
            </IconButton>
          </>
        )}
      </Box>
    </Dialog>
  );
};

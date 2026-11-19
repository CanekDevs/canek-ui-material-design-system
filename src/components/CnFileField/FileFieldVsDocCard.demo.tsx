import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CnFileStatus, CnFileValue } from "../../utils/file-utils";
import { isFile } from "../../utils/file-utils";
import { CnButton } from "../CnButton";
import { CnDocCard } from "../CnDocCard/CnDocCard";
import { CnFileField } from "./CnFileField";

/** Archivos de ejemplo (generados en el navegador) para no depender de un selector real. */
const sampleFiles = () => [
  new File(["%PDF-1.4"], "Contrato de arrendamiento firmado por ambas partes - versión final.pdf", {
    type: "application/pdf",
  }),
  new File(["a,b\n1,2"], "Inventario.csv", { type: "text/csv" }),
  new File(["error"], "comprobante-error.png", { type: "image/png" }),
];

/** Encabezado de cada paso del flujo. */
const Step = ({ n, title, children }: { n: number; title: string; children: ReactNode }) => (
  <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
    <Typography
      component="h3"
      sx={{ fontSize: 13, fontWeight: 600, color: "var(--cn-color-text-muted, #6e7682)" }}
    >
      {n}. {title}
    </Typography>
    {children}
  </Box>
);

/**
 * Flujo completo: el usuario elige archivos en `CnFileField` (entrada, con
 * progreso y error/reintento) y, al guardar, el expediente los muestra con
 * `CnDocCard` (visualización). Cada archivo se ve igual en ambos lados porque
 * el campo usa `CnDocCard` para dibujar su lista.
 */
export const FileFieldVsDocCardDemo = () => {
  const [files, setFiles] = useState<CnFileValue[]>([]);
  const [status, setStatus] = useState<Map<File, CnFileStatus>>(new Map());
  const [saved, setSaved] = useState<{ file: CnFileValue; savedAt: Date }[]>([]);
  const attempts = useRef(new Map<File, number>());
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => () => timers.current.forEach(clearInterval), []);

  const upload = useCallback((file: File) => {
    const attempt = (attempts.current.get(file) ?? 0) + 1;
    attempts.current.set(file, attempt);
    const fails = attempt === 1 && file.name.includes("error");
    let progress = 0;
    const timer = setInterval(() => {
      progress += 20;
      setStatus((prev) => {
        const next = new Map(prev);
        if (fails && progress >= 60) {
          clearInterval(timer);
          next.set(file, { state: "error", message: "Se perdió la conexión" });
        } else if (progress >= 100) {
          clearInterval(timer);
          next.set(file, { state: "success" });
        } else {
          next.set(file, { state: "uploading", progress });
        }
        return next;
      });
    }, 300);
    timers.current.push(timer);
  }, []);

  const addSamples = () => {
    const added = sampleFiles();
    setFiles((prev) => [...prev, ...added]);
    added.forEach(upload);
  };

  const ready =
    files.length > 0 &&
    files.every((file) => !isFile(file) || status.get(file)?.state === "success");

  return (
    <Box
      sx={{
        display: "grid",
        gap: "24px",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" },
        alignItems: "start",
      }}
    >
      <Step n={1} title="Entrada: CnFileField (elegir, validar, subir)">
        <CnFileField
          label="Adjuntar documentos"
          helperText='Los archivos con "error" en el nombre fallan la primera vez.'
          multiple
          reorderable
          value={files}
          onChange={setFiles}
          onFilesAdded={(added) => added.forEach(upload)}
          fileStatus={(file) => (isFile(file) ? status.get(file) : undefined)}
          onRetry={(file) => isFile(file) && upload(file)}
        />
        <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <CnButton size="small" variant="outlined" color="neutral" onClick={addSamples}>
            Agregar archivos de ejemplo
          </CnButton>
          <CnButton
            size="small"
            disabled={!ready}
            onClick={() => {
              const now = new Date();
              setSaved((prev) => [...files.map((file) => ({ file, savedAt: now })), ...prev]);
              setFiles([]);
            }}
          >
            Guardar en el expediente
          </CnButton>
        </Box>
      </Step>

      <Step n={2} title="Resultado: CnDocCard (consultar, descargar, compartir)">
        {saved.length === 0 ? (
          <Typography sx={{ fontSize: 13, color: "var(--cn-color-text-muted, #6e7682)" }}>
            Aún no hay documentos guardados. Sube archivos y presiona «Guardar».
          </Typography>
        ) : (
          <Box
            component="ul"
            sx={{
              listStyle: "none",
              m: 0,
              p: 0,
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: "8px",
            }}
          >
            {saved.map(({ file, savedAt }, i) => (
              <Box component="li" key={`${file.name}-${i}`} sx={{ minWidth: 0 }}>
                <CnDocCard
                  file={file}
                  updatedAt={savedAt}
                  updatedBy="Tú"
                  status={{ label: "Nuevo", color: "info" }}
                  onShare={() => undefined}
                  menuActions={[
                    {
                      label: "Eliminar",
                      icon: "delete_outline",
                      danger: true,
                      onClick: () => setSaved((prev) => prev.filter((_, j) => j !== i)),
                    },
                  ]}
                />
              </Box>
            ))}
          </Box>
        )}
      </Step>
    </Box>
  );
};

/** Muestra el mismo contenido en contenedores de 320, 480 y 1200 px. */
export const WidthFrames = ({ children }: { children: (width: number) => ReactNode }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: "32px" }}>
    {[320, 480, 1200].map((width) => (
      <Box key={width} data-frame={width} sx={{ width, maxWidth: "100%" }}>
        <Typography sx={{ fontSize: 11, color: "var(--cn-color-text-muted, #6e7682)", mb: "6px" }}>
          {width}px
        </Typography>
        <Box
          sx={{
            outline: "1px dashed var(--cn-color-border, #dde0e4)",
            outlineOffset: 4,
            minWidth: 0,
          }}
        >
          {children(width)}
        </Box>
      </Box>
    ))}
  </Box>
);

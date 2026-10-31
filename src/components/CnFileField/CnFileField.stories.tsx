import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useRef, useState } from "react";
import type { CnFileStatus, CnFileValue } from "./file-utils";
import { CnFileField } from "./CnFileField";

const meta: Meta<typeof CnFileField> = {
  title: "Forms/CnFileField",
  component: CnFileField,
  tags: ["autodocs"],
  args: { label: "Documentos" },
  argTypes: {
    variant: {
      control: "select",
      options: ["dropzone", "button", "compact", "grid", "card", "avatar"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof CnFileField>;

export const Dropzone: Story = {
  args: {
    accept: ".pdf,image/*,video/*,audio/*",
    maxSize: 20,
    multiple: true,
    maxFiles: 6,
    reorderable: true,
  },
};

export const Button: Story = { args: { variant: "button", accept: ".pdf", label: "Contrato" } };

export const Compact: Story = { args: { variant: "compact", multiple: true, label: "Adjuntos" } };

export const Grid: Story = {
  args: {
    variant: "grid",
    label: "Galería del producto",
    multiple: true,
    accept: "image/*",
    reorderable: true,
    maxFiles: 8,
    imageConstraints: { minWidth: 400, minHeight: 400 },
  },
};

export const Card: Story = {
  args: {
    variant: "card",
    label: "Expediente",
    multiple: true,
    reorderable: true,
    maxTotalSize: 50,
  },
};

export const Avatar: Story = {
  args: {
    variant: "avatar",
    label: "Foto de perfil",
    maxSize: 2,
    capture: "user",
    imageConstraints: { aspectRatio: 1, minWidth: 200 },
  },
};

const ExistingStory = () => {
  const [files, setFiles] = useState<CnFileValue[]>([
    {
      id: 1,
      name: "acta-constitutiva.pdf",
      url: "https://example.com/acta.pdf",
      size: 482_133,
      mime: "application/pdf",
      pages: 14,
    },
    {
      id: 2,
      name: "logo.png",
      url: "https://picsum.photos/seed/canek/600/400",
      mime: "image/png",
      width: 600,
      height: 400,
    },
  ]);
  return (
    <CnFileField
      label="Archivos del expediente"
      variant="card"
      multiple
      reorderable
      value={files}
      onChange={setFiles}
      onRemoveExisting={(file) => console.info("Eliminar en servidor", file.id)}
    />
  );
};

export const WithExistingFiles: Story = { render: () => <ExistingStory /> };

/** Simula subidas directas: progreso, éxito y un error con reintento. */
const UploadStory = () => {
  const [files, setFiles] = useState<CnFileValue[]>([]);
  const [status, setStatus] = useState<Map<File, CnFileStatus>>(new Map());
  const attempts = useRef(new Map<File, number>());

  const upload = useCallback((file: File) => {
    const attempt = (attempts.current.get(file) ?? 0) + 1;
    attempts.current.set(file, attempt);
    const fails = attempt === 1 && file.name.toLowerCase().includes("error");
    let progress = 0;
    const timer = setInterval(() => {
      progress += 12;
      setStatus((prev) => {
        const next = new Map(prev);
        if (fails && progress >= 48) {
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
    }, 250);
  }, []);

  return (
    <Stack spacing={1} sx={{ maxWidth: 640 }}>
      <CnFileField
        label="Subida con progreso"
        helperText='Incluye "error" en el nombre del archivo para simular una falla.'
        multiple
        value={files}
        onChange={setFiles}
        onFilesAdded={(added) => added.forEach(upload)}
        fileStatus={(file) => (file instanceof File ? status.get(file) : undefined)}
        onRetry={(file) => file instanceof File && upload(file)}
      />
    </Stack>
  );
};

export const UploadProgress: Story = { render: () => <UploadStory /> };

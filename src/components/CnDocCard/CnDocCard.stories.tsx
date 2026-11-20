import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import { CnButton } from "../CnButton";
import { FileFieldVsDocCardDemo, WidthFrames } from "../CnFileField/FileFieldVsDocCard.demo";
import { CnSectionCard } from "../CnSectionCard";
import type { CnDocCardProps } from "./CnDocCard";
import { CnDocCard } from "./CnDocCard";
import { CnDocCardSkeleton } from "./CnDocCardSkeleton";
import { catalogDocs } from "../../catalog";

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000);

const DOCS: (CnDocCardProps & { id: string })[] = [
  {
    id: "1",
    name: "Contrato marco de servicios 2026 - Acme Comercializadora.pdf",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    size: 2_480_000,
    pages: 14,
    updatedAt: hoursAgo(2),
    updatedBy: { name: "Ana López", avatarUrl: "https://i.pravatar.cc/150?img=5" },
    status: { label: "Firmado", color: "success", icon: "task_alt" },
    tags: ["Legal", "Clientes", "2026"],
    version: 3,
  },
  {
    id: "2",
    name: "Presupuesto Q1.xlsx",
    size: 384_000,
    updatedAt: hoursAgo(26),
    updatedBy: "Carlos Ruiz",
    status: { label: "En revisión", color: "warning" },
    tags: ["Finanzas"],
  },
  {
    id: "3",
    name: "Oficinas Monterrey.jpg",
    mime: "image/jpeg",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=480&h=360&fit=crop",
    size: 1_920_000,
    updatedAt: hoursAgo(80),
    updatedBy: "Lucía Torres",
    tags: ["Fotos", "Instalaciones"],
  },
  {
    id: "4",
    name: "Kickoff proyecto.pptx",
    size: 8_800_000,
    updatedAt: hoursAgo(300),
    updatedBy: "Equipo PMO",
    version: "v1.2",
  },
  {
    id: "5",
    name: "Grabación capacitación.mp4",
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=480&h=360&fit=crop",
    size: 54_000_000,
    updatedAt: hoursAgo(5),
  },
  { id: "6", name: "Podcast interno ep. 12.mp3", size: 18_200_000, updatedAt: hoursAgo(40) },
  { id: "7", name: "Respaldo base de datos.zip", size: 240_000_000, updatedAt: hoursAgo(12) },
  { id: "8", name: "integracion-sat.ts", size: 12_400, updatedAt: hoursAgo(1), tags: ["Código"] },
  { id: "9", name: "Minuta comité.docx", size: 64_000, updatedAt: hoursAgo(0.2) },
];

const meta: Meta<typeof CnDocCard> = {
  title: "Data Display/CnDocCard",
  component: CnDocCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: { component: catalogDocs("CnDocCard") },
    },
  },
  args: { ...DOCS[0], onShare: () => alert("Compartir") },
  argTypes: {
    layout: { control: "inline-radio", options: ["list", "grid", "compact"] },
    variant: { control: "inline-radio", options: ["outlined", "elevated", "filled", "ghost"] },
  },
  // `fullWidth` en una historia quita el ancho máximo de 720 px.
  decorators: [
    (Story, context) =>
      context.parameters.fullWidth ? Story() : <Box sx={{ maxWidth: 720 }}>{Story()}</Box>,
  ],
};

export default meta;
type Story = StoryObj<typeof CnDocCard>;

const menuActions = [
  { label: "Renombrar", icon: "edit", onClick: () => undefined },
  { label: "Mover a…", icon: "folder_open", onClick: () => undefined },
  { label: "Eliminar", icon: "delete_outline", danger: true, onClick: () => undefined },
];

export const Default: Story = {};

/** Íconos por tipo (pdf, doc, xls, ppt, imagen, video, audio, zip, código). */
export const FileTypes: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "8px" }}>
      {DOCS.map(({ id, ...doc }) => (
        <CnDocCard key={id} {...doc} menuActions={menuActions} />
      ))}
    </Box>
  ),
};

export const Grid: Story = {
  parameters: { fullWidth: true },
  render: () => (
    <Box
      sx={{
        display: "grid",
        gap: "12px",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      }}
    >
      {DOCS.map(({ id, ...doc }) => (
        <CnDocCard
          key={id}
          {...doc}
          layout="grid"
          onShare={() => undefined}
          menuActions={menuActions}
        />
      ))}
    </Box>
  ),
};

export const Compact: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "4px" }}>
      {DOCS.slice(0, 6).map(({ id, ...doc }) => (
        <CnDocCard key={id} {...doc} layout="compact" variant="ghost" menuActions={menuActions} />
      ))}
    </Box>
  ),
};

export const UploadAndError: Story = {
  render: function Render() {
    const [progress, setProgress] = useState(8);
    useEffect(() => {
      const timer = setInterval(() => setProgress((p) => (p >= 100 ? 8 : p + 7)), 400);
      return () => clearInterval(timer);
    }, []);
    return (
      <Box sx={{ display: "grid", gap: "8px" }}>
        <CnDocCard
          name="Estado de cuenta octubre.pdf"
          size={1_200_000}
          upload={{ progress, onCancel: () => undefined }}
        />
        <CnDocCard name="Inventario.csv" upload={{ label: "Procesando…" }} />
        <CnDocCard
          name="Factura A-1024.xml"
          size={22_000}
          error="El archivo supera el tamaño permitido (10 MB)."
          onRetry={() => undefined}
          onRemove={() => undefined}
        />
        <Box
          sx={{
            display: "grid",
            gap: "12px",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          }}
        >
          <CnDocCard layout="grid" name="Plano.png" upload={{ progress }} />
          <CnDocCard layout="grid" name="Plano v2.png" error onRetry={() => undefined} />
        </Box>
      </Box>
    );
  },
};

/** Documentos en una sección con selección múltiple y acciones en lote. */
export const DocumentsGrid: Story = {
  parameters: { fullWidth: true },
  render: function Render() {
    const [selected, setSelected] = useState<string[]>([]);
    const [layout, setLayout] = useState<"grid" | "list">("grid");
    const toggle = (id: string, value: boolean) =>
      setSelected((prev) => (value ? [...prev, id] : prev.filter((x) => x !== id)));
    return (
      <CnSectionCard
        title="Documentos del cliente"
        subtitle="Acme Comercializadora del Centro"
        icon="folder_shared"
        badge={DOCS.length}
        headerActions={
          <>
            {selected.length > 0 && (
              <CnButton size="small" variant="outlined" startIcon="download">
                Descargar ({selected.length})
              </CnButton>
            )}
            <CnButton
              iconOnly
              size="small"
              variant="text"
              color="neutral"
              icon={layout === "grid" ? "view_list" : "grid_view"}
              aria-label={layout === "grid" ? "Ver como lista" : "Ver como cuadrícula"}
              onClick={() => setLayout(layout === "grid" ? "list" : "grid")}
            />
            <CnButton size="small" startIcon="upload">
              Subir
            </CnButton>
          </>
        }
      >
        <Box
          sx={
            layout === "grid"
              ? {
                  display: "grid",
                  gap: "12px",
                  gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
                }
              : { display: "grid", gap: "8px" }
          }
        >
          {DOCS.map(({ id, ...doc }) => (
            <CnDocCard
              key={id}
              {...doc}
              layout={layout}
              selectable
              selected={selected.includes(id)}
              onSelectedChange={(value) => toggle(id, value)}
              onShare={() => undefined}
              menuActions={menuActions}
            />
          ))}
        </Box>
      </CnSectionCard>
    );
  },
};

export const Draggable: Story = {
  render: function Render() {
    const [docs, setDocs] = useState(DOCS.slice(0, 4));
    const [dragging, setDragging] = useState<number | null>(null);
    return (
      <Box sx={{ display: "grid", gap: "8px" }}>
        {docs.map(({ id, ...doc }, index) => (
          <Box
            key={id}
            draggable
            onDragStart={() => setDragging(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragging === null) return;
              const next = [...docs];
              const [moved] = next.splice(dragging, 1);
              next.splice(index, 0, moved);
              setDocs(next);
              setDragging(null);
            }}
          >
            <CnDocCard {...doc} draggable layout="list" />
          </Box>
        ))}
      </Box>
    );
  },
};

export const Skeleton: Story = {
  parameters: { fullWidth: true },
  render: () => (
    <Box sx={{ display: "grid", gap: "16px" }}>
      <Box sx={{ display: "grid", gap: "8px" }}>
        <CnDocCard name="x" status="y" tags={["a", "b"]} skeleton />
        <CnDocCardSkeleton selectable draggable status />
        <CnDocCardSkeleton layout="compact" actions={2} />
      </Box>
      <Box
        sx={{
          display: "grid",
          gap: "12px",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        }}
      >
        {Array.from({ length: 4 }, (_, i) => (
          <CnDocCardSkeleton key={i} layout="grid" tags={i % 3} selectable />
        ))}
      </Box>
    </Box>
  ),
};

const STRESS: (CnDocCardProps & { id: string })[] = [
  {
    id: "s1",
    name: "Contrato marco de prestación de servicios profesionales Acme Comercializadora del Centro SA de CV 2026 - versión firmada.pdf",
    url: "https://example.com/contrato.pdf",
    size: 4_812_000,
    pages: 38,
    updatedAt: hoursAgo(3),
    updatedBy: {
      name: "María Fernanda de los Ángeles Gutiérrez Villaseñor",
      avatarUrl: "https://i.pravatar.cc/150?img=9",
    },
    status: { label: "Pendiente de firma del representante legal", color: "warning" },
    tags: ["Legal", "Clientes", "Contratos marco", "2026", "Firmas", "Urgente"],
    version: "v12.4-final",
    description:
      "Documento con las cláusulas de confidencialidad, penalizaciones y anexos técnicos acordados con el área de compras.",
  },
  {
    id: "s2",
    name: "fotografia_del_inmueble_fachada_principal_tomada_con_dron_alta_resolucion.jpg",
    mime: "image/jpeg",
    url: "https://picsum.photos/id/1040/600/400",
    size: 3_200_000,
    upload: { progress: 64, onCancel: () => undefined },
    onRemove: () => undefined,
  },
  {
    id: "s3",
    name: "Factura_A-000000001024_CFDI_4.0_timbrada_con_complemento_de_pago.xml",
    size: 22_000,
    error:
      "No se pudo procesar: el XML no cumple con el esquema del SAT (nodo cfdi:Complemento inválido).",
    onRetry: () => undefined,
    onRemove: () => undefined,
  },
  { id: "s4", name: "a" },
];

/** Datos extremos (nombres de 100+ caracteres, muchas etiquetas, error largo, cero datos) en 320, 480 y 1200 px. */
export const Responsive: Story = {
  parameters: { fullWidth: true },
  render: () => (
    <WidthFrames>
      {() => (
        <Box sx={{ display: "grid", gap: "16px" }}>
          <Box sx={{ display: "grid", gap: "8px" }}>
            {STRESS.map(({ id, ...doc }) => (
              <CnDocCard
                key={id}
                {...doc}
                selectable
                draggable
                onShare={() => undefined}
                menuActions={menuActions}
              />
            ))}
          </Box>
          <Box sx={{ display: "grid", gap: "4px" }}>
            {STRESS.map(({ id, ...doc }) => (
              <CnDocCard key={id} {...doc} layout="compact" onShare={() => undefined} />
            ))}
          </Box>
          <Box
            sx={{
              display: "grid",
              gap: "12px",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 190px), 1fr))",
            }}
          >
            {STRESS.map(({ id, ...doc }) => (
              <CnDocCard
                key={id}
                {...doc}
                layout="grid"
                selectable
                draggable
                menuActions={menuActions}
              />
            ))}
          </Box>
        </Box>
      )}
    </WidthFrames>
  ),
};

/** Flujo de subida con `CnFileField` que termina como `CnDocCard` en el expediente. */
export const FileFieldVsDocCard: Story = {
  name: "FileField vs DocCard",
  parameters: { fullWidth: true },
  render: () => <FileFieldVsDocCardDemo />,
};

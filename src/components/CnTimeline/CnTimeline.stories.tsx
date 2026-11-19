import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { CnTimelineItem } from "./CnTimeline";
import { CnTimeline } from "./CnTimeline";
import { CnTimelineSkeleton } from "./CnTimelineSkeleton";

const DESCRIPTION = `
**Para qué sirve.** Historial de actividad, bitácora/auditoría y seguimiento de procesos: eventos ordenados en el tiempo con marcador (ícono, avatar o punto con tono), título, autor, descripción plegable ("Ver más"), metadatos, adjuntos, etiquetas y acciones; tiempo relativo + absoluto (\`<time>\` con la fecha completa), agrupación por día ("Hoy", "Ayer", fecha), estados \`completed\`/\`current\`/\`pending\`/\`error\` para seguimiento, orientación vertical (izquierda, derecha, alterna) u horizontal, paginado local o del servidor y skeleton. En contenedores angostos, horizontal y alterno pasan solos a vertical.

**Cuándo NO usarlo.** Para una lista de elementos sin dimensión temporal (o que el usuario selecciona/ordena) usa \`CnList\`; para pasos de un formulario usa los pasos de \`CnForm\`; para notificaciones con leído/no leído usa \`CnNotificationCenter\`; para eventos en un calendario, \`CnEventCalendar\`.

**Relación con vecinos.** Comparte el formato de tiempo de \`CnList\` y las utilidades de fecha con \`CnNotificationCenter\`. Suele mostrarse dentro de \`CnDrawer\` (detalle de un registro) o \`CnSectionCard\`.
`;

const meta: Meta<typeof CnTimeline> = {
  title: "Data Display/CnTimeline",
  component: CnTimeline,
  tags: ["autodocs"],
  parameters: { layout: "padded", docs: { description: { component: DESCRIPTION } } },
  argTypes: {
    orientation: { control: "inline-radio", options: ["vertical", "horizontal"] },
    align: { control: "inline-radio", options: ["left", "right", "alternate"] },
    size: { control: "inline-radio", options: ["sm", "md"] },
    timeFormat: { control: "inline-radio", options: ["auto", "relative", "absolute", "time"] },
  },
};

const narrow = [(Story: () => JSX.Element) => <Box sx={{ maxWidth: 720 }}>{Story()}</Box>];

export default meta;
type Story = StoryObj<typeof CnTimeline>;

const now = Date.now();
const ago = (minutes: number) => new Date(now - minutes * 60000);

const AUDIT: CnTimelineItem[] = [
  {
    id: "1",
    title: "Contrato actualizado",
    time: ago(12),
    icon: "edit",
    tone: "info",
    actor: "Ana López",
    tags: ["Contratos", { label: "Monto", color: "warning" }],
    description:
      "Se modificó el monto total del contrato de $120,000.00 a $135,500.00 MXN por ampliación de alcance. El cambio fue aprobado por la dirección de compras y queda pendiente la firma del proveedor. Se notificó automáticamente al área jurídica y al responsable del presupuesto para que validen la partida presupuestal correspondiente antes del cierre del mes.",
    metadata: [
      { label: "Campo", value: "Monto total" },
      { label: "Antes", value: "$120,000.00" },
      { label: "Después", value: "$135,500.00" },
    ],
    actions: [{ label: "Ver diferencias", icon: "sync_alt" }],
  },
  {
    id: "2",
    title: "Documento adjuntado",
    time: ago(95),
    icon: "attach_file",
    tone: "primary",
    actor: "Carlos Méndez",
    attachments: [
      { name: "contrato-ampliacion-v2.pdf", size: "1.2 MB", href: "#" },
      { name: "anexo-tecnico.xlsx", size: "340 KB", href: "#" },
    ],
  },
  {
    id: "3",
    title: "Inicio de sesión desde un dispositivo nuevo",
    time: ago(60 * 26),
    icon: "security",
    tone: "warning",
    description: "Chrome en Windows · Monterrey, N.L. · IP 187.190.12.4",
  },
  {
    id: "4",
    title: "Usuario eliminado",
    time: ago(60 * 24 * 3),
    icon: "person_remove",
    tone: "error",
    actor: "Sistema",
  },
  {
    id: "5",
    title: "Contrato creado",
    time: ago(60 * 24 * 12),
    avatar: { name: "Ana López" },
    actor: "Ana López",
  },
];

export const Default: Story = {
  decorators: narrow,
  args: { items: AUDIT },
};

/** Bitácora agrupada por día con hora de cada evento. */
export const GroupedByDay: Story = {
  decorators: narrow,
  args: { items: AUDIT, groupByDay: true, timeFormat: "time" },
};

/** Seguimiento de un pedido con estados. */
export const Tracking: Story = {
  decorators: narrow,
  args: {
    items: [
      {
        id: "a",
        title: "Pedido recibido",
        status: "completed",
        time: ago(60 * 30),
        description: "Pago confirmado.",
      },
      { id: "b", title: "Preparando envío", status: "completed", time: ago(60 * 8) },
      {
        id: "c",
        title: "En camino",
        status: "current",
        time: ago(45),
        description: "Paquetería: Estafeta · Guía 8812 3345 0012",
      },
      { id: "d", title: "Entregado", status: "pending", timeLabel: "Estimado: mañana" },
    ],
  },
};

export const Horizontal: Story = {
  args: { ...Tracking.args, orientation: "horizontal" },
};

export const AlternateAndRight: Story = {
  decorators: narrow,
  render: () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <CnTimeline items={AUDIT.slice(0, 4)} align="alternate" />
      <CnTimeline items={AUDIT.slice(0, 3)} align="right" size="sm" />
    </Box>
  ),
};

/** "Ver más (n)" local y luego carga del servidor. */
export const LoadMore: Story = {
  decorators: narrow,
  render: function Render() {
    const [items, setItems] = useState(AUDIT);
    const [loading, setLoading] = useState(false);
    return (
      <CnTimeline
        items={items}
        initialVisible={3}
        hasMore={items.length < 12}
        loadingMore={loading}
        onLoadMore={() => {
          setLoading(true);
          setTimeout(() => {
            setItems((prev) => [
              ...prev,
              ...Array.from({ length: 3 }, (_, i) => ({
                id: `old-${prev.length + i}`,
                title: `Evento anterior #${prev.length + i + 1}`,
                time: ago(60 * 24 * (20 + prev.length + i)),
                icon: "history",
              })),
            ]);
            setLoading(false);
          }, 900);
        }}
      />
    );
  },
};

export const EmptyAndSkeleton: Story = {
  decorators: narrow,
  render: () => (
    <Box sx={{ display: "grid", gap: "24px" }}>
      <CnTimeline items={[]} />
      <CnTimeline items={AUDIT} skeleton groupByDay />
      <CnTimelineSkeleton orientation="horizontal" count={4} />
      <CnTimelineSkeleton align="alternate" count={4} />
    </Box>
  ),
};

const EXTREME: CnTimelineItem[] = [
  {
    id: "x1",
    title:
      "Actualización masiva del catálogo de productos de la sucursal Monterrey Centro con nuevos precios, impuestos y descuentos por volumen",
    time: ago(5),
    icon: "inventory",
    tone: "info",
    actor: "María Fernanda de la Garza Villarreal Santos de Montemayor",
    tags: Array.from({ length: 10 }, (_, i) => `Etiqueta número ${i + 1}`),
    description:
      "Correo: responsable.de.compras.regionales@comercializadora-del-centro-y-bajio.com.mx " +
      "Texto largo ".repeat(40),
    metadata: [
      {
        label: "URL",
        value:
          "https://erp.ejemplo.com.mx/catalogo/productos/actualizacion-masiva/2026/11/19/lote-0001234",
      },
    ],
    attachments: [
      {
        name: "catalogo_de_productos_monterrey_centro_noviembre_2026_version_final_definitiva.xlsx",
        size: "12.4 MB",
      },
    ],
    actions: [{ label: "Ver detalle completo del lote" }, { label: "Revertir cambios" }],
  },
  { id: "x2", title: "Sin fecha", status: "pending" },
];

/**
 * Stress: 320, 480 y 1200 px con datos extremos; horizontal y alterno
 * colapsan a vertical en contenedores angostos.
 */
export const Responsive: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "24px", p: "16px" }}>
      {[320, 480, 1200].map((w) => (
        <Box key={w}>
          <Box sx={{ fontSize: 12, mb: "6px", color: "var(--cn-color-text-muted, #6e7682)" }}>
            {w}px
          </Box>
          <Box
            data-stress-container={w}
            sx={{
              width: w,
              maxWidth: "100%",
              border: "1px dashed var(--cn-color-border-strong, #c5cad0)",
              p: "8px",
              boxSizing: "border-box",
              display: "grid",
              gap: "24px",
            }}
          >
            <CnTimeline items={[...EXTREME, ...AUDIT.slice(0, 2)]} groupByDay />
            <CnTimeline items={[...EXTREME, ...AUDIT.slice(0, 2)]} align="alternate" />
            <CnTimeline items={[...(Tracking.args!.items ?? [])]} orientation="horizontal" />
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

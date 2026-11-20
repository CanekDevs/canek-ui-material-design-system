import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { useMemo, useState } from "react";
import { catalogDocs } from "../../catalog";
import { CnButton } from "../CnButton";
import { CnTimeline } from "./CnTimeline";
import type { CnTimelineItem } from "./CnTimeline.types";
import { CnTimelineSkeleton } from "./CnTimelineSkeleton";
import { timelineFiltersBy } from "./timeline-filters";

const meta: Meta<typeof CnTimeline> = {
  title: "Data Display/CnTimeline",
  component: CnTimeline,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: catalogDocs("CnTimeline") } },
  },
  argTypes: {
    orientation: { control: "inline-radio", options: ["vertical", "horizontal"] },
    align: { control: "inline-radio", options: ["left", "right", "alternate"] },
    size: { control: "inline-radio", options: ["sm", "md"] },
    timeFormat: { control: "inline-radio", options: ["auto", "relative", "absolute", "time"] },
    attachmentsLayout: { control: "inline-radio", options: ["chips", "cards"] },
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
    type: "Cambio",
    actor: "Ana López",
    tags: ["Contratos", { label: "Monto", color: "warning" }],
    description:
      "Se modificó el monto total del contrato por ampliación de alcance. El cambio fue aprobado por la dirección de compras y queda pendiente la firma del proveedor. Se notificó automáticamente al área jurídica y al responsable del presupuesto para que validen la partida presupuestal correspondiente antes del cierre del mes.",
    changes: [
      { field: "Monto total", before: "$120,000.00", after: "$135,500.00" },
      { field: "Vigencia", before: "31/12/2026", after: "31/03/2027" },
      { field: "Observaciones", before: null, after: "Ampliación aprobada" },
    ],
    actions: [{ label: "Revertir", icon: "undo" }],
  },
  {
    id: "2",
    title: "Documento adjuntado",
    time: ago(95),
    icon: "attach_file",
    tone: "primary",
    type: "Documento",
    actor: "Carlos Méndez",
    attachments: [
      {
        name: "contrato-ampliacion-v2.pdf",
        size: "1.2 MB",
        bytes: 1258291,
        mime: "application/pdf",
        href: "#",
      },
      {
        name: "anexo-tecnico.xlsx",
        size: "340 KB",
        bytes: 348160,
        mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        href: "#",
      },
    ],
  },
  {
    id: "3",
    title: "Inicio de sesión desde un dispositivo nuevo",
    time: ago(60 * 26),
    icon: "security",
    tone: "warning",
    type: "Acceso",
    actor: "Ana López",
    description: "Chrome en Windows · Monterrey, N.L. · IP 187.190.12.4",
  },
  {
    id: "4",
    title: "Usuario eliminado",
    time: ago(60 * 24 * 3),
    icon: "person_remove",
    tone: "error",
    type: "Acceso",
    actor: "Sistema",
  },
  {
    id: "5",
    title: "Contrato creado",
    time: ago(60 * 24 * 12),
    avatar: { name: "Ana López" },
    type: "Cambio",
    actor: "Ana López",
  },
];

export const Default: Story = {
  decorators: narrow,
  args: { items: AUDIT },
};

/**
 * Bitácora de auditoría: búsqueda, filtros por tipo y autor, cambios
 * antes → después, encabezados de día fijos, "Expandir todo" y exportación.
 */
export const AuditLog: Story = {
  decorators: narrow,
  render: function Render() {
    const filters = useMemo(
      () => [...timelineFiltersBy(AUDIT, "type"), ...timelineFiltersBy(AUDIT, "actor")],
      [],
    );
    return (
      <Box sx={{ maxHeight: 520, overflow: "auto", pr: "8px" }}>
        <CnTimeline
          items={AUDIT}
          groupByDay
          stickyHeaders
          timeFormat="time"
          searchable
          filters={filters}
          expandToggle
          exportable
          exportFileName="bitacora-contrato"
          ariaLabel="Bitácora del contrato"
        />
      </Box>
    );
  },
};

/** Conversación sobre un registro: comentarios en burbuja con "Responder". */
export const Comments: Story = {
  decorators: narrow,
  render: function Render() {
    const [items, setItems] = useState<CnTimelineItem[]>([
      {
        id: "c1",
        kind: "comment",
        title: "Ana López comentó",
        avatar: { name: "Ana López" },
        time: ago(30),
        description: "¿Podemos adelantar la entrega al viernes? El cliente lo pidió esta mañana.",
      },
      {
        id: "c2",
        kind: "comment",
        title: "Carlos Méndez comentó",
        avatar: { name: "Carlos Méndez" },
        time: ago(18),
        description: "Sí, solo falta confirmar el transporte. Lo reviso y te aviso.",
      },
      { id: "e1", title: "Estado cambiado a «En revisión»", icon: "sync_alt", time: ago(10) },
    ]);
    return (
      <CnTimeline
        items={items}
        onReply={(item, text) =>
          new Promise<void>((resolve) =>
            setTimeout(() => {
              setItems((prev) => [
                ...prev,
                {
                  id: `r-${prev.length}`,
                  kind: "comment",
                  title: `Tú respondiste a ${String(item.title).replace(" comentó", "")}`,
                  avatar: { name: "Tú" },
                  time: new Date(),
                  description: text,
                },
              ]);
              resolve();
            }, 700),
          )
        }
      />
    );
  },
};

const TRACKING: CnTimelineItem[] = [
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
];

/** Seguimiento de un pedido con estados, avance y fecha estimada. */
export const Tracking: Story = {
  decorators: narrow,
  args: { items: TRACKING, showProgress: true, eta: "Entrega estimada: mañana, 10:00–14:00" },
};

export const Horizontal: Story = {
  args: { ...Tracking.args, orientation: "horizontal" },
};

/** Un paso con error: el conector y la barra de avance toman el color de error. */
export const TrackingWithError: Story = {
  decorators: narrow,
  args: {
    showProgress: true,
    items: [
      TRACKING[0],
      TRACKING[1],
      {
        id: "x",
        title: "Entrega fallida",
        status: "error",
        time: ago(20),
        description: "Domicilio cerrado. Se reintentará el siguiente día hábil.",
      },
      { id: "d", title: "Entregado", status: "pending" },
    ],
  },
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

/** Adjuntos como tarjetas de archivo (`CnDocCard`). */
export const AttachmentCards: Story = {
  decorators: narrow,
  args: { items: AUDIT.slice(1, 2), attachmentsLayout: "cards" },
};

const LONG: CnTimelineItem[] = Array.from({ length: 400 }, (_, i) => ({
  id: `l${i}`,
  title: i % 7 === 0 ? `Factura F-${2000 + i} cancelada` : `Factura F-${2000 + i} timbrada`,
  time: ago(i * 47),
  icon: i % 7 === 0 ? "block" : "receipt",
  tone: i % 7 === 0 ? "error" : "success",
  type: i % 7 === 0 ? "Cancelación" : "Timbrado",
  actor: i % 3 === 0 ? "Sistema" : "Ana López",
  description: i % 5 === 0 ? "Se envió el comprobante por correo al cliente." : undefined,
}));

/**
 * Enlace profundo: `highlightId` amplía el paginado si hace falta, desplaza
 * el evento a la vista y lo resalta (sin animación si se pide movimiento reducido).
 */
export const DeepLink: Story = {
  decorators: narrow,
  render: function Render() {
    const [target, setTarget] = useState<string | null>(null);
    return (
      <Box sx={{ display: "grid", gap: "12px" }}>
        <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["l3", "l42", "l180"].map((id) => (
            <CnButton key={id} size="small" variant="outlined" onClick={() => setTarget(id)}>
              Ir a #{id}
            </CnButton>
          ))}
        </Box>
        <Box sx={{ maxHeight: 420, overflow: "auto", pr: "8px" }}>
          <CnTimeline
            items={LONG}
            initialVisible={20}
            highlightId={target}
            groupByDay
            stickyHeaders
          />
        </Box>
      </Box>
    );
  },
};

/**
 * Historial largo (400 eventos): los elementos fuera de pantalla no se
 * pintan (`content-visibility`) y la búsqueda/filtros reducen la lista.
 */
export const LongHistory: Story = {
  decorators: narrow,
  render: function Render() {
    const filters = useMemo(() => timelineFiltersBy(LONG, "type"), []);
    return (
      <Box sx={{ maxHeight: 520, overflow: "auto", pr: "8px" }}>
        <CnTimeline
          items={LONG}
          size="sm"
          groupByDay
          stickyHeaders
          searchable
          filters={filters}
          exportable={["csv"]}
        />
      </Box>
    );
  },
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

export const EmptyLoadingError: Story = {
  decorators: narrow,
  render: () => (
    <Box sx={{ display: "grid", gap: "24px" }}>
      <CnTimeline items={[]} />
      <CnTimeline
        items={[]}
        error="Revisa tu conexión e inténtalo de nuevo."
        onRetry={() => undefined}
      />
      <CnTimeline items={AUDIT} skeleton groupByDay searchable />
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
    type: "Catálogo de productos de la sucursal Monterrey Centro",
    actor: "María Fernanda de la Garza Villarreal Santos de Montemayor",
    tags: Array.from({ length: 10 }, (_, i) => `Etiqueta número ${i + 1}`),
    description:
      "Correo: responsable.de.compras.regionales@comercializadora-del-centro-y-bajio.com.mx " +
      "Texto largo ".repeat(40),
    changes: [
      {
        field: "Descripción_del_producto_en_el_catálogo_regional",
        before: "Tornillo_hexagonal_galvanizado_de_media_pulgada_por_tres_pulgadas",
        after: "Tornillo_hexagonal_galvanizado_de_media_pulgada_por_cuatro_pulgadas_con_tuerca",
      },
    ],
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
        bytes: 13002342,
      },
    ],
    actions: [{ label: "Ver detalle completo del lote" }, { label: "Revertir cambios" }],
  },
  {
    id: "x2",
    kind: "comment",
    title: "Comentario",
    avatar: { name: "María Fernanda" },
    time: ago(3),
    description: "Sin_espacios_".repeat(20),
  },
  { id: "x3", title: "Sin fecha", status: "pending" },
];

const STRESS_ITEMS = [...EXTREME, ...AUDIT.slice(0, 2)];
const STRESS_FILTERS = timelineFiltersBy(STRESS_ITEMS, "type");

/**
 * Stress: 320, 480 y 1200 px con datos extremos, barra completa (búsqueda,
 * filtros, exportar), avance y adjuntos en tarjeta; horizontal y alterno
 * colapsan a vertical en contenedores angostos.
 */
export const Responsive: Story = {
  parameters: { layout: "fullscreen" },
  render: () => {
    const items = STRESS_ITEMS;
    const filters = STRESS_FILTERS;
    return (
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
              <CnTimeline
                items={items}
                groupByDay
                searchable
                filters={filters}
                expandToggle
                exportable
                attachmentsLayout="cards"
                onReply={() => undefined}
              />
              <CnTimeline items={items} align="alternate" />
              <CnTimeline
                items={TRACKING}
                orientation="horizontal"
                showProgress
                eta="Entrega estimada: mañana entre las 10:00 y las 14:00 horas"
              />
            </Box>
          </Box>
        ))}
      </Box>
    );
  },
};

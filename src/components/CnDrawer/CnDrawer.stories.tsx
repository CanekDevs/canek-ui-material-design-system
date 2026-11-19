import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import { CnButton } from "../CnButton";
import { CnDataTable } from "../CnDataTable";
import { CnDrawer } from "./CnDrawer";
import type { CnDrawerAnchor, CnDrawerSize } from "./CnDrawer";
import { CnDrawerSkeleton } from "./CnDrawerSkeleton";

const DESCRIPTION = `
**Para qué sirve.** Panel lateral (izquierda, derecha o abajo) para trabajar sin perder de vista la página: detalle de una fila de tabla, filtros, edición rápida, bitácora, carrito. Variantes \`temporary\` (modal), \`persistent\` (empuja el contenido) y \`mini\` (franja con íconos al contraerse); tamaños \`sm\`–\`xl\`/\`full\` o medida propia, ancho ajustable arrastrando el borde (\`resizable\`, también con teclado), paneles anidados con \`onBack\`, y el mismo encabezado, cuerpo con scroll, pie con acciones, \`loading\`/\`skeleton\` y "¿Descartar cambios?" que \`CnDialog\`.

**Cuándo NO usarlo.** Si la tarea exige toda la atención o es corta y bloqueante, usa \`CnDialog\`; para confirmar una acción, \`CnConfirmDialog\`. Para navegación principal de la app usa el layout/menú de la aplicación, no un drawer de contenido.

**Relación con vecinos.** Reutiliza las piezas de \`CnDialog\` (encabezado, pie, guarda de cambios con \`CnConfirmDialog\`). Combina con \`CnDataTable\` (\`onRowClick\` → abrir el detalle) y \`CnTimeline\` (historial dentro del panel). \`CnNotificationCenter\` lo usa como panel en móvil.
`;

const meta: Meta<typeof CnDrawer> = {
  title: "Overlays/CnDrawer",
  component: CnDrawer,
  tags: ["autodocs"],
  parameters: { layout: "padded", docs: { description: { component: DESCRIPTION } } },
};

export default meta;
type Story = StoryObj<typeof CnDrawer>;

const TEXT =
  "El pedido se surte desde el almacén Querétaro. Las partidas con existencia parcial se enviarán en una segunda entrega sin costo adicional.";
const Paragraphs = ({ count = 6 }: { count?: number }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <p key={i} style={{ margin: "0 0 12px" }}>
        {TEXT}
      </p>
    ))}
  </>
);

export const Default: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <CnButton onClick={() => setOpen(true)}>Abrir panel</CnButton>
        <CnDrawer
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          title="Pedido PO-2026-0119"
          subtitle="Papelería del Bajío · 12 partidas"
          icon="local_shipping"
          actions={[
            { label: "Cerrar", variant: "secondary", closes: true },
            { label: "Aprobar", variant: "primary", icon: "check", closes: true },
          ]}
        >
          <Paragraphs count={10} />
        </CnDrawer>
      </>
    );
  },
};

export const AnchorsAndSizes: Story = {
  render: function Render() {
    const [state, setState] = useState<{ anchor: CnDrawerAnchor; size: CnDrawerSize } | null>(null);
    return (
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {(["left", "right", "bottom"] as const).flatMap((anchor) =>
          (["sm", "md", "lg"] as const).map((size) => (
            <CnButton
              key={anchor + size}
              variant="outlined"
              onClick={() => setState({ anchor, size })}
            >
              {anchor} · {size}
            </CnButton>
          )),
        )}
        <CnDrawer
          open={state !== null}
          anchor={state?.anchor ?? "right"}
          size={state?.size ?? "md"}
          onClose={() => setState(null)}
          title={`Panel ${state?.anchor} ${state?.size}`}
          icon="view_column"
        >
          <Paragraphs count={3} />
        </CnDrawer>
      </Box>
    );
  },
};

/** Arrastra el borde izquierdo (o enfócalo y usa ← →, Inicio, Fin). Doble clic restablece. */
export const Resizable: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [width, setWidth] = useState(480);
    return (
      <>
        <CnButton onClick={() => setOpen(true)}>Abrir ({width}px)</CnButton>
        <CnDrawer
          open={open}
          onClose={() => setOpen(false)}
          resizable
          resizeValue={width}
          onResize={setWidth}
          minSize={320}
          maxSize={960}
          title="Vista previa del documento"
          subtitle={`${width}px`}
          icon="description"
        >
          <Paragraphs count={8} />
        </CnDrawer>
      </>
    );
  },
};

/** Persistente: vive en el flujo y empuja el contenido; no bloquea la página. */
export const Persistent: Story = {
  render: function Render() {
    const [open, setOpen] = useState(true);
    return (
      <Box
        sx={{
          display: "flex",
          height: 420,
          border: "1px solid var(--cn-color-border, #dde0e4)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0, p: "16px", overflow: "auto" }}>
          <CnButton variant="outlined" startIcon="tune" onClick={() => setOpen((v) => !v)}>
            {open ? "Ocultar filtros" : "Mostrar filtros"}
          </CnButton>
          <Paragraphs count={4} />
        </Box>
        <CnDrawer
          variant="persistent"
          open={open}
          onClose={() => setOpen(false)}
          size="sm"
          resizable
          title="Filtros"
          icon="tune"
          actions={[
            { label: "Limpiar", variant: "text" },
            { label: "Aplicar", variant: "primary" },
          ]}
        >
          <Paragraphs count={3} />
        </CnDrawer>
      </Box>
    );
  },
};

/** Mini: al contraerse deja una franja con íconos (`miniContent`). */
export const Mini: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    const icons = ["dashboard", "receipt_long", "people", "settings"];
    return (
      <Box
        sx={{
          display: "flex",
          height: 380,
          border: "1px solid var(--cn-color-border, #dde0e4)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <CnDrawer
          variant="mini"
          anchor="left"
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          size={260}
          title="Atajos"
          icon="apps"
          miniContent={icons.map((icon) => (
            <CnButton
              key={icon}
              iconOnly
              icon={icon}
              size="small"
              variant="text"
              color="neutral"
              aria-label={icon}
            />
          ))}
        >
          {icons.map((icon) => (
            <CnButton
              key={icon}
              fullWidth
              variant="text"
              color="neutral"
              startIcon={icon}
              sx={{ justifyContent: "flex-start" }}
            >
              {icon}
            </CnButton>
          ))}
        </CnDrawer>
        <Box sx={{ flex: 1, minWidth: 0, p: "16px" }}>
          <Paragraphs count={2} />
        </Box>
      </Box>
    );
  },
};

/** Paneles anidados: el segundo queda encima y tiene "Regresar". */
export const Nested: Story = {
  render: function Render() {
    const [first, setFirst] = useState(false);
    const [second, setSecond] = useState(false);
    return (
      <>
        <CnButton onClick={() => setFirst(true)}>Abrir pedido</CnButton>
        <CnDrawer
          open={first}
          onClose={() => setFirst(false)}
          size="lg"
          title="Pedido PO-2026-0119"
          icon="local_shipping"
          actions={[
            {
              label: "Ver proveedor",
              variant: "secondary",
              icon: "store",
              onClick: () => setSecond(true),
            },
          ]}
        >
          <Paragraphs count={4} />
        </CnDrawer>
        <CnDrawer
          open={second}
          onClose={() => setSecond(false)}
          onBack={() => setSecond(false)}
          size="sm"
          title="Papelería del Bajío"
          subtitle="Proveedor"
          icon="store"
        >
          <Paragraphs count={2} />
        </CnDrawer>
      </>
    );
  },
};

type Row = { id: string; folio: string; cliente: string; total: number; estado: string };
const ROWS: Row[] = Array.from({ length: 8 }, (_, i) => ({
  id: String(i + 1),
  folio: `A-${1020 + i}`,
  cliente: [
    "Acme S.A. de C.V.",
    "Grupo Industrial del Norte",
    "Papelería del Bajío",
    "Comercializadora Centro",
  ][i % 4],
  total: 1250 * (i + 1),
  estado: ["Pagada", "Pendiente", "Vencida"][i % 3],
}));

/** Caso de uso: clic en una fila de `CnDataTable` abre su detalle en el panel (con carga). */
export const DetailPanel: Story = {
  render: function Render() {
    const [row, setRow] = useState<Row | null>(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
      if (!row) return;
      setLoading(true);
      const t = setTimeout(() => setLoading(false), 900);
      return () => clearTimeout(t);
    }, [row]);
    return (
      <>
        <CnDataTable<Row>
          title="Facturas"
          data={ROWS}
          onRowClick={setRow}
          columns={[
            { id: "folio", header: "Folio" },
            { id: "cliente", header: "Cliente" },
            { id: "total", header: "Total", type: "currency", align: "right" },
            { id: "estado", header: "Estado" },
          ]}
        />
        <CnDrawer
          open={row !== null}
          onClose={() => setRow(null)}
          resizable
          title={row ? `Factura ${row.folio}` : ""}
          subtitle={row?.cliente}
          icon="receipt_long"
          loading={loading}
          loadingSkeleton={{ lines: 2, fields: 3 }}
          actions={[
            { label: "Descargar", variant: "secondary", icon: "download" },
            { label: "Registrar pago", variant: "primary", icon: "payments" },
          ]}
        >
          {row && (
            <Box
              component="dl"
              sx={{
                display: "grid",
                gridTemplateColumns: "max-content 1fr",
                gap: "8px 16px",
                m: 0,
              }}
            >
              <dt>Folio</dt>
              <dd style={{ margin: 0 }}>{row.folio}</dd>
              <dt>Cliente</dt>
              <dd style={{ margin: 0 }}>{row.cliente}</dd>
              <dt>Total</dt>
              <dd style={{ margin: 0 }}>${row.total.toLocaleString("es-MX")}</dd>
              <dt>Estado</dt>
              <dd style={{ margin: 0 }}>{row.estado}</dd>
            </Box>
          )}
        </CnDrawer>
      </>
    );
  },
};

/** Edición con "¿Descartar cambios?" al cerrar con cambios. */
export const DirtyGuard: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [notes, setNotes] = useState("");
    return (
      <>
        <CnButton onClick={() => setOpen(true)}>Editar notas</CnButton>
        <CnDrawer
          open={open}
          dirty={notes !== ""}
          onClose={() => {
            setOpen(false);
            setNotes("");
          }}
          title="Notas internas"
          icon="edit_note"
          actions={[
            { label: "Cancelar", variant: "secondary", closes: true },
            {
              label: "Guardar",
              variant: "primary",
              closes: true,
              onClick: () => new Promise((r) => setTimeout(r, 800)),
            },
          ]}
        >
          <textarea
            aria-label="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={8}
            style={{ width: "100%", boxSizing: "border-box", font: "inherit" }}
          />
        </CnDrawer>
      </>
    );
  },
};

export const Skeleton: Story = {
  render: () => (
    <Box
      sx={{
        width: 360,
        height: 420,
        border: "1px solid var(--cn-color-border, #dde0e4)",
        borderRadius: "12px",
      }}
    >
      <CnDrawerSkeleton icon />
    </Box>
  ),
};

const WIDTHS = [320, 480, 1200];
const contained = {
  disablePortal: true,
  disableScrollLock: true,
  disableEnforceFocus: true,
  disableAutoFocus: true,
  disableRestoreFocus: true,
};

/**
 * Stress: panel temporal y persistente dentro de contenedores de 320, 480 y
 * 1200 px, con título de 3 líneas, cadenas largas y acciones largas.
 */
export const Responsive: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "24px", p: "16px" }}>
      {WIDTHS.map((w) => (
        <Box key={w}>
          <Box sx={{ fontSize: 12, mb: "6px", color: "var(--cn-color-text-muted, #6e7682)" }}>
            {w}px
          </Box>
          <Box
            data-stress-container={w}
            sx={{
              position: "relative",
              transform: "translateZ(0)",
              width: w,
              maxWidth: "100%",
              height: 460,
              overflow: "hidden",
              display: "flex",
              border: "1px dashed var(--cn-color-border-strong, #c5cad0)",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0, p: "8px", fontSize: 12, overflowWrap: "anywhere" }}>
              Contenido de la página
            </Box>
            <CnDrawer
              variant="persistent"
              open
              size={Math.min(w - 40, 440)}
              title="Detalle de la orden de compra para el proveedor Comercializadora Industrial del Centro y Bajío"
              subtitle="facturacion.proveedores.regionales@comercializadora-del-centro-y-bajio.com.mx"
              icon="local_shipping"
              actions={[
                { label: "Rechazar con comentarios", variant: "destructive", align: "start" },
                { label: "Aprobar y notificar al proveedor", variant: "primary" },
              ]}
            >
              <p style={{ marginTop: 0 }}>
                Adjunto: orden_de_compra_PO-2026-0119_papeleria_del_bajio_version_final_firmada.pdf
              </p>
              <Paragraphs count={4} />
            </CnDrawer>
            <CnDrawer
              open={w === 1200}
              drawerProps={contained}
              hideBackdrop
              anchor="left"
              size="sm"
              title="Temporal dentro del contenedor"
              actions={[{ label: "Cerrar", variant: "secondary" }]}
            >
              <Paragraphs count={2} />
            </CnDrawer>
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

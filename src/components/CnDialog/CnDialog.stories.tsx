import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { catalogDocs } from "../../catalog";
import { useEffect, useState } from "react";
import { CnButton } from "../CnButton";
import { CnTextField } from "../CnTextField";
import { CnDialog } from "./CnDialog";
import type { CnDialogProps } from "./CnDialog";
import { CnDialogSkeleton } from "./CnDialogSkeleton";
import { CnDialogProvider, useDialog } from "./useDialog";

const meta: Meta<typeof CnDialog> = {
  title: "Overlays/CnDialog",
  component: CnDialog,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: catalogDocs("CnDialog") } },
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg", "xl", "fullscreen"] },
    density: { control: "inline-radio", options: ["comfortable", "compact"] },
  },
};

export default meta;
type Story = StoryObj<typeof CnDialog>;

const LOREM =
  "Los cambios se aplicarán a todas las sucursales que usan esta lista de precios. Revisa los montos antes de guardar; podrás consultar el historial en la bitácora del producto.";

const Paragraphs = ({ count = 8 }: { count?: number }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <p key={i} style={{ margin: "0 0 12px" }}>
        {i + 1}. {LOREM}
      </p>
    ))}
  </>
);

const Opener = ({
  label = "Abrir diálogo",
  render,
}: {
  label?: string;
  render: (open: boolean, close: () => void) => React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <CnButton onClick={() => setOpen(true)}>{label}</CnButton>
      {render(open, () => setOpen(false))}
    </>
  );
};

export const Default: Story = {
  render: (args) => (
    <Opener
      render={(open, close) => (
        <CnDialog
          {...args}
          open={open}
          onClose={close}
          title="Detalle de la factura A-1024"
          subtitle="Acme Comercializadora del Centro, S.A. de C.V."
          icon="receipt_long"
          actions={[
            { label: "Cerrar", variant: "secondary", closes: true },
            { label: "Descargar PDF", variant: "primary", icon: "download" },
          ]}
        >
          <Paragraphs count={3} />
        </CnDialog>
      )}
    />
  ),
};

/** Encabezado y pie fijos; las sombras aparecen al desplazar el cuerpo. */
export const ScrollableBody: Story = {
  render: () => (
    <Opener
      render={(open, close) => (
        <CnDialog
          open={open}
          onClose={close}
          title="Términos del servicio"
          subtitle="Versión 4.2 · 19 nov 2026"
          icon="article"
          footerStart="Al aceptar confirmas que leíste el documento."
          actions={[
            { label: "Rechazar", variant: "text", closes: true },
            { label: "Aceptar", variant: "primary", closes: true },
          ]}
        >
          <Paragraphs count={20} />
        </CnDialog>
      )}
    />
  ),
};

export const Sizes: Story = {
  render: function Render() {
    const [size, setSize] = useState<CnDialogProps["size"] | null>(null);
    return (
      <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {(["sm", "md", "lg", "xl", "fullscreen"] as const).map((s) => (
          <CnButton key={s} variant="outlined" onClick={() => setSize(s)}>
            {s}
          </CnButton>
        ))}
        <CnDialog
          open={size !== null}
          size={size ?? "md"}
          onClose={() => setSize(null)}
          title={`Tamaño ${size}`}
          actions={[{ label: "Cerrar", variant: "primary", closes: true }]}
        >
          <Paragraphs count={2} />
        </CnDialog>
      </Box>
    );
  },
};

/** `fullScreenOnMobile`: pantalla completa por debajo de `sm` (prueba con el viewport móvil). */
export const FullScreenOnMobile: Story = {
  render: () => (
    <Opener
      render={(open, close) => (
        <CnDialog
          open={open}
          onClose={close}
          fullScreenOnMobile
          size="lg"
          title="Nuevo pedido"
          icon="shopping_cart"
          actions={[
            { label: "Cancelar", variant: "secondary", closes: true },
            { label: "Crear pedido", variant: "primary", closes: true },
          ]}
        >
          <Paragraphs count={6} />
        </CnDialog>
      )}
    />
  ),
};

/** Formulario: `onSubmit` + acción `submit`, carga, error del servidor y "¿Descartar cambios?". */
export const FormWithDirtyGuard: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const dirty = name !== "" || email !== "";
    const close = () => {
      setOpen(false);
      setName("");
      setEmail("");
    };
    return (
      <>
        <CnButton onClick={() => setOpen(true)} startIcon="person_add">
          Nuevo contacto
        </CnButton>
        <CnDialog
          open={open}
          onClose={close}
          dirty={dirty}
          size="sm"
          title="Nuevo contacto"
          subtitle="Escribe algo y cierra para ver la confirmación."
          icon="person_add"
          initialFocus="first-field"
          onSubmit={() =>
            new Promise((resolve, reject) =>
              setTimeout(
                () =>
                  email.includes("duplicado")
                    ? reject({ response: { data: { message: "Ese correo ya existe." } } })
                    : resolve(undefined),
                1200,
              ),
            )
          }
          closeOnSubmit
          actions={[
            { label: "Cancelar", variant: "secondary", closes: true },
            { label: "Guardar", variant: "primary", type: "submit", icon: "save" },
          ]}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: "16px", pt: "6px" }}>
            <CnTextField label="Nombre" value={name} onChange={(v) => setName(String(v ?? ""))} />
            <CnTextField
              label="Correo"
              helperText='Usa "duplicado" para simular un error del servidor.'
              value={email}
              onChange={(v) => setEmail(String(v ?? ""))}
            />
          </Box>
        </CnDialog>
      </>
    );
  },
};

/** Acciones primaria, secundaria y destructiva; la destructiva es asíncrona. */
export const ActionVariants: Story = {
  render: () => (
    <Opener
      render={(open, close) => (
        <CnDialog
          open={open}
          onClose={close}
          title="Usuario: Ana López"
          icon="manage_accounts"
          size="sm"
          actions={[
            {
              label: "Desactivar",
              variant: "destructive",
              icon: "block",
              align: "start",
              closes: true,
              onClick: () => new Promise((r) => setTimeout(r, 1200)),
            },
            { label: "Cancelar", variant: "text", closes: true },
            { label: "Guardar", variant: "primary", closes: true },
          ]}
        >
          Gestiona el acceso del usuario a los módulos de Facturación y Nómina.
        </CnDialog>
      )}
    />
  ),
};

/** Apertura asíncrona: el encabezado aparece de inmediato y el cuerpo muestra skeleton. */
export const AsyncLoading: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
      if (!open) return;
      setLoading(true);
      const t = setTimeout(() => setLoading(false), 1500);
      return () => clearTimeout(t);
    }, [open]);
    return (
      <>
        <CnButton onClick={() => setOpen(true)}>Ver detalle</CnButton>
        <CnDialog
          open={open}
          onClose={() => setOpen(false)}
          loading={loading}
          loadingSkeleton={{ lines: 2, fields: 3 }}
          title="Pedido PO-2026-0119"
          subtitle={loading ? "Cargando…" : "Proveedor: Papelería del Bajío"}
          icon="local_shipping"
          actions={[{ label: "Cerrar", variant: "primary", closes: true }]}
        >
          <Paragraphs count={3} />
        </CnDialog>
      </>
    );
  },
};

/** Diálogos apilados: el segundo queda encima y el foco regresa al primero al cerrarlo. */
export const Stacked: Story = {
  render: function Render() {
    const [first, setFirst] = useState(false);
    const [second, setSecond] = useState(false);
    return (
      <>
        <CnButton onClick={() => setFirst(true)}>Abrir</CnButton>
        <CnDialog
          open={first}
          onClose={() => setFirst(false)}
          title="Seleccionar proveedor"
          actions={[
            {
              label: "Nuevo proveedor",
              variant: "secondary",
              icon: "add",
              onClick: () => setSecond(true),
            },
            { label: "Listo", variant: "primary", closes: true },
          ]}
        >
          <Paragraphs count={2} />
        </CnDialog>
        <CnDialog
          open={second}
          onClose={() => setSecond(false)}
          size="sm"
          title="Nuevo proveedor"
          onBack={() => setSecond(false)}
          actions={[{ label: "Crear", variant: "primary", closes: true }]}
        >
          Formulario del proveedor…
        </CnDialog>
      </>
    );
  },
};

/** `useDialog()`: abre diálogos sin estado local y espera la elección del usuario. */
export const Imperative: Story = {
  render: () => {
    const Demo = () => {
      const dialog = useDialog();
      const [result, setResult] = useState<string>("—");
      return (
        <Box sx={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <CnButton
            onClick={async () => {
              const format = await dialog.open<string>({
                title: "Exportar reporte",
                icon: "download",
                size: "sm",
                content: "¿En qué formato quieres descargar el reporte de ventas?",
                actions: [
                  { label: "CSV", variant: "secondary", value: "csv" },
                  { label: "Excel", variant: "primary", value: "xlsx" },
                ],
              });
              setResult(format ?? "cancelado");
            }}
          >
            Exportar…
          </CnButton>
          <CnButton
            variant="outlined"
            onClick={() => {
              void dialog.open({ id: "async", title: "Cliente", loading: true });
              setTimeout(
                () =>
                  dialog.update("async", {
                    loading: false,
                    subtitle: "CL-000128",
                    content: "Datos cargados desde el servidor.",
                    actions: [{ label: "Cerrar", variant: "primary", value: undefined }],
                  }),
                1200,
              );
            }}
          >
            Abrir y cargar
          </CnButton>
          <span>Resultado: {result}</span>
        </Box>
      );
    };
    return (
      <CnDialogProvider>
        <Demo />
      </CnDialogProvider>
    );
  },
};

export const Skeleton: Story = {
  render: () => (
    <Box
      sx={{
        display: "grid",
        gap: "16px",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      }}
    >
      <Box sx={{ border: "1px solid var(--cn-color-border, #dde0e4)", borderRadius: "12px" }}>
        <CnDialogSkeleton icon />
      </Box>
      <Box sx={{ border: "1px solid var(--cn-color-border, #dde0e4)", borderRadius: "12px" }}>
        <CnDialogSkeleton lines={1} fields={3} actions={2} />
      </Box>
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
 * Stress: el diálogo dentro de contenedores de 320, 480 y 1200 px (el
 * contenedor con `transform` contiene la capa fija). Título de 3 líneas,
 * cadenas sin espacios, acciones largas y cuerpo con scroll.
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
              height: 520,
              overflow: "hidden",
              border: "1px dashed var(--cn-color-border-strong, #c5cad0)",
            }}
          >
            <CnDialog
              open
              size="md"
              dialogProps={contained}
              title="Actualización masiva de la lista de precios de la sucursal Monterrey Centro para el segundo semestre de 2026 con descuentos"
              subtitle="responsable.de.compras.regionales@comercializadora-del-centro-y-bajio.com.mx"
              icon="price_change"
              headerActions={
                <CnButton
                  iconOnly
                  icon="help"
                  size="small"
                  variant="text"
                  color="neutral"
                  aria-label="Ayuda"
                />
              }
              footerStart="Última edición: hace 5 min por Ana María Fernández de la Garza"
              actions={[
                { label: "Eliminar borrador", variant: "destructive", align: "start" },
                { label: "Guardar como plantilla reutilizable", variant: "secondary" },
                { label: "Aplicar", variant: "primary" },
              ]}
            >
              <p style={{ marginTop: 0 }}>
                Archivo:
                lista_de_precios_monterrey_centro_segundo_semestre_2026_version_final_definitiva.xlsx
              </p>
              <Paragraphs count={6} />
            </CnDialog>
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

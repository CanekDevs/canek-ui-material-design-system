import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnAlert } from "./CnAlert";
import { CnAlertSkeleton } from "./CnAlertSkeleton";

const meta: Meta<typeof CnAlert> = {
  title: "Components/CnAlert",
  component: CnAlert,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**Para qué sirve:** comunicar un mensaje con semántica de estado (éxito, info, advertencia, error) en línea, como popup o toast. También cubre el *callout* de contenido: variante `left-accent`, fila de `actions` (botones o enlaces que hacen wrap), `details` plegables y cierre autogestionado (`dismissible`).",
          "",
          '**Cuándo NO usarlo:** para mostrar un dato o KPI (etiqueta + valor) usa `CnMetricCard` (`layout="inline"` para tiles de dato); para agrupar contenido con encabezado y cuerpo usa `CnSectionCard`; para tarjetas con imagen, clic o enlace usa `CnCard`; para notificaciones globales en cola usa `CnToast`.',
          "",
          "**Relación con vecinos:** sustituye al antiguo `CnInfoCard` (sus avisos/callouts migran aquí y su modo dato a `CnMetricCard`). `CnToast` usa la misma semántica de severidad para avisos efímeros.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    mode: {
      control: "select",
      options: ["inline", "popup", "toast"],
    },
    severity: {
      control: "select",
      options: ["success", "info", "warning", "error"],
    },
    variant: {
      control: "select",
      options: ["standard", "filled", "outlined", "left-accent"],
    },
    color: {
      control: "select",
      options: ["success", "info", "warning", "error", "primary", "secondary", "accent", "neutral"],
    },
    iconMode: {
      control: "select",
      options: ["icon", "none"],
    },
    closable: { control: "boolean" },
    visible: { control: "boolean" },
    autoHideDuration: { control: "number" },
    disableClickawayClose: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof CnAlert>;

export const Default: Story = {
  args: {
    message: "Este es un mensaje informativo.",
    severity: "info",
    variant: "standard",
  },
};

export const Severities: Story = {
  render: () => (
    <Stack spacing={2}>
      <CnAlert severity="success" message="Operación completada." />
      <CnAlert severity="info" message="Hay una nueva versión disponible." />
      <CnAlert severity="warning" message="Tu sesión expirará en 5 minutos." />
      <CnAlert severity="error" message="No pudimos guardar los cambios." />
    </Stack>
  ),
};

export const Variants: Story = {
  render: () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Standard
        </Typography>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <CnAlert severity="success" variant="standard" message="Standard success" />
          <CnAlert severity="error" variant="standard" message="Standard error" />
        </Stack>
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Filled
        </Typography>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <CnAlert severity="success" variant="filled" message="Filled success" />
          <CnAlert severity="error" variant="filled" message="Filled error" />
        </Stack>
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Outlined
        </Typography>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <CnAlert severity="success" variant="outlined" message="Outlined success" />
          <CnAlert severity="error" variant="outlined" message="Outlined error" />
        </Stack>
      </Box>
    </Stack>
  ),
};

export const Colors: Story = {
  render: () => (
    <Stack spacing={2}>
      <CnAlert color="primary" message="Primary" />
      <CnAlert color="secondary" message="Secondary" />
      <CnAlert color="accent" message="Accent" />
      <CnAlert color="neutral" message="Neutral" />
    </Stack>
  ),
};

export const WithTitle: Story = {
  render: () => (
    <Stack spacing={2}>
      <CnAlert
        severity="success"
        title="Cambios guardados"
        message="Los cambios se sincronizaron con todos los dispositivos."
      />
      <CnAlert
        severity="error"
        title="Error al procesar"
        message="El servidor no respondió correctamente. Intenta de nuevo."
      />
    </Stack>
  ),
};

const ClosableStory = () => {
  const [visible, setVisible] = useState(true);
  return (
    <Stack spacing={2}>
      <CnAlert
        visible={visible}
        onClose={() => setVisible(false)}
        closable
        severity="info"
        message="Puedes cerrar esta alerta con la X."
      />
      {!visible && (
        <Button size="small" onClick={() => setVisible(true)}>
          Mostrar de nuevo
        </Button>
      )}
    </Stack>
  );
};

export const Closable: Story = {
  render: () => <ClosableStory />,
};

export const WithAction: Story = {
  render: () => (
    <Stack spacing={2}>
      <CnAlert
        severity="warning"
        title="Actualización disponible"
        message="Hay una nueva versión lista para instalar."
        action={
          <Button size="small" color="inherit">
            Actualizar
          </Button>
        }
      />
      <CnAlert
        severity="error"
        title="Conexión perdida"
        message="Verifica tu conexión a internet."
        action={
          <Button size="small" color="inherit">
            Reintentar
          </Button>
        }
        closable
        onClose={() => {}}
      />
    </Stack>
  ),
};

export const BulletMessage: Story = {
  render: () => (
    <CnAlert
      severity="error"
      title="Revisa los siguientes campos"
      message={
        "• Email: Es requerido\n• Nombre: Debe tener al menos 2 caracteres\n• Teléfono: Formato inválido"
      }
    />
  ),
};

export const IconModes: Story = {
  render: () => (
    <Stack spacing={2}>
      <CnAlert severity="success" iconMode="icon" message="Con ícono (default)" />
      <CnAlert severity="success" iconMode="none" message="Sin ícono" />
      <CnAlert severity="success" icon="bolt" message="Ícono custom por nombre" />
      <CnAlert severity="success" icon={false} message="Sin ícono (alternativo)" />
    </Stack>
  ),
};

const PopupExampleStory = () => {
  const [open, setOpen] = useState(false);
  return (
    <Box>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Mostrar popup
      </Button>
      <CnAlert
        mode="popup"
        open={open}
        onClose={() => setOpen(false)}
        severity="success"
        title="Guardado"
        message="Los cambios se aplicaron correctamente."
        closable
      />
    </Box>
  );
};

export const PopupExample: Story = {
  render: () => <PopupExampleStory />,
};

type PositionKey = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const PopupPositionsStory = () => {
  const [pos, setPos] = useState<PositionKey | null>(null);

  const anchorFor = (key: PositionKey) => {
    switch (key) {
      case "top-left":
        return { vertical: "top" as const, horizontal: "left" as const };
      case "top-right":
        return { vertical: "top" as const, horizontal: "right" as const };
      case "bottom-left":
        return { vertical: "bottom" as const, horizontal: "left" as const };
      case "bottom-right":
        return { vertical: "bottom" as const, horizontal: "right" as const };
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1}>
        <Button onClick={() => setPos("top-left")}>Top left</Button>
        <Button onClick={() => setPos("top-right")}>Top right</Button>
        <Button onClick={() => setPos("bottom-left")}>Bottom left</Button>
        <Button onClick={() => setPos("bottom-right")}>Bottom right</Button>
      </Stack>
      {pos && (
        <CnAlert
          mode="popup"
          open
          onClose={() => setPos(null)}
          position={anchorFor(pos)}
          severity="info"
          message={`Posición: ${pos}`}
          closable
        />
      )}
    </Box>
  );
};

export const PopupPositions: Story = {
  render: () => <PopupPositionsStory />,
};

export const FormValidation: Story = {
  render: () => (
    <Box sx={{ maxWidth: 640 }}>
      <CnAlert
        severity="error"
        title="No se pudo guardar el formulario"
        message={
          "• Email: El campo es requerido\n• Password: Debe tener al menos 8 caracteres\n• Confirmación: Las contraseñas no coinciden"
        }
        closable
        onClose={() => {}}
      />
    </Box>
  ),
};

/** Estado de carga: ícono, título, mensaje, acción y cerrar según la variante (`skeleton` o `CnAlertSkeleton`). */
export const Skeleton: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 560 }}>
      <CnAlert
        severity="warning"
        title="Revisa los datos"
        message="Algunos campos requieren tu atención antes de continuar."
        skeleton
      />
      <CnAlertSkeleton />
      <CnAlertSkeleton variant="outlined" title action closable />
      <CnAlertSkeleton variant="filled" title lines={2} />
      <CnAlertSkeleton icon={false} lines={1} closable />
      <CnAlertSkeleton mode="toast" variant="outlined" title lines={1} />
      <CnAlertSkeleton variant="left-accent" title actions={2} details />
    </Stack>
  ),
};

/** Callout de contenido (antes `CnInfoCard`): `left-accent`, acciones abajo, detalles plegables y cierre autogestionado. */
export const Callout: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 640 }}>
      <CnAlert
        variant="left-accent"
        severity="info"
        title="Nueva política de vacaciones"
        message="A partir del 1 de enero los días se acumulan por año calendario."
        actions={[
          { label: "Leer política", icon: "description" },
          { label: "Más información", variant: "link", href: "#" },
        ]}
      />
      <CnAlert
        variant="left-accent"
        color="accent"
        icon="new_releases"
        title="Novedades de la versión 2.4"
        message="Mejoramos el rendimiento de los reportes."
        details={
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Exportación a Excel 3× más rápida.</li>
            <li>Filtros guardados por usuario.</li>
          </ul>
        }
      />
      <CnAlert
        severity="warning"
        variant="outlined"
        title="Tu certificado vence en 5 días"
        message="Renueva el certificado para seguir timbrando facturas."
        dismissible
        actions={[{ label: "Renovar" }, { label: "Recordar después" }]}
      />
      <CnAlert
        variant="filled"
        severity="success"
        title="Cierre de mes completado"
        message="Se generaron 1,284 pólizas sin errores."
        actions={[{ label: "Ver pólizas" }, { label: "Descargar", variant: "outlined" }]}
      />
    </Stack>
  ),
};

/** `details` controlado y `dismissible` con `visible` controlado. */
export const ControlledCallout: Story = {
  render: function Render() {
    const [expanded, setExpanded] = useState(false);
    const [visible, setVisible] = useState(true);
    return (
      <Stack spacing={2} sx={{ maxWidth: 560 }}>
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Plegar" : "Desplegar"} desde fuera
          </Button>
          <Button size="small" onClick={() => setVisible(true)} disabled={visible}>
            Mostrar aviso
          </Button>
        </Stack>
        <CnAlert
          variant="left-accent"
          severity="info"
          title="Mantenimiento programado"
          message="El sistema no estará disponible el sábado de 22:00 a 23:00."
          details="Durante la ventana se actualizará la base de datos y se reiniciarán los servicios."
          expanded={expanded}
          onExpandedChange={setExpanded}
          dismissible
          visible={visible}
          onClose={() => setVisible(false)}
        />
      </Stack>
    );
  },
};

const LONG_TITLE =
  "Aviso importante sobre la actualización obligatoria de datos fiscales para todos los colaboradores de la organización antes del cierre del ejercicio";
const LONG_MESSAGE =
  "Envía tu constancia a recursos.humanos.departamento.nomina.corporativo@empresa-con-dominio-muy-largo.com.mx o súbela en https://portal.empresa-con-dominio-muy-largo.com.mx/colaboradores/documentos/constancia-de-situacion-fiscal-2026";

const StressContent = () => (
  <Stack spacing={1.5}>
    <CnAlert
      variant="left-accent"
      severity="warning"
      title={LONG_TITLE}
      message={LONG_MESSAGE}
      dismissible
      action={<Button size="small">Ver</Button>}
      details={LONG_MESSAGE}
      actions={[
        { label: "Subir constancia ahora", icon: "upload" },
        { label: "Descargar formato oficial", variant: "outlined" },
        { label: "Más información sobre el trámite", variant: "link" },
      ]}
    />
    <CnAlert severity="error" variant="filled" title={LONG_TITLE} message={"x".repeat(160)} />
    <CnAlert severity="info" message="" />
    <CnAlert
      severity="success"
      title="Cargando"
      message="m"
      actions={[{ label: "A" }, { label: "B" }]}
      details="d"
      skeleton
    />
  </Stack>
);

/** Datos extremos (títulos de 3 líneas, correos y URLs largas, muchas acciones, vacío) a 320, 480 y 1200 px. */
export const Responsive: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <Stack spacing={3}>
      {[320, 480, 1200].map((width) => (
        <Box key={width} data-stress-width={width} sx={{ width, maxWidth: "100%" }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {width}px
          </Typography>
          <Box sx={{ border: "1px dashed var(--cn-color-border, #dde0e4)", p: "4px" }}>
            <StressContent />
          </Box>
        </Box>
      ))}
    </Stack>
  ),
};

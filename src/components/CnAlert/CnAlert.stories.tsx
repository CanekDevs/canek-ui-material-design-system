import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnAlert } from "./CnAlert";

const meta: Meta<typeof CnAlert> = {
  title: "Components/CnAlert",
  component: CnAlert,
  tags: ["autodocs"],
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
      options: ["standard", "filled", "outlined"],
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

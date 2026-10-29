import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnButton } from "../CnButton";
import { CnEmptyState } from "./CnEmptyState";

const meta: Meta<typeof CnEmptyState> = {
  title: "Components/CnEmptyState",
  component: CnEmptyState,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "compact", "card"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    color: {
      control: "select",
      options: ["neutral", "primary", "secondary", "success", "warning", "error", "info", "accent"],
    },
    role: {
      control: "select",
      options: ["status", "alert", "none"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof CnEmptyState>;

export const Default: Story = {
  args: {
    title: "Sin productos",
    description: "No hay productos en tu catálogo todavía.",
  },
};

export const WithIcon: Story = {
  args: {
    title: "Sin mensajes",
    description: "Cuando recibas mensajes aparecerán aquí.",
    icon: "mail",
  },
};

export const WithAction: Story = {
  args: {
    title: "Sin productos",
    description: "Agrega tu primer producto para empezar a vender.",
    icon: "inventory_2",
    action: (
      <CnButton variant="contained" startIcon="add">
        Agregar producto
      </CnButton>
    ),
  },
};

export const Colors: Story = {
  render: () => (
    <Stack spacing={4}>
      <CnEmptyState
        color="neutral"
        icon="inbox"
        title="Sin datos"
        description="No hay nada que mostrar."
      />
      <CnEmptyState
        color="primary"
        icon="search"
        title="Sin resultados"
        description="Prueba con otros términos de búsqueda."
      />
      <CnEmptyState
        color="success"
        icon="check_circle"
        title="Todo completado"
        description="No tienes tareas pendientes."
      />
      <CnEmptyState
        color="warning"
        icon="pending"
        title="Esperando configuración"
        description="Configura tu cuenta para continuar."
      />
      <CnEmptyState
        color="error"
        icon="report_problem"
        title="Algo salió mal"
        description="No pudimos cargar los datos."
      />
      <CnEmptyState
        color="info"
        icon="info"
        title="Sin actividad"
        description="Cuando haya actividad aparecerá aquí."
      />
      <CnEmptyState
        color="accent"
        icon="star"
        title="Sin favoritos"
        description="Marca elementos como favoritos para verlos aquí."
      />
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={3} alignItems="flex-start">
      <Box sx={{ flex: 1, border: "1px dashed #dde0e4", borderRadius: 2 }}>
        <CnEmptyState size="sm" icon="search" title="Small" description="Compacto" />
      </Box>
      <Box sx={{ flex: 1, border: "1px dashed #dde0e4", borderRadius: 2 }}>
        <CnEmptyState size="md" icon="search" title="Medium" description="Por defecto" />
      </Box>
      <Box sx={{ flex: 1, border: "1px dashed #dde0e4", borderRadius: 2 }}>
        <CnEmptyState size="lg" icon="search" title="Large" description="Hero state" />
      </Box>
    </Stack>
  ),
};

export const Variants: Story = {
  render: () => (
    <Stack spacing={4}>
      <Box>
        <CnEmptyState
          variant="default"
          icon="inbox"
          title="Default"
          description="Sin wrapper, para embebido libre."
        />
      </Box>
      <Box sx={{ height: 120, backgroundColor: "#f4f5f7", p: 2 }}>
        <CnEmptyState
          variant="compact"
          icon="inbox"
          title="Compact"
          description="Para tablas y drawers."
        />
      </Box>
      <Box>
        <CnEmptyState
          variant="card"
          icon="inbox"
          title="Card"
          description="Con borde dashed y fondo surface."
          action={
            <CnButton size="small" variant="outlined">
              Acción
            </CnButton>
          }
        />
      </Box>
    </Stack>
  ),
};

export const CompactForTable: Story = {
  render: () => (
    <Box
      sx={{
        border: "1px solid #dde0e4",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: "1px solid #dde0e4",
          backgroundColor: "#f4f5f7",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Pedidos recientes
      </Box>
      <CnEmptyState
        variant="compact"
        icon="receipt_long"
        title="Sin pedidos"
        description="Los pedidos aparecerán aquí."
      />
    </Box>
  ),
};

export const WithIllustration: Story = {
  render: () => (
    <CnEmptyState
      title="Sin conexión"
      description="Verifica tu conexión a internet e intenta de nuevo."
      illustration={
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #5081c4, #254d87)",
            display: "grid",
            placeItems: "center",
            color: "white",
            fontSize: 48,
            fontWeight: 800,
          }}
        >
          !
        </Box>
      }
      action={<CnButton variant="contained">Reintentar</CnButton>}
    />
  ),
};

export const SearchResults: Story = {
  render: () => (
    <CnEmptyState
      variant="card"
      color="primary"
      icon="search_off"
      title="Sin resultados para tu búsqueda"
      description="Intenta con otros términos o revisa los filtros aplicados."
      action={
        <Stack direction="row" spacing={1}>
          <CnButton variant="text" color="neutral">
            Limpiar filtros
          </CnButton>
          <CnButton variant="contained">Explorar todo</CnButton>
        </Stack>
      }
    />
  ),
};

export const SuccessState: Story = {
  render: () => (
    <CnEmptyState
      variant="card"
      color="success"
      icon="task_alt"
      title="¡Todo al día!"
      description="No tienes tareas pendientes. Buen trabajo."
    />
  ),
};

export const NotFound: Story = {
  render: () => (
    <CnEmptyState
      size="lg"
      color="error"
      icon="error"
      title="Página no encontrada"
      description="El recurso que buscas no existe o fue eliminado."
      action={<CnButton variant="contained">Volver al inicio</CnButton>}
    />
  ),
};

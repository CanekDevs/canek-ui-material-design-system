import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnTabs } from "./CnTabs";

const meta: Meta<typeof CnTabs> = {
  title: "Components/CnTabs",
  component: CnTabs,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["line", "pill", "soft", "contained", "outlined"],
    },
    color: {
      control: "select",
      options: ["primary", "secondary", "success", "warning", "error", "info", "accent", "neutral"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
    showIconOnly: { control: "boolean" },
    showDividers: { control: "boolean" },
    showIndicator: { control: "boolean" },
    fullWidth: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof CnTabs>;

const SIMPLE_OPTIONS = [
  { id: "overview", label: "Resumen" },
  { id: "details", label: "Detalles" },
  { id: "history", label: "Historial" },
];

const InteractiveTabs = (props: Partial<React.ComponentProps<typeof CnTabs>>) => {
  const [value, setValue] = useState<string | number>(SIMPLE_OPTIONS[0].id);
  return <CnTabs options={SIMPLE_OPTIONS} value={value} onChange={setValue} {...props} />;
};

const WithIconsStory = () => {
  const [value, setValue] = useState<string | number>("home");
  return (
    <CnTabs
      options={[
        { id: "home", label: "Inicio", icon: "home" },
        { id: "catalog", label: "Catálogo", icon: "inventory_2" },
        { id: "orders", label: "Pedidos", icon: "receipt_long" },
        { id: "customers", label: "Clientes", icon: "group" },
      ]}
      value={value}
      onChange={setValue}
    />
  );
};

const WithBadgesStory = () => {
  const [value, setValue] = useState<string | number>("inbox");
  return (
    <CnTabs
      options={[
        { id: "inbox", label: "Bandeja", icon: "inbox", badge: 12 },
        { id: "sent", label: "Enviados", icon: "send" },
        { id: "drafts", label: "Borradores", icon: "drafts", badge: 3 },
        { id: "archive", label: "Archivo" },
      ]}
      value={value}
      onChange={setValue}
    />
  );
};

const WithSubtitlesStory = () => {
  const [value, setValue] = useState<string | number>("phobos");
  return (
    <CnTabs
      options={[
        { id: "phobos", label: "Phobos", subtitle: "Activo · 12 tiendas" },
        { id: "kairos", label: "Kairos", subtitle: "Beta · 3 salones" },
        { id: "canek", label: "Canek", subtitle: "Planeación" },
      ]}
      value={value}
      onChange={setValue}
      variant="soft"
    />
  );
};

const WithStatusStory = () => {
  const [value, setValue] = useState<string | number>("valid");
  return (
    <CnTabs
      options={[
        { id: "valid", label: "Válido" },
        { id: "loading", label: "Procesando", isLoading: true },
        { id: "error", label: "Con error", hasError: true },
      ]}
      value={value}
      onChange={setValue}
    />
  );
};

const VerticalTabsStory = () => {
  const [value, setValue] = useState<string | number>("general");
  return (
    <Box sx={{ display: "flex", gap: 3 }}>
      <CnTabs
        options={[
          { id: "general", label: "General", icon: "settings" },
          { id: "notifications", label: "Notificaciones", icon: "notifications", badge: 5 },
          { id: "security", label: "Seguridad", icon: "security" },
          { id: "billing", label: "Facturación", icon: "credit_card" },
          { id: "team", label: "Equipo", icon: "group" },
        ]}
        value={value}
        onChange={setValue}
        orientation="vertical"
        verticalWidth={240}
      />
      <Box sx={{ flex: 1, p: 2, border: "1px dashed #dde0e4", borderRadius: 1 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Sección: {value}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Contenido de la sección activa
        </Typography>
      </Box>
    </Box>
  );
};

const IconOnlyTabsStory = () => {
  const [value, setValue] = useState<string | number>("list");
  return (
    <CnTabs
      options={[
        { id: "list", label: "Lista", icon: "view_list" },
        { id: "grid", label: "Cuadrícula", icon: "view_module" },
        { id: "columns", label: "Columnas", icon: "view_column" },
        { id: "compact", label: "Compacto", icon: "view_headline" },
      ]}
      value={value}
      onChange={setValue}
      showIconOnly
      variant="pill"
    />
  );
};

const ToggleViewPatternStory = () => {
  const [value, setValue] = useState<string | number>("day");
  return (
    <Box>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
        Vista del calendario
      </Typography>
      <CnTabs
        options={[
          { id: "day", label: "Día" },
          { id: "week", label: "Semana" },
          { id: "month", label: "Mes" },
          { id: "year", label: "Año" },
        ]}
        value={value}
        onChange={setValue}
        variant="pill"
        size="sm"
      />
    </Box>
  );
};

const ContainedWithContentStory = () => {
  const [value, setValue] = useState<string | number>("overview");
  return (
    <Box>
      <CnTabs
        options={[
          { id: "overview", label: "Resumen", icon: "dashboard" },
          { id: "products", label: "Productos", icon: "inventory_2", badge: 24 },
          { id: "orders", label: "Pedidos", icon: "receipt_long", badge: 8 },
          { id: "customers", label: "Clientes", icon: "group" },
        ]}
        value={value}
        onChange={setValue}
        variant="contained"
        color="primary"
        fullWidth
      />
      <Box sx={{ p: 3, mt: 2, backgroundColor: "#fafbfc", borderRadius: 2 }}>
        <Typography variant="body2">
          Contenido de <strong>{value}</strong>
        </Typography>
      </Box>
    </Box>
  );
};

export const Default: Story = {
  render: () => <InteractiveTabs />,
};

export const Variants: Story = {
  render: () => (
    <Stack spacing={4}>
      {(["line", "pill", "soft", "contained", "outlined"] as const).map((v) => (
        <Box key={v}>
          <Typography variant="caption" sx={{ color: "text.secondary", mb: 1, display: "block" }}>
            {v}
          </Typography>
          <InteractiveTabs variant={v} />
        </Box>
      ))}
    </Stack>
  ),
};

export const Colors: Story = {
  render: () => (
    <Stack spacing={3}>
      {(["primary", "success", "warning", "error", "accent"] as const).map((c) => (
        <Box key={c}>
          <Typography variant="caption" sx={{ color: "text.secondary", mb: 1, display: "block" }}>
            {c}
          </Typography>
          <InteractiveTabs color={c} />
        </Box>
      ))}
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack spacing={3}>
      <InteractiveTabs size="sm" />
      <InteractiveTabs size="md" />
      <InteractiveTabs size="lg" />
    </Stack>
  ),
};

export const WithIcons: Story = {
  render: () => <WithIconsStory />,
};

export const WithBadges: Story = {
  render: () => <WithBadgesStory />,
};

export const WithSubtitles: Story = {
  render: () => <WithSubtitlesStory />,
};

export const WithStatus: Story = {
  render: () => <WithStatusStory />,
};

export const VerticalTabs: Story = {
  render: () => <VerticalTabsStory />,
};

export const IconOnlyTabs: Story = {
  render: () => <IconOnlyTabsStory />,
};

export const ToggleViewPattern: Story = {
  render: () => <ToggleViewPatternStory />,
};

export const ContainedWithContent: Story = {
  render: () => <ContainedWithContentStory />,
};

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { catalogDocs } from "../../catalog";
import { CnButton } from "../CnButton";
import { CnChip } from "../CnChip";
import type { CnDescriptionItem } from "./CnDescriptionList";
import { CnDescriptionList } from "./CnDescriptionList";
import { CnDescriptionListSkeleton } from "./CnDescriptionListSkeleton";

const CONTACT: CnDescriptionItem[] = [
  {
    label: "Correo",
    icon: "mail",
    value: "mariana.lopez@grupoaltavista.mx",
    href: "mailto:mariana.lopez@grupoaltavista.mx",
    copyValue: "mariana.lopez@grupoaltavista.mx",
  },
  {
    label: "Teléfono",
    icon: "call",
    value: "+52 55 4321 8890",
    href: "tel:+525543218890",
    copyValue: "+525543218890",
  },
  { label: "Empresa", icon: "business", value: "Grupo Altavista" },
  { label: "Puesto", icon: "badge", value: "Directora de Compras" },
  { label: "Responsable", icon: "person", value: "Carlos Méndez" },
  {
    label: "Etapa del ciclo",
    icon: "flag",
    value: <CnChip size="small" color="info" label="Oportunidad" />,
  },
  { label: "Fuente", icon: "campaign", value: "Expo Industrial 2026" },
  { label: "Último contacto", icon: "schedule", value: "Hace 2 días", hint: "Llamada de 12 min" },
  { label: "Notas", value: "", span: "full" },
];

const meta: Meta<typeof CnDescriptionList> = {
  title: "Data Display/CnDescriptionList",
  component: CnDescriptionList,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: catalogDocs("CnDescriptionList") } } },
  args: {
    title: "Datos de contacto",
    items: CONTACT,
  },
  argTypes: {
    layout: { control: "inline-radio", options: ["stacked", "inline"] },
    variant: { control: "inline-radio", options: ["plain", "card"] },
    size: { control: "inline-radio", options: ["sm", "md"] },
    columns: { control: "select", options: [1, 2, 3, 4] },
  },
};

export default meta;
type Story = StoryObj<typeof CnDescriptionList>;

export const Default: Story = {};

export const Card: Story = {
  args: {
    variant: "card",
    action: (
      <CnButton variant="text" size="small" startIcon="edit">
        Editar
      </CnButton>
    ),
  },
};

export const Inline: Story = {
  args: { layout: "inline", columns: 1, variant: "card" },
  render: (args) => (
    <Box sx={{ maxWidth: 480 }}>
      <CnDescriptionList {...args} />
    </Box>
  ),
};

export const ThreeColumns: Story = {
  args: { columns: 3, minColumnWidth: 180 },
};

export const Small: Story = {
  args: { size: "sm", columns: 3, minColumnWidth: 160 },
};

export const EmptyValues: Story = {
  args: {
    title: "Datos fiscales",
    emptyValue: "Sin capturar",
    items: [
      { label: "RFC", value: "" },
      { label: "Régimen fiscal", value: null },
      { label: "Uso de CFDI", value: undefined },
      { label: "Código postal", value: "06600" },
    ],
  },
};

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "24px" }}>
      <CnDescriptionListSkeleton title count={6} />
      <CnDescriptionList skeleton title="Datos" items={CONTACT} variant="card" />
      <Box sx={{ maxWidth: 480 }}>
        <CnDescriptionList skeleton items={CONTACT.slice(0, 4)} layout="inline" columns={1} />
      </Box>
    </Box>
  ),
};

const LONG =
  "Comercializadora Internacional de Productos Industriales y Servicios Logísticos del Bajío, S.A.P.I. de C.V.";

const EXTREME: CnDescriptionItem[] = [
  { label: "Razón social", value: LONG, copyValue: LONG },
  {
    label: "Correo",
    value: "contacto.facturacion.electronica.y.cobranza@comercializadorainternacional.com.mx",
    copyValue: "x",
  },
  { label: "Identificador", value: "SINESPACIOSSINESPACIOSSINESPACIOSSINESPACIOSSINESPACIOS" },
  { label: "Monto contratado", value: "$1,234,567,890,123.45 MXN" },
  { label: "Etiqueta con un nombre muy largo que tampoco debería romper la cuadrícula", value: "" },
];

/** Datos extremos (textos de 100+ caracteres, palabras sin espacios, vacío) a 320, 480 y 1200 px. */
export const Responsive: Story = {
  parameters: { maxWidth: "none" },
  render: () => (
    <Box sx={{ display: "grid", gap: "24px" }}>
      {[320, 480, 1200].map((width) => (
        <Box key={width} data-stress-width={width} sx={{ width }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {width}px
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: "12px",
              border: "1px dashed var(--cn-color-border, #dde0e4)",
              p: "4px",
            }}
          >
            <CnDescriptionList title={LONG} items={EXTREME} variant="card" columns={3} />
            <CnDescriptionList items={EXTREME} layout="inline" columns={1} />
            <CnDescriptionList title="Sin datos" items={[]} />
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

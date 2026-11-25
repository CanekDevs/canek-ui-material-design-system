import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { catalogDocs } from "../../catalog";
import type { CnRecordHeaderProps } from "./CnRecordHeader";
import { CnRecordHeader } from "./CnRecordHeader";
import { CnRecordHeaderSkeleton } from "./CnRecordHeaderSkeleton";

const CONTACT: CnRecordHeaderProps = {
  overline: "Contacto",
  title: "Mariana López Ortega",
  subtitle: "Directora de Compras · Grupo Altavista",
  avatar: { name: "Mariana López Ortega" },
  status: { label: "Oportunidad", color: "info" },
  tags: ["Cliente clave", "Monterrey"],
  facts: [
    { label: "Responsable", value: "Carlos Méndez", icon: "person" },
    { label: "Valor abierto", value: "$1,280,000 MXN", icon: "payments" },
    { label: "Último contacto", value: "Hace 2 días", icon: "schedule" },
    { label: "Próxima actividad", value: "Demo · jue 28 nov", icon: "event" },
  ],
  actions: [
    { id: "email", label: "Enviar correo", icon: "mail" },
    { id: "call", label: "Llamar", icon: "call" },
    { id: "deal", label: "Crear oportunidad", icon: "add" },
    { id: "call_merge", label: "Combinar duplicados", icon: "call_merge" },
    { id: "delete", label: "Eliminar contacto", icon: "delete", danger: true },
  ],
};

const meta: Meta<typeof CnRecordHeader> = {
  title: "Layout/CnRecordHeader",
  component: CnRecordHeader,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: catalogDocs("CnRecordHeader") } } },
  args: CONTACT,
  argTypes: {
    variant: { control: "inline-radio", options: ["plain", "card"] },
    maxVisibleActions: { control: { type: "number", min: 0, max: 5 } },
  },
};

export default meta;
type Story = StoryObj<typeof CnRecordHeader>;

export const Default: Story = {};

export const Card: Story = { args: { variant: "card" } };

const FollowDemo = (args: CnRecordHeaderProps) => {
  const [following, setFollowing] = useState(false);
  return (
    <CnRecordHeader
      {...args}
      variant="card"
      onBack={() => undefined}
      following={following}
      onFollowChange={setFollowing}
    />
  );
};

export const WithFollow: Story = {
  render: (args) => <FollowDemo {...args} />,
};

export const Company: Story = {
  args: {
    overline: "Empresa",
    title: "Grupo Altavista",
    subtitle: "Manufactura · 1,200 empleados · grupoaltavista.mx",
    avatar: { icon: "apartment" },
    status: { label: "Cliente", color: "success" },
    tags: [],
    facts: [
      { label: "Ingresos 2026", value: "$8.4 M MXN" },
      { label: "Contactos", value: "14" },
      { label: "Oportunidades abiertas", value: "3" },
    ],
    actions: [{ id: "edit", label: "Editar", icon: "edit" }],
    variant: "card",
  },
};

export const Minimal: Story = {
  args: {
    overline: undefined,
    subtitle: undefined,
    status: undefined,
    tags: [],
    facts: [],
    actions: [],
  },
};

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "24px" }}>
      <CnRecordHeaderSkeleton variant="card" facts={4} />
      <CnRecordHeader {...CONTACT} skeleton />
    </Box>
  ),
};

const LONG =
  "Comercializadora Internacional de Productos Industriales y Servicios Logísticos del Bajío, S.A.P.I. de C.V.";

/** Datos extremos (textos de 100+ caracteres, palabras sin espacios, montos enormes) a 320, 480 y 1200 px. */
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
            <CnRecordHeader
              {...CONTACT}
              variant="card"
              title={LONG}
              subtitle="SINESPACIOSSINESPACIOSSINESPACIOSSINESPACIOSSINESPACIOSSINESPACIOS"
              tags={["Etiqueta muy larga que debería partirse", "Otra"]}
              facts={[
                { label: "Valor abierto", value: "$1,234,567,890,123.45 MXN" },
                { label: "Responsable", value: LONG },
              ]}
              following={false}
              onFollowChange={() => undefined}
            />
            <CnRecordHeader title="Sin datos" />
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

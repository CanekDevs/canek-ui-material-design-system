import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { catalogDocs } from "../../catalog";
import { CnBadge } from "../CnBadge";
import { CnIcon } from "../CnIcon";
import { CnSearchField } from "../CnSearchField";
import { CnTopBar } from "./CnTopBar";
import type { CnTopBarUser } from "./CnTopBar";
import { CnTopBarSkeleton } from "./CnTopBarSkeleton";

const Brand = () => (
  <Box sx={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
    <Box
      aria-hidden
      sx={{
        width: 28,
        height: 28,
        flex: "none",
        borderRadius: "8px",
        display: "grid",
        placeItems: "center",
        fontWeight: 700,
        color: "var(--cn-color-text-inverse, #ffffff)",
        backgroundColor: "var(--cn-color-brand-600, #254d87)",
      }}
    >
      C
    </Box>
    <Typography sx={{ fontWeight: 600, fontSize: "15px", whiteSpace: "nowrap" }}>
      Canek CRM
    </Typography>
  </Box>
);

const Actions = () => (
  <>
    <IconButton
      aria-label="Notificaciones (3 sin leer)"
      sx={{ width: 40, height: 40, color: "var(--cn-color-text-muted, #6e7682)" }}
    >
      <CnBadge content={3} color="error" size="sm">
        <CnIcon name="notifications" size={22} />
      </CnBadge>
    </IconButton>
    <IconButton
      aria-label="Ayuda"
      sx={{ width: 40, height: 40, color: "var(--cn-color-text-muted, #6e7682)" }}
    >
      <CnIcon name="help_outline" size={22} />
    </IconButton>
  </>
);

const USER: CnTopBarUser = {
  name: "Lucía Méndez",
  detail: "lucia.mendez@empresa.mx",
  actions: [
    { id: "perfil", label: "Mi perfil", icon: "person" },
    { id: "ajustes", label: "Ajustes", icon: "settings" },
    { id: "salir", label: "Cerrar sesión", icon: "logout", danger: true },
  ],
};

const meta: Meta<typeof CnTopBar> = {
  title: "Components/CnTopBar",
  component: CnTopBar,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: catalogDocs("CnTopBar") } } },
  args: {
    brand: <Brand />,
    title: "Contactos",
    onMenuClick: () => undefined,
    onSearchClick: () => undefined,
    actions: <Actions />,
    user: USER,
  },
};

export default meta;
type Story = StoryObj<typeof CnTopBar>;

export const Default: Story = {};

/** Con un `CnSearchField` propio en lugar del botón que abre la paleta de comandos. */
export const WithSearchField: Story = {
  args: {
    onSearchClick: undefined,
    search: <CnSearchField label="" placeholder="Buscar contactos, empresas…" size="sm" />,
  },
};

/** Compacta: la búsqueda pasa a ícono y el título se oculta (se decide por el ancho del contenedor). */
export const Compact: Story = { args: { compact: true } };

export const Minimal: Story = {
  args: { title: undefined, onSearchClick: undefined, actions: undefined, onMenuClick: undefined },
};

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "16px" }}>
      <CnTopBarSkeleton />
      <CnTopBar skeleton onMenuClick={() => undefined} onSearchClick={() => undefined} />
    </Box>
  ),
};

const LONG =
  "Seguimiento de oportunidades comerciales de la región Bajío y Occidente con distribuidores autorizados";

/** Datos extremos (título de 100+ caracteres, nombre sin espacios, usuario larguísimo) a 320, 480 y 1200 px. */
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
            }}
          >
            <CnTopBar
              brand={<Brand />}
              title={LONG}
              onMenuClick={() => undefined}
              onSearchClick={() => undefined}
              actions={<Actions />}
              user={{ ...USER, name: "Maximiliano Hernández Arellanos de la Garza", detail: LONG }}
            />
            <CnTopBar
              title="SinEspaciosSinEspaciosSinEspaciosSinEspaciosSinEspacios"
              search={<CnSearchField label="" placeholder={LONG} size="sm" />}
              user={USER}
            />
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

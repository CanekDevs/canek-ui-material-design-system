import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { catalogDocs } from "../../catalog";
import { CnAvatar } from "../CnAvatar";
import { CnSidebarNav } from "./CnSidebarNav";
import type { CnSidebarNavProps, CnSidebarNavSection } from "./CnSidebarNav";
import { CnSidebarNavSkeleton } from "./CnSidebarNavSkeleton";
import { CRM_NAV } from "./nav-sample";

const Brand = ({ mini = false }: { mini?: boolean }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
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
    {!mini && (
      <Typography sx={{ fontWeight: 600, fontSize: "15px", whiteSpace: "nowrap" }}>
        Canek CRM
      </Typography>
    )}
  </Box>
);

/** Estado local para que la historia responda a clics, favoritos y contraer. */
const Live = (props: Partial<CnSidebarNavProps>) => {
  const [active, setActive] = useState(props.activeId ?? "contactos");
  const [collapsed, setCollapsed] = useState(props.collapsed ?? false);
  const [favorites, setFavorites] = useState<string[]>(props.favorites ?? []);
  return (
    <Box sx={{ height: 640, display: "flex", border: "1px solid var(--cn-color-border, #dde0e4)" }}>
      <CnSidebarNav
        sections={CRM_NAV}
        header={<Brand mini={collapsed} />}
        {...props}
        activeId={active}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        favorites={favorites}
        onFavoriteChange={
          props.onFavoriteChange === undefined
            ? undefined
            : (id, fav) => setFavorites((f) => (fav ? [...f, id] : f.filter((x) => x !== id)))
        }
        onNavigate={(item, event) => {
          event.preventDefault();
          setActive(item.id);
        }}
      />
    </Box>
  );
};

const meta: Meta<typeof CnSidebarNav> = {
  title: "Components/CnSidebarNav",
  component: CnSidebarNav,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: catalogDocs("CnSidebarNav") } } },
};

export default meta;
type Story = StoryObj<typeof CnSidebarNav>;

export const Default: Story = { render: () => <Live /> };

/** Subpágina activa: su padre se abre solo y se marca en color. */
export const ActiveChild: Story = { render: () => <Live activeId="pronostico" /> };

/** Modo mini: solo íconos con tooltip; los padres abren un menú con sus subpáginas. */
export const Collapsed: Story = { render: () => <Live collapsed /> };

/** Favoritos: la estrella aparece al pasar el cursor o con el foco y crea el grupo «Favoritos». */
export const Favorites: Story = {
  render: () => <Live favorites={["embudo", "reportes"]} onFavoriteChange={() => undefined} />,
};

export const WithFooter: Story = {
  render: () => (
    <Live
      footer={
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px", p: "6px 8px", minWidth: 0 }}>
          <CnAvatar name="Lucía Méndez" size="sm" />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: "13px", fontWeight: 600 }} noWrap>
              Lucía Méndez
            </Typography>
            <Typography
              sx={{ fontSize: "12px", color: "var(--cn-color-text-muted, #6e7682)" }}
              noWrap
            >
              Ventas · Norte
            </Typography>
          </Box>
        </Box>
      }
    />
  ),
};

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "flex", gap: "24px", height: 420 }}>
      <CnSidebarNavSkeleton />
      <CnSidebarNavSkeleton collapsed />
      <CnSidebarNav skeleton sections={CRM_NAV} />
    </Box>
  ),
};

const LONG =
  "Seguimiento de oportunidades comerciales de la región Bajío y Occidente con distribuidores autorizados";
const EXTREME: CnSidebarNavSection[] = [
  {
    id: "extremos",
    label: LONG,
    items: [
      { id: "largo", label: LONG, icon: "folder", badge: 125000 },
      {
        id: "sin-espacios",
        label: "SinEspaciosSinEspaciosSinEspaciosSinEspaciosSinEspacios",
        icon: "article",
      },
      {
        id: "padre",
        label: LONG,
        icon: "layers",
        children: [{ id: "hijo", label: LONG, badge: "nuevo" }],
      },
      { id: "sin-icono", label: "Página sin ícono" },
    ],
  },
  { id: "vacio", label: "Grupo vacío", items: [] },
];

/** Datos extremos (textos de 100+ caracteres, palabras sin espacios, insignias enormes, grupo vacío) a 320, 480 y 1200 px. */
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
              display: "flex",
              gap: "12px",
              height: 420,
              border: "1px dashed var(--cn-color-border, #dde0e4)",
            }}
          >
            <CnSidebarNav sections={EXTREME} activeId="hijo" header={<Brand />} />
            {width > 400 && <CnSidebarNav sections={EXTREME} activeId="largo" collapsed />}
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

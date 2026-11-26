import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { catalogDocs } from "../../catalog";
import { CnBadge } from "../CnBadge";
import { CRM_COMMANDS } from "../CnCommandPalette/commands-sample";
import { CnIcon } from "../CnIcon";
import { CnPageContainer } from "../CnPageContainer";
import { CRM_NAV } from "../CnSidebarNav/nav-sample";
import { CnAppShell } from "./CnAppShell";
import type { CnAppShellProps } from "./CnAppShell";
import { CnAppShellSkeleton } from "./CnAppShellSkeleton";

const Brand = ({ text = true }: { text?: boolean }) => (
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
    {text && (
      <Typography sx={{ fontWeight: 600, fontSize: "15px", whiteSpace: "nowrap" }}>
        Canek CRM
      </Typography>
    )}
  </Box>
);

const Content = ({ title }: { title: string }) => (
  <Box sx={{ p: "24px" }}>
    <CnPageContainer title={title} subtitle="Contenido de ejemplo dentro del shell.">
      <Box sx={{ display: "grid", gap: "16px" }}>
        {Array.from({ length: 8 }, (_, i) => (
          <Box
            key={i}
            sx={{
              height: 96,
              borderRadius: "var(--cn-radius-lg, 12px)",
              border: "1px solid var(--cn-color-border, #dde0e4)",
              backgroundColor: "var(--cn-color-surface, #ffffff)",
            }}
          />
        ))}
      </Box>
    </CnPageContainer>
  </Box>
);

const Live = (props: Partial<CnAppShellProps>) => {
  const [active, setActive] = useState("contactos");
  const label = CRM_NAV.flatMap((s) => s.items.flatMap((i) => [i, ...(i.children ?? [])])).find(
    (i) => i.id === active,
  )?.label;
  return (
    <CnAppShell
      height={640}
      nav={{
        sections: CRM_NAV,
        activeId: active,
        header: <Brand />,
        onNavigate: (item, event) => {
          event.preventDefault();
          setActive(item.id);
        },
      }}
      topBar={{
        title: label,
        actions: (
          <IconButton
            aria-label="Notificaciones (3 sin leer)"
            sx={{ width: 40, height: 40, color: "var(--cn-color-text-muted, #6e7682)" }}
          >
            <CnBadge content={3} color="error" size="sm">
              <CnIcon name="notifications" size={22} />
            </CnBadge>
          </IconButton>
        ),
        user: {
          name: "Lucía Méndez",
          detail: "lucia.mendez@empresa.mx",
          actions: [
            { id: "perfil", label: "Mi perfil", icon: "person" },
            { id: "salir", label: "Cerrar sesión", icon: "logout", danger: true },
          ],
        },
      }}
      commandPalette={{ commands: CRM_COMMANDS, recent: ["c-lucia"] }}
      {...props}
    >
      <Content title={label ?? ""} />
    </CnAppShell>
  );
};

const meta: Meta<typeof CnAppShell> = {
  title: "Components/CnAppShell",
  component: CnAppShell,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: catalogDocs("CnAppShell") } },
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof CnAppShell>;

/** Escritorio: el botón de menú contrae la navegación a modo mini; Ctrl + K abre la paleta. */
export const Default: Story = { render: () => <Live /> };

export const Collapsed: Story = { render: () => <Live defaultCollapsed /> };

/** Móvil: la navegación es un cajón y la búsqueda un ícono. */
export const Mobile: Story = {
  render: () => (
    <Box sx={{ width: 390, border: "1px solid var(--cn-color-border, #dde0e4)" }}>
      <Live />
    </Box>
  ),
};

/** Sin barra superior: el botón para contraer vive al pie de la navegación. */
export const WithoutTopBar: Story = {
  render: () => <Live topBar={undefined} commandPalette={undefined} />,
};

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "16px" }}>
      <CnAppShellSkeleton height={420} />
      <CnAppShell skeleton height={420} nav={{ sections: CRM_NAV }} />
    </Box>
  ),
};

const LONG =
  "Seguimiento de oportunidades comerciales de la región Bajío y Occidente con distribuidores autorizados";

/** Datos extremos (títulos de 100+ caracteres, palabras sin espacios, contenido ancho) a 320, 480 y 1200 px. */
export const Responsive: Story = {
  parameters: { maxWidth: "none" },
  render: () => (
    <Box sx={{ display: "grid", gap: "24px", p: "16px" }}>
      {[320, 480, 1200].map((width) => (
        <Box key={width} data-stress-width={width} sx={{ width }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {width}px
          </Typography>
          <Box sx={{ border: "1px dashed var(--cn-color-border, #dde0e4)" }}>
            <CnAppShell
              height={420}
              nav={{
                sections: [
                  {
                    id: "x",
                    label: LONG,
                    items: [{ id: "a", label: LONG, icon: "folder", badge: 125000 }],
                  },
                ],
                activeId: "a",
                header: <Brand />,
              }}
              topBar={{
                title: LONG,
                brand: width < 900 ? <Brand text={false} /> : undefined,
                onSearchClick: () => undefined,
              }}
            >
              <Box sx={{ p: "16px", overflowWrap: "anywhere" }}>
                <Typography>{LONG}</Typography>
                <Typography>
                  SinEspaciosSinEspaciosSinEspaciosSinEspaciosSinEspaciosSinEspacios
                </Typography>
              </Box>
            </CnAppShell>
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

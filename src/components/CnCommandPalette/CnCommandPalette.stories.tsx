import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import { catalogDocs } from "../../catalog";
import { CnButton } from "../CnButton";
import { CnCommandPalette } from "./CnCommandPalette";
import type { CnCommandPaletteProps } from "./CnCommandPalette";
import { CnCommandPaletteSkeleton } from "./CnCommandPaletteSkeleton";
import type { CnCommand } from "./command-utils";
import { CRM_COMMANDS } from "./commands-sample";

const Live = (props: Partial<CnCommandPaletteProps>) => {
  const [open, setOpen] = useState(true);
  const [last, setLast] = useState<string>("—");
  return (
    <Box sx={{ display: "grid", gap: "12px", justifyItems: "start" }}>
      <CnButton onClick={() => setOpen(true)}>Abrir paleta (Ctrl + K)</CnButton>
      <Typography sx={{ fontSize: "13px" }}>Último comando: {last}</Typography>
      <CnCommandPalette
        commands={CRM_COMMANDS}
        {...props}
        open={open}
        onOpenChange={setOpen}
        onSelect={(c) => setLast(c.label)}
      />
    </Box>
  );
};

const meta: Meta<typeof CnCommandPalette> = {
  title: "Components/CnCommandPalette",
  component: CnCommandPalette,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: catalogDocs("CnCommandPalette") } } },
};

export default meta;
type Story = StoryObj<typeof CnCommandPalette>;

export const Default: Story = { render: () => <Live /> };

/** Con la búsqueda vacía, los recientes aparecen primero. */
export const WithRecent: Story = { render: () => <Live recent={["c-lucia", "ir-embudo"]} /> };

export const NoResults: Story = { render: () => <Live query="zzzz" /> };

/** Búsqueda remota: los registros llegan del servidor mientras se escribe. */
export const RemoteSearch: Story = {
  render: function Remote() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [found, setFound] = useState<CnCommand[]>([]);
    useEffect(() => {
      if (!query.trim()) {
        setFound([]);
        return undefined;
      }
      setLoading(true);
      const t = setTimeout(() => {
        setFound(
          Array.from({ length: 4 }, (_, i) => ({
            id: `remoto-${query}-${i}`,
            label: `${query} · registro ${i + 1}`,
            group: "Del servidor",
            icon: "person",
            description: "Resultado remoto",
            keywords: [query],
          })),
        );
        setLoading(false);
      }, 600);
      return () => clearTimeout(t);
    }, [query]);
    return (
      <Live
        commands={[...CRM_COMMANDS.slice(0, 5), ...found]}
        query={query}
        onQueryChange={setQuery}
        loading={loading}
      />
    );
  },
};

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "16px", maxWidth: 640 }}>
      <CnCommandPaletteSkeleton />
      <Live skeleton />
    </Box>
  ),
};

const LONG =
  "Seguimiento de oportunidades comerciales de la región Bajío y Occidente con distribuidores autorizados";

/** Datos extremos (nombres de 100+ caracteres, palabras sin espacios, 200 comandos) a 320, 480 y 1200 px. */
export const Responsive: Story = {
  parameters: { maxWidth: "none" },
  render: () => {
    const extreme: CnCommand[] = [
      {
        id: "largo",
        label: LONG,
        group: LONG,
        icon: "folder",
        description: LONG,
        hotkey: "mod+shift+alt+l",
      },
      {
        id: "sin",
        label: "SinEspaciosSinEspaciosSinEspaciosSinEspaciosSinEspaciosSinEspacios",
        group: "Extremos",
      },
      ...Array.from({ length: 200 }, (_, i) => ({
        id: `c${i}`,
        label: `Registro ${i + 1}`,
        group: "Muchos",
      })),
    ];
    return (
      <Box sx={{ display: "grid", gap: "24px" }}>
        {[320, 480, 1200].map((width) => (
          <Box key={width} data-stress-width={width} sx={{ width }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {width}px
            </Typography>
            {/* la paleta es un diálogo: dentro del marco se ve con el ancho de la ventana */}
            <Box
              sx={{
                border: "1px dashed var(--cn-color-border, #dde0e4)",
                height: 380,
                position: "relative",
                overflow: "hidden",
                transform: "translateZ(0)",
              }}
            >
              <CnCommandPalette
                open
                onOpenChange={() => undefined}
                commands={extreme}
                hotkey={false}
                disablePortal
              />
            </Box>
          </Box>
        ))}
      </Box>
    );
  },
};

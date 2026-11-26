import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { catalogDocs } from "../../catalog";
import { CnConversationList } from "./CnConversationList";
import type { CnConversation, CnConversationListProps } from "./CnConversationList";
import { CnConversationListSkeleton } from "./CnConversationListSkeleton";
import { CONVERSATIONS_NOW, CRM_CONVERSATIONS } from "./conversations-sample";

const Live = (props: Partial<CnConversationListProps>) => {
  const [items, setItems] = useState<CnConversation[]>(props.conversations ?? CRM_CONVERSATIONS);
  const [selected, setSelected] = useState("c1");
  const update = (id: string, patch: Partial<CnConversation>) =>
    setItems((all) => all.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  return (
    <Box sx={{ width: 360, height: 560, border: "1px solid var(--cn-color-border, #dde0e4)" }}>
      <CnConversationList
        now={CONVERSATIONS_NOW}
        selectedId={selected}
        onSelect={(id) => {
          setSelected(id);
          update(id, { unread: 0 });
        }}
        onPinChange={(id, pinned) => update(id, { pinned })}
        onRename={(id, title) => update(id, { title })}
        onDelete={(id) => setItems((all) => all.filter((c) => c.id !== id))}
        {...props}
        conversations={items}
      />
    </Box>
  );
};

const meta: Meta<typeof CnConversationList> = {
  title: "Components/CnConversationList",
  component: CnConversationList,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: catalogDocs("CnConversationList") } } },
};

export default meta;
type Story = StoryObj<typeof CnConversationList>;

/** Fijar, renombrar (también con F2) y borrar desde el menú de cada conversación. */
export const Default: Story = { render: () => <Live /> };

export const WithoutGroups: Story = { render: () => <Live groupByDate={false} /> };

export const Empty: Story = { render: () => <Live conversations={[]} /> };

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "flex", gap: "16px" }}>
      <Box sx={{ width: 360 }}>
        <CnConversationListSkeleton />
      </Box>
      <Box sx={{ width: 360 }}>
        <CnConversationList skeleton conversations={[]} />
      </Box>
    </Box>
  ),
};

const LONG =
  "Seguimiento de oportunidades comerciales de la región Bajío y Occidente con distribuidores autorizados";

/** Datos extremos (títulos de 100+ caracteres, palabras sin espacios, 999 sin leer, 300 conversaciones) a 320, 480 y 1200 px. */
export const Responsive: Story = {
  parameters: { maxWidth: "none" },
  render: () => {
    const extreme: CnConversation[] = [
      {
        id: "l",
        title: LONG,
        preview: LONG,
        time: CONVERSATIONS_NOW,
        unread: 999,
        pinned: true,
        muted: true,
      },
      {
        id: "s",
        title: "SinEspaciosSinEspaciosSinEspaciosSinEspaciosSinEspacios",
        preview: "SinEspaciosSinEspaciosSinEspaciosSinEspaciosSinEspacios",
      },
      ...Array.from({ length: 300 }, (_, i) => ({
        id: `x${i}`,
        title: `Cliente ${i + 1}`,
        preview: "Último mensaje",
        time: new Date(2026, 10, 26 - (i % 20), 9),
      })),
    ];
    return (
      <Box sx={{ display: "grid", gap: "24px" }}>
        {[320, 480, 1200].map((width) => (
          <Box key={width} data-stress-width={width} sx={{ width }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {width}px
            </Typography>
            <Box sx={{ height: 420, border: "1px dashed var(--cn-color-border, #dde0e4)" }}>
              <CnConversationList
                conversations={extreme}
                now={CONVERSATIONS_NOW}
                selectedId="l"
                onDelete={() => undefined}
              />
            </Box>
          </Box>
        ))}
      </Box>
    );
  },
};

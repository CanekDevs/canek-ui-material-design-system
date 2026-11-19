import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnButton } from "../CnButton";
import { CnNotificationCenter } from "./CnNotificationCenter";
import type { CnNotification, CnNotificationCenterProps } from "./CnNotificationCenter.types";
import { useBrowserNotifications } from "./useBrowserNotifications";

const DESCRIPTION = `
**Para qué sirve.** Bandeja de notificaciones de la app (superconjunto de \`TbNotificationFloater\`): campana con contador, panel en popover (pantalla completa en móvil) con pestañas (Todas / No leídas / Menciones o categorías propias), agrupación por día, marcar como leída/no leída y todas, descartar, acciones por notificación, estado vacío, carga infinita, API de tiempo real (pasa \`notifications\` actualizadas y recibe \`onNewNotifications\`), anuncio a lectores de pantalla, vista previa flotante de las nuevas (\`preview\`), avisos del navegador (\`browserNotifications\` + \`useBrowserNotifications()\`) y enlace a configuración. También funciona en línea (\`mode="inline"\`) para la página "Ver todas".

**Cuándo NO usarlo.** Para un aviso pasajero tras una acción usa \`CnToast\`; para un mensaje fijo en la página, \`CnAlert\`; para un historial de auditoría sin estado de lectura, \`CnTimeline\`; para listas genéricas, \`CnList\`.

**Relación con vecinos.** La lista es un \`CnList\` (no lectura, acciones en línea/menú, grupos con encabezado fijo, carga infinita, skeleton, vacío); usa \`CnTabs\`, \`CnBadge\`, el encabezado de \`CnDialog\` y \`CnDrawer\` en móvil; las fechas vienen de las utilidades de \`CnTimeline\`.
`;

const meta: Meta<typeof CnNotificationCenter> = {
  title: "Overlays/CnNotificationCenter",
  component: CnNotificationCenter,
  tags: ["autodocs"],
  parameters: { layout: "padded", docs: { description: { component: DESCRIPTION } } },
};

export default meta;
type Story = StoryObj<typeof CnNotificationCenter>;

const now = Date.now();
const ago = (m: number) => now - m * 60000;

const SEED: CnNotification[] = [
  {
    id: "1",
    title: "Factura A-1024 timbrada",
    message: "Se envió por correo a Acme S.A. de C.V.",
    time: ago(2),
    tone: "success",
    icon: "receipt_long",
    source: "Facturación",
  },
  {
    id: "2",
    title: "Ana López te mencionó",
    message: "@tú ¿puedes revisar el anexo del contrato antes de las 5?",
    time: ago(40),
    mention: true,
    avatar: { name: "Ana López" },
    source: "Contratos",
  },
  {
    id: "3",
    title: "Certificado SAT por vencer",
    message: "Tu CSD vence en 5 días. Renuévalo para seguir timbrando.",
    time: ago(180),
    tone: "warning",
    icon: "warning",
    source: "Configuración",
  },
  {
    id: "4",
    title: "Nómina quincenal procesada",
    time: ago(60 * 26),
    read: true,
    tone: "info",
    icon: "payments",
    source: "Nómina",
  },
  {
    id: "5",
    title: "Respaldo completado",
    message: "12.4 GB respaldados correctamente.",
    time: ago(60 * 24 * 4),
    read: true,
    icon: "backup",
    source: "Sistema",
  },
  {
    id: "6",
    title: "Pago rechazado",
    message: "La tarjeta terminación 4421 fue rechazada.",
    time: ago(60 * 24 * 6),
    tone: "error",
    icon: "credit_card",
    source: "Cobranza",
  },
];

/** Estado local que simula el backend: marcar, descartar y cargar más. */
const useInbox = (initial = SEED) => {
  const [items, setItems] = useState<CnNotification[]>(initial);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const props: Partial<CnNotificationCenterProps> = {
    notifications: items,
    onMarkRead: (ids, read) =>
      setItems((p) => p.map((n) => (ids.includes(n.id) ? { ...n, read } : n))),
    onMarkAllRead: () => setItems((p) => p.map((n) => ({ ...n, read: true }))),
    onDismiss: (n) => setItems((p) => p.filter((x) => x.id !== n.id)),
    hasMore: page < 2,
    loadingMore,
    onLoadMore: () => {
      setLoadingMore(true);
      setTimeout(() => {
        setItems((p) => [
          ...p,
          ...Array.from({ length: 5 }, (_, i) => ({
            id: `old-${page}-${i}`,
            title: `Aviso anterior ${page * 5 + i + 1}`,
            message: "Notificación de días anteriores.",
            time: ago(60 * 24 * (8 + page * 5 + i)),
            read: true,
            icon: "notifications",
          })),
        ]);
        setPage((x) => x + 1);
        setLoadingMore(false);
      }, 800);
    },
  };
  return { items, setItems, props };
};

export const Default: Story = {
  render: function Render() {
    const { props } = useInbox();
    return (
      <Box sx={{ display: "flex", justifyContent: "flex-end", maxWidth: 720 }}>
        <CnNotificationCenter
          notifications={[]}
          {...props}
          onSettingsClick={() => alert("Configuración")}
          onViewAll={() => alert("Ver todas")}
        />
      </Box>
    );
  },
};

/** Tiempo real: llegan notificaciones nuevas (anuncio + vista previa flotante). */
export const RealTimeWithPreview: Story = {
  render: function Render() {
    const { setItems, props } = useInbox(SEED.slice(0, 3));
    const [n, setN] = useState(1);
    const browser = useBrowserNotifications();
    return (
      <Box
        sx={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", maxWidth: 720 }}
      >
        <CnButton
          variant="outlined"
          startIcon="add"
          onClick={() => {
            setItems((p) => [
              {
                id: `live-${n}`,
                title: `Nuevo pedido #${1000 + n}`,
                message: "Grupo Industrial del Norte · $18,400.00",
                time: Date.now(),
                tone: "info",
                icon: "shopping_cart",
                source: "Ventas",
              },
              ...p,
            ]);
            setN((x) => x + 1);
          }}
        >
          Simular llegada
        </CnButton>
        <CnButton
          variant="text"
          disabled={!browser.supported || browser.permission === "granted"}
          onClick={() => void browser.requestPermission()}
        >
          Avisos del escritorio: {browser.permission}
        </CnButton>
        <Box sx={{ ml: "auto" }}>
          <CnNotificationCenter notifications={[]} {...props} preview browserNotifications />
        </Box>
      </Box>
    );
  },
};

/** Pestañas por categoría propias. */
export const CustomTabs: Story = {
  render: function Render() {
    const { props } = useInbox();
    return (
      <CnNotificationCenter
        notifications={[]}
        {...props}
        mode="inline"
        tabs={[
          { id: "all", label: "Todas" },
          {
            id: "billing",
            label: "Facturación",
            filter: (n) => n.source === "Facturación" || n.source === "Cobranza",
          },
          { id: "hr", label: "Nómina", filter: (n) => n.source === "Nómina" },
          {
            id: "system",
            label: "Sistema",
            filter: (n) => n.source === "Sistema" || n.source === "Configuración",
          },
        ]}
        sx={{ maxWidth: 480 }}
      />
    );
  },
};

/** Acciones propias por notificación (en línea y en el menú). */
export const ItemActions: Story = {
  render: function Render() {
    const { props } = useInbox(
      SEED.map((n) =>
        n.id === "2"
          ? {
              ...n,
              actions: [
                {
                  id: "reply",
                  label: "Responder",
                  icon: "reply",
                  inline: true,
                  onClick: () => alert("Responder"),
                },
              ],
            }
          : {
              ...n,
              actions: [
                {
                  id: "archive",
                  label: "Archivar",
                  icon: "archive",
                  onClick: () => alert("Archivar"),
                },
              ],
            },
      ),
    );
    return (
      <CnNotificationCenter notifications={[]} {...props} mode="inline" sx={{ maxWidth: 480 }} />
    );
  },
};

/** Página "Ver todas": modo en línea. */
export const Inline: Story = {
  render: function Render() {
    const { props } = useInbox();
    return (
      <CnNotificationCenter
        notifications={[]}
        {...props}
        mode="inline"
        listMaxHeight={520}
        sx={{ maxWidth: 640 }}
      />
    );
  },
};

export const StatesEmptyLoadingError: Story = {
  render: () => (
    <Box
      sx={{
        display: "grid",
        gap: "16px",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      }}
    >
      <CnNotificationCenter mode="inline" notifications={[]} />
      <CnNotificationCenter mode="inline" notifications={[]} loading />
      <CnNotificationCenter
        mode="inline"
        notifications={[]}
        error="No se pudieron cargar las notificaciones."
        onRetry={() => {}}
      />
      <CnNotificationCenter mode="inline" notifications={SEED} skeleton />
      <Box>
        <CnNotificationCenter notifications={SEED} skeleton />
      </Box>
    </Box>
  ),
};

const EXTREME: CnNotification[] = [
  {
    id: "e1",
    title:
      "María Fernanda de la Garza Villarreal Santos de Montemayor te mencionó en el contrato de arrendamiento",
    message:
      "responsable.de.compras.regionales@comercializadora-del-centro-y-bajio.com.mx " +
      "Mensaje muy largo ".repeat(20),
    time: ago(1),
    mention: true,
    avatar: { name: "María Fernanda" },
    source: "Contratos y arrendamientos de la región noreste",
  },
  ...SEED,
];

/** Stress: panel en línea a 320, 480 y 1200 px con datos extremos y contador > 99. */
export const Responsive: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "24px", p: "16px" }}>
      {[320, 480, 1200].map((w) => (
        <Box key={w}>
          <Box sx={{ fontSize: 12, mb: "6px", color: "var(--cn-color-text-muted, #6e7682)" }}>
            {w}px
          </Box>
          <Box
            data-stress-container={w}
            sx={{ width: w, maxWidth: "100%", display: "grid", gap: "12px" }}
          >
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <CnNotificationCenter notifications={EXTREME} unreadCount={250} />
            </Box>
            <CnNotificationCenter
              mode="inline"
              notifications={EXTREME}
              onMarkRead={() => {}}
              onMarkAllRead={() => {}}
              onDismiss={() => {}}
              onSettingsClick={() => {}}
              onViewAll={() => {}}
              listMaxHeight={360}
              tabs={[
                { id: "all", label: "Todas" },
                { id: "unread", label: "No leídas", filter: (n) => !n.read },
                { id: "mentions", label: "Menciones", filter: (n) => Boolean(n.mention) },
                {
                  id: "billing",
                  label: "Facturación y cobranza",
                  filter: (n) => n.source === "Facturación",
                },
              ]}
            />
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import { catalogDocs } from "../../catalog";
import { CnButton } from "../CnButton";
import { CnSegmentedField } from "../CnSegmentedField";
import { CnNotificationCenter } from "./CnNotificationCenter";
import type {
  CnNotification,
  CnNotificationCategorySetting,
  CnNotificationCenterProps,
  CnNotificationConnection,
} from "./CnNotificationCenter.types";
import { useBrowserNotifications } from "./useBrowserNotifications";

const meta: Meta<typeof CnNotificationCenter> = {
  title: "Overlays/CnNotificationCenter",
  component: CnNotificationCenter,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: catalogDocs("CnNotificationCenter") } },
  },
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
    category: "facturacion",
    href: "#/facturas/A-1024",
  },
  {
    id: "2",
    title: "Ana López te mencionó",
    message: "@tú ¿puedes revisar el anexo del contrato antes de las 5?",
    time: ago(40),
    mention: true,
    avatar: { name: "Ana López" },
    source: "Contratos",
    category: "contratos",
  },
  {
    id: "3",
    title: "Certificado SAT por vencer",
    message: "Tu CSD vence en 5 días. Renuévalo para seguir timbrando.",
    time: ago(180),
    tone: "warning",
    icon: "warning",
    priority: "high",
    source: "Configuración",
    category: "sistema",
  },
  {
    id: "4",
    title: "Nómina quincenal procesada",
    time: ago(60 * 26),
    read: true,
    tone: "info",
    icon: "payments",
    source: "Nómina",
    category: "nomina",
  },
  {
    id: "5",
    title: "Respaldo completado",
    message: "12.4 GB respaldados correctamente.",
    time: ago(60 * 24 * 4),
    read: true,
    icon: "backup",
    source: "Sistema",
    category: "sistema",
  },
  {
    id: "6",
    title: "Pago rechazado",
    message: "La tarjeta terminación 4421 fue rechazada.",
    time: ago(60 * 24 * 6),
    tone: "error",
    icon: "credit_card",
    source: "Cobranza",
    category: "facturacion",
  },
];

/** Estado local que simula el backend: marcar, descartar, posponer, silenciar y cargar más. */
const useInbox = (initial = SEED) => {
  const [items, setItems] = useState<CnNotification[]>(initial);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [muted, setMuted] = useState<string[]>([]);
  const props: Partial<CnNotificationCenterProps> = {
    notifications: items,
    onMarkRead: (ids, read) =>
      setItems((p) => p.map((n) => (ids.includes(n.id) ? { ...n, read } : n))),
    onMarkAllRead: () => setItems((p) => p.map((n) => ({ ...n, read: true }))),
    onDismiss: (n) => setItems((p) => p.filter((x) => x.id !== n.id)),
    onDismissMany: (list) => setItems((p) => p.filter((x) => !list.some((n) => n.id === x.id))),
    onSnooze: (n, until) =>
      setItems((p) => p.map((x) => (x.id === n.id ? { ...x, snoozedUntil: until } : x))),
    mutedSources: muted,
    onMuteSource: (id, on) =>
      setMuted((p) => (on ? [...p.filter((x) => x !== id), id] : p.filter((x) => x !== id))),
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

/** Campana con panel. Atajo: Alt+N abre y cierra el panel. */
export const Default: Story = {
  render: function Render() {
    const { props } = useInbox();
    return (
      <Box sx={{ display: "flex", justifyContent: "flex-end", maxWidth: 720 }}>
        <CnNotificationCenter
          notifications={[]}
          {...props}
          hotkey="alt+n"
          onSettingsClick={() => alert("Configuración")}
          onViewAll={() => alert("Ver todas")}
        />
      </Box>
    );
  },
};

/** Tiempo real: llegan notificaciones nuevas (anuncio, animación, vista previa y sonido opcional). */
export const RealTimeWithPreview: Story = {
  render: function Render() {
    const { setItems, props } = useInbox(SEED.slice(0, 3));
    const [n, setN] = useState(1);
    const [sound, setSound] = useState(false);
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
        <CnButton variant="text" onClick={() => setSound((v) => !v)}>
          Sonido: {sound ? "activado" : "desactivado"}
        </CnButton>
        <CnButton
          variant="text"
          disabled={!browser.supported || browser.permission === "granted"}
          onClick={() => void browser.requestPermission()}
        >
          Avisos del escritorio: {browser.permission}
        </CnButton>
        <Box sx={{ ml: "auto" }}>
          <CnNotificationCenter
            notifications={[]}
            {...props}
            preview
            browserNotifications
            sound={sound}
          />
        </Box>
      </Box>
    );
  },
};

/**
 * Prioridades y grupos: las urgentes sin leer quedan fijas arriba, lo
 * posterior a la última visita va en "Nuevas" y el resto se agrupa por origen
 * con grupos plegables.
 */
export const PrioritiesAndGroups: Story = {
  render: function Render() {
    const { props } = useInbox([
      {
        id: "u1",
        title: "Servidor de timbrado sin respuesta",
        message: "Las facturas se están encolando. Revisa el estado del PAC.",
        time: ago(25),
        priority: "urgent",
        source: "Sistema",
      },
      ...SEED,
    ]);
    const [groupBy, setGroupBy] = useState<"day" | "source" | "category">("source");
    return (
      <Box sx={{ display: "grid", gap: "12px", maxWidth: 480 }}>
        <CnSegmentedField
          label="Agrupar por"
          value={groupBy}
          onChange={(v) => setGroupBy(v as typeof groupBy)}
          options={[
            { value: "day", label: "Día" },
            { value: "source", label: "Origen" },
            { value: "category", label: "Categoría" },
          ]}
        />
        <CnNotificationCenter
          notifications={[]}
          {...props}
          mode="inline"
          groupBy={groupBy}
          collapsibleGroups
          lastSeenAt={ago(60)}
          searchable
        />
      </Box>
    );
  },
};

/**
 * Contenido enriquecido: imagen, barra de avance de un proceso y botones
 * con carga mientras la promesa termina.
 */
export const RichNotifications: Story = {
  render: function Render() {
    const [progress, setProgress] = useState(5);
    useEffect(() => {
      if (progress >= 100) return;
      const timer = setTimeout(() => setProgress((p) => Math.min(100, p + 7)), 600);
      return () => clearTimeout(timer);
    }, [progress]);
    const wait = () => new Promise<void>((resolve) => setTimeout(resolve, 1200));
    const [read, setRead] = useState<string[]>([]);
    const list: CnNotification[] = [
      {
        id: "job",
        title: progress < 100 ? "Exportando reporte de ventas" : "Reporte de ventas listo",
        time: ago(1),
        icon: progress < 100 ? "sync" : "download",
        tone: progress < 100 ? "info" : "success",
        source: "Reportes",
        progress: {
          value: progress,
          label: progress < 100 ? `${progress}% · 12,480 filas` : "Listo para descargar",
          status: progress < 100 ? "running" : "done",
        },
        actions:
          progress < 100
            ? []
            : [
                {
                  id: "dl",
                  label: "Descargar",
                  icon: "download",
                  appearance: "button",
                  onClick: wait,
                },
              ],
      },
      {
        id: "approve",
        title: "Carlos Méndez solicita aprobar una compra",
        message: "Orden OC-5521 · 3 laptops · $64,200.00 MXN",
        time: ago(8),
        avatar: { name: "Carlos Méndez" },
        source: "Compras",
        priority: "high",
        actions: [
          { id: "ok", label: "Aprobar", icon: "check", appearance: "button", onClick: wait },
          {
            id: "no",
            label: "Rechazar",
            appearance: "button",
            color: "error",
            variant: "text",
            onClick: wait,
          },
        ],
      },
      {
        id: "img",
        title: "Nueva foto de evidencia de entrega",
        message: "Pedido #8812 · recibido por Juan Pérez",
        time: ago(30),
        icon: "image",
        source: "Logística",
        image: {
          src:
            "data:image/svg+xml;utf8," +
            encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="160"><rect width="320" height="160" fill="#dfe7f3"/><rect x="110" y="40" width="100" height="80" rx="6" fill="#9fb3d1"/><text x="160" y="148" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#4e5660">evidencia.jpg</text></svg>',
            ),
          alt: "Paquete entregado en recepción",
        },
      },
      {
        id: "fail",
        title: "Importación de clientes con errores",
        time: ago(90),
        icon: "error_outline",
        tone: "error",
        source: "Importaciones",
        progress: { value: 62, status: "error", label: "Se detuvo en la fila 3,120 de 5,000" },
      },
    ];
    return (
      <CnNotificationCenter
        notifications={list.map((n) => ({ ...n, read: read.includes(n.id) }))}
        onMarkRead={(ids, isRead) =>
          setRead((p) => (isRead ? [...p, ...ids] : p.filter((id) => !ids.includes(id))))
        }
        mode="inline"
        sx={{ maxWidth: 480 }}
      />
    );
  },
};

/** Selección en lote, posponer (menú ⋮) y silenciar un origen. */
export const BulkSnoozeAndMute: Story = {
  render: function Render() {
    const { props } = useInbox();
    return (
      <CnNotificationCenter
        notifications={[]}
        {...props}
        mode="inline"
        selectable
        sx={{ maxWidth: 480 }}
      />
    );
  },
};

const CATEGORIES: CnNotificationCategorySetting[] = [
  { id: "facturacion", label: "Facturación y cobranza", enabled: true },
  {
    id: "contratos",
    label: "Contratos",
    description: "Menciones y cambios de estado.",
    enabled: true,
  },
  { id: "nomina", label: "Nómina", enabled: false },
  { id: "sistema", label: "Sistema", description: "Respaldos y certificados.", enabled: true },
];

/**
 * Preferencias integradas (engrane): no molestar, sonido, vibración, avisos del
 * escritorio, categorías y orígenes silenciados.
 */
export const SettingsAndDoNotDisturb: Story = {
  render: function Render() {
    const { props } = useInbox();
    const [categories, setCategories] = useState(CATEGORIES);
    const [sound, setSound] = useState(false);
    const [vibrate, setVibrate] = useState(false);
    const enabled = new Set(categories.filter((c) => c.enabled).map((c) => c.id));
    return (
      <CnNotificationCenter
        {...props}
        notifications={(props.notifications ?? []).filter(
          (n) => !n.category || enabled.has(n.category),
        )}
        mode="inline"
        defaultDoNotDisturb
        sound={sound}
        onSoundChange={setSound}
        vibrate={vibrate}
        onVibrateChange={setVibrate}
        browserNotifications
        settingsHref="#/preferencias"
        settings={{
          categories,
          onCategoryChange: (id, on) =>
            setCategories((p) => p.map((c) => (c.id === id ? { ...c, enabled: on } : c))),
          showSound: true,
          showVibrate: true,
        }}
        sx={{ maxWidth: 480 }}
      />
    );
  },
};

/** Estado de la conexión en tiempo real (aviso en el panel y punto en la campana). */
export const Connection: Story = {
  render: function Render() {
    const { props } = useInbox();
    const [connection, setConnection] = useState<CnNotificationConnection>("offline");
    return (
      <Box sx={{ display: "grid", gap: "12px", maxWidth: 480 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <CnSegmentedField
            label="Conexión"
            value={connection}
            onChange={(v) => setConnection(v as CnNotificationConnection)}
            options={[
              { value: "online", label: "En línea" },
              { value: "reconnecting", label: "Reconectando" },
              { value: "offline", label: "Sin conexión" },
            ]}
          />
          <CnNotificationCenter
            notifications={[]}
            {...props}
            connection={connection}
            panel="popover"
          />
        </Box>
        <CnNotificationCenter
          notifications={[]}
          {...props}
          mode="inline"
          connection={connection}
          onReconnect={() => setConnection("reconnecting")}
        />
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
        searchable
        selectable
        listMaxHeight={520}
        sx={{ maxWidth: 640 }}
      />
    );
  },
};

/** Panel lateral (en teléfonos ocupa toda la pantalla y las acciones quedan siempre visibles). */
export const MobileDrawer: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: function Render() {
    const { props } = useInbox();
    const [categories, setCategories] = useState(CATEGORIES);
    return (
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <CnNotificationCenter
          notifications={[]}
          {...props}
          panel="drawer"
          searchable
          selectable
          settings={{
            categories,
            onCategoryChange: (id, on) =>
              setCategories((p) => p.map((c) => (c.id === id ? { ...c, enabled: on } : c))),
          }}
          onViewAll={() => undefined}
        />
      </Box>
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
      <CnNotificationCenter mode="inline" notifications={SEED} skeleton searchable />
      <Box>
        <CnNotificationCenter notifications={SEED} skeleton />
      </Box>
    </Box>
  ),
};

const EXTREME: CnNotification[] = [
  {
    id: "e0",
    title: "Falla_crítica_en_el_servicio_de_timbrado_masivo_de_comprobantes_fiscales_digitales",
    message: "Sin_espacios_".repeat(20),
    time: ago(1),
    priority: "urgent",
    source: "Sistema",
    actions: [
      {
        id: "a",
        label: "Reintentar el envío de todos los comprobantes pendientes",
        appearance: "button",
        onClick: () => undefined,
      },
      { id: "b", label: "Ver bitácora", appearance: "button", onClick: () => undefined },
    ],
    progress: { value: 37, label: "37% · 1,240 de 3,350 comprobantes procesados correctamente" },
  },
  {
    id: "e1",
    title:
      "María Fernanda de la Garza Villarreal Santos de Montemayor te mencionó en el contrato de arrendamiento",
    message:
      "responsable.de.compras.regionales@comercializadora-del-centro-y-bajio.com.mx " +
      "Mensaje muy largo ".repeat(20),
    time: ago(2),
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
              <CnNotificationCenter
                notifications={EXTREME}
                unreadCount={250}
                connection="offline"
                defaultDoNotDisturb
              />
            </Box>
            <CnNotificationCenter
              mode="inline"
              notifications={EXTREME}
              onMarkRead={() => {}}
              onMarkAllRead={() => {}}
              onDismiss={() => {}}
              onSnooze={() => {}}
              onMuteSource={() => {}}
              mutedSources={["Contratos y arrendamientos de la región noreste"]}
              settings={{ categories: CATEGORIES }}
              onViewAll={() => {}}
              searchable
              selectable
              connection="offline"
              onReconnect={() => {}}
              defaultDoNotDisturb
              lastSeenAt={ago(3)}
              listMaxHeight={420}
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

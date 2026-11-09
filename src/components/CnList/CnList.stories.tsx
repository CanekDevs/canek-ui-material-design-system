import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useMemo, useState } from "react";
import { CnButton } from "../CnButton";
import { CnList } from "./CnList";
import type { CnListItemData, CnListProps } from "./CnList.types";
import { CnListItem, CnListSubheader } from "./CnListItem";
import { CnListSkeleton } from "./CnListSkeleton";

const meta: Meta<typeof CnList> = {
  title: "Data Display/CnList",
  component: CnList,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: ["plain", "divided", "card", "inset"] },
    density: { control: "select", options: ["compact", "comfortable", "spacious"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
    surface: { control: "select", options: ["none", "outlined", "elevated", "filled"] },
    selectionMode: { control: "select", options: ["none", "single", "multiple"] },
    dividers: { control: "select", options: [undefined, true, false, "inset", "full"] },
    actionsVisibility: { control: "select", options: ["always", "hover"] },
  },
};
export default meta;

type Story = StoryObj<typeof CnList>;

const Frame = ({ children, width = 560 }: { children: React.ReactNode; width?: number }) => (
  <Box sx={{ maxWidth: width, width: "100%" }}>{children}</Box>
);

// ─── Datos ────────────────────────────────────────────────────────────────

type Contact = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "online" | "away" | "busy" | "offline";
  photo?: string;
};

const CONTACTS: Contact[] = [
  {
    id: "c1",
    name: "Ana López",
    email: "ana.lopez@canek.mx",
    role: "Diseño",
    status: "online",
    photo: "https://i.pravatar.cc/80?img=47",
  },
  {
    id: "c2",
    name: "Bruno Díaz",
    email: "bruno.diaz@canek.mx",
    role: "Ingeniería",
    status: "busy",
  },
  {
    id: "c3",
    name: "Carla Muñoz",
    email: "carla.munoz@canek.mx",
    role: "Producto",
    status: "away",
    photo: "https://i.pravatar.cc/80?img=32",
  },
  {
    id: "c4",
    name: "Daniel Pérez",
    email: "daniel.perez@canek.mx",
    role: "Ingeniería",
    status: "offline",
  },
  {
    id: "c5",
    name: "Elena Ramírez",
    email: "elena.ramirez@canek.mx",
    role: "Finanzas",
    status: "online",
  },
  {
    id: "c6",
    name: "Fernando Ávila",
    email: "fernando.avila@canek.mx",
    role: "Ventas",
    status: "online",
    photo: "https://i.pravatar.cc/80?img=12",
  },
  {
    id: "c7",
    name: "Gabriela Sáenz",
    email: "gabriela.saenz@canek.mx",
    role: "Recursos humanos",
    status: "away",
  },
  {
    id: "c8",
    name: "Héctor Núñez",
    email: "hector.nunez@canek.mx",
    role: "Soporte",
    status: "offline",
  },
  {
    id: "c9",
    name: "Irene Castillo",
    email: "irene.castillo@canek.mx",
    role: "Diseño",
    status: "online",
  },
  {
    id: "c10",
    name: "Jorge Olvera",
    email: "jorge.olvera@canek.mx",
    role: "Ingeniería",
    status: "busy",
  },
];

const ROLE_COLOR: Record<
  string,
  "primary" | "success" | "warning" | "info" | "accent" | "neutral"
> = {
  Diseño: "accent",
  Ingeniería: "primary",
  Producto: "info",
  Finanzas: "success",
  Ventas: "warning",
};

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

// ─── Historias ──────────────────────────────────────────────────────────

export const Playground: Story = {
  args: {
    variant: "divided",
    density: "comfortable",
    size: "md",
    surface: "outlined",
    selectionMode: "none",
    searchable: true,
    showCount: true,
    title: "Equipo",
    description: "Personas con acceso al espacio de trabajo",
  },
  render: (args) => (
    <Frame>
      <CnList<Contact>
        {...(args as CnListProps<Contact>)}
        items={CONTACTS}
        getId={(c) => c.id}
        getTitle={(c) => c.name}
        getSubtitle={(c) => c.email}
        getAvatar={(c) => ({ name: c.name, src: c.photo, status: c.status })}
        getStatus={(c) => ({ label: c.role, color: ROLE_COLOR[c.role] ?? "neutral" })}
      />
    </Frame>
  ),
};

/** Contactos con avatares, búsqueda sin acentos, grupos por inicial y encabezados fijos. */
export const Contacts: Story = {
  render: () => (
    <Frame>
      <CnList<Contact>
        title="Contactos"
        surface="outlined"
        variant="divided"
        searchable
        searchPlaceholder="Buscar por nombre, correo o área"
        items={CONTACTS}
        getId={(c) => c.id}
        getTitle={(c) => c.name}
        getSubtitle={(c) => `${c.role} · ${c.email}`}
        getAvatar={(c) => ({ name: c.name, src: c.photo, status: c.status })}
        groupBy={(c) => c.name[0].toUpperCase()}
        groupOrder={(a, b) => a.localeCompare(b)}
        showChevron
        onItemClick={() => undefined}
        maxHeight={420}
        showCount
        itemActions={[
          {
            id: "mail",
            label: "Enviar correo",
            icon: "mail",
            inline: true,
            onClick: () => undefined,
          },
          { id: "call", label: "Llamar", icon: "phone", inline: true, onClick: () => undefined },
        ]}
        actionsVisibility="hover"
      />
    </Frame>
  ),
};

type Notification = CnListItemData & { read: boolean };

/** Bandeja de notificaciones: no leídas, fecha relativa, acciones, deslizar y acciones masivas. */
export const NotificationsInbox: Story = {
  render: function Render() {
    const [items, setItems] = useState<Notification[]>([
      {
        id: "n1",
        title: "Carla Muñoz comentó tu propuesta",
        description:
          "“Me gusta la dirección, ¿podemos revisar los costos de la fase 2 antes del viernes?”",
        avatar: { name: "Carla Muñoz", src: "https://i.pravatar.cc/80?img=32" },
        timestamp: minutesAgo(3),
        read: false,
      },
      {
        id: "n2",
        title: "Factura F-2041 pagada",
        subtitle: "Cliente: Grupo Altamira · $48,300.00",
        icon: { name: "paid", color: "success" },
        timestamp: minutesAgo(42),
        read: false,
        status: { label: "Pagada", color: "success" },
      },
      {
        id: "n3",
        title: "Despliegue fallido en producción",
        subtitle: "api-gateway · build #1882",
        icon: { name: "error_outline", color: "error" },
        timestamp: minutesAgo(130),
        read: false,
        tone: "error",
      },
      {
        id: "n4",
        title: "Bruno Díaz te asignó una tarea",
        subtitle: "Migrar reportes a la nueva tabla",
        avatar: { name: "Bruno Díaz" },
        timestamp: minutesAgo(60 * 26),
        read: true,
      },
      {
        id: "n5",
        title: "Recordatorio: junta semanal",
        subtitle: "Mañana 10:00 · Sala Itzá",
        icon: { name: "event", color: "info" },
        timestamp: minutesAgo(60 * 50),
        read: true,
      },
      {
        id: "n6",
        title: "Nuevo inicio de sesión",
        subtitle: "Chrome en Windows · Ciudad de México",
        icon: { name: "security", color: "warning" },
        timestamp: minutesAgo(60 * 24 * 9),
        read: true,
      },
    ]);
    const unread = items.filter((n) => !n.read).length;
    const markRead = (ids: string[], read = true) =>
      setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read } : n)));
    const remove = (ids: string[]) => setItems((prev) => prev.filter((n) => !ids.includes(n.id)));
    return (
      <Frame width={620}>
        <CnList<Notification>
          title="Notificaciones"
          description={`${unread} sin leer`}
          headerAction={
            <CnButton size="small" variant="text" onClick={() => markRead(items.map((n) => n.id))}>
              Marcar todo como leído
            </CnButton>
          }
          surface="elevated"
          variant="divided"
          selectionMode="multiple"
          selectOnClick={false}
          onItemClick={(n) => markRead([n.id])}
          items={items}
          isItemUnread={(n) => !n.read}
          groupBy={(n) =>
            Date.now() - new Date(n.timestamp as Date).getTime() < 86_400_000 ? "Hoy" : "Anteriores"
          }
          itemActions={(n) => [
            {
              id: "toggle",
              label: n.read ? "Marcar como no leído" : "Marcar como leído",
              icon: n.read ? "mark_email_unread" : "mark_email_read",
              inline: true,
              onClick: () => markRead([n.id], !n.read),
            },
            { id: "snooze", label: "Posponer 1 hora", icon: "snooze", onClick: () => undefined },
            {
              id: "mute",
              label: "Silenciar este tipo",
              icon: "notifications_off",
              onClick: () => undefined,
            },
            {
              id: "delete",
              label: "Eliminar",
              icon: "delete",
              color: "error",
              divider: true,
              onClick: () => remove([n.id]),
            },
          ]}
          swipeActions={{
            right: {
              label: "Leído",
              icon: "drafts",
              color: "primary",
              onTrigger: (n) => markRead([n.id]),
            },
            left: {
              label: "Eliminar",
              icon: "delete",
              color: "error",
              onTrigger: (n) => remove([n.id]),
            },
          }}
          bulkActions={[
            {
              id: "read",
              label: "Marcar leído",
              icon: "drafts",
              onClick: (_, ids) => markRead(ids),
            },
            {
              id: "delete",
              label: "Eliminar",
              icon: "delete",
              color: "error",
              onClick: (_, ids) => remove(ids),
            },
          ]}
          emptyIcon="notifications_off"
          emptyTitle="Estás al día"
          emptyDescription="No tienes notificaciones pendientes."
        />
      </Frame>
    );
  },
};

type Task = { id: string; title: string; due?: string; priority: "Alta" | "Media" | "Baja" };

/** Tareas: casilla = completada, arrastrar (o Alt + flechas) para reordenar. */
export const TasksReorder: Story = {
  render: function Render() {
    const [tasks, setTasks] = useState<Task[]>([
      { id: "t1", title: "Revisar contrato con proveedor", due: "Hoy", priority: "Alta" },
      { id: "t2", title: "Preparar presentación trimestral", due: "Mañana", priority: "Media" },
      { id: "t3", title: "Actualizar inventario del almacén", due: "Vie", priority: "Baja" },
      { id: "t4", title: "Responder encuesta de clima laboral", priority: "Baja" },
      { id: "t5", title: "Conciliar cuentas bancarias", due: "Lun", priority: "Alta" },
    ]);
    const [done, setDone] = useState<string[]>(["t4"]);
    return (
      <Frame>
        <CnList<Task>
          title="Mis tareas"
          description={`${done.length} de ${tasks.length} completadas`}
          surface="outlined"
          variant="divided"
          items={tasks}
          getId={(t) => t.id}
          getTitle={(t) => t.title}
          getMeta={(t) => t.due}
          getStatus={(t) => ({
            label: t.priority,
            color: t.priority === "Alta" ? "error" : t.priority === "Media" ? "warning" : "neutral",
          })}
          getTone={(t) => (done.includes(t.id) ? "neutral" : undefined)}
          selectionMode="multiple"
          selectAll={false}
          selectedIds={done}
          onSelectionChange={(ids) => setDone(ids)}
          reorderable
          onReorder={(next) => setTasks(next)}
          footer={
            <CnButton size="small" variant="text" startIcon="add">
              Nueva tarea
            </CnButton>
          }
        />
      </Frame>
    );
  },
};

/** Ajustes: variante `inset`, íconos, chevrons, interruptores y secciones. */
export const SettingsList: Story = {
  render: function Render() {
    const [flags, setFlags] = useState({ push: true, email: false, twoFactor: true });
    const toggle = (key: keyof typeof flags) => (
      <Switch
        size="small"
        checked={flags[key]}
        onChange={(event) => setFlags((prev) => ({ ...prev, [key]: event.target.checked }))}
        slotProps={{ input: { "aria-label": key } }}
      />
    );
    return (
      <Frame width={480}>
        <CnList<CnListItemData>
          variant="inset"
          surface="filled"
          stickyHeaders={false}
          showGroupCount={false}
          sections={[
            {
              id: "cuenta",
              title: "Cuenta",
              items: [
                {
                  id: "perfil",
                  title: "Perfil",
                  subtitle: "Nombre, foto y datos de contacto",
                  icon: "person",
                  chevron: true,
                  onClick: () => undefined,
                },
                {
                  id: "seguridad",
                  title: "Seguridad",
                  subtitle: "Contraseña y sesiones",
                  icon: { name: "lock", color: "warning" },
                  chevron: true,
                  onClick: () => undefined,
                },
                {
                  id: "2fa",
                  title: "Verificación en dos pasos",
                  icon: { name: "verified_user", color: "success" },
                  trailing: toggle("twoFactor"),
                },
              ],
            },
            {
              id: "notificaciones",
              title: "Notificaciones",
              items: [
                {
                  id: "push",
                  title: "Notificaciones push",
                  icon: { name: "notifications", color: "info" },
                  trailing: toggle("push"),
                },
                {
                  id: "email",
                  title: "Resumen por correo",
                  subtitle: "Cada lunes a las 9:00",
                  icon: { name: "mail", color: "accent" },
                  trailing: toggle("email"),
                },
              ],
            },
            {
              id: "general",
              title: "General",
              items: [
                {
                  id: "idioma",
                  title: "Idioma",
                  meta: "Español (México)",
                  icon: { name: "language", color: "neutral" },
                  chevron: true,
                  onClick: () => undefined,
                },
                {
                  id: "ayuda",
                  title: "Centro de ayuda",
                  icon: { name: "help_outline", color: "neutral" },
                  href: "#ayuda",
                  chevron: true,
                },
                {
                  id: "salir",
                  title: "Cerrar sesión",
                  icon: { name: "logout", color: "error" },
                  onClick: () => undefined,
                },
              ],
            },
          ]}
        />
      </Frame>
    );
  },
};

type Order = {
  id: string;
  client: string;
  total: number;
  status: "Pendiente" | "En ruta" | "Entregado";
};

const ORDERS: Order[] = Array.from({ length: 36 }, (_, i) => ({
  id: `PED-${1040 + i}`,
  client: [
    "Grupo Altamira",
    "Farmacias Sol",
    "Taller Ruiz",
    "Café Origen",
    "Ferretería Vega",
    "Hotel Marea",
  ][i % 6],
  total: 850 + ((i * 7919) % 12000),
  status: (["Pendiente", "En ruta", "Entregado"] as const)[(i * 5) % 3],
}));

/** Grupos plegables con conteo y encabezados fijos al desplazar. */
export const GroupedStickyHeaders: Story = {
  render: () => (
    <Frame>
      <CnList<Order>
        title="Pedidos"
        surface="outlined"
        variant="divided"
        density="compact"
        items={ORDERS}
        getId={(o) => o.id}
        getTitle={(o) => o.client}
        getSubtitle={(o) => o.id}
        getIcon={() => ({ name: "local_shipping", color: "primary" })}
        getStatus={() => undefined}
        getMeta={(o) => o.total.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
        groupBy={(o) => o.status}
        groupOrder={["Pendiente", "En ruta", "Entregado"]}
        collapsibleGroups
        defaultCollapsedGroups={["Entregado"]}
        selectionMode="single"
        searchable
        sortOptions={[
          {
            id: "total-desc",
            label: "Mayor importe",
            icon: "trending_down",
            compare: (a, b) => b.total - a.total,
          },
          {
            id: "total-asc",
            label: "Menor importe",
            icon: "trending_up",
            compare: (a, b) => a.total - b.total,
          },
          {
            id: "client",
            label: "Cliente (A-Z)",
            icon: "sort",
            compare: (a, b) => a.client.localeCompare(b.client),
          },
        ]}
        maxHeight={420}
      />
    </Frame>
  ),
};

/** Árbol de carpetas (expande con clic o con ← →). */
export const NestedTree: Story = {
  render: () => {
    const tree: CnListItemData[] = [
      {
        id: "docs",
        title: "Documentos",
        icon: { name: "folder", color: "warning" },
        meta: "4 elementos",
        children: [
          {
            id: "contratos",
            title: "Contratos",
            icon: { name: "folder", color: "warning" },
            children: [
              {
                id: "c-2025",
                title: "Contrato marco 2025.pdf",
                icon: { name: "picture_as_pdf", color: "error" },
                meta: "1.2 MB",
              },
              {
                id: "c-nda",
                title: "NDA proveedor.pdf",
                icon: { name: "picture_as_pdf", color: "error" },
                meta: "320 KB",
              },
            ],
          },
          {
            id: "presupuesto",
            title: "Presupuesto.xlsx",
            icon: { name: "table_chart", color: "success" },
            meta: "88 KB",
          },
          {
            id: "notas",
            title: "Notas de la junta.docx",
            icon: { name: "description", color: "info" },
            meta: "24 KB",
          },
        ],
      },
      {
        id: "imagenes",
        title: "Imágenes",
        icon: { name: "folder", color: "warning" },
        children: [
          {
            id: "logo",
            title: "logo-canek.svg",
            icon: { name: "image", color: "accent" },
            meta: "12 KB",
          },
          {
            id: "banner",
            title: "banner-campaña.png",
            icon: { name: "image", color: "accent" },
            meta: "2.4 MB",
          },
        ],
      },
      {
        id: "respaldo",
        title: "respaldo.zip",
        icon: { name: "folder_zip", color: "neutral" },
        meta: "310 MB",
      },
    ];
    return (
      <Frame>
        <CnList
          ariaLabel="Explorador de archivos"
          surface="outlined"
          density="compact"
          items={tree}
          defaultExpandedIds={["docs"]}
          selectionMode="multiple"
          cascadeSelection
          searchable
          selectAll={false}
        />
      </Frame>
    );
  },
};

/** 10,000 elementos virtualizados y carga incremental al acercarse al final. */
export const InfiniteScrollVirtualized: Story = {
  render: function Render() {
    const make = useCallback(
      (from: number, count: number): CnListItemData[] =>
        Array.from({ length: count }, (_, k) => {
          const i = from + k;
          return {
            id: `r${i}`,
            title: `Registro #${(i + 1).toLocaleString("es-MX")}`,
            subtitle: `Sucursal ${["Centro", "Norte", "Sur", "Oriente", "Poniente"][i % 5]} · Folio ${100000 + i}`,
            avatar: {
              name: `${String.fromCharCode(65 + (i % 26))} ${String.fromCharCode(65 + ((i * 7) % 26))}`,
            },
            meta: `${(i % 59) + 1} min`,
            badge: i % 9 === 0 ? (i % 30) + 1 : undefined,
          };
        }),
      [],
    );
    const [items, setItems] = useState(() => make(0, 10000));
    const [loadingMore, setLoadingMore] = useState(false);
    const total = 12000;
    const loadMore = () => {
      setLoadingMore(true);
      setTimeout(() => {
        setItems((prev) => [...prev, ...make(prev.length, 500)]);
        setLoadingMore(false);
      }, 900);
    };
    return (
      <Frame>
        <CnList
          title="Bitácora"
          surface="outlined"
          variant="divided"
          items={items}
          virtualize
          height={520}
          hasMore={items.length < total}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          selectionMode="multiple"
          searchable
          showCount
        />
      </Frame>
    );
  },
};

/** Variante `card`: cada elemento es una tarjeta (también en rejilla). */
export const CardVariant: Story = {
  render: () => {
    const projects: CnListItemData[] = [
      {
        id: "p1",
        title: "Portal de clientes",
        subtitle: "Actualizado hace 2 días",
        description:
          "Rediseño del portal con autenticación unificada y nuevo flujo de facturación.",
        icon: { name: "dashboard", color: "primary" },
        status: { label: "En curso", color: "info" },
        onClick: () => undefined,
      },
      {
        id: "p2",
        title: "App de inventario",
        subtitle: "Actualizado hoy",
        description:
          "Lectura de códigos QR, sincronización sin conexión y alertas de stock mínimo.",
        icon: { name: "inventory_2", color: "success" },
        status: { label: "Lanzado", color: "success" },
        onClick: () => undefined,
      },
      {
        id: "p3",
        title: "Migración de datos",
        subtitle: "Actualizado hace 1 semana",
        description: "Traslado de 12 años de históricos al nuevo almacén de datos.",
        icon: { name: "storage", color: "warning" },
        status: { label: "En riesgo", color: "warning" },
        tone: "warning",
        onClick: () => undefined,
      },
      {
        id: "p4",
        title: "Chat de soporte",
        subtitle: "Actualizado hace 3 horas",
        description: "Integración con WhatsApp y respuestas sugeridas para agentes.",
        icon: { name: "support_agent", color: "accent" },
        status: { label: "Planeado", color: "neutral" },
        onClick: () => undefined,
      },
    ];
    return (
      <Stack spacing={3} sx={{ maxWidth: 900 }}>
        <Frame>
          <CnList
            variant="card"
            items={projects}
            itemActions={[
              {
                id: "open",
                label: "Abrir",
                icon: "open_in_new",
                inline: true,
                onClick: () => undefined,
              },
              { id: "archive", label: "Archivar", icon: "archive", onClick: () => undefined },
            ]}
          />
        </Frame>
        <CnList
          variant="card"
          columns={2}
          items={projects}
          selectionMode="single"
          defaultSelectedIds={["p2"]}
        />
      </Stack>
    );
  },
};

/** Skeletons: siguen variante, densidad, avatar/ícono, líneas y secciones. */
export const Skeletons: Story = {
  render: function Render() {
    const [loading, setLoading] = useState(true);
    return (
      <Stack spacing={3} sx={{ maxWidth: 900 }}>
        <CnButton
          size="small"
          variant="outlined"
          onClick={() => setLoading((v) => !v)}
          sx={{ alignSelf: "flex-start" }}
        >
          {loading ? "Mostrar datos" : "Mostrar skeleton"}
        </CnButton>
        <Box sx={{ display: "grid", gridTemplateColumns: { md: "1fr 1fr" }, gap: 3 }}>
          <CnList
            skeleton={loading}
            surface="outlined"
            variant="divided"
            searchable
            title="Contactos"
            items={CONTACTS.slice(0, 5).map((c) => ({
              id: c.id,
              title: c.name,
              subtitle: c.email,
              avatar: { name: c.name, src: c.photo },
              meta: "Ayer",
            }))}
          />
          <CnList
            skeleton={loading}
            variant="card"
            items={ORDERS.slice(0, 4).map((o) => ({
              id: o.id,
              title: o.client,
              subtitle: o.id,
              icon: "local_shipping",
              status: o.status,
            }))}
          />
        </Box>
        <Typography variant="subtitle2">CnListSkeleton suelto</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { md: "1fr 1fr 1fr" }, gap: 3 }}>
          <CnListSkeleton surface="outlined" sections={2} count={2} density="compact" />
          <CnListSkeleton surface="outlined" variant="inset" avatar="square" lines={0} trailing />
          <CnListSkeleton surface="outlined" checkbox toolbar lines={2} meta />
        </Box>
      </Stack>
    );
  },
};

/** Vacío, sin resultados y error con reintento. */
export const EmptyAndError: Story = {
  render: function Render() {
    const [attempts, setAttempts] = useState(0);
    return (
      <Box
        sx={{ display: "grid", gridTemplateColumns: { md: "1fr 1fr 1fr" }, gap: 3, maxWidth: 1000 }}
      >
        <CnList
          surface="outlined"
          title="Clientes"
          items={[]}
          emptyIcon="group"
          emptyTitle="Aún no hay clientes"
          emptyDescription="Agrega tu primer cliente para empezar."
          emptyAction={
            <CnButton size="small" startIcon="person_add">
              Agregar cliente
            </CnButton>
          }
        />
        <CnList
          surface="outlined"
          title="Búsqueda"
          searchable
          defaultSearch="xyz"
          items={CONTACTS.map((c) => ({ id: c.id, title: c.name }))}
        />
        <CnList
          surface="outlined"
          title="Facturas"
          items={[]}
          error={`Tiempo de espera agotado (intento ${attempts + 1}).`}
          onRetry={() => setAttempts((n) => n + 1)}
        />
      </Box>
    );
  },
};

/** Piezas sueltas: `CnListItem` y `CnListSubheader` fuera de `CnList`. */
export const StandalonePieces: Story = {
  render: () => (
    <Frame width={420}>
      <Box
        sx={{
          border: "1px solid var(--cn-color-border, #dde0e4)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <CnListSubheader title="Accesos rápidos" count={3} sticky={false} />
        <CnListItem
          title="Mi perfil"
          subtitle="angel@canek.mx"
          avatar={{ name: "Ángel Rodríguez" }}
          chevron
          onClick={() => undefined}
          divider="inset"
        />
        <CnListItem
          title="Mensajes"
          icon={{ name: "chat", color: "info" }}
          badge={12}
          chevron
          onClick={() => undefined}
          divider="inset"
        />
        <CnListItem
          title="Facturación"
          icon={{ name: "receipt_long", color: "success" }}
          status={{ label: "Al corriente", color: "success" }}
          href="#facturacion"
        />
      </Box>
    </Frame>
  ),
};

/** Densidades y tamaños lado a lado. */
export const DensitiesAndSizes: Story = {
  render: function Render() {
    const items = useMemo(
      () =>
        CONTACTS.slice(0, 3).map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: c.role,
          avatar: { name: c.name, src: c.photo },
          meta: "10:24",
        })),
      [],
    );
    return (
      <Box
        sx={{ display: "grid", gridTemplateColumns: { md: "1fr 1fr 1fr" }, gap: 3, maxWidth: 1000 }}
      >
        {(["compact", "comfortable", "spacious"] as const).map((density, i) => (
          <Box key={density}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {density} · {(["sm", "md", "lg"] as const)[i]}
            </Typography>
            <CnList
              surface="outlined"
              variant="divided"
              density={density}
              size={(["sm", "md", "lg"] as const)[i]}
              items={items}
            />
          </Box>
        ))}
      </Box>
    );
  },
};

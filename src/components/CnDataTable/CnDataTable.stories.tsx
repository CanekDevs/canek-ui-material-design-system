import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useMemo, useState } from "react";
import { CnButton } from "../CnButton";
import { CN_STATUS_PRESETS } from "./status-presets";
import { CnDataTable } from "./CnDataTable";
import { CnDataTableSkeleton } from "./CnDataTableSkeleton";
import type { CnColumn, CnTableQuery } from "./CnDataTable.types";

const meta: Meta = {
  title: "Data Display/CnDataTable",
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ─── Tabla maestra: todas las celdas ──────────────────────────────────────

type Person = {
  id: number;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  rfc: string;
  curp: string | null;
  status: "active" | "inactive" | "pending";
  verified: boolean;
  rating: number;
  budget: number;
  previousBudget: number;
  progress: number;
  tags: string[];
  createdAt: string;
  lastLogin: string | null;
  website: string | null;
  city: string;
  team?: { name: string; email?: string; phone?: string; position?: string }[];
  photos?: string[];
};

const PEOPLE: Person[] = [
  [
    "Ana García",
    "Administradora",
    "ana.garcia@corporativo.mx",
    "5512345678",
    "GAAA800101AB1",
    "GAAA800101MDFRNN09",
    "active",
    true,
    5,
    1250000,
    980000,
    85,
    ["Ventas", "Norte", "VIP"],
    "2023-01-15",
    "2026-11-05T16:30",
    "https://canek.mx",
    "Ciudad de México",
  ],
  [
    "Carlos López",
    "Editor",
    "carlos.lopez@empresa.com",
    "5587654321",
    "LOCA800201XY2",
    "LOCA800201HDFPRR01",
    "active",
    true,
    4,
    750000,
    820000,
    62,
    ["Soporte"],
    "2023-02-20",
    "2026-11-04T09:45",
    null,
    "Guadalajara",
  ],
  [
    "María Fernández",
    "Usuaria",
    "maria.fernandez@proveedor.com",
    null,
    "NOR-EGISTR-ADO",
    null,
    "inactive",
    false,
    3,
    0,
    120000,
    0,
    [],
    "2023-03-10",
    null,
    "https://github.com",
    "Monterrey",
  ],
  [
    "Juan Martínez",
    "Editor",
    "juan.martinez@consultoria.com",
    "5532165498",
    "MAJU800301AB3",
    "MAJU800301HDFRRN04",
    "pending",
    true,
    4,
    320000,
    300000,
    45,
    ["Consultoría", "Sur"],
    "2023-04-05",
    "2026-10-28T05:20",
    null,
    "Puebla",
  ],
  [
    "Laura Torres",
    "Administradora",
    null,
    "5599887766",
    "TOLA800401CD4",
    "TOLA800401MDFRRR05",
    "active",
    true,
    5,
    2500000,
    2100000,
    94,
    ["Ventas", "Corporativo", "VIP", "Bajío"],
    "2023-05-12",
    "2026-11-06T02:00",
    "https://anthropic.com",
    "Querétaro",
  ],
  [
    "Roberto Méndez",
    "Usuario",
    "roberto.mendez@startup.mx",
    "5544332211",
    "MERJ800501EF5",
    "MERJ800501HDFNDB06",
    "active",
    false,
    2.5,
    180000,
    210000,
    38,
    ["Startups"],
    "2023-06-18",
    "2026-09-13T08:30",
    null,
    "Mérida",
  ],
].map(
  (
    [
      name,
      role,
      email,
      phone,
      rfc,
      curp,
      status,
      verified,
      rating,
      budget,
      previousBudget,
      progress,
      tags,
      createdAt,
      lastLogin,
      website,
      city,
    ],
    index,
  ) => ({
    id: 1001 + index,
    name,
    role,
    email,
    phone,
    rfc,
    curp,
    status,
    verified,
    rating,
    budget,
    previousBudget,
    progress,
    tags,
    createdAt,
    lastLogin,
    website,
    city,
  }),
) as Person[];

const MASTER_COLUMNS: CnColumn<Person>[] = [
  { id: "id", header: "ID", type: "id", cellOptions: { prefix: "#" } },
  {
    id: "name",
    header: "Nombre",
    type: "avatar",
    width: 220,
    cellOptions: { subtitle: (row) => (row as Person).role },
  },
  { id: "email", header: "Email", type: "email", width: 270 },
  { id: "phone", header: "Teléfono", type: "phone", width: 210, cellOptions: { whatsapp: true } },
  { id: "rfc", header: "RFC", type: "rfc", width: 210 },
  { id: "curp", header: "CURP", type: "curp", width: 260 },
  {
    id: "status",
    header: "Estado",
    type: "status",
    filter: "select",
    width: 160,
    cellOptions: {
      statusMap: {
        ...CN_STATUS_PRESETS.activeInactive,
        pending: { label: "Pendiente", color: "warning", icon: "schedule" },
      },
    },
  },
  {
    id: "verified",
    header: "Verificado",
    type: "boolean",
    filter: "select",
    width: 150,
    cellOptions: { trueLabel: "Verificado", falseLabel: "Sin verificar" },
  },
  { id: "rating", header: "Rating", type: "rating", width: 140 },
  {
    id: "budget",
    header: "Presupuesto",
    type: "currency",
    aggregate: "sum",
    width: 200,
    cellOptions: { previous: (row) => (row as Person).previousBudget },
  },
  { id: "progress", header: "Progreso", type: "progress", aggregate: "avg", width: 170 },
  { id: "tags", header: "Tags", type: "tags", sortable: false, width: 220 },
  { id: "createdAt", header: "Creado", type: "date", width: 190 },
  { id: "lastLogin", header: "Último login", type: "datetime", width: 220 },
  { id: "website", header: "Sitio", type: "link", width: 180 },
  { id: "city", header: "Ciudad", type: "location", cellOptions: { mapLink: true } },
  { id: "team", header: "Equipo", type: "contact", sortable: false, cellOptions: { maxItems: 3 } },
  { id: "photos", header: "Fotos", type: "image", sortable: false, width: 140 },
];

PEOPLE[0].team = [
  { name: "Ana García", email: "ana.garcia@corporativo.mx", position: "Líder" },
  { name: "Luis Pérez", phone: "5512345678", position: "Ventas" },
  { name: "Sofía Torres", email: "sofia@corporativo.mx" },
  { name: "Diego Morales", position: "Soporte" },
  { name: "María Ruiz" },
];
PEOPLE[1].team = [{ name: "Carlos López", email: "carlos.lopez@empresa.com", position: "Editor" }];
PEOPLE[0].photos = [
  "https://picsum.photos/id/1015/300/200",
  "https://picsum.photos/id/1025/300/200",
  "https://picsum.photos/id/1035/300/200",
  "https://picsum.photos/id/1043/300/200",
];
PEOPLE[2].photos = ["https://picsum.photos/id/1050/300/200"];

export const MasterTable: Story = {
  name: "Tabla maestra (todas las celdas)",
  render: () => (
    <CnDataTable<Person>
      title="Tabla maestra · demostración de todos los tipos de celda"
      data={PEOPLE}
      columns={MASTER_COLUMNS}
      selectable
      selectionToggle
      columnFilters
      rowNumbers
      persistKey="story-master"
      rowActions={[
        { id: "view", label: "Ver detalles", icon: "visibility", onClick: () => {} },
        { id: "edit", label: "Editar", icon: "edit", onClick: () => {} },
        {
          id: "delete",
          label: "Eliminar",
          icon: "delete",
          color: "error",
          confirm: (row) => ({ variant: "delete", message: `Se eliminará a ${row.name}.` }),
          onClick: () => wait(600),
        },
        { id: "fav", label: "Favorito", icon: "favorite", onClick: () => {} },
      ]}
      bulkActions={[
        { id: "mail", label: "Enviar correo", icon: "mail", onClick: () => wait(500) },
        {
          id: "deactivate",
          label: "Desactivar",
          icon: "block",
          color: "error",
          onClick: () => wait(600),
          confirm: (rows) => ({ variant: "danger", title: `¿Desactivar ${rows.length} usuarios?` }),
        },
      ]}
    />
  ),
};

// ─── Contratos: caso de uso real ──────────────────────────────────────────

type Contract = {
  id: number;
  folio: string;
  client: { name: string; email: string };
  owner: string;
  status: "active" | "pending" | "expired" | "cancelled";
  amount: number;
  progress: number;
  startDate: string;
  tags: string[];
  rfc: string;
};

const NAMES = [
  "Ánfora SA",
  "Bodega Norte",
  "Casa Azul",
  "Distribuidora Ñu",
  "Eléctrica del Bajío",
  "Ferretería López",
  "Grupo Óptimo",
  "Hidráulica Sur",
];
const OWNERS = ["Ana López", "Luis Pérez", "María Hernández", "Jorge Ramírez"];
const STATUSES: Contract["status"][] = ["active", "pending", "expired", "cancelled"];
const TAGS = ["Servicios", "Licencias", "Soporte", "Hardware", "Consultoría"];

const CONTRACTS: Contract[] = Array.from({ length: 57 }, (_, i) => ({
  id: i + 1,
  folio: `CT-${String(2400 + i).padStart(5, "0")}`,
  client: { name: NAMES[i % NAMES.length], email: `contacto${i}@empresa.mx` },
  owner: OWNERS[i % OWNERS.length],
  status: STATUSES[(i * 7) % STATUSES.length],
  amount: Math.round(((i * 7919) % 250000) + 15000),
  progress: (i * 13) % 101,
  startDate: `2026-${String((i % 10) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
  tags: TAGS.slice(i % 3, (i % 3) + 1 + (i % 3)),
  rfc: `ABC${String(100000 + i)}XY${i % 10}`,
}));

const CONTRACT_COLUMNS: CnColumn<Contract>[] = [
  { id: "folio", header: "Folio", type: "code", sticky: true },
  {
    id: "client.name",
    header: "Cliente",
    type: "avatar",
    width: 240,
    cellOptions: { subtitle: (row) => (row as Contract).client.email },
  },
  {
    id: "status",
    header: "Estado",
    type: "status",
    filter: "select",
    cellOptions: {
      statusMap: {
        active: { label: "Vigente", color: "success", icon: "check_circle" },
        pending: { label: "Por firmar", color: "warning", icon: "schedule" },
        expired: { label: "Vencido", color: "neutral", icon: "event_busy" },
        cancelled: { label: "Cancelado", color: "error", icon: "block" },
      },
    },
  },
  { id: "amount", header: "Monto", type: "currency", aggregate: "sum", width: 190 },
  { id: "progress", header: "Avance", type: "progress", width: 170 },
  { id: "startDate", header: "Inicio", type: "date", width: 190 },
  { id: "owner", header: "Responsable", cellOptions: { icon: "person" } },
  { id: "tags", header: "Categorías", type: "tags", sortable: false, hidden: true },
  { id: "rfc", header: "RFC", type: "rfc", hidden: true, width: 200 },
];

export const Contracts: Story = {
  name: "Contratos (detalle, totales, fijada)",
  render: () => (
    <CnDataTable<Contract>
      title="Contratos"
      description="Arrastra el asa (≡) para mover columnas, el borde para redimensionar y Shift + clic para ordenar por varias"
      data={CONTRACTS}
      columns={CONTRACT_COLUMNS}
      selectable
      striped
      persistKey="story-contracts"
      toolbarActions={
        <CnButton size="small" startIcon="add">
          Nuevo contrato
        </CnButton>
      }
      rowActions={[
        { id: "view", label: "Ver detalle", icon: "visibility", inline: true, onClick: () => {} },
        { id: "edit", label: "Editar", icon: "edit", onClick: () => {} },
        {
          id: "renew",
          label: "Renovar",
          icon: "autorenew",
          visible: (row) => row.status === "expired",
          onClick: () => wait(400),
        },
        {
          id: "delete",
          label: "Eliminar",
          icon: "delete",
          color: "error",
          disabled: (row) => row.status === "active",
          confirm: (row) => ({
            variant: "delete",
            message: `Se eliminará el contrato ${row.folio}.`,
          }),
          onClick: () => wait(600),
        },
      ]}
      renderDetail={(row) => (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "8px",
            fontSize: 13,
          }}
        >
          <span>
            <strong>RFC:</strong> {row.rfc}
          </span>
          <span>
            <strong>Correo:</strong> {row.client.email}
          </span>
          <span>
            <strong>Categorías:</strong> {row.tags.join(", ") || "—"}
          </span>
        </Box>
      )}
      getRowTone={(row) => (row.status === "cancelled" ? "error" : undefined)}
    />
  ),
};

// ─── Servidor ─────────────────────────────────────────────────────────────

const ServerStory = () => {
  const [query, setQuery] = useState<CnTableQuery>({
    pageIndex: 0,
    pageSize: 10,
    sorting: [],
    search: "",
    filters: {},
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<{ rows: Contract[]; total: number }>({ rows: [], total: 0 });
  const queryKey = useMemo(() => JSON.stringify(query), [query]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const q = query.search.toLowerCase();
      let rows = CONTRACTS.filter(
        (row) =>
          !q || row.client.name.toLowerCase().includes(q) || row.folio.toLowerCase().includes(q),
      );
      if (query.filters.status) rows = rows.filter((row) => row.status === query.filters.status);
      const sort = query.sorting[0];
      if (sort) {
        rows = [...rows].sort((a, b) => {
          const pick = (r: Contract) =>
            sort.id === "client.name"
              ? r.client.name
              : (r as unknown as Record<string, unknown>)[sort.id];
          const result = String(pick(a)).localeCompare(String(pick(b)), "es", { numeric: true });
          return sort.desc ? -result : result;
        });
      }
      const start = query.pageIndex * query.pageSize;
      setPage({ rows: rows.slice(start, start + query.pageSize), total: rows.length });
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  return (
    <CnDataTable<Contract>
      title="Contratos (paginados en el servidor)"
      data={page.rows}
      columns={CONTRACT_COLUMNS}
      loading={loading}
      columnFilters
      serverSide={{ rowCount: page.total, query, onQueryChange: setQuery }}
      fetchAllRows={async () => {
        await wait(400);
        return CONTRACTS;
      }}
    />
  );
};

export const ServerSide: Story = { name: "Modo servidor", render: () => <ServerStory /> };

export const Grouped: Story = {
  name: "Agrupada por estado y responsable",
  render: () => (
    <CnDataTable<Contract>
      title="Contratos agrupados"
      description="Agrupa desde el menú (⋮) de cualquier columna; los totales se calculan por grupo"
      data={CONTRACTS}
      columns={CONTRACT_COLUMNS}
      defaultGrouping={["status"]}
      selectable
      pageSize={25}
    />
  ),
};

type Order = {
  id: number;
  folio: string;
  supplier: string;
  total: number;
  items: { sku: string; description: string; qty: number; price: number }[];
};

const ORDERS: Order[] = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  folio: `OC-${String(500 + i).padStart(4, "0")}`,
  supplier: NAMES[i % NAMES.length],
  items: Array.from({ length: (i % 3) + 1 }, (_, j) => ({
    sku: `SKU-${100 + i * 3 + j}`,
    description: ["Laptop", "Monitor", "Teclado", "Licencia"][(i + j) % 4],
    qty: ((i + j) % 4) + 1,
    price: [18999, 4299, 899, 2400][(i + j) % 4],
  })),
  total: 0,
})).map((order) => ({
  ...order,
  total: order.items.reduce((sum, item) => sum + item.qty * item.price, 0),
}));

export const ExportWithDetail: Story = {
  name: "Exportar con partidas",
  render: () => (
    <CnDataTable<Order>
      title="Órdenes de compra"
      description="Descargar exporta una fila por partida (folio, proveedor y total se repiten)"
      data={ORDERS}
      columns={[
        { id: "folio", header: "Folio", type: "code" },
        { id: "supplier", header: "Proveedor", type: "avatar" },
        {
          id: "items",
          header: "Partidas",
          accessor: (row) => row.items.length,
          type: "number",
          aggregate: "sum",
        },
        { id: "total", header: "Total", type: "currency", aggregate: "sum" },
      ]}
      exportDetail={{
        accessor: (row) => row.items,
        columns: [
          { id: "sku", header: "SKU" },
          { id: "description", header: "Descripción" },
          { id: "qty", header: "Cantidad", type: "number" },
          { id: "price", header: "Precio", type: "currency" },
        ],
      }}
      renderDetail={(row) => (
        <Box component="ul" sx={{ m: 0, pl: "18px", fontSize: 13 }}>
          {row.items.map((item) => (
            <li key={item.sku}>
              {item.qty} × {item.description} ({item.sku})
            </li>
          ))}
        </Box>
      )}
    />
  ),
};

export const LoadingAndEmpty: Story = {
  name: "Cargando y vacía",
  render: () => (
    <Box sx={{ display: "grid", gap: 4 }}>
      <CnDataTable<Contract> title="Cargando" data={[]} columns={CONTRACT_COLUMNS} loading />
      <CnDataTable<Contract>
        title="Sin datos"
        data={[]}
        columns={CONTRACT_COLUMNS}
        emptyTitle="Aún no hay contratos"
        emptyDescription="Crea el primero para empezar a darle seguimiento."
        emptyAction={
          <CnButton size="small" startIcon="add">
            Nuevo contrato
          </CnButton>
        }
      />
    </Box>
  ),
};

type Asset = {
  id: number;
  name: string;
  owner: string;
  country: string;
  color: string;
  contract: { name: string; size: number; url: string } | null;
  period: [string, string];
  storage: number;
  usage: number[];
  modules: string[];
  location: { lat: number; lng: number };
  address: { street: string; city: string; state: string; postalCode: string; country: string };
  account: string;
  metadata: Record<string, unknown>;
  notes: string;
  amount: number;
  previousAmount: number;
};

const ASSETS: Asset[] = [
  ["Servidor norte", "Ana García", "MX", "#254d87", 92, [12, 18, 15, 22, 30, 27, 35]],
  ["Bodega Bajío", "Luis Pérez", "US", "#228740", 48, [40, 38, 35, 33, 30, 31, 28]],
  ["Oficina central", "María Ruiz", "CO", "#c0392b", 12, [5, 6, 6, 7, 9, 12, 12]],
  ["Planta sur", "Jorge Díaz", "ES", "#8e44ad", 67, [20, 25, 22, 30, 28, 33, 40]],
].map(([name, owner, country, color, storage, usage], i) => ({
  id: i + 1,
  name: name as string,
  owner: owner as string,
  country: country as string,
  color: color as string,
  contract:
    i === 2
      ? null
      : {
          name: `contrato-${i + 1}.pdf`,
          size: 250000 * (i + 1),
          url: "https://example.com/contrato.pdf",
        },
  period: [`2026-0${i + 1}-01`, `2026-1${i}-15`] as [string, string],
  storage: (storage as number) * 1024 ** 3,
  usage: usage as number[],
  modules: ["Inventario", "Compras", "Ventas", "Nómina", "Reportes"].slice(0, i + 2),
  location: { lat: 19.4326 + i * 0.8, lng: -99.1332 + i * 1.2 },
  address: {
    street: `Av. Reforma ${100 + i * 25}`,
    city: "Ciudad de México",
    state: "CDMX",
    postalCode: `0660${i}`,
    country: "México",
  },
  account: `01218000${String(1234567890 + i * 1111).padStart(10, "0")}`,
  metadata: {
    region: ["norte", "bajío", "centro", "sur"][i],
    racks: i + 2,
    tags: ["prod", "crítico"].slice(0, (i % 2) + 1),
  },
  notes:
    "Activo revisado en la última auditoría. Se recomienda renovar el contrato de mantenimiento antes del cierre del trimestre y actualizar el inventario de refacciones.",
  amount: 1250000 * (i + 1),
  previousAmount: 1100000 * (i + 1) + (i % 2 ? 300000 : -50000),
}));

export const MoreCellTypes: Story = {
  name: "Más tipos de celda (detalle al hacer clic)",
  render: () => (
    <CnDataTable<Asset>
      title="Activos"
      description="Haz clic en fechas, montos, RFC, direcciones, archivos, JSON o textos largos para ver el detalle completo"
      data={ASSETS}
      columns={[
        { id: "name", header: "Activo", cellOptions: { icon: "dns", bold: true }, sticky: true },
        { id: "owner", header: "Responsable", type: "avatar" },
        {
          id: "amount",
          header: "Valor",
          type: "currency",
          cellOptions: { previous: (row) => (row as Asset).previousAmount },
        },
        { id: "period", header: "Vigencia", type: "daterange" },
        { id: "contract", header: "Contrato", type: "file" },
        { id: "country", header: "País", type: "country", filter: "select" },
        { id: "color", header: "Color", type: "color" },
        { id: "storage", header: "Almacenamiento", type: "bytes" },
        { id: "usage", header: "Uso (7 días)", type: "sparkline", sortable: false },
        { id: "modules", header: "Módulos", type: "list", sortable: false },
        { id: "address", header: "Dirección", type: "location" },
        { id: "location", header: "Coordenadas", type: "coordinates", sortable: false },
        { id: "account", header: "CLABE", type: "masked" },
        { id: "metadata", header: "Metadatos", type: "json", sortable: false },
        { id: "notes", header: "Notas", width: 280 },
      ]}
      selectable
      striped
    />
  ),
};

type Ticket = {
  id: string;
  title: string;
  priority: string;
  due: Date;
  done: boolean;
  delta: number;
  ip: string;
  uuid: string;
  version: string;
  notes: string;
  channel: { icon: string; label: string; tone?: "primary" | "success" | "warning" | "info" };
  active: boolean;
  step: number;
  stage: string;
  days: number[];
  hours: [string, string];
  birth: string;
  budget: [number, number];
  sentiment: string | number;
  score: number;
  order: { label: string; id: string; subtitle: string };
  unread: number;
};

const NOW = Date.now();
const TICKET_STAGES = ["Nuevo", "Asignado", "En progreso", "Validación", "Cerrado"];
const TICKET_STEPS = ["Registro", "Diagnóstico", "Solución", "Cierre"];

const TICKETS: Ticket[] = [
  ["Error al facturar", "critical", 3, 12.4, "192.168.1.24", "1.4.0"],
  ["Alta de proveedor", "medium", 50, -3.1, "10.0.0.8", "1.3.2"],
  ["Reporte mensual", "low", 240, 0, "8.8.8.8", "2.0.0-beta.1"],
  ["Acceso VPN", "high", -30, 5.6, "2001:db8::42", "1.4.0"],
  ["Cambio de domicilio", "medium", 120, -8.9, "999.1.1.1", "1.2"],
].map(([title, priority, hours, delta, ip, version], i) => ({
  id: `TK-${1040 + i}`,
  title: title as string,
  priority: priority as string,
  due: new Date(NOW + (hours as number) * 3600000),
  done: i === 2,
  delta: delta as number,
  ip: ip as string,
  uuid: `3f2a9c1e-7b4d-4c2a-9f1e-12345678${String(90 + i).padStart(4, "0")}`,
  version: version as string,
  notes: [
    "<p>El cliente reporta que <strong>no se timbra</strong> la factura.</p><ul><li>Revisar certificado</li><li>Reintentar</li></ul>",
    "Pendiente **documentación** del proveedor:\n\n- Constancia fiscal\n- Estado de cuenta",
    "Sin observaciones",
    "<p>Usuario sin acceso desde <em>ayer</em>.</p>",
    "Confirmar comprobante de domicilio vigente y actualizar el expediente del empleado en el sistema de nómina.",
  ][i],
  channel: [
    { icon: "mail", label: "Correo", tone: "info" as const },
    { icon: "call", label: "Teléfono", tone: "success" as const },
    { icon: "chat", label: "Chat", tone: "primary" as const },
    { icon: "support_agent", label: "Mesa de ayuda", tone: "warning" as const },
    { icon: "mail", label: "Correo", tone: "info" as const },
  ][i],
  active: i % 2 === 0,
  step: [1, 2, 4, 3, 0][i],
  stage: TICKET_STAGES[[2, 1, 4, 3, 0][i]],
  days: [
    [1, 2, 3, 4, 5],
    [1, 3, 5],
    [6, 7],
    [1, 2, 3, 4, 5, 6, 7],
    [2, 4],
  ][i],
  hours: [
    ["09:00", "18:00"],
    ["08:00", "14:00"],
    ["10:00", "16:30"],
    ["22:00", "06:00"],
    ["07:00", "15:00"],
  ][i] as [string, string],
  birth: ["1988-03-14", "1995-11-02", "1979-07-21", "2001-01-30", "1990-09-09"][i],
  budget: [
    [10000, 25000],
    [5000, 8000],
    [30000, 45000],
    [1000, 3000],
    [15000, 20000],
  ][i] as [number, number],
  sentiment: ["negative", "neutral", 0.8, -0.7, 4][i],
  score: [42, 67, 95, 58, 81][i],
  order: { label: `Pedido ${2200 + i}`, id: `PO-${2200 + i}`, subtitle: "Acme SA" },
  unread: [3, 0, 150, 12, 1][i],
}));

/** Tipos adicionales dentro de una tabla real (orden, búsqueda y exportación incluidos). */
const EvenMoreTable = () => {
  const [rows, setRows] = useState(TICKETS);
  return (
    <CnDataTable<Ticket>
      title="Tickets"
      description="Prioridad, vencimientos, IP, versiones, notas enriquecidas, interruptores, etapas, horarios y más"
      data={rows}
      columns={[
        { id: "id", header: "Folio", type: "id", sticky: true },
        { id: "title", header: "Asunto", cellOptions: { bold: true } },
        { id: "priority", header: "Prioridad", type: "priority", filter: "select" },
        {
          id: "due",
          header: "Vence",
          type: "deadline",
          cellOptions: { done: (row) => (row as Ticket).done },
        },
        { id: "delta", header: "Variación", type: "delta" },
        { id: "ip", header: "IP", type: "ip" },
        { id: "uuid", header: "UUID", type: "uuid", sortable: false },
        {
          id: "version",
          header: "Versión",
          type: "version",
          cellOptions: { latestVersion: "1.4.0" },
        },
        { id: "notes", header: "Notas", type: "richtext", width: 260 },
        { id: "channel", header: "Canal", type: "icon", sortable: false },
        {
          id: "active",
          header: "Seguimiento",
          type: "toggle",
          cellOptions: {
            trueLabel: "Siguiendo",
            falseLabel: "Sin seguir",
            onChange: (row, next) =>
              setRows((prev) =>
                prev.map((r) => (r.id === (row as Ticket).id ? { ...r, active: next } : r)),
              ),
          },
        },
        { id: "step", header: "Pasos", type: "steps", cellOptions: { stepLabels: TICKET_STEPS } },
        { id: "stage", header: "Etapa", type: "stage", cellOptions: { stages: TICKET_STAGES } },
        { id: "days", header: "Días de atención", type: "weekdays", sortable: false },
        { id: "hours", header: "Horario", type: "timerange" },
        { id: "birth", header: "Edad del solicitante", type: "age" },
        {
          id: "budget",
          header: "Presupuesto",
          type: "range",
          cellOptions: { rangeFormat: "currency", bar: true, max: 50000 },
        },
        { id: "sentiment", header: "Sentimiento", type: "sentiment" },
        { id: "score", header: "Satisfacción", type: "score" },
        {
          id: "order",
          header: "Pedido",
          type: "reference",
          cellOptions: { prefix: "", onClick: (value) => console.info("Abrir", value) },
        },
        {
          id: "unread",
          header: "Sin leer",
          type: "counter",
          align: "center",
          cellOptions: { max: 99 },
        },
      ]}
      onRowClick={(row) => console.info("Fila", row.id)}
      striped
    />
  );
};

export const EvenMoreCellTypes: Story = {
  name: "Aún más tipos de celda",
  render: () => <EvenMoreTable />,
};

// ─── Estado de carga ──────────────────────────────────────────────────────

/**
 * Skeleton propio: `loading` sin datos (primera carga) o `skeleton` dibujan la
 * tabla con sus columnas tipadas, barra, densidad y paginación;
 * `CnDataTableSkeleton` se puede usar suelto.
 */
export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: 4 }}>
      <CnDataTable
        title="Personas"
        description="Primera carga (loading sin datos)"
        data={[]}
        columns={MASTER_COLUMNS.slice(0, 6)}
        loading
        selectable
        rowNumbers
      />
      <CnDataTableSkeleton
        title
        columns={5}
        rows={4}
        density="compact"
        columnFilters
        rowActions
        exportFormats={false}
      />
      <CnDataTableSkeleton
        columns={CONTRACT_COLUMNS}
        rows={3}
        density="spacious"
        striped
        hideToolbar
        pagination={false}
      />
      <Box sx={{ maxWidth: 380 }}>
        <CnDataTableSkeleton
          layout="cards"
          columns={MASTER_COLUMNS.slice(0, 5)}
          rows={2}
          selectable
          rowActions
        />
      </Box>
    </Box>
  ),
};

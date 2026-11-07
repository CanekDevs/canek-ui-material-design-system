import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useMemo, useState } from "react";
import { CnButton } from "../CnButton";
import { CnDataTable } from "./CnDataTable";
import type { CnColumn, CnTableQuery } from "./CnDataTable.types";

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

const DATA: Contract[] = Array.from({ length: 57 }, (_, i) => ({
  id: i + 1,
  folio: `CT-${String(2400 + i).padStart(5, "0")}`,
  client: { name: NAMES[i % NAMES.length], email: `contacto${i}@empresa.mx` },
  owner: OWNERS[i % OWNERS.length],
  status: STATUSES[(i * 7) % STATUSES.length],
  amount: Math.round(((i * 7919) % 250000) + 15000),
  progress: (i * 13) % 101,
  startDate: `2026-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
  tags: TAGS.slice(i % 3, (i % 3) + 1 + (i % 3)),
  rfc: `ABC${String(100000 + i)}XY${i % 10}`,
}));

const COLUMNS: CnColumn<Contract>[] = [
  { id: "folio", header: "Folio", type: "code", width: 120, sticky: true },
  {
    id: "client.name",
    header: "Cliente",
    type: "avatar",
    minWidth: 220,
    cellOptions: { subtitle: (row) => (row as Contract).client.email },
  },
  {
    id: "status",
    header: "Estado",
    type: "status",
    cellOptions: {
      statusMap: {
        active: { label: "Vigente", color: "success", icon: "check_circle" },
        pending: { label: "Por firmar", color: "warning", icon: "schedule" },
        expired: { label: "Vencido", color: "neutral" },
        cancelled: { label: "Cancelado", color: "error" },
      },
    },
  },
  { id: "amount", header: "Monto", type: "currency", aggregate: "sum" },
  { id: "progress", header: "Avance", type: "progress", minWidth: 140 },
  { id: "startDate", header: "Inicio", type: "date" },
  { id: "owner", header: "Responsable" },
  { id: "tags", header: "Categorías", type: "tags", sortable: false, hidden: true },
  { id: "rfc", header: "RFC", type: "code", hidden: true },
];

const meta: Meta<typeof CnDataTable<Contract>> = {
  title: "Data Display/CnDataTable",
  component: CnDataTable,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof CnDataTable<Contract>>;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const Complete: Story = {
  render: () => (
    <CnDataTable
      title="Contratos"
      description="Orden múltiple con Shift, búsqueda sin acentos, filtros por columna y exportación"
      data={DATA}
      columns={COLUMNS}
      selectable
      striped
      persistKey="story-contracts"
      toolbarActions={
        <CnButton size="small" startIcon="add">
          Nuevo
        </CnButton>
      }
      bulkActions={[
        { id: "export", label: "Enviar recordatorio", icon: "mail", onClick: () => wait(500) },
        {
          id: "cancel",
          label: "Cancelar",
          icon: "block",
          color: "error",
          onClick: () => wait(600),
          confirm: (rows) => ({
            variant: "danger",
            title: `¿Cancelar ${rows.length} contratos?`,
            message: "Los contratos cancelados no se pueden reactivar.",
          }),
        },
      ]}
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
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
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

export const Compact: Story = {
  render: () => (
    <CnDataTable
      title="Contratos"
      data={DATA.slice(0, 8)}
      columns={COLUMNS.slice(0, 4)}
      pagination={false}
      maxHeight={320}
      exportFormats={false}
      onRowClick={() => {}}
    />
  ),
};

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
      let rows = DATA.filter(
        (row) =>
          !q || row.client.name.toLowerCase().includes(q) || row.folio.toLowerCase().includes(q),
      );
      const sort = query.sorting[0];
      if (sort) {
        rows = [...rows].sort((a, b) => {
          const va =
            sort.id === "client.name"
              ? a.client.name
              : (a as unknown as Record<string, unknown>)[sort.id];
          const vb =
            sort.id === "client.name"
              ? b.client.name
              : (b as unknown as Record<string, unknown>)[sort.id];
          const result = String(va).localeCompare(String(vb), "es", { numeric: true });
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
    <CnDataTable
      title="Contratos (servidor)"
      description="La tabla solo pinta; paginación, orden y búsqueda se resuelven en la API"
      data={page.rows}
      columns={COLUMNS}
      loading={loading}
      serverSide={{ rowCount: page.total, query, onQueryChange: setQuery }}
      fetchAllRows={async () => {
        await wait(400);
        return DATA;
      }}
    />
  );
};

export const ServerSide: Story = { render: () => <ServerStory /> };

export const LoadingAndEmpty: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: 3 }}>
      <CnDataTable title="Cargando" data={[]} columns={COLUMNS} loading />
      <CnDataTable
        title="Vacía"
        data={[]}
        columns={COLUMNS}
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

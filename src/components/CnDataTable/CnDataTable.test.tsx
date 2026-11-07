import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { formatCellText } from "./cells";
import { CnDataTable } from "./CnDataTable";
import type { CnColumn, CnTableQuery } from "./CnDataTable.types";
import { neutralizeFormula, rowsToDelimited } from "./export";

type Client = {
  id: number;
  name: string;
  city: { name: string };
  status: string;
  balance: number;
};

const ROWS: Client[] = [
  { id: 1, name: "Ánfora SA", city: { name: "Mérida" }, status: "active", balance: 1500 },
  { id: 2, name: "Bodega Norte", city: { name: "Monterrey" }, status: "inactive", balance: 300 },
  { id: 3, name: "Casa Azul", city: { name: "Guadalajara" }, status: "active", balance: 950 },
];

const COLUMNS: CnColumn<Client>[] = [
  { id: "name", header: "Nombre" },
  { id: "city.name", header: "Ciudad" },
  {
    id: "status",
    header: "Estado",
    type: "status",
    cellOptions: {
      statusMap: { active: { label: "Activo", color: "success" }, inactive: { label: "Inactivo" } },
    },
  },
  { id: "balance", header: "Saldo", type: "currency", aggregate: "sum" },
];

const bodyRows = () => screen.getAllByRole("row").filter((row) => row.getAttribute("data-row-id"));

describe("CnDataTable", () => {
  it("renders typed cells, nested paths and the footer aggregate", () => {
    render(<CnDataTable title="Clientes" data={ROWS} columns={COLUMNS} />);
    expect(screen.getByText("Mérida")).toBeInTheDocument();
    expect(screen.getAllByText("Activo")).toHaveLength(2);
    expect(screen.getByText("$1,500.00")).toBeInTheDocument();
    expect(screen.getByText("$2,750.00")).toBeInTheDocument();
    expect(screen.getByText("3 registros")).toBeInTheDocument();
  });

  it("searches ignoring accents across formatted values", () => {
    render(<CnDataTable data={ROWS} columns={COLUMNS} />);
    fireEvent.change(screen.getByLabelText("Buscar en la tabla"), { target: { value: "merida" } });
    expect(bodyRows()).toHaveLength(1);
    fireEvent.change(screen.getByLabelText("Buscar en la tabla"), {
      target: { value: "inactivo" },
    });
    expect(bodyRows()).toHaveLength(1);
    fireEvent.change(screen.getByLabelText("Buscar en la tabla"), { target: { value: "zzz" } });
    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
    // La búsqueda sigue disponible aunque no haya resultados.
    expect(screen.getByLabelText("Buscar en la tabla")).toBeInTheDocument();
  });

  it("sorts by column", () => {
    render(<CnDataTable data={ROWS} columns={COLUMNS} />);
    fireEvent.click(screen.getByRole("button", { name: /Saldo/ }));
    expect(within(bodyRows()[0]).getByText("Bodega Norte")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Saldo/ }));
    expect(within(bodyRows()[0]).getByText("Ánfora SA")).toBeInTheDocument();
  });

  it("filters by column", () => {
    render(<CnDataTable data={ROWS} columns={COLUMNS} columnFilters />);
    fireEvent.change(screen.getByLabelText("Filtrar Ciudad"), { target: { value: "monte" } });
    expect(bodyRows()).toHaveLength(1);
  });

  it("paginates", () => {
    render(<CnDataTable data={ROWS} columns={COLUMNS} pageSize={2} pageSizeOptions={[2, 10]} />);
    expect(bodyRows()).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(bodyRows()).toHaveLength(1);
  });

  it("hides columns from the column menu", () => {
    render(<CnDataTable data={ROWS} columns={COLUMNS} />);
    fireEvent.click(screen.getByRole("button", { name: "Columnas visibles" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Ciudad/ }));
    expect(screen.queryByText("Mérida")).toBeNull();
  });

  it("selects rows and runs a bulk action after confirmation", async () => {
    const onDelete = vi.fn();
    render(
      <CnDataTable
        data={ROWS}
        columns={COLUMNS}
        selectable
        bulkActions={[
          {
            id: "del",
            label: "Eliminar",
            color: "error",
            onClick: onDelete,
            confirm: (rows) => ({ variant: "delete", message: `Se eliminarán ${rows.length}` }),
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByLabelText("Seleccionar fila 1"));
    fireEvent.click(screen.getByLabelText("Seleccionar fila 3"));
    expect(screen.getByText("2 seleccionados")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(await screen.findByText("Se eliminarán 2")).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Eliminar" }),
    );
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith([ROWS[0], ROWS[2]]));
  });

  it("shows per-row actions respecting visibility", () => {
    const onEdit = vi.fn();
    render(
      <CnDataTable
        data={ROWS}
        columns={COLUMNS}
        rowActions={[
          { id: "edit", label: "Editar", icon: "edit", onClick: onEdit },
          {
            id: "reactivate",
            label: "Reactivar",
            visible: (row) => row.status === "inactive",
            onClick: () => {},
          },
        ]}
      />,
    );
    const menus = screen.getAllByRole("button", { name: "Acciones" });
    fireEvent.click(menus[0]);
    expect(screen.queryByRole("menuitem", { name: "Reactivar" })).toBeNull();
    fireEvent.click(screen.getByRole("menuitem", { name: "Editar" }));
    expect(onEdit).toHaveBeenCalledWith(ROWS[0]);
  });

  it("expands a detail panel", () => {
    render(
      <CnDataTable
        data={ROWS}
        columns={COLUMNS}
        renderDetail={(row) => <p>Detalle de {row.name}</p>}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Ver detalle" })[1]);
    expect(screen.getByText("Detalle de Bodega Norte")).toBeInTheDocument();
  });

  it("emits queries in server-side mode", () => {
    const onQueryChange = vi.fn();
    const Server = () => {
      const [query, setQuery] = useState<CnTableQuery>({
        pageIndex: 0,
        pageSize: 2,
        sorting: [],
        search: "",
        filters: {},
      });
      return (
        <CnDataTable
          data={ROWS.slice(0, 2)}
          columns={COLUMNS}
          pageSizeOptions={[2]}
          serverSide={{
            rowCount: 40,
            query,
            onQueryChange: (next) => {
              onQueryChange(next);
              setQuery(next);
            },
          }}
        />
      );
    };
    render(<Server />);
    expect(screen.getByText("1-2 de 40")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(onQueryChange).toHaveBeenLastCalledWith(expect.objectContaining({ pageIndex: 1 }));
    fireEvent.change(screen.getByLabelText("Buscar en la tabla"), { target: { value: "ana" } });
    expect(onQueryChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "ana", pageIndex: 0 }),
    );
    // En modo servidor no filtra localmente.
    expect(bodyRows()).toHaveLength(2);
  });

  it("shows the empty state", () => {
    render(<CnDataTable data={[]} columns={COLUMNS} emptyTitle="Aún no hay clientes" />);
    expect(screen.getByText("Aún no hay clientes")).toBeInTheDocument();
  });
});

describe("CnDataTable (Tabantaj parity)", () => {
  it("filters status columns with a select of options", () => {
    const columns = COLUMNS.map((c) =>
      c.id === "status" ? { ...c, filter: "select" as const } : c,
    );
    render(<CnDataTable data={ROWS} columns={columns} columnFilters />);
    fireEvent.change(screen.getByLabelText("Filtrar Estado"), { target: { value: "inactive" } });
    expect(bodyRows()).toHaveLength(1);
    expect(within(bodyRows()[0]).getByText("Bodega Norte")).toBeInTheDocument();
  });

  it("pins and hides columns from the column menu", () => {
    render(<CnDataTable data={ROWS} columns={COLUMNS} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Opciones de columna" })[1]);
    fireEvent.click(screen.getByRole("menuitem", { name: "Fijar a la izquierda" }));
    // La columna fijada pasa al inicio.
    const headers = screen.getAllByRole("columnheader").map((th) => th.textContent ?? "");
    expect(headers[0]).toContain("Ciudad");
    fireEvent.click(screen.getAllByRole("button", { name: "Opciones de columna" })[0]);
    fireEvent.click(screen.getByRole("menuitem", { name: "Ocultar columna" }));
    expect(screen.queryByText("Mérida")).toBeNull();
  });

  it("toggles row selection from the toolbar checkbox", () => {
    render(<CnDataTable data={ROWS} columns={COLUMNS} selectable selectionToggle />);
    expect(screen.queryByLabelText("Seleccionar fila 1")).toBeNull();
    fireEvent.click(screen.getByLabelText("Mostrar selección de filas"));
    expect(screen.getByLabelText("Seleccionar fila 1")).toBeInTheDocument();
  });

  it("cycles density and offers download formats with scopes", () => {
    render(<CnDataTable data={ROWS} columns={COLUMNS} />);
    fireEvent.click(screen.getByRole("button", { name: "Cambiar densidad" }));
    fireEvent.click(screen.getByRole("button", { name: "Descargar" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /CSV/ }));
    expect(screen.getByRole("menuitem", { name: /Todos los registros/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Página actual/ })).toBeInTheDocument();
  });

  it("keeps the format menu open while the scope submenu is shown", async () => {
    render(<CnDataTable data={ROWS} columns={COLUMNS} />);
    fireEvent.click(screen.getByRole("button", { name: "Copiar" }));
    const tabla = screen.getByRole("menuitem", { name: /Tabla/ });
    fireEvent.click(tabla);
    // El menú de formatos sigue abierto con la opción marcada, y el submenú a su lado.
    expect(screen.getAllByRole("menu", { hidden: true })).toHaveLength(2);
    expect(tabla).toHaveAttribute("aria-expanded", "true");
    // Escape cierra solo el submenú.
    fireEvent.keyDown(screen.getByRole("menuitem", { name: /Página actual/ }), { key: "Escape" });
    await waitFor(() => expect(screen.getAllByRole("menu", { hidden: true })).toHaveLength(1));
    expect(screen.getByRole("menuitem", { name: /Tabla/ })).toBeInTheDocument();
  });

  it("renders contextual empty cells and clears filters from the empty state", () => {
    type Person = { id: number; name: string; phone?: string };
    render(
      <CnDataTable<Person>
        data={[{ id: 1, name: "Ana" }]}
        columns={[
          { id: "name", header: "Nombre" },
          { id: "phone", header: "Teléfono", type: "phone" },
        ]}
      />,
    );
    expect(screen.getByText("Sin teléfono")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Buscar en la tabla"), { target: { value: "zzz" } });
    fireEvent.click(screen.getByRole("button", { name: "Limpiar búsqueda y filtros" }));
    expect(screen.getByText("Ana")).toBeInTheDocument();
  });
});

describe("table helpers", () => {
  it("formats cell text", () => {
    expect(formatCellText("percent", 12.5, {})).toMatch(/^12.5s?%$/);
    expect(formatCellText("boolean", false, {})).toBe("No");
    expect(formatCellText("duration", 135, {})).toBe("2 h 15 min");
    expect(formatCellText("date", "2024-05-06", {})).toMatch(/2024/);
  });

  it("escapes delimited output and neutralizes formulas", () => {
    expect(neutralizeFormula("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(neutralizeFormula("-12.5")).toBe("-12.5");
    expect(rowsToDelimited([{ id: "a", header: "A" }], [{ a: 'Hola, "mundo"' }])).toBe(
      'A\r\n"Hola, ""mundo"""',
    );
  });
});

const captureDownloads = () => {
  const blobs: Blob[] = [];
  const create = vi.fn((blob: Blob) => {
    blobs.push(blob);
    return "blob:test";
  });
  Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() });
  return blobs;
};

const blobText = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });

describe("CnDataTable advanced", () => {
  it("groups rows from the column menu with counts and aggregates", () => {
    render(<CnDataTable data={ROWS} columns={COLUMNS} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Opciones de columna" })[2]);
    fireEvent.click(screen.getByRole("menuitem", { name: "Agrupar por Estado" }));
    const groups = document.querySelectorAll("[data-group-row]");
    expect(groups).toHaveLength(2);
    expect(groups[0].textContent).toMatch(/2 registros/);
    expect(groups[0].textContent).toMatch(/Suma total de Saldo/);
    expect(screen.getByRole("region", { name: "Agrupación" })).toHaveTextContent("Estado");
    // Los grupos arrancan expandidos.
    expect(bodyRows()).toHaveLength(3);
    fireEvent.click(screen.getAllByRole("button", { name: "Contraer grupo" })[0]);
    expect(bodyRows()).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Quitar agrupación" }));
    expect(document.querySelectorAll("[data-group-row]")).toHaveLength(0);
  });

  it("numbers rows across pages", () => {
    render(
      <CnDataTable data={ROWS} columns={COLUMNS} rowNumbers pageSize={2} pageSizeOptions={[2]} />,
    );
    expect(within(bodyRows()[0]).getByText("1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(within(bodyRows()[0]).getByText("3")).toBeInTheDocument();
  });

  it("selects rows by clicking them", () => {
    const onSelectionChange = vi.fn();
    render(
      <CnDataTable
        data={ROWS}
        columns={COLUMNS}
        selectable
        selectOnRowClick
        onSelectionChange={onSelectionChange}
      />,
    );
    fireEvent.click(bodyRows()[1]);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["2"], [ROWS[1]]);
  });

  it("hides column menus and shows header descriptions", () => {
    const columns = COLUMNS.map((c) =>
      c.id === "balance" ? { ...c, description: "Saldo al corte" } : c,
    );
    render(<CnDataTable data={ROWS} columns={columns} columnActions={false} />);
    expect(screen.queryByRole("button", { name: "Opciones de columna" })).toBeNull();
    expect(screen.getByLabelText("Ayuda: Saldo al corte")).toBeInTheDocument();
  });

  it("shows per-row tooltips for inline actions and custom row colors", () => {
    render(
      <CnDataTable
        data={ROWS}
        columns={COLUMNS}
        getRowTone={(row) => (row.id === 2 ? "#fff8e1" : undefined)}
        rowActions={[
          {
            id: "pay",
            label: "Cobrar",
            icon: "paid",
            inline: true,
            disabled: (row) => row.balance < 500,
            tooltip: (row) => (row.balance < 500 ? "Saldo insuficiente" : undefined),
            onClick: () => {},
          },
        ]}
      />,
    );
    expect(screen.getAllByRole("button", { name: "Cobrar" })[1]).toBeDisabled();
    expect(getComputedStyle(bodyRows()[1]).getPropertyValue("--cn-row-bg").trim()).toBe("#fff8e1");
  });

  it("exports CSV with one row per detail item", async () => {
    const blobs = captureDownloads();
    type Order = { id: number; folio: string; items: { sku: string; qty: number }[] };
    render(
      <CnDataTable<Order>
        data={[
          {
            id: 1,
            folio: "OC-1",
            items: [
              { sku: "A", qty: 2 },
              { sku: "B", qty: 5 },
            ],
          },
          { id: 2, folio: "OC-2", items: [] },
        ]}
        columns={[{ id: "folio", header: "Folio" }]}
        exportDetail={{
          accessor: (row) => row.items,
          columns: [
            { id: "sku", header: "SKU" },
            { id: "qty", header: "Cantidad", type: "number" },
          ],
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Descargar" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /CSV/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Todos los registros/ }));
    await waitFor(() => expect(blobs).toHaveLength(1));
    const csv = await blobText(blobs[0]);
    const clean = csv.charCodeAt(0) === 0xfeff ? csv.slice(1) : csv;
    expect(clean.split(String.fromCharCode(13, 10))).toEqual([
      "Folio,SKU,Cantidad",
      "OC-1,A,2",
      "OC-1,B,5",
      "OC-2,,",
    ]);
  });

  it("exports a real XLSX with numeric cells", async () => {
    const blobs = captureDownloads();
    render(<CnDataTable data={ROWS} columns={COLUMNS} />);
    fireEvent.click(screen.getByRole("button", { name: "Descargar" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Excel/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Todos los registros/ }));
    await waitFor(() => expect(blobs).toHaveLength(1));
    const content = await blobText(blobs[0]);
    expect(content.startsWith("PK")).toBe(true);
    expect(content).toContain("xl/worksheets/sheet1.xml");
    expect(content).toContain("<v>1500</v>");
    expect(content).toContain("Ánfora SA");
    expect(blobs[0].type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  });
});

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

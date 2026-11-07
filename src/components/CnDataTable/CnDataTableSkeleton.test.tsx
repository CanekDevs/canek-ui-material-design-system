import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnDataTable } from "./CnDataTable";
import type { CnColumn } from "./CnDataTable.types";
import { CnDataTableSkeleton } from "./CnDataTableSkeleton";

type Row = { id: number; name: string; status: string; balance: number };

const COLUMNS: CnColumn<Row>[] = [
  { id: "name", header: "Nombre", type: "avatar" },
  { id: "status", header: "Estado", type: "status" },
  { id: "balance", header: "Saldo", type: "currency" },
  { id: "hidden", header: "Oculta", hidden: true },
];

const parts = (container: HTMLElement, part: string) =>
  container.querySelectorAll(`[data-sk-part="${part}"]`);

describe("CnDataTableSkeleton", () => {
  it("is a single accessible status", () => {
    render(<CnDataTableSkeleton title columns={4} />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "data-table");
  });

  it("follows rows, columns, cell kinds and toolbar toggles", () => {
    const { container, rerender } = render(
      <CnDataTableSkeleton columns={COLUMNS} rows={3} layout="table" />,
    );
    expect(parts(container, "header-cell")).toHaveLength(3);
    expect(parts(container, "row")).toHaveLength(3);
    const kinds = Array.from(parts(container, "row")[0].querySelectorAll("[data-sk-kind]")).map(
      (el) => el.getAttribute("data-sk-kind"),
    );
    expect(kinds).toEqual(["avatar", "pill", "number"]);
    expect(container.querySelector('[data-sk-tool="export"]')).toBeInTheDocument();
    expect(parts(container, "pagination")).toHaveLength(1);

    rerender(
      <CnDataTableSkeleton
        columns={2}
        rows={2}
        layout="table"
        exportFormats={false}
        densityToggle={false}
        pagination={false}
        selectable
        rowNumbers
        rowActions
      />,
    );
    expect(container.querySelector('[data-sk-tool="export"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-sk-tool="density"]')).not.toBeInTheDocument();
    expect(parts(container, "pagination")).toHaveLength(0);
    // 2 columnas + selección + número + acciones
    expect(parts(container, "row")[0].children).toHaveLength(5);
  });

  it("changes the row padding with density and renders cards", () => {
    const { container, rerender } = render(
      <CnDataTableSkeleton columns={2} rows={1} layout="table" density="compact" />,
    );
    const cell = () => parts(container, "cell")[0] as HTMLElement;
    expect(getComputedStyle(cell()).paddingTop).toBe("6px");
    rerender(<CnDataTableSkeleton columns={2} rows={1} layout="table" density="spacious" />);
    expect(getComputedStyle(cell()).paddingTop).toBe("16px");
    rerender(<CnDataTableSkeleton columns={3} rows={3} layout="cards" />);
    expect(parts(container, "card")).toHaveLength(3);
    expect(parts(container, "row")).toHaveLength(0);
  });

  it("CnDataTable shows the skeleton on first load and with the skeleton prop", () => {
    const { container, rerender } = render(
      <CnDataTable title="Clientes" data={[] as Row[]} columns={COLUMNS} loading />,
    );
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "data-table");
    expect(parts(container, "header-cell")).toHaveLength(3);
    expect(screen.queryByLabelText("Buscar en la tabla")).not.toBeInTheDocument();

    const rows: Row[] = [{ id: 1, name: "Ana", status: "active", balance: 10 }];
    rerender(<CnDataTable title="Clientes" data={rows} columns={COLUMNS} skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "data-table");
  });

  it("keeps the real table when reloading after the first load", () => {
    const { container, rerender } = render(<CnDataTable data={[] as Row[]} columns={COLUMNS} />);
    rerender(<CnDataTable data={[] as Row[]} columns={COLUMNS} loading />);
    expect(container.querySelector('[data-cn-skeleton="data-table"]')).not.toBeInTheDocument();
    expect(screen.getByLabelText("Buscar en la tabla")).toBeInTheDocument();
  });
});

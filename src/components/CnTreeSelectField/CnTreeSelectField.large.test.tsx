import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CnTreeOption } from "./CnTreeSelectField";
import { CnTreeSelectField } from "./CnTreeSelectField";

/** 50 regiones × 99 sucursales = 5,000 nodos. */
const TREE: CnTreeOption[] = Array.from({ length: 50 }, (_, region) => ({
  value: `r${region}`,
  label: `Región ${region}`,
  children: Array.from({ length: 99 }, (_, branch) => ({
    value: `r${region}-s${branch}`,
    label: `Sucursal ${region}-${branch}`,
  })),
}));

const open = () => fireEvent.click(screen.getByRole("combobox"));

describe("CnTreeSelectField · listas grandes", () => {
  it("virtualizes the flattened visible tree", () => {
    render(<CnTreeSelectField label="Sucursal" options={TREE} defaultExpandAll />);
    open();
    const items = within(screen.getByRole("tree")).getAllByRole("treeitem");
    expect(items.length).toBeLessThan(60);
  });

  it("reaches the last node with End and selects it with Enter", () => {
    const onChange = vi.fn();
    render(
      <CnTreeSelectField label="Sucursal" options={TREE} defaultExpandAll onChange={onChange} />,
    );
    open();
    const first = within(screen.getByRole("tree")).getAllByRole("treeitem")[0];
    first.focus();
    fireEvent.keyDown(first, { key: "End" });
    expect(document.activeElement).toHaveTextContent("Sucursal 49-98");
    fireEvent.keyDown(document.activeElement as Element, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("r49-s98");
  });

  it("searches across thousands of nodes keeping ancestors", () => {
    render(<CnTreeSelectField label="Sucursal" options={TREE} />);
    open();
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "sucursal 7-42" } });
    const tree = screen.getByRole("tree");
    expect(within(tree).getByText("Región 7")).toBeInTheDocument();
    expect(within(tree).getByText("Sucursal 7-42")).toBeInTheDocument();
    expect(within(tree).getAllByRole("treeitem")).toHaveLength(2);
  });
});

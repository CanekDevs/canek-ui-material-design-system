import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CnFilterDefinition } from "./CnFilterBar";
import { CnFilterBar, describeFilterValue } from "./CnFilterBar";
import { CnFilterBarSkeleton } from "./CnFilterBarSkeleton";

const FILTERS: CnFilterDefinition[] = [
  {
    id: "stage",
    label: "Etapa",
    type: "multiselect",
    options: [
      { value: "proposal", label: "Propuesta" },
      { value: "negotiation", label: "Negociación" },
    ],
  },
  { id: "company", label: "Empresa", type: "text" },
];

const QUICK = [
  { id: "mine", label: "Mías", count: 3 },
  { id: "late", label: "Vencidas" },
];

describe("describeFilterValue", () => {
  it("usa las etiquetas de las opciones y une varios valores", () => {
    expect(describeFilterValue(FILTERS[0], ["proposal", "negotiation"])).toBe(
      "Etapa: Propuesta, Negociación",
    );
    expect(describeFilterValue(FILTERS[1], "Altavista")).toBe("Empresa: Altavista");
  });
});

describe("CnFilterBar", () => {
  it("es una región de búsqueda con nombre accesible", () => {
    render(<CnFilterBar ariaLabel="Filtrar oportunidades" />);
    expect(screen.getByRole("search", { name: "Filtrar oportunidades" })).toBeInTheDocument();
  });

  it("los filtros rápidos son interruptores con aria-pressed", () => {
    const onQuickFiltersChange = vi.fn();
    render(
      <CnFilterBar
        quickFilters={QUICK}
        activeQuickFilters={["mine"]}
        onQuickFiltersChange={onQuickFiltersChange}
      />,
    );
    const group = screen.getByRole("group", { name: "Filtros rápidos" });
    const mine = within(group).getByRole("button", { name: /Mías · 3/ });
    expect(mine).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(mine);
    expect(onQuickFiltersChange).toHaveBeenCalledWith([]);
    fireEvent.click(within(group).getByRole("button", { name: /Vencidas/ }));
    expect(onQuickFiltersChange).toHaveBeenLastCalledWith(["mine", "late"]);
  });

  it("muestra chips de filtros activos y los quita", () => {
    const onValuesChange = vi.fn();
    render(
      <CnFilterBar
        filters={FILTERS}
        values={{ stage: ["proposal"], company: "" }}
        onValuesChange={onValuesChange}
      />,
    );
    expect(screen.getByRole("button", { name: "Filtros (1)" })).toBeInTheDocument();
    expect(screen.getByText("Etapa: Propuesta")).toBeInTheDocument();
    expect(screen.queryByText(/Empresa:/)).not.toBeInTheDocument();
    const chip = screen.getByText("Etapa: Propuesta").closest(".MuiChip-root") as HTMLElement;
    fireEvent.click(chip.querySelector(".MuiChip-deleteIcon") as Element);
    expect(onValuesChange).toHaveBeenCalledWith({ stage: undefined, company: "" });
  });

  it("el panel de filtros abre como diálogo y aplica el borrador", () => {
    const onValuesChange = vi.fn();
    render(<CnFilterBar filters={FILTERS} values={{}} onValuesChange={onValuesChange} />);
    const trigger = screen.getByRole("button", { name: "Filtros" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Filtros" });
    fireEvent.change(within(dialog).getByLabelText("Empresa"), { target: { value: "Altavista" } });
    expect(onValuesChange).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Aplicar" }));
    expect(onValuesChange).toHaveBeenCalledWith({ company: "Altavista" });
  });

  it("Limpiar todo borra filtros, rápidos y búsqueda", () => {
    const onValuesChange = vi.fn();
    const onQuickFiltersChange = vi.fn();
    const onSearchChange = vi.fn();
    render(
      <CnFilterBar
        search="alta"
        onSearchChange={onSearchChange}
        quickFilters={QUICK}
        activeQuickFilters={["mine"]}
        onQuickFiltersChange={onQuickFiltersChange}
        filters={FILTERS}
        values={{ company: "x" }}
        onValuesChange={onValuesChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Limpiar todo" }));
    expect(onValuesChange).toHaveBeenCalledWith({ stage: undefined, company: undefined });
    expect(onQuickFiltersChange).toHaveBeenCalledWith([]);
    expect(onSearchChange).toHaveBeenCalledWith("");
  });

  it("sin nada activo no muestra Limpiar todo", () => {
    render(<CnFilterBar quickFilters={QUICK} onQuickFiltersChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Limpiar todo" })).not.toBeInTheDocument();
  });

  it("vistas: menú con la vista activa y guardar una nueva", () => {
    const onViewChange = vi.fn();
    const onSaveView = vi.fn();
    render(
      <CnFilterBar
        views={[
          { id: "a", label: "Todas" },
          { id: "b", label: "Mías" },
        ]}
        activeViewId="a"
        onViewChange={onViewChange}
        onSaveView={onSaveView}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Todas" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Mías" }));
    expect(onViewChange).toHaveBeenCalledWith("b");

    fireEvent.click(screen.getByRole("button", { name: "Todas" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Guardar vista actual" }));
    const form = screen.getByRole("form", { name: "Guardar vista" });
    const save = within(form).getByRole("button", { name: "Guardar" });
    expect(save).toBeDisabled();
    fireEvent.change(within(form).getByLabelText("Nombre de la vista"), {
      target: { value: "Q4" },
    });
    fireEvent.click(save);
    expect(onSaveView).toHaveBeenCalledWith("Q4");
  });

  it("anuncia el total de resultados con separador de miles", () => {
    render(<CnFilterBar resultCount={1234567} resultNoun="oportunidades" />);
    expect(screen.getByRole("status")).toHaveTextContent("1,234,567 oportunidades");
  });

  it("con skeleton muestra un único estado de carga accesible", () => {
    render(<CnFilterBar skeleton quickFilters={QUICK} onSearchChange={vi.fn()} />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
  });
});

describe("CnFilterBarSkeleton", () => {
  it("expone su nombre en data-cn-skeleton", () => {
    render(<CnFilterBarSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "filter-bar");
  });
});

import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnList } from "./CnList";
import type { CnListItemData } from "./CnList.types";
import { CnListItem } from "./CnListItem";
import { CnListSkeleton } from "./CnListSkeleton";
import { formatRelativeTime, highlightText } from "./list-utils";

const people: CnListItemData[] = [
  { id: "1", title: "Ana López", subtitle: "Diseño", group: "Equipo A" },
  { id: "2", title: "Bruno Díaz", subtitle: "Ingeniería", group: "Equipo B" },
  { id: "3", title: "Carla Muñoz", subtitle: "Producto", group: "Equipo A" },
  { id: "4", title: "Daniel Pérez", subtitle: "Ingeniería", group: "Equipo B", disabled: true },
];

const titles = () =>
  [...document.querySelectorAll('[data-cn-list-row^="i:"] [data-cn-list-title]')].map(
    (el) => el.textContent,
  );

describe("CnList", () => {
  it("renders items with list semantics and rich content", () => {
    render(
      <CnList
        ariaLabel="Contactos"
        items={[
          {
            id: "a",
            title: "Ana",
            subtitle: "ana@canek.mx",
            meta: "12 MB",
            status: { label: "Activo", color: "success" },
            badge: 3,
            avatar: { name: "Ana López" },
          },
        ]}
      />,
    );
    const list = screen.getByRole("list", { name: "Contactos" });
    const item = within(list).getByRole("listitem");
    expect(item).toHaveTextContent("Ana");
    expect(item).toHaveTextContent("ana@canek.mx");
    expect(item).toHaveTextContent("12 MB");
    expect(item).toHaveTextContent("Activo");
    expect(item.querySelector('[data-cn-list-badge="count"]')).toHaveTextContent("3");
  });

  it("maps arbitrary data with accessors", () => {
    type User = { uid: number; name: string; mail: string };
    render(
      <CnList<User>
        items={[
          { uid: 1, name: "Zoe", mail: "zoe@x.mx" },
          { uid: 2, name: "Yago", mail: "yago@x.mx" },
        ]}
        getId={(u) => String(u.uid)}
        getTitle={(u) => u.name}
        getSubtitle={(u) => u.mail}
      />,
    );
    expect(titles()).toEqual(["Zoe", "Yago"]);
    expect(screen.getByText("yago@x.mx")).toBeInTheDocument();
  });

  it("supports a custom renderItem", () => {
    render(
      <CnList
        items={people.slice(0, 2)}
        renderItem={(item, state) => (
          <span data-testid="custom">
            {String(item.title)}-{state.index}
          </span>
        )}
      />,
    );
    expect(screen.getAllByTestId("custom").map((el) => el.textContent)).toEqual([
      "Ana López-0",
      "Bruno Díaz-1",
    ]);
  });

  it("single selection: click selects and marks aria-selected", () => {
    const onSelectionChange = vi.fn();
    render(<CnList items={people} selectionMode="single" onSelectionChange={onSelectionChange} />);
    expect(screen.getByRole("listbox")).not.toHaveAttribute("aria-multiselectable");
    fireEvent.click(screen.getByText("Bruno Díaz"));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["2"], [people[1]]);
    expect(screen.getAllByRole("option")[1]).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByText("Ana López"));
    expect(screen.getAllByRole("option")[1]).toHaveAttribute("aria-selected", "false");
  });

  it("multiple selection with checkboxes, select all (indeterminate) and bulk actions", async () => {
    const onArchive = vi.fn();
    render(
      <CnList
        items={people}
        selectionMode="multiple"
        bulkActions={[{ id: "archive", label: "Archivar", icon: "archive", onClick: onArchive }]}
      />,
    );
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true");
    fireEvent.click(screen.getByRole("checkbox", { name: "Seleccionar Ana López" }));
    const all = screen.getByRole("checkbox", { name: "Seleccionar todo" });
    expect(all).toHaveAttribute("data-indeterminate", "true");
    expect(screen.getByText("1 seleccionado")).toBeInTheDocument();

    fireEvent.click(all);
    // El deshabilitado no se selecciona.
    expect(screen.getByText("3 seleccionados")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Seleccionar todo" })).toBeChecked();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Archivar/ }));
    });
    expect(onArchive).toHaveBeenCalledWith([people[0], people[1], people[2]], ["1", "2", "3"]);
    expect(screen.queryByText(/seleccionados?$/)).not.toBeInTheDocument();
  });

  it("controlled selection", () => {
    const { rerender } = render(
      <CnList items={people} selectionMode="multiple" selectedIds={["3"]} />,
    );
    expect(screen.getAllByRole("option")[2]).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByText("Ana López"));
    // Sigue controlado.
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "false");
    rerender(<CnList items={people} selectionMode="multiple" selectedIds={["1"]} />);
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true");
  });

  it("keyboard: roving tabindex, arrows, Home/End, Space, type-ahead, skips disabled", () => {
    const onSelectionChange = vi.fn();
    render(
      <CnList items={people} selectionMode="multiple" onSelectionChange={onSelectionChange} />,
    );
    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.tabIndex)).toEqual([0, -1, -1, -1]);
    act(() => options[0].focus());
    fireEvent.keyDown(options[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(options[1]);
    fireEvent.keyDown(options[1], { key: " " });
    expect(onSelectionChange).toHaveBeenLastCalledWith(["2"], [people[1]]);
    fireEvent.keyDown(options[1], { key: "End" });
    // El último está deshabilitado: End va al último habilitado.
    expect(document.activeElement).toBe(options[2]);
    fireEvent.keyDown(options[2], { key: "Home" });
    expect(document.activeElement).toBe(options[0]);
    fireEvent.keyDown(options[0], { key: "c" });
    expect(document.activeElement).toBe(options[2]);
    expect(options[2].tabIndex).toBe(0);
    expect(options[0].tabIndex).toBe(-1);
    fireEvent.keyDown(options[2], { key: "a", ctrlKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      ["2", "1", "3"],
      [people[1], people[0], people[2]],
    );
  });

  it("Enter activates the item", () => {
    const onItemClick = vi.fn();
    render(<CnList items={people} onItemClick={onItemClick} />);
    const items = screen.getAllByRole("listitem");
    act(() => items[0].focus());
    fireEvent.keyDown(items[0], { key: "Enter" });
    expect(onItemClick).toHaveBeenCalledWith(people[0], 0);
  });

  it("groups with sticky, collapsible headers and counts", () => {
    render(
      <CnList
        items={people}
        groupBy={(p) => p.group}
        collapsibleGroups
        defaultCollapsedGroups={["Equipo B"]}
      />,
    );
    const headers = document.querySelectorAll("[data-cn-list-subheader]");
    expect(headers).toHaveLength(2);
    expect(headers[0]).toHaveTextContent("Equipo A");
    expect(headers[0].querySelector("[data-cn-list-count]")).toHaveTextContent("2");
    expect(titles()).toEqual(["Ana López", "Carla Muñoz"]);
    const groupB = screen.getByRole("button", { name: /Equipo B/ });
    expect(groupB).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(groupB);
    expect(titles()).toEqual(["Ana López", "Carla Muñoz", "Bruno Díaz", "Daniel Pérez"]);
    // Teclado: flecha izquierda pliega el grupo enfocado.
    const groupA = screen.getByRole("button", { name: /Equipo A/ });
    fireEvent.keyDown(groupA, { key: "ArrowLeft" });
    fireEvent.click(groupA);
    expect(titles()).toEqual(["Ana López", "Carla Muñoz", "Bruno Díaz", "Daniel Pérez"]);
  });

  it("explicit sections", () => {
    render(
      <CnList
        sections={[
          { id: "hoy", title: "Hoy", items: [people[0]] },
          { id: "ayer", title: "Ayer", items: [people[1], people[2]] },
        ]}
      />,
    );
    const headers = document.querySelectorAll("[data-cn-list-subheader]");
    expect([...headers].map((h) => h.textContent)).toEqual(["Hoy1", "Ayer2"]);
  });

  it("nested tree: expand/collapse with button and keyboard", () => {
    const tree: CnListItemData[] = [
      {
        id: "docs",
        title: "Documentos",
        children: [
          { id: "cv", title: "CV.pdf" },
          { id: "fotos", title: "Fotos", children: [{ id: "playa", title: "playa.jpg" }] },
        ],
      },
      { id: "musica", title: "Música" },
    ];
    render(<CnList items={tree} ariaLabel="Archivos" />);
    expect(screen.getByRole("tree", { name: "Archivos" })).toBeInTheDocument();
    expect(titles()).toEqual(["Documentos", "Música"]);
    fireEvent.click(screen.getByRole("button", { name: "Expandir Documentos" }));
    expect(titles()).toEqual(["Documentos", "CV.pdf", "Fotos", "Música"]);
    const fotos = screen.getAllByRole("treeitem")[2];
    expect(fotos).toHaveAttribute("aria-level", "2");
    expect(fotos).toHaveAttribute("aria-expanded", "false");
    act(() => fotos.focus());
    fireEvent.keyDown(fotos, { key: "ArrowRight" });
    expect(titles()).toEqual(["Documentos", "CV.pdf", "Fotos", "playa.jpg", "Música"]);
    fireEvent.keyDown(fotos, { key: "ArrowLeft" });
    expect(titles()).toEqual(["Documentos", "CV.pdf", "Fotos", "Música"]);
    fireEvent.keyDown(fotos, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(screen.getAllByRole("treeitem")[0]);
  });

  it("search is accent-insensitive, highlights and shows an empty result", () => {
    const onSearchChange = vi.fn();
    render(<CnList items={people} searchable onSearchChange={onSearchChange} showCount />);
    const input = screen.getByRole("searchbox", { name: "Buscar en la lista" });
    fireEvent.change(input, { target: { value: "munoz" } });
    expect(onSearchChange).toHaveBeenLastCalledWith("munoz");
    expect(titles()).toEqual(["Carla Muñoz"]);
    expect(document.querySelector("mark")).toHaveTextContent("Muñoz");
    expect(screen.getByText("1 de 4 elementos")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "ingenieria" } });
    expect(titles()).toEqual(["Bruno Díaz", "Daniel Pérez"]);
    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Limpiar búsqueda"));
    expect(titles()).toHaveLength(4);
  });

  it("search keeps ancestors of matching nested items", () => {
    render(
      <CnList
        searchable
        defaultSearch="playa"
        items={[
          {
            id: "f",
            title: "Fotos",
            children: [
              { id: "p", title: "playa.jpg" },
              { id: "m", title: "montaña.jpg" },
            ],
          },
        ]}
      />,
    );
    expect(titles()).toEqual(["Fotos", "playa.jpg"]);
  });

  it("sorts with sort options", () => {
    const onSortChange = vi.fn();
    render(
      <CnList
        items={people}
        onSortChange={onSortChange}
        sortOptions={[
          {
            id: "za",
            label: "Nombre Z-A",
            compare: (a, b) => String(b.title).localeCompare(String(a.title)),
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ordenar" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Nombre Z-A" }));
    expect(onSortChange).toHaveBeenCalledWith("za");
    expect(titles()).toEqual(["Daniel Pérez", "Carla Muñoz", "Bruno Díaz", "Ana López"]);
  });

  it("item actions: inline and overflow menu", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onItemClick = vi.fn();
    render(
      <CnList
        items={people.slice(0, 1)}
        onItemClick={onItemClick}
        itemActions={[
          { id: "edit", label: "Editar", icon: "edit", inline: true, onClick: onEdit },
          { id: "delete", label: "Eliminar", icon: "delete", color: "error", onClick: onDelete },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Editar: Ana López" }));
    expect(onEdit).toHaveBeenCalledWith(people[0]);
    fireEvent.click(screen.getByRole("button", { name: "Más acciones: Ana López" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Eliminar" }));
    expect(onDelete).toHaveBeenCalledWith(people[0]);
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it("reorders with the keyboard (handle and Alt+arrows)", () => {
    const onReorder = vi.fn();
    render(<CnList items={people.slice(0, 3)} reorderable onReorder={onReorder} />);
    const handles = screen.getAllByRole("button", { name: /^Reordenar/ });
    expect(handles).toHaveLength(3);
    fireEvent.keyDown(handles[0], { key: "ArrowDown" });
    expect(onReorder).toHaveBeenLastCalledWith([people[1], people[0], people[2]], 0, 1);
    expect(titles()).toEqual(["Bruno Díaz", "Ana López", "Carla Muñoz"]);
    const items = screen.getAllByRole("listitem");
    act(() => items[2].focus());
    fireEvent.keyDown(items[2], { key: "ArrowUp", altKey: true });
    expect(titles()).toEqual(["Bruno Díaz", "Carla Muñoz", "Ana López"]);
    expect(screen.getByText(/movido a la posición 2 de 3/)).toBeInTheDocument();
  });

  it("load more: button mode, auto mode on scroll and loading row", () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <CnList items={people} hasMore onLoadMore={onLoadMore} loadMoreMode="button" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cargar más" }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    rerender(<CnList items={people} hasMore onLoadMore={onLoadMore} maxHeight={200} />);
    const scroller = document.querySelector("[data-cn-list-scroll]") as HTMLElement;
    fireEvent.scroll(scroller);
    expect(onLoadMore).toHaveBeenCalledTimes(2);
    fireEvent.scroll(scroller);
    // No repite mientras no cambien los elementos.
    expect(onLoadMore).toHaveBeenCalledTimes(2);

    rerender(<CnList items={people} hasMore onLoadMore={onLoadMore} maxHeight={200} loadingMore />);
    expect(screen.getByRole("status", { name: "Cargando más elementos" })).toBeInTheDocument();
    expect(screen.getByRole("list")).toHaveAttribute("aria-busy", "true");
  });

  it("virtualizes large lists rendering only a window", async () => {
    const many: CnListItemData[] = Array.from({ length: 10000 }, (_, i) => ({
      id: `n${i}`,
      title: `Elemento ${i}`,
    }));
    render(<CnList items={many} maxHeight={400} estimatedItemHeight={40} overscan={4} />);
    const list = screen.getByRole("list");
    expect(list).toHaveAttribute("data-virtualized", "true");
    const rendered = screen.getAllByRole("listitem");
    // 400 / 40 = 10 visibles + overscan.
    expect(rendered.length).toBeGreaterThan(5);
    expect(rendered.length).toBeLessThan(30);
    expect(rendered[0]).toHaveAttribute("aria-setsize", "10000");
    expect(getComputedStyle(list).height).toBe("400000px");

    const scroller = document.querySelector("[data-cn-list-scroll]") as HTMLElement;
    scroller.scrollTop = 40 * 5000;
    fireEvent.scroll(scroller);
    await waitFor(() => {
      const titlesNow = titles();
      expect(titlesNow).toContain("Elemento 5000");
      expect(titlesNow).not.toContain("Elemento 0");
      expect(titlesNow.length).toBeLessThan(30);
    });
  });

  it("keyboard End in a virtualized list scrolls and focuses the last item", () => {
    const many: CnListItemData[] = Array.from({ length: 2000 }, (_, i) => ({
      id: `n${i}`,
      title: `Fila ${i}`,
    }));
    render(<CnList items={many} maxHeight={400} estimatedItemHeight={40} />);
    const first = screen.getAllByRole("listitem")[0];
    act(() => first.focus());
    act(() => {
      fireEvent.keyDown(first, { key: "End" });
    });
    expect(document.activeElement).toHaveTextContent("Fila 1999");
  });

  it("states: skeleton, loading, empty, error with retry", () => {
    const onRetry = vi.fn();
    const { rerender } = render(<CnList items={[]} loading groupBy={() => "x"} />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("data-cn-skeleton", "list");
    expect(status.querySelectorAll("[data-cn-list-skeleton-section]")).toHaveLength(2);

    rerender(<CnList items={[]} emptyTitle="Nada por aquí" />);
    expect(screen.getByText("Nada por aquí")).toBeInTheDocument();

    rerender(<CnList items={[]} error="Falló la red" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Falló la red");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalled();

    rerender(<CnList items={people} error="Datos desactualizados" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Datos desactualizados");
    expect(titles()).toHaveLength(4);
  });

  it("skeleton prop matches variant/avatar/lines of the items", () => {
    render(
      <CnList
        skeleton
        variant="card"
        searchable
        items={[{ id: "a", title: "A", subtitle: "b", icon: "folder", meta: "1" }]}
      />,
    );
    const status = screen.getByRole("status");
    expect(status.querySelector("[data-cn-list-skeleton-toolbar]")).not.toBeNull();
    expect(screen.queryByText("A")).not.toBeInTheDocument();
  });
});

describe("CnListItem", () => {
  it("works standalone as a button and as a link", () => {
    const onClick = vi.fn();
    const { rerender } = render(<CnListItem title="Perfil" chevron onClick={onClick} />);
    const button = screen.getByRole("button", { name: /Perfil/ });
    fireEvent.keyDown(button, { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<CnListItem title="Ayuda" href="/ayuda" />);
    expect(screen.getByRole("link", { name: "Ayuda" })).toHaveAttribute("href", "/ayuda");
  });

  it("renders its skeleton", () => {
    render(<CnListItem title="X" avatar={{ name: "X" }} skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "list");
  });
});

describe("CnListSkeleton", () => {
  it("is a single status with rows, sections and toolbar", () => {
    render(<CnListSkeleton count={3} sections={2} toolbar checkbox />);
    const status = screen.getAllByRole("status");
    expect(status).toHaveLength(1);
    expect(status[0].querySelectorAll("[data-cn-list-skeleton-row]")).toHaveLength(6);
    expect(status[0].querySelector("[data-cn-list-skeleton-toolbar]")).not.toBeNull();
  });
});

describe("list-utils", () => {
  it("highlights ignoring accents", () => {
    const { container } = render(<p>{highlightText("José Pérez", "perez")}</p>);
    expect(container.querySelector("mark")).toHaveTextContent("Pérez");
  });

  it("formats relative times in Spanish", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    expect(formatRelativeTime(new Date("2026-01-10T11:59:50Z"), now)).toBe("ahora");
    expect(formatRelativeTime(new Date("2026-01-10T11:55:00Z"), now)).toMatch(/5 min/);
    expect(formatRelativeTime(new Date("2025-03-02T12:00:00Z"), now)).toMatch(/2025/);
  });
});

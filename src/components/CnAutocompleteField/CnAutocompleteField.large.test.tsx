import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CnLoadOptionsContext } from "../../utils/use-async-options";
import type { CnFieldOption } from "../CnForm/CnForm.types";
import { CnAutocompleteField } from "./CnAutocompleteField";

const many = (count: number, prefix = "Opción"): CnFieldOption[] =>
  Array.from({ length: count }, (_, index) => ({ value: index, label: `${prefix} ${index}` }));

const BIG = many(10_000);

/** Servidor simulado: 1,000 registros, filtrado y paginado. */
const createServer = (total = 1000) => {
  const rows = many(total, "Cliente");
  return vi.fn(async ({ input, page, pageSize }: CnLoadOptionsContext) => {
    const matches = rows.filter((row) => row.label.toLowerCase().includes(input.toLowerCase()));
    const slice = matches.slice(page * pageSize, (page + 1) * pageSize);
    return {
      options: slice,
      hasMore: (page + 1) * pageSize < matches.length,
      total: matches.length,
    };
  });
};

const openList = () => {
  const input = screen.getByRole("combobox");
  act(() => input.focus());
  fireEvent.keyDown(input, { key: "ArrowDown" });
  return input;
};

/** Lleva el scroll al final de las filas cargadas (36 px estimados por fila). */
const scrollToBottom = (listbox: HTMLElement, rows: number) => {
  act(() => {
    listbox.scrollTop = rows * 36 - 300;
    fireEvent.scroll(listbox);
  });
};

describe("CnAutocompleteField · listas grandes", () => {
  it("virtualizes 10,000 options rendering only a window", () => {
    render(<CnAutocompleteField label="Opciones" options={BIG} />);
    openList();
    const listbox = screen.getByRole("listbox");
    const rendered = within(listbox).getAllByRole("option");
    expect(rendered.length).toBeLessThan(60);
    expect(listbox).toHaveAttribute("data-cn-virtual-listbox");
    expect(rendered[0]).toHaveAttribute("aria-setsize", "10000");
  });

  it("does not virtualize short lists unless asked", () => {
    render(<CnAutocompleteField label="Opciones" options={many(20)} />);
    openList();
    expect(screen.getByRole("listbox")).not.toHaveAttribute("data-cn-virtual-listbox");
    expect(screen.getAllByRole("option")).toHaveLength(20);
  });

  it("reaches far items with the keyboard (End + Enter)", () => {
    const onChange = vi.fn();
    render(<CnAutocompleteField label="Opciones" options={BIG} onChange={onChange} />);
    const input = openList();
    fireEvent.keyDown(input, { key: "End" });
    expect(input.getAttribute("aria-activedescendant")).toMatch(/-option-9999$/);
    expect(screen.getByText("Opción 9999")).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(9999);
  });

  it("filters accent-insensitively and limits results with maxResults", () => {
    const options = [
      ...many(500, "Ciudad"),
      { value: "x", label: "Mérida" },
      { value: "y", label: "Mazatlán" },
    ];
    render(<CnAutocompleteField label="Ciudad" options={options} maxResults={10} />);
    const input = openList();
    fireEvent.change(input, { target: { value: "ciudad" } });
    expect(screen.getAllByRole("option")).toHaveLength(10);
    expect(screen.getByText("490 más, refina tu búsqueda")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "merida" } });
    expect(screen.getByText("Mérida")).toBeInTheDocument();
  });

  it("accepts a custom filterOptions", () => {
    const filterOptions = vi.fn((options: readonly CnFieldOption[], input: string) =>
      options.filter((option) => option.label.endsWith(input)),
    );
    render(
      <CnAutocompleteField label="Opciones" options={many(30)} filterOptions={filterOptions} />,
    );
    const input = openList();
    fireEvent.change(input, { target: { value: "7" } });
    expect(filterOptions).toHaveBeenCalled();
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Opción 7",
      "Opción 17",
      "Opción 27",
    ]);
  });

  it("loads the next page near the end and stops when hasMore is false", async () => {
    const server = createServer(120);
    render(
      <CnAutocompleteField
        label="Cliente"
        loadOptions={server}
        pageSize={50}
        searchDebounceMs={0}
      />,
    );
    openList();
    await screen.findByText("Cliente 0");
    expect(server).toHaveBeenCalledTimes(1);
    expect(server).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, pageSize: 50 }));
    expect(screen.getByText("Mostrando 50 de 120")).toBeInTheDocument();

    scrollToBottom(screen.getByRole("listbox"), 50);
    await waitFor(() => expect(server).toHaveBeenCalledTimes(2));
    expect(server).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
    await screen.findByText("Mostrando 100 de 120");

    scrollToBottom(screen.getByRole("listbox"), 100);
    await waitFor(() => expect(server).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument());

    scrollToBottom(screen.getByRole("listbox"), 120);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(server).toHaveBeenCalledTimes(3);
  });

  it("shows a retry row when a page fails", async () => {
    let fail = true;
    const loader = vi.fn(async ({ page }: CnLoadOptionsContext) => {
      if (page === 1 && fail) {
        fail = false;
        throw new Error("Falla de red");
      }
      return {
        options: many(50).map((o) => ({ ...o, value: page * 50 + Number(o.value) })),
        hasMore: page < 2,
      };
    });
    render(<CnAutocompleteField label="Cliente" loadOptions={loader} searchDebounceMs={0} />);
    openList();
    await screen.findAllByText("Opción 0");
    scrollToBottom(screen.getByRole("listbox"), 50);
    const retry = await screen.findByRole("button", { name: "Reintentar" });
    fireEvent.click(retry);
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(screen.queryByText("Reintentar")).not.toBeInTheDocument());
  });

  it("aborts the previous request when the search changes and reuses the cache", async () => {
    const signals: Record<string, AbortSignal[]> = {};
    const loader = vi.fn(
      ({ input, signal }: CnLoadOptionsContext) =>
        new Promise<CnFieldOption[]>((resolve) => {
          (signals[input] ??= []).push(signal);
          setTimeout(
            () => resolve([{ value: input || "-", label: `Resultado ${input || "inicial"}` }]),
            5,
          );
        }),
    );
    render(<CnAutocompleteField label="Buscar" loadOptions={loader} searchDebounceMs={0} />);
    const input = openList();
    await screen.findByText("Resultado inicial");
    fireEvent.change(input, { target: { value: "ab" } });
    await waitFor(() => expect(signals.ab).toHaveLength(1));
    fireEvent.change(input, { target: { value: "abc" } });
    await waitFor(() => expect(signals.abc).toHaveLength(1));
    expect(signals.ab[0].aborted).toBe(true);
    await screen.findByText("Resultado abc");

    const calls = loader.mock.calls.length;
    fireEvent.change(input, { target: { value: "" } });
    await screen.findByText("Resultado inicial");
    // "" ya estaba en caché: no hay petición nueva.
    expect(loader).toHaveBeenCalledTimes(calls);
  });

  it("asks for at least N characters before searching", async () => {
    const loader = vi.fn(async () => []);
    render(
      <CnAutocompleteField
        label="Buscar"
        loadOptions={loader}
        minSearchLength={3}
        searchDebounceMs={0}
      />,
    );
    const input = openList();
    fireEvent.change(input, { target: { value: "ab" } });
    expect(await screen.findByText("Escribe al menos 3 caracteres")).toBeInTheDocument();
    expect(loader).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "abc" } });
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Sin resultados")).toBeInTheDocument();
  });

  it("resolves preselected values that are not in the loaded page", async () => {
    const server = createServer(1000);
    const resolveOptions = vi.fn(async (values: Array<string | number>) =>
      values.map((value) => ({ value, label: `Cliente ${value}` })),
    );
    render(
      <CnAutocompleteField
        label="Clientes"
        multiple
        loadOptions={server}
        resolveOptions={resolveOptions}
        value={[987, 654]}
        onChange={() => {}}
      />,
    );
    expect(await screen.findByText("Cliente 987")).toBeInTheDocument();
    expect(screen.getByText("Cliente 654")).toBeInTheDocument();
    expect(resolveOptions).toHaveBeenCalledTimes(1);
    expect(resolveOptions).toHaveBeenCalledWith([987, 654], expect.anything());
    // No se descarga la lista para pintar los chips.
    expect(server).not.toHaveBeenCalled();
  });

  it("keeps working with loaders that return a plain array", async () => {
    const loader = vi.fn(async ({ input }: { input: string; signal: AbortSignal }) =>
      many(5, `Item${input}`),
    );
    const onChange = vi.fn();
    render(
      <CnAutocompleteField
        label="Legacy"
        loadOptions={loader}
        onChange={onChange}
        searchDebounceMs={0}
      />,
    );
    openList();
    fireEvent.click(await screen.findByText("Item 3"));
    expect(onChange).toHaveBeenCalledWith(3);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument();
  });

  it("keeps groups when virtualized", () => {
    const options = BIG.slice(0, 300).map((option, index) => ({
      ...option,
      group: index < 150 ? "Norte" : "Sur",
    }));
    render(<CnAutocompleteField label="Zona" options={options} />);
    openList();
    expect(screen.getByText("Norte")).toBeInTheDocument();
  });
});

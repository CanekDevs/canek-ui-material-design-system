import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { CnForm } from "../components/CnForm/CnForm";
import type { CnFormField, CnFormHandle } from "../components/CnForm/CnForm.types";

const CLIENTS = Array.from({ length: 5000 }, (_, index) => ({
  value: index + 1,
  label: `Cliente ${index + 1}`,
}));

const server = () =>
  vi.fn(async ({ input, page, pageSize }: { input: string; page: number; pageSize: number }) => {
    const matches = CLIENTS.filter((row) => row.label.includes(input));
    return {
      options: matches.slice(page * pageSize, (page + 1) * pageSize),
      hasMore: (page + 1) * pageSize < matches.length,
      total: matches.length,
    };
  });

const resolver = () =>
  vi.fn(async (values: Array<string | number>) =>
    values.map((value) => ({ value, label: `Cliente ${value}` })),
  );

describe("CnForm · listas grandes", () => {
  it("select with pageSize searches and pages on the server", async () => {
    const loadOptions = server();
    const ref = createRef<CnFormHandle>();
    const fields: CnFormField[] = [
      { name: "client", type: "select", label: "Cliente", loadOptions, pageSize: 25 },
    ];
    render(<CnForm formRef={ref} fields={fields} onSubmit={() => {}} />);
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /Cliente/ }));
    const listbox = await screen.findByRole("listbox");
    await within(listbox).findByText("Cliente 1");
    expect(loadOptions).toHaveBeenCalledWith(
      expect.objectContaining({ page: 0, pageSize: 25, formValues: expect.any(Object) }),
    );
    expect(screen.getByText("Mostrando 25 de 5,000")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "Cliente 4321" } });
    fireEvent.click(await within(listbox).findByText("Cliente 4321"));
    expect(ref.current?.getValues().client).toBe(4321);
  });

  it("detects paginated loaders on select without extra config", async () => {
    const loadOptions = server();
    const fields: CnFormField[] = [
      { name: "client", type: "select", label: "Cliente", loadOptions },
    ];
    render(<CnForm fields={fields} onSubmit={() => {}} />);
    await waitFor(() => expect(loadOptions).toHaveBeenCalled());
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /Cliente/ }));
    expect(await screen.findByLabelText("Buscar")).toBeInTheDocument();
    expect(await screen.findByText("Mostrando 50 de 5,000")).toBeInTheDocument();
  });

  it("edit forms resolve preselected ids without loading the whole list", async () => {
    const loadOptions = server();
    const resolveOptions = resolver();
    const fields: CnFormField[] = [
      { name: "owner", type: "select", label: "Responsable", loadOptions, resolveOptions },
      {
        name: "watchers",
        type: "autocomplete",
        label: "Observadores",
        multiple: true,
        loadOptions,
        resolveOptions,
      },
    ];
    render(
      <CnForm
        fields={fields}
        defaultValues={{ owner: 4999, watchers: [1200, 3300] }}
        onSubmit={() => {}}
      />,
    );
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /Responsable/ })).toHaveTextContent(
        "Cliente 4999",
      ),
    );
    expect(await screen.findByText("Cliente 1200")).toBeInTheDocument();
    expect(screen.getByText("Cliente 3300")).toBeInTheDocument();
    expect(loadOptions).not.toHaveBeenCalled();
    expect(resolveOptions).toHaveBeenCalledWith(
      [4999],
      expect.objectContaining({ formValues: expect.any(Object) }),
    );
  });

  it("falls back to getOptionLabel for unresolved values", () => {
    const fields: CnFormField[] = [
      {
        name: "client",
        type: "autocomplete",
        label: "Cliente",
        loadOptions: server(),
        getOptionLabel: (option) => `#${option.value}`,
      },
    ];
    render(<CnForm fields={fields} defaultValues={{ client: 77 }} onSubmit={() => {}} />);
    expect(screen.getByRole("combobox", { name: /Cliente/ })).toHaveValue("#77");
  });

  it("passes virtualize and maxResults to static lists", () => {
    const fields: CnFormField[] = [
      { name: "a", type: "select", label: "Grande", options: CLIENTS },
      {
        name: "b",
        type: "select",
        label: "Sin virtualizar",
        options: CLIENTS.slice(0, 150),
        virtualize: false,
      },
      { name: "c", type: "autocomplete", label: "Limitado", options: CLIENTS, maxResults: 30 },
    ];
    render(<CnForm fields={fields} onSubmit={() => {}} />);
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /Grande/ }));
    expect(within(screen.getByRole("listbox")).getAllByRole("option").length).toBeLessThan(40);
    fireEvent.keyDown(screen.getByLabelText("Buscar"), { key: "Escape" });

    fireEvent.mouseDown(screen.getByRole("combobox", { name: /Sin virtualizar/ }));
    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(150);
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });

    const input = screen.getByRole("combobox", { name: /Limitado/ });
    act(() => input.focus());
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getByText("4,970 más, refina tu búsqueda")).toBeInTheDocument();
  });

  it("transferlist pages on the server when pageSize is set", async () => {
    const loadOptions = server();
    const resolveOptions = resolver();
    const fields: CnFormField[] = [
      {
        name: "members",
        type: "transferlist",
        label: "Integrantes",
        loadOptions,
        resolveOptions,
        pageSize: 40,
      },
    ];
    render(<CnForm fields={fields} defaultValues={{ members: [4500] }} onSubmit={() => {}} />);
    expect(await screen.findByText("Cliente 4500")).toBeInTheDocument();
    expect(await screen.findByText("Mostrando 40 de 5,000")).toBeInTheDocument();
    expect(loadOptions).toHaveBeenCalledWith(expect.objectContaining({ pageSize: 40, page: 0 }));
  });

  it("treeselect accepts virtualize", () => {
    const options = Array.from({ length: 300 }, (_, index) => ({
      value: index,
      label: `Nodo ${index}`,
    }));
    const fields: CnFormField[] = [
      { name: "node", type: "treeselect", label: "Nodo", options, virtualize: 50 },
    ];
    render(<CnForm fields={fields} onSubmit={() => {}} />);
    fireEvent.click(screen.getByRole("combobox", { name: /Nodo/ }));
    expect(within(screen.getByRole("tree")).getAllByRole("treeitem").length).toBeLessThan(40);
  });
});

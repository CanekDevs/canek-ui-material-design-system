import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CnLoadOptionsContext } from "../../utils/use-async-options";
import type { CnFieldOption } from "../CnForm/CnForm.types";
import { CnSelectField } from "./CnSelectField";

const many = (count: number, prefix = "Opción"): CnFieldOption[] =>
  Array.from({ length: count }, (_, index) => ({ value: index, label: `${prefix} ${index}` }));

const BIG = many(10_000);

const openMenu = () => fireEvent.mouseDown(screen.getByRole("combobox"));
const listbox = () => screen.getByRole("listbox");
const search = () => screen.getByLabelText("Buscar");

describe("CnSelectField · listas grandes", () => {
  it("opens a virtualized menu that renders only a window", () => {
    render(<CnSelectField label="Opción" options={BIG} />);
    openMenu();
    const options = within(listbox()).getAllByRole("option");
    expect(options.length).toBeLessThan(40);
    expect(options[0]).toHaveAttribute("aria-setsize", "10000");
    expect(search()).toHaveFocus();
  });

  it("keeps the MUI menu for short lists", () => {
    render(<CnSelectField label="Opción" options={many(10)} />);
    openMenu();
    expect(screen.queryByLabelText("Buscar")).not.toBeInTheDocument();
    expect(within(listbox()).getAllByRole("option")).toHaveLength(10);
  });

  it("reaches far items with the keyboard and selects them", () => {
    const onChange = vi.fn();
    render(<CnSelectField label="Opción" options={BIG} onChange={onChange} />);
    openMenu();
    fireEvent.keyDown(search(), { key: "End", ctrlKey: true });
    const active = search().getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
    expect(document.getElementById(active as string)).toHaveTextContent("Opción 9999");
    fireEvent.keyDown(search(), { key: "ArrowUp" });
    fireEvent.keyDown(search(), { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(9998);
  });

  it("navigates without a search box using type-ahead", () => {
    const onChange = vi.fn();
    const options = [...many(200), { value: "z", label: "Zacatecas" }];
    render(
      <CnSelectField label="Estado" options={options} searchable={false} onChange={onChange} />,
    );
    openMenu();
    const list = listbox();
    expect(list).toHaveFocus();
    fireEvent.keyDown(list, { key: "z" });
    fireEvent.keyDown(list, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("z");
  });

  it("filters ignoring accents and caps rendered results with maxResults", () => {
    const options = [...many(300, "Ciudad"), { value: "m", label: "Mérida" }];
    render(<CnSelectField label="Ciudad" options={options} maxResults={20} />);
    openMenu();
    fireEvent.change(search(), { target: { value: "ciudad" } });
    expect(within(listbox()).getAllByRole("option")[0]).toHaveAttribute("aria-setsize", "20");
    expect(screen.getByText("280 más, refina tu búsqueda")).toBeInTheDocument();
    fireEvent.change(search(), { target: { value: "MERIDA" } });
    expect(within(listbox()).getByText("Mérida")).toBeInTheDocument();
  });

  it("keeps groups, checkmarks and select-all with multiple", () => {
    const onChange = vi.fn();
    const options = many(300).map((option, index) => ({
      ...option,
      group: index < 150 ? "Norte" : "Sur",
    }));
    render(
      <CnSelectField
        label="Varios"
        options={options}
        multiple
        selectAll
        value={[1]}
        onChange={onChange}
      />,
    );
    openMenu();
    expect(within(listbox()).getByText("Norte")).toBeInTheDocument();
    expect(within(listbox()).getByRole("option", { name: /Opción 1$/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.change(search(), { target: { value: "opción 29" } });
    fireEvent.click(within(listbox()).getByText("Seleccionar todo"));
    // Todas las coincidencias (no solo las pintadas), sin repetir el 1 ya elegido.
    const matches = options.filter((o) => o.label.includes("29")).map((o) => o.value);
    expect(onChange).toHaveBeenLastCalledWith([1, ...matches]);
  });

  it("supports select-all in the regular MUI menu", () => {
    const onChange = vi.fn();
    render(
      <CnSelectField label="Varios" options={many(3)} multiple selectAll onChange={onChange} />,
    );
    openMenu();
    fireEvent.click(within(listbox()).getByText("Seleccionar todo"));
    expect(onChange).toHaveBeenLastCalledWith([0, 1, 2]);
  });

  it("pages remote options with infinite scroll and shows the total", async () => {
    const server = vi.fn(async ({ input, page, pageSize }: CnLoadOptionsContext) => {
      const matches = many(130, "Cliente").filter((row) => row.label.includes(input));
      return {
        options: matches.slice(page * pageSize, (page + 1) * pageSize),
        hasMore: (page + 1) * pageSize < matches.length,
        total: matches.length,
      };
    });
    render(<CnSelectField label="Cliente" loadOptions={server} searchDebounceMs={0} />);
    openMenu();
    await within(listbox()).findByText("Cliente 0");
    expect(screen.getByText("Mostrando 50 de 130")).toBeInTheDocument();
    act(() => {
      listbox().scrollTop = 50 * 36 - 300;
      fireEvent.scroll(listbox());
    });
    await screen.findByText("Mostrando 100 de 130");
    expect(server).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, pageSize: 50 }));

    fireEvent.change(search(), { target: { value: "Cliente 12" } });
    await waitFor(() =>
      expect(server).toHaveBeenLastCalledWith(
        expect.objectContaining({ input: "Cliente 12", page: 0 }),
      ),
    );
    await within(listbox()).findByText("Cliente 120");
  });

  it("shows the label of a preselected value through resolveOptions", async () => {
    const server = vi.fn(async () => ({
      options: many(50, "Cliente"),
      hasMore: true,
      total: 9000,
    }));
    const resolveOptions = vi.fn(async (values: Array<string | number>) =>
      values.map((value) => ({ value, label: `Cliente ${value}` })),
    );
    render(
      <CnSelectField
        label="Cliente"
        loadOptions={server}
        resolveOptions={resolveOptions}
        value={8765}
        onChange={() => {}}
      />,
    );
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveTextContent("Cliente 8765"));
    expect(server).not.toHaveBeenCalled();
  });
});

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CnLoadOptionsContext } from "../../utils/use-async-options";
import type { CnFieldOption } from "../CnForm/CnForm.types";
import { CnTransferListField } from "./CnTransferListField";

const many = (count: number, prefix = "Usuario"): CnFieldOption[] =>
  Array.from({ length: count }, (_, index) => ({ value: index, label: `${prefix} ${index}` }));

const panes = () => screen.getAllByRole("listbox");

describe("CnTransferListField · listas grandes", () => {
  it("virtualizes both lists", () => {
    const values = Array.from({ length: 2000 }, (_, index) => index);
    render(<CnTransferListField label="Usuarios" options={many(5000)} defaultValue={values} />);
    const [available, selected] = panes();
    expect(within(available).getAllByRole("option").length).toBeLessThan(40);
    expect(within(selected).getAllByRole("option").length).toBeLessThan(40);
    expect(within(available).getAllByRole("option")[0]).toHaveAttribute("aria-setsize", "3000");
  });

  it("moves the keyboard focus to far rows (End) and transfers with Enter", () => {
    const onChange = vi.fn();
    render(<CnTransferListField label="Usuarios" options={many(5000)} onChange={onChange} />);
    const [available] = panes();
    const first = within(available).getAllByRole("option")[0];
    expect(first).toHaveAttribute("tabindex", "0");
    first.focus();
    fireEvent.keyDown(first, { key: "End" });
    expect(document.activeElement).toHaveTextContent("Usuario 4999");
    fireEvent.keyDown(document.activeElement as Element, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith([4999]);
  });

  it("loads available items from the server and resolves preselected ones", async () => {
    const server = vi.fn(async ({ input, page, pageSize }: CnLoadOptionsContext) => {
      const matches = many(3000).filter((row) => row.label.includes(input));
      return {
        options: matches.slice(page * pageSize, (page + 1) * pageSize),
        hasMore: (page + 1) * pageSize < matches.length,
        total: matches.length,
      };
    });
    const resolveOptions = vi.fn(async (values: Array<string | number>) =>
      values.map((value) => ({ value, label: `Usuario ${value}` })),
    );
    const onChange = vi.fn();
    render(
      <CnTransferListField
        label="Usuarios"
        loadOptions={server}
        resolveOptions={resolveOptions}
        searchDebounceMs={0}
        defaultValue={[2500]}
        onChange={onChange}
      />,
    );
    const [available, selected] = panes();
    expect(await within(selected).findByText("Usuario 2500")).toBeInTheDocument();
    expect(await within(available).findByText("Usuario 0")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 50 de 3,000")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Buscar en Disponibles"), {
      target: { value: "Usuario 1234" },
    });
    await waitFor(() =>
      expect(server).toHaveBeenLastCalledWith(expect.objectContaining({ input: "Usuario 1234" })),
    );
    fireEvent.doubleClick(await within(available).findByText("Usuario 1234"));
    expect(onChange).toHaveBeenLastCalledWith([2500, 1234]);
  });
});

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CnToastApi } from "./CnToast";
import { CnToastProvider, describeError, useToast } from "./CnToast";

let api: CnToastApi;
const Capture = () => {
  api = useToast();
  return null;
};
const setup = (props = {}) =>
  render(
    <CnToastProvider {...props}>
      <Capture />
    </CnToastProvider>,
  );

describe("CnToast", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows and auto-dismisses a success toast", () => {
    setup();
    act(() => {
      api.success("Cliente guardado");
    });
    expect(screen.getByText("Cliente guardado")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(5100);
    });
    expect(screen.queryByText("Cliente guardado")).toBeNull();
  });

  it("parses API errors with field details", () => {
    setup();
    act(() => {
      api.error({
        response: { data: { message: "Datos inválidos", errors: { rfc: ["RFC repetido"] } } },
      });
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Datos inválidos");
    expect(screen.getByText("Rfc: RFC repetido")).toBeInTheDocument();
  });

  it("runs the action and respects max", () => {
    setup({ max: 2 });
    const undo = vi.fn();
    act(() => {
      api.info("uno");
      api.info("dos");
      api({ severity: "warning", message: "tres", action: { label: "Deshacer", onClick: undo } });
    });
    expect(screen.queryByText("uno")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Deshacer" }));
    expect(undo).toHaveBeenCalled();
    expect(screen.queryByText("tres")).toBeNull();
  });

  it("turns a promise into loading then success", async () => {
    setup();
    let resolve: (v: number) => void = () => {};
    const promise = new Promise<number>((r) => {
      resolve = r;
    });
    act(() => {
      void api.promise(promise, { loading: "Subiendo…", success: (n) => `${n} archivos` });
    });
    expect(screen.getByText("Subiendo…")).toBeInTheDocument();
    await act(async () => {
      resolve(3);
      await promise;
    });
    expect(screen.getByText("3 archivos")).toBeInTheDocument();
  });

  it("describes plain errors", () => {
    expect(describeError(new Error("boom"))).toEqual({ message: "boom", details: [] });
  });
});

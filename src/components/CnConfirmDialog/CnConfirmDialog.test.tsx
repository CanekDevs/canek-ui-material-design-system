import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CnConfirmDialog, CnConfirmProvider, useConfirm } from "./CnConfirmDialog";

describe("CnConfirmDialog", () => {
  it("uses the variant preset and closes after a sync confirm", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<CnConfirmDialog open variant="delete" onConfirm={onConfirm} onClose={onClose} />);
    expect(screen.getByRole("alertdialog", { name: "¿Eliminar registro?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("waits for async confirmations and shows server errors", async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn(() =>
      Promise.reject({ response: { data: { message: "Tiene facturas asociadas" } } }),
    );
    render(<CnConfirmDialog open variant="delete" onConfirm={onConfirm} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(await screen.findByText("Tiene facturas asociadas")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("requires typing the confirmation text", () => {
    const onConfirm = vi.fn();
    render(
      <CnConfirmDialog
        open
        variant="delete"
        requireText="ACME"
        onConfirm={onConfirm}
        onClose={() => {}}
      />,
    );
    const button = screen.getByRole("button", { name: "Eliminar" });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Escribe "ACME"/), { target: { value: "ACME" } });
    expect(button).not.toBeDisabled();
  });
});

describe("useConfirm", () => {
  const Demo = ({ onResult }: { onResult: (value: boolean) => void }) => {
    const confirm = useConfirm();
    const [busy, setBusy] = useState(false);
    return (
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          onResult(await confirm({ variant: "warning", title: "¿Seguro?" }));
          setBusy(false);
        }}
      >
        abrir
      </button>
    );
  };

  it("resolves true on confirm and false on cancel", async () => {
    const onResult = vi.fn();
    render(
      <CnConfirmProvider>
        <Demo onResult={onResult} />
      </CnConfirmProvider>,
    );
    fireEvent.click(screen.getByText("abrir"));
    fireEvent.click(await screen.findByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith(true));

    fireEvent.click(screen.getByText("abrir"));
    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    });
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith(false));
  });
});

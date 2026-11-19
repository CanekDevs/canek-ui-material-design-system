import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CnDialog } from "./CnDialog";
import { CnDialogSkeleton } from "./CnDialogSkeleton";
import { CnDialogProvider, useDialog } from "./useDialog";

describe("CnDialog", () => {
  it("renders an accessible dialog with title, subtitle and body", () => {
    render(
      <CnDialog open title="Editar cliente" subtitle="Acme S.A. de C.V." icon="edit">
        <p>Contenido</p>
      </CnDialog>,
    );
    const dialog = screen.getByRole("dialog", { name: "Editar cliente" });
    expect(dialog).toHaveAccessibleDescription("Acme S.A. de C.V.");
    expect(within(dialog).getByText("Contenido")).toBeInTheDocument();
    expect(dialog.querySelector("[data-cn-overlay-icon]")).not.toBeNull();
  });

  it("reports close reasons for the close button and Escape", () => {
    const onClose = vi.fn();
    render(<CnDialog open title="Detalle" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenLastCalledWith("closeButton");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenLastCalledWith("escapeKeyDown");
  });

  it("ignores backdrop clicks with disableBackdropClose", () => {
    const onClose = vi.fn();
    render(<CnDialog open title="Detalle" onClose={onClose} disableBackdropClose />);
    const backdrop = document.querySelector(".MuiBackdrop-root") as HTMLElement;
    fireEvent.mouseDown(backdrop);
    fireEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("asks before discarding unsaved changes", async () => {
    const onClose = vi.fn();
    render(<CnDialog open dirty title="Nuevo producto" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    const confirm = await screen.findByRole("alertdialog", { name: "¿Descartar cambios?" });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(within(confirm).getByRole("button", { name: "Seguir editando" }));
    expect(onClose).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    const again = await screen.findByRole("alertdialog", { name: "¿Descartar cambios?" });
    fireEvent.click(within(again).getByRole("button", { name: "Descartar" }));
    expect(onClose).toHaveBeenCalledWith("closeButton");
  });

  it("closes without confirmation when discardConfirm is false", () => {
    const onClose = vi.fn();
    render(<CnDialog open dirty discardConfirm={false} title="X" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalledWith("closeButton");
  });

  it("lets onBeforeClose cancel the close", async () => {
    const onClose = vi.fn();
    render(<CnDialog open title="X" onClose={onClose} onBeforeClose={() => false} />);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    await act(async () => {});
    expect(onClose).not.toHaveBeenCalled();
  });

  it("runs async actions with loading, blocks others and closes on success", async () => {
    const onClose = vi.fn();
    let resolve!: () => void;
    const onSave = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(
      <CnDialog
        open
        dirty
        title="Editar"
        onClose={onClose}
        actions={[
          { label: "Cancelar", variant: "secondary", closes: true },
          { label: "Guardar", variant: "primary", onClick: onSave, closes: true },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onSave).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button", { name: /Cancelar/ })).toBeDisabled());
    await act(async () => resolve());
    // El guardado no pide confirmar aunque el formulario siga "sucio".
    await waitFor(() => expect(onClose).toHaveBeenCalledWith("action"));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("routes cancel actions through the discard confirmation", async () => {
    const onClose = vi.fn();
    render(
      <CnDialog
        open
        dirty
        title="Editar"
        onClose={onClose}
        actions={[{ label: "Cancelar", variant: "secondary", closes: true }]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows action errors (server shape) and stays open", async () => {
    const onClose = vi.fn();
    render(
      <CnDialog
        open
        title="Editar"
        onClose={onClose}
        actions={[
          {
            label: "Guardar",
            variant: "primary",
            closes: true,
            onClick: () => Promise.reject({ response: { data: { message: "RFC duplicado" } } }),
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("RFC duplicado")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("submits as a form with a submit action", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    const onClose = vi.fn();
    render(
      <CnDialog
        open
        title="Alta"
        onClose={onClose}
        onSubmit={onSubmit}
        closeOnSubmit
        actions={[{ label: "Crear", variant: "primary", type: "submit" }]}
      >
        <input aria-label="Nombre" />
      </CnDialog>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Crear" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    await waitFor(() => expect(onClose).toHaveBeenCalledWith("action"));
  });

  it("keeps the header while the body loads and shows a full skeleton", () => {
    const { rerender } = render(<CnDialog open loading title="Factura A-1024" />);
    expect(screen.getByRole("dialog", { name: "Factura A-1024" })).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Cargando contenido del diálogo" }),
    ).toBeInTheDocument();
    rerender(<CnDialog open skeleton title="Factura A-1024" actions={[{ label: "Ok" }]} />);
    expect(screen.getByRole("status", { name: "Cargando diálogo" })).toBeInTheDocument();
    expect(screen.queryByText("Factura A-1024")).not.toBeInTheDocument();
  });

  it("uses size tokens and full screen", () => {
    const { rerender } = render(<CnDialog open size="lg" title="Grande" />);
    expect(document.querySelector('[data-cn-dialog="lg"]')).not.toBeNull();
    rerender(<CnDialog open size="fullscreen" title="Completa" />);
    expect(document.querySelector("[data-fullscreen]")).not.toBeNull();
  });

  it("focuses the first field when requested", async () => {
    render(
      <CnDialog open title="Alta" initialFocus="first-field">
        <input aria-label="Nombre" />
      </CnDialog>,
    );
    await waitFor(() => expect(screen.getByLabelText("Nombre")).toHaveFocus());
  });

  it("renders extreme content without crashing (long title, long words)", () => {
    const long = "Nombre-de-archivo-muy-largo-sin-espacios_".repeat(6);
    render(
      <CnDialog
        open
        title={long}
        subtitle="correo.extremadamente.largo.para.probar@dominio-muy-largo.com.mx"
        actions={[
          { label: "Una acción con etiqueta bastante larga", variant: "secondary" },
          { label: "Guardar", variant: "primary" },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { name: long })).toBeInTheDocument();
  });

  it("supports stacked dialogs", () => {
    const Stack = () => {
      const [second, setSecond] = useState(false);
      return (
        <CnDialog
          open
          title="Primero"
          actions={[{ label: "Abrir otro", onClick: () => setSecond(true) }]}
        >
          <CnDialog open={second} title="Segundo" onClose={() => setSecond(false)} />
        </CnDialog>
      );
    };
    render(<Stack />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir otro" }));
    expect(screen.getByRole("dialog", { name: "Segundo" })).toBeInTheDocument();
  });
});

describe("CnDialogSkeleton", () => {
  it("renders header, fields and actions", () => {
    const { container } = render(<CnDialogSkeleton icon fields={2} actions={2} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(container.querySelector("[data-cn-dialog-skeleton-header]")).not.toBeNull();
    expect(container.querySelector("[data-cn-dialog-skeleton-footer]")).not.toBeNull();
  });
});

describe("useDialog", () => {
  it("opens imperatively and resolves with the action value", async () => {
    let result: string | undefined | null = null;
    const Opener = () => {
      const dialog = useDialog();
      return (
        <button
          onClick={async () => {
            result = await dialog.open<string>({
              title: "Elige formato",
              content: "¿Cómo exportar?",
              actions: [
                { label: "CSV", value: "csv" },
                { label: "Excel", variant: "primary", value: "xlsx" },
              ],
            });
          }}
        >
          Exportar
        </button>
      );
    };
    render(
      <CnDialogProvider>
        <Opener />
      </CnDialogProvider>,
    );
    fireEvent.click(screen.getByText("Exportar"));
    fireEvent.click(await screen.findByRole("button", { name: "Excel" }));
    await waitFor(() => expect(result).toBe("xlsx"));
  });

  it("resolves undefined when closed and supports update()", async () => {
    let result: unknown = "pending";
    const Opener = () => {
      const dialog = useDialog();
      return (
        <button
          onClick={async () => {
            const promise = dialog.open({ id: "d1", title: "Cargando…", loading: true });
            dialog.update("d1", { title: "Detalle", loading: false, content: "Listo" });
            result = await promise;
          }}
        >
          Abrir
        </button>
      );
    };
    render(
      <CnDialogProvider>
        <Opener />
      </CnDialogProvider>,
    );
    fireEvent.click(screen.getByText("Abrir"));
    expect(await screen.findByText("Listo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    await waitFor(() => expect(result).toBeUndefined());
  });

  it("throws outside the provider", () => {
    const Bad = () => {
      useDialog();
      return null;
    };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Bad />)).toThrow(/CnDialogProvider/);
    spy.mockRestore();
  });
});

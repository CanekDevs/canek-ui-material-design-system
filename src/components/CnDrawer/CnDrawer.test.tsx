import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CnDrawer } from "./CnDrawer";
import { CnDrawerSkeleton } from "./CnDrawerSkeleton";

describe("CnDrawer", () => {
  it("renders a temporary drawer as a labelled modal dialog", () => {
    render(
      <CnDrawer open title="Detalle del log" subtitle="ID #128" icon="history">
        Cuerpo
      </CnDrawer>,
    );
    const dialog = screen.getByRole("dialog", { name: "Detalle del log" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByText("Cuerpo")).toBeInTheDocument();
  });

  it("closes with reasons and asks before discarding dirty changes", async () => {
    const onClose = vi.fn();
    const { rerender } = render(<CnDrawer open title="Editar" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenLastCalledWith("closeButton");

    rerender(<CnDrawer open dirty title="Editar" onClose={onClose} />);
    onClose.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    const confirm = await screen.findByRole("alertdialog", { name: "¿Descartar cambios?" });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(within(confirm).getByRole("button", { name: "Descartar" }));
    expect(onClose).toHaveBeenCalledWith("closeButton");
  });

  it("applies size tokens and the anchor", () => {
    render(<CnDrawer open anchor="left" size="lg" title="Izquierda" />);
    expect(
      document.querySelector('[data-cn-drawer="temporary"][data-anchor="left"]'),
    ).not.toBeNull();
  });

  it("resizes with the keyboard and reports the new size", () => {
    const onResize = vi.fn();
    render(
      <CnDrawer
        open
        variant="persistent"
        resizable
        size={400}
        minSize={300}
        onResize={onResize}
        title="Panel"
      />,
    );
    const handle = screen.getByRole("separator", { name: "Cambiar tamaño del panel" });
    expect(handle).toHaveAttribute("aria-orientation", "vertical");
    // jsdom no mide: parte del tamaño actual (400) y crece 16 px.
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(onResize).toHaveBeenLastCalledWith(expect.any(Number));
    fireEvent.keyDown(handle, { key: "Home" });
    expect(onResize).toHaveBeenLastCalledWith(300);
  });

  it("renders persistent drawers in the page flow and hides content when closed", () => {
    const { rerender, container } = render(
      <CnDrawer open variant="persistent" title="Filtros">
        Contenido
      </CnDrawer>,
    );
    const aside = container.querySelector("aside")!;
    expect(aside).toHaveAttribute("data-open");
    expect(screen.getByText("Contenido")).toBeInTheDocument();
    rerender(
      <CnDrawer open={false} variant="persistent" title="Filtros">
        Contenido
      </CnDrawer>,
    );
    expect(screen.queryByText("Contenido")).not.toBeInTheDocument();
  });

  it("collapses to a mini strip with an expand button", () => {
    const Mini = () => {
      const [open, setOpen] = useState(true);
      return (
        <CnDrawer
          open={open}
          variant="mini"
          anchor="left"
          icon="tune"
          title="Filtros"
          onClose={() => setOpen(false)}
          onOpen={() => setOpen(true)}
        >
          Contenido
        </CnDrawer>
      );
    };
    render(<Mini />);
    fireEvent.click(screen.getByRole("button", { name: "Contraer panel" }));
    const expand = screen.getByRole("button", { name: "Expandir Filtros" });
    expect(expand).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(expand);
    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });

  it("closes persistent drawers with Escape", () => {
    const onClose = vi.fn();
    render(
      <CnDrawer open variant="persistent" title="Panel" onClose={onClose}>
        <button>Dentro</button>
      </CnDrawer>,
    );
    fireEvent.keyDown(screen.getByText("Dentro"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledWith("escapeKeyDown");
  });

  it("shows a back button for nested drawers", () => {
    const onBack = vi.fn();
    render(<CnDrawer open title="Subnivel" onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Regresar" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("supports stacked (nested) temporary drawers", () => {
    const Nested = () => {
      const [inner, setInner] = useState(false);
      return (
        <CnDrawer
          open
          title="Pedido"
          actions={[{ label: "Ver cliente", onClick: () => setInner(true) }]}
        >
          <CnDrawer open={inner} size="sm" title="Cliente" onBack={() => setInner(false)} />
        </CnDrawer>
      );
    };
    render(<Nested />);
    fireEvent.click(screen.getByRole("button", { name: "Ver cliente" }));
    expect(screen.getByRole("dialog", { name: "Cliente" })).toBeInTheDocument();
  });

  it("runs async footer actions and closes on success", async () => {
    const onClose = vi.fn();
    render(
      <CnDrawer
        open
        title="Editar"
        onClose={onClose}
        actions={[
          { label: "Guardar", variant: "primary", closes: true, onClick: () => Promise.resolve() },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledWith("action"));
  });

  it("shows loading and full skeleton states", () => {
    const { rerender } = render(<CnDrawer open loading title="Detalle" />);
    expect(
      screen.getByRole("status", { name: "Cargando contenido del panel" }),
    ).toBeInTheDocument();
    rerender(<CnDrawer open skeleton title="Detalle" />);
    expect(screen.getByRole("status", { name: "Cargando panel" })).toBeInTheDocument();
  });
});

describe("CnDrawerSkeleton", () => {
  it("renders as a status", () => {
    render(<CnDrawerSkeleton />);
    expect(screen.getByRole("status", { name: "Cargando panel" })).toBeInTheDocument();
  });
});

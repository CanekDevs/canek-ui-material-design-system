import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CnDescriptionList } from "./CnDescriptionList";
import { CnDescriptionListSkeleton } from "./CnDescriptionListSkeleton";

const ITEMS = [
  {
    label: "Correo",
    value: "ana@empresa.mx",
    href: "mailto:ana@empresa.mx",
    copyValue: "ana@empresa.mx",
  },
  { label: "Teléfono", value: "55 1234 5678" },
  { label: "RFC", value: "" },
];

describe("CnDescriptionList", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText } });
  });

  afterEach(() => {
    writeText.mockClear();
    vi.useRealTimers();
  });

  it("pinta una lista de descripción con términos y definiciones", () => {
    const { container } = render(<CnDescriptionList items={ITEMS} ariaLabel="Contacto" />);
    const dl = container.querySelector("dl");
    expect(dl).toHaveAttribute("aria-label", "Contacto");
    expect(container.querySelectorAll("dt")).toHaveLength(3);
    expect(container.querySelectorAll("dd")).toHaveLength(3);
    expect(screen.getByText("Teléfono")).toBeInTheDocument();
  });

  it("muestra el título como encabezado con el nivel pedido", () => {
    render(<CnDescriptionList items={ITEMS} title="Datos" headingLevel={2} />);
    expect(screen.getByRole("heading", { level: 2, name: "Datos" })).toBeInTheDocument();
  });

  it("los valores vacíos muestran el texto de vacío y no ofrecen copiar", () => {
    render(
      <CnDescriptionList
        items={[{ label: "RFC", value: "", copyValue: "X" }]}
        emptyValue="Sin capturar"
      />,
    );
    expect(screen.getByText("Sin capturar")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("convierte el valor en enlace cuando hay href", () => {
    render(<CnDescriptionList items={ITEMS} />);
    expect(screen.getByRole("link", { name: "ana@empresa.mx" })).toHaveAttribute(
      "href",
      "mailto:ana@empresa.mx",
    );
  });

  it("copia el valor con el botón y avisa con onCopy", async () => {
    const onCopy = vi.fn();
    render(<CnDescriptionList items={ITEMS} onCopy={onCopy} />);
    const button = screen.getByRole("button", { name: "Copiar Correo" });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(writeText).toHaveBeenCalledWith("ana@empresa.mx");
    expect(onCopy).toHaveBeenCalledWith(expect.objectContaining({ label: "Correo" }));
    expect(screen.getByRole("button", { name: "Correo copiado" })).toBeInTheDocument();
  });

  it("el botón de copiar se activa con el teclado", async () => {
    render(<CnDescriptionList items={ITEMS} />);
    const button = screen.getByRole("button", { name: "Copiar Correo" });
    button.focus();
    expect(button).toHaveFocus();
    await act(async () => {
      fireEvent.click(button);
    });
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it("si el portapapeles falla no marca como copiado", async () => {
    writeText.mockRejectedValueOnce(new Error("denegado"));
    render(<CnDescriptionList items={ITEMS} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copiar Correo" }));
    });
    expect(screen.getByRole("button", { name: "Copiar Correo" })).toBeInTheDocument();
  });

  it("vuelve al estado normal después de copiar", async () => {
    vi.useFakeTimers();
    render(<CnDescriptionList items={ITEMS} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copiar Correo" }));
    });
    expect(screen.getByRole("button", { name: "Correo copiado" })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(screen.getByRole("button", { name: "Copiar Correo" })).toBeInTheDocument();
  });

  it("acepta una lista vacía y textos extremos", () => {
    const long = "x".repeat(300);
    const { container, rerender } = render(<CnDescriptionList items={[]} />);
    expect(container.querySelectorAll("dt")).toHaveLength(0);
    rerender(<CnDescriptionList items={[{ label: long, value: long }]} />);
    expect(screen.getAllByText(long)).toHaveLength(2);
  });

  it("con skeleton muestra un único estado de carga accesible", () => {
    render(<CnDescriptionList skeleton items={ITEMS} title="Datos" />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByText("Datos")).not.toBeInTheDocument();
  });
});

describe("CnDescriptionListSkeleton", () => {
  it("expone su nombre en data-cn-skeleton", () => {
    render(<CnDescriptionListSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "description-list");
  });
});

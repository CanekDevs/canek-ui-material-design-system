import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CnDocCard } from "./CnDocCard";
import { CnDocCardSkeleton } from "./CnDocCardSkeleton";
import { formatDocDate, getDocKind } from "./doc-utils";

afterEach(() => vi.restoreAllMocks());

describe("doc-utils", () => {
  it("detects the kind by mime and extension", () => {
    expect(getDocKind("contrato.pdf")).toBe("pdf");
    expect(getDocKind("reporte.XLSX")).toBe("spreadsheet");
    expect(getDocKind("deck.pptx")).toBe("presentation");
    expect(getDocKind("minuta.docx")).toBe("document");
    expect(getDocKind("foto", "image/png")).toBe("image");
    expect(getDocKind("clip.mov")).toBe("video");
    expect(getDocKind("nota.m4a")).toBe("audio");
    expect(getDocKind("backup.zip")).toBe("archive");
    expect(getDocKind("App.tsx")).toBe("code");
    expect(getDocKind("config.json")).toBe("code");
    expect(getDocKind("leeme.txt")).toBe("text");
    expect(getDocKind("archivo.bin")).toBe("other");
  });

  it("formats relative dates in Spanish", () => {
    const now = new Date(2026, 10, 19, 12, 0);
    expect(formatDocDate(new Date(2026, 10, 19, 11, 50), now)).toBe("hace 10 min");
    expect(formatDocDate(new Date(2026, 10, 19, 9, 0), now)).toBe("hace 3 h");
    expect(formatDocDate(new Date(2026, 10, 18, 12, 0), now)).toBe("ayer");
    expect(formatDocDate(new Date(2026, 10, 15, 12, 0), now)).toBe("hace 4 días");
    expect(formatDocDate(new Date(2026, 0, 5), now)).toMatch(/5 ene 2026/);
    expect(formatDocDate("no es fecha", now)).toBe("");
  });
});

describe("CnDocCard", () => {
  it("renders name, kind, size, version, status and tags", () => {
    const { container } = render(
      <CnDocCard
        name="Contrato marco 2026.pdf"
        size={2_400_000}
        version={3}
        status={{ label: "Aprobado", color: "success" }}
        tags={["Legal", "Clientes", "2026", "Firmado"]}
        maxTags={2}
        updatedBy="Ana López"
        formatDate={() => "hace 2 h"}
        updatedAt="2026-11-19T10:00:00"
      />,
    );
    expect(screen.getByRole("article", { name: "Contrato marco 2026.pdf" })).toBeInTheDocument();
    expect(container.querySelector('[data-cn-doc-thumb="pdf"]')).not.toBeNull();
    const meta = container.querySelector("[data-cn-doc-meta]") as HTMLElement;
    expect(meta).toHaveTextContent("2.3 MB");
    expect(meta).toHaveTextContent("hace 2 h");
    expect(meta).toHaveTextContent("por Ana López");
    expect(screen.getByText("v3")).toBeInTheDocument();
    expect(screen.getByText("Aprobado")).toBeInTheDocument();
    expect(screen.getByText("Legal")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("calls onPreview from the name and the preview button", () => {
    const onPreview = vi.fn();
    render(<CnDocCard name="Plan.docx" onPreview={onPreview} />);
    fireEvent.click(screen.getByRole("button", { name: "Plan.docx" }));
    fireEvent.click(screen.getByRole("button", { name: "Ver" }));
    expect(onPreview).toHaveBeenCalledTimes(2);
  });

  it("opens PDFs in a new tab and images in the viewer by default", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const { unmount } = render(<CnDocCard name="Manual.pdf" url="https://cdn.test/manual.pdf" />);
    fireEvent.click(screen.getByRole("button", { name: "Ver" }));
    expect(open).toHaveBeenCalledWith(
      "https://cdn.test/manual.pdf",
      "_blank",
      "noopener,noreferrer",
    );
    unmount();

    render(<CnDocCard name="Foto.jpg" url="https://cdn.test/foto.jpg" />);
    fireEvent.click(screen.getByRole("button", { name: "Ver" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("ignores unsafe URLs", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<CnDocCard name="x.pdf" url="javascript:alert(1)" />);
    expect(screen.queryByRole("button", { name: "Ver" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Descargar" })).not.toBeInTheDocument();
    expect(open).not.toHaveBeenCalled();
  });

  it("uses custom download and share handlers", () => {
    const onDownload = vi.fn();
    const onShare = vi.fn();
    render(<CnDocCard name="Reporte.xlsx" onDownload={onDownload} onShare={onShare} />);
    fireEvent.click(screen.getByRole("button", { name: "Descargar" }));
    fireEvent.click(screen.getByRole("button", { name: "Compartir" }));
    expect(onDownload).toHaveBeenCalled();
    expect(onShare).toHaveBeenCalled();
  });

  it("puts built-in and custom actions in the grid menu", () => {
    const onDelete = vi.fn();
    const onShare = vi.fn();
    const { container } = render(
      <CnDocCard
        layout="grid"
        name="Diseño.png"
        url="https://cdn.test/d.png"
        onShare={onShare}
        menuActions={[{ label: "Eliminar", icon: "delete", danger: true, onClick: onDelete }]}
      />,
    );
    expect(container.querySelector("[data-cn-doc-card='grid'] img")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Más acciones" }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getByText("Ver")).toBeInTheDocument();
    expect(within(menu).getByText("Descargar")).toBeInTheDocument();
    fireEvent.click(within(menu).getByText("Compartir"));
    expect(onShare).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Más acciones" }));
    fireEvent.click(within(screen.getByRole("menu")).getByText("Eliminar"));
    expect(onDelete).toHaveBeenCalled();
  });

  it("supports selection and drag handle", () => {
    const onSelectedChange = vi.fn();
    render(<CnDocCard name="Lista.csv" selectable draggable onSelectedChange={onSelectedChange} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Seleccionar Lista.csv" }));
    expect(onSelectedChange).toHaveBeenCalledWith(true);
    expect(screen.getByLabelText("Arrastrar para reordenar")).toBeInTheDocument();
  });

  it("shows upload progress with cancel and hides actions while busy", () => {
    const onCancel = vi.fn();
    render(
      <CnDocCard
        name="Video.mp4"
        url="https://cdn.test/v.mp4"
        upload={{ progress: 42, onCancel }}
      />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "42");
    expect(screen.getByText(/42 %/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Descargar" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar subida" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows the error state with retry", () => {
    const onRetry = vi.fn();
    render(<CnDocCard name="Roto.pdf" error onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo procesar el archivo");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("renders the compact layout", () => {
    const { container } = render(
      <CnDocCard layout="compact" name="script.py" size={1200} onDownload={() => undefined} />,
    );
    expect(container.querySelector('[data-cn-doc-card="compact"]')).not.toBeNull();
    expect(container.querySelector('[data-cn-doc-thumb="code"]')).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Ver" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descargar" })).toBeInTheDocument();
  });

  it("renders the skeleton via the skeleton prop", () => {
    render(<CnDocCard name="Archivo.pdf" layout="grid" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "doc-card");
    expect(screen.queryByText("Archivo.pdf")).not.toBeInTheDocument();
  });
});

describe("CnDocCardSkeleton", () => {
  it("follows the layout", () => {
    const { container, rerender } = render(<CnDocCardSkeleton layout="grid" tags={2} />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(container.querySelector("[data-cn-doc-skeleton-tags]")?.children).toHaveLength(2);
    rerender(<CnDocCardSkeleton layout="list" actions={3} />);
    expect(container.querySelector("[data-cn-doc-skeleton-actions]")?.children).toHaveLength(3);
  });
});

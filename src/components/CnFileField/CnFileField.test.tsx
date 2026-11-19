import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { CnFileField } from "./CnFileField";
import {
  checkImageConstraints,
  formatDuration,
  getFileKind,
  getSafeUrl,
  matchesAccept,
} from "../../utils/file-utils";

beforeAll(() => {
  if (!URL.createObjectURL) {
    Object.assign(URL, { createObjectURL: () => "blob:preview", revokeObjectURL: () => {} });
  }
});

const pdf = new File(["%PDF"], "contrato.pdf", { type: "application/pdf" });
const png = new File(["img"], "foto.png", { type: "image/png" });
const select = (files: File[]) =>
  fireEvent.change(screen.getByTestId("cn-file-input"), { target: { files } });

describe("file utils", () => {
  it("matches accept like the HTML attribute", () => {
    expect(matchesAccept(png, "image/*")).toBe(true);
    expect(matchesAccept(pdf, ".pdf,.doc")).toBe(true);
    expect(matchesAccept(pdf, "image/*")).toBe(false);
    expect(matchesAccept(pdf, undefined)).toBe(true);
  });

  it("blocks dangerous URLs", () => {
    expect(getSafeUrl("javascript:alert(1)")).toBeUndefined();
    expect(getSafeUrl("data:text/html,<script>")).toBeUndefined();
    expect(getSafeUrl("//evil.com/x")).toBeUndefined();
    expect(getSafeUrl("https://cdn.canek.mx/a.png")).toBe("https://cdn.canek.mx/a.png");
    expect(getSafeUrl("/uploads/a.png")).toBe("/uploads/a.png");
  });
});

describe("CnFileField", () => {
  it("adds accepted files", () => {
    const onChange = vi.fn();
    render(<CnFileField label="Documento" accept=".pdf" onChange={onChange} />);
    select([pdf]);
    expect(onChange).toHaveBeenCalledWith([pdf]);
  });

  it("rejects files by type and size with a message", () => {
    const onChange = vi.fn();
    const big = new File([new Uint8Array(2 * 1024 * 1024)], "grande.pdf", {
      type: "application/pdf",
    });
    render(
      <CnFileField label="Documento" accept=".pdf" maxSize={1} multiple onChange={onChange} />,
    );
    select([png, big]);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("foto.png: tipo de archivo no permitido");
    expect(screen.getByRole("alert")).toHaveTextContent("grande.pdf: supera el máximo de 1 MB");
  });

  it("enforces maxFiles", () => {
    const onChange = vi.fn();
    render(<CnFileField label="Fotos" multiple maxFiles={1} onChange={onChange} />);
    select([pdf, png]);
    expect(onChange).toHaveBeenCalledWith([pdf]);
    expect(screen.getByRole("alert")).toHaveTextContent("máximo de 1 archivo");
  });

  it("lists existing files with safe links and removes them", () => {
    const onChange = vi.fn();
    const onRemoveExisting = vi.fn();
    const existing = {
      id: 9,
      url: "https://cdn.canek.mx/acta.docx",
      name: "acta.docx",
      size: 2048,
    };
    render(
      <CnFileField
        label="Docs"
        multiple
        value={[existing]}
        onChange={onChange}
        onRemoveExisting={onRemoveExisting}
      />,
    );
    expect(screen.getByRole("link", { name: "acta.docx" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    fireEvent.click(screen.getByRole("button", { name: "Quitar acta.docx" }));
    expect(onRemoveExisting).toHaveBeenCalledWith(existing);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("does not render links for unsafe URLs", () => {
    render(
      <CnFileField label="Docs" value={[{ id: 1, url: "javascript:alert(1)", name: "x.docx" }]} />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("x.docx")).toBeInTheDocument();
  });

  it("opens the picker from the keyboard", () => {
    render(<CnFileField label="Documento" />);
    const input = screen.getByTestId("cn-file-input") as HTMLInputElement;
    const click = vi.spyOn(input, "click");
    fireEvent.keyDown(screen.getByRole("button", { name: /Documento/ }), { key: "Enter" });
    expect(click).toHaveBeenCalled();
  });

  it("reorders files", () => {
    const onChange = vi.fn();
    render(
      <CnFileField label="Fotos" multiple reorderable value={[pdf, png]} onChange={onChange} />,
    );
    fireEvent.keyDown(screen.getByRole("button", { name: /Reordenar contrato.pdf/ }), {
      key: "ArrowDown",
    });
    expect(onChange).toHaveBeenCalledWith([png, pdf]);
  });

  it("renders the grid variant with an add tile and opens the lightbox", () => {
    render(
      <CnFileField label="Fotos" variant="grid" multiple value={[png, pdf]} onChange={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Agregar archivos" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver foto.png" }));
    expect(screen.getByRole("dialog", { name: "Vista previa: foto.png" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByRole("dialog", { name: "Vista previa: contrato.pdf" })).toBeInTheDocument();
  });

  it("replaces the image in the avatar variant", () => {
    const onChange = vi.fn();
    const onRemoveExisting = vi.fn();
    const existing = {
      id: 3,
      url: "https://cdn.canek.mx/yo.png",
      name: "yo.png",
      mime: "image/png",
    };
    render(
      <CnFileField
        label="Foto de perfil"
        variant="avatar"
        value={[existing]}
        onChange={onChange}
        onRemoveExisting={onRemoveExisting}
      />,
    );
    expect(screen.getByRole("button", { name: /Cambiar imagen/ })).toBeInTheDocument();
    select([png]);
    expect(onChange).toHaveBeenCalledWith([png]);
    expect(onRemoveExisting).toHaveBeenCalledWith(existing);
  });

  it("only accepts images in the avatar variant", () => {
    const onChange = vi.fn();
    render(<CnFileField label="Foto" variant="avatar" onChange={onChange} />);
    select([pdf]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("classifies file kinds and formats durations", () => {
    expect(getFileKind(png)).toBe("image");
    expect(getFileKind(pdf)).toBe("pdf");
    expect(getFileKind({ id: 1, url: "/a.xlsx", name: "a.xlsx" })).toBe("spreadsheet");
    expect(getFileKind(new File(["x"], "c.mp4", { type: "video/mp4" }))).toBe("video");
    expect(formatDuration(75)).toBe("1:15");
    expect(formatDuration(3725)).toBe("1:02:05");
  });

  it("checks image constraints", () => {
    expect(checkImageConstraints({ width: 400, height: 300 }, { minWidth: 800 })).toContain(
      "800px",
    );
    expect(checkImageConstraints({ width: 800, height: 600 }, { aspectRatio: 1 })).toContain(
      "proporción",
    );
    expect(
      checkImageConstraints({ width: 1000, height: 1000 }, { minWidth: 800, aspectRatio: 1 }),
    ).toBeNull();
  });

  it("shows metadata of existing files", () => {
    const { container } = render(
      <CnFileField
        label="Medios"
        multiple
        value={[
          {
            id: 1,
            url: "https://cdn.canek.mx/v.mp4",
            name: "v.mp4",
            mime: "video/mp4",
            size: 1048576,
            duration: 95,
          },
          {
            id: 2,
            url: "https://cdn.canek.mx/f.png",
            name: "f.png",
            mime: "image/png",
            width: 1920,
            height: 1080,
          },
          {
            id: 3,
            url: "https://cdn.canek.mx/c.pdf",
            name: "c.pdf",
            mime: "application/pdf",
            pages: 12,
          },
        ]}
      />,
    );
    const metas = Array.from(container.querySelectorAll("[data-cn-doc-meta]"));
    expect(metas[0]).toHaveTextContent("1.0 MB · 1:35");
    expect(screen.getByText("1920×1080")).toBeInTheDocument();
    expect(screen.getByText("12 páginas")).toBeInTheDocument();
  });

  it("shows upload progress and retries failed uploads", () => {
    const onRetry = vi.fn();
    render(
      <CnFileField
        label="Docs"
        multiple
        value={[pdf, png]}
        fileStatus={(file) =>
          file === pdf
            ? { state: "uploading", progress: 40 }
            : { state: "error", message: "Sin conexión" }
        }
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText("Subiendo 40 %")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /Progreso de subida/ })).toHaveAttribute(
      "aria-valuenow",
      "40",
    );
    expect(screen.getByText("Sin conexión")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar foto.png" }));
    expect(onRetry).toHaveBeenCalledWith(png, 1);
  });

  it("enforces the total size limit and reports added files", () => {
    const onChange = vi.fn();
    const onFilesAdded = vi.fn();
    const big = new File([new Uint8Array(700 * 1024)], "a.pdf", { type: "application/pdf" });
    const big2 = new File([new Uint8Array(700 * 1024)], "b.pdf", { type: "application/pdf" });
    render(
      <CnFileField
        label="Docs"
        multiple
        maxTotalSize={1}
        onChange={onChange}
        onFilesAdded={onFilesAdded}
      />,
    );
    select([big, big2]);
    expect(onChange).toHaveBeenCalledWith([big]);
    expect(onFilesAdded).toHaveBeenCalledWith([big]);
    expect(screen.getByRole("alert")).toHaveTextContent("total permitido de 1 MB");
  });

  it("accepts pasted files", async () => {
    const onChange = vi.fn();
    render(<CnFileField label="Docs" onChange={onChange} />);
    fireEvent.paste(screen.getByRole("button", { name: /Docs/ }), {
      clipboardData: { files: [png] },
    });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith([png]));
  });

  it("renders compact chips and card variant", () => {
    const { rerender } = render(
      <CnFileField label="Adjuntos" variant="compact" multiple value={[pdf]} />,
    );
    expect(screen.getByRole("button", { name: /Seleccionar archivo/ })).toBeInTheDocument();
    expect(screen.getByText("contrato.pdf")).toBeInTheDocument();
    rerender(<CnFileField label="Adjuntos" variant="card" multiple value={[pdf]} />);
    expect(screen.getByRole("button", { name: "Agregar archivos" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Más acciones de contrato.pdf" }));
    expect(screen.getByRole("menuitem", { name: /Descargar/ })).toBeInTheDocument();
  });

  it("marks another file as primary in the gallery", () => {
    const onChange = vi.fn();
    render(
      <CnFileField
        label="Fotos"
        variant="grid"
        multiple
        reorderable
        value={[pdf, png]}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Principal")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Marcar foto.png como principal" }));
    expect(onChange).toHaveBeenCalledWith([png, pdf]);
  });

  it("reorders the gallery with the keyboard", () => {
    const onChange = vi.fn();
    render(
      <CnFileField
        label="Fotos"
        variant="grid"
        multiple
        reorderable
        value={[pdf, png]}
        onChange={onChange}
      />,
    );
    fireEvent.keyDown(screen.getByRole("button", { name: /Reordenar contrato.pdf/ }), {
      key: "ArrowRight",
    });
    expect(onChange).toHaveBeenCalledWith([png, pdf]);
  });

  it("renders each listed file as a CnDocCard", () => {
    const { container } = render(<CnFileField label="Docs" multiple value={[pdf, png]} />);
    const items = container.querySelectorAll("li[data-cn-file-item]");
    expect(items).toHaveLength(2);
    items.forEach((item) => expect(item.querySelector("[data-cn-doc-card='list']")).not.toBeNull());
    expect(screen.getByRole("article", { name: "contrato.pdf" })).toBeInTheDocument();
  });

  it("renders readOnly as plain CnDocCards (no dropzone, remove or reorder)", () => {
    const existing = { id: 1, url: "https://cdn.canek.mx/a.pdf", name: "a.pdf", size: 10 };
    const { container, rerender } = render(
      <CnFileField label="Docs" multiple reorderable readOnly value={[existing, pdf]} />,
    );
    expect(screen.queryByRole("button", { name: /Docs/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Quitar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reordenar/ })).not.toBeInTheDocument();
    expect(container.querySelectorAll("[data-cn-doc-card='list']")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Descargar a.pdf" })).toBeInTheDocument();

    rerender(<CnFileField label="Docs" variant="card" multiple readOnly value={[existing]} />);
    expect(container.querySelectorAll("[data-cn-doc-card='grid']")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Agregar archivos" })).not.toBeInTheDocument();
  });

  it("opens the field lightbox from a list DocCard", () => {
    render(<CnFileField label="Docs" multiple value={[png, pdf]} onChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver foto.png" }));
    expect(screen.getByRole("dialog", { name: "Vista previa: foto.png" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByRole("dialog", { name: "Vista previa: contrato.pdf" })).toBeInTheDocument();
  });

  it("marks another file as primary from the card menu", () => {
    const onChange = vi.fn();
    render(
      <CnFileField
        label="Fotos"
        variant="card"
        multiple
        reorderable
        value={[pdf, png]}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Principal")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Más acciones de foto.png" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Marcar como principal/ }));
    expect(onChange).toHaveBeenCalledWith([png, pdf]);
  });

  it("shows the success state of an upload", () => {
    render(
      <CnFileField
        label="Docs"
        value={[pdf]}
        fileStatus={() => ({ state: "success" })}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("Subido")).toBeInTheDocument();
  });

  it("truncates very long names instead of overflowing", () => {
    const long = new File(["x"], `${"nombre-de-archivo-muy-largo-".repeat(4)}.pdf`, {
      type: "application/pdf",
    });
    render(<CnFileField label="Docs" value={[long]} onChange={() => {}} />);
    const name = screen.getByTitle(long.name);
    expect(name).toHaveStyle({ textOverflow: "ellipsis", whiteSpace: "nowrap" });
  });

  it("passes capture to the input for mobile cameras", () => {
    render(<CnFileField label="Foto" variant="avatar" capture="user" />);
    expect(screen.getByTestId("cn-file-input")).toHaveAttribute("capture", "user");
  });
});

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CnCellOptions, CnCellType } from "./cells";
import { CnCell, colorFromText, formatCellText, formatRelative } from "./cells";
import { CN_STATUS_PRESETS } from "./status-presets";

const cell = (type: CnCellType, value: unknown, options: CnCellOptions = {}, row: unknown = {}) =>
  render(<CnCell type={type} value={value} row={row} {...options} />);

describe("formatCellText", () => {
  it("formats every type as plain text", () => {
    expect(formatCellText("id", 7, {}, { prefix: "EMP-", suffix: "/A" })).toBe("EMP-7/A");
    expect(formatCellText("number", 1234.5, {}, { suffix: "kg" })).toBe("1,234.5 kg");
    expect(formatCellText("currency", 99, {}, { currency: "USD" })).toMatch(/99\.00/);
    expect(formatCellText("percent", 0.255, {}, { percentScale: "fraction" })).toBe("25.5%");
    expect(formatCellText("progress", 3, {}, { max: 4 })).toBe("75%");
    expect(formatCellText("date", "2024-05-06", {})).toBe("06/May/2024");
    expect(formatCellText("datetime", "2024-05-06 14:05:00", {})).toBe("06/May/2024 14:05");
    expect(formatCellText("time", "09:30:00", {})).toBe("09:30");
    expect(formatCellText("date", "2024-05-06", {}, { dateFormat: "D [de] MMMM YYYY" })).toBe(
      "6 de mayo 2024",
    );
    expect(formatCellText("duration", 3700, {}, { durationUnit: "seconds" })).toBe("1 h 2 min");
    expect(formatCellText("duration", 26, {}, { durationUnit: "hours" })).toBe("1 d 2 h");
    expect(formatCellText("duration", 45, {})).toBe("45 min");
    expect(formatCellText("boolean", true, {}, { trueLabel: "Verificado" })).toBe("Verificado");
    expect(
      formatCellText("status", "approved", {}, { statusMap: CN_STATUS_PRESETS.approval }),
    ).toBe("Aprobado");
    expect(formatCellText("phone", "5512345678", {})).toBe("55 1234 5678");
    expect(formatCellText("phone", "+525512345678", {})).toBe("+52 55 1234 5678");
    expect(formatCellText("tags", ["a", "b"], {})).toBe("a, b");
    expect(formatCellText("rating", 4, {})).toBe("4/5");
    expect(formatCellText("location", { city: "GDL", state: "Jalisco" }, {})).toBe("GDL, Jalisco");
    expect(formatCellText("contact", [{ name: "Ana" }, { name: "Luis" }], {})).toBe("Ana, Luis");
    expect(formatCellText("text", "hola MUNDO", {}, { transform: "capitalize" })).toBe(
      "Hola Mundo",
    );
    expect(formatCellText("text", { label: "Opción" }, {})).toBe("Opción");
    expect(formatCellText("text", null, {})).toBe("");
  });

  it("formats relative dates and stable colors", () => {
    const now = new Date(2026, 10, 6);
    expect(formatRelative(new Date(2023, 0, 15), now)).toBe("hace 3 años");
    expect(formatRelative(new Date(2026, 10, 9), now)).toBe("dentro de 3 días");
    expect(colorFromText("Ana García")).toBe(colorFromText("Ana García"));
  });
});

describe("CnCell rendering", () => {
  it("renders contextual empty states", () => {
    cell("email", null);
    expect(screen.getByText("Sin correo")).toBeInTheDocument();
  });

  it("supports Tabantaj empty contexts and custom empty text", () => {
    const { rerender } = cell("text", "", { emptyContext: "not_assigned" });
    expect(screen.getByText("Sin asignar")).toBeInTheDocument();
    rerender(<CnCell type="text" value="" emptyText="Por definir" />);
    expect(screen.getByText("Por definir")).toBeInTheDocument();
  });

  it("copies values with the copy button", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    cell("id", 42, { prefix: "#" });
    fireEvent.click(screen.getByRole("button", { name: "Copiar: #42" }));
    expect(writeText).toHaveBeenCalledWith("#42");
  });

  it("validates RFC and CURP formats", () => {
    const { rerender } = cell("rfc", "gaaa800101ab1");
    expect(screen.getByTitle("RFC con formato válido")).toHaveTextContent("GAAA800101AB1");
    rerender(<CnCell type="curp" value="NO-VALIDA" />);
    expect(screen.getByTitle("CURP con formato no reconocido")).toBeInTheDocument();
  });

  it("links emails, phones, websites and maps", () => {
    render(
      <>
        <CnCell type="email" value="ana@acme.mx" />
        <CnCell type="phone" value="5512345678" whatsapp />
        <CnCell type="link" value="https://www.canek.mx/docs" />
        <CnCell type="location" value="Av. Juárez 10, CDMX" mapLink />
      </>,
    );
    expect(screen.getByTitle("Escribir a ana@acme.mx")).toHaveAttribute(
      "href",
      "mailto:ana@acme.mx",
    );
    expect(screen.getByTitle("Llamar a 55 1234 5678")).toHaveAttribute("href", "tel:5512345678");
    expect(screen.getByLabelText("WhatsApp 55 1234 5678")).toHaveAttribute(
      "href",
      "https://wa.me/5512345678",
    );
    expect(screen.getByText("canek.mx")).toBeInTheDocument();
    expect(screen.getByTitle(/Abrir en Google Maps/)).toHaveAttribute(
      "href",
      expect.stringContaining("google.com/maps/search"),
    );
  });

  it("blocks unsafe links", () => {
    cell("link", "javascript:alert(1)");
    expect(screen.getByText("Sin enlace")).toBeInTheDocument();
  });

  it("shows status presets with icons and unknown values", () => {
    const { rerender } = cell("status", "overdue", { statusMap: CN_STATUS_PRESETS.payment });
    expect(screen.getByText(/Vencid/)).toBeInTheDocument();
    rerender(<CnCell type="status" value="raro" />);
    expect(screen.getByText("raro")).toBeInTheDocument();
  });

  it("shows trends, bars and plain numbers", () => {
    render(
      <>
        <CnCell type="currency" value={120} previous={() => 100} />
        <CnCell type="currency" value={-5} plain />
        <CnCell type="percent" value={42} bar />
        <CnCell type="progress" value={9} max={10} />
      </>,
    );
    expect(screen.getAllByRole("progressbar")).toHaveLength(2);
    expect(screen.getByText("90%")).toBeInTheDocument();
  });

  it("renders avatars with badge and click", () => {
    const onClick = vi.fn();
    cell(
      "avatar",
      "Ana García",
      { badge: () => ({ label: "Admin", tone: "success" }), onClick },
      { id: 1 },
    );
    expect(screen.getByText("AG")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ana García" }));
    expect(onClick).toHaveBeenCalledWith("Ana García", { id: 1 });
  });

  it("renders a contact group with a popover", () => {
    cell(
      "contact",
      [
        { name: "Ana López", email: "ana@acme.mx", position: "Compras" },
        { name: "Luis Pérez", phone: "5512345678" },
        { name: "María Ruiz" },
        { name: "Jorge Díaz" },
        { name: "Sofía Torres" },
      ],
      { maxItems: 3 },
    );
    expect(screen.getByText("+2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver 5 contactos" }));
    const popover = screen.getByRole("presentation");
    expect(within(popover).getByText("Compras")).toBeInTheDocument();
    expect(within(popover).getByText("ana@acme.mx")).toBeInTheDocument();
    expect(within(popover).getByText("55 1234 5678")).toBeInTheDocument();
  });

  it("renders an image gallery", () => {
    cell("image", ["https://cdn.test/a.jpg", { url: "https://cdn.test/b.jpg" }]);
    fireEvent.click(screen.getByRole("button", { name: "Ver 2 imágenes" }));
    fireEvent.click(screen.getByRole("button", { name: "Imagen 2" }));
    expect(screen.getByRole("button", { name: "Imagen 2" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("truncates code with maxLength and keeps the full value in the title", () => {
    cell("code", "ABCDEFGHIJKLMNOP", { maxLength: 8 });
    expect(screen.getByTitle("ABCDEFGHIJKLMNOP")).toHaveTextContent("ABCDEFG…");
  });

  it("shows tag overflow in a popover", () => {
    cell("tags", ["Uno", "Dos", "Tres", "Cuatro"], { maxTags: 2 });
    fireEvent.click(screen.getByRole("button", { name: "+2" }));
    expect(screen.getAllByText("Cuatro").length).toBeGreaterThan(0);
  });
});

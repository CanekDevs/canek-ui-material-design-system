import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ageFrom,
  compareVersions,
  describeDeadline,
  parseIp,
  parseTimeRange,
  parseWeekdays,
  resolveSentiment,
  stripRichText,
  truncateMiddle,
  weekdaysText,
} from "./cell-formats";
import type { CnCellOptions, CnCellType } from "./cells";
import { CnCell, cellSortValue, formatCellText } from "./cells";

const cell = (type: CnCellType, value: unknown, options: CnCellOptions = {}, row: unknown = {}) =>
  render(<CnCell type={type} value={value} row={row} {...options} />);

const UUID = "3f2a9c1e-7b4d-4c2a-9f1e-1234567890ab";

describe("formatCellText (tipos adicionales)", () => {
  it("formats every new type as plain text", () => {
    expect(formatCellText("delta", 12.345, {})).toBe("+12.3%");
    expect(formatCellText("delta", 120, {}, { previous: () => 100 })).toBe("+20%");
    expect(formatCellText("delta", 120, {}, { previous: () => 100, deltaFormat: "number" })).toBe(
      "+20",
    );
    expect(formatCellText("delta", -1500, {}, { deltaFormat: "currency" })).toBe("-$1,500.00");
    expect(formatCellText("delta", 0.05, {}, { percentScale: "fraction" })).toBe("+5%");
    expect(formatCellText("priority", "high", {})).toBe("Alta");
    expect(formatCellText("priority", 4, {})).toBe("Crítica");
    expect(
      formatCellText("priority", "p0", {}, { priorityMap: { p0: { label: "Bloqueante" } } }),
    ).toBe("Bloqueante");
    expect(formatCellText("deadline", "2024-05-06 14:05", {})).toBe("06/May/2024 14:05");
    expect(formatCellText("ip", " 10.0.0.1 ", {})).toBe("10.0.0.1");
    expect(formatCellText("uuid", UUID, {})).toBe(UUID);
    expect(formatCellText("version", "1.2", {})).toBe("v1.2.0");
    expect(formatCellText("version", "v2.0.0-rc.1", {})).toBe("v2.0.0-rc.1");
    expect(formatCellText("richtext", "<p>Hola <b>mundo</b></p>", {})).toBe("Hola mundo");
    expect(formatCellText("icon", "check_circle", {})).toBe("check_circle");
    expect(
      formatCellText("icon", "ok", {}, { statusMap: { ok: { label: "Correcto", icon: "check" } } }),
    ).toBe("Correcto");
    expect(formatCellText("icon", { icon: "bolt", label: "Rápido" }, {})).toBe("Rápido");
    expect(formatCellText("toggle", true, {})).toBe("Activado");
    expect(formatCellText("toggle", false, {}, { falseLabel: "Apagado" })).toBe("Apagado");
    expect(formatCellText("steps", 3, {}, { stepLabels: ["a", "b", "c", "d", "e"] })).toBe("3/5");
    expect(formatCellText("steps", { current: 2, total: 4 }, {})).toBe("2/4");
    expect(formatCellText("steps", "1/3", {})).toBe("1/3");
    expect(
      formatCellText(
        "stage",
        "won",
        {},
        { stages: ["lead", { value: "won", label: "Ganado", tone: "success" }] },
      ),
    ).toBe("Ganado");
    expect(formatCellText("weekdays", [1, 2, 3, 4, 5], {})).toBe("Lunes a viernes");
    expect(formatCellText("weekdays", "sab, dom", {})).toBe("Fin de semana");
    expect(formatCellText("timerange", ["09:00", "18:00"], {})).toBe("09:00 – 18:00");
    expect(formatCellText("timerange", "22:00-06:00", {})).toBe("22:00 – 06:00");
    expect(formatCellText("age", 34, {})).toBe("34 años");
    expect(formatCellText("age", 1, {})).toBe("1 año");
    expect(formatCellText("range", [10000, 25000], {}, { rangeFormat: "currency" })).toBe(
      "$10,000 – $25,000",
    );
    expect(formatCellText("range", { min: 1.5, max: 3 }, {})).toBe("1.5 – 3");
    expect(formatCellText("sentiment", "positive", {})).toBe("Positivo");
    expect(formatCellText("sentiment", -0.4, {})).toBe("Negativo");
    expect(formatCellText("sentiment", 5, {})).toBe("Muy positivo");
    expect(formatCellText("sentiment", 1, {}, { sentimentScale: "five" })).toBe("Muy negativo");
    expect(formatCellText("score", 85.4, {})).toBe("85");
    expect(formatCellText("reference", { label: "Pedido 1024", id: "PO-1024" }, {})).toBe(
      "Pedido 1024 · PO-1024",
    );
    expect(formatCellText("reference", "Acme", {})).toBe("Acme");
    expect(formatCellText("counter", 150, {})).toBe("150");
    expect(formatCellText("counter", null, {})).toBe("");
  });

  it("sorts new types by meaning, not by text", () => {
    expect(cellSortValue("priority", "critical", {})).toBe(4);
    expect(cellSortValue("priority", "baja", {})).toBe(1);
    const versions = ["1.10.0", "1.2.0", "1.2.0-beta"].sort((a, b) =>
      String(cellSortValue("version", a, {})).localeCompare(
        String(cellSortValue("version", b, {})),
      ),
    );
    expect(versions).toEqual(["1.2.0-beta", "1.2.0", "1.10.0"]);
    expect(cellSortValue("stage", "b", {}, { stages: ["a", "b", "c"] })).toBe(1);
    expect(cellSortValue("range", [5, 9], {})).toBe(5);
    expect(cellSortValue("text", "hola", {})).toBe("hola");
  });
});

describe("cell-formats helpers", () => {
  it("describes deadlines by urgency", () => {
    const now = new Date(2026, 10, 9, 12, 0);
    const at = (hours: number) => new Date(now.getTime() + hours * 3600000);
    expect(describeDeadline(at(3), now)).toMatchObject({ label: "vence en 3 h", tone: "error" });
    expect(describeDeadline(at(48), now)).toMatchObject({ label: "vence en 2 d", tone: "warning" });
    expect(describeDeadline(at(24 * 10), now).tone).toBe("success");
    expect(describeDeadline(at(-48), now)).toMatchObject({
      label: "vencido hace 2 d",
      overdue: true,
      tone: "error",
    });
    expect(describeDeadline(at(30), now, { danger: 2, warning: 12 }).tone).toBe("success");
  });

  it("validates IP addresses", () => {
    expect(parseIp("192.168.1.10")).toMatchObject({ valid: true, version: 4, scope: "privada" });
    expect(parseIp("8.8.8.8").scope).toBe("pública");
    expect(parseIp("10.0.0.0/8")).toMatchObject({ valid: true, prefix: 8 });
    expect(parseIp("2001:db8::1")).toMatchObject({ valid: true, version: 6 });
    expect(parseIp("::1").scope).toBe("loopback");
    expect(parseIp("999.1.1.1").valid).toBe(false);
    expect(parseIp("1::2::3").valid).toBe(false);
  });

  it("parses versions, weekdays, times, ages and sentiment", () => {
    expect(compareVersions("1.2.0", "1.10.0")).toBeLessThan(0);
    expect(compareVersions("2.0.0-beta", "2.0.0")).toBeLessThan(0);
    expect(parseWeekdays([0, 6])).toEqual([6, 7]);
    expect(parseWeekdays("lun, mié, vie")).toEqual([1, 3, 5]);
    expect(weekdaysText([1, 3, 5])).toBe("Lun, Mié, Vie");
    expect(parseTimeRange("22:00-06:00")).toMatchObject({ minutes: 480, overnight: true });
    const age = ageFrom(new Date(1990, 0, 15), new Date(2026, 10, 9));
    expect(age).toMatchObject({ years: 36, months: 9, nextBirthdayIn: 67, text: "36 años" });
    expect(ageFrom(new Date(2026, 2, 1), new Date(2026, 10, 9)).text).toBe("8 meses");
    expect(resolveSentiment("??")).toBeNull();
    expect(truncateMiddle(UUID)).toBe("3f2a9c1e…90ab");
  });

  it("strips HTML and Markdown to plain text", () => {
    expect(stripRichText("<p>Hola&nbsp;<b>mundo</b></p><script>alert(1)</script>")).toBe(
      "Hola mundo",
    );
    expect(stripRichText("# Título\n**negritas** y [enlace](https://x.com)")).toBe(
      "Título\nnegritas y enlace",
    );
    expect(stripRichText("- uno\n- dos", "markdown")).toBe("• uno\n• dos");
  });
});

describe("CnCell (tipos adicionales)", () => {
  it("renders delta with trend colors and a detail card", () => {
    const { rerender } = cell("delta", 120, { previous: () => 100 });
    expect(screen.getByText("+20%")).toBeInTheDocument();
    expect(screen.getByText("vs. 100")).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Subió +20%"));
    const dialog = screen.getByRole("dialog", { name: "Variación" });
    expect(within(dialog).getByText("Anterior")).toBeInTheDocument();
    rerender(<CnCell type="delta" value={-5} invertTrend />);
    expect(screen.getByTitle("Bajó -5%")).toBeInTheDocument();
  });

  it("renders priority, empty states and custom maps", () => {
    const { rerender } = cell("priority", "high");
    expect(screen.getByTitle("Prioridad alta (3 de 4)")).toHaveTextContent("Alta");
    rerender(<CnCell type="priority" value={null} />);
    expect(screen.getByText("Sin prioridad")).toBeInTheDocument();
  });

  it("renders deadlines relative to now, or done", () => {
    const soon = new Date(Date.now() + 2 * 3600000 + 60000);
    const { rerender } = cell("deadline", soon);
    expect(screen.getByText("Vence en 2 h")).toBeInTheDocument();
    rerender(<CnCell type="deadline" value={new Date(Date.now() - 3 * 86400000)} />);
    expect(screen.getByText("Vencido hace 3 d")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Vencido hace 3 d"));
    expect(screen.getByRole("dialog", { name: "Vencimiento" })).toBeInTheDocument();
    rerender(<CnCell type="deadline" value={soon} done={() => true} detail={false} />);
    expect(screen.getByText("Cumplido")).toBeInTheDocument();
  });

  it("renders IP, UUID and version pills", () => {
    const { rerender } = cell("ip", "192.168.1.10");
    expect(screen.getByText("IPv4")).toBeInTheDocument();
    expect(screen.getByTitle("IPv4 privada")).toBeInTheDocument();
    rerender(<CnCell type="ip" value="300.1.1.1" />);
    expect(screen.getByText("No válida")).toBeInTheDocument();
    rerender(<CnCell type="uuid" value={UUID} />);
    expect(screen.getByText("3f2a9c1e…90ab")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Copiar: ${UUID}` })).toBeInTheDocument();
    rerender(<CnCell type="version" value="1.4.0" latestVersion="1.4.0" />);
    expect(screen.getByText("Última")).toBeInTheDocument();
    rerender(<CnCell type="version" value="1.3.0" latestVersion="1.4.0" />);
    expect(screen.getByText("Desactualizada")).toBeInTheDocument();
    expect(screen.getByTitle("Disponible: v1.4.0")).toBeInTheDocument();
    rerender(<CnCell type="version" value="2.0.0-beta.1" />);
    expect(screen.getByText("beta")).toBeInTheDocument();
  });

  it("shows rich text safely, without scripts or unsafe links", () => {
    const html =
      '<h2>Resumen</h2><p>Hola <b>mundo</b> <a href="javascript:alert(1)">malo</a> <a href="https://ok.com">bueno</a></p><script>window.hacked = true</script><img src=x onerror="window.hacked=true">';
    const { container } = cell("richtext", html);
    expect(container).toHaveTextContent("Resumen Hola mundo malo bueno");
    fireEvent.click(screen.getByText("Ver completo"));
    const dialog = screen.getByRole("dialog", { name: "Contenido" });
    expect(dialog.querySelector("strong")).toHaveTextContent("mundo");
    expect(dialog.querySelector("h2")).toHaveTextContent("Resumen");
    expect(dialog.querySelector("script, img")).toBeNull();
    expect(within(dialog).getByText("bueno").closest("a")).toHaveAttribute(
      "href",
      "https://ok.com",
    );
    expect(dialog.querySelectorAll("a")).toHaveLength(1);
    expect(dialog.querySelector("[onerror], [href^='javascript']")).toBeNull();
    expect((window as unknown as { hacked?: boolean }).hacked).toBeUndefined();
  });

  it("renders markdown rich text as safe elements", () => {
    cell("richtext", "## Título\n\n- uno\n- **dos**\n\n[ver](https://x.com)");
    fireEvent.click(screen.getByText("Ver completo"));
    const dialog = screen.getByRole("dialog", { name: "Contenido" });
    expect(dialog.querySelectorAll("li")).toHaveLength(2);
    expect(dialog.querySelector("strong")).toHaveTextContent("dos");
    expect(within(dialog).getByText("ver")).toHaveAttribute("href", "https://x.com");
  });

  it("renders icons with labels and maps", () => {
    const { rerender } = cell("icon", "check_circle");
    expect(screen.getByText("Check circle")).toBeInTheDocument();
    rerender(
      <CnCell
        type="icon"
        value="ok"
        statusMap={{ ok: { label: "Correcto", icon: "check", color: "success" } }}
      />,
    );
    expect(screen.getByText("Correcto")).toBeInTheDocument();
    rerender(<CnCell type="icon" value={{ icon: "bolt", label: "Rápido" }} iconOnly />);
    expect(screen.getByRole("img", { name: "Rápido" })).toBeInTheDocument();
  });

  it("toggles inline without firing the row click", () => {
    const onChange = vi.fn();
    const onRowClick = vi.fn();
    const row = { id: 7 };
    const { container, unmount } = render(
      <div onClick={onRowClick}>
        <CnCell type="toggle" value={false} row={row} onChange={onChange} />
      </div>,
    );
    const input = container.querySelector("input[type=checkbox]") as HTMLInputElement;
    expect(input).not.toBeDisabled();
    fireEvent.click(input);
    expect(onChange).toHaveBeenCalledWith(row, true);
    expect(onRowClick).not.toHaveBeenCalled();
    expect(screen.getByText("Activado")).toBeInTheDocument();
    unmount();
    const disabled = render(<CnCell type="toggle" value={null} row={row} />);
    expect(disabled.container.querySelector("input[type=checkbox]")).toBeDisabled();
    expect(screen.getByText("Desactivado")).toBeInTheDocument();
  });

  it("renders steps, stages and weekdays", () => {
    const { rerender } = cell("steps", 2, { stepLabels: ["Alta", "Revisión", "Firma"] });
    expect(screen.getByRole("img", { name: "2 de 3 pasos: Revisión" })).toBeInTheDocument();
    expect(screen.getByText("2/3")).toBeInTheDocument();
    rerender(<CnCell type="stage" value="propuesta" stages={["lead", "propuesta", "cierre"]} />);
    expect(screen.getByRole("img", { name: "Etapa 2 de 3: propuesta" })).toBeInTheDocument();
    rerender(<CnCell type="weekdays" value={[6, 7]} />);
    expect(screen.getByRole("img", { name: "Fin de semana" })).toBeInTheDocument();
  });

  it("renders time ranges, ages, ranges and sentiment", () => {
    const { rerender } = cell("timerange", { start: "09:00", end: "17:30" });
    expect(screen.getByText("09:00 – 17:30")).toBeInTheDocument();
    expect(screen.getByText("8 h 30 min")).toBeInTheDocument();
    rerender(<CnCell type="age" value="1990-01-15" />);
    expect(screen.getByText(/^\d+ años$/)).toBeInTheDocument();
    rerender(<CnCell type="range" value={[10, 40]} bar max={100} />);
    expect(screen.getByRole("img", { name: "Rango 10 – 40 sobre 100" })).toBeInTheDocument();
    rerender(<CnCell type="sentiment" value={0.3} />);
    expect(screen.getByTitle("Puntuación: 0.3")).toHaveTextContent("Positivo");
  });

  it("renders score rings, references and counters", () => {
    const onClick = vi.fn();
    const onRowClick = vi.fn();
    const { container, rerender } = render(<CnCell type="score" value={72} />);
    expect(screen.getByRole("img", { name: "Puntuación 72 de 100" })).toBeInTheDocument();
    rerender(
      <div onClick={onRowClick}>
        <CnCell
          type="reference"
          value={{ label: "Pedido 1024", id: "PO-1024", subtitle: "Acme" }}
          prefix=""
          onClick={onClick}
        />
      </div>,
    );
    expect(screen.getByText("PO-1024 · Acme")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Pedido 1024"));
    expect(onClick).toHaveBeenCalled();
    expect(onRowClick).not.toHaveBeenCalled();
    rerender(<CnCell type="counter" value={150} max={99} />);
    expect(screen.getByRole("status", { name: "150" })).toHaveTextContent("99+");
    rerender(<CnCell type="counter" value={0} hideZero />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Historias de celdas", () => {
  it("renders every cell story without errors", async () => {
    const stories = (await import("./cells.stories")) as Record<
      string,
      { render?: () => JSX.Element }
    >;
    const entries = Object.entries(stories).filter(
      ([key, story]) => key !== "default" && story.render,
    );
    expect(entries.length).toBeGreaterThanOrEqual(55);
    for (const [, story] of entries) {
      const { unmount } = render(story.render!());
      unmount();
    }
  });
});

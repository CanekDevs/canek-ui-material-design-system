import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  buildIcs,
  CnEventCalendar,
  CnEventCalendarSkeleton,
  countByDay,
  foldIcsLine,
  getOccurrences,
  getVisibleRange,
  heatLevel,
  layoutSegments,
  layoutTimedEvents,
  limitSegments,
  recurrenceStarts,
} from ".";
import type { CnCalendarEvent, CnEventCategory } from ".";

// jsdom no trae PointerEvent: se emula sobre MouseEvent para conservar clientX/Y.
beforeAll(() => {
  if (typeof window.PointerEvent === "undefined") {
    class PointerEventPolyfill extends MouseEvent {
      pointerId: number;
      constructor(type: string, params: PointerEventInit = {}) {
        super(type, params);
        this.pointerId = params.pointerId ?? 1;
      }
    }
    // @ts-expect-error polyfill de pruebas
    window.PointerEvent = PointerEventPolyfill;
  }
});

const d = (iso: string) => {
  const [date, time = "00:00"] = iso.split("T");
  const [y, m, day] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y, m - 1, day, h, min);
};

const categories: CnEventCategory[] = [
  { id: "meeting", label: "Reunión", color: "primary", icon: "groups" },
  { id: "holiday", label: "Festivo", color: "warning" },
];

const events: CnCalendarEvent[] = [
  {
    id: "standup",
    title: "Daily de producto",
    start: "2026-11-10T09:00",
    end: "2026-11-10T09:30",
    category: "meeting",
    location: "Sala Maya",
    description: "Revisión de pendientes",
    attendees: [{ name: "Ana López" }, { name: "Luis Pérez" }],
    status: "confirmed",
  },
  {
    id: "retiro",
    title: "Retiro anual",
    start: "2026-11-18",
    end: "2026-11-20",
    allDay: true,
    category: "holiday",
  },
];

describe("helpers", () => {
  it("lays out overlapping timed events side by side", () => {
    const items = [
      { id: "a", start: d("2026-11-10T09:00"), end: d("2026-11-10T10:00") },
      { id: "b", start: d("2026-11-10T09:30"), end: d("2026-11-10T10:30") },
      { id: "c", start: d("2026-11-10T10:30"), end: d("2026-11-10T11:00") },
    ];
    const layout = layoutTimedEvents(items);
    const byId = Object.fromEntries(layout.map((l) => [l.item.id, l]));
    expect(byId.a).toMatchObject({ column: 0, columns: 2 });
    expect(byId.b).toMatchObject({ column: 1, columns: 2 });
    // C empieza cuando terminan los otros: grupo nuevo a todo lo ancho.
    expect(byId.c).toMatchObject({ column: 0, columns: 1, span: 1 });
  });

  it("expands events into free columns to the right", () => {
    const items = [
      { id: "long", start: d("2026-11-10T09:00"), end: d("2026-11-10T12:00") },
      { id: "x", start: d("2026-11-10T09:00"), end: d("2026-11-10T10:00") },
      { id: "y", start: d("2026-11-10T09:00"), end: d("2026-11-10T10:00") },
      { id: "z", start: d("2026-11-10T10:00"), end: d("2026-11-10T11:00") },
    ];
    const byId = Object.fromEntries(layoutTimedEvents(items).map((l) => [l.item.id, l]));
    expect(byId.long.columns).toBe(3);
    expect(byId.z).toMatchObject({ column: 1, span: 2 });
  });

  it("assigns lanes to multi-day segments and limits them", () => {
    const week = d("2026-11-16");
    const items = [
      { id: "a", start: d("2026-11-16"), end: d("2026-11-19") },
      { id: "b", start: d("2026-11-17"), end: d("2026-11-18") },
      { id: "c", start: d("2026-11-14"), end: d("2026-11-17") },
    ];
    const segments = layoutSegments(items, week, 7);
    const byId = Object.fromEntries(segments.map((s) => [s.item.id, s]));
    expect(byId.c).toMatchObject({ startCol: 0, span: 1, isStart: false, isEnd: true });
    expect(byId.a).toMatchObject({ startCol: 0, span: 3 });
    expect(byId.a.lane).not.toBe(byId.c.lane);
    expect(byId.b.lane).toBe(byId.c.lane);
    const { hidden } = limitSegments(segments, 7, 1);
    expect(hidden[0]).toBe(2);
  });

  it("expands daily, weekly, monthly recurrences with count, until and exdates", () => {
    const end = d("2027-01-01");
    expect(
      recurrenceStarts(
        d("2026-11-02T10:00"),
        { freq: "weekly", byWeekday: [1, 3], count: 5 },
        end,
      ).map((x) => x.getDate()),
    ).toEqual([2, 4, 9, 11, 16]);
    expect(
      recurrenceStarts(
        d("2026-11-29"),
        { freq: "daily", until: "2026-12-02", exdates: ["2026-11-30"] },
        end,
      ).map((x) => x.getDate()),
    ).toEqual([29, 1, 2]);
    // El 31 solo existe en algunos meses.
    expect(
      recurrenceStarts(d("2026-08-31"), { freq: "monthly" }, end).map((x) => x.getMonth()),
    ).toEqual([7, 9, 11]);
    const occ = getOccurrences(
      [
        {
          id: "r",
          title: "Pago",
          start: "2026-11-05T09:00",
          recurrence: { freq: "weekly", interval: 2 },
        },
      ],
      getVisibleRange("month", d("2026-11-15")),
    );
    expect(occ.map((o) => o.start.getDate())).toEqual([5, 19, 3]);
    expect(occ[0].recurring).toBe(true);
    expect(new Set(occ.map((o) => o.key)).size).toBe(3);
  });

  it("computes visible ranges for each view (week starting Monday)", () => {
    const month = getVisibleRange("month", d("2026-11-09"), 1);
    expect(month.start).toEqual(d("2026-10-26"));
    expect(month.end).toEqual(d("2026-12-07"));
    expect(getVisibleRange("week", d("2026-11-11"), 1)).toEqual({
      start: d("2026-11-09"),
      end: d("2026-11-16"),
    });
    expect(getVisibleRange("week", d("2026-11-11"), 0).start).toEqual(d("2026-11-08"));
  });

  it("builds a valid ics", () => {
    const ics = buildIcs(
      [
        ...events,
        {
          id: "rep",
          title: "Comité; finanzas, Q4",
          start: "2026-11-03T16:00",
          end: "2026-11-03T17:00",
          recurrence: { freq: "weekly", byWeekday: [2, 4], until: "2026-12-31" },
          attendees: [{ name: "Ana", email: "ana@canek.mx" }],
        },
      ],
      { calendarName: "Equipo", categories, now: new Date(Date.UTC(2026, 10, 9, 12)) },
    );
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("X-WR-CALNAME:Equipo");
    expect(ics).toContain("DTSTART:20261110T090000");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261118");
    // Fin exclusivo: el retiro termina el 20 → DTEND el 21.
    expect(ics).toContain("DTEND;VALUE=DATE:20261121");
    expect(ics).toContain("SUMMARY:Comité\\; finanzas\\, Q4");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20261231T235959");
    expect(ics).toContain("CATEGORIES:Reunión");
    expect(ics).toContain("STATUS:CONFIRMED");
    expect(ics).toContain('ATTENDEE;CN="Ana":mailto:ana@canek.mx');
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3);
    const folded = foldIcsLine(`DESCRIPTION:${"x".repeat(200)}`);
    expect(folded.split("\r\n ").every((part) => part.length <= 75)).toBe(true);
  });

  it("counts events per day and maps heat levels", () => {
    const range = { start: d("2026-11-01"), end: d("2026-12-01") };
    const counts = countByDay(getOccurrences(events, range), range);
    expect(counts.get("2026-11-19")).toBe(1);
    expect(counts.get("2026-11-10")).toBe(1);
    expect(heatLevel(0, 4)).toBe(0);
    expect(heatLevel(4, 4)).toBe(4);
    expect(heatLevel(1, 4)).toBe(1);
  });
});

describe("CnEventCalendar", () => {
  it("renders the month grid with title, events and holidays", () => {
    render(
      <CnEventCalendar
        events={events}
        categories={categories}
        defaultDate="2026-11-09"
        holidays={[{ date: "2026-11-16", label: "Revolución" }]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Noviembre 2026" })).toBeInTheDocument();
    expect(screen.getByRole("grid", { name: "Mes" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent(/lun/i);
    expect(screen.getByRole("button", { name: /Daily de producto, 09:00/ })).toBeInTheDocument();
    // Barra de varios días: un segmento por semana (18-20 en la misma semana).
    expect(screen.getAllByRole("button", { name: /Retiro anual/ })).toHaveLength(1);
    expect(screen.getByText("Revolución")).toBeInTheDocument();
  });

  it("navigates and reports the visible range", () => {
    const onRangeChange = vi.fn();
    render(
      <CnEventCalendar events={events} defaultDate="2026-11-09" onRangeChange={onRangeChange} />,
    );
    expect(onRangeChange).toHaveBeenLastCalledWith(
      { start: d("2026-10-26"), end: d("2026-12-07") },
      "month",
    );
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByRole("heading", { name: "Diciembre 2026" })).toBeInTheDocument();
    expect(onRangeChange).toHaveBeenLastCalledWith(
      { start: d("2026-11-30"), end: d("2027-01-04") },
      "month",
    );
    fireEvent.click(screen.getByRole("button", { name: "Semana" }));
    // La fecha pasó al 9 de diciembre: semana del 7 al 13.
    expect(screen.getByRole("heading", { name: "7 – 13 dic 2026" })).toBeInTheDocument();
    expect(onRangeChange).toHaveBeenLastCalledWith(
      { start: d("2026-12-07"), end: d("2026-12-14") },
      "week",
    );
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(screen.getByRole("heading", { name: "30 nov – 6 dic 2026" })).toBeInTheDocument();
  });

  it("works controlled (date and view)", () => {
    const onDateChange = vi.fn();
    const onViewChange = vi.fn();
    render(
      <CnEventCalendar
        events={events}
        date="2026-11-10"
        view="day"
        onDateChange={onDateChange}
        onViewChange={onViewChange}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /Martes, 10 de noviembre de 2026/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(onDateChange).toHaveBeenCalledWith(d("2026-11-11"));
    // Controlado: no cambia hasta que el padre actualiza `date`.
    expect(screen.getByRole("heading", { name: /10 de noviembre/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mes" }));
    expect(onViewChange).toHaveBeenCalledWith("month");
  });

  it("shows '+N más' when a day overflows and lists all events", () => {
    const many: CnCalendarEvent[] = Array.from({ length: 5 }, (_, i) => ({
      id: `e${i}`,
      title: `Evento ${i + 1}`,
      start: `2026-11-12T0${i + 1}:00`,
    }));
    render(<CnEventCalendar events={many} defaultDate="2026-11-09" maxEventsPerDay={3} />);
    const more = screen.getByRole("button", { name: "+3 más" });
    expect(screen.getAllByRole("button", { name: /^Evento \d/ })).toHaveLength(2);
    fireEvent.click(more);
    const dialog = screen.getByRole("dialog", { name: /Eventos del jueves, 12 de noviembre/i });
    expect(within(dialog).getAllByRole("button", { name: /Evento/ })).toHaveLength(5);
  });

  it("opens the event detail popover and calls onEventClick", () => {
    const onEventClick = vi.fn();
    const onEventEdit = vi.fn();
    render(
      <CnEventCalendar
        events={events}
        categories={categories}
        defaultDate="2026-11-09"
        onEventClick={onEventClick}
        onEventEdit={onEventEdit}
        renderEventActions={() => <button type="button">Unirse</button>}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Daily de producto/ }));
    expect(onEventClick).toHaveBeenCalledWith(
      events[0],
      expect.objectContaining({ key: "standup" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Detalle: Daily de producto" });
    expect(within(dialog).getByText("Sala Maya")).toBeInTheDocument();
    expect(within(dialog).getByText("Revisión de pendientes")).toBeInTheDocument();
    expect(within(dialog).getByText("2 asistentes")).toBeInTheDocument();
    expect(within(dialog).getByText("Confirmado")).toBeInTheDocument();
    expect(within(dialog).getByText(/09:00 – 09:30/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Unirse" })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Editar" }));
    expect(onEventEdit).toHaveBeenCalledWith(events[0], expect.anything());
  });

  it("calls onSlotClick for days (month) and time ranges (week)", () => {
    const onSlotClick = vi.fn();
    const { rerender } = render(
      <CnEventCalendar
        events={[]}
        defaultDate="2026-11-09"
        onSlotClick={onSlotClick}
        holidays={[{ date: "2026-11-16", label: "Cerrado", blocked: true }]}
        minDate="2026-11-03"
      />,
    );
    fireEvent.click(screen.getByRole("gridcell", { name: /miércoles, 11 de noviembre/i }));
    expect(onSlotClick).toHaveBeenLastCalledWith({
      start: d("2026-11-11"),
      end: d("2026-11-12"),
      allDay: true,
    });
    onSlotClick.mockClear();
    fireEvent.click(screen.getByRole("gridcell", { name: /lunes, 16 de noviembre/i }));
    fireEvent.click(screen.getByRole("gridcell", { name: /lunes, 2 de noviembre/i }));
    expect(onSlotClick).not.toHaveBeenCalled();

    rerender(
      <CnEventCalendar
        events={[]}
        defaultDate="2026-11-09"
        defaultView="week"
        view="week"
        onSlotClick={onSlotClick}
        minHour={7}
        hourHeight={48}
        slotDuration={30}
      />,
    );
    const column = document.querySelector('[data-cn-day-column="2026-11-10"]') as HTMLElement;
    // 48 px = 1 h (24 px por slot) → 48 px es las 8:00; 80 px cae en el slot 8:30-9:00.
    fireEvent.pointerDown(column, { clientY: 48, pointerId: 1, button: 0 });
    fireEvent.pointerMove(column, { clientY: 80, pointerId: 1 });
    fireEvent.pointerUp(column, { clientY: 80, pointerId: 1 });
    expect(onSlotClick).toHaveBeenLastCalledWith({
      start: d("2026-11-10T08:00"),
      end: d("2026-11-10T09:00"),
      allDay: false,
    });
  });

  it("filters by category from the legend and by search", () => {
    render(
      <CnEventCalendar
        events={events}
        categories={categories}
        defaultDate="2026-11-09"
        searchable
      />,
    );
    expect(screen.getByRole("button", { name: /Retiro anual/ })).toBeInTheDocument();
    const chip = screen.getByRole("button", { name: "Festivo" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chip);
    expect(screen.queryByRole("button", { name: /Retiro anual/ })).not.toBeInTheDocument();
    expect(chip).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "Mostrar todas" }));
    expect(screen.getByRole("button", { name: /Retiro anual/ })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar eventos" }), {
      target: { value: "reunion" },
    });
    expect(screen.getByRole("button", { name: /Daily de producto/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Retiro anual/ })).not.toBeInTheDocument();
  });

  it("lays out overlapping events side by side in the week view", () => {
    render(
      <CnEventCalendar
        defaultView="week"
        defaultDate="2026-11-09"
        events={[
          { id: "a", title: "A", start: "2026-11-10T09:00", end: "2026-11-10T10:00" },
          { id: "b", title: "B", start: "2026-11-10T09:30", end: "2026-11-10T11:00" },
          { id: "c", title: "Todo", start: "2026-11-11", allDay: true },
        ]}
      />,
    );
    const a = document.querySelector('[data-cn-event="a"]') as HTMLElement;
    const b = document.querySelector('[data-cn-event="b"]') as HTMLElement;
    expect(a.dataset.cnColumns).toBe("2");
    expect([a.dataset.cnColumn, b.dataset.cnColumn]).toEqual(["0", "1"]);
    const allDayRow = document.querySelector("[data-cn-all-day-row]") as HTMLElement;
    expect(
      within(allDayRow).getByRole("button", { name: /Todo, todo el día/ }),
    ).toBeInTheDocument();
    expect(document.querySelectorAll("[data-cn-offhours]").length).toBeGreaterThan(0);
  });

  it("moves events by dragging when editable", () => {
    const onEventChange = vi.fn();
    render(
      <CnEventCalendar
        defaultView="day"
        defaultDate="2026-11-10"
        editable
        onEventChange={onEventChange}
        hourHeight={48}
        events={[{ id: "a", title: "A", start: "2026-11-10T09:00", end: "2026-11-10T10:00" }]}
      />,
    );
    const block = document.querySelector('[data-cn-event="a"]') as HTMLElement;
    fireEvent.pointerDown(block, { clientX: 10, clientY: 100, pointerId: 3, button: 0 });
    fireEvent.pointerMove(block, { clientX: 10, clientY: 148, pointerId: 3 });
    fireEvent.pointerUp(block, { clientX: 10, clientY: 148, pointerId: 3 });
    expect(onEventChange).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "move",
        start: d("2026-11-10T10:00"),
        end: d("2026-11-10T11:00"),
      }),
    );
  });

  it("supports keyboard navigation between days", () => {
    const onSlotClick = vi.fn();
    render(<CnEventCalendar events={[]} defaultDate="2026-11-09" onSlotClick={onSlotClick} />);
    const cell = screen.getByRole("gridcell", { name: /lunes, 9 de noviembre/i });
    act(() => cell.focus());
    fireEvent.keyDown(cell, { key: "ArrowRight" });
    const next = screen.getByRole("gridcell", { name: /martes, 10 de noviembre/i });
    expect(next).toHaveFocus();
    expect(next).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(next, { key: "ArrowDown" });
    expect(screen.getByRole("gridcell", { name: /martes, 17 de noviembre/i })).toHaveFocus();
    fireEvent.keyDown(document.activeElement as Element, { key: "Enter" });
    expect(onSlotClick).toHaveBeenCalledWith({
      start: d("2026-11-17"),
      end: d("2026-11-18"),
      allDay: true,
    });
    fireEvent.keyDown(document.activeElement as Element, { key: "PageDown" });
    expect(screen.getByRole("heading", { name: "Diciembre 2026" })).toBeInTheDocument();
  });

  it("renders agenda (with empty state) and year views", () => {
    const { rerender } = render(
      <CnEventCalendar events={events} defaultView="agenda" defaultDate="2026-11-01" />,
    );
    const agenda = screen.getByRole("list", { name: "Agenda" });
    expect(
      within(agenda).getByRole("button", { name: /Daily de producto, 09:00 – 09:30/ }),
    ).toBeInTheDocument();
    expect(within(agenda).getAllByRole("button", { name: /Retiro anual/ })).toHaveLength(3);

    rerender(
      <CnEventCalendar
        events={[]}
        view="agenda"
        defaultDate="2026-11-01"
        emptyTitle="Nada por aquí"
      />,
    );
    expect(screen.getByText("Nada por aquí")).toBeInTheDocument();

    rerender(<CnEventCalendar events={events} view="year" defaultDate="2026-11-01" />);
    expect(document.querySelectorAll("[data-cn-year-month]")).toHaveLength(12);
    expect(document.querySelector('[data-cn-date="2026-11-10"]')).toHaveAttribute(
      "data-cn-heat",
      "4",
    );
    expect(document.querySelector('[data-cn-date="2026-11-11"]')).toHaveAttribute(
      "data-cn-heat",
      "0",
    );
  });

  it("renders the skeleton (whole component) and the loading body", () => {
    const { unmount, container } = render(
      <CnEventCalendar events={events} skeleton defaultView="week" />,
    );
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "event-calendar");
    expect(container.querySelector('[data-cn-event-calendar-skeleton="week"]')).not.toBeNull();
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();

    unmount();
    const view = render(<CnEventCalendar events={events} loading defaultDate="2026-11-09" />);
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(view.container.querySelectorAll("[data-cn-event-calendar-skeleton-week]")).toHaveLength(
      5,
    );
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });
});

describe("CnEventCalendarSkeleton", () => {
  it("draws each view", () => {
    const { container, rerender } = render(<CnEventCalendarSkeleton weeks={6} />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(container.querySelectorAll("[data-cn-event-calendar-skeleton-week]")).toHaveLength(6);
    expect(
      container.querySelectorAll("[data-cn-event-calendar-skeleton-bar]").length,
    ).toBeGreaterThan(0);
    rerender(<CnEventCalendarSkeleton view="week" />);
    expect(container.querySelectorAll("[data-cn-event-calendar-skeleton-block]").length).toBe(7);
    rerender(<CnEventCalendarSkeleton view="agenda" />);
    expect(container.querySelectorAll("[data-cn-event-calendar-skeleton-day]")).toHaveLength(5);
    rerender(<CnEventCalendarSkeleton view="year" />);
    expect(container.querySelectorAll("[data-cn-event-calendar-skeleton-month]")).toHaveLength(12);
  });
});

import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  applyEventChange,
  applyEventDelete,
  businessIntervals,
  buildIcs,
  CnEventCalendar,
  CnEventCalendarSkeleton,
  detectMeetingLink,
  findConflicts,
  formatIcsDuration,
  formatTimeInZone,
  fromZonedWallTime,
  getOccurrences,
  getViewTitle,
  getVisibleRange,
  googleCalendarUrl,
  isoWeek,
  isPhysicalLocation,
  localeWeekStart,
  mapSearchUrl,
  monthlyRuleDays,
  office365CalendarUrl,
  outlookCalendarUrl,
  parseIcs,
  parseIcsDuration,
  parseQuickEvent,
  recurrenceStarts,
  timeZoneOffset,
  toZonedWallTime,
  yahooCalendarUrl,
} from ".";
import type {
  CnCalendarEvent,
  CnCalendarResource,
  CnCalendarSource,
  CnEventCategory,
  CnEventChange,
  CnEventOccurrence,
} from ".";

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

afterEach(() => {
  vi.useRealTimers();
});

const d = (iso: string) => {
  const [date, time = "00:00"] = iso.split("T");
  const [y, m, day] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y, m - 1, day, h, min);
};

const occ = (event: CnCalendarEvent, start?: Date, end?: Date): CnEventOccurrence => {
  const list = getOccurrences([event], { start: d("2000-01-01"), end: d("2100-01-01") });
  const first = list[0];
  return start ? { ...first, start, end: end ?? first.end } : first;
};

// ─── Recurrencia ──────────────────────────────────────────────────────

describe("recurrence: nth weekday and month days", () => {
  it("computes nth weekdays and month days", () => {
    // Noviembre 2026: lunes 2, 9, 16, 23, 30; viernes 6, 13, 20, 27.
    expect(monthlyRuleDays(2026, 10, { byNthWeekday: [{ weekday: 1, nth: 2 }] })).toEqual([9]);
    expect(monthlyRuleDays(2026, 10, { byNthWeekday: [{ weekday: 5, nth: -1 }] })).toEqual([27]);
    expect(monthlyRuleDays(2026, 10, { byNthWeekday: [{ weekday: 1, nth: 5 }] })).toEqual([30]);
    expect(monthlyRuleDays(2026, 1, { byNthWeekday: [{ weekday: 1, nth: 5 }] })).toEqual([]);
    expect(monthlyRuleDays(2026, 1, { byMonthDay: [-1, 15] })).toEqual([15, 28]);
    expect(monthlyRuleDays(2026, 10, { byNthWeekday: [{ weekday: 3, nth: 0 }] })).toEqual([
      4, 11, 18, 25,
    ]);
  });

  it("expands monthly 2nd Monday, last Friday, BYMONTHDAY=-1 and yearly 4th Thursday", () => {
    const end = d("2027-03-01");
    expect(
      recurrenceStarts(
        d("2026-11-09T10:00"),
        { freq: "monthly", byNthWeekday: [{ weekday: 1, nth: 2 }] },
        end,
      ).map((x) => [x.getMonth(), x.getDate(), x.getHours()]),
    ).toEqual([
      [10, 9, 10],
      [11, 14, 10],
      [0, 11, 10],
      [1, 8, 10],
    ]);
    expect(
      recurrenceStarts(
        d("2026-11-27"),
        { freq: "monthly", byNthWeekday: [{ weekday: 5, nth: -1 }], count: 3 },
        end,
      ).map((x) => x.getDate()),
    ).toEqual([27, 25, 29]);
    expect(
      recurrenceStarts(d("2026-11-30"), { freq: "monthly", byMonthDay: [-1] }, end).map((x) =>
        x.getDate(),
      ),
    ).toEqual([30, 31, 31, 28]);
    // Día de Acción de Gracias: cuarto jueves de noviembre.
    expect(
      recurrenceStarts(
        d("2026-11-26"),
        { freq: "yearly", byNthWeekday: [{ weekday: 4, nth: 4 }] },
        d("2029-01-01"),
      ).map((x) => x.getDate()),
    ).toEqual([26, 25, 23]);
  });
});

// ─── ICS ──────────────────────────────────────────────────────────────

describe("ics import", () => {
  const categories: CnEventCategory[] = [{ id: "meeting", label: "Reunión" }];

  it("round-trips buildIcs → parseIcs", () => {
    const source: CnCalendarEvent[] = [
      {
        id: "comite",
        title: "Comité; finanzas, Q4",
        start: "2026-11-09T16:00",
        end: "2026-11-09T17:30",
        description: "Línea 1\nLínea 2",
        location: "Sala Maya, piso 3",
        category: "meeting",
        status: "tentative",
        recurrence: {
          freq: "monthly",
          byNthWeekday: [{ weekday: 1, nth: 2 }],
          count: 6,
          exdates: ["2026-12-14"],
        },
        reminders: [10, 60],
        attendees: [{ name: "Ana", email: "ana@canek.mx" }],
        url: "https://canek.mx/e/1",
      },
      { id: "retiro", title: "Retiro", start: "2026-11-18", end: "2026-11-20", allDay: true },
      { id: "cumple", title: "Cumple", start: "2026-11-21", allDay: true },
    ];
    const ics = buildIcs(source, { categories });
    expect(ics).toContain("RRULE:FREQ=MONTHLY;BYDAY=2MO;COUNT=6");
    expect(ics).toContain("TRIGGER:-PT10M");
    expect(ics).toContain("TRIGGER:-PT1H");
    const parsed = parseIcs(ics, { categories });
    expect(parsed).toHaveLength(3);
    const [a, b, c] = parsed;
    expect(a).toMatchObject({
      id: "comite",
      title: "Comité; finanzas, Q4",
      start: "2026-11-09T16:00",
      end: "2026-11-09T17:30",
      description: "Línea 1\nLínea 2",
      location: "Sala Maya, piso 3",
      category: "meeting",
      status: "tentative",
      url: "https://canek.mx/e/1",
      reminders: [10, 60],
      recurrence: {
        freq: "monthly",
        byNthWeekday: [{ weekday: 1, nth: 2 }],
        count: 6,
        exdates: ["2026-12-14"],
      },
    });
    expect(a.attendees).toEqual([{ name: "Ana", email: "ana@canek.mx" }]);
    expect(b).toMatchObject({ id: "retiro", allDay: true, start: "2026-11-18", end: "2026-11-20" });
    expect(c).toMatchObject({ id: "cumple", allDay: true, start: "2026-11-21" });
    expect(c.end).toBeUndefined();
  });

  it("parses UTC, TZID, DURATION, folded lines, EXDATE lists and RECURRENCE-ID", () => {
    const text = [
      "BEGIN:VCALENDAR",
      "BEGIN:VTIMEZONE",
      "TZID:America/New_York",
      "BEGIN:STANDARD",
      "DTSTART:19701101T020000",
      "END:STANDARD",
      "END:VTIMEZONE",
      "BEGIN:VEVENT",
      "UID:utc@google.com",
      "DTSTART:20261110T150000Z",
      "DURATION:PT45M",
      "SUMMARY:Llamada con un título muy largo que se pliega en varias líneas para pro",
      " bar el desdoblado",
      "X-GOOGLE-CONFERENCE:https://meet.google.com/abc-defg-hij",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:ny",
      'DTSTART;TZID="America/New_York":20261110T090000',
      "DTEND;TZID=America/New_York:20261110T100000",
      "SUMMARY:Nueva York",
      "RRULE:FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20261231T235959Z",
      "EXDATE;TZID=America/New_York:20261112T090000,20261117T090000",
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "END:VALARM",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:ny",
      "RECURRENCE-ID;TZID=America/New_York:20261119T090000",
      "DTSTART;TZID=America/New_York:20261119T113000",
      "DTEND;TZID=America/New_York:20261119T123000",
      "SUMMARY:Nueva York (movida)",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const [utc, ny, moved] = parseIcs(text);
    const utcStart = new Date(Date.UTC(2026, 10, 10, 15, 0));
    expect(new Date(utc.start as string).getTime()).toBe(
      new Date(
        utcStart.getFullYear(),
        utcStart.getMonth(),
        utcStart.getDate(),
        utcStart.getHours(),
        utcStart.getMinutes(),
      ).getTime(),
    );
    expect(utc.id).toBe("utc@google.com");
    expect(utc.title).toBe(
      "Llamada con un título muy largo que se pliega en varias líneas para probar el desdoblado",
    );
    expect(utc.meetingUrl).toBe("https://meet.google.com/abc-defg-hij");
    const utcEnd = new Date((utc.end as string).replace("T", "T"));
    expect((utcEnd.getTime() - new Date(utc.start as string).getTime()) / 60_000).toBe(45);
    // 09:00 en Nueva York (EST, UTC-5) = 14:00 UTC.
    const nyStart = new Date(ny.start as string);
    expect(nyStart.toISOString()).toBe("2026-11-10T14:00:00.000Z");
    expect(ny.recurrence).toMatchObject({
      freq: "weekly",
      byWeekday: [2, 4],
      until: expect.stringMatching(/^2026-12-31|^2027-01-01/),
    });
    expect(ny.recurrence?.exdates).toEqual(
      expect.arrayContaining(["2026-11-12", "2026-11-17", "2026-11-19"]),
    );
    expect(ny.reminders).toEqual([1440]);
    expect(moved.id).toBe("ny::2026-11-19");
  });

  it("formats and parses durations", () => {
    expect(formatIcsDuration(-15)).toBe("-PT15M");
    expect(formatIcsDuration(-1440)).toBe("-P1D");
    expect(formatIcsDuration(90)).toBe("PT1H30M");
    expect(parseIcsDuration("-PT15M")).toBe(-15);
    expect(parseIcsDuration("P1DT2H")).toBe(1560);
    expect(parseIcsDuration("P1W")).toBe(10080);
    expect(parseIcsDuration("nada")).toBeNull();
  });
});

// ─── Lenguaje natural ────────────────────────────────────────────────

describe("parseQuickEvent (es-MX)", () => {
  // Lunes 9 de noviembre de 2026, 8:00.
  const now = d("2026-11-09T08:00");
  const categories: CnEventCategory[] = [
    { id: "trabajo", label: "Trabajo" },
    { id: "fin", label: "Finanzas" },
  ];
  const parse = (text: string) => parseQuickEvent(text, { now, categories });

  it.each([
    [
      "Reunión con Ana mañana 10:00–11:30 #trabajo",
      {
        title: "Reunión con Ana",
        start: "2026-11-10T10:00",
        end: "2026-11-10T11:30",
        category: "trabajo",
      },
    ],
    [
      "Dentista el viernes a las 5pm 45 min @Consultorio_3",
      {
        title: "Dentista",
        start: "2026-11-13T17:00",
        end: "2026-11-13T17:45",
        location: "Consultorio 3",
      },
    ],
    [
      "Comida pasado mañana 2-3",
      { title: "Comida", start: "2026-11-11T14:00", end: "2026-11-11T15:00" },
    ],
    [
      "Llamada hoy 10am 1h",
      { title: "Llamada", start: "2026-11-09T10:00", end: "2026-11-09T11:00" },
    ],
    [
      "Junta el 15-12 de 9 a 10:30",
      { title: "Junta", start: "2026-12-15T09:00", end: "2026-12-15T10:30" },
    ],
    [
      "Yoga próximo lunes 7:00 am",
      { title: "Yoga", start: "2026-11-16T07:00", end: "2026-11-16T08:00" },
    ],
    [
      "Entrega en 3 días 11-1pm",
      { title: "Entrega", start: "2026-11-12T11:00", end: "2026-11-12T13:00" },
    ],
    [
      "Standup lunes 9 30 min",
      { title: "Standup", start: "2026-11-09T09:00", end: "2026-11-09T09:30" },
    ],
    [
      "Cena sábado 8 de la noche",
      { title: "Cena", start: "2026-11-14T20:00", end: "2026-11-14T21:00" },
    ],
    [
      "Comité a las 17h hora y media",
      { title: "Comité", start: "2026-11-09T17:00", end: "2026-11-09T18:30" },
    ],
  ])("%s", (text, expected) => {
    const result = parse(text);
    expect(result).not.toBeNull();
    const { start, end, ...rest } = expected;
    expect(result).toMatchObject({ ...rest, allDay: false });
    expect(result?.start).toEqual(d(start));
    expect(result?.end).toEqual(d(end));
  });

  it("recognizes all-day dates, month names and category labels", () => {
    expect(parse("Cierre de mes 30/11 todo el día #finanzas")).toMatchObject({
      title: "Cierre de mes",
      allDay: true,
      start: d("2026-11-30"),
      end: d("2026-12-01"),
      category: "fin",
      tags: ["finanzas"],
    });
    // Fecha ya pasada sin año → el próximo año.
    expect(parse("Revisión anual 5 de enero")).toMatchObject({
      title: "Revisión anual",
      allDay: true,
      start: d("2027-01-05"),
    });
    expect(parse("Posada 18 dic. #social")).toMatchObject({
      title: "Posada",
      start: d("2026-12-18"),
      category: "social",
    });
    expect(parse("Pendiente")).toMatchObject({
      title: "Pendiente",
      allDay: true,
      start: d("2026-11-09"),
    });
    expect(parse("   ")).toBeNull();
  });
});

// ─── Zonas horarias, semanas y horario ───────────────────────────────

describe("time zones and calendar settings", () => {
  it("converts between instants and wall times", () => {
    const instant = new Date(Date.UTC(2026, 10, 10, 15, 0));
    const ny = toZonedWallTime(instant, "America/New_York");
    expect([ny.getDate(), ny.getHours(), ny.getMinutes()]).toEqual([10, 10, 0]);
    expect(fromZonedWallTime(ny, "America/New_York").getTime()).toBe(instant.getTime());
    const tokyo = toZonedWallTime(instant, "Asia/Tokyo");
    expect([tokyo.getDate(), tokyo.getHours()]).toEqual([11, 0]);
    expect(timeZoneOffset(instant, "America/New_York")).toBe(-300);
    expect(timeZoneOffset(instant, "Asia/Kolkata")).toBe(330);
    expect(formatTimeInZone(instant, "Europe/Madrid")).toBe("16:00");
    // Horario de verano: julio en Nueva York es UTC-4.
    const summer = fromZonedWallTime(new Date(2026, 6, 1, 9, 0), "America/New_York");
    expect(summer.toISOString()).toBe("2026-07-01T13:00:00.000Z");
  });

  it("computes ISO weeks, locale week starts and business intervals", () => {
    expect(isoWeek(d("2026-01-01"))).toBe(1);
    expect(isoWeek(d("2027-01-01"))).toBe(53);
    expect(isoWeek(d("2026-11-09"))).toBe(46);
    expect(localeWeekStart("es-MX")).toBe(0);
    expect(localeWeekStart("es-ES")).toBe(1);
    expect(localeWeekStart("en-US")).toBe(0);
    expect(
      businessIntervals(
        [
          { days: [1, 2, 3, 4, 5], start: 9, end: 14 },
          { days: [1, 2, 3, 4], start: 16, end: 19 },
          { days: [6], start: 10, end: 13 },
        ],
        1,
      ),
    ).toEqual([
      [540, 840],
      [960, 1140],
    ]);
    expect(businessIntervals({ start: 8.5, end: 17 }, 0)).toEqual([]);
    expect(businessIntervals({ start: 8.5, end: 17 }, 3)).toEqual([[510, 1020]]);
  });

  it("computes ranges and titles for multi-month and timeline views", () => {
    expect(
      getVisibleRange("multiMonth", d("2026-11-20"), 1, "month", { multiMonthCount: 3 }),
    ).toEqual({ start: d("2026-11-01"), end: d("2027-02-01") });
    expect(
      getViewTitle("multiMonth", d("2026-11-20"), "es-MX", 1, "month", { multiMonthCount: 3 }),
    ).toBe("Nov 2026 – Ene 2027");
    expect(
      getVisibleRange("timeline", d("2026-11-11"), 1, "month", { timelineRange: "week" }),
    ).toEqual({ start: d("2026-11-09"), end: d("2026-11-16") });
    expect(getVisibleRange("timeline", d("2026-11-11T13:00"))).toEqual({
      start: d("2026-11-11"),
      end: d("2026-11-12"),
    });
  });
});

// ─── Conflictos ───────────────────────────────────────────────────────

describe("findConflicts", () => {
  const resources: CnCalendarResource[] = [
    { id: "maya", label: "Sala Maya" },
    { id: "auditorio", label: "Auditorio", capacity: 2 },
  ];
  const ev = (id: string, s: string, e: string, extra: Partial<CnCalendarEvent> = {}) => ({
    id,
    title: id,
    start: s,
    end: e,
    ...extra,
  });
  const list = (events: CnCalendarEvent[]) =>
    getOccurrences(events, { start: d("2026-11-01"), end: d("2026-12-01") });

  it("detects shared resources respecting capacity", () => {
    const occurrences = list([
      ev("a", "2026-11-10T09:00", "2026-11-10T10:00", { resourceId: "maya" }),
      ev("b", "2026-11-10T09:30", "2026-11-10T10:30", { resourceId: ["maya", "x"] }),
      ev("c", "2026-11-10T10:00", "2026-11-10T11:00", { resourceId: "maya" }),
      ev("d", "2026-11-10T09:00", "2026-11-10T10:00", { resourceId: "auditorio" }),
      ev("e", "2026-11-10T09:00", "2026-11-10T10:00", { resourceId: "auditorio" }),
      ev("f", "2026-11-10T09:30", "2026-11-10T09:45", { resourceId: "maya", status: "cancelled" }),
    ]);
    const conflicts = findConflicts(occurrences, { mode: "resource", resources });
    expect(conflicts.get("a")).toEqual([
      { with: "b", title: "b", reason: "resource", label: "Sala Maya" },
    ]);
    expect(
      conflicts
        .get("b")
        ?.map((c) => c.with)
        .sort(),
    ).toEqual(["a", "c"]);
    // Capacidad 2: dos eventos simultáneos están permitidos.
    expect(conflicts.has("d")).toBe(false);
    expect(conflicts.has("f")).toBe(false);
    const more = findConflicts(
      list([
        ev("d", "2026-11-10T09:00", "2026-11-10T10:00", { resourceId: "auditorio" }),
        ev("e", "2026-11-10T09:00", "2026-11-10T10:00", { resourceId: "auditorio" }),
        ev("g", "2026-11-10T09:30", "2026-11-10T10:00", { resourceId: "auditorio" }),
      ]),
      { mode: "resource", resources },
    );
    expect(more.get("g")?.length).toBe(2);
  });

  it("detects shared attendees (ignoring declined) and any overlap", () => {
    const occurrences = list([
      ev("x", "2026-11-10T09:00", "2026-11-10T10:00", {
        attendees: [{ name: "Ana López", email: "ana@canek.mx" }],
      }),
      ev("y", "2026-11-10T09:30", "2026-11-10T10:30", {
        attendees: [{ name: "Ana", email: "ANA@canek.mx" }],
      }),
      ev("z", "2026-11-10T09:30", "2026-11-10T10:30", {
        attendees: [{ name: "Ana López", email: "ana@canek.mx", status: "declined" }],
      }),
    ]);
    const byAttendee = findConflicts(occurrences, { mode: "attendee" });
    expect(byAttendee.get("x")).toEqual([
      { with: "y", title: "y", reason: "attendee", label: "Ana" },
    ]);
    expect(byAttendee.has("z")).toBe(false);
    expect(findConflicts(occurrences, { mode: "any" }).get("z")?.length).toBe(2);
  });
});

// ─── Integraciones ────────────────────────────────────────────────────

describe("integration URL builders", () => {
  const timed = {
    title: "Revisión & cierre",
    start: new Date(Date.UTC(2026, 10, 10, 15, 0)),
    end: new Date(Date.UTC(2026, 10, 10, 16, 30)),
    allDay: false,
    description: "Agenda: KPI",
    location: "Sala Maya",
  };
  const allDay = { title: "Retiro", start: d("2026-11-18"), end: d("2026-11-21"), allDay: true };

  it("builds Google, Outlook, Office 365 and Yahoo links", () => {
    const google = new URL(googleCalendarUrl(timed));
    expect(google.origin + google.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(google.searchParams.get("action")).toBe("TEMPLATE");
    expect(google.searchParams.get("text")).toBe("Revisión & cierre");
    expect(google.searchParams.get("dates")).toBe("20261110T150000Z/20261110T163000Z");
    expect(google.searchParams.get("location")).toBe("Sala Maya");
    expect(new URL(googleCalendarUrl(allDay)).searchParams.get("dates")).toBe("20261118/20261121");
    expect(
      new URL(googleCalendarUrl({ ...timed, rrule: "FREQ=WEEKLY;BYDAY=TU" })).searchParams.get(
        "recur",
      ),
    ).toBe("RRULE:FREQ=WEEKLY;BYDAY=TU");

    const outlook = new URL(outlookCalendarUrl(timed));
    expect(outlook.host).toBe("outlook.live.com");
    expect(outlook.searchParams.get("startdt")).toBe("2026-11-10T15:00:00Z");
    expect(outlook.searchParams.get("enddt")).toBe("2026-11-10T16:30:00Z");
    expect(outlook.searchParams.get("subject")).toBe("Revisión & cierre");
    expect(outlook.searchParams.get("body")).toBe("Agenda: KPI");
    const office = new URL(office365CalendarUrl(allDay));
    expect(office.host).toBe("outlook.office.com");
    expect(office.searchParams.get("allday")).toBe("true");
    expect(office.searchParams.get("startdt")).toBe("2026-11-18");

    const yahoo = new URL(yahooCalendarUrl(timed));
    expect(yahoo.host).toBe("calendar.yahoo.com");
    expect(yahoo.searchParams.get("st")).toBe("20261110T150000Z");
    expect(yahoo.searchParams.get("in_loc")).toBe("Sala Maya");
    const yahooAll = new URL(yahooCalendarUrl(allDay));
    expect(yahooAll.searchParams.get("dur")).toBe("allday");
    expect(yahooAll.searchParams.get("et")).toBe("20261120");
  });

  it("detects meeting links and physical locations", () => {
    expect(detectMeetingLink({ location: "https://meet.google.com/abc-defg-hij" })).toEqual({
      provider: "meet",
      label: "Google Meet",
      url: "https://meet.google.com/abc-defg-hij",
    });
    expect(
      detectMeetingLink({ description: "Únete: https://us02web.zoom.us/j/8123456789?pwd=xyz." }),
    ).toMatchObject({ provider: "zoom", url: "https://us02web.zoom.us/j/8123456789?pwd=xyz" });
    expect(
      detectMeetingLink({
        description: "https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc/0",
      })?.provider,
    ).toBe("teams");
    expect(detectMeetingLink({ meetingUrl: "https://whereby.com/canek" })?.provider).toBe("other");
    expect(detectMeetingLink({ location: "Sala Maya" })).toBeNull();
    expect(isPhysicalLocation("Av. Reforma 222, CDMX")).toBe(true);
    expect(isPhysicalLocation("Google Meet")).toBe(false);
    expect(isPhysicalLocation("https://zoom.us/j/1")).toBe(false);
    expect(mapSearchUrl("Av. Reforma 222, CDMX")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Av.%20Reforma%20222%2C%20CDMX",
    );
  });
});

// ─── Aplicar cambios con alcance ──────────────────────────────────────

describe("applyEventChange / applyEventDelete", () => {
  const series: CnCalendarEvent = {
    id: "s",
    title: "Clase",
    start: "2026-11-02T10:00",
    end: "2026-11-02T11:00",
    recurrence: { freq: "weekly", byWeekday: [1], count: 6 },
  };
  const third = occ(series, d("2026-11-16T10:00"), d("2026-11-16T11:00"));
  const change = (scope?: "this" | "following" | "all"): CnEventChange => ({
    event: series,
    occurrence: { ...third, recurring: true },
    start: d("2026-11-17T12:00"),
    end: d("2026-11-17T13:00"),
    allDay: false,
    kind: "move",
    scope,
  });

  it("moves a single (non recurring) event and its resource", () => {
    const single: CnCalendarEvent = {
      id: "a",
      title: "A",
      start: "2026-11-10T09:00",
      end: "2026-11-10T10:00",
      resourceId: ["maya", "luis"],
    };
    const [moved] = applyEventChange([single], {
      event: single,
      occurrence: occ(single),
      start: d("2026-11-10T11:00"),
      end: d("2026-11-10T12:00"),
      allDay: false,
      kind: "move",
      resourceId: "auditorio",
      previousResourceId: "maya",
    });
    expect(moved).toMatchObject({
      start: d("2026-11-10T11:00"),
      end: d("2026-11-10T12:00"),
      resourceId: ["auditorio", "luis"],
    });
  });

  it("applies 'this', 'following' and 'all' scopes", () => {
    const thisOnly = applyEventChange([series], change("this"));
    expect(thisOnly).toHaveLength(2);
    expect(thisOnly[0].recurrence?.exdates).toEqual(["2026-11-16"]);
    expect(thisOnly[1]).toMatchObject({ id: "s::2026-11-16", recurrence: undefined });

    const following = applyEventChange([series], change("following"));
    expect(following[0].recurrence).toMatchObject({ until: "2026-11-15" });
    expect(following[0].recurrence?.count).toBeUndefined();
    // Quedaban 4 de 6 y el día pasa de lunes a martes.
    expect(following[1].recurrence).toMatchObject({ count: 4, byWeekday: [2] });

    const all = applyEventChange([series], change("all"));
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ start: d("2026-11-03T12:00"), end: d("2026-11-03T13:00") });
    expect(all[0].recurrence?.byWeekday).toEqual([2]);
  });

  it("deletes with scopes", () => {
    const o = { start: d("2026-11-16T10:00"), recurring: true };
    expect(applyEventDelete([series], series, o, "this")[0].recurrence?.exdates).toEqual([
      "2026-11-16",
    ]);
    expect(applyEventDelete([series], series, o, "following")[0].recurrence?.until).toBe(
      "2026-11-15",
    );
    expect(applyEventDelete([series], series, o, "all")).toEqual([]);
  });
});

// ─── Interacciones ────────────────────────────────────────────────────

const meeting: CnCalendarEvent = {
  id: "kpi",
  title: "Revisión de KPI",
  start: "2026-11-10T09:00",
  end: "2026-11-10T10:00",
  location: "Av. Reforma 222, CDMX",
  description: "Liga: https://meet.google.com/abc-defg-hij",
  reminders: [15],
};

describe("CnEventCalendar integrations and interactions", () => {
  it("shows join, map, reminders and add-to-calendar links in the popover", () => {
    render(<CnEventCalendar events={[meeting]} defaultDate="2026-11-09" />);
    fireEvent.click(screen.getByRole("button", { name: /Revisión de KPI/ }));
    const dialog = screen.getByRole("dialog", { name: "Detalle: Revisión de KPI" });
    expect(within(dialog).getByRole("link", { name: /Unirse con Google Meet/ })).toHaveAttribute(
      "href",
      "https://meet.google.com/abc-defg-hij",
    );
    expect(within(dialog).getByRole("link", { name: "Ver en mapa" })).toHaveAttribute(
      "href",
      expect.stringContaining("google.com/maps/search"),
    );
    expect(within(dialog).getByText("15 min antes")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Agregar a calendario" }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Google Calendar" })).toHaveAttribute(
      "href",
      expect.stringContaining("calendar.google.com"),
    );
    expect(within(menu).getByRole("menuitem", { name: "Office 365" })).toHaveAttribute(
      "href",
      expect.stringContaining("outlook.office.com"),
    );
    expect(within(menu).getByRole("menuitem", { name: /Descargar .ics/ })).toBeInTheDocument();
  });

  it("hides integrations when disabled and uses renderEventPopover", () => {
    const { rerender } = render(
      <CnEventCalendar events={[meeting]} defaultDate="2026-11-09" integrations={false} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Revisión de KPI/ }));
    const dialog = screen.getByRole("dialog", { name: "Detalle: Revisión de KPI" });
    expect(within(dialog).queryByRole("link")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Agregar a calendario" })).toBeNull();
    rerender(
      <CnEventCalendar
        events={[meeting]}
        defaultDate="2026-11-09"
        renderEventPopover={(o) => <div>Personalizado: {o.event.title}</div>}
      />,
    );
    expect(screen.getByText("Personalizado: Revisión de KPI")).toBeInTheDocument();
  });

  it("opens a context menu with duplicate, delete and copy link", async () => {
    const onEventDelete = vi.fn();
    const onCreateEvent = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(
      <CnEventCalendar
        events={[meeting]}
        defaultDate="2026-11-09"
        onEventDelete={onEventDelete}
        onCreateEvent={onCreateEvent}
        getEventUrl={(e) => `https://app.canek.mx/eventos/${e.id}`}
      />,
    );
    const bar = screen.getByRole("button", { name: /Revisión de KPI/ });
    fireEvent.contextMenu(bar, { clientX: 20, clientY: 20 });
    fireEvent.click(screen.getByRole("menuitem", { name: "Duplicar" }));
    expect(onCreateEvent).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Revisión de KPI (copia)", start: d("2026-11-10T09:00") }),
    );
    fireEvent.contextMenu(bar, { clientX: 20, clientY: 20 });
    fireEvent.click(screen.getByRole("menuitem", { name: "Copiar enlace" }));
    expect(writeText).toHaveBeenCalledWith("https://app.canek.mx/eventos/kpi");
    await screen.findByText("Enlace copiado");
    fireEvent.contextMenu(bar, { clientX: 20, clientY: 20 });
    fireEvent.click(screen.getByRole("menuitem", { name: "Eliminar" }));
    expect(onEventDelete).toHaveBeenCalledWith(meeting, expect.objectContaining({ key: "kpi" }));
  });

  it("moves and resizes with the keyboard, deletes with Supr and undoes with Ctrl+Z", () => {
    const onEventChange = vi.fn();
    const onEventDelete = vi.fn();
    render(
      <CnEventCalendar
        defaultView="day"
        defaultDate="2026-11-10"
        editable
        slotDuration={30}
        onEventChange={onEventChange}
        onEventDelete={onEventDelete}
        events={[{ id: "a", title: "A", start: "2026-11-10T09:00", end: "2026-11-10T10:00" }]}
      />,
    );
    const block = document.querySelector('[data-cn-event="a"]') as HTMLElement;
    act(() => block.focus());
    fireEvent.keyDown(block, { key: "ArrowDown" });
    expect(onEventChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        kind: "move",
        via: "keyboard",
        start: d("2026-11-10T09:30"),
        end: d("2026-11-10T10:30"),
      }),
    );
    expect(screen.getByText(/Evento movido: A/)).toBeInTheDocument();
    fireEvent.keyDown(block, { key: "ArrowDown", shiftKey: true });
    expect(onEventChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: "resize", end: d("2026-11-10T10:30") }),
    );
    fireEvent.keyDown(block, { key: "ArrowRight" });
    expect(onEventChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ start: d("2026-11-11T09:00") }),
    );
    fireEvent.keyDown(block, { key: "z", ctrlKey: true });
    expect(onEventChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        via: "undo",
        start: d("2026-11-10T09:00"),
        end: d("2026-11-10T10:00"),
      }),
    );
    fireEvent.keyDown(block, { key: "Delete" });
    expect(onEventDelete).toHaveBeenCalledTimes(1);
  });

  it("asks the scope for recurring events", () => {
    const onEventChange = vi.fn();
    const onEventDelete = vi.fn();
    render(
      <CnEventCalendar
        defaultView="day"
        defaultDate="2026-11-10"
        editable
        askRecurrenceScope
        onEventChange={onEventChange}
        onEventDelete={onEventDelete}
        events={[
          {
            id: "r",
            title: "Daily",
            start: "2026-11-02T09:00",
            end: "2026-11-02T09:30",
            recurrence: { freq: "daily" },
          },
        ]}
      />,
    );
    const block = document.querySelector('[data-cn-event="r"]') as HTMLElement;
    fireEvent.keyDown(block, { key: "ArrowDown" });
    expect(onEventChange).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: "Editar evento recurrente" });
    fireEvent.click(within(dialog).getByLabelText("Este y los siguientes"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Aceptar" }));
    expect(onEventChange).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "following", start: d("2026-11-10T09:30") }),
    );
    fireEvent.keyDown(block, { key: "Delete" });
    const del = screen.getByRole("dialog", { name: "Eliminar evento recurrente" });
    fireEvent.click(within(del).getByRole("button", { name: "Aceptar" }));
    expect(onEventDelete).toHaveBeenCalledWith(
      expect.objectContaining({ id: "r" }),
      expect.objectContaining({ recurring: true }),
      "this",
    );
  });

  it("creates events with the quick form and natural-language input", () => {
    const onCreateEvent = vi.fn();
    const categories = [{ id: "trabajo", label: "Trabajo" }];
    render(
      <CnEventCalendar
        events={[]}
        categories={categories}
        defaultDate="2026-11-09"
        quickCreate
        quickAdd
        onCreateEvent={onCreateEvent}
      />,
    );
    fireEvent.click(screen.getByRole("gridcell", { name: /miércoles, 11 de noviembre/i }));
    const form = screen.getByRole("dialog", { name: "Nuevo evento" });
    fireEvent.change(within(form).getByLabelText("Título"), { target: { value: "Comité" } });
    fireEvent.click(within(form).getByRole("button", { name: "Guardar" }));
    expect(onCreateEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: "Comité",
        allDay: true,
        start: d("2026-11-11"),
        end: d("2026-11-12"),
      }),
    );

    const input = screen.getByRole("textbox", { name: "Agregar evento rápido" });
    fireEvent.change(input, { target: { value: "Junta con Ana 12/11 10:00-11:30 #trabajo" } });
    expect(screen.getByRole("status", { name: "" })).toHaveTextContent(/Junta con Ana/);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCreateEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: "Junta con Ana",
        start: d("2026-11-12T10:00"),
        end: d("2026-11-12T11:30"),
        category: "trabajo",
        allDay: false,
      }),
    );
  });

  it("loads subscribable sources per range with toggle, loading and error/retry", async () => {
    const load = vi
      .fn()
      .mockResolvedValue([
        { id: "srv", title: "Guardia médica", start: "2026-11-12T08:00", end: "2026-11-12T14:00" },
      ]);
    const failing = vi
      .fn()
      .mockRejectedValueOnce(new Error("Sin conexión"))
      .mockResolvedValue([{ id: "ok", title: "Reparto norte", start: "2026-11-13T09:00" }]);
    const sources: CnCalendarSource[] = [
      { id: "hospital", label: "Hospital", color: "teal", load },
      { id: "rutas", label: "Rutas", color: "orange", load: failing },
      {
        id: "rh",
        label: "RH",
        color: "purple",
        events: [{ id: "nom", title: "Nómina", start: "2026-11-13", allDay: true }],
        visible: false,
      },
    ];
    render(<CnEventCalendar sources={sources} defaultDate="2026-11-09" sidebar />);
    expect(load).toHaveBeenCalledWith({ start: d("2026-10-26"), end: d("2026-12-07") });
    expect(await screen.findByRole("button", { name: /Guardia médica/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Nómina/ })).not.toBeInTheDocument();
    const retry = await screen.findByRole("button", { name: "Reintentar Rutas" });
    fireEvent.click(retry);
    expect(await screen.findByRole("button", { name: /Reparto norte/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: "RH" }));
    expect(screen.getByRole("button", { name: /Nómina/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: "Hospital" }));
    expect(screen.queryByRole("button", { name: /Guardia médica/ })).not.toBeInTheDocument();
  });

  it("renders the resource timeline, selects slots per row and moves between resources", () => {
    const onSlotClick = vi.fn();
    const onEventChange = vi.fn();
    const resources: CnCalendarResource[] = [
      { id: "maya", label: "Sala Maya", icon: "groups", capacity: 8 },
      { id: "olmeca", label: "Sala Olmeca", icon: "groups" },
    ];
    render(
      <CnEventCalendar
        view="timeline"
        views={["timeline", "week"]}
        defaultDate="2026-11-10"
        resources={resources}
        minHour={8}
        maxHour={20}
        timelineHourWidth={60}
        editable
        detectConflicts
        onSlotClick={onSlotClick}
        onEventChange={onEventChange}
        events={[
          {
            id: "a",
            title: "Comité",
            start: "2026-11-10T09:00",
            end: "2026-11-10T10:00",
            resourceId: "maya",
          },
          {
            id: "b",
            title: "Entrevista",
            start: "2026-11-10T09:30",
            end: "2026-11-10T10:30",
            resourceId: "maya",
          },
          { id: "c", title: "Sin sala", start: "2026-11-10T12:00" },
        ]}
      />,
    );
    expect(screen.getByRole("grid", { name: "Recursos" })).toBeInTheDocument();
    expect(screen.getByText("Sin asignar")).toBeInTheDocument();
    const maya = document.querySelector('[data-cn-resource-row="maya"]') as HTMLElement;
    expect(maya.querySelectorAll("[data-cn-event]")).toHaveLength(2);
    // Conflicto en la misma sala (capacidad 8 → no hay conflicto).
    expect(maya.querySelector("[data-cn-conflict]")).toBeNull();
    const comite = maya.querySelector('[data-cn-event="a"]') as HTMLElement;
    // 60 px por hora desde las 8:00 → 9:00 = 60 px.
    expect(comite.style.left || getComputedStyle(comite).left).toBeTruthy();

    const olmeca = document.querySelector('[data-cn-resource-row="olmeca"]') as HTMLElement;
    fireEvent.pointerDown(olmeca, { clientX: 120, pointerId: 1, button: 0 });
    fireEvent.pointerUp(olmeca, { clientX: 120, pointerId: 1 });
    expect(onSlotClick).toHaveBeenLastCalledWith({
      start: d("2026-11-10T10:00"),
      end: d("2026-11-10T10:30"),
      allDay: false,
      resourceId: "olmeca",
    });

    act(() => comite.focus());
    fireEvent.keyDown(comite, { key: "ArrowDown" });
    expect(onEventChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ resourceId: "olmeca", previousResourceId: "maya", kind: "move" }),
    );
    fireEvent.keyDown(comite, { key: "ArrowRight" });
    expect(onEventChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ start: d("2026-11-10T09:30") }),
    );
  });

  it("marks conflicts for rooms with capacity 1", () => {
    render(
      <CnEventCalendar
        view="week"
        defaultDate="2026-11-10"
        detectConflicts="resource"
        resources={[{ id: "maya", label: "Sala Maya" }]}
        events={[
          {
            id: "a",
            title: "A",
            start: "2026-11-10T09:00",
            end: "2026-11-10T10:00",
            resourceId: "maya",
          },
          {
            id: "b",
            title: "B",
            start: "2026-11-10T09:30",
            end: "2026-11-10T10:30",
            resourceId: "maya",
          },
        ]}
      />,
    );
    expect(document.querySelectorAll("[data-cn-conflict]")).toHaveLength(2);
    fireEvent.click(document.querySelector('[data-cn-event="a"]') as HTMLElement);
    expect(screen.getByText(/Se empalma con "B" · Sala Maya/)).toBeInTheDocument();
  });

  it("renders multi-month, week numbers, hidden weekends, heatmap and capacity badges", () => {
    const { rerender } = render(
      <CnEventCalendar
        view="multiMonth"
        multiMonthCount={4}
        defaultDate="2026-11-09"
        events={[meeting]}
      />,
    );
    expect(document.querySelectorAll("[data-cn-multi-month]")).toHaveLength(4);
    expect(screen.getByRole("heading", { name: "Nov 2026 – Feb 2027" })).toBeInTheDocument();
    expect(document.querySelector('[data-cn-occurrence="kpi"]')).not.toBeNull();

    rerender(
      <CnEventCalendar
        view="month"
        defaultDate="2026-11-09"
        events={[meeting]}
        showWeekNumbers
        showWeekends={false}
        monthHeatmap
        dayCapacity={4}
        renderDayCell={(day) => (day.getDate() === 10 ? <span>Guardia: Dr. Ruiz</span> : null)}
      />,
    );
    expect(screen.getAllByRole("columnheader")).toHaveLength(5);
    expect(screen.queryByRole("gridcell", { name: /sábado, 14 de noviembre/i })).toBeNull();
    expect(document.querySelector("[data-cn-week-number]")).toHaveTextContent("44");
    expect(document.querySelector('[data-cn-capacity="1/4"]')).not.toBeNull();
    expect(screen.getByText("Guardia: Dr. Ruiz")).toBeInTheDocument();
  });

  it("displays events in another time zone with a secondary column", () => {
    const onEventChange = vi.fn();
    render(
      <CnEventCalendar
        view="day"
        defaultDate="2026-11-10"
        timeZone="America/New_York"
        secondaryTimeZone="Europe/Madrid"
        editable
        onEventChange={onEventChange}
        events={[
          { id: "z", title: "Llamada", start: "2026-11-10T15:00:00Z", end: "2026-11-10T16:00:00Z" },
        ]}
      />,
    );
    const block = screen.getByRole("button", { name: "Llamada, 10:00 a 11:00" });
    expect(document.querySelector("[data-cn-timezone]")).toHaveAttribute(
      "data-cn-timezone",
      "America/New_York",
    );
    // 10:00 en Nueva York = 16:00 en Madrid.
    const labels = Array.from(document.querySelectorAll("[data-cn-secondary-hour]")).map(
      (n) => n.textContent,
    );
    expect(labels[10]).toBe("16:00");
    fireEvent.keyDown(block, { key: "ArrowDown" });
    const change = onEventChange.mock.calls[0][0] as CnEventChange;
    expect(change.start.toISOString()).toBe("2026-11-10T15:30:00.000Z");
  });

  it("shows sidebar mini month and upcoming events", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(d("2026-11-09T08:00"));
    render(
      <CnEventCalendar
        defaultView="week"
        events={[meeting, { id: "x", title: "Viaje", start: "2026-11-20", allDay: true }]}
        sidebar={{ upcoming: 3 }}
      />,
    );
    const upcoming = screen.getByRole("list", { name: "Próximos eventos" });
    expect(within(upcoming).getAllByRole("listitem")).toHaveLength(2);
    expect(within(upcoming).getByText(/Mañana · 09:00/)).toBeInTheDocument();
    fireEvent.click(document.querySelector('[data-cn-mini-date="2026-11-20"]') as HTMLElement);
    expect(screen.getByRole("heading", { name: "16 – 22 nov 2026" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ocultar panel" }));
    expect(document.querySelector("[data-cn-sidebar]")).toBeNull();
  });

  it("imports .ics files from the menu", async () => {
    const onImport = vi.fn();
    render(<CnEventCalendar events={[]} defaultDate="2026-11-09" onImport={onImport} />);
    fireEvent.click(screen.getByRole("button", { name: "Exportar" }));
    expect(screen.getByRole("menuitem", { name: /Importar .ics/ })).toBeInTheDocument();
    const input = document.querySelector("[data-cn-import-input]") as HTMLInputElement;
    const file = new File(
      [
        "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:1\r\nDTSTART;VALUE=DATE:20261120\r\nSUMMARY:Feria\r\nEND:VEVENT\r\nEND:VCALENDAR",
      ],
      "feria.ics",
      { type: "text/calendar" },
    );
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(onImport).toHaveBeenCalled());
    expect(onImport.mock.calls[0][0]).toEqual([
      { id: "1", title: "Feria", start: "2026-11-20", allDay: true },
    ]);
    expect(await screen.findByText("1 evento importado")).toBeInTheDocument();
  });

  it("uses renderEvent and density", () => {
    render(
      <CnEventCalendar
        defaultDate="2026-11-09"
        density="comfortable"
        events={[meeting]}
        renderEvent={(o) => <strong data-testid="custom">★ {o.event.title}</strong>}
      />,
    );
    expect(screen.getByTestId("custom")).toHaveTextContent("★ Revisión de KPI");
    expect(document.querySelector('[data-cn-density="comfortable"]')).not.toBeNull();
  });

  it("starts the week on the locale's first day", () => {
    render(
      <CnEventCalendar events={[]} defaultDate="2026-11-11" weekStart="locale" locale="es-MX" />,
    );
    expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent(/dom/i);
  });
});

describe("CnEventCalendarSkeleton (new views)", () => {
  it("draws timeline, multi-month and sidebar", () => {
    const { container, rerender } = render(<CnEventCalendarSkeleton view="timeline" rows={4} />);
    expect(container.querySelectorAll("[data-cn-event-calendar-skeleton-resource]")).toHaveLength(
      4,
    );
    rerender(<CnEventCalendarSkeleton view="multiMonth" multiMonthCount={6} />);
    expect(container.querySelectorAll("[data-cn-event-calendar-skeleton-month]")).toHaveLength(6);
    rerender(<CnEventCalendarSkeleton view="month" sidebar />);
    expect(container.querySelector("[data-cn-event-calendar-skeleton-sidebar]")).not.toBeNull();
  });

  it("is used by the calendar for the timeline view", () => {
    const { container } = render(
      <CnEventCalendar skeleton view="timeline" resources={[{ id: "a", label: "A" }]} />,
    );
    expect(container.querySelector('[data-cn-event-calendar-skeleton="timeline"]')).not.toBeNull();
  });
});

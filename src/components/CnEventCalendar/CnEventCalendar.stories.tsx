import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef, useState } from "react";
import { CnButton } from "../CnButton";
import { CnEventCalendar } from "./CnEventCalendar";
import type {
  CnCalendarDateRange,
  CnCalendarEvent,
  CnCalendarHoliday,
  CnEventCalendarView,
  CnEventCategory,
} from "./CnEventCalendar.types";
import { CnEventCalendarSkeleton } from "./CnEventCalendarSkeleton";

const meta: Meta<typeof CnEventCalendar> = {
  title: "Data Display/CnEventCalendar",
  component: CnEventCalendar,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof CnEventCalendar>;

// ─── Datos de ejemplo (relativos a la semana actual) ──────────────────

const today = new Date();
const monday = new Date(
  today.getFullYear(),
  today.getMonth(),
  today.getDate() - ((today.getDay() + 6) % 7),
);
const pad = (n: number) => String(n).padStart(2, "0");
/** Fecha ISO local relativa al lunes de esta semana. */
const at = (dayOffset: number, hour?: number, minute = 0) => {
  const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + dayOffset);
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return hour === undefined ? date : `${date}T${pad(hour)}:${pad(minute)}`;
};

const people = [
  { name: "Ana López", email: "ana@canek.mx" },
  { name: "Luis Pérez", email: "luis@canek.mx" },
  { name: "María Fernández" },
  { name: "Jorge Ramírez" },
  { name: "Sofía Hernández" },
  { name: "Diego Torres" },
];

const categories: CnEventCategory[] = [
  { id: "meeting", label: "Reunión", color: "primary", icon: "groups" },
  { id: "training", label: "Capacitación", color: "teal", icon: "school" },
  { id: "birthday", label: "Cumpleaños", color: "pink", icon: "cake" },
  { id: "leave", label: "Vacaciones", color: "success", icon: "event_available" },
  { id: "reminder", label: "Recordatorio", color: "purple", icon: "notifications" },
  { id: "onboarding", label: "Ingreso", color: "orange", icon: "person_add" },
];

const baseEvents: CnCalendarEvent[] = [
  {
    id: "daily",
    title: "Daily de producto",
    start: at(-28, 9),
    end: at(-28, 9, 15),
    category: "meeting",
    location: "Google Meet",
    recurrence: { freq: "weekly", byWeekday: [1, 2, 3, 4, 5] },
    attendees: people.slice(0, 5),
    status: "confirmed",
  },
  {
    id: "planning",
    title: "Planeación de sprint",
    start: at(0, 10),
    end: at(0, 11, 30),
    category: "meeting",
    location: "Sala Maya · Piso 3",
    description: "Definir alcance del sprint 24.\nTraer estimaciones de las historias pendientes.",
    attendees: people,
    status: "confirmed",
  },
  {
    id: "design",
    title: "Revisión de diseño",
    start: at(0, 10, 30),
    end: at(0, 12),
    category: "meeting",
    attendees: people.slice(2, 4),
  },
  {
    id: "1on1",
    title: "1:1 con Ana",
    start: at(0, 11),
    end: at(0, 11, 30),
    category: "meeting",
    attendees: people.slice(0, 1),
    status: "tentative",
  },
  {
    id: "lunch",
    title: "Comida de equipo",
    start: at(1, 14),
    end: at(1, 15, 30),
    color: "orange",
    location: "Restaurante El Cardenal",
  },
  {
    id: "training-react",
    title: "Taller de accesibilidad",
    start: at(2, 16),
    end: at(2, 18),
    category: "training",
    location: "Auditorio",
    description: "Buenas prácticas de ARIA, foco y contraste.",
  },
  {
    id: "bday",
    title: "Cumpleaños de Sofía",
    start: at(3),
    allDay: true,
    category: "birthday",
    attendees: [people[4]],
  },
  {
    id: "vacaciones",
    title: "Vacaciones de Luis",
    start: at(3),
    end: at(9),
    allDay: true,
    category: "leave",
    attendees: [people[1]],
    status: "confirmed",
  },
  {
    id: "congreso",
    title: "Congreso de RH",
    start: at(15),
    end: at(17),
    allDay: true,
    category: "training",
    location: "Monterrey",
  },
  {
    id: "nomina",
    title: "Cierre de nómina",
    start: at(4, 12),
    end: at(4, 13),
    category: "reminder",
    recurrence: { freq: "weekly", interval: 2 },
  },
  {
    id: "ingreso",
    title: "Ingreso: Diego Torres",
    start: at(7, 9),
    end: at(7, 10),
    category: "onboarding",
    attendees: [people[5]],
  },
  {
    id: "cancelada",
    title: "Demo con cliente",
    start: at(2, 12),
    end: at(2, 13),
    category: "meeting",
    status: "cancelled",
  },
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `busy-${i}`,
    title: [
      "Entrevista frontend",
      "Entrevista QA",
      "Llamada con proveedor",
      "Revisión de contratos",
    ][i],
    start: at(8, 10 + i),
    end: at(8, 11 + i),
    category: i < 2 ? "onboarding" : "reminder",
  })),
];

const holidays: CnCalendarHoliday[] = [
  { date: at(11), label: "Día festivo" },
  { date: at(12), label: "Puente", blocked: true },
];

// ─── Historias ───────────────────────────────────────────────────────

export const MonthWithManyEvents: Story = {
  name: "Mes con muchos eventos",
  args: {
    title: "Calendario corporativo",
    subtitle: "Reuniones, capacitaciones, cumpleaños y ausencias",
    events: baseEvents,
    categories,
    holidays,
    searchable: true,
    onCreateEvent: () => undefined,
    workingHours: { start: 9, end: 18 },
  },
};

export const WeekWithOverlaps: Story = {
  name: "Semana con eventos encimados",
  args: {
    events: baseEvents,
    categories,
    holidays,
    defaultView: "week",
    minHour: 7,
    maxHour: 21,
    slotDuration: 30,
  },
};

export const DayView: Story = {
  name: "Día (intervalos de 15 min)",
  args: {
    events: baseEvents,
    categories,
    defaultView: "day",
    defaultDate: at(0),
    slotDuration: 15,
    hourHeight: 64,
    minHour: 8,
    maxHour: 20,
  },
};

export const Agenda: Story = {
  args: { events: baseEvents, categories, holidays, defaultView: "agenda" },
};

export const Year: Story = {
  name: "Año (intensidad por día)",
  args: { events: baseEvents, categories, holidays, defaultView: "year" },
};

export const Quarter: Story = {
  name: "Trimestre",
  args: {
    events: baseEvents,
    categories,
    defaultView: "quarter",
    views: ["month", "week", "quarter", "year"],
  },
};

const CategoriesFilterStory = () => {
  const [hidden, setHidden] = useState<string[]>(["reminder"]);
  return (
    <Stack spacing={1}>
      <CnEventCalendar
        events={baseEvents}
        categories={categories}
        hiddenCategories={hidden}
        onHiddenCategoriesChange={setHidden}
        searchable
      />
      <Box sx={{ fontSize: 13 }}>Ocultas: {hidden.join(", ") || "ninguna"}</Box>
    </Stack>
  );
};

export const CategoriesFilter: Story = {
  name: "Filtro por categorías",
  render: () => <CategoriesFilterStory />,
};

const EditableStory = () => {
  const [events, setEvents] = useState<CnCalendarEvent[]>(baseEvents.filter((e) => !e.recurrence));
  const [log, setLog] = useState(
    "Arrastra un evento, estira su borde inferior o selecciona un horario vacío.",
  );
  const nextId = useRef(1);
  return (
    <Stack spacing={1}>
      <CnEventCalendar
        events={events}
        categories={categories}
        defaultView="week"
        minHour={7}
        maxHour={21}
        editable
        onEventChange={(change) => {
          setEvents((prev) =>
            prev.map((e) =>
              e.id === change.event.id
                ? {
                    ...e,
                    start: change.start,
                    end: change.allDay ? new Date(change.end.getTime() - 86_400_000) : change.end,
                  }
                : e,
            ),
          );
          setLog(
            `${change.kind === "move" ? "Movido" : "Redimensionado"}: ${change.event.title} → ${change.start.toLocaleString("es-MX")}`,
          );
        }}
        onSlotClick={(slot) => {
          const id = `nuevo-${nextId.current++}`;
          setEvents((prev) => [
            ...prev,
            {
              id,
              title: "Nuevo evento",
              start: slot.start,
              end: slot.allDay ? undefined : slot.end,
              allDay: slot.allDay,
              color: "accent",
            },
          ]);
          setLog(
            `Creado: ${slot.start.toLocaleString("es-MX")} – ${slot.end.toLocaleString("es-MX")}`,
          );
        }}
        onEventDelete={(event) => setEvents((prev) => prev.filter((e) => e.id !== event.id))}
      />
      <Box sx={{ fontSize: 13 }}>{log}</Box>
    </Stack>
  );
};

export const EditableDrag: Story = {
  name: "Editable (arrastrar y seleccionar)",
  render: () => <EditableStory />,
};

export const HolidaysAndLimits: Story = {
  name: "Festivos, días bloqueados y límites",
  args: {
    events: baseEvents,
    categories,
    holidays: [
      ...holidays,
      { date: at(18), label: "Revolución Mexicana", color: "error" },
      { date: at(25), label: "Inventario anual", blocked: true },
    ],
    minDate: at(-7),
    maxDate: at(35),
    onSlotClick: () => undefined,
  },
};

export const Loading: Story = {
  name: "Cargando (cuerpo)",
  args: { events: [], categories, loading: true },
};

export const Skeletons: Story = {
  name: "Skeletons por vista",
  render: () => (
    <Stack spacing={3}>
      <CnEventCalendarSkeleton view="month" legend />
      <CnEventCalendarSkeleton view="week" height={300} />
      <CnEventCalendarSkeleton view="agenda" />
      <CnEventCalendarSkeleton view="year" />
      <Box sx={{ maxWidth: 360 }}>
        <CnEventCalendarSkeleton view="month" compact toolbar={false} />
      </Box>
    </Stack>
  ),
};

export const Empty: Story = {
  name: "Agenda vacía",
  args: {
    events: [],
    defaultView: "agenda",
    emptyTitle: "Sin eventos este mes",
    emptyDescription: "Crea un evento para empezar a organizar tu agenda.",
    onCreateEvent: () => undefined,
  },
};

export const Compact: Story = {
  name: "Compacto (widget)",
  args: {
    events: baseEvents,
    categories,
    compact: true,
    views: ["month"],
    showLegend: false,
    exportable: false,
    fullscreenable: false,
  },
  decorators: [(Story) => <Box sx={{ maxWidth: 380 }}>{Story()}</Box>],
};

// ─── Servidor: fecha y vista controladas, carga por rango ─────────────

const fakeFetch = (range: CnCalendarDateRange): Promise<CnCalendarEvent[]> =>
  new Promise((resolve) => {
    window.setTimeout(() => {
      const list: CnCalendarEvent[] = [];
      for (let d = new Date(range.start); d < range.end; d.setDate(d.getDate() + 1)) {
        const seed = d.getDate() * 7 + d.getMonth();
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        const count = seed % 3;
        for (let i = 0; i < count; i += 1) {
          const hour = 9 + ((seed + i * 3) % 8);
          const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour);
          list.push({
            id: `srv-${start.getTime()}-${i}`,
            title: ["Visita a cliente", "Revisión de KPI", "Soporte en sitio"][(seed + i) % 3],
            start,
            end: new Date(start.getTime() + 60 * 60_000),
            category: categories[(seed + i) % categories.length].id,
          });
        }
      }
      resolve(list);
    }, 700);
  });

const ServerRangeStory = () => {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<CnEventCalendarView>("month");
  const [range, setRange] = useState<CnCalendarDateRange | null>(null);
  const [events, setEvents] = useState<CnCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!range) return;
    let alive = true;
    setLoading(true);
    void fakeFetch(range).then((list) => {
      if (!alive) return;
      setEvents(list);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [range]);

  return (
    <Stack spacing={1}>
      <CnEventCalendar
        title="Agenda de campo"
        events={events}
        categories={categories}
        date={date}
        onDateChange={setDate}
        view={view}
        onViewChange={setView}
        onRangeChange={(next) => setRange(next)}
        loading={loading}
        toolbar={
          <CnButton
            size="small"
            variant="text"
            color="accent"
            onClick={() => setRange((r) => (r ? { ...r } : r))}
          >
            Recargar
          </CnButton>
        }
      />
      <Box sx={{ fontSize: 13 }}>
        Rango solicitado:{" "}
        {range
          ? `${range.start.toLocaleDateString("es-MX")} → ${range.end.toLocaleDateString("es-MX")} (fin exclusivo)`
          : "—"}
      </Box>
    </Stack>
  );
};

export const ServerRange: Story = {
  name: "Controlado con carga por rango",
  render: () => <ServerRangeStory />,
};

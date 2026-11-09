import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnChip } from "../CnChip";
import { CnEventCalendar } from "./CnEventCalendar";
import type {
  CnAvailabilityBlock,
  CnCalendarEvent,
  CnCalendarResource,
  CnCalendarSource,
  CnEventCalendarProps,
  CnEventCategory,
  CnEventDraft,
} from "./CnEventCalendar.types";
import { CnEventCalendarSkeleton } from "./CnEventCalendarSkeleton";
import { applyEventChange, applyEventDelete } from "./recurrence-edit";

const meta: Meta<typeof CnEventCalendar> = {
  title: "Data Display/CnEventCalendar/Integraciones y funciones",
  component: CnEventCalendar,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof CnEventCalendar>;

// ─── Utilidades de datos (relativas a la semana actual) ───────────────

const today = new Date();
const monday = new Date(
  today.getFullYear(),
  today.getMonth(),
  today.getDate() - ((today.getDay() + 6) % 7),
);
const pad = (n: number) => String(n).padStart(2, "0");
/** ISO local relativo al lunes de esta semana (`hour` admite decimales: 9.5 = 9:30). */
const at = (dayOffset: number, hour?: number) => {
  const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + dayOffset);
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (hour === undefined) return date;
  return `${date}T${pad(Math.floor(hour))}:${pad(Math.round((hour % 1) * 60))}`;
};
const todayOffset = (today.getDay() + 6) % 7;

let seq = 0;
const draftToEvent = (draft: CnEventDraft, extra: Partial<CnCalendarEvent> = {}) => ({
  id: `nuevo-${++seq}`,
  title: draft.title,
  start: draft.start,
  end: draft.allDay ? new Date(draft.end.getTime() - 86_400_000) : draft.end,
  allDay: draft.allDay,
  category: draft.category,
  resourceId: draft.resourceId,
  location: draft.location,
  ...extra,
});

/** Envoltura con estado: aplica cambios, altas, bajas e importación. */
const Stateful = ({
  initial,
  ...props
}: Omit<CnEventCalendarProps, "events"> & { initial: CnCalendarEvent[] }) => {
  const [events, setEvents] = useState(initial);
  const [log, setLog] = useState("Prueba arrastrar, flechas, Supr, Ctrl+Z o clic derecho.");
  return (
    <Stack spacing={1}>
      <CnEventCalendar
        {...props}
        events={events}
        onEventChange={(change) => {
          setEvents((prev) => applyEventChange(prev, change));
          setLog(
            `${change.via === "undo" ? "Deshecho" : change.kind === "move" ? "Movido" : "Redimensionado"}: ${change.event.title}${change.scope ? ` (alcance: ${change.scope})` : ""}${change.resourceId ? ` → ${change.resourceId}` : ""}`,
          );
        }}
        onCreateEvent={(draft) => {
          if (!draft) {
            setLog("Botón 'Nuevo evento' (abre tu formulario completo)");
            return;
          }
          setEvents((prev) => [...prev, draftToEvent(draft)]);
          setLog(`Creado: ${draft.title}`);
        }}
        onEventDelete={(event, occurrence, scope) => {
          setEvents((prev) => applyEventDelete(prev, event, occurrence, scope));
          setLog(`Eliminado: ${event.title}${scope ? ` (alcance: ${scope})` : ""}`);
        }}
        onImport={(list) => {
          setEvents((prev) => [...prev, ...list]);
          setLog(`Importados ${list.length} eventos`);
        }}
      />
      <Box sx={{ fontSize: 13, color: "text.secondary" }}>{log}</Box>
    </Stack>
  );
};

// ─── Integraciones ────────────────────────────────────────────────────

const meetingEvents: CnCalendarEvent[] = [
  {
    id: "meet",
    title: "Comité de RH",
    start: at(todayOffset, 10),
    end: at(todayOffset, 11),
    location: "https://meet.google.com/abc-defg-hij",
    description: "Revisión de vacantes y clima laboral.",
    reminders: [10, 60],
    color: "primary",
    attendees: [
      { name: "Ana López", email: "ana@canek.mx" },
      { name: "Luis Pérez", email: "luis@canek.mx" },
    ],
  },
  {
    id: "zoom",
    title: "Entrevista: Frontend Sr.",
    start: at(todayOffset + 1, 12),
    end: at(todayOffset + 1, 13),
    description: "Liga de Zoom: https://us02web.zoom.us/j/81234567890?pwd=canek",
    color: "teal",
    reminders: [15],
  },
  {
    id: "teams",
    title: "Junta con proveedor",
    start: at(todayOffset + 2, 16),
    end: at(todayOffset + 2, 17),
    meetingUrl: "https://teams.microsoft.com/l/meetup-join/19%3ameeting_canek/0",
    color: "purple",
  },
  {
    id: "visita",
    title: "Visita a planta",
    start: at(todayOffset + 3, 9),
    end: at(todayOffset + 3, 13),
    location: "Av. Insurgentes Sur 1602, Benito Juárez, CDMX",
    color: "orange",
    reminders: [1440],
  },
];

export const Integrations: Story = {
  name: "Integraciones: Meet/Zoom/Teams, mapa y 'Agregar a…'",
  render: () => (
    <CnEventCalendar
      title="Agenda de reclutamiento"
      subtitle="Abre un evento: Unirse, Ver en mapa, Agregar a Google/Outlook/Office 365/Yahoo o .ics"
      events={meetingEvents}
      defaultView="week"
      minHour={8}
      maxHour={19}
    />
  ),
};

export const ImportIcs: Story = {
  name: "Importar .ics (menú o soltar archivo)",
  render: () => (
    <Stateful
      title="Importa tu calendario"
      subtitle="Menú de exportación → Importar .ics… o arrastra un archivo .ics sobre el calendario"
      initial={meetingEvents.slice(0, 2)}
    />
  ),
};

// ─── Calendarios suscribibles con barra lateral ──────────────────────

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
let failOnce = true;

const sources: CnCalendarSource[] = [
  {
    id: "personal",
    label: "Personal",
    color: "accent",
    events: [
      { id: "gym", title: "Gimnasio", start: at(todayOffset, 7), end: at(todayOffset, 8) },
      {
        id: "dentista",
        title: "Dentista",
        start: at(todayOffset + 2, 18),
        end: at(todayOffset + 2, 19),
      },
    ],
  },
  {
    id: "equipo",
    label: "Equipo de producto",
    color: "primary",
    load: async (range) => {
      await wait(600);
      const list: CnCalendarEvent[] = [];
      for (let d = new Date(range.start); d < range.end; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        const day = new Date(d);
        list.push({
          id: `daily-${day.getTime()}`,
          title: "Daily",
          start: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 30),
          end: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 45),
          location: "https://meet.google.com/xyz-abcd-efg",
        });
      }
      return list;
    },
  },
  {
    id: "festivos",
    label: "Días festivos (MX)",
    color: "warning",
    load: async () => {
      await wait(900);
      const year = today.getFullYear();
      return [
        { id: "rev", title: "Revolución Mexicana", start: `${year}-11-16`, allDay: true },
        { id: "nav", title: "Navidad", start: `${year}-12-25`, allDay: true },
        { id: "ano", title: "Año Nuevo", start: `${year + 1}-01-01`, allDay: true },
      ];
    },
  },
  {
    id: "guardias",
    label: "Guardias (servidor inestable)",
    color: "error",
    load: async () => {
      await wait(800);
      if (failOnce) {
        failOnce = false;
        throw new Error("Tiempo de espera agotado");
      }
      return [
        {
          id: "guardia",
          title: "Guardia de soporte",
          start: at(todayOffset + 4, 18),
          end: at(todayOffset + 5, 8),
        },
      ];
    },
  },
  {
    id: "rh",
    label: "Recursos humanos",
    color: "purple",
    visible: false,
    events: [{ id: "nomina", title: "Pago de nómina", start: at(todayOffset + 4), allDay: true }],
  },
];

export const SourcesWithSidebar: Story = {
  name: "Varios calendarios con barra lateral",
  render: () => (
    <CnEventCalendar
      title="Mis calendarios"
      subtitle="Mini mes con puntos, alternar calendarios, carga y error por fuente, próximos eventos"
      sources={sources}
      sidebar={{ upcoming: 5 }}
      defaultView="week"
      minHour={7}
      maxHour={21}
      showWeekNumbers
    />
  ),
};

// ─── Reservas de salas (recursos) ─────────────────────────────────────

const rooms: CnCalendarResource[] = [
  {
    id: "maya",
    label: "Sala Maya",
    description: "Piso 3 · 10 personas",
    icon: "groups",
    color: "primary",
    group: "Corporativo",
  },
  {
    id: "olmeca",
    label: "Sala Olmeca",
    description: "Piso 3 · 6 personas",
    icon: "groups",
    color: "teal",
    group: "Corporativo",
  },
  {
    id: "auditorio",
    label: "Auditorio",
    description: "PB · 2 espacios",
    icon: "campaign",
    color: "purple",
    capacity: 2,
    group: "Corporativo",
  },
  {
    id: "cabina-1",
    label: "Cabina 1",
    description: "Llamadas",
    icon: "headset_mic",
    color: "orange",
    group: "Coworking",
  },
  {
    id: "terraza",
    label: "Terraza",
    description: "Eventos",
    icon: "local_cafe",
    color: "success",
    group: "Coworking",
  },
];

const bookings: CnCalendarEvent[] = [
  {
    id: "b1",
    title: "Planeación Q1",
    start: at(todayOffset, 9),
    end: at(todayOffset, 11),
    resourceId: "maya",
    color: "primary",
  },
  {
    id: "b2",
    title: "Entrevista UX",
    start: at(todayOffset, 10.5),
    end: at(todayOffset, 11.5),
    resourceId: "maya",
    color: "error",
  },
  {
    id: "b3",
    title: "Capacitación ventas",
    start: at(todayOffset, 9),
    end: at(todayOffset, 13),
    resourceId: "auditorio",
    color: "purple",
  },
  {
    id: "b4",
    title: "Townhall",
    start: at(todayOffset, 12),
    end: at(todayOffset, 13),
    resourceId: "auditorio",
    color: "purple",
  },
  {
    id: "b5",
    title: "1:1 Ana / Luis",
    start: at(todayOffset, 15),
    end: at(todayOffset, 15.5),
    resourceId: "cabina-1",
    color: "orange",
  },
  {
    id: "b6",
    title: "Demo cliente",
    start: at(todayOffset, 16),
    end: at(todayOffset, 17.5),
    resourceId: "olmeca",
    color: "teal",
    reminders: [15],
  },
  {
    id: "b7",
    title: "Brindis de fin de año",
    start: at(todayOffset, 18),
    end: at(todayOffset, 20),
    resourceId: "terraza",
    color: "success",
  },
  { id: "b8", title: "Reunión sin sala", start: at(todayOffset, 13), end: at(todayOffset, 14) },
];

const roomAvailability: CnAvailabilityBlock[] = [
  {
    start: at(todayOffset, 13),
    end: at(todayOffset, 14),
    status: "away",
    resourceId: "olmeca",
    label: "Mantenimiento",
  },
  {
    start: at(todayOffset, 8),
    end: at(todayOffset, 9),
    status: "busy",
    resourceId: "terraza",
    label: "Limpieza",
  },
];

export const RoomBooking: Story = {
  name: "Reservas de salas (recursos por día)",
  render: () => (
    <Stateful
      title="Reservas de salas"
      subtitle="Arrastra entre salas, estira el borde derecho, selecciona un hueco para reservar. Conflictos marcados."
      initial={bookings}
      resources={rooms}
      views={["timeline", "day", "week"]}
      defaultView="timeline"
      editable
      quickCreate
      detectConflicts="resource"
      availability={roomAvailability}
      minHour={8}
      maxHour={21}
      timelineHourWidth={72}
    />
  ),
};

// ─── Turnos del personal (recursos por semana) ────────────────────────

const staff: CnCalendarResource[] = [
  { id: "ana", label: "Ana López", description: "Enfermería", group: "Turno matutino" },
  { id: "luis", label: "Luis Pérez", description: "Enfermería", group: "Turno matutino" },
  { id: "maria", label: "María Fernández", description: "Recepción", group: "Turno vespertino" },
  { id: "jorge", label: "Jorge Ramírez", description: "Seguridad", group: "Turno vespertino" },
  { id: "sofia", label: "Sofía Hernández", description: "Supervisión", group: "Turno vespertino" },
];

const shifts: CnCalendarEvent[] = [
  ...[0, 1, 2, 3, 4].flatMap((d) => [
    {
      id: `ana-${d}`,
      title: "Matutino",
      start: at(d, 7),
      end: at(d, 15),
      resourceId: "ana",
      color: "teal",
    },
    {
      id: `luis-${d}`,
      title: "Matutino",
      start: at(d, 7),
      end: at(d, 15),
      resourceId: "luis",
      color: "teal",
    },
    {
      id: `maria-${d}`,
      title: "Vespertino",
      start: at(d, 14),
      end: at(d, 22),
      resourceId: "maria",
      color: "purple",
    },
  ]),
  {
    id: "jorge-1",
    title: "Vespertino",
    start: at(1, 14),
    end: at(1, 22),
    resourceId: "jorge",
    color: "purple",
  },
  {
    id: "jorge-2",
    title: "Cubre a Luis",
    start: at(2, 10),
    end: at(2, 16),
    resourceId: ["jorge", "luis"],
    color: "warning",
  },
  {
    id: "vac",
    title: "Vacaciones",
    start: at(3),
    end: at(4),
    allDay: true,
    resourceId: "sofia",
    color: "success",
  },
  {
    id: "cap",
    title: "Capacitación RCP",
    start: at(5, 9),
    end: at(5, 13),
    resourceId: ["ana", "maria"],
    color: "orange",
  },
];

export const StaffScheduling: Story = {
  name: "Turnos del personal (recursos por semana)",
  render: () => (
    <Stateful
      title="Turnos de la semana"
      subtitle="Recursos agrupados, horario laboral partido, conflictos por persona, mover con flechas (↑/↓ cambia de persona)"
      initial={shifts}
      resources={staff}
      views={["timeline", "week", "month"]}
      defaultView="timeline"
      timelineRange="week"
      editable
      detectConflicts="resource"
      minHour={6}
      maxHour={23}
      workingHours={[
        { days: [1, 2, 3, 4, 5], start: 7, end: 15 },
        { days: [1, 2, 3, 4, 5], start: 16, end: 22 },
        { days: [6], start: 9, end: 13 },
      ]}
    />
  ),
};

// ─── Citas médicas ────────────────────────────────────────────────────

const medicalCategories: CnEventCategory[] = [
  { id: "primera", label: "Primera vez", color: "accent", icon: "person_add" },
  { id: "seguimiento", label: "Seguimiento", color: "teal", icon: "event_repeat" },
  { id: "estudio", label: "Estudios", color: "orange", icon: "science" },
  { id: "tele", label: "Teleconsulta", color: "purple", icon: "videocam" },
];

const doctor = { id: "dr-ruiz", name: "Dr. Ruiz", email: "ruiz@clinica.mx" };
const appointments: CnCalendarEvent[] = [
  {
    id: "c1",
    title: "Carla Méndez",
    start: at(todayOffset, 9),
    end: at(todayOffset, 9.5),
    category: "primera",
    attendees: [doctor],
    reminders: [60, 1440],
    status: "confirmed",
  },
  {
    id: "c2",
    title: "Roberto Díaz",
    start: at(todayOffset, 9.5),
    end: at(todayOffset, 10),
    category: "seguimiento",
    attendees: [doctor],
  },
  {
    id: "c3",
    title: "Lucía Torres (sobrecupo)",
    start: at(todayOffset, 9.75),
    end: at(todayOffset, 10.25),
    category: "seguimiento",
    attendees: [doctor],
    status: "tentative",
  },
  {
    id: "c4",
    title: "Ultrasonido · Pedro Gil",
    start: at(todayOffset, 11),
    end: at(todayOffset, 12),
    category: "estudio",
    location: "Hospital Ángeles Pedregal, CDMX",
  },
  {
    id: "c5",
    title: "Teleconsulta · Eva Ríos",
    start: at(todayOffset + 1, 17),
    end: at(todayOffset + 1, 17.5),
    category: "tele",
    location: "https://meet.google.com/med-cita-eva",
    attendees: [doctor],
  },
  {
    id: "c6",
    title: "Control mensual",
    start: at(todayOffset + 2, 12),
    end: at(todayOffset + 2, 12.5),
    category: "seguimiento",
    recurrence: {
      freq: "monthly",
      byNthWeekday: [{ weekday: ((today.getDay() + 2) % 7) as 0, nth: 2 }],
    },
  },
];

const clinicAvailability: CnAvailabilityBlock[] = [
  { start: at(todayOffset, 14), end: at(todayOffset, 16), status: "away", label: "Comida" },
  {
    start: at(todayOffset + 1, 9),
    end: at(todayOffset + 1, 12),
    status: "busy",
    label: "Quirófano",
  },
  {
    start: at(todayOffset + 3, 9),
    end: at(todayOffset + 3, 13),
    status: "free",
    label: "Disponible para urgencias",
  },
];

export const MedicalAppointments: Story = {
  name: "Citas médicas (disponibilidad, sobrecupo, recordatorios)",
  render: () => (
    <Stateful
      title="Consultorio · Dr. Ruiz"
      subtitle="Conflictos por médico, bloques ocupado/libre, alta rápida en lenguaje natural y formulario rápido"
      initial={appointments}
      categories={medicalCategories}
      defaultView="week"
      views={["day", "week", "month", "agenda"]}
      editable
      quickCreate
      quickAdd
      quickAddPlaceholder="“Consulta Juan Pérez mañana 10:30 30 min #primera”"
      detectConflicts="attendee"
      availability={clinicAvailability}
      slotDuration={15}
      hourHeight={64}
      minHour={8}
      maxHour={20}
      workingHours={[
        { days: [1, 2, 3, 4, 5], start: 9, end: 14 },
        { days: [1, 2, 3, 4, 5], start: 16, end: 19 },
      ]}
    />
  ),
};

// ─── Entregas (vehículos) ─────────────────────────────────────────────

const vehicles: CnCalendarResource[] = [
  {
    id: "u1",
    label: "Unidad 01 · Nissan NP300",
    description: "Ruta norte",
    icon: "local_shipping",
    color: "primary",
  },
  {
    id: "u2",
    label: "Unidad 02 · Hiace",
    description: "Ruta sur",
    icon: "local_shipping",
    color: "teal",
  },
  { id: "u3", label: "Moto 07", description: "Express", icon: "near_me", color: "orange" },
];

const deliveries: CnCalendarEvent[] = [
  {
    id: "e1",
    title: "Walmart Satélite",
    start: at(todayOffset, 8),
    end: at(todayOffset, 9.5),
    resourceId: "u1",
    location: "Circuito Centro Comercial 2251, Naucalpan",
    color: "primary",
  },
  {
    id: "e2",
    title: "Bodega Tlalnepantla",
    start: at(todayOffset, 10),
    end: at(todayOffset, 12),
    resourceId: "u1",
    color: "primary",
  },
  {
    id: "e3",
    title: "Farmacias Coyoacán (3 paradas)",
    start: at(todayOffset, 9),
    end: at(todayOffset, 13),
    resourceId: "u2",
    color: "teal",
  },
  {
    id: "e4",
    title: "Express Polanco",
    start: at(todayOffset, 11),
    end: at(todayOffset, 11.75),
    resourceId: "u3",
    color: "orange",
    location: "Av. Presidente Masaryk 111, CDMX",
  },
  {
    id: "e5",
    title: "Express Roma",
    start: at(todayOffset, 11.5),
    end: at(todayOffset, 12.25),
    resourceId: "u3",
    color: "orange",
  },
  {
    id: "e6",
    title: "Servicio preventivo",
    start: at(todayOffset, 15),
    end: at(todayOffset, 18),
    resourceId: "u2",
    color: "neutral",
    editable: false,
  },
];

export const Deliveries: Story = {
  name: "Entregas por unidad (recursos)",
  render: () => (
    <Stateful
      title="Despacho de entregas"
      subtitle="Arrastra entregas entre unidades; la moto marca conflicto por traslape"
      initial={deliveries}
      resources={vehicles}
      views={["timeline", "agenda"]}
      defaultView="timeline"
      editable
      detectConflicts="resource"
      density="comfortable"
      minHour={7}
      maxHour={20}
    />
  ),
};

// ─── Varios meses ─────────────────────────────────────────────────────

const yearEvents: CnCalendarEvent[] = Array.from({ length: 60 }, (_, i) => ({
  id: `y${i}`,
  title: ["Auditoría", "Cierre contable", "Capacitación", "Visita a cliente", "Inventario"][i % 5],
  start: at(i * 3 - 30, 9 + (i % 6)),
  color: (["primary", "teal", "orange", "purple", "success"] as const)[i % 5],
}));

const MultiMonthStory = () => {
  const [count, setCount] = useState<2 | 3 | 4 | 6 | 12>(3);
  return (
    <Stack spacing={1.5}>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={count}
        onChange={(_, v) => v && setCount(v)}
        aria-label="Meses"
      >
        {[2, 3, 4, 6, 12].map((n) => (
          <ToggleButton key={n} value={n} sx={{ textTransform: "none", px: 2 }}>
            {n} meses
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <CnEventCalendar
        events={yearEvents}
        defaultView="multiMonth"
        views={["multiMonth", "month", "year"]}
        multiMonthCount={count}
        monthHeatmap
        showWeekNumbers
        holidays={[{ date: at(14), label: "Día festivo" }]}
      />
    </Stack>
  );
};

export const MultiMonth: Story = {
  name: "Varios meses (2/3/4/6/12)",
  render: () => <MultiMonthStory />,
};

// ─── Zonas horarias ───────────────────────────────────────────────────

const tzEvents: CnCalendarEvent[] = [
  {
    id: "ny",
    title: "Llamada con Nueva York",
    start: new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate() + 1, 15)),
    end: new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate() + 1, 16)),
    color: "primary",
  },
  {
    id: "mad",
    title: "Revisión con Madrid",
    start: new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate() + 2, 8)),
    end: new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate() + 2, 9)),
    color: "teal",
  },
];

const TimeZoneStory = () => {
  const [zone, setZone] = useState("America/Mexico_City");
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1}>
        {[
          "America/Mexico_City",
          "America/Bogota",
          "America/New_York",
          "Europe/Madrid",
          "Asia/Tokyo",
        ].map((z) => (
          <CnChip
            key={z}
            label={z}
            clickable
            variant={zone === z ? "soft" : "outlined"}
            color={zone === z ? "accent" : "neutral"}
            onClick={() => setZone(z)}
          />
        ))}
      </Stack>
      <CnEventCalendar
        events={tzEvents}
        defaultView="week"
        timeZone={zone}
        secondaryTimeZone="UTC"
        minHour={0}
        maxHour={24}
        scrollToHour={6}
      />
    </Stack>
  );
};

export const TimeZones: Story = {
  name: "Zonas horarias (principal y secundaria)",
  render: () => <TimeZoneStory />,
};

// ─── Configuración regional ───────────────────────────────────────────

export const WeekNumbersAndBusinessHours: Story = {
  name: "Semanas ISO, inicio por región, sin fines de semana y horario por día",
  args: {
    events: meetingEvents,
    weekStart: "locale",
    locale: "es-MX",
    showWeekNumbers: true,
    showWeekends: false,
    defaultView: "week",
    minHour: 7,
    maxHour: 20,
    workingHours: [
      { days: [1, 2, 3, 4], start: 9, end: 18 },
      { days: [5], start: 9, end: 14 },
    ],
  },
};

// ─── Teclado, menú contextual, deshacer y alcance de recurrentes ─────

const recurring: CnCalendarEvent[] = [
  {
    id: "daily",
    title: "Daily",
    start: at(-14, 9),
    end: at(-14, 9.25),
    recurrence: { freq: "weekly", byWeekday: [1, 2, 3, 4, 5] },
    color: "primary",
  },
  {
    id: "comite",
    title: "Comité (2º lunes)",
    start: at(-28, 12),
    end: at(-28, 13),
    recurrence: { freq: "monthly", byNthWeekday: [{ weekday: 1, nth: 2 }] },
    color: "purple",
  },
  {
    id: "cierre",
    title: "Cierre (último viernes)",
    start: at(-28, 17),
    end: at(-28, 18),
    recurrence: { freq: "monthly", byNthWeekday: [{ weekday: 5, nth: -1 }] },
    color: "error",
  },
  {
    id: "pago",
    title: "Pago a proveedores (fin de mes)",
    start: at(-40),
    allDay: true,
    recurrence: { freq: "monthly", byMonthDay: [-1] },
    color: "success",
  },
  {
    id: "suelto",
    title: "Revisión de diseño",
    start: at(todayOffset, 11),
    end: at(todayOffset, 12),
    color: "teal",
  },
];

export const KeyboardContextMenuUndo: Story = {
  name: "Teclado, menú contextual, deshacer y alcance de recurrentes",
  render: () => (
    <Stateful
      title="Editar con el teclado"
      subtitle="Enfoca un evento: ↑/↓ mueve, Shift+↓ alarga, ←/→ cambia de día, Supr elimina, Ctrl+Z deshace. Clic derecho para más acciones."
      initial={recurring}
      defaultView="week"
      editable
      askRecurrenceScope
      minHour={7}
      maxHour={20}
    />
  ),
};

export const NthWeekdayRecurrence: Story = {
  name: "Recurrencia: 2º lunes, último viernes, fin de mes",
  args: {
    events: recurring,
    defaultView: "multiMonth",
    multiMonthCount: 4,
    views: ["multiMonth", "month"],
  },
};

// ─── Personalización ──────────────────────────────────────────────────

export const CustomRendering: Story = {
  name: "Personalización: renderEvent, renderDayCell, densidad",
  args: {
    events: appointments,
    categories: medicalCategories,
    density: "comfortable",
    eventDisplay: "block",
    dayCapacity: 6,
    monthHeatmap: true,
    renderEvent: (o) => (
      <Box
        component="span"
        sx={{ display: "flex", alignItems: "center", gap: "4px", overflow: "hidden" }}
      >
        <Box component="span" sx={{ fontWeight: 800 }}>
          {o.event.status === "confirmed" ? "✔" : "•"}
        </Box>
        <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {o.event.title}
        </Box>
      </Box>
    ),
    renderDayCell: (day, { occurrences, inMonth }) =>
      inMonth && day.getDay() === 1 ? (
        <Box component="span" sx={{ color: "text.secondary" }}>
          Guardia: Dr. Ruiz · {occurrences.length} citas
        </Box>
      ) : null,
    renderEventPopover: (o, { close }) => (
      <Box sx={{ p: 2 }}>
        <Box sx={{ fontWeight: 700, mb: 1 }}>{o.event.title}</Box>
        <Box sx={{ fontSize: 13, mb: 1.5 }}>Expediente clínico #{o.event.id.toUpperCase()}</Box>
        <CnChip label="Cerrar" clickable onClick={close} size="small" />
      </Box>
    ),
  },
};

export const HeatmapAndCapacity: Story = {
  name: "Mapa de calor y capacidad diaria",
  args: {
    events: yearEvents.concat(bookings),
    monthHeatmap: true,
    dayCapacity: (day: Date) => (day.getDay() === 0 || day.getDay() === 6 ? undefined : 3),
    maxEventsPerDay: 2,
  },
};

// ─── Skeletons ────────────────────────────────────────────────────────

export const NewSkeletons: Story = {
  name: "Skeletons: recursos, varios meses y barra lateral",
  render: () => (
    <Stack spacing={3}>
      <CnEventCalendarSkeleton view="timeline" rows={5} />
      <CnEventCalendarSkeleton view="multiMonth" multiMonthCount={3} />
      <CnEventCalendarSkeleton view="week" sidebar height={300} />
    </Stack>
  ),
};

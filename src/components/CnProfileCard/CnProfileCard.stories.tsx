import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CnContentCarousel } from "../CnContentCarousel";
import { CnProfileCard } from "./CnProfileCard";
import type { CnProfileCardGroupItem } from "./CnProfileCardGroup";
import { CnProfileCardGroup } from "./CnProfileCardGroup";
import { CnProfileCardSkeleton } from "./CnProfileCardSkeleton";

/** Fecha ISO relativa a hoy (para que las cuentas regresivas tengan sentido). */
const shift = (days: number, yearsAgo = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setFullYear(d.getFullYear() - yearsAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const PEOPLE: CnProfileCardGroupItem[] = [
  {
    id: 1,
    name: "María Fernanda Pérez",
    role: "Diseñadora UX",
    department: "Producto",
    avatarUrl: "https://i.pravatar.cc/150?img=5",
    avatarStatus: "online",
    email: "maria.perez@canek.mx",
    phone: "+52 55 1234 5678",
    whatsapp: true,
    event: { type: "birthday", date: shift(0, 31) },
  },
  {
    id: 2,
    name: "Luis Gómez",
    role: "Contador",
    department: "Finanzas",
    avatarUrl: "https://i.pravatar.cc/150?img=12",
    email: "luis.gomez@canek.mx",
    event: { type: "birthday", date: shift(2, 28) },
  },
  {
    id: 3,
    name: "Ana Sofía Torres",
    role: "Ingeniera de datos",
    department: "TI",
    avatarUrl: "https://i.pravatar.cc/150?img=9",
    event: { type: "birthday", date: shift(9, 35) },
  },
  {
    id: 4,
    name: "Jorge Ramírez",
    role: "Ventas",
    department: "Comercial",
    event: { type: "birthday", date: shift(-4, 40) },
  },
  {
    id: 5,
    name: "Daniela Castro",
    role: "RH",
    avatarUrl: "https://i.pravatar.cc/150?img=20",
    event: { type: "birthday", date: shift(15, 26) },
  },
];

const meta: Meta<typeof CnProfileCard> = {
  title: "Data Display/CnProfileCard",
  component: CnProfileCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          '**Para qué sirve:** mostrar a una persona (avatar con estado, puesto, área, ubicación) con sus vías de contacto (correo, teléfono, WhatsApp) y, opcionalmente, un evento con cuenta regresiva (cumpleaños, aniversario, ingreso, vacaciones, incapacidad, promoción) y acciones rápidas ("Felicitar"). `CnProfileCardGroup` las agrupa por proximidad (Hoy / Próximos días / …), filtra por mes y resume con "Ver todos".',
          "",
          "**Cuándo NO usarlo:** para un usuario en una fila de tabla o lista densa usa `CnAvatar` + `CnList`; para un bloque de información genérico con título usa `CnSectionCard`; para archivos, `CnDocCard`; para un KPI, `CnMetricCard`.",
          "",
          '**Relación con vecinos:** se construye sobre `CnCard`, `CnAvatar` y `CnChip`; el grupo usa `CnSectionCard` como contenedor y la tarjeta encaja en `CnContentCarousel` (preset `cards`). Se adapta al **ancho de su contenedor** (ResizeObserver): trunca nombres a 2 líneas, reduce el avatar, baja los contactos a la fila de acciones y agrupa las acciones que no caben en un menú "Más acciones".',
        ].join("\n"),
      },
    },
  },
  args: {
    ...PEOPLE[0],
    quickActions: [{ label: "Felicitar", icon: "celebration" }],
  },
  argTypes: {
    layout: { control: "inline-radio", options: ["horizontal", "vertical", "compact"] },
    variant: { control: "inline-radio", options: ["outlined", "elevated", "tinted", "solid"] },
    tone: {
      control: "select",
      options: ["primary", "info", "success", "warning", "error", "neutral", "accent"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof CnProfileCard>;

const grid = {
  display: "grid",
  gap: "16px",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  alignItems: "stretch",
};

export const Default: Story = {
  decorators: [(Story) => <Box sx={{ maxWidth: 420 }}>{Story()}</Box>],
};

export const Layouts: Story = {
  decorators: [(Story) => <Box>{Story()}</Box>],
  render: (args) => (
    <Box
      sx={{
        display: "grid",
        gap: "16px",
        gridTemplateColumns: { md: "260px 1fr" },
        alignItems: "start",
      }}
    >
      <CnProfileCard {...args} layout="vertical" cover />
      <Box sx={{ display: "grid", gap: "12px" }}>
        <CnProfileCard {...args} layout="horizontal" />
        <CnProfileCard {...args} layout="compact" />
      </Box>
    </Box>
  ),
};

/** Cada tipo de evento con su tono, ícono y cuenta regresiva. */
export const EventTypes: Story = {
  decorators: [(Story) => <Box>{Story()}</Box>],
  render: () => (
    <Box sx={grid}>
      <CnProfileCard
        name="Cumpleaños hoy"
        event={{ type: "birthday", date: shift(0, 30), showAge: true }}
        quickActions={[{ label: "Felicitar", icon: "celebration" }]}
      />
      <CnProfileCard
        name="Aniversario"
        role="5 años con nosotros"
        event={{ type: "anniversary", date: shift(3, 5) }}
      />
      <CnProfileCard
        name="Nuevo ingreso"
        role="Analista"
        event={{ type: "new-hire", date: shift(2) }}
        quickActions={[{ label: "Dar la bienvenida", icon: "person_add" }]}
      />
      <CnProfileCard
        name="Vacaciones"
        event={{ type: "vacation", date: shift(-2), endDate: shift(4) }}
      />
      <CnProfileCard
        name="Incapacidad"
        event={{ type: "leave", date: shift(5), endDate: shift(12), label: "Incapacidad" }}
      />
      <CnProfileCard
        name="Promoción"
        role="Gerente de Ventas"
        event={{ type: "promotion", date: shift(-1) }}
      />
    </Box>
  ),
};

export const Variants: Story = {
  decorators: [(Story) => <Box>{Story()}</Box>],
  render: (args) => (
    <Box sx={grid}>
      {(["outlined", "elevated", "tinted", "solid"] as const).map((variant) => (
        <CnProfileCard
          key={variant}
          {...args}
          variant={variant}
          layout="vertical"
          cover={variant !== "solid"}
        />
      ))}
    </Box>
  ),
};

/** Equivalente a TbPersonEventCard: portada, fondo sólido, detalle y etiquetas. */
export const TabantajStyle: Story = {
  decorators: [(Story) => <Box>{Story()}</Box>],
  render: () => (
    <Box sx={grid}>
      <CnProfileCard
        variant="solid"
        layout="vertical"
        coverUrl="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&h=160&fit=crop"
        name="Paola Méndez"
        role="Coordinadora de Logística"
        avatarUrl="https://i.pravatar.cc/150?img=32"
        event={{ type: "birthday", date: shift(1, 29) }}
        details={[{ label: "Fecha", value: "Mañana" }]}
        tags={["Logística", "CDMX"]}
      />
      <CnProfileCard
        variant="solid"
        tone="info"
        layout="vertical"
        coverUrl="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&h=160&fit=crop"
        name="Ricardo Silva"
        role="Desarrollador Frontend"
        avatarUrl="https://i.pravatar.cc/150?img=53"
        event={{ type: "new-hire", date: shift(-1) }}
        details={[
          { label: "Área", value: "Tecnología" },
          { label: "Jefe", value: "Ana Torres" },
        ]}
        tags={["Remoto"]}
      />
    </Box>
  ),
};

export const BirthdaysOfTheMonth: Story = {
  decorators: [(Story) => <Box sx={{ maxWidth: 460 }}>{Story()}</Box>],
  render: () => (
    <CnProfileCardGroup
      title="Cumpleaños del mes"
      subtitle="Celebra a tus compañeros"
      icon="cake"
      iconTone="warning"
      people={PEOPLE}
      maxVisible={4}
      groupByProximity
    />
  ),
};

export const GroupGrid: Story = {
  decorators: [(Story) => <Box>{Story()}</Box>],
  render: () => (
    <CnProfileCardGroup
      title="Nuevos ingresos"
      icon="person_add"
      iconTone="info"
      layout="grid"
      people={PEOPLE.slice(0, 4).map((p, i) => ({
        ...p,
        event: { type: "new-hire" as const, date: shift(i * 3 - 2) },
        quickActions: [{ label: "Bienvenida", icon: "person_add", variant: "outlined" as const }],
      }))}
    />
  ),
};

/** Cumpleaños en un carrusel de tarjetas (preset `cards` de CnContentCarousel). */
export const BirthdaysCarousel: Story = {
  decorators: [(Story) => <Box>{Story()}</Box>],
  render: () => (
    <CnContentCarousel
      variant="cards"
      title="Cumpleaños de la semana"
      icon="cake"
      tone="warning"
      slideWidth={240}
      items={PEOPLE.map(({ id, ...person }) => (
        <CnProfileCard
          key={id}
          {...person}
          layout="vertical"
          cover
          quickActions={[{ label: "Felicitar", icon: "celebration" }]}
        />
      ))}
    />
  ),
};

export const Skeleton: Story = {
  decorators: [(Story) => <Box>{Story()}</Box>],
  render: () => (
    <Box sx={{ display: "grid", gap: "16px" }}>
      <Box sx={grid}>
        <CnProfileCard name="x" layout="vertical" cover email="a" phone="1" skeleton />
        <CnProfileCardSkeleton layout="horizontal" contacts={2} quickActions={1} />
        <CnProfileCardSkeleton layout="compact" status />
      </Box>
      <CnProfileCardGroup title="Cumpleaños" people={[]} skeleton loadingCount={3} />
    </Box>
  ),
};

// ─── Responsive / stress ───────────────────────────────────────────────

const STRESS_WIDTHS = [320, 480, 1200];

const Frames = ({ children }: { children: (width: number) => ReactNode }) => (
  <Box sx={{ display: "grid", gap: "28px" }}>
    {STRESS_WIDTHS.map((width) => (
      <Box key={width}>
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
          Contenedor de {width}px
        </Typography>
        <Box
          data-stress-frame={width}
          sx={{
            width,
            boxSizing: "border-box",
            p: "8px",
            border: "1px dashed var(--cn-color-neutral-300, #c5cad0)",
            borderRadius: "8px",
            display: "grid",
            gap: "12px",
          }}
        >
          {children(width)}
        </Box>
      </Box>
    ))}
  </Box>
);

const EXTREME: CnProfileCardGroupItem = {
  id: "extreme",
  name: "María Fernanda de los Ángeles Pérez-Castañeda y Villaseñor Montenegro",
  role: "Coordinadora Regional de Experiencia de Usuario y Diseño de Servicios Digitales",
  department: "Dirección de Transformación Digital y Mejora Continua",
  location: "Monterrey, Nuevo León, México — Oficina Corporativa Torre Sur, piso 23",
  email: "maria.fernanda.perez.castaneda.villasenor@direccion-transformacion-digital.canek.mx",
  phone: "+52 81 1234 5678",
  whatsapp: true,
  avatarStatus: "away",
  event: { type: "anniversary", date: shift(0, 15) },
  details: [
    { label: "Jefe inmediato", value: "Alejandro Maximiliano Rodríguez de la Fuente Santamaría" },
    { label: "Correo", value: "maria.fernanda.perez.castaneda.villasenor@canek.mx" },
    { label: "Extensión", value: "4521" },
  ],
  tags: [
    "UX",
    "Accesibilidad-y-diseño-inclusivo-para-todas-las-personas",
    "Investigación",
    "Design Ops",
    "Mentoría",
    "CDMX",
    "Monterrey",
    "Remoto",
    "Liderazgo",
    "Servicio al cliente",
    "Figma",
    "Prototipado",
  ],
  quickActions: [
    { label: "Felicitar públicamente", icon: "celebration" },
    { label: "Enviar mensaje directo", icon: "chat", variant: "outlined" },
    { label: "Ver perfil completo", icon: "person", variant: "text" },
    { label: "Agendar reunión", icon: "event", iconOnly: true },
  ],
};

const STRESS_PEOPLE: CnProfileCardGroupItem[] = [
  EXTREME,
  {
    id: "vac",
    name: "Juan Carlos Hernández Gutiérrez de la Garza y Sepúlveda Benavides",
    role: "Analista Senior de Riesgos Financieros Corporativos",
    email: "juan.carlos.hernandez.gutierrez@finanzas.canek.mx",
    phone: "+52 55 9876 5432",
    event: {
      type: "vacation",
      date: shift(-2),
      endDate: shift(12),
      label: "Vacaciones de fin de año y días adicionales",
    },
    quickActions: [{ label: "Cubrir pendientes", icon: "assignment_ind" }],
  },
  {
    id: "new",
    name: "Ximena",
    event: { type: "new-hire", date: shift(1) },
    quickActions: [{ label: "Dar la bienvenida", icon: "person_add" }],
  },
  {
    id: "leave",
    name: "Roberto Alejandro Domínguez Villarreal",
    role: "Soporte",
    event: { type: "leave", date: shift(-1), endDate: shift(3), label: "Incapacidad médica" },
  },
  { id: "empty", name: "Sin datos" },
];

/**
 * Datos extremos (nombre de 60+ caracteres, correo larguísimo, 12 etiquetas,
 * 4 acciones, sin avatar) en contenedores de 320, 480 y 1200 px. Nada se sale
 * de la tarjeta: los textos se truncan, los contactos bajan a la fila de
 * acciones y lo que no cabe va al menú "Más acciones".
 */
export const Responsive: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <Box sx={{ p: "16px", overflowX: "auto" }}>
      <Frames>
        {(width) => (
          <>
            <CnProfileCard {...EXTREME} layout="horizontal" />
            <CnProfileCard {...EXTREME} layout="compact" />
            <Box
              sx={{
                display: "grid",
                gap: "12px",
                gridTemplateColumns: `repeat(auto-fill, minmax(min(${width < 480 ? 140 : 240}px, 100%), 1fr))`,
              }}
            >
              <CnProfileCard {...EXTREME} layout="vertical" cover maxTags={5} />
              <CnProfileCard {...EXTREME} layout="vertical" variant="solid" maxTags={3} />
            </Box>
            <CnProfileCard name="Sin datos" layout="horizontal" />
            <CnProfileCardGroup
              title="Eventos de la semana con un título muy largo para probar el encabezado"
              icon="event"
              people={STRESS_PEOPLE}
              groupByProximity
              maxVisible={4}
            />
            <CnProfileCardGroup
              title="Cuadrícula"
              layout="grid"
              minCardWidth={220}
              people={STRESS_PEOPLE.slice(0, 3)}
            />
          </>
        )}
      </Frames>
    </Box>
  ),
};

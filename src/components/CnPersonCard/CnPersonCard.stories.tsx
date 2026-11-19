import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { CnContentCarousel } from "../CnContentCarousel";
import { CnPersonCard } from "./CnPersonCard";
import type { CnPersonCardGroupItem } from "./CnPersonCardGroup";
import { CnPersonCardGroup } from "./CnPersonCardGroup";
import { CnPersonCardSkeleton } from "./CnPersonCardSkeleton";

/** Fecha ISO relativa a hoy (para que las cuentas regresivas tengan sentido). */
const shift = (days: number, yearsAgo = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setFullYear(d.getFullYear() - yearsAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const PEOPLE: CnPersonCardGroupItem[] = [
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

const meta: Meta<typeof CnPersonCard> = {
  title: "Data Display/CnPersonCard",
  component: CnPersonCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
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
  decorators: [(Story) => <Box sx={{ maxWidth: 420 }}>{Story()}</Box>],
};

export default meta;
type Story = StoryObj<typeof CnPersonCard>;

const grid = {
  display: "grid",
  gap: "16px",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  alignItems: "stretch",
};

export const Default: Story = {};

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
      <CnPersonCard {...args} layout="vertical" cover />
      <Box sx={{ display: "grid", gap: "12px" }}>
        <CnPersonCard {...args} layout="horizontal" />
        <CnPersonCard {...args} layout="compact" />
      </Box>
    </Box>
  ),
};

/** Cada tipo de evento con su tono, ícono y cuenta regresiva. */
export const EventTypes: Story = {
  decorators: [(Story) => <Box>{Story()}</Box>],
  render: () => (
    <Box sx={grid}>
      <CnPersonCard
        name="Cumpleaños hoy"
        event={{ type: "birthday", date: shift(0, 30), showAge: true }}
        quickActions={[{ label: "Felicitar", icon: "celebration" }]}
      />
      <CnPersonCard
        name="Aniversario"
        role="5 años con nosotros"
        event={{ type: "anniversary", date: shift(3, 5) }}
      />
      <CnPersonCard
        name="Nuevo ingreso"
        role="Analista"
        event={{ type: "new-hire", date: shift(2) }}
        quickActions={[{ label: "Dar la bienvenida", icon: "person_add" }]}
      />
      <CnPersonCard
        name="Vacaciones"
        event={{ type: "vacation", date: shift(-2), endDate: shift(4) }}
      />
      <CnPersonCard
        name="Incapacidad"
        event={{ type: "leave", date: shift(5), endDate: shift(12), label: "Incapacidad" }}
      />
      <CnPersonCard
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
        <CnPersonCard
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
      <CnPersonCard
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
      <CnPersonCard
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
    <CnPersonCardGroup
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
    <CnPersonCardGroup
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
        <CnPersonCard
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
        <CnPersonCard name="x" layout="vertical" cover email="a" phone="1" skeleton />
        <CnPersonCardSkeleton layout="horizontal" contacts={2} quickActions={1} />
        <CnPersonCardSkeleton layout="compact" status />
      </Box>
      <CnPersonCardGroup title="Cumpleaños" people={[]} skeleton loadingCount={3} />
    </Box>
  ),
};

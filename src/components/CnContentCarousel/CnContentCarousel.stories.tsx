import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { CnButton } from "../CnButton";
import { CnDocCard } from "../CnDocCard";
import { CnInfoCard } from "../CnInfoCard";
import { CnPersonCard, CnPersonCardSkeleton } from "../CnPersonCard";
import { CnSectionCard } from "../CnSectionCard";
import type { CnContentSlide } from "./CnContentCarousel";
import { CnContentCarousel } from "./CnContentCarousel";
import { CnContentCarouselSkeleton } from "./CnContentCarouselSkeleton";

const img = (id: string) => `https://images.unsplash.com/${id}?w=1600&h=700&fit=crop`;

const ANNOUNCEMENTS: CnContentSlide[] = [
  {
    id: "home-office",
    image: img("photo-1497366216548-37526070297c"),
    imageAlt: "Oficinas con escritorios y plantas",
    badge: "Nuevo",
    eyebrow: "Recursos Humanos",
    title: "Nueva política de trabajo híbrido",
    description:
      "A partir del 1 de diciembre podrás elegir hasta tres días de home office por semana. Revisa los lineamientos y registra tu esquema.",
    actions: [
      { label: "Leer política", icon: "article" },
      { label: "Registrar esquema", variant: "outlined" },
    ],
    caption: "Publicado el 18 nov 2026 · Comunicación interna",
  },
  {
    id: "posada",
    image: img("photo-1530103862676-de8c9debad1d"),
    imageAlt: "Celebración con luces",
    eyebrow: "Eventos",
    title: "¡Posada 2026!",
    description: "Viernes 12 de diciembre, 19:00 h en la terraza. Confirma tu asistencia.",
    actions: [{ label: "Confirmar", icon: "event_available" }],
    align: "center",
    verticalAlign: "center",
    overlay: "solid",
  },
  {
    id: "nomina",
    background: "linear-gradient(120deg, #1d3d6b 0%, #3349d6 100%)",
    eyebrow: "Nómina",
    title: "Tu recibo de noviembre ya está disponible",
    description: "Descárgalo desde el portal o la app.",
    actions: [{ label: "Ver recibo", icon: "receipt_long" }],
  },
  {
    id: "seguridad",
    image: img("photo-1550751827-4bd374c3f58b"),
    imageAlt: "Pantalla con código",
    badge: "Importante",
    title: "Activa la verificación en dos pasos",
    description: "Protege tu cuenta antes del 30 de noviembre.",
    href: "https://canek.mx",
    target: "_blank",
    verticalAlign: "top",
  },
];

const meta: Meta<typeof CnContentCarousel> = {
  title: "Data Display/CnContentCarousel",
  component: CnContentCarousel,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: { slides: ANNOUNCEMENTS },
  argTypes: {
    variant: { control: "inline-radio", options: ["hero", "cards"] },
    overlay: { control: "inline-radio", options: ["gradient", "solid", "none"] },
    captionPosition: { control: "inline-radio", options: ["overlay", "below"] },
    indicators: {
      control: "select",
      options: ["dots", "progress", "fraction", "thumbnails", "none"],
    },
  },
  decorators: [(Story) => <Box sx={{ maxWidth: 1100 }}>{Story()}</Box>],
};

export default meta;
type Story = StoryObj<typeof CnContentCarousel>;

/** Banners de anuncios con autoplay (pausa al pasar el cursor o enfocar). */
export const Announcements: Story = {};

export const ThumbnailsAndProgress: Story = {
  args: {
    indicators: "thumbnails",
    autoplayProgress: true,
    aspectRatio: "16 / 9",
    onViewMore: (slide) => alert(`Ver más: ${String(slide.title)}`),
  },
};

export const CaptionBelow: Story = {
  args: {
    captionPosition: "below",
    aspectRatio: "16 / 9",
    autoplay: false,
    slidesPerView: { xs: 1, md: 2 },
    indicators: "fraction",
  },
};

/** Preset `cards`: fila de tarjetas con encabezado y flechas arriba. */
export const CardsRow: Story = {
  render: () => (
    <CnContentCarousel
      variant="cards"
      title="Avisos"
      subtitle="Lo más reciente de tu organización"
      icon="campaign"
      headerAction={
        <CnButton size="small" variant="text">
          Ver todos
        </CnButton>
      }
      slideWidth={300}
    >
      {(["info", "success", "warning", "accent", "error", "neutral"] as const).map((tone, i) => (
        <CnInfoCard
          key={tone}
          tone={tone}
          variant="outlined"
          title={`Aviso ${i + 1}`}
          description="Contenido breve del aviso para el carrusel."
          actions={[{ label: "Abrir", variant: "link" }]}
          sx={{ height: "100%" }}
        />
      ))}
    </CnContentCarousel>
  ),
};

/** Composición tipo portal de comunicación: anuncios, cumpleaños y documentos recientes. */
export const CommunicationPortal: Story = {
  render: () => {
    const shift = (days: number, years: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return new Date(d.getFullYear() - years, d.getMonth(), d.getDate());
    };
    const people = [
      { name: "María Pérez", role: "Diseño", img: 5, days: 0 },
      { name: "Luis Gómez", role: "Finanzas", img: 12, days: 1 },
      { name: "Ana Torres", role: "TI", img: 9, days: 3 },
      { name: "Jorge Ramírez", role: "Ventas", img: 15, days: 6 },
      { name: "Daniela Castro", role: "RH", img: 20, days: 8 },
    ];
    return (
      <Box sx={{ display: "grid", gap: "24px" }}>
        <CnContentCarousel slides={ANNOUNCEMENTS} aspectRatio={{ xs: "4 / 3", md: "21 / 8" }} />
        <CnContentCarousel
          variant="cards"
          title="Cumpleaños"
          icon="cake"
          tone="warning"
          slideWidth={230}
          items={people.map((p) => (
            <CnPersonCard
              key={p.name}
              layout="vertical"
              cover
              name={p.name}
              role={p.role}
              avatarUrl={`https://i.pravatar.cc/150?img=${p.img}`}
              event={{ type: "birthday", date: shift(p.days, 30) }}
              quickActions={[{ label: "Felicitar", icon: "celebration", variant: "outlined" }]}
            />
          ))}
        />
        <CnSectionCard title="Documentos recientes" icon="description" badge={3}>
          <Box sx={{ display: "grid", gap: "8px" }}>
            <CnDocCard
              name="Reglamento interior 2026.pdf"
              size={1_400_000}
              updatedAt={new Date()}
            />
            <CnDocCard
              name="Calendario de vacaciones.xlsx"
              size={88_000}
              updatedAt={shift(-2, 0)}
            />
            <CnDocCard
              name="Manual de identidad.pptx"
              size={12_000_000}
              updatedAt={shift(-10, 0)}
            />
          </Box>
        </CnSectionCard>
      </Box>
    );
  },
};

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "24px" }}>
      <CnContentCarousel slides={ANNOUNCEMENTS} skeleton aspectRatio="21 / 9" />
      <CnContentCarouselSkeleton
        variant="cards"
        slideWidth={230}
        count={4}
        renderSlide={() => <CnPersonCardSkeleton layout="vertical" cover quickActions={1} />}
      />
    </Box>
  ),
};

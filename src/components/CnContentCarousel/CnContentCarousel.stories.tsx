import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { CnButton } from "../CnButton";
import { CnDocCard } from "../CnDocCard";
import { CnAlert } from "../CnAlert";
import { CnProfileCard, CnProfileCardSkeleton } from "../CnProfileCard";
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
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "**Para qué sirve:** comunicar contenido destacado. Preset `hero`: banners con imagen (`srcSet`/`sizes` y marcador desenfocado), video o degradado, velo que se refuerza en anchos chicos para conservar el contraste, título/descripción con número de líneas y tamaño según el ancho del carrusel (container queries) y CTA que se apilan cuando no caben. Preset `cards`: fila de tarjetas con encabezado, flechas arriba y avance por página.",
          "",
          "**Cuándo NO usarlo:** para una galería o un carrusel con contenido arbitrario sin estos presets usa `CnCarousel` directamente; para un aviso único usa `CnAlert`; para una lista de personas con eventos que el usuario debe ver completa usa `CnProfileCardGroup`.",
          "",
          "**Relación con vecinos:** se construye sobre `CnCarousel` (hereda bucle continuo, autoplay, deslizamiento, `onSlideView`) y suele llevar `CnProfileCard`, `CnDocCard` o `CnSectionCard` en el preset `cards`.",
        ].join("\n"),
      },
    },
  },
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
  // Las historias de pantalla completa (stress) prueban sus propios anchos.
  decorators: [
    (Story, context) =>
      context.parameters.layout === "fullscreen" ? (
        Story()
      ) : (
        <Box sx={{ maxWidth: 1100 }}>{Story()}</Box>
      ),
  ],
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
        <CnAlert
          key={tone}
          color={tone}
          variant="outlined"
          role="note"
          title={`Aviso ${i + 1}`}
          message="Contenido breve del aviso para el carrusel."
          actions={[{ label: "Abrir", variant: "link" }]}
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
            <CnProfileCard
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
        renderSlide={() => <CnProfileCardSkeleton layout="vertical" cover quickActions={1} />}
      />
    </Box>
  ),
};

// ─── Responsive / stress ───────────────────────────────────────────────

const STRESS_WIDTHS = [320, 480, 1200];

const EXTREME_SLIDES: CnContentSlide[] = [
  {
    id: "long",
    image: img("photo-1497366216548-37526070297c"),
    imageSrcSet: [480, 960, 1600]
      .map(
        (w) =>
          `https://images.unsplash.com/photo-1497366216548-37526070297c?w=${w}&h=${Math.round(w * 0.44)}&fit=crop ${w}w`,
      )
      .join(", "),
    imageSizes: "(max-width: 600px) 100vw, 1100px",
    placeholder:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=24&h=10&fit=crop&blur=10",
    imageAlt: "Oficinas",
    badge: "Importante y urgente para toda la organización",
    eyebrow: "Dirección General de Recursos Humanos y Desarrollo Organizacional",
    title:
      "Nueva política de trabajo híbrido, horarios flexibles y lineamientos de seguridad para todas las sedes del país a partir del primero de diciembre",
    description:
      "A partir del 1 de diciembre podrás elegir hasta tres días de home office por semana. Revisa los lineamientos, registra tu esquema en el portal antes del viernes y confirma con tu jefe inmediato. Supercalifragilisticoespialidosoextraordinariamentelargo.",
    actions: [
      { label: "Leer la política completa", icon: "article" },
      { label: "Registrar mi esquema de trabajo", variant: "outlined" },
      { label: "Preguntas frecuentes", variant: "outlined", icon: "help" },
    ],
    caption: "Publicado el 18 nov 2026 · Comunicación interna · Foto: Unsplash",
  },
  {
    id: "center",
    image: img("photo-1530103862676-de8c9debad1d"),
    imageAlt: "Celebración",
    eyebrow: "Eventos",
    title: "¡Posada 2026! Viernes 12 de diciembre en la terraza del edificio corporativo",
    description: "Confirma tu asistencia.",
    actions: [{ label: "Confirmar asistencia", icon: "event_available" }],
    align: "center",
    verticalAlign: "center",
  },
  {
    id: "dark",
    background: "linear-gradient(120deg, #f5f7fb 0%, #dde6f5 100%)",
    textColor: "dark",
    title: "Recibo de nómina",
    description: "Sin imagen y con texto oscuro.",
    actions: [{ label: "Ver recibo", icon: "receipt_long" }],
  },
];

/**
 * Datos extremos (títulos de 3+ líneas, descripciones largas, palabras sin
 * espacios, 3 CTA) en carruseles de 320, 480 y 1200 px. El banner crece si el
 * texto no cabe, el velo se refuerza en anchos chicos y los CTA se apilan.
 */
export const ResponsiveStress: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <Box sx={{ p: "16px", display: "grid", gap: "28px", overflowX: "auto" }}>
      {STRESS_WIDTHS.map((width) => (
        <Box key={width}>
          <Box component="span" sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary" }}>
            Contenedor de {width}px
          </Box>
          <Box
            data-stress-frame={width}
            sx={{
              width,
              boxSizing: "border-box",
              p: "8px",
              border: "1px dashed var(--cn-color-neutral-300, #c5cad0)",
              borderRadius: "8px",
              display: "grid",
              gap: "16px",
            }}
          >
            <CnContentCarousel
              slides={EXTREME_SLIDES}
              autoplay={false}
              autoplayProgress
              onViewMore={() => undefined}
            />
            <CnContentCarousel
              slides={EXTREME_SLIDES}
              autoplay={false}
              captionPosition="below"
              indicators="thumbnails"
              aspectRatio={{ xs: "16 / 9", lg: "21 / 9" }}
            />
            <CnContentCarousel
              variant="cards"
              title="Cumpleaños y aniversarios de la semana en todas las sedes"
              subtitle="Celebra a tus compañeros de todas las áreas"
              icon="cake"
              tone="warning"
              slideWidth={240}
              headerAction={
                <CnButton size="small" variant="text">
                  Ver todos
                </CnButton>
              }
              items={[0, 1, 2, 3].map((i) => (
                <CnProfileCard
                  key={i}
                  layout="vertical"
                  cover
                  name={
                    i === 0
                      ? "María Fernanda de los Ángeles Pérez-Castañeda y Villaseñor Montenegro"
                      : `Persona ${i + 1}`
                  }
                  role="Coordinadora Regional de Experiencia de Usuario"
                  email="maria.fernanda.perez.castaneda@canek.mx"
                  phone="+52 55 1234 5678"
                  whatsapp
                  event={{
                    type: "birthday",
                    date: `1990-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(Math.min(28, new Date().getDate() + i)).padStart(2, "0")}`,
                  }}
                  tags={["UX", "CDMX", "Accesibilidad", "Mentoría", "Figma"]}
                  maxTags={3}
                  quickActions={[
                    { label: "Felicitar", icon: "celebration" },
                    { label: "Enviar mensaje", icon: "chat", variant: "outlined" },
                  ]}
                />
              ))}
            />
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

/** Bucle continuo, progreso sincronizado con el autoplay y analítica por diapositiva. */
export const SeamlessLoopAndAnalytics: Story = {
  args: {
    autoplay: true,
    interval: 3500,
    autoplayProgress: true,
    loop: true,

    onSlideView: (slide, index) => console.info("onSlideView", index, slide?.id),
  },
};

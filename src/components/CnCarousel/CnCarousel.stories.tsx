import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { useRef, useState } from "react";
import { CnButton } from "../CnButton";
import { CnAlert } from "../CnAlert";
import type { CnCarouselActions } from "./CnCarousel";
import { CnCarousel } from "./CnCarousel";
import { CnCarouselSkeleton } from "./CnCarouselSkeleton";

const PHOTOS = [
  "photo-1497366216548-37526070297c",
  "photo-1522071820081-009f0129c71c",
  "photo-1552664730-d307ca884978",
  "photo-1521737604893-d14cc237f11d",
  "photo-1556761175-5973dc0f32e7",
  "photo-1517245386807-bb43f82c33c4",
  "photo-1531482615713-2afd69097998",
].map((id, i) => ({
  id,
  title: `Foto ${i + 1}`,
  src: `https://images.unsplash.com/${id}?w=1200&h=675&fit=crop`,
  thumb: `https://images.unsplash.com/${id}?w=160&h=110&fit=crop`,
}));

const COLORS = [
  "#254d87",
  "#3349d6",
  "#228740",
  "#b8831a",
  "#b52f2f",
  "#2367a8",
  "#4e5660",
  "#6d3fc0",
];

const Tile = ({ n }: { n: number }) => (
  <Box
    sx={{
      height: 140,
      borderRadius: "var(--cn-radius-lg, 12px)",
      display: "grid",
      placeItems: "center",
      color: "#fff",
      fontSize: 28,
      fontWeight: 700,
      backgroundColor: COLORS[(n - 1) % COLORS.length],
    }}
  >
    {n}
  </Box>
);

const tiles = (count: number) =>
  Array.from({ length: count }, (_, i) => <Tile key={i} n={i + 1} />);

const meta: Meta<typeof CnCarousel> = {
  title: "Data Display/CnCarousel",
  component: CnCarousel,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          '**Para qué sirve:** motor genérico de carrusel para cualquier contenido (imágenes, tarjetas, nodos propios): diapositivas por vista según el ancho del contenedor, vistazo (`peek`), bucle continuo sin saltos (`loopMode="seamless"`), autoplay accesible con progreso sincronizado (se pausa al pasar el cursor, al enfocar o con el botón), flechas, puntos/progreso/fracción/miniaturas, arrastre y deslizamiento táctil con umbral y velocidad, teclado, RTL, carga diferida, `slideAspectRatio` por breakpoint y `onSlideView` para analítica.',
          "",
          "**Cuándo NO usarlo:** para banners de anuncios con imagen, título y CTA o para una fila de tarjetas con encabezado usa `CnContentCarousel` (ya trae esos presets); para navegar entre secciones usa `CnTabs`; para listas largas que el usuario recorre completas usa `CnList` o una cuadrícula.",
          "",
          "**Relación con vecinos:** `CnContentCarousel` está construido encima de este componente; `CnProfileCard`, `CnDocCard` o `CnSectionCard` pueden ser sus diapositivas.",
        ].join("\n"),
      },
    },
  },
  args: { slidesPerView: 1, gap: 16, indicators: "dots", arrows: true },
  argTypes: {
    indicators: {
      control: "select",
      options: ["dots", "progress", "fraction", "thumbnails", "none"],
    },
    arrowsPosition: { control: "inline-radio", options: ["inside", "outside", "top"] },
    arrows: { control: "select", options: [true, false, "hover"] },
  },
  // Las historias de pantalla completa (stress) prueban sus propios anchos.
  decorators: [
    (Story, context) =>
      context.parameters.layout === "fullscreen" ? (
        Story()
      ) : (
        <Box sx={{ maxWidth: 900 }}>{Story()}</Box>
      ),
  ],
};

export default meta;
type Story = StoryObj<typeof CnCarousel>;

export const Default: Story = {
  render: (args) => <CnCarousel {...args}>{tiles(6)}</CnCarousel>,
};

/** Responsivo por ancho del contenedor: 1 → 2 → 3 → 4 diapositivas. */
export const Responsive: Story = {
  render: () => (
    <CnCarousel
      slidesPerView={{ xs: 1, sm: 2, md: 3, lg: 4 }}
      slidesPerMove="page"
      gap={{ xs: 8, md: 16 }}
    >
      {tiles(10)}
    </CnCarousel>
  ),
};

/** Vistazo de la siguiente diapositiva (`peek`) y fracciones (`slidesPerView={1.3}`). */
export const Peek: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "24px" }}>
      <CnCarousel peek={64} indicators="fraction">
        {tiles(6)}
      </CnCarousel>
      <CnCarousel slidesPerView={2.4} indicators="progress" arrows="hover">
        {tiles(8)}
      </CnCarousel>
    </Box>
  ),
};

/** Ancho fijo por diapositiva (`slideWidth`). */
export const FixedSlideWidth: Story = {
  render: () => (
    <CnCarousel slideWidth={200} slidesPerMove="page" arrowsPosition="outside" indicators="dots">
      {tiles(12)}
    </CnCarousel>
  ),
};

export const AutoplayAndLoop: Story = {
  render: () => (
    <CnCarousel autoplay interval={3000} autoplayProgress loop indicators="dots">
      {tiles(5)}
    </CnCarousel>
  ),
};

/** Datos + `renderItem`, miniaturas y carga diferida de imágenes. */
export const ThumbnailsLazy: Story = {
  render: () => (
    <CnCarousel
      items={PHOTOS}
      getItemKey={(p) => p.id}
      getItemLabel={(p) => p.title}
      renderItem={(photo) => (
        <Box
          component="img"
          src={photo.src}
          alt={photo.title}
          loading="lazy"
          sx={{
            width: "100%",
            aspectRatio: "16 / 9",
            objectFit: "cover",
            borderRadius: "var(--cn-radius-lg, 12px)",
            display: "block",
          }}
        />
      )}
      indicators="thumbnails"
      renderThumbnail={(photo) => <img src={photo?.thumb} alt="" />}
      lazy={1}
    />
  ),
};

export const TopToolbar: Story = {
  render: () => (
    <CnCarousel
      arrowsPosition="top"
      indicators="none"
      slidesPerView={{ xs: 1.2, sm: 2.2, md: 3 }}
      slidesPerMove="page"
      header={<Typography sx={{ fontWeight: 700, fontSize: 14 }}>Avisos importantes</Typography>}
    >
      {(["info", "success", "warning", "error", "accent"] as const).map((tone) => (
        <CnAlert
          key={tone}
          color={tone}
          variant="left-accent"
          role="note"
          title={`Aviso ${tone}`}
          message="Contenido del aviso."
        />
      ))}
    </CnCarousel>
  ),
};

/** Índice controlado y acciones imperativas (`actionRef`). */
export const Controlled: Story = {
  render: function Render() {
    const [index, setIndex] = useState(2);
    const ref = useRef<CnCarouselActions>(null);
    return (
      <Box sx={{ display: "grid", gap: "12px" }}>
        <Box sx={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <Typography sx={{ fontSize: 13 }}>Índice: {index}</Typography>
          <CnButton size="small" variant="outlined" onClick={() => setIndex(0)}>
            Ir al inicio
          </CnButton>
          <CnButton size="small" variant="outlined" onClick={() => ref.current?.next()}>
            Siguiente (ref)
          </CnButton>
        </Box>
        <CnCarousel index={index} onChange={setIndex} actionRef={ref} slidesPerView={2}>
          {tiles(7)}
        </CnCarousel>
      </Box>
    );
  },
};

export const Empty: Story = {
  render: () => (
    <CnCarousel emptyState={{ title: "Sin anuncios", description: "Vuelve más tarde." }} />
  ),
};

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "24px" }}>
      <CnCarousel skeleton skeletonAspectRatio="21 / 9">
        {tiles(3)}
      </CnCarousel>
      <CnCarouselSkeleton slidesPerView={3} height={140} arrowsPosition="top" indicators="none" />
      <CnCarouselSkeleton indicators="thumbnails" />
    </Box>
  ),
};

/**
 * Anchos de contenedor 320 / 480 / 1200 px con flechas, puntos y botón de
 * pausa: nada se desborda (los puntos hacen wrap y el botón de pausa siempre
 * queda visible). Bucle continuo: al pasar de la última a la primera no hay
 * salto hacia atrás.
 */
export const Stress: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <Box sx={{ p: "16px", display: "grid", gap: "28px", overflowX: "auto" }}>
      {[320, 480, 1200].map((width) => (
        <Box
          key={width}
          data-stress-frame={width}
          sx={{
            width,
            boxSizing: "border-box",
            p: "8px",
            border: "1px dashed var(--cn-color-neutral-300, #c5cad0)",
            display: "grid",
            gap: "16px",
          }}
        >
          <CnCarousel
            loop
            autoplay
            autoplayProgress
            slidesPerView={{ xs: 1, sm: 2, md: 3 }}
            slideAspectRatio={{ xs: "4 / 3", md: "16 / 9" }}
          >
            {tiles(24)}
          </CnCarousel>
          <CnCarousel slideWidth={360} peek={40} arrowsPosition="outside" indicators="progress">
            {tiles(6)}
          </CnCarousel>
        </Box>
      ))}
    </Box>
  ),
};

/** Dirección de derecha a izquierda: el arrastre, las flechas y el teclado se invierten. */
export const RightToLeft: Story = {
  render: () => (
    <Box dir="rtl">
      <CnCarousel slidesPerView={2} loop>
        {tiles(6)}
      </CnCarousel>
    </Box>
  ),
};

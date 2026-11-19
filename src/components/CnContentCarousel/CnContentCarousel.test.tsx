import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CnContentSlide } from "./CnContentCarousel";
import { CnContentCarousel } from "./CnContentCarousel";
import { CnContentCarouselSkeleton } from "./CnContentCarouselSkeleton";

const SLIDES: CnContentSlide[] = [
  {
    id: "a",
    image: "https://cdn.test/a.jpg",
    imageAlt: "Oficinas",
    badge: "Nuevo",
    eyebrow: "Comunicado",
    title: "Nueva política de home office",
    description: "Conoce los cambios a partir de diciembre.",
    actions: [{ label: "Leer más", href: "https://canek.mx/a" }, { label: "Descargar" }],
  },
  {
    id: "b",
    background: "linear-gradient(135deg, #254d87, #3d5afe)",
    title: "Posada 2026",
    href: "https://canek.mx/posada",
    caption: "Foto: Comunicación interna",
  },
  { id: "c", image: "javascript:alert(1)", title: "Inseguro" },
];

describe("CnContentCarousel (hero)", () => {
  it("renders hero slides with image, texts, CTA and caption", () => {
    const { container } = render(<CnContentCarousel slides={SLIDES} autoplay={false} />);
    expect(screen.getByRole("region", { name: "Anuncios" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Oficinas" })).toHaveAttribute(
      "src",
      "https://cdn.test/a.jpg",
    );
    expect(screen.getByText("Nueva política de home office")).toBeInTheDocument();
    expect(screen.getByText("Nuevo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Leer más" })).toHaveAttribute(
      "href",
      "https://canek.mx/a",
    );
    expect(container.querySelector("[data-cn-hero-overlay]")).not.toBeNull();
    expect(screen.getByText("Foto: Comunicación interna").tagName).toBe("FIGCAPTION");
    const slides = container.querySelectorAll("[data-cn-carousel-slide]");
    expect(slides[0]).toHaveAttribute("aria-label", "1 de 3: Nueva política de home office");
  });

  it("links whole slides and drops unsafe image URLs", () => {
    const { container } = render(<CnContentCarousel slides={SLIDES} autoplay={false} />);
    expect(container.querySelector("[data-cn-hero-link]")).toHaveAttribute(
      "href",
      "https://canek.mx/posada",
    );
    expect(container.querySelector('img[src^="javascript"]')).toBeNull();
  });

  it("calls onViewMore and onSlideClick", () => {
    const onViewMore = vi.fn();
    const onSlideClick = vi.fn();
    render(
      <CnContentCarousel
        slides={SLIDES.slice(0, 1)}
        autoplay={false}
        onViewMore={onViewMore}
        onSlideClick={onSlideClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ver más" }));
    expect(onViewMore).toHaveBeenCalledWith(SLIDES[0], 0);
    expect(onSlideClick).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Nueva política de home office"));
    expect(onSlideClick).toHaveBeenCalledWith(SLIDES[0], 0);
  });

  it("supports captions below the media and thumbnails", () => {
    const { container } = render(
      <CnContentCarousel
        slides={SLIDES}
        autoplay={false}
        captionPosition="below"
        indicators="thumbnails"
      />,
    );
    expect(container.querySelector("[data-cn-hero-overlay]")).toBeNull();
    expect(container.querySelector("[data-cn-carousel-thumbnails]")?.children).toHaveLength(3);
  });

  it("autoplays by default with a pause control", () => {
    render(<CnContentCarousel slides={SLIDES} />);
    expect(screen.getByRole("button", { name: "Pausar carrusel" })).toBeInTheDocument();
  });

  it("renders the skeleton", () => {
    render(<CnContentCarousel slides={SLIDES} skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "carousel");
  });
});

describe("CnContentCarousel (cards)", () => {
  it("renders a header with title and arrows on top", () => {
    const { container } = render(
      <CnContentCarousel
        variant="cards"
        title="Cumpleaños"
        icon="cake"
        headerAction={<a href="/cumples">Ver todos</a>}
        slidesPerView={2}
      >
        <div>Tarjeta 1</div>
        <div>Tarjeta 2</div>
        <div>Tarjeta 3</div>
      </CnContentCarousel>,
    );
    expect(screen.getByRole("region", { name: "Cumpleaños" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cumpleaños" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todos" })).toBeInTheDocument();
    const toolbar = container.querySelector("[data-cn-carousel-toolbar]") as HTMLElement;
    expect(toolbar.querySelector('[data-cn-carousel-arrow="next"]')).not.toBeNull();
    expect(screen.getByText("Tarjeta 3")).toBeInTheDocument();
  });

  it("accepts items and renders the cards skeleton", () => {
    const { rerender } = render(
      <CnContentCarousel
        variant="cards"
        items={[<span key="1">A</span>, <span key="2">B</span>]}
      />,
    );
    expect(screen.getByText("B")).toBeInTheDocument();
    rerender(<CnContentCarousel variant="cards" title="X" skeleton skeletonCount={3} />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "carousel");
  });
});

describe("CnContentCarouselSkeleton", () => {
  it("renders hero and cards variants", () => {
    const { container, rerender } = render(<CnContentCarouselSkeleton />);
    expect(container.querySelector("[data-cn-hero-skeleton]")).not.toBeNull();
    rerender(<CnContentCarouselSkeleton variant="cards" count={3} />);
    expect(container.querySelectorAll("[data-cn-carousel-skeleton-slide]")).toHaveLength(3);
  });
});

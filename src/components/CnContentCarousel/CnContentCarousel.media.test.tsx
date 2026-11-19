import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CnContentSlide } from "./CnContentCarousel";
import { CnContentCarousel, overlayBackground } from "./CnContentCarousel";

const SLIDES: CnContentSlide[] = [
  { id: "a", image: "https://cdn.test/a.jpg", imageAlt: "Uno", title: "Uno" },
  { id: "b", background: "#123", title: "Dos" },
  { id: "c", title: "Tres" },
];

describe("CnContentCarousel (responsive media)", () => {
  it("renders srcSet, sizes and a blur-up placeholder, dropping unsafe candidates", () => {
    const { container } = render(
      <CnContentCarousel
        autoplay={false}
        slides={[
          {
            id: "a",
            image: "https://cdn.test/a-1600.jpg",
            imageSrcSet:
              "https://cdn.test/a-640.jpg 640w, javascript:alert(1) 800w, https://cdn.test/a-1600.jpg 1600w",
            imageSizes: "(max-width: 600px) 100vw, 1100px",
            placeholder: "data:image/png;base64,AAAA",
            imageAlt: "Oficinas",
            title: "Título",
          },
        ]}
      />,
    );
    const img = screen.getByRole("img", { name: "Oficinas" });
    expect(img).toHaveAttribute(
      "srcset",
      "https://cdn.test/a-640.jpg 640w, https://cdn.test/a-1600.jpg 1600w",
    );
    expect(img).toHaveAttribute("sizes", "(max-width: 600px) 100vw, 1100px");
    expect(container.querySelector("[data-cn-hero-placeholder]")).not.toBeNull();
    expect(img).not.toHaveAttribute("data-loaded");
    fireEvent.load(img);
    expect(img).toHaveAttribute("data-loaded", "true");
  });

  it("calls onSlideView with the slide and its index", () => {
    const onSlideView = vi.fn();
    render(<CnContentCarousel slides={SLIDES} autoplay={false} onSlideView={onSlideView} />);
    expect(onSlideView).toHaveBeenCalledWith(SLIDES[0], 0);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(onSlideView).toHaveBeenLastCalledWith(SLIDES[1], 1);
  });

  it("lets the banner grow instead of clipping its text", () => {
    const { container } = render(<CnContentCarousel slides={SLIDES} autoplay={false} />);
    const media = container.querySelector("[data-cn-hero-media]") as HTMLElement;
    // El recorte de la imagen vive en una capa aparte; el contenedor del texto no recorta.
    expect(getComputedStyle(media).overflow).not.toBe("hidden");
    expect(media.querySelector("[data-cn-hero-backdrop]")).not.toBeNull();
  });

  it("strengthens the overlay for compact widths", () => {
    expect(overlayBackground("none", "bottom", 0.7, true)).toBe("none");
    const wide = overlayBackground("gradient", "bottom", 0.7, true);
    const compact = overlayBackground("gradient", "bottom", 0.7, true, true);
    expect(wide).toContain("rgba(0, 0, 0, 0.000) 80%");
    // En compacto nunca llega a transparente.
    expect(compact).toContain("rgba(0, 0, 0, 0.210) 100%");
    expect(overlayBackground("solid", "bottom", 0.5, false)).toBe("rgba(255, 255, 255, 0.350)");
  });

  it("renders extreme content without dropping CTAs", () => {
    render(
      <CnContentCarousel
        autoplay={false}
        slides={[
          {
            title: "T".repeat(200),
            description: "D".repeat(600),
            actions: [{ label: "Uno" }, { label: "Dos" }, { label: "Tres" }],
          },
        ]}
      />,
    );
    expect(screen.getAllByRole("button", { name: /Uno|Dos|Tres/ })).toHaveLength(3);
  });
});

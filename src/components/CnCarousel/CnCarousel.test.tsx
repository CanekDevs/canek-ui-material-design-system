import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CnCarouselActions } from "./CnCarousel";
import { CnCarousel, resolveResponsive } from "./CnCarousel";
import { CnCarouselSkeleton } from "./CnCarouselSkeleton";

const slides = (n: number) =>
  Array.from({ length: n }, (_, i) => <div key={i}>{`Slide ${i + 1}`}</div>);

const slideEls = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("[data-cn-carousel-slide]"));

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("resolveResponsive", () => {
  const bps = { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 };
  it("picks the largest matching breakpoint", () => {
    expect(resolveResponsive(3, 500, bps, 1)).toBe(3);
    expect(resolveResponsive({ xs: 1, md: 3 }, 500, bps, 1)).toBe(1);
    expect(resolveResponsive({ xs: 1, md: 3 }, 1000, bps, 1)).toBe(3);
    expect(resolveResponsive({ sm: 2 }, 0, bps, 1)).toBe(2);
    expect(resolveResponsive(undefined, 0, bps, 4)).toBe(4);
  });
});

describe("CnCarousel", () => {
  it("exposes the carousel and slide semantics", () => {
    const { container } = render(
      <CnCarousel labels={{ region: "Noticias" }}>{slides(3)}</CnCarousel>,
    );
    const region = screen.getByRole("region", { name: "Noticias" });
    expect(region).toHaveAttribute("aria-roledescription", "carrusel");
    const groups = slideEls(container);
    expect(groups).toHaveLength(3);
    expect(groups[0]).toHaveAttribute("aria-roledescription", "diapositiva");
    expect(groups[0]).toHaveAttribute("aria-label", "1 de 3");
    expect(groups[0]).not.toHaveAttribute("aria-hidden");
    expect(groups[1]).toHaveAttribute("aria-hidden", "true");
    expect(groups[1]).toHaveAttribute("inert");
  });

  it("renders items with renderItem and item labels", () => {
    const { container } = render(
      <CnCarousel
        items={[{ t: "Uno" }, { t: "Dos" }]}
        getItemLabel={(item) => item.t}
        renderItem={(item, meta) => <span>{`${item.t}${meta.isActive ? " (activa)" : ""}`}</span>}
      />,
    );
    expect(screen.getByText("Uno (activa)")).toBeInTheDocument();
    expect(slideEls(container)[1]).toHaveAttribute("aria-label", "2 de 2: Dos");
  });

  it("navigates with arrows, dots and keyboard", () => {
    const onChange = vi.fn();
    const { container } = render(<CnCarousel onChange={onChange}>{slides(4)}</CnCarousel>);
    const prev = screen.getByRole("button", { name: "Anterior" });
    expect(prev).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(onChange).toHaveBeenLastCalledWith(1);
    expect(screen.getByRole("button", { name: "Ir a la diapositiva 2" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Ir a la diapositiva 4" }));
    expect(onChange).toHaveBeenLastCalledWith(3);
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
    const track = container.querySelector("[data-cn-carousel-track]") as HTMLElement;
    fireEvent.keyDown(track, { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith(0);
    fireEvent.keyDown(track, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(track, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith(3);
    expect(screen.getByText("4 de 4")).toBeInTheDocument();
  });

  it("wraps around with loop", () => {
    const onChange = vi.fn();
    render(
      <CnCarousel loop onChange={onChange}>
        {slides(3)}
      </CnCarousel>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(onChange).toHaveBeenLastCalledWith(2);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it("supports a controlled index and the action ref", () => {
    const onChange = vi.fn();
    const ref = createRef<CnCarouselActions>();
    const { container, rerender } = render(
      <CnCarousel index={2} onChange={onChange} actionRef={ref}>
        {slides(4)}
      </CnCarousel>,
    );
    expect(slideEls(container)[2]).toHaveAttribute("data-active", "true");
    act(() => ref.current?.next());
    expect(onChange).toHaveBeenCalledWith(3);
    // Sigue controlado: el índice no cambia hasta que el padre lo actualice.
    expect(slideEls(container)[2]).toHaveAttribute("data-active", "true");
    rerender(
      <CnCarousel index={0} onChange={onChange} actionRef={ref}>
        {slides(4)}
      </CnCarousel>,
    );
    expect(slideEls(container)[0]).toHaveAttribute("data-active", "true");
  });

  it("shows several slides per view and moves by page", () => {
    const onChange = vi.fn();
    const { container } = render(
      <CnCarousel slidesPerView={2} slidesPerMove="page" onChange={onChange}>
        {slides(5)}
      </CnCarousel>,
    );
    const groups = slideEls(container);
    expect(groups[1]).not.toHaveAttribute("aria-hidden");
    expect(groups[2]).toHaveAttribute("aria-hidden", "true");
    // posiciones 0, 2, 3 → 3 puntos
    expect(screen.getAllByRole("button", { name: /Ir a la diapositiva/ })).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it("autoplays, pauses on hover and with the pause button", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { container } = render(
      <CnCarousel autoplay interval={1000} onChange={onChange}>
        {slides(3)}
      </CnCarousel>,
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onChange).toHaveBeenLastCalledWith(1);
    expect(container.querySelector("[aria-live]")).toHaveAttribute("aria-live", "off");

    const region = screen.getByRole("region");
    fireEvent.pointerEnter(region, { pointerType: "mouse" });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.pointerLeave(region);

    fireEvent.click(screen.getByRole("button", { name: "Pausar carrusel" }));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Reproducir carrusel" })).toBeInTheDocument();
    expect(container.querySelector("[aria-live]")).toHaveAttribute("aria-live", "polite");
  });

  it("starts paused when the user prefers reduced motion", () => {
    vi.useFakeTimers();
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: query.includes("reduce"),
          media: query,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList,
    );
    const onChange = vi.fn();
    render(
      <CnCarousel autoplay interval={500} onChange={onChange}>
        {slides(3)}
      </CnCarousel>,
    );
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Reproducir carrusel" })).toBeInTheDocument();
  });

  it("mounts only nearby slides when lazy", () => {
    render(
      <CnCarousel lazy={1} defaultIndex={0}>
        {slides(6)}
      </CnCarousel>,
    );
    expect(screen.getByText("Slide 1")).toBeInTheDocument();
    expect(screen.getByText("Slide 2")).toBeInTheDocument();
    expect(screen.queryByText("Slide 4")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ir a la diapositiva 4" }));
    expect(screen.getByText("Slide 4")).toBeInTheDocument();
    // Las ya cargadas permanecen montadas.
    expect(screen.getByText("Slide 1")).toBeInTheDocument();
  });

  it("renders fraction, progress and thumbnail indicators", () => {
    const { rerender, container } = render(
      <CnCarousel indicators="fraction">{slides(3)}</CnCarousel>,
    );
    expect(container.querySelector("[data-cn-carousel-fraction]")).toHaveTextContent("1 / 3");
    rerender(<CnCarousel indicators="progress">{slides(3)}</CnCarousel>);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    rerender(
      <CnCarousel indicators="thumbnails" renderThumbnail={(_, i) => <span>{`T${i}`}</span>}>
        {slides(3)}
      </CnCarousel>,
    );
    fireEvent.click(screen.getByText("T2"));
    expect(container.querySelector("[data-cn-carousel-fraction]")).toBeNull();
    expect(slideEls(container)[2]).toHaveAttribute("data-active", "true");
  });

  it("places arrows in a top toolbar with a header", () => {
    const { container } = render(
      <CnCarousel arrowsPosition="top" header={<h2>Cumpleaños</h2>} indicators="none">
        {slides(3)}
      </CnCarousel>,
    );
    const toolbar = container.querySelector("[data-cn-carousel-toolbar]") as HTMLElement;
    expect(toolbar).toHaveTextContent("Cumpleaños");
    expect(toolbar.querySelector('[data-cn-carousel-arrow="next"]')).not.toBeNull();
  });

  it("hides controls when everything fits and shows the empty state", () => {
    const { rerender } = render(<CnCarousel slidesPerView={3}>{slides(2)}</CnCarousel>);
    expect(screen.queryByRole("button", { name: "Siguiente" })).not.toBeInTheDocument();
    rerender(<CnCarousel emptyState={{ title: "Sin anuncios" }} />);
    expect(screen.getByText("Sin anuncios")).toBeInTheDocument();
  });

  it("renders the skeleton via the skeleton prop", () => {
    render(<CnCarousel skeleton>{slides(3)}</CnCarousel>);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "carousel");
    expect(screen.queryByText("Slide 1")).not.toBeInTheDocument();
  });
});

describe("CnCarouselSkeleton", () => {
  it("draws slides and indicators", () => {
    const { container, rerender } = render(<CnCarouselSkeleton slidesPerView={3} />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(container.querySelectorAll("[data-cn-carousel-skeleton-slide]")).toHaveLength(3);
    rerender(<CnCarouselSkeleton indicators="none" arrowsPosition="top" />);
    expect(container.querySelector("[data-cn-carousel-skeleton-indicators]")).toBeNull();
    expect(container.querySelector("[data-cn-carousel-skeleton-toolbar]")).not.toBeNull();
  });
});

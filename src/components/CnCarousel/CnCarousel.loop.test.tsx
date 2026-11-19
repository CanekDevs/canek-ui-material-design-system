import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CnCarousel } from "./CnCarousel";

const slides = (n: number) =>
  Array.from({ length: n }, (_, i) => <div key={i}>{`Slide ${i + 1}`}</div>);

const slideEls = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("[data-cn-carousel-slide]"));

/** jsdom no mide: simula el ancho del carrusel para activar el bucle continuo. */
const mockTrackWidth = (width: number) =>
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(width);

/** jsdom no implementa PointerEvent: MouseEvent con el tipo de puntero táctil. */
const pointer = (target: HTMLElement, type: string, clientX: number, clientY: number) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
    button: 0,
  });
  Object.defineProperty(event, "pointerType", { value: "touch" });
  Object.defineProperty(event, "pointerId", { value: 1 });
  act(() => {
    target.dispatchEvent(event);
  });
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("CnCarousel (seamless loop)", () => {
  it("adds inert clones at both ends once measured", () => {
    mockTrackWidth(600);
    const onChange = vi.fn();
    const { container } = render(
      <CnCarousel loop onChange={onChange}>
        {slides(4)}
      </CnCarousel>,
    );
    const clones = container.querySelectorAll("[data-cn-carousel-clone]");
    // slidesPerView 1 → ceil(1) + 1 = 2 copias por lado.
    expect(clones).toHaveLength(4);
    clones.forEach((clone) => {
      expect(clone).toHaveAttribute("aria-hidden", "true");
      expect(clone).toHaveAttribute("inert");
    });
    expect(clones[0]).toHaveAttribute("data-cn-carousel-clone", "2");
    expect(clones[3]).toHaveAttribute("data-cn-carousel-clone", "1");
    // Las copias no cuentan como diapositivas accesibles.
    expect(slideEls(container)).toHaveLength(4);
    expect(screen.getAllByRole("group")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(onChange).toHaveBeenLastCalledWith(3);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it("does not clone in rewind mode or without loop", () => {
    mockTrackWidth(600);
    const { container, rerender } = render(
      <CnCarousel loop loopMode="rewind">
        {slides(4)}
      </CnCarousel>,
    );
    expect(container.querySelectorAll("[data-cn-carousel-clone]")).toHaveLength(0);
    rerender(<CnCarousel>{slides(4)}</CnCarousel>);
    expect(container.querySelectorAll("[data-cn-carousel-clone]")).toHaveLength(0);
  });

  it("passes clone metadata, container width and slideAspectRatio to slides", () => {
    mockTrackWidth(600);
    const metas: { isClone: boolean; containerWidth: number }[] = [];
    const { container } = render(
      <CnCarousel
        loop
        items={[1, 2, 3]}
        slideAspectRatio={{ xs: "4 / 3", lg: "21 / 9" }}
        renderItem={(item, meta) => {
          metas.push({ isClone: meta.isClone, containerWidth: meta.containerWidth });
          return <span>{item}</span>;
        }}
      />,
    );
    expect(metas.some((m) => m.isClone)).toBe(true);
    expect(metas.some((m) => m.containerWidth === 600)).toBe(true);
    expect(getComputedStyle(slideEls(container)[0]).aspectRatio).toMatch(/^4 ?\/ ?3$/);
  });
});

describe("CnCarousel (analytics, swipe, RTL, autoplay)", () => {
  it("reports slides entering the viewport with onSlideView", () => {
    const onSlideView = vi.fn();
    render(
      <CnCarousel
        items={["a", "b", "c", "d"]}
        renderItem={(item) => <span>{item}</span>}
        slidesPerView={2}
        onSlideView={onSlideView}
      />,
    );
    expect(onSlideView.mock.calls).toEqual([
      [0, "a"],
      [1, "b"],
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    // Solo la que entra ("c"); "b" sigue visible.
    expect(onSlideView).toHaveBeenLastCalledWith(2, "c");
    expect(onSlideView).toHaveBeenCalledTimes(3);
  });

  it("changes slide on a swipe past the threshold and snaps back otherwise", () => {
    const onChange = vi.fn();
    const { container } = render(
      <CnCarousel onChange={onChange} swipeThreshold={30} swipeVelocity={1000}>
        {slides(3)}
      </CnCarousel>,
    );
    const track = container.querySelector("[data-cn-carousel-track]") as HTMLElement;
    const swipe = (from: number, to: number) => {
      pointer(track, "pointerdown", from, 10);
      pointer(track, "pointermove", (from + to) / 2, 10);
      pointer(track, "pointermove", to, 10);
      pointer(track, "pointerup", to, 10);
    };
    swipe(200, 180); // 20 px < 30 px: vuelve a su lugar
    expect(onChange).not.toHaveBeenCalled();
    swipe(200, 120); // 80 px hacia la izquierda: siguiente
    expect(onChange).toHaveBeenLastCalledWith(1);
    swipe(100, 200); // hacia la derecha: anterior
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it("lets a vertical touch gesture scroll the page", () => {
    const onChange = vi.fn();
    const { container } = render(
      <CnCarousel onChange={onChange} swipeThreshold={10}>
        {slides(3)}
      </CnCarousel>,
    );
    const track = container.querySelector("[data-cn-carousel-track]") as HTMLElement;
    pointer(track, "pointerdown", 100, 0);
    pointer(track, "pointermove", 90, 80);
    pointer(track, "pointerup", 60, 160);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("inverts arrow keys in RTL", () => {
    const onChange = vi.fn();
    const { container } = render(
      <div dir="rtl" style={{ direction: "rtl" }}>
        <CnCarousel onChange={onChange}>{slides(3)}</CnCarousel>
      </div>,
    );
    const track = container.querySelector("[data-cn-carousel-track]") as HTMLElement;
    fireEvent.keyDown(track, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(track, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it("keeps the remaining autoplay time across a hover pause and fills the active dot", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { container } = render(
      <CnCarousel autoplay interval={1000} onChange={onChange}>
        {slides(3)}
      </CnCarousel>,
    );
    expect(container.querySelector("[data-cn-carousel-dot-timer]")).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(600);
    });
    const region = screen.getByRole("region");
    fireEvent.pointerEnter(region, { pointerType: "mouse" });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.pointerLeave(region);
    // Solo faltaban ~400 ms, no el intervalo completo.
    act(() => {
      vi.advanceTimersByTime(450);
    });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("keeps the play/pause button reachable without indicators", () => {
    render(
      <CnCarousel autoplay indicators="none" arrows={false}>
        {slides(3)}
      </CnCarousel>,
    );
    expect(screen.getByRole("button", { name: "Pausar carrusel" })).toBeInTheDocument();
  });
});

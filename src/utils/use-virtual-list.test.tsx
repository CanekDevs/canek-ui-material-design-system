import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LruCache } from "./lru-cache";
import { filterOptionsFast, normalizeSearchText } from "./option-filter";
import type { UseVirtualListParams, UseVirtualListReturn } from "./use-virtual-list";
import { getVirtualSlots, useVirtualList } from "./use-virtual-list";

let api: UseVirtualListReturn | null = null;

const List = (props: UseVirtualListParams) => {
  const virtual = useVirtualList(props);
  api = virtual;
  return (
    <div ref={virtual.scrollRef} data-testid="scroller" style={{ height: 200, overflow: "auto" }}>
      {getVirtualSlots(virtual.items, virtual.totalSize).map((slot) =>
        slot.type === "spacer" ? (
          <div key={slot.key} data-testid="spacer" style={{ height: slot.size }} />
        ) : (
          <div key={slot.item.key} data-index={slot.item.index} data-testid="row">
            Fila {slot.item.index}
          </div>
        ),
      )}
    </div>
  );
};

describe("useVirtualList", () => {
  it("renders only the visible window plus overscan", () => {
    render(<List count={10_000} itemSize={20} defaultViewportHeight={200} overscan={5} />);
    // 200 / 20 = 10 visibles + 5 de margen abajo.
    expect(screen.getAllByTestId("row")).toHaveLength(15);
    expect(api?.totalSize).toBe(200_000);
    const spacers = screen.getAllByTestId("spacer");
    expect(spacers).toHaveLength(1);
    expect(spacers[0]).toHaveStyle({ height: `${200_000 - 15 * 20}px` });
  });

  it("follows the scroll position", () => {
    render(<List count={10_000} itemSize={20} defaultViewportHeight={200} overscan={2} />);
    const scroller = screen.getByTestId("scroller");
    act(() => {
      scroller.scrollTop = 100_000;
      fireEvent.scroll(scroller);
    });
    expect(screen.getByText("Fila 5000")).toBeInTheDocument();
    expect(screen.queryByText("Fila 0")).not.toBeInTheDocument();
    expect(api?.range).toEqual({ start: 4998, end: 5011 });
  });

  it("scrolls to an index with each alignment", () => {
    render(<List count={1000} itemSize={20} defaultViewportHeight={200} />);
    const scroller = screen.getByTestId("scroller");
    act(() => api?.scrollToIndex(500, { align: "start" }));
    expect(scroller.scrollTop).toBe(10_000);
    expect(screen.getByText("Fila 500")).toBeInTheDocument();
    act(() => api?.scrollToIndex(999, { align: "auto" }));
    expect(scroller.scrollTop).toBe(20_000 - 200);
    act(() => api?.scrollToIndex(100, { align: "center" }));
    expect(scroller.scrollTop).toBe(2000 - 90);
  });

  it("keeps pinned rows rendered", () => {
    render(<List count={1000} itemSize={20} defaultViewportHeight={200} pinned={[999]} />);
    expect(screen.getByText("Fila 999")).toBeInTheDocument();
  });

  it("supports per-index sizes", () => {
    render(
      <List
        count={100}
        itemSize={(index) => (index % 2 ? 40 : 20)}
        defaultViewportHeight={200}
        overscan={0}
      />,
    );
    expect(api?.totalSize).toBe(50 * 20 + 50 * 40);
    act(() => api?.scrollToIndex(10, { align: "start" }));
    expect(screen.getByTestId("scroller").scrollTop).toBe(5 * 20 + 5 * 40);
  });

  it("calls onEndReached near the end", () => {
    const onEndReached = vi.fn();
    render(
      <List count={100} itemSize={20} defaultViewportHeight={200} onEndReached={onEndReached} />,
    );
    expect(onEndReached).not.toHaveBeenCalled();
    act(() => api?.scrollToIndex(99));
    expect(onEndReached).toHaveBeenCalled();
  });

  it("renders everything when disabled", () => {
    render(<List count={50} itemSize={20} enabled={false} />);
    expect(screen.getAllByTestId("row")).toHaveLength(50);
  });
});

describe("option utilities", () => {
  it("filters accent-insensitively by every word and counts the truncated rest", () => {
    const options = [
      { value: 1, label: "Nuevo León" },
      { value: 2, label: "León, Guanajuato" },
      { value: 3, label: "Mérida", searchText: "yucatan" },
    ];
    expect(filterOptionsFast(options, "leon").options.map((o) => o.value)).toEqual([1, 2]);
    expect(filterOptionsFast(options, "nuevo LEON").options.map((o) => o.value)).toEqual([1]);
    expect(filterOptionsFast(options, "yucatán").options.map((o) => o.value)).toEqual([3]);
    expect(filterOptionsFast(options, "", 2)).toEqual({ options: options.slice(0, 2), total: 3 });
    expect(normalizeSearchText(" ÁRBOL ")).toBe("arbol");
  });

  it("evicts the least recently used cache entry", () => {
    const cache = new LruCache<string, number>(2);
    cache.set("a", 1).set("b", 2);
    cache.get("a");
    cache.set("c", 3);
    expect(cache.has("a")).toBe(true);
    expect(cache.has("b")).toBe(false);
    expect(cache.size).toBe(2);
  });
});

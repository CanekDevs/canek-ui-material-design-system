import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CnFieldOption } from "../components/CnForm/CnForm.types";
import type { CnLoadOptionsContext, UseAsyncOptionsParams } from "./use-async-options";
import { clearOptionsCache, useAsyncOptions } from "./use-async-options";
import { useResolvedOptions } from "./use-resolved-options";

const rows = (from: number, count: number): CnFieldOption[] =>
  Array.from({ length: count }, (_, index) => ({
    value: from + index,
    label: `Registro ${from + index}`,
  }));

const pagedServer = (total: number) =>
  vi.fn(async ({ page, pageSize }: CnLoadOptionsContext) => ({
    options: rows(page * pageSize, Math.max(0, Math.min(pageSize, total - page * pageSize))),
    hasMore: (page + 1) * pageSize < total,
    total,
  }));

describe("useAsyncOptions", () => {
  it("loads pages on demand and stops when hasMore is false", async () => {
    const server = pagedServer(25);
    const { result } = renderHook(() => useAsyncOptions({ loadOptions: server, pageSize: 10 }));
    await waitFor(() => expect(result.current.options).toHaveLength(10));
    expect(result.current).toMatchObject({ paginated: true, hasMore: true, total: 25 });

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.options).toHaveLength(20));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.options).toHaveLength(25));
    expect(result.current.hasMore).toBe(false);

    act(() => result.current.loadMore());
    expect(server).toHaveBeenCalledTimes(3);
    expect(server.mock.calls.map(([ctx]) => ctx.page)).toEqual([0, 1, 2]);
  });

  it("ignores duplicated loadMore calls while a page is in flight", async () => {
    const server = pagedServer(100);
    const { result } = renderHook(() => useAsyncOptions({ loadOptions: server, pageSize: 10 }));
    await waitFor(() => expect(result.current.options).toHaveLength(10));
    act(() => {
      result.current.loadMore();
      result.current.loadMore();
    });
    await waitFor(() => expect(result.current.options).toHaveLength(20));
    expect(server).toHaveBeenCalledTimes(2);
  });

  it("keeps array loaders working (no paging)", async () => {
    const loader = vi.fn(async () => rows(0, 3));
    const { result } = renderHook(() => useAsyncOptions({ loadOptions: loader }));
    await waitFor(() => expect(result.current.options).toHaveLength(3));
    expect(result.current).toMatchObject({ paginated: false, hasMore: false });
    act(() => result.current.loadMore());
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("aborts the previous search and serves repeated searches from the cache", async () => {
    const signals: AbortSignal[] = [];
    const loader = vi.fn(async ({ input, signal }: CnLoadOptionsContext) => {
      signals.push(signal);
      await new Promise((resolve) => setTimeout(resolve, 5));
      return [{ value: input, label: input }];
    });
    const { result, rerender } = renderHook(
      (props: UseAsyncOptionsParams) => useAsyncOptions(props),
      {
        initialProps: { loadOptions: loader, input: "a", debounceMs: 0 },
      },
    );
    await waitFor(() => expect(signals).toHaveLength(1));
    rerender({ loadOptions: loader, input: "ab", debounceMs: 0 });
    await waitFor(() => expect(result.current.options[0]?.value).toBe("ab"));
    // "a" se pidió y se canceló al escribir "ab".
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);

    rerender({ loadOptions: loader, input: "abc", debounceMs: 0 });
    await waitFor(() => expect(result.current.options[0]?.value).toBe("abc"));
    const calls = loader.mock.calls.length;
    rerender({ loadOptions: loader, input: "ab", debounceMs: 0 });
    await waitFor(() => expect(result.current.options[0]?.value).toBe("ab"));
    expect(loader).toHaveBeenCalledTimes(calls);
  });

  it("invalidates the cache when deps change and shares it by cacheKey", async () => {
    clearOptionsCache("pruebas");
    const loader = vi.fn(async ({ input }: CnLoadOptionsContext) => [
      { value: input, label: input },
    ]);
    const first = renderHook(() =>
      useAsyncOptions({ loadOptions: loader, cacheKey: "pruebas", deps: ["x"] }),
    );
    await waitFor(() => expect(first.result.current.options).toHaveLength(1));
    const second = renderHook(() =>
      useAsyncOptions({ loadOptions: loader, cacheKey: "pruebas", deps: ["x"] }),
    );
    await waitFor(() => expect(second.result.current.options).toHaveLength(1));
    expect(loader).toHaveBeenCalledTimes(1);

    const third = renderHook(() =>
      useAsyncOptions({ loadOptions: loader, cacheKey: "pruebas", deps: ["y"] }),
    );
    await waitFor(() => expect(third.result.current.options).toHaveLength(1));
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("reports load-more errors and retries", async () => {
    let fail = true;
    const loader = vi.fn(async ({ page }: CnLoadOptionsContext) => {
      if (page === 1 && fail) {
        fail = false;
        throw new Error("Sin conexión");
      }
      return { options: rows(page * 5, 5), hasMore: page < 1 };
    });
    const { result } = renderHook(() => useAsyncOptions({ loadOptions: loader, pageSize: 5 }));
    await waitFor(() => expect(result.current.options).toHaveLength(5));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.loadMoreError).toBe("Sin conexión"));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.options).toHaveLength(10));
    expect(result.current.loadMoreError).toBeNull();
  });

  it("waits for minSearchLength", async () => {
    const loader = vi.fn(async () => rows(0, 1));
    const { result } = renderHook(() =>
      useAsyncOptions({ loadOptions: loader, input: "a", minSearchLength: 2 }),
    );
    expect(result.current.belowMinLength).toBe(true);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(loader).not.toHaveBeenCalled();
  });
});

describe("useResolvedOptions", () => {
  it("resolves unknown values once and caches them", async () => {
    const resolveOptions = vi.fn(async (values: Array<string | number>) =>
      values.map((value) => ({ value, label: `Etiqueta ${value}` })),
    );
    const { result, rerender } = renderHook(
      ({ values }: { values: Array<string | number> }) =>
        useResolvedOptions({ values, isKnown: (value) => value === 1, resolveOptions }),
      { initialProps: { values: [1, 2, 3] } },
    );
    await waitFor(() => expect(result.current.get(3)?.label).toBe("Etiqueta 3"));
    expect(resolveOptions).toHaveBeenCalledWith([2, 3], expect.anything());
    rerender({ values: [2, 3] });
    rerender({ values: [3, 2, 1] });
    expect(resolveOptions).toHaveBeenCalledTimes(1);
  });
});

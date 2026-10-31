import { describe, expect, it } from "vitest";
import { expandObject, flattenObject, getNestedValue, setNestedValue } from "./CnForm.helpers";

describe("CnForm.helpers", () => {
  it("getNestedValue returns value at simple path", () => {
    expect(getNestedValue({ a: 1 }, "a")).toBe(1);
  });

  it("getNestedValue returns undefined for missing path", () => {
    expect(getNestedValue({ a: 1 }, "b.c")).toBeUndefined();
  });

  it("getNestedValue navigates nested paths", () => {
    expect(getNestedValue({ a: { b: { c: 42 } } }, "a.b.c")).toBe(42);
  });

  it("setNestedValue sets simple key", () => {
    expect(setNestedValue({}, "a", 1)).toEqual({ a: 1 });
  });

  it("setNestedValue sets nested path", () => {
    expect(setNestedValue({}, "a.b.c", 5)).toEqual({ a: { b: { c: 5 } } });
  });

  it("setNestedValue does not mutate original", () => {
    const original = { a: { b: 1 } };
    const next = setNestedValue(original, "a.b", 2) as { a: { b: number } };
    expect(original.a.b).toBe(1);
    expect(next.a.b).toBe(2);
  });

  it("flattenObject flattens nested objects", () => {
    expect(flattenObject({ a: { b: 1, c: 2 } })).toEqual({ "a.b": 1, "a.c": 2 });
  });

  it("flattenObject flattens arrays", () => {
    expect(flattenObject({ a: [{ b: 1 }, { b: 2 }] })).toEqual({ "a.0.b": 1, "a.1.b": 2 });
  });

  it("flattenObject preserves null", () => {
    expect(flattenObject({ a: null })).toEqual({ a: null });
  });

  it("expandObject rebuilds nested objects", () => {
    expect(expandObject({ "a.b": 1, "a.c": 2 })).toEqual({ a: { b: 1, c: 2 } });
  });

  it("expandObject rebuilds arrays from numeric keys", () => {
    expect(expandObject({ "a.0": 1, "a.1": 2 })).toEqual({ a: [1, 2] });
  });

  it("expandObject skips undefined values", () => {
    expect(expandObject({ a: undefined, b: 1 })).toEqual({ b: 1 });
  });

  it("round-trips complex object", () => {
    const original = { user: { name: "Ana", roles: ["admin", "editor"] }, active: true };
    const flat = flattenObject(original);
    const back = expandObject(flat);
    expect(back).toEqual(original);
  });
});

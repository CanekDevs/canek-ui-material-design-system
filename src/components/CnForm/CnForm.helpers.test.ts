import { describe, expect, it } from "vitest";
import {
  buildFormData,
  expandObject,
  flattenObject,
  getNestedValue,
  getServerErrorMessage,
  hasFiles,
  isDeepEqual,
  omitPaths,
  parseServerErrors,
  setNestedValue,
} from "./CnForm.helpers";

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

  it("setNestedValue creates arrays for numeric segments", () => {
    expect(setNestedValue({}, "items.0.name", "a")).toEqual({ items: [{ name: "a" }] });
  });

  it("isDeepEqual compares nested structures and treats empty values alike", () => {
    expect(isDeepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(isDeepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(isDeepEqual({ a: "", b: undefined }, { a: null })).toBe(true);
  });

  it("hasFiles detects nested files", () => {
    const file = new File(["x"], "a.txt");
    expect(hasFiles({ docs: [{ file }] })).toBe(true);
    expect(hasFiles({ name: "x" })).toBe(false);
  });

  it("omitPaths removes nested keys without mutating", () => {
    const source = { a: 1, b: { c: 2, d: 3 } };
    expect(omitPaths(source, ["b.c", "a"])).toEqual({ b: { d: 3 } });
    expect(source.b.c).toBe(2);
  });

  it("buildFormData uses bracket notation", () => {
    const file = new File(["x"], "doc.pdf", { type: "application/pdf" });
    const data = buildFormData(
      {
        name: "Ana",
        active: true,
        empty: null,
        address: { city: "CDMX" },
        tags: ["a", "b"],
        files: [file, { id: 7, url: "https://x/y.png", name: "y.png" }],
        secret: "no",
      },
      { excludeFields: ["secret"] },
    );
    expect(data.get("name")).toBe("Ana");
    expect(data.get("active")).toBe("1");
    expect(data.get("empty")).toBe("");
    expect(data.get("address[city]")).toBe("CDMX");
    expect(data.get("tags[1]")).toBe("b");
    expect((data.get("files[0]") as File).name).toBe("doc.pdf");
    expect(data.get("files[1][id]")).toBe("7");
    expect(data.has("secret")).toBe(false);
  });

  it("parseServerErrors understands common API shapes", () => {
    expect(parseServerErrors({ email: ["Ya existe"] })).toEqual({ email: "Ya existe" });
    expect(
      parseServerErrors({ message: "Datos inválidos", errors: { "items.0.name": ["Requerido"] } }),
    ).toEqual({ "items.0.name": "Requerido" });
    expect(parseServerErrors({ response: { data: { data: { rfc: "Inválido" } } } })).toEqual({
      rfc: "Inválido",
    });
    expect(parseServerErrors([{ path: ["address", "zip"], message: "CP inválido" }])).toEqual({
      "address.zip": "CP inválido",
    });
    expect(parseServerErrors({ errors: { "contacts[1].phone": "Inválido" } })).toEqual({
      "contacts.1.phone": "Inválido",
    });
    expect(parseServerErrors({ errors: { name: ["Requerido"], status: "Inválido" } })).toEqual({
      name: "Requerido",
      status: "Inválido",
    });
    expect(parseServerErrors({ message: "x", status: 422 })).toEqual({});
    expect(parseServerErrors(null)).toEqual({});
  });

  it("getServerErrorMessage reads the general message", () => {
    expect(getServerErrorMessage({ message: "Sin permiso" })).toBe("Sin permiso");
    expect(getServerErrorMessage(new Error("Falló"))).toBe("Falló");
    expect(getServerErrorMessage(undefined)).toBeUndefined();
  });
});

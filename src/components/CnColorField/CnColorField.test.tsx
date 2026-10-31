import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnColorField, normalizeHex } from "./CnColorField";

describe("CnColorField", () => {
  it("normalizes hex colors", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("254D87")).toBe("#254d87");
    expect(normalizeHex("rojo")).toBeNull();
  });

  it("picks a preset color", async () => {
    const onChange = vi.fn();
    render(<CnColorField label="Color" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Elegir color: Color" }));
    const dialog = await screen.findByRole("dialog", { name: "Selector de color" });
    fireEvent.click(within(dialog).getByRole("option", { name: "#2e9e4f" }));
    expect(onChange).toHaveBeenLastCalledWith("#2e9e4f");
  });

  it("accepts typed values and adds the hash", () => {
    const onChange = vi.fn();
    render(<CnColorField label="Color" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "ff0000" } });
    expect(onChange).toHaveBeenLastCalledWith("#ff0000");
  });

  it("validates invalid colors", async () => {
    render(<CnColorField label="Color" defaultValue="#12" />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(await screen.findByText(/Color no válido/)).toBeInTheDocument();
  });
});

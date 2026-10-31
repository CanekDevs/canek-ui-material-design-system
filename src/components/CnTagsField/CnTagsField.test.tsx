import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnTagsField } from "./CnTagsField";

const input = () => screen.getByRole("textbox");

describe("CnTagsField", () => {
  it("adds tags with Enter and comma", () => {
    const onChange = vi.fn();
    render(<CnTagsField label="Etiquetas" onChange={onChange} />);
    fireEvent.change(input(), { target: { value: "rojo" } });
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith(["rojo"]);
  });

  it("validates each tag with rules", () => {
    const onChange = vi.fn();
    render(<CnTagsField label="Correos" tagRules={[{ type: "email" }]} onChange={onChange} />);
    fireEvent.change(input(), { target: { value: "no-es-correo" } });
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/Email inválido/)).toBeInTheDocument();
  });

  it("splits pasted lists and skips duplicates", () => {
    const onChange = vi.fn();
    render(<CnTagsField label="Folios" defaultValue={["A1"]} onChange={onChange} />);
    fireEvent.paste(input(), { clipboardData: { getData: () => "B2, C3;a1\nD4" } });
    expect(onChange).toHaveBeenLastCalledWith(["A1", "B2", "C3", "D4"]);
  });

  it("removes the last tag with Backspace and via chip", () => {
    const onChange = vi.fn();
    render(<CnTagsField label="Tags" value={["uno", "dos"]} onChange={onChange} />);
    fireEvent.keyDown(input(), { key: "Backspace" });
    expect(onChange).toHaveBeenLastCalledWith(["uno"]);
  });

  it("respects maxTags", () => {
    const onChange = vi.fn();
    render(<CnTagsField label="Tags" maxTags={1} defaultValue={["uno"]} onChange={onChange} />);
    expect(input()).toBeDisabled();
    expect(screen.getByText("1/1")).toBeInTheDocument();
  });

  it("lowercases tags when requested", () => {
    const onChange = vi.fn();
    render(<CnTagsField label="Tags" transform="lowercase" onChange={onChange} />);
    fireEvent.change(input(), { target: { value: "HOLA" } });
    fireEvent.blur(input());
    expect(onChange).toHaveBeenLastCalledWith(["hola"]);
  });
});

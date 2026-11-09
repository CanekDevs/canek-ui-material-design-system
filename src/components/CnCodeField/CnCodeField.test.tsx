import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { validateFieldValue } from "../CnForm/CnForm.validation";
import { buildCodeRules, CnCodeField, formatJson, getJsonError } from "./CnCodeField";
import { CnCodeFieldSkeleton } from "./CnCodeFieldSkeleton";

const Controlled = ({ initial = "" }: { initial?: string }) => {
  const [value, setValue] = useState(initial);
  return <CnCodeField label="Código" value={value} onChange={setValue} tabSize={2} />;
};

describe("CnCodeField", () => {
  it("validates and formats JSON", () => {
    expect(getJsonError('{"a":1}')).toBeNull();
    expect(getJsonError("")).toBeNull();
    expect(getJsonError("{a}")).toMatch(/JSON no válido/);
    expect(getJsonError("[1,")).toMatch(/incompleto/);
    expect(formatJson('{"a":1}')).toBe('{\n  "a": 1\n}');
    const rules = buildCodeRules({ language: "json", required: true });
    expect(validateFieldValue("", rules)).toBe("Campo requerido");
    expect(validateFieldValue("{", rules)).toMatch(/JSON no válido/);
    expect(validateFieldValue("[1]", rules)).toBe("");
    expect(validateFieldValue("{", buildCodeRules({ language: "text" }))).toBe("");
  });

  it("formats with the toolbar button", () => {
    const onChange = vi.fn();
    render(
      <CnCodeField label="JSON" language="json" defaultValue='{"a":[1]}' onChange={onChange} />,
    );
    expect(screen.getByText("JSON válido")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Formatear/ }));
    expect(onChange).toHaveBeenLastCalledWith('{\n  "a": [\n    1\n  ]\n}');
  });

  it("indents with Tab and outdents with Shift+Tab", () => {
    render(<Controlled initial="abc" />);
    const textarea = screen.getByLabelText("Código") as HTMLTextAreaElement;
    textarea.setSelectionRange(0, 0);
    fireEvent.keyDown(textarea, { key: "Tab" });
    expect(textarea.value).toBe("  abc");
    textarea.setSelectionRange(3, 3);
    fireEvent.keyDown(textarea, { key: "Tab", shiftKey: true });
    expect(textarea.value).toBe("abc");
  });

  it("releases Tab after Escape", () => {
    render(<Controlled initial="x" />);
    const textarea = screen.getByLabelText("Código") as HTMLTextAreaElement;
    fireEvent.keyDown(textarea, { key: "Escape" });
    fireEvent.keyDown(textarea, { key: "Tab" });
    expect(textarea.value).toBe("x");
  });

  it("numbers lines and shows JSON errors after blur", () => {
    const { container } = render(
      <CnCodeField label="JSON" language="json" defaultValue={'{\n  "a": \n}'} minRows={2} />,
    );
    expect(container.querySelector("[data-cn-code-gutter]")?.textContent).toBe("1\n2\n3");
    const textarea = screen.getByLabelText("JSON");
    fireEvent.blur(textarea);
    expect(document.getElementById(`${textarea.id}-helper`)).toHaveTextContent(
      "JSON no válido: carácter inesperado «}»",
    );
    expect(textarea).toHaveAttribute("aria-invalid", "true");
  });

  it("renders its skeleton", () => {
    const { container, rerender } = render(<CnCodeFieldSkeleton rows={4} />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "code-field");
    expect(container.querySelectorAll("[data-cn-skeleton-line]")).toHaveLength(4);
    rerender(<CnCodeField label="JSON" language="json" lineNumbers={false} skeleton />);
    expect(container.querySelector("[data-cn-skeleton-gutter]")).toBeNull();
    expect(container.querySelector("[data-cn-skeleton-format]")).not.toBeNull();
  });
});

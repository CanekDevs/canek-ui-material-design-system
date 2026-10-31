import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnTextField } from "./CnTextField";

describe("CnTextField", () => {
  it("renders with label", () => {
    render(<CnTextField label="Nombre" />);
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
  });

  it("renders placeholder", () => {
    render(<CnTextField placeholder="Escribe aquí" />);
    expect(screen.getByPlaceholderText("Escribe aquí")).toBeInTheDocument();
  });

  it("emits onChange when typing", () => {
    const onChange = vi.fn();
    render(<CnTextField onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "hola" } });
    expect(onChange).toHaveBeenCalledWith("hola");
  });

  it("emits controlled value", () => {
    render(<CnTextField value="fijo" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("fijo");
  });

  it("applies transform uppercase on blur", () => {
    const onChange = vi.fn();
    render(<CnTextField transform="uppercase" onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "hola" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith("HOLA");
  });

  it("applies transform capitalize on blur", () => {
    const onChange = vi.fn();
    render(<CnTextField transform="capitalize" onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "juan perez" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith("Juan Perez");
  });

  it("filters non-numeric when rules numeric", () => {
    const onChange = vi.fn();
    render(<CnTextField rules={[{ type: "numeric" }]} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "12abc3" } });
    expect(onChange).toHaveBeenCalledWith("123");
  });

  it("limits maxLength", () => {
    const onChange = vi.fn();
    render(<CnTextField maxLength={5} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "abcdefgh" } });
    expect(onChange).toHaveBeenCalledWith("abcde");
  });

  it("shows external error", () => {
    render(<CnTextField error helperText="Error externo" />);
    expect(screen.getByText("Error externo")).toBeInTheDocument();
  });

  it("shows validation error after blur", () => {
    render(<CnTextField rules={[{ type: "required" }]} />);
    const input = screen.getByRole("textbox");
    fireEvent.blur(input);
    expect(screen.getByText("Campo requerido")).toBeInTheDocument();
  });

  it("validates email after blur", () => {
    render(<CnTextField type="email" rules={[{ type: "email" }]} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "no-email" } });
    fireEvent.blur(input);
    expect(screen.getByText("Email inválido")).toBeInTheDocument();
  });

  it("respects disabled", () => {
    render(<CnTextField label="Nombre" disabled />);
    expect(screen.getByLabelText("Nombre")).toBeDisabled();
  });

  it("respects readOnly", () => {
    render(<CnTextField label="Nombre" readOnly value="x" onChange={() => {}} />);
    expect(screen.getByLabelText("Nombre")).toHaveAttribute("readonly");
  });

  it("renders password toggle when type password", () => {
    render(<CnTextField type="password" passwordToggle label="Pass" />);
    expect(screen.getByRole("button", { name: "Mostrar contraseña" })).toBeInTheDocument();
  });

  it("toggles password visibility", () => {
    render(<CnTextField type="password" passwordToggle label="Pass" />);
    const input = screen.getByLabelText("Pass");
    expect(input).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(input).toHaveAttribute("type", "text");
  });

  it("renders clear button when clearable and has value", () => {
    render(<CnTextField clearable value="abc" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Limpiar" })).toBeInTheDocument();
  });

  it("calls onClear when clear button clicked", () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(<CnTextField clearable value="abc" onChange={onChange} onClear={onClear} />);
    fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));
    expect(onChange).toHaveBeenCalledWith("");
    expect(onClear).toHaveBeenCalled();
  });

  it("shows character counter when showCounter", () => {
    render(<CnTextField showCounter maxLength={10} value="abc" onChange={() => {}} />);
    expect(screen.getByText("3/10")).toBeInTheDocument();
  });

  it("shows loading spinner when loading", () => {
    render(<CnTextField loading />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders startIcon", () => {
    const { container } = render(<CnTextField startIcon="search" />);
    expect(container.querySelector(".MuiInputAdornment-root")).toBeInTheDocument();
  });

  it("renders textarea when type textarea", () => {
    const { container } = render(<CnTextField type="textarea" />);
    expect(container.querySelector("textarea")).toBeInTheDocument();
  });

  it("marks aria-invalid when error", () => {
    render(<CnTextField error helperText="Error" label="X" />);
    expect(screen.getByLabelText("X")).toHaveAttribute("aria-invalid", "true");
  });

  it("does not fire onBlur twice", () => {
    const onBlur = vi.fn();
    render(<CnTextField onBlur={onBlur} />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("exposes data attributes for tests", () => {
    const { container } = render(<CnTextField type="email" size="lg" variant="filled" />);
    const root = container.querySelector("[data-cn-text-field]");
    expect(root).toHaveAttribute("data-cn-text-field-type", "email");
    expect(root).toHaveAttribute("data-cn-text-field-size", "lg");
    expect(root).toHaveAttribute("data-cn-text-field-variant", "filled");
  });
});

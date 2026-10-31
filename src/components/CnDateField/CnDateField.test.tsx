import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { applyDateMask, formatIsoForInput, parseMaskedInput } from "../../utils/date-utils";
import { validateFieldValue } from "../CnForm/CnForm.validation";
import { buildDateRangeRules, CnDateField, toLocalIsoValue } from "./CnDateField";
import { buildDateRangeValueRules, CnDateRangeField } from "./CnDateRangeField";

const input = () => screen.getByRole("textbox") as HTMLInputElement;
const openPicker = (name = /Elegir fecha/) => fireEvent.click(screen.getByRole("button", { name }));

describe("date masks", () => {
  it("masks digits with the display pattern", () => {
    expect(applyDateMask("15032024", "DD/MM/YYYY")).toBe("15/03/2024");
    expect(applyDateMask("1503", "DD/MM/YYYY")).toBe("15/03");
    expect(applyDateMask("0930", "HH:mm")).toBe("09:30");
  });

  it("parses complete masked values to ISO and rejects invalid ones", () => {
    expect(parseMaskedInput("15/03/2024", "date")).toBe("2024-03-15");
    expect(parseMaskedInput("31/02/2024", "date")).toBeNull();
    expect(parseMaskedInput("03/15/2024", "date", "MM/DD/YYYY")).toBe("2024-03-15");
    expect(parseMaskedInput("15/03/2024 14:05", "datetime")).toBe("2024-03-15T14:05");
    expect(parseMaskedInput("03/2024", "month")).toBe("2024-03");
    expect(parseMaskedInput("02:30 p. m.", "time", "DD/MM/YYYY", true)).toBe("14:30");
    expect(parseMaskedInput("25:00", "time")).toBeNull();
  });

  it("formats ISO for display", () => {
    expect(formatIsoForInput("2024-03-15", "date")).toBe("15/03/2024");
    expect(formatIsoForInput("2024-03-15T08:00", "datetime", "DD/MM/YYYY", true)).toBe(
      "15/03/2024 08:00 a. m.",
    );
  });
});

describe("CnDateField", () => {
  it("formats local ISO values per type", () => {
    const date = new Date(2024, 4, 9, 7, 5);
    expect(toLocalIsoValue(date, "date")).toBe("2024-05-09");
    expect(toLocalIsoValue(date, "time")).toBe("07:05");
    expect(toLocalIsoValue(date, "datetime")).toBe("2024-05-09T07:05");
    expect(toLocalIsoValue(date, "month")).toBe("2024-05");
  });

  it("builds format and range rules", () => {
    const rules = buildDateRangeRules({ min: "2024-01-01", max: "2024-12-31" });
    expect(validateFieldValue("15/03", rules)).toContain("Fecha no válida");
    expect(validateFieldValue("2023-12-31", rules)).toContain("posterior a 01/01/2024");
    expect(validateFieldValue("2025-01-01", rules)).toContain("anterior a 31/12/2024");
    expect(validateFieldValue("2024-06-01", rules)).toBe("");
  });

  it("emits ISO when typing a complete date", () => {
    const onChange = vi.fn();
    render(<CnDateField label="Fecha" onChange={onChange} />);
    fireEvent.change(input(), { target: { value: "15032024" } });
    expect(input()).toHaveValue("15/03/2024");
    expect(onChange).toHaveBeenLastCalledWith("2024-03-15");
  });

  it("emits the raw text and shows an error for incomplete dates", async () => {
    const onChange = vi.fn();
    render(<CnDateField label="Fecha" onChange={onChange} />);
    fireEvent.change(input(), { target: { value: "1503" } });
    expect(onChange).toHaveBeenLastCalledWith("15/03");
    fireEvent.blur(input());
    expect(await screen.findByText(/Fecha no válida/)).toBeInTheDocument();
  });

  it("displays a controlled ISO value formatted", () => {
    render(<CnDateField label="Fecha" value="2024-12-01" onChange={() => {}} />);
    expect(input()).toHaveValue("01/12/2024");
  });

  it("picks a day from the calendar and closes", async () => {
    const onChange = vi.fn();
    render(<CnDateField label="Fecha" value="2024-03-10" onChange={onChange} />);
    openPicker();
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("grid", { name: /marzo de 2024/i })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: /20 de marzo de 2024/i }));
    expect(onChange).toHaveBeenLastCalledWith("2024-03-20");
  });

  it("disables days outside min/max and weekends", async () => {
    render(
      <CnDateField
        label="Fecha"
        value="2024-03-13"
        min="2024-03-05"
        disableWeekends
        onChange={() => {}}
      />,
    );
    openPicker();
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: /, 4 de marzo de 2024/i })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: /sábado, 16 de marzo/i })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: /14 de marzo de 2024/i })).not.toBeDisabled();
  });

  it("navigates the calendar with the keyboard", async () => {
    const onChange = vi.fn();
    render(<CnDateField label="Fecha" value="2024-03-31" onChange={onChange} />);
    openPicker();
    const dialog = await screen.findByRole("dialog");
    const grid = within(dialog).getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    expect(await within(dialog).findByRole("grid", { name: /abril de 2024/i })).toBeInTheDocument();
    fireEvent.keyDown(within(dialog).getByRole("grid"), { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith("2024-04-01");
  });

  it("switches to month and year views", async () => {
    const onChange = vi.fn();
    render(<CnDateField label="Fecha" value="2024-03-10" onChange={onChange} />);
    openPicker();
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /Cambiar vista/ }));
    fireEvent.click(within(dialog).getByRole("option", { name: "2020" }));
    fireEvent.click(within(dialog).getByRole("option", { name: "Jul" }));
    expect(within(dialog).getByRole("grid", { name: /julio de 2020/i })).toBeInTheDocument();
  });

  it("picks date and time in datetime mode", async () => {
    const onChange = vi.fn();
    render(
      <CnDateField
        label="Cita"
        type="datetime"
        value="2024-03-10T09:00"
        minutesStep={15}
        onChange={onChange}
      />,
    );
    expect(input()).toHaveValue("10/03/2024 09:00");
    openPicker();
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(within(dialog).getByRole("listbox", { name: "Hora" })).getByRole("option", {
        name: "14",
      }),
    );
    expect(onChange).toHaveBeenLastCalledWith("2024-03-10T14:00");
    fireEvent.click(
      within(within(dialog).getByRole("listbox", { name: "Minutos" })).getByRole("option", {
        name: "45",
      }),
    );
    expect(onChange).toHaveBeenLastCalledWith("2024-03-10T09:45");
  });

  it("picks a time", async () => {
    const onChange = vi.fn();
    render(<CnDateField label="Hora" type="time" onChange={onChange} />);
    openPicker(/Elegir hora/);
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(within(dialog).getByRole("listbox", { name: "Hora" })).getByRole("option", {
        name: "08",
      }),
    );
    expect(onChange).toHaveBeenLastCalledWith("08:00");
  });

  it("picks a month", async () => {
    const onChange = vi.fn();
    render(<CnDateField label="Mes" type="month" value="2024-03" onChange={onChange} />);
    openPicker(/Elegir mes/);
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("option", { name: "Oct" }));
    expect(onChange).toHaveBeenLastCalledWith("2024-10");
  });

  it("clears the value", () => {
    const onChange = vi.fn();
    render(<CnDateField label="Fecha" clearable value="2024-01-01" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Limpiar fecha" }));
    expect(onChange).toHaveBeenCalledWith("");
  });
});

describe("CnDateRangeField", () => {
  it("validates order, completeness and max days", () => {
    const rules = buildDateRangeValueRules({ required: true, maxDays: 7 });
    expect(validateFieldValue(["2024-03-01", ""], rules)).toContain("inicial y la final");
    expect(validateFieldValue(["2024-03-10", "2024-03-01"], rules)).toContain("posterior");
    expect(validateFieldValue(["2024-03-01", "2024-03-20"], rules)).toContain("7 días");
    expect(validateFieldValue(["2024-03-01", "2024-03-05"], rules)).toBe("");
  });

  it("selects a range in two clicks", async () => {
    const onChange = vi.fn();
    const Wrapper = () => {
      return (
        <CnDateRangeField
          label="Periodo"
          defaultValue={["2024-03-01", ""]}
          onChange={onChange}
          presets={false}
        />
      );
    };
    render(<Wrapper />);
    fireEvent.click(screen.getByRole("button", { name: "Elegir rango de fechas" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getAllByRole("button", { name: /10 de marzo de 2024/i })[0]);
    expect(onChange).toHaveBeenLastCalledWith(["2024-03-01", "2024-03-10"]);
  });

  it("applies presets", async () => {
    const onChange = vi.fn();
    render(<CnDateRangeField label="Periodo" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Elegir rango de fechas" }));
    fireEvent.click(await screen.findByRole("button", { name: "Últimos 7 días" }));
    const [start, end] = onChange.mock.calls[0][0] as [string, string];
    expect(start < end).toBe(true);
  });

  it("types both ends", () => {
    const onChange = vi.fn();
    render(<CnDateRangeField label="Periodo" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox", { name: /Desde/ }), {
      target: { value: "01032024" },
    });
    expect(onChange).toHaveBeenLastCalledWith(["2024-03-01", ""]);
  });
});

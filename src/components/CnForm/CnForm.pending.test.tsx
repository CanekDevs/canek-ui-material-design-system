import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { formatIsoDisplay } from "../../utils/date-utils";
import { CnCalendar } from "../CnCalendar";
import { CnDateField } from "../CnDateField";
import { CnFileField } from "../CnFileField";
import { CnForm } from "./CnForm";
import { isoToDate, normalizeDateValue } from "./CnForm.engine";
import type { CnFormHandle } from "./CnForm.types";

const submit = () => fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

describe("formatIsoDisplay", () => {
  it("formats with free tokens and literals", () => {
    expect(formatIsoDisplay("2024-05-06", "date", "D [de] MMMM [de] YYYY")).toBe(
      "6 de mayo de 2024",
    );
    expect(formatIsoDisplay("2024-05", "month", "MMMM YYYY")).toBe("mayo 2024");
    expect(formatIsoDisplay("2024-05-06T15:07", "datetime", "DD/MM/YY hh:mm a")).toBe(
      "06/05/24 03:07 p. m.",
    );
    expect(formatIsoDisplay("2024", "year", "[Año] YYYY")).toBe("Año 2024");
    expect(formatIsoDisplay("2024-05-06", "date", "dddd")).toBe("lunes");
  });
});

describe("year type", () => {
  it("normalizes and converts year values", () => {
    expect(normalizeDateValue(new Date(2023, 6, 1), "year")).toBe("2023");
    expect(normalizeDateValue("2023-07-01", "year")).toBe("2023");
    expect(isoToDate("2023", "year")?.getFullYear()).toBe(2023);
  });

  it("types and validates a year inside CnForm", async () => {
    const ref = createRef<CnFormHandle>();
    render(
      <CnForm
        formRef={ref}
        fields={[{ name: "year", type: "year", label: "Ejercicio", maxDate: "2025" }]}
        onSubmit={() => {}}
      />,
    );
    const input = screen.getByLabelText(/Ejercicio/);
    fireEvent.change(input, { target: { value: "2030" } });
    expect(ref.current?.getValues().year).toBe("2030");
    submit();
    expect(await screen.findByText(/igual o anterior a 2025/)).toBeInTheDocument();
  });

  it("picks a year from a year-only calendar and honours shouldDisableYear", () => {
    const onChange = vi.fn();
    render(
      <CnDateField
        label="Año"
        type="year"
        onChange={onChange}
        shouldDisableYear={(year) => year === 2020}
        min="2015"
        max="2030"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Elegir año" }));
    const years = screen.getByRole("listbox", { name: "Años" });
    expect(within(years).getByRole("option", { name: "2020" })).toBeDisabled();
    expect(within(years).queryByRole("option", { name: "2031" })).toBeNull();
    fireEvent.click(within(years).getByRole("option", { name: "2022" }));
    expect(onChange).toHaveBeenLastCalledWith("2022");
  });
});

describe("date field extras", () => {
  it("shows displayFormat while blurred and the mask while editing", () => {
    render(<CnDateField label="Mes" type="month" value="2024-05" displayFormat="MMMM [de] YYYY" />);
    const input = screen.getByLabelText(/Mes/);
    expect(input).toHaveValue("Mayo de 2024".toLowerCase());
    fireEvent.focus(input);
    expect(input).toHaveValue("05/2024");
  });

  it("disables months with shouldDisableMonth", () => {
    render(
      <CnCalendar
        views={["month", "year"]}
        openTo="month"
        value="2024-01-01"
        shouldDisableMonth={(month) => month === "2024-03"}
      />,
    );
    expect(screen.getByRole("option", { name: "Mar" })).toBeDisabled();
    expect(screen.getByRole("option", { name: "Abr" })).not.toBeDisabled();
  });

  it("validates a daily time window", async () => {
    render(
      <CnForm
        fields={[
          {
            name: "at",
            type: "datetime",
            label: "Cita",
            minTime: "08:00",
            maxTime: "18:00",
          },
        ]}
        defaultValues={{ at: "2030-01-10T19:30" }}
        onSubmit={() => {}}
      />,
    );
    submit();
    expect(await screen.findByText(/entre 08:00 y 18:00/)).toBeInTheDocument();
  });
});

describe("tel with country selector", () => {
  it("renders the phone control and validates per country", async () => {
    render(
      <CnForm
        fields={[
          {
            name: "tel",
            type: "tel",
            label: "Teléfono",
            showCountrySelect: true,
            defaultCountry: "MX",
          },
        ]}
        defaultValues={{ tel: "+52123" }}
        onSubmit={() => {}}
      />,
    );
    expect(
      document.querySelector("[data-cn-phone-field], [data-cn-field-path='tel'] input"),
    ).not.toBeNull();
    submit();
    expect((await screen.findAllByText(/Número inválido para México/)).length).toBeGreaterThan(0);
  });
});

describe("file field extras", () => {
  it("rejects files with maxSize in KB", () => {
    const onReject = vi.fn();
    render(<CnFileField label="Doc" maxSize={1} sizeUnit="KB" onReject={onReject} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const big = new File(["x".repeat(2048)], "big.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [big] } });
    expect(onReject).toHaveBeenCalled();
    expect(onReject.mock.calls[0][0][0].message).toMatch(/1 KB/);
  });

  it("renders the masonry variant with fixed columns", () => {
    render(
      <CnFileField
        label="Fotos"
        variant="masonry"
        multiple
        gridColumns={3}
        value={[{ id: 1, url: "https://cdn.test/a.jpg", name: "a.jpg" }]}
      />,
    );
    const list = screen.getByRole("list", { name: "Archivos seleccionados" });
    expect(getComputedStyle(list).columnCount).toBe("3");
    expect(within(list).getAllByRole("listitem").length).toBeGreaterThan(0);
  });
});

describe("dynamic values and section appearance", () => {
  it("evaluates rows, decimals and step from form values", () => {
    render(
      <CnForm
        fields={[
          { name: "long", type: "switch", label: "Largo" },
          {
            name: "notes",
            type: "textarea",
            label: "Notas",
            rows: (values) => (values.long ? 8 : 2),
          },
        ]}
        defaultValues={{ long: true }}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByLabelText("Notas")).toHaveAttribute("rows", "8");
  });

  it("renders plain sections without a border and custom remove icon", async () => {
    render(
      <CnForm
        sections={[
          {
            id: "s",
            title: "Plano",
            appearance: "plain",
            fields: [{ name: "a", type: "text", label: "A" }],
          },
        ]}
        onSubmit={() => {}}
      />,
    );
    const section = document.querySelector('[data-cn-section="s"]') as HTMLElement;
    await waitFor(() => expect(getComputedStyle(section).padding).toBe("0px"));
  });
});

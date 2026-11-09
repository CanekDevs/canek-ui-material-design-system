import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { CnFormSkeleton } from "../CnFormSkeleton";
import { CnForm } from "./CnForm";
import type { CnFormField, CnFormHandle } from "./CnForm.types";

const FIELDS: CnFormField[] = [
  {
    name: "address",
    type: "address",
    label: "Domicilio",
    required: true,
    addressFields: [
      "street",
      "exteriorNumber",
      "postalCode",
      "neighborhood",
      "municipality",
      "state",
    ],
  },
  {
    name: "steps",
    type: "repeater",
    label: "Pasos",
    itemLabel: "Paso",
    minItems: 1,
    required: true,
  },
  { name: "duration", type: "duration", label: "Duración", required: true, max: 120 },
  { name: "query", type: "search", label: "Producto", suggestions: ["Laptop", "Monitor"] },
  { name: "config", type: "code", label: "Configuración", language: "json", minRows: 3 },
  { name: "schedule", type: "schedule", label: "Horario", required: true, scheduleDays: ["mon"] },
  { name: "location", type: "location", label: "Ubicación", required: true, showMap: false },
  { name: "days", type: "weekdays", label: "Días", required: true },
  { name: "shift", type: "timerange", label: "Turno", required: true },
];

describe("CnForm composite field types", () => {
  it("renders every new type with its default value", () => {
    const ref = createRef<CnFormHandle>();
    const { container } = render(<CnForm formRef={ref} fields={FIELDS} onSubmit={() => {}} />);
    expect(container.querySelector("[data-cn-address-field]")).not.toBeNull();
    expect(container.querySelector("[data-cn-repeater-field]")).not.toBeNull();
    expect(container.querySelector("[data-cn-duration-field]")).not.toBeNull();
    expect(container.querySelector("[data-cn-search-field]")).not.toBeNull();
    expect(container.querySelector("[data-cn-code-field]")).not.toBeNull();
    expect(container.querySelector("[data-cn-schedule-field]")).not.toBeNull();
    expect(container.querySelector("[data-cn-location-field]")).not.toBeNull();
    expect(container.querySelector("[data-cn-weekdays-field]")).not.toBeNull();
    expect(container.querySelector("[data-cn-time-range-field]")).not.toBeNull();
    expect(ref.current?.getValues()).toMatchObject({
      address: {},
      steps: [""],
      duration: null,
      query: "",
      config: "",
      schedule: {},
      location: null,
      days: [],
      shift: ["", ""],
    });
  });

  it("validates the implicit rules of each type", async () => {
    const ref = createRef<CnFormHandle>();
    render(
      <CnForm
        formRef={ref}
        fields={FIELDS}
        defaultValues={{
          address: { street: "Reforma", postalCode: "123" },
          duration: 200,
          config: "{",
          schedule: { mon: { enabled: true, ranges: [{ start: "10:00", end: "09:00" }] } },
          location: { lat: 95, lng: 10 },
          shift: ["18:00", "09:00"],
        }}
        onSubmit={() => {}}
      />,
    );
    let valid = true;
    await act(async () => {
      valid = (await ref.current?.validate()) ?? true;
    });
    expect(valid).toBe(false);
    const errors = ref.current?.getErrors() ?? {};
    expect(errors.address).toMatch(/^Completa: Núm. exterior/);
    expect(errors.steps).toBe("Agrega al menos un elemento");
    expect(errors.duration).toMatch(/máxima es 2 h/);
    expect(errors.config).toMatch(/JSON no válido/);
    expect(errors.schedule).toMatch(/^Lunes: La hora de fin/);
    expect(errors.location).toMatch(/fuera de rango/);
    expect(errors.days).toBe("Campo requerido");
    expect(errors.shift).toMatch(/posterior/);
    expect(errors.query).toBeUndefined();
  });

  it("submits the values edited through the fields", async () => {
    const onSubmit = vi.fn();
    render(
      <CnForm
        fields={[
          { name: "days", type: "weekdays", label: "Días", required: true },
          { name: "shift", type: "timerange", label: "Turno", required: true },
          { name: "steps", type: "repeater", label: "Pasos", itemLabel: "Paso", minItems: 1 },
          { name: "duration", type: "duration", label: "Duración", durationPresets: false },
        ]}
        onSubmit={onSubmit}
        submitLabel="Guardar"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Laborables" }));
    fireEvent.change(screen.getByLabelText(/^Inicio/), { target: { value: "08:00" } });
    fireEvent.change(screen.getByLabelText(/^Fin/), { target: { value: "16:00" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Paso 1" }), {
      target: { value: "Revisar" },
    });
    fireEvent.change(screen.getByLabelText("Horas"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      days: [1, 2, 3, 4, 5],
      shift: ["08:00", "16:00"],
      steps: ["Revisar"],
      duration: 60,
    });
  });

  it("draws a placeholder for each new type in the skeleton", () => {
    const { container } = render(<CnFormSkeleton fields={FIELDS} columns={2} />);
    const types = [...container.querySelectorAll("[data-sk-field]")].map((node) =>
      node.getAttribute("data-sk-field"),
    );
    expect(types).toEqual(FIELDS.map((field) => field.type));
    render(<CnForm fields={FIELDS} onSubmit={() => {}} skeleton />);
    expect(screen.getAllByRole("status", { name: "Cargando formulario" })).toHaveLength(2);
  });
});

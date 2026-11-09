import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { validateFieldValue } from "../CnForm/CnForm.validation";
import {
  buildLocationRules,
  CnLocationField,
  getGoogleMapsEmbedUrl,
  isValidCoordinates,
} from "./CnLocationField";
import { CnLocationFieldSkeleton } from "./CnLocationFieldSkeleton";

const setGeolocation = (geolocation: unknown) =>
  Object.defineProperty(navigator, "geolocation", { value: geolocation, configurable: true });

afterEach(() => setGeolocation(undefined));

describe("CnLocationField", () => {
  it("emits coordinates and shows the map preview", () => {
    const onChange = vi.fn();
    const { container } = render(<CnLocationField label="Ubicación" onChange={onChange} />);
    expect(container.querySelector("iframe")).toBeNull();
    fireEvent.change(screen.getByLabelText("Latitud"), { target: { value: "19.43" } });
    fireEvent.change(screen.getByLabelText("Longitud"), { target: { value: "-99.13" } });
    expect(onChange).toHaveBeenLastCalledWith({ lat: 19.43, lng: -99.13 });
  });

  it("renders the embedded Google map for a value", () => {
    render(<CnLocationField value={{ lat: 19.4, lng: -99.1 }} zoom={12} />);
    const frame = screen.getByTitle("Mapa de la ubicación 19.4, -99.1");
    expect(frame).toHaveAttribute("src", getGoogleMapsEmbedUrl(19.4, -99.1, 12));
    expect(frame.getAttribute("src")).toBe(
      "https://maps.google.com/maps?q=19.4,-99.1&z=12&output=embed",
    );
    expect(screen.getByRole("link", { name: /Abrir en Google Maps/ })).toHaveAttribute(
      "target",
      "_blank",
    );
  });

  it("uses the current position", () => {
    const onChange = vi.fn();
    setGeolocation({
      getCurrentPosition: (ok: PositionCallback) =>
        ok({ coords: { latitude: 20.1234567, longitude: -103.7654321, accuracy: 12 } } as never),
    });
    render(<CnLocationField onChange={onChange} />);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /Usar mi ubicación/ }));
    });
    expect(onChange).toHaveBeenLastCalledWith({ lat: 20.123457, lng: -103.765432 });
    expect(screen.getByText(/precisión aproximada de 12 m/)).toBeInTheDocument();
  });

  it("handles denied permission and missing geolocation gracefully", () => {
    setGeolocation({
      getCurrentPosition: (_ok: PositionCallback, fail: PositionErrorCallback) =>
        fail({ code: 1, message: "denied" } as GeolocationPositionError),
    });
    const { unmount } = render(<CnLocationField />);
    fireEvent.click(screen.getByRole("button", { name: /Usar mi ubicación/ }));
    expect(screen.getByText(/Permiso de ubicación denegado/)).toBeInTheDocument();
    unmount();
    setGeolocation(undefined);
    render(<CnLocationField />);
    fireEvent.click(screen.getByRole("button", { name: /Usar mi ubicación/ }));
    expect(screen.getByText(/no permite obtener la ubicación/)).toBeInTheDocument();
  });

  it("validates coordinates", () => {
    expect(isValidCoordinates({ lat: 10, lng: 10 })).toBe(true);
    expect(isValidCoordinates({ lat: 100, lng: 10 })).toBe(false);
    const rules = buildLocationRules({ required: true });
    expect(validateFieldValue({ lat: null, lng: null }, rules)).toBe("Indica la ubicación");
    expect(validateFieldValue({ lat: 10, lng: null }, buildLocationRules())).toBe(
      "Indica la latitud y la longitud",
    );
    expect(validateFieldValue({ lat: 95, lng: 10 }, rules)).toMatch(/fuera de rango/);
    expect(validateFieldValue({ lat: 19, lng: -99 }, rules)).toBe("");
  });

  it("renders its skeleton", () => {
    const { container, rerender } = render(<CnLocationFieldSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "location-field");
    expect(container.querySelector("[data-cn-skeleton-map]")).not.toBeNull();
    rerender(<CnLocationField label="Ubicación" showMap={false} showAddress skeleton />);
    expect(container.querySelector("[data-cn-skeleton-map]")).toBeNull();
    expect(container.querySelector("[data-cn-skeleton-address]")).not.toBeNull();
  });
});

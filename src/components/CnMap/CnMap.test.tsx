import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CnLocationField } from "../CnLocationField";
import { CnMap } from "./CnMap";
import { CnMapSkeleton } from "./CnMapSkeleton";
import { CnMapsProvider } from "./CnMapsProvider";
import type { CnMapStyleRule } from "./google-maps-types";
import { buildMapsScriptUrl, loadGoogleMaps, resetGoogleMapsLoader } from "./loader";
import {
  CN_MAP_DARK_PRESETS,
  CN_MAP_STYLE_PRESETS,
  getStaticMapUrl,
  wizardStylesToStaticParams,
} from "./map-styles";

/* ------------------------------------------------------- mock google.maps -- */

type Handler = (event?: unknown) => void;

class Listenable {
  listeners: Record<string, Handler[]> = {};
  addListener(event: string, handler: Handler) {
    (this.listeners[event] ??= []).push(handler);
    return {
      remove: () => {
        this.listeners[event] = (this.listeners[event] ?? []).filter((h) => h !== handler);
      },
    };
  }
  trigger(event: string, payload?: unknown) {
    (this.listeners[event] ?? []).forEach((handler) => handler(payload));
  }
}

const latLng = (lat: number, lng: number) => ({ lat: () => lat, lng: () => lng });

const createGoogleMock = () => {
  const mapInstances: MockMap[] = [];
  const markerInstances: MockMarker[] = [];
  const advancedInstances: MockAdvanced[] = [];
  const infoWindows: MockInfoWindow[] = [];
  class MockMap extends Listenable {
    options: Record<string, unknown>;
    setOptions = vi.fn();
    panTo = vi.fn();
    setCenter = vi.fn();
    setZoom = vi.fn();
    fitBounds = vi.fn();
    constructor(
      public element: HTMLElement,
      options: Record<string, unknown>,
    ) {
      super();
      this.options = options;
      mapInstances.push(this);
    }
    getZoom() {
      return this.options.zoom as number;
    }
  }
  class MockMarker extends Listenable {
    setMap = vi.fn();
    constructor(public options: Record<string, unknown>) {
      super();
      markerInstances.push(this);
    }
    getPosition() {
      const p = this.options.position as { lat: number; lng: number };
      return latLng(p.lat, p.lng);
    }
  }
  class MockAdvanced extends Listenable {
    map: unknown;
    position: unknown;
    constructor(public options: Record<string, unknown>) {
      super();
      this.map = options.map;
      this.position = options.position;
      advancedInstances.push(this);
    }
  }
  class MockInfoWindow extends Listenable {
    setContent = vi.fn();
    open = vi.fn();
    close = vi.fn();
    constructor() {
      super();
      infoWindows.push(this);
    }
  }
  const maps = {
    Map: MockMap,
    Marker: MockMarker,
    InfoWindow: MockInfoWindow,
    LatLngBounds: class {
      points: unknown[] = [];
      extend(point: unknown) {
        this.points.push(point);
      }
    },
    Size: class {
      constructor(
        public width: number,
        public height: number,
      ) {}
    },
    Point: class {
      constructor(
        public x: number,
        public y: number,
      ) {}
    },
    event: {
      addListenerOnce: (instance: Listenable, event: string, handler: Handler) =>
        instance.addListener(event, handler),
      clearInstanceListeners: vi.fn(),
    },
    marker: {
      AdvancedMarkerElement: MockAdvanced,
      PinElement: class {
        element = document.createElement("div");
        constructor(public options: Record<string, unknown>) {}
      },
    },
    importLibrary: vi.fn(async () => ({})),
  };
  return { maps, mapInstances, markerInstances, advancedInstances, infoWindows };
};

type GoogleWindow = Window & { google?: { maps?: Record<string, unknown> } };
const win = window as GoogleWindow;

const installGoogle = () => {
  const mock = createGoogleMock();
  win.google = { maps: mock.maps as unknown as Record<string, unknown> };
  return mock;
};

beforeEach(() => {
  resetGoogleMapsLoader();
  delete win.google;
  document.documentElement.removeAttribute("data-cn-theme");
});
afterEach(() => {
  vi.useRealTimers();
});

/** Muestra exportada del Styling Wizard («Aubergine», recortada). */
const WIZARD_JSON: CnMapStyleRule[] = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#304a7d" }, { weight: 1.5 }],
  },
  { featureType: "all", stylers: [{ saturation: -20 }] },
];

/* ------------------------------------------------------------------ loader -- */

describe("loadGoogleMaps", () => {
  it("injects the script once and resolves after the callback", async () => {
    const first = loadGoogleMaps({ apiKey: "k1", language: "es", region: "MX" });
    const second = loadGoogleMaps({ apiKey: "k1", language: "es", region: "MX" });
    expect(second).toBe(first);
    const scripts = document.querySelectorAll("script[data-cn-google-maps]");
    expect(scripts).toHaveLength(1);
    const src = (scripts[0] as HTMLScriptElement).src;
    expect(src).toContain("key=k1");
    expect(src).toContain("language=es");
    expect(src).toContain("region=MX");
    expect(src).toContain("loading=async");
    expect(src).toContain("callback=google.maps.__ib__");

    // Google invoca el callback cuando termina de cargar.
    const ib = (win.google?.maps as { __ib__?: () => void }).__ib__;
    expect(typeof ib).toBe("function");
    const mock = createGoogleMock();
    Object.assign(win.google!.maps!, mock.maps);
    ib!();
    await expect(first).resolves.toBe(win.google!.maps);
    expect(mock.maps.importLibrary).toHaveBeenCalledWith("maps");
    expect(mock.maps.importLibrary).toHaveBeenCalledWith("marker");
    expect((win.google?.maps as { __ib__?: unknown }).__ib__).toBeUndefined();
    // Ya cargada: no se inyecta otro script.
    await loadGoogleMaps({ apiKey: "k1" });
    expect(document.querySelectorAll("script[data-cn-google-maps]")).toHaveLength(1);
  });

  it("rejects on network failure and allows a retry", async () => {
    const attempt = loadGoogleMaps({ apiKey: "k2" });
    const script = document.querySelector("script[data-cn-google-maps]") as HTMLScriptElement;
    script.dispatchEvent(new Event("error"));
    await expect(attempt).rejects.toThrow(/No se pudo cargar Google Maps/);
    expect(document.querySelector("script[data-cn-google-maps]")).toBeNull();
    loadGoogleMaps({ apiKey: "k2" }).catch(() => undefined);
    expect(document.querySelectorAll("script[data-cn-google-maps]")).toHaveLength(1);
  });

  it("times out and rejects without a key", async () => {
    vi.useFakeTimers();
    const attempt = loadGoogleMaps({ apiKey: "k3", timeoutMs: 1000 });
    vi.advanceTimersByTime(1001);
    await expect(attempt).rejects.toThrow(/tiempo/);
    await expect(loadGoogleMaps({ apiKey: "" })).rejects.toThrow(/API key/);
  });

  it("builds the bootstrap URL params", () => {
    const url = buildMapsScriptUrl({
      apiKey: "abc",
      libraries: ["places", "geometry"],
      mapIds: ["m1"],
      authReferrerPolicy: "origin",
    });
    expect(url).toContain("v=weekly");
    expect(url).toContain("libraries=places%2Cgeometry");
    expect(url).toContain("map_ids=m1");
    expect(url).toContain("auth_referrer_policy=origin");
  });
});

/* ---------------------------------------------------------------- fallback -- */

describe("CnMap without API key", () => {
  it("renders the embed iframe and the open link", () => {
    const { container } = render(<CnMap center={{ lat: 19.4, lng: -99.1 }} zoom={12} />);
    expect(container.querySelector("[data-cn-map-mode='embed']")).not.toBeNull();
    expect(screen.getByTitle("Mapa")).toHaveAttribute(
      "src",
      "https://maps.google.com/maps?q=19.4,-99.1&z=12&output=embed",
    );
    expect(screen.getByRole("link", { name: /Abrir en Google Maps/ })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=19.4%2C-99.1",
    );
    expect(container.querySelector("[data-cn-map-style-note]")).toBeNull();
  });

  it("notes that styles need a key, lists markers and shows an empty state", () => {
    const onClick = vi.fn();
    const { container, rerender } = render(
      <CnMap
        stylePreset="canek"
        markers={[
          { id: 1, position: { lat: 1, lng: 2 }, title: "Norte", onClick, info: "Info norte" },
          { id: 2, position: { lat: 3, lng: 4 }, title: "Sur" },
        ]}
      />,
    );
    expect(container.querySelector("[data-cn-map-style-note]")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Norte/ }));
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByText("Info norte")).toBeInTheDocument();
    expect(screen.getByTitle("Mapa").getAttribute("src")).toContain("q=1,2");
    rerender(<CnMap query="Av. Juárez 10, CDMX" />);
    expect(screen.getByTitle("Mapa").getAttribute("src")).toContain(
      encodeURIComponent("Av. Juárez 10, CDMX"),
    );
    rerender(<CnMap />);
    expect(screen.getByText("Sin ubicación para mostrar")).toBeInTheDocument();
  });

  it("renders its skeleton", () => {
    const { container, rerender } = render(<CnMapSkeleton pins={2} />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "map");
    expect(container.querySelectorAll("[data-cn-skeleton-pin]")).toHaveLength(2);
    rerender(<CnMap center={{ lat: 1, lng: 1 }} skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "map");
  });
});

/* ------------------------------------------------------------- interactive -- */

describe("CnMap with Google Maps", () => {
  it("passes presets to the Map options and updates them", async () => {
    const mock = installGoogle();
    const { rerender } = render(
      <CnMapsProvider apiKey="key">
        <CnMap center={{ lat: 19, lng: -99 }} stylePreset="canek" title="Sucursales" />
      </CnMapsProvider>,
    );
    await waitFor(() => expect(mock.mapInstances).toHaveLength(1));
    const map = mock.mapInstances[0];
    expect(map.options.styles).toBe(CN_MAP_STYLE_PRESETS.canek);
    expect(map.options.center).toEqual({ lat: 19, lng: -99 });
    expect(map.options.mapId).toBeUndefined();
    expect(screen.getByRole("region", { name: "Sucursales" })).toBeInTheDocument();

    rerender(
      <CnMapsProvider apiKey="key">
        <CnMap center={{ lat: 19, lng: -99 }} styles={WIZARD_JSON} title="Sucursales" />
      </CnMapsProvider>,
    );
    await waitFor(() =>
      expect(map.setOptions).toHaveBeenLastCalledWith(
        expect.objectContaining({ styles: WIZARD_JSON }),
      ),
    );
    expect(mock.mapInstances).toHaveLength(1);
  });

  it("uses the provider default style and the dark variant", async () => {
    document.documentElement.setAttribute("data-cn-theme", "dark");
    const mock = installGoogle();
    render(
      <CnMapsProvider apiKey="key" defaultStyle="canek">
        <CnMap center={{ lat: 19, lng: -99 }} controls={{ mapType: true }} />
      </CnMapsProvider>,
    );
    await waitFor(() => expect(mock.mapInstances).toHaveLength(1));
    const options = mock.mapInstances[0].options;
    expect(options.styles).toBe(CN_MAP_DARK_PRESETS.canek);
    expect(options.mapTypeControl).toBe(true);
    expect(options.zoomControl).toBe(true);
    expect(options.streetViewControl).toBe(false);
  });

  it("gives mapId precedence over styles and uses advanced markers", async () => {
    const mock = installGoogle();
    render(
      <CnMapsProvider apiKey="key" mapId="provider-id">
        <CnMap
          center={{ lat: 19, lng: -99 }}
          mapId="cloud-id"
          styles={WIZARD_JSON}
          markers={[{ id: "a", position: { lat: 19, lng: -99 }, label: "A", tone: "accent" }]}
        />
      </CnMapsProvider>,
    );
    await waitFor(() => expect(mock.mapInstances).toHaveLength(1));
    const options = mock.mapInstances[0].options;
    expect(options.mapId).toBe("cloud-id");
    expect(options.styles).toBeUndefined();
    expect(options.colorScheme).toBe("LIGHT");
    await waitFor(() => expect(mock.advancedInstances).toHaveLength(1));
    expect(mock.markerInstances).toHaveLength(0);
  });

  it("renders markers, fits bounds and opens info content", async () => {
    const mock = installGoogle();
    const onMarker = vi.fn();
    render(
      <CnMapsProvider apiKey="key">
        <CnMap
          markers={[
            {
              id: 1,
              position: { lat: 19, lng: -99 },
              title: "Centro",
              onClick: onMarker,
              info: <strong>Sucursal Centro</strong>,
            },
            { id: 2, position: { lat: 20, lng: -103 }, title: "Guadalajara", color: "#ff0000" },
          ]}
        />
      </CnMapsProvider>,
    );
    await waitFor(() => expect(mock.markerInstances).toHaveLength(2));
    const map = mock.mapInstances[0];
    expect(map.fitBounds).toHaveBeenCalled();
    expect(mock.markerInstances[1].options.title).toBe("Guadalajara");
    act(() => mock.markerInstances[0].trigger("click"));
    expect(onMarker).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    await waitFor(() => expect(mock.infoWindows[0]?.open).toHaveBeenCalled());
    const content = mock.infoWindows[0].setContent.mock.calls[0][0] as HTMLElement;
    expect(content.textContent).toBe("Sucursal Centro");
    // Lista accesible por teclado.
    fireEvent.click(screen.getByRole("button", { name: /Guadalajara/ }));
    expect(map.panTo).toHaveBeenCalledWith({ lat: 20, lng: -103 });
  });

  it("supports the draggable picker and map clicks", async () => {
    const mock = installGoogle();
    const onDrag = vi.fn();
    const onClick = vi.fn();
    render(
      <CnMapsProvider apiKey="key">
        <CnMap center={{ lat: 19, lng: -99 }} picker onMarkerDrag={onDrag} onClick={onClick} />
      </CnMapsProvider>,
    );
    await waitFor(() => expect(mock.markerInstances).toHaveLength(1));
    expect(mock.markerInstances[0].options.draggable).toBe(true);
    act(() => mock.markerInstances[0].trigger("dragend", { latLng: latLng(19.5, -99.5) }));
    expect(onDrag).toHaveBeenCalledWith({ lat: 19.5, lng: -99.5 });
    act(() => mock.mapInstances[0].trigger("click", { latLng: latLng(18, -98) }));
    expect(onClick).toHaveBeenCalledWith({ lat: 18, lng: -98 });
  });

  it("shows an error with retry when loading fails", async () => {
    render(
      <CnMapsProvider apiKey="bad">
        <CnMap center={{ lat: 19, lng: -99 }} />
      </CnMapsProvider>,
    );
    const script = document.querySelector("script[data-cn-google-maps]") as HTMLScriptElement;
    act(() => {
      script.dispatchEvent(new Event("error"));
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(/No se pudo cargar Google Maps/);
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    await waitFor(() =>
      expect(document.querySelectorAll("script[data-cn-google-maps]")).toHaveLength(1),
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

/* ------------------------------------------------------------- static map -- */

describe("static maps", () => {
  it("converts wizard JSON to style params", () => {
    expect(wizardStylesToStaticParams(WIZARD_JSON)).toEqual([
      "element:geometry|color:0x1d2c4d",
      "element:labels.text.fill|color:0x8ec3b9",
      "feature:administrative.land_parcel|element:labels|visibility:off",
      "feature:road|element:geometry|color:0x304a7d|weight:1.5",
      "saturation:-20",
    ]);
    expect(wizardStylesToStaticParams([{ stylers: [{ color: "#abc" }] }])).toEqual([
      "color:0xaabbcc",
    ]);
  });

  it("builds a Static Maps URL with markers and styles", () => {
    const url = getStaticMapUrl({
      apiKey: "key",
      center: { lat: 19.4, lng: -99.1 },
      zoom: 13,
      size: [400, 200],
      markers: [{ position: { lat: 19.4, lng: -99.1 }, tone: "brand", label: "a" }],
      styles: WIZARD_JSON.slice(0, 1),
    });
    expect(url.startsWith("https://maps.googleapis.com/maps/api/staticmap?")).toBe(true);
    expect(url).toContain("center=19.4,-99.1");
    expect(url).toContain("size=400x200");
    expect(url).toContain("scale=2");
    expect(url).toContain("markers=color:0x254d87%7Clabel:A%7C19.4,-99.1");
    expect(url).toContain(`style=element:geometry${encodeURIComponent("|")}color:0x1d2c4d`);
    expect(url).toContain("key=key");
    const cloud = getStaticMapUrl({ apiKey: "key", mapId: "m1", styles: WIZARD_JSON });
    expect(cloud).toContain("map_id=m1");
    expect(cloud).not.toContain("style=");
    const preset = getStaticMapUrl({ apiKey: "key", stylePreset: "silver" });
    expect(preset.match(/style=/g)).toHaveLength(CN_MAP_STYLE_PRESETS.silver.length);
  });
});

/* -------------------------------------------------------- CnLocationField -- */

describe("CnLocationField with CnMapsProvider", () => {
  it("picks the location by clicking the map", async () => {
    const mock = installGoogle();
    const onChange = vi.fn();
    render(
      <CnMapsProvider apiKey="key">
        <CnLocationField label="Ubicación" onChange={onChange} decimals={4} />
      </CnMapsProvider>,
    );
    await waitFor(() => expect(mock.mapInstances).toHaveLength(1));
    act(() => mock.mapInstances[0].trigger("click", { latLng: latLng(20.123456, -103.654321) }));
    expect(onChange).toHaveBeenLastCalledWith({ lat: 20.1235, lng: -103.6543 });
    expect(screen.getByLabelText("Latitud")).toHaveValue("20.1235");
    await waitFor(() => expect(mock.markerInstances).toHaveLength(1));
    expect(mock.markerInstances[0].options.draggable).toBe(true);
  });

  it("keeps the embed preview without a key", () => {
    render(<CnLocationField value={{ lat: 19.4, lng: -99.1 }} zoom={12} />);
    expect(screen.getByTitle("Mapa de la ubicación 19.4, -99.1")).toHaveAttribute(
      "src",
      "https://maps.google.com/maps?q=19.4,-99.1&z=12&output=embed",
    );
  });
});

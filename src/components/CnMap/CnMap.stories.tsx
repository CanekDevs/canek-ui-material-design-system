import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnLocationField } from "../CnLocationField";
import type { CnLocationValue } from "../CnLocationField";
import type { CnMapMarker } from "./CnMap";
import { CnMap } from "./CnMap";
import { CnMapSkeleton } from "./CnMapSkeleton";
import { CnMapsProvider } from "./CnMapsProvider";
import type { CnMapStyleRule } from "./google-maps-types";
import type { CnMapStylePreset } from "./map-styles";
import { getStaticMapUrl } from "./map-styles";

/*
 * Las historias leen la key de `STORYBOOK_GOOGLE_MAPS_KEY` (y el map ID de
 * `STORYBOOK_GOOGLE_MAPS_MAP_ID`) en `.env.local`. Sin ellas se ve el iframe
 * de respaldo. Ver `MAPS.md`.
 */
const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
const API_KEY = env.STORYBOOK_GOOGLE_MAPS_KEY;
const MAP_ID = env.STORYBOOK_GOOGLE_MAPS_MAP_ID;

const CDMX = { lat: 19.432608, lng: -99.133209 };

const KeyNote = () => (
  <Box sx={{ fontSize: 12, color: "var(--cn-color-text-muted, #6e7682)", mb: 1 }}>
    {API_KEY
      ? "Usando STORYBOOK_GOOGLE_MAPS_KEY: mapa interactivo."
      : "Sin STORYBOOK_GOOGLE_MAPS_KEY: se muestra el iframe embebido (sin estilos)."}
  </Box>
);

const meta: Meta<typeof CnMap> = {
  title: "Data Display/CnMap",
  component: CnMap,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <CnMapsProvider apiKey={API_KEY}>
        <Story />
      </CnMapsProvider>
    ),
  ],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Mapa de Google con estilos del Styling Wizard, presets, `mapId`, marcadores y selector. " +
          "Define `STORYBOOK_GOOGLE_MAPS_KEY` (y opcionalmente `STORYBOOK_GOOGLE_MAPS_MAP_ID`) en " +
          "`.env.local` para ver el mapa interactivo; sin key se usa el iframe embebido.",
      },
    },
  },
  args: { center: CDMX, zoom: 14, height: 320 },
};

export default meta;
type Story = StoryObj<typeof CnMap>;

export const Default: Story = {
  render: (args) => (
    <>
      <KeyNote />
      <CnMap {...args} />
    </>
  ),
};

/** Sin proveedor ni key: iframe embebido de siempre, con "Abrir en Google Maps". */
export const NoKeyFallback: Story = {
  decorators: [(Story) => <Story />],
  args: { stylePreset: "canek", title: "Mapa sin API key" },
};

const PRESETS: CnMapStylePreset[] = [
  "default",
  "silver",
  "dark",
  "night",
  "retro",
  "minimal",
  "canek",
];

export const PresetsGallery: Story = {
  render: (args) => (
    <>
      <KeyNote />
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        }}
      >
        {PRESETS.map((preset) => (
          <Box key={preset}>
            <Box sx={{ fontSize: 13, fontWeight: 600, mb: "4px" }}>{preset}</Box>
            <CnMap
              {...args}
              height={200}
              stylePreset={preset}
              theme="light"
              showOpenLink={false}
              title={`Preset ${preset}`}
              markers={[{ id: preset, position: CDMX, title: "Zócalo" }]}
            />
          </Box>
        ))}
      </Box>
    </>
  ),
};

/** JSON exportado tal cual del Styling Wizard (tema «Aubergine»). */
const AUBERGINE_WIZARD_JSON: CnMapStyleRule[] = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4b6878" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64779e" }],
  },
  {
    featureType: "administrative.province",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4b6878" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334e87" }],
  },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#023e58" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6f9ba5" }] },
  { featureType: "poi", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#023e58" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#3C7680" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#255763" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b0d5ce" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#023e58" }],
  },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "transit", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "transit.line", elementType: "geometry.fill", stylers: [{ color: "#283d6a" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#3a4762" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
];

export const WizardJson: Story = {
  render: (args) => {
    const staticUrl = API_KEY
      ? getStaticMapUrl({
          apiKey: API_KEY,
          center: CDMX,
          zoom: 13,
          size: [480, 200],
          styles: AUBERGINE_WIZARD_JSON,
          markers: [{ position: CDMX, tone: "accent", label: "Z" }],
        })
      : null;
    return (
      <Stack spacing={2}>
        <KeyNote />
        <CnMap {...args} styles={AUBERGINE_WIZARD_JSON} title="Mapa con estilo del wizard" />
        {staticUrl && (
          <Box>
            <Box sx={{ fontSize: 13, fontWeight: 600, mb: "4px" }}>
              Mismo JSON en Static Maps (getStaticMapUrl)
            </Box>
            <Box
              component="img"
              src={staticUrl}
              alt="Mapa estático con el estilo del wizard"
              sx={{ width: 480, maxWidth: "100%", borderRadius: "12px" }}
            />
          </Box>
        )}
      </Stack>
    );
  },
};

/** Estilo de nube. Usa `STORYBOOK_GOOGLE_MAPS_MAP_ID` o `DEMO_MAP_ID` (sin estilos de nube). */
export const CloudMapId: Story = {
  args: {
    mapId: MAP_ID || "DEMO_MAP_ID",
    markers: [{ id: "z", position: CDMX, title: "Zócalo", label: "Z", tone: "accent" }],
  },
  render: (args) => (
    <>
      <KeyNote />
      <CnMap {...args} />
    </>
  ),
};

const BRANCHES: CnMapMarker[] = [
  {
    id: "cdmx",
    position: CDMX,
    title: "Sucursal Centro",
    label: "1",
    tone: "brand",
    info: (
      <Box sx={{ fontSize: 13 }}>
        <strong>Sucursal Centro</strong>
        <div>Av. Madero 1, CDMX</div>
        <div>Lun–Vie 9:00–18:00</div>
      </Box>
    ),
  },
  {
    id: "gdl",
    position: { lat: 20.676722, lng: -103.347275 },
    title: "Sucursal Guadalajara",
    label: "2",
    tone: "accent",
    info: <strong>Sucursal Guadalajara</strong>,
  },
  {
    id: "mty",
    position: { lat: 25.686614, lng: -100.316113 },
    title: "Sucursal Monterrey",
    label: "3",
    tone: "success",
    info: <strong>Sucursal Monterrey</strong>,
  },
];

export const MarkersWithInfo: Story = {
  args: { center: undefined, markers: BRANCHES, stylePreset: "canek", height: 380 },
  render: (args) => (
    <>
      <KeyNote />
      <CnMap {...args} />
    </>
  ),
};

export const Picker: Story = {
  render: function PickerStory(args) {
    const [point, setPoint] = useState(CDMX);
    return (
      <Stack spacing={1}>
        <KeyNote />
        <CnMap
          {...args}
          center={point}
          picker
          onMarkerDrag={setPoint}
          onClick={setPoint}
          title="Elige un punto"
        />
        <Box sx={{ fontSize: 12, fontFamily: "monospace" }}>
          {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
        </Box>
      </Stack>
    );
  },
};

export const Skeleton: Story = {
  render: () => (
    <Stack spacing={2}>
      <CnMapSkeleton />
      <CnMap center={CDMX} skeleton height={200} />
    </Stack>
  ),
};

export const LocationFieldWithProvider: Story = {
  render: function LocationStory() {
    const [value, setValue] = useState<CnLocationValue | null>({ lat: 19.432608, lng: -99.133209 });
    return (
      <Stack spacing={1}>
        <KeyNote />
        <CnLocationField
          label="Ubicación de la sucursal"
          value={value}
          onChange={setValue}
          helperText={
            API_KEY ? "Haz clic en el mapa o arrastra el pin para elegir la ubicación" : undefined
          }
        />
      </Stack>
    );
  },
};

import LocationOnIcon from "@mui/icons-material/LocationOn";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import { forwardRef, useEffect, useRef, useState } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import {
  getOutlinedFieldSx,
  groupLegendSx,
  helperTextSx,
  mergeSx,
  MUI_FIELD_SIZE,
} from "../../utils/field-styles";
import type { CnValidationRule } from "../CnForm/CnForm.types";
import { CnLocationFieldSkeleton } from "./CnLocationFieldSkeleton";

export type CnLocationValue = {
  lat: number | null;
  lng: number | null;
  /** Dirección o referencia opcional (`showAddress`). */
  address?: string;
};

export type CnLocationFieldProps = CnFieldBaseProps<CnLocationValue | null> & {
  /** Vista previa con Google Maps embebido. Por defecto `true`. */
  showMap?: boolean;
  /** Alto del mapa en px. Por defecto 220. */
  mapHeight?: number;
  /** Zoom del mapa (1–21). Por defecto 15. */
  zoom?: number;
  /** Campo de texto para la dirección o referencia. */
  showAddress?: boolean;
  addressLabel?: string;
  /** Botón "Usar mi ubicación" (navigator.geolocation). Por defecto `true`. */
  allowGeolocation?: boolean;
  /** Decimales que se guardan. Por defecto 6 (~10 cm). */
  decimals?: number;
  latLabel?: string;
  lngLabel?: string;
  /** Opciones para `getCurrentPosition`. */
  geolocationOptions?: PositionOptions;
  /** Muestra el skeleton del campo (mismas variantes) en lugar del campo. */
  skeleton?: boolean;
};

const EMPTY: CnLocationValue = { lat: null, lng: null };

const asLocation = (value: unknown): CnLocationValue => {
  if (!value || typeof value !== "object") return EMPTY;
  const v = value as Partial<CnLocationValue>;
  const num = (n: unknown) =>
    typeof n === "number" && Number.isFinite(n)
      ? n
      : typeof n === "string" && n.trim() !== "" && Number.isFinite(Number(n))
        ? Number(n)
        : null;
  return { ...v, lat: num(v.lat), lng: num(v.lng) } as CnLocationValue;
};

/** Coordenadas válidas (latitud −90…90, longitud −180…180). */
export const isValidCoordinates = (value: unknown): boolean => {
  const { lat, lng } = asLocation(value);
  return lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
};

/** URL del mapa embebido de Google Maps. */
export const getGoogleMapsEmbedUrl = (lat: number, lng: number, zoom = 15) =>
  `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;

/** Reglas implícitas: coordenadas completas y dentro de rango. */
export const buildLocationRules = ({
  required,
}: { required?: boolean } = {}): CnValidationRule[] => {
  const rules: CnValidationRule[] = [];
  if (required) {
    rules.push({
      type: "custom",
      message: "Indica la ubicación",
      validate: (v) => {
        const { lat, lng } = asLocation(v);
        return lat !== null && lng !== null;
      },
    });
  }
  rules.push({
    type: "custom",
    message: "Indica la latitud y la longitud",
    validate: (v) => {
      const { lat, lng } = asLocation(v);
      return (lat === null) === (lng === null);
    },
  });
  rules.push({
    type: "custom",
    message: "Coordenadas fuera de rango (latitud −90 a 90, longitud −180 a 180)",
    validate: (v) => {
      const { lat, lng } = asLocation(v);
      return (lat === null || Math.abs(lat) <= 90) && (lng === null || Math.abs(lng) <= 180);
    },
  });
  return rules;
};

const toDraft = (n: number | null) => (n === null ? "" : String(n));

const parseCoordinate = (text: string): number | null => {
  const cleaned = text.trim().replace(",", ".");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

const round = (n: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
};

/** Coordenadas con "usar mi ubicación" y vista previa en Google Maps. */
export const CnLocationField = forwardRef<HTMLFieldSetElement, CnLocationFieldProps>(
  function CnLocationField(
    {
      id,
      name,
      label,
      helperText,
      error,
      required,
      disabled,
      readOnly,
      value,
      defaultValue,
      onChange,
      onBlur,
      rules,
      formValues,
      sectionContext,
      validateOnChange,
      validateOnBlur,
      debounceMs,
      internalValidation,
      size = "md",
      reserveHelperSpace,
      sx,
      className,
      showMap = true,
      mapHeight = 220,
      zoom = 15,
      showAddress = false,
      addressLabel = "Dirección o referencia",
      allowGeolocation = true,
      decimals = 6,
      latLabel = "Latitud",
      lngLabel = "Longitud",
      geolocationOptions,
      skeleton = false,
    },
    ref,
  ) {
    const [current, setCurrent] = useControllableValue<CnLocationValue | null>(
      value,
      defaultValue,
      EMPTY,
      onChange,
    );
    const location = asLocation(current);
    const control = useFieldControl(location, {
      id,
      rules: [...(rules ?? []), ...buildLocationRules({ required })],
      formValues,
      sectionContext,
      validateOnChange,
      validateOnBlur,
      debounceMs: debounceMs ?? 0,
      internalValidation,
      error,
      helperText,
      reserveHelperSpace,
    });
    const [latDraft, setLatDraft] = useState(() => toDraft(location.lat));
    const [lngDraft, setLngDraft] = useState(() => toDraft(location.lng));
    const [locating, setLocating] = useState(false);
    const [geoMessage, setGeoMessage] = useState<string | null>(null);
    const mounted = useRef(true);
    useEffect(
      () => () => {
        mounted.current = false;
      },
      [],
    );

    // Sincroniza los borradores cuando el valor cambia desde fuera.
    useEffect(() => {
      if (parseCoordinate(latDraft) !== location.lat) setLatDraft(toDraft(location.lat));
      if (parseCoordinate(lngDraft) !== location.lng) setLngDraft(toDraft(location.lng));
      // Solo al cambiar el valor externo.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.lat, location.lng]);

    const geoSupported = typeof navigator !== "undefined" && Boolean(navigator.geolocation);
    const locked = Boolean(disabled || readOnly);
    const valid = isValidCoordinates(location);

    if (skeleton) {
      return (
        <CnLocationFieldSkeleton
          size={size}
          label={Boolean(label)}
          helperText={Boolean(control.helperText?.trim())}
          showMap={showMap}
          mapHeight={mapHeight}
          showAddress={showAddress}
          geolocation={allowGeolocation && !locked}
          sx={sx}
          className={className}
        />
      );
    }

    const emit = (patch: Partial<CnLocationValue>) => {
      control.markChanged();
      setCurrent({ ...location, ...patch });
    };

    const locateMe = () => {
      if (!geoSupported) {
        setGeoMessage("Tu navegador no permite obtener la ubicación");
        return;
      }
      setLocating(true);
      setGeoMessage(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!mounted.current) return;
          setLocating(false);
          const lat = round(position.coords.latitude, decimals);
          const lng = round(position.coords.longitude, decimals);
          setLatDraft(toDraft(lat));
          setLngDraft(toDraft(lng));
          emit({ lat, lng });
          setGeoMessage(
            Number.isFinite(position.coords.accuracy)
              ? `Ubicación obtenida (precisión aproximada de ${Math.round(position.coords.accuracy)} m)`
              : "Ubicación obtenida",
          );
        },
        (geoError) => {
          if (!mounted.current) return;
          setLocating(false);
          setGeoMessage(
            geoError.code === 1
              ? "Permiso de ubicación denegado. Actívalo en tu navegador o escribe las coordenadas."
              : geoError.code === 3
                ? "Se agotó el tiempo para obtener la ubicación"
                : "No se pudo obtener la ubicación",
          );
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000, ...geolocationOptions },
      );
    };

    const coordinate = (kind: "lat" | "lng") => {
      const draft = kind === "lat" ? latDraft : lngDraft;
      const setDraft = kind === "lat" ? setLatDraft : setLngDraft;
      return (
        <TextField
          id={kind === "lat" ? control.id : `${control.id}-lng`}
          label={kind === "lat" ? latLabel : lngLabel}
          size={MUI_FIELD_SIZE[size]}
          value={draft}
          disabled={disabled}
          error={control.error}
          required={required}
          placeholder={kind === "lat" ? "19.432608" : "-99.133209"}
          onChange={(event) => {
            const text = event.target.value.replace(/[^\d.,-]/g, "");
            setDraft(text);
            emit({ [kind]: parseCoordinate(text) });
          }}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: {
              readOnly,
              inputMode: "decimal",
              name: name ? `${name}[${kind}]` : undefined,
              "aria-describedby": control.helperText?.trim() ? control.helperId : undefined,
            },
          }}
          sx={mergeSx(getOutlinedFieldSx(size), { flex: 1, minWidth: 140 })}
        />
      );
    };

    return (
      <FormControl
        ref={ref}
        component="fieldset"
        fullWidth
        error={control.error}
        disabled={disabled}
        required={required}
        className={className}
        data-cn-location-field
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            control.markBlurred();
            onBlur?.();
          }
        }}
        sx={mergeSx({ minWidth: 0, border: 0, p: 0, m: 0 }, sx)}
      >
        {label && (
          <FormLabel component="legend" sx={groupLegendSx}>
            {label}
          </FormLabel>
        )}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "8px",
            pt: label ? "6px" : 0,
          }}
        >
          {coordinate("lat")}
          {coordinate("lng")}
          {allowGeolocation && !locked && (
            <Button
              variant="outlined"
              size={size === "lg" ? "medium" : "small"}
              onClick={locateMe}
              disabled={locating}
              startIcon={locating ? <CircularProgress size={14} aria-hidden /> : <MyLocationIcon />}
              sx={{ textTransform: "none", fontWeight: 600, flexShrink: 0 }}
            >
              {locating ? "Obteniendo…" : "Usar mi ubicación"}
            </Button>
          )}
        </Box>
        {geoMessage && (
          <Box
            role="status"
            sx={{ mt: "4px", fontSize: 11, color: "var(--cn-color-text-muted, #6e7682)" }}
          >
            {geoMessage}
          </Box>
        )}
        {showAddress && (
          <TextField
            id={`${control.id}-address`}
            label={addressLabel}
            size={MUI_FIELD_SIZE[size]}
            value={location.address ?? ""}
            disabled={disabled}
            onChange={(event) => emit({ address: event.target.value })}
            fullWidth
            slotProps={{
              htmlInput: { readOnly, name: name ? `${name}[address]` : undefined },
            }}
            sx={mergeSx(getOutlinedFieldSx(size), { mt: "10px" })}
          />
        )}
        {showMap && (
          <Box
            data-cn-location-map
            sx={{
              mt: "10px",
              height: mapHeight,
              borderRadius: "var(--cn-radius-md, 8px)",
              overflow: "hidden",
              border: "1px solid var(--cn-color-border, #dde0e4)",
              backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
            }}
          >
            {valid && location.lat !== null && location.lng !== null ? (
              <Box
                component="iframe"
                title={`Mapa de la ubicación ${location.lat}, ${location.lng}`}
                src={getGoogleMapsEmbedUrl(location.lat, location.lng, zoom)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                sx={{ width: "100%", height: "100%", border: 0, display: "block" }}
              />
            ) : (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  color: "var(--cn-color-text-subtle, #9aa1aa)",
                  fontSize: 12,
                }}
              >
                <LocationOnIcon />
                Indica las coordenadas para ver el mapa
              </Box>
            )}
          </Box>
        )}
        {valid && (
          <Link
            href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              mt: "6px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: 12,
              alignSelf: "flex-start",
            }}
          >
            Abrir en Google Maps
            <OpenInNewIcon sx={{ fontSize: 14 }} />
          </Link>
        )}
        {control.helperText && (
          <FormHelperText id={control.helperId} sx={helperTextSx}>
            {control.helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  },
);

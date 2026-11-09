import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
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
import { CnAddressFieldSkeleton } from "./CnAddressFieldSkeleton";

export type CnAddressValue = {
  /** Calle. */
  street?: string;
  /** Número exterior. */
  exteriorNumber?: string;
  /** Número interior (depto., local…). */
  interiorNumber?: string;
  /** Colonia. */
  neighborhood?: string;
  /** Código postal. */
  postalCode?: string;
  /** Municipio o alcaldía. */
  municipality?: string;
  /** Estado. */
  state?: string;
  country?: string;
  /** Referencias (entre calles, color de fachada…). */
  references?: string;
};

export type CnAddressPart = keyof CnAddressValue;

/** Respuesta de `onPostalCodeLookup` (formato de SEPOMEX / Copomex). */
export type CnPostalCodeLookupResult = {
  colonias: string[];
  municipio?: string;
  estado?: string;
};

export type CnAddressFieldProps = CnFieldBaseProps<CnAddressValue> & {
  /** Partes visibles, en orden. Por defecto todas excepto `country`. */
  fields?: CnAddressPart[];
  /**
   * Partes obligatorias cuando el campo es `required`. Por defecto calle,
   * número exterior, código postal, colonia, municipio y estado (las visibles).
   */
  requiredParts?: CnAddressPart[];
  /** Etiquetas propias por parte. */
  labels?: Partial<Record<CnAddressPart, string>>;
  /**
   * Busca el código postal (5 dígitos) y autocompleta municipio y estado; si
   * devuelve varias colonias, la colonia se vuelve una lista.
   */
  onPostalCodeLookup?: (postalCode: string) => Promise<CnPostalCodeLookupResult | null>;
  /** Lista de estados para el selector. `false` = campo de texto libre. */
  states?: readonly string[] | false;
  /** Valida el código postal mexicano (5 dígitos). Por defecto `true`. */
  validatePostalCode?: boolean;
  /** Muestra el skeleton del campo (mismas variantes) en lugar del campo. */
  skeleton?: boolean;
};

export const MX_STATES: readonly string[] = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
];

export const ADDRESS_PART_LABELS: Record<CnAddressPart, string> = {
  street: "Calle",
  exteriorNumber: "Núm. exterior",
  interiorNumber: "Núm. interior",
  postalCode: "Código postal",
  neighborhood: "Colonia",
  municipality: "Municipio / alcaldía",
  state: "Estado",
  country: "País",
  references: "Referencias",
};

export const DEFAULT_ADDRESS_FIELDS: CnAddressPart[] = [
  "street",
  "exteriorNumber",
  "interiorNumber",
  "postalCode",
  "neighborhood",
  "municipality",
  "state",
  "references",
];

export const DEFAULT_REQUIRED_ADDRESS_PARTS: CnAddressPart[] = [
  "street",
  "exteriorNumber",
  "postalCode",
  "neighborhood",
  "municipality",
  "state",
];

/** Columnas (de 12) de cada parte en pantallas medianas en adelante. */
const SPANS: Record<CnAddressPart, number> = {
  street: 6,
  exteriorNumber: 3,
  interiorNumber: 3,
  postalCode: 3,
  neighborhood: 5,
  municipality: 4,
  state: 6,
  country: 6,
  references: 12,
};

const asAddress = (value: unknown): CnAddressValue =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as CnAddressValue) : {};

const isBlank = (text: unknown) => typeof text !== "string" || text.trim() === "";

/** Partes obligatorias que faltan. */
export const getMissingAddressParts = (
  value: unknown,
  requiredParts: readonly CnAddressPart[] = DEFAULT_REQUIRED_ADDRESS_PARTS,
): CnAddressPart[] => {
  const address = asAddress(value);
  return requiredParts.filter((part) => isBlank(address[part]));
};

/** Reglas implícitas: partes obligatorias y formato del código postal. */
export const buildAddressRules = ({
  required,
  requiredParts,
  fields = DEFAULT_ADDRESS_FIELDS,
  labels,
  validatePostalCode = true,
}: {
  required?: boolean;
  requiredParts?: readonly CnAddressPart[];
  fields?: readonly CnAddressPart[];
  labels?: Partial<Record<CnAddressPart, string>>;
  validatePostalCode?: boolean;
} = {}): CnValidationRule[] => {
  const rules: CnValidationRule[] = [];
  const parts = (requiredParts ?? DEFAULT_REQUIRED_ADDRESS_PARTS).filter((p) => fields.includes(p));
  if (required && parts.length) {
    let missing: CnAddressPart[] = [];
    rules.push({
      type: "custom",
      message: () =>
        `Completa: ${missing.map((p) => labels?.[p] ?? ADDRESS_PART_LABELS[p]).join(", ")}`,
      validate: (v) => {
        missing = getMissingAddressParts(v, parts);
        return missing.length === 0;
      },
    });
  }
  if (validatePostalCode && fields.includes("postalCode")) {
    rules.push({
      type: "custom",
      message: "El código postal debe tener 5 dígitos",
      validate: (v) => {
        const cp = asAddress(v).postalCode;
        return isBlank(cp) || /^\d{5}$/.test(String(cp).trim());
      },
    });
  }
  return rules;
};

const OTHER = "__cn-other__";

/** Domicilio mexicano con autocompletado opcional por código postal. */
export const CnAddressField = forwardRef<HTMLFieldSetElement, CnAddressFieldProps>(
  function CnAddressField(
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
      fields = DEFAULT_ADDRESS_FIELDS,
      requiredParts,
      labels,
      onPostalCodeLookup,
      states = MX_STATES,
      validatePostalCode = true,
      skeleton = false,
    },
    ref,
  ) {
    const [current, setCurrent] = useControllableValue<CnAddressValue>(
      value,
      defaultValue,
      {},
      onChange,
    );
    const address = asAddress(current);
    const control = useFieldControl(address, {
      id,
      rules: [
        ...(rules ?? []),
        ...buildAddressRules({ required, requiredParts, fields, labels, validatePostalCode }),
      ],
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
    const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
    const [manualNeighborhood, setManualNeighborhood] = useState(false);
    const [lookupState, setLookupState] = useState<"idle" | "loading" | "notFound" | "error">(
      "idle",
    );
    const lookupRef = useRef(onPostalCodeLookup);
    lookupRef.current = onPostalCodeLookup;
    const latestCp = useRef<string>("");
    const addressRef = useRef(address);
    addressRef.current = address;

    const effectiveRequired = required
      ? (requiredParts ?? DEFAULT_REQUIRED_ADDRESS_PARTS).filter((p) => fields.includes(p))
      : [];
    const missing = control.error ? getMissingAddressParts(address, effectiveRequired) : [];
    const labelOf = (part: CnAddressPart) => labels?.[part] ?? ADDRESS_PART_LABELS[part];

    const emit = (patch: Partial<CnAddressValue>) => {
      control.markChanged();
      setCurrent({ ...addressRef.current, ...patch });
    };

    const lookup = (cp: string, fill: boolean) => {
      const fn = lookupRef.current;
      if (!fn) return;
      latestCp.current = cp;
      setLookupState("loading");
      fn(cp)
        .then((result) => {
          if (latestCp.current !== cp) return;
          const colonias = result?.colonias?.filter(Boolean) ?? [];
          if (!result || (colonias.length === 0 && !result.municipio && !result.estado)) {
            setNeighborhoods([]);
            setLookupState("notFound");
            return;
          }
          setNeighborhoods(colonias);
          setLookupState("idle");
          const currentNeighborhood = addressRef.current.neighborhood ?? "";
          const keepsNeighborhood = colonias.includes(currentNeighborhood);
          setManualNeighborhood(
            colonias.length === 0 || (!keepsNeighborhood && !fill && !isBlank(currentNeighborhood)),
          );
          if (!fill) return;
          const patch: Partial<CnAddressValue> = {};
          if (result.municipio) patch.municipality = result.municipio;
          if (result.estado) patch.state = result.estado;
          if (colonias.length === 1) patch.neighborhood = colonias[0];
          else if (!keepsNeighborhood && colonias.length > 1) patch.neighborhood = "";
          if (Object.keys(patch).length) emit(patch);
        })
        .catch(() => {
          if (latestCp.current !== cp) return;
          setNeighborhoods([]);
          setLookupState("error");
        });
    };

    // Edición de un domicilio existente: carga las colonias sin sobrescribir datos.
    useEffect(() => {
      const cp = (address.postalCode ?? "").trim();
      if (/^\d{5}$/.test(cp) && lookupRef.current) lookup(cp, false);
      // Solo al montar.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (skeleton) {
      return (
        <CnAddressFieldSkeleton
          size={size}
          fields={fields}
          label={Boolean(label)}
          helperText={Boolean(control.helperText?.trim())}
          sx={sx}
          className={className}
        />
      );
    }

    const changePostalCode = (raw: string) => {
      const cp = raw.replace(/\D/g, "").slice(0, 5);
      emit({ postalCode: cp });
      if (cp.length === 5 && onPostalCodeLookup) {
        lookup(cp, true);
      } else {
        latestCp.current = "";
        setLookupState("idle");
        setNeighborhoods([]);
        setManualNeighborhood(false);
      }
    };

    const describedBy = control.helperText?.trim() ? control.helperId : undefined;

    const renderPart = (part: CnAddressPart) => {
      const partRequired = effectiveRequired.includes(part);
      const partError = missing.includes(part);
      const common = {
        id: part === fields[0] ? control.id : `${control.id}-${part}`,
        label: labelOf(part),
        size: MUI_FIELD_SIZE[size],
        fullWidth: true,
        disabled,
        required: partRequired,
        error: partError,
        value: address[part] ?? "",
        sx: getOutlinedFieldSx(size),
      };
      const htmlInput = {
        readOnly,
        name: name ? `${name}[${part}]` : undefined,
        "aria-describedby": describedBy,
      };

      if (part === "postalCode") {
        const lookupHelper =
          lookupState === "notFound"
            ? "No encontramos el código postal; captura los datos"
            : lookupState === "error"
              ? "No se pudo consultar el código postal"
              : undefined;
        return (
          <TextField
            {...common}
            onChange={(event) => changePostalCode(event.target.value)}
            helperText={lookupHelper}
            slotProps={{
              htmlInput: {
                ...htmlInput,
                inputMode: "numeric",
                autoComplete: "postal-code",
                maxLength: 5,
                "data-cn-address-part": part,
              },
              input: {
                endAdornment:
                  lookupState === "loading" ? (
                    <InputAdornment position="end">
                      <CircularProgress size={16} aria-label="Buscando código postal" />
                    </InputAdornment>
                  ) : undefined,
              },
            }}
          />
        );
      }

      if (part === "neighborhood" && neighborhoods.length > 0 && !manualNeighborhood) {
        return (
          <TextField
            {...common}
            select
            onChange={(event) => {
              if (event.target.value === OTHER) {
                setManualNeighborhood(true);
                emit({ neighborhood: "" });
              } else emit({ neighborhood: event.target.value });
            }}
            slotProps={{
              htmlInput: { ...htmlInput, "data-cn-address-part": part },
              select: { readOnly },
            }}
          >
            {neighborhoods.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
            <MenuItem value={OTHER}>
              <em>Otra (escribir)</em>
            </MenuItem>
          </TextField>
        );
      }

      if (part === "state" && states && states.length > 0) {
        const options =
          address.state && !states.includes(address.state) ? [address.state, ...states] : states;
        return (
          <TextField
            {...common}
            select
            onChange={(event) => emit({ state: event.target.value })}
            slotProps={{
              htmlInput: { ...htmlInput, "data-cn-address-part": part },
              select: { readOnly, MenuProps: { slotProps: { paper: { sx: { maxHeight: 320 } } } } },
            }}
          >
            {options.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        );
      }

      const autoComplete: Partial<Record<CnAddressPart, string>> = {
        street: "address-line1",
        interiorNumber: "address-line2",
        municipality: "address-level2",
        state: "address-level1",
        country: "country-name",
      };
      return (
        <TextField
          {...common}
          multiline={part === "references"}
          minRows={part === "references" ? 2 : undefined}
          onChange={(event) => emit({ [part]: event.target.value })}
          slotProps={{
            htmlInput: {
              ...htmlInput,
              autoComplete: autoComplete[part],
              "data-cn-address-part": part,
            },
          }}
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
        data-cn-address-field
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
            display: "grid",
            gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
            gap: "14px 12px",
            pt: label ? "8px" : 0,
          }}
        >
          {fields.map((part) => (
            <Box
              key={part}
              sx={{
                gridColumn: {
                  xs: `span ${part === "exteriorNumber" || part === "interiorNumber" ? 6 : 12}`,
                  sm: `span ${SPANS[part]}`,
                },
                minWidth: 0,
              }}
            >
              {renderPart(part)}
            </Box>
          ))}
        </Box>
        {control.helperText && (
          <FormHelperText id={control.helperId} sx={helperTextSx}>
            {control.helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  },
);

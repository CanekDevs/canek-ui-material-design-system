import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import { forwardRef, useRef } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import {
  getOutlinedFieldSx,
  groupLegendSx,
  helperTextSx,
  mergeSx,
  MUI_FIELD_SIZE,
} from "../../utils/field-styles";
import { CnKeyValueFieldSkeleton } from "./CnKeyValueFieldSkeleton";

export type CnKeyValuePair = { key: string; value: string };

/** Arreglo de pares (por defecto) u objeto `{ clave: valor }`. */
export type CnKeyValueValue = CnKeyValuePair[] | Record<string, string>;

export type CnKeyValueFieldProps = CnFieldBaseProps<CnKeyValueValue> & {
  /** `array` (conserva orden y duplicados vacíos) u `object`. Por defecto `array`. */
  valueFormat?: "array" | "object";
  keyLabel?: string;
  valueLabel?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
  maxRows?: number;
  /** Claves sugeridas (lista de autocompletado del navegador). */
  keySuggestions?: string[];
  /** Muestra el skeleton del campo (mismas variantes) en lugar del campo. */
  skeleton?: boolean;
};

const toPairs = (value: CnKeyValueValue | undefined | null): CnKeyValuePair[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return Object.entries(value).map(([key, val]) => ({ key, value: String(val ?? "") }));
};

/** Pares vacíos o con clave repetida (para validación). */
export const findKeyValueIssues = (
  value: unknown,
): { duplicates: string[]; missingKey: boolean } => {
  const pairs = toPairs(value as CnKeyValueValue);
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  let missingKey = false;
  for (const pair of pairs) {
    const key = pair.key.trim();
    if (!key) {
      if (pair.value.trim()) missingKey = true;
      continue;
    }
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return { duplicates: [...duplicates], missingKey };
};

/** Regla implícita: sin claves vacías con valor y sin claves repetidas. */
export const KEY_VALUE_RULE = {
  type: "custom" as const,
  message: "Revisa las claves: no pueden repetirse ni quedar vacías",
  validate: (value: unknown) => {
    const issues = findKeyValueIssues(value);
    return issues.duplicates.length === 0 && !issues.missingKey;
  },
};

/**
 * Lista editable de pares clave–valor: metadatos, atributos de producto,
 * encabezados HTTP, variables de entorno, campos adicionales…
 */
export const CnKeyValueField = forwardRef<HTMLFieldSetElement, CnKeyValueFieldProps>(
  function CnKeyValueField(
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
      valueFormat = "array",
      keyLabel = "Clave",
      valueLabel = "Valor",
      keyPlaceholder,
      valuePlaceholder,
      addLabel = "Agregar",
      maxRows,
      keySuggestions,
      skeleton = false,
    },
    ref,
  ) {
    const [current, setCurrent] = useControllableValue<CnKeyValueValue>(
      value,
      defaultValue,
      valueFormat === "object" ? {} : [],
      onChange,
    );
    const control = useFieldControl(current, {
      id,
      rules,
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
    const rowsRef = useRef<HTMLDivElement | null>(null);
    // En formato objeto las filas en edición (clave vacía) no existen en el
    // valor; se guardan aparte para no perderlas.
    const draftRef = useRef<CnKeyValuePair[] | null>(null);
    if (valueFormat === "object" && draftRef.current) {
      // Si el valor cambió desde fuera (reset, carga), se descarta el borrador.
      const fromDraft = Object.fromEntries(
        draftRef.current.filter((p) => p.key.trim()).map((p) => [p.key.trim(), p.value]),
      );
      const external = (current && !Array.isArray(current) ? current : {}) as Record<
        string,
        string
      >;
      const same =
        Object.keys(fromDraft).length === Object.keys(external).length &&
        Object.entries(fromDraft).every(([k, v]) => external[k] === v);
      if (!same) draftRef.current = null;
    }
    const pairs =
      valueFormat === "object" && draftRef.current ? draftRef.current : toPairs(current);
    const locked = Boolean(disabled || readOnly);
    const { duplicates } = findKeyValueIssues(pairs);

    const emit = (next: CnKeyValuePair[]) => {
      control.markChanged();
      if (valueFormat === "object") {
        draftRef.current = next;
        const obj: Record<string, string> = {};
        for (const pair of next) if (pair.key.trim()) obj[pair.key.trim()] = pair.value;
        setCurrent(obj);
      } else {
        setCurrent(next);
      }
    };

    const update = (index: number, patch: Partial<CnKeyValuePair>) =>
      emit(pairs.map((pair, i) => (i === index ? { ...pair, ...patch } : pair)));

    const add = () => {
      emit([...pairs, { key: "", value: "" }]);
      setTimeout(() => {
        const inputs = rowsRef.current?.querySelectorAll<HTMLInputElement>("input[data-kv-key]");
        inputs?.[inputs.length - 1]?.focus();
      }, 0);
    };

    const listId = keySuggestions?.length ? `${control.id}-keys` : undefined;
    const canAdd = !locked && (maxRows === undefined || pairs.length < maxRows);

    if (skeleton) {
      return (
        <CnKeyValueFieldSkeleton
          size={size}
          rows={pairs.length || undefined}
          maxRows={maxRows}
          readOnly={locked}
          label={Boolean(label)}
          helperText={Boolean(control.helperText)}
          sx={sx}
          className={className}
        />
      );
    }

    return (
      <FormControl
        ref={ref}
        component="fieldset"
        error={control.error}
        disabled={disabled}
        required={required}
        fullWidth
        className={className}
        data-cn-key-value-field
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
          ref={rowsRef}
          id={control.id}
          aria-describedby={control.helperText ? control.helperId : undefined}
          sx={{ display: "flex", flexDirection: "column", gap: "8px" }}
        >
          {pairs.length === 0 && (
            <Box
              sx={{
                fontSize: "var(--cn-font-size-sm, 12px)",
                color: "var(--cn-color-text-muted, #6e7682)",
              }}
            >
              Sin elementos.
            </Box>
          )}
          {pairs.map((pair, index) => {
            const duplicated = duplicates.includes(pair.key.trim());
            return (
              <Box
                key={index}
                role="group"
                aria-label={`${keyLabel} ${index + 1}`}
                sx={{ display: "flex", alignItems: "flex-start", gap: "8px" }}
              >
                <TextField
                  size={MUI_FIELD_SIZE[size]}
                  label={keyLabel}
                  placeholder={keyPlaceholder}
                  value={pair.key}
                  disabled={disabled}
                  error={duplicated}
                  helperText={duplicated ? "Clave repetida" : undefined}
                  onChange={(event) => update(index, { key: event.target.value })}
                  slotProps={{
                    htmlInput: {
                      readOnly,
                      list: listId,
                      "data-kv-key": true,
                      name: name ? `${name}[${index}][key]` : undefined,
                    },
                  }}
                  sx={mergeSx(getOutlinedFieldSx(size), { flex: 2, minWidth: 0 })}
                />
                <TextField
                  size={MUI_FIELD_SIZE[size]}
                  label={valueLabel}
                  placeholder={valuePlaceholder}
                  value={pair.value}
                  disabled={disabled}
                  onChange={(event) => update(index, { value: event.target.value })}
                  slotProps={{
                    htmlInput: {
                      readOnly,
                      name: name ? `${name}[${index}][value]` : undefined,
                    },
                  }}
                  sx={mergeSx(getOutlinedFieldSx(size), { flex: 3, minWidth: 0 })}
                />
                {!locked && (
                  <IconButton
                    size="small"
                    aria-label={`Eliminar fila ${index + 1}`}
                    onClick={() => emit(pairs.filter((_, i) => i !== index))}
                    sx={{ mt: "6px", color: "var(--cn-color-error-600, #b52f2f)" }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            );
          })}
          {canAdd && (
            <Box>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={add}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                {addLabel}
              </Button>
            </Box>
          )}
          {listId && (
            <datalist id={listId}>
              {keySuggestions?.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          )}
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

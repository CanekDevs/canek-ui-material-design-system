import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import type { ReactElement, ReactNode, Ref } from "react";
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
import { moveArrayItem, useSortableList } from "../../utils/use-sortable-list";
import { isEmptyValue } from "../CnForm/CnForm.validation";
import type { CnValidationRule } from "../CnForm/CnForm.types";
import { CnRepeaterFieldSkeleton } from "./CnRepeaterFieldSkeleton";

export type CnRepeaterItemContext<T> = {
  value: T;
  index: number;
  onChange: (next: T) => void;
  /** Id sugerido para el control principal del elemento. */
  id: string;
  /** Nombre del elemento (`name[index]`). */
  name?: string;
  /** Nombre accesible del elemento ("Elemento 2"). */
  label: string;
  disabled: boolean;
  readOnly: boolean;
  error: boolean;
  size: NonNullable<CnFieldBaseProps<unknown>["size"]>;
};

export type CnRepeaterFieldProps<T = string> = CnFieldBaseProps<T[]> & {
  /** Mínimo de elementos (no se pueden quitar por debajo). */
  minItems?: number;
  /** Máximo de elementos (se oculta "Agregar" al llegar). */
  maxItems?: number;
  /** Contenido de cada elemento; por defecto un campo de texto. */
  renderItem?: (ctx: CnRepeaterItemContext<T>) => ReactNode;
  /** Valor de un elemento nuevo; por defecto `""`. */
  newItem?: () => T;
  /** Nombre de cada elemento para accesibilidad y botones ("Elemento 1"). */
  itemLabel?: string;
  /** Placeholder del campo de texto por defecto. */
  placeholder?: string;
  addLabel?: string;
  /** Reordenar con asa (arrastrar o flechas) y botones subir/bajar. Por defecto `true`. */
  reorderable?: boolean;
  /** Contador de elementos (`3 / 5`). Por defecto `true`. */
  showCounter?: boolean;
  /** Texto cuando no hay elementos. */
  emptyText?: ReactNode;
  /** Muestra el skeleton del campo (mismas variantes) en lugar del campo. */
  skeleton?: boolean;
};

/** Reglas implícitas: requerido (algún elemento con valor), mínimo y máximo. */
export const buildRepeaterRules = ({
  required,
  minItems,
  maxItems,
}: {
  required?: boolean;
  minItems?: number;
  maxItems?: number;
} = {}): CnValidationRule[] => {
  const filled = (v: unknown) =>
    Array.isArray(v) ? v.filter((item) => !isEmptyValue(item)).length : 0;
  const rules: CnValidationRule[] = [];
  if (required) {
    rules.push({
      type: "custom",
      message: "Agrega al menos un elemento",
      validate: (v) => filled(v) > 0,
    });
  }
  if (minItems !== undefined && minItems > 0) {
    rules.push({
      type: "custom",
      message: `Agrega al menos ${minItems} ${minItems === 1 ? "elemento" : "elementos"}`,
      validate: (v) => (filled(v) === 0 && !required ? true : filled(v) >= minItems),
    });
  }
  if (maxItems !== undefined) {
    rules.push({
      type: "custom",
      message: `Máximo ${maxItems} ${maxItems === 1 ? "elemento" : "elementos"}`,
      validate: (v) => !Array.isArray(v) || v.length <= maxItems,
    });
  }
  return rules;
};

let keySeed = 0;
const nextKey = () => `cn-rep-${(keySeed += 1)}`;

/** Lista editable: agregar, quitar y reordenar elementos (texto o contenido propio). */
const CnRepeaterFieldInner = <T,>(
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
    minItems,
    maxItems,
    renderItem,
    newItem,
    itemLabel = "Elemento",
    placeholder,
    addLabel = "Agregar",
    reorderable = true,
    showCounter = true,
    emptyText = "Sin elementos.",
    skeleton = false,
  }: CnRepeaterFieldProps<T>,
  ref: Ref<HTMLFieldSetElement>,
) => {
  const createItem = () => (newItem ? newItem() : ("" as T));
  const [current, setCurrent] = useControllableValue<T[]>(
    value,
    defaultValue,
    Array.from({ length: minItems ?? 0 }, createItem),
    onChange,
  );
  const items: T[] = Array.isArray(current) ? current : [];
  const control = useFieldControl(items, {
    id,
    rules: [...(rules ?? []), ...buildRepeaterRules({ required, minItems, maxItems })],
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
  const listRef = useRef<HTMLDivElement | null>(null);
  // Claves estables por elemento (el foco y el estado interno sobreviven al reordenar).
  const keysRef = useRef<string[]>([]);
  if (keysRef.current.length !== items.length) {
    const keys = keysRef.current.slice(0, items.length);
    while (keys.length < items.length) keys.push(nextKey());
    keysRef.current = keys;
  }
  const locked = Boolean(disabled || readOnly);
  const canAdd = !locked && (maxItems === undefined || items.length < maxItems);
  const canRemove = !locked && items.length > (minItems ?? 0);
  const labelOf = (index: number) => `${itemLabel} ${index + 1}`;

  const emit = (next: T[]) => {
    control.markChanged();
    setCurrent(next);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    keysRef.current = moveArrayItem(keysRef.current, from, to);
    emit(moveArrayItem(items, from, to));
  };

  const sortable = useSortableList({
    count: items.length,
    onMove: move,
    disabled: locked || !reorderable,
    getItemLabel: labelOf,
  });

  if (skeleton) {
    return (
      <CnRepeaterFieldSkeleton
        size={size}
        items={items.length}
        reorderable={reorderable && !locked}
        addButton={canAdd}
        counter={showCounter}
        label={Boolean(label)}
        helperText={Boolean(control.helperText?.trim())}
        sx={sx}
        className={className}
      />
    );
  }

  const add = () => {
    keysRef.current = [...keysRef.current, nextKey()];
    emit([...items, createItem()]);
    setTimeout(() => {
      const rows = listRef.current?.querySelectorAll<HTMLElement>("[data-cn-repeater-item]");
      rows?.[rows.length - 1]
        ?.querySelector<HTMLElement>(
          "input, textarea, select, [tabindex]:not([data-cn-drag-handle])",
        )
        ?.focus();
    }, 0);
  };

  const remove = (index: number) => {
    keysRef.current = keysRef.current.filter((_, i) => i !== index);
    emit(items.filter((_, i) => i !== index));
  };

  const update = (index: number, next: T) =>
    emit(items.map((item, i) => (i === index ? next : item)));

  const counterText =
    maxItems !== undefined
      ? `${items.length} / ${maxItems}`
      : `${items.length} ${items.length === 1 ? "elemento" : "elementos"}`;

  return (
    <FormControl
      ref={ref}
      component="fieldset"
      fullWidth
      error={control.error}
      disabled={disabled}
      required={required}
      className={className}
      data-cn-repeater-field
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
        ref={listRef}
        id={control.id}
        role="list"
        aria-describedby={control.helperText?.trim() ? control.helperId : undefined}
        sx={{ display: "flex", flexDirection: "column", gap: "8px" }}
      >
        {items.length === 0 && (
          <Box
            data-cn-repeater-empty
            sx={{
              p: "14px",
              textAlign: "center",
              borderRadius: "var(--cn-radius-md, 8px)",
              border: "1px dashed var(--cn-color-border-strong, #c5cad0)",
              fontSize: "var(--cn-font-size-sm, 12px)",
              color: "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            {emptyText}
          </Box>
        )}
        {items.map((item, index) => {
          const itemProps = sortable.getItemProps(index);
          const itemId = `${control.id}-item-${index}`;
          const ctx: CnRepeaterItemContext<T> = {
            value: item,
            index,
            onChange: (next) => update(index, next),
            id: itemId,
            name: name ? `${name}[${index}]` : undefined,
            label: labelOf(index),
            disabled: Boolean(disabled),
            readOnly: Boolean(readOnly),
            error: control.error,
            size,
          };
          return (
            <Box
              key={keysRef.current[index]}
              {...itemProps}
              role="listitem"
              aria-label={labelOf(index)}
              data-cn-repeater-item
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: "6px",
                borderRadius: "var(--cn-radius-md, 8px)",
                backgroundColor: "var(--cn-color-surface, #ffffff)",
              }}
            >
              {reorderable && !locked && (
                <Box
                  {...sortable.getHandleProps(index)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    minHeight: 36,
                    color: "var(--cn-color-text-subtle, #9aa1aa)",
                    borderRadius: "6px",
                    "&:focus-visible": {
                      outline: "2px solid var(--cn-color-brand-300, #7c9fdc)",
                    },
                  }}
                >
                  <DragHandleIcon fontSize="small" />
                </Box>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {renderItem ? (
                  renderItem(ctx)
                ) : (
                  <TextField
                    id={itemId}
                    fullWidth
                    size={MUI_FIELD_SIZE[size]}
                    value={item === null || item === undefined ? "" : String(item)}
                    placeholder={placeholder}
                    disabled={disabled}
                    error={control.error && isEmptyValue(item)}
                    onChange={(event) => update(index, event.target.value as T)}
                    slotProps={{
                      htmlInput: {
                        readOnly,
                        name: ctx.name,
                        "aria-label": labelOf(index),
                      },
                    }}
                    sx={getOutlinedFieldSx(size)}
                  />
                )}
              </Box>
              {reorderable && !locked && (
                <>
                  <IconButton
                    size="small"
                    aria-label={`Subir ${labelOf(index)}`}
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                    sx={{ mt: "4px" }}
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Bajar ${labelOf(index)}`}
                    disabled={index === items.length - 1}
                    onClick={() => move(index, index + 1)}
                    sx={{ mt: "4px" }}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </>
              )}
              {!locked && (
                <IconButton
                  size="small"
                  aria-label={`Eliminar ${labelOf(index)}`}
                  disabled={!canRemove}
                  onClick={() => remove(index)}
                  sx={{ mt: "4px", color: "var(--cn-color-error-600, #b52f2f)" }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mt: "8px", minHeight: 24 }}>
        {canAdd && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={add}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {addLabel}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        {showCounter && (
          <Box
            component="span"
            data-cn-repeater-counter
            aria-live="polite"
            sx={{
              fontSize: "var(--cn-font-size-xs, 11px)",
              color: "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            {counterText}
          </Box>
        )}
      </Box>
      <Box
        aria-live="polite"
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
        }}
      >
        {sortable.announcement}
      </Box>
      {control.helperText && (
        <FormHelperText id={control.helperId} sx={helperTextSx}>
          {control.helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

/** Lista editable: agregar, quitar y reordenar elementos (texto o contenido propio). */
export const CnRepeaterField = forwardRef(CnRepeaterFieldInner) as <T = string>(
  props: CnRepeaterFieldProps<T> & { ref?: Ref<HTMLFieldSetElement> },
) => ReactElement | null;

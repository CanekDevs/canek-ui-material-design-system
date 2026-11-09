import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputBase from "@mui/material/InputBase";
import Popover from "@mui/material/Popover";
import TextField from "@mui/material/TextField";
import type { KeyboardEvent, ReactNode } from "react";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { getOutlinedFieldSx, mergeSx, MUI_FIELD_SIZE } from "../../utils/field-styles";
import { normalizeSearchText } from "../../utils/option-filter";
import { OptionContent } from "../../utils/option-media";
import { getVirtualSlots, useVirtualList } from "../../utils/use-virtual-list";
import { shouldVirtualize } from "../../utils/virtual-listbox";
import type { CnFieldOption } from "../CnForm/CnForm.types";
import { CnTreeSelectFieldSkeleton } from "./CnTreeSelectFieldSkeleton";

export type CnTreeOption = CnFieldOption & {
  children?: readonly CnTreeOption[];
};

export type CnTreeSelectValue = string | number | null | Array<string | number>;

export type CnTreeSelectFieldProps = CnFieldBaseProps<CnTreeSelectValue> & {
  options: readonly CnTreeOption[];
  multiple?: boolean;
  placeholder?: string;
  /**
   * Con `multiple`: marcar un padre marca a sus descendientes. Por defecto `true`.
   */
  cascade?: boolean;
  /**
   * Qué valores se guardan con `multiple` + `cascade`:
   * `all` (padres e hijos), `leaves` (solo hojas) o `parents` (el nodo más alto
   * completamente marcado). Por defecto `all`.
   */
  valueMode?: "all" | "leaves" | "parents";
  /** Selección simple: solo se pueden elegir hojas. */
  leavesOnly?: boolean;
  /** Expande todo al abrir. */
  defaultExpandAll?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  /** Muestra la ruta completa del elemento seleccionado (`Ventas / Norte`). */
  showPath?: boolean;
  renderOption?: (option: CnTreeOption) => ReactNode;
  autoFocus?: boolean;
  /** Muestra el skeleton del campo (mismas variantes) en lugar del campo. */
  skeleton?: boolean;
  /**
   * Virtualiza el árbol visible: `true`, `false` o el número de filas a partir
   * del cual se activa. Por defecto con más de 100 filas visibles.
   */
  virtualize?: boolean | number;
};

type FlatNode = {
  option: CnTreeOption;
  key: string;
  depth: number;
  parentKey?: string;
  path: string[];
  descendants: string[];
  /** Texto normalizado para buscar (se calcula una vez). */
  search: string;
};

const keyOf = (value: string | number) => `${typeof value}:${value}`;

const flatten = (options: readonly CnTreeOption[]): Map<string, FlatNode> => {
  const map = new Map<string, FlatNode>();
  const walk = (list: readonly CnTreeOption[], depth: number, parent?: FlatNode): string[] => {
    const keys: string[] = [];
    for (const option of list) {
      const key = keyOf(option.value);
      const node: FlatNode = {
        option,
        key,
        depth,
        parentKey: parent?.key,
        path: [...(parent?.path ?? []), option.label],
        descendants: [],
        search: normalizeSearchText(`${option.label} ${option.searchText ?? ""}`),
      };
      map.set(key, node);
      keys.push(key);
      if (option.children?.length) {
        const childKeys = walk(option.children, depth + 1, node);
        node.descendants = childKeys.flatMap((child) => [
          child,
          ...(map.get(child)?.descendants ?? []),
        ]);
      }
    }
    return keys;
  };
  walk(options, 0);
  return map;
};

/**
 * Selector jerárquico (departamentos, categorías, ubicaciones, centros de
 * costo). Búsqueda que conserva los ancestros, selección simple o múltiple con
 * cascada y estado indeterminado, y navegación por teclado.
 */
export const CnTreeSelectField = forwardRef<HTMLDivElement, CnTreeSelectFieldProps>(
  function CnTreeSelectField(
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
      options,
      multiple = false,
      placeholder,
      cascade = true,
      valueMode = "all",
      leavesOnly = false,
      defaultExpandAll = false,
      searchable = true,
      clearable = true,
      showPath = false,
      renderOption,
      autoFocus,
      skeleton = false,
      virtualize,
    },
    ref,
  ) {
    const [current, setCurrent] = useControllableValue<CnTreeSelectValue>(
      value,
      defaultValue,
      multiple ? [] : null,
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

    const nodes = useMemo(() => flatten(options), [options]);
    const anchorRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const listRef = useRef<HTMLDivElement | null>(null);
    const locked = Boolean(disabled || readOnly);

    const selectedKeys = useMemo(() => {
      if (multiple) return new Set((Array.isArray(current) ? current : []).map(keyOf));
      return current === null || current === undefined || current === "" || Array.isArray(current)
        ? new Set<string>()
        : new Set([keyOf(current)]);
    }, [current, multiple]);

    // En modo `parents`/`leaves` el valor guardado no incluye todos los nodos
    // marcados; se reconstruye el conjunto efectivo para pintar el árbol.
    const effectiveChecked = useMemo(() => {
      if (!multiple || !cascade) return selectedKeys;
      const result = new Set<string>();
      for (const key of selectedKeys) {
        result.add(key);
        nodes.get(key)?.descendants.forEach((child) => result.add(child));
      }
      // Un padre cuyas hojas están todas marcadas también cuenta como marcado.
      for (const node of nodes.values()) {
        if (node.descendants.length && node.descendants.every((child) => result.has(child))) {
          result.add(node.key);
        }
      }
      return result;
    }, [cascade, multiple, nodes, selectedKeys]);

    const emitChecked = (checked: Set<string>) => {
      let keys = [...nodes.values()].filter((node) => checked.has(node.key));
      if (cascade && valueMode === "leaves") {
        keys = keys.filter((node) => node.descendants.length === 0);
      } else if (cascade && valueMode === "parents") {
        keys = keys.filter((node) => !node.parentKey || !checked.has(node.parentKey));
      }
      control.markChanged();
      setCurrent(keys.map((node) => node.option.value));
    };

    const toggleNode = (node: FlatNode) => {
      if (locked || node.option.disabled) return;
      if (!multiple) {
        if (leavesOnly && node.descendants.length) {
          toggleExpanded(node.key);
          return;
        }
        control.markChanged();
        setCurrent(node.option.value);
        setOpen(false);
        return;
      }
      const next = new Set(effectiveChecked);
      const willCheck = !next.has(node.key);
      const affected = cascade ? [node.key, ...node.descendants] : [node.key];
      for (const key of affected) {
        if (nodes.get(key)?.option.disabled && key !== node.key) continue;
        if (willCheck) next.add(key);
        else next.delete(key);
      }
      if (cascade) {
        // Recalcula ancestros.
        let parentKey = node.parentKey;
        while (parentKey) {
          const parent = nodes.get(parentKey);
          if (!parent) break;
          if (parent.descendants.every((child) => next.has(child))) next.add(parent.key);
          else next.delete(parent.key);
          parentKey = parent.parentKey;
        }
      }
      emitChecked(next);
    };

    const toggleExpanded = (key: string) =>
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });

    // Nodos visibles: con búsqueda, los que coinciden y sus ancestros.
    const visibleNodes = useMemo(() => {
      const q = normalizeSearchText(query);
      const all = [...nodes.values()];
      if (q) {
        const keep = new Set<string>();
        for (const node of all) {
          if (!node.search.includes(q)) continue;
          keep.add(node.key);
          let parentKey = node.parentKey;
          while (parentKey) {
            keep.add(parentKey);
            parentKey = nodes.get(parentKey)?.parentKey;
          }
        }
        return all.filter((node) => keep.has(node.key));
      }
      return all.filter((node) => {
        let parentKey = node.parentKey;
        while (parentKey) {
          if (!defaultExpandAll && !expanded.has(parentKey)) return false;
          if (defaultExpandAll && expanded.has(`!${parentKey}`)) return false;
          parentKey = nodes.get(parentKey)?.parentKey;
        }
        return true;
      });
    }, [defaultExpandAll, expanded, nodes, query]);

    const isExpanded = (key: string) =>
      Boolean(query) || (defaultExpandAll ? !expanded.has(`!${key}`) : expanded.has(key));
    const setNodeExpanded = (key: string, next: boolean) => {
      if (defaultExpandAll) {
        setExpanded((prev) => {
          const copy = new Set(prev);
          if (next) copy.delete(`!${key}`);
          else copy.add(`!${key}`);
          return copy;
        });
      } else if (next !== expanded.has(key)) {
        toggleExpanded(key);
      }
    };

    const labelFor = (key: string) => {
      const node = nodes.get(key);
      if (!node) return key.slice(key.indexOf(":") + 1);
      return showPath ? node.path.join(" / ") : node.option.label;
    };

    const displayKeys = [...selectedKeys];
    const summary = multiple ? "" : displayKeys[0] ? labelFor(displayKeys[0]) : "";

    const virtual = useVirtualList({
      count: visibleNodes.length,
      estimateSize: 34,
      getItemKey: (index) => visibleNodes[index]?.key ?? index,
      overscan: 8,
      paddingStart: 4,
      enabled: shouldVirtualize(virtualize, visibleNodes.length),
    });
    const { scrollRef } = virtual;
    const setListRef = useCallback(
      (element: HTMLDivElement | null) => {
        listRef.current = element;
        scrollRef(element);
      },
      [scrollRef],
    );

    // El foco espera a que la fila exista (puede estar fuera de la ventana).
    const pendingFocusRef = useRef<number | null>(null);
    const [focusTick, setFocusTick] = useState(0);
    useEffect(() => {
      const index = pendingFocusRef.current;
      if (index === null) return;
      const row = listRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`);
      if (row) {
        pendingFocusRef.current = null;
        row.focus();
      }
    });
    const focusRow = (index: number) => {
      if (visibleNodes.length === 0) return;
      const target = Math.max(0, Math.min(index, visibleNodes.length - 1));
      pendingFocusRef.current = target;
      virtual.scrollToIndex(target);
      setFocusTick(focusTick + 1);
    };

    const handleRowKey = (event: KeyboardEvent<HTMLElement>, node: FlatNode, index: number) => {
      const hasChildren = node.descendants.length > 0;
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          focusRow(index + 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          if (index === 0) listRef.current?.parentElement?.querySelector("input")?.focus();
          else focusRow(index - 1);
          break;
        case "PageDown":
          event.preventDefault();
          focusRow(index + 10);
          break;
        case "PageUp":
          event.preventDefault();
          focusRow(index - 10);
          break;
        case "Home":
          event.preventDefault();
          focusRow(0);
          break;
        case "End":
          event.preventDefault();
          focusRow(visibleNodes.length - 1);
          break;
        case "ArrowRight":
          event.preventDefault();
          if (hasChildren) setNodeExpanded(node.key, true);
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (hasChildren && isExpanded(node.key)) setNodeExpanded(node.key, false);
          else if (node.parentKey) {
            focusRow(visibleNodes.findIndex((item) => item.key === node.parentKey));
          }
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          toggleNode(node);
          break;
        default:
      }
    };

    const close = () => {
      setOpen(false);
      setQuery("");
      control.markBlurred();
      onBlur?.();
    };

    const hasValue = selectedKeys.size > 0;

    if (skeleton) {
      return (
        <CnTreeSelectFieldSkeleton
          size={size}
          label={Boolean(label)}
          helperText={Boolean(helperText)}
          multiple={multiple}
          selectedCount={multiple && displayKeys.length > 0 ? displayKeys.length : undefined}
          clearable={clearable}
          showPath={showPath}
          sx={sx}
          className={className}
        />
      );
    }

    return (
      <>
        <TextField
          ref={(node: HTMLDivElement | null) => {
            anchorRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          id={control.id}
          name={name}
          label={label}
          required={required}
          disabled={disabled}
          error={control.error}
          helperText={control.helperText}
          placeholder={hasValue ? undefined : placeholder}
          value={summary}
          autoFocus={autoFocus}
          className={className}
          fullWidth
          size={MUI_FIELD_SIZE[size]}
          data-cn-tree-select-field
          onClick={() => !locked && setOpen(true)}
          onKeyDown={(event) => {
            if (locked) return;
            if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOpen(true);
            }
          }}
          slotProps={{
            inputLabel: { shrink: hasValue || Boolean(placeholder) || undefined },
            htmlInput: {
              readOnly: true,
              role: "combobox",
              "aria-haspopup": "tree",
              "aria-expanded": open,
              "aria-invalid": control.error || undefined,
              style: multiple && hasValue ? { width: 0, minWidth: 0, padding: 0 } : undefined,
            },
            input: {
              sx: {
                cursor: locked ? "default" : "pointer",
                ...(multiple && hasValue && { flexWrap: "nowrap", gap: "4px" }),
              },
              startAdornment:
                multiple && hasValue ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px", py: "6px", flex: 1 }}>
                    {displayKeys.slice(0, 4).map((key) => (
                      <Chip
                        key={key}
                        size="small"
                        label={labelFor(key)}
                        onDelete={
                          locked
                            ? undefined
                            : (event) => {
                                event.stopPropagation();
                                const node = nodes.get(key);
                                if (node) toggleNode(node);
                              }
                        }
                        sx={{ height: 22, fontSize: "var(--cn-font-size-xs, 11px)" }}
                      />
                    ))}
                    {displayKeys.length > 4 && (
                      <Chip
                        size="small"
                        label={`+${displayKeys.length - 4}`}
                        sx={{ height: 22, fontSize: "var(--cn-font-size-xs, 11px)" }}
                      />
                    )}
                  </Box>
                ) : undefined,
              endAdornment: (
                <InputAdornment position="end" sx={{ gap: "2px" }}>
                  {clearable && hasValue && !locked && (
                    <IconButton
                      size="small"
                      aria-label="Limpiar"
                      onClick={(event) => {
                        event.stopPropagation();
                        control.markChanged();
                        setCurrent(multiple ? [] : null);
                      }}
                    >
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                  <ArrowDropDownIcon
                    sx={{
                      color: "var(--cn-color-neutral-500, #6e7682)",
                      transform: open ? "rotate(180deg)" : "none",
                    }}
                  />
                </InputAdornment>
              ),
            },
          }}
          sx={mergeSx(getOutlinedFieldSx(size), sx)}
        />
        <Popover
          open={open}
          anchorEl={
            anchorRef.current?.querySelector<HTMLElement>(".MuiInputBase-root") ?? anchorRef.current
          }
          onClose={close}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          slotProps={{
            paper: {
              sx: {
                mt: "4px",
                width: anchorRef.current?.offsetWidth ?? 320,
                minWidth: 260,
                maxHeight: 380,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                borderRadius: "var(--cn-radius-md, 8px)",
              },
            },
          }}
        >
          {searchable && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                px: "10px",
                borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
              }}
            >
              <SearchIcon sx={{ fontSize: 16, color: "var(--cn-color-neutral-400, #9aa1aa)" }} />
              <InputBase
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    focusRow(0);
                  }
                }}
                placeholder="Buscar…"
                inputProps={{ "aria-label": "Buscar" }}
                sx={{ flex: 1, fontSize: "var(--cn-font-size-sm, 12px)", py: "8px" }}
              />
            </Box>
          )}
          <Box
            ref={setListRef}
            role="tree"
            aria-label={label ?? "Opciones"}
            aria-multiselectable={multiple || undefined}
            sx={{ overflowY: "auto", py: "4px", flex: 1, minHeight: 0 }}
          >
            {visibleNodes.length === 0 && (
              <Box
                sx={{
                  p: "14px",
                  textAlign: "center",
                  fontSize: "var(--cn-font-size-sm, 12px)",
                  color: "var(--cn-color-text-muted, #6e7682)",
                }}
              >
                Sin resultados
              </Box>
            )}
            {getVirtualSlots(virtual.items, virtual.totalSize).map((slot) => {
              if (slot.type === "spacer") {
                return <Box key={slot.key} aria-hidden sx={{ height: `${slot.size}px` }} />;
              }
              const index = slot.item.index;
              const node = visibleNodes[index];
              const hasChildren = node.descendants.length > 0;
              const isChecked = effectiveChecked.has(node.key);
              const partial =
                multiple &&
                cascade &&
                !isChecked &&
                node.descendants.some((child) => effectiveChecked.has(child));
              const selectable = !(leavesOnly && hasChildren && !multiple);
              return (
                <Box
                  key={node.key}
                  role="treeitem"
                  aria-level={node.depth + 1}
                  aria-expanded={hasChildren ? isExpanded(node.key) : undefined}
                  aria-selected={isChecked}
                  aria-disabled={node.option.disabled || undefined}
                  tabIndex={-1}
                  data-index={index}
                  ref={virtual.measureElement}
                  autoFocus={!searchable && index === 0}
                  onClick={() => toggleNode(node)}
                  onKeyDown={(event) => handleRowKey(event, node, index)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                    pl: `${6 + node.depth * 18}px`,
                    pr: "10px",
                    minHeight: 34,
                    cursor: node.option.disabled ? "not-allowed" : "pointer",
                    opacity: node.option.disabled ? 0.5 : 1,
                    fontSize: "var(--cn-font-size-base, 13px)",
                    fontWeight: !multiple && isChecked ? 600 : 400,
                    backgroundColor:
                      !multiple && isChecked ? "var(--cn-color-brand-50, #eef3fb)" : undefined,
                    outline: "none",
                    "&:hover, &:focus-visible": {
                      backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
                    },
                  }}
                >
                  <IconButton
                    size="small"
                    tabIndex={-1}
                    aria-label={isExpanded(node.key) ? "Contraer" : "Expandir"}
                    onClick={(event) => {
                      event.stopPropagation();
                      setNodeExpanded(node.key, !isExpanded(node.key));
                    }}
                    sx={{ p: "2px", visibility: hasChildren ? "visible" : "hidden" }}
                  >
                    <ChevronRightIcon
                      sx={{
                        fontSize: 18,
                        transform: isExpanded(node.key) ? "rotate(90deg)" : "none",
                        transition: "transform 120ms ease",
                      }}
                    />
                  </IconButton>
                  {multiple && (
                    <Checkbox
                      size="small"
                      tabIndex={-1}
                      checked={isChecked}
                      indeterminate={partial}
                      disabled={node.option.disabled}
                      sx={{ p: "4px" }}
                      slotProps={{ input: { "aria-hidden": true } }}
                    />
                  )}
                  <Box
                    sx={{
                      minWidth: 0,
                      flex: 1,
                      color: selectable ? undefined : "var(--cn-color-text-muted, #6e7682)",
                    }}
                  >
                    {renderOption ? (
                      renderOption(node.option)
                    ) : (
                      <OptionContent option={node.option} />
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Popover>
      </>
    );
  },
);

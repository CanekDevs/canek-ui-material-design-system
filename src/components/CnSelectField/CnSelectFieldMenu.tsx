import CheckIcon from "@mui/icons-material/Check";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import InputBase from "@mui/material/InputBase";
import Popover from "@mui/material/Popover";
import type { KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OptionContent } from "../../utils/option-media";
import { getVirtualSlots, useVirtualList } from "../../utils/use-virtual-list";
import type { CnFieldOption } from "../CnForm/CnForm.types";

type MenuRow =
  | { kind: "group"; key: string; label: string }
  | { kind: "all"; key: string }
  | { kind: "option"; key: string; option: CnFieldOption; ordinal: number };

export type CnSelectFieldMenuProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  /** Prefijo de ids (listbox y opciones). */
  id: string;
  label?: string;
  options: readonly CnFieldOption[];
  getKey: (option: CnFieldOption) => string;
  multiple: boolean;
  isSelected: (option: CnFieldOption) => boolean;
  /** Simple: selecciona (el padre cierra). Múltiple: alterna. */
  onPick: (option: CnFieldOption) => void;
  selectAll?: { label: string; checked: boolean; indeterminate: boolean; onToggle: () => void };
  searchable: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  renderOption?: (option: CnFieldOption) => ReactNode;
  /** Primera página / búsqueda en curso. */
  loading: boolean;
  /** Mensaje cuando no hay opciones. */
  emptyText: string;
  /** Pie de la lista (cargando más, reintentar, conteo…). */
  footer?: ReactNode;
  onEndReached?: () => void;
  /** Total real (servidor) para `aria-setsize`. */
  setSize?: number;
  virtualize: boolean;
  width?: number;
};

const ROW_GROUP = 28;
const ROW_OPTION = 36;
const ROW_TALL = 52;

/**
 * Menú del select para listas grandes: buscador, lista virtualizada con
 * `aria-activedescendant`, teclado (flechas, Re/Av Pág, Inicio/Fin, Enter,
 * Escape, búsqueda por tecleo sin buscador), grupos, medios de opción,
 * marcas de selección y "Seleccionar todo".
 */
export const CnSelectFieldMenu = ({
  open,
  anchorEl,
  onClose,
  id,
  label,
  options,
  getKey,
  multiple,
  isSelected,
  onPick,
  selectAll,
  searchable,
  query,
  onQueryChange,
  renderOption,
  loading,
  emptyText,
  footer,
  onEndReached,
  setSize,
  virtualize,
  width,
}: CnSelectFieldMenuProps) => {
  const listId = `${id}-listbox`;
  const rows = useMemo(() => {
    const list: MenuRow[] = [];
    if (selectAll && options.length > 0) list.push({ kind: "all", key: "__all" });
    let lastGroup: string | undefined;
    let ordinal = 0;
    for (const option of options) {
      if (option.group && option.group !== lastGroup) {
        list.push({ kind: "group", key: `group-${option.group}`, label: option.group });
        lastGroup = option.group;
      }
      ordinal += 1;
      list.push({ kind: "option", key: getKey(option), option, ordinal });
    }
    return list;
    // `getKey` es estable en la práctica (depende del tipo de valor).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, Boolean(selectAll)]);

  const optionTotal = Math.max(setSize ?? 0, options.length);
  const isPickable = (row: MenuRow | undefined) =>
    Boolean(row) && (row?.kind === "all" || (row?.kind === "option" && !row.option.disabled));

  const [active, setActive] = useState(-1);
  const pendingScrollRef = useRef<number | null>(null);

  const virtual = useVirtualList({
    count: rows.length,
    estimateSize: (index) => {
      const row = rows[index];
      if (row?.kind === "group") return ROW_GROUP;
      if (row?.kind === "option" && row.option.description) return ROW_TALL;
      return ROW_OPTION;
    },
    getItemKey: (index) => rows[index]?.key ?? index,
    overscan: 8,
    onEndReached,
    paddingStart: 4,
    enabled: virtualize,
  });

  // Sin buscador, el foco va al listbox (que lleva `aria-activedescendant`).
  const { scrollRef } = virtual;
  const setListRef = useCallback(
    (element: HTMLElement | null) => {
      scrollRef(element);
      if (element && !searchable) element.focus();
    },
    [scrollRef, searchable],
  );

  const firstPickable = (from: number, step: 1 | -1): number => {
    for (let index = from; index >= 0 && index < rows.length; index += step) {
      if (isPickable(rows[index])) return index;
    }
    return -1;
  };

  const activate = (index: number, align: "auto" | "center" = "auto") => {
    if (index < 0) return;
    setActive(index);
    virtual.scrollToIndex(index, { align });
  };

  // Al abrir: la opción seleccionada (simple) o la primera.
  useEffect(() => {
    if (!open) {
      setActive(-1);
      return;
    }
    const selectedIndex = multiple
      ? -1
      : rows.findIndex((row) => row.kind === "option" && isSelected(row.option));
    const start = selectedIndex >= 0 ? selectedIndex : firstPickable(0, 1);
    setActive(start);
    pendingScrollRef.current = start;
    // Solo al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Al cambiar el filtro, la primera coincidencia.
  const lastQueryRef = useRef(query);
  useEffect(() => {
    if (lastQueryRef.current === query) return;
    lastQueryRef.current = query;
    activate(firstPickable(0, 1), "auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // El scroll inicial espera a que el contenedor exista (Popover monta en el portal).
  useEffect(() => {
    if (pendingScrollRef.current === null) return;
    const index = pendingScrollRef.current;
    pendingScrollRef.current = null;
    if (index > 0) virtual.scrollToIndex(index, { align: "center" });
  });

  const move = (delta: number) => {
    if (rows.length === 0) return;
    const from = active < 0 ? (delta > 0 ? -1 : rows.length) : active;
    const target = Math.max(0, Math.min(rows.length - 1, from + delta));
    const step: 1 | -1 = delta > 0 ? 1 : -1;
    let next = firstPickable(target, step);
    if (next < 0) next = firstPickable(target, step === 1 ? -1 : 1);
    if (next >= 0) activate(next);
  };

  const pickRow = (index: number) => {
    const row = rows[index];
    if (!row) return;
    if (row.kind === "all") selectAll?.onToggle();
    else if (row.kind === "option" && !row.option.disabled) onPick(row.option);
  };

  const typeAheadRef = useRef({ text: "", time: 0 });
  const typeAhead = (char: string) => {
    const now = Date.now();
    const state = typeAheadRef.current;
    state.text = now - state.time > 700 ? char : state.text + char;
    state.time = now;
    const needle = state.text.toLocaleLowerCase();
    const begin = active < 0 ? 0 : active + (state.text.length === 1 ? 1 : 0);
    for (let offset = 0; offset < rows.length; offset += 1) {
      const index = (begin + offset) % rows.length;
      const row = rows[index];
      if (row.kind === "option" && !row.option.disabled) {
        if (row.option.label.toLocaleLowerCase().startsWith(needle)) {
          activate(index);
          return;
        }
      }
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        move(1);
        return;
      case "ArrowUp":
        event.preventDefault();
        move(-1);
        return;
      case "PageDown":
        event.preventDefault();
        move(10);
        return;
      case "PageUp":
        event.preventDefault();
        move(-10);
        return;
      case "Home":
      case "End":
        if (searchable && !event.ctrlKey) return;
        event.preventDefault();
        if (event.key === "Home") activate(firstPickable(0, 1));
        else activate(firstPickable(rows.length - 1, -1));
        return;
      case "Enter":
        event.preventDefault();
        pickRow(active);
        return;
      case " ":
        if (searchable) return;
        event.preventDefault();
        pickRow(active);
        return;
      case "Tab":
        onClose();
        return;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      default:
        if (!searchable && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          typeAhead(event.key);
        }
    }
  };

  const optionId = (index: number) => `${id}-option-${index}`;
  const activeId = active >= 0 && isPickable(rows[active]) ? optionId(active) : undefined;

  const renderRow = (row: MenuRow, index: number) => {
    if (row.kind === "group") {
      return (
        <Box
          key={row.key}
          role="presentation"
          data-index={index}
          ref={virtual.measureElement}
          sx={{
            px: "12px",
            lineHeight: `${ROW_GROUP}px`,
            fontSize: "var(--cn-font-size-xs, 11px)",
            fontWeight: 600,
            color: "var(--cn-color-text-muted, #6e7682)",
          }}
        >
          {row.label}
        </Box>
      );
    }
    const isActive = index === active;
    if (row.kind === "all") {
      return (
        <Box
          key={row.key}
          id={optionId(index)}
          role="option"
          aria-selected={selectAll?.checked ?? false}
          data-index={index}
          data-cn-select-all
          ref={virtual.measureElement}
          onMouseDown={(event) => event.preventDefault()}
          onMouseMove={() => active !== index && setActive(index)}
          onClick={() => pickRow(index)}
          sx={{
            ...rowSx(isActive, false, false),
            fontWeight: 600,
            borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
          }}
        >
          <Checkbox
            size="small"
            tabIndex={-1}
            checked={selectAll?.checked ?? false}
            indeterminate={selectAll?.indeterminate ?? false}
            sx={{ p: "2px", mr: "6px" }}
            slotProps={{ input: { "aria-hidden": true } }}
          />
          {selectAll?.label}
        </Box>
      );
    }
    const selected = isSelected(row.option);
    const disabled = Boolean(row.option.disabled);
    return (
      <Box
        key={row.key}
        id={optionId(index)}
        role="option"
        aria-selected={selected}
        aria-disabled={disabled || undefined}
        aria-setsize={optionTotal}
        aria-posinset={row.ordinal}
        data-index={index}
        ref={virtual.measureElement}
        onMouseDown={(event) => event.preventDefault()}
        onMouseMove={() => !disabled && active !== index && setActive(index)}
        onClick={() => pickRow(index)}
        sx={rowSx(isActive, selected && !multiple, disabled)}
      >
        {renderOption ? (
          <Box sx={{ flex: 1, minWidth: 0 }}>{renderOption(row.option)}</Box>
        ) : (
          <OptionContent
            option={row.option}
            extra={
              multiple ? (
                <CheckIcon
                  aria-hidden
                  sx={{
                    fontSize: 18,
                    color: "var(--cn-color-brand-600, #254d87)",
                    visibility: selected ? "visible" : "hidden",
                  }}
                />
              ) : undefined
            }
          />
        )}
      </Box>
    );
  };

  const showEmpty = rows.length === 0 || (rows.length === 1 && rows[0].kind === "all");

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: {
          onKeyDown,
          "data-cn-select-menu": true,
          sx: {
            mt: "4px",
            width: width ?? anchorEl?.offsetWidth ?? 320,
            minWidth: 220,
            maxHeight: 400,
            display: "flex",
            flexDirection: "column",
            // El scroll vive en el listbox (virtualizado), no en el papel.
            overflow: "hidden",
            borderRadius: "var(--cn-radius-md, 8px)",
          },
        } as Record<string, unknown>,
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
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar…"
            inputProps={{
              "aria-label": "Buscar",
              role: "combobox",
              "aria-expanded": true,
              "aria-controls": listId,
              "aria-autocomplete": "list",
              "aria-activedescendant": activeId,
              autoComplete: "off",
            }}
            sx={{ flex: 1, fontSize: "var(--cn-font-size-sm, 12px)", py: "8px" }}
          />
        </Box>
      )}
      <Box
        ref={setListRef}
        id={listId}
        role="listbox"
        aria-label={label ?? "Opciones"}
        aria-multiselectable={multiple || undefined}
        aria-activedescendant={searchable ? undefined : activeId}
        aria-busy={loading || undefined}
        tabIndex={searchable ? -1 : 0}
        sx={{
          overflowY: "auto",
          maxHeight: 320,
          flex: "1 1 auto",
          minHeight: 0,
          py: "4px",
          outline: "none",
          position: "relative",
        }}
      >
        {showEmpty ? (
          <Box
            role="presentation"
            sx={{
              px: "14px",
              py: "12px",
              fontSize: "var(--cn-font-size-sm, 12px)",
              color: "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            {loading ? "Cargando…" : emptyText}
          </Box>
        ) : (
          getVirtualSlots(virtual.items, virtual.totalSize).map((slot) =>
            slot.type === "spacer" ? (
              <Box key={slot.key} aria-hidden role="presentation" sx={{ height: slot.size }} />
            ) : (
              renderRow(rows[slot.item.index], slot.item.index)
            ),
          )
        )}
        {!showEmpty && footer}
      </Box>
    </Popover>
  );
};

const rowSx = (active: boolean, selected: boolean, disabled: boolean) => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  px: "12px",
  py: "6px",
  minHeight: ROW_OPTION,
  boxSizing: "border-box" as const,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
  fontSize: "var(--cn-font-size-base, 13px)",
  fontWeight: selected ? 600 : 400,
  backgroundColor: active
    ? "var(--cn-color-neutral-100, #f4f5f7)"
    : selected
      ? "var(--cn-color-brand-50, #eef3fb)"
      : undefined,
});

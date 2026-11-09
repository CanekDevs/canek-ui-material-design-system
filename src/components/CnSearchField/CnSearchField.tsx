import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import TextField from "@mui/material/TextField";
import type { KeyboardEvent, ReactNode } from "react";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { getOutlinedFieldSx, mergeSx, MUI_FIELD_SIZE } from "../../utils/field-styles";
import { getVirtualSlots, useVirtualList } from "../../utils/use-virtual-list";
import { CnListStatus, shouldVirtualize } from "../../utils/virtual-listbox";
import { CnSearchFieldSkeleton } from "./CnSearchFieldSkeleton";

export type CnSearchSuggestion = {
  value: string;
  /** Texto visible; por defecto `value`. */
  label?: string;
  description?: string;
};

type SuggestionInput = string | CnSearchSuggestion;

export type CnSearchFieldProps = CnFieldBaseProps<string> & {
  placeholder?: string;
  autoFocus?: boolean;
  /** Sugerencias fijas; se filtran por lo escrito (sin distinguir acentos). */
  suggestions?: readonly SuggestionInput[];
  /** Sugerencias remotas. Se cancela la petición anterior al seguir escribiendo. */
  onSearch?: (
    query: string,
    ctx: { signal: AbortSignal },
  ) => Promise<readonly SuggestionInput[]> | readonly SuggestionInput[];
  /** Espera tras teclear antes de llamar a `onSearch` (ms). Por defecto 300. */
  searchDelay?: number;
  /** Caracteres mínimos para sugerir. Por defecto 1. */
  minChars?: number;
  /** Máximo de sugerencias visibles. Por defecto 8. */
  maxSuggestions?: number;
  /** Recuerda (en memoria) las búsquedas enviadas y las ofrece con el campo vacío. */
  recentSearches?: boolean;
  /** Máximo de búsquedas recientes. Por defecto 5. */
  maxRecent?: number;
  /** Clave para compartir las búsquedas recientes entre instancias. */
  recentKey?: string;
  /** Se elige una sugerencia (clic o Enter). */
  onSelect?: (suggestion: CnSearchSuggestion) => void;
  /** Enter sin sugerencia activa. */
  onSubmit?: (query: string) => void;
  /** Botón para limpiar. Por defecto `true`. */
  clearable?: boolean;
  /** Indicador de carga externo (además del automático de `onSearch`). */
  loading?: boolean;
  noResultsText?: string;
  /** Muestra el skeleton del campo (mismas variantes) en lugar del campo. */
  skeleton?: boolean;
  /**
   * Virtualiza las sugerencias: `true`, `false` o el número a partir del cual
   * se activa (por defecto más de 100, útil con `maxSuggestions` alto).
   */
  virtualize?: boolean | number;
};

const recentStore = new Map<string, string[]>();

/** Borra las búsquedas recientes guardadas en memoria (todas o de una clave). */
export const clearRecentSearches = (key?: string) => {
  if (key) recentStore.delete(key);
  else recentStore.clear();
};

const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const toSuggestion = (item: SuggestionInput): CnSearchSuggestion =>
  typeof item === "string" ? { value: item } : item;

/** Filtra sugerencias fijas por coincidencia sin acentos. */
export const filterSuggestions = (
  items: readonly SuggestionInput[],
  query: string,
  limit = 8,
): CnSearchSuggestion[] => {
  const needle = normalize(query.trim());
  return items
    .map(toSuggestion)
    .filter((item) => !needle || normalize(item.label ?? item.value).includes(needle))
    .slice(0, limit);
};

type IndexedSuggestion = { item: CnSearchSuggestion; text: string };

/** Filtra sobre texto ya normalizado y cuenta las coincidencias que no caben. */
const filterIndexed = (
  index: readonly IndexedSuggestion[],
  query: string,
  limit: number,
): { items: CnSearchSuggestion[]; truncated: number } => {
  const needle = normalize(query.trim());
  const items: CnSearchSuggestion[] = [];
  let total = 0;
  for (const entry of index) {
    if (needle && !entry.text.includes(needle)) continue;
    total += 1;
    if (items.length < limit) items.push(entry.item);
  }
  return { items, truncated: total - items.length };
};

const highlight = (text: string, query: string): ReactNode => {
  const needle = normalize(query.trim());
  if (!needle) return text;
  const index = normalize(text).indexOf(needle);
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <Box component="mark" sx={{ background: "none", color: "inherit", fontWeight: 700 }}>
        {text.slice(index, index + needle.length)}
      </Box>
      {text.slice(index + needle.length)}
    </>
  );
};

/** Búsqueda con sugerencias (fijas o remotas), recientes y navegación con teclado. */
export const CnSearchField = forwardRef<HTMLDivElement, CnSearchFieldProps>(function CnSearchField(
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
    placeholder = "Buscar…",
    autoFocus,
    suggestions,
    onSearch,
    searchDelay = 300,
    minChars = 1,
    maxSuggestions = 8,
    recentSearches = false,
    maxRecent = 5,
    recentKey,
    onSelect,
    onSubmit,
    clearable = true,
    loading: loadingProp = false,
    noResultsText = "Sin resultados",
    skeleton = false,
    virtualize,
  },
  ref,
) {
  const [current, setCurrent] = useControllableValue<string>(value, defaultValue, "", onChange);
  const query = current ?? "";
  const control = useFieldControl(query, {
    id,
    rules,
    formValues,
    sectionContext,
    validateOnChange,
    validateOnBlur,
    debounceMs,
    internalValidation,
    error,
    helperText,
    reserveHelperSpace,
  });
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [remote, setRemote] = useState<CnSearchSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const storeKey = recentKey ?? control.id;
  const [recent, setRecent] = useState<string[]>(() => recentStore.get(storeKey) ?? []);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  const hasRemote = Boolean(onSearch);
  const locked = Boolean(disabled || readOnly);
  const trimmed = query.trim();
  const enoughChars = trimmed.length >= minChars;

  // Búsqueda remota con espera y cancelación.
  useEffect(() => {
    if (!hasRemote || !open || !enoughChars) {
      setSearching(false);
      setRemote([]);
      return undefined;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(() => {
      Promise.resolve(onSearchRef.current?.(trimmed, { signal: controller.signal }) ?? [])
        .then((items) => {
          if (controller.signal.aborted) return;
          setRemote(items.map(toSuggestion).slice(0, maxSuggestions));
          setSearching(false);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setRemote([]);
          setSearching(false);
        });
    }, searchDelay);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [hasRemote, open, enoughChars, trimmed, searchDelay, maxSuggestions]);

  // Texto normalizado de las sugerencias fijas, calculado una vez por lista.
  const indexed = useMemo<IndexedSuggestion[]>(
    () =>
      (suggestions ?? []).map((input) => {
        const item = toSuggestion(input);
        return { item, text: normalize(item.label ?? item.value) };
      }),
    [suggestions],
  );
  const showRecent = recentSearches && !trimmed && recent.length > 0;
  const { items, truncated } = useMemo((): {
    items: CnSearchSuggestion[];
    truncated: number;
  } => {
    if (showRecent) return { items: recent.map((text) => ({ value: text })), truncated: 0 };
    if (!enoughChars) return { items: [], truncated: 0 };
    if (hasRemote) return { items: remote, truncated: 0 };
    return suggestions
      ? filterIndexed(indexed, trimmed, maxSuggestions)
      : { items: [], truncated: 0 };
  }, [
    showRecent,
    recent,
    enoughChars,
    hasRemote,
    remote,
    suggestions,
    indexed,
    trimmed,
    maxSuggestions,
  ]);

  const virtual = useVirtualList({
    count: items.length,
    estimateSize: 34,
    getItemKey: (index) => `${items[index]?.value}-${index}`,
    overscan: 6,
    paddingStart: showRecent ? 36 : 4,
    enabled: shouldVirtualize(virtualize, items.length),
  });
  const { scrollToIndex } = virtual;
  useEffect(() => {
    if (active >= 0) scrollToIndex(active);
  }, [active, scrollToIndex]);

  const loading = loadingProp || searching;
  const canSuggest = Boolean(suggestions || hasRemote || recentSearches);
  const listOpen =
    open &&
    !locked &&
    canSuggest &&
    (items.length > 0 || (enoughChars && (loading || hasRemote || Boolean(suggestions))));
  const listId = `${control.id}-listbox`;

  if (skeleton) {
    return (
      <CnSearchFieldSkeleton
        size={size}
        label={Boolean(label)}
        helperText={Boolean(control.helperText?.trim())}
        sx={sx}
        className={className}
      />
    );
  }

  const remember = (text: string) => {
    if (!recentSearches || !text.trim()) return;
    const next = [text.trim(), ...recent.filter((r) => r !== text.trim())].slice(0, maxRecent);
    recentStore.set(storeKey, next);
    setRecent(next);
  };

  const change = (next: string) => {
    control.markChanged();
    setCurrent(next);
    setActive(-1);
    setOpen(true);
  };

  const choose = (item: CnSearchSuggestion) => {
    control.markChanged();
    setCurrent(item.value);
    remember(item.value);
    setOpen(false);
    setActive(-1);
    onSelect?.(item);
  };

  const clear = () => {
    change("");
    anchorRef.current?.querySelector("input")?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (locked) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (items.length === 0) return;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      // Recorre -1 (sin selección) … n-1 de forma circular.
      const slots = items.length + 1;
      setActive((prev) => ((prev + 1 + delta + slots) % slots) - 1);
      return;
    }
    if (event.key === "Enter") {
      if (listOpen && active >= 0 && items[active]) {
        event.preventDefault();
        choose(items[active]);
      } else if (onSubmit || recentSearches) {
        event.preventDefault();
        remember(query);
        setOpen(false);
        onSubmit?.(query.trim());
      }
      return;
    }
    if (event.key === "Escape") {
      if (listOpen) {
        event.preventDefault();
        setOpen(false);
        setActive(-1);
      } else if (query && clearable) {
        event.preventDefault();
        change("");
        setOpen(false);
      }
    }
  };

  const activeId = listOpen && active >= 0 ? `${control.id}-option-${active}` : undefined;

  return (
    <Box ref={ref} className={className} data-cn-search-field sx={mergeSx({ minWidth: 0 }, sx)}>
      <TextField
        ref={anchorRef}
        id={control.id}
        name={name}
        type="search"
        fullWidth
        label={label}
        placeholder={placeholder}
        value={query}
        required={required}
        disabled={disabled}
        error={control.error}
        helperText={control.helperText}
        autoFocus={autoFocus}
        size={MUI_FIELD_SIZE[size]}
        onChange={(event) => change(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setActive(-1);
          control.markBlurred();
          onBlur?.();
        }}
        onKeyDown={onKeyDown}
        slotProps={{
          formHelperText: { id: control.helperId },
          htmlInput: {
            readOnly,
            role: "combobox",
            autoComplete: "off",
            "aria-autocomplete": canSuggest ? "list" : undefined,
            "aria-expanded": canSuggest ? listOpen : undefined,
            "aria-controls": listOpen ? listId : undefined,
            "aria-activedescendant": activeId,
            "aria-describedby": control.helperText?.trim() ? control.helperId : undefined,
          },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  fontSize="small"
                  sx={{ color: "var(--cn-color-text-muted, #6e7682)" }}
                />
              </InputAdornment>
            ),
            endAdornment:
              loading || (clearable && query && !locked) ? (
                <InputAdornment position="end">
                  {loading && (
                    <CircularProgress size={16} aria-label="Buscando" sx={{ mr: "4px" }} />
                  )}
                  {clearable && query && !locked && (
                    <IconButton
                      size="small"
                      aria-label="Limpiar búsqueda"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={clear}
                      edge="end"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </InputAdornment>
              ) : undefined,
          },
        }}
        sx={mergeSx(getOutlinedFieldSx(size), {
          // Oculta la "x" nativa de los input type=search.
          "& input::-webkit-search-cancel-button": { display: "none" },
        })}
      />
      <Popper
        open={listOpen}
        anchorEl={anchorRef.current?.querySelector(".MuiOutlinedInput-root") ?? anchorRef.current}
        placement="bottom-start"
        style={{ zIndex: 1400, width: anchorRef.current?.offsetWidth || undefined }}
      >
        <Paper
          ref={virtual.scrollRef}
          elevation={6}
          sx={{
            mt: "4px",
            borderRadius: "var(--cn-radius-md, 8px)",
            overflow: "hidden",
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {showRecent && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: "12px",
                pt: "8px",
                pb: "4px",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                color: "var(--cn-color-text-muted, #6e7682)",
              }}
            >
              Búsquedas recientes
              <ButtonBase
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  recentStore.delete(storeKey);
                  setRecent([]);
                }}
                sx={{ fontSize: 11, color: "var(--cn-color-brand-600, #254d87)", fontWeight: 600 }}
              >
                Borrar
              </ButtonBase>
            </Box>
          )}
          <Box
            component="ul"
            role="listbox"
            id={listId}
            aria-label={showRecent ? "Búsquedas recientes" : "Sugerencias"}
            sx={{ listStyle: "none", m: 0, p: "4px 0" }}
          >
            {getVirtualSlots(virtual.items, virtual.totalSize).map((slot) => {
              if (slot.type === "spacer") {
                return (
                  <Box
                    component="li"
                    key={slot.key}
                    role="presentation"
                    aria-hidden
                    sx={{ height: `${slot.size}px` }}
                  />
                );
              }
              const index = slot.item.index;
              const item = items[index];
              return (
                <Box
                  component="li"
                  key={`${item.value}-${index}`}
                  id={`${control.id}-option-${index}`}
                  role="option"
                  aria-selected={index === active}
                  aria-setsize={items.length}
                  aria-posinset={index + 1}
                  data-index={index}
                  ref={virtual.measureElement}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(item)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    px: "12px",
                    py: "7px",
                    cursor: "pointer",
                    fontSize: 13,
                    backgroundColor:
                      index === active ? "var(--cn-color-neutral-100, #f4f5f7)" : "transparent",
                  }}
                >
                  {showRecent && (
                    <HistoryIcon
                      fontSize="small"
                      sx={{ color: "var(--cn-color-text-subtle, #9aa1aa)" }}
                    />
                  )}
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      {highlight(item.label ?? item.value, showRecent ? "" : trimmed)}
                    </Box>
                    {item.description && (
                      <Box sx={{ fontSize: 11, color: "var(--cn-color-text-muted, #6e7682)" }}>
                        {item.description}
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
            {items.length === 0 && (
              <Box
                component="li"
                role="presentation"
                sx={{
                  px: "12px",
                  py: "8px",
                  fontSize: 12,
                  color: "var(--cn-color-text-muted, #6e7682)",
                }}
              >
                {loading ? "Buscando…" : noResultsText}
              </Box>
            )}
            <CnListStatus truncated={truncated} />
          </Box>
        </Paper>
      </Popper>
    </Box>
  );
});

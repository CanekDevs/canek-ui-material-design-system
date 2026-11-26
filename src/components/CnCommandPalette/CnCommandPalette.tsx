import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import InputBase from "@mui/material/InputBase";
import type { SxProps, Theme } from "@mui/material/styles";
import type { KeyboardEvent } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { matchesHotkey } from "../../utils/hotkeys";
import { CnIcon } from "../CnIcon";
import { CnCommandPaletteSkeleton } from "./CnCommandPaletteSkeleton";
import type { CnCommand } from "./command-utils";
import { filterCommands, groupCommands } from "./command-utils";
import { KbdKeys } from "./kbd";

export type CnCommandPaletteProps = {
  open: boolean;
  /** Pide abrir (atajo global) o cerrar (Escape, clic fuera, al elegir). */
  onOpenChange: (open: boolean) => void;
  commands: CnCommand[];
  /** Se llama al elegir un comando (además de su propio `onSelect`). */
  onSelect?: (command: CnCommand) => void;
  /** Ids recientes: con la búsqueda vacía aparecen primero, en el grupo «Recientes». */
  recent?: string[];
  /** Atajo global para abrirla (`"mod+k"` = Ctrl+K o ⌘K). `false` lo desactiva. */
  hotkey?: string | false;
  placeholder?: string;
  /** Texto cuando nada coincide. */
  emptyText?: string;
  /** Resultados remotos en camino: muestra un indicador y `aria-busy`. */
  loading?: boolean;
  /** Búsqueda controlada (para buscar en el servidor). */
  query?: string;
  onQueryChange?: (query: string) => void;
  /** Máximo de resultados al buscar. */
  maxResults?: number;
  /** Nombre accesible del diálogo. */
  ariaLabel?: string;
  /** Pinta el diálogo dentro de su contenedor en lugar de un portal (incrustarla en una vista). */
  disablePortal?: boolean;
  /** Muestra el skeleton de la lista (p. ej. mientras llegan los comandos). */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};

const RECENT_GROUP = "Recientes";

/** Paleta de comandos: un diálogo con búsqueda para ir a páginas, registros y acciones solo con el teclado. */
export function CnCommandPalette({
  open,
  onOpenChange,
  commands,
  onSelect,
  recent,
  hotkey = "mod+k",
  placeholder = "Busca páginas, registros o acciones…",
  emptyText = "Sin resultados. Prueba con otras palabras.",
  loading = false,
  query: queryProp,
  onQueryChange,
  maxResults = 50,
  ariaLabel = "Paleta de comandos",
  disablePortal = false,
  skeleton = false,
  sx,
  className,
}: CnCommandPaletteProps) {
  const uid = useId();
  const listId = `${uid}-list`;
  const [innerQuery, setInnerQuery] = useState("");
  const query = queryProp ?? innerQuery;
  const setQuery = (next: string) => {
    if (queryProp === undefined) setInnerQuery(next);
    onQueryChange?.(next);
  };
  const [activeId, setActiveId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // atajo global
  useEffect(() => {
    if (!hotkey) return undefined;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (matchesHotkey(event, hotkey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey, open, onOpenChange]);

  // al cerrar se limpia la búsqueda local
  useEffect(() => {
    if (!open && queryProp === undefined) setInnerQuery("");
  }, [open, queryProp]);

  const groups = useMemo(() => {
    const results = filterCommands(commands, query, query.trim() ? maxResults : Infinity);
    if (query.trim() || !recent?.length) return groupCommands(results);
    const byId = new Map(commands.map((c) => [c.id, c]));
    const recents = recent
      .map((id) => byId.get(id))
      .filter((c): c is CnCommand => Boolean(c))
      .map((c) => ({ ...c, group: RECENT_GROUP }));
    const recentIds = new Set(recents.map((c) => c.id));
    return groupCommands([...recents, ...results.filter((c) => !recentIds.has(c.id))]);
  }, [commands, query, recent, maxResults]);

  const flat = useMemo(() => groups.flatMap((g) => g.commands), [groups]);
  const enabled = useMemo(() => flat.filter((c) => !c.disabled), [flat]);
  const optionId = (command: CnCommand, group: string) =>
    `${uid}-opt-${group === RECENT_GROUP ? "r-" : ""}${command.id}`;
  const keyOf = (command: CnCommand) =>
    `${command.group === RECENT_GROUP ? "r:" : ""}${command.id}`;

  // el primer comando habilitado queda activo cuando cambian los resultados
  const firstKey = enabled[0] ? keyOf(enabled[0]) : null;
  const activeStillThere = activeId !== null && enabled.some((c) => keyOf(c) === activeId);
  useEffect(() => {
    if (!activeStillThere) setActiveId(firstKey);
  }, [activeStillThere, firstKey]);
  useEffect(() => {
    setActiveId(firstKey);
    // solo al cambiar la búsqueda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const active = enabled.find((c) => keyOf(c) === activeId) ?? null;
  const activeDomId = active ? optionId(active, active.group ?? "") : undefined;

  useEffect(() => {
    if (!activeDomId) return;
    const el = listRef.current?.querySelector(`#${CSS.escape(activeDomId)}`);
    if (el && "scrollIntoView" in el) (el as HTMLElement).scrollIntoView({ block: "nearest" });
  }, [activeDomId]);

  const choose = (command: CnCommand) => {
    if (command.disabled) return;
    command.onSelect?.();
    onSelect?.(command);
    onOpenChange(false);
    if (!command.onSelect && !onSelect && command.href && typeof window !== "undefined")
      window.location.assign(command.href);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!enabled.length) return;
    const index = enabled.findIndex((c) => keyOf(c) === activeId);
    const move = (i: number) => setActiveId(keyOf(enabled[(i + enabled.length) % enabled.length]));
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(index - 1);
    } else if (event.key === "PageDown" || (event.key === "End" && event.ctrlKey)) {
      event.preventDefault();
      move(enabled.length - 1);
    } else if (event.key === "PageUp" || (event.key === "Home" && event.ctrlKey)) {
      event.preventDefault();
      move(0);
    } else if (event.key === "Enter" && active) {
      event.preventDefault();
      choose(active);
    }
  };

  const count = flat.length;

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      className={className}
      disablePortal={disablePortal}
      disableEnforceFocus={disablePortal}
      disableScrollLock={disablePortal}
      scroll="paper"
      sx={[
        { "& .MuiDialog-container": { alignItems: "flex-start" } },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      slotProps={{
        paper: {
          "data-cn-command-palette": "",
          "aria-label": ariaLabel,
          sx: {
            mt: "min(12vh, 96px)",
            mx: "16px",
            width: "100%",
            maxWidth: 640,
            maxHeight: "min(70vh, 560px)",
            borderRadius: "var(--cn-radius-lg, 12px)",
            backgroundColor: "var(--cn-color-surface-elevated, #ffffff)",
            backgroundImage: "none",
            color: "var(--cn-color-text, #222831)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        } as object,
      }}
    >
      <Box
        sx={{
          flex: "none",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          px: "16px",
          height: 56,
          borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
        }}
      >
        <CnIcon
          name="search"
          size={20}
          sx={{ color: "var(--cn-color-text-muted, #6e7682)", flex: "none" }}
        />
        <InputBase
          autoFocus
          fullWidth
          value={query}
          placeholder={placeholder}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          inputProps={{
            role: "combobox",
            "aria-label": ariaLabel,
            "aria-expanded": true,
            "aria-controls": listId,
            "aria-autocomplete": "list",
            "aria-activedescendant": activeDomId,
            autoComplete: "off",
            spellCheck: false,
          }}
          sx={{
            minWidth: 0,
            fontSize: "var(--cn-font-size-lg, 16px)",
            color: "inherit",
            "& input::placeholder": { color: "var(--cn-color-text-muted, #6e7682)", opacity: 1 },
          }}
        />
        {loading && <CircularProgress size={18} aria-label="Buscando" />}
        <KbdKeys keys={["Esc"]} />
      </Box>

      <Box
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="Resultados"
        aria-busy={loading || undefined}
        sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: "8px" }}
      >
        {skeleton ? (
          <CnCommandPaletteSkeleton />
        ) : (
          groups.map((group) => {
            const headingId = `${uid}-g-${group.name}`;
            return (
              <Box
                key={group.name}
                role="group"
                aria-labelledby={headingId}
                sx={{ "& + &": { mt: "8px" } }}
              >
                <Box
                  id={headingId}
                  role="presentation"
                  sx={{
                    px: "10px",
                    py: "6px",
                    fontSize: "var(--cn-font-size-xs, 11px)",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: "var(--cn-color-text-muted, #6e7682)",
                  }}
                >
                  {group.name}
                </Box>
                {group.commands.map((command) => {
                  const isActive = active !== null && keyOf(command) === keyOf(active);
                  return (
                    <Box
                      key={keyOf(command)}
                      id={optionId(command, group.name)}
                      role="option"
                      aria-selected={isActive}
                      aria-disabled={command.disabled || undefined}
                      onMouseMove={() => !command.disabled && setActiveId(keyOf(command))}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(command)}
                      sx={{
                        minHeight: 44,
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        px: "10px",
                        py: "6px",
                        borderRadius: "var(--cn-radius-md, 8px)",
                        cursor: command.disabled ? "default" : "pointer",
                        opacity: command.disabled ? 0.45 : 1,
                        backgroundColor: isActive
                          ? "var(--cn-color-tone-primary-soft, var(--cn-color-active, rgba(0, 0, 0, 0.08)))"
                          : "transparent",
                      }}
                    >
                      {command.icon && (
                        <CnIcon
                          name={command.icon}
                          size={20}
                          sx={{
                            flex: "none",
                            color: isActive
                              ? "var(--cn-color-control-primary-fg, var(--cn-color-text, #222831))"
                              : "var(--cn-color-text-muted, #6e7682)",
                          }}
                        />
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            fontSize: "var(--cn-font-size-md, 14px)",
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {command.label}
                        </Box>
                        {command.description && (
                          <Box
                            sx={{
                              fontSize: "var(--cn-font-size-sm, 12px)",
                              color: "var(--cn-color-text-muted, #6e7682)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {command.description}
                          </Box>
                        )}
                      </Box>
                      {command.hotkey && <KbdKeys hotkey={command.hotkey} />}
                      {isActive && !command.hotkey && (
                        <CnIcon
                          name="subdirectory_arrow_left"
                          size={16}
                          sx={{ flex: "none", color: "var(--cn-color-text-muted, #6e7682)" }}
                        />
                      )}
                    </Box>
                  );
                })}
              </Box>
            );
          })
        )}
        {!skeleton && !loading && count === 0 && (
          <Box
            role="presentation"
            sx={{
              py: "32px",
              px: "16px",
              textAlign: "center",
              color: "var(--cn-color-text-muted, #6e7682)",
              fontSize: "14px",
              overflowWrap: "anywhere",
            }}
          >
            {emptyText}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          flex: "none",
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 16px",
          px: "16px",
          py: "8px",
          borderTop: "1px solid var(--cn-color-border, #dde0e4)",
          fontSize: "var(--cn-font-size-xs, 11px)",
          color: "var(--cn-color-text-muted, #6e7682)",
        }}
      >
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <KbdKeys keys={["↑", "↓"]} /> moverte
        </Box>
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <KbdKeys keys={["Intro"]} /> abrir
        </Box>
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <KbdKeys keys={["Esc"]} /> cerrar
        </Box>
        <Box component="span" aria-live="polite" sx={{ ml: "auto" }}>
          {skeleton ? "" : count === 1 ? "1 resultado" : `${count} resultados`}
        </Box>
      </Box>
    </Dialog>
  );
}
